import { useAuth } from '../context/AuthContext'
import { Disclaimer } from '../components/Disclaimer'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome, {user}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Your financial planning toolkit — 100% private
        </p>
      </div>

      <div className="grid gap-4">
        <a
          href="/upload"
          className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-500 transition-colors"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Upload Financial Data</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Import your spreadsheet or PDF to get started. Download our template if you need one.
          </p>
        </a>

        <a
          href="/debt"
          className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-500 transition-colors"
        >
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Debt Payoff Planner</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Snowball vs Avalanche — see which method gets you debt-free faster.
          </p>
        </a>

        <a
          href="/meals"
          className="block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-500 transition-colors"
        >
          <div className="text-2xl mb-2">🍽️</div>
          <h3 className="font-semibold text-slate-900 dark:text-white">$250/mo Meal Planner</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Budget meal plans using Walmart prices. Feeds one person for under $250/month.
          </p>
        </a>
      </div>

      <Disclaimer type="privacy" />
    </div>
  )
}
