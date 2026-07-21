# 2026-07-21-source-stage-header-lead-agent-fix — Fix hardcoded aVa in Source stage header

## Release ID

`2026-07-21-source-stage-header-lead-agent-fix`

## Status

`released` — merged, deployed, ACA runtime invariant confirmed. Live signed-in proof
partially performed: the `aVa` branch is confirmed live and correct; the `Atlas` branch could
not be observed with currently-existing tenant data (see Known Gaps).

## Plain-English Summary

The Source event canvas's stage header printed "Stage NN · aVa" on every stage — including
Transition and Value — even though the canvas's own left-rail note, on the same page, says
"aVa guides steps 1-9 · Atlas takes over for Transition & Value." The header contradicted its
own rail note for the last two stages. Found while reviewing a user-provided Source Event
Shell redesign mockup against the live app: the mockup correctly showed "STAGE 11 · ATLAS"
for the Value stage, prompting a direct comparison against the live component that surfaced
the bug. Fixed by deriving the header label from the stage key (`transition`/`value` → Atlas,
all other stages → aVa) instead of a hardcoded string.

## Layer Impact

- `global-control-lane`: one presentational label inside `SourceAnalyticsCanvas.tsx`'s
  `StageHeader` component. No schema, no API route, no data model touched.

## Client Applicability

- All clients: yes — no gate, no flag, affects every Source event canvas view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: `StageHeader` now
  derives `leadAgentLabel` from `view.stage.key` instead of hardcoding `aVa`.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageHeader.test.tsx`
  (new): asserts `Stage 01 · aVa` for Strategy and `Stage 11 · Atlas` for Value.
- This release record.

Deliberately does **not** reconcile this with the separate, richer
`Nexus`/`Sentinel`/`Governance`/`Atlas`/`aVa` per-stage model already defined in
`stage-canvas-config.ts` (consumed by an older, different component,
`SourceStageCanvasPanel.tsx`) — whether that five-agent model should replace the rail note's
simpler two-way split is a separate product decision, not a bug fix.

## QA / Validation

- `pass` — `npx jest` on the new `SourceAnalyticsCanvas.stageHeader.test.tsx` plus the
  existing `SourceAnalyticsCanvas.guidebook.test.tsx` — 4/4 passed.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — no errors reference either changed file (pre-existing, unrelated errors in
  `MovesPhaseStandaloneClient.test.tsx` confirmed present on `origin/main` before this change).
- `pass` — `npx eslint` on both changed files — 0 errors.
- `pass` (partial) — **live signed-in browser proof performed**, unlike the rest of this
  session's Source work: used the already-authenticated Chrome session (claude-in-chrome,
  signed in as Anand Sundaram · Healthcare Demo tenant) against the real deployed
  `app.abarva.ai`. Opened a real event
  (`https://app.abarva.ai/source/events/c03ffe14-49fb-403e-8d47-ed23c9fea9e2`, "Healthcare
  Demo claims processing and adjudication platform support Sourcing Event") at its real
  current stage — confirmed the header reads exactly `STAGE 02 · AVA` for Scope, matching
  the fix's expected `aVa` branch and the rail note's own claim. This is a real positive
  control on live production data, not a fabricated claim.
  - **Not verified live**: the `Atlas` branch (Transition/Value). All 3 real events currently
    in this tenant's portfolio are at Strategy (step 1/11) or Scope (step 2/11) — none has
    reached Transition or Value. Attempted `?stage=value` query override on an intake-pending
    event; the server correctly redirected back to the intake-approval gate (real,
    correct product behavior — the canvas does not unlock before intake approval). Advancing
    a real event to Transition/Value would require approving its intake and driving it
    through 9 more real stage gates — a real, audit-logged, state-mutating sequence on
    production data, which was not performed without explicit authorization. The `Atlas`
    branch remains verified only by the unit regression test (`Stage 11 · Atlas` assertion
    in `SourceAnalyticsCanvas.stageHeader.test.tsx`), not by a live click-through.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Pure UI label change to an
existing, already-shipped surface — no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (runs automatically on
  merge to `main`).
- Shared runtime mutators: none from this PR directly — deploy happens via the standard
  workflow only.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:9ed818c5f56f616426107f0e177c75b6915c86c5c7166239bbb7edae96a85521`.
- ACA runtime invariant: **proven.** `az containerapp show` confirms the template image
  matches the digest above, active revision `ca-abarva-web-lab-eastus--m74ea0750` (matches
  merge commit `74ea0750c645bb6fc9cfaad69b7cf5b5a74b9ece`), 100% traffic.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — partially performed, see QA / Validation. The `aVa`
  branch is proven live; the `Atlas` branch is not, for the reason stated there.

## Rollback Plan

Revert the merge commit. Reverting restores the prior (buggy) hardcoded "aVa" label — a
regression in copy accuracy, not a functional defect (no data or workflow behavior depends on
this string).

## Audit Evidence

- PR: [abarva-platform/abarva#5192](https://github.com/abarva-platform/abarva/pull/5192),
  merged as `74ea0750c645bb6fc9cfaad69b7cf5b5a74b9ece`.
- Deploy: [aca-main-deploy #29835158468](https://github.com/abarva-platform/abarva/actions/runs/29835158468),
  `success`.
- Test/typecheck/lint logs: see QA / Validation.
- Live click-through: real screenshot of `STAGE 02 · AVA` on the real Healthcare Demo
  claims-processing event's Scope stage, captured in this session's transcript (not committed
  as a file).

## Known Gaps

- Live signed-in proof of the `Atlas` branch specifically (Transition/Value stages) is not
  performed — not for the usual Clerk-auth-wall reason (that gap is now closed for this
  tenant/session), but because no real event in the currently-available tenant data has
  reached those stages, and forcing one there would require real, audit-logged production
  mutations not authorized for this check. Covered by the unit regression test only.
- The broader question of whether the five-agent `stage-canvas-config.ts` model should
  replace the rail note's simpler two-way aVa/Atlas split is out of scope here and remains
  open.
