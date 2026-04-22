# AbarVa Programs Page · Canonical Design Specification

**Session:** April 20, 2026
**Status:** Track A Packet 1 in progress · 13 packets total
**Purpose:** Implementation-grade reference for the Programs surface. Intended for engineers and agentic execution (Claude Code, Codex). Companion to Intelligence spec.
**Companion docs:**
- `docs/specs/intelligence/design-spec.md` — Intelligence design (9 packets, complete)
- `abarva-intelligence-session-handoff-apr20.md` — session state

## Table of contents

### Track A · Foundation (4 packets)
- Packet 1 · Surface architecture + program shapes *(in progress)*
- Packet 2 · Genome + pattern match at origination
- Packet 3 · Multi-role composition (Sponsor / Lead / Nexus / Maestro)
- Packet 4 · Governance, versioning, permissions, pattern promotion

### Track B · Portfolio surface (2 packets)
- Packet 5 · Portfolio IA + origination flows
- Packet 6 · Portfolio wireframes + screen spec

### Track C · Single program surface (5 packets)
- Packet 7 · Program IA (hybrid phase/module nav)
- Packet 8 · Embedded Nexus model (delivery mode)
- Packet 9 · Module render patterns (17 modules)
- Packet 10 · Phase-by-phase wireframes (6 states)
- Packet 11 · Execute phase deep-dive (ops surface)

### Track D · Ship (2 packets)
- Packet 12 · Screen spec + cross-links + Prat demo beats
- Packet 13 · Claude Code build pack (Programs)

---

## Packet 1 · Surface architecture + program shapes

### 1.1 Purpose & success criteria

Programs is where Intelligence becomes execution. The page surface answers four questions every visit:

1. What programs are in flight? (portfolio view)
2. What's happening inside this specific program? (program detail)
3. Where in the lifecycle are we right now? (phase view)
4. What action do I own in the next 48 hours? (personal inbox per role)

**Success criteria (binary):**

- A sponsor lands on their program and knows within 30 seconds: current phase, what's waiting on them, what's waiting on others
- A program lead can complete a full phase's work without leaving the program surface
- Nexus operates as embedded delivery agent — drafting, analyzing, framing — not research chatbot
- An Intelligence-originated program charter pre-loads 50%+ of Charter content automatically
- Three shapes (Template, Pattern, Custom) render fluidly in same surface

### 1.2 Five surfaces · one product area

Programs is not a page. It is a product surface composed of five distinct page types:

**Surface 1 · Portfolio index** (`/programs`) — all visible programs, filters, search, origination launchpad
**Surface 2 · Single program** (`/programs/:programId`) — hybrid phase/module nav, role-aware, shape-adaptive
**Surface 3 · Phase workspace** (`/programs/:programId/phase/:phaseNumber`) — one phase full screen, phase-specific UI
**Surface 4 · Module workspace** (`/programs/:programId/module/:moduleKey`) — single module full screen, 80% of actual work
**Surface 5 · Deliverable detail** (`/programs/:programId/deliverable/:deliverableId`) — versioned artifact, history, approvals

### 1.3 Three program shapes

**Shape A · Template** (~15%) — full 6 phases × up to 17 modules. No pre-load. Novel problems. Writes new pattern on completion. Highest rigor, highest fee.

**Shape B · Pattern** (~70%) — 2–4 phases × 4–8 modules (subset of 17). 50–70% pre-loaded from matched Genome pattern. Client fills specifics. Fast time-to-value. Standard fee.

**Shape C · Custom** (~15%) — Maestro-authored specialized structure. Custom phase sequence. Custom modules. High-value specialized pricing. Example: PDLC → capital reallocation.

All three shapes use **same UI primitives**. What varies: which phases/modules render, pre-load depth, canonical vs specialized modules.

### 1.4 Six-phase canonical lifecycle

| # | Phase | Purpose | CXO touch | Typical output |
|---|---|---|---|---|
| 1 | Origination | Use case captured, scope drafted, sponsor assigned | — | Program charter draft |
| 2 | Charter | Scope locked, success criteria, baseline request | — | Signed charter · baseline request list |
| 3 | Diagnose | Data analyzed, findings, contradictions flagged | **CXO interview** | Findings · baseline metrics |
| 4 | Design | Solution options, tradeoffs, recommendation | — | Recommendation memo · business case |
| 5 | Execute | Build, integrate, deploy, measure | — | Deliverables catalog · milestone reports |
| 6 | Verify | Outcome measurement, benefit realization | **CXO verification** | Outcome report · benefit attestation |

**Hard gates:** Phase 3 entry (Charter signed) · Phase 3 CXO interview (before findings publish) · Phase 5 entry (Design approved) · Phase 6 CXO verification (before outcome fee invoice). All other transitions soft with unresolved markers.

**CXO touchpoints are exactly two per program.** Non-negotiable for Template and Pattern shapes.

### 1.5 17 canonical modules

| # | Module | Typical phase | Shapes |
|---|---|---|---|
| 1 | Problem Framing | Origination | All |
| 2 | Stakeholder Map | Charter | All |
| 3 | Success Criteria Definition | Charter | All |
| 4 | Baseline Data Request | Charter | All |
| 5 | Diagnostic Instrument | Diagnose | Pattern, Template |
| 6 | Data Analysis + Findings | Diagnose | All |
| 7 | Contradiction Surface | Diagnose | All |
| 8 | CXO Interview Prep + Capture | Diagnose | All |
| 9 | Solution Library Match | Design | Pattern, Template |
| 10 | Vendor/Tech Evaluation | Design | Pattern, Template |
| 11 | Tradeoff Matrix + Recommendation | Design | All |
| 12 | Business Case + ROI | Design | All |
| 13 | Implementation Plan | Design/Execute | All |
| 14 | Build + Integration Tracking | Execute | Pattern, Template |
| 15 | Change Management Plan | Execute | Pattern, Template |
| 16 | Outcome Measurement | Verify | All |
| 17 | Benefits Realization + Genome Feedback | Verify | All |

Custom shapes: any subset of these 17 + specialized modules. Example: PDLC uses #2, #3, #11, #12, #17 + "Persona Productivity Model" + "PDLC Value Leakage Analysis."

### 1.6 Routing structure

```
/programs                                          Portfolio index
/programs/new                                      Origination flow
/programs/:programId                               Single program (main)
/programs/:programId/phase/:phaseNumber            Phase workspace
/programs/:programId/module/:moduleKey             Module workspace
/programs/:programId/module/:moduleKey?version=N   Historical version
/programs/:programId/deliverable/:deliverableId    Deliverable detail
/programs/:programId/timeline                      Timeline/Gantt
/programs/:programId/team                          Participants
/programs/:programId/settings                      Program settings (admin/maestro)
```

All routes shareable. Permission-gated on load. Unauthorized users see "not visible" + "request access" routed to sponsor.

### 1.7 Cross-cutting dimensions

1. **6 lifecycle phases** — surface shape varies per phase
2. **17 modules** — canonical library + specialized extensions
3. **4 roles** — Sponsor · Program Lead · Nexus · Maestro, each sees same surface differently
4. **Versioning + governance** — deliverables versioned, phases gated, approvals audited, pattern promotion tracked
5. **Embedded Nexus** — 3 modes (side-panel · module-embedded · CXO takeover)
6. **5 archetypes** — Strategic Transformation · Workflow Automation · Platform Modernization · AI Product Enablement · Operational Optimization
7. **3 origin paths** — Intelligence-promoted · User-initiated · Tower-triggered
8. **CXO touchpoints × 2** — exactly two for standard shapes

### 1.8 Performance targets

| Operation | Budget |
|---|---|
| Portfolio index load (20 programs) | ≤ 1000ms |
| Single program load | ≤ 1200ms |
| Phase workspace load | ≤ 800ms |
| Module workspace load | ≤ 1000ms |
| Module save | ≤ 500ms |
| Nexus side-panel first token | ≤ 1500ms |
| Nexus module drafting (1-page artifact) | ≤ 8s |
| Phase advance (gate + write) | ≤ 2000ms |
| Deliverable version publish | ≤ 3000ms |

### 1.9 Relationship to Intelligence page

| From Intelligence | Into Programs |
|---|---|
| "Scope as Program" button on floater | Routes to `/programs/new?source=thread&threadId=<id>` with pre-loaded charter |
| "Attach to Program" on artifact | Promotes ephemeral → persistent in target program |
| Thread attachment (whole or selected turns) | Thread becomes source-of-record in Origination |
| Cohort benchmark cards | Flow into baseline module as reference benchmarks |
| Contradiction signals | Flow into Diagnose phase as pre-loaded findings |

All Intelligence → Programs flows are **one-way**. No reverse flow. Architectural, not policy.

### 1.10 Schema reuse

Programs builds on existing `public.*` schema:

| Existing table | Role in Programs |
|---|---|
| `engagements` | Core program record (UI-layer rename only) |
| `engagement_phases` | Phase state per program |
| `engagement_topics` + `engagement_topics_map` | Pattern library (the Genome) |
| `phase_workstreams` | Module-equivalent groupings |
| `phase_findings`, `phase_outputs` | Phase work products |
| `deliverable_types`, `deliverables_v2`, `deliverable_versions` | Versioned deliverables |
| `genome_matches` | Pattern match instrumentation |
| `engagement_baseline` | Baseline metrics + fee trigger |
| `engagement_participants` | Team membership |
| `engagement_activity` | Activity log |
| `engagement_uploads` | File attachments |
| `phase_approvals` | Gate approvals |
| `contradictions` | Diagnose-phase inputs |
| `vip_profiles` | CXO interview prep |
| `persons`, `relationship_notes` | Sponsor/lead context |

New tables to add (Packet 13 specifies):
- Program-level Nexus threads (separate from Intelligence threads)
- Module state per program (active/completed/skipped)
- Pattern promotion state (Custom → Candidate → Proven)
- Role-aware view state (last-viewed phase/module per role per person)

### 1.11 Calls I made

1. **Five surfaces, not one page.** Programs is a product area.
2. **Three shapes are first-class.** Compose in same surface, not separate products.
3. **Six canonical phases, two CXO touchpoints, hard-gated.** Template/Pattern cannot deviate. Custom can.
4. **17 canonical modules is a library, not fixed sequence.** Programs select subsets. Custom extends.
5. **UI-layer rename only.** DB stays `engagements`. Zero migration risk.
6. **80% reuse of existing schema.** ~5 new tables needed.
7. **Performance budgets tighter than Intelligence** (1000ms vs 800ms). Programs is home; Intelligence is evaluative.
8. **Intelligence → Programs one-way.** Governance architecture, not policy.
9. **"Scope as Program" pre-loads Charter, not Origination.** Intelligence has done Origination.
10. **Role-awareness at render, not URL.** One URL per surface, different affordances per role.

