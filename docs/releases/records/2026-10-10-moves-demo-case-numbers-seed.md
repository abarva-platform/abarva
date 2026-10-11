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
10-FTE synthetic plan. Rates resolve exclusively from the versioned cost
foundation at role, level, location and provider class. The TWR-04 Data Product
pod expansion is a proposed, unapproved mapping; the global starter rate bands
are also unapproved. The $5.8910348M plan ROM is 117.8% of the existing $5M
budget ceiling; low and high are $4.4182761M and $8.8365522M. The three-year
value case uses these ROM outputs as its only cost basis, producing a
negative $1,205,904.05 plan NPV, no modeled payback, and negative 4.5628%
three-year ROI. No input was tuned to fit the ceiling.
It is a deterministic simulation,
not a readback of the current Move, a Finance-approved forecast, a signed-in
product result, or a claim that the deck is ready.

## Layer Impact

- Release lanes: `client-data-lane` for the synthetic seed and
  `global-control-lane` for the optional P3 pod-entry control and governed
  write guard. No client data changes automatically.
- Layer 1: no client intake change. A committed synthetic benchmark fixture is
  a review input, never client-attested source data.
- Layer 2: no adapter change.
- Layer 3: proposed Move-scoped register rows and `value_plan` capture. The
  existing register store is the planned mutation path for rows. The P4
  capture persistence is extracted for signed-in and operator use, with a
  tenant/Move/phase/revision preflight and capture audit. No load occurs here.
- Layer 4: P3 Step 4 now accepts explicit proposed member lists in its pod
  form, with each mapping visible as unapproved until reviewed. ROM-linked
  value cases now read the current approved P3 snapshot
  and block while it is absent or stale. Consultant screen and reference-deck
  figures use one presentation formatter; engine and workbook cents remain exact.

## Client Applicability

- All clients: the P3 pod form can accept an explicit proposed member list
  where the ROM step is enabled; existing saved estimates are not rewritten.
- Specific clients: one synthetic demo Move only, bound by its exact ID,
  authenticated client record, canonical tenant registry and application
  tenant key. No live client receives this candidate.
- Internal only: the proposal and read-only operator dry-run path.
- Public/demo only: synthetic planning inputs after a future approved load.
- Feature flag: no flag changes in this PR.

No other Move, tenant, dataset, historic approval or phase state changes.
No live client data or client-specific claim is included.

## Changes Included

- Manifest: `docs/governance/dataset-manifests/moves-demo-case-numbers-seed-v1.json`.
  Dataset declaration is distinct from its absent `load_approval`.
- Exact rows and value case: `datasets/tenant-inputs/meridian-health/moves/demo-case-numbers-seed-v1.json`.
  The owner may inspect every value, role, citation, confidence and expected
  register ID there.
- Benchmarks: `scripts/moves/fixtures/demo-case-numbers/synthetic-benchmarks-v1.json`.
- Offline proof: `docs/releases/proofs/2026-10-10-moves-demo-case-numbers-local-preview.json`.
- Read-only live ID proof: `docs/releases/proofs/2026-10-10-moves-demo-case-numbers-live-id-preflight.json`.
- Exact-formula workbook: `docs/releases/proofs/2026-10-10-moves-demo-case-numbers-rom-workbook.xlsx`.
- Job and workflow: the job validates the source-set hash, Move, tenant,
  manifest and idempotency key; dry-run reads and reports the register without
  writing. Apply remains unavailable under the manifest's absent named load
  approval. The workflow exposes only dry-run.

## Exact Input and ID Boundaries

The source-set hash covers the exact seed JSON, benchmark JSON, reused
register-seed JSON, and six committed cost-foundation CSVs, in that order with
newline separators. The job's
idempotency key binds that hash to the exact Move ID. The new rows expect
`DL7`–`DL15` and `V6`–`V13`; reused rows expect `V1`, `V3`, `V4`, `A2` and
`A3`. The read-only live census found unrelated `DL5`, `DL6`, and `V5` rows
and observed `DL7` and `V6` as the next allocations. This is a point-in-time
snapshot. The job refuses a different allocation or changed occupied row
rather than retargeting an input.
For this candidate, the source-set SHA-256 is
`58278187096baeffc23751cf97837579fa807daff7a29e0d3da3a4a11e68d654`;
the idempotency key is
`moves-demo-case-numbers-seed-v1:3d5b17e12760fd1821578df6e5f8296e43bd4d78df2db6f4db822578a35e6cbd`.
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
strings cite `DL13`–`DL15`, and a future writer must verify equality.

