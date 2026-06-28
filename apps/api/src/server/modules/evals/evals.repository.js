import crypto from 'crypto';
import { db } from '../../db/client.js';

export function createEvalCase({
  organizationId,
  question,
  expectedDocumentId = null,
  expectedAnswerContains = null
}) {
  const item = {
    id: crypto.randomUUID(),
    organizationId,
    question,
    expectedDocumentId,
    expectedAnswerContains,
    createdAt: new Date().toISOString()
  };

  db.prepare(
    'INSERT INTO rag_eval_cases (' +
    '  id, organization_id, question, expected_document_id, expected_answer_contains, created_at' +
    ') VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    item.id,
    item.organizationId,
    item.question,
    item.expectedDocumentId,
    item.expectedAnswerContains,
    item.createdAt
  );

  return item;
}

export function listEvalCases(organizationId) {
  return db.prepare(
    'SELECT id, organization_id as organizationId, question,' +
    ' expected_document_id as expectedDocumentId,' +
    ' expected_answer_contains as expectedAnswerContains,' +
    ' created_at as createdAt' +
    ' FROM rag_eval_cases WHERE organization_id = ? ORDER BY created_at DESC'
  ).all(organizationId);
}

export function createEvalRun(input) {
  const item = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };

  db.prepare(
    'INSERT INTO rag_eval_runs (' +
    '  id, organization_id, case_id, answer_text,' +
    '  retrieved_document_ids_json, retrieved_chunk_ids_json,' +
    '  citation_count, hit_expected_document, answer_contains_expected,' +
    '  recall_at_k, mrr, latency_ms, created_at' +
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    item.id,
    item.organizationId,
    item.caseId,
    item.answerText,
    JSON.stringify(item.retrievedDocumentIds || []),
    JSON.stringify(item.retrievedChunkIds || []),
    item.citationCount || 0,
    item.hitExpectedDocument ? 1 : 0,
    item.answerContainsExpected ? 1 : 0,
    item.recallAtK ?? null,
    item.mrr ?? null,
    item.latencyMs ?? null,
    item.createdAt
  );

  return item;
}

export function listEvalRuns(organizationId) {
  return db.prepare(
    'SELECT id, organization_id as organizationId, case_id as caseId,' +
    ' answer_text as answerText,' +
    ' retrieved_document_ids_json as retrievedDocumentIdsJson,' +
    ' retrieved_chunk_ids_json as retrievedChunkIdsJson,' +
    ' citation_count as citationCount,' +
    ' hit_expected_document as hitExpectedDocument,' +
    ' answer_contains_expected as answerContainsExpected,' +
    ' recall_at_k as recallAtK, mrr, latency_ms as latencyMs,' +
    ' created_at as createdAt' +
    ' FROM rag_eval_runs WHERE organization_id = ? ORDER BY created_at DESC'
  ).all(organizationId);
}
