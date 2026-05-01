# Detailed Pattern-to-Value and Agent Training Playbook

Date: April 30, 2026  
Purpose: Provide a practical, category-level operating guide for how the knowledge layer should solve client problems, translate to measurable value, and train agents for consistent grounded performance.

## 1) Why This Addendum Exists

This addendum goes deeper than inventory. It explains, for each corpus category:

- What the category contains
- Why it matters to client outcomes
- How to apply it in program workflows
- How it translates into measurable value
- How agents should be trained to use it correctly

---

## 2) Category-by-Category Pattern-to-Value Table

| Category | Anchor Example(s) | What It Is | Why It Matters | Client Problem Signals | How To Apply In Program Flow | Value Translation | Agent Training Requirements |
|---|---|---|---|---|---|---|---|
| `pattern` | `PAT-FM-03-DUAL-RUN-CUTOVER`, `PAT-FM-06-GOVERNANCE-RISK-PLAYBOOK` | Reusable execution logic tied to failure modes, lifecycle phases, and industry adjustments. | Gives teams proven “do this, not that” pathways before risk compounds. | Repeated delays, decision churn, cutover anxiety, unresolved ownership. | In P1-P3, select top active failure modes; map each to one pattern and required evidence. In P4-P5, convert pattern into readiness gates and acceptance criteria. | Fewer avoidable incidents, faster decision closure, better predictability to go-live. | Agent must always bind recommendation to active failure mode tags and phase context. Agent response must include pattern ID + why chosen + required evidence. |
| `anti-pattern` | `ANT-FM-03-BIG-BANG-MIGRATION`, `ANT-FM-08-PILOT-TO-PROD-TRAP` | Failure signatures with early warning indicators and remediation guidance. | Helps teams detect risks while they are still cheap to fix. | “Looks green” status despite repeated escalations; no tested rollback; vague ownership. | Weekly governance: run anti-pattern checklist across RAID log and decision ledger. If matched, auto-trigger remediation and escalation path. | Reduced late-stage rework, fewer failed cutovers, lower incident recovery cost. | Agent must perform negative testing: “Which anti-patterns are currently present?” and produce mitigation steps tied to evidence artifacts. |
| `solution-architecture` | `SA-DF-LAKEHOUSE-AZURE`, `SA-FS-RISK-LAKEHOUSE-AWS` | Structured platform blueprints with components, cloud fit, and lifecycle fit. | Converts strategy into implementable architecture options with tradeoffs. | Architecture debates without decision criteria; vendor-first selection without workload fit. | In P2-P3: shortlist 2-3 architectures by industry + constraints. In Evaluation/Selection: compare against decision framework dimensions. | Better architecture fit, reduced redesign churn, lower total delivery risk. | Agent must surface at least two architecture options and explicit tradeoff matrix (cost/speed/risk/talent/lock-in). |
| `deliverable-template` | `DEL-CHARTER-AI-PROGRAM-V1`, `DEL-ROADMAP-V1` | Structured artifact blueprints with evidence and section requirements. | Standardizes quality of program outputs and makes decisions auditable. | Steering artifacts inconsistent; decisions hard to trace; outputs vary by team member. | Use templates as mandatory output contracts at phase exits (P0/P1 charter, P2 roadmap, P4 cutover packet). | Reduced document rework, clearer executive decision-making, faster steering cycles. | Agent must generate outputs in template structure; evaluator fails responses that do not conform to required sections. |
| `decision-framework` | `DF-BUILD-VS-BUY-AI-COMPONENT`, `DF-PRIORITIZE-USE-CASES-V1` | Recurring decision logic with dimensions and scoring approaches. | Prevents ad-hoc choices and overconfidence in one option/vendor. | Reversals after selection; “gut-feel” decisions; unresolved option conflicts. | For each major decision, require framework run with scored options and confidence notes; archive decision memo + assumptions. | Faster decision velocity, lower reversal rate, clearer rationale for governance and audit. | Agent must output scored alternatives, assumptions, confidence level, and recommended decision with reversible path. |
| `evidence-template` | `EV-P1-BASELINE-METRIC-CAPTURE`, `EV-CONTROL-TEST-V1` | Defines what evidence is needed to justify readiness, value, and control posture. | Ensures claims are backed by data; supports governance and compliance defensibility. | “We think it’s working” without baseline; no auditable control evidence; disputed KPI outcomes. | Attach evidence requirements to each decision gate; block progression when evidence is missing or weak. | Better value attribution, stronger audit posture, fewer disputed outcomes. | Agent must classify evidence quality (high/medium/low) and list missing evidence before final recommendation. |
| `industry-source-system` | `SYS-HC-EPIC-CLARITY`, `SYS-FS-FISERV-DNA`, `SYS-RT-SALESFORCE-COMMERCECLOUD` | Profiles real source systems, data structures, integration surfaces, and constraints. | Grounds recommendations in actual client data estate instead of generic abstractions. | Migration plans ignore source-system realities; integration estimates consistently wrong. | During discovery, map client estate to source-system profiles; apply modernization patterns and integration constraints. | More accurate estimates, fewer integration surprises, better modernization sequencing. | Agent must reference source-system IDs when discussing architecture/migration and include system-specific constraints. |
| `vendor-implementation` | `VI-LAKEHOUSE-DATABRICKS`, `VI-SNOWFLAKE-IMPLEMENTATION` | Vendor-specific execution overlays connected to parent architecture/patterns. | Turns abstract strategy into concrete delivery choices and cost/operating assumptions. | Vendor discussion remains marketing-level; implementation details missing until late. | In evaluation and build planning, compare 2-3 vendor implementations against program constraints and talent profile. | Better vendor fit, lower platform sprawl risk, reduced surprise costs. | Agent must distinguish platform capability from implementation readiness and include explicit assumptions + risk notes. |
| `regulatory-frame` | `REG-US-FED-HIPAA-PRIVACY-RULE`, `REG-EU-GEN-AI-ACT` | Operationalized compliance requirements linked to controls and evidence artifacts. | Prevents governance from being bolted on late; reduces regulatory/regret risk. | Compliance review starts post-design; controls undefined; policy mapping incomplete. | Bring regulatory frames into P1-P3 design decisions and evidence templates; enforce control tests before activation. | Lower compliance risk, reduced remediation cycles, stronger trust with stakeholders/regulators. | Agent must auto-inject relevant regulatory checks by industry/jurisdiction and cite required control evidence. |

