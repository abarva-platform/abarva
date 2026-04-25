# ACT1 · AI Control Tower Product Contract

Slice ID: ACT1
Slice name: AI Control Tower Product Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract governs the AI Control Tower product surface. The AI
Control Tower is **a boardroom-ready AI operating brief**, not a
cluttered dashboard. It is the surface where a CIO / CFO / CAIO can
read the AI portfolio's state in under three minutes and walk away
confident in three things: where the portfolio stands, where it is
at risk, and what the next steering decision is.

---

## A. Purpose and scope

### Product principle

The AI Control Tower is **not** a metrics wall. It is **the
executive's AI operating brief**. Atlas leads the surface; Nexus,
Sentinel, and Steward feed it.

The Tower exists to answer **three questions**, in order:

1. *Where does the AI portfolio stand?*
2. *Where is the portfolio at risk?*
3. *What is the next steering decision?*

If the surface cannot answer those three questions in three minutes,
it is not the Tower; it is just a dashboard.

### Scope of this contract

- Defines the seven canonical AI Control Tower **dimensions**.
- Defines the **scorecard limit** (5), **pressure-card limit** (3),
  **lens limit** (1 active at a time), and the **Atlas brief**
  contract.
- Defines **internal vs. external** data basis.
- Defines the **no-fabrication** rules every Tower surface must
  honor.
- Defines the future implementation slice plan ACT2 → ACT10.

### Out of scope for this contract

- Implementation of the Tower UI (deferred to ACT10).
- Implementation of the seven dimension read models (ACT2 → ACT8).
- Implementation of the Atlas brief composer for the Tower (ACT9).
- Live data pipelines, connector sync, evidence registry binding.

---

## B. Primary users

| User | Why they come to the Tower |
|---|---|
| **CIO** | Confirm the portfolio's posture before steering, board, or peer briefings. |
| **CFO** | Reconcile spend with realized outcomes; defend budget decisions. |
| **CAIO** | Triage AI initiative risk; sequence the next governance review. |
| **CTO** | Confirm tech / data readiness; spot architecture-debt patterns. |
| **Value Office** | Track baseline → target → realized across the portfolio. |
| **Risk / Governance reviewer** | Confirm responsible-AI, regulatory, and audit posture. |
| **Transformation Lead** | Surface program-level operating-model gaps; sequence portfolio rationalization. |

The Tower must remain legible to **all seven** users without forcing
each into a different mental model.

---

## C. Atlas as primary agent

The AI Control Tower is **Atlas-led**. Atlas:

- Composes the **Tower brief** that frames the portfolio in plain
  language.
- Surfaces the **top three pressure cards** in canonical priority
  order.
- Names the **next steering decision** with a recommended action and
  a routing target.
- Refuses to invent dollar claims, fake citations, or unverifiable
  comparisons.

Nexus, Sentinel, and Steward feed Atlas:

- **Nexus** — Context Bundle composition, retrieval-backed evidence
  for the brief.
- **Sentinel** — pattern detections (I1) + failure modes (PF1)
  surfacing recurrence and cross-program operating-model gaps.
- **Steward** — captured operator decisions, gate readiness, audit
  posture.

Atlas owns the *surface voice*. The other three own the *signal
content*.

---

## D. Seven canonical dimensions

The AI Control Tower has **seven canonical dimensions** — no more,
no less. Every Tower surface, brief, lens, or scorecard maps onto
exactly one of these seven.

### 1. AI Portfolio Inventory
- **Required datasets**: AI use case inventory, sponsor, pattern
  key, current phase, current gate, archetype.
- **Key KPIs**: active count, pipeline value, concentration risk,
  sponsor coverage %, archetype mix.
- **Atlas role**: composes the editorial naming portfolio shape.
- **Steward role**: validates inventory completeness; flags
  unowned cases.
- **Sentinel role**: detects portfolio sparsity / cross-program
  meta-patterns.
- **Nexus role**: surfaces the inventory as Context Bundle for any
  Tower brief.

### 2. Adoption & Usage
- **Required datasets**: per-tool seat count, active users, usage
  hours, tokens, license entitlements.
- **Key KPIs**: adoption rate, tool-mix concentration, dormant-seat
  fraction, usage-vs-license ratio.
- **Atlas role**: composes adoption editorial; flags under- and
  over-adoption.
- **Steward role**: validates telemetry capture; flags missing tool
  reporting.
- **Sentinel role**: detects sprawl-without-value (PF1
  `ai_tool_sprawl_without_value`).
- **Nexus role**: uses telemetry inside Context Bundle for value
  defense.

### 3. Business Value & Outcomes
- **Required datasets**: baseline KPIs, targets, realized-value
  entries, value-chain references.
- **Key KPIs**: value delivered, ROI, value-leak count,
  baseline-coverage %, realized-vs-target ratio.
