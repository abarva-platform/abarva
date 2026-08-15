# 2026-08-15-atlas-gauntlet-authz-proof — Atlas Gauntlet Tenant-Key Proof

## Release ID

`2026-08-15-atlas-gauntlet-authz-proof`

## Status

`candidate`

## Plain-English Summary

The production Atlas gauntlet now asks the signed-in API using the same active client key the app resolves from the authenticated session. This removes environment-specific client UUIDs from the proof harness, preserves the cross-tenant `403` boundary probe, and retries Clerk rate-limit responses during rapid multi-tenant smoke runs.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 products/proof harness only. No canonical data, persistence, loaders, adapters, tenant projections, migrations, or runtime auth policy changed.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: None.
- Internal only: Atlas production proof harness and smoke guardrails.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`

## QA / Validation

Local validation:

- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules PATH=/Users/anand/Projects/nexus/node_modules/.bin:$PATH tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx eslint scripts/qa/atlas-prod-comprehensive-surface.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `git diff --check origin/main...HEAD`
- Pass after release-record wording correction: `npm run release:check`

Not run before PR: production Atlas gauntlet, because this change must merge and deploy before production proof can verify the updated harness against `https://app.abarva.ai`.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will deploy the resulting SHA. After deployment, rerun the Atlas production CXO gauntlet smoke profile and keep its result separate from deploy success.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow after merge.
- ACA runtime invariant: Required before claiming the SHA is deployed.
- Worker image invariant: Required by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun `atlas-prod-comprehensive-surface.yml` with `profile=smoke`.

## Rollback Plan

Revert the PR. The previous harness can still run but may fail against production if client UUIDs drift or Clerk rate limits rapid tenant login attempts.

## Audit Evidence

- PR URL after creation
- Local smoke output
- GitHub PR checks
- ACA main deploy run after merge
- Atlas production CXO gauntlet run after deploy

## Known Gaps

This does not claim Atlas answer quality is passing. It only repairs the proof harness request identity and retry behavior so the next gauntlet result can expose real answer-quality or product issues.
