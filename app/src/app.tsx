import { useState } from 'preact/hooks'
import { CraftyProvider, useCrafty } from './hooks/useCrafty'
import { ConnectPage } from './pages/ConnectPage'
import { MainPage } from './pages/MainPage'
import { SettingsPage } from './pages/SettingsPage'
import { HistoryPage } from './pages/HistoryPage'
import { TopBar } from './components/TopBar'
import { BottomNav, type TabId } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import { useSessionTracker } from './hooks/useSessionTracker'
import { useDeviceAlerts } from './hooks/useDeviceAlerts'
import { needsFactoryReset } from './ble/alerts'

// Dynamic import — only loaded when VITE_DEV_SIMULATION is true.
// Vite replaces the env check at build time → dead code elimination removes this entirely in production.
const SimulatorPanel =
  import.meta.env.VITE_DEV_SIMULATION === 'true'
    ? (await import('./components/SimulatorPanel')).SimulatorPanel
    : null

function FactoryResetBanner() {
  return (
    <div class="bg-danger/15 border-danger/30 text-danger flex items-start gap-2 border-b px-4 py-2.5 text-xs font-semibold">
      <span class="material-symbols-outlined text-[16px]">error</span>
      <span>
        The device reports an internal fault and requests a factory reset. Run Settings → Factory
        Reset, or contact Storz & Bickel if the warning persists.
      </span>
    </div>
  )
}

function AppContent() {
  const { state } = useCrafty()
  const [tab, setTab] = useState<TabId>('dashboard')

  // Global tracker for sessions + connect-time device error alerts
  useSessionTracker()
  useDeviceAlerts()

  if (!state.connected) return <ConnectPage />

  return (
    <div class="flex h-full flex-col overflow-hidden">
      <TopBar />
      {needsFactoryReset(state.projectRegRaw) && <FactoryResetBanner />}
      <div class="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {tab === 'dashboard' && <MainPage />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <CraftyProvider>
        <div class="bg-bg flex h-dvh flex-col items-center overflow-hidden">
          <div class="app-shell relative flex flex-col overflow-hidden">
            <AppContent />
          </div>
        </div>
        <ToastContainer />
        {SimulatorPanel && <SimulatorPanel />}
      </CraftyProvider>
    </ErrorBoundary>
  )
}
