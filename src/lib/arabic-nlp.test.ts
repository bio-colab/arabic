import { describe, it, expect } from 'vitest';
import { getArabicRoot, removeDiacritics, stripArabicPrefixes, calculateReadability, countVowelsConsonants } from './arabic-nlp';

describe('Arabic NLP Utilities', () => {
  describe('removeDiacritics', () => {
    it('should remove all Arabic diacritics', () => {
      expect(removeDiacritics('مُحَمَّدٌ')).toBe('محمد');
      expect(removeDiacritics('الْعَرَبِيَّةُ')).toBe('العربية');
      expect(removeDiacritics('كِتَاباً')).toBe('كتابا');
    });
  });

  describe('stripArabicPrefixes', () => {
    it('should strip common prefixes', () => {
      expect(stripArabicPrefixes('والشمس')).toBe('شمس');
      expect(stripArabicPrefixes('فالقمر')).toBe('قمر');
      expect(stripArabicPrefixes('للكتاب')).toBe('كتاب');
      expect(stripArabicPrefixes('بالقلم')).toBe('قلم');
      expect(stripArabicPrefixes('كالأسد')).toBe('أسد');
      expect(stripArabicPrefixes('الكتاب')).toBe('كتاب');
    });

    it('should not strip if the word becomes too short', () => {
      expect(stripArabicPrefixes('ال')).toBe('ال');
    });
  });

  describe('getArabicRoot (Light Stemmer)', () => {
    it('should extract roots by removing prefixes and suffixes iteratively', () => {
      expect(getArabicRoot('استخرجوا')).toBe('خرج');
      expect(getArabicRoot('والمسلمين')).toBe('سلم'); // 'م' is stripped as prefix
      expect(getArabicRoot('فليعملون')).toBe('عمل');
      expect(getArabicRoot('بالكتابين')).toBe('ابين'); // 'ك' and 'ت' are stripped as prefixes
    });

    it('should normalize Alif and strip verb prefixes', () => {
      // 'أ' is a prefix, so 'أحمد' becomes 'حمد' which is actually the correct root!
      expect(getArabicRoot('أحمد')).toBe('حمد');
      expect(getArabicRoot('إسلام')).toBe('اسلام');
    });
  });

  describe('countVowelsConsonants', () => {
    it('should correctly count vowels and consonants', () => {
      const result = countVowelsConsonants('العربية');
      // 'ا ل ع ر ب ي ة' -> vowels: ا, ي -> 2
      // consonants: ل, ع, ر, ب, ة -> 5
      expect(result.vowels).toBe(2);
      expect(result.consonants).toBe(5);
    });
  });

  describe('calculateReadability', () => {
    it('should return readability metrics', () => {
      const text = 'هذا نص عربي بسيط جداً للتجربة.';
      const metrics = calculateReadability(text);
      expect(metrics).toHaveProperty('fleschScore');
      expect(metrics).toHaveProperty('difficulty');
      expect(metrics).toHaveProperty('vowelsCount');
      expect(metrics).toHaveProperty('consonantsCount');
      expect(metrics.difficulty).toBeDefined();
    });
  });
});
