# Originate Page · Layer 5 Knowledge Surfacing

| Field | Value |
|---|---|
| **Work Packages** | O-5.1, O-5.2, O-5.3, O-5.4, O-5.5, O-5.6 |
| **Doc path** | `docs/design/strategic-moves/specs/originate/05-knowledge-surfacing.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending O-5.7 sign-off |
| **Depends on** | O-1.1 (anatomy, frozen), T-P0 (`agent-training/p0-originate.md`), F-04 audit (`PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md`) |
| **References** | `SPEC_METHODOLOGY.md §2.5`, `agent-training/00-cross-phase-capabilities.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's behavior on the Originate page (`/strategic-moves/new`) — the knowledge surfacing contract for Phase P0. It covers:

- What patterns Nexus loads and when (§1)
- What Nexus says when the page opens — three entry variants (§2)
- What action chips appear below the first message (§3)
- What evidence Nexus must have before making specific claim types (§4)
- What Nexus must never do — anti-hallucination rules (§5)
- What happens when the user navigates away mid-origination (§6)
- Fixture test scenarios that validate correct behavior (§7)

All element IDs referenced here are defined in `01-anatomy.md`. Interactions referenced in the chip ladder correspond to Layer 3 (`03-interactions.md`). The Layer 5 spec becomes the behavioral contract for the Originate implementation gate (O-IG).

---

## Section 1 — Pattern Bundle

### 1.1 Required patterns (load on page open)

The following patterns MUST be loaded before Nexus provides any guidance on the Originate page. These are resolved from T-P0 Field 6 and `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §3`.

| Pattern source | File | Count | Rationale |
|---|---|---|---|
| `seed-patterns-industry` | `src/lib/intelligence/seed-patterns-industry.ts` | 8 (all) | Industry context for hypothesis extraction and archetype classification |
| `seed-patterns-ai-programs` | `src/lib/intelligence/seed-patterns-ai-programs.ts` | 14 (all) | AI use-case discovery patterns and archetype matching; classifier draws from this set |
| `PAT-PRG-001` | `src/lib/intelligence/program-lifecycle-patterns.ts` (line 349, origination subset) | 1 | Program lifecycle origination guidance; sponsor alignment pattern |
| `seed-patterns-meta` (value-metric subset) | `src/lib/intelligence/seed-patterns-meta.ts` | 6 (all, value-metric subset) | Value lever library for hypothesis seeding at P0.6 |

**Load sequence:** Load all required patterns before emitting the first Nexus message. If any required pattern fails to load, Nexus must not proceed — surface a system error and log the failure. Nexus operating without its full required pattern set is a silent failure mode.

### 1.2 Optional patterns (loaded on demand)

Optional patterns are not pre-loaded. Each fires based on a specific signal trigger during the P0 scaffold conversation.

| Pattern source | Load trigger | Which scaffold step | Rationale |
|---|---|---|---|
| `signal_catalog.recommended_pattern_keys[]` | Signal classification event fires in classifier pipeline | P0.2 (archetype classification, scaffold step 2) | Classifier-recommended patterns based on the specific input text content |
| `seed-patterns-sourcing-vendors-{name}.ts` (22 vendor files) | A named vendor or product appears in user input or pasted text | P0.1 (capture signal, scaffold step 1) — on first mention of a vendor name | Load the specific vendor pattern for the mentioned vendor. Note: vendor name is recorded as `brief.sourcing_signals` at P0 — this is a context load only, not a sourcing trigger event |
| `seed-patterns-architecture` | Archetype classification resolves to `platform_modernization` OR `ai_product_enablement` | P0.2 (archetype resolved) — loads before P0.5 (evidence family selection, scaffold step 5) | Architecture context for evidence family planning |
| `seed-patterns-cdp` | Archetype classification resolves to `platform_modernization` AND keywords "data" / "CDP" / "customer data" appear in user input | P0.2 (archetype resolved) — loads before P0.5 | CDP-specific origination context; narrows evidence family suggestions |

**Trigger mechanism:** Optional patterns are loaded programmatically by the signal classifier or keyword detection, not by user action. The user is not informed when an optional pattern loads. Optional pattern load failures are logged but do not block scaffold progress.

---

## Section 2 — First-Message Scaffold

