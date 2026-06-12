import { useState, useCallback } from 'preact/hooks'
import { crafty, type CraftyState } from '../ble'
import { toast } from '../components/Toast'

export function useDeviceSettings(state: CraftyState) {
  const [pendingLed, setPendingLed] = useState<number | null>(null)
  const [pendingAutoOff, setPendingAutoOff] = useState<number | null>(null)

  const displayLed = pendingLed ?? state.ledBrightness
  const displayAutoOff = pendingAutoOff ?? state.autoOffSeconds

  const commitLed = useCallback(async (val: number) => {
    try {
      await crafty.setLedBrightness(val)
    } catch (e) {
      toast.error('Failed to set LED brightness')
      console.error(e)
    }
    setPendingLed(null)
  }, [])

  const commitAutoOff = useCallback(async (val: number) => {
    try {
      await crafty.setAutoOff(val)
    } catch (e) {
      toast.error('Failed to set auto-off')
      console.error(e)
    }
    setPendingAutoOff(null)
  }, [])

  const toggleVibration = useCallback(async (val: boolean) => {
    try {
      await crafty.toggleVibration(val)
    } catch {
      toast.error('Failed to toggle vibration')
    }
  }, [])

  const toggleChargeLed = useCallback(async (val: boolean) => {
    try {
      await crafty.toggleChargeLed(val)
    } catch {
      toast.error('Failed to toggle charge LED')
    }
  }, [])

  const toggleBlePermanent = useCallback(async (val: boolean) => {
    try {
      await crafty.toggleBlePermanent(val)
    } catch {
      toast.error('Failed to toggle BLE setting')
    }
  }, [])

  const triggerFactoryReset = useCallback(async () => {
    try {
      await crafty.factoryReset()
      toast.success('Factory reset initiated')
    } catch {
      toast.error('Reset failed')
    }
  }, [])

  return {
    setPendingLed,
    displayLed,
    commitLed,
    setPendingAutoOff,
    displayAutoOff,
    commitAutoOff,
    toggleVibration,
    toggleChargeLed,
    toggleBlePermanent,
    triggerFactoryReset,
  }
}
