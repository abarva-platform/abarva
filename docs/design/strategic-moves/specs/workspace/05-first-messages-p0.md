# Workspace First-Message Scaffold — P0 Originate canvas

| Field | Value |
|---|---|
| **Work Package** | W-5.2 (P0) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-first-messages-p0.md` |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | `01-anatomy-canvas-p0.md` (W-1.2 frozen), `agent-training/p0-originate.md` (T-P0), `00-global-behavioral-rules.md` (T-X.2) |

---

## Context: Workspace vs. Originate page

The Originate page (`/strategic-moves/new`) is the entry surface for creating a new Move. Once a Move exists in the DB and has been placed in P0, the **Workspace P0 canvas** (`/strategic-moves/{code}?phase=0`) is the management surface. When Nexus loads the P0 workspace context, the Move is already a real record in the `engagements` table. Nexus knows:

- `engagements.program_title` — the move's working title
- `engagements.current_phase` — is P0 (or the user is reviewing P0 in a past view)
- `engagements.bet_hypothesis` — the hypothesis from origination
- `engagements.sponsor_candidate` — the sponsor candidate identified in P0
- Scaffold step completion states for all 7 brief sections (from `origination_drafts` or equivalent artifact record)
- Gate evaluation result: `gateState` — one of `'incomplete'`, `'partial'`, `'ready'`

Nexus's coaching in the Workspace P0 canvas is move-specific and phase-specific. It does not re-run the origination workflow — it coaches on completing or reviewing the P0 work for this specific named program.

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load on P0 canvas open)

The following patterns MUST be loaded before Nexus provides P0 workspace guidance. These are the same required patterns as T-P0 Field 6, adapted to the workspace context.

| Pattern source | Count | Rationale |
|---|---|---|
| `seed-patterns-industry.ts` | All 8 | Industry context for interpreting archetype classification and value hypothesis in move-specific conversation |
| `seed-patterns-ai-programs.ts` | All 14 | AI use-case discovery patterns; classifier reference for archetype coaching |
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`, origination subset) | 1 | Program lifecycle origination guidance; sponsor alignment pattern |
| `seed-patterns-meta.ts` (value-metric subset) | 6 | Value lever library for hypothesis coaching at P0.6 |

**Load sequence:** Load all required patterns before emitting the Workspace P0 first message. If a required pattern fails to load, Nexus surfaces an error and does not proceed. Operating without the full pattern set is a silent failure mode.

### 1.2 Optional patterns (load on demand)

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `seed-patterns-sourcing-vendors-{name}.ts` | A vendor name appears in `brief.sourcing_signals` or user input during the workspace session | Context load for vendor mentioned in P0 brief — not a sourcing trigger |
| `seed-patterns-architecture.ts` | `brief.archetype` is `platform_modernization` or `ai_product_enablement` | Architecture context for evidence family coaching in P0.5 |
| `seed-patterns-cdp.ts` | Archetype is `platform_modernization` AND "data" / "CDP" / "customer data" appears in brief or user input | CDP-specific origination context |

---

## Section 2 — First-Message Scaffold

Three variants of the Nexus opening message, based on the user's entry context when they open the Workspace P0 canvas.

### Variant A — First view of P0 canvas (move just originated, nothing done yet)

**Context:** The Move has just been created from the Originate page — scaffold step states are all `empty` or only step 1 is `in-progress`. The user is viewing the P0 canvas for the first time in the Workspace.

**Template:**

> **{program_title}** is now a P0 Move. Let's complete the origination brief — 7 sections need to be done before you can charter. You've {sections_done_summary}. Next up: **{next_step_name}** — {next_step_description}. Want to continue from here?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move as entered during origination |
| `{sections_done_summary}` | String | Derived from `origination_drafts.scaffold_step_states` | "completed 1 of 7 sections" if step 1 is done, or "just started" if all empty |
| `{next_step_name}` | String | `origination_drafts.scaffold_step_states` — first step with `status != "complete"` | Display name of the next step needing work |
| `{next_step_description}` | String | Static lookup from scaffold step definitions | One-line description of what the step involves |

**Fallback:** If `program_title` is null or empty, use "This Move" as the title placeholder. If scaffold state is entirely empty, use "just started" for `{sections_done_summary}`.

---

### Variant B — Returning to P0 canvas mid-work (some steps done)

**Context:** The user returns to a P0 canvas where work is underway — at least one section is `complete` and at least one is still `empty` or `in-progress`. The move has not been promoted.

**Template:**

> Welcome back to **{program_title}**. You've completed {complete_count} of 7 sections. You left off at **{last_completed_step_name}** — next is **{next_incomplete_step_name}**: {next_step_description}. {gate_proximity_note}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{complete_count}` | Integer (0–7) | `origination_drafts.scaffold_step_states` — count of steps with `status = "complete"` | Number of completed scaffold sections |
| `{last_completed_step_name}` | String | `origination_drafts.scaffold_step_states` — last step with `status = "complete"` | Display name of the most recently completed step |
| `{next_incomplete_step_name}` | String | `origination_drafts.scaffold_step_states` — first step with `status != "complete"` | Display name of the next outstanding step |
| `{next_step_description}` | String | Static lookup from scaffold step definitions (same table as Variant A) | One-line description of the next step |
| `{gate_proximity_note}` | String | Derived from `complete_count` | Empty if 4 or fewer complete. "You're close — {7 - complete_count} more section(s) and you can promote to P1 Charter." if 5 or 6 complete. |

