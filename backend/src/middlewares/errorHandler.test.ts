import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../errors.ts'
import { errorHandler } from './errorHandler.ts'

/**
 * The handler is driven through a throwaway app rather than the real one, so
 * a route can be made to fail on purpose without the API gaining an address
 * that exists only for a test.
 */
function appThatThrows(error: unknown) {
  const app = express()

  app.get('/boom', () => {
    throw error
  })
  app.use(errorHandler)

  return app
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('a failure someone meant', () => {
  it('answers with the status, code and message the rule gave it', async () => {
    const refusal = new ApiError(409, 'creator_has_balance', 'This creator cannot be archived yet.')
    const response = await request(appThatThrows(refusal)).get('/boom')

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('creator_has_balance')
    expect(response.body.error.message).toBe('This creator cannot be archived yet.')
  })

  it('carries every reason when a rule refuses for more than one', async () => {
    const refusal = new ApiError(
      409,
      'creator_not_discardable',
      'This creator cannot be discarded.',
      [
        { code: 'has_payments', message: 'A payment has already been recorded.' },
        { code: 'invite_claimed', message: 'The portal invite has been claimed.' },
      ],
    )
    const response = await request(appThatThrows(refusal)).get('/boom')

    expect(response.body.error.reasons).toEqual([
      { code: 'has_payments', message: 'A payment has already been recorded.' },
      { code: 'invite_claimed', message: 'The portal invite has been claimed.' },
    ])
  })

  it('leaves reasons out entirely when there is only the one message', async () => {
    const response = await request(
      appThatThrows(new ApiError(404, 'not_found', 'No such creator.')),
    ).get('/boom')

    expect(response.body.error).toEqual({ code: 'not_found', message: 'No such creator.' })
  })

  it('is not logged: a refused request is ordinary traffic', async () => {
    await request(appThatThrows(new ApiError(404, 'not_found', 'No such creator.'))).get('/boom')

    expect(console.error).not.toHaveBeenCalled()
  })
})

describe('a bug', () => {
  const bug = new Error('connect ECONNREFUSED 10.0.0.4:5432 for user "tracker"')

  it('answers 500 and says nothing about how it happened', async () => {
    const response = await request(appThatThrows(bug)).get('/boom')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: { code: 'internal_error', message: 'The server could not complete that request.' },
    })
  })

  it('keeps the message and the stack out of the body, and puts them in the log', async () => {
    const response = await request(appThatThrows(bug)).get('/boom')

    const body = JSON.stringify(response.body)

    expect(body).not.toContain('ECONNREFUSED')
    /* A stack frame names a file and a line; none of either reaches a caller. */
    expect(body).not.toContain('.ts:')
    expect(body).not.toContain('stack')
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('answers the same way to something thrown that is not an Error at all', async () => {
    const response = await request(appThatThrows('just a string')).get('/boom')

    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe('internal_error')
  })
})
