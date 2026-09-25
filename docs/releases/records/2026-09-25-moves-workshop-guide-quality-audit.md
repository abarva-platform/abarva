# 2026-09-25-moves-workshop-guide-quality-audit — Align Workshop Guide Quality Gates

## Release ID

`2026-09-25-moves-workshop-guide-quality-audit`

## Status

`candidate`

## Plain-English Summary

Moves workshop/session guides now use a quality bar that matches their purpose as working guides. They must carry practical session instructions, evidence requests, owners, outputs, and open-input discipline, but they are not forced to include board-decision sections, recommendations, or risk tables.

The golden-exemplar coverage audit now measures the profiled Moves deliverable registry rather than the older structure list. That means newly profiled workshop guides are visible to the audit population and cannot sit outside the quality-judge readiness count.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates Moves deliverable quality-bar resolution and the report-only generated-deliverable exemplar audit.
- Layers 1-3: No intake, adapter, canonical model, migration, data-plane, registry, or tenant-data changes.

## Client Applicability

- All clients: Moves generated-document quality controls use the corrected guide bar and audit population.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds a shared workshop-guide quality-bar override that explicitly disables decision-section, recommendation, and risk-table requirements for working guides.
- Applies that bar to the P1 guide, later-phase workshop guides, and the defensive P1 workshop-guide alias.
- Adds a runtime Moves deliverable-key list next to the profile registry.
- Points the golden-exemplar coverage audit at that profiled Moves deliverable population.
- Adds tests proving guide bars do not inherit decision-artifact requirements and proving the exemplar audit counts every workshop guide.

## QA / Validation

- Pass — `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts scripts/moves/__tests__/audit-golden-exemplars.test.ts --runInBand` — 38/38 tests passed.
- Pass — `npm run moves:audit-golden-exemplars -- --out /tmp/moves-golden-exemplar-coverage-8463.json` — report produced with 20 profiled Moves deliverables required.
- Pass — `npx eslint src/lib/deliverables/orchestrator/quality-bar-registry.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/profiles/registry.ts src/lib/deliverables/profiles/index.ts src/lib/deliverables/profiles/__tests__/registry.test.ts scripts/moves/audit-golden-exemplars.ts scripts/moves/__tests__/audit-golden-exemplars.test.ts`.
- Pass — `npm run typecheck`.
- Pass — `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow will rebuild and deploy the app image. No manual data build, migration, feature flag, or tenant-data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Yes, `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No ad-hoc mutators in this release.
- Approved image digest: To be produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming runtime-live.
- Worker image invariant: Required after deployment because generated-deliverable workers share the web image.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this report/quality-control wiring change; deploy health and runtime invariant are sufficient.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to restore the prior quality-bar and audit-population behavior. No data rollback is required.

## Audit Evidence

- Pull request URL and merge SHA after PR creation.
- Focused Jest, typecheck, and release-check output.
- Post-merge ACA deploy run and runtime invariant proof.

## Known Gaps

This release does not create human-curated exemplar artifacts. It corrects which Moves deliverable types the report-only exemplar audit requires before a judge can be considered ready.
