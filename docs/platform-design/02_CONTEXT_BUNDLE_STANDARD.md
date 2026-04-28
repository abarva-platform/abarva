# 02 · Context Bundle Standard

**Document:** The canonical specification of what every AbarVa agent must know before responding
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companion:** `00_AGENT_CENTRIC_MASTER_ANCHOR.md` and `01_PLATFORM_NORTH_STAR.md` (read first)
**Framework reference:** Section 6 of Agent-Centric Product Design Framework

This is the load-bearing document in the platform canon. The Context Bundle is the specific mechanism that separates AbarVa from vanilla GPT/Claude. Every other document in this canon depends on this specification being correct and complete.

## Why the Context Bundle matters

Vanilla generative AI responds to user prompts. The model reads the prompt, consults its training, produces text. The quality of the response depends on the quality of the prompt plus the quality of the model. Users who prompt well get useful output; users who prompt poorly get generic output.

AbarVa does not work this way. AbarVa agents assemble a structured package of facts about the user's current work before responding — the Context Bundle. The agent's response is grounded in this bundle, not in the user's prompt alone. A user who prompts poorly still gets a contextually-correct response because the agent knows what work is in motion, what evidence exists, what the workflow state is, what patterns apply.

The Context Bundle is the thing that makes AbarVa feel like it "already understands" when a user arrives at a surface. Without the Context Bundle, AbarVa is ChatGPT in enterprise clothing. With the Context Bundle, AbarVa is a genuine intelligence layer.

## The specific failure mode the Context Bundle prevents

A user asks: "What should I do next?"

**Without Context Bundle (generic AI):** Agent responds with generic project-management advice — consider your dependencies, break down the tasks, schedule a meeting. Generic and useless.

**With Context Bundle (AbarVa):** Agent knows the user is in Programs, on Meridian's Ambient Clinical program, at Phase 3 Diagnose, with two contradictions resolved and one open on payer mix, with Phase 4 gate blocked on CXO touchpoint 2 not yet scheduled. Agent responds: "Schedule touchpoint 2 with Dr. Chen by Thursday to hold Phase 4 start. Also — want me to draft the payer mix resolution first so you have it in hand for the touchpoint?"

Same prompt. Radically different response. The difference is the Context Bundle.

## Definition

A Context Bundle is a structured package of data that the agent assembles before composing any response on any surface. The bundle has eight canonical categories, each with required and optional fields. The bundle is assembled at the start of every agent turn and passed to Claude as structured context alongside the user's prompt.

The bundle is not a prompt-engineering trick. It is a deterministic data structure populated from the product's actual state. Every field in the bundle has a source — Postgres registry, graph store, vector retrieval, uploaded file, prior conversation turn. The agent does not invent fields; the agent retrieves them.

## The eight canonical categories

### Category 1 · Identity

Who is the user, what surface are they on, what permissions do they have.

**Required fields:**
- `tenant_id` — the client tenant (Meridian, Apex, First Capital, etc.)
- `tenant_name` — display name
- `tenant_industry` — healthcare / financial services / retail / cross-industry
- `user_id` — the authenticated user
- `user_role` — CIO / CMIO / CFO / sourcing lead / PMO / admin / etc.
- `user_persona` — mapping from user attributes to persona archetype per document 06
- `user_permissions` — what the user can read and modify within this tenant
- `route` — the current URL path
- `surface` — the canonical surface identifier (programs / source / intelligence / tower / admin)
- `session_start_time` — when this session began
- `request_timestamp` — when this specific turn is being processed

**Optional fields:**
- `user_preferences` — tone, format, interaction preferences
- `user_recent_activity` — work objects touched in prior sessions

**Source:** Authentication layer plus Postgres user registry plus route params.

**Validation:** Identity must always be present. An agent turn without Identity fields cannot proceed; it fails with explicit error stating which identity field is missing.

### Category 2 · Work Object

What specific work is the user currently engaged with.

