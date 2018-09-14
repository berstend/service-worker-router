import UrlPattern from 'url-pattern'

// https://basarat.gitbooks.io/typescript/docs/tips/barrel.html
export { UrlPattern }

const patternOpts = {
  segmentNameCharset: 'a-zA-Z0-9_-',
  segmentValueCharset: 'a-zA-Z0-9@.+-_'
}

export type HandlerPromise = Promise<Response | any | void>

export type HandlerFunction = (...args: any[]) => HandlerPromise

export interface HandlerContext extends MatchResult {}

export interface RouteOptions {
  method?: string
  matchUrl?: boolean
}

export interface Route {
  pattern: UrlPattern
  handler: HandlerFunction
  options: RouteOptions
}

export interface MatchResult {
  params: any | null
  handler: HandlerFunction
  url: URL
  method: string
  route: Route
  request?: Request
  event?: FetchEvent
}

export interface HandleResult {
  match: MatchResult
  handlerPromise: HandlerPromise
}

export class Router {
  private routes: Array<Route> = []

  public all (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: '' })
  }
  public get (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'GET' })
  }
  public post (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'POST' })
  }
  public put (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'PUT' })
  }
  public patch (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'PATCH' })
  }
  public delete (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'DELETE' })
  }
  public head (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'HEAD' })
  }
  public options (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    return this.addRoute(pattern, handler, { ...options, method: 'OPTIONS' })
  }

  private addRoute (
    pattern: string | UrlPattern,
    handler: HandlerFunction,
    options: RouteOptions = {}
  ): Router {
    if (!(pattern instanceof UrlPattern)) {
      pattern = new UrlPattern(pattern, patternOpts)
    }
    this.routes.push({ pattern, handler, options })
    return this
  }

  public match (url: URL | string, method: string): MatchResult | null {
    if (!(url instanceof URL)) {
      url = url.startsWith('/') ? new URL(`http://domain${url}`) : new URL(url)
    }
    for (const route of this.routes) {
      const { pattern, options, handler } = route
      if (options.method && options.method !== method) continue
      const params = pattern.match(options.matchUrl ? url.href : url.pathname)
      if (params) return { params, handler, url, method, route }
    }
    return null
  }

  public matchRequest (request: Request): MatchResult | null {
    return this.match(request.url, request.method)
  }

  public matchEvent (event: FetchEvent): MatchResult | null {
    return this.matchRequest(event.request)
  }

  public handle (url: URL | string, method: string): HandleResult | null {
    const match = this.match(url, method)
    if (!match) return null
    const context = { ...match }
    const handlerPromise = match.handler(context as HandlerContext)
    return { handlerPromise, match: context }
  }

  public handleRequest (request: Request): HandleResult | null {
    const match = this.matchRequest(request)
    if (!match) return null
    const context = { ...match, request } as HandlerContext
    const handlerPromise = match.handler(context)
    return { handlerPromise, match: context }
  }

  public handleEvent (event: FetchEvent): HandleResult | null {
    const request = event.request
    const match = this.matchRequest(request)
    if (!match) return null
    const context = { ...match, request, event } as HandlerContext
    const handlerPromise = match.handler(context)
    event.respondWith(handlerPromise)
    return { handlerPromise, match: context }
  }

  public clear () {
    this.routes.length = 0
  }
}
