import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  hitRateAtK,
  ndcgAtK,
  recallAtK,
  reciprocalRank
} from './retrieval.metrics.js';
import { runRetrievalSearch } from '../retrieval/retrieval.search-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evalSetPath = path.resolve(__dirname, '../../evals/retrieval.eval-set.json');

function loadEvalSet() {
  const content = fs.readFileSync(evalSetPath, 'utf8');
  return JSON.parse(content);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mapDocumentResults(items) {
  return [...new Set(items.map((item) => item.documentId))];
}

function mapChunkResults(items) {
  return items.map((item) => item.id);
}

function buildRelevanceScores(relevantIds) {
  return Object.fromEntries(relevantIds.map((id) => [id, 1]));
}

export async function evaluateRetrievalVariant({
  organizationId,
  k = 5,
  useReranking = true
}) {
  const evalSet = loadEvalSet();
  const perQuery = [];

  for (const sample of evalSet) {
    const result = await runRetrievalSearch({
      organizationId,
      query: sample.question,
      limit: k,
      useReranking
    });

    const useChunkLabels =
      Array.isArray(sample.relevantChunkIds) && sample.relevantChunkIds.length > 0;

    const retrievedIds = useChunkLabels
      ? mapChunkResults(result.items)
      : mapDocumentResults(result.items);

    const relevantIds = useChunkLabels
      ? sample.relevantChunkIds
      : sample.relevantDocumentIds;

    const relevanceScores = buildRelevanceScores(relevantIds);

    perQuery.push({
      id: sample.id,
      question: sample.question,
      retrievedIds,
      relevantIds,
      metrics: {
        hitRate: hitRateAtK(retrievedIds, relevantIds, k),
        recall: recallAtK(retrievedIds, relevantIds, k),
        mrr: reciprocalRank(retrievedIds, relevantIds),
        ndcg: ndcgAtK(retrievedIds, relevanceScores, k)
      }
    });
  }

  return {
    k,
    queryCount: perQuery.length,
    metrics: {
      hitRateAtK: average(perQuery.map((item) => item.metrics.hitRate)),
      recallAtK: average(perQuery.map((item) => item.metrics.recall)),
      mrr: average(perQuery.map((item) => item.metrics.mrr)),
      ndcgAtK: average(perQuery.map((item) => item.metrics.ndcg))
    },
    perQuery
  };
}

export async function compareRetrievalVariants({ organizationId, k = 5 }) {
  const baseline = await evaluateRetrievalVariant({
    organizationId,
    k,
    useReranking: false
  });

  const reranked = await evaluateRetrievalVariant({
    organizationId,
    k,
    useReranking: true
  });

  return {
    k,
    baseline,
    reranked,
    delta: {
      hitRateAtK: reranked.metrics.hitRateAtK - baseline.metrics.hitRateAtK,
      recallAtK: reranked.metrics.recallAtK - baseline.metrics.recallAtK,
      mrr: reranked.metrics.mrr - baseline.metrics.mrr,
      ndcgAtK: reranked.metrics.ndcgAtK - baseline.metrics.ndcgAtK
    }
  };
}
