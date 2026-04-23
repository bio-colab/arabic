## 2025-05-15 - Memoization and Array Hoisting in NLP Hot Paths
**Learning:** Functions like `getArabicRoot` and `stripArabicPrefixes` are called for every single token in a corpus. Repeatedly allocating the same prefix/suffix arrays and re-calculating the same results for common words creates significant overhead in large texts.
**Action:** Always hoist static arrays out of high-frequency loops/functions and implement bounded memoization for pure transformation functions to reduce both CPU cycles and GC pressure.
