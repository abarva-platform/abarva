# 2026-09-14 — Source Contract 360 compact shell and archetype read-through

## Release ID

`2026-09-14-source-contract360-compact-archetype-read`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 keeps the contract tabs compact and makes the Optimize tab
lead with its single governed lever table. The contract and portfolio reads
also surface a declared archetype preserved on the canonical contract payload
when the older read-model category column is blank. No archetype is inferred
from a vendor name, contract title, or evidence lane.

## Layer Impact

- **global-control-lane — Layer 3 / Canonical model:** No schema or data mutation. Existing declared
  archetype values remain in the canonical contract payload.
- **global-control-lane — Layer 4 / Products:** Contract 360 and Source portfolio impact reads prefer
  the canonical declared archetype, while the compact tab shell removes
  duplicate workflow/context bands and preserves the governed Optimize table.
- **global-control-lane — Source adapters:** The Layer 4 projection fallback accepts both established
  loader payload keys without changing the source-of-truth boundary.

## Client Applicability

- All clients: Source Contract 360 and portfolio read paths.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Canonical archetype preference in Contract 360 list and detail reads.
- Canonical archetype preference in direct and derived portfolio evidence
  coverage reads.
- Layer 4 depth projection fallback for both declared archetype payload keys.
- Compact Contract 360 tabs with one Optimize lever table and no duplicate
  workflow/context band.
- Compact economics reconciliation table and archetype education loop.
- Regression coverage for archetype read-through and compact composition.

## QA / Validation

- Contract read adapter Jest: 16 tests passed.
- Layer 4 projection Jest: 9 tests passed.
- Compact Contract 360 Jest suites: 3 suites, 63 tests passed.
- Portfolio adapter and population Jest suites: 2 suites, 18 tests passed.
- TypeScript `npx tsc --noEmit`: passed.
- ESLint on changed source, adapter, projection, and test files: passed.
- `git diff --check`: passed.
- Repository duplicate manual-mock warnings remain present during Jest startup;
  they do not fail the focused suites.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container
Apps deployment workflow builds the exact merge SHA, publishes a
digest-pinned image, waits for health, assigns traffic, and emits runtime
invariant evidence. This release does not itself run a data-plane mutation or
reload package; a governed Azure data-build job is required for any new or
refreshed corpus.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned ACA deploy workflow only.
- Approved image digest: Recorded by the deployment workflow after merge.
- ACA runtime invariant: Required before calling the change live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify Source portfolio Coverage and
  Contract 360 Story, Scope, Economics, Performance, Relationship, Evidence,
  Optimize, and education surfaces.

## Rollback Plan

Reassign traffic to the previous verified digest through the repo-owned ACA
deployment lane. No database rollback is required.

## Audit Evidence

- Pull request and CI checks for this release.
- ACA digest-pinned runtime invariant bundle.
- Signed-in Source portfolio and Contract 360 screenshots or smoke output.
- Focused adapter, projection, population, and compact-shell test output.

## Known Gaps

The release does not invent archetypes for register headers that lack an
authoritative mapping. The remaining register/depth identity reconciliation,
batch reload, and live signed-in proof remain separate required work.
