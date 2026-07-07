# Healthcare + Modernization Corpus — Harden & Enhance Autonomous Run

**For:** Codex (full-privilege autonomous, non-stop)
**Mission:** Audit, refine, fill gaps, and harden the existing healthcare + modernization corpus until the agent demonstrably reasons like a CDAO modernization lead and a CPO sourcing operator.
**Critical:** This is NOT a greenfield build. ~10,800 healthcare patterns + the modernization pattern pack already exist. The job is to make what's loaded **sharper**, not to rebuild it.
**Budget envelope:** ~$50 in model spend (mix of Sonnet + Opus for high-ground review and eval), ~6-10 hours wall-clock.
**Output:** A demonstrably stronger healthcare+modernization corpus, eval-graded ≥ 8.5/10, with a CDAO-grade and CPO-grade test harness passing in production.

---

## Mission

Two things must be true at the end of this run:

1. A **CDAO** at a real US health system, opening the agent with a modernization charter (e.g., "we're moving Epic Clarity + ancillary reporting marts to a Databricks lakehouse"), gets answers that pattern a senior CDAO would *recognize as their own discipline* — not generic finance/AI textbook content.

2. A **CPO** at the same health system, opening the Source module to run a real sourcing event (e.g., "renegotiate our Epic AMS contract with Optum / Atos / Cognizant TriZetto" or "compete the analytics AMS we currently outsource"), gets bid-evaluation, BAFO negotiation, and TCO normalization output that a sourcing operator would *defend in front of the CFO*.

Anything short of that is a build, not a corpus.

---

## State of the corpus today (Codex must verify before starting)

The healthcare corpus and the modernization pattern pack already exist. Verify these counts on the **Azure Postgres data plane**:

| Asset | Expected | How to verify |
|---|---|---|
| Total `healthcare_provider` patterns in `pattern_corpus` | ≥ 10,785 | `SELECT count(*) FROM pattern_corpus WHERE vertical='healthcare_provider';` |
| Demo-relevant healthcare patterns | ≥ 6,872 | `SELECT count(*) FROM pattern_corpus WHERE vertical='healthcare_provider' AND demo_relevant=true;` |
| Intelligence graph edges (healthcare) | ≥ 20,000 | edges table query, tenant-scoped |
| Modernization pattern pack files | Present | `ls docs/build/MODERNIZATION_PATTERN_PACK_*` should show spec + industry profiles + Codex brief |
| Modernization archetype coefficients | Branch exists | `git branch -a | grep modernization-archetype-coefficients` |
| Rate-card ingestion kernel | Merged | `git log --oneline | grep "rate-card ingestion kernel"` |
| Healthcare knowledge-data packs | 20 files | `ls scripts/knowledge-data/healthcare/ | wc -l` returns 20 |
| Estimation engine types | `src/types/estimation.ts` exists with `P50/P80/P95`, `EffortUnit`, `OwnerMix` | Read the file |
| Loader | `scripts/corpus/load-authored-genome-seeds.ts` writes to Azure Postgres | Read header |

If any count is materially below expected → STOP and surface `BLOCKED_PRECONDITION_INVENTORY` with the actual vs expected counts.

---

## Architecture — Azure Postgres single-store (NOT Azure AI Search)

The healthcare corpus runs on Azure Postgres with three layers in one store:

