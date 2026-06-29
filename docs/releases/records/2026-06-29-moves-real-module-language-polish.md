# 2026-06-29 Moves Real Module Language Polish

## Release ID

`2026-06-29-moves-real-module-language-polish`

## Status

`candidate`

## Plain-English Summary

This release removes remaining workflow-jargon language from the real signed-in Moves detail shell. Suggested aVa questions now use phase-progress language, blocked Moves open a readiness review, and phases without further approval criteria describe the state as a readiness checkpoint rather than a gate.

## Layer Impact

- `global-control-lane`: Updates user-facing Strategic Moves copy for all tenants. No data-plane, workflow, artifact generation, evidence scoring, or tenancy behavior changes.

## Client Applicability

- All clients: signed-in Moves users see calmer phase-readiness language.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/strategic-moves/StrategicMoveDetailClient.tsx`
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`
- `docs/releases/records/2026-06-29-moves-real-module-language-polish.md`

## QA / Validation

- Passed: touched-file ESLint.
- Passed: focused Strategic Moves Jest.
- Passed: full TypeScript.
- Passed: release check.
- Not run yet: signed-in browser proof on real module routes without `demo=1`.

## Rollout Plan

Merge to `main`, build the exact merged SHA into ACR, deploy through Azure Container Apps, pin 100% traffic to the healthy revision, and rerun signed-in browser proof against the real Moves module.

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

This is copy polish for the real detail shell. It does not change deeper phase mechanics, artifact lifecycle terms inside APIs, or internal variable names.
