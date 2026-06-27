export function errorHandlerMiddleware(error, req, res, _next) {
  console.error('[api:error]', error);

  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large',
      requestId: req.requestId || null
    });
  }

  res.status(error.status || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    requestId: req.requestId || null
  });
}
