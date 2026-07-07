# 2026-05-31-depth-lint-ci-hardening — Depth Lint CI Hardening

## Release ID

`2026-05-31-depth-lint-ci-hardening`

## Status

`candidate`

## Plain-English Summary

Fixes the Depth Lint PR check so it can run in a plain Node CI process without tripping Next.js `server-only` guards, and so workflow failures still produce a readable PR comment instead of crashing on empty JSON.

## Layer Impact

- `global-control-lane`: improves the shared CI quality gate used to score depth exemplars.
- `eval/QA`: makes Depth Lint reliable and diagnosable; no product runtime code changes.

## Client Applicability

- All clients: no direct user-facing change.
- Specific clients: none.
- Internal only: CI and release governance only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `package.json`: runs `lint:depth` with the existing CLI-safe `server-only` preload.
- `.github/workflows/depth-lint.yml`: captures stderr, normalizes non-JSON failures into JSON, and comments a readable failure instead of crashing the comment step.

## QA / Validation

- Pass: `npm run lint:depth -- --all`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass after release-record wording fix: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The next pull request that touches Depth Lint paths will exercise the repaired workflow. No database migration or Vercel runtime rollout is required.

## Rollback Plan

Revert the PR to restore the prior Depth Lint invocation and workflow behavior.

## Audit Evidence

- PR URL and merge SHA once merged.
- Local `npm run lint:depth -- --all` output.
- CI Depth Lint check on this PR.

## Known Gaps

This only fixes Depth Lint CI reliability. It does not change the scoring rubric or exemplar content.
