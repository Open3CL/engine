export function interpolateLimitTable(table, Sh) {
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];

  if (Sh <= minKey) return table[minKey];
  if (Sh >= maxKey) return table[maxKey];

  if (table[Sh]) return table[Sh];

  const lo = keys.filter((k) => k <= Sh).pop();
  const hi = keys.filter((k) => k >= Sh).shift();

  const loRow = table[lo];
  const hiRow = table[hi];
  const t = (Sh - lo) / (hi - lo);

  const result = {};
  const allLetters = new Set([...Object.keys(loRow), ...Object.keys(hiRow)]);
  for (const letter of allLetters) {
    const vLo = loRow[letter];
    const vHi = hiRow[letter];
    if (vLo !== undefined && vHi !== undefined) {
      result[letter] = vLo + (vHi - vLo) * t;
    } else if (vLo !== undefined) {
      result[letter] = vLo;
    } else if (vHi !== undefined) {
      result[letter] = vHi;
    }
  }
  return result;
}