**Scaffold step display name and one-line description lookup:**

| Step | Name | One-line description |
|---|---|---|
| 1 | What's the bet / hypothesis | Capturing the falsifiable hypothesis for this Move |
| 2 | Archetype classification | Classifying this Move into the right AbarVa archetype |
| 3 | Sponsor candidate | Identifying who should sponsor this Move |
| 4 | Scope / boundary | Defining what is in and out of scope |
| 5 | Evidence family selection | Choosing evidence types to gather in P2 |
| 6 | Value hypothesis seed | Drafting the preliminary value hypothesis |
| 7 | Foundation readiness | Checking the four foundation readiness criteria (F1–F4) |

**Fallback:** If `complete_count = 0`, fall back to Variant A.

---

### Variant C — P0 complete, gate criteria partially or fully met (reviewing before promoting)

**Context:** All 7 brief sections are `complete`. The user is reviewing the completed brief before promoting to P1 Charter. `gateState` is `'partial'` or `'ready'`.

**Template:**

> **{program_title}** is ready to review for promotion. All 7 sections are complete. {gate_status_summary} {sponsor_status_note} When you're ready, click **Promote to P1 Charter** to advance.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{program_title}` | String | `engagements.program_title` | Working title of the move |
| `{gate_status_summary}` | String | Derived from `gateState` and gate criterion evaluation | "All gate criteria are met." if `gateState = 'ready'`. "Gate criteria: {N} of {total} met — {unmet_criteria_names} still needed." if `gateState = 'partial'`. |
| `{sponsor_status_note}` | String | `engagements.sponsor_state` | "Sponsor signature is required before promoting." if `sponsor_state != 'signed'`. Empty if `sponsor_state = 'signed'`. |

**Gate criterion names for `{gate_status_summary}` (unmet criteria display):**

| GC ID | Display name |
|---|---|
| GC-P0-1 | Falsifiable hypothesis |
| GC-P0-2 | Archetype classification |
| GC-P0-3 | Sponsor candidate (human-confirmed) |
| GC-P0-4 | Value hypothesis (UNVALIDATED label) |
| GC-P0-5 | Scope boundary |

---

## Section 3 — Evidence Rules

Rules governing what factual claims Nexus is permitted to make in the Workspace P0 canvas. Reference: R1 (evidence-first rule, `00-global-behavioral-rules.md §2`).

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Sponsor candidate** | `engagements.sponsor_candidate` populated AND `brief.sponsor_evidence_source` populated with ACL field, org chart upload reference, or explicit user statement | Nexus states the candidate exists in the brief but flags the missing evidence citation. Does not assert the candidate is credible without an evidence source. |
| **Archetype classification** | `brief.archetype` populated AND `brief.archetype_confidence_band` recorded | If confidence band is `low` or `no_match`, Nexus proactively flags this as tentative when the user engages the archetype section. Cannot present a `low`-confidence classification as settled. |
| **Value hypothesis magnitude** | `brief.value_hypothesis` populated AND `brief.value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'` | If a numeric figure appears in the brief without the required label, Nexus flags the missing label when the section is reviewed. Does not allow any P0 numeric claim without the label. |
| **Foundation readiness status (F1–F4)** | Each F1–F4 field in `ws-canvas-p0-brief-section-7-f1` through `f4` populated from explicit user confirmation during origination | Cannot infer F1–F4 pass/fail from indirect signals. If a check is empty, Nexus asks the user to confirm each check directly. |
| **Prior move comparison** | A substrate query result against `engagement_topics` or `engagements` returning a match | Cannot claim a prior similar move exists without a substrate result. States "I'll check if we've worked on something similar" and surfaces results or absence. |
| **Gate criterion status** | `gateState` evaluated by `evaluateGate(0, 1)` in `governance.ts` | Does not assess gate status from visual inspection of section completeness alone. Gate evaluation must run through `governance.ts`. |

---

## Section 4 — Anti-Hallucination Rules (P0 Workspace Context)

The following AH rules from T-P0 Field 21 apply in the Workspace P0 canvas context. Element IDs are from `01-anatomy-canvas-p0.md`.

**AH-P0-1 — Sponsor name without ACL citation**

- **Trigger:** Nexus references a sponsor candidate name in the chat lane while reviewing or editing `ws-canvas-p0-brief-section-3-content`
- **Prohibition:** Nexus MUST NOT affirm or repeat a sponsor candidate name in the Workspace without citing the evidence source from `brief.sponsor_evidence_source`. The source must be one of: ACL lookup result, org chart upload reference, or explicit user statement with session timestamp.
- **Workspace-specific note:** In the Workspace, the sponsor candidate was already proposed during origination. If the source is missing from the record, Nexus must flag the gap rather than treating the name as established fact.
- **Required behavior:** "I see [name] is listed as the sponsor candidate. The evidence source for this name needs to be recorded before promoting — can you confirm where this came from?"

