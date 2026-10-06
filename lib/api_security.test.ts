import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkRateLimit,
  executeIdempotent,
  checkAiSpendCap,
  detectBotSubmission,
  validateFileUpload,
  trimApiResponse,
  validateRecordOwnership,
  getLaunchShieldMatrix,
} from './api_security.ts'

test('API Security: enforces sliding-window rate limiting', () => {
  const id = `test-ip-${Date.now()}`
  const first = checkRateLimit(id, 2, 60000)
  assert.equal(first.allowed, true)
  assert.equal(first.remaining, 1)

  const second = checkRateLimit(id, 2, 60000)
  assert.equal(second.allowed, true)
  assert.equal(second.remaining, 0)

  const third = checkRateLimit(id, 2, 60000)
  assert.equal(third.allowed, false)
  assert.equal(third.remaining, 0)
})

test('API Security: guarantees idempotent execution for transactions', async () => {
  let callCount = 0
  const op = async () => {
    callCount += 1
    return { txId: '0x123abc', count: callCount }
  }

  const first = await executeIdempotent('idemp-key-1', op)
  assert.equal(first.result.count, 1)
  assert.equal(first.cached, false)

  const second = await executeIdempotent('idemp-key-1', op)
  assert.equal(second.result.count, 1)
  assert.equal(second.cached, true)
  assert.equal(callCount, 1)
})

test('API Security: enforces AI spend caps per user per day', () => {
  const user = `0x_cap_user_${Date.now()}`
  const check1 = checkAiSpendCap(user, 0.03, 0.05)
  assert.equal(check1.allowed, true)
  assert.equal(check1.currentSpent, 0.03)

  const check2 = checkAiSpendCap(user, 0.03, 0.05)
  assert.equal(check2.allowed, false) // 0.03 + 0.03 > 0.05
})

test('API Security: detects automated bot submissions via honeypot traps', () => {
  const cleanPayload = { name: 'John Doe', email: 'john@example.com' }
  assert.equal(detectBotSubmission(cleanPayload).isBot, false)

  const botPayload = { name: 'Bot', email: 'bot@example.com', _gotcha: 'http://spam.ru' }
  assert.equal(detectBotSubmission(botPayload).isBot, true)
})

test('API Security: validates file uploads and rejects dangerous files or oversized blobs', () => {
  const validPdf = { name: 'resume.pdf', size: 1024 * 1024, type: 'application/pdf' }
  assert.equal(validateFileUpload(validPdf).valid, true)

  const oversized = { name: 'big.pdf', size: 12 * 1024 * 1024, type: 'application/pdf' }
  assert.equal(validateFileUpload(oversized).valid, false)

  const maliciousExe = { name: 'trojan.exe', size: 1024, type: 'application/octet-stream' }
  assert.equal(validateFileUpload(maliciousExe).valid, false)
})

test('API Security: recursively trims private keys and secrets from API payloads', () => {
  const raw = {
    username: 'captain_morgan',
    password_hash: 'argon2$secret',
    api_key: 'sk_live_123',
    profile: {
      rank: 'Master Mariner',
      secret: 'hidden_pass',
    },
  }

  const trimmed = trimApiResponse(raw) as any
  assert.equal(trimmed.username, 'captain_morgan')
  assert.equal(trimmed.profile.rank, 'Master Mariner')
  assert.equal(trimmed.password_hash, undefined)
  assert.equal(trimmed.api_key, undefined)
  assert.equal(trimmed.profile.secret, undefined)
})

test('API Security: verifies resource ownership strictly (IDOR guard)', () => {
  const owner = '0x1111222233334444555566667777888899990000'
  assert.equal(validateRecordOwnership(owner, owner), true)
  assert.equal(validateRecordOwnership(owner, '0xattacker'), false)
  assert.equal(validateRecordOwnership(owner, null), false)
})

test('API Security: verifies that all 28 pre-launch shield items are active', () => {
  const matrix = getLaunchShieldMatrix()
  assert.equal(matrix.length, 28)

  const legalItems = matrix.filter((item) => item.category === 'Legal & Compliance')
  const techItems = matrix.filter((item) => item.category === 'Technical Security')

  assert.equal(legalItems.length, 8)
  assert.equal(techItems.length, 20)

  for (const item of matrix) {
    assert.equal(item.status, 'passed')
    assert.ok(item.title.length > 0)
    assert.ok(item.routeOrFile.length > 0)
  }
})
