# 2026-10-03-moves-charter-bounded-repair - Bounded P1 Charter Repair

## Release ID

`2026-10-03-moves-charter-bounded-repair`

## Status

`candidate`

## Plain-English Summary

When a generated P1 Charter remains below its prose floor after a substantive repair, generation now makes one bounded follow-up attempt using the latest section text. The existing 700-word prose floor, evidence rules, anti-padding instructions, and hard quality block remain unchanged.

## Layer Impact

- `global-control-lane`: Changes the shared Moves Charter generation loop for all tenants. It only retries incomplete section repair; it does not change evidence eligibility, approvals, gate criteria, or stored client data.

## Client Applicability

- All clients: Yes, when a generated Moves Charter remains below its prose floor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Bounded second repair round for P1 Charter sections that remain under their contract targets while the document remains below the quality floor.
- Regression coverage for partial first-round repairs, successful follow-up, and continued blocking when both rounds fail.

## QA / Validation

- PASS: Focused orchestration and section-generation suites: 69/69.
- PASS: Mutation check; disabling the follow-up round makes the partial-repair regression fail, then restored implementation passes.
- PASS: `npm run typecheck`.
- PASS: Targeted ESLint and Prettier checks.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD` (11/11 gates).
- NOT RUN: Full CI; pull request validation is pending.
- NOT RUN: Signed-in regeneration proof; required after deployment. The quality floor must remain a hard blocker when the evidence cannot support a complete Charter.

## Rollout Plan

Merge through a pull request, then deploy the exact main SHA with the repo-owned ACA main deploy workflow. Re-run the governed Charter build through the product workflow and review the resulting artifact before approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None before the official deploy workflow.
- Approved image digest: Pending the exact deploy run.
- ACA runtime invariant: Pending deployment.
- Worker image invariant: Pending deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify a short Charter receives its bounded follow-up and that any still-under-floor result remains blocked.

## Rollback Plan

Revert the bounded retry change through a follow-up pull request and redeploy through the repo-owned ACA workflow. No migration, flag, or data change is involved.

## Audit Evidence

- Pending pull request, CI, exact ACA deploy run, runtime invariant, and signed-in regeneration result.

## Known Gaps

- A Charter remains blocked if two bounded repair rounds cannot produce enough grounded, non-repetitive content to meet the unchanged prose floor.
