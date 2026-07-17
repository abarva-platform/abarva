# 2026-07-17-tower-route-timeout-fallback — Tower Route Timeout Fallback

## Release ID

`2026-07-17-tower-route-timeout-fallback`

## Status

`candidate`

## Plain-English Summary

The signed-in P0-P5 Moves proof completed the final phase and routed to Tower, but the Tower page rendered only the navigation shell and stayed loading. This change prevents Tower's server route from hanging indefinitely on data or story-enrichment reads. If a Tower read is slow or fails, the route renders the deterministic fallback view instead of leaving the user on a blank shell.

## Layer Impact

- `global-control-lane`: shared Tower route resilience. The route now bounds data reads and Claude story enhancement with an 8 second fallback.
- `runtime UX`: post-Moves Tower handoff becomes render-safe even when an enrichment loader is slow.

## Client Applicability

- All clients: yes, for the shared `/tower` route.
- Specific clients: Healthcare Demo / Meridian was the live proof tenant that exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag; existing Tower feature flags continue to apply.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`
  - Added `withTowerReadTimeout`.
  - Bounded `loadCioTowerCxoView`.
  - Bounded `listTowerBudgetRollupsForClient`.
  - Bounded `applyTowerCxoClaudeStory`, falling back to the deterministic Tower V3 runtime view.

## QA / Validation

- Pass: `npx eslint src/app/(maestro)/tower/page.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending live proof after merge/deploy:
  - Signed-in `/tower` renders page body after P5 handoff.
  - P0-P5 proof Move remains completed through P5.

## Rollout Plan

Merge through PR to `main`; repo-owned ACA main deploy builds and deploys the image to `ca-abarva-web-lab-eastus`. Verify 100% traffic on the new digest-pinned revision, then re-open `/tower` in the signed-in Healthcare Demo session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy proof.
- Worker image invariant: unchanged by this route-only fix; main deploy workflow still verifies.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. No schema or data changes are included.

## Audit Evidence

- PR URL: pending.
- Live proof before fix: `/Users/anand/Downloads/moves-p0-p5-proof-2026-07-17/15-tower-after-p5-blank-shell.png`

## Known Gaps

- The root cause of the slow Tower loader should still be inspected separately if the timeout fallback is exercised frequently. This PR prevents a blank route during executive workflow handoff; it does not tune the underlying loader latency.
