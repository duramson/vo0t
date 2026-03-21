import { useEffect, useRef } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { addSession } from '../store/history'

export function useSessionTracker() {
  const { state } = useCrafty()
  const { heaterActive, autoOffSeconds, currentTemp, setTemp } = state

  const sessionStartRef = useRef<number | null>(null)
  const maxTempRef = useRef<number>(0)
  const baseOffSecondsRef = useRef<number>(0)

  useEffect(() => {
    // Session started
    if (heaterActive && sessionStartRef.current === null) {
      sessionStartRef.current = Date.now()
      maxTempRef.current = currentTemp
      baseOffSecondsRef.current = autoOffSeconds > 0 ? autoOffSeconds : 120 // Default fallback if read was 0
    }

    // In-progress tracking
    if (heaterActive && sessionStartRef.current !== null) {
      if (currentTemp > maxTempRef.current) {
        maxTempRef.current = currentTemp
      }
    }

    // Session ended (heater turned off or disconnected)
    if (!heaterActive && sessionStartRef.current !== null) {
      const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000)
      const threshold = baseOffSecondsRef.current * 0.6

      if (durationSeconds >= threshold) {
        addSession({
          durationSeconds,
          maxTemp: Math.max(maxTempRef.current, setTemp), // approximate target reached if they just let it run
        })
      }

      sessionStartRef.current = null
      maxTempRef.current = 0
    }
  }, [heaterActive, currentTemp, autoOffSeconds, setTemp])
}
