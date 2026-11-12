import { Router } from 'express'
import { searchUsersHandler } from '../controllers/search.controller.js'

const searchRouter = Router()

searchRouter.get('/users', searchUsersHandler)

export default searchRouter
