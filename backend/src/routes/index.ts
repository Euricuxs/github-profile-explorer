import { Router } from 'express'
import usersRouter from './users.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/users', usersRouter)

export default router
