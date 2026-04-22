import { describe, it } from 'vitest';
import { analyzeText, NLPConfig } from './arabic-nlp';

describe('Performance Benchmark', () => {
  it('should measure analyzeText performance', () => {
    const sampleText = `
العربية لغة سامية مركزيّة، تتبع لمجموعة اللغات الأفروآسيوية. وتعدّ من أكثر اللغات انتشاراً في العالم، حيث يتحدث بها أكثر من 422 مليون نسمة.
`.repeat(10000); // ~1.4M characters, ~160k tokens

    const config: NLPConfig = {
      minWordLength: 2,
      removeStopwords: true,
      stripPrefixes: false,
      ngramSize: 1,
      useStemming: true
    };

    console.log(`Analyzing text with ${sampleText.length} characters...`);

    // Warm up
    for (let i = 0; i < 3; i++) {
      analyzeText(sampleText, config);
    }

    const start = performance.now();
    const result = analyzeText(sampleText, config);
    const end = performance.now();

    console.log(`Analysis took ${end - start}ms`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Unique tokens: ${result.uniqueTokens}`);
  });
});
