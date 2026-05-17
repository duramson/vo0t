import { useMemo } from 'preact/hooks'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../ble/encoding'

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
  // One subscription with shallow equality instead of two independent
  // selectors — every consumer (8 direct callers) halves its store hookup.
  const { isCelsius, setIsCelsius } = useSettingsStore(
    useShallow((s) => ({ isCelsius: s.isCelsius, setIsCelsius: s.setIsCelsius })),
  )

  // Memoize the returned helpers so consumers using them in deps arrays or
  // passing them down as props don't see fresh function references on every
  // unrelated render.
  return useMemo(() => {
    const cToApp = (c: number) => (isCelsius ? c : celsiusToFahrenheit(c))
    const appToC = (v: number) => (isCelsius ? v : fahrenheitToCelsius(v))
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