| Layer | Substrate | Notes |
|---|---|---|
| Relational | `pattern_corpus` table on Azure Postgres | tenant_scope, vertical, domain, demo_relevant, etc. |
| Vector | Postgres + pgvector | 1536-dim embeddings (match the existing healthcare wave's dimensionality exactly — do NOT change) |
| Graph | Postgres nodes + edges tables | 20K healthcare edges already loaded |

Do NOT provision an Azure AI Search index for this run. That is the Lakeshore tenant's stack and is separate. All harden/enhance writes go through the canonical loader `scripts/corpus/load-authored-genome-seeds.ts` against Azure Postgres.

Embedding model: match the existing healthcare wave (1536-dim — likely OpenAI `text-embedding-3-small` or Azure OpenAI equivalent). Confirm by inspecting `src/lib/corpus/embedding.ts` before the first refinement write.

---

## The harden-and-enhance loop (per wave)

For each of the 6 waves below, execute exactly these phases. Do not skip. Do not parallelize across waves (later waves use insights from earlier audits).

### Phase 1 — AUDIT

Query the corpus for a wave-scoped slice. For each pattern in scope:

```
For each pattern P:
  score [G1-G8] from the embedded master prompt (specificity, trigger,
    decision owner, evidence, failure mode, vernacular, graph-linked,
    partner-defensible)
  classify P into one of:
    KEEP    — pattern is decision-grade as-is
    REFINE  — pattern has the right intent but is weak on 1-3 dimensions
    KILL    — pattern is generic, filler, or wrong; cannot be salvaged
    GAP     — adjacent pattern that's MISSING but should exist
```

Write `reports/healthcare-harden/wave-<n>/audit.jsonl` with one verdict per pattern + a `GAPS` block listing what should exist but doesn't.

**Pass-bar to advance to Phase 2:** at least 80% of patterns in scope are graded; gaps list is non-empty; no scoring rubric items skipped.

### Phase 2 — REFINE

For every REFINE pattern, regenerate it via:

```
Anthropic call:
  model: claude-opus-4-1  (judgment work — use Opus)
  system: <MASTER PROMPT below>
  user:   "MODE=REFINE\n\nOriginal pattern:\n<full JSON>\n\nCritic remedy:\n<what needs strengthening>\n\nReturn the refined pattern as JSON. Must hit all G1-G8."
  temperature: 0.3
```

Write the refined pattern. Upsert to Azure Postgres (`ON CONFLICT (id) DO UPDATE`). Each refinement attempt is capped at 2 — after that, change verdict to KILL.

For every KILL pattern, mark `kill_reason` in a separate `wave-<n>/killed.jsonl` log and **soft-delete** in the database (`demo_relevant=false`, `quality_tier='killed'`). Do not hard-delete — keep audit trail.

### Phase 3 — FILL GAPS

For every GAP item from Phase 1's gap list, generate a new pattern:

```
Anthropic call:
  model: claude-opus-4-1  (high-ground domains: D08/D11/D14/modernization)
         claude-sonnet-4-5  (everything else)
  system: <MASTER PROMPT below>
  user:   "MODE=GENERATE WAVE=<n> DOMAIN=<x> GAP=<gap description from audit>"
  temperature: 0.4
```

Write to `wave-<n>/new-patterns.jsonl`. Upsert to Postgres.

### Phase 4 — CRITIC CHECK

Run the embedded CRITIQUE protocol against:
- All refined patterns
- All new gap-fill patterns

In a **fresh chat session** (no Phase 2/3 context — independent critique):

```
Anthropic call:
  model: claude-opus-4-1  (Opus mandatory for critic on modernization waves)
  system: <MASTER PROMPT below>
  user:   "MODE=CRITIQUE WAVE=<n>\n\n<paste refined + new patterns>"
  temperature: 0.1
```

Apply CRITIQUE_SUMMARY go_no_go semantics:
- GO if approval_rate ≥ 75% AND high-ground domain rate ≥ 85%
- RETRY (cap 1) if approval_rate 50-75%
- KILL_WAVE if approval_rate < 50% or high-ground rate < 70%

### Phase 5 — EVAL (per-wave smoke)

Run the wave's question subset from the 100-Q harness (~15 questions per wave). Auto-grade via Opus. If wave-eval score < 7.5/10, fire `WAVE_EVAL_FAIL` escalation and surface specifics before proceeding.

### Phase 6 — LOAD + CHECKPOINT

If GO: commit the wave's changes to a branch `harden/wave-<n>` and write `wave-<n>/checkpoint.json` with:
- patterns_kept, patterns_refined, patterns_killed, patterns_added
- audit duration, refine duration, eval duration
- model spend estimate
- top 3 critic concerns surfaced

Advance to next wave.

---

## The 6 harden waves

Sequenced for maximum leverage — modernization first because that's where the user explicitly said to focus and where execution is mid-stream from the June 3 Codex brief.

### WAVE 1 — Modernization pattern pack hardening (LOAD-BEARING)

Scope (verify each exists; harden where present, fill where missing):

| Item | Status to verify |
|---|---|
| Archetype library (DataStage, stored procs/SQL Server, SAS, marts, Tableau/BO) per spec §1 A-F | Read `docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md` §1 — confirm all 6 archetypes are populated in corpus |
| 3 industry estate profiles: healthcare (Epic/Clarity), retail (POS/ERP/CDP), airline (PSS/RM/ops) | Read the industry profiles doc; confirm each estate profile has source-system inventory + disposition + automation % + compliance overlay |
| 7 R's disposition policy | Confirm patterns exist for each: Rehost, Replatform, Refactor, Repurchase, Retain, Retire, Relocate |
| Well-Architected Lakehouse 7-pillar standards framework | Patterns codifying each pillar as RFP-evaluation criteria |
| Lakebridge / BladeBridge Analyzer + Converter automation rates by source | Per-archetype automation % with citations (Track A research output) |
| SI methodology divergence (Deloitte / Accenture / PwC framing) | Patterns characterizing how each major SI frames the EDW→Lakehouse engagement |
| Brickbuilder Migration Solutions | Which SIs deliver what, what their accelerators claim |
| Weighted RFP scorecard (tunable weights) | Patterns for the scoring dimensions; pricing-normalization-model integration |
| Effort heuristics: T-shirt → person-week bands per archetype × complexity × automation leverage | Calibration table with sources; confidence ranges, not single points |
| Lakebridge-style workload inventory schema | Schema spec for ingestion through Data Loads |
| 3rd-party accelerators (LeapLogic, MigryX, LTIMindtree Scintilla, EXL) automation % comparison | Patterns capturing range, not single points |

**This wave is mandatory Opus-everything.** The modernization patterns are the credibility front-door for the CDAO charter pitch.

**Wave 1 target:** ~400 refined + ~300 new gap-fill patterns. Effort estimate-related patterns are explicitly load-bearing — agent must produce defensible P50/P80/P95 effort bands when asked.

### WAVE 2 — CDAO modernization charter operating patterns

Audit existing healthcare patterns tagged for the CDAO role (`dom50` Data Platform/Lakehouse/AI Governance, `dom70` AI Governance Operating Model, `dom71` Model Monitoring, `dom72` AI Adoption, `dom73` AI ROI, `dom14`-ish IT financials).

Add patterns the CDAO actually needs:
- Modernization wave sequencing (foundation → ingestion → first 5 workloads → next 20 → consolidation)
- Joint CDAO/CIO/CTO decision rights on modernization (RACI per decision category)
- Modernization business case construction (cost takeout + capability uplift + risk reduction)
- "Where to start" prioritization framework (workload archetype × business value × technical complexity)
- Foundation vs build scoping doctrine (the CDAO trap of letting SIs price the foundation)
- TCO modeling: legacy run-cost + migration-cost + new run-cost + opportunity cost
- Skills/team transition (in-house data engineering + Databricks-certified resources)
- Sunset planning (when does the legacy system shut off, who owns the decision, what triggers it)
- Modernization-induced contract renegotiation (when a wave touches a live AMS / managed services contract)

**Wave 2 target:** ~150 refined + ~200 new patterns.

### WAVE 3 — CPO sourcing operating patterns for healthcare

This wave is the CPO-marketability addition. Author from-scratch since the existing corpus is thin here.

New CPO-specific domains (loosely mirroring categories the CPO actually owns):

| Domain | Patterns | Focus |
|---|---|---|
| HC-CPO-D01 Healthcare BPO supply chain doctrine | ~200 | GPO leverage (Vizient/Premier/HealthTrust/Intalere), distribution agreements (PDA vs DDA), 340B economics, med-surg/pharma/capital equipment/purchased services, custom-pack arrangements |
| HC-CPO-D02 Epic AMS market and leverage | ~150 | Optum, Atos, Cognizant TriZetto, NTT Data, KPI Solutions, Bridge Connector — pricing benchmarks, SLA depth, exit-clause language, switching cost realities, joint CIO/CMIO governance |
| HC-CPO-D03 Analytics AMS market | ~120 | RCM analytics, clinical analytics, pop-health (CitiusTech/EXL/Cognizant/Lumen/PerceptionHealth) — when this is CDAO-led vs CPO-led, joint scorecards |
| HC-CPO-D04 Cyber + infrastructure managed services for healthcare | ~120 | HITRUST + HIPAA overlay; Fortified Health Security, CyberMaxx, Critical Insight, Tetra Defense, Pondurance — and the IT side: Sirius, CDW Healthcare |
| HC-CPO-D05 CPO operating doctrine | ~200 | Strategic vs transactional spend ratio (25/75 anchor at health systems), category ownership matrix, SRM cadence, QBR rhythm, savings tracking validated by CFO, benchmark cadence (18-24 months) |
| HC-CPO-D06 Insource-vs-outsource decision framework | ~120 | TCO calc, control/risk/capability scoring, healthcare-specific examples (revenue cycle, IT support, supply chain, MSO services) |
| HC-CPO-D07 Cross-CXO sourcing collaboration | ~120 | CPO ↔ CDAO ↔ CTO ↔ CFO ↔ CMO joint decision rights; when CPO leads, when others lead, when overrides happen |
| HC-CPO-D08 Renegotiation triggers + mid-contract optimization | ~120 | M&A, modernization milestone, payer-mix shifts, VBC change, key-person change, regulatory change — and the doctrine for each |
| HC-CPO-D09 Sourcing event playbooks by category | ~150 | Step-by-step for: revenue cycle outsourcing, EHR managed services, supply chain BPO, cyber managed services, contact center BPO, IT help desk, EUC, application managed services, cloud managed services |
| HC-CPO-D10 Vendor-specific deep dives | ~120 | Top 30 vendors a healthcare CPO actually deals with — leverage/risk profile, financial position, account team dynamics, escalation paths |

**Wave 3 target:** ~1,420 new patterns. All Opus-generated; all critic-reviewed in a fresh session.

### WAVE 4 — Existing healthcare patterns (dom31-dom80) audit + refine

Don't regenerate the 10,000 healthcare patterns. Sample-audit each of dom31-dom80 with **20 patterns per domain** (1,000 total audit slice). For each:
- Verdict KEEP / REFINE / KILL
- Apply Phase 2 to the REFINE set

Focus the audit on:
- Domains with low `quality_tier` distribution
- Domains heaviest on `confidence=low`
- Domains called out as load-bearing in modernization (dom49 Interop, dom50 Data Platform, dom53 Epic/Oracle Health, dom70-73 AI governance/monitoring/adoption/ROI)

**Wave 4 target:** Audit 1,000 patterns; refine the ~150-300 that need it; identify ~50-100 gaps to fill. Most existing patterns survive — this is hardening, not rebuilding.

### WAVE 5 — Cross-cutting: estimation + RFP-evaluation lens

Verify the estimation engine actually produces defensible numbers when the agent is asked about modernization scenarios.

Test:
- Synthetic Lakebridge analyzer inventory (50 tables, 100 stored procs, 30 reports — known complexity) → agent should produce P50/P80/P95 effort bands within the calibration table's ranges
- 3 synthetic SI bids → agent should normalize to common scope via pricing-normalization-model and emit per-pillar adherence scores against Well-Architected Lakehouse 7 pillars

If the engine doesn't connect to the patterns (i.e., patterns exist but the agent doesn't reach for them when answering modernization questions), the gap is **retrieval, not corpus**. Surface as `RETRIEVAL_DISCONNECT` and stop — that's an engine fix, not a corpus fix.

