# Source Audit · M4 · Agent behavior + architecture

| Field | Value |
|---|---|
| Mode | M4 · Agent behavior + architecture |
| Status | Complete |
| Audit date | 2026-05-06 |
| Findings count | 2 compliance · 4 drift · 8 design observations |
| Importance | HIGHEST for the agent-architecture redesign |

---

## TL;DR for the redesign

The Source codebase implements **a fifth, undeclared agent model**: parallel-all four agents on every stage with no stage or category specialization. Voice content is agent-distinct (Nexus reads operational; Atlas reads executive) but **stage-generic** within each agent — Nexus-at-Strategy and Nexus-at-BAFO produce templated output that varies only by stage label injection.

The four agents have effectively become four "concerns" rather than four "experts":
- Nexus = "what to do next"
- Sentinel = "what's not yet usable evidence"  
- Atlas = "what to tell the executive"
- Steward = "what's blocking the gate"

This is a defensible model for a deterministic-output system that has not yet wired model calls. But it strains under three conditions: (1) when a sourcing leader wants depth at a specific stage, (2) when the dossier or design ask for a single lead voice per stage, (3) when the design's category co-leadership pattern requires routing.

---

## 1 · Compliance findings

### F-M4-001 · The four canonical agent names are honored
- **Source aligned:** Dossier §2.1
- **Evidence:** [src/lib/source/multi-agent-types.ts:10](src/lib/source/multi-agent-types.ts:10) `export type SourceAgentName = 'nexus' | 'sentinel' | 'atlas' | 'steward';`. Spelling exact; no aliases or nicknames.
- **Status:** Compliance.

### F-M4-002 · Each agent has a distinguishable role concern
- **Source aligned:** Dossier §2.1 role descriptions
- **Evidence:** Mission types per agent ([src/lib/source/agent-missions.ts:45-265](src/lib/source/agent-missions.ts:45)):
  - **Nexus:** `next_action`, `data_readiness`, `pattern_signal` (orchestration / next-step framing)
  - **Sentinel:** `validation_defer`, `evidence_gap`, `low_context_warning` (evidence integrity)
  - **Atlas:** `value_risk`, `executive_brief` (executive synthesis)
  - **Steward:** `workflow_blocker`, `validation_defer` (governance / gates)
- **Status:** Compliance. The role specialization is real at the mission-type level even if all four run on every stage.

---

## 2 · Drift findings

### F-M4-101 · Code uses a 5th agent model not declared anywhere
- **Sources violated:** Dossier (single lead per stage), Design B (single lead + category co-lead), Build spec (Sentinel-led), Walkthrough (implicit single lead)
- **Evidence:** [src/lib/source/agent-missions.ts:36-43](src/lib/source/agent-missions.ts:36):
  ```ts
  export function buildSourceAgentMissions(input: SourceAgentMissionInput): SourceAgentMission[] {
    return prioritizeSourceAgentMissions([
      ...buildNexusSourceMissions(input),
      ...buildSentinelSourceMissions(input),
      ...buildAtlasSourceMissions(input),
      ...buildStewardSourceMissions(input),
    ]);
  }
  ```
  All four agents always run, regardless of stage, regardless of category. The "lead agent" concept is absent from the agent-missions code path. Constants declare a single `SOURCE_LEAD_AGENT = 'Nexus'` but it's a UI hint, not behavior.
- **Bucket:** Drift (architectural)
- **Severity:** P0
- **Treatment:** This is the #1 finding of the entire audit. A redesign decision must pick one model and propagate. See §6 below.

### F-M4-102 · No category→agent assignment exists in code
- **Sources violated:** Design B T02 (Cloud=Sentinel+Atlas, Data=Steward+Sentinel, Enterprise=Atlas, AMS=Nexus)
- **Evidence:** No `categoryAgentLeads`, `eventTypeAgents`, or similar mapping found in `src/lib/source/`. Sourcing patterns (`'data-ai-modernization-sourcing'`, etc.) exist as patterns, not as agent-routing inputs.
- **Bucket:** Drift
- **Severity:** P1
- **Treatment:** If category co-leadership is the chosen redesign target, this needs new code: a `Category → AgentSet` table and routing logic in mission building.

### F-M4-103 · Agent voice is stage-generic within agent
- **Sources violated:** Dossier §13.1 universal acceptance criterion 2 ("primary agent editorial is context-specific and cannot apply to any generic event")
- **Evidence:** Sample editorial templates from [src/lib/source/agent-missions.ts](src/lib/source/agent-missions.ts):
  - Nexus next-action title: `${stageLabel} next action` — literally the stage label slotted into a template. Nexus-at-Strategy: "Strategy next action." Nexus-at-BAFO: "BAFO next action." Same template, different label.
  - Nexus next-action summary: `${eventName} needs a clear operational next action from the current Source context.` — identical phrasing across stages.
  - Atlas value-risk title: `Value at stake needs executive visibility` — same title at any stage.
  - Atlas summary: `${formatUsd(valueAtStake)} is at stake for ${getEventName(input)}; current value should be treated as projected until measured evidence exists.` — identical across stages.
  - Steward title: `Workflow gate is blocked` — identical across stages.
