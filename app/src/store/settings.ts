import { useState, useEffect } from 'preact/hooks'

const STORAGE_KEY = 'crafty-temp-scale'

let isCelsiusVal = localStorage.getItem(STORAGE_KEY) !== 'F'
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export function setIsCelsius(value: boolean) {
  isCelsiusVal = value
  localStorage.setItem(STORAGE_KEY, value ? 'C' : 'F')
  notify()
}

export function getIsCelsius() {
  return isCelsiusVal
}

// Convert C to F
export function cToApp(celsius: number): number {
  if (isCelsiusVal) return celsius
  return Math.round((celsius * 9) / 5 + 32)
}

// Convert App (C or F) to C
export function appToC(appTemp: number): number {
  if (isCelsiusVal) return appTemp
  return Math.round(((appTemp - 32) * 5) / 9)
}

export function formatTemp(celsius: number): string {
  const val = cToApp(celsius)
  return `${val}°${isCelsiusVal ? 'C' : 'F'}`
}

export function useSettings() {
  const [isCelsius, setIsC] = useState(() => getIsCelsius())

  useEffect(() => {
    const handler = () => setIsC(getIsCelsius())
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  return {
    isCelsius,
    setIsCelsius,
    cToApp,
    appToC,
    formatTemp(c: number) {
      return `${cToApp(c)}°${isCelsius ? 'C' : 'F'}`
    },
    unit: isCelsius ? '°C' : '°F',
  }
}
