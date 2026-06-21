# AbarVa Deliverable Quality Transformation — Authoritative Build Sequence

**Status:** design locked, build not started · **Date:** 2026-06-21
**Source of truth:** `~/Downloads/AbarVa_Deliverable_Quality_Transformation_Prompt_Instructions.docx`
+ master table + 3 golden samples (`AbarVa_Deliverables_Master_Table_and_Two_Reference_Samples.zip`)
**Supersedes / absorbs:** `DELIVERABLE_GENERATION_RESOLUTION_SPEC.md` and reframes the
`moves_decision_storytelling` flag.

---

## 0. North star (the corrected emphasis)

> Evidence stays underneath. Judgment goes on top. Visuals carry the story. Appendices hold the proof.

The bar is **"as good as an expert McKinsey consultant produced it"** — would a partner put it in
front of a F100 CEO and CIO without rewriting.

**This is NOT a word-count or section-count exercise.** A deliverable is exactly as long as the
client-specific judgment requires — and not one paragraph of machinery longer. The levers are:

1. **Voice — write like a senior partner.** Lead with judgment and the decision asked, not method.
2. **Hide the machinery.** Phase labels (P1–P5), "evidence/source register," "authorized/not
   authorized," "substrate/context rows/tower rows," governance disclaimers, scattered
   `[CLIENT TO COMPLETE]` placeholders — all leave the client narrative. Relocated, not deleted.
3. **Four-layer separation.** Client narrative · visual/decision exhibits · working appendix ·
   evidence/source traceability. Today all four are mashed into one prose stream.
4. **The "so what" test, per paragraph.** Every paragraph answers: *so what for THIS client and THIS
   decision?* A paragraph that reads identically for any client is filler — cut it, however well-cited.
5. **Rigor and honesty kept.** No fabricated numbers (state the implication once). No "Business Case"
   without finance-grade inputs (downgrade to Readiness Memo). One Open Inputs Required table.

## 0a. Enforcement architecture — the governed deliverable pipeline (no bypass)

This is a **platform capability**. The correction is not only "no direct SDK clients" — it is
**no bypass path for any client-facing artifact**. Every deliverable for every tenant passes through
the SAME governed pipeline, in this order:

1. **Tenant context broker** — assemble the tenant's own governed context (AgentContextBroker).
2. **Artifact profile registry** — resolve the `DeliverableProfile` (the universal contract).
3. **Governed generation pass** — structured generation with an **injected model adapter** routed
   through egress governance (tenant policy + preflight + audit). Never a direct client.
4. **Required exhibit generation** — produce the profile's mandatory exhibits (architecture diagrams,
   data flows, patterns, tables) — not optional.
5. **Client deliverable quality gate** — the **Deliverable Quality Contract** (§0b), blocking.
6. **Renderer selection by profile** — pick the renderer from `profile.renderer`/`defaultFormat`.
7. **Persist deliverable** — only as `client_ready` if the gate passed; otherwise `internal_draft`.
8. **Audit / source trace / appendix** — traceability to appendix or audit metadata, never the body.

Two **separate** governance capabilities sit in this pipeline: **egress governance** (stage 3 — is
the model call allowed/audited) and the **Deliverable Quality Contract** (stage 5 — is the *output*
client-ready). They are independent and both mandatory.

**One pipeline, all tenants.** SkyHarbor, First Capital, Morgan Street, PHS, Delta, and every future
tenant flow through this exact path. SkyHarbor IROPS is only a *context proof point*, never a
special-case flow. Client specificity = tenant context + config + flags, never forked code.

**No-bandages rule:** no scripts, no direct SDK calls, no per-client branches, no tenant-specific
forks. Every capability lands in the shared pipeline — governed, gated, tenant-agnostic.

## 0b. The Deliverable Quality Contract (first-class capability)

`assessClientDeliverable` is not a validation guard — it is the **blocking quality gate before
persistence**. A deliverable that fails is **not persisted as client-ready**; it may be saved only as
an `internal_draft` with failure reasons.

**Result states:** `client_ready` · `internal_draft` · `blocked_missing_inputs` ·
`blocked_missing_exhibits` · `blocked_quality` · `blocked_governance`.

**Not word-count.** Depth is allowed when the artifact requires it. The control is **reader energy +
artifact purpose**: every section must earn its place by helping the reader *decide, compare, govern,
price, transition, or measure value*. Long is fine when purposeful (RFP, pricing, evaluation,
transition, value artifacts); long-because-repetitive/mechanical/machinery-exposing is rejected.

The gate evaluates the artifact **against its profile** across these dimensions:

- **Audience fit** — executive, sponsor, architect, procurement, finance, delivery, risk,
  vendor-facing, or internal.
- **Artifact intent** — decision memo, diagnostic, architecture brief, RFP, pricing workbook,
  evaluation scorecard, transition plan, value ledger, etc.
