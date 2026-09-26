import { ApiError } from './apiError.js'

export function requireFields(body, fields) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  )
  if (missing.length > 0) {
    throw new ApiError(
      400,
      'Validation failed',
      missing.map((field) => `${field} is required`)
    )
  }
}

export function parseId(value, label = 'id') {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `${label} must be a positive integer`)
  }
  return id
}