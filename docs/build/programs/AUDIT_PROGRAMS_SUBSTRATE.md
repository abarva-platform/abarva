# Programs Module Substrate Audit — Human Review

> **Purpose.** Diagnostic artifact reading the Programs Module Failure-Mode-Driven Design v1 against the actual codebase + open conversation context. Identifies what's built, what's documented but not built, what's not yet documented, and what's unknown until a repo crawl validates it.
>
> **Companion artifact.** `AUDIT_PROGRAMS_SUBSTRATE.yaml` is the structured machine-readable version. Hand the YAML to Claude Code (build backlog) or to a Claude extension that crawls the repo (validation pass). Read this markdown for narrative review.
>
> **Audit scope.** Programs module only. Once this audit is validated and the format is proven, the same template applies to Intelligence, Tower, Setup, and the agent training specs.
>
> **Reset framing.** This audit treats Programs not as "an agent + a UI" but as a workflow + data + role + artifact + gate + tenant-context substrate that the agent (Nexus) is the conversational front door of. The substrate is the product; the agent is the front door. Agent quality is bounded by substrate completeness.

---

## At a glance

**Total items:** 75

**By state:**
- Built and verified: 5
- Partial: 5
- Documented but not built: 50
- Not yet documented (design gap): 8
- Unknown (requires repo crawl to confirm): 7

**Layer distribution:**
- Workflow engine: 22 items
- Data model: 12 items
- Role model: 5 items
- Artifact system: 12 items
- Gate engine: 9 items
- Tenant context: 9 items
- Cross-cutting: 21 items

The dominant state is `documented_not_built` — the design doc specifies a substantial substrate that the codebase has not yet implemented. This matches the conversation reset point: "we haven't even loaded graph edges in postgres, don't have vector embeddings."

---

## Highest pilot-readiness blockers

These are the items that, if not closed, prevent the platform from running a real customer through a real program. Listed in approximate dependency order.

**1. TC-PERSISTENCE-INTEGRATION** — Agent retrieval against persisted graph + vector. Today everything runs on TypeScript fixtures (152 patterns). At pilot scale or with real client data, fixture-backed retrieval breaks. This is the foundational substrate gap and unlocks essentially every downstream item.

**2. WF-PHASESTEP-CONTRACT** — The PhaseStep type. The unit at which the agent decides what to do next. Without it, no per-phase step decomposition, no simple/complex routing, no intent capture loop, no post-meeting upload flow. This is the workflow-engine spine.

**3. AS-INTENT-CAPTURE-FLOW** — The agent flow that makes complex steps feel like a senior practitioner walks alongside the user. Detect complex step → ask intent → confirm plan → surface template → schedule upload → validate. Today this loop does not exist; complex steps degenerate into chat conversations.

**4. WF-FAILURE-MODE-CATALOG** — The 10 failure modes as a TypeScript artifact. Without it, anti-patterns can't tag against canonical IDs and the customer-visible failure-mode rollup is impossible.

**5. DM-PROGRAM-AUDIT-LOG-TABLE** — Every state transition writes here. Pilot-readiness baseline requirement; without it, "why did Nexus block our advance" is unanswerable.

