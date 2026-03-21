/** BLE data encoding/decoding helpers */

/** Convert number to UInt16 Little-Endian buffer */
export function toUint16LE(value: number): ArrayBuffer {
  const buf = new ArrayBuffer(2)
  new DataView(buf).setUint16(0, value, true)
  return buf
}

/** Read UInt16 Little-Endian from DataView */
export function readUint16LE(dv: DataView): number {
  return dv.getUint16(0, true)
}

/** Convert number to UInt8 buffer */
export function toUint8(value: number): ArrayBuffer {
  const buf = new ArrayBuffer(1)
  new DataView(buf).setUint8(0, value)
  return buf
}

/** Raw temp value (÷10) → °C */
export function rawToTemp(raw: number): number {
  return raw / 10
}

/** °C → raw temp value (×10) */
export function tempToRaw(celsius: number): number {
  return Math.round(celsius * 10)
}

/** °C → °F */
export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 1.8 + 32)
}

/** °F → °C */
export function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) / 1.8)
}

/** Read UTF-8 string from DataView */
export function readString(dv: DataView): string {
  const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)
  return new TextDecoder().decode(bytes).replace(/\0+$/, '')
}

/** Read BLE firmware version (3 × UInt8) */
export function readBleFirmware(dv: DataView): string {
  if (dv.byteLength < 3) return 'N/A'
  return `V${dv.getUint8(0)}.${dv.getUint8(1)}.${dv.getUint8(2)}`
}

/** Parse firmware string "V2.48" → { major, minor } */
export function parseFirmware(fw: string): { major: number; minor: number } {
  const match = fw.match(/V?(\d+)\.(\d+)/)
  if (!match) return { major: 0, minor: 0 }
  return { major: parseInt(match[1] || '0', 10), minor: parseInt(match[2] || '0', 10) }
}

/** Check if device is Crafty+ (major >= 3) */
export function isCraftyPlus(fw: string): boolean {
  return parseFirmware(fw).major >= 3
}

/** Check if firmware has advanced features (>= V2.51) */
export function hasAdvancedFeatures(fw: string): boolean {
  const { major, minor } = parseFirmware(fw)
  return major >= 3 || (major === 2 && minor >= 51)
}
