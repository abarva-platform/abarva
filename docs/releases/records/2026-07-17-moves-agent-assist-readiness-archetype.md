# 2026-07-17-moves-agent-assist-readiness-archetype — Moves Agent Assist Readiness Archetype

## Release ID

`2026-07-17-moves-agent-assist-readiness-archetype`

## Status

`candidate`

## Plain-English Summary

Fixes a Moves readiness bug found during signed-in Meridian P0-P5 proof. Healthcare agent-assist Moves could be displayed as product enablement and then have P1 readiness resolved as AI product-development lifecycle work, causing irrelevant engineering/DORA evidence blockers. Readiness now resolves from the raw Move row and P0 scaffold text so Contact Center Agent Assist uses the operations decision-support evidence model.

## Layer Impact

- `global-control-lane`: changes shared Moves readiness archetype resolution for all tenants. No schema, data-load, candidate promotion, or client-specific data behavior changes.

## Client Applicability

- All clients: yes, for Moves current-state readiness and phase evidence rules.
- Specific clients: Meridian Health proof Move exposed the defect.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/current-state/readiness/route.ts`
- `src/lib/programs/archetypes/registry.ts`
- `src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts`

## QA / Validation

- Pass: focused Jest archetype regression.
- Pass: eslint on changed files.
- Pass: TypeScript check.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Not-run: signed-in Meridian browser proof after deploy.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then resume the signed-in Meridian P0-P5 proof on the disposable Move that exposed the issue.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. The old behavior returns, with the known risk that healthcare operations Moves may resolve to the product-development lifecycle readiness path.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4922
- Deploy proof: pending.
- Browser proof: pending.

## Known Gaps

- This does not change evidence upload, approval, generation, Tower handoff, data-layer promotion, or Home/context behavior.
