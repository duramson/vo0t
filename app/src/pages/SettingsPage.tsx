import { useState, useCallback } from 'preact/hooks'
import { isCraftyPlus } from '../ble/encoding'
import { Slider } from '../components/Slider'
import { toast } from '../components/Toast'
import { useCrafty } from '../hooks/useCrafty'
import { useSettings } from '../store/settings'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { crafty, type CraftyDiagnostics } from '../ble'
import { AKKU_1, AKKU_2, SYSTEM } from '../ble/uuids'

function SettingsCardToggle({
  icon,
  label,
  activeLabel,
  inactiveLabel,
  enabled,
  onChange,
}: {
  icon: string
  label: string
  activeLabel: string
  inactiveLabel: string
  enabled: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      class="bg-surface-container-low flex min-h-27.5 w-full flex-col justify-between rounded-2xl p-4 text-left shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all active:scale-[0.98]"
    >
      <div class="flex w-full items-start justify-between">
        <span
          class={`material-symbols-outlined text-lg ${enabled ? 'text-accent' : 'text-text-secondary/60'}`}
        >
          {icon}
        </span>
        <div
          class={`relative h-5 w-10 rounded-full transition-all ${
            enabled
              ? 'bg-accent shadow-[0_0_10px_rgba(255,87,34,0.3)]'
              : 'bg-surface-container-high shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
          }`}
        >
          <div
            class={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
              enabled ? 'right-0.5' : 'left-0.5 opacity-60'
            }`}
          />
        </div>
      </div>
      <div>
        <span class="text-text-secondary/50 font-label text-[9px] font-bold tracking-widest uppercase">
          {label}
        </span>
        <p class={`text-sm font-bold ${enabled ? 'text-text-primary' : 'text-text-secondary'}`}>
          {enabled ? activeLabel : inactiveLabel}
        </p>
      </div>
    </button>
  )
}

export function SettingsPage() {
  const { state, disconnect } = useCrafty()
  const isPlus = isCraftyPlus(state.deviceInfo?.firmware ?? '')

  const {
    setPendingLed,
    displayLed,
    commitLed,
    setPendingAutoOff,
    displayAutoOff,
    commitAutoOff,
    toggleVibration,
    toggleChargeLed,
    toggleBlePermanent,
    triggerFactoryReset,
  } = useDeviceSettings(state)

  const [showFactoryReset, setShowFactoryReset] = useState(false)
  const { isCelsius, setIsCelsius } = useSettings()

  return (
    <div class="fade-in flex flex-col gap-(--spacing-section) px-(--spacing-page) py-4">
      {/* Device Preferences */}
      <section class="flex flex-col gap-6">
        <div class="flex flex-col items-center gap-2">
          <span
            class="material-symbols-outlined text-text-secondary text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            settings
          </span>
          <div class="flex flex-col items-center">
            <h3 class="font-headline text-text-primary text-base font-extrabold tracking-wide uppercase">
              Device Preferences
            </h3>
            <p class="text-text-secondary text-xs font-bold tracking-wider uppercase">
              Model: {isPlus ? 'Crafty+' : (state.deviceInfo?.model ?? 'Crafty')}
            </p>
          </div>
        </div>

        {/* Device info grid */}
        <div class="border-border/40 grid grid-cols-3 border-b px-2 pb-6 text-center text-xs">
          {(
            [
              ['Firmware', state.deviceInfo?.firmware],
              ['Serial', state.deviceInfo?.serial],
              ['BLE FW', state.deviceInfo?.bleFirmware],
            ] as const
          ).map(([label, value]) => (
            <div key={label} class="flex flex-col items-center gap-1">
              <span class="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                {label}
              </span>
              <div class="text-text-primary font-medium">{value || '—'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid of Toggle Cards */}
      <section class="grid grid-cols-2 gap-3">
        {/* Haptics */}
        <SettingsCardToggle
          icon="vibration"
          label="Haptics"
          activeLabel="Active"
          inactiveLabel="Disabled"
          enabled={state.vibrationEnabled}
          onChange={toggleVibration}
        />

        {/* Temperature Unit (Fahrenheit/Celsius) */}
        <button
          type="button"
          onClick={() => setIsCelsius(!isCelsius)}
          class="bg-surface-container-low flex min-h-27.5 flex-col justify-between rounded-2xl p-4 text-left shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all active:scale-[0.98]"
        >
          <div class="flex w-full items-start justify-between">
            <span class="material-symbols-outlined text-text-secondary/60 text-lg">thermostat</span>
            <div class="bg-surface-container-high pointer-events-none flex rounded-lg p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
              <div
                class={`rounded-md px-2 py-0.5 text-[9px] font-bold transition-colors ${
                  isCelsius ? 'bg-accent text-text-primary' : 'text-text-secondary/60'
                }`}
              >
                °C
              </div>
              <div
                class={`rounded-md px-2 py-0.5 text-[9px] font-bold transition-colors ${
                  !isCelsius ? 'bg-accent text-text-primary' : 'text-text-secondary/60'
                }`}
              >
                °F
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-text-secondary/50 font-label text-[9px] font-bold tracking-widest uppercase">
              Scale
            </span>
            <p class="text-text-primary text-sm font-bold">
              {isCelsius ? 'Celsius' : 'Fahrenheit'}
            </p>
          </div>
        </button>

        {/* Charge LED */}
        <SettingsCardToggle
          icon="lightbulb"
          label="Charge LED"
          activeLabel="Visible"
          inactiveLabel="Hidden"
          enabled={state.chargeLedEnabled}
          onChange={toggleChargeLed}
        />

        {/* Permanent Bluetooth */}
        <SettingsCardToggle
          icon="bluetooth"
          label="Permanent BLE"
          activeLabel="Always On"
          inactiveLabel="Auto Sleep"
          enabled={state.blePermanent}
          onChange={toggleBlePermanent}
        />
      </section>

      {/* Sliders */}
      <section class="space-y-4 pt-2">
        <div class="bg-surface-container-low space-y-4 rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <Slider
            label="LED Brightness"
            displayValue={`${displayLed}%`}
            value={displayLed}
            min={0}
            max={100}
            step={1}
            onChange={setPendingLed}
            onCommit={commitLed}
          />
        </div>
        <div class="bg-surface-container-low space-y-4 rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <Slider
            label="Auto-Off Timer"
            displayValue={`${Math.floor(displayAutoOff / 60)}m ${displayAutoOff % 60}s`}
            value={displayAutoOff}
            min={10}
            max={300}
            step={5}
            // ticks={['10s', '2m 30s', '5m']} // Omitting ticks to match the clean design
            onChange={setPendingAutoOff}
            onCommit={commitAutoOff}
          />
        </div>
      </section>

      {/* Actions */}
      <section class="flex flex-col gap-4 pt-4">
        <div class="flex items-center gap-2">
          <div class="h-px flex-1 bg-white/5"></div>
          <span class="font-label text-text-secondary/40 px-2 text-[9px] font-black tracking-[0.2rem] uppercase">
            System Commands
          </span>
          <div class="h-px flex-1 bg-white/5"></div>
        </div>

        {isPlus && (
          <button
            type="button"
            onClick={() => crafty.findDevice().catch(() => toast.error('Find device failed'))}
            class="bg-surface-container-low group flex w-full items-center justify-between rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_4px_14px_rgba(0,188,212,0.3),inset_0_1px_1px_rgba(0,188,212,0.1)] active:scale-[0.98]"
          >
            <div class="flex items-center gap-4">
              <div class="bg-info/10 group-hover:bg-info/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                <span class="material-symbols-outlined text-info text-xl" data-icon="location_on">
                  location_on
                </span>
              </div>
              <div class="text-left">
                <span class="font-label text-info text-[10px] font-bold tracking-widest uppercase">
                  Find Device
                </span>
                <p class="text-text-secondary/50 text-[10px]">Vibrate and blink LEDs</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-text-secondary/30 group-hover:text-info transition-colors">
              chevron_right
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={disconnect}
          class="bg-surface-container-low group flex w-full items-center justify-between rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.98]"
        >
          <div class="flex items-center gap-4">
            <div class="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-xl">
              <span class="material-symbols-outlined text-text-secondary text-xl">
                power_settings_new
              </span>
            </div>
            <div class="text-left">
              <span class="font-label text-text-primary text-[10px] font-bold tracking-widest uppercase">
                Disconnect
              </span>
              <p class="text-text-secondary/50 text-[10px]">Close Bluetooth session</p>
            </div>
          </div>
          <span class="material-symbols-outlined text-text-secondary/30 transition-colors group-hover:text-white">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowFactoryReset((p) => !p)}
          class="bg-surface-container-low group flex w-full items-center justify-between rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_4px_14px_rgba(244,67,54,0.3),inset_0_1px_1px_rgba(244,67,54,0.1)] active:scale-[0.98]"
        >
          <div class="flex items-center gap-4">
            <div class="bg-danger/10 group-hover:bg-danger/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
              <span class="material-symbols-outlined text-danger text-xl">factory</span>
            </div>
            <div class="text-left">
              <span class="font-label text-danger text-[10px] font-bold tracking-widest uppercase">
                Factory Reset
              </span>
              <p class="text-text-secondary/50 text-[10px]">Wipe all local user data & presets</p>
            </div>
          </div>
          <span class="material-symbols-outlined text-text-secondary/30 group-hover:text-danger transition-colors">
            chevron_right
          </span>
        </button>

        {showFactoryReset && (
          <div class="bg-danger/5 space-y-3 rounded-2xl p-4 shadow-[0_4px_10px_rgba(244,67,54,0.1),inset_0_1px_1px_rgba(244,67,54,0.2)]">
            <p class="text-danger text-xs">All device settings will be reset. Are you sure?</p>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerFactoryReset()
                  setShowFactoryReset(false)
                }}
                class="bg-danger flex-1 rounded-xl py-2.5 text-xs font-semibold text-white"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowFactoryReset(false)}
                class="bg-surface-container-high text-text-secondary flex-1 rounded-xl py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Diagnostics */}
      <DiagnosticsSection state={state} />
    </div>
  )
}

// ── Diagnostics ───────────────────────────────────────────

type DiagRow = [string, string | number, string?, boolean?]

function DiagnosticsSection({ state }: { state: ReturnType<typeof useCrafty>['state'] }) {
  const [show, setShow] = useState(false)
  const [diag, setDiag] = useState<CraftyDiagnostics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { formatTemp } = useSettings()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDiag(await crafty.readDiagnostics())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagnostics')
    } finally {
      setLoading(false)
    }
  }, [])

  const toggle = useCallback(() => {
    const next = !show
    setShow(next)
    if (next && !diag) load()
  }, [show, diag, load])

  const warnings = buildWarnings(diag)
  const batteryHealthPct = diag
    ? Math.round((diag.batteryTotalCap / Math.max(diag.batteryDesignCap, 1)) * 100)
    : null

  return (
    <div class="border-border/40 border-t pt-4">
      <button
        type="button"
        onClick={toggle}
        class="text-text-secondary bg-surface-container-low hover:bg-surface-container w-full rounded-2xl py-3 text-sm font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-colors"
      >
        {show ? '▲ Hide Diagnostics' : '▼ Show Diagnostics'}
      </button>

      {show && (
        <div class="fade-in mt-4 space-y-2">
          <div class="flex justify-end">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              class="bg-accent/10 text-accent hover:bg-accent/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>

          {error && (
            <div class="bg-danger/10 rounded-xl p-3">
              <p class="text-danger text-xs">{error}</p>
            </div>
          )}

          {warnings.length > 0 && (
            <div class="bg-warning/10 space-y-1.5 rounded-xl p-3">
              {warnings.map((w, i) => (
                <div key={i} class="text-warning flex items-start gap-2 text-xs">
                  <span>⚠️</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {diag &&
            buildSections(diag, state, batteryHealthPct, formatTemp).map((section) => (
              <div key={section.title} class="border-border/30 mt-1 border-t pt-3">
                <div class="text-text-muted mb-2 text-[10px] font-semibold tracking-wider uppercase">
                  {section.title}
                </div>
                <div class="space-y-1.5">
                  {section.rows.map(([label, value, unit, warn]) => (
                    <div key={label} class="flex items-center justify-between py-0.5">
                      <span class="text-text-secondary text-xs">{label}</span>
                      <span
                        class={`text-xs font-medium tabular-nums ${warn ? 'text-warning' : 'text-text-primary'}`}
                      >
                        {value}
                        {unit ? ` ${unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!diag && !loading && !error && (
            <p class="text-text-muted py-4 text-center text-xs">No data loaded.</p>
          )}
        </div>
      )}
    </div>
  )
}

