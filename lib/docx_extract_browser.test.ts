import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseWordDocumentXml } from './docx_extract_browser.ts'

describe('Client-Side DOCX Text Extractor', () => {
  it('extracts paragraphs and bullet lists correctly from word/document.xml', () => {
    const mockXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>Ibochi Vincent</w:t></w:r>
          </w:p>
          <w:p>
            <w:r><w:t>Chief Marine Engineer · STCW III/2</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>
            <w:r><w:t>Overhauled 2-stroke main propulsion diesel engine with zero downtime</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `

    const result = parseWordDocumentXml(mockXml)
    assert.ok(result.includes('Ibochi Vincent'))
    assert.ok(result.includes('Chief Marine Engineer'))
    assert.ok(result.includes('• Overhauled 2-stroke main propulsion'))
  })
})