Three variants of the Nexus opening message, based on the context in which the user arrives at `/strategic-moves/new`.

### 2A — Empty Entry

**Context:** User navigates to `/strategic-moves/new` with no prior context — no draft in progress, no pasted content, no query parameters signaling a prior session.

**Template:**

> To start a new Strategic Move, I need four things from you: the outcome you're targeting, who cares about it, what evidence you have, and a rough sense of what value is at stake. You can type a description or paste something — a CEO note, email thread, board memo, or problem statement. Where do you want to start?

**Variables:** None — this variant has no parameterized placeholders. It is fixed across all empty-entry sessions.

**What Nexus does if entry conditions are not met:**
- If Nexus cannot determine whether the entry is truly empty (session state is ambiguous), it defaults to Variant 2A and allows the user's first response to disambiguate.
- Nexus does not ask "is this a new move or are you returning?" — it opens with the empty-entry prompt and the partial-draft chip (`orig-chat-scaffold`) will surface if a draft exists.

---

### 2B — Partial Draft Return

**Context:** User returns to an in-progress origination draft. A draft with at least one scaffold step in `complete` or `in-progress` status exists, persisted from a previous session.

**Template:**

> Welcome back. You left off at **{last_completed_step_name}** (step {last_completed_step_number} of 7). Your next step is **{next_incomplete_step_name}** — {next_incomplete_step_description}. Ready to continue, or want to review what's been captured so far?

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{last_completed_step_name}` | String | `origination_drafts.scaffold_step_states` — last step with `status = "complete"` | Display name of the last completed scaffold step (e.g., "Archetype classification") |
| `{last_completed_step_number}` | Integer (1–7) | `origination_drafts.scaffold_step_states` | Step number of the last completed step |
| `{next_incomplete_step_name}` | String | `origination_drafts.scaffold_step_states` — first step with `status != "complete"` | Display name of the next step needing work (e.g., "Sponsor candidate") |
| `{next_incomplete_step_description}` | String | Static lookup from scaffold step definitions | A one-line description of what the next step involves (see table below) |

**Next incomplete step descriptions (static lookup):**

| Step | Name | One-line description |
|---|---|---|
| 1 | What's the bet / hypothesis | Capturing the core business hypothesis for this Move |
| 2 | Archetype classification | Classifying this Move into the right AbarVa archetype |
| 3 | Sponsor candidate | Identifying who should sponsor this Move |
| 4 | Scope / boundary | Defining what is in and out of scope for this Move |
| 5 | Evidence family selection | Choosing which evidence types to gather in P2 |
| 6 | Value hypothesis seed | Drafting a preliminary value hypothesis |
| 7 | Foundation readiness | Checking the four foundation readiness criteria (F1–F4) |

**What Nexus does if required variables are missing:**

| Missing variable | Fallback behavior |
|---|---|
| `last_completed_step_number` is 0 (no step complete) | Fall back to Variant 2A (treat as empty entry) |
| `origination_drafts` record exists but all steps are `empty` | Fall back to Variant 2A |
| `next_incomplete_step_name` cannot be determined (all 7 steps are `complete`) | "Your brief looks complete. Review the canvas sections and click Promote to P1 Charter when you're ready." |
| Draft record exists but is corrupted or unreadable | Surface error: "I couldn't load your previous session. Start fresh?" — with a button that clears the draft state |

---

### 2C — Extract Entry (Document or Large Paste)

**Context:** User pastes a block of text (500+ characters) or uploads a document in their first interaction. The system detects that the input is suitable for extraction rather than conversational back-and-forth.

**Template (immediate response, before extraction completes):**

> Got it — let me extract what I can from this.

**Then, once extraction completes (typically within 2–5 seconds), follow with:**

> Here's what I found:
>
> **Hypothesis (draft):** {extracted_hypothesis}
>
> **Likely archetype:** {extracted_archetype} ({archetype_confidence_label})
>
> **Sponsor signal:** {extracted_sponsor_signal}
>
> {extraction_caveat}
>
> Does this look right? I can adjust any of these, or we can keep going.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{extracted_hypothesis}` | String | Classifier/extraction pipeline output | One-sentence hypothesis extracted from the pasted content |
| `{extracted_archetype}` | String | Classifier output — one of the 5 valid archetype keys | Display name of the top-matched archetype |
| `{archetype_confidence_label}` | String | Classifier `band` field: `high → "high confidence"`, `medium → "medium confidence"`, `low → "tentative"`, `no_match → "uncertain — your input may not match a known archetype"` | Confidence signal shown to user |
| `{extracted_sponsor_signal}` | String | ACL lookup result or "not identified from this content" | If a name appears in the pasted content and matches ACL data, surface it; otherwise state "not identified from this content — we'll work on this in step 3" |
| `{extraction_caveat}` | String | Always present | Fixed text: "These are draft extractions from your input. Nothing has been confirmed yet — we'll work through each one." |

