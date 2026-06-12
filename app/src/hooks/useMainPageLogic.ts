import { useState, useCallback, useMemo } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { useDeviceCapabilities } from './useDeviceCapabilities'
import { crafty } from '../ble'
import { SUPERBOOST_OFFSET, TEMP_MAX } from '../ble/uuids'
import { type Profile } from '../store/profiles'
import { toast } from '../components/Toast'

export function useMainPageLogic() {
  const { state } = useCrafty()
  const canHeaterControl = useDeviceCapabilities().supportsHeaterControl

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [pendingTemp, setPendingTemp] = useState<number | null>(null)
  const [pendingBoost, setPendingBoost] = useState<number | null>(null)

  const displaySetTemp = pendingTemp ?? state.setTemp
  const displayBoost = pendingBoost ?? state.boostTemp

  const boostTemp1 = useMemo(
    () => Math.min(displaySetTemp + displayBoost, TEMP_MAX),
    [displaySetTemp, displayBoost],
  )
  const boostTemp2 = useMemo(
    () => Math.min(displaySetTemp + displayBoost + SUPERBOOST_OFFSET, TEMP_MAX),
    [displaySetTemp, displayBoost],
  )

  const label = useMemo(
    () => (state.heaterActive ? 'Heating…' : state.tempReached ? 'Ready ✓' : 'Idle'),
    [state.heaterActive, state.tempReached],
  )

  const commitTemp = useCallback(async (val: number) => {
    try {
      await crafty.setTemperature(val)
    } catch (e) {
      toast.error('Failed to set temperature')
      console.error(e)
    }
    setPendingTemp(null)
  }, [])

  const commitBoost = useCallback(async (val: number) => {
    try {
      await crafty.setBoostTemperature(val)
    } catch (e) {
      toast.error('Failed to set boost')
      console.error(e)
    }
    setPendingBoost(null)
  }, [])

  const handleTempChange = useCallback((val: number) => {
    setPendingTemp(val)
    setActiveProfile(null)
  }, [])

  const handleBoostChange = useCallback((val: number) => {
    setPendingBoost(val)
    setActiveProfile(null)
  }, [])

  const handleActivateProfile = useCallback(async (profile: Profile) => {
    try {
      // Both writes clamp against the combined cap (setTemp + boost ≤ TEMP_MAX)
      // using the *current* device state. Write the value that moves downward
      // first, so the cap never clips the profile's other value.
      if (profile.setTemp <= crafty.state.setTemp) {
        await crafty.setTemperature(profile.setTemp)
        await crafty.setBoostTemperature(profile.boostTemp)
      } else {
        await crafty.setBoostTemperature(profile.boostTemp)
        await crafty.setTemperature(profile.setTemp)
      }
      setActiveProfile(profile)
    } catch (e) {
      toast.error('Failed to apply profile')
      console.error(e)
    }
  }, [])

  const handleDeactivateProfile = useCallback(() => setActiveProfile(null), [])

  const toggleHeater = useCallback(async () => {
    try {
      await (state.heaterActive ? crafty.heaterOff() : crafty.heaterOn())
    } catch (e) {
      toast.error('Heater control failed')
      console.error(e)
    }
  }, [state.heaterActive])

  return {
    state,
    canHeaterControl,
    activeProfile,
    displaySetTemp,
    displayBoost,
    boostTemp1,
    boostTemp2,
    label,
    commitTemp,
    commitBoost,
    handleTempChange,
    handleBoostChange,
    handleActivateProfile,
    handleDeactivateProfile,
    toggleHeater,
  }
}
