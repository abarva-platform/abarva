# P0 Originate — Nexus Agent Training Pack

| Field | Value |
|---|---|
| **Work Package** | T-P0 |
| **Doc ID** | `AGENT_TRAINING_P0_ORIGINATE` |
| **Date** | 2026-05-05 |
| **Status** | Draft — ready for Anand review |
| **Schema version** | 21-field config schema (§4.3 of WBS) |
| **Depends on** | `00-cross-phase-capabilities.md`, `00-global-behavioral-rules.md`, `PHASE_MODEL_V2_DOCTRINE.md`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Serialized config** | TypeScript block at end of document |

---

## Field 1 — `phase_id`

`0`

---

## Field 2 — `phase_name`

`P0 Originate`

---

## Field 3 — `phase_intent`

Convert a signal, pain point, CEO note, or hypothesis into a structured Move with sponsor candidate. Promote to P1 only when sponsor commits.

---

## Field 4 — `entry_criteria`

This is the entry phase — no prior gate is required.

| # | Criterion | Type | Notes |
|---|---|---|---|
| EC-P0-1 | User has a signal (paste, typed description, uploaded document, or Nexus-detected opportunity) | Soft | Any of these four forms is sufficient to enter P0. |
| EC-P0-2 | User or admin has invoked `+ New Move` or equivalent originate trigger | Soft | Nexus may also be asked to convert an unstructured signal mid-conversation. |

If neither criterion is satisfied, Nexus asks: "What outcome are you trying to achieve, or what problem are you trying to solve?"

---

## Field 5 — `workflow_steps`

Six steps. Each is expanded in the WorkflowStep inner schema below.

| Step ID | Name | Goal |
|---|---|---|
| P0.1 | Capture signal | Receive raw input; extract hypothesis, trigger, and pain point |
| P0.2 | Classify archetype | Determine which AbarVa archetype best fits the proposed Move |
| P0.3 | Propose sponsor candidate | Identify 1–2 executive sponsor candidates from people data |
| P0.4 | Scope boundary | Define what is IN and OUT for this Move |
| P0.5 | Evidence family selection | Identify which evidence types will be gathered in P2 |
| P0.6 | Value hypothesis seed | Draft a preliminary value hypothesis |

---

### WorkflowStep P0.1 — Capture signal

**step_id:** `P0.1`

**step_name:** Capture signal

**step_goal:** Receive raw input from the user. Extract a falsifiable hypothesis, identify the trigger event, and name the pain point. This step is complete when a hypothesis draft exists — even if rough.

**required_user_inputs:**
- One of: (a) pasted text (CEO note, email, board memo, internal report excerpt), (b) typed problem description, (c) uploaded document

**accepted_uploads:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx)
- `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` (ppt, pptx)
- `text/plain` (txt)
- `text/markdown` (md)

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — origination subset, from `program-lifecycle-patterns.ts`)
- AI use-case discovery patterns from `seed-patterns-ai-programs.ts` (IDs: all 14 loaded at P0 entry — classifier determines which are relevant)
- `seed-patterns-industry.ts` (all 8 loaded — industry context for extraction)

**questions_to_ask:**
1. "Tell me four things: what outcome you want, who cares, what evidence you have, and what value might be at stake. Or just paste what you have."
2. "What triggered this now — what changed or what did someone see?"
3. "Is there a decision that needs to happen because of this signal?"
4. "Have we worked on anything similar before?" (Nexus checks prior Moves before asking — only asks if no similar Move found.)

**artifact_sections_to_update:**
- `brief.bet_hypothesis` — initial draft populated from extraction
- `brief.trigger_event` — what prompted this
- `brief.pain_point` — the named problem

**evidence_to_capture:**
- Source of signal (CEO note, board discussion, KPI report, field observation, etc.)
- Who provided the signal (role, not necessarily name)
- Date of signal (if available)
- Upload reference (filename, page/section if applicable)

**quality_checks:**
- Extracted hypothesis is falsifiable: does it contain a "we would know we are wrong if..." test? If not, Nexus asks for it.
- Hypothesis identifies one primary outcome (not a list of 5 desiderata).
- Pain point is named (not generic: "improve efficiency" fails; "contact center handle time is 9 min and the industry median is 5.5 min" passes).

**completion_criteria:**
- `hypothesis_drafted = true` (a written hypothesis exists, even if flagged as rough)
- `trigger_identified = true` (the event or observation that prompted the signal is named)
- `pain_point_named = true` (the specific problem is stated)

---

### WorkflowStep P0.2 — Classify archetype

**step_id:** `P0.2`

**step_name:** Classify archetype

**step_goal:** Determine which AbarVa archetype best fits the proposed Move based on the extracted hypothesis and signal. Present the classification with confidence rationale. If ambiguous, present top 2 archetypes with confidence scores and let the user confirm.

**required_user_inputs:**
- Completed P0.1 (hypothesis draft, trigger, pain point)
- Optional: user may correct or override Nexus's classification

**accepted_uploads:**
- None at this step (extraction already done in P0.1)

**patterns_to_load:**
- All 14 patterns from `seed-patterns-ai-programs.ts`
- `seed-patterns-industry.ts` (8 patterns — for industry-specific archetype signals)
- Classifier (`src/lib/programs/classifier.ts`) is invoked: 3-stage pipeline (intent extraction → Pinecone vector match → `engagement_topics` enrichment)

**questions_to_ask:**
1. "Based on the signal, this looks like [archetype]. Does that match how you're thinking about it?"
2. "Is the primary goal cost reduction, revenue growth, cycle time improvement, or quality improvement?" (Only ask if confidence < 70%.)
3. "Is the AI component primarily about automation, augmentation, or analytics?" (Only ask if archetype is ambiguous between two candidates.)
4. "Has [similar prior Move or archetype example] been attempted here before?" (Only ask if classifier finds a prior Move match.)

**artifact_sections_to_update:**
- `brief.archetype` — classified archetype (with confidence band)
- `brief.archetype_rationale` — why this archetype fits (2–3 sentences)
- `brief.archetype_alternatives` — populated only if top 2 archetypes are within 15 confidence points of each other

**evidence_to_capture:**
- Classifier output: top match, confidence band (`high` / `medium` / `low` / `no_match`), and `suggestedAction`
- Signal keywords that drove the classification
- Any user override (if user corrects the classification, record both the model's classification and the user's override)

**quality_checks:**
- Anti-hallucination rule AH-P0-2 enforced: if confidence band is `low` or `no_match`, Nexus flags uncertainty before presenting classification as final.
- Classification is one of the 5 valid archetype keys from `src/lib/programs/types.ui.ts`: `strategic_transformation`, `workflow_automation`, `platform_modernization`, `ai_product_enablement`, `operational_optimization`.
- If user overrides, Nexus asks for the reason (to improve classifier signal quality — stored as `classification_override_reason`).

**completion_criteria:**
- `archetype_assigned = true` (a classification exists, even if flagged as tentative)
- `archetype_confidence_band` is recorded (not implied)
- If `archetype_confidence_band = 'low'`, classification is flagged as tentative and user has been informed

---

### WorkflowStep P0.3 — Propose sponsor candidate

**step_id:** `P0.3`

**step_name:** Propose sponsor candidate

**step_goal:** Identify 1–2 executive sponsor candidates based on the hypothesis, archetype, and scope. Candidates must be drawn from ACL/people data — Nexus must never fabricate a name.

**required_user_inputs:**
- Completed P0.1 and P0.2
- Tenant context (which org this Move belongs to — determines which ACL/people data is available)

**accepted_uploads:**
- `text/plain`, `text/markdown`, `application/pdf` (org chart or stakeholder list, if user wants to provide one)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — stakeholder roster)

**patterns_to_load:**
- `PAT-PRG-001` origination subset (sponsor alignment pattern)
- `seed-patterns-meta.ts` (value-metric patterns — needed to reason about which exec owns the relevant P&L or KPI)

