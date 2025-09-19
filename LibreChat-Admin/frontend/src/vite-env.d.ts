/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ADMIN_API_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_SUPABASE_AUTH: string
  readonly VITE_ENABLE_ORGANIZATION_MANAGEMENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}