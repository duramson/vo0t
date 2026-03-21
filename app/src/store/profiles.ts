/** Temperature profile storage using localStorage */

export type Profile = {
  id: string
  name: string
  setTemp: number // °C
  boostTemp: number // °C
}

const STORAGE_KEY = 'crafty-profiles'

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultProfiles()
  } catch {
    return defaultProfiles()
  }
}

function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

function defaultProfiles(): Profile[] {
  return [
    { id: 'default-low', name: 'Low & Slow', setTemp: 170, boostTemp: 10 },
    { id: 'default-mid', name: 'Balanced', setTemp: 185, boostTemp: 10 },
    { id: 'default-high', name: 'Full Flavor', setTemp: 195, boostTemp: 15 },
    { id: 'default-max', name: 'Maximum', setTemp: 210, boostTemp: 0 },
  ]
}

export function getProfiles(): Profile[] {
  return loadProfiles()
}

export function addProfile(profile: Omit<Profile, 'id'>): Profile {
  const profiles = loadProfiles()
  const newProfile: Profile = { ...profile, id: `profile-${Date.now()}` }
  profiles.push(newProfile)
  saveProfiles(profiles)
  return newProfile
}

export function updateProfile(id: string, updates: Partial<Omit<Profile, 'id'>>): void {
  const profiles = loadProfiles()
  const idx = profiles.findIndex((p) => p.id === id)
  if (idx !== -1) {
    profiles[idx] = { ...profiles[idx], ...updates } as Profile
    saveProfiles(profiles)
  }
}

export function deleteProfile(id: string): void {
  const profiles = loadProfiles().filter((p) => p.id !== id)
  saveProfiles(profiles)
}

export function resetProfiles(): void {
  saveProfiles(defaultProfiles())
}
