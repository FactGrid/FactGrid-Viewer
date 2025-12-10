export function extractQidFromString(val?: string): string | null {
  if (!val) return null;
  const raw = String(val).trim();
  // Accept formats: Q123, q123, item:Q123, wd:q 123, q-123, P456
  const re = /^(?:\s*(?:item:|qid:|wd:)?\s*([QP])\s*[-:_]?\s*(\d+)\s*)$/i;
  const m = raw.match(re);
  if (!m) return null;
  const prefix = (m[1] || '').toUpperCase();
  const digits = m[2];
  if (!prefix || !digits) return null;
  return `${prefix}${digits}`;
}