**What Nexus does if required variables are missing:**

| Missing variable | Fallback behavior |
|---|---|
| `{extracted_hypothesis}` is null (extraction found no hypothesis) | "I couldn't extract a clear hypothesis from this. Can you tell me in one sentence: what outcome are you trying to achieve?" |
| `{extracted_archetype}` is `no_match` | Omit the archetype line from the extraction summary; proceed to step 2 of the scaffold to classify interactively |
| `{extracted_sponsor_signal}` is null | Use fixed fallback text: "not identified from this content — we'll work on this in step 3" |
| Extraction fails entirely (pipeline error) | "Something went wrong processing that. You can paste it again or just describe what you're trying to do." |

---

## Section 3 — Suggested Chip Ladder

Action chips appear below Nexus's first message. Each chip maps to a Layer 3 interaction ID. Chips are rendered by the `orig-chat-input-area` component, below the message list and above the text input.

### 3A — Empty Entry chips

These chips appear below the Variant 2A first message.

| Chip label | Layer 3 interaction ID | What it does |
|---|---|---|
| "Paste a note or document" | `orig-chat-attach-button` | Opens the file attachment flow (triggers `orig-chat-input-attachment` click behavior); also focuses input field for paste |
| "Describe the opportunity" | `orig-chat-input-field` (focus) | Sets focus on `orig-chat-input-field` with no prefill; placeholder updates to context-specific text ("What outcome are you targeting?") |
| "Show me an example" | `orig-chat-input-field` (prefill) | Sets focus on `orig-chat-input-field` and prefills with example text: "We want to use AI to reduce contact center handle time. Currently at 9 minutes, industry median is 5.5. CEO asked us to look at this." User can edit or submit as-is. |

### 3B — Partial Draft Return chips

These chips appear below the Variant 2B first message.

| Chip label | Layer 3 interaction ID | What it does |
|---|---|---|
| "Continue from step {N}" | `orig-chat-scaffold-step-{N}` | Sets the active scaffold step to the next incomplete step; focuses chat input with step-specific placeholder |
| "Review what's been captured" | `orig-canvas-brief-section-1` (scroll target) | Scrolls the canvas lane to the top (section 1) so user can review all populated brief sections; no state change |
| "Start over" | `orig-draft-clear-modal` | Opens a confirmation modal: "Clear this draft and start fresh? This cannot be undone." Confirm button clears the draft state and falls back to empty entry variant |

**Note on "Start over" interaction:** The interaction `orig-draft-clear-modal` must be defined in Layer 3 (`03-interactions.md`). If Layer 3 has not yet defined this interaction, this chip is a forward reference — implementation must define the modal and its confirmation behavior per this spec.

**Variable resolution for "Continue from step {N}":**
- `{N}` is resolved at render time from `origination_drafts.scaffold_step_states` — the number of the first step with `status != "complete"`.
- If `N = 1` (no steps complete), this chip does not render (user should see empty-entry chips instead).

### 3C — Post-Extraction chips

These chips appear after Nexus completes the Variant 2C extraction and presents the extraction summary.

| Chip label | Layer 3 interaction ID | What it does |
|---|---|---|
| "Confirm hypothesis" | `orig-canvas-brief-section-1` (edit mode) | Opens `orig-canvas-brief-section-1` in inline edit mode so user can confirm or adjust the extracted hypothesis |
| "Adjust archetype" | `orig-chat-scaffold-step-2` | Sets active scaffold step to step 2 (archetype classification) for interactive refinement |
| "Propose a sponsor" | `orig-chat-scaffold-step-3` | Sets active scaffold step to step 3 (sponsor candidate) — triggers Nexus to run ACL lookup and present candidates |

