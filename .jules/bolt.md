## 2025-05-22 - [Optimized Arabic NLP Engine]
**Learning:** Bounded memoization and hoisting static arrays significantly reduce overhead in repetitive NLP tasks like stemming and prefix stripping. A single-pass tokenization loop further improves performance by minimizing intermediate array allocations.
**Action:** Always prefer single-pass loops over chained map/filter for large data sets and use bounded caches for expensive, repetitive operations.
