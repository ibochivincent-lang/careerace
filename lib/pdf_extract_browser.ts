/**
 * Client-side PDF text extraction using Mozilla's PDF.js (pdfjs-dist).
 * This runs in the browser and reliably extracts text from PDFs that
 * server-side parsers struggle with (CIDFont encodings, etc.)
 */

/**
 * Extract all text from a PDF File object using PDF.js in the browser.
 * Returns the concatenated text from every page, separated by double newlines.
 */
export async function extractPdfTextInBrowser(file: File): Promise<string> {
  // Dynamic import so the bundle only includes pdfjs-dist when this is called
  const pdfjs = await import('pdfjs-dist')

  // Set up the worker (required by pdfjs-dist v4+)
  // Use the bundled worker from the package
  if (typeof window !== 'undefined') {
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  }

  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    // Disable font decoding for better text extraction on encoded PDFs
    disableFontFace: true,
  })

  const pdf = await loadingTask.promise
  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Build text from items, respecting line breaks via Y-position changes
    let lastY: number | null = null
    let lineText = ''

    for (const item of textContent.items) {
      if ('str' in item && item.str) {
        const currentY = 'transform' in item ? (item.transform as number[])[5] : null

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 2) {
          // New line detected via Y-position change
          if (lineText.trim()) {
            pageTexts.push(lineText.trim())
          }
          lineText = item.str
        } else {
          // Same line, append with appropriate spacing
          if (item.str === ' ' || lineText.endsWith(' ')) {
            lineText += item.str
          } else if (lineText && item.str.trim()) {
            // Check if there's a gap suggesting a space
            lineText += ' ' + item.str
          } else {
            lineText += item.str
          }
        }

        lastY = currentY
      }
    }

    if (lineText.trim()) {
      pageTexts.push(lineText.trim())
    }

    // Add page separator
    if (pageNum < pdf.numPages) {
      pageTexts.push('')
    }
  }

  // Clean up
  await pdf.destroy()

  const fullText = pageTexts
    .join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return fullText
}
