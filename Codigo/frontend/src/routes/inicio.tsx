import { useAuth } from '../lib/auth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, GraduationCap } from "lucide-react"
import '@/styles.css'

export const Route = createFileRoute('/inicio')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const userData = {
    usuario: {
      nome: user?.nomeCompleto.split(' ')[0] || 'Você',
      mensagemDesempenho: "Resumo demonstrativo — valores de exemplo",
    },
    resumoFinanceiro: {
      saldoDisponivel: 187.40,
      diasRestantes: 12,
      gastoDiarioPermitido: 15.62,
      gastoAtual: 312.00,
      limiteTotal: 500.00,
      percentualComparacaoSemanaAnterior: -8,
    },
    resumoSemanal: {
      orcamentoDisponivel: 187.00,
      missoesConcluidas: 3,
      missoesTotais: 5,
      economiaGuardada: 24.00,
    },
    missaoDestaque: {
      titulo: "Sobreviva à semana",
      descricao: "Gaste no máximo R$ 40 com lanches até domingo.",
      recompensaXP: 50,
      progressoAtual: 18.00,
      progressoAlvo: 40.00,
    }
  }

  const progressoOrcamento = (userData.resumoFinanceiro.gastoAtual / userData.resumoFinanceiro.limiteTotal) * 100
  const progressoMissao = (userData.missaoDestaque.progressoAtual / userData.missaoDestaque.progressoAlvo) * 100

  return (
    <div className="dashboard-entry page-dashboard flex flex-col gap-6 p-6 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Oi, {userData.usuario.nome} 👋
          </h1>
          <p className="text-sm font-medium text-success">
            {userData.usuario.mensagemDesempenho}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
          {userData.usuario.nome.charAt(0)}
        </div>
      </header>

      <div
        className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        
        <p className="text-sm font-medium text-primary-foreground/80 mb-1">
          Dinheiro disponível
        </p>
        <div className="flex items-end gap-2 mb-1">
          <h2 className="text-4xl font-extrabold tracking-tighter">
            R$ {userData.resumoFinanceiro.saldoDisponivel.toFixed(2).replace('.', ',')}
          </h2>
        </div>
        <p className="text-sm font-medium text-primary-foreground/90 mb-6">
          para os próximos {userData.resumoFinanceiro.diasRestantes} dias
        </p>
        
        <div className="mb-6 inline-flex rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          💰 R$ {userData.resumoFinanceiro.gastoDiarioPermitido.toFixed(2).replace('.', ',')} por dia
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-primary-foreground/80">
            <span>R$ {userData.resumoFinanceiro.gastoAtual} gastos</span>
            <span>de R$ {userData.resumoFinanceiro.limiteTotal}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
            <div 
              className="h-full rounded-full bg-white transition-all duration-500" 
              style={{ width: `${progressoOrcamento}%` }}
            />
          </div>
          <p className="text-xs font-medium mt-2">
            Você gastou {Math.abs(userData.resumoFinanceiro.percentualComparacaoSemanaAnterior)}% menos que na semana passada 📉
          </p>
        </div>
      </div>

      <div
      >
        <h3 className="text-lg font-bold mb-3">Como está sua semana?</h3>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border p-3 shadow-sm">
            <div className="mb-2 h-3 w-3 rounded-full bg-success" />
            <span className="text-xs font-medium text-muted-foreground">Orçamento</span>
            <span className="text-sm font-bold mt-1 text-foreground leading-tight">
              R$ {userData.resumoSemanal.orcamentoDisponivel}<br />disponíveis
            </span>
          </div>
          <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border p-3 shadow-sm">
            <div className="mb-2 h-3 w-3 rounded-full bg-warning" />
            <span className="text-xs font-medium text-muted-foreground">Missão</span>
            <span className="text-sm font-bold mt-1 text-foreground leading-tight">
              {userData.resumoSemanal.missoesConcluidas}/{userData.resumoSemanal.missoesTotais} dias<br />concluídos
            </span>
          </div>
          <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border p-3 shadow-sm">
            <div className="mb-2 h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">Economia</span>
            <span className="text-sm font-bold mt-1 text-foreground leading-tight">
              R$ {userData.resumoSemanal.economiaGuardada}<br />guardados
            </span>
          </div>
        </div>
      </div>

      <div
        className="rounded-3xl bg-card border border-border p-5 shadow-sm"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h3 className="font-bold text-foreground">{userData.missaoDestaque.titulo}</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent-foreground">
            +{userData.missaoDestaque.recompensaXP} <span className="text-[10px]">🪙</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {userData.missaoDestaque.descricao}
        </p>
        
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-bold text-foreground">
            <span>R$ {userData.missaoDestaque.progressoAtual}</span>
            <span className="text-muted-foreground">/ R$ {userData.missaoDestaque.progressoAlvo}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full rounded-full bg-warning transition-all duration-500" 
              style={{ width: `${progressoMissao}%` }} 
            />
          </div>
        </div>

        <Link
          to={"/missoes" as any}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors"
        >
          Ver missão <ChevronRight size={16} />
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-sm"
      >
        <div className="absolute -right-4 -top-4 opacity-20">
          <GraduationCap size={100} />
        </div>
        <div className="relative z-10">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
            Efeito Formatura 🎓
          </span>
          <h3 className="text-lg font-bold mb-1 leading-tight">
            E se você guardasse R$ 20 por mês?
          </h3>
          <p className="text-indigo-100 text-sm font-medium mb-4">
            R$ 20/mês ➔ <span className="text-white font-bold">R$ 720</span> até a formatura
          </p>
          <div className="mb-4 rounded-xl bg-black/20 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium">
              Isso pode pagar cerca de 72 almoços no RU.
            </p>
          </div>
          <Link
            to={"/efeito-formatura" as any}
            className="w-full inline-block text-center rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition-transform active:scale-95"
          >
            Simular meu futuro
          </Link>
        </div>
      </div>
    </div>
  )
}