import { Link } from '@tanstack/react-router'
import { ATALHOS_MOBILE } from '../../lib/atalhos'

export { ATALHOS_MOBILE }

/**
 * Atalhos rápidos para telas que estão no menu desktop mas não cabem na barra de navegação mobile/tablet.
 * Exibido apenas em telas menores que desktop (lg:hidden), posicionado na página inicial
 * entre o container de saldo ("Dinheiro disponível") e a seção "Como está seu mês?".
 */
export function AtalhosMobile() {
  return (
    <section aria-label="Atalhos rápidos" className="lg:hidden">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ATALHOS_MOBILE.map(atalho => {
          const Icon = atalho.icon
          return (
            <Link
              key={atalho.to}
              to={atalho.to}
              className="flex min-h-[58px] items-center gap-3 rounded-2xl bg-card border border-border p-3 shadow-sm transition-all hover:bg-muted/50 active:scale-[0.98]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Icon size={22} />
              </span>
              <span className="text-sm font-semibold text-foreground leading-tight">
                {atalho.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