**Wave 5 target:** No new patterns; this is a wiring-verification wave. Outputs are eval evidence: did the agent produce defensible estimates? Did it normalize bids correctly?

### WAVE 6 — Meridian tenant overlay (~300 patterns)

Final wave adds Meridian-tenant-specific overlay so the patterns ground to a real health system context. Patterns tagged `tenant_scope: "meridian"` AND linked via `graph_relationships: extends_pattern` to the healthcare base.

Meridian profile to capture in patterns:
- Scale (use existing Meridian profile from `intelligence/seeds/tenant-portfolios/meridian.json` if present)
- Active modernization waves
- Existing outsourcing relationships
- CDAO charter scope and KPI commitments
- CPO charter scope and category ownership
- Joint CXO operating model

**Wave 6 target:** ~300 Meridian-tagged patterns. Lower priority but seals the demo story.

---

## EMBEDDED MASTER PROMPT (system prompt for every model call)

Codex feeds the entire block below as the `system` parameter for every Anthropic API call in any phase. Do not paraphrase, summarize, or truncate. Voice and bar continuity require identical context per turn.

```
================================================================
HEALTHCARE + MODERNIZATION CORPUS HARDENING — MASTER PROMPT
Operates in modes: AUDIT | REFINE | GENERATE | CRITIQUE | GAPS
================================================================

MISSION

You are hardening an existing corpus that supports a healthcare provider
agent. The corpus has ~10,800 healthcare patterns plus an in-flight
modernization pattern pack calibrated to Databricks methodology
(Lakebridge, Well-Architected Lakehouse 7 pillars, 7 R's disposition).

Two personas test the agent at the end:
  - CDAO running a healthcare modernization charter
  - CPO running a healthcare sourcing event

Your job is to make the corpus sharp enough that BOTH personas, on real
events, would recognize the agent's responses as their own operating
discipline — not generic AI/finance/consulting content.

THE BAR ("WHAT GOOD LOOKS LIKE")

[G1] Specific doctrine, decision rule, anti-pattern, or fact — not a vague tip
[G2] Names the trigger condition (when does this apply?)
[G3] Names the decision owner (who calls it?)
[G4] Cites evidentiary basis (industry practice, regulation, peer precedent)
[G5] Has a clear failure mode if violated
[G6] Uses healthcare vernacular accurately (HIPAA, Epic, Cerner, GPO, 340B, etc.)
[G7] References related patterns (composable graph node)
[G8] Defensible if read by a CDAO or CPO

A pattern fails when:
[F1] Reads like a McKinsey deck
[F2] Could apply to any industry (no healthcare specificity)
[F3] States a goal without when/who
[F4] Invents specific people, vendor names, deal amounts without basis
[F5] LLM filler ("In today's evolving healthcare landscape...")
[F6] Says what to do, not why or when not to
[F7] Conflates provider with payer perspective (corpus is provider-side)

DOMAIN MASTERY YOU MUST ALREADY HAVE

# Healthcare modernization (the load-bearing focus)

  - Lakebridge/BladeBridge Analyzer + Converter — Databricks' migration
    accelerator. Automation rates vary by source type:
      DataStage → 50-70% automated; manual residual on custom routines
      Stored procs (SQL Server) → 60-80% automated; manual residual on T-SQL idioms
      SAS → 40-60% automated; manual residual on PROC SQL + macros
      Marts (Teradata/Netezza) → 70-85% automated; manual residual on
        view dependencies
      Tableau/BO → 30-50% automated; manual residual on calculated fields
    These are calibration anchors; cite ranges with sources, never a single point.

  - The 7 R's: Rehost (lift-shift), Replatform (lift-tinker-shift), Refactor
    (re-architect), Repurchase (SaaS), Retain (no change), Retire (kill),
    Relocate (move env). Re-platform effort premium over lift-shift is
    typically 30-50%; re-architect is 100-200%.

  - Well-Architected Lakehouse 7 pillars: Data Governance, Security &
    Compliance, Performance Efficiency, Cost Optimization, Reliability,
    Operational Excellence, Interoperability. RFP responses score against
    each — weighted scorecard with tunable weights.

  - Medallion architecture (bronze/silver/gold) + Unity Catalog (governance) +
    Delta Live Tables (DLT, declarative ETL) + Asset Bundles (deployment as
    code). These are the Databricks "right-way" patterns to evaluate SI bids
    against.

  - SI methodology divergence:
      Deloitte tends to lead with foundation + governance; longer ramp
      Accenture tends to lead with accelerators + offshore leverage
      PwC tends to lead with strategy framing + smaller delivery footprint
      Wipro/Infosys/TCS tend to lead with cost (deep offshore)
      Brickbuilders (smaller Databricks-partner SIs) lead with speed +
        Databricks-native depth
    Frame this as ranges, not single labels — each firm has multiple play
    types.

  - Healthcare-specific modernization compliance: HIPAA (technical, admin,
    physical safeguards), BAA discipline, subprocessor disclosure, model
    audit rights, deployment-site validation SLAs, FDA SaMD when clinical
    AI is in scope.

  - Effort estimation: total = foundation (fixed) + per-source ingestion
    framework (fixed + per-source variable) + per-workload conversion
    (variable, archetype × complexity × automation leverage) + dual-run
    parallel period + cutover + decommission. Express as P50/P80/P95 ranges;
    flag confidence per line.

# Healthcare provider operating reality (the CPO + CDAO context)

  - Epic is the dominant EHR (60%+ market share by US discharges); Oracle
    Health (Cerner), Meditech, athenahealth, eClinicalWorks compete by segment.
  - Epic AMS market (post-go-live application managed services): Optum
    (Change Healthcare lineage), Atos (Syntel lineage), Cognizant TriZetto,
    NTT Data (Sapphire), Bridge Connector, KPI Solutions, smaller Epic-
    certified firms (Nordic, Healthtech, Galen). Pricing typically $X per
    user per month or capacity-based; multi-year contracts; exit clauses
    are the most-negotiated.
  - Analytics AMS: CitiusTech (largest pure-play), EXL, Cognizant, Lumen,
    Health Catalyst (vendor + managed services), Perception Health.
  - Revenue cycle outsourcing: R1 RCM, Optum (UnitedHealth), Conifer
    (Tenet), Conduent, Ensemble Health Partners.
  - Supply chain GPOs: Vizient (largest), Premier, HealthTrust (HCA-affiliated),
    Intalere (Intermountain-affiliated, now part of HealthTrust). Each has
    distinct contract terms; multi-GPO membership is common for category
    leverage.
  - 340B Drug Pricing Program: covered entity status, contract pharmacy
    arrangements, ceiling-price calculation, child site eligibility — a
    multi-billion-dollar program at most large health systems with its own
    sourcing dynamics.
  - HITRUST CSF: dominant healthcare security certification (vs ISO 27001
    or SOC 2 alone); HITRUST r2 is the gold standard; e1 and i1 are lower
    tiers; HITRUST certification is increasingly a BAA precondition.

ANTI-HALLUCINATION RULES

H1. Never invent specific deal amounts, people's names, or contract terms.
H2. Cite regulations by canonical short name (HIPAA, 42 CFR Part 2, EMTALA,
    Stark Law, Anti-Kickback Statute, No Surprises Act, IRC §501(r),
    21st Century Cures Act, ONC Information Blocking Rule, CMS IPPS rule).
    Never fabricate statute numbers.
H3. Cite peer firms by archetype unless their public profile makes the
    reference uncontroversial (e.g., "Mayo Clinic platform play" is OK as
    public knowledge; specific deal pricing is not).
H4. When citing benchmarks (denial rates, prior-auth turnaround, RVU
    productivity), use ranges grounded in MGMA/AHA/HFMA/HIMSS-published
    data; flag confidence="high" only when you'd defend in a deposition.
H5. When citing vendors (Epic, Databricks, Optum, etc.), keep references
    accurate to actual capabilities. If unsure, describe the capability
    category.
H6. If unsure, set confidence="medium" and add an evidence note explaining
    what would upgrade to "high".

PATTERN SCHEMA (every generated or refined pattern, no exceptions)

Emit one JSON per line:

{
  "id": "H<NNNNN> or HC-CPO-D<NN>-<NNNN> or PAT-MODERN-<NNNN>",
  "version": "<x.y.z>",
  "tenant_scope": "meridian | phs | global",
  "vertical": "healthcare_provider",
  "title": "<8-14 word title, decision-grade>",
  "summary": "<1-2 sentence executive summary>",
  "doctrine": "<the rule, 1-4 sentences, definitive voice>",
  "domain": "<dom31-dom80 OR HC-CPO-D01..D10 OR PAT-MODERN-*>",
  "category": "<sub>",
  "subcategory": "<finer>",
  "personas": ["cdao" | "cpo" | "cio" | "cto" | "cmio" | "cfo" | ...],
  "triggers": ["<observable condition>", "..."],
  "applies_when": "<sentence>",
  "does_not_apply_when": "<sentence — exceptions>",
  "decision_owner": "<role>",
  "supporting_evidence": [
    {"source_type": "industry_practice|regulation|peer_firm_precedent|academic|vendor_documentation",
     "label": "<short>", "detail": "<1-2 sentences>"}
  ],
  "anti_patterns": ["<thing NOT to do and why it fails>"],
  "failure_modes": ["<what goes wrong if violated>"],
  "decision_artifacts": ["<IC memo | RFP scorecard | board pack | BAFO ask pack | TCO bridge | etc.>"],
  "vocabulary": ["<term>", "..."],
  "tags": ["<hipaa | epic | databricks | gpo | 340b | etc.>"],
  "related_patterns": ["<id>", "..."],
  "graph_relationships": [{"relation": "supersedes|depends_on|conflicts_with|implements|refines|extends_pattern|enables_workflow", "target": "<id>"}],
  "embedding_text": "<denormalized 200-400 word text for semantic retrieval>",
  "confidence": "high|medium|low",
  "vintage": "2026-Q2",
  "quality_tier": "premium|standard|stub|killed",
  "specificity": "tenant_specific|healthcare_specific|industry_canon|generic"
}

THE VOICE

Senior healthcare operator who has run modernization waves AND sourcing
events at $5B+ health systems. Has the scars to back the doctrine.

  - Declarative, not hedged
  - Direct, not consultant-y
  - Specific numbers grounded in MGMA/AHA/HFMA/HIMSS benchmarks
  - Honest about what doesn't work — anti-patterns are first-class
  - Names things bluntly: "this is the GPO upcharging on a custom item that
    a direct-buy negotiation would compress 8-12%"

================================================================
GENERATOR-MODE SELF-REVIEW
================================================================

Before emitting any pattern, score [G1-G8]. If any is "no", rewrite.
If 3+ are "weak", kill and regenerate.

After a batch, emit:
  BATCH_SELF_REVIEW:
    batch_id=<id>
    domains=<list>
    generated=<count>
    self_rejected_pre_emit=<count>
    final_emitted=<count>
    by_quality_tier: premium=<n> standard=<n> stub=<n>
    by_specificity: tenant_specific=<n> healthcare_specific=<n>
                    industry_canon=<n> generic=<n>
    suspected_weak: [<id list>]

================================================================
CRITIQUE-MODE PROTOCOL — YOU ARE ANAND'S QA PROXY
================================================================

You review patterns generated by another model (or yourself in a prior
turn, with fresh-context discipline). You are NOT here to be polite.
You are here to make the corpus intelligent enough to survive a real
CDAO/CPO opening it.

For each pattern, emit:

  APPROVE  <pattern_id>  scores=G1✓G2✓...G8✓  notes=<optional 1-line>
  REFINE   <pattern_id>  failing=[<G-codes>]  remedy=<concrete 1-2 sentence rewrite guidance>
  KILL     <pattern_id>  failing=[<F-codes>]  reason=<1 sentence>

For REFINE, you MAY emit a refined version of the pattern inline (full
JSON, schema-compliant). Cap refinement attempts at 2. If still failing
after 2 → KILL.

Be RUTHLESS on modernization patterns. The CDAO will catch any pattern
that confuses Databricks SaaS pricing with consumption-based pricing, or
mis-states the 7 R's, or quotes automation rates with false precision.

Be RUTHLESS on CPO patterns. The CPO will catch any pattern that confuses
GPO contracts with managed-services contracts, or names a vendor in a
category they don't compete in.

Be GENEROUS on graph-related approvals — patterns that link well to other
patterns are intrinsically more valuable.

NEVER rubber-stamp. A pattern that's "filled in correctly" but generic is
a KILL, not an APPROVE.

At end of critique pass, emit:
  CRITIQUE_SUMMARY:
    batch_id=<id>
    reviewed=<count>
    approved=<count>
    refined=<count>
    killed=<count>
    approval_rate=<pct>
    kill_reasons_topN: [{reason, count}]
    critical_pattern_gaps: [<one-line gaps>]
    modernization_health=<pct>  ← if modernization patterns in batch
    cpo_persona_health=<pct>    ← if CPO patterns in batch
    cdao_persona_health=<pct>   ← if CDAO patterns in batch
    go_no_go: GO | RETRY | KILL_BATCH
       GO         = approval_rate ≥ 75% AND all persona healths ≥ 80%
       RETRY      = approval_rate 50-75%
       KILL_BATCH = approval_rate < 50% OR any persona health < 70%

If KILL_BATCH, emit ESCALATE_TO_ANAND with specific concerns.

================================================================
GAP-AUDIT MODE
================================================================

When invoked with MODE=GAPS, audit a wave for missing patterns.

  GAP_AUDIT:
    wave=<n>
    patterns_reviewed=<count>
    missing_patterns:
      - domain=<x> category=<y> priority=high|medium|low
        rationale="<why this matters and what it would unlock>"
      - ...
    blind_spots: [<patterns the corpus assumes the agent knows but
                  didn't capture — flag for hand-authoring>]
    coverage_quality: high=[<domains>] medium=[<domains>] low=[<domains>]

Do not generate patterns in this mode. Just identify gaps.

================================================================
FINAL DIRECTIVE
================================================================

The goal is not pattern count. The goal is an agent that, when a CDAO or
CPO opens it, responds with discipline they recognize as their own.

When in doubt: "Would a senior healthcare CDAO/CPO read this and say
'yes — that's how we actually run it' or 'this is consultant-deck filler'?"

Yes → ship. No → rewrite. Borderline → kill.
```

