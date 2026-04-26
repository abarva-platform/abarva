---
# Agent-Centric Enforcement Review Standard
**AbarVa Platform Design · Experience System**
**Slice: AGENTX · Wave 20**
**Status: Active Standard**

## Purpose

Every AbarVa page that surfaces an agent must pass this standard. Generic agent guidance — guidance that could apply to any client, any event, or any stage without modification — is a design defect, not a feature gap.

This document defines the minimum bar for agent panels, agent missions, agent briefs, and agent recommendations to pass design review.

---

## Core Enforcement Rules

### Rule 1 — Agent UI must be context-first, not prompt-first

An AbarVa agent panel must begin by showing what it knows, not by asking what the user wants. The primary content is context, evidence, and recommended action — not an input field.

**Pass:** Panel shows current event, stage, evidence state, and a specific recommended action before any interactive element.
**Fail:** Panel shows a chat input or "Ask Nexus…" prompt as the primary affordance.

---

### Rule 2 — Every workflow-stage agent panel must show six mandatory fields

No agent panel may pass design review without all six:
1. **Current event or programme** — which specific engagement this agent is operating on
2. **Current stage** — which phase/gate/step in the workflow
3. **Context used** — what data, evidence, or documents the agent consumed
4. **Confidence/evidence state** — whether the recommendation is based on complete, partial, or missing evidence
5. **Blocker or missing input** — what is preventing progress, if anything
6. **Recommended next action** — a specific, stage-appropriate action the user can take now

---

### Rule 3 — Nexus must feel like an orchestration lead, not a chatbot

Nexus is the programme and sourcing orchestration agent. Its panels must:
- Identify what it is orchestrating and why
- Show which other agents (Sentinel, Atlas, Steward) it has tasked
- Surface the critical path item — what one thing most needs resolution
- Recommend a specific handoff or escalation if blocked

**Nexus must not:**
- Offer generic "How can I help you today?" panels
- Show identical guidance across different events or stages
- Appear as a floating chat bubble without workflow context

---

### Rule 4 — Sentinel must surface evidence gaps and unsupported claims

Sentinel is the evidence validation agent. Its panels must:
- Show which claims have evidence support and which do not
- Surface citations or data sources when available
- Flag when a recommendation is unsupported by available data
- Show confidence level with a reason, not just a score

**Sentinel must not:**
- Surface green confidence indicators without an evidence basis
- Hide gaps behind positive language
- Pass a claim as validated without specifying what evidence was used

---

### Rule 5 — Steward must surface gate, approval, and readiness blockers

Steward is the governance and gate agent. Its panels must:
- Show the current gate status and what is blocking it
- List required approvals and who owns them
- Surface what the client/procurement owner needs to do next
- Show which gate criteria are satisfied vs. outstanding

**Steward must not:**
- Show gate status without blockers listed
- Appear as an admin utility without workflow context
- Approve or simulate gate passage for demo data

---

### Rule 6 — Atlas must surface executive value and risk tradeoffs

Atlas is the executive intelligence agent. Its panels must:
- Show a specific value position relevant to the current engagement
- Surface the top risk and its business impact
- Frame tradeoffs in commercial terms, not technical terms
- Anchor to the value ledger or evidence where available

**Atlas must not:**
- Generate generic business case language
- Show value projections without evidence basis disclosure
- Appear without a connection to the current engagement's commercial context

---

### Rule 7 — "3 choices + custom" must appear only when it helps move work forward

The structured-choice pattern (three specific options + a custom input) is appropriate when:
- The user needs to choose a next action from a defined set
- The choices are stage-appropriate and evidence-informed
- Each choice has a clear consequence

It is inappropriate when:
- It substitutes for a concrete recommendation
- The choices are generic across all engagements
- It appears on a read-only or status-only surface

---

### Rule 8 — Low-context responses must disclose missing data

When an agent panel renders with incomplete or seed data, it must:
- State explicitly what data is missing
- Explain what the recommendation would change with more data
- Not pretend to have certainty it does not have

**Pass:** "Confidence: Partial. Missing: approved value baseline, platform owner confirmation."
**Fail:** Agent shows a recommendation with no evidence disclosure.

---

### Rule 9 — No page should pass design review if agent guidance is generic

A page fails design review if any agent panel on it:
- Uses language that would be identical on a different engagement
- Does not name the current event, programme, or stage
- Shows placeholder or template text without being populated from seed or live context
- Could be replaced with a static description without loss of value

---

### Rule 10 — No agent response should pass if it could apply to any client, event, or stage without context

Every agent output must be anchored to at least one of:
- A specific named engagement (e.g. "AMS Vendor Consolidation 2026")
- A specific named programme (e.g. "Apex Retail · CDP Activation")
- A specific workflow stage (e.g. "Synthesis → Design gate pending")
- A specific evidence state (e.g. "3 of 5 vendor responses received")

