# Session Brief — Wave 3 Cross-Agent State (Sentinel ↔ Nexus ↔ Atlas ↔ Maestro)

**Sender:** Anand (founder, AbarVa)
**Recipient:** Whichever fresh session picks this up — Claude or Codex
**Why a separate session:** Wave 1, Wave 1.5, and Wave 2 all shipped within the agent-centric layout track (Programs / Home / Intelligence / Sourcing / Tower — all use the same `AgentCanvas` primitive). Wave 3 is a different domain: the cross-agent signal store. It connects what each agent already knows to the others, and that's an architectural seam the layout-track sessions shouldn't be improvising during their own UX work.
**Boundary you're respecting:** [`feedback_broker_boundary.md`](../../) (in user memory) — app-tier code routes through `AgentContextBroker` only, never directly imports `EnterpriseDataRoom` / vector / graph from `src/app/**` or `src/lib/agent/**`.
**Companion docs (read first):**
- [`AGENT_INTELLIGENCE_SURFACE_AREA.md`](AGENT_INTELLIGENCE_SURFACE_AREA.md) — overall architecture map · §3 = Lateral intelligence (this brief's scope)
- [`SESSION_BRIEF_INTELLIGENCE.md`](SESSION_BRIEF_INTELLIGENCE.md) and [`SESSION_BRIEF_SOURCING_MODULE.md`](SESSION_BRIEF_SOURCING_MODULE.md) — the brief format that Codex / Claude have executed cleanly. Mirror the structure.
- `src/lib/knowledge/agent-context-broker.ts` — the broker contract
- `src/lib/programs/programs-broker-adapter.ts` — the read-only adapter pattern (replicate for cross-agent signals if needed)

---

## §0 · The strategic question this brief answers

Today every agent has its own world model:
- **Sentinel** finds contradicting patterns in the corpus
- **Maestro** raises oversight flags on programs
- **Steward** registers a new sponsor
- **Atlas** detects portfolio drift
- **Nexus** coaches a phase

But **none of them sees what the others know**. When Sentinel finds a pattern that contradicts the synthesis Nexus is coaching toward in P2, that signal dies inside Sentinel's tool result. When Maestro flags a phantom-sponsor risk, Nexus's pack-driven coaching has no idea Maestro saw the same signal.

Wave 3 closes that gap. **Cross-agent signal store** — when one agent emits a signal worth other agents seeing, it lands in a shared store that the others read at every turn. The signal is structured (typed, tenant-scoped, time-stamped) and respects the broker boundary.

The premise this proves: **agents that share signals replace a senior PM-of-staff, not just a smart chatbot per surface.** A PM who can see all programs but doesn't share what they see with their colleagues is just a slow PM. Wave 3 makes the agent stack a team.

---

## §1 · Wireframe — what the user actually sees

```
On /programs/<id> · Nexus chat · existing layout
┌─────────────────────────────────────────────────────────────┐
│ Nexus chat (left)         │   Reactive panel (right)        │
│                           │   ┌─────────────────────────┐   │
│ "Where are we on the      │   │ NEXUS · GATE EVALUATION │   │
│  CDP architecture?"       │   │ Build gate · privacy    │   │
│                           │   │ [BLOCKED]                │   │
│ Nexus: "Architecture is   │   └─────────────────────────┘   │
│  approved BUT —"          │                                  │
│                           │   ┌─ NEW ─────────────────────┐  │
│ "Sentinel just flagged a  │   │ SENTINEL · CONTRADICTION  │  │
│  contradiction: vendor    │   │ Vendor C SOC-2 attestation│  │
│  C's SOC-2 attestation    │   │ vs deployment timeline   │  │
│  cycle doesn't match the  │   │ [HIGH SEVERITY]           │  │
│  deployment timeline they │   │ Surfaced 12 min ago by    │  │
│  promised. I think we     │   │ Sentinel · validate_     │  │
│  need to address this     │   │ synthesis on a related    │  │
│  before the gate."        │   │ program                   │  │
│                           │   └─────────────────────────┘  │
│                           │                                 │
│                           │   ┌─ NEW ─────────────────────┐ │
│                           │   │ MAESTRO · OVERSIGHT FLAG  │ │
│                           │   │ Phantom sponsor risk      │ │
│                           │   │ Sponsor hasn't been in a  │ │
│                           │   │ workshop in 21 days       │ │
│                           │   │ Surfaced 2 hours ago      │ │
│                           │   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

The new layer: cards from OTHER agents now appear in Nexus's reactive panel, with provenance ("surfaced X ago by Sentinel · validate_synthesis"). Same on Sentinel's `/intelligence`, on Atlas's `/home` and `/tower`. Each agent sees relevant signals from the others.

The user sees one team of agents that talk to each other. Not four chatbots that happen to live on adjacent pages.

---

## §2 · Architecture (the seam this PR creates)

### Today

```
Sentinel (in tool result, scoped to /intelligence)
    └─ contradiction-flag artifact → SentinelReactivePanel only
       (dies when user navigates away)

Maestro (in src/lib/programs/governance.ts)
    └─ raiseMaestroFlag() → founder_approval_requests table
       (read by Maestro UI but invisible to Nexus's prompt)

Steward (commit_program.ts)
    └─ creates persons row → invisible to Nexus next turn

Nexus (system prompt)
    └─ reads phase pack + per-program data → coaches
       (no awareness of what other agents have flagged)
```

### Wave 3 (this brief)

```
                   ┌─────────────────────────┐
                   │  AgentSignalStore        │
                   │  (broker-routed, tenant- │
                   │   scoped, time-stamped)  │
                   └──┬───────┬───────┬───────┘
                      │       │       │
   ┌──────────────────┼───────┼───────┼──────────────────┐
   │ Emit (write)     │       │       │  Read (every turn)│
   │                  │       │       │                   │
   ▼                  ▼       ▼       ▼                   ▼
Sentinel        Maestro    Steward  Atlas              Nexus
search_patterns flag       commit   pressure           reads relevant
validate_synth  resolve    program  detection          signals as
contradictions  ...        ...      ...                cross-agent
                                                       cards
```

### Where the store lives

- **NOT in app-tier directly.** Goes through `AgentContextBroker`. The broker contract grows a `signalNeighborhood?: SignalNeighborhood` field on `EnterpriseAgentContextBundle`.
- **Persistence** lives next to the broker (in `src/lib/knowledge/`), not in `src/app/**` or `src/lib/agent/**`. Tenant-scoped Postgres table or in-memory store v1; the broker's read API is what app-tier touches.
- **Read-only at the app tier.** App tier writes via the existing tools (advance_phase, validate_synthesis, raiseMaestroFlag, commit_program, etc.) — those tools call broker-side write APIs. App tier reads via `buildEnterpriseAgentContextBundle` which now includes `signalNeighborhood`.

---

## §3 · Signal types in scope

Each signal has: `id`, `tenantKey`, `emittedBy` (agent name), `emittedAt` (ISO), `programId?`, `severity`, `payload`, `expiresAt?`.

### `cross-agent-contradiction-flag`
Sentinel detects a corpus contradiction that applies to an active program. Nexus / Atlas see it as a card with provenance "by Sentinel · validate_synthesis on PAT-PRG-CDP-001". Severity: low / medium / high.

### `maestro-oversight-flag`
Maestro raises a phantom-sponsor / drift / risk flag on a program. Nexus sees it; Atlas sees it across the portfolio. Maps to the existing `phaseAntiPatterns` vocabulary (e.g. `phantom-sponsor`, `wishlist-baseline`) so Nexus's pack-coaching can reference it directly: "Maestro flagged the same anti-pattern your pack warns about."

### `sponsor-change`
Steward registers a new sponsor or marks an existing one as departed. Nexus sees this and re-runs its sponsor-related gate evidence ("succession plan now needs to be re-confirmed"). Atlas sees portfolio-level sponsor health.

### `portfolio-pressure`
Atlas detects a cross-program signal (e.g., "AI cloud spend is 33% over budget across 3 programs"). Individual program Nexus surfaces this as context: "Your program contributes to a portfolio-level pressure Atlas is tracking — when you decide on Vendor C pricing, factor this in."

### `cross-program-dependency`
Already exists as an artifact; Wave 3 promotes it to a signal store entry so it persists across sessions and shows up in adjacent program canvases automatically.

---

## §4 · PR sequence

8 PRs, sequenced like Wave-1 for Programs.

| PR-CRA | Title | Scope |
|---|---|---|
| **A** | Signal types + persistence contract | Define `AgentSignal` interface in `src/lib/knowledge/`, write a `SignalStore` interface (in-memory v1; tenant-scoped), broker-side read API `getSignalNeighborhood(tenantKey, scope)`. Pure types + pure functions. |
| **B** | Broker contract extension | Extend `EnterpriseAgentContextBundle` with `signalNeighborhood?: SignalNeighborhood`. Update `buildEnterpriseAgentContextBundle()` to populate it via `SignalStore.read()`. ProgramsBrokerAdapter and SourcingBrokerAdapter (if exists) inherit transparently. |
| **C** | Sentinel emits cross-agent signals | When `validate_synthesis` or `pattern_neighborhood` finds a contradiction with active-program scope, write a `cross-agent-contradiction-flag` to the SignalStore. Emit the contradiction-flag artifact for the local panel AND signal-store entry for the cross-agent surface. |
| **D** | Maestro emits oversight signals | Wrap existing `raiseMaestroFlag()` in `src/lib/programs/governance.ts` to also write to SignalStore. Existing callers + UI keep working unchanged; the signal layer is additive. |
| **E** | Steward emits sponsor-change signals | When `commit_program`, `register_placeholder_person`, or future sponsor-update mutations land, write a `sponsor-change` signal. |
| **F** | Atlas portfolio-pressure signals | When `/tower` or `/home` Atlas surfaces a cross-program pressure, write a `portfolio-pressure` signal scoped to the affected program ids. |
| **G** | Nexus reads & renders cross-agent cards | Route's system prompt now includes a "Recent signals from other agents on this program" section pulled from `signalNeighborhood`. NexusReactivePanel renders a new card type `cross-agent-signal` with provenance ("surfaced X ago by Sentinel · validate_synthesis"). |
| **H** | Production walk via Chrome MCP | Trigger Sentinel contradiction detection, Maestro flag raise, Steward sponsor commit. Verify each surfaces on Nexus's `/programs/<id>` and Atlas's `/home` with provenance. Verify time-decay (signals older than 14 days don't show by default). |

---

## §5 · Broker contract — concrete shapes

### `AgentSignal`
```typescript
export type AgentSignalType =
  | 'cross-agent-contradiction-flag'
  | 'maestro-oversight-flag'
  | 'sponsor-change'
  | 'portfolio-pressure'
  | 'cross-program-dependency';

export interface AgentSignal {
  id: string;                     // stable id; e.g. `signal_${ulid}`
  tenantKey: string;
  emittedBy: 'Sentinel' | 'Maestro' | 'Steward' | 'Atlas' | 'Nexus';
  emittedAt: string;              // ISO 8601
  type: AgentSignalType;
  /** Program scope: signal applies to these programs. Empty = portfolio-wide. */
  scope: { programIds: string[] };
  severity: 'low' | 'medium' | 'high';
  /** Human title rendered as the card head. */
  title: string;
  /** One-line summary rendered as the card body. */
  summary: string;
  /** Free-form structured payload — type-specific. */
  payload: Record<string, unknown>;
  /** Optional time-decay; signals after this ISO are not surfaced. Default 14 days. */
  expiresAt?: string;
  /** Optional reference back to the artifact / pattern / flag that generated this. */
  sourceRef?: { kind: 'pattern' | 'flag' | 'tool-call' | 'artifact'; id: string };
}
```

### `SignalNeighborhood`
```typescript
export interface SignalNeighborhood {
  tenantKey: string;
  /** Signals scoped to the active surface — programId on programs detail, all signals on tower/home. */
  signals: AgentSignal[];
  /** Total count BEFORE time-decay + scope filtering — telemetry for "n hidden, X shown". */
  fullCount: number;
  /** Filter rationale prose — debuggable in dev. */
  filterDescription: string;
}
```

### Broker request extension
```typescript
export interface EnterpriseAgentContextRequest {
  // ... existing fields
  /** PR-CRA-B · include signal neighborhood. Defaults to false. */
  includeSignalNeighborhood?: boolean;
}

export interface EnterpriseAgentContextBundle {
  // ... existing fields
  /** Populated only when includeSignalNeighborhood was true. */
  signalNeighborhood?: SignalNeighborhood;
}
```

---

## §6 · Render — `cross-agent-signal` artifact + card

Add to `src/lib/agent/artifacts.ts`:

```typescript
| 'cross-agent-signal' // {signalId, type, emittedBy, emittedAt, severity, title, summary, sourceRef?}
```

Card renders with:
- Header strip: `{EMITTEDBY} · {TYPE.replace('-', ' ').toUpperCase()}` — e.g. `SENTINEL · CROSS-AGENT-CONTRADICTION-FLAG`
- Title (bold, 13.5pt)
- Severity pill (low/medium/high — reuse the StatusPill colors)
- Summary (12.5pt slate)
- Provenance line (10pt mono, stone): `Surfaced {humanizedAgo(emittedAt)} ago · {sourceRef.kind} {sourceRef.id}`

Dedupe by `signalId` in `selectVisibleArtifacts()`.

The route's system prompt grows a new section when `signalNeighborhood` is non-empty:

```
RECENT SIGNALS FROM OTHER AGENTS:

The agent stack is a team. Other agents have flagged things on this
program (or related programs) that you should factor into your
coaching. Each signal includes who emitted it, when, and why.

  • Sentinel flagged 12 min ago: "Vendor C SOC-2 attestation cycle
    contradicts deployment timeline" (high severity, on PAT-PRG-CDP-001)
  • Maestro flagged 2 hours ago: "Phantom sponsor — sponsor hasn't
    been in a workshop in 21 days" (medium severity)

Reference these in your coaching when relevant. Don't re-emit them
as your own observations — say "Sentinel flagged this" or "Maestro
raised this." That's how the user knows the agent stack is working
as a team, not duplicating effort.
```

---

## §7 · Hard rules (the non-negotiable parts)

1. **Read-only at the app tier.** App-tier reads `signalNeighborhood` from the broker bundle. Writes go through existing tools (advance_phase, validate_synthesis, raiseMaestroFlag, commit_program). Tools call broker-side write APIs. **Never** import `SignalStore` directly from `src/app/**` or `src/lib/agent/**`.
2. **Tenant-scoped.** Every signal includes `tenantKey`. The broker's `getSignalNeighborhood` filters by tenant. No cross-tenant leakage.
3. **No new persistence migration in this scope.** v1 SignalStore is an in-memory Map keyed by tenantKey. The store lives in the broker module. PR-X (graph/vector readiness doc) governs eventual persistence; this brief doesn't add Postgres tables.
4. **Time-decay enforced.** Default expiry 14 days. Signals older than that are filtered out by `getSignalNeighborhood` so the prompt doesn't bloat with stale flags.
5. **No agent talks to another agent directly.** All cross-agent communication goes through the SignalStore. Sentinel doesn't "call" Nexus; Sentinel emits a signal; Nexus reads from the broker on its next turn.
6. **Don't duplicate the existing artifact channel.** A signal that's also a local artifact (e.g. contradiction-flag on `/intelligence`) emits BOTH — the artifact for the originating panel, the signal for cross-agent visibility. The signal-side card has provenance; the local-side card doesn't.
7. **Provenance is non-negotiable.** Every cross-agent card shows who emitted, when, and the sourceRef. Without provenance the user can't tell if Nexus is making something up vs Sentinel actually flagged it.

---

## §8 · Open decisions (flag in PR body — do not decide unilaterally)

1. **In-memory v1 vs Postgres v1.** Brief says in-memory; if it survives a single Vercel function instance fine, defer Postgres. If it doesn't, write to a single tenant-scoped JSONB column on `enterprise_data_room` rows. Don't add a new table without founder sign-off.
2. **Time-decay window.** 14 days default per signal type? Or per-signal-type defaults (contradictions = 30 days, oversight = 7 days, sponsor-change = 90 days)? Recommendation: per-type defaults; flag the chosen values in PR-CRA-A.
3. **Cross-tenant aggregation for the moonshot (Wave 5).** Out of scope here — but if you find yourself adding cross-tenant lookups, that's a smell. Flag it.
4. **Signal-vs-artifact split.** Some emissions clearly want both (Sentinel contradictions, Maestro flags). Others might only want one (low-severity Atlas pressure → maybe signal-only, no local artifact). Flag the per-emitter decision in each PR's body.
5. **Replay vs live signals.** Should the SignalStore replay all unexpired signals to a freshly-loaded chat thread? Or only signals emitted DURING the active session? Recommendation: replay all unexpired (within tenant scope). The user benefits from continuity across sessions; that's what cross-agent state is for.

---

## §9 · Verification (per PR)

```bash
npx tsc --noEmit
npx eslint src/lib/knowledge/ src/lib/agent/ src/lib/programs/  # whichever directories you touch
npx jest src/lib/knowledge src/lib/agent src/lib/programs --silent
```

For PR-CRA-H production walk via Chrome MCP:
1. Sign in as admin (OTP `424242` → `anand+clerk_test@abarva.com`)
2. Visit `/intelligence` → ask Sentinel to validate a synthesis that has a known contradiction → verify a `cross-agent-contradiction-flag` signal lands in the store (broker bundle dump in dev tools)
3. Visit `/programs/apx-cdp-2026` → verify Nexus's reactive panel shows the cross-agent card with Sentinel provenance
4. Visit `/home` → verify Atlas's panel shows the same signal at portfolio scope
5. Trigger `raiseMaestroFlag` (via existing UI or test fixture) → verify same flow
6. Verify time-decay: artificially set `emittedAt` to 30 days ago → signal should NOT appear

---

## §10 · Founder review focus

1. **Boundary respected end-to-end.** Any direct `SignalStore` import from app-tier is a rejection.
2. **Provenance visible on every cross-agent card.** Cards without "surfaced X ago by Y" are a smell — the whole point of the wave is making the agent team's work legible.
3. **Read-only contract honored.** App tier only reads from the broker; never writes to the store directly.
4. **Tenant scoping airtight.** No cross-tenant signal leakage; verified by tests.
5. **Voice consistency.** Nexus referencing "Sentinel flagged this 12 min ago" — that's the senior PM-of-staff posture. Nexus presenting the same flag as its own observation is a regression.
6. **Each PR stays scoped.** PR-CRA-A is types + interface (small); PR-CRA-B is broker extension (small); PR-CRA-G is the prompt + card render (mid). Bloat in any single PR is a smell.
7. **No corpus drift.** Codex's continuing corpus authoring is independent — this session does not touch `PAT-SRC-*` files.

---

## §11 · What this unblocks

After Wave 3 ships:
- **Wave 4 cross-program portfolio reasoning** becomes implementable (Atlas at `/home` reasons over signal-store entries from all programs)
- **Wave 5 longitudinal pack evolution** has the signal stream it needs (every anti-pattern firing + outcome → input to weight updates)
- **Demo to a CIO survives 60 minutes of stress-testing.** Today you can show Atlas at `/home` and Nexus at `/programs/<id>` working independently. After Wave 3, you can show them collaborating — which is the actual sales narrative for an agent stack.

This is the wave that turns a smart product into a credible team.
