# 05 · Chat Input and Attachment Standard

**Document:** How users interact with agents via chat input, how files are ingested as context, how typos and acronyms are handled
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companions:** Documents 00-04 (read first)
**Framework reference:** Section 7 of Agent-Centric Product Design Framework

This document specifies the chat input model across all five surfaces. Every agent across every surface follows these rules. Chat is a guided input surface — not a blank prompt box. File attachment is a first-class context ingestion event — not a message attachment. Typo tolerance is context-aware — not naïve autocorrect.

## The core principle

Users should not need to become prompt engineers to derive value from AbarVa. The product leads with context-aware suggestions, offers specific next actions, accepts custom input, and gracefully handles imperfect user inputs while protecting domain terminology.

The failure mode this document prevents is the blank-prompt dead-end — user arrives at a chat box and doesn't know what to ask. Every AbarVa agent interaction either starts with a suggested action or, if the user goes custom, closes with three contextual suggestions plus a custom option.

## The three-choices-plus-custom pattern

Every substantive agent response closes with three context-generated suggested actions plus one custom option.

### Why three plus custom

**Three is enough choice without overwhelming.** Research on decision UX consistently shows three is the sweet spot — enough variety to cover the likely next directions, not so many that choice paralysis sets in.

**Custom preserves agency.** Users who want to go off-path should not be forced into one of three options. The "Ask something else" custom option preserves full user agency.

**Context-generated is the discipline.** Suggested actions are generated from Context Bundle state, not from a static list. Static suggestions are filler; contextual suggestions are product intelligence.

### The four-option rendering

Below every substantive agent response, render four options in this order:

1. **Suggestion one** — context-derived, most likely next action
2. **Suggestion two** — context-derived, alternative useful direction
3. **Suggestion three** — context-derived, lateral or exploratory option
4. **"Ask something else"** — custom prompt input

Each suggestion is a clickable affordance that executes the action or prefills the prompt.

### Examples per surface

Illustrative examples showing context-generated suggestions. Actual implementation derives from Context Bundle state.

#### Programs — program detail, Phase 3 Diagnose

Agent: Nexus

After a response about program state:
1. "Show open contradictions"
2. "Schedule CXO touchpoint 2"
3. "Draft sponsor update"
4. "Ask something else"

After a response about a specific contradiction:
1. "Propose resolution"
2. "Show evidence behind this contradiction"
3. "Escalate to sponsor"
4. "Ask something else"

#### Source — event canvas, Scope stage

Agent: Nexus

After a response about event state:
1. "Show missing inputs"
2. "Generate minimum data request"
3. "Explain scope readiness"
4. "Ask something else"

After a response about scorecard governance:
1. "Show default weights"
2. "Explain weighting rationale"
3. "Add override rationale"
4. "Ask something else"

#### Intelligence — pattern detail

Agent: Sentinel

After a response about a specific pattern:
1. "Find related patterns"
2. "Show evidence trail"
3. "Summarize contradictions with adjacent patterns"
4. "Ask something else"

After a response comparing patterns:
1. "Drill into the highest-confidence one"
2. "Show evidence gaps"
3. "See this pattern in current programs"
4. "Ask something else"

#### Control Tower

Agent: Atlas

After a response about portfolio pressures:
1. "Show highest-risk items"
2. "Explain value variance"
3. "Generate executive summary"
4. "Ask something else"

After drilling into a specific pressure:
1. "Open the underlying program"
2. "Show evidence behind this number"
3. "Draft decision memo"
4. "Ask something else"

#### Setup/Admin

Agent: Steward

After a response about admin state:
1. "Open ServiceNow connector"
2. "Approve pending access"
3. "Review stale audit records"
4. "Ask something else"

After a response about a specific connector:
1. "Show connector history"
2. "Test connection"
3. "Escalate to vendor support"
4. "Ask something else"

### Suggestion generation rules

Suggested actions are generated per turn by composition logic. Rules:

**Rule 1 — Derived from Context Bundle, not templates.**
Suggestions reference specific elements of the Context Bundle — specific work objects, specific stages, specific missing inputs, specific artifacts. Template suggestions like "Learn more" or "Continue" are violations.

**Rule 2 — Actionable verb phrases.**
Each suggestion is a verb-led phrase suggesting an action. "Show missing inputs" is actionable. "Missing inputs" is not.

