import * as UUID from '../uuids'
import { tempToRaw } from '../encoding'
import {
  MockCharacteristic,
  mockU16Char,
  mockStringChar,
  mockBleFwChar,
} from './MockCharacteristic'

export interface VirtualState {
  currentTemp: number
  setTemp: number
  boostTemp: number
  battery: number
  ledBrightness: number
  autoOffSeconds: number
  autoOffRemaining: number
  heaterActive: boolean
  boostActive: boolean
  superBoostActive: boolean
  chargingStatus: number
  settingsRaw: number
  projectRegRaw: number
}

const ROOM_TEMP = 22
const HEAT_RATE = 2.0 // °C per second
const COOL_RATE = 0.5 // °C per second
const BATTERY_DRAIN = 0.08 // % per second while heating
const TICK_MS = 500

export class VirtualCraftyState {
  private chars: Map<string, MockCharacteristic> = new Map()
  private timer: ReturnType<typeof setInterval> | null = null

  state: VirtualState = {
    currentTemp: ROOM_TEMP,
    setTemp: 185,
    boostTemp: 10,
    battery: 80,
    ledBrightness: 50,
    autoOffSeconds: 180,
    autoOffRemaining: 180,
    heaterActive: false,
    boostActive: false,
    superBoostActive: false,
    chargingStatus: 0,
    settingsRaw: 0,
    projectRegRaw: 0,
  }

  constructor() {
    this.buildCharacteristics()
  }

