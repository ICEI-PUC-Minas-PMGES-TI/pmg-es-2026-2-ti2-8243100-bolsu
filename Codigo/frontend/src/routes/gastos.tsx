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
  const [periodo] = useState<Periodo>('Mês')
  const total = DADOS[periodo].reduce((s, c) => s + c.valor, 0)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Seus gastos</h1>
      <p>{brl(total)}</p>
      <Donut itens={ORDEM_GRAFICO.map((n) => DADOS[periodo].find((c) => c.nome === n)!)} total={total} />
    </div>
  )
}