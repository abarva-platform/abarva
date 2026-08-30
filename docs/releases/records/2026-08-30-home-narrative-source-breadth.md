# 2026-08-30-home-narrative-source-breadth — Home Narrative Source Breadth

## Release ID

`2026-08-30-home-narrative-source-breadth`

## Status

`candidate`

## Plain-English Summary

This release makes the Home narrative writer aware of the full source-file coverage available to a tenant instead of only the files that happened to emit canonical records into the current prompt. Source-file summaries remain coverage context only; they are not citable evidence for executive claims.

## Layer Impact

Layer 1 / Client Intake: active tenant intake files are summarized as non-citable coverage context for the plan-only Home thesis path.

Layer 3 / Canonical Enterprise Model: no canonical tables or values change.

Layer 4 / Products: the ECL Home narrative writer now includes ECL source-ledger summaries in the EnterpriseSignalPacket before asking the verified thesis/chapter writer to generate prose.

Release lane: `global-control-lane` for shared generation behavior and `client-data-lane` only when an approved operator later runs tenant-scoped narrative generation.

## Client Applicability

- All clients: applies to Home narrative generation behavior when this writer is used.
- Specific clients: none.
- Internal only: generation scripts and tests.
- Public/demo only: none.
- Feature flag: existing Home ECL narrative write gates remain unchanged.

## Changes Included

- `scripts/data-build/enterprise-signal-packet.ts`
- `scripts/data-build/build-enterprise-thesis.ts`
- `scripts/data-build/build-home-chapters.ts`
- `scripts/data-build/__tests__/enterprise-signal-packet.test.ts`
- `tests/behaviors/enterprise-thesis-validation.test.ts`
- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

Follow-up: the Home ECL narrative writer default assessment id was aligned with the readback job
default so plan-only operator runs target the same loaded assessment unless an operator explicitly
overrides `ECL_DENSE_ASSESSMENT_ID`.

Follow-up: the ECL narrative packet now expands deterministic citable signals across application,
contract, infrastructure, data-flow, chapter-coverage, and source-breadth guardrail domains instead
of compressing the tenant into four broad signals. Source summaries remain coverage context only and
are not citable business evidence.

## QA / Validation

- `PASS` — `npx jest scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand`
- `PASS` — `npx jest tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand`
- `PASS` — `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- `PASS` — the ECL seam test now asserts that writer and readback default assessment ids match.
- `PASS` — the ECL seam test now asserts deterministic signal breadth across application,
  contract, infrastructure, data-flow, and source-breadth domains.
- `PASS` — `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- `PASS` — local no-key deterministic packet proof for one synthetic tenant showed active intake-file summaries included with separate raw-row and canonical-record counts.
- `PENDING` — ACA operator measurement after merge/deploy, if this script is needed in the running operator image immediately.

## Rollout Plan

Merge through PR. The script changes become available to the next repo-owned image build. Existing write paths remain gated by `HOME_ECL_NARRATIVE_WRITE=true` and `HOME_ECL_NARRATIVE_WRITE_APPROVED=true`.

## Deployment Authority

- Repo-owned deploy workflow: required only if an operator needs this script in ACA immediately.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be recorded by deploy workflow if deployed.
- ACA runtime invariant: required before claiming a deployed script change is live.
- Worker image invariant: not applicable.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: not for this script-only change; required before claiming Home page content is fixed live.

## Rollback Plan

Revert the PR. Existing generated narrative rows and product routes are not mutated by this change unless the separately gated writer is executed.

## Audit Evidence

- PR URL and CI run after opening the release candidate.
- Local command output listed above.
- Follow-up ACA operator job output if the writer is executed from the deployed image.

## Known Gaps

This change improves source breadth and measurement visibility. It does not by itself regenerate Home narrative rows, deploy a new image, or prove the rendered Home page is executive-ready.
