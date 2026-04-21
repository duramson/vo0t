/**
 * Lightweight toast notification system.
 * Usage: import { toast } from './Toast'; toast.error('msg');
 */
import { useState, useEffect, useCallback } from 'preact/hooks'

type ToastType = 'error' | 'success' | 'info'
type ToastItem = { id: number; message: string; type: ToastType }

let nextId = 0
const MAX_TOASTS = 5
const listeners = new Set<(items: ToastItem[]) => void>()
let items: ToastItem[] = []
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function notify() {
  listeners.forEach((fn) => fn([...items]))
}

function add(message: string, type: ToastType, duration = 4000) {
  if (items.length >= MAX_TOASTS) {
    const oldest = items[0]
    if (oldest) {
      const timeoutId = timers.get(oldest.id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timers.delete(oldest.id)
      }
    }
  }

  const id = nextId++
  items = [...items, { id, message, type }].slice(-MAX_TOASTS)
  notify()
  const timeoutId = setTimeout(() => {
    timers.delete(id)
    items = items.filter((t) => t.id !== id)
    notify()
  }, duration)
  timers.set(id, timeoutId)
}

export const toast = {
  error: (msg: string) => add(msg, 'error'),
  success: (msg: string) => add(msg, 'success'),
  info: (msg: string) => add(msg, 'info'),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.add(setToasts)
    return () => {
      listeners.delete(setToasts)
    }
  }, [])

  const dismiss = useCallback((id: number) => {
    const timeoutId = timers.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timers.delete(id)
    }
    items = items.filter((t) => t.id !== id)
    notify()
  }, [])

  if (toasts.length === 0) return null

  return (
    <div class="pointer-events-none fixed top-4 left-1/2 z-50 flex w-[90vw] max-w-100 -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          class={`fade-in pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === 'error'
              ? 'bg-danger text-white'
              : t.type === 'success'
                ? 'bg-success text-white'
                : 'bg-info text-white'
          }`}
          onClick={() => dismiss(t.id)}
        >
          <span class="flex-1">{t.message}</span>
          <span class="cursor-pointer text-xs text-white/60">✕</span>
        </div>
      ))}
    </div>
  )
}
