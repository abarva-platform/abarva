# AbarVa Specifications · Index

Canonical specifications for AbarVa. When building, reference these over any older docs.

## Authority hierarchy

1. Files under `platform/`, `intelligence/`, `programs/`, `tower/`, `public-surfaces/` — current source of truth
2. `_meta/` — operational cross-cutting docs (backlog, reframe, seed data)
3. `_corrections/` — active fix lists (empty means nothing in flight)
4. `_reference/` — partially superseded, kept for context only
5. `_archive/` — historical, organized by date

## Platform foundation (read first)

| File | Covers |
|------|--------|
| [`platform/agent-architecture.md`](./platform/agent-architecture.md) | Nexus, Sentinel, Atlas · unified 3-agent spec |
| [`platform/design-system.md`](./platform/design-system.md) | Core visual system, component contracts, tokens, interaction patterns |
| [`platform/data-layer-future-state.md`](./platform/data-layer-future-state.md) | Future-state data architecture and query model |
| [`platform/data-ingestion-integration.md`](./platform/data-ingestion-integration.md) | Enterprise ingestion model, source handling, integration pathways |
| [`platform/intelligence-vip-system.md`](./platform/intelligence-vip-system.md) | VIP profile system and executive context model |
| [`platform/data-ground-truth-surface.md`](./platform/data-ground-truth-surface.md) | CXO-facing transparency surface for client ground truth, provenance, gaps, patterns |
| [`platform/benchmarks-industry-data-architecture.md`](./platform/benchmarks-industry-data-architecture.md) | Benchmark and peer-data ingestion, classification, and refresh architecture |
| [`platform/graph-intelligence-architecture.md`](./platform/graph-intelligence-architecture.md) | Entity, relationship, provenance, and reasoning architecture for graph intelligence |

## Product surfaces

| Surface | File |
|---------|------|
| Intelligence (Sentinel) | [`intelligence/design-spec.md`](./intelligence/design-spec.md) |
| Programs (Nexus) — main design | [`programs/design-spec.md`](./programs/design-spec.md) |
| Programs · per-phase module depth | [`programs/test-drive-module-experience.md`](./programs/test-drive-module-experience.md) |
| Tower (Atlas) — main design | [`tower/design-spec.md`](./tower/design-spec.md) |
| Tower · build sequencing | [`tower/build-sequencing-plan.md`](./tower/build-sequencing-plan.md) |

## Public surfaces

| File | Covers |
|------|--------|
| [`public-surfaces/marketing-investor-spec.md`](./public-surfaces/marketing-investor-spec.md) | Marketing site, investor-facing narrative, public web surfaces |

## Meta

| File | Purpose |
|------|---------|
| [`_meta/seed-data/apex-reconciled.md`](./_meta/seed-data/apex-reconciled.md) | Canonical composite retail client (Apex Retail Group) seed |
| [`_meta/seed-data/apex-retail-group-comprehensive-seed.md`](./_meta/seed-data/apex-retail-group-comprehensive-seed.md) | Comprehensive retail composite seed with org depth, initiatives, patterns, vendors, and benchmarks |
| [`_meta/seed-data/meridian-health-system-comprehensive-seed.md`](./_meta/seed-data/meridian-health-system-comprehensive-seed.md) | Comprehensive healthcare composite seed with payer arm, value-based care agenda, and benchmark layer |
| [`_meta/seed-data/first-capital-financial-comprehensive-seed.md`](./_meta/seed-data/first-capital-financial-comprehensive-seed.md) | Comprehensive financial-services composite seed with regulatory context, data org, initiatives, patterns, and benchmarks |
| [`_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md`](./_meta/seed-data/keystone-energy-holdings-comprehensive-seed.md) | Comprehensive regulated-utility composite seed with subsidiaries, regulatory environment, patterns, and benchmark layer |
| [`_meta/seed-data/keystone-seed-validation-results.md`](./_meta/seed-data/keystone-seed-validation-results.md) | Validation artifact for Keystone ingestion, verification, and smoke-test results |
| [`_meta/spec-inventory-cleanup-plan.md`](./_meta/spec-inventory-cleanup-plan.md) | How this directory got organized (April 21) |
| [`_meta/BACKLOG.md`](./_meta/BACKLOG.md) | Older product backlog (may be stale) |
| [`_meta/QA_CHECKLIST.md`](./_meta/QA_CHECKLIST.md) | Older QA checklist (may be stale) |

## Active corrections

| File | Status |
|------|--------|
| [`_corrections/april-21-test-drive.md`](./_corrections/april-21-test-drive.md) | P0 fixes shipped on commit `832e963` · move to `_archive/` once verified on prod |

## Reference (partially superseded)

Older specs kept for context. Never treat as canonical.

- `_reference/ABARVA_REFERENCE.md`
- `_reference/AbarVa_Demo_Narrative_Spec.md`
- `_reference/AbarVa_Market_Noise_Strategy.md`
- `_reference/Abarva_Output_Standards.md`
- `_reference/Abarva_Preconfigured_Products_Spec.md`
- `_reference/AbarVa_Workflow_Narrative_Spec.md`
- `_reference/TECH_MODERNIZATION_SPEC.md`
- `_reference/INVESTOR_PAGE_SPEC.md`
- `_reference/packs/` — reserved for Pack A–L documents if brought into repo

## Archive

Organized by year-month:

- `_archive/2026-04/execution/` — `BUILD_v2.md`, `CLAUDE_CODE_*.md`, `FINAL_*.md`
- `_archive/2026-04/design/` — `Abarva_Design_Spec_v1.md`, v2 supplementary, HTML artifact
- `_archive/2026-04/tower/` — `Abarva_AI_Control_Tower_Spec.md` (pre-canonical)
- `_archive/2026-04/handoffs/` — session handoff docs
- `_archive/2026-04/orphaned-code/` — `homepage.tsx`, `investor-page.tsx`, `AbarvaNav.tsx`, `PageShell.tsx`, `design-system.ts` (all zero refs from src/)
- `_archive/2026-04/html/` — `abarva-solutions-final.html`
- `_archive/2026-04/apex-seed-data-draft.md` — superseded by `_meta/seed-data/apex-reconciled.md`
- `_archive/2026-04/ENGAGEMENT_ENGINE_ADDITION.md` — pre-rename
- `_archive/strategic-briefs/` — `client_portal_brief.md`, `track2_design_brief.md`, `abarva_overnight_brief.md`

## Conventions (going forward)

1. All new specs go to `docs/specs/[category]/`. Nothing at repo root.
2. Drop the `abarva-` filename prefix — redundant inside the abarva repo.
3. Superseded specs move to `_reference/` with a banner at the top noting which doc supersedes them.
4. Session handoffs go to `_archive/[year-month]/handoffs/` at session end.
5. When asking Codex or Claude Code to read a spec, give the full path (`docs/specs/programs/design-spec.md`) to remove ambiguity.

## History

| Date | Change |
|------|--------|
| 2026-04-21 | Seed wave added 3 comprehensive composite-client seed specs + Data Ground Truth + Benchmarks architecture |
| 2026-04-21 | Initial organization · 11 canonical moved · 17 archived · 10 reference · 5 orphaned-code archived · `main` 0-byte file deleted · 2 demo seed scripts to `scripts/` |
