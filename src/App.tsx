import React, { useState, useEffect } from 'react';
import { FileText, GitCompare, BookOpen, Moon, Sun, TrendingUp, LayoutDashboard } from 'lucide-react';
import Analyzer from './components/Analyzer';
import Comparator from './components/Comparator';
import TimelineAnalyzer from './components/TimelineAnalyzer';
import AdvancedDashboard from './components/AdvancedDashboard';
import About from './components/About';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'compare' | 'timeline' | 'dashboard' | 'about'>('analyze');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200" dir="rtl">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">محلل تكرار الكلمات العربية</h1>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex space-x-4 space-x-reverse border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`pb-4 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'analyze'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            تحليل نص واحد
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`pb-4 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'compare'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            مقارنة نصوص
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-4 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            تحليل عبر الزمن
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-4 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            لوحة تحكم متقدمة
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-4 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            عن المشروع
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'analyze' && <Analyzer />}
          {activeTab === 'compare' && <Comparator />}
          {activeTab === 'timeline' && <TimelineAnalyzer />}
          {activeTab === 'dashboard' && <AdvancedDashboard />}
          {activeTab === 'about' && <About />}
        </div>
      </main>
    </div>
  );
}
