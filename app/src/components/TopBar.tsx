import { useCrafty } from '../hooks/useCrafty'
import { isCraftyPlus } from '../ble/encoding'
import { BatteryIndicator } from './BatteryIndicator'
import { SessionTimer } from './SessionTimer'

export function TopBar() {
  const { state } = useCrafty()
  const fw = state.deviceInfo?.firmware ?? ''
  const isPlus = isCraftyPlus(fw)

  return (
    <header class="shell-gutter top-safe bg-surface-container-low/90 sticky top-0 z-50 flex shrink-0 items-center justify-between gap-3 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div class="flex min-w-0 flex-col">
        <div class="flex items-center gap-1.5">
          {state.connected ? (
            <span
              class="material-symbols-outlined text-accent text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bluetooth_connected
            </span>
          ) : (
            <span class="material-symbols-outlined text-error text-[18px]">bluetooth_disabled</span>
          )}
          <span
            class={`font-headline text-sm font-bold tracking-tight ${
              state.connected ? 'text-accent-hover' : 'text-error'
            }`}
          >
            {state.deviceInfo?.model ?? 'Crafty'} {state.connected ? '' : 'Offline'}
          </span>
          {isPlus && (
            <span
              class={`text-[10px] font-bold tracking-wider uppercase ${
                state.connected ? 'text-accent' : 'text-error/70'
              }`}
            >
              +
            </span>
          )}
        </div>
      </div>
      <div
        class={`flex shrink-0 items-center gap-2 ${state.connected ? '' : 'opacity-30 grayscale'}`}
      >
        <SessionTimer
          autoOffSeconds={state.autoOffSeconds}
          autoOffRemaining={state.autoOffRemaining}
          heaterActive={state.heaterActive}
        />
        {state.boostActive && (
          <span class="bg-accent/15 text-accent rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
            {state.superBoostActive ? 'S-Boost' : 'Boost'}
          </span>
        )}
        <div class="flex items-center gap-2 pl-2">
          <BatteryIndicator percent={state.battery} charging={state.chargingStatus > 0} />
        </div>
      </div>
    </header>
  )
}
