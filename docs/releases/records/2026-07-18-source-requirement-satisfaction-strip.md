# 2026-07-18-source-requirement-satisfaction-strip — Source Requirement Satisfaction Strip

## Release ID

`2026-07-18-source-requirement-satisfaction-strip`

## Status

`candidate`

## Plain-English Summary

The legacy Source event canvas now shows whether the current stage has satisfied its canonical artifact and evidence requirements. The signal is computed from data already loaded into the canvas and does not add a new server call, route, or prop contract.

## Layer Impact

Application UI: adds a context-strip requirement counter to the legacy Source canvas.

Source governance/read model: reuses the canonical Source stage artifact and evidence requirement registry already present in the client bundle.

Release lane: `global-control-lane`, because the legacy Source canvas is shared behavior for clients who reach this route.

## Client Applicability

All clients: applies to Source events rendered through the legacy canvas.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: existing route/canvas flags decide whether a user reaches this canvas; this change does not add a new flag.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx`: computes and renders `Requirement-satisfied {met} / {required}` from existing artifact and evidence state props.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: extends the Source canvas render test to cover the new context-bundle signal.

## QA / Validation

- Pass: `npx eslint src/components/source/canvas/UniversalCanvasShell.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --testNamePattern="context bundle reflects artifact \\+ criterion \\+ evidence counts"`
- Blocked: local signed-in browser proof for Source canvas because the available saved Clerk sessions are scoped to `https://app.abarva.ai`, not `localhost`.
- Not run: production/lab browser proof. This release candidate is not merged or deployed.

## Rollout Plan

Merge to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the new digest-pinned image. No migration, data load, or manual operator job is required.

## Deployment Authority

Repo-owned deploy workflow: required for production.

Shared runtime mutators: none in this release candidate.

Approved image digest: not applicable until the main deploy workflow builds the image.

ACA runtime invariant: required after deploy before calling the change live.

Worker image invariant: no worker impact expected.

Feature/env flag update path: none.

Live signed-in proof required: yes, Source canvas route for a non-Lakeshore tenant and a Lakeshore tenant.

## Rollback Plan

Revert the Source canvas UI/test changes and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

Review the PR diff, this release record, and the focused Source canvas render test output. Add signed-in browser proof after the release candidate is available in a signed-in lab/runtime session.

## Known Gaps

Local signed-in browser proof remains blocked by Clerk session scope. No merge, deploy, or live-proven claim is included in this release candidate.
