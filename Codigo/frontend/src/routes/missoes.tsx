import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, BusFront, Check, Coins, Flame, GraduationCap, PiggyBank, Star, Trophy } from 'lucide-react'
import { BolsuLayout, EstadoConsulta } from '../components/bolsu-layout'
import { useConcluirMissao, useMissoes, type Desafio } from '../lib/missoes'
import { dinheiro } from '../lib/simulacao'

export const Route = createFileRoute('/missoes')({ component: MissoesPage, head: () => ({ meta: [{ title: 'Missões | BolsU' }] }) })

function MissoesPage() {
  const query = useMissoes()
  const painel = query.data
  const disponiveis = painel?.desafios.filter(item => !item.concluida).length
  return <BolsuLayout>
    <header className="missions-header">
      <div><span className="page-eyebrow">CADA PASSO CONTA</span><h1>Missões</h1><p>Pequenos desafios. Grandes hábitos.</p></div>
      <div className="stats-grid" aria-label="Suas conquistas" aria-live="polite">
        <div className="stat"><Trophy className="gold" size={20} /><div><span>SEU NÍVEL</span><strong>{painel?.nivel ?? '—'}</strong></div></div>
        <div className="stat"><Star className="gold" size={20} fill="currentColor" /><div><span>ESTRELAS</span><strong>{painel?.estrelas ?? '—'}</strong></div></div>
        <div className="stat"><Coins className="gold" size={20} /><div><span>MOEDAS</span><strong>{painel?.moedas ?? '—'}</strong></div></div>
      </div>
    </header>
    <div className="missions-body">
      <div className="section-caption"><span>EXPLORE OS DESAFIOS</span>{painel && <span>{disponiveis} {disponiveis === 1 ? 'disponível' : 'disponíveis'}</span>}</div>
      {query.isPending || query.isError ? <EstadoConsulta pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
        : query.data.desafios.length === 0 ? <section className="query-state"><Trophy size={36} /><h2>Novos desafios estão chegando</h2><p>Ainda não há missões disponíveis. Volte em breve.</p></section>
        : <>
          {disponiveis === 0 && <p className="mission-all-done" role="status">Você concluiu todos os desafios disponíveis neste período.</p>}
          <div className="mission-grid">{query.data.desafios.map(desafio =>
            <CartaoMissao key={`${desafio.missao.id}-${desafio.periodo}`} desafio={desafio} atualizar={() => void query.refetch()} />
          )}</div>
        </>}
      <div className="missions-extras">
        <aside className="next-missions"><span className="round-icon green"><Trophy size={27} /></span><div><h2>Um hábito de cada vez</h2><p>{painel ? `Faltam ${painel.estrelasParaProximoNivel} ${painel.estrelasParaProximoNivel === 1 ? 'estrela' : 'estrelas'} para o próximo nível.` : 'Complete missões para subir de nível.'}</p></div></aside>
        <Link to="/efeito-formatura" className="graduation-link"><GraduationCap size={29} /><span><strong>Seu futuro começa agora</strong><small>Simule quanto guardar até a formatura.</small></span><ArrowUpRight size={21} /></Link>
      </div>
      <p className="fine-print page-note">Marque a missão como concluída depois de realizar o desafio. Cada conclusão vale uma estrela.</p>
    </div>
  </BolsuLayout>
}

function CartaoMissao({ desafio, atualizar }: { desafio: Desafio; atualizar: () => void }) {
  const { missao: m, concluida } = desafio
  const concluir = useConcluirMissao()
  const { Icon, cor } = m.tipo === 'LANCHES' ? { Icon: Flame, cor: 'orange' } : m.tipo === 'GUARDAR' ? { Icon: PiggyBank, cor: 'green' } : { Icon: BusFront, cor: 'blue' }
  return <article className={`mission-card ${cor}`}>
    <span className={`round-icon ${cor}`}><Icon size={25} /></span>
    <div className="mission-content">
      <div className="mission-heading"><h2>{m.titulo}</h2><span className="reward" aria-label={`Recompensa: ${m.recompensaMoedas} moedas`}>+{m.recompensaMoedas} <Coins size={12} /></span></div>
      <p>{m.descricao}</p>
      {m.objetivo > 0 && <div className="mission-goal"><span>{m.tipo === 'LANCHES' ? 'Limite' : 'Objetivo'}</span><strong>{m.unidade === 'DIAS' ? `${m.objetivo} dias` : dinheiro(m.objetivo)}</strong></div>}
      <span className="mission-period">{m.periodicidade === 'DIARIA' ? 'Desafio diário' : m.periodicidade === 'SEMANAL' ? 'Desafio semanal' : 'Conquista única'}</span>
      {concluida ? <span className="mission-done"><Check size={17} /> Concluída</span>
        : <button className="secondary-button" disabled={concluir.isPending} onClick={() => concluir.mutate(desafio)}>
          {concluir.isPending ? 'Registrando…' : 'Marcar como concluída'}
        </button>}
      {concluir.error && <div className="error-message" role="alert"><p>{concluir.error.message}</p><button className="secondary-button" onClick={() => { concluir.reset(); atualizar() }}>Atualizar missões</button></div>}
    </div>
  </article>
}
