# PROD8 · Production Readiness Visual + Decision Flow Refresh

**Wave:** wave-17
**Branch:** `wave17/prod8-production-readiness-visual-flow`
**Type:** admin-ui
**Status:** code_complete

## Goal

Refresh `/platform/admin/production-readiness` to read like a **decision
control plane**, not a tracker dashboard. The existing
`ProductionReadinessTracker` and `ProductionReadinessLivePanel` keep doing
exactly what they did. PROD8 adds a new calm summary surface above them
that answers the operator-facing questions in eight ordered sections.

## What landed

- `src/components/admin/ProductionReadinessDecisionFlow.tsx`
  Client React component. Renders eight sections in this order:
  1. Overall readiness brief (headline + as-of + source claim)
  2. Can we demo? (answer chip + rationale + blockers)
  3. Can we pilot? (answer chip + rationale + blockers)
  4. What blocks production?
  5. Component readiness (one-line pointer to the panel below)
  6. Evidence and testing basis
  7. Live status caveat (manifest-backed; not a live monitoring feed)
  8. Next five actions (numbered, with owner per item)

- `src/app/(maestro)/platform/admin/production-readiness/page.tsx`
  Mounts `ProductionReadinessDecisionFlow` above the existing
  `ProductionReadinessLivePanel`. The live panel internally renders the
  canonical `ProductionReadinessTracker`; PROD8 does not duplicate it.

- `src/__tests__/integration/admin/production-readiness-decision-flow.test.ts`
  12 source / type tests. No React rendering, no jsdom.

## Design canon followed

- Off-white surface `#FBFAF7`, white cards `#FFFFFF`, hairline
  border `#E8E6E1`.
- Text ink `#0A0C12`, body `#1F2433`, muted `#525866`.
- Navy accent `#1B2B5C` only. No teal, no green, no neon.
- DM Sans body, JetBrains Mono eyebrows.
- Calm hierarchy. Answer chips read YES (light navy) / PARTIAL (muted
  warm) / NO (muted red) — no fake live-green grids.

## Honesty

- The headline is `"AbarVa is demo-ready. Pilot is partial. Production
  has explicit blockers."`. No production-ready claim.
- The live-status caveat is always rendered when `showLiveCaveat !==
  false`: explicit text says the page reflects the manifest, not a live
  monitoring feed.
- No `production_ready: true` anywhere in the component source.

## Tests

- `production-readiness-decision-flow.test.ts` (12 tests):
  exports, demo / pilot / production-blocker / next-actions / live
  caveat wording, no teal hex, no false production-ready promotion,
  page imports DecisionFlow + Tracker, navy accent used.
- Existing `production-readiness-tracker.test.ts` continues to pass —
  the tracker behavior is untouched.

## Out of scope

- No new data source. Manifest read remains in `lib/admin/production-readiness.ts`.
- No live monitoring. PROD7 owns real GitHub Checks / Vercel polling.
- No tracker behavior changes. PROD8 is additive.
