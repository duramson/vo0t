/** Styled range slider component */

type Props = {
  value: number
  min: number
  max: number
  step?: number
  label?: string
  /** Formatted display value shown on the right */
  displayValue?: string
  /** Tick labels shown below the track */
  ticks?: string[]
  onChange: (val: number) => void
  onCommit?: (val: number) => void
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  label,
  displayValue,
  ticks,
  onChange,
  onCommit,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100
  const trackStyle = {
    background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) ${pct}%, var(--color-surface-container-high) ${pct}%, var(--color-surface-container-high) 100%)`,
  }

  return (
    <div class="w-full">
      {(label || displayValue) && (
        <div class="mb-2 flex items-center justify-between">
          {label && (
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-text-secondary/60 text-[16px]">bolt</span>
              <span class="font-headline text-text-primary text-[13px] font-bold">{label}</span>
            </div>
          )}
          {displayValue && (
            <span class="text-accent font-sans text-sm font-bold tabular-nums">{displayValue}</span>
          )}
        </div>
      )}

      <div class="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          class="slider-native w-full"
          style={trackStyle}
          onInput={(e) => onChange(+(e.target as HTMLInputElement).value)}
          onPointerUp={(e) => onCommit?.(+(e.target as HTMLInputElement).value)}
          onPointerCancel={(e) => onCommit?.(+(e.target as HTMLInputElement).value)}
          onBlur={(e) => onCommit?.(+(e.target as HTMLInputElement).value)}
        />
      </div>

      {ticks && (
        <div class="text-text-secondary mt-1.5 flex justify-between px-1 text-[10px] font-semibold tracking-wider">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
