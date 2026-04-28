# AbarVa Meta-Patterns · M2 through M6

**Document:** Five meta-patterns completing the Tier M foundation
**Date authored:** April 24, 2026
**Author:** Anand Sundaram + Claude (co-authored)
**Companion document:** `00-vision-catalog-template-first-pattern.md` (contains M1 and the canonical template)
**Status:** All AUTHORED-DRAFT pending internal peer review

Five patterns below. Each follows the locked ten-section template.

---

## M2 · The Seventeen-Module Program Composition

```yaml
---
pattern_name: "The Seventeen-Module Program Composition"
pattern_slug: "seventeen-module-program-composition"
tier: "M"
vertical: "cross-industry"
thesis: "Every AbarVa program composes from a canonical library of seventeen modules, selected by archetype, mapped to phases, so programs are structurally consistent yet shape-adaptive."
applicability: "Applies to every AbarVa engagement. The seventeen-module library is the compositional primitive from which all program shapes derive."
regulatory_chips: []
authored_by: "Anand Sundaram"
authoring_date: "2026-04-24"
status: "AUTHORED-DRAFT"
version: "1.0"
adjacent_patterns: ["six-phase-engagement-architecture", "four-agent-division-of-labor", "three-tier-deliverable-system"]
---
```

### Section A · Identity

**Pattern name:** The Seventeen-Module Program Composition

**Pattern slug:** `seventeen-module-program-composition`

