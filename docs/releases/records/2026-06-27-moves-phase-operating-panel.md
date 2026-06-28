# 2026-06-27 Moves Phase Operating Panel

## Release ID

`2026-06-27-moves-phase-operating-panel`

## Status

`candidate`

## Plain-English Summary

This release makes the Moves operating layer visible directly on the phase workspace. Clients can now see what evidence is still needed, why it matters, what remains preliminary, what final artifacts are blocked, and how review feedback feeds regeneration without hunting inside the package generation panel.

## Layer Impact

- `global-control-lane`: updates shared Strategic Moves phase rendering for all clients.
- `client-data-lane`: no schema, migration, seed, or tenant data changes.

## Client Applicability

- All clients: Yes, for Strategic Moves phase pages that have evidence-need packets.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: adds a phase-level "What We Need Before This Phase Is Final" panel and review feedback-loop guidance.
- `src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`: regression coverage that the phase workspace renders evidence needs and feedback-loop guidance.

## QA / Validation

- Passed: Focused Jest for the phase operating-layer regression, evidence packet builder, and board artifact panel.
- Passed: Focused ESLint on the touched phase component and test.
- Pending before release: Release control check.
- Pending after ACA deployment: Signed-in live proof for the Lakeshore proof Move phase page, Evidence Hub, and Documents tab.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main lane, then re-crawl the Lakeshore proof Move phase page and evidence/documents pages.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None.
- Approved image digest: Filled after deployment.
- ACA runtime invariant: `app.abarva.ai` must run the merged main SHA at 100% traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this commit or roll ACA traffic back to the prior healthy revision. No data rollback is required.

## Audit Evidence

- PR URL and CI run for this follow-up.
- Signed-in Lakeshore screenshot/text proof for `/strategic-moves/49c77bca-471d-4398-8b13-fa8ed1487597/phase/2`.

## Known Gaps

Full repository TypeScript is not re-run as part of this narrow follow-up because the prior Moves operating-layer release already documented unrelated pre-existing missing dependency/type issues in the wider repo. This follow-up is limited to rendering the already-built evidence need packets in the phase workspace and proving that behavior with focused component coverage plus signed-in live crawl after deploy.
