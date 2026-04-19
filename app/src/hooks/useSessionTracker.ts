import { useEffect, useRef } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { addSession } from '../store/history'

const DEBUG = import.meta.env.DEV

export function useSessionTracker() {
  const { state } = useCrafty()
  const { heaterActive, autoOffSeconds, currentTemp, setTemp } = state

  const sessionStartRef = useRef<number | null>(null)
  const maxTempRef = useRef<number>(0)
  const baseOffSecondsRef = useRef<number>(0)
  const offDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Session started
    if (heaterActive && sessionStartRef.current === null) {
      // Cancel any pending end-of-session debounce (heater flicker)
      if (offDebounce.current) {
        if (DEBUG) console.log('[Session] heater flicker — cancelling session end')
        clearTimeout(offDebounce.current)
        offDebounce.current = null
        return
      }

      if (DEBUG) console.log('[Session] start — setTemp=%d autoOff=%d', setTemp, autoOffSeconds)
      sessionStartRef.current = Date.now()
      maxTempRef.current = currentTemp
      baseOffSecondsRef.current = autoOffSeconds > 0 ? autoOffSeconds : 120
    }

    // In-progress tracking
    if (heaterActive && sessionStartRef.current !== null) {
      if (currentTemp > maxTempRef.current) {
        maxTempRef.current = currentTemp
      }
    }

    // Session ended — debounce to avoid false triggers from BLE glitches
    if (!heaterActive && sessionStartRef.current !== null && !offDebounce.current) {
      if (DEBUG) console.log('[Session] heater off — waiting 1.5s to confirm end')
      const startTime = sessionStartRef.current
      const baseOff = baseOffSecondsRef.current
      const maxTemp = maxTempRef.current

      offDebounce.current = setTimeout(() => {
        offDebounce.current = null
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000)
        const threshold = baseOff * 0.6

        if (DEBUG)
          console.log(
            '[Session] confirmed end — duration=%ds threshold=%ds maxTemp=%d',
            durationSeconds,
            threshold,
            maxTemp,
          )

        if (durationSeconds >= threshold) {
          addSession({
            durationSeconds,
            maxTemp: Math.max(maxTemp, setTemp),
          })
          if (DEBUG) console.log('[Session] saved')
        } else {
          if (DEBUG) console.log('[Session] too short, discarded')
        }

        sessionStartRef.current = null
        maxTempRef.current = 0
      }, 1500)
    }
  }, [heaterActive, currentTemp, autoOffSeconds, setTemp])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (offDebounce.current) clearTimeout(offDebounce.current)
    }
  }, [])
}
