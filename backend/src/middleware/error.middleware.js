import { ApiError } from '../utils/apiError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [],
  })
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      errors: [],
    })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value violates a unique constraint',
      errors: [err.meta?.target ?? 'unique constraint'],
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      errors: [],
    })
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  })
}