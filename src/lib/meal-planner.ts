import priceData from '../data/walmart-prices.json'
import type { DayPlan, WeekPlan, GroceryItem } from './storage'

interface FoodItem {
  name: string
  price: number
  caloriesPerServing: number
  proteinPerServing: number
  carbsPerServing: number
  fatPerServing: number
  servings: number
  unit: string
  tags: string[]
}

type DietFilter = 'none' | 'vegetarian' | 'vegan'

const ALL_ITEMS: FoodItem[] = [
  ...priceData.proteins,
  ...priceData.grains,
  ...priceData.dairy,
  ...priceData.produce,
  ...priceData.frozen,
  ...priceData.pantry,
]

// Simple meal templates using item indices from our database
const BREAKFAST_TEMPLATES = [
  { name: 'Oatmeal with banana', items: ['oats', 'bananas', 'honey'], calories: 315, tags: ['vegetarian'] },
  { name: 'Eggs & toast', items: ['eggs', 'bread', 'butter'], calories: 310, tags: ['vegetarian'] },
  { name: 'PB toast with apple', items: ['peanut butter', 'bread', 'apples'], calories: 355, tags: ['vegetarian', 'vegan'] },
  { name: 'Yogurt & oats bowl', items: ['greek yogurt', 'oats', 'honey'], calories: 310, tags: ['vegetarian'] },
  { name: 'Egg & cheese tortilla', items: ['eggs', 'cheddar', 'tortillas'], calories: 390, tags: ['vegetarian'] },
  { name: 'Oatmeal with PB', items: ['oats', 'peanut butter', 'bananas'], calories: 430, tags: ['vegetarian', 'vegan'] },
  { name: 'Rice porridge', items: ['rice', 'eggs', 'soy sauce'], calories: 300, tags: ['vegetarian'] },
]

const LUNCH_TEMPLATES = [
  { name: 'Rice & beans bowl', items: ['rice', 'black beans', 'salsa'], calories: 420, tags: ['vegetarian', 'vegan'] },
  { name: 'Tuna sandwich', items: ['tuna', 'bread', 'onions'], calories: 340, tags: [] },
  { name: 'Chicken & rice', items: ['chicken breast', 'rice', 'broccoli'], calories: 460, tags: [] },
  { name: 'Bean & cheese burrito', items: ['black beans', 'cheddar', 'tortillas'], calories: 450, tags: ['vegetarian'] },
  { name: 'Lentil soup', items: ['lentils', 'carrots', 'onions', 'tomato sauce'], calories: 350, tags: ['vegetarian', 'vegan'] },
  { name: 'Pasta with sauce', items: ['spaghetti', 'tomato sauce', 'onions'], calories: 420, tags: ['vegetarian', 'vegan'] },
  { name: 'PB&J sandwich', items: ['peanut butter', 'bread', 'honey'], calories: 380, tags: ['vegetarian'] },
]

const DINNER_TEMPLATES = [
  { name: 'Chicken stir-fry with rice', items: ['chicken thighs', 'rice', 'mixed vegetables', 'soy sauce'], calories: 550, tags: [] },
  { name: 'Spaghetti & meat sauce', items: ['ground beef', 'spaghetti', 'tomato sauce', 'onions'], calories: 580, tags: [] },
  { name: 'Baked potato & broccoli', items: ['potatoes', 'cheddar', 'broccoli', 'butter'], calories: 480, tags: ['vegetarian'] },
  { name: 'Bean chili', items: ['pinto beans', 'diced tomatoes', 'onions', 'corn'], calories: 420, tags: ['vegetarian', 'vegan'] },
  { name: 'Fish tacos', items: ['tilapia', 'tortillas', 'cabbage', 'salsa'], calories: 450, tags: [] },
  { name: 'Chicken & potato bake', items: ['chicken thighs', 'potatoes', 'onions', 'vegetable oil'], calories: 520, tags: [] },
  { name: 'Macaroni & cheese', items: ['elbow macaroni', 'cheddar', 'milk', 'butter'], calories: 510, tags: ['vegetarian'] },
  { name: 'Rice & lentil dal', items: ['rice', 'lentils', 'onions', 'garlic', 'vegetable oil'], calories: 460, tags: ['vegetarian', 'vegan'] },
  { name: 'Ground turkey & rice bowl', items: ['turkey', 'rice', 'mixed vegetables', 'soy sauce'], calories: 500, tags: [] },
  { name: 'Egg fried rice', items: ['rice', 'eggs', 'mixed vegetables', 'soy sauce', 'vegetable oil'], calories: 480, tags: ['vegetarian'] },
]

