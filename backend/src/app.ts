import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const app = express()

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use('/api', routes)

/**
 * The answer for an address the API does not have.
 *
 * Express would answer such a request with a page of HTML, while every
 * other failure of this API answers with the JSON envelope. This middleware
 * makes the unknown address answer the same way, so a client only ever has
 * to understand one shape of error.
 *
 * It is registered after the routes and before the error middleware: the
 * routes have already had their chance to answer, and an error that is
 * thrown further down still reaches the error middleware.
 */
app.use('/api', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  })
})

app.use(errorHandler)

export default app
