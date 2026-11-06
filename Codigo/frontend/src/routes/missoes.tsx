import { createFileRoute, Link } from '@tanstack/react-router'
import { BusFront, Coins, Flame, GraduationCap, PiggyBank, Star, Trophy, ArrowUpRight } from 'lucide-react'
import { BolsuLayout, EstadoConsulta } from '../components/bolsu-layout'
import { useMissoes } from '../lib/missoes'
import type { Missao } from '../lib/missoes'
import { dinheiro } from '../lib/simulacao'

export const Route = createFileRoute('/missoes')({ component: MissoesPage, head: () => ({ meta: [{ title: 'Missões | BolsU' }] }) })

function MissoesPage() {
  const query = useMissoes()
  return <BolsuLayout>
    <header className="missions-header">
      <div><span className="page-eyebrow">CADA PASSO CONTA</span><h1>Missões</h1><p>Pequenos desafios. Grandes hábitos.</p></div>
      <div className="stats-grid" aria-label="Nível e moedas disponíveis futuramente com sua conta">
        <div className="stat"><Star className="gold" size={20} fill="currentColor" /><div><span>SEU NÍVEL</span><strong aria-label="Ainda indisponível">—</strong></div></div>
        <div className="stat"><Trophy className="gold" size={20} fill="currentColor" /><div><span>MOEDAS</span><strong aria-label="Ainda indisponíveis">—</strong></div></div>
      </div>
    </header>
    <div className="missions-body">
      <div className="section-caption"><span>EXPLORE OS DESAFIOS</span>{query.data && <span>{query.data.length} disponíveis</span>}</div>
      {query.isPending || query.isError ? <EstadoConsulta pending={query.isPending} error={query.error} retry={() => { void query.refetch() }} />
        : query.data.length === 0 ? <section className="query-state"><Trophy size={36} /><h2>Novos desafios estão chegando</h2><p>Ainda não há missões disponíveis. Volte em breve.</p></section>
        : <div className="mission-grid">{query.data.map(missao => <CartaoMissao key={missao.id} missao={missao} />)}</div>}
      <div className="missions-extras">
        <aside className="next-missions"><span className="round-icon green"><Trophy size={27} /></span><div><h2>Um hábito de cada vez</h2><p>Complete as missões do dia e volte amanhã<br className="mobile-break" /> para cuidar melhor do seu dinheiro.</p></div></aside>
        <Link to="/efeito-formatura" className="graduation-link"><GraduationCap size={29} /><span><strong>Seu futuro começa agora</strong><small>Simule quanto guardar até a formatura.</small></span><ArrowUpRight size={21} /></Link>
      </div>
      <p className="fine-print page-note">Aqui você conhece os desafios. O acompanhamento de nível, moedas e progresso estará disponível com sua conta.</p>
    </div>
  </BolsuLayout>
}

function CartaoMissao({ missao: m }: { missao: Missao }) {
  const { Icon, cor } = m.tipo === 'LANCHES' ? { Icon: Flame, cor: 'orange' } : m.tipo === 'GUARDAR' ? { Icon: PiggyBank, cor: 'green' } : { Icon: BusFront, cor: 'blue' }
  return <article className={`mission-card ${cor}`}>
    <span className={`round-icon ${cor}`}><Icon size={25} /></span>
    <div className="mission-content">
      <div className="mission-heading"><h2>{m.titulo}</h2><span className="reward" aria-label={`Recompensa prevista: ${m.recompensaMoedas} moedas`}>+{m.recompensaMoedas} <Coins size={12} /></span></div>
      <p>{m.descricao}</p>
      <div className="mission-goal"><span>{m.tipo === 'LANCHES' ? 'Limite da semana' : 'Objetivo'}</span><strong>{m.unidade === 'DIAS' ? `${m.objetivo} dias` : dinheiro(m.objetivo)}</strong></div>
      <div className="goal-track" aria-hidden="true" />
      <span className="mission-period">{m.periodicidade === 'SEMANAL' ? 'Desafio semanal' : 'Primeira conquista'}</span>
    </div>
  </article>
}
