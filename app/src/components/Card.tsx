/** Reusable card wrapper */
import type { ComponentChildren } from 'preact'

type Props = {
  children: ComponentChildren
  class?: string
  title?: string
  subtitle?: string
  onClick?: () => void
}

export function Card({ children, class: cls = '', title, subtitle, onClick }: Props) {
  const baseClasses =
    'bg-surface-container-low rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] p-5'
  const interactiveClasses =
    'cursor-pointer transition-all duration-150 active:scale-[0.98] active:bg-surface-container hover:shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]'

  return (
    <div class={`${baseClasses} ${onClick ? interactiveClasses : ''} ${cls}`} onClick={onClick}>
      {(title || subtitle) && (
        <div class="mb-3">
          {title && <h3 class="text-text-primary text-sm font-semibold">{title}</h3>}
          {subtitle && <p class="text-text-secondary mt-0.5 text-xs">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