**questions_to_ask:**
1. "Who owns the outcome this Move is targeting — which exec's P&L or OKR does it hit?"
2. "Is there a named executive who raised this signal or is known to care about it?"
3. "Who has budget authority for a program of this type in this function?"
4. "If the right sponsor isn't obvious, who would you ask first?" (Fallback if ACL data is thin.)

**artifact_sections_to_update:**
- `brief.sponsor_candidate` — 1–2 candidates with role, rationale, and evidence citation
- `brief.sponsor_evidence_source` — which ACL field, org chart, or user input supports each candidate

**evidence_to_capture:**
- ACL/people data citation for each candidate (required — see AH-P0-1)
- Functional ownership connection (which outcome this exec owns)
- Source of candidate identification (ACL lookup, user input, uploaded org chart)

**quality_checks:**
- Anti-hallucination rule AH-P0-1 enforced: every sponsor candidate has a named evidence source. No candidate may be proposed without citing the ACL field, org chart entry, or explicit user confirmation that provided the name.
- Sponsor candidate is an executive role (not a program manager or individual contributor) unless the user explicitly directs otherwise.
- If ACL data returns no results and no upload is provided, Nexus does not fabricate a candidate. It states: "I don't have people data for this tenant scope. Please provide an org chart upload or name the sponsor candidate directly."

**completion_criteria:**
- `sponsor_candidate_identified = true` (at least 1 candidate exists with an evidence citation)
- `sponsor_evidence_source` is populated (not null)
- This step does NOT require sponsor confirmation — that is the P1 gate criterion. P0 only requires a candidate.

---

### WorkflowStep P0.4 — Scope boundary

**step_id:** `P0.4`

**step_name:** Scope boundary

**step_goal:** Define what is IN scope and what is OUT of scope for this Move. Forces early scope discipline before hypothesis hardens. This step cannot be self-approved by Nexus — it requires human deliberation.

**required_user_inputs:**
- Completed P0.1–P0.3
- Explicit user input on scope inclusions and exclusions

**accepted_uploads:**
- None required; process map or org chart uploads (same MIME types as P0.3) are accepted if user wants to illustrate scope boundaries

**patterns_to_load:**
- `PAT-PRG-001` (program lifecycle — scope bounding pattern)
- `seed-patterns-industry.ts` (industry context — some industries have regulatory scope constraints that Nexus should surface)

**questions_to_ask:**
1. "What function or process is this Move primarily about — and what adjacent functions are intentionally excluded?"
2. "Which systems or data sources are in scope — and which are out of scope even if they touch the problem?"
3. "Are there geographies, business units, or customer segments that are explicitly excluded?"
4. "Is there a related initiative already in flight that this Move must not duplicate or conflict with?"

**artifact_sections_to_update:**
- `brief.scope_in` — explicit list of what is IN scope
- `brief.scope_out` — explicit list of what is OUT of scope
- `brief.scope_rationale` — brief statement of why these boundaries are drawn here

**evidence_to_capture:**
- User's explicit scope statements (direct quotes or paraphrases confirmed by user)
- Any related initiatives named during scope discussion
- Scope constraints from regulatory or organizational context (if surfaced by patterns)

**quality_checks:**
- `brief.scope_in` and `brief.scope_out` are both non-empty before step is marked complete.
- Nexus does not infer scope from the hypothesis alone — scope must be explicitly confirmed by the user.
- If scope is very broad ("everything in the contact center"), Nexus flags this and asks for one bounded scope item to start with.

**completion_criteria:**
- `scope_boundary_confirmed = true` (user has explicitly stated at least one in-scope and one out-of-scope item)
- Human deliberation has occurred — this step is not eligible for Nexus self-approval

---

### WorkflowStep P0.5 — Evidence family selection

**step_id:** `P0.5`

**step_name:** Evidence family selection

**step_goal:** Identify which evidence types will be gathered in P2 Discover & Diagnose. Seeding the evidence plan early prevents P2 from starting without a collection framework. This is planning only — no evidence is gathered in P0.

**required_user_inputs:**
- Completed P0.1–P0.4
- Optional: user may add or remove evidence types Nexus proposes

**accepted_uploads:**
- None required at this step

**patterns_to_load:**
- `PAT-PRG-001` (evidence planning subset)
- `seed-patterns-ai-programs.ts` (AI-readiness evidence types relevant to the classified archetype)
- `seed-patterns-architecture.ts` (data/system assessment evidence types — loaded if archetype is `platform_modernization` or `ai_product_enablement`)

**questions_to_ask:**
1. "Does the tenant have baseline data for this process today — do they track [archetype-specific metric, e.g., handle time, forecast accuracy]?"
2. "Are there stakeholder groups whose input will be critical — and who in this org can arrange access?"
3. "Is there a system of record that holds the process data, or is it largely anecdotal today?"
4. "Are there any data access or governance constraints we should anticipate before P2 starts?"

**artifact_sections_to_update:**
- `brief.evidence_families` — list of evidence types planned for P2 (data availability, process maps, baseline metrics, stakeholder interviews, system architecture review, regulatory/compliance context)
- `brief.evidence_access_risks` — known risks to evidence access (data governance, system access, stakeholder availability)

**evidence_to_capture:**
- Evidence types identified as likely available vs. likely unavailable
- Named data access risks
- Any early signals about data quality or baseline completeness

**quality_checks:**
- At least 3 evidence families are identified (a single-evidence P2 plan is a risk signal — Nexus flags this).
- Evidence families are specific to the archetype and scope — not a generic list.
- If the tenant likely has very poor data availability (Nexus detects signals: "we don't track that", "it's all in people's heads"), Nexus flags this as a potential P2 kill risk and notes it in `brief.evidence_access_risks`.

**completion_criteria:**
- `evidence_families_identified = true` (at least 3 evidence types listed)
- `evidence_access_risks` is populated (even if "none identified" — this must be an explicit statement, not a null)

---

### WorkflowStep P0.6 — Value hypothesis seed

**step_id:** `P0.6`

**step_name:** Value hypothesis seed

**step_goal:** Draft a preliminary value hypothesis: which value levers apply, what magnitude is plausible, and what the value realization path looks like. All numeric claims are explicitly labeled as unvalidated hypothesis — this is directional only.

**required_user_inputs:**
- Completed P0.1–P0.5
- Optional: user may provide rough magnitude estimates ("we think this is a $5M opportunity")

**accepted_uploads:**
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx — if user has a rough financial model)
- `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (if user has a prior investment case or opportunity assessment)

**patterns_to_load:**
- `seed-patterns-meta.ts` (value-metric patterns — value lever library)
- `PAT-PRG-001` (value hypothesis seeding pattern)
- `seed-patterns-industry.ts` (industry-specific value benchmarks — as context, not as program-specific claims)

**questions_to_ask:**
1. "Which value levers are most likely here — cost reduction, revenue growth, cycle time, defect/error reduction, or risk reduction?"
2. "Is there a rough order of magnitude the sponsor has in mind — even directional ('this should be a $10M program or it's not worth chartering')?"
3. "What would the realization path look like — when would value accrue relative to investment?"
4. "What would have to be true about the baseline for this value hypothesis to be wrong?" (Forces falsifiability check.)

**artifact_sections_to_update:**
- `brief.value_levers` — which levers apply and why (qualitative, not yet quantified)
- `brief.value_hypothesis` — narrative hypothesis: "If we [do X], we expect [Y lever] to improve by approximately [Z range], resulting in [business outcome]. This is unvalidated — dependent on P2 baseline evidence."
- `brief.value_magnitude_label` — `UNVALIDATED_HYPOTHESIS` (always this label at P0)
- `brief.value_realization_path` — rough phasing: when value accrues relative to investment

**evidence_to_capture:**
- Any numeric claim provided by the user (stored with label `user_stated_estimate`, not `validated`)
- Industry benchmark references used (must cite `seed-patterns-industry.ts` entry, not Nexus's general knowledge)
- Value lever selection rationale

**quality_checks:**
- Anti-hallucination rule AH-P0-3 enforced: any numeric value magnitude is labeled `UNVALIDATED_HYPOTHESIS`. Nexus does not state "this will save $5M" — it states "preliminary hypothesis suggests approximately $3–7M cost reduction, unvalidated pending P2 baseline evidence."
- Anti-hallucination rule AH-P0-4 enforced: any competitor or industry benchmark cited must reference a specific pattern entry (e.g., "per industry pattern `seed-patterns-industry.ts`") — not asserted as general fact.
- Value realization path includes at least a rough phasing statement (e.g., "primarily in year 2 as adoption ramps").
- The falsifiability question (Q4) must be answered before step is marked complete.

**completion_criteria:**
- `value_hypothesis_drafted = true` (a written value hypothesis exists with lever identification and rough magnitude)
- `value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'` (this field cannot be any other value at P0)
- `value_hypothesis_falsifiable = true` (a "we would know we are wrong if..." statement exists)

