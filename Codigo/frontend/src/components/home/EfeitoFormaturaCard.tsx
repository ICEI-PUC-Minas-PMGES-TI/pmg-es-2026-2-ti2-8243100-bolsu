import { Link } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'
import { VALOR_PADRAO_CENTAVOS, dinheiro, mesPadraoDeFormatura, projecao } from '../../lib/simulacao'

/**
 * Chamada para a simulação do Efeito Formatura. Usa a mesma simulação padrão da tela
 * (valor e prazo iniciais), então os números do card batem com os que o usuário vê ao abri-la.
 *
 * @param inicio mês atual, no formato AAAA-MM
 */
export function EfeitoFormaturaCard({ inicio }: { inicio: string }) {
  const { total, almocos } = projecao(VALOR_PADRAO_CENTAVOS, inicio, mesPadraoDeFormatura(inicio))

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 to-purple-600 p-5 text-white shadow-sm"
    >
      <div className="absolute -right-4 -top-4 opacity-20" aria-hidden="true">
        <GraduationCap size={100} />
      </div>
      <div className="relative z-10">
        <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
          Efeito Formatura <span aria-hidden="true">🎓</span>
        </span>
        <h3 className="text-lg font-bold mb-1 leading-tight">
          E se você guardasse {dinheiro(VALOR_PADRAO_CENTAVOS)} por mês?
        </h3>
        <p className="text-white text-sm font-medium mb-4">
          {dinheiro(VALOR_PADRAO_CENTAVOS)}/mês ➔ <span className="text-white font-bold">{dinheiro(total)}</span> até a formatura
        </p>
        <div className="mb-4 rounded-xl bg-black/20 p-3 backdrop-blur-sm">
          <p className="text-xs font-medium">
            Isso pode pagar cerca de {almocos} almoços no RU.
          </p>
        </div>
        <Link
          to="/efeito-formatura"
          className="w-full inline-block text-center rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition-transform active:scale-95"
        >
          Simular meu futuro
        </Link>
      </div>
    </div>
  )
}
