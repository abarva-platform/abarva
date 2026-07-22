# 2026-07-22-moves-p2-decision-surface-redesign — Gate-approval decision surface redesign

## Release ID

`2026-07-22-moves-p2-decision-surface-redesign`

## Status

`candidate`

## Plain-English Summary

The Moves phase-workspace "Gate approval" step (P0-P5, most visibly P2 Understand Current
State) rendered as a long, mechanical page: a generic 3-row status table, a 4-quadrant "exec
readout", a phase-specific gate-criteria block that only P0 got eagerly (P1+ had it collapsed),
and a floating approve button below all of it. Real user feedback after the P2 gate-block fix
(PR #5286-#5290) was that the product correctly blocked a weak deliverable, but the page did a
poor job explaining why — too cluttered to read as a decision.

This PR restructures that section into a four-part decision surface, in the order a reviewer
actually needs it:

1. **Decision needed** — a clear headline ("Approve P2 Understand Current State?") plus a
   status pill ("Gate ready · N/M" or "Gate blocked · N/M hard met"), replacing the generic
   "Gate approval" h2.
2. **Evidence supporting it** — approved evidence count + hard-gate-met count, one line.
3. **Quality & blockers** — the specific blocking hard criteria and soft caveats, visually
   flagged (amber) when the gate is blocked, instead of buried in a "what remains uncertain"
   quadrant.
4. **What happens next** — unchanged, tells the reviewer what the next phase needs.

The primary Approve & Build action sits directly under these four cards, not below an
additional ledger table.

Everything mechanical — the generic gate-attestation ledger, the full gate-criteria list (hard/
soft with per-item state), what Nexus generated this phase, and next-phase readiness/templates
— moves behind `<details>` disclosures, uniformly for every phase (previously P0 had an
eagerly-rendered "Gate criteria" section while P1+ had it collapsed; this removes that
special-casing so behavior is consistent across all six phases).

No governance, gate-evaluation, or Approve & Build wiring changed — this is presentation-only.

## Layer Impact

- **Presentation only.** `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`:
  reorganizes JSX inside `PhaseBody`'s "Gate approval" section and adds CSS classes
  (`mxw-decision-head`, `mxw-decision-eyebrow`, `mxw-decision-pill`, `mxw-decision-cards`,
  `mxw-decision-blocked`) styled consistently with the existing `mxw-exec-readout`/`mxw-gate`
  visual language (same border/radius/shadow tokens, no new color tokens). No changes to
  `governance.ts`, `evaluateGate()`, `PhaseApproveAndBuild.tsx`'s props/wiring, or the
  two-sequential-calls `onBeforeBuild`/`onBuildSettled` pattern.

## Client Applicability

- All clients: yes — this is the shared Moves phase-workspace shell, not behind a
  client-specific flag (same visibility as the existing `moves_finder_shell_v1`-gated shell)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none added/changed — inherits whatever shell flag already gates this page

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — decision-surface
  restructure of the `PhaseBody` gate-approval section; unifies gate-criteria disclosure
  behavior across all phases (was P0-eager / P1+-collapsed, now collapsed for all phases);
  new CSS rules
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — updated 5
  assertions that targeted the old static "Gate approval" heading / old copy to match the new,
  intentionally different real headings and copy (e.g. `"Approve P1 Charter?"`, `"What Nexus
  generated this phase"`); no assertions were weakened, only retargeted at the same underlying
  behavior with new real text

## QA / Validation

- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: clean
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`:
  44/44 passing
- Full `strategic-moves/__tests__` suite: 91/91 passing (1 pre-existing, unrelated
  Clerk/Jest-transform failure in `moves-liability-visible-controls.test.tsx`, confirmed via
  `git stash` to predate this change)
- Inline `<style>` CSS block validated with a standalone PostCSS parse — clean (local `next
  build` isn't runnable in this sandbox; `git show` used the same technique for the earlier
  MOVES-UI-004 CSS-comment bug this session)
- `tsc --noEmit` crashed locally with a V8 stack-overflow abort (exit 134) — a known,
  machine-level crash unrelated to this change (this repo's CI is the authoritative typecheck,
  per prior session precedent); not yet confirmed green in CI as of this record

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — ships to whichever tenants already see this phase-workspace shell.
3. Live signed-in click-through recommended on the real P2-blocked Move ("AI MEMBER ASSIST
   TRANSFORMATION", currently `Gate blocked · 3/5 hard met`) to confirm the new decision
   surface renders correctly against real blocked-gate data, without taking any mutating
   action on that Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a
- Feature/env flag update path: no flag/env change in this PR
- Live signed-in proof required: yes, on a real gate-blocked Move — not yet completed as of
  this record

## Rollback Plan

Revert the merge commit — presentation-only change, no data/schema/migration involved.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `docs/backlog/moves-product-backlog.md` (P2 review UX follow-up to
  PR #5286-#5290)
- Prior P2 gate-block fix record: `docs/releases/records/2026-07-22-moves-p2-review-approval-ux.md`

## Known Gaps

- Local `tsc --noEmit` could not complete due to a machine-level crash; CI's typecheck run must
  be confirmed green before treating this as fully validated.
- Live signed-in proof against the real blocked Move (P2, "AI MEMBER ASSIST TRANSFORMATION")
  is not yet captured — recommended before closing this out as `live-proven`.
- No visual/browser screenshot proof was captured in this session (the local dev server runs
  from a different git branch than this change; a same-branch preview was not available).
