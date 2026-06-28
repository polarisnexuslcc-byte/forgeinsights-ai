function countQueryOverlap(query, text) {
  const q = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const t = String(text || '').toLowerCase();

  let score = 0;
  for (const token of q) {
    if (t.includes(token)) score += 1;
  }
  return score;
}

export function rerankChunks(query, chunks, topK = 6) {
  return chunks
    .map((chunk) => ({
      ...chunk,
      rerankScore:
        (chunk.rrfScore || 0) * 10 +
        countQueryOverlap(query, chunk.content) +
        Math.min(chunk.tokenCount || 0, 300) / 300
    }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);
}
