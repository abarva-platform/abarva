# Pattern-First Agent Retrieval Design

Date: 2026-05-09

Status: Wave 1 implementation blueprint for Wave 2. No runtime behavior change.

Purpose: define how Nexus, Sentinel, and Atlas should retrieve canonical patterns before synthesis so agent advice is grounded in reusable pattern intelligence, tenant evidence, confidence, and phase workflow instead of dynamic LLM improvisation.

## Design Goal

When a user asks for help in a Strategic Move, the agent should assemble context in this order:

1. User / move / tenant context
2. Uploaded files and internal artifacts
3. Canonical industry / function / use-case patterns
4. Phase-specific patterns
5. Cross-industry analogs
6. Agentic architecture patterns
7. Failure modes / anti-patterns / risk patterns
8. KPI / value / measurement patterns
9. Output template / artifact format

The LLM adapts and synthesizes after retrieval. It should not invent the core playbook.

## Current Foundation From Wave 1

Wave 1 created:

- Canonical `IndustryAIPattern` contract.
- Source-to-target mapping.
- Read-only crosswalk inventory and duplicate-risk report.
- Runtime-safe enum normalizers.
- Draft builders for `PatternSeed`, generated manifest entries, `pattern_packs`, and `genome_patterns`.

Wave 2 should use these as an in-memory or generated read model first. It should not introduce another durable pattern store until the canonical crosswalk is accepted.

## Target Retrieval Flow

### Step 1: User / Move / Tenant Context

Inputs:

- authenticated user and tenant
- program / Strategic Move id
- tenant industry and current operating context
- current phase and gate state
- sponsor, lead, stakeholders, and decision rights
- move archetype, value hypothesis, current scope, risks, flags
- program modules, milestones, work items, and deliverable state

Relevant files:

- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
- `src/app/api/chat/agent/route.ts`
- `src/lib/programs/nexus.ts`
- `src/lib/programs/programs-broker-adapter.ts`
- `src/lib/knowledge/agent-context-broker.ts`

### Step 2: Uploaded Files And Internal Artifacts

Inputs:

- uploaded documents
- meeting notes
- workshop outputs
- program deliverables
- evidence ledger records
- gate approvals and evidence
- internal artifacts already produced in the move

Behavior:

- prefer client-supplied evidence over generic corpus material when answering current-state questions
- cite evidence and caveat gaps
- do not override client evidence with a pattern assumption

### Step 3: Canonical Industry / Function / Use-Case Patterns

Inputs:

- `IndustryAIPatternDraft` objects built from current sources
- normalized industry, enterprise area, function, process area, use-case category, and phase
- duplicate-risk and missing-field metadata from the crosswalk inventory

Ranking signals:

1. exact tenant industry match
2. exact enterprise area match
3. function/process/use-case text match
4. current Strategic Move phase applicability
5. stronger provenance and confidence
6. fewer missing required fields
7. lower duplicate risk or reviewed canonical mapping

### Step 4: Phase-Specific Patterns

Inputs:

- V2 phase packs
- deliverable registry
- gate criteria
- evidence requirements
- coaching rules
- anti-hallucination rules
- `patterns_to_load` once mapped to canonical ids

Behavior:

- use phase packs to shape questions, evidence requests, gate behavior, and artifact drafting
- use canonical patterns to shape industry/function solution advice
- do not confuse phase guidance with industry use-case expertise

### Step 5: Cross-Industry Analogs

Inputs:

- cross-industry canonical patterns
- same function/process in adjacent industries
- same phase and same failure-mode family

Behavior:

- retrieve analogs only after direct industry/function matches
- label analogs explicitly as cross-industry
- use analogs for design prompts, risk checks, and option generation, not as hard evidence for the client

### Step 6: Agentic Architecture Patterns

Inputs:

- architecture and AI program patterns
- data/semantic/vector/graph requirements
- human-agent workflow design fields
- autonomous action boundary fields
- escalation and responsible AI guardrail fields

Behavior:

- separate business workflow design from technical architecture
- require human-in-the-loop boundaries for regulated, financial, clinical, employment, security, and high-impact decisions
- ask for source-system and integration evidence before recommending autonomous action

