# Source template evidence reconciliation

## Release ID

`2026-09-18-source-template-reconciliation`

## Status

`candidate`

## Plain-English Summary

An exported evidence template now links back to its intended requirement when uploaded. An unrecognized template token stays unlinked instead of attaching to an unrelated requirement.

## Layer Impact

Global-control-lane, Layer 4 Source evidence-readiness projection only. No intake, canonical records, schema, or tenant data are changed by this release.

## Client Applicability

- All clients: Source event evidence template uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Match generated template filenames by their exact catalog token before applying the ordinary upload filename heuristic.
- Exercise the download-to-upload round trip for every catalog requirement and reject unknown generated-template tokens.

## QA / Validation

- Baseline: 1 failing test across the two focused suites; the spend-baseline template matched the trigger requirement.
- Fixed: 18/18 focused tests pass; scoped ESLint, TypeScript, and `git diff --check` pass.
- Mutation: removing the exact-template branch produces 2 failing tests across the same suites; restoring it returns 18/18 passing.
- Signed-in upload acceptance is pending.

## Rollout Plan

Squash-merge after required checks pass. The repo-owned ACA main deploy workflow builds and shifts the shared web runtime. No migration or data-build job is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Pending deploy readback.
- ACA runtime invariant: Pending template, 100%-traffic revision, and worker digest readback.
- Worker image invariant: Pending deploy readback.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, a generated template re-upload must attach to its own requirement.

## Rollback Plan

Restore the prior approved digest through the repo-owned ACA rollback path if template uploads regress. Existing evidence links are not rewritten by the code rollout.

## Audit Evidence

Focused test output and mutation result above; PR, CI, ACA workflow, and signed-in proof references to be added after each gate.

## Known Gaps

Heuristic matching for arbitrary user-named files remains unchanged. Signed-in end-to-end upload proof is still owed.
