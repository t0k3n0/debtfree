import * as XLSX from 'xlsx'
import type { Debt } from './storage'

export interface ParsedFinancials {
  debts: Debt[]
  monthlyIncome: number
  monthlyExpenses: number
  errors: string[]
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedFinancials {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const errors: string[] = []
  const debts: Debt[] = []
  let monthlyIncome = 0
  let monthlyExpenses = 0

  // Try to find debts sheet
  const debtsSheet = findSheet(workbook, ['debts', 'debt', 'loans', 'balances'])
  if (debtsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(debtsSheet)
    for (const row of rows) {
      const name = findField(row, ['name', 'description', 'creditor', 'lender']) as string
      const balance = parseNumber(findField(row, ['balance', 'amount', 'owed', 'total']))
      const apr = parseNumber(findField(row, ['apr', 'rate', 'interest', 'interest rate', 'apr%']))
      const minPayment = parseNumber(findField(row, ['min payment', 'minimum', 'payment', 'min']))

      if (name && balance > 0) {
        debts.push({
          id: crypto.randomUUID(),
          name: String(name),
          balance,
          apr: apr || 0,
          minPayment: minPayment || 25,
        })
      }
    }
    if (debts.length === 0) errors.push('No valid debts found in debts sheet')
  } else {
    errors.push('No "Debts" sheet found. Looking for columns in first sheet...')
    // Fallback: try first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    if (firstSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet)
      for (const row of rows) {
        const name = findField(row, ['name', 'description', 'creditor'])
        const balance = parseNumber(findField(row, ['balance', 'amount', 'owed']))
        const apr = parseNumber(findField(row, ['apr', 'rate', 'interest']))
        const minPayment = parseNumber(findField(row, ['min payment', 'minimum', 'payment']))
        if (name && balance > 0) {
          debts.push({
            id: crypto.randomUUID(),
            name: String(name),
            balance,
            apr: apr || 0,
            minPayment: minPayment || 25,
          })
        }
      }
    }
  }

  // Try to find income sheet
  const incomeSheet = findSheet(workbook, ['income', 'earnings', 'salary'])
  if (incomeSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(incomeSheet)
    for (const row of rows) {
      const amount = parseNumber(findField(row, ['amount', 'monthly', 'income', 'total']))
      monthlyIncome += amount
    }
  }

  // Try to find expenses sheet
  const expensesSheet = findSheet(workbook, ['expenses', 'spending', 'bills'])
  if (expensesSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(expensesSheet)
    for (const row of rows) {
      const amount = parseNumber(findField(row, ['amount', 'monthly', 'cost', 'total']))
      monthlyExpenses += amount
    }
  }

  return { debts, monthlyIncome, monthlyExpenses, errors }
}

function findSheet(workbook: XLSX.WorkBook, names: string[]): XLSX.WorkSheet | null {
  for (const name of names) {
    const match = workbook.SheetNames.find((s) => s.toLowerCase().includes(name))
    if (match) return workbook.Sheets[match]
  }
  return null
}

function findField(row: Record<string, unknown>, names: string[]): unknown {
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase().trim()
    if (names.some((n) => lower.includes(n))) return row[key]
  }
  return undefined
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[$,%\s]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

export function generateTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  const debtsData = [
    { Name: 'Credit Card', Balance: 5000, 'APR%': 22.99, 'Min Payment': 100 },
    { Name: 'Student Loan', Balance: 25000, 'APR%': 5.5, 'Min Payment': 280 },
    { Name: 'Car Loan', Balance: 12000, 'APR%': 7.0, 'Min Payment': 350 },
  ]
  const debtsSheet = XLSX.utils.json_to_sheet(debtsData)
  XLSX.utils.book_append_sheet(workbook, debtsSheet, 'Debts')

  const incomeData = [
    { Source: 'Salary (after tax)', 'Monthly Amount': 4000 },
    { Source: 'Side gig', 'Monthly Amount': 500 },
  ]
  const incomeSheet = XLSX.utils.json_to_sheet(incomeData)
  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income')

  const expensesData = [
    { Category: 'Rent', 'Monthly Amount': 1200 },
    { Category: 'Utilities', 'Monthly Amount': 150 },
    { Category: 'Food', 'Monthly Amount': 250 },
    { Category: 'Transportation', 'Monthly Amount': 200 },
    { Category: 'Insurance', 'Monthly Amount': 150 },
    { Category: 'Phone', 'Monthly Amount': 50 },
  ]
  const expensesSheet = XLSX.utils.json_to_sheet(expensesData)
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses')

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

// Prevent spreadsheet formula injection (DDE attacks)
function sanitizeCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`
  return value
}

export function exportPayoffSchedule(
  schedule: { month: number; debts: { name: string; balance: number; payment: number }[]; totalBalance: number }[],
  method: string
): ArrayBuffer {
  const workbook = XLSX.utils.book_new()

  const rows = schedule.map((m) => {
    const row: Record<string, number | string> = { Month: m.month }
    for (const d of m.debts) {
      const safeName = sanitizeCell(d.name)
      row[`${safeName} Balance`] = Math.round(d.balance * 100) / 100
      row[`${safeName} Payment`] = Math.round(d.payment * 100) / 100
    }
    row['Total Remaining'] = Math.round(m.totalBalance * 100) / 100
    return row
  })

  const sheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, `${method} Payoff Schedule`)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}
