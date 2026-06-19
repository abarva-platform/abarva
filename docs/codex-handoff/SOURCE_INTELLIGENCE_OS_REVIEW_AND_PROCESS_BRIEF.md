# Codex Handoff — Source Intelligence OS Spec: Review & Process

**Owner:** Anand · **Created:** 2026-06-19 · **Branch the spec was grounded on:** `codex/corpus-wave-24`

## 0. Mission

A ~127-page board-grade architecture specification — **"AbarVa Source Intelligence Operating System"** — has been authored and adversarially reviewed. Your job is to (A) **review** it against the live codebase and (B) **process** it into an actionable, sliced engineering plan. Do **not** rewrite the spec wholesale; verify it, correct any drift, and turn it into build work.

The spec's thesis: Source evolves from a governed **document generator** (`Event → Context Binder → Prompt Registry → Claude → Deliverable`) into a **sourcing intelligence operating system** (`Context → Analysis → Recommendation → Deliverable`) — vendor rankings, negotiation strategies, and executive decisions become the product; documents become outputs of reasoning carried in a canonical **Reasoning Envelope**.

## 1. Where the artifacts live

All under `docs/build/source-intelligence-os/`:

| File | What it is |
|---|---|
| `ABARVA_SOURCE_INTELLIGENCE_OS_SPEC_FULL.md` | **Start here** — complete spec (outline + all 4 volumes), ~127pp |
| `00_MASTER_OUTLINE.md` | The blueprint / table of contents (all 4 volumes) |
| `VOLUME_1_CURRENT_AND_FUTURE_STATE.md` | Exec summary · current-state scorecard · elite-firm models · future-state vision |
| `VOLUME_2_SOURCE_INTELLIGENCE_ENGINE.md` | Reasoning · Vendor Evaluation · BAFO · Selection engines (Ch5–8) |
| `VOLUME_3_ENTERPRISE_ARCHITECTURE.md` | Contract · Transition · Market · Agent · Data · UX · Deliverable architecture (Ch9–15) |
| `VOLUME_4_IMPLEMENTATION_ROADMAP.md` | 7-phase delivery plan (Ch16) |
| `_GROUNDING_MAP.md` | The repo audit the spec was built on (maturity scores + real paths) |
| `_REVIEW_PUNCHLIST.md` | Full provenance + every correction applied + known residuals |

**Reading order:** `_GROUNDING_MAP.md` → `00_MASTER_OUTLINE.md` → `VOLUME_1` → `VOLUME_4` (roadmap) → Volumes 2–3 for depth.

## 2. Part A — REVIEW (verify, do not trust)

The spec was grounded on `codex/corpus-wave-24`. Re-verify against the **current** branch. Spot-check the load-bearing current-state claims with these commands and flag any drift:

```bash
# live pipeline seams
ls src/lib/source/agent-generation/{context-binder.ts,prompt-registry.ts,server.ts}
sed -n '1,40p' src/lib/source/agent-generation/prompt-registry.ts   # confirm only d01/d05/d09 live
# render-pdf is BUILT (200), wired for d05/d09/d24/d27 — NOT a 501 stub
grep -nE "@react-pdf|isPdfGeneratable|status: 200|501" "src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render-pdf/route.ts"
# text-parser is text/first-mile only (no mammoth/pdf-parse/exceljs)
sed -n '1,30p' src/lib/source/artifact-registry/text-parser.ts
# canonical counts
grep -oE "criterionId:\s*'[^']+'" src/lib/source/canonical-specs/gate-criteria.ts | sort -u | wc -l   # 39 entries / 38 GATE- ids
grep -oE "requirementId:\s*'[^']+'" src/lib/source/canonical-specs/evidence-requirements.ts | sort -u | wc -l   # 21
# archetype seam + dormant engine
grep -nE "classifySourcingEvent|estimateEventShouldCost" src/lib/source/source-answer-engine.ts
# voice-doctrine real path
ls src/lib/agent/voice-doctrine/   # sentinel/atlas/nexus/steward.ts (NOT under source/)
```

Produce a short **review note**: claims confirmed, claims now stale (repo moved), and any spec section that needs a grounding patch.

## 3. Part B — PROCESS (turn spec into build work)

