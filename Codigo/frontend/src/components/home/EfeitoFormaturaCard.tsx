import { Link } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'

/** Chamada para a simulação do Efeito Formatura. */
export function EfeitoFormaturaCard() {
  return (
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
          to="/efeito-formatura"
          className="w-full inline-block text-center rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition-transform active:scale-95"
        >
          Simular meu futuro
        </Link>
      </div>
    </div>
  )
}
