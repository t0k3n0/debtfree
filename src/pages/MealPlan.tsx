import { useState, useMemo } from 'react'
import { generateMealPlan } from '../lib/meal-planner'
import { Disclaimer } from '../components/Disclaimer'

type DietFilter = 'none' | 'vegetarian' | 'vegan'

export default function MealPlan() {
  const [diet, setDiet] = useState<DietFilter>('none')
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [showGrocery, setShowGrocery] = useState(false)

  const plan = useMemo(() => generateMealPlan(diet), [diet])

  const currentWeek = plan.weeks[selectedWeek]
  const weeklyAvg = Math.round(plan.totalCost / 4 * 100) / 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">$250/mo Meal Planner</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Budget meals using Walmart prices. USDA Thrifty Plan level (~$247-309/mo).
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Monthly Total</div>
          <div className={`text-lg font-bold ${plan.totalCost <= 250 ? 'text-emerald-600' : 'text-amber-600'}`}>
            ${plan.totalCost}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Weekly Avg</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">${weeklyAvg}</div>
        </div>
      </div>

      {/* Diet filter */}
      <div className="flex gap-2">
        {(['none', 'vegetarian', 'vegan'] as DietFilter[]).map((d) => (
          <button
            key={d}
            onClick={() => setDiet(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              diet === d
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {d === 'none' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Week selector */}
      <div className="flex gap-2">
        {plan.weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setSelectedWeek(i)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedWeek === i
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Week {w.week}
          </button>
        ))}
      </div>

      {/* Daily meal cards */}
      <div className="space-y-3">
        {currentWeek?.days.map((day) => (
          <div key={day.day} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{day.day}</h3>
              <div className="text-xs text-slate-500">
                {day.calories} cal · ${day.cost.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-xs text-slate-400">Breakfast</span>
                <div className="text-slate-700 dark:text-slate-300">{day.breakfast}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Lunch</span>
                <div className="text-slate-700 dark:text-slate-300">{day.lunch}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Dinner</span>
                <div className="text-slate-700 dark:text-slate-300">{day.dinner}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Snack</span>
                <div className="text-slate-700 dark:text-slate-300">{day.snack}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grocery list toggle */}
      <button
        onClick={() => setShowGrocery(!showGrocery)}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
      >
        {showGrocery ? 'Hide' : 'Show'} Monthly Grocery List
      </button>

      {showGrocery && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Monthly Grocery List</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {plan.groceryList.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-slate-400 ml-2">x{item.quantity}</span>
                </div>
                <span className="text-slate-600 dark:text-slate-400">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold">
            <span className="text-slate-900 dark:text-white">Total</span>
            <span className="text-emerald-600">${plan.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      <Disclaimer type="meal" />
    </div>
  )
}
