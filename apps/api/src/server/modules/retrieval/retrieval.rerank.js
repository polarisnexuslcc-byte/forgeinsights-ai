import { env } from '../../config/env.js';

function tokenize(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1]+/i)
      .filter(Boolean)
  );
}

function jaccardSimilarity(a, b) {
  const setA = tokenize(a);
  const setB = tokenize(b);

  if (!setA.size || !setB.size) return 0;

  let intersection = 0;

  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

function normalizeRelevanceScore(score) {
  const safe = Number(score || 0);
  return 1 / (1 + Math.max(safe, 0));
}

export function applyPerDocumentCap(items, maxPerDocument) {
  if (!maxPerDocument || maxPerDocument < 1) {
    return items;
  }

  const counts = new Map();
  const filtered = [];

  for (const item of items) {
    const current = counts.get(item.documentId) || 0;

    if (current >= maxPerDocument) {
      continue;
    }

    counts.set(item.documentId, current + 1);
    filtered.push(item);
  }

  return filtered;
}

export function rerankWithDiversity(items, limit) {
  if (!env.RETRIEVAL_ENABLE_DIVERSITY_RERANK || items.length <= 1) {
    return items.slice(0, limit);
  }

  const lambda = Math.min(Math.max(env.RETRIEVAL_DIVERSITY_LAMBDA, 0), 1);
  const selected = [];
  const remaining = [...items];

  while (remaining.length && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const relevance = normalizeRelevanceScore(candidate.score);

      let redundancy = 0;

      for (const chosen of selected) {
        redundancy = Math.max(
          redundancy,
          jaccardSimilarity(candidate.content, chosen.content)
        );
      }

      const mmrScore = lambda * relevance - (1 - lambda) * redundancy;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}
