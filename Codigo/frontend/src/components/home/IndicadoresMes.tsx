import { Link } from '@tanstack/react-router'
import type { ResumoMensal } from '../../lib/resumo'
import { reais } from '../../lib/resumo-mes'

/** Três indicadores do mês: entradas, despesas e orçamento restante (ou convite para defini-lo). */
export function IndicadoresMes({ dados }: { dados: ResumoMensal }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3">Como está seu mês?</h3>
      <div className="flex gap-3">
        <Indicador cor="bg-success" titulo="Entradas" valor={reais(dados.entradas)} />
        <Indicador cor="bg-warning" titulo="Despesas" valor={reais(dados.despesas)} />
        {dados.orcamento ? (
          <Indicador cor={dados.orcamento.restante < 0 ? 'bg-red-500' : 'bg-blue-500'} titulo="Orçamento restante"
            valor={reais(dados.orcamento.restante)} />
        ) : (
          <Link to="/orcamento" className="flex flex-1 flex-col rounded-2xl bg-card border border-dashed border-border p-3 shadow-sm">
            <div className="mb-2 h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">Orçamento</span>
            <span className="text-sm font-bold mt-1 text-foreground leading-tight">Defina seus limites</span>
          </Link>
        )}
      </div>
    </div>
  )
}

function Indicador({ cor, titulo, valor }: { cor: string; titulo: string; valor: string }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border p-3 shadow-sm">
      <div className={`mb-2 h-3 w-3 rounded-full ${cor}`} />
      <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
      <span className="text-sm font-bold mt-1 text-foreground leading-tight">{valor}</span>
    </div>
  )
}
