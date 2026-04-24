# File 08 · Agent-Fabric Per-Turn Contract Backlog

**Version:** 1.0 · April 24, 2026
**Owners:** Codex primary (infrastructure, retrieval, logging), Claude Code secondary (response rendering, citation UI, agent chat surfaces)
**References:** File 01 failure modes (esp. FM-8 pattern-based pressure-testing, FM-12 learning capture), File 02 pattern library architecture, File 03 knowledge layer architecture, File 04 four-zone surface design, existing `abarva-nexus-agent-spec.md` (Nexus identity)

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`. Confidence level noted where claims are inferred.

**Applies:** Agent Autonomy Charter (Section 18). Pre-decided items in Section 17 and File 01 Section 15 — don't re-ask.

---

## Section 1 · Why this file exists

AbarVa's core product claim is that four named agents — Nexus, Sentinel, Atlas, Steward — produce context-aware intelligence by composing pattern knowledge plus tenant data via the AbarVa Fabric on every conversational turn. Three crawler walks on April 23-24 (Jake, Dr. L, Marcus T) independently confirmed that this claim is currently false in execution. Nexus returned identical templated responses to different prompts. Sentinel returned the same canned deflection string across three semantically distinct queries, including one explicitly designed to escape structured output. Atlas silently swallowed free-text input without responding at all. Guided-choice flows produced differentiated responses because they are scripted, but the free-text agent layer that carries the "context-aware intelligence" claim is not wired.

File 04 specifies what the four agents feel like per zone (Nexus maestro-collegial, Sentinel research-rigorous, Atlas executive-concise, Steward operationally-terse). File 02 specifies the pattern library they read from. File 03 specifies the knowledge layer stores. What does not exist yet is the contract that binds all three together on every turn — the deterministic sequence of operations that must execute when an agent receives input, and the shape of what gets rendered back.

Without that contract, each agent surface has improvised its own pattern. The result is three different agents with three different failure modes. This file defines the contract. When Codex implements against it, every agent turn in every surface follows the same lifecycle. When Code renders against it, every agent response carries the same structural integrity — composed context, explicit citations, honest confidence signaling, logged feedback.

This file is the most demo-critical spec in the package. Without it, the "intelligence layer" claim is theater.

---

## Section 2 · How to use this file

This file is the agent runtime specification for AbarVa. It is read by:

**Codex** — primary implementer. Every agent invocation flows through the orchestrator defined here. Every retrieval call follows the Fabric contract defined in Section 7. Every Claude invocation follows the wrapper contract defined in Section 8. Every feedback-loop write follows Section 11.

**Claude Code** — consumer of the contract's rendered output. The citation grammar in Section 9, the honest-disclosure vocabulary in Section 10, and the response structure per agent in Section 5 define what the agent chat UI must render. Code also implements the cross-agent handoff affordances in Section 12.

**Content authors** — the voice contracts in Section 5 and the honest-disclosure vocabulary in Section 10 define how pattern observations, evidence citations, and confidence qualifiers must be worded so agents render them consistently.

**Crawler personas** — every persona walk tests this contract. If a persona's free-text prompt elicits a templated echo, the contract was not executed. The crawler findings in `crawler-persona-*-findings.md` files are the accountability check.

---

## Section 3 · The contract in one sentence, then unpacked

> Every agent turn assembles full context (tenant, user, program, phase, history, query), attaches to the AbarVa Fabric, receives composed intelligence (patterns with confidence, client datasets with provenance, prior turns with state), invokes Claude on client cloud with that composition plus the agent's role-specific system prompt, renders the response with explicit pattern citations and honest confidence signaling, and logs the turn to the feedback loop.

Eight operations. All eight execute on every turn. No shortcuts. The contract is not "best effort" — it is deterministic. If any operation fails, the turn surfaces the failure honestly rather than falling back to a templated string.

**Why all eight are non-negotiable:**

- Skip context assembly → agent behaves generically, can't reference this tenant's situation
- Skip Fabric attachment → agent has no pattern intelligence, responses are ungrounded
- Skip composition → retrieval results are dumped raw, not synthesized
- Skip Claude invocation with composed context → Claude generates from priors, not from AbarVa's IP
- Skip citation rendering → user can't verify claims, moat is invisible
- Skip confidence signaling → low-confidence assertions appear authoritative, credibility erodes
- Skip feedback logging → the flywheel doesn't spin, File 03's knowledge layer stops compounding
- Skip cross-agent handoff → maestro threading is broken, each zone feels like a different product

Each failure mode above has been directly observed in the current build. This contract fixes them at the architectural level.

---

## Section 4 · The per-turn lifecycle · eight stages

Every agent turn passes through these eight stages in order. Each stage has entry conditions, exit conditions, and failure semantics.

### 4.1 · Stage 1 · Intake

**What enters this stage:** Raw user input (free text, guided choice selection, or structured submission). Surface metadata (which agent, which zone, which surface). Session identifiers (tenant, user, program if applicable, phase if applicable).

**What this stage does:** Normalizes input. Classifies input shape (question, request for deliverable, pressure-test, pushback, thanks-and-move-on). Extracts referenced entities (program names, deliverable IDs, pattern IDs, stakeholder names). Flags ambiguity for downstream handling.

**What exits this stage:** A structured intake object: `{ raw_input, normalized_input, input_shape, referenced_entities, ambiguity_flags, surface_metadata, session_identifiers, turn_id }`.

**Failure semantics:** If input is malformed or empty, exit with `input_shape: 'empty'` and skip to Stage 8 with a short honest response. Do not fabricate intent.

**Status:** `MISSING`. Current implementation receives input and hands directly to a template. No structured intake object exists.

### 4.2 · Stage 2 · Context assembly

**What enters this stage:** The intake object from Stage 1.

**What this stage does:** Assembles the full context required for the turn, from five dimensions:

- **Tenant context:** current tenant id, tenant metadata (industry, size, posture), tenant's program portfolio, tenant's pattern history (which patterns have been surfaced for this tenant before), tenant's decision log
- **User context:** user id, user role (executive, operator, analyst, admin), user's permissions scope, user's recent activity in this surface
- **Program context:** if the turn is anchored to a program — program id, current phase, deliverable inventory and states, contradictions counter, stakeholder list, active patterns
- **Phase context:** if anchored to a phase — phase expectations, gate conditions, expected deliverables for this phase
- **Conversation context:** prior turns in this surface for this user, prior turns in this program across surfaces, user's stated preferences or constraints

**What exits this stage:** A composed context object with all five dimensions populated. Empty dimensions explicit (e.g., `program_context: null` if not program-anchored).

**Failure semantics:** If tenant context cannot be resolved (session binding broken per DR-04/05 from the remediation backlog), exit with an error that routes to sign-in rather than proceeding with null tenant. Null tenant context must never reach Claude.

**Status:** `MISSING`. Current implementation passes input to the agent with minimal context beyond surface metadata. No five-dimension context object exists.

### 4.3 · Stage 3 · Fabric attachment

**What enters this stage:** The intake object plus the context object.

**What this stage does:** Invokes the AbarVa Fabric (the retrieval pipeline from File 03) with:

- The user's query (normalized)
- The full context object
- The agent's role identity (Nexus, Sentinel, Atlas, or Steward)
- Retrieval parameters (top-k per store, confidence threshold, anonymization level)

The Fabric returns a composition: patterns matched, client datasets retrieved (tenant-scoped), prior turns relevant to this query, observations referenced, evidence sources cited. Each item carries confidence, provenance, and anonymization status.

**What exits this stage:** A `fabric_composition` object:

```
{
  patterns_matched: [
    { pattern_id, slug, tier, confidence, match_reason, provenance, anonymization_status }
  ],
  client_datasets: [
    { dataset_id, type, confidence, provenance, tenant_scoped: true }
  ],
  prior_turns: [
    { turn_id, timestamp, surface, summary, relevance_score }
  ],
  observations: [
    { observation_id, pattern_id, composite_tag, confidence, evidence_sources }
  ],
  retrieval_meta: {
    total_candidates, confidence_distribution, sparse_retrieval_flag
  }
}
```

**Failure semantics:** If retrieval returns zero high-confidence matches, set `retrieval_meta.sparse_retrieval_flag: true`. This flag propagates to Stage 6 response rendering where "evidence is thin" must be explicitly signaled. Do not hallucinate matches.

**Status:** `PARTIAL`. The registry, graph, and vector stores exist (per File 03). The retrieval pipeline exists for pattern matching. What's missing: the unified Fabric attachment contract that every agent uses, with the exact composition object shape above. Today, different agents invoke retrieval differently or not at all.

### 4.4 · Stage 4 · Composition

**What enters this stage:** The intake object, context object, and fabric_composition.

**What this stage does:** Synthesizes the three into a single composed prompt that will be passed to Claude in Stage 5. The composition is not a concatenation — it is structured to preserve provenance and confidence. The composed prompt contains:

- The agent's role identity and voice contract (per Section 5)
- The user's query with ambiguity flags surfaced
- The relevant context dimensions (only those that inform the response)
- The Fabric-matched patterns with explicit citation placeholders Claude can reference
- The client datasets with explicit tenant-scoping markers
- Prior turn summaries if relevant
- Explicit confidence and sparsity signals from retrieval_meta
- Rendering instructions (what sections the response should have, what must be cited)

**What exits this stage:** A structured prompt with the above sections, plus a `citation_registry` that maps citation placeholders to the actual patterns, datasets, and observations Claude can reference by id.

**Failure semantics:** If composition produces a prompt exceeding Claude's context window, truncate prior turns first, then lower-confidence patterns, then lower-relevance context dimensions. Never truncate the user's query or the agent's role contract.

**Status:** `MISSING`. No structured composition layer exists. Current implementations either pass raw input to Claude with a system prompt or return templated responses.

### 4.5 · Stage 5 · Claude invocation

**What enters this stage:** The composed prompt and citation_registry.

**What this stage does:** Invokes Claude on the client's cloud deployment (zero retention commitment, per design canon). The invocation uses the agent's role-specific system prompt (Section 5 below) plus the composed prompt from Stage 4. Claude generates a response that references composition elements via the citation placeholders.

**Invocation parameters per agent:**

| Agent | Model tier | Max tokens | Temperature | System prompt anchor |
|-------|-----------|------------|-------------|----------------------|
| Nexus | Opus-class | 4000 | 0.3 | Maestro-collegial, pressure-testing |
| Sentinel | Opus-class | 3000 | 0.2 | Research-rigorous, librarian-honest |
| Atlas | Sonnet-class | 2000 | 0.3 | Executive-concise, editorial |
| Steward | Sonnet-class | 2500 | 0.2 | Operationally-terse, quality-focused |

Nexus and Sentinel use Opus-class because they carry the heaviest reasoning load (program pressure-testing and pattern librarianship respectively). Atlas and Steward use Sonnet-class because their turns are shorter and more structured.

**What exits this stage:** A generation object containing Claude's response, the citation placeholders Claude used, token usage, latency, and any error signals.

**Failure semantics:** If Claude invocation errors (rate limit, timeout, client-cloud unavailable), route to Stage 8 with a honest error state ("My reasoning layer is temporarily unavailable. The question you asked is logged; I'll follow up when the layer is back. Nothing was lost."). Never fall back to a templated pseudo-response that implies the layer worked.

**Status:** `PARTIAL`. Claude invocation exists but without the composed-prompt discipline above. Current invocations often don't include composition elements, so responses are generic.

### 4.6 · Stage 6 · Response assembly

**What enters this stage:** Claude's generation, the citation_registry, the fabric_composition.

**What this stage does:** Assembles the final response object that will render in the UI. This includes:

- The response text with citation placeholders resolved to pattern/dataset/observation ids
- A structured list of citations (pattern slugs, dataset refs, observation ids) with link targets
- Confidence qualifiers inline (per Section 10 vocabulary)
- Sparsity signal if retrieval was thin ("evidence is thin; here's what we can say")
- Suggested follow-up actions (per agent voice — Nexus offers reframings, Sentinel offers drill-downs, Atlas offers decision paths, Steward offers next steps)
- Cross-agent handoff affordances if the turn crosses zones (per Section 12)

**What exits this stage:** A `rendered_response` object ready for the UI:

```
{
  response_text,
  citations: [
    { placeholder, target_type, target_id, target_slug, target_label, confidence }
  ],
  confidence_signal,
  sparsity_flag,
  follow_up_actions: [...],
  handoff_affordance: null | { to_agent, reason, context_carried }
}
```

**Failure semantics:** If Claude's generation references a citation placeholder not in the registry (hallucinated pattern), strip the placeholder and flag the response as `quality_issue: hallucinated_citation`. Never render hallucinated citations as real links.

**Status:** `MISSING`. Current rendering passes response text to UI without citation resolution or confidence signaling.

### 4.7 · Stage 7 · UI rendering

**What enters this stage:** The rendered_response object.

**What this stage does:** Code's responsibility. Renders the response in the agent chat UI per Section 9 citation grammar and Section 10 honest-disclosure vocabulary. Every citation renders as a clickable chip or pill linking to the referenced pattern/dataset/observation page. Confidence qualifiers render in a consistent typographic treatment. Sparsity signals render as editorial prose, not as error banners. Follow-up actions render as chips the user can click for next-turn input.

**What exits this stage:** A rendered DOM that the user sees.

**Failure semantics:** If citation targets are unreachable (pattern page 404, observation id not found — per the remediation backlog items DR-02 and PA-02), render the citation as text without a link but flag the citation with a `broken_target` class. Do not hide the citation; the user should see what was referenced even if the link is broken. Log the broken target to surface in the reporting protocol.

**Status:** `PARTIAL`. Basic rendering exists. Citation grammar, confidence treatment, and sparsity prose are not consistent across agents.

### 4.8 · Stage 8 · Feedback logging

**What enters this stage:** The complete turn object — intake, context, fabric_composition, composed_prompt, generation, rendered_response, user_feedback (if any).

**What this stage does:** Writes the turn to the knowledge layer's feedback store (per File 03). The write includes:

- Turn id, timestamp, surface, agent
- Tenant id, user id, program id, phase (all resolvable for later analytics)
- User's raw input and normalized input
- Fabric composition summary (which patterns matched at what confidence)
- Claude invocation summary (token usage, latency)
- Rendered response summary
- User feedback if the user clicked thumbs-up/down or followed up with a clarifying question
- Outcome tags (was a pattern promoted, was a decision made, was a deliverable produced)

**What exits this stage:** A confirmation that the turn was logged. The turn is now part of the tenant's history and feeds future retrievals.

**Failure semantics:** If the write fails, do not block the UI. Queue the turn for retry. Never lose a turn silently. Every turn must eventually reach the feedback store.

**Status:** `MISSING`. Current implementation does not log turns to a structured feedback store. This is the single biggest gap in the flywheel.

---

## Section 5 · Agent-specific per-turn variants

All four agents execute the same eight-stage lifecycle. What varies is the voice contract in Stage 5 and the response structure in Stage 6. This section defines each agent's specific behaviors.

### 5.1 · Nexus · Programs zone

**Voice contract (per File 04 and `abarva-nexus-agent-spec.md`):** Maestro-collegial. Peer-not-subordinate. Pressure-tests weak framings. Cites sources. Explicit about confidence. Doesn't flatter. Structured by default.

**Response structure in Stage 6:**

- Opens with direct engagement (no preamble, no "great question")
- Body is numbered or sectioned (threes are common — "three things worth pressure-testing")
- Each substantive claim carries an inline citation
- Closes with a follow-up action — either a reframing suggestion, a diagnostic question, or a next-step proposal
- Never ends with "let me know if you have any questions"

**Role-specific Stage 3 behavior:** Nexus retrieval prioritizes program-applicable patterns, stakeholder alignment patterns, and pressure-test heuristics. When a program is anchored, Nexus pulls the program's deliverable inventory, contradictions counter, and active patterns. When a phase is anchored, Nexus pulls gate conditions and expected deliverables.

**Role-specific Stage 5 system prompt anchor (partial):**

> You are Nexus, the maestro agent in the AbarVa Programs zone. You are a senior transformation partner, not an assistant. The user is running an enterprise AI program and you are their pressure-tester and co-thinker. Your job on this turn is to engage with their input substantively — push back if the framing is weak, cite the patterns and precedents that ground your response, be explicit about confidence, and close with a concrete next step. Never use flattery. Never pad the response. Never produce a response without at least one citation from the composition provided below. If the composition's retrieval_meta.sparse_retrieval_flag is true, say so plainly and describe what evidence we would need to answer more definitively.

**Crawler persona test for Nexus:** Marcus T (Apex CFO) sends: "Walk me through the derivation of the $180-240M owned-brand margin recovery estimate. What assumptions underpin the range? What's the confidence interval?" Expected behavior: Nexus retrieves the Morrison program context, pulls the estimation capability pattern (Tier 2, File 02), composes a response that (a) describes the derivation chain from SKU-level unit economics, (b) surfaces the range as a function of which assumptions hold, (c) states the confidence interval explicitly, (d) cites the specific estimation pattern and any peer decisions from the graph, (e) closes with "if you want to sharpen this further, the three questions that would move the most are X, Y, Z." If Nexus returns a templated response or a generic estimation answer, the contract was not executed.

### 5.2 · Sentinel · Intelligence zone

**Voice contract:** Research-rigorous. Librarian-honest. Lists evidence sources with counts and provenance. Distinguishes "authored from industry knowledge" vs "measured from customer outcomes." Admits "evidence is thin" when retrieval is sparse. Knows the library deeply.

**Response structure in Stage 6:**

- Opens by referencing the specific pattern or library slice the query matched
- Body is evidence-forward — cited observations, evidence counts, confidence per claim
- When evidence is thin, says so as the first substantive sentence, not buried
- Closes with either a drill-down offer ("I can walk you through the two strongest citations") or a related-pattern pointer
- Never generates patterns or observations — only cites existing ones

**Role-specific Stage 3 behavior:** Sentinel retrieval prioritizes pattern matching by semantic similarity and structural match. When a pattern is anchored (user viewing a specific pattern page), Sentinel pulls related patterns via `RELATED_TO` edges and observations via `CONTRIBUTED_BY` edges. When a tenant is anchored, Sentinel filters observations by `APPLICABLE_TO_TENANT` and flags which observations came from this tenant vs cross-tenant composite.

**Role-specific Stage 5 system prompt anchor (partial):**

> You are Sentinel, the pattern librarian in the AbarVa Intelligence zone. You are a research-rigorous guide to the pattern library. Your job on this turn is to answer the user's query by citing the patterns, observations, and evidence sources that bear on it. Never invent a pattern. Never inflate evidence. If the retrieval composition below is sparse, your first sentence must say "evidence on this is thin" and describe what we do have. Distinguish patterns authored from industry knowledge from observations measured from customer outcomes. Cite with pattern slug, observation id, or evidence source — never uncited claims. Close with either a drill-down offer or a related-pattern pointer.

**Crawler persona test for Sentinel:** Dr. L (Meridian CMIO) sends: "I'm running Ambient Clinical transformation. Which patterns in your library actually apply to this kind of clinical workflow automation, and what do they tell me about likely failure modes?" Expected behavior: Sentinel retrieves the Ambient Intelligence & Clinical Value Chain pattern (per `intelligence-layer-pattern-design-pack-FULL.md`), any related patterns (AI Governance, Vendor Sprawl if relevant), composes a response that (a) names the patterns with confidence scores, (b) summarizes the failure mode evidence from each pattern's Part C Detection section, (c) cites specific observations with composite tags, (d) honestly distinguishes industry-authored content from measured outcomes, (e) closes with "I can walk you through the two strongest citations if you want to go deeper." If Sentinel returns the current templated deflection ("Heard. Free-text queries route through the Ask layer..."), the contract was not executed.

### 5.3 · Atlas · Control Tower zone

**Voice contract:** Executive-concise. Headlines. Short lines. Decision-oriented. Editorial analysis, not status labels. Says what matters, names the action.

**Response structure in Stage 6:**

- Opens with the headline — what matters right now
- Body is two or three short paragraphs, each paragraph one pressure and one recommended action
- Dollar amounts always carry context (per month, projected, realized)
- Cites the underlying program, deliverable, or pattern by name
- Closes with a single decision prompt — "decide by [date]" or "choose: pursue / defer / reject"
- Never exceeds 150 words total unless the user explicitly asks for depth

**Role-specific Stage 3 behavior:** Atlas retrieval prioritizes portfolio-level signals — pressure cards, unowned risks, program health indicators, spend trajectory. When a pressure card is anchored, Atlas pulls the underlying program, related patterns, and prior decisions on this pressure. Atlas retrieval is cross-program within a tenant, not single-program.

**Role-specific Stage 5 system prompt anchor (partial):**

> You are Atlas, the Control Tower agent in the AbarVa Tower zone. You are an executive editor — you see the portfolio, you name what matters, you recommend the action. Your job on this turn is to translate the composition below into a response a CIO can act on in under 30 seconds. Use headlines. Short lines. Cite dollar amounts with context. Never exceed 150 words. Close with a single decision prompt. Never produce a generic status summary.

**Crawler persona test for Atlas:** From Tower, user clicks "hand to Atlas" on the $522K/mo ambient-overlap pressure card. Atlas receives: intake with pressure_card_id, context with program_id (Morrison or Ambient Clinical depending on tenant), fabric_composition with Ambient Intelligence pattern and vendor-overlap heuristics. Expected response: headline ("Three ambient tools, one workflow, $522K overlap"), two paragraphs naming the decision and the path to resolve, decision prompt ("Rationalize to one vendor by May 15 or retain all three pending Q3 review"). If Atlas echoes the scripted opening string without engaging the pressure card's specifics, the contract was not executed.

### 5.4 · Steward · Admin zone

**Voice contract:** Operationally-terse. Quality-focused. Attentive to cross-program health, connector states, audit coverage. Surfaces issues before they become crises.

**Response structure in Stage 6:**

- Opens with the specific operational status the query bears on
- Body is list-structured — operations in progress, anomalies detected, actions required
- Cites specific connector states, audit records, quality scores
- Closes with a prioritized action list — "fix first: A. fix next: B. monitor: C."
- Never speculates about business outcomes; stays in the operational layer

**Role-specific Stage 3 behavior:** Steward retrieval prioritizes operational signals — connector health, provisioning queue, audit records, quality scores per deliverable, cross-program anomalies. Steward has broader cross-tenant visibility than the other agents because its role is operational integrity.

**Role-specific Stage 5 system prompt anchor (partial):**

> You are Steward, the operational agent in the AbarVa Admin zone. You are an operations editor — you see the connector health, you flag anomalies, you prioritize actions. Your job on this turn is to translate the composition below into an operational status plus a prioritized action list. Terse is fine. Never speculate about business outcomes. Stay in the operational layer. Close with "fix first / fix next / monitor" ranking.

**Crawler persona test for Steward:** Admin user asks: "Which connectors are degrading and what's the priority order to fix?" Expected behavior: Steward retrieves connector health data, cross-references which programs depend on which connectors, composes a response with degraded connectors named, priority tied to program dependency severity, and a fix-first/fix-next/monitor ranking. If Steward returns a generic "all connectors are healthy" or a templated response, the contract was not executed.

---

## Section 6 · Context assembly specification (Stage 2 deep)

Context assembly is where the product's intelligence begins. If this stage is weak, the rest of the contract cannot recover.

### 6.1 · Tenant context

**Required fields:**
- `tenant_id` (authoritative — if null, route to sign-in per DR-04)
- `tenant_slug` (for URL construction)
- `tenant_industry` (retail, healthcare, financial_services, energy)
- `tenant_size` (employee count, revenue range)
- `tenant_posture` (mature, emerging, regulated)
- `tenant_program_portfolio` (list of programs with phase, sponsor, status)
- `tenant_pattern_history` (patterns previously surfaced for this tenant)
- `tenant_decision_log` (recent decisions across programs)

**Retrieval source:** Registry + Postgres per File 03. Cached per session; invalidated on program state change.

**Priority:** `P0 · demo-critical`. Without tenant context, agents cannot produce tenant-aware responses. Current state: `MISSING`.

### 6.2 · User context

**Required fields:**
- `user_id`
- `user_email`
- `user_role` (executive, operator, analyst, admin, investor)
- `user_permissions_scope` (which programs, which deliverables)
- `user_persona_profile` (if set — e.g., Dr. L is a CMIO-persona on Meridian demo)
- `user_recent_activity` (last N turns across surfaces)

**Retrieval source:** Clerk (identity) + Postgres (permissions, activity).

**Priority:** `P0 · demo-critical`. User role affects what agents surface and how. Current state: `PARTIAL` — user identity resolved, role-based surfacing not wired.

### 6.3 · Program context (if applicable)

**Required fields:**
- `program_id`
- `program_name`
- `program_slug`
- `current_phase` (1-5)
- `phase_entry_date`
- `sponsor_of_record` (stakeholder id + role)
- `deliverable_inventory` (list with id, tier, phase, status, quality_score)
- `contradictions_counter` (count, attributed dollar amount if relevant)
- `active_patterns` (patterns currently cited in this program's deliverables)
- `stakeholder_list` (per File 01 FM-3, FM-4)

**Retrieval source:** Graph + Postgres. Program detail page queries this same object.

**Priority:** `P0 · demo-critical`. Agents cannot pressure-test program decisions without program context. Current state: `PARTIAL` — data exists, not assembled as a single context object.

### 6.4 · Phase context (if applicable)

**Required fields:**
- `phase_number` (1-5)
- `phase_name` (Intake, Diagnosis, Decision, Execution, Outcome)
- `phase_gate_conditions` (what must be true to advance to next phase)
- `expected_deliverables_for_phase`
- `patterns_typically_active_at_this_phase`

**Retrieval source:** Registry (phase definitions) + graph (per-program state).

**Priority:** `P0 · demo-critical`. Phase-aware responses distinguish AbarVa from generic LLM surfaces. Current state: `MISSING`.

### 6.5 · Conversation context

**Required fields:**
- `surface_conversation_history` (prior turns in this surface for this user, up to N turns)
- `cross_surface_conversation_history` (relevant turns from other surfaces in this program)
- `stated_preferences` (user-declared constraints — e.g., "focus on CFO-relevant view")

**Retrieval source:** Feedback store (per Stage 8) + session cache.

**Priority:** `P1 · seed-critical`. Conversation context enables coherent multi-turn interactions. Current state: `MISSING`. Without this, agents are one-shot — which is why Dr. L's third prompt produced the same response as her first.

---

## Section 7 · Fabric retrieval contract (Stage 3 deep)

The Fabric is the retrieval pipeline from File 03. This section specifies the contract between agents and Fabric.

### 7.1 · Invocation shape

Every Fabric call from an agent uses this shape:

```
fabric.retrieve({
  query_normalized: string,
  context: ContextObject,
  agent_role: 'nexus' | 'sentinel' | 'atlas' | 'steward',
  retrieval_params: {
    top_k_patterns: number,  // default 5
    top_k_observations: number,  // default 10
    top_k_prior_turns: number,  // default 3
    confidence_floor: number,  // default 0.6
    anonymization_level: 'tenant_scoped' | 'anonymized' | 'unrestricted',
    force_fresh: boolean  // default false; cache by default
  }
})
```

### 7.2 · Return shape

Fabric returns the `fabric_composition` object specified in Section 4.3. Every element in every list carries:

- An id (pattern_id, observation_id, turn_id)
- A confidence score (0.0-1.0)
- A provenance marker (authored | observed | measured | composite)
- A match reason (semantic | structural | tenant_match | recency)
- An anonymization status (tenant_scoped | anonymized | public)

### 7.3 · Sparsity contract

When retrieval returns fewer than 3 patterns above the confidence floor, Fabric sets `retrieval_meta.sparse_retrieval_flag: true` and includes in the composition:

- The best below-floor matches with their actual confidence (for honest disclosure)
- The gap description — "no high-confidence patterns in the library for this query at tenant scope"
- A suggested broadening — "if we relax to cross-tenant anonymized patterns, here's what emerges"

Claude is instructed to surface this flag in the response (Section 10 vocabulary).

### 7.4 · Tenant isolation contract

When `anonymization_level: 'tenant_scoped'`, Fabric returns only patterns and observations authored or contributed by this tenant, plus public patterns. Never returns observations or datasets from other tenants, even anonymized. This is enforced at the retrieval layer, not at the rendering layer — the data never reaches Claude.

When `anonymization_level: 'anonymized'`, Fabric may return cross-tenant observations with tenant names redacted but with industry, size, and posture markers preserved.

When `anonymization_level: 'unrestricted'` (admin/Steward only), Fabric returns full cross-tenant data. Only Steward agent invocations may use this level.

**Priority:** `P0 · demo-critical`. Tenant isolation failures observed in crawler walks (Jake, Marcus T) prove this contract is not enforced in the current build. Current state: `MISSING`.

### 7.5 · Citation placeholder contract

For every pattern, observation, or dataset in the composition, Fabric generates a citation placeholder like `{{cite:pattern:ambient-intelligence-clinical-value-chain}}`. The composed prompt in Stage 4 contains these placeholders, and Claude is instructed to use them verbatim when citing. The citation_registry in Stage 4 maps each placeholder to its resolution target (URL, confidence, anonymization status).

This prevents hallucinated citations. If Claude generates `{{cite:pattern:invented-pattern-name}}` and that placeholder is not in the registry, Stage 6 strips it and flags the response.

---

## Section 8 · Claude invocation contract (Stage 5 deep)

### 8.1 · Deployment

Claude runs on the client's cloud deployment, not AbarVa's. Zero retention commitment is architectural — the client's cloud does not log prompts or responses to AbarVa's side. Per File 03, this is the Fabric's "the moat is the composition; Claude is the compute" positioning.

For composite demo tenants, Claude runs on AbarVa's shared inference endpoint with zero-retention configured — same contract, different deployment.

### 8.2 · System prompt structure

Every agent invocation assembles a system prompt with four sections:

- **Role anchor** — the agent's identity and voice contract (per Section 5 above)
- **Composition instructions** — how to use the fabric_composition that follows
- **Citation rules** — use placeholders verbatim, never invent citations
- **Response structure rules** — per the agent's Section 5 response structure

The system prompt is deterministic per agent — it does not vary by turn. The user-message slot contains the composed prompt from Stage 4.

### 8.3 · Retry and error handling

- **Rate limit:** backoff and retry once with jitter
- **Timeout (>30s):** surface "My reasoning layer is slow right now; retrying" to user, retry once, then route to honest error
- **5xx error:** retry once, then route to honest error
- **Content filter trigger:** never fall back silently; surface "the response couldn't be generated; your question is logged and I'll follow up"

Errors are logged to the feedback store per Stage 8. Never silently swallow failures.

### 8.4 · Token budget per agent

Per Section 5.1-5.4 table. Budgets are soft — if a composition requires more context, Stage 4 truncates lower-priority elements rather than failing. Never truncate the user's query or the role anchor.

---

## Section 9 · Citation grammar (rendering)

Citations are the visible evidence that the Fabric composed context. Every substantive claim in an agent response must carry a citation. This section specifies the citation grammar.

### 9.1 · Citation types

- **Pattern citation** — references a pattern in the library. Renders as a pill with the pattern slug: `[pattern: ambient-intelligence-clinical-value-chain]`
- **Observation citation** — references a specific observation within a pattern. Renders as superscript: `[E3]` where the reference number resolves to the observation id
- **Evidence-source citation** — references a source document, study, or benchmark. Renders as superscript: `[E7]`
- **Prior-turn citation** — references an earlier turn in this conversation or in the program. Renders inline: `(earlier you said: X)`
- **Program citation** — references another program (same tenant or cross-tenant anonymized). Renders as pill: `[program: morrison-owned-brand-margin-recovery]`
- **Deliverable citation** — references a deliverable. Renders as pill: `[deliverable: D17]`

### 9.2 · Click behavior

Every citation is clickable. Clicking navigates to the referenced page (pattern detail, observation drawer, evidence source page, program detail, deliverable detail). Links follow the URL structure specified in File 04 per zone.

### 9.3 · Confidence display on citations

Each citation carries a subtle confidence indicator — a small confidence bar or mono-label next to the pill:

- `[pattern: ambient-intelligence · HIGH]`
- `[pattern: adjacent-analytics-modernization · MEDIUM]`
- `[observation: E7 · LOW]`

High/Medium/Low maps to confidence scores: ≥0.8 HIGH, 0.6-0.8 MEDIUM, <0.6 LOW. LOW confidence requires explicit honest-disclosure prose (Section 10) before the citation is rendered.

### 9.4 · Broken target handling

If a citation target is unreachable (404, unresolved id), render as plain text styled with a subtle `broken` class. Do not hide the citation. Log the broken target for remediation (per the crawler-re-run protocol).

---

## Section 10 · Honest-disclosure vocabulary

Every agent response uses a consistent vocabulary for confidence and honest acknowledgment of limits. This section is the vocabulary reference.

### 10.1 · High confidence

- "Direct precedent — pattern X, observation Y."
- "Measured across N programs."
- "Benchmarked against [source]."

### 10.2 · Medium confidence

- "Inferred from adjacent [pattern/industry]. Direct evidence is limited."
- "Pattern suggests, though we haven't seen this specific case."
- "Reasonable extrapolation from [source]; applies if [assumption]."

### 10.3 · Low confidence

- "This is a reasoned guess — we don't have direct evidence."
- "The pattern library doesn't cover this case; here's the closest analog."
- "I don't have strong data on this. Want me to tell you what we'd need to answer better?"

### 10.4 · Sparse retrieval signal

When the retrieval meta flag is set, the response opens with one of:

- "Evidence on this is thin — here's what we can say."
- "The library doesn't have strong patterns for this. What we do have is [X]."
- "I can't answer this from patterns alone. Do you want me to reason from first principles instead?"

Never hide a sparse retrieval. Never pad a thin response with generic filler.

### 10.5 · Industry-authored vs measured-outcome distinction

When citing an observation:

- "Authored from industry knowledge (not measured outcomes): [claim]."
- "Measured in N programs across [tenants]: [claim]."
- "Composite observation (aggregated from multiple tenants): [claim]."

This distinction is required — conflating authored and measured erodes trust with rigorous evaluators (Dr. L, Marcus T). The canonical disclaimer remains: *"Pattern observations are authored from industry knowledge, not measured outcomes from deployed customers. Every observation card carries a 'Composite' tag."*

### 10.6 · When Claude can't help on this turn

- "That's outside what AbarVa tracks. [Brief description of scope.]"
- "I don't have access to that data in the current composition. Want me to flag it for the program team?"
- "The question is worth asking but the answer lives outside the pattern library. Try [alternate path]."

Never fabricate. Never apologize excessively. Never refuse without offering a path.

---

## Section 11 · Feedback logging contract (Stage 8 deep)

### 11.1 · What gets logged

Per Section 4.8, every turn writes a record to the feedback store. The record schema:

```
{
  turn_id: uuid,
  timestamp: ISO8601,
  tenant_id, user_id, program_id?, phase_number?, surface, agent,
  raw_input, normalized_input, input_shape,
  fabric_composition_summary: {
    patterns_matched: [{ pattern_id, confidence }],
    observations_cited: [observation_id],
    datasets_used: [dataset_id],
    sparse_retrieval_flag: boolean
  },
  claude_invocation: {
    model, input_tokens, output_tokens, latency_ms, error: null | string
  },
  rendered_response: {
    response_text_hash,
    citations: [{ target_type, target_id }],
    confidence_signal,
    follow_up_actions_offered: [...]
  },
  user_feedback: {
    thumbs_up_down: null | 'up' | 'down',
    follow_up_turn_id: null | uuid,
    dwell_time_ms: number,
    clicked_citations: [target_id],
    clicked_follow_up_action: null | action_id
  } | null,
  outcome_tags: [string]
}
```

### 11.2 · Write policy

- Every turn writes immediately on Stage 6 completion (before Stage 7 rendering)
- User feedback (Section 11.1 `user_feedback`) is appended asynchronously when the user provides it
- Writes are idempotent by turn_id
- If write fails, retry with exponential backoff; never lose a turn silently

### 11.3 · Read policy

- Turns are readable by tenant_id scope (tenant_isolation enforced at the data layer)
- Analytics queries (e.g., "how often did pattern X get cited at confidence > 0.8") run against this store
- The feedback loop — turns inform future retrievals — queries prior turns in Stage 6.5 context assembly

### 11.4 · Retention

- Per-tenant retention policy set per tenant contract
- For composite demo tenants, retain indefinitely (training data for the flywheel)
- For real customers, respect contractual retention (default 24 months)

**Priority:** `P0 · demo-critical` for the write layer (without it, the flywheel doesn't spin). `P1 · seed-critical` for the read layer (without it, multi-turn coherence is broken). Current state: `MISSING` for both.

---

## Section 12 · Cross-agent handoff (maestro threading)

A user's work often spans agents. They start in Programs with Nexus, reference a pattern that opens Sentinel, see a pressure card that hands to Atlas. The maestro thread is the continuity across agents.

### 12.1 · Handoff trigger

An agent can offer a handoff in Stage 6 response assembly when:

- The user's query is better served by another agent (e.g., user in Programs asks a pattern-library question → Nexus offers handoff to Sentinel)
- The response references cross-zone content (e.g., Atlas references a program detail → offer handoff to Nexus)
- The user explicitly requests ("ask Sentinel about this")

### 12.2 · Handoff affordance

In the rendered response, a handoff renders as an explicit button or chip:

> "Hand to Sentinel → open Ambient Intelligence pattern"

Clicking the affordance:
- Opens the target agent's surface (Sentinel in Intelligence zone)
- Preserves the conversation context — the target agent sees the prior turns that led to the handoff
- The target agent's opening turn acknowledges the handoff: "Nexus passed me the Ambient Intelligence thread — here's what I can add..."

### 12.3 · Context carry

When a handoff executes, the target agent's Stage 2 context assembly includes a `handoff_context` field:

```
{
  from_agent: 'nexus',
  from_surface: 'programs/{program_id}',
  reason: 'pattern-library question surfaced during program review',
  prior_turns: [last 3 turns summary],
  user_explicit_request: false
}
```

The target agent uses this to open coherently.

### 12.4 · No silent handoff

Handoffs are always explicit and user-initiated (via the affordance). An agent never silently invokes another agent's behavior — that would break the per-zone voice contracts.

**Priority:** `P1 · seed-critical`. Handoffs are a demo-quality signal — they make the four agents feel like one product. Current state: `MISSING`. The "hand to Nexus ✱" chip Dr. L saw in Sentinel is a no-op today.

---

## Section 13 · Error handling per stage

Summary table of failure semantics:

| Stage | Failure type | Semantics |
|-------|-------------|-----------|
| 1 Intake | Empty/malformed input | Exit with input_shape:'empty', skip to Stage 8 log, render short honest acknowledgment |
| 2 Context | Tenant unresolved | Route to sign-in. Never proceed with null tenant. |
| 2 Context | User role missing | Default to most restrictive scope, flag for admin review |
| 3 Fabric | Retrieval error | Retry once; if fails, proceed with empty composition and sparse_flag:true |
| 3 Fabric | Sparse result | Set sparse_flag:true, surface in response per Section 10.4 |
| 4 Composition | Context window overflow | Truncate per priority order; log the truncation |
| 5 Claude | Rate limit | Backoff + retry once; if fails, honest error |
| 5 Claude | Timeout | Retry once; if fails, honest error |
| 5 Claude | Content filter | Honest error; never silent fallback |
| 6 Assembly | Hallucinated citation | Strip citation; flag response with quality_issue |
| 7 Rendering | Broken citation target | Render as text with broken class; log broken target |
| 8 Logging | Write failure | Queue for retry; never lose turn silently |

Every error path reaches Stage 8 logging. Errors are first-class data, not exceptions to hide.

---

## Section 14 · State persistence rules

### 14.1 · Per-surface persistence

Conversation state persists per surface. User's prior turns in Programs/Nexus are readable by Nexus on future turns in Programs. User's prior turns in Intelligence/Sentinel are readable by Sentinel. Crossing surfaces does not carry state by default (preserves zone voice separation).

### 14.2 · Program-anchored persistence

When a surface is anchored to a specific program, conversation state persists at the program level. Multiple users on the same program see each other's turns (if permissions allow). Nexus can reference "your colleague asked X two days ago" if appropriate.

### 14.3 · Tenant-switch reset

When the user switches tenants (when this becomes possible — per DR-11), conversation state does not carry across tenants. Reset on tenant boundary.

### 14.4 · Handoff carry

Explicit handoffs (Section 12) carry the last N turns (default 3) from source surface to target. This is the exception to per-surface isolation.

**Status:** `MISSING`. Current implementation has no persistence layer. Each turn is stateless.

---

## Section 15 · Per-turn instrumentation and observability

### 15.1 · What must be observable

Every stage of the per-turn lifecycle emits observability signals:

- Stage latency (p50, p95, p99 per stage per agent)
- Stage error rates per agent
- Fabric retrieval sparsity rate per tenant per agent
- Claude invocation success rate per agent per model tier
- Citation rendering success rate (fraction of citations that resolve to valid targets)
- User feedback signals (thumbs rate, dwell time, follow-up rate, citation click-through rate)

### 15.2 · Where signals go

- Application logs (structured JSON per stage)
- Metrics store (time-series for latency and rates)
- Feedback store (per-turn records for analytics)
- Alerting (error rate thresholds, citation resolution failures, sparsity spikes)

### 15.3 · Admin surfacing

Steward in the Admin zone has access to observability dashboards for the full turn lifecycle. Quality score calculations draw from these signals. When an agent's quality degrades (citation failures, hallucination flags, user thumbs-down rate), Steward surfaces it.

**Priority:** `P1 · seed-critical`. Without observability, we can't tell the contract is actually executing. Current state: `MISSING`.

---

## Section 16 · Current state and gaps — summary

| Capability | Status | Priority | Owner |
|-----------|--------|----------|-------|
| Stage 1 Intake (structured object) | MISSING | P0 | Codex |
| Stage 2 Context assembly (5 dimensions) | MISSING | P0 | Codex |
| Stage 3 Fabric attachment (unified contract) | PARTIAL | P0 | Codex |
| Stage 4 Composition (structured prompt) | MISSING | P0 | Codex |
| Stage 5 Claude invocation (per-agent system prompts) | PARTIAL | P0 | Codex |
| Stage 6 Response assembly (citations resolved) | MISSING | P0 | Codex + Code |
| Stage 7 UI rendering (citation grammar, confidence) | PARTIAL | P0 | Code |
| Stage 8 Feedback logging | MISSING | P0 | Codex |
| Nexus voice contract in production | PARTIAL | P0 | Code (system prompt) |
| Sentinel voice contract in production | PARTIAL | P0 | Code |
| Atlas voice contract in production | PARTIAL | P1 | Code |
| Steward voice contract in production | MISSING | P1 | Code |
| Context dim 1 Tenant | MISSING | P0 | Codex |
| Context dim 2 User | PARTIAL | P0 | Codex |
| Context dim 3 Program | PARTIAL | P0 | Codex |
| Context dim 4 Phase | MISSING | P0 | Codex |
| Context dim 5 Conversation | MISSING | P1 | Codex |
| Sparsity signal rendering | MISSING | P0 | Code |
| Citation click-through to resolving targets | PARTIAL | P0 | Code |
| Cross-agent handoff affordances | MISSING | P1 | Code + Codex |
| Feedback store write path | MISSING | P0 | Codex |
| Feedback store read path | MISSING | P1 | Codex |
| Observability dashboards | MISSING | P1 | Codex |

Aggregate: 21 capabilities, zero BUILT, nine PARTIAL, twelve MISSING. Of the MISSING, eleven are P0. This file defines what "built" means for each.

---

## Section 17 · Pre-decided items — don't re-ask

In addition to File 01 Section 15 (which applies globally), these items are settled for this file:

- **Eight-stage lifecycle:** non-negotiable. Every agent turn passes through all eight stages. No shortcuts.
- **Four agents, four voices:** Nexus maestro-collegial, Sentinel research-rigorous, Atlas executive-concise, Steward operationally-terse. See File 04 and `abarva-nexus-agent-spec.md`.
- **Retrieval every turn:** non-negotiable. No agent responds without Fabric composition.
- **Citation required:** every substantive claim carries a citation. Uncited assertions are a rendering bug.
- **Sparsity surfaced honestly:** when retrieval is thin, the response says so as its first substantive sentence.
- **Industry-authored vs measured-outcome distinction:** always maintained in citations and observations. Conflating them is a rendering bug.
- **Tenant isolation enforced at retrieval layer:** not at rendering. Cross-tenant data never reaches Claude unless anonymization_level is explicitly set.
- **Feedback logged on every turn:** non-negotiable. No silent turn loss.
- **No templated fallbacks:** if the contract fails, surface the failure honestly. Never return a canned deflection string.
- **Handoffs explicit:** cross-agent handoffs are always user-initiated via affordance. No silent agent swapping.
- **Claude on client cloud:** zero retention. The Fabric is the moat; Claude is the compute.
- **Model tier per agent:** Nexus + Sentinel on Opus-class; Atlas + Steward on Sonnet-class. See Section 5.

---

## Section 18 · Agent Autonomy Charter (for this file)

This charter governs how Codex and Claude Code execute this file's backlog. It supersedes ad-hoc permission-seeking for changes within the declared scope.

### 18.1 · Autonomous authority — self-authorize and merge

Within the scopes listed below, Codex and Claude Code are authorized to:

- Open PRs
- Self-review for correctness against acceptance criteria
- Merge to main after CI passes and self-review is satisfied
- Deploy to production if the CI pipeline includes an auto-deploy stage

**Codex self-authorized scopes:**
- Implementing the eight-stage lifecycle infrastructure (Stages 1-6 and 8)
- Wiring the Fabric retrieval contract per Section 7
- Implementing Claude invocation wrappers per Section 8
- Implementing the feedback store per Section 11
- Adding per-stage instrumentation per Section 15
- Writing tests for any of the above
- Migrations to support new schema elements (context objects, feedback records)
- Bug fixes to existing retrieval, Clerk session, or tenant-isolation code

**Claude Code self-authorized scopes:**
- Implementing citation grammar rendering per Section 9
- Implementing honest-disclosure vocabulary in copy per Section 10
- Implementing handoff affordances per Section 12
- Wiring agent chat UIs to the Stage 6 rendered_response contract
- Adjusting voice-contract rendering per Section 5 for each agent
- Strip dev artifacts, fix broken targets per Stage 7 failure semantics
- Accessibility improvements to any agent chat UI

### 18.2 · Requires Anand sign-off before merge

The following changes do not fall under autonomous authority and require explicit approval:

- Changes to the eight-stage lifecycle structure itself (e.g., adding or removing a stage)
- Changes to the voice contracts for any agent (Section 5)
- Changes to the pre-decided items in Section 17
- Changes to the Agent Autonomy Charter itself
- New agents beyond the four specified
- Changes to the Claude zero-retention deployment commitment
- Changes that would affect pricing, contractual language, or investor-facing claims
- Changes to the canonical disclaimers (per File 01 Section 15)

### 18.3 · Reporting protocol (per handoff Part 5)

After every cycle, each agent produces a completion report using the requested-vs-completed matrix format. No aggregate percentages. No silent deferrals. Partial acceptable if declared.

For this file specifically, the matrix columns are:

- Item ID (from Section 16 table)
- Requested (from acceptance criteria)
- Actual state (COMPLETE / PARTIAL / DEFERRED / NOT STARTED)
- PR reference
- Crawler persona test result (PASS / FAIL / NOT YET TESTED)
- Notes

### 18.4 · PR commit discipline

Every PR references File 08 and the failure mode(s) it addresses from File 01. Commit messages include `addresses-F08-S{section}` where section is the relevant section of this file, and `addresses-FM-{n}` from File 01 where applicable.

### 18.5 · Escalation paths

- **Blocked by missing spec:** flag in the PR, proceed with the simplest reasonable interpretation, note the assumption in the PR description. Anand reviews the assumption in the merge.
- **Blocked by contradiction between files:** flag the contradiction explicitly, proceed per File 01 (which supersedes) unless the contradiction is in File 08, in which case halt and escalate.
- **Blocked by technical unknown:** timebox investigation to 30 minutes; if unresolved, open a PR with a minimal workaround that preserves the contract's intent, and note the unknown for follow-up.

### 18.6 · Definition of done

An item from Section 16's table is DONE when:

- Implementation matches the acceptance criteria for that item
- Tests cover the contract specified (unit + integration)
- At least one crawler persona test passes for the relevant agent
- No crawler persona test fails because of this item
- PR is merged to main and deployed
- Completion report entry written per Section 18.3

### 18.7 · Collaboration between Codex and Claude Code

Items spanning both agents (e.g., Stage 6 Response assembly is joint) follow the integration contracts in the April 24 remediation handoff Part 4. Owner of record on the item (per Section 16 table) leads; the secondary agent reviews.

If the integration seam is unclear, the owner of record drafts a short interface spec (JSON shape + API contract), posts it, and the secondary agent reviews and signs off within one working cycle.

---

## Section 19 · Continuous Execution Protocol

This section governs how agents maintain state, track progress, and avoid stalling mid-cycle. It addresses a specific observed failure mode: agents that wake up, execute a few items, then go quiet until a human prompts them again. That failure wastes cycle time and erodes the trust that agents can operate autonomously.

The protocol has five mechanisms. All five are non-negotiable for any cycle executed under this file.

### 19.1 · External state file (memory persistence)

**The file:** `CYCLE_STATE.md` lives at the repo root. It is the authoritative record of cycle position — not the agent's context window, not Anand's memory, not the PR history alone. The file itself.

**Required schema:**

```
# Cycle State · [Cycle Name / ID]

