# Source Audit · M3 · Chrome UI deployed

| Field | Value |
|---|---|
| Mode | M3 · Phase 3 post-ship spot-check |
| Status | **Phase 3 verified — 2026-05-06** |
| Audit date | 2026-05-06 16:05 UTC |
| Tenant | Apex Retail (`maya.desai@apex-retail.example.com`) |
| Event | AMS Outsourcing 2026 · `apex-retail-ams-outsourcing-2026` |
| PR verified | [#1594](https://github.com/anandsundaram-hash/abarva/pull/1594) — Sentinel-front orchestrator |

---

## Phase 3 spot-check findings

### ✅ Single Sentinel voice block confirmed

**Before Phase 3:** `buildSourceMultiAgentBriefing` emitted four parallel briefing blocks (Nexus, Sentinel, Atlas, Steward) in the left-panel chat lane.

**After Phase 3:** `buildSentinelSourceBriefing` emits a single Sentinel-voiced primary block. Verified at three stages:

| Stage | Left-panel primary text | Right-rail header |
|---|---|---|
| BAFO (active, step 7/11) | "AMS Outsourcing 2026 at BAFO." | "Sentinel is running BAFO" |
| Scope (completed, ?stage=Scope) | Same as active stage — event is at BAFO | "Sentinel is running BAFO" |
| Pricing (completed, ?stage=Pricing) | Same as active stage — event is at BAFO | "Sentinel is running BAFO" |

The stage parameter updates the URL but the primary voice reflects the event's live stage, which is correct behavior.

### ✅ Sentinel labeled SOURCE ORCHESTRATOR

Left panel header: `Sentinel · SOURCE ORCHESTRATOR · Active` — confirmed at all three stage views.

No "Nexus" label appears anywhere in the primary voice panel. The identity sweep from PR #1596 and orchestrator wiring from PR #1594 are both live.

### ✅ Specialist contributions in card grid (not parallel blocks)

Right rail shows a clean 2×2 card grid:
- **SENTINEL · Workflow conductor** — "Receive BAFO responses from Northstar and ArcVault by May 15. Then prepare the team for the next gate with inputs, session plan, and output packet."
- **STEWARD · Gate / approval in review** — "No hard blocker recorded yet. Steward still needs evidence before the gate can be treated as clear. Waivers need explicit rationale; approvals are placeholders until the engine is wired."
- **SENTINEL · Evidence and files** — "Paperclip uploads, pasted notes, and vendor files must become validated evidence before they support recommendations."
- **ATLAS · Artifacts and executive decision** — "Decision posture: Select preferred AMS partner from BAFO responses by May 30, 2026. Generate the right HTML, Word, or Excel packet before review."

The four-specialist flavors (Sentinel×2, Steward, Atlas) surface as labeled role cards in the right rail — not as four equal-weight peer text blocks competing for visual priority.

### ✅ Source portfolio dashboard — single Sentinel voice

At `/source` (portfolio view), the left panel showed a single Sentinel brief:
> "4 source events in view - 1 active - 0 at risk. AMS Outsourcing 2026 is the top mission signal at BAFO; next action: Receive BAFO responses from Northstar and ArcVault by May 15."

No four-block parallel display. The Sentinel orchestrator's `buildSentinelSourceBriefing` produces one combined summary routed through the `AbarVaSourceDashboard` back-compat adapter.

### ✅ Ask Sentinel prompt bar present

Both the portfolio view and the event canvas show the "Ask Sentinel..." prompt bar at the bottom of the left panel.

---

## Phase 3 architecture verification summary

| Check | Result |
|---|---|
| `buildSentinelSourceBriefing` is the active code path | ✅ Confirmed (specialist cards visible, single voice) |
| Primary voice = Sentinel | ✅ Confirmed |
| Specialist rank order preserved (Steward gate card present) | ✅ Confirmed |
| No four-block parallel display | ✅ Confirmed |
| `leadAgent = 'Sentinel'` visible in UI labels | ✅ Confirmed |
| Back-compat adapter wiring intact (dashboard renders) | ✅ Confirmed |

---

## Full M3 audit (runbook)

The broader M3 audit covering all 6 canonical routes, T03 genericness test, walkthrough comparison, multi-tenant vocabulary sweep, and forbidden-claims live sweep is deferred — see original runbook below. The Phase 3 spot-check above closes the specific verification gate for PR #1594.

---

## Original M3 runbook (for full audit when scheduled)

### Setup

1. Load Chrome MCP tools (`ToolSearch` query: `claude-in-chrome`, max_results: 30)
2. Confirm Chrome extension is connected (`mcp__Claude_in_Chrome__list_connected_browsers`)
3. Navigate to `https://nexus-vert-kappa.vercel.app`
4. Log in as Apex client using credentials in memory: `maya.desai@apex-retail.example.com` / OTP `424242`

### Per-route walk

For each of the 6 canonical routes, capture:

1. **Screenshot** — save to `docs/build/audit-out/screenshots/m3/{route-slug}.png`
2. **Page text** via `mcp__Claude_in_Chrome__read_page`
3. **Vocabulary check** — agent names spelled correctly, stage names match canonical 11
4. **Forbidden-claims sweep** — search rendered text for the 15 prohibitions from dossier §3
5. **Design template comparison** — overlay screenshots against the corresponding template from `Source End-to-End.html`

Routes:

| URL | Design template ref | What to verify |
|---|---|---|
| `/source` | T01 Portfolio | Stat cards, filter pills, portfolio rows, agent labels in blocker text |
| `/source/events` | T01 Portfolio (variant) | Events list — same elements as `/source` |
| `/source/events/{apex-ams-out-2026}` | T03 Universal canvas | 11-step rail, chat lane, stage frame, gate panel, artifact shelf |
| `/source/events/{...}/scorecard` | T08 Scorecard | Weight set table, audit trail |
| `/source/events/{...}/artifacts/{...}` | T09 Artifact detail | Artifact body, version history, metadata rail |
| `/source/value` | T11 Value ledger | Stat cards (projected/committed/measuring/realized), ledger rows |

### T03 genericness test (most important M3 task)

Visit `/source/events/{apex-ams-out-2026}` at 7 different stages by triggering stage advance OR selecting different events at different stages. For each stage, capture the agent editorial block (chat lane content).

Score 1–5 for each comparison:
- Sentinel-at-Strategy vs Sentinel-at-Scope vs Sentinel-at-RFP vs Sentinel-at-Responses vs Sentinel-at-BAFO vs Sentinel-at-Selection vs Sentinel-at-Transition

If average score below 3 (low differentiation), this is the strongest evidence for agent decomposition. If above 4 (high differentiation), the universal canvas works.

### Walkthrough comparison

Open `/Users/anand/Downloads/AMS-Out Walkthrough _ standalone.html` in a separate tab and walk the 6 scenes. For each scene, compare to the deployed AMS-Out 2026 event flow.

### Multi-tenant sweep (vocabulary only)

Log in as Arcturus, Meridian, and admin tenants. For each, visit `/source` and capture the events list. Verify:
- Agent names spelled correctly (Sentinel / Steward / Atlas)
- Stage names match canonical 11
- No vocabulary divergence

### Forbidden-claims live sweep

For each route, run a DOM text search for these 15 patterns (case-insensitive):

1. "live telemetry"
2. "production ready" (without disclaimer adjacent)
3. "real-time" (without disclaimer)
4. "market benchmark" (without disclaimer)
5. "usable evidence" near "loaded" or "uploaded"
6. "final selection"
7. "select vendor" as a button label
8. "approve" buttons (verify they're real-backed)
9. "realized" near a savings number (without measurement-owner adjacent)
10. "production" claims about Source itself
11. "award" automation language
12. "auto-award"
13. Empty checkbox UI
14. "stub" or "mock" leakage to user-visible text
15. Generic "chat" placeholder where agent editorial should be

---

End of M3 audit.
