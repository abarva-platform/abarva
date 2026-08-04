# 2026-08-04-source-workspace-events-link-visibility-fix — Make the sourcing-events entry point always visible, not buried in the Explorer scroll

## Release ID

`2026-08-04-source-workspace-events-link-visibility-fix`

## Status

`candidate`

## Plain-English Summary

`2026-08-04-source-workspace-optimise-cta-and-fabrication-fix` added a "Sourcing events" group to the
bottom of the Explorer sidebar (after Executive portfolio, Vendors, Contracts, Opportunities,
Evidence) linking out to the existing events dashboard and new-event/optimize-a-contract intake flow.
Live use immediately showed the problem: with Vendors expanded by default (its usual state), the
sourcing-events entry sits so far down the sidebar that a user has no way to know it exists without
scrolling past every vendor category first — reported live as "I don't see a way to get to the events
dashboard," even though the entry was present and working.

Fixes this by adding the same two links directly to the black status strip at the very top of the
page — a header row that never scrolls out of view regardless of Explorer or canvas scroll position,
unlike the Explorer sidebar. The Explorer sidebar entries from the prior release stay in place as a
secondary path; this adds the primary, always-visible one.

## Layer Impact

- `client-data-lane`: scoped to `WorkspaceClient.tsx` only. Pure UI addition — two buttons in an
  existing header row, navigating to already-working pages.

## Client Applicability

- All clients: UI shell fix, not tenant-scoped.

## Changes Included

- `WorkspaceClient.tsx`: added "Sourcing events ↗" (→ `/source/portfolio`) and "New event ↗"
  (→ `/source/new`) buttons to the top status strip, always visible, alongside the existing
  narrow-width "Explorer" drawer toggle in the same right-aligned group.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- PASS: `npx jest src/lib/source/data-model/__tests__/ src/app/(maestro)/source/preview/workspace/__tests__/` (33/33, no regression)
- Live signed-in proof: pending post-deploy — both buttons must be visible on `/source` without any
  scrolling, and must navigate correctly.

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
- Live screenshot (shared by the user this session) showing the Explorer sidebar scrolled to
  "Contracts expiring in 180" with no sourcing-events entry visible on screen, prompting this fix.
- Post-deploy: live signed-in screenshot showing both buttons visible on first load, no scroll.

## Known Gaps

- Live signed-in proof against the deployed revision is still pending (see Deployment Authority).
