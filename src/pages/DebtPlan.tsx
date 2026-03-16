import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getFinancialData, type Debt } from '../lib/storage'
import { calculatePayoff, type PayoffResult } from '../lib/snowball'
import { exportPayoffSchedule } from '../lib/excel-parser'
import { Disclaimer } from '../components/Disclaimer'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DebtPlan() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    getFinancialData(user).then((data) => {
      if (data) {
        setDebts(data.debts)
        setIncome(data.monthlyIncome)
        setExpenses(data.monthlyExpenses)
      }
      setLoaded(true)
    })
  }, [user])

  const totalMinPayments = debts.reduce((s, d) => s + d.minPayment, 0)
  const availableForDebt = income - expenses
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)

  const snowball = useMemo(() =>
    debts.length > 0 ? calculatePayoff(debts, availableForDebt, 'snowball') : null
  , [debts, availableForDebt])

  const avalanche = useMemo(() =>
    debts.length > 0 ? calculatePayoff(debts, availableForDebt, 'avalanche') : null
  , [debts, availableForDebt])

  const chartData = useMemo(() => {
    if (!snowball?.possible || !avalanche?.possible) return []
    const maxMonths = Math.max(snowball.months, avalanche.months)
    const data = []
    for (let i = 0; i <= maxMonths; i++) {
      const sMonth = snowball.schedule[i]
      const aMonth = avalanche.schedule[i]
      data.push({
        month: i,
        snowball: sMonth ? Math.round(sMonth.totalBalance) : 0,
        avalanche: aMonth ? Math.round(aMonth.totalBalance) : 0,
      })
    }
    return data
  }, [snowball, avalanche])

  const downloadSchedule = (result: PayoffResult) => {
    const buffer = exportPayoffSchedule(result.schedule, result.method)
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debtfree-${result.method}-schedule.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!loaded) return <div className="text-center py-12 text-slate-500">Loading...</div>

  if (debts.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">📊</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">No Financial Data Yet</h1>
        <p className="text-slate-500 dark:text-slate-400">
          <a href="/upload" className="text-emerald-600 dark:text-emerald-400 underline">Upload your data</a> or enter it manually to get your debt payoff plan.
        </p>
      </div>
    )
  }

  const impossible = availableForDebt <= totalMinPayments

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Debt Payoff Planner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Total debt: <span className="font-semibold text-slate-900 dark:text-white">${totalDebt.toLocaleString()}</span> across {debts.length} account(s)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Income</div>
          <div className="font-semibold text-slate-900 dark:text-white">${income.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Expenses</div>
          <div className="font-semibold text-slate-900 dark:text-white">${expenses.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">For Debt</div>
          <div className={`font-semibold ${availableForDebt > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            ${availableForDebt.toLocaleString()}
          </div>
        </div>
      </div>

      {impossible ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-3">
          <div className="text-xl">🚨</div>
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Reality Check</h2>
          <p className="text-red-600 dark:text-red-400">
            Your current income (${income.toLocaleString()}) minus expenses (${expenses.toLocaleString()}) leaves ${availableForDebt.toLocaleString()} for debt — but your minimum payments total ${totalMinPayments.toLocaleString()}/month.
          </p>
          <p className="text-red-600 dark:text-red-400 font-semibold">
            A debt payoff plan isn't viable with your current numbers. You need to:
          </p>
          <ul className="text-red-600 dark:text-red-400 list-disc list-inside space-y-1 text-sm">
            <li>Increase your income (side gig, better job, overtime)</li>
            <li>Cut expenses significantly</li>
            <li>Contact creditors to negotiate lower payments</li>
            <li>Consider speaking with a nonprofit credit counselor</li>
          </ul>
        </div>
      ) : (
        <>
          {/* Comparison table */}
          {snowball && avalanche && snowball.possible && avalanche.possible && (
            <div className="grid grid-cols-2 gap-3">
              <ResultCard result={snowball} onDownload={downloadSchedule} />
              <ResultCard result={avalanche} onDownload={downloadSchedule} />
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Balance Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="snowball" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Snowball" />
                  <Area type="monotone" dataKey="avalanche" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Avalanche" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Debt list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your Debts</h3>
            {debts.map((d) => (
              <div key={d.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.apr}% APR · ${d.minPayment}/mo min</div>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">${d.balance.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <Disclaimer type="financial" />
    </div>
  )
}

function ResultCard({ result, onDownload }: { result: PayoffResult; onDownload: (r: PayoffResult) => void }) {
  const isSnowball = result.method === 'snowball'
  const color = isSnowball ? 'emerald' : 'blue'

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3`}>
      <h3 className={`font-semibold text-${color}-600 dark:text-${color}-400 text-sm`}>
        {isSnowball ? '⛄ Snowball' : '🏔️ Avalanche'}
      </h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Debt-free in</span>
          <span className="font-semibold text-slate-900 dark:text-white">{result.months} months</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Years</span>
          <span className="font-semibold text-slate-900 dark:text-white">{(result.months / 12).toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Interest paid</span>
          <span className="font-semibold text-red-500">${result.totalInterest.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total paid</span>
          <span className="font-semibold text-slate-900 dark:text-white">${result.totalPaid.toLocaleString()}</span>
        </div>
      </div>
      <button
        onClick={() => onDownload(result)}
        className={`w-full text-xs py-1.5 rounded-lg border border-${color}-500/30 text-${color}-600 dark:text-${color}-400 hover:bg-${color}-50 dark:hover:bg-${color}-500/10 transition-colors`}
      >
        📥 Export Schedule (.xlsx)
      </button>
    </div>
  )
}
