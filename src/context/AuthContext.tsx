import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getCurrentUser, login as authLogin, createAccount as authCreate, logout as authLogout } from '../lib/auth'

interface AuthContextType {
  user: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  createAccount: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const result = await authLogin(username, password)
    if (result.ok) setUser(username)
    return result
  }, [])

  const createAccount = useCallback(async (username: string, password: string) => {
    const result = await authCreate(username, password)
    if (result.ok) setUser(username)
    return result
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, createAccount, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
