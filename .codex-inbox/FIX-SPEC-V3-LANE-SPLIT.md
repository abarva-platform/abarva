# Fix Spec v3 · lane split for Codex + Claude

**Read `fix-spec-v3-for-codex.md` for full detail. This file is the assignment plane and status table.**

## Decision · who takes what

| # | Item | Est | Assign | Why |
|---|---|---|---|---|
| 1 | Page width + font global pass | 1-2h | **Claude** | Claude already widened EngagementConsole + bumped fonts on PR #39. Wrapping up with a root-CSS + `max-width: 1280px` pass is same surface area. |
| 2 | Homepage metrics restructure | 2-3h | **Claude** | Claude authored the Own/Build/Keep section + Control Tower block in PR #36 + merged. Splitting stats into "transformation value gap" + "our commitment" is contiguous work. Anand writes final copy. |
| 3 | Pattern page full depth | 4-6h | **Codex** | Vendor Knowledge Layer is content-heavy. Codex's seed-wave muscle memory fits. **Anand picks:** Shadow AI Governance OR Owned Brand Margin. |
| 4 | Topic page full depth · Change Management for AI | 3-4h | **Codex** | Same lane as #3. Parallel content depth pass. |
| 5 | Dead link audit (ship or hide) | 1-2h | **Codex** | Cross-surface, catalog + shippable. Claude's review bandwidth goes to #1/#2/#7. |
| 6 | Deliverables content generation | 4-6h | **Codex** | Runtime wiring + template consumption. Builds on Codex's PR #28 charter template + A1 phase 1-4 templates. |
| 7 | Authenticated home tenant breadth row | 4-6h | **Claude** | Extends Claude's C11 home on PR #36. Breadth row is a new section in existing component. |

## Sequencing

**Day 1 (first 18h):**
- Parallel: Claude #1 → #2, Codex #3 (Anand's pick) + #5
- Dead link audit finishes early → fewer surprises for remaining items

**Day 2 (next 18h):**
- Claude #7 · tenant breadth row (after PR #36 merges so we're not double-stacking)
- Codex #4 topic depth + #6 deliverables wiring

## Blockers Anand owns (non-delegable, per spec §"What Anand owns")

1. **Copy** for homepage sections 2, 3, 5 — need voice-tight drafts before Claude's #2 ships
2. **Pattern pick** — Shadow AI vs Owned Brand Margin for #3 · tell Codex which
3. **Opinion statements** in pattern/topic content — the "AbarVa point of view" · Codex drafts neutral, Anand layers opinion
4. **Dead-link decisions** — each 404 in #5: ship / hide / redirect · Codex lists, Anand decides

## Vendor Knowledge Layer principle (applies to every content surface)

Per spec: every content surface must signal all three:
1. **Current knowledge** · 2026-specific, not 2022-stale references
2. **Architectural opinion** · a structural POV, not neutral framing
3. **Specificity** · named tools, practitioners, research, not categorical framing

If a page doesn't hit all three, it's not done.

## Do not do

- Don't start the 18-item post-Prat backlog (§"Post-Prat backlog"). It's captured, parked.
- Don't expand pattern/topic depth beyond the ONE each for #3 and #4 · other patterns/topics stay thin.
- Don't touch areas that Claude's PR #36 is about to land (home composite + program detail + homepage).

## Coordination

- Anand reviews PRs in order they land; demo-critical first
- Claude ships on feature branches, opens PRs, requests Anand review, does not auto-merge
- Codex same
- Tasks tracked as #102-#108 in the task list
