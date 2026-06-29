# 2026-06-29 Moves Real Module Polish

## Release ID

`2026-06-29-moves-real-module-polish`

## Status

`candidate`

## Plain-English Summary

This release extends the Moves visual cleanup to the real signed-in module, not just the demo presentation route. The Documents tab now uses the calmer browse treatment in the normal compact tab, the Explorer no longer repeats gate badges as row noise, and the artifact storage surface is labeled as Downloads for users.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves UI components for all tenants. No phase workflow, artifact generation, evidence gate, tenancy, or data-plane behavior changes.
- `public-demo`: Keeps the already-polished demo route aligned with the real module.

## Client Applicability

- All clients: real signed-in Moves users receive the cleaner Explorer, Documents, and Downloads labels.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/strategic-moves/MovesExplorer.tsx`
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `docs/releases/records/2026-06-29-moves-real-module-polish.md`

## QA / Validation

- Passed: touched-file ESLint.
- Passed: focused Strategic Moves Jest.
- Passed: full TypeScript.
- Passed: release check.
- Not run yet: signed-in Lakeshore browser proof on the normal real module route without `demo=1`.

## Rollout Plan

Merge to `main`, build the exact merged SHA into ACR, deploy through Azure Container Apps, pin 100% traffic to the healthy revision, and run signed-in browser proof against the normal Lakeshore Moves route.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps production/lab lane.
- Shared runtime mutators: none.
- Approved image digest: captured after ACR build.
- ACA runtime invariant: deploy only to `ca-abarva-web-lab-eastus`.
- Worker image invariant: no worker changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Reassign ACA traffic to the prior healthy revision or redeploy the previous image. No migration or data rollback is required.

## Audit Evidence

Pull request, CI result, ACA revision/digest, and signed-in browser screenshots will be attached after rollout.

## Known Gaps

This is a UI polish pass for the existing real Moves module. It does not redesign phase content, generate new deliverables, modify evidence scoring, or change the underlying artifact lifecycle. A fuller information-architecture redesign remains separate.
