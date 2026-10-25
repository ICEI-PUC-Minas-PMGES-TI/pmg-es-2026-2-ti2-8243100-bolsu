import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BriefcaseBusiness, GraduationCap, House, Receipt, Trophy, UserRound, RefreshCw } from 'lucide-react'
import '../bolsu.css'

export function BolsuLayout({ children, formatura = false }: { children: ReactNode; formatura?: boolean }) {
  return <div className="bolsu">
    <nav className="bolsu-nav" aria-label="Navegação principal">
      <Link to="/" className="sidebar-brand" aria-label="BolsU, início"><span>B</span>Bols<span className="brand-u">U</span></Link>
      <p className="sidebar-caption">SEU DIA A DIA</p>
      <Link to="/" className="nav-item"><House size={21} /><span>Início</span></Link>
      <button className="nav-item unavailable" disabled title="Gastos em breve"><Receipt size={21} /><span>Gastos</span></button>
      <Link to="/missoes" className={`nav-item ${!formatura ? 'selected' : ''}`} aria-current={!formatura ? 'page' : undefined}><span className="nav-icon"><Trophy size={22} /></span><span>Missões</span></Link>
      <button className="nav-item unavailable" disabled title="Renda em breve"><BriefcaseBusiness size={21} /><span>Renda</span></button>
      <button className="nav-item unavailable" disabled title="Perfil em breve"><UserRound size={21} /><span>Perfil</span></button>
      <p className="sidebar-caption future-caption">SEU FUTURO</p>
      <Link to="/efeito-formatura" className={`nav-item desktop-graduation ${formatura ? 'selected' : ''}`} aria-current={formatura ? 'page' : undefined}><GraduationCap size={22} /><span>Efeito Formatura</span></Link>
    </nav>
    <div className="bolsu-workspace"><main className={formatura ? 'bolsu-content formatura' : 'bolsu-content'}>{children}</main></div>
  </div>
}

export function EstadoConsulta({ pending, error, retry }: { pending: boolean; error: Error | null; retry: () => void }) {
  return <section className="query-state" aria-live="polite">
    {pending ? <><span className="loading-dot" /><p>Carregando os desafios…</p></>
      : <><Trophy size={36} /><h2>Não conseguimos carregar as missões</h2><p>{error?.message || 'Tente novamente em instantes.'}</p><button className="secondary-button" onClick={retry}><RefreshCw size={17} /> Tentar novamente</button></>}
  </section>
}
