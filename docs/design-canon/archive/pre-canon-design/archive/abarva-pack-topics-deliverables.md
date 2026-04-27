# AbarVa Build Pack L · Topic Intelligence + Deliverable Quality

**Date:** April 19, 2026
**Scope:** Two substantial additions to the Intelligence Layer. (1) Engagement Topic Library — structured topic intelligence packs that carry senior-consultant depth per theme. (2) Deliverable Specifications — structured templates with quality rubrics that raise the floor of every output Nexus produces.
**Effort:** ~5-6 days across six phases. Fits Week 3-4. Independent of most other packs but benefits from Pack I (domain data) + Pack C (reasoning graph) being populated.
**Why it matters:** the difference between "an LLM with a UI" and "a senior consultant in a product" sits right here. Topics are where expertise lives. Deliverables are where the product-vs-chatbot gap shows most visibly to a sponsor like Shail.

---

## The framing

**Topics are not solutions.** Solutions = productized SKUs. Topics = distilled expertise about recurring transformation themes. Nexus doesn't sell an Analytics Modernization solution — it carries the senior consultant's knowledge about what analytics modernization engagements actually look like, what patterns emerge, what usually fails, which vendors tend to consolidate out.

**Deliverables are not prose outputs.** Generic Claude writes a "business case" as four paragraphs. A senior consultant's business case has 14 sections, specific financial modeling, sensitivity analysis, phased investment, benefits realization curves, implementation readiness scoring. Same document name, vastly different quality. Template + data integration + quality rubric gets you there.

Both belong in the Intelligence Layer. Both compound over time — every engagement strengthens the topic library, every deliverable generation refines the specifications.

---

## Phase 1 · Data model

### Migration 033 · topics + deliverables

**`db/migrations/033_topics_deliverables.sql`**

```sql
BEGIN;

-- Engagement Topics — structured expertise packs
CREATE TABLE engagement_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key TEXT UNIQUE NOT NULL,                    -- 'analytics_modernization', 'ai_governance'
  title TEXT NOT NULL,                               -- 'Analytics Modernization'
  tagline TEXT,                                      -- one sentence positioning
  industries TEXT[] NOT NULL,                        -- ['GENERAL', 'HEALTHCARE_IDN', 'FINSERV']
  typical_triggers JSONB NOT NULL,                   -- array of trigger descriptions
  key_patterns TEXT[],                               -- Genome pattern codes like ['F004', 'F008']
  vendor_landscape JSONB,                            -- structured view of typical vendors
  diagnostic_questions JSONB NOT NULL,               -- ordered array of questions with probe depth
  common_contradictions JSONB,                       -- contradiction types to scan for
  phase_playbook JSONB NOT NULL,                     -- per-phase sequenced actions
  typical_deliverables TEXT[],                       -- deliverable_type keys
  success_signals JSONB,                             -- what "going well" looks like
  failure_modes JSONB,                               -- what typically breaks
  maturity_version INT NOT NULL DEFAULT 1,           -- how refined this topic intelligence is
  prior_engagement_refs UUID[],                      -- engagements that informed this topic
  source_attribution TEXT,                           -- who curated, when
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_topics_industries ON engagement_topics USING GIN(industries);

-- Deliverable types — structured specifications
CREATE TABLE deliverable_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT UNIQUE NOT NULL,                     -- 'business_case', 'current_state_assessment'
  title TEXT NOT NULL,
  description TEXT,
  applicable_phases INT[],                           -- [0, 1, 2] — which engagement phases produce this
  applicable_topics TEXT[],                          -- topic_keys that commonly produce this deliverable
  template_structure JSONB NOT NULL,                 -- ordered section definitions
  required_data_inputs JSONB NOT NULL,               -- what engagement data must be present
  quality_rubric JSONB NOT NULL,                     -- scoring criteria
  generation_prompt_template TEXT NOT NULL,          -- Claude prompt skeleton with variables
  output_format TEXT CHECK (output_format IN ('markdown', 'docx', 'pptx', 'xlsx', 'pdf')) DEFAULT 'markdown',
  version INT DEFAULT 1,
  maturity TEXT CHECK (maturity IN ('draft', 'pilot', 'production', 'deprecated')) DEFAULT 'pilot',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Actual deliverables produced during engagements
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  deliverable_type_key TEXT NOT NULL REFERENCES deliverable_types(type_key),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'in_review', 'signed_off', 'superseded')) DEFAULT 'draft',
  current_version INT DEFAULT 1,
  created_by TEXT,                                   -- 'nexus' | 'user' | 'collaborative'
  signed_off_by TEXT,
  signed_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deliverables_engagement ON deliverables(engagement_id);

-- Deliverable versions (full history, content + quality score)
CREATE TABLE deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content TEXT NOT NULL,                             -- markdown or structured JSON
  structured_data JSONB,                             -- parsed sections, financial model inputs, etc.
  quality_score JSONB,                               -- rubric-based score breakdown
  quality_issues JSONB,                              -- specific gaps flagged
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_from_context_hash TEXT,                  -- hash of engagement context at generation time
  generation_trace_id UUID,                          -- link to turn_traces if generated in a turn
  UNIQUE (deliverable_id, version)
);

-- Engagement ← Topic mapping (an engagement has 1-N topics; topic drives retrieval)
CREATE TABLE engagement_topics_map (
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL REFERENCES engagement_topics(topic_key),
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (engagement_id, topic_key)
);

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph additions: `011_topics_deliverables.cypher`

```cypher
CREATE CONSTRAINT topic_key IF NOT EXISTS FOR (t:Topic) REQUIRE t.key IS UNIQUE;
CREATE CONSTRAINT deliverable_type_key IF NOT EXISTS FOR (d:DeliverableType) REQUIRE d.key IS UNIQUE;
CREATE CONSTRAINT deliverable_id IF NOT EXISTS FOR (d:Deliverable) REQUIRE d.id IS UNIQUE;

