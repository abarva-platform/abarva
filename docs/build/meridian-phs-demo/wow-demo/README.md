# Meridian / PHS "Wow" Demo Package

A buyer-grade, end-to-end demo of the synthetic **Meridian Health
(`meridian-health`)** tenant: enriched context, hard CXO/audit golden
questions, a hero Strategic Move with per-phase artifacts, and a walkthrough.

> **Honesty guardrail (binding):** everything here is **synthetic,
> Meridian/PHS-inspired pilot context**. Nothing is real confidential PHS data.
> Agents must never present any figure as confidential PHS proof.

## What this package contains

| File                                     | Purpose                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `README.md`                              | This index.                                                                       |
| `WALKTHROUGH_SCRIPT.md`                  | Step-by-step demo script (persona, surface, what to show, what to say).           |
| `EVIDENCE_MAP.md`                        | Maps demo claims → loaded Meridian context files → use-case evidence refs.        |
| `HARD_QUESTIONS_AND_EXPECTED_ANSWERS.md` | Representative hard CXO/audit questions + the shape of a passing answer.          |
| `KNOWN_GAPS.md`                          | What is proven, what is blocked from Cursor Cloud, and how to close each gap.     |
| `SCREENSHOTS.md`                         | Screenshot capture plan + index (capture is environment-blocked; see Known Gaps). |
| `artifacts/`                             | The hero Move's downloadable artifacts (DOCX/PDF/XLSX/HTML/MD).                   |

## Hero Strategic Move

**AI-enabled Population Health & Clinical Performance Command Center** — a single
Move advanced through all six phases (P0 Originate → P5 Mobilize & Handoff),
spanning the provider and Meridian Health Plans. Projected synthetic value:
**$38M–$61M/yr**.

- Seed script: `scripts/demo/seed-meridian-hero-move.ts`
  - Dry-run (no DB): `npx tsx scripts/demo/seed-meridian-hero-move.ts`
  - Apply (inside Azure VNet): `npx tsx scripts/demo/seed-meridian-hero-move.ts --apply`
- Artifact generator: `node scripts/demo/generate-meridian-hero-artifacts.mjs`

### Artifact index (`artifacts/`)

| Artifact                   | File                          | Phase | How it is downloadable in-product                      |
| -------------------------- | ----------------------------- | ----- | ------------------------------------------------------ |
| Executive memo (DOCX)      | `executive-memo.docx`         | P1/P4 | Move → Documents → deliverable → export `?format=docx` |
| Board brief (PDF)          | `board-brief.pdf`             | P4    | Board-grade decks route / phase export                 |
| Value model (XLSX)         | `value-model.xlsx`            | P4    | deliverable → export `?format=xlsx`                    |
| Architecture pack (HTML)   | `architecture-pack.html`      | P3    | board-grade solution-architecture deck                 |
| RACI + mobilization (XLSX) | `raci-mobilization-plan.xlsx` | P5    | deliverable → export `?format=xlsx`                    |
| Evidence appendix (MD)     | `evidence-appendix.md`        | all   | Move → Activity / evidence hub                         |

In production the phase deliverables live in `deliverable_versions.content`
(Postgres) and are rendered to DOCX/XLSX/HTML/PDF on demand by the
`content-export` route. The files in `artifacts/` are pre-rendered twins so a
reviewer can open them without a database.

## Production board-grade kernel (the real quality bar)

The `artifacts/` files above are lightweight standalone twins. The **production**
quality bar is the board-grade Expert Kernel
(`src/lib/programs/expert-kernel/exports/board-grade/`), which renders 8 decks
with inline SVG exhibits, a shape/fund/kill verdict system, and evidence strips:
costed business case, discover brief, solution architecture, estimate model,
mobilize packet, charter skeleton, CFO pack, and master dossier.

- Render samples: `npx tsx scripts/demo/render-board-grade-decks.ts`
- **Meridian bound deck** (curated `population_health_value_based_care` function
  pack): `kernel-samples/meridian-move/costed-business-case-pack.html` — a real,
  kernel-bound Meridian business case (MLR, RAF, quality composite, wellness-visit
  drivers; ~89 KB with SVG exhibit and verdict).
- Apex reference decks (the hand-curated fidelity target) already live at repo
  root as `apex-*.sample.html` / `apex-costed-business-case-pack.sample.pptx`.

### PPTX status / gap

The kernel ships an **editable PPTX only for the Apex reference business-case
deck** (`renderApexCostedBusinessCasePptx`). The generic, Move-data-driven decks
(including Meridian) currently render **HTML only** (print → PDF). Closing the
PPTX gap means adding a generic `renderMove*Pptx` path (and ideally extending
PPTX to the other 7 decks). The Meridian deck only renders fully when the Move
binds a curated Domain Function Pack — `population_health_value_based_care`
exists; other Meridian functions would each need a curated pack to render bound
(otherwise the kernel honestly renders an UNBOUND deck rather than fabricating).

## Dataset enrichment (WS1)

Enrichment pack v1 adds 10 governed-loader-compatible templates (246 synthetic
rows) under `datasets/meridian-health-synthetic-v1/17-upload-templates/`:
org decision rights, Epic optimization backlog, ERP/data estate, KPI library,
Azure Databricks lakehouse target model, plan/provider analytics, AMS/vendor
contracts, use-case evidence register, care-management staffing, clinical data
contracts. Generator: `datasets/meridian-health-synthetic-v1/tools/generate_enrichment_pack_v1.py`.

## Golden questions (WS2)

112 Meridian hard golden questions at
`tests/agent-grounding/curriculum/meridian-phs-hard-golden-v2.jsonl`
(generator: `scripts/eval/generate_meridian_phs_hard_golden.py`), covering CEO,
CFO, CIO, CTO, CDAO, clinical (CMIO/CMO/CNO), plan COO, audit, architecture,
vendor, and program governance — each requiring evidence citation, cross-tenant
refusal where relevant, and synthetic-not-confidential-PHS honesty.

## Evidence of the embedding drain

`../MERIDIAN_AZURE_EMBED_DRAIN_EVIDENCE_2026-06-06.md` — 873 embedded / 0 pending
/ 0 failed, independently re-verified against Azure Log Analytics.
