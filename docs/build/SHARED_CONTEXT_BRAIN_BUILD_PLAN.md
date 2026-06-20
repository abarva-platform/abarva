# Shared Context Brain — Build Plan

> ⚠️ **Superseded for detail by [SHARED_CONTEXT_BRAIN_MASTER_PLAN.md](./SHARED_CONTEXT_BRAIN_MASTER_PLAN.md)** — the authoritative master plan with full phase detail (W0–W5) and consolidated Codex instructions. This doc remains as the original summary; live status is in [SCB_EXECUTION_TRACKER.md](./SCB_EXECUTION_TRACKER.md).

**Status:** Draft for founder approval
**Date:** 2026-06-20
**Author:** Claude (Opus 4.8), grounded in 3-way codebase audit
**Companion:** [ADR-001 Context Substrate](../architecture/ADR001_CONTEXT_SUBSTRATE_POSTGRES_PGVECTOR.md)

---

## North star

One server-side answer engine. Every surface — Home, Intelligence, Tower, Source, Moves — sends a question through the same pipeline:

```
question → dimensional router → context bundle → expert kernel → answer plan → renderer → citations/proof
```

No browser-side answer logic. No per-page shallow agents. AbarVa answers like an expert who knows the client's private facts, the industry corpus, and the difference between _we know_, _we infer_, and _we have no proof_ — and renders prose, tables, charts, graphs, or next actions depending on the question.

The plan is **convergence, not greenfield.** The audit found ~70–80% of the hard parts already built and siloed across three engines. This plan connects them and scales the corpus depth from ~1,300 patterns (17 retrievable) to **hundreds of deep, retrievable virtual industry experts.**

---

## Branding canon (founder decision 2026-06-20)

- **Ava** — the single agent voice across all five surfaces (Home, Intelligence, Tower, Source, Moves). Derived from AbarVa. The surfaces are _focuses_ of Ava, not separate characters. This retires the fragmented per-surface names (Sentinel/Atlas/Nexus) as user-facing brands.
- **Consilium** — the brain: the reasoning engine + the faculty of ~210 named virtual industry experts (the ExpertPacks). Ava reasons over Consilium.
- **Named specialists** — model is _unified voice + named specialists_: the user talks only to Ava, but each answer surfaces the specific Consilium expert(s) that contributed, by name, in trace/audit views ("answered by the Healthcare Revenue Cycle expert"). Carried in `AgentAnswer.contributingExperts[]`.

Story: _"Ava is your AI partner; behind her stands Consilium, a faculty of 200+ industry experts."_

---

## The unit: a Virtual Industry Expert

Today "expertise" lives in `expert-kernel/domain/` as ~37 function packs across 4 industries — rich, but not addressable as experts and not wired to the answer engine. We promote it to a first-class unit: the **ExpertPack v2**. One ExpertPack = one virtual expert the router can summon.

### ExpertPack v2 schema (the depth standard)

Each pack is deep enough that a real practitioner would recognize it:

| Layer                  | Contents                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **identity**           | id · expertName · industry · function _or_ crossCuttingDomain · scopeNote                                      |
| **ontology**           | coreEntities[] · systemsOfRecord[] · keyVendors[] · dataObjects[]                                              |
| **economics**          | kpis[] each with quantified benchmark `{p25, median, p75, unit, asOf, source}` · costDrivers[] · valueLevers[] |
| **diagnostics**        | discoveryQuestions[] (what the expert asks first) · maturitySignals[] · redFlags[]                             |
| **failureModes**       | mode · leadingIndicators[] · typicalRootCause · consequence                                                    |
| **aiUseCases**         | archetype · valueHypothesis · dataDependencies[] · haircutFactors[] · maturityRequired                         |
| **referenceSolutions** | pattern · targetArchitectureRef · buildVsBuy posture                                                           |
| **sourcing**           | vendorLandscape[] · switchingCosts · renewalDynamics · negotiationLevers[]                                     |
| **evidenceRules**      | requiredEvidenceByClaimType{} · citationStandard                                                               |
| **refusalRules**       | whenToHedge[] · whenToRefuse[] · inference-vs-proof language                                                   |
| **outputRecipes**      | question-pattern → exhibit kind (chart/table/diagram) + which `svg-charts` builder                             |
| **regulatoryFrame**    | regimes[] · controls[] · complianceClaimsRequireEvidence                                                       |
| **provenance**         | authoredBy · reviewTier · confidence · freshness/asOf                                                          |

