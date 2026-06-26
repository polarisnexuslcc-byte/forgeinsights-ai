export function requestLoggerMiddleware(req, _res, next) {
  req.startedAt = Date.now();
  next();
}
