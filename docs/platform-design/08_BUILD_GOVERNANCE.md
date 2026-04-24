# 08 · Build Governance

**Document:** Implementation gates, approval discipline, and operating rules for Codex, Code, and any future engineer or agent building on AbarVa
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companions:** Documents 00-07 (read first)
**Framework reference:** Section 13 of Agent-Centric Product Design Framework

This document is the operating manual for building AbarVa. It specifies the gates an implementation must pass, the approvals required, the sequence of work, and the discipline that prevents the product from drifting from its agent-centric north star.

The discipline here exists because the product has experienced specific failure modes at exactly the points this document addresses. Agents reporting completion before verification (April 24). Implementation running ahead of spec. Cycle scope drifting. Regressions on "fixed" items. This document codifies the discipline that prevents these failures.

## Why this document matters

Enterprise products rarely fail from lack of engineering talent. They fail from lack of engineering discipline. The specific discipline question is: does the team maintain alignment between spec, design, implementation, and verification across many cycles?

AbarVa is being built by a small team (founder plus Code plus Codex plus future contributors) operating at high velocity. Velocity without discipline produces a product that looks fast-moving but accumulates integrity debt — cross-tenant leaks, templated agent responses, financial fabrication, inconsistent state across views. Each integrity debt is a future crisis.

This document's purpose is to keep velocity high while preventing integrity debt. The gates and rules below are how.

## The build governance model

### Three roles

**Founder (Anand).** Authority to approve specs, cycle scopes, design decisions, shipping decisions. Only role authorized to promote documents from AUTHORED-DRAFT to AUTHORED-LOCKED. Only role authorized to approve implementation slices against locked specs.

**Implementing agent (Codex or Code or future contributor).** Authority to execute approved specs within approved slices. No authority to modify specs, add items to cycles, or alter scope without founder approval. Reports honestly per reporting standards below.

**Verifying persona (crawler persona operated by founder or designated agent).** Authority to verify implementations against spec via crawler walks. Produces verdicts (approve / defer / reject). Verdicts drive subsequent cycle planning.

These three roles are distinct. The implementing agent does not verify its own work. The verifying persona does not implement. The founder does not confuse spec with implementation.

### Four governance artifacts

**CYCLE_STATE.md.** Repository-root document recording current cycle scope, status, exit criteria. Read first at every session start.

**AUTHORING_STATE.md.** Repository-root document recording current pattern authoring queue, status, and specification readiness. Read at start of pattern-library work.

**Platform design canon.** The nine documents in `docs/platform-design/` (this one included). Read in order specified by document 00.

**Design canon.** The ten foundational documents in `docs/design-canon/` (existing). Read as needed for component-level and runtime-level specification.

Every implementation decision traces to one or more of these artifacts. Absence of relevant artifact = absence of basis for implementation.

## Session start protocol

Every Codex or Code session begins with this protocol. Not optional.

### Step 1 — Read CYCLE_STATE.md

Repository root. Identify current cycle, current scope items, status of each item, expected exit criteria.

Expected output from Codex or Code at session start: "Cycle N is active. Scope includes items A, B, C. Current status: A pending, B in progress, C not started. Exit criteria: [explicit]."

If CYCLE_STATE.md is missing or stale, Codex/Code does not proceed with implementation. Escalates to founder for cycle definition.

### Step 2 — Identify the work item to address

Founder provides a specific work item or continuation context. Codex/Code confirms which item from the cycle scope is being addressed.

Expected output: "Working on item X from Cycle N scope. Proceeding."

If the request does not map to a cycle scope item, Codex/Code flags: "This work item is not in Cycle N scope. Request cycle amendment or redirect."

### Step 3 — Read relevant platform-design documents

Based on the work item, identify which platform-design documents apply:

- Surface-level work → documents 01, 02, 03, 04
- Chat or input work → documents 02, 03, 05
- Validation or verification work → document 06
- Pattern-library work → pattern library canon plus documents 02, 03
- Governance or build-discipline work → this document

Read the relevant documents before implementation.

Expected output: "Reviewed documents 01, 02, 03 for this work. Ready to proceed."

### Step 4 — Confirm spec readiness

Before touching code:

- Does the component spec exist?
- Does the wireframe exist?
- Is the Context Bundle definition complete for the surface?
- Is the agent behavior contract complete for the surface?
- Are the acceptance criteria defined?
- Are the anti-patterns named?

If any item is missing, Codex/Code does not implement. Flags the missing spec and proposes authoring it first.

