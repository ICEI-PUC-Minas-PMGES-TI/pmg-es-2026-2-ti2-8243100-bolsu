import { Link } from '@tanstack/react-router'
import { ChevronRight, Target } from 'lucide-react'

/** Atalho da tela inicial para as missões. */
export function MissoesLink() {
  return (
    <div>
      <Link
        to="/missoes"
        className="flex w-full items-center gap-3 rounded-3xl bg-card border border-border p-5 shadow-sm"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning"><Target size={22} /></span>
        <span className="flex-1">
          <strong className="block text-foreground">Missões</strong>
          <small className="text-muted-foreground">Pequenos desafios, grandes hábitos.</small>
        </span>
        <ChevronRight size={18} className="text-muted-foreground" />
      </Link>
    </div>
  )
}
