# 2026-09-19 Source Stage 04 Vendor Readiness Reachability

## Release ID

`2026-09-19-source-stage04-vendor-readiness-reachability`

## Status

`candidate`

## Plain-English Summary

Source New now shows a reachable Stage 04 vendor-response readiness card when an event has advanced to the responses stage. The card is read-only and states candidate response readiness only. It does not imply an award, select a vendor, contact a vendor, or send anything.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation changes only. The route reuses tenant-resolved event authority and tenant-filtered file rows already loaded by Source New; no canonical data, loader, migration, or tenant data-plane behavior changes.

## Client Applicability

- All clients: yes, for Source New events at the responses stage.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/source/new/[eventId]` passes accepted solicitation authority fields already read by the route.
- `SourceNewWorkspace` renders a Stage 04 candidate-response readiness card for responses-stage events.
- The card reports tenant-scoped empty response evidence honestly, separates candidate readiness from award readiness, and exposes no contact/send action without verified participant authority.
- Focused behavior tests cover reachability, tenant-scoped empty state, candidate-versus-award wording, and absence of contact/send controls.

## QA / Validation

- PASS: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/source/new/[eventId]/page.tsx' src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- PASS: `npm run audit:qa-inventory-claims`
- PASS: `git diff --check`

## Rollout Plan

Merge through PR into `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Signed-in Source New acceptance remains a separate human gate after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy before live claims.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Anand acceptance on Source New after deploy.

## Rollback Plan

Revert the PR. This removes the read-only card and extra event fields from the Source New route without data rollback.

## Audit Evidence

PR, focused Jest output, scoped ESLint output, QA inventory claim gate output, release check output, repo-owned deploy run, ACA runtime invariant readback, and later signed-in Source New acceptance.

## Known Gaps

The card does not compute final selection, award approval, vendor outreach, participant authority, or contact authorization. It only makes the Stage 04 candidate-response readiness state reachable and honest.
