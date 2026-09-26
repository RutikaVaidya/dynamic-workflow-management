import prisma from '../config/db.js'
import { ApiError } from '../utils/apiError.js'
import { DRAFT, PUBLISHED } from './version.service.js'

export async function createWorkflow(data) {
  const { name, code, description } = data

  const existing = await prisma.workflow.findUnique({ where: { code } })
  if (existing) {
    throw new ApiError(409, 'A workflow with this code already exists', [`code: ${code}`])
  }

  return prisma.$transaction(async (tx) => {
    const workflow = await tx.workflow.create({
      data: { name, code, description: description ?? null },
    })
    const version = await tx.workflowVersion.create({
      data: { workflowId: workflow.id, versionNumber: 1, status: DRAFT },
    })
    return { ...workflow, versions: [version] }
  })
}

export async function listWorkflows() {
  return prisma.workflow.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  })
}

export async function getWorkflowById(id) {
  const workflow = await prisma.workflow.findFirst({
    where: { id, isActive: true },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }
  return workflow
}

export async function updateWorkflow(id, data) {
  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }

  if (data.code && data.code !== workflow.code) {
    const existing = await prisma.workflow.findFirst({
      where: { code: data.code, id: { not: id }, isActive: true },
    })
    if (existing) {
      throw new ApiError(409, 'A workflow with this code already exists', [`code: ${data.code}`])
    }
  }

  return prisma.workflow.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  })
}

export async function deleteWorkflow(id) {
  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }
  return prisma.workflow.update({ where: { id }, data: { isActive: false } })
}

export async function getActiveWorkflow(code) {
  const workflow = await prisma.workflow.findFirst({ where: { code, isActive: true } })
  if (!workflow) {
    throw new ApiError(404, `Workflow with code '${code}' not found`)
  }

  const version = await prisma.workflowVersion.findFirst({
    where: { workflowId: workflow.id, status: PUBLISHED },
  })
  if (!version) {
    throw new ApiError(404, `No published version found for workflow '${code}'`)
  }

  const [statuses, transitions] = await Promise.all([
    prisma.workflowStatus.findMany({
      where: { workflowVersionId: version.id, isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.workflowTransition.findMany({
      where: { workflowVersionId: version.id, isActive: true },
      orderBy: { id: 'asc' },
      include: { fromStatus: true, toStatus: true },
    }),
  ])

  return { workflow, version, statuses, transitions }
}