## Meta
- Cycle started: [ISO timestamp]
- Cycle owner: [code | codex | both]
- Cycle scope: [which files / backlog items this cycle is closing]
- Cycle target completion: [date, or "open-ended"]

## Committed queue (ordered — do not reorder without updating this file)
1. [ITEM_ID] — [one-line description]
2. [ITEM_ID] — [one-line description]
3. ...

## Current position
- Current item: [ITEM_ID]
- Current step within item: [step N of M]
- Started item at: [timestamp]
- Expected PR ETA: [timestamp or "unknown"]

## Complete this cycle
- [ITEM_ID]: [PR ref] — [merged timestamp]
- [ITEM_ID]: [PR ref] — [merged timestamp]

## Blocked or escalated
- [ITEM_ID]: [reason] — [escalation timestamp] — [awaiting: what]

## Notes and discoveries
- [Timestamp]: [Any surprise, discovered dependency, or scope change during this cycle]

## Last status emission
- [ISO timestamp]
```

**Reading protocol:**

At the start of every session — before any other tool call or any other action — the agent reads `CYCLE_STATE.md`. If the file does not exist, the agent's first action is to create it with an empty state.

**Writing protocol:**

The agent updates `CYCLE_STATE.md` after every meaningful unit of work: every PR merged, every item moved to blocked, every item added to the queue, every status emission (Section 19.3). Updates are atomic — the agent writes the full file, not just a delta.

**Session close protocol:**

Before the agent ends a session (whether by user signal, by cycle completion, or by explicit stop), the agent pastes the full current contents of `CYCLE_STATE.md` into its final turn. This is the last artifact of every session.

**Priority:** `P0 · demo-critical`. Without this file, cycle continuity is dependent on the agent's context window, which is unreliable. Current state: `MISSING`.

### 19.2 · Batch commitment

At the start of every cycle, the agent writes the committed queue to `CYCLE_STATE.md`. This queue is binding for the cycle. Items execute in order. Reordering requires an explicit note in the "Notes and discoveries" section with justification.

The commitment format is explicit:

> "I am committing to close items [X, Y, Z] in this order. Cycle target: [date or open-ended]. Scope boundaries: [what's in, what's not in this cycle]."

This commitment gets written to `CYCLE_STATE.md` under the `Committed queue` section and echoed in the agent's first status emission.

**Why this matters:** Without explicit batch commitment, each PR feels to the agent like a complete unit. The agent finishes a PR and stops because there's no visible queue. With explicit commitment, the agent knows it has N more items to close and the default is to continue.

**Reordering rules:**
- Reordering for technical dependency reasons is allowed — note in "Notes and discoveries"
- Reordering because an item "feels more interesting" or "looks quicker" is not allowed
- Adding items mid-cycle requires explicit approval per Section 18.2
- Removing items mid-cycle requires escalation per Section 19.5

**Priority:** `P0 · demo-critical`. Current state: `MISSING`.

### 19.3 · Status emission cadence

The agent emits a status block at fixed triggers. The triggers are ORed — whichever fires first.

**Triggers:**
- Every PR merged (success or after CI fail)
- Every failed CI run that doesn't merge
- Every item moved to blocked or complete
- Every 30 minutes of active work within an item
- Every session resume after any gap longer than 30 minutes

**Required format (never deviate):**

```
STATUS [ISO timestamp]
Current item: [ITEM_ID] · step [N] of [M]
Complete this cycle: [list of ITEM_IDs, or "none yet"]
Remaining in queue: [count and IDs, or "none — cycle complete"]
Blockers: [list, or "none"]
Next PR ETA: [timestamp or "unknown"]
State file updated: [yes | no]
```

Status blocks render as prominent messages in the agent's response thread. They are not buried at the end of long narratives.

**Priority:** `P0 · demo-critical`. Current state: `MISSING`. This is the single most effective mechanism to prevent silent stalls — the cadence requires the agent to declare position, and declaring position exposes whether the agent is actually working or has drifted.

### 19.4 · Continuation default

After every unit of work — after a PR merges, after an item closes, after a blocker is recorded — the agent checks the committed queue in `CYCLE_STATE.md`. 

**If the queue has remaining unblocked items:** the agent continues to the next item immediately, without waiting for user input. This is the default. The agent's next action is to pull the next item and start Step 1 of that item.

**If the queue has only blocked items:** the agent emits an ESCALATION block (Section 19.5) with the list of blocked items and stops.

**If the queue is empty:** the agent emits a cycle-complete report per Section 18.6 and stops.

**"Waiting for user input" is only valid if:**
- An item requires explicit Anand sign-off per Section 18.2, OR
- An item is blocked per Section 19.5 escalation, OR
- The user has explicitly requested a pause

Any other stop is a violation of the protocol. "I finished this item, let me know what to do next" is specifically disallowed when a queue exists.

**Priority:** `P0 · demo-critical`. This mechanism directly addresses the "wakes up, does some, goes to sleep" failure mode. Current state: `MISSING`.

### 19.5 · Escalation thresholds

An agent emits an ESCALATION block if any of these trigger:

**Time-based:**
- Same item for more than 45 minutes without PR opening
- Same item for more than 2 hours without PR merging
- Same session without a PR merge for more than 3 hours

**Error-based:**
- 3+ consecutive CI failures on the same PR
- Test suite failures that the agent cannot diagnose after 2 attempts
- Infrastructure errors (Vercel deploy fail, Pinecone index unavailable, Clerk 5xx) persisting more than 15 minutes

**Scope-based:**
- Item requires changes outside Autonomy Charter Section 18.2
- Contradiction between files that cannot be resolved per Section 18.5
- Discovered dependency on work not yet completed in another cycle

**Stuck-based:**
- Agent has attempted the same approach 3+ times with the same failure
- Agent is uncertain how to proceed and has spent more than 15 minutes on uncertainty

**Required escalation format:**

```
ESCALATION [ISO timestamp]
Item: [ITEM_ID]
Cycle position: [N of M in committed queue]
Time on item: [duration]
Tried:
  - [Specific approach 1] — [outcome] — [PR ref if any]
  - [Specific approach 2] — [outcome] — [PR ref if any]
  - [Specific approach 3] — [outcome] — [PR ref if any]
