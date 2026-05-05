# Phase × Pattern Binding Matrix · Strategic Moves P0–P5

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack draft · read-only · no code or migration changes |
| Doctrine | `docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md` (locked 2026-05-05) |
| Naming   | External UI: "Strategic Move / Move". Internal substrate: `engagements` + `program_*`. API: `/api/v1/programs/*`. DB tables not renamed. |
| Predecessor | `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` (2026-04-29) — pre-doctrine inventory; this doc is the post-doctrine binding layer. |

## 1 · Doctrine summary

AbarVa Strategic Moves runs **P0..P5**. After P5, **Control Tower** owns execution tracking, value realization, and risk monitoring. Build / Execute / Verify are *not* Strategic Move phases. The Phase Rail surfaces a `→ TOWER` terminal indicator after P5 — that is a different surface, not a phase.

| Phase | Long label | Short (rail) | One-line mission |
|-------|------------|---------------|-----------------|
| P0    | Originate                  | Originate | Turn a signal/idea into a structured Move hypothesis. |
| P1    | Charter                    | Charter   | Convert the hypothesis into a sponsor-backed charter. |
| P2    | Discover & Diagnose        | Diagnose  | Establish the current-state baseline and root causes. |
| P3    | Design Future State        | Design    | Design the future-state solution (incl. agentic AI where relevant). |
| P4    | Roadmap & Business Case    | Roadmap   | Convert the design into an executable plan with economics. |
| P5    | Mobilize & Handoff         | Mobilize  | Prepare team, governance, and operating model for delivery; hand off to Tower. |

## 2 · Per-phase config schema (21 fields)

Every phase in the Nexus runtime should be configurable against this schema. Field semantics:

| # | Field                       | Purpose |
|---|-----------------------------|---------|
| 1 | `phase_id`                  | Integer 0..5. Source of truth for `engagements.current_phase`. |
| 2 | `phase_name`                | User-facing label (`PHASE_LABELS` from `src/lib/programs/phase-labels.ts` post-impl). |
| 3 | `phase_intent`              | One-sentence mission. |
| 4 | `entry_criteria`            | What must be true to enter. Derived from prior gate. |
| 5 | `workflow_steps`            | 4–6 concrete steps Nexus walks the user through. Bind to `PhasePack.steps` (`src/lib/programs/phase-packs/types.ts`). |
| 6 | `required_patterns`         | Pattern IDs that MUST be loaded before guidance. |
| 7 | `optional_patterns`         | Patterns surfaced when triggered by signals/keywords. |
| 8 | `required_artifacts`        | Outputs Nexus must produce/update before gate. |
| 9 | `optional_artifacts`        | Outputs produced when applicable. |
|10 | `workshop_playbooks`        | Session templates (objectives, agenda, attendees, decisions, evidence). |
|11 | `meeting_templates`         | Pre-read, agenda, follow-up templates. |
|12 | `agent_questions`           | Question library Nexus draws from to coach. |
|13 | `coaching_rules`            | When to challenge, when to defer, when to escalate. |
|14 | `evidence_requirements`     | What counts as fact, assumption, or unsupported. Hard vs. soft. |
|15 | `failure_modes_to_check`    | Failure-mode IDs (the 10-id catalog) and keys (the 12-key catalog) Nexus must surface. |
|16 | `value_levers`              | The value drivers Nexus links outcomes to. |
|17 | `sourcing_triggers`         | Conditions that spawn a `/source` workflow. |
|18 | `gate_criteria`             | Hard checks for advance (per `governance.ts GATE_RULES`). |
|19 | `self_approval_rules`       | When the authorized user can self-approve vs. needs founder approval. |
|20 | `artifact_generation_rules` | What Nexus may auto-draft, what requires user direction. |
|21 | `anti_hallucination_rules`  | What may not be inferred; what must be uploaded; what must be confirmed. |

