export const ARABIC_STOPWORDS = new Set([
  "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
  "أن", "إن", "كان", "كانت", "هو", "هي", "تم", "ذلك", "أو", "لا",
  "ما", "لم", "لن", "كل", "وقد", "فإن", "ثم", "بعد", "قبل", "حتى",
  "بين", "كما", "أنه", "أي", "إذا", "إلا", "إنما", "أيضا", "حيث",
  "حين", "دون", "ضد", "عند", "غير", "فقط", "قد", "قط", "كأن",
  "كذلك", "لأن", "لعل", "لكن", "ليس", "مما", "منذ", "نحو", "نعم",
  "هناك", "هنا", "وإن", "ولا", "وما", "وهو", "وهي", "يا", "أبو",
  "أب", "أخ", "أخو", "أكثر", "أول", "أولئك", "أين", "بها", "به",
  "تلك", "جميع", "حال", "حول", "ذات", "ذو", "رغم", "سوى", "شبه",
  "طالما", "طوال", "ظل", "عبر", "عدة", "عشر", "عليهم", "عليه",
  "عنها", "عنه", "عندما", "عين", "فلا", "فيما", "فيه", "فيها",
  "كلا", "كلما", "كليهما", "لذا", "لذلك", "لكل", "لكم", "لنا",
  "له", "لها", "لهم", "لو", "مادام", "متى", "معظم", "معه", "معها",
  "نحن", "نفس", "هؤلاء", "هاتان", "هاتين", "هذان", "هذين", "هل",
  "هم", "هما", "هن", "أنا", "أنت", "أنتم", "أنتما", "أنتن", "إياك",
  "إياكم", "إياكما", "إياكن", "إياه", "إياها", "إياهم", "إياهما",
  "إياهن", "إياي", "إيانا", "بكم", "بكما", "بكن", "بنا", "بهم",
  "بهما", "بهن", "تجاه", "تلقاء", "حاشا", "خلا", "دونما", "ريثما",
  "سرعان", "شتان", "عسى", "عوض", "قلما", "كثيرا", "كليكما",
  "كلتيكما", "كلتيهما", "كي", "كيف", "كيفما", "لئلا", "ليت",
  "مابين", "ماتزال", "مادامت", "مازال", "مازالت", "مافتئ", "مافتئت",
  "مابرح", "مابرحت", "مانفك", "مانفكت", "مذ", "مهما", "هب", "هلم",
  "هيا", "واها", "وي", "أجل", "بلى", "جلل", "جير", "إي", "إذن",
  "بئس", "نعم", "حبذا", "ساء", "عليك", "إليك", "دونك", "رويدك",
  "وراءك", "أمامك", "مكانك", "مكانكم", "مكانكما", "مكانكن", "إليكم",
  "إليكما", "إليكن", "عليكم", "عليكما", "عليكن", "دونكم", "دونكما",
  "دونكن", "وراءكم", "وراءكما", "وراءكن", "أمامكم", "أمامكما", "أمامكن",
  "قال", "يقول", "كانوا", "يكون", "تمت", "الذين", "اللذين", "اللتين",
  "اللذان", "اللتان", "اللاتي", "اللواتي", "الذي", "التي", "بما", "فما",
  "كما", "لما", "إنما", "بينما", "حيثما", "كيفما", "عندما", "ريثما",
  "طالما", "كلما", "أينما", "إلا", "ألا", "هلا", "لولا", "لوما", "كلا"
]);

