import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './api'

export type ResumoMensal = {
  mes: string
  entradas: number
  /** true quando as entradas vêm da renda informada no cadastro (ainda não há entradas registradas) */
  entradasEstimadas: boolean
  despesas: number
  saldo: number
  /** null quando o usuário não definiu orçamento */
  orcamento: { limite: number; consumido: number; restante: number } | null
  categorias: { nome: string; valor: number }[]
  diasRestantes: number
  gastoDiarioPermitido: number
  /** variação % das despesas dos últimos 7 dias frente aos 7 anteriores; null sem base */
  variacaoSemanal: number | null
}

async function buscarResumo(mes: string): Promise<ResumoMensal> {
  let response: Response
  try { response = await apiFetch(`/resumo?mes=${encodeURIComponent(mes)}`) }
  catch { throw new Error('Não foi possível conectar. Confira sua conexão e tente novamente.') }
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}))
    throw new Error(corpo.message || 'Não foi possível carregar seu resumo. Tente novamente em instantes.')
  }
  return response.json()
}

// A chave começa com 'gastos' para que registrar/excluir um gasto (que invalida ['gastos'])
// também atualize a visão geral.
export function useResumo(mes: string) {
  return useQuery({ queryKey: ['gastos', 'resumo-mensal', mes], queryFn: () => buscarResumo(mes), retry: false })
}