- **Bucket:** Drift
- **Severity:** P1
- **Treatment:** This validates the design template's concern about T03 (universal canvas governing 7 of 11 steps). The genericness is not just at the UI shell level — it goes all the way into the editorial generators. Per-stage editorial sharpening is needed regardless of which agent model wins.

### F-M4-104 · Handoff targets are simple strings, not stateful flows
- **Sources violated:** Design B T03 (handoff seam between Steward-led Step 5 and adjacent Nexus-led steps)
- **Evidence:** Mission `handoffTarget` is a single agent name string. Most missions hand off to `'nexus'` or `'sentinel'`. There is no `handoffReason`, `handoffPayload`, or `handoffStage` — meaning handoff is rendered as a label change, not as a flow of context from one agent to another.
- **Bucket:** Drift
- **Severity:** P2
- **Treatment:** Either accept handoff is decorative (which is fine for parallel-all model) or model it as a real transition (required if single-lead model wins).

---

## 3 · Design observations

### F-M4-201 · Voice samples by agent (concrete content captured for the redesign)

These are the actual templates the code generates today. Use as evidence for design decisions.

**Nexus (operational):**
- "Strategy next action / Scope next action / RFP next action / ..." — title template
- "{event} needs a clear operational next action from the current Source context." — summary
- "Use {pattern} to keep sourcing guidance specific to {archetype}." — pattern signal
- Suggested actions: showMissingInputs, generateMinimumDataRequest, explainReadiness

**Sentinel (evidence):**
- "Context validation has intentional defers" — title
- "{N} context validation defer{s} must remain visible before decision-grade output." — summary
- "Keep unsupported Source claims labeled as low-confidence or pattern-level until evidence is available." — recommended action
- Suggested actions: showEvidenceGaps, showContextValidation

**Atlas (executive):**
- "Value at stake needs executive visibility" — title
- "{$X} is at stake for {event}; current value should be treated as projected until measured evidence exists." — summary
- Suggested actions: showValueAtStake, prepareExecutiveBrief, showTradeoffs

**Steward (governance):**
- "Workflow gate is blocked" — title
- Reason from blocker list. Recommended action from workflow report.
- Suggested actions: showGateBlockers, showRequiredApprovals, explainWaiverPath

**Observation:** Voices are distinct in concern but identical in stage. A Nexus message at Strategy is structurally identical to Nexus at BAFO. The redesign must decide whether to invest in per-stage editorial differentiation per agent, OR move to per-stage specialist agents (decomposition).

### F-M4-202 · Handoff topology converges on Nexus
- **Pattern:** Of all `handoffTarget` references in agent-missions.ts:
  - Sentinel hands off to `'nexus'` (when blockers found)
  - Atlas hands off to `'nexus'`
  - Steward hands off to `'nexus'` (when workflow blocked)
  - Nexus hands off to `'sentinel'` (when missing inputs) or `'steward'` (when blocked)
- **Observation:** Despite the parallel-all model, Nexus is the de facto orchestrator. This is consistent with both dossier and design's "Nexus as primary lead" framing — but the code never makes the orchestration explicit. Nexus is hidden among equals.
- **Treatment:** A redesign that promotes Nexus to formal orchestrator (a la "router agent" pattern) would clarify what's already implicit.

### F-M4-203 · Atlas inside Source vs Atlas inside Tower — single agent assumed
- **Observation:** The `SourceAgentName` type does not distinguish a "Source-Atlas" from a "Tower-Atlas." If Tower exists as a separate surface (memory note: deferred per dossier digestion), Atlas in code is one agent doing both jobs. The build spec (line 13) says Source feeds Tower; if Atlas in Source is event-scoped editorial and Atlas in Tower is portfolio-scoped, the same name spans different cognitive scopes.
- **Treatment:** Decide if these are one agent two scopes or two agents one name. The dossier digestion §16.1 raised this as the original Atlas question.

### F-M4-204 · Sentinel and Steward overlap on "validation defers"
- **Where:** Both `buildSentinelSourceMissions` and `buildStewardSourceMissions` produce a `validation_defer` mission type:
  - Sentinel: from `contextValidationReport.deferReasons`
  - Steward: from `workflowValidationReport.intentionalDefers`
- **Observation:** The split is "context validation" (Sentinel) vs "workflow validation" (Steward). This is a defensible boundary but the user-visible distinction may not be intuitive. A sourcing leader sees "two agents both said something deferred" — whether that's good redundancy or confusion depends on UI rendering.
- **Treatment:** M3 Chrome should verify how these two defer sources render side by side. If the user sees both at once, that's sticky friction.

