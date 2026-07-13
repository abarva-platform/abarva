# 2026-07-13-data-pr24-candidate-preview-standard-crawl - Candidate Preview in Standard Crawl

## Release ID

`2026-07-13-data-pr24-candidate-preview-standard-crawl`

## Status

`candidate`

## Plain-English Summary

Moves the candidate preview route proof into the standard post-deploy crawl
artifact. The standard `post-deploy-crawl/latest.json` now carries the
candidate preview proof and folds candidate-preview P0/P1/P2 findings into the
same crawl comparison that release operators already parse.

This keeps the focused `npm run crawl:candidate-preview` command available for
debugging, but the production workflow no longer relies on a separate artifact
to prove `/admin/candidate-preview`.

## Layer Impact

- Release lane: `global-control-lane` for shared post-deploy proof automation.
- Proof harness: candidate preview is now part of the standard crawl run model
  and comparison counts.
- Admin surface: no UI behavior change.
- Candidate runway: proof only. Promotion and active access remain disabled.
- Module runtime: no behavior change.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: SkyHarbor synthetic/reference candidate remains the
  candidate-preview proof target.
- Internal only: post-deploy proof workflow.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/crawl/post-deploy-harness.ts` runs candidate preview proof before
  page-surface crawling and writes it under the standard crawl run directory.
- `src/lib/crawl/baseline-compare.ts` allows the standard crawl artifact and
  comparison to carry candidate-preview proof metadata.
- `.github/workflows/post-deploy-crawl.yml` removes the separate
  `candidate-preview-crawl` workflow step and artifact upload.
- `scripts/crawl/candidate-preview-proof.ts` exports the reusable proof runner
  while preserving the standalone CLI.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts` verifies the standard crawl owns
  the candidate-preview proof.

## QA / Validation

- Pass: `npm run smoke:p21-post-deploy-crawl`
- Pass: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/candidate-preview-proof.ts scripts/smoke/p21-post-deploy-crawl.spec.ts src/lib/crawl/baseline-compare.ts`
- Pass: isolated TypeScript compile for the crawl harness and candidate preview
  proof files.
- Pass: `npm run audit:candidate-preview-enablement`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not run yet: ACA deploy, runtime invariant, health, and signed-in standard
  post-deploy crawl whose `post-deploy-crawl/latest.json` includes
  candidate-preview route status.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow
will build and deploy the exact merged SHA. The standard post-deploy crawl
workflow then proves broad product surface status and candidate preview route
status from the same artifact.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required by deploy workflow if worker images are in
  scope.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; standard post-deploy crawl artifact must
  include candidate-preview proof.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow.
Because this changes proof automation only and writes no production tenant data,
rollback is code-only.

## Audit Evidence

- PR URL after open.
- Local validation output.
- ACA deploy artifact after merge.
- Runtime invariant proof after deploy.
- `post-deploy-crawl/latest.json` containing `run.candidatePreview` and
  `comparison.candidatePreview`.

## Known Gaps

This is proof-harness integration only. It is not candidate promotion, not
active-runtime readiness, not module default candidate consumption, and not
production tenant data mutation.