This subsumes the existing 8-layer function pack and adds the four fields the audit found missing everywhere: **quantified benchmarks, evidence rules, refusal rules, and output recipes.**

---

## Corpus scale target

The honest current number is ~1,300 authored patterns, **17 retrievable.** Target:

**Taxonomy expansion** — from 4 industries to ~15:
retail · healthcare · financial services · airline (existing) → + insurance · manufacturing · pharma/life-sciences · telecom · media/entertainment · energy & utilities · public sector · transportation & logistics · hospitality · professional services · technology/SaaS

**Expert count:**

- ~15 industries × ~12 functions (front/middle/back office) = **~180 industry×function experts**
- - ~30 cross-cutting domain experts (the 158 sourcing-category patterns cluster into ~20 sourcing experts; plus AI-governance, model-risk, cybersecurity, data-platform, cloud-FinOps, ERP, M&A-integration, etc.)
- = **~210 virtual experts**

**Pattern depth:** each expert anchors to a set of patterns (current ~1,300 reorganized + new authored). End state on the order of several thousand patterns, **all retrievable** — the count is secondary to depth + retrievability.

**Quality is gated, not assumed.** Volume comes from AI authoring, but every pack passes the existing `critic.ts` (3 adversarial lenses) + `qa-rubric.ts` (12 checks + honesty rules), benchmark-plausibility checks, and citation requirements. Pilot-critical industries get a human SME review tier on top.

---

## The shared engine architecture

| Component           | Current state                                                                           | Target                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Answer engine**   | 3 separate (Intelligence prose stream · Source typed · Tower browser regex)             | One engine; Source's typed output generalized to `AgentAnswer`                                |
| **Context bundle**  | `AgentContextBroker.assemble()` exists, typed — but `/api/intelligence/ask` bypasses it | Wire the live path through the broker; add benchmarks/gaps/persona/permitted-output-types     |
| **Router**          | 1-D (`it_productivity\|general` + 9-way model-select enum)                              | Dimensional `{domain, industry, function, vendor, outputShape}` → summons ExpertPack(s)       |
| **Output contract** | prose-only, prompted _against_ structure                                                | `AgentAnswer{prose, tables[], charts[], graphs[], citations[], gaps[], recommendedActions[]}` |
| **Grounding gate**  | observe-only, refusal disabled                                                          | Enforce per chosen doctrine (see Decisions)                                                   |
| **Renderers**       | 21 SVG charts + 10 diagrams + DOCX/PDF/XLSX/PPTX/HTML in expert-kernel; recharts unused | Reuse SVG-string generators (HTML-injected) + new typed `<DataTable>`                         |
| **Retrievability**  | 17/1,300 in manifest                                                                    | Full index over all patterns + packs; pgvector path per ADR-001                               |

---

## Six workstreams

**W0 · Contracts (Claude) — blocks everything.** Lock `ExpertPack v2` schema + `AgentAnswer` output contract. Extend `critic.ts`/`qa-rubric.ts` to validate packs. ~1 week.

**W1 · Engine spine (Claude design · Codex wire).** Dimensional router; wire `/api/intelligence/ask` through `AgentContextBroker`; emit `AgentAnswer`; implement the grounding gate per chosen doctrine. Then wire surfaces (Home → Tower server-side → Source → Moves) onto the shared engine.

**W2 · Retrievability (Codex).** Seed→`genome_patterns`→manifest→index pipeline; close 17→all-authored; pgvector migration (ADR-001 steps 1–4); CI gates: fail if a tenant has files-but-no-rows or authored-but-not-retrievable.

