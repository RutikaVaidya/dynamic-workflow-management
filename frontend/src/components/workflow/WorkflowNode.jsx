import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Handle, Position } from '@xyflow/react'

function WorkflowNode({ data, selected }) {
  const status = data.status
  const accent = status.color || '#1976d2'
  const canEdit = Boolean(data.editable) && typeof data.onEdit === 'function'
  const canDelete = Boolean(data.editable) && typeof data.onDelete === 'function'
  const editTip = data.editable ? 'Edit status' : 'Only DRAFT versions can be modified'

  return (
    <Box sx={{ position: 'relative', minWidth: 200, maxWidth: 260 }}>
      <Card
        variant="outlined"
        sx={{
          borderLeft: `5px solid ${accent}`,
          boxShadow: selected ? 4 : 1,
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 0.5, minHeight: 22 }} alignItems="center">
            {status.isInitial && (
              <Chip size="small" color="success" label="Initial" sx={{ height: 20, fontSize: 11 }} />
            )}
            {status.isFinal && (
              <Chip size="small" color="warning" label="Final" sx={{ height: 20, fontSize: 11 }} />
            )}
          </Stack>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {status.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {status.code}
          </Typography>
          <Divider sx={{ mt: 1, mb: 0.75 }} />
          <Stack direction="row" spacing={1} className="nodrag">
            <Tooltip title={canEdit ? editTip : editTip}>
              <Box component="span">
                <Button
                  size="small"
                  variant="text"
                  disabled={!canEdit}
                  onClick={() => data.onEdit?.(status)}
                  sx={{ minWidth: 0, px: 1, py: 0.25, textTransform: 'none' }}
                >
                  Edit
                </Button>
              </Box>
            </Tooltip>
            <Tooltip title={canDelete ? 'Delete status' : editTip}>
              <Box component="span">
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  disabled={!canDelete}
                  onClick={() => data.onDelete?.(status)}
                  sx={{ minWidth: 0, px: 1, py: 0.25, textTransform: 'none' }}
                >
                  Delete
                </Button>
              </Box>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>
      <Handle type="target" position={Position.Left} style={{ left: -5 }} />
      <Handle type="source" position={Position.Right} style={{ right: -5 }} />
    </Box>
  )
}

export default WorkflowNode