**Tier:** M (Meta — AbarVa's own operating model)

**Vertical:** Cross-industry

**Thesis:** Every AbarVa program is composed from a canonical library of seventeen modules. Modules map to phases. Archetype selection (Strategic Transformation, Workflow Automation, Platform Modernization, AI Product Enablement, Operational Optimization) drives which modules activate and in what depth. Three shape classes — Template (full 17 modules, novel problem), Pattern (4-8 modules, pre-loaded from matched pattern, most common), Custom (Maestro-authored subset plus specialized modules) — cover all programs.

**Applicability:** Every AbarVa engagement composes modules from this seventeen-module library. Modules are not skipped arbitrarily; they are either activated, deferred with justification, or explicitly out-of-scope for the chosen shape.

**Does not apply to:** Engagements that bypass the phase architecture (M1) altogether — lightweight advisory conversations, internal tool evaluations, non-transformation scope work.

**Regulatory chips:** None at pattern level. Individual modules may carry framework-specific content (e.g., Vendor/Tech Evaluation module for healthcare programs includes HIPAA BAA review).

### Section B · Context

**Why this pattern exists.** Consulting engagements improvise module structure per client. Each engagement's scoping produces a bespoke work plan. This produces three pathologies: inconsistency across engagements makes benchmarking impossible; proliferation of one-off deliverables with no structural comparability; loss of institutional memory because each engagement reinvents the work breakdown.

AbarVa's seventeen-module library inverts this. The modules are canonical — they appear across every program, though selectively activated. This produces three advantages: deliverables from different programs are structurally comparable (a Business Case + ROI module in Meridian's Ambient Clinical program has the same structure as in Apex's Owned-Brand Margin program); Maestro Intake can pre-load a program's module selection by matching to a pattern; the Genome feedback loop captures which module compositions produced which outcomes across programs.

This pattern sits between M1 (the phase architecture) and M3 (the agent division). M1 says when work happens; this pattern says what work happens; M3 says who performs the work.

**Adjacent patterns:**
- M1 · Six-Phase Engagement Architecture (modules map to phases defined here)
- M3 · Four-Agent Division of Labor (agents engage modules per their zone)
- M5 · Three-Tier Deliverable System (modules produce tier-appropriate deliverables)

**Predecessor patterns:** M1 must be understood first. Module composition makes no sense without phase architecture.

**Successor patterns:** Every Tier 1-3 pattern inherits module references from this library.

**Author declaration:** Authored from AbarVa founder's synthesis of transformation program methodology across dozens of engagements at senior consulting level. The seventeen-module list reflects deliberate reduction from typical consulting work breakdowns (which routinely produce 40-80 work products per engagement) to the smallest set that preserves rigor while enabling pattern-matching. Not measured from customer deployments yet.

### Section C · Detection Signals

Six signals that indicate this pattern applies to a program. Ordered strongest to weakest.

**Signal C-1 — HIGH.** Program is scoped as an AbarVa engagement (signed Charter, assigned Maestro). Any AbarVa program composes from this library; no exceptions.

**Signal C-2 — HIGH.** Program problem has been matched to an existing pattern in the library (most common case, approximately 70% of programs). Matched pattern specifies initial module composition; Shape B (Pattern shape) applies.

**Signal C-3 — HIGH.** Program is genuinely novel with no pattern match (approximately 15% of programs). All seventeen modules activate; Shape A (Template shape) applies; new pattern gets authored on program completion.

**Signal C-4 — MEDIUM.** Program has specialized scope requiring custom modules beyond the canonical seventeen (approximately 15% of programs). Maestro authors custom shape; canonical modules supplement specialized ones.

**Signal C-5 — MEDIUM.** Program archetype has been classified (Strategic Transformation / Workflow Automation / Platform Modernization / AI Product Enablement / Operational Optimization). Archetype drives which canonical modules receive emphasis.

**Signal C-6 — LOW.** Client has requested a specific deliverable shape (e.g., "we need a business case") that maps to specific canonical modules (#12 Business Case + ROI).

**Anti-signals:**
- Client asks AbarVa to follow their existing program methodology rather than AbarVa's — this violates the canonical structure and should be declined or redirected
- Request for deliverables that do not map to any canonical module AND do not justify a specialized custom module

### Section D · Diagnostic Questions

Six questions Maestro Intake asks to compose the module set for a program.

**D-1.** "What archetype does this program fit — transforming a strategy, automating a workflow, modernizing a platform, enabling a new AI product, or optimizing an operation?"
- Archetype selection drives module emphasis.

**D-2.** "Does the problem match a pattern in our library exactly, partially, or not at all?"
- Match result determines Shape A/B/C and pre-load depth.

**D-3.** "What evidence do we need to surface to build confidence in the recommendation?"
- Determines whether Diagnostic Instrument (#5) and Data Analysis + Findings (#6) activate.

**D-4.** "Is the problem primarily about what to do, or primarily about how to do it?"
- "What" emphasis activates Design modules (#9-12). "How" emphasis activates Execute modules (#13-15).

**D-5.** "Does outcome measurement require dedicated infrastructure or can it leverage existing client metrics?"
- Determines depth of Outcome Measurement module (#16).

**D-6.** "Will this program produce a reusable pattern for future similar problems?"
- Determines whether Benefits Realization + Genome Feedback module (#17) receives Rich-tier authoring.

### Section E · Interventions

The seventeen canonical modules are the intervention. Each has a number, name, typical phase, and shape applicability.

**The canonical seventeen:**

| # | Module | Typical Phase | Shapes | Description |
|---|--------|---------------|--------|-------------|
| 1 | Problem Framing | Origination | All | Capture the client problem in precise language; classify archetype. |
| 2 | Stakeholder Map | Charter | All | Identify sponsors, decision-makers, affected parties, resistance sources. |
| 3 | Success Criteria Definition | Charter | All | Define what measurable outcomes constitute program success. |
| 4 | Baseline Data Request | Charter | All | Enumerate the data AbarVa needs to execute the program. |
| 5 | Diagnostic Instrument | Diagnose | Pattern, Template | Structured assessment tool specific to the program domain. |
| 6 | Data Analysis + Findings | Diagnose | All | Analyze baseline data; produce findings document. |
| 7 | Contradiction Surface | Diagnose | All | Surface gaps between stated process and actual data. |
| 8 | CXO Interview Prep + Capture | Diagnose | All | Prepare interview guide; conduct CXO touchpoint 1; capture insights. |
| 9 | Solution Library Match | Design | Pattern, Template | Map findings to solution architectures in the AbarVa library. |
| 10 | Vendor/Tech Evaluation | Design | Pattern, Template | Structured evaluation of candidate vendors or technologies. |
| 11 | Tradeoff Matrix + Recommendation | Design | All | Produce decision memo with options, tradeoffs, recommendation. |
| 12 | Business Case + ROI | Design | All | Quantified value projection with assumptions and sensitivity. |
| 13 | Implementation Plan | Design/Execute | All | Detailed execution plan with milestones, dependencies, risks. |
| 14 | Build + Integration Tracking | Execute | Pattern, Template | Track build progress against plan; surface drift early. |
| 15 | Change Management Plan | Execute | Pattern, Template | Adoption strategy, training, communication, resistance management. |
| 16 | Outcome Measurement | Verify | All | Measure realized outcomes against Phase 4 projections. |
| 17 | Benefits Realization + Genome Feedback | Verify | All | Document realized benefits; contribute observations back to pattern library. |

**Three shape classes:**

**Shape A — Template (~15% of programs).** Novel problem with no pattern match. All seventeen modules activate. No pre-load; Maestro authors each module from scratch. Highest rigor, highest fee, writes new pattern on completion.

**Shape B — Pattern (~70% of programs).** Problem matches existing pattern. 4-8 modules activate from the canonical seventeen, selected per the matched pattern's specification. 50-70% of module content pre-loads from pattern; client-specific content fills in. Fast time-to-value. Standard fee.

**Shape C — Custom (~15% of programs).** Specialized problem requiring custom modules beyond the canonical seventeen. Maestro composes a subset of canonical modules plus specialized extensions. Example: PDLC transformation might use canonical #2 Stakeholder Map, #3 Success Criteria, #11 Tradeoff Matrix, #12 Business Case, #17 Benefits Realization plus specialized "Persona Productivity Model" and "PDLC Value Leakage Analysis" modules. Higher fee reflects specialization.

**Module-to-phase mapping:** Modules are typically phase-bound but can span phases. Example: Implementation Plan (#13) typically straddles Design and Execute phases. The "Typical Phase" column is guidance, not rigid.

### Section F · Evidence Base

**Research basis.** Synthesized from transformation program methodologies published by major consulting firms (work breakdown structures from McKinsey 7S, BCG Growth-Share frameworks, Deloitte Human Capital practice methodologies — specific firms not reproduced here per AbarVa canonical non-reference policy). Reduced to seventeen modules through deliberate pruning to preserve structural coverage while enabling pattern-matching.

**Regulatory references.** None at pattern level. Module-level content carries framework references where applicable.

**Benchmarks.** Typical enterprise transformation engagement produces 40-80 discrete work products. AbarVa's seventeen-module library represents a compression to approximately 20-40% of that volume while claiming to preserve functional coverage. This compression ratio is a design choice based on founder's judgment that most consulting work products duplicate, fragment, or theatricalize work that could be consolidated.

**Confidence declaration.** AUTHORED-DRAFT. The seventeen-module list reflects considered structural judgment. Module boundaries and names may refine as AbarVa programs run. Specific modules may split or merge based on observation.

### Section G · Observations

Current observations empty. Will populate as programs complete Phase 6 and contribute observations back per M6.

Expected observation categories:
- Programs where a canonical module was skipped and what broke
- Programs where a specialized custom module was authored and whether it should promote to canonical
- Programs where Shape B module selection missed a critical module that had to be added mid-program
- Programs where module boundary was contested (work that could fit two modules)
- Programs where module pre-load from pattern match was 90%+ accurate vs. required significant client-specific override

Observation schema per M1 Section G specification.

### Section H · Failure Modes

Four ways this pattern fails in execution.

**Failure H-1 · Modules become checklist rather than substantive work.**

*Description:* Maestro activates a module (e.g., Stakeholder Map) and a junior team member produces a one-slide output with five names and role titles, satisfying the module's nominal requirement while missing the substantive work (identifying resistance sources, alliance structures, decision authorities).

*Detection:* Module output is <20% of typical module word count; module output has no decision-relevant content; module output doesn't inform subsequent modules.

*Remediation:* Every module has a minimum substantive bar documented in module-specific specification. Nexus reviews module completeness before advancing phase. Modules ship complete or get returned for deepening.

**Failure H-2 · Specialized custom modules proliferate without canonical promotion review.**

*Description:* Shape C programs author specialized modules for each engagement. Over time, dozens of specialized modules accumulate in tenant deployments without review for canonical library promotion. Library fragments; pattern-matching degrades.

*Detection:* Specialized module count grows quarterly; same specialized module authored independently in multiple programs (signal for canonical promotion).

*Remediation:* Quarterly canonical-promotion review. Specialized modules used in 3+ programs get reviewed for promotion to canonical (#18, #19, etc., with pattern library update). Specialized modules unique to one program get archived with pattern-specific annotation.

**Failure H-3 · Module boundaries contested, work duplicated or dropped.**

*Description:* Problem-Framing (#1) and Success-Criteria (#3) overlap. Work gets done twice in both modules or falls between them. Similar issues at #9 / #11 boundary and #13 / #14 / #15 boundaries.

*Detection:* Same content appears in multiple module outputs; content expected in a module missing because "we put it in the other one."

*Remediation:* Module specifications document clear boundaries with explicit "this module owns X; adjacent module owns Y" callouts. Nexus enforces at module completion.

**Failure H-4 · Pattern pre-load dominates client-specific authoring.**

*Description:* Shape B pre-loads 60-70% of module content from matched pattern. Maestro treats the remaining 30-40% as a fill-in exercise, under-investing in client-specific content. Deliverables look generic; client feels unseen.

*Detection:* Client-specific content in module output <30% of total; deliverable could be mistaken for a different client's deliverable.

*Remediation:* Minimum client-specific content threshold per module (typically 40-50%). Nexus flags modules falling below threshold for deepening before deliverable commits.

### Section I · Cross-References

**Related patterns:**
- M1 · Six-Phase Engagement Architecture (modules map to phases here)
- M3 · Four-Agent Division of Labor (agents work specific modules)
- M5 · Three-Tier Deliverable System (modules produce tier-appropriate deliverables)
- M6 · Dual-Ledger Outcome Reconciliation (module #17 contributes observations)

**Programs using this pattern:** Every AbarVa program.

**Deliverables produced per module:** Each canonical module has a typical deliverable output. Rich-tier deliverables typically come from modules #11 (Decision Memo), #12 (Business Case), #16 (Outcome Reconciliation). Outline-tier from modules #6 (Findings), #13 (Implementation Plan), #15 (Change Management). Stub-tier from modules #17 (Benefits Realization) when prerequisites incomplete.

**Failure modes cross-ref:**
- File 01 FM-2 · Module boundary enforcement
- File 01 FM-7 · Specialized module canonical review

### Section J · Authoring Metadata

- **Authored by:** Anand Sundaram
- **Authoring date:** 2026-04-24
- **Reviewed by:** (pending)
- **Expert validated by:** (pending)
- **Last updated:** 2026-04-24
- **Version:** 1.0
- **Status:** AUTHORED-DRAFT
- **Change log:**
  - v1.0 · Initial authoring. Documents canonical seventeen-module library and three shape classes (Template, Pattern, Custom).
- **Next authoring cycle actions:**
  - Per-module specification authoring (each module needs a mini-spec with minimum-substantive-bar content)
  - Canonical-promotion review process formalization
  - Specialized module catalog for patterns that have custom modules (PDLC, etc.)

---

## M3 · The Four-Agent Division of Labor

```yaml
---
pattern_name: "The Four-Agent Division of Labor"
pattern_slug: "four-agent-division-of-labor"
tier: "M"
vertical: "cross-industry"
thesis: "AbarVa's intelligence is delivered through four named agents with distinct voices, zones, and retrieval scopes — Nexus runs programs, Sentinel holds the library, Atlas reads the portfolio, Steward enforces integrity — mirroring how elite consulting teams actually work."
applicability: "Applies to every interaction with the AbarVa platform. Each agent is anchored to a specific product zone and speaks in a specific voice."
regulatory_chips: []
authored_by: "Anand Sundaram"
authoring_date: "2026-04-24"
status: "AUTHORED-DRAFT"
version: "1.0"
adjacent_patterns: ["six-phase-engagement-architecture", "seventeen-module-program-composition", "five-dimension-control-tower"]
---
```

### Section A · Identity

**Pattern name:** The Four-Agent Division of Labor

**Pattern slug:** `four-agent-division-of-labor`

**Tier:** M

**Vertical:** Cross-industry

**Thesis:** AbarVa's intelligence is delivered through four named agents, each with a distinct voice, zone assignment, and retrieval scope. Nexus runs programs (maestro-collegial voice, Programs zone). Sentinel holds the pattern library (research-rigorous voice, Intelligence zone). Atlas reads the portfolio (executive-concise voice, Tower zone). Steward enforces operational integrity (operationally-terse voice, Admin zone). Handoffs between agents are explicit and user-initiated. The four-agent division mirrors how elite consulting teams divide labor — the partner, the expert, the editor, the operations lead.

**Applicability:** Every user interaction with AbarVa happens in one of the four zones and anchors to the corresponding agent. Cross-zone interactions explicit handoff via File 08 Section 12 affordance.

**Does not apply to:** Public-facing surfaces (home marketing, investor page, platform page) where no agent is active.

**Regulatory chips:** None.

### Section B · Context

**Why this pattern exists.** Single-agent AI products treat all work as one blob. A generic "ask me anything" agent produces responses that drift in voice, inconsistent in retrieval scope, and indistinguishable across workflow contexts. Enterprise users interacting with such agents find them useful but not trustworthy — the agent feels like an assistant, not a team member.

AbarVa's four-agent model treats distinct cognitive work as distinct. Program pressure-testing (Nexus) is different from library research (Sentinel) is different from portfolio synthesis (Atlas) is different from operational audit (Steward). Each agent has a dedicated voice contract, retrieval priority, and response structure. Users experience coherent specialization — "Nexus is pressure-testing my program" feels different from "Sentinel is walking me through the evidence" and both feel different from "Atlas is flagging the pressures I need to act on."

This mirrors how elite consulting teams work. A senior partner leads client engagement (maestro role — Nexus). A research specialist holds the firm's intellectual capital (library role — Sentinel). A practice leader watches across engagements (portfolio role — Atlas). An operations director enforces compliance and quality (operations role — Steward). Same division, automated.

**Adjacent patterns:**
- M1 · Six-Phase Engagement Architecture (agents engage phases differently)
- M2 · Seventeen-Module Program Composition (agents work specific modules)
- M4 · Five-Dimension Control Tower (Atlas composes across dimensions)
- M6 · Dual-Ledger Outcome Reconciliation (Nexus drafts, Steward audits)

**Predecessor patterns:** M1 phase architecture must exist first; agents engage phase-specific work.

**Successor patterns:** M4 Control Tower assumes Atlas exists; M6 reconciliation assumes Nexus and Steward exist.

**Author declaration:** Authored from founder observation of elite consulting team dynamics. The four-role model reflects structural consensus across top-tier firms; AbarVa operationalizes it as agents. Not measured from customer deployments.

### Section C · Detection Signals

**Signal C-1 — HIGH.** User is in a product zone. Each zone has its anchored agent; pattern always applies.

**Signal C-2 — HIGH.** User interaction requires intelligence that exceeds single-purpose chat. Program pressure-testing, pattern research, portfolio synthesis, operational audit are structurally distinct.

**Signal C-3 — MEDIUM.** User needs differ across session. Switching zones should produce different agent voices and retrieval — consistent agent across zones would feel generic.

**Signal C-4 — MEDIUM.** Client enterprise culture recognizes specialist roles. CIOs, CMIOs, CFOs expect specialists; generalist AI agents feel junior to them.

**Signal C-5 — LOW.** User asks about agent handoffs. Explicit handoff affordance per File 08 Section 12.

**Anti-signals:**
- User in public-facing surface (no agent active)
- User explicitly asks for a single unified agent — signal of misalignment with AbarVa's model

### Section D · Diagnostic Questions

**D-1.** "What zone is the user in?"
- Programs → Nexus. Intelligence → Sentinel. Tower → Atlas. Admin → Steward.

**D-2.** "Is the user's query primarily about a specific program's execution?"
- Yes → Nexus engagement. No → consider other agents.

**D-3.** "Is the user's query about pattern content, evidence, or library navigation?"
- Yes → Sentinel. Use Intelligence zone.

**D-4.** "Is the user's query about portfolio-level synthesis across programs?"
- Yes → Atlas. Tower zone.

**D-5.** "Is the user's query about operational health, quality, or audit?"
- Yes → Steward. Admin zone.

**D-6.** "Does the query span multiple zones?"
- Yes → Primary agent handles; explicit handoff affordance offered to secondary agent.

### Section E · Interventions

The four agents themselves are the intervention. Each has a specification.

**Intervention E-1 · Nexus · Programs zone**

*Voice contract:* Maestro-collegial. Peer-not-subordinate. Pressure-tests weak framings. Cites sources. Explicit about confidence. Doesn't flatter. Structured by default.

*Retrieval scope:* Program-applicable patterns, stakeholder alignment patterns, pressure-test heuristics. When program anchored, pulls program's deliverable inventory, contradictions counter, active patterns. When phase anchored, pulls gate conditions and expected deliverables.

*Response structure:* Opens with direct engagement. Body numbered or sectioned. Each substantive claim citations. Closes with reframing suggestion, diagnostic question, or next-step proposal.

*Model tier:* Opus-class (heavy reasoning load).

*Zones:* Programs index, Program detail, Phase page, Deliverable page, Maestro Intake.

**Intervention E-2 · Sentinel · Intelligence zone**

*Voice contract:* Research-rigorous. Librarian-honest. Lists evidence sources with counts and provenance. Distinguishes authored-from-industry from measured-from-customer-outcomes. Admits evidence is thin when retrieval is sparse. Knows the library deeply.

*Retrieval scope:* Pattern semantic match, related patterns via graph edges, observations via CONTRIBUTED_BY edges. When tenant anchored, filters by APPLICABLE_TO_TENANT and flags observation provenance.

*Response structure:* Opens by referencing specific pattern or library slice. Body evidence-forward. When evidence thin, says so as first substantive sentence. Closes with drill-down offer or related-pattern pointer.

*Model tier:* Opus-class (rigorous library reasoning).

*Zones:* Intelligence library, Pattern detail, Observation drawer.

**Intervention E-3 · Atlas · Tower zone**

*Voice contract:* Executive-concise. Headlines. Short lines. Decision-oriented. Editorial analysis, not status labels. Says what matters, names the action.

*Retrieval scope:* Cross-program portfolio signals (per M4). Pressure cards, unowned risks, program health indicators, spend trajectory. Cross-program within tenant, not single-program.

*Response structure:* Opens with headline. Body two-or-three paragraphs, each one pressure + one action. Dollar amounts with context. Closes with single decision prompt. Never exceeds 150 words unless depth requested.

*Model tier:* Sonnet-class (shorter structured responses).

*Zones:* Control Tower, Tower sub-surfaces (Vendor Portfolio, Shadow AI, Regulatory Posture, AI Council, Model Inventory).

**Intervention E-4 · Steward · Admin zone**

*Voice contract:* Operationally-terse. Quality-focused. Attentive to cross-program health, connector states, audit coverage. Surfaces issues before they become crises.

*Retrieval scope:* Operational signals (connector health, provisioning queue, audit records, quality scores per deliverable, cross-program anomalies). Broader cross-tenant visibility than other agents.

*Response structure:* Opens with specific operational status. Body list-structured. Cites specific connector states, audit records, quality scores. Closes with prioritized action list: "fix first: A. fix next: B. monitor: C." Never speculates about business outcomes.

*Model tier:* Sonnet-class (structured operational responses).

*Zones:* Admin landing, Users sub-surface, Connectors sub-surface, Audit sub-surface, Quality sub-surface.

**Cross-agent handoffs:** Per File 08 Section 12. Explicit user-initiated via handoff affordance. Carries last N turns context from source to target. Target agent acknowledges handoff in opening turn.

### Section F · Evidence Base

**Research basis.** Synthesized from observation of elite consulting team dynamics across dozens of engagements. The partner / expert / portfolio-lead / operations-director division is structural consensus in top-tier firms.

**Comparable architectures.** Salesforce's Einstein platform uses specialized agents per cloud (Sales, Service, Marketing, Commerce). Glean's agent framework allows specialized agents per workflow. Harvey's legal agents specialize by practice area. The four-agent division in AbarVa is a specific instantiation of a broader industry direction.

**Confidence declaration.** AUTHORED-DRAFT. The specific four-agent division reflects considered judgment. Agent boundaries may refine with production observation. Possible future additions (e.g., a fifth agent for client-facing external stakeholders) would require explicit charter update.

### Section G · Observations

Current observations empty. Will populate as AbarVa users interact with agents across zones.

Expected observation categories:
- Users who primarily engage one agent vs. users who move across zones
- Handoff patterns (which agent hands to which most frequently)
- Queries that fit poorly to the four-agent division (potential signal for fifth agent or scope revision)
- Voice contract drift instances (Nexus slipping into generic tone, etc.) and remediation
- Cross-tenant agent engagement patterns (are enterprise users patient with agent differentiation or do they prefer unified)

### Section H · Failure Modes

**Failure H-1 · Voice contract drift under generic training.**

*Description:* Over time, if system prompts are inconsistently updated or model versions change, agents drift toward generic tone. Nexus starts sounding like ChatGPT. Sentinel loses librarian-honest rigor.

*Detection:* A/B comparison of agent responses against voice contract specifications. Automated voice-contract testing in CI.

*Remediation:* System prompt templates version-controlled. Voice contract tests run on every release. Drift detected triggers remediation PR before deploy.

**Failure H-2 · Silent cross-agent invocation.**

*Description:* Nexus agent internally queries Sentinel's retrieval scope to answer a pattern question, without explicit handoff. User gets Nexus-voiced response to pattern question. Zone voice separation degrades.

*Detection:* Retrieval audit shows agent accessing out-of-scope retrieval. User feedback notes voice inconsistency.

*Remediation:* Retrieval scope enforcement at Stage 3 Fabric attachment per File 08. Cross-scope retrieval requires explicit handoff.

**Failure H-3 · User confusion about agent differentiation.**

*Description:* New user doesn't understand why four agents exist. Experiences the split as friction rather than value.

*Detection:* User feedback, session analytics showing confusion (e.g., user trying to ask pattern questions in Programs zone).

*Remediation:* Onboarding experience introduces each agent briefly. In-zone affordances (rail header, handoff suggestions) make agent identity visible. Steward surfaces cross-zone behavior to Admin for review.

**Failure H-4 · Atlas token budget overruns.**

*Description:* Atlas responses meant to be <150 words blow past budget. Executive conciseness degrades to general summarization.

*Detection:* Atlas response length tracking shows drift above threshold.

*Remediation:* Sonnet-class model with hard max_tokens (2000 per File 08). System prompt explicitly caps word count. Length check in Stage 6 response assembly.

### Section I · Cross-References

**Related patterns:**
- M1 · Six-Phase Engagement Architecture
- M2 · Seventeen-Module Program Composition
- M4 · Five-Dimension Control Tower
- M5 · Three-Tier Deliverable System
- M6 · Dual-Ledger Outcome Reconciliation

**File 08 references:** The per-turn contract is the operational specification for this pattern. File 08 Section 5 details each agent's voice contract. File 08 Section 12 details handoff mechanics.

**Programs using this pattern:** Every user session in any zone.

### Section J · Authoring Metadata

- **Authored by:** Anand Sundaram
- **Authoring date:** 2026-04-24
- **Reviewed by:** (pending)
- **Expert validated by:** (pending)
- **Last updated:** 2026-04-24
- **Version:** 1.0
- **Status:** AUTHORED-DRAFT
- **Change log:**
  - v1.0 · Initial authoring. Documents four-agent division with voice contracts, retrieval scopes, response structures, and handoff mechanics.

---

## M4 · The Five-Dimension Control Tower

```yaml
---
pattern_name: "The Five-Dimension Control Tower"
pattern_slug: "five-dimension-control-tower"
tier: "M"
vertical: "cross-industry"
thesis: "Enterprise AI portfolios require a five-dimension executive view — Use Cases, Contradictions, Unowned Risks, Spend Trajectory, Last-Turn-Ago — composed by Atlas into editorial pressure analysis that a CIO can act on in under thirty seconds."
applicability: "Applies to every tenant with two or more active AbarVa programs. Single-program tenants do not yet need Tower; aggregation begins at portfolio scale."
regulatory_chips: []
authored_by: "Anand Sundaram"
authoring_date: "2026-04-24"
status: "AUTHORED-DRAFT"
version: "1.0"
adjacent_patterns: ["four-agent-division-of-labor", "six-phase-engagement-architecture", "dual-ledger-outcome-reconciliation"]
---
```

### Section A · Identity

**Pattern name:** The Five-Dimension Control Tower

**Pattern slug:** `five-dimension-control-tower`

**Tier:** M

**Vertical:** Cross-industry

**Thesis:** Enterprise AI programs produce portfolio-level signals that no single program can see. Five dimensions — Use Cases (inventory and status), Contradictions (surfaced gaps between stated and actual), Unowned Risks (governance gaps), Spend Trajectory (AI-related cost evolution), Last-Turn-Ago (engagement velocity) — compose into the Control Tower. Atlas synthesizes across the five into executive editorial. The Tower is the CIO's Monday-morning view of AI across the enterprise.

**Applicability:** Every tenant with two or more active AbarVa programs has a Tower. Atlas is active. Pressure cards synthesize across programs.

**Does not apply to:** Tenants with a single active program (aggregation is meaningless). Tenants without AbarVa engagement (Tower has nothing to show).

**Regulatory chips:** EU AI Act, NIST AI RMF (regulatory posture visible as one of the sub-surfaces).

### Section B · Context

**Why this pattern exists.** A CIO running ten AI programs sees ten separate program reports, each claiming progress, none reconciling across the portfolio. Program A vendor conflicts with Program B. Program C's spend trajectory contradicts Program D's budget assumption. Program E's unowned risk is Program F's blocker. The portfolio-level signal is real but invisible in per-program views.

The Control Tower inverts this. Five dimensions are mandatory for every AbarVa tenant at portfolio scale. Atlas synthesizes editorial across them. The CIO gets what matters most right now, with dollar-value pressures and decision prompts, in under thirty seconds of reading.

This pattern exists because File 01 failure mode FM-10 (portfolio blindness) is the dominant reason Fortune 500 AI programs collectively underperform. Individual programs can succeed while the portfolio fails. Traditional tools (BI dashboards, portfolio management systems) surface metrics without editorial synthesis; Atlas provides the editorial.

**Adjacent patterns:**
- M3 · Four-Agent Division of Labor (Atlas is the Tower's agent)
- M1 · Six-Phase Engagement Architecture (phases contribute signals to dimensions)
- M6 · Dual-Ledger Outcome Reconciliation (Phase 6 outcomes feed Spend Trajectory and Use Case status)

**Predecessor patterns:** M3 must exist (Atlas must be defined). Requires M1 programs contributing data.

**Successor patterns:** None; Tower is endpoint synthesis. Tower sub-surfaces (Vendor Portfolio, Shadow AI, Regulatory, AI Council, Model Inventory) extend this pattern.

**Author declaration:** Authored from founder observation of CIO portfolio management practices and the specific gaps observed when portfolios scale beyond 5-10 programs. Not measured from customer deployments.

### Section C · Detection Signals

**Signal C-1 — HIGH.** Tenant has 3+ active AbarVa programs. Tower synthesis becomes non-trivial.

**Signal C-2 — HIGH.** CIO or equivalent executive is a Tower user. Tower is designed for executive consumption; operator-level users have other surfaces.

**Signal C-3 — HIGH.** Enterprise has regulatory or compliance posture requirements. Tower's Regulatory dimension surfaces compliance pressure.

**Signal C-4 — MEDIUM.** Cross-program signals (e.g., vendor overlap, spend consolidation opportunities) exist but are invisible in per-program views.

**Signal C-5 — MEDIUM.** Enterprise has experienced at least one AI failure mode visible only at portfolio level (unowned risk surfacing as crisis, spend trajectory exceeding budget, contradictions between programs).

**Signal C-6 — LOW.** Enterprise explicitly asks for "AI portfolio view." Signal of readiness for Tower.

**Anti-signals:**
- Single-program tenant (nothing to aggregate)
- Tenant operator-level users only (Tower is executive surface)

### Section D · Diagnostic Questions

**D-1.** "How many active AI programs does this enterprise run?"
- 3+ → Tower valuable. <3 → defer Tower; focus on program-level surfaces.

**D-2.** "Who is the primary Tower consumer — CIO, CAIO, CTO, or other executive?"
- Determines default Tower view preferences.

**D-3.** "What cross-program signals does this enterprise most need visibility into?"
- Drives dimension emphasis (some tenants prioritize Spend; others Contradictions).

**D-4.** "What regulatory posture is relevant?"
- Determines Regulatory sub-surface activation.

**D-5.** "What is the expected Tower consumption cadence — daily, weekly, pre-executive-meeting?"
- Drives alert/digest frequency.

**D-6.** "What drill-in paths does the CIO expect from Tower?"
- Standard drill-ins: pressure card → program; vendor overlap → vendor portfolio; risk → program and governance.

### Section E · Interventions

The five canonical dimensions with sub-surfaces.

**Dimension E-1 · Use Cases**

*What it measures:* Inventory of AI use cases across the enterprise. Status per use case (in intake, in charter, in diagnose, in design, in execute, in verify, shelved). Total count. Phase distribution. Value range (projected + realized).

*Editorial synthesis:* "12 use cases, 4 in Execute, 2 reach Verify this quarter, $47M projected value, $8M realized to date."

*Sub-surface:* Use Case Portfolio (dedicated view of all use cases with filters).

**Dimension E-2 · Contradictions**

*What it measures:* Count of contradictions surfaced in Phase 3 Diagnose across programs. Attributed dollar impact where known. Resolution status.

*Editorial synthesis:* "18 contradictions surfaced this quarter. 11 resolved, 7 open. 3 are cross-program (same underlying data issue in multiple programs)."

*Sub-surface:* Contradictions register with program, deliverable, resolution status.

**Dimension E-3 · Unowned Risks**

*What it measures:* Governance gaps — AI capabilities deployed without clear ownership, policies missing, audit coverage incomplete.

*Editorial synthesis:* "4 unowned risks. Highest: shadow AI in finance, 12 tools detected, no owner assigned."

*Sub-surface:* Shadow AI detection, Regulatory Posture gap analysis, AI Council decision backlog.

**Dimension E-4 · Spend Trajectory**

*What it measures:* AI-related spend evolution over time. Spend-per-program, spend-per-vendor, spend-per-capability. Compared to budget and prior period.

*Editorial synthesis:* "AI spend $3.2M/month trending up 18% quarter-over-quarter. Vendor consolidation could recover $420K/month."

*Sub-surface:* Vendor Portfolio with spend breakdown and rationalization recommendations.

**Dimension E-5 · Last-Turn-Ago**

*What it measures:* Engagement velocity per program — time since last meaningful progress. Identifies stalled programs.

*Editorial synthesis:* "2 programs with no activity >14 days. Program X (Ambient Clinical) blocked on sponsor review since April 8."

*Sub-surface:* Program velocity dashboard with stall detection.

**Atlas's composition role:** Atlas reads across all five dimensions, identifies the two-to-three highest-pressure signals, composes editorial in 150 words or less with specific dollar amounts and decision prompts. Pressure cards render the top signals prominently; the rest of Tower provides drill-down context.

### Section F · Evidence Base

**Research basis.** Synthesized from CIO portfolio management practices observed at Fortune 500 scale. The five-dimension taxonomy reflects founder judgment about which portfolio-level signals matter most; possible alternatives (e.g., adding Talent Utilization as sixth dimension) considered and rejected for initial version.

**Comparable architectures.** Traditional IT portfolio management tools (ServiceNow IT Business Management, Apptio) surface spend and inventory but lack editorial synthesis. BI dashboards (PowerBI, Tableau) require manual interpretation. AbarVa Tower specifically provides Atlas-synthesized editorial that competitors don't.

**Confidence declaration.** AUTHORED-DRAFT. Five-dimension choice reflects considered judgment. Sub-surface additions and dimension refinements expected as customer portfolios mature.

### Section G · Observations

Current observations empty.

Expected observation categories:
- Tenants where one dimension dominates attention (may signal structural org issue)
- Tenants where Tower usage correlates with program success rate
- Pressure cards that repeatedly surface without resolution (governance gap)
- Atlas editorial synthesis patterns that CIOs find most useful
- Drill-in paths most frequently traversed (informs sub-surface priority)

### Section H · Failure Modes

**Failure H-1 · Atlas editorial becomes status summary.**

*Description:* Under generic training, Atlas drifts from editorial ("Rationalize vendors to recover $420K/month") to status ("12 vendors in portfolio, 3 overlap").

*Detection:* Atlas response tone analysis against voice contract. Missing dollar amounts, missing decision prompts.

*Remediation:* System prompt reinforced. Length check for decision prompt. Weekly Atlas output audit during cycle retrospective.

**Failure H-2 · Pressure cards drill-in to nothing.**

*Description:* Tower's top pressure card clicks to a blank page or 404. Observed directly in crawler walks. Kills Tower credibility.

*Detection:* Click-through testing. Crawler persona re-runs.

*Remediation:* Every pressure card has resolved drill-in target before render. Broken target flagged in Stage 7 per File 08 Section 9.4. Fixed in Cycle 1.

**Failure H-3 · Dimension emphasis misaligned with CIO priority.**

*Description:* Tower emphasizes Use Case dimension when the CIO cares most about Spend. Wastes executive attention.

*Detection:* CIO feedback. Dimension click-through analytics.

*Remediation:* Per-tenant dimension prioritization (in Admin settings). Atlas adapts editorial emphasis.

**Failure H-4 · Sub-surface depth exceeds Tower summary value.**

*Description:* Sub-surfaces become feature-rich competitors to Tower itself. Tower becomes navigation surface rather than synthesis surface.

*Detection:* Session analytics showing Tower landing skip rate high.

*Remediation:* Tower always leads with Atlas editorial. Sub-surfaces linked from Tower, never from nav alone.

### Section I · Cross-References

**Related patterns:** M1, M2, M3, M6.

**Tower sub-surfaces:** Vendor Portfolio, Shadow AI Detection, Regulatory Posture, AI Council, Model Inventory, Use Case Portfolio.

**Programs using this pattern:** All tenants with 3+ active programs.

**File cross-refs:** File 04 Section Tower. File 08 Section 5.3 (Atlas voice contract). File 09 Section 10 (Tower surface specification).

### Section J · Authoring Metadata

- **Authored by:** Anand Sundaram
- **Authoring date:** 2026-04-24
- **Version:** 1.0
- **Status:** AUTHORED-DRAFT
- **Change log:**
  - v1.0 · Initial authoring. Documents five-dimension Tower with Atlas editorial composition, sub-surface catalog, and drill-in mechanics.

---

## M5 · The Three-Tier Deliverable System

```yaml
---
pattern_name: "The Three-Tier Deliverable System"
pattern_slug: "three-tier-deliverable-system"
tier: "M"
vertical: "cross-industry"
thesis: "Every AbarVa deliverable is produced at one of three tiers — Rich (12 components, hero artifact), Outline (8 components, substantive), Stub (6 components, dignified scheduled placeholder) — with tier selection driven by deliverable stakes, phase, and audience."
applicability: "Applies to every deliverable produced by AbarVa programs. Tier is visible in the deliverable header. No deliverable exists outside this system."
regulatory_chips: []
authored_by: "Anand Sundaram"
authoring_date: "2026-04-24"
status: "AUTHORED-DRAFT"
version: "1.0"
adjacent_patterns: ["six-phase-engagement-architecture", "seventeen-module-program-composition"]
---
```

### Section A · Identity

**Pattern name:** The Three-Tier Deliverable System

**Pattern slug:** `three-tier-deliverable-system`

**Tier:** M

**Vertical:** Cross-industry

**Thesis:** Every deliverable produced by an AbarVa program is rendered at one of three tiers. Rich (12 components) for hero artifacts carrying million-dollar decisions. Outline (8 components) for substantive deliverables that don't need Rich depth. Stub (6 components) for scheduled deliverables whose activation conditions haven't been met yet — read as dignified scheduled placeholders, never as "coming soon" text. Tier selection is deterministic based on deliverable stakes, phase, and audience.

**Applicability:** Every deliverable. Tier visible in deliverable header badge.

**Does not apply to:** Ad-hoc artifacts generated outside program context (agent chat responses, operational audit logs).

**Regulatory chips:** Rich-tier deliverables in regulated industries carry additional compliance metadata (HIPAA audit trail for healthcare, SOX attestation for financial services).

### Section B · Context

**Why this pattern exists.** Consulting deliverables come in one flavor: expensive PowerPoints. A $2M engagement produces 47 slides whether the decision warrants 12 or 120. Authoring effort is undifferentiated. Reader can't tell which deliverables matter most.

AbarVa's three-tier system matches effort to stakes. Rich deliverables get 8-12 hours of authoring; they carry decisions the CFO will defend in the boardroom. Outline deliverables get 2-4 hours; they document substantive work without excess. Stub deliverables get 30 minutes; they transparently acknowledge that a deliverable is scheduled for later phase while preserving navigation and structure.

This pattern is also the source of AbarVa's quality credibility. When every deliverable has a visible tier badge, users know what quality to expect. A Rich deliverable without deep evidence is a bug. A Stub deliverable feels dignified, not lazy, because its purpose is transparent.

**Adjacent patterns:**
- M1 · Six-Phase Engagement Architecture (phase determines typical tier)
- M2 · Seventeen-Module Program Composition (module type suggests tier)

**Predecessor patterns:** M1 and M2 must exist.

**Successor patterns:** Tier-specific authoring guidance per deliverable type (not yet separately authored).

**Author declaration:** Authored from observation of consulting deliverable quality variance and the structural fix AbarVa intends to provide. Not measured from customer deployments.

### Section C · Detection Signals

**Signal C-1 — HIGH.** Every deliverable produced by any AbarVa program — this pattern always applies.

**Signal C-2 — HIGH.** Deliverable carries a decision the CXO will defend externally. Rich tier required.

**Signal C-3 — HIGH.** Deliverable is structural but not hero-stakes (Findings report, Implementation Plan). Outline tier default.

**Signal C-4 — HIGH.** Deliverable activates in a later phase than current. Stub tier required until activation conditions met.

**Signal C-5 — MEDIUM.** Deliverable audience is external (auditor, regulator, board). Rich tier default regardless of phase.

**Signal C-6 — MEDIUM.** Deliverable is part of a deliverable chain with tier escalation (draft Outline → final Rich for board meeting).

**Anti-signals:**
- Ad-hoc agent chat responses (not deliverables; no tier)
- Internal AbarVa operational logs (not client-facing; no tier)

### Section D · Diagnostic Questions

**D-1.** "Who is the audience for this deliverable?"
- External (board, auditor, regulator) → Rich default. Internal sponsor → Outline typical.

**D-2.** "What decision does this deliverable support?"
- Million-dollar+ commitment → Rich. Operational advance → Outline. Future-phase scheduled → Stub.

**D-3.** "Has the deliverable's activation conditions been met?"
- No → Stub. Yes → Rich or Outline based on stakes.

**D-4.** "Does the deliverable require inline evidence citations (E1-E7 style)?"
- Yes → Rich. No → Outline or Stub.

**D-5.** "Is this deliverable typically a hero artifact for this program archetype?"
- Yes (e.g., Decision Memo for Strategic Transformation) → Rich. No → Outline.

**D-6.** "Does the deliverable need to be print-ready for offline review?"
- Yes → Rich (includes print CSS). No → Outline or Stub acceptable.

### Section E · Interventions

The three tiers are the intervention.

**Intervention E-1 · Rich Tier**

*Components (12):*
1. Header with tier badge
2. Executive summary (Georgia serif 19px prominent)
3. 4-card KPI strip
4. Recommendation body with inline E1-E7 citations
5. Data table with highlights
6. Inline SVG chart with caption
7. Decision log excerpt
8. Three risks with mitigations
9. Sticky sidebar with section nav
10. Cross-links (related patterns, analogous programs)
11. Evidence base link
12. Tier badge (Rich)

*Authoring effort:* 8-12 hours per deliverable minimum.

*Typical deliverables:* Decision Memo (module #11), Business Case + ROI (module #12), Outcome Reconciliation Report (module #17).

*Print-ready:* Yes. Print CSS preserves layout.

**Intervention E-2 · Outline Tier**

*Components (8):*
1. Header with tier badge
2. Executive summary
3. 2-card KPI strip
4. Recommendation body with inline citations
5. Decision log excerpt
6. Two risks with mitigations
7. Sticky sidebar (section nav only)
8. Tier badge (Outline)

*Authoring effort:* 2-4 hours per deliverable.

*Typical deliverables:* Findings report (module #6), Implementation Plan (module #13), Change Management Plan (module #15).

*Print-ready:* Acceptable but not required.

**Intervention E-3 · Stub Tier**

*Components (6):*
1. Header with tier badge (Stub)
2. Teal scheduled banner with activation conditions
3. Four trigger conditions with state badges (In progress / Not yet / Complete)
4. Three prerequisite deliverables with links
5. Six-item structure preview (what the deliverable will contain once activated)
6. Full navigation preserved

*Authoring effort:* 30 minutes per deliverable (reusable template).

*Typical deliverables:* Phase 6 deliverables during Phase 3 (not yet activatable), Phase 5 execution artifacts during Phase 4.

*Print-ready:* Not applicable.

**Tier selection logic (automated):**
- Module #11, #12, #17 default to Rich
- Modules #6, #13, #15 default to Outline
- Any deliverable whose phase has not yet activated defaults to Stub
- Override available via deliverable configuration (with rationale documented)

### Section F · Evidence Base

**Research basis.** Synthesized from consulting deliverable quality observations and the specific failure mode that every deliverable receives identical effort regardless of stakes. Three-tier structure reflects deliberate reduction to minimum useful taxonomy.

**Comparable architectures.** No direct comparables in consulting or enterprise AI platforms. Tier-based deliverable systems exist in software documentation (diataxis framework's Tutorial/How-to/Reference/Explanation) but not in enterprise transformation products.

**Confidence declaration.** AUTHORED-DRAFT. Three-tier structure reflects founder judgment. Tier component counts (12/8/6) may refine. Specific deliverables' default tiers may adjust based on observation.

### Section G · Observations

Current observations empty. Expected categories:

- Tenants whose Rich deliverables are read by CXOs vs. ignored
- Outline deliverables that should have been Rich (upgrades)
- Stub deliverables that user feedback praised (confirmation of pattern)
- Tier selection overrides and their rationale
- Authoring effort actual vs. target per tier

### Section H · Failure Modes

**Failure H-1 · Tier drift under time pressure.**

*Description:* Rich deliverable authored at Outline depth. Tier badge stays Rich. Quality gap invisible.

*Detection:* Component count check. Rich deliverables missing components.

*Remediation:* Automated component count validation. Deliverable cannot ship Rich if components incomplete. Fallback to Outline with documented reason.

**Failure H-2 · Stub reads as "coming soon."**

*Description:* Stub banner doesn't clearly explain activation conditions. User feels deliverable is missing rather than scheduled.

*Detection:* User feedback. Stub deliverable click-through to "request escalation."

*Remediation:* Stub banner always includes: phase of activation, specific trigger conditions, prerequisites, preview of content. Dr. L persona praised D25 exemplar for this treatment; spec locked.

**Failure H-3 · Tier proliferation (new tiers added).**

*Description:* Request for "mini-Rich" tier or "Rich-plus" tier. Three-tier system erodes.

*Detection:* Tier taxonomy change requests.

*Remediation:* Three tiers are canonical. Any proposed new tier requires founder sign-off. Most "mini-Rich" requests resolve to Outline with additional component; most "Rich-plus" requests resolve to Rich with explicit override.

**Failure H-4 · Tier badge invisible or inconsistent.**

*Description:* Tier badge present on some deliverables, absent on others. User trust in tier promise erodes.

*Detection:* Tier badge presence check in render audit.

*Remediation:* Tier badge is required component in all three tiers (verify at render time). Missing badge = failed render.

### Section I · Cross-References

**Related patterns:** M1, M2, M6.

**Deliverables producing each tier:** See Intervention E-1 through E-3 above.

**File cross-refs:** File 09 Section 7 (Deliverable page specification). File 10 Section 6.5 (Tier badge component).

### Section J · Authoring Metadata

- **Authored by:** Anand Sundaram
- **Authoring date:** 2026-04-24
- **Version:** 1.0
- **Status:** AUTHORED-DRAFT
- **Change log:**
  - v1.0 · Initial authoring. Documents three-tier system with component counts, authoring effort targets, and default tier assignments.

---

## M6 · The Dual-Ledger Outcome Reconciliation

```yaml
---
pattern_name: "The Dual-Ledger Outcome Reconciliation"
pattern_slug: "dual-ledger-outcome-reconciliation"
tier: "M"
vertical: "cross-industry"
thesis: "Every AbarVa program reconciles Phase 4 projected value against Phase 6 realized value in a dual ledger. Variance gets attributed to causes. The reconciliation is the accountability mechanism that differentiates AbarVa from consulting and the substrate for outcome-as-a-service commercial terms."
applicability: "Applies to every program that reaches Phase 6 Verify. Programs that terminate before Phase 6 produce a partial ledger with explicit termination-state commentary."
regulatory_chips: []
authored_by: "Anand Sundaram"
authoring_date: "2026-04-24"
status: "AUTHORED-DRAFT"
version: "1.0"
adjacent_patterns: ["six-phase-engagement-architecture", "seventeen-module-program-composition", "three-tier-deliverable-system"]
---
```

### Section A · Identity

**Pattern name:** The Dual-Ledger Outcome Reconciliation

**Pattern slug:** `dual-ledger-outcome-reconciliation`

**Tier:** M

**Vertical:** Cross-industry

**Thesis:** At Phase 4 Design, every AbarVa program produces a projected value ledger with specific dollar amounts, mechanisms, timelines, and assumptions. At Phase 6 Verify, that same program produces a realized value ledger measuring what actually happened. The two ledgers reconcile side-by-side. Variance gets attributed to causes — what worked, what didn't, what external factors intervened. This reconciliation is AbarVa's accountability mechanism. It is also the financial substrate for outcome-as-a-service pricing.

**Applicability:** Every program reaching Phase 6 Verify produces a reconciliation. Programs terminated early produce partial ledgers with termination-state documentation.

**Does not apply to:** Programs still in Phase 1-5 (no Phase 6 data yet). Ad-hoc advisory conversations that never enter the phase architecture.

**Regulatory chips:** SOX attestation applicable for reconciliations affecting public-company financial reporting.

### Section B · Context

**Why this pattern exists.** Consulting engagements end at deliverable completion. "We built the strategy; execution is your responsibility." Projected value from the business case never reconciles against actual outcomes. The consulting firm moves to the next engagement; the client remembers the projection became reality or didn't, but no document reconciles.

This is the single most important structural failure of the consulting model. Without reconciliation, no accountability. Without accountability, no learning. Without learning, no compounding.

AbarVa's dual ledger inverts this. Phase 4 projection is specific — $14-22M annual value from Ambient Clinical transformation, mechanism = coder productivity gain of 18-24%, timeline = realization within 9 months of go-live, assumptions = Epic integration operational, CDI workflow retained, training completion >85%. Phase 6 measurement is equally specific — realized annual value = $17.3M at 12 months, mechanism = coder productivity gain measured at 21%, timeline variance = +3 months, assumption variance = Epic integration took 2 months longer than projected.

Reconciliation attributes the variance. 21% coder productivity is within projected range. Timeline variance traces to Epic integration complexity (attribution: scope underestimation). Net: program delivered outcomes within projected range despite timeline slip.

This pattern is also the financial basis for outcome-as-a-service pricing. AbarVa's commercial model captures a share of measurable realized value. Without the reconciliation, outcome-as-a-service is unverifiable. With the reconciliation, it's auditable.

**Adjacent patterns:**
- M1 · Six-Phase Engagement Architecture (Phase 4 projects; Phase 6 measures)
- M5 · Three-Tier Deliverable System (reconciliation report is Rich tier)
- M2 · Seventeen-Module Program Composition (modules #12 and #17 produce the two ledger sides)

**Predecessor patterns:** All prior M-patterns must exist. The full operating model must be in place.

**Successor patterns:** None; reconciliation is endpoint. Feedback into pattern library via M6 Section G observation contribution.

**Author declaration:** Authored from founder observation that outcome accountability is the single largest gap in consulting commercial models, and the specific structural remedy that enterprise AI platforms can uniquely provide.

### Section C · Detection Signals

**Signal C-1 — HIGH.** Program has passed Phase 4 gate 3 with projected-value ledger documented.

**Signal C-2 — HIGH.** Program has completed Phase 5 Execute with go-live.

**Signal C-3 — HIGH.** Post-go-live measurement window has elapsed (typically 6-12 months depending on program type).

**Signal C-4 — HIGH.** Commercial terms include outcome-as-a-service component.

**Signal C-5 — MEDIUM.** Client requests outcome verification (board reporting, regulatory compliance).

**Signal C-6 — MEDIUM.** Pattern library compounding requires observation contribution from this program's outcomes.

**Anti-signals:**
- Program terminated before Phase 4 (no projected ledger to reconcile)
- Program in active Phase 5 Execute (no Phase 6 data yet)

### Section D · Diagnostic Questions

**D-1.** "What specific dollar amount was projected in Phase 4 Business Case module?"
- Required. Reconciliation is impossible without explicit projection.

**D-2.** "What mechanism was identified — how would projected value be realized?"
- Required. Reconciliation traces mechanism, not just dollar amount.

**D-3.** "What assumptions underpinned the projection?"
- Required. Variance often traces to assumption-variance.

**D-4.** "What measurement instruments will capture realized value?"
- Required at Phase 4. Set up before go-live so measurement is clean.

**D-5.** "Who owns outcome measurement — client finance, AbarVa, joint?"
- Typically joint for outcome-as-a-service programs. Roles explicit.

**D-6.** "What happens if realized value falls materially below projection?"
- Outcome-as-a-service commercial terms handle this. Fee attachment to realized, not projected.

### Section E · Interventions

The dual-ledger reconciliation is the intervention. Five structural elements.

**Intervention E-1 · Phase 4 Projected Ledger**

*Produced by:* Module #12 Business Case + ROI.

*Required fields:*
- Projected dollar value (typically annual value with ranges)
- Realization mechanism (how value emerges)
- Realization timeline
- Underlying assumptions (enumerated)
- Measurement methodology (how realized value will be captured)
- Measurement instruments (specific reports, metrics, dashboards)
- Measurement ownership (client, AbarVa, joint)

*Tier:* Rich (hero deliverable).

*Confidence grade:* Per Section F evidence. Projected ranges include confidence bounds.

**Intervention E-2 · Post-Go-Live Measurement Window**

*Duration:* Typically 6-12 months based on program type. Ambient Clinical 12-month measurement. Quick-win operational programs 6-month measurement.

*During this window:* Phase 5 Execute monitoring continues. Measurement instruments run. Data collection ongoing.

*Nexus engagement:* Monitors early signals. Flags variance >15% as early warning.

*Steward engagement:* Audits measurement instrument integrity. Flags methodology drift.

**Intervention E-3 · Phase 6 Realized Ledger**

*Produced by:* Module #16 Outcome Measurement and Module #17 Benefits Realization + Genome Feedback.

*Required fields:*
- Measured dollar value (annual, with time window)
- Mechanism validation (did the projected mechanism operate?)
- Timeline actual vs. projected
- Assumption status (each Phase 4 assumption: held, violated, irrelevant)
- Measurement instrument results
- Measurement quality score (how clean was the data)
- Variance to projection with attribution

*Tier:* Rich.

*Confidence grade:* Per actual measurement quality. Clean measurement = HIGH. Noisy or partial measurement = MEDIUM. Missing or contested measurement = LOW with explicit prose.

**Intervention E-4 · Variance Attribution**

*Structure:* For each dimension (value, mechanism, timeline, assumptions), variance is attributed to one or more categories:
- Scope variance (projection was wrong about scope)
- Execution variance (execution differed from plan)
- External variance (factors outside AbarVa or client control)
- Measurement variance (measurement instrument issues)
- Combined (multiple factors)

*Output:* Attribution table with cause, magnitude, responsibility.

**Intervention E-5 · Commercial Reconciliation**

*For programs with outcome-as-a-service terms:*
- Realized value → outcome fee calculation per contract
- Variance attribution → fee adjustments per contract
- Dispute resolution → per contract terms

*For programs without outcome-as-a-service (fixed fee):*
- Reconciliation documented for learning
- No commercial adjustment
- Observations contribute to pattern library regardless

### Section F · Evidence Base

**Research basis.** Authored from founder observation of outcome-accountability failure in consulting engagements and the structural mechanism AbarVa provides.

**Comparable architectures.** Outcome-as-a-service pricing exists in limited form in enterprise software (certain SaaS vendors offer success-based pricing; consulting firms occasionally attach some fees to outcomes). AbarVa's dual-ledger is the specific mechanism that makes outcome-as-a-service verifiable at enterprise scale.

**Regulatory references.** Programs affecting public-company financial reporting may require SOX attestation on the reconciliation. HIPAA programs may require audit trail on measurement instrument data.

**Confidence declaration.** AUTHORED-DRAFT. Dual-ledger structure is considered founder judgment. Specific measurement methodologies will accumulate per program type as programs complete Phase 6.

### Section G · Observations

Currently empty.

Expected observation categories:
- Programs where projected value was conservative vs. aggressive; which calibrated better
- Variance attribution patterns (which causes dominate across programs)
- Measurement instrument types that produced clean vs. noisy data
- Outcome-as-a-service commercial disputes and resolution patterns
- Observation contributions from Phase 6 that most strongly improved subsequent pattern authoring

### Section H · Failure Modes

**Failure H-1 · Projected ledger vague (fails reconciliation setup).**

*Description:* Phase 4 Business Case produces a value range ("$10-30M" with no mechanism detail, no timeline, no assumptions). Phase 6 cannot reconcile against vague projection.

*Detection:* Schema validation at Phase 4 deliverable commit. Required fields missing.

*Remediation:* Hard validation — projected ledger cannot ship without all required fields populated. Nexus pushes back on vague projections.

**Failure H-2 · Measurement instrument not set up at Phase 4.**

*Description:* Projected value assumes a measurement dashboard that doesn't yet exist. Phase 6 arrives; measurement impossible.

*Detection:* Phase 4 gate checklist includes measurement-instrument-identified check.

*Remediation:* Phase 4 deliverable requires measurement instrument specification with ownership assigned. Pre-go-live verification that instrument is operational.

**Failure H-3 · Reconciliation becomes narrative rather than accounting.**

*Description:* Phase 6 report says "program succeeded" without specific dollar reconciliation. Accountability theater.

*Detection:* Reconciliation report schema validation. Missing numeric reconciliation.

*Remediation:* Rich tier reconciliation deliverable requires dual-ledger side-by-side table. Narrative allowed as supplementary, not substitute.

**Failure H-4 · Client disputes variance attribution.**

*Description:* Variance attributed to "execution variance" (implying client execution failure). Client disputes; claims external variance.

*Detection:* Phase 6 sign-off delayed by attribution dispute.

*Remediation:* Attribution is collaborative, not unilateral. Nexus facilitates joint attribution workshop with client sponsor. Disputes escalate per contract terms.

### Section I · Cross-References

**Related patterns:** M1, M2, M5.

**Modules producing this pattern:** #12 (Phase 4 projection), #16 (Phase 6 measurement), #17 (Phase 6 reconciliation and observation contribution).

**Deliverables:** Business Case + ROI (Phase 4), Outcome Reconciliation Report (Phase 6). Both Rich tier.

**File cross-refs:** File 01 FM-9 (ongoing value tracking), FM-12 (learning capture).

### Section J · Authoring Metadata

- **Authored by:** Anand Sundaram
- **Authoring date:** 2026-04-24
- **Version:** 1.0
- **Status:** AUTHORED-DRAFT
- **Change log:**
  - v1.0 · Initial authoring. Documents dual-ledger structure, post-go-live measurement window, variance attribution, and commercial reconciliation.

---

## Closing · Meta-pattern coverage complete

Six meta-patterns now authored in AUTHORED-DRAFT state:

- M1 · Six-Phase Engagement Architecture (authored in `00-vision-catalog-template-first-pattern.md`)
- M2 · Seventeen-Module Program Composition
- M3 · Four-Agent Division of Labor
- M4 · Five-Dimension Control Tower
- M5 · Three-Tier Deliverable System
- M6 · Dual-Ledger Outcome Reconciliation

These six collectively describe AbarVa's full operating model. Every subsequent pattern (Tier 1 Craft, Tier 2 Capability, Tier 3 Use-case) inherits from this foundation.

**Next authoring cycle:**
- Internal peer review of all six meta-patterns
- Revisions based on review
- Domain expert reviews scheduled
- Promotion to AUTHORED-REVIEWED targeted within two weeks
- First Tier 1 Craft pattern authored (T1-01 AI Governance recommended) using established template
- First deep revision of Tier 3 Use-case pattern (T3-H01 Ambient Clinical) to match canonical template

*End of M2-M6 authoring.*
