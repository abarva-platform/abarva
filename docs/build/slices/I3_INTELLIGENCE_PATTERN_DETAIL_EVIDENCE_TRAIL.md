# I3 · Intelligence · Pattern Detail / Evidence Trail

Slice ID: I3
Slice name: Intelligence · Pattern Detail / Evidence Trail
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds the deterministic tenant-level Sentinel pattern detail surface
that I2 already links to. Renders pattern header + confidence /
severity chips, why-it-matters, recommended action, affected
programs, an evidence trail listing the I1 source signals, missing
inputs, and suggested handoffs. **No live Sentinel runtime, no Atlas
runtime touch, no Nexus runtime touch, no agent runtime touch, no
migrations, no model calls.**

## What changed

- Extended view helper
  [src/lib/intelligence/sentinel-pattern-view.ts](../../../src/lib/intelligence/sentinel-pattern-view.ts):
  - New types: `SentinelPatternEvidenceCitationStatus`,
    `SentinelPatternEvidenceTrailRow`, `SentinelPatternHandoffRow`,
    `SentinelPatternDetailView`.
  - New helpers:
    - `buildSentinelPatternDetailView(tenant, patternKey)` →
      composes the full deterministic detail view, or `null` when
      the tenant has no detection for that pattern key.
    - `buildPatternEvidenceTrail(detection)` → I1 evidence-signal
      projection with honest citation status.
    - `buildPatternAffectedProgramRows(detection)` → I1 affected-
      program shape kept stable for future enrichment.
    - `buildPatternHandoffRows(detection)` → handoff targets paired
      with a deterministic per-target reason caption.
    - `isSentinelPatternKey(value)` → type guard the route uses to
      decide between Sentinel render path and legacy seed shell
      fallback.
  - I3 helpers import only the I1 detection module and the seed
    planner; no live runtime touch.

- New component
  [src/components/intelligence/SentinelPatternDetail.tsx](../../../src/components/intelligence/SentinelPatternDetail.tsx):
  - Server component (no client interactivity).
  - Renders pattern header (eyebrow with patternKey, title,
    severity / confidence / source-label chips), summary, why-it-
    matters caption, recommended action, affected-program list with
    canonical Programs detail links, an evidence trail with one row
    per I1 source signal (signal id, type, severity, program code,
    routeHref, citation caption), missing inputs, and a suggested-
    handoffs row group.
  - Footer caption echoes the I3 interpretation basis and disclaims
    live runtime / model invocation.
  - "← Back to {tenant} Intelligence" link routes to the I2 landing.

- New tenant route
  [src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx](../../../src/app/%28maestro%29/tenant/%5BtenantSlug%5D/intelligence/patterns/%5BpatternKey%5D/page.tsx):
  - `assertTenantAccess` → `findTenantByRouteSlug` → `notFound` on
    unknown tenant; preserves the existing tenant-isolation guard
    contract.
  - Routes Sentinel pattern keys (5 canonical I1 keys) to
    `<SentinelPatternDetail view={…}/>`; routes any other slug to
    the legacy `<SeedTenantPattern>` shell so existing seed-pattern
    URLs keep working.
  - `notFound` when the pattern key is canonical but the tenant has
    no detection for it (avoids rendering a blank shell).
  - No model / API calls.

- Legacy route removed
  `src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternSlug]/page.tsx`
  was deleted to resolve a Next.js dynamic-segment-name collision
  (you cannot have two parallel dynamic segments named
  `[patternSlug]` and `[patternKey]` at the same path level). The
  new `[patternKey]/page.tsx` preserves the legacy behavior by
  falling back to `<SeedTenantPattern>` for any non-Sentinel slug.

- New tests
  [src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts](../../../src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts):
  33 deterministic tests covering: type-guard correctness, per-
  tenant detail-view determinism, full field population, unknown-
  key null returns, route invariants on affected programs, evidence
  trail traceability back to I1 source signal IDs, missing-input
  passthrough, handoff-row composition, citation-gap honesty, no-
  fabricated-dollar-values, no-live-runtime claim, route-path parity
  with the I2 detection cards, and module hygiene across the view
  helper extension, the component, and the route page.

## How it consumes I1 / I2 detections

```text
buildSentinelPatternDetectionsForTenant(tenant)                ← I1
        │
        ▼
buildSentinelPatternDetailView(tenant, patternKey)             ← I3
        │
        ▼
{
  detection,                                    ← I1
  evidenceTrail (from detection.evidenceSignals),
  affectedProgramRows (from detection.affectedPrograms),
  handoffRows (from detection.handoffTargets),
  missingInputs (from detection.missingInputs),
  intelligenceLandingHref → I2 route,
  …
}
        │
        ▼
<SentinelPatternDetail view=…/>                 ← I3 component
        │
        ▼
/tenant/<slug>/intelligence/patterns/<patternKey>  ← I3 route
```

The I3 helper imports only the I1 detection module and the seed
planner. It does not invoke a live Sentinel runtime. The only
component the new route imports — apart from `SentinelPatternDetail`
— is `SeedTenantPattern`, used as a passthrough fallback for any
non-Sentinel slug so existing tenant pattern URLs continue to work.

## What evidence trail means today

