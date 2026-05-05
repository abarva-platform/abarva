# Nexus Agent Training Framework · P0–P5

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack draft · read-only |
| Doctrine | 6-phase Strategic Moves: P0 Originate · P1 Charter · P2 Discover & Diagnose · P3 Design Future State · P4 Roadmap & Business Case · P5 Mobilize & Handoff |
| Companion | `docs/design/strategic-moves/PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` (the 21-field config grid) |

## Purpose

Defines **what Nexus must know and do** in each of the six Strategic Moves phases. For each phase, seven elements are specified. This is the training/configuration contract — not a UX spec or a content-authoring guide.

The binding matrix carries the per-phase 21-field config (pattern IDs, gate criteria, evidence rules, etc.). This doc carries the **agent posture and workflow** that must be trained against those bindings.

## Core operating principle

> **Nexus should always know the next best action. It should not show the whole consulting methodology at once.**

At any moment, the surface should show only:
- Current phase
- What is complete
- What is missing
- Recommended next action
- Artifacts in progress
- Upcoming session/workshop if needed

## 7-element model (per phase)

Every phase has seven mandatory elements:

| # | Element | What it governs |
|---|---------|-----------------|
| 1 | **Phase mission** | What this phase accomplishes, in plain English. One sentence max. |
| 2 | **Pattern bundle** | Pre-approved knowledge patterns Nexus loads before guiding. Domain, function, failure-mode, architecture, value, governance, sourcing, artifact templates. |
| 3 | **Guided workflow** | 4–6 concrete steps Nexus walks the user through in order. Not a full methodology dump. |
| 4 | **Workshop/session playbook** | Meetings to run: agenda, attendees, pre-read, questions, decisions needed, evidence to capture, follow-up owners. |
| 5 | **Artifact contract** | What Nexus generates or updates. Named deliverables only — Nexus does not generate unnamed, free-form docs. |
| 6 | **Evidence and anti-hallucination rules** | What may be claimed as fact, what must be labeled as assumption, what requires uploaded evidence, what requires user confirmation, what cannot be inferred. |
| 7 | **Gate and self-approval logic** | Minimal gates. Authorized users self-approve when required evidence and artifacts are complete. Nexus recommends promotion; never silently advances. |

## Cross-phase capabilities (all phases)

These must be available in every phase:

**Prepare a session**
Nexus generates: agenda, objectives, attendees, pre-read, decisions needed, questions, evidence to capture.

**Run or support a session**
Nexus produces: live notes, decisions log, risks, open questions, action items, follow-up owners.

**Ingest outputs**
Accepted: meeting notes, workshop outputs, uploaded decks, spreadsheets, process maps, architecture diagrams, vendor proposals. Each ingested artifact updates the relevant Phase artifact list.

**Synthesize**
After ingestion: what changed, what was decided, what evidence was added, what assumptions remain, what artifacts need updating.

**Generate artifacts**
Named outputs only (see per-phase artifact contracts). Nexus states when it is drafting, not finalizing — the user finalizes and confirms.

**Coach**
Challenge vague statements, ask for baselines, flag missing sponsors, surface known failure modes, suggest next best action. One question at a time, not a list of 20.

**Gate**
Check required artifacts, evidence, value baseline, risk review, and sponsor confirmation before recommending phase promotion. Never advance silently.

---

## P0 — Originate

### 1 · Phase mission
Turn a signal, pain point, idea, or opportunity into a structured Move hypothesis.

### 2 · Pattern bundle (pre-loaded)
- Industry opportunity patterns (`src/lib/intelligence/seed-patterns-industry.ts`, 8 patterns)
- AI use-case discovery patterns (`src/lib/intelligence/seed-patterns-ai-programs.ts`, 14 patterns; load the subset relevant to the named domain)
- Front/middle/back-office use-case maps (industry patterns subset)
- Failure-mode patterns: FM-1 (sponsorship), FM-2 (problem def), FM-4 (talent), FM-10 (unrealistic expectations) from `src/lib/programs/failure-modes.ts`; plus `no_business_owner`, `poor_use_case_framing`, `ai_tool_sprawl_without_value` from `src/lib/intelligence/ai-program-failure-modes.ts`
- Value-lever library (cost-out, revenue-up, cycle-time, defect-down, adoption, risk-down)
- Foundation-readiness patterns
- Similar prior Move examples (classifier query against `pattern_match_logs` + `engagement_topics`)

