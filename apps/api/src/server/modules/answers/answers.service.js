import { env } from '../../config/env.js';
import { generateChatCompletion } from '../ai/chat.service.js';
import { getOrganizationBudgetStatus } from '../ai/ai-budgets.service.js';
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
    model: env.AI_CHAT_MODEL,
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

function fallbackNoAnswer(chunks, retrieval) {
  return {
    query: retrieval?.query || null,
    rewrittenQuery: retrieval?.rewrittenQuery || null,
    usedRewrite: retrieval?.usedRewrite || false,
    grounded: false,
    answer: 'No encontré información suficiente en los documentos para responder esta pregunta.',
    retrievalCount: chunks.length,
    degradedToLexical: false,
    degradationReason: null,
    citations: [],
    provider: null,
    model: null,
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

  const budgetStatus = getOrganizationBudgetStatus(organizationId);

  if (budgetStatus.state === 'hard-limit') {
    return {
      query: question,
      rewrittenQuery: null,
      usedRewrite: false,
      grounded: false,
      answer: 'AI budget limit reached for this organization.',
      retrievalCount: 0,
      degradedToLexical: false,
      degradationReason: null,
      citations: [],
      provider: null,
      model: null,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0
      },
      metrics: {
        retrievalLatencyMs: 0,
        semanticLatencyMs: 0,
        generationLatencyMs: 0
      },
      cache: { hit: false },
      budget: budgetStatus
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
    return fallbackNoAnswer(chunks, retrieval);
  }

  const generationStartedAt = performance.now();
  const prompt = buildPrompt(question, chunks);

  const messages = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const completion = await generateChatCompletion({
    messages,
    temperature: env.ANSWER_TEMPERATURE
  });

  const generationLatencyMs = Math.round(performance.now() - generationStartedAt);

  const answerText = completion.text || '';
  const promptTokens = completion.usage.promptTokens || 0;
  const completionTokens = completion.usage.completionTokens || 0;
  const totalTokens = completion.usage.totalTokens || 0;

  const estimatedCostUsd =
    promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN;

  const citationPattern = /\[chunk:([a-zA-Z0-9_-]+)\]/g;
  const citedIds = new Set();
  let match;

  while ((match = citationPattern.exec(answerText)) !== null) {
    citedIds.add(match[1]);
  }

  const citations = chunks
    .filter((chunk) => citedIds.has(chunk.id))
    .map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content
    }));

  const grounded = citations.length > 0;

  const result = {
    query: retrieval.query,
    rewrittenQuery: retrieval.rewrittenQuery,
    usedRewrite: retrieval.usedRewrite,
    grounded,
    answer: answerText,
    retrievalCount: chunks.length,
    degradedToLexical: retrieval.degradedToLexical || false,
    degradationReason: retrieval.degradationReason || null,
    citations,
    provider: completion.provider,
    model: completion.model,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd
    },
    metrics: {
      retrievalLatencyMs: retrieval.metrics?.retrievalLatencyMs || 0,
      semanticLatencyMs: retrieval.metrics?.semanticLatencyMs || 0,
      generationLatencyMs
    },
    cache: { hit: false },
    budget: budgetStatus,
    gateway: {
      mode: env.AI_GATEWAY_MODE,
      requestedModel: env.AI_PROVIDER === 'litellm' ? env.LITELLM_CHAT_MODEL : env.AI_CHAT_MODEL,
      provider: completion.provider,
      actualModel: completion.model,
      budgetState: budgetStatus.state
    }
  };

  setCachedAnswer(cacheInput, result);

  return result;
}
