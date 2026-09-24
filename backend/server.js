import app from './src/app.js'

const port = process.env.BACKEND_PORT || 5000

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})