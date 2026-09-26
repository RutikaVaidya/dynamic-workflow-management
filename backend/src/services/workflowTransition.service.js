import prisma from '../config/db.js'
import { ApiError } from '../utils/apiError.js'
import { getOwnedVersion, ensureDraftVersion } from './version.service.js'

export async function listTransitions(workflowId, versionId) {
  await getOwnedVersion(workflowId, versionId)
  return prisma.workflowTransition.findMany({
    where: { workflowVersionId: versionId },
    orderBy: { id: 'asc' },
    include: { fromStatus: true, toStatus: true },
  })
}

export async function createTransition(workflowId, versionId, data) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const { fromStatusId, toStatusId, actionName, actionLabel } = data

  if (!Number.isInteger(fromStatusId) || !Number.isInteger(toStatusId)) {
    throw new ApiError(400, 'Validation failed', ['fromStatusId and toStatusId must be positive integers'])
  }
  if (fromStatusId === toStatusId) {
    throw new ApiError(400, 'Validation failed', ['fromStatusId and toStatusId cannot be the same'])
  }

  const statuses = await prisma.workflowStatus.findMany({
    where: { id: { in: [fromStatusId, toStatusId] }, workflowVersionId: versionId },
  })
  if (statuses.length !== 2) {
    throw new ApiError(400, 'Validation failed', ['Both statuses must belong to the same workflow version'])
  }
  if (statuses.some((status) => !status.isActive)) {
    throw new ApiError(400, 'Validation failed', ['Transitions can only reference active statuses'])
  }

  const existing = await prisma.workflowTransition.findFirst({
    where: { workflowVersionId: versionId, fromStatusId, toStatusId },
  })
  if (existing) {
    throw new ApiError(409, 'This transition already exists in this version')
  }

  return prisma.workflowTransition.create({
    data: { workflowVersionId: versionId, fromStatusId, toStatusId, actionName, actionLabel },
    include: { fromStatus: true, toStatus: true },
  })
}

export async function updateTransition(workflowId, versionId, transitionId, data) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const transition = await prisma.workflowTransition.findFirst({
    where: { id: transitionId, workflowVersionId: versionId },
  })
  if (!transition) {
    throw new ApiError(404, 'Transition not found')
  }

  const fromStatusId = data.fromStatusId ?? transition.fromStatusId
  const toStatusId = data.toStatusId ?? transition.toStatusId

  if (fromStatusId === toStatusId) {
    throw new ApiError(400, 'Validation failed', ['fromStatusId and toStatusId cannot be the same'])
  }

  if (fromStatusId !== transition.fromStatusId || toStatusId !== transition.toStatusId) {
    const statuses = await prisma.workflowStatus.findMany({
      where: { id: { in: [fromStatusId, toStatusId] }, workflowVersionId: versionId },
    })
    if (statuses.length !== 2) {
      throw new ApiError(400, 'Validation failed', ['Both statuses must belong to the same workflow version'])
    }
    if (statuses.some((status) => !status.isActive)) {
      throw new ApiError(400, 'Validation failed', ['Transitions can only reference active statuses'])
    }

    const existing = await prisma.workflowTransition.findFirst({
      where: {
        workflowVersionId: versionId,
        fromStatusId,
        toStatusId,
        id: { not: transitionId },
      },
    })
    if (existing) {
      throw new ApiError(409, 'This transition already exists in this version')
    }
  }

  return prisma.workflowTransition.update({
    where: { id: transitionId },
    data: {
      fromStatusId,
      toStatusId,
      ...(data.actionName !== undefined ? { actionName: data.actionName } : {}),
      ...(data.actionLabel !== undefined ? { actionLabel: data.actionLabel } : {}),
    },
    include: { fromStatus: true, toStatus: true },
  })
}

export async function deleteTransition(workflowId, versionId, transitionId) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const transition = await prisma.workflowTransition.findFirst({
    where: { id: transitionId, workflowVersionId: versionId },
  })
  if (!transition) {
    throw new ApiError(404, 'Transition not found')
  }

  await prisma.workflowTransition.delete({ where: { id: transitionId } })
  return { id: transitionId }
}