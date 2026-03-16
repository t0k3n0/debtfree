export default function Support() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support DebtFree</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          DebtFree is free and always will be. No ads, no tracking, no data collection.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
        <div className="text-5xl">☕</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          If this tool helped you, consider buying me a coffee
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Your support helps keep this tool free and motivates continued development.
        </p>
        <a
          href="https://buymeacoffee.com/t0k3n"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-[#FFDD00] hover:bg-[#E5C700] text-black font-semibold rounded-lg transition-colors text-sm"
        >
          ☕ Buy Me a Coffee
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">What your support funds</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">&#10003;</span>
            Keeping the app free with zero ads
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">&#10003;</span>
            New features (savings goals, investment basics)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">&#10003;</span>
            Updated Walmart price database
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">&#10003;</span>
            More meal plan variety and dietary options
          </li>
        </ul>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-700 dark:text-emerald-400 text-center">
        Even sharing this tool with someone who needs it is a huge help. Thank you!
      </div>
    </div>
  )
}
