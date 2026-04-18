import { useState, useCallback, useEffect } from 'preact/hooks'
import { getVirtualState } from '../ble/simulator'
import { useCrafty } from '../hooks/useCrafty'
import { crafty } from '../ble'

export function SimulatorPanel() {
  const [collapsed, setCollapsed] = useState(true)
  const [battery, setBattery] = useState(80)
  const [tempOverride, setTempOverride] = useState(22)
  const { state } = useCrafty()

  const vs = getVirtualState()

  useEffect(() => {
    if (!vs) return
    setBattery(Math.round(vs.state.battery))
    setTempOverride(Math.round(vs.state.currentTemp))
  }, [vs, state.currentTemp, state.battery])

  const handleBattery = useCallback(
    (e: Event) => {
      const val = Number((e.target as HTMLInputElement).value)
      setBattery(val)
      vs?.setBattery(val)
    },
    [vs],
  )

  const handleTemp = useCallback(
    (e: Event) => {
      const val = Number((e.target as HTMLInputElement).value)
      setTempOverride(val)
      vs?.setCurrentTemp(val)
    },
    [vs],
  )

  const handleDisconnect = useCallback(() => {
    crafty.disconnect()
  }, [])

  const handleToggleHeater = useCallback(() => {
    if (!vs) return
    vs.forceHeater(!vs.state.heaterActive)
  }, [vs])

  if (!vs) return null

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        class="bg-accent fixed right-3 bottom-3 z-9999 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg"
        style={{ fontFamily: 'monospace' }}
      >
        SIM
      </button>
    )
  }

  return (
    <div class="bg-surface-container-high border-border fixed right-3 bottom-3 z-9999 w-64 rounded-xl border p-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <span class="text-accent text-xs font-bold tracking-widest uppercase">Simulator</span>
        <button
          onClick={() => setCollapsed(true)}
          class="text-text-muted hover:text-text-primary text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div class="mt-3 flex flex-col gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-text-secondary text-xs">Battery: {battery}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={battery}
            onInput={handleBattery}
            class="accent-accent w-full"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-text-secondary text-xs">Override Temp: {tempOverride}°C</span>
          <input
            type="range"
            min="20"
            max="220"
            value={tempOverride}
            onInput={handleTemp}
            class="accent-accent w-full"
          />
        </label>

        <div class="flex gap-2">
          <button
            onClick={handleToggleHeater}
            class={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
              vs.state.heaterActive
                ? 'bg-accent text-white'
                : 'bg-surface-container text-text-secondary'
            }`}
          >
            {vs.state.heaterActive ? 'Heater ON' : 'Heater OFF'}
          </button>

          <button
            onClick={handleDisconnect}
            class="bg-surface-container text-warning flex-1 rounded-lg px-2 py-1.5 text-xs font-medium"
          >
            Disconnect
          </button>
        </div>

        <div class="text-text-muted flex justify-between text-[10px]">
          <span>Ist: {Math.round(state.currentTemp)}°C</span>
          <span>Soll: {state.setTemp}°C</span>
          <span>Bat: {state.battery}%</span>
        </div>
      </div>
    </div>
  )
}
