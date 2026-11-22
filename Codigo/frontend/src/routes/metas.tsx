import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Flag } from 'lucide-react'
import { BolsuLayout } from '../components/bolsu-layout'
import { apiJson } from '../lib/api'
import { calcularPlano, formatarMes, formatarMeta, lerValorMeta, LIMITE_META, prazoValido, type Meta, type NovaMeta } from '../lib/metas'
import { dataAtual } from '../lib/simulacao'

type PreviaFormatura = { total?: number; prazo?: string }

export const Route = createFileRoute('/metas')({
  validateSearch: (search: Record<string, unknown>): PreviaFormatura => ({
    total: typeof search.total === 'number' && Number.isSafeInteger(search.total)
      && search.total > 0 && search.total <= LIMITE_META ? search.total : undefined,
    prazo: typeof search.prazo === 'string' ? search.prazo : undefined,
  }),
  component: MetasPage,
  head: () => ({ meta: [{ title: 'Metas | BolsU' }] }),
})

function MetasPage() {
  const previa = Route.useSearch()
  const hoje = dataAtual()
  const [editando, setEditando] = useState<Meta | null>(null)
  return <BolsuLayout>
    <div className="metas-page">
      <header className="metas-header">
        <Link to="/inicio" aria-label="Voltar ao início"><ChevronLeft size={22} /></Link>
        <h1>{editando ? 'Editar meta' : 'Nova meta'}</h1>
        <a className="metas-atalho" href="#minhas-metas">Minhas metas</a>
      </header>
      <FormularioMeta key={`${editando?.id}-${previa.total}-${previa.prazo}`} previa={previa} hoje={hoje} meta={editando} cancelar={() => setEditando(null)} />
      <ListaMetas hoje={hoje} editar={setEditando} />
    </div>
  </BolsuLayout>
}
function FormularioMeta({ previa, hoje, meta, cancelar }: { previa: PreviaFormatura; hoje: string; meta: Meta | null; cancelar: () => void }) {
  const cache = useQueryClient()
  const [nome, setNome] = useState(meta?.nome ?? (previa.total ? 'Minha formatura' : ''))
  const [desejado, setDesejado] = useState(meta ? (meta.valorDesejado / 100).toFixed(2).replace('.', ',') : previa.total ? (previa.total / 100).toFixed(2).replace('.', ',') : '')
  const [guardado, setGuardado] = useState(meta ? (meta.valorGuardado / 100).toFixed(2).replace('.', ',') : '0,00')
  const [prazo, setPrazo] = useState(meta?.prazo ?? (previa.prazo && prazoValido(previa.prazo, hoje) ? previa.prazo : ''))
  const [salva, setSalva] = useState('')
  const salvar = useMutation({
    mutationFn: (dados: NovaMeta) => apiJson<Meta>(meta ? `/api/metas/${encodeURIComponent(meta.id)}` : '/api/metas', {
      method: meta ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados),
    }),
    onSuccess: () => { void cache.invalidateQueries({ queryKey: ['metas'] }) },
  })
  const valorDesejado = lerValorMeta(desejado)
  const valorGuardado = lerValorMeta(guardado)
  const valoresValidos = valorDesejado !== null && valorDesejado > 0
    && valorGuardado !== null && valorGuardado <= valorDesejado
  const plano = valoresValidos ? calcularPlano(valorDesejado, valorGuardado, prazo, hoje) : null
  const dataValida = prazoValido(prazo, hoje)
  const prazoPermitido = dataValida || prazo === meta?.prazo
  const nomeInput = useRef<HTMLInputElement>(null)
  useEffect(() => { if (meta) nomeInput.current?.focus() }, [meta])

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valoresValidos || !prazoPermitido || !nome.trim() || salvar.isPending) return
    setSalva('')
    try {
      const resultado = await salvar.mutateAsync({ nome: nome.trim(), valorDesejado, valorGuardado, prazo })
      setSalva(resultado.nome)
      if (meta) return
      setNome('')
      setDesejado('')
      setGuardado('0,00')
      setPrazo('')
    } catch {
    }
  }

  return <form className="meta-form" onSubmit={cadastrar} aria-labelledby="monte-plano">
    <fieldset className="meta-fields" disabled={salvar.isPending}>
      <h2 id="monte-plano">{meta ? 'Atualize seu plano' : 'Monte seu plano'}</h2>
      <p>Crie metas financeiras para guardar dinheiro de forma mais eficiente para seu futuro.</p>
      <label>Nome da meta
        <span className="meta-input"><Flag size={18} aria-hidden="true" /><input ref={nomeInput} required maxLength={80} placeholder="Ex.: Trocar de notebook" value={nome} onChange={e => setNome(e.target.value)} /></span>
      </label>
      <div className="meta-valores">
        <label>Valor desejado
          <span className="meta-input"><span aria-hidden="true">R$</span><input required inputMode="decimal" maxLength={20} placeholder="2.400,00" value={desejado} onChange={e => setDesejado(e.target.value)} /></span>
        </label>
        <label>Valor já guardado
          <span className="meta-input"><span aria-hidden="true">R$</span><input required inputMode="decimal" maxLength={20} value={guardado} onChange={e => setGuardado(e.target.value)} /></span>
        </label>
      </div>
      {desejado && !valoresValidos && <p className="error-message">Informe um valor desejado positivo de até {formatarMeta(LIMITE_META)} e um valor guardado entre zero e o valor desejado.</p>}
      <label>Até quando quer realizar?
        <span className="meta-input"><input type="date" required min={meta && meta.prazo < hoje ? meta.prazo : hoje} max="9999-12-31" value={prazo} onChange={e => setPrazo(e.target.value)} aria-describedby="meta-prazo-ajuda" /></span>
      </label>
      <p id="meta-prazo-ajuda" className={prazo && !prazoPermitido ? 'error-message' : 'fine-print'}>
        {prazo && !prazoPermitido ? 'Escolha uma data válida a partir de hoje.' : 'Escolha uma data para planejar seus depósitos.'}
      </p>
    </fieldset>

    <section className="meta-plano" aria-labelledby="meta-plano-titulo">
      <h2 id="meta-plano-titulo"> Seu plano para chegar lá</h2>
      {plano ? <>
        <p className="meta-mensal"><strong>{dataValida ? formatarMeta(plano.mensal) : '—'}</strong> por mês</p>
        <p className="meta-depositos">{!dataValida ? 'Informe o prazo para calcular seus depósitos.'
          : plano.depositos === 0 ? 'Você já tem o valor da meta.'
          : `${plano.depositos} ${plano.depositos === 1 ? 'depósito' : 'depósitos'} · de ${formatarMes(plano.inicio)} a ${formatarMes(plano.fim)}`}</p>
        <ProgressoMeta plano={plano} />
      </> : <p className="meta-depositos">Preencha os valores para ver a prévia da sua meta.</p>}
    </section>

    <div className="meta-acoes">
      <button className="primary-button" disabled={!nome.trim() || !valoresValidos || !prazoPermitido || salvar.isPending}>
        {salvar.isPending ? 'Salvando…' : meta ? 'Salvar alterações' : 'Cadastrar meta'}
      </button>
      {meta && <button type="button" className="secondary-button" disabled={salvar.isPending} onClick={cancelar}>Cancelar edição</button>}
      {salvar.error && <p className="error-message" role="alert">{salvar.error.message}</p>}
      {salva ? <p className="meta-sucesso" role="status">Meta “{salva}” {meta ? 'atualizada' : 'cadastrada'} com sucesso.</p>
        : <p className="fine-print">Acompanhe seus planos em Minhas metas.</p>}
    </div>
  </form>
}

