/**
 * All Crafty/Crafty+ BLE UUIDs.
 * Base pattern: 0000XXXX-4c45-4b43-4942-265a524f5453 ("STORZ&BICKEL" reversed)
 */

const BASE = '-4c45-4b43-4942-265a524f5453'
const uuid = (short: string) => `0000${short}${BASE}`

// ── Services ──────────────────────────────────────────────
export const SERVICE_1 = uuid('0001') // Control
export const SERVICE_2 = uuid('0002') // Device Info
export const SERVICE_3 = uuid('0003') // Status / Misc

// ── Service 1 – Control ──────────────────────────────────
export const CURRENT_TEMPERATURE = uuid('0011') // R, Notify – UInt16LE /10 → °C
export const SET_TEMPERATURE = uuid('0021') // R, W      – UInt16LE /10 → °C
export const BOOST_TEMPERATURE = uuid('0031') // R, W      – UInt16LE /10 → °C (offset 0-30)
export const BATTERY_PERCENT = uuid('0041') // R, Notify – UInt16LE 0-100
export const LED_BRIGHTNESS = uuid('0051') // R, W      – UInt16LE 0-100
export const AUTO_OFF_COUNTDOWN = uuid('0061') // R, W      – UInt16LE seconds (max 300) – needs code 815
export const AUTO_OFF_CURRENT = uuid('0071') // R, Notify – UInt16LE live countdown
export const HEATER_ON = uuid('0081') // W         – write 0 (Crafty+ only)
export const HEATER_OFF = uuid('0091') // W         – write 0 (Crafty+ only)

// ── Service 2 – Device Info ──────────────────────────────
export const MODEL = uuid('0022') // R – UTF-8
export const FIRMWARE_VERSION = uuid('0032') // R – UTF-8 e.g. "V2.48"
export const BLUETOOTH_ADDRESS = uuid('0042') // R – hex bytes
export const SERIAL_NUMBER = uuid('0052') // R – UTF-8 (first 8 chars)
export const BLE_FIRMWARE_VERSION = uuid('0072') // R – 3×UInt8 → V{b0}.{b1}.{b2} (Crafty+ only)

// ── Service 3 – Status / Misc ────────────────────────────
export const OPERATING_TIME_ACCU = uuid('0013') // R – UInt16LE /10 → hours
export const USAGE_HOURS = uuid('0023') // R – UInt16LE
export const HARDWARE_ID = uuid('0033') // R – ASCII
export const PCB_VERSION = uuid('0043') // R – UInt16LE (hex)
export const SN_HARDWARE = uuid('0053') // R – ASCII
export const AKKU_STATUS_1 = uuid('0063') // R – bitmask
export const AKKU_STATUS_2 = uuid('0073') // R – bitmask
export const SYSTEM_STATUS = uuid('0083') // R – bitmask
export const PROJECT_REGISTER = uuid('0093') // R, Notify – bitmask
export const CHARGING_STATUS = uuid('00a3') // R – UInt16LE
export const VOLTAGE_ACCU = uuid('00b3') // R – mV
export const VOLTAGE_MAINS = uuid('00c3') // R – mV
export const VOLTAGE_HEATING = uuid('00d3') // R – mV
export const CURRENT_ACCU = uuid('00e3') // R – mA
export const CURRENT_TEMP_PT1000 = uuid('00f3') // R – UInt16LE /10 → °C
export const ADJUSTED_TEMP_PT1000 = uuid('0103') // R – UInt16LE /10 → °C
export const ACCU_TEMPERATURE = uuid('0113') // R – UInt16LE /10 → °C
export const ACCU_TEMPERATURE_MIN = uuid('0123') // R – UInt16LE /10 → °C
export const ACCU_TEMPERATURE_MAX = uuid('0133') // R – UInt16LE /10 → °C
export const BATTERY_TOTAL_CAP = uuid('0143') // R – mAh
export const BATTERY_REMAINING_CAP = uuid('0153') // R – mAh
export const DISCHARGE_CYCLES = uuid('0163') // R – UInt16LE
export const CHARGE_CYCLES = uuid('0173') // R – UInt16LE
export const BATTERY_DESIGN_CAP = uuid('0183') // R – mAh
export const SECURITY_CODE = uuid('01b3') // W – UInt16LE (815 or 1000)
export const SETTINGS_REGISTER_2 = uuid('01c3') // R, W, Notify – bitmask
export const FACTORY_RESET = uuid('01d3') // W – UInt8 write 0
export const USAGE_MINUTES = uuid('01e3') // R – UInt16LE (Crafty+ only)

// ── Bitmasks ─────────────────────────────────────────────
export const PROJECT_REG = {
  HEATER_ACTIVE: 0x0010,
  BOOST_ENABLED: 0x0020,
  SUPERBOOST: 0x0040,
  ERROR_FLAG_LOW: 0x0008,
  ERROR_FLAG_HIGH: 0x2000,
  FACTORY_RESET: 0x8000,
} as const

export const SETTINGS_REG = {
  DISABLE_VIBRATION: 0x0001,
  DISABLE_CHARGE_LED: 0x0002,
  TEMP_REACHED: 0x0004,
  FIND_DEVICE: 0x0008,
  AUTO_BLE_SHUTDOWN: 0x1000,
} as const

export const AKKU_1 = {
  BATTERY_LOW: 0x0003,
  BATTERY_ERROR: 0x0200,
  TEMP_WARNING: 0x0400,
  COOL_DOWN: 0x3000,
} as const

export const AKKU_2 = {
  CHARGER_ISSUE: 0x8000,
} as const

export const SYSTEM = {
  ERROR: 0x0280,
} as const

// ── Constants ────────────────────────────────────────────
export const TEMP_MIN = 40 // °C
export const TEMP_MAX = 210 // °C
export const BOOST_MIN = 0 // °C
export const BOOST_MAX = 15 // °C (original app uses +/- buttons with no visible cap; 15°C assumed)
export const AUTO_OFF_MAX = 300 // seconds
export const SUPERBOOST_OFFSET = 15 // °C added on 2nd press
export const SECURITY_CODE_AUTO_OFF = 815
export const SECURITY_CODE_FACTORY_RESET = 1000