**Required fields:**
- `work_object_type` — program / sourcing_event / pattern / tower_view / admin_context
- `work_object_id` — specific ID of the work object
- `work_object_name` — display name
- `work_object_owner` — who owns this work object
- `work_object_created_at` — when it was created
- `work_object_updated_at` — last modification timestamp

**For program work objects specifically:**
- `program_archetype` — Strategic Transformation / Workflow Automation / Platform Modernization / AI Product Enablement / Operational Optimization
- `program_phase` — Origination / Charter / Diagnose / Design / Execute / Verify
- `program_sponsor` — named sponsor (CXO equivalent)
- `program_modules_active` — which of the seventeen modules are active
- `program_shape_class` — Template / Pattern / Custom

**For sourcing event work objects specifically:**
- `sourcing_archetype` — AMS / Managed Services / Data & AI Modernization / Digital Build / etc.
- `sourcing_stage` — Intake / Scope / Strategy / RFP / Responses / Evaluation / Orals / Selection / Mobilization / Value Realization
- `sourcing_rigor_level` — Light / Standard / Enhanced / Strategic
- `sourcing_lifecycle_status` — Active / Waiting on Client / Waiting on Vendor / Waiting on Procurement / Waiting on Executive Decision / Paused / At Risk / Completed / Archived
- `sourcing_pattern_pack` — which pattern pack is driving this event

**For pattern work objects specifically:**
- `pattern_tier` — M / T1 / T2 / T3
- `pattern_vertical` — healthcare / financial-services / retail / cross-industry
- `pattern_status` — AUTHORED-DRAFT / AUTHORED-REVIEWED / AUTHORED-EXPERT / BATTLE-TESTED

**For tower view work objects:**
- `tower_view_scope` — portfolio / vendor / shadow_ai / regulatory / ai_council
- `tower_view_filters` — current filter state

**For admin context work objects:**
- `admin_context_scope` — users / connectors / audit / quality / patterns

**Source:** Postgres registry for the work object plus graph traversal to related objects.

**Validation:** When the user is on a surface that requires a specific work object (program detail, sourcing event canvas, pattern detail), Work Object fields must be present. The index/landing surfaces of each zone may have partial Work Object fields (e.g., Programs index has no specific program selected).

### Category 3 · Workflow State

Where is this work in its lifecycle and what is its current operational state.

**Required fields:**
- `current_stage_or_phase` — the canonical stage/phase identifier
- `lifecycle_status` — Active / Waiting / At Risk / Paused / Completed / etc.
- `readiness_score` — 0-100, how ready is this to advance
- `gates_status` — list of gates with individual status: cleared / blocked / awaiting_approval / not_yet
- `blockers` — list of specific blockers with description, owner, age
- `aging_days` — days since last meaningful state change
- `next_gate` — the next gate the work needs to pass
- `next_gate_requirements` — what needs to be true to clear the next gate
- `next_action_owner` — who owns the next action
- `next_action_due_date` — when the next action is expected

**Optional fields:**
- `stage_history` — prior stages with timestamps
- `gate_history` — gates previously cleared with approvers

**Source:** Workflow state machine in Postgres plus gate evaluation logic.

**Validation:** Workflow State must be present on all surfaces that show a specific work object. Accuracy here is non-negotiable — a phase mismatch between home card and program detail (as Marcus T flagged on April 24) is a platform-integrity failure.

### Category 4 · Business Context

Why this work matters and what business outcomes depend on it.

**Required fields:**
- `projected_value` — dollar amount with ranges (e.g., "$14-22M/yr") or explicit "not yet projected"
- `value_timeline` — when projected value is expected to realize
- `value_confidence` — HIGH / MEDIUM / LOW with explicit rationale
- `realized_value` — measured value if Phase 6 or equivalent has run, else null
- `realized_value_timestamp` — when measurement completed, if applicable
- `variance_to_projection` — delta between realized and projected, if applicable
- `variance_attribution` — scope / execution / external / measurement / combined, if applicable
- `business_sponsor` — named executive responsible for outcomes
- `business_objective` — the strategic objective this work serves
- `risks` — list of active risks with severity, owner, mitigation
- `assumptions` — underlying assumptions with confidence per assumption
- `decisions_pending` — decisions this work is gated on or is creating

