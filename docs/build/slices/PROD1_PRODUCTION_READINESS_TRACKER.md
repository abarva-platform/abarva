# PROD1 - Production Readiness Tracker

Slice ID: PROD1
Slice name: Production Readiness Tracker
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward

## What Changed

- Added `docs/build/production-readiness.json`, a deterministic,
  machine-readable manifest for full-flow, pilot, and production
  readiness.
- Added `docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md`, the update
  protocol for keeping the manifest honest after slices, PRs,
  validation, live walks, and deploy checks.
- Added `src/lib/admin/production-readiness.ts`, a deterministic read
  model that imports the manifest, computes the summary, ranks blockers,
  ranks next actions, computes the overall readiness percent, and lists
  the lowest-readiness components.
- Added `src/components/admin/ProductionReadinessTracker.tsx`, an
  internal Steward admin surface showing the brief, score, readiness
  grid, testing gates, blockers, and next actions.
- Added
  `src/app/(maestro)/platform/admin/production-readiness/page.tsx` with
  the same admin-only Clerk guard pattern used by Build Progress.
- Added a minimal discoverability link from `/platform/admin` to the new
  Production Readiness tracker.
- Added
  `src/__tests__/integration/admin/production-readiness-tracker.test.ts`
  covering manifest shape, deterministic read model behavior, readiness
  gates, blockers, next actions, false-ready prevention, and module
  hygiene.
- Updated `docs/build/build-slices.json` with PROD1 set to
  `code_complete`.
- Explicitly tracks Source / Outsourcing as a first-class component with
  `status: scaffolded`, `maturity: foundation_validation`, and
  `productionRiskLevel: medium_high`.

## What Is Deterministic Today

- The manifest is file-backed JSON in `docs/build`.
- `buildProductionReadinessView()` is pure and returns the same view for
  repeated calls.
- `overallReadinessPercent` is computed from component status weights.
- Component IDs, readiness dimensions, testing gates, blocker ordering,
  and recommended actions are deterministic.
- The page renders only the read model. It does not fetch runtime state.
- The tracker does not deploy, poll Vercel, or call a model/API.

## How This Supports Full-System Testing

The tracker gives the founder/operator a single Steward-owned view of:

- What product areas exist.
- Which areas are scaffolded, code complete, tested, full-flow ready,
  pilot ready, or production ready.
- Which dimensions are weak by component.
- Which testing gates are passing, partial, not automated, not run, or
  blocked.
- What blocks production readiness.
- What should be fixed next.

This creates a practical morning-review surface before a full-system
test: start with the highest-severity blocker, verify the lowest-readiness
component, then record the evidence back into the manifest.

## How The Manifest Updates Over Time

Update `production-readiness.json` after:

- Each implementation slice.
- Each PR.
- Each validation command.
- Each live route/persona walk.
- Each Vercel deploy verification.
- Each security/governance review.
- Each blocker resolution.

Every future Codex or Claude Code build slice must evaluate whether it
changed production readiness. If it did, update
`docs/build/production-readiness.json`; if not, the final report must
say why not. Future slice reports must name the changed component, prior
status, new status, gates affected, blockers added/removed, and next
readiness action.

Promote statuses only with evidence. `code_complete` is not
`production_ready`, and merged code is not a live deploy.

## What Is Not Production Monitoring Yet

PROD1 is not live production monitoring. It does not:

- Poll Vercel.
- Check production routes.
- Crawl personas.
- Read runtime logs.
- Read observability traces.
- Check uptime.
- Call the Model Gateway.
- Resolve live Evidence Ledger citations.
- Inspect production ingestion/parsing health.

The page is intentionally honest: it is an internal readiness tracker,
not an operations monitor.

## Deferred

- Real CI/Vercel polling.
- Live route testing.
- Automated persona crawler.
- Security scan integration.
- Production observability.
- DB-backed readiness state.
- Live Model Gateway readiness.
- Live Evidence Ledger readiness.
- Production ingestion/parsing readiness.
- Steward runtime follow-ups from the admin page.
- Source-specific Nexus API stub.
- Source authenticated visual QA.
- Source upload/evidence readiness path.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts`
- `npm run build`
- `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts`
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts`

## Honest Fallbacks Used

- `lastVerifiedCommit` is `null` because PROD1 does not claim verified
  production readiness.
- Vercel gates are `not_run`; no deploy polling is implemented.
- Live persona gates are `not_automated`; manual/live walk evidence is
  still required.
- Model Gateway is `not_started`.
- Evidence Ledger, ingestion/parsing, audit/governance, and deployment
  readiness remain blocked/scaffolded until production implementations
  exist.