- **Format fit** — DOCX / HTML / PPT / XLSX / appendix / source register.
- **Human-consultant voice** — judgment-first, synthesized, specific, not template-like.
- **Decision clarity** — what decision is requested, what is known, what is uncertain, what's next.
- **Evidence discipline** — evidence supports the narrative, doesn't dominate it.
- **Evidence placement** — source registers/traceability in appendix or audit metadata unless the
  artifact is explicitly an evidence binder.
- **Missing-input handling** — one consolidated "Open Inputs Required" / "Validation Required"
  section; no repeated placeholders.
- **Exhibit enforcement** — required exhibits must actually render (architecture ⇒ diagrams/data
  flows/patterns are mandatory).
- **Non-mechanical writing** — reject repeated phase labels, excessive numbering, legalistic
  disclaimers, and system language (`evidence`, `source register`, `substrate`, `context rows`,
  `not authorized`) in the main narrative.
- **Client specificity** — tenant-specific context and business language, not generic prose.
- **So-what quality** — every major table/exhibit has an interpretation tied to the client decision.

**Profile registry fields:** `artifactId`, `audience`, `decisionPurpose`, `defaultFormat`,
`clientFacing`, `evidenceMode`, `appendixMode`, `requiredExhibits`, `requiredTables`, `renderer`,
`qualityRubric`, `bannedMainBodyLanguage`, `missingInputPolicy`, `sourceTracePolicy`, `allowedDepth`,
`examples`, `failureModes`.

**Source artifacts are profiled distinctly:** strategy memo (partner sourcing thesis), value target
brief (internal), scope memo, RFP package (vendor-facing, allowed to be long), response checklist,
evaluation scorecard (evidence-cited), pricing workbook (finance), pricing trap log, BAFO question
pack, Atlas decision brief (executive), Sentinel risk attestation, selection memo, transition plan,
value ledger.

## 1. Format tiering — the right surface for the story

Same governed generation, three surfaces:

| Surface | Role | When it leads |
|---|---|---|
| **PPTX** | The **board decision artifact**, **Claude-authored** (AI synthesis, not a deterministic template) — storyline-led, one governing message per slide, decision by slide 2 | Executive Handoff, Diagnostic Readout, Roadmap |
| **HTML** | The **premium visual exhibit layer** — superior-quality architecture, data/information flows, physical cloud, agentic overlay | Target/Current Architecture, Solution Design |
| **DOCX** | The **durable reference** (board-final or appendix) + the long **internal working binder** | Charter, Operating Model, Sourcing, Value Measurement; binders |

HTML exhibits **export into the PPT** as slides and **attach to the DOCX** as the technical record.
The board sees the PPT; architects live in the HTML; the record is the DOCX.

## 2. The exhibit catalogue (visuals carry the story)

Reuse where engines exist (`svg-architecture` 9 types, `svg-charts` 13 types); the headline NET-NEW
craft pieces are the physical architecture exhibits.

**Architecture family — the highest-craft, highest-value build.**

> **Cloud/services are NEVER predetermined.** The physical architecture is an *output* of whatever was
> solutioned for that specific engagement. The synthesis layer emits a typed, per-engagement
> **ArchitectureModel** (current-state + target-state: layers, chosen services/platforms, patterns,
> agentic components, data flows); the renderer is **cloud-agnostic** and simply draws the model.
> First Capital shows AWS/Databricks because the solution reasoned it — not because of a build-time
> flag. A different client → a different solution → different services on the page.

- **Current-State Physical Architecture (as-is) — HTML.** What is actually there today: infrastructure,
  data stores, applications, and the **data & information flows** between them. Grounded on First
  Capital's real estate (FIS IST/Profile mainframe core, TSYS cards, NICE Actimize + Feedzai, partial
  lakehouse). Shows the mainframe-bound, fragmented today honestly.
- **Target-State Physical Architecture (to-be) — HTML.** All layers (experience → agentic orchestration
  → application/services → data & ML platform → integration → core systems → cloud infra) with the
  **actual named cloud services** (Azure OpenAI/AI Foundry, AKS, AI Search, Cosmos, Databricks, Service
  Bus, API Management, Purview, Key Vault, Sentinel — or GCP/AWS equivalents), layered onto the real
  core systems, not a generic reference diagram.
- **Agentic "come-alive" overlay.** Where agents sit, what tools/systems each calls, orchestration and
  routing, retrieval/grounding, guardrail and model-risk checkpoints, human-in-the-loop approval gates
  — the living workflow moving through the stack.
- **End-to-end data flow**, rendered **distinct from the AI decision/control flow** (two different
  stories; the spec mandates separation).
- **Pattern callouts** (RAG, tool-use, multi-agent orchestration, event-driven, human-in-the-loop) —
  named, placed, each with a one-line business implication.

**Decision/economics family (reuse + finish adapters):** issue tree, root-cause tree, value tree,
heatmap, RACI/decision-rights, operating cadence, roadmap lanes (30/60/90 + workstreams), options
matrix, decision matrix, risk/mitigation matrix.

