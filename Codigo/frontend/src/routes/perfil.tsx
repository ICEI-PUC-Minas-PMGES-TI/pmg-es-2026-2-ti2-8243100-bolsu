import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
export const Route = createFileRoute('/perfil')({ component: Perfil })
function Perfil() {
  const { user, logout } = useAuth()
  return <main className="mx-auto max-w-2xl space-y-6 p-6"><h1 className="text-2xl font-bold">Meu perfil</h1><dl className="space-y-3 rounded-2xl border border-border bg-card p-6"><dt className="text-muted-foreground">Nome</dt><dd>{user?.nomeCompleto}</dd><dt className="text-muted-foreground">E-mail</dt><dd>{user?.email}</dd><dt className="text-muted-foreground">Celular</dt><dd>{user?.celular || 'Não informado'}</dd></dl><button onClick={logout} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Sair da conta</button></main>
}
