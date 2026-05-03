import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SessionRecord } from './db'

export type { SessionRecord } from './db'

// Cap the live query result so a long-running install (years of daily use)
// can't slow down HistoryPage rendering. Older sessions stay in IndexedDB
// and remain accessible via direct queries — only the default list view
// is bounded.
const HISTORY_DISPLAY_LIMIT = 200

export async function addSession(
  session: Omit<SessionRecord, 'id' | 'date'>,
  readings: Array<{ t: number; temp: number }> = [],
): Promise<void> {
  try {
    const sessionId = (await db.sessions.add({
      ...session,
      date: new Date().toISOString(),
    })) as number
    if (readings.length > 0) {
      await db.tempReadings.bulkAdd(readings.map((r) => ({ ...r, sessionId })))
    }
  } catch (e) {
    console.error('Failed to save session', e)
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await db.transaction('rw', db.sessions, db.tempReadings, async () => {
      await db.tempReadings.clear()
      await db.sessions.clear()
    })
  } catch (e) {
    console.error('Failed to clear history', e)
  }
}

export function useHistory() {
  const history = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().limit(HISTORY_DISPLAY_LIMIT).toArray(),
    [],
    [] as SessionRecord[],
  )
  return { history, clearHistory }
}
