/**
 * Core BLE connection and communication layer for the Crafty/Crafty+.
 * Uses the Web Bluetooth API with a serialized command queue.
 */
import * as UUID from './uuids'
import { bleQueue } from './queue'
import {
  toUint16LE,
  toUint8,
  readUint16LE,
  readString,
  readBleFirmware,
  rawToTemp,
  tempToRaw,
} from './encoding'

export type CraftyDeviceInfo = {
  model: string
  firmware: string
  serial: string
  bluetoothAddress: string
  bleFirmware: string
}

export type CraftyState = {
  connected: boolean
  currentTemp: number // °C
  setTemp: number // °C
  boostTemp: number // °C
  battery: number // 0-100
  ledBrightness: number // 0-100
  autoOffSeconds: number
  autoOffRemaining: number
  heaterActive: boolean
  boostActive: boolean
  superBoostActive: boolean
  chargingStatus: number
  vibrationEnabled: boolean
  chargeLedEnabled: boolean
  blePermanent: boolean
  tempReached: boolean
  settingsRaw: number
  projectRegRaw: number
  deviceInfo: CraftyDeviceInfo | null
}

export type CraftyDiagnostics = {
  operatingTimeAccu: number
  usageHours: number
  usageMinutes: number
  hardwareId: string
  pcbVersion: number
  snHardware: string
  akkuStatus1: number
  akkuStatus2: number
  systemStatus: number
  voltageAccu: number
  voltageMains: number
  voltageHeating: number
  currentAccu: number
  accuTemp: number
  accuTempMin: number
  accuTempMax: number
  batteryTotalCap: number
  batteryRemainingCap: number
  batteryDesignCap: number
  dischargeCycles: number
  chargeCycles: number
  pt1000Current: number
  pt1000Adjusted: number
}

type Listener = () => void

export class CraftyConnection {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private services: Map<string, BluetoothRemoteGATTService> = new Map()
  private chars: Map<string, BluetoothRemoteGATTCharacteristic> = new Map()
  private listeners: Set<Listener> = new Set()
  private cleanupFunctions: Array<() => void> = []

  state: CraftyState = this.defaultState()

