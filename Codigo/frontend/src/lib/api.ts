const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const SESSION_KEY = 'bolsu.session'
export const SESSION_EVENT = 'bolsu:session'

export function sessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(SESSION_KEY)
}

export function setSession(token: string | null) {
  if (token) window.sessionStorage.setItem(SESSION_KEY, token)
  else window.sessionStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export async function apiFetch(path: string, init: RequestInit = {}, authenticated = true): Promise<Response> {
  const token = authenticated ? sessionToken() : null
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  // A resposta de uma sessão anterior não pode encerrar a sessão atual.
  if (authenticated && response.status === 401 && token === sessionToken()) setSession(null)
  return response
}

export async function apiJson<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const response = await apiFetch(path, init, authenticated)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || body.detail || `Não foi possível concluir a solicitação (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
