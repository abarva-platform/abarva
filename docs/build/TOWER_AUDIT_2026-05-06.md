# Tower Surface Audit · 2026-05-06

| Field | Value |
|---|---|
| **Doc path** | `docs/build/TOWER_AUDIT_2026-05-06.md` |
| **Date** | 2026-05-06 |
| **Author** | Architecture |
| **Status** | Complete — findings actionable |
| **Surface** | Tower (`/tower`) |
| **Front agent** | Atlas |
| **Design principles applied** | 3-layer agent architecture · workflow-first nav · specialist catalog |

---

## Executive summary

Tower is the most architecturally aligned surface in the product. Atlas is correctly named, correctly scoped, and consistently positioned as the portfolio CIO-of-staff. The synthesis pipeline is gated correctly. The scope discipline in the Atlas system prompt (`atlas/prompt.ts`) explicitly enforces persona separation from Nexus and Sentinel.

Three issues require attention before the next pilot:

1. **No TOWER_LEAD_AGENT constant** — Tower has no counterpart to `SOURCE_LEAD_AGENT`. Agent identity for Tower is scattered across multiple files with no single source of truth. Risk of drift identical to the `SOURCE_LEAD_AGENT = 'Nexus'` bug fixed in Source.
2. **TOWER_DESIGN_SPEC.md says "Nexus voice line"** — line 58 references "every Nexus voice line" when it should reference Atlas. The spec predates the 3-layer architecture decision and carries the old naming.
3. **Dual agent paths** — Tower routes through two separate API surfaces: `/api/chat/agent` (universal agent endpoint, used by `AgentCanvas` on the main page) and `/api/v1/atlas/chat` (Atlas-specific orchestrator, used by the v1 API). Both correctly invoke Atlas, but the v1 Atlas path has its own scripted-engine, intent classifier, and thread model — creating a second maintenance surface that diverges from the universal endpoint's pattern.

No specialist has been wired for Tower yet (all four Tower specialists are `planned` in the catalog). The Atlas synthesis route runs a single-turn prompt; no specialist chain exists. This is consistent with Wave 1 (catalog-as-reference) and is not a bug, but the gap should be acknowledged.

---

## M1 · Current state inventory

### Front agent
**Atlas** — consistently named across all Tower code paths.

| File | Agent reference | Status |
|---|---|---|
| `src/lib/atlas/prompt.ts` | `You are Atlas, the CIO chief-of-staff for AbarVa Tower` | ✓ Correct |
| `src/app/api/tower/synthesis/route.ts` | `ATLAS_SYNTHESIS_VOICE_AND_TASK` | ✓ Correct |
| `src/app/api/v1/atlas/chat/route.ts` | `runAtlasTurn` | ✓ Correct |
| `src/app/api/chat/agent/route.ts` | `AGENT_VOICE['Atlas']` — default agentName | ✓ Correct |
| `src/lib/atlas/orchestrator.ts` | `runAtlasTurn`, `runAtlasTurnDetailed` | ✓ Correct |

### Routes
Tower has 19 routes across the maestro namespace:

| Route | Purpose | Status |
|---|---|---|
| `/tower` | Main page — AgentCanvas primary, lens tabs secondary | Active |
| `/tower?tab=portfolio` | Portfolio lens | Active |
| `/tower?tab=scorecards` | Scorecard lens | Active |
| `/tower?tab=pressure` | Pressure lens | Active |
| `/tower?tab=source_commercial` | Source commercial signals | Active |
| `/tower?tab=decisions` | Executive decision queue | Active |
| `/tower?tab=value_at_risk` | Value at risk | Active |
| `/tower?tab=executive_brief` | Executive brief | Active |
| `/tower?tab=programme_gates` | Gate status | Active |
| `/tower?tab=reasoning_activity` | Reasoning activity brief | Active |
| `/tower?tab=dependencies` | Dependency matrix | Active |
| `/tower/pressures/[pressureId]` | Pressure detail | Active |
| `/tower/programs/[programId]` | Program detail from Tower perspective | Active |
| `/tower/lens/value` | Value lens | Active |
| `/tower/lens/adoption` | Adoption lens | Active |
| `/tower/lens/risk` | Risk lens | Active |
| `/tower/activity` | Activity feed | Active |
| `/tower/outcomes` | Value outcomes | Active |
| `/tower/onboard/[dimension]` | Onboarding by dimension | Active |

