export function errorHandlerMiddleware(error, req, res, _next) {
  console.error('[api:error]', error);

  res.status(error.status || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    requestId: req.requestId || null
  });
}
