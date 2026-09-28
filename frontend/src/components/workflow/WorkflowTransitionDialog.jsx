import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

function deriveInitialValues(source, target) {
  if (!source || !target) return { actionName: '', actionLabel: '' }
  return {
    actionName: `${source.code.toLowerCase()}_to_${target.code.toLowerCase()}`,
    actionLabel: `${source.name} to ${target.name}`,
  }
}

function TransitionForm({ source, target, onSubmit, onClose, submitting, error }) {
  const [values, setValues] = useState(() => deriveInitialValues(source, target))
  const [fieldError, setFieldError] = useState('')

  const setValue = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const actionName = values.actionName.trim()
    const actionLabel = values.actionLabel.trim()
    if (!actionName || !actionLabel) {
      setFieldError('Action Name and Action Label are required.')
      return
    }
    setFieldError('')
    onSubmit({ actionName, actionLabel })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {(fieldError || error) && (
            <Alert severity="error">{fieldError || error}</Alert>
          )}

          <Typography variant="body2">
            From{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {source?.name} ({source?.code})
            </Box>{' '}
            to{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {target?.name} ({target?.code})
            </Box>
          </Typography>

          <TextField
            label="Action Name"
            value={values.actionName}
            onChange={setValue('actionName')}
            required
            fullWidth
            autoFocus
            helperText="Programmatic name identifying this transition."
          />

          <TextField
            label="Action Label"
            value={values.actionLabel}
            onChange={setValue('actionLabel')}
            required
            fullWidth
            helperText="Display label shown on the edge."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting} sx={{ minWidth: 96 }}>
          {submitting ? <CircularProgress size={20} /> : 'Add'}
        </Button>
      </DialogActions>
    </Box>
  )
}

function WorkflowTransitionDialog({
  open,
  source,
  target,
  onSubmit,
  onClose,
  submitting,
  error,
}) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Transition</DialogTitle>
      <TransitionForm
        key={source && target ? `${source.id}-${target.id}` : 'transition'}
        source={source}
        target={target}
        onSubmit={onSubmit}
        onClose={onClose}
        submitting={submitting}
        error={error}
      />
    </Dialog>
  )
}

export default WorkflowTransitionDialog