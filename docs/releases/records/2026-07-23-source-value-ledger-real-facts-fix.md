# 2026-07-23-source-value-ledger-real-facts-fix — Stop the value-waterfall chat answer reading a mock fixture

## Release ID

`2026-07-23-source-value-ledger-real-facts-fix`

## Status

`candidate` — local tests/lint/typecheck clean. Deploying to capture live signed-in proof for
the first tenant (SkyHarbor / Airline Demo) ever seeded with real committed-value facts for this
feature.

## Plain-English Summary

`2026-07-23-source-value-ledger-governed-chat-answer.md` (PR #5462) shipped the governed
value-waterfall chat answer and live-proved it against the Apex Retail AMS event. That proof was
real in the sense that the NDJSON pipeline, governance gate, chart, and table all worked
end-to-end — but the underlying number ($35.0M projected) came from
`buildValueLedgerGovernedAnswer()` calling `getSourceValueLedger()`, which is a one-line
pass-through to `getSourceValueSeed()` in `src/lib/source/mock-seed.ts` — a hardcoded fixture,
not a read of `source_event_facts`. This was true for every tenant, not just Apex: the feature
has never read a real, ingested value fact for any client. This was found during a separate
audit of Source's readiness for a Delta Airlines demo, prompted by discovering the SkyHarbor
("Airline Demo") tenant had no value-ledger data path that could ever return real numbers for
this feature.

This release replaces the mock read with the same real-facts seam
`vendor-coverage-governed-answer.ts` already proved out: `readCommittedValueLevers()` and
`readRealizedValueLevers()` from `src/lib/source/facts/event-facts-reader.ts`, which read
`source_event_facts` rows written by the existing `COMMITTED_VALUE_V1` / `VALUE_REALIZATION_V1`
CSV ingest templates. The projected/committed/realized separation, the governance gate, the
honest no-data fallback, and the "not a realized-savings claim" caveats are all unchanged — only
the data source moved from a fixture to real per-event facts. The event-alias fuzzy-matching
that existed only to bridge mock catalog ids is removed; real facts are already scoped exactly
by `source_event_id` + `client_key`.

`src/app/(maestro)/source/value/page.tsx` (the Value-stage canvas panel) still reads
`getSourceValueSeed()` directly and is intentionally untouched by this release — migrating that
page's own mock dependency is separate, follow-on scope.

## Layer Impact

- `global-control-lane`: changes only the governed Source value-ledger chat-answer builder and
  its call site's input shape. No schema, route contract, or permission change.
- `client-data-lane`: read behavior changes from a hardcoded fixture to a real, tenant-scoped
  read of `source_event_facts` — the same table and the same `client_key`/`source_event_id`
  scoping `vendor-coverage-governed-answer.ts` already uses safely.

## Client Applicability

- All clients: yes — every tenant's value-waterfall chat answer now reads real data instead of a
  shared fixture. Any tenant that has never ingested `committed_value_usd`/`realized_value_usd`
  facts for an event will now honestly see the no-data state instead of a fixture number.
- Specific clients: SkyHarbor (Airline Demo) is seeded with real committed-value facts for the
  first time as part of this release's live-proof (see Audit Evidence).
- Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/source/ava/value-ledger-governed-answer.ts`
  - Removes the `getSourceValueLedger()`/mock-catalog read and the `eventAliases` fuzzy-matching
    helpers (`normalizeAlias`, `eventAliasSet`, `scopedEntries`).
  - Adds `readEntriesFromFacts()`, which calls `readCommittedValueLevers()` and
    `readRealizedValueLevers()` and maps each real per-lever fact row to a `ValueLedgerEntry`
    (`kind: 'projected'` for committed-value facts, `kind: 'realized'` for realized-value facts;
    both `confidence: 'high'`, `evidenceCount: 1` — a directly-ingested fact row, matching the
    honest-confidence stance `vendor-coverage-governed-answer.ts` already uses for direct facts).
  - `BuildValueLedgerGovernedAnswerInput` drops `eventAliases`, adds optional `eventName` (used
    only in prose, never to scope the read).
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Updates the value-ledger call site: drops `eventAliases`, passes `eventName:
liveEventDetail?.name ?? null`.
- Tests: rewrote `src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts` to mock
  `readCommittedValueLevers`/`readRealizedValueLevers` instead of `getSourceValueLedger`; added a
  case proving realized facts land in their own band (never collapsed into projected) and a case
  proving a non-governable client key returns `null` without ever calling the fact readers.

## QA / Validation

- `pass` — `npx jest --runTestsByPath src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts --runInBand`
  — 9/9 tests passed. Duplicate manual-mock warnings are pre-existing repo noise.
- `pass` — `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/artifact-authority-context.test.ts' --runInBand`
  — 5/5 tests passed (confirms the route-level wiring change didn't regress adjacent intent
  routing).
- `pass` — `npx eslint src/lib/source/ava/value-ledger-governed-answer.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts`
  — clean.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors.
- `pending` — signed-in production proof against the newly-seeded SkyHarbor
  `SkyHarbor AMS Contract Optimization and Renewal Decision` event
  (`2e3e5152-017c-49f6-a2b6-83385907dfc4`), seeded via the real `COMMITTED_VALUE_V1` ingest
  template with 6 real `committed_value_usd` facts (one per `AMS_MANAGED_SERVICES` archetype
  lever key) summing to $68.0M — to be captured after merge/deploy.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow, then live-verify
signed-in as the SkyHarbor demo persona (`anand.sundaram+skyharbor@thesundaram.com`) by asking
the value-waterfall question on the seeded event and confirming the real $68.0M committed figure
renders (not the old $35.0M Apex mock figure, and not a no-data state).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be recorded after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — SkyHarbor demo persona, real seeded facts.

## Rollback Plan

Revert the merge commit. Rollback restores the mock-fixture-backed value-waterfall answer for
every tenant (the pre-existing, already-live-proven-on-Apex behavior) — no data migration either
direction, since the newly-ingested SkyHarbor `source_event_facts` rows are harmless real facts
regardless of which code path reads them.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run and post-fix live proof: to be recorded after merge/deploy.
- Real-facts seed: 12 `response_addressed` facts (`RESPONSE_COVERAGE_V1`) and 6
  `committed_value_usd` facts (`COMMITTED_VALUE_V1`) ingested into
  `SkyHarbor AMS Contract Optimization and Renewal Decision`
  (`2e3e5152-017c-49f6-a2b6-83385907dfc4`) via the existing, unmodified `/facts/ingest-file`
  route — same mechanism already proven for Meridian's vendor-coverage seed data.

## Known Gaps

- `src/app/(maestro)/source/value/page.tsx` (the Value-stage canvas panel) still reads the mock
  fixture directly and is unaffected by this fix — a real gap, tracked as separate follow-on
  work, not silently left ambiguous.
- Only `committed_value_usd` and `realized_value_usd` facts back this answer. BAFO-concession
  facts (`bafo_concession_captured_usd`) are a real, separate signal (read by
  `readBafoConcessionLevers`) not yet folded into the waterfall's bands — a real, scoped-out gap
  for a future pass, not a silent omission.
- As with `vendor-coverage-governed-answer.ts`, the governance gate runs with
  `requireAgentReady: false` because `source_event_facts` is never indexed anywhere — every
  candidate here is honestly `retrievability: "committed_not_indexed"`. Same documented,
  deliberate limitation as the sibling module.
