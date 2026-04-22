# ⚡ Bolt's Performance Journal

## 2025-05-24 - [Tokenization Pipeline Fusion & Memoization]
**Learning:** Chained array operations (`map`, `filter`) in hot paths like text tokenization create significant memory pressure and redundant iterations. Combined with complex string manipulation in stemmers, this becomes a major bottleneck for large documents. Bounded memoization for deterministic NLP functions (`getArabicRoot`) provides near-O(1) lookups for the most frequent words.
**Action:** Always prefer a single-pass loop over chained high-order array functions in text processing pipelines. Implement bounded caches for expensive deterministic functions that process repetitive inputs.