1. **Lift Volume 4's 7 phases into a concrete backlog.** For each phase: objective, the real files/seams it touches, dependencies, risk, success metric. Phases: (1) Reasoning spine, (2) Evaluation engine, (3) BAFO engine, (4) Selection engine, (5) Contract intelligence, (6) Transition intelligence, (7) Full platform.
2. **Detail Phase 1 (the reasoning spine) into implementable slices** — it gates everything else. The spec proposes new modules `src/lib/source/reasoning/analysis-stage.ts` and `recommendation-stage.ts`, a `ReasoningEnvelope` output contract, and wiring the dormant analytical modules (should-cost, delivery-model gate, proposal-normalization) into the live generate path **without destabilizing the one path that works** (`generate/route.ts`). Slice it: contract/types first, then Analysis stage (additive), then Recommendation stage, then prompt-registry change to render the envelope.
3. **Map each of d01–d33** to its build state (live / partial / stub / absent) per Volume 3 Ch15, and identify the load-bearing missing artifacts.
4. **Write release records** per the repo's release-control discipline (see below) — one per shippable slice.

## 4. Verified ground truth — DO NOT regress these

The adversarial review corrected these; keep them correct in any derived plan:

- `render-pdf/route.ts` returns **200** (`@react-pdf`), wired for **d05/d09/d24/d27**, 404 for unwired — **never 501**.
- `text-parser.ts` is **text/first-mile only**; binary docx/pdf parsing is **net-new** (or reuse the Moves-side pipeline under `src/lib/programs/`). Do not claim it parses binaries.
- **38 gate IDs / 39 criterion entries** in `gate-criteria.ts`; **21** entries in `evidence-requirements.ts`.
- **3 of 33** prompt templates live (`d01`/`d05`/`d09`).
- `disclosure-flag/` is a **legal-privilege classifier** (attorney-client/work-product, downstream inheritance) — **not** an evidence-refusal mechanism. The evidence-or-refuse posture is **ABSENT/net-new** and would wire into `source-answer-engine.ts`.
- Archetype seam = `types.ts` (`archetype:string`, `SourceRigorLevel`) + `classifier/category-classifier.ts:classifySourcingEvent()`, called only inside the **DORMANT** `source-answer-engine.ts` — **not** `source-shape-resolver.ts` (that's the UI WorkingPaneShapeResolver).
- should-cost-model **is imported** by the dormant `source-answer-engine.ts` (its header's "NOT wired" comment is **stale**); it is not on the live generate route.
- Feature flag key = `retrieval_azure_search` (`tenant-context-v1` is only in the description string).
- Canonical stage scheme = stage-pack filenames `S0_intake..S7_activate` (S2=shortlist, S3=rfp, S5=bafo, S6=contract, S7=activate). UI `source-shape-resolver.ts` uses divergent labels — note, don't mix.
- The Source Event Archetype Framework (4 archetypes, two-axis resolver, 10-method library, promotion-only evidence ladder) is **DORMANT** (no live call-site).

## 5. Known residuals to clean (non-blocking)

From `_REVIEW_PUNCHLIST.md`: a few fragile exact line-number / LOC citations (prefer naming file+function), one cross-chapter input-list reconciliation (Vol3 Ch9 vs Ch12 contract-agent inputs), one cosmetic typo (Vol3 Ch14 §14.1 "wrestructures"). Fix opportunistically.

## 6. Guardrails

- **Additive docs only on a branch.** The spec is not committed; do not touch the live generate path while reviewing.
- **Release lanes** (`AGENTS.md`): classify each slice — `global-control-lane` for shared reasoning-engine behavior, `client-data-lane` for anything touching the private data plane. Add release records under `docs/releases/records/` from the template; `npm run release:check` enforces.
- Do not introduce new runtime deps on legacy Supabase/Neo4j/Pinecone; use the Azure/Postgres data-plane adapters.
- Tenant isolation, human approval gates, evidence-or-refuse, audit trail are first-class — preserve them in every design.

## 7. Expected outputs from this session

1. A **review note** (claims confirmed / stale / needs-patch) at `docs/codex-handoff/SOURCE_INTELLIGENCE_OS_REVIEW_NOTE.md`.
2. A **Phase-1 reasoning-spine build plan** (sliced, file-level) — the first shippable increment.
3. A **7-phase backlog** mapped to real seams + a **d01–d33 build-state matrix**.
4. Any **grounding patches** to the spec files (small, surgical) with a one-line changelog.
