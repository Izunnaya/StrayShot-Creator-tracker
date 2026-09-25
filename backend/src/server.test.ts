import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from './server.ts'

/**
 * The scaffold proves itself: a request goes in through the real stack and an
 * answer comes back. What is checked is the wiring — routes mounted, JSON
 * parsed, not-found and error handlers in the right order — not any behaviour
 * worth having yet.
 */

describe('GET /api/health', () => {
  it('answers that the server is up', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.environment).toBe('test')
  })

  it('stamps the time it answered', async () => {
    const before = Date.now()
    const response = await request(app).get('/api/health')

    expect(Date.parse(response.body.checkedAt)).toBeGreaterThanOrEqual(before - 1000)
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
  it('is parsed as JSON before a route sees it, and a broken one says whose fault it is', async () => {
    /* No route reads a body yet, so the parser is proved by what it refuses:
       malformed JSON fails in the parser rather than reaching a route, and
       says so as 400 rather than claiming the server broke (0.17). */
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":')

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('invalid_json')
  })
})
