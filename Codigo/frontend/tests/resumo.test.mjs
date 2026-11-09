import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deslocarMes, mesValido, percentual, textoVariacaoSemanal, tituloDoMes } from '../src/lib/resumo-mes.ts'

test('deslocarMes atravessa virada de ano nos dois sentidos', () => {
  assert.equal(deslocarMes('2026-11', 1), '2026-12')
  assert.equal(deslocarMes('2026-12', 1), '2027-01')
  assert.equal(deslocarMes('2026-01', -1), '2025-12')
  assert.equal(deslocarMes('2026-03', -14), '2025-01')
})
test('deslocarMes mantém valores inválidos', () => {
  assert.equal(deslocarMes('novembro', 1), 'novembro')
  assert.equal(deslocarMes('2026-13', 1), '2026-13')
})
test('mesValido aceita apenas AAAA-MM', () => {
  assert.equal(mesValido('2026-11'), true)
  assert.equal(mesValido('2026-00'), false)
  assert.equal(mesValido('26-11'), false)
})
test('tituloDoMes escreve o mês por extenso', () => {
  assert.equal(tituloDoMes('2026-03'), 'Março de 2026')
  assert.equal(tituloDoMes('xx'), 'xx')
})
test('percentual limita entre 0 e 100 e tolera total zero', () => {
  assert.equal(percentual(50, 200), 25)
  assert.equal(percentual(300, 200), 100)
  assert.equal(percentual(-5, 200), 0)
  assert.equal(percentual(10, 0), 0)
  assert.equal(percentual(Number.NaN, 100), 0)
})
test('textoVariacaoSemanal descreve queda, alta, igualdade e ausência de base', () => {
  assert.match(textoVariacaoSemanal(-40), /40% menos/)
  assert.match(textoVariacaoSemanal(12.5), /12,5% mais/)
  assert.match(textoVariacaoSemanal(0), /iguais/)
  assert.equal(textoVariacaoSemanal(null), '')
})
