/** Battery indicator with percentage */

type Props = {
  percent: number
  charging?: boolean
  class?: string
}

export function BatteryIndicator({ percent, charging = false, class: cls = '' }: Props) {
  const getColors = () => {
    if (percent > 50) return { text: 'text-success', bg: 'bg-success' }
    if (percent > 20) return { text: 'text-warning', bg: 'bg-warning' }
    return { text: 'text-danger', bg: 'bg-danger' }
  }
  const colors = getColors()

  return (
    <div class={`flex items-center gap-1.5 ${cls}`}>
      <div class="relative h-4 w-8 rounded-sm border border-current">
        <div class="absolute top-1 -right-0.75 h-2 w-0.75 rounded-r-sm bg-current" />
        <div
          class={`absolute top-px bottom-px left-px rounded-[1px] transition-all ${colors.bg}`}
          style={{ width: `${Math.max(0, Math.min(100, percent)) * 0.88}%` }}
        />
      </div>
      <span class={`text-[11px] font-bold tracking-widest tabular-nums ${colors.text}`}>
        {percent}%{charging ? ' ⚡' : ''}
      </span>
    </div>
  )
}
