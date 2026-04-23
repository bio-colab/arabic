import { describe, it } from 'vitest';
import { analyzeText, NLPConfig } from './arabic-nlp';

describe('Performance Benchmark', () => {
  it('should measure analyzeText performance', () => {
    const corpus = `
العربية لغة سامية مركزيّة، وتُصنّف ضمن اللغات الإفريقية الآسيوية. وهي واحدة من أكثر اللغات انتشارًا في العالم، حيث يتحدث بها أكثر من 422 مليون نسمة.
`.repeat(5000); // ~110,000 words

    const config: NLPConfig = {
      minWordLength: 2,
      removeStopwords: true,
      stripPrefixes: false,
      ngramSize: 1,
      useStemming: true
    };

    console.log("Starting benchmark with ~110,000 words...");
    const start = performance.now();
    const result = analyzeText(corpus, config);
    const end = performance.now();

    console.log(`Execution time: ${(end - start).toFixed(2)}ms`);
    console.log(`Total words: ${result.wordCount}`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Unique tokens: ${result.uniqueTokens}`);
  });
});
