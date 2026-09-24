import 'dotenv/config'

const port = process.env.PORT || process.env.BACKEND_PORT || 5000
const nodeEnv = process.env.NODE_ENV || 'development'

export { port, nodeEnv }