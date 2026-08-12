# Codex Handoff — Source Decision Engine · Async Quality Auto-Draft

**Supersedes the "fast stub" auto-draft model. Absorbs B2 (orchestrator) + the quality gate +
Blob persistence into one coherent design: auto-draft is a durable, quality-gated, async job whose
output lands in the File Cabinet as a real, retrievable Blob.**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first (esp. the §UX density contract and the
> **content truth standard**). This is a phased slice — ship AQ1 → AQ2 → AQ3 as separate PRs, each
> browser-verified, per the standing discipline.

---

## 0 · The reframe (why this replaces the two-speed "stub now / board-grade later")

Auto-draft already fires **non-blocking / detached** after the stage commit (Slice B). Once it's
detached there is **no ~110s HTTP ceiling** — the only latency budget is "how long until the human
reads the draft," which for a months-long sourcing event is minutes. So auto-draft is **not**
required to be a fast single-shot Sonnet stub. It should be an **async job that takes the right time
and tokens to produce the right quality**, then persists a real, retrievable file.

Founder's two hard requirements, both now in scope:
1. **Anthropic key on ACA** (so drafts are real, and the orchestrator can run).
2. **Files persist on Blob, retrievable through the right interface** (the File Cabinet), not the
   synthetic `inline://` reference that lives only in a Postgres column.

---

## 1 · VERIFIED prerequisites (checked 2026-06-16)

- ✅ `ANTHROPIC_API_KEY` is set on `ca-abarva-web-lab-eastus` (secret `anthropic-api-key`). Drafts
  are real model output, not the deterministic stub.
- ✅ Object store wired: `DATA_PLANE_OBJECT_STORE_ACCOUNT` / `DATA_PLANE_OBJECT_STORE_CONTAINER`.
  The adapter `src/lib/data-plane/objectStorage.ts` (`getObjectStorageAdapter()`) has `upload`,
  `downloadToBuffer`, `exists`, `deleteIfExists`.
- ✅ **File Cabinet (the retrieval interface) exists:** `src/lib/source/file-cabinet/`
  (`blob-store.ts`, `deliverable-bridge.ts`, `repository.ts`, `service.ts`, `types.ts`,
  `index.ts`); download route `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts`;
  UI `src/app/(maestro)/source/events/[eventId]/file-cabinet/page.tsx` +
  `src/components/source/FileCabinetPanel.tsx`. Release records 2026-06-10 (source + moves).
- ✅ Orchestrator quality engine exists + module-agnostic: `runDeliverableOrchestration`
  (`src/lib/deliverables/orchestrator/orchestrator.ts`); token budgets resolve from
  `ABARVA_DOCGEN_QUALITY_PROFILE` (`src/lib/ai/document-generation-policy.ts`).
- ❌ **No artifact-generation async queue** — generation is synchronous HTTP today. This is the one
  net-new piece (the ACA worker pattern exists for context ingestion:
  `docs/architecture/azure/AZLAB21-context-ingestion-worker.md`, dispatch-worker release record).
- ❌ **Auto-draft writes `inline://`, not Blob** — `[eventId]/artifacts/[artifactCode]/generate`
  uses `INLINE_REGISTRY_URI_PREFIX`; the SIBLING route `[eventId]/artifacts/generate` already does
  real `getObjectStorageAdapter().upload('source-artifacts', ...)`.
- ❌ **d01/d05 not quality-gated, not section-verified** (consulting-grade gate = `d09` only).

**PREREQUISITE CHECK (do first, report):** confirm whether `app.abarva.ai` is still served by
`ca-abarva-web-lab-eastus` (lab sub `701a8554-…`) or by a newer **product-preview** app
(`sub-abarva-product-preview-eus-001`). The key + object-store env MUST be present on whatever app
serves the founder. Verify names-only via `az containerapp show … --query
"properties.template.containers[0].env[].name"` (never print values).

---

## 2 · The cost guardrail (the one real constraint)

Do NOT run `premium_final` (456k tokens, Opus 6-pass) on every stage entry for every event — most
drafts are superseded before anyone reads them. The two-speed model survives, but the floor moves up:
- **Async auto-draft default:** a middle tier (`real_engagement`, ~132k) — quality-gated +
  section-verified, not maximal spend.
- **On-demand premium:** the explicit "finalize for board / pre-promotion" run goes `premium_final`.

This is **good-quality-async-default vs premium-on-demand**, NOT stub-vs-board-grade.

---

## 3 · Phased delivery (three PRs, each shippable + browser-verified)

### AQ1 — Blob persistence + retrieval for generated artifacts — ✅ DONE (PR #3551, merged + live)
Generated Source artifacts now land in the **File Cabinet as a real Blob** (real `source-artifacts`
path, not `inline://`), retrievable via the live download route. Live-proven on `app.abarva.ai`
(served by `ca-abarva-web-lab-eastus`, revision `m43580c8c`): downloaded d01 (4.8 KB) + d05 (7.9 KB)
to `~/Downloads`, both real Claude `claude-sonnet-4-6` output (not fallback stubs).
- **Known limitation that AQ1b fixes:** the persisted/downloaded body is the **raw Markdown source**
  (escaped `**`, `## §`, raw pipe tables) — fine as internal source, NOT acceptable as a CXO download.

