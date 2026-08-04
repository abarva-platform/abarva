# 2026-08-04-source-workspace-optimise-cta-and-fabrication-fix — Fix the "Select a contract to optimise" empty landing, a fabricated Cube-view claim, and restore sourcing-event navigation

## Release ID

`2026-08-04-source-workspace-optimise-cta-and-fabrication-fix`

## Status

`released`

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
3. Since last week's `/source` → Workspace promotion, there was no way to reach the sourcing-event
   dashboard (`/source/portfolio` — events in flight, "New event", "Optimize a contract") from the new
   canonical page at all. Per explicit direction, added a "Sourcing events" entry to the Explorer
   sidebar with three external links to the existing, already-working pages
   (`/source/portfolio`, `/source/new` × 2) — no rebuild of that flow inside the Workspace.

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
- `buildViewModel.ts`: added a "Sourcing events" Explorer group with "Events dashboard" (→
  `/source/portfolio`), "New event" (→ `/source/new`), and "Optimize a contract" (→ `/source/new`) —
  plain `window.location.href` navigations (buildViewModel.ts is a non-component function, so it can't
  call `useRouter()`; these leave the Workspace's page tree entirely rather than changing internal
  `sel` state).

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint` on both changed files
- PASS: `npx jest src/lib/source/data-model/__tests__/ src/app/(maestro)/source/preview/workspace/__tests__/` (33/33, no regression)
- Live signed-in proof (PR #5931 merged as `2182c22f`, ACA revision `ca-abarva-web-lab-eastus--m2182c22f`,
  image digest `sha256:dc6b706efa153c737a7a9e9c9676a8c5d0cf2f60959d71e4eac80ddccb1c3391` at 100%
  traffic, confirmed via `az containerapp show`):
  - `https://app.abarva.ai/source` → "Select a contract to optimise" now lands on "Two or more weak
    leverage signals" (69 contracts · $863.8M annual contract value), a populated table, not the empty
    "Notice deadline passed" view.
  - The contract-list caption now reads "Row click opens Contract 360. Filtered client-side over the
    same governed register already loaded for this page — no separate query or dataset." — no more
    Cube-view claim, no more fabricated "Nineteen material contracts" count.
  - The Explorer's new "Sourcing events" group renders with all three entries (Events dashboard, New
    event, Optimize a contract). Clicked "Optimize a contract": navigates to `/source/new` ("New IT
    Sourcing Intake"), which renders fully and correctly — a real split-pane "Sourcing event intake"
    flow with an aVa co-pilot on the left ("Ready to stand up a new IT sourcing event for Airline
    Demo...") and a structured intake form on the right (Why now/trigger, Decision owner, Scope
    boundary, Value/savings target, Minimum data/baseline owner). Zero console errors on that page.

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
- Live signed-in proof required: required before this release is marked `released`. **Done — see QA / Validation.**

## Rollback Plan

Code rollback by reverting the PR. No data mutation.

## Audit Evidence

- This PR's diff and CI run.
- Live pre-fix screenshot (shared by the user this session) showing the empty "Notice deadline passed
  while active" result and the "Nineteen material contracts are projected" / Cube-view caption text.
- Post-deploy: live signed-in screenshot showing the corrected CTA target and caption.

## Known Gaps

- None known — the "Optimize a contract" / "New event" flow reached from the Workspace was verified
  live to render and function correctly, addressing the user's specific ask to be able to run it.
