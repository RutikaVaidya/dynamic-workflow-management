import api from './api'

async function unwrap(request) {
  const response = await request
  return response?.data?.data ?? response?.data
}

export async function listWorkflows() {
  return unwrap(api.get('/workflows'))
}

export async function getActiveWorkflow(code) {
  return unwrap(api.get(`/workflows/${encodeURIComponent(code)}/active`))
}

export async function getWorkflowById(id) {
  return unwrap(api.get(`/workflows/${id}`))
}

export function createVersion(workflowId) {
  return unwrap(api.post(`/workflows/${workflowId}/versions`))
}

export function publishVersion(workflowId, versionId) {
  return unwrap(api.post(`/workflows/${workflowId}/versions/${versionId}/publish`))
}

export async function loadWorkflowVersion(workflow, version) {
  const [statuses, transitions] = await Promise.all([
    getWorkflowStatuses(workflow.id, version.id),
    getWorkflowTransitions(workflow.id, version.id),
  ])
  return { workflow, version, statuses, transitions }
}

export function getWorkflowStatuses(workflowId, versionId) {
  return unwrap(api.get(`/workflows/${workflowId}/versions/${versionId}/statuses`))
}

export function getWorkflowTransitions(workflowId, versionId) {
  return unwrap(api.get(`/workflows/${workflowId}/versions/${versionId}/transitions`))
}

export function createStatus(workflowId, versionId, payload) {
  return unwrap(
    api.post(`/workflows/${workflowId}/versions/${versionId}/statuses`, payload)
  )
}

export function updateStatus(workflowId, versionId, statusId, payload) {
  return unwrap(
    api.put(`/workflows/${workflowId}/versions/${versionId}/statuses/${statusId}`, payload)
  )
}

export function deleteStatus(workflowId, versionId, statusId) {
  return unwrap(
    api.delete(`/workflows/${workflowId}/versions/${versionId}/statuses/${statusId}`)
  )
}

export function reorderStatuses(workflowId, versionId, payload) {
  return unwrap(
    api.patch(
      `/workflows/${workflowId}/versions/${versionId}/statuses/reorder`,
      payload
    )
  )
}

export function createTransition(workflowId, versionId, payload) {
  return unwrap(
    api.post(`/workflows/${workflowId}/versions/${versionId}/transitions`, payload)
  )
}

export function deleteTransition(workflowId, versionId, transitionId) {
  return unwrap(
    api.delete(`/workflows/${workflowId}/versions/${versionId}/transitions/${transitionId}`)
  )
}

export function extractApiError(err) {
  const message = err?.response?.data?.message || err?.message || 'Request failed'
  const details = err?.response?.data?.errors
  if (Array.isArray(details) && details.length > 0) {
    return `${message}: ${details.join('; ')}`
  }
  return message
}

export async function loadWorkflowData(workflow) {
  try {
    return await getActiveWorkflow(workflow.code)
  } catch (err) {
    if (err?.response?.status !== 404) {
      throw err
    }
  }

  const detail = await getWorkflowById(workflow.id)
  const version = detail?.versions?.[0]
  if (!version) {
    throw new Error(`Workflow '${workflow.name}' has no versions yet`)
  }

  const [statuses, transitions] = await Promise.all([
    getWorkflowStatuses(workflow.id, version.id),
    getWorkflowTransitions(workflow.id, version.id),
  ])

  return { workflow: detail, version, statuses, transitions }
}

export default {
  listWorkflows,
  getActiveWorkflow,
  getWorkflowById,
  createVersion,
  publishVersion,
  getWorkflowStatuses,
  getWorkflowTransitions,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
  createTransition,
  deleteTransition,
  extractApiError,
  loadWorkflowData,
  loadWorkflowVersion,
}