  private defaultState(): CraftyState {
    return {
      connected: false,
      currentTemp: 0,
      setTemp: 0,
      boostTemp: 0,
      battery: 0,
      ledBrightness: 0,
      autoOffSeconds: 0,
      autoOffRemaining: 0,
      heaterActive: false,
      boostActive: false,
      superBoostActive: false,
      chargingStatus: 0,
      vibrationEnabled: true,
      chargeLedEnabled: true,
      blePermanent: false,
      tempReached: false,
      settingsRaw: 0,
      projectRegRaw: 0,
      deviceInfo: null,
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(): void {
    // We mutate this.state in place, but create a new reference for React
    this.state = { ...this.state }
    this.listeners.forEach((fn) => fn())
  }

  // ── Connection ─────────────────────────────────────────

  async connect(): Promise<void> {
    if (import.meta.env.VITE_DEV_SIMULATION === 'true') {
      const { createVirtualDevice } = await import('./simulator')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.device = createVirtualDevice() as any
    } else {
      if (!navigator.bluetooth) throw new Error('Web Bluetooth not supported')

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Storz' }, { namePrefix: 'STORZ' }, { namePrefix: 'S&B' }],
        optionalServices: [UUID.SERVICE_1, UUID.SERVICE_2, UUID.SERVICE_3],
      })
    }

    const device = this.device
    if (!device) throw new Error('Failed to acquire device')

    device.addEventListener('gattserverdisconnected', this.onDisconnect)
    // Ensure we clean up the listener to prevent memory leaks if device object persists
    this.cleanupFunctions.push(() => {
      this.device?.removeEventListener('gattserverdisconnected', this.onDisconnect)
    })

    if (!device.gatt) throw new Error('No GATT server found')
    this.server = await device.gatt.connect()

    // Discover services
    const [s1, s2, s3] = await Promise.all([
      this.server.getPrimaryService(UUID.SERVICE_1),
      this.server.getPrimaryService(UUID.SERVICE_2),
      this.server.getPrimaryService(UUID.SERVICE_3),
    ])
    this.services.set(UUID.SERVICE_1, s1)
    this.services.set(UUID.SERVICE_2, s2)
    this.services.set(UUID.SERVICE_3, s3)

    // Get all characteristics we need
    await this.discoverCharacteristics(s1, [
      UUID.CURRENT_TEMPERATURE,
      UUID.SET_TEMPERATURE,
      UUID.BOOST_TEMPERATURE,
      UUID.BATTERY_PERCENT,
      UUID.LED_BRIGHTNESS,
      UUID.AUTO_OFF_COUNTDOWN,
      UUID.AUTO_OFF_CURRENT,
      UUID.HEATER_ON,
      UUID.HEATER_OFF,
    ])
    await this.discoverCharacteristics(s2, [
      UUID.MODEL,
      UUID.FIRMWARE_VERSION,
      UUID.BLUETOOTH_ADDRESS,
      UUID.SERIAL_NUMBER,
      UUID.BLE_FIRMWARE_VERSION,
    ])
    await this.discoverCharacteristics(s3, [
      UUID.PROJECT_REGISTER,
      UUID.SETTINGS_REGISTER_2,
      UUID.CHARGING_STATUS,
      UUID.SECURITY_CODE,
      UUID.OPERATING_TIME_ACCU,
      UUID.USAGE_HOURS,
      UUID.HARDWARE_ID,
      UUID.PCB_VERSION,
      UUID.SN_HARDWARE,
      UUID.AKKU_STATUS_1,
      UUID.AKKU_STATUS_2,
      UUID.SYSTEM_STATUS,
      UUID.VOLTAGE_ACCU,
      UUID.VOLTAGE_MAINS,
      UUID.VOLTAGE_HEATING,
      UUID.CURRENT_ACCU,
      UUID.CURRENT_TEMP_PT1000,
      UUID.ADJUSTED_TEMP_PT1000,
      UUID.ACCU_TEMPERATURE,
      UUID.ACCU_TEMPERATURE_MIN,
      UUID.ACCU_TEMPERATURE_MAX,
      UUID.BATTERY_TOTAL_CAP,
      UUID.BATTERY_REMAINING_CAP,
      UUID.BATTERY_DESIGN_CAP,
      UUID.DISCHARGE_CYCLES,
      UUID.CHARGE_CYCLES,
      UUID.USAGE_MINUTES,
    ])

    this.state.connected = true
    this.notify()

    // Read initial state
    await this.readInitialState()

    // Start notifications
    await this.startNotifications()
  }

  private async discoverCharacteristics(
    service: BluetoothRemoteGATTService,
    uuids: string[],
  ): Promise<void> {
    for (const uuid of uuids) {
      try {
        const c = await bleQueue.enqueue(() => service.getCharacteristic(uuid))
        this.chars.set(uuid, c)
      } catch {
        // Characteristic not available (e.g., old firmware)
        console.warn(`Characteristic ${uuid} not available`)
      }
    }
  }

  disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
  }

  private onDisconnect = (): void => {
    this.cleanupFunctions.forEach((cleanup) => cleanup())
    this.cleanupFunctions = []

    this.state = { ...this.defaultState(), deviceInfo: this.state.deviceInfo }
    this.chars.clear()
    this.services.clear()
    this.server = null
    this.notify()
  }

  // ── Reads ──────────────────────────────────────────────

  private async readU16(uuid: string): Promise<number> {
    const c = this.chars.get(uuid)
    if (!c) return 0
    const dv = await bleQueue.enqueue(() => c.readValue())
    return readUint16LE(dv)
  }

  private async readStr(uuid: string): Promise<string | null> {
    const c = this.chars.get(uuid)
    if (!c) return null
    const dv = await bleQueue.enqueue(() => c.readValue())
    return readString(dv)
  }

  private async readInitialState(): Promise<void> {
    // Device info
    const [model, firmware, btAddr, serial] = await Promise.all([
      this.readStr(UUID.MODEL),
      this.readStr(UUID.FIRMWARE_VERSION),
      this.readStr(UUID.BLUETOOTH_ADDRESS),
      this.readStr(UUID.SERIAL_NUMBER),
    ])

    let bleFw = 'N/A'
    const bleFwChar = this.chars.get(UUID.BLE_FIRMWARE_VERSION)
    if (bleFwChar) {
      try {
        const dv = await bleQueue.enqueue(() => bleFwChar.readValue())
        bleFw = readBleFirmware(dv)
      } catch {
        bleFw = 'N/A'
      }
    }

    this.state.deviceInfo = {
      model: model ?? 'Unknown',
      firmware: firmware ?? 'Unknown',
      serial: serial ?? 'Unknown',
      bluetoothAddress: btAddr ?? 'Unknown',
      bleFirmware: bleFw,
    }

    // Control values
    const [setRaw, boostRaw, battRaw, ledRaw, autoOff, autoOffCur, chg, projReg, settReg] =
      await Promise.all([
        this.readU16(UUID.SET_TEMPERATURE),
        this.readU16(UUID.BOOST_TEMPERATURE),
        this.readU16(UUID.BATTERY_PERCENT),
        this.readU16(UUID.LED_BRIGHTNESS),
        this.readU16(UUID.AUTO_OFF_COUNTDOWN),
        this.readU16(UUID.AUTO_OFF_CURRENT),
        this.readU16(UUID.CHARGING_STATUS),
        this.readU16(UUID.PROJECT_REGISTER),
        this.readU16(UUID.SETTINGS_REGISTER_2),
      ])

    // Also read current temp
    const curRaw = await this.readU16(UUID.CURRENT_TEMPERATURE)

    this.state.currentTemp = rawToTemp(curRaw)
    this.state.setTemp = rawToTemp(setRaw)
    this.state.boostTemp = rawToTemp(boostRaw)
    this.state.battery = battRaw
    this.state.ledBrightness = ledRaw
    this.state.autoOffSeconds = autoOff
    this.state.autoOffRemaining = autoOffCur
    this.state.chargingStatus = chg
    this.applyProjectRegister(projReg)
    this.applySettingsRegister(settReg)
    this.notify()
  }

  private applyProjectRegister(val: number): void {
    this.state.projectRegRaw = val
    this.state.heaterActive = !!(val & UUID.PROJECT_REG.HEATER_ACTIVE)
    this.state.boostActive = !!(val & UUID.PROJECT_REG.BOOST_ENABLED)
    this.state.superBoostActive = !!(val & UUID.PROJECT_REG.SUPERBOOST)
  }

  private applySettingsRegister(val: number): void {
    this.state.settingsRaw = val
    this.state.vibrationEnabled = !(val & UUID.SETTINGS_REG.DISABLE_VIBRATION)
    this.state.chargeLedEnabled = !(val & UUID.SETTINGS_REG.DISABLE_CHARGE_LED)
    this.state.blePermanent = !!(val & UUID.SETTINGS_REG.AUTO_BLE_SHUTDOWN)
    this.state.tempReached = !!(val & UUID.SETTINGS_REG.TEMP_REACHED)
  }

  // ── Notifications ──────────────────────────────────────

  private async startNotifications(): Promise<void> {
    const notifyMap: Array<[string, (dv: DataView) => void]> = [
      [
        UUID.CURRENT_TEMPERATURE,
        (dv) => {
          this.state.currentTemp = rawToTemp(readUint16LE(dv))
          this.notify()
        },
      ],
      [
        UUID.BATTERY_PERCENT,
        (dv) => {
          this.state.battery = readUint16LE(dv)
          this.notify()
        },
      ],
      [
        UUID.AUTO_OFF_CURRENT,
        (dv) => {
          this.state.autoOffRemaining = readUint16LE(dv)
          this.notify()
        },
      ],
      [
        UUID.PROJECT_REGISTER,
        (dv) => {
          this.applyProjectRegister(readUint16LE(dv))
          this.notify()
        },
      ],
      [
        UUID.SETTINGS_REGISTER_2,
        (dv) => {
          this.applySettingsRegister(readUint16LE(dv))
          this.notify()
        },
      ],
    ]

    for (const [uuid, handler] of notifyMap) {
      const c = this.chars.get(uuid)
      if (!c) continue
      try {
        await bleQueue.enqueue(() => c.startNotifications())
        const listener = (e: Event) => {
          const target = e.target as BluetoothRemoteGATTCharacteristic
          if (target.value) handler(target.value)
        }
        c.addEventListener('characteristicvaluechanged', listener)

        this.cleanupFunctions.push(() => {
          c.removeEventListener('characteristicvaluechanged', listener)
          // Attempt to stop notifications if still connected
          if (this.device?.gatt?.connected) {
            c.stopNotifications().catch((err) =>
              console.warn(`Failed to stop notifications for ${uuid}:`, err),
            )
          }
        })
      } catch (err) {
        console.warn(`Notify failed for ${uuid}:`, err)
      }
    }
  }

  // ── Writes ─────────────────────────────────────────────

  private async writeU16(uuid: string, value: number): Promise<void> {
    const c = this.chars.get(uuid)
    if (!c) throw new Error(`Characteristic ${uuid} not available`)
    await bleQueue.enqueue(() => c.writeValue(toUint16LE(value)))
  }

  async setTemperature(celsius: number): Promise<void> {
    const clamped = Math.max(UUID.TEMP_MIN, Math.min(UUID.TEMP_MAX, celsius))
    await this.writeU16(UUID.SET_TEMPERATURE, tempToRaw(clamped))
    this.state.setTemp = clamped
    this.notify()
  }

  async setBoostTemperature(celsius: number): Promise<void> {
    const clamped = Math.max(UUID.BOOST_MIN, Math.min(UUID.BOOST_MAX, celsius))
    await this.writeU16(UUID.BOOST_TEMPERATURE, tempToRaw(clamped))
    this.state.boostTemp = clamped
    this.notify()
  }

  async setLedBrightness(value: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, value))
    await this.writeU16(UUID.LED_BRIGHTNESS, clamped)
    this.state.ledBrightness = clamped
    this.notify()
  }

  async setAutoOff(seconds: number): Promise<void> {
    const clamped = Math.max(1, Math.min(UUID.AUTO_OFF_MAX, seconds))
    await this.writeU16(UUID.SECURITY_CODE, UUID.SECURITY_CODE_AUTO_OFF)
    await this.writeU16(UUID.AUTO_OFF_COUNTDOWN, clamped)
    this.state.autoOffSeconds = clamped
    this.notify()
  }

  async heaterOn(): Promise<void> {
    const c = this.chars.get(UUID.HEATER_ON)
    if (!c) throw new Error('Heater ON not supported (Crafty+ only)')
    await bleQueue.enqueue(() => c.writeValue(toUint16LE(0)))
  }

  async heaterOff(): Promise<void> {
    const c = this.chars.get(UUID.HEATER_OFF)
    if (!c) throw new Error('Heater OFF not supported (Crafty+ only)')
    await bleQueue.enqueue(() => c.writeValue(toUint16LE(0)))
  }

  async toggleVibration(enable: boolean): Promise<void> {
    const val = this.state.settingsRaw
    let modified = val & ~UUID.SETTINGS_REG.DISABLE_VIBRATION
    if (!enable) modified |= UUID.SETTINGS_REG.DISABLE_VIBRATION
    await this.writeU16(UUID.SETTINGS_REGISTER_2, modified)
    this.state.vibrationEnabled = enable
    this.state.settingsRaw = modified
    this.notify()
  }

  async toggleChargeLed(enable: boolean): Promise<void> {
    const val = this.state.settingsRaw
    let modified = val & ~UUID.SETTINGS_REG.DISABLE_CHARGE_LED
    if (!enable) modified |= UUID.SETTINGS_REG.DISABLE_CHARGE_LED
    await this.writeU16(UUID.SETTINGS_REGISTER_2, modified)
    this.state.chargeLedEnabled = enable
    this.state.settingsRaw = modified
    this.notify()
  }

  async toggleBlePermanent(enable: boolean): Promise<void> {
    const val = this.state.settingsRaw
    let modified = val & ~UUID.SETTINGS_REG.AUTO_BLE_SHUTDOWN
    if (enable) modified |= UUID.SETTINGS_REG.AUTO_BLE_SHUTDOWN
    await this.writeU16(UUID.SETTINGS_REGISTER_2, modified)
    this.state.blePermanent = enable
    this.state.settingsRaw = modified
    this.notify()
  }

  async findDevice(): Promise<void> {
    const val = this.state.settingsRaw | UUID.SETTINGS_REG.FIND_DEVICE
    await this.writeU16(UUID.SETTINGS_REGISTER_2, val)
  }

  async factoryReset(): Promise<void> {
    await this.writeU16(UUID.SECURITY_CODE, UUID.SECURITY_CODE_FACTORY_RESET)
    const c = this.chars.get(UUID.FACTORY_RESET)
    if (!c) throw new Error('Factory reset not supported')
    await bleQueue.enqueue(() => c.writeValue(toUint8(0)))
  }

  // ── Diagnostics ────────────────────────────────────────

  async readDiagnostics(): Promise<CraftyDiagnostics> {
    const [
      opTime,
      hours,
      hwId,
      pcb,
      snHw,
      ak1,
      ak2,
      sysStat,
      vAccu,
      vMains,
      vHeat,
      iAccu,
      pt1k,
      pt1kAdj,
      aTemp,
      aTmin,
      aTmax,
      bTotal,
      bRemain,
      bDesign,
      disCyc,
      chgCyc,
      minutes,
    ] = await Promise.all([
      this.readU16(UUID.OPERATING_TIME_ACCU),
      this.readU16(UUID.USAGE_HOURS),
      this.readStr(UUID.HARDWARE_ID),
      this.readU16(UUID.PCB_VERSION),
      this.readStr(UUID.SN_HARDWARE),
      this.readU16(UUID.AKKU_STATUS_1),
      this.readU16(UUID.AKKU_STATUS_2),
      this.readU16(UUID.SYSTEM_STATUS),
      this.readU16(UUID.VOLTAGE_ACCU),
      this.readU16(UUID.VOLTAGE_MAINS),
      this.readU16(UUID.VOLTAGE_HEATING),
      this.readU16(UUID.CURRENT_ACCU),
      this.readU16(UUID.CURRENT_TEMP_PT1000),
      this.readU16(UUID.ADJUSTED_TEMP_PT1000),
      this.readU16(UUID.ACCU_TEMPERATURE),
      this.readU16(UUID.ACCU_TEMPERATURE_MIN),
      this.readU16(UUID.ACCU_TEMPERATURE_MAX),
      this.readU16(UUID.BATTERY_TOTAL_CAP),
      this.readU16(UUID.BATTERY_REMAINING_CAP),
      this.readU16(UUID.BATTERY_DESIGN_CAP),
      this.readU16(UUID.DISCHARGE_CYCLES),
      this.readU16(UUID.CHARGE_CYCLES),
      this.readU16(UUID.USAGE_MINUTES),
    ])

    return {
      operatingTimeAccu: opTime / 10,
      usageHours: hours,
      usageMinutes: minutes,
      hardwareId: hwId || '',
      pcbVersion: pcb,
      snHardware: snHw || '',
      akkuStatus1: ak1,
      akkuStatus2: ak2,
      systemStatus: sysStat,
      voltageAccu: vAccu,
      voltageMains: vMains,
      voltageHeating: vHeat,
      currentAccu: iAccu,
      accuTemp: rawToTemp(aTemp),
      accuTempMin: rawToTemp(aTmin),
      accuTempMax: rawToTemp(aTmax),
      batteryTotalCap: bTotal,
      batteryRemainingCap: bRemain,
      batteryDesignCap: bDesign,
      dischargeCycles: disCyc,
      chargeCycles: chgCyc,
      pt1000Current: rawToTemp(pt1k),
      pt1000Adjusted: rawToTemp(pt1kAdj),
    }
  }
}

/** Singleton connection */
export const crafty = new CraftyConnection()
