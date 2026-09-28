import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import WorkflowCanvas from '../components/workflow/WorkflowCanvas'
import WorkflowToolbar from '../components/workflow/WorkflowToolbar'
import { listWorkflows, loadWorkflowData } from '../services/workflow'

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
  const versionNumber = data?.version?.versionNumber ?? null
  const versionStatus = data?.version?.status ?? null

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
            ) : data?.version ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  variant="outlined"
                  label={`Version ${versionNumber} · ${versionStatus}`}
                  color={versionChipColor(versionStatus)}
                />
                {data.version.publishedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Published {new Date(data.version.publishedAt).toLocaleString()}
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
          key={`${workflow.id}-${data.version?.id}`}
          statuses={data.statuses ?? []}
          transitions={data.transitions ?? []}
        />
      )}

      <WorkflowToolbar ready={Boolean(data && workflow)} />
    </>
  )
}

export default WorkflowManagement