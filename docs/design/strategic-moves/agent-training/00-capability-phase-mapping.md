# Capability × Phase Mapping

| Field | Value |
|---|---|
| **Work Package** | T-X.3 |
| **Doc ID** | `AGENT_TRAINING_CAPABILITY_PHASE_MAPPING` |
| **Date** | 2026-05-05 |
| **Status** | Draft — ready for Anand review |
| **Depends on** | `00-cross-phase-capabilities.md`, `00-global-behavioral-rules.md`, `PHASE_MODEL_V2_DOCTRINE.md` |

---

## 1 · How to read this matrix

| Symbol | Meaning |
|---|---|
| **Y** | Fully supported — no phase-specific restrictions or notes |
| **Y*** | Supported with phase-specific notes (see §3 Notes column and per-phase details below) |
| **N** | Not applicable in this phase (the capability exists but has no meaningful activation here) |
| **N/A** | Not in Nexus scope at any phase (see §4 Out-of-scope capabilities in `00-cross-phase-capabilities.md` §4) |

Post-P5 (Tower) column: Nexus may still be invoked in Tower context for specific read-only tasks, but execution tracking is Tower's domain. Where Nexus has no role, N/A is used.

---

## 2 · Capability × Phase matrix

| Capability | P0 Originate | P1 Charter | P2 Diagnose | P3 Design | P4 Roadmap | P5 Mobilize | Tower |
|---|---|---|---|---|---|---|---|
| `prepare_session` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `run_or_support_session` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `ingest` | Y* | Y* | Y* | Y* | Y* | Y* | Y* |
| `synthesize` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `generate_artifacts` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `coach` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `gate` | Y* | Y* | Y* | Y* | Y* | Y* | N/A |
| `stay_simple` | Y | Y | Y | Y | Y | Y | Y |

All 8 capabilities are available in all 6 phases. The Y* designations reflect that every phase has meaningful differences in how each capability activates — detailed in §3.

---

## 3 · Phase-specific notes

### 3.1 `prepare_session`

| Phase | Notes |
|---|---|
| P0 | Session type: hypothesis framing. Pre-read includes signal summary and value hypothesis. Attendees typically: program lead, potential sponsor candidate. Decision to produce: whether to charter. |
| P1 | Session type: sponsor kickoff (90 min). Pre-read includes charter skeleton, hypothesis summary, proposed success metrics. Decision to produce: sponsor commits, scope bounded, decision rights assigned. |
| P2 | Session types: discovery interviews (per persona), current-state workshop, baseline review with sponsor + finance. Pre-read is persona/audience-specific — each interview gets its own guide. |
| P3 | Session types: solution design workshop, architecture review, AI risk review, decision workshop. Pre-read includes diagnosis summary and design options to evaluate. Decision to produce: design direction and risk acceptance. |
| P4 | Session types: roadmap workshop, business case review, investment committee prep, sourcing strategy. Pre-read includes design memo and financial model skeleton. Decision to produce: roadmap accepted, business case approved, funding path clear. |
| P5 | Session types: mobilization kickoff, SI/vendor onboarding, governance launch, sponsor handoff, Tower handoff. Pre-read is handoff-specific — structured for the receiving team (Tower, delivery owner, SI/vendor). |

### 3.2 `run_or_support_session`

| Phase | Notes |
|---|---|
| P0 | Hypothesis framing session. Nexus surfaces: what problem is being solved, who owns it, what value is at stake, whether a prior Move is similar. Key facilitation move: push for one outcome, one sponsor, one archetype. |
| P1 | Sponsor kickoff facilitation. Nexus surfaces: whether success metrics are measurable, whether scope exceeds sponsor authority, who holds decision rights. Key facilitation move: reject metrics without a baseline path. |
| P2 | Discovery sessions. Nexus facilitates interview guides, synthesizes responses in real time, flags gaps in baseline data, surfaces failure mode 3 (weak data foundation) if baselines are unavailable. |
| P3 | Design workshops. Nexus surfaces: task-by-task human/agent split, missing governance section, build-vs-buy comparison. Key facilitation move: reject "use agents" without a workflow map (global rule R6). |
| P4 | Roadmap and business case sessions. Nexus facilitates option evaluation, connects sourcing decision to P5 readiness, flags missing sensitivity analysis. Key facilitation move: reject roadmap without sequencing rationale. |
| P5 | Handoff sessions. Nexus verifies that acceptance is explicit (named, confirmed) not passive (global rule R7). Key facilitation move: name who has accepted, not just who was in the room. |

### 3.3 `ingest`

