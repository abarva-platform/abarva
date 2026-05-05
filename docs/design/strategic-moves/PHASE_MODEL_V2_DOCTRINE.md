# Strategic Moves — 6-Phase Model Doctrine

**Locked:** 2026-05-05  
**Status:** Binding reference for all implementation work

---

## Core Doctrine

AbarVa Strategic Moves does **not** execute the transformation. It helps originate, charter, diagnose, design, build the roadmap/business case/value plan, and mobilize the move for execution. After P5 Mobilize & Handoff, **Control Tower** tracks execution, risk, dependencies, evidence, and value realization.

Remove all user-facing references to Build, Execute, Verify as Strategic Move phases. Those concepts belong to downstream execution/Tower tracking, not the Strategic Moves phase rail.

---

## The 6 Phases

| # | Phase | Core question | What "done" looks like |
|---|-------|--------------|----------------------|
| P0 | Originate | What's the bet and why does it matter? | Brief exists, hypothesis stated, archetype classified, sponsor candidate identified |
| P1 | Charter | Who owns it, what outcomes matter, what value is at stake? | Signed charter, sponsor committed, value range locked, stakeholder map and success metrics ratified |
| P2 | Discover & Diagnose | What is the current-state process, cost, pain, data, workflow, and readiness? | Baseline locked, root causes identified, failure modes assessed, data/workflow gaps surfaced |
| P3 | Design Future State | What should the solution, operating model, and target capability look like? | Target state design signed off, operating model shift documented, risks & tradeoffs named |
| P4 | Roadmap & Business Case | How do we sequence it, fund it, measure it, govern it, and prepare for change? | Roadmap + business case + value plan approved, cost model complete, change readiness assessed |
| P5 | Mobilize & Handoff | How do we hand it to execution with owners, artifacts, risks, and value tracking? | Tower handoff package accepted, execution team confirmed readiness, monitoring active |

---

## Rail Labels

- Full labels: P0 Originate, P1 Charter, P2 Discover & Diagnose, P3 Design Future State, P4 Roadmap & Business Case, P5 Mobilize & Handoff
- Short labels (for rail dots): Originate, Charter, Diagnose, Design, Roadmap, Mobilize
- After P5, the rail shows a "→ Tower" indicator (different surface, not a phase)

---

## AI Program Failure Modes — Phase Prevention Map

| AI program failure mode | Phase that prevents it | How |
|------------------------|----------------------|-----|
| Weak use-case framing | P0 Originate | Forces clear hypothesis, trigger, business problem, and value idea before anything becomes a formal Move |
| No real business owner | P1 Charter | Forces sponsor, stakeholder map, decision rights, and success measures. No sponsor, no move. |
| Poor baseline / unclear current state | P2 Discover & Diagnose | Forces current-state assessment, pain points, root causes, process/data gaps, and baseline metrics |
| Weak data foundation | P2 Discover & Diagnose | Explicitly surfaces data readiness, system gaps, access issues, quality problems, and governance constraints before design |
| Tool-first thinking | P3 Design Future State | Shifts from "which AI tool?" to operating model, workflow, architecture, solution options, and intervention design |
| No workflow integration | P3 Design Future State | Requires future-state workflow and adoption path, not just model or agent design |
| No business case | P4 Roadmap & Business Case | Forces investment, benefits, cost, value realization, and sequencing before mobilization |
| No change plan | P4 Roadmap & Business Case | Includes change, adoption, stakeholder readiness, training, and operating model implications |
| No governance / risk model | P1–P5 progressively | Progressively defines decision rights, evidence, approvals, risk, compliance, and handoff controls |
| No value tracking | P4 → P5 → Tower | P4 defines the value plan; P5 hands it to Tower for continuous tracking |
| No scale path | P5 Mobilize & Handoff | Ensures the move is packaged for execution, ownership, Tower monitoring, and repeatability — not just a pilot |

---

## P3 Design Future State — Simplified Scope

P3's job is NOT to produce a comprehensive architecture document. P3's job is to produce **enough design clarity to make a funding decision at P4.**

### Three questions P3 answers:

1. **What changes?** (target state vs current state — the delta)
2. **Who does what?** (human vs agent boundary — the operating model shift)
3. **What could go wrong?** (risks and tradeoffs — the honest constraints)

### Three deliverables (not eight):

| # | Deliverable | Contains |
|---|-------------|----------|
| 1 | Target State Design | Future workflow, where AI/agents sit, what humans own, the capability being built. Narrative, not just diagrams. |
| 2 | Operating Model Shift | Who works differently. Roles, handoffs, approval chains that change. "Today → Tomorrow" for each affected role. |
| 3 | Risks & Tradeoffs | 5-7 named risks (data, adoption, vendor, complexity, cost). Likelihood, impact, mitigation. Plus tradeoffs the sponsor must accept. |

### What P3 explicitly covers:

- What should the future-state solution look like?
- Where should AI/agents be used?
- What work should humans still own?
- What platform/model architecture is appropriate?
- What operating model changes are required?
- What value, cost, speed, and risk tradeoffs exist?

### What moved from P3 to P4 (intentionally):

- Detailed architecture → P4 roadmap includes technical sequencing
- Vendor/SI selection → P4 cost model includes vendor comparison
- Governance framework → P4 includes governance for execution
- Platform selection → P4 roadmap names the platform; P3 only names the capability needed