// Key relationships
// (Engagement) -[:ADDRESSES]-> (Topic)
// (Topic) -[:COMMONLY_TRIGGERS]-> (GenomePattern)
// (Topic) -[:PRODUCES]-> (DeliverableType)
// (Topic) -[:USES_VENDOR]-> (Vendor)   // typical vendor landscape
// (DeliverableType) -[:APPLIES_TO_PHASE]-> (Phase)
// (Deliverable) -[:INSTANCE_OF]-> (DeliverableType)
// (Deliverable) -[:FOR_ENGAGEMENT]-> (Engagement)
```

### Commit

```
feat(topics-deliverables): migration 033 — topic library + deliverable specifications + versioning
```

---

## Phase 2 · Topic library — 4 topics deeply specified

**Intent:** Four topics, each a full intelligence pack. This is the baseline — more get added over time, each engagement refines the library.

### Topic 2.1 — Analytics Modernization

```yaml
topic_key: analytics_modernization
title: Analytics Modernization
tagline: "Consolidating sprawling data platforms into a governed, AI-ready estate"

industries: [GENERAL, HEALTHCARE_IDN, FINSERV, RETAIL]

typical_triggers:
  - "Cloud data spend growing >30% YoY with unclear attribution"
  - "Board-level AI strategy requires foundation that doesn't exist"
  - "Acquisition creates multi-warehouse overlap"
  - "Data governance incident (breach, audit finding)"
  - "BI tool contract renewal forcing consolidation question"

key_patterns: [F004, F008, F012]

vendor_landscape:
  core_platforms:
    - name: Snowflake
      role: "Consolidated data platform — enterprise standard"
      typical_spend_range_monthly: [100_000, 800_000]
      consolidation_play: "Absorbs 2-3 prior warehouses"
    - name: Databricks
      role: "AI/ML-heavy data platform"
      typical_spend_range_monthly: [80_000, 600_000]
      consolidation_play: "Absorbs data science + traditional ETL"
  transformation:
    - name: dbt
      role: "SQL-based transformation standard"
      consolidation_play: "Replaces stored procedures + legacy ETL"
    - name: Informatica
      role: "Enterprise ETL legacy + ingestion"
  ingestion:
    - name: Fivetran
    - name: Airbyte
    - name: custom pipelines (to be deprecated)
  bi_layer:
    - name: Tableau
      typical: "Business analytics"
    - name: Power BI
      typical: "Finance + ops"
    - name: Looker
      typical: "Product + data team"
  ai_overlay:
    - name: Snowflake Cortex
    - name: Databricks Mosaic
    - name: Claude Enterprise via API

diagnostic_questions:
  - question: "What does 'analytics modernization' mean for your leadership — consolidation, AI enablement, or governance?"
    probe_depth: 3
    tags: [framing, intent]
  - question: "Walk me through your current data platform landscape — how many warehouses, lakes, data marts?"
    probe_depth: 4
    tags: [current_state, sprawl]
  - question: "What's the biggest monthly line item in your cloud data spend?"
    probe_depth: 3
    tags: [cost, signal]
  - question: "Who owns data governance today? Is there an active data steward program?"
    probe_depth: 3
    tags: [governance, ownership]
  - question: "Which business function is most vocal about data-platform failure?"
    probe_depth: 3
    tags: [pain, driver]
  - question: "How many BI tools are in active production use?"
    probe_depth: 2
    tags: [sprawl, consolidation]
  - question: "What data quality incidents have surfaced in the last 12 months?"
    probe_depth: 3
    tags: [quality, risk]
  - question: "What's the board's AI timeline, and is analytics modernization the blocker?"
    probe_depth: 4
    tags: [strategy, sequencing]

