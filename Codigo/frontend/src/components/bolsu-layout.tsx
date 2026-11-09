import type { ReactNode } from 'react'
import { Trophy, RefreshCw } from 'lucide-react'
import '../bolsu.css'

export function BolsuLayout({ children, formatura = false }: { children: ReactNode; formatura?: boolean }) {
  return <div className="bolsu">
    <div className="bolsu-workspace"><main className={formatura ? 'bolsu-content formatura' : 'bolsu-content'}>{children}</main></div>
  </div>
}

export function EstadoConsulta({ pending, error, retry }: { pending: boolean; error: Error | null; retry: () => void }) {
  return <section className="query-state" aria-live="polite">
    {pending ? <><span className="loading-dot" /><p>Carregando os desafios…</p></>
      : <><Trophy size={36} /><h2>Não conseguimos carregar as missões</h2><p>{error?.message || 'Tente novamente em instantes.'}</p><button className="secondary-button" onClick={retry}><RefreshCw size={17} /> Tentar novamente</button></>}
  </section>
}
