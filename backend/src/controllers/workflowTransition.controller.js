import { asyncHandler } from '../utils/asyncHandler.js'
import { requireFields, parseId } from '../utils/validate.js'
import * as transitionService from '../services/workflowTransition.service.js'

export const listTransitions = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const transitions = await transitionService.listTransitions(workflowId, versionId)
  res.json({ success: true, message: 'Workflow transitions retrieved successfully', data: transitions })
})

export const createTransition = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  requireFields(req.body, ['fromStatusId', 'toStatusId', 'actionName', 'actionLabel'])
  const transition = await transitionService.createTransition(workflowId, versionId, req.body)
  res.status(201).json({ success: true, message: 'Workflow transition created successfully', data: transition })
})

export const updateTransition = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const transitionId = parseId(req.params.transitionId, 'Transition id')
  const transition = await transitionService.updateTransition(workflowId, versionId, transitionId, req.body)
  res.json({ success: true, message: 'Workflow transition updated successfully', data: transition })
})

export const deleteTransition = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const transitionId = parseId(req.params.transitionId, 'Transition id')
  const transition = await transitionService.deleteTransition(workflowId, versionId, transitionId)
  res.json({ success: true, message: 'Workflow transition deleted successfully', data: transition })
})