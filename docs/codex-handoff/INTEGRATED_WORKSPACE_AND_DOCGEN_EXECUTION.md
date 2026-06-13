# Codex — Integrated Autonomous Execution: Workspace Explorer + Doc-Gen Engine

You run **two related backlogs as one program**, non-stop, with test + CI + deploy
gates in the loop. They overlap (both touch Moves/Source deliverable generation,
the File Cabinet, and lineage), so they MUST be sequenced and reconciled — not run
blindly in parallel. This brief is the coordination contract + the execution order.

**The one principle that prevents interference:**

> **Workspace Explorer is the SURFACING layer. The Doc-Gen orchestrator is the ENGINE.**
> They connect only through three stable seams: (1) the **per-module generate route** (a black box to the explorer), (2) **generated-artifact / deliverable rows** (the explorer reads them), (3) **lineage columns** (the engine populates them at generate time). Keep those contracts stable and the two backlogs cannot collide.

## 1 · Read first (source of truth for each track)

- **Surfacing track:** `docs/codex-handoff/WORKSPACE_EXPLORER_BUILD_BRIEF.md` (PR #3443) + `docs/build/WORKSPACE_EXPLORER_DESIGN.md` (PR #3440). The brief's **three answers** (one shell + two adapters; non-breaking via flag-OFF-default + zero API-contract change + no early deletions; state-level verification) are **hard acceptance gates**.
- **Engine track:** `docs/build/DOCGEN_DELIVERABLES_BACKLOG_HANDOFF.md` + `docs/build/DOCUMENT_GENERATION_MODEL_POLICY.md` + `docs/build/CLAUDE_DOCUMENT_GENERATION_AUDIT_2026-06.md`.

## 2 · Operating mode (non-stop)

Per slice: clean-branch off `origin/main` → implement → `tsc`/`eslint`/`jest` → `npm run audit:architecture-rules` (0) → release record + `npm run release:check` → lowercase conventional commit → PR → poll CI → **squash-merge when required checks green** → re-sync `main` → next. Never push to `main`. Don't pause between slices except for §8.

**Self-healing loop (both tracks, on ACA private DB):** CAPTURE failure → ROOT-CAUSE from the **live ACA log** (Log Analytics `ContainerAppConsoleLogs_CL`), not the generic 500 body → FIX → TEST → re-deploy (build image → `containerapp update` → shift 100% traffic; **map revision-suffix → git sha** before trusting) → RE-VERIFY at the state level. Loop to green.

## 3 · The integration contract — how they connect WITHOUT colliding

| Seam           | Surfacing (Workspace Explorer)                                                      | Engine (Doc-Gen)                                                                 | Rule                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generate       | "Generate" chip calls the **existing per-module route** as a black box              | flag `moves_orchestrated_deliverables` changes what that route _does_ internally | Engine migration must **preserve the route contract** (WE requires zero API-contract change). Chip is engine-agnostic: deterministic when flag OFF, orchestrated when ON. |
| Quality        | shows `QualityReview` from `v2-generator.ts` (the per-module path)                  | orchestrator has its own `quality-validator.ts`                                  | **Both validators coexist** — the active one depends on the flag. Do NOT rip out `v2-generator`'s `QualityReview`; WE depends on it for the flag-OFF path.                |
| Rows           | adapters read `source_artifacts` / `generated_artifacts` / `deliverables_v2`        | engine writes those rows                                                         | Engine **produces**; WE **surfaces**. DG must NOT build its own File-Cabinet surfacing — that's WE's job.                                                                 |
| Lineage        | WE slice 3 adds `cited_source_artifact_ids` / `cited_input_ids` (net-new, additive) | the orchestrated generate path **populates** them from the evidence it assembled | Lineage schema (WE-3) lands first; the engine populates it at generate time. Never backfill/fabricate — "lineage not yet recorded" until generated post-ship.             |
| Discovery Plan | WE adapter surfaces it like any deliverable row                                     | DG generates `discovery_plan` (shipped #3441) at the P1→P2 trigger               | DG lands it as a row; WE shows it. No special UI in DG.                                                                                                                   |
| Flags          | `workspace_explorer_source` / `_moves` (default OFF)                                | `moves_orchestrated_deliverables` (default OFF)                                  | Independent; compose (surfacing flag × engine flag).                                                                                                                      |

**Hard DO-NOTs (reconciliation):**

1. Do **not** invent `/api/v1/deliverables/generate` — generation is per-module (WE brief Q2 correction).
2. Do **not** change any existing generate/approve/advance route contract — DG migrations are flag-gated and contract-preserving (WE non-breaking rule).
3. Do **not** build duplicate File-Cabinet surfacing in the engine track — WE owns surfacing.
4. Do **not** remove `v2-generator.ts`'s `QualityReview` — it's the flag-OFF path WE relies on.
5. Do **not** fabricate lineage edges — show "lineage not yet recorded."
6. Do **not** run DG **PR-F (Source ENGINE migration)** concurrent with the autonomous **Source-D09 agent** (#3423–#3428). _Note: WE's Source SURFACING adapter (read-only) is a different thing and is safe to build first — it does not touch the Source generation engine._

## 4 · Unified dependency-ordered queue (do in this order)

**Phase 1 — Surfacing foundation (no engine risk; safe immediately).**

- **WE-0** flag plumbing + `WorkspaceItem` read-model contract + gate the Source page server component with `isFeatureEnabled`.
- **WE-1** read-only `WorkspaceExplorer` shell + `SourceWorkspaceAdapter` over the existing registry/queries. No writes.
- **WE-2** declutter Source canvas + `Workspace · N ↗` / `Generate` chips (tab components + APIs relocated, not deleted).

**Phase 2 — The lineage seam (the integration point).**

- **WE-3** lineage schema (additive migration: `cited_source_artifact_ids` / `cited_input_ids`) + preview render (`cites ←` / `used by →`). This is what the engine populates.

**Phase 3 — Generation: engine-agnostic chip, then flag-gated engine migration.**

- **WE-4** in-context Generate chip → existing per-module route → show real `QualityReview` → Draft in explorer → Approve via existing gate/advance route. (Works on today's `v2-generator` engine.)
- **DG-PR-G** Moves migration to the orchestrator **behind `moves_orchestrated_deliverables`**, **contract-preserving**, and it **populates WE-3 lineage** from the assembled governed evidence. (DG policy #3437 / label-hygiene #3438 / validator #3439 / discovery-plan #3441 already shipped.)

**Phase 4 — Upload, Moves adapter, discovery loop, durable storage.**

- **WE-5** governed upload/version from the explorer (never the chat paperclip).
- **WE-6** `MovesWorkspaceAdapter` (same shell) behind `workspace_explorer_moves`.
- **DG-Disc-ii** auto-generate Discovery Plan on charter approval → lands as a row **WE surfaces**.
- **DG-Disc-iii** map uploads → evidence families → gap register + readiness (P2→P3 gate).
- **DG-PR-E** real Azure Blob persistence (binary DOCX/XLSX bytes) — verify on ACA.

**Phase 5 — Tenant vault + the converged live proof.**

- **WE-7** `/setup/files` tenant vault reusing the shell + RBAC/classification enforced on preview/download.
- **DG-PR-H / WE-DoD (converged)** — on a real SkyHarbor Move/event: page → Workspace → Generate → quality gate → Draft → Approve → gate/phase advances, **state-verified on ACA** (UI + API + **DB row** + ACA log), lineage edges persisted, for **both** Source and Moves. Flip `ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS=skyharbor` for the orchestrated path. (SkyHarbor Moves portfolio is empty — originate a throwaway if needed.)

**Quarantined (gated separately):**

- **DG-PR-F** Source ENGINE migration to the orchestrator — **only after the Source-D09 agent converges**. WE Source surfacing (Phase 1) is unaffected and proceeds.

## 5 · Acceptance gates (both sets — every slice)

- **WE non-breaking:** flag-OFF Playwright regression drives the _existing_ buttons and asserts identical behavior + same API calls (byte-for-byte page when OFF).
- **State-level (both):** flag-ON E2E → assert API response → assert **DB row** (`source_artifacts`/`generated_artifacts` committed, `approval_state`/`gate_criterion_states.state='met'`/phase advanced) → read ACA log. Never trust UI text.
- **Engine quality (DG):** no chat-tier budget for deliverables (`assertDeliverablePolicy`); no internal source ids (`humanizeSourceLabel` + leak scan); AI output is Draft until a named human approves with rationale.
- **Gates green:** `audit:architecture-rules` = 0; `release:check` passes with a record; tsc/eslint clean.

## 6 · Guardrails (merged, non-negotiable)

- **Broker boundary:** no direct app-tier import of EnterpriseDataRoom/broker/vector/graph — `audit:architecture-rules` = 0.
- **Azure/Postgres only:** no new Supabase/Neo4j/Pinecone/Vercel runtime deps; OpenAI only for TTS/embeddings, never production reasoning.
- **Governed upload only** (not the chat paperclip); **versioning is upgrade-only** (no overwrite).
- **AI never final;** vendor isolation is structural + trace-proven.
- **Release discipline:** classify lane (`global-control-lane` for shells/engine; `client-data-lane` for the lineage/blob migrations); release record; `release:check`. The `## Known Gaps` section must be a real note ("None." fails). **Never push to main — PR + squash.**
- **Commits:** conventional prefix, **lowercase subject** (commitlint), ≤100 chars; `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **CI nuance:** squash-merge collapses branch-range **gitleaks** test-fixture false-positives. `Azure/Anthropic architecture rules` + `Production readiness gate` are **non-required flakes** (also fail on `main`) — merge when `mergeable && the failing check isRequired:false`; local `audit:architecture-rules` is authoritative.

## 7 · Infra recipes

- **Deploy:** `az acr build -r acrabarvalab001 -t abarva/web:main-<sha> .` → `az containerapp update -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --image …:main-<sha> --revision-suffix m<sha8>` (short suffix) → poll `healthState==Healthy` → `ingress traffic set --revision-weight …--m<sha8>=100`. **Shared lab:** a Source-E2E loop steals the traffic pointer — re-check `ingress show --query traffic` after deploy; use the per-revision FQDN for a stable view.
- **Migration (lineage/blob):** `containerapp job update -n job-abarva-db-migrate-lab-eastus … --image <web image>` → `job start` → verify in Log Analytics.
- **Flags:** `src/lib/features/registry.ts`; enable per tenant without rebuild via `ABARVA_FEATURE_<KEY>_TENANTS=<tenant>` (alias `skyharbor-air→skyharbor` exists).

## 8 · Stop-and-surface (only these halt the loop)

- A genuine product/design fork the briefs don't settle.
- Destructive real-DB or any prod (non-lab) mutation.
- The Source-D09 collision unresolved when **DG-PR-F** comes up.
- A _required_ CI check failing for a real reason you can't fix in-slice.
- A breaking API-contract change would be needed (forbidden by WE) — re-design instead.

## 9 · State at handoff (`main` ≈ `1e95675d8`)

Shipped (engine): policy #3437, label-hygiene #3438, validator #3439, discovery-plan #3441; orchestrated business-case #3410 (flag OFF), flag alias #3411; Manage Moves #3409; landing simplification #3416. Workspace Explorer docs in PRs #3440/#3443 (not yet merged). Flags `moves_orchestrated_deliverables` / (to add) `workspace_explorer_source|moves` all default OFF. SkyHarbor portfolio empty. Demo evidence in `~/Downloads/SkyHarbor_IROPS_Care_*`.

---

_Build Source surfacing first (WE Source adapter), Moves second — proving the shell is module-agnostic — while the engine track migrates Moves first (Source engine migration stays quarantined behind the D09 agent). The two "Source-first vs Moves-first" orderings are about different layers and do not conflict._
