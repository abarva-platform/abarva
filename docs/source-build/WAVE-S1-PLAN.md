# Source Wave S1 Plan · Shell Convergence + Token Refresh

**Status:** Shipped — PR #545 merged 2026-04-28
**Branch:** `source/wave-S1/shell-convergence`
**Catalog entries:** Chrome only — all routes

---

## Scope

- Replace 3-layer shell stack (SourceRouteShell → SourceCanonShell → SourceFoundationShell) with AppShell from `src/components/shell/`
- Migrate all 6 Source page routes to paper aesthetic via shell tokens
- Delete 4 shell files (SourceCanonShell, SourceFoundationShell, SourceRouteShell, foundationStyles.ts)
- Create 3 new thin wrapper components (SourceWorkingPane, SourceMiddleStrip, SentinelAgentColumn)
- Inner panel content (AbarVaSourceDashboard, SourceEventsPortfolio, etc.) is **not changed** — they get re-mounted inside AppShell working pane

**Out of scope:** Any working-pane content changes. No data layer changes. No new routes.

---

## File-level diffs (estimated)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/SourceCanonShell.tsx` | delete | -120 | Replaced by AppShell |
| `src/components/source/SourceFoundationShell.tsx` | delete | -180 | Replaced by AppShell |
| `src/components/source/SourceRouteShell.tsx` | delete | -90 | Replaced by AppShell |
| `src/components/source/foundationStyles.ts` | delete | -45 | Old palette |
| `src/components/source/index.ts` | modify | -4 | Drop 3 shell exports + foundationStyles |
| `src/components/source/SourceWorkingPane.tsx` | new | +35 | Thin working-pane padding/scroll wrapper |
| `src/components/source/SourceMiddleStrip.tsx` | new | +60 | Filter slot bar (stage, status, linked-to, sort, search) |
| `src/components/source/SentinelAgentColumn.tsx` | new | +45 | Pre-bound AgentColumn with Sentinel identity |
| `src/app/(maestro)/source/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/events/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/events/[eventId]/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/value/page.tsx` | modify | +15 -8 | Wrap in AppShell + SentinelAgentColumn |
| `src/app/(maestro)/source/[eventId]/page.tsx` | delete | -40 | Stale duplicate route (pre-events/ restructure) |

**Net change estimate:** +200 added, -495 deleted = -295 net. Well under 500-line auto-merge limit.

---

## Component dependency graph (post-S1)

```
AppShell (src/components/shell/)
  ├── AppRail
  ├── AppTopBar
  ├── AppMiddleStrip
  │     └── SourceMiddleStrip (new)
  │           └── StageTrackerStrip | FilterPillStrip
  └── body (flex row)
        ├── SentinelAgentColumn (new)
        │     └── AgentColumn
        └── SourceWorkingPane (new)
              └── <page content: AbarVaSourceDashboard | SourceEventsPortfolio | ...>
```

---

## Knowledge fabric contract changes

- New `provenance` props: None in S1 (chrome only)
- New evidence ledger entries: None
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot tests: 3 new snapshots (SourceWorkingPane, SourceMiddleStrip, SentinelAgentColumn)
- Visual regression baseline: Yes — captures all 6 routes at paper aesthetic as new baseline
- Smoke test S-SMOKE-AMS: All 3 AMS storyline steps must pass (events list → event canvas → scorecard), confirming shell swap didn't break data rendering

---

## Risk & mitigation

- **Highest-risk change:** Deleting `/source/[eventId]/page.tsx` — if any nav or link points there, it becomes a 404. Mitigation: grep all hrefs before deletion.
- **Rollback:** `git revert <merge-commit>` restores all 4 shell files and page wrappers atomically.

---

## Auto-approval claim

This PR **meets** auto-approval criteria per §10:
- Plan approved (S0)
- Net change ≤ 500 lines
- No §13 escalation files modified
- Smoke test plan covers AMS
- Snapshot tests added for all new components
- No TODOs/console.logs
- No new dependencies
