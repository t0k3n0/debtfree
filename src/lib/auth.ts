import { openDB, type IDBPDatabase } from 'idb'

interface UserAccount {
  username: string
  passwordHash: string
  passwordSalt: string
  createdAt: number
}

const DB_NAME = 'debtfree-auth'
const STORE_NAME = 'accounts'
const LOCKOUT_KEY = 'debtfree-lockout'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'username' })
      }
    },
  })
}

async function hashPassword(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 310_000 },
    keyMaterial,
    256,
  )
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return { hash: hashHex, salt: saltHex }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function checkLockout(): { locked: boolean; error?: string } {
  const data = sessionStorage.getItem(LOCKOUT_KEY)
  if (!data) return { locked: false }
  const { attempts, lockedUntil } = JSON.parse(data)
  if (lockedUntil && Date.now() < lockedUntil) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000)
    return { locked: true, error: `Too many attempts. Try again in ${secs}s.` }
  }
  if (lockedUntil && Date.now() >= lockedUntil) {
    sessionStorage.removeItem(LOCKOUT_KEY)
    return { locked: false }
  }
  if (attempts >= MAX_ATTEMPTS) {
    const lockedUntilMs = Date.now() + LOCKOUT_MS
    sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, lockedUntil: lockedUntilMs }))
    return { locked: true, error: `Too many attempts. Try again in ${LOCKOUT_MS / 1000}s.` }
  }
  return { locked: false }
}

function recordFailedAttempt(): void {
  const data = sessionStorage.getItem(LOCKOUT_KEY)
  const attempts = data ? JSON.parse(data).attempts + 1 : 1
  sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts }))
}

function clearLockout(): void {
  sessionStorage.removeItem(LOCKOUT_KEY)
}

export async function createAccount(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (username.length > 32) return { ok: false, error: 'Username too long (max 32 chars)' }
  const db = await getDB()
  const existing = await db.get(STORE_NAME, username)
  if (existing) {
    return { ok: false, error: 'Username already exists' }
  }
  const { hash, salt } = await hashPassword(password)
  const account: UserAccount = { username, passwordHash: hash, passwordSalt: salt, createdAt: Date.now() }
  await db.put(STORE_NAME, account)
  sessionStorage.setItem('debtfree-user', username)
  return { ok: true }
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const lockout = checkLockout()
  if (lockout.locked) return { ok: false, error: lockout.error }

  const db = await getDB()
  const account = await db.get(STORE_NAME, username) as UserAccount | undefined
  if (!account) {
    recordFailedAttempt()
    return { ok: false, error: 'Account not found' }
  }

  // Handle legacy accounts that used plain SHA-256 (no salt)
  if (!account.passwordSalt) {
    // Migrate: verify with old method, then upgrade
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const oldHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
    if (account.passwordHash !== oldHash) {
      recordFailedAttempt()
      return { ok: false, error: 'Incorrect password' }
    }
    // Upgrade to PBKDF2
    const { hash, salt } = await hashPassword(password)
    account.passwordHash = hash
    account.passwordSalt = salt
    await db.put(STORE_NAME, account)
    clearLockout()
    sessionStorage.setItem('debtfree-user', username)
    return { ok: true }
  }

  const saltBytes = hexToBytes(account.passwordSalt)
  const { hash } = await hashPassword(password, saltBytes)
  if (account.passwordHash !== hash) {
    recordFailedAttempt()
    return { ok: false, error: 'Incorrect password' }
  }
  clearLockout()
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
}

export async function hasAnyAccount(): Promise<boolean> {
  const db = await getDB()
  const count = await db.count(STORE_NAME)
  return count > 0
}
