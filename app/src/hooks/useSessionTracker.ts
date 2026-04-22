import { useEffect, useRef } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { addSession } from '../store/history'
import { useActiveSessionStore } from '../store/activeSession'

const DEBUG = import.meta.env.DEV

export function useSessionTracker() {
  const { state } = useCrafty()
  const { heaterActive, autoOffSeconds, currentTemp, setTemp } = state

  const offDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const store = useActiveSessionStore.getState()

    // Session started (no active session and heater just came on)
    if (heaterActive && store.startTimestamp === null) {
      if (offDebounce.current) {
        if (DEBUG) console.log('[Session] heater flicker — cancelling session end')
        clearTimeout(offDebounce.current)
        offDebounce.current = null
        return
      }
      if (DEBUG) console.log('[Session] start — setTemp=%d autoOff=%d', setTemp, autoOffSeconds)
      store.begin(currentTemp, autoOffSeconds)
      return
    }

    // In-progress tracking
    if (heaterActive && store.startTimestamp !== null) {
      store.recordTemp(currentTemp)
      return
    }

    // Session ended — debounce to avoid false triggers from BLE glitches
    if (!heaterActive && store.startTimestamp !== null && !offDebounce.current) {
      if (DEBUG) console.log('[Session] heater off — waiting 1.5s to confirm end')
      const startTime = store.startTimestamp
      const baseOff = store.baseOffSeconds
      const maxTempAtEnd = store.maxTemp
      const readingsAtEnd = store.readings

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
          addSession(
            {
              durationSeconds,
              maxTemp: Math.max(maxTempAtEnd, setTemp),
            },
            readingsAtEnd,
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