## 3 · P0 — Originate

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 0 |
| 2 | `phase_name` | `P0 Originate` |
| 3 | `phase_intent` | Turn a signal, pain point, idea, or opportunity into a structured Move hypothesis. |
| 4 | `entry_criteria` | None (entry phase). User has a signal or upload (note, deck, KPI report, exec ask). |
| 5 | `workflow_steps` | (1) Identify business problem/opportunity · (2) Classify Move archetype · (3) Identify likely sponsor · (4) Define early value range · (5) Check foundation readiness · (6) Prepare P1 charter skeleton. |
| 6 | `required_patterns` | `seed-patterns-industry.ts` (8 patterns) · AI use-case discovery patterns from `seed-patterns-ai-programs.ts` (subset) · `program-lifecycle-patterns.ts` PAT-PRG-* origination subset. |
| 7 | `optional_patterns` | Signal-triggered: `signal_catalog.recommended_pattern_keys[]`; vendor patterns when product is named in input. |
| 8 | `required_artifacts` | Origination Brief · Move Hypothesis · Archetype Recommendation · Sponsor Candidate Map · Foundation Readiness Snapshot · P1 Charter Draft Skeleton. |
| 9 | `optional_artifacts` | Similar-Prior-Move comparison · pattern-match log entry. |
|10 | `workshop_playbooks` | 30-min framing session: problem framing → value hypothesis → sponsor alignment → evidence needed → decision to charter. |
|11 | `meeting_templates` | Pre-read: 1-page hypothesis brief. Agenda: framing + decision. Follow-up: capture sponsor name + charter trigger. |
|12 | `agent_questions` | "What outcome do you want?" · "Who cares?" · "What evidence do you have?" · "What value might be at stake?" · "Have we run a similar Move before?" |
|13 | `coaching_rules` | Push for one outcome, not many. Block on missing sponsor candidate. Surface relevant prior Moves before letting user describe the problem from scratch. |
|14 | `evidence_requirements` | Soft: a written problem statement, named sponsor candidate, value range with assumptions. Hard: archetype assigned, tenant/function scope set. |
|15 | `failure_modes_to_check` | **10-id catalog**: 1 (sponsorship), 2 (unclear problem def), 4 (talent), 10 (unrealistic expectations). **12-key catalog**: `no_business_owner`, `poor_use_case_framing`, `ai_tool_sprawl_without_value`. |
|16 | `value_levers` | Cost-out, revenue-up, cycle-time, defect-down, adoption, risk-down. (Surface 3 most likely from input.) |
|17 | `sourcing_triggers` | None at P0 (sourcing decision deferred to P3/P4). |
|18 | `gate_criteria` | Per `GATE_RULES` P0→P1 (hard): hypothesis clear · sponsor candidate identified · archetype assigned · tenant/function scope set · initial value range estimated · risks/failure modes flagged. |
|19 | `self_approval_rules` | Authorized founder/admin can self-promote if all gate checks pass. Sponsor candidate alone (without sign-off) is sufficient for P0 → P1. |
|20 | `artifact_generation_rules` | Nexus drafts: brief, hypothesis, sponsor map, readiness snapshot. Nexus does **not** assign sponsor without user confirmation. |
|21 | `anti_hallucination_rules` | Do not invent KPIs, baseline values, or sponsor names. Mark all numeric claims `assumption` until evidence is uploaded or confirmed. |

## 4 · P1 — Charter

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 1 |
| 2 | `phase_name` | `P1 Charter` |
| 3 | `phase_intent` | Convert the hypothesis into a sponsor-backed charter with scope, success metrics, and decision rights. |
| 4 | `entry_criteria` | P0 gate passed. Sponsor candidate confirmed. |
| 5 | `workflow_steps` | (1) Define problem statement · (2) Define target outcome + success metrics · (3) Bound scope · (4) Map stakeholders + decision rights · (5) Document value range + assumptions · (6) Draft initial workplan. |
| 6 | `required_patterns` | Charter patterns (subset of `seed-patterns-architecture.ts` + `seed-patterns-meta.ts`) · stakeholder/decision-rights patterns · value-metric patterns. |
| 7 | `optional_patterns` | Industry charter examples · sponsor-archetype patterns · sourcing-charter patterns when SI/vendor is in scope. |
| 8 | `required_artifacts` | Program Charter · Stakeholder Map · Success Metric Tree · Hypothesis Tree · Initial Workplan · Decision Log. |
| 9 | `optional_artifacts` | Sponsor briefing deck · investment-case skeleton. |
|10 | `workshop_playbooks` | Sponsor kickoff (90 min): hypothesis recap → success metrics → scope boundaries → decision rights → assumptions → workplan. Pre-read: charter skeleton. |
|11 | `meeting_templates` | Sponsor kickoff agenda · stakeholder alignment session · decision-rights workshop · post-session summary template. |
|12 | `agent_questions` | "Your scope is too broad — let's tighten to one sponsor-owned outcome." · "Here are 3 candidate success metrics. Which is measurable today?" · "Who has decision rights on scope?" · "What's the baseline you'll measure against?" |
|13 | `coaching_rules` | Reject success metrics without baseline. Reject scope that exceeds sponsor authority. Block charter sign without named decision owners. |
|14 | `evidence_requirements` | Hard: sponsor confirmation, success metric named with measurable baseline path, decision owners identified. Soft: value-range bounds, key assumptions listed. |
|15 | `failure_modes_to_check` | **10-id**: 1 (sponsorship), 2 (problem def), 3 (data foundation — early signals), 4 (talent). **12-key**: `no_business_owner`, `no_measurable_baseline`, `poor_use_case_framing`. |
|16 | `value_levers` | Same library as P0 plus: lever ranking against sponsor's top 3 KPIs. |
|17 | `sourcing_triggers` | Soft signal only: if charter scope implies external SI/AMS, surface a flag for P3 sourcing decision; do not start a /source event yet. |
|18 | `gate_criteria` | Per `GATE_RULES` P1→P2 (post-impl PR doctrine): sponsor confirms · success metrics defined with baseline path · scope bounded · decision owners known · value range documented · key assumptions labeled. |
|19 | `self_approval_rules` | Sponsor sign-off is required (cannot be self-approved by program lead alone). |
|20 | `artifact_generation_rules` | Nexus drafts charter, metric tree, stakeholder map. Nexus does **not** assign decision rights — those must be confirmed in workshop output. |
|21 | `anti_hallucination_rules` | Do not synthesize stakeholder titles, decision rights, or sponsor commitments. Do not assert value bounds without an explicit assumption ledger. |

