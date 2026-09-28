import { Box } from '@mui/material'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import WorkflowNode from './WorkflowNode'

const nodeTypes = { workflow: WorkflowNode }

const X_GAP = 300
const Y_GAP = 140

function buildLayout(statuses, transitions) {
  const layer = new Map(statuses.map((s) => [s.id, 0]))

  for (let i = 0; i < statuses.length; i++) {
    let changed = false
    for (const transition of transitions) {
      const next = (layer.get(transition.fromStatusId) ?? 0) + 1
      const current = layer.get(transition.toStatusId) ?? 0
      if (next > current) {
        layer.set(transition.toStatusId, next)
        changed = true
      }
    }
    if (!changed) break
  }

  const byLayer = new Map()
  for (const status of statuses) {
    const layerIndex = layer.get(status.id) ?? 0
    if (!byLayer.has(layerIndex)) byLayer.set(layerIndex, [])
    byLayer.get(layerIndex).push(status)
  }

  const positions = {}
  for (const [layerIndex, items] of byLayer) {
    items.sort((a, b) => a.displayOrder - b.displayOrder)
    items.forEach((status, index) => {
      positions[status.id] = { x: layerIndex * X_GAP, y: index * Y_GAP }
    })
  }

  return positions
}

function buildNodes(statuses, transitions, editable, onEditStatus, onDeleteStatus) {
  const positions = buildLayout(statuses, transitions)
  return statuses.map((status) => ({
    id: String(status.id),
    type: 'workflow',
    position: positions[status.id] ?? { x: 0, y: 0 },
    data: { status, editable, onEdit: onEditStatus, onDelete: onDeleteStatus },
  }))
}

function buildEdges(statuses, transitions) {
  const statusIds = new Set(statuses.map((s) => String(s.id)))
  return transitions
    .filter(
      (t) => statusIds.has(String(t.fromStatusId)) && statusIds.has(String(t.toStatusId))
    )
    .map((transition) => ({
      id: String(transition.id),
      source: String(transition.fromStatusId),
      target: String(transition.toStatusId),
      label: transition.actionLabel || transition.actionName,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
    }))
}

function WorkflowCanvas({
  statuses = [],
  transitions = [],
  editable = false,
  onEditStatus,
  onDeleteStatus,
}) {
  const activeStatuses = statuses.filter((status) => status.isActive !== false)
  const activeTransitions = transitions.filter((transition) => transition.isActive !== false)

  const [nodes, , onNodesChange] = useNodesState(
    buildNodes(activeStatuses, activeTransitions, editable, onEditStatus, onDeleteStatus)
  )
  const [edges, , onEdgesChange] = useEdgesState(
    buildEdges(activeStatuses, activeTransitions)
  )

  return (
    <Box
      sx={{
        height: 520,
        width: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
        <Controls position="bottom-right" />
      </ReactFlow>
    </Box>
  )
}

export default WorkflowCanvas