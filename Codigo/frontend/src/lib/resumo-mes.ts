// Helpers puros da visão geral (sem dependências, testáveis em Node).

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const MES_VALIDO = /^(\d{4})-(0[1-9]|1[0-2])$/

export function mesValido(mes: string): boolean {
  return MES_VALIDO.test(mes)
}

/** Soma (ou subtrai) meses de um "AAAA-MM". Retorna o próprio valor se for inválido. */
export function deslocarMes(mes: string, delta: number): string {
  const m = MES_VALIDO.exec(mes)
  if (!m) return mes
  const indice = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta
  const ano = Math.floor(indice / 12)
  const numero = (indice % 12) + 1
  return `${String(ano).padStart(4, '0')}-${String(numero).padStart(2, '0')}`
}

/** "2026-11" -> "Novembro de 2026". */
export function tituloDoMes(mes: string): string {
  const m = MES_VALIDO.exec(mes)
  return m ? `${NOMES_MESES[Number(m[2]) - 1]} de ${m[1]}` : mes
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Valor em reais (como a API devolve) -> "R$ 1.234,56". */
export const reais = (valor: number) => moeda.format(valor)

/** Percentual de `parte` sobre `total`, limitado a 0..100. Total zero/inválido -> 0. */
export function percentual(parte: number, total: number): number {
  if (!(total > 0) || !Number.isFinite(parte)) return 0
  return Math.min(100, Math.max(0, (parte / total) * 100))
}

/** Frase sobre a variação das despesas frente à semana anterior; vazio se não houver base. */
export function textoVariacaoSemanal(variacao: number | null): string {
  if (variacao === null || !Number.isFinite(variacao)) return ''
  const abs = Math.abs(variacao).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (variacao < 0) return `Você gastou ${abs}% menos que na semana anterior 📉`
  if (variacao > 0) return `Você gastou ${abs}% mais que na semana anterior 📈`
  return 'Seus gastos ficaram iguais aos da semana anterior'
}
