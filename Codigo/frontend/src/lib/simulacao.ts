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
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date())
  return `${partes.find(p => p.type === 'year')!.value}-${partes.find(p => p.type === 'month')!.value}`
}
