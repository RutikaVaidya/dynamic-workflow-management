import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import api from '../services/api'

function BackendStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    async function checkHealth() {
      try {
        await api.get('/health')
        if (active) setStatus('connected')
      } catch {
        if (active) setStatus('disconnected')
      }
    }

    checkHealth()

    return () => {
      active = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <span>Checking backend status...</span>
      </Box>
    )
  }

  return (
    <Alert severity={status === 'connected' ? 'success' : 'error'}>
      Backend Status: {status === 'connected' ? 'Connected' : 'Disconnected'}
    </Alert>
  )
}

export default BackendStatus