## QA / Validation

- Pass: local deterministic value and ROM engines; exact values, inputs,
  hashes and formula output are in the committed preview proof.
- Pass: focused offline tests, including changed-input, ID-allocation,
  capture-revision, capacity-rule, ROM cost-basis and notes-fill mutations.
- Pass: mocked-Postgres tests exercise the actual scoped write transaction:
  direct queries and fluent writes use one connection, a late readback failure
  rolls back prior writes, successful work commits once, and uncertain
  commit or rollback outcomes are reported as unknown.
- Pass: typecheck, scoped lint, `audit:lib-orphans`, route and export
  reachability, the 2,830-file test coverage census, tenancy census,
  manual check, and all context/corpus validation modes.
- Pass: dataset manifest validation.
- Pass: authorized read-only main-branch ACA operator dry run and a scoped
  register census on the current digest-pinned image. The former verified the
  prior seeded rows; the latter enumerated live value and delivery IDs,
  next IDs, phase, and absent P3/P4 records. Both direct probe executions
  succeeded, and the operator template remained idle. No write, signed-in
  page, P4 capture, or deck preview is claimed here.
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

The P3 owner steps are explicit. Open “Estimate the work bottom-up”; add the
shared foundation and use cases with the page codes `FOUNDATION`, `UC-1`, and `UC-2`.
In “Fill this step from your notes”, paste these three separate lines, choose
“Fill with aVa”, and confirm each drafted count block:

```text
FOUNDATION: 8 data sources, 65 source tables, 20 standard data entities, 8 dashboard views, 100 design rows, 130 validation rows.
UC-1 Certified measures and governed consumption: 20 data sources, 80 source tables, 55 standard data entities, 25 dashboard views, 200 design rows, 255 validation rows.
UC-2 Workbook certification and retirement: 18 data sources, 80 source tables, 45 standard data entities, 30 dashboard views, 150 design rows, 220 validation rows.
```

Link the six Unit hours rows to `DL7` data sources, `DL8` source tables,
`DL9` standard data entities, `DL10` dashboard views, `DL11` design rows,
and `DL12` validation rows. Source the friction, productive share, and
hours/FTE-week factors from `DL13`, `DL14`, and `DL15` respectively.
For the pod, use “Proposed role mapping, unapproved” with these member lines,
location `LOC-DALLAS`, provider class `SI-T1`, and `bill_rate`:

```text
ROL-024 | Data Product Manager | LVL-06 | 1 | Data Product Mgr
ROL-023 | Data Architect | LVL-07 | 1 | Data Architect
ROL-037 | Data Engineer | LVL-08 | 6 | Data Engineer
ROL-041 | BI Developer | LVL-08 | 2 | BI Dev
```

Review and approve each proposed role mapping. Group `UC-1` into `R1` and
`UC-2` into `R2`; mark `R1` as carrying `FOUNDATION` and cost it once; accept
the grouping.
Inspect the full-precision workbook, then click “Approve the estimate”.
Adding register rows alone performs none of these clicks and issues no approved
ROM snapshot. P4 and the investment deck remain blocked until that approval
is current.

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
The authorized read-only register preflight run is
`https://github.com/abarva-platform/abarva/actions/runs/38105210814`;
the scoped census used operator executions
`job-abarva-private-operator-eus-pyoyzft` and
`job-abarva-private-operator-eus-9gtw0w6`. The proof records the observed
IDs and collision. All three are read-only evidence, not a load.

## Known Gaps

The apply writer is a code path only and was not exercised against the data
plane. The job verifies the Move's tenant, current phase, existing register
rows and exact expected IDs, plus the P4 capture revision, before writing.
Apply rechecks those conditions under a Move lock and one serializable
transaction; an ID or revision change rolls the entire seed back. A failed
job emits an independent observed-state readback rather than asserting that
no partial state exists. Because
the manifest has no `load_approval` and the workflow has no apply input,
this PR leaves apply fail-closed. The job cannot approve a P3 ROM or advance
the phase.

Current live register IDs were read at the stated time; they can change before
apply. The P3 ROM record was absent at preflight. The local ROM cost is an
unapproved planning estimate from the
versioned foundation, not a live P3 snapshot. Existing `V4` and `A2` are
open in the committed seed; the local value engine reports them as needing
validation even though it computes a planning preview. No Finance attestation
or investment-deck readiness is implied.
