import { performance } from 'node:perf_hooks';
import { listChunksForOrganization } from '../retrieval/retrieval.repository.js';
import { runHybridSearch } from '../retrieval/hybrid-search.js';
import { rerankChunks } from '../retrieval/rerank.js';
import { embedText } from '../ai/embeddings.js';

function buildExcerpt(text, query) {
  const content = String(text || '').trim();
  if (content.length <= 280) return content;

  const needle = String(query || '').toLowerCase().split(/\s+/)[0] || '';
  const idx = content.toLowerCase().indexOf(needle);
  if (idx === -1) return content.slice(0, 280) + '...';

  const start = Math.max(0, idx - 80);
  const end = Math.min(content.length, idx + 200);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

export async function answerQuery({ organizationId, question }) {
  const t0 = performance.now();

  const embedStart = performance.now();
  const queryEmbedding = await embedText(question);
  const embedEnd = performance.now();

  const retrievalStart = performance.now();
  const chunks = listChunksForOrganization(organizationId);
  const { fused, lexical, dense } = runHybridSearch({
    query: question,
    queryEmbedding,
    chunks,
    topK: 20
  });
  const reranked = rerankChunks(question, fused, 4);
  const retrievalEnd = performance.now();

  const generationStart = performance.now();

  const citations = reranked.map((chunk, index) => ({
    id: String(index + 1),
    label: 'Document ' + chunk.documentId,
    documentId: chunk.documentId,
    chunkId: chunk.id,
    excerpt: buildExcerpt(chunk.content, question),
    section: chunk.sectionLabel || chunk.pageLabel || 'Chunk ' + (chunk.chunkIndex + 1)
  }));

  const answer = reranked.length
    ? reranked
        .map((chunk, index) => 'Fuente relevante ' + (index + 1) + ': ' + buildExcerpt(chunk.content, question) + ' [' + (index + 1) + ']')
        .join('\n\n')
    : 'No encontré evidencia suficiente en los documentos disponibles.';

  const generationEnd = performance.now();
  const totalEnd = performance.now();

  return {
    answer,
    citations,
    meta: {
      timings: {
        embeddingMs: embedEnd - embedStart,
        retrievalMs: retrievalEnd - retrievalStart,
        generationMs: generationEnd - generationStart,
        totalMs: totalEnd - t0
      },
      retrieval: {
        lexicalCount: lexical.length,
        denseCount: dense.length,
        fusedCount: fused.length,
        selectedCount: reranked.length,
        selectedChunkIds: reranked.map((chunk) => chunk.id),
        selectedDocumentIds: [...new Set(reranked.map((chunk) => chunk.documentId))]
      }
    }
  };
}
