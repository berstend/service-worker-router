require('isomorphic-fetch') // Polyfill for Response
import 'node-fetch' // Polyfill fetch for fetchMock

import test from 'ava'
const fetchMock = require('fetch-mock')
import makeServiceWorkerEnv from 'service-worker-mock'

// Typings are bit skewed, this makes it easier to define a Promise[] response later
interface ServiceWorkerGlobalScopeMock extends ServiceWorkerGlobalScope {
  listeners: any
  trigger: any
  snapshot: any
}
declare const self: ServiceWorkerGlobalScopeMock

test.beforeEach(t => {
  // Make sure we work with a pristine service worker
  delete require.cache[require.resolve('./fixtures/sw')]
  Object.assign(global, makeServiceWorkerEnv(), {
    fetch: fetchMock.sandbox()
  })
  require('./fixtures/sw')
})

test('has working service worker mock', async t => {
  t.is(self instanceof ServiceWorkerGlobalScope, true)
})

test('is able to extract params', async t => {
  const request = new Request('/user/bob')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(typeof response, 'object')
  t.true(response instanceof Response)
  t.is(response.status, 200)
  t.is(await response.text(), 'Hello user with id bob.')
  t.is(response.headers.get('non-existing'), null)
  t.is(response.headers.get('x-user-id'), 'bob')
})

test('will match all handler with GET request', async t => {
  const request = new Request('/_ping')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.true(response instanceof Response)
  t.is(response.status, 200)
  t.is(await response.text(), 'pong')
})

test('will match get handler with POST request', async t => {
  const request = new Request('/_ping', { method: 'POST' })
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(typeof response, 'object')
  t.true(response instanceof Response)
  t.is(response.status, 200)
  t.is(await response.text(), 'post pong')
})

test('will not match if no route fits', async t => {
  const request = new Request('/nonexisting')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(response, undefined)
})

test('will match a full URL', async t => {
  const request = new Request('https://api.foobar.com/hello')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(typeof response, 'object')
  t.true(response instanceof Response)
  t.is(response.status, 201)
  t.is(await response.text(), 'foobar')
})

test('will not match a full URL if domain wrong', async t => {
  const request = new Request('https://api.foobar2.com/hello')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(response, undefined)
})

test('will throw if a route throws', async t => {
  const request = new Request('/throw')

  try {
    await self.trigger('fetch', request)
    t.true(false)
  } catch (err) {
    t.is(err.message, 'Nope!')
    t.true(true)
  }
})

test('will have context', async t => {
  const request = new Request('/info')
  const [response] = (await self.trigger('fetch', request)) as Response[]

  t.is(typeof response, 'object')
  t.true(response instanceof Response)
  t.is(response.status, 200)
  t.is(await response.text(), 'Important info: 42.')
})
