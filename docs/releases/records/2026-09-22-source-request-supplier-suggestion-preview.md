# 2026-09-22 Source Request Supplier Suggestion Preview

## Release ID

`2026-09-22-source-request-supplier-suggestion-preview`

## Status

`candidate`

## Plain-English Summary

Source New can now show candidate suppliers whose governed registry eligibility matches an event's accepted category and archetype. The read-only preview labels every result as `Suggested for review`, keeps existing-contract vendors visibly separate, and exposes no supplier contact, selection, invitation, or award action.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, Canonical Enterprise Model: reads tenant-scoped supplier legal entities and their recorded candidate-registry metadata. It does not create or update supplier authority.
- Layer 4, Source: adds a read-only Stage 04 projection alongside the existing accepted candidate panel.

## Client Applicability

- All clients: yes, when a governed candidate-supplier registry is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- A tenant-scoped reader for candidate-supplier registry metadata stored with canonical supplier legal entities.
- A deterministic category/archetype eligibility projection that fails closed when mapping, registry, or contract-vendor authority is unavailable.
- A Stage 04 `Suggested for review` section that distinguishes existing-contract vendors and provides no supplier action controls.
- Behavioral coverage across every registered Source category/archetype.

## QA / Validation

- Red-first tests failed before the registry reader and suggestion projection existed.
- Focused repository, projection, Stage 04, and workspace suites pass.
- TypeScript and scoped ESLint pass.
- A mutation that removed existing-contract separation failed the behavioral test and was reverted.
- Release control and diff checks are run before the pull request is opened.

## Rollout Plan

Squash-merge after applicable checks pass. Deploy only through the repo-owned ACA main workflow. No migration or data load is included. The preview remains empty or blocked until a tenant has governed candidate-registry coverage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, separately from merge and runtime proof.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. The change is read-only and creates no supplier, request, event, contact, or approval records.

## Audit Evidence

- Pull request, CI checks, and merge commit.
- Focused test and mutation output.
- Repo-owned ACA runtime-invariant artifact after deployment.
- Separate signed-in Stage 04 acceptance when governed registry data is available.

## Known Gaps

- This change does not populate a candidate-supplier registry.
- A registry match is not event-panel acceptance, contact permission, respondent selection, NDA coverage, or award authority.
