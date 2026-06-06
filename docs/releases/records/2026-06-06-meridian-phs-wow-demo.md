# 2026-06-06-meridian-phs-wow-demo — Meridian/PHS buyer-grade demo enrichment

## Release ID

`2026-06-06-meridian-phs-wow-demo`

## Status

`candidate`

## Plain-English Summary

This change makes the synthetic Meridian Health (`meridian-health`) demo tenant
feel intelligent and buyer-grade. It adds richer synthetic context the agents
can reason over, a large bank of hard CXO/audit golden questions, a single hero
Strategic Move with per-phase artifacts, and a demo package (walkthrough,
evidence map, expected answers, known gaps). It also re-verifies and records the
Azure embedding-drain evidence (873 embedded, 0 pending, 0 failed). All data is
synthetic and inspired-by — never real confidential PHS data.

## Layer Impact

- Lane: `public-demo` (primary) with a touch of `global-control-lane`.
- Public/demo lane: new synthetic dataset templates, golden-question deck, demo
  docs, and pre-rendered demo artifacts — affect demo experience only.
- Global-control-lane: small additive changes to the Sentinel Ask system prompt
  and the CXO section-break post-processor (Options/Assumptions sections). These
  are additive and covered by existing unit tests; no schema or API change.
- No database table renames; no new runtime dependency on Supabase/Neo4j/Pinecone.

## Client Applicability

Public/demo only. Specific clients: the synthetic `meridian-health` demo tenant.
No real client receives behavior changes beyond the additive agent-formatting
guidance, which applies to all clients (all clients) but is non-breaking.

## Changes Included

- `datasets/meridian-health-synthetic-v1/17-upload-templates/`: 10 new
  governed-loader-compatible templates (246 synthetic rows) + catalog entries;
  deterministic generator under `.../tools/`.
- `src/lib/context-ingestion/{types.ts,csv-upload-connector.ts,template-registry.ts}`:
  5 new context dimensions + segment mappings + registry seeds.
- `datasets/meridian-health-synthetic-v1/99-verification/expected-row-counts.json`:
  upload_templates 26 → 36.
- `tests/agent-grounding/curriculum/meridian-phs-hard-golden-v2.jsonl`: 112 hard
  golden questions; generator `scripts/eval/generate_meridian_phs_hard_golden.py`.
- `src/lib/intelligence/ask/{synthesizer.ts,response-policy.ts}`: additive
  Options/Assumptions CXO sections + section-break handling.
- `scripts/demo/seed-meridian-hero-move.ts`: hero Move seed (dry-run + --apply).
- `scripts/demo/generate-meridian-hero-artifacts.mjs` + `docs/build/meridian-phs-demo/wow-demo/`:
  artifacts and demo package (README, walkthrough, evidence map, hard questions,
  known gaps, screenshots plan).
- `docs/build/meridian-phs-demo/MERIDIAN_AZURE_EMBED_DRAIN_EVIDENCE_2026-06-06.md`:
  re-verified embedding-drain evidence.
- `scripts/demo/render-board-grade-decks.ts` + `wow-demo/kernel-samples/`: render
  the production board-grade kernel decks; commit the kernel-bound Meridian
  costed business-case deck (curated `population_health_value_based_care` pack).
- `docs/build/agent-response-contract/MOVES_DELIVERABLE_STANDARD.md`: canonical
  northstar deliverable standard (per-phase TOCs, required exhibits, P0 separate,
  P4 three decks, all-clients/global scope).
- `src/lib/programs/expert-kernel/exports/board-grade/__tests__/deck-quality-gate.test.ts`:
  global Deck Quality Gate enforcing the standard across all 8 Move decks for
  healthcare/retail/banking bound Moves + honest unbound (160 assertions).
- `src/lib/programs/expert-kernel/exports/board-grade/pptx-renderer.ts`: apply
  shrink-to-fit autofit (`fit: 'shrink'`) to prose boxes (fixes text-overrun);
  `__tests__/pptx-autofit-gate.test.ts` guards it; regenerated reference PPTX.

This change touches no pilot CONTEXT side-load path. New pilot/client context
data must still enter through the Admin Data Loader (no side-load); ingestion
audit evidence is recorded in `data_ingestion_runs` / `pilot_ingestion`. The
hero-Move seed under `scripts/demo/` writes control-plane demo rows only
(engagements/deliverables), not tenant context chunks.

## QA / Validation

- `npm run verify:meridian-context-showcase` — passed (36 templates, 34 dimensions).
- `node node_modules/typescript/bin/tsc --noEmit` — passed (exhaustive dimension map compiles).
- `npx eslint` on all touched source files — passed.
- `npx jest tests/agent-grounding/__tests__/curriculum.test.ts` — passed (4 tests).
- `npx jest src/lib/intelligence/ask/response-policy.test.ts` + prompt-contract + sentinel — passed (189 tests).
- Hero-Move seed dry-run — passed (validates six-phase deliverable model).
- Artifact generation — passed; `file(1)` confirms valid DOCX/XLSX/PDF/HTML/MD.
- Deck Quality Gate — passed (160 assertions across 3 industries × 8 decks + unbound).
- PPTX autofit gate + existing board-grade-pptx test — passed (12 assertions);
  rendered deck is valid OOXML with shrink-to-fit autofit on every content slide.
- Blocked / not run: live load to Azure Postgres, live Move `--apply`, and
  browser QA/screenshots — the private Azure data-plane is network-unreachable
  from Cursor Cloud and no real Clerk session is available (see
  `docs/build/meridian-phs-demo/wow-demo/KNOWN_GAPS.md`).

## Rollout Plan

Merge to `main` via squash PR. No runtime migration. Demo content is inert until
loaded: the enrichment pack is loaded via the governed Admin Context Loader and
the hero Move is created via the seed `--apply` from inside the Azure VNet. The
agent-formatting prompt changes take effect on the next deploy.

## Rollback Plan

Revert the PR commit. No migration to undo. If only the agent-formatting change
needs reverting, restore `src/lib/intelligence/ask/synthesizer.ts` and
`response-policy.ts` to their prior revision; dataset/docs/golden files are inert
and safe to leave in place.

## Audit Evidence

- PR for branch `cursor/meridian-phs-wow-demo-a092`.
- Local CI command outputs listed under QA / Validation.
- Embedding-drain evidence: `docs/build/meridian-phs-demo/MERIDIAN_AZURE_EMBED_DRAIN_EVIDENCE_2026-06-06.md`
  (Azure Log Analytics `log-abarva-observability-lab-eastus`, signature
  `ABARVA_PHS_MERIDIAN_EMBED_DRAIN_RESULT`).

## Known Gaps

Live load, live Move creation, and browser QA/screenshots are environment-blocked
from Cursor Cloud (private data-plane unreachable; no real Clerk session). Closure
steps are documented in `docs/build/meridian-phs-demo/wow-demo/KNOWN_GAPS.md`
(Container Apps private-worker path / onboarded environment).
