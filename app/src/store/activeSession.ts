import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ActiveSessionState {
  startTimestamp: number | null
  maxTemp: number
  baseOffSeconds: number
  begin: (currentTemp: number, autoOffSeconds: number) => void
  recordTemp: (currentTemp: number) => void
  reset: () => void
}

// Readings buffer lives outside zustand entirely. They grow ~1 Hz during a
// session and the only consumer is the one-shot snapshot at session end
// (`getActiveSessionReadings`). A reactive store would notify on every poll
// for zero subscribers — pure waste. A module-level array keeps writes O(1)
// and `begin` atomic (clear + seed in one statement, no in-between frame).
let readings: Array<{ t: number; temp: number }> = []

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    (set, get) => ({
      startTimestamp: null,
      maxTemp: 0,
      baseOffSeconds: 0,
      begin: (currentTemp, autoOffSeconds) => {
        readings = [{ t: 0, temp: currentTemp }]
        set({
          startTimestamp: Date.now(),
          maxTemp: currentTemp,
          baseOffSeconds: autoOffSeconds > 0 ? autoOffSeconds : 120,
        })
      },
      recordTemp: (currentTemp) => {
        const { startTimestamp, maxTemp } = get()
        if (startTimestamp === null) return
        const t = Math.floor((Date.now() - startTimestamp) / 1000)
        readings.push({ t, temp: currentTemp })
        // Only touch the persisted store when maxTemp actually grows. This
        // turns most BLE polls into pure in-memory updates, with a
        // sessionStorage write only on the (rare) new-peak event.
        if (currentTemp > maxTemp) {
          set({ maxTemp: currentTemp })
        }
      },
      reset: () => {
        readings = []
        set({ startTimestamp: null, maxTemp: 0, baseOffSeconds: 0 })
      },
    }),
    {
      name: 'crafty-active-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

// One-shot snapshot for the session-save flow. Returns the live array; the
// caller must `.slice()` if it needs an immutable copy.
export const getActiveSessionReadings = () => readings