common_contradictions:
  - type: vendor_overlap
    description: "Two or more data platforms running with overlapping workloads"
  - type: cost_vs_governance
    description: "High spend on ungoverned platforms (ratio of ungoverned:governed > 2:1)"
  - type: ai_ready_claim
    description: "Claimed AI-readiness with <50% governed data"
  - type: bi_tool_proliferation
    description: "3+ BI tools in production, unclear consolidation path"

phase_playbook:
  phase_0_charter:
    priorities:
      - "Align definition of 'modernization' among sponsors"
      - "Confirm board timeline and AI dependency"
      - "Identify primary pain driver (cost, governance, AI enablement)"
    deliverable: charter_doc
  phase_1_diagnose:
    priorities:
      - "Full inventory of data platforms + ingestion + transformation + BI layer"
      - "Spend attribution across platforms"
      - "Governance maturity assessment"
      - "Data quality scorecards"
      - "Interview 4-6 key stakeholders per function"
    deliverable: current_state_assessment
  phase_2_design:
    priorities:
      - "Target state architecture — single platform or strategic multi?"
      - "Migration sequencing (workload-by-workload)"
      - "Vendor consolidation recommendations"
      - "Governance overlay"
      - "AI-readiness path"
    deliverable: target_state_architecture
  phase_3_business_case:
    priorities:
      - "3-year TCO comparison"
      - "Migration cost modeling (vendor + internal + SI)"
      - "Benefits: cost savings + AI enablement + governance value"
      - "Risk-adjusted NPV"
      - "Phased investment curve"
    deliverable: business_case
  phase_4_execute:
    priorities:
      - "Quarterly outcome verification"
      - "Spend reduction tracking"
      - "Governance maturity progression"
      - "AI use case activation count"

typical_deliverables:
  - current_state_assessment
  - target_state_architecture
  - roadmap
  - business_case
  - vendor_evaluation_scorecard

success_signals:
  - "30%+ reduction in data platform count within 18 months"
  - "Cloud data spend growth capped or reversed within 12 months"
  - "Governance maturity moves at least one tier"
  - "AI use case count doubles within 24 months (enablement benefit realized)"

failure_modes:
  - "Lift-and-shift migration without governance uplift — recreates original problem"
  - "Political stalemate over primary platform choice — 18+ months of analysis paralysis"
  - "Business users bypass new platform, keep shadow warehouses alive"
  - "Migration cost underestimated by 2-3x, business case breaks"

prior_engagement_refs: []  # seeded with Meridian's current analytics modernization engagement
```

### Topic 2.2 — AI Governance Implementation

```yaml
topic_key: ai_governance_implementation
title: AI Governance Implementation
tagline: "Moving from documented policies to enforced, audited, continuously-monitored AI practice"

industries: [GENERAL, HEALTHCARE_IDN, FINSERV]

typical_triggers:
  - "First major AI incident (hallucination in customer-facing output, bias complaint)"
  - "Regulatory pressure (NIST AI RMF compliance, EU AI Act readiness)"
  - "Board-level demand after a peer's incident"
  - "Shadow AI discovery reveals ungoverned footprint"
  - "Audit finding or SecOps escalation"

key_patterns: [F007, F009, F010, F011]

vendor_landscape:
  governance_platforms:
    - name: Credo AI
      role: "AI governance platform — policy + inventory + monitoring"
    - name: Holistic AI
      role: "AI audit + assessment"
    - name: Fiddler
      role: "Model monitoring + explainability"
    - name: Arthur
      role: "Model monitoring"
    - name: Fairly
      role: "Bias audit"
  compliance:
    - name: OneTrust
      role: "Broader compliance with AI module"
    - name: LogicGate
      role: "GRC platform"
  adjacent:
    - name: Zscaler
      role: "Shadow AI discovery via network logs"
    - name: Netskope
      role: "Same, SaaS-focused"