### Step 7: Failure Modes / Anti-Patterns / Risk Patterns

Inputs:

- canonical pattern failure modes
- phase-pack anti-patterns
- contradiction templates and detection rules
- Sentinel evidence gaps
- `unsupported_claim_flags`

Behavior:

- retrieve likely failure modes before giving a confident recommendation
- surface missing evidence, weak provenance, and unsupported quantitative claims
- prevent phase advancement when hard gate evidence is missing

### Step 8: KPI / Value / Measurement Patterns

Inputs:

- canonical KPI fields when available
- tenant KPI dictionary and KPI history
- financial model and value measurement artifacts
- benchmark patterns with provenance
- Atlas value confidence rules

Behavior:

- separate projected, tracked, and verified value
- never present unsupported quantitative outcomes as facts
- ask for baseline data before estimating quantified impact

### Step 9: Output Template / Artifact Format

Inputs:

- deliverable registry
- phase artifact-generation rules
- artifact templates
- requested output type

Behavior:

- select output structure after evidence and pattern retrieval
- include source basis, confidence, assumptions, and open evidence gaps when making recommendations

## Agent Behavior

### Nexus

Nexus should:

- use canonical patterns before synthesis
- guide the user through the active phase workflow
- ask for missing templates, files, and evidence before making confident recommendations
- show source basis and confidence when recommending a pattern
- avoid unsupported quantitative claims
- distinguish tenant evidence from internal patterns and cross-industry analogs
- refuse to approve a conclusion when hard gate evidence is missing
- summarize uncertainty in crisp executive language

Nexus should not:

- invent KPIs, value ranges, source references, sponsor commitments, current-state facts, or implementation feasibility
- treat cross-industry analogs as client-specific evidence
- use `Execute` as a Strategic Moves phase label

### Sentinel

Sentinel should:

- check whether moves lack required evidence, artifacts, KPIs, guardrails, or failure-mode mitigation
- detect contradictions between tenant facts and pattern assumptions
- flag pattern-to-evidence gaps
- identify duplicate or conflicting pattern matches
- surface missing provenance and unsupported quantitative claims
- recommend what evidence would resolve uncertainty

Sentinel should not:

- silently pass a move when a required artifact or hard gate criterion is absent
- treat pattern presence as proof that the client context supports the pattern

### Atlas

Atlas should:

- frame value, baseline, measurement method, financial confidence, and timing
- separate projected, tracked, and verified value
- use KPI and benchmark patterns only with confidence rationale
- connect pattern value levers to tenant KPI history and financial model artifacts
- downgrade confidence when baseline data is missing
- call out whether value is revenue growth, cost takeout, productivity, risk reduction, experience, speed, working capital, quality, or compliance

Atlas should not:

- invent quantified benefits
- blend benchmark ranges with client-specific commitments
- present preliminary estimates as verified value

## Runtime Files To Change In Wave 2

Wave 2 should change these files deliberately and in this order:

1. `src/lib/intelligence/agent-retrieval.ts`
   - add canonical pattern retrieval API
   - rank by industry, enterprise area, function, process, use case, phase, provenance, missing fields, and duplicate risk
2. `src/lib/intelligence/ask/retrievers/pattern.ts`
   - route pattern queries through the canonical draft/index layer
   - return source basis, confidence, missing fields, and unsupported claim flags
3. `src/lib/agent/tools/intelligence/*`
   - expose canonical search, neighborhood, and evidence-gap data to Sentinel and other tools
4. `src/lib/knowledge/context-broker/broker.ts`
   - hydrate `corpusPatterns`
   - resolve `WARNING_CORPUS_PENDING`
   - include canonical pattern summaries in corpus and full modes
