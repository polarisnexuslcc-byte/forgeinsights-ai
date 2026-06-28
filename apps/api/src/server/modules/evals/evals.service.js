import { performance } from 'node:perf_hooks';
import { answerQuery } from '../query/query.service.js';
import { createEvalRun, listEvalCases } from './evals.repository.js';

function includesExpected(answer, expectedNeedle) {
  if (!expectedNeedle) return null;
  return String(answer || '').toLowerCase().includes(String(expectedNeedle).toLowerCase());
}

export async function runEvalSuite(organizationId) {
  const cases = listEvalCases(organizationId);
  const results = [];

  for (const testCase of cases) {
    const start = performance.now();
    const result = await answerQuery({
      organizationId,
      question: testCase.question
    });
    const end = performance.now();

    const retrievedDocumentIds = result.meta?.retrieval?.selectedDocumentIds || [];
    const retrievedChunkIds = result.meta?.retrieval?.selectedChunkIds || [];

    const hitExpectedDocument = testCase.expectedDocumentId
      ? retrievedDocumentIds.includes(testCase.expectedDocumentId)
      : false;

    const rank = testCase.expectedDocumentId
      ? retrievedDocumentIds.findIndex((id) => id === testCase.expectedDocumentId)
      : -1;

    const mrr = rank >= 0 ? 1 / (rank + 1) : 0;
    const recallAtK = hitExpectedDocument ? 1 : 0;
    const answerContainsExpected = includesExpected(
      result.answer,
      testCase.expectedAnswerContains
    );

    const saved = createEvalRun({
      organizationId,
      caseId: testCase.id,
      answerText: result.answer,
      retrievedDocumentIds,
      retrievedChunkIds,
      citationCount: result.citations?.length || 0,
      hitExpectedDocument,
      answerContainsExpected: Boolean(answerContainsExpected),
      recallAtK,
      mrr,
      latencyMs: end - start
    });

    results.push(saved);
  }

  return results;
}
