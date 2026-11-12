import { Router } from 'express'
import { getRepositoriesHandler, getUserHandler } from '../controllers/users.controller.js'

const usersRouter = Router()

usersRouter.get('/:username', getUserHandler)
usersRouter.get('/:username/repos', getRepositoriesHandler)

export default usersRouter