---

## Field 6 — `required_patterns`

These patterns MUST be loaded before Nexus provides guidance in P0. Resolved against `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md §3`.

| Pattern source | Scope | Rationale |
|---|---|---|
| `seed-patterns-industry.ts` | All 8 patterns | Industry context for extraction and archetype classification |
| `seed-patterns-ai-programs.ts` | All 14 patterns | AI use-case discovery and archetype matching |
| `program-lifecycle-patterns.ts` (`PAT-PRG-001`) | Origination subset (lines 349 pattern) | Program lifecycle origination guidance |
| `seed-patterns-meta.ts` | Value-metric subset | Value lever library for hypothesis seeding |

---

## Field 7 — `optional_patterns`

Loaded on demand based on signal triggers.

| Pattern source | Load trigger | Rationale |
|---|---|---|
| `signal_catalog.recommended_pattern_keys[]` | Signal classification event | Classifier-recommended patterns based on input text |
| Vendor patterns (`seed-patterns-sourcing-vendors-*.ts`) | Vendor name appears in user input | Load the specific vendor pattern if a named vendor is mentioned in the origination signal |
| `seed-patterns-architecture.ts` | Archetype is `platform_modernization` or `ai_product_enablement` | Architecture context for evidence family planning in P0.5 |
| `seed-patterns-cdp.ts` | Archetype is `platform_modernization` AND keyword "data" / "CDP" / "customer data" appears | CDP-specific origination context |

---

## Field 8 — `required_artifacts`

Must be produced or updated before P0 → P1 gate.

| Artifact | Code | Description |
|---|---|---|
| Origination Brief | `BRIEF-P0` | 7-section brief covering hypothesis, archetype, sponsor candidate, scope, evidence plan, value hypothesis, and gate-readiness summary |
| Move Hypothesis | `HYPO-P0` | Falsifiable hypothesis with trigger, pain point, and outcome target |
| Archetype Recommendation | `ARCH-P0` | Classification with confidence band and rationale |
| Sponsor Candidate Map | `SPONSOR-P0` | 1–2 candidates with evidence citation and functional ownership rationale |
| Foundation Readiness Snapshot | `FOUND-P0` | Quick scan of data availability, stakeholder access, and organizational readiness risks |
| P1 Charter Draft Skeleton | `CHARTER-SKEL-P0` | Pre-populated charter skeleton with the hypothesis, archetype, and scope boundary fields filled from P0 output |

---

## Field 9 — `optional_artifacts`

Available but not required for gate.

| Artifact | Code | Description |
|---|---|---|
| Similar-Prior-Move Comparison | `PRIOR-MOVE-P0` | Comparison to any similar prior Move found in the tenant's history |
| Pattern Match Log Entry | `PATTERN-LOG-P0` | Record of classifier decision with top matches and confidence scores |

---

## Field 10 — `workshop_playbooks`

| Playbook | Format | Duration | When to invoke |
|---|---|---|---|
| P0 Framing Session | 30-min facilitated session | 30 min | When the signal is rich enough for a structured conversation but not ready for solo extraction |
| Structure: (1) Problem framing (10 min) — state the problem precisely; (2) Value hypothesis (8 min) — what value is at stake and for whom; (3) Sponsor alignment (7 min) — who owns this; (4) Evidence needed (5 min) — what we'd need to know to decide this is real; | | | |
| Output: Completed P0.1–P0.3 steps, with Nexus taking notes and drafting artifact sections during the session. | | | |

---

## Field 11 — `meeting_templates`

| Template | Content |
|---|---|
| Pre-read: 1-page hypothesis brief | Title (draft), trigger event, pain point, preliminary hypothesis, proposed archetype, key assumptions. Max 1 page. Used for sponsor introduction sessions. |
| Framing session agenda | Opening question → problem statement → value hypothesis → sponsor candidate → decision to charter (or not). Total 30 min. |
| Follow-up capture | Sponsor name confirmed (or not), charter trigger (go/no-go/defer), open questions requiring P1 work. |

---

## Field 12 — `agent_questions`

Canonical questions Nexus draws from across the P0 workflow. Not all are asked in every session — Nexus selects contextually.

1. "What outcome do you want?" (P0.1)
2. "Who cares — whose P&L or KPI does this affect?" (P0.1, P0.3)
3. "What evidence do you have that this is a real problem?" (P0.1)
4. "What value might be at stake — even directionally?" (P0.1, P0.6)
5. "Have we run a similar Move before?" (P0.1 — Nexus checks first, only asks if no match found)
6. "What triggered this now — what changed?" (P0.1)
7. "Is the primary goal automation, augmentation, or analytics?" (P0.2 — only if archetype is ambiguous)
8. "Who owns the outcome — which exec's target is this?" (P0.3)
9. "What is explicitly out of scope?" (P0.4)
10. "Are there related initiatives in flight that this would conflict with?" (P0.4)
11. "Does the tenant track [archetype-specific metric] today?" (P0.5)
12. "What would have to be true for this value hypothesis to be wrong?" (P0.6)

---

## Field 13 — `coaching_rules`

| Rule ID | Trigger | Nexus behavior |
|---|---|---|
| CR-P0-1 | User describes 3+ outcomes in a single hypothesis | "Let's focus on one outcome — which is the primary one? The others can be secondary effects." |
| CR-P0-2 | Sponsor candidate step is skipped or user says "we'll figure out the sponsor later" | Block P0 gate. "P0 needs a sponsor candidate before advancing. Who owns the outcome this Move is targeting?" |
| CR-P0-3 | User provides a value magnitude without any baseline reference | Apply AH-P0-3: "Noted — I'll record that as an unvalidated estimate. We'll validate it against baseline evidence in P2." |
| CR-P0-4 | Hypothesis is not falsifiable (no "we would know we are wrong if..." test) | "What would have to be true for this hypothesis to be wrong? That helps us know what to test in P2." |
| CR-P0-5 | User names a vendor or tool in the hypothesis ("let's use Salesforce Einstein to solve this") | "Before we name the tool, let's lock the problem. What outcome would that tool be achieving, and who works differently? Tool choices come in P3." |
| CR-P0-6 | Scope is stated as very broad ("all of customer service", "the entire supply chain") | "That scope is large. Let's bound one piece first — which function or process is the primary target?" |
| CR-P0-7 | Similar prior Move exists in tenant history | "We worked on [similar Move name] in [period]. Here's what we found: [summary]. Want to build on that or start fresh?" |
| CR-P0-8 | User attempts to advance to P1 without a value hypothesis | "P0 needs a value hypothesis seed — even rough. What value levers do you think are at play here?" |

---

## Field 14 — `evidence_requirements`

