import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, GitCompare, Download, Settings, Loader2 } from 'lucide-react';
import { NLPConfig, ComparisonResult } from '../lib/arabic-nlp';
import { readFileText } from '../lib/file-reader';

export default function Comparator() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [fileNameA, setFileNameA] = useState('');
  const [fileNameB, setFileNameB] = useState('');
  
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [config, setConfig] = useState<NLPConfig>({
    minWordLength: 3,
    removeStopwords: true,
    stripPrefixes: false,
    ngramSize: 1,
  });
  
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [topN, setTopN] = useState<number>(50);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTextA: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError('');
    if (isTextA) setFileNameA(file.name);
    else setFileNameB(file.name);
    
    try {
      const extractedText = await readFileText(file);
      if (isTextA) setTextA(extractedText);
      else setTextB(extractedText);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قراءة الملف');
    }
  };

  const handleCompare = () => {
    if (!textA.trim() || !textB.trim()) {
      setError('يرجى إدخال نصين للمقارنة. يمكنك رفع ملف أو كتابة النص يدوياً في كلا المربعين.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    
    const id = Date.now();
    workerRef.current.postMessage({ type: 'COMPARE', payload: { textA, textB, config }, id });
    
    workerRef.current.onmessage = (e) => {
      if (e.data.id === id) {
        if (e.data.error) {
          setError(e.data.error);
        } else {
          setResults(e.data.result);
        }
        setIsAnalyzing(false);
      }
    };
  };

  const handleExportCSV = () => {
    if (!results) return;
    
    const headers = ['الكلمة', 'تكرار أ', 'نسبة أ (%)', 'تكرار ب', 'نسبة ب (%)', 'الفرق (Δ)'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => `${r.word},${r.countA},${r.freqA},${r.countB},${r.freqB},${r.delta}`)
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `arabic_comparison_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayData = useMemo(() => {
    if (!results) return [];
    return topN === -1 ? results : results.slice(0, topN);
  }, [results, topN]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text A */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">النص الأول (أ)</label>
            <div className="relative">
              <input 
                type="file" 
                id="file-upload-a" 
                className="hidden" 
                accept=".txt,.md,.docx"
                onChange={(e) => handleFileUpload(e, true)}
              />
              <label 
                htmlFor="file-upload-a" 
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                رفع ملف
              </label>
            </div>
          </div>
          {fileNameA && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">الملف الحالي: {fileNameA}</p>}
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="اكتب أو الصق النص الأول هنا، أو قم برفع ملف..."
            className="w-full h-48 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            dir="rtl"
          />
        </div>

        {/* Text B */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">النص الثاني (ب)</label>
            <div className="relative">
              <input 
                type="file" 
                id="file-upload-b" 
                className="hidden" 
                accept=".txt,.md,.docx"
                onChange={(e) => handleFileUpload(e, false)}
              />
              <label 
                htmlFor="file-upload-b" 
                className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                رفع ملف
              </label>
            </div>
          </div>
          {fileNameB && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">الملف الحالي: {fileNameB}</p>}
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="اكتب أو الصق النص الثاني هنا، أو قم برفع ملف..."
            className="w-full h-48 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            dir="rtl"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">الحد الأدنى لطول الكلمة</label>
          <input 
            type="number" 
            min="1" 
            value={config.minWordLength}
            onChange={(e) => setConfig({...config, minWordLength: parseInt(e.target.value) || 1})}
            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
          />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">نوع التحليل (N-gram)</label>
          <select 
            value={config.ngramSize}
            onChange={(e) => setConfig({...config, ngramSize: parseInt(e.target.value)})}
            className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
          >
            <option value={1}>كلمات مفردة (Unigram)</option>
            <option value={2}>ثنائيات (Bigram)</option>
            <option value={3}>ثلاثيات (Trigram)</option>
          </select>
        </div>

        <div className="flex items-center gap-4 pb-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="comp-stopwords"
              checked={config.removeStopwords}
              onChange={(e) => setConfig({...config, removeStopwords: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="comp-stopwords" className="text-sm text-gray-700 dark:text-gray-300">إزالة كلمات التوقف</label>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="comp-prefixes"
              checked={config.stripPrefixes && !config.useStemming}
              disabled={config.useStemming}
              onChange={(e) => setConfig({...config, stripPrefixes: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="comp-prefixes" className={`text-sm ${config.useStemming ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
              إزالة السوابق {config.useStemming && <span className="text-xs">(مشمول في الجذر)</span>}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="comp-stemming"
              checked={config.useStemming || false}
              onChange={(e) => setConfig({...config, useStemming: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="comp-stemming" className="text-sm text-gray-700 dark:text-gray-300">تجميع بالجذر</label>
          </div>
        </div>

        <button 
          onClick={handleCompare}
          disabled={isAnalyzing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري المقارنة...
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5" />
              مقارنة النصوص
            </>
          )}
        </button>
      </div>

      {results && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in duration-500">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">نتائج المقارنة (مرتبة حسب أكبر فرق)</h3>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">عرض:</label>
                <select 
                  value={topN} 
                  onChange={(e) => setTopN(parseInt(e.target.value))}
                  className="p-1.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm"
                >
                  <option value={25}>أعلى 25</option>
                  <option value={50}>أعلى 50</option>
                  <option value={100}>أعلى 100</option>
                  <option value={-1}>الكل</option>
                </select>
              </div>
              
              <button 
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">الكلمة</th>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">تكرار (أ)</th>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">نسبة (أ)</th>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">تكرار (ب)</th>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">نسبة (ب)</th>
                  <th className="p-3 text-gray-600 dark:text-gray-300 font-medium">الفرق (Δ)</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{item.word}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{item.countA}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{item.freqA}%</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{item.countB}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{item.freqB}%</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                        item.delta > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 
                        item.delta < 0 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.delta > 0 ? '+' : ''}{item.delta}%
                      </span>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">لا توجد نتائج</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
