/**
 * Device status-register evaluation, shared by the connect-time alert flow
 * and the diagnostics view. Mirrors the official app's error checks.
 */
import { AKKU_1, AKKU_2, SYSTEM, PROJECT_REG } from './uuids'

export type AlertSeverity = 'warning' | 'error'

export interface DeviceAlert {
  severity: AlertSeverity
  message: string
}

export function evaluateStatusRegisters(
  akkuStatus1: number,
  akkuStatus2: number,
  systemStatus: number,
): DeviceAlert[] {
  const alerts: DeviceAlert[] = []
  if (akkuStatus1 & AKKU_1.BATTERY_LOW)
    alerts.push({ severity: 'warning', message: 'Battery low – please charge' })
  if (akkuStatus1 & AKKU_1.BATTERY_ERROR)
    alerts.push({ severity: 'error', message: 'Battery error – contact Storz & Bickel' })
  if (akkuStatus1 & AKKU_1.TEMP_WARNING)
    alerts.push({ severity: 'warning', message: 'Battery temperature warning' })
  if (akkuStatus1 & AKKU_1.COOL_DOWN)
    alerts.push({ severity: 'error', message: 'Overheating – let the device cool down' })
  if (akkuStatus2 & AKKU_2.CHARGER_ISSUE)
    alerts.push({ severity: 'error', message: 'Charger issue – try a different cable' })
  if (systemStatus & SYSTEM.ERROR)
    alerts.push({ severity: 'error', message: 'System error – contact Storz & Bickel' })
  return alerts
}

/** Device firmware flags that it wants a factory reset (persistent fault). */
export function needsFactoryReset(projectReg: number): boolean {
  return !!(projectReg & PROJECT_REG.FACTORY_RESET)
}
