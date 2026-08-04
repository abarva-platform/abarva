# 2026-08-04-source-workspace-optimise-cta-and-fabrication-fix — Fix the "Select a contract to optimise" empty landing and a fabricated Cube-view claim

## Release ID

`2026-08-04-source-workspace-optimise-cta-and-fabrication-fix`

## Status

`candidate`

## Plain-English Summary

Live review found two issues in the Source Workspace's contract-list surface:

1. Both "Select a contract to optimise" buttons (the Context tile action and the Agenda lens's
   "optimise an existing contract" journey card) navigated to the "Notice deadline passed while
   active" saved view — which, as of the governed as-of date, legitimately contains 0 contracts. A
   button whose entire purpose is "let me pick a contract to work on" landing on a guaranteed-empty
   list is a dead end. Retargeted both to the "Two or more weak leverage signals" view (69 contracts
   today) — the semantically correct match for "optimise," since leverage-optimization candidates are
   exactly what that view surfaces, and "notice deadline passed" is a different, urgency-driven action
   (variation/standstill, not optimization).
2. The contract-list table's caption text — left over from the original illustrative design port and
   never corrected during the real-data-binding pass — claimed "Sort, filter and export happen
   server-side against the Cube view" (no Cube API runs anywhere in this deployment; sort/filter/
   export aren't implemented in this table at all) and "Nineteen material contracts are projected in
   this environment" (a fabricated number matching no real bucket size, and self-contradicting
   whatever the table is actually showing). Both corrected to describe what the page actually does.

## Layer Impact

- `client-data-lane`: both files are scoped to `src/app/(maestro)/source/preview/workspace/`. Pure UI
  text/navigation-target fixes — no calculation, schema, or query change.

## Client Applicability

- All clients: UI shell fixes, not tenant-scoped.

## Changes Included

- `buildViewModel.ts`: both `vm.select('contractList', 'passed')` call sites for "Select a contract to
  optimise" changed to `vm.select('contractList', 'weak')`.
- `lenses/ListLens.tsx`: replaced the false Cube-view/server-side-export claim and the fabricated
  "Nineteen material contracts" count with accurate text describing client-side filtering over the
  already-loaded governed register.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint` on both changed files
- PASS: `npx jest src/lib/source/data-model/__tests__/ src/app/(maestro)/source/preview/workspace/__tests__/` (33/33, no regression)
- Live signed-in proof: pending post-deploy — "Select a contract to optimise" must land on a non-empty
  list, and the contract-list caption must no longer claim a Cube-server binding or an unexplained
  contract count.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation.

## Audit Evidence

- This PR's diff and CI run.
- Live pre-fix screenshot (shared by the user this session) showing the empty "Notice deadline passed
  while active" result and the "Nineteen material contracts are projected" / Cube-view caption text.
- Post-deploy: live signed-in screenshot showing the corrected CTA target and caption.

## Known Gaps

- Live signed-in proof against the deployed revision is still pending (see Deployment Authority).
