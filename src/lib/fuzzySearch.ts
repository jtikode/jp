// Plain Levenshtein edit distance, used to tolerate spelling mistakes in search.
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function maxDistanceFor(word: string): number {
  if (word.length <= 4) return 1;
  if (word.length <= 8) return 2;
  return 3;
}

function wordFuzzyMatches(queryWord: string, targetWord: string): boolean {
  if (targetWord.includes(queryWord)) return true;
  return levenshtein(queryWord, targetWord) <= maxDistanceFor(queryWord);
}

// True if every word in the query has a substring or typo-tolerant match
// somewhere among the words of `text`.
export function fuzzyTextMatch(query: string, text: string): boolean {
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;
  const targetWords = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return false;

  return queryWords.every((qw) => targetWords.some((tw) => wordFuzzyMatches(qw, tw)));
}

// Cascading product search: try an exact/substring match on name first, then
// fall back to composition, then fall back to typo-tolerant matching on both.
export function cascadingProductSearch<T>(
  products: T[],
  query: string,
  getName: (item: T) => string,
  getComposition: (item: T) => string | null | undefined,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;

  const byName = products.filter((p) => getName(p).toLowerCase().includes(q));
  if (byName.length > 0) return byName;

  const byComposition = products.filter((p) => (getComposition(p) ?? "").toLowerCase().includes(q));
  if (byComposition.length > 0) return byComposition;

  return products.filter(
    (p) => fuzzyTextMatch(q, getName(p)) || fuzzyTextMatch(q, getComposition(p) ?? ""),
  );
}
