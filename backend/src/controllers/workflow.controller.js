import { asyncHandler } from '../utils/asyncHandler.js'
import { requireFields, parseId } from '../utils/validate.js'
import * as workflowService from '../services/workflow.service.js'

export const createWorkflow = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'code'])
  const workflow = await workflowService.createWorkflow(req.body)
  res.status(201).json({ success: true, message: 'Workflow created successfully', data: workflow })
})

export const listWorkflows = asyncHandler(async (req, res) => {
  const workflows = await workflowService.listWorkflows()
  res.json({ success: true, message: 'Workflows retrieved successfully', data: workflows })
})

export const getWorkflowById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'Workflow id')
  const workflow = await workflowService.getWorkflowById(id)
  res.json({ success: true, message: 'Workflow retrieved successfully', data: workflow })
})

export const updateWorkflow = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'Workflow id')
  const workflow = await workflowService.updateWorkflow(id, req.body)
  res.json({ success: true, message: 'Workflow updated successfully', data: workflow })
})

export const deleteWorkflow = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'Workflow id')
  const workflow = await workflowService.deleteWorkflow(id)
  res.json({ success: true, message: 'Workflow deleted successfully', data: workflow })
})

export const getActiveWorkflow = asyncHandler(async (req, res) => {
  const workflow = await workflowService.getActiveWorkflow(req.params.workflowCode)
  res.json({ success: true, message: 'Active workflow retrieved successfully', data: workflow })
})