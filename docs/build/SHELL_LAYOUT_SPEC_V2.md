# AbarVa Shell Layout Spec v2 · Hybrid Atlas + Stage-Aware Working Pane

**Version:** 2.0 · April 28 2026
**Supersedes:** Original shell-tokens spec (`src/lib/shell/shell-tokens.ts` + accompanying mockup catalog) — that spec assumed one shape per surface and one chat-overlay pattern, which produces the "two Atlases" bug visible in the running app.
**Status:** Locked direction, ready for build wave decomposition
**Authoring context:** Resolves the layout ambiguity surfaced in the April 28 review screenshot showing Atlas synthesis in the navy column AND a chat overlay at the bottom, with the chat overlay claiming no tenant context despite the shell rendering "Apex Retail Group · LOCKED" two pixels above it.

---

## §1 · The problem this spec exists to solve

The April 28 production screenshot exposed three coupled issues:

**Issue 1 · Two Atlases on one surface.** The navy AgentColumn renders Atlas's static synthesis ("3 active pressures, AI Cloud Spend 33% over budget…"). When the user clicks "Ask Atlas," a chat overlay opens at the bottom with a *separate* Atlas instance that has none of the synthesis context. Same agent name, two surfaces, no shared state. The user's mental model is "Atlas is the agent for this page"; the implementation presents Atlas as two unrelated windows.

**Issue 2 · Static text where conversation should be.** The synthesis is read-only prose. The user can act on suggestions A/B/C but cannot ask Atlas to expand on what it just said without going to the separate chat overlay — which loses all context. The natural conversational continuation ("tell me more about the AI Cloud Spend recovery") requires switching surfaces.

**Issue 3 · Right-pane shape is fixed when the work shape varies.** Tower's right pane shows pressure cards, which is correct *for Tower*. Programs detail at P3 Design needs to show architecture artifacts; at P5 Activate it needs runbook checklists; at P6 Operate it needs KPI panels. The current shell renders the same right-pane shape regardless of workflow stage. The work the user is doing is hidden behind a generic container.

These three issues are root-cause-shared: **the shell treats Atlas, the working pane, and the workflow stage as three independent variables when they are actually coupled.** Atlas's voice depends on what the user is doing (stage). The working pane shape depends on what the user is doing (stage). The chat surface depends on whether the user is consulting the agent or doing focused work (mode). One spec resolves all three.

---

## §2 · The layout decision · hybrid by surface

Every surface in the page catalog is tagged with one of two layout modes. The mode is canonical — assigned in the catalog, not negotiated per-render.

### §2.1 · Mode A · agent-primary (Option A)

**Structure:**
- Icon rail (76px, unchanged)
- Top bar (48px, unchanged)
- Middle strip (44px, unchanged) — tenant + page title
- **Two-pane body:** navy AgentColumn (480px) on the left + working pane (remaining width) on the right

**The AgentColumn is the chat.** Synthesis renders as the pinned top section of the column. Chat thread scrolls below. Input affordance sits at the bottom of the column, always visible.

**No bottom overlay. No popup. No second Atlas surface anywhere.**

**When to use Mode A — the agent's analysis IS the work product:**
- Tower / Control Tower (monitoring across programs)
- Intelligence index pages (pattern browsing, signal review)
- Intelligence detail pages (pattern detail, contradiction view)
- Home (cross-tenant overview, daily digest)
- Setup overview (tenant configuration meta-view)

These are surfaces where the user came to *understand something*, and Atlas's synthesis of that understanding is the primary value. The working pane shows the artifacts (pressures, patterns, signals) that ground the synthesis. The synthesis and the artifacts are co-equal.

### §2.2 · Mode B · work-primary (Option B)

**Structure:**
- Icon rail (unchanged)
- Top bar (unchanged) with "Ask Atlas" button on the right
- Middle strip (unchanged)
- **Full-width working pane** with:
  - Thin synthesis ribbon at the top (32px tall, single line, never expands)
  - Stage-aware working artifact below

