# AbarVa Deliverable System — Current State Assessment

> Mandated by Section 1 of the Deliverable System Transformation spec
> (`~/Downloads/AbarVa_Deliverable_System_Refactoring_Spec_v1.docx`). Per Section 1,
> **no implementation begins until this assessment is complete.** This document maps every
> subsystem against the board-grade bar and is the baseline the transformation is measured from.

**Benchmark.** Not "high-quality AI writing." The bar is: *would a McKinsey / Bain / BCG partner
put this in front of a Fortune-100 CEO/CIO/CFO/COO/Board without rewriting it?* Today: **no** —
and the live First Capital P1→P5 arc (2026-06-19) is the proof set. Those 11 deliverables are
11k–16k words of cited **prose with markdown tables**: structurally sound and governance-clean,
but topic-ordered, exhibit-free, and audience-blended — "AI-generated report," not "executive
consulting artifact." That is exactly the failure mode the spec targets.

---

## 0. The single most important finding — AbarVa is two systems, and the wrong one ships

There are **two parallel deliverable stacks** in the repo:

| | **Orchestrator stack** (ships live) | **Expert-kernel stack** (board-grade, siloed) |
|---|---|---|
| Path | `src/lib/deliverables/orchestrator/**` | `src/lib/programs/expert-kernel/exports/board-grade/**` |
| Output | Prose DOCX / XLSX / HTML | 16:9 native **PPTX** decks + SVG exhibits |
| Visuals | `exhibits[]` parsed then **discarded at render** | 9 SVG architecture diagrams + 13 SVG financial charts, rasterized to PNG, embedded in slides |
| Page model | Flat markdown sections | `DeckSlide` slide grammar (headline + hero exhibit + footer facts) — "one idea per slide" |
| Exhibit schema | `RenderableExhibit{ kind, description }` — prose | `artifact-visual-exhibits.ts` — **26 structured, gap-honest exhibit contracts** |
| Quality gate | Mechanical compliance (`quality-validator.ts`) | **`cxo-artifact-excellence-framework.ts`** — 9 weighted decision-quality dimensions |
| Used by First Capital arc? | **YES** | **No** |

