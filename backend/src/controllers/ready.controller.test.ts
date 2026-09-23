import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../server.ts'

/**
 * The database is stubbed here. What is worth checking is what the endpoint
 * does with an answer and with a refusal — a real connection would only make
 * the suite slower and need a server CI does not have.
 */
const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('../models/prisma.ts', () => ({ prisma: { $queryRaw: queryRaw } }))

beforeEach(() => {
  queryRaw.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/ready, when the database answers', () => {
  beforeEach(() => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }])
  })

  it('says the server is ready to serve requests', async () => {
    const response = await request(app).get('/api/ready')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ready')
    expect(response.body.database).toBe('up')
  })

  it('reports how long the round trip took, and when it asked', async () => {
    const before = Date.now()
    const response = await request(app).get('/api/ready')

    expect(response.body.databaseLatencyMs).toBeGreaterThanOrEqual(0)
    expect(Date.parse(response.body.checkedAt)).toBeGreaterThanOrEqual(before - 1000)
  })
})

describe('GET /api/ready, when the database does not answer', () => {
  beforeEach(() => {
    queryRaw.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.4:5432 for user "tracker"'))
  })

  it('answers 503, so traffic is held back rather than failing request by request', async () => {
    const response = await request(app).get('/api/ready')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'not_ready', database: 'down' })
  })

  it('keeps the reason out of the body and puts it in the log', async () => {
    const response = await request(app).get('/api/ready')

    expect(JSON.stringify(response.body)).not.toContain('ECONNREFUSED')
    expect(console.error).toHaveBeenCalled()
  })
})

describe('GET /api/health', () => {
  it('answers without asking the database anything', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(queryRaw).not.toHaveBeenCalled()
  })
})