The evidence trail is a deterministic projection of the I1
`detection.evidenceSignals[]` (which is itself a projection of the
S9e Programs → Control Tower signal list contributing to that
pattern detection). Each evidence-trail row carries:

- `signalId` — the canonical S9e signal id
  (`sig:<tenantKey>:<programSlug>:<type>:<suffix>`)
- `signalType` — the S9e pressure type
- `signalSeverity` — the S9e severity
- `programCode` / `programName`
- `source` — the S9e signal source
- `routeHref` — link back to `/tenant/<routeSlug>/programs/<programSlug>`
- `citationStatus: 'not_yet_wired'` — every row reports honestly
  that real evidence registry citations have not yet been wired
  into the pattern view today.
- `citationCaption` — single-line honest caption referencing the
  contributing program and signal type (never an invented citation).

The page-level caption "Evidence citations are not yet wired for this
deterministic pattern view." renders prominently above the trail to
make the absence honest.

## What is deterministic today

- Detail view is byte-equal across repeated calls for the same
  tenant + pattern key.
- `intelligenceLandingHref` is always
  `/tenant/<routeSlug>/intelligence` (test enforced).
- Detail `routeHref` parity with I2 detection cards: every I1
  detection's `routeHref` round-trips through
  `buildSentinelPatternDetailView` to produce a non-null view (test
  enforced).
- `sourceLabel: 'pattern_detection_read_model'` for every populated
  detail view.
- `citationReadinessLabel: 'not_yet_wired'` and every row's
  `citationStatus: 'not_yet_wired'` (test enforced).
- The view never invents a dollar amount in any string field (test
  enforced).
- Severity / confidence labels are uppercase canonical strings.
- Missing-input list passthrough: `view.missingInputs` equals
  `detection.missingInputs`.
- Type guard: `isSentinelPatternKey` accepts the 5 canonical
  pattern keys and rejects everything else (including S9e signal
  type strings).

## What is NOT yet live Sentinel runtime

- No Claude / OpenAI / Pinecone invocation.
- No streaming compose.
- No live retrieval into the evidence registry.
- No persisted pattern-detail log; every page load rebuilds from
  seed.
- No subscription to live signal-summary deltas.
- No recurrence tracking — confidence cannot promote past `high`
  via cross-steering recurrence yet.

## What is deferred

- **True evidence registry citations** — once a future seed-
  population slice lands evidence references and the registry has
  wired E-id citations, the trail rows can flip
  `citationStatus: 'wired'` and surface real citations without any
  change to the I3 contract.
- **Pattern graph traversal** — navigate from a detection to its
  parent operating-model pattern and back to per-program
  contributions; deferred to an I4+ slice.
- **Authored pattern content renderer** — connect the detail view
  to authored long-form pattern content (the existing
  pattern-manifest pipeline) rather than the bare deterministic
  shape.
- **Live Sentinel validation** — once the Sentinel runtime accepts
  subscriptions, single-program detections can promote through
  retrieval-backed evidence; persistence + recurrence history will
  follow.
- **Atlas editorial handoff** — compose portfolio editorial when
  the meta operating-model pattern reaches `high` confidence.
- **Pattern detail drawer (overlay)** — embed the same view as a
  side-drawer on the I2 landing; deferred until a UX decision lands
  on full-page-vs-drawer.

## Honest fallbacks used

- `buildSentinelPatternDetailView` returns `null` when the pattern
  key is unknown OR when the tenant has no detection for that key.
  The route uses this to call `notFound()` instead of rendering an
  empty shell.
- The legacy `[patternSlug]` slug route was deleted to resolve a
  Next.js segment-name collision; the new `[patternKey]` route
  preserves legacy URL behavior by falling back to
  `<SeedTenantPattern>` for any non-canonical slug.
- The evidence trail openly captions "Evidence citations are not yet
  wired for this deterministic pattern view." rather than implying
  retrieval has occurred.
- Every evidence-trail row's `citationCaption` references the
  contributing program / signal type honestly; no row claims a real
  citation.
- Empty handoff / missing-inputs / affected-program lists each
  render a distinct empty-state copy that names the absence.
- Component imports are restricted to `next/link` and the I3 view
  helper module. Route imports are restricted to `next/navigation`,
  `assertTenantAccess`, `findTenantByRouteSlug`,
  `<SentinelPatternDetail>`, the legacy `<SeedTenantPattern>`
  fallback component, and the I3 helpers.

## Validation

- `npx tsc --noEmit --pretty false` — pass (after clearing stale
  `.next` cache from before the legacy `[patternSlug]/page.tsx`
  deletion).
- `npx jest src/__tests__/integration/intelligence/sentinel-pattern-detail.test.ts` — 33 passed
- Regression suites pass (S7, S9e, S9f, S9g, I1, I2).
- `npm run build` — pass; `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` registered as a server-rendered dynamic route, replacing the prior `[patternSlug]` slot.

Promotion to `verified` requires a live walk by founder confirming
the detail page renders correctly on
`/tenant/[slug]/intelligence/patterns/<patternKey>` for at least two
canonical demo tenants and two distinct pattern keys, and that the
"← Back to Intelligence" link returns to the I2 landing.

## Status

Code complete. Pending founder review.