---

## Packet 2 · Genome + pattern match at origination

### 2.1 Purpose & success criteria

The Genome is AbarVa's moat. Pattern shapes depend on it. This packet specifies how a new program finds its shape at birth.

**Success criteria:** User arrives at new-program with natural-language use case → sees ranked Genome matches within 5 seconds · top match has actionable confidence + evidence · user can accept/modify/override in one click · Maestro can author new Custom in <30 min · promotion is rule-enforced.

### 2.2 Three origin paths

**Path 1 · Intelligence-promoted** (~50%) — "Scope as Program" from Intelligence. Context pre-extracted. Origination 60–80% pre-loaded.
**Path 2 · User-initiated** (~35%) — direct to `/programs/new`. Structured intake form.
**Path 3 · Tower-triggered** (~15%) — contradiction/signal auto-drafts program scaffold.

### 2.3 Pattern classifier · 3-stage pipeline (≤5s budget)

**Stage 1 · Intent extraction (≤1000ms)** — Haiku entity extraction. Output: archetype, industry/function/objective hints, entities, scale signals.

**Stage 2 · Vector match (≤2000ms)** — Voyage-3 embedding. Pinecone search on `public-patterns` namespace. Filter by archetype + industry. Return top-10.

**Stage 3 · Scoring + ranking (≤1500ms)** — weighted composite:
```
match_confidence =
  0.4 * vector_similarity
  + 0.2 * archetype_match
  + 0.15 * industry_match
  + 0.15 * entity_overlap
  + 0.1 * prior_success_rate
```

Threshold 0.4 min to surface.

**Confidence bands:**
- **High** (≥0.75) → propose Pattern, high pre-load
- **Medium** (0.50–0.75) → propose Pattern with caveats
- **Low** (0.40–0.50) → propose Template with pattern hints
- **No match** (<0.40) → propose Template

### 2.4 Shape proposer UI

Nexus renders top match prominently · 2 secondary matches de-emphasized · Template and Custom override paths always visible · pattern detail drawer on click showing canonical shape, pre-load, diagnostic questions, benchmark data, prior refs (anonymized), success signals, failure modes.

### 2.5 Authoring permissions

| Action | Client | Admin | Maestro | Founder |
|---|---|---|---|---|
| Accept Pattern | ✓ | ✓ | ✓ | ✓ |
| Modify Pattern | ✓ | ✓ | ✓ | ✓ |
| Override to Template | ✓ | ✓ | ✓ | ✓ |
| Author Custom at origination | — | — | ✓ | ✓ |
| Promote Custom → Candidate | — | — | ✓ | ✓ |
| Promote Candidate → Proven | — | — | — | ✓ |
| Edit existing Pattern | — | — | ✓ | ✓ |
| Deprecate Pattern | — | — | — | ✓ |

### 2.6 Promotion state machine

```
DRAFT (Maestro authoring)
  → CANDIDATE (1st deployment)
  → CANDIDATE_1 (1 successful)
  → CANDIDATE_2 (2 successful)
  → PROVEN (3 successful · visible in proposer)
  → MATURE (5+ successful · cohort n≥3)
  → DEPRECATED (Founder-initiated)
```

**Rules:** Only Proven+ appears in proposer to clients. Candidate patterns Maestro-selectable. Promotion requires Phase 6 outcome attestation, not just engagement completion. 3 successes for Proven — inviolate.

### 2.7 Genome feedback loop (on program completion)

- Outcome report → cohort metrics attached
- New contradictions → candidates for contradiction library
- New vendors/tech → vendor database candidates
- Effective diagnostic Qs → promoted to pattern's instrument
- Failures → added to pattern's failure_modes
- Custom 2nd completion → auto-promoted CANDIDATE_1 if Maestro approves
- All telemetry anonymized (hashed client IDs only)

### 2.8 Schema integration

**Reuse `engagement_topics`:** `phase_playbook`, `typical_deliverables`, `diagnostic_questions`, `common_contradictions`, `success_signals`, `failure_modes`, `maturity_version`, `prior_engagement_refs`, `engagement_topics_map`.

**New columns on `engagement_topics`:**
- `promotion_state` text (enum DRAFT→DEPRECATED)
- `deployment_count` integer
- `successful_deployment_count` integer
- `last_successful_deployment_at` timestamp
- `canonical_shape_json` jsonb

**New table: `pattern_match_logs`** — records every match event. Fields: engagement_id, proposed_pattern_id, match_confidence, accepted/modified/overridden, user_person_id, created_at. Load-bearing for classifier tuning.

### 2.9 Origination flow

**Path 1 (Intelligence):**
1. Intelligence floater → "Scope as Program"
2. `POST /api/v1/programs/originate` with thread context
3. Classifier runs (Stage 1 skipped if intent clear)
4. Redirect to `/programs/new?match=<topId>&sourceThread=<id>`
5. Shape proposer with top match pre-selected
6. User accepts/modifies/overrides
7. Program created · Charter pre-loaded from thread
8. Redirect to `/programs/:newId`

**Path 2 (Direct):**
1. `/programs/new` → structured intake
2. Submit use case + outcome + sponsor
3. `POST /api/v1/programs/originate` full pipeline
4. Shape proposer with top 3 matches
5. User decides · program created
6. Redirect to `/programs/:newId`

**Path 3 (Tower):**
1. Contradiction/signal → "Create Program from Signal"
2. `POST /api/v1/programs/originate` with signalId + suggestedShape
3. Classifier uses signal context + suggested shape
4. Shape proposer with Tower's suggestion pre-selected
5. User confirms/modifies · program created

### 2.10 Custom shape authoring (Maestro · separate surface)

Lives at `/maestro/patterns/new` — NOT in Programs surface. Captures: intent description, archetype, filters, phase sequence, module selection, per-module pre-load content, benchmark anchors, failure modes, promotion notes. Authored externally, published to Genome. Specified in future admin packet.

### 2.11 Calls I made

1. 3-stage classifier deterministic (Haiku + Pinecone + algorithmic scoring). Reproducible, testable.
2. Match confidence weighted composite — vector dominates but insufficient alone.
3. Threshold 0.4 min. Below → Template.
4. 3 top matches max. More is paralyzing, fewer creates false confidence.
5. Pattern detail drawer non-negotiable transparency.
6. Clients modify but never author.
7. 3 successful deployments for Proven. Inviolate.
8. Founder-gated at Proven. Prevents Maestro gaming.
9. Custom authoring outside Programs surface.
10. `pattern_match_logs` load-bearing for iteration.
11. Tower proposes; user decides. Never auto-accept.
12. "No match" is valid outcome → Template.

---

## Packet 3 · Multi-role composition (Sponsor / Lead / Nexus / Maestro)

### 3.1 Purpose & success criteria

One URL, four roles, each sees program through different affordance lens. Architecturally the most complex packet in Track A.

**Success criteria:** Sponsor sees only decision/approval-relevant content · Lead sees everything editable · Nexus appears as actor (not tool) · Maestro sees oversight overlay on standard surface · no role sees irrelevant content, no role blocked from needed content.

### 3.2 The four roles

**Sponsor** (CXO) — charter summary, decisions needed, milestone status, outcome metrics. Edits: sponsor notes, approvals, CXO interview (P3), outcome attestation (P6). Cadence: 2 CXO touchpoints + drop-ins. Mental model: "What do I decide, what's at risk?"

**Program Lead** (client-side operator) — everything editable. All modules, deliverables, phase progression, team. Daily primary operator. Mental model: "Am I on track, what's blocking next gate?"

**Nexus** (embedded AI delivery agent) — full L1-L4 context + program state + Genome. Drafts deliverables, flags issues, generates content. Always-on + proactive. Mental model: "What can I draft, what should I surface?"

**Maestro** (AbarVa oversight) — portfolio view + pattern health + intervention flags. Light-touch weekly + heavy-touch on flags. Mental model: "Which programs need me, which patterns drifting?"

### 3.3 Role-aware rendering model

```tsx
<ProgramSurface viewerRole={resolveRole(user, program)}>
  <ProgramHeader />
  <PhaseNavigator />
  {viewerRole === 'sponsor' && <SponsorDashboard />}
  {viewerRole === 'lead' && <LeadWorkspace />}
  {viewerRole === 'maestro' && <MaestroOversightOverlay />}
  <NexusPresence />
</ProgramSurface>
```

**Resolution logic:**
```
if user.global_role IN ('maestro', 'founder') → 'maestro'
else if user.id === program.sponsor_person_id → 'sponsor'
else if user.id in program.lead_person_ids → 'lead'
else if user in program.participants → 'team_member' (subset of lead)
else → 'no_access'
```

Role resolved per-program, not per-user. Anand = founder+sponsor+lead across different programs.

### 3.4 Sponsor view

**Renders:** program name + archetype + phase · charter summary (3 bullets) · open decisions panel (0-3 items) · milestone tracker · key findings · recommendation summary · outcome metrics live · recent activity (filtered).

**Hidden:** module-level editing, workstream chat, Nexus drafting panel, tactical drafts, team management.

**Actions:** approve/defer gates · sponsor notes · CXO interview (P3) · outcome attestation (P6) · "Show me everything" expansion to lead view.

### 3.5 Lead view

Sponsor view + module dashboard (grid of active modules with status/edited/version/blockers · click → module workspace) · workstream messages (chat-like, Nexus participates) · phase orchestration (advance, skip, complete, invite) · deliverable catalog (all versions, filters, bulk ops) · Nexus side-panel always-on.

**Actions:** edit any module · request Nexus drafts · advance/revert gates · promote deliverable versions · request CXO slots · modify charter with sponsor approval.

### 3.6 Nexus role — actor, not tool

**Sees:** full L1-L4 context + `program_threads` (NEW table · per-program Nexus history) + current program state.

**Operates in 4 modes:**

1. **Side-panel** (collapsed default) — Q&A on program, data, decisions
2. **Module-embedded drafting** — "Nexus: draft this module" from within module workspace · uses pattern pre-load + L2 data + findings
3. **CXO takeover** (P3 interview, P6 verification) — full-screen sponsor conversation · diagnostic Q→A · outputs to phase findings/outcome report
4. **Proactive** — contradiction agent async → activity feed · pattern drift detector on phase advance

Provenance always visible. Every output tagged with sources.

### 3.7 Maestro oversight overlay

Adds to standard surface: oversight banner (pattern health, draft quality, anomalies) · intervention flags · pattern health panel (this deployment vs cohort benchmarks) · Maestro private notes.

