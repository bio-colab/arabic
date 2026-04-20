import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, TrendingUp, Trash2, ArrowUp, ArrowDown, Plus, X, Loader2, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NLPConfig, WordFrequency } from '../lib/arabic-nlp';
import { readFileText } from '../lib/file-reader';

interface TimelineDoc {
  id: string;
  name: string;
  text: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function TimelineAnalyzer() {
  const [docs, setDocs] = useState<TimelineDoc[]>([]);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [config, setConfig] = useState<NLPConfig>({
    minWordLength: 3,
    removeStopwords: true,
    stripPrefixes: true,
    ngramSize: 1,
  });
  
  const [results, setResults] = useState<{ data: WordFrequency[], totalTokens: number, uniqueTokens: number }[] | null>(null);
  const [trackedWords, setTrackedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [usePercentage, setUsePercentage] = useState(true);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setError('');
    
    try {
      const newDocs: TimelineDoc[] = [];
      for (const file of files) {
        const text = await readFileText(file);
        newDocs.push({
          id: Math.random().toString(36).substring(7),
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          text
        });
      }
      setDocs(prev => [...prev, ...newDocs]);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء قراءة الملفات');
    }
    
    // Reset file input
    e.target.value = '';
  };

  const removeDoc = (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
    setResults(null);
  };

  const moveDoc = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === docs.length - 1)) return;
    
    const newDocs = [...docs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newDocs[index], newDocs[swapIndex]] = [newDocs[swapIndex], newDocs[index]];
    setDocs(newDocs);
    setResults(null);
  };

  const handleAnalyze = () => {
    if (docs.length < 2) {
      setError('يرجى رفع ملفين على الأقل لرسم خط زمني');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    
    const id = Date.now();
    const texts = docs.map(d => d.text);
    workerRef.current.postMessage({ type: 'TIMELINE', payload: { texts, config }, id });
    
    workerRef.current.onmessage = (e) => {
      if (e.data.id === id) {
        if (e.data.error) {
          setError(e.data.error);
        } else {
          const res = e.data.result;
          setResults(res);
          
          // Auto-populate tracked words if empty
          if (trackedWords.length === 0) {
            const combinedFreq = new Map<string, number>();
            res.forEach((r: any) => {
              r.results.forEach((wf: WordFrequency) => {
                combinedFreq.set(wf.word, (combinedFreq.get(wf.word) || 0) + wf.count);
              });
            });
            
            const topWords = Array.from(combinedFreq.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(entry => entry[0]);
              
            setTrackedWords(topWords);
          }
        }
        setIsAnalyzing(false);
      }
    };
  };

  const addTrackedWord = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim();
    if (word && !trackedWords.includes(word)) {
      setTrackedWords([...trackedWords, word]);
    }
    setNewWord('');
  };

  const removeTrackedWord = (word: string) => {
    setTrackedWords(trackedWords.filter(w => w !== word));
  };

  const chartData = useMemo(() => {
    if (!results || docs.length !== results.length) return [];
    
    return docs.map((doc, i) => {
      const dataPoint: any = { name: doc.name };
      const docResults = results[i].data;
      const docMap = new Map(docResults.map((r: WordFrequency) => [r.word, usePercentage ? r.percentage : r.count]));
      
      trackedWords.forEach(w => {
        dataPoint[w] = docMap.get(w) || 0;
      });
      
      return dataPoint;
    });
  }, [results, docs, trackedWords, usePercentage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">الفصول / النصوص</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">قم برفع وترتيب النصوص حسب التسلسل الزمني</p>
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  id="timeline-upload" 
                  className="hidden" 
                  accept=".txt,.md,.docx"
                  multiple
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="timeline-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  رفع ملفات
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {docs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">لم يتم رفع أي ملفات بعد</p>
                </div>
              ) : (
                docs.map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px] sm:max-w-[400px]">
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveDoc(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveDoc(index, 'down')}
                        disabled={index === docs.length - 1}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button 
                        onClick={() => removeDoc(doc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
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
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="tl-stopwords"
                  checked={config.removeStopwords}
                  onChange={(e) => setConfig({...config, removeStopwords: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="tl-stopwords" className="text-sm text-gray-700 dark:text-gray-300">إزالة كلمات التوقف</label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="tl-prefixes"
                  checked={config.stripPrefixes && !config.useStemming}
                  disabled={config.useStemming}
                  onChange={(e) => setConfig({...config, stripPrefixes: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor="tl-prefixes" className={`text-sm ${config.useStemming ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  إزالة السوابق {config.useStemming && <span className="text-xs">(مشمول في الجذر)</span>}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="tl-stemming"
                  checked={config.useStemming || false}
                  onChange={(e) => setConfig({...config, useStemming: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="tl-stemming" className="text-sm text-gray-700 dark:text-gray-300">تجميع بالجذر</label>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || docs.length < 2}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  رسم الخط الزمني
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in duration-500">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">تطور استخدام الكلمات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">تتبع الكلمات عبر الفصول المختلفة</p>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setUsePercentage(false)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${!usePercentage ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  العدد
                </button>
                <button
                  onClick={() => setUsePercentage(true)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${usePercentage ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  النسبة المئوية
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الكلمات المتتبعة:</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {trackedWords.map((word, idx) => (
                <span 
                  key={word} 
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                >
                  {word}
                  <button onClick={() => removeTrackedWord(word)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {trackedWords.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 py-1">لا توجد كلمات متتبعة</span>
              )}
            </div>
            
            <form onSubmit={addTrackedWord} className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="أضف كلمة للتتبع..."
                className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                type="submit"
                disabled={!newWord.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="h-[400px] w-full min-w-0 min-h-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  label={{ value: usePercentage ? 'النسبة (%)' : 'التكرار', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ textAlign: 'right', direction: 'rtl', backgroundColor: '#fff', color: '#1f2937', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                  formatter={(value: any) => [usePercentage ? `${Number(value).toFixed(2)}%` : value, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {trackedWords.map((word, idx) => (
                  <Line 
                    key={word}
                    type="monotone" 
                    dataKey={word} 
                    name={word}
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