Generic outputs that reference no specific context fail this rule.

---

## Source-Specific Enforcement

For each Source stage wireframe, require all of the following before passing design review:

| Required Element | Description |
|---|---|
| Nexus guidance | Stage-specific orchestration instruction from Nexus |
| Context used strip | Visible disclosure of what data/documents Nexus consumed |
| Stage gate / readiness signal | Current commercial readiness state for this stage |
| Relevant agent missions | Which agents are active and what they are working on |
| Evidence / confidence state | How much of the expected evidence is present and validated |
| Next action | One specific, stage-appropriate action |
| 3 choices + custom | When stage warrants a structured decision |

### Source Stage Checklist Template

For each of: Intake, RFP/RFI, Vendor Responses, Evaluation, BAFO/Orals, Selection:

- [ ] Nexus identifies the current commercial stage by name
- [ ] Context used strip shows data sources (RFP document, vendor responses, pricing sheets, etc.)
- [ ] Stage gate signal shows readiness (% complete, missing items)
- [ ] At least one Sentinel mission visible (evidence validation)
- [ ] At least one Steward mission visible (procurement governance)
- [ ] Confidence level shown with evidence count, not just a score
- [ ] Next action is specific to this event and stage
- [ ] If BAFO: BAFO readiness signal visible for each vendor
- [ ] If Selection: Selection rationale linked to scorecard
- [ ] Deterministic seed caveat visible if data is not live

---

## Page-Level Enforcement Checklists

### Programs

**Primary agent:** Nexus (orchestration)
**Primary workflow object:** Programme (phase/gate/deliverable/evidence)

Checklist:
- [ ] Current programme name visible
- [ ] Current phase and gate status visible
- [ ] Context source: programme seed, workshop outcomes, evidence log
- [ ] Known inputs: approved deliverables, workshop decisions, stakeholder alignment
- [ ] Missing inputs: pending gate items, unconfirmed evidence
- [ ] Evidence/confidence: deliverables evidence coverage %
- [ ] Agent recommendation: specific to current gate state
- [ ] Next action: gate progression, workshop preparation, or evidence capture
- [ ] Caveat: "Deterministic seed. No live programme state."

**Do Not Pass if:**
- Programme name is absent from agent panel
- Gate status is shown without blockers
- Recommendation is "complete outstanding items" without naming them
- Workshop 5 outcomes are not surfaced if gate is pending

---

### Source

**Primary agent:** Nexus (commercial orchestration)
**Primary workflow object:** Sourcing event (vendor, pricing, BAFO, selection)

Checklist:
- [ ] Source event name visible in agent panel
- [ ] Commercial stage visible (RFP, Evaluation, BAFO, Selection)
- [ ] Context used: RFP package, vendor responses, pricing model
- [ ] Known inputs: which vendors submitted, pricing completeness
- [ ] Missing inputs: which vendors are incomplete, what is outstanding
- [ ] Evidence/confidence: vendor response completeness by vendor
- [ ] Sentinel mission: evidence gap flagged
- [ ] Agent recommendation: specific vendor follow-up or BAFO instruction
- [ ] Next action: specific commercial action (e.g. "Request BAFO from Northstar Managed Services")
- [ ] Linked programme visible if exists
- [ ] Caveat: "Deterministic seed. No live vendor response."

**Do Not Pass if:**
- Vendor names are generic (Alpha/Beta/Gamma/Delta — replaced in Wave 19)
- BAFO readiness is shown without per-vendor status
- Recommendation applies to any sourcing event
- Linked programme badge missing when link exists

---

### Intelligence

**Primary agent:** Sentinel (pattern detection)
**Primary workflow object:** Intelligence pattern (category, confidence, evidence)

Checklist:
- [ ] Pattern category visible and named
- [ ] Client/tenant context visible
- [ ] Evidence source for pattern visible
- [ ] Confidence level with reason (not just a score)
- [ ] Missing evidence disclosed
- [ ] Recommendation: specific pattern action or investigation
- [ ] Caveat: "Deterministic pattern detection. Not client-specific live intelligence."

**Do Not Pass if:**
- Pattern could apply to any client without modification
- Confidence shown without evidence basis
- Missing data hidden behind positive indicators

---

### Control Tower

**Primary agent:** Nexus (signal orchestration)
**Primary workflow object:** Signal (type, severity, tenant, event)

Checklist:
- [ ] Signal type visible and named
- [ ] Severity visible with business impact
- [ ] Source event or programme linked
- [ ] Context: what triggered the signal
- [ ] Recommended response: specific action to address the signal
- [ ] Agent mission: which agent owns the signal response
- [ ] Caveat: "Deterministic signals. No live procurement monitoring."

