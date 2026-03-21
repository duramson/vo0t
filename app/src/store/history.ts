import { useEffect, useState } from 'preact/hooks'

export interface SessionRecord {
  id: string
  date: string
  durationSeconds: number
  maxTemp: number
  profileName?: string
}

const STORAGE_KEY = 'crafty_history'

let memoryCache: SessionRecord[] | null = null

function loadHistory(): SessionRecord[] {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      memoryCache = JSON.parse(raw)
      return memoryCache ?? []
    }
  } catch (e) {
    console.error('Failed to load history', e)
  }
  memoryCache = []
  return memoryCache
}

function saveHistory(history: SessionRecord[]) {
  memoryCache = history
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save history', e)
  }
}

export function addSession(session: Omit<SessionRecord, 'id' | 'date'>) {
  const history = loadHistory()
  const newRecord: SessionRecord = {
    ...session,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  }
  // Keep only the last 100 sessions to save space
  history.unshift(newRecord)
  if (history.length > 100) history.length = 100
  saveHistory(history)

  // Dispatch custom event for cross-component reactivity
  window.dispatchEvent(new Event('crafty_history_updated'))
}

export function clearHistory() {
  saveHistory([])
  window.dispatchEvent(new Event('crafty_history_updated'))
}

export function useHistory() {
  const [history, setHistory] = useState<SessionRecord[]>(() => loadHistory())

  useEffect(() => {
    const handler = () => setHistory(loadHistory())
    window.addEventListener('crafty_history_updated', handler)
    return () => window.removeEventListener('crafty_history_updated', handler)
  }, [])

  return { history, clearHistory }
}
