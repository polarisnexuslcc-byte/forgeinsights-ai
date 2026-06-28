import { answerQuery } from './query.service.js';
import { createQueryLog } from '../observability/query-logs.repository.js';

function sseWrite(res, event, data) {
  res.write('event: ' + event + '\n');
  res.write('data: ' + JSON.stringify(data) + '\n\n');
}

export async function queryStreamHandler(req, res, next) {
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    const question = String(req.body && req.body.question || '').trim();
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const history = Array.isArray(req.body && req.body.history) ? req.body.history : [];
    const organizationId = req.auth && req.auth.organizationId;
    const userId = req.auth && req.auth.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const totalStart = Date.now();

    sseWrite(res, 'status', { stage: 'retrieval' });

    let result;
    try {
      result = await answerQuery({ organizationId, question, history, streaming: true });
    } catch (serviceErr) {
      sseWrite(res, 'error', { message: serviceErr.message || 'Retrieval failed' });
      res.end();
      try {
        await createQueryLog({
          organizationId,
          userId,
          question: question.slice(0, 2000),
          answerPreview: '',
          citationCount: 0,
          status: 'error',
          errorMessage: serviceErr.message,
          embeddingMs: 0,
          retrievalMs: 0,
          generationMs: 0,
          totalMs: Date.now() - totalStart,
          lexicalCount: 0,
          denseCount: 0,
          fusedCount: 0,
          selectedCount: 0,
          selectedChunkIds: [],
          selectedDocumentIds: []
        });
      } catch (_) {}
      return;
    }

    sseWrite(res, 'status', { stage: 'generation' });

    const tokens = result.answerTokens || [];
    let finalText = '';

    for (const token of tokens) {
      if (controller.signal.aborted) break;
      finalText += token;
      sseWrite(res, 'token', { text: token });
    }

    if (!finalText) {
      finalText = result.answer || '';
      sseWrite(res, 'token', { text: finalText });
    }

    sseWrite(res, 'citations', { items: result.citations || [] });

    const totalMs = Date.now() - totalStart;
    const meta = result.meta || {};
    sseWrite(res, 'meta', {
      latencyMs: totalMs,
      embeddingMs: meta.timings && meta.timings.embeddingMs || 0,
      retrievalMs: meta.timings && meta.timings.retrievalMs || 0,
      generationMs: meta.timings && meta.timings.generationMs || 0
    });

    sseWrite(res, 'done', { ok: true });
    res.end();

    try {
      await createQueryLog({
        organizationId,
        userId,
        question: question.slice(0, 2000),
        answerPreview: finalText.slice(0, 300),
        citationCount: (result.citations || []).length,
        status: 'ok',
        errorMessage: null,
        embeddingMs: meta.timings && meta.timings.embeddingMs || 0,
        retrievalMs: meta.timings && meta.timings.retrievalMs || 0,
        generationMs: meta.timings && meta.timings.generationMs || 0,
        totalMs,
        lexicalCount: meta.retrieval && meta.retrieval.lexicalCount || 0,
        denseCount: meta.retrieval && meta.retrieval.denseCount || 0,
        fusedCount: meta.retrieval && meta.retrieval.fusedCount || 0,
        selectedCount: meta.retrieval && meta.retrieval.selectedCount || 0,
        selectedChunkIds: meta.retrieval && meta.retrieval.selectedChunkIds || [],
        selectedDocumentIds: meta.retrieval && meta.retrieval.selectedDocumentIds || []
      });
    } catch (_) {}
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      try { sseWrite(res, 'error', { message: err.message }); } catch (_) {}
      res.end();
    }
  }
}