| Phase | Notes |
|---|---|
| P0 | Accepted uploads: CEO notes, exec briefings, board discussion summaries, KPI reports, prior Move briefs (any text/PDF/DOCX). Extraction target: hypothesis, problem statement, potential sponsor, value indication. |
| P1 | Accepted uploads: charter drafts, stakeholder lists, prior charters from analogous programs, value estimates. Extraction target: success metrics, scope boundaries, decision rights, assumptions. |
| P2 | Accepted uploads: process documentation, system architecture diagrams, data exports, interview transcripts, financial reports, system access logs, org charts. Extraction targets: baseline metrics (with source, time window, and owner), process steps, pain points, root-cause candidates. Numerics must retain original units and time windows — no normalization without user confirmation. |
| P3 | Accepted uploads: reference architectures, vendor documentation, RFI/RFP responses, technical assessments, model benchmark reports. Extraction targets: capability patterns, integration requirements, risk indicators, vendor capability claims (flagged as unverified until confirmed against `seed-patterns-sourcing-vendors-*.ts`). |
| P4 | Accepted uploads: cost models, rate cards, effort estimates, vendor quotes, change readiness assessments. Extraction targets: effort hours, cost line items, value assumptions, change plan inputs. All financial values extracted from uploads are labeled with source and treated as inputs to the ROM model, not as final values. |
| P5 | Accepted uploads: delivery plans, RACI drafts, governance charters, SI/vendor contract summaries, Tower onboarding materials. Extraction targets: owner names, dates, value tracking commitments, escalation paths. |
| Tower | Read-only ingestion only. Nexus may ingest value-realization reports or execution status uploads to answer a specific question. Nexus does not write to Tower records. |

### 3.4 `synthesize`

| Phase | Notes |
|---|---|
| P0 | Synthesis goal: convert unstructured signal into a structured hypothesis (falsifiable, scoped, with value indication). Output: hypothesis statement, archetype recommendation, sponsor candidate, initial failure modes. |
| P1 | Synthesis goal: consolidate workshop outputs into a draft charter. Output: success metric tree, stakeholder map, decision rights map, key assumptions. |
| P2 | Synthesis goal: convert baseline data, interviews, and process maps into a ranked root-cause analysis. Output: quantified pain points with evidence, root causes ranked by confidence, data gaps surfaced. This is the most evidence-intensive synthesis in the phase model — every claim must cite a source. |
| P3 | Synthesis goal: convert design workshop outputs into a decision memo. Output: target-state summary, operating model shift, top 5–7 risks with mitigations, build/buy/partner recommendation. |
| P4 | Synthesis goal: convert design memo + financial inputs into a business case structure. Output: value realization plan, cost model structure, change plan inputs, sourcing path. |
| P5 | Synthesis goal: confirm handoff readiness. Output: readiness assessment (what is complete, what is not, what requires follow-up before Tower can accept). |
| Tower | Not in Nexus scope. Tower synthesizes execution evidence independently. |

### 3.5 `generate_artifacts`

| Phase | Notes |
|---|---|
| P0 | Auto-draft allowed: Origination Brief, Move Hypothesis, Archetype Recommendation, Foundation Readiness Snapshot, P1 Charter Draft Skeleton. Requires user confirmation before drafting: Sponsor Candidate Map (cannot assign sponsor names without confirmation). |
| P1 | Auto-draft allowed: Program Charter skeleton, Success Metric Tree structure, Initial Workplan. Requires user confirmation: decision rights assignments, sponsor commitment statements. The charter structure is produced by Nexus; the commitments it contains require human affirmation. |
| P2 | Auto-draft allowed: Current-State Assessment structure, Process Map skeleton from uploaded inputs. Restricted: Nexus does not draft baseline numbers — all numeric values must come from ingested uploads or confirmed user inputs. Financial Baseline artifact requires every value to have a cited source. |
| P3 | Auto-draft allowed: Target State Design narrative (from synthesis), Operating Model Shift structure, Risks & Tradeoffs register. Restricted: Nexus does not select a vendor (output is a shortlist); it does not assert vendor capabilities without citing vendor docs. |
| P4 | Auto-draft allowed: Roadmap structure, Estimate Model skeleton (using AbarVa ROM methodology), Business Case skeleton, Value Realization Plan structure, Sourcing/SI Decision Brief. Restricted: all financial values in the Business Case must trace to baseline (P2), design assumption (P3), or uploaded estimate — no invented effort hours or pricing. |
| P5 | Auto-draft allowed: Mobilization Plan, RACI structure, Governance Charter draft, Tower Handoff Pack structure, Value Tracking Setup. Restricted: Nexus does not authorize go-live; delivery readiness confirmation requires named human sign-off. |
| Tower | Not in Nexus scope. |

### 3.6 `coach`

