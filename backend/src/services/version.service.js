import prisma from '../config/db.js'
import { ApiError } from '../utils/apiError.js'

export const DRAFT = 'DRAFT'
export const PUBLISHED = 'PUBLISHED'
export const ARCHIVED = 'ARCHIVED'

export async function getOwnedVersion(workflowId, versionId) {
  const version = await prisma.workflowVersion.findFirst({
    where: { id: versionId, workflowId },
  })
  if (!version) {
    throw new ApiError(404, 'Workflow version not found')
  }
  return version
}

export function ensureDraftVersion(version) {
  if (version.status !== DRAFT) {
    throw new ApiError(400, 'Only DRAFT versions can be modified', [
      `Version ${version.versionNumber} is ${version.status}, not DRAFT`,
    ])
  }
}

export async function listVersions(workflowId) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }
  return prisma.workflowVersion.findMany({
    where: { workflowId },
    orderBy: { versionNumber: 'asc' },
  })
}

export async function getVersionById(workflowId, versionId) {
  await getOwnedVersion(workflowId, versionId)
  const [statuses, transitions] = await Promise.all([
    prisma.workflowStatus.findMany({
      where: { workflowVersionId: versionId },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.workflowTransition.findMany({
      where: { workflowVersionId: versionId },
      orderBy: { id: 'asc' },
      include: { fromStatus: true, toStatus: true },
    }),
  ])
  return { workflowId, versionId, statuses, transitions }
}

export async function createVersion(workflowId) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }

  const latestPublished = await prisma.workflowVersion.findFirst({
    where: { workflowId, status: PUBLISHED },
    orderBy: { versionNumber: 'desc' },
    include: {
      statuses: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
      transitions: {
        where: { isActive: true },
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!latestPublished) {
    throw new ApiError(
      400,
      'Cannot create a new version because no published version exists'
    )
  }

  return prisma.$transaction(async (tx) => {
    const newVersion = await tx.workflowVersion.create({
      data: {
        workflowId,
        versionNumber: latestPublished.versionNumber + 1,
        status: DRAFT,
      },
    })

    const statusIdMap = {}
    for (const status of latestPublished.statuses) {
      const created = await tx.workflowStatus.create({
        data: {
          workflowVersionId: newVersion.id,
          name: status.name,
          code: status.code,
          description: status.description,
          displayOrder: status.displayOrder,
          color: status.color,
          isInitial: status.isInitial,
          isFinal: status.isFinal,
        },
      })
      statusIdMap[status.id] = created.id
    }

    for (const transition of latestPublished.transitions) {
      await tx.workflowTransition.create({
        data: {
          workflowVersionId: newVersion.id,
          fromStatusId: statusIdMap[transition.fromStatusId],
          toStatusId: statusIdMap[transition.toStatusId],
          actionName: transition.actionName,
          actionLabel: transition.actionLabel,
        },
      })
    }

    const [statuses, transitions] = await Promise.all([
      tx.workflowStatus.findMany({
        where: { workflowVersionId: newVersion.id },
        orderBy: { displayOrder: 'asc' },
      }),
      tx.workflowTransition.findMany({
        where: { workflowVersionId: newVersion.id },
        orderBy: { id: 'asc' },
        include: { fromStatus: true, toStatus: true },
      }),
    ])

    return { ...newVersion, statuses, transitions }
  })
}

function validatePublishableVersion(statuses, transitions) {
  const errors = []

  if (statuses.length === 0) {
    errors.push('Workflow must have at least one status')
  }

  const initialStatuses = statuses.filter((status) => status.isInitial)
  if (initialStatuses.length !== 1) {
    errors.push('Workflow must have exactly one initial status')
  }

  const finalStatuses = statuses.filter((status) => status.isFinal)
  if (finalStatuses.length === 0) {
    errors.push('Workflow must have at least one final status')
  }

  const statusIds = new Set(statuses.map((status) => status.id))
  const seenKeys = new Set()

  for (const transition of transitions) {
    const key = `${transition.fromStatusId}->${transition.toStatusId}`
    if (seenKeys.has(key)) {
      errors.push(`Duplicate transition ${key} in workflow`)
    }
    seenKeys.add(key)

    if (!statusIds.has(transition.fromStatusId)) {
      errors.push(`Transition ${key} references an inactive or missing from-status`)
    }
    if (!statusIds.has(transition.toStatusId)) {
      errors.push(`Transition ${key} references an inactive or missing to-status`)
    }
  }

  return errors
}

export async function publishVersion(workflowId, versionId) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found')
  }

  const version = await getOwnedVersion(workflowId, versionId)
  if (version.status !== DRAFT) {
    throw new ApiError(400, 'Only DRAFT versions can be published')
  }

  const [statuses, transitions] = await Promise.all([
    prisma.workflowStatus.findMany({
      where: { workflowVersionId: versionId, isActive: true },
    }),
    prisma.workflowTransition.findMany({
      where: { workflowVersionId: versionId, isActive: true },
    }),
  ])

  const errors = validatePublishableVersion(statuses, transitions)
  if (errors.length > 0) {
    throw new ApiError(400, 'Workflow cannot be published', errors)
  }

  return prisma.$transaction(async (tx) => {
    await tx.workflowVersion.updateMany({
      where: { workflowId, status: PUBLISHED },
      data: { status: ARCHIVED },
    })
    return tx.workflowVersion.update({
      where: { id: versionId },
      data: { status: PUBLISHED, publishedAt: new Date() },
    })
  })
}