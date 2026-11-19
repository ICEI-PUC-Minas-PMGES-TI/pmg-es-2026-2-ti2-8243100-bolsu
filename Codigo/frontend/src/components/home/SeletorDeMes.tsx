import { ChevronLeft, ChevronRight } from 'lucide-react'
import { deslocarMes, tituloDoMes } from '../../lib/resumo-mes'

/** Navegação entre meses (AAAA-MM). Não permite avançar além do mês atual. */
export function SeletorDeMes({ mes, atual, onChange }: { mes: string; atual: string; onChange: (mes: string) => void }) {
  return (
    <div role="group" aria-label="Escolher mês" className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-1.5">
      <button type="button" aria-label="Mês anterior" onClick={() => onChange(deslocarMes(mes, -1))}
        className="rounded-xl p-2 text-foreground hover:bg-muted"><ChevronLeft size={20} /></button>
      <span className="text-sm font-bold text-foreground" aria-live="polite">{tituloDoMes(mes)}</span>
      <button type="button" aria-label="Próximo mês" onClick={() => onChange(deslocarMes(mes, 1))}
        disabled={mes >= atual}
        className="rounded-xl p-2 text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={20} /></button>
    </div>
  )
}
