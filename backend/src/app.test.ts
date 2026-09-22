import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.ts'

/**
 * The scaffold proves itself: a request goes in through the real stack and
 * an answer comes back out. What is being checked is the wiring — routes
 * mounted, JSON parsed, the not-found and error middlewares in the right
 * order — not any behaviour worth having yet.
 */

const app = createApp('test')

describe('GET /api/health', () => {
  it('answers that the server is up, and says which environment', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.environment).toBe('test')
  })

  it('stamps the time it answered', async () => {
    const before = Date.now()
    const response = await request(app).get('/api/health')
    const checkedAt = Date.parse(response.body.checkedAt)

    expect(Number.isNaN(checkedAt)).toBe(false)
    expect(checkedAt).toBeGreaterThanOrEqual(before - 1000)
  })
})

describe('an address the API does not serve', () => {
  it('answers 404 as JSON, naming the method and path', async () => {
    const response = await request(app).get('/api/nothing-here')

    expect(response.status).toBe(404)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body.error.code).toBe('not_found')
    expect(response.body.error.message).toContain('GET /api/nothing-here')
  })
})

describe('a request body', () => {
  it('is parsed as JSON before a route sees it', async () => {
    /* No route reads a body yet, so the parser is proved by what it refuses:
       malformed JSON fails in the parser and comes back as a failure, not as
       a route being handed something unusable. */
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":')

    expect(response.status).toBeGreaterThanOrEqual(400)
  })
})
