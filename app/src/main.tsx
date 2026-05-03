import { render } from 'preact'
import './index.css'
import { App } from './app'
import { migrateFromLocalStorage } from './store/db'

// Wait for the one-time localStorage → IndexedDB migration before mounting,
// otherwise useHistory's first render may flash an empty list before the
// migrated sessions appear. The function returns near-instantly when there
// is nothing to migrate, so the cost on subsequent boots is negligible.
const appElement = document.getElementById('app')
if (appElement) {
  void migrateFromLocalStorage().finally(() => {
    render(<App />, appElement)
  })
}