### AQ1b — render DOCX (primary) + HTML (preview); keep Markdown internal (DO NEXT — most visible)
The deliverable a CXO downloads must be a **formatted DOCX**, with an **HTML preview** inline; the
Markdown stays as internal *source* to re-render from. This is **wiring existing renderers**, not
building one: the `render-docx` route already renders these same markdown bodies via
`renderArtifactDocx` + `buildNarrativeDocxPayloadFromContext` (`src/lib/source/exports/...`), there's
a shared `src/lib/exports-shared/markdown-to-docx.ts`, and an HTML renderer
(`src/lib/programs/deliverables/orchestrated/render-html.ts`).
- At the AQ1 persist seam in `[eventId]/artifacts/[artifactCode]/generate/route.ts`, after the
  markdown body is produced, also render **DOCX** (via `renderArtifactDocx` / `markdown-to-docx`) and
  **HTML preview**, upload BOTH to the `source-artifacts` bucket via the AQ1 File Cabinet path, and
  register File Cabinet metadata so **DOCX is the primary download**, HTML is the preview, Markdown is
  internal source only (not the default user-facing download).
- The download route returns DOCX by default (`DOCX_CONTENT_TYPE`, `.docx` filename). Best-effort:
  a render failure logs and falls back to markdown; generation never fails. Applies to both manual
  generate and stage-entry auto-draft (shared `generateSourceArtifactDraft`).
- **Verify (download-to-disk):** download d01/d05 from the live File Cabinet to `~/Downloads` — the
  file is `.docx` (not `.md`), opens as a formatted Word doc (headings/tables rendered, no raw `## §`),
  HTML preview renders in the workspace, markdown is no longer the default download.

### AQ2 — section-conformance verification + "unverified" badge (cheap, no LLM)
Before persist, assert the required `## §N` headers from the artifact's prompt template are present +
non-empty; if not, store a `low_confidence`/`incomplete` flag in `body_generation_metadata` and badge
the draft **"unverified"** in the workspace (obey OVERVIEW §UX density — a single marker, not a wall).
This kills the biggest risk: a hollow `d05` can no longer masquerade as a finished deliverable.
- Seam: between the empty-check and `updateArtifactBody` in the generate route.
- **Verify:** a deliberately truncated draft is badged `unverified`; a complete one is not.

### AQ3 — async quality generation through the orchestrator
Route auto-draft through the orchestrator as a **durable async job** at the default quality tier.
- Build a generation-job seam on the existing ACA worker pattern (the net-new piece). Enter stage →
  enqueue → worker runs `runDeliverableOrchestration` with `module: 'source'` (per the Slice B2
  pre-flight: build a Source `DeliverableIntelligenceRequest`, do NOT reuse the Move builder) at
  `real_engagement` → quality-gate + AQ2 section-verify → persist via AQ1's File Cabinet path →
  status `drafting → ready (verified)` in the UI (reuse the artifact status enum + AQ2 metadata).
- Extend the consulting-grade gate to d01/d05 with per-artifact rubrics (token-budget-capped per the
  d02/d03 lesson so review+rewrite fit the worker budget).
- Keep the explicit **premium** finalize path (B2 on-demand) for board/pre-promotion runs.
- **Verify:** enter a stage on a disposable event → draft shows `drafting…` → returns minutes later
  as a quality-gated, section-verified, Blob-persisted artifact retrievable via the File Cabinet;
  `body_generation_metadata.model` shows a real Opus/Sonnet id + the gate result (not
  `source-deterministic-fallback`).

---

**Sequence:** AQ1 (✅ done) → **AQ1b (next — DOCX/HTML, most visible)** → AQ2 (section-verify) →
AQ3 (async quality). AQ1b is reordered ahead of AQ2/AQ3 because the founder judges the product by the
file they open, and it's the smallest (wiring existing renderers).

## 4 · Boundaries
- AQ1b/AQ2 are migration-light and reuse existing renderers + the File Cabinet + status enum. AQ3
  adds the generation-queue seam — its own PR, do not fold it into the others.
- Markdown is internal *source*; the CXO deliverable is **DOCX** (AQ1b). HTML is preview only.
- Obey the OVERVIEW content truth standard: report `generated / rendered-to-DOCX / quality-gated /
  committed-to-Postgres / staged-to-Blob / retrievable-as-DOCX / content-verified` as separate states
  with evidence; never collapse.
- Cost: default async auto-draft to `real_engagement`; premium only on the explicit finalize action.
- Branches: `codex/source-aq1-blob-retrieval` (done), `codex/source-aq1b-docx-render`,
  `codex/source-aq2-section-verify`, `codex/source-aq3-async-quality`.