### API routes

| Route | Purpose | Notes |
|---|---|---|
| `POST /api/tower/synthesis` | Atlas portfolio synthesis stream | In-memory cache, ETag caching |
| `POST /api/v1/atlas/chat` | Atlas v1 chat (full orchestrator) | Separate thread model |
| `GET /api/v1/atlas/ask` | Atlas signal ask | |
| `POST /api/v1/atlas/observations` | Atlas observation creation | |
| `GET /api/v1/atlas/signals/[signalId]` | Signal detail | |
| `POST /api/chat/agent` | Universal agent endpoint | Tower also uses this via AgentCanvas |

### Specialist status

| Specialist | Status | Location |
|---|---|---|
| PortfolioRiskSynthesizer | planned | — |
| ProgramHealthScorer | planned | — |
| ValueRealizationTracker | planned | — |
| SteeringBriefComposer | planned | — |

All Tower specialists are `planned`. Wave 1: catalog-as-reference, no wiring needed yet.

---

## M2 · Agent architecture findings

### F-T1-001 · No TOWER_LEAD_AGENT constant (critical)

**Finding:** Tower has no `TOWER_LEAD_AGENT` constant equivalent to `SOURCE_LEAD_AGENT`. The Source surface had `SOURCE_LEAD_AGENT = 'Nexus'` — wrong — which was caught and fixed in the Source audit. Tower has the correct agent everywhere, but with no single source of truth, drift is a when-not-if.

**Evidence:**
- `src/lib/source/constants.ts` — has `SOURCE_LEAD_AGENT = 'Sentinel'`
- No equivalent `TOWER_LEAD_AGENT` exists in `src/lib/tower/`
- Atlas identity is hardcoded in `src/lib/atlas/prompt.ts`, `src/app/api/tower/synthesis/route.ts`, and `src/app/api/chat/agent/route.ts` independently

**Fix:** Create `src/lib/tower/constants.ts` with `TOWER_LEAD_AGENT = 'Atlas'` and `TOWER_PRODUCT_NAME = 'AbarVa Tower'`. Wire into synthesis route and prompt builder.

**Priority:** High

---

### F-T1-002 · TOWER_DESIGN_SPEC.md says "Nexus voice line" (medium)

**Finding:** `docs/build/TOWER_DESIGN_SPEC.md` line 58 reads: "every page, every metric, every Nexus voice line traces back to one of these." This predates the 3-layer architecture decision. Tower's front agent is Atlas, not Nexus.

**Fix:** Update line 58 to reference Atlas.

**Priority:** Medium

---

### F-T1-003 · Dual Atlas API paths (low)

**Finding:** Tower uses two separate paths to reach Atlas:

1. `AgentCanvas` on the main page → `/api/chat/agent` (universal endpoint, `agentName: 'Atlas'`)
2. The v1 API → `/api/v1/atlas/chat` → `runAtlasTurn` (own orchestrator, scripted engine, thread model)

Both produce Atlas responses. The v1 path has scripted-engine intent classification (`classifyAtlasIntent`) and a custom thread persistence model. The universal path has the richer specialist context (broker bundle, phase packs, failure-mode catalog).

**Risk:** The two paths can drift independently. Features added to the universal path (e.g., failure-mode detection) don't automatically apply to the v1 Atlas path.

**Fix (Wave 2):** When specialist wiring lands, route both paths through the same orchestrator layer. For now, document the divergence so future specialists know which path to target.

**Priority:** Low (Wave 2 item)

---

## M3 · Workflow-first nav findings

