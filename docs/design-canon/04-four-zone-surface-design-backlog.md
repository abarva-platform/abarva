# File 04 · Four-Zone Surface Design Backlog

**Version:** 1.0 · April 23, 2026
**Owners:** Claude Code primary
**References:** File 01 failure modes, File 02 pattern library, File 03 knowledge layer

**Status convention:** `BUILT` · `PARTIAL` · `MISSING` · `NEW-WORK`.

**Applies:** Agent Autonomy Charter. Pre-decided items in File 01 Section 15.

---

## Section 1 · Architectural premise

AbarVa has four authenticated zones. Each zone has a distinct design language, clutter discipline, agent posture, and relationship to the other zones. The four-zone framework resolves the apparent tension between "Claude.ai-style minimalism" and "enterprise dashboard density" by recognizing they're appropriate to different zones.

**The four zones:**

- **Zone 1 Control Tower** — dashboards. Earned density. Atlas refines. Executive surface.
- **Zone 2 Admin** — operational workbench. Organized feature-richness. Steward helps.
- **Zone 3 Programs** — the core product. Ruthless minimalism. Nexus anchors.
- **Zone 4 Intelligence** — agent-surfaced substrate. Sentinel anchors. Browsable when invited.

Plus the external-facing surfaces (Home, Platform, Investor) which are not agent-anchored and follow different rules (covered in File 07).

This file specifies per-zone design, cross-zone mechanics, and the implementation backlog.

---

## Section 2 · Zone 1 — Control Tower

### 2.1 · Purpose and posture

**Purpose:** Portfolio-level visibility into the AI estate for executives. Answers "how are we doing across AI aspirations?" and "what needs my attention right now?"

**Primary user:** CIO/CAIO class (Prat, Mike). 15-minute attention window. Expects substance not theater.

**Agent posture:** Atlas anchors. Voice: executive-concise. Headlines. Short lines. Decision-oriented.

**Design discipline:** Earned density. The page is the product. Agent refines the view but doesn't replace it. This zone rewards information density when the information is editorial and action-oriented. It punishes generic status labels and decorative charts.

### 2.2 · Surfaces within Zone 1

**Control Room (landing surface) — `/tenant/[slug]/tower`**

The executive's first-view-of-the-morning surface. Shows portfolio health in a glance.

Structure:
- Hero editorial line ("ambient vendor sprawl at $1.6M/mo; AI governance lagging NIST coverage; three programs stalled")
- Pressure cards row (3-4 most urgent, each with editorial analysis and action affordances)
- Portfolio KPIs strip (programs in flight, outcomes attested YTD, portfolio value, cloud spend trajectory)
- Segmented drill-down (by BU, by function, by risk tier, by outcome stage)

Atlas presence: agent rail collapsed-narrow by default, expands on click. Opening prompt per state described in Section 2.5.

**Vendor Portfolio — `/tenant/[slug]/tower/vendors`**

All AI vendors in the estate. Overlap detection. Rationalization recommendations.

Structure:
- Vendor grid with capability tags, spend, performance, overlap indicators
- Rationalization recommendations from Atlas
- Renewal calendar with approaching cliffs
- Spend trajectory
- Partnership / strategic vendor identification

**Shadow AI — `/tenant/[slug]/tower/shadow-ai`**

AI tools in use outside formal governance. Detection and triage.

Structure:
- Detected tools list with source (procurement records, SSO logs, connector scans)
- Risk tier assignment
- Ownership gap flagging
- Triage actions (bring under governance, approve, block)

**Regulatory Posture — `/tenant/[slug]/tower/regulatory`**

Framework coverage (NIST AI RMF, EU AI Act, sector-specific). Gaps. Remediation.

Structure:
- Framework coverage heat map
- Gap inventory per framework
- Remediation roadmap with ownership
- Notable recent policy changes affecting coverage

**AI Council — `/tenant/[slug]/tower/council`**

