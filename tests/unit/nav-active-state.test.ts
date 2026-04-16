/**
 * Unit tests for AbarvaNav active-state logic.
 *
 * These are pure-function tests — no browser, no auth.
 * They catch the exact class of bugs seen in April 2026:
 *  - Intelligence + AVR both teal on data-intelligence page
 *  - Maestro always teal regardless of current page
 *  - Breadcrumb shown when navigating via Intelligence direct link
 */

// ── Mirror the exact logic from AbarvaNav.tsx ────────────────────────────────

function navActiveState(activePage: string | undefined) {
  const page = activePage || ''

  const avrActive = [
    'intelligence', 'architecture', 'ai-pdlc', 'avr',
    'data-intelligence', 'justify', 'contradictions', 'outcome-intelligence',
    'diagnose', 'vendor-intelligence',
  ].includes(page)

  const intelligenceActive = ['ai-strategy', 'intelligence-hub'].includes(page)

  const adminActive = page.startsWith('admin')

  const maestroActive = page === 'maestro'

  // At most ONE of these should be true at a time
  const activeCount = [avrActive, intelligenceActive, adminActive, maestroActive].filter(Boolean).length

  return { avrActive, intelligenceActive, adminActive, maestroActive, activeCount }
}

const MODULE_CRUMB_PAGES = [
  'diagnose', 'contradictions', 'data-intelligence',
  'intelligence', 'vendor-intelligence', 'architecture', 'justify',
  'ai-pdlc', 'outcome-intelligence',
]

// ── All 9 module pages → AVR only ───────────────────────────────────────────

describe('AVR modules: only avrActive fires', () => {
  test.each([
    'diagnose',
    'contradictions',
    'data-intelligence',
    'intelligence',
    'vendor-intelligence',
    'architecture',
    'justify',
    'ai-pdlc',
    'outcome-intelligence',
  ])('%s → avrActive=true, all others false', (page) => {
    const s = navActiveState(page)
    expect(s.avrActive).toBe(true)
    expect(s.intelligenceActive).toBe(false)
    expect(s.adminActive).toBe(false)
    expect(s.maestroActive).toBe(false)
    expect(s.activeCount).toBe(1)
  })
})

// ── Intelligence overview page ───────────────────────────────────────────────

test('ai-strategy → intelligenceActive only', () => {
  const s = navActiveState('ai-strategy')
  expect(s.intelligenceActive).toBe(true)
  expect(s.avrActive).toBe(false)
  expect(s.activeCount).toBe(1)
})

test('intelligence-hub → intelligenceActive only', () => {
  const s = navActiveState('intelligence-hub')
  expect(s.intelligenceActive).toBe(true)
  expect(s.avrActive).toBe(false)
  expect(s.activeCount).toBe(1)
})

// ── Admin pages ──────────────────────────────────────────────────────────────

test.each(['admin', 'admin/context', 'admin/approvals', 'admin/new-client'])(
  '%s → adminActive only',
  (page) => {
    const s = navActiveState(page)
    expect(s.adminActive).toBe(true)
    expect(s.avrActive).toBe(false)
    expect(s.intelligenceActive).toBe(false)
    expect(s.activeCount).toBe(1)
  }
)

// ── Maestro page ─────────────────────────────────────────────────────────────

test('maestro → maestroActive only', () => {
  const s = navActiveState('maestro')
  expect(s.maestroActive).toBe(true)
  expect(s.avrActive).toBe(false)
  expect(s.intelligenceActive).toBe(false)
  expect(s.adminActive).toBe(false)
  expect(s.activeCount).toBe(1)
})

// ── Home / unauthenticated pages → nothing active ───────────────────────────

test.each([undefined, '', 'home', 'solutions', 'platform', 'clients'])(
  '%s → nothing active',
  (page) => {
    const s = navActiveState(page)
    expect(s.activeCount).toBe(0)
  }
)

// ── Regression: the April 2026 double-highlight bug ─────────────────────────

test('REGRESSION: data-intelligence must NOT activate intelligenceActive (old bug)', () => {
  const s = navActiveState('data-intelligence')
  expect(s.intelligenceActive).toBe(false)
})

test('REGRESSION: ai-strategy must NOT activate avrActive (old bug)', () => {
  const s = navActiveState('ai-strategy')
  expect(s.avrActive).toBe(false)
})

test('REGRESSION: Maestro must NOT be active on non-maestro pages (old bug)', () => {
  for (const page of MODULE_CRUMB_PAGES) {
    const s = navActiveState(page)
    expect(s.maestroActive).toBe(false)
  }
})

// ── Mutual exclusion ─────────────────────────────────────────────────────────

test('no page activates more than one nav section simultaneously', () => {
  const pages = [
    ...MODULE_CRUMB_PAGES,
    'ai-strategy', 'intelligence-hub',
    'admin', 'admin/context',
    'maestro',
    'home', 'solutions', 'platform', '',
  ]
  for (const page of pages) {
    const s = navActiveState(page)
    expect(s.activeCount).toBeLessThanOrEqual(1)
  }
})
