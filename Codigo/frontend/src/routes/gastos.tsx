import { useState } from 'react'
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

// exemplo de dados (mudar quando tiver backend)
const ORCAMENTO: Record<Periodo, number> = { Semana: 120, Mês: 500, Semestre: 3000 }

const DADOS: Record<Periodo, Categoria[]> = {
  Mês: [
    { nome: 'RU / Bandejão', valor: 85, cor: '#10b981', icone: Utensils },
    { nome: 'Lanches', valor: 65, cor: '#f59e0b', icone: Pizza },
    { nome: 'Transporte', valor: 50, cor: '#3b82f6', icone: Bus },
    { nome: 'Rolês', valor: 80, cor: '#8b5cf6', icone: PartyPopper },
    { nome: 'Xerox', valor: 12.6, cor: '#64748b', icone: Printer },
    { nome: 'Assinaturas', valor: 20, cor: '#ec4899', icone: Smartphone },
  ],
  Semana: [
    { nome: 'RU / Bandejão', valor: 22, cor: '#10b981', icone: Utensils },
    { nome: 'Lanches', valor: 18.5, cor: '#f59e0b', icone: Pizza },
    { nome: 'Transporte', valor: 12, cor: '#3b82f6', icone: Bus },
    { nome: 'Rolês', valor: 25, cor: '#8b5cf6', icone: PartyPopper },
    { nome: 'Xerox', valor: 3.6, cor: '#64748b', icone: Printer },
    { nome: 'Assinaturas', valor: 5, cor: '#ec4899', icone: Smartphone },
  ],
  Semestre: [
    { nome: 'RU / Bandejão', valor: 510, cor: '#10b981', icone: Utensils },
    { nome: 'Lanches', valor: 390, cor: '#f59e0b', icone: Pizza },
    { nome: 'Transporte', valor: 300, cor: '#3b82f6', icone: Bus },
    { nome: 'Rolês', valor: 480, cor: '#8b5cf6', icone: PartyPopper },
    { nome: 'Xerox', valor: 75.6, cor: '#64748b', icone: Printer },
    { nome: 'Assinaturas', valor: 120, cor: '#ec4899', icone: Smartphone },
  ],
}

// ordem do grafico
const ORDEM_GRAFICO = ['RU / Bandejão', 'Assinaturas', 'Xerox', 'Rolês', 'Transporte', 'Lanches']

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
          const len = (i.valor / total) * c
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

  const categorias = DADOS[periodo]
  const total = categorias.reduce((s, c) => s + c.valor, 0)
  const restante = ORCAMENTO[periodo] - total
  const grafico = ORDEM_GRAFICO.map((n) => categorias.find((c) => c.nome === n)!)

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

        <main className="mx-auto grid max-w-6xl gap-6 px-5 pt-5 lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8 lg:px-10 lg:pt-8">
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
            <ul className="grid gap-3 sm:grid-cols-2">
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
                      {Math.round((valor / total) * 100)}% dos gastos
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
        className="fixed bottom-6 right-5 z-20 flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-3.5 font-bold text-white shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 lg:bottom-8 lg:right-10 lg:px-5"
      >
        <Plus size={24} />
        <span className="hidden lg:inline">Novo gasto</span>
      </button>
    </div>
  )
}