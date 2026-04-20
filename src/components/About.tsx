import React from 'react';
import { BookOpen, Code, FileText, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          عن المشروع
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg">
          محلل تكرار الكلمات في النصوص العربية (Arabic Text Frequency Analyzer) هو تطبيق ويب متقدم يعمل بالكامل من جهة العميل (Client-Side) داخل المتصفح. تم تصميمه للباحثين، اللغويين، والطلاب لتحليل النصوص العربية واستخراج الإحصائيات اللغوية بدقة وسرعة دون الحاجة لرفع البيانات إلى خوادم خارجية، مما يضمن الخصوصية التامة.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-500" />
              التقنيات المستخدمة
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> React.js & TypeScript</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Tailwind CSS للتصميم المتجاوب</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Web Workers للمعالجة الثقيلة دون تجميد الواجهة</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Recharts للرسوم البيانية</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Mammoth.js لقراءة ملفات Word (.docx)</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              الميزات الأساسية
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> إزالة التشكيل وعلامات الترقيم بذكاء</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> فلترة أكثر من 150 كلمة توقف (Stopwords) عربية</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> إزالة السوابق الشائعة (ال، و، ب، ف، ك، ل)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> تحليل N-grams (كلمات مفردة، ثنائيات، ثلاثيات)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> مقارنة نصين واستخراج الفروقات (Delta)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
