import { listChunksForOrganization } from '../retrieval/retrieval.repository.js';
import { runHybridSearch } from '../retrieval/hybrid-search.js';
import { rerankChunks } from '../retrieval/rerank.js';
import { embedText } from '../ai/embeddings.js';

function buildExcerpt(text, query) {
  const content = String(text || '').trim();
  if (content.length <= 280) return content;

  const firstQueryWord = String(query || '').toLowerCase().split(/\s+/)[0] || '';
  const idx = content.toLowerCase().indexOf(firstQueryWord);
  if (idx === -1) return content.slice(0, 280) + '...';

  const start = Math.max(0, idx - 80);
  const end = Math.min(content.length, idx + 200);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

export async function answerQuery({ organizationId, question }) {
  const chunks = listChunksForOrganization(organizationId);
  const queryEmbedding = await embedText(question);

  const { fused } = runHybridSearch({
    query: question,
    queryEmbedding,
    chunks,
    topK: 20
  });

  const selected = rerankChunks(question, fused, 4);

  const citations = selected.map((chunk, index) => ({
    id: String(index + 1),
    label: 'Document ' + chunk.documentId,
    documentId: chunk.documentId,
    chunkId: chunk.id,
    excerpt: buildExcerpt(chunk.content, question),
    section: chunk.sectionLabel || chunk.pageLabel || 'Chunk ' + (chunk.chunkIndex + 1)
  }));

  const answer =
    selected.length
      ? selected
          .map((chunk, index) => 'Fuente relevante ' + (index + 1) + ': ' + buildExcerpt(chunk.content, question) + ' [' + (index + 1) + ']')
          .join('\n\n')
      : 'No encontré evidencia suficiente en los documentos disponibles.';

  return {
    answer,
    citations
  };
}
