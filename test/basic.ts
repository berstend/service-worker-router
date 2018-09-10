import test from 'ava'

import { Router } from '../src/index'

test('is class', t => {
  t.is(typeof Router, 'function')
})

test('should have the basic class members', async t => {
  const instance = new Router()

  t.true(instance.all instanceof Function)
  t.true(instance.get instanceof Function)
  t.true(instance.post instanceof Function)
  t.true(instance.put instanceof Function)
  t.true(instance.patch instanceof Function)
  t.true(instance.delete instanceof Function)
  t.true(instance.head instanceof Function)
  t.true(instance.options instanceof Function)

  t.true(instance.findRoute instanceof Function)
  t.true(instance.findRouteForRequest instanceof Function)
  t.true(instance.handleRequest instanceof Function)
  t.true(instance.watch instanceof Function)
  t.true(instance.clear instanceof Function)
})