**Implication for the transformation.** The spec reads as greenfield ("build a Visual Director,
build an Exhibit DSL, build a deck renderer"). It is not. Roughly **70% of the target capability
already exists, production-ready, deterministic, and honesty-enforced** — in the expert-kernel.
The core work is therefore **(a) make the orchestrator decision/exhibit-first, and (b) wire it to
the existing visual + scoring assets**, not invent them. This materially de-risks PR4–PR9 and
should reshape the PR plan (see §12). The expert-kernel's existing `cxo-artifact-excellence-framework`
dimensions (decisionSharpness, executiveStoryline, evidenceGrounding, financialDefensibility,
exhibitQuality, expertChallenge, actionability, governanceAuditability, editabilityReadability) are
already ~the spec's Section 13 rubric — they just don't gate the live path.

---

## 1. Generation architecture

| | |
|---|---|
| **Component** | `runDeliverableOrchestration` — `src/lib/deliverables/orchestrator/orchestrator.ts:155–252` |
| **Purpose** | Turn a governed evidence bundle + decision context into a `RenderableDeliverable`, avoiding the single-call token ceiling. |
| **Current behavior** | Decomposed map-reduce: **Architect pass** (plan sections/tables/exhibits) → **parallel section drafts** (bounded to `ABARVA_DOCGEN_SECTION_CONCURRENCY`, default 5) → **one synthesis call** (recommendation, risk table, client-to-complete) → **code assembly** → **mechanical quality gate**. Citations are repaired to placeholders pre-assembly so nothing is fabricated. |
| **Weakness** | The flow optimizes **length and coverage**, not **decision narrative**. The six-pass sequence the prompt-builder still declares (`architect, evidence_grounding, full_draft, red_team, board_grade_rewrite, render_package`, `prompt-builder.ts:296`) is **dead code** — there is no red-team or board-grade-rewrite pass actually run. Section summaries are clipped to 400 chars (`section-generation.ts:69`), so synthesis can't enforce cross-section coherence or detect contradictions. No story/page abstraction exists. |
| **Target behavior** | Evidence → **Intelligence Layer** → **Move Decision Model** → **Story Director** → **Visual Director** → **Specialist Authors** → **Editorial Layer** → **Visual QA** → Render (spec §3). Generation is orchestrated around a *governing decision and its story*, with real editorial + red-team passes (spec §12) and a coherence-enforcing synthesis. |

---

## 2. Deliverable orchestration / registry

| | |
|---|---|
| **Component** | `deliverable-registry.ts` (`DeliverableSpec`, `PHASE_CANONICAL_KEYS:466`) + `orchestrated-deliverable-map.ts` |
| **Purpose** | Define each deliverable's identity (title, phase, audience, purpose, format, required sections) and route a registry key to an orchestrator brief type. |
| **Current behavior** | A **container manifest**: `deliverableTypeKey`, `documentTitle`, `phaseLabel`, `audiencePrimary` (free text), `documentPurpose`, `formatRecommendation`, `gateArtifact`, and an ordered `sections[]` of plain-English titles. 13 deliverables across P1–P5. `orchestratorDeliverableType()` maps e.g. `solution_design → target_architecture`, `financial_model → estimate_model`. |
| **Weakness** | Sections are **generic topic titles** ("Recommendation", "Operating Model"), not a **decision blueprint**. No per-deliverable narrative strategy (answer-first vs options-first), **no mandatory-exhibit list**, no audience-separation rules, no "decision job this artifact closes." The registry says *which boxes must exist*, never *what story must be told or which visuals must carry it*. |
| **Target behavior** | Each deliverable gets a **narrative blueprint** (spec §9): an ordered **page sequence** with a `RoleInStory` per page, a **mandatory-exhibit list** per archetype (e.g. Target Architecture → architecture-on-a-page + workflow swimlane + integration map + governance overlay + tradeoff matrix), and explicit executive-vs-appendix split. |

---

## 3. Prompt assembly

| | |
|---|---|
| **Component** | `artifact-brief-registry.ts` + `briefs/deliverable-structures.ts` + `briefs/archetype-packs.ts` + `prompt-builder.ts` |
| **Purpose** | Compose the system/architect/section prompts sent to Claude, including governance rules, evidence, structure, expected exhibits/tables, and quality bar. |
| **Current behavior** | Strong dual-mode system prompt: **governed factual mode** (client facts only from evidence / assumption / placeholder) + **expert artifact mode** (structure/narrative unconstrained). But **only one named brief exists** (`AMS_RFP_BRIEF`, `artifact-brief-registry.ts:410`); everything else composes from generic structure × archetype packs. The per-deliverable `DeliverableStructure.sections[]` are **topic-ordered** and all end with "Recommendation & Next Actions" *last* (`deliverable-structures.ts`). |
| **Weakness** | **Backward structure** — the classic anti-pattern: findings → implications → decision-last, when board-grade is answer-first. Exhibits are passed to Claude only as **title strings** ("EXPECTED EXHIBITS: …", `prompt-builder.ts:106`); the section output schema (`{key,title,bodyMarkdown,citationsUsed}`) has **no exhibit/diagram field**, so "exhibits" come back as prose tables inside `bodyMarkdown`. `audience` is recorded but never shapes the brief. |
| **Target behavior** | A **Story Director** produces an answer-first page plan (governing question → recommendation → evidence → tradeoffs → decision) with conclusion-style page headlines (spec §6). A **Visual Director** emits **structured exhibit specs** (not prose) the renderer draws (spec §7–8). Briefs become audience-aware. |

---

## 4. Evidence retrieval

| | |
|---|---|
| **Component** | `tenant-context-retriever.ts` (Azure AI Search `tenant-context-v1`) + `build-request.ts` (`buildMoveDeliverableRequest`) |
| **Purpose** | Retrieve tenant-scoped governed context and bind recorded Move facts into a cited `GovernedEvidenceItem[]`. |
| **Current behavior** | Tenant-pinned multi-pass search (record-ID lookups, structured anchor queries, BM25) returning `TenantContextChunk[]`; recorded Move facts (sponsor, metrics, evidence items) bound as numbered citations; missing fields become `MissingEvidenceItem`. Index-drift resilient (degrades past missing `lifecycle_state`). |
| **Weakness** | **Passive search, not decision-driven assembly.** Each deliverable independently retrieves and **reinterprets** evidence — there is **no shared engagement-level decision model**. Retrieval doesn't know *which decision* it's serving, so there's no check that the evidence chain is coherent across P1→P4, and no "these 3 facts underpin the recommendation" decision-basis object. |
| **Target behavior** | A single **MoveDecisionModel** (spec §4) — governing decision, answer-first recommendation, claims, supporting + **contradictory** evidence, risks, dependencies, open questions, architecture/operating/value models, required decisions — built once and **consumed** by every deliverable as the single source of truth. Deliverables never reinterpret evidence independently. |

---

## 5. Section generation

| | |
|---|---|
| **Component** | `section-generation.ts` (per-section drafting under the Architect plan) |
| **Purpose** | Draft each planned section in parallel from its assigned evidence slice, with citation repair. |
| **Current behavior** | One Claude call per planned section; output `{key,title,bodyMarkdown,groundingMode,citationsUsed}`; uncited client numbers deterministically rewritten to `[CLIENT TO COMPLETE]`/`[ASSUMPTION TO VALIDATE]`. Coherence input to synthesis is a 400-char clip per section. |
| **Weakness** | Sections are authored **in isolation as prose**, with no notion of which other sections they depend on or flow into, and **no exhibit emission** (the schema can't carry a diagram spec). Parallelism scales words but not argument; there is no specialist-author differentiation (a CFO-grade financial section vs a CTO-grade architecture section are the same call shape). |
| **Target behavior** | **Specialist Authors** (spec §3) write to a page's `RoleInStory` and its assigned exhibit spec, producing *one message + supporting facts + implication + decision relevance* per executive page (spec §11), with technical depth pushed to a separate appendix track. |

---

## 6. Document assembly (data model)

| | |
|---|---|
| **Component** | `RenderableDeliverable` + `RenderableSection`/`RenderableTable`/`RenderableExhibit` — `types.ts:305–343` |
| **Purpose** | The structured object the renderers consume. |
| **Current behavior** | `RenderableDeliverable = { sections[], tables[], exhibits[], sourceRegister, recommendation, nextActions, clientCompleteChecklist }`. Unit of content = **prose markdown section**. `RenderableExhibit = { key, title, kind, description, targetFormat }` — `description` is freeform prose. |
| **Weakness** | **`exhibits[]` is structurally dead**: it is set to `[]` in assembly (`section-generation.ts:126`) and, even if populated, has **no fields for nodes/edges/layers/cells** and is **ignored by every renderer**. There is **no `Page`/`Slide` object, no `Decision` object, no structured exhibit** — the model literally cannot represent an exhibit-led, one-message-per-page deck. |
| **Target behavior** | First-class `StoryPage` (headline, RoleInStory, exhibitType, supportingEvidence, implication, decisionRelevance — spec §5) and a structured **Exhibit DSL** (`ArchitectureExhibit{ type, layers, nodes, edges, controls, callouts, decisions, evidence }` — spec §8). Exhibits and decisions become data, not prose. |

---

## 7. Rendering

| | |
|---|---|
| **Component** | `orchestrator/renderers.ts` (live) **vs** `expert-kernel/exports/board-grade/*` (siloed) |
| **Purpose** | Turn the assembled deliverable into downloadable files. |
| **Current behavior (live)** | `renderers.ts` produces **DOCX** (markdown→docx blocks, light tables), an **XLSX** companion for `targetFormat:'xlsx'` tables, and a self-contained **HTML** preview. **No PPTX, no PDF, no SVG.** It **ignores `exhibits[]` entirely** — visuals evaporate. `render-engine.ts` adds a shallow 0–10 consistency score. |
| **Current behavior (siloed)** | `svg-architecture.ts` (9 deterministic, gap-honest diagram types: context, layered flow, integration map, build/buy lanes, human/agent accountability, control overlay, risk heatmap, decision queue), `svg-charts.ts` (13 chart types: waterfall, cost stack, value bridge, tornado, payback curve, roadmap swimlane, heatmap, …), `svg-raster.ts` (SVG→PNG via resvg, no system deps), `pptx-renderer.ts` (native-text 16:9 hybrid deck), `deck-shell.ts` (`DeckSlide` "one idea per slide" grammar). All **pure, deterministic, honesty-enforced** (e.g. blocked payback renders "not computable," never a fake crossing). |
| **Weakness** | The capability the spec demands **exists but is unreachable from the live path.** The orchestrator is document-only; the deck/exhibit engine is wired only to the expert-kernel dossier, not to `RenderableDeliverable`. |
| **Target behavior** | **Executive Deck (16:9) as primary output**, technical content in a document appendix (spec §10–11). Reached by mapping each `RenderableExhibit`→the existing svg-* function, rasterizing, and emitting via the existing PPTX/deck-shell pattern — **reuse, don't rebuild.** |

---

## 8. Quality scoring

| | |
|---|---|
| **Component** | `quality-validator.ts` (gates live path) + `artifact-excellence/cxo-artifact-excellence-framework.ts` (exists, not wired to live gate) + `render-engine.ts` 0–10 score |
| **Purpose** | Decide whether a deliverable may be promoted/exported. |
| **Current behavior** | The live gate is **mechanical compliance**: leaked internal tags, **unsupported client-fact claims**, min sections (5), min body words (600), source register present, decision/recommendation/risk-table present, truncation, raw-slug name. Exhibit/narrative checks exist only as **advisory warnings**. The richer **9-dimension CXO excellence framework** computes decisionSharpness/executiveStoryline/exhibitQuality/etc. — but those are largely **structural proxies** (e.g. `executiveStoryline = 100 − missingSections×7`) and **do not gate the orchestrator**. |
| **Weakness** | The gate **rewards presence, not usefulness.** A document with **zero exhibits** scores the same as one with ten, as long as sections/words/citations exist. Nothing measures answer-first structure, tradeoff clarity, audience separation, or whether a visual carries its page's headline. This is why the First Capital arc passed the gate yet isn't partner-ready. |
| **Target behavior** | Consulting-quality scoring (spec §13): Executive Story 25 / Visual Communication 20 / Architecture Rigor 20 / Decision Clarity 15 / Evidence 10 / Business Relevance 10 — plus **hard-fail conditions** (spec §14: no architecture visual, no alternatives, no tradeoff analysis, no decision page, topic-based titles, mixed audiences, exhibit doesn't support its headline). Promote the existing CXO framework into the real gate and add exhibit/narrative measurement. |

---

## 9. Approval logic

| | |
|---|---|
| **Component** | `approval.ts` + `app/api/programs/phase-gate/route.ts` + `intelligence-promotion-approval.ts` |
| **Purpose** | Approve P0 briefs and advance Moves across phase gates. |
| **Current behavior** | Role-based (`canApproveGates`, optional strict admin/maestro mode) + per-transition **preconditions** (P1→P2 needs sponsor commitment + stakeholder success + program tension + data-readiness; human rationale ≥24 chars; durable `program_audit_log`). On approval, lifecycle→approved and `current_phase` advances. |
| **Weakness** | Approval is **administrative, not quality-linked.** It checks that *inputs* exist (a sponsor was named, data is ready), never that the *artifact* meets a deliverable excellence bar. A thin, exhibit-free, topic-ordered deliverable can be promoted if preconditions are met — there is **no edge between quality scoring and promotion**. |
| **Target behavior** | Promotion blocked unless the deliverable clears the consulting-quality score **and** has zero hard-fail conditions (spec §14), with the score + failed dimensions recorded in the audit packet. The "why below gate / regenerate" UX (already shipped in #3692) becomes the human surface for this. |

---

## 10. Root-cause synthesis (validating spec §2)

The spec's 14 listed failures are **confirmed and reduce to three missing first-class architectures**, plus one structural accident:

1. **No Narrative Architecture.** Structures are topic-ordered with decision-last; page headlines are topics, not conclusions; there is no story/page object. (spec failures 1,2,9,11,12)
2. **No Exhibit Architecture.** Exhibits are prose; `RenderableExhibit.description` is freeform; `exhibits[]` is empty and discarded; architecture is rendered as text. (spec failures 4,5,10,13)
3. **No Executive-Communication Architecture.** One artifact serves all audiences; `audience` is recorded but unused; no executive/appendix split; quality rewards completeness not usefulness. (spec failures 6,14)
4. **Structural accident.** The capability to fix #2/#3 **already exists** in the expert-kernel but was never wired to the orchestrator — so the live path regressed to prose. This is the cheapest lever.

The primary problem is **not model quality** (the prose is fluent and governance-clean). It is the absence of these architectures as first-class repository objects — exactly the spec's thesis.

---

## 11. Current → Target architecture map (spec §3)

| Spec target stage | Exists today? | Where it lands |
|---|---|---|
| Intelligence Layer | ✗ (per-deliverable retrieval) | New — wrap `tenant-context-retriever` + `build-request` into an engagement-level builder |
| **Move Decision Model** | ✗ | New shared object (spec §4) — the single source of truth |
| **Story Director** | ✗ | New — replaces topic-ordered `DeliverableStructure` with answer-first `StoryPage[]` |
| **Visual Director** | ⚠ partial | New planner, but emits specs for **existing** svg-architecture / svg-charts |
| Exhibit DSL + SVG library | ✅ ~exists | `artifact-visual-exhibits.ts` (26 types) + `svg-architecture.ts` + `svg-charts.ts` — adopt/extend |
| Specialist Authors | ⚠ partial | `section-generation.ts` exists; make it page/role/exhibit-aware |
| Editorial Layer | ✗ | New — 4 passes (spec §12); the dead `red_team`/`board_grade_rewrite` passes are the seed |
| Visual QA + Quality Gate | ⚠ partial | Promote `cxo-artifact-excellence-framework` into the gate (spec §13–14) |
| Executive Deck Renderer | ✅ ~exists | `pptx-renderer.ts` + `deck-shell.ts` + `svg-raster.ts` — wire to `RenderableDeliverable` |
| Golden Benchmark suite | ✗ | New (spec §15) — only hygiene/golden-Q tests exist today |

---

## 12. Implications for the PR plan (spec §16)

The spec's 10-PR plan is sound but should be **re-sequenced to exploit what exists**, front-loading the highest-leverage, lowest-cost wins:

- **PR1 — Move Decision Model** (spec PR2). The keystone single-source-of-truth; everything consumes it. Do first.
- **PR2 — Story DSL + Story Director** (spec PR3). `StoryPage`/`Decision`/answer-first blueprints; convert the 8 archetypes in §9 from topic-lists to page-sequences. Pure data + one service.
- **PR3 — Exhibit DSL + adopt existing SVG library** (spec PR5+PR6 collapsed). Define the exhibit contracts (extend `artifact-visual-exhibits.ts`); **reuse `svg-architecture.ts`/`svg-charts.ts`/`svg-raster.ts`** rather than rebuild. Biggest scope reduction vs the spec's assumption.
- **PR4 — Visual Director** (spec PR4). Planner that maps decision/page → exhibit spec.
- **PR5 — wire exhibits + deck into the orchestrator renderer** (spec PR7). Populate `RenderableDeliverable.exhibits[]` for real; emit via the existing PPTX/deck-shell; keep DOCX as the appendix companion. This alone kills the "visuals evaporate" defect.
- **PR6 — Editorial Layer** (spec PR8): revive/replace the dead red-team + board-grade-rewrite passes as 4 real editorial passes.
- **PR7 — Quality gate v2** (spec PR9): promote the CXO 9-dimension framework into the live gate + hard-fail conditions; **link it to promotion** (§9 gap).
- **PR8 — Golden Benchmark suite** (spec PR10): exemplars + comparison evals so quality can't drift.
- **PR0 (this) — Current State Assessment**: done.

PR1 (registry identity preservation) from the spec is largely satisfied — identity already lives in `deliverable-registry.ts`; the work is *enriching* specs with blueprints (folded into PR2), not preserving them.

---

## 13. Definition of success (spec §18) — restated as the acceptance bar

A deliverable passes only if a Fortune-100 CXO can consume the **first 10 pages** and confidently
decide. Concretely (spec §17): recommendation visible within 2 pages; every page has a narrative
purpose and a conclusion headline; visuals carry the argument; tradeoffs and alternatives explicit;
the decision requested is explicit; technical depth is in the appendix. Each artifact must answer:
**What is happening? Why does it matter? What should we do? What are the tradeoffs? What decision is
required?** If any answer is missing, it fails — regardless of length or citation count.

---

## 14. Recommendation & next step (PAUSE per spec §1)

This assessment is complete; **implementation is paused pending review.** The recommended first
build is **PR1 — the Move Decision Model**, because every downstream stage (Story Director, Visual
Director, authors, gate) consumes it, and because it converts evidence retrieval from passive search
into decision-driven assembly — the root of failures 11/12. The largest *cost saving* vs the spec is
**adopting the expert-kernel visual + scoring assets instead of building them**, which should be
validated before PR sequencing is locked.

Open decisions for the reviewer: (a) confirm PPTX-deck-primary / DOCX-appendix as the output
contract; (b) confirm reuse (vs fork) of the expert-kernel `svg-*` + CXO framework; (c) confirm the
8 archetype blueprints in spec §9 as the authoritative page sequences.
</content>
</invoke>