**Maestro actions:** override Nexus drafts · flag for escalation · edit Genome patterns (Proven patterns require Founder approval) · add pattern-promotion observations.

**Maestro portfolio view** (`/programs?view=maestro`): all assigned programs · health dashboard · pattern performance grid · intervention queue.

### 3.8 Cross-role interaction patterns

**Pattern A · Approval (Lead → Sponsor):** lead publishes `in_review` · sponsor notified · sponsor reviews drawer · approve → `signed_off` · request changes → `draft` with comment.

**Pattern B · Nexus assistance (Lead → Nexus):** lead types/clicks · Nexus drafts inline · lead accepts/edits/rejects · accepted → deliverable version with Nexus attribution.

**Pattern C · Maestro intervention (Maestro → Program):** flag in oversight queue · Maestro investigates · comment to lead · override draft · escalate to Founder · mark resolved.

### 3.9 Notifications by role

| Event | Sponsor | Lead | Nexus | Maestro |
|---|---|---|---|---|
| Program created | — | Always | — | If in portfolio |
| Phase advanced | If sponsor | Always | — | If flagged |
| Deliverable in review | If approver | Always | — | If drift |
| CXO interview scheduled | Always | Always | — | If opt-in |
| CXO verification needed | Always | Always | — | Always |
| Contradiction surfaced | If severe | Always | — | If 48h+ unresolved |
| Pattern drift | — | Always | — | Always |
| Nexus draft quality flag | — | Always | — | Always |

Personal inbox at `/programs?view=inbox`.

### 3.10 Schema additions

**New columns on `engagement_participants`:**
- `view_state` jsonb (last-viewed phase/module, collapsed panels)
- `notification_preferences` jsonb

**New table `program_threads`:** id, program_id, person_id, role_at_creation, conversation_messages jsonb, created_at, last_turn_at

**New table `maestro_oversight_flags`:** id, program_id, flag_type, severity, description, flagged_at, resolved_at, resolved_by, resolution_notes

Reuse: `engagement_participants.role`, `engagements.sponsor_person_id`, `persons.primary_role`, `phase_approvals`, `engagement_activity`.

### 3.11 Calls I made

1. One URL per surface, role-aware rendering. Four URLs would fragment.
2. Sponsor view ruthlessly decluttered. CXO time is scarcest.
3. Nexus is actor not tool. Authors, flags, surfaces proactively.
4. Maestro oversight is overlay not separate view.
5. Role resolution per-program, not per-user.
6. 3 interaction patterns (Approval, Assistance, Intervention) are meaningful; others variations.
7. CXO takeover distinct from side-panel Nexus. Different UI, different pacing.
8. Maestro private notes are DB-level separated.
9. Notifications per-role. Sponsor wants summaries; lead wants everything.
10. `program_threads` is new table, not reuse of Intelligence threads.
11. "Request access" routes to sponsor, not Maestro.
12. Team members = 5th role · read-only subset of Lead view.

---

## Packet 4 · Governance, versioning, permissions, pattern promotion

### 4.1 Purpose & success criteria

Governance is what makes Programs different from Intelligence. Programs is persistent-by-default — versioned, attributable, auditable, immutable where it matters.

**Success criteria:** Every change auditable (who/what/when/why) · deliverables clean version history · phase gates enforce integrity · permissions simple for client admins · promotion rule-enforced · residency/right-to-forget without manual work.

### 4.2 Three governance states

**Ephemeral** (rare in Programs) — session-only, auto-delete at session end or 24h grace. Not versioned.

**Persistent-draft** — saved to DB, user-editable, not yet external-visible, versioned per save.

**Persistent-published** — immutable, edits create new versions, full history, attribution recorded.

**Transitions one-way, explicit, audit-logged.** No reverse transitions.

### 4.3 Versioning model

**Deliverables versioned** — reuses `deliverables_v2` + `deliverable_versions`.

**Phases snapshotted** — on advance, full state snapshot captured (new pattern).

**Modules state-logged** — compact: only current state + `module_state_log` events.

**Charter version-tracked** — changes require sponsor approval, before/after diff logged.

### 4.4 Permission matrix

| Action | Sponsor | Lead | Team | Maestro | Founder | Nexus |
|---|---|---|---|---|---|---|
| View program | ✓ | ✓ | ✓ scope | ✓ if portfolio | ✓ | ✓ |
| Edit charter | Approve | Propose | — | ✓ w/ Sponsor | ✓ | — |
| Edit modules | — | ✓ | ✓ own WS | ✓ | ✓ | Draft assist |
| Create draft | — | ✓ | ✓ own WS | ✓ | ✓ | ✓ |
| Publish (draft→in_review) | — | ✓ | ✓ own WS | ✓ | ✓ | — |
| Sign off (in_review→signed) | ✓ | ✓ low-stakes | — | ✓ | ✓ | — |
| Advance gate (soft) | — | ✓ | — | ✓ | ✓ | — |
| Advance gate (hard) | Approve | Request | — | ✓ | ✓ | — |
| Skip module | — | ✓ w/ reason | — | ✓ | ✓ | — |
| Invite member | — | ✓ | — | ✓ | ✓ | — |
| Change sponsor | — | — | — | ✓ w/ Sponsor | ✓ | — |
| Archive | — | ✓ | — | ✓ | ✓ | — |
| Delete | — | — | — | — | ✓ | — |
| Edit Genome pattern | — | — | — | ✓ Candidate | ✓ all | — |
| Promote pattern state | — | — | — | ✓ → Proven | ✓ | — |
| View other clients | — | — | — | ✓ portfolio | ✓ | Never |

Hard gate "Approve" cannot bypass. Co-sponsor delegation explicit only.

### 4.5 Phase gate enforcement

**Hard gate sequence (e.g. P2 → P3):**
1. Pre-check: charter signed_off? → inline error if no
2. Soft-check: required fields populated? → warning + "Advance anyway" for lead override
3. Sponsor approval: required for hard gates, skippable for soft gates on low-stakes
4. Gate action: snapshot current phase · update `engagements.current_phase` · create new `engagement_phase` row · log · notify · pre-load Nexus

### 4.6 Approval workflow

```
draft → lead publishes (in_review)
  → 48h SLA clock starts
  → approver: approve / request changes / reject
  
  approve → signed_off + attribution + version lock + dependency notify
  request changes → draft with comment required
  reject → draft with flag, 2nd rejection escalates to Maestro
  
  SLA expired → auto-escalate to Maestro notification
```

Low-stakes (lead-approvable): most modules, pre-CXO findings.
High-stakes (sponsor-approvable): charter, hard gates, outcome attestation, pattern acknowledgments.

Maestro can override low→high judgment.

### 4.7 Audit trail

`engagement_activity` records every action: actor, role_at_time, action, before/after jsonb, metadata, timestamp.

**Retention: 7 years minimum.** Founder-only purge, documented legal circumstances only. Exportable as JSON or PDF.

### 4.8 Pattern promotion enforcement

```
on outcome_report.attests_success:
    pattern.successful_deployment_count += 1
    
    CANDIDATE → CANDIDATE_1
    CANDIDATE_1 → CANDIDATE_2
    CANDIDATE_2 → PROVEN (requires founder acknowledgment - no auto-promote)
    
on success_count >= 5 AND cohort_data:
    trigger MATURE review (founder decision)

on failure:
    failed_deployment_count += 1
    No state regression
    Maestro review for pattern refinement
```

**Founder acknowledgment at Proven** — insurance against Maestro rubber-stamping.

### 4.9 Data residency + right-to-forget

**Residency:** inherits from client. HC → US + HIPAA+HITRUST. FinServ → US, EU opt-in, SOC2+PCI. Enforced at infrastructure, not app.

**Right-to-forget:**
- User-level: person record purged, contributions anonymized (not deleted). Deliverables remain "former team member" with audit intact.
- Client-level: 90-day purge timeline. Audit log retained 7 years in sealed archive.
- Pattern cohort contributions: cannot be un-blended. Disclosed at contract signing.

**Export before deletion:** all clients get full export. Structured JSON + PDFs + audit. Max 50GB (larger → custom).

### 4.10 Incident response categories

| # | Category | Detection | Response | SLA |
|---|---|---|---|---|
| 1 | Data corruption | Audit inconsistency | Freeze + restore from snapshot | 4h |
| 2 | Unauthorized access | Tenancy violation at DB | SOC alert + session kill + forensics | Immediate |
| 3 | Quality failure (Nexus) | Lead rejects, Maestro flags | Version revert + tuning examined | 24h |
| 4 | Pattern drift (client overrides) | Lead overrides/skips repeatedly | Maestro review + pattern update or client coaching | Weekly |

Detail in separate `ops/governance-incident-response.md` (Founder + Maestro only).

### 4.11 Schema additions

**New columns on `engagements`:**
- `data_residency_region` text (inherits client, overridable)
- `retention_policy_years` integer (default 7)
- `archived_at` timestamp
- `deleted_at` timestamp (soft delete)

**New table `phase_snapshots`:** id, engagement_id, phase_number, snapshot_at, snapshot_jsonb, triggered_by_person_id, reason

**New table `module_state_log`:** id, engagement_id, module_key, change_type, before_state jsonb, after_state jsonb, actor_person_id, actor_role, timestamp

**New table `founder_approval_requests`:** id, request_type, target_id, requested_at, requested_by, approved_at, approved_by, decision, reason

**Reuse:** `audit_log`, `phase_approvals`, `engagement_activity` (primary stream).

### 4.12 Calls I made

1. Three states only (ephemeral/draft/published). Simplicity > flexibility.
2. Transitions one-way. No reverse.
3. Different versioning patterns per object type, matched to how each actually changes.
4. Hard gates cannot bypass. Sponsor approval is sponsor approval.
5. Audit 7 years minimum. Non-negotiable.
6. Founder acknowledgment at Proven. Insurance against rubber-stamping.
7. Right-to-forget anonymizes, doesn't delete. Preserves engagement integrity.
8. Cohort contributions cannot be un-blended. Contract-disclosed.
9. Low-stakes/high-stakes is runtime determination, not static attribute.
10. Phase snapshots new pattern; different from deliverable versioning.
11. Incident response four categories with SLAs. Documented in ops, not UI.
12. Tenancy wall even for Nexus. Architecturally enforced across clients.

---

## Track A complete · Foundation locked

**What's decided:**
- 5 surfaces × 3 shapes × 6 phases × 17 modules × 4 roles · governance model · pattern promotion state machine
- Schema additions specified: ~10 new tables, minor extensions to existing
- Intelligence → Programs handoff one-way
- UI-layer rename only (DB stays `engagements`)

