# 2026-10-10-moves-ux-live-fixes — Step-page usability and accessibility

## Release ID

`2026-10-10-moves-ux-live-fixes`

## Status

`candidate`

## Plain-English Summary

The Moves step pages use the full phone width, keep the current step title readable, present one clear next action, and give the shared chat dock accessible controls. A bare phase address opens a step on the server instead of showing an empty opening message. Independent page reads now run concurrently where they do not depend on one another.

## Layer Impact

- Release lane: `global-control-lane` for the shared product presentation and chat dock; the existing Moves feature flags still restrict where step pages appear.
- Products: Moves phase navigation, step-page presentation, and the shared chat dock change. The canonical model, gate rules, evidence, and approvals do not change.
- Quality evidence: The signed-in walk recognizes the existing Context disclosure through a stable page marker. Its scoring rules and required dimensions are unchanged.

## Client Applicability

- All clients: Shared chat dock accessibility semantics and separator behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Moves step-page and capture flags continue to control the step workspace. The default phone layout applies only there.

## Changes Included

- Shared Next Action sentence composition, blocked-state count, Context action placement, phone step title, and contrast tokens.
- Chat dock sheet behavior at phone width, named focusable scroll regions, and valid ARIA roles.
- Server phase landing and concurrent independent read projections.
- Focused component and routing tests.

## QA / Validation

- Baseline signed-in walk: 20 reachable step pages, 9 phase-gated pages, average measured UX 47/100. The initial workflow failed four phase landing checks while step views themselves passed; this release addresses the landing failure and measured shared defects.
- Local candidate validation: 119 focused tests passed across four suites; the nine-suite step-page catalog passed 158 tests, the Moves component suite passed 1,057 tests across 56 suites, and the Programs model suite passed 3,744 tests across 238 suites. Exact copy assertions now enforce the one-sentence composition, including the ready line's preserved provenance. A phone-width dock-mode assertion covers the responsive behavior. Full typecheck and scoped ESLint passed. Library-orphan, route-reachability, export-reachability, tenancy-fence, manual, and release gates passed; the test census stayed at 2,822 workflow-covered files with no new test files. Three targeted mutations were killed by the routing, sentence, and compact-dock tests.
- A temporary component render was inspected at 390 and 1440 pixels in light and dark. The step title wrapped on phone width with no horizontal document overflow. The five previously reported axe rule IDs returned no violations on that isolated render; the signed-in page still requires the post-deploy walk for an integrated accessibility verdict. The temporary render test was removed after inspection.
- Post-deploy signed-in walk: pending. This release remains a candidate until that walk measures page scores and settled-head timing against the acceptance targets.
- The P0 journey display infers “done” from phase position, while the current P0 gate evaluator reports only 1 of 3 hard criteria met. The historical sign-off cannot be inferred from the position; no tenant data is changed here.

## Rollout Plan

Squash merge the reviewed PR. The repository-owned ACA main deploy workflow builds and deploys the image. Accept only after the runtime digest invariant and the read-only signed-in step walk are captured.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this release.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Template, 100% traffic revision, and required worker images must match the approved digest.
- Worker image invariant: Verified by the repo-owned deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: All reachable step pages at desktop and phone width in light and dark, plus phase landings and journey readback.

## Rollback Plan

Revert the PR through the protected branch and allow the repo-owned ACA deploy to restore the previous digest. No schema or tenant-data rollback is needed.

## Audit Evidence

- Baseline walk: GitHub Actions run `38089823244` and its `proof.json` and `summary.md` artifact.
- Candidate PR and CI: Add links after creation.
- Post-deploy walk and before/after UX scores: Pending.

## Known Gaps

- The exact persisted P0 origination-brief sign-off state on the historical synthetic Move is unverified. Current phase position alone is not approval proof.
- The measured speed and final accessibility score require the post-deploy signed-in walk. Local tests cannot establish the live result.
