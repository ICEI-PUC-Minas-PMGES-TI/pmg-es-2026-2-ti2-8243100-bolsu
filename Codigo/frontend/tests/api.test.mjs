import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { apiFetch, apiJson, sessionToken, setSession, SESSION_EVENT } from '../src/lib/api.ts'

const originalFetch = globalThis.fetch
beforeEach(() => {
  const data = new Map()
  const events = new EventTarget()
  globalThis.window = {
    sessionStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) },
    dispatchEvent: event => events.dispatchEvent(event),
    addEventListener: (...args) => events.addEventListener(...args),
  }
})
afterEach(() => { delete globalThis.window; globalThis.fetch = originalFetch })

test('SSR não acessa armazenamento do navegador', () => {
  delete globalThis.window
  assert.equal(sessionToken(), null)
})
test('acrescenta Bearer e preserva os cabeçalhos da chamada', async () => {
  setSession('token-a')
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'http://localhost:8080/gastos')
    assert.equal(init.headers.get('Authorization'), 'Bearer token-a')
    assert.equal(init.headers.get('Content-Type'), 'application/json')
    return new Response('{}')
  }
  await apiFetch('/gastos', { headers: { 'Content-Type': 'application/json' } })
})
test('login público não envia token nem encerra sessão por credenciais inválidas', async () => {
  setSession('token-a')
  globalThis.fetch = async (_, init) => {
    assert.equal(init.headers.has('Authorization'), false)
    return new Response('{}', { status: 401 })
  }
  await apiFetch('/auth/login', {}, false)
  assert.equal(sessionToken(), 'token-a')
})
test('401 protegido limpa a sessão e emite evento para limpar o cache', async () => {
  setSession('token-a')
  let count = 0
  window.addEventListener(SESSION_EVENT, () => count++)
  globalThis.fetch = async () => new Response('{}', { status: 401 })
  await apiFetch('/gastos')
  assert.equal(sessionToken(), null)
  assert.equal(count, 1)
})
test('401 atrasado de outra sessão não desconecta a nova conta', async () => {
  setSession('token-a')
  let resolve
  globalThis.fetch = () => new Promise(done => { resolve = done })
  const request = apiFetch('/gastos')
  setSession('token-b')
  resolve(new Response('{}', { status: 401 }))
  await request
  assert.equal(sessionToken(), 'token-b')
})
test('apiJson devolve o corpo JSON em respostas de sucesso', async () => {
  globalThis.fetch = async () => new Response('{"total":42}')
  assert.deepEqual(await apiJson('/gastos/resumo'), { total: 42 })
})
test('apiJson usa o campo detail quando não há message', async () => {
  globalThis.fetch = async () => new Response('{"detail":"Dados inválidos"}', { status: 400 })
  await assert.rejects(apiJson('/gastos'), /Dados inválidos/)
})
test('apiJson mostra o status quando o corpo de erro não é JSON', async () => {
  globalThis.fetch = async () => new Response('<html>erro</html>', { status: 502 })
  await assert.rejects(apiJson('/gastos'), /\(502\)/)
})
test('setSession(null) remove o token e emite o evento', () => {
  setSession('token-a')
  let count = 0
  window.addEventListener(SESSION_EVENT, () => count++)
  setSession(null)
  assert.equal(sessionToken(), null)
  assert.equal(count, 1)
})
test('sem sessão a requisição não envia Authorization', async () => {
  globalThis.fetch = async (_, init) => {
    assert.equal(init.headers.has('Authorization'), false)
    return new Response('{}')
  }
  await apiFetch('/gastos')
})
test('erro da API é exibido sem apagar sessão em um erro de autorização', async () => {
  setSession('token-a')
  globalThis.fetch = async () => new Response('{"message":"Acesso negado"}', { status: 403 })
  await assert.rejects(apiJson('/users/outro'), /Acesso negado/)
  assert.equal(sessionToken(), 'token-a')
})
