import { analyzeText, analyzeTextAsync, compareTexts, analyzeAdvancedCorpus } from './arabic-nlp';

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;
  
  try {
    if (type === 'ANALYZE') {
      const result = await analyzeTextAsync(payload.text, payload.config, (progress) => {
        self.postMessage({ id, progress });
      });
      self.postMessage({ id, result });
    } else if (type === 'COMPARE') {
      const result = compareTexts(payload.textA, payload.textB, payload.config);
      self.postMessage({ id, result });
    } else if (type === 'TIMELINE') {
      const results = payload.texts.map((text: string) => analyzeText(text, payload.config));
      self.postMessage({ id, result: results });
    } else if (type === 'ADVANCED_DASHBOARD') {
      const result = analyzeAdvancedCorpus(payload.docs, payload.config);
      self.postMessage({ id, result });
    }
  } catch (error: any) {
    self.postMessage({ id, error: error.message || 'حدث خطأ غير معروف' });
  }
};
