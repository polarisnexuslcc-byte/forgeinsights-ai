const buckets = new Map();

export function rateLimit({ windowMs = 60000, max = 30 }) {
  return function rateLimitMiddleware(req, res, next) {
    const key = (req.auth?.organizationId || 'anon') + ':' + (req.auth?.userId || req.ip);
    const now = Date.now();

    const current = buckets.get(key) || { count: 0, startedAt: now };

    if (now - current.startedAt > windowMs) {
      current.count = 0;
      current.startedAt = now;
    }

    current.count += 1;
    buckets.set(key, current);

    if (current.count > max) {
      return res.status(429).json({
        error: 'Rate limit exceeded'
      });
    }

    next();
  };
}