**Unblocked tracks:**
- Track B · Portfolio surface (2 packets · 5 and 6)
- Track C · Single program surface (5 packets · 7 through 11)
- Track D · Ship (2 packets · 12 and 13)

**Checkpoint opportunity.** If anything in Track A feels wrong, flag now before Track B starts — wireframes and build pack will assume these foundations.

---

## Packet 5 · Portfolio IA + origination flows

### 5.1 Purpose & success criteria

`/programs` is the Programs landing page. Three jobs: find right program fast · surface what needs attention · serve as origination launchpad.

**Success criteria:** 5-second identification of attention-needed program · filtering in 1 click · origination <3 clicks · role-specific defaults without hiding accessible programs.

### 5.2 Three zones

**Zone 1 · Personal inbox** (top, role-aware) — max 5 items, "View all" modal.
- Sponsor: decisions waiting (approvals, signoffs, gate approvals, CXO interview requests)
- Lead: blocking next move (missing data, SLA-expiring, Maestro flags, Nexus quality)
- Maestro: intervention queue (flagged programs, drift warnings, stalled)

**Zone 2 · Program list** (main, filterable, sortable) — grid of cards 2-3 columns. Filters top-bar: phase · archetype · status · sponsor · pattern · my role. Sort: recent activity (default) · phase · start date · sponsor · alphabetical.

**Zone 3 · Origination launchpad** — three equal buttons:
- New program (Path 2 intake)
- From Intelligence (Path 1 thread picker)
- From Signal (Path 3 signal picker)

Plus "Genome library" link.

### 5.3 Program card anatomy

- Top strip: archetype tag · pattern chip · status dot
- Headline: program name (Georgia 16px/500)
- Subline: one-line charter summary (13px muted)
- Mid: current phase indicator (6-segment progress bar)
- Footer: sponsor avatar+name · last activity · attention badge if any

Attention badges (color+text): amber "Awaiting approval" · red "Blocked" · teal "Milestone" · gray "Archived".

### 5.4 Filter design

Apply immediately (no Apply button). URL state for bookmarking.

Role defaults:
- Sponsor → "My programs as sponsor" + "Active/pending"
- Lead → "My programs as lead" + "Active"
- Maestro → "My portfolio" + "All except cancelled"
- Founder → no defaults

### 5.5 Search

Top of Zone 2. Queries: name · charter summary · sponsor · pattern · tags · recent findings. Client-side first (<100ms), server-side full-text fallback.

### 5.6 Origination flow (Path 2 detail)

```
1. "New program" → /programs/new
2. Intake form:
   - Program name (required)
   - "What are you trying to do?" (free text, required)
   - "What's the target outcome?" (free text, required)
   - Sponsor (person picker, required)
   - Program lead (person picker, defaults to current user)
   - Industry/Function/Objective tags (optional)
   - Budget/timeline hints (optional)
3. Submit → POST /api/v1/programs/originate
4. "Matching against Genome..." loading (≤5s)
5. Shape proposer (Packet 2 §2.4)
6. Accept → program in draft state, redirect to /programs/:id
```

Paths 1 and 3 pre-fill intake form from source context, proceed to shape proposer with suggested match pre-selected.

### 5.7 Genome library access

Sidebar "Genome library" → `/programs/patterns`

- Clients: Proven patterns only · filterable catalog · "Start a program from this pattern" CTA
- Maestro: full library + Candidates + authoring
- Founder: everything + Mature/Deprecated + promotion acknowledgment queue

### 5.8 Notifications

Portfolio is where notifications materialize. Zone 1 surfaces notification-driven items.

Notifications via Supabase realtime (not polling). Per-role event subscriptions (Packet 3 §3.9). Global nav badge shows unread count across all programs.

### 5.9 Performance

Per Packet 1 §1.8: index load ≤1000ms · filter/sort ≤200ms · search ≤100ms local / ≤800ms server · classifier run ≤5s.

Skeleton loading for card grid. Zone 1 doesn't block Zone 2.

### 5.10 Schema

No new tables. Indexes:
- `engagements (status, current_phase, updated_at DESC)` — default sort
- `engagement_participants (person_id, role)` — "my programs" filter
- Full-text search on `engagements (name, charter jsonb)`

### 5.11 Calls I made

1. Three zones, not single feed.
2. Cards not table rows.
3. Filters top, not sidebar.
4. Role defaults, role-agnostic access.
5. Origination 3 equal buttons, not hierarchy.
6. Genome library from Portfolio, not top-nav.
7. URL state for filters.
8. Client-side filter first.
9. Zone 1 max 5 items, modal for more.
10. Attention badges color+text, not color alone.

---

## Packet 6 · Portfolio wireframes + screen spec

### 6.1 Canonical wireframes rendered

- **[VIZ ref] `abarva_programs_portfolio_wireframe_lead_view`** — default lead-view landing with 3-zone layout (inbox, list, origination). 4 program cards showing all 3 shapes (Pattern, Pattern, Pattern, Custom) and 4 different attention states (Awaiting approval, Blocked, Quality flag, CXO interview scheduled).
- **[VIZ ref] `abarva_programs_origination_intake_wireframe`** — Path 2 intake form, 5 required fields + 4 optional. "Match against Genome" primary CTA.
- **[VIZ ref] `abarva_programs_shape_proposer_wireframe`** — Genome match result. Top match with 2px blue border, 4 metric cards, proposed shape visible, 2 secondary matches compact. Override (Template/Custom) at bottom.

### 6.2 Component contracts

```typescript
interface PortfolioIndexProps {
  viewerRole: 'sponsor' | 'lead' | 'team_member' | 'maestro' | 'founder';
  programs: ProgramSummary[];
  inboxItems: InboxItem[];
  filters: PortfolioFilters;
  onFilterChange: (filters: PortfolioFilters) => void;
  onProgramClick: (programId: string) => void;
}

interface ProgramSummary {
  id: string;
  name: string;
  archetype: ArchetypeKey;
  patternKey?: string;
  patternName?: string;
  charterSummary: string;
  currentPhase: number;  // 1-6
  phaseStatus: 'active' | 'awaiting_gate' | 'blocked' | 'complete';
  sponsorPerson: PersonRef;
  leadPerson: PersonRef;
  lastActivityAt: Date;
  attentionBadge?: { label: string; variant: 'warning'|'danger'|'success'|'info' };
  shape: 'template' | 'pattern' | 'custom';
}

interface OriginationForm {
  name: string;
  useCase: string;       // required
  targetOutcome: string; // required
  sponsorPersonId: string;
  leadPersonId: string;
  industryHint?: string;
  functionHint?: string;
  budgetRangeHint?: string;
  timelineHint?: string;
}

interface PatternMatch {
  patternKey: string;
  patternName: string;
  confidence: number;
  confidenceBand: 'high' | 'medium' | 'low';
  deploymentCount: number;
  successfulDeploymentCount: number;
  medianOutcomeUsd?: number;
  typicalDurationMonths: number;
  successRatePct: number;
  preloadDepthPct: number;
  proposedShape: {
    phases: Array<{ canonicalPhase: number; name: string }>;
    modules: Array<{ moduleKey: string; name: string }>;
  };
  isTopMatch: boolean;
}
```

### 6.3 API endpoints

```
GET  /api/v1/programs
     Query: ?role=<role>&filters=<encoded>
     Response: { programs: ProgramSummary[], inbox: InboxItem[], totalCount }
     Cache: 30s per user

GET  /api/v1/programs/search
     Query: ?q=<query>&filters=<encoded>

POST /api/v1/programs/originate
     Body: OriginationForm | { source: 'intelligence_thread', threadId }
          | { source: 'tower_signal', signalId }
     Response: SSE stream with classifier stages

POST /api/v1/programs
     Body: { originationFormResult, acceptedPatternKey, shapeModifications }
     Response: { programId, redirectTo: '/programs/:id' }

GET  /api/v1/programs/patterns
     Query: ?role=<role>  (role-filtered; clients see Proven only)

GET  /api/v1/programs/patterns/:patternKey
```

### 6.4 Calls I made

1. Cards 2-column desktop, 1-column mobile.
2. Inbox max 3 visible items (was 5 in Packet 5 — tightened).
3. Phase progress bar 6 segments always. Consistency over exact fit.
4. Status badges semantic color+text, named specifically.
5. Origination one form not multi-step. Classifier runs async.
6. "Match against Genome" explicit action wording.
7. Shape proposer top match with 2px border (deviation from 0.5px norm, reserved for featured).
8. 4 metric cards in proposer. More is overwhelming.
9. Proposed shape shown inline before accept.
10. Override options at bottom, visually de-emphasized but always available.

---

## Track B complete · Portfolio surface locked

**What's specified:**
- 3-zone portfolio landing (inbox, list, origination launchpad)
- Program card anatomy
- Filter design (role-aware defaults, shareable URL state)
- Origination intake form (Path 2) + flow shapes for Paths 1 and 3
- Shape proposer UI (top match emphasized, 2 secondary, overrides)
- Component contracts + API endpoints
- 3 canonical wireframes rendered

**Unblocked:** Track C (Single program surface, 5 packets) starts next.

---

## Packet 7 · Program IA (hybrid phase/module nav)

### 7.1 Purpose & success criteria

Single program surface is where 80% of work happens. Hybrid nav (phase tabs × module dashboard).

**Success criteria:** 5-second orientation · module dashboard fits one screen for Pattern shapes · navigation preserves context · role-adaptive.

### 7.2 Four-rail layout

**Rail 1 · Top header** (sticky) — program name + archetype + pattern chip + status · breadcrumb back to Programs · secondary nav (Overview · Timeline · Team · Settings) · user actions (Bookmark/Share/Archive role-permitted).

**Rail 2 · Phase navigator** (horizontal tabs) — 6 phase pills (or fewer for Pattern/Custom) · each pill shows phase number + name + state icon · active highlighted · hard-gate lock markers visible.

**Rail 3 · Main canvas** (center, expanding) — phase-specific content · default: module dashboard for current phase · role-adaptive.

**Rail 4 · Nexus side-panel** (right, collapsible) — 56px collapsed, 320px expanded · program thread + drafts + flags + sources.

### 7.3 Phase navigator states

- Locked (gray, not clickable)
- Active (teal fill)
- Complete (teal outline + check, navigable for review)
- Pending gate (amber + lock)
- Skipped (gray + slash, rare, Maestro override)

Click behavior: complete phase opens read-only snapshot · locked shows tooltip · active stays.

Pattern/Custom shapes show fewer pills, no implication of hidden phases.

### 7.4 Module dashboard

Grid: 4-col desktop / 3-col tablet / 2-col narrow / 1-col mobile.

