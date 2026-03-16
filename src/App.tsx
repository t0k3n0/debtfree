import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import DebtPlan from './pages/DebtPlan'
import MealPlan from './pages/MealPlan'
import Support from './pages/Support'

function AppRoutes() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">DebtFree</span>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/support" className="text-xs text-[#FFDD00] hover:text-[#E5C700] transition-colors font-medium">
            ☕ Support
          </NavLink>
          <button onClick={logout} className="text-xs text-slate-500 hover:text-red-500 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-20 max-w-lg mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/debt" element={<DebtPlan />} />
          <Route path="/meals" element={<MealPlan />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1">
        <div className="max-w-lg mx-auto flex justify-around">
          <NavItem to="/" icon="🏠" label="Home" />
          <NavItem to="/upload" icon="📄" label="Upload" />
          <NavItem to="/debt" icon="📊" label="Debt" />
          <NavItem to="/meals" icon="🍽️" label="Meals" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center py-2 px-3 text-xs transition-colors ${
          isActive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`
      }
    >
      <span className="text-lg mb-0.5">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
