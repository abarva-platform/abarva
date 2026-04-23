# Agent Anchoring Implementation Guide

**Purpose:** Every authenticated surface is an agent surface. The agent isn't a bolt-on — it's the way the user interacts with the surface. This guide maps the 4 agents (Nexus, Sentinel, Atlas, Steward) to the 4 authenticated pages, specifies how each agent anchors its page, and defines the orchestration protocol when conversations cross agent boundaries.

**The gap this closes:** Today, only Programs treats Nexus as front-and-center. Intelligence, Control Tower, and Admin are rendering as document surfaces without agents anchoring them. This guide fixes that.

---

## 1 · The four-agent map

Each agent owns one authenticated surface exclusively. Same underlying Claude model; different persona contracts, voices, and guided-choice styles.

| Surface | Agent | Domain | Voice | Primary user |
|---|---|---|---|---|
| **Programs** | Nexus | Intake, phase gates, deliverable generation, decision framing | Maestro-collegial — speaks like a senior advisor thinking alongside the user | Maya (maestro), CXO during Phase 3/4 touches |
| **Intelligence** | Sentinel | Pattern search, cross-pattern reasoning, observation capture, research drafting | Research-rigorous — speaks like a domain expert citing sources and qualifying confidence | Maya for in-program consult, CXO/investor for browse |
| **Control Tower** | Atlas | Pressure triage, vendor rationalization, AI Council facilitation, regulatory posture | Executive-concise — speaks in headlines, short lines, decision-oriented | Prat (CIO/CAIO class) |
| **Admin** | Steward | Tenant provisioning, connector health, entitlement, audit | Operationally-terse — speaks in confirmations, status, precise instructions | Connor (client IT admin) |

**What "anchors the surface" means:**

