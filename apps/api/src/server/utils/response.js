export function ok(res, data = {}) {
  return res.status(200).json({
    status: 'ok',
    ...data
  });
}

export function created(res, data = {}) {
  return res.status(201).json({
    status: 'ok',
    ...data
  });
}

export function fail(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...extra
  });
}