Agenda, decisions, approvals, minutes for the AI governance body.

Structure:
- Upcoming meeting agenda with pre-reads
- Approval queue (items requiring council decision)
- Past decisions with rationale and outcomes
- Council membership and attendance

**Model Inventory — `/tenant/[slug]/tower/models`**

All production AI models. Bias incidents. Drift. Risk tiering.

Structure:
- Model grid with risk tier, last audit, drift indicators
- Bias incident log with post-mortems
- Drift watchlist
- Risk-tier portfolio rollup

### 2.3 · Design language

**Color:** cream background (#F5F1EB) for main canvas. Near-black for navbar and accents. Teal for positive / on-track signals. Amber for warning. Red for critical. No other accent colors without approval.

**Typography:** Georgia serif for editorial headlines and numerical emphasis. DM Sans for body. JetBrains Mono for labels, metadata, captions.

**Density discipline:** earned. A pressure card can be dense *if every element serves the executive's decision*. Elements that decorate are cut.

**Editorial line style:** specific, analytical, decision-oriented.

Good: "$1.3M/mo cloud spend on pace to $2.4M/mo without guardrails by Q3."
Bad: "Cloud spend growing."

Good: "Three ambient tools, one problem, no owner — AI governance gap."
Bad: "Three items require review."

**Action affordances:** every pressure card has 2-3 actions. Assign owner, open investigation, defer to council, escalate. Actions route to appropriate destinations (may handoff to Nexus for program creation, to Sentinel for pattern consultation, to Steward for admin action).

### 2.4 · Atlas anchoring

Atlas rail collapsed-narrow by default (40-60px), expanding to 320-400px on click. Mutual exclusivity with document sidebar (if any on sub-surfaces).

**Atlas voice examples:**

- "$522K/mo. Three vendors. One problem. Decision has been pending 47 days. Assign an owner or defer to council?"
- "NIST coverage dropped 4 points this month — new policy issuance you haven't mapped. Ten minutes to close the gap."
- "Morrison Phase 4 gate slipping. Sponsor engagement lapsed 5 weeks. Want me to draft the re-engagement or route to AbarVa human help?"

**Atlas proactive behavior:**

- On user landing at Tower, Atlas has already reviewed portfolio state and has surface-specific prompts ready
- If pressures have changed since last visit, Atlas opens with "since you were here last, three things changed"
- If stall detection has triggered, Atlas surfaces the stall with recommended action
- If pattern-driven insight is available (cross-program analysis, pattern refinement affecting this tenant), Atlas surfaces it

**Atlas handoffs:**

- To Nexus: when a pressure requires creating a program ("this is program territory — routing you to Nexus")
- To Sentinel: when a pressure requires pattern understanding ("let me pull Sentinel for the pattern walk")
- To Steward: when admin action needed ("Steward needs to configure this; routing you there")

Handoff preserves context; target agent opens with "Atlas said you were working on X..."

### 2.5 · Opening prompts per sub-surface

**Control Room landing:**
> "Three unowned pressures today. $1.3M/mo cloud spend, $1.3M/mo governance gap, $522K/mo ambient overlap. Want to triage the highest-dollar, assign owners, or brief me on what changed since your last check?"
>
> Choices: "Triage highest-dollar" · "Assign owners to all three" · "What's changed since 2 days ago" · "Something else"

**Vendor Portfolio:**
> "47 AI vendors in the estate. 14 are overlap candidates. The ambient triad is the most expensive unresolved. Want the rationalization recommendation, the vendor-by-vendor breakdown, or a sort by renewal date?"

**Regulatory Posture:**
> "NIST AI RMF coverage is 62% — 12 gaps. RADV is the one that concerns me given your MA exposure. Want the RADV-specific gap list, a framework-level heat map, or the remediation roadmap?"

**AI Council:**
> "Apr 24 meeting has 4 agenda items. The ambient vendor decision is the biggest. Want the pre-read, the approval queue, or the decision log from last session?"

**Model Inventory:**
> "37 models in production. Two bias incidents in 90 days. Drift watchlist has 5 models. Want the bias incident post-mortem, the drift watchlist, or a risk-tier rollup?"

### 2.6 · Current state and gaps

**Control Room:** Partial. Apr 22 screenshot shows strong POV. Pressure cards with editorial lines exist. Some polish needed. Status: **PARTIAL**.

**Vendor Portfolio:** Stub route exists per Tier 1 work. Full implementation missing. Status: **MISSING**.

**Shadow AI:** Stub route exists. Full implementation missing. Status: **MISSING**.

**Regulatory Posture:** Stub route exists. Full implementation missing. Status: **MISSING**.

**AI Council:** Stub route exists. Full implementation missing. Status: **MISSING**.

**Model Inventory:** Stub route exists. Full implementation missing. Status: **MISSING**.

**Atlas anchoring:** Partial. Voice partially present in screenshot. Full rail behavior and proactive prompting missing. Status: **PARTIAL**.

### 2.7 · Gaps with priority

- [P0 demo-critical] Atlas fully anchored on Control Room with proactive prompts
- [P0 demo-critical] Control Room polished to exemplar fidelity (matching Apr 22 screenshot plus flagged fixes)
- [P0 demo-critical] Vendor Portfolio at exemplar fidelity (sets pattern for other sub-surfaces)
- [P1 seed-critical] Shadow AI implementation
- [P1 seed-critical] Regulatory Posture implementation
- [P1 seed-critical] AI Council implementation
- [P1 seed-critical] Model Inventory implementation
- [P1 seed-critical] Cross-agent handoff from Tower working end-to-end

---

## Section 3 · Zone 2 — Admin

### 3.1 · Purpose and posture

**Purpose:** Operational workbench for tenant administrators. Set up users, manage connectors, configure entitlements, investigate audit logs.

**Primary user:** Client IT admin (Connor in persona terms). Task-oriented. Feature-expectation set by other enterprise SaaS products.

**Agent posture:** Steward assists. Voice: operationally-terse. Confirmations. Status. Precise instructions.

**Design discipline:** Organized feature-richness. The page is the workbench. Agent is summoned when needed, not the anchor. This zone rewards clear grouping and findability. It's allowed to be dense because the user has a specific task and needs the full inventory of relevant affordances.

### 3.2 · Surfaces within Zone 2

**Admin landing — `/tenant/[slug]/admin`**

Entry point with navigation to sub-surfaces.

**Users — `/tenant/[slug]/admin/users`**

User list, invitation, role assignment, permission management, SSO configuration.

**Data Connectors — `/tenant/[slug]/admin/connectors`**

Connected systems (Epic, SAP, Salesforce, custom APIs). Sync status. Credential rotation. New connector configuration.

**Entitlements — `/tenant/[slug]/admin/entitlements`**

Role-based permissions. Program-level access. Feature flags per user or role.

**Audit Log — `/tenant/[slug]/admin/audit`**

Action log with filtering, search, export. Compliance support.

**Billing and Usage — `/tenant/[slug]/admin/billing`**

Subscription details, usage metrics, invoice history. Relevant for larger engagements.

### 3.3 · Design language

**Color:** same tokens as Zone 1. Density appropriate to task: user list can be a full table; connector grid can show many connectors.

**Typography:** same token family. DM Sans dominates (body-oriented rather than editorial).

**Density discipline:** organized. Grouping by function, clear labels, consistent patterns across sub-surfaces. Sidebar navigation standard pattern for sub-surface selection.

**Action affordances:** standard SaaS admin patterns. Invite, revoke, configure, test, rotate. Destructive actions require confirmation.

### 3.4 · Steward anchoring

Steward rail collapsed-narrow by default. Expansion when user is stuck or explicitly summons.

**Steward voice examples:**

- "SAP connector credential expired Apr 20. Rotate it or connector stays broken."
- "User invite sent. SSO handshake pending. Expect 2-minute delay before first login works."
- "That permission change affects 47 users. Confirm?"

**Steward posture:** less proactive than other agents. Admin work is mostly self-service; Steward surfaces when there's something specific to flag or help with.

### 3.5 · Opening prompts per sub-surface

**Admin landing:**
> "Users, connectors, entitlements, audit, billing. What do you need?"
>
> Choices: "Provision a user" · "Check connector health" · "Review audit log" · "Something else"

**Users:**
> "247 users provisioned. 3 pending SSO activation. Want to invite a user, audit access, or review role assignments?"

**Data Connectors:**
> "Epic FHIR synced 2 minutes ago. SAP last synced 3 days ago — might want to check the credential. Want to configure a new connector, troubleshoot an existing one, or see the sync log?"

**Entitlements:**
> "Three roles configured — admin, maestro, viewer. Program-level overrides for 12 users. Want to modify a role, adjust program access, or review the permissions matrix?"

**Audit Log:**
> "Last 24 hours: 340 actions logged. No anomalies flagged. Want to filter by user, export for compliance, or investigate a specific action?"

### 3.6 · Current state and gaps

**Admin landing:** Partial. Per PR history, some sidebar structure exists. Status: **PARTIAL**.

**Users:** Partial. Basic user list may exist; invitation and provisioning flow partially functional. Status: **PARTIAL**.

**Data Connectors:** Missing or stub. Status: **MISSING**.

**Entitlements:** Missing. Status: **MISSING**.

**Audit Log:** Missing or stub. Status: **MISSING**.

**Billing and Usage:** Missing. Status: **MISSING**.

**Steward anchoring:** Missing. Status: **MISSING**.

### 3.7 · Gaps with priority

- [P0 demo-critical] User provisioning end-to-end (addresses FM-3, FM-4 indirectly by enabling workshop participation)
- [P1 seed-critical] Data connector management
- [P1 seed-critical] Entitlements management
- [P1 seed-critical] Audit log with compliance export
- [P1 seed-critical] Steward anchoring with summonable pattern
- [P2 Series A] Billing and usage tracking
- [P2 Series A] Advanced audit features (investigation workflows, anomaly detection)

---

## Section 4 · Zone 3 — Programs

### 4.1 · Purpose and posture

**Purpose:** The core product. Where the transformation work happens. User starts with a problem and walks out with a plan.

**Primary user:** Maestro (Maya) orchestrating. Often in workshop mode with a room of SMEs. Sometimes solo for pre-draft or synthesis.

**Agent posture:** Nexus anchors. Voice: maestro-collegial. Senior advisor thinking alongside the user.

**Design discipline:** Ruthless minimalism. The agent is the product. The page serves the conversation. Every element fights for its life. Nothing on screen unless it serves the thought the user is having right now.

### 4.2 · Surfaces within Zone 3

**Programs index — `/tenant/[slug]/programs`**

List of programs for the tenant. Portfolio view with phase distribution. Filter by phase, archetype, status. Start new program.

**Program page — `/tenant/[slug]/programs/[program]`**

Canonical program surface. Phase timeline, current phase focus, open decisions, pressures, cross-links.

**Phase page — `/tenant/[slug]/programs/[program]/phase/[n]`**

All deliverables for a specific phase. Gate status. Phase-specific actions.

**Deliverable page — `/tenant/[slug]/programs/[program]/deliverables/[code]`**

Specific deliverable at declared tier (Rich / Outline / Stub). The working surface where substance lives.

**Maestro Intake Interface — `/tenant/[slug]/programs/new`**

The front door. Conversational intake producing GO/REFINE/REDIRECT outcome.

### 4.3 · Design language

**Color:** cream canvas, teal accents, editorial discipline.

**Typography:** Georgia for titles and numerical emphasis (KPI values, decision memo headline). DM Sans for body prose. JetBrains Mono for metadata.

**Density discipline:** ruthless minimalism. A deliverable page should present the conversation the room is having — not everything the system knows. Elements earn their place or disappear.

**Editorial voice:** specific, grounded, pattern-backed. Same discipline as Tower's editorial lines but applied to the substance of the work.

**Workshop mode support:** design must be legible from across a conference room. Typography scales appropriately; elements are distinct; conversation flow is readable by participants who aren't at the keyboard.

### 4.4 · Nexus anchoring

Nexus rail collapsed-narrow by default. Expands prominently — this is the zone where the agent is most central.

**Nexus voice examples:**

- "I drafted D17 using the three-lever pattern from Owned Brand Margin Recovery. The sequencing choice is the one place I want your input — parallel or sequential."
- "Before we walk into the CFO interview, the place I'd expect pushback is the promotional depth cap. Let's pre-write the answer."
- "Morrison has been sitting for 11 days. What changed? Want me to queue a re-engagement with Marcus, or are we in a deliberate pause?"

**Nexus proactive behavior (pattern-driven synthesis):**

- On program landing, Nexus has synthesized program state into the most relevant open questions
- If a phase gate is approaching, Nexus surfaces what's needed
- If pattern priors suggest a failure mode relevant to current state, Nexus flags it
- If related programs at other tenants have encountered the current situation, Nexus offers the comparison

**Nexus handoffs:**

- To Sentinel: when pattern deep-dive is needed ("let me bring Sentinel in for the ambient pattern detail")
- To Atlas: when program state affects portfolio pressure ("routing the Phase 5 attestation to Atlas for Tower update")
- To Steward: when admin action needed mid-flow ("Steward needs to activate the Epic connector first")

### 4.5 · Opening prompts per sub-surface

**Programs index:**
> "You have 6 programs in flight. Two need your attention this week. Want to open one, review phase gates coming up, or start a new program?"

**Program page (Morrison Phase 3):**
> "Morrison is Phase 3. D17 is waiting for Dr. L's interview. Want to walk through the decision memo, review the intervention portfolio, or prep the interview?"

**Phase page (Morrison Phase 3):**
> "Phase 3 has 5 deliverables. D15 Intervention Portfolio and D17 Decision Memo are ready for your review. D16 Business Case needs the sensitivity analysis. Want to open one, or see what the gate check wants?"

**Deliverable page (D17 Rich):**
> "D17 is drafted with three levers, parallel-track sequencing, $4.2-6.8M capital range. The sequencing decision is the one place I'd want your input — or Marcus T.'s. Want to pressure-test the sequencing, review the supporting evidence, or regenerate with different assumptions?"

**Deliverable page (D25 Stub):**
> "D25 activates when Morrison reaches Phase 5. I can show what triggers it or queue a reminder when Phase 4 closes."

**Maestro Intake Interface:**
> "Tell me what you're trying to accomplish. I'll match it against patterns, check your tenant's readiness, and we'll go from there."
>
> (Free-text primary input with suggested prompts: "I need to optimize vendor spend" · "We're rationalizing our AI estate" · "Ambient clinical rollout" · "Something else")

### 4.6 · Current state and gaps

**Programs index:** Exists per exemplar. Partial. Status: **PARTIAL**.

**Program page:** Exists per exemplar. Partial — agent anchoring likely incomplete. Status: **PARTIAL**.

**Phase page:** Exists. Status: **PARTIAL**.

**Deliverable page Rich:** D17 as exemplar; other Rich deliverables in Agent C2-C4 authoring queue. Status: **PARTIAL**.

**Deliverable page Stub:** D25 as exemplar. Status: **PARTIAL**.

**Maestro Intake Interface:** Partial per PR history. Pressure-test structure (GO/REFINE/REDIRECT) missing. Status: **PARTIAL**.

**Nexus anchoring:** Partial. Reference implementation on program page; consistency across all Programs sub-surfaces unclear. Status: **PARTIAL**.

### 4.7 · Gaps with priority

- [P0 demo-critical] Morrison Rich deliverables completion (Agents C2-C4)
- [P0 demo-critical] Ambient Rich deliverables (Agents C5-C7)
- [P0 demo-critical] Nexus anchoring consistent across every Zone 3 surface
- [P0 demo-critical] Maestro Intake with GO/REFINE/REDIRECT
- [P0 demo-critical] Workshop-mode legibility across deliverables (typography, layout)
- [P1 seed-critical] Pause-and-resume with named reason
- [P1 seed-critical] Upload/ingest affordance (paperclip in agent conversation)
- [P1 seed-critical] Approval flow wiring (approve D17 → state advances)
- [P1 seed-critical] Outline deliverables for non-hero programs

---

## Section 5 · Zone 4 — Intelligence

### 5.1 · Purpose and posture

**Purpose:** The substrate. Not primarily a destination but the source from which agents retrieve pattern intelligence. Becomes visible when users explicitly want to browse the library.

**Primary user:** Varies. Maestros consult in-context (via agent surfacing). CXOs browse when curious. Investors evaluate for moat assessment.

**Agent posture:** Sentinel anchors when users visit. Voice: research-rigorous. Cites sources, qualifies confidence levels, uses precise language.

**Design discipline:** Agent-surfaced by default. When users do visit, the zone can show density appropriate to exploration — but the primary mode is being invoked from Zone 3 via Nexus handoff.

### 5.2 · Surfaces within Zone 4

**Intelligence library — `/intelligence`**

Grid of all patterns. Filter by vertical, archetype, capability, phase. Pattern cards with observations count, freshness, applicability.

**Pattern detail (global) — `/intelligence/patterns/[slug]`**

Full pattern page. All parts (A-Y per File 02 schema). Global view, not tenant-scoped.

**Pattern detail (tenant-scoped) — `/tenant/[slug]/intelligence/patterns/[slug]`**

Same pattern but with tenant-specific overlay. Active/Partial/Not Started per stream, programs applying the pattern, tenant-specific observations.

**Pattern search — `/intelligence/search`**

Semantic search across the library. Surfaces top matches with relevance scores.

### 5.3 · Design language

**Color:** cream canvas, teal accents. Pattern cards dignified — composite observations with clear tagging.

**Typography:** Georgia for pattern headline thesis and section titles. DM Sans for prose body. Mono for metadata (observation count, last updated, vertical badge).

**Density discipline:** medium. Pattern cards dense but readable; pattern detail pages can be long-form but organized via sticky section navigation.

**Integrity discipline:** every observation carries composite tag. Authorship disclaimer visible on every pattern page. No implication of real deployed-customer outcomes.

### 5.4 · Sentinel anchoring

Sentinel rail collapsed-narrow by default. Expands when users engage.

**Sentinel voice examples:**

- "This observation holds across three composite IDNs with MA-heavy populations. Confidence is high for MA-heavy contexts, medium for commercial-heavy. I'd qualify the claim for Meridian's payer mix."
- "The evidence for intervention 2 rests on 4 sources. Two are peer-reviewed; two are composite program observations. Stronger than average, not bulletproof."
- "Pattern was updated last Tuesday based on new observation from a composite program. The diagnostic prior on cost-side causes moved from 65% to 68% — small but directionally consistent."

**Sentinel proactive behavior:**

- On tenant-scoped pattern view, Sentinel surfaces tenant-specific applicability immediately
- On browse flow, Sentinel offers navigation help if user seems to be searching
- When user is in-context (via Nexus handoff from Zone 3), Sentinel opens with the specific question Nexus sent

**Sentinel handoffs:**

- Back to Nexus: when user's pattern exploration is done and they want to return to their program
- To Atlas: rarely; mostly just returns user to Zone 3

### 5.5 · Opening prompts per sub-surface

**Intelligence library:**
> "13 patterns live. You're on Meridian — Healthcare has 2 patterns, 8 cross-sector apply. Want to browse by problem, by vertical, or find a pattern for a specific situation?"

**Pattern detail (global, Ambient Clinical Value Chain):**
> "Ambient Clinical Value Chain is one of our deepest patterns — 6 observations, 23 evidence sources. Want the headline insight, the full value chain, or the interventions library?"

**Pattern detail (tenant-scoped, Meridian on Ambient):**
> "Meridian has this pattern partially integrated — documentation active, HCC partial, four streams not started. Want to see what Phase 1 activation would look like, or compare to a composite IDN that integrated end-to-end?"

### 5.6 · Current state and gaps

**Intelligence library:** Partial. `/preview/intelligence` shipped per PR #120. Sentinel-anchored. Status: **PARTIAL**.

**Pattern detail (global):** Partial. Ambient pattern exemplar exists. Other patterns partial. Status: **PARTIAL**.

**Pattern detail (tenant-scoped):** Partial. Per PR #108 bidirectional tracing wired. Active/Partial/Not Started overlay partial. Status: **PARTIAL**.

**Pattern search:** Status unknown, likely basic or missing. **MISSING** likely.

**Sentinel anchoring:** Partial per PR #120. Status: **PARTIAL**.

### 5.7 · Gaps with priority

- [P0 demo-critical] Sentinel anchoring across all Zone 4 surfaces
- [P0 demo-critical] Pattern detail pages (global) for the 7 P0 Tier 3 patterns at exemplar fidelity
- [P0 demo-critical] Tenant-scoped pattern detail with Active/Partial/Not Started overlay working correctly for Meridian's Ambient pattern
- [P1 seed-critical] Full pattern detail for all 13 retrofitted patterns
- [P1 seed-critical] Pattern search with semantic matching
- [P1 seed-critical] Authorship disclaimer and integrity chips enforced across all patterns
- [P2 Series A] Observation contribution flow visibility (when programs contribute back)

---

## Section 6 · Cross-zone mechanics

### 6.1 · Agent rail mutual exclusivity

When any agent rail is expanded, the document sidebar (if any) on that surface collapses. When the agent rail is collapsed, the sidebar is visible. User is either in "conversing mode" or "reading mode" — not both simultaneously.

Implementation: CSS layout class toggle. Transition animation 200ms.

### 6.2 · Cross-surface handoff

When Atlas hands to Sentinel (e.g., from a Tower pressure to a pattern detail), the target surface loads as a drawer over the source surface, not as navigation away. User dismisses drawer and returns to source with state preserved.

Drawer behavior per File on page-agent coherence (already specified in prior work, included as pre-decided):
- Drawer width 72% viewport
- 200ms slide-in, 150ms slide-out
- ESC / click-outside / close button dismisses
- URL fragment preserves shareable state
- "Open full page →" promotes drawer to navigation
- Agent rail transitions — target agent takes primary in drawer, source agent returns on dismiss

### 6.3 · Attention event protocol

Every significant UI element across all zones emits attention events to the agent context provider. Agent updates internal state silently. Proactive prompts surface on idle, complete, or explicit re-engagement — not on every focus event.

Event taxonomy pre-decided (File 06 page-agent coherence):
- `focus`, `select`, `complete`, `idle`
- Element kinds: pressure-card, deliverable-row, kpi-card, chart-point, table-row, evidence-citation, pattern-card, program-card, phase-timeline-node, nav-link, sidebar-item
- Idle threshold 5 seconds
- Hover dwell 1 second

### 6.4 · Tenant re-scope

When user switches tenants (Meridian → Apex), every surface re-scopes. All agent conversation state resets. All data queries re-run with new tenant context. Composite disclaimer reinforced visually on the new tenant surfaces.

No cross-tenant leak under any circumstance. Enforced at integration test level.

### 6.5 · Conversation state persistence

Agent conversation persists per-surface. Maya's Nexus conversation on Morrison carries across D-pages within Morrison. Maya's Atlas conversation on Tower carries across Tower sub-surfaces.

On tenant switch: all conversation state resets.
On logout: all conversation state persisted; resumes on next login.

Handoff context between agents preserved as a "pinned message" in the receiving agent's opening.

---

## Section 7 · Current state summary

Aggregate across zones:

- **Zone 1 Tower:** Partial. Control Room has POV. Sub-surfaces mostly stub. Atlas partially anchored.
- **Zone 2 Admin:** Partial/missing. User provisioning partial; rest minimal. Steward not anchored.
- **Zone 3 Programs:** Partial. Structure holds; content partial (Morrison Phase 1 done, rest in flight); Nexus anchoring partial; workflow mechanics (upload, approval, pause) missing.
- **Zone 4 Intelligence:** Partial. Preview intelligence surface shipped. Sentinel anchored partially. Pattern details partial.

**Cross-zone mechanics:**
- Mutual exclusivity: partial (drawer primitive shipped per PR #120; full wiring may be incomplete)
- Drawer over page: drawer primitive exists; wiring for cross-agent handoffs may be partial
- Attention events: unclear status
- Tenant re-scope: test exists; experiential validation incomplete
- Conversation state persistence: unclear status

---

## Section 8 · Priority sequencing

### P0 — Demo-critical

All four agents fully anchored on their respective zones with proactive prompts. Control Room and Vendor Portfolio at exemplar fidelity. Morrison and Ambient Rich deliverables complete. Nexus anchoring consistent on every Zone 3 surface. Intelligence library and P0 pattern detail pages polished. Cross-zone handoff via drawer working end-to-end. Tenant re-scope validated experientially.

### P1 — Seed-critical

Remaining Zone 1 sub-surfaces (Shadow AI, Regulatory, Council, Models). Zone 2 Admin complete (users, connectors, entitlements, audit). Outline deliverables for non-hero programs. Remaining pattern retrofits to structured format. Steward anchoring on Admin. Upload/ingest in Programs. Pause-and-resume. Approval flow end-to-end.

### P2 — Series A

Billing/usage. Advanced audit. Observation contribution visibility. Pattern search enhancements. Workshop-mode interaction design beyond basic legibility.

---

## Section 9 · Acceptance criteria

**Per-zone anchoring:**
- Each zone has its agent fully anchored (collapsed rail always visible, expanded rail on click, proactive prompts appropriate to zone)
- Agent voice consistent across all surfaces within a zone
- Opening prompts specific to the sub-surface content

**Per-zone design discipline:**
- Zone 1 earned density; every element editorial and action-oriented
- Zone 2 organized feature-richness; standard SaaS admin patterns
- Zone 3 ruthless minimalism; every element serves the conversation
- Zone 4 substrate-primary; agent-surfaced; browsable when invited

**Cross-zone mechanics:**
- Drawer-over-page on all cross-agent handoffs
- Mutual exclusivity between agent rail and document sidebar
- Attention events emit across all meaningful UI elements
- Tenant re-scope preserves no leak
- Conversation state persistence per-surface

**Integrity:**
- Composite disclaimer on every tenant surface
- Demo-rendering disclaimer on every Rich deliverable
- Authorship disclaimer on every pattern page

---

## Section 10 · One-line handoff

> Four zones, four agents, four design disciplines. Tower earned density with Atlas. Admin organized features with Steward. Programs ruthless minimalism with Nexus. Intelligence agent-surfaced substrate with Sentinel. Cross-zone mechanics via drawer-over-page, mutual exclusivity, attention events, tenant re-scope. P0 demo-critical across zones specified. Apply autonomy charter.

---

*End of File 04 · Four-Zone Surface Design Backlog.*
