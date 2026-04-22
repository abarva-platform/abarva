import type { Page, Route } from '@playwright/test'

export type StreamEvent = Record<string, unknown> & { type: string }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, accept',
  'Access-Control-Max-Age': '600',
}

function buildHeaders(contentType: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    ...CORS_HEADERS,
  }
}

async function fulfill(route: Route, body: string, contentType: string) {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({
      status: 204,
      headers: buildHeaders(contentType),
      body: '',
    })
    return
  }

  await route.fulfill({
    status: 200,
    headers: buildHeaders(contentType),
    body,
  })
}

export function buildSseBody(events: StreamEvent[]): string {
  return events
    .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    .join('')
}

export function buildNdjsonBody(events: StreamEvent[]): string {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`
}

export async function mockSseRoute(
  page: Page,
  url: string | RegExp,
  events: StreamEvent[] | ((route: Route) => StreamEvent[] | string | Promise<StreamEvent[] | string>),
): Promise<void> {
  await page.route(url, async (route) => {
    const body = typeof events === 'function' ? await events(route) : buildSseBody(events)
    await fulfill(route, Array.isArray(body) ? buildSseBody(body) : body, 'text/event-stream; charset=utf-8')
  })
}

export async function mockNdjsonRoute(
  page: Page,
  url: string | RegExp,
  eventsOrBody: StreamEvent[] | string | ((route: Route) => StreamEvent[] | string | Promise<StreamEvent[] | string>),
): Promise<void> {
  await page.route(url, async (route) => {
    const body = typeof eventsOrBody === 'function' ? await eventsOrBody(route) : eventsOrBody
    await fulfill(route, Array.isArray(body) ? buildNdjsonBody(body) : body, 'application/x-ndjson; charset=utf-8')
  })
}

// Back-compat for existing callers.
export function buildNdjsonStream(events: StreamEvent[]): string {
  return buildNdjsonBody(events)
}
