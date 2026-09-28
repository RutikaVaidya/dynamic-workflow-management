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
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

const PRESET_COLORS = [
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#00796b',
  '#d32f2f',
  '#5c6bc0',
  '#00695c',
  '#ef6c00',
  '#6a1b9a',
]

function createInitialValues(status) {
  return {
    name: status?.name ?? '',
    code: status?.code ?? '',
    description: status?.description ?? '',
    color: status?.color || PRESET_COLORS[0],
    isInitial: status?.isInitial ?? false,
    isFinal: status?.isFinal ?? false,
  }
}

function StatusForm({ mode, status, onSubmit, submitting, error }) {
  const [values, setValues] = useState(() => createInitialValues(status))
  const [fieldError, setFieldError] = useState('')

  const setValue = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = values.name.trim()
    const code = values.code.trim()
    if (!name || !code) {
      setFieldError('Name and Code are required.')
      return
    }
    setFieldError('')
    onSubmit({ ...values, name, code })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {(fieldError || error) && (
            <Alert severity="error">{fieldError || error}</Alert>
          )}

          <TextField
            label="Name"
            value={values.name}
            onChange={setValue('name')}
            required
            fullWidth
            autoFocus
          />

          <TextField
            label="Code"
            value={values.code}
            onChange={setValue('code')}
            onBlur={() =>
              setValues((prev) => ({ ...prev, code: prev.code.trim().toUpperCase() }))
            }
            required
            fullWidth
            helperText="Unique code for this status within the version."
          />

          <TextField
            label="Description"
            value={values.description}
            onChange={setValue('description')}
            fullWidth
            multiline
            minRows={2}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {PRESET_COLORS.map((swatch) => (
                <Tooltip key={swatch} title={swatch}>
                  <Box
                    component="button"
                    type="button"
                    aria-label={`Color ${swatch}`}
                    onClick={() => setValues((prev) => ({ ...prev, color: swatch }))}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      bgcolor: swatch,
                      border: values.color === swatch ? '2px solid' : '1px solid rgba(0,0,0,0.2)',
                      borderColor: values.color === swatch ? 'text.primary' : 'divider',
                      cursor: 'pointer',
                      p: 0,
                      '&:hover': { transform: 'scale(1.1)' },
                    }}
                  />
                </Tooltip>
              ))}
              <TextField
                type="color"
                value={values.color}
                onChange={setValue('color')}
                size="small"
                inputProps={{ 'aria-label': 'Custom color' }}
                sx={{ width: 44, '& input': { cursor: 'pointer', p: 0.5 } }}
              />
              <Typography variant="caption" color="text.secondary">
                {values.color}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.isInitial}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, isInitial: event.target.checked }))
                  }
                />
              }
              label="Initial status"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.isFinal}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, isFinal: event.target.checked }))
                  }
                />
              }
              label="Final status"
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting} sx={{ minWidth: 96 }}>
          {submitting ? <CircularProgress size={20} /> : mode === 'edit' ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Box>
  )
}

function WorkflowStatusDialog({ open, mode, status, onSubmit, onClose, submitting, error }) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'edit' ? 'Edit Status' : 'Add Status'}</DialogTitle>
      <StatusForm
        key={`${mode}-${status?.id ?? 'new'}`}
        mode={mode}
        status={status}
        onSubmit={onSubmit}
        onClose={onClose}
        submitting={submitting}
        error={error}
      />
    </Dialog>
  )
}

export default WorkflowStatusDialog