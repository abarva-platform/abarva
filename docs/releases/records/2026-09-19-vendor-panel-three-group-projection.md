# 2026-09-19 Vendor Panel Three-Group Projection

## Release ID

`2026-09-19-vendor-panel-three-group-projection`

## Status

`candidate`

## Plain-English Summary

Adds a read-only projection for the sourcing-event vendor panel that separates three groups the surface has to keep distinct: eligible candidates, respondents selected for the event, and vendors the organization is already under contract with. The candidate-supplier authority answers the first two but has no view of contracts, so a vendor already under contract previously arrived from it indistinguishable from a fresh candidate. The projection fails closed on three absences — an unavailable or blocked candidate registry, an undeclared eligibility filter, and an unreadable contract register — and returns data with no callable handles, so no send, contact, or selection action can be invoked from it.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 projection helper only. It is a pure function over inputs supplied by the caller.
- No canonical model change, no schema change, no adapter change.
- Not yet mounted on a surface; this adds the projection and its proof.

## Client Applicability

- All clients: no client-facing change yet, because nothing renders this projection.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add `buildVendorPanelProjection`, grouping candidate-authority rows into eligible candidate, selected respondent, and existing-contract vendor.
- Selection takes precedence over contract history, so a vendor that is both appears in the respondent group rather than being filed away as history.
- Surface a contact blocker for every row that cannot be approached, including a row whose contact record is absent and a readiness value the projection does not recognize.
- Refuse to render at all when the candidate registry is unavailable or blocked, when the caller reports that the contract register could not be read, and by inheritance when the authority refused an event with no declared eligibility filter.
- Add a behavior suite built on slices produced by the real candidate authority rather than on hand-written slice literals.

## QA / Validation

- PASS: new behavior suite passes 8 of 8 cases.
- PASS: mutation harness catches 5 of 5 seeded defects — removing the contract-evidence refusal, removing the registry refusal, reversing selection precedence, treating an absent contact record as contactable, and dropping existing-contract recognition entirely. The harness asserts an 8-case green baseline before mutating and confirms the suite returns to green after each restore.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on both new files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. No surface consumes the projection yet, so merging changes no rendered behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Nothing is rendered by this change.

## Rollback Plan

Delete the projection module and its behavior suite. Nothing imports them, so no runtime, data, or schema rollback is required.

## Audit Evidence

- Behavior suite output, before and after the fix.
- Mutation harness output with its baseline self-check.
- TypeScript and lint exit codes.

## Known Gaps

The contract-vendor identifiers and the flag saying whether the contract register could be read are both supplied by the caller. That keeps the projection pure and testable, and it means the fail-closed guarantee is only as good as a caller that reports an unreadable register honestly rather than passing an empty list. Wiring a real read path, and the surface that renders these three groups, are separate items.
