# 2026-06-03-source-inline-generated-artifact-registry — Persist generated Source drafts in the registry without object-storage dependency

## Release ID

`2026-06-03-source-inline-generated-artifact-registry`

## Status

`candidate`

## Plain-English Summary

This change fixes the live Source retest gap where `Generate with Sentinel` succeeded on the Apex AMS Strategy Memo, but the `Stored documents` shelf still said `No DB-backed documents yet` after reload. The generation route was already persisting the canvas body, but its follow-on `source_artifacts` write was best-effort and depended on a second object-storage upload. When that mirror step failed, the UI looked half-finished: the draft was visible in the canvas but absent from the registry shelf. Generated Source drafts now register as inline-backed `source_artifacts` rows tied to the existing substrate body, so the shelf, audit trail, and artifact detail page can all resolve the same generated memo without needing a second storage hop.

## Layer Impact

- `global-control-lane`: shared Source generation behavior changes for all tenants using `generate-from-claude`. Successful AI drafts now create first-class registry rows even when no mirrored blob upload is available.
- `client-data-lane`: generated Source drafts are now queryable through `source_artifacts` and artifact detail lookups using inline provenance that resolves back to `source_event_artifact_states.body`.

## Client Applicability

- All clients: tenants using Source artifact generation
- Specific clients: Apex Retail immediately benefits because the failing retest path is `d01_strategy_memo` on `apex-retail-ams-outsourcing-2026`
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
  - register generated drafts in `source_artifacts` using inline-backed provenance URIs
  - stop depending on object storage just to mirror the same markdown body
  - persist `sourceEventRowId` alongside `sourceEventId` for generated drafts
- `src/lib/source/queries.ts`
  - teach artifact detail reads to resolve `inline://source-event-artifact-state/...` records back to the substrate body

## QA / Validation

- Live production retest before this change — `FAIL`:
  - Strategy Memo generation succeeded
  - `Stored documents` still showed `No DB-backed documents yet` after reload
- `git diff --check` — `PASS`
- `npm run release:check -- --base origin/main --head HEAD` — `PASS` after record update
- `npx eslint 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts' src/lib/source/queries.ts` — `PASS`
- Live browser retest on `/source/events/apex-retail-ams-outsourcing-2026?stage=strategy` — `NOT RUN` at record-author time; rerun immediately after deploy

## Rollout Plan

Merge to `main`, let Vercel deploy production, then rerun the authenticated Source retest starting with Strategy Memo generation and persistence on the Apex AMS event.

## Rollback Plan

Revert this commit or PR. The change is isolated to Source generated-draft registry persistence and artifact-detail read fallback. No schema or migration changes are involved.

## Audit Evidence

- This release record
- Live browser retest evidence showing generation succeeded but registry shelf remained empty before the fix
- Post-deploy browser retest proving the shelf populates and survives reload

## Known Gaps

- Repo-wide TypeScript may still be blocked by the pre-existing `@axe-core/playwright` dependency gap if that baseline issue is still present in the checkout used for validation.
- This change does not address unrelated ops items like Clerk production cutover or RSC 503 investigation.
