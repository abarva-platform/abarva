import type { Page, Route } from '@playwright/test'
import fs from 'node:fs'
import { createClerkClient } from '@clerk/backend'
import type {
  FoundationReadout,
  NexusTurnData,
  NexusTurnPayload,
  PortfolioSignal,
  Source,
} from '../../src/lib/intelligence/types'

type QueryFailure = {
  status: number
  body: Record<string, unknown>
}

type MockOptions = {
  initialTurns?: NexusTurnData[]
  queryFailure?: QueryFailure | null
}

type ThreadRecord = {
  id: string
  state: 'A' | 'B' | 'C'
}

const THREAD_ID = 'thread-meridian'
const TEST_USER_EMAIL = 'mh+clerk_test@abarva.com'

export const pratQueries = {
  research: 'What are health systems like us doing on ambient documentation?',
  grounded: 'So should we pick DAX or Abridge?',
  artifact: 'Can you draft me a one-page brief I can send to my CMIO?',
  contradiction: 'Actually, what about pathology coverage?',
  pivot: 'This is a big decision. How do I actually make it?',
}

export const foundationFixture: FoundationReadout = {
  client: { id: 'client-meridian', name: 'Meridian Health System', industry: 'Healthcare' },
  user: { id: 'user-prat', role: 'CIO', name: 'Prat Sundaram' },
  layers: [
    { key: 'L4', label: 'Viewer context', count: 1, asOf: '2026-04-21T09:00:00.000Z' },
    { key: 'L3', label: 'Programs', count: 4, asOf: '2026-04-21T09:00:00.000Z' },
    { key: 'L2', label: 'Enterprise facts', count: 42, asOf: '2026-04-21T09:00:00.000Z' },
    { key: 'L1', label: 'Public foundation', count: 847, asOf: '2026-04-21T09:00:00.000Z' },
  ],
  metrics: {
    useCases: 42,
    vendors: 109,
    contradictions: 7,
    patterns: 847,
    benchmarks: 312,
    engagements: 4,
  },
  asOf: '2026-04-21T09:00:00.000Z',
}

export const signalFixtures: PortfolioSignal[] = [
  {
    id: 'signal-abridge-dax',
    clientId: 'client-meridian',
    category: 'contradiction',
    severity: 'critical',
    headline: '$2.3M Abridge/DAX contradiction surfaced across ambient documentation work',
    context: {
      value_at_risk: '$2.3M',
      programs: 'Ambient documentation selection, clinical operations',
      note: 'ED-primary assumptions and pathology expansion pull the comparison in different directions.',
    },
    sourceContradictionId: 'contradiction-1',
    affectedEngagementIds: ['prog-ambient', 'prog-clinical'],
    sponsorNotified: true,
    firedAt: '2026-04-20T12:00:00.000Z',
    resolvedAt: null,
    dismissedAt: null,
    dismissedByUserId: null,
  },
  {
    id: 'signal-telephony',
    clientId: 'client-meridian',
    category: 'vendor_overlap',
    severity: 'warning',
    headline: 'Contact center AI pilots are duplicating telephony spend across three departments',
    context: {
      spend_overlap: '$680K',
      teams: 'Revenue cycle, access center, member support',
    },
    sourceContradictionId: null,
    affectedEngagementIds: ['prog-access'],
    sponsorNotified: false,
    firedAt: '2026-04-19T12:00:00.000Z',
    resolvedAt: null,
    dismissedAt: null,
    dismissedByUserId: null,
  },
]

