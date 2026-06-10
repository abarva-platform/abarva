# Source Module — End-to-End Audit (2026-06-09)

**Author:** Master Source Thought-Leadership Agent (senior sourcing-transformation partner lens)
**Branch:** `source-thought-leadership` off `origin/main` @ `b7abce328`
**Method:** 3 parallel read-only audit agents (front-end/data/flow · reasoning/context path · Move-framework precedent), synthesized.

> **Verdict in one line:** Source today is a **well-built RFP/deliverable workbench with a strong universal 11-stage spine — but it is ~95% generic and ~5% parameterized, and its reasoning bypasses the governance/grounding spine.** To become a sourcing *decision operating system*, it needs (1) a true **Source Event Archetype Framework** (mirroring the merged Move Archetype Framework #3371), and (2) its reasoning rewired through the **governed context bundle + GroundedAnswer contract**.

---

## 1. Architecture map

| Layer | What exists | Files |
|------|-------------|-------|
| Routes (UI) | 23 pages: `/source/new` (originate), `/source/events/[id]` (canvas), portfolio, queue (Decisions), value, patterns, learn, renewal cockpit, setup, compare | `src/app/(maestro)/source/**` |
| API | 27 routes: event CRUD + approval workflow; artifact generate/upload/render (md/html/pdf/docx/xlsx + comparison-xlsx); evidence-requests; gate-criteria state; stage advance; communications draft; cxo-report; deal-pack; nexus/ask; vendor-submission(s) | `src/app/api/v1/source/**`, `src/app/api/source/synthesis` |
| Canvas/stage views | 11 stage views (Strategy→Scope→RFP→Responses→Evaluation→Pricing→BAFO→Decision→Selection→Transition→Value) + workspace tabs (Document/Gate/Evidence/Log) + ~30 specialized panels | `src/components/source/canvas/**` |
| Reasoning | `source-answer-engine.ts`, `context-builder.ts`, `sentinel-source-orchestrator.ts` (deterministic multi-agent briefing), optional `sentinel-chat-llm.ts` | `src/lib/source/**` |
| Corpus | 150+ sourcing seed patterns: failure modes, artifact templates, 14 vendor profiles, pricing, contracts, regulatory, commercial levers, RFP/eval, benchmarking | `src/lib/intelligence/seed-patterns-sourcing*.ts` |
| Canonical specs | 33 artifact specs, evidence requirements (7-state ramp), gate criteria | `src/lib/source/canonical-specs/**` |
| Data | `source_events`, `source_artifacts`(+chunks/+facts), canvas substrate (`source_event_artifact_states`, `..._gate_criterion_states`, `..._evidence_states`), `source_pricing_components`, `source_event_pricing_submissions` | `supabase/migrations/**` |

**Assessment:** the *surface area* is impressive and the *spine* is sound. The deficiency is **depth of differentiation and governance**, not breadth of UI.

## 2. Current workflow map (the universal spine — already present)

`Originate → (archetype/rigor/value at intake) → Strategy → Scope → RFP → Responses → Evaluation → Pricing → BAFO → Executive Decision → Selection → Transition → Value`.

- ✅ All 14 spine concepts from the brief are represented across the 11 stages + intake.
- ✅ Gate-defining artifacts per stage; stage advance is gate-validated.
- ❌ **The spine does not branch by event type.** AMS, ERP/SI, SaaS, renewal all walk the identical stage sequence with the identical artifact catalog. Differentiation is limited to: which archetype default Sentinel reads when drafting, and which artifacts `rigor` makes required.

## 3. Current data model map

- `source_events.event_type` holds the archetype string (`cloud|ams|data_platform|enterprise_software|custom_build|managed_service|software|staffing|infrastructure`) — **but there is no `SourceEventArchetype` object** governing required evidence/methods/RFP-structure/pricing/negotiation per type. The event_type is a label, not a contract.
- Evidence is tracked per-event in `source_event_evidence_states` (7-state ramp: not_requested→loaded→parsed→available→usable_evidence→stale/low_confidence) — **but the required-evidence list is generic per stage, not per archetype.**
- `source_artifacts` has rich provenance (parse/embedding/graph/classification status, evidence_state, approval_state, sha256, version chains) — good substrate, under-governed at reasoning time.

## 4. Current UI map

Strong, dense, stage-anchored canvas (`UniversalCanvasShell`) with Document/Gate/Evidence/Log tabs and a Sentinel decision-lens dock. Readiness panels exist (`SourceDataReadinessPanel`, `SourceRfpReadinessPanel`, `SourceVendorResponseCompletenessPanel`). **Gap:** readiness is generic; it cannot say *"for an AMS event you are missing ticket volumes, SLA baseline, retained-org model"* vs *"for an ERP/SI event you are missing process inventory, integration landscape, cutover expectations."*

## 5. Current agent / reasoning path

```
buildSourceContextFromSeed → SourceAgentContextBundle (deterministic + liveTenantContext)
  → buildSentinelSourceBriefing (deterministic multi-agent compose; word-capped; voice-checked)
  → [optional] sentinel-chat-llm (Claude, egress-preflighted)
  → buildSourceAnswerEngine (answer + citations + confidence + missingData)
```

**Control gaps (P0):**
- ❌ **No governance seam.** Zero calls to `evaluateGovernedObject` / `buildValidatedAgentContextBundle`. Evidence is ranked by segment affinity, **not** by `agent_readiness_status` / `retrievability` / `cited_render_verified_at`. A `not_reviewed` chunk is cited identically to an `agent_ready` one.
- ❌ **Live tenant evidence confidence is hardcoded `'high'`** (`context-builder.ts toLiveTenantEvidenceContext`).
- ❌ **LLM path receives the same un-governed bundle** (egress preflight only).
- ❌ **No agent-trace spine** (`src/lib/agent-trace`) — no reasoning lineage / included-vs-excluded record.
- ✅ Tenant isolation holds at the seed/deterministic layer; live context carries `brokerTenantKey`.
- ✅ Citations + confidence + missing-data warnings *are* emitted (good bones — just not governance-gated).

## 6. Current deliverables inventory

33 canonical artifacts across 11 stages (d01…d33), all renderable to md/html/pdf/docx/xlsx. **Every artifact is generic within its stage** — there is one `d09_rfp_pack` template, not an AMS RFP vs an ERP/SI RFP vs an AI-platform RFP. The brief's "best-in-class, event-specific RFP" does not yet exist.

## 7. Gaps by event archetype

| # | Archetype | Distinct evidence? | Distinct RFP? | Distinct pricing? | Distinct negotiation? | Status |
|---|-----------|:---:|:---:|:---:|:---:|--------|
| 1 | IT outsourcing / AMS / managed services | ✖ | ✖ | ✖ | ✖ | label-only |
| 2 | Application modernization partner | ✖ | ✖ | ✖ | ✖ | label-only |
| 3 | Cloud migration / infra | ~ defaults | ✖ | ~ traps | ✖ | partial |
| 4 | ERP / Workday / SAP / Oracle SI | ✖ | ✖ | ✖ | ✖ | label-only |
| 5 | Data / analytics / AI platform | ~ defaults | ✖ | ✖ | ✖ | partial |
| 6 | GenAI / agentic AI platform | ✖ | ✖ | ✖ | ✖ | absent |
| 7 | Cybersecurity services | ✖ | ✖ | ✖ | ✖ | absent |
| 8 | SaaS platform selection | ~ defaults | ✖ | ✖ | ✖ | partial |
| 9 | BPO / operations outsourcing | ✖ | ✖ | ✖ | ✖ | absent |
| 10 | Vendor consolidation | ✖ | ✖ | ✖ | ✖ | absent |
| 11 | Contract renewal / renegotiation | ~ renewal cockpit UI | ✖ (n/a) | ✖ | ✖ | partial |
| 12 | Staff augmentation / capacity | ✖ | ✖ | ✖ | ✖ | absent |

**None** of the 12 has an archetype contract that drives required evidence + RFP structure + pricing model + negotiation levers + gate criteria. This is the central gap.

## 8. Gaps by sourcing phase

- **Classify (2):** archetype captured at intake but is a free label, not a contract; no estate-aware re-resolution.
- **Intake/readiness (3):** generic required-evidence; cannot enumerate event-type-specific missing evidence or say "we can draft, but section X is weak because Y is missing."
- **RFP design (6):** one generic RFP; not differentiated; can be marked complete without event-type-required sections.
- **Pricing (10):** generic TCO workbook; no per-archetype pricing model (e.g., AMS resource-unit/ticket-band vs ERP fixed-price+T&M vs SaaS per-seat/consumption).
- **Negotiation (11):** levers are corpus patterns, not archetype-bound, vendor-specific guidance.
- **Reasoning across all:** no governed bundle, no GroundedAnswer envelope.

## 9. Risks / weak spots

1. **Governance bypass (P0, control risk):** un-gated evidence + hardcoded confidence + no trace ⇒ the agent can cite weak/unready data with false confidence. Directly contradicts the platform's own governance contract.
2. **Generic-RFP credibility risk:** a CIO/CPO running a multi-million-dollar AMS or ERP sourcing will immediately see a generic RFP as not decision-grade.
3. **Silent missing-evidence risk:** without an archetype-bound evidence model, "complete" can be asserted when event-type-critical inputs are absent.
4. **Confidence inflation:** `'high'` hardcoding is a trust-moat violation.

## 10. Recommended PR sequence (one slice per PR, mirror the Move framework)

| PR | Slice | Mirrors |
|----|-------|---------|
| S1 | `src/lib/source/archetypes/` — `SourceEventArchetype` types + registry + resolver + method-library; seed 4 archetypes (AMS, ERP/SI, AI-data-platform, renewal) | `src/lib/programs/archetypes/*` |
| S2 | Evidence-readiness model bound to archetype evidence families + the promotion-only ladder (`missing→…→agent_ready`) | `current-state-readiness.ts`, governance policy |
| S3 | Deliverable canon + event-specific **RFP structure** per archetype (start AMS/ERP-SI/AI-platform) with grounded refinement | `deliverable-refinement.ts` |
| S4 | Pricing & negotiation intelligence per archetype (pricing model + negotiation levers + should-cost/sla-gap methods) | `method-library.ts` |
| S5 | **Source context bundle + GroundedAnswer**: wire `source-answer-engine`/LLM path through governance + agent-trace; emit envelope; gate evidence by readiness | `archetype-context-bundle.ts`, `agent-trace`, `context-corpus-policy` |
| S6 | Live proof Source event (SkyHarbor AMS) on ACA: originate→classify→readiness→strategy→event-specific RFP→vendor guide→scoring→pricing/negotiation→exec recommendation; cited, missing-evidence-visible | ACA VNet-job harness |

**Do not** build new generic UI before S1–S2 land — the archetype contract must exist first so the UI renders from it.

## 11. Strengths to preserve (do not rebuild)

The 11-stage spine, the 33-artifact canvas, the 7-state evidence substrate, the 150+ sourcing patterns, multi-format rendering, the Sentinel deterministic briefing, and the renewal cockpit are **genuine assets**. The work is to **layer an archetype contract over them and govern the reasoning**, not to replace them.

---

*Next: Source Event Archetype Framework (Phase 2), Evidence Readiness (Phase 3), Deliverable/RFP canon (Phase 4), Pricing/Negotiation (Phase 5), Context-bundle proof (Phase 6), Live proof (Phase 7). War-room report: `docs/source/SOURCE_MASTER_THOUGHT_LEADERSHIP_REPORT.html`.*
