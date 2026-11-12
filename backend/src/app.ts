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
app.use(errorHandler)

export default app