## 5 · P2 — Discover & Diagnose

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 2 |
| 2 | `phase_name` | `P2 Discover & Diagnose` |
| 3 | `phase_intent` | Establish the current-state baseline and root causes; lock evidence. |
| 4 | `entry_criteria` | P1 gate passed. Sponsor-signed charter exists. |
| 5 | `workflow_steps` | (1) Capture current process / systems / data · (2) Quantify baseline (cost / cycle / defect / adoption) · (3) Run interviews + workshops · (4) Run diagnostics · (5) Synthesize root causes · (6) Lock baseline. |
| 6 | `required_patterns` | Diagnostic interview patterns · current-state process patterns · data/system assessment patterns from `seed-patterns-architecture.ts` · `seed-patterns-cdp.ts` (when data is in scope) · AI-readiness subset of `seed-patterns-ai-programs.ts`. |
| 7 | `optional_patterns` | Industry benchmark patterns · vendor-specific diagnostics (22 vendor seeds in `seed-patterns-sourcing-vendors-*.ts`) · Source lifecycle patterns S0–S2 mapping. |
| 8 | `required_artifacts` | Current-State Assessment · Process Map · Data/System Map · Pain Point Register · Financial Baseline · Root Cause Analysis · Benchmark Comparison. |
| 9 | `optional_artifacts` | Persona maps · journey maps · risk register draft. |
|10 | `workshop_playbooks` | Discovery interviews (per persona) · current-state workshop (mixed group) · baseline review (sponsor + finance). Each with interview guides, agendas, synthesis templates, open-question logs. |
|11 | `meeting_templates` | Per-persona interview guide · current-state workshop board · baseline review pre-read. |
|12 | `agent_questions` | "Do you have ticket volume / cycle time / cost / defect / adoption data?" · "What's the source of this number?" · "What's the leading vs. lagging indicator here?" |
|13 | `coaching_rules` | Reject "perceived issues" without measurable baseline. Push for quantified pain. Surface failure mode 3 (data foundation) early if the org cannot produce baseline data. |
|14 | `evidence_requirements` | Hard: baseline values with provenance (system, time-window, owner). Soft: persona quotes, observed workflow gaps, pattern-match confidence. |
|15 | `failure_modes_to_check` | **10-id**: 2 (problem def), 3 (data foundation), 6 (governance/privacy). **12-key**: `weak_data_foundation`, `no_measurable_baseline`, `missing_governance_risk`. |
|16 | `value_levers` | Quantified per lever from baseline (e.g., $X/yr at current AHT, $Y/yr at current MAPE/WAPE). |
|17 | `sourcing_triggers` | If diagnosis reveals capability gap or vendor lock-in, raise P3 sourcing flag. Still no /source event. |
|18 | `gate_criteria` | Per `GATE_RULES` P2→P3 (hard): baseline locked · evidence linked · root causes ranked · pain points validated · sponsor agrees diagnosis is accurate. |
|19 | `self_approval_rules` | Sponsor confirmation required for diagnosis sign-off. Program lead can self-approve component-level findings. |
|20 | `artifact_generation_rules` | Nexus drafts current-state synthesis from uploaded inputs only. Nexus does **not** synthesize baseline numbers it didn't ingest. |
|21 | `anti_hallucination_rules` | Numeric claims must cite source (system / time-window / uploaded artifact). No invented quotes. No invented systems on the architecture map. |