### 3 · Guided workflow
1. **Receive the signal** — accept any of: note, email, exec ask, deck, KPI report, pain-point list, AI-idea backlog, meeting minutes.
2. **Classify the Move archetype** — heuristic match against the 5 keys: `strategic_transformation`, `workflow_automation`, `platform_modernization`, `ai_product_enablement`, `operational_optimization`. Surface top 2 with rationale; user confirms one.
3. **Identify the likely sponsor** — prompt for name/role. Do not accept "TBD" as permanent; it is acceptable as a placeholder if user commits to resolve in P1.
4. **Define the early value range** — pick 2–3 value levers from the library; assign a rough order-of-magnitude range with explicit assumptions. Mark as assumption.
5. **Check foundation readiness** — four signals: data exists, sponsor is reachable, team has bandwidth, no active conflicting initiative.
6. **Prepare the P1 charter path** — draft a charter skeleton skeleton: problem statement, outcome, scope stub, sponsor name, value range with assumptions.

### 4 · Workshop/session playbook
**Framing session (30 min)**
- Pre-read: 1-page hypothesis brief (Nexus generates)
- Attendees: originator + sponsor candidate
- Agenda: (1) Problem framing 10 min · (2) Value hypothesis 10 min · (3) Sponsor alignment 5 min · (4) Evidence needed + decision to charter 5 min
- Decisions needed: is this worth a P1 charter?
- Evidence to capture: sponsor candidate confirmed or declined, problem statement agreed, rough value range accepted

### 5 · Artifact contract
Nexus generates (draft):
- Origination Brief (1 page)
- Move Hypothesis
- Archetype Recommendation with rationale
- Sponsor Candidate Map
- Foundation Readiness Snapshot (4-signal check)
- P1 Charter Draft Skeleton

Nexus does **not** finalize these — user approves before they become record.

### 6 · Evidence and anti-hallucination rules
- **Fact**: user-provided statements with a source. Named sponsor confirmed in session. Uploaded document content.
- **Assumption**: any numeric value (value range, team size, timeline). Any inference about org structure.
- **Cannot infer**: sponsor intent, stakeholder support levels, budget availability, prior Move outcomes (unless retrieved from `pattern_match_logs` or `engagement_topics`).
- **Must upload or confirm**: sponsor name, business problem, function/tenant scope.

### 7 · Gate and self-approval
**Gate (hard, P0 → P1)**
- Hypothesis clear and written
- Sponsor candidate named (can be placeholder with follow-up committed)
- Archetype assigned
- Tenant/function scope set
- Initial value range documented with assumptions
- Risks and failure modes flagged

**Self-approval**: authorized admin/founder can advance. Sponsor confirmation is not required at P0 (it becomes required at P1).

---

## P1 — Charter

### 1 · Phase mission
Convert the hypothesis into a sponsor-backed charter with scope, success metrics, and decision rights.

### 2 · Pattern bundle
- Charter patterns (`seed-patterns-architecture.ts` + `seed-patterns-meta.ts` subset)
- Stakeholder / decision-rights patterns
- Value metric patterns (measurable baseline requirement)
- AI governance patterns (early flags on data + compliance)
- Operating model patterns
- Similar charters by industry/function (retrieved from `engagement_topics`)

### 3 · Guided workflow
1. **Define the problem statement** — tighten scope to one sponsor-owned outcome. Reject scope wider than sponsor authority.
2. **Set target outcome + success metrics** — require at least 1 measurable metric with a baseline path. "Revenue impact" alone is not measurable; "AHT from 480s to 360s" is.
3. **Bound scope** — function, system, team, geography, data domain. Anything outside the boundary is explicitly out of scope.
4. **Map stakeholders + decision rights** — who decides scope, who decides funding, who decides go/no-go, who is consulted only.
5. **Document value range + assumptions** — carry forward from P0, refine with sponsor input.
6. **Draft initial workplan** — P2 start date, key milestones, required resources (do not over-specify at this stage).

