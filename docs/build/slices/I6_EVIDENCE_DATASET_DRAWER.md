# I6 · Intelligence · Evidence Dataset Drawer

Slice ID: I6
Slice name: Intelligence · Evidence Dataset Drawer
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic Evidence Dataset Drawer to the canonical Sentinel
pattern detail surface. The drawer answers "what evidence and what
datasets back this pattern, and where are the gaps?" with structured
seed entries — never live retrieval — partitioned into Internal vs
External sources, labelled by usability and freshness, and (where
applicable) with explicit missing-citation callouts. **No live
retrieval, no Claude / OpenAI / Pinecone invocation, no live registry
binding, no migrations.**

## What changed

- New module
  [src/lib/intelligence/evidence-dataset-drawer-view.ts](../../../src/lib/intelligence/evidence-dataset-drawer-view.ts):
  - Public types: `EvidenceDatasetSourceKind`,
    `EvidenceFreshnessLabel`, `EvidenceUsabilityLabel`,
    `EvidenceDatasetEntry`, `EvidenceDatasetDrawerView`.
  - Public helpers: `buildEvidenceDatasetDrawerView(patternKey)`,
    `buildEvidenceDatasetDrawerSeedAll()`, `getInternalSources(view)`,
    `getExternalSources(view)`.
  - Deterministic seed coverage across 4 canonical I1 pattern keys
    (`value_ledger_incompleteness`, `evidence_chain_gap`,
    `gate_governance_gap`, `program_context_sparsity`) with at least
    4 entries per pattern and at least 2 internal + 1 external entry
    per pattern. The seed exercises all 5 source kinds, all 4
    freshness labels, and all 4 usability labels.
  - Every `partial` or `blocked` entry carries at least one explicit
    `missingCitations` row.
  - Every `citationLocator` is a structured seed reference (e.g.
    `program/{slug}/charter#section-{n}`,
    `dataset/{domain}/lineage#row-{n}`,
    `tenant/{tenantSlug}/artifact/{artifactSlug}#section-{n}`) — never
    a live URL and never a literal `E-###` token.
  - `honestDisclaimer` mentions "deterministic seed" and "no live
    external retrieval".

- New component
  [src/components/intelligence/EvidenceDatasetDrawer.tsx](../../../src/components/intelligence/EvidenceDatasetDrawer.tsx):
  - Server component (no client interactivity, no hooks).
  - Renders header (pattern label + total entry count), a two-column
    Internal / External split, per-entry cards (source-kind chip,
    usability chip with NAVY/AMBER/RED/MUTED tone, freshness chip,
    `JetBrains Mono` citation locator, italic quality notes, red
    callout listing every missing citation), and a footer with
    usability + freshness breakdowns and the honest disclaimer.
  - Reads tokens from `@/lib/design/abarva-theme` (NAVY accent on
    off-white surface, DM Sans body, JetBrains Mono for locators).
  - Root carries `data-evidence-dataset-drawer="i6"`.

- Integrated into the canonical pattern detail surface
  [src/components/intelligence/SentinelPatternDetail.tsx](../../../src/components/intelligence/SentinelPatternDetail.tsx):
  - New `<EvidenceDatasetDrawerSection>` block rendered between the
    I4 authored content panel and the existing footer.
  - Renders nothing when the drawer view has zero entries (honest
    fallback for pattern keys without seed coverage today).
  - No structural changes to existing I1–I4 blocks; the addition is
    purely additive.

- New tests
  [src/__tests__/integration/intelligence/evidence-dataset-drawer.test.ts](../../../src/__tests__/integration/intelligence/evidence-dataset-drawer.test.ts):
  33 deterministic tests across 9 describe blocks covering view
  determinism (byte-equal across calls), seed coverage (≥3 patterns,
  ≥4 entries each, ≥2 internal + ≥1 external per pattern, all 5
  source kinds, all 4 freshness labels, all 4 usability labels),
  per-entry contract (`partial`/`blocked` carry missing citations,
  internal/external partition correctness, locator format hygiene),
  view aggregation correctness (breakdowns sum to total,
  totalMissingCitations consistent, accessor identity), honest
  disclaimer, serialization hygiene (no `https://`, no `E-\d+`, no
  `$<digit>`), and module hygiene across the view helper, the
  component, and the I3 detail mount.

