import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'debtfree-data'
const DB_VERSION = 1

export interface Debt {
  id: string
  name: string
  balance: number
  apr: number
  minPayment: number
}

export interface FinancialData {
  username: string
  debts: Debt[]
  monthlyIncome: number
  monthlyExpenses: number
  updatedAt: number
}

export interface MealPlanData {
  username: string
  plan: WeekPlan[]
  groceryList: GroceryItem[]
  totalCost: number
  updatedAt: number
}

export interface WeekPlan {
  week: number
  days: DayPlan[]
}

export interface DayPlan {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
  calories: number
  cost: number
}

export interface GroceryItem {
  name: string
  quantity: number
  unit: string
  price: number
  category: string
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('financial')) {
        db.createObjectStore('financial', { keyPath: 'username' })
      }
      if (!db.objectStoreNames.contains('mealplans')) {
        db.createObjectStore('mealplans', { keyPath: 'username' })
      }
    },
  })
}

export async function saveFinancialData(data: FinancialData): Promise<void> {
  const db = await getDB()
  await db.put('financial', { ...data, updatedAt: Date.now() })
}

export async function getFinancialData(username: string): Promise<FinancialData | undefined> {
  const db = await getDB()
  return db.get('financial', username)
}

export async function saveMealPlan(data: MealPlanData): Promise<void> {
  const db = await getDB()
  await db.put('mealplans', { ...data, updatedAt: Date.now() })
}

export async function getMealPlan(username: string): Promise<MealPlanData | undefined> {
  const db = await getDB()
  return db.get('mealplans', username)
}
