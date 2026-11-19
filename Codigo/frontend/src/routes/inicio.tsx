import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, GraduationCap, RefreshCw, Target } from "lucide-react"
import { useResumo, type ResumoMensal } from '../lib/resumo'
import { deslocarMes, percentual, reais, textoVariacaoSemanal, tituloDoMes } from '../lib/resumo-mes'
import { mesAtual } from '../lib/simulacao'
import '@/styles.css'

export const Route = createFileRoute('/inicio')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const nome = user?.nomeCompleto.split(' ')[0] || 'Você'
  const atual = mesAtual()
  const [mes, setMes] = useState(atual)
  const resumo = useResumo(mes)

  return (
    <div className="dashboard-entry flex flex-col gap-6 p-6 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Oi, {nome} 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Sua visão geral do mês</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
          {nome.charAt(0)}
        </div>
      </header>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-1.5">
        <button type="button" aria-label="Mês anterior" onClick={() => setMes(deslocarMes(mes, -1))}
          className="rounded-xl p-2 text-foreground hover:bg-muted"><ChevronLeft size={20} /></button>
        <span className="text-sm font-bold text-foreground" aria-live="polite">{tituloDoMes(mes)}</span>
        <button type="button" aria-label="Próximo mês" onClick={() => setMes(deslocarMes(mes, 1))}
          disabled={mes >= atual}
          className="rounded-xl p-2 text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={20} /></button>
      </div>

      {resumo.isPending ? (
        <div role="status" className="rounded-3xl bg-card border border-border p-6 text-sm text-muted-foreground">
          Carregando seu resumo…
        </div>
      ) : resumo.isError ? (
        <div role="alert" className="rounded-3xl bg-card border border-border p-6">
          <p className="text-sm font-semibold text-foreground">{resumo.error.message}</p>
          <button type="button" onClick={() => { void resumo.refetch() }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground">
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : (
        <Resumo dados={resumo.data} mesAtual={mes === atual} />
      )}

      <div>
        <Link
          to="/missoes"
          className="flex w-full items-center gap-3 rounded-3xl bg-card border border-border p-5 shadow-sm"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning"><Target size={22} /></span>
          <span className="flex-1">
            <strong className="block text-foreground">Missões</strong>
            <small className="text-muted-foreground">Pequenos desafios, grandes hábitos.</small>
          </span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-sm"
      >
        <div className="absolute -right-4 -top-4 opacity-20">
          <GraduationCap size={100} />
        </div>
        <div className="relative z-10">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
            Efeito Formatura 🎓
          </span>
          <h3 className="text-lg font-bold mb-1 leading-tight">
            E se você guardasse R$ 20 por mês?
          </h3>
          <p className="text-indigo-100 text-sm font-medium mb-4">
            R$ 20/mês ➔ <span className="text-white font-bold">R$ 720</span> até a formatura
          </p>
          <div className="mb-4 rounded-xl bg-black/20 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium">
              Isso pode pagar cerca de 72 almoços no RU.
            </p>
          </div>
          <Link
            to="/efeito-formatura"
            className="w-full inline-block text-center rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition-transform active:scale-95"
          >
            Simular meu futuro
          </Link>
        </div>
      </div>
    </div>
  )
}

function Resumo({ dados, mesAtual }: { dados: ResumoMensal; mesAtual: boolean }) {
  const negativo = dados.saldo < 0
  const progressoGasto = percentual(dados.despesas, dados.entradas)
  const variacao = mesAtual ? textoVariacaoSemanal(dados.variacaoSemanal) : ''
  const principais = dados.categorias.slice(0, 3)
  const maiorCategoria = principais[0]?.valor ?? 0

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30"
      >
        <p className="text-sm font-medium text-primary-foreground/80 mb-1">
          {negativo ? 'Saldo do mês' : 'Dinheiro disponível'}
        </p>
        <h2 className="text-4xl font-extrabold tracking-tighter mb-1">{reais(dados.saldo)}</h2>
        {mesAtual && dados.diasRestantes > 0 && (
          <p className="text-sm font-medium text-primary-foreground/90 mb-4">
            para os próximos {dados.diasRestantes} {dados.diasRestantes === 1 ? 'dia' : 'dias'}
          </p>
        )}
        {mesAtual && dados.gastoDiarioPermitido > 0 && (
          <div className="mb-4 inline-flex rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            💰 {reais(dados.gastoDiarioPermitido)} por dia
          </div>
        )}
        {negativo && (
          <p className="text-sm font-semibold mb-4">Você gastou mais do que entrou neste mês.</p>
        )}

        {dados.entradas > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-primary-foreground/80">
              <span>{reais(dados.despesas)} gastos</span>
              <span>de {reais(dados.entradas)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/20"
              role="progressbar" aria-label="Despesas sobre as entradas do mês"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressoGasto)}>
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressoGasto}%` }} />
            </div>
            {variacao && <p className="text-xs font-medium mt-2">{variacao}</p>}
          </div>
        ) : (
          <p className="text-xs font-medium text-primary-foreground/90">
            Ainda não há entradas para este mês. {reais(dados.despesas)} em gastos.
          </p>
        )}
        {dados.entradasEstimadas && (
          <p className="mt-3 text-[11px] text-primary-foreground/70">
            Entradas estimadas pela renda informada no seu cadastro.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3">Como está seu mês?</h3>
        <div className="flex gap-3">
          <Indicador cor="bg-success" titulo="Entradas" valor={reais(dados.entradas)} />
          <Indicador cor="bg-warning" titulo="Despesas" valor={reais(dados.despesas)} />
          {dados.orcamento ? (
            <Indicador cor={dados.orcamento.restante < 0 ? 'bg-red-500' : 'bg-blue-500'} titulo="Orçamento restante"
              valor={reais(dados.orcamento.restante)} />
          ) : (
            <Link to="/orcamento" className="flex flex-1 flex-col rounded-2xl bg-card border border-dashed border-border p-3 shadow-sm">
              <div className="mb-2 h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Orçamento</span>
              <span className="text-sm font-bold mt-1 text-foreground leading-tight">Defina seus limites</span>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-card border border-border p-5 shadow-sm">
        <h3 className="font-bold text-foreground mb-3">Onde você mais gastou</h3>
        {principais.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">Nenhum gasto registrado neste mês.</p>
            <Link to="/cadastro-gasto"
              className="flex w-full items-center justify-center rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground">
              Registrar um gasto
            </Link>
          </>
        ) : (
          <ul className="space-y-3">
            {principais.map(c => (
              <li key={c.nome}>
                <div className="flex justify-between text-sm font-semibold text-foreground">
                  <span>{c.nome}</span><span>{reais(c.valor)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percentual(c.valor, maiorCategoria)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function Indicador({ cor, titulo, valor }: { cor: string; titulo: string; valor: string }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border p-3 shadow-sm">
      <div className={`mb-2 h-3 w-3 rounded-full ${cor}`} />
      <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
      <span className="text-sm font-bold mt-1 text-foreground leading-tight">{valor}</span>
    </div>
  )
}
