import { apiFetch } from './api'
import { useQuery } from '@tanstack/react-query'

export type Missao = {
  id: string
  tipo: 'LANCHES' | 'GUARDAR' | 'TRANSPORTE'
  titulo: string
  descricao: string
  objetivo: number
  unidade: 'CENTAVOS' | 'DIAS'
  periodicidade: 'SEMANAL' | 'UNICA'
  recompensaMoedas: number
}



async function buscarMissoes(): Promise<Missao[]> {
  let response: Response
  try { response = await apiFetch(`/api/missoes`) }
  catch { throw new Error('Não foi possível conectar. Confira sua conexão e tente novamente.') }
  if (!response.ok) throw new Error('Não foi possível carregar as missões. Tente novamente em instantes.')
  const dados = await response.json()
  if (!Array.isArray(dados)) throw new Error('Não foi possível carregar as missões. Tente novamente em instantes.')
  return dados
}

export function useMissoes() {
  return useQuery({ queryKey: ['catalogo-missoes'], queryFn: buscarMissoes, retry: false })
}