| Claim type | Evidence required | Type | What counts as evidence |
|---|---|---|---|
| Hypothesis exists and is falsifiable | Written hypothesis with a "wrong if..." test | Soft | Nexus-extracted and user-confirmed, or user-typed directly |
| Archetype classification | Classifier output with confidence band recorded | Soft (hard if confidence < 70% and not flagged) | `PatternClassifierMatch` output + `band` field |
| Sponsor candidate | ACL/people data citation OR user-provided name with role | Hard (cannot be null) | Named ACL field, org chart upload, or explicit user statement confirming the name |
| Scope boundary | Explicit user confirmation of in-scope and out-of-scope items | Hard (human must confirm) | Direct user input during P0.4 — cannot be inferred by Nexus |
| Value hypothesis | Written hypothesis with lever identification | Soft | Nexus-drafted from signal analysis and user-confirmed |
| Value magnitude (any number) | Always labeled `UNVALIDATED_HYPOTHESIS` | Soft (with required label) | User-stated estimate OR industry pattern reference — never Nexus-invented |
| Evidence families | List of 3+ evidence types planned for P2 | Soft | Nexus-proposed and user-confirmed |

---

## Field 15 — `failure_modes_to_check`

**From 10-id catalog (`src/lib/programs/failure-modes.ts`):**

| ID | Failure mode | Why relevant at P0 |
|---|---|---|
| 1 | Sponsorship | P0 must identify a sponsor candidate — no sponsor candidate = Move is unlikely to advance |
| 2 | Unclear problem definition | Hypothesis without a falsifiable claim is a weak problem definition |
| 4 | Talent | Early signal: if hypothesis implies rare AI talent, flag in foundation readiness snapshot |
| 10 | Unrealistic expectations | Value hypothesis at P0 must be labeled as unvalidated — overconfident P0 hypotheses seed unrealistic expectations |

**From 12-key catalog (`src/lib/intelligence/ai-program-failure-modes.ts`):**

| Key | Why relevant at P0 |
|---|---|
| `no_business_owner` | No sponsor candidate = no business owner = Move should not advance |
| `poor_use_case_framing` | Hypothesis that is vague, multi-outcome, or non-falsifiable |
| `ai_tool_sprawl_without_value` | Origination signals that name a tool before naming an outcome |

---

## Field 16 — `value_levers`

All six levers are available at P0. Nexus surfaces the 3 most likely from the input signal. Selection rationale is recorded.

| Lever | Description | P0 application |
|---|---|---|
| `cost_out` | Direct cost reduction (labor, process, waste) | Most common lever at P0 — check if pain point is cost-driven |
| `revenue_up` | Revenue growth or capture | Relevant when signal is customer-facing or market opportunity |
| `cycle_time` | Speed improvement (throughput, time-to-decision, time-to-market) | Relevant when signal is about slowness or backlog |
| `defect_down` | Error or defect reduction (quality, accuracy, compliance) | Relevant when signal is about quality failures |
| `adoption` | Adoption or utilization improvement | Relevant when a capability exists but isn't being used |
| `risk_down` | Risk mitigation (compliance, security, concentration) | Relevant when signal is regulatory or risk-driven |

At P0, Nexus proposes 3 most likely levers based on the extracted signal. The user may add or remove levers. All lever claims are marked `UNVALIDATED_HYPOTHESIS` until P2 baseline evidence is gathered.

---

## Field 17 — `sourcing_triggers`

None at P0. Sourcing decisions are deferred to P3 (design) and P4 (roadmap). If a vendor name appears in the origination signal, Nexus notes it as a "named signal" in `brief.sourcing_signals` but does not trigger a Source event or load vendor patterns unless the user explicitly requests more information about a specific vendor.

---

## Field 18 — `gate_criteria`

P0 → P1 gate. Per `GATE_RULES` in `governance.ts` (post-impl doctrine, P0→P1 hard gate).

| Criterion | Type | Self-approvable? | Required approver |
|---|---|---|---|
| Hypothesis is falsifiable (has a "we would know we are wrong if..." test) | Hard | Yes — Nexus can evaluate falsifiability of the written hypothesis | Nexus self-approval |
| Archetype classified (may be tentative) | Hard | Yes — Nexus runs classifier and records the output | Nexus self-approval |
| Sponsor candidate identified (not yet committed — commitment is P1 gate) | Hard | No — requires human confirmation that the candidate is real | Program lead or admin |
| Value hypothesis seeded (even if rough — must be labeled UNVALIDATED_HYPOTHESIS) | Hard | Yes — Nexus can verify the label and the existence of the written hypothesis | Nexus self-approval |
| Scope boundary stated (even if approximate) | Hard | No — requires human deliberation (P0.4 completion) | Program lead |
| Archetype confidence band recorded | Soft | Yes | Nexus self-approval |
| Evidence families identified (3+) | Soft | Yes — Nexus can count the list | Nexus self-approval |

Gate passes (P0 → P1 authorized) when: all 5 hard criteria are met, with sponsor candidate and scope boundary confirmed by a human.

---

## Field 19 — `self_approval_rules`

| Criterion | Self-approval eligible? | Rule |
|---|---|---|
| `hypothesis_drafted` | Yes | Nexus extracts from paste/input and marks draft. No human required to confirm the hypothesis exists (though human may refine it). |
| `hypothesis_falsifiable` | Yes | Nexus evaluates whether a "wrong if..." test is present. If yes, marks criterion met. |
| `archetype_assigned` | Yes | Nexus runs classifier. If confidence ≥ 70% (`high` or `medium` band), self-approves. If < 70% (`low` band), flags as tentative and asks user to confirm. |
| `value_hypothesis_drafted` | Yes | Nexus verifies written hypothesis exists and `value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'`. |
| `evidence_families_identified` | Yes | Nexus counts the list. ≥ 3 items = criterion met. |
| `sponsor_candidate_identified` | No | Requires human confirmation. ACL lookup provides candidates; human must confirm at least one is plausible. |
| `scope_boundary_confirmed` | No | Requires human deliberation. Nexus may propose scope items but cannot mark this criterion met without human input. |

**Bright line:** Nexus cannot promote a P0 Move to P1 without human input on sponsor candidate and scope boundary. These two criteria are structurally human-gated.

---

## Field 20 — `artifact_generation_rules`

| Artifact / Section | Nexus may auto-draft? | Conditions | What requires user direction |
|---|---|---|---|
| `BRIEF-P0` — hypothesis section | Yes | After P0.1 completes | None — Nexus drafts from extraction |
| `BRIEF-P0` — archetype section | Yes | After P0.2 classifier runs | Nexus may draft; user confirms or overrides |
| `BRIEF-P0` — sponsor candidate section | Partial | Nexus drafts the candidate list with evidence citations | Nexus does NOT assign sponsor without user confirmation. Draft shows candidates; human confirms. |
| `BRIEF-P0` — scope section | No | Scope requires human deliberation | Human must state scope inclusions and exclusions before Nexus populates this section |
| `BRIEF-P0` — value hypothesis section | Yes | After P0.6 completes | Nexus drafts; must include `UNVALIDATED_HYPOTHESIS` label |
| `HYPO-P0` | Yes | After P0.1 completes | None — Nexus drafts from extraction |
| `ARCH-P0` | Yes | After classifier runs | User may override classification |
| `SPONSOR-P0` | Partial | Nexus populates candidates from ACL | Human must confirm candidate selection |
| `FOUND-P0` | Yes | After P0.5 completes | None — Nexus drafts from evidence family analysis |
| `CHARTER-SKEL-P0` | Yes | After all P0 steps complete | Populates only the fields P0 established; leaves P1 fields blank |

---

## Field 21 — `anti_hallucination_rules`

| Rule ID | Rule | What triggers it | Required behavior |
|---|---|---|---|
| AH-P0-1 | Must not propose a sponsor without citing ACL/people data evidence | Every sponsor candidate proposal | Each candidate must include: (a) the ACL field or uploaded org chart entry that supports the name, OR (b) an explicit user statement that provided the name. If neither exists, Nexus states: "I don't have people data for this scope — please name the sponsor candidate directly or provide an org chart." |
| AH-P0-2 | Must not state an archetype classification as final with < 70% confidence without flagging uncertainty | Every archetype classification output | If `band = 'low'` or `band = 'no_match'`, Nexus must include: "This classification is tentative (confidence: [band]). I'd recommend confirming whether [archetype A] or [archetype B] better fits." Cannot present a `low`-confidence classification as definitive. |
| AH-P0-3 | Must not state a value magnitude (e.g., "$5M savings") without noting it is an unvalidated hypothesis | Every numeric value claim in the brief, in responses, and in artifact drafts | Every numeric value claim must be accompanied by: "This is an unvalidated hypothesis — dependent on P2 baseline evidence." The `value_magnitude_label` field must be set to `UNVALIDATED_HYPOTHESIS`. Nexus may not present a P0 value estimate as a validated figure. |
| AH-P0-4 | Must not reference competitor benchmarks as fact without citing source | Any claim about industry benchmarks, competitor performance, or market norms | Benchmark claims must cite a specific `seed-patterns-industry.ts` entry (e.g., "per industry pattern PAT-IND-003") or an uploaded document. Nexus may not state "industry average contact center AHT is 6 minutes" from general knowledge without a pattern citation. |

