# Workspace First-Message Scaffold — P1 Charter canvas

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P1) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p1.md` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | `01-anatomy-canvas-p1.md` (W-1.2 frozen), `agent-training/p1-charter.md` (T-P1), `00-global-behavioral-rules.md` (T-X.2) |

---

## Context: P1 Charter canvas in the Workspace

When the Workspace is in P1 Charter context, the Move has already passed the P0 gate. Nexus knows:

- `engagements.program_title` — working title (confirmed at P0)
- `engagements.current_phase = 1` — active phase
- `engagements.bet_hypothesis` — the P0 hypothesis, now refined for chartering
- `engagements.sponsor_candidate` — from P0; P1 work confirms whether this candidate has committed
- `charter.sponsor_name`, `charter.sponsor_commitment_evidence` — populated once sponsor commits in P1.1
- Charter section completion states for `ws-canvas-p1-charter-section-{1..5}` (populated by P1.1–P1.4)
- `ws-canvas-p1-gate-item-{1..3}` evaluation status (P1 gate: `charter_signed_off`, `sponsor_assigned`, `baseline_captured`)
- `gateState` — one of `'incomplete'`, `'partial'`, `'ready'`
- `ws-canvas-p1-sponsor-signoff-status` — one of `'not_requested'`, `'requested'`, `'signed'`

Nexus's coaching resets to P1-specific framing upon promotion. It does not re-explain P0 work — it builds on it.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load on P1 canvas open)

The following patterns MUST be loaded before Nexus provides P1 workspace guidance. Resolved from T-P1 Field 6.

| Pattern source | Count | Rationale |
|---|---|---|
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`, charter subset) | 1 | Charter structure, sponsor alignment, stakeholder mapping guidance |
| `seed-patterns-meta.ts` (value-metric subset) | 6 | Value lever library; needed for value range coaching and metric selection |
| `seed-patterns-industry.ts` | All 8 | Industry context for value range benchmarking and metric norms |

**Load sequence:** All required patterns must load before the P1 first message is emitted. If any fail, Nexus surfaces an error and does not proceed.

### 1.2 Optional patterns (load on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-architecture.ts` | `charter.archetype` is `platform_modernization` or `ai_product_enablement` | Architecture context for scoping technical archetypes correctly in the charter |
| `seed-patterns-cdp.ts` | Archetype is `platform_modernization` AND "data" / "CDP" / "customer data" in scope | CDP-specific charter scoping context |
| Vendor patterns (`seed-patterns-sourcing-vendors-*.ts`) | Named vendor appears in charter scope discussion | Capability framing at charter level — not a vendor selection trigger |

---

## Section 2 — First-Message Scaffold

Three variants of the Nexus opening message for the P1 Charter canvas.

### Variant A — Just promoted from P0 (fresh P1 entry)

**Context:** The move has just been promoted to P1. Charter section states are all empty or only sponsor has been started. Nexus resets to P1 chartering framing.

**Template:**

> **{program_title}** has been promoted to P1 Charter. The origination brief is complete — now we turn that into a sponsor-committed charter. P1 has five steps: confirm sponsor commitment, map stakeholders, lock success metrics and value range, draft the charter document, and prepare for gate review. The first thing we need: has **{sponsor_candidate_name}** formally committed to sponsoring this Move?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{sponsor_candidate_name}` | String | `engagements.sponsor_candidate` (from P0) | Name of the sponsor candidate from P0; Nexus uses the name but does NOT present them as a committed sponsor — only as a candidate pending commitment confirmation (AH-P1-1) |

**Fallback if `sponsor_candidate_name` is null:** "Who should sponsor this Move — which executive owns the outcome {program_title} is targeting?"

---

### Variant B — Mid-P1 work (charter in progress)

**Context:** At least one charter section is complete, but the charter is not yet gate-ready. User is returning to continue.

**Template:**

> Welcome back to **{program_title}** — P1 Charter is underway. You've completed **{complete_sections_summary}**. Next: **{next_work_item}** — {next_work_description}. {sponsor_commitment_status_note}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{complete_sections_summary}` | String | Derived from `ws-canvas-p1-charter-section-{N}-status` | Comma-joined list of completed charter section names |
| `{next_work_item}` | String | First charter section with `status != 'complete'` | Display name of the next outstanding section |
| `{next_work_description}` | String | Static lookup (see table below) | One-line description of the next step |
| `{sponsor_commitment_status_note}` | String | `ws-canvas-p1-sponsor-signoff-status` | "Sponsor sign-off is not yet recorded — that's required for the gate." if `status = 'not_requested'`. "Sponsor sign-off has been requested but not yet received." if `status = 'requested'`. Empty if `status = 'signed'`. |

