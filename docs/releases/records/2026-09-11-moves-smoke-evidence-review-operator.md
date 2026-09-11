# 2026-09-11-moves-smoke-evidence-review-operator — Moves Smoke Evidence Review Operator

## Release ID

`2026-09-11-moves-smoke-evidence-review-operator`

## Status

`candidate`

## Plain-English Summary

Adds an operator-only command for approved synthetic smoke runs to record a governed evidence-review approval when the browser approval path cannot be used by automation. The command uses the existing evidence-review decision function, scopes the action to one supplied Move and one supplied evidence item, and refuses to run unless explicitly applied.

## Layer Impact

`internal-admin` lane. Client intake and product projection are affected only for operator-invoked synthetic smoke support. The change does not add a user-facing route, schema migration, or automatic approval behavior.

## Client Applicability

- All clients: No default product behavior change.
- Specific clients: None.
- Internal only: The operator command is available to approved internal smoke execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/programs/approve-smoke-evidence-review.ts`
- `package.json` script `moves:smoke:evidence-review:approve`

## QA / Validation

Candidate validation:

- PASS: `npx eslint scripts/programs/approve-smoke-evidence-review.ts`
- PASS: operator wrapper plan-only check
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps deployment workflow to build and deploy the digest-pinned image, then run the operator command only for an approved synthetic smoke Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Required before live operator use.
- Worker image invariant: Required before live operator use.
- Feature/env flag update path: None.
- Live signed-in proof required: The smoke run remains responsible for signed-in product proof.

## Rollback Plan

Revert this PR or stop invoking the package script. The command performs no schema migration and no product route change.

## Audit Evidence

Pending:

- PR URL
- CI / local validation output
- Deployment workflow run
- Operator proof output from approved smoke run

## Known Gaps

This is not a general product approval replacement. It is an operator-only support path for approved synthetic smoke execution when automated browser approval cannot reach the nested approval endpoint.
