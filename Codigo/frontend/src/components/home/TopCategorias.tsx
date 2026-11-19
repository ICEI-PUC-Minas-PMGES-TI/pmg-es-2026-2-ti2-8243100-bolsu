import { Link } from '@tanstack/react-router'
import type { ResumoMensal } from '../../lib/resumo'
import { percentual, reais } from '../../lib/resumo-mes'

const QUANTIDADE_EXIBIDA = 3

/** "Onde você mais gastou": as categorias de maior despesa do mês, ou um convite para registrar o primeiro gasto. */
export function TopCategorias({ categorias }: { categorias: ResumoMensal['categorias'] }) {
  const principais = categorias.slice(0, QUANTIDADE_EXIBIDA)
  const maiorCategoria = principais[0]?.valor ?? 0

  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-sm">
      <h3 className="font-bold text-foreground mb-3">Onde você mais gastou</h3>
      {principais.length === 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">Nenhum gasto registrado neste mês.</p>
          <Link to="/cadastro-gasto"
            className="flex w-full items-center justify-center rounded-xl bg-muted py-2.5 text-sm font-semibold text-foreground">
            Registrar um gasto
          </Link>
        </>
      ) : (
        <ul className="space-y-3" aria-label="Categorias com maior despesa no mês">
          {principais.map(c => (
            <li key={c.nome}>
              <div className="flex justify-between text-sm font-semibold text-foreground">
                <span>{c.nome}</span><span>{reais(c.valor)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percentual(c.valor, maiorCategoria)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
