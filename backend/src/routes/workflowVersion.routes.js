import { Router } from 'express'
import {
  listVersions,
  getVersionById,
  createVersion,
  publishVersion,
} from '../controllers/workflowVersion.controller.js'
import workflowStatusRoutes from './workflowStatus.routes.js'
import workflowTransitionRoutes from './workflowTransition.routes.js'

const router = Router({ mergeParams: true })

router.get('/', listVersions)
router.post('/', createVersion)
router.get('/:versionId', getVersionById)
router.post('/:versionId/publish', publishVersion)

router.use('/:versionId/statuses', workflowStatusRoutes)
router.use('/:versionId/transitions', workflowTransitionRoutes)

export default router