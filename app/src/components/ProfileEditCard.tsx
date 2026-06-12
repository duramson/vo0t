import { useState } from 'preact/hooks'
import type { Profile } from '../store/profiles'
import { useSettings } from '../store/settings'
import { TEMP_MIN, TEMP_MAX, BOOST_MAX } from '../ble/uuids'

interface ProfileEditCardProps {
  profile: Profile
  onSave: (updates: Partial<Omit<Profile, 'id'>>) => void
  onCancel: () => void
}

// Number inputs accept anything ("", "1e9", out-of-range typing); clamp before
// persisting so a profile never stores NaN or impossible temperatures.
const clamp = (v: number, lo: number, hi: number) =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo

export function ProfileEditCard({ profile: p, onSave, onCancel }: ProfileEditCardProps) {
  const [name, setName] = useState(p.name)
  const [temp, setTemp] = useState(p.setTemp)
  const [boost, setBoost] = useState(p.boostTemp)

  const { unit, cToApp, appToC, boostToApp, appToBoost } = useSettings()

  const fields = [
    {
      label: `Temp ${unit}`,
      value: cToApp(temp),
      set: (v: number) => setTemp(appToC(v)),
      min: cToApp(TEMP_MIN),
      max: cToApp(TEMP_MAX),
    },
    {
      label: `Boost ${unit}`,
      value: boostToApp(boost),
      set: (v: number) => setBoost(appToBoost(v)),
      min: 0,
      max: boostToApp(BOOST_MAX),
    },
  ]

  return (
    <div class="bg-surface-container-low relative rounded-2xl p-4 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-150">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-text-primary text-sm font-semibold">Edit</span>
        <button
          type="button"
          onClick={onCancel}
          class="text-text-muted hover:text-text-secondary text-xs"
        >
          Cancel
        </button>
      </div>
      <div class="space-y-3">
        <input
          type="text"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          class="bg-surface-container text-text-primary placeholder:text-text-muted w-full rounded-xl px-3 py-2 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none"
          placeholder="Profile name"
        />
        <div class="grid grid-cols-2 gap-2">
          {fields.map(({ label, value, set, min, max }) => (
            <label key={label} class="flex flex-col gap-1">
              <span class="text-text-muted text-[10px] uppercase">{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                value={value}
                onInput={(e) => set(Number((e.target as HTMLInputElement).value))}
                class="bg-surface-container text-text-primary rounded-lg px-2 py-1.5 text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const safeTemp = clamp(temp, TEMP_MIN, TEMP_MAX)
            onSave({
              name: name.trim() || p.name,
              setTemp: safeTemp,
              // Respect the device's combined cap (setTemp + boost ≤ TEMP_MAX)
              boostTemp: clamp(boost, 0, Math.min(BOOST_MAX, TEMP_MAX - safeTemp)),
            })
          }}
          class="bg-accent hover:bg-accent-hover w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}