| Phase | Notes |
|---|---|
| P0 | Coaching fires on: hypothesis too broad (more than one distinct problem), missing sponsor candidate after step 2, failure to classify archetype, value indication too vague to estimate. Key coaching move: push for one falsifiable outcome statement. |
| P1 | Coaching fires on: success metrics without baseline path, scope exceeding sponsor authority, missing decision rights, charter with too many owners. Key coaching move: reject success metrics that can't be measured today. |
| P2 | Coaching fires on: perceived issues stated without measurable baseline, diagnosis proceeding without data access, failure mode 3 (weak data foundation) not acknowledged when data is unavailable. Key coaching move: push for quantified, sourced pain rather than anecdotal pain. |
| P3 | Coaching fires on: tool-first thinking (naming a vendor before naming the workflow change), AI design without a governance section, build choice without build-vs-buy comparison. Key coaching move: "what task is shifting from human to agent?" before any tool is named. (This is also global rule R6.) |
| P4 | Coaching fires on: roadmap without sequencing rationale, business case without sensitivity analysis, sourcing direction absent when SI dependency is present. Key coaching move: force a funding path conversation before the roadmap is called final. |
| P5 | Coaching fires on: handoff proceeding without named delivery owner, Tower receiver not named, value tracking cadence undefined, escalation path missing. Key coaching move: "who is the named delivery owner?" must have an answer before the gate can close. |
| Tower | Not in Nexus scope. |

### 3.7 `gate`

| Phase | Notes |
|---|---|
| P0 | Gate: P0 → P1. Hard criteria: hypothesis clear, sponsor candidate identified, archetype assigned, tenant/function scope set, initial value range estimated, risks/failure modes flagged. Self-approval: authorized founder/admin can self-promote if all pass. Sponsor candidate alone (without sign-off) is sufficient for P0 → P1. |
| P1 | Gate: P1 → P2. Hard criteria: sponsor confirms, success metrics defined with baseline path, scope bounded, decision owners known, value range documented, key assumptions labeled. Self-approval: none — sponsor sign-off is required. |
| P2 | Gate: P2 → P3. Hard criteria: baseline locked with evidence, root causes ranked, pain points validated, sponsor agrees diagnosis is accurate. Special authority: Nexus may recommend discontinuation at this gate if evidence fails to support the hypothesis (global rule R5). This is the only gate where a "discontinue" verdict is in scope. |
| P3 | Gate: P3 → P4. Hard criteria: future-state design approved, AI/human workflow clear, architecture reviewed, risks identified, data readiness known, decision memo signed. Self-approval: none — decision memo requires sponsor + architecture lead. |
| P4 | Gate: P4 → P5. Hard criteria: roadmap accepted, business case validated, value ledger defined, funding path clear, sourcing path decided, change plan drafted. Self-approval: none — requires sponsor + finance + (if applicable) sourcing lead. |
| P5 | Gate: P5 → Tower (completion). Hard criteria: owner assigned, governance active, delivery team mobilized, artifacts handed off, Tower/value tracking configured, sponsor accepts handoff. Acceptance must be explicit (global rule R7) — Tower receiver confirmation by name is required. Self-approval: none. |
| Tower | Not in Nexus scope. |

### 3.8 `stay_simple`

| Phase | Notes |
|---|---|
| All phases | No phase-specific notes. `stay_simple` applies uniformly in all phases, all contexts, all response types. See global behavioral rule R2 in `00-global-behavioral-rules.md`. |
| Tower | Also applies here — any Nexus response in Tower context follows the same structural rules. |

---

## 4 · Summary: no-capability cells explained

There are no hard N cells in the 6-phase range — all 8 capabilities are available in all 6 phases. The Tower column contains N/A cells for 6 capabilities because execution tracking and synthesis of execution evidence belong to Tower, not Nexus. Specifically:

| Capability | Tower status | Reason |
|---|---|---|
| `prepare_session` | N/A | Tower sessions (execution reviews, risk reviews, value-realization reviews) are Tower-facilitated, not Nexus-facilitated |
| `run_or_support_session` | N/A | Same as above |
| `ingest` | Y* | Nexus may ingest value-realization reports for read-only Q&A, but does not write to Tower records |
| `synthesize` | N/A | Tower synthesizes execution evidence independently |
| `generate_artifacts` | N/A | Tower generates its own execution artifacts; Nexus does not write to Tower records |
| `coach` | N/A | Tower coaching is Tower's function, not Nexus's |
| `gate` | N/A | There is no Nexus-evaluated gate after P5. The `P5 → ø` gate is retired; Tower owns its own review cycles |
| `stay_simple` | Y | Behavioral rule applies to any Nexus response in any context |

---

## 5 · Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — full 8×7 matrix with phase-specific notes | Claude Code |
