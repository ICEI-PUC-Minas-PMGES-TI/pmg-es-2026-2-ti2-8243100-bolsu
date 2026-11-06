import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { apiJson, setSession } from '../lib/api'

export function AuthForm({ register = false, next = '/inicio' }: { register?: boolean; next?: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email')).trim()
    const senha = String(fields.get('senha'))
    setPending(true)
    setError('')
    try {
      if (register) await apiJson('/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeCompleto: fields.get('nome'), email, senha, celular: fields.get('celular') }),
      }, false)
      const result = await apiJson<{ token: string }>('/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }),
      }, false)
      if (!result.token) throw new Error('A API não retornou uma sessão válida.')
      setSession(result.token)
      const target = next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') && !['/login', '/cadastro'].includes(next) ? next : '/inicio'
      await navigate({ to: target, replace: true })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.') }
    finally { setPending(false) }
  }
  const inputClass = 'mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary'
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
    <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
      <Link to="/login" search={{ next: '/inicio' }} className="text-3xl font-extrabold text-primary">BolsU</Link>
      <h1 className="mt-6 text-2xl font-bold">{register ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
      <p className="mt-2 text-muted-foreground">Sua vida financeira em um só lugar.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {register && <label className="block">Nome completo<input className={inputClass} name="nome" autoComplete="name" required maxLength={120} /></label>}
        <label className="block">E-mail<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
        {register && <label className="block">Celular (opcional)<input className={inputClass} type="tel" name="celular" autoComplete="tel" /></label>}
        <label className="block">Senha<input className={inputClass} type="password" name="senha" autoComplete={register ? 'new-password' : 'current-password'} required /></label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">{pending ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <p className="mt-6 text-center text-sm">{register ? <Link to="/login" search={{ next: '/inicio' }}>Já tenho uma conta</Link> : <Link to="/cadastro">Criar uma conta</Link>}</p>
    </section>
  </main>
}