**Rule 3 — Specific over generic.**
"Schedule CXO touchpoint 2" is specific. "Schedule a meeting" is generic. Prefer specific.

**Rule 4 — Forward-moving.**
Suggestions move the conversation or workflow forward. Suggestions that loop back to recent content are violations.

**Rule 5 — Mutually distinct.**
Three suggestions should represent three different directions, not three phrasings of the same direction.

**Rule 6 — Maximum three; no exceptions.**
Some surfaces might feel like they deserve four or five suggestions. Discipline: three only. Fourth slot is always "Ask something else."

### When suggestions should not render

Some turns don't warrant suggestions:

- Error responses (retry affordance instead)
- Confirmation dialogs (explicit actions required)
- Very short acknowledgment responses (no substantive content to suggest follow-ups for)
- Responses explicitly ending a thread (goodbye, session close)

In these cases, render just the agent response without the four-option block.

## Chat input box behavior

The custom input ("Ask something else") surfaces a chat input box.

### Default state

When a user clicks "Ask something else" or lands on a surface with chat input visible:

**Placeholder text** — context-aware. Examples:
- On Programs detail: "Ask Nexus about this program..."
- On Tower: "Ask Atlas about the portfolio..."
- On Intelligence: "Ask Sentinel about patterns..."
- On Admin: "Ask Steward about operations..."

Static "Type a message" is a violation.

### Input state

As user types:

- Domain-term recognition active (see typo handling below)
- No premature submission on Enter (Shift+Enter for newline, Cmd/Ctrl+Enter to submit)
- Submit button enables when input has content
- Character counter visible if input exceeds recommended length (300 chars)

### Submit behavior

On submit:

1. Input captured into conversation turn
2. Context Bundle assembled per document 02
3. Agent response composed per document 03
4. Response rendered with suggested actions and custom option for next turn

### Rate limiting

Reasonable rate limiting to prevent runaway costs:

- Maximum 20 agent turns per session per user within 60 seconds
- Maximum 100 turns per session per user per hour
- Exceeding rate limits shows polite throttle message with retry timing

These limits are generous enough not to impede real use while preventing runaway costs.

## File attachment as context ingestion

File upload is the single most important context ingestion mechanism. Users bring documents (contracts, spend data, baselines, audit reports, vendor proposals). The product must turn these into structured context.

### The fundamental model shift

**Not message attachment.** Users do not attach files to messages as "here's a file for you to look at." The file-as-message-attachment model is ChatGPT behavior.

**Is context ingestion.** Users upload files as context the platform ingests, classifies, parses, and attaches to work objects. The file becomes part of the Context Bundle for this and future turns.

### Upload surfaces

Files can be uploaded from multiple surfaces:

- **Work object detail** — attach file to a specific program, sourcing event, or pattern
- **Stage workspace** — attach file as input for a specific stage
- **Artifact drawer** — attach file as evidence supporting a specific artifact
- **Scorecard editor** — attach file as rationale for a scorecard override
- **Value Ledger** — attach file as evidence for projected or realized value claim
- **Admin Setup** — bulk upload for vendor contracts, spend data, policy documents

Every upload surface has the same underlying pipeline; presentation varies per context.

### Supported file types

Scope of conceptual support:

- **PDF** — Contracts, audit reports, research papers, vendor proposals
- **DOCX** — Scope documents, memos, authored content
- **XLSX** — Spend data, baselines, inventories, scorecards, financial models
- **CSV** — Structured data exports
- **PPTX** — Presentations, steering committee decks
- **TXT/MD** — Plain text, authored markdown
- **Images (later phase)** — Diagrams, scanned documents

Files outside these types are rejected with explicit error stating supported types.

### The ingest pipeline

Every uploaded file goes through this pipeline. Stages must complete in order.

**Stage 1 — Upload and validate.**
- File uploaded via drag-drop, file picker, or paste
- MIME type validated
- File size validated (cap at 50MB per file by default)
- Malware scan completes
- File rejected explicitly if any validation fails

**Stage 2 — Classify.**
- File classified by type using filename, content sample, user intent
- Classification types: contract / spend_data / audit_report / presentation / baseline / inventory / research / other
- User can override classification at upload time

**Stage 3 — Associate with work object.**
- User specifies which work object(s) this file attaches to (program, event, pattern, artifact)
- Default association from upload surface (file uploaded on program detail defaults to that program)
- Multi-attachment supported