---

## The 100-question evaluation harness

After each wave, run the wave's question subset (~15 questions). After all 6 waves complete, run the full 100. Auto-grade each via Opus.

Authoring instructions for Codex: write questions yourself by Phase 5 of Wave 1. The 100 questions should split:
- **40 modernization (CDAO charter)** — heavy weight, since modernization is the focus
- **30 sourcing/CPO scenarios** — healthcare BPO supply chain, IT outsourcing, contract renegotiation
- **15 healthcare clinical/operational** — verifies the existing 10,800 patterns still hold
- **10 cross-cutting** — CDAO/CPO joint scenarios, mid-modernization sourcing decisions
- **5 anti-pattern recognition** — will the agent correctly reject a bad idea?

### Authoritative sample questions to seed the 100-question set

These are the 30 anchor questions; Codex authors the remaining 70 in the same shape.

#### Modernization · CDAO-grade (~12 anchors)

```
Q-MOD-001  factual
We are migrating Epic Clarity reporting marts and ~200 stored procedures
from on-prem SQL Server to Databricks. What automation rate should we
expect from Lakebridge's converter, and what residual manual work
should we plan for?
Expected pattern_ids: <modernization automation-rate patterns for stored procs>
Rubric: cite 60-80% range for SQL stored procs, identify T-SQL idioms +
custom routines as residual; reference Lakebridge + BladeBridge by name;
acknowledge confidence range, not single point.

Q-MOD-002  applied
Three SI bids for our EDW→Lakehouse migration: Deloitte at $14.5M,
Accenture at $11M, Cognizant at $8.5M. All 18 months. How do I normalize
these and what would I push back on?
Expected: pricing-normalization framework; per-pillar Well-Architected
scoring; SI methodology divergence (Deloitte foundation-heavy, Accenture
accelerator-heavy, Cognizant cost-heavy); ask which has Brickbuilder
partnership; surface offshore mix; surface foundation vs build scope split.

Q-MOD-003  tradeoff
We have a 5-year-old Tableau Server with 300 dashboards and 50,000 active
users. Should we re-platform to Tableau Cloud, lift to Power BI on Fabric,
or rebuild on Databricks SQL?
Expected: 7 R's disposition framing; surface re-platform effort premium
30-50%; surface skills/team transition cost; usage analytics matters more
than dashboard count; user base attrition risk during migration.

Q-MOD-004  factual
Define the Well-Architected Lakehouse 7 pillars and which ones matter
most for an Epic-anchored healthcare CDAO.
Expected: 7 pillars enumerated; Data Governance + Security & Compliance
weighted higher for HIPAA exposure; Cost Optimization matters for
multi-year run-cost defensibility; Interoperability matters for the
FHIR/HL7 integration surface.

Q-MOD-005  applied
Our SI is proposing 70% offshore for the conversion. What are the
trip-wires?
Expected: time-zone overlap for production cutover windows; clinical
context understanding for healthcare-specific transformations; key-staff
retention bond; named onshore engagement lead with deposition-grade
accountability; offshore ratio drift during the contract.

Q-MOD-006  applied
Estimate the effort to migrate a 50-table Epic Clarity reporting layer
+ 100 stored procs + 30 Tableau dashboards to a Databricks medallion.
Give me P50/P80/P95.
Expected: foundation 8-16 weeks; ingestion framework + per-source 4-8
weeks each; conversion using archetype × complexity × automation table;
P50/P80/P95 bands; dual-run period 4-8 weeks; cutover + decommission;
flag confidence by line.

Q-MOD-007  anti-pattern
The SI is saying "we can do the entire SAS conversion at 95% automation
with our accelerator." How do I respond?
Expected: reject 95% as outside the realistic range (40-60% for SAS);
ask for source-by-source automation breakdown; ask for what their
accelerator actually does that Lakebridge doesn't; demand reference
client with comparable SAS footprint; surface that manual residual
on PROC SQL + macros is the killer.

Q-MOD-008  factual
What's the difference between Repurchase, Replatform, and Refactor in
the 7 R's, and when do you choose each for an Epic-adjacent reporting mart?
Expected: each defined; Repurchase if a SaaS analytics product covers
80% of need; Replatform if cost takeout is primary driver and capability
is acceptable; Refactor if capability uplift justifies 30-50% effort
premium over lift-shift.

Q-MOD-009  tradeoff
Should we go Unity Catalog or stick with our existing Apache Ranger
governance layer through the modernization?
Expected: Unity Catalog is the Databricks-native answer; trade-offs
on cross-platform (Snowflake etc.) governance; if multi-engine future,
Ranger holds; if Databricks-first, Unity Catalog wins; never run both
in production indefinitely — pick by year 2.

Q-MOD-010  applied
The CFO is asking me to defend the modernization business case. What
TCO components do I show and what should I anchor?
Expected: legacy run-cost (today's actual) + migration cost (one-time)
+ new run-cost (target year-3) + opportunity cost (capability uplift
quantified); year-by-year cash flow; show planning ranges not single
points; show payback period assuming P80 effort case, not P50.

Q-MOD-011  applied
We're 14 months into a 24-month modernization and the SI is asking
for a $3M change order. What's my move?
Expected: surface scope-change root cause vs estimation-miss root cause;
trigger the contract's change control clause; demand mid-stream
benchmarking against alternatives; consider partial insource on
foundation work to compress remaining cost; never agree to change
order without root-cause documentation.

Q-MOD-012  anti-pattern
The CIO is saying "let's just keep the legacy EDW running and build
the new lakehouse alongside — we'll migrate over time."
Expected: this is the "two-system" trap; double-run cost is real
and recurring; clinicians/analysts use the system that has the data
they need today, so adoption of the new system stalls; data quality
diverges; force a decommission date and an evidence-cited sunset plan.
```

