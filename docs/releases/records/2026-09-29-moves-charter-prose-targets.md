# 2026-09-29-moves-charter-prose-targets - P1 Charter section completeness

## Release ID

`2026-09-29-moves-charter-prose-targets`

## Status

`candidate`

## Plain-English Summary

Section-by-section P1 Charter prompts now receive explicit prose targets whose total clears the existing document-level prose quality floor. The quality gate is unchanged: unsupported claims and filler remain prohibited, and the section targets are guidance rather than individual hard minimums.

## Layer Impact

- `global-control-lane`: Changes the shared Moves Charter generation prompt for all tenants. No evidence, approval, gate, or pricing policy is relaxed.

## Client Applicability

- All clients: Yes, for generated P1 Charters.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Shared Charter contract declares section-level prose targets.
- Section-draft prompts state each section's target and aggregate target while preserving evidence, phase, and anti-padding rules.
- Regression tests cover aggregate target consistency and prompt inclusion.

## QA / Validation

- PASS: The new regression tests failed before the implementation because no section targets or prompt guidance existed.
- PASS: Focused contract, prompt, section-generation, and quality suites: 129/129.
- PASS: `npm run typecheck`.
- PASS: Targeted ESLint on changed TypeScript files.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Not run: CI and signed-in regeneration proof; pending candidate validation.

## Rollout Plan

Merge through a pull request, then build and deploy the exact main SHA using the repo-owned ACA main deploy workflow. No migration, feature flag, direct data mutation, or manual artifact edit is required. Rebuild the blocked Charter through the signed-in Moves product after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None before the official deploy workflow.
- Approved image digest: Not available until the exact deploy run completes.
- ACA runtime invariant: Not run; required after deployment.
- Worker image invariant: Not run; required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; the Charter must regenerate from the current approved-evidence snapshot and reach an honest reviewable state without weakening its quality gate.

## Rollback Plan

Revert the prompt/contract change through a follow-up pull request and redeploy the last approved digest using the repo-owned ACA workflow. No data migration is involved.

## Audit Evidence

- Pending pull request, CI, exact ACA deploy run, runtime invariant, and signed-in regeneration outcome.

## Known Gaps

- The existing synthetic P1 run failed its Charter quality check at 573 prose words against the unchanged 700-word floor. It must remain unapproved until rebuilt and reviewed.
- The broader synthetic P0-P5 journey is still in progress and is not accepted by this release candidate.