Expected output: "All spec prerequisites met. Implementing." OR "Spec prerequisite missing: [X]. Proposing to author spec first."

### Step 5 — Execute the slice

Implement the single approved slice. Not adjacent work. Not "while I'm here" improvements. Not refactors outside the slice. The slice and nothing but the slice.

### Step 6 — Emit status report

Follow reporting standards in Section "Reporting standards" below. Report includes: files touched, validation results, risks, next action.

### Step 7 — Hand off for verification

Implementation is not closure. Verification follows. Codex/Code hands off to the verifying persona or founder with explicit framing: "Implementation complete. Verification pending."

## The implementation gates

Specific gates that implementations must pass before the associated work proceeds.

### Gate 1 — Dashboard / primary surface work

**Before building any primary surface (Programs index, Source index, Tower landing, Intelligence landing, Admin landing):**

Required prerequisites:
- Dashboard spec in platform design canon
- Wireframe showing zone composition
- Context Bundle definition for the surface
- Agent editorial content contract (what Atlas/Nexus/Sentinel/Steward says at top)
- Visual review against document 04 compositional test
- Acceptance criteria listing five-question test answers
- Anti-patterns specifically named

### Gate 2 — Event canvas / work-object detail

**Before building any work-object detail page (program detail, sourcing event canvas, pattern detail):**

Required prerequisites:
- Canvas wireframe with zone composition
- Stage or phase model definition
- Context Bundle definition with Work Object and Workflow State emphasis
- Journey tracker or phase timeline behavior spec (if applicable)
- Agent rail contract (which agent, what voice, what response modes)
- Acceptance criteria per five-question test
- Anti-patterns named

### Gate 3 — Chat UI / agent input

**Before building or modifying chat input surfaces:**

Required prerequisites:
- Chat response contract (document 03 and document 05)
- Three-choices-plus-custom suggested action model (document 05)
- Context-used display specification (document 05)
- Typo tolerance and protected-term list (document 05)
- Validation harness (document 06 golden prompts)
- Anti-patterns named

### Gate 4 — File upload / context ingestion

**Before building or modifying file upload:**

Required prerequisites:
- File attachment model (document 05)
- Parser strategy per file type (document 05)
- Evidence model (document 02 Evidence category)
- Security and quarantine behavior spec
- Parse status UI contract (document 05)
- Acceptance criteria
- Anti-patterns named

### Gate 5 — Agent API / Context Bundle runtime

**Before building or modifying agent runtime:**

Required prerequisites:
- Surface-specific Context Bundle builder (document 02)
- Deterministic state loader (design canon file 08)
- Context quality scoring (document 02)
- Validation fixture (test Context Bundles for verification)
- Agent routing logic (which agent for which surface per document 03)
- Model tier assignments (document 03)
- Anti-patterns named

### Gate 6 — Artifact / deliverable generation

**Before building or modifying artifact generation:**

Required prerequisites:
- Artifact model (document 02 Artifacts category)
- Tier rules (Rich / Outline / Stub per document 03)
- Missing-input handling spec
- Sentinel validation integration (document 03)
- Citation requirement (every claim cited)
- Template for artifact structure (pattern-library-grounded)
- Anti-patterns named

### Gate 7 — Tenant isolation / access boundary

**Before modifying any tenant-scoped functionality:**

Required prerequisites:
- Tenant scope verification at route level
- Tenant scope verification at data query level
- Tenant scope verification at file level
- Permission model per action
- Crawler test specifying cross-tenant probe
- Zero-tolerance acceptance criteria (one failure = rollback)

## Cycle management

Cycles are the operating unit of AbarVa development. Each cycle has defined scope, defined exit criteria, defined duration.

### Cycle structure

**Planning.** Founder defines cycle scope from: crawler persona findings, explicit roadmap items, technical debt, authoring queue items. Scope gets captured in CYCLE_STATE.md with one-line descriptions per item.

**Execution.** Codex and Code execute scope items. Each item follows the session start protocol. Progress tracked in CYCLE_STATE.md.

**Verification.** After execution, crawler personas walk the product against cycle scope. Findings get captured in persona crawler reports (document 06).

**Closure.** Cycle closes when founder explicitly closes it. Scope items are categorized: completed-and-verified, completed-pending-verification, defered-to-next-cycle, rejected.

**Planning of next cycle.** Findings from crawler personas plus deferred items plus new roadmap items constitute next cycle scope.

### Cycle discipline rules

