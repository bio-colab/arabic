## 2025-05-15 - Memoization for Arabic Stemming
**Learning:** Stemming and prefix stripping are computationally expensive and often process the same common words repeatedly. Implementing bounded memoization yields significant performance gains (~25% speedup in benchmarks) without significant memory overhead.
**Action:** Always consider memoizing core NLP functions that process tokens, ensuring caches are bounded to prevent memory leaks in long-running sessions.
