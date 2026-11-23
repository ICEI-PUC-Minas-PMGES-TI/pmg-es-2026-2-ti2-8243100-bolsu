import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  type LucideIcon,
} from 'lucide-react'
import { apiJson } from '../lib/api'
import '@/styles.css'

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

type Modo = 'gasto' | 'entrada'

function hoje() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function CadastroGasto() {
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [modo, setModo] = useState<Modo>('gasto')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [centavos, setCentavos] = useState(0)
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [observacao, setObservacao] = useState('')

  const ehGasto = modo === 'gasto'
  const valor = centavos / 100
  const podeRegistrar = valor > 0 && (!ehGasto || categoriaId !== null)

  const valorTexto =
    centavos > 0
      ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''

  // (máx. 8 dígitos)
  function aoDigitarValor(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 8)
    setCentavos(Number(digitos))
  }

  async function registrar() {
    if (!podeRegistrar || pending) return
    setPending(true)
    setError('')
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (ehGasto) {
        await apiJson('/gastos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            categoria: CATEGORIAS.find((c) => c.id === categoriaId)?.nome,
            valor,
            descricao: observacao.trim(),
            data: hoje(),
          }),
        })
      } else {
        await apiJson('/entradas', {
          method: 'POST',
          headers,
          body: JSON.stringify({ descricao: observacao.trim() || 'Entrada', valor, data: hoje() }),
        })
      }
      // Chaves que começam com 'gastos' (lista, resumo, orçamento) são atualizadas juntas.
      await cache.invalidateQueries({ queryKey: ['gastos'] })
      await navigate({ to: '/gastos' })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6 pb-28 pt-10 lg:max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {ehGasto ? 'Onde foi essa grana?' : 'De onde veio essa grana?'}
        </h1>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[400px_1fr] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
      {/* Gasto / Entrada */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist">
        {(['gasto', 'entrada'] as Modo[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m)
              setError('')
            }}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
              modo === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {m === 'gasto' ? 'Gasto' : 'Entrada'}
          </button>
        ))}
      </div>

      {/* Valor */}
      <label className="block cursor-text rounded-3xl border border-primary/20 bg-primary/10 px-4 py-8 text-center focus-within:border-primary">
        <span className="text-sm font-bold tracking-wide text-primary">
          {ehGasto ? 'VALOR DO GASTO' : 'VALOR DA ENTRADA'}
        </span>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className={`text-5xl font-extrabold ${valor > 0 ? 'text-primary' : 'text-primary/40'}`}>R$</span>
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            aria-label={ehGasto ? 'Valor do gasto' : 'Valor da entrada'}
            placeholder="0,00"
            value={valorTexto}
            onChange={(e) => aoDigitarValor(e.target.value)}
            style={{ width: `${Math.max(valorTexto.length, 4)}ch` }}
            className="bg-transparent text-5xl font-extrabold text-primary caret-primary outline-none placeholder:text-primary/30"
          />
        </div>
      </label>

      </div>

      <div className="flex flex-col gap-6">
      {/* Categorias (só para gasto) */}
      {ehGasto && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-foreground">Com o que você gastou?</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {CATEGORIAS.map(({ id, nome, cor, fundo, icone: Icone }) => {
              const selecionada = id === categoriaId
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategoriaId(id)}
                  aria-pressed={selecionada}
                  className={`flex flex-col items-center gap-2 rounded-2xl border bg-card px-1 py-3 shadow-sm transition-all ${
                    selecionada ? 'border-primary ring-2 ring-primary' : 'border-border'
                  }`}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: fundo, color: cor }}
                  >
                    <Icone size={20} />
                  </span>
                  <span className="min-h-[28px] text-center text-[11px] font-bold leading-tight text-foreground">{nome}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Observação / descrição */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          {ehGasto ? 'Quer adicionar uma observação?' : 'Descrição da entrada'}
        </h2>
        <input
          type="text"
          maxLength={200}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder={ehGasto ? 'Ex: Lanche depois da aula' : 'Ex: Mesada, estágio, freela'}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </section>

      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={registrar}
        disabled={!podeRegistrar || pending}
        className="w-full rounded-2xl bg-primary py-4 text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Salvando…' : ehGasto ? 'Registrar gasto' : 'Registrar entrada'}
      </button>
      </div>
      </div>
    </div>
  )
}