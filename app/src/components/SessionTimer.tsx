interface SessionTimerProps {
  autoOffSeconds: number
  autoOffRemaining: number
  heaterActive: boolean
}

export function SessionTimer({
  autoOffSeconds,
  autoOffRemaining,
  heaterActive,
}: SessionTimerProps) {
  if (autoOffSeconds <= 0) return null

  const remaining = heaterActive && autoOffRemaining > 0 ? autoOffRemaining : autoOffSeconds
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div
      class={`relative flex items-center gap-1.5 overflow-hidden rounded-full py-1 pr-2.5 pl-2 text-xs font-bold tabular-nums backdrop-blur-md transition-colors ${
        heaterActive
          ? 'bg-accent/15 border-accent/20 text-text-primary border shadow-[0_0_10px_rgba(255,87,34,0.15)]'
          : 'text-text-secondary/50 bg-white/5'
      }`}
    >
      {/* Visual progress bar (Ladebalken) */}
      {heaterActive && (
        <div
          class="bg-accent/30 absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(0, Math.min(100, (remaining / autoOffSeconds) * 100))}%` }}
        />
      )}

      <span
        class={`material-symbols-outlined relative z-10 text-[14px] ${
          heaterActive ? 'text-accent drop-shadow-[0_0_4px_var(--color-accent)]' : 'opacity-50'
        }`}
      >
        timer
      </span>
      <span class="relative z-10">
        {mm}:{ss}
      </span>
    </div>
  )
}