diagnostic_questions:
  - question: "What triggered AI governance becoming a priority?"
    probe_depth: 3
    tags: [driver, urgency]
  - question: "Do you have a documented AI policy? Is it enforced, or aspirational?"
    probe_depth: 3
    tags: [maturity, gap]
  - question: "How many AI use cases are in production today, across the organization?"
    probe_depth: 3
    tags: [inventory, shadow]
  - question: "Who reviews AI use cases before launch? What's the approval process?"
    probe_depth: 4
    tags: [governance, ownership]
  - question: "Do you monitor production AI for bias, drift, hallucination? How?"
    probe_depth: 3
    tags: [monitoring, operations]
  - question: "What regulatory frameworks apply to your AI (NIST AI RMF, EU AI Act, state AI laws, HIPAA, SEC)?"
    probe_depth: 3
    tags: [regulation, compliance]
  - question: "Has shadow AI discovery been done? What did it find?"
    probe_depth: 4
    tags: [shadow, visibility]

common_contradictions:
  - type: documented_not_enforced
    description: "Policy exists on paper; <30% of production AI has gone through review"
  - type: inventory_incomplete
    description: "Shadow AI discovery reveals 2-3x more AI in use than inventory"
  - type: regulatory_mismatch
    description: "Claimed NIST AI RMF alignment without MEASURE 2.x (continuous monitoring) implemented"
  - type: governance_theatre
    description: "Committee meets but can't name last 3 use cases it approved"

phase_playbook:
  phase_0_charter: {...}
  phase_1_diagnose: {...}  # discovery + inventory first
  phase_2_design: {...}    # policy + enforcement mechanism
  phase_3_business_case: {...}
  phase_4_execute: {...}   # ongoing — governance is operating rhythm

typical_deliverables:
  - current_state_assessment
  - ai_inventory
  - risk_register
  - governance_charter
  - roadmap
  - business_case

success_signals:
  - "100% of production AI use cases in inventory within 6 months"
  - "Zero shadow AI discoveries in subsequent quarterly audits"
  - "AI review cycle <10 business days (not 90+)"
  - "Bias + drift monitoring live on all tier-1 use cases"

failure_modes:
  - "Governance-as-blocker — so bureaucratic that teams bypass it entirely"
  - "Policy without teeth — committee approvals aren't binding"
  - "Tool purchased (Credo AI) but operationalization never lands"
  - "Central function over-reaches; LOBs rebel"
```

### Topic 2.3 — Prior Authorization Automation (Healthcare)

[Full spec follows same pattern — Cohere Health, myNEXUS, Rhyme, Availity, Epic native as vendor landscape; patterns around payer workflows; phase playbook sequenced by specialty rollout; deliverables include payer partnership brief, clinical workflow design, change management plan.]

### Topic 2.4 — Vendor Consolidation (AI-Specific)

[Full spec — triggers around tool sprawl, patterns around overlap/ownership, capability-mapping framework, transition-risk analysis, contract-stacking assessment.]

### Commit

```
feat(topics): seed engagement topic library — 4 topics fully specified (analytics modernization, AI governance, prior auth, vendor consolidation)
```

---

## Phase 3 · Deliverable specifications — 5 types

**Intent:** Each deliverable type gets a structured template, data requirements, generation pipeline, quality rubric. This is what elevates output quality from "decent prose" to "consultant-grade work product."

### Deliverable 3.1 — Business Case

```yaml
type_key: business_case
title: Business Case
description: "Quantified investment rationale with scenarios and implementation path"

applicable_phases: [2, 3]
applicable_topics: [analytics_modernization, ai_governance_implementation, vendor_consolidation_ai, prior_auth_automation]

template_structure:
  sections:
    - key: executive_summary
      title: Executive Summary
      length_words: [250, 400]
      required: true
      components: [recommendation, investment, return, timeline]
    - key: strategic_context
      title: Strategic Context
      length_words: [400, 700]
      required: true
      components: [business_driver, board_alignment, competitive_context]
    - key: current_state_baseline
      title: Current State Baseline
      required: true
      data_sources: [engagement.phase_1.findings, tech_stack, cost_centers, benchmarks]
      components:
        - narrative: 300-500 words
        - cost_breakdown_table: required
        - pattern_diagnosis: Genome patterns active
        - peer_benchmark_comparison: required
    - key: target_state_vision
      title: Target State Vision
      length_words: [400, 600]
      required: true
      components: [outcomes, architecture_reference, governance_overlay]
    - key: investment_requirement
      title: Investment Requirement
      required: true
      components:
        - phased_investment_table: {columns: [phase, year_1, year_2, year_3, total]}
        - investment_by_category_chart: {categories: [software, services, internal_labor, infrastructure, training]}
        - assumptions_table: required
    - key: financial_return
      title: Financial Return
      required: true
      components:
        - npv_calculation: {discount_rate: 10, time_horizon_years: 3, sensitivity_range: [-20, +20]}
        - irr_calculation: required
        - payback_period_months: required
        - scenario_analysis: {scenarios: [conservative, base, aggressive]}
        - risk_adjusted_npv: required
    - key: qualitative_benefits
      title: Qualitative Benefits
      length_words: [300, 500]
      required: true
      components: [risk_reduction, strategic_optionality, capability_building]
    - key: implementation_approach
      title: Implementation Approach
      required: true
      components:
        - phased_timeline: required
        - governance_model: required
        - resource_plan: required
        - dependencies: required
    - key: risks_and_mitigations
      title: Risks & Mitigations
      required: true
      components:
        - risk_register_table: {columns: [risk, probability, impact, mitigation, owner]}
    - key: decision_ask
      title: Decision Ask
      length_words: [150, 250]
      required: true

