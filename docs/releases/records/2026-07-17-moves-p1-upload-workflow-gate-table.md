# 2026-07-17-moves-p1-upload-workflow-gate-table — Moves P1 Upload Workflow and Gate Table

## Release ID

`2026-07-17-moves-p1-upload-workflow-gate-table`

## Status

`candidate`

## Plain-English Summary

The Moves P1 Charter workspace now separates the work into a clearer three-step flow: Charter inputs, Upload evidence, and Gate approval. The upload step supports selecting multiple files in one action, and the gate approval review uses a simple information table instead of misleading pre-green status pills. The gate copy now makes clear that Approve & Build is the full phase-close action for P1-P5.

## Layer Impact

- `global-control-lane`: Updates the shared Moves phase workspace UI and upload control behavior for all tenants.
- `product-ux`: Clarifies what the operator must do in P1 before gate approval.
- `evidence-workflow`: Allows the existing upload endpoint to receive multiple user-selected files through sequential client-side uploads. No API contract or storage schema changed.

## Client Applicability

- All clients: Yes, all tenants using Moves receive the shared P1 workspace/gate UI behavior.
- Specific clients: Meridian Health is the immediate live validation target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Renames P1 steps to `Charter inputs`, `Upload evidence`, `Gate approval`.
  - Moves P1 charter inputs and initial posture into step 1.
  - Moves P1 file collection into step 2 with an above-fold action panel.
  - Enables multi-file selection and sequential upload through the existing upload endpoint.
  - Replaces the gate attestation strip with a compact gate status table.
  - Clarifies that Approve & Build runs context extract, deliverable queue, gate approval, and next-phase handoff.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds regression coverage for the P1 step split and multi-file upload input.
- `docs/backlog/tracks/03-programs-flagship/BACKLOG.md`
  - Adds PROG26 for the larger follow-up: generated next-phase readiness packs after gate approval.

## QA / Validation

- PASS: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- PASS: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- PASS: `git diff --check`
- Pending before merge: `npm run release:check`
- Pending before merge: TypeScript check if local environment permits.
- Visual preview generated for review:
  - `/Users/anand/Downloads/moves-p1-charter-workflow-preview-2026-07-17.html`
  - `/Users/anand/Downloads/moves-p1-charter-workflow-preview-2026-07-17.png`

## Rollout Plan

Open a PR against `abarva-platform/abarva:main`, squash merge after validation, then allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image to `ca-abarva-web-lab-eastus`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No ad-hoc ACA mutation by this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending post-deploy verification.
- Worker image invariant: Not affected directly by this UI-only change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Moves P1 workflow after deploy.

## Rollback Plan

Revert the PR and allow the ACA main deploy workflow to publish the previous workspace behavior. No database, migration, storage, or API rollback is required.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA deploy run: Pending.
- Live proof: Pending.
- Visual preview: `/Users/anand/Downloads/moves-p1-charter-workflow-preview-2026-07-17.html`

## Known Gaps

- This release does not implement PROG26 generated readiness packs. It only records that follow-up in the backlog.
- This release does not change the backend upload endpoint or evidence review policy; multi-file selection uses sequential uploads through the existing endpoint.
- This release does not prove signed-in production behavior until after ACA deploy.
