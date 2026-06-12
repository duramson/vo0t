import { useEffect, useRef } from 'preact/hooks'
import { useCrafty } from './useCrafty'
import { evaluateStatusRegisters } from '../ble/alerts'
import { toast } from '../components/Toast'

/**
 * Surfaces device error flags (battery, overheat, charger, system) as toasts
 * after connecting. Each alert fires once per connection; the set resets on
 * disconnect so a reconnect re-checks the registers.
 *
 * The status registers arrive with the initial-state read shortly after
 * `connected` flips true, so evaluation runs on every state change and
 * dedupes via the shown-set instead of relying on timing.
 */
export function useDeviceAlerts(): void {
  const { state } = useCrafty()
  const shown = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!state.connected) {
      shown.current.clear()
      return
    }
    for (const alert of evaluateStatusRegisters(
      state.akkuStatus1,
      state.akkuStatus2,
      state.systemStatus,
    )) {
      if (shown.current.has(alert.message)) continue
      shown.current.add(alert.message)
      if (alert.severity === 'error') toast.error(alert.message)
      else toast.warning(alert.message)
    }
  }, [state.connected, state.akkuStatus1, state.akkuStatus2, state.systemStatus])
}
