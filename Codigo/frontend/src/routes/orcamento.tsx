import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch, apiJson } from '../lib/api'
import { useResumo } from '../lib/resumo'
import { deslocarMes, percentual, reais, tituloDoMes } from '../lib/resumo-mes'
import { mesAtual } from '../lib/simulacao'
import '@/styles.css'

export const Route = createFileRoute('/orcamento')({ component: Orcamento })

type LimiteCategoria = { id: string; categoria: string; limite: number }

// Mesmos nomes da tela de cadastro (é por eles que o resumo agrupa os gastos).
const CATEGORIAS = [
  { nome: 'RU / Bandejão', emoji: '🍽️' },
  { nome: 'Lanches', emoji: '🍕' },
  { nome: 'Transporte', emoji: '🚌' },
  { nome: 'Rolês', emoji: '🍻' },
  { nome: 'Xerox / Impressões', emoji: '🖨️' },
  { nome: 'Materiais', emoji: '📚' },
  { nome: 'Assinaturas', emoji: '🎧' },
  { nome: 'Moradia', emoji: '🏠' },
]

// verde até 89%, laranja de 90% a 99%, vermelho a partir de 100%
function situacao(gasto: number, limite: number) {
  const pct = limite > 0 ? (gasto / limite) * 100 : 0
  if (pct >= 100) return { nome: 'estourado', barra: 'bg-red-500', borda: 'border-red-500', texto: 'text-red-500' }
  if (pct >= 90) return { nome: 'alerta', barra: 'bg-warning', borda: 'border-warning', texto: 'text-warning' }
  return { nome: 'ok', barra: 'bg-primary', borda: 'border-border', texto: 'text-muted-foreground' }
}

const paraNumero = (texto: string) => Number(texto.trim().replace(/\./g, '').replace(',', '.'))
const paraTexto = (n: number) => String(n).replace('.', ',')
const norm = (s: string) => s.trim().toLowerCase()