**Module tile:** name (Georgia 14px/500) · status pill · last-edit avatar+timestamp · version counter · completion bar · Nexus assist badge (if draft pending).

**Tile interactions:** single click → Module workspace · hover → tooltip · right-click → contextual menu (mark complete/skip/reassign/comment).

**Ordering:** natural phase order default · lead can drag-reorder · persistence via `view_state`.

### 7.5 Role-adaptive rendering

**Lead view (default):** full 4-rail, all modules, full Nexus panel, inline editing.

**Sponsor view:** header + phase nav + sponsor dashboard (Packet 3 §3.4) + collapsed Nexus + "Show me everything" expansion.

**Maestro view:** lead view + oversight banner above phase nav + pattern health panel inline + intervention flags as floating alerts.

**Team member:** lead view with edit limited to assigned workstream · others read-only.

### 7.6 Tab structure

**Overview (default landing):** charter summary (3 bullets) · key metrics · recent activity (last 10) · current milestone + next gate · sponsor/lead/CXO status · linked Intelligence threads.

**Timeline:** Gantt-style · one row per phase · planned vs actual · milestones · team assignments · dependencies · lead drag-adjust dates, sponsor notified if >10% shift.

**Team:** participants with role/workstreams/activity/notifications. Lead invites/removes/changes (except sponsor). Person detail drawer shows full profile + engagement history + relationship notes.

**Settings:** general · pattern binding (read-only after origination) · notifications · data residency (inherited) · retention · archive/delete with Maestro signoff.

### 7.7 Nexus side-panel (4 tabs when expanded)

1. **Chat** — program-scoped Q&A · uses `program_threads`
2. **Drafts** — Nexus drafts pending review · click → Module workspace
3. **Flags** — contradictions, pattern drift, data gaps
4. **Sources** — transparency on what Nexus sees (L1-L4)

Collapsed: 4 vertical icons with unread badges.

### 7.8 Phase-specific UI (high-level, detail in Packet 10)

| Phase | Main canvas variant |
|---|---|
| 1 Origination | Lightweight overview + "Advance to Charter" |
| 2 Charter | Charter editor + stakeholder map + baseline request list |
| 3 Diagnose | Data analysis + CXO interview scheduler + contradiction surface |
| 4 Design | Solution library + vendor matrix + tradeoff composer |
| 5 Execute | Milestone tracker + evidence collection + integration dashboard (Packet 11) |
| 6 Verify | Outcome dashboard + CXO verification UI + Genome feedback form |

### 7.9 Calls I made

1. 4 rails match how users actually work.
2. Module dashboard is default; phase-specific UI augments.
3. Phase nav always visible.
4. Role rendering at main canvas, not layout-level.
5. Completed phases browsable, not locked.
6. Skipped phases get slash icon.
7. Module ordering lead-overridable.
8. Nexus side-panel 4-tabbed.
9. Linked Intelligence threads on Overview.
10. Phase 5 Execute gets custom ops surface.

---

## Packet 8 · Embedded Nexus model (delivery mode)

### 8.1 Purpose & success criteria

Nexus in Programs is an embedded delivery agent — drafts, analyzes, flags. Different role, voice, autonomy from Intelligence.

**Success criteria:** drafts deliverable in <30s · drafts cite specific provenance · lead accept/edit/reject with attribution · proactive flags without being asked · CXO takeover feels like structured interview.

### 8.2 Three operating modes

**Mode A · Side-panel Q&A** (~60%) — right-rail chat · scoped to program + full L1-L4 · does NOT write to program state · conversation-only.

**Mode B · Module-embedded drafting** (~30%) — invoked from within Module workspace · uses pattern pre-load + L2 + prior state + charter · produces draft matching module's render pattern · lands as `draft` state deliverable attributed to Nexus.

**Mode C · CXO takeover** (~10%) — Phase 3 interview OR Phase 6 verification · full-screen experience · structured Q→A cadence · output flows into phase findings / outcome report · read-only transcript for lead/Maestro after.

### 8.3 Mode A detail

**Context budget** up to 60K tokens: charter+phase state (2-5K) · pattern pre-load (3-10K) · recent findings+deliverables (5-15K) · L2 relevant facts (3-8K) · L4 profile (1-2K) · L1 if mentioned (5-20K).

**Formats:** same 8 as Intelligence. Common in Programs: RANKED LIST, MATRIX, CRUX, ARTIFACT.

**Latency:** first token ≤2s, full ≤10s (looser than Intelligence · richer context, lower stakes).

**Proactive flag triggers:** contradiction across modules · pattern drift >threshold · data gap · SLA approaching. Appear in flags tab with badge, non-intrusive.

### 8.4 Mode B detail

**Pre-flight check:** verify enough context. If critical data missing (e.g. no baseline), halt and ask lead to supply inputs first. No hollow drafts.

**Process:** parse module render pattern → gather context → Claude Opus 4.7 with module prompt → stream response into module editor → attribute `created_by='nexus'`.

**Review flow:** provenance pills on every claim · "Accept all / Edit / Reject and regenerate" · accept → v1 published, state in_review · edit → preserved with diff · reject → reason required, feeds back to prompt improvement.

**Prompt template skeleton:**
```
You are Nexus, embedded delivery agent for AbarVa.
Drafting Module X for Program Y using Pattern Z.
Charter: {charter}
Client context: {L2_data}
Pattern pre-load: {pattern_module_preload}
Prior findings: {findings}

Produce draft matching: {module_render_pattern_spec}

Voice: commit to claims (not "it depends") · cite provenance · 
client-specific language · surface 2-3 sharpening questions.
```

### 8.5 Mode C detail

**Triggers:** Phase 3 scheduled CXO interview (lead schedules, sponsor accepts) · Phase 6 outcome verification (Maestro schedules, sponsor + lead attend).

**UI takeover:** viewport becomes interview surface. No rails, no module dashboard.

**Phase 3 structure:**
1. 60-90s Nexus summary of findings
2. 4-8 structured questions (pattern-driven)
3. Open: "Anything else before Design?"
4. Sponsor attestation: "Findings reflect your understanding?"
5. Close: Nexus summarizes → writes to phase findings

**Phase 6 structure:**
1. Outcome summary vs baseline
2. Attestation questions (outcomes match success criteria? unexpected? missing?)
3. Benefits realization % confirmation
4. Pattern feedback for future runs
5. Outcome fee attestation if applicable
6. Close: Nexus writes outcome report

**Voice calibration:** respectful, precise · never 2 questions per turn · silence is OK · if sponsor deflects, acknowledge+redirect · no hedging language.

**Output:** Q→A transcript to `phase_findings` (P3) or `outcome_report` (P6). Maestro reviews for quality. Pattern gets feedback.

### 8.6 Provenance · 4 sources

1. Pattern pre-load ("From AMS Opt pattern v2 · 14 deployments")
2. L2 client data ("Based on FirstCap 2025 AMS spend · source: uploaded CSV")
3. L3 program data ("From P3 findings Apr 15 · attributed to Jake Chen")
4. L1 foundation ("KLAS 2026 · knowledge_sources")

All clickable. Click → drawer with exact source highlighted.

**Rule:** no provenance → flag low confidence, prompt verification. No silent hallucination.

### 8.7 Quality gates (before render)

1. Provenance check — every substantive claim has ≥1 source
2. Consistency check — no contradiction with published findings (async Contradiction agent)
3. Pattern adherence check — follows matched pattern's expected shape
4. Voice filter — forbidden phrases stripped
5. Length check — within module type bounds

**Maestro override:** flag as "requires human rewrite" → downgrades to "draft · needs review" + Maestro oversight queue.

### 8.8 Attribution & version history

**`deliverable_versions.generated_from_context_hash`:** includes pattern_key, context_keys, prompt_template_version, timestamp. Reconstruct what Nexus saw. Error traceback.

**`deliverables_v2.created_by`:** `'nexus'` / person_uuid / `'nexus_and_lead'`.

**UI attribution:** "Drafted by Nexus · Edited by Jake Chen · Signed off by Sarah Sponsor"

### 8.9 Schema

No new tables. Extend `program_threads`:
- `thread_mode` text — 'side_panel' | 'module_drafting' | 'cxo_takeover'
- `target_module_key` text (for drafting)
- `target_phase` integer (for takeover)
- `triggered_by_deliverable_id` uuid

Extend `deliverable_versions`:
- `nexus_draft_metadata` jsonb (classifier outputs, provenance map)

### 8.10 Performance

| Operation | Budget |
|---|---|
| Side-panel first token | ≤ 2000ms |
| Side-panel full | ≤ 10000ms |
| Module draft 1-page | ≤ 30000ms |
| Module draft multi-page | ≤ 60000ms |
| CXO interview turn | ≤ 4000ms |
| Provenance drawer | ≤ 500ms |

### 8.11 Calls I made

1. Three Programs modes, different from three Intelligence modes.
2. Mode A doesn't write to program state.
3. Mode B requires pre-flight context check.
4. Mode C takes over viewport.
5. Proactive flags, not proactive messages.
6. 4 provenance sources, all clickable.
7. No provenance → low confidence flag.
8. 5 quality gates before render.
9. Maestro override preserves insurance.
10. Draft attribution includes context hash.
11. Interview structure pattern-driven, not freeform.
12. `program_threads` mode-tagged for context.

---

## Packet 9 · Module render patterns (17 modules)

### 9.1 Purpose

17 canonical modules × 3 shapes × 6 phases creates combinatorial complexity. 5 render patterns cover all 17, plus module-specific slots for distinguishing 20%.

### 9.2 Five render patterns

**A · Structured form** — capture structured data (charter, stakeholder map, success criteria, baseline request). Vertical form fields, sectioned headers. Nexus pre-fills from pattern+charter. Lead reviews, edits. Output: typed structured data.

**B · Analysis canvas** — analyze data (findings, contradiction surface, vendor evaluation). Data panel (left) + canvas (center) + findings (right). Nexus draws analysis, flags outliers. Output: published findings with evidence.

**C · Narrative document** — produce prose (recommendation memo, business case, outcome report). Editor + outline sidebar + Nexus references. Nexus drafts full doc. Output: versioned document.

**D · Decision matrix** — compare options (solution library match, tradeoff matrix). Options columns, criteria rows, scored cells. Nexus populates; lead weights. Output: scored matrix + recommendation.

**E · Tracker/dashboard** — track execution (build tracking, milestone tracker, outcome measurement). List + charts. Nexus flags slippage. Output: live status + evidence trail.

### 9.3 Mapping · 17 modules to 5 patterns

