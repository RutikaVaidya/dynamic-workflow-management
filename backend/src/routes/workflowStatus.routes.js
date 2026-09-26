import { Router } from 'express'
import {
  listStatuses,
  createStatus,
  getStatusById,
  updateStatus,
  deleteStatus,
  reorderStatuses,
} from '../controllers/workflowStatus.controller.js'

const router = Router({ mergeParams: true })

router.get('/', listStatuses)
router.post('/', createStatus)
router.patch('/reorder', reorderStatuses)
router.get('/:statusId', getStatusById)
router.put('/:statusId', updateStatus)
router.delete('/:statusId', deleteStatus)

export default router