import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

export const Route = createFileRoute('/gastos_compartilhados')({
  component: GastosCompartilhados,
})

type Tipo = 'moradia' | 'viagem' | 'amigos' | 'outro'

type Grupo = {
  id: number
  nome: string
  tipo: Tipo
  integrantes: string[] // inclui "Você"
  saldo: number // negativo = você deve | positivo = te devem
}

type Divisao = { titulo: string; total: number; integrantes: string[] }

const tipos: { valor: Tipo; label: string; icone: string }[] = [
  { valor: 'moradia', label: 'Moradia', icone: '🏠' },
  { valor: 'viagem', label: 'Viagem', icone: '✈️' },
  { valor: 'amigos', label: 'Amigos', icone: '🎓' },
  { valor: 'outro', label: 'Outro', icone: '📌' },
]

const iconeDoTipo = (t: Tipo) => tipos.find((x) => x.valor === t)!.icone

const brl = (v: number) =>
  Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const campo =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'

const foco =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500'

function GastosCompartilhados() {
  // Tudo fica só em memória: recarregou a página, volta ao inicial
  const [grupos, setGrupos] = useState<Grupo[]>([
    {
      id: 1,
      nome: 'República Centro',
      tipo: 'moradia',
      integrantes: ['Você', 'Ana', 'Lucas', 'Bia', 'Caio'],
      saldo: -20,
    },
    {
      id: 2,
      nome: 'Amigos da Faculdade',
      tipo: 'amigos',
      integrantes: ['Você', 'Diego', 'Marina', 'Théo'],
      saldo: 45,
    },
  ])
  const [divisao, setDivisao] = useState<Divisao>({
    titulo: 'Jantar no restaurante',
    total: 120,
    integrantes: ['Você', 'Ana', 'Lucas'],
  })
  const [formAberto, setFormAberto] = useState(false)

  // campos do formulário
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<Tipo>('moradia')
  const [novoMembro, setNovoMembro] = useState('')
  const [membros, setMembros] = useState<string[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')

  function adicionarMembro() {
    const n = novoMembro.trim()
    if (!n) return
    if (n.toLowerCase() === 'você' || membros.some((m) => m.toLowerCase() === n.toLowerCase())) {
      setErro('Esse integrante já está no grupo.')
      return
    }
    setErro('')
    setMembros([...membros, n])
    setNovoMembro('')
  }

  function criarGrupo(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('Dê um nome ao grupo.')
      return
    }
    const integrantes = ['Você', ...membros]
    const total = parseFloat(valor.replace(',', '.'))
    const temDespesa = total > 0

    // Você pagou: os outros te devem a parte deles
    const saldo = temDespesa ? total - total / integrantes.length : 0

    setGrupos([
      { id: Date.now(), nome: nome.trim(), tipo, integrantes, saldo },
      ...grupos,
    ])
    if (temDespesa) {
      setDivisao({ titulo: descricao.trim() || nome.trim(), total, integrantes })
    }

    setNome('')
    setTipo('moradia')
    setMembros([])
    setNovoMembro('')
    setDescricao('')
    setValor('')
    setErro('')
    setFormAberto(false)
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <p role="note" className="bg-amber-50 px-5 py-3 text-sm text-amber-900">Demonstração: grupos e divisões ficam apenas nesta tela; não há compartilhamento entre contas.</p>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-8 lg:max-w-5xl lg:px-10 lg:pb-10 lg:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 lg:text-2xl">
              Dividir despesas
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Rache as contas de forma justa e descomplicada
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-6">
            {/* Última divisão ativa */}
            <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
              <p className="text-xs font-semibold text-emerald-500">
                Última divisão ativa
              </p>
              <h2 className="mt-2 font-semibold text-neutral-900">{divisao.titulo}</h2>
              <p className="mt-1 border-b border-neutral-100 pb-3 text-lg font-bold">
                {brl(divisao.total)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {divisao.integrantes.slice(0, 5).map((i) => (
                    <span
                      key={i}
                      title={i}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-semibold text-emerald-700"
                    >
                      {i[0].toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-neutral-500">
                  {brl(divisao.total / divisao.integrantes.length)} por pessoa
                </span>
              </div>
            </section>

            {/* Seus grupos */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                Seus grupos
              </h2>
              {grupos.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-neutral-500 shadow-sm">
                  Você ainda não tem grupos. Crie o primeiro para dividir uma conta.
                </p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {grupos.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-neutral-50 ${foco}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                          {iconeDoTipo(g.tipo)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-neutral-900">
                            {g.nome}
                          </span>
                          <span className="block text-xs text-neutral-500">
                            {g.integrantes.length} membros
                          </span>
                        </span>
                        {g.saldo !== 0 && (
                          <span className="text-right">
                            <span
                              className={`block text-xs ${g.saldo < 0 ? 'text-red-500' : 'text-emerald-500'}`}
                            >
                              {g.saldo < 0 ? 'Você deve' : 'Te devem'}
                            </span>
                            <span
                              className={`block text-sm font-bold ${g.saldo < 0 ? 'text-red-500' : 'text-emerald-500'}`}
                            >
                              {brl(g.saldo)}
                            </span>
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Criar grupo: folha por cima no celular, coluna fixa no computador */}
          <div
            className={
              formAberto
                ? 'fixed inset-0 z-[60] flex items-end bg-black/40 lg:static lg:block lg:bg-transparent'
                : 'hidden lg:block'
            }
            onClick={(e) => {
              if (e.target === e.currentTarget) setFormAberto(false)
            }}
          >
            <form
              onSubmit={criarGrupo}
              className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 lg:max-h-none lg:rounded-2xl lg:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Criar grupo</h2>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setFormAberto(false)}
                  className={`rounded-full p-1 text-neutral-500 lg:hidden ${foco}`}
                >
                  <X size={20} />
                </button>
              </div>

              <label className="block text-sm font-medium text-neutral-700">
                Nome do grupo
                <input
                  className={`${campo} mt-1`}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Viagem de julho"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-medium text-neutral-700">Tipo</legend>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {tipos.map((t) => (
                    <button
                      key={t.valor}
                      type="button"
                      onClick={() => setTipo(t.valor)}
                      aria-pressed={tipo === t.valor}
                      className={`rounded-xl border px-3 py-2 text-sm ${foco} ${
                        tipo === t.valor
                          ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-700'
                          : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {t.icone} {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="novo-membro"
                  className="text-sm font-medium text-neutral-700"
                >
                  Integrantes
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="novo-membro"
                    className={campo}
                    value={novoMembro}
                    onChange={(e) => setNovoMembro(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarMembro()
                      }
                    }}
                    placeholder="Nome de quem divide com você"
                  />
                  <button
                    type="button"
                    onClick={adicionarMembro}
                    className={`rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white ${foco}`}
                  >
                    Adicionar
                  </button>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  <li className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    Você
                  </li>
                  {membros.map((m) => (
                    <li
                      key={m}
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                    >
                      {m}
                      <button
                        type="button"
                        aria-label={`Remover ${m}`}
                        onClick={() => setMembros(membros.filter((x) => x !== m))}
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-[1fr_110px] gap-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Primeira despesa (opcional)
                  <input
                    className={`${campo} mt-1`}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex.: Mercado"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-700">
                  Valor
                  <input
                    className={`${campo} mt-1`}
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                  />
                </label>
              </div>

              {erro && (
                <p role="alert" className="text-sm text-red-500">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className={`w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 ${foco}`}
              >
                Criar grupo
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Botão + (só no celular) */}
      <button
        type="button"
        aria-label="Criar grupo"
        onClick={() => setFormAberto(true)}
        className={`fixed bottom-24 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600 lg:hidden ${foco}`}
      >
        <Plus size={22} />
      </button>

      {/* Navegação inferior (só no celular) */}

    </div>
  )
}