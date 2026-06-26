export function notFoundMiddleware(req, res) {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    requestId: req.requestId || null
  });
}
