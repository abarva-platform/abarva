# 2026-10-10 — Synthetic Moves case-number proposal

## Release ID

`2026-10-10-moves-demo-case-numbers-seed`

## Status

`candidate-for-owner-review`; no load approval or data-plane execution.

## Plain-English Summary

This proposal declares 17 synthetic assumptions-register inputs and one
structured value-plan input for one explicitly bound demo Move. Six register
rows are ROM unit hours; three are ROM factors; eight are value inputs. The
value plan includes a platform spend-reduction scenario and a report-writer
capacity scenario. The capacity scenario has no role or contract release path,
so the existing value engine counts zero monetary benefit for it.

The committed local preview prices two invented ROM releases with synthetic
rates and evaluates a three-year value case. It is a deterministic simulation,
not a readback of the current Move, a Finance-approved forecast, a signed-in
product result, or a claim that the deck is ready.

## Layer Impact

- Release lane: `client-data-lane`, synthetic-demo scope only.
- Layer 1: no client intake change. A committed synthetic benchmark fixture is
  a review input, never client-attested source data.
- Layer 2: no adapter change.
- Layer 3: proposed Move-scoped register rows and `value_plan` capture. The
  existing register store is the planned mutation path for rows. The shared
  governed P4 capture writer required by the job does not exist yet, so apply
  is explicitly blocked before a data-plane read or write.
- Layer 4: no product or presentation code change.

## Client Applicability

- All clients: no.
- Specific clients: one synthetic demo Move only, bound by its exact ID,
  authenticated client record, canonical tenant registry and application
  tenant key. No live client receives this candidate.
- Internal only: the proposal and read-only operator dry-run path.
- Public/demo only: synthetic planning inputs after a future approved load.
- Feature flag: no flag changes in this PR.

No other Move, tenant, dataset, historic approval, phase state or product
surface changes. No live client data or client-specific claim is included.

## Changes Included

- Manifest: `docs/governance/dataset-manifests/moves-demo-case-numbers-seed-v1.json`.
  Dataset declaration is distinct from its absent `load_approval`.
- Exact rows and value case: `datasets/tenant-inputs/meridian-health/moves/demo-case-numbers-seed-v1.json`.
  The owner may inspect every value, role, citation, confidence and expected
  register ID there.
- Benchmarks: `scripts/moves/fixtures/demo-case-numbers/synthetic-benchmarks-v1.json`.
- Offline proof: `docs/releases/proofs/2026-10-10-moves-demo-case-numbers-local-preview.json`.
- Job and workflow: the job validates the source-set hash, Move, tenant,
  manifest and idempotency key; dry-run reads and reports the register without
  writing. Apply refuses at its runtime boundary because the shared governed
  P4 capture writer is unavailable. The workflow exposes only dry-run.

## Exact Input and ID Boundaries

The source-set hash covers the exact seed JSON, benchmark JSON and reused
register-seed JSON bytes, in that order with newline separators. The job's
idempotency key binds that hash to the exact Move ID. The new rows expect
`DL5`–`DL13` and `V5`–`V12`; reused rows expect `V1`, `V3`, `V4`, `A2` and
`A3`. IDs are conditional until a governed live read. The job refuses a
different allocation or changed existing row rather than retargeting an input.
The current committed `A3` stores 50% retirement of 620 workbooks, described
as about 310, not the absolute number 310. No new workbook count is invented.

Every lever numeric reference that the value-model schema permits is a
register ref. The current schema carries timing and cost as scalar fields;
the proposal binds start month to existing `V3` and the one-time cost to
existing `V1` with explicit equality checks in the offline preview. Those
checks must also run against authenticated readback before a future apply.
ROM factors are scalar capture fields in the current ROM schema; their source
strings cite `DL11`–`DL13`, and a future writer must verify equality.

## QA / Validation

- Pass: local deterministic value and ROM engines; exact values, inputs,
  hashes and formula output are in the committed preview proof.
- Pass: ten focused offline tests, including changed-input, ID-allocation and
  capacity-rule mutations; 41 existing register-seed tests also pass.
- Pass: typecheck, scoped lint, `audit:lib-orphans`, route and export
  reachability, test coverage census (+2 covered test files), tenancy census,
  manual check, and all context/corpus validation modes.
- Pass: dataset manifest validation.
- Not run: any database read/write, ACA job, workflow, live readback, signed-in
  page, P4 capture, or deck preview. These actions are outside this proposal's
  authorization.
- Pass: `npm run release:check -- --base origin/main --head HEAD` (all 11 gates).

## Rollout Plan

Owner reviews the exact rows and source-set hash first. A separate commit may
add a named-person `load_approval` for that exact Move and hash. Before any
apply, a shared governed capture writer must be added and verified for a P4
`value_plan` when the Move is at P3, with revision fencing and no phase
advancement. Only the designated operator may later dispatch a governed ACA
job under that approval. Successful job readback, quality gate and signed-in
P3/P4/deck proof are separate later states.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the
  only shared web deploy authority; this PR does not deploy.
- Shared runtime mutators: none authorized here.
- Approved image digest: none for this candidate.
- ACA runtime invariant: not evaluated because no deploy occurs.
- Worker image invariant: not evaluated because no worker update occurs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after any later governed apply and
  deployment, before claiming P3, P4 or deck readiness.

## Rollback Plan

There is no rollout in this PR. Revert this proposal to remove the candidate
files. If a future separately approved apply occurs, rollback must be a
Move-scoped governed correction that preserves append-only register history;
do not delete prior rows or reset phase state.

## Audit Evidence

The local preview proof records the exact input hashes, all proposed rows,
lever references and engine outputs. The job contract records the scoped Move,
tenant, source-set hash, idempotency key, build SHA, image digest, operator,
plan, readback and Blob proof location when a future apply is implemented.
There is no live proof bundle for this candidate.

## Known Gaps

The shared governed P4 capture writer is absent. The current signed-in route
writes `program_modules` directly inside the web request, so an ACA job cannot
reuse it without an extraction. The smallest shared path is a domain writer
called by both route and job that checks tenancy, Move identity, phase scope,
capture revision and exact `value_plan` model, then writes only that section
with audit/readback. The current route has no explicit current-phase check,
but this job must not rely on that omission as permission to write future
phase data. This PR leaves apply fail-closed.

Current live register IDs, P3 ROM record contents, approved rate basis and P4
capture state were not read. Accordingly, the local ROM cost is a synthetic
fixture result and cannot predict live pricing. Existing `V4` and `A2` are
open in the committed seed; the local value engine reports them as needing
validation even though it computes a planning preview. No Finance attestation
or investment-deck readiness is implied.