**Atlas chat is summonable.** Click "Ask Atlas" in the top-bar (or hit ⌘K). A navy drawer slides in from the right (320-360px wide). The first turn of the chat is the *expanded* synthesis — same voice, same content as the ribbon, just unfolded with full reasoning. Conversation appends below. Drawer is dismissable; on dismiss, working pane returns to full width and the ribbon stays.

**When to use Mode B — focused work where the agent is consulted, not constantly present:**
- Programs detail (all six phases — P1 through P6)
- Source events detail (all seven stages — S1 through S7)
- Setup admin pages (user management, tenant config edit, integration setup)

These are surfaces where the user came to *do something specific*, and Atlas is a consultant they invoke when stuck. The work needs full real estate; the agent is one keypress away.

### §2.3 · Surfaces that have neither mode

- Programs index, Source index, Intelligence index *root* pages: list views, no chat surface by default. ⌘K palette opens an Atlas thread if needed.
- Setup admin sub-pages used rarely (audit log, billing, etc.): same — no chat by default.

This isn't a third mode; it's the absence of either. Lists don't need an agent because there's no synthesis to do — just rows.

### §2.4 · Why hybrid not pure

Pure Option A everywhere makes the agent oppressive on focused-work surfaces. Building an architecture diagram in Programs P3 with a 480px navy chat column eating the left third of the screen makes the artifact pane cramped and the agent loud when you don't need it.

Pure Option B everywhere makes the agent feel like an afterthought on monitoring surfaces. Tower with the synthesis as a one-line ribbon and chat hidden behind a button defeats the entire premise of "AbarVa is an agent-mediated platform." The agent becomes a chatbot bolted onto a dashboard.

Hybrid honors that **monitoring and doing are different cognitive modes**, and the shell should reflect that.

---

## §3 · Synthesis behavior · the recommendation explained

**Mode A uses Behavior Y (synthesis pinned, chat scrolls below).**
**Mode B uses Behavior X (synthesis becomes turn 1 of the chat thread).**

This is not arbitrary. Walking through why:

### §3.1 · Why Behavior Y on Mode A

In Mode A the AgentColumn is permanent. The synthesis lives there as the pinned top section. After 10 turns of chat, the synthesis is still visible at the top — the user always sees "what this page is showing right now" while the conversation evolves below.

The cost is ~96-120px of vertical space permanently allocated to the pin. On a 480px-wide column at standard viewport heights, that's affordable. The synthesis is information-dense — three sentences, a sub-line of context, four suggested actions — and it earns its real estate by being permanently consultable.

If we used Behavior X here, after 10 turns the synthesis scrolls off the top. The user is now mid-conversation with no easy reminder of why they started talking to Atlas. They can scroll up, but that breaks the conversational flow. Worse, on page reload the chat history resets but the synthesis regenerates — meaning Behavior X with state persistence creates a weird condition where "turn 1" is sometimes the synthesis and sometimes a stale message from yesterday.

Pinning side-steps both problems. The synthesis is a *property of the page*, not a turn in the conversation.

### §3.2 · Why Behavior X on Mode B

In Mode B the chat is a drawer that gets dismissed. Pinning the synthesis inside the drawer would mean: open drawer, see pin + chat. Close drawer, the pin disappears with it. The pin's whole job is *persistence*, and a drawer's whole job is *dismissability*. They are incompatible.

The alternative — pin the synthesis somewhere outside the drawer (in the ribbon, say) and put chat in the drawer — recreates the two-surfaces problem. Now we have a synthesis ribbon and a chat drawer with separate state, and the user wonders why asking the chat to "expand on what you just said" doesn't work.

The clean resolution is: the ribbon is the *teaser*. One line. Always visible. When the user opens the drawer, the first turn of the chat is the *full synthesis* — same voice, same content as the ribbon would have shown if expanded, but in the conversational format. From there the chat continues normally. The user's mental model is "the ribbon is a preview of the conversation I haven't started yet; opening the drawer shows me the conversation."

