export function recallAtK(retrievedIds, relevantIds, k) {
  const topK = retrievedIds.slice(0, k);
  const relevant = new Set(relevantIds);

  if (!relevant.size) return 0;

  const hits = topK.filter((id) => relevant.has(id));
  return hits.length / relevant.size;
}

export function hitRateAtK(retrievedIds, relevantIds, k) {
  const topK = retrievedIds.slice(0, k);
  const relevant = new Set(relevantIds);

  return topK.some((id) => relevant.has(id)) ? 1 : 0;
}

export function reciprocalRank(retrievedIds, relevantIds) {
  const relevant = new Set(relevantIds);

  for (let i = 0; i < retrievedIds.length; i += 1) {
    if (relevant.has(retrievedIds[i])) {
      return 1 / (i + 1);
    }
  }

  return 0;
}

export function ndcgAtK(retrievedIds, relevanceScores, k) {
  const dcg = retrievedIds.slice(0, k).reduce((sum, id, index) => {
    const rel = relevanceScores[id] || 0;
    return sum + rel / Math.log2(index + 2);
  }, 0);

  const ideal = Object.values(relevanceScores)
    .sort((a, b) => b - a)
    .slice(0, k)
    .reduce((sum, rel, index) => {
      return sum + rel / Math.log2(index + 2);
    }, 0);

  if (!ideal) return 0;
  return dcg / ideal;
}
