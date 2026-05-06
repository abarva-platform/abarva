# Source Audit · M3 · Chrome UI deployed

| Field | Value |
|---|---|
| Mode | M3 · Chrome UI deployed audit |
| Status | **Deferred — requires dedicated Chrome MCP session** |
| Audit date | 2026-05-06 (runbook written) |
| Estimated time | 8–10 hours when executed |

---

## Why deferred

M3 requires:
1. Chrome MCP tools loaded
2. Live login to `nexus-vert-kappa.vercel.app` as Apex client (`Demo2026!`) and possibly admin (OTP `424242`)
3. Walking 6 canonical routes for Apex Retail at multiple stages
4. Capturing screenshots and DOM text for each
5. Walking the same flow for AMS-Out 2026 to compare against the walkthrough prototype

The login flow alone consumes substantial tokens; doing it inside the same session as M1/M2/M4/M5 would have starved their depth. Better to run M3 as a focused session with its own context budget.

The findings already collected from M1/M2/M4/M5 give the redesign enough to begin without M3. M3 is confirmation work — verifying that the patterns we found in code render as expected in the browser.

---

## Runbook for execution

### Setup

1. Load Chrome MCP tools (`ToolSearch` query: `claude-in-chrome`, max_results: 30)
2. Confirm Chrome extension is connected (`mcp__Claude_in_Chrome__list_connected_browsers`)
3. Navigate to `https://nexus-vert-kappa.vercel.app`
4. Log in as Apex client using credentials in memory: `apex@…` / `Demo2026!`

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
- Nexus-at-Strategy vs Nexus-at-Scope vs Nexus-at-RFP vs Nexus-at-Responses vs Nexus-at-BAFO vs Nexus-at-Selection vs Nexus-at-Transition

If average score below 3 (low differentiation), this is the strongest evidence for agent decomposition. If above 4 (high differentiation), the universal canvas works.

Per F-M4-103, the code-level finding suggests scores will be low. M3 should confirm.

### Walkthrough comparison

Open `/Users/anand/Downloads/AMS-Out Walkthrough _ standalone.html` in a separate tab and walk the 6 scenes. For each scene, compare to the deployed AMS-Out 2026 event flow.

Note any places where:
- The walkthrough scene exists but the deployed flow is different
- The walkthrough scene exists but no equivalent deployed surface exists
- The deployed flow has surfaces the walkthrough doesn't show

### Multi-tenant sweep (vocabulary only)

Log in as Arcturus, Meridian, and admin tenants. For each, visit `/source` and capture the events list. Verify:
- Agent names spelled correctly (Nexus / Sentinel / Steward / Atlas)
- Stage names match canonical 11
- No vocabulary divergence

Do NOT fail-flag tenants that have no Source data — that's expected per memory (Apex is the only tenant with a real data drop).

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

The code-level grep (M2) found code is disciplined; M3 verifies the discipline holds at the rendered DOM.

---

## Expected output structure

When M3 runs, produce:

`docs/build/audit-out/SOURCE_AUDIT_M3_CHROME.md` (replaces this stub) with:

- 1 compliance findings section
- 1 drift findings section
- 1 design observations section
- T03 genericness test scores per stage
- Walkthrough vs deployed comparison table
- Multi-tenant vocabulary sweep results

Plus screenshots in `docs/build/audit-out/screenshots/m3/` organized by route.

---

## What the deferred M3 protects

The audit is not invalidated by M3 being deferred — but M3 closes specific gaps:

- F-M2-201 (component duplication) — confirms whether the duplicated commercial panels actually render or are dead code
- F-M2-202 (three-shell stack) — confirms the rendered shell hierarchy
- F-M4-103 (stage-generic voice) — provides live evidence for the redesign decision
- F-M5-105 (artifact state visibility) — confirms which states the user actually sees

Until M3 runs, treat these findings as substrate-level claims that need browser confirmation.

---

End of M3 runbook.
