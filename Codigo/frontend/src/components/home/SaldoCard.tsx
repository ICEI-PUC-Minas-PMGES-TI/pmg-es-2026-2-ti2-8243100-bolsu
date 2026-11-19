import type { ResumoMensal } from '../../lib/resumo'
import { percentual, reais, textoVariacaoSemanal } from '../../lib/resumo-mes'

/** Cartão principal da visão geral: saldo do mês, gasto diário permitido e progresso das despesas. */
export function SaldoCard({ dados, mesAtual }: { dados: ResumoMensal; mesAtual: boolean }) {
  const negativo = dados.saldo < 0
  const progressoGasto = percentual(dados.despesas, dados.entradas)
  const variacao = mesAtual ? textoVariacaoSemanal(dados.variacaoSemanal) : ''

  return (
    <div
      className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30"
    >
      <p className="text-sm font-medium text-primary-foreground/80 mb-1">
        {negativo ? 'Saldo do mês' : 'Dinheiro disponível'}
      </p>
      <h2 className="text-4xl font-extrabold tracking-tighter mb-1">{reais(dados.saldo)}</h2>
      {mesAtual && dados.diasRestantes > 0 && (
        <p className="text-sm font-medium text-primary-foreground/90 mb-4">
          para os próximos {dados.diasRestantes} {dados.diasRestantes === 1 ? 'dia' : 'dias'}
        </p>
      )}
      {mesAtual && dados.gastoDiarioPermitido > 0 && (
        <div className="mb-4 inline-flex rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          💰 {reais(dados.gastoDiarioPermitido)} por dia
        </div>
      )}
      {negativo && (
        <p className="text-sm font-semibold mb-4">Você gastou mais do que entrou neste mês.</p>
      )}

      {dados.entradas > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-primary-foreground/80">
            <span>{reais(dados.despesas)} gastos</span>
            <span>de {reais(dados.entradas)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/20"
            role="progressbar" aria-label="Despesas sobre as entradas do mês"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressoGasto)}>
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressoGasto}%` }} />
          </div>
          {variacao && <p className="text-xs font-medium mt-2">{variacao}</p>}
        </div>
      ) : (
        <p className="text-xs font-medium text-primary-foreground/90">
          Ainda não há entradas para este mês. {reais(dados.despesas)} em gastos.
        </p>
      )}
      {dados.entradasEstimadas && (
        <p className="mt-3 text-[11px] text-primary-foreground/70">
          Entradas estimadas pela renda informada no seu cadastro.
        </p>
      )}
    </div>
  )
}