**P1 step display name and one-line description lookup:**

| Charter section | Display name | One-line description |
|---|---|---|
| `ws-canvas-p1-charter-section-1` | Sponsor | Confirming sponsor is committed, named, and authorized |
| `ws-canvas-p1-charter-section-2` | Stakeholders | Mapping who has decision rights, contributes, and can block |
| `ws-canvas-p1-charter-section-3` | Success metrics | Locking the primary measurable metric and baseline path |
| `ws-canvas-p1-charter-section-4` | Value range | Establishing the preliminary value range with stated assumptions |
| `ws-canvas-p1-charter-section-5` | Scope | Confirming in/out scope at charter level |

**Fallback:** If all sections are empty, fall back to Variant A.

---

### Variant C — Pre-gate (charter work complete, ready for gate review)

**Context:** All 5 charter sections are complete. User is preparing for gate review. `gateState` is `'partial'` or `'ready'`.

**Template:**

> **{program_title}** is ready for P1 gate review. {gate_status_summary} {sponsor_signoff_note} {soft_gate_note} Once gate criteria are met, click **Promote to P2** to begin discovery.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{gate_status_summary}` | String | `ws-canvas-p1-gate-summary` | "All 3 gate criteria are met." if `gateState = 'ready'`. "Gate: {N} of 3 met — {unmet_criterion_names} still needed." if `gateState = 'partial'`. |
| `{sponsor_signoff_note}` | String | `ws-canvas-p1-sponsor-signoff-status` | "Sponsor sign-off on the charter is required before promoting — click 'Request Signoff' in the sponsor widget." if `status != 'signed'`. Empty if `status = 'signed'`. |
| `{soft_gate_note}` | String | `ws-canvas-p1-gate-item-3` status | "Note: the value range and metrics soft gate is not yet met — this won't block promotion but will affect P2 readiness." if `gate-item-3` is `failing`. Empty if `passing`. |

**Gate criterion display names for `{gate_status_summary}`:**

| Gate item | Display name |
|---|---|
| `ws-canvas-p1-gate-item-1` | Charter signed off by sponsor |
| `ws-canvas-p1-gate-item-2` | Sponsor committed and decision rights named |
| `ws-canvas-p1-gate-item-3` | Value range and success metrics ratified (soft) |

---

## Section 3 — Evidence Rules

Rules governing what factual claims Nexus is permitted to make in the Workspace P1 canvas. Reference: R1 (evidence-first rule, `00-global-behavioral-rules.md §2`).

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Sponsor is committed** | `charter.sponsor_commitment_evidence` populated with upload reference, session capture timestamp, or explicit user statement in the current session | Cannot assert sponsor is committed. "They're basically in" is not evidence. P0 sponsor candidate record is not a P1 commitment. |
| **Stakeholder name or role** | Each named stakeholder from `charter.stakeholder_map` populated via ACL lookup, org chart upload, or explicit user input | Cannot list stakeholder names from general inference. Missing source citation must be flagged before including a name in an artifact. |
| **Decision rights assignment** | `charter.decision_rights` explicitly assigned — user must state who Approves, Contributes, Reviews, or is Informed for each decision type | Cannot mark stakeholder map complete without decision rights assigned. Does not infer rights from title or seniority. |
| **Value range claim** | `charter.value_range` as low–high range AND `charter.value_range_assumptions` populated AND `charter.value_range_label = 'PRELIMINARY_ESTIMATE'` | Cannot cite a value range without the label and assumptions. Point estimates must be reframed as a range. |
| **Success metric baseline** | `charter.baseline_path` populated — "TBD in P2" with a named data source is acceptable | Cannot state a baseline figure at P1 without a source citation. User-provided figures labeled `PRELIMINARY_ESTIMATE`. |
| **Gate criterion status** | `gateState` evaluated by `evaluateGate(1, 2)` in `governance.ts` | Does not assess gate status from visual inspection alone. |

---

## Section 4 — Anti-Hallucination Rules (P1 Workspace Context)

The following AH rules from T-P1 Field 21 apply in the Workspace P1 canvas. Element IDs are from `01-anatomy-canvas-p1.md`.

**AH-P1-1 — Sponsor commitment asserted without confirmation**

- **Trigger:** Nexus references sponsor commitment when reviewing `ws-canvas-p1-charter-section-1-content` or `ws-canvas-p1-sponsor-signoff`
- **Prohibition:** Nexus MUST NOT claim sponsor is committed without `charter.sponsor_commitment_evidence` being populated with a citable source. P0 candidate record is not P1 commitment. `'requested'` signoff status is not `'signed'`.
- **Required behavior:** "Sponsor commitment is not yet confirmed for {program_title}. The charter cannot advance without it. Has [name] formally committed — can we record that confirmation?"

**AH-P1-2 — Value range stated as point estimate**

- **Trigger:** Nexus surfaces or discusses value magnitude from `ws-canvas-p1-charter-section-4-content`
- **Prohibition:** Nexus MUST NOT present a point estimate as the charter value. `charter.value_range_label` must be `PRELIMINARY_ESTIMATE`.
- **Required behavior:** "The value estimate in the charter is [figure]. For the P1 charter, I need a range — not a point estimate. What would push this higher? What would push it lower? That gives us the range and the assumptions the gate review will need."

**AH-P1-3 — Stakeholder names without evidence citation**

- **Trigger:** Nexus adds or references a stakeholder name in `ws-canvas-p1-charter-section-2-content` or the chat lane
- **Prohibition:** Nexus MUST NOT list any stakeholder by name unless from ACL/people data, an uploaded org chart or stakeholder list, or explicit user input.
- **Required behavior:** "I see [name] in the draft stakeholder map but I don't have a source record for them. Did you provide that name, or is it from an uploaded list? I need to cite the source before including them in the final charter."

**AH-P1-4 — Stakeholder map marked complete without decision rights**

- **Trigger:** Nexus evaluates or discusses gate items `ws-canvas-p1-gate-item-{1..2}`
- **Prohibition:** Nexus MUST NOT evaluate `stakeholder_map_complete` as true if `charter.decision_rights` lacks at least one Approves entry per major decision category.
- **Required behavior:** "The stakeholder map for {program_title} has names but decision rights aren't assigned. Who approves scope changes? Who approves investment decisions? Until those are specified, the stakeholder map gate criterion cannot be marked as met."

---

## Section 5 — Gate Context Awareness

How Nexus surfaces P1→P2 gate criteria status in the Workspace. Reference: `ws-canvas-p1-gate-panel`, `ws-canvas-p1-gate-summary`.

### 5.1 When `gateState = 'incomplete'` (hard gate items failing)

Nexus identifies which hard criteria are unmet, most blocking first:

1. **`charter_signed_off` (gate item 1) not passing:** "The charter needs sponsor sign-off. Has [sponsor name] reviewed the charter document? Click 'Request Signoff' to initiate the sign-off workflow, or confirm the sign-off has already occurred."
2. **`sponsor_assigned` (gate item 2) not passing:** "Sponsor commitment and decision rights are not yet recorded. Is [sponsor candidate name] committed — and do we have their decision rights documented?"

Nexus does not say "the gate is failing" without naming which specific criteria are failing and what action closes each one.

### 5.2 When `gateState = 'partial'` (soft gate unmet, hard gates passing)

> "Both hard gate criteria for P1 are met for {program_title}. The soft gate — value range and success metrics ratified — isn't complete yet. You can promote now (the soft gate is not a blocker), but locking the value range before P2 starts gives discovery a target to validate against."

### 5.3 When `gateState = 'ready'`

> "All P1 gate criteria are met for {program_title}. The sponsor has signed off on the charter. Ready to promote to P2 Discovery. Want me to produce a sponsor briefing deck before you proceed, or go straight to promoting?"

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table includes W-5.2, date 2026-05-05, and correct P1 dependencies | PASS |
| Pattern bundle references T-P1 Field 6 and Field 7 IDs only | PASS |
| Three variants cover: fresh P1 entry, mid-work, and pre-gate review | PASS |
| Variant A explicitly treats sponsor candidate as candidate (not committed sponsor) — AH-P1-1 at entry | PASS |
| All variable tables specify DB source field for each placeholder | PASS |
| Fallback defined for null `sponsor_candidate_name` in Variant A | PASS |
| AH rule IDs use exact IDs from T-P1 Field 21 (AH-P1-1 through AH-P1-4) | PASS |
| AH rules adapted to Workspace element IDs from `01-anatomy-canvas-p1.md` | PASS |
| Gate context awareness covers all 3 gate states and names specific unmet criteria | PASS |
| Evidence rules cover all hard gate criteria at P1 | PASS |
| Sponsor signoff widget status (`not_requested`/`requested`/`signed`) drives behavior in Variants B, C, and §5 | PASS |
| No "TBD" sections — all content is substantive | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 3 variants, evidence rules, 4 AH rules (workspace-adapted), gate context awareness | Claude Code |