| # | Module | Pattern | Phase |
|---|---|---|---|
| 1 | Problem Framing | A · Form | Origination |
| 2 | Stakeholder Map | A · Form + canvas | Charter |
| 3 | Success Criteria Definition | A · Form | Charter |
| 4 | Baseline Data Request | A · Form | Charter |
| 5 | Diagnostic Instrument | A · Form | Diagnose |
| 6 | Data Analysis + Findings | B · Analysis | Diagnose |
| 7 | Contradiction Surface | B · Analysis | Diagnose |
| 8 | CXO Interview Prep + Capture | C · Narrative + Mode C | Diagnose |
| 9 | Solution Library Match | D · Matrix | Design |
| 10 | Vendor/Tech Evaluation | D · Matrix | Design |
| 11 | Tradeoff Matrix + Recommendation | D · Matrix | Design |
| 12 | Business Case + ROI | C · Narrative + ROI | Design |
| 13 | Implementation Plan | A + E | Design/Execute |
| 14 | Build + Integration Tracking | E · Tracker | Execute |
| 15 | Change Management Plan | A + E | Execute |
| 16 | Outcome Measurement | E · Tracker (live) | Verify |
| 17 | Benefits Realization + Genome Feedback | C · Narrative | Verify |

### 9.4 Module workspace chrome (consistent across all 17)

**Top bar:** breadcrumb (Program > Phase > Module) · status pill + version · actions (Nexus draft · Publish · History)

**Main area:** pattern A/B/C/D/E + module-specific slots

**Right side-panel:** Nexus contextual (drafting or Q&A) · provenance map · comments thread

**Footer:** auto-save indicator · last edited · Mark complete · Skip (with reason) · Export

### 9.5 Module-specific slot examples

**Module 2 Stakeholder Map:** Pattern A fields + 2×2 canvas (Interest × Influence) with draggable pills. Nexus pre-populates from L2 persons + relationship_notes.

**Module 6 Findings:** Pattern B data panel (CSVs, warehouses, L1 refs) + analysis canvas (charts, tables, annotations) + findings panel (3-7 structured with evidence pills).

**Module 7 Contradictions:** Pattern B with severity ranking (high/medium/low), resolution recommendations. Contradiction agent runs async.

**Module 8 CXO Interview:** Pattern C prep doc (question bank, context brief) + transcript (from Mode C takeover) + synthesis (Nexus summary → phase findings).

**Module 11 Tradeoff Matrix:** 2-4 options × 5 default criteria (cost/time/risk/strategic fit/change burden) · 1-5 ratings with evidence · recommendation section with rationale.

**Module 12 Business Case:** C outline (Exec Summary · Baseline · Opportunity · Approach · Investment · Returns · Risks · Timeline) + interactive ROI model (NPV/IRR/payback with pattern benchmark defaults).

**Module 16 Outcome Measurement:** Pattern E metrics list (success criteria + tracking) · each metric has baseline/target/current/trend chart/source · auto-alerts on out-of-range.

**Module 17 Benefits Realization:** Pattern C with outcome attestation (Phase 6) · benefits realized vs planned table · failure analysis · pattern feedback form → Genome update request.

### 9.6 Module state machine

```
not_started → in_progress → draft → in_review → signed_off
                                              → skipped (with reason)
                                              → blocked (waiting on external)
```

Transitions logged to `module_state_log`. Reasons required for skipped/blocked/reject.

### 9.7 Module → Deliverable 1:many

Each module produces 1+ deliverables in `deliverables_v2`. Examples: Module 6 → findings doc + analysis artifacts. Module 8 → prep + transcript + synthesis. Module 12 → business case + ROI model. Module 17 → outcome report + Genome feedback memo.

### 9.8 Performance

| Operation | Budget |
|---|---|
| Module workspace load | ≤ 1000ms |
| Field auto-save | ≤ 500ms |
| Nexus draft 1-page | ≤ 30000ms |
| Matrix cell update | ≤ 200ms |
| Chart re-render | ≤ 800ms |
| Module publish | ≤ 2000ms |

### 9.9 Calls I made

1. 5 render patterns, not 17 unique layouts.
2. Module workspace chrome consistent.
3. Module-specific slots = the distinguishing 20%.
4. State machine 7 states, no over-engineering.
5. Modules → Deliverables 1:many.
6. Business Case embeds ROI model, not separate.
7. Outcome Measurement is live dashboard.
8. Genome Feedback inside Module 17, not separate surface.
9. Contradiction Surface is its own module, not embedded.
10. CXO Interview spans Module + Mode C takeover.

---

## Packet 10 · Phase-by-phase wireframes (6 phase states)

### 10.1 Purpose

Each phase has distinct main-canvas state. This packet specifies canvas behavior per phase, with canonical wireframe for Phase 2 (representative pattern).

### 10.2 Phase 1 Origination

**Job:** confirm founding inputs, advance to Charter.

**Canvas:** intake summary (Path 2) or source thread (Path 1) or source signal (Path 3) · matched pattern card + confidence + shape preview · "Advance to Charter" CTA.

**Module dashboard:** Module 1 (Problem Framing) typically auto-completed. Others hidden or "not yet active."

**Short-lived phase.** Most programs advance within hours.

### 10.3 Phase 2 Charter

**[VIZ ref] `abarva_programs_phase_2_charter_wireframe`** — canonical phase canvas. Shows 4-module grid (Problem Framing signed off · Stakeholder Map draft · Success Criteria in progress · Baseline Data blocked) with phase progress bar at top and hard-gate card at bottom.

**Canvas pattern** (repeats for phases 2, 3, 4):
- Top: breadcrumb + phase pill + secondary nav (Overview/Timeline/Team)
- Phase progress bar (6 segments)
- Module dashboard (2-3 col grid)
- Gate card at bottom (amber pending / teal cleared / red blocked)

### 10.4 Phase 3 Diagnose

**Job:** surface findings, drive CXO interview, resolve contradictions.

**Canvas additions over Phase 2 pattern:**
- Top section: CXO interview status block (scheduled? conducted? synthesized?)
- Module grid: 4 modules (Diagnostic Instrument · Data Analysis · Contradiction Surface · CXO Interview)
- Contradiction surface pills color-coded by severity (red/amber/gray)
- CXO interview scheduler: available sponsor slots · Nexus structure preview · synthesis status

### 10.5 Phase 4 Design

**Job:** evaluate options, produce recommendation, quantify business case.

**Canvas additions:**
- Top: Recommendation pin (once selected) — visible above fold
- Module grid: 5 modules (Solution Library Match · Vendor Evaluation · Tradeoff Matrix · Business Case · Implementation Plan)
- Tradeoff matrix typically focal — large grid, interactive weighting, live re-ranking
- Business Case with embedded ROI model gets dedicated canvas

### 10.6 Phase 5 Execute

Ops surface, fundamentally different. Detailed in Packet 11.

### 10.7 Phase 6 Verify

**Job:** measure outcomes, attest benefits, feed Genome.

**Canvas:**
- Top: Outcome dashboard (live metrics vs baseline vs target, trend charts, cohort benchmark overlay)
- Middle: 2 modules (Outcome Measurement · Benefits Realization)
- CXO verification gate: large amber card with "Schedule verification" CTA → Mode C takeover
- Bottom: Genome feedback form

### 10.8 Phase transitions (UI perspective)

- **Soft gate advance:** immediate UI transition · toast · Nexus preps next phase
- **Hard gate advance:** approval modal → sponsor notification → on approval transition → activity log
- **Advance blocked:** gate card shows unresolved items with direct links
- **Revert:** Maestro/Founder only · reason required · activity logged · phase snapshot preserved

### 10.9 Common elements across phases

- Phase progress indicator always visible at top (6 segments)
- Phase gate card always at bottom when gate active (amber/teal/red)
- Nexus side-panel adapts context per phase (drafts, flags filter to current phase)
- Deliverable catalog one click away

### 10.10 Calls I made

1. Each phase canvas distinct enough to need separate design.
2. Phases 2 and 4 look similar (module dashboard + gate) — intentional consistency.
3. Phase 3 elevates CXO interview to top of canvas.
4. Phase 5 breaks module dashboard pattern — ops surface different.
5. Phase 6 outcome dashboard above modules.
6. Gate cards color-coded (amber/teal/red).
7. One Phase canonical wireframe rendered (Charter); others same pattern.
8. Recommendation pin in Phase 4 keeps current call visible.
9. Phase 1 short-lived by design.
10. Revert Maestro/Founder-only to protect gate integrity.

---

## Packet 11 · Execute phase deep-dive (ops surface)

### 11.1 Purpose

Execute (Phase 5) is where programs ship or die. Module dashboard pattern breaks here — ops surface resembles Linear/Jira, but integrated with Programs governance, versioning, Nexus provenance.

### 11.2 Canonical wireframe

**[VIZ ref] `abarva_programs_phase_5_execute_wireframe`** — rendered canonical Execute surface. Shows: phase pill · secondary tabs (Milestones/Work/Risks/Evidence/Reports) · execution progress summary card (3 complete/2 in progress/1 at risk · tracked savings $1.8M/$4.2M · +1 week drift) · milestone progress bar · Work tab open with 6 work items (Jake/Sarah/Mike/Amy assignments, various statuses including blocked transition plan in red) · Open risks panel (3 risks: 45-FTE transition, automation accuracy drift, resolved vendor delay) · Nexus flags panel (savings attribution audit, pattern drift).

### 11.3 Five tabs

**Milestones** — visual Gantt · planned vs actual dates · dependencies · evidence artifacts · Nexus flags slippage auto.

**Work** (default) — filterable list · title + milestone tag + assignee + status + due date + Nexus-drafted indicator · inline edit, drag reorder, bulk ops · subtasks + dependencies.

**Risks** — register · severity (low/medium/high/critical) · owner · mitigation · auto-elevate past threshold · Nexus surfaces from execution signals.

**Evidence** — deployment artifacts (screenshots, test results, customer data, logs) · associated milestone/work item · feeds Phase 6 outcome measurement.

**Reports** — weekly status (Nexus-drafted, lead-edited, sponsor-facing) · phase milestone reports · ad-hoc briefs.

### 11.4 Work item state machine

```
not_started → in_progress → done
                          → blocked (auto-escalate 48h)
                          → cancelled (reason required)
```

### 11.5 Integration with Phase 6

Milestones → outcome measurement · evidence → attestation · work items done → benefits realization · risks resolved/unresolved → pattern feedback.

### 11.6 Nexus in Execute

**Proactive:** detects overdue · flags milestone drift >1 week · auto-drafts weekly status (Sun evening) · detects pattern drift (skipped change management) · surfaces evidence gaps (claimed savings without supporting artifacts).

**On-demand:** "Draft this week's status" · "Analyze savings attribution" · "Summarize M4 delivery" · "Identify risks similar to cohort failure modes."

