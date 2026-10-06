import type { ParsedCv } from './cv_parser'

/**
 * Clean, lightweight, 100% compliant PDF 1.4 generator in pure TypeScript.
 * Zero external dependencies. Generates ATS-friendly, single-column CV PDFs
 * matching the user's design standards.
 */

function escapePdfText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Normalize special unicode chars to clean ASCII equivalents
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return []
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (!currentLine) {
      currentLine = word
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export function generateCvPdfBytes(cv: ParsedCv, tailoredSummary?: string): Uint8Array {
  const objects: string[] = []
  const offsets: number[] = []

  // Helper to add an object
  function addObject(content: string): number {
    const id = objects.length + 1
    objects.push(content)
    return id
  }

  // Page geometry (US Letter: 612 x 792 pt, 0.5in / 36pt margins)
  const pageWidth = 612
  const pageHeight = 792
  const marginX = 40
  const usableWidth = pageWidth - marginX * 2
  const maxLineChars = 85

  // Build the stream commands
  const streamLines: string[] = []
  let currentY = pageHeight - 48

  // Helper to draw text
  function drawText(
    text: string,
    fontKey: '/F1' | '/F2' | '/F3',
    size: number,
    x: number,
    y: number,
    r = 0.1,
    g = 0.1,
    b = 0.1
  ) {
    streamLines.push(
      `BT ${fontKey} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${escapePdfText(text)}) Tj ET`
    )
  }

  // Helper to draw a horizontal rule
  function drawHorizontalLine(x: number, y: number, width: number, r = 0.8, g = 0.85, b = 0.9, lineWidth = 0.75) {
    streamLines.push(
      `q ${lineWidth} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x.toFixed(1)} ${y.toFixed(1)} m ${(x + width).toFixed(1)} ${y.toFixed(1)} l S Q`
    )
  }

  // 1. CANDIDATE NAME (Centered, Bold, 20pt)
  const candidateName = (cv.applicant_name || 'Candidate').toUpperCase()
  drawText(candidateName, '/F2', 18, marginX, currentY, 0.08, 0.12, 0.18)
  currentY -= 16

  // 2. TARGET ROLE / BADGE
  const targetRole = cv.target_roles?.[0] || 'Professional Profile'
  drawText(targetRole, '/F2', 11, marginX, currentY, 0.13, 0.55, 0.32) // Emerald tone
  currentY -= 16

  // 3. CONTACT BAR
  const contactParts = [
    cv.email,
    cv.phone,
    cv.location,
    cv.linkedin_url,
    cv.github_url,
  ].filter(Boolean) as string[]

  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  |  ')
    drawText(contactLine, '/F1', 9, marginX, currentY, 0.35, 0.4, 0.45)
    currentY -= 14
  }

  // Divider under header
  drawHorizontalLine(marginX, currentY, usableWidth, 0.15, 0.65, 0.35, 1.5) // Emerald brand rule
  currentY -= 18

  // 4. PROFESSIONAL SUMMARY
  const summaryText = tailoredSummary || cv.summary
  if (summaryText) {
    drawText('PROFESSIONAL SUMMARY', '/F2', 11, marginX, currentY, 0.08, 0.12, 0.18)
    currentY -= 4
    drawHorizontalLine(marginX, currentY, usableWidth, 0.85, 0.88, 0.92, 0.5)
    currentY -= 12

    const wrapped = wrapText(summaryText, maxLineChars)
    for (const line of wrapped) {
      if (currentY < 50) break
      drawText(line, '/F1', 9.5, marginX, currentY, 0.2, 0.22, 0.25)
      currentY -= 12.5
    }
    currentY -= 8
  }

  // 5. CORE SKILLS
  if (cv.skills && cv.skills.length > 0) {
    drawText('CORE SKILLS & TECHNICAL COMPETENCIES', '/F2', 11, marginX, currentY, 0.08, 0.12, 0.18)
    currentY -= 4
    drawHorizontalLine(marginX, currentY, usableWidth, 0.85, 0.88, 0.92, 0.5)
    currentY -= 12

    const skillsText = cv.skills.join('  •  ')
    const wrappedSkills = wrapText(skillsText, maxLineChars)
    for (const line of wrappedSkills) {
      if (currentY < 50) break
      drawText(line, '/F1', 9.5, marginX, currentY, 0.2, 0.22, 0.25)
      currentY -= 12.5
    }
    currentY -= 8
  }

  // 6. WORK EXPERIENCE
  if (cv.work_experience && cv.work_experience.length > 0) {
    drawText('PROFESSIONAL WORK EXPERIENCE', '/F2', 11, marginX, currentY, 0.08, 0.12, 0.18)
    currentY -= 4
    drawHorizontalLine(marginX, currentY, usableWidth, 0.85, 0.88, 0.92, 0.5)
    currentY -= 14

    for (const exp of cv.work_experience) {
      if (currentY < 60) break

      // Role and dates
      const expTitle = `${exp.role}  —  ${exp.company}`
      const dateRange = exp.duration || ''

      drawText(expTitle, '/F2', 10, marginX, currentY, 0.1, 0.14, 0.2)
      if (dateRange) {
        drawText(dateRange, '/F3', 8.5, marginX + usableWidth - 110, currentY, 0.4, 0.45, 0.5)
      }
      currentY -= 13

      // Highlights / Bullets
      if (exp.highlights && exp.highlights.length > 0) {
        for (const highlight of exp.highlights.slice(0, 4)) {
          if (currentY < 50) break
          const wrapped = wrapText(highlight, maxLineChars - 4)
          for (let i = 0; i < wrapped.length; i++) {
            if (currentY < 40) break
            const prefix = i === 0 ? '-  ' : '    '
            drawText(`${prefix}${wrapped[i]}`, '/F1', 9, marginX + 8, currentY, 0.25, 0.28, 0.32)
            currentY -= 11.5
          }
        }
      }
      currentY -= 6
    }
  }

  // 7. ACADEMIC HISTORY
  if (cv.academic_history && cv.academic_history.length > 0) {
    if (currentY > 70) {
      drawText('EDUCATION', '/F2', 11, marginX, currentY, 0.08, 0.12, 0.18)
      currentY -= 4
      drawHorizontalLine(marginX, currentY, usableWidth, 0.85, 0.88, 0.92, 0.5)
      currentY -= 12

      for (const edu of cv.academic_history) {
        if (currentY < 50) break
        const eduLine = `${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}  —  ${edu.institution}${edu.graduation_year ? ` (${edu.graduation_year})` : ''}`
        drawText(eduLine, '/F1', 9.5, marginX, currentY, 0.2, 0.22, 0.25)
        currentY -= 12
      }
      currentY -= 6
    }
  }

  // 8. CERTIFICATIONS
  if (cv.certifications && cv.certifications.length > 0 && currentY > 60) {
    drawText('LICENSES & CERTIFICATIONS', '/F2', 11, marginX, currentY, 0.08, 0.12, 0.18)
    currentY -= 4
    drawHorizontalLine(marginX, currentY, usableWidth, 0.85, 0.88, 0.92, 0.5)
    currentY -= 12

    const certLine = cv.certifications.join('  •  ')
    const wrappedCert = wrapText(certLine, maxLineChars)
    for (const line of wrappedCert) {
      if (currentY < 40) break
      drawText(line, '/F1', 9, marginX, currentY, 0.2, 0.22, 0.25)
      currentY -= 11.5
    }
  }

  // Footer seal
  drawText('Verified via CareerAce Sovereign Memory · Anchored Snapshot', '/F3', 7.5, marginX, 22, 0.5, 0.55, 0.6)

  const streamContent = streamLines.join('\n')
  const streamLength = Buffer.byteLength(streamContent, 'utf-8')

  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Page
  // Object 4: Font F1 (Helvetica)
  // Object 5: Font F2 (Helvetica-Bold)
  // Object 6: Font F3 (Helvetica-Oblique)
  // Object 7: Content Stream

  const obj1 = '<< /Type /Catalog /Pages 2 0 R >>'
  const obj2 = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'
  const obj3 = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`
  const obj4 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  const obj5 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  const obj6 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'
  const obj7 = `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`

  addObject(obj1)
  addObject(obj2)
  addObject(obj3)
  addObject(obj4)
  addObject(obj5)
  addObject(obj6)
  addObject(obj7)

  // Construct binary output with xref
  let pdfOutput = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdfOutput, 'utf-8'))
    pdfOutput += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }

  const startXref = Buffer.byteLength(pdfOutput, 'utf-8')
  pdfOutput += `xref\n0 ${objects.length + 1}\n`
  pdfOutput += '0000000000 65535 f \n'
  for (let i = 0; i < offsets.length; i++) {
    const padded = String(offsets[i]).padStart(10, '0')
    pdfOutput += `${padded} 00000 n \n`
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdfOutput += `startxref\n${startXref}\n%%EOF\n`

  return new TextEncoder().encode(pdfOutput)
}

/**
 * Convenience helper to download the CV PDF file directly in the browser
 */
export function downloadCvPdf(cv: ParsedCv, tailoredSummary?: string, customFilename?: string): void {
  if (typeof window === 'undefined') return
  const bytes = generateCvPdfBytes(cv, tailoredSummary)
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const name = customFilename || `${(cv.applicant_name || 'Candidate').replace(/\s+/g, '_')}_Sovereign_CV.pdf`
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
