import { render } from 'preact'
import './index.css'
import { App } from './app'
import { migrateFromLocalStorage } from './store/db'

void migrateFromLocalStorage()

const appElement = document.getElementById('app')
if (appElement) {
  render(<App />, appElement)
}
