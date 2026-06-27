import { env } from '../../config/env.js';
import { openai } from '../../lib/openai.js';
import { getCachedAnswer, setCachedAnswer } from '../cache/query-cache.js';
import { runRetrievalSearch } from '../retrieval/retrieval.search-service.js';

const INPUT_COST_PER_TOKEN = 0.0000004;
const OUTPUT_COST_PER_TOKEN = 0.0000016;

function buildCacheInput({ organizationId, question, documentId, sourceId }) {
  return {
    organizationId,
    question,
    documentId,
    sourceId,
    model: env.OPENAI_MODEL,
    retrievalConfig: {
      topK: env.ANSWER_TOP_K,
      minChunks: env.ANSWER_MIN_CHUNKS,
      hybrid: env.HYBRID_ENABLE_SEMANTIC,
      reranking: env.RETRIEVAL_ENABLE_DIVERSITY_RERANK
    }
  };
}

function buildPrompt(question, chunks) {
  const context = chunks
    .map((chunk) => `[chunk:${chunk.id}] (from: ${chunk.documentTitle || 'unknown'})\n${chunk.content}`)
    .join('\n\n---\n\n');

  return {
    system:
      'You are a precise document assistant. Answer questions using ONLY the provided sources. ' +
      'Cite every claim with [chunk:<chunk_id>] inline. If the sources do not contain the answer, ' +
      'respond with exactly: "No encontré información suficiente en los documentos para responder esta pregunta."',
    user: `Sources:\n\n${context}\n\nQuestion: ${question}`
  };
}

function fallbackNoAnswer(chunks) {
  return {
    query: null,
    rewrittenQuery: null,
    usedRewrite: false,
    grounded: false,
    answer: 'No encontré información suficiente en los documentos para responder esta pregunta.',
    retrievalCount: chunks.length,
    degradedToLexical: false,
    degradationReason: null,
    citations: [],
    usage: null,
    metrics: {
      retrievalLatencyMs: 0,
      semanticLatencyMs: 0,
      generationLatencyMs: 0
    },
    cache: { hit: false }
  };
}

export async function answerQuestion({
  organizationId,
  question,
  documentId = null,
  sourceId = null
}) {
  const cacheInput = buildCacheInput({ organizationId, question, documentId, sourceId });

  const cached = getCachedAnswer(cacheInput);

  if (cached) {
    return {
      ...cached,
      cache: { hit: true }
    };
  }

  const retrieval = await runRetrievalSearch({
    organizationId,
    query: question,
    limit: env.ANSWER_TOP_K,
    documentId,
    sourceId
  });

  const chunks = retrieval.items;

  if (chunks.length < env.ANSWER_MIN_CHUNKS) {
    return fallbackNoAnswer(chunks);
  }

  if (!openai) {
    return {
      query: retrieval.query,
      rewrittenQuery: retrieval.rewrittenQuery,
      usedRewrite: retrieval.usedRewrite,
      grounded: false,
      answer: 'OpenAI API key not configured.',
      retrievalCount: chunks.length,
      degradedToLexical: retrieval.degradedToLexical,
      degradationReason: retrieval.degradationReason,
      citations: [],
      usage: null,
      metrics: retrieval.metrics,
      cache: { hit: false }
    };
  }

  const generationStartedAt = performance.now();
  const prompt = buildPrompt(question, chunks);

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    temperature: env.ANSWER_TEMPERATURE,
    input: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ]
  });

  const generationLatencyMs = Math.round(performance.now() - generationStartedAt);

  const answerText = response.output_text || '';
  const promptTokens = response.usage?.input_tokens || 0;
  const completionTokens = response.usage?.output_tokens || 0;
  const totalTokens = promptTokens + completionTokens;
  const estimatedCostUsd = Number(
    (promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN).toFixed(8)
  );

  const citationPattern = /\[chunk:([a-zA-Z0-9_-]+)\]/g;
  const chunkIdSet = new Set(chunks.map((c) => c.id));
  const citedIds = new Set();
  let match;

  while ((match = citationPattern.exec(answerText)) !== null) {
    if (chunkIdSet.has(match[1])) {
      citedIds.add(match[1]);
    }
  }

  const citations = chunks
    .filter((c) => citedIds.has(c.id))
    .map((c) => ({
      chunkId: c.id,
      documentId: c.documentId,
      documentTitle: c.documentTitle || null,
      sourceId: c.sourceId || null,
      snippet: c.content.slice(0, 200)
    }));

  const finalResult = {
    query: retrieval.query,
    rewrittenQuery: retrieval.rewrittenQuery,
    usedRewrite: retrieval.usedRewrite,
    grounded: true,
    answer: answerText,
    retrievalCount: chunks.length,
    degradedToLexical: retrieval.degradedToLexical,
    degradationReason: retrieval.degradationReason,
    citations,
    usage: {
      model: env.OPENAI_MODEL,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd
    },
    metrics: {
      retrievalLatencyMs: retrieval.metrics.retrievalLatencyMs,
      semanticLatencyMs: retrieval.metrics.semanticLatencyMs,
      generationLatencyMs
    },
    cache: { hit: false }
  };

  setCachedAnswer(cacheInput, finalResult);

  return finalResult;
}
