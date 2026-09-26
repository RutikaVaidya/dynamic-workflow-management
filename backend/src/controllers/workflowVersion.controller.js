import { asyncHandler } from '../utils/asyncHandler.js'
import { parseId } from '../utils/validate.js'
import * as versionService from '../services/version.service.js'

export const listVersions = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versions = await versionService.listVersions(workflowId)
  res.json({ success: true, message: 'Workflow versions retrieved successfully', data: versions })
})

export const getVersionById = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const version = await versionService.getVersionById(workflowId, versionId)
  res.json({ success: true, message: 'Workflow version retrieved successfully', data: version })
})

export const createVersion = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const version = await versionService.createVersion(workflowId)
  res.status(201).json({ success: true, message: 'Workflow version created successfully', data: version })
})

export const publishVersion = asyncHandler(async (req, res) => {
  const workflowId = parseId(req.params.workflowId, 'Workflow id')
  const versionId = parseId(req.params.versionId, 'Version id')
  const version = await versionService.publishVersion(workflowId, versionId)
  res.json({ success: true, message: 'Workflow version published successfully', data: version })
})