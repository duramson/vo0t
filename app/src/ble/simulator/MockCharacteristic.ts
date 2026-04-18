import { toUint16LE } from '../encoding'

type CharValueChangedListener = (event: Event) => void

export class MockCharacteristic {
  private listeners: Set<CharValueChangedListener> = new Set()
  private notifying = false
  private _value: DataView

  uuid: string

  constructor(uuid: string, initialValue: DataView) {
    this.uuid = uuid
    this._value = initialValue
  }

  get value(): DataView {
    return this._value
  }

  async readValue(): Promise<DataView> {
    return this._value
  }

  async writeValue(_buffer: ArrayBuffer): Promise<void> {
    const dv = new DataView(_buffer)
    this._value = dv
    // onWrite hook is handled externally by VirtualCraftyState
  }

  async startNotifications(): Promise<void> {
    this.notifying = true
  }

  async stopNotifications(): Promise<void> {
    this.notifying = false
  }

  addEventListener(_type: string, listener: CharValueChangedListener): void {
    this.listeners.add(listener)
  }

  removeEventListener(_type: string, listener: CharValueChangedListener): void {
    this.listeners.delete(listener)
  }

  /** Push a new value and dispatch notification to all listeners */
  dispatchUpdate(value: DataView): void {
    this._value = value
    if (!this.notifying) return
    const event = { target: this } as unknown as Event
    this.listeners.forEach((fn) => fn(event))
  }

  /** Convenience: push a UInt16LE value */
  dispatchU16(value: number): void {
    const buf = toUint16LE(value)
    this.dispatchUpdate(new DataView(buf))
  }
}

/** Create a MockCharacteristic initialized with a UInt16LE value */
export function mockU16Char(uuid: string, initial: number): MockCharacteristic {
  const buf = toUint16LE(initial)
  return new MockCharacteristic(uuid, new DataView(buf))
}

/** Create a MockCharacteristic initialized with a UTF-8 string */
export function mockStringChar(uuid: string, initial: string): MockCharacteristic {
  const enc = new TextEncoder().encode(initial)
  const buf = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength)
  return new MockCharacteristic(uuid, new DataView(buf as ArrayBuffer))
}

/** Create a MockCharacteristic initialized with 3 bytes (BLE firmware) */
export function mockBleFwChar(
  uuid: string,
  major: number,
  minor: number,
  patch: number,
): MockCharacteristic {
  const buf = new ArrayBuffer(3)
  const view = new DataView(buf)
  view.setUint8(0, major)
  view.setUint8(1, minor)
  view.setUint8(2, patch)
  return new MockCharacteristic(uuid, view)
}
