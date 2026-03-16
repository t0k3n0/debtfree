import type { Debt } from './storage'

export interface PayoffMonth {
  month: number
  debts: {
    name: string
    balance: number
    payment: number
    interest: number
  }[]
  totalBalance: number
  totalPayment: number
}

export interface PayoffResult {
  possible: boolean
  months: number
  totalInterest: number
  totalPaid: number
  schedule: PayoffMonth[]
  method: 'snowball' | 'avalanche'
}

export function calculatePayoff(
  debts: Debt[],
  monthlyBudget: number,
  method: 'snowball' | 'avalanche'
): PayoffResult {
  const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0)
  const extraCash = monthlyBudget - totalMinPayments

  if (extraCash <= 0) {
    return {
      possible: false,
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      method,
    }
  }

  // Clone debts so we don't mutate originals
  const working = debts.map((d) => ({
    ...d,
    balance: d.balance,
    minPayment: d.minPayment,
  }))

  // Sort: snowball = smallest balance first, avalanche = highest APR first
  if (method === 'snowball') {
    working.sort((a, b) => a.balance - b.balance)
  } else {
    working.sort((a, b) => b.apr - a.apr)
  }

  const schedule: PayoffMonth[] = []
  let totalInterest = 0
  let totalPaid = 0
  let month = 0
  let currentExtra = extraCash

  while (working.some((d) => d.balance > 0.01) && month < 600) {
    month++
    const monthData: PayoffMonth = {
      month,
      debts: [],
      totalBalance: 0,
      totalPayment: 0,
    }

    // Find first debt with balance > 0 (target for extra payment)
    const targetIdx = working.findIndex((d) => d.balance > 0.01)

    for (let i = 0; i < working.length; i++) {
      const debt = working[i]
      if (debt.balance <= 0.01) {
        monthData.debts.push({ name: debt.name, balance: 0, payment: 0, interest: 0 })
        continue
      }

      const interest = debt.balance * (debt.apr / 100 / 12)
      totalInterest += interest
      debt.balance += interest

      let payment = debt.minPayment
      if (i === targetIdx) {
        payment += currentExtra
      }

      // Don't overpay
      if (payment > debt.balance) {
        payment = debt.balance
      }

      debt.balance -= payment
      totalPaid += payment

      monthData.debts.push({
        name: debt.name,
        balance: Math.max(0, debt.balance),
        payment,
        interest,
      })

      // If this debt is now paid off, roll its min payment into extra
      if (debt.balance <= 0.01 && debt.balance >= -0.01) {
        debt.balance = 0
        currentExtra += debt.minPayment
      }
    }

    monthData.totalBalance = working.reduce((s, d) => s + Math.max(0, d.balance), 0)
    monthData.totalPayment = monthData.debts.reduce((s, d) => s + d.payment, 0)
    schedule.push(monthData)
  }

  return {
    possible: true,
    months: month,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    schedule,
    method,
  }
}
