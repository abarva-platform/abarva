# 2026-09-18 Source New Solicitation Motion Label

## Release ID

`2026-09-18-source-new-solicitation-motion-label`

## Status

`candidate`

## Plain-English Summary

Source New now shows RFI or RFP wording only when the event authority reader returns an explicitly accepted solicitation motion. When that authority is absent, unavailable, or not yet backed by the applied schema, the workspace keeps the neutral Market package wording.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only: the Source New event page consumes the existing fail-closed authority reader and changes visible labels in the phase rail, next action, and Files folders. No Layer 1 intake, Layer 2 adapter, Layer 3 persistence, data-plane mutation, or event API behavior changes.

## Client Applicability

- All clients: applies to Source New event workspaces after merge and deploy.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source New event page passes the existing authority-reader solicitation motion into the workspace.
- Source New workspace and Files components render `RFI` or `RFP` only from the accepted motion value, otherwise `Market package`.
- Focused workspace tests cover accepted RFP, accepted RFI, and unknown/unavailable authority.

## QA / Validation

- Pass: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` — 22 tests passed.
- Pass: `npx eslint 'src/app/(maestro)/source/new/[eventId]/page.tsx' src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewFiles.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx`.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR to main. The repo-owned Azure Container Apps deploy workflow may deploy the UI change. The authored authority migration remains a separate approval/apply/readback gate; before that gate, the reader fails closed and the UI remains neutral.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deploy and after an applied-schema event with an accepted motion exists. Until then, signed-in proof can only confirm the neutral fail-closed state.

## Rollback Plan

Revert the PR. This removes the UI wiring and returns Source New to neutral Market package labels. No database rollback or tenant-data cleanup is required.

## Audit Evidence

PR, focused test output, CI checks, repo-owned deploy run, ACA runtime invariant, and later signed-in Source New read-only proof when the authority migration has been separately applied and verified.

## Known Gaps

The authority migration is still not applied by this change. No request creator, activation transition, active-list cutover, tenant data write, or live accepted-motion proof is included here.
