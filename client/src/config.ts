export const API_BASE = import.meta.env.VITE_BACKEND_ORIGIN?.replace(/\/$/, '') ?? ''

export function apiUrl(path: string) {
  if (!path.startsWith('/')) throw new Error('API paths must start with "/"')
  return `${API_BASE}${path}`
}
