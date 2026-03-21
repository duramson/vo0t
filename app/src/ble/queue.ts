/**
 * BLE command queue – ensures serial access to characteristics.
 * Web Bluetooth requires operations to be serialized (no concurrent GATT ops).
 */

type QueuedOp<T> = {
  execute: () => Promise<T>
  resolve: (val: T) => void
  reject: (err: unknown) => void
}

class BluetoothQueue {
  private queue: QueuedOp<unknown>[] = []
  private running = false

  async enqueue<T>(op: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: op as () => Promise<unknown>,
        resolve: resolve as (val: unknown) => void,
        reject,
      })
      this.process()
    })
  }

  private async process(): Promise<void> {
    if (this.running) return
    this.running = true
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      if (!item) break
      try {
        const result = await item.execute()
        item.resolve(result)
      } catch (err) {
        item.reject(err)
      }
    }
    this.running = false
  }
}

export const bleQueue = new BluetoothQueue()
