import { centavos, mesesEntre } from './simulacao.ts'

export const LIMITE_META = 20_000_000_000

export type NovaMeta = {
  nome: string
  valorDesejado: number
  valorGuardado: number
  prazo: string
}

export type Meta = NovaMeta & { id: string }

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export const formatarMeta = (valor: number) => moeda.format(valor / 100)
export const formatarMes = (mes: string) => mesAno.format(new Date(`${mes}-01T00:00:00Z`))

export function lerValorMeta(texto: string): number | null {
  const valor = texto.trim()
  const agrupado = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(valor)
  const normalizado = agrupado ? valor.replaceAll('.', '') : valor
  if (!/^\d+(?:[.,]\d{0,2})?$/.test(normalizado)) return null
  const total = centavos(normalizado)
  return total <= LIMITE_META ? total : null
}

export function prazoValido(prazo: string, hoje: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo) || prazo < hoje) return false
  const data = new Date(`${prazo}T00:00:00Z`)
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === prazo
}

export function calcularPlano(desejado: number, guardado: number, prazo: string, hoje: string) {
  const falta = Math.max(0, desejado - guardado)
  const inicio = hoje.slice(0, 7)
  const fim = prazo.slice(0, 7)
  const depositos = falta > 0 && prazoValido(prazo, hoje) ? mesesEntre(inicio, fim) : 0
  return {
    falta, inicio, fim, depositos,
    percentual: Math.min(100, guardado / desejado * 100),
    mensal: depositos > 0 ? Math.ceil(falta / depositos) : 0,
  }
}
