import { useMemo } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { isCraftyPlus, hasAdvancedFeatures } from '../ble/encoding'

export interface DeviceCapabilities {
  /** Auto-off timer is readable/writable (firmware ≥ V2.51) */
  supportsAutoOff: boolean
  /** Factory reset characteristic is available (firmware ≥ V2.51) */
  supportsFactoryReset: boolean
  /** Settings register (vibration, charge LED, permanent BLE) is writable (firmware ≥ V2.51) */
  supportsBleSettings: boolean
  /** Heater can be toggled over BLE (firmware ≥ V2.51) */
  supportsHeaterControl: boolean
  /** Find-device vibrate/blink (Crafty+ only) */
  supportsFindDevice: boolean
}

/**
 * Feature flags derived from the connected device's firmware version.
 * Old firmware (< V2.51) silently ignores or rejects writes to these
 * characteristics, so the UI hides the controls instead.
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const { state } = useCrafty()
  const fw = state.deviceInfo?.firmware ?? ''

  return useMemo(() => {
    const advanced = hasAdvancedFeatures(fw)
    return {
      supportsAutoOff: advanced,
      supportsFactoryReset: advanced,
      supportsBleSettings: advanced,
      supportsHeaterControl: advanced,
      supportsFindDevice: isCraftyPlus(fw),
    }
  }, [fw])
}