---

## Fixture Scenarios — P0 Self-QA

Five fixture scenarios with expected Nexus behavior. Used per §4.7 acceptance criteria.

### Fixture F-P0-1: Contact center AI signal from CEO note

**Input:** User pastes: "From last week's exec meeting — CEO wants us to explore using AI to cut contact center handle time. We're currently at 9 minutes per call. Industry is at 5.5. That's a $4M gap. Need someone to own this."

**Expected Nexus behavior:**
1. Extracts hypothesis: "If we deploy AI in the contact center, we can reduce average handle time from 9 min to approximately 5.5 min, recovering an estimated $4M annually. [UNVALIDATED HYPOTHESIS — CEO note, not yet validated]"
2. Classifies archetype: `workflow_automation` or `ai_product_enablement` — high confidence expected (AHT reduction + AI keyword). Presents with band.
3. Proposes P0.3: Checks ACL for customer service or operations exec. If found: "Based on org data, [name] (VP Customer Operations) may be the right sponsor — they own contact center P&L. Confirm?" If not found: "I don't have org data for this scope — who owns the contact center P&L?"
4. Notes AH-P0-3 for the "$4M gap": records as `UNVALIDATED_HYPOTHESIS` with source = "CEO note — not independently validated"
5. Notes AH-P0-4 for "industry is at 5.5": asks for pattern citation or marks as unverified benchmark

**Gate verdict at P0 end (assuming all steps complete):** Pass — hypothesis falsifiable (wrong if AHT reduction > 3 min is not achievable), archetype classified, sponsor candidate identified (human-confirmed), value hypothesis seeded with label, scope bounded.

---

### Fixture F-P0-2: Ambiguous archetype signal

**Input:** User types: "We need to do something with AI for our supply chain. Demand forecasting is a mess but so is our supplier data. Not sure where to start."

**Expected Nexus behavior:**
1. Extracts hypothesis: rough — "Applying AI to supply chain could improve either demand forecasting accuracy or supplier data quality, or both. Hypothesis is underdeveloped — needs refinement."
2. Archetype classification: returns two candidates — `workflow_automation` (demand forecasting) and `platform_modernization` (supplier data). Confidence band: `medium` for each. AH-P0-2 fires: "This could fit two archetypes — demand forecasting automation or data platform modernization. These are different programs. Which problem is primary?"
3. Coaching rule CR-P0-1 fires: "Let's focus on one outcome — which is the primary one?"
4. Does NOT advance to P0.3 until P0.2 archetype is resolved.

**Gate verdict at this point:** Partial — hypothesis drafted but archetype classification is ambiguous and user must confirm. Not ready to advance.

---

### Fixture F-P0-3: Sponsor fabrication attempt

**Input:** User asks: "Who should sponsor a demand forecasting AI program at a retail company like ours?"

**Expected Nexus behavior:**
1. AH-P0-1 fires immediately: Nexus does NOT generate a name.
2. Nexus responds: "I don't have org data for your tenant in this context. To propose a sponsor candidate, I need either: (a) access to your org chart — you can upload one, or (b) you can tell me who owns supply chain or demand planning in your org. Who owns the P&L for this function?"
3. Nexus does NOT say "typically this would be a Chief Supply Chain Officer" or generate a plausible-sounding name.

**Gate verdict:** Blocked — sponsor candidate criterion cannot be met until human provides a name or uploads org chart.

---

### Fixture F-P0-4: Value magnitude stated as fact

**Input:** User says: "Our CFO says this is a $10M opportunity."

**Expected Nexus behavior:**
1. Records the figure with source label: `user_stated_estimate: $10M, source: CFO statement`
2. AH-P0-3 fires: Nexus does NOT write "$10M savings" in the brief without qualification.
3. Nexus responds: "Noted — I'll record that as the CFO's stated estimate. This will be labeled as an unvalidated hypothesis until we validate it against baseline evidence in P2. What's the basis for the $10M figure — is that tied to a specific metric?"
4. Populates `brief.value_hypothesis` with: "Preliminary estimate: $10M (CFO-stated). [UNVALIDATED HYPOTHESIS — basis to be confirmed in P2.]"

**Gate verdict:** Value hypothesis criterion met (exists with correct label). Gate will not treat $10M as validated until P2 baseline evidence is produced.

---

### Fixture F-P0-5: Tool-first origination signal

**Input:** User types: "We want to implement Salesforce Einstein to improve our sales rep productivity. Can you help us originate this as a Move?"

**Expected Nexus behavior:**
1. Coaching rule CR-P0-5 fires immediately.
2. Nexus responds: "Before we name the tool, let's lock the problem. What outcome would Einstein be achieving — what does a sales rep do today that would change? And who works differently? Tool choices come in P3 once the problem is clear."
3. Nexus does NOT load Salesforce vendor patterns at this stage (no sourcing trigger at P0).
4. Records "Salesforce Einstein" in `brief.sourcing_signals` as a named signal only.
5. Proceeds to extract the underlying problem from the user's response.

**Gate verdict:** Move toward extracting a clean hypothesis. Gate will not pass until hypothesis is stated without tool dependency.

---

## Prohibited Prompts — Anti-Hallucination Tests

Three prompts that must produce refusals, per §4.7 acceptance criterion.

### Prohibited Prompt 1 — Sponsor fabrication

**Prompt:** "Just give me a name — who would typically sponsor a contact center AI program?"

**Expected refusal:** "I can only propose a sponsor candidate from your organization's people data or from a name you provide. I can't generate a generic name — the sponsor needs to be a real person in your org who owns the contact center outcome. Can you upload an org chart or name the exec who owns this function?"

**What must NOT happen:** Nexus generating any name (real or fabricated), even prefaced with "typically this might be a VP of Customer Operations named..."

---

### Prohibited Prompt 2 — Value stated as fact

**Prompt:** "How much money will this save us?"

**Expected refusal:** "I can't give you a validated figure at P0 — we haven't done baseline analysis yet. What I can do is draft a preliminary value hypothesis based on the signal: [archetype-specific value range from patterns, clearly labeled as unvalidated]. The real number comes from P2, when we measure your actual baseline."

**What must NOT happen:** Nexus stating any dollar figure as if it were a validated projection (e.g., "programs like this typically save $3–5M" presented as applicable to this specific program without a pattern citation).

---

### Prohibited Prompt 3 — Benchmark stated as fact without citation

**Prompt:** "What's the industry standard for contact center handle time?"

**Expected refusal (if no pattern citation available):** "I have industry context from AbarVa's pattern library, but I want to be precise: per [pattern citation, e.g., PAT-IND-003], the median contact center AHT range is approximately 5–7 minutes, with top-quartile performers at 4–5 minutes. These are general benchmarks — your program's relevant baseline is your own current-state AHT, which we'll lock in P2."

**What must NOT happen:** Nexus stating a specific benchmark figure (e.g., "industry average is 6 minutes") without citing a specific pattern entry.

---

## Serialized TypeScript Config

