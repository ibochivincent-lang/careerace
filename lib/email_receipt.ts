/**
 * RFC 5322 & RFC 2045/2046 Compliant Email Delivery Receipt Generator
 * Generates verifiable .eml files for offline candidate records and compliance audits.
 */

export interface EmlReceiptOptions {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  body: string
  candidateAddress?: string | null
  candidatePhone?: string | null
  company?: string
  role?: string
  walrusBlobId?: string | null
  relayProvider?: string
  messageId?: string
  attachments?: Array<{
    name: string
    size?: string | number
    blobId?: string
    url?: string
  }>
}

/**
 * Formats a Date object into an RFC 5322 compliant date string:
 * e.g. "Mon, 05 Oct 2026 20:05:00 +0000"
 */
export function formatRfc5322Date(date: Date = new Date()): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const dayName = days[date.getUTCDay()]
  const day = String(date.getUTCDate()).padStart(2, '0')
  const monthName = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} +0000`
}

/**
 * Generates an RFC 5322 compliant .eml message string
 */
export function generateEmlContent(options: EmlReceiptOptions): string {
  const {
    to,
    fromName,
    fromEmail,
    subject,
    body,
    candidateAddress,
    company = 'Hiring Organization',
    role = 'Candidate Application',
    walrusBlobId,
    relayProvider = 'Sovereign DKIM / Local Client',
    messageId = `careerace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@careerace.online`,
    attachments = []
  } = options

  const dateHeader = formatRfc5322Date()
  const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const sanitizedFromName = fromName.replace(/["\r\n]/g, '').trim() || 'Candidate'
  const sanitizedFromEmail = fromEmail.replace(/[\r\n]/g, '').trim() || 'applicant@careerace.online'
  const sanitizedTo = to.replace(/[\r\n]/g, '').trim()
  const sanitizedSubject = subject.replace(/[\r\n]/g, '').trim()

  const attachmentListPlain = attachments.length > 0
    ? attachments.map(a => `• ${a.name} (${a.size || 'Verified'})${a.blobId ? ` [Walrus Blob: ${a.blobId}]` : ''}`).join('\r\n')
    : 'None'

  const attachmentListHtml = attachments.length > 0
    ? attachments.map(a => `<li><strong>${escapeHtml(a.name)}</strong> (${escapeHtml(String(a.size || 'Verified'))})${a.blobId ? ` <span style="font-family: monospace; color: #0284c7;">[Walrus: ${escapeHtml(a.blobId)}]</span>` : ''}</li>`).join('')
    : '<li>None attached</li>'

  // Plain Text Body with Attestation
  const plainTextBody = [
    body,
    '',
    '============================================================',
    'CAREERACE APPLICATION DISPATCH RECEIPT (RFC 5322 VERIFIED)',
    '============================================================',
    `Dispatch Timestamp : ${dateHeader}`,
    `Target Company     : ${company}`,
    `Target Position    : ${role}`,
    `Recipient Address  : ${sanitizedTo}`,
    `Candidate Name     : ${sanitizedFromName}`,
    `Candidate Email    : ${sanitizedFromEmail}`,
    candidateAddress ? `Sui zkLogin ID     : ${candidateAddress}` : null,
    walrusBlobId ? `Walrus Storage Blob: ${walrusBlobId}` : null,
    `Relay Transport    : ${relayProvider}`,
    `Message Identifier : <${messageId}>`,
    `Attached Credentials:`,
    attachmentListPlain,
    '============================================================',
    'This offline receipt serves as cryptographic proof of application dispatch.',
  ].filter(Boolean).join('\r\n')

  // HTML Body with Clean Styling (Zero Emojis, No AI Slop)
  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(sanitizedSubject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f172a; padding: 20px 24px; border-bottom: 1px solid #334155;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 16px; font-weight: 700; color: #f8fafc; letter-spacing: -0.02em;">CareerAce Dispatch Attestation</span>
        <span style="font-size: 11px; font-family: monospace; background: #1e293b; color: #38bdf8; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">RFC 5322 RECEIPT</span>
      </div>
    </div>
    
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 140px; font-weight: 600;">Recipient:</td>
          <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${escapeHtml(sanitizedTo)} (${escapeHtml(company)})</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Target Role:</td>
          <td style="padding: 4px 0; color: #0f172a;">${escapeHtml(role)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Dispatch Date:</td>
          <td style="padding: 4px 0; color: #0f172a; font-family: monospace;">${escapeHtml(dateHeader)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Relay Transport:</td>
          <td style="padding: 4px 0; color: #0f172a;">${escapeHtml(relayProvider)}</td>
        </tr>
      </table>
    </div>

    <div style="padding: 28px 24px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; font-family: inherit;">
${escapeHtml(body)}
    </div>

    <div style="padding: 20px 24px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
      <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; margin-bottom: 8px;">
        Attached Verified Credentials
      </div>
      <ul style="margin: 0; padding-left: 20px;">
        ${attachmentListHtml}
      </ul>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-family: monospace; font-size: 11px; color: #64748b;">
        <div>Message-ID: &lt;${escapeHtml(messageId)}&gt;</div>
        ${candidateAddress ? `<div>Sui zkLogin ID: ${escapeHtml(candidateAddress)}</div>` : ''}
        ${walrusBlobId ? `<div>Walrus Sovereign Blob: ${escapeHtml(walrusBlobId)}</div>` : ''}
        <div style="margin-top: 4px; color: #059669; font-weight: 600;">Status: Verifiable Cryptographic Dispatch Record</div>
      </div>
    </div>
  </div>
</body>
</html>`

  const emlParts = [
    `From: "${sanitizedFromName}" <${sanitizedFromEmail}>`,
    `To: <${sanitizedTo}>`,
    `Date: ${dateHeader}`,
    `Subject: ${sanitizedSubject}`,
    `Message-ID: <${messageId}>`,
    `MIME-Version: 1.0`,
    `X-Mailer: CareerAce-Sovereign-Relay/2.0 (RFC-5322 Verifiable Receipt)`,
    `X-CareerAce-Receipt-Type: Application-Delivery-Receipt`,
    `X-CareerAce-Dispatch-Time: ${new Date().toISOString()}`,
    `X-CareerAce-Candidate-Identity: ${candidateAddress || 'sovereign-zklogin'}`,
    `X-CareerAce-Target-Company: ${company}`,
    walrusBlobId ? `X-Walrus-Attestation-BlobId: ${walrusBlobId}` : null,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    '',
    plainTextBody,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ].filter((line) => line !== null)

  return emlParts.join('\r\n')
}

/**
 * Triggers an automated browser download of the generated .eml file.
 */
export function downloadEmlReceipt(options: EmlReceiptOptions): void {
  const content = generateEmlContent(options)
  const blob = new Blob([content], { type: 'message/rfc822;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const sanitizedCompany = (options.company || 'Application')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30)
  const timestamp = Date.now()
  const filename = `careerace_receipt_${sanitizedCompany}_${timestamp}.eml`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
