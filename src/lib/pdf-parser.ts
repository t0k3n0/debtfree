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

    const amountRegex = /\$[\d,]+\.?\d*/g

    // Expanded debt keywords to catch common creditor names
    const debtKeywords =
      /(?:loan|credit|card|balance|owed|debt|mortgage|auto|student|visa|mastercard|amex|capital\s*one|discover|quicksilver|sapphire|store\s*card|best\s*buy|amazon|personal|sallie\s*mae|navient|toyota|honda|ford|chase|wells\s*fargo|citi|synchrony|marcus|sofi|lending|financi)/i

    const possibleDebts: { name: string; amount: number }[] = []

    // Split text into chunks by looking for dollar amounts and nearby text
    // PDF tables often merge into one line, so scan with a sliding window
    const segments = fullText.split(/(?=\$[\d,]+\.?\d*)/)

    for (const segment of segments) {
      if (!debtKeywords.test(segment)) continue

      const lineAmounts = (segment.match(amountRegex) || [])
        .map((a) => parseFloat(a.replace(/[$,]/g, '')))
        .filter((a) => a > 100)

      if (lineAmounts.length > 0) {
        // Clean up the name: remove dollar amounts, control chars, extra whitespace
        let name = segment
          .replace(amountRegex, '')
          .replace(/[\u0000-\u001F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
          .replace(/[\d.,%]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 50)

        // Skip if name is just whitespace or too short
        if (name.length < 3) name = 'Unknown Debt'

        // Avoid duplicates by checking if we already have a similar name
        const isDuplicate = possibleDebts.some(
          (d) => d.name.toLowerCase().includes(name.toLowerCase().slice(0, 10)) ||
                 name.toLowerCase().includes(d.name.toLowerCase().slice(0, 10))
        )
        if (!isDuplicate) {
          possibleDebts.push({ name, amount: Math.max(...lineAmounts) })
        }
      }
    }

    // Also try line-by-line for well-structured PDFs
    const lines = fullText.split('\n')
    for (const line of lines) {
      if (!debtKeywords.test(line)) continue

      // Split long lines into smaller chunks around dollar amounts
      const chunks = line.split(/\s{2,}/)
      for (const chunk of chunks) {
        if (!debtKeywords.test(chunk)) continue

        const chunkAmounts = (chunk.match(amountRegex) || [])
          .map((a) => parseFloat(a.replace(/[$,]/g, '')))
          .filter((a) => a > 100)

        if (chunkAmounts.length > 0) {
          let name = chunk
            .replace(amountRegex, '')
            .replace(/[\u0000-\u001F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
            .replace(/[\d.,%]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 50)

          if (name.length < 3) name = 'Unknown Debt'

          const isDuplicate = possibleDebts.some(
            (d) => d.name.toLowerCase().includes(name.toLowerCase().slice(0, 10)) ||
                   name.toLowerCase().includes(d.name.toLowerCase().slice(0, 10))
          )
          if (!isDuplicate) {
            possibleDebts.push({ name, amount: Math.max(...chunkAmounts) })
          }
        }
      }
    }

    // Income detection with expanded keywords
    const incomeKeywords =
      /(?:deposit|pay(?:roll)?|income|salary|wage|direct\s*dep|employer|earnings)/i
    const possibleIncome: number[] = []

    // Use segments approach for income too
    for (const segment of segments) {
      if (!incomeKeywords.test(segment)) continue
      const segAmounts = (segment.match(amountRegex) || [])
        .map((a) => parseFloat(a.replace(/[$,]/g, '')))
        .filter((a) => a > 100 && a < 100000) // reasonable income range
      possibleIncome.push(...segAmounts)
    }

    // Also check line by line
    for (const line of lines) {
      if (!incomeKeywords.test(line)) continue
      const lineAmounts = (line.match(amountRegex) || [])
        .map((a) => parseFloat(a.replace(/[$,]/g, '')))
        .filter((a) => a > 100 && a < 100000)
      possibleIncome.push(...lineAmounts)
    }

    // Deduplicate income values
    const uniqueIncome = [...new Set(possibleIncome)]

    if (possibleDebts.length === 0 && uniqueIncome.length === 0) {
      errors.push('Could not automatically detect financial data from this PDF. Consider using the Excel template instead.')
    }

    return { text: fullText, possibleDebts, possibleIncome: uniqueIncome, errors }
  } catch (err) {
    return {
      text: '',
      possibleDebts: [],
      possibleIncome: [],
      errors: [`Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`],
    }
  }
}