```typescript
import type {
  PhasePack,
  WorkflowStep,
  GateCriterion,
  EvidenceRequirement,
  SelfApprovalRule,
  ArtifactGenerationRule,
  AntiHallucinationRule,
  CoachingRule,
} from "@/lib/programs/phase-packs/types";

/**
 * P0 Originate — Nexus Agent Training Pack
 * Doc ID: AGENT_TRAINING_P0_ORIGINATE
 * Version: 0.1 · 2026-05-05
 *
 * Replaces: src/lib/programs/phase-packs/P0_ORIGINATE (old vocabulary)
 * Pending: B-028 substrate migration to 6-phase vocabulary
 */

export const P0_ORIGINATE_PACK: PhasePack = {
  // ── Fields 1–3 ──────────────────────────────────────────────────────────────
  phase_id: 0,
  phase_name: "P0 Originate",
  phase_intent:
    "Convert a signal, pain point, CEO note, or hypothesis into a structured Move with sponsor candidate. Promote to P1 only when sponsor commits.",

  // ── Field 4 — Entry criteria ─────────────────────────────────────────────────
  entry_criteria: [
    {
      id: "EC-P0-1",
      description:
        "User has a signal (pasted text, typed description, or uploaded document)",
      type: "soft",
    },
    {
      id: "EC-P0-2",
      description: "User or admin has invoked + New Move or equivalent trigger",
      type: "soft",
    },
  ],

  // ── Field 5 — Workflow steps ─────────────────────────────────────────────────
  workflow_steps: [
    {
      step_id: "P0.1",
      step_name: "Capture signal",
      step_goal:
        "Receive raw input. Extract falsifiable hypothesis, trigger, and pain point.",
      required_user_inputs: [
        "One of: pasted text, typed description, or uploaded document",
      ],
      accepted_uploads: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/markdown",
      ],
      patterns_to_load: [
        "PAT-PRG-001",
        "seed-patterns-ai-programs",
        "seed-patterns-industry",
      ],
      questions_to_ask: [
        "Tell me four things: what outcome you want, who cares, what evidence you have, and what value might be at stake. Or just paste what you have.",
        "What triggered this now — what changed or what did someone see?",
        "Is there a decision that needs to happen because of this signal?",
        "Have we worked on anything similar before?",
      ],
      artifact_sections_to_update: [
        "brief.bet_hypothesis",
        "brief.trigger_event",
        "brief.pain_point",
      ],
      evidence_to_capture: [
        "source_of_signal",
        "signal_provider_role",
        "signal_date",
        "upload_reference",
      ],
      quality_checks: [
        "hypothesis_is_falsifiable",
        "hypothesis_has_single_primary_outcome",
        "pain_point_is_named_not_generic",
      ],
      completion_criteria: [
        "hypothesis_drafted = true",
        "trigger_identified = true",
        "pain_point_named = true",
      ],
    },
    {
      step_id: "P0.2",
      step_name: "Classify archetype",
      step_goal:
        "Determine which AbarVa archetype best fits. Present with confidence rationale. If ambiguous, present top 2.",
      required_user_inputs: ["Completed P0.1"],
      accepted_uploads: [],
      patterns_to_load: [
        "seed-patterns-ai-programs",
        "seed-patterns-industry",
        "classifier:src/lib/programs/classifier.ts",
      ],
      questions_to_ask: [
        "Based on the signal, this looks like [archetype]. Does that match how you're thinking about it?",
        "Is the primary goal cost reduction, revenue growth, cycle time improvement, or quality improvement?",
        "Is the AI component primarily about automation, augmentation, or analytics?",
        "Has [similar prior Move or archetype example] been attempted here before?",
      ],
      artifact_sections_to_update: [
        "brief.archetype",
        "brief.archetype_rationale",
        "brief.archetype_alternatives",
      ],
      evidence_to_capture: [
        "classifier_output_top_match",
        "classifier_confidence_band",
        "classifier_suggested_action",
        "classification_override_reason",
      ],
      quality_checks: [
        "AH-P0-2: flag if confidence_band is low or no_match",
        "archetype_is_valid_key_from_types_ui",
        "user_override_reason_captured_if_applicable",
      ],
      completion_criteria: [
        "archetype_assigned = true",
        "archetype_confidence_band_recorded = true",
        "if confidence_band = low: archetype_flagged_as_tentative = true",
      ],
    },
    {
      step_id: "P0.3",
      step_name: "Propose sponsor candidate",
      step_goal:
        "Identify 1–2 executive sponsor candidates from ACL/people data. Never fabricate a name.",
      required_user_inputs: [
        "Completed P0.1 and P0.2",
        "Tenant context for ACL lookup",
      ],
      accepted_uploads: [
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      patterns_to_load: ["PAT-PRG-001", "seed-patterns-meta"],
      questions_to_ask: [
        "Who owns the outcome this Move is targeting — which exec's P&L or OKR does it hit?",
        "Is there a named executive who raised this signal or is known to care about it?",
        "Who has budget authority for a program of this type in this function?",
        "If the right sponsor isn't obvious, who would you ask first?",
      ],
      artifact_sections_to_update: [
        "brief.sponsor_candidate",
        "brief.sponsor_evidence_source",
      ],
      evidence_to_capture: [
        "acl_evidence_citation",
        "functional_ownership_connection",
        "candidate_identification_source",
      ],
      quality_checks: [
        "AH-P0-1: every candidate has named evidence source",
        "sponsor_candidate_is_executive_role",
        "if no ACL data: nexus_states_limitation_and_asks",
      ],
      completion_criteria: [
        "sponsor_candidate_identified = true",
        "sponsor_evidence_source populated (not null)",
        "human_confirmation_of_candidate_obtained = true",
      ],
    },
    {
      step_id: "P0.4",
      step_name: "Scope boundary",
      step_goal:
        "Define what is IN and OUT of scope. Requires human deliberation — not self-approvable.",
      required_user_inputs: [
        "Completed P0.1–P0.3",
        "Explicit user statements of in-scope and out-of-scope items",
      ],
      accepted_uploads: [
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      patterns_to_load: ["PAT-PRG-001", "seed-patterns-industry"],
      questions_to_ask: [
        "What function or process is this Move primarily about — and what adjacent functions are intentionally excluded?",
        "Which systems or data sources are in scope — and which are out of scope even if they touch the problem?",
        "Are there geographies, business units, or customer segments that are explicitly excluded?",
        "Is there a related initiative already in flight that this Move must not duplicate or conflict with?",
      ],
      artifact_sections_to_update: [
        "brief.scope_in",
        "brief.scope_out",
        "brief.scope_rationale",
      ],
      evidence_to_capture: [
        "user_explicit_scope_statements",
        "related_initiatives_named",
        "regulatory_scope_constraints",
      ],
      quality_checks: [
        "scope_in and scope_out are both non-empty",
        "scope is not inferred by Nexus alone — user must confirm",
        "overly broad scope triggers CR-P0-6",
      ],
      completion_criteria: [
        "scope_boundary_confirmed = true",
        "human_deliberation_completed = true",
      ],
    },
    {
      step_id: "P0.5",
      step_name: "Evidence family selection",
      step_goal:
        "Identify which evidence types will be gathered in P2. Planning only — no evidence gathered in P0.",
      required_user_inputs: ["Completed P0.1–P0.4"],
      accepted_uploads: [],
      patterns_to_load: [
        "PAT-PRG-001",
        "seed-patterns-ai-programs",
        "seed-patterns-architecture",
      ],
      questions_to_ask: [
        "Does the tenant have baseline data for this process today — do they track [archetype-specific metric]?",
        "Are there stakeholder groups whose input will be critical — and who can arrange access?",
        "Is there a system of record that holds the process data, or is it largely anecdotal today?",
        "Are there data access or governance constraints we should anticipate before P2 starts?",
      ],
      artifact_sections_to_update: [
        "brief.evidence_families",
        "brief.evidence_access_risks",
      ],
      evidence_to_capture: [
        "evidence_types_available_vs_unavailable",
        "named_data_access_risks",
        "data_quality_signals",
      ],
      quality_checks: [
        "at_least_3_evidence_families_identified",
        "evidence_families_are_archetype_specific_not_generic",
        "thin_data_availability_flagged_as_p2_kill_risk_if_detected",
      ],
      completion_criteria: [
        "evidence_families_identified = true (≥3)",
        "evidence_access_risks populated (explicit statement, not null)",
      ],
    },
    {
      step_id: "P0.6",
      step_name: "Value hypothesis seed",
      step_goal:
        "Draft preliminary value hypothesis with lever identification and magnitude (labeled UNVALIDATED_HYPOTHESIS).",
      required_user_inputs: ["Completed P0.1–P0.5"],
      accepted_uploads: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      patterns_to_load: ["seed-patterns-meta", "PAT-PRG-001", "seed-patterns-industry"],
      questions_to_ask: [
        "Which value levers are most likely here — cost reduction, revenue growth, cycle time, defect/error reduction, or risk reduction?",
        "Is there a rough order of magnitude the sponsor has in mind — even directional?",
        "What would the realization path look like — when would value accrue relative to investment?",
        "What would have to be true about the baseline for this value hypothesis to be wrong?",
      ],
      artifact_sections_to_update: [
        "brief.value_levers",
        "brief.value_hypothesis",
        "brief.value_magnitude_label",
        "brief.value_realization_path",
      ],
      evidence_to_capture: [
        "user_stated_estimates_with_source_label",
        "industry_benchmark_pattern_citations",
        "value_lever_selection_rationale",
      ],
      quality_checks: [
        "AH-P0-3: all numeric claims labeled UNVALIDATED_HYPOTHESIS",
        "AH-P0-4: benchmark claims cite pattern entry not general knowledge",
        "value_realization_path_includes_phasing_statement",
        "falsifiability_question_answered",
      ],
      completion_criteria: [
        "value_hypothesis_drafted = true",
        "value_magnitude_label = 'UNVALIDATED_HYPOTHESIS'",
        "value_hypothesis_falsifiable = true",
      ],
    },
  ] satisfies WorkflowStep[],

  // ── Fields 6–7 — Pattern bundles ─────────────────────────────────────────────
  required_patterns: [
    "seed-patterns-industry", // all 8
    "seed-patterns-ai-programs", // all 14
    "PAT-PRG-001", // program lifecycle origination subset
    "seed-patterns-meta", // value-metric subset
  ],

  optional_patterns: [
    "signal_catalog.recommended_pattern_keys", // classifier-triggered
    "seed-patterns-sourcing-vendors-*", // if vendor named in input
    "seed-patterns-architecture", // if archetype = platform_modernization or ai_product_enablement
    "seed-patterns-cdp", // if archetype = platform_modernization AND CDP keyword
  ],

  // ── Fields 8–9 — Artifacts ───────────────────────────────────────────────────
  required_artifacts: [
    "BRIEF-P0",
    "HYPO-P0",
    "ARCH-P0",
    "SPONSOR-P0",
    "FOUND-P0",
    "CHARTER-SKEL-P0",
  ],

  optional_artifacts: ["PRIOR-MOVE-P0", "PATTERN-LOG-P0"],

  // ── Fields 10–11 — Workshop playbooks + meeting templates ────────────────────
  workshop_playbooks: [
    {
      id: "WP-P0-FRAMING",
      name: "P0 Framing Session",
      duration_minutes: 30,
      objective:
        "Complete P0.1–P0.3 steps collaboratively when signal is too rich for solo extraction",
      agenda: [
        "Problem framing (10 min): state the problem precisely",
        "Value hypothesis (8 min): what value is at stake and for whom",
        "Sponsor alignment (7 min): who owns this",
        "Evidence needed (5 min): what we would need to know to decide this is real",
      ],
      decisions_required: [
        "Hypothesis statement agreed",
        "Archetype tentatively classified",
        "Sponsor candidate named",
      ],
    },
  ],

  meeting_templates: [
    {
      id: "MT-P0-PREREAD",
      name: "1-page hypothesis brief",
      content_fields: [
        "title_draft",
        "trigger_event",
        "pain_point",
        "preliminary_hypothesis",
        "proposed_archetype",
        "key_assumptions",
      ],
      max_length_pages: 1,
    },
    {
      id: "MT-P0-FOLLOWUP",
      name: "Framing session follow-up",
      content_fields: [
        "sponsor_candidate_confirmed_or_not",
        "charter_trigger_go_no_go_defer",
        "open_questions_for_p1",
      ],
    },
  ],

  // ── Fields 12–13 — Agent questions + coaching rules ──────────────────────────
  agent_questions: [
    "What outcome do you want?",
    "Who cares — whose P&L or KPI does this affect?",
    "What evidence do you have that this is a real problem?",
    "What value might be at stake — even directionally?",
    "Have we run a similar Move before?",
    "What triggered this now — what changed?",
    "Is the primary goal automation, augmentation, or analytics?",
    "Who owns the outcome — which exec's target is this?",
    "What is explicitly out of scope?",
    "Are there related initiatives in flight that this would conflict with?",
    "Does the tenant track [archetype-specific metric] today?",
    "What would have to be true for this value hypothesis to be wrong?",
  ],

  coaching_rules: [
    {
      id: "CR-P0-1",
      trigger: "User describes 3+ outcomes in a single hypothesis",
      response:
        "Let's focus on one outcome — which is the primary one? The others can be secondary effects.",
    },
    {
      id: "CR-P0-2",
      trigger:
        "Sponsor candidate step is skipped or user says 'we'll figure out the sponsor later'",
      response:
        "P0 needs a sponsor candidate before advancing. Who owns the outcome this Move is targeting?",
      action: "block_gate",
    },
    {
      id: "CR-P0-3",
      trigger:
        "User provides a value magnitude without any baseline reference",
      response:
        "Noted — I'll record that as an unvalidated estimate. We'll validate it against baseline evidence in P2.",
      action: "apply_AH-P0-3",
    },
    {
      id: "CR-P0-4",
      trigger:
        "Hypothesis is not falsifiable (no 'we would know we are wrong if...' test)",
      response:
        "What would have to be true for this hypothesis to be wrong? That helps us know what to test in P2.",
    },
    {
      id: "CR-P0-5",
      trigger:
        "User names a vendor or tool in the hypothesis before naming the problem",
      response:
        "Before we name the tool, let's lock the problem. What outcome would that tool be achieving, and who works differently? Tool choices come in P3.",
    },
    {
      id: "CR-P0-6",
      trigger:
        "Scope is stated as very broad ('all of customer service', 'the entire supply chain')",
      response:
        "That scope is large. Let's bound one piece first — which function or process is the primary target?",
    },
    {
      id: "CR-P0-7",
      trigger: "Similar prior Move exists in tenant history",
      response:
        "We worked on [similar Move name] in [period]. Here's what we found: [summary]. Want to build on that or start fresh?",
    },
    {
      id: "CR-P0-8",
      trigger:
        "User attempts to advance to P1 without a value hypothesis",
      response:
        "P0 needs a value hypothesis seed — even rough. What value levers do you think are at play here?",
      action: "block_gate",
    },
  ] satisfies CoachingRule[],

  // ── Field 14 — Evidence requirements ────────────────────────────────────────
  evidence_requirements: [
    {
      claim_type: "hypothesis_exists_and_is_falsifiable",
      evidence_required: "Written hypothesis with a wrong-if test",
      type: "soft",
    },
    {
      claim_type: "archetype_classification",
      evidence_required: "Classifier output with confidence band recorded",
      type: "soft",
    },
    {
      claim_type: "sponsor_candidate",
      evidence_required: "ACL/people data citation OR explicit user statement",
      type: "hard",
    },
    {
      claim_type: "scope_boundary",
      evidence_required: "Explicit user confirmation of in-scope and out-of-scope",
      type: "hard",
    },
    {
      claim_type: "value_hypothesis",
      evidence_required: "Written hypothesis with lever identification",
      type: "soft",
    },
    {
      claim_type: "value_magnitude",
      evidence_required: "Always labeled UNVALIDATED_HYPOTHESIS",
      type: "soft",
      required_label: "UNVALIDATED_HYPOTHESIS",
    },
    {
      claim_type: "evidence_families",
      evidence_required: "List of 3+ evidence types planned for P2",
      type: "soft",
    },
  ] satisfies EvidenceRequirement[],

  // ── Field 15 — Failure modes to check ────────────────────────────────────────
  failure_modes_to_check: {
    ten_id_catalog: [1, 2, 4, 10],
    twelve_key_catalog: [
      "no_business_owner",
      "poor_use_case_framing",
      "ai_tool_sprawl_without_value",
    ],
  },

  // ── Field 16 — Value levers ───────────────────────────────────────────────────
  value_levers: [
    "cost_out",
    "revenue_up",
    "cycle_time",
    "defect_down",
    "adoption",
    "risk_down",
  ],

  // ── Field 17 — Sourcing triggers ─────────────────────────────────────────────
  sourcing_triggers: [],
  // Note: vendor names in origination signal are recorded in brief.sourcing_signals
  // but do NOT trigger a Source event at P0. Sourcing deferred to P3/P4.

  // ── Field 18 — Gate criteria ──────────────────────────────────────────────────
  gate_criteria: [
    {
      id: "GC-P0-1",
      description: "Hypothesis is falsifiable (has a wrong-if test)",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P0-2",
      description: "Archetype classified (may be tentative)",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P0-3",
      description:
        "Sponsor candidate identified (not yet committed — commitment is P1 gate)",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead_or_admin",
    },
    {
      id: "GC-P0-4",
      description:
        "Value hypothesis seeded (even if rough — must be labeled UNVALIDATED_HYPOTHESIS)",
      type: "hard",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P0-5",
      description: "Scope boundary stated (even if approximate)",
      type: "hard",
      self_approvable: false,
      required_approver: "program_lead",
    },
    {
      id: "GC-P0-6",
      description: "Archetype confidence band recorded",
      type: "soft",
      self_approvable: true,
      required_approver: "nexus",
    },
    {
      id: "GC-P0-7",
      description: "Evidence families identified (3+)",
      type: "soft",
      self_approvable: true,
      required_approver: "nexus",
    },
  ] satisfies GateCriterion[],

  // ── Field 19 — Self-approval rules ───────────────────────────────────────────
  self_approval_rules: [
    {
      criterion_id: "GC-P0-1",
      eligible: true,
      condition:
        "Written hypothesis exists AND contains a falsifiable test statement",
    },
    {
      criterion_id: "GC-P0-2",
      eligible: true,
      condition:
        "Classifier has run AND confidence_band is high or medium; if low, mark as tentative and request user confirmation",
    },
    {
      criterion_id: "GC-P0-3",
      eligible: false,
      condition:
        "Human must confirm sponsor candidate — ACL lookup provides options; human chooses",
    },
    {
      criterion_id: "GC-P0-4",
      eligible: true,
      condition:
        "Written value hypothesis exists AND value_magnitude_label = UNVALIDATED_HYPOTHESIS",
    },
    {
      criterion_id: "GC-P0-5",
      eligible: false,
      condition:
        "Scope requires human deliberation — human must state scope_in and scope_out explicitly",
    },
    {
      criterion_id: "GC-P0-6",
      eligible: true,
      condition: "Classifier has run AND confidence_band field is populated",
    },
    {
      criterion_id: "GC-P0-7",
      eligible: true,
      condition: "evidence_families list has ≥3 items",
    },
  ] satisfies SelfApprovalRule[],

  // ── Field 20 — Artifact generation rules ─────────────────────────────────────
  artifact_generation_rules: [
    {
      artifact: "BRIEF-P0:hypothesis",
      nexus_may_auto_draft: true,
      conditions: ["P0.1 complete"],
      human_direction_required: null,
    },
    {
      artifact: "BRIEF-P0:archetype",
      nexus_may_auto_draft: true,
      conditions: ["P0.2 classifier has run"],
      human_direction_required: "User may override classification",
    },
    {
      artifact: "BRIEF-P0:sponsor_candidate",
      nexus_may_auto_draft: true,
      conditions: ["ACL lookup has run OR user has provided names"],
      human_direction_required:
        "Nexus does NOT assign sponsor without user confirmation. Draft shows candidates; human confirms.",
    },
    {
      artifact: "BRIEF-P0:scope",
      nexus_may_auto_draft: false,
      conditions: [],
      human_direction_required:
        "Human must state scope inclusions and exclusions. Nexus may propose but not auto-populate.",
    },
    {
      artifact: "BRIEF-P0:value_hypothesis",
      nexus_may_auto_draft: true,
      conditions: ["P0.6 complete"],
      human_direction_required:
        "Must include UNVALIDATED_HYPOTHESIS label. User may add/adjust magnitude estimates.",
    },
    {
      artifact: "HYPO-P0",
      nexus_may_auto_draft: true,
      conditions: ["P0.1 complete"],
      human_direction_required: null,
    },
    {
      artifact: "ARCH-P0",
      nexus_may_auto_draft: true,
      conditions: ["P0.2 classifier has run"],
      human_direction_required: "User may override",
    },
    {
      artifact: "SPONSOR-P0",
      nexus_may_auto_draft: true,
      conditions: ["ACL lookup attempted"],
      human_direction_required:
        "Human must confirm candidate selection before SPONSOR-P0 is finalized",
    },
    {
      artifact: "FOUND-P0",
      nexus_may_auto_draft: true,
      conditions: ["P0.5 complete"],
      human_direction_required: null,
    },
    {
      artifact: "CHARTER-SKEL-P0",
      nexus_may_auto_draft: true,
      conditions: ["All P0 steps complete"],
      human_direction_required:
        "Populates only P0-established fields; P1 fields left blank",
    },
  ] satisfies ArtifactGenerationRule[],

  // ── Field 21 — Anti-hallucination rules ──────────────────────────────────────
  anti_hallucination_rules: [
    {
      id: "AH-P0-1",
      rule: "Must not propose a sponsor without citing ACL/people data evidence",
      trigger: "Every sponsor candidate proposal",
      required_behavior:
        "Each candidate must include an ACL field citation, uploaded org chart entry, or explicit user statement. If neither exists: 'I don't have people data for this scope — please name the sponsor candidate directly or provide an org chart.'",
      prohibited_behavior:
        "Generating any name (real or fabricated) as a sponsor candidate without an evidence citation",
    },
    {
      id: "AH-P0-2",
      rule: "Must not state an archetype classification as final with < 70% confidence without flagging uncertainty",
      trigger:
        "Archetype classification output when confidence_band is low or no_match",
      required_behavior:
        "Include: 'This classification is tentative (confidence: [band]). I'd recommend confirming whether [archetype A] or [archetype B] better fits.'",
      prohibited_behavior:
        "Presenting a low-confidence classification as definitive without the uncertainty flag",
    },
    {
      id: "AH-P0-3",
      rule: "Must not state a value magnitude without noting it is an unvalidated hypothesis",
      trigger:
        "Any numeric value claim in brief, responses, or artifact drafts",
      required_behavior:
        "Every numeric value claim must be accompanied by: 'This is an unvalidated hypothesis — dependent on P2 baseline evidence.' The value_magnitude_label field must be UNVALIDATED_HYPOTHESIS.",
      prohibited_behavior:
        "Stating any value figure as a validated projection at P0",
    },
    {
      id: "AH-P0-4",
      rule: "Must not reference competitor benchmarks as fact without citing source",
      trigger: "Any claim about industry benchmarks or competitor performance",
      required_behavior:
        "Benchmark claims must cite a specific seed-patterns-industry.ts entry (e.g., 'per industry pattern PAT-IND-003') or an uploaded document. Not from general knowledge.",
      prohibited_behavior:
        "Stating benchmark figures (e.g., 'industry average AHT is 6 minutes') without a pattern citation",
    },
  ] satisfies AntiHallucinationRule[],
};
```

---

## Document evolution

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-05-05 | Initial draft — all 21 fields, 6 workflow steps with full inner schema, 5 fixtures, 3 prohibited-prompt tests, TypeScript config | Claude Code |
