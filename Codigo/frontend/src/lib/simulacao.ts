export const dinheiro = (centavos: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: centavos % 100 === 0 ? 0 : 2,
}).format(centavos / 100)

export function centavos(texto: string): number {
  if (!/^\d+(?:[.,]\d{0,2})?$/.test(texto)) return 0
  return Math.round(Number(texto.replace(',', '.')) * 100)
}

export function mesesEntre(inicio: string, fim: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(fim)) return 0
  const [ai, mi] = inicio.split('-').map(Number)
  const [af, mf] = fim.split('-').map(Number)
  return Math.max(0, (af - ai) * 12 + mf - mi + 1)
}

export function mesAtual() {
  return dataAtual().slice(0, 7)
}

export function dataAtual() {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(p => p.type === tipo)!.value
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

/** Valores usados quando o usuário ainda não escolheu nada: R$ 20 por mês, formatura daqui a 2 anos. */
export const VALOR_PADRAO_CENTAVOS = 2000
export const ANOS_PADRAO_ATE_FORMATURA = 2
/** Referência de preço para traduzir a economia em almoços no RU. */
export const PRECO_ALMOCO_RU_CENTAVOS = 1000

/** Mês de formatura sugerido (mesmo mês, {@link ANOS_PADRAO_ATE_FORMATURA} anos depois), no formato AAAA-MM. */
export function mesPadraoDeFormatura(inicio: string): string {
  return `${Number(inicio.slice(0, 4)) + ANOS_PADRAO_ATE_FORMATURA}-${inicio.slice(5, 7)}`
}

/**
 * Projeção de guardar `mensal` centavos por mês de `inicio` até `fim` (AAAA-MM), contando os dois meses.
 * Valor mensal inválido ou período vazio resultam em zero.
 */
export function projecao(mensal: number, inicio: string, fim: string) {
  const meses = mesesEntre(inicio, fim)
  const total = mensal > 0 ? mensal * meses : 0
  return { meses, total, almocos: Math.floor(total / PRECO_ALMOCO_RU_CENTAVOS) }
}