  getCharacteristics(): Map<string, MockCharacteristic> {
    return this.chars
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), TICK_MS)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  // ── Public manipulation (for dev panel) ────────────────

  setBattery(pct: number): void {
    this.state.battery = Math.max(0, Math.min(100, Math.round(pct)))
    this.notifyChar(UUID.BATTERY_PERCENT, this.state.battery)
  }

  setCurrentTemp(temp: number): void {
    this.state.currentTemp = temp
    this.notifyChar(UUID.CURRENT_TEMPERATURE, tempToRaw(temp))
  }

  forceHeater(on: boolean): void {
    this.state.heaterActive = on
    this.rebuildProjectReg()
  }

  // ── Internal simulation ────────────────────────────────

  private tick(): void {
    const dt = TICK_MS / 1000

    if (this.state.heaterActive) {
      const effectiveTarget = this.state.boostActive
        ? this.state.setTemp + this.state.boostTemp
        : this.state.setTemp

      if (this.state.currentTemp < effectiveTarget) {
        this.state.currentTemp = Math.min(this.state.currentTemp + HEAT_RATE * dt, effectiveTarget)
      } else if (this.state.currentTemp > effectiveTarget + 1) {
        // Overshoot: cool toward target
        this.state.currentTemp = Math.max(this.state.currentTemp - COOL_RATE * dt, effectiveTarget)
      }

      // Battery drain
      this.state.battery = Math.max(0, this.state.battery - BATTERY_DRAIN * dt)

      // Auto-off countdown
      this.state.autoOffRemaining = Math.max(0, this.state.autoOffRemaining - dt)
      if (this.state.autoOffRemaining <= 0) {
        this.state.heaterActive = false
        this.state.autoOffRemaining = 0
        this.rebuildProjectReg()
      }

      // Temp reached flag in settings register
      if (this.state.currentTemp >= effectiveTarget - 1) {
        this.state.settingsRaw |= UUID.SETTINGS_REG.TEMP_REACHED
      } else {
        this.state.settingsRaw &= ~UUID.SETTINGS_REG.TEMP_REACHED
      }
    } else {
      // Cooling toward room temp
      if (this.state.currentTemp > ROOM_TEMP + 0.5) {
        this.state.currentTemp = Math.max(this.state.currentTemp - COOL_RATE * dt, ROOM_TEMP)
      }
    }

    // Dispatch notifications
    this.notifyChar(UUID.CURRENT_TEMPERATURE, tempToRaw(this.state.currentTemp))
    this.notifyChar(UUID.BATTERY_PERCENT, Math.round(this.state.battery))
    this.notifyChar(UUID.AUTO_OFF_CURRENT, Math.round(this.state.autoOffRemaining))
    this.notifyChar(UUID.SETTINGS_REGISTER_2, this.state.settingsRaw)
  }

  private rebuildProjectReg(): void {
    let reg = 0
    if (this.state.heaterActive) reg |= UUID.PROJECT_REG.HEATER_ACTIVE
    if (this.state.boostActive) reg |= UUID.PROJECT_REG.BOOST_ENABLED
    if (this.state.superBoostActive) reg |= UUID.PROJECT_REG.SUPERBOOST
    this.state.projectRegRaw = reg
    this.notifyChar(UUID.PROJECT_REGISTER, reg)
  }

  private notifyChar(uuid: string, value: number): void {
    const c = this.chars.get(uuid)
    if (c) c.dispatchU16(value)
  }

  // ── Write handlers ─────────────────────────────────────

  private handleWrite(uuid: string, dv: DataView): void {
    const val = dv.byteLength >= 2 ? dv.getUint16(0, true) : dv.getUint8(0)

    switch (uuid) {
      case UUID.SET_TEMPERATURE:
        this.state.setTemp = val / 10
        break
      case UUID.BOOST_TEMPERATURE:
        this.state.boostTemp = val / 10
        break
      case UUID.LED_BRIGHTNESS:
        this.state.ledBrightness = val
        break
      case UUID.AUTO_OFF_COUNTDOWN:
        this.state.autoOffSeconds = val
        this.state.autoOffRemaining = val
        break
      case UUID.HEATER_ON:
        this.state.heaterActive = true
        this.state.autoOffRemaining = this.state.autoOffSeconds
        this.rebuildProjectReg()
        break
      case UUID.HEATER_OFF:
        this.state.heaterActive = false
        this.rebuildProjectReg()
        break
      case UUID.SETTINGS_REGISTER_2:
        this.state.settingsRaw = val
        this.notifyChar(UUID.SETTINGS_REGISTER_2, val)
        break
    }
  }

  // ── Characteristic factory ─────────────────────────────

  private buildCharacteristics(): void {
    const m = this.chars

    // Service 1 — Control
    m.set(
      UUID.CURRENT_TEMPERATURE,
      mockU16Char(UUID.CURRENT_TEMPERATURE, tempToRaw(this.state.currentTemp)),
    )
    m.set(UUID.SET_TEMPERATURE, mockU16Char(UUID.SET_TEMPERATURE, tempToRaw(this.state.setTemp)))
    m.set(
      UUID.BOOST_TEMPERATURE,
      mockU16Char(UUID.BOOST_TEMPERATURE, tempToRaw(this.state.boostTemp)),
    )
    m.set(UUID.BATTERY_PERCENT, mockU16Char(UUID.BATTERY_PERCENT, this.state.battery))
    m.set(UUID.LED_BRIGHTNESS, mockU16Char(UUID.LED_BRIGHTNESS, this.state.ledBrightness))
    m.set(UUID.AUTO_OFF_COUNTDOWN, mockU16Char(UUID.AUTO_OFF_COUNTDOWN, this.state.autoOffSeconds))
    m.set(UUID.AUTO_OFF_CURRENT, mockU16Char(UUID.AUTO_OFF_CURRENT, this.state.autoOffRemaining))
    m.set(UUID.HEATER_ON, mockU16Char(UUID.HEATER_ON, 0))
    m.set(UUID.HEATER_OFF, mockU16Char(UUID.HEATER_OFF, 0))

    // Service 2 — Device Info
    m.set(UUID.MODEL, mockStringChar(UUID.MODEL, 'CRAFTY+ SIM'))
    m.set(UUID.FIRMWARE_VERSION, mockStringChar(UUID.FIRMWARE_VERSION, 'V2.51'))
    m.set(UUID.BLUETOOTH_ADDRESS, mockStringChar(UUID.BLUETOOTH_ADDRESS, 'AA:BB:CC:DD:EE:FF'))
    m.set(UUID.SERIAL_NUMBER, mockStringChar(UUID.SERIAL_NUMBER, 'SIM12345'))
    m.set(UUID.BLE_FIRMWARE_VERSION, mockBleFwChar(UUID.BLE_FIRMWARE_VERSION, 1, 0, 0))

    // Service 3 — Status / Diagnostics
    m.set(UUID.PROJECT_REGISTER, mockU16Char(UUID.PROJECT_REGISTER, this.state.projectRegRaw))
    m.set(UUID.SETTINGS_REGISTER_2, mockU16Char(UUID.SETTINGS_REGISTER_2, this.state.settingsRaw))
    m.set(UUID.CHARGING_STATUS, mockU16Char(UUID.CHARGING_STATUS, 0))
    m.set(UUID.SECURITY_CODE, mockU16Char(UUID.SECURITY_CODE, 0))
    m.set(UUID.OPERATING_TIME_ACCU, mockU16Char(UUID.OPERATING_TIME_ACCU, 1250)) // 125h
    m.set(UUID.USAGE_HOURS, mockU16Char(UUID.USAGE_HOURS, 125))
    m.set(UUID.USAGE_MINUTES, mockU16Char(UUID.USAGE_MINUTES, 30))
    m.set(UUID.HARDWARE_ID, mockStringChar(UUID.HARDWARE_ID, 'HW-SIM-01'))
    m.set(UUID.PCB_VERSION, mockU16Char(UUID.PCB_VERSION, 0x0103))
    m.set(UUID.SN_HARDWARE, mockStringChar(UUID.SN_HARDWARE, 'SNHW-SIM'))
    m.set(UUID.AKKU_STATUS_1, mockU16Char(UUID.AKKU_STATUS_1, 0))
    m.set(UUID.AKKU_STATUS_2, mockU16Char(UUID.AKKU_STATUS_2, 0))
    m.set(UUID.SYSTEM_STATUS, mockU16Char(UUID.SYSTEM_STATUS, 0))
    m.set(UUID.VOLTAGE_ACCU, mockU16Char(UUID.VOLTAGE_ACCU, 7400)) // 7.4V
    m.set(UUID.VOLTAGE_MAINS, mockU16Char(UUID.VOLTAGE_MAINS, 0))
    m.set(UUID.VOLTAGE_HEATING, mockU16Char(UUID.VOLTAGE_HEATING, 7200))
    m.set(UUID.CURRENT_ACCU, mockU16Char(UUID.CURRENT_ACCU, 0))
    m.set(
      UUID.CURRENT_TEMP_PT1000,
      mockU16Char(UUID.CURRENT_TEMP_PT1000, tempToRaw(this.state.currentTemp)),
    )
    m.set(
      UUID.ADJUSTED_TEMP_PT1000,
      mockU16Char(UUID.ADJUSTED_TEMP_PT1000, tempToRaw(this.state.currentTemp)),
    )
    m.set(UUID.ACCU_TEMPERATURE, mockU16Char(UUID.ACCU_TEMPERATURE, tempToRaw(28)))
    m.set(UUID.ACCU_TEMPERATURE_MIN, mockU16Char(UUID.ACCU_TEMPERATURE_MIN, tempToRaw(18)))
    m.set(UUID.ACCU_TEMPERATURE_MAX, mockU16Char(UUID.ACCU_TEMPERATURE_MAX, tempToRaw(42)))
    m.set(UUID.BATTERY_TOTAL_CAP, mockU16Char(UUID.BATTERY_TOTAL_CAP, 3000)) // mAh
    m.set(UUID.BATTERY_REMAINING_CAP, mockU16Char(UUID.BATTERY_REMAINING_CAP, 2400))
    m.set(UUID.BATTERY_DESIGN_CAP, mockU16Char(UUID.BATTERY_DESIGN_CAP, 3000))
    m.set(UUID.DISCHARGE_CYCLES, mockU16Char(UUID.DISCHARGE_CYCLES, 142))
    m.set(UUID.CHARGE_CYCLES, mockU16Char(UUID.CHARGE_CYCLES, 145))
    m.set(UUID.FACTORY_RESET, mockU16Char(UUID.FACTORY_RESET, 0))

    // Hook writes: intercept writeValue on writable chars
    for (const [uuid, char] of m) {
      const originalWrite = char.writeValue.bind(char)
      char.writeValue = async (buffer: ArrayBuffer) => {
        await originalWrite(buffer)
        this.handleWrite(uuid, new DataView(buffer))
      }
    }
  }
}
