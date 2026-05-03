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

interface ActiveSessionReadingsState {
  readings: Array<{ t: number; temp: number }>
  append: (t: number, temp: number) => void
  clear: () => void
}

// Readings live in a separate, non-persisted store. They grow linearly during
// a session (~1 entry per BLE poll, i.e. ~1 Hz). Putting them in the persisted
// store would trigger a synchronous sessionStorage.setItem on every poll —
// even though `partialize` strips them out before serialization, the persist
// middleware still re-serializes on every set. Splitting keeps the persisted
// state small and write-rare.
const useReadingsStore = create<ActiveSessionReadingsState>((set) => ({
  readings: [],
  append: (t, temp) => set((s) => ({ readings: [...s.readings, { t, temp }] })),
  clear: () => set({ readings: [] }),
}))

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    (set, get) => ({
      startTimestamp: null,
      maxTemp: 0,
      baseOffSeconds: 0,
      begin: (currentTemp, autoOffSeconds) => {
        useReadingsStore.getState().clear()
        useReadingsStore.getState().append(0, currentTemp)
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
        useReadingsStore.getState().append(t, currentTemp)
        // Only touch the persisted store when maxTemp actually grows. This
        // turns most BLE polls into pure in-memory updates, with a
        // sessionStorage write only on the (rare) new-peak event.
        if (currentTemp > maxTemp) {
          set({ maxTemp: currentTemp })
        }
      },
      reset: () => {
        useReadingsStore.getState().clear()
        set({ startTimestamp: null, maxTemp: 0, baseOffSeconds: 0 })
      },
    }),
    {
      name: 'crafty-active-session',
      storage: createJSONStorage(() => sessionStorage),
      // Note: only startTimestamp + maxTemp + baseOffSeconds are persisted by
      // virtue of being the only fields in this store. Readings are not
      // persisted — on tab reload mid-session, the curve recovered into
      // IndexedDB will start at the remount point, not at session begin.
    },
  ),
)

// Read-only accessors for the in-memory readings buffer. Reactive consumers
// (e.g. a future live sparkline) can use `useActiveSessionReadings`. One-shot
// consumers (session-end save) should use `getActiveSessionReadings`.
export const useActiveSessionReadings = () => useReadingsStore((s) => s.readings)
export const getActiveSessionReadings = () => useReadingsStore.getState().readings
