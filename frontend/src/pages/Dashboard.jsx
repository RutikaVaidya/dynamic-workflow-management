import { Typography } from '@mui/material'
import BackendStatus from '../components/BackendStatus'

function Dashboard() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <BackendStatus />
    </>
  )
}

export default Dashboard