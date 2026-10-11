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

The committed local preview prices a shared foundation once plus certified
measures and workbook-certification/retirement releases across a 49-week,
10-FTE synthetic plan. The $4.41M plan ROM is 88.2% of the existing $5M
budget ceiling; low and high are $3.3075M and $6.615M. The three-year
value case uses these ROM outputs as its only cost basis, producing a
$275,130.75 plan NPV, month-31 payback, and 27.4884% three-year ROI.
It is a deterministic simulation,
not a readback of the current Move, a Finance-approved forecast, a signed-in
product result, or a claim that the deck is ready.

## Layer Impact

- Release lane: `client-data-lane`, synthetic-demo scope only.
- Layer 1: no client intake change. A committed synthetic benchmark fixture is
  a review input, never client-attested source data.
- Layer 2: no adapter change.
- Layer 3: proposed Move-scoped register rows and `value_plan` capture. The
  existing register store is the planned mutation path for rows. The P4
  capture persistence is extracted for signed-in and operator use, with a
  tenant/Move/phase/revision preflight and capture audit. No load occurs here.
- Layer 4: ROM-linked value cases now read the current approved P3 snapshot
  and block while it is absent or stale. Consultant screen and reference-deck
  figures use one presentation formatter; engine and workbook cents remain exact.

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
  writing. Apply remains unavailable under the manifest's absent named load
  approval. The workflow exposes only dry-run.

## Exact Input and ID Boundaries

The source-set hash covers the exact seed JSON, benchmark JSON and reused
register-seed JSON bytes, in that order with newline separators. The job's
idempotency key binds that hash to the exact Move ID. The new rows expect
`DL5`–`DL13` and `V5`–`V12`; reused rows expect `V1`, `V3`, `V4`, `A2` and
`A3`. IDs are conditional until a governed live read. The job refuses a
different allocation or changed existing row rather than retargeting an input.
For this candidate, the source-set SHA-256 is
`10ab70b25618442328dce02beb8765f5ea8a6f67a1a0a92e3f1bffed9cf371fa`;
the idempotency key is
`moves-demo-case-numbers-seed-v1:104be3a9c92c023b3b21b375929c3dd75decc23f77e262d89c10bb4cc01a40d0`.
The current committed `A3` stores 50% retirement of 620 workbooks, described
as about 310, not the absolute number 310. No new workbook count is invented.

Every lever numeric reference that the value-model schema permits is a
register ref. The current schema carries timing as scalar fields; the
proposal binds start month to existing `V3`. Cost is a typed pending P3 ROM
reference that blocks live value results until the current approved snapshot
is available. Existing `V1` is used only as a ceiling check, never as value
case cost. Those checks must also run against authenticated readback before
a future apply.
ROM factors are scalar capture fields in the current ROM schema; their source
strings cite `DL11`–`DL13`, and a future writer must verify equality.

## QA / Validation

- Pass: local deterministic value and ROM engines; exact values, inputs,
  hashes and formula output are in the committed preview proof.
- Pass: focused offline tests, including changed-input, ID-allocation,
  capacity-rule and ROM cost-basis mutations.
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
add a named-person `load_approval` for that exact Move and hash. A designated
operator must perform the live register-ID and P4 revision preflight in a
governed read-only ACA job before any later apply. Only that operator may later
dispatch the governed apply job under an exact approval. The P3 ROM unit-hour
register references still require a human to select the new DL rows, inspect
the computed workbook, and explicitly approve the snapshot. Successful job
readback, quality gate and signed-in P3/P4/deck proof are separate states.

The P3 owner steps are explicit: open “Estimate the work bottom-up”; select
`DL5`–`DL10` for the six unit-hour references; record the `DL11`–`DL13`
friction, productive-share and capacity factors with those citations; enter
the shared foundation plus both release count blocks and the 10-FTE pod;
accept the release grouping; inspect the computed low/plan/high workbook;
then use the human approval control. Adding register rows alone performs none
of these clicks and issues no approved ROM snapshot. P4 and the investment
deck remain blocked until that approval is current.

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

The writer and live preflight are code paths only; neither was exercised
against the data plane. The job verifies the Move's tenant, current phase,
existing register rows and exact expected IDs, plus the P4 capture revision,
before writing. A concurrent edit or changed ID refuses the write. Because
the manifest has no `load_approval` and the workflow has no apply input,
this PR leaves apply fail-closed. The job cannot approve a P3 ROM or advance
the phase.

Current live register IDs, P3 ROM record contents, approved rate basis and P4
capture state were not read. Accordingly, the local ROM cost is a synthetic
fixture result and cannot predict live pricing. Existing `V4` and `A2` are
open in the committed seed; the local value engine reports them as needing
validation even though it computes a planning preview. No Finance attestation
or investment-deck readiness is implied.
