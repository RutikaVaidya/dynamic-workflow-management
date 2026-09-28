import { Component, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import BackendStatus from '../components/BackendStatus'
import WorkflowStatusDialog from '../components/workflow/WorkflowStatusDialog'
import {
  listWorkflows,
  getWorkflowStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
  extractApiError,
} from '../services/workflow'

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  )
}

function versionStatusColor(status) {
  if (status === 'PUBLISHED') return 'success.main'
  if (status === 'ARCHIVED') return 'text.secondary'
  return 'info.main'
}

const DRAFT_TOOLTIP = 'Only DRAFT versions can be modified'

function workflowRank(workflow) {
  const everPublished = (workflow.versions ?? []).some(
    (version) => version.status === 'PUBLISHED'
  )
  return {
    published: everPublished ? 0 : 1,
    createdAt: new Date(workflow.createdAt).getTime(),
  }
}

function pickCurrentWorkflow(workflows) {
  const usable = (workflows ?? []).filter((item) => (item.versions?.length ?? 0) > 0)
  if (!usable.length) return { workflow: null, version: null }

  const workflow = [...usable].sort((a, b) => {
    const rankA = workflowRank(a)
    const rankB = workflowRank(b)
    if (rankA.published !== rankB.published) return rankA.published - rankB.published
    if (rankA.createdAt !== rankB.createdAt) return rankA.createdAt - rankB.createdAt
    return String(a.code).localeCompare(String(b.code))
  })[0]

  const draft = [...workflow.versions]
    .filter((version) => version.status === 'DRAFT')
    .sort((a, b) => b.versionNumber - a.versionNumber)[0]
  const version =
    draft ??
    [...workflow.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0]

  return { workflow, version }
}

class StatusCardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Status Management crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card variant="outlined">
          <CardContent>
            <Alert severity="error">
              Something went wrong while loading Status Management.
              <Button
                size="small"
                color="inherit"
                sx={{ ml: 1 }}
                onClick={() => this.setState({ hasError: false })}
              >
                Retry
              </Button>
            </Alert>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

