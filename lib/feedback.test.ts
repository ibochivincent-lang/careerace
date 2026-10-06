import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFeedback } from './feedback.ts'

test('Feedback validation: accepts valid feedback submissions', () => {
  const result = validateFeedback({
    email: 'user@example.com',
    category: 'feature_request',
    rating: 5,
    message: 'Love the Walrus Sovereign memory architecture! Please add an auto scanner.',
  })
  assert.equal(result.valid, true)
  assert.equal(result.error, undefined)
})

test('Feedback validation: rejects invalid or missing email', () => {
  const result = validateFeedback({
    email: 'not-an-email',
    message: 'Testing invalid email validation',
  })
  assert.equal(result.valid, false)
  assert.match(result.error || '', /valid email/)
})

test('Feedback validation: rejects short or empty message', () => {
  const result = validateFeedback({
    email: 'user@example.com',
    message: 'hi',
  })
  assert.equal(result.valid, false)
  assert.match(result.error || '', /at least 5 characters/)
})

test('Feedback validation: rejects invalid rating out of bounds', () => {
  const result = validateFeedback({
    email: 'user@example.com',
    message: 'Valid feedback message',
    rating: 10,
  })
  assert.equal(result.valid, false)
  assert.match(result.error || '', /between 1 and 5/)
})
