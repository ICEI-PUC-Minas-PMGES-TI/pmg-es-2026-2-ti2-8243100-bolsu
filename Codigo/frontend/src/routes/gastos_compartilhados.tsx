import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  History,
  LoaderCircle,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { apiJson } from '../lib/api'

export const Route = createFileRoute('/gastos_compartilhados')({
  component: GastosCompartilhados,
})

type StatusParticipacao = 'PENDENTE' | 'ACEITO' | 'RECUSADO'
type StatusGasto = 'ATIVO' | 'ENCERRADO'

type Participante = {
  id: string
  nome: string
  status: StatusParticipacao
  pago: boolean
}

type GastoCompartilhado = {
  id: string
  nome: string
  descricao: string | null
  valorTotal: number
  valorPorParticipante: number
  criadorId: string
  criadorNome: string
  status: StatusGasto
  meuStatus: StatusParticipacao | null
  minhaCotaPaga: boolean
  ehCriador: boolean
  podeMarcarPagamento: boolean
  podeEncerrar: boolean
  convitesPendentes: number
  criadoEm: string
  encerradoEm: string | null
  participantes: Participante[]
}

type Painel = {
  ativos: GastoCompartilhado[]
  convitesPendentes: GastoCompartilhado[]
  historico: GastoCompartilhado[]
}

type Usuario = { id: string; nome: string; slug: string }

const campo =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
const foco =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500'

const brl = (valor: number) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function numeroMonetario(valor: string) {
  const texto = valor.trim().replace(/\s/g, '')
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : 0
}

function mensagemErro(erro: unknown) {
  return erro instanceof Error ? erro.message : 'Não foi possível concluir a solicitação.'
}

