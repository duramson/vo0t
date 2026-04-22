import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ActiveSessionState {
  startTimestamp: number | null
  maxTemp: number
  baseOffSeconds: number
  readings: Array<{ t: number; temp: number }>
  begin: (currentTemp: number, autoOffSeconds: number) => void
  recordTemp: (currentTemp: number) => void
  reset: () => void
}

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    (set, get) => ({
      startTimestamp: null,
      maxTemp: 0,
      baseOffSeconds: 0,
      readings: [],
      begin: (currentTemp, autoOffSeconds) =>
        set({
          startTimestamp: Date.now(),
          maxTemp: currentTemp,
          baseOffSeconds: autoOffSeconds > 0 ? autoOffSeconds : 120,
          readings: [{ t: 0, temp: currentTemp }],
        }),
      recordTemp: (currentTemp) => {
        const { startTimestamp, maxTemp, readings } = get()
        if (startTimestamp === null) return
        const t = Math.floor((Date.now() - startTimestamp) / 1000)
        set({
          maxTemp: Math.max(maxTemp, currentTemp),
          readings: [...readings, { t, temp: currentTemp }],
        })
      },
      reset: () =>
        set({ startTimestamp: null, maxTemp: 0, baseOffSeconds: 0, readings: [] }),
    }),
    {
      name: 'crafty-active-session',
      storage: createJSONStorage(() => sessionStorage),
      // Don't persist the full readings array — it grows linearly with session
      // length and rewrites sessionStorage on every BLE poll. Keeping start +
      // maxTemp + baseOff is enough to recover the session on remount; losing
      // the intermediate readings on tab close is acceptable.
      partialize: (state) => ({
        startTimestamp: state.startTimestamp,
        maxTemp: state.maxTemp,
        baseOffSeconds: state.baseOffSeconds,
      }),
    },
  ),
)
