# 2026-07-06-intelligence-surface-executive-briefing — Intelligence Executive Briefing Surface

## Release ID

`2026-07-06-intelligence-surface-executive-briefing`

## Status

`candidate`

## Plain-English Summary

This release restores the Intelligence page to the standalone executive-briefing design contract. The left side is the aVa analyst conversation. The right side is a deterministic executive briefing canvas with tabs for Answer, Industry Signal, Trends, Plays, and Evidence. The route now renders the advisory briefing surface instead of the older IntelligenceV2 canvas so the page matches the attached Intelligence Surface specification more closely.

The ask route itself is not replaced by the older branch implementation. The advisory page consumes the current production stream contract, including `agent-answer` packets, while still supporting older delta/source/follow-up events.

## Layer Impact

- `global-control-lane`: Changes the shared authenticated Intelligence page rendering for all clients.
- `client-data-lane`: No schema, migration, tenant data, ingestion, or retrieval change.

## Client Applicability

- All clients: Yes. The Intelligence route receives the two-zone analyst/briefing rendering pattern.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Rewired `src/app/(maestro)/intelligence/page.tsx` to render `AdvisoryIntelligencePage`.
- Added `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`.
- Added `src/components/intelligence-advisory/AdvisoryIntelligencePage.module.css`.
- Added `src/lib/home/enterprise-landscape-view-model.ts` as the deterministic briefing view model consumed by the advisory surface.
- Added UI regression coverage in `src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx`.
- Patched the advisory stream consumer to display current `agent-answer` packets from the live Intelligence ask route.

## QA / Validation

- Pass: `npx jest src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx --runInBand` (Jest emitted pre-existing duplicate manual mock warnings for mdast/micromark mocks, but the targeted suite passed: 2 tests / 2 passed).
- Pass: `npx eslint src/app/(maestro)/intelligence/page.tsx src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx src/lib/home/enterprise-landscape-view-model.ts`
- Pass: `npm run release:check`
- Blocked: `npm run build` in the temporary worktree. The first run failed because Turbopack rejects a `node_modules` symlink outside the project root. After localizing dependencies, the build failed on missing local dependency packages also missing from the root install (`@vercel/turbopack/postcss`, `@azure-rest/ai-document-intelligence`) and unrelated Azure optional-package resolution. This requires the normal ACR/Docker build path for final proof.
- Blocked: `npx tsc --noEmit --pretty false --incremental false` exhausted the local Node heap on the full repo.
- Not run: signed-in browser proof on `https://app.abarva.ai/intelligence`

## Rollout Plan

Merge through the approved release lane, build a digest-pinned Azure Container Apps image from the merged SHA, wait for the new revision to become healthy, move 100% ingress traffic to the corrected revision, then run signed-in browser proof for Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: Required for the final release through the approved Azure Container Apps lane.
- Shared runtime mutators: None in this change. No environment variables, secrets, DNS, traffic, worker jobs, or database migrations are changed by the code diff.
- Approved image digest: Pending final ACA build.
- ACA runtime invariant: Must be verified after deploy for `ca-abarva-web-lab-eastus`.
- Worker image invariant: Not applicable; web UI only.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Lakeshore and SkyHarbor Intelligence.

## Rollback Plan

Move ACA traffic back to the previous healthy revision. No migration rollback is required because this release does not change database schema or loaded tenant data.

## Audit Evidence

- Release record: `docs/releases/records/2026-07-06-intelligence-surface-executive-briefing.md`
- Pending: test logs, ACA revision, image digest, and signed-in screenshots after deploy.

## Known Gaps

- The right briefing canvas is deterministic from the existing enterprise landscape view model. Deeper V7 Intelligence read-model binding remains a follow-on unless supplied by that view model.
- Final signed-in browser proof remains required before claiming the standalone-spec surface is live.