**W3 · Corpus authoring program (Claude, multi-agent Workflow).** Author ~210 ExpertPacks at the depth standard. Fan-out: one authoring agent per pack → adversarial verify (CFO/evidence/domain lenses) → revise loop → gated commit. Pilot-critical industries flagged for SME review. Runs in parallel with W2.

**W4 · Rendering (Codex build · Claude recipes).** SVG-string injection into the React answer surface; typed `<DataTable>`; evidence drawer / provenance ribbon reuse. Claude authors the output recipes (question-pattern → exhibit).

**W5 · Expert evals (joint).** Golden-question set per expert (Epic, supply-chain, sourcing, AI-governance to start). Eval runner harness (Codex); adversarial expert-eval design + scoring (Claude). Proof gate before any expert is "real."

### Dependency order

```
W0 ──┬──> W1 (engine + surface wiring)
     ├──> W3 (corpus authoring)        ┐ parallel
     └──> W2 (retrievability)          ┘
W1 + W0 ──> W4 (rendering)
W1 + W3 ──> W5 (evals)
```

---

## Claude / Codex execution split

| Lane       | Owns                                                                                                                                                                                                | Why                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Claude** | W0 contracts · W1 engine design (router, broker wiring logic, grounding gate) · **W3 corpus authoring** (multi-agent, adversarial-gated) · W5 eval design + adversarial review · quality-gate logic | Judgment, deep domain authoring, adversarial quality, orchestration                           |
| **Codex**  | W2 retrievability pipeline + pgvector migration · W1 surface wiring (once contract locked) · W4 renderer wiring + typed DataTable · schema validators + CI gates · W5 eval-runner harness           | Deterministic plumbing, volume mechanics, structurally-repetitive scaffolding, test harnesses |
| **Joint**  | Contract review · proof-gate sign-off · parity gates (old vs new retrieval)                                                                                                                         | Both must agree the seam holds                                                                |

The clean division: **Codex builds the factory and the conveyor (ingest, validate, index, render, test); Claude produces the goods (expert packs, reasoning engine) and runs the QC line (critic + rubric + evals).** They parallelize because W2 (plumbing) and W3 (content) are independent after W0.

---

## Quality + proof gates

A capability is not "real" until:

- private facts available for the tenant (not just schema)
- corpus patterns/packs retrieved (not just authored)
- citations present and evidence-usable
- chart/table data validated (no invented figures — `qa-rubric` honesty rules)
- no cross-tenant leakage
- refusal/hedge behaves per doctrine when evidence is thin
- signed-in answer proof captured
- golden expert questions pass

Per the repo's truth standard: report each state separately — _authored ≠ retrievable ≠ answered ≠ proven._

---

## Decisions — RESOLVED 2026-06-20

1. **Grounding doctrine: CONFIDENT SYNTHESIS.** The engine answers from domain expertise even when client evidence is thin. The **only hard block is cross-tenant leakage** (`detectCrossTenantIdentityLeak`). The post-stream citation gate stays **observe-only / telemetry** — it does not suppress or regenerate. ExpertPack `refusalRules` therefore encode **hedge language** ("based on industry patterns rather than your data…"), not refusal. Implication for W1: do **not** build a blocking evidence gate; keep the confident-synthesis path and keep the cross-tenant fence.
2. **Corpus scale: ~210 experts, AI-GATE ONLY.** 15 industries × ~12 functions + ~30 cross-cutting. **No human SME review tier** — all packs rely on the adversarial `critic.ts` + `qa-rubric.ts` + benchmark-plausibility gate, including regulated industries (healthcare, financial services). Risk accepted for speed; mitigation is a strong adversarial gate (CFO/evidence/domain lenses) + benchmark-plausibility checks in W3.
3. **Kickoff: W0 CONTRACTS FIRST.** Lock `ExpertPack v2` + `AgentAnswer` as the dependency root, then W1/W2/W3 parallelize.
