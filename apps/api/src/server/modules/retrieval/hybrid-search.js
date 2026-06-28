function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function lexicalScore(query, content) {
  const q = tokenize(query);
  const c = tokenize(content);
  const counts = new Map();

  for (const token of c) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  let score = 0;
  for (const token of q) {
    score += counts.get(token) || 0;
  }

  return score;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function reciprocalRankFusion(resultLists, k = 60) {
  const scores = new Map();
  const items = new Map();

  resultLists.forEach((list) => {
    list.forEach((item, index) => {
      const rank = index + 1;
      const current = scores.get(item.id) || 0;
      scores.set(item.id, current + 1 / (k + rank));
      items.set(item.id, item);
    });
  });

  return [...items.values()]
    .map((item) => ({
      ...item,
      rrfScore: scores.get(item.id) || 0
    }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

export function runHybridSearch({ query, queryEmbedding, chunks, topK = 20 }) {
  const lexical = chunks
    .map((chunk) => ({
      ...chunk,
      lexicalScore: lexicalScore(query, chunk.lexicalText || chunk.content)
    }))
    .filter((chunk) => chunk.lexicalScore > 0)
    .sort((a, b) => b.lexicalScore - a.lexicalScore)
    .slice(0, topK);

  const dense = chunks
    .map((chunk) => ({
      ...chunk,
      denseScore: cosineSimilarity(
        queryEmbedding,
        chunk.embeddingJson ? JSON.parse(chunk.embeddingJson) : null
      )
    }))
    .filter((chunk) => chunk.denseScore > 0)
    .sort((a, b) => b.denseScore - a.denseScore)
    .slice(0, topK);

  return {
    lexical,
    dense,
    fused: reciprocalRankFusion([lexical, dense], 60)
  };
}
