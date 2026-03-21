import { useHistory } from '../store/history'
import { useSettings } from '../store/settings'

export function HistoryPage() {
  const { history, clearHistory } = useHistory()
  const { formatTemp } = useSettings()

  function formatDuration(seconds: number) {
    const mm = Math.floor(seconds / 60)
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss} min`
  }

  function formatDate(isoString: string) {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('default', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (history.length === 0) {
    return (
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-(--spacing-page) text-center">
        <span class="material-symbols-outlined text-text-muted mb-4 text-5xl">history</span>
        <h2 class="font-headline text-text-primary mb-2 text-lg font-bold">No history yet</h2>
        <p class="text-text-secondary text-sm">
          Sessions are automatically saved when they run for at least 60% of the set session time.
        </p>
      </div>
    )
  }

  return (
    <main class="pb-page-bottom flex flex-col gap-4 px-(--spacing-page) pt-2">
      <div class="flex items-center justify-between">
        <h2 class="font-headline text-text-primary text-xl font-bold">Session History</h2>
        <button
          onClick={clearHistory}
          class="text-accent hover:bg-accent/10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">delete</span>
          Clear
        </button>
      </div>

      <div class="flex flex-col">
        {history.map((session, i) => (
          <div
            key={session.id}
            class={`relative flex items-center justify-between py-4 ${
              i !== history.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div class="flex flex-col gap-1">
              <span class="text-text-primary text-sm font-semibold">
                {formatDate(session.date)}
              </span>
              <span class="text-text-secondary flex items-center gap-1 text-xs">
                <span class="material-symbols-outlined text-[14px]">timer</span>
                {formatDuration(session.durationSeconds)}
              </span>
            </div>

            <div class="bg-surface-container-high flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <span class="material-symbols-outlined text-accent mr-1 text-[14px]">
                thermometer
              </span>
              <span class="text-text-primary text-sm font-bold tabular-nums">
                {formatTemp(session.maxTemp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
