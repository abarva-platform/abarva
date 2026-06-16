# Source Decision Engine — Slice Roadmap & Standing Conventions

**Goal:** turn Source from a stage/artifact workflow into a CXO-grade decision engine.
The contract: **every human click is a decision, not form-fill.** The system prepares,
assesses, drafts, routes; the human signs.

Fix in increments. **One slice = one PR = its own tests + its own browser proof.** Do not
batch slices. Each merges and is verified in the real app before the next begins.

---

## The decision loop (what we are wiring)

```
Evidence  ──▶  Readiness  ──▶  Gate Assessment  ──▶  Artifact Draft  ──▶  Approval Routing  ──▶  Stage Advance
(in DB)        (in DB)         Slice A / A2          Slice B / B2 / D     Slice C               (exists)
```

## Slice list & dependency order

| Slice | Title | Depends on | One-line outcome |
|-------|-------|-----------|------------------|
| **A** | Evidence → Gate auto-assessment + Stage Decision Status | — | A criterion goes green from evidence, no click; a Ready/Blocked panel explains why. |
| **A2** | Persist auto-assessment as a durable audit record | A | The auto-met decision is written with evidence IDs + system actor, not just derived at render. |
| **B** | Auto-draft on stage entry (fast path) | — (pairs with A) | Enter a stage → a working draft is already waiting. Strategy memo generated at P0 approval. |
| **B2** | Source → orchestrator bridge (board-pack, premium dial) | B | "Produce board pack" routes a Source artifact through the 6-pass orchestrator so `ABARVA_DOCGEN_QUALITY_PROFILE` finally reaches Source. |
| **C** | Approval routing foundation | A | Gate approval label strings resolve to real people + persisted approval records. |
| **D** | Archetype-specific artifact branching | B | An AMS RFP is materially different from an ERP-SI / renewal RFP. **Audit done** — canon exists on `main`, build the injection wire. |
| **E** | Vendor response ingestion boundary | — | Upload a vendor response → normalization + completeness + risk fire automatically. |

**Recommended execution order:** A → B → A2 → C → D → B2 → E.
(A and B are the two highest-value, lowest-risk wires. A2/C harden governance. D/B2 deepen
quality. E opens the vendor side.)

> **Pre-flight done (de-risking).** Slice A's evidence→criterion mapping (15 clean / 12 fuzzy /
> 12 manual across 39 criteria, with 6 join gotchas) and Slice D's archetype audit (verdict:
> generation is generic; canon exists on `main`, only the injection wire is missing) were
> pre-resolved and folded into those briefs' §0.5 / §0. Codex starts with the hard analysis done.

**Out of this roadmap (named, later):** *Slice F — section-batched large-package generation*
(50-slide PPTX / multi-appendix RFP that cannot fit one model call even at premium budgets).
Orthogonal to the token dial; do not attempt inside B2.

---

## The two-speed quality model (read before B / B2)

There are **two generation paths** in the repo. Keep them distinct:

1. **Fast path** — `src/lib/source/agent-generation/` (single-shot, `claude-sonnet-4-6`,
   ~4000 tokens, templates d01/d05/d09). Use for **auto-draft on stage entry** (Slice B).
   Cheap, fast, "react to a draft."
2. **Board path** — the deliverables orchestrator (`src/lib/deliverables/orchestrator/` +
   `src/lib/programs/deliverables/orchestrated/`): 6 passes (architect → evidence_grounding →
   full_draft → red_team → board_grade_rewrite → render_package), Opus-class, token budget
   scaled by `ABARVA_DOCGEN_QUALITY_PROFILE` (standard ~66k / real_engagement ~132k /
   premium_final ~456k). Use for an **explicit "Produce board pack" click** (Slice B2).

