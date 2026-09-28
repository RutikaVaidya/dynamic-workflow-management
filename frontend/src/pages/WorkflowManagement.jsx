import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import WorkflowCanvas from '../components/workflow/WorkflowCanvas'
import WorkflowToolbar from '../components/workflow/WorkflowToolbar'
import WorkflowStatusDialog from '../components/workflow/WorkflowStatusDialog'
import {
  listWorkflows,
  loadWorkflowData,
  getWorkflowStatuses,
  getWorkflowTransitions,
  createStatus,
  updateStatus,
  deleteStatus,
  extractApiError,
} from '../services/workflow'

function versionChipColor(status) {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'ARCHIVED') return 'default'
  return 'info'
}

function WorkflowManagement() {
  const [workflows, setWorkflows] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loadingWorkflows, setLoadingWorkflows] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
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

  const [snackbar, setSnackbar] = useState('')

  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true

    async function loadWorkflows() {
      try {
        const items = await listWorkflows()
        if (!active) return
        setWorkflows(items ?? [])
      } catch {
        if (!active) return
        setError('Failed to load workflows from the backend.')
      } finally {
        if (active) setLoadingWorkflows(false)
      }
    }

    loadWorkflows()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const workflow = workflows.find((item) => item.id === selectedId)
    if (!workflow) return

    let active = true

    async function loadVersion() {
      setLoadingData(true)
      try {
        const result = await loadWorkflowData(workflow)
        if (!active) return
        setData(result)
        setError('')
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Failed to load the workflow.')
        setData(null)
      } finally {
        if (active) setLoadingData(false)
      }
    }

    loadVersion()

    return () => {
      active = false
    }
  }, [selectedId, workflows])

  const workflow = workflows.find((item) => item.id === selectedId) ?? null
  const version = data?.version ?? null
  const versionNumber = version?.versionNumber ?? null
  const versionStatus = version?.status ?? null
  const editable = version?.status === 'DRAFT'

  async function refreshStatuses() {
    if (!workflow || !version) return
    const [statuses, transitions] = await Promise.all([
      getWorkflowStatuses(workflow.id, version.id),
      getWorkflowTransitions(workflow.id, version.id),
    ])
    setData((prev) => ({ ...prev, statuses, transitions }))
    setRevision((current) => current + 1)
  }

  function openAddDialog() {
    setDialogMode('create')
    setEditingStatus(null)
    setDialogError('')
    setDialogOpen(true)
  }

  function openEditDialog(status) {
    setDialogMode('edit')
    setEditingStatus(status)
    setDialogError('')
    setDialogOpen(true)
  }

  function openDeleteConfirm(status) {
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
          (data?.statuses?.reduce((max, item) => Math.max(max, item.displayOrder ?? 0), 0) ?? 0) + 1
        await createStatus(workflow.id, version.id, { ...values, displayOrder: nextOrder })
        setSnackbar(`Status '${values.name}' created`)
      } else if (editingStatus) {
        await updateStatus(workflow.id, version.id, editingStatus.id, {
          ...values,
          displayOrder: editingStatus.displayOrder,
        })
        setSnackbar(`Status '${values.name}' updated`)
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
      setSnackbar(`Status '${deleteTarget.name}' deleted`)
      await refreshStatuses()
    } catch (err) {
      setDeleteError(extractApiError(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Workflow Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Visual workflow builder. Select a workflow below to load its current version from the
        database.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel id="workflow-select-label">Workflow</InputLabel>
            <Select
              labelId="workflow-select-label"
              id="workflow-select"
              label="Workflow"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={loadingWorkflows}
            >
              {workflows.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto' }}>
            {loadingData ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading version...
                </Typography>
              </Stack>
            ) : version ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  variant="outlined"
                  label={`Version ${versionNumber} · ${versionStatus}`}
                  color={versionChipColor(versionStatus)}
                />
                {version.publishedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Published {new Date(version.publishedAt).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No version loaded
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(!workflow || !data) && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {loadingWorkflows || loadingData
            ? 'Loading workflow data...'
            : 'No workflows available.'}
        </Alert>
      )}

      {data && workflow && (
        <WorkflowCanvas
          key={`${workflow.id}-${data.version?.id}-${revision}`}
          statuses={data.statuses ?? []}
          transitions={data.transitions ?? []}
          editable={editable}
          onEditStatus={openEditDialog}
          onDeleteStatus={openDeleteConfirm}
        />
      )}

      <WorkflowToolbar
        ready={Boolean(data && workflow)}
        editable={editable}
        onAddStatus={openAddDialog}
      />

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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackbar('')}>
          {snackbar}
        </Alert>
      </Snackbar>
    </>
  )
}

export default WorkflowManagement