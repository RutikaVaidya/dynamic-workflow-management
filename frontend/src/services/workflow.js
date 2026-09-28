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

export function getWorkflowStatuses(workflowId, versionId) {
  return unwrap(api.get(`/workflows/${workflowId}/versions/${versionId}/statuses`))
}

export function getWorkflowTransitions(workflowId, versionId) {
  return unwrap(api.get(`/workflows/${workflowId}/versions/${versionId}/transitions`))
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
  getWorkflowStatuses,
  getWorkflowTransitions,
  loadWorkflowData,
}