5. `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
   - retrieve canonical patterns after move/evidence context and before synthesis
   - emit source/confidence metadata in citation/source events
6. `src/app/api/chat/agent/route.ts`
   - add pattern-first retrieval blocks for Nexus, Sentinel, and Atlas
   - preserve phase-pack behavior while adding canonical pattern grounding

## Warning Handling

### WARNING_CORPUS_PENDING

Current issue: corpus mode warns that pattern catalog integration is pending and `corpusPatterns` is empty.

Wave 2 target:

- build a canonical pattern index from existing source-code and DB-backed sources
- hydrate `corpusPatterns` with top-ranked canonical drafts
- include missing-field and provenance metadata
- only remove the warning when the broker returns pattern candidates or an explicit no-match result

### WARNING_VECTOR_PENDING

Current issue: vector retrieval can be unavailable, causing keyword fallback.

Wave 2 target:

- keep keyword fallback deterministic
- rank exact canonical fields above fuzzy body text
- label fallback mode in the context bundle
- avoid confidence inflation when vector retrieval is unavailable

### WARNING_WORLDVIEW_PENDING

Current issue: worldview retrieval can be pending/unavailable.

Wave 2 target:

- use internal canonical patterns first
- retrieve worldview/cross-industry analogs as a secondary layer
- label worldview gaps separately from tenant evidence gaps

### corpusPatterns Empty State

If `corpusPatterns` is empty:

- the agent should say no canonical pattern was retrieved
- the agent should ask a focused clarifying question or request evidence
- the agent may offer a generic phase workflow step, but must not present domain advice as pattern-grounded
- Sentinel should flag the interaction as an evidence/pattern gap when the move needs domain guidance

### Partial enterprise_context_chunks Embeddings

Current issue: many chunks can remain `pending`, so vector coverage is partial.

Wave 2 target:

- report embedding completeness in retrieval diagnostics
- prefer exact tenant records and artifact evidence over vector chunks
- use keyword fallback over pending chunks
- avoid saying "no evidence exists" when embeddings are incomplete; say "no retrieved evidence in the available index"

## Keyword Fallback Behavior

When vector retrieval is unavailable:

1. Parse query and move context into canonical filters.
2. Match exact industry and phase first.
3. Match enterprise area, function, process, and use-case category next.
4. Match title/summary/body text last.
5. Return lower confidence and a fallback-mode caveat.
6. Do not retrieve cross-industry analogs unless no direct industry patterns match.

## Refusal And Uncertainty Rules

Agents should refuse or caveat when:

- no canonical pattern is retrieved for a domain-specific recommendation
- source basis is missing
- confidence rationale is missing
- tenant evidence contradicts pattern assumptions
- KPI baseline is missing for a quantified value claim
- quantitative claims are flagged unsupported
- phase gate evidence is missing
- user asks for an `Execute` phase recommendation as if AbarVa owns execution

Recommended uncertainty language:

- "I can offer this as a pattern hypothesis, not a validated recommendation, because we do not yet have the baseline."
- "The closest retrieved pattern is cross-industry, not Healthcare-specific; use it as an analog only."
- "I would not quantify value yet. We need the current baseline, measurement method, and source data first."
- "This gate should remain open because the evidence requirement is not satisfied."

## Wave 2 Implementation Sequence

1. Add an in-memory canonical pattern index builder that uses existing sources and the draft builders.
2. Add deterministic ranking and filters in `agent-retrieval.ts`.
3. Add tests for sample queries:
   - "AI use cases for retail store operations"
   - "How should a payer use agentic AI for prior auth?"
   - "Financial services AML agentic workflow"
   - "Back office AI productivity use cases for healthcare"
   - "How should a retailer reimagine merchandising with AI?"
   - "What are the KPIs for AI-enabled contact center transformation?"
4. Hydrate `corpusPatterns` in the context broker.
5. Add Nexus pattern-first retrieval to program ask routes.
6. Add Sentinel evidence-gap checks against required canonical fields.
7. Add Atlas KPI/value confidence handling from canonical fields.
8. Add user-visible source basis and confidence display.
9. Keep runtime changes behind a narrow feature flag until tests and demo flows pass.

## QA For Wave 2

Wave 2 should pass:

- unit tests for ranking and normalization
- integration tests for context broker pattern hydration
- Nexus route tests proving pattern block appears before synthesis
- Sentinel tests for missing evidence/artifact/KPI/failure-mode checks
- Atlas tests for projected/tracked/verified value separation
- build and CI

No live DB mutation is required for Wave 2 unless a later approved migration creates a canonical persisted view.
