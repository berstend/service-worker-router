# Please note :sparkle:
Although this router works fine I [made a new one](https://github.com/berstend/tiny-request-router), based on experiences using it in production with Cloudflare Workers.

[`tiny-request-router`](https://github.com/berstend/tiny-request-router) is even smaller, even less opinionated and more flexible to use. It also uses [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) instead of `url-pattern`, as I found it more intuitive to use. I'd recommend using the new router for new projects.

---


# service-worker-router [![ ](https://travis-ci.org/berstend/service-worker-router.svg?branch=master)](https://travis-ci.org/berstend/service-worker-router) [![ ](https://img.shields.io/npm/v/service-worker-router.svg)](https://www.npmjs.com/package/service-worker-router)

> An elegant and fast URL router for service workers (and standalone use)


## Yet another router? 😄

I was unable to find a modern router with the following features:

- **Framework agnostic** and [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) support
  - Most routers are intertwined with a specific web server or framework, this one is agnostic and can be used everywhere (Node.js, browsers, workers). See the [standalone](#example-standalone) example.
  - The router is used in production with [Cloudflare Workers].
- **TypeScript** (and JavaScript) **support**
  - Even when not using TypeScript there's the benefit of better code editor tooling (improved IntelliSense) for the developer.
- **Match the path or the full URL**
  - Most routers only support matching a `/path`, with service workers it's sometimes necessary to use the full URL as well.
- **Elegant pattern matching**
  - Life's too short to debug regexes. :-)
- Also: Lightweight (**8KB**, ~100 LOC), tested, supports [tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) and [ES modules](https://developers.google.com/web/fundamentals/primers/modules)

## Installation

```bash
yarn add service-worker-router
# or
npm install --save service-worker-router
```

## Usage

```typescript
// TypeScript
import { Router, HandlerContext } from 'service-worker-router'

// Modern JavaScript, Babel, Webpack, Rollup, etc.
import { Router } from 'service-worker-router'

// Legacy JavaScript and Node.js
const { Router } = require('service-worker-router')

// Inside a web/service worker
importScripts('https://unpkg.com/service-worker-router')
const Router = self.ServiceWorkerRouter.Router

// HTML: Using ES modules
<script type="module">
  import { Router } from 'https://unpkg.com/service-worker-router/dist/router.browser.mjs';
</script>

// HTML: Oldschool
<script src="https://unpkg.com/service-worker-router"></script>
var Router = window.ServiceWorkerRouter.Router
```

#### `URL` polyfill

The router is making use of the WHATWG [URL] object. If your environment is **Node < v8 or IE** (see [compat](https://caniuse.com/#feat=url)) you need to polyfill it before requiring/importing the router. By using [polyfill.io](https://polyfill.io/v2/docs/features/#URL) the shim will only be loaded if the browser needs it.

```typescript
// Add URL polyfill in Node.js < 8
// npm i --save universal-url
require('universal-url').shim()

// Add URL polyfill in workers
importScripts('https://cdn.polyfill.io/v2/polyfill.min.js?features=URL')

// Add URL polyfill in HTML scripts
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=URL"></script>
```

## Example (service worker)

### JavaScript

```js
// Instantiate a new router
const router = new Router()

// Define user handler
const user = async ({ request, params }) => {
  const headers = new Headers({ 'x-user-id': params.id })
  const response = new Response(`Hello user with id ${params.id}.`, { headers })
  return response
}

// Define minimal ping handler
const ping = async () => new Response('pong')

// Define routes and their handlers
router.get('/user/:id', user)
router.all('/_ping', ping)

// Set up service worker event listener
addEventListener('fetch', event => {
  // Will test event.request against the defined routes
  // and use event.respondWith(handler) when a route matches
  router.handleEvent(event)
})
```

### TypeScript

Same as the above but with optional types:

```typescript
// Add 'webworker' to the lib property in your tsconfig.json
// also: https://github.com/Microsoft/TypeScript/issues/14877
declare const self: ServiceWorkerGlobalScope

// Instantiate a new router
const router = new Router()

// Define user handler
const user = async ({ request, params }: HandlerContext): Promise<Response> => {
  const headers = new Headers({ 'x-user-id': params.id })
  const response = new Response(`Hello user with id ${params.id}.`, { headers })
  return response
}

// Define minimal ping handler
const ping = async () => new Response('pong')

// Define routes and their handlers
router.get('/user/:id', user)
router.all('/_ping', ping)

// Set up service worker event listener
// To resolve 'FetchEvent' add 'webworker' to the lib property in your tsconfig.json
self.addEventListener('fetch', (event: FetchEvent) => {
  // Will test event.request against the defined routes
  // and use event.respondWith(handler) when a route matches
  router.handleEvent(event)
})
```

## Example (standalone)

This router can be used on it's own using `router.match`, service worker usage is optional.

```js
const router = new Router()

const user = async () => `Hey there!`
router.get('/user/:name', user)

router.match('/user/bob', 'GET')
// => { params: { name: 'bob' }, handler: [AsyncFunction: user],  url...
```

## Patterns

The router is using the excellent [`url-pattern`](https://github.com/snd/url-pattern) module (it's sole dependency).

Patterns can have optional segments and wildcards.

A route pattern can be a string or a UrlPattern instance, for greater flexibility and optional regex support.

#### Examples

```js
// will match everything
router.all('*', handler)

// `id` value will be available in `params` in handler
router.all('/api/users/:id', handler)

// will only match exact path
router.all('/api/foo/', handler)

// will match longer paths as well
router.all('/api/foo/*', handler)

// will match with wildcard in between
router.all('/admin/*/user/*/tail', handler)

// use UrlPattern instance
router.all(new UrlPattern('/api/posts(/:id)'), handler)
```

### URL matching

By default the router will only match against the `/path` of a URL. To test against a full URL just add `{ matchUrl: true }` when adding a route.

#### Examples

```js
// test against full url, not only path
router.post('(http(s)\\://)api.example.com/users(/:id)', handler, {
  matchUrl: true
})

// test against full url and extract segments
router.get('(http(s)\\://)(:subdomain.):domain.:tld(/*)', handler, {
  matchUrl: true
})

router.match('http://mail.google.com/mail', 'GET')
// => { params: {subdomain: 'mail', domain: 'google', tld: 'com', _: 'mail'}, handler: [AsyncFunction], ...
```

Refer to the [`url-pattern`](https://github.com/snd/url-pattern) documentation and [it's tests](https://github.com/snd/url-pattern/blob/master/test/match-fixtures.coffee) for more information and examples regarding pattern matching.

## HTTP methods

To add a route, simply use one of the following methods. `router.all` will match any HTTP method.

- **router.all**(pattern, handler, options)
- **router.get**(pattern, handler, options)
- **router.post**(pattern, handler, options)
- **router.put**(pattern, handler, options)
- **router.patch**(pattern, handler, options)
- **router.delete**(pattern, handler, options)
- **router.head**(pattern, handler, options)
- **router.options**(pattern, handler, options)

The function signature is as follows:

```
pattern: string | UrlPattern
handler: HandlerFunction
options: RouteOptions = {}
```

The `RouteOptions` object is optional and can contain `{ matchUrl: boolean }`.

All methods will return the router instance, for optional chaining.

### Handler function

The handler function for a route is expected to be an `async` function (or `Promise`).

```js
// See the HandlerContext interface below for all available params
const handler = async ({ request, params }) => {
  return new Response('Hello')
}
```

When used in a service worker context the handler **must** return a [Response] object, if the route matches.

When used in conjunction with helper methods like `router.handleRequest` and `router.handleEvent` the handler function will be called automatically with an object, containing the following signature:

```typescript
interface HandlerContext {
  params: any | null
  handler: HandlerFunction
  url: URL
  method: string
  route: Route
  request?: Request
  event?: FetchEvent
  ctx: any
}
```

## API

### Match

#### router.match(`url: URL | string, method: string`): `MatchResult | null`

Matches a supplied URL and HTTP method against the registered routes. `url` can be a string (path or full URL) or [URL] instance.

```js
router.get('/user/:id', handler)

router.match('/user/1337', 'GET')
// => { params: { id: '1337' }, handler: [AsyncFunction: handler],  url...
```

The return value is a `MatchResult` object or `null` if no matching route was found.

```typescript
interface MatchResult {
  params: any | null
  handler: HandlerFunction
  url: URL
  method: string
  route: Route
  request?: Request
  event?: FetchEvent
  ctx: any
}
```

#### router.matchRequest(`request: Request`): `MatchResult | null`

Will match a [Request] object (e.g. `event.request`) against the registered routes. Will return `null` or a `MatchResult` object.

```js
addEventListener('fetch', event => {
  const match = router.matchRequest(event.request)
  console.log(match)
  // => { params: { user: 'bob' }, handler: [AsyncFunction: handler], ...
})
```

#### router.matchEvent(`event: FetchEvent`): `MatchResult | null`

Will match a [FetchEvent] object (e.g. `event`) against the registered routes. Will return `null` or a `MatchResult` object.

```js
addEventListener('fetch', event => {
  const match = router.matchEvent(event)
  console.log(match)
  // => { params: { user: 'bob' }, handler: [AsyncFunction: handler], ...
})
```

### Handle

#### router.handle(`url: URL | string, method: string`): `HandleResult | null`

Will match a string or [URL] instance against the registered routes and call it's handler function automatically (with `HandlerContext`).

```js
const result = router.handle('/user/bob', 'GET')
```

Will return `null` or the matched route and handler promise as `HandleResult`:

```typescript
interface HandleResult {
  match: MatchResult
  handlerPromise: HandlerPromise
}
```

#### router.handleRequest(`request: Request`): `HandleResult | null`

Will match a [FetchEvent] object against the registered routes and call it's handler function automatically (with `HandlerContext`).

```js
addEventListener('fetch', event => {
  const result = router.handleRequest(event.request)
  if (result) {
    event.respondWith(result.handlerPromise)
  } else {
    console.log('No route matched.')
  }
})
```

Will return `null` or the matched route and handler promise as `HandleResult`.

#### router.handleEvent(`event: FetchEvent`): `HandleResult | null`

Will match a [FetchEvent] object against the registered routes. If a route matches it's handler will be called automatically and passed to `event.respondWith(handler)`. If no route matches nothing happens. :-)

```js
addEventListener('fetch', event => {
  router.handleEvent(event)
})
```

Will return `null` or the matched route and handler promise as `HandleResult`.

### Context (Since `v1.7.5`)

You can optionally add a context (`router.ctx = { foobar: 123 }`) to the router, which will be passed on to the handlers as part of `HandlerContext`. An example (also how to do this type safe) can be found in [the test fixture](./test/fixtures/sw.ts).

## Limitations

- No middleware support
  - In service workers one needs to respond with a definitive [Response] object (when responding to a fetch event), so this paradigm doesn't really fit here.

## Examples
* [Error and NotFound/404 handling (Cloudflare Worker, TypeScript)](https://github.com/berstend/service-worker-router/issues/4#issuecomment-546683448)

## See also

- workbox-router
- sw-toolbox

## License

MIT

[url]: https://developer.mozilla.org/en-US/docs/Web/API/URL 'URL'
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request 'Request'
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response 'Response'
[fetchevent]: https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent 'FetchEvent'
[cloudflare workers]: https://www.cloudflare.com/products/cloudflare-workers/ 'Cloudflare Workers'
