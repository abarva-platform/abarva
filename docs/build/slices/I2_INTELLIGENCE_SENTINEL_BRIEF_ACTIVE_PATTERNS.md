# I2 · Intelligence · Sentinel Brief + Active Patterns

Slice ID: I2
Slice name: Intelligence · Sentinel Brief + Active Patterns
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

First Intelligence-page consumer of the deterministic I1 Sentinel
pattern detection read model. Renders a tenant Intelligence landing
that frames Sentinel as actively mining the Fabric: a brief panel at
the top, then a cards grid of active pattern detections. **No live
Sentinel runtime, no Atlas runtime touch, no Nexus runtime touch, no
agent runtime touch, no migrations, no model calls.**

## What changed

- New helper
  [src/lib/intelligence/sentinel-pattern-view.ts](../../../src/lib/intelligence/sentinel-pattern-view.ts):
  - Public types: `SentinelBriefSourceLabel`,
    `SentinelBriefFollowUp`, `SentinelBrief`,
    `SentinelPatternCard`, `SentinelIntelligenceView`.
  - `buildSentinelIntelligenceView(tenant)` — composes the full
    deterministic view (detections, summary, brief, cards).
  - `buildSentinelBrief(tenant, detections, summary)` — pure brief
    composer.
  - `buildPatternDetectionCards(detections)` — projection into card
    view-models.
  - Imports **only** from `@/lib/intelligence/sentinel-pattern-detections`
    (I1) and `@/lib/programs/enhancement-seed-planner`. No live
    Sentinel runtime touch.

- New component
  [src/components/intelligence/SentinelActivePatterns.tsx](../../../src/components/intelligence/SentinelActivePatterns.tsx):
  - Server component (no client interactivity in this slice).
  - Renders the Sentinel brief panel at the top: severity +
    confidence chips, top pattern, what Sentinel sees, why it
    matters, programs affected, recommended action, suggested
    handoffs, three disabled "Ask Sentinel" follow-up chips, and an
    interpretation-basis caption.
  - Below the brief, an Active Pattern Detections grid with one
    card per detection: pattern name, severity + confidence chips,
    title, summary, why-it-matters caption, affected program list
    (linking to canonical Programs detail), missing-input details,
    recommended action, handoff chips, and an "Open pattern detail
    →" link to the I2/I3 routeHref.
  - Empty-state copy when the tenant has no active detections,
    referencing the seed source honestly.
  - Footer caption: "Composed deterministically from the I1 Sentinel
    pattern detection read model. No live Sentinel runtime, no live
    retrieval, no Atlas / Claude / OpenAI invocation."

- New tenant route
  [src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx](../../../src/app/%28maestro%29/tenant/%5BtenantSlug%5D/intelligence/page.tsx):
  - `assertTenantAccess(tenantSlug)` invoked first to preserve the
    tenant-isolation guard contract.
  - `findTenantByRouteSlug(tenantSlug)` resolves the seed plan;
    `notFound()` on miss.
  - Renders the I2 component inside a maestro-style page wrapper.
  - No model / API calls. No client interactivity.

- New tests
  [src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts](../../../src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts):
  35 deterministic tests covering view generation per tenant, brief
  composition, follow-up canonical order, source-label invariants,
  card-detection 1:1 correspondence, route-href invariants, no-
  fabricated-dollar-values, the empty-tenant edge case, and module
  hygiene (helper, component, and route page never import Sentinel
  runtime, Atlas runtime, Nexus runtime, agent runtime, Source UI,
  legacy /programs, mock.ts, or auth implementation).

## How it consumes the I1 detection read model

```text
buildSentinelPatternDetectionsForTenant(tenant)        ← I1
        │
        ▼
buildSentinelIntelligenceView(tenant)                  ← I2
        │
        ▼
{ detections, summary, brief, cards }                  ← deterministic
        │
        ▼
<SentinelActivePatterns tenant=…/>                     ← I2 component
        │
        ▼
/tenant/<slug>/intelligence                            ← I2 route
```

The view helper imports only the I1 read model. It does not re-derive
detections from the S9e signal layer, never instantiates a live
Sentinel runtime, and never invokes a model. A static-source check in
the test asserts this.

## What is visible on the tenant Intelligence page today

- Header: `<tenant> · Sentinel intelligence · seed-only` plus the
  title "Active pattern detections".