**Do Not Pass if:**
- Signal severity shown without business impact
- Signal not linked to a specific event or programme
- Recommended response is generic ("investigate further")

---

### Admin / Setup

**Primary agent:** Steward (setup readiness)
**Primary workflow object:** Setup readiness item (data readiness, connector, configuration)

Checklist:
- [ ] Setup surface named (data readiness, connector, admin config)
- [ ] Current readiness state visible
- [ ] Blocking items listed with owner
- [ ] Missing configuration steps explicit
- [ ] Evidence: which items are verified vs. assumed
- [ ] Recommendation: specific setup action
- [ ] Caveat: "Manifest-backed. Not live monitoring."

**Do Not Pass if:**
- Setup status shown as complete without evidence
- Blocking items hidden
- Admin surface shows generic status cards without workflow movement

---

### Production Readiness

**Primary agent:** Steward (readiness gate)
**Primary workflow object:** Readiness decision (demo / pilot / production)

Checklist:
- [ ] Current readiness decision visible (demo/pilot/production)
- [ ] Explicit blockers for each tier listed
- [ ] Evidence basis for current state visible
- [ ] What would change each tier's status
- [ ] No false production_ready claim
- [ ] Caveat: "Manifest-backed. Not live CI/CD monitoring."

**Do Not Pass if:**
- production_ready is claimed without evidence
- Pilot blockers are hidden
- Status is positive without disclosing what is incomplete

---

### Architecture

**Primary agent:** Atlas (platform intelligence)
**Primary workflow object:** Architecture plane (capability, deployment, data, model gateway)

Checklist:
- [ ] Current architecture plane visible
- [ ] Built vs. deferred distinction explicit
- [ ] Commercial/value implication of each plane visible
- [ ] Model gateway / tool registry deferred status explicit
- [ ] What would unlock deferred planes
- [ ] Caveat: "Architecture is manifest-backed. Not a live deployment status."

**Do Not Pass if:**
- Deferred planes shown as built
- No distinction between built and deferred
- Architecture shown without deployment context

---

## "Do Not Pass Design Review If" — Master Checklist

A page or agent panel fails design review if ANY of the following are true:

| # | Failure Condition |
|---|---|
| 1 | Agent guidance is generic — same text would appear on any engagement |
| 2 | Agent output names no specific client, event, programme, or stage |
| 3 | Context used is not shown — user cannot see what the agent consumed |
| 4 | Missing data is hidden — panel shows confidence without disclosing gaps |
| 5 | Recommendation has no evidence basis — no source for the recommendation is visible |
| 6 | Page shows a chat box as the primary experience without workflow context first |
| 7 | Agent appears decorative — present in UI but contributing no stage-specific content |
| 8 | Next action is unclear — user cannot determine what to do after reading the panel |
| 9 | Page has status cards but no workflow movement — no path forward is indicated |
| 10 | Agent confidence is shown without a reason — score or level without evidence count |
| 11 | BAFO/evaluation page has no per-vendor status |
| 12 | Gate page shows gate status without listing specific blocking items |
| 13 | Programme page shows phase without deliverable/evidence state |
| 14 | Deterministic seed data is not disclosed where applicable |
| 15 | Agent panel could be replaced with a static description without loss of value |

---

## Agent Panel Minimum Viable Structure

Every agent panel rendered in AbarVa must contain, in order:

```
[Agent identity: name + role label]
[Current workflow object: event/programme/stage name]
[Context used: brief disclosure of data consumed]
[Evidence/confidence state: level + reason + gaps]
[Recommended action: specific, stage-aware]
[Blocker if present: explicit, with owner]
[Deterministic/live caveat if applicable]
[Optional: 3 choices + custom when decision is needed]
```

Any panel missing more than two of these fields fails the minimum viable structure check.

---

## Enforcement Cadence

This standard applies at:
- **Design review** — before any new agent panel is built
- **QA27+** — storyline verification suites check panel context
- **QA28** — active route shell verification checks for agent presence
- **Wave completion** — integration agent confirms no generic agent guidance was introduced
- **Demo preparation** — DEMO7/DEMO8 checklists reference this standard

---

## Versioning

This is version 1.0 of the Agent-Centric Enforcement Review Standard.
It supersedes any prior informal guidelines about agent panel content.
Updates to this document require a new slice (AGENTX-v2, etc.) and a build-slices.json entry.

---

## Related Slices
- QA24 — AbarVa Design Canon Regression Tests
- QA27 — Apex Retail Source → Program Storyline Verification
- QA28 — Active Route Shell Verification
- DEMO7 — Apex Retail 30-Minute Demo Storyline
- DEMO8 — Founder Live Route Review Checklist
- SHELL1 — Canonical AbarVa App Shell Ownership

---
*All AbarVa agent surfaces are deterministic seed data for demonstration. No live model calls are made in the current demo layer.*
