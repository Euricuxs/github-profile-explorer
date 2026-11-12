import type { ErrorRequestHandler } from 'express'
import { ApiError } from '../errors/apiError.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    })
    return
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  })
}
