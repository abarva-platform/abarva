# 2026-08-07-hide-redundant-optimize-cta — Hide the "Build optimisation strategy" button when already on that tab

## Release ID

`2026-08-07-hide-redundant-optimize-cta`

## Status

`candidate`

## Plain-English Summary

The "Build optimisation strategy" button in the contract-page header always did the same thing: switch to that contract's Optimization tab. It kept rendering even when the user was already on the Optimization tab, where clicking it does nothing — a same-page no-op that reads as a broken button live. This release hides the button once the user is already on the Optimization tab (it still shows on every other contract sub-tab, where it does something real). This does not add any new capability — the button's only action was ever a tab switch, and that switch is what's now correctly suppressed once redundant.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/buildViewModel.ts` only — one added condition on an existing header action.

## Client Applicability

- All clients: yes — any tenant viewing a contract's Optimization tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `buildViewModel.ts`: `headerActions` for `kind === 'contract'` now also requires `activeTab !== 'Optimization'` before showing "Build optimisation strategy".

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — passed, clean.
- `npx eslint` on the changed file — passed, clean.
- Live signed-in proof required post-deploy (see below) — no local dev server verification possible (page requires live Azure Postgres).

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — open a contract's Optimization tab and confirm "Build optimisation strategy" no longer renders; confirm it still renders and works on Overview/Economics/Scope/Performance/Renewal/Leverage/Evidence.

## Rollback Plan

Revert the PR. The button returns to always rendering on contract pages, including the redundant Optimization-tab case.

## Audit Evidence

- PR diff for the one changed file.
- This record's QA section.
- Post-deploy: live signed-in screenshot of the Optimization tab confirming the button is gone.

## Known Gaps

This is a UI-only fix for a confusing no-op — it does not address the underlying, larger gap the button's label implies: there is no real quantified optimization workflow (leakage diagnosis, negotiation plan, financial modeling) behind Door 1 today, only a governed-levers display and scenario framing. That is tracked separately as a substantial Codex handoff (see `docs/codex-handoff/SOURCE_DOOR1_FRONT_DOOR_WORKFLOW_2026-08-06.md`), not fixable as a same-day UI change.
