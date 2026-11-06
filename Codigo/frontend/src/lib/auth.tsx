import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiJson, SESSION_EVENT, sessionToken, setSession } from './api'

export type UsuarioAtual = { nomeCompleto: string; email: string; celular?: string }
type Auth = { user: UsuarioAtual | null; loading: boolean; error: string; retry: () => void; logout: () => void }
const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient()
  const [revision, refresh] = useState(0)
  const [user, setUser] = useState<UsuarioAtual | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const changed = () => {
      void cache.cancelQueries()
      cache.clear()
      setUser(null)
      setLoading(true)
      refresh(value => value + 1)
    }
    window.addEventListener(SESSION_EVENT, changed)
    return () => window.removeEventListener(SESSION_EVENT, changed)
  }, [cache])
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    const token = sessionToken()
    if (!token) { setUser(null); setLoading(false); return }
    setLoading(true)
    apiJson<UsuarioAtual>('/users/current', { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted && token === sessionToken()) setUser(value) })
      .catch(reason => { if (!controller.signal.aborted && token === sessionToken()) setError(reason.message || 'Falha ao validar sua sessão.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    if (!user) return
    const check = () => {
      const token = sessionToken()
      try {
        const payload = JSON.parse(atob((token?.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')))
        if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) setSession(null)
      } catch { setSession(null) }
    }
    check()
    const timer = window.setInterval(check, 1000)
    return () => window.clearInterval(timer)
  }, [user])
  return <AuthContext.Provider value={{ user, loading, error, retry: () => refresh(v => v + 1), logout: () => setSession(null) }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider ausente')
  return value
}
