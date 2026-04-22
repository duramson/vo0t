import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export type Profile = {
  id: string
  name: string
  setTemp: number
  boostTemp: number
}

const defaultProfiles = (): Profile[] => [
  { id: 'default-low', name: 'Low & Slow', setTemp: 170, boostTemp: 10 },
  { id: 'default-mid', name: 'Balanced', setTemp: 185, boostTemp: 10 },
  { id: 'default-high', name: 'Full Flavor', setTemp: 195, boostTemp: 15 },
  { id: 'default-max', name: 'Maximum', setTemp: 210, boostTemp: 0 },
]

interface ProfileState {
  profiles: Profile[]
  addProfile: (p: Omit<Profile, 'id'>) => Profile
  updateProfile: (id: string, updates: Partial<Omit<Profile, 'id'>>) => void
  deleteProfile: (id: string) => void
  resetProfiles: () => void
}

// Legacy profiles were stored as a raw array. Wrap them so persist's JSON parser
// produces a valid { state, version } envelope on first read.
const legacyCompatStorage: StateStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return JSON.stringify({ state: { profiles: parsed }, version: 0 })
      }
    } catch {
      return null
    }
    return raw
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: defaultProfiles(),
      addProfile: (p) => {
        const newProfile: Profile = { ...p, id: crypto.randomUUID() }
        set({ profiles: [...get().profiles, newProfile] })
        return newProfile
      },
      updateProfile: (id, updates) =>
        set({
          profiles: get().profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }),
      deleteProfile: (id) =>
        set({ profiles: get().profiles.filter((p) => p.id !== id) }),
      resetProfiles: () => set({ profiles: defaultProfiles() }),
    }),
    {
      name: 'crafty-profiles',
      storage: createJSONStorage(() => legacyCompatStorage),
    },
  ),
)