- Sentinel brief panel:
  - Eyebrow + source label ("Sentinel brief · pattern detection
    read model" or "deterministic seed").
  - Severity chip + confidence chip on the right (with
    interpretationBasis tooltip).
  - Five labeled brief lines: Top pattern · What Sentinel sees ·
    Why it matters · Programs affected · Recommended action.
  - "Handoffs" line listing top-detection handoff targets.
  - "Ask Sentinel · suggested follow-ups · 3" footer rendering three
    `<button disabled aria-disabled="true">` chips with each
    follow-up's reason in the tooltip and a "deferred · live
    sentinel runtime" sub-label.
  - Footer caption echoes `interpretationBasis`.
- Active pattern detection cards:
  - One card per detection in the I1 sort order.
  - Each card shows pattern name (eyebrow), severity + confidence
    chips, title, summary, why-it-matters caption, programs &
    source-signal-count stats, affected program list (top 4 +
    overflow), collapsible missing-inputs detail (top 5 + overflow),
    recommended action, handoff chips, and a routed "Open pattern
    detail →" link.
- Footer caption: "Composed deterministically from the I1 Sentinel
  pattern detection read model. No live Sentinel runtime, no live
  retrieval, no Atlas / Claude / OpenAI invocation."

## What is deterministic today

- View is byte-equal across repeated calls for the same tenant.
- Suggested follow-up ids are fixed and ordered:
  - `sentinel-followup-walk-top-pattern`
  - `sentinel-followup-program-cross-section`
  - `sentinel-followup-recurrence-history`
- All follow-ups render `enabled: false`; clicking them does
  nothing today (test enforced).
- `sourceLabel` is `'pattern_detection_read_model'` when detections
  exist, otherwise `'deterministic_seed'` (test enforced).
- Severity / confidence labels are uppercase canonical strings
  (test enforced).
- Brief never invents a dollar amount in any string field (test
  enforced).
- Card detection ids follow the canonical I1 form
  `sentinel:<tenantKey>:<patternKey>` and one card maps to one
  detection (test enforced).
- Affected-program `routeHref` resolves to the canonical
  `/tenant/<routeSlug>/programs/<programSlug>` (test enforced).
- Detection `routeHref` points to the future
  `/tenant/<routeSlug>/intelligence/patterns/<patternKey>` route. The
  pattern slug route is already wired (S9 era seed pattern shell);
  I3 will swap it for a deterministic pattern-detail surface keyed by
  `patternKey` instead of legacy seed slug.

## What is NOT yet live Sentinel runtime

- No Claude / OpenAI / Pinecone invocation.
- No streaming compose, no live retrieval.
- No persisted detection log; every page load rebuilds from seed.
- No subscription to live signal-summary deltas.
- No recurrence tracking — confidence cannot promote past `high`
  via cross-steering recurrence yet.
- The "Ask Sentinel" follow-up chips are visible but disabled —
  clicking them does nothing today; they exist to advertise the
  future affordance.

## What is deferred to I3 (and beyond)

- **Pattern detail drawer (I3)** — a deterministic per-pattern
  detail surface keyed by `patternKey`, listing every contributing
  S9e signal, the evidence trail, and the affected programs.
- **Evidence trail (I3)** — render the I1 `evidenceSignals[]`
  projection inline with sourcing and route-back to the originating
  Programs route.
- **Pattern graph traversal (I3+)** — navigate from a detection to
  its parent operating-model pattern and back to per-program
  contributions.
- **Live Sentinel validation** — a separate slice once the Sentinel
  runtime accepts subscriptions; promote single-program detections
  through retrieval-backed evidence, persist recurrence history.
- **Atlas editorial handoff** — compose portfolio editorial when the
  meta operating-model pattern reaches `high` confidence.
- **Notification delivery** — cadence, channel, opt-out for
  detection-class alerts.
- **Live evidence + value signals** — once a future seed-population
  slice lands evidence references and value-ledger entries, this page
  automatically thins out without any change here.

## Honest fallbacks used

- Empty-tenant brief uses distinct copy that names the absence ("No
  active pattern detections in the seed today.") rather than
  fabricating a Sentinel headline. `topSeverity: 'NONE'`,
  `topConfidence: 'NONE'`, `sourceLabel: 'deterministic_seed'`,
  `suggestedHandoffs: []`.
- Suggested follow-up chips render `enabled: false` and the component
  renders them with `disabled` + `aria-disabled="true"` plus a
  "deferred · live sentinel runtime" sub-label. Clicking does
  nothing.
- Severity / confidence chips and accent borders source from the
  I1-sorted top detection — never from a fabricated rank.
- Missing-inputs section is collapsible with a "+ N more" overflow
  marker; the brief never claims completeness it does not have.
- Component never imports Sentinel runtime / Atlas / Nexus / agent
  runtime / Source / mock.ts / auth implementation. Component
  imports are restricted to the I2 view helper module. The route
  page imports only `assertTenantAccess`, `findTenantByRouteSlug`,
  `notFound`, and the I2 component.
- The route uses the existing `assertTenantAccess` guard so cross-
  tenant access is denied with the same `forbidden()` semantics as
  every other tenant-scoped page.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts` — 35 passed
- Regression suites pass (S7, S9e, S9f, S9g, I1).
- `npm run build` — pass; `/tenant/[tenantSlug]/intelligence` registered as a server-rendered dynamic route.

Promotion to `verified` requires a live walk by founder confirming
the new section renders correctly on `/tenant/[slug]/intelligence`
for at least two canonical demo tenants and that the disabled "Ask
Sentinel" chips are visible-but-non-interactive as intended.

## Status

Code complete. Pending founder review.
