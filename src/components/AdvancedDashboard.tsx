import React, { useState, useEffect, useRef } from 'react';
import { Upload, BarChart2, Trash2, Loader2, Settings, FileText, Activity, Hash, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { NLPConfig, AdvancedStats } from '../lib/arabic-nlp';
import { readFileText } from '../lib/file-reader';

interface DashboardDoc {
  id: string;
  name: string;
  text: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AdvancedDashboard() {
  const [docs, setDocs] = useState<DashboardDoc[]>([]);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [config, setConfig] = useState<NLPConfig>({
    minWordLength: 3,
    removeStopwords: true,
    stripPrefixes: true,
    useStemming: true,
    ngramSize: 1,
  });
  
  const [results, setResults] = useState<AdvancedStats[] | null>(null);

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
      const newDocs: DashboardDoc[] = [];
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
    
    e.target.value = '';
  };

  const removeDoc = (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
    setResults(null);
  };

  const handleAnalyze = () => {
    if (docs.length === 0) {
      setError('يرجى رفع ملف واحد على الأقل للتحليل');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    
    const id = Date.now();
    workerRef.current.postMessage({ type: 'ADVANCED_DASHBOARD', payload: { docs, config }, id });
    
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

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const { exportElementToPDF } = await import('../lib/pdf-export');
      await exportElementToPDF('advanced-dashboard-report', `تقرير_المجموعة_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF", err);
      alert("حدث خطأ أثناء تصدير التقرير");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('ar-EG').format(num);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">المدونة النصية (Corpus)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">قم برفع النصوص التي تود مقارنتها وتحليلها</p>
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  id="dash-upload" 
                  className="hidden" 
                  accept=".txt,.md,.docx"
                  multiple
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="dash-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  إضافة نصوص
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {docs.length === 0 ? (
                <div className="w-full text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">لم يتم رفع أي نصوص بعد</p>
                </div>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-600">
                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-200 max-w-[150px] truncate">{doc.name}</span>
                    <button 
                      onClick={() => removeDoc(doc.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors mr-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
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
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="dash-stopwords"
                  checked={config.removeStopwords}
                  onChange={(e) => setConfig({...config, removeStopwords: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="dash-stopwords" className="text-sm text-gray-700 dark:text-gray-300">إزالة كلمات التوقف</label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="dash-prefixes"
                  checked={config.stripPrefixes && !config.useStemming}
                  disabled={config.useStemming}
                  onChange={(e) => setConfig({...config, stripPrefixes: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                />
                <label htmlFor="dash-prefixes" className={`text-sm ${config.useStemming ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  إزالة السوابق {config.useStemming && <span className="text-xs">(مشمول في الجذر)</span>}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="dash-stemming"
                  checked={config.useStemming || false}
                  onChange={(e) => setConfig({...config, useStemming: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="dash-stemming" className="text-sm text-gray-700 dark:text-gray-300">تجميع بالجذر (Stemming)</label>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || docs.length === 0}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <BarChart2 className="w-5 h-5" />
                  توليد لوحة التحكم
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Results */}
      {results && (
        <div id="advanced-dashboard-report" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">نتائج لوحة التحكم</h2>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              تصدير PDF
            </button>
          </div>

          {/* Section 1: Quantitative Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">إجمالي الكلمات النصية</h4>
              </div>
              <div className="mt-4 h-32 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={results} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '8px' }} />
                    <Bar dataKey="wordCount" name="الكلمات النصية" radius={[4, 4, 0, 0]}>
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">التنوع اللفظي (Lexical Diversity)</h4>
              </div>
              <div className="mt-4 h-32 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={results} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '8px' }} formatter={(val: any) => `${Number(val).toFixed(1)}%`} />
                    <Bar dataKey="lexicalDiversity" radius={[4, 4, 0, 0]}>
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">متوسط طول الجملة (كلمات)</h4>
              </div>
              <div className="mt-4 h-32 min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={results} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip contentStyle={{ direction: 'rtl', borderRadius: '8px' }} formatter={(val: any) => Number(val).toFixed(1)} />
                    <Bar dataKey="avgSentenceLength" radius={[4, 4, 0, 0]}>
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 2: Stylistic Metrics (POS Estimation) */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">البُعد الأسلوبي (تقدير أقسام الكلام)</h3>
            <div className="h-72 min-w-0 min-h-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="pos.nouns" name="أسماء (تقدير)" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="pos.verbs" name="أفعال (تقدير)" stackId="a" fill="#10b981" />
                  <Bar dataKey="pos.particles" name="حروف/أدوات" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              * ملاحظة: يتم تقدير أقسام الكلام بناءً على السوابق واللواحق (Heuristics) وهو تقريبي وليس بديلاً عن المحلل النحوي الكامل.
            </p>
          </div>

          {/* Section 3: Thematic Metrics (TF-IDF Keywords) */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">البُعد الموضوعي (الكلمات المفتاحية المميزة - TF-IDF)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((doc, idx) => (
                <div key={doc.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <h4 className="font-medium text-gray-800 dark:text-white truncate" title={doc.name}>{doc.name}</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {doc.keywords.map((kw, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ 
                          backgroundColor: `${COLORS[idx % COLORS.length]}20`,
                          color: COLORS[idx % COLORS.length],
                          border: `1px solid ${COLORS[idx % COLORS.length]}40`
                        }}
                        title={`Score: ${kw.score.toFixed(4)}`}
                      >
                        {kw.word}
                      </span>
                    ))}
                    {doc.keywords.length === 0 && (
                      <span className="text-sm text-gray-500">لا توجد كلمات مميزة</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
