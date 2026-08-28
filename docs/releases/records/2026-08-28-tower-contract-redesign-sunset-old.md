# 2026-08-28-tower-contract-redesign-sunset-old — Tower Contract Redesign

## Release ID

`2026-08-28-tower-contract-redesign-sunset-old`

## Status

`candidate`

## Plain-English Summary

Tower is rebuilt around the approved executive design contract. The product now presents four
contract tabs: Executive View, Value Proof, AI Portfolio, and Evidence & Actions. The prior
Command Center subviews and their old chart modules are removed from the Tower command-center
runtime so stale tab URLs cannot keep serving the previous experience.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Tower presentation only. The release changes how governed Tower read-model data
is displayed and routed in the browser. It does not introduce new tenant data, loaders, adapters,
canonical objects, migrations, or model-written metrics.

## Client Applicability

- All clients: yes, for the shared Tower route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/tower` renders the new four-tab contract surface.
- Stale tab URLs normalize into the new tab model, including legacy command, evidence, action,
  value, and lane tab names.
- The Value Proof, AI Portfolio, and Evidence & Actions tabs use purpose-built contract layouts
  rather than reused legacy subviews.
- Obsolete command-center subview modules and legacy chart modules are removed.
- The Tower visual harness and focused behavior tests are updated to assert the new contract tabs.

## QA / Validation

- `npx eslint 'src/app/(maestro)/tower/page.tsx' src/components/tower/command-center/TowerCommandCenter.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/components/tower/command-center/__tests__/render-harness.test.tsx`
  passed.
- `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/components/tower/command-center/__tests__/render-harness.test.tsx --runInBand`
  passed.
- `npx tsc --noEmit --pretty false --incremental false --skipLibCheck` filtered to the touched
  Tower files reported no touched-file TypeScript errors.
- Standalone visual harness rendered all four contract tabs and drawers.
- Same-viewport pixel comparison was run locally against the design contract screenshots. The
  comparison is recorded as design QA, not a runtime data assertion, because production renders
  governed client-specific read-model values.

## Rollout Plan

Merge the approved PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the
new digest-pinned web image to the shared Product/Lab Container App, then shifts 100% traffic after
the new revision is healthy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: must be verified after workflow completion.
- Worker image invariant: no worker image changes in this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify `/tower` and the four Tower tabs after deployment.

## Rollback Plan

Rollback by reverting the PR or re-deploying the prior known-good `main` SHA through the same
repo-owned ACA main deploy workflow. Do not manually shift shared traffic except under documented
break-glass procedure.

## Audit Evidence

- PR URL and merge commit.
- ACA main deploy workflow run.
- ACA runtime invariant output after deployment.
- Signed-in browser proof for `/tower` showing the four contract tabs.
- Local visual harness screenshots and pixel-diff output captured during release preparation.

## Known Gaps

None known for the Tower command-center runtime. Pixel-perfect equality against a static HTML file
is not expected when the runtime renders governed tenant-specific data, but the active layouts now
follow the four-tab contract structure.
