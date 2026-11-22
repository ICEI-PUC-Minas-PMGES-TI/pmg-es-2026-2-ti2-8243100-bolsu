import { useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { HeadContent, Scripts, createRootRouteWithContext, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Flag, Home, Target, TrendingUp, User, Wallet, PlusCircle, ChartPie, Users, LogOut } from 'lucide-react'

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
    <div className="app-shell">
      <a href="#page-content" className="skip-link">Pular para o conteúdo</a>
      <nav aria-label="Navegação principal" className="app-navigation">
        <Link to="/inicio" className="app-brand" aria-label="Bolsu — início"><span>B</span>Bolsu<span className="brand-dot">.</span></Link>
        <p className="navigation-caption">SEU DIA A DIA</p>
        <NavItem to="/inicio" icon={<Home size={22} />} label="Início" />
        <NavItem to="/gastos" icon={<Wallet size={22} />} label="Gastos" desktopOnly />
        <NavItem to="/cadastro-gasto" icon={<PlusCircle size={22} />} label="Registrar gasto" desktopOnly />
        <NavItem to="/orcamento" icon={<ChartPie size={22} />} label="Orçamento" desktopOnly />
        <NavItem to="/gastos_compartilhados" icon={<Users size={22} />} label="Compartilhados" desktopOnly />
        <p className="navigation-caption navigation-section">SEUS OBJETIVOS</p>
        <NavItem to="/missoes" icon={<Target size={22} />} label="Missões" />
        <NavItem to="/metas" icon={<Flag size={22} />} label="Metas" />
        <NavItem to="/efeito-formatura" icon={<TrendingUp size={22} />} label="Futuro" />
        <div className="navigation-spacer" />
        <NavItem to="/perfil" icon={<User size={22} />} label="Perfil" />
        <button onClick={auth.logout} className="app-nav-item desktop-only"><LogOut size={22} /><span>Sair</span></button>
      </nav>
      <div id="page-content" tabIndex={-1} className="app-content">
        <Outlet key={auth.user.email} />
      </div>
    </div>
  )
}

function NavItem({ to, icon, label, desktopOnly = false }: { to: string; icon: React.ReactNode; label: string; desktopOnly?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ 'aria-current': 'page' }}
      className={`app-nav-item${desktopOnly ? ' desktop-only' : ''}`}
    >
      {icon}
      <span>{label}</span>
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
