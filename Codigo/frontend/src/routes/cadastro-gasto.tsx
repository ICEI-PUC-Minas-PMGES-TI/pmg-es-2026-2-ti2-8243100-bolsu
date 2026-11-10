import { useQueryClient } from '@tanstack/react-query'
import { apiJson } from '../lib/api'
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  Beer,
  Bus,
  Home,
  Pizza,
  Printer,
  Smartphone,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/cadastro-gasto')({ component: CadastroGasto })

type Categoria = {
  id: number
  nome: string
  cor: string
  fundo: string
  icone: LucideIcon
}

const CATEGORIAS: Categoria[] = [
  { id: 1, nome: 'RU / Bandejão', cor: '#059669', fundo: '#d1fae5', icone: Utensils },
  { id: 2, nome: 'Lanches', cor: '#d97706', fundo: '#fef3c7', icone: Pizza },
  { id: 3, nome: 'Transporte', cor: '#2563eb', fundo: '#dbeafe', icone: Bus },
  { id: 4, nome: 'Rolês', cor: '#9333ea', fundo: '#f3e8ff', icone: Beer },
  { id: 5, nome: 'Xerox / Impressões', cor: '#475569', fundo: '#e2e8f0', icone: Printer },
  { id: 6, nome: 'Materiais', cor: '#e11d48', fundo: '#ffe4e6', icone: BookOpen },
  { id: 7, nome: 'Assinaturas', cor: '#db2777', fundo: '#fce7f3', icone: Smartphone },
  { id: 8, nome: 'Moradia', cor: '#4f46e5', fundo: '#e0e7ff', icone: Home },
]

function CadastroGasto() {
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [centavos, setCentavos] = useState(0)
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [observacao, setObservacao] = useState('')

  const valor = centavos / 100
  const podeRegistrar = valor > 0 && categoriaId !== null

  const valorTexto =
    centavos > 0
      ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''

  //(máx. 8 digitos)
  function aoDigitarValor(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 8)
    setCentavos(Number(digitos))
  }

  async function registrar() {
    if (!podeRegistrar || pending) return
    setPending(true)
    setError('')
    try {
      const now = new Date()
      const data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      await apiJson('/gastos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: CATEGORIAS.find(c => c.id === categoriaId)?.nome, valor, descricao: observacao.trim(), data }),
      })
      await cache.invalidateQueries({ queryKey: ['gastos'] })
      await navigate({ to: '/gastos' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o gasto.') }
    finally { setPending(false) }
  }

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className="expense-form-page mx-auto flex w-full max-w-md flex-col">
        <main className="flex-1 space-y-8 px-5 pt-8">
          {/* Cabeçalho */}
          <header className="flex items-center justify-between">
            <h1 className="text-[22px] font-extrabold">Onde foi essa grana?</h1>
            <button
              aria-label="Fechar"
              onClick={() => navigate({ to: '/gastos' })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </header>

          {/* Valor do gasto */}
          <label className="block cursor-text rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-8 text-center focus-within:border-emerald-400">
            <span className="text-sm font-bold tracking-wide text-emerald-500">VALOR DO GASTO</span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`text-5xl font-extrabold ${
                  valor > 0 ? 'text-emerald-500' : 'text-emerald-300'
                }`}
              >
                R$
              </span>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                aria-label="Valor do gasto"
                placeholder="0,00"
                value={valorTexto}
                onChange={(e) => aoDigitarValor(e.target.value)}
                style={{ width: `${Math.max(valorTexto.length, 4)}ch` }}
                className="min-w-0 max-w-full bg-transparent text-5xl font-extrabold text-emerald-500 caret-emerald-500 outline-none placeholder:text-emerald-200"
              />
            </div>
          </label>

          {/* Categorias */}
          <section>
            <h2 className="mb-3 text-lg font-extrabold">Com o que você gastou?</h2>
            <div className="grid grid-cols-4 gap-2.5">
              {CATEGORIAS.map(({ id, nome, cor, fundo, icone: Icone }) => {
                const selecionada = id === categoriaId
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategoriaId(id)}
                    aria-pressed={selecionada}
                    className={`flex flex-col items-center gap-2 rounded-2xl bg-white px-1 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all ${
                      selecionada ? 'ring-2 ring-emerald-500' : 'ring-1 ring-slate-100'
                    }`}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: fundo, color: cor }}
                    >
                      <Icone size={20} />
                    </span>
                    <span className="min-h-[28px] text-center text-[11px] font-bold leading-tight">
                      {nome}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Observação */}
          <section>
            <h2 className="mb-3 text-lg font-extrabold">Quer adicionar uma observação?</h2>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Lanche depois da aula"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-emerald-400"
            />
          </section>
        </main>

        {/* Botão */}
        <footer className="border-t border-slate-200 px-5 py-4">
          {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}
          <button
            onClick={registrar}
            disabled={!podeRegistrar || pending}
            className={`w-full rounded-2xl py-4 text-lg font-extrabold text-white transition-all ${
              podeRegistrar
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 active:scale-[0.98]'
                : 'cursor-not-allowed bg-emerald-300'
            }`}
          >
            Registrar gasto
          </button>
        </footer>
      </div>
    </div>
  )
}