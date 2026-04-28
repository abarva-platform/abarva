# I5 · Intelligence · Canvas Mode Switching

Slice ID: I5
Slice name: Intelligence · Canvas Mode Switching
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic four-mode canvas tab strip on the tenant
Sentinel pattern detail surface. Today the tabs are read-only
(`summary`, `evidence`, `programs`, `actions`) and switch via a
`?canvas=<mode>` URL search parameter — there is **no** client-side
state, **no** model invocation, **no** live Sentinel runtime, and
**no** routing through any agent runtime.

## What changed

- New helper module
  [src/lib/intelligence/intelligence-canvas-modes.ts](../../../src/lib/intelligence/intelligence-canvas-modes.ts):
  - `INTELLIGENCE_CANVAS_MODES` — the four-mode `as const` tuple in
    canonical order.
  - Types: `IntelligenceCanvasMode`, `IntelligenceCanvasModeTab`,
    `IntelligenceCanvasBody` (discriminated union over the four
    modes), `IntelligenceCanvasView`.
  - `parseCanvasModeFromSearchParam(value)` — defaults to `summary`
    for `undefined`, `null`, `[]`, multi-value arrays, empty strings,
    and any non-canonical value.
  - `buildIntelligenceCanvasView(input)` — pure: same inputs
    → byte-equal view.
  - `getCanvasModeLabel(mode)` — Title-Case label per mode.
  - `isIntelligenceCanvasMode(value)` — type guard, used by the
    parser and the input normalizer.
  - Body content per mode is a deterministic seed; lists are capped
    at 5 enumerable items.

- New server component
  [src/components/intelligence/IntelligenceCanvasModeTabs.tsx](../../../src/components/intelligence/IntelligenceCanvasModeTabs.tsx):
  - No `'use client'`, no `useState`, no `useEffect`.
  - Reads `searchParams.canvas` via `parseCanvasModeFromSearchParam`.
  - Renders 4 tabs as `<Link>` elements to the same route with
    `?canvas=<mode>`; the active tab carries `aria-current="page"`.
  - Renders a discriminated body (summary / evidence / programs /
    actions) using `view.body.kind`.
  - Wrapping element carries `data-intelligence-canvas-modes="i5"` and
    `data-intelligence-canvas-mode="<mode>"` for downstream probes.
  - Honest disclaimer rendered above the tabs.

- Integrated into the I3 tenant pattern detail route
  [src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx](../../../src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx):
  - The page now awaits both `params` and an optional `searchParams`
    promise (Next.js 15+ contract).
  - `<IntelligenceCanvasModeTabs>` is rendered above
    `<SentinelPatternDetail>` for canonical Sentinel pattern keys.
  - Legacy fallback to `<SeedTenantPattern>` for non-canonical
    pattern slugs is preserved unchanged.
  - `assertTenantAccess` and `notFound` behavior is preserved.

- New tests
  [src/__tests__/integration/intelligence/intelligence-canvas-modes.test.ts](../../../src/__tests__/integration/intelligence/intelligence-canvas-modes.test.ts):
  Coverage across mode set, label resolution, search-param parsing
  (undefined / null / array / empty / unknown), default-on-unknown,
  determinism (byte-equal JSON across calls), href construction,
  body discriminated union, capped enumerables, and module hygiene.
  Component file integration is probed via filesystem regex against
  the component source and the page source — confirming no
  `'use client'`, no `useState`, no `useEffect`, the mount marker,
  and the `next/link` import.

## Mode contract

| Mode       | URL                                      | Body shape                                                                                          |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `summary`  | `?canvas=summary` (default)              | `{ title, rationale, bullets[≤5] }`                                                                 |
| `evidence` | `?canvas=evidence`                       | `{ title, rows[≤5], citationReadinessHint }`                                                        |
| `programs` | `?canvas=programs`                       | `{ title, rows[≤5], helperText }`                                                                   |
| `actions`  | `?canvas=actions`                        | `{ title, rows[≤5], helperText }`                                                                   |

`body.kind` is always equal to `mode` — the discriminated union is
exhaustive and the helper carries a `never`-typed exhaustiveness
guard so adding a fifth mode without updating the body composer is
a typecheck failure.

## Switching is deterministic

Mode switching is pure URL state. The component reads the
`searchParams.canvas` value once on the server, normalizes it via
`parseCanvasModeFromSearchParam`, and renders the result. There is
no React state, no event handler, no `useEffect`, and no bridge to
any client mutation API. Changing tabs navigates to a new URL; the
page re-renders deterministically on the server.

## What is intentionally deferred

- Live evidence rows in the `evidence` body (no live retrieval is
  wired anywhere in the read model today).
- Live program enumeration / handoff routing in the `programs` and
  `actions` bodies — the seed lists are empty and the panel renders
  an honest empty hint pointing at the I3 / I4 detail blocks below.
- Persisted canvas mode preference per user / tenant.
- Cross-tenant analytics for canvas-mode usage.

## Acceptance criteria

- All four canonical modes render with byte-equal output for
  identical inputs.
- `parseCanvasModeFromSearchParam` defaults to `summary` for
  `undefined`, `null`, arrays, empty strings, and unknown values.
- Tab hrefs always include the pattern key and `?canvas=<mode>` and
  always route through `/tenant/<slug>/intelligence/patterns/`.
- The component file mounts the tabs marker, the search-param
  parser, the view builder, and `next/link`.
- The component file does **not** introduce `'use client'`,
  `useState`, or `useEffect`.
- The page file does **not** introduce `'use client'`, `useState`,
  or `useEffect`.
- Helper module imports nothing from React, Next, components,
  Sentinel runtime, Atlas, Nexus, agent runtime, or any model SDK.
- Helper module contains no `Date.now`, `Math.random`, `new Date(`,
  `fetch(`, or placeholder copy.
- Existing `assertTenantAccess` and `notFound` behavior on the
  pattern detail route is preserved.

## Validation commands

```
cd /Users/anand/Projects/nexus-pack-i5
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/intelligence/intelligence-canvas-modes.test.ts
npm run build
```

Regression watch: the existing
`src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts`
and
`src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts`
suites continue to apply; this slice does not change the I2 or I3
view helpers.

## Files changed

- Added: `src/lib/intelligence/intelligence-canvas-modes.ts`
- Added: `src/components/intelligence/IntelligenceCanvasModeTabs.tsx`
- Added: `src/__tests__/integration/intelligence/intelligence-canvas-modes.test.ts`
- Added: `docs/build/slices/I5_INTELLIGENCE_CANVAS_MODES.md`
- Modified: `src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx`
- Modified: `docs/build/build-slices.json`
- Modified: `docs/build/production-readiness.json`
