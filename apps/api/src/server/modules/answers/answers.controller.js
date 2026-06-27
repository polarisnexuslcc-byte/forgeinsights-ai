import { fail, ok } from '../../utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { createRagRun } from '../observability/rag-runs.repository.js';
import { answerQuestion } from './answers.service.js';

export async function askAnswerHandler(req, res, next) {
  const startedAt = performance.now();

  try {
    const question = String(req.body?.question || '').trim();
    const documentId = req.body?.documentId ? String(req.body.documentId) : null;
    const sourceId = req.body?.sourceId ? String(req.body.sourceId) : null;

    if (!question) {
      return fail(res, 400, 'question is required');
    }

    const result = await answerQuestion({
      organizationId: req.auth.organizationId,
      question,
      documentId,
      sourceId
    });

    const totalLatencyMs = Math.round(performance.now() - startedAt);

    createRagRun({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      route: '/api/answers/ask',
      question,
      retrievalQuery: result.query,
      rewrittenQuery: result.rewrittenQuery || null,
      usedRewrite: result.usedRewrite,
      useHybrid: true,
      useReranking: true,
      retrievalCount: result.retrievalCount,
      citationCount: result.citations.length,
      grounded: result.grounded,
      promptTokens: result.usage?.promptTokens || 0,
      completionTokens: result.usage?.completionTokens || 0,
      totalTokens: result.usage?.totalTokens || 0,
      estimatedCostUsd: result.usage?.estimatedCostUsd || 0,
      totalLatencyMs,
      retrievalLatencyMs: result.metrics?.retrievalLatencyMs || 0,
      semanticLatencyMs: result.metrics?.semanticLatencyMs || 0,
      generationLatencyMs: result.metrics?.generationLatencyMs || 0,
      error: false,
      status: 'success'
    });

    await writeAuditLog({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      action: 'answer.generated',
      resourceType: 'answer',
      metadata: {
        grounded: result.grounded,
        retrievalCount: result.retrievalCount,
        citationCount: result.citations.length,
        usedRewrite: result.usedRewrite,
        filteredByDocument: Boolean(documentId),
        filteredBySource: Boolean(sourceId),
        query: result.query,
        rewrittenQuery: result.rewrittenQuery || null,
        degradedToLexical: result.degradedToLexical || false,
        degradationReason: result.degradationReason || null,
        cacheHit: result.cache?.hit || false,
        totalLatencyMs,
        retrievalLatencyMs: result.metrics?.retrievalLatencyMs || 0,
        semanticLatencyMs: result.metrics?.semanticLatencyMs || 0,
        generationLatencyMs: result.metrics?.generationLatencyMs || 0,
        totalTokens: result.usage?.totalTokens || 0,
        estimatedCostUsd: result.usage?.estimatedCostUsd || 0
      }
    });

    return ok(res, {
      item: {
        ...result,
        metrics: {
          ...result.metrics,
          totalLatencyMs
        }
      }
    });
  } catch (error) {
    createRagRun({
      organizationId: req.auth?.organizationId,
      userId: req.auth?.userId,
      route: '/api/answers/ask',
      question: String(req.body?.question || '').trim(),
      error: true,
      status: 'error',
      totalLatencyMs: Math.round(performance.now() - startedAt)
    });

    next(error);
  }
}