**Stage 4 — Parse.**
- Type-appropriate parser invoked
- PDF → text extraction plus structure detection
- DOCX → text plus section structure
- XLSX → sheets and cells with structure
- PPTX → slides with text and speaker notes
- Parse status tracked: pending / parsing / parsed / failed

**Stage 5 — Extract structured context.**
- Parsed content processed for structured fields
- Contracts: parties, terms, value, dates, obligations
- Spend data: columns for vendor, month, amount, category
- Audit reports: findings, severity, owner, dates
- Presentations: key messages, data tables, dates
- Extracted fields populate structured context per file classification

**Stage 6 — Score extraction confidence.**
- Each extracted field scored HIGH / MEDIUM / LOW
- HIGH: clean extraction from well-structured source
- MEDIUM: extraction with minor ambiguity
- LOW: extraction from unstructured source or significant ambiguity

**Stage 7 — Make available as evidence.**
- File registered in evidence registry with unique evidence ID (E-id)
- Citation metadata attached (source file, extraction timestamp, confidence)
- Available for agent retrieval in Context Bundle per document 02

### The "context used" UI contract

When an agent response cites an uploaded file, the UI shows context-used indicator.

**Rule:** Agents must not cite a file until it has been parsed and extracted with sufficient confidence.

**UI treatment:**

Inline in response:
> "Based on [contract-abc.pdf] and [spend-data-q3.xlsx]..."

Expandable context-used panel:
```
Context used for this response:
 ✓ contract-abc.pdf · parsed · HIGH confidence · uploaded 2d ago
 ✓ spend-data-q3.xlsx · parsed · HIGH confidence · uploaded 1d ago
 ⚠ audit-report-2026.pdf · parsing incomplete · not used
```

Users see what the agent used and what was available but not used. Transparency prevents the context-theater anti-pattern from document 02.

### Parse status visibility

Files in flight (parsing, extracting) are visible to users.

**Attached files panel (on work object):**

```
┌─────────────────────────────────────────────────────────┐
│ Attached files (4)                                        │
├─────────────────────────────────────────────────────────┤
│ ✓ contract-abc.pdf      Parsed · HIGH · 2d ago           │
│ ✓ spend-data-q3.xlsx    Parsed · HIGH · 1d ago           │
│ ⟳ audit-report.pdf      Parsing · 15s elapsed            │
│ ✗ old-scan.pdf          Parse failed · retry             │
└─────────────────────────────────────────────────────────┘
```

States visible:
- ✓ Parsed with confidence (available to agents)
- ⟳ In progress (not yet available)
- ✗ Failed (with retry or explanation)

### File-to-evidence conversion

Uploaded files become evidence. Not every file becomes every type of evidence.

**Classification-specific conversion:**

**Contracts** become:
- Evidence: terms, commercial structure, renewal dates, obligations
- Context: available to agents as vendor-specific factual base
- Citable as: contract clause citation

**Spend data** become:
- Evidence: spend trajectory, vendor concentration, cost center allocation
- Context: feeds Tower spend pressure cards
- Citable as: spend analysis citation

**Baselines** become:
- Evidence: baseline measurement for Phase 6 comparison
- Context: feeds Value Ledger projected vs realized
- Citable as: baseline study citation

**Audit reports** become:
- Evidence: findings, severity, remediation status
- Context: feeds risk registry and Steward operational view
- Citable as: audit finding citation

### Multi-file context

A single work object can have dozens of attached files. Agents must reason across them intelligently.

**Rules:**
- Agents retrieve relevant files via semantic match on query (not all files every turn)
- Citations specify which file(s) informed the response
- Contradictions across files are surfaced (Sentinel behavior per document 03)
- Stale files (evidence timestamp > 90 days without re-upload) are flagged as possibly outdated

### Security and privacy

Uploaded files carry sensitive data (contracts, financial data, audit findings).

**Rules:**
- Files encrypted at rest and in transit
- Files scoped to tenant (cross-tenant read prevented — verified Cycle 2 fix holds)
- Files subject to retention policies per tenant configuration
- Files can be deleted by authorized users; deletion removes file, extracted context, and citation references
- PII detection at parse time; PII fields flagged for optional redaction

## Typo tolerance and domain terms

Users make typos. Domain terms get preserved.

