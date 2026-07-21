# Codex handoff — Port P1-P5 onto the P0 universal shell model

**Date**: 2026-07-21
**Context**: `docs/backlog/moves-product-backlog.md` § MOVES-UI-006. P0 Originate was rebuilt
to match the owner-approved reference shell design 1:1 (real content styling, not just chrome
around it) in PR #5219 ("feat(moves): align P0 with phase shell contract") + release record
`docs/releases/records/2026-07-21-moves-p0-html-contract-shell.md`, with a follow-up polish PR
(P0 canvas-width fix, commit `c967dc7bb`). This is now confirmed as the **canonical reference
shell** for the whole Moves phase workspace — read that PR's diff and release record in full
before starting, they are the source of truth for the visual/structural target, not any prior
MOVES-UI-001/002/003/004 work in this backlog (those predate this and used a narrower,
chrome-only approach that the owner explicitly rejected as not matching the reference 1:1).

## What P0's shell actually did (study this, don't guess)

Per its own release record: replaced the P0 origination visual path with the reference
contract — persistent journey rail, workspace links, centered phase header, Steps/Files/
Intelligence tabs, two-pane step-detail canvas, and a final Approve & Build step — while
**preserving the existing seven-field P0 data contract, aVa extraction flow, direct field
entry, and `/api/programs/origination-submit` payload behavior.** It removed the old
gated/wizard wrapper entirely for `/strategic-moves/new` — **no feature flag**, a direct
replacement, because P0 origination has no gate-approval consequences the way P1-P5 do.

## Critical difference for this task: P1-P5 carry real risk P0 didn't

P0's origination flow doesn't touch `evaluateGate()`, the two-sequential-calls Approve & Build
flow (`PhaseApproveAndBuild.tsx` → `approvePhaseGateAfterBuild`), or any already-live
governed data. **P1-P5 do.** Read `docs/backlog/moves-product-backlog.md` §§ `MOVES-GATE-001`
through `MOVES-GATE-004` before touching anything — this program has a real, expensive
incident history (a Move was once advanced on fabricated evidence) from exactly this kind of
surface. Because of that history:

- Port ONE phase at a time, not all five in one PR. Start with P1 Charter (simplest data
  contract) and prove it live before moving to P2.
- **Do this behind the existing `moves_finder_shell_v1` flag** (already registered in
  `src/lib/features/registry.ts`, currently `policy: "platform"` / default-on for all
  tenants) — unlike P0, which shipped as a direct replacement. P1-P5 sit in
  `MovesPhaseStandaloneClient.tsx`, a single 3,400+ line file already carrying real
  production traffic and the gate/approval logic; a flag gives an instant rollback lever
  (`excludeTenants`) if something in the port breaks a live Move's gate flow. Reuse the exact
  same flag-check pattern already in that file (`useFeature("moves_finder_shell_v1")` +
  error-boundary fallback) rather than inventing a new one.
- Preserve, byte-for-byte, every piece of real business logic in the current
  `MovesPhaseStandaloneClient.tsx`: `PhaseApproveAndBuild`'s two-sequential-calls behavior,
  `governance.ts`/`evaluateGate()`, the Files & Evidence upload wiring, the
  `moves_approvals_overview_v1`-gated Approvals overview, `getPhaseCaptureSections`/
  `phaseCaptureValues`, `buildNextPhaseReadinessPack`. This port is a **presentation** change —
  restyle how these are shown, do not change what they do or when they fire.

## Task, per phase (repeat for P1, then P2, ... P5)

1. Read the phase's current rendering in `MovesPhaseStandaloneClient.tsx` in full before
   changing it.
2. Restyle the phase's step content to match the P0 reference shell's visual language exactly
   (same typography, spacing, card treatment, tab styling as P0 now has) — real content
   styling, not just the rail/tab chrome (that part is already done from earlier
   MOVES-UI-001/003/004 passes and should not regress).
3. Do not alter what data is fetched, what triggers a gate evaluation, or the shape of any
   API call. If the visual redesign genuinely requires a different data shape, stop and flag
   it rather than improvising a schema change — none is authorized here.
4. Gate the phase's new rendering behind `moves_finder_shell_v1` (flag off → today's exact
   current rendering for that phase, byte-for-byte).
5. Test: flag-off byte-parity; flag-on renders the new styling with real data (no fabricated
   content); the Approve & Build flow for that phase still fires as two sequential calls, not
   one combined action; file upload for that phase still works via the real upload endpoint.
6. Validate: `npx eslint`, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty
   false -p tsconfig.json` (this project's known local-OOM workaround), a PostCSS parse check
   on any touched `.module.css` file (a real syntax error — a stray `*/` inside a CSS comment
   — broke a production build earlier today; a plain lint pass did not catch it, only a real
   parse does), `npm run release:check`, `git diff --check`.
7. Open the PR with a release record (this repo's release-control discipline — see
   `docs/releases/templates/release-record-template.md`). Get an ACA deploy, verify the
   runtime invariant (template image = 100%-traffic revision image), and get a real signed-in
   production visual proof before considering that phase done — do not claim "live" without
   this.

## Explicit non-goals (same as every MOVES-UI-00x item before this one)

No schema migration. No new approval-model fields. No change to `evaluateGate()` semantics or
`GATE_RULES`. No fabricated per-role approval rows or `requires_revalidation` state — those
remain design-doc-only until `MOVES-ARTIFACT-001` ships (separate, owner-gated work).

## Report format

For each phase ported: what changed, files touched, test results, deploy evidence (PR #, merge
SHA, ACA revision, runtime-invariant confirmation), and an honest note on whether the visual
result actually matches the P0 reference shell 1:1 — if it doesn't, say so plainly and name
the gap, the same standard this program has held to all day.