required_data_inputs:
  engagement:
    - phase_1.findings
    - phase_2.design
    - sponsor.decision_authority
    - industry
  client:
    - financial_profile (revenue, IT budget, AI budget)
    - tech_stack (for current state)
    - cost_breakdown (for baseline)
    - benchmarks (peer comparison)
  topic:
    - vendor_landscape (for pricing references)
    - success_signals (for benefit claims)
    - failure_modes (for risk register)

quality_rubric:
  dimensions:
    - name: quantification
      weight: 25
      criteria: "Every claim about benefits, costs, timelines has specific numbers. No 'approximately', 'significantly', or vague percentages."
      threshold: "All 9+ required components have numbers; fewer than 3 vague quantifiers per section"
    - name: source_traceability
      weight: 20
      criteria: "Every benchmark + baseline + assumption cites a source (client data, industry source, or explicit assumption)"
      threshold: "Zero uncited claims"
    - name: scenario_rigor
      weight: 20
      criteria: "Conservative / base / aggressive scenarios differ by at least 40% on NPV, have distinct assumptions, and risk-adjusted NPV is shown"
      threshold: "All three scenarios have distinct narrative justifications"
    - name: structural_completeness
      weight: 15
      criteria: "All required sections present, all required components populated"
      threshold: "100%"
    - name: clarity_and_narrative
      weight: 10
      criteria: "Reads like a senior consultant's work — tight prose, visual hierarchy, no filler"
    - name: risk_honesty
      weight: 10
      criteria: "Risk register includes high-probability risks (not just low-probability) and honest mitigation assessments"

generation_prompt_template: |
  You are producing a Business Case for engagement ${engagement.id} with ${client.name}.

  The topic is ${topic.title}. The sponsor is ${sponsor.name}, whose decision authority is ${sponsor.decision_authority}.

  STRUCTURE (follow exactly):
  ${structure_as_outline}

  CLIENT CONTEXT
  ${client.financial_profile}
  ${current_state_baseline_from_phase_1}
  ${target_state_from_phase_2}

  TOPIC INTELLIGENCE
  ${topic.vendor_landscape}
  ${topic.success_signals}
  ${topic.failure_modes}

  BENCHMARKS (use these for peer comparisons)
  ${industry_benchmarks_retrieved}

  QUALITY BAR
  ${quality_rubric.criteria}
  Do not produce a section that doesn't meet the rubric. If data is missing for a section,
  emit a placeholder marked [DATA GAP: description] so the user knows what to collect.

  Generate the complete business case now.

