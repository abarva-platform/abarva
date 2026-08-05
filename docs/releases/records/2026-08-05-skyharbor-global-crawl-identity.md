# 2026-08-05-skyharbor-global-crawl-identity - SkyHarbor Global Crawl Identity

## Release ID

`2026-08-05-skyharbor-global-crawl-identity`

## Status

`candidate`

## Plain-English Summary

The signed-in post-deploy crawl now expects the active SkyHarbor workspace identity, `SkyHarbor Global`, instead of the retired display label used by the older demo lane. This removes stale tenant-name noise from the audit without changing production tenant data.

## Layer Impact

- global-control-lane: Updates the non-human automation identity metadata and crawl comparison expectation used by the production proof harness.
- client-data-lane: No database rows, loaders, or tenant data are changed.
- Products: No page behavior changes. This only changes what the proof harness expects to see for the active SkyHarbor tenant.

## Client Applicability

- All clients: None.
- Specific clients: SkyHarbor Global proof lane only.
- Internal only: Post-deploy crawl and signed-in automation proof harness.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/auth/agent-client-logins.ts` names the active automation tenant `SkyHarbor Global`.
- `src/lib/crawl/persona-switcher.ts` expects `SkyHarbor Global` for the active crawl persona.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` and `scripts/smoke/p21-post-deploy-crawl.spec.ts` cover the active display name.

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- Pass: `npx eslint src/lib/auth/agent-client-logins.ts src/lib/crawl/persona-switcher.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. The next automatic post-deploy crawl should use the SkyHarbor-only persona and no longer emit stale visible-tenant P1s for the retired display label.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required after deploy workflow.
- Worker image invariant: Required after deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, default post-deploy crawl.

## Rollback Plan

Revert this release and redeploy through the repo-owned ACA workflow. No database rollback is required.

## Audit Evidence

- PR URL and deploy run to be attached after merge.
- Focused validation output from this release branch.
- Post-deploy crawl artifact after ACA deploy.

## Known Gaps

Historical tests and archival fixtures may still mention older synthetic tenant labels. This release is scoped to the active automation crawl identity and proof expectation.
