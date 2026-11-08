import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { apiJson, setSession } from '../lib/api'
import { useAuth, type UsuarioAtual } from '../lib/auth'
import { destinoLogin, fontesRenda, objetivos, validarSenha, type DadosFinanceiros } from '../lib/registration'
import '../auth.css'

function Icon({ name }: { name: string }) { return <img alt="" src={`/images/auth/${name}.svg`} /> }
function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="auth-field">{label}<input {...props} /></label>
}
function Password({ label, name, value, onChange, register }: { label: string; name: string; value: string; onChange: (value: string) => void; register: boolean }) {
  const [visible, setVisible] = useState(false)
  return <label className="auth-field">{label}<span className="auth-password"><input name={name} type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} required /><button type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" /></button></span>{register && name === 'senha' && <small>Mínimo 8 caracteres com letras e números</small>}</label>
}

export function AuthForm({ register = false, next = '/inicio' }: { register?: boolean; next?: string }) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)
  const busy = useRef(false)
  const initialized = useRef(false)
  const created = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const [basic, setBasic] = useState({ nomeCompleto: '', email: '', celular: '', senha: '', confirmacao: '' })
  const [academic, setAcademic] = useState({ instituicao: '', campus: '', curso: '', semestre: '' })
  const [sources, setSources] = useState<string[]>([])
  const [income, setIncome] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const config = register && step >= 3
  const basicChange = (key: keyof typeof basic) => (value: string) => setBasic(old => ({ ...old, [key]: value }))
  const changeStep = (value: number) => { setError(''); setStep(value) }

  useEffect(() => { setReady(true) }, [])

  useEffect(() => {
    if (!register || auth.loading || initialized.current) return
    initialized.current = true
    if (auth.user) setStep(auth.user.dadosFinanceiros ? 7 : 3)
  }, [register, auth.loading, auth.user])
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0) }, [step])

  async function login() {
    const result = await apiJson<{ token: string }>('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: basic.email.trim(), senha: basic.senha }),
    }, false)
    if (!result.token) throw new Error('A API não retornou uma sessão válida.')
    setSession(result.token)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    setError('')
    if (register && step === 0) {
      const message = validarSenha(basic.senha, basic.confirmacao)
      if (!basic.nomeCompleto.trim()) { setError('Informe seu nome completo.'); return }
      if (message) { setError(message); return }
      changeStep(1); return
    }
    if (register && step === 1 && Object.values(academic).some(value => !value.trim())) {
      setError('Preencha os dados acadêmicos.'); return
    }
    if (register && [2, 3, 4, 5].includes(step)) {
      if (step === 5 && (income.trim() === '' || !Number.isFinite(Number(income)) || Number(income) < 0)) { setError('Informe uma renda mensal válida, inclusive zero.'); return }
      changeStep(step + 1); return
    }
    if (register && step === 6 && goals.length === 0) { setError('Selecione ao menos um objetivo.'); return }
    busy.current = true
    setPending(true)
    try {
      if (!register) {
        await login()
        const user = await apiJson<UsuarioAtual>('/users/current')
        await navigate({ to: user.dadosFinanceiros ? destinoLogin(next) : '/cadastro', replace: true })
      } else if (step === 1) {
        if (!created.current) {
          await apiJson('/users', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeCompleto: basic.nomeCompleto.trim(), email: basic.email.trim(), senha: basic.senha, celular: basic.celular.trim() || null,
              dadosAcademicos: { ...academic, instituicao: academic.instituicao.trim(), campus: academic.campus.trim(), curso: academic.curso.trim(), semestre: Number(academic.semestre) } }),
          }, false)
          created.current = true
        }
        await login()
        setBasic(old => ({ ...old, senha: '', confirmacao: '' }))
        changeStep(2)
      } else if (step === 6) {
        const data: DadosFinanceiros = { faixaRendaMensal: Number(income), fontesRenda: sources, objetivos: goals }
        await apiJson('/users/current/registration-configs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        auth.retry()
        changeStep(7)
      } else if (step === 7) await navigate({ to: '/inicio', replace: true })
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível concluir. Tente novamente.'
      setError(created.current && step === 1 ? `Sua conta foi criada, mas não foi possível entrar. Tente novamente ou entre pela tela de login. ${message}` : message)
    } finally { busy.current = false; setPending(false) }
  }

  if (register && auth.loading && !initialized.current) return <main className="auth-shell"><p role="status">Verificando sua sessão…</p></main>
  const titles = ['Crie sua conta', 'Conta mais sobre você', 'Conta criada!', 'Seu dinheiro não precisa ser muito para fazer diferença.', 'De onde vem sua grana?', 'Quanto você recebe, em média, por mês?', 'O que você quer conquistar?', 'Bora cuidar dessa grana?']
  const descriptions: Record<number, string> = { 0: 'Comece a sua jornada de controle financeiro hoje.', 1: 'Queremos entender seu perfil acadêmico para te ajudar melhor.', 2: 'Bem-vindo(a) ao Bolsu! Vamos configurar suas finanças para você mandar muito bem.', 3: 'Aprenda a fazer seu dinheiro durar mais durante a faculdade.', 5: 'Vale de bicos a bolsa de iniciação.', 7: 'Tudo pronto para você dominar suas finanças de um jeito simples.' }
  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(item => item !== value) : [...values, value]
  return <main className={`auth-shell ${config ? 'auth-config' : ''}`}>
    <form method="post" onSubmit={submit} className={`auth-screen ${!register ? 'auth-login' : ''}`}>
      {register && <div className="auth-progress" role="progressbar" aria-label={config ? 'Configuração financeira' : 'Criar conta'} aria-valuemin={0} aria-valuemax={config ? 5 : 3} aria-valuenow={config ? step - 2 : step + 1}>{Array.from({ length: config ? 5 : 3 }, (_, index) => <span key={index} className={index <= (config ? step - 3 : step) ? 'complete' : ''} />)}</div>}
      <fieldset disabled={pending || !ready} className={`auth-body ${step === 7 ? 'auth-ready' : ''} ${register && [2, 3, 7].includes(step) ? 'auth-center' : ''}`}>
        {!register ? <div className="auth-logo"><span><Icon name="wallet" /></span><h1 ref={heading} tabIndex={-1}>Bolsu</h1></div> : <>
          {[2, 3, 7].includes(step) && <div className={`auth-illustration illustration-${step}`}><Icon name={step === 2 ? 'check' : step === 3 ? 'intro' : 'ready'} /></div>}
          <div><h1 ref={heading} tabIndex={-1}>{titles[step]}</h1>{descriptions[step] && <p className="auth-description">{descriptions[step]}</p>}</div>
        </>}
        {(!register || step === 0) && <>
          {register && <Field label="Nome completo" name="nomeCompleto" autoComplete="name" maxLength={120} required value={basic.nomeCompleto} onChange={e => basicChange('nomeCompleto')(e.target.value)} />}
          <Field label="E-mail universitário" name="email" type="email" autoComplete="email" required value={basic.email} onChange={e => basicChange('email')(e.target.value)} />
          {register && <Field label="Celular (opcional)" name="celular" type="tel" autoComplete="tel" maxLength={20} value={basic.celular} onChange={e => basicChange('celular')(e.target.value)} />}
          <Password label="Senha" name="senha" value={basic.senha} onChange={basicChange('senha')} register={register} />
          {register && <Password label="Confirmar senha" name="confirmacao" value={basic.confirmacao} onChange={basicChange('confirmacao')} register />}
        </>}
        {register && step === 1 && <>
          {([['instituicao', 'Nome da faculdade'], ['campus', 'Campus'], ['curso', 'Curso']] as const).map(([key, label]) => <Field key={key} name={key} label={label} required maxLength={150} value={academic[key]} onChange={e => setAcademic(old => ({ ...old, [key]: e.target.value }))} />)}
          <Field label="Período / Semestre" name="semestre" type="number" min={1} step={1} required value={academic.semestre} onChange={e => setAcademic(old => ({ ...old, semestre: e.target.value }))} />
        </>}
        {register && step === 4 && <div className="auth-options" role="group" aria-label="Fontes de renda">{fontesRenda.map(source => <button type="button" key={source} aria-pressed={sources.includes(source)} onClick={() => setSources(toggle(sources, source))}>{source}</button>)}<p className="auth-hint">Selecione todas as opções que se aplicam. Se ainda não tem renda, continue sem selecionar.</p></div>}
        {register && step === 5 && <label className="auth-income">R$<input aria-label="Renda mensal em reais" name="renda" type="number" inputMode="decimal" min={0} step="0.01" required placeholder="0" value={income} onChange={e => setIncome(e.target.value)} /></label>}
        {register && step === 6 && <div className="auth-options auth-chips" role="group" aria-label="Objetivos financeiros">{objetivos.map(goal => <button type="button" key={goal} aria-pressed={goals.includes(goal)} onClick={() => setGoals(toggle(goals, goal))}>{goal}</button>)}</div>}
      </fieldset>
      <footer className="auth-footer">
        {error && <p role="alert" className="auth-error">{error}</p>}
        <div className="auth-actions">
          {register && (step === 1 && !created.current || step >= 4 && step <= 6) && <button className="auth-back" type="button" aria-label="Voltar à etapa anterior" disabled={pending} onClick={() => changeStep(step - 1)}><Icon name="back" /></button>}
          <button className="auth-primary" disabled={pending || !ready}>{pending ? 'Aguarde…' : !register ? 'Entrar' : step === 2 ? 'Começar configuração' : step === 7 ? 'Começar minha jornada' : 'Continuar'}{register && step !== 7 && <Icon name={config ? 'continue' : 'next'} />}</button>
        </div>
        {(!register || step <= 1) && <p className="auth-link">{register ? <Link to="/login" search={{ next: '/inicio' }}>Já tenho uma conta</Link> : <>Não tem conta? <Link to="/cadastro">Cadastre-se</Link></>}</p>}
        {register && step >= 3 && step < 7 && !auth.user && !auth.loading && <Link to="/login" search={{ next: '/cadastro' }}>Sua sessão expirou. Entrar novamente</Link>}
      </footer>
    </form>
  </main>
}
