const globalConfig = window.APP_CONFIG || {}
const base = typeof globalConfig.apiBase === 'string' ? globalConfig.apiBase.trim() : ''
export const API_BASE = base.endsWith('/') ? base.slice(0, -1) : base

export function apiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error('API paths must start with "/"')
  }
  return `${API_BASE}${path}`
}
