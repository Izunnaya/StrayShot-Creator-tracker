import 'dotenv/config'
import express from 'express'
import { errorHandler } from './middlewares/errorHandler.ts'
import { notFound } from './middlewares/notFound.ts'
import { apiRoutes } from './routes/index.ts'

const app = express()
const port = process.env.PORT ?? 4000

app.use(express.json())
app.use('/api', apiRoutes)

// Last two, in this order: Express reaches the error handler only after
// everything before it, and notFound answers whatever no route matched.
app.use(notFound)
app.use(errorHandler)

// The tests send requests straight to `app`, so they never need a port.
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
}

export default app
