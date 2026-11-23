import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarSenha, destinoLogin } from '../src/lib/registration.ts'

test('valida senha e confirmação antes de criar conta', () => {
  assert.ok(validarSenha('12345678', '12345678'))
  assert.ok(validarSenha('abcdefgh', 'abcdefgh'))
  assert.ok(validarSenha('Senha1234', 'Senha1235'))
  assert.ok(validarSenha('á'.repeat(36) + '1', 'á'.repeat(36) + '1'))
  assert.equal(validarSenha('Senha1234', 'Senha1234'), '')
})
test('preserva destino local e impede redirecionamento externo ou loop de login', () => {
  assert.equal(destinoLogin('/gastos'), '/gastos')
  for (const path of ['//evil.test', '/\\evil.test', 'https://evil.test', '/login?next=/login', '/cadastro#etapa']) assert.equal(destinoLogin(path), '/inicio')
})
