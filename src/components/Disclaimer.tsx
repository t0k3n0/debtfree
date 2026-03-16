export function Disclaimer({ type = 'financial' }: { type?: 'financial' | 'meal' | 'privacy' }) {
  const messages = {
    financial: 'This tool provides general financial information, not professional financial advice. Consult a certified financial planner for personalized advice.',
    meal: 'Grocery prices are estimates based on national Walmart averages and may vary by location. Nutritional info is approximate. Consult a healthcare provider for dietary needs.',
    privacy: 'No data leaves your device. All processing happens locally in your browser.',
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-500">
      <span className="font-medium">Disclaimer: </span>
      {messages[type]}
    </div>
  )
}
