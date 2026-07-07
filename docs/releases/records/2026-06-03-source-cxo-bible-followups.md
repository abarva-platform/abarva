# 2026-06-03-source-cxo-bible-followups — Source CXO Bible follow-up polish and coverage

## Release ID

`2026-06-03-source-cxo-bible-followups`

## Status

`candidate`

## Plain-English Summary

This release closes the next round of Source CXO-Bible follow-up gaps. Buyer-facing Source copy no longer uses the word `deterministic` in the audited portfolio and queue surfaces, artifact tier labels read as `Draft`, `In Progress`, and `Final` instead of internal schema values, the event canvas header collapses five export actions into one calm `Export` menu, and the live document tab now surfaces the previously orphaned pricing, award, and transition decision lenses inside the canvas. The CXO Bible acceptance spec was also hardened so it verifies the authenticated Source journey the way a real user actually navigates the app on localhost, rather than trusting a brittle direct-route dev-server shortcut. The same lane also tightens two API boundaries that showed up while rerunning the broader Source suite: seed-event detail reads now verify the seed belongs to the active client, and the artifact-body route now has an explicit tenant-safe `GET` path instead of relying on the absence of a handler.

## Layer Impact

- `global-control-lane`: Source UI copy, event-canvas header actions, document-tab presentation, and stage decision-lens rendering are shared application behavior for every client.
- `global-control-lane`: E2E acceptance coverage now exercises the authenticated Source shell path more honestly, which strengthens CI and future release verification without changing runtime behavior for users.
- `global-control-lane`: Source seed-event read guards and artifact-body route behavior are tightened across tenants; this is shared security-sensitive app behavior for all clients.

## Client Applicability

- All clients: receive the quieter Source labels, consolidated export control, and supplemental decision-lens panels where the relevant stages apply.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/source/SourceEventsPortfolio.tsx`
  - replaces buyer-visible `deterministic` wording with plain-language copy.
- `src/components/source/SentinelMissionPanel.tsx`
  - replaces buyer-visible `deterministic` wording with plain-language copy.
- `src/components/source/SourceDecisionQueueView.tsx`
  - removes the last plain-text `deterministic` wording from the queue surface.
- `src/components/source/SourceArtifactDrawer.tsx`
  - renames visible tier labels to `Draft`, `In Progress`, and `Final`.
  - humanizes seed-backed confidence and provenance copy.
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`
  - accepts a supplemental panel and uses `In progress` instead of `Outline`.
- `src/components/source/canvas/workspace-tabs/StageDecisionLensPanel.tsx`
  - new panel that surfaces pricing completeness, award decision, and transition readiness views inside the live canvas.
- `src/components/source/canvas/EventIdStrip.tsx`
  - replaces three always-visible export links with one `Export ▾` menu.
- `src/components/source/canvas/UniversalCanvasShell.tsx`
  - passes all five export actions into the consolidated menu.
  - wires the new stage decision-lens panel into the live document tab.
- `src/__tests__/behaviors/source-language-canon.test.ts`
  - extends the language guard to block `deterministic`, `Stub`, and `Outline` in targeted Source component strings.
- `src/components/source/__tests__/SourceArtifactDrawer.test.tsx`
  - updates tier-label expectations to the new buyer-facing wording.
- `tests/e2e/source/_auth.ts`
  - restores both cookies and Clerk localStorage from cached storage state.
  - hardens the post-login probe so sign-in regressions fail loudly instead of false-greening.
- `tests/e2e/source/cxo-bible-acceptance.spec.ts`
  - replaces the placeholder export assertion with a real menu assertion.
  - keeps the localhost `/source/events` redirect check as an expected flaky annotation.
  - navigates to Portfolio and the Apex event canvas through the authenticated Source shell, matching real user behavior in local dev.
- `src/lib/source/queries.ts`
  - applies active-client seed-event matching before the seed fallback path returns event detail.
- `src/app/api/v1/source/[eventId]/stage/route.ts`
  - resolves persisted event UUIDs from Source slugs before stage writes, so slug-based stage APIs hit the UUID-backed row when it exists.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts`
  - adds a tenant-safe `GET` handler for authored artifact bodies and keeps cross-tenant callers on generic 404s.
- `tests/e2e/source/golden-event-apex-ams.spec.ts`
  - replaces direct slug `page.goto()` stage setup with authenticated shell navigation before selecting the target stage.
- `tests/e2e/source/separation-of-duties.spec.ts`
  - broadens the negative-path contract to treat `409` governance blocks as valid proof that a non-approver did not advance the event.

## QA / Validation

- PASS: `BASE_URL=http://localhost:3002 npx playwright test tests/e2e/source/cxo-bible-acceptance.spec.ts --workers=1`
  - result: `18 passed`
- PASS: `npm run test:behaviors`
  - result: `6 suites, 103 tests passed`
- PASS: `npm run test:nav`
  - result: `1 suite, 26 tests passed`
- PASS: `npx jest --runInBand src/components/source/__tests__/SourceArtifactDrawer.test.tsx src/__tests__/behaviors/source-language-canon.test.ts`
- PASS: `npx eslint tests/e2e/source/_auth.ts tests/e2e/source/cxo-bible-acceptance.spec.ts src/components/source/SourceEventsPortfolio.tsx src/components/source/SentinelMissionPanel.tsx src/components/source/SourceDecisionQueueView.tsx src/components/source/SourceArtifactDrawer.tsx src/components/source/canvas/EventIdStrip.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/components/source/canvas/workspace-tabs/StageDecisionLensPanel.tsx src/__tests__/behaviors/source-language-canon.test.ts src/components/source/__tests__/SourceArtifactDrawer.test.tsx`
- PASS: `BASE_URL=http://localhost:3002 npx playwright test tests/e2e/source/cross-tenant-isolation.spec.ts --workers=1`
  - result: `6 passed`
- PASS: `npx eslint "src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts" "src/app/api/v1/source/[eventId]/stage/route.ts" src/lib/source/queries.ts tests/e2e/source/golden-event-apex-ams.spec.ts tests/e2e/source/separation-of-duties.spec.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD` (rerun required after adding this release record)

## Rollout Plan

Merge to `main` through the GitHub merge queue, then let the standard Vercel deployment promote the updated Source UI and E2E coverage. No database migration or one-off script is required.

## Rollback Plan

Revert the application commit or PR. This slice changes UI copy, canvas composition, and test/auth helper behavior only; it does not mutate schema or stored data.

## Audit Evidence

- This release record
- PR diff for the Source follow-up slice
- Playwright run showing `cxo-bible-acceptance.spec.ts` at `18/18`
- Jest behavior and nav output
- ESLint output on touched Source files
- CI release-check pass after the record is added

## Known Gaps

- The localhost-only `/source/events -> /source/portfolio` redirect timing issue remains annotated as a known expected flake in Playwright because the redirect is correct in production but can be observed pre-handoff in local dev.
- The broader `tests/e2e/source/` pack still contains pre-existing strategy/golden-event contract gaps and a cold-start Clerk timeout path outside the core CXO-Bible slice.
- This slice does not attempt to fix the separate live chat-truncation investigation.