const browserFixtures = {
  L1: {
    layer: 'L1',
    activeLayer: 'L1',
    tiles: [
      { id: 'patterns', label: 'Patterns', count: 847, active: false },
      { id: 'vendors', label: 'Vendors', count: 156, active: false },
      { id: 'benchmarks', label: 'Benchmarks', count: 312, active: false },
    ],
    items: [
      { id: 'pattern-ambient', title: 'Ambient documentation adoption', subtitle: 'Pattern', detail: 'Health systems are clustering around two-vendor shortlists with ED-specific variance.', href: '/intelligence/library', sourceUrl: null },
      { id: 'vendor-abridge', title: 'Abridge', subtitle: 'Vendor', detail: 'Frequently wins when clinician adoption and live pilot velocity matter most.', href: '/intelligence/library', sourceUrl: null },
      { id: 'benchmark-nejm', title: 'NEJM documentation benchmark', subtitle: 'Benchmark', detail: 'Peer benchmark pack refreshed last week.', href: null, sourceUrl: 'https://example.com/nejm-benchmark' },
    ],
  },
  L2: {
    layer: 'L2',
    activeLayer: 'L2',
    tiles: [
      { id: 'initiatives', label: 'Initiatives', count: 42, active: false },
      { id: 'vendors', label: 'Meridian vendors', count: 19, active: false },
      { id: 'risks', label: 'Risks', count: 7, active: false },
    ],
    items: [
      { id: 'meridian-ambient', title: 'Ambient documentation evaluation', subtitle: 'Enterprise fact', detail: 'CMIO + Digital jointly sponsoring a 90-day decision window.', href: '/intelligence/library', sourceUrl: null },
      { id: 'meridian-pathology', title: 'Pathology workflow modernization', subtitle: 'Enterprise fact', detail: 'Scope expansion would change the current vendor recommendation.', href: '/intelligence/library', sourceUrl: null },
    ],
  },
  L3: {
    layer: 'L3',
    activeLayer: 'L3',
    tiles: [
      { id: 'programs', label: 'Programs', count: 4, active: false },
      { id: 'deliverables', label: 'Deliverables', count: 18, active: false },
    ],
    items: [
      { id: 'ambient-program', title: 'Ambient Documentation Selection', subtitle: 'Program', detail: 'Currently in chartering with CMIO + CDO sponsorship.', href: '/programs/new', sourceUrl: null },
    ],
  },
  L4: {
    layer: 'L4',
    activeLayer: 'L4',
    tiles: [
      { id: 'viewer', label: 'Viewer context', count: 1, active: false },
      { id: 'saved', label: 'Saved threads', count: 6, active: false },
    ],
    items: [
      { id: 'viewer-prat', title: 'Prat context', subtitle: 'Viewer', detail: 'CIO lens active for healthcare decision work.', href: '/intelligence/library', sourceUrl: null },
    ],
  },
} as const

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

function readEnv(name: string): string {
  const local = fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .find((line) => line.startsWith(`${name}=`))
  if (local) return local.slice(local.indexOf('=') + 1).trim()
  const envValue = process.env[name]
  if (envValue) return envValue
  throw new Error(`Missing ${name} for Clerk-backed browser auth.`)
}

async function getClerkAuth() {
  const clerk = createClerkClient({ secretKey: readEnv('CLERK_SECRET_KEY') })
  const users = await clerk.users.getUserList({ emailAddress: [TEST_USER_EMAIL] })
  const user = users.data[0]
  if (!user) {
    throw new Error(`Unable to find Clerk demo user ${TEST_USER_EMAIL}.`)
  }
  const session = await clerk.sessions.createSession({ userId: user.id })
  const token = await clerk.sessions.getToken(session.id)
  const payload = JSON.parse(Buffer.from(token.jwt.split('.')[1], 'base64url').toString('utf8')) as {
    iat: number
    iss: string
  }
  const devBrowser = await clerk.testingTokens.createTestingToken()
  return {
    sessionJwt: token.jwt,
    clientUat: String(payload.iat),
    devBrowser: devBrowser.token,
    clerkOrigin: payload.iss as string,
  }
}

function source(
  id: string,
  type: Source['type'],
  name: string,
  confidence: Source['confidence'] = 'medium',
  detail?: string,
): Source {
  return { id, type, name, confidence, detail }
}

function turn(payload: {
  id: string
  index: number
  mode: NexusTurnData['mode']
  format: NexusTurnData['format']
  hero?: string
  answer?: string
  crux?: string
  dimensions?: NexusTurnPayload['dimensions']
  items?: NexusTurnPayload['items']
  artifactHtml?: string
  artifactType?: NexusTurnPayload['artifact_type']
  artifactMeta?: NexusTurnPayload['artifact_metadata']
  question?: string
  options?: NexusTurnPayload['options']
  counterCard?: NexusTurnPayload['counter_card']
  tiebreaker?: NexusTurnPayload['tiebreaker']
  personaKey?: string | null
  sources?: Source[]
  contradictionSelfCheck?: NexusTurnData['contradictionSelfCheck']
}): NexusTurnData {
  return {
    id: payload.id,
    threadId: THREAD_ID,
    index: payload.index,
    role: 'nexus',
    mode: payload.mode,
    format: payload.format,
    confidence: 'high',
    payload: {
      hero: payload.hero,
      answer: payload.answer,
      crux: payload.crux,
      dimensions: payload.dimensions,
      items: payload.items,
      artifact_html: payload.artifactHtml,
      artifact_type: payload.artifactType,
      artifact_metadata: payload.artifactMeta,
      question: payload.question,
      options: payload.options,
      counter_card: payload.counterCard,
      tiebreaker: payload.tiebreaker,
    },
    sources: payload.sources ?? [],
    capabilitiesActive: [],
    counterOfTurnId: null,
    contradictionSelfCheck: payload.contradictionSelfCheck ?? null,
    personaKey: payload.personaKey ?? null,
    latencyMs: 820,
    firstTokenMs: 460,
    createdAt: '2026-04-21T09:00:00.000Z',
  }
}

