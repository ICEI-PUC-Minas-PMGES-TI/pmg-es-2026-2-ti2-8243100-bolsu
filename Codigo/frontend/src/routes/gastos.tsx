import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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

type Categoria = {
  nome: string
  valor: number
  cor: string
  icone: LucideIcon
}

const API = 'http://localhost:8080' // URL do backend local

// o banco guarda só o NOME do ícone; aqui ficam os componentes que o desenham
const ICONES: Record<string, LucideIcon> = {
  Utensils,
  Pizza,
  Bus,
  PartyPopper,
  Printer,
  Smartphone,
}
const VISUAL_PADRAO = { cor: '#94a3b8', icone: Plus }

// tudo abaixo vem do banco (MongoDB) via backend
type PeriodoInfo = { periodo: string; rotulo: string; dias: number; valor: number }

type Resumo = {
  total: number
  orcamento: number | null
  categorias: { nome: string; valor: number; cor: string | null; icone: string | null }[]
}

// busca no backend e devolve um erro que diz o motivo real da falha
async function buscar<T>(caminho: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${caminho}`)
  } catch {
    throw new Error(`Backend inacessível em ${API} (desligado, endereço errado ou bloqueio de CORS)`)
  }
  if (!res.ok) {
    throw new Error(`O backend respondeu ${res.status} em ${caminho}`)
  }
  return res.json()
}

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
        <circle cx="95" cy="95" r={r} fill="none" stroke="#e2e8f0" strokeWidth="22" />
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
  const [escolhido, setEscolhido] = useState<string | null>(null)

  // períodos (abas) cadastrados no banco
  const periodosQuery = useQuery<PeriodoInfo[]>({
    queryKey: ['periodos'],
    queryFn: () => buscar<PeriodoInfo[]>('/orcamentos'),
    retry: false,
  })
  const periodos = periodosQuery.data ?? []
  // se nada foi escolhido, usa o primeiro período do banco
  const periodo = escolhido ?? periodos[0]?.periodo ?? null

  const { data, isLoading, isError, error: erroResumo } = useQuery<Resumo>({
    queryKey: ['gastos', periodo],
    queryFn: () => buscar<Resumo>(`/gastos/resumo?periodo=${periodo}`),
    retry: false,
    enabled: periodo !== null,
  })

  const erro = periodosQuery.isError || isError
  const motivoErro = (periodosQuery.error ?? erroResumo)?.message
  const carregando = periodosQuery.isLoading || (periodo !== null && isLoading)
  const semPeriodos = !periodosQuery.isLoading && !periodosQuery.isError && periodos.length === 0

  // só dados reais: se o backend falhar ou estiver vazio, nada é inventado
  const resumo: Resumo = erro || !data ? { total: 0, orcamento: null, categorias: [] } : data
  const semGastos = !carregando && !erro && !semPeriodos && resumo.categorias.length === 0

  const categorias: Categoria[] = resumo.categorias.map((c) => ({
    nome: c.nome,
    valor: c.valor,
    cor: c.cor ?? VISUAL_PADRAO.cor,
    icone: (c.icone && ICONES[c.icone]) || VISUAL_PADRAO.icone,
  }))
  const total = resumo.total
  const orcamento = resumo.orcamento
  const restante = orcamento === null ? null : orcamento - total
  const grafico = categorias

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className="mx-auto w-full max-w-2xl pb-28 lg:max-w-none lg:pb-12">
        {/* Cabeçalho */}
        <header className="border-b border-slate-200/70 bg-white px-5 pb-4 pt-8 lg:flex lg:items-center lg:justify-between lg:px-10 lg:py-6">
          <h1 className="text-[22px] font-extrabold lg:text-3xl">Seus gastos</h1>
          <div className="mt-4 flex gap-2 lg:mt-0">
            {periodos.map((p) => (
              <button
                key={p.periodo}
                onClick={() => setEscolhido(p.periodo)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  p.periodo === periodo
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {p.rotulo}
              </button>
            ))}
          </div>
        </header>

        {erro && (
          <div className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 lg:mx-10">
            Não foi possível carregar os dados. {motivoErro}
          </div>
        )}
        {semPeriodos && (
          <div className="mx-5 mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800 lg:mx-10">
            Nenhum período cadastrado no banco de dados.
          </div>
        )}
        {semGastos && (
          <div className="mx-5 mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800 lg:mx-10">
            Nenhum gasto registrado nesse período.
          </div>
        )}

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
                {restante === null ? (
                  <p className="mt-1 text-sm font-bold text-slate-500">Orçamento não cadastrado</p>
                ) : (
                  <p
                    className={`mt-1 text-xl font-extrabold ${
                      restante >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {brl(restante)}
                  </p>
                )}
              </div>
            </div>
            <Donut itens={grafico} total={total} />
          </div>

          {/* Lista por categoria */}
          <section>
            <h2 className="mb-3 text-base font-extrabold lg:text-lg">Por categoria</h2>
            {carregando && <p className="text-sm text-slate-500">Carregando...</p>}
            {erro && <p className="text-sm text-red-500">Erro ao carregar os gastos.</p>}
            {semGastos && <p className="text-sm text-slate-500">Nenhum gasto nesse período.</p>}
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
    </div>
  )
}