output_format: markdown
version: 1
maturity: production
```

### Deliverable 3.2 — Current State Assessment

[Structured template with 8 sections: context, methodology, findings-by-dimension (5-7 lenses), pattern analysis, peer benchmark comparison, gaps and opportunities, priority recommendations, appendices. Rubric emphasizes specificity + source traceability + honest pattern diagnosis.]

### Deliverable 3.3 — Target State Architecture

[Sections: vision statement, architectural principles, component view with diagrams, integration view, data flow, governance overlay, migration considerations, implementation approach. Rubric: clarity of principles, completeness of component coverage, realistic transition paths.]

### Deliverable 3.4 — Roadmap

[Sections: vision, phase definitions with gates, initiatives per phase, milestones, dependencies, resource plan, risk register, governance cadence. Visual: Gantt-style phase chart, dependency graph. Rubric: sequencing logic, dependency realism, gated decision points.]

### Deliverable 3.5 — Vendor Evaluation Scorecard

[Sections: context + requirements, evaluation methodology, vendor shortlist rationale, capability matrix with weighted scoring, commercial terms comparison, security posture assessment, reference check summary, recommendation with dissenting considerations, decision ask. Rubric: criterion clarity, scoring transparency, honest weaknesses listed.]

### Commit

```
feat(deliverables): seed 5 deliverable specifications with templates, data requirements, quality rubrics, generation prompts
```

---

## Phase 4 · Generation pipeline

**Intent:** When Nexus generates a deliverable, it follows a structured pipeline — not a single LLM call.

### File: `src/lib/agent/deliverable-generator.ts`

```typescript
export async function generateDeliverable(args: {
  engagementId: string;
  deliverableTypeKey: string;
  version?: number;
}): Promise<DeliverableVersion> {
  // 1. Load deliverable type spec
  const spec = await loadDeliverableType(args.deliverableTypeKey);

  // 2. Validate required data inputs — refuse generation if critical gaps
  const dataCheck = await validateRequiredInputs(args.engagementId, spec.required_data_inputs);
  if (dataCheck.criticalGaps.length > 0) {
    return createPlaceholderWithGaps(args, dataCheck.criticalGaps);
  }

  // 3. Assemble generation context
  const context = await assembleGenerationContext(args.engagementId, spec);
  // Pulls: client financials, topic intelligence, tech stack,
  //        cost breakdown, benchmarks, retrieved chunks, graph facts

  // 4. Fill prompt template
  const prompt = interpolateTemplate(spec.generation_prompt_template, context);

  // 5. Generate with Claude Opus 4.7 (not Sonnet — deliverables warrant the upgrade)
  const draft = await generate({
    model: 'claude-opus-4-7',
    prompt,
    max_tokens: 8000,
    temperature: 0.3,  // structured, not creative
  });

  // 6. Quality review pass — separate LLM call applying rubric
  const review = await reviewAgainstRubric({
    content: draft.text,
    rubric: spec.quality_rubric,
    model: 'claude-opus-4-7',
  });

  // 7. If critical rubric failure, revise once
  let finalContent = draft.text;
  if (review.total_score < 70 || review.critical_issues.length > 0) {
    const revision = await revise({
      original: draft.text,
      review,
      prompt: buildRevisionPrompt(spec, review),
    });
    finalContent = revision.text;
  }

  // 8. Persist version
  const version = await persistVersion({
    deliverable_id: args.deliverableId,
    version: (args.version ?? await getLatestVersion(args.deliverableId)) + 1,
    content: finalContent,
    structured_data: await parseStructuredData(finalContent, spec),
    quality_score: review.scores,
    quality_issues: review.remaining_issues,
  });

  return version;
}
```

### Quality rubric evaluation (separate Claude call)

```typescript
const RUBRIC_REVIEW_PROMPT = `
You are reviewing a deliverable against a quality rubric. Score it honestly — your job is
to raise the quality bar, not to approve mediocre work.

DELIVERABLE CONTENT
${content}

RUBRIC
${JSON.stringify(rubric, null, 2)}

For each rubric dimension, provide:
- score: 0-100
- specific_evidence: quotes or paragraph references showing why
- issues: specific gaps
- recommendations: how to fix each issue

Also return:
- critical_issues: dealbreakers that require revision (zero tolerance items failing)
- total_score: weighted average

Return JSON only.
`;
```

### Commit

```
feat(deliverables): generation pipeline with quality rubric evaluation + automatic revision
```

---

## Phase 5 · UI surfaces

**Intent:** Surface topics and deliverables in Intelligence (discovery/browsing) and the Engagement Console (production use).

### Intelligence · Library gets a Topics filter

Already has filters for Regulations, Frameworks, Benchmarks, Vendors, Research, Patterns, News. Add **Topics** as another content type.

Clicking a topic card opens a detail drawer showing the full topic spec:

```
ENGAGEMENT TOPIC · ANALYTICS MODERNIZATION

Industries: Healthcare · FinServ · Retail
Maturity: v1 · 4 prior engagements informed
Currently active in: Meridian (Phase 1 Diagnose)

TAGLINE
Consolidating sprawling data platforms into a governed, AI-ready estate

TYPICAL TRIGGERS
• Cloud data spend growing >30% YoY with unclear attribution
• Board-level AI strategy requires foundation that doesn't exist
...

KEY PATTERNS THAT EMERGE
• F004 · Data platform sprawl (78% historical trigger rate)
• F008 · AI ROI unclear (91%)
• F012 · Vendor lock-in risk (64%)

VENDOR LANDSCAPE
Core platforms: Snowflake, Databricks
Transformation: dbt, Informatica
Ingestion: Fivetran, Airbyte
...