function userTurn(query: string, index: number): NexusTurnData {
  return {
    id: `user-${index + 1}`,
    threadId: THREAD_ID,
    index,
    role: 'user',
    mode: null,
    format: null,
    confidence: null,
    payload: { answer: query },
    sources: [],
    capabilitiesActive: [],
    counterOfTurnId: null,
    contradictionSelfCheck: null,
    personaKey: null,
    latencyMs: null,
    firstTokenMs: null,
    createdAt: '2026-04-21T09:00:00.000Z',
  }
}

function researchTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-research-${index}`,
    index,
    mode: 'research',
    format: 'ranked_list',
    hero: 'Ambient documentation peers are clustering into two credible paths.',
    items: [
      { title: '4 of 6 peers succeeded after tightly scoped ED pilots', rationale: 'Speed to adoption and clinician workflow fit mattered more than feature breadth.', confidence: 'high' },
      { title: '2 of 6 peers failed because pathology and CDI were pulled in too early', rationale: 'The scope widened faster than the change-management plan could support.', confidence: 'medium' },
      { title: 'Meridian-conditioned projection centers on a $4.1M median value envelope', rationale: 'The benchmark range is $2.8M to $5.3M with similar clinician volume.', confidence: 'high' },
    ],
    sources: [
      source('emergent-ambient', 'emergent', 'Ambient documentation cohort (n=6)', 'high'),
      source('benchmark-ambient', 'benchmark', 'Median value envelope $4.1M', 'high'),
      source('pattern-ambient', 'pattern', 'ED-first deployment pattern', 'medium'),
    ],
  })
}

function groundedTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-grounded-${index}`,
    index,
    mode: 'grounded',
    format: 'matrix',
    hero: 'DAX vs Abridge depends on the shape of the rollout you are actually committing to.',
    answer: 'This is a decision frame, not a generic winner pick.',
    crux: 'Pick Abridge if ED adoption and immediate clinician workflow fit matter most. Pick DAX if pathology and broader multi-modal horizon matter more.',
    dimensions: [
      { name: 'ED workflow fit', values: [{ option: 'Abridge', value: 'Best fit', winner: true, confidence: 'high' }, { option: 'DAX', value: 'Good', confidence: 'medium' }] },
      { name: 'Pathology expansion', values: [{ option: 'Abridge', value: 'Needs validation', confidence: 'medium' }, { option: 'DAX', value: 'Broader coverage', winner: true, confidence: 'high' }] },
      { name: 'Rollout velocity', values: [{ option: 'Abridge', value: 'Faster pilot', winner: true, confidence: 'high' }, { option: 'DAX', value: 'Slower but broader', confidence: 'medium' }] },
    ],
    tiebreaker: {
      question: 'Can pathology remain out of scope for the first 12 months?',
      resolver: 'CMIO + digital ops review',
      effort: '2 weeks',
    },
    sources: [
      source('emergent-dax-abridge', 'emergent', 'Peer cohort (n=6)', 'high'),
      source('vendor-abridge', 'vendor', 'Abridge pilot outcomes', 'high'),
      source('vendor-dax', 'vendor', 'DAX rollout profile', 'medium'),
    ],
  })
}

function artifactTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-artifact-${index}`,
    index,
    mode: 'grounded',
    format: 'artifact',
    hero: 'CMIO decision brief',
    artifactType: 'one_pager',
    artifactHtml:
      '<article><h1>Ambient documentation decision brief</h1><p><strong>Pick Abridge if</strong> clinician adoption in ED is the near-term value lever.</p><p><strong>Pick DAX if</strong> pathology expansion is part of the first-year scope.</p><p><strong>Before either</strong> resolve the $2.3M contradiction and confirm pathology timing.</p></article>',
    artifactMeta: {
      title: 'CMIO decision brief',
      prepared_for: 'Meridian CMIO',
      date: '2026-04-21',
      draft_state: 'ephemeral',
      governance_state: 'ephemeral',
      promotion_eligible: true,
    },
    sources: [
      source('benchmark-artifact', 'benchmark', 'Benchmark-backed decision brief', 'high'),
    ],
  })
}

function contradictionTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-contradiction-${index}`,
    index,
    mode: 'grounded',
    format: 'crux',
    hero: 'Pathology changes the recommendation pressure.',
    crux: 'Your earlier ED-primary framing still points toward Abridge. Adding pathology re-opens the DAX comparison.',
    answer: 'Worth surfacing, not blocking.',
    contradictionSelfCheck: {
      prior_turn_id: 'nexus-grounded',
      prior_summary: 'ED-primary decision frame favored Abridge.',
      current_departure: 'Adding pathology re-opens the DAX comparison and changes the rollout logic.',
      reconciliation_paths: [
        'Keep pathology out of phase 1',
        'Re-run the vendor comparison with pathology in scope',
        'Split ED and pathology into separate workstreams',
      ],
    },
    tiebreaker: {
      question: 'Does pathology have to ship in the first wave?',
      resolver: 'CMIO + pathology lead',
      effort: '3 meetings',
    },
    sources: [
      source('engagement-pathology', 'engagement', 'Meridian pathology modernization note', 'medium'),
      source('emergent-pathology', 'emergent', 'Scope-change cohort', 'medium'),
    ],
  })
}

function pivotTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-pivot-${index}`,
    index,
    mode: 'pivot',
    format: 'one_sentence',
    hero: 'This now wants to be treated as a program, not an ad hoc thread.',
    answer: 'I can preload charter inputs from the research we already completed and hand the persistent work into Programs.',
    sources: [
      source('engagement-charter', 'engagement', 'Ambient documentation charter draft', 'high'),
    ],
  })
}

function personaTurn(index: number, personaKey: string): NexusTurnData {
  return turn({
    id: `nexus-persona-${personaKey.toLowerCase()}`,
    index,
    mode: 'grounded',
    format: 'crux',
    hero: `${personaKey} lens`,
    crux: 'Same facts, re-weighted for payback, downside case, and rollback triggers.',
    answer: 'The CFO will ask whether the $4.1M median is verifiable, what breaks the payback curve, and which trigger forces rollback.',
    personaKey,
    sources: [
      source('benchmark-cfo', 'benchmark', 'Median payback benchmark', 'high'),
    ],
  })
}

function counterTurn(index: number): NexusTurnData {
  return turn({
    id: `nexus-counter-${index}`,
    index,
    mode: 'grounded',
    format: 'counter_pair',
    hero: 'Strongest counter to the current recommendation',
    answer: 'I argued for Abridge on ED-first speed.',
    counterCard: {
      hero: 'Counter-position',
      answer: 'Pick DAX anyway if pathology is likely inside the 18-month horizon and you want to avoid a second platform decision.',
    },
    tiebreaker: {
      question: 'Will pathology expansion be approved this fiscal year?',
      resolver: 'CIO + CMIO operating review',
      effort: 'Low',
    },
    sources: [
      source('vendor-counter', 'vendor', 'Vendor horizon comparison', 'medium'),
    ],
  })
}

function toThreadState(turns: NexusTurnData[]): ThreadRecord {
  const nexusTurns = turns.filter((entry) => entry.role === 'nexus').length
  return {
    id: THREAD_ID,
    state: nexusTurns >= 3 ? 'C' : nexusTurns >= 1 ? 'B' : 'A',
  }
}

function sseBody(turnData: NexusTurnData): string {
  const streamedPayload = {
    ...turnData.payload,
    ...(turnData.contradictionSelfCheck ? { contradiction_self_check: turnData.contradictionSelfCheck } : {}),
  }
  const events: Array<Record<string, unknown>> = [
    { type: 'turn_started', turnId: turnData.id, mode: turnData.mode, format: turnData.format },
    { type: 'retrieval_progress', phase: 'retrieve', status: 'complete', latencyMs: 640 },
    ...turnData.sources.map((entry) => ({ type: 'source_attached', source: entry })),
    { type: 'content_delta', text: JSON.stringify(streamedPayload) },
    { type: 'turn_complete', payload: { threadId: THREAD_ID, mode: turnData.mode, format: turnData.format } },
  ]
  return `${events.map((entry) => JSON.stringify(entry)).join('\n')}\n`
}

function nextQueryTurn(query: string, index: number): NexusTurnData {
  if (query.includes('ambient documentation')) return researchTurn(index)
  if (query.includes('DAX') || query.includes('Abridge')) return groundedTurn(index)
  if (query.includes('one-page brief')) return artifactTurn(index)
  if (query.includes('pathology')) return contradictionTurn(index)
  if (query.includes('big decision') || query.includes('actually make it')) return pivotTurn(index)
  return turn({
    id: `nexus-generic-${index}`,
    index,
    mode: 'research',
    format: 'one_sentence',
    hero: 'Nexus response',
    answer: 'This is a mocked Nexus response for UI smoke coverage.',
    sources: [source('pattern-generic', 'pattern', 'Generic research source', 'medium')],
  })
}

export async function installIntelligenceMocks(page: Page, options: MockOptions = {}) {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
  await refreshClerkAuth(page, baseUrl)

  const turns = [...(options.initialTurns ?? [])]
  let queryCount = 0

  page.on('pageerror', (error) => {
    throw error
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location().url ?? ''
      if (location.includes('.clerk.accounts.dev') && message.text().includes('401')) {
        return
      }
      if (options.queryFailure && message.text().includes('500 (Internal Server Error)')) {
        return
      }
      throw new Error(`Console error: ${message.text()}`)
    }
  })

  await page.route('**/api/v1/intelligence/foundation', async (route) => {
    await json(route, foundationFixture)
  })

  await page.route('**://*.clerk.accounts.dev/v1/environment?**', async (route) => {
    await json(route, {})
  })

  await page.route('**://*.clerk.accounts.dev/v1/client?**', async (route) => {
    await json(route, {})
  })

  await page.route('**/api/intelligence/pattern/**', async (route) => {
    await json(route, { code: 'F008', title: 'Legacy pattern detail', summary: 'Stubbed during Intelligence UI smoke tests.' })
  })

  await page.route('**/favicon.ico', async (route) => {
    await route.fulfill({ status: 204, body: '' })
  })

  await page.route('**/api/v1/intelligence/signals?**', async (route) => {
    await json(route, { signals: signalFixtures })
  })

  await page.route('**/api/v1/intelligence/foundation/browse?**', async (route) => {
    const url = new URL(route.request().url())
    const layer = (url.searchParams.get('layer') ?? 'L1') as keyof typeof browserFixtures
    await json(route, browserFixtures[layer] ?? browserFixtures.L1)
  })

  await page.route('**/api/v1/threads/*/save', async (route) => {
    await json(route, { ok: true })
  })

  await page.route('**/api/v1/threads/*', async (route) => {
    await json(route, { thread: toThreadState(turns), turns })
  })

  await page.route('**/api/v1/nexus/query', async (route) => {
    if (options.queryFailure) {
      await json(route, options.queryFailure.body, options.queryFailure.status)
      return
    }

    const requestBody = route.request().postDataJSON() as { query?: string }
    const query = requestBody.query ?? ''
    const user = userTurn(query, turns.length)
    turns.push(user)

    const assistant = nextQueryTurn(query, turns.length)
    turns.push(assistant)
    queryCount += 1

    await route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body: sseBody(assistant),
    })
  })

  await page.route('**/api/v1/nexus/persona', async (route) => {
    const requestBody = route.request().postDataJSON() as { personaKey?: string }
    const next = personaTurn(turns.length, requestBody.personaKey ?? 'CFO')
    turns.push(next)
    await json(route, { turn: next })
  })

  await page.route('**/api/v1/nexus/counter', async (route) => {
    const next = counterTurn(turns.length)
    turns.push(next)
    await json(route, { turn: next })
  })

  return {
    threadId: THREAD_ID,
    getQueryCount: () => queryCount,
  }
}

export async function refreshClerkAuth(page: Page, baseUrl = process.env.BASE_URL ?? 'http://localhost:3000') {
  const auth = await getClerkAuth()
  await page.context().addCookies([
    { name: '__session', value: auth.sessionJwt, url: baseUrl },
    { name: '__client_uat', value: auth.clientUat, url: baseUrl },
    { name: '__clerk_db_jwt', value: auth.devBrowser, url: baseUrl },
    { name: '__session', value: auth.sessionJwt, url: auth.clerkOrigin },
    { name: '__client_uat', value: auth.clientUat, url: auth.clerkOrigin },
    { name: '__clerk_db_jwt', value: auth.devBrowser, url: auth.clerkOrigin },
  ])
}

export function deepDiveTurns(): NexusTurnData[] {
  return [
    userTurn(pratQueries.research, 0),
    researchTurn(1),
    userTurn(pratQueries.grounded, 2),
    groundedTurn(3),
    userTurn(pratQueries.contradiction, 4),
    contradictionTurn(5),
  ]
}
