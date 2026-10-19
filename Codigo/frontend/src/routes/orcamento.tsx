import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orcamento')({ component: Orcamento })

type LimiteCategoria = {
  id: number
  categoriaId: number
  nome: string
  emoji: string
  limite: number
}

const MES = '2026-09'
const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const LIMITE_TOTAL_INICIAL = 650

const LIMITES_INICIAIS: LimiteCategoria[] = [
  { id: 1, categoriaId: 1, nome: 'Alimentação', emoji: '🍔', limite: 200 },
  { id: 2, categoriaId: 4, nome: 'Lazer', emoji: '🍿', limite: 100 },
  { id: 3, categoriaId: 7, nome: 'Assinaturas', emoji: '🎧', limite: 50 },
]

// gastos do mês por categoria
const GASTO_POR_CATEGORIA: Record<number, number> = {
  1: 150,
  4: 90,
  7: 50,
  3: 80,
  6: 40,
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

const brlInteiro = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
  })

// verde até 89%, laranja de 90% a 99%, vermelho a partir de 100%
function situacao(gasto: number, limite: number) {
  const pct = limite > 0 ? (gasto / limite) * 100 : 0
  if (pct >= 100) return { nome: 'estourado', cor: '#ef4444', borda: 'border-red-500' }
  if (pct >= 90) return { nome: 'alerta', cor: '#f59e0b', borda: 'border-amber-500' }
  return { nome: 'ok', cor: '#2ecc8f', borda: 'border-slate-200' }
}

const paraNumero = (texto: string) => Number(texto.replace(',', '.'))

function Orcamento() {
  const [limiteTotal, setLimiteTotal] = useState(LIMITE_TOTAL_INICIAL)
  const [limites, setLimites] = useState<LimiteCategoria[]>(LIMITES_INICIAIS)
  const [editando, setEditando] = useState(false)

  // campos do formulário de edição
  const [totalTexto, setTotalTexto] = useState('')
  const [limitesTexto, setLimitesTexto] = useState<Record<number, string>>({})

  const totalGasto = Object.values(GASTO_POR_CATEGORIA).reduce((s, v) => s + v, 0)
  const restante = limiteTotal - totalGasto
  const pctTotal = Math.min((totalGasto / limiteTotal) * 100, 100)

  const [ano, mes] = MES.split('-')
  const tituloMes = NOMES_MESES[Number(mes) - 1]

  function abrirEdicao() {
    setTotalTexto(String(limiteTotal))
    setLimitesTexto(Object.fromEntries(limites.map((l) => [l.id, String(l.limite)])))
    setEditando(true)
  }

  const formularioValido =
    paraNumero(totalTexto) > 0 &&
    limites.every((l) => {
      const n = paraNumero(limitesTexto[l.id] ?? '')
      return !Number.isNaN(n) && n > 0
    })

  function salvar() {
    if (!formularioValido) return
    setLimiteTotal(paraNumero(totalTexto))
    setLimites(limites.map((l) => ({ ...l, limite: paraNumero(limitesTexto[l.id]) })))
    // por enquanto só altera na tela
    setEditando(false)
  }

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <main className="flex-1 px-5 pb-28 pt-10">
          {/* Cabeçalho */}
          <header>
            <h1 className="text-[26px] font-extrabold leading-tight">Orçamento de {tituloMes}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Veja o que ainda sobrou</p>
            <span className="sr-only">{ano}</span>
          </header>

          {/* Resumo do mês */}
          <section className="mt-6 rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Gasto</p>
                <p className="mt-0.5 text-2xl font-extrabold">{brl(totalGasto)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Restante</p>
                <p
                  className="mt-0.5 text-2xl font-extrabold"
                  style={{ color: restante >= 0 ? '#2ecc8f' : '#ef4444' }}
                >
                  {brl(restante)}
                </p>
              </div>
            </div>

            <div
              className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={Math.round(pctTotal)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pctTotal}%`,
                  backgroundColor: situacao(totalGasto, limiteTotal).cor,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">Limite total: {brl(limiteTotal)}</p>
          </section>

          {/* Por categoria */}
          <section className="mt-7">
            <h2 className="mb-3 text-base font-extrabold">Por categoria</h2>
            <ul className="space-y-3">
              {limites.map((l) => {
                const gasto = GASTO_POR_CATEGORIA[l.categoriaId] ?? 0
                const sit = situacao(gasto, l.limite)
                const pct = Math.min((gasto / l.limite) * 100, 100)
                return (
                  <li
                    key={l.id}
                    className={`rounded-2xl border bg-white px-4 py-3.5 ${sit.borda}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-extrabold">
                        <span aria-hidden="true">{l.emoji} </span>
                        {l.nome}
                      </span>
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: sit.nome === 'ok' ? '#64748b' : sit.cor }}
                      >
                        {brlInteiro(gasto)} / {brlInteiro(l.limite)}
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: sit.cor }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </main>

        {/* Botão fixo */}
        <footer className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-[#f6f9f7] px-5 pb-5 pt-3">
          <button
            onClick={abrirEdicao}
            className="w-full rounded-2xl bg-slate-100 py-4 text-base font-extrabold text-slate-900 transition-colors hover:bg-slate-200"
          >
            Editar limites
          </button>
        </footer>
      </div>

      {/* Edição de limites */}
      {editando && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-6">
            <h2 className="text-lg font-extrabold">Editar limites</h2>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-600">Limite total do mês</span>
              <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-emerald-400">
                <span className="text-sm font-bold text-slate-400">R$</span>
                <input
                  inputMode="decimal"
                  value={totalTexto}
                  onChange={(e) => setTotalTexto(e.target.value)}
                  className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                />
              </div>
            </label>

            <p className="mb-1 mt-5 text-sm font-bold text-slate-600">Limite por categoria</p>
            <div className="space-y-3">
              {limites.map((l) => (
                <label key={l.id} className="block">
                  <span className="text-sm font-semibold">
                    <span aria-hidden="true">{l.emoji} </span>
                    {l.nome}
                  </span>
                  <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-emerald-400">
                    <span className="text-sm font-bold text-slate-400">R$</span>
                    <input
                      inputMode="decimal"
                      value={limitesTexto[l.id] ?? ''}
                      onChange={(e) =>
                        setLimitesTexto({ ...limitesTexto, [l.id]: e.target.value })
                      }
                      className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditando(false)}
                className="flex-1 rounded-2xl bg-slate-100 py-3.5 font-extrabold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={!formularioValido}
                className={`flex-1 rounded-2xl py-3.5 font-extrabold ${
                  formularioValido
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}