**Known gap as of now (PR #3531 merged):** the docgen policy registry classifies Source
artifacts at tier3/tier4 (`d01_strategy_memo`, `rfp_package` → `tier4_large_package`), **but
no Source route calls the orchestrator** — Source generation does not import the policy. So
flipping `premium_final` today does NOT upgrade a Source RFP. **Slice B2 is the bridge that
closes this.** Never auto-fire the board path on stage entry (too slow/expensive); it is a
deliberate human action.

---

## Standing conventions (apply to EVERY slice)

### Verified codebase anchors (do not re-discover; confirm before editing)

**Canonical catalogs (read-only inputs):**
- `src/lib/source/canonical-specs/evidence-requirements.ts` — `SourceEvidenceRequirement`,
  `evidenceForStage(stage)`. 7-state ramp.
- `src/lib/source/canonical-specs/gate-criteria.ts` — `SourceGateCriterion`, `criterionById(id)`.
- `src/lib/source/canonical-specs/artifact-specs.ts` — `SourceArtifactSpec` (codes like
  `d05_scope_memo`, `d09_rfp_pack`).
- `src/lib/source/canonical-specs/index.ts` — barrel; export new helpers here.

**Per-event state (the real DB data):**
- `src/lib/source/canvas-substrate/types.ts` — `SourceEventEvidence`,
  `SourceEventGateCriterion`, `SourceEventArtifactState` (+ row types + transformers).
- `src/lib/source/canvas-substrate/queries.ts` — `getStageSubstrate(eventId, stageKey)`
  returns `{ artifacts, criteria, evidence }`; `countGateProgress`,
  `listGateCriterionStatesForEvent`, `listEvidenceStatesForEvent`, `listArtifactStatesForEvent`.
- `src/lib/source/canvas-substrate/scaffold.ts` — per-event substrate seeding.

**Generation:**
- Fast path: `src/lib/source/agent-generation/{prompt-registry,context-binder,server,types}.ts`
  (`getPromptTemplate`, `buildSourceGenerationContext`, `collectUpstreamBodies`,
  `findMissingUpstreamCodes`).
- Board path: `src/lib/programs/deliverables/orchestrated/run-orchestrated-move-deliverable.ts`,
  `src/lib/deliverables/orchestrator/{model-caller,prompt-builder}.ts`,
  `src/lib/ai/document-generation-policy.ts` (`DocGenTier`, `resolvePassTokenBudget`,
  `resolveDocGenQualityProfile`, `DELIVERABLE_TIER`).

**Write seam (the ONLY way to write):**
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts` — `SourceWriteAdapter`:
  `updateStage`, `updateGateCriterion`, `updateArtifactBody`, `updateArtifactStatus`.
  `GateCriterionUpdate` does NOT persist `notes` yet (Slice A2 adds it).
- `selectSourceWriteAdapter(undefined, clientKey)` selects the physical plane.

**Routes:**
- Approve: `src/app/api/v1/source/events/[eventId]/approve/route.ts` (P0 approval fires here).
- Gate criterion flip: `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`.

**UI:**
- `src/components/source/canvas/UniversalCanvasShell.tsx` — loads `stageCriteria` +
  `evidenceStates`, renders the workspace tabs, owns the PATCH calls.
- `src/components/source/canvas/workspace-tabs/{GateTab,EvidenceTab,DocumentTab,LogTab}.tsx`.

**Stage config:** `src/lib/source/stage-canvas-config.ts` (`artifactIds` per stage).

### Standing validation (run on every slice, before reporting)
```
npx tsc --noEmit
npx eslint src/lib/source/ src/components/source/        # widen to touched dirs
npm run test:behaviors                                   # or the targeted test path
node scripts/release-check.mjs --base origin/main --head HEAD
```

### UX density contract — THE HARD RULE for every panel (every slice)
The founder has rejected cluttered Source canvas surfaces **twice** (the WorkspaceExplorer preview
pane; the first Stage Decision Status panel that rendered the same 5 criteria three times with an
always-open approval textarea on every card). Dense-everything-at-once is form-fill — the exact
opposite of "every click is a decision." **Every panel you build or touch obeys these six rules:**

1. **One row per item.** A criterion / evidence requirement / artifact / approval is ONE row.
   Never render the same item in multiple stacked forms (summary + list + cards = three copies).
2. **Color IS the status.** A single status dot carries state — `red` = blocked by evidence,
   `amber` = needs human review, `green` = met. Do NOT also spell the state in a badge AND a
   sentence AND a label.
3. **One secondary line max.** Each row gets at most one context line: the actionable gap
   (`Application inventory · not requested → needs usable evidence`) or the human action
   (`Needs human review · sponsor sign-off`). Not description + reason + needs-stanza + id stacked.
4. **Action reveals its form.** The approval-reason textarea (and any input) appears only AFTER
   the user clicks the action, on that one row — never pre-rendered open for all rows.
5. **Detail one level down.** Criterion IDs, full descriptions, multi-input breakdowns,
   owner-beyond-a-chip live in hover / expand / click-through — present for audit, absent from the
   glance. (e.g. a criterion needing 4 inputs shows "4 inputs not ready · see what's missing", not
   all four inline.)
6. **No duplication.** If the same data appears twice on a screen, delete one. The header is the
   only summary; the rows are the detail.

A compact reference layout for the gate panel is specified in Slice A §UX. Apply the same shape to
the Evidence tab, the Documents/auto-draft status (Slice B), and the approvals surface (Slice C).

### Browser verification — THE HARD GATE (every slice)
Code-complete is **not** done. **Done = you navigated the real deployed app and saw it work.**
- Test target: **SkyHarbor Air**, event `affa4231-eecd-4019-9b76-06bb8d324988`
  (`SKYH-MANAGED-SERVICES-TOWER-2026`), tenant `skyharbor-air`. Strategy-at-P0 flags live on ACA.
- Each slice brief names the exact navigation + the positive AND negative path to screenshot.
- If you cannot run a browser: label the PR **`code-complete`** (not `click-verified`) and hand
  back the exact steps + expected result. Never report success on an unverified UI claim.

### Content truth standard — verify the DELIVERABLE, not just that a file appeared
A file existing is **not** a deliverable being right. Per AGENTS.md context-ingestion truth standard,
keep these as **separate states** and never collapse them into "generated" or "done":
`generated` · `quality-gated` · `committed to the Azure Postgres data plane` · `staged to Azure
Blob / File Cabinet as a rendered file` · `at the prescribed tier/detail` · `content verified vs the
artifact spec`. For ANY slice that generates, persists, or renders a deliverable:
- **Read the persisted content** and check it against the artifact spec's prescribed sections/detail
  — do not stop at `body != null`. "A draft appeared" ≠ "the draft is a correct, complete scope memo."
- **State where it landed, precisely:** Postgres `body` column is NOT the same as an Azure Blob
  object. `inline://...` URIs are synthetic DB references, not staged files. If nothing is rendered
  to Blob, say so — don't imply "persisted in Azure" means a document exists.
- **Name the quality gate that ran (or didn't).** The consulting-grade gate currently covers only
  `d09_rfp_pack`; auto-drafted `d01`/`d05` get no gate. If a deliverable wasn't validated, say so.
- **Distinguish real LLM output from the deterministic fallback** (no `ANTHROPIC_API_KEY` → stub).
  Confirm which one the live deploy produced before calling a draft "generated at quality."
- In the reporting contract, the verification status must cover **content**, not just creation.

### Reporting contract (every slice's final message)
- **Files changed** (new vs modified). **Behavior added** (what a CXO now sees that they didn't).
- **Verification status** — `click-verified` (with observations/screenshots) or `code-complete`
  (with exact steps to run). **What I did NOT do** (confirm later slices untouched).
- **Known limitations.** **Exact next slice** recommendation.

### Boundaries (non-negotiable, every slice)
- No `.auth/` commits. Read secrets via `az containerapp secret show`; never print/commit them.
- Cover names only in artifacts; incumbent names/spend internal-only; no fabricated savings.
- No new runtime deps on Supabase/Neo4j/Pinecone/Vercel. No OpenAI for production reasoning.
- `env -u GH_TOKEN gh`. Never push to `main` — PR + squash auto-merge. Never bypass `release:check`.
- Keep existing manual workflows working; **add** automation on top, remove nothing.
- One slice per PR. Do not start the next slice's work.
