/** Toggle switch component */

type Props = {
  enabled: boolean
  onChange: (val: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Toggle({ enabled, onChange, label, description, disabled }: Props) {
  return (
    <button
      type="button"
      class="group flex w-full items-center justify-between py-2 disabled:opacity-50"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
    >
      <div class="flex flex-col items-start">
        <span class="text-text-primary text-sm">{label}</span>
        {description && <span class="text-text-muted text-xs">{description}</span>}
      </div>
      <div
        class={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? 'bg-accent' : 'bg-border'
        }`}
      >
        <div
          class={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  )
}
