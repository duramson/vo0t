import { useEffect, useRef } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { addSession } from '../store/history'
import { getActiveSessionReadings, useActiveSessionStore } from '../store/activeSession'

const DEBUG = import.meta.env.DEV

export function useSessionTracker() {
  const { state } = useCrafty()
  const { heaterActive, autoOffSeconds, currentTemp, setTemp } = state

  const offDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const store = useActiveSessionStore.getState()

    // In-progress tracking — also where we cancel a pending end-of-session
    // debounce. The cancellation has to live here (not in the "session
    // started" branch below) because during the 1.5 s debounce window
    // startTimestamp is still set, so a heater flicker (off → on) lands here,
    // not in the start branch.
    if (heaterActive && store.startTimestamp !== null) {
      if (offDebounce.current) {
        if (DEBUG) console.log('[Session] heater flicker — cancelling session end')
        clearTimeout(offDebounce.current)
        offDebounce.current = null
      }
      store.recordTemp(currentTemp)
      return
    }

    // Session started (no active session and heater just came on)
    if (heaterActive && store.startTimestamp === null) {
      if (DEBUG) console.log('[Session] start — setTemp=%d autoOff=%d', setTemp, autoOffSeconds)
      store.begin(currentTemp, autoOffSeconds)
      return
    }

    // Session ended — debounce to avoid false triggers from BLE glitches
    if (!heaterActive && store.startTimestamp !== null && !offDebounce.current) {
      if (DEBUG) console.log('[Session] heater off — waiting 1.5s to confirm end')
      const startTime = store.startTimestamp
      const baseOff = store.baseOffSeconds
      const maxTempAtEnd = store.maxTemp

      offDebounce.current = setTimeout(() => {
        offDebounce.current = null
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000)
        const threshold = baseOff * 0.6

        if (DEBUG)
          console.log(
            '[Session] confirmed end — duration=%ds threshold=%ds maxTemp=%d',
            durationSeconds,
            threshold,
            maxTempAtEnd,
          )

        if (durationSeconds >= threshold) {
          // Snapshot readings at the moment of confirmed end, not at debounce
          // start, so any samples that landed during the 1.5 s window are kept.
          addSession(
            {
              durationSeconds,
              maxTemp: Math.max(maxTempAtEnd, setTemp),
            },
            getActiveSessionReadings().slice(),
          )
          if (DEBUG) console.log('[Session] saved')
        } else {
          if (DEBUG) console.log('[Session] too short, discarded')
        }

        useActiveSessionStore.getState().reset()
      }, 1500)
    }
  }, [heaterActive, currentTemp, autoOffSeconds, setTemp])

  // Cleanup debounce on unmount. Session state survives in the store, so if the
  // component remounts the useEffect above will pick up where we left off.
  useEffect(() => {
    return () => {
      if (offDebounce.current) clearTimeout(offDebounce.current)
    }
  }, [])
}
