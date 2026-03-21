import { Component } from 'preact'
import type { ComponentChildren } from 'preact'

type Props = { children: ComponentChildren }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div class="flex flex-1 items-center justify-center p-6">
          <div class="max-w-sm text-center">
            <div class="bg-danger/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <span class="text-3xl">⚠️</span>
            </div>
            <h2 class="mb-2 text-lg font-bold">Something went wrong</h2>
            <p class="text-text-secondary mb-6 text-sm">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              class="bg-accent hover:bg-accent-hover rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
