import prisma from '../config/db.js'
import { ApiError } from '../utils/apiError.js'
import { getOwnedVersion, ensureDraftVersion } from './version.service.js'

export async function listStatuses(workflowId, versionId) {
  await getOwnedVersion(workflowId, versionId)
  return prisma.workflowStatus.findMany({
    where: { workflowVersionId: versionId },
    orderBy: { displayOrder: 'asc' },
  })
}

export async function createStatus(workflowId, versionId, data) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const { name, code, description = null, displayOrder, color = null, isInitial = false, isFinal = false } = data

  if (!Number.isInteger(displayOrder) || displayOrder < 1) {
    throw new ApiError(400, 'Validation failed', ['displayOrder must be a positive integer'])
  }

  const existing = await prisma.workflowStatus.findFirst({
    where: { workflowVersionId: versionId, code },
  })
  if (existing) {
    throw new ApiError(409, 'A status with this code already exists in this version', [`code: ${code}`])
  }

  return prisma.$transaction(async (tx) => {
    if (isInitial) {
      await tx.workflowStatus.updateMany({
        where: { workflowVersionId: versionId, isInitial: true },
        data: { isInitial: false },
      })
    }
    return tx.workflowStatus.create({
      data: {
        workflowVersionId: versionId,
        name,
        code,
        description,
        displayOrder,
        color,
        isInitial,
        isFinal,
      },
    })
  })
}

export async function getStatusById(workflowId, versionId, statusId) {
  await getOwnedVersion(workflowId, versionId)
  const status = await prisma.workflowStatus.findFirst({
    where: { id: statusId, workflowVersionId: versionId },
  })
  if (!status) {
    throw new ApiError(404, 'Status not found')
  }
  return status
}

export async function updateStatus(workflowId, versionId, statusId, data) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const status = await prisma.workflowStatus.findFirst({
    where: { id: statusId, workflowVersionId: versionId },
  })
  if (!status) {
    throw new ApiError(404, 'Status not found')
  }

  const { name, code, description, displayOrder, color, isInitial, isFinal } = data

  if (code && code !== status.code) {
    const existing = await prisma.workflowStatus.findFirst({
      where: { workflowVersionId: versionId, code, id: { not: statusId } },
    })
    if (existing) {
      throw new ApiError(409, 'A status with this code already exists in this version', [`code: ${code}`])
    }
  }

  if (displayOrder !== undefined && (!Number.isInteger(displayOrder) || displayOrder < 1)) {
    throw new ApiError(400, 'Validation failed', ['displayOrder must be a positive integer'])
  }

  return prisma.$transaction(async (tx) => {
    if (isInitial === true) {
      await tx.workflowStatus.updateMany({
        where: { workflowVersionId: versionId, isInitial: true, id: { not: statusId } },
        data: { isInitial: false },
      })
    }
    return tx.workflowStatus.update({
      where: { id: statusId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(isInitial !== undefined ? { isInitial } : {}),
        ...(isFinal !== undefined ? { isFinal } : {}),
      },
    })
  })
}

export async function deleteStatus(workflowId, versionId, statusId) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  const status = await prisma.workflowStatus.findFirst({
    where: { id: statusId, workflowVersionId: versionId },
  })
  if (!status) {
    throw new ApiError(404, 'Status not found')
  }

  if (status.isInitial) {
    throw new ApiError(400, 'Cannot delete the initial status', ['Set another status as initial first'])
  }

  const [outgoingCount, incomingCount] = await Promise.all([
    prisma.workflowTransition.count({
      where: { workflowVersionId: versionId, fromStatusId: statusId, isActive: true },
    }),
    prisma.workflowTransition.count({
      where: { workflowVersionId: versionId, toStatusId: statusId, isActive: true },
    }),
  ])

  if (outgoingCount > 0 || incomingCount > 0) {
    throw new ApiError(400, 'Cannot delete a status referenced by active transitions', ['Delete its transitions first'])
  }

  return prisma.workflowStatus.update({
    where: { id: statusId },
    data: { isActive: false },
  })
}

export async function reorderStatuses(workflowId, versionId, items) {
  const version = await getOwnedVersion(workflowId, versionId)
  ensureDraftVersion(version)

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Validation failed', ['statuses must be a non-empty array'])
  }

  const ids = items.map((item) => item?.id)
  const orders = items.map((item) => item?.displayOrder)

  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new ApiError(400, 'Validation failed', ['Each status id must be a positive integer'])
  }
  if (new Set(ids).size !== ids.length) {
    throw new ApiError(400, 'Validation failed', ['Duplicate status ids are not allowed'])
  }
  if (orders.some((order) => !Number.isInteger(order) || order < 1)) {
    throw new ApiError(400, 'Validation failed', ['Each displayOrder must be a positive integer'])
  }
  if (new Set(orders).size !== orders.length) {
    throw new ApiError(400, 'Validation failed', ['Duplicate displayOrder values are not allowed'])
  }

  const existingStatuses = await prisma.workflowStatus.findMany({
    where: { id: { in: ids }, workflowVersionId: versionId },
    select: { id: true },
  })
  if (existingStatuses.length !== ids.length) {
    throw new ApiError(400, 'Validation failed', ['All statuses must belong to this workflow version'])
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.workflowStatus.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    )
  )

  return prisma.workflowStatus.findMany({
    where: { workflowVersionId: versionId },
    orderBy: { displayOrder: 'asc' },
  })
}