**Rule 1 — Scope locks at cycle start.** Scope items are identified and locked at cycle start. Adding items mid-cycle requires explicit founder amendment.

**Rule 2 — Items complete only with verification.** An item is not complete at code merge. It is complete when persona verification passes.

**Rule 3 — Definition of Done is explicit per item.** Every scope item has specific acceptance criteria. "It works" is not acceptance criteria. "Persona X can navigate the surface and produce verdict Y" is acceptance criteria.

**Rule 4 — Cycle status reports are honest.** Reports specify completed-against-plan, extras-added, incomplete-items. They do not obscure progress vs. scope.

**Rule 5 — Regressions are explicit in reports.** If a previously completed item regresses, the report says so. Silent regression is a discipline failure.

### Cycle examples (reference)

**Cycle 0** — Foundation (hypothetical past). Scope: baseline platform, tenant model, surface stubs.

**Cycle 1** — Initial refinement (completed earlier). Scope: design canon file 08 items, pattern library foundation. Closed with partial verification.

**Cycle 2** — Post-crawler hardening (April 24). Scope: 14 items addressing Marcus T and Dr. L findings. Scope defined explicitly; merge complete; verification pending on 13 of 14 items waiting on Clerk email-code auth enable.

**Cycle 3** — Platform-canon hardening (proposed). Scope: locked platform design canon (these 9 documents), re-verification of all Cycle 2 items, addressing specific surface drift.

**Cycle N onward** — Continues from crawler verdicts and roadmap priorities.

## Reporting standards

How Codex, Code, or any implementing agent reports progress.

### Honest status format

Every status report includes:

**What I did.** Specific files touched, functions modified, components created. Not narrative; specific file paths and functions.

**What worked.** Tests passed, lint clean, type checks clean, visual verification done.

**What did not work.** Errors encountered, blockers, inputs missing, specifications incomplete.

**What I did not do.** Explicit list of items in scope that were not completed and why.

**Risks.** Specific risks introduced or observed.

**Verification status.** Explicit statement: "persona verification pending" or "persona verification complete with verdict X."

**Next action.** Specific next step for founder or next session.

### Anti-patterns in reporting

**The "closed" anti-pattern.** Reporting items as "closed" when only code is merged. Verification is a separate gate; merge is not closure.

**The "all good" anti-pattern.** Reporting without specific files, specific tests, specific verification. Vague good-news reports obscure actual state.

**The scope-expansion silent anti-pattern.** Completing extra items without flagging they were extras. Makes it harder to reconcile plan vs. execution.

**The regression hiding anti-pattern.** Fixing a regression without explicitly reporting that a previous item regressed.

**The confidence mismatch anti-pattern.** Reporting "complete" when the implementing agent knows there's uncertainty. Be specific about uncertainty.

### Report template

```
## Cycle N · Item X status report

### What I did
[Specific file paths and functions]

### What worked
[Specific tests, checks, visual verifications]

### What did not work
[Specific errors, blockers, missing inputs]

### What I did not do
[Scope items not completed, with reasons]

### Risks
[Specific risks introduced or observed]

### Verification status
[Explicit status: verification pending / complete with verdict]

### Next action
[Specific next step]
```

## Approval discipline

Specific decisions that require founder approval before proceeding.

### Requires explicit approval

**Adding items to in-flight cycle.** Cycle scope locks at cycle start. Additions require explicit amendment with rationale.

**Promoting a document from AUTHORED-DRAFT to AUTHORED-LOCKED.** Only founder can promote. Implementing agents flag when a document is ready for promotion review.

**Shipping a surface to production.** Even after code merge and persona verification, founder has final ship decision.

**Modifying protected files or behaviors.** See document 00 "Prohibited until reviewed" list.

**Changing platform canon documents.** These nine documents evolve via explicit revision with change log.

**Deploying to production vs staging.** Production deployment is explicit, not automated from main-branch merge.

### Does not require explicit approval (within approved scope)

- Implementing an approved scope item against its locked spec
- Refactoring within the approved slice
- Adding tests for approved scope
- Fixing typos or documentation errors that don't change meaning
- Internal tooling and development-environment improvements

### Ambiguous cases

When in doubt: ask. An ambiguous case resolved by asking is faster than an ambiguous case resolved by rework.

## Codex-specific operating rules

Codex is a specific implementing agent with specific characteristics. These rules apply to Codex specifically.

### Codex capabilities and constraints

Codex operates in an IDE with code access. Codex has good technical judgment on implementation specifics. Codex lacks deep knowledge of AbarVa's product vision unless that vision is explicitly loaded into context.

