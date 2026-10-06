# 2026-09-18-control-catalog-behavioral-coverage - Count Controls, Not Surfaces

## Release ID

`2026-09-18-control-catalog-behavioral-coverage`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog lists 18 surfaces. Those 18 surfaces declare 37
separate controls between them — one surface declares five, several declare one.

Progress on the behavioral-test programme was being counted by surface. A suite
that exercised two of a surface's four controls made that surface "covered", and
the two controls it never touched disappeared into the count. The distinction
lived only in prose inside individual release records, where no check reads it
and no future reader is obliged to find it.

This change moves the distinction into the catalog, where the checker can enforce
it. Every one of the 37 controls must now declare either the behavioral test that
exercises it, or `status: "none"` with a concrete reason saying what is not
proven. The checker prints the real number.

Counted per control rather than per surface: **23 of 37**, not 14 of 18.

## Layer Impact

Audit tooling and CI only. No product code changes. `global-control-lane`.

## Client Applicability

- All clients: no behavior change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/security/ai-surface-control-catalog.json`: each of the 37 control entries
  gains a `behavioralTest` — a test path (with the CI name filter, where the step
  uses one), or `status: "none"` with a reason.
- `scripts/audit/ai-surface-control-catalog.mjs`: validates those declarations and
  reports coverage per control.

## What the checker now refuses

A declared test that does not exist on disk. A declared test that exists but is
**never run by this catalog's own CI job** — the gap that let a suite sit in the
tree proving nothing, because no PR that broke the control would ever execute it.
A control with no declaration at all. An uncovered control whose reason is too
thin to say what is missing.

Two narrower refusals close failures this programme has already hit:

- **A name-filtered CI step must be declared as one.** One step runs a suite
  filtered to two test titles. Renaming either title silently drops it from the
  gate. The catalog must now carry the same filter string, so a rename fails the
  catalog rather than quietly covering less. It also fails if the catalog claims
  a whole suite the workflow actually filters.
- **A bracketed path must use `--runTestsByPath`.** jest reads a bare pattern as a
  regex, and the literal brackets in a route segment like `[programId]` are a
  character class that matches nothing — the step passes having found no tests.

## QA / Validation

Seven mutations, each applied to the restored catalog or workflow and reverted:

| Mutation | Result |
|---|---|
| Remove a control's `behavioralTest` | caught |
| Point a control at a real test the workflow never runs | caught |
| Drop the declared name filter from the catalog | caught |
| Rename the filter in the workflow, leave the catalog | caught |
| Remove `--runTestsByPath` from the bracketed-path step | caught |
| Give an uncovered control a one-word reason | caught |
| Delete a wired step from the workflow | caught |

All seven fail the checker with a message naming the control. Status: **pass**.

Restored catalog: checker **exit 0**, `18 surfaces, 37 declared controls`,
`23 of 37`. Status: **pass**.

`npx eslint` on the changed script: **exit 0**. `release-check`: **exit 0** —
captured as an exit status, not read off a pipe. No TypeScript changed.

Signed-in acceptance: **not applicable** — no product behavior changes.

## Rollout Plan

Squash-merge after required checks pass. No deploy required; it rides the next
ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: None.

## Rollback Plan

Revert through a new PR. No runtime effect either way.

## Audit Evidence

PR link, the checker's coverage line, and the seven mutation results above.

## Known Gaps

- **14 of 37 controls have no behavioral test.** They are now named in the catalog
  with a reason each, rather than absorbed into a surface count. Five of them are
  the Tower pressure brief, three the deliverable canvas view model, two the Atlas
  drawer's per-answer controls, two the shared response renderer's citation and
  confidence displays, one the programs gate modal, one the Source estimate
  disclosure.
- The checker proves a declared test **runs**. It does not prove the test asserts
  the control rather than something adjacent — that judgment is still made when
  the test is written and reviewed, and a weakened assertion inside a wired suite
  would still pass this gate.
- Coverage is declared by the author. A control mapped to a suite that does not
  really exercise it would count as covered; the reason text is where that claim
  is visible for review.
