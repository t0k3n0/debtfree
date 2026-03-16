import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, createAccount } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter both username and password')
      return
    }
    setLoading(true)
    const result = isSignup
      ? await createAccount(username.trim(), password)
      : await login(username.trim(), password)
    setLoading(false)
    if (!result.ok) setError(result.error || 'Something went wrong')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero + Login */}
      <div className="flex flex-col items-center justify-center px-4 pt-12 pb-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💰</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">DebtFree</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Free debt payoff calculator. 100% private.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={32}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Enter a username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Enter a password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setIsSignup(!isSignup); setError('') }}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </div>
          </div>

          <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-400 text-center">
            🔒 Your account is stored locally on this device. No data is sent to any server.
          </div>
        </div>
      </div>

      {/* SEO Landing Content */}
      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-12">
        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">100% Private</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All data stays on your device. Zero tracking.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Snowball vs Avalanche</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compare both methods side by side.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
            <div className="text-2xl mb-2">🍽️</div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">$250/mo Meals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Budget meal plans using Walmart prices.</p>
          </div>
        </div>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Upload or enter your financial data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Import an Excel spreadsheet, PDF bank statement, or type it in manually. We support .xlsx, .xls, .csv, and .pdf files.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Get your debt payoff plan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">See snowball and avalanche strategies compared side by side. Know exactly how many months until you're debt-free and how much interest you'll pay.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Plan your meals on a budget</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get a 4-week meal plan for under $250/month using real Walmart Great Value prices. Includes a full grocery list with quantities.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features detail */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Debt Snowball Calculator', desc: 'Pay off smallest balances first for quick wins and motivation' },
              { title: 'Debt Avalanche Calculator', desc: 'Pay off highest APR first to minimize total interest paid' },
              { title: 'Excel & PDF Upload', desc: 'Import your bank statements or spreadsheets — parsed locally in your browser' },
              { title: 'Export to Excel', desc: 'Download your complete payoff schedule as a spreadsheet' },
              { title: 'Budget Meal Planner', desc: 'Weekly meal plans with breakfast, lunch, dinner, and snacks for ~$62/week' },
              { title: 'Reality Check', desc: 'Honest assessment when your situation needs more than a calculator' },
              { title: 'Works on Your Phone', desc: 'Add to your homescreen and use it like a native app (PWA)' },
              { title: 'No Ads, No Tracking', desc: 'Free forever. No data collection, no analytics, no monetization' },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ for SEO */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is DebtFree really free?',
                a: 'Yes, completely free. No premium tier, no ads, no in-app purchases. If you find it helpful, you can optionally buy the developer a coffee.',
              },
              {
                q: 'Is my financial data safe?',
                a: 'Your data never leaves your device. All calculations happen locally in your browser using IndexedDB storage. There is no server, no database, and no way for us to see your data. If you clear your browser data, it\'s gone.',
              },
              {
                q: 'What is the debt snowball method?',
                a: 'The snowball method pays off your smallest debt first while making minimum payments on everything else. When the smallest debt is paid off, you roll that payment into the next smallest. It builds momentum and motivation.',
              },
              {
                q: 'What is the debt avalanche method?',
                a: 'The avalanche method pays off the debt with the highest APR (interest rate) first. Mathematically, this saves the most money on interest, but it may take longer to see your first debt eliminated.',
              },
              {
                q: 'Can I really eat for $250 a month?',
                a: 'Yes. The meal planner uses actual Walmart Great Value prices based on USDA Thrifty Food Plan guidelines ($247-$309/month for a single adult). It generates 4 weeks of balanced meals with a complete grocery list.',
              },
              {
                q: 'Does it work on my phone?',
                a: 'Yes. DebtFree is a Progressive Web App (PWA). On iPhone, tap Share then "Add to Home Screen." On Android, tap the menu and "Add to Home Screen." It works like a native app.',
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 group">
                <summary className="font-semibold text-slate-900 dark:text-white text-sm cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 dark:text-slate-600 space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p>DebtFree is not financial advice. This is a calculator with disclaimers. If you are struggling with debt, contact a nonprofit credit counselor at <a href="https://www.nfcc.org" target="_blank" rel="noopener noreferrer" className="underline">NFCC.org</a>.</p>
          <p>Open source on <a href="https://github.com/t0k3n0/debtfree" target="_blank" rel="noopener noreferrer" className="underline">GitHub</a>.</p>
        </footer>
      </div>
    </div>
  )
}
