# S9f · Tower · Programs pressure cards

Slice ID: S9f
Slice name: Tower · Programs pressure cards
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

First Tower UI consumer of the deterministic Programs → Control Tower
signal read model created in S9e. Renders portfolio pressure as a new
section on `/tenant/[tenantSlug]/tower`. **No Atlas runtime touch, no
Nexus runtime touch, no agent runtime touch, no migrations, no model
calls.**

## What changed

- New helper
  [src/lib/tower/program-pressure-view.ts](../../../src/lib/tower/program-pressure-view.ts):
  - `buildTowerProgramPressureView(tenant, topN?)` returns a
    deterministic display object: `tenant`, `signals`, `summary`,
    `topCards`, `evidenceValueGapCount`, `strip` (executive metrics).
  - Imports **only** from
    `@/lib/programs/programs-control-tower-signals` (S9e). The helper
    does not re-derive signals from canonical view modules.
  - Default `topN` is `5`, exported as
    `TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N`.

- New component
  [src/components/tower/ProgramPressureCards.tsx](../../../src/components/tower/ProgramPressureCards.tsx):
  - Server component (no client interactivity) that renders an
    executive strip (Program pressure signals · Top severity ·
    Programs affected · Evidence/value readiness gaps), severity and
    type chip rows, and the top-N pressure cards.
  - Each card includes the program code, signal type label, severity
    badge, title, summary, missing-input list (capped at three with
    overflow count), recommended action, and a "Open program →" link
    to the canonical `routeHref`.
  - Severity colors: `critical` red · `high` amber · `medium` teal ·
    `low` muted.

- Wiring at
  [src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx](../../../src/app/%28maestro%29/tenant/%5BtenantSlug%5D/tower/page.tsx):
  - `assertTenantAccess` and `notFound` behavior unchanged.
  - Returns a column layout: new `<ProgramPressureCards tenant={...}/>`
    above the existing `<SeedTenantTower>` content.
  - No other Tower components touched. Subsurface routes
    (`/tower/[surface]`) untouched.

- New tests
  [src/__tests__/integration/tower/program-pressure-cards.test.ts](../../../src/__tests__/integration/tower/program-pressure-cards.test.ts):
  20 deterministic tests covering view generation per tenant,
  top-card sort invariants, strip values, route-href correctness,
  determinism, never-claims-evidence-or-value-as-ready, no-fabricated-
  dollar-values, the empty-tenant edge case, and module hygiene
  (helper consumes S9e exclusively; component does not import Atlas,
  Source, Nexus, agent runtime, legacy /programs, mock.ts, or auth).

## How it consumes the S9e read model

The helper wraps two S9e public APIs:

```ts
import {
  buildTenantProgramControlTowerSignals,
  summarizeProgramControlTowerSignals,
} from '@/lib/programs/programs-control-tower-signals';
```

It does **not** import `programs-canonical-view.ts`,
`programs-nexus-rail-view.ts`, or any seed module directly. The S9e
read model is the single source of truth; downstream consumers stay
on its contract. A test asserts this with a static-source check.

## What is visible in Tower today

- Header: `<tenant> · Programs pressure · seed-only` plus title
  "Programs pressure signals".
- Executive strip with four metrics: total signals, top severity
  (uppercase), programs affected, evidence/value readiness gap count.
- Two sub-strips: counts by severity (`critical`/`high`/`medium`/
  `low`) and counts by type (`exec`/`value`/`gate`/`evidence`/
  `context`/`deliverable`). Empty buckets are suppressed.
- Top-5 pressure cards (configurable via `topN`), sorted by
  S9e's canonical severity-desc → type-rank → id-asc rule. Each card
  links to `/tenant/<routeSlug>/programs/<programSlug>`.
- Footer caption: "Composed deterministically from the S9e Programs
  Control Tower signal read model. No live agent or model call."

## What is NOT yet wired (deferred)

- **Atlas runtime subscriber.** No portfolio editorial composition.
  The cards render the read model directly; Atlas does not yet
  observe or summarize them.
- **Persistence.** No append-only signal log, no dedup-by-id, no
  alert cadence.
- **Notifications.** No email, Slack, or in-app banner delivery.
- **SLA / aging.** Signals carry no timestamps because the read model
  is deterministic and time-free.
- **Tower subsurface integration.** The new section appears on the
  tenant Tower landing only. Subsurface routes (`/tower/[surface]`)
  still render the seeded scheduled-state placeholder.
- **Live-state evidence/value upgrades.** Until a future seed-
  population slice lands evidence references and value-ledger
  entries, every card carries `evidenceStatus: 'not_seeded'` and
  `valueStatus: 'not_seeded'`.

## What is deferred to the next Atlas/Tower slice

- **Atlas signal subscriber slice.** Atlas reads
  `summarizeProgramControlTowerSignals(...)` counts and composes
  portfolio editorial that names the top pressures with confidence.
- **Tower pressure-card persistence + dedup slice.** Append-only log
  keyed by signal id, replay safely across reruns.
- **Tower aging / SLA slice.** Once persistence lands, signals can
  carry first-seen and last-seen timestamps.
- **Notification delivery slice.** Cadence, channel choice, opt-out.

## Honest fallbacks used

- The Tower component renders an empty-state card when the tenant has
  zero signals; copy explicitly references the deterministic seed
  source instead of hiding the absence.
- The strip's "Top severity" reads `NONE` (not blank) when no signals
  are present.
- Cards never claim `evidenceStatus: 'ready'` or
  `valueStatus: 'ready'`; tests assert this.
- Cards never emit a dollar amount in any string field; tests assert
  this.
- Severity-desc sort is preserved end-to-end from S9e through the
  view helper to the rendered cards.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/tower/program-pressure-cards.test.ts` — 20 passed
- Regression suites pass (S7, S9, S9b, S9c, S9d, S9e).
- `npm run build` — pass

Promotion to `verified` requires a live walk by founder confirming
the new section renders correctly on `/tenant/[slug]/tower` for at
least two canonical demo tenants.

## Status

Code complete. Pending founder review.
