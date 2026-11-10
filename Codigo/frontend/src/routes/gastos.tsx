import { apiFetch } from '../lib/api'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Bus,
  PartyPopper,
  Pizza,
  Plus,
  Printer,
  Smartphone,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/gastos')({ component: Gastos })

type Periodo = 'Semana' | 'Mês' | 'Semestre'

type Categoria = {
  nome: string
  valor: number
  cor: string
  icone: LucideIcon
}

const PERIODOS: Periodo[] = ['Semana', 'Mês', 'Semestre']



const ORCAMENTO: Record<Periodo, number> = { Semana: 120, Mês: 500, Semestre: 3000 }

// parametro que o backend espera
const PERIODO_API: Record<Periodo, string> = { Semana: 'semana', Mês: 'mes', Semestre: 'semestre' }

// visual de cada categoria (o banco guarda só o nome e o valor)
const VISUAL: Record<string, { cor: string; icone: LucideIcon }> = {
  'RU / Bandejão': { cor: '#10b981', icone: Utensils },
  Lanches: { cor: '#f59e0b', icone: Pizza },
  Transporte: { cor: '#3b82f6', icone: Bus },
  Rolês: { cor: '#8b5cf6', icone: PartyPopper },
  Xerox: { cor: '#64748b', icone: Printer },
  Assinaturas: { cor: '#ec4899', icone: Smartphone },
}
const VISUAL_PADRAO = { cor: '#94a3b8', icone: Plus }

type Resumo = { total: number; categorias: { nome: string; valor: number }[] }

type Fonte = 'reais' | 'ficticios'

// dados FICTÍCIOS, só para demonstração do visual
const DEMO: Record<Periodo, { nome: string; valor: number }[]> = {
  Semana: [
    { nome: 'RU / Bandejão', valor: 28.5 },
    { nome: 'Lanches', valor: 22 },
    { nome: 'Transporte', valor: 18.4 },
    { nome: 'Rolês', valor: 25 },
    { nome: 'Xerox', valor: 4.5 },
  ],
  Mês: [
    { nome: 'RU / Bandejão', valor: 112 },
    { nome: 'Lanches', valor: 86.9 },
    { nome: 'Transporte', valor: 96.8 },
    { nome: 'Rolês', valor: 120 },
    { nome: 'Xerox', valor: 18.5 },
    { nome: 'Assinaturas', valor: 34.9 },
  ],
  Semestre: [
    { nome: 'RU / Bandejão', valor: 640 },
    { nome: 'Lanches', valor: 512.3 },
    { nome: 'Transporte', valor: 580 },
    { nome: 'Rolês', valor: 730.5 },
    { nome: 'Xerox', valor: 96 },
    { nome: 'Assinaturas', valor: 209.4 },
  ],
}

const somar = (cats: { nome: string; valor: number }[]): Resumo => ({
  total: cats.reduce((acc, c) => acc + c.valor, 0),
  categorias: cats,
})

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

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
        <span className="text-xs text-slate-500">Total</span>
        <span className="text-lg font-extrabold text-slate-900">{brl(total)}</span>
      </div>
    </div>
  )
}

