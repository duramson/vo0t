import Dexie, { type Table } from 'dexie'

export interface SessionRecord {
  id?: number
  date: string
  durationSeconds: number
  maxTemp: number
  profileName?: string
}

export interface TempReading {
  id?: number
  sessionId: number
  t: number // seconds since session start
  temp: number // °C
}

class CraftyDB extends Dexie {
  sessions!: Table<SessionRecord, number>
  tempReadings!: Table<TempReading, number>

  constructor() {
    super('craftydb')
    this.version(1).stores({
      sessions: '++id, date, profileName',
      tempReadings: '++id, sessionId, t',
    })
  }
}

export const db = new CraftyDB()

const LEGACY_KEY = 'crafty_history'
// Sentinel persists across Vite HMR resets and tab reloads, so the migration
// can't double-insert rows (sessions has no unique constraint on the legacy id).
const MIGRATED_SENTINEL = 'crafty_history_migrated_v1'

export async function migrateFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATED_SENTINEL)) return
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) {
    localStorage.setItem(MIGRATED_SENTINEL, '1')
    return
  }
  try {
    const old = JSON.parse(raw) as Array<{
      id: string
      date: string
      durationSeconds: number
      maxTemp: number
      profileName?: string
    }>
    if (Array.isArray(old) && old.length > 0) {
      await db.sessions.bulkAdd(
        old.map((s) => ({
          date: s.date,
          durationSeconds: s.durationSeconds,
          maxTemp: s.maxTemp,
          profileName: s.profileName,
        })),
      )
    }
    // Set sentinel before deleting the source — if removeItem races with a
    // tab close, the next boot sees the sentinel and skips re-migration. The
    // legacy key being left behind is harmless; the sentinel gates everything.
    localStorage.setItem(MIGRATED_SENTINEL, '1')
    localStorage.removeItem(LEGACY_KEY)
  } catch (e) {
    console.error('History migration from localStorage failed', e)
  }
}
