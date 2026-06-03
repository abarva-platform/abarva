# 2026-06-02-source-p0-surge — Source L6 P0 Surge

## Release ID

`2026-06-02-source-p0-surge`

## Status

`candidate`

## Plain-English Summary

This release closes the highest-severity Source findings from the rigorous L6 audit. Source AI artifact generation now resolves the golden Apex slug onto the persisted UUID-backed Source row before the canvas serializes `event.id`, and the AI egress preflight now writes the artifact-row UUID instead of any human-readable slug. That prevents the `invalid input syntax for type uuid` failure on Generate with Sentinel. Source exports now fail with structured JSON fallback responses instead of opaque platform 503s, the Strategy Memo is wired through DOCX/HTML/PDF export routing, approval decisions require a rationale before either approve or reject, and the Source Decision Queue collapses duplicate vendor-contract records into one row per real vendor/product contract.

## Layer Impact

- `global-control-lane`: shared Source generation/export, admin approval UX, and Source Decision Queue projection behavior for all clients.
- `client-data-lane`: no schema or private data mutation. Contract dedup happens at projection time and does not delete or rewrite source records.

## Client Applicability

- All clients: yes, for Source module generation, export, decision queue, and admin approval surfaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude` now uses the resolved Source event UUID for AI preflight `artifactId` and metadata.
- Golden Apex shell routes now resolve `apex-retail-ams-outsourcing-2026` through the persisted `SRC-004` row when present, so canvas actions, exports, and generation calls operate on the real UUID-backed Source event instead of the seed slug.
- `/api/v1/source/[eventId]/cxo-report` returns `pptx_unavailable` with an HTML fallback when PPTX rendering cannot be loaded.
- `/api/v1/source/[eventId]/deal-pack` catches unhandled export failures and returns `deal_pack_unavailable` instead of an opaque platform failure.
- `d01_strategy_memo` is added to Source DOCX/HTML/PDF export routing.
- `ApprovalDecisionPanel` requires rationale before approve or reject.
- Source Decision Queue vendor contracts are deduplicated by normalized `(vendor, product)` with canonical-source preference.

## QA / Validation

- PASS — `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts src/components/admin/__tests__/ApprovalDecisionPanel.test.tsx src/lib/source/decision-queue/__tests__/projection.test.ts src/lib/source/exports/__tests__/format-router.test.ts src/lib/source/exports/__tests__/dispatch.test.ts --runInBand` — 5 suites / 71 tests.
- PASS — `npx tsc --noEmit --pretty false`.
- PASS — `git diff --check origin/main HEAD && git diff --check`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` after checks pass. Vercel Git integration deploys production automatically. No database migration or manual data operation is required.

## Rollback Plan

Revert the release commit. The changes are code-only and do not mutate persisted data or introduce schema changes.

## Audit Evidence

- Pull request and CI checks for this branch.
- Focused Jest output showing the UUID preflight guard, export routing, approval rationale gate, and contract dedup behavior.
- Vercel production deployment after merge.

## Known Gaps

- PPTX export may still be unavailable in environments missing `pptxgenjs`; this release makes the failure structured with HTML fallback rather than claiming PPTX is fully functional.
- Activity-log persistence, generated memo DB persistence, deeper Pricing/BAFO authored content, Clerk production-domain migration, and live chat truncation debugging remain separate backlog items.