### Gate P3 → P4 checks:

1. Can we describe the target state in one page?
2. Do we know who works differently?
3. Have we named the top 5 risks honestly?
4. Does the sponsor believe this direction is worth planning for?
5. The gate explicitly rejects moves that jump to vendor/tool selection without a workflow integration plan.

---

## P4 Roadmap & Business Case — Cost Estimation Methodology

### Doctrine: AbarVa provides the estimate, not just a blank template.

Nexus should have **enough industry knowledge to produce a rough-order-of-magnitude (ROM) estimate** based on:

- Archetype (platform modernization vs AI product enablement vs workflow automation — each has different cost structures)
- Industry benchmarks (typical cost ranges for similar transformations)
- Scope indicators from P2/P3 (number of systems, complexity, team size)
- Known vendor/SI rate cards (AbarVa maintains a knowledge base of SI pricing, staff aug rates, software/services cost ranges)

The ROM is presented to the user as a **starting point they adjust**, not a blank form they fill from scratch. Collaborative refinement, not delegation.

### What AbarVa knows (knowledge base, not user input):

- SI/vendor rate ranges by tier (Big 4, boutique, offshore, nearshore)
- Staff augmentation rates by role and market (US, EU, India, etc.)
- Software/platform licensing cost ranges (by category: AI platform, data platform, integration, observability)
- Typical team compositions by archetype and program size
- Duration benchmarks by archetype (platform mod = 12-18 months, AI product = 6-12 months, etc.)
- Industry-specific premiums (healthcare compliance, financial services regulation, etc.)

### What AbarVa gets from the client (rates template):

```
INTERNAL COST DYNAMICS (client fills)
─────────────────────────────────────
Role                    | Loaded cost/month | Typical allocation %
Program Lead            | $__________       | ___%
Data Engineer           | $__________       | ___%
ML/AI Engineer          | $__________       | ___%
Change Manager          | $__________       | ___%
Business Analyst        | $__________       | ___%
[custom roles]          | $__________       | ___%
```

### What AbarVa calculates and presents back:

- ROM cost estimate (range: low / mid / high)
- Internal vs external cost split
- Monthly burn rate projection
- Payback period against P4's value plan
- ROI (3-year value vs total investment)
- Comparison: internal-build vs vendor vs hybrid
- Flagged risks: "estimate exceeds archetype typical by 40% — confirm scope"

### The flow:

1. Nexus generates a ROM estimate from archetype + scope + industry data
2. User reviews and adjusts (corrects rates, adds org-specific roles, refines vendor assumptions)
3. Nexus recalculates with user's inputs
4. Business case document auto-generates with the locked numbers
5. Sponsor reviews and signs off at P4 gate

The principle: **Nexus does the first 70% from knowledge. The maestro/user refines the last 30% from org-specific reality.**

---

## P5 Mobilize & Handoff — Tower Handoff Package

What Tower receives at P5 completion:

- Execution roadmap (from P4, with named owners)
- Monitoring plan (KPIs, thresholds, measurement cadence, data sources)
- Value realization framework (committed outcomes vs actuals tracking)
- Risk register (carried forward from P2/P3/P4, with mitigations)
- RACI (who owns what during execution — named people, not roles)
- Change plan status (readiness assessment, training plan, adoption milestones)
- Dependency map (other moves, systems, teams this move depends on)

Gate out of P5 requires: **execution team has accepted the handoff package and confirmed readiness.** If execution team says "not ready" or "not executable as designed," the move loops back to P4 or P3.

---

## DB / Substrate Impact

- `engagements.current_phase`: integer 0–5 (constraint update needed)
- Moves currently at old phases 6-7: remap to P5 with status "complete" or "handed_off"
- `phase-labels.ts`: updated to 6 labels
- `PhaseRail` component: `totalPhases` defaults to 6
- `governance.ts`: 5 gate transitions (P0→P1, P1→P2, P2→P3, P3→P4, P4→P5)
- Deliverable types `applicable_phases` arrays: remap to 0-5 range
- Milestones `phase_number`: remap to 0-5 range
- `.cursorrules`: update phase labels section

---

## Decisions Locked

1. Six phases as stated above. No Build, Execute, Verify in Strategic Moves.
2. Failure-mode-to-phase mapping as documented.
3. "AbarVa does not execute" — Tower owns execution tracking.
4. P2 is allowed to kill a move (gate can return "discontinue").
5. P3 gate explicitly rejects tool-first solutions without workflow integration plan.
6. P3 is 3 deliverables, not 8 (Target State Design, Operating Model Shift, Risks & Tradeoffs).
7. P4 cost estimation: AbarVa provides ROM from industry knowledge; user refines with org rates.
8. P4 value plan is a measurement contract, not a slide deck.
9. P5 gate requires execution team acceptance, not just Strategic Moves team signoff.
10. Rail shows P0–P5 + "→ Tower" indicator.
11. Short labels: Originate, Charter, Diagnose, Design, Roadmap, Mobilize.

---

## Open for Future Refinement

- Archetype-specific estimation templates (pre-filled team compositions and duration ranges)
- SI/vendor rate card knowledge base (seeded from public benchmarks, refined per engagement)
- Cross-portfolio coherence check at P4 (resource conflicts with other active moves)
- P2 "kill gate" UX — how discontinuation is surfaced and documented