const SNACK_TEMPLATES = [
  { name: 'Apple slices', items: ['apples'], calories: 95, tags: ['vegetarian', 'vegan'] },
  { name: 'PB & banana', items: ['peanut butter', 'bananas'], calories: 200, tags: ['vegetarian', 'vegan'] },
  { name: 'Hard-boiled eggs (2)', items: ['eggs'], calories: 140, tags: ['vegetarian'] },
  { name: 'Yogurt', items: ['greek yogurt'], calories: 100, tags: ['vegetarian'] },
  { name: 'Toast with butter', items: ['bread', 'butter'], calories: 170, tags: ['vegetarian'] },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function filterByDiet<T extends { tags: string[] }>(templates: T[], diet: DietFilter): T[] {
  if (diet === 'none') return templates
  return templates.filter((t) => t.tags.includes(diet))
}

function pickRandom<T>(arr: T[], exclude: Set<number> = new Set()): { item: T; index: number } {
  const available = arr.map((item, i) => ({ item, i })).filter(({ i }) => !exclude.has(i))
  if (available.length === 0) {
    const i = Math.floor(Math.random() * arr.length)
    return { item: arr[i], index: i }
  }
  const pick = available[Math.floor(Math.random() * available.length)]
  return { item: pick.item, index: pick.i }
}

function findItem(keyword: string): FoodItem | undefined {
  const lower = keyword.toLowerCase()
  return ALL_ITEMS.find((item) => item.name.toLowerCase().includes(lower))
}

function estimateMealCost(itemKeywords: string[]): number {
  let cost = 0
  for (const kw of itemKeywords) {
    const item = findItem(kw)
    if (item) {
      // Cost per serving
      cost += item.price / item.servings
    }
  }
  return cost
}

export function generateMealPlan(diet: DietFilter = 'none', _budget = 250): { weeks: WeekPlan[]; groceryList: GroceryItem[]; totalCost: number } {
  const breakfasts = filterByDiet(BREAKFAST_TEMPLATES, diet)
  const lunches = filterByDiet(LUNCH_TEMPLATES, diet)
  const dinners = filterByDiet(DINNER_TEMPLATES, diet)
  const snacks = filterByDiet(SNACK_TEMPLATES, diet)

  const weeks: WeekPlan[] = []
  const itemUsage: Map<string, number> = new Map() // item name -> servings used

  for (let w = 0; w < 4; w++) {
    const days: DayPlan[] = []
    const usedB = new Set<number>()
    const usedL = new Set<number>()
    const usedD = new Set<number>()

    for (let d = 0; d < 7; d++) {
      const b = pickRandom(breakfasts, usedB)
      usedB.add(b.index)
      const l = pickRandom(lunches, usedL)
      usedL.add(l.index)
      const din = pickRandom(dinners, usedD)
      usedD.add(din.index)
      const s = pickRandom(snacks)

      const allItems = [...b.item.items, ...l.item.items, ...din.item.items, ...s.item.items]
      for (const kw of allItems) {
        const item = findItem(kw)
        if (item) {
          itemUsage.set(item.name, (itemUsage.get(item.name) || 0) + 1)
        }
      }

      const dayCost = estimateMealCost(b.item.items) + estimateMealCost(l.item.items) + estimateMealCost(din.item.items) + estimateMealCost(s.item.items)
      const dayCalories = b.item.calories + l.item.calories + din.item.calories + s.item.calories

      days.push({
        day: DAYS[d],
        breakfast: b.item.name,
        lunch: l.item.name,
        dinner: din.item.name,
        snack: s.item.name,
        calories: dayCalories,
        cost: Math.round(dayCost * 100) / 100,
      })
    }
    weeks.push({ week: w + 1, days })
  }

  // Build grocery list from item usage
  const groceryList: GroceryItem[] = []
  let totalCost = 0

  for (const [itemName, servingsUsed] of itemUsage) {
    const item = ALL_ITEMS.find((i) => i.name === itemName)
    if (!item) continue
    const unitsNeeded = Math.ceil(servingsUsed / item.servings)
    const cost = unitsNeeded * item.price
    totalCost += cost
    groceryList.push({
      name: item.name,
      quantity: unitsNeeded,
      unit: item.unit,
      price: Math.round(cost * 100) / 100,
      category: getCategoryForItem(itemName),
    })
  }

  // Sort by category
  groceryList.sort((a, b) => a.category.localeCompare(b.category))

  return { weeks, groceryList, totalCost: Math.round(totalCost * 100) / 100 }
}

function getCategoryForItem(itemName: string): string {
  for (const [category, items] of Object.entries(priceData)) {
    if ((items as FoodItem[]).some((i) => i.name === itemName)) {
      return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }
  return 'Other'
}