#### CPO sourcing event · CPO-grade (~9 anchors)

```
Q-CPO-001  applied
We're renegotiating our Epic AMS contract with our current vendor.
$4M/yr, 3 years remaining. What's my BAFO ask pack?
Expected: surface Optum/Atos/Cognizant TriZetto as credible alternatives;
benchmark $X per user per month for our scale; demand SLA depth on
upgrade-window response time; demand exit clause with knowledge transfer;
demand automation roadmap commitment; demand named onshore lead;
surface the 180-day notice clause leverage.

Q-CPO-002  factual
What's the difference between a GPO contract and a managed services
contract for supply chain BPO, and when do we use each?
Expected: GPO is price/contract aggregation; managed services is ops
takeover; we use both — GPO for price leverage on standardized items,
managed services for ops takeover where labor + technology + price
together compress cost; never let an MS provider eat our GPO leverage.

Q-CPO-003  applied
Our CDAO outsourced analytics AMS to CitiusTech 18 months ago. CDAO is
now running an EDW→Databricks modernization. How does this affect the
contract?
Expected: the analytics AMS contract was scoped on the legacy stack;
modernization triggers renegotiation; surface the architecture change
clause if present; if absent, surface that mid-contract scope shift
is the lever to re-open commercial terms; consider whether the AMS
provider has Databricks-native capability or if we need a different
provider for the new world.

Q-CPO-004  applied
How do I run an insource-vs-outsource decision for our IT help desk
(currently outsourced to a Tier-2 Indian IT services firm)?
Expected: TCO framework — cost, control, risk, capability; control
matters more for help desk than supply chain because of clinician
trust; risk includes BEC fraud + insider threat; surface that
healthcare-specific knowledge (clinical workflows, EHR navigation)
makes pure-Tier-2 offshore weak unless paired with onshore L2/L3.

Q-CPO-005  tradeoff
Vizient vs Premier vs HealthTrust for our primary GPO. We're a $3B
multi-state health system. How do I choose?
Expected: Vizient largest scale, broadest contract portfolio; Premier
historically stronger on pharmacy + data analytics; HealthTrust
HCA-affiliated, strongest in operational benchmarking; multi-GPO
membership is common for category leverage; choose primary based on
spend mix.

Q-CPO-006  applied
The 340B program covers $50M/yr of our drug spend. How does this affect
my pharmacy supply chain sourcing strategy?
Expected: 340B ceiling pricing creates a discount baseline; specialty
drugs are the highest-leverage category; contract pharmacy arrangements
expand the program but compress profit margin per script; HRSA
recertification cycle matters; surface manufacturer restrictions on
contract pharmacy (Bristol Myers, Lilly, Sanofi precedent) and how
to negotiate around them.

Q-CPO-007  applied
I'm asked to compete our cyber managed services contract. What's the
healthcare-specific shortlist?
Expected: Fortified Health Security (healthcare-focused MSSP),
CyberMaxx (mid-market), Critical Insight (regional), Tetra Defense,
Pondurance; cross-cutting: Sirius, CDW Healthcare for infrastructure
overlap; demand HITRUST certification; demand 24/7 SOC; surface that
ransomware response readiness is the load-bearing capability.

Q-CPO-008  applied
CFO is pressing for 8% YoY non-labor savings. I run sourcing. What's
the playbook for getting there?
Expected: spend segmentation — strategic 25% / transactional 75%;
strategic spend events (multi-million-dollar renegotiations + RFPs);
transactional spend automation (P-card programs, GPO compliance);
contract benchmarking sweep every 18-24 months; demand audit of
purchased services category (the most over-spent at most health
systems); insource selective IT functions where TCO supports it;
surface the realistic ranges (5-8% on strategic, 2-4% on transactional)
so the 8% target is honestly achievable or honestly pushed back.

Q-CPO-009  anti-pattern
The CTO wants to insource Epic build (currently outsourced to a
boutique firm). What's the trap I should surface?
Expected: surface real cost of certified Epic resources ($150-220K
all-in); surface time to certified competence (12-18 months for
new hires); surface the surge-capacity problem (boutique can ramp
to 20 builders for an Epic upgrade; an internal team can't); the
right answer is often a hybrid — core build team in-house, surge
capacity on retainer; the trap is full insource that breaks during
the next upgrade cycle.
```

