# Workspace explorer — build brief (Source + Moves)

Execution brief for the file/deliverable reset designed in
[`docs/build/WORKSPACE_EXPLORER_DESIGN.md`](../build/WORKSPACE_EXPLORER_DESIGN.md) and prototyped in
`~/Downloads/abarva-workspace-prototype/storyboard.html`.

This brief is **grounded in the live code** (mapped 2026-06-12), so its claims about reuse and blast
radius are real, not assumed. Read this whole file before writing code. Heed the three answers up top —
they are the acceptance bar, not background.

---

## TL;DR — the three questions, answered

### Q1. Is this for both Moves AND Source?
**Yes — but they are two different substrates, so the build is one shared explorer *shell* with a
per-module *adapter*.** They do not share backends today:

| | Source event | Strategic Move |
|---|---|---|
| Page shell | `UniversalCanvasShell` | `StrategicMoveDetailView` + `StrategicMoveDetailClient` |
| Rail | `EventStepRail` (11 stages) | `PhaseRail` (P0–P5) |
| Files registry | `source_artifacts` table + `source-artifacts` bucket | `program_attachments` + `generated_artifacts` |
| Upload route | `POST /api/v1/source/[eventId]/artifacts/upload` | `POST /api/programs/workspace/[moveId]/upload` |
| Generate | `POST /api/v1/source/[eventId]/artifacts/[code]/generate-from-claude` | board-artifacts registry + `generateDeliverableForPhase()` + `/api/v1/programs/[id]/nexus/current-state-brief` |
| Agent | Sentinel / Atlas | Nexus |
| Flag system | **none on these pages** (access-policy only) | `src/lib/features/registry.ts` (`isFeatureEnabled`) |

So: **one `WorkspaceExplorer` shell component + one read-model contract, with a `SourceWorkspaceAdapter`
and a `MovesWorkspaceAdapter`** that map each module's tables to the shared contract. Build Source first
(richer registry), then Moves as the second adapter — proving the shell is module-agnostic.

### Q2. Will this break existing buttons / workflows?
**Not if you follow the non-breaking rules below — and the brief is built so it can't.** The risk is real:
both pages have many live, API-wired buttons (mapped in §"Preserve" below). The strategy that makes the
answer "no":

1. **Additive, behind a flag that defaults OFF.** New flags `workspace_explorer_source` and
   `workspace_explorer_moves` in `src/lib/features/registry.ts` (tenant policy, empty `includeTenants` =
   opt-in). Flag OFF → the page renders exactly as today, byte-for-byte. (Source has no flag plumbing on
   these pages yet — adding `isFeatureEnabled` gating to the Source page server component is itself part
   of slice 0.)
2. **Zero changes to existing API routes or their contracts.** The explorer is a *presentation layer* over
   the *same* substrate queries (`listSourceArtifactsForSourceEventId`, `listArtifactStatesForEvent`,
   `listGateCriterionStatesForEvent`, `listEvidenceStatesForEvent`; `getStrategicMoveById`,
   `boardArtifactsForMove`). Generate/approve/advance reuse the **existing** routes verbatim — the chip is a
   new entry point, not a new backend.
3. **No deletions in slices 1–3.** The old tabs/shelf stay mounted (flag-gated) until the explorer is
   proven. Decluttering (removing tabs from the canvas) is slice 2 and only fires under the flag.
4. **Corrections the design doc got wrong (do NOT build against these):**
   - There is **no** `/api/v1/deliverables/generate` route. Do not call it. Use the per-module generate
     routes above.
   - Artifact→deliverable **lineage does not exist** as data (only `evidence_ledger` claim→source). The
     `usedBy`/`cites` view in the prototype is **net-new** — see §Lineage. Until built, the explorer must
     **not fabricate lineage**; show "lineage not yet recorded" rather than invent edges.
   - The 6-pass orchestrator's quality validator is **not** a standalone `quality-validator.ts`; scoring is
     embedded in `src/lib/deliverables/v2-generator.ts` (`QualityReview`). Reuse it in place; don't assume a
     separate module.

### Q3. How will we ensure everything works as planned?
**State-level verification, per the house standard — never trust UI text.** Every slice ships only when:

1. **Flag-OFF regression proves zero change.** A Playwright run with the flag off drives the *existing*
   buttons (promote stage, mark artifact complete, generate-from-claude, gate criterion state, advance
   phase, board-artifact view/download, Move→Source handoff) and asserts identical behavior + the same API
   calls fire. This is the "didn't break anything" proof.
2. **Flag-ON E2E drives the new flow at the state level.** Real clicks → assert the **API response**, then
   assert the **DB row** (e.g. `source_artifacts` / `generated_artifacts` committed, `approval_state`
   flipped, gate criterion `met`), then read **server logs** on ACA. No "the UI says Draft" — confirm the
   persisted state.
3. **Runs on ACA against the private DB** (localhost can't reach it). Build image → `containerapp update`
   → shift 100% traffic → verify on the serving revision. Map revision-suffix → git sha before trusting.
4. **Gates green:** `npm run audit:architecture-rules` = 0 violations (esp. the broker-boundary rule),
   `npm run release:check` passes with a release record under `docs/releases/records/`, typecheck clean.
5. **Self-healing loop** (same as the Source E2E crawl brief): CAPTURE failure → ROOT-CAUSE from the live
   log (not the generic 500 body) → FIX → TEST → re-deploy → RE-VERIFY at the state level. Loop to green.

---

## Reuse vs build (grounded 2026-06-12)

| Capability | Status | Use this |
|---|---|---|
| Source files registry + upload + versioning | ✅ exists | `source_artifacts`, `registerSourceArtifactUpload`, `SOURCE_ARTIFACT_MIME_ALLOWLIST`, `sourceArtifactFormatFromMime`, bucket `source-artifacts` |
| Source substrate read (artifacts/gates/evidence) | ✅ exists | `src/lib/source/canvas-substrate/queries.ts` |
| Source stages | ✅ exists | `SOURCE_STAGE_ORDER` / `SOURCE_STAGE_LABELS` in `src/lib/source/constants.ts` (strategy→scope→rfp→responses→evaluation→pricing→bafo→executive_decision→selection→transition→value) |
| Moves detail read | ✅ exists | `getStrategicMoveById`; `boardArtifactsForMove`; `program_attachments` via `/api/programs/{id}/attachments` |
| Moves phases | ✅ exists | `PHASE_LABELS`/`PHASE_CODES` (`src/lib/programs/phase-labels.ts`): P0 Originate, P1 Charter, P2 Discover & Diagnose, P3 Design Future State, P4 Roadmap & Business Case, P5 Mobilize & Handoff |
| 6-pass authoring + quality | ✅ exists (in place) | `generateDeliverableForPhase` / `generateDeliverableV2` in `src/lib/deliverables/`; `QualityReview` embedded |
| Generated-artifact persistence | ✅ exists | `saveGeneratedArtifact` / `generated_artifacts` (board packs); `deliverables_v2`/`deliverable_versions` (phase deliverables) |
| RBAC / classification | ✅ exists | `UserSourceAccessPolicy` (`loadUserSourceAccessPolicy`), program-access-policy, RLS `can_read/write_tenant_by_key`, `evaluateSensitiveUpload`, disclosure-flag |
| Feature flags | ✅ exists (Moves only) | `src/lib/features/registry.ts`, `isFeatureEnabled(key, ctx)` — add Source gating |
| **Unified `/deliverables/generate` route** | ❌ does NOT exist | use per-module routes; do not invent |
| **Workspace explorer read-model + shell** | ❌ net-new | build (slice 1) |
| **Artifact↔deliverable lineage (usedBy/cites)** | ❌ net-new | build (slice 3) — see below |

---

## Lineage (the differentiator — net-new, build it honestly)

No table records "this deliverable cited these inputs." Minimum viable model:

- Add `cited_source_artifact_ids UUID[]` (Source) and reuse `generated_artifacts.evidence_ledger_ids` +
  a new `cited_input_ids UUID[]` (Moves) — populated **at generation time** by the generate route from the
  evidence it actually assembled. Do not backfill or infer for historical rows.
- The explorer preview reads these to render `cites ←` (on a deliverable) and the inverse `used by →` (on an
  input, by querying deliverables whose array contains the input id).
- Until a deliverable was generated *after* this ships, show **"lineage not yet recorded"** — never fabricate.

---

## Build slices (each: files · preserve · flag · verify · done)

**Slice 0 — Flag plumbing + read-model contract.**
Add `workspace_explorer_source` / `workspace_explorer_moves` to the registry. Define `WorkspaceItem`
TS contract (id, name, type, kind, origin `uploaded|generated`, state, version, stage_key, source_label,
classification, vendor?, lineage{usedBy,cites}, audit, blob_path). Gate the Source page server component
with `isFeatureEnabled`. *Verify:* flag off → page identical (Playwright snapshot + same API calls).

**Slice 1 — Read-only explorer over the existing registry.**
Build `WorkspaceExplorer` shell (nav → list → preview) + `SourceWorkspaceAdapter` mapping
`source_artifacts` + substrate queries → `WorkspaceItem[]`. Drawer + full-page route
`/source/events/[eventId]/workspace`. No writes. *Preserve:* all existing routes/buttons untouched.
*Verify:* flag on → list matches registry rows 1:1 (assert against `listSourceArtifactsForSourceEventId`).

**Slice 2 — Declutter the page + chips.**
Under the flag, remove the inline Document/Gate/Evidence/Log tabs from the canvas and add the
`Workspace · N ↗` + `Generate` chips; keep the rail, Next-move, gate, Ask bar. The tab *components and their
APIs stay* — they're just relocated into the explorer. *Verify:* every action still reachable; flag-off
regression unchanged.

**Slice 3 — Lineage + versions in preview.**
Add the lineage columns (above), populate at generate time, render usedBy/cites + version history.
*Verify:* generate a deliverable → assert the array column persisted in DB → preview renders the real edges.

**Slice 4 — In-context Generate.**
The `Generate` chip → pick-card → call the **existing** per-module generate route → show the real
`QualityReview` (passed / blocked-with-reasons) → land as Draft in the explorer → Approve uses the
**existing** gate/criterion or advance route. *Verify (state level):* DB shows the artifact row +
quality_score; approve flips `gate_criterion_states.state='met'` (Source) or advances phase (Moves);
server log clean.

**Slice 5 — Upload/version from the explorer.**
Wire the governed upload route (`/api/v1/source/[eventId]/artifacts/upload`) — **never the chat paperclip**.
Vendor-scoped uploads stay structurally isolated. *Verify:* upload → `source_artifacts` row + blob in
`source-artifacts` + version chain (`supersedes_artifact_version_id`).

**Slice 6 — Moves adapter.**
`MovesWorkspaceAdapter` over `program_attachments` + `boardArtifactsForMove` + `generated_artifacts`;
same shell. Flag `workspace_explorer_moves`. *Verify:* Moves explorer + generate + approve-advances-gate at
state level, identical pattern.

**Slice 7 — Tenant vault + RBAC/classification.**
`/setup/files` reusing the shell, tenant-wide facets. Enforce `allowedDataClasses` + RLS on preview/download;
audit every action. *Verify:* a restricted file is not previewable by an under-privileged role (drive it).

---

## Guardrails (non-negotiable)
- **Broker boundary:** app-tier must not import EnterpriseDataRoom/broker/vector/graph directly; go through
  the contract. `npm run audit:architecture-rules` must be 0.
- **No new Supabase/Neo4j/Pinecone/Vercel runtime deps;** Azure/Postgres data-plane only. OpenAI only for
  TTS/embeddings, never production reasoning.
- **Governed upload only** (not the chat attachment route). **Versioning is upgrade-only** (current →
  superseded, no overwrite).
- **AI never final:** a generated deliverable is a Draft until a named human approves with rationale.
- **Vendor isolation is structural** and trace-proven (a vendor node only loads that vendor's artifacts).
- **Release discipline:** classify lane (`global-control-lane` for the shell; `client-data-lane` for the
  lineage migration), add a release record, `npm run release:check`. Never push to main — PR + squash.
- **Verify at state level**, encode the crawl as Playwright E2E, run on ACA private DB, self-heal to green.

## Definition of done
Flag-off regression proves zero change on both pages; flag-on E2E proves the full
page → Workspace → Generate → quality gate → Draft → Approve → gate/phase advances loop at the **state
level** (UI + API + DB + ACA log) for **both** Source and Moves; lineage edges persist and render; arch-rules
0; release:check green; release records filed.
