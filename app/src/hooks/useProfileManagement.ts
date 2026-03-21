import { useState, useCallback } from 'preact/hooks'
import {
  getProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  type Profile,
} from '../store/profiles'

export function useProfileManagement() {
  const [profiles, setProfiles] = useState<Profile[]>(getProfiles)

  const handleAddProfile = useCallback((setTemp: number, boostTemp: number) => {
    const p = addProfile({
      name: `Profile ${getProfiles().length + 1}`,
      setTemp,
      boostTemp,
    })
    setProfiles((prev) => [...prev, p])
    return p
  }, [])

  const handleDeleteProfile = useCallback((id: string) => {
    deleteProfile(id)
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleUpdateProfile = useCallback((id: string, updates: Partial<Omit<Profile, 'id'>>) => {
    updateProfile(id, updates)
    setProfiles(getProfiles())
  }, [])

  return {
    profiles,
    handleAddProfile,
    handleDeleteProfile,
    handleUpdateProfile,
  }
}
