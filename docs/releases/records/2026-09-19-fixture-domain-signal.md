# 2026-09-19 Fixture Domain Signal

## Release ID

`2026-09-19-fixture-domain-signal`

## Status

`candidate`

## Plain-English Summary

Test files are excluded from the enum reachability sweep, and test fixtures are part of why a shipped gate stayed invisible: every unit test injected its own row source and asserted a value the column cannot hold, which is true about the function and false about the product. The open question was whether a fixture outside its column's domain should be reported, and how a deliberately invalid one would declare itself. Measured, the answer to the second question is that there is nothing to declare yet: outside the sweep's own demonstrations, no test fixture in the repository asserts an impossible value. This adds the measurement so that stays true visibly rather than by assumption.

## Layer Impact

- Release lane: `global-control-lane`.
- Audit tooling only. No production code, no runtime behavior change.
- No schema change, no migration.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add a reporting mode that scans test files for fixtures asserting a value their column cannot hold, covering both inline SQL and annotated vocabulary constants.
- Skip the sweep's own demonstrations, whose fixtures are deliberately impossible because that is how they prove the sweep catches an impossible value. The exclusion is derived from a reference to the script's path rather than a hand-kept list, so the next suite written for it excludes itself.
- Report, never gate. A fixture outside its column's domain is a real signal but not automatically a defect, because a test may legitimately construct an invalid row to prove it is rejected. Failing on that would make the honest test the broken one.

## QA / Validation

- PASS: new behavior suite passes 7 of 7.
- PASS: mutation harness catches 7 of 7. Two survived the first run and both were real gaps: nothing proved the scan was confined to test files, because production code is already clean so scanning everything still read zero; and nothing proved the annotated-constant findings were included, because no test file holds one with a bad value. A case was added for each.
- Measured on the real tree: zero findings across 2,316 test files, with three skipped as working on the sweep — its two existing suites and the new one.
- The first version of the exclusion predicate looked for an import and missed the suite that matters most, which does not import the sweep but spawns it by path. Both forms name the module path, so the predicate matches the path.

## Rollout Plan

Merge through the protected pull-request lane. Audit tooling only; the new mode runs on request and is not wired into a workflow.

## Rollback Plan

Remove the mode, its flag, and the behavior suite. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Tooling only.

## Audit Evidence

- The measurement on the real tree before and after.
- New suite output.
- Mutation harness output, including both survivors and the cases added for them.

## Known Gaps

**There is no declaration for a deliberately invalid fixture, and that is deliberate.** The population is zero outside the sweep's own suites, so a convention written now would be designed against a hypothetical. When the count first rises, that is when it is worth inventing, and it should follow the one already in use: an explicit annotation, never an inference from a name.

**The mode is not wired into a workflow.** It runs on request. Wiring it needs a decision about where a number that reports rather than gates should surface, which is the same open question recorded against the hygiene gate's warning verdict. Adding it to a pull-request job without answering that would produce a line nobody reads.