### F-T3-001 · Legacy pressure grid behind `<details>` (good pattern)

**Finding:** The main Tower page correctly wraps the legacy pressure grid in a `<details>` collapse element, making `AgentCanvas` primary and the metrics grid secondary. This is the right direction — agent-first, data-on-demand.

**Status:** No action needed. Document as the correct pattern for other surfaces to follow.

---

### F-T3-002 · 10-tab lens system may be over-fragmented

**Finding:** Tower exposes 10 lens tabs (Portfolio, Scorecards, Pressure, Source Commercial, Decisions, Value at Risk, Executive Brief, Gates, Reasoning Activity, Dependencies). This is a read-only navigation concern, not an agent architecture concern — but 10 tabs creates cognitive load before a user has asked Atlas anything.

**Recommendation:** Consider grouping tabs into 3 clusters:
- **Overview** (Portfolio, Value at Risk, Executive Brief)
- **Signals** (Pressure, Scorecards, Decisions)
- **Ops** (Gates, Source Commercial, Dependencies, Reasoning Activity)

**Priority:** Product decision — not a code fix.

---

## M4 · Specialist catalog gaps

Tower specialists are all `planned`. Per the 3-layer architecture, this is correct for Wave 1. No immediate code action needed. The specialist catalog at `docs/architecture/SPECIALIST_CATALOG.md` correctly marks all four as `planned`.

When Wave 2 lands (tool-call wiring), the priority order should be:

1. **PortfolioRiskSynthesizer** — most visible gap; currently Atlas synthesizes portfolio risk via a single-turn prompt with no structured output. Moving this to a specialist would allow structured risk records, FM detection, and audit trail.
2. **SteeringBriefComposer** — executive brief lens currently renders fixture data; a wired specialist would generate from live portfolio state.
3. **ProgramHealthScorer** — feeds Scorecards lens.
4. **ValueRealizationTracker** — feeds Value at Risk lens with the value lifecycle state machine.

---

## M5 · Evidence and citation hygiene

The Tower synthesis route correctly applies `formatRestrictedOutputPolicyForPrompt` and `sanitizeRestrictedFinancialText` — financial visibility is gated by user's program and source access policies.

The `ATLAS_SYNTHESIS_VOICE_AND_TASK` prompt requires: "Every numeric claim must come from the provided tool context or the demo context below." This is functionally equivalent to the CitationGuard specialist — enforced in the voice prompt, not via a structured specialist yet.

**Status:** Acceptable for Wave 1. CitationGuard should be added as a cross-cutting specialist in Wave 2.

---

## M6 · Addendum · Architecture alignment

**Decision (2026-05-06):** Tower's front agent is **Atlas**. This is reflected in all active code paths. The specialist catalog lists Atlas for all Tower specialists.

**What Atlas does:**
- Portfolio-level synthesis: cross-program, cross-source event
- Pressure card reasoning
- Value at risk framing
- Executive steering brief
- Cross-program dependency signaling

**What Atlas does NOT do:**
- Run program workflows (that is Nexus)
- Source strategy or trade-off decisions (that is Sentinel)
- Governance and admin (that is Steward)

These scope boundaries are explicitly enforced in `src/lib/atlas/prompt.ts`:
```
You are not Nexus. Do not run a program workflow or pretend to manipulate program state.
You are not Sentinel. For strategy or trade-off decisions, hand off cleanly.
```

---

## Action items

| # | Finding | Fix | Priority | Status |
|---|---|---|---|---|
| T-A1 | No TOWER_LEAD_AGENT constant | Create `src/lib/tower/constants.ts` | High | **Open** |
| T-A2 | TOWER_DESIGN_SPEC.md says "Nexus voice line" | Fix line 58 | Medium | **Open** |
| T-A3 | Dual Atlas API paths | Document divergence; unify in Wave 2 | Low | Wave 2 |
| T-A4 | Tower specialists all planned | Wire in Wave 2 per priority order above | Low | Wave 2 |

---

*End of Tower audit.*
