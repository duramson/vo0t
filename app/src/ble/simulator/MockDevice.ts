import { MockCharacteristic } from './MockCharacteristic'

type DisconnectListener = () => void

class MockGATTService {
  private characteristics: Map<string, MockCharacteristic>

  constructor(chars: Map<string, MockCharacteristic>) {
    this.characteristics = chars
  }

  async getCharacteristic(uuid: string): Promise<MockCharacteristic> {
    const c = this.characteristics.get(uuid)
    if (!c) throw new DOMException(`Characteristic ${uuid} not found`, 'NotFoundError')
    return c
  }
}

class MockGATTServer {
  connected = false
  private services: Map<string, MockGATTService>
  private onDisconnect: () => void

  constructor(services: Map<string, MockGATTService>, onDisconnect: () => void) {
    this.services = services
    this.onDisconnect = onDisconnect
  }

  async connect(): Promise<MockGATTServer> {
    this.connected = true
    return this
  }

  disconnect(): void {
    this.connected = false
    this.onDisconnect()
  }

  async getPrimaryService(uuid: string): Promise<MockGATTService> {
    const s = this.services.get(uuid)
    if (!s) throw new DOMException(`Service ${uuid} not found`, 'NotFoundError')
    return s
  }
}

export class MockDevice {
  private disconnectListeners: Set<DisconnectListener> = new Set()
  gatt: MockGATTServer

  constructor(services: Map<string, MockGATTService>) {
    this.gatt = new MockGATTServer(services, () => {
      this.disconnectListeners.forEach((fn) => fn())
    })
  }

  addEventListener(type: string, listener: DisconnectListener): void {
    if (type === 'gattserverdisconnected') {
      this.disconnectListeners.add(listener)
    }
  }

  removeEventListener(type: string, listener: DisconnectListener): void {
    if (type === 'gattserverdisconnected') {
      this.disconnectListeners.delete(listener)
    }
  }

  /** Simulate a device disconnect (for dev panel) */
  forceDisconnect(): void {
    this.gatt.disconnect()
  }
}

export { MockGATTService }
