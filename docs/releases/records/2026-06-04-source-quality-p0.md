# 2026-06-04-source-quality-p0 — Source Audit P0/P1 Stabilization

## Release ID

`2026-06-04-source-quality-p0`

## Status

`candidate`

## Plain-English Summary

This release closes the highest-risk Source audit findings that could break a CXO walkthrough. The Source compare page now uses the same tenant-scoped event list as the portfolio instead of the old global fixture catalogue. Value Proof can resolve a human-readable event slug to the persisted Source event UUID before reading or writing value-chain rows. The CXO Report PPTX route no longer exposes a raw JSON/Vercel-style error when the slide renderer is unavailable; it shows a calm HTML fallback with a link to the working report. Sentinel event answers now reject mismatched Apex live-event context and fall back to the current event's persisted facts. `/source/setup` now resolves to a simple operator setup checklist instead of a 404. The release also updates the canonical tenant verifier to recognize Lakeshore Holdings, matching the live data plane.

## Layer Impact

- `global-control-lane`: Shared Source UI/API behavior changes for all Source tenants, plus the canonical tenant allowlist update for Lakeshore Holdings. No schema migration and no new provider dependency.
- `client-data-lane`: Read/write safety is improved by resolving Source value-chain operations to the persisted event UUID and by preventing the compare page from listing unscoped fixture events. The live Lakeshore client metadata row was normalized so the canonical verifier can prove the sixth tenant cleanly.

## Client Applicability

- All clients: Receive the safer Source compare, PPTX fallback, Source setup route, and cleaned portfolio copy.
- Specific clients: Apex Retail receives the immediate Sentinel event-scope guard for the Apex adapter path and the AMS slug-to-UUID Value Proof fix.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `/source/compare` now lists and resolves events through `listSourcingEvents()` / `getSourcingEvent()` instead of `SOURCE_EVENT_INSTANCES`.
- `src/lib/source/value-chain.ts` resolves seed slugs to event codes and uses the resolved UUID for value-state reads, evidence references, and writes.
- `/api/v1/source/[eventId]/cxo-report?format=pptx` returns a user-facing HTML fallback when PPTX rendering is unavailable.
- `/api/v1/source/[eventId]/nexus/ask` only uses Apex adapter live-event context when it matches the requested event.
- `/source/setup` now renders a lightweight Source setup checklist.
- Source portfolio copy no longer says "seeded sourcing events" in the buyer-facing surface.
- `CANONICAL_TENANTS` and `verify-canonical-tenants` now include the sixth canonical client, Lakeshore Holdings.

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/compare/page.tsx' 'src/app/(maestro)/source/setup/page.tsx' 'src/app/(maestro)/source/events/[eventId]/value/page.tsx' 'src/app/api/v1/source/[eventId]/cxo-report/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/lib/source/value-chain.ts src/components/source/SourceEventsPortfolio.tsx` — passed.
- `npx jest src/__tests__/behaviors/source-language-canon.test.ts --runInBand` — passed, 5 tests.
- `npx jest tests/unit/nav-active-state src/__tests__/unit/source-subnav-active-state.test.ts --runInBand` — passed, 26 tests.
- `npm run release:check` — passed.
- `git diff --check` — passed.
- `npm run db:verify:canonical-tenants` — passed after normalizing the live Lakeshore row to `industry_code=diversified` and `industry=diversified`.
- `npx jest src/app/api/admin/switch-tenant/__tests__/route.test.ts src/config/tenants/__tests__/tenant-compliance.test.ts --runInBand` — passed, 14 tests.
- `npx tsc --noEmit --pretty false --incremental false` — blocked by pre-existing missing type packages for `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`; no touched-file TypeScript errors were reported before those dependency failures.

## Rollout Plan

Merge to `main`; Vercel production deploy picks up the Source route/API/UI changes. The one live tenant metadata correction has already been applied to the Lakeshore row; no migration or backfill is required.

## Rollback Plan

Revert the PR from `main` and let Vercel redeploy the previous Source runtime. The Lakeshore row normalization can remain in place because it makes the live tenant metadata more canonical; rolling it back would re-break the drift verifier.

## Audit Evidence

- PR diff and CI checks for this release.
- Source audit input dated 2026-06-04.
- Focused command output listed in QA / Validation.
- Live metadata correction evidence: Lakeshore row changed from `industry_code=DIVERSIFIED, industry=null` to `industry_code=diversified, industry=diversified`.

## Known Gaps

- PPTX generation itself is still dependent on the serverless renderer bundle; this release makes the failure user-safe but does not guarantee native slide export.
- Deal Pack content depth, DOCX export behavior, evidence request workflow depth, Dossier shell alignment, and full Source setup/admin automation remain follow-up items from the audit.
- Full TypeScript remains blocked by missing dependency declarations unrelated to this release.