- **Atlas role**: composes value editorial at G3 / G4.
- **Steward role**: validates value capture; refuses dollar claims
  without a baseline.
- **Sentinel role**: detects value-ledger incompleteness (I1
  `value_ledger_incompleteness`).
- **Nexus role**: uses value chain in retrieval-backed answers.

### 4. Risk / Compliance / Governance
- **Required datasets**: AI risk register, responsible-AI reviews,
  regulatory framework alignment, audit findings.
- **Key KPIs**: residual risk, review coverage %, regulatory
  alignment, audit-finding age.
- **Atlas role**: composes governance editorial; surfaces the next
  gate.
- **Steward role**: validates governance posture; refuses phase
  advancement when missing.
- **Sentinel role**: detects governance gaps (I1
  `gate_governance_gap`).
- **Nexus role**: uses governance state in refusal logic.

### 5. Cost & Consumption
- **Required datasets**: per-tool cost, infra cost, license cost,
  vendor spend, run / change spend.
- **Key KPIs**: dollars per active user, cost vs. baseline, cost
  vs. value, vendor concentration.
- **Atlas role**: composes cost editorial.
- **Steward role**: validates cost capture; flags missing
  attribution.
- **Sentinel role**: detects cost-leakage cross-program patterns.
- **Nexus role**: uses cost inside ROI Context Bundle.

### 6. Operating Model / Productivity Impact
- **Required datasets**: DORA metrics, release velocity, defect
  rate, productivity uplift, team-level engineering cost.
- **Key KPIs**: productivity uplift, velocity delta, change-failure
  rate, MTTR.
- **Atlas role**: composes productivity editorial.
- **Steward role**: validates DORA capture.
- **Sentinel role**: detects operating-model gap (I1
  `ai_governance_operating_model_gap`).
- **Nexus role**: uses operating-model state in Context Bundle.

### 7. Technology & Data Readiness
- **Required datasets**: tech stack inventory, cloud account
  inventory, integration map, data-quality snapshot, data-readiness
  score.
- **Key KPIs**: data-readiness score, stack coverage, integration
  count, cloud-cost split.
- **Atlas role**: composes readiness editorial.
- **Steward role**: validates data readiness; refuses use-case
  shortlisting when below threshold.
- **Sentinel role**: detects context sparsity (I1
  `program_context_sparsity`).
- **Nexus role**: uses readiness inside Context Bundle scoping.

---

## E. Atlas Brief contract

The Atlas Tower brief is the **single most-read artifact** the
Tower produces. It must conform to these rules.

### Required fields

| Field | Definition |
|---|---|
| **title** | "{tenant} · AI Control Tower brief" |
| **portfolioStand** | One sentence naming where the portfolio stands today. |
| **whereAtRisk** | One sentence naming the top portfolio risk. |
| **nextSteeringDecision** | One sentence naming the next decision; routes to a real destination. |
| **topPressures** | Exactly three pressure cards (see §G). |
| **lensReference** | Names the lens (see §H) the brief is read against; null when no lens is active. |
| **suggestedHandoffs** | Subset of {nexus, sentinel, steward} pulled from the active dimension. |
| **suggestedFollowUps** | Exactly three deterministic prompts; rendered disabled until live runtime. |
| **sourceLabel** | `deterministic_seed` or one of `*_read_model` markers per dimension. |
| **interpretationBasis** | Single line naming the source-of-truth limit and confidence cap. |

### Voice

- Atlas voice: executive register, calm, concrete.
- No fluff, no hedging, no speculative claims.
- Every claim either cites a captured value or names that the value
  is not captured.

### Length

- ≤ 140 words for the prose portion of the brief.
- ≤ 12 lines on screen including chips and follow-ups.

---

## F. Five-scorecard limit

The Tower exposes **at most five scorecards** at any time. Five is
the cognitive ceiling for an executive read.

Scorecards are chosen across the seven dimensions; the Tower never
shows seven scorecards at once. The active five are chosen by the
Atlas brief composer based on:

- pressure (Sentinel + PF1 detections)
- recency (Steward last-edit timestamps)
- the active lens (§H)

If more than five scorecards qualify, the brief surfaces the top
five and notes the residual in `interpretationBasis`.

---

## G. Three-pressure-card limit

The Tower surfaces **exactly three pressure cards** above the brief.
Pressure cards are the "things to act on now" set.

- Sentinel + PF1 produce candidates.
- Atlas selects the top three by canonical severity → confidence →
  pattern key rank.
- The fourth-and-beyond candidates are surfaced inside the brief's
  `interpretationBasis`, not on the page.

The page never shows four+ pressure cards. Three is the ceiling.

---

## H. One active lens at a time

The Tower has **lenses** — pre-canned cross-dimension reads
(adoption lens, value lens, risk lens, cost lens, ops-model lens,
readiness lens). At most **one lens is active at a time**.

