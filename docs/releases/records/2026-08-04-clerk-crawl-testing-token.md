# 2026-08-04-clerk-crawl-testing-token — Clerk Testing Tokens For Crawl Auth

## Release ID

`2026-08-04-clerk-crawl-testing-token`

## Status

`candidate`

## Plain-English Summary

Post-deploy browser crawls now mint a short-lived Clerk testing token and attach it to Clerk Frontend API requests before using the existing server-side ticket sign-in. This keeps Clerk enabled, keeps each automation identity tenant-scoped, and prevents Clerk bot protection from misreading the governed crawl as a hostile browser automation session.

## Layer Impact

- Release lane: `global-control-lane`.
- Control layer: updates the post-deploy crawl authentication harness and workflow environment contract.
- Product layer: no product route behavior changes; crawls still exercise the same signed-in routes after authentication succeeds.
- Data layer: no tenant data, schema, migration, or loader change.

## Client Applicability

- All clients: post-deploy crawl coverage can authenticate for each configured automation persona.
- Specific clients: none.
- Internal only: the Clerk testing-token path is internal QA/crawl infrastructure only.
- Public/demo only: none.
- Feature flag: `CLERK_TESTING_TOKEN_DISABLED=true` disables testing-token injection.

## Changes Included

- `src/lib/crawl/clerk-testing-token.ts` adds testing-token creation and browser request injection for Clerk Frontend API calls.
- `src/lib/crawl/persona-switcher.ts` installs the testing-token interceptor before ticket sign-in.
- `scripts/auth/prime-agent-client-auth-states.ts` uses the same testing-token path when priming local storage states.
- `.github/workflows/post-deploy-crawl.yml` passes `CLERK_TESTING_TOKEN_SECRET_KEY`, falling back to the existing Clerk secret when a dedicated secret is not configured.
- `docs/runbooks/agent-client-test-login-crawl-auth.md` documents the testing-token requirement and bot-block failure mode.

## QA / Validation

- `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand --verbose` passed, 10/10.
- `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts` passed.
- `npx eslint src/lib/crawl/clerk-testing-token.ts src/lib/crawl/persona-switcher.ts scripts/auth/prime-agent-client-auth-states.ts scripts/smoke/p21-post-deploy-crawl.spec.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- Clerk-only agent provisioning was run with the local secret-bearing environment: all six automation users updated, no membership or tenant-data writes.
- Focused live production proof passed for `agent-skyharbor` on `/home`: the log showed `crawl_clerk_testing_token_installed`, ticket auth completed, candidate preview rendered, and the page crawl completed without the prior Clerk banned error. Result was `0 P0, 1 P1, 0 P2`; the remaining P1 was tenant display-copy mismatch, not auth.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the new image. The workflow change becomes active for future post-deploy crawls as soon as `main` is deployed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only authority allowed to shift shared ACA web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy; the Container App template image and 100% traffic revision image must match the approved digest.
- Worker image invariant: required after deploy; deliverable-worker job images must match the approved digest.
- ACR build policy: shared web images must be built only by the repo-owned ACA main deploy workflow using the approved ACR policy; no ad-hoc ACR build, local push, branch workflow, or mutable runtime tag is authorized by this release.
- Feature/env flag update path: GitHub Actions secret/variable configuration only; no app runtime feature flag required.
- Live signed-in proof required: yes, post-deploy crawl must show no Clerk banned auth-bootstrap failure.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. If Clerk testing-token creation fails unexpectedly, set `CLERK_TESTING_TOKEN_DISABLED=true` to return to the prior crawl behavior while investigating Clerk configuration.

## Audit Evidence

- Local focused test artifacts: `audit-artifacts/clerk-crawl-auth-fix/2026-08-04T21-08-23-402Z-local/`
- Local focused result: `audit-artifacts/clerk-crawl-auth-fix/latest.json`
- Local screenshot: `audit-artifacts/clerk-crawl-auth-fix/2026-08-04T21-08-23-402Z-local/screenshots/agent-skyharbor__home.png`
- Candidate-preview proof: `audit-artifacts/clerk-crawl-auth-fix/2026-08-04T21-08-23-402Z-local/candidate-preview/candidate-preview-proof.json`

## Known Gaps

- This does not change Clerk dashboard bot-protection configuration.
- The focused live proof still found a non-auth P1 because the Home page rendered `SkyHarbor Global` while the crawl expected `Airline Demo`.