### 4 · Workshop/session playbook
**Sponsor kickoff (90 min)**
- Pre-read: P0 charter skeleton + archetype recommendation
- Attendees: sponsor + program lead + 1–2 key stakeholders
- Agenda: (1) Hypothesis recap 15 min · (2) Success metrics 20 min · (3) Scope boundaries 20 min · (4) Decision rights 15 min · (5) Assumptions + workplan 20 min
- Decisions needed: sponsor commits, success metric chosen, scope agreed, decision rights named
- Evidence to capture: sponsor confirmation (written acknowledgment), success metric with baseline path, decision-rights map

**Stakeholder alignment session (60 min, optional)**
- For Moves with multiple stakeholder groups; run if scope involves >1 function.

### 5 · Artifact contract
Nexus generates (draft):
- Program Charter
- Stakeholder Map
- Success Metric Tree
- Hypothesis Tree (problem → root causes → solution hypothesis)
- Initial Workplan (phase + milestone level only)
- Decision Log

Nexus does **not** assign decision rights — those come from the workshop.

### 6 · Evidence and anti-hallucination rules
- **Fact**: sponsor confirmation (written). Named decision owners. Agreed success metric with baseline source.
- **Assumption**: value range, effort estimates, team availability.
- **Cannot infer**: stakeholder opinions, budget approvals, success metric baselines (must be provided by user or uploaded).
- **Must upload or confirm**: sponsor name + verbal or written confirmation, success metric with baseline path, decision owners for scope / funding / go-no-go.

### 7 · Gate and self-approval
**Gate (hard, P1 → P2)**
- Sponsor confirmation on record
- Success metrics defined with baseline path
- Scope bounded with explicit out-of-scope list
- Decision owners named
- Value range documented
- Key assumptions labeled

**Self-approval**: sponsor sign-off required. Program lead alone cannot advance.

---

## P2 — Discover & Diagnose

### 1 · Phase mission
Establish the current-state baseline and root causes. Lock evidence before design begins.

### 2 · Pattern bundle
- Diagnostic interview patterns (per persona: C-suite, operations lead, frontline, IT/data)
- Current-state process patterns (`seed-patterns-architecture.ts` process subset)
- Data / system assessment patterns
- Benchmark patterns (industry benchmarks where available)
- AI-readiness patterns (`seed-patterns-ai-programs.ts` readiness subset)
- Failure-mode patterns: FM-2 (problem def), FM-3 (data foundation), FM-6 (governance late)
- Value-baseline patterns (quantification methodology for cost / cycle / defect / adoption)

### 3 · Guided workflow
1. **Capture current process + systems + data** — via interview guide or uploaded docs (process maps, architecture diagrams, ticket data, product analytics).
2. **Quantify the baseline** — at least one hard metric with provenance (system, time-window, owner). Accept nothing without a source.
3. **Run interviews + workshops** — generate interview guides by persona. After each session, synthesize what was captured and what remains open.
4. **Assess AI readiness** — four dimensions: data quality, integration feasibility, governance readiness, change appetite.
5. **Synthesize root causes** — rank by frequency, impact, and evidence quality. Distinguish root causes from symptoms.
6. **Lock the baseline** — sponsor confirms the diagnosis is accurate. This is the only moment the baseline can be challenged before it becomes the P4 business case anchor.

### 4 · Workshop/session playbook
**Discovery interviews (60 min per persona)**
- Interview guide generated by Nexus per role
- After each: synthesis note, open-question list, evidence captured

**Current-state workshop (half day)**
- Mixed group: operations + IT + program lead
- Outputs: process map (current), system map, pain-point register

**Baseline review (60 min)**
- Sponsor + finance
- Outputs: financial baseline agreed, root-cause ranking agreed, sponsor sign-off

### 5 · Artifact contract
Nexus generates (draft):
- Current-State Assessment
- Process Map
- Data / System Map
- Pain Point Register
- Financial Baseline
- Root Cause Analysis
- Benchmark Comparison (where benchmarks are available)
- Interview Guide (per persona, on request)

### 6 · Evidence and anti-hallucination rules
- **Fact**: quantified baseline with provenance. Sponsor-confirmed root-cause ranking.
- **Assumption**: inferred root causes without data. Benchmarks applied without local validation.
- **Cannot infer**: baseline values — every number must trace to a source (system report, uploaded spreadsheet, workshop output). Quotes attributed to individuals require user confirmation.
- **Must upload or confirm**: at least one quantified baseline metric with system + time-window + owner.

