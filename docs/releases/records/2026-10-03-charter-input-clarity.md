# 2026-10-03-charter-input-clarity — Make charter inputs show what to write

## Release ID

`2026-10-03-charter-input-clarity`

## Status

`candidate`

## Plain-English Summary

On the Charter phase, each input box showed its own dense prompt as grey
placeholder text — so an empty field looked pre-filled, and nothing told the user
what a good answer looks like. This humanises the charter prompts and gives each
one a worked example that shows as the placeholder, so an empty box reads as
"empty, here's an example" instead of echoing the instruction back.

## Layer Impact

Release lane: `global-control-lane` — shared Moves phase-capture UI for all
clients, not feature-gated.

- `PRODUCTS` (Moves): the phase-capture contract (descriptions + a new `example`)
  and the three capture textarea render sites. No change to the stored field
  keys/labels (so generated artifacts and saved records are unaffected), evidence,
  gates, or any other behavior.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — the Charter phase capture on every Move.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/programs/phase-capture-contract.ts`: add an optional `example` to
  `PhaseCaptureSection`; rewrite the seven P1 charter descriptions in plain
  language and give each a concrete worked example. Field `key`s and `label`s are
  unchanged (labels still feed the generated artifact's saved-capture summary).
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: all three
  capture textarea render sites use `example` as the placeholder (falling back to
  "Write your answer here.") instead of echoing the description.
- Tests: the contract gives every free-text charter input an example and drops
  the internal phrasing; the rendered empty sponsor field shows the example as its
  placeholder, not the prompt.

## QA / Validation

- `npx jest src/lib/programs/__tests__ src/components/strategic-moves` — 122
  suites / 1,138 tests pass.
- Scoped `tsc`: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: open a Move's Charter after deploy and confirm
  each empty input shows an "e.g. …" example, not the prompt repeated.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy workflow.
No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- This improves input clarity only. The larger charter-UX rework (a horizontal
  step stepper, persistent aVa, one clear next action — the Source New pattern)
  is a separate, larger effort.
