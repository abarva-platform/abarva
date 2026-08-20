# 2026-08-19-moves-extended-p0-intake-fields — Tenant-gated extended P0 intake fields

## Release ID

`2026-08-19-moves-extended-p0-intake-fields`

## Status

`candidate`

## Plain-English Summary

Moves' P0 Originate step (the first step when starting a new strategic initiative)
can now optionally capture six more pieces of information — which business segment
the initiative belongs to, whether it's front/middle/back-office, whether it's
clinical or non-clinical, a value hypothesis split into a number and a qualitative
statement, and a list of stakeholders. This is off for every tenant by default. It
is only visible for a tenant that has been explicitly opted in via a feature flag,
and today only `meridian-health` is opted in. Every other tenant's P0 flow is
unchanged — same 10 fields, same behavior, same persisted data shape.

## Layer Impact

Release lane: `client-data-lane` (tenant-scoped Moves capability, feature-flagged
per tenant, no global schema or shared-behavior change).

- **Layer 4 (Products) — Moves.** New optional UI fields in the P0 Originate
  scaffold (`StrategicMoveOriginateClient.tsx`), rendered only when the tenant's
  flag is on.
- **Layer 3 (Canonical Model) — not touched.** The new fields are persisted into
  the existing `engagements.charter` JSONB column under a new, namespaced key
  (`p0_extended_intake_fields_v1`), via a small pure module
  (`p0-extended-intake-fields.ts`) that mirrors the already-shipped
  `discovery_intake_v2` charter-transformer pattern. No schema migration, no new
  table, no change to `GATE_RULES` or `P0_CAPTURE_SECTIONS` (the phase-gate
  evaluation and P1+ phase-workspace read paths used by every tenant).

## Client Applicability

- All clients: no change (flag defaults off).
- Specific clients: `meridian-health` (opted in via
  `moves_extended_intake_fields_v1`'s `includeTenants`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_extended_intake_fields_v1` (tenant policy, default off).

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/6526
- Commit: `feat(moves): tenant-gated extended P0 intake fields`
- Files: `src/lib/features/registry.ts`, `src/lib/programs/p0-extended-intake-fields.ts`
  (new), `src/lib/programs/origination-submit.ts`,
  `src/app/(maestro)/strategic-moves/new/page.tsx`,
  `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`, plus new/updated
  tests in `src/lib/programs/__tests__/p0-extended-intake-fields.test.ts` and
  `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — 0 errors, full project.
- `npx eslint` on every touched file — 0 errors, 0 warnings.
- `npx jest` on the P0 origination + extended-intake test files — 33/33 passing,
  including the original 21 unchanged (proving byte-identical behavior for
  tenants without the flag) and 12 new tests covering: flag-off rendering (10
  steps, no Segment group), flag-on rendering (16 steps, Segment group present,
  Business Segment options sourced from the tenant-supplied prop), and the exact
  submit payload shape with the flag on vs. off.
- Live signed-in browser click-through of a real Move was attempted but blocked
  by a pre-existing local environment gap (no network route from this machine to
  the private Azure Postgres VNet, so the Responsible-AI acknowledgment write
  fails closed before any data-backed page renders) — not caused by this change.
  Recorded here as a known gap, not silently skipped.

## Rollout Plan

Merge to `main`. The existing `.github/workflows/aca-main-deploy.yml` builds and
deploys the shared Product/Lab web image automatically on merge — no ad-hoc Azure
commands are run by this change. Because the new behavior is entirely
feature-flag-gated and off by default, the deploy itself carries no behavior
change for any tenant until/unless a tenant is added to
`moves_extended_intake_fields_v1`'s `includeTenants`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing,
  unmodified by this change).
- Shared runtime mutators: none — this PR contains no `az` CLI commands, no
  Container App template changes, no environment variable changes.
- Approved image digest: n/a — no manual image/digest changes; the standard
  deploy workflow builds and pins the digest as usual.
- ACA runtime invariant: unaffected — no template/env/flag changes outside
  normal app code.
- Worker image invariant: unaffected — no worker code touched.
- Feature/env flag update path: `src/lib/features/registry.ts` (in-repo, code
  reviewed via this PR) — no `ABARVA_FEATURE_*` env var required for the current
  scope (Meridian is enrolled via `includeTenants` directly in code, matching
  the `discovery_intake_v2` precedent).
- Live signed-in proof required: yes, deferred — see Known Gaps below.

## Rollback Plan

Revert this PR (single squash commit) and merge to `main`; the next
`aca-main-deploy` run redeploys the prior image. No migration to reverse — the
new charter-JSONB key is additive and ignored by all existing readers. No
tenant needs to be un-enrolled from anything since only `meridian-health` was
ever enrolled.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6526
- Local typecheck/lint/test output captured in this session's transcript.
- `git log` on `feat/moves-phs-operating-model` for the exact commit.

## Known Gaps

- **Live signed-in browser proof of a real Move is not yet captured.** Local
  verification was blocked by the pre-existing localhost-to-Azure-VNet network
  gap described above. This should be captured on the next pass against a
  reachable environment (or by an operator with VNet access) before treating
  this as fully live-proven, even though the flag being off-by-default limits
  blast radius in the meantime.
- Business Segment's option list for `meridian-health` is currently a small
  hardcoded map in `new/page.tsx`, duplicating values that already live in
  `datasets/tenant-inputs/active/meridian-health/current/01b_business_segments.csv`.
  A follow-up should read from that governed source directly instead of the
  duplicate, once Moves has a data-plane path to tenant reference data of that
  shape.
