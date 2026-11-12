import { Router } from 'express'
import searchRouter from './search.routes.js'
import usersRouter from './users.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/users', usersRouter)
router.use('/search', searchRouter)

export default router
