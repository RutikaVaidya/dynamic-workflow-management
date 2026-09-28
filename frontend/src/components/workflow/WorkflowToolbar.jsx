import { Box, Button, Stack, Tooltip, Typography } from '@mui/material'

function WorkflowToolbar({
  ready = false,
  editable = false,
  savingDraft = false,
  publishing = false,
  onAddStatus,
  onSaveDraft,
  onPublish,
}) {
  const addStatusTip = editable
    ? 'Add a new status to this version'
    : 'Only DRAFT versions can be modified'
  const saveDraftTip = 'Create or continue the DRAFT version for this workflow'
  const publishTip = editable
    ? 'Publish this DRAFT version'
    : 'Only DRAFT versions can be published'

  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
      <Tooltip title={onAddStatus ? addStatusTip : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="contained"
            disabled={!ready || !editable || !onAddStatus}
            onClick={onAddStatus ?? undefined}
          >
            + Add Status
          </Button>
        </Box>
      </Tooltip>
      <Tooltip title={onSaveDraft ? saveDraftTip : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="outlined"
            disabled={!ready || !onSaveDraft || savingDraft}
            onClick={onSaveDraft ?? undefined}
          >
            {savingDraft ? 'Saving Draft...' : 'Save Draft'}
          </Button>
        </Box>
      </Tooltip>
      <Tooltip title={onPublish ? publishTip : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="contained"
            color="success"
            disabled={!ready || !editable || !onPublish || publishing}
            onClick={onPublish ?? undefined}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </Box>
      </Tooltip>
      {!ready && (
        <Typography variant="body2" color="text.secondary">
          Load a workflow to enable actions.
        </Typography>
      )}
    </Stack>
  )
}

export default WorkflowToolbar