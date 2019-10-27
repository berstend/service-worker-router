// Add 'webworker' to the lib property in your tsconfig.json
// also: https://github.com/Microsoft/TypeScript/issues/14877
declare const self: ServiceWorkerGlobalScope

import { HandlerContext, Router } from '../../src/router'

interface RequestContext {
  importantInfo: number
}

interface Context extends HandlerContext {
  ctx: RequestContext
}

// Instantiate a new router
const router = new Router()

// Define user handler
const user = async ({ request, params }: HandlerContext): Promise<Response> => {
  const headers = new Headers({ 'x-user-id': params.id })
  const response = new Response(`Hello user with id ${params.id}.`, { headers })
  return response
}

const info = async ({ ctx }: Context): Promise<Response> => {
  const response = new Response(`Important info: ${ctx.importantInfo}.`)
  return response
}

// Define minimal ping handler
const postPing = async () => new Response('post pong')
const ping = async () => new Response('pong')
const foobar = async () => new Response('foobar', { status: 201 })

// Define routes and their handlers
router.get('/user/:id', user)
router.post('/_ping', postPing)
router.all('/_ping', ping)
router.all('/info', info)
router.get('(http(s)\\://)api.foobar.com/hello', foobar, {
  matchUrl: true
})
router.all('/throw', async () => {
  throw new Error('Nope!')
})

router.ctx = {
  importantInfo: 42
} as RequestContext

// Set up service worker event listener
self.addEventListener('fetch', (event: FetchEvent) => {
  // Will test event.request against the defined routes
  // and use event.respondWith(handler) when a route matches
  router.handleEvent(event)
})
