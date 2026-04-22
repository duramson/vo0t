import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SessionRecord } from './db'

export type { SessionRecord } from './db'

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
    () => db.sessions.orderBy('date').reverse().limit(200).toArray(),
    [],
    [] as SessionRecord[],
  )
  return { history, clearHistory }
}
