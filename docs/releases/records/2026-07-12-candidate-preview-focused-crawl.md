# 2026-07-12-candidate-preview-focused-crawl - Candidate Preview Route Proof

## Release ID

`2026-07-12-candidate-preview-focused-crawl`

## Status

`candidate`

## Plain-English Summary

Adds a focused post-deploy browser proof for `/admin/candidate-preview`. The
proof signs in as the SkyHarbor automation persona, navigates directly to the
candidate preview route, and checks that the inactive-candidate banner and
guardrail indicators are visible.

This release does not promote any candidate, write production tenant data,
update the Active Tenant Access Layer, or change default module runtime reads.

## Layer Impact

- Release lane: `global-control-lane` for shared post-deploy proof automation.
- Admin surface: shows machine-readable candidate preview guardrail indicators
  on the existing admin preview page.
- Candidate runway: proof only. Promotion and active access remain disabled.
- Module runtime: no behavior change.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: SkyHarbor synthetic/reference candidate is used by the
  focused proof.
- Internal only: post-deploy proof workflow and admin preview inspection.
- Public/demo only: none.
- Feature flag: no new flag. Preview still requires explicit request
  parameters and acknowledgement.

## Changes Included

- Adds `npm run crawl:candidate-preview`.
- Adds `scripts/crawl/candidate-preview-proof.ts`.
- Adds the focused candidate preview crawl step and artifact upload to
  `.github/workflows/post-deploy-crawl.yml`.
- Adds visible guardrail rows to
  `src/app/(maestro)/admin/candidate-preview/page.tsx`.
- Extends `scripts/smoke/p21-post-deploy-crawl.spec.ts` to require the focused
  workflow step.
- Follow-up: tightens `scripts/crawl/candidate-preview-proof.ts` to read
  visible rendered text case-insensitively after the first live focused proof
  showed the page rendered correctly but `data-*` selectors were not reliable
  in the hydrated Next.js route.

## QA / Validation

- Pass: `npm run smoke:p21-post-deploy-crawl`
- Pass: `npm run audit:candidate-preview-enablement`
- Pass: `npm run audit:enterprise-naming`
- Pass: isolated TypeScript compile for the candidate preview route/proof files
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Pending after merge: ACA deploy, runtime invariant, health, broad signed-in
  crawl, and focused candidate-preview crawl artifact.
- Live follow-up evidence: focused run `29214259265` proved direct route/auth
  preservation and browser rendering, then failed because the proof script
  relied on selector lookup instead of visible guardrail text. This follow-up
  corrects the proof harness; no promotion/data behavior changes.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow
will build and deploy the exact merged SHA. The post-deploy crawl workflow will
then run both the broad signed-in crawl and the focused candidate-preview route
proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required by deploy workflow if worker images are in
  scope.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; broad crawl plus focused
  candidate-preview crawl.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.
Because the change is proof/UI-only and writes no production tenant data,
rollback is code-only.

## Audit Evidence

- PR URL after open.
- Local validation output.
- ACA deploy artifact after merge.
- Runtime invariant proof after deploy.
- `post-deploy-crawl` artifact after deploy.
- `candidate-preview-crawl` artifact after deploy.

## Known Gaps

This proves direct candidate preview route rendering. It is not candidate
promotion, not active-runtime readiness, not module default candidate
consumption, and not production tenant data mutation.
