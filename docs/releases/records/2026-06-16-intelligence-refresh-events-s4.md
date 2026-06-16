# Intelligence Refresh Events S4 — Change Ledger

## Release ID

`2026-06-16-intelligence-refresh-events-s4`

## Status

`candidate`

## Plain-English Summary

Adds a tenant-scoped refresh-event ledger for the Context & Corpus Explorer. CSV uploads, Source artifact saves, and generated Move artifacts can now record that context changed. The Change Log tab can read those events and show what changed, where it came from, and whether review is needed.

## Layer Impact

- **Lane:** `client-data-lane`
- **Schema layer:** Adds `context_refresh_events` with tenant-key RLS and indexes.
- **Library layer:** Adds `src/lib/intelligence/refresh-events.ts` as the shared append/read helper.
- **API layer:** Adds signed-in `GET /api/intelligence/refresh-events`, fail-closed behind `context_corpus_explorer_enabled`.
- **Write hooks:** Records refresh events from Admin CSV upload, Source artifact registry writes, and generated artifact writes.
- **UI layer:** Updates the feature-flagged Change Log tab to prefer live refresh events and show an honest empty state.

## Client Applicability

- **All clients:** No default behavior change while `context_corpus_explorer_enabled` remains OFF.
- **Specific clients:** Any enrolled tenant with the S4 migration applied.
- **Internal only:** Write hooks are attached to existing authenticated/admin/operator flows.
- **Public/demo only:** No.
- **Feature flag:** `context_corpus_explorer_enabled` controls the explorer UI and read API; the ledger rows are written by the underlying context/artifact flows.

## Changes Included

- `supabase/migrations/20260616230000_context_refresh_events.sql` — new ledger table, indexes, and RLS.
- `src/lib/intelligence/refresh-events.ts` — shared record/list helper plus insight re-evaluation trigger.
- `src/app/api/intelligence/refresh-events/route.ts` — tenant-scoped read endpoint.
- `src/app/api/admin/context-layer/csv-upload/route.ts` — appends one refresh event after a governed CSV upload succeeds.
- `src/lib/source/artifact-registry/index.ts` — appends one refresh event after Source artifact registration succeeds.
- `src/lib/artifacts/repository.ts` — appends one refresh event after generated artifact persistence succeeds.
- `src/components/intelligence-v4/ContextChangeLogTab.tsx` — live Change Log binding, review filter, triage link, empty state.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passes tenant key into Change Log.

## QA / Validation

- `npx tsc --noEmit --pretty false` — passed clean.
- `npx eslint src/lib/intelligence/refresh-events.ts src/app/api/intelligence/refresh-events/route.ts src/app/api/admin/context-layer/csv-upload/route.ts src/lib/source/artifact-registry/index.ts src/lib/artifacts/repository.ts src/components/intelligence-v4/ContextChangeLogTab.tsx src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passed clean.
- `npx eslint src/app/api/intelligence/refresh-events/route.ts src/lib/intelligence/refresh-events.ts src/lib/source/artifact-registry/index.ts src/lib/artifacts/repository.ts` — passed clean after review hardening.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- `npm run test:behaviors -- --runInBand` — passed: 15 suites, 195 tests.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55434/abarva_l5?sslmode=disable' npm run db:azure:bootstrap` — passed.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55434/abarva_l5?sslmode=disable' npm run db:migrate -- --ci --allow-destructive` — passed: 232 migrations applied.
- Disposable Postgres verification: `DATABASE_URL='postgres://postgres:postgres@localhost:55434/abarva_l5?sslmode=disable' npm run db:azure:verify` — passed: 232 migrations, 346 public tables.
- Context ingestion evidence: not run in this release. This release records ledger events for existing write paths; it does not perform a real client upload, parser extraction, embedding refresh, or signed-in retrieval proof.

## Rollout Plan

Merge after S3 and its prerequisites land. Apply the migration before enabling the feature flag for a tenant. Existing CSV, Source artifact, and generated artifact flows will continue to work if refresh-event insertion fails; the helper logs the failure and preserves the primary write.

## Rollback Plan

Turn off `context_corpus_explorer_enabled` for affected tenants to hide the explorer UI. Code rollback is a normal revert of this branch. The ledger table can remain safely; it is append-only audit context.

## Audit Evidence

- Branch: `codex/context-explorer-s4`.
- Local typecheck, focused ESLint, release gate, behavior tests, disposable migration replay, and disposable schema verification are recorded in this release record.

## Known Gaps

- This does not prove a live CSV upload in a signed-in browser session.
- Source artifact hooks record staged review-required artifact registration with `rowsAccepted: 0`; they do not claim parser extraction, fact commitment, embedding refresh, or retrieval proof.
- Move artifact hooks record generated artifact persistence only; they do not claim parser extraction, fact commitment, embedding refresh, or retrieval proof.
- Insight re-evaluation is triggered best-effort after event insert and logs failures rather than blocking the primary write.
