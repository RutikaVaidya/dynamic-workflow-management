import { Router } from 'express'
import {
  listTransitions,
  createTransition,
  updateTransition,
  deleteTransition,
} from '../controllers/workflowTransition.controller.js'

const router = Router({ mergeParams: true })

router.get('/', listTransitions)
router.post('/', createTransition)
router.put('/:transitionId', updateTransition)
router.delete('/:transitionId', deleteTransition)

export default router