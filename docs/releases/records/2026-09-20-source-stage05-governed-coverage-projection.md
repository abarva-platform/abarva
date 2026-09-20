# 2026-09-20-source-stage05-governed-coverage-projection — Governed NDA Coverage

## Release ID

`2026-09-20-source-stage05-governed-coverage-projection`

## Status

`candidate`

## Plain-English Summary

Source New now derives Stage 05 NDA readiness from explicit candidate-panel
acceptance and governed NDA authority. Every accepted supplier remains visible
with one of four states: covered by an executed NDA, covered by an explicit
Legal waiver, not covered, or authority unavailable. An invitation, response,
recommendation, award, filename, or ungoverned file field cannot create
coverage.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 3 canonical authority: read-only consumption of existing candidate,
  Legal template, waiver, and executed-NDA authority. No canonical row changes.
- Layer 4 Source: replaces the mounted Stage 05 file-metadata shortcut with a
  deterministic, tenant-scoped server projection and per-supplier status.

## Client Applicability

- All clients: yes, where Source New is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/stage05-nda-coverage.ts`
- `src/app/(maestro)/source/new/[eventId]/page.tsx`
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- `src/components/source/new-workspace/workspace.css`
- Focused route, projection, and component tests.

## QA / Validation

- Failing-first projection suite proved the module did not exist before the
  implementation.
- Focused projection, route, and rendered-workspace suites pass.
- Empty and unavailable registries are tested as different states.
- Multi-supplier coverage keeps covered and uncovered suppliers visible
  together.
- No supplier communication, Legal approval, waiver, signature, upload,
  candidate acceptance, or tenant-data write is exposed by this read path.

## Rollout Plan

Squash merge through a protected PR. The repo-owned ACA main deploy workflow
builds and deploys the exact main SHA. After runtime-invariant proof, perform a
signed-in read-only Source New check. No migration or data build is part of this
release; the required authority schema was applied separately through the
governed migration workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this projection release and redeploy the resulting main SHA. The
governed authority relations remain in place; no authority rows are deleted or
rewritten.

## Audit Evidence

Inspect focused test output, PR checks, the repo-owned deploy run, runtime
invariant readback, and signed-in Stage 05 screenshots or DOM proof.

## Known Gaps

- An event with no explicit candidate-panel acceptance correctly renders an
  empty panel and cannot demonstrate a covered supplier until governed records
  exist.
- Signed-in acceptance remains pending until deployment.