---

## 3) How This Solves Real Client Problems (Examples)

## Example A: Healthcare IDN data modernization with Epic

Problem:
- Legacy warehouse + fragmented clinical/operational data + pressure for AI use cases.

Context-layer retrieval set:
- `industry-source-system`: `SYS-HC-EPIC-CLARITY`
- `pattern`: `PAT-FM-03-DUAL-RUN-CUTOVER`
- `solution-architecture`: `SA-DF-LAKEHOUSE-AZURE`
- `regulatory-frame`: `REG-US-FED-HIPAA-PRIVACY-RULE`
- `evidence-template`: `EV-P1-BASELINE-METRIC-CAPTURE`

Agent output should provide:
1. Modernization options with phased cutover approach.
2. HIPAA control implications and required evidence list.
3. 30/60/90 execution plan tied to P2-P5.
4. Value metrics baseline and post-cutover targets.

Value translation:
- Reduced cutover risk, faster activation, auditable compliance posture, measurable value realization.

## Example B: Financial services model governance uplift

Problem:
- Fast model rollout pressure with weak model risk governance.

Context-layer retrieval set:
- `regulatory-frame`: `REG-US-FED-SR-11-7`
- `anti-pattern`: `ANT-FM-06-GOVERNANCE-RISK-TRAP`
- `decision-framework`: `DF-RISK-ACCEPTANCE-V1`
- `evidence-template`: `EV-CONTROL-TEST-V1`

Agent output should provide:
1. Governance gaps against regulation-aligned controls.
2. Immediate remediation sequence by risk severity.
3. Evidence artifacts required for sign-off.

Value translation:
- Lower governance exposure, fewer audit findings, more stable production model operations.

## Example C: Retail personalization platform decision

Problem:
- Need personalization uplift while controlling vendor lock-in and cost growth.

Context-layer retrieval set:
- `solution-architecture`: retail-target architectures
- `vendor-implementation`: competing options
- `decision-framework`: `DF-BUILD-VS-BUY-AI-COMPONENT`
- `pattern`: `PAT-FM-07-VENDOR-DECISIONS-PLAYBOOK`

