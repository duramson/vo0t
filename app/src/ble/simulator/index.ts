import * as UUID from '../uuids'
import { MockDevice, MockGATTService } from './MockDevice'
import { VirtualCraftyState } from './VirtualCraftyState'
import { MockCharacteristic } from './MockCharacteristic'

export type { VirtualState } from './VirtualCraftyState'

let virtualState: VirtualCraftyState | null = null

/** Get the active virtual state (for the dev panel) */
export function getVirtualState(): VirtualCraftyState | null {
  return virtualState
}

/**
 * Create a virtual Crafty device that implements the BluetoothDevice interface.
 * CraftyConnection can use this transparently in place of a real device.
 */
export function createVirtualDevice(): MockDevice {
  virtualState = new VirtualCraftyState()
  const chars = virtualState.getCharacteristics()

  // Group characteristics by service UUID
  const s1Chars = new Map<string, MockCharacteristic>()
  const s2Chars = new Map<string, MockCharacteristic>()
  const s3Chars = new Map<string, MockCharacteristic>()

  const service1UUIDs = [
    UUID.CURRENT_TEMPERATURE,
    UUID.SET_TEMPERATURE,
    UUID.BOOST_TEMPERATURE,
    UUID.BATTERY_PERCENT,
    UUID.LED_BRIGHTNESS,
    UUID.AUTO_OFF_COUNTDOWN,
    UUID.AUTO_OFF_CURRENT,
    UUID.HEATER_ON,
    UUID.HEATER_OFF,
  ]

  const service2UUIDs = [
    UUID.MODEL,
    UUID.FIRMWARE_VERSION,
    UUID.BLUETOOTH_ADDRESS,
    UUID.SERIAL_NUMBER,
    UUID.BLE_FIRMWARE_VERSION,
  ]

  for (const [uuid, char] of chars) {
    if (service1UUIDs.includes(uuid)) {
      s1Chars.set(uuid, char)
    } else if (service2UUIDs.includes(uuid)) {
      s2Chars.set(uuid, char)
    } else {
      s3Chars.set(uuid, char)
    }
  }

  const services = new Map<string, MockGATTService>()
  services.set(UUID.SERVICE_1, new MockGATTService(s1Chars))
  services.set(UUID.SERVICE_2, new MockGATTService(s2Chars))
  services.set(UUID.SERVICE_3, new MockGATTService(s3Chars))

  const device = new MockDevice(services)

  // Start the simulation engine
  virtualState.start()

  return device
}
