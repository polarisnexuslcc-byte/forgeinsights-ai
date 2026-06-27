import { env } from '../../config/env.js';
import { openai } from '../../lib/openai.js';
import { runRetrievalSearch } from '../retrieval/retrieval.search-service.js';

function buildContext(chunks) {
  return chunks
    .map((chunk, index) => {
      return [
        `SOURCE ${index + 1}`,
        `chunk_id: ${chunk.id}`,
        `document_id: ${chunk.documentId}`,
        `document_version_id: ${chunk.documentVersionId}`,
        `document_title: ${chunk.documentTitle || 'Untitled document'}`,
        `source_id: ${chunk.sourceId || ''}`,
        `chunk_index: ${chunk.chunkIndex}`,
        'content:',
        chunk.content
      ].join('\n');
    })
    .join('\n\n---\n\n');
}

function buildPrompt(question, chunks) {
  const context = buildContext(chunks);

  return [
    'You are a grounded enterprise retrieval assistant.',
    'Answer only from the provided sources.',
    'Do not use outside knowledge.',
    'If the sources are insufficient, say so clearly.',
    'Every factual claim must be supported by one or more chunk citations.',
    'Use inline citations in this exact format: [chunk:<chunk_id>].',
    'Do not cite any chunk that is not in the provided context.',
    '',
    'CONTEXT',
    context,
    '',
    `QUESTION: ${question}`
  ].join('\n');
}

function fallbackNoAnswer(chunks) {
  return {
    answer: 'No he encontrado evidencia suficiente en los documentos recuperados para responder con confianza.',
    citations: chunks.slice(0, 3).map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentVersionId: chunk.documentVersionId,
      documentTitle: chunk.documentTitle || 'Untitled document',
      sourceId: chunk.sourceId || null,
      chunkIndex: chunk.chunkIndex,
      snippet: chunk.snippet || chunk.content.slice(0, 280),
      score: chunk.score
    })),
    grounded: false
  };
}

function parseUsedChunkIds(answerText, chunks) {
  const matches = [...answerText.matchAll(/\[chunk:([a-zA-Z0-9-]+)\]/g)];
  const ids = new Set(matches.map((match) => match[1]));
  const validIds = new Set(chunks.map((chunk) => chunk.id));
  return [...ids].filter((id) => validIds.has(id));
}

export async function answerQuestion({
  organizationId,
  question,
  documentId = null,
  sourceId = null
}) {
  const retrieval = await runRetrievalSearch({
    organizationId,
    query: question,
    limit: env.ANSWER_TOP_K,
    documentId,
    sourceId
  });

  const chunks = retrieval.items;

  if (!chunks.length || chunks.length < env.ANSWER_MIN_CHUNKS) {
    return {
      retrievalCount: chunks.length,
      query: retrieval.query,
      rewrittenQuery: retrieval.rewrittenQuery,
      usedRewrite: retrieval.usedRewrite,
      ...fallbackNoAnswer(chunks)
    };
  }

  if (!openai) {
    return {
      retrievalCount: chunks.length,
      query: retrieval.query,
      rewrittenQuery: retrieval.rewrittenQuery,
      usedRewrite: retrieval.usedRewrite,
      answer: 'La recuperación funciona, pero falta configurar OPENAI_API_KEY para generar respuestas fundamentadas.',
      citations: chunks.slice(0, 3).map((chunk) => ({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentVersionId: chunk.documentVersionId,
        documentTitle: chunk.documentTitle || 'Untitled document',
        sourceId: chunk.sourceId || null,
        chunkIndex: chunk.chunkIndex,
        snippet: chunk.snippet || chunk.content.slice(0, 280),
        score: chunk.score
      })),
      grounded: false
    };
  }

  const completion = await openai.responses.create({
    model: env.OPENAI_MODEL,
    temperature: env.ANSWER_TEMPERATURE,
    input: buildPrompt(question, chunks)
  });

  const answerText = (completion.output_text || '').trim();
  const usedChunkIds = parseUsedChunkIds(answerText, chunks);

  const citations = chunks
    .filter((chunk) => usedChunkIds.includes(chunk.id))
    .map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentVersionId: chunk.documentVersionId,
      documentTitle: chunk.documentTitle,
      sourceId: chunk.sourceId || null,
      chunkIndex: chunk.chunkIndex,
      snippet: chunk.snippet || chunk.content.slice(0, 280),
      score: chunk.score
    }));

  if (!answerText || !citations.length) {
    return {
      retrievalCount: chunks.length,
      query: retrieval.query,
      rewrittenQuery: retrieval.rewrittenQuery,
      usedRewrite: retrieval.usedRewrite,
      ...fallbackNoAnswer(chunks)
    };
  }

  return {
    retrievalCount: chunks.length,
    query: retrieval.query,
    rewrittenQuery: retrieval.rewrittenQuery,
    usedRewrite: retrieval.usedRewrite,
    answer: answerText,
    citations,
    grounded: true
  };
}
