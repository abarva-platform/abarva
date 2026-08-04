# 2026-08-02-source-contract-optimization-canvas-wiring — Reconnect the contract-optimization profile panel to the live event canvas

## Release ID

`2026-08-02-source-contract-optimization-canvas-wiring`

## Status

`candidate`

## Plain-English Summary

The Source module has a persisted "contract optimization" capability (structured
findings, negotiation levers, recommended path) for a guarded SkyHarbor demo
event, built and iterated in earlier releases. That panel component was only
ever mounted inside an older canvas implementation
(`UniversalCanvasShell`/`ResponsesStageView`) that the live event route no
longer renders — the live route renders `SourceAnalyticsCanvas` instead. As a
result the panel, and the real data already persisted for it, was unreachable
from any page a signed-in user could actually visit.

This change adds a read function that fetches the persisted profile for the
exact event id being viewed (not a name/keyword heuristic — the existing
`isSkyHarborContractOptimizationEvent` helper is intentionally not used as the
render gate, since its keyword matching would also match unrelated SkyHarbor
events by name), and renders the panel additively above the existing stage
workspace in `SourceAnalyticsCanvas` when a profile row exists for that event.

## Layer Impact

- `global-control-lane`: `SourceAnalyticsCanvas` is shared code across every
  tenant's Source event pages. The new prop defaults to `null` and the new
  panel only renders when a matching persisted profile row is found, so
  behavior for every other tenant and event is unchanged.

## Client Applicability

- All clients: the code path is shared; the panel only actually renders for
  the specific SkyHarbor demo event that has a persisted contract-optimization
  profile row.
- Specific clients: SkyHarbor (synthetic demo tenant) only, in practice.
- Internal only: none.
- Public/demo only: the rendered content is synthetic demo data, already
  labeled `synthetic_demo: true` in its own payload.
- Feature flag: none — gated by data presence (profile row exists for this
  exact event id), not a flag.

## Changes Included

- `src/lib/source/contract-optimization/read.ts` (new): tenant-alias-tolerant,
  event-id-scoped read of `public.source_contract_optimization_profiles.profile_payload`.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: new
  optional `contractOptimizationProfile` prop; renders
  `ContractOptimizationProfilePanel` above the stage workspace when present.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: fetches the profile
  (cheap client-key pre-filter, then an event-id-scoped query) and passes it
  through.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx "src/app/(maestro)/source/events/[eventId]/page.tsx" src/lib/source/contract-optimization/read.ts`
- PASS (13/15 suites; 2 pre-existing failures unrelated to this change,
  confirmed identical with this change stashed out):
  `npx jest src/components/source/canvas/analytics/__tests__/ src/components/source/canvas/contract-optimization/__tests__/ src/lib/source/contract-optimization/`
  - Pre-existing, unrelated: `StrategyStage.test.tsx` (stale `intel-panel`
    testid expectation) and `contract-optimization-mve.test.ts` (stale
    contract-name string assertion). Neither touches the files this release
    changes.
- NOT YET DONE: live signed-in browser proof that the panel renders with real
  findings/levers on `app.abarva.ai` for the SkyHarbor contract-optimization
  event. Required before this release can be called `released` — local dev in
  this environment cannot reach the private VNet Postgres to verify with real
  data.

## Rollout Plan

Merge through PR to `main`; the repo-owned `aca-main-deploy` workflow builds
and deploys automatically. No migration, no flag, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (required, standard path).
- Shared runtime mutators: none — this PR does not run any `az` command.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image,
  100% traffic revision image, and worker job images must match the approved
  digest).
- Worker image invariant: not applicable — no worker changes.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: required before this release is marked
  `released`.

## Rollback Plan

Code rollback by reverting the PR. No migration, no data mutation — the new
read path only selects from an existing table; nothing is written.

## Audit Evidence

- This PR's diff and CI run.
- Post-deploy: live signed-in screenshot of the SkyHarbor contract-optimization
  event's Responses stage showing the rendered panel.

## Known Gaps

- The underlying `isSkyHarborContractOptimizationEvent` keyword-matching
  helper (used elsewhere — `cxo-report`, `deal-pack`, `contract-optimization/brief`
  routes) is broader than an exact event-id match and would also match other
  SkyHarbor events whose name happens to contain "outsourcing" or "contract".
  This release does not depend on that helper for its own render gate, but the
  helper itself is unchanged and remains a latent precision gap in those other
  routes — out of scope for this change.
- Live signed-in verification is pending (see QA/Validation).
