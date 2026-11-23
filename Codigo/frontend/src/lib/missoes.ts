import { apiJson } from './api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type Missao = {
  id: string
  tipo: 'LANCHES' | 'GUARDAR' | 'TRANSPORTE'
  titulo: string
  descricao: string
  objetivo: number
  unidade: 'CENTAVOS' | 'DIAS'
  periodicidade: 'DIARIA' | 'SEMANAL' | 'UNICA'
  recompensaMoedas: number
}
export type Desafio = {
  missao: Missao
  periodo: string
  concluida: boolean
}

type PainelMissoes = {
  nivel: number
  estrelas: number
  moedas: number
  estrelasParaProximoNivel: number
  desafios: Desafio[]
}

const chaveMissoes = ['painel-missoes']

export function useMissoes() {
  return useQuery({
    queryKey: chaveMissoes,
    queryFn: ({ signal }) => apiJson<PainelMissoes>('/api/missoes/painel', { signal }),
    retry: false,
    refetchInterval: 60_000,
  })
}

export function useConcluirMissao() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: ({ missao, periodo }: Desafio) => apiJson<{ concluida: boolean }>(
      `/api/missoes/${encodeURIComponent(missao.id)}/conclusao?periodo=${encodeURIComponent(periodo)}`,
      { method: 'PUT' },
    ),
    onSuccess: () => cache.invalidateQueries({ queryKey: chaveMissoes }),
  })
}
