export function requestContextMiddleware(req, _res, next) {
  req.context = {
    requestId: req.requestId || null,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    method: req.method,
    route: req.originalUrl
  };

  next();
}
