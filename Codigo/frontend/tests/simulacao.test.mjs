import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ANOS_PADRAO_ATE_FORMATURA, PRECO_ALMOCO_RU_CENTAVOS, VALOR_PADRAO_CENTAVOS,
  centavos, dinheiro, mesAtual, mesPadraoDeFormatura, mesesEntre, projecao,
} from '../src/lib/simulacao.ts'

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

test('mesPadraoDeFormatura soma os anos padrão mantendo o mês', () => {
  assert.equal(mesPadraoDeFormatura('2026-11'), `${2026 + ANOS_PADRAO_ATE_FORMATURA}-11`)
  assert.equal(mesPadraoDeFormatura('2026-01'), `${2026 + ANOS_PADRAO_ATE_FORMATURA}-01`)
})
test('projecao conta o mês inicial e o da formatura', () => {
  const { meses, total } = projecao(2000, '2026-11', '2028-11')
  assert.equal(meses, 25)
  assert.equal(total, 50000)
})
test('projecao traduz o total em almoços no RU', () => {
  assert.equal(projecao(2000, '2026-11', '2028-11').almocos, 50000 / PRECO_ALMOCO_RU_CENTAVOS)
  assert.equal(projecao(1500, '2026-11', '2026-11').almocos, 1)
})
test('projecao com valor inválido ou período vazio resulta em zero', () => {
  assert.deepEqual(projecao(0, '2026-11', '2028-11'), { meses: 25, total: 0, almocos: 0 })
  assert.deepEqual(projecao(-500, '2026-11', '2028-11'), { meses: 25, total: 0, almocos: 0 })
  assert.deepEqual(projecao(2000, '2026-11', '2026-10'), { meses: 0, total: 0, almocos: 0 })
})
test('a simulação padrão (R$ 20 por 2 anos) rende R$ 500 e 50 almoços', () => {
  const p = projecao(VALOR_PADRAO_CENTAVOS, '2026-11', mesPadraoDeFormatura('2026-11'))
  assert.equal(normalizar(dinheiro(p.total)), 'R$ 500')
  assert.equal(p.almocos, 50)
})
