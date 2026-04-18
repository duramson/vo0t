/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_SIMULATION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