## How it consumes I1 / EVID2 / EVID3

```text
SentinelPatternKey (I1)
        │
        ▼
buildEvidenceDatasetDrawerView(patternKey)             ← I6 view helper
        │
        ▼
EvidenceDatasetDrawerView
   ├─ internalEntries  (tenant artifact, program evidence, dataset domain)
   ├─ externalEntries  (public pattern pack, industry benchmark)
   ├─ usabilityBreakdown / freshnessBreakdown
   └─ honestDisclaimer
        │
        ▼
<EvidenceDatasetDrawer view=…/>                        ← I6 component
        │
        ▼
embedded in <SentinelPatternDetail view=…/>            ← I3 surface
```

The view helper imports only the I1 detection module (for the
canonical `SentinelPatternKey` tuple). The component imports only the
I6 view helper and `@/lib/design/abarva-theme`. The integration into
the I3 surface is purely additive — no existing block is replaced, no
existing import is removed.

EVID2 (Evidence Ledger MVP) and EVID3 (Evidence Claim Support) define
the canonical evidence-state lifecycle the drawer presupposes; this
slice does not import them directly because the drawer is a deterministic
seed read model, not a live ledger projection. A future slice can swap
the seed for a live EVID2 / EVID3 projection without changing the
drawer view contract.

## What is deterministic today

- View shape for every canonical I1 pattern key is byte-equal across
  repeated calls (test enforced).
- Empty view shape for unknown pattern keys is also byte-equal and
  carries the honest disclaimer (test enforced).
- Seed coverage:
  - 4 distinct canonical pattern keys.
  - At least 4 entries per pattern.
  - At least 2 internal + 1 external entry per pattern.
  - All 5 source kinds present in the seed set.
  - All 4 freshness labels present in the seed set.
  - All 4 usability labels present in the seed set.
- Every `partial` or `blocked` entry carries at least one missing
  citation (test enforced).
- Every entry carries the deterministic `evid-dataset-seed-N`
  identifier and `createdFrom: 'deterministic_evidence_dataset_drawer_seed'`
  (test enforced).
- No live URLs and no `E-###` literal citation tokens appear anywhere
  in the serialized seed (test enforced).
- No fabricated dollar amounts (test enforced).

## What is NOT yet live

- No Claude / OpenAI / Pinecone invocation.
- No live retrieval; `citationLocator` strings are structured seed
  references, not resolvable URLs.
- No live EVID2 / EVID3 projection; the seed is hand-authored.
- No live freshness scoring; freshness labels are hand-assigned.
- No live persistence of citation gaps.

## What is deferred

- **Live EVID2 / EVID3 projection** — a future slice can replace the
  hand-authored seed with a deterministic projection over the
  Evidence Ledger MVP and Evidence Claim Support models without
  changing the I6 view contract.
- **Live dataset domain freshness scoring** — once the dataset domain
  inventory tracks last-ingested timestamps, the freshness label can
  be derived rather than authored.
- **Multi-tenant scoping** — the current seed is anchored on the
  Apex Retail demo tenant; tenant scoping is deferred until the
  drawer is wired to the live registry.
- **Drawer interactivity** — open/close, filter chips, pin to brief,
  and "open in source" affordances are all deferred client-side
  concerns.

## Honest fallbacks used

- Pattern keys without seed coverage render an empty view with the
  honest disclaimer; the I3 detail surface mounts the drawer only
  when `totalEntries > 0` so unseeded patterns stay honest.
- Per-entry `partial` and `blocked` rows always show the explicit
  missing-citation list rather than hiding the gap.
- External rows are explicitly partitioned and labelled "Reference
  only — never live retrieval" in the column caption.
- Footer disclaims live external retrieval and model invocation.
- Component imports nothing from Sentinel runtime, Atlas / Nexus /
  agent runtime, Source UI, legacy /programs, mock.ts, auth,
  supabase, or model SDKs (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/evidence-dataset-drawer.test.ts`
  — 33 passed
- Regression intelligence suites pass (I1, I2, I3, I4, I5: 190 total).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
