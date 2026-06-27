import { fail, ok } from '../../utils/response.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { answerQuestion } from './answers.service.js';

export async function askAnswerHandler(req, res, next) {
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

    writeAuditLog({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      eventType: 'answer.generated',
      entityType: 'answer',
      entityId: req.requestId,
      message: 'Grounded answer generated',
      metadata: {
        grounded: result.grounded,
        retrievalCount: result.retrievalCount,
        citationCount: result.citations.length,
        usedRewrite: result.usedRewrite,
        filteredByDocument: Boolean(documentId),
        filteredBySource: Boolean(sourceId)
      },
      req
    });

    return ok(res, {
      item: result
    });
  } catch (error) {
    next(error);
  }
}