**Optional fields:**
- `external_context` — market conditions, regulatory changes, competitive factors affecting this work
- `strategic_alignment` — which enterprise strategic initiatives this ties to

**Source:** Value Ledger plus risk registry plus decision registry plus program/event metadata.

**Validation:** Business Context should always have projected_value and value_confidence. Other fields populate as work progresses. An agent that does not surface value context on a work object is violating the "value-linked" principle.

### Category 5 · Artifacts

What deliverables, documents, RFPs, and work products exist for this work.

**Required fields:**
- `artifacts_list` — array of artifacts with minimum fields per artifact
  - `artifact_id`
  - `artifact_type` — Decision Memo / Business Case / Program Charter / RFP Package / Scope Document / Scorecard / Dual-Ledger / etc.
  - `artifact_status` — Not Started / Draft / Needs Inputs / Needs Review / Approved / Locked / Superseded / Archived
  - `artifact_tier` — Rich / Outline / Stub
  - `artifact_owner` — who authored this artifact
  - `artifact_version` — current version
  - `artifact_confidence` — HIGH / MEDIUM / LOW
  - `artifact_citations` — list of evidence citation IDs
  - `artifact_updated_at` — last modification
  - `artifact_missing_inputs` — list of inputs this artifact still needs

**Optional fields:**
- `artifact_prerequisites` — other artifacts that must be complete before this one activates
- `artifact_superseded_by` — if status is Superseded, which artifact replaces this one

**Source:** Artifact registry in Postgres.

**Validation:** Artifacts list should be present on all surfaces that show a specific work object. Empty array is valid (work object may have no artifacts yet). Missing field is a failure.

### Category 6 · Patterns

Which pattern-library patterns apply to this work and how.

**Required fields:**
- `applicable_patterns` — array of patterns relevant to this work, each with:
  - `pattern_id` — canonical pattern slug
  - `pattern_name` — display name
  - `pattern_tier` — M / T1 / T2 / T3
  - `relevance_score` — how strongly this pattern applies (0-100)
  - `match_reason` — textual reason the pattern matches
  - `pattern_sections_cited` — which sections of the pattern are being used (A-J per canonical template)
  - `pattern_confidence` — pattern-level confidence (AUTHORED-DRAFT / AUTHORED-REVIEWED / AUTHORED-EXPERT)
  - `pattern_observation_count` — how many observations this pattern has contributed

**Optional fields:**
- `pattern_contradictions` — patterns that contradict each other in this context
- `pattern_failure_modes_to_watch` — relevant failure modes from Section H of applicable patterns

**Source:** Vector retrieval against pattern library plus graph traversal for related patterns plus pattern registry for metadata.

**Validation:** Patterns should always have at least one applicable pattern surfaced, even if it's a meta-pattern (M1-M6). If no patterns match, agent must explicitly declare "no pattern match; responding from industry knowledge only."

### Category 7 · Evidence

What files, citations, uploaded documents, and external sources support this work.

**Required fields:**
- `evidence_base` — array of evidence items, each with:
  - `evidence_id` — canonical evidence identifier (E1, E2, ..., En per existing registry)
  - `evidence_type` — baseline / interview / document / model / benchmark / workshop / uploaded_file / external_reference
  - `evidence_summary` — brief description
  - `evidence_source` — where this came from
  - `evidence_timestamp` — when this evidence was collected or created
  - `evidence_confidence` — HIGH / MEDIUM / LOW
  - `evidence_citations_count` — how many times this evidence has been cited in artifacts
  - `evidence_url_or_ref` — where to find the underlying artifact

**For uploaded files specifically:**
- `file_parse_status` — pending / parsing / parsed / failed
- `file_parse_confidence` — HIGH / MEDIUM / LOW
- `file_extracted_context` — structured context extracted from the file
- `file_classification` — contract / spend_data / audit_report / presentation / other
- `file_attached_to` — which work objects this file is attached to