### 11.7 Sponsor view

Default: Milestones · Risks (critical only) · Reports. NOT Work. "Show me everything" expands to lead view.

### 11.8 Schema

**New table `program_milestones`:** id, engagement_id, name, description, planned_start, planned_end, actual_start, actual_end, status, owner_person_id, dependencies_jsonb

**New table `program_work_items`:** id, engagement_id, milestone_id, title, description, assignee_person_id, status, priority, due_date, created_by, created_at, completed_at, nexus_drafted bool

**New table `program_risks`:** id, engagement_id, description, severity, owner_person_id, mitigation_plan, status, created_at, resolved_at

**Reuse:** `engagement_uploads` for evidence · `deliverables_v2` for reports.

### 11.9 Performance

| Operation | Budget |
|---|---|
| Execute surface load | ≤ 1200ms |
| Work list filter | ≤ 200ms |
| Work item status update | ≤ 400ms |
| Milestone drag-update | ≤ 500ms |
| Weekly report generation | ≤ 30s |

### 11.10 Calls I made

1. Execute breaks module dashboard pattern. Linear/Jira-like.
2. 5 tabs cover ops lifecycle.
3. Work tab is default.
4. Work state machine simpler (4 states) than module (7).
5. Blocked items auto-escalate 48h.
6. Evidence first-class data type.
7. Weekly status Nexus-drafted Sunday.
8. Sponsor sees summaries, not Work by default.
9. 3 new tables — minimum viable, extensible.
10. Execute connects directly to Phase 6.

---

## Packet 12 · Screen spec + cross-links + Prat demo beats

### 12.1 Purpose

Bridge between design and build. Consolidates component contracts, cross-links, and scripts the Prat demo beat-by-beat.

### 12.2 Component contracts (beyond Packets 6 and 9)

```typescript
interface ProgramDetailProps {
  programId: string;
  viewerRole: ViewerRole;
  program: ProgramFullState;
  onPhaseNavigate: (phaseNumber: number) => void;
  onModuleOpen: (moduleKey: string) => void;
  onAdvancePhase: (fromPhase: number) => Promise<AdvanceResult>;
}

interface ProgramFullState {
  id: string;
  name: string;
  charter: CharterSummary;
  currentPhase: number;
  shape: 'template' | 'pattern' | 'custom';
  patternKey?: string;
  phases: PhaseState[];
  modules: ModuleState[];
  team: ParticipantRef[];
  activity: ActivityEntry[];
  linkedIntelligenceThreads?: ThreadRef[];
}

interface ModuleState {
  moduleKey: string;
  name: string;
  phase: number;
  status: 'not_started'|'in_progress'|'draft'|'in_review'|'signed_off'|'skipped'|'blocked';
  currentVersion?: number;
  lastEditedBy?: PersonRef;
  lastEditedAt?: Date;
  nexusDraftPending?: boolean;
  blockerReason?: string;
  deliverableIds?: string[];
}

interface ModuleWorkspaceProps {
  programId: string;
  moduleKey: string;
  renderPattern: 'form'|'analysis'|'narrative'|'matrix'|'tracker';
  moduleState: ModuleState;
  viewerRole: ViewerRole;
  onFieldChange: (field: string, value: any) => Promise<void>;
  onNexusDraftRequest: () => Promise<DraftResult>;
  onPublish: () => Promise<void>;
}

interface ExecuteSurfaceProps {
  programId: string;
  activeTab: 'milestones'|'work'|'risks'|'evidence'|'reports';
  milestones: Milestone[];
  workItems: WorkItem[];
  risks: Risk[];
  evidence: EvidenceArtifact[];
  reports: StatusReport[];
  viewerRole: ViewerRole;
}

interface NexusPanelProps {
  programId: string;
  mode: 'collapsed'|'expanded';
  activeTab: 'chat'|'drafts'|'flags'|'sources';
  thread: ProgramThread;
  drafts: NexusDraft[];
  flags: NexusFlag[];
  sources: ContextSource[];
}

interface CxoTakeoverProps {
  programId: string;
  mode: 'phase_3_interview'|'phase_6_verification';
  questionBank: Question[];
  currentQuestion: Question;
  transcript: Turn[];
  onAnswer: (answer: string) => Promise<NextTurn>;
  onClose: () => Promise<Synthesis>;
}
```

### 12.3 API inventory

```
# Portfolio
GET  /api/v1/programs
GET  /api/v1/programs/search
GET  /api/v1/programs/patterns
GET  /api/v1/programs/patterns/:key

# Origination
POST /api/v1/programs/originate       # SSE, classifier stages
POST /api/v1/programs                  # create

# Single program
GET  /api/v1/programs/:id
GET  /api/v1/programs/:id/phase/:n
GET  /api/v1/programs/:id/module/:key
POST /api/v1/programs/:id/advance-phase
POST /api/v1/programs/:id/skip-module
POST /api/v1/programs/:id/modules/:key/publish
POST /api/v1/programs/:id/deliverables/:id/approve

# Nexus
POST /api/v1/programs/:id/nexus/chat       # Mode A SSE
POST /api/v1/programs/:id/nexus/draft      # Mode B SSE
POST /api/v1/programs/:id/nexus/interview  # Mode C SSE
GET  /api/v1/programs/:id/flags
GET  /api/v1/programs/:id/drafts

# Execute
GET/POST /api/v1/programs/:id/milestones
PATCH /api/v1/programs/:id/milestones/:mid
GET/POST /api/v1/programs/:id/work-items
PATCH /api/v1/programs/:id/work-items/:wid
GET/POST /api/v1/programs/:id/risks
GET  /api/v1/programs/:id/reports/weekly

# Governance
GET  /api/v1/programs/:id/activity
GET  /api/v1/programs/:id/phase-snapshots
POST /api/v1/programs/:id/team
DELETE /api/v1/programs/:id/team/:pid

# Maestro
GET  /api/v1/maestro/portfolio
GET  /api/v1/maestro/pattern-health
POST /api/v1/maestro/flags
POST /api/v1/maestro/patterns/:key/promote
```

### 12.4 Cross-links with other surfaces

**Programs ↔ Intelligence (one-way):** "Scope as Program" → origination (Path 1) · "Attach to Program" → artifact selector · thread → origination source.

**Programs ↔ Solution Library:** Module 9 pulls from shared catalog · pattern detail links to solutions · new solutions feed library (Maestro curates).

**Programs ↔ Tower:** Path 3 pre-populated from signal · contradiction agent surfaces findings in P3 from cross-client · resolved contradictions propagate.

**Programs ↔ Genome:** pattern match (Packet 2) · promotion from Custom (Packet 4) · cohort benchmarks in surfaces.

**Programs ↔ Deliverables:** catalog per program · versioned via `deliverables_v2` · cross-program templates (Maestro).

### 12.5 Prat demo · beat-by-beat (15 min for Programs)

**Beat 1 · Portfolio landing (45s)**
"Where your programs live. Every active transformation across Meridian."
Show 4 cards: Ambient Docs (Charter) · AMS Opt (Execute) · KYC Auto (Diagnose) · IT Capital Reallocation (Charter Custom).
Inbox: "Charter waiting for signoff. 14h on SLA. Click in."

**Beat 2 · Phase 2 Charter canvas (2 min)**
Ambient Docs at Phase 2. "Phase bar up top. Charter active. Diagnose locked behind hard gate."
"Four Charter modules. Problem Framing signed off. Stakeholder Map draft — Nexus pre-populated 8 stakeholders from Meridian org data."
Open Stakeholder Map briefly → canvas with pills → close.
"Success Criteria 4/5 defined. Baseline Data blocked — waiting on Meridian IT. Hard reality."
"Hard gate at bottom. No Diagnose until Charter signoff."

**Beat 3 · Nexus Mode B drafting (2 min)**
Open Stakeholder Map. Click "Nexus: draft this module."
Watch stream with provenance pills. "Click any pill — see source. Meridian relationship notes Dec 2025."
"Nexus drafted in 18 seconds. Jake would've taken 4 hours. Jake still owns it — reviews, edits, publishes."

**Beat 4 · AMS Execute surface (3 min)**
Navigate to AMS Phase 5. "Execute is operational."
Show 5 tabs. "Work tab — 14 items. Jake/Sarah/Mike/Amy assignments."
Point to blocked: "Transition plan 45 offshore FTEs, HR review stalled. 3 days overdue. Nexus already escalated."
Savings: "$1.8M tracked toward $4.2M. Evidence attached."
Risks: "Open risks. Critical — same transition. Medium — automation accuracy drift."
Nexus flags: "Savings attribution needs audit. Pattern drift on change management."
Reports: "Nexus drafts weekly status Sunday. Lead edits. Sponsor reads."

**Beat 5 · Mode C takeover preview (90s)**
Back to Ambient Docs Phase 3. "When CXO interview happens, whole screen is interview. Structured. 4-8 pattern-driven questions. Nexus runs session."
Show takeover UI.
"Phase 3 is the first of two CXO touchpoints. Phase 6 is the second. That's it. We don't waste CXO time."

**Beat 6 · Close the loop (45s)**
Back to portfolio. "Intelligence generates scope. Programs execute it. Every program learns. Every pattern compounds."
"Meridian has four programs today. Forty a year from now. Each faster, cheaper, better-targeted. The Genome earns compound interest."

### 12.6 Demo prioritization

**Must-build (non-negotiable):**
- Portfolio landing with inbox + cards
- Phase 2 Charter canvas
- Stakeholder Map module workspace (Pattern A + canvas)
- Phase navigation (6 phases, pill states)
- Nexus Mode B drafting
- Execute surface for AMS
- Mode C takeover UI (static OK, streaming bonus)

**Nice-to-have:**
- Full Pattern detail drawer
- Live Timeline tab
- Team tab with person detail drawer

**Post-demo (stubs OK):**
- Settings tab
- Subscription preferences
- Maestro oversight view (cloud version, not demo)

### 12.7 Seed data · 3 + 1 programs for Meridian

1. Ambient Documentation rollout — Phase 2 Charter · Pattern shape
2. AMS Optimization — Phase 5 Execute · Pattern shape
3. IT Capital Reallocation via PDLC — Phase 2 Charter · Custom shape
4. Clinical Workflow Automation — Phase 6 Verify · signed-off (historical texture)

Required: realistic charter summaries · pattern pre-loaded content for Modules 1-4 in Pattern programs · stakeholder map with 8 Meridian persons · findings/contradictions/analysis for AMS Diagnose · milestones+work+risks+evidence for AMS Execute · CXO profile for Prat's sponsor character · full attribution chains (Nexus-tagged appropriately).