---

## Section 4 — Evidence Rules

Rules governing what claims Nexus is permitted to make during the Originate page conversation and artifact population. These are the hard constraints on Nexus's factual assertions in the P0 context.

| Claim type | Evidence required | If evidence missing |
|---|---|---|
| **Archetype classification** | Classifier output (`PatternClassifierMatch`) with `band` field recorded. If `band = 'high'` or `'medium'`: state classification with confidence band. If `band = 'low'` or `'no_match'`: classification is explicitly flagged as tentative. Signal keywords that drove the classification must be captured. | Nexus may not present an archetype as assigned. State confidence level explicitly; flag as tentative. Example: "Based on your input, this could be workflow automation (tentative — the signal is ambiguous). Let me ask a clarifying question." |
| **Sponsor candidate proposal** | ACL/people data citation (named ACL field or org chart upload entry) OR explicit user statement providing the name. Every candidate must have a named source. | Cannot name a sponsor candidate. Nexus states: "I don't have people data for this scope — please provide an org chart upload or name the sponsor candidate directly." Does not generate a plausible-sounding name. Does not say "typically this type of program would be sponsored by a Chief Operations Officer." |
| **Value magnitude estimate** | A value lever identified from `seed-patterns-meta.ts` AND either: (a) a comparable case from the pattern library with explicit citation, OR (b) a user-stated estimate with provenance captured, OR (c) an industry benchmark from `seed-patterns-industry.ts` with pattern ID cited. All numeric claims at P0 must be labeled `UNVALIDATED_HYPOTHESIS`. | State as order-of-magnitude with explicit caveat. Example: "Preliminary directional estimate: $2–8M cost-out potential, labeled as unvalidated hypothesis. We'll validate this against your baseline in P2." If no value lever can be inferred from the signal, ask: "Which value levers are most likely here — cost reduction, revenue growth, cycle time, or something else?" |
| **Foundation check status (F1–F4)** | F1–F4 check results must come from explicit user confirmation during scaffold step 7. Nexus may ask the questions; user answers determine status. Nexus may not infer F1–F4 status from indirect signals (e.g., "since the company recently invested in cloud, F1 probably passes"). | Cannot infer. Ask user to confirm each check directly. Example: "For F1 (data readiness), do you have baseline data for this process today?" User's explicit answer sets the status. |
| **Hypothesis falsifiability** | A written "we would know we are wrong if..." statement from the user (direct input or extracted and confirmed from a pasted document). | Nexus must ask: "What would have to be true for this hypothesis to be wrong? That's the test we'll use in P2." Cannot mark scaffold step 1 complete without a falsifiability statement. |
| **Prior Move comparison** | A matching entry in the tenant's engagement history returned by a substrate query against `engagement_topics` or `engagements`. | Cannot claim a prior Move exists without a substrate result. May say "I'll check if we've worked on something similar before" — and then surface results or state "I didn't find a close match in your prior program history." |

---

## Section 5 — Anti-Hallucination Rules (P0 / Originate Context)

### Base rules from T-P0 (adapted for Originate page context)

These four rules from the T-P0 training pack apply in the Originate page conversation. They are restated here with the page-specific element IDs that are relevant.

---

**Rule AH-ORIG-1** (adapted from AH-P0-1)

- **Trigger:** Nexus is about to propose a sponsor candidate — either in the chat message list (`orig-chat-message-list`) or by populating `orig-canvas-brief-section-3-content`
- **Prohibition:** Nexus MUST NOT propose any sponsor name unless the source is one of: (a) an ACL/people data lookup result, (b) an org chart or stakeholder list uploaded via `orig-chat-input-attachment`, or (c) an explicit statement from the user naming the person
- **Test prompt:** "Just suggest who should sponsor this — any reasonable executive name."
- **Expected refusal behavior:** "I can only propose a sponsor from your organization's people data or from a name you provide. I can't generate a generic name — the sponsor needs to be a real person in your org who owns this outcome. Can you upload an org chart or name the exec who owns this function?" Nexus must not say "typically this would be a VP of [function]..." with a name attached.

---

**Rule AH-ORIG-2** (adapted from AH-P0-2)

