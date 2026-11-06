import { useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { HeadContent, Scripts, createRootRouteWithContext, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Home, Target, TrendingUp, User } from 'lucide-react'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Bolsu',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const publicPage = location.pathname === '/login' || location.pathname === '/cadastro'
  useEffect(() => {
    if (!publicPage && !auth.loading && !auth.user && !auth.error) {
      void navigate({ to: '/login', search: { next: location.pathname }, replace: true })
    }
  }, [publicPage, auth.loading, auth.user, auth.error, location.pathname, navigate])
  if (publicPage) return <Outlet />
  if (auth.loading) return <p className="p-8" role="status">Verificando sua sessão…</p>
  if (auth.error) return <div className="p-8 space-y-4"><p role="alert">{auth.error}</p><button onClick={auth.retry}>Tentar novamente</button><button className="ml-4" onClick={auth.logout}>Voltar ao login</button></div>
  if (!auth.user) return null
  return (
    <div className="min-h-screen bg-background pb-28 font-sans text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
        <Link to="/inicio" className="font-bold text-primary">BolsU</Link>
        <div className="flex flex-wrap gap-4 text-sm"><Link to="/gastos">Gastos</Link><Link to="/cadastro-gasto">Registrar gasto</Link><Link to="/orcamento">Orçamento</Link><Link to="/gastos_compartilhados">Compartilhados</Link></div>
        <button onClick={auth.logout} className="text-sm font-semibold">Sair</button>
      </header>
      <Outlet key={auth.user.email} />
      <nav aria-label="Navegação principal" className="fixed bottom-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-around rounded-t-3xl bg-card px-6 pb-4 pt-2 shadow-lg border-t border-border">
        <NavItem to="/inicio" icon={<Home size={24} />} label="Início" />
        <NavItem to="/missoes" icon={<Target size={24} />} label="Missões" />
        <NavItem to="/efeito-formatura" icon={<TrendingUp size={24} />} label="Futuro" />
        <NavItem to="/perfil" icon={<User size={24} />} label="Perfil" />
      </nav>
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary/80 [&.active]:text-primary"
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}