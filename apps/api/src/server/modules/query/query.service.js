import { embedText } from '../ai/embeddings.js';
import { listChunksForOrganization } from '../retrieval/retrieval.repository.js';
import { runHybridSearch } from '../retrieval/hybrid-search.js';
import { rerankChunks } from '../retrieval/rerank.js';
import { completeFromProvider, streamAnswerFromProvider } from '../ai/llm-provider.js';

function buildExcerpt(text, query) {
  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const idx = lower.indexOf(lowerQ.split(' ')[0] || '');
  const start = Math.max(0, idx === -1 ? 0 : idx - 40);
  return text.slice(start, start + 200).replace(/\s+/g, ' ').trim();
}

function buildCitations(reranked) {
  return reranked.map((chunk, i) => ({
    id: String(i + 1),
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle || chunk.documentId,
    sectionLabel: chunk.sectionLabel || null,
    pageLabel: chunk.pageLabel || null,
    excerpt: chunk.excerpt || buildExcerpt(chunk.content, '')
  }));
}

export async function answerQuery({ organizationId, question, history, streaming }) {
  const perf = typeof performance !== 'undefined' ? performance : Date;

  const embedStart = perf.now();
  const queryEmbedding = await embedText(question);
  const embedEnd = perf.now();

  const retrievalStart = perf.now();
  const chunks = await listChunksForOrganization(organizationId);
  const searchResult = runHybridSearch({ query: question, queryEmbedding, chunks, topK: 20 });
  const reranked = rerankChunks(question, searchResult.fused, 6);
  const retrievalEnd = perf.now();

  const citations = buildCitations(reranked);

  const generationStart = perf.now();
  let answer;
  let answerTokens = null;

  if (streaming) {
    const tokenStream = await streamAnswerFromProvider({
      question,
      contextChunks: reranked,
      history: history || []
    });
    const collected = [];
    for await (const token of tokenStream) {
      collected.push(token);
    }
    answerTokens = collected;
    answer = collected.join('');
  } else {
    answer = await completeFromProvider({
      question,
      contextChunks: reranked,
      history: history || []
    });
  }
  const generationEnd = perf.now();

  const embeddingMs = Math.round(embedEnd - embedStart);
  const retrievalMs = Math.round(retrievalEnd - retrievalStart);
  const generationMs = Math.round(generationEnd - generationStart);
  const totalMs = embeddingMs + retrievalMs + generationMs;

  const result = {
    answer,
    citations,
    meta: {
      timings: { embeddingMs, retrievalMs, generationMs, totalMs },
      retrieval: {
        lexicalCount: searchResult.lexical ? searchResult.lexical.length : 0,
        denseCount: searchResult.dense ? searchResult.dense.length : 0,
        fusedCount: searchResult.fused ? searchResult.fused.length : 0,
        selectedCount: reranked.length,
        selectedChunkIds: reranked.map(c => c.id),
        selectedDocumentIds: [...new Set(reranked.map(c => c.documentId))]
      }
    }
  };

  if (answerTokens !== null) {
    result.answerTokens = answerTokens;
  }

  return result;
}