## 6 · P3 — Design Future State

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 3 |
| 2 | `phase_name` | `P3 Design Future State` |
| 3 | `phase_intent` | Design the future-state solution. **This is where AI / agentic architecture is designed where relevant.** Not just "use agents" — a structured human-vs-agent task split. |
| 4 | `entry_criteria` | P2 gate passed. Baseline locked, root causes ranked. |
| 5 | `workflow_steps` | (1) Design target workflow · (2) Decide human-vs-agent task split · (3) Choose model/provider strategy · (4) Define data + integration architecture · (5) Define governance + safety controls · (6) Pick build/buy/partner; emit decision memo. |
| 6 | `required_patterns` | Future-state workflow patterns · agentic architecture patterns from `seed-patterns-architecture.ts` · model/provider patterns · `seed-patterns-sourcing-regulatory-ai.ts` (AI governance) · `pattern-augmentations.ts` vendor-depth overlays. |
| 7 | `optional_patterns` | Vendor-specific design patterns (22 seeds) · `seed-patterns-cdp.ts` for data plane · industry-specific solution patterns. |
| 8 | `required_artifacts` | Future-State Design · Agentic Architecture Blueprint · Human/Agent Workflow Map · Data & Integration Blueprint · Governance/Risk Design · Option Comparison · Decision Memo. |
| 9 | `optional_artifacts` | Reference architecture · vendor shortlist · TCO sensitivity model. |
|10 | `workshop_playbooks` | Solution design workshop · architecture review (incl. security/data/legal) · AI risk review · decision workshop. |
|11 | `meeting_templates` | Design workshop with option matrix pre-read · architecture review checklist · AI risk review checklist · decision-workshop facilitation script. |
|12 | `agent_questions` | "What stays human-owned?" · "What is agent-assisted?" · "What can be agent-executed with approval?" · "What evidence raises autonomy?" · "What is the model fallback?" · "What's the data refresh cadence?" |
|13 | `coaching_rules` | Reject "use agents" without task-by-task ownership map. Reject AI design without a governance section. Reject build choice without a build-vs-buy comparison. |
|14 | `evidence_requirements` | Hard: signed design memo, named integrations, named governance owner. Soft: model selection rationale, vendor evaluations. |
|15 | `failure_modes_to_check` | **10-id**: 5 (commitment to operating-model change), 6 (governance late), 7 (vendor / build-vs-buy errors). **12-key**: `weak_workflow_integration`, `tool_first_thinking`, `missing_governance_risk`, `no_operating_model_for_scale`. |
|16 | `value_levers` | Bind levers to workflow changes (e.g., AHT delta from agent assist; defect-reduction from validation step). Express each as range + confidence. |
|17 | `sourcing_triggers` | **Hot** trigger. If the design implies external SI / model vendor / data partner, spawn a `/source` event scoped to vendor selection. Surface a `Sourcing/SI Partner Decision Brief` artifact. |
|18 | `gate_criteria` | Per `GATE_RULES` P3→P4 (hard): future-state design approved · AI/human workflow clear · architecture reviewed · risks identified · data readiness known · decision memo signed. |
|19 | `self_approval_rules` | Decision memo signature required from sponsor + architecture lead. Program lead alone cannot self-approve. |
|20 | `artifact_generation_rules` | Nexus drafts: workflow map, architecture skeleton, governance section, option matrix. Nexus does **not** select a vendor (output is a shortlist; selection is a P3/P4 decision). |
|21 | `anti_hallucination_rules` | Do not assert vendor capabilities without citing vendor docs from `seed-patterns-sourcing-vendors-*.ts` or uploaded vendor materials. Do not assume model SLA, latency, or pricing without source. |

## 7 · P4 — Roadmap & Business Case

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 4 |
| 2 | `phase_name` | `P4 Roadmap & Business Case` |
| 3 | `phase_intent` | Convert the design into an executable plan with economics: roadmap, estimates, business case, value plan, change plan, sourcing plan. |
| 4 | `entry_criteria` | P3 gate passed. Design + decision memo signed. |
| 5 | `workflow_steps` | (1) Define roadmap + sequencing · (2) Estimate effort, cost, time · (3) Build value-realization plan · (4) Build change plan · (5) Lock measurement model · (6) Commit sourcing/SI direction. |
| 6 | `required_patterns` | Roadmap patterns · estimation patterns · value-realization patterns from `seed-patterns-meta.ts` · business-case templates · sourcing-decision patterns from `seed-patterns-sourcing-process*.ts`. |
| 7 | `optional_patterns` | SI/vendor selection patterns · category-specific sourcing patterns · change-management patterns · `pattern-augmentations.ts` overlays. |
| 8 | `required_artifacts` | Implementation Roadmap · Estimate Model · Business Case · Value Realization Plan · Change Plan · Risk Plan · Sourcing/SI Partner Decision Brief. |
| 9 | `optional_artifacts` | Investment-committee deck · funding paper · sensitivity analysis. |
|10 | `workshop_playbooks` | Roadmap workshop · business case review · investment committee prep · sourcing strategy session (if needed). |
|11 | `meeting_templates` | Roadmap-workshop pre-read with phasing options · business-case review template · IC prep deck template · sourcing-strategy briefing. |
|12 | `agent_questions` | "What's the funding constraint?" · "What's the value realization curve?" · "Where does SI/vendor risk concentrate?" · "What's the change-management owner?" · "What's the measurement cadence?" |
|13 | `coaching_rules` | Reject roadmap without sequencing rationale. Reject business case without sensitivity analysis. Connect to /source workflow when SI dependency, multi-vendor risk, or material spend is present. |
|14 | `evidence_requirements` | Hard: signed business case, named change owner, named delivery partner direction (in-house / SI / hybrid). Soft: value curve assumptions, risk assumptions. |
|15 | `failure_modes_to_check` | **10-id**: 7 (vendor / build-buy), 8 (pilot-to-production), 9 (measurement). **12-key**: `no_value_ledger`, `pilot_purgatory`, `no_adoption_change_plan`, `no_operating_model_for_scale`. |
|16 | `value_levers` | Lever-by-lever value curve (year 1 / year 2 / steady-state). Each curve has confidence band and assumption ledger. |
|17 | `sourcing_triggers` | **Mandatory** trigger if direction = SI/hybrid: a Source event must be in flight before P4 → P5. The decision brief in this phase enables P5 mobilization. |
|18 | `gate_criteria` | Per `GATE_RULES` P4→P5 (hard, post-impl PR — folds the legacy P5→P6 funding/handoff checks into this gate): roadmap accepted · business case validated · value ledger defined · funding path clear · sourcing path decided · change plan drafted. |
|19 | `self_approval_rules` | Sponsor + finance + (if applicable) sourcing lead sign-off required. Program lead alone cannot promote. |
|20 | `artifact_generation_rules` | Nexus drafts: roadmap, estimate model skeleton, business case skeleton, value plan, sourcing brief. Nexus does **not** commit to vendor or sign business case. |
|21 | `anti_hallucination_rules` | All financial values must trace to: baseline (P2), design assumption (P3), or uploaded estimate. No invented effort hours. No invented vendor pricing. No "industry average" claim without source. |