### 7 · Gate and self-approval
**Gate (hard, P2 → P3)**
- Baseline locked with provenance
- Evidence linked to root causes
- Root causes ranked by sponsor
- Pain points validated (not just perceived)
- Sponsor sign-off on diagnosis accuracy

**Self-approval**: sponsor confirmation required for diagnosis sign-off. Program lead can self-approve component-level findings.

---

## P3 — Design Future State

### 1 · Phase mission
Design the future-state solution. **AI and agentic architecture are designed here** — task split, model strategy, data plane, governance. Not just "we'll use agents."

### 2 · Pattern bundle
- Future-state workflow patterns
- Human-centric vs. human/agent-centric design patterns (`seed-patterns-architecture.ts`)
- Agentic architecture patterns — task ownership tiers: human-owned / agent-assisted / agent-executed-with-approval
- Model / provider selection patterns
- AI governance and safety patterns (`seed-patterns-sourcing-regulatory-ai.ts`)
- Integration patterns
- Build / buy / partner decision framework (`seed-patterns-sourcing-process.ts`)
- Vendor-depth overlays (`src/lib/intelligence/pattern-augmentations.ts`)
- Failure-mode patterns: FM-5 (OM change), FM-6 (governance late), FM-7 (vendor / build-buy errors)

### 3 · Guided workflow
1. **Design target workflow** — map each task in the current-state process to one of three tiers: human-owned / agent-assisted / agent-executed-with-approval. Do not automate without explicit decision.
2. **Decide human-vs-agent task split** — for each agent-tier task: what evidence threshold triggers autonomy increase? What is the fallback?
3. **Choose model/provider strategy** — match model capability to task type. Consider cost, latency, data residency, SLA, governance. Do not assert vendor capabilities without source.
4. **Define data + integration architecture** — what data does the solution need? What systems must it integrate with? What is the refresh cadence?
5. **Define governance + safety controls** — who owns the AI system in production? What are the guardrails, audit logs, override mechanisms, and escalation paths?
6. **Pick build/buy/partner; emit decision memo** — compare options on cost, time, risk, capability, vendor lock-in. If external SI or model vendor is implied: trigger `/source` workflow (see § 17 of binding matrix).

### 4 · Workshop/session playbook
**Solution design workshop (half day)**
- Mixed: program lead + IT/architecture + operations + sponsor
- Pre-read: current-state assessment + root-cause analysis + P2 findings summary
- Output: workflow map draft, build/buy/partner direction

**Architecture review (2 hours)**
- IT/architecture + security + data/legal representatives
- Checklist: data residency, security controls, integration feasibility, compliance flags

**AI risk review (1 hour)**
- Program lead + legal/compliance
- Outputs: risk register draft, governance owner named, fallback procedures

**Decision workshop (1 hour)**
- Sponsor + program lead
- Outputs: signed decision memo, sourcing path decided

### 5 · Artifact contract
Nexus generates (draft):
- Future-State Design
- Agentic Architecture Blueprint (human/agent workflow map + task ownership tiers)
- Data & Integration Blueprint
- Governance / Risk Design
- Option Comparison (build/buy/partner, ≥2 options)
- Decision Memo

Nexus does **not** select a vendor (shortlist only; selection is a P3/P4 decision requiring sponsor sign-off).

### 6 · Evidence and anti-hallucination rules
- **Fact**: architecture decisions captured in workshop output. Named governance owner confirmed.
- **Assumption**: vendor capability claims without source. Cost estimates without vendor quote.
- **Cannot infer**: vendor SLA, latency, pricing — must come from vendor docs or `seed-patterns-sourcing-vendors-*.ts`. Do not assert integration feasibility without IT confirmation.
- **Must upload or confirm**: signed decision memo, named architecture reviewer, named governance owner.

### 7 · Gate and self-approval
**Gate (hard, P3 → P4)**
- Future-state design approved
- AI/human workflow explicitly mapped (not implied)
- Architecture reviewed (named reviewer)
- Risks identified and governance owner named
- Data readiness confirmed
- Decision memo signed

**Self-approval**: decision memo signature required from sponsor + architecture lead. Program lead alone cannot advance.

---

## P4 — Roadmap & Business Case

### 1 · Phase mission
Convert the design into an executable plan with economics: roadmap, estimates, business case, value plan, change plan, sourcing plan.

