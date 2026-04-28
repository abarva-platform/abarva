# Source Wave S6 Plan · Cross-surface Storyline + States

**Status:** Planned (starts after S5 merge) · May split into S6a + S6b
**Branch:** `source/wave-S6a/storyline-states` (and optionally `source/wave-S6b/intake-flow`)
**Catalog entries:** SRC-STA-LINKED-PROG · SRC-EMP-NO-EVENTS · SRC-ERR-EVENT-NOT-FOUND · SRC-MOD-EVIDENCE · SRC-MOD-CONTRADICTION · SRC-FLW-INTAKE

---

## Scope

Final wave. Ships the cross-surface storyline chip, empty/error states, evidence drawer (making provenance visible), contradiction surfacing, and the intake flow wizard. Completes all 12 catalog entries.

**Out of scope:** Any redesign of existing working-pane components.

---

## Split decision

This wave is large. It will split:
- **S6a:** SRC-STA-LINKED-PROG + SRC-EMP-NO-EVENTS + SRC-ERR-EVENT-NOT-FOUND + SRC-MOD-EVIDENCE + SRC-MOD-CONTRADICTION (~300 lines net)
- **S6b:** SRC-FLW-INTAKE (multi-step wizard, ~200 lines net)

---

## File-level diffs (estimated — S6a)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/shell/LinkedProgramChip.tsx` | verify+minor | ±15 | Already built; verify bidirectional with Programs |
| `src/components/source/LinkedProgramBadge.tsx` | modify | +20 -10 | Refresh hover preview; use LinkedProgramChip from shell |
| `src/components/source/SourceEmptyState.tsx` | new | +60 | SRC-EMP-NO-EVENTS — Sentinel voice "no events yet" |
| `src/app/(maestro)/source/events/page.tsx` | modify | +15 | Render SourceEmptyState when events.length === 0 |
| `src/app/(maestro)/source/events/[eventId]/page.tsx` | modify | +10 | notFound() with paper aesthetic + Sentinel voice |
| `src/components/source/SourceArtifactDrawer.tsx` | modify | +40 -10 | SRC-MOD-EVIDENCE: make provenance visible (data-provenance attrs + body.show-provenance) |
| `src/components/source/SourceContradictionCard.tsx` | new | +80 | SRC-MOD-CONTRADICTION — side-by-side diff + Sentinel diagnosis |
| `src/components/source/__tests__/SourceEmptyState.test.tsx` | new | +25 | Snapshot |
| `src/components/source/__tests__/SourceContradictionCard.test.tsx` | new | +30 | Snapshot |

**Net change estimate (S6a):** ~+280 lines. Under 500.

---

## File-level diffs (estimated — S6b)

| File | Action | Lines est | Reason |
|---|---|---|---|
| `src/components/source/SourceIntakeForm.tsx` | new | +180 | SRC-FLW-INTAKE — multi-step originate wizard |
| `src/app/(maestro)/source/new/page.tsx` | modify | +20 -40 | Wire SourceIntakeForm; remove old placeholder |
| `src/components/source/__tests__/SourceIntakeForm.test.tsx` | new | +40 | Snapshot (happy path) |

**Net change estimate (S6b):** ~+200 lines. Under 500.

---

## Mockups required (6)

| ID | File |
|---|---|
| SRC-STA-LINKED-PROG | `docs/source-build/mockups/src-sta-linked-prog.html` |
| SRC-EMP-NO-EVENTS | `docs/source-build/mockups/src-emp-no-events.html` |
| SRC-ERR-EVENT-NOT-FOUND | `docs/source-build/mockups/src-err-event-not-found.html` |
| SRC-MOD-EVIDENCE | `docs/source-build/mockups/src-mod-evidence.html` |
| SRC-MOD-CONTRADICTION | `docs/source-build/mockups/src-mod-contradiction.html` |
| SRC-FLW-INTAKE | `docs/source-build/mockups/src-flw-intake.html` |

---

## Knowledge fabric contract changes

- `provenance` becomes **visually surfaced** in `SourceArtifactDrawer` (Evidence Drawer) — this is the intentional iceberg reveal
- `SourceContradictionCard` surfaces contradiction data from `agent-validation.ts`
- Changes to query surface: **NONE**

---

## Test plan

- Snapshot: SourceEmptyState, SourceContradictionCard, SourceIntakeForm (happy path)
- New integration tests: empty state render, not-found handling, intake form step progression
- Smoke test S-SMOKE-AMS: Full run including step 3 (scorecard), plus verify empty state is not shown for seeded tenant

---

## Risk & mitigation

- **Highest-risk:** `LinkedProgramChip` already exists in shell — must not duplicate; verify bidirectional rendering
- **Rollback:** `git revert <S6a-merge>` and `git revert <S6b-merge>` independently

---

## Completion

When S6b merges, write `docs/source-build/COMPLETE.md`. Update WAVE_ROADMAP.md to mark all waves shipped. Tag `source-wave-S6-shipped-{date}`.

---

## Auto-approval claim

Both S6a and S6b **meet** auto-approval criteria per §10 (each independently under 500 lines, CI green).
