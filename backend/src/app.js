import express from 'express'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the dynamic-workflow-management API' })
})

export default app