**AH-P0-2 — Archetype stated as definitive at low confidence**

- **Trigger:** Nexus discusses or displays the archetype classification in `ws-canvas-p0-brief-section-2-content` when `brief.archetype_confidence_band = 'low'` or `'no_match'`
- **Prohibition:** Nexus MUST NOT present the archetype as settled in the Workspace brief review if the confidence band was low at origination and the user has not subsequently confirmed the classification.
- **Required behavior:** "The archetype classification for this move is tentative — it was flagged as low-confidence during origination. Before promoting to P1, let's confirm: does [archetype name] still fit, or should we revisit the classification?"

**AH-P0-3 — Value magnitude without UNVALIDATED label**

- **Trigger:** Nexus surfaces any numeric value figure from `brief.value_hypothesis` in a chat message or canvas display
- **Prohibition:** Nexus MUST NOT quote a value figure from the P0 brief without immediately pairing it with the `UNVALIDATED_HYPOTHESIS` label. This applies equally when reviewing a completed brief as when drafting it.
- **Required behavior:** When presenting value numbers: "The value hypothesis for {program_title} is [range] — this is an unvalidated hypothesis that will be confirmed against your baseline in P2."

**AH-P0-4 — Industry benchmark without pattern citation**

- **Trigger:** Nexus references an industry benchmark figure while coaching on the value hypothesis section or archetype classification
- **Prohibition:** Nexus MUST NOT state an industry benchmark figure as a standalone fact in the Workspace. Benchmark claims must cite a specific `seed-patterns-industry.ts` entry.
- **Required behavior:** "Per [PAT-IND-XXX], the benchmark range for [metric] is [range]. Your P0 hypothesis uses [figure] — we'll validate your specific baseline against this in P2."

---

## Section 5 — Gate Context Awareness

How Nexus surfaces gate criteria status when the P0 canvas is open. Reference: `ws-canvas-p0-promote-bar-gate-summary`, `ws-canvas-p0-promote-bar-status-text`.

### 5.1 When `gateState = 'incomplete'` (missing hard criteria)

Nexus proactively identifies the specific missing hard gate criteria (GC-P0-1 through GC-P0-5) and surfaces them in order of blocking severity:

1. **Sponsor candidate (GC-P0-3)** — if missing, Nexus surfaces this first: "P0 requires a sponsor candidate before promoting. Who owns the outcome {program_title} is targeting?"
2. **Scope boundary (GC-P0-5)** — if missing, Nexus surfaces: "The scope boundary isn't defined yet. What is explicitly in scope — and what is out?"
3. **Other missing hard criteria** — Nexus lists them by name and offers to continue the conversation on each one.

Nexus does not say "you need to complete more sections" without naming the specific sections.

### 5.2 When `gateState = 'partial'` (soft criteria unmet, hard criteria passing)

Nexus acknowledges progress and surfaces which soft gate items are outstanding:

- If `archetype_confidence_band` is not recorded (GC-P0-6): "The archetype confidence band isn't recorded — we should run the classifier before promoting."
- If `evidence_families_identified` count is below 3 (GC-P0-7): "The evidence plan lists fewer than 3 evidence families. P2 works best with at least 3 types of evidence to gather. What else could be relevant?"

Nexus notes that soft criteria do not block promotion but represent a quality gap that will affect P2 planning.

### 5.3 When `gateState = 'ready'`

Nexus confirms all criteria are met and offers to produce the P1 Charter Draft Skeleton (`CHARTER-SKEL-P0`) before the user promotes:

> "All gate criteria for P0 are met for {program_title}. Before you promote, I can draft the P1 Charter skeleton — it will pre-populate the hypothesis, archetype, and scope fields so P1 starts with a head start. Want me to draft that now, or go straight to promoting?"

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table includes W-5.2, date 2026-05-05, and correct dependencies | PASS |
| Pattern bundle references only T-P0 Field 6 and Field 7 IDs | PASS |
| Three message variants cover: first-time view, mid-work return, and pre-promotion review | PASS |
| All variable tables specify DB source field for each placeholder | PASS |
| Fallback behavior defined for all variables that can be null | PASS |
| AH rule references use exact IDs from T-P0 Field 21 (AH-P0-1 through AH-P0-4) | PASS |
| AH rules are adapted to Workspace element IDs from `01-anatomy-canvas-p0.md` | PASS |
| Evidence rules reference R1 (evidence-first rule) from global behavioral rules | PASS |
| Gate context awareness section covers incomplete, partial, and ready states | PASS |
| Variant C surfaces specific unmet criterion names, not just a count | PASS |
| No "TBD" sections — all content is substantive | PASS |
| Workspace vs. Originate distinction is explicit and correct in context section | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 3 variants, evidence rules, 4 AH rules (workspace-adapted), gate context awareness | Claude Code |
