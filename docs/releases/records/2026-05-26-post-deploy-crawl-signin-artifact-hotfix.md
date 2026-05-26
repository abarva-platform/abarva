# 2026-05-26-post-deploy-crawl-signin-artifact-hotfix - Post-Deploy Crawl Sign-In + Artifact Guard

## Release ID

`2026-05-26-post-deploy-crawl-signin-artifact-hotfix`

## Status

`candidate`

## Plain-English Summary

Fixes the post-deploy crawl failure observed after the Northstar merge. The authenticated crawl was timing out on a disabled sign-in button and, because no crawl result file was written, the rollback step failed blind. This hotfix makes credential entry deterministic, waits for the sign-in button to enable with useful diagnostics, and guarantees a `latest.json` crawl artifact on early bootstrap failures.

## Layer Impact

- `ops-release-lane`: improves the production post-deploy crawl gate so failures produce inspectable artifacts instead of empty uploads.
- `app-control-lane`: hardens demo persona sign-in automation by verifying each field value before submit.
- `agent-quality-lane`: no Sentinel or reasoning behavior changes.
- `client-data-lane`: no tenant data changes.

## Client Applicability

- All clients: applies to the shared post-deploy crawl harness and persona switcher.
- Internal only: affects CI/deploy hygiene and operator crawl automation.
- Public/demo: no direct public UI change.
- Feature flag: none.

## Changes Included

- `src/lib/crawl/persona-switcher.ts`: fills sign-in fields deterministically, verifies field values, waits for the submit button to enable, and emits form-state diagnostics if disabled.
- `scripts/crawl/post-deploy-harness.ts`: writes `crawl-run.json`, `comparison.json`, and `latest.json` even when sign-in/bootstrap fails early.
- `scripts/crawl/auto-rollback.ts`: skips gracefully when no crawl result file exists instead of throwing a second unrelated file-not-found error.

## QA / Validation

- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts scripts/crawl/auto-rollback.ts src/lib/crawl/persona-switcher.ts`
- PASS: `rm -rf .next && npx tsc --noEmit --pretty false`
- PASS: `npm run crawl:post-deploy -- --base-url https://app.abarva.ai --persona apex-cio --surface home --output-dir /tmp/northstar-crawl-smoke` returned `0 P0, 0 P1, 0 P2` with one observation and a `latest.json` artifact.

## Rollout Plan

Merge after CI passes. The next push to main should rerun the post-deploy crawl and produce either a clean pass or an inspectable artifact with failure details.

## Rollback Plan

Revert this hotfix if the crawl harness needs to return to the previous behavior. Rollback is safe because the change is limited to CI/operator automation and does not alter product data.

## Audit Evidence

- Previous main run `26434824314` failed because the sign-in button was disabled and no `latest.json` artifact existed.
- Local one-surface production crawl after the patch succeeded with `0 P0, 0 P1, 0 P2`.
- TypeScript and focused ESLint were clean after the patch.

## Known Gaps

- The workflow still depends on demo users being provisioned in production. This hotfix makes the automation deterministic and diagnosable, but it does not provision or rotate demo credentials.
