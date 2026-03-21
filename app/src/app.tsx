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

function AppContent() {
  const { state } = useCrafty()
  const [tab, setTab] = useState<TabId>('dashboard')

  // Global tracker for sessions
  useSessionTracker()

  if (!state.connected) return <ConnectPage />

  return (
    <div class="flex h-full flex-col overflow-hidden">
      <TopBar />
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
      </CraftyProvider>
    </ErrorBoundary>
  )
}