This is the cleanest possible Mode B because **there is exactly one Atlas surface in Mode B (the drawer, which is also the synthesis when first opened)**. The ribbon is just a cached preview of the drawer's first turn.

### §3.3 · The contract

In both modes, **there is exactly one Atlas state object per page.** The synthesis renders from that state. The chat thread renders from that state. The state includes the tenant, the surface, the stage (if applicable), the workflow context, and the conversation history. Atlas always knows what page it's on, what tenant is locked, and what the user has asked previously. **The "Atlas doesn't know Apex" bug is structurally impossible under this contract because the chat surface and the synthesis surface read from the same state.**

The implementation detail (how the state is stored, whether it's React Context or a Zustand store or whatever) is downstream. The architectural commitment is one-state-per-page.

---

## §4 · The stage-aware working pane

Stage-awareness is the second locked decision. Every workflow surface declares what the working pane shows at each stage.

### §4.1 · The contract

Each surface defines a `WorkingPaneShape` per stage with three fields:

```ts
type WorkingPaneShape = {
  primaryArtifact: ArtifactComponent;     // dominant content (~70% of working pane vertical)
  secondaryArtifact?: ArtifactComponent;  // optional supporting context (~25%)
  stageTransitionAffordance: TransitionShape; // how user advances or signals stage completion
};
```

`ArtifactComponent` is a React component declared in the surface module. `TransitionShape` is a small footer component (gate review, sign-off, advance-to-next-phase, etc.) — small, consistent, lives at the bottom of the working pane.

### §4.2 · Programs detail · six stages

| Stage | Primary artifact | Secondary | Transition |
|---|---|---|---|
| **P1 Discovery** | Discovery brief (open questions, hypotheses, gaps) | Linked source events | "Synthesize" gate (advance to P2) |
| **P2 Synthesis** | Synthesized inputs panel (decisions taken, inputs reconciled, contradictions flagged) | Open contradictions list | "Begin design" gate |
| **P3 Design** | Architecture artifacts board (design sprint cards, decision matrices) | Pattern chips applicable to this design | "Build readiness" gate (5 criteria) |
| **P4 Build** | Build wave list with smoke test status, verification status, PR list | Active blockers | "Activate readiness" gate |
| **P5 Activate** | Activation runbook checklist, go/no-go review, sponsor sign-off | Linked vendor decisions, dependent programs | "Operate" gate |
| **P6 Operate** | KPI panel (program metrics, drift signals, attribution analysis) | Atlas voice on outcome variance | "Close program" or "Re-design" |

This is six distinct working-pane shapes for Programs detail. The current single page becomes six.

### §4.3 · Source events detail · seven stages

| Stage | Primary artifact | Secondary | Transition |
|---|---|---|---|
| **S1 Intake** | Intake form (event description, scope, sponsor, target outcome) | Similar prior events | "Move to RFI" |
| **S2 RFI** | RFI question editor + responses received from candidates | Vendor longlist | "Cut to shortlist" |
| **S3 RFP** | RFP question editor + structured responses | Shortlist with status | "Move to evaluation" |
| **S4 Evaluation** | Vendor scorecards + evaluation matrix (weighted criteria, blind scoring) | Calibration session notes | "Schedule BAFO" |
| **S5 BAFO** | BAFO board (best-and-final offers, side-by-side comparison) | Leverage analysis | "Award decision" |
| **S6 Negotiation** | Term sheet + open negotiation items + counterparty positions | Risk register | "Award" |
| **S7 Award** | Award decision document, signature block, contract artifacts | Implementation handoff | "Activate" (links to a Program) |

Seven distinct shapes for Source events detail.

### §4.4 · Other surfaces

**Tower** doesn't have stages in the same sense — it's a monitoring surface. Working pane shape is fixed: pressures (top), cross-program activity (bottom). Stage-awareness applies *only* to surfaces with workflow phases.

**Intelligence detail pages** (pattern, signal, contradiction) have lifecycle states (draft, validated, authoritative, deprecated for patterns). These could be stage-aware in v2, but for v1 they're fixed-shape — the artifact is the typed primitive itself, lifecycle just affects metadata display.

**Setup pages** are admin/configuration. No stages. Fixed shapes.

### §4.5 · Why this contract works

The contract gives Codex a deterministic build pattern. To implement stage-awareness for Programs detail, the agent:

1. Reads the surface module's `stages` declaration
2. For each stage, generates the WorkingPaneShape component bundle (primary + secondary + transition)
3. Renders by reading the program's current stage from the program fixture
4. Stage transitions update the fixture; the shape re-renders

No bespoke logic per surface. The shape declarations live in the surface module (`src/lib/programs/working-pane-shapes.ts` etc). The shell just reads `surface.workingPaneShape(stage)` and renders.

### §4.6 · What this means for fixtures

Each program in `programs-fixture.ts` already has a `phase` field. Each source event has a `stage` field. The fixtures are already stage-aware in their data model — what's missing is the **rendering** is currently stage-blind. This spec doesn't change the data model; it changes the rendering layer to read what's already there.

---

## §5 · Page catalog migration

The current catalog has 78 entries assuming one shape per surface. Stage-awareness expands this. The exact migration:

### §5.1 · Entries that split

| Current entry | Splits into | Reason |
|---|---|---|
| `PRG-DTL-MAIN` | `PRG-DTL-P1`, `PRG-DTL-P2`, `PRG-DTL-P3`, `PRG-DTL-P4`, `PRG-DTL-P5`, `PRG-DTL-P6` | Six phase shapes |
| `SRC-EVT-MAIN` | `SRC-EVT-S1` through `SRC-EVT-S7` | Seven stage shapes |

That's `1 + 1 = 2` entries becoming `6 + 7 = 13` entries. **Net add: +11 entries.**

### §5.2 · Entries that retire

| Current entry | Why retired | Replaced by |
|---|---|---|
| `CMP-AGENT-COL` (the static-text AgentColumn) | Replaced by full chat surface | New: `CMP-ATLAS-COLUMN` |
| `CMP-CHAT-OVERLAY` (the bottom popup) | Eliminated entirely | nothing — Mode A integrates, Mode B uses drawer |

**Net retire: -2 entries. Add 2 replacement entries (`CMP-ATLAS-COLUMN`, `CMP-ATLAS-DRAWER`). Net 0 from this row.**

### §5.3 · Entries that gain a mode tag

Every existing surface entry gains a `layoutMode: 'A' | 'B' | 'none'` tag. This is metadata only, no new pages, but every catalog entry needs an audit pass.

### §5.4 · Components added for stage-aware working pane

| New component ID | Purpose |
|---|---|
| `CMP-WORKING-PANE-CONTAINER` | The shell's working-pane slot, reads `WorkingPaneShape` from surface module |
| `CMP-STAGE-TRANSITION-FOOTER` | Consistent footer for stage advancement gates |
| `CMP-RIBBON-SYNTHESIS` | Mode B's one-line synthesis ribbon at top of working pane |
| `CMP-PINNED-SYNTHESIS` | Mode A's pinned synthesis section in AgentColumn |

**Net add: +4 entries.**

Plus 13 stage-specific artifact shapes (one per Programs phase + one per Source stage), each as a small component spec in the surface module — but these are surface-internal, not catalog-level. The catalog tracks them as a single entry per surface (e.g., `PRG-DTL-P3` is one catalog entry whose internal artifact components are documented in the Programs spec).

### §5.5 · Total catalog size

| State | Count |
|---|---|
| Current | 78 |
| After migration | 78 + 11 (stage splits) + 4 (new components) - 2 (retired) + 2 (replacements) = **91 entries** |

Reasonable expansion. The 13 new stage-specific entries are the largest group; each is a small artifact spec, not a full page.

---

## §6 · The Atlas state architecture

This section fixes the "I don't have specific information about your company" bug at the architecture level, not as a side ticket.

### §6.1 · The contract

There is exactly one Atlas state object per page. Every Atlas surface (synthesis, chat, ribbon, drawer) reads from the same object. The state is initialized when the page mounts and contains:

```ts
type AtlasPageState = {
  tenant: Tenant;                       // from shell context, never re-fetched
  surface: SurfaceId;                   // 'tower' | 'programs-detail' | etc.
  stage: StageId | null;                // P1-P6 for programs, S1-S7 for sources, null for Tower
  surfaceContext: Record<string, any>;  // surface-specific data (pressures for Tower, program for Programs detail, etc.)
  conversation: ChatTurn[];             // turns: synthesis = turn 0, user/atlas alternating from turn 1
  suggestedActions: SuggestedAction[];  // Atlas's recommended next actions
};
```

### §6.2 · The mounting protocol

When a page mounts:

1. Shell context provides the tenant (already locked, available everywhere)
2. Surface module declares its `surface`, `stage`, and `surfaceContext`
3. The Atlas state initializer reads all three
4. Atlas renders synthesis as turn 0 of the conversation, using the full state
5. Mode A pins turn 0; Mode B caches turn 0 as the ribbon teaser
6. User input creates turn 1; Atlas response is turn 2; etc.
7. State persists in memory for the page lifetime; resets on navigation

### §6.3 · What this prevents

The April 28 bug had two components:

**Component A:** synthesis Atlas and chat Atlas were two separate React components/instances with no shared state. They both said "Atlas" but they were different objects.

**Component B:** the chat Atlas's initialization didn't read the shell context for tenant — it bootstrapped from a system prompt that didn't include tenant identity, then asked the LLM "what do you know about the user?" and got the honest answer "nothing."

The single-state contract makes Component A impossible (one state, one Atlas). It also makes Component B nearly impossible (the state initializer is the only path to Atlas, and it always includes tenant from shell context).

### §6.4 · The implementation note for Codex

The state object lives in a React Context provider scoped to the page. Both the AgentColumn (Mode A) and the AtlasDrawer (Mode B) consume from this context. The synthesis renderer and the chat renderer are presentational components that take state as props — they have no independent state.

Naming: `AtlasPageStateProvider` wraps every page. `useAtlasPageState()` reads it. Initialization happens in the provider's mount effect, reading from the shell's tenant context and the surface module's stage/surfaceContext declarations.

---

## §7 · What changes about specific surfaces

### §7.1 · Tower (Mode A)

Today: navy AgentColumn (synthesis static) + working pane (pressures + activity) + bottom chat overlay.
Future: navy AgentColumn becomes full chat (synthesis pinned at top, chat scrolls below, input at bottom) + working pane (pressures + activity, unchanged). No bottom overlay.

**Visual change:** AgentColumn extends to bottom of viewport. Synthesis is pinned. Below the pin, conversation scrolls. Input at the very bottom.

### §7.2 · Programs detail (Mode B)

Today: same shell as Tower.
Future: top-bar gains "Ask Atlas" button. Working pane goes full-width. Synthesis ribbon renders at top of working pane (one line). Below the ribbon, the stage-aware artifact (P1 brief, P2 synthesis panel, P3 architecture board, etc.). Drawer slides in from right when invoked.

**Visual change:** AgentColumn disappears entirely. Working pane gains a thin top ribbon. Drawer is summonable.

### §7.3 · Intelligence index pages (Mode A)

Today: navy AgentColumn (varies) + working pane (pattern grid).
Future: navy AgentColumn becomes full chat (synthesis: "147 patterns, 23 added this week, top trending: AI Cloud Spend governance") + working pane (pattern grid).

### §7.4 · Source events detail (Mode B)

Today: same shell as Tower.
Future: same as Programs detail — top-bar Ask Atlas, ribbon, full-width working pane with stage-aware artifact (S1 intake form, S2 RFI editor, etc.).

### §7.5 · Home (Mode A)

Today: shell with Atlas voice in middle.
Future: AgentColumn-as-chat (synthesis: cross-tenant overview; suggested actions: today's priority programs/sources). Working pane: program/source/pattern grid as today.

### §7.6 · Setup overview (Mode A)

Mode A because Setup overview is a meta-view of tenant configuration. Atlas's synthesis ("3 unconfigured integrations, 2 users without role assignments, last data sync 4 hours ago") is the value.

### §7.7 · Setup admin sub-pages (Mode B)

Editing a user, configuring an integration, etc. — focused work. Mode B with summonable drawer.

---

## §8 · Build wave decomposition

Implementing this spec requires a deliberate sequence. Eight waves.

### §8.1 · Wave SHELL-V2-1 · Atlas state architecture

Implement `AtlasPageStateProvider` + `useAtlasPageState()`. Refactor existing Atlas-rendering components to read from this context. **No visual change yet** — same AgentColumn, same overlay, but they're reading from one state object.

This is the unblock. With this in place, the chat overlay no longer fails to know the tenant — even before the visual restructure ships. **Ship this wave first regardless of layout work order.**

Estimate: 600 lines. Sonnet.

### §8.2 · Wave SHELL-V2-2 · Mode A AgentColumn refactor

Replace static-text AgentColumn with full chat surface. Synthesis pinned at top, chat thread below, input at bottom. Eliminate bottom overlay. Apply to Tower first (highest visibility surface).

Estimate: 800 lines. Opus (touches multiple components, conversational rendering pipeline).

### §8.3 · Wave SHELL-V2-3 · Mode B drawer + ribbon

Implement `AtlasDrawer` (right slide-in) and `RibbonSynthesis` (one-line top). Wire to top-bar "Ask Atlas" button. Apply to Programs detail (most loaded Mode B surface).

Estimate: 600 lines. Sonnet.

### §8.4 · Wave SHELL-V2-4 · Stage-aware contract

Implement `WorkingPaneContainer` that reads `surface.workingPaneShape(stage)`. Migrate Programs detail to use the contract — single shape for now (existing P3 design view), refactored to flow through the contract.

Estimate: 400 lines. Sonnet.

### §8.5 · Wave SHELL-V2-5 · Programs P1-P6 stage shapes

Six waves, one per phase. Author the WorkingPaneShape for each phase: primary artifact, secondary artifact, transition footer. Per-phase complexity varies (P3 Design is the heaviest).

Estimate: 6 × ~500 lines = ~3,000 lines. Mix of Sonnet (P1, P2, P5, P6) and Opus (P3, P4 — heavier artifact shapes).

### §8.6 · Wave SHELL-V2-6 · Source S1-S7 stage shapes

Seven waves, one per stage. Same pattern as Programs.

Estimate: 7 × ~400 lines = ~2,800 lines. Mostly Sonnet.

### §8.7 · Wave SHELL-V2-7 · Mode propagation across remaining surfaces

Apply Mode A or Mode B to all remaining surfaces per the §7 mapping. Intelligence, Home, Setup overview, Setup admin sub-pages.

Estimate: 1,000 lines distributed. Sonnet.

### §8.8 · Wave SHELL-V2-8 · Catalog migration + smoke tests

Update the page catalog (`pages.yaml`) per §5. Update smoke tests for the new catalog entries. Verify all 91 entries render in the running app.

Estimate: 400 lines + significant test fixtures. Sonnet.

### §8.9 · Total

~9,600 lines across 8 waves. Largest single shell rewrite since the original shell-tokens spec. Most of it is per-stage artifact shapes (Waves 5 and 6), which are parallelizable across multiple agent sessions.

**Ordering:** Wave 1 first and unconditionally (unblocks the Atlas-doesn't-know-tenant bug). Waves 2-4 in sequence (foundation for the layout split). Waves 5-6 can run in parallel (different surfaces). Wave 7 after 5-6. Wave 8 last.

---

## §9 · Risks and mitigations

**Risk 1 · Stage-aware artifact shapes balloon scope.** 13 stage shapes is a lot. Each one is a mini design problem.
**Mitigation:** treat the WorkingPaneShape contract as the constraint. Each shape is *one* primary artifact + *one* optional secondary + *one* transition. Resist adding more slots. If a stage genuinely needs 4 artifacts, that's a sign the stage should split into two stages, not that the contract should expand.

**Risk 2 · Mode A vs Mode B inconsistency confuses users.** Different surfaces feel different.
**Mitigation:** Atlas's voice register is identical across modes. The chat aesthetic (paper, navy, the suggested-action style) is identical. Only the *placement* differs. After ~3 surfaces a user encounters of each mode, the pattern is internalized: "monitoring surfaces have Atlas left, doing surfaces have Atlas right." Reinforced by the icon rail's surface grouping (Setup/Programs/Source/Intel/Tower).

**Risk 3 · The drawer in Mode B feels less integrated than the column in Mode A.**
**Mitigation:** the ribbon is the connective tissue. Always visible, always Atlas's voice, always one click from full conversation. The drawer doesn't appear from nothing — it expands from the ribbon.

**Risk 4 · Build waves take 6-8 weeks at current Sonnet velocity.**
**Mitigation:** Wave 1 ships in ~2 days and resolves the visible bug. Waves 2-4 can ship in a week. Waves 5-6 are the bulk and can run during the patterns/knowledge layer Phase 1 work without conflict (different file globs). Plan parallelism explicitly in the build orchestration.

**Risk 5 · Existing user mental model is "the navy column is where Atlas analyzes things."** Switching some surfaces to no-navy-column on Mode B might disorient.
**Mitigation:** Mode A surfaces are the high-frequency surfaces (Tower, Home, Intelligence). Users build the mental model from those. Mode B surfaces are navigated *to* (Programs detail, Source events detail) for focused work. The transition is "I'm leaving the monitoring view to go work on a thing." Different mode is congruent with different mental state.

---

## §10 · The fixes this spec delivers

When all 8 waves ship:

| Issue | Resolution |
|---|---|
| Two Atlases on Tower | One Atlas state, one chat surface in AgentColumn. Bottom overlay deleted. |
| Atlas doesn't know Apex | Tenant is read from shell context at state-init. Architectural impossibility. |
| Static synthesis text feels disconnected from chat | Synthesis is turn 0 of the chat thread. Conversation flows from it naturally. |
| Right pane is the same shape regardless of stage | Working pane reads `surface.workingPaneShape(stage)`. 13 stage-specific shapes. |
| Programs detail at P3 doesn't show what design work needs | P3 shape: architecture artifacts board + pattern chips + build-readiness gate. |
| Source events at S5 doesn't show BAFO board | S5 shape: BAFO board + leverage analysis + award decision transition. |
| Setup admin still feels like a placeholder | Mode B with stage-aware container. (Setup spec authoring still pending in Codex Session 1.) |

---

## §11 · Open questions for v3

These are not in scope for v2 but worth flagging:

- **Mobile.** Both modes assume desktop dimensions. Mobile likely needs a third mode (full-screen, tabbed chat). Defer to a mobile-specific spec.
- **Multi-tenant Atlas.** When a user has access to multiple tenants, how does Atlas state handle tenant switching mid-session? Likely answer: state resets on tenant change. Spec it explicitly in v3.
- **Atlas memory across pages.** Today the state resets on navigation. Should there be cross-page memory ("you asked about CDP earlier today")? Probably yes, but it's a separate cross-cutting concern.
- **Multiple programs/sources open simultaneously.** Tabbed Mode B? Defer.

---

## §12 · Document control

- **Authoritative location:** `docs/build/SHELL_LAYOUT_SPEC_V2.md`
- **Companion docs to update:**
  - `pages.yaml` per §5
  - `INTELLIGENCE_DESIGN_SPEC.md` to align Atlas voice register with the single-state contract
  - `ORCHESTRATION_SPEC.md` to add SHELL-V2-* waves to the build queue
- **Approval gate:** founder sign-off on this spec before Wave 1 fires
- **Version:** 2.0 · April 28 2026
- **Owner:** Founder
- **Update cadence:** revisions only when concrete bugs surface or v3 is opened

---

**End of Shell Layout Spec v2.**