function Orcamento() {
  const cache = useQueryClient()
  const atual = mesAtual()
  const [mes, setMes] = useState(atual)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [totalTexto, setTotalTexto] = useState('')
  const [limitesTexto, setLimitesTexto] = useState<Record<string, string>>({})

  const resumoQ = useResumo(mes)
  // A chave começa com 'gastos' para atualizar junto com o resumo.
  const limitesQ = useQuery({
    queryKey: ['gastos', 'limites-categoria'],
    queryFn: () => apiJson<LimiteCategoria[]>('/limites-categoria'),
    retry: false,
  })

  const resumo = resumoQ.data
  const limites = limitesQ.data ?? []
  const limiteTotal = resumo?.orcamento?.limite ?? 0
  const totalGasto = resumo?.despesas ?? 0
  const restante = limiteTotal - totalGasto
  const sitTotal = situacao(totalGasto, limiteTotal)

  const limiteDe = (nome: string) => limites.find((l) => norm(l.categoria) === norm(nome))
  const gastoDe = (nome: string) =>
    (resumo?.categorias ?? []).filter((c) => norm(c.nome) === norm(nome)).reduce((s, c) => s + c.valor, 0)

  // Categorias exibidas: as que têm limite ou gasto no mês.
  const nomesConhecidos = CATEGORIAS.map((c) => norm(c.nome))
  const extras = [...limites.map((l) => l.categoria), ...(resumo?.categorias ?? []).map((c) => c.nome)].filter(
    (n, i, arr) => !nomesConhecidos.includes(norm(n)) && arr.findIndex((x) => norm(x) === norm(n)) === i,
  )
  const linhas = [...CATEGORIAS, ...extras.map((nome) => ({ nome, emoji: '🏷️' }))]
    .map((c) => ({ ...c, gasto: gastoDe(c.nome), limite: limiteDe(c.nome)?.limite ?? 0 }))
    .filter((c) => c.gasto > 0 || c.limite > 0)

  function abrirEdicao() {
    setErro('')
    setTotalTexto(limiteTotal > 0 ? paraTexto(limiteTotal) : '')
    setLimitesTexto(
      Object.fromEntries(CATEGORIAS.map((c) => [c.nome, limiteDe(c.nome) ? paraTexto(limiteDe(c.nome)!.limite) : ''])),
    )
    setEditando(true)
  }

  const totalOk = totalTexto.trim() !== '' && paraNumero(totalTexto) > 0
  const limitesOk = CATEGORIAS.every((c) => {
    const t = (limitesTexto[c.nome] ?? '').trim()
    return t === '' || paraNumero(t) > 0
  })
  const formularioValido = totalOk && limitesOk

  async function salvar() {
    if (!formularioValido || salvando) return
    setSalvando(true)
    setErro('')
    const headers = { 'Content-Type': 'application/json' }
    try {
      const novoTotal = paraNumero(totalTexto)
      if (novoTotal !== limiteTotal) {
        await apiJson('/orcamento', { method: 'PUT', headers, body: JSON.stringify({ mes, limiteMensal: novoTotal }) })
      }
      for (const c of CATEGORIAS) {
        const texto = (limitesTexto[c.nome] ?? '').trim()
        const existente = limiteDe(c.nome)
        if (texto === '') {
          if (existente) {
            const r = await apiFetch(`/limites-categoria/${existente.id}`, { method: 'DELETE' })
            if (!r.ok) throw new Error(`Não foi possível remover o limite de ${c.nome}.`)
          }
        } else if (paraNumero(texto) !== existente?.limite) {
          await apiJson('/limites-categoria', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ categoria: c.nome, limite: paraNumero(texto) }),
          })
        }
      }
      await cache.invalidateQueries({ queryKey: ['gastos'] })
      setEditando(false)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar os limites.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6 pb-28 pt-10 lg:max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orçamento</h1>
        <p className="text-sm font-medium text-muted-foreground">Veja o que ainda sobrou</p>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-1.5">
        <button type="button" aria-label="Mês anterior" onClick={() => setMes(deslocarMes(mes, -1))}
          className="rounded-xl p-2 text-foreground hover:bg-muted"><ChevronLeft size={20} /></button>
        <span className="text-sm font-bold text-foreground" aria-live="polite">{tituloDoMes(mes)}</span>
        <button type="button" aria-label="Próximo mês" onClick={() => setMes(deslocarMes(mes, 1))}
          className="rounded-xl p-2 text-foreground hover:bg-muted"><ChevronRight size={20} /></button>
      </div>

      {resumoQ.isError && (
        <div role="alert" className="rounded-3xl border border-border bg-card p-5 text-sm font-semibold text-foreground">
          {resumoQ.error instanceof Error ? resumoQ.error.message : 'Não foi possível carregar o orçamento.'}
        </div>
      )}

      {/* Resumo do mês */}
      <div className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-primary-foreground/80">Total gasto</p>
            <h2 className="text-3xl font-extrabold tracking-tighter">{resumoQ.isPending ? '…' : reais(totalGasto)}</h2>
          </div>
          <div className="text-right">
            <p className="mb-1 text-sm font-medium text-primary-foreground/80">{restante < 0 ? 'Acima do limite' : 'Restante'}</p>
            <h2 className="text-3xl font-extrabold tracking-tighter">
              {limiteTotal > 0 ? reais(Math.abs(restante)) : '—'}
            </h2>
          </div>
        </div>

        {limiteTotal > 0 ? (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-medium text-primary-foreground/80">
              <span>{reais(totalGasto)} gastos</span>
              <span>de {reais(limiteTotal)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/20"
              role="progressbar" aria-label="Gastos sobre o limite do mês"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual(totalGasto, limiteTotal))}>
              <div className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${percentual(totalGasto, limiteTotal)}%` }} />
            </div>
            {sitTotal.nome !== 'ok' && (
              <p className="pt-1 text-xs font-semibold">
                {sitTotal.nome === 'estourado' ? 'Você passou do limite do mês.' : 'Atenção: você está perto do limite do mês.'}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-5 text-xs font-medium text-primary-foreground/90">Você ainda não definiu o limite deste mês.</p>
        )}
      </div>

      {resumo && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Entradas: {reais(resumo.entradas)} · Saldo: {reais(resumo.saldo)}
        </p>
      )}

      <button
        type="button"
        onClick={abrirEdicao}
        className="w-full rounded-2xl bg-card border border-border py-3.5 text-base font-bold text-foreground shadow-sm hover:bg-muted"
      >
        Editar limites
      </button>

      </div>

      <section>
        <h3 className="mb-3 text-lg font-bold text-foreground">Por categoria</h3>
        {linhas.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
            Nenhum gasto ou limite por categoria neste mês. Toque em “Editar limites” para definir.
          </p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {linhas.map((l) => {
              const sit = l.limite > 0 ? situacao(l.gasto, l.limite) : { nome: 'sem', barra: 'bg-muted', borda: 'border-border', texto: 'text-muted-foreground' }
              return (
                <li key={l.nome} className={`rounded-2xl border bg-card px-4 py-3.5 shadow-sm ${sit.borda}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-foreground">
                      <span aria-hidden="true">{l.emoji} </span>
                      {l.nome}
                    </span>
                    <span className={`text-sm font-bold ${sit.texto}`}>
                      {l.limite > 0 ? `${reais(l.gasto)} / ${reais(l.limite)}` : `${reais(l.gasto)} · sem limite`}
                    </span>
                  </div>
                  {l.limite > 0 && (
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all duration-500 ${sit.barra}`}
                        style={{ width: `${percentual(l.gasto, l.limite)}%` }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      </div>

      {/* Edição de limites */}
      {editando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-3xl bg-card shadow-xl">
            <h2 className="px-6 pb-2 pt-6 text-lg font-bold text-foreground">Editar limites</h2>

            <div className="overflow-y-auto px-6 pb-4">
            <label className="mt-4 block">
              <span className="text-sm font-bold text-muted-foreground">Limite total de {tituloDoMes(mes)}</span>
              <div className="mt-1.5 flex items-center rounded-2xl border border-border px-4 focus-within:border-primary">
                <span className="text-sm font-bold text-muted-foreground">R$</span>
                <input
                  inputMode="decimal"
                  value={totalTexto}
                  onChange={(e) => setTotalTexto(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
                />
              </div>
            </label>

            <p className="mb-1 mt-5 text-sm font-bold text-muted-foreground">Limite por categoria (vazio = sem limite)</p>
            <div className="space-y-3">
              {CATEGORIAS.map((c) => (
                <label key={c.nome} className="block">
                  <span className="text-sm font-semibold text-foreground">
                    <span aria-hidden="true">{c.emoji} </span>
                    {c.nome}
                  </span>
                  <div className="mt-1.5 flex items-center rounded-2xl border border-border px-4 focus-within:border-primary">
                    <span className="text-sm font-bold text-muted-foreground">R$</span>
                    <input
                      inputMode="decimal"
                      value={limitesTexto[c.nome] ?? ''}
                      onChange={(e) => setLimitesTexto({ ...limitesTexto, [c.nome]: e.target.value })}
                      placeholder="sem limite"
                      className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>

            {erro && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{erro}</p>}
            </div>

            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button type="button" onClick={() => setEditando(false)}
                className="flex-1 rounded-2xl bg-muted py-3.5 font-bold text-foreground">
                Cancelar
              </button>
              <button type="button" onClick={salvar} disabled={!formularioValido || salvando}
                className="flex-1 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50">
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}