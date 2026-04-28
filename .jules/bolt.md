
## 2024-04-28 - [NLP Optimization with Memoization and Single-pass Tokenization]
**Learning:** Bounded memoization and reducing intermediate array allocations (single-pass loops) have a massive impact on repetitive NLP tasks like stemming and prefix stripping. Optimization improved performance from ~183ms to ~75ms (~59% reduction) for a ~46k word corpus.
**Action:** Always consider memoization for pure functions in hot loops, and avoid chained map/filter operations on large arrays.
