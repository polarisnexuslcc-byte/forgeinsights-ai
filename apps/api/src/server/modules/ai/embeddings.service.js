import { getEmbeddingProvider } from './ai.registry.js';

export async function embedTextBatch(texts) {
  if (!texts.length) return [];

  const provider = getEmbeddingProvider();
  const result = await provider({ texts });

  return result.embeddings;
}
