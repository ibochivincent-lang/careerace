import test from 'node:test'
import assert from 'node:assert/strict'
import { generateEmlContent, formatRfc5322Date } from './email_receipt.ts'

test('formatRfc5322Date formats valid date', () => {
  const date = new Date('2026-10-05T20:30:00Z')
  const formatted = formatRfc5322Date(date)
  assert.match(formatted, /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} \+0000$/)
  assert.equal(formatted, 'Mon, 05 Oct 2026 20:30:00 +0000')
})

test('generateEmlContent produces standard RFC 5322 headers and body', () => {
  const eml = generateEmlContent({
    to: 'hiring@maersk.com',
    fromName: 'Captain Elena Rostova',
    fromEmail: 'elena@careerace.online',
    subject: 'Application: Senior Propulsion Engineer – Captain Elena Rostova',
    body: 'Please consider my application for the Marine Propulsion Engineer role.',
    candidateAddress: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    company: 'Maersk',
    role: 'Senior Propulsion Engineer',
    walrusBlobId: 'walrus-blob-proof-999',
    relayProvider: 'Sovereign DKIM Relay',
    attachments: [
      { name: 'STCW_Chief_Engineer_License.pdf', size: '2.4 MB', blobId: 'walrus-doc-1' }
    ]
  })

  // Mandatory RFC 5322 headers
  assert.ok(eml.includes('From: "Captain Elena Rostova" <elena@careerace.online>'))
  assert.ok(eml.includes('To: <hiring@maersk.com>'))
  assert.ok(eml.includes('Subject: Application: Senior Propulsion Engineer – Captain Elena Rostova'))
  assert.ok(eml.includes('MIME-Version: 1.0'))
  assert.ok(eml.includes('Content-Type: multipart/alternative; boundary="'))
  assert.ok(eml.includes('X-Mailer: CareerAce-Sovereign-Relay/2.0 (RFC-5322 Verifiable Receipt)'))
  assert.ok(eml.includes('X-CareerAce-Receipt-Type: Application-Delivery-Receipt'))
  assert.ok(eml.includes('X-CareerAce-Candidate-Identity: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'))
  assert.ok(eml.includes('X-Walrus-Attestation-BlobId: walrus-blob-proof-999'))

  // MIME Multipart Sections
  assert.ok(eml.includes('Content-Type: text/plain; charset="utf-8"'))
  assert.ok(eml.includes('CAREERACE APPLICATION DISPATCH RECEIPT (RFC 5322 VERIFIED)'))
  assert.ok(eml.includes('STCW_Chief_Engineer_License.pdf'))

  assert.ok(eml.includes('Content-Type: text/html; charset="utf-8"'))
  assert.ok(eml.includes('<!DOCTYPE html>'))
  assert.ok(eml.includes('CareerAce Dispatch Attestation'))
  assert.ok(eml.includes('hiring@maersk.com (Maersk)'))

  // Zero emojis rule check
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  assert.equal(emojiRegex.test(eml), false, 'Generated .eml must not contain emojis')
})