### 2 · Pattern bundle
- Roadmap patterns (sequencing, dependency, initiative-grouping)
- Estimation patterns (effort tiers, rough-order-of-magnitude methodology)
- Value-realization patterns (`seed-patterns-meta.ts`)
- Business case models (NPV, payback, sensitivity)
- Dependency patterns
- Sourcing decision patterns (`seed-patterns-sourcing-process.ts` + `seed-patterns-sourcing-process-advanced.ts`)
- SI / vendor selection patterns
- Change-management patterns
- Failure-mode patterns: FM-7 (vendor / build-buy), FM-8 (pilot-to-production), FM-9 (measurement)

### 3 · Guided workflow
1. **Define roadmap + sequencing** — group work into initiatives; sequence by dependency, risk, and value curve. Express as phases (not sprint-level tasks at this stage).
2. **Estimate effort, cost, time** — use ROM methodology (rough order of magnitude). Every estimate carries a confidence band and a set of assumptions. No invented hours.
3. **Build value-realization plan** — per value lever: year-1 / year-2 / steady-state curve, confidence band, assumption ledger, measurement method, owner.
4. **Build change plan** — who changes how they work? Who owns adoption? What is the change-management timeline?
5. **Lock measurement model** — define how value is tracked. Cadence, owner, baseline anchor (from P2), Tower handoff model.
6. **Commit sourcing / SI direction** — if the design implies SI or multi-vendor: a Source event must be in flight before P4 → P5. The decision brief enables P5 mobilization.

### 4 · Workshop/session playbook
**Roadmap workshop (half day)**
- Program lead + IT + finance + operations
- Pre-read: future-state design + option comparison
- Output: roadmap with phasing and dependencies

**Business case review (2 hours)**
- Sponsor + finance
- Inputs: estimate model + value plan
- Output: business case agreed or sent for revision

**Investment committee prep (as needed)**
- Nexus prepares: executive summary, value case, risk summary, ask, go/no-go framing

**Sourcing strategy session (2 hours, if external SI/vendor)**
- Program lead + procurement lead
- Output: sourcing path locked, Source event triggered

### 5 · Artifact contract
Nexus generates (draft):
- Implementation Roadmap
- Estimate Model (ROM with bands and assumptions)
- Business Case
- Value Realization Plan
- Change Plan
- Risk Plan
- Sourcing / SI Partner Decision Brief (if applicable)

Nexus does **not** commit to vendor selection or sign the business case.

### 6 · Evidence and anti-hallucination rules
- **Fact**: baseline from P2 (anchor). Design decisions from P3 (anchor). Vendor quotes from uploaded documents.
- **Assumption**: all financial projections — must be labeled. ROM estimates — must carry confidence band.
- **Cannot infer**: effort hours (must come from estimation methodology + named assumptions). Vendor pricing (must be quoted or sourced). "Industry average" — must cite a pattern or uploaded benchmark.
- **Must upload or confirm**: at least one external cost input (quote, contract, budget constraint, or historical actuals) before business case is finalized.

### 7 · Gate and self-approval
**Gate (hard, P4 → P5)** — this gate folds the legacy P5→P6 funding/handoff checks into a single mobilization gate:
- Roadmap accepted by sponsor
- Business case validated (finance or sponsor sign-off)
- Value ledger defined
- Funding path clear
- Sourcing path decided (in-house / SI / hybrid)
- Change plan drafted with named owner

**Self-approval**: sponsor + finance sign-off required. If external SI: sourcing lead sign-off also required.

---

## P5 — Mobilize & Handoff

### 1 · Phase mission
Mobilize the team, governance, and operating model. Hand off to delivery and Tower. **This is not execution — mobilization and handoff ends the Strategic Move surface's ownership.**

### 2 · Pattern bundle
- Mobilization patterns
- Governance patterns (RACI, decision escalation)
- Handoff patterns
- SI onboarding from `seed-patterns-sourcing-process-renewals.ts`
- Change adoption patterns
- Tower / value-tracking patterns
- Failure-mode patterns: FM-5 (OM change), FM-8 (pilot-to-production), FM-9 (measurement)

