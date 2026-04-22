# Claude Code · Prat demo readiness · 72-hour sprint plan

**Overrides the earlier README-CLAUDE-ASSIGNMENT.md queue.** Read `prat-demo-readiness-sprint.md` for the full brief.

## What changed vs the earlier Wave 3 plan

1. **ONE composite, not four.** Apex only. Keystone / Meridian / First Capital deep-demo-readiness defers. C11 ships with Apex-rich data, others render with thinner empty states.
2. **Day 1 priority order is C1 before C17.** Homepage must ship with the Own/Build/Keep section because Prat sees it before walking in. C17 depth is Day 2.
3. **C21 Briefing surface defers.** The briefing renders inline on C11; standalone list/detail page not demo-critical if C11's inline briefing lands.
4. **C4 Investor page optional.** Deferred unless Anand signals Anthology Fund conversation is in the same window.

## Execution order

### Day 1 remaining (T-48 to T-24)

| # | Task | Est | Status |
|---|---|---|---|
| Done | Shared components (PR #36) | 1h | ✅ shipped |
| Done | C11 Composite Home scaffold + Apex empty-state wiring | 2h | ✅ committed |
| **Next** | **C1 Homepage · Own / Build / Keep section + Control Tower section** | 2-3h | **starting now** |
| Parallel | C11 Apex depth enrichment · briefing stub with 3-4 static items + realistic portfolio signals | 2h | queued |

### Day 2 (T-48 to T-24 continued into T-24)

| # | Task | Est |
|---|---|---|
| 3 | C17 Program Detail · 5-phase visualization + Journey/Stream/Stakeholders tabs | 4-5h |
| 4 | Cross-surface navigation verified end-to-end · briefing → entity → detail → back | 1h |
| 5 | Performance audit · target <2s perceived on every transition | 1h |

### Day 3 (T-24 to T-0)

| # | Task | Est |
|---|---|---|
| 6 | Polish pass · home + homepage + program detail · hover states + keyboard nav + reduced-motion | 2h |
| 7 | Demo dry-run × 3 with timing · fix any surface >2s | 2h |
| 8 | Anand copy review on C1 · Own/Build/Keep voice tuning | per Anand |

### Deferred (keep on backlog, not demo-blocking)

- C4 Investors page · only if Anthology Fund window aligns
- C21 standalone briefing list/detail · inline briefing covers demo
- Meridian / Keystone / First Capital tenant-specific enrichment · one composite deep beats four shallow per sprint §What defers

## Coordination with Codex

Codex's parallel sprint work:
- C12 Marcus Whitfield profile (Apex composite) · demo-critical
- C14/C15 KPI + Pattern Detail for Shadow AI + Owned Brand Margin patterns
- Data depth backfill · 35+ KPIs, 3+ contradictions with evidence, 5+ patterns seeded, Stream view activity for 1 program

Claude's lane doesn't overlap with Codex's unless Codex pulls into home components. If a conflict appears, I commit and surface.

## Success gate (per sprint §Verification)

The test isn't "did the demo work" — it's "does Prat leave wanting to be design partner."

Three of six signals → demo worked:
- Asks about deployment timeline unprompted
- Echoes three planes back in his words
- Names a specific program that AbarVa fits
- Probes Own/Build/Keep phrasing
- Asks about outcome-participation structure
- Offers to introduce another CXO
