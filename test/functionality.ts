import test from 'ava'

import { Router } from '../src/router'

test('should find route with wildcard', async t => {
  const router = new Router()

  router.all('*', async () => 'yup')

  const route = router.match('http://example.com', 'GET')
  t.true(route instanceof Object)
  t.deepEqual(route && route.url, new URL('http://example.com'))
})

test('should find route with path', async t => {
  const router = new Router()

  router.all('/foo', async () => 'yup')

  const route = router.match('http://example.com/foo', 'GET')
  t.true(route instanceof Object)
  t.deepEqual(route && route.url, new URL('http://example.com/foo'))
})

test('should find route with path params', async t => {
  const router = new Router()

  router.all('/foo/:userid', async () => 'yup')

  const route = router.match('http://example.com/foo/12', 'GET')
  t.true(route instanceof Object)
  t.deepEqual(route && route.params && route.params.userid, '12')

  const route2 = router.match('http://example2.com/foo/12', 'GET')
  t.true(route2 instanceof Object)
  t.deepEqual(route2 && route2.params && route2.params.userid, '12')

  const route3 = router.match('http://example2.com/foofoo/12', 'GET')
  t.is(route3, null)
})

test('should find route with full url', async t => {
  const router = new Router()

  router.delete(
    '(http(s)\\://)npm.runkit.com/url-pattern/api/users(/:id)',
    async () => 'yup',
    { matchUrl: true }
  )

  const route1 = router.match(
    'https://npm.runkit.com/url-pattern/api/users/20',
    'DELETE'
  )
  t.true(route1 instanceof Object)
  t.deepEqual(route1 && route1.params && route1.params.id, '20')

  const route2 = router.match(
    'https://npm.runkit.com/url-pattern/api/users/20',
    'POST'
  )
  t.is(route2, null)
})

test('should not find route', async t => {
  const router = new Router()

  router.all('/foo', async () => 'yup')
  router.all('/foo2', async () => 'yup')
  router.patch('/foo3', async () => 'yup')
  router.get('/foo4', async () => 'yup')
  router.get('/foo5', async () => 'yup')

  const route = router.match(
    'https://npm.runkit.com/url-pattern/api/users/20',
    'GET'
  )
  t.is(route, null)
})
