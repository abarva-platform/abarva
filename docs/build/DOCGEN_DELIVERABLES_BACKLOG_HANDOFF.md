# Doc-Gen / Deliverables — Backlog Handoff to the Moves/Source Layout Redesign

**From:** the document-generation / deliverables-engine workstream
**To:** the Moves/Source layout-redesign session
**Date:** 2026-06-12 · **Main at handoff:** `d59c9bddb`
**Why:** our work and your redesign touch the _same_ Moves/Source UI files. This is the shipped state, the integration surface, and the remaining backlog with dependencies, so you can integrate (not collide) and execute in order.

---

## 1 · SHIPPED to `main` — do **not** redo or revert

| PR    | Commit      | What                                                                                                                                                                                         |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #3409 | (merged)    | **Manage Moves** — `/strategic-moves/manage` archive/restore (audit-retained); archive API + `archiveMove`/`restoreMove`; `archiveFilter` read seam                                          |
| #3416 | `2c85c91f8` | **Strategic Moves landing simplification** — 4 cards (Active/Need Attention/On Track/At Stake), filter chips incl. Archived, search, **View: List default**, map behind "Open portfolio map" |
| #3410 | `b0874faab` | Orchestrated **business-case** wiring (flag `moves_orchestrated_deliverables`, default OFF)                                                                                                  |
| #3411 | `87832a8e9` | `skyharbor-air → skyharbor` feature-flag alias                                                                                                                                               |
| #3437 | `3be576adf` | Doc-gen **policy** — model/token Tiers 1–4, env-configurable, chat-budget guard                                                                                                              |
| #3438 | `5a75cc3b7` | Source-label hygiene — internal→human mapper + extended leak scan                                                                                                                            |
| #3439 | `fdd84fdce` | Quality validator — truncation + raw-tenant-slug blockers                                                                                                                                    |
| #3441 | `d59c9bddb` | **Discovery Plan deliverable** — archetype evidence-request + interview guide                                                                                                                |

## 2 · UI overlap surface — **coordinate here**

These files are _ours and yours_. Build on them; do not fork or revert.

- `src/components/strategic-moves/StrategicMovesHomeClient.tsx` — the simplified landing (cards/chips/search/View menu). **This is the current layout** — extend it.
- `src/components/strategic-moves/ManageMovesClient.tsx` — manage surface; uses the shared table.
- `src/components/strategic-moves/MoveListTable.tsx` — **SHARED list table** (landing + manage). One row format — reuse, don't duplicate (the spec explicitly forbids duplicate row formats).
- `src/components/strategic-moves/move-list-format.ts` — pure helpers (chip filter, search, counts, value/relative-time format, `isArchived`, `humanizeSourceLabel` is in source-register).
- `src/components/strategic-moves/StrategicMoves.module.css` — appended classes: `statCards/statCard*`, `chips/chip*`, `searchBox`, `viewMenu`, `tbl/tblRow/tblCol/col*`, `manage*`.
- `src/app/(maestro)/strategic-moves/page.tsx` — server fetch (`includeArchived: true`, `limit: 100`).
- `src/lib/programs/strategic-moves-preferences.ts` — `StrategicMovesListView` now includes `'list'` (the default).

**Design intent to preserve:** _Moves = portfolio list · Manage Moves = bulk cleanup_; List default; map behind "Open portfolio map"; built to the founder's `moves-manage-wireframe`.

## 3 · Where LAYOUT meets the ENGINE (the integration points you own/surface)

The doc-gen engine produces deliverables; your layout must surface them. Please expose:

1. **"Generate" actions** on board-grade artifacts → call the orchestrated path (flag-gated) → result lands in the File Cabinet.
2. **File Cabinet / Artifact Vault** — where generated deliverables appear (open/download, version, source-register link, context-bundle trace).
3. **Discovery Plan** (new, PR-i shipped) — needs a home at **P1→P2**: show the generated evidence-request list + interview guide, and (PR-iii) the upload-to-evidence-family mapping + readiness score.
4. **Phase workspace** (`StrategicMovePhaseClient`) — the capture → save → approve → **generate** flow per phase.

## 4 · Remaining backlog (with dependencies)

