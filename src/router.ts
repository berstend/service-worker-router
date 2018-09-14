import UrlPattern from 'url-pattern'

// https://basarat.gitbooks.io/typescript/docs/tips/barrel.html
export { UrlPattern }

const patternOpts = {
  segmentNameCharset: 'a-zA-Z0-9_-',
  segmentValueCharset: 'a-zA-Z0-9@.+-_'
}

export type HandlerPromise = Promise<Response | any | void>

export type HandlerFunction = (...args: any[]) => HandlerPromise

export interface HandlerContext extends RouteResult {
  event: FetchEvent
  request: Request
}

export interface RouteOptions {
  method?: string
  matchUrl?: boolean
}

export interface Route {
  pattern: UrlPattern
  handler: HandlerFunction
  options: RouteOptions
}

export interface RouteResult {
  params: any | null
  handler: HandlerFunction
  url: URL
  method: string
}

export interface RequestResult {
  route: RouteResult
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

  public findRoute (url: URL | string, method: string): RouteResult | null {
    if (!(url instanceof URL)) {
      url = url.startsWith('/') ? new URL(`http://domain${url}`) : new URL(url)
    }
    for (const { pattern, options, handler } of this.routes) {
      if (options.method && options.method !== method) continue
      const params = pattern.match(options.matchUrl ? url.href : url.pathname)
      if (params) return { params, handler, url, method }
    }
    return null
  }

  public findRouteForRequest (request: Request): RouteResult | null {
    return this.findRoute(request.url, request.method)
  }

  public handleRequest (event: FetchEvent): RequestResult | null {
    const route = this.findRouteForRequest(event.request)
    if (!route) return null
    const handlerPromise = route.handler({
      ...route,
      event,
      request: event.request
    } as HandlerContext)
    return { route, handlerPromise }
  }

  public watch (event: FetchEvent): RequestResult | null {
    const result = this.handleRequest(event)
    if (!result) return null
    const { route, handlerPromise } = result
    event.respondWith(handlerPromise)
    return { route, handlerPromise }
  }

  public clear () {
    this.routes.length = 0
  }
}