## 8 · P5 — Mobilize & Handoff

| # | Field | Binding |
|---|-------|---------|
| 1 | `phase_id` | 5 |
| 2 | `phase_name` | `P5 Mobilize & Handoff` |
| 3 | `phase_intent` | Mobilize the team, governance, and operating model; hand off to delivery / Tower. **This is not "execution" — it is mobilization. Execution sits in Tower.** |
| 4 | `entry_criteria` | P4 gate passed. Business case + roadmap + sourcing direction signed. |
| 5 | `workflow_steps` | (1) Mobilize delivery team · (2) Confirm governance + RACI · (3) Onboard SI/vendor (if applicable) · (4) Set operating cadence · (5) Configure Tower monitoring + value tracking · (6) Sponsor handoff. |
| 6 | `required_patterns` | Mobilization patterns · governance patterns · RACI patterns · handoff patterns · SI onboarding from `seed-patterns-sourcing-process-renewals.ts` and `seed-patterns-sourcing-process.ts` · Tower / value-tracking patterns. |
| 7 | `optional_patterns` | Change adoption patterns · cross-org communications patterns. |
| 8 | `required_artifacts` | Mobilization Plan · Delivery Handoff Pack · Governance Charter · RACI · SI Onboarding Pack (if applicable) · Change Readiness Plan · Tower Handoff Plan · Value Tracking Setup. |
| 9 | `optional_artifacts` | Operating-cadence calendar · escalation tree · risk register handoff. |
|10 | `workshop_playbooks` | Mobilization kickoff · SI/vendor onboarding · governance launch · sponsor handoff · Tower handoff. |
|11 | `meeting_templates` | Mobilization kickoff agenda · vendor-onboarding checklist · governance-launch deck · sponsor-handoff template · Tower-handoff template. |
|12 | `agent_questions` | "Who is the named delivery owner?" · "What's the value tracking cadence?" · "What's the escalation path?" · "When is the first Tower review?" · "What's the change-adoption KPI?" |
|13 | `coaching_rules` | Block handoff without: named owner, value cadence, escalation path. Surface failure mode 8 (pilot-to-production) and 9 (measurement) as readiness checks. |
|14 | `evidence_requirements` | Hard: named delivery owner, governance charter signed, Tower receiver named, value-tracking baseline locked. Soft: change-readiness signal. |
|15 | `failure_modes_to_check` | **10-id**: 5 (commitment to OM change), 8 (pilot-to-production), 9 (measurement). **12-key**: `no_adoption_change_plan`, `no_operating_model_for_scale`, `pilot_purgatory`, `no_value_ledger`. |
|16 | `value_levers` | Locked baseline values + tracking cadence + ownership for each lever. (Tower picks up from here.) |
|17 | `sourcing_triggers` | If sourcing direction was SI/hybrid: SI must be onboarded with contract / SOW signed. P5 cannot complete otherwise. |
|18 | `gate_criteria` | Final hard gate (post-impl PR retires the legacy P5→P6 gate; mobilization checks fold into P4→P5 + P5 completion criteria): owner assigned · governance active · delivery team mobilized · artifacts handed off · Tower / value tracking configured · sponsor accepts handoff. |
|19 | `self_approval_rules` | Sponsor sign-off + Tower receiver acknowledgment required. |
|20 | `artifact_generation_rules` | Nexus drafts: mobilization plan, RACI, governance charter, Tower handoff pack, value-tracking setup. Nexus does **not** authorize go-live. |
|21 | `anti_hallucination_rules` | Do not assert delivery readiness from absence of evidence. If owner / cadence / escalation is missing, the gate fails — Nexus must say so explicitly. |

## 9 · Repo artifact bindings (where Nexus reads from today)

This is the substrate Nexus already has. Per-phase config above must wire to it.

