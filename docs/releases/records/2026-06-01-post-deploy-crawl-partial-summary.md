# 2026-06-01-post-deploy-crawl-partial-summary — Post-deploy Crawl Partial Summary

## Release ID

`2026-06-01-post-deploy-crawl-partial-summary`

## Status

`candidate`

## Plain-English Summary

This release makes the authenticated post-deploy crawl write a machine-readable partial result after every successfully crawled page. If GitHub cancels or supersedes the run during a long crawl, the audit artifact still contains `latest.json` with the pages completed so far and a clear partial-run finding.

## Layer Impact

- global-control-lane: Improves the shared production crawl harness used after main deploys.
- internal-admin: Improves deploy evidence quality for pilot-readiness and production monitoring.

## Client Applicability

- All clients: The crawl harness still runs the same authenticated persona/page checks.
- Specific clients: Apex Retail, Meridian Health, and First Capital are covered by the current crawl persona matrix.
- Internal only: This changes CI/audit harness behavior, not runtime product behavior.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Resolves crawl personas and surfaces once per run so the harness knows the planned observation count.
- Writes crawl artifacts after each completed page observation.
- Marks in-progress artifacts with a P1 `partial-run` finding until the full crawl completes.
- Keeps the final completed artifact behavior unchanged.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main. The next post-deploy crawl will emit partial `latest.json` evidence even if the authenticated crawl is superseded or cancelled mid-run.

## Rollback Plan

Revert this PR. The crawl harness will return to writing `latest.json` only after the full crawl completes.

## Audit Evidence

- PR URL: pending.
- Local validation output: pending.
- Triggering evidence: Post-deploy crawl run `26778777892` uploaded screenshots/html/transcripts but cancelled before writing a completed summary artifact.

## Known Gaps

- This does not shorten the default crawl matrix. It makes partial evidence auditable; crawl duration can be optimized in a follow-up if cancellations continue.