When a lens is active:

- The brief is composed from that lens's anchored dimensions.
- The five scorecards bias toward that lens.
- The three pressure cards bias toward that lens.

When no lens is active:

- The brief composes from the canonical default mix.
- Pressure cards reflect the all-portfolio top three.

Lenses **do not** add new dimensions; they re-rank the canonical
seven.

---

## I. Ask Atlas drawer (not giant chat)

The Tower does **not** host a giant always-on chat panel. Asking
Atlas is a **drawer**:

- Triggered by an explicit affordance.
- Closes when the user moves on.
- Anchored to the active lens / brief.
- Pre-populated with three deterministic suggested prompts (matches
  the existing S9g / I2 brief follow-up pattern).
- Disabled until a live Atlas runtime subscriber lands; chips render
  visible-but-disabled with `deferred · live atlas runtime`
  sub-label.

The Tower's primary surface is the brief + scorecards + pressure
cards. Chat is a side drawer, not the main event.

---

## J. Internal vs. external data basis

Tower data has two bases. The Tower must surface them honestly.

### Internal basis

- Captured directly from the tenant's source systems via connectors,
  uploads, or authored artifacts.
- Examples: AI use-case inventory, captured value ledger, captured
  governance review, DORA metrics.
- Atlas can defend internal-basis claims at G3 / G4.

### External basis

- Sourced from public reports, peer benchmarks, vendor analytics,
  or AbarVa's pattern library.
- Examples: industry benchmarks, vendor cost benchmarks, peer-group
  productivity ranges.
- Atlas presents external-basis claims as **comparisons or
  references**, never as the tenant's own captured state.

Every scorecard, pressure card, brief sentence, or lens reads must
be tagged with its basis. Mixed-basis surfaces must surface the
distinction explicitly.

---

## K. No-fabrication rules

Every Tower surface must honor these rules:

1. **No fake dollars.** No string field carries `$` followed by a
   number unless the value is captured internally with a baseline
   reference.
2. **No fake citations.** No `E-###` evidence id appears unless the
   evidence registry actually resolves it.
3. **No live model claim.** No surface implies live retrieval or
   model invocation today; the source label must say
   `deterministic_seed` or a `*_read_model` marker.
4. **No vendor brand claims** that the tenant has not adopted; tools
   are mentioned as references only when the adoption telemetry
   exists.
5. **No "industry average" claims** without naming the external
   source.
6. **No "we deliver X% productivity uplift" claims** without a
   captured baseline AND a captured realized entry.
7. **No claim that the operating model is mature** while
   `ai_governance_operating_model_gap` (I1 meta pattern) is
   unresolved across more than two programs.
8. **No silent suppression.** When data is missing, surface the
   absence honestly with a deterministic-source caption.

---

## L. Future implementation slices

The following slices are proposed in dependency order. Each lands
in its own slice doc with explicit allowed / forbidden files.

| Slice | Name | Depends on | One-line goal |
|---|---|---|---|
| **ACT2** | AI Portfolio Inventory Read Model | ACT1, ADM3 | Deterministic per-tenant AI use-case inventory with sponsor / pattern / phase / gate. |
| **ACT3** | Adoption & Usage Read Model | ACT1, ADM3 | Per-tool seat / usage / cost telemetry projection. |
| **ACT4** | Value / Outcome Ledger Read Model | ACT1, S9d | Per-program baseline / target / realized projection. |
| **ACT5** | Risk & Governance Read Model | ACT1, ADM3 | Per-program risk register and responsible-AI review state. |
| **ACT6** | Cost & Consumption Read Model | ACT1, ADM3 | Per-tool / per-vendor cost projection. |
| **ACT7** | Productivity / DORA Read Model | ACT1 | Per-team DORA metric projection. |
| **ACT8** | Tech & Data Readiness Read Model | ACT1, ADM3 | Per-domain tech / data readiness score. |
| **ACT9** | Atlas AI Control Tower Brief | ACT1, ACT2-ACT8 | Composes the brief from the seven dimension read models. |
| **ACT10** | AI Control Tower UI | ACT1, ACT9 | Apple-like surface implementing brief + 3 pressure cards + 5 scorecards + lens + Ask Atlas drawer. |

---

## M. Acceptance for `verified` promotion of ACT1

- Founder confirms the seven canonical dimensions reflect the
  intended AI Control Tower scope.
- Founder confirms the **3-pressure-card / 5-scorecard / 1-lens /
  drawer-not-chat** constraints.
- Founder confirms the **internal vs. external basis** distinction
  and the **no-fabrication** rules.
- Founder signs off on the future-slice plan ACT2 → ACT10.
- Application code, runtime, auth, supabase, and migrations remain
  untouched (test enforced via the manifest's forbidden-files
  list).

## Validation

- `npx tsc --noEmit --pretty false` — pass (no application code
  changed).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