### Codex session startup

1. Codex reads CYCLE_STATE.md
2. Codex reads relevant platform-design documents (00 first; others as relevant)
3. Codex reads relevant design canon files (file 08 for runtime; file 10 for components)
4. Codex reads relevant pattern library files if work touches patterns
5. Codex emits session start status per reporting standard

### Codex execution

- One approved slice at a time
- No "while I'm here" expansions
- No silent scope drift
- No implementation without spec prerequisites met

### Codex handoff to verification

Codex does not verify its own work. Codex hands off with explicit framing: "Implementation complete. Verification pending." Codex stands by for verification results and subsequent remediation if needed.

### Codex escalation

If Codex encounters missing specs, contradictory specs, or ambiguous scope: escalate to founder. Do not guess. Do not fabricate.

## Code-specific operating rules

Code refers to the ongoing agentic AI development context (typically Claude Code or equivalent acting on the repository). Same principles as Codex with a few distinctions.

### Code multi-turn sessions

Code may run in multi-turn sessions on complex scope. Discipline still applies:

- Session start protocol at every session start (not just first)
- Cycle and scope references in every substantial response
- Honest reporting per standard format
- Handoff to verification on completion

### Code and parallel work

Code may execute scope items in parallel. When doing so:

- Each parallel stream gets its own status tracking
- Conflicts across streams get flagged (not silently resolved)
- Founder sees parallel progress, not merged-ahead-of-time results

### Code and pattern authoring

When Code authors pattern content (as opposed to implementation code):

- Follows canonical pattern template (ten sections)
- Cites evidence from registry, does not fabricate citations
- Flags when evidence is thin
- Hands off to Sentinel validation if validation logic exists; hands off to founder if not

## Crawler persona verification protocol

From document 06, with build-discipline specifics here.

### When to run crawler personas

- After every cycle closure
- Before every external-facing demo
- Before every investor or design-partner touchpoint
- Randomly during stable periods (spot checks for regression)

### Who runs crawler personas

- Founder plays or directs personas
- AI agents (Code or Claude) can play personas using the persona profiles from document 06
- Either mode produces a written report in the standard format (document 06)

### Persona selection per cycle

- Cycle addressing healthcare work → Dr. L minimum
- Cycle addressing financial work → Marcus T minimum
- Cycle addressing portfolio or Tower → Jake (CIO) minimum
- Cycle addressing Source → Priya (Sourcing Lead) minimum
- Cycle addressing technical architecture → Sarah (CTO) minimum
- Large cross-surface cycles → multiple personas

### Persona report handling

Persona report arrives → founder reviews → findings get categorized (severity-critical / high / medium / low) → next cycle scope includes critical and high severity items → medium and low items get scheduled or backlog.

## Anti-patterns in build discipline

The failures this document exists to prevent.

**The merge-equals-closure anti-pattern.** Treating code merge as completion. Fatal because it lets defects ship that passed internal review but fail persona scrutiny.

**The scope-drift anti-pattern.** Cycle scope expands silently during execution. Fatal because it breaks ability to forecast and plan.

**The unprotected-specs-anti-pattern.** Implementation proceeds before specs are complete. Fatal because it produces implementations that don't align with product vision.

**The unverified-velocity anti-pattern.** Reporting fast progress with thin verification. Fatal because velocity compounds into integrity debt.

**The specless-refactor anti-pattern.** Refactoring "while in the area" without corresponding spec updates. Fatal because refactors drift behavior silently.

**The silent-regression anti-pattern.** Previously completed items regress without explicit flagging. Fatal because it breaks trust in "completed" items.

**The scope-ambiguity anti-pattern.** Ambiguous scope resolved by guessing rather than asking. Fatal because it produces wrong-direction work that requires rework.

**The verification-by-self anti-pattern.** Implementing agent verifies its own work. Fatal because self-verification has systemic blind spots.

## The platform canon as source of truth

These nine documents are the source of truth for AbarVa platform design:

- 00 Master Anchor
- 01 Platform North Star
- 02 Context Bundle Standard
- 03 Page-Level Agent Contracts
- 04 Visual and Interaction System
- 05 Chat Input and Attachment Standard
- 06 Validation and Crawler Personas
- 07 Failure Mode Catalog
- 08 Build Governance (this document)

Conflicts between the canon and other documents (existing design canon files, pattern library, marketing materials) resolve in favor of the platform canon. Documents outside the canon must be updated or retired to align.