### The core rule

**Correct typos in natural language. Preserve domain terms and acronyms verbatim.**

User types: "socrecard waits is 20% for vender lock"

Agent reads: "scorecard weights is 20% for vendor lock"

Natural-language typos corrected (socrecard → scorecard, waits → weights, vender → vendor).

User types: "run the BAFO with Ariba and Coupa"

Agent reads: "run the BAFO with Ariba and Coupa"

Domain terms preserved exactly. BAFO is not corrected to "before" or "buffalo."

### Protected term list

Terms that must never be autocorrected or silently changed:

**Sourcing terminology:**
- AMS, BAFO, RFP, RFI, SOW, MSA, SLA, KPI, OKR, PMO
- Light, Standard, Enhanced, Strategic (rigor levels)
- Intake, Scope, Strategy, RFP, Responses, Evaluation, Orals, Selection, Mobilization, Value Realization (stages)

**Vendor and product names (examples, not exhaustive):**
- Abridge, DAX Copilot, Suki, Nuance, Epic, Cerner (healthcare)
- Ariba, Coupa, SAP, Oracle, Workday, ServiceNow, Salesforce (enterprise)
- Databricks, Snowflake, Netezza, Fabric (data platforms)
- AWS, Azure, GCP (cloud platforms)

**AbarVa-specific terminology:**
- Nexus, Sentinel, Atlas, Steward (agents)
- Fabric, Pattern Pack, Context Bundle, Value Ledger
- MRD-01, APX-01, SRC-001 (work object identifiers follow client prefix conventions)

**Client and tenant names:**
- Meridian, Apex, First Capital, Keystone (composite tenants)
- Any named CXO or stakeholder in Context Bundle

### The implementation approach

Typo handling runs at input processing, before Context Bundle assembly.

**Step 1 — Tokenize user input.**

**Step 2 — Check each token against protected term list.** If match, flag as protected, skip autocorrection.

**Step 3 — Run autocorrection on non-protected tokens.** Use contextual autocorrect (not just dictionary-based).

**Step 4 — Re-assemble corrected input.**

**Step 5 — Display corrected input in UI with subtle indicator.** User sees the correction, can revert if incorrect.

**Rule:** User can always override autocorrection. Reverting does not retrain; the next similar typo gets the same treatment unless user explicitly adds a term to protected list via UI.

### Edge cases

**Ambiguous terms.** "AI Council" might be a domain term (AbarVa governance concept) or might be a user's phrase. Context awareness disambiguates.

**New terms.** User mentions a vendor or tool not in protected list. First encounter: do not autocorrect. Learning over time: frequent occurrences get added to protected list automatically.

**Typos in domain terms themselves.** User types "socrecard." System recognizes "scorecard" is a protected term the user likely meant. Corrects to "scorecard" with confidence indicator.

## Chat continuity across sessions

Users return to work. Chat context should persist.

### Per-surface chat continuity

Each surface maintains conversation history scoped to that surface. A user who was mid-conversation with Nexus on MRD-01 and returns tomorrow finds the conversation intact.

