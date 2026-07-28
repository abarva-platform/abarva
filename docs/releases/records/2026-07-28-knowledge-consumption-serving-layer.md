# 2026-07-28-knowledge-consumption-serving-layer — Knowledge vNext consumption serving layer

## Release ID

`2026-07-28-knowledge-consumption-serving-layer`

## Status

`candidate`

## Plain-English Summary

Adds the read/serving half of the Knowledge vNext backend: a governed API that
reads the already-merged consumption schema and returns the data the (dormant,
admin-only) Home/Knowledge shell consumes. It also adds the canonical→V1 payload
shaping and a projection-build extension that fills the projections the current
build leaves empty. Nothing is activated: the shell flag stays OFF, no tenant is
switched to the real provider, and no data-plane write is performed by this
change (the build extension is DRY-RUN by default and gated behind an explicit
apply-ack + governed-host check).

## Layer Impact

Release lanes: **`experimental`** (feature-flagged, default-off) and
**`internal-admin`** (serves the admin-only preview shell). Not
`global-control-lane`, not `client-data-lane`, not `public-demo`.

- **Products (layer 4):** a read/serving surface (`/api/knowledge/consumption/*`,
  `/api/knowledge/ava`) over the layer-3 consumption schema. Read-only.
- **Canonical/consumption (layer 3):** consumed read-only; the projection-build
  extension writes only `consumption.*_v1` from accepted `knowledge.*`, and only
  when explicitly run (Bucket B). No schema/migration/publication/loader change.
- Source/Moves/Tower remain migration inputs only; not read as upstream truth.

## Client Applicability

- All clients: none (no behavior change).
- Internal only: the routes are auth-gated and return `not_loaded` for any tenant
  without built projections; the shell flag `home_knowledge_vnext` stays OFF.
- Feature flag: `home_knowledge_vnext` (unchanged, default OFF).

## Changes Included

- `src/lib/knowledge/consumption-server/` — reader, read-only pg seam, canonical→V1
  shaper.
- `src/app/api/knowledge/consumption/*` (8) + `src/app/api/knowledge/ava` — routes.
- `src/lib/knowledge/fixtures` + `consumption-client` — activation guard
  (`assertFixtureNamespace`).
- `scripts/knowledge/consumption-activation-gates.mjs` — 8-gate activation checklist.
- `scripts/knowledge/build-consumption-projections-v1.ts` — projection-build
  extension (DRY-RUN default; write requires `--apply` + `CONSUMPTION_PROJECTION_APPLY_ACK`
  + a governed Azure lab host).
- Docs: `docs/knowledge-vnext/BACKEND_BUILD_STATUS.md`.

## QA / Validation

- Typecheck (full project) clean; ESLint 0 problems.
- Tests: reader (6) + shaping (7) + activation guard (3) + existing vNext suites — green.
- Build extension DRY-RUN verified (writes nothing without an active DB + apply-ack).
- No route/flag activation; no data-plane mutation performed by this change.

## Rollout Plan

Squash-merge to `main`; the routes deploy via the repo-owned `aca-main-deploy.yml`
but stay dormant (auth-gated, flag OFF, projections empty until built). Activating
a tenant is a separate governed sequence (merge the review-ledger PR, record accept
decisions, run publish→baseline→projection→reconcile jobs) gated by the 8-gate
checklist — none of which this change performs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: n/a (no runtime image contract change here).
- ACA runtime invariant: unaffected.
- Feature/env flag update path: `home_knowledge_vnext` stays OFF.
- Live signed-in proof required: not for this change (nothing activated); required
  before any tenant flag flip, via the 8-gate checklist.

## Rollback Plan

Revert the PR; the new `src/lib/knowledge/consumption-server/**`, the
`src/app/api/knowledge/**` routes, and the two scripts have no other importers.
No data or migration to roll back (the build extension is not run by this change).

## Audit Evidence

- This record + `docs/knowledge-vnext/BACKEND_BUILD_STATUS.md`.
- Test suites `src/lib/knowledge/consumption-server/**/__tests__/*` and
  `consumption-client/__tests__/activation-guard.test.ts`.

## Known Gaps

- The merged projection-build populates only 5 of 14 projections and emits raw
  canonical payloads; the shaping module + build extension here close that on the
  code side but must be run (Bucket B) against accepted lab data to take effect.
- aVa uses the deterministic reasoning provider; audited Anthropic `ai-egress`
  wiring is the tracked follow-on (drops in behind the same interface).
- Bucket-B governed ops (merge the review ledger, record accept decisions, run the
  ACA jobs) remain human-gated; the 8-gate checklist is the flag-flip exit criteria.