### F-M4-205 · No persona-specific agent voice variation
- **Where:** [src/lib/source/agent-missions.ts:201](src/lib/source/agent-missions.ts:201): Atlas mission triggers when `userRole === 'cio' || userRole === 'cfo'`. But the *content* doesn't vary by role beyond the trigger.
- **Observation:** Dossier names 13 personas with shared "first three seconds" view. Design template implicitly assumes the same voice across personas. Code matches design but misses an opportunity: a CFO and a CISO have different decision frames; same Atlas voice serves both.
- **Treatment:** Consider per-persona voice variation as a design observation for the redesign — likely too costly to build, but worth thinking about.

### F-M4-206 · Mission priority/state is rich; can drive better UX
- **Where:** [src/lib/source/multi-agent-types.ts](src/lib/source/multi-agent-types.ts) defines `SourceAgentBriefingConfidence`, `SourceMultiAgentOverallReadiness`, mission `priority`, mission `state`.
- **Observation:** The substrate exists for a "show only the top mission" UX that picks the highest-priority mission across all four agents and surfaces it as the lead voice. The parallel-all model could feel like single-lead at the UI layer if rendering picks the top mission. Worth checking M3 Chrome to see if this is happening.
- **Treatment:** If UX already does priority-based surfacing, the parallel-all backend with single-voice frontend is a viable pattern. The redesign could formalize this.

### F-M4-207 · `multi-agent-briefing.ts` has a `recommendedNextSlice` field
- **Where:** [src/lib/source/multi-agent-briefing.ts:14-16](src/lib/source/multi-agent-briefing.ts:14):
  ```ts
  const DEFAULT_RECOMMENDED_SLICE = 'Review deterministic multi-agent briefing output, then plan a Source-specific Nexus API route stub with no model calls.';
  ```
- **Observation:** The codebase explicitly self-documents that no model calls are wired ("no model calls"). This matches dossier §3 prohibition #10 ("Do not make model calls until model gateway, context builder, evidence ledger, and safety posture are ready"). Discipline is real.
- **Treatment:** Compliance — code matches dossier prohibition. When model calls land, this string should update.

### F-M4-208 · Pattern packs are agent-blind
- **Where:** [src/lib/source/stage-packs/](src/lib/source/stage-packs/) — pattern packs by sourcing archetype.
- **Observation:** Pattern packs offer per-stage guidance but don't address agent voice. A pattern pack could in principle inject category-specific tone into agent voice (e.g., AMS pattern → Nexus uses more operational language; Cloud pattern → Sentinel uses more security language). This is not currently done.
- **Treatment:** If category co-leadership is chosen for the redesign, pattern packs become a natural place to bind agent specialization.

---

## 4 · The redesign decision matrix

The audit doesn't pick. It surfaces evidence. Here is the decision matrix the founder needs:

| Option | What it requires | What it costs | What it gains |
|---|---|---|---|
| **A · Stay parallel-all + sharpen voice** | Build per-stage voice templates; keep all four running | Medium · adds template work, no architecture change | Voice depth without restructure; preserves existing infrastructure |
| **B · Single-lead per stage** | Add `stage_lead_agent` map; refactor agent-missions.ts to gate by stage | High · type-level refactor, every mission builder needs gating logic | Cleaner UX; matches dossier; handoffs become real |
| **C · Single-lead + category co-lead** | Add stage map AND category map AND co-leadership type | Highest · new substrate column for category, type changes, routing logic | Matches design template; richer specialization |
| **D · Per-stage specialist agents (11 agents)** | Wholesale rewrite of agent model | Very high | Sharpest editorial; harder coherence |
| **E · Parallel-all + UX-layer prioritization** | Keep backend, change UX to surface single top mission | Low · UX-only change | Single-voice feel without backend lift; fits dossier expectation in UI |

My read of the evidence: **Option E is the lowest-cost path** that matches dossier expectations at the UI layer while preserving existing investment. **Option C is the highest-cognitive-fit** path because category co-leadership in design B was a thoughtful articulation. **Option A** is a pragmatic compromise that reduces risk but doesn't address the agent decomposition question.

The audit's job is the matrix. The decision is the founder's.

---

## 5 · What this mode did NOT cover

- **Live agent output samples** from running the deterministic generators against real seeded events. The samples here are template-level, not output-level. A follow-up M4 pass should run the generators and capture actual rendered output for Apex AMS-Out 2026 at 3 stages (Strategy, Scope, BAFO).
- **Personas tested.** Atlas mission firing for CIO/CFO is wired but I didn't trace per-persona voice content.
- **Voice consistency across surfaces** (e.g., is Nexus voice in Source the same as Nexus voice in Programs?). Worth a cross-product agent voice audit if the redesign extends across Moves/Source/Tower/Intelligence.

---

End of M4.