#### Cross-cutting CDAO+CPO (~3 anchors)

```
Q-X-001  applied
The CDAO wants to modernize the data platform. The CPO has a live
$4M/yr analytics AMS contract that the modernization will obsolete.
Who owns the decision and what's the doctrine?
Expected: CDAO leads on the modernization architecture; CPO leads on
the contract; CFO holds the budget; joint decision — CDAO charters
the modernization, CPO runs the AMS renegotiation in parallel using
the modernization as the catalyst; the doctrine is: never let the
incumbent AMS vendor scope the modernization.

Q-X-002  applied
We're at month 12 of a 24-month modernization. The CFO is asking
"where's the savings?" How do I answer as the joint CDAO+CPO front?
Expected: cost takeout savings show up year 3+ (post-decommission);
year 1-2 is investment + dual-run cost (UP, not down); capability
uplift savings (analyst productivity, faster decisions) are real but
hard to quantify in a board-defensible way; the answer is honest:
"net cost up through year 2, net down year 3+, capability uplift
showing in analyst NPS + time-to-insight metrics today."

Q-X-003  anti-pattern
The board is asking "should we outsource our entire IT to Optum?"
Expected: surface the size of the prize (typically 8-15% over multi-
year vs current run-cost) and the size of the risk (clinician trust
loss, key-person loss, capability erosion); surface that monolithic
mega-deals deliver less savings than category-by-category competition;
surface that Epic, RCM, analytics, cyber, EUC, infrastructure, network
all have different optimal sourcing strategies; the answer is rarely
"one mega-vendor" — the right answer is a portfolio.
```

