import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { apiFetch, apiJson } from '../lib/api'
import { reais } from '../lib/resumo-mes'

type GastoReg = { id: string; categoria?: string; valor: number; data?: string; descricao?: string }
type EntradaReg = { id: string; descricao?: string; valor: number; data?: string }
type Registro = { tipo: 'gasto' | 'entrada'; id: string; titulo: string; valor: number; data: string; descricao: string }

const dataCurta = (iso: string) => (iso ? iso.slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '')
const paraNumero = (texto: string) => Number(texto.trim().replace(/\./g, '').replace(',', '.'))
const paraTexto = (n: number) => String(n).replace('.', ',')

/**
 * Lista os últimos gastos e entradas do usuário, com excluir (gasto e entrada) e editar (só entrada).
 * Uso: <RegistrosRecentes /> dentro de qualquer tela.
 */
export function RegistrosRecentes({ limite = 15 }: { limite?: number }) {
  const cache = useQueryClient()
  const [erro, setErro] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [valorTexto, setValorTexto] = useState('')
  const [descTexto, setDescTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [aExcluir, setAExcluir] = useState<Registro | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Esc fecha o pop-up de exclusão
  useEffect(() => {
    if (!aExcluir) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !excluindo) setAExcluir(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aExcluir, excluindo])

  // As chaves começam com 'gastos' para atualizar junto com o resumo e o orçamento.
  const gastosQ = useQuery({ queryKey: ['gastos', 'lista'], queryFn: () => apiJson<GastoReg[]>('/gastos'), retry: false })
  const entradasQ = useQuery({ queryKey: ['gastos', 'entradas'], queryFn: () => apiJson<EntradaReg[]>('/entradas'), retry: false })

  const registros: Registro[] = [
    ...(gastosQ.data ?? []).map((g): Registro => ({
      tipo: 'gasto', id: g.id, titulo: g.categoria || 'Gasto', valor: g.valor, data: g.data ?? '', descricao: g.descricao ?? '',
    })),
    ...(entradasQ.data ?? []).map((e): Registro => ({
      tipo: 'entrada', id: e.id, titulo: e.descricao || 'Entrada', valor: e.valor, data: e.data ?? '', descricao: e.descricao ?? '',
    })),
  ]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite)

  async function confirmarExclusao() {
    const r = aExcluir
    if (!r || excluindo) return
    const nome = r.tipo === 'gasto' ? 'o gasto' : 'a entrada'
    setExcluindo(true)
    setErro('')
    try {
      const response = await apiFetch(`${r.tipo === 'gasto' ? '/gastos' : '/entradas'}/${r.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Não foi possível excluir ${nome}.`)
      await cache.invalidateQueries({ queryKey: ['gastos'] })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.')
    } finally {
      setExcluindo(false)
      setAExcluir(null)
    }
  }

  function abrirEdicao(r: Registro) {
    setErro('')
    setEditId(r.id)
    setValorTexto(paraTexto(r.valor))
    setDescTexto(r.descricao)
  }

  async function salvarEdicao(r: Registro) {
    const valor = paraNumero(valorTexto)
    if (!(valor > 0) || salvando) return
    setSalvando(true)
    setErro('')
    try {
      await apiJson(`/entradas/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: descTexto.trim() || 'Entrada', valor, data: r.data }),
      })
      await cache.invalidateQueries({ queryKey: ['gastos'] })
      setEditId(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a entrada.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section>
      <h3 className="mb-3 text-lg font-bold text-foreground">Registros recentes</h3>
      {erro && <p role="alert" className="mb-3 text-sm font-semibold text-red-600">{erro}</p>}
      {registros.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-5 text-sm text-muted-foreground">
          {gastosQ.isPending || entradasQ.isPending ? 'Carregando…' : 'Nenhum registro ainda.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {registros.map((r) => (
            <li key={`${r.tipo}-${r.id}`} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              {editId === r.id && r.tipo === 'entrada' ? (
                <div className="space-y-2">
                  <input
                    value={descTexto}
                    onChange={(e) => setDescTexto(e.target.value)}
                    maxLength={200}
                    placeholder="Descrição"
                    aria-label="Descrição da entrada"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center rounded-xl border border-border px-3 focus-within:border-primary">
                      <span className="text-sm font-bold text-muted-foreground">R$</span>
                      <input
                        inputMode="decimal"
                        value={valorTexto}
                        onChange={(e) => setValorTexto(e.target.value)}
                        aria-label="Valor da entrada"
                        className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none"
                      />
                    </div>
                    <button type="button" onClick={() => setEditId(null)}
                      className="rounded-xl bg-muted px-3 py-2 text-sm font-bold text-foreground">Cancelar</button>
                    <button type="button" onClick={() => salvarEdicao(r)} disabled={!(paraNumero(valorTexto) > 0) || salvando}
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{r.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.tipo === 'gasto' ? 'Gasto' : 'Entrada'} · {dataCurta(r.data)}
                      {r.tipo === 'gasto' && r.descricao ? ` · ${r.descricao}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={`mr-1 text-sm font-bold ${r.tipo === 'entrada' ? 'text-success' : 'text-foreground'}`}>
                      {r.tipo === 'entrada' ? '+' : '-'} {reais(r.valor)}
                    </span>
                    {r.tipo === 'entrada' && (
                      <button type="button" aria-label="Editar entrada" onClick={() => abrirEdicao(r)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                        <Pencil size={16} />
                      </button>
                    )}
                    <button type="button" aria-label={r.tipo === 'gasto' ? 'Excluir gasto' : 'Excluir entrada'} onClick={() => setAExcluir(r)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {aExcluir && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !excluindo && setAExcluir(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={22} />
            </div>
            <h4 id="titulo-exclusao" className="text-center text-lg font-bold text-foreground">
              {aExcluir.tipo === 'gasto' ? 'Excluir gasto?' : 'Excluir entrada?'}
            </h4>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{aExcluir.titulo} · {reais(aExcluir.valor)}</span>
              <br />
              Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAExcluir(null)}
                disabled={excluindo}
                className="rounded-2xl bg-muted py-3 text-sm font-bold text-foreground disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="rounded-2xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}