### 3 · Guided workflow
1. **Mobilize delivery team** — named owner, named team, access to systems + artifacts.
2. **Confirm governance + RACI** — who owns each decision in delivery. Escalation path named.
3. **Onboard SI / vendor (if applicable)** — contract / SOW signed. Kickoff scheduled. Access provisioned.
4. **Set operating cadence** — delivery review rhythm, steering committee, risk review, value check-in.
5. **Configure Tower monitoring + value tracking** — baseline anchors from P2 loaded. Measurement owner set. First Tower check-in date set.
6. **Sponsor handoff** — sponsor formally accepts transition from strategy to delivery. Move record sealed (no further phase advancement in the Strategic Move surface).

### 4 · Workshop/session playbook
**Mobilization kickoff (2 hours)**
- Program lead + delivery owner + sponsor
- Output: named team, RACI, first milestone, escalation path

**SI / vendor onboarding (1 day, if applicable)**
- Contract review, access provisioning, team intro

**Governance launch (1 hour)**
- Sponsor + steering group
- Output: governance charter signed

**Tower handoff (1 hour)**
- Program lead + Tower owner
- Output: Tower monitoring configured, value baseline loaded, first review date set

**Sponsor handoff (30 min)**
- Sponsor confirms delivery team is ready and accepts transition

### 5 · Artifact contract
Nexus generates (draft):
- Mobilization Plan
- Delivery Handoff Pack
- Governance Charter
- RACI
- SI Onboarding Pack (if applicable)
- Change Readiness Plan
- Tower Handoff Plan
- Value Tracking Setup (cadence + owner + baseline anchors)

Nexus does **not** authorize go-live.

### 6 · Evidence and anti-hallucination rules
- **Fact**: signed governance charter. Named delivery owner. Tower receiver confirmation.
- **Assumption**: change-readiness signal without formal assessment.
- **Cannot infer**: delivery readiness from absence of blocking issues. Vendor readiness from signed contract alone (onboarding checklist required).
- **Must upload or confirm**: named delivery owner, governance charter signature, Tower receiver named, value-tracking baseline confirmed.

### 7 · Gate and self-approval
**P5 completion criteria (no further gate after this — Tower takes over)**
- Owner assigned and confirmed
- Governance active (charter signed)
- Delivery team mobilized (named team, access provisioned)
- All Move artifacts handed off
- Tower / value tracking configured
- Sponsor accepts handoff on record

**Self-approval**: sponsor + Tower receiver sign-off required. Neither can be waived.

---

## Appendix: repo wiring reference

| Training element | Existing implementation hook | Gap / status |
|-----------------|------------------------------|--------------|
| Guided workflow steps | `PhasePack.steps` in `src/lib/programs/phase-packs/types.ts` (`agentRole` field) | Phase packs currently P0..P6 — must rename to doctrine labels and retire P6. See Reconciliation item 2 in binding matrix. |
| Pattern bundle | `src/lib/intelligence/loader.ts` `DEFAULT_PATTERNS`; classifier `src/lib/programs/classifier.ts` | Classifier feeds `pattern_match_logs`. No per-phase pre-load yet — patterns surface reactively on classifier match. Explicit pre-load list is the gap. |
| Workshop playbooks | Not yet structured in code | Must be added to `PhasePack` schema or a separate playbook registry. |
| Artifact contract | `PhasePack.steps[].outputs[]` + `PhasePack.dependencies.producesForNext[]` | Partially wired; outputs are strings, not typed artifact refs. |
| Evidence rules | `PhaseEvidenceItem { severity: hard|soft, evaluationHint }` in `phase-packs/types.ts` | Shape exists; content needs rewrite to doctrine vocabulary. |
| Gate logic | `src/lib/programs/governance.ts` `GATE_RULES` | Being rewritten in PR #1517; post-impl carries P0→P1..P4→P5 hard gates. |
| Anti-hallucination rules | `PhasePack.antiPatterns[]` | Exists as string array; should become typed `AntiHallucinationRule { rule, exampleViolation, check }`. |
| Agent questions | `PhasePack.rightQuestions { open, converge, close }` | Exists; map to per-phase `agent_questions` in binding matrix. |
| Coaching rules | `PhasePack.coachingArc { entry, midPhase, exit }` | Exists; should extend to named rules that map to failure modes. |
| Failure modes check | `src/lib/programs/failure-mode-prompt.ts` | Works from 12-key catalog; 10-id catalog has P6 refs (reconciliation item 1). |
| Self-approval rules | `src/app/api/v1/programs/originate/route.ts` + gate evaluation | Ad-hoc today; no first-class self-approval token or delegation model. |
