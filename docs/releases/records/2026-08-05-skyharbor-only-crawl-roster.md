# 2026-08-05-skyharbor-only-crawl-roster — SkyHarbor-Only Crawl Roster

## Release ID

`2026-08-05-skyharbor-only-crawl-roster`

## Status

`candidate`

## Plain-English Summary

The signed-in automation crawl roster now matches the active demo data plane: the default post-deploy crawl and live answer evaluation use the active Airline Demo automation account only. Retired demo automation accounts are no longer scheduled by the standard crawl path.

## Layer Impact

Layer 4 Products: post-deploy crawl and live answer evaluation no longer attempt to authenticate or validate retired demo tenants.

Control plane: the non-human Clerk automation roster is reduced to the active SkyHarbor account, with the data-plane tenant key aligned to `skyharbor_global`.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo / SkyHarbor only.
- Internal only: Yes, for signed-in proof automation and crawl operations.
- Public/demo only: Demo automation only.
- Feature flag: None.

## Changes Included

- `src/lib/auth/agent-client-logins.ts`
- `src/lib/auth/cxo-personas.ts`
- `src/lib/crawl/persona-switcher.ts`
- `.github/workflows/post-deploy-crawl.yml`
- `.github/workflows/scb-live-answer-eval.yml`
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- `docs/runbooks/agent-client-test-login-crawl-auth.md`

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- Pass: `npx eslint src/lib/auth/agent-client-logins.ts src/lib/auth/cxo-personas.ts src/lib/crawl/persona-switcher.ts scripts/smoke/p21-post-deploy-crawl.spec.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Blocked on first attempt, resolved with larger heap: `npx tsc --noEmit --pretty false` hit local Node heap exhaustion before reporting type errors.
- Pass: `npm run release:check`

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the new image. The next post-deploy crawl will use the reduced SkyHarbor-only roster by default.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACR build: performed only by the repo-owned deploy workflow after merge, following the approved ACR build and registry policy.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live behavior.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, next post-deploy crawl should show only `agent-skyharbor` in the crawl plan.

## Rollback Plan

Revert this PR to restore the prior automation roster and workflow defaults. No database rollback is required.

## Audit Evidence

- PR URL and CI output.
- Post-deploy crawl artifact showing `crawl_plan:agent-skyharbor`.
- Live answer evaluation artifact showing `agent-skyharbor`.

## Known Gaps

This release does not remove historical docs, historical test fixtures, old dataset manifests, or legacy synthetic source files. It only prevents the active automation crawl/eval paths from scheduling retired tenants.
