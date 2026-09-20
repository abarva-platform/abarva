# 2026-09-19 Retention Declared Not Enforced

## Release ID

`2026-09-19-retention-declared-not-enforced`

## Status

`candidate`

## Plain-English Summary

Seven retention policies are declared in the pilot data-plane security policy, with windows from fourteen days to seven years and delete triggers written in prose. Nothing outside that module's own test reads any of them: there is no purge job, no expiry sweep, and no code path that consults a retention window before keeping or deleting a file. A table of retention windows that nothing acts on is worse than no table, because it reads as a control to whoever finds it — and the person most likely to find it is a customer doing diligence. This makes that state structural and countable instead of leaving it as an absence somebody has to notice.

## Layer Impact

- Release lane: `global-control-lane`.
- Policy declaration and its behavior suite. No runtime behavior changes; nothing consumed these policies before and nothing does now.
- No schema change, no migration, no deletion path added.

## Client Applicability

- All clients: no change to what is retained or removed. Nothing was being removed on a schedule before this change and nothing is now.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add a required enforcement field to every retention policy, with two shapes: enforced, which must name the module that does it, or declared-not-enforced, which must say what a customer loses by the policy being intent rather than mechanism.
- Mark all seven policies as declared-not-enforced, each with its own specific gap rather than a shared phrase.
- Add a function reporting how many policies nothing acts on, so the gap is a number that moves rather than a comment.
- Record the legal-hold posture as an explicit decision — out of scope for the pilot — with the cost if a customer asks, the reason it is currently deferrable, and the trigger that reopens it.
- Add a behavior suite that refuses an enforcement claim naming a module that does not exist, and proves that rule against a fabricated claim rather than only against the empty set.

## QA / Validation

- PASS: new behavior suite passes 7 of 7; the existing policy suite passes 6 of 6 unchanged.
- PASS: mutation harness catches 7 of 7 seeded defects — claiming enforcement by a module that does not exist, miscounting the unenforced policies, emptying a gap statement, softening the legal-hold posture, dropping its cost statement, untying its reopen trigger from enforcement arriving, and replacing the reason it is deferrable.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on both files, exit code 0.
- Measured before changing: the only consumer of the retention policy table anywhere in the source tree is its own test.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. No rendered surface reads these policies, so merging changes nothing a user sees.

## Rollback Plan

Remove the enforcement field, the count function, the legal-hold posture, and the behavior suite. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. No rendered behavior changes.

## Audit Evidence

- Measurement of who reads the retention policy table.
- New and existing suite output.
- Mutation harness output.
- TypeScript and lint exit codes.

## Known Gaps

**Nothing here makes retention enforceable, and the change is careful not to imply otherwise.** Building a purge mechanism is separate work that needs a decision about who approves a deletion and what evidence survives it.

The legal-hold deferral is safe only while nothing deletes on a schedule. That dependency is recorded in the posture itself and pinned by a case, because the day enforcement lands, a missing hold stops being harmless and becomes a way to destroy records somebody was obliged to keep. The two must be decided together.

Two other retention shapes exist elsewhere and are untouched here: a text column on three tables, and a years column on engagements that is written as a literal and read into a typed field without anything acting on it either. Whether those should converge on this policy is a separate question.
