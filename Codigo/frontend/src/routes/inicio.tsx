import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { useResumo } from '../lib/resumo'
import { mesAtual } from '../lib/simulacao'
import { EfeitoFormaturaCard } from '../components/home/EfeitoFormaturaCard'
import { IndicadoresMes } from '../components/home/IndicadoresMes'
import { MissoesLink } from '../components/home/MissoesLink'
import { SaldoCard } from '../components/home/SaldoCard'
import { SeletorDeMes } from '../components/home/SeletorDeMes'
import { TopCategorias } from '../components/home/TopCategorias'
import '@/styles.css'

export const Route = createFileRoute('/inicio')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const nome = user?.nomeCompleto.split(' ')[0] || 'Você'
  const atual = mesAtual()
  const [mes, setMes] = useState(atual)
  const resumo = useResumo(mes)

  return (
    <div className="dashboard-entry flex flex-col gap-6 p-6 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Oi, {nome} 👋
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Sua visão geral do mês</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
          {nome.charAt(0)}
        </div>
      </header>

      <SeletorDeMes mes={mes} atual={atual} onChange={setMes} />

      {resumo.isPending ? (
        <div role="status" className="rounded-3xl bg-card border border-border p-6 text-sm text-muted-foreground">
          Carregando seu resumo…
        </div>
      ) : resumo.isError ? (
        <div role="alert" className="rounded-3xl bg-card border border-border p-6">
          <p className="text-sm font-semibold text-foreground">{resumo.error.message}</p>
          <button type="button" onClick={() => { void resumo.refetch() }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground">
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <SaldoCard dados={resumo.data} mesAtual={mes === atual} />
          <IndicadoresMes dados={resumo.data} />
          <TopCategorias categorias={resumo.data.categorias} />
        </>
      )}

      <MissoesLink />
      <EfeitoFormaturaCard />
    </div>
  )
}
