import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calcularPlano, lerValorMeta, prazoValido } from '../src/lib/metas.ts'

test('aceita valores em reais com separador de milhar e preserva os centavos', () => {
  assert.equal(lerValorMeta('2.400,00'), 240_000)
  assert.equal(lerValorMeta('600.50'), 60_050)
  assert.equal(lerValorMeta('0,00'), 0)
  assert.equal(lerValorMeta(''), null)
  assert.equal(lerValorMeta('-1'), null)
  assert.equal(lerValorMeta('1,001'), null)
})

test('distribui o valor restante do mês atual até o mês do prazo', () => {
  const plano = calcularPlano(240_000, 60_000, '2027-04-30', '2026-11-08')
  assert.deepEqual(plano, { falta: 180_000, inicio: '2026-11', fim: '2027-04', depositos: 6, percentual: 25, mensal: 30_000 })
  assert.equal(calcularPlano(100, 0, '2027-01-01', '2026-11-08').mensal, 34)
  assert.equal(calcularPlano(100, 100, '2027-01-01', '2026-11-08').depositos, 0)
  assert.equal(calcularPlano(100, 0, '2026-11-08', '2026-11-08').depositos, 1)
})

test('rejeita prazos passados e datas inexistentes', () => {
  assert.equal(prazoValido('2026-11-07', '2026-11-08'), false)
  assert.equal(prazoValido('2027-02-29', '2026-11-08'), false)
  assert.equal(prazoValido('2028-02-29', '2026-11-08'), true)
})
