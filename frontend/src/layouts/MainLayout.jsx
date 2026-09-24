import { AppBar, Box, Container, Tabs, Tab, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Workflow Management', path: '/workflows' },
]

function MainLayout() {
  const location = useLocation()
  const activeTab =
    navItems.find((item) => location.pathname.startsWith(item.path))?.path || false

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dynamic Workflow Management
          </Typography>
          <Tabs value={activeTab} textColor="inherit" indicatorColor="secondary">
            {navItems.map((item) => (
              <Tab
                key={item.path}
                label={item.label}
                value={item.path}
                component={RouterLink}
                to={item.path}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default MainLayout