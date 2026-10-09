# 2026-10-08 Architecture Flow Visual Capacity

## Release ID

`2026-10-08-architecture-flow-visual-capacity`

## Status

`candidate`

## Plain-English Summary

Generated architecture documents can carry up to twelve explicitly recorded flows in one visual. Each flow is shown as its own labelled card. The renderer still refuses a larger set, so it cannot quietly leave a recorded flow out of the document.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 presentation only. The renderer reads the existing governed architecture model and changes no source intake, adapter, canonical fact, flow identity, relationship, or approval record.

## Client Applicability

- All clients: architecture documents generated with nine to twelve recorded data, event, control, or human-approval flows.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; the existing architecture-rendering path applies.

## Changes Included

- The shared architecture HTML/Office visual renderer uses a three-column, four-row flow-card layout with a twelve-flow capacity.
- Every card retains the source flow ID and a full accessible title. The visual draws no relationship not present in the model.
- Tests require all twelve IDs, readable label scale, and a fail-closed refusal at thirteen flows. The golden HTML snapshot follows the changed visual.

## QA / Validation

- Architecture HTML and PPTX export suites: 20 tests passed.
- Golden regression suite: 3 tests and 3 snapshots passed after the visual snapshot update.
- Visual review: rasterized the twelve-card SVG at 1960 px; all twelve cards, route labels, and detail labels remained readable with no overlap. This is local artifact review, not signed-in product proof.
- Full `npm run typecheck`: clean. Changed-file ESLint and Prettier: passed. Coverage census: current. `npm run release:check`: all 11 gates passed. CI and deployed signed-in proof remain pending.

## Rollout Plan

Squash-merge the scoped PR after validation. The repository-owned ACA main deploy workflow builds and promotes a digest-pinned web/worker image. Verify the web template, 100% revision, and required worker jobs share the approved digest; then re-run a signed-in generated architecture with twelve recorded flows and inspect the exported visual.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the generated architecture and exported deck.

## Rollback Plan

Revert the PR through a new reviewed main-branch PR and redeploy through the same ACA workflow. The prior renderer will again reject flows above its former visual capacity; no persisted model or data migration is involved.

## Audit Evidence

The scoped PR and CI results, architecture-renderer and export tests, local twelve-card visual review, and post-deploy ACA plus signed-in evidence.

## Known Gaps

More than twelve flows still fail closed until a separately reviewed multi-page composition is available. Existing generated files are not retroactively rewritten.
