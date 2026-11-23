import { apiFetch } from '../lib/api'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BookOpen,
  Bus,
  Home,
  PartyPopper,
  Pizza,
  Plus,
  Printer,
  Smartphone,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useResumo } from '../lib/resumo'
import { reais as brl } from '../lib/resumo-mes'
import { mesAtual } from '../lib/simulacao'
import { RegistrosRecentes } from '../components/registros-recentes'
import '@/styles.css'

export const Route = createFileRoute('/gastos')({ component: Gastos })

type Periodo = 'Semana' | 'Mês' | 'Semestre'

type Categoria = {
  nome: string
  valor: number
  cor: string
  icone: LucideIcon
}

const PERIODOS: Periodo[] = ['Semana', 'Mês', 'Semestre']

// parametro que o backend espera
const PERIODO_API: Record<Periodo, string> = { Semana: 'semana', Mês: 'mes', Semestre: 'semestre' }

// visual de cada categoria (o banco guarda só o nome e o valor)
const VISUAL: Record<string, { cor: string; icone: LucideIcon }> = {
  'RU / Bandejão': { cor: '#10b981', icone: Utensils },
  Lanches: { cor: '#f59e0b', icone: Pizza },
  Transporte: { cor: '#3b82f6', icone: Bus },
  Rolês: { cor: '#8b5cf6', icone: PartyPopper },
  'Xerox / Impressões': { cor: '#64748b', icone: Printer },
  Materiais: { cor: '#e11d48', icone: BookOpen },
  Assinaturas: { cor: '#ec4899', icone: Smartphone },
  Moradia: { cor: '#4f46e5', icone: Home },
  // nome antigo, mantido para gastos já gravados
  Xerox: { cor: '#64748b', icone: Printer },
}
const VISUAL_PADRAO = { cor: '#94a3b8', icone: Plus }

type Resumo = { total: number; categorias: { nome: string; valor: number }[] }

function Donut({ itens, total }: { itens: Categoria[]; total: number }) {
  const r = 70
  const c = 2 * Math.PI * r
  const gap = 3
  let acumulado = 0

  return (
    <div className="relative mx-auto h-[190px] w-[190px]">
      <svg viewBox="0 0 190 190" className="h-full w-full -rotate-90">
        {itens.map((i) => {
          const len = total > 0 ? (i.valor / total) * c : 0
          const seg = (
            <circle
              key={i.nome}
              cx="95"
              cy="95"
              r={r}
              fill="none"
              stroke={i.cor}
              strokeWidth="22"
              strokeDasharray={`${Math.max(len - gap, 0)} ${c}`}
              strokeDashoffset={-acumulado}
              className="transition-all duration-500"
            />
          )
          acumulado += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-lg font-extrabold text-foreground">{brl(total)}</span>
      </div>
    </div>
  )
}

function Gastos() {
  const [periodo, setPeriodo] = useState<Periodo>('Mês')

  const { data, isLoading, isError } = useQuery<Resumo>({
    queryKey: ['gastos', periodo],
    queryFn: async () => {
      const res = await apiFetch(`/gastos/resumo?periodo=${PERIODO_API[periodo]}`)
      if (!res.ok) throw new Error('Falha ao buscar gastos')
      return res.json()
    },
    retry: false,
  })

  // O limite vem do Orçamento do mês atual (o mesmo da tela Orçamento e da Início).
  const orcamento = useResumo(mesAtual()).data?.orcamento ?? null

  const resumo: Resumo = data ?? { total: 0, categorias: [] }
  const categorias: Categoria[] = resumo.categorias.map((c) => ({
    nome: c.nome,
    valor: c.valor,
    ...(VISUAL[c.nome] ?? VISUAL_PADRAO),
  }))
  const total = resumo.total

  return (
    <div className="flex flex-col gap-6 p-6 pb-28 pt-10 lg:mx-auto lg:w-full lg:max-w-6xl">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Seus gastos</h1>
        <div className="flex gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                p === periodo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {isError && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          Não foi possível carregar seus gastos. Tente novamente mais tarde.
        </p>
      )}
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Carregando seus gastos…</p>}

      <main className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
        {/* Resumo + gráfico */}
        <div className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground">GASTOS</p>
              <p className="mt-1 text-xl font-extrabold text-foreground">{brl(total)}</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <p className="text-[11px] font-bold tracking-wider text-primary">RESTANTE DO MÊS</p>
              {orcamento ? (
                <p className={`mt-1 text-xl font-extrabold ${orcamento.restante >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {brl(orcamento.restante)}
                </p>
              ) : (
                <Link to="/orcamento" className="mt-1 block text-sm font-bold text-primary underline">
                  Definir orçamento
                </Link>
              )}
            </div>
          </div>
          <Donut itens={categorias} total={total} />
        </div>

        {/* Lista por categoria */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-foreground">Por categoria</h2>
          {!isLoading && categorias.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum gasto nesse período.</p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {categorias.map(({ nome, valor, cor, icone: Icone }) => (
              <li
                key={nome}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: cor }}
                >
                  <Icone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {total > 0 ? Math.round((valor / total) * 100) : 0}% dos gastos
                  </p>
                </div>
                <span className="text-[15px] font-extrabold text-foreground">{brl(valor)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="lg:col-span-2">
          <RegistrosRecentes />
        </div>
      </main>

      {/* Novo gasto/entrada: leva ao Cadastro */}
      <Link
        to="/cadastro-gasto"
        aria-label="Adicionar gasto ou entrada"
        className="fixed bottom-24 right-5 z-40 flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-95 lg:bottom-8 lg:right-10 lg:px-5"
      >
        <Plus size={24} />
        <span className="hidden lg:inline">Novo registro</span>
      </Link>
    </div>
  )
}