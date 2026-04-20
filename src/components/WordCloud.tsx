import React from 'react';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: Word[];
}

export default function WordCloud({ words }: WordCloudProps) {
  if (!words || words.length === 0) {
    return <div className="text-gray-400 dark:text-gray-500 flex items-center justify-center h-full">لا توجد بيانات كافية</div>;
  }

  const min = Math.min(...words.map(w => w.value));
  const max = Math.max(...words.map(w => w.value));
  
  const getFontSize = (value: number) => {
    const minSize = 14;
    const maxSize = 48;
    if (max === min) return (minSize + maxSize) / 2;
    return minSize + ((value - min) / (max - min)) * (maxSize - minSize);
  };

  const colors = [
    'text-blue-600 dark:text-blue-400', 
    'text-indigo-600 dark:text-indigo-400', 
    'text-purple-600 dark:text-purple-400', 
    'text-teal-600 dark:text-teal-400', 
    'text-cyan-600 dark:text-cyan-400', 
    'text-sky-600 dark:text-sky-400',
    'text-blue-800 dark:text-blue-300', 
    'text-indigo-800 dark:text-indigo-300', 
    'text-purple-800 dark:text-purple-300'
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4 h-full overflow-y-auto content-center">
      {words.map((word, i) => (
        <span
          key={i}
          className={`${colors[i % colors.length]} font-medium transition-transform hover:scale-110 cursor-default`}
          style={{ fontSize: `${getFontSize(word.value)}px` }}
          title={`${word.text}: ${word.value}`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}