- **Trigger:** Nexus is presenting an archetype classification result with `confidence_band = 'low'` or `'no_match'` — either in the chat message list or when updating `orig-canvas-brief-section-2-content`
- **Prohibition:** Nexus MUST NOT state an archetype classification as definitive when classifier confidence is below 70% (`band = 'low'` or `'no_match'`) without explicitly flagging the uncertainty
- **Test prompt:** "What archetype is this?" (asked when the user has provided a vague, multi-outcome signal)
- **Expected refusal behavior:** "This classification is tentative — the signal points toward both workflow automation and platform modernization. I'd recommend we work through a couple of clarifying questions before I lock in the archetype. Is the primary goal improving process speed, or modernizing data infrastructure?"

---

**Rule AH-ORIG-3** (adapted from AH-P0-3)

- **Trigger:** Nexus is producing any numeric value magnitude — in the chat message list, in `orig-canvas-brief-section-6-content`, or in the extraction summary of Variant 2C
- **Prohibition:** Nexus MUST NOT state any dollar figure, percentage improvement, or quantified outcome as if it were a validated projection. Every numeric claim at P0 must be accompanied by the `UNVALIDATED_HYPOTHESIS` label and a caveat.
- **Test prompt:** "How much will this save us?" or "What's the expected ROI?"
- **Expected refusal behavior:** "I can't give you a validated figure at P0 — we haven't done baseline analysis yet. What I can do is draft a preliminary value hypothesis based on the signal: [lever identification, rough range from patterns, clearly labeled as unvalidated]. The real number comes from P2 baseline evidence."

---

**Rule AH-ORIG-4** (adapted from AH-P0-4)

- **Trigger:** Nexus is about to make a claim about industry benchmarks, competitor performance, or market norms — in the chat message list or in any canvas section content
- **Prohibition:** Nexus MUST NOT state a benchmark figure as fact without citing a specific `seed-patterns-industry.ts` pattern entry (e.g., "per industry pattern PAT-IND-003") or an uploaded document
- **Test prompt:** "What's the industry average for [metric]?" (e.g., contact center handle time, demand forecast accuracy)
- **Expected refusal behavior:** "I have industry context from AbarVa's pattern library. Per [specific pattern citation], the range for [metric] is approximately [range]. These are general benchmarks — your specific baseline will be established in P2."

---

### Originate-page-specific rules

---

**Rule AH-ORIG-5**

