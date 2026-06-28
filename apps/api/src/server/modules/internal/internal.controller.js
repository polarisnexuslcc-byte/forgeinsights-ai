import { getQueryHealthSummary } from '../observability/query-logs.repository.js';
import { listEvalCases, listEvalRuns } from '../evals/evals.repository.js';
import { runEvalSuite } from '../evals/evals.service.js';
import { ok, err } from '../../lib/http.js';

export async function internalHealthHandler(req, res, next) {
  try {
    const organizationId = req.auth && req.auth.organizationId;
    const health = await getQueryHealthSummary(organizationId);
    ok(res, { item: health });
  } catch (e) {
    next(e);
  }
}

export async function internalEvalsHandler(req, res, next) {
  try {
    const organizationId = req.auth && req.auth.organizationId;
    const cases = await listEvalCases(organizationId);
    const runs = await listEvalRuns(organizationId, 10);
    ok(res, { item: { cases, runs } });
  } catch (e) {
    next(e);
  }
}

export async function internalRunEvalsHandler(req, res, next) {
  try {
    const organizationId = req.auth && req.auth.organizationId;
    const summary = await runEvalSuite(organizationId);
    ok(res, { item: summary });
  } catch (e) {
    next(e);
  }
}

export async function internalOverviewHandler(req, res, next) {
  try {
    const organizationId = req.auth && req.auth.organizationId;
    const health = await getQueryHealthSummary(organizationId);
    const cases = await listEvalCases(organizationId);
    const runs = await listEvalRuns(organizationId, 5);
    ok(res, {
      item: {
        health,
        evals: { caseCount: cases.length, recentRuns: runs }
      }
    });
  } catch (e) {
    next(e);
  }
}