export interface NLPConfig {
  minWordLength: number;
  removeStopwords: boolean;
  stripPrefixes: boolean;
  ngramSize: number;
  useStemming?: boolean;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface ReadabilityMetrics {
  fleschScore: number;
  difficulty: string;
  vowelsCount: number;
  consonantsCount: number;
}

export function removeDiacritics(text: string): string {
  // Removes Arabic tashkeel (fatha, kasra, damma, tanwin, shadda, sukun, etc.)
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

export function extractWords(text: string): string[] {
  // المحرك الأساسي لعد الكلمات: يطابق أي سلسلة من الأحرف (العربية والإنجليزية)، الحركات، والأرقام
  // يتجاهل كافة علامات الترقيم والمسافات بدقة تشابه مستوى Google Docs
  const words = text.match(/[\p{L}\p{M}\p{N}]+/gu);
  return words || [];
}

export function countWords(text: string): number {
  return extractWords(text).length;
}

export function countVowelsConsonants(text: string): { vowels: number, consonants: number } {
  const cleanText = removeDiacritics(text).replace(/[^\u0600-\u06FF]/g, '');
  // Arabic vowels (حروف الجوف/العلة): Alif, Waw, Yaa
  const vowelsRegex = /[اأإآوىي]/g;
  const vowelsMatch = cleanText.match(vowelsRegex);
  const vowelsCount = vowelsMatch ? vowelsMatch.length : 0;
  const consonantsCount = cleanText.length - vowelsCount;
  
  return { vowels: vowelsCount, consonants: consonantsCount };
}

export function calculateReadability(text: string): ReadabilityMetrics {
  const cleanText = removeDiacritics(text);
  const sentences = cleanText.split(/[.!?؟\n]+/).filter(s => s.trim().length > 0);
  
  // Use the highly accurate word counter engine
  const words = extractWords(cleanText);
  
  const numSentences = sentences.length || 1;
  const numWords = words.length || 1;
  const numChars = cleanText.replace(/\s+/g, '').length;
  
  // Adapted Flesch Reading Ease for Arabic (OSMAN-like heuristic)
  // Standard Flesch: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  // Since Arabic syllables are hard to count without diacritics, we use characters per word as a proxy.
  const avgWordsPerSentence = numWords / numSentences;
  const avgCharsPerWord = numChars / numWords;
  
  // Heuristic formula adapted for Arabic text characteristics
  let fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (15 * avgCharsPerWord);
  fleschScore = Math.max(0, Math.min(100, fleschScore));
  
  let difficulty = 'متوسط';
  if (fleschScore >= 80) difficulty = 'سهل جداً';
  else if (fleschScore >= 60) difficulty = 'سهل';
  else if (fleschScore >= 40) difficulty = 'متوسط';
  else if (fleschScore >= 20) difficulty = 'صعب';
  else difficulty = 'صعب جداً (أكاديمي)';

  const { vowels, consonants } = countVowelsConsonants(text);

  return {
    fleschScore: Math.round(fleschScore * 10) / 10,
    difficulty,
    vowelsCount: vowels,
    consonantsCount: consonants
  };
}

export function stripPunctuation(text: string): string {
  // يزيل علامات الترقيم ولكن يحافظ على الحروف والأرقام (عربي وإنجليزي) والمسافات
  return text.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ');
}

const PREFIXES_STRIP = ['وال', 'فال', 'كال', 'بال', 'لل', 'ال', 'و', 'ب', 'ف', 'ك', 'ل'];
const STEM_PREFIXES3 = ['وال', 'فال', 'بال', 'كال', 'لل', 'است'];
const STEM_PREFIXES2 = ['ال', 'سي'];
const STEM_PREFIXES1 = ['و', 'ف', 'ب', 'ك', 'ل', 'ي', 'ت', 'ن', 'أ', 'م'];
const STEM_SUFFIXES = ['ون', 'ين', 'ان', 'ات', 'وا', 'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ية', 'ه', 'ة', 'ي', 'ك'];

const MAX_CACHE_SIZE = 1000;
const rootCache = new Map<string, string>();
const prefixCache = new Map<string, string>();

export function stripArabicPrefixes(word: string): string {
  const cached = prefixCache.get(word);
  if (cached) return cached;

  let result = word;
  // Only strip if the remaining word is at least 2 characters long
  for (const prefix of PREFIXES_STRIP) {
    if (word.startsWith(prefix) && (word.length - prefix.length) >= 2) {
      result = word.slice(prefix.length);
      break;
    }
  }

  if (prefixCache.size >= MAX_CACHE_SIZE) prefixCache.clear();
  prefixCache.set(word, result);
  return result;
}

// استخراج الجذور الخفيف (Arabic Light Stemmer)
export function getArabicRoot(word: string): string {
  const cached = rootCache.get(word);
  if (cached) return cached;

  let stem = word;
  let changed = true;

  while (changed && stem.length > 3) {
    changed = false;

    // 1. إزالة السوابق المعقدة وحروف العطف والجر
    for (const p of STEM_PREFIXES3) {
      if (stem.startsWith(p) && stem.length > p.length + 2) {
        stem = stem.substring(p.length);
        changed = true;
        break;
      }
    }
    if (!changed) {
      for (const p of STEM_PREFIXES2) {
        if (stem.startsWith(p) && stem.length > p.length + 2) {
          stem = stem.substring(p.length);
          changed = true;
          break;
        }
      }
    }
    if (!changed) {
      for (const p of STEM_PREFIXES1) {
        if (stem.startsWith(p) && stem.length > p.length + 2) {
          stem = stem.substring(p.length);
          changed = true;
          break;
        }
      }
    }

    // 2. إزالة اللواحق والضمائر المتصلة
    if (!changed) {
      for (const s of STEM_SUFFIXES) {
        if (stem.endsWith(s) && stem.length > s.length + 2) {
          stem = stem.substring(0, stem.length - s.length);
          changed = true;
          break;
        }
      }
    }
  }

  // 4. توحيد الألف
  stem = stem.replace(/[أإآ]/g, 'ا');

  const result = stem.length >= 2 ? stem : word;

  if (rootCache.size >= MAX_CACHE_SIZE) rootCache.clear();
  rootCache.set(word, result);
  return result;
}

export function generateNgrams(tokens: string[], n: number): string[] {
  if (n <= 1) return tokens;
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

export function extractSentences(text: string, targetWord: string, config: NLPConfig): string[] {
  const sentences = text.split(/[.!?؟\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  return sentences.filter(sentence => {
    // استخدم محرك استخراج الكلمات الأساسي بدلاً من ازالة علامات الترقيم بشكل يدوي
    let rawTokens = extractWords(sentence);
    let tokens = rawTokens.map(t => removeDiacritics(t));
    
    if (config.removeStopwords) {
      tokens = tokens.filter(t => !ARABIC_STOPWORDS.has(t));
    }
    
    if (config.useStemming) {
      tokens = tokens.map(getArabicRoot);
    } else if (config.stripPrefixes) {
      tokens = tokens.map(stripArabicPrefixes);
    }
    
    // Filter by length (same as analysis)
    tokens = tokens.filter(t => t.length >= config.minWordLength);
    
    if (config.ngramSize && config.ngramSize > 1) {
      const ngrams = generateNgrams(tokens, config.ngramSize);
      return ngrams.includes(targetWord);
    }
    
    return tokens.includes(targetWord);
  });
}

export async function analyzeTextAsync(text: string, config: NLPConfig, onProgress?: (progress: number) => void): Promise<{ results: WordFrequency[], totalTokens: number, uniqueTokens: number, readability: ReadabilityMetrics, wordCount: number }> {
  const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));
  
  if (onProgress) onProgress(10);
  await yieldToMain();
  
  const rawWords = extractWords(text);
  const wordCount = rawWords.length;
  
  if (onProgress) onProgress(30);
  await yieldToMain();
  
  const processedTokens: string[] = [];
  const chunkSize = 5000;
  
  for (let i = 0; i < rawWords.length; i++) {
    if (i > 0 && i % chunkSize === 0) {
      if (onProgress) onProgress(30 + Math.floor((i / rawWords.length) * 40));
      await yieldToMain();
    }

    let token = removeDiacritics(rawWords[i]);

    if (config.removeStopwords && ARABIC_STOPWORDS.has(token)) continue;

    if (config.useStemming) {
      token = getArabicRoot(token);
    } else if (config.stripPrefixes) {
      token = stripArabicPrefixes(token);
    }

    if (token.length >= config.minWordLength) {
      processedTokens.push(token);
    }
  }
  
  if (onProgress) onProgress(70);
  await yieldToMain();
  
  const finalTokens = generateNgrams(processedTokens, config.ngramSize || 1);
  
  if (onProgress) onProgress(80);
  await yieldToMain();
  
  const counts = new Map<string, number>();
  for (const token of finalTokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  
  if (onProgress) onProgress(90);
  await yieldToMain();
  
  const totalTokens = finalTokens.length;
  const uniqueTokens = counts.size;
  
  const results: WordFrequency[] = Array.from(counts.entries()).map(([word, count]) => ({
    word,
    count,
    percentage: totalTokens > 0 ? Number(((count / totalTokens) * 100).toFixed(2)) : 0
  }));
  
  results.sort((a, b) => b.count - a.count);
  
  const readability = calculateReadability(text);
  
  if (onProgress) onProgress(100);
  await yieldToMain();
  
  return { results, totalTokens, uniqueTokens, readability, wordCount };
}

export function analyzeText(text: string, config: NLPConfig): { results: WordFrequency[], totalTokens: number, uniqueTokens: number, readability: ReadabilityMetrics, wordCount: number } {
  const rawWords = extractWords(text);
  const wordCount = rawWords.length;
  
  const processedTokens: string[] = [];
  for (let i = 0; i < rawWords.length; i++) {
    let token = removeDiacritics(rawWords[i]);

    if (config.removeStopwords && ARABIC_STOPWORDS.has(token)) continue;

    if (config.useStemming) {
      token = getArabicRoot(token);
    } else if (config.stripPrefixes) {
      token = stripArabicPrefixes(token);
    }

    if (token.length >= config.minWordLength) {
      processedTokens.push(token);
    }
  }
  
  const finalTokens = generateNgrams(processedTokens, config.ngramSize || 1);
  const totalTokens = finalTokens.length;
  const readability = calculateReadability(text);
  
  if (totalTokens === 0) return { results: [], totalTokens: 0, uniqueTokens: 0, readability, wordCount };
  
  const freqMap = new Map<string, number>();
  for (const token of finalTokens) {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }
  
  const uniqueTokens = freqMap.size;
  const results: WordFrequency[] = Array.from(freqMap.entries()).map(([word, count]) => ({
    word,
    count,
    percentage: Number(((count / totalTokens) * 100).toFixed(2))
  }));
  
  results.sort((a, b) => b.count - a.count);
  
  return { results, totalTokens, uniqueTokens, readability, wordCount };
}

export interface ComparisonResult {
  word: string;
  countA: number;
  freqA: number;
  countB: number;
  freqB: number;
  delta: number;
}

export function compareTexts(textA: string, textB: string, config: NLPConfig): ComparisonResult[] {
  const analysisA = analyzeText(textA, config);
  const analysisB = analyzeText(textB, config);
  
  const mapA = new Map(analysisA.results.map(r => [r.word, r]));
  const mapB = new Map(analysisB.results.map(r => [r.word, r]));
  
  const allWords = new Set([...mapA.keys(), ...mapB.keys()]);
  
  const comparison: ComparisonResult[] = Array.from(allWords).map(word => {
    const resA = mapA.get(word);
    const resB = mapB.get(word);
    
    const freqA = resA ? resA.percentage : 0;
    const freqB = resB ? resB.percentage : 0;
    
    return {
      word,
      countA: resA ? resA.count : 0,
      freqA,
      countB: resB ? resB.count : 0,
      freqB,
      delta: Number((freqA - freqB).toFixed(2))
    };
  });
  
  // Sort by absolute delta to show biggest differences first
  comparison.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  
  return comparison;
}

// --- Advanced Dashboard Analysis ---

const ARABIC_PARTICLES = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'حتى', 'مذ', 'منذ', 'رب',
  'و', 'ف', 'ثم', 'أو', 'أم', 'بل', 'لكن', 'لا', 'لم', 'لن',
  'إن', 'أن', 'كأن', 'ليت', 'لعل', 'إيا', 'إلا', 'بلى', 'قد', 'لقد', 'سوف', 'هل', 'ما', 'يا', 'أيها', 'أيتها', 'نعم', 'أجل', 'كلا', 'إي'
]);

export function estimatePOS(word: string): 'noun' | 'verb' | 'particle' {
  if (ARABIC_PARTICLES.has(word) || (word.length <= 2 && !word.startsWith('ال') && !word.startsWith('ي') && !word.startsWith('ت'))) {
    return 'particle';
  }

  let nounScore = 0;
  let verbScore = 0;

  // Noun indicators
  if (word.startsWith('ال') || word.startsWith('بال') || word.startsWith('لل') || word.startsWith('كال') || word.startsWith('فال') || word.startsWith('وال')) nounScore += 5;
  if (word.endsWith('ة') || word.endsWith('ات')) nounScore += 3;
  if (word.endsWith('ين') || word.endsWith('ون') || word.endsWith('ان')) nounScore += 1;
  if (word.startsWith('م') && word.length >= 4) nounScore += 2; // مفعل، مفعول، مستفعل
  if (word.endsWith('ي') && word.length >= 4) nounScore += 1; // نسبة

  // Verb indicators
  if (word.startsWith('است') && word.length >= 5) verbScore += 4;
  if (word.startsWith('س') && word.length >= 4) verbScore += 3; // سيفعل
  if (word.startsWith('يت') || word.startsWith('يست') || word.startsWith('تست') || word.startsWith('نست')) verbScore += 3;
  if ((word.startsWith('ي') || word.startsWith('ت') || word.startsWith('ن')) && word.length >= 4) verbScore += 1;
  if (word.endsWith('وا') || word.endsWith('تم') || word.endsWith('تن') || word.endsWith('نا')) verbScore += 3;
  if (word.endsWith('ت') && word.length >= 4) verbScore += 1; // كتبت

  if (nounScore > verbScore) return 'noun';
  if (verbScore > nounScore) return 'verb';
  
  // Default fallback to noun as it's statistically more common in standard texts
  return 'noun';
}

export interface AdvancedStats {
  id: string;
  name: string;
  wordCount: number;
  totalTokens: number;
  uniqueTokens: number;
  lexicalDiversity: number;
  sentenceCount: number;
  avgSentenceLength: number;
  pos: { nouns: number, verbs: number, particles: number };
  keywords: { word: string, score: number }[];
}

export function analyzeAdvancedCorpus(docs: { id: string, name: string, text: string }[], config: NLPConfig): AdvancedStats[] {
  // 1. Basic processing per doc
  const processedDocs = docs.map(doc => {
    // Sentences
    const sentences = doc.text.split(/[.!?؟\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    const sentenceLengths = sentences.map(s => extractWords(s).length);
    const avgSentenceLength = sentenceLengths.length > 0 ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0;

    // Tokens using high accuracy word counter engine
    let rawWords = extractWords(doc.text);
    const wordCount = rawWords.length;
    let tokens = rawWords.map(w => removeDiacritics(w));

    // POS Heuristic (before stemming/stopwords)
    let nouns = 0, verbs = 0, particles = 0;
    tokens.forEach(t => {
      const pos = estimatePOS(t);
      if (pos === 'noun') nouns++;
      else if (pos === 'verb') verbs++;
      else particles++;
    });

    // Apply filters for TF-IDF and diversity
    let filteredTokens = tokens;
    if (config.removeStopwords) {
      filteredTokens = filteredTokens.filter(t => !ARABIC_STOPWORDS.has(t));
    }
    if (config.useStemming) {
      filteredTokens = filteredTokens.map(getArabicRoot);
    } else if (config.stripPrefixes) {
      filteredTokens = filteredTokens.map(stripArabicPrefixes);
    }
    filteredTokens = filteredTokens.filter(t => t.length >= config.minWordLength);

    // Apply N-grams for TF-IDF and Lexical Diversity
    const finalTokens = generateNgrams(filteredTokens, config.ngramSize || 1);

    const uniqueTokens = new Set(finalTokens).size;
    const totalTokens = finalTokens.length;
    const lexicalDiversity = totalTokens > 0 ? (uniqueTokens / totalTokens) * 100 : 0;

    return {
      id: doc.id,
      name: doc.name,
      wordCount,
      totalTokens,
      uniqueTokens,
      lexicalDiversity,
      sentenceCount: sentences.length,
      avgSentenceLength,
      pos: { nouns, verbs, particles },
      filteredTokens: finalTokens
    };
  });

  // 2. Calculate TF-IDF across the corpus
  const df = new Map<string, number>();
  const N = processedDocs.length;

  processedDocs.forEach(doc => {
    const uniqueWords = new Set<string>(doc.filteredTokens);
    uniqueWords.forEach((w: string) => {
      df.set(w, (df.get(w) || 0) + 1);
    });
  });

  return processedDocs.map(doc => {
    const tf = new Map<string, number>();
    doc.filteredTokens.forEach(w => tf.set(w, (tf.get(w) || 0) + 1));

    const tfidf = Array.from(tf.entries()).map(([word, count]) => {
      const tfVal = count / (doc.filteredTokens.length || 1);
      // Add 1 to N to avoid log(1) = 0 if word is in all docs, so it still gets some score
      const idfVal = Math.log((N + 1) / ((df.get(word) || 0) + 1)) + 1; 
      return { word, score: tfVal * idfVal };
    }).sort((a, b) => b.score - a.score);

    return {
      id: doc.id,
      name: doc.name,
      wordCount: doc.wordCount,
      totalTokens: doc.totalTokens,
      uniqueTokens: doc.uniqueTokens,
      lexicalDiversity: doc.lexicalDiversity,
      sentenceCount: doc.sentenceCount,
      avgSentenceLength: doc.avgSentenceLength,
      pos: doc.pos,
      keywords: tfidf.slice(0, 15) // Top 15 keywords
    };
  });
}
