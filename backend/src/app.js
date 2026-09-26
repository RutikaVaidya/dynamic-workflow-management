import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import workflowRoutes from './routes/workflow.routes.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRoutes)
app.use('/api/workflows', workflowRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app