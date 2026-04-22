import { useCallback } from 'preact/hooks'
import { useProfileStore, type Profile } from '../store/profiles'

export function useProfileManagement() {
  const profiles = useProfileStore((s) => s.profiles)

  const handleAddProfile = useCallback((setTemp: number, boostTemp: number) => {
    const { addProfile, profiles } = useProfileStore.getState()
    return addProfile({ name: `Profile ${profiles.length + 1}`, setTemp, boostTemp })
  }, [])

  const handleDeleteProfile = useCallback((id: string) => {
    useProfileStore.getState().deleteProfile(id)
  }, [])

  const handleUpdateProfile = useCallback(
    (id: string, updates: Partial<Omit<Profile, 'id'>>) => {
      useProfileStore.getState().updateProfile(id, updates)
    },
    [],
  )

  return {
    profiles,
    handleAddProfile,
    handleDeleteProfile,
    handleUpdateProfile,
  }
}
