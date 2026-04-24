# File 05 · Workflow Mechanics Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Claude Code primary, Codex secondary for state infrastructure
**References:** File 01 failure modes, File 02 patterns, File 03 knowledge layer, File 04 surfaces

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`.

**Applies:** Agent Autonomy Charter. Pre-decided items in prior files.

---

## Section 1 · Architectural premise

Workflow mechanics are the plumbing that makes programs actually move. Without them, every other architectural piece sits as potential. This file specifies: the program state machine (phases, gates, advancement), upload ingestion (how user-provided artifacts reshape program state), the human-layer integration (how AbarVa maestros are booked, delivered, logged), workshop-mode interaction (how the product supports a maestro orchestrating a room of SMEs), user provisioning, approval flows, notifications, task queues, and pause-and-resume semantics.

Two themes run through this file:

**Workshop mode is primary, not edge case.** Real-world usage is a maestro orchestrating SMEs in a room. Solo user is the fallback, not the default. Every mechanic must work with a room of people looking at a shared screen, not just a single user at their laptop.

**The human layer is a product feature, not a service tacked on.** When AbarVa provides a human maestro for a workshop, domain review, alignment session, or board prep, that engagement flows through the product — booked, prepared, delivered, logged, surfaced back in the program state. The product doesn't pause while the human does something outside it.

---

## Section 2 · Program state machine

### 2.1 · Phases

Five phases, named gates between each, explicit advancement criteria per gate.

**Phase 1 · Intake & Framing**
- Gate into: created from Maestro Intake Interface with GO outcome
- Gate out: sponsor commitment complete, scope locked, D01-D04/D05 at tier-appropriate completion, tensions resolved or routed

**Phase 2 · Diagnosis & Analysis**
- Gate into: Phase 1 gate-out satisfied
- Gate out: RCA complete, baseline frozen, hypothesis backlog pressure-tested, data readiness re-verified

**Phase 3 · Decision & Design**
- Gate into: Phase 2 gate-out satisfied
- Gate out: decision memo (D17) approved, business case rigor met, solution architecture aligned (if tech program), operating model chosen

**Phase 4 · Execution & Delivery**
- Gate into: Phase 3 gate-out satisfied
- Gate out: milestones hit or deliberate scope revision, outcome measurement plan in place, sponsor re-engagement cadence maintained

**Phase 5 · Outcome & Attestation**
- Gate into: Phase 4 gate-out satisfied
- Gate out: outcomes attested, dual-ledger reconciled, learnings extracted to pattern library

### 2.2 · State model

Each program has:
- `current_phase` (1-5)
- `gate_status` per gate (not_started / in_progress / blocked / ready_for_review / passed)
- `gate_blockers` structured list per blocked gate
- `phase_deliverables_status` per phase (all deliverables with tier, content state, approval state)
- `decision_log` append-only
- `state_transitions_log` append-only audit of all state changes

### 2.3 · Gate advancement

Advancement is a deliberate action, not automatic. Flow:

**Step 1 — Pre-check.** System evaluates gate criteria. Produces "ready" or "blockers remain" status. User sees blocker list if not ready.

**Step 2 — User initiates.** When ready, user (typically maestro or sponsor) explicitly triggers gate advancement. System re-validates.

**Step 3 — Required approvals.** Some gates require sponsor approval (Phase 3 → 4, for example). System routes approval request.

**Step 4 — State transition.** On approval, system advances state, logs transition with actor and timestamp, updates all cross-surface references (Tower, Programs index, pattern detail pages showing programs using this pattern), notifies relevant parties.

**Step 5 — Next-phase activation.** Deliverables for next phase activate. Nexus opens next-phase conversation with synthesis of prior phase outcomes and focus for new phase.

### 2.4 · Pause-and-resume

Programs can pause for named reasons. Common reasons:
- Awaiting sponsor decision
- Awaiting data availability
- Awaiting alignment workshop
- Awaiting dependency (external vendor, regulatory approval)
- Deliberate business pause (budget freeze, competing priorities)

Pause is a first-class state. When paused:
- Program state preserved in full
- Nexus communicates the pause clearly ("Morrison paused Apr 15 awaiting board alignment workshop — projected resume Apr 29")
- Tower surfaces paused programs with reason visible
- Notifications silenced per reason category (don't nag the user about a program they deliberately paused)
- Resume reminder set per projected resume date

Resume flow:
- User or scheduled reminder triggers resume
- System refreshes context (anything change during pause? Pattern updates? Tenant data updates? Stakeholder changes?)
- Nexus opens with "resuming Morrison — here's what changed during your pause"
- Program returns to active state

### 2.5 · Current state and gaps

**Phase model:** Partial. Five phases exist conceptually. Gate enforcement likely incomplete. Status: **PARTIAL**.

**State model:** Partial. Core state persisted. Decision log, state transitions log likely partial. Status: **PARTIAL**.

**Gate advancement:** Partial/missing. Likely no end-to-end advancement flow with approval routing. Status: **MISSING or PARTIAL**.

**Pause-and-resume:** Missing. No first-class pause state. Status: **MISSING**.

### 2.6 · Gaps with priority

- [P0 demo-critical] Gate advancement end-to-end: pre-check, user initiation, required approvals, state transition, next-phase activation
- [P0 demo-critical] Gate enforcement applying craft pattern rules (sponsor commitment, tension resolution, three-option framing, etc.)
- [P0 demo-critical] Phase 1 → Phase 2 gate working for Morrison
- [P1 seed-critical] Pause-and-resume with named reasons
- [P1 seed-critical] Decision log and state transitions log with audit
- [P1 seed-critical] Gate advancement for all phase transitions

---

## Section 3 · Upload and ingestion pipeline

### 3.1 · Purpose

Users bring artifacts into programs constantly — board notes, interview transcripts, spreadsheets, prior analyses, vendor materials, regulatory documents, stakeholder emails. The product must accept these gracefully, extract their substance into program context, and reshape the program state where the artifact implies a shift.

Without this, the product is a one-way conversation that can't absorb the organizational context. With this, the product becomes a genuine knowledge repository for the transformation effort.

### 3.2 · Upload affordances

**Paperclip in agent conversation.** Primary affordance. User drops or selects a file during a conversation with any agent. File uploads, agent acknowledges receipt, ingestion begins.

**Drop zones on specific surfaces.** Deliverable pages have drop zones contextualized to the deliverable ("drop interview transcript for D04" on intake synthesis page). Phase pages have drop zones for phase-level artifacts.

**Bulk import for program initialization.** New programs can ingest prior artifacts wholesale — a prior engagement's materials, a consulting deck, existing documentation — to seed context.

**Connector-driven imports.** Structured imports from connected systems (Epic EMR data, SAP financial data, Salesforce CRM data). Not ad-hoc uploads — scheduled syncs configured in Admin.

### 3.3 · Supported formats

**Documents:** PDF, DOCX, TXT, MD. OCR for scanned PDFs.
**Spreadsheets:** XLSX, CSV. Schema inference.
**Presentations:** PPTX. Slide-by-slide extraction.
**Emails:** EML, MSG. Thread context preserved.
**Images:** JPG, PNG, HEIC. OCR + visual context analysis.
**Transcripts:** VTT, SRT, plain text. Speaker separation preserved.
**Structured data:** JSON, XML for API-exported data.

Out of scope for MVP: video (long-running), audio without transcript (requires separate transcription pipeline).

### 3.4 · Ingestion pipeline

**Step 1 — Receipt.** File lands in staging storage. Virus scan. Format validation.

**Step 2 — Extraction.** Content extracted per format. Text, tables, structure, metadata. Quality signals captured (confidence of OCR, extraction completeness).

**Step 3 — Categorization.** Agent classifies: what kind of artifact is this (interview notes, financial analysis, stakeholder email, regulatory document, etc.)? What program phase does it most relate to? What deliverables does it inform?

**Step 4 — Entity extraction.** Named entities (people, organizations, dates, amounts, specific decisions mentioned). Structured extraction for ingestion into program state.

**Step 5 — Context integration.** Extracted substance flows into:
- Program conversation context (immediately available for agent reasoning)
- Deliverable drafts (where relevant — interview transcript reshapes D04; board notes reshape sponsor commitment analysis)
- Evidence base (citable in future deliverables)
- Stakeholder map (new stakeholders identified)
- Decision log (decisions mentioned in the artifact)

**Step 6 — Program state reshape.** If the artifact implies state change (e.g., sponsor commitment letter indicates stronger commitment than currently captured), system proposes state update. User confirms or modifies.

**Step 7 — Agent acknowledgment.** Nexus opens conversation: "I've processed the board notes from Apr 18. The two things that caught my attention: the board added a ROI reconciliation requirement that isn't in D03, and Dr. L is now named as Phase 3 interview participant rather than Phase 4. Want me to update D03 and the stakeholder map, or walk through the changes first?"

**Step 8 — Logging.** Ingestion logged with provenance (user who uploaded, timestamp, extracted entities, state changes proposed, state changes accepted).

### 3.5 · Workshop-mode ingestion

In workshop mode, ingestion supports real-time capture:

- Maestro shares screen. Starts a workshop. SMEs join (virtually or physically).
- During workshop, notes are captured — either via direct typing into the product, via live transcription from a connected service, or via upload at end.
- As content comes in, agent synthesizes mid-workshop ("the three options the room just articulated are X, Y, Z — want me to draft them as the three-option framing for D15?")
- End of workshop: full capture ingested, program state updated, next steps identified.

### 3.6 · Current state and gaps

**Upload affordances:** Missing. No paperclip in agent conversation. No drop zones. Status: **MISSING**.

**Format support:** N/A until upload exists.

**Ingestion pipeline:** Missing. Status: **MISSING**.

**Workshop-mode ingestion:** Missing. Status: **MISSING**.

### 3.7 · Gaps with priority

- [P0 demo-critical] Paperclip in agent conversation (all four agents)
- [P0 demo-critical] Basic format support: PDF, DOCX, TXT, XLSX
- [P0 demo-critical] Ingestion pipeline with extraction and categorization
- [P0 demo-critical] Context integration into conversation and relevant deliverables
- [P0 demo-critical] Agent acknowledgment of uploaded content with substantive summary
- [P1 seed-critical] Entity extraction and structured state reshape proposals
- [P1 seed-critical] Full format support (presentations, emails, images, transcripts)
- [P1 seed-critical] Workshop-mode real-time ingestion
- [P1 seed-critical] Connector-driven scheduled imports
- [P2 Series A] Bulk program initialization from prior artifacts
- [P2 Series A] OCR for scanned documents
- [P2 Series A] Video/audio transcription pipeline

---

## Section 4 · Human-layer integration

### 4.1 · Purpose

The product does the work with AI plus on-call human experts. The human layer is a first-class product feature. When a maestro needs human help — domain review, facilitation, consensus-driving session, board deliverable review — the engagement happens through the product.

Pricing already reflects total value delivered including the human layer. The product's job is to make the human layer feel seamless — bookable, prepared, delivered, logged — not pause while the human does something offline.

### 4.2 · Human layer services

**Workshop facilitation.** AbarVa maestro joins an alignment workshop, SME interview, decision session. Helps structure, capture, drive to consensus.

**Domain review.** Expert reviews a deliverable for substantive accuracy. Clinical expert for ambient program deliverables, financial expert for margin recovery, data/ML expert for AI-led PDLC.

**Board-level deliverable polish.** Critical deliverable heading to board review receives expert polish — layout, narrative discipline, pressure-testing.

**Stuck-unblocking.** Program has stalled. Maestro conversation to diagnose and restart.

**Intake consultation.** Prospective tenant or complex program — maestro helps with initial scoping before committing to product workflow.

### 4.3 · Booking flow

**Step 1 — Need identification.** Either user requests ("I need facilitation help for tomorrow's workshop") or agent surfaces ("Morrison has been paused 18 days — want me to book a maestro session to unblock?").

**Step 2 — Service selection.** User chooses service type and urgency. Standard, urgent, or scheduled.

**Step 3 — Maestro matching.** System matches available maestros with appropriate domain expertise and availability.

**Step 4 — Scheduling.** Calendar integration. Proposes 2-3 slots. User confirms.

**Step 5 — Preparation.** Maestro receives pre-read automatically: program context, relevant pattern intelligence, recent activity, specific question or deliverable involved. Pre-read is auto-assembled from program state.

**Step 6 — Session delivery.** Maestro joins session (video call, in-person, async review per service type). Works the problem.

**Step 7 — Capture and handback.** Maestro's notes, decisions, recommendations captured back into the product — either via direct upload or live workshop-mode ingestion.

**Step 8 — State update.** Program state updates based on maestro output. Agent acknowledges ("the maestro session with Dr. Patel resolved the sequencing decision — we're going parallel-track with quality gate at month 4. I've updated D15 and D17.").

**Step 9 — Logging and billing.** Session logged (duration, service type, deliverables produced). If billing is per-session rather than bundled, invoice flow triggered.

### 4.4 · Maestro identification and availability

Every AbarVa engagement has a primary maestro assigned at program start. Primary maestro is default for most sessions. Specialist maestros (clinical SMEs, technical architects, change management experts) rotate in for domain-specific needs.

Availability surfaced in booking flow based on calendar integration and current engagement load.

### 4.5 · Hours allocation and visibility

Each pricing tier includes a pre-allocated number of maestro hours:
- Tier 1 ($350K): 240 hours
- Tier 2 ($800K): 520 hours
- Tier 3 ($1.6M): 1,040 hours

Hours surfaced in Admin and (optionally) in agent rail when relevant:
- "Morrison has used 142 of 520 allocated hours."
- Atlas may surface on Tower: "hours consumption at 65% with 5 months remaining — on-pace or slightly ahead."

Overage handling: alerts before exhaustion, clear overage rates, option to upgrade tier.

### 4.6 · Current state and gaps

**Human layer booking:** Missing. Not built. Status: **MISSING**.

**Maestro matching:** Missing. Status: **MISSING**.

**Preparation auto-assembly:** Missing. Status: **MISSING**.

**Capture back into product:** Missing (subset of workshop-mode ingestion, not yet built).

**Hours tracking:** Missing. Status: **MISSING**.

### 4.7 · Gaps with priority

- [P1 seed-critical] Human layer booking flow (even if initially manual-fulfillment behind the UI)
- [P1 seed-critical] Maestro preparation auto-assembly
- [P1 seed-critical] Capture back into product via workshop-mode ingestion
- [P2 Series A] Calendar integration for automated scheduling
- [P2 Series A] Hours tracking and visibility
- [P2 Series A] Maestro matching algorithm
- [P3 post-Series A] Multi-maestro coordination for complex engagements

**Note:** Human-layer integration is a second-phase capability. For demo, the narrative is "this is how it works" with a simplified version of booking. Full fulfillment infrastructure is post-seed build.

---

## Section 5 · Workshop-mode interaction design

### 5.1 · Purpose

Workshop mode is the real-world primary usage pattern. Design the interaction with this in mind, not as an adaptation.

### 5.2 · Workshop mode affordances

**Large typography mode.** Deliverable content legible from across a conference room. Key elements scaled up. Secondary details reduced or hidden. Toggle-able per surface.

**Agent-addresses-the-room.** Nexus's language shifts from "what do you think?" (solo) to "what does the room think?" (workshop). Prompts invite multiple perspectives. Capture supports multiple inputs.

**Real-time capture.** Notes, decisions, votes flow in during session. Structured where possible ("the room chose Option B with 4-2 vote, concerns raised: X, Y"). Unstructured where conversational ("someone raised the point that...").

**Shared cursor.** Multiple participants can contribute simultaneously (maestro plus SMEs on their laptops). Attribution preserved but not obtrusive.

**Pause and reconvene.** Workshop may span multiple sessions. Mode preserves state across sessions.

**Artifacts feed back.** Outputs from the workshop flow into deliverables, decision log, stakeholder map, risk register as appropriate.

### 5.3 · Workshop session structure

**Pre-workshop:** Maestro reviews program state, reads agent-surfaced pattern intelligence, preps agenda. Agent helps structure the session.

**Opening:** Participants join. Maestro introduces context. Agent presents relevant pattern-backed priors (if any): "for owned-brand margin decisions at this scale, comparable programs showed these three options with these success rates — let's pressure-test them."

**Discussion:** Room debates. Maestro facilitates. Agent captures key points. Pattern-backed prompts surface as helpful ("this reasoning is similar to the pattern's failure mode #3 — worth naming the risk").

**Decision:** Room converges. Decision captured structurally. Agent reflects: "the decision is parallel-track with quality gate at month 4. I'll draft D15 and D17 accordingly. Sound right?"

**Close:** Next steps identified. Actions assigned. Follow-up session scheduled if needed. Program state updated.

### 5.4 · Current state and gaps

**All workshop-mode:** Missing. Not built. Status: **MISSING**.

### 5.5 · Gaps with priority

- [P1 seed-critical] Large typography toggle
- [P1 seed-critical] Agent-addresses-the-room language shift
- [P1 seed-critical] Real-time capture during session
- [P1 seed-critical] Artifacts feed back into program state
- [P2 Series A] Shared cursor / multi-participant simultaneous input
- [P2 Series A] Structured voting and decision capture

**Note:** Workshop mode is seed-critical, not demo-critical, because demo is narrated (not live-workshop). But demo should *show* the workshop mode capability even if not live-exercising it.

---

## Section 6 · User provisioning

### 6.1 · Purpose

Programs are multi-stakeholder. Users need to be added mid-program (head of quality joins the Ambient review, CFO's analyst joins the Morrison review). Provisioning must be smooth — inviting a user should take under a minute, first login should work without IT ticket.

### 6.2 · Provisioning flow

**Step 1 — Invite.** Maestro or admin initiates invite with email, role assignment, program access.

**Step 2 — Email invitation.** User receives invite email with secure link.

**Step 3 — First login.** User clicks link, completes SSO handshake (if tenant has SSO) or sets password (if not).

**Step 4 — Onboarding.** Brief onboarding flow: welcome, context for why they were invited, tour of relevant surfaces.

**Step 5 — Active state.** User can participate in assigned programs.

**Revocation flow:**
- Admin revokes access
- User session terminated within 60 seconds
- Audit log captures

### 6.3 · Roles and permissions

**Tenant-level roles:**
- Admin: full tenant access
- Maestro: program creation and management, all program surfaces, Intelligence browse
- Viewer: read-only on assigned programs

**Program-level overrides:**
- Per user per program: can-view, can-edit, can-approve
- Sponsor role: approval authority on specific gates
- Contributor role: can add to specific deliverables

**Cross-tenant:**
- External stakeholders (vendors, auditors) may need limited access — handled as special invite type with restricted permissions

### 6.4 · Current state and gaps

**Invite and email:** Partial. Status: **PARTIAL**.

**SSO handshake:** Partial. Likely works for some tenants. Status: **PARTIAL**.

**First-login onboarding:** Missing. Status: **MISSING**.

**Roles and permissions:** Partial. Basic roles exist. Fine-grained program-level permissions unclear. Status: **PARTIAL**.

**Revocation:** Partial. Status: **PARTIAL**.

### 6.5 · Gaps with priority

- [P0 demo-critical] End-to-end user provisioning (invite → email → SSO → first login → active)
- [P0 demo-critical] Role assignment at invite with program access
- [P1 seed-critical] First-login onboarding flow
- [P1 seed-critical] Program-level permission overrides
- [P1 seed-critical] Revocation flow with session termination
- [P2 Series A] External stakeholder access with restricted permissions
- [P2 Series A] Bulk user provisioning for large tenants

---

## Section 7 · Approval flows

### 7.1 · Purpose

Decisions need approvals. Phase gates require sign-off. Deliverables need review before declared final. The product must route approvals to the right person, capture approval or rejection with rationale, update state accordingly.

### 7.2 · Approval types

**Deliverable approval.** Specific deliverable (D17 Decision Memo, for example) needs sign-off before program advances.

**Phase gate approval.** Phase 1 → Phase 2, Phase 3 → Phase 4, etc. — sponsor or designated approver signs off.

**Decision approval.** Specific decisions (budget ceiling adjustment, scope revision) route to approver.

**Human-layer engagement approval.** Some human-layer sessions (high-cost, external-facing) require explicit sponsor approval.

### 7.3 · Approval flow

**Step 1 — Approval request initiated.** System routes to designated approver (typically sponsor; for deliverables, can be reviewer/approver chain).

**Step 2 — Approver notification.** In-product notification plus email. Specific link to review surface.

**Step 3 — Review.** Approver reviews content. Can approve, reject, request changes.

**Step 4 — Decision capture.** Approval or rejection logged with actor, timestamp, rationale (optional for approve, required for reject).

**Step 5 — State update.** On approve: state advances. On reject: returns to requester with feedback; state held. On request-changes: content returns to editor mode with approver comments.

**Step 6 — Escalation.** If approval sits beyond threshold (configurable; default 48 hours), reminder sent. If still no response, escalation to next level.

### 7.4 · Audit

Every approval is audit-logged with: actor, timestamp, action (approve/reject/request-changes), rationale, before-state, after-state. Audit log queryable from Admin.

### 7.5 · Current state and gaps

**Approval flow:** Partial or missing. Likely basic "mark as approved" exists; full routing, escalation, audit probably incomplete. Status: **PARTIAL/MISSING**.

### 7.6 · Gaps with priority

- [P0 demo-critical] Phase gate approval with sponsor routing
- [P0 demo-critical] Deliverable approval with reviewer/approver chain
- [P0 demo-critical] Approval state change advancing program state
- [P1 seed-critical] Rejection flow with rationale capture
- [P1 seed-critical] Request-changes flow
- [P1 seed-critical] Escalation logic with thresholds
- [P1 seed-critical] Audit log queryable
- [P2 Series A] Configurable approval chains per tenant

---

## Section 8 · Notifications

### 8.1 · Purpose

Users need to know when their attention is required. Notifications drive action — they're not decorative alerts. Every notification has a specific action the user can take.

### 8.2 · Notification types

**Approval required.** Something awaits your sign-off.

**Task assigned.** A specific task was assigned to you by a maestro, sponsor, or the agent.

**Attention requested.** Agent surfaces something that requires your input (pressure card from Atlas, decision question from Nexus).

**Status update.** Program advanced phases; deliverable you contributed to was approved; workshop session scheduled.

**Reminder.** Re-engagement cadence; paused program resume reminder; deadline approaching.

**Alert.** Something went wrong (connector down, integration failure, integrity issue).

### 8.3 · Delivery channels

**In-product.** Notification bell icon in header. Grouped by type. Persistent until acknowledged.

**Email.** For approval-required, attention-requested, and alerts. Daily digest for less urgent types.

**Mobile push (future).** Post-seed. Not in current scope.

### 8.4 · User preferences

User can configure:
- Email frequency per notification type (immediate, digest, off)
- In-product grouping preferences
- Do-not-disturb windows

Enterprise tenants may have policy overrides (admin can require certain alerts go to all users regardless of preference).

### 8.5 · Current state and gaps

**In-product notifications:** Missing. Status: **MISSING**.

**Email notifications:** Missing. Status: **MISSING**.

**User preferences:** Missing. Status: **MISSING**.

### 8.6 · Gaps with priority

- [P0 demo-critical] In-product notifications for approval-required and attention-requested
- [P0 demo-critical] Notification bell with grouped display
- [P1 seed-critical] Email delivery for critical notifications
- [P1 seed-critical] Daily digest for less urgent
- [P1 seed-critical] User preferences per type
- [P2 Series A] Mobile push
- [P2 Series A] Tenant policy overrides

---

## Section 9 · Task queues

### 9.1 · Purpose

Every program generates tasks for participants. Tasks need visibility — "what am I on the hook for?" User needs a single place to see their open tasks across all programs.

### 9.2 · Task sources

- Agent assigns (Nexus says "Maya, please review the supplier data by Friday")
- Maestro assigns (explicit task creation)
- Sponsor assigns (during approval flow)
- System generates (phase gate approaching; re-engagement due)
- User creates (self-assigned action items)

### 9.3 · "Assigned to me" queue

Every user has a queue visible from header nav:
- Open tasks across all programs
- Grouped by urgency / due date
- One-click jump to relevant surface
- Mark complete inline

### 9.4 · Task metadata

- Task description
- Assigner
- Assignee
- Due date (if applicable)
- Related program, phase, deliverable
- Priority
- Status (open, in-progress, complete, blocked)

### 9.5 · Current state and gaps

**Task model:** Missing. Status: **MISSING**.

**Assigned-to-me queue:** Missing. Status: **MISSING**.

**Task creation flow:** Missing. Status: **MISSING**.

### 9.6 · Gaps with priority

- [P0 demo-critical] Task model with assigner, assignee, due date, status
- [P0 demo-critical] Assigned-to-me queue accessible from header nav
- [P0 demo-critical] Task creation from agent context ("assign this to Maya")
- [P1 seed-critical] Task status updates feeding back to program state
- [P1 seed-critical] Task notifications integrated with notification system
- [P2 Series A] Task-level audit and history
- [P2 Series A] Task dependencies

---

## Section 10 · Document export and sharing

### 10.1 · Purpose

Deliverables are often shared outside AbarVa — board pre-reads, vendor communications, regulatory submissions. Export must produce professional-quality artifacts.

### 10.2 · Export formats

**Word (DOCX).** Primary for deliverables going to board, sponsor, external reviewers. Preserves structure, headers, numbering.

**PDF.** For formal submissions, audit artifacts, signed attestations.

**PowerPoint (PPTX).** For deliverables that travel as slide decks (D17 Decision Memo, executive briefings).

**Markdown / plain text.** For technical / developer-oriented content.

### 10.3 · Export flow

- User initiates export from deliverable page
- Format selection (or default per deliverable type)
- System generates export respecting styling, headers, branding
- Composite disclaimer and demo-rendering disclaimer preserved where applicable
- Export downloads or sends via email

### 10.4 · Branding and template

Tenant-level branding: logo, color scheme, typography preferences applied to exports. Admin-configurable.

### 10.5 · Current state and gaps

**Export:** Missing. Status: **MISSING**.

### 10.6 · Gaps with priority

- [P0 demo-critical] DOCX export for Rich deliverables
- [P0 demo-critical] PDF export
- [P1 seed-critical] PPTX export
- [P1 seed-critical] Tenant branding
- [P2 Series A] Markdown/plain text export
- [P2 Series A] Email delivery of exports

---

## Section 11 · Priority sequencing

### P0 — Demo-critical

All gate advancement working end-to-end. Upload/ingest affordance (paperclip) with basic formats. User provisioning end-to-end. Approval flow for phase gates and deliverables. In-product notifications for approval and attention-requested. Task model and assigned-to-me queue. DOCX and PDF export.

### P1 — Seed-critical

Pause-and-resume. Workshop-mode interaction design. Human-layer booking (simplified behind UI). Approval escalation. Email notifications. Program-level permissions. PPTX export. Full format support for upload. Entity extraction and structured state reshape.

### P2 — Series A

Connector-driven imports. Calendar integration. Mobile push. Advanced audit. OCR for scanned documents. Hours tracking visibility.

### P3 — Post-Series A

Video/audio transcription. External stakeholder access. Multi-maestro coordination. Task dependencies.

---

## Section 12 · Acceptance criteria

**Gate advancement:**
- Phase gates enforce craft pattern requirements
- Approval routing works end-to-end
- State transitions logged with audit
- Pause and resume preserved state

**Upload:**
- Paperclip works across all agents
- Basic formats ingested with substantive extraction
- Agent acknowledges uploaded content with meaningful summary

**Human layer:**
- Booking flow works (even if fulfillment initially manual)
- Maestro preparation auto-assembled

**Workshop mode:**
- Large typography legible from conference room
- Real-time capture flows to program state

**Provisioning:**
- User added in under 60 seconds
- First-login works without IT intervention

**Approval:**
- Approvals route, capture rationale, update state, audit

**Notifications:**
- Critical notifications deliver reliably
- User can act from notification

**Tasks:**
- Assigned-to-me queue visible and functional

**Export:**
- Rich deliverables export to DOCX/PDF with proper fidelity and disclaimers

---

## Section 13 · Pre-decided items

- Five phases, named gates
- Pause as first-class state with named reason
- Paperclip primary upload affordance
- Workshop mode legibility discipline
- Human layer bookable through product
- DOCX + PDF minimum export
- Composite and demo-rendering disclaimers preserved in exports
- Audit everything

---

## Section 14 · One-line handoff

> Program state machine with five phases, named gates, pause-and-resume. Upload pipeline with ingestion and context integration. Human-layer booking and workshop-mode interaction. User provisioning, approval flows, notifications, task queues, document export. P0 demo-critical scoped. Apply autonomy charter.

---

*End of File 05 · Workflow Mechanics Backlog.*
