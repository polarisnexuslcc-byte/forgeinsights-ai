import crypto from 'crypto';
import { db } from '../../db/client.js';

export function createQueryLog({
  organizationId,
  userId = null,
  question,
  answerPreview,
  retrievedChunkIds = [],
  retrievedDocumentIds = [],
  citations = [],
  retrievalCount = 0,
  latencyMs = null,
  retrievalLatencyMs = null,
  generationLatencyMs = null,
  status,
  errorMessage = null
}) {
  const item = {
    id: crypto.randomUUID(),
    organizationId,
    userId,
    question: String(question || '').slice(0, 2000),
    answerPreview: answerPreview ? String(answerPreview).slice(0, 300) : null,
    retrievedChunkIds,
    retrievedDocumentIds,
    citations,
    retrievalCount,
    latencyMs,
    retrievalLatencyMs,
    generationLatencyMs,
    status,
    errorMessage,
    createdAt: new Date().toISOString()
  };

  db.prepare(
    'INSERT INTO rag_query_logs (' +
    '  id, organization_id, user_id, question, answer_preview,' +
    '  retrieved_chunk_ids_json, retrieved_document_ids_json, citations_json,' +
    '  retrieval_count, latency_ms, retrieval_latency_ms, generation_latency_ms,' +
    '  status, error_message, created_at' +
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    item.id,
    item.organizationId,
    item.userId,
    item.question,
    item.answerPreview,
    JSON.stringify(item.retrievedChunkIds),
    JSON.stringify(item.retrievedDocumentIds),
    JSON.stringify(item.citations),
    item.retrievalCount,
    item.latencyMs,
    item.retrievalLatencyMs,
    item.generationLatencyMs,
    item.status,
    item.errorMessage,
    item.createdAt
  );

  return item;
}

export function getQueryHealthSummary(organizationId) {
  return db.prepare(
    'SELECT' +
    '  COUNT(*) as totalQueries,' +
    '  SUM(CASE WHEN status = ' + "'ok'" + ' THEN 1 ELSE 0 END) as okQueries,' +
    '  SUM(CASE WHEN status = ' + "'error'" + ' THEN 1 ELSE 0 END) as errorQueries,' +
    '  AVG(latency_ms) as avgLatencyMs,' +
    '  AVG(retrieval_latency_ms) as avgRetrievalLatencyMs,' +
    '  AVG(generation_latency_ms) as avgGenerationLatencyMs' +
    ' FROM rag_query_logs WHERE organization_id = ?'
  ).get(organizationId);
}