function Gastos() {
  const [periodo, setPeriodo] = useState<Periodo>('Mês')
  const [form, setForm] = useState(false)
  const [fonte, setFonte] = useState<Fonte>('reais')
  const [extrasDemo, setExtrasDemo] = useState<{ nome: string; valor: number }[]>([])
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<Resumo>({
    queryKey: ['gastos', periodo],
    queryFn: async () => {
      const res = await apiFetch(`/gastos/resumo?periodo=${PERIODO_API[periodo]}`)
      if (!res.ok) throw new Error('Falha ao buscar gastos')
      return res.json()
    },
    retry: false,
    enabled: fonte === 'reais',
  })

  const novoGasto = useMutation({
    mutationFn: async (g: { categoria: string; valor: number; descricao: string }) => {
      if (fonte === 'ficticios') {
        // modo demonstração: só guarda na memória da tela
        setExtrasDemo((e) => [...e, { nome: g.categoria, valor: g.valor }])
        return
      }
      const res = await apiFetch(`/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(g),
      })
      if (!res.ok) throw new Error('Falha ao salvar gasto')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      setForm(false)
    },
  })

  // Dados demonstrativos são exibidos somente por escolha explícita.
  const usandoDemo = fonte === 'ficticios'

  const demoResumo = somar(
    Object.values(
      [...DEMO[periodo], ...extrasDemo].reduce<Record<string, { nome: string; valor: number }>>((acc, c) => {
        acc[c.nome] = { nome: c.nome, valor: (acc[c.nome]?.valor ?? 0) + c.valor }
        return acc
      }, {}),
    ),
  )
  const resumo: Resumo = usandoDemo ? demoResumo : (data ?? { total: 0, categorias: [] })

  const categorias: Categoria[] = resumo.categorias.map((c) => ({
    nome: c.nome,
    valor: c.valor,
    ...(VISUAL[c.nome] ?? VISUAL_PADRAO),
  }))
  const total = resumo.total
  const restante = ORCAMENTO[periodo] - total
  const grafico = categorias

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className="mx-auto w-full max-w-2xl pb-28 lg:max-w-none lg:pb-12">
        {/* Cabeçalho */}
        <header className="border-b border-slate-200/70 bg-white px-5 pb-4 pt-8 lg:flex lg:items-center lg:justify-between lg:px-10 lg:py-6">
          <h1 className="text-[22px] font-extrabold lg:text-3xl">Seus gastos</h1>
          <div className="mt-4 flex gap-2 lg:mt-0">
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  p === periodo
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 px-5 pt-4 lg:px-10">
          <div className="flex gap-1 rounded-full bg-slate-200/60 p-1 text-[12px] font-semibold">
            {(['reais', 'ficticios'] as Fonte[]).map((f) => (
              <button
                key={f}
                onClick={() => setFonte(f)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  f === fonte ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {f === 'reais' ? 'Dados reais' : 'Dados fictícios'}
              </button>
            ))}
          </div>
          {usandoDemo && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[12px] font-semibold text-amber-800">
              Modo demonstração: valores inventados
            </span>
          )}
        </div>

        {fonte === 'reais' && isError && <p role="alert" className="px-5 py-3 text-red-600">Não foi possível carregar seus gastos. Tente novamente mais tarde.</p>}
        {fonte === 'reais' && isLoading && <p role="status" className="px-5 py-3">Carregando seus gastos…</p>}
        <p className="px-5 pt-3 text-sm text-slate-500">O limite de orçamento desta tela ainda é demonstrativo.</p>
        <main className="mx-auto grid max-w-6xl gap-6 px-5 pt-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-10 lg:pt-8">
          {/* Resumo + gráfico */}
          <div className="space-y-6 lg:rounded-3xl lg:border lg:border-slate-100 lg:bg-white lg:p-6 lg:shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                <p className="text-[11px] font-bold tracking-wider text-slate-500">GASTOS</p>
                <p className="mt-1 text-xl font-extrabold">{brl(total)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-bold tracking-wider text-emerald-700">RESTANTE</p>
                <p
                  className={`mt-1 text-xl font-extrabold ${
                    restante >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {brl(restante)}
                </p>
              </div>
            </div>
            <Donut itens={grafico} total={total} />
          </div>

          {/* Lista por categoria */}
          <section>
            <h2 className="mb-3 text-base font-extrabold lg:text-lg">Por categoria</h2>
            {fonte === 'reais' && isLoading && <p className="text-sm text-slate-500">Carregando...</p>}
            {!isLoading && categorias.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum gasto nesse período.</p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {categorias.map(({ nome, valor, cor, icone: Icone }) => (
                <li
                  key={nome}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: cor }}
                  >
                    <Icone size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{nome}</p>
                    <p className="text-xs text-slate-500">
                      {total > 0 ? Math.round((valor / total) * 100) : 0}% dos gastos
                    </p>
                  </div>
                  <span className="text-[15px] font-extrabold">{brl(valor)}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <button
        aria-label="Adicionar gasto"
        onClick={() => setForm(true)}
        className="fixed bottom-24 right-5 z-20 flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-3.5 font-bold text-white shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 lg:bottom-8 lg:right-10 lg:px-5"
      >
        <Plus size={24} />
        <span className="hidden lg:inline">Novo gasto</span>
      </button>

      {form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              novoGasto.mutate({
                categoria: String(f.get('categoria')),
                valor: Number(f.get('valor')),
                descricao: String(f.get('descricao') ?? ''),
              })
            }}
          >
            <h2 className="text-lg font-extrabold">Novo gasto</h2>
            <select name="categoria" className="w-full rounded-lg border p-2">
              {Object.keys(VISUAL).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <input name="valor" type="number" step="0.01" min="0" required placeholder="Valor (R$)" className="w-full rounded-lg border p-2" />
            <input name="descricao" placeholder="Descrição (opcional)" className="w-full rounded-lg border p-2" />
            {novoGasto.isError && <p className="text-sm text-red-500">Erro ao salvar.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(false)} className="rounded-full px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" disabled={novoGasto.isPending} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}