## 2025-05-15 - [Arabic NLP Performance Optimization]

**Learning:** Combining multiple array operations (map/filter) into a single `for` loop significantly reduces memory allocations and garbage collection overhead, especially when dealing with large texts. Memoization of light stemming/prefix-stripping results provides a massive speedup for repetitive natural language text (often ~35% or more depending on the corpus).

**Action:** Always prefer single-pass processing for tokenization pipelines. Use bounded memoization for expensive string-processing functions that are called frequently with repeating inputs.
