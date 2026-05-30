# 2026-05-30-setup-data-trust-unlock-preview — Per-Segment Unlock Preview on Data Trust (Wave 3 PR-2)

## Release ID

`2026-05-30-setup-data-trust-unlock-preview`

## Status

`candidate`

## Plain-English Summary

Every sparse segment on `/admin/data-trust` now shows a concrete unlock preview underneath its trust-ladder row: a Georgia-italic question an operator could ask, plus a mono "would cite:" example showing the exact citation an agent would surface once the substrate is loaded. The preview is anchored to the agent that would answer (Sentinel, Atlas, Nexus, or Steward) so admins see *what* loading the segment buys them, not just *that* it's missing.

The 14 canonical segments each get an authored question + citation pair tied to the real Apex Retail demo content (e.g. KPI dictionary unlocks "Why did same-store comp slow in Q3?" → `Apex KPI Dictionary §SSC: comp-store basis — 13-month tenure, ex-fuel`). Mature segments (Decision-grade / Usable evidence / Agent-usable rungs) hide the block — only Empty / Loaded / Available rungs show it.

This closes Wave 3 PR-2 from `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7: "every sparse segment shows a concrete preview: Load this and Sentinel can answer X with citation Y."

## Layer Impact

- `runtime-app-lane`: New `unlocksPreview()` function and `CANONICAL_SEGMENT_UNLOCKS_PREVIEW` map in `src/lib/admin/setup-vocab.ts` — typed `{ question, citationExample, agent }` shape, 14 canonical segments populated. `composeDataTrustBlocks` now emits `unlocksPreview` + `isSparse` on every `TrustLadderRow`. `TrustLadderTable` renders an inline `UnlockPreviewBlock` under each sparse row.
- `qa-validation-lane`: 6 new schema tests in `setup-vocab.test.ts` (every segment populated, question shape, citation shape, agent named, lookup + fallback). 2 new composer tests in `data-trust-composer.test.ts` (preview present per row, `isSparse` flag correctness). 3 new component tests in `TrustLadderTable.test.tsx` (sparse renders block, mature hides block, mixed list filters correctly). 11 net new tests.
- `architecture-lane`: No new boundaries crossed. `setup-vocab` is a pure module with no broker / Supabase / vector / graph imports. The preview data is authored content, not a live query, so this does not extend the broker boundary.
- `data-plane-lane`: No schema change. No migration.

## Client Applicability

- All clients: The 14 canonical previews apply to every tenant. Sparse-vs-mature classification is driven by the per-tenant snapshot already composed by `composeDataTrustBlocks`, so the page renders correctly with any tenant's substrate state.
- Specific clients: The authored question + citation pairs use Apex Retail demo content for concreteness (CDP renewal date, comp-store basis, store-associate AI peer rate). The previews are illustrative — they hold for Apex out of the box and read as plausible templates for other tenants until per-tenant overrides land.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/setup-vocab.ts` (modified) — adds `UnlocksPreview` interface, `SEGMENT_UNLOCKS_PREVIEW` map with 14 canonical entries, `unlocksPreview(familyNumber, segmentName)` lookup with graceful fallback, and `CANONICAL_SEGMENT_UNLOCKS_PREVIEW` export for the schema test. Existing `unlocksCopy()` is preserved — no caller is broken.
- `src/lib/admin/data-trust-composer.ts` (modified) — imports `unlocksPreview` + `UnlocksPreview` type; extends `TrustLadderRow` with `unlocksPreview: UnlocksPreview` and `isSparse: boolean`; new `isSparseRung()` helper returns true for Empty / Loaded / Available rungs; both real-segment and fallback-segment ladder rows populate the new fields.
- `src/components/admin/data-trust-redesign/TrustLadderTable.tsx` (modified) — wraps each row in a `div` so the unlock-preview block can render after the row link without breaking the row's clickable surface. New `UnlockPreviewBlock` component: locked palette (paperSoft background, cardLineStrong left border), Georgia italic question in quotes, mono "would cite:" + citation example, `Load this and {Agent} can answer` eyebrow. Renders only when `row.isSparse === true`.
- `src/lib/admin/__tests__/setup-vocab.test.ts` (modified) — 6 new tests in a `unlocksPreview (Wave 3 PR 2 schema)` describe block: every canonical segment populated, question ends with `?`, citation contains `:`, agent named and in the allowed set, known-family lookup, unknown-family fallback.
- `src/lib/admin/__tests__/data-trust-composer.test.ts` (modified) — 2 new tests on the ladder block: every row carries an `unlocksPreview` shaped `{ question, citationExample, agent }`, and `isSparse` flag correctness for Empty / Loaded / Available vs Decision-grade / Usable evidence / Agent-usable.
- `src/components/admin/data-trust-redesign/__tests__/TrustLadderTable.test.tsx` (new) — 3 jsdom render tests: sparse row renders preview block with question + citation + agent label; mature row hides the block; mixed-row list filters correctly.

## Risks · Caveats

- The preview content is authored for Apex Retail — citation examples reference Apex-specific entities (Salesforce CDP, Segment vendor, CDP-RFP-2026). For other tenants the citation shapes will read as plausible templates until per-tenant preview overrides land. Acceptable for Wave 3 PR-2 scope.
- No live data is queried — `unlocksPreview` is pure authored content. If a per-segment preview ever needs to read from the broker (e.g. citing the most recent ingested document), that's a follow-up: the function signature can stay the same with a broker call layered behind it.
- The `TrustLadderTable` row was previously a single `<Link>`. Wrapping in a `<div>` is a minor structural change — the click surface remains the same and `data-trust-row=…` selectors are preserved on the inner link. Existing data-trust-page tests pass unchanged.

## Verification

- `npx eslint src/lib/admin/setup-vocab.ts src/lib/admin/data-trust-composer.ts src/components/admin/data-trust-redesign/TrustLadderTable.tsx` — clean.
- `npm test -- setup-vocab data-trust-composer TrustLadderTable.test` — all new tests pass; existing tests pass unchanged.

## Co-Authored-By

- Claude Opus 4.7