PHASE PLAYBOOK
Phase 0 Charter: ...
Phase 1 Diagnose: ...
Phase 2 Design: ...
...

TYPICAL DELIVERABLES
→ Current State Assessment
→ Target State Architecture
→ Roadmap
→ Business Case
→ Vendor Evaluation Scorecard

SUCCESS SIGNALS
• 30%+ reduction in data platform count within 18 months
...

FAILURE MODES
• Lift-and-shift migration without governance uplift
...

[View engagements on this topic] [Compare topics]
```

### Engagement Console gets a Topics card

Top of the engagement page, beside Active Patterns:

```
TOPICS · 1 PRIMARY · 0 SECONDARY

[Analytics Modernization — primary]

Nexus is carrying Analytics Modernization intelligence into every turn —
14 patterns known, 8 vendor consolidation plays, 5 deliverable templates.

[View topic intelligence] [Add another topic]
```

### Deliverables panel in Engagement Console

New panel showing deliverable status + versions:

```
DELIVERABLES · 2 IN DRAFT · 1 SIGNED OFF

┌──────────────────────────────────────────────┐
│ BUSINESS CASE                  ● In draft v2 │
│ Analytics modernization investment proposal  │
│ Quality score: 78/100                        │
│ Issues: 2 (scenario rigor, 1 data gap)       │
│         [Edit] [Regenerate] [Request review] │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ CURRENT STATE ASSESSMENT       ● Signed off  │
│ Quality score: 91/100 · v3                   │
│ Signed by Sarah Chen · Apr 18                │
│                         [View] [View history]│
└──────────────────────────────────────────────┘

[+ Generate deliverable]
```

### Generation UX

Click "+ Generate deliverable" → modal:
```
Generate a deliverable

Type: [Business Case ▾]
Applicable topics: Analytics Modernization ✓
Required data:
  ✓ Phase 1 findings
  ✓ Phase 2 design
  ✓ Client financials
  ⚠ Sponsor decision authority (not specified)

Generate anyway? The deliverable will mark that gap as [DATA GAP].
[Cancel] [Generate]
```

Generation takes 15-40 seconds. Progress indicator shows each step (load spec → validate data → retrieve context → generate draft → quality review → revise → ready). Cognitive stages from Pack D Principle 1 surface the actual work.

### Commit

```
feat(topics-deliverables): UI surfaces — topics in Intelligence Library, topics + deliverables cards in Engagement Console
```

---

## Phase 6 · Graph integration + retrieval enhancement

**Intent:** Topics become graph nodes connected to engagements, patterns, vendors, deliverable types. Retrieval fires differently when an engagement has an assigned primary topic.

### Graph population

Each topic's `key_patterns` becomes a `(Topic)-[:COMMONLY_TRIGGERS]->(GenomePattern)` edge. Each topic's `vendor_landscape` becomes `(Topic)-[:USES_VENDOR]->(Vendor)` edges. Each topic's `typical_deliverables` becomes `(Topic)-[:PRODUCES]->(DeliverableType)` edges.

### Retrieval change

In `assembleRetrievalContext`:

```typescript
// If the engagement has primary topic(s), add a TOPIC INTELLIGENCE block to retrieval
const topics = await getEngagementTopics(args.engagementId);

if (topics.length > 0) {
  retrievalContext.topicIntelligence = topics.map(t => ({
    title: t.title,
    triggers: t.typical_triggers,
    patterns: t.key_patterns,
    vendor_landscape: t.vendor_landscape,
    diagnostic_questions_remaining: await getUnaskedQuestions(args.engagementId, t.topic_key),
    contradictions_to_scan: t.common_contradictions,
    phase_playbook_current_phase: t.phase_playbook[`phase_${currentPhase}`],
  }));
}
```

System prompt gets a labeled block:

```
TOPIC INTELLIGENCE: ANALYTICS MODERNIZATION (primary)

Current phase: Phase 1 Diagnose
Playbook priorities for this phase:
- Full inventory of data platforms + ingestion + transformation + BI layer
- Spend attribution across platforms
- Governance maturity assessment
- Data quality scorecards
- Interview 4-6 key stakeholders per function

Diagnostic questions not yet asked in this engagement (4 of 8):
- "Which business function is most vocal about data-platform failure?"
- "What data quality incidents have surfaced in the last 12 months?"
- "What's the board's AI timeline, and is analytics modernization the blocker?"
- "How many BI tools are in active production use?"

Contradictions to scan for in this engagement:
- vendor_overlap (not yet detected)
- cost_vs_governance (possible — client has $180K/mo ungoverned sandbox)
- bi_tool_proliferation (Tableau + Power BI + Looker all present in tech_stack)