| ID              | Work                                                                                                                                                    | Depends on                           | Notes                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PR-G**        | Moves migration — route charter/discovery/design/architecture/operating-model/roadmap/estimate/value/mobilization/handoff through orchestrator + policy | PR-A (done)                          | Flag-gated per tenant; builds on #3410 business-case. **Layout integration: generate buttons + File Cabinet.**                                                 |
| **Disc-PR-ii**  | Auto-generate Discovery Plan on **charter approval** (Move lifecycle hook) + surface it                                                                 | PR-i (done) + §3.3 layout            | Charter-approval trigger in the advance/approval flow                                                                                                          |
| **Disc-PR-iii** | Upload → evidence-family mapping → auto **gap register** + readiness score; gates P2→P3                                                                 | Disc-PR-ii + File Cabinet upload UI  | Closes the discovery loop                                                                                                                                      |
| **PR-E**        | Real Azure **Blob** persistence (`persistDeliverable` `blobUrl=''`; binary DOCX/XLSX bytes not stored)                                                  | ACA (build+verify)                   | Postgres metadata + File-Cabinet visibility already exist                                                                                                      |
| **PR-F**        | **Source** migration (D01/D05/D09 route-local → orchestrator + policy; section-by-section RFP + Excel companions)                                       | **Coordinate**                       | ⚠️ **COLLISION:** an autonomous Source-D09 agent is _actively_ committing route-local RFP work to main (#3423–#3428). Converge with it; do NOT run concurrent. |
| **PR-H**        | **Live proof** — SkyHarbor IROPS Move → orchestrated Charter + Business-Case + Discovery Plan; verify at state level                                    | a real Move + ACA + Anthropic egress | Blocked: SkyHarbor portfolio empty (all archived). Flip `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS=skyharbor`                                     |
| (opt)           | PPTX renderer                                                                                                                                           | —                                    | DOCX/XLSX/HTML already exist in `orchestrator/renderers.ts`                                                                                                    |

**Suggested order:** PR-G + Disc-PR-ii/iii (these are the layout×engine integration — your session is best placed to own the surfacing) → PR-E + PR-H (need ACA + a real Move) → PR-F (only after the Source-D09 agent converges).

## 5 · Flags / env / infra

- **Flag:** `moves_orchestrated_deliverables` (tenant policy, default OFF) — `src/lib/features/registry.ts`. Alias `skyharbor-air→skyharbor` in `is-feature-enabled.ts`.
- **Enable a tenant (no rebuild):** ACA env `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS=skyharbor`.
- **Model/token policy (env-overridable):** `ABARVA_CLAUDE_{CHAT,WORKING_DRAFT,BOARD_GRADE,LARGE_PACKAGE}_MODEL`, `ABARVA_DOCGEN_{CHAT,DRAFT,BOARD,PACKAGE}_MAX_TOKENS` — `src/lib/ai/document-generation-policy.ts`.
- **Lab ACA:** `ca-abarva-web-lab-eastus` is **shared**; an autonomous Source-E2E loop reshuffles root-URL traffic — verify the active revision after deploy; use the per-revision FQDN for a stable view.
- **Engine code:** `src/lib/deliverables/orchestrator/*` (briefs, `discovery-blueprint.ts`, `renderers.ts`, `persistence.ts`, `quality-validator.ts`, `source-register.ts`, `model-caller.ts`); policy `src/lib/ai/document-generation-policy.ts`.

## 6 · Hard rules (don'ts)

- Don't revert the landing simplification (#3416) or fork `MoveListTable`.
- Don't run Source migration concurrent with the Source-D09 agent.
- Don't expose internal source ids — use `humanizeSourceLabel` / the leak scanner.
- Don't use chat-tier budgets for deliverables — `assertDeliverablePolicy` guards it.
- Don't mark preliminary deliverables as final; don't fabricate client facts.

## 7 · Design-reference assets (synthetic, in `~/Downloads/`)

- `SkyHarbor_IROPS_Care_Evidence/` — 9-file $80B-airline evidence pack (DOCX/XLSX/HTML), incl. the legacy Teradata/SAS/mainframe + Adobe/SFDC + **RT-CDP-not-activated** data estate.
- `SkyHarbor_IROPS_Care_DiscoveryPlan/` — the generated Discovery Plan + the deliverable spec (`SPEC_discovery_plan_deliverable.md`).
- `SkyHarbor_IROPS_Care_Move_CheatSheet.html` — P0/P1 capture copy-paste.

---

_Questions back to the doc-gen workstream: anything touching `orchestrator/_`, `document-generation-policy.ts`, or the deliverable tiers. Anything touching the Moves/Source **layout, File Cabinet surfacing, or phase workspace** is yours — this handoff is so we wire them together cleanly.\*
