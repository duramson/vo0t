import { useMemo } from 'preact/hooks'
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

interface SettingsState {
  isCelsius: boolean
  setIsCelsius: (v: boolean) => void
}

// Storage adapter that understands both the old raw-string format ("C"/"F")
// and the Zustand persist JSON format. Enables zero-downtime upgrade for
// existing users without losing their temperature-scale preference.
const legacyCompatStorage: StateStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name)
    if (raw === 'C' || raw === 'F') {
      return JSON.stringify({ state: { isCelsius: raw === 'C' }, version: 0 })
    }
    return raw
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isCelsius: true,
      setIsCelsius: (v) => set({ isCelsius: v }),
    }),
    {
      name: 'crafty-temp-scale',
      storage: createJSONStorage(() => legacyCompatStorage),
    },
  ),
)

export function useSettings() {
  const isCelsius = useSettingsStore((s) => s.isCelsius)
  const setIsCelsius = useSettingsStore((s) => s.setIsCelsius)

  // Memoize the returned helpers so consumers using them in deps arrays or
  // passing them down as props don't see fresh function references on every
  // unrelated render.
  return useMemo(() => {
    const cToApp = (c: number) => (isCelsius ? c : Math.round((c * 9) / 5 + 32))
    const appToC = (v: number) => (isCelsius ? v : Math.round(((v - 32) * 5) / 9))
    const formatTemp = (c: number) => `${cToApp(c)}°${isCelsius ? 'C' : 'F'}`
    return {
      isCelsius,
      setIsCelsius,
      cToApp,
      appToC,
      formatTemp,
      unit: isCelsius ? '°C' : '°F',
    }
  }, [isCelsius, setIsCelsius])
}