Typical vendors in this landscape to probe about:
- Core: Snowflake, Databricks (client uses both — consolidation angle)
- BI: Tableau, Power BI, Looker (all three present)
```

Now Nexus knows what to ask, what to scan for, what patterns to expect. It stops being generic.

### Commit

```
feat(topics-deliverables): graph population + retrieval integration for topic intelligence
```

---

## Acceptance

### Topic intelligence test

Anand opens Meridian's analytics modernization engagement. Asks Nexus something open-ended:

*"What should I be asking Sarah next?"*

Before this pack: Nexus generalizes.

After this pack: Nexus pulls the topic's diagnostic_questions, cross-references with already-asked-in-turns, and returns specifically the 4 unasked questions, sequenced by probe_depth. With reasoning:

*"Four of the eight diagnostic questions from Analytics Modernization playbook haven't been asked yet. The highest-leverage one right now is 'What's the board's AI timeline, and is analytics modernization the blocker?' — because Sarah mentioned board pressure in turn 7 but hasn't specified timing. That answer determines whether we sequence governance work before or after platform migration."*

### Deliverable quality test

Anand asks Nexus: *"Draft a business case for the analytics modernization."*

Before this pack: 4 paragraphs of reasonable prose.

After this pack: 8-12 page structured document with Executive Summary (recommendation + numbers), Strategic Context (tied to Meridian's specific board pressure), Current State Baseline (actual Meridian tech stack + cost breakdown + F004/F008 pattern diagnosis), Target State Vision, Investment Requirement (phased $M table), Financial Return (NPV calculation with 3 scenarios + sensitivity), Qualitative Benefits, Implementation Approach, Risks & Mitigations (risk register table), Decision Ask.

Quality score visible: 82/100. Issues flagged: scenario rigor could be tighter; one data gap on internal labor cost assumption marked [DATA GAP: confirm fully-loaded FTE rate with Meridian HR]. Nexus proposes regeneration after the gap is filled.

A senior consultant would recognize this as work product, not LLM output.

---

## Bundled extras (from prior conversation)

Per your earlier "yes to all except multi-year trajectories," fold into existing packs:

### 1 · Shadow AI expansion

Expand Meridian shadow AI inventory from 9 to ~16 entries. Add: students/residents using consumer AI, offshore DevOps using Codeium personal accounts, finance using Copilot Studio unsanctioned, specific physicians named in incident reports, 3-4 more category types. Same for First Capital (expand to 10+) and Apex (expand to 9+). Updates Pack J seed scripts.

### 2 · Detailed vendor pricing breakdowns

Each vendor in the whitelist gets typical pricing metadata:
- pricing_model: 'per_seat' | 'per_api_call' | 'platform_fee' | 'hybrid'
- typical_monthly_range_enterprise
- contract_terms_typical: ['annual', 'multi_year_discount']

Enables Nexus to reason about *"You're on Cresta's mid-tier — enterprise tier unlocks at 5,000 agents, you're at 3,800 so annual commit should negotiate 18%."*

Adds to Pack J's vendor whitelist schema. ~half day of work.

Both bundle into the Pack J refresh rather than needing new packs.

---

## Paste-to-Claude-Code

> "Pack L · Topic Intelligence + Deliverable Quality. Six phases: migration 033 for engagement_topics + deliverable_types + deliverables + deliverable_versions + mapping table, seed 4 topics fully (analytics modernization + AI governance + prior auth + vendor consolidation), seed 5 deliverable specifications with quality rubrics, generation pipeline using Claude Opus 4.7 with structured rubric review + automatic revision, UI surfaces (Topics filter in Intelligence Library, Topics + Deliverables cards in Engagement Console), graph integration + retrieval enhancement so topic intelligence enters every Nexus turn on a topic-assigned engagement. Also bundle: Meridian shadow AI expansion 9→16, First Capital 4→10, Apex 5→9, vendor pricing metadata in whitelist. Worktree `feat/topics-deliverables`. Report after each phase."

---

## What this pack ships

Nexus stops being generic. On an analytics modernization engagement, it pulls 14 patterns, 8 diagnostic questions, specific contradictions to scan for, and the exact vendors that tend to appear. On a deliverable, it produces structured work product with financial modeling, sensitivity analysis, and honest risk registers — scored against a rubric and revised when gaps appear.

This is the pack that makes Shail stop and say *"wait, how did it do that?"* The answer: it's not a chatbot, it's a distilled consultant with structured intelligence per topic and structured quality gates per deliverable.

That's the moat from chatbot to advisory system.