**6. WF-STATE-MACHINE-PRE-P0** — Tenant Admin approval before P0 activation. Today commit_program likely activates P0 directly. Without the gate, use-case sprawl prevention (failure mode #10) is theoretical.

**7. GE-EVIDENCE-BASED-GATE-EVAL** — Gate evaluation should resolve DoD via structured `phase_evidence_links`, not text-scan. Without this, gate decisions are not evidence-traceable.

**8. EVAL-HARNESS-INFRASTRUCTURE** — The bridge between substrate and agent. Without an eval harness, Nexus training has no feedback loop and changes can regress silently.

These eight items, addressed in roughly this order, are what unlocks the rest.

---

## Design gaps blocking build

These items aren't "build harder" — they're "design first, then build." Each requires a documented decision before code can proceed.

**WF-P3-FULL-STEP-LIST-DESIGN** — The Programs design doc explicitly says P3 step list is "abbreviated; see file for full table." No file. Full step list (estimated 7-9 steps) needs senior-practitioner authoring.

**WF-WAVE-LOOP-DESIGN** — P5 references wave-by-wave rollout but doesn't specify how the workflow engine handles wave iteration. Sub-phase? Repeated step? Nested workflow? Architecturally undecided.

**DESIGN-OUTCOME-TRACKING-DOC** — Outcome tracking discussed in conversation as deserving its own design doc. Without it, P2 charter doesn't capture structured promise; P5/P6 measurement has no anchor; the portfolio outcome view has no spine.

**DESIGN-OVERLAP-DETECTION-RULES** — Open question explicitly flagged in design doc D.0.9. Without rules, Gate 0b cannot surface useful overlap signals to the Tenant Admin.

**DESIGN-PHASE-STEP-STATE-PERSISTENCE** — Where does per-step state live? Separate table? Evidence ledger? Program JSONB? Decision required before persistence implementation.

**DESIGN-EVAL-HARNESS-SPEC** — The harness spec needs to exist before the harness is built. Format for golden conversations, assertion taxonomy, CI integration.

**TC-EMBEDDING-DIMENSION-RECONCILIATION** — Vision doc says 3072 (text-embedding-3-large); readiness doc says 1536 (text-embedding-3-small). Worldview prompt set locked at 3072. Tenant data may use different. Decision needed.

These design gaps are smaller in scope than full design docs (Programs, Intelligence, Setup) — most are 1-3 page addenda. But they are blockers for the items that depend on them, so closing them is leverage.

---

## What's actually built

Five items confirmed built and verified (subject to repo crawl validation):

- **WF-PHASEPACK-CONTRACT-CORE** — PhasePack interface with outcome, definitionOfDone, rightQuestions, antiPatterns, coachingArc, dependencies
- **WF-PHASEPACK-P0-P6-IMPLEMENTATIONS** — All 7 phase pack files exist
- **GE-EVALUATE-GATE-CORE** — `governance.evaluateGate` works for the existing checks
- **TC-AGENT-RETRIEVAL-PATH** — `agent-retrieval.ts` wired (PR #1084 merged), fixture-backed
- **TC-TENANT-CONTEXT-COMPOSITION** — Tenant context (executive bench + program inventory) composed into agent system prompt
- **AS-DELIVERABLE-EXPORT-CONTRACT** — HTML export pattern exists

These are the foundation. Almost everything else hangs off them.

Five items partially built — meaning some work exists but completeness is incomplete:

- **WF-PATTERN-CATALOG-PARAMETERIZATION** — LifecyclePatternSeed exists; typed per-phase parameter slots are gap
- **WF-PATTERN-PACK-CDP** — Pattern likely exists; full parameterization across phases is gap
- **DM-PROGRAM-APPROVALS-TABLE** — Approval plumbing partially exists; full state machine integration extension needed
- **RM-FIVE-ROLES-DEFINITION** — Some roles defined; full set with per-surface authority enforcement requires audit
- **GE-SOFT-FAIL-BYPASS-AUDIT** — Soft-fail bypass exists; audit completeness needs verification
- **CC-TELEMETRY-EVENTS-COMPLETE** — Some events likely exist; failure-mode tagging on events is gap

---

## What's unknown

Seven items where neither the design doc nor my analysis can confirm state without running the codebase. The Claude extension's job is to convert these to one of the other states.

- **DM-PROGRAM-TABLE** — Programs table exists but tenant_key + RLS coverage requires validation against the apex-retail vs apexretail key drift caution
- **RM-API-ROLE-ENFORCEMENT** — Role checks at API boundary need verification per endpoint
- **WF-PATTERN-PACK-FORECAST** — Forecast pattern ID flagged "provisional" in design doc; existence and content unknown
- **CONTENT-PHASE-PACK-SIGNOFF** — Sign-off process / log not yet specified
- Plus a handful of validation-pending items where the file path in the design doc may differ from actual code

---

## Recommended build sequence

The audit groups items into seven phases by dependency. This is a sequencing recommendation, not a fixed roadmap.

**Phase 1 — Substrate (foundational data and persistence):**

The substrate gaps that everything else depends on. Postgres schema for graph nodes / edges / evidence / context chunks. Vector embedding pipeline. Audit log table. Notifications table. Approvals table. File attachments table. Tenant isolation negative tests.

Without Phase 1, every downstream item is built against fixtures and breaks at pilot. This phase is non-negotiable as a prerequisite.

**Phase 2 — Workflow engine extensions:**

PhaseStep contract. Failure-mode catalog as TypeScript artifact. Pre-P0 state machine with submitted_for_approval state. Phase pack failure-mode tagging. Pattern catalog typed parameterization.

These are the workflow-engine capabilities the design doc adds on top of what's already built.

**Phase 3 — Per-phase step decomposition + per-archetype pattern packs + templates:**

P0-P6 step decomposition (7 items). CDP / AMS / CC AI / Forecast pattern pack full parameterization (4 items). Template registry plus per-phase templates per archetype (8 items).

This phase is heavy on content — most of these items require senior practitioner authoring, not engineering effort. Worth treating as a parallel content track that engineering can work against.

**Phase 4 — Agent flows (the front-door behavior):**

Agent doctrine step layer. Intent capture flow. Post-meeting upload flow. Anti-pattern flagging directive. Failure-mode catalog block in system prompt.

These are the behaviors that make Nexus feel like a senior practitioner. Each is bounded by Phase 1-3 substrate; each requires the eval harness from Phase 6 to verify quality.

**Phase 5 — Governance (gates and approvals):**

Evidence-based gate evaluation. Gate 0b Tenant Admin approval. Architecture-review-attested check. Pilot-passed-criteria check. Tenant Admin approval queue surface.

These are the gates that prevent the failure modes the platform exists to prevent.

**Phase 6 — Eval harness and telemetry:**

Eval harness spec then infrastructure. Per-archetype scenarios. Per-failure-mode awareness scenarios. Complete telemetry events. Failure-mode rollup dashboard.

The eval harness is the bridge between substrate completeness and agent quality. The rollup dashboard is the customer-visible value-prop demonstration. Both are prerequisites for pilot.

**Phase 7 (parallel) — Design gaps first:**

The 7 design gaps need to close before items that depend on them can start. This is parallelizable with Phase 1-6 — different work, doesn't conflict.

---

## How to use the audit with Claude Code

**For each Claude Code session targeted at Programs build:**

1. Read `AUDIT_PROGRAMS_SUBSTRATE.yaml` first.
2. Identify items with `current_state: documented_not_built` that match the session's scope.
3. Check `dependencies.blocked_by` — if any blocker is unresolved, surface that and stop.
4. Use the `acceptance_criteria` field as the definition of done for the work.
5. Respect `pilot_readiness_impact` as the prioritization signal.
6. When work completes, update YAML state to `built_and_verified` (this is a process change — the YAML becomes a living document).

**For items with `current_state: unknown`:**

Don't guess. Either run a repo crawl (Claude extension) to validate, or run `validation_command` directly, or stop and ask the human reviewer.

**For items with `current_state: not_yet_documented`:**

Don't build. Surface the design gap. Author the addendum doc first, get sign-off, then build.

---

## How to use the audit with a Claude extension repo crawler

**For each audit item:**

1. Read the `code_check` block.
2. Run `validation_command` against the repo.
3. Compare output against `expected_files`, `expected_symbols`, `grep_patterns`.
4. Output a determination: confirms current_state / refutes current_state / partial.
5. Aggregate determinations into AUDIT_VALIDATION_REPORT.md.

**The validation report should call out:**

- Items where audited state was wrong (overestimated what's built)
- Items where audited state was wrong (underestimated — already built)
- Items still unknown after validation (validation_command returned ambiguous output)
- New items discovered in the repo that aren't in the audit (gap in the audit itself)

---

## What this audit doesn't cover

Worth being explicit about scope.

**Not covered:**

- Front-end / UI components beyond the design doc's references
- Storybook entries, design system tokens
- API documentation completeness
- Performance / load testing
- Specific deployment / environment configuration
- Integration with external systems (Resend/Postmark, virus scan vendor)
- Specific CI/CD integration mechanics

**These are valid concerns but they're operational, not substrate.** The audit focuses on the substrate the agent rides on. Operational concerns layer on top once substrate is solid.

**Also not covered:**

- Intelligence surface substrate (separate audit needed)
- Tower surface substrate (separate audit needed)
- Setup surface substrate (separate audit, mostly aligns with tenant-context items here)
- Sentinel / Atlas / Steward agent training (separate audits per agent)
- Worldview content ingestion (covered in worldview prompt set; not in this audit)

The recommendation is to expand the audit to those surfaces in sequence after Programs validates the format.

---

## Open questions for human review

Before Claude Code or a repo crawler runs against the audit, worth getting your input on these:

**1. Build sequencing order.** Phase 1 (substrate) and Phase 7 (design gaps) are blockers. Phase 2-6 has internal flexibility — for example, a leaner pilot could ship with one archetype's pattern pack fully built (Phase 3) and others stubbed. Worth deciding whether you want all 4 archetypes at pilot or 1-2 deep.

**2. Outcome tracking design doc.** This is a `not_yet_documented` item that affects multiple `documented_not_built` items downstream. Worth deciding if outcome tracking gets its own design doc now or folds into Programs design doc as an extension chapter.

**3. Embedding model decision.** Reconciliation between 3072 and 1536 affects vector pipeline cost and retrieval quality. Worldview content is locked at 3072. Tenant data could differ. Worth deciding before the embedding pipeline is built so re-embedding isn't required.

**4. Pattern pack content authoring.** The 4 archetype pattern packs (CDP, AMS, CC AI, Forecast) are heavy content lift requiring senior practitioner involvement. Worth deciding whether you author them yourself, hire a content track, or use codex (with strong specs) to draft and you review.

**5. Eval harness scope.** The audit lists 4 archetype eval scenarios plus complex-step plus failure-mode awareness. Each is meaningful work. Worth deciding pilot scope — full coverage or narrowed coverage with explicit gaps.

**6. Audit format validation.** This audit is the first in the failure-mode-driven assessment series. Worth running it through Claude Code or a Claude extension once and seeing whether the format works in practice before producing audits for Intelligence, Tower, Setup.

---

## Next deliverables once this audit is validated

Once the format is proven on Programs, sequence:

- **AUDIT_INTELLIGENCE_SUBSTRATE.yaml** — same template, applied to Intelligence surface and the four-mode answer model substrate
- **AUDIT_TOWER_SUBSTRATE.yaml** — same template, applied to Tower bridge view and the pressure-source taxonomy
- **AUDIT_SETUP_SUBSTRATE.yaml** — same template, applied to Setup/Admin data view and the 14 dataset families ingestion
- **AUDIT_AGENT_TRAINING_NEXUS.yaml** — voice doctrine, eval harness scenarios, regression suite for Nexus specifically (using the substrate the Programs audit unlocks)
- **AUDIT_AGENT_TRAINING_SENTINEL.yaml** — same shape for Sentinel
- **AUDIT_AGENT_TRAINING_ATLAS.yaml** — same shape for Atlas
- **AUDIT_AGENT_TRAINING_STEWARD.yaml** — same shape for Steward

The audits compose. The same substrate items (e.g., DM-GRAPH-NODES-EDGES-MIGRATION, DM-VECTOR-EMBEDDING-PIPELINE) appear in multiple audits — they're foundational across surfaces. Closing them once unblocks all dependent surface audits.

---

**End of Programs Module Substrate Audit.**

This artifact is intended as a living document. As items move from `documented_not_built` to `built_and_verified`, update both YAML and markdown. The audit becomes the build dashboard.