New platform-level decisions get added to the canon via explicit revision. Canon documents are not ad hoc edited without change-log entries and version increments.

## The approval workflow for canon revision

Canon documents evolve. The workflow for revision:

1. **Proposed revision drafted.** Someone (founder, implementing agent, reviewer) drafts the revision.
2. **Revision reviewed by founder.** Founder evaluates against consistency with other canon documents and against product vision.
3. **Revision integrated.** If approved, revision integrated into the canon document with version increment and change log entry.
4. **Cross-check against related documents.** Other canon documents reviewed for consistency with the revision.
5. **Revision communicated.** All implementing agents and contributors notified of the revision.
6. **Subsequent work aligns to revised canon.** Prior-to-revision work is not retroactively changed unless it conflicts materially with the revision.

## Observability and metrics

How the product's build health gets measured.

### Per-cycle metrics

- Cycle scope size (number of items)
- Completion rate against scope (items completed vs. planned)
- Verification pass rate (items verified / items completed)
- Persona verdict distribution (approve / defer / reject)
- Regression count (items regressed from prior cycles)
- Severity distribution of crawler findings

### Per-component metrics

- Spec completeness (prerequisites met: yes/no)
- Implementation completeness (all acceptance criteria met)
- Verification status (verified / pending / failed)
- Time from spec-locked to verified

### Per-surface metrics

- Five-question test pass (all five answered within three seconds)
- Compositional test pass (ten rules from document 04)
- Context Bundle quality score distribution
- Agent response quality scores (completeness, evidence, actionability, vanilla risk)
- Golden prompt pass rate

These metrics feed founder visibility into product health, not just feature velocity.

## Closing discipline

This document is the final one in the platform canon. When implementation begins in earnest against the canon, this document governs how.

The discipline specified here is not optional. It is what prevents AbarVa from becoming another enterprise SaaS that promises intelligence and delivers dashboards. The ten prerequisites before implementation, the gates per surface type, the cycle discipline, the reporting standards, the approval boundaries, the verification gates — these are the difference between building AbarVa well and building AbarVa quickly.

Build quality. Velocity follows. Build velocity first, and the integrity debt will eventually stop the product.


## GPT refinement addendum · Build governance for multi-agent product development

Build governance must account for the fact that AbarVa is being designed across multiple reasoning and coding agents. The risk is not only bad code; the risk is **uncontrolled product drift**.

### Multi-agent operating protocol

When Claude, GPT, Codex, or another agent contributes:

1. Critique becomes actionable only when converted into a spec change, Build Pack file, CYCLE_STATE item, or implementation review requirement.
2. Codex must not implement directly from critique text unless that critique has been approved as build scope.
3. Each implementation slice must cite the spec files it used.
4. Each implementation review must state which files it did not touch.
5. Product direction changes must update CYCLE_STATE.md before work continues.

### Required implementation review packet

Every implementation slice should produce a review packet with:

- intended scope
- files changed
- files intentionally not touched
- spec files referenced
- validation run
- design quality assessment
- failure modes addressed
- risks introduced
- recommended next step
- commit recommendation

This prevents self-attested progress from becoming the only evidence of quality.

### Design-first exception rule

For visual/product surfaces, implementation must not proceed unless at least one of the following exists:

- approved wireframe
- component spec
- crawler persona scenario
- explicit founder approval to prototype

If the work is infrastructure-only, such as type definitions or context builder stubs, an approved architecture/spec file is sufficient.

### Do-not-build enforcement

The do-not-build list in CYCLE_STATE.md is binding. If a task would require violating the list, Codex must stop and ask for scope approval. It should not partially implement adjacent work because it is convenient.

### Merge readiness checklist

A branch is merge-ready only when:

1. Work is grouped into logical commits.
2. Unrelated files are excluded.
3. Scoped validation has passed.
4. The implementation review packet exists.
5. CYCLE_STATE.md is updated.
6. Known warnings are documented.
7. The next item is explicitly identified.

### Product quality escalation

If a component technically works but feels generic, cluttered, or non-agentic, the correct action is not to continue building. The correct action is to pause, refine the component spec or visual system, and run crawler persona review.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with specific governance additions or corrections
2. Cross-check against all prior documents 00-07 for consistency
3. Cross-check against design canon file 08 for runtime contract alignment
4. Cross-check against framework section 13
5. Explicit founder sign-off

After AUTHORED-LOCKED, this document becomes the operating manual for all subsequent AbarVa development.