### SQL substrate
- `genome_patterns` — `supabase/migrations/001_three_layer_data_model.sql` (Layer 3 Genome store)
- `engagement_topics`, `engagement_topics_map` — `supabase/migrations/040_topics.sql` (programs pattern/topic catalog with `key_patterns[]`, `industries`, `playbooks`, `failure_modes`)
- `pattern_match_logs`, plus `engagement_topics` extensions (`promotion_state`, `deployment_count`, `successful_deployment_count`, `canonical_shape_json`) — `supabase/migrations/041_programs_foundation.sql`
- `pattern_packs` — `supabase/migrations/20260421152501_intelligence_layer_core.sql` (tenant-scoped, with `sector_applicability[]`, `trigger_symptoms[]`, `detection_signals jsonb`, `diagnostic_questions[]`, `evidence_requirements jsonb`, `likely_root_causes jsonb`, `intervention_options jsonb`, `anti_patterns jsonb`, `common_failure_modes jsonb`)
- `foundational_pattern_packs`, `foundational_pattern_variants` — `supabase/migrations/20260421152901_foundational_patterns_and_legal_contexts.sql`
- `emergent_patterns` — `supabase/migrations/20260420170400_emergent_patterns.sql`
- `signal_catalog.recommended_pattern_keys[]` — `supabase/migrations/20260421151100_signal_catalog.sql`
- `intelligence_*.retrieved_pattern_ids[]`, `cited_pattern_ids[]` — `supabase/migrations/20260430103000_intelligence_surface_data_layer.sql`
- `source_artifacts.used_pattern_ids[]` — `supabase/migrations/20260430220000_source_artifact_registry.sql`
- `reasoning_telemetry_events.pattern_id` — `supabase/migrations/20260428180000_reasoning_telemetry_events.sql`

### TS pattern corpus (all consumed by `src/lib/intelligence/loader.ts` `DEFAULT_PATTERNS`)
| Domain | File | Approx. count |
|--------|------|--------------:|
| ai_programs | `src/lib/intelligence/seed-patterns-ai-programs.ts` | 14 |
| architecture | `src/lib/intelligence/seed-patterns-architecture.ts` | 10 |
| cdp | `src/lib/intelligence/seed-patterns-cdp.ts` | 10 |
| industry | `src/lib/intelligence/seed-patterns-industry.ts` | 8 |
| meta | `src/lib/intelligence/seed-patterns-meta.ts` | 6 |
| sourcing | `src/lib/intelligence/seed-patterns-sourcing*.ts` (categories + contracts/audit/commercial + pricing/cloud + process/renewals/advanced + regulatory/ai) | 101 |
| vendors | `src/lib/intelligence/seed-patterns-sourcing-vendors-{acquia, adyen, algolia, asana, azure, bloomreach, cloudflare, contentstack, coupa, docusign, elastic, github, gitlab, googlecloud, newrelic, optimizely, oraclecloud, sap, servicenow, smartsheet, splunk, square}.ts` | 22 files |
| program lifecycle | `src/lib/intelligence/program-lifecycle-patterns.ts` | 6 (`PAT-PRG-*` at lines 349, 628, 905, 1193, 1479, 1775) |
| source lifecycle | `src/lib/intelligence/source-lifecycle-patterns.ts` | 7 (`PAT-SRC-*`) |
| source category | `src/lib/intelligence/source-lifecycle-patterns-cat.ts` | 12 (`PAT-SRC-CAT-*`) |

Per the existing 2026-04-29 audit at `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md`: total primitives = **198** (149 patterns, 30 signals, 9 solutions, 10 contradictions). Re-verify counts when this binding goes into impl.

### Classifier
- `src/lib/programs/classifier.ts` — 3 stages: Anthropic claude-haiku intent extraction → OpenAI text-embedding-3-large 1024d Pinecone match (namespace `public-patterns`) → score with `engagement_topics` enrichment.
- Weights: `W_VECTOR 0.4 · W_ARCHETYPE 0.2 · W_INDUSTRY 0.15 · W_ENTITY 0.15 · W_SUCCESS 0.1`. Threshold `0.4`. Top 3.
- Output type `PatternClassifierMatch` in `src/lib/programs/types.db.ts:145-180` with `band: high|medium|low|no_match` and `suggestedAction: pattern|template|custom`.
- Consumers: `src/app/api/v1/programs/originate/route.ts`, `from-thread/route.ts`, `route.ts` → `logClassifierDecision` → `pattern_match_logs`.

### Phase packs (current state, **incoherent with 6-phase doctrine**)
- `src/lib/programs/phase-packs/` exposes **P0..P6** today: `P0_ORIGINATE`, `P1_DISCOVERY`, `P2_SYNTHESIS`, `P3_DESIGN`, `P4_BUILD`, `P5_ACTIVATE`, `P6_OPERATE`. Old vocabulary entirely. **See § 11 · Reconciliation items #2.**
- Type schema in `src/lib/programs/phase-packs/types.ts`: `PhasePack { phase, label, outcome, definitionOfDone[], rightQuestions { open, converge, close }, antiPatterns[], coachingArc { entry, midPhase, exit }, dependencies { requiresFromPrior[], producesForNext[] }, steps?: PhaseStep[] }`. Fields below maps to per-phase config schema:

