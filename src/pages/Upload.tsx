import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { parseExcelFile, generateTemplate } from '../lib/excel-parser'
import { parsePdfFile } from '../lib/pdf-parser'
import { saveFinancialData, getFinancialData, type Debt } from '../lib/storage'
import { Disclaimer } from '../components/Disclaimer'

export default function Upload() {
  const { user } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [debts, setDebts] = useState<Debt[]>([])
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [messages, setMessages] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  // Load existing data on mount
  useEffect(() => {
    if (!user) return
    getFinancialData(user).then((data) => {
      if (data) {
        setDebts(data.debts)
        setIncome(data.monthlyIncome)
        setExpenses(data.monthlyExpenses)
      }
    })
  }, [user])

  const handleFile = useCallback(async (file: File) => {
    setMessages([])
    setSaved(false)

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessages(['File too large. Maximum size is 5 MB.'])
      return
    }

    // Validate file type by extension and MIME
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf'
    const isSpreadsheet = /\.(xlsx|xls|csv)$/i.test(file.name)
    if (!isPdf && !isSpreadsheet) {
      setMessages(['Unsupported file type. Please upload .xlsx, .xls, .csv, or .pdf files.'])
      return
    }

    const buffer = await file.arrayBuffer()

    if (isPdf) {
      const result = await parsePdfFile(buffer)
      setMessages(result.errors)
      if (result.possibleDebts.length > 0) {
        setDebts(result.possibleDebts.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          balance: d.amount,
          apr: 0,
          minPayment: 25,
        })))
        setMessages((m) => [...m, `Found ${result.possibleDebts.length} possible debt(s) from PDF. Please verify and adjust APR/min payment values.`])
      }
      if (result.possibleIncome.length > 0) {
        setIncome(Math.max(...result.possibleIncome))
        setMessages((m) => [...m, `Detected possible income: $${Math.max(...result.possibleIncome)}`])
      }
    } else {
      const result = parseExcelFile(buffer)
      setDebts(result.debts)
      setIncome(result.monthlyIncome)
      setExpenses(result.monthlyExpenses)
      setMessages(result.errors)
      if (result.debts.length > 0) {
        setMessages((m) => [...m, `Parsed ${result.debts.length} debt(s) from spreadsheet.`])
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const downloadTemplate = () => {
    const buffer = generateTemplate()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'debtfree-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateDebt = (id: string, field: keyof Debt, value: string) => {
    setDebts((prev) => prev.map((d) => {
      if (d.id !== id) return d
      if (field === 'name') return { ...d, name: value }
      return { ...d, [field]: parseFloat(value) || 0 }
    }))
  }

  const addDebt = () => {
    setDebts((prev) => [...prev, { id: crypto.randomUUID(), name: '', balance: 0, apr: 0, minPayment: 25 }])
  }

  const removeDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  const saveData = async () => {
    if (!user) return
    await saveFinancialData({
      username: user,
      debts,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      updatedAt: Date.now(),
    })
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Financial Data</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload a spreadsheet or PDF, or enter your data manually below.
        </p>
      </div>

      {/* Template download */}
      <button
        onClick={downloadTemplate}
        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        📥 Download Excel template
      </button>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700'
        }`}
      >
        <div className="text-3xl mb-2">📁</div>
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          Drag & drop your .xlsx, .csv, or .pdf file here
        </p>
        <label className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors text-sm">
          Choose File
          <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={handleFileInput} className="hidden" />
        </label>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded p-2">
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Manual entry / edit parsed data */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Debts</h2>
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <input
                value={debt.name}
                onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                maxLength={64}
                placeholder="Debt name (e.g. Credit Card)"
                className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button onClick={() => removeDebt(debt.id)} className="ml-2 text-red-500 text-sm hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Balance ($)</label>
                <input
                  type="number"
                  value={debt.balance || ''}
                  onChange={(e) => updateDebt(debt.id, 'balance', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">APR (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={debt.apr || ''}
                  onChange={(e) => updateDebt(debt.id, 'apr', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Min Payment ($)</label>
                <input
                  type="number"
                  value={debt.minPayment || ''}
                  onChange={(e) => updateDebt(debt.id, 'minPayment', e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addDebt} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
          + Add a debt
        </button>
      </div>

      {/* Income & Expenses */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Income ($)</label>
          <input
            type="number"
            value={income || ''}
            onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="4500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Expenses ($)</label>
          <input
            type="number"
            value={expenses || ''}
            onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="2000"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveData}
        disabled={debts.length === 0}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
      >
        {saved ? '✓ Saved!' : 'Save Financial Data'}
      </button>

      {saved && (
        <div className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
          Data saved locally. Head to the <a href="/debt" className="underline">Debt Planner</a> to see your payoff plan.
        </div>
      )}

      <Disclaimer type="privacy" />
    </div>
  )
}
