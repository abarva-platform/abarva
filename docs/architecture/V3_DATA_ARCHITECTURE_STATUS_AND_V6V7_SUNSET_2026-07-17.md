# V3 Data Architecture — Target Model, Real Status, and the V6/V7 Sunset

**Status:** Draft architecture decision note, written 2026-07-17. Records the
proposed V3 target architecture and the proposed V6/V7 runtime-sunset path.
This is not yet approved as a release-controlled architecture record — it needs
Anand sign-off before anything in the "Formal retirement list" is deprecated,
removed from runtime use, or cleaned up.

## 1. Why this doc exists

V6/V7 (both the per-tenant file-pack pipeline and the `intelligence_v6` /
`intelligence_v7` Postgres schemas) are proposed to be sunset as runtime
sources after their V3 replacements are live-proven. This doc (a) defines the
target six-layer architecture that replaces them, (b) maps every layer to
what's actually in the repo today — verified by opening files, not inferred
from names — and (c) gives the two highest-leverage next actions.

The core risk this architecture exists to close: as more layers get built on
top of the v3 source data (budget models, interview evidence, program
records), numeric "facts" can silently drift out of sync across layers if
each layer independently re-enters or re-derives them. This session already
found three live instances of that drift before this doc was written:
legacy $1.1B/$1.7B figures baked into old narrative content, `08_it_budget_
spend_value.csv` carrying zero real dollar figures across all 223 rows, and
`09_programs_initiatives.csv` / `10_ai_automation_use_cases.csv` being
byte-identical duplicates with no way to tell a funded program from a
candidate idea. The architecture below is the fix: one source of truth per
fact, with every downstream layer required to reference it, never re-author
it.

## 2. The six-layer target model

```
1. Source input layer
   datasets/tenant-inputs/<tenant_key>/standard-2026-07-v3/
   19 core CSVs + source-adapter CSVs (SA01–SA08 where applicable)
        |
        v
2. Validation & source governance
   Node/TS audit scripts -> Governed source store (Postgres: tenant_source_
   files, tenant_source_rows, evidence_registry, active_/candidate_context_
   versions)
        |
        v
3. Deterministic governed fact layer
   Evidence Registry / Canonical Facts / Entity Profiles / Relationship
   Graph / Context Gaps — still fully deterministic, no Claude content
        |
        v
4. Module context views
   HomeContextView / TowerDashboardView / MovesContextView /
   SourceContextView / IntelligenceContextView — display-safe facts only
        |
        v
5. Claude-approved advisory layer
   Batch generation, reading module context views only -> StoryBlocks +
   VisualSpecs -> validation gate (no invented facts, must cite fact/
   evidence ids) -> approved content store
        |
        v
6. Runtime
   Home / Tower / Moves / Source / Intelligence UI = facts + approved
   narrative. aVa live answers = module context facts + claim gates +
   Claude synthesis (never static seed data, never a Claude-invented number)
```

**The one rule that makes this work:** Claude-generated content may narrate
and frame visuals. It may never invent a budget figure, funding status,
approved value, ROI, or savings claim — those must always trace to a fact_id
/ evidence_id in layer 3 or 4. This is not new — see §4, this rule is
already partially enforced in the existing generated content's
`evidence_boundary` field.

## 3. Layer-by-layer status against the real repo

Legend: 🟢 exists & correct — reuse as-is · 🟡 exists, wrong input — rewire
off V6/V7 · 🔴 retire — legacy V6/V7, superseded · 🟣 genuine gap — doesn't
exist yet.

### Layer 1 — Source input

| Component | Status | Note |
|---|---|---|
| 19 core v3 CSVs | 🟢 | `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/` — verified row-by-row this session |
| SA07 Executive Interviews | 🟢 | `datasets/tenant-inputs/<tenant>/interviews/executive_interviews.csv` — PR #4909 carries the 221-row Meridian template packet and mapped interview evidence |
| SA02 / SA04 / SA08 adapters | 🟡 | PR #4909 adds Meridian source-template artifacts for Finance, Program Portfolio, and AI Benefits Realization. They are source/template artifacts, not active runtime truth yet. |
| SA01 / SA03 / SA05 / SA06 adapters | 🟣 | CMDB, Contracts, Cloud, and Incidents source adapters remain gaps for Meridian and future tenants |

### Layer 2 — Validation & governance

| Component | Status | Note |
|---|---|---|
| `audit-tenant-v3-inputs.mjs` | 🟢 | `npm run audit:tenant-v3-data` |
| `audit-meridian-executive-interviews.mjs` | 🟢 | `npm run audit:meridian-executive-interviews` |
| Budget reconciliation / AI-boundary checks | 🟡 | PR #4909 adds `npm run audit:meridian-v3-reload-readiness` for Meridian source-template readiness. This is not yet a universal runtime/candidate-promotion gate. |
| Governed source store | 🟣 | `tenant_source_rows`, `evidence_registry`, `active_/candidate_context_versions` — no such Postgres tables exist. Genuinely new schema work, not a migration of anything |

### Layer 3 — Deterministic governed fact layer

| Component | Status | Note |
|---|---|---|
| `GovernedObject` contract | 🟢 | `src/lib/governance/context-corpus-policy.ts` — more mature than the proposed Evidence Registry shape (classification, retrievability, agent_readiness_status). **Build Canonical Facts on this schema — don't invent a second one.** |
| Canonical Facts / Entity Profiles / Relationship Graph / Context Gaps | 🟣 | Informally present as CSV rows + `13_evidence_sources.csv`; no formal typed derived layer |
| `intelligence_v6` graph physical | 🔴 | `supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql` — business_records, graph_nodes/edges, graph_quality_reports. This repo's most recent V6 schema work. |

### Layer 4 — Module context views

