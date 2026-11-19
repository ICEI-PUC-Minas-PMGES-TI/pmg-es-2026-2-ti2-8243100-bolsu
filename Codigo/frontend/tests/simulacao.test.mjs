import { test } from 'node:test'
import assert from 'node:assert/strict'
import { centavos, dinheiro, mesAtual, mesesEntre } from '../src/lib/simulacao.ts'

// Intl usa espaço sem quebra entre "R$" e o valor; normaliza para comparar com clareza.
const normalizar = texto => texto.replace(/ /g, ' ')

test('centavos converte texto com vírgula ou ponto', () => {
  assert.equal(centavos('20'), 2000)
  assert.equal(centavos('20,5'), 2050)
  assert.equal(centavos('20.50'), 2050)
  assert.equal(centavos('0,99'), 99)
})
test('centavos evita erro de ponto flutuante', () => {
  assert.equal(centavos('1,15'), 115)
  assert.equal(centavos('0,07'), 7)
})
test('centavos rejeita entradas inválidas com zero', () => {
  assert.equal(centavos(''), 0)
  assert.equal(centavos('abc'), 0)
  assert.equal(centavos('-5'), 0)
  assert.equal(centavos('1,234'), 0)
  assert.equal(centavos('1,2,3'), 0)
})
test('dinheiro omite os centavos quando o valor é redondo', () => {
  assert.equal(normalizar(dinheiro(72000)), 'R$ 720')
  assert.equal(normalizar(dinheiro(2050)), 'R$ 20,50')
})
test('dinheiro separa milhares com ponto', () => {
  assert.equal(normalizar(dinheiro(123456)), 'R$ 1.234,56')
})
test('mesesEntre conta o mês inicial e o final', () => {
  assert.equal(mesesEntre('2026-11', '2026-11'), 1)
  assert.equal(mesesEntre('2026-11', '2027-02'), 4)
  assert.equal(mesesEntre('2026-01', '2026-12'), 12)
})
test('mesesEntre devolve 0 para fim anterior ao início ou inválido', () => {
  assert.equal(mesesEntre('2026-11', '2026-10'), 0)
  assert.equal(mesesEntre('2026-11', '2026-13'), 0)
  assert.equal(mesesEntre('2026-11', 'formatura'), 0)
  assert.equal(mesesEntre('2026-11', ''), 0)
})
test('mesAtual devolve AAAA-MM', () => {
  assert.match(mesAtual(), /^\d{4}-(0[1-9]|1[0-2])$/)
})
