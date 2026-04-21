import mammoth from 'mammoth'

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text.trim()
    } finally {
      await parser.destroy()
    }
  }

  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  throw new Error('סוג קובץ לא נתמך. יש להעלות PDF או DOCX בלבד.')
}