Agent output should provide:
1. Option matrix and tradeoff scoring.
2. Recommendation with reversible checkpoints.
3. KPI/value tree and decision confidence level.

Value translation:
- Better selection quality, fewer reversals, faster time-to-value under controlled cost.

---

## 4) Agent Training Plan (Detailed)

## 4.1 Training objective

Train agents to produce:

- context-aware
- evidence-grounded
- decision-oriented
- uncertainty-honest

outputs, not generic LLM summaries.

## 4.2 Training stack

### Layer 1: Retrieval policy contract (non-optional)

For every response class, define mandatory context layers:

- Strategy questions: doctrine + industry + client
- Architecture questions: industry + client + vendor + regulatory
- Delivery risk questions: program + run-state + anti-pattern + evidence
- Governance questions: regulatory + evidence + anti-pattern

Hard rule:
If client/program context exists, doctrine-only answers are disallowed.

### Layer 2: Response schema training

Require this output shape for key advisory responses:

1. Recommendation
2. Why this recommendation now
3. Alternatives considered
4. Risks and mitigations
5. Required evidence
6. 30/60/90 action steps
7. Provenance (IDs used)
8. Confidence + uncertainty notes

### Layer 3: Evaluator/rubric training

Automated checks per answer:

- Retrieval completeness: were required context layers used?
- Evidence grounding: are claims linked to evidence/templates?
- Compliance inclusion: when required, were regulatory constraints addressed?
- Tradeoff quality: were alternatives and assumptions explicit?
- Hallucination risk: unsupported claims detected?

Scoring recommendation (0-5 each):
- Relevance
- Grounding
- Actionability
- Risk/compliance completeness
- Uncertainty honesty

Release threshold:
- Mean >= 4.2
- No critical grounding failures

### Layer 4: Agent-specific tuning

#### Nexus

Train for:
- program decision acceleration
- execution realism

Must include:
- phase-aware recommendations
- deliverable template outputs
- evidence gaps before final recommendation

#### Sentinel

Train for:
- deep synthesis across doctrine, industry, and client signals

Must include:
- cross-industry transfer note
- vendor/regulatory synthesis
- provenance-rich rationale

#### Atlas

Train for:
- cross-program portfolio intelligence

Must include:
- pattern recurrence detection
- portfolio risk concentration flags
- reuse opportunities across programs

#### Steward

Train for:
- governance and controls enforcement

Must include:
- control requirement mapping
- evidence sufficiency judgment
- escalation path when controls are weak

### Layer 5: Continuous learning loop

Weekly loop:

1. Sample responses by agent/use case.
2. Human label outcomes:
- correct
- incomplete
- overconfident
- unsupported
- non-actionable
3. Convert labels to prompt and retrieval policy updates.
4. Re-run benchmark suite.
5. Promote only when thresholds pass.

---

## 5) Context Layer Prompting Patterns (Operational)

## Prompt pattern for decision support

"Given client current-state X, active lifecycle phase Y, and failure modes Z, return:
1) recommended path,
2) two alternatives,
3) evidence required to proceed,
4) compliance implications,
5) 30/60/90 actions,
with corpus IDs cited."

## Prompt pattern for risk review

"Analyze this week’s program status against anti-pattern indicators and evidence templates. Return top 5 risks by severity, leading indicators, missing evidence, and required mitigation owner/actions."

## Prompt pattern for architecture selection

"Compare candidate architectures and vendor implementations against constraints (timeline, controls, talent, cost). Score each option and provide a reversible decision plan with checkpoints."

---

## 6) What To Do Next (Action Plan)

## Immediate (next 7 days)

1. Build client-context ingestion pack for top 3-5 active programs.
2. Add client-specific entries (strategy/current-state/program constraints).
3. Expand evaluator suite to include client-grounding checks.
4. Start weekly training feedback loop.

## Next 30 days

1. Grow to Tier-2 scale (250-350 entries).
2. Increase vendor/regulatory depth where active client programs require it.
3. Enable program-specific briefing outputs as standard operating artifact.

---

## 7) Program-Facing Summary Statement

"The knowledge layer is now operationally live and expanded. We can already generate grounded recommendations. The next leverage step is client-context intensification and strict agent training contracts so every answer is specific, auditable, and directly convertible into program value."