**Source:** Evidence registry in Postgres plus file parse pipeline results plus external source API.

**Validation:** Evidence Base should never be empty for a work object that has any artifacts. An artifact without cited evidence is a content failure (per Marcus T finding that D16 Business Case cited E51-E55 models that did not exist).

### Category 8 · Conversation

What has happened in this conversation so far and what the user is asking now.

**Required fields:**
- `conversation_id` — canonical session or thread identifier
- `conversation_turn_count` — which turn this is in the conversation
- `prior_turns` — array of prior turns with user prompts and agent responses
- `user_prompt_current` — the current user prompt
- `user_intent_normalized` — system's best interpretation of what the user is asking
- `suggested_actions_prior` — any suggested actions from the prior turn
- `user_selected_suggestion` — if the current turn came from a suggested-action click rather than freeform

**Optional fields:**
- `conversation_context_tags` — topic tags that thread through the conversation
- `user_feedback_signals` — thumbs up/down on prior turns

**Source:** Conversation log in Postgres scoped to this session.

**Validation:** Conversation fields must be present for any agent response. First turn has empty prior_turns but still has conversation_id and other fields.

## Context quality scoring

Every Context Bundle assembled for every agent turn gets scored across six dimensions. The score is metadata on the bundle; agents read the score and adjust response tone accordingly.

### Dimension 1 — Context Completeness

How many of the required fields across the eight categories are populated?

**Score:** Percentage of required fields populated (0-100)

**Threshold interpretations:**
- 90-100% — Complete. Agent can respond with confidence.
- 70-89% — Substantially complete. Agent responds with minor caveats on what's missing.
- 50-69% — Partial. Agent responds with explicit disclosure of gaps and distinguishes event-specific claims from pattern-level guidance.
- Below 50% — Thin. Agent responds only at pattern-level, explicitly declines to make event-specific claims, and names what would be needed to improve confidence.

### Dimension 2 — Pattern Grounding

Does the response claim have pattern backing?

**Score:** 
- 3 = Direct pattern citation with AUTHORED-EXPERT or BATTLE-TESTED tier
- 2 = Pattern citation with AUTHORED-REVIEWED tier
- 1 = Pattern citation with AUTHORED-DRAFT tier
- 0 = No pattern citation

**Threshold:** Score of 0 requires agent to explicitly declare "no pattern match; responding from industry knowledge."

### Dimension 3 — Evidence Coverage

What files, citations, or measured evidence support the response?

**Score:**
- 3 = Multiple direct citations with HIGH confidence evidence
- 2 = Direct citations with mixed confidence
- 1 = Indirect evidence reference
- 0 = No evidence reference

**Threshold:** Score of 0 on a response that makes specific claims (dollar amounts, percentages, named vendors) is a failure. Agent must refuse to make specific claims without evidence or explicitly label the claim as "authored from industry knowledge, not measured."

### Dimension 4 — Workflow Awareness

Did the response account for stage, gate, status, owner, and blocker?

**Score:**
- 3 = Response explicitly references current stage/phase, blockers, next action, owner
- 2 = Response references stage/phase and next action
- 1 = Response references stage only
- 0 = Response is workflow-agnostic

**Threshold:** Score of 0 on a surface that has a specific work object (program detail, sourcing event canvas) is a failure. Agent responses on these surfaces must be workflow-aware.

### Dimension 5 — Actionability

Does the response include a clear next action?

**Score:**
- 3 = Specific action with named owner and timing
- 2 = Specific action without full detail
- 1 = General suggestion
- 0 = No action surfaced

**Threshold:** Score below 2 is a failure for any response on a workflow surface. The five-question test requires "What should I do next?" to be answered.

### Dimension 6 — Vanilla-Response Risk

Could this response have been written without AbarVa context?

**Score:**
- 3 = Response uses specific tenant/work object facts that only AbarVa has
- 2 = Response uses AbarVa-specific pattern or evidence
- 1 = Response is AbarVa-flavored but mostly generic
- 0 = Response could have come from vanilla GPT/Claude