**Rules:**
- Conversation history rendered by default on session resume (not hidden)
- User can clear conversation (action affordance)
- Conversation history does not leak across work objects (Nexus on MRD-01 is separate from Nexus on APX-01)
- Conversation history does not leak across users (CIO's conversation is not visible to a peer)

### Conversation stitching

When relevant, agents reference prior turns. "As we discussed on April 20..." or "Following up on the payer mix contradiction..."

**Rules:**
- References to prior turns must be accurate
- Agent does not fabricate prior conversation that didn't happen
- Long conversations compress gracefully — older turns collapse into summaries

### Conversation export

Users can export conversations for offline review or sharing.

- Export format: markdown or PDF
- Includes agent responses, user prompts, citations, timestamps
- Does not include system internals (Context Bundle raw data, quality scores)

## Loading and response timing

Agent responses take time. UX must acknowledge this gracefully.

### Response composition time budget

**Target:**
- Atlas responses (Sonnet, short): 2-4 seconds
- Steward responses (Sonnet, operational): 2-4 seconds
- Nexus responses (Opus, workflow): 4-8 seconds
- Sentinel responses (Opus, evidence): 4-10 seconds

### Progressive rendering

For responses exceeding 3-second budget, progressive rendering:

**Step 1 — immediate (<500ms):** Acknowledgment with "Nexus is thinking about MRD-01 Phase 3..."

**Step 2 — streaming (during composition):** Response tokens stream as generated; user sees prose assembling.

**Step 3 — completion (<10s):** Full response with citations, confidence, suggested actions.

**Step 4 — extended (>10s):** Progress indicator with specific stage: "Retrieving patterns... composing response..."

### Failure handling

If composition fails:

- Specific error rendered (not "something went wrong")
- Retry affordance offered
- Escalation path if persistent ("Contact Steward for help")
- Failure does not corrupt conversation history; user can retry cleanly

## Anti-patterns

Specific violations that must not occur.

### Chat-input anti-patterns

- **Blank-prompt dead-end.** User lands on surface with no suggestions, expected to type prompt.
- **Static suggestion filler.** Suggestions like "Learn more" / "Continue" / "Help" that don't reference context.
- **Four suggestions plus custom (or more).** Discipline is three plus custom.
- **Generic placeholder.** "Type a message" instead of context-aware placeholder.
- **Suggestion that loops back.** "Show me what we just discussed" is a loop, not progress.

### File-attachment anti-patterns

- **Message-attachment model.** Treating files as attached to messages rather than ingested as context.
- **Unparsed files cited.** Agent cites a file before parse completes.
- **Silent parse failures.** File uploaded, parse failed, user doesn't see the failure.
- **Context theater.** "Context used" indicator showing files the agent didn't actually cite.
- **No tenant scope.** Files visible across tenants.

### Typo-handling anti-patterns

- **Over-correction.** Autocorrecting BAFO to "before" or Abridge to "a bridge."
- **Under-correction.** Not correcting "socrecard" — forcing users to type perfectly.
- **Silent correction.** Changing input without showing the user.
- **Learning across users.** One user's corrections affecting another user's experience.


## GPT refinement addendum · Guided input as workflow control

The chat input is not a generic assistant entry point. It is a controlled workflow interface that helps users progress without requiring prompt-engineering skill.

### Chat surface design requirements

Every chat/input surface should include:

1. **Context label** — what object/stage the chat is attached to.
2. **Suggested actions** — three context-aware actions generated from current state.
3. **Custom input** — free text remains available but is not the only path.
4. **Attachment affordance** — file upload is framed as adding context to a work object.
5. **Context used display** — responses disclose the data/pattern/artifact/file used.
6. **Confidence/caveat line** — especially for recommendations and value claims.

### Suggested action quality rules

Suggested actions must be generated from state, not static placeholders. They should reflect:

- current page
- current work object
- lifecycle status
- stage/gate readiness
- missing inputs
- artifacts available
- scorecard/value state
- attached files
- user role

A suggested action fails if it could appear unchanged on every page.

### Attachment acceptance rules

Before a file can influence an agent response, the system must know:

- file purpose or best guess
- associated work object
- associated stage or artifact when applicable
- parse status
- summary confidence
- security/quarantine state
- citation granularity available

If a file is uploaded but not parsed, Nexus may acknowledge receipt but may not make substantive claims from it.

### Domain typo tolerance

Typo handling must prioritize intent preservation over aggressive correction.

The system should maintain a protected-domain dictionary per tenant/surface with terms such as:

- platform names: ServiceNow, Workday, Epic, Databricks, Snowflake, Fabric, Netezza
- sourcing acronyms: RFP, RFI, BAFO, MSA, SOW, AMS, IMS, SLA, KPI
- AbarVa terms: Nexus, Sentinel, Atlas, Steward, Pattern Fabric, Value Ledger
- tenant-specific names and vendors once known

Spell correction should be rendered as "Interpreting this as…" only when ambiguity matters.

### Attachment-to-evidence rule

A file upload is incomplete until it can become one or more of:

- context summary
- extracted structured field
- citation source
- artifact input
- contradiction source
- validation evidence

If none of these outcomes is possible, the UI should say the upload is stored but not yet usable as evidence.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with specific interaction markups
2. Cross-check against document 02 (Context Bundle Standard) for file-as-evidence flow
3. Cross-check against document 03 (Page-Level Agent Contracts) for suggested-action generation
4. Cross-check against framework section 7 (Agentic Chat and Input Model)
5. Explicit founder sign-off

No chat or upload implementation proceeds against this document until AUTHORED-LOCKED.
