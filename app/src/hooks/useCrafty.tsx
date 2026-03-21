import { createContext } from 'preact'
import { useContext, useState, useEffect, useCallback } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { crafty, type CraftyState } from '../ble'

const CraftyContext = createContext<{
  state: CraftyState
  connect: () => Promise<void>
  disconnect: () => void
  connecting: boolean
  error: string | null
} | null>(null)

export function CraftyProvider({ children }: { children: ComponentChildren }) {
  const [state, setState] = useState<CraftyState>(crafty.state)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return crafty.subscribe(() => setState(crafty.state))
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      await crafty.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    crafty.disconnect()
  }, [])

  return (
    <CraftyContext.Provider value={{ state, connect, disconnect, connecting, error }}>
      {children}
    </CraftyContext.Provider>
  )
}

export function useCrafty() {
  const ctx = useContext(CraftyContext)
  if (!ctx) throw new Error('useCrafty must be used within CraftyProvider')
  return ctx
}