**Threshold:** Score below 2 is a failure on any substantive response. Response must either be rewritten with AbarVa context or explicitly labeled as pattern-level guidance.

## How agents read the Context Bundle score

The score is not decorative. Agents adjust response behavior based on score per these rules.

**High completeness, high evidence (completeness 90+, evidence 2+):** Agent responds authoritatively with specific claims, specific dollar amounts, specific named entities. Voice contract operates at full confidence.

**Medium completeness, medium evidence (completeness 60-89, evidence 1):** Agent responds with explicit confidence qualifiers ("based on what I can see"), distinguishes known facts from inferences, surfaces what's missing.

**Low completeness (completeness below 60):** Agent responds at pattern level only, explicitly declines event-specific claims, names what specific data would unlock event-specific response.

**Zero evidence coverage:** Agent explicitly states "no evidence base for this claim" and either refuses the claim or labels it as "authored from industry knowledge."

**High vanilla-response risk (score 0-1):** Agent response is rejected at composition time. Response must be regenerated with additional context or the query must be redirected.

## The Context Bundle lifecycle per turn

Per-turn assembly follows this sequence. Runs before Claude is invoked.

**Step 1 — Identity resolution.** Authentication layer provides user_id and user_role. Route params provide route and surface. Populate Identity category.

**Step 2 — Work object resolution.** Route params plus user context identify the specific work object. Load work object from Postgres. Populate Work Object category.

**Step 3 — Workflow state hydration.** Read current stage, gates, blockers, next action from workflow state machine. Populate Workflow State category.

**Step 4 — Business context loading.** Join work object to Value Ledger, risk registry, decision registry. Populate Business Context category.

**Step 5 — Artifacts listing.** Query artifact registry for all artifacts attached to the work object. Populate Artifacts category.

**Step 6 — Pattern retrieval.** Execute vector retrieval against pattern library using work object as seed. Graph traversal for related patterns. Populate Patterns category.

**Step 7 — Evidence retrieval.** Query evidence registry plus uploaded-file index. Populate Evidence category.

**Step 8 — Conversation assembly.** Load prior turns for this session. Populate Conversation category.

**Step 9 — Quality scoring.** Compute completeness, pattern grounding, evidence coverage, workflow awareness, actionability, vanilla-response risk scores. Attach to bundle.

**Step 10 — Claude invocation.** Pass bundle plus user prompt to Claude in structured format. Claude composes response grounded in bundle.

**Step 11 — Response assembly.** Response rendered with citations, context-used indicators, confidence chips, suggested actions.

**Step 12 — Logging.** Bundle, scores, response, feedback signals logged for observability and pattern feedback loops.

## UI rendering of Context Bundle

The Context Bundle is internal. But certain elements surface to the user as part of trust and transparency.

**Context-used indicators.** When a response cites specific files or patterns, the UI shows "Based on: [file name], [pattern name]" inline or in a disclosure panel. Users see what the agent used.

**Confidence chips.** HIGH / MEDIUM / LOW chips on substantive claims. Derived from Context Bundle quality scores.

**Honest-disclosure banners.** When completeness is low or evidence coverage is zero, the response opens with an explicit disclosure: "Evidence on this is thin" or "Pattern-level guidance; not yet measured."

**Missing-input indicators.** When a response declines to make specific claims due to missing context, the UI shows specifically what's missing with a call-to-action to provide it.

**Vanilla-response warnings.** If a response is generated with vanilla-response risk score below 2 (test-time detection, not production), a warning appears in logs. Users should never see a response with this risk level; the composition layer should have rejected it.

## The canonical failure mode this document prevents

A user asks Atlas on Tower: "What's the biggest risk right now?"

**Without Context Bundle:**
> "Based on general AI governance patterns, the biggest risks usually involve shadow AI proliferation, unowned compliance, and vendor concentration. You should review your governance framework."

Generic. Useless. Indistinguishable from ChatGPT.

