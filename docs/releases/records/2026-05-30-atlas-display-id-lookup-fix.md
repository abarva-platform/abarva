# 2026-05-30 · Atlas — initiative display_id lookup fix (HI-2 + HI-4)

## Release ID
`2026-05-30-atlas-display-id-lookup-fix`

## Status
candidate

## Plain-English Summary
The Wave 3 four-section composition ("Your data / Industry context / The gap / Next move") was effectively dead-code with real seed data because `loadInitiativeRow` looked up initiatives by the database PK only. CIO prompts surface the user-facing display_id (e.g. `AR-01`, `MH-01`, `FCF-01`) — which the intent classifier correctly extracts but the row loader could not resolve. As a result every real prompt fell back to `"No such initiative in your scope: AR-01. Atlas did not retrieve cross-tenant content."`

This release makes `loadInitiativeRow` accept either the DB PK OR the display_id and broadens the intent-classifier regex to cover First Capital (`FCF-`) and SkyHarbor (`SHA-`) prefixes that did not match the old `FC-` alternative due to word-boundary rules.

## Layer Impact
- `runtime-app-lane`: Atlas Wave 3 four-section composition becomes reachable with real seeds. No surface or UI changes.
- `architecture-lane`: `loadInitiativeRow` contract widens — it now resolves PK-or-display_id. Tenant-scope filter remains the first applied predicate (P0 invariant preserved). `getInitiativeDeepView` now uses the resolved PK for downstream joins (`loadInitiativeKpis`, `loadGatesForInitiative`, `loadSignalsForInitiative`, `computePortfolioPosition`) so KPI/gate/signal/percentile reads continue to key correctly when callers pass display_ids.
- `qa-validation-lane`: 1 new test file (6 cases), 1 augmented intent test (6 parametric prompts), 1 augmented compose test (1 regression case). Total 42 cases passing across the Atlas composition + deep-retrieval suites.
- `data-plane-lane`: none — no schema changes.

## Client Applicability
- All clients: yes. The fix unblocks hybrid (data + industry) Atlas answers for every tenant whose initiatives use display_ids.
- Specific clients: Apex Retail (`AR-`), Meridian Health (`MH-`, `MR-`), First Capital Finance (`FCF-`), SkyHarbor Airlines (`SHA-`) — all now resolve in CIO prompts.

## Changes Included
- `src/lib/atlas/initiative-deep/joins/ai-initiatives.ts` — `loadInitiativeRow` switched from `.eq('initiative_id', id)` to `.or('initiative_id.eq.<id>,display_id.eq.<id>')` under the existing `.eq('client_id', ctx.clientId)` scope. Docstring updated.
- `src/lib/atlas/initiative-deep/retrieve.ts` — `getInitiativeDeepView` resolves the row first, then passes `initiative.initiative_id` (the real PK) to KPI/gate/signal/portfolio joins. Comment block explains why.
- `src/lib/atlas/composition/intent.ts` — `INITIATIVE_ID_RE` widened from `(AR|MH|FC|APX|MER|FCFI)` to `(AR|MH|MR|FCF|FC|SHA|APX|MER|FCFI)`. `FCF` deliberately ordered before `FC` so alternation matches the longer prefix first (closes HI-4 — real First Capital codes are `FCF-NN` and `\b` failed on the original `FC` alternative because the next character was `F`, not `-`).
- `src/lib/atlas/initiative-deep/_test-mock-client.ts` — added `.or()` support to the test mock so it can model PostgREST OR expressions of the form `<col>.eq.<val>,<col>.eq.<val>`.
- `src/lib/atlas/initiative-deep/joins/__tests__/ai-initiatives.test.ts` — new. 6 cases covering: PK back-compat, display_id resolution (the fix), cross-tenant display_id lookup returns null in both directions (P0), and nonexistent id returns null.
- `src/lib/atlas/composition/__tests__/intent.test.ts` — augmented with a parametric `it.each` over `FCF-01`, `FCF-018`, `SHA-12`, `MR-01`, `AR-01`, `MH-01`.
- `src/lib/atlas/composition/__tests__/compose.test.ts` — regression case: when the DB PK differs from the display_id (the live shape — PK `apex-llm-copilot-2025`, display_id `AR-77`), `composeAtlasIacAnswer({prompt:'Compare AR-77 to industry benchmarks'})` returns the full four-section answer rather than the "No such initiative" fallback.

## QA / Validation
- `npx tsc --noEmit` clean (only pre-existing workflow-artifact module-not-found errors for `@azure/*`, `pptxgenjs`, `@resvg/resvg-js` per memory note `feedback_typecheck_workflow_artifact`).
- `npx jest src/lib/atlas/initiative-deep src/lib/atlas/composition` — 42/42 passing (was 35 before this PR; 6 new HI-2 tests, 6 new HI-4 parametric cases counted in `it.each`, 1 new regression compose test).
- P0 tenant-scoping invariant explicitly retested in `ai-initiatives.test.ts` — Apex tenancy asking for `MH-01` returns `null`, never the Meridian row; symmetric reverse covered.

## Detection
Detected during the 2026-05-30 Atlas IAC end-to-end CIO-prompt audit:
- `reports/2026-05-30-atlas-iac-e2e/ISSUES_CURATED.md` HI-2 (display_id vs initiative_id key mismatch) and HI-4 (regex misses real `FCF-NN` codes).
- `reports/2026-05-30-atlas-iac-e2e/raw.json` — the hybrid four-section composition fired 0/18 times across real CIO prompts; every initiative-bearing prompt returned the "No such initiative in your scope" fallback.
- Verified live before the fix: `composeAtlasIacAnswer({prompt:'Compare AR-01 to industry benchmarks'})` returned `"Your data\nNo such initiative in your scope: AR-01. Atlas did not retrieve cross-tenant content."`

## Rollout Plan
- Merge this PR to main. Required gates as standard; Vercel Preview ignorable.
- No runtime config or data changes. The lookup widening is backward-compatible — every caller still passing a PK gets the same row.
- Wave 3 composition immediately becomes reachable for every CIO prompt that surfaces a display_id matching the intent regex. Tenant-scope behavior is unchanged.

## Rollback Plan
- Revert this PR. The lookup falls back to PK-only and Wave 3 composition reverts to "No such initiative" for display_id prompts. No data migration; no schema impact.

## Audit Evidence
- HI-2 root cause:
  - `src/lib/atlas/initiative-deep/joins/ai-initiatives.ts` (before): `.eq('initiative_id', initiativeId)` — would not match a row whose PK is `apex-llm-copilot-2025` when the caller passed `AR-01`.
  - `src/lib/atlas/composition/intent.ts` extracts `AR-01` from the prompt and passes it verbatim through `composeAtlasIacAnswer` → `getInitiativeDeepView` → `loadInitiativeRow`.
- HI-4 root cause:
  - `/\b(?:AR|MH|FC|APX|MER|FCFI)-\d{2,4}\b/i.test('FCF-01')` → `false`. The `\b` boundary after `FC` requires `FC` to be followed by a non-word char, but `FCF-01` has `F` next. Regex alternation also tries `FCFI` which fails on `FCF-`. Verified by the new `intent.test.ts` parametric cases.

## Known Gaps
- The audit also flagged HI-3 (First Capital `STR-CROSS-IDS` sentence duplication / truncation) and lower-priority items; those are out of scope for this PR and tracked in `reports/2026-05-30-atlas-iac-e2e/ISSUES_CURATED.md`.
- The `lastReviewed` honesty / banned-phrase invariants are unchanged; this PR touches retrieval and intent only.