| Component | Status | Note |
|---|---|---|
| `generate-module-cxo-content.mjs` | 🟡 | **One script already covers all 5 modules** (home, tower, intelligence, moves, source) — the pattern already generalizes. But 7 of its 8 inputs read `v7/V7_*.csv`; only `interviews` reads the real v3 path (`scripts/knowledge/generate-module-cxo-content.mjs:148-155`) |
| `v7-tower-projection.ts` | 🔴 | 810 lines, reads `intelligence_v7` directly via `azureRead`. This is today's TowerDashboardView. |
| `v7-home-ask.ts` / `v7-context-browser.ts` / `v7-dossier.ts` | 🔴 | Today's HomeContextView + Intelligence retriever equivalents |
| `TowerBudgetFact` / `TowerProgramFact` / `TowerMetricFact` / `TowerValueClaim` | 🟣 | The fine-grained, gated typing that would make the "no unreconciled active row" rule enforceable in code, not just in a prompt. **Highest-value net-new build.** |

### Layer 5 — Claude-approved advisory layer

| Component | Status | Note |
|---|---|---|
| `*CxoStoryBlock` / `*ReadinessBlock` / `*BriefingBlock` | 🟢 | `src/lib/{home,tower,moves,source,intelligence}/narratives/generated/` — field shape already matches the proposed HomeStoryBlock/TowerStoryBlock almost exactly: `executive_summary`, `evidence_refs`, `context_gaps`, `claim_strength`, `evidence_boundary`, `approved_for_render` |
| Approved content precursor | 🟢 | `datasets/<tenant>/derived/knowledge/approved-cxo-story-blocks.json` + `approved-cxo-visual-specs.json` — already read as an input by the generator; the "approved content store" idea already has a foothold as per-tenant JSON, not yet a Postgres table |
| Validation gate | 🟢 | `validation.status / overall / categoryScores` plus per-block `evidence_boundary` text already enforcing "no invented outcome claim" language — the do-not-cross rule is already house style |

### Layer 6 — Runtime

| Component | Status | Note |
|---|---|---|
| Page render of generated blocks | 🟢* | `HomeSurface.tsx` references the generated-content pattern. Single-signal find, not independently re-verified — confirm before depending on it. |
| `agent-context-broker.ts` | 🟢 | Separate, complementary seam for live/RAG answers (aVa chat) vs. the pre-generated story blocks above — both funnel through `buildValidatedAgentContextBundle` |

## 4. What this means in practice

- Don't build layers 1, 3, and 5 from scratch. `GovernedObject` and the five
  `*Block` generators already do most of that work. Formalize and document
  them under the proposed names; don't stand up a second parallel system
  next to them.
- The single highest-leverage fix: repoint `scripts/knowledge/generate-
  module-cxo-content.mjs`'s 7 legacy-V7 CSV reads to `standard-2026-07-v3/
  *.csv`. That one change stops the entire five-module narrative pipeline
  from drifting away from the v3 source of truth.
- The one thing genuinely worth building fresh: the typed `TowerBudgetFact`
  / `TowerValueClaim` layer with `claim_gate_status`. Nothing today stops an
  unreconciled row from rendering — only a future audit script would catch
  it, after the fact, in CI.
- The governed source store (Postgres tables for source-row lineage) is real
  net-new schema work. There is nothing to migrate away from here, only
  something to build.

## 5. Formal retirement list

Nothing in the repo currently marks any of the following as deprecated —
`intelligence_v6_graph_physical.sql` (2026-07-02) and `intelligence_v7_moat_
foundation.sql` (2026-07-09) are, as of this doc, this repo's two most
recent core schema migrations. **This document is the first record of the
proposed retirement path, not approval to remove or rewrite them.**

- `supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql`
  — business_records, graph_nodes/edges, graph_quality_reports
- `supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql`
  — most recent schema migration in the repo
- `src/lib/tower/v7-tower-projection.ts` — 810 lines, reads `intelligence_
  v7` via `azureRead`
- `src/lib/home/know/v7-home-ask.ts` — Home's live KNOW answer engine
- `src/lib/home/v7-context-browser.ts` (and `v6-context-browser.ts`
  alongside it)
- `src/lib/intelligence/ask/retrievers/v7-dossier.ts` — Intelligence's V7
  retriever
- `scripts/tenant-v6/generate-tenant-v6-pack.mjs` + `scripts/v7/derive-
  tenant-v7-insights.mjs`
- `datasets/<tenant>-v6-v7-current-state-v1/` — per-tenant V6/V7 file packs
  (meridian-health, first-capital-financial, skyharbor-air at minimum)

Retirement should be sequenced, not simultaneous: repoint the layer-4/5
generator first (§4), prove Home/Tower render correctly off v3-sourced
facts, *then* deprecate the V7 read paths and plan forward cleanup migrations.
Do not remove the V7 runtime tables/files before the replacement is live and verified — several of these
(`v7-tower-projection.ts`, `v7-home-ask.ts`) are the *current* production
read path for Home and Tower.

## 6. Open questions for Anand

1. Confirm scope of "V6/V7 sunset": should it include the `intelligence_v6`/
   `intelligence_v7` Postgres schemas themselves after runtime replacement
   is live-proven, or only the file-pack generation pipeline?
2. Who signs off before `intelligence_v6` / `intelligence_v7` runtime
   dependencies are deprecated, and before any forward cleanup/deprecation
   migration is authored? Historical migration files should not be rewritten;
   any schema cleanup must be a separately approved forward migration.
3. Sequencing: should the `TowerBudgetFact`/`TowerValueClaim` typed layer
   land before or after the remaining SA01/SA03/SA05/SA06 adapters get built? They're
   independent, but both compete for the same next-sprint slot.