## 3. Target system architecture (7 components)

| # | Component | Status |
|---|---|---|
| 1 | **DeliverableProfile registry** — typed contract per artifact (audience, decision, format(s), tone, evidence mode, required exhibits, banned terms, acceptance checks, business-case mode logic). **No `maxWords` throttle** — governed by machinery + "so what" gates, not length | Net-new |
| 2 | **Synthesis layer** — partner judgment before rendering; decision-first narrative structure | ~Exists (`MoveDecisionModel` + Story Director), unwired |
| 3 | **Exhibit system** — §2 catalogue; HTML-first, exportable to PPT, embeddable in DOCX | Partial: engines exist; physical-arch + agentic overlay net-new |
| 4 | **Renderers** — DOCX (reference/binder), PPTX (board storyline), HTML (premium exhibits) | Engines exist (`pptx-renderer`, `deck-renderer`), unwired; HTML arch report net-new |
| 5 | **Evidence-mode relocation** — source register/citations → appendix/caption/speaker-notes per profile; one Open Inputs table; zero in-body machinery | Net-new behavior |
| 6 | **QA gates v2** — machinery/banned-term gate, "so what" filler gate, placeholder-consolidation, fake-number → mode-downgrade, visual-completeness, evidence-placement. Anti-fabrication kept | Partial (validator exists, mechanical) |
| 7 | **Golden sample library + regression** — seed with the 3 shipped samples; charter golden; generated-vs-golden tests | Net-new |

## 4. Build sequence (verticals — each proves one complete loop against a golden sample)

**W0 · Foundation contracts (inert).** DeliverableProfile registry for all 11 artifacts + de-machinery
banned-term lexicon + four-layer output contract. Nothing renders differently yet.

**W1 · DOCX vertical — Charter (proof of judgment-led + machinery-hidden).** Wire synthesis
(MoveDecisionModel/Story → decision-first charter) + evidence-mode relocation + single Open Inputs table
+ machinery/"so what" gates. **Proof:** generated First Capital charter reads like the human-consultant
charter golden standard — partner voice, no P-labels, no in-body register, one inputs table.

**W2 · HTML architecture vertical — the headline craft piece.** Build the HTML architecture report
renderer + the net-new physical-architecture exhibits: **Current State (as-is)** AND **Target State
(named services, all layers, patterns, agentic overlay)** + end-to-end data flow distinct from AI
control flow. **Proof:** First Capital Target + Current Architecture HTML, grounded on
FIS/TSYS/Actimize/Databricks, against the HTML reference sample — partner-grade, 5+ exhibits, no overflow.

**W3 · PPT vertical — Executive Handoff + Diagnostic Readout.** Wire the PPTX storyline renderer (reuse
`pptx-renderer`): board decision deck, one message/slide, decision by slide 2, W2 exhibits exported as
slides, evidence in speaker notes. **Proof:** against the golden PPT expectations + the 822-word
Diagnostic Readout sample's voice.

**W4 · Remaining profiles + binder tier.** Roll the loop across Root-Cause (issue-tree), Solution Design
(swimlanes), Operating Model (RACI), Sourcing (options paper), **Business Case (mode-downgrade →
Readiness Memo / Investment Thesis / Full)**, Execution Roadmap, Value Measurement (table-first). Add the
internal **working-binder** tier for the long evidence version (where the 32k-token ceiling now serves).

**W5 · Gates v2 + golden library + regression.** Full QA gate suite; complete golden library; regression
across all 11 against First Capital AI Trade Finance.

## 5. Acceptance (the partner bar)

- A first-time executive understands the recommendation in under 3 minutes.
- No client-facing artifact reads like an evidence binder or repeats missing inputs.
- No fabricated value/ROI/NPV/payback/baseline; Business Case auto-downgrades when finance-grade data is absent.
- Architecture is **visual-first**: current-state as-is, target-state, named-service physical cloud,
  agentic overlay, data flow distinct from AI control flow, control points, implementation waves.
- Executive readouts are **PPT-first, storyline-led, decision-oriented**.
- Traceability preserved — but underneath, never dominating the narrative.
- Every deliverable has a golden sample and automated checks.

## 6. Decisions

**Locked (all resolved 2026-06-21):**
- Machinery-hidden + synthesis-led (not length); anti-fabrication kept.
- Format tiering: PPT board / HTML exhibits / DOCX reference+binder.
- **Board-final = PPTX, Claude-authored** (AI synthesis, not a deterministic template).
- **Cloud/services are synthesis-derived per engagement, never predetermined** — the renderer draws a
  typed per-engagement ArchitectureModel; no build-time cloud flag.
- Physical-architecture-with-agentic (current + target) is a first-class W2 vertical.
- Business-case mode-downgrade replaces hard gate-block.
- **Golden-sample depth:** the 4 highest-stakes first (Charter, Target Architecture, Diagnostic Readout,
  Executive Handoff), then backfill the remaining 7.

**Open:** none — ready to start W0.
