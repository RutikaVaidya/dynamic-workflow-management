import { Box, Button, Stack, Tooltip, Typography } from '@mui/material'

function WorkflowToolbar({ ready = false, editable = false, onAddStatus, onSaveDraft, onPublish }) {
  const addStatusTip = editable ? 'Add a new status to this version' : 'Only DRAFT versions can be modified'

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
      <Tooltip title={onSaveDraft ? '' : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="outlined"
            disabled={!ready || !onSaveDraft}
            onClick={onSaveDraft ?? undefined}
          >
            Save Draft
          </Button>
        </Box>
      </Tooltip>
      <Tooltip title={onPublish ? '' : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="contained"
            color="success"
            disabled={!ready || !onPublish}
            onClick={onPublish ?? undefined}
          >
            Publish
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