## Autonomy, approval boundaries, and auto-merge · Cycle 4 revision

**Added:** Cycle 4 canon revision session · April 24, 2026
**Addresses:** Conflict C10 from canon-vs-existing cross-check
documented in commit `1653852`

This section reconciles the **10-item approval boundary** specified in
document 00 with the **4-tier autonomy charter** specified in
`docs/design-canon/agent-autonomy-decision-charter.md`. Both documents
govern. They address different decision scopes.

### Scope separation

The approval boundary and the autonomy charter govern different
categories of decisions.

**Canon approval boundary (doc 00 items 1-10):** governs *slice
initiation*. What must be true before an implementation slice starts.
Checks whether specs exist, wireframes exist, Context Bundle definitions
exist, agent contracts exist, acceptance criteria exist, anti-patterns
are named, and founder has approved the specific slice.

A slice without all 10 prerequisites met is not ready to start. This
applies at cycle-scope-lock time and at session-start time, before any
code is written.

**Autonomy charter Tiers 1-4:** governs *micro-decisions inside an
already-approved slice*. Tier 1 decisions ("decide and move") cover
variable naming, helper function placement, obvious refactors within
the slice's file set, and similar low-stakes choices that don't require
documentation. Tier 2 decisions ("decide with documented rationale")
cover slightly more consequential choices that leave a trail but don't
require founder approval.

These two layers compose correctly:

1. Founder approves a slice (canon approval boundary — all 10
   prerequisites satisfied)
2. Implementing agent executes the slice, making Tier 1 and Tier 2
   decisions autonomously within the approved scope
3. Tier 3 and Tier 4 decisions (larger impact, require approval)
   escalate to founder even within an approved slice
4. Any scope expansion beyond what the slice authorized → stop and ask
   (violates both canon and charter)

The canon approval boundary is the outer gate. The autonomy charter
governs behavior inside the gate.

### Where the two docs must align

Both documents must make the scope separation explicit. This section
serves that purpose for the canon side. A reciprocal note in
`docs/design-canon/agent-autonomy-decision-charter.md` acknowledging
the canon approval boundary is Cycle 5+ cleanup scope.

### Auto-merge authority retirement at Cycle 4+

A specific consequence of the canon approval boundary: **the auto-merge
authority established in `memory/feedback_auto_merge_authority.md` for
Cycle 3 retires at Cycle 4+.**

**Why:** That memory granted pre-approval to self-merge Code-lane PRs
during the Wave 1 P0 sweep. That authority was appropriate for Cycle
3's execution character (rapid tactical fixes against a defined P0 list).
It is incompatible with the canon approval boundary's item 8 ("Founder
approves the slice explicitly") at slice initiation, and with item 10's
verification requirement after implementation.

**What changes for Cycle 4+:**

- Every C4-Dxx slice requires explicit founder approval at scope lock
  (canon doc 00 item 8)
- Implementation proceeds only against locked specs
- Code-lane PRs do NOT auto-merge — they require founder review of the
  commit diff and the implementation review packet before merge
- Crawler persona verification runs after merge before any item is
  declared complete (canon F9.1 prevention)

**What stays the same:**

- Inside an approved slice, the autonomy charter's Tier 1/2 autonomy
  preserves velocity for micro-decisions
- Code-lane ownership of implementation work is unchanged — this is
  about the merge/approval gate, not about who writes the code
- Reporting discipline per doc 08 Section "Reporting standards" governs
  all sessions

### Founder action required

Before Cycle 4 scope locks, founder should either:

1. **Formally retire `memory/feedback_auto_merge_authority.md`** —
   delete or annotate as CYCLE-3-ONLY with an explicit expiration note,
   OR
2. **Approve the retirement implicitly** by answering Q1/Q2/Q3 and
   locking Cycle 4 scope — the act of locking scope against this canon
   constitutes acceptance of this reconciliation

Silence is not acceptance. If founder wants to preserve auto-merge
authority in a modified form for Cycle 4 (e.g., pre-approved auto-merge
for a specific slice after explicit spec-lock), that modification needs
to be documented before Cycle 4 execution begins.

### Failure mode this prevents

This reconciliation prevents Failure Mode F9.1 (self-attested progress
without independent verification) and F9.2 (cycle scope drift).
Auto-merge authority at Cycle 4+ without spec-lock discipline would
reproduce exactly the Cycle 1/2 failure mode where agents reported
items closed after merge and crawler personas later revealed the
underlying defects remained.
