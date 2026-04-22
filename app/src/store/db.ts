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
  sessions!: Table<SessionRecord>
  tempReadings!: Table<TempReading>

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
let migrationRan = false

export async function migrateFromLocalStorage(): Promise<void> {
  if (migrationRan) return
  migrationRan = true
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return
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
    localStorage.removeItem(LEGACY_KEY)
  } catch (e) {
    console.error('History migration from localStorage failed', e)
  }
}