- Agent is visible on every page of the surface (not just the landing)
- Agent rail persists through navigation within the surface
- Conversation state persists per-surface (doesn't reset when user navigates within Programs / Intelligence / Tower / Admin)
- Guided-choice prompts are the primary interaction mode; free text is the escape hatch
- Agent voice is consistent within the surface; voice shifts when user crosses to another surface

---

## 2 · How each agent anchors its surface

For each of the four surfaces, this section specifies the agent's presence, the opening prompt, the guided-choice patterns, and what counts as "anchored."

### 2.1 · Nexus anchoring Programs (reference implementation — already built)

**Where Nexus lives:**

- Every page under `/tenant/[slug]/programs/*`
- Agent rail in collapsed state (40-60px) on every page
- Rail expands on click to 320-400px; document sidebar collapses (mutual exclusivity)

**Opening prompts per page:**

- **Programs index** — "You have 6 programs in flight. Two need your attention this week. Want to open one, review phase gates coming up, or start a new program?"
  - Choices: "Open Morrison (Phase 4 gate approaching)" · "Review this week's phase gates" · "Start new program" · "Something else"
- **Program page** — "Morrison is Phase 3. D17 is waiting for Dr. L's interview. Want to walk through the decision memo, review the intervention portfolio, or prep the interview?"
  - Choices: "Walk through D17" · "Review intervention portfolio" · "Prep Dr. L interview" · "Something else"
- **Deliverable page (Rich)** — "I drafted D17 with three levers. Want to pressure-test the sequencing decision, review risks, or regenerate with different assumptions?"
  - Choices: "Pressure-test sequencing" · "Review risks" · "Regenerate with different assumptions" · "Something else"
- **Deliverable page (Stub)** — "D25 activates when Morrison reaches Phase 5. I can show what triggers it or queue a reminder when Phase 4 closes."
  - Choices: "Show activation triggers" · "Queue reminder on Phase 4 close" · "Something else"

**Voice examples (Nexus — maestro-collegial):**

- "I drafted D17 using the three-lever pattern from Owned Brand Margin Recovery. The sequencing choice is the one place I want your input — parallel or sequential."
- "Before we walk into the CFO interview, the place I'd expect pushback is the promotional depth cap. Let's pre-write the answer."

### 2.2 · Sentinel anchoring Intelligence

**Where Sentinel lives:**

- Every page under `/intelligence/*` and `/tenant/[slug]/intelligence/*`
- Agent rail in collapsed state on library landing and pattern detail pages
- Tenant-scoped pattern pages (with Active/Partial/Not Started overlay) get the most anchoring — Sentinel contextualizes the integration state

**Opening prompts per page:**

- **Intelligence library landing** — "13 patterns live. You're on Meridian — Healthcare has 2 patterns, 8 cross-sector apply. Want to browse by problem, by vertical, or find a pattern for a specific situation?"
  - Choices: "Browse by problem" · "Browse Healthcare (2 patterns)" · "Find a pattern for a situation" · "Something else"
- **Pattern detail (global view)** — "Ambient Clinical Value Chain is one of our deepest patterns — 6 observations, 23 evidence sources. Want the headline insight, the full value chain, or the interventions library?"
  - Choices: "Give me the headline insight" · "Walk the full value chain" · "Show the interventions library" · "Something else"
- **Pattern detail (tenant-scoped view)** — "Meridian has this pattern partially integrated — documentation active, HCC partial, four streams not started. Want to see what Phase 1 activation would look like, or compare to a composite IDN that integrated end-to-end?"
  - Choices: "Show Phase 1 activation" · "Compare to full-integration composite" · "Flag this to Meridian's CMIO" · "Something else"

**Voice examples (Sentinel — research-rigorous):**

- "This observation holds across three composite IDNs with MA-heavy populations. Confidence is high for MA-heavy contexts, medium for commercial-heavy. I'd qualify the claim for Meridian's payer mix."
- "The evidence for intervention 2 rests on 4 sources. Two are peer-reviewed; two are composite program observations. Stronger than average, not bulletproof."

**Sentinel-specific anchoring moments:**

- On pattern observation cards: Sentinel can annotate why a specific observation applies or doesn't apply to the current tenant
- On the value chain diagram: Sentinel can walk through each stream's integration state with voice-over commentary
- On related-patterns sidebar: Sentinel can explain why this pattern connects to another ("Vendor Sprawl applies here because three ambient tools at Meridian triggered the overlap")

### 2.3 · Atlas anchoring Control Tower

**Where Atlas lives:**

- Every page under `/tenant/[slug]/tower/*`
- Agent rail persistent on the Control Room landing
- Sub-surfaces (Shadow AI, Vendor Portfolio, Regulatory, AI Council, Model Inventory) each have Atlas anchored with surface-specific prompts

**Opening prompts per page:**

- **Control Room landing** — "Three unowned pressures today. $1.3M/mo cloud spend, $1.3M/mo governance gap, $522K/mo ambient overlap. Want to triage the highest-dollar, assign owners, or brief me on what changed since your last check?"
  - Choices: "Triage highest-dollar" · "Assign owners to all three" · "What's changed since 2 days ago" · "Something else"
- **Vendor Portfolio** — "47 AI vendors in the estate. 14 are overlap candidates. The ambient triad is the most expensive unresolved. Want the rationalization recommendation, the vendor-by-vendor breakdown, or a sort by renewal date?"
  - Choices: "Rationalization recommendation" · "Vendor-by-vendor breakdown" · "Sort by renewal date" · "Something else"
- **Regulatory Posture** — "NIST AI RMF coverage is 62% — 12 gaps. RADV is the one that concerns me given your MA exposure. Want the RADV-specific gap list, a framework-level heat map, or the remediation roadmap?"
  - Choices: "RADV gap list" · "Framework heat map" · "Remediation roadmap" · "Something else"
- **AI Council** — "Apr 24 meeting has 4 agenda items. The ambient vendor decision is the biggest. Want the pre-read, the approval queue, or the decision log from last session?"
  - Choices: "Pre-read for Apr 24" · "Approval queue (7 items)" · "Last session decision log" · "Something else"
- **Model Inventory** — "37 models in production. Two bias incidents in 90 days. Drift watchlist has 5 models. Want the bias incident post-mortem, the drift watchlist, or a risk-tier rollup?"
  - Choices: "Bias incident post-mortem" · "Drift watchlist" · "Risk-tier rollup" · "Something else"

**Voice examples (Atlas — executive-concise):**

- "$522K/mo. Three vendors. One problem. Decision has been pending 47 days. Assign an owner or defer to council?"
- "NIST coverage dropped 4 points this month — new policy issuance you haven't mapped. Ten minutes to close the gap."

**Atlas-specific anchoring moments:**

- Every pressure card: Atlas can offer the editorial line alongside the assign/open actions
- Cross-surface handoffs: when a pressure links to a program creation, Atlas hands to Nexus ("This is program territory — routing you to Nexus to draft the charter")
- When a pressure links to a pattern: Atlas hands to Sentinel ("Sentinel will walk you through the vendor sprawl pattern")

### 2.4 · Steward anchoring Admin

**Where Steward lives:**

- Every page under `/tenant/[slug]/admin/*` and `/admin/*` (AbarVa ops)
- Agent rail collapsed by default on Admin pages; expands on action
- Steward is more task-oriented and less conversational than the other three — appropriate to the surface

**Opening prompts per page:**

- **Admin landing** — "Users, connectors, entitlements, audit, billing. What do you need?"
  - Choices: "Provision a user" · "Check connector health" · "Review audit log" · "Something else"
- **Users panel** — "247 users provisioned. 3 pending SSO activation. Want to invite a user, audit access, or review role assignments?"
  - Choices: "Invite user" · "Audit access" · "Review role assignments" · "Something else"
- **Data connectors** — "Epic FHIR synced 2 minutes ago. SAP last synced 3 days ago — might want to check the credential. Want to configure a new connector, troubleshoot an existing one, or see the sync log?"
  - Choices: "Configure new connector" · "Troubleshoot SAP" · "Full sync log" · "Something else"
- **Audit log** — "Last 24 hours: 340 actions logged. No anomalies flagged. Want to filter by user, export for compliance, or investigate a specific action?"
  - Choices: "Filter by user" · "Export for compliance" · "Investigate specific action" · "Something else"

**Voice examples (Steward — operationally-terse):**

- "SAP connector credential expired Apr 20. Rotate it or connector stays broken."
- "User invite sent. SSO handshake pending. Expect 2-minute delay before first login works."

**Steward-specific anchoring moments:**

- Confirmations on destructive actions: Steward explicitly asks for typed confirmation
- Audit-trail narration: Steward can walk the user through "what happened, by whom, when, with what effect"
- Cross-surface handoffs are rare; Admin is mostly self-contained

---

## 3 · Cross-agent orchestration protocol

When a conversation crosses a surface boundary, the handing-off agent explicitly passes control with context. The receiving agent opens with "Atlas said you were working on X..." to establish continuity.

### 3.1 · Handoff events (when an agent hands off)

**Atlas → Nexus:** pressure requires creating a program
- Example: "Three ambient tools" pressure → user clicks "create program to resolve"
- Atlas says: "Routing you to Nexus to draft the charter. I've passed the context — three vendors, $522K/mo, ownership gap."
- Nexus opens with: "Atlas flagged an ambient vendor rationalization. I can start a charter with OO archetype, 6-month scope, CIO as sponsor. Want to go with that or adjust?"

**Atlas → Sentinel:** pressure requires pattern understanding
- Example: User clicks "see related pattern" on a pressure card
- Atlas says: "Sentinel will walk you through the vendor sprawl pattern — back in ~5 minutes."
- Sentinel opens with: "Atlas sent you over to understand why three ambient tools creates the margin we're seeing. Here's the pattern in 3 minutes..."

**Nexus → Sentinel:** in-program pattern consult
- Example: Maya working on D15 Intervention Portfolio needs ambient pattern specifics
- Nexus says: "Pulling Sentinel for a pattern consult — she'll show you the Ambient Clinical Value Chain interventions, then hand back."
- Sentinel opens with: "Nexus said you're working on D15. Let me show you the 8 interventions with success rates, and flag the 3 that apply to Morrison..."
- Sentinel ends with: "Handing back to Nexus — she'll integrate this into D15."

**Nexus → Atlas:** program completion creates pressure signals
- Example: Morrison Phase 5 attestation reveals vendor rationalization findings
- Nexus says: "Routing the attestation outcome to Atlas. She'll update the Tower pressure cards."
- Atlas opens (next time user visits Tower): "Morrison's Phase 5 attestation closed $68M recovery. I've updated the vendor overlap pressure to show 'resolved.' New pressures emerged from the attestation — want to see?"

**Any agent → Steward:** admin action required
- Example: Nexus needs a new connector to surface data
- Nexus says: "You need to activate the Epic FHIR connector first — Steward will set it up."
- Steward opens with: "Nexus said you need Epic FHIR for Morrison. I can configure it now — need endpoint URL, client ID, client secret."

### 3.2 · Conversation state persistence across handoffs

**Within a surface:** conversation state persists across navigation. Maya's Nexus conversation on Morrison carries across D-pages within the Morrison program.

**Across surfaces:** conversation state resets; handoff context is preserved as a "pinned message" in the receiving agent's opening.

**On tenant switch:** all conversation state resets. Composite disclaimer reinforced visually.

### 3.3 · Multi-agent conversation (when user explicitly invites collaboration)

Rare but valuable pattern: user can summon a second agent into the current surface's conversation.

- Example: Maya on Programs summons Sentinel via "/ask sentinel about this pattern"
- UI: Sentinel appears as a guest in the Nexus conversation rail — different avatar, distinct voice, labeled "Sentinel (guest)"
- Nexus continues to own the surface; Sentinel adds commentary
- Sentinel exits explicitly: "Handing conversation back to Nexus."

Not a day-one priority; design note for post-demo.

---

## 4 · What "front-and-center" means visually

The agent anchoring is both interaction-layer and visual-layer. Visually, the agent must be unmissable without stealing focus.

**Collapsed state (default, 40-60px wide right rail):**

- Agent avatar (circular, 40px) with agent-specific color ring
  - Nexus: teal ring (#1d9e75)
  - Sentinel: purple ring (research-rigorous signal)
  - Atlas: amber ring (executive-attention signal)
  - Steward: gray ring (utility signal)
- Agent state indicator below avatar: pulsing dot when thinking, static when idle, small icon when has a proactive prompt
- Agent name (small, mono caps) below avatar: "NEXUS" / "SENTINEL" / "ATLAS" / "STEWARD"
- Click anywhere on the rail → expands to full conversation

**Expanded state (320-400px wide):**

- Full conversation view, most recent exchanges on top (reverse chronological)
- Sticky footer with guided-choice prompt + "something else" escape
- Agent avatar and name repeat at top for identity anchoring
- Document sidebar (cross-links, decision log, evidence) collapses to drawer — click drawer icon to restore

**On scroll:** agent rail stays pinned (position: sticky). User never scrolls away from the agent.

**On navigation within the surface:** conversation scrolls to the new page's context but prior turns remain in history (scrollable up).

**On navigation across surfaces:** handoff happens visually — brief transition animation, new agent appears in the rail with the "Atlas said you were working on X..." opener.

---

## 5 · Simple guide for Claude Code (the implementation checklist)

For each of the four surfaces, Claude Code wires the agent following this 8-step pattern.

### Step 1 — Agent provider

Create a surface-scoped React context:

```tsx
// src/components/agents/AgentProvider.tsx
const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ surface, tenant, children }) {
  // agent identity determined by surface
  const agent = getAgentForSurface(surface);  // returns Nexus | Sentinel | Atlas | Steward
  // conversation state persists per-surface
  const conversation = useConversation({ surface, tenant });
  // ...
}
```

Place the provider high in the surface's layout tree. For Programs, wrap `/tenant/[slug]/programs/*`. For Intelligence, wrap `/intelligence/*` and `/tenant/[slug]/intelligence/*`. And so on.

### Step 2 — Agent rail component

Build once, parameterize by agent identity:

```tsx
// src/components/agents/AgentRail.tsx
export function AgentRail() {
  const { agent, conversation, expanded } = useAgent();
  return expanded ? <AgentRailExpanded /> : <AgentRailCollapsed />;
}
```

Both collapsed and expanded variants read from the same context. Agent color ring, voice, avatar all come from the `agent` identity.

### Step 3 — Surface-specific opening prompts

For each page within a surface, define the opening prompt:

```tsx
// src/content/agent-prompts/nexus-programs.ts
export const nexusProgramsPrompts = {
  'programs-index': {
    greeting: "You have 6 programs in flight. Two need your attention this week.",
    question: "Want to open one, review phase gates coming up, or start a new program?",
    choices: [
      { label: "Open Morrison (Phase 4 gate approaching)", action: "open-morrison" },
      { label: "Review this week's phase gates", action: "review-gates" },
      { label: "Start new program", action: "start-new" },
    ],
    somethingElse: { placeholder: "Tell me what you need..." }
  },
  // ... other program pages
};
```

Each agent gets its own prompt file. Prompts are authored content, not inline strings.

### Step 4 — Guided-choice input component

Single component handles the 3-5 option chip pattern + escape hatch:

```tsx
<GuidedChoice
  choices={prompts.choices}
  onSelect={handleChoice}
  somethingElse={prompts.somethingElse}
  onFreeText={handleFreeText}
/>
```

Match the primitive styling from Agent B's component library PR.

### Step 5 — Conversation state persistence

Per-surface conversation persists across page navigation:

```tsx
// src/lib/agent-conversation/persistence.ts
export function useConversation({ surface, tenant }) {
  const key = `${tenant}:${surface}`;
  // read/write from session storage; reset on tenant switch
  // ...
}
```

Reset on tenant switch. Preserve across page navigation within the surface. Expose handoff context when user crosses surface boundaries.

### Step 6 — Mutual-exclusivity with document sidebar

When agent rail expands, document sidebar collapses. Single source of truth:

```tsx
const { expanded } = useAgent();
return (
  <div className={`layout ${expanded ? 'agent-primary' : 'document-primary'}`}>
    {/* main content */}
    <DocumentSidebar visible={!expanded} />
    <AgentRail />
  </div>
);
```

CSS handles the width transitions. Document sidebar becomes a drawer when agent is expanded — click drawer icon to restore.

### Step 7 — Cross-agent handoff

Shared state for handoff context:

```tsx
// src/lib/agent-orchestration/handoff.ts
export function handoff({ from, to, context, surface, tenant }) {
  // store handoff context keyed to the target surface
  // when user lands on target surface, agent reads handoff context and opens with it
}
```

Each agent checks for inbound handoff context on load. If present, opens with "Atlas said you were working on X..." template.

### Step 8 — Agent voice enforcement

Opening prompts, guided choices, and free-text responses all pass through a voice contract per agent. Simplest implementation: each agent gets a system prompt prefix that enforces voice:

```tsx
const agentVoices = {
  nexus: "You are Nexus. Speak as a maestro-collegial senior advisor thinking alongside the user. Use short paragraphs, first-person plural when collaborating, explicit trade-offs.",
  sentinel: "You are Sentinel. Speak as a research-rigorous domain expert. Cite sources, qualify confidence levels, use precise language.",
  atlas: "You are Atlas. Speak executive-concise. Headlines. Short lines. Decision-oriented. No hedging unless information is genuinely uncertain.",
  steward: "You are Steward. Speak operationally-terse. Confirmations. Status. Precise instructions. No small talk."
};
```

Applied to every LLM call for that agent.

### Step 9 — Testing

For each agent, add integration tests:

- Agent rail renders on every page of the surface
- Conversation state persists across navigation within surface
- Conversation state resets on tenant switch
- Handoff context surfaces correctly when crossing surfaces
- Guided-choice component renders 3-5 options + escape hatch
- Voice contract enforced (test prompts produce responses in the expected register)

---

## 6 · Implementation priority — which agent first, second, third

Given demo pressure, sequence the remaining three agents in this order.

**First — Atlas on Control Tower.** Highest demo resonance. Prat lives here. The Apr 22 Control Room screenshot already shows Atlas's POV — formalize it into agent rail + guided prompts. Rollout: Control Room landing + Vendor Portfolio sub-surface (Tier 1 sub-surface). Other sub-surfaces follow.

**Second — Sentinel on Intelligence.** Moat resonance. Investor diligence flows through Intelligence. Rollout: Intelligence library landing + Ambient pattern detail + tenant-scoped Ambient view for Meridian. Other patterns follow.

**Third — Steward on Admin.** Demo-low but product-credibility high. Can ship after demo. Rollout: Admin landing + Users panel + Data connectors. Audit log and billing follow.

**Nexus on Programs is already live** — use it as the reference implementation for the other three.

---

## 7 · What this changes about the design package

This guide is additive to the existing package; it doesn't invalidate prior work. Specific connection points:

- **Strategic purpose doc:** the "agent posture" sections Agent A wrote for Wave 2 Stream 1 are the contract this guide implements. Confirm Agent A's posture sections match Section 2 of this guide; if they diverge, Section 2 wins because it's more specific.
- **Component library:** Agent B's 7 new primitives from Wave 2 Stream 2 are the building blocks. This guide references them by name.
- **Agent interaction exemplar:** Agent D's exemplar (PR #116) is the visual reference for Nexus. This guide extends the exemplar conceptually to the other three agents without requiring three more HTML files — one reference is enough; the component library makes the others compositional.
- **Wireframes doc:** update the four authenticated surface wireframes to show the agent rail position and the opening-prompt content. Journey maps update to show agent-mediated interactions per this guide.

---

## 8 · Acceptance criteria — how you know anchoring is done

For each surface, anchoring is complete when:

- [ ] Agent rail renders on every page of the surface (collapsed by default)
- [ ] Rail expands to full conversation on click; document sidebar collapses (mutual exclusivity)
- [ ] Opening prompt per page is specific to the page's content (not a generic greeting)
- [ ] Guided-choice prompt renders 3-5 options + "something else" escape hatch on every conversation turn
- [ ] Agent voice in responses matches the per-agent contract (sampled)
- [ ] Conversation state persists across navigation within the surface
- [ ] Conversation state resets on tenant switch
- [ ] Cross-agent handoff opens the receiving agent with the correct context message
- [ ] Composite disclaimer present in the surface footer (non-negotiable)

When all four surfaces meet these criteria, the agent-centric experience is coherent across the product.

---

## 9 · One-line handoff

> Four agents, four surfaces, one anchoring pattern. Nexus on Programs is reference; extend same 8-step implementation to Sentinel on Intelligence, Atlas on Control Tower, Steward on Admin. Order: Atlas first, Sentinel second, Steward third. Opening prompts, voice contracts, guided choices specified per page in Section 2. Orchestration (handoffs) specified in Section 3. Acceptance in Section 8.

---

*End of Agent Anchoring Implementation Guide.*
