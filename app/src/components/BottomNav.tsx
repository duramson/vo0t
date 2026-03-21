export type TabId = 'dashboard' | 'history' | 'settings'

type Props = {
  active: TabId
  onChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: string; iconFill?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'speed', iconFill: true },
  { id: 'history', label: 'History', icon: 'monitoring' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav class="shell-gutter bottom-safe bg-bg/90 z-50 flex shrink-0 flex-col rounded-t-3xl shadow-[0_-4px_24px_rgba(255,87,34,0.08)] backdrop-blur-xl">
      <div class="bg-accent/20 via-accent h-px w-full bg-linear-to-r from-transparent to-transparent opacity-50" />
      <div class="grid grid-cols-3 gap-2 py-3">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              class={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span
                class="material-symbols-outlined"
                style={isActive && tab.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span class="font-sans text-[10px] font-bold tracking-[0.08rem] uppercase">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
