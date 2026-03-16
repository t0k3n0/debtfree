import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Set worker source from local bundle instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export interface PdfParseResult {
  text: string
  possibleDebts: { name: string; amount: number }[]
  possibleIncome: number[]
  errors: string[]
}

export async function parsePdfFile(buffer: ArrayBuffer): Promise<PdfParseResult> {
  const errors: string[] = []

  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      fullText += pageText + '\n'
    }

    // Try to extract dollar amounts
    const amountRegex = /\$[\d,]+\.?\d*/g

    // Try to find debt-like entries (amounts > $100 near keywords)
    const debtKeywords = /(?:loan|credit|card|balance|owed|debt|mortgage|auto|student)/gi
    const possibleDebts: { name: string; amount: number }[] = []

    const lines = fullText.split('\n')
    for (const line of lines) {
      if (debtKeywords.test(line)) {
        const lineAmounts = (line.match(amountRegex) || [])
          .map((a) => parseFloat(a.replace(/[$,]/g, '')))
          .filter((a) => a > 100)
        if (lineAmounts.length > 0) {
          const name = line.replace(amountRegex, '').trim().slice(0, 50) || 'Unknown Debt'
          possibleDebts.push({ name, amount: Math.max(...lineAmounts) })
        }
      }
    }

    // Try to find income-like amounts (deposits, pay, income keywords)
    const incomeKeywords = /(?:deposit|pay|income|salary|wage|direct dep)/gi
    const possibleIncome: number[] = []
    for (const line of lines) {
      if (incomeKeywords.test(line)) {
        const lineAmounts = (line.match(amountRegex) || [])
          .map((a) => parseFloat(a.replace(/[$,]/g, '')))
          .filter((a) => a > 100)
        possibleIncome.push(...lineAmounts)
      }
    }

    if (possibleDebts.length === 0 && possibleIncome.length === 0) {
      errors.push('Could not automatically detect financial data from this PDF. Consider using the Excel template instead.')
    }

    return { text: fullText, possibleDebts, possibleIncome, errors }
  } catch (err) {
    return {
      text: '',
      possibleDebts: [],
      possibleIncome: [],
      errors: [`Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`],
    }
  }
}