Stuck because: [specific reason — not "I don't know how to proceed," but "the pattern-library retrieval returns empty for tenant X, and the cause is that the registry lacks entries for tenant X, which requires PA-10 completion which is in a later cycle"]
Need from Anand: [specific ask — "approve adding PA-10 to this cycle scope" or "confirm the retrieval fallback behavior when registry is empty for a tenant" or "decide whether to ship the contract without this item"]
State file updated: [yes | no — should always be yes]
```

After emitting an ESCALATION, the agent continues to the next unblocked item in the queue. It does not stop the cycle unless all remaining items are blocked.

**Priority:** `P0 · demo-critical`. Current state: `MISSING`. Without explicit escalation thresholds, stuck agents stall silently.

### 19.6 · Session kickoff discipline

Every new session — whether triggered by Anand opening a chat, by a cron, or by a webhook — begins with the same three actions in order:

**Action 1:** Read `CYCLE_STATE.md`.

**Action 2:** Emit a STATUS block per Section 19.3, anchored to the current position in the state file.

**Action 3:** Execute the next item in the committed queue per the Continuation Default (Section 19.4).

No "hi, how can I help?" No "what would you like me to work on?" No freeform restart. The queue and state file drive the restart.

Anand's session-kickoff prompt to the agent is always the same three lines:

```
Read CYCLE_STATE.md.
Emit current STATUS.
Execute next item in queue.
```

If the state file indicates the cycle is complete, the agent says so in its status and requests a new cycle committed queue. If the state file indicates blocked items, the agent says which blockers are outstanding and asks for direction on them.

**Priority:** `P0 · demo-critical`. Current state: `MISSING`.

### 19.7 · Watchdog pattern (optional, recommended)

A separate watchdog process (or Anand himself) reads `CYCLE_STATE.md` at known intervals. If the `Last status emission` timestamp has not updated within the expected cadence (Section 19.3), the watchdog pings the agent: "No status update in X minutes. What's your current position?"

This turns silent stalls into loud ones within the cadence window.

**Priority:** `P1 · seed-critical`. Current state: `MISSING`. For now, Anand plays the watchdog role manually. Automating the watchdog is a later optimization.

### 19.8 · Prohibited behaviors

Under this protocol, the following are violations:

- Stopping mid-cycle without emitting cycle-complete, ESCALATION, or all-items-blocked signal
- Skipping a STATUS emission when a trigger fires
- Reordering the committed queue without an entry in "Notes and discoveries"
- Updating `CYCLE_STATE.md` only at session end rather than at every unit of work
- Answering "what are you working on?" from context memory rather than from `CYCLE_STATE.md`
- Silent scope expansion (working on items not in the committed queue without adding them explicitly)
- Silent scope reduction (skipping items in the committed queue without blocking or escalating them)

Each violation erodes the continuity that enables autonomous operation. Anand should call out violations when observed; the agent should log them in "Notes and discoveries" and adjust.

### 19.9 · Applicability

This protocol applies to Codex and Claude Code for all cycles executed under File 08, and to any cycle referencing this file's items. Other coordination (multi-day investor work, content authoring, design reviews) may follow different patterns; those patterns are defined in their respective files.

---

## Section 20 · Execution discipline

**Ownership:** This file is the agent runtime spec. Codex is primary implementer for Stages 1-8 infrastructure. Claude Code is primary implementer for Stages 6-7 rendering. File 04 governs the surfaces the agents live in; File 02 governs the patterns they read; File 03 governs the stores they read from; this file governs the contract that binds all three on every turn.

**Dependencies:**
- File 03 knowledge layer stores must be populated before Stage 3 can return non-empty compositions
- File 02 pattern library must be at the depth specified before Sentinel responses are substantive
- File 04 surface wiring must be present before agent chat UIs can render rendered_response
- The remediation backlog items DR-01 through DR-07 (deliverable routing) and DR-04, DR-05 (session stability) must be complete before this file's contract can be tested end-to-end, since broken routing prevents personas from reaching the surfaces where agents live

**Execution order:**
1. Stage 2 Context assembly (5 dimensions) — enables everything else
2. Stage 3 Fabric attachment (unified contract) — enables composition
3. Stage 4 Composition — enables Claude invocation
4. Stage 5 Claude invocation (per-agent system prompts) — produces real responses
5. Stage 6 Response assembly with citation resolution — renders substance
6. Stage 7 UI rendering per Section 9/10 — users see citations and honest signaling
7. Stage 8 Feedback logging — flywheel starts spinning
8. Stage 1 Intake hardening and Stages 13/14 error handling and state persistence — polish
9. Cross-agent handoff (Section 12) — after single-agent paths are solid

**Target timeline (from the remediation handoff sizing):** this file's P0 items ship in Cycle 1 (1-2 weeks of focused parallel work by both agents). P1 items ship in Cycle 2. P2 items (not present in this file — all items are P0 or P1) N/A.

**Verification:** After Cycle 1 completes, re-run the three crawler personas (Jake, Dr. L, Marcus T) verbatim. Each persona's free-text prompts must elicit differentiated, cited, honest responses. If any persona's prompts still elicit templated deflections, the contract is not executed.

**Cycle-close verification also checks Section 19 compliance:** `CYCLE_STATE.md` must exist at repo root, must have been updated at every status-emission trigger during the cycle, must show every committed item in one of the three terminal states (complete, blocked-with-escalation, explicitly-deferred-with-approval). A cycle is not closed if `CYCLE_STATE.md` shows in-progress items without status updates within the cadence window.

---

## Section 21 · One-line handoff

> Every agent turn assembles context, attaches to Fabric, composes a structured prompt, invokes Claude on client cloud, renders with explicit citations and honest disclosure, logs to the feedback store. Eight stages, non-negotiable. Four agents, four voices. No templated fallbacks. Apply Autonomy Charter in Section 18. Follow Continuous Execution Protocol in Section 19. Pre-decided items in Section 17 — don't re-ask.

---

*End of File 08 · Agent-Fabric Per-Turn Contract Backlog.*