| Phase pack field | This doc field |
|------------------|----------------|
| `outcome`, `definitionOfDone` | `phase_intent`, `gate_criteria` |
| `rightQuestions` | `agent_questions`, `coaching_rules` |
| `steps[]` (with `agentRole: extract \| validate \| coach_workshop \| coach_interview \| coach_baseline \| evaluate_evidence \| request_approval \| flag_anti_pattern \| compose_artifact`) | `workflow_steps`, `artifact_generation_rules` |
| `antiPatterns` | `anti_hallucination_rules`, `failure_modes_to_check` |
| `dependencies.requiresFromPrior \| producesForNext` | `entry_criteria`, `required_artifacts` |
| `PhaseEvidenceItem { severity: hard \| soft }` | `evidence_requirements` |
- Consumed by `src/app/api/chat/agent/route.ts:381-384` via `formatPhasePackForPrompt(getPhasePack(promptPhase))`.

### Source stage packs
- `src/lib/source/stage-packs/` (S0..S7) reuses `PhaseEvidenceItem` + `crossReferences.patternIds`, `sourceStageKeys`. Composed via `buildSourceStagePackBlock` + `buildSourceLifecycleContract`. Map at `SOURCE_STAGE_KEY_TO_PACK_STAGE` (~lines 1619-1637).

### Archetypes
- `src/lib/programs/types.ui.ts:6-11`: 5 keys — `strategic_transformation`, `workflow_automation`, `platform_modernization`, `ai_product_enablement`, `operational_optimization`.
- Heuristic mapping: `src/lib/programs/archetype-normalization.ts`.
- Cross-ref: `intelligence/seeds/archetype-phase-deliverable-matrix.json` restates the same 5 keys.

### Failure modes — **two catalogs (must reconcile, see § 11)**
- (a) **10-id catalog**: `src/lib/programs/failure-modes.ts` — IDs 1..10 with `primaryPhases: number[]`. **Currently has P6 references in items 5 (`[3, 5, 6]`), 9 (`[1, 5, 6]`), 10 (`[0, 6]`) — incoherent with the 6-phase doctrine.** Narrative text still uses old vocabulary ("P5 Activate", "P6 Operate").
- (b) **12-key catalog**: `src/lib/intelligence/ai-program-failure-modes.ts` — keys: `weak_data_foundation`, `poor_use_case_framing`, `no_business_owner`, `no_measurable_baseline`, `no_value_ledger`, `weak_workflow_integration`, `tool_first_thinking`, `missing_governance_risk`, `no_adoption_change_plan`, `no_operating_model_for_scale`, `pilot_purgatory`, `ai_tool_sprawl_without_value`. Surfaced by `src/lib/programs/failure-mode-prompt.ts`.

### Generated manifest + ancillaries
- `src/lib/intelligence/generated/pattern-manifest.json` — 17-pattern design-pack manifest (`generatedAt` 2026-04-23, `sourceDir "Patterns"`). **Overlaps the corpus by slug, not by ID.** Don't treat as the full corpus manifest.
- `src/lib/intelligence/pattern-manifest.ts` — `PatternManifestEntry` shape.
- `src/lib/intelligence/pattern-augmentations.ts` — vendor-depth overlays.
- `src/lib/intelligence/pattern-graph-validation.ts` — uses the 17-entry generated manifest only (not full corpus).
- `src/lib/intelligence/pattern-deliverable-query.ts` — Neo4j feature-flagged.
- `src/lib/intelligence/agent-retrieval.ts` — `STAGE_PATTERN_MAP` (~45-56), `CATEGORY_KEYWORD_MAP`.
- `src/lib/intelligence/j0-failure-mode-cards.ts` — Intelligence Surface (J0) failure-mode UI; bind separately from the 10/12 catalogs.

## 10 · Governance gates (post-impl-PR target state)

