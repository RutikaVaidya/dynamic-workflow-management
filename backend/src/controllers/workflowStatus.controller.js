import { asyncHandler } from '../utils/asyncHandler.js'
import { requireFields, parseId } from '../utils/validate.js'
import * as statusService from '../services/workflowStatus.service.js'

export const listStatuses = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const statuses = await statusService.listStatuses(workflowId, versionId)
  res.json({ success: true, message: 'Workflow statuses retrieved successfully', data: statuses })
})

export const createStatus = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  requireFields(req.body, ['name', 'code', 'displayOrder'])
  const status = await statusService.createStatus(workflowId, versionId, req.body)
  res.status(201).json({ success: true, message: 'Workflow status created successfully', data: status })
})

export const getStatusById = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const statusId = parseId(req.params.statusId, 'Status id')
  const status = await statusService.getStatusById(workflowId, versionId, statusId)
  res.json({ success: true, message: 'Workflow status retrieved successfully', data: status })
})

export const updateStatus = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const statusId = parseId(req.params.statusId, 'Status id')
  const status = await statusService.updateStatus(workflowId, versionId, statusId, req.body)
  res.json({ success: true, message: 'Workflow status updated successfully', data: status })
})

export const deleteStatus = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const statusId = parseId(req.params.statusId, 'Status id')
  const status = await statusService.deleteStatus(workflowId, versionId, statusId)
  res.json({ success: true, message: 'Workflow status deleted successfully', data: status })
})

export const reorderStatuses = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const items = Array.isArray(req.body) ? req.body : req.body?.statuses
  const statuses = await statusService.reorderStatuses(workflowId, versionId, items)
  res.json({ success: true, message: 'Workflow statuses reordered successfully', data: statuses })
})