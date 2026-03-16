import { openDB, type IDBPDatabase } from 'idb'

interface UserAccount {
  username: string
  passwordHash: string
  createdAt: number
}

const DB_NAME = 'debtfree-auth'
const STORE_NAME = 'accounts'

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'username' })
      }
    },
  })
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function createAccount(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const db = await getDB()
  const existing = await db.get(STORE_NAME, username)
  if (existing) {
    return { ok: false, error: 'Username already exists' }
  }
  const passwordHash = await hashPassword(password)
  const account: UserAccount = { username, passwordHash, createdAt: Date.now() }
  await db.put(STORE_NAME, account)
  sessionStorage.setItem('debtfree-user', username)
  return { ok: true }
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const db = await getDB()
  const account = await db.get(STORE_NAME, username) as UserAccount | undefined
  if (!account) {
    return { ok: false, error: 'Account not found' }
  }
  const passwordHash = await hashPassword(password)
  if (account.passwordHash !== passwordHash) {
    return { ok: false, error: 'Incorrect password' }
  }
  sessionStorage.setItem('debtfree-user', username)
  return { ok: true }
}

export function logout(): void {
  sessionStorage.removeItem('debtfree-user')
}

export function getCurrentUser(): string | null {
  return sessionStorage.getItem('debtfree-user')
}

export async function deleteAccount(username: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, username)
  sessionStorage.removeItem('debtfree-user')
}

export async function hasAnyAccount(): Promise<boolean> {
  const db = await getDB()
  const count = await db.count(STORE_NAME)
  return count > 0
}