function ProgressoMeta({ plano }: { plano: ReturnType<typeof calcularPlano> }) {
  const percentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(plano.percentual)
  return <>
    <div className="meta-progresso"><span>Faltam {formatarMeta(plano.falta)}</span><strong>{percentual}% guardado</strong></div>
    <progress max={100} value={plano.percentual} aria-label="Percentual guardado" />
  </>
}

function ListaMetas({ hoje, editar }: { hoje: string; editar: (meta: Meta) => void }) {
  const query = useQuery({
    queryKey: ['metas'], queryFn: ({ signal }) => apiJson<Meta[]>('/api/metas', { signal }), retry: false,
  })
  return <section id="minhas-metas" className="metas-lista" aria-labelledby="minhas-metas-titulo">
    <h2 id="minhas-metas-titulo">Minhas metas</h2>
    {query.isPending ? <div className="query-state" role="status"><span className="loading-dot" /><p>Carregando suas metas…</p></div>
      : query.isError ? <div className="query-state" role="alert">
        <h3>Não conseguimos carregar suas metas</h3><p>{query.error.message}</p>
        <button className="secondary-button" onClick={() => void query.refetch()}>Tentar novamente</button>
      </div>
      : query.data.length === 0 ? <div className="query-state"><Flag size={30} /><p>Você ainda não tem metas cadastradas.</p></div>
      : <ul>{query.data.map(meta => <li key={meta.id} className="meta-card">
        <h3>{meta.nome}</h3>
        <button type="button" className="secondary-button" onClick={() => editar(meta)} aria-label={`Editar meta ${meta.nome}`}>Editar meta</button>
        <p>{formatarMeta(meta.valorGuardado)} de {formatarMeta(meta.valorDesejado)} · Até {meta.prazo.split('-').reverse().join('/')}</p>
        <ProgressoMeta plano={calcularPlano(meta.valorDesejado, meta.valorGuardado, meta.prazo, hoje)} />
      </li>)}</ul>}
  </section>
}

