/** Connect screen – shown when device is not connected */
import { useCrafty } from '../hooks/useCrafty'

const IS_SIM = import.meta.env.VITE_DEV_SIMULATION === 'true'

export function ConnectPage() {
  const { connect, connecting, error } = useCrafty()

  return (
    <div class="flex flex-1 items-center justify-center p-6">
      <div class="fade-in w-full max-w-sm text-center">
        {IS_SIM && (
          <div class="bg-accent/10 border-accent/30 text-accent mb-6 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold tracking-widest uppercase">
            <span class="material-symbols-outlined text-[14px]">science</span>
            Simulator Mode — no device needed
          </div>
        )}
        {/* Connection Status Section */}
        <section class="mb-12">
          <div class="relative mb-8 inline-block">
            {/* Background Glow */}
            <div class="bg-accent/10 absolute inset-0 scale-150 animate-[pulse-ring_3s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full blur-3xl" />

            {/* Main Scanner UI */}
            <div class="border-border/20 relative flex h-48 w-48 items-center justify-center rounded-full border">
              <div class="border-accent/20 absolute inset-0 animate-[pulse-ring_3s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full border-2" />
              <div class="bg-surface-container border-border/10 flex h-32 w-32 items-center justify-center rounded-full border shadow-2xl">
                <span
                  class="material-symbols-outlined text-accent text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bluetooth_searching
                </span>
              </div>
            </div>
          </div>

          <h1 class="font-headline mb-2 text-3xl font-extrabold tracking-tight">Connect Device</h1>
          {connecting ? (
            <div class="flex items-center justify-center gap-2">
              <div class="bg-accent h-2 w-2 animate-pulse rounded-full" />
              <p class="text-text-secondary text-sm tracking-widest uppercase">Connecting...</p>
            </div>
          ) : (
            <div class="flex items-center justify-center gap-2 opacity-50">
              <span class="material-symbols-outlined text-[16px]">info</span>
              <p class="text-text-secondary text-xs tracking-wide">Press button below to pair</p>
            </div>
          )}
        </section>

        {/* Connect button */}
        <button
          onClick={connect}
          disabled={connecting}
          class="bg-accent hover:bg-accent-hover text-text-primary shadow-accent/20 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold tracking-wider uppercase shadow-[0_4px_14px_var(--tw-shadow-color)] transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            class="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bluetooth
          </span>
          {connecting ? 'Connecting...' : 'Pair new device'}
        </button>

        {error && (
          <div class="bg-danger/10 border-danger/20 mt-4 rounded-xl border p-3">
            <p class="text-danger text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Info */}
        <div class="text-text-muted/60 mx-auto mt-12 max-w-62.5 space-y-3 text-xs leading-relaxed">
          <p>Make sure your Crafty is powered on and within range.</p>
          <p>Requires a browser with Web Bluetooth support (Chrome, Edge, Opera).</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