#### Anti-pattern recognition (~6 anchors)

```
Q-AP-001  The SI says "we have a proprietary accelerator that gets to
80% automation on SAS-to-Databricks." Should I believe them?
Expected: skeptical; demand evidence (reference clients, what does the
accelerator actually do, how does it compare to Lakebridge/BladeBridge);
80% is at the top of the realistic range so not impossible but needs
proof; ask for a paid 2-week sample of 5 SAS programs to validate
their claim before committing.

Q-AP-002  The vendor says "our Epic-certified team has 30 years of
combined experience." How should I read this?
Expected: meaningless metric — could be 30 people with 1 year each;
ask for tenure distribution, named lead's specific years of certified
Epic experience, how many builders are App Orchard-aware, what their
last 3 large-system go-lives looked like; "combined experience" is
a marketing tell.

Q-AP-003  CDAO is proposing to "start with a quick win — migrate
one mart in 8 weeks."
Expected: the 8-week mart migration without the foundation is a trap;
you incur 80% of the foundation cost (ingestion framework, governance,
compute setup) on the first mart anyway, so the marginal cost of the
next mart is much lower; "quick win" framing under-invests in
foundation and creates a snowflake mart that won't scale; the right
framing is "first 3 marts in 16 weeks, including foundation."

Q-AP-004  The MS provider says "we'll bill on T&M with a not-to-exceed
ceiling." What's the trap?
Expected: NTE ceilings drift through change orders; T&M creates the
wrong incentive (more hours = more revenue); demand outcome-based or
unit-based pricing where possible (e.g., $X per ticket-resolved,
$Y per Epic build hour with documented complexity tier); use T&M only
for genuinely undefinable scope, and cap the T&M portion at 20% of
total contract value.

Q-AP-005  CFO is asking for a P50 effort estimate to anchor the budget.
Expected: pushing back — P50 is the median, meaning 50% chance of
overrun; budgets should anchor on P80 minimum for high-confidence
delivery; P50 is appropriate only for a portfolio of many independent
projects where the law of large numbers applies; a single
modernization wave is not that — surface the variance and recommend
P80 anchor with P95 contingency.

Q-AP-006  The vendor is offering a 5-year contract at "$X total —
significantly less than year-by-year would total."
Expected: surface the lock-in cost; the year-3+ benchmark exposure
(market rates will move); the exit cost if the relationship breaks;
the implicit assumption that vendor capability + tenure stays static
for 5 years (it doesn't); the right counter is a 3-year base + two
1-year options at re-benchmarked rates.
```