### 12.8 Calls I made

1. Full component contracts specified for Claude Code / Codex.
2. 30+ API endpoints inventoried.
3. Cross-links architectural, not cosmetic.
4. Prat demo 15 min for Programs (separate from Intelligence segment).
5. Demo beats prioritize build order.
6. Seed data is 3+1 programs, 4 states.
7. Mode C takeover can be static for demo.
8. Meridian is demo anchor, consistent across Intelligence + Programs.
9. Timeline/Team tabs nice-to-have.
10. Maestro view post-demo.

---

## Packet 13 · Claude Code build pack (Programs)

### 13.1 Purpose

Executable instructions for Claude Code + Codex to build Programs. Mirrors Intelligence build pack structure. Runnable as `pnpm run build:programs`.

### 13.2 Build pack structure

6 phases with QA gates. Resumable. Idempotent. Rollback-able.

Dual-engine:
- Claude Code → db/, lib/, api/
- Codex → components/, app/, tests/
- Merge at Phase 4.

### 13.3 Phase 0 · Preflight

**Verify:**
- Supabase migrations reconciled (PRIOR SESSION BLOCKER — must resolve first)
- Env vars: SUPABASE_URL/ANON_KEY/SERVICE_KEY, ANTHROPIC_API_KEY (Opus 4.7), PINECONE_API_KEY (namespace `public-patterns` seeded)
- Intelligence build shipped (Programs shares Nexus infra)
- Branch `programs-build` created from `main`

**Halt if:** migration drift · Intelligence incomplete · branch has uncommitted changes

### 13.4 Phase 1 · Schema migrations

Migration file: `005_programs_foundation.sql`

**Extends:**
- `engagements` — data_residency_region, retention_policy_years, archived_at, deleted_at
- `engagement_participants` — view_state jsonb, notification_preferences jsonb
- `engagement_topics` — promotion_state, deployment_count, successful_deployment_count, last_successful_deployment_at, canonical_shape_json

**Creates (10 new tables):**
- `program_threads` (mode-tagged Nexus conversations per program)
- `maestro_oversight_flags`
- `phase_snapshots`
- `module_state_log`
- `founder_approval_requests`
- `pattern_match_logs`
- `program_modules` (state per program per module)
- `program_milestones`
- `program_work_items`
- `program_risks`

**Indexes:** status+phase+updated · participants person+role · modules engagement+status · work items engagement+status · threads program+mode · flags program+resolved · engagements full-text.

All additive. IF NOT EXISTS guards. Zero existing-data risk.

**QA gate:** tables exist · columns exist · indexes built · no errors · row counts unchanged.

### 13.5 Phase 2 · Data access layer + types

**Gen types:** `pnpm supabase gen types typescript --local > lib/supabase/types.gen.ts`

**Structure:**
```
lib/programs/
├── queries.ts       # getProgramPortfolio, getProgramById, getModuleState
├── mutations.ts     # originateProgram, advancePhase, publishDeliverable
├── classifier.ts    # 3-stage pattern match pipeline
├── governance.ts    # Gate enforcement, approvals
├── nexus.ts         # 3-mode Nexus integration
├── execute.ts       # Milestones, work items, risks
└── types.ts         # Local types
```

**QA gate:** TypeScript compiles · queries return expected shapes · tenancy enforced (person A can't see person B).

### 13.6 Phase 3 · API routes + Nexus

**Routes** at `app/api/v1/programs/` (see Packet 12 §12.3 for full inventory · 30+ endpoints).

**Nexus integration:** reuse `lib/nexus/` from Intelligence · Programs-specific templates in `lib/programs/nexus.ts` · context pulls from `program_threads` not `intelligence_threads`.

**QA gate:** endpoints return 200/expected error codes · SSE streams emit valid events · tenancy enforced at API (403 cross-client) · rate limits respected (100 req/min).

### 13.7 Phase 4 · UI components + surfaces

**Component structure** at `components/programs/`:
- `portfolio/` — PortfolioIndex, ProgramCard, InboxZone, FilterBar, OriginationLaunchpad
- `origination/` — OriginationIntake, ShapeProposer
- `program/` — ProgramSurface, ProgramHeader, PhaseNavigator, SponsorDashboard, LeadWorkspace, MaestroOverlay, PhaseGate
- `modules/` — ModuleWorkspace, ModuleDashboard, ModuleTile, patterns/{A-E}.tsx, specific/{StakeholderMap, ContradictionSurface, BusinessCaseROI, OutcomeDashboard}
- `nexus/` — NexusPanel, ChatTab, DraftsTab, FlagsTab, SourcesTab, CxoTakeover
- `execute/` — ExecuteSurface, MilestonesTab, WorkTab, RisksTab, EvidenceTab, ReportsTab

**Routes** at `app/programs/`:
- `page.tsx` · `new/page.tsx` · `[programId]/page.tsx` · `[programId]/phase/[n]/page.tsx` · `[programId]/module/[key]/page.tsx` · `[programId]/deliverable/[id]/page.tsx` · `[programId]/{timeline,team,settings}/page.tsx` · `patterns/page.tsx`

**QA gate:** routes render without errors · role-adaptive rendering (sponsor/lead/maestro) · Nexus panel opens/closes · all 5 render patterns work · Execute 5 tabs render · Lighthouse ≥85 on portfolio and program.

### 13.8 Phase 5 · Seed data + integration tests

**Seed:** `db/seeds/programs-demo-seed.ts`

Creates Meridian Health (if missing) + 4 programs + full module state + stakeholders + findings + contradictions + milestones + work items + risks + evidence + Nexus-drafted content with attribution + pre-loaded Genome patterns (AMS Optimization, Ambient Docs Rollout, PDLC IT Capital).

**Playwright E2E tests:**
1. Jake (lead) → portfolio → Ambient Docs → Phase 2 → Stakeholder Map → Nexus draft
2. Prat (sponsor) → portfolio → AMS → sponsor dashboard → decisions waiting
3. AMS Execute → filter Work → mark item complete → status update verified
4. Pattern classifier → new program origination → SSE stream stages verified

**QA gate:** seed runs clean · data visible · 4 E2E tests pass · Prat demo walkthrough 6 beats all work.

### 13.9 Phase 6 · Ship checklist

- [ ] Migrations applied to production Supabase
- [ ] Seed data loaded (demo tenant only)
- [ ] Production env vars set
- [ ] Vercel deployment green
- [ ] Staging tested with demo beats
- [ ] Rate limits configured
- [ ] Error tracking (Sentry) wired
- [ ] Audit log writes verified
- [ ] Performance budgets met
- [ ] Nexus provenance visible on every draft
- [ ] Copy proofread (no typos, no forbidden client names, composite disclaimers)

**Post-ship 24h monitoring:** error rate <0.5% · API p95 within budget · Nexus draft completion >90% · zero tenancy violations · zero unauthorized access.

### 13.10 Rollback procedure

1. Vercel revert to prior tag
2. Schema rollback: `db/rollbacks/005_programs_foundation_rollback.sql`
3. Demo tenant purge: `pnpm db:reset-demo-tenant`
4. Incident log: `ops/incidents/`

Rollback ≤15 min.

### 13.11 Timeline

| Phase | Duration |
|---|---|
| 0 Preflight | 30 min |
| 1 Schema | 2 hrs |
| 2 Data layer | 4 hrs |
| 3 API routes | 6 hrs |
| 4 UI (parallelized) | 12 hrs |
| 5 Seed + tests | 4 hrs |
| 6 Ship | 2 hrs |
| **Total** | **~30 hrs / 3-4 working days** |

Assumes Intelligence done, migrations reconciled.

### 13.12 Dual-engine split

**Claude Code:** Phase 0/1/2/3 full · Phase 4 (ExecuteSurface, CxoTakeover, NexusPanel — server-heavy) · Phase 5 seed · Phase 6.

**Codex:** Phase 4 (portfolio, origination, program surface, module patterns) · Phase 5 Playwright.

**Merge at end of Phase 4.** Cross-review: Claude Code reviews Codex component integrations; Codex reviews Claude Code API contracts.

### 13.13 Calls I made

1. 6 phases with QA gates — mirrors Intelligence.
2. Resumable/idempotent/rollback-able.
3. ~30 hours over 3-4 days realistic.
4. Phase 0 halt conditions prevent bad starts.
5. All migrations additive.
6. Dual-engine at Phase 4.
7. Seed demo-tenant only.
8. Rollback script pre-written.
9. Integration tests E2E, demo-flow-specific.
10. Ship checklist binary checkboxes.

---

## Programs design specification · COMPLETE

**13 packets shipped:**

Track A · Foundation (4 packets):
1. Surface architecture + shapes ✓
2. Genome + pattern match ✓
3. Multi-role composition ✓
4. Governance + promotion ✓

Track B · Portfolio (2 packets):
5. Portfolio IA + origination ✓
6. Portfolio wireframes + spec ✓

Track C · Single program (5 packets):
7. Program IA ✓
8. Embedded Nexus ✓
9. Module render patterns ✓
10. Phase-by-phase wireframes ✓
11. Execute deep-dive ✓

Track D · Ship (2 packets):
12. Screen spec + cross-links + Prat demo ✓
13. Claude Code build pack ✓

**Canonical wireframes rendered:**
- `abarva_programs_portfolio_wireframe_lead_view`
- `abarva_programs_origination_intake_wireframe`
- `abarva_programs_shape_proposer_wireframe`
- `abarva_programs_phase_2_charter_wireframe`
- `abarva_programs_phase_5_execute_wireframe`

**What's locked:**
- Surface architecture (5 surfaces · 3 shapes · 6 phases · 17 modules · 4 roles)
- Pattern match classifier (3-stage, deterministic, testable)
- Role-aware rendering at one URL per surface
- Governance + versioning + 7-year audit
- Pattern promotion state machine (DRAFT → MATURE)
- Embedded Nexus · 3 operating modes distinct from Intelligence
- Module render patterns (5 cover all 17)
- Phase-specific canvases for each of 6 phases
- Execute ops surface with 5 tabs
- Complete component + API contracts
- Prat demo beat-by-beat
- Claude Code build pack (6 phases, ~30 hrs, dual-engine split)

**Schema additions:** 10 new tables + column extensions on 3 existing. All additive.

**Blocker unchanged:** Supabase migration reconciliation still required before Claude Code can run build pack. (Prior session item.)

**Next logical steps:**
1. Reconcile Supabase migrations (unblocks Intelligence + Programs builds)
2. Run Intelligence build pack first (Programs depends on shared Nexus infra)
3. Run Programs build pack
4. Load demo seed data for Meridian
5. Pressure-test with Prat using 6-beat demo script