Per the impl PR `cursor/6-phase-model-impl-c31e` (PR #1517) which rewrites `src/lib/programs/governance.ts`:

| Gate         | Type | Folded from | Notes |
|--------------|------|-------------|-------|
| P0 → P1      | hard | unchanged | Hypothesis → Charter authorization. |
| P1 → P2      | hard | new       | Sponsor-signed charter → Discovery. (Was missing in pre-doctrine main.) |
| P2 → P3      | hard | unchanged | Diagnosis approved → Design. |
| P3 → P4      | hard | unchanged | Design signed → Roadmap. |
| P4 → P5      | hard | folds legacy P5→P6 funding/handoff checks | Business case approved · readiness · funding/sponsor alignment · Tower handoff path. |
| P5 → ø       | n/a  | retired   | `findGateRule(5, 6) === null`. After P5, Tower owns. |

Until PR #1517 lands, `main` still has `P5→P6` and is missing `P1→P2`. Plan accordingly.

## 11 · Reconciliation items (must resolve before code wires this binding)

These are blockers for any impl that uses the matrix above. The audit ask called them out; the impl PR did not address them.

1. **`src/lib/programs/failure-modes.ts` P6 references.** Items 5, 9, 10 still carry P6 in `primaryPhases` and the narrative still says "P5 Activate / P6 Operate." Under doctrine, P5 = "Mobilize & Handoff" and P6 doesn't exist. **Action:** rewrite items 5, 9, 10 to retire P6 and remap to P5 (or, where the failure is genuinely post-handoff, mark the failure mode as "Tower-owned" rather than carrying it on the Move).
2. **`src/lib/programs/phase-packs/` carries P6_OPERATE.** Old vocabulary across the whole registry (`P1_DISCOVERY`, `P2_SYNTHESIS`, `P3_DESIGN`, `P4_BUILD`, `P5_ACTIVATE`, `P6_OPERATE`). Agent route reads this every turn (`src/app/api/chat/agent/route.ts:381-384`). Until renamed/retired, Nexus coaches users with the wrong vocabulary. **Action:** either retire P6_OPERATE entirely (Tower surface), or move it into a separate `tower-packs/` registry. Rename P0..P5 packs to doctrine labels.
3. **Two failure-mode catalogs (10-id vs 12-key).** Pick canonical, deprecate other (or formally federate). The 10-id catalog is bound to programs gate evaluation; the 12-key catalog is bound to AI-program prompts. Today they overlap inconsistently (e.g., 10-id #3 "data foundation" ≈ 12-key `weak_data_foundation` but with different phase bindings). **Action:** produce a federation map and pick one as the gate-evaluation canon.
4. **`pattern_packs.likely_root_causes / intervention_options / common_failure_modes`** are jsonb with no schema doctrine. **Action:** publish a JSON schema for each before Nexus is told to compose against them.
5. **Source stage packs (S0..S7) unaligned with the 6-phase Move model.** They still use the old 8-phase Programs vocabulary in their cross-references. **Action:** map S0..S7 → P0..P5 explicitly (likely S0..S2 ↔ P2/P3, S3..S5 ↔ P4, S6..S7 ↔ P5).
6. **17-pattern generated manifest vs 198-primitive corpus.** The manifest is design-pack only; many components reference it as if it were the corpus. **Action:** rename/retag the manifest to make the scope explicit (e.g., `pattern-design-pack-manifest.json`) and update every reader.
7. **Naming doctrine drift.** External UI says "Strategic Move", DB says `engagements`, API says `programs`, internal docs mix all three. **Action:** publish the naming map (one page) and reference it from every README touched by this work.

## 12 · Open questions (need user input before this binding goes to impl)

- **Q1**: For each phase, should `required_patterns` be enumerated by **pattern ID** (precise but brittle) or by **pattern category + tag** (forgiving but ambiguous)? My recommendation is *pattern ID with category fallback* but it constrains pattern authoring.
- **Q2**: Self-approval scope — should program leads be able to self-approve P1 → P2 with a delegation token from the sponsor? Or always require sponsor click?
- **Q3**: The 22 vendor seeds are deeply specific. Should they be loaded eagerly (today's behavior) or lazy-loaded on vendor-name match in classifier? Eager is heavy; lazy risks miss-on-spelling-variant.
- **Q4**: Tower contract — once P5 hands off, is the Move record still mutable (status changes, value-realization updates) or immutable with a child Tower record? This determines whether `engagements.current_phase` ever exceeds 5 in practice.

## 13 · What this design pack does *not* cover yet (queued)

These are the remaining deliverables in the audit + design pack — not in this doc. To follow:

| # | File | Status |
|---|------|--------|
| 1 | `docs/design/knowledge-layer/KNOWLEDGE_LAYER_INVENTORY_2026-05-05.md` | Queued — extends `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` (2026-04-29) with post-doctrine deltas. |
| 2 | `docs/design/knowledge-layer/PATTERN_FABRIC_DESIGN_2026-05-05.md` | Queued — target-state design for the pattern fabric. |
| 3 | `docs/design/nexus/NEXUS_PATTERN_CONTEXT_CONTRACT_2026-05-05.md` | Queued — agent-side contract for how Nexus loads + cites patterns per turn. |
| 4 | `docs/design/nexus/NEXUS_AGENT_TRAINING_FRAMEWORK_2026-05-05.md` | Queued — the 7-element model (mission, pattern bundle, guided workflow, workshop playbook, artifact contract, evidence/anti-hallucination, gate logic) per phase. Companion to this doc. |
| 5 | `docs/design/knowledge-layer/KNOWLEDGE_GAP_BACKLOG_2026-05-05.md` | Queued — gap items #1–7 from § 11 plus deeper findings. |
| 6 | `docs/design/knowledge-layer/KNOWLEDGE_LAYER_IMPLEMENTATION_PLAN_2026-05-05.md` | Queued — sequencing for the seven reconciliation items. |
| 7 | `docs/design/agent-coordination/AGENT_COORDINATION_KNOWLEDGE_TRANSFER_PROTOCOL_2026-05-05.md` | Queued — handoff rules between Cursor / Codex / Claude agents that touch the knowledge layer; builds on `docs/build/session-coordination/`. |
| 8 | `scripts/audit/knowledge-layer-inventory.sql` | Queued — read-only inspection queries for the SQL substrate. |