function buildWarnings(diag: CraftyDiagnostics | null): string[] {
  if (!diag) return []
  const w: string[] = []
  if (diag.akkuStatus1 & AKKU_1.BATTERY_LOW) w.push('Battery low – please charge')
  if (diag.akkuStatus1 & AKKU_1.BATTERY_ERROR) w.push('Battery error – contact Storz & Bickel')
  if (diag.akkuStatus1 & AKKU_1.TEMP_WARNING) w.push('Battery temperature warning')
  if (diag.akkuStatus1 & AKKU_1.COOL_DOWN) w.push('Let the device cool down')
  if (diag.akkuStatus2 & AKKU_2.CHARGER_ISSUE) w.push('Charger issue – use a different cable')
  if (diag.systemStatus & SYSTEM.ERROR) w.push('System error – contact Storz & Bickel')
  return w
}

function buildSections(
  diag: CraftyDiagnostics,
  state: ReturnType<typeof useCrafty>['state'],
  batteryHealthPct: number | null,
  formatTemp: (val: number) => string,
): Array<{ title: string; rows: DiagRow[] }> {
  return [
    {
      title: 'Battery',
      rows: [
        ['Level', state.battery, '%'],
        ['Remaining', diag.batteryRemainingCap, 'mAh'],
        ['Total', diag.batteryTotalCap, 'mAh'],
        ['Design', diag.batteryDesignCap, 'mAh'],
        ['Health', batteryHealthPct ?? '—', '%', (batteryHealthPct ?? 100) < 80],
        ['Charge Cycles', diag.chargeCycles],
        ['Discharge Cycles', diag.dischargeCycles],
      ],
    },
    {
      title: 'Voltages & Current',
      rows: [
        ['Battery Voltage', diag.voltageAccu, 'mV'],
        ['Mains Voltage', diag.voltageMains, 'mV'],
        ['Heater Voltage', diag.voltageHeating, 'mV'],
        ['Battery Current', diag.currentAccu, 'mA'],
      ],
    },
    {
      title: 'Temperatures',
      rows: [
        ['Heater (current)', formatTemp(state.currentTemp)],
        ['PT1000 Raw', formatTemp(diag.pt1000Current)],
        ['PT1000 Calibrated', formatTemp(diag.pt1000Adjusted)],
        ['Battery Temp', formatTemp(diag.accuTemp)],
        ['Battery Temp Min', formatTemp(diag.accuTempMin)],
        ['Battery Temp Max', formatTemp(diag.accuTempMax), undefined, diag.accuTempMax > 60],
      ],
    },
    {
      title: 'Usage',
      rows: [
        ['Operating Time (Battery)', diag.operatingTimeAccu.toFixed(1), 'h'],
        ['Total Usage', diag.usageHours, 'h'],
        ['Usage Minutes', diag.usageMinutes, 'min'],
        ['Hardware ID', diag.hardwareId],
        ['PCB Version', `0x${diag.pcbVersion.toString(16).toUpperCase()}`],
        ['HW Serial', diag.snHardware],
      ],
    },
    {
      title: 'Status Registers',
      rows: [
        [
          'Battery Status 1',
          `0x${diag.akkuStatus1.toString(16).padStart(4, '0').toUpperCase()}`,
          '',
          !!(diag.akkuStatus1 & (AKKU_1.BATTERY_LOW | AKKU_1.BATTERY_ERROR)),
        ],
        ['Battery Status 2', `0x${diag.akkuStatus2.toString(16).padStart(4, '0').toUpperCase()}`],
        [
          'System Status',
          `0x${diag.systemStatus.toString(16).padStart(4, '0').toUpperCase()}`,
          '',
          !!(diag.systemStatus & SYSTEM.ERROR),
        ],
        ['Project Reg', `0x${state.projectRegRaw.toString(16).padStart(4, '0').toUpperCase()}`],
        ['Settings Reg', `0x${state.settingsRaw.toString(16).padStart(4, '0').toUpperCase()}`],
      ],
    },
  ]
}