function GastosCompartilhados() {
  const queryClient = useQueryClient()
  const [formAberto, setFormAberto] = useState(false)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState<Usuario[]>([])
  const [erroFormulario, setErroFormulario] = useState('')

  const painelQuery = useQuery<Painel>({
    queryKey: ['gastos-compartilhados'],
    queryFn: () => apiJson<Painel>('/api/gastos-compartilhados'),
    retry: false,
  })

  const usuariosQuery = useQuery<Usuario[]>({
    queryKey: ['usuarios-compartilhamento', busca.trim()],
    queryFn: () => apiJson<Usuario[]>(`/api/gastos-compartilhados/usuarios?busca=${encodeURIComponent(busca.trim())}`),
    // No desktop o formulário fica sempre visível; não condicione a busca ao
    // estado do modal, que só existe na experiência mobile.
    enabled: busca.trim().length >= 2,
    staleTime: 10_000,
    retry: false,
  })

  const atualizarPainel = () => queryClient.invalidateQueries({ queryKey: ['gastos-compartilhados'] })

  const criarMutation = useMutation({
    mutationFn: (dados: { nome: string; descricao: string; valorTotal: number; participantesIds: string[] }) =>
      apiJson<GastoCompartilhado>('/api/gastos-compartilhados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }),
    onSuccess: gasto => {
      setNome('')
      setDescricao('')
      setValor('')
      setBusca('')
      setSelecionados([])
      setErroFormulario('')
      setFormAberto(false)
      setDetalheId(gasto.id)
      atualizarPainel()
    },
  })

  const conviteMutation = useMutation({
    mutationFn: ({ gastoId, aceitar }: { gastoId: string; aceitar: boolean }) =>
      apiJson<void>(`/api/gastos-compartilhados/${gastoId}/convite/${aceitar ? 'aceitar' : 'recusar'}`, {
        method: 'POST',
      }),
    onSuccess: atualizarPainel,
  })

  const pagamentoMutation = useMutation({
    mutationFn: ({ gastoId, pago }: { gastoId: string; pago: boolean }) =>
      apiJson<GastoCompartilhado>(`/api/gastos-compartilhados/${gastoId}/meu-pagamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago }),
      }),
    onSuccess: atualizarPainel,
  })

  const encerrarMutation = useMutation({
    mutationFn: (gastoId: string) =>
      apiJson<GastoCompartilhado>(`/api/gastos-compartilhados/${gastoId}/encerrar`, { method: 'POST' }),
    onSuccess: atualizarPainel,
  })

  const painel = painelQuery.data ?? { ativos: [], convitesPendentes: [], historico: [] }
  const todos = useMemo(
    () => [...painel.ativos, ...painel.convitesPendentes, ...painel.historico],
    [painel.ativos, painel.convitesPendentes, painel.historico],
  )
  const detalhe = todos.find(gasto => gasto.id === detalheId) ?? null
  const totalDigitado = numeroMonetario(valor)
  const valorPrevia = totalDigitado > 0 ? totalDigitado / (selecionados.length + 1) : 0
  const resultadosBusca = (usuariosQuery.data ?? []).filter(usuario =>
    !selecionados.some(selecionado => selecionado.id === usuario.id),
  )

  function fecharFormulario() {
    setFormAberto(false)
    setBusca('')
    setErroFormulario('')
  }

  function adicionarParticipante(usuario: Usuario) {
    setSelecionados(atual => [...atual, usuario])
    setBusca('')
    setErroFormulario('')
  }

  function criarGasto(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) {
      setErroFormulario('Informe o nome do gasto.')
      return
    }
    if (totalDigitado <= 0) {
      setErroFormulario('Informe um valor total maior que zero.')
      return
    }
    if (selecionados.length === 0) {
      setErroFormulario('Adicione ao menos uma pessoa para compartilhar o gasto.')
      return
    }
    criarMutation.mutate({
      nome: nome.trim(),
      descricao: descricao.trim(),
      valorTotal: totalDigitado,
      participantesIds: selecionados.map(usuario => usuario.id),
    })
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7]">
      <main className="mx-auto w-full max-w-md px-5 pb-32 pt-8 lg:max-w-6xl lg:px-10 lg:pb-10 lg:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 lg:text-2xl">Dividir despesas</h1>
            <p className="mt-1 text-sm text-neutral-500">Rache as contas de forma justa e descomplicada</p>
          </div>
          <button
            type="button"
            onClick={() => void painelQuery.refetch()}
            className={`hidden rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-white sm:block ${foco}`}
          >
            Atualizar
          </button>
        </header>

        {painelQuery.isError && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{mensagemErro(painelQuery.error)}</p>
            <button type="button" onClick={() => void painelQuery.refetch()} className="mt-2 font-semibold underline">Tentar novamente</button>
          </div>
        )}

        {painelQuery.isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-neutral-500" role="status">
            <LoaderCircle className="animate-spin" size={20} /> Carregando gastos compartilhados…
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
            <div className="space-y-7">
              {painel.ativos[0] && <UltimaDivisao gasto={painel.ativos[0]} onAbrir={() => setDetalheId(painel.ativos[0].id)} />}

              {painel.convitesPendentes.length > 0 && (
                <section aria-labelledby="convites-pendentes">
                  <h2 id="convites-pendentes" className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Clock3 size={16} className="text-amber-600" /> Convites pendentes
                  </h2>
                  <ul className="grid gap-3">
                    {painel.convitesPendentes.map(gasto => (
                      <li key={gasto.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-neutral-900">{gasto.nome}</p>
                            <p className="mt-1 text-xs text-neutral-600">{gasto.criadorNome} convidou você para dividir {brl(gasto.valorTotal)}.</p>
                            <p className="mt-2 text-sm font-bold text-amber-800">Sua cota: {brl(gasto.valorPorParticipante)}</p>
                          </div>
                          <button type="button" onClick={() => setDetalheId(gasto.id)} aria-label={`Ver detalhes de ${gasto.nome}`} className={`rounded-lg p-1 text-neutral-500 ${foco}`}>
                            <ChevronRight size={20} />
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={conviteMutation.isPending}
                            onClick={() => conviteMutation.mutate({ gastoId: gasto.id, aceitar: false })}
                            className={`rounded-xl border border-neutral-300 bg-white py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60 ${foco}`}
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            disabled={conviteMutation.isPending}
                            onClick={() => conviteMutation.mutate({ gastoId: gasto.id, aceitar: true })}
                            className={`rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 ${foco}`}
                          >
                            Aceitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="gastos-ativos">
                <h2 id="gastos-ativos" className="mb-3 text-sm font-semibold text-neutral-900">Gastos ativos</h2>
                {painel.ativos.length === 0 ? (
                  <p className="rounded-2xl bg-white p-4 text-sm text-neutral-500 shadow-sm">Você ainda não tem gastos ativos. Crie o primeiro para dividir uma conta.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                    {painel.ativos.map(gasto => <GastoCard key={gasto.id} gasto={gasto} onAbrir={() => setDetalheId(gasto.id)} />)}
                  </ul>
                )}
              </section>

              {painel.historico.length > 0 && (
                <section aria-labelledby="historico-gastos">
                  <h2 id="historico-gastos" className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900"><History size={16} /> Gastos passados</h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                    {painel.historico.map(gasto => <GastoCard key={gasto.id} gasto={gasto} encerrado onAbrir={() => setDetalheId(gasto.id)} />)}
                  </ul>
                </section>
              )}
            </div>

            <FormularioCriacao
              aberto={formAberto}
              nome={nome}
              descricao={descricao}
              valor={valor}
              busca={busca}
              selecionados={selecionados}
              resultadosBusca={resultadosBusca}
              buscaAtiva={busca.trim().length >= 2}
              buscandoUsuarios={usuariosQuery.isFetching}
              valorPrevia={valorPrevia}
              erro={erroFormulario || (criarMutation.isError ? mensagemErro(criarMutation.error) : '')}
              enviando={criarMutation.isPending}
              onNome={setNome}
              onDescricao={setDescricao}
              onValor={setValor}
              onBusca={setBusca}
              onAdicionar={adicionarParticipante}
              onRemover={id => setSelecionados(atual => atual.filter(usuario => usuario.id !== id))}
              onFechar={fecharFormulario}
              onSubmit={criarGasto}
            />
          </div>
        )}
      </main>

      <button
        type="button"
        aria-label="Criar gasto compartilhado"
        onClick={() => setFormAberto(true)}
        className={`fixed bottom-24 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 lg:hidden ${foco}`}
      >
        <Plus size={22} />
      </button>

      {detalhe && (
        <DetalheGasto
          gasto={detalhe}
          ocupada={pagamentoMutation.isPending || encerrarMutation.isPending}
          erro={pagamentoMutation.isError ? mensagemErro(pagamentoMutation.error) : encerrarMutation.isError ? mensagemErro(encerrarMutation.error) : ''}
          onFechar={() => setDetalheId(null)}
          onAlternarPagamento={() => pagamentoMutation.mutate({ gastoId: detalhe.id, pago: !detalhe.minhaCotaPaga })}
          onEncerrar={() => {
            if (window.confirm('Confirmar encerramento? Essa ação move o gasto para o histórico.')) encerrarMutation.mutate(detalhe.id)
          }}
        />
      )}
    </div>
  )
}

function UltimaDivisao({ gasto, onAbrir }: { gasto: GastoCompartilhado; onAbrir: () => void }) {
  return (
    <button type="button" onClick={onAbrir} className={`w-full rounded-2xl bg-white p-4 text-left shadow-sm hover:bg-neutral-50 lg:p-5 ${foco}`}>
      <p className="text-xs font-semibold text-emerald-600">Última divisão ativa</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div><h2 className="font-semibold text-neutral-900">{gasto.nome}</h2>{gasto.descricao && <p className="mt-1 text-sm text-neutral-500">{gasto.descricao}</p>}</div>
        <span className="text-sm font-bold text-neutral-900">{brl(gasto.valorTotal)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
        <AvatarStack participantes={gasto.participantes} />
        <span className="text-xs text-neutral-500">{brl(gasto.valorPorParticipante)} por pessoa</span>
      </div>
    </button>
  )
}

function GastoCard({ gasto, encerrado = false, onAbrir }: { gasto: GastoCompartilhado; encerrado?: boolean; onAbrir: () => void }) {
  const pagos = gasto.participantes.filter(participante => participante.pago).length
  return (
    <li>
      <button type="button" onClick={onAbrir} className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-colors hover:bg-neutral-50 ${foco}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${encerrado ? 'bg-neutral-100 text-neutral-500' : 'bg-emerald-50 text-emerald-600'}`}><CircleDollarSign size={21} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-900">{gasto.nome}</span>
          <span className="block text-xs text-neutral-500">{gasto.participantes.length} membros · {brl(gasto.valorPorParticipante)} por pessoa</span>
        </span>
        <span className="text-right">
          <span className={`block text-xs ${encerrado ? 'text-neutral-500' : 'text-emerald-600'}`}>{encerrado ? 'Encerrado' : `${pagos}/${gasto.participantes.length} pagos`}</span>
          <span className="block text-sm font-bold text-neutral-900">{brl(gasto.valorTotal)}</span>
        </span>
      </button>
    </li>
  )
}

function AvatarStack({ participantes }: { participantes: Participante[] }) {
  return <div className="flex -space-x-2">{participantes.slice(0, 5).map(participante => <span key={participante.id} title={participante.nome} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-semibold text-emerald-700">{participante.nome[0]?.toUpperCase()}</span>)}</div>
}

type FormularioProps = {
  aberto: boolean
  nome: string
  descricao: string
  valor: string
  busca: string
  selecionados: Usuario[]
  resultadosBusca: Usuario[]
  buscaAtiva: boolean
  buscandoUsuarios: boolean
  valorPrevia: number
  erro: string
  enviando: boolean
  onNome: (valor: string) => void
  onDescricao: (valor: string) => void
  onValor: (valor: string) => void
  onBusca: (valor: string) => void
  onAdicionar: (usuario: Usuario) => void
  onRemover: (id: string) => void
  onFechar: () => void
  onSubmit: (evento: FormEvent) => void
}

function FormularioCriacao(props: FormularioProps) {
  return (
    <div className={props.aberto ? 'fixed inset-0 z-[60] flex items-end bg-black/40 lg:static lg:block lg:bg-transparent' : 'hidden lg:block'} onClick={evento => { if (evento.target === evento.currentTarget) props.onFechar() }}>
      <form onSubmit={props.onSubmit} className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 lg:max-h-none lg:rounded-2xl lg:shadow-sm">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-neutral-900">Novo gasto compartilhado</h2><button type="button" aria-label="Fechar" onClick={props.onFechar} className={`rounded-full p-1 text-neutral-500 lg:hidden ${foco}`}><X size={20} /></button></div>
        <label className="block text-sm font-medium text-neutral-700">Nome do gasto<input className={`${campo} mt-1`} value={props.nome} onChange={evento => props.onNome(evento.target.value)} placeholder="Ex.: Mercado da semana" maxLength={120} /></label>
        <label className="block text-sm font-medium text-neutral-700">Descrição <span className="font-normal text-neutral-400">(opcional)</span><textarea className={`${campo} mt-1 min-h-20 resize-y`} value={props.descricao} onChange={evento => props.onDescricao(evento.target.value)} placeholder="Ex.: compras para a casa" maxLength={500} /></label>
        <label className="block text-sm font-medium text-neutral-700">Valor total<input className={`${campo} mt-1`} inputMode="decimal" value={props.valor} onChange={evento => props.onValor(evento.target.value)} placeholder="0,00" /></label>
        <div>
          <label htmlFor="buscar-participante" className="text-sm font-medium text-neutral-700">Participantes</label>
          <div className="relative mt-1"><Search className="pointer-events-none absolute left-3 top-3 text-neutral-400" size={17} /><input id="buscar-participante" className={`${campo} pl-9`} value={props.busca} onChange={evento => props.onBusca(evento.target.value)} placeholder="Busque por nome ou @slug" autoComplete="off" />
            {props.buscaAtiva && <div className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
              {props.buscandoUsuarios ? <p className="p-3 text-xs text-neutral-500">Buscando usuários…</p> : props.resultadosBusca.length === 0 ? <p className="p-3 text-xs text-neutral-500">Nenhum usuário encontrado.</p> : props.resultadosBusca.map(usuario => <button key={usuario.id} type="button" onClick={() => props.onAdicionar(usuario)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-emerald-50"><span><span className="block text-sm font-medium text-neutral-800">{usuario.nome}</span>{usuario.slug && <span className="block text-xs text-neutral-500">@{usuario.slug}</span>}</span><Plus size={16} className="text-emerald-600" /></button>)}</div>}
          </div>
          <ul className="mt-2 flex flex-wrap gap-2"><li className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">Você</li>{props.selecionados.map(usuario => <li key={usuario.id} className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{usuario.nome}<button type="button" aria-label={`Remover ${usuario.nome}`} onClick={() => props.onRemover(usuario.id)} className={`rounded-full ${foco}`}><X size={12} /></button></li>)}</ul>
        </div>
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{props.valorPrevia > 0 ? <><strong>{brl(props.valorPrevia)}</strong> por pessoa entre você e {props.selecionados.length} {props.selecionados.length === 1 ? 'participante' : 'participantes'}.</> : 'Informe o valor para ver a divisão igualitária.'}</p>
        {props.erro && <p role="alert" className="text-sm text-red-600">{props.erro}</p>}
        <button type="submit" disabled={props.enviando} className={`w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 ${foco}`}>{props.enviando ? 'Criando…' : 'Criar gasto e enviar convites'}</button>
      </form>
    </div>
  )
}

function DetalheGasto({ gasto, ocupada, erro, onFechar, onAlternarPagamento, onEncerrar }: { gasto: GastoCompartilhado; ocupada: boolean; erro: string; onFechar: () => void; onAlternarPagamento: () => void; onEncerrar: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-5" onClick={evento => { if (evento.target === evento.currentTarget) onFechar() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="detalhe-gasto-titulo" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-emerald-600">{gasto.status === 'ENCERRADO' ? 'Gasto encerrado' : 'Gasto ativo'}</p><h2 id="detalhe-gasto-titulo" className="mt-1 text-xl font-bold text-neutral-900">{gasto.nome}</h2>{gasto.descricao && <p className="mt-1 text-sm text-neutral-500">{gasto.descricao}</p>}</div><button type="button" onClick={onFechar} aria-label="Fechar detalhes" className={`rounded-full p-1 text-neutral-500 ${foco}`}><X size={22} /></button></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-neutral-100 p-3"><p className="text-xs text-neutral-500">Valor total</p><p className="mt-1 font-bold text-neutral-900">{brl(gasto.valorTotal)}</p></div><div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Por pessoa</p><p className="mt-1 font-bold text-emerald-800">{brl(gasto.valorPorParticipante)}</p></div></div>
      {gasto.convitesPendentes > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">A divisão inclui {gasto.convitesPendentes} {gasto.convitesPendentes === 1 ? 'convite pendente' : 'convites pendentes'}. Se alguém recusar, a cota será recalculada.</p>}
      <h3 className="mt-6 text-sm font-semibold text-neutral-900">Status de pagamento</h3><ul className="mt-2 divide-y divide-neutral-100 rounded-2xl border border-neutral-100 px-3">{gasto.participantes.map(participante => <li key={participante.id} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{participante.nome[0]?.toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">{participante.nome}</span>{participante.status === 'PENDENTE' ? <span className="text-xs font-semibold text-amber-700">Convite pendente</span> : participante.pago ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={16} /> Pago</span> : <span className="text-xs font-semibold text-neutral-500">Pendente</span>}</li>)}</ul>
      {erro && <p role="alert" className="mt-4 text-sm text-red-600">{erro}</p>}
      {gasto.podeMarcarPagamento && <button type="button" disabled={ocupada} onClick={onAlternarPagamento} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold disabled:opacity-60 ${gasto.minhaCotaPaga ? 'border-neutral-300 text-neutral-700' : 'border-emerald-500 bg-emerald-500 text-white'} ${foco}`}><Check size={18} />{gasto.minhaCotaPaga ? 'Desmarcar minha cota paga' : 'Marcar minha cota como paga'}</button>}
      {gasto.ehCriador && !gasto.podeEncerrar && gasto.status === 'ATIVO' && <p className="mt-4 text-center text-xs text-neutral-500">O encerramento será liberado quando todos aceitarem e marcarem suas cotas como pagas.</p>}
      {gasto.podeEncerrar && <button type="button" disabled={ocupada} onClick={onEncerrar} className={`mt-4 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60 ${foco}`}>Encerrar gasto</button>}
    </section>
  </div>
}
