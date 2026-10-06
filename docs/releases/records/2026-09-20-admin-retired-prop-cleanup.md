# 2026-09-20-admin-retired-prop-cleanup — Remove retired admin display inputs

## Release ID

`2026-09-20-admin-retired-prop-cleanup`

## Status

`candidate`

## Plain-English Summary

Removes three component inputs that survived after their visible admin UI was intentionally retired. Admin pages no longer calculate and pass context-source chips, assistant labels, or mode labels into components that do not render them. The remaining three-cell context bar and evidence-strength presentation are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: narrows two admin component contracts and removes dead JSX inputs. No visible copy, layout, data, calculations, authorization, or tenancy behavior changes.

## Client Applicability

- All clients: shared admin component contract cleanup.
- Specific clients: none.
- Internal only: admin surfaces.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `StewardEditorial` no longer declares `contextUsed`.
- `ContextBar` no longer declares `mode` or `agent`.
- Admin call sites stop passing those retired values.
- Existing component and integration tests now lock the narrowed contract.

## QA / Validation

- Failing-first proof: the narrowed-contract cases failed against the former declarations.
- Focused component and integration tests: 2 suites / 61 tests pass.
- TypeScript, scoped ESLint, and release control: pass.

## Rollout Plan

Squash-merge through the protected repository and allow the repo-owned ACA main workflow to deploy the shared image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required before recording `deployed`.
- Worker image invariant: required because the shared image is used by workers.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; this removes compile-time-only inputs from unchanged rendered components.

## Rollback Plan

Revert the squash merge. No schema, data, configuration, traffic, or environment rollback is required.

## Audit Evidence

- PR diff and focused test output.
- TypeScript and release-control output.
- Repo-owned deployment artifact if merged.

## Known Gaps

The underlying admin view models still carry broader context and editorial provenance for other consumers. This change removes only values proven dead at these two rendered component boundaries.
