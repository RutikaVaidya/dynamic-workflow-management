import { Box, Button, Stack, Tooltip, Typography } from '@mui/material'

function WorkflowToolbar({ ready = false, onAddStatus, onSaveDraft, onPublish }) {
  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
      <Tooltip title={onAddStatus ? '' : 'Coming soon'}>
        <Box component="span">
          <Button
            variant="contained"
            disabled={!ready || !onAddStatus}
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