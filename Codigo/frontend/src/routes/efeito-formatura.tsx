import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { GraduationCap, PiggyBank, Plane, UtensilsCrossed, X, ArrowRight } from 'lucide-react'
import { BolsuLayout } from '../components/bolsu-layout'
import { centavos, dinheiro, mesesEntre, mesAtual } from '../lib/simulacao'

export const Route = createFileRoute('/efeito-formatura')({
  component: FormaturaPage,
  loader: () => ({ inicio: mesAtual() }),
  head: () => ({ meta: [{ title: 'Efeito Formatura | BolsU' }] }),
})

function FormaturaPage() {
  const { inicio } = Route.useLoaderData()
  const [valor, setValor] = useState('20')
  const [mes, setMes] = useState(`${Number(inicio.slice(0, 4)) + 2}-${inicio.slice(5, 7)}`)
  const mensal = centavos(valor)
  const maxMes = `${Number(inicio.slice(0, 4)) + 15}-${inicio.slice(5, 7)}`
  const meses = mesesEntre(inicio, mes)
  const valido = mensal > 0 && mensal <= 100_000_000 && mes >= inicio && mes <= maxMes && meses > 0
  const total = valido ? mensal * meses : 0
  const [ano, numeroMes] = mes.split('-').map(Number)
  const ultimoDia = valido ? new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate() : 0

  return <BolsuLayout formatura>
    <header className="formatura-header"><div><span className="page-eyebrow">PLANEJE SEU AMANHÃ</span><h1><GraduationCap size={25} /> Efeito Formatura</h1><p className="desktop-description">Veja como pequenas escolhas podem transformar seu futuro.</p></div><Link to="/missoes" aria-label="Voltar às missões"><X size={21} /></Link></header>
    <div className="formatura-grid">
      <section className="simulation-controls" aria-label="Configurar simulação">
        <label className="monthly-label" htmlFor="valor-mensal">Quanto você consegue guardar por mês?</label>
        <div className="monthly-input"><span>R$</span><input id="valor-mensal" aria-describedby="validacao-meta" inputMode="decimal" value={valor} maxLength={12} style={{ width: `${Math.max(2, Math.min(9, valor.length))}ch` }} onChange={e => { setValor(e.target.value); }} /></div>
        <label className="date-label" htmlFor="mes-formatura">Quando você pretende se formar?</label>
        <input className="month-select" id="mes-formatura" type="month" min={inicio} max={maxMes} value={mes} onChange={e => { setMes(e.target.value); }} />
        <p id="validacao-meta" className={valido ? 'simulation-hint' : 'error-message'} aria-live="polite">{valido ? 'Mude os valores e descubra suas possibilidades.' : 'Informe um valor positivo de até R$ 1.000.000 e uma data válida.'}</p>
      </section>

      <section className="projection" aria-label="Projeção de economia">
        <p>Na formatura, você pode ter:</p><strong className="projected-total" aria-live="polite">{dinheiro(total)}</strong>
        <p className="projection-caption">{valido ? `${meses} aportes de ${dinheiro(mensal)}, incluindo este mês e o mês da formatura.` : 'Preencha os campos para simular.'}</p>
        <svg className="projection-chart" viewBox="0 0 320 135" role="img" aria-label="Crescimento linear da economia, sem rendimentos"><defs><linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="white" stopOpacity=".45" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs><path d="M4 124 L316 14 L316 135 L4 135 Z" fill="url(#savings-fill)" /><path d="M4 124 L316 14" fill="none" stroke="white" strokeWidth="3" /></svg>
        <div className="equivalence"><span><UtensilsCrossed size={20} /></span><p>Aproximadamente <strong>{Math.floor(total / 1000)} almoços no RU</strong></p></div>
        <div className="equivalence"><span><Plane size={20} /></span><p>Uma parte da sua viagem</p></div>
        <div className="equivalence"><span><PiggyBank size={20} /></span><p>Início da reserva de emergência</p></div>
      </section>

      <div className="simulation-action">
        {valido ? <Link to="/metas" search={{ total, prazo: `${mes}-${ultimoDia}` }} className="primary-button">
          Quero começar a guardar <ArrowRight size={18} />
        </Link> : <button className="primary-button" disabled>Quero começar a guardar <ArrowRight size={18} /></button>}
      </div>
    </div>
  </BolsuLayout>
}
