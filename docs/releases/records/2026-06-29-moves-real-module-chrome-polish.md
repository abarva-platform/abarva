# 2026-06-29 Moves Real Module Chrome Polish

## Release ID

`2026-06-29-moves-real-module-chrome-polish`

## Status

`candidate`

## Plain-English Summary

This release removes remaining internal-feeling chrome from the real signed-in Moves module. The artifact storage tab is consistently labeled Downloads, the phase readiness panel uses readiness language instead of gate jargon, and the Moves aVa rail uses the quieter shared dock variant so loud draft/citation badges no longer dominate the page.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves UI composition for all tenants. No artifact generation, phase advancement, evidence gate, tenancy, or data-plane behavior changes.

## Client Applicability

- All clients: signed-in Moves users see the cleaner module chrome.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/strategic-moves/StrategicMoveDetailClient.tsx`
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`
- `src/components/agent/AgentDock.tsx`
- `docs/releases/records/2026-06-29-moves-real-module-chrome-polish.md`

## QA / Validation

- Passed: touched-file ESLint.
- Passed: focused Strategic Moves and AgentDock Jest.
- Passed: full TypeScript.
- Passed: release check.
- Not run yet: signed-in Lakeshore browser proof on real module routes without `demo=1`.

## Rollout Plan

Merge to `main`, build the exact merged SHA into ACR, deploy through Azure Container Apps, pin 100% traffic to the healthy revision, and run signed-in browser proof against the real Lakeshore Moves route.

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

This polish pass does not shorten the real Move name or redesign phase content. It removes shared module chrome that made the real module feel cluttered during browser proof.
