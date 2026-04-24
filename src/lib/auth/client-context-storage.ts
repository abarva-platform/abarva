export const ACTIVE_CLIENT_COOKIE = 'abarva_active_client'
export const ACTIVE_CLIENT_LOCAL_STORAGE_KEY = 'abarva_selected_client'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function persistActiveClientContext(clientId: string) {
  if (!isBrowser()) return

  try {
    window.localStorage.setItem(ACTIVE_CLIENT_LOCAL_STORAGE_KEY, clientId)
  } catch {}

  try {
    document.cookie = `${ACTIVE_CLIENT_COOKIE}=${encodeURIComponent(clientId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  } catch {}
}

export function clearActiveClientContext() {
  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(ACTIVE_CLIENT_LOCAL_STORAGE_KEY)
  } catch {}

  try {
    document.cookie = `${ACTIVE_CLIENT_COOKIE}=; path=/; max-age=0; samesite=lax`
  } catch {}
}
