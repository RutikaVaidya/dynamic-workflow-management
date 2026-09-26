import { Router } from 'express'
import {
  createWorkflow,
  listWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  getActiveWorkflow,
} from '../controllers/workflow.controller.js'
import workflowVersionRoutes from './workflowVersion.routes.js'

const router = Router()

router.post('/', createWorkflow)
router.get('/', listWorkflows)
router.get('/:workflowCode/active', getActiveWorkflow)
router.get('/:id', getWorkflowById)
router.put('/:id', updateWorkflow)
router.delete('/:id', deleteWorkflow)

router.use('/:workflowId/versions', workflowVersionRoutes)

export default router