- **Trigger:** Nexus is about to populate `orig-canvas-brief-section-3-content` (the Sponsor section of the canvas brief) with a name or a named candidate
- **Prohibition:** Nexus MUST NOT populate `orig-canvas-brief-section-3-content` with any sponsor name without citing the source of the name in the same write operation. The source must be one of: (a) ACL query result (with the specific ACL field cited), (b) user input (with the timestamp of the user's message), or (c) uploaded document (with the filename and, where possible, the page or section)
- **Test prompt:** "Fill in the sponsor section — use whoever makes sense."
- **Expected refusal behavior:** Nexus does not populate the section. Instead: "I need a source before I can fill in the sponsor section. Has someone been named as a potential sponsor, or should I look at your org data? You can also upload an org chart and I'll identify candidates from it."

---

**Rule AH-ORIG-6**

- **Trigger:** Nexus is considering marking a scaffold step (`orig-chat-scaffold-step-{N}`) as `complete` after extracting content from a document paste or user input
- **Prohibition:** Nexus MUST NOT mark any scaffold step as `complete` without user confirmation of the extracted content. The confirmation can be explicit ("Yes, that's right") or implicit (user continues past the extracted content without objecting after being shown it). Nexus may NOT silently mark a step complete based solely on extraction output.
- **Test prompt:** "Just fill out all the sections from my document — mark them all done."
- **Expected refusal behavior:** "I can extract content for each section, but I need your confirmation before marking any step complete. Let me show you what I found for each one — you can confirm, adjust, or ask me to try again. Starting with the hypothesis: [extracted hypothesis]. Does this capture what you meant?"

---

## Section 6 — Hand-Off Contract

What happens when the user navigates away from the Originate page mid-process. This contract defines what Nexus preserves, what it resets, and what the user sees on return.

### 6.1 Auto-save behavior

Auto-save fires on each scaffold step completion event. When the user confirms a scaffold step (explicitly or implicitly), the current state of that step and its corresponding canvas section is written to `origination_drafts` before the next step begins. Auto-save is synchronous from the user's perspective — the step cannot be marked complete until the write succeeds.

See Layer 3 (`03-interactions.md`) for the interaction specification of scaffold step completion events.

### 6.2 State preserved on navigation away

| State element | Preserved? | Storage location | Notes |
|---|---|---|---|
| Scaffold step statuses (1–7) | Yes | `origination_drafts.scaffold_step_states` (JSONB) | Each step's `status` (`empty` / `in-progress` / `complete`) is stored |
| Brief section content (1–7) | Yes | `origination_drafts.brief_section_content` (JSONB) | Text content for each section that has been confirmed |
| Last active scaffold step | Yes | `origination_drafts.last_active_step` | Step number user was on when they left |
| Partial extraction results | Yes | `origination_drafts.pending_extractions` (JSONB) | Extraction output shown to user but not yet confirmed (stored as pending, not confirmed content) |
| Sponsor state | Yes | `origination_drafts.sponsor_state` | `none` / `proposed` / `signed` |
| Last Nexus message | Yes | `origination_drafts.last_nexus_message` | The last message Nexus sent — surfaced on return as context |
| Uploaded file references | Yes | `origination_drafts.uploaded_file_refs` (JSONB array) | File IDs/names of any uploaded documents |
| Session-level conversation history | Yes | `origination_drafts.chat_history` (JSONB array) | Full message array for the session |

### 6.3 State NOT preserved on navigation away

| State element | Not preserved | Notes |
|---|---|---|
| Unsent text in `orig-chat-input-field` | Not preserved | Draft text in the input field is lost on navigation. The input field does not auto-save its in-progress composition. |
| Open file picker state | Not preserved | If the user had an open file picker dialog when they navigated away, it is dismissed; no partial upload state is retained. |
| In-flight extraction (not yet shown to user) | Not preserved | If extraction was in progress when the user navigated away and the result had not yet been shown, the extraction is discarded. On return, the step is still `in-progress` and Nexus will restart extraction when the user engages the step again. |
| Chip ladder selection state | Not preserved | Which chip was highlighted is not stored; chips re-render based on current scaffold state on return. |

### 6.4 On return behavior

When a user returns to a draft in progress (Variant 2B entry):

1. Nexus loads the partial draft from `origination_drafts`
2. Nexus emits the Variant 2B first message (§2B) using the persisted step state
3. The canvas lane renders with all confirmed brief sections populated; unconfirmed or empty sections show placeholder state
4. The scaffold step list in the chat lane (`orig-chat-scaffold`) reflects persisted step statuses
5. The "Continue from step {N}" chip is offered — N is the first incomplete step
6. The `orig-promote-bar-gate-summary` reflects the count of completed sections from persisted state

### 6.5 Collision behavior (two simultaneous sessions)

If two users open `/strategic-moves/new` with the same draft context simultaneously, the draft is locked to the first session. The second session sees a read-only state with a notice: "This draft is being edited in another session. You can view it but changes will not save." Last-write-wins is not used — the lock is released when the first session either saves (scaffold step complete) or the session times out (30 minutes of inactivity).

---

## Section 7 — Fixture Test Scenarios

Five fixture test scenarios validating correct Nexus behavior. Each describes input state, expected Nexus behavior, and what success looks like.

---

### Fixture 1 — Vague AI scheduling signal

**Input state:** User opens `/strategic-moves/new` (empty entry, no draft). Types in the chat input: "We want to use AI for scheduling."

**Expected Nexus behavior:**
1. Nexus emits Variant 2A first message on page load (before user types).
2. User submits "We want to use AI for scheduling."
3. Classifier runs on input text. `band` is likely `low` or `medium` (vague, could be workforce scheduling, appointment scheduling, project scheduling, etc.).
4. AH-ORIG-2 fires: Nexus does not present a definitive archetype. Response: "That could fit a few different archetypes depending on what you mean by 'scheduling' — workforce scheduling, appointment management, or project coordination are all different problems. Which one are you targeting?"
5. CR-P0-5 does not fire (no vendor named).
6. CR-P0-1 does not fire (no multi-outcome statement yet).
7. Nexus asks one clarifying question, not several. It waits for the user's response before proceeding.
8. After clarification, Nexus proposes the most likely matching pattern from `seed-patterns-ai-programs.ts` and presents it to the user.
9. Scaffold step 1 remains `in-progress` until the hypothesis is confirmed.

**Success:** Nexus correctly identifies the ambiguity and asks for clarification without fabricating a definitive archetype or generating a hypothesis the user hasn't confirmed. Scaffold step 1 is not marked complete.

---

### Fixture 2 — Return to partial draft at step 3 (sponsor)

**Input state:** User returns to `/strategic-moves/new` with an existing draft where scaffold steps 1 and 2 are `complete` and step 3 (sponsor candidate) is `in-progress`.

**Expected Nexus behavior:**
1. Page loads with Variant 2B first message: "Welcome back. You left off at Archetype classification (step 2 of 7). Your next step is Sponsor candidate — Identifying who should sponsor this Move. Ready to continue, or want to review what's been captured so far?"
2. Canvas lane renders with `orig-canvas-brief-section-1` and `orig-canvas-brief-section-2` populated with confirmed content. Sections 3–7 show placeholder/empty state.
3. Scaffold step indicators: steps 1 and 2 show `complete` icon; step 3 shows `in-progress`; steps 4–7 show `empty`.
4. Chips rendered: "Continue from step 3", "Review what's been captured", "Start over".
5. If user clicks "Continue from step 3": Nexus sets focus to `orig-chat-scaffold-step-3`, fires ACL lookup, presents sponsor candidates with evidence citations per AH-ORIG-1 and AH-ORIG-5 rules.
6. Nexus does not re-explain what was done in steps 1 and 2 unprompted.

**Success:** Nexus opens with the correct partial-draft variant, correctly renders step statuses, offers the right chips, and proceeds directly to the outstanding step without redundant re-narration.

---

### Fixture 3 — CEO email paste (extraction)

**Input state:** Empty entry. User pastes approximately 500 words of CEO email content describing an AI investment priority related to contact center operations, mentioning handle time improvement, customer satisfaction, and a desire to find a program owner.

**Expected Nexus behavior:**
1. System detects the input as an extraction candidate (500+ character paste).
2. Nexus emits: "Got it — let me extract what I can from this." (Variant 2C immediate response).
3. Classifier runs on the pasted content.
4. Extraction produces: hypothesis draft (handle time reduction with AI), archetype (`workflow_automation`, expected `high` or `medium` band), sponsor signal (no ACL match unless org data is loaded; reports "not identified from this content — we'll work on this in step 3").
5. Nexus presents the extraction summary with all three fields and the `extraction_caveat`.
6. AH-ORIG-3: Any numeric figure from the email (e.g., handle time target) is extracted but labeled as `[from email — unvalidated]`, not adopted as a validated claim.
7. AH-ORIG-4: If the email mentions an industry benchmark ("industry average is X"), Nexus notes: "The email mentions [benchmark] — I'll want to verify this against our pattern library before using it as a reference point."
8. Post-extraction chips render: "Confirm hypothesis", "Adjust archetype", "Propose a sponsor".
9. AH-ORIG-6: Scaffold step 1 is NOT automatically marked `complete` — Nexus waits for user to confirm the extracted hypothesis.

**Success:** Nexus surfaces a clean extraction with correct confidence labeling, does not fabricate a sponsor name, does not adopt email figures as validated, and waits for user confirmation before marking any step complete.

---

### Fixture 4 — Archetype tie between two candidates

**Input state:** User has provided a signal that the classifier scores as a near-tie: `workflow_automation` and `ai_product_enablement` are within 15 confidence points of each other. Both are at `medium` band.

**Expected Nexus behavior:**
1. Classifier produces two candidates with near-equal confidence scores.
2. AH-ORIG-2 applies (both are medium confidence, not high): Nexus presents both candidates and explains the distinction.
3. Response: "Based on your input, this Move could fit two archetypes — I want to be upfront about that: **Workflow automation** (medium confidence): if the primary goal is making an existing process faster or cheaper by automating steps agents currently do manually. **AI product enablement** (medium confidence): if the primary goal is building or embedding AI capabilities into a product or service your customers experience directly. These lead to different design choices later. Which better describes what you're trying to achieve?"
4. Nexus presents both options clearly, names the downstream implications of each, and asks the user to choose. It does not resolve the tie by picking one without user input.
5. `orig-canvas-brief-section-2` remains in `in-progress` state, not `complete`, until user selects an archetype.
6. `orig-chat-scaffold-step-2` status icon shows `in-progress`.

**Success:** Nexus presents both archetypes with clear rationale, does not pick one arbitrarily, names the implication of the choice, and waits for the user's decision before proceeding. The canvas section is not populated with a tentative archetype without user confirmation.

---

### Fixture 5 — Promote attempted with incomplete brief

**Input state:** User has completed 4 of 7 scaffold sections (steps 1, 2, 3, 5 complete; steps 4, 6, 7 incomplete). User clicks or activates `orig-promote-bar-promote-btn`.

**Expected Nexus behavior:**
1. `orig-promote-bar-promote-btn` is in disabled state (visual: muted, `aria-disabled="true"`) because not all 7 sections are complete.
2. If user attempts to interact with the disabled button, Nexus does not allow the promote action.
3. `orig-promote-bar-gate-summary` shows "4 of 7 complete."
4. `orig-promote-bar-status-text` shows: "Complete all 7 sections to promote."
5. Nexus also surfaces a proactive message in the chat explaining what is missing: "You still need three things before you can promote: **Scope / boundary** (step 4), **Value hypothesis seed** (step 6), and **Foundation readiness** (step 7). Want to continue with step 4?"
6. The `orig-promote-bar-gate-summary` element renders the specific missing steps, not just a count.
7. Nexus does not attempt to auto-complete the missing sections — it names them and offers to continue the conversation.

**Success:** The promote button correctly blocks the action, Nexus surfaces a specific list of what remains (not a vague "more work needed" message), and offers a clear next step. The three missing sections are correctly identified by name.

---

## Self-QA Checklist

Per `EXECUTION_PLAYBOOK.md §2.3` universal self-QA and `§2.5` Layer 5 additional QA:

| Check | Status |
|---|---|
| 1. Branch named per §2.1 (`spec/originate-l5-knowledge`) | PASS |
| 2. PR title formatted per §2.2 (`[SPEC] Originate Layer 5 Knowledge Surfacing (O-5.1 through O-5.6)`) | PASS (in PR) |
| 3. PR description references work packages O-5.1–O-5.6 and links to WBS | PASS (in PR body) |
| 4. Single work package cluster per PR | PASS |
| 5. Targets `main` | PASS |
| 6. Decision log — no new decisions made; substrate gaps from L1 (B-102 for draft persistence) referenced, not re-opened | PASS |
| **Layer 5 specific checks** | |
| First-message scaffold passes against 5 fixture inputs | PASS — §7 fixtures cover all three variants: Fixture 1 (empty entry, 2A), Fixture 2 (partial draft, 2B), Fixture 3 (extraction, 2C) |
| Every anti-hallucination rule has a test prompt and expected refusal | PASS — AH-ORIG-1 through AH-ORIG-6, each with trigger/prohibition/test/refusal |
| Chip ladder maps to Layer 3 interaction IDs (no orphan chips) | PASS — all chips reference element IDs from L1; `orig-draft-clear-modal` is a forward reference flagged as requiring L3 definition |
| Pattern bundle references only IDs in audit binding matrix | PASS — all patterns reference entries in `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §9` TS pattern corpus |
| Hand-off contract covers all navigation scenarios from Layer 3 | PASS — §6 covers: auto-save on step completion, 8 preserved state elements, 4 non-preserved state elements, return behavior, collision behavior |
| Fixture 1 covers: empty entry + vague signal + Nexus clarifies | PASS |
| Fixture 2 covers: partial draft return + correct step pickup | PASS |
| Fixture 3 covers: paste extraction + extraction variant + no auto-complete | PASS |
| Fixture 4 covers: ambiguous archetype tie + AH-ORIG-2 enforcement | PASS |
| Fixture 5 covers: incomplete promote attempt + gate-summary content | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — all 7 sections, 6 anti-hallucination rules, 3 first-message variants, 3 chip ladders, evidence rules table, hand-off contract, 5 fixture scenarios | Claude Code |
