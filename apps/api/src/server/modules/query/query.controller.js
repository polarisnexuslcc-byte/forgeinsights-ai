import { ok, fail } from '../../lib/http.js';
import { answerQuery } from './query.service.js';
import { createQueryLog } from '../observability/query-logs.repository.js';

export async function queryHandler(req, res, next) {
  try {
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return fail(res, 400, 'Question is required');
    }

    const result = await answerQuery({
      organizationId: req.auth.organizationId,
      question
    });

    createQueryLog({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      question,
      answerPreview: String(result.answer || '').slice(0, 300),
      retrievedChunkIds: result.meta?.retrieval?.selectedChunkIds || [],
      retrievedDocumentIds: result.meta?.retrieval?.selectedDocumentIds || [],
      citations: result.citations || [],
      retrievalCount: result.meta?.retrieval?.selectedCount || 0,
      latencyMs: result.meta?.timings?.totalMs || null,
      retrievalLatencyMs: result.meta?.timings?.retrievalMs || null,
      generationLatencyMs: result.meta?.timings?.generationMs || null,
      status: 'ok'
    });

    return ok(res, { item: result });
  } catch (error) {
    if (req.auth?.organizationId) {
      createQueryLog({
        organizationId: req.auth.organizationId,
        userId: req.auth.userId,
        question: String(req.body?.question || ''),
        answerPreview: null,
        retrievedChunkIds: [],
        retrievedDocumentIds: [],
        citations: [],
        retrievalCount: 0,
        latencyMs: null,
        retrievalLatencyMs: null,
        generationLatencyMs: null,
        status: 'error',
        errorMessage: error.message || 'Unknown query error'
      });
    }

    next(error);
  }
}
