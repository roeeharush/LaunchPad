import { describe, it, expect } from 'vitest'
import { extractTextFromBuffer } from '@/lib/parsers/extract-text'

describe('extractTextFromBuffer', () => {
  it('throws on unsupported file type', async () => {
    const buf = Buffer.from('hello')
    await expect(extractTextFromBuffer(buf, 'file.txt')).rejects.toThrow('סוג קובץ לא נתמך')
  })

  it('returns a string for a minimal PDF buffer (may be empty)', async () => {
    const minPdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF`
    const buf = Buffer.from(minPdf)
    const result = await extractTextFromBuffer(buf, 'cv.pdf')
    expect(typeof result).toBe('string')
  })
})
