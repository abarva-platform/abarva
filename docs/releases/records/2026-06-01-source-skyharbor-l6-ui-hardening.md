# 2026-06-01-source-skyharbor-l6-ui-hardening — Source SkyHarbor L6 UI Hardening

## Release ID

`2026-06-01-source-skyharbor-l6-ui-hardening`

## Status

`candidate`

## Plain-English Summary

This release closes three client-visible Source defects found in the SkyHarbor Air L6 QA audit. Empty Source portfolios no longer show Apex or Meridian sample event codes. The blocked-evidence decision queue card no longer routes users through the retired setup bridge. The new Source event form now tells users exactly why the event canvas button is disabled when the required trigger is missing.

This release does not claim SkyHarbor has a live Source event, BAFO pricing proof, or production Clerk keys. Those remain separate readiness items.

## Layer Impact

- `global-control-lane`: Updates shared Source UI and Source decision queue behavior that can apply to every client.
- `public-demo`: Improves demo-mode empty portfolio copy by replacing tenant-specific sample identifiers with generic sample rows.

## Client Applicability

- All clients: Source queue blocked-evidence CTA and Source intake missing-trigger feedback.
- Specific clients: SkyHarbor Air benefits from the empty-portfolio sample cleanup observed in the L6 audit, but the sample cleanup is global.
- Internal only: None.
- Public/demo only: Empty portfolio sample copy.
- Feature flag: None.

## Changes Included

- `src/lib/source/decision-queue/detectors.ts`: blocked-evidence cards now route to `/source/new?intent=renewal` with an evidence-refresh action instead of `/setup/source`.
- `src/components/source/SourceDecisionQueueView.tsx`: simplifies the queue header copy so a sourcing VP sees the action/value framing without internal signal jargon.
- `src/components/source/portfolio/PortfolioEmptyState.tsx`: replaces `SRC-APX-*` and `SRC-MER-*` preview rows with generic `SRC-DEMO-*` rows and labels the table as a sample preview.
- `src/components/source/SourceOriginatePage.tsx`: adds visible missing-trigger guidance while the "Open sourcing event" button is disabled.
- `src/lib/source/decision-queue/__tests__/queue.test.ts`: regression guard for the blocked-evidence deep link.
- `src/components/source/__tests__/PortfolioEmptyStatePreview.test.ts`: regression guard against other-tenant codes in the empty portfolio preview.

## QA / Validation

- Pass: `jest src/lib/source/decision-queue/__tests__/queue.test.ts src/components/source/__tests__/PortfolioEmptyStatePreview.test.ts --runInBand` — 29/29 tests passed. Existing duplicate manual mock warnings and localstorage-file warning were non-fatal.
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`
- Pass: `npm run build` — passed after replacing the worktree `node_modules` symlink with a local copy. Existing localstorage-file warnings, pg SSL semantics warnings, and Azure DNS fallback warnings were non-fatal.
- Pass: local authenticated Playwright smoke as SkyHarbor Air (`cto@skyharbor-air.example.com`) against `http://localhost:3000`: `/source/portfolio` showed generic `SRC-DEMO-*` sample preview without `SRC-APX`, `SRC-MER`, or `SRC-SKY`; `/source/new` showed the missing-trigger helper; `/source/queue` exposed `Open decision` with href `/source/new?intent=renewal`.

## Rollout Plan

Merge to `main` after green CI. Vercel production deploy activates the Source UI changes automatically. No migration or manual data load is part of this release.

## Rollback Plan

Revert the merge commit. No database rollback is required.

## Audit Evidence

- PR URL and CI run after branch publication.
- Diff for the three changed Source files and two focused regression tests.
- Post-deploy browser crawl should re-check `/source/portfolio` and `/source/queue` as SkyHarbor Air.

## Known Gaps

- SkyHarbor Air still needs at least one real or explicitly synthetic Source event before Stage 1-11 and BAFO/pricing proof can be audited.
- Clerk production-key migration remains an environment/auth blocker outside this code slice.
- RSC prefetch 503s remain a platform stability item unless reproduced and traced in this release.
- Tower DOCX/XLSX download behavior still needs live post-deploy verification; this release does not change the Tower export route.
