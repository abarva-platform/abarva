# 2026-09-19 Enum Sweep Reads Annotated Constants

## Release ID

`2026-09-19-enum-sweep-annotated-constants`

## Status

`candidate`

## Plain-English Summary

The enum reachability sweep judges vocabularies written as SQL literals, and cannot see one held in a TypeScript constant. That matters because the defect the sweep was built after now lives in exactly that shape: a constant reaching the database as a parameterised array comparison, with no literal to judge. This teaches the sweep to read a vocabulary from a constant, but only where a declaration says which column it belongs to. The mapping is never inferred from the constant's name.

## Layer Impact

- Release lane: `global-control-lane`.
- Audit tooling, plus one documentation annotation on a library constant.
- No runtime behavior change, no schema change, no migration.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add a scan for exported string-array constants carrying a declared column annotation in their documentation block, and judge their values against that column's constraint.
- Never infer the mapping from a constant's name. A wrong mapping fails a correct list, which is worse than not checking: it teaches people the check is noise, and the fix they reach for is deleting the annotation.
- Report an annotation naming a column with no constraint as uncheckable and counted, without failing. An unconstrained column is a legitimate thing to point at, and failing there would push people to delete the annotation.
- Join the new findings into the sweep's own finding list, so a vocabulary in a constant fails the same way one in SQL does.
- Annotate the constant this item is about as the first case.

## QA / Validation

- PASS: new behavior suite passes 8 of 8; the sweep's existing suite passes 22 of 22 and the pattern authority suite 6 of 6, both unchanged.
- PASS: mutation harness catches 8 of 8. An earlier run had one survivor — removing the step that joins the new findings into the sweep's own list — because every case until then inspected the scan's output rather than the sweep's. A case was added that runs the whole sweep over a temporary source directory holding a defective constant, and the rerun caught it.
- PASS: the decisive case reproduces the original defect. The three states that shipped in the first version of this constant are all impossible for the column, and the scan reports the list unreachable.
- The constraint values come from the real migrations rather than from a fixture, and a control case asserts the lookup found them. A vocabulary test whose expected vocabulary was written by the test author proves only that the author agrees with themselves.
- PASS: the sweep runs clean on the real tree: 641 constrained columns, 5,735 source files, one waived pre-existing finding.
- PASS: TypeScript exit code 0; scoped ESLint exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Audit tooling only.

## Rollback Plan

Remove the scan, its wiring into the sweep result, the behavior suite, and the annotation. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Tooling only.

## Audit Evidence

- New and existing suite output.
- Mutation harness output, including the survivor and the case added to catch it.
- Full sweep output on the real tree.
- TypeScript and lint exit codes.

## Known Gaps

**One constant is annotated.** The convention now exists and is enforced where it is used, which is not the same as being adopted. Finding the other vocabularies that belong to constrained columns is a separate piece of work, and doing it by guessing at names is the one thing this change exists to refuse.

The scan reads exported constants declared as a string array with a const assertion. A vocabulary built some other way — assembled at runtime, derived from an object's keys, or spread from another constant — is not seen, and is not reported as unseen either, because the scan cannot tell a vocabulary it failed to parse from a file that has none.
