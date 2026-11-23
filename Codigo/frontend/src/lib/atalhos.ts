import { ChartPie, PlusCircle, Users, Wallet } from 'lucide-react'

export const ATALHOS_MOBILE = [
  { to: '/gastos', label: 'Gastos', icon: Wallet },
  { to: '/cadastro-gasto', label: 'Registrar gasto', icon: PlusCircle },
  { to: '/orcamento', label: 'Orçamento', icon: ChartPie },
  { to: '/gastos_compartilhados', label: 'Compartilhados', icon: Users },
] as const