### Eval grading rubric (per question)

Each answer is graded 0-10 across:
- **Factual accuracy** (does the answer match the corpus?)
- **Citation presence** (does the answer cite specific pattern_ids?)
- **Doctrine alignment** (does the response read like a senior practitioner?)
- **Vernacular fit** (right terms — HIPAA, GPO, 340B, Lakebridge, etc.)
- **Anti-hallucination** (any fabricated vendor names, deal amounts, statute numbers?)

Avg score < 7 on any question → diagnose in `eval/failures/Q-<id>.md`.

### Eval pass bar

| Metric | Pass bar |
|---|---|
| Overall avg score | ≥ 8.5/10 (higher than Lakeshore's 7.5 — foundation is strong) |
| Modernization avg | ≥ 9.0/10 (explicit user focus) |
| CPO avg | ≥ 8.5/10 |
| CDAO avg | ≥ 8.5/10 |
| Citation rate | ≥ 85% |
| Hallucination rate | ≤ 3% |
| Anti-pattern recognition | ≥ 9/10 correct rejections |

---

## Escalation gates — STOP if any fires

| Gate | Condition | Action |
|---|---|---|
| **G1** | Any wave returns `KILL_WAVE` after 1 retry | Write `ESCALATE_KILL_WAVE.md`; STOP |
| **G2** | Modernization wave (Wave 1) ends with eval < 8.0 | Modernization is the explicit focus — failing this is failing the run. STOP, surface specifics. |
| **G3** | CPO wave (Wave 3) ends with persona health < 80% | CPO marketability is the strategic outcome. STOP, surface gaps. |
| **G4** | Total model spend > $100 | Cost discipline check |
| **G5** | Wall-clock > 14 hours | Investigation point |
| **G6** | Loader returns non-zero on any wave | Data integrity check |
| **G7** | Postgres connection drops more than 3 times in a session | Infrastructure check |
| **G8** | Retrieval-disconnect detected in Wave 5 (patterns exist but agent doesn't reach for them) | Engine fix, not corpus fix. STOP. |

For each escalation: write `ESCALATE_<gate>_<wave>.md` with full context. Do not retry past a gate without human input.

---

## Final deliverables

Commit and surface:

1. **Audit trail per wave** — `reports/healthcare-harden/wave-<n>/audit.jsonl` + `refined.jsonl` + `killed.jsonl` + `new-patterns.jsonl` + `critique-final.jsonl` + `checkpoint.json`
2. **Database state proofs** — before/after counts per domain; embedding regeneration confirmation
3. **CPO module corpus** — ~1,400 new patterns in `pattern_corpus` with `domain` prefix `HC-CPO-D*`, all approved
4. **Modernization hardening summary** — `reports/healthcare-harden/MODERNIZATION_HARDENING_SUMMARY.md` with: patterns refined, gaps filled, calibration anchors verified, SI methodology coverage, RFP-evaluation lens patterns
5. **100-Q eval results** — `reports/healthcare-harden/eval/SUMMARY.md` with per-question grades, per-domain averages, hallucination rate, citation rate
6. **Final readiness report** — `HEALTHCARE_MODERNIZATION_HARDEN_READINESS.md` with:
   - Pre vs post pattern counts
   - Eval score arc
   - Known gaps
   - Recommended next wave
   - Spend + wall-clock totals
7. **PR opened** on branch `harden/healthcare-modernization-cpo-<date>` with the full audit trail and eval evidence

Title: `feat(corpus): healthcare modernization + CPO harden (eval <score>/10)`

---

## Definition of done

All of these must be true:

- [ ] All 6 waves executed; no `KILL_WAVE` escalations open
- [ ] ≥ 1,400 new CPO patterns approved and loaded (HC-CPO-D01..D10)
- [ ] Modernization wave (Wave 1) eval ≥ 9.0/10
- [ ] CPO wave (Wave 3) eval ≥ 8.5/10
- [ ] Cross-cutting (Wave 5) verification: agent produces defensible P50/P80/P95 effort bands when asked
- [ ] Citation rate ≥ 85% across 100-Q harness
- [ ] Hallucination rate ≤ 3%
- [ ] Anti-pattern recognition ≥ 9/10
- [ ] PR opened with full audit + eval evidence
- [ ] Spend ≤ $100
- [ ] Wall-clock ≤ 14 hours

If any fails: write the relevant `ESCALATE_*.md` and stop. Anand decides next steps.

---

## What NOT to do

- Do NOT regenerate the existing 10,800 healthcare patterns wholesale. The audit-and-refine cycle is the point.
- Do NOT skip the modernization audit — that's the explicit focus.
- Do NOT lower the eval bar to make the run succeed.
- Do NOT write CPO patterns generically. The CPO is a real persona at a real health system; patterns must read like operating discipline, not consulting decks.
- Do NOT push to main. Branch + PR only.
- Do NOT continue past an escalation gate.
- Do NOT use Azure AI Search for this corpus. Healthcare runs on Azure Postgres + pgvector + Postgres-native graph.

---

## Headline

When this run completes, the deliverable is not "patterns refined." The deliverable is **a healthcare corpus that two distinct senior personas — a modernization-charter CDAO and a sourcing-event CPO — would each recognize as their own operating discipline when they open the agent.**

If the eval doesn't prove that, the run hasn't succeeded regardless of the pattern counts.

---

## One-line invocation for Codex

```
Execute docs/build/codex-handoff/2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md
end-to-end. Run non-stop. Report at every escalation gate. Surface the
final readiness report when done.
```
