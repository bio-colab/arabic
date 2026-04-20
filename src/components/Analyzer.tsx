import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, BarChart2, FileText, Download, Settings, ChevronRight, ChevronLeft, Loader2, Search, Image as ImageIcon, FileJson } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WordCloud from './WordCloud';
import { NLPConfig, WordFrequency, ReadabilityMetrics, extractSentences } from '../lib/arabic-nlp';
import { readFileText } from '../lib/file-reader';

const SAMPLE_TEXT = `تعتبر اللغة العربية من أقدم اللغات الحية وأكثرها انتشاراً في العالم. يتحدث بها أكثر من 400 مليون نسمة كلغة أم، وهي لغة رسمية في 22 دولة. تتميز العربية بثرائها المعجمي وتنوعها الصرفي، حيث تعتمد على نظام الجذور والأوزان الذي يتيح اشتقاق آلاف الكلمات من جذر واحد. إن دراسة تكرار الكلمات في النصوص العربية يساعد الباحثين على فهم الأنماط الأسلوبية، وتحليل المحتوى، وبناء نماذج الذكاء الاصطناعي ومعالجة اللغات الطبيعية (NLP).`;

export default function Analyzer() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWordForSentences, setSelectedWordForSentences] = useState<string | null>(null);
  const [wordSentences, setWordSentences] = useState<string[]>([]);
  
  const [history, setHistory] = useState<{ id: string, date: string, fileName: string, text: string }[]>(() => {
    const saved = localStorage.getItem('analyzer_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('analyzer_history', JSON.stringify(history.slice(0, 10))); // Keep last 10
  }, [history]);

  const [config, setConfig] = useState<NLPConfig>(() => {
    const saved = localStorage.getItem('analyzer_config');
    return saved ? JSON.parse(saved) : {
      minWordLength: 3,
      removeStopwords: true,
      stripPrefixes: false,
      useStemming: false,
      ngramSize: 1,
    };
  });

  useEffect(() => {
    localStorage.setItem('analyzer_config', JSON.stringify(config));
  }, [config]);
  
  const [topN, setTopN] = useState<number>(25);
  const [sortConfig, setSortConfig] = useState<{ key: keyof WordFrequency, direction: 'asc' | 'desc' }>({ key: 'count', direction: 'desc' });
  const [chartPage, setChartPage] = useState(0);
  
  const [results, setResults] = useState<{ data: WordFrequency[], totalTokens: number, uniqueTokens: number, readability?: ReadabilityMetrics, wordCount: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError('');
    setFileName(file.name);
    try {
      const extractedText = await readFileText(file);
      setText(extractedText);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قراءة الملف');
    }
  };

  const loadSampleText = () => {
    setText(SAMPLE_TEXT);
    setFileName('نص_تجريبي.txt');
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      setError('يرجى إدخال نص أو رفع ملف للتحليل');
      return;
    }
    
    setIsAnalyzing(true);
    setProgress(0);
    setError('');
    setChartPage(0);
    
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    
    const id = Date.now();
    workerRef.current.postMessage({ type: 'ANALYZE', payload: { text, config }, id });
    
    workerRef.current.onmessage = (e) => {
      if (e.data.id === id) {
        if (e.data.error) {
          setError(e.data.error);
          setIsAnalyzing(false);
        } else if (e.data.progress !== undefined) {
          setProgress(e.data.progress);
        } else if (e.data.result) {
          setResults({
            data: e.data.result.results,
            totalTokens: e.data.result.totalTokens,
            uniqueTokens: e.data.result.uniqueTokens,
            readability: e.data.result.readability,
            wordCount: e.data.result.wordCount
          });
          
          // Save to history
          setHistory(prev => {
            const newHistory = [{
              id: id.toString(),
              date: new Date().toLocaleString('ar-EG'),
              fileName: fileName || 'نص يدوي',
              text: text
            }, ...prev];
            // Remove duplicates based on text content
            const uniqueHistory = newHistory.filter((v, i, a) => a.findIndex(t => (t.text === v.text)) === i);
            return uniqueHistory.slice(0, 10);
          });
          setIsAnalyzing(false);
        }
      }
    };
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportCSV = () => {
    if (!results) return;
    
    const headers = ['الكلمة', 'التكرار', 'النسبة المئوية (%)'];
    const csvContent = [
      headers.join(','),
      ...results.data.map(r => `${r.word},${r.count},${r.percentage}`)
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `arabic_freq_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!results) return;
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `arabic_freq_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportChart = async () => {
    if (!chartRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(chartRef.current, { backgroundColor: 'transparent' });
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chart_${Date.now()}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting chart", err);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const { exportElementToPDF } = await import('../lib/pdf-export');
      await exportElementToPDF('analyzer-report', `تقرير_التحليل_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF", err);
      alert("حدث خطأ أثناء تصدير التقرير");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleWordClick = (word: string) => {
    const sentences = extractSentences(text, word, config);
    setSelectedWordForSentences(word);
    setWordSentences(sentences);
  };

  const displayData = useMemo(() => {
    if (!results) return [];
    let data = [...results.data];
    
    if (searchQuery.trim()) {
      data = data.filter(r => r.word.includes(searchQuery.trim()));
    }
    
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return topN === -1 ? data : data.slice(0, topN);
  }, [results, topN, sortConfig, searchQuery]);

  const wordCloudData = useMemo(() => {
    if (!results) return [];
    return results.data.slice(0, 100).map(r => ({ text: r.word, value: r.count }));
  }, [results]);

  const handleSort = (key: keyof WordFrequency) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const chartItemsPerPage = 15;
  const chartData = displayData.slice(chartPage * chartItemsPerPage, (chartPage + 1) * chartItemsPerPage);
  const totalChartPages = Math.ceil(displayData.length / chartItemsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">النص المراد تحليله</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadSampleText}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  نص تجريبي
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept=".txt,.md,.docx,.pdf"
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    رفع ملف
                  </label>
                </div>
              </div>
            </div>
            {fileName && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">الملف الحالي: {fileName}</p>}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب أو الصق النص هنا..."
              className="w-full h-64 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              dir="rtl"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            {history.length > 0 && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التحليلات السابقة</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setText(item.text);
                        setFileName(item.fileName);
                      }}
                      className="flex-shrink-0 text-right p-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-40"
                    >
                      <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.fileName}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">{item.date}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              إعدادات التحليل
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">الحد الأدنى لطول الكلمة</label>
                <input 
                  type="number" 
                  min="1" 
                  value={config.minWordLength}
                  onChange={(e) => setConfig({...config, minWordLength: parseInt(e.target.value) || 1})}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">نوع التحليل (N-gram)</label>
                <select 
                  value={config.ngramSize}
                  onChange={(e) => setConfig({...config, ngramSize: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                >
                  <option value={1}>كلمات مفردة (Unigram)</option>
                  <option value={2}>ثنائيات (Bigram)</option>
                  <option value={3}>ثلاثيات (Trigram)</option>
                  <option value={4}>رباعيات (4-gram)</option>
                  <option value={5}>خماسيات (5-gram)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="stopwords"
                  checked={config.removeStopwords}
                  onChange={(e) => setConfig({...config, removeStopwords: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="stopwords" className="text-sm text-gray-700 dark:text-gray-300">إزالة كلمات التوقف (Stopwords)</label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="prefixes"
                  checked={config.stripPrefixes && !config.useStemming}
                  disabled={config.useStemming}
                  onChange={(e) => setConfig({...config, stripPrefixes: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor="prefixes" className={`text-sm ${config.useStemming ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  إزالة السوابق (ال، و، ب، ف، ك، ل) {config.useStemming && <span className="text-xs">(مشمول في الجذر)</span>}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="use-stemming"
                  checked={config.useStemming || false}
                  onChange={(e) => setConfig({...config, useStemming: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="use-stemming" className="text-sm text-gray-700 dark:text-gray-300">تجميع الكلمات حسب الجذر (Stemming)</label>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2 relative overflow-hidden"
            >
              {isAnalyzing && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/30 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              )}
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">جاري التحليل... {progress}%</span>
                </>
              ) : (
                <>
                  <BarChart2 className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">تحليل النص</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div id="analyzer-report" className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">نتائج التحليل</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                تصدير PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400" title="العدد الفعلي للكلمات في النص قبل أي تصفية (دقة مقاربة لـ Google Docs)">إجمالي الكلمات النصية</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.wordCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400" title="عدد الكلمات (أو المقاطع) الخاضعة للتحليل النهائي بعد تطبيق التصفية">الكلمات المحللة</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.totalTokens.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">الكلمات الفريدة</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{results.uniqueTokens.toLocaleString()}</p>
              </div>
            </div>
            
            {results.readability && (
              <>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">مؤشر الصعوبة</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{results.readability.difficulty}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">حروف الجوف / الصوامت</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{results.readability.vowelsCount} / {results.readability.consonantsCount}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">أكثر الكلمات تكراراً</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportChart}
                    className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 bg-gray-100 hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                    title="تصدير كصورة PNG"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  {totalChartPages > 1 && (
                    <div className="flex items-center gap-1 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
                      <button 
                        onClick={() => setChartPage(p => Math.max(0, p - 1))}
                        disabled={chartPage === 0}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-gray-500 dark:text-gray-400 px-2 text-xs">{chartPage + 1} / {totalChartPages}</span>
                      <button 
                        onClick={() => setChartPage(p => Math.min(totalChartPages - 1, p + 1))}
                        disabled={chartPage === totalChartPages - 1}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-[300px] w-full min-w-0 min-h-0" dir="ltr" ref={chartRef}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="word" type="category" width={80} tick={{ fontSize: 14, fontFamily: 'sans-serif', fill: '#6b7280' }} />
                    <Tooltip cursor={{fill: 'rgba(156, 163, 175, 0.1)'}} contentStyle={{textAlign: 'right', direction: 'rtl', backgroundColor: '#fff', color: '#1f2937', borderRadius: '8px'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">سحابة الكلمات</h3>
              <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                <WordCloud words={wordCloudData} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">جدول التكرار</h3>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                  <input 
                    type="text"
                    placeholder="بحث في النتائج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-48 pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">عرض:</label>
                  <select 
                    value={topN} 
                    onChange={(e) => { setTopN(parseInt(e.target.value)); setChartPage(0); }}
                    className="p-1.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm"
                  >
                    <option value={10}>أعلى 10</option>
                    <option value={25}>أعلى 25</option>
                    <option value={50}>أعلى 50</option>
                    <option value={100}>أعلى 100</option>
                    <option value={-1}>الكل</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3 text-gray-600 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('word')}>
                      الكلمة {sortConfig.key === 'word' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-gray-600 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('count')}>
                      التكرار {sortConfig.key === 'count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-gray-600 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('percentage')}>
                      النسبة (%) {sortConfig.key === 'percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                        <button 
                          onClick={() => handleWordClick(item.word)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted underline-offset-4 transition-colors text-right"
                        >
                          {item.word}
                        </button>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{item.count}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{item.percentage}%</td>
                    </tr>
                  ))}
                  {displayData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-gray-400">لا توجد نتائج</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedWordForSentences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                الجمل التي تحتوي على: <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{selectedWordForSentences}</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-2">({wordSentences.length} جملة)</span>
              </h3>
              <button 
                onClick={() => setSelectedWordForSentences(null)} 
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {wordSentences.length > 0 ? (
                wordSentences.map((sentence, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 leading-relaxed text-justify shadow-sm">
                    {sentence}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على جمل مطابقة بشكل دقيق.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">قد يكون ذلك بسبب إعدادات التجذير (Stemming) أو إزالة السوابق.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