function StatusManagementCard() {
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [editingStatus, setEditingStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [notice, setNotice] = useState({ message: '', severity: 'success' })

  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const dragging = useRef(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const workflows = await listWorkflows()
        if (!active) return
        const { workflow, version } = pickCurrentWorkflow(workflows ?? [])
        if (!workflow || !version) {
if (active) {
          setCurrent(null)
          setError('No workflows are available yet.')
          setLoading(false)
        }
        return
      }
      if (active) {
        setCurrent({ workflow, version })
        setError('')
      }
    } catch (err) {
      if (active) {
        setError(extractApiError(err))
        setLoading(false)
      }
    }
  }

    load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!current) return

    let active = true

    async function loadStatuses() {
      setLoading(true)
      try {
        const statuses = await getWorkflowStatuses(current.workflow.id, current.version.id)
        if (!active) return
        setData({ version: current.version, statuses })
        setError('')
      } catch (err) {
        if (!active) return
        setError(extractApiError(err))
        setData(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStatuses()

    return () => {
      active = false
    }
  }, [current])

  const workflow = current?.workflow ?? null
  const version = data?.version ?? null
  const versionNumber = version?.versionNumber ?? null
  const versionStatus = version?.status ?? null
  const editable = version?.status === 'DRAFT'
  const statuses = (data?.statuses ?? []).filter(
    (status) => status.isActive !== false
  )

  async function refreshStatuses() {
    if (!workflow || !version || !data) return
    const next = await getWorkflowStatuses(workflow.id, version.id)
    setData((prev) => ({ ...(prev ?? {}), version, statuses: next }))
  }

  function openAddDialog() {
    setDialogMode('create')
    setEditingStatus(null)
    setDialogError('')
    setDialogOpen(true)
  }

  function openEditDialog(status) {
    if (!status || typeof status.id !== 'number' || !status.code) {
      setNotice({
        message: 'Cannot edit this status: status data is incomplete. Refresh the workflow and try again.',
        severity: 'error',
      })
      return
    }
    setDialogMode('edit')
    setEditingStatus(status)
    setDialogError('')
    setDialogOpen(true)
  }

  function openDeleteConfirm(status) {
    if (!status || typeof status.id !== 'number') {
      setNotice({
        message: 'Cannot delete this status: status id is missing. Refresh the workflow and try again.',
        severity: 'error',
      })
      return
    }
    setDeleteTarget(status)
    setDeleteError('')
  }

  async function handleDialogSubmit(values) {
    if (!workflow || !version) return
    setSubmitting(true)
    setDialogError('')
    try {
      if (dialogMode === 'create') {
        const nextOrder =
          statuses.reduce((max, item) => Math.max(max, item.displayOrder ?? 0), 0) + 1
        await createStatus(workflow.id, version.id, { ...values, displayOrder: nextOrder })
        setNotice({ message: `Status '${values.name}' created`, severity: 'success' })
      } else if (editingStatus) {
        await updateStatus(workflow.id, version.id, editingStatus.id, {
          ...values,
          displayOrder: editingStatus.displayOrder,
        })
        setNotice({ message: `Status '${values.name}' updated`, severity: 'success' })
      }
      setDialogOpen(false)
      await refreshStatuses()
    } catch (err) {
      setDialogError(extractApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!workflow || !version || !deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteStatus(workflow.id, version.id, deleteTarget.id)
      setDeleteTarget(null)
      setNotice({ message: `Status '${deleteTarget.name}' deleted`, severity: 'success' })
      await refreshStatuses()
    } catch (err) {
      setDeleteError(extractApiError(err))
    } finally {
      setDeleting(false)
    }
  }

  function handleDragStart(event, index) {
    setDragIndex(index)
    dragging.current = true
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function handleDragOver(event, index) {
    if (!dragging.current || dragIndex === index) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOverIndex(null)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    const from = dragIndex
    const to = overIndex
    resetDrag()
    if (from === null || to === null || from === to) return

    const next = [...statuses]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setData((prev) => ({ ...prev, statuses: next }))

    performReorder(next)
  }

  function handleDragEnd() {
    if (dragging.current) resetDrag()
  }

  function resetDrag() {
    dragging.current = false
    setDragIndex(null)
    setOverIndex(null)
  }

  async function performReorder(next) {
    if (!workflow || !version) return
    try {
      const payload = next.map((status, index) => ({
        id: status.id,
        displayOrder: index + 1,
      }))
      await reorderStatuses(workflow.id, version.id, payload)
      await refreshStatuses()
      setNotice({ message: 'Status order updated', severity: 'success' })
    } catch (err) {
      await refreshStatuses()
      setNotice({ message: extractApiError(err), severity: 'error' })
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Status Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          View and manage the status sequence for this workflow. You can add, edit, delete and
          reorder statuses.
        </Typography>

        <Box sx={{ mb: 2 }}>
          {workflow ? (
            <Typography variant="h6" noWrap sx={{ lineHeight: 1.2, mb: 0.5 }}>
              {workflow.name} ({workflow.code})
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No workflow loaded
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            minWidth={0}
            flexWrap="wrap"
          >
            {version ? (
              <>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: versionStatusColor(versionStatus),
                    minWidth: 0,
                  }}
                >
                  Version {versionNumber} · {versionStatus}
                </Typography>
                {version.publishedAt && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Published {new Date(version.publishedAt).toLocaleString()}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No version loaded
              </Typography>
            )}

            <Tooltip title={editable ? 'Add a new status to this version' : DRAFT_TOOLTIP}>
              <Box component="span" sx={{ ml: 'auto' }}>
                <Button
                  variant="contained"
                  disabled={!workflow || !version || !editable}
                  onClick={openAddDialog}
                >
                  + Add Status
                </Button>
              </Box>
            </Tooltip>
          </Stack>
        </Box>

        {version && !editable && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {versionStatus === 'PUBLISHED'
              ? 'This version is published and read-only. Create a draft to make changes.'
              : 'This version is archived and read-only. Create a draft to make changes.'}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 4, justifyContent: 'center' }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading workflow data...
            </Typography>
          </Stack>
        )}

        {!loading && !workflow && (
          <Alert severity="info">
            {error || 'No workflows are available.'}
          </Alert>
        )}

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {statuses.map((status, index) => {
            const accent = status.color || '#1976d2'
            const isOver = overIndex === index

            return (
              <Box
                key={status.id}
                draggable={editable}
                onDragStart={(event) => handleDragStart(event, index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderLeft: `4px solid ${accent}`,
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                  '&:last-of-type': { borderBottom: 'none' },
                  bgcolor: isOver ? 'action.selected' : 'background.paper',
                  cursor: editable ? 'grab' : 'default',
                  '&:active': editable ? { cursor: 'grabbing' } : undefined,
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Box
                  sx={{
                    color: 'text.disabled',
                    display: 'flex',
                    cursor: editable ? 'grab' : 'default',
                  }}
                >
                  <DragHandleIcon />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 30, textAlign: 'right' }}
                >
                  {index + 1}.
                </Typography>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  sx={{ flexGrow: 1, minWidth: 0 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {status.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {status.code}
                    </Typography>
                  </Box>

                  {(status.isInitial || status.isFinal) && (
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                      {status.isInitial && (
                        <Chip
                          size="small"
                          color="success"
                          label="Initial"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                      {status.isFinal && (
                        <Chip
                          size="small"
                          color="warning"
                          label="Final"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </Stack>
                  )}
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title={editable ? 'Edit status' : DRAFT_TOOLTIP}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Edit ${status.name}`}
                        color="primary"
                        disabled={!editable}
                        onClick={() => openEditDialog(status)}
                      >
                        <EditIcon />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title={editable ? 'Delete status' : DRAFT_TOOLTIP}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Delete ${status.name}`}
                        color="error"
                        disabled={!editable}
                        onClick={() => openDeleteConfirm(status)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Box>
            )
          })}
        </Box>

        {version && statuses.length === 0 && editable && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No statuses yet. Add the first status to get started.
          </Typography>
        )}
      </CardContent>

      <WorkflowStatusDialog
        open={dialogOpen}
        mode={dialogMode}
        status={editingStatus}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialogOpen(false)}
        submitting={submitting}
        error={dialogError}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Status</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>
            Delete status{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {deleteTarget?.name} ({deleteTarget?.code})
            </Box>{' '}
            from Version {versionNumber}?
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            The backend checks that no active transitions reference this status.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            color="error"
            variant="contained"
            sx={{ minWidth: 96 }}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice.message)}
        autoHideDuration={3000}
        onClose={() => setNotice({ message: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice({ message: '', severity: 'success' })}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

function Dashboard() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <BackendStatus />
      <Box sx={{ mt: 2 }}>
        <StatusCardErrorBoundary>
          <StatusManagementCard />
        </StatusCardErrorBoundary>
      </Box>
    </>
  )
}

export default Dashboard