**With Context Bundle (Meridian tenant, Tower surface, Atlas agent):**
> "The ambient documentation overlap at $522K/mo is your most rationalizable risk — three tools, one workflow, clear decision. But the AI cloud spend trajectory is more urgent: you're on pace to $2.4M/mo by Q3 without guardrails, and that hits CFO review in 30 days. Address the governance gap first, then the ambient overlap becomes the natural follow-on."

Specific. Actionable. Grounded in the tenant's actual pressure cards, dollar amounts, timelines. Could not have been written by vanilla AI because the vanilla AI does not know the tenant's specifics.

The Context Bundle is what turns the first response into the second. Without it, the product is vanilla. With it, the product is defensible IP.

## Enforcement

This document is enforced at three layers:

**Runtime layer.** The per-turn contract (document 03 and design canon file 08) requires Context Bundle assembly before Claude invocation. A turn that skips bundle assembly fails at the runtime layer.

**Response composition layer.** Responses are evaluated against bundle quality scores at composition time. Low-quality responses get rejected and regenerated or return explicit error.

**Persona crawler layer.** Crawler personas (document 06) run golden prompts against the product. Responses that produce vanilla-response scores below threshold fail the crawler test.

All three layers must pass for a turn to reach the user.

## Anti-patterns

Specific violations that must not occur in implementation.

**The skipped-bundle anti-pattern.** Agent responds directly to user prompt without assembling the Context Bundle. Indicates runtime layer failure or developer bypass.

**The empty-bundle anti-pattern.** Bundle is assembled but has minimal fields populated because the data is simply not there. Agent responds as if bundle is complete. This is the silent-failure anti-pattern from document 00; agent must declare incomplete bundle explicitly.

**The invented-field anti-pattern.** Agent response references a bundle field that is actually null or absent. Agent should treat null fields as absent and respond accordingly, not imagine their values.

**The context-theater anti-pattern.** UI renders "context used" indicators for data the agent did not actually cite. Creates false trust in transparency mechanism.

**The stale-bundle anti-pattern.** Bundle assembled at session start used for multiple turns without refresh. Bundle must refresh per turn because work object state changes.

**The quality-score-ignored anti-pattern.** Bundle scored as thin but response composed as if complete. Response composition layer must honor the quality scores.


## GPT refinement addendum · Context Bundle implementation hardening

The Context Bundle is the load-bearing runtime object for AbarVa. It should be treated as a **required precondition for agent speech**, not an optional enhancement.

### Required context bundle states

Every agent turn should classify the Context Bundle into one of five states:

| State | Meaning | Agent behavior |
|---|---|---|
| `complete` | Enough context exists for event/work-object-specific guidance | Answer directly with context used and next action |
| `usable_with_gaps` | Context is sufficient but important fields are missing | Answer with caveats, list missing inputs, and provide next action |
| `pattern_only` | Work-object data is thin, but pattern guidance applies | Label answer as pattern guidance, not event-specific advice |
| `insufficient` | Required context is missing | Ask for missing context or offer guided choices |
| `blocked` | Policy, permission, tenant, or evidence boundary prevents answer | Refuse the specific action and explain what is needed |

### Minimum context by response type

Different responses require different context minimums:

| Response type | Minimum required context |
|---|---|
| Dashboard alert | tenant, surface, work-object list, status, owner/aging/next action |
| Stage guidance | work object, stage, lifecycle status, gates, missing inputs, risks |
| Artifact recommendation | artifact status, required inputs, source data, tier rules |
| Scorecard guidance | archetype, default weights, overrides, approval/lock state |
| Value guidance | value ledger, assumptions, owner, confidence, evidence state |
| File-specific answer | file summary, parse status, citation or extract reference |
| Executive synthesis | work object(s), value, risks, decisions, evidence confidence |

If the minimum context is absent, the agent must not produce an event-specific answer.

### Context freshness

Every Context Bundle should eventually include freshness metadata:

- when event state was loaded
- when pattern sections were retrieved
- when uploaded files were parsed
- when scorecard/value/artifact states were last updated
- whether any source is stale

A stale context should not block every answer, but it should change the confidence label and recommended action.

### Context provenance

The bundle should preserve the origin of each major fact:

- deterministic database field
- uploaded file extract
- pattern-library section
- user-entered prompt
- prior conversation turn
- model inference
- manual override

This enables the UI to render "Context used" and prevents model output from being mistaken for stored truth.

### Context Bundle acceptance criteria

An implementation of this standard is acceptable only when:

1. Every work-object-specific agent route requires context assembly before model invocation.
2. Missing context is represented structurally, not hidden in prose.
3. The UI can render what context was used.
4. The validation harness can score context grounding.
5. Agents can downgrade to pattern-only guidance when event data is missing.
6. Agents cannot claim evidence they did not receive.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with markups on field definitions
2. Revisions integrated
3. Cross-check against document 03 (Page-Level Agent Contracts) for consistency
4. Cross-check against design canon file 08 (per-turn contract) for runtime implementation alignment
5. Explicit founder sign-off

This is the load-bearing document. Errors here propagate to every agent turn on every surface. Thoroughness of review matters.


## Runtime integration note · Cycle 4 revision

**Added:** Cycle 4 canon revision session · April 24, 2026
**Addresses:** Conflict C8 from canon-vs-existing cross-check documented
in commit `1653852`

This section clarifies how the Context Bundle's 12-step per-turn
lifecycle integrates with the existing runtime implementation in `src/`
and its specification in `docs/specs/platform/runtime-contracts/orchestrator.md`.

### The existing 6-phase pipeline

The existing `runPipeline()` function in the orchestrator has six
phases: `parse` → `plan` → `retrieve` → `assemble` → `compose` → `render`.
These six phases govern the lifecycle of every agent turn as currently
implemented.

### Relationship to the 12-step bundle lifecycle

The Context Bundle's 12-step lifecycle specified earlier in this
document is **not a replacement** for the existing pipeline. It is a
detailed contract for what happens specifically inside the `retrieve`
and `assemble` phases of `runPipeline()`, and for the specific inputs
Claude must receive in the `compose` phase.

**Phase-to-step mapping:**

| Existing pipeline phase | Bundle lifecycle steps that execute here |
|---|---|
| `parse` | Step 1 (Identity resolution uses parsed authentication/route context) |
| `plan` | Step 9 (Quality scoring informs response planning) |
| `retrieve` | Steps 2 through 8 (Work Object / Workflow State / Business Context / Artifacts / Patterns / Evidence / Conversation retrieval) |
| `assemble` | Steps 9 through 10 (Quality scoring attached; bundle assembled for Claude) |
| `compose` | Step 10 continued (Claude invocation with structured bundle) |
| `render` | Step 11 (Response assembly with citations and indicators) |
| (post-pipeline) | Step 12 (Logging) |

### Implementation guidance for C4-D01

C4-D01 (Context Bundle 5-state runtime implementation) adds Context
Bundle assembly as explicit behavior inside the existing `retrieve` and
`assemble` phases. It does not rewrite `runPipeline()`. Implementation
work:

1. Add bundle assembly functions callable from `retrieve` phase — one
   per bundle category (Identity, Work Object, Workflow State, Business
   Context, Artifacts, Patterns, Evidence, Conversation)
2. Add bundle quality scoring in `assemble` phase — compute the 6
   dimensions plus the 5-state classification
3. Extend Claude invocation in `compose` phase to pass the structured
   bundle alongside the user prompt
4. Extend response rendering in `render` phase to surface context-used
   indicators and confidence qualifiers derived from bundle quality
   scores

The existing 6-phase pipeline remains the outer structure. The bundle
lifecycle is the inner contract for what specifically happens during
`retrieve` + `assemble`.

### Failure mode this prevents

This wrap-not-replace decision prevents Failure Mode F9.3 (implementation
without spec). If the new canon contradicted existing runtime,
implementation would require either rewriting `runPipeline()` from
scratch or accepting spec-drift. Neither is acceptable. Wrapping
preserves working infrastructure while adding the bundle-specific
behavior the canon requires.
