# 2026-10-01-function-segment-adapter-v2 - Declared Function Segment Mapping

## Release ID

`2026-10-01-function-segment-adapter-v2`

## Status

`candidate`

## Plain-English Summary

An opt-in, versioned business-function mapping profile preserves a source-declared segment key in the canonical dry-run record. The existing v1 profile is unchanged. An empty segment key remains empty; this change does not infer an assignment or publish a relationship.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1: no intake or template change.
- Layer 2: one new source-adapter mapping profile; existing profiles remain available.
- Layer 3: no canonical data write. The new profile emits an optional canonical attribute during dry runs only when selected by a future packet contract.
- Layer 4: no Home reader, projection, or visual change.

## Client Applicability

- All clients: the profile is available for explicitly versioned packets; none is switched by this release.
- Specific clients: none.
- Internal only: candidate validation and future governed intake preparation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Add `organization-business-functions/v2` with a `business_segment_key` to `businessSegmentKey` rule.
- Keep v1 rule IDs and behavior unchanged; use distinct v2 rule IDs and lineage.
- Test populated and unresolved function rows and profile isolation.

## QA / Validation

- PASS: two focused v2 adapter tests and 62 existing mapping/Layer 3 contract tests.
- PASS: TypeScript, touched-file lint, formatting, diff check, and release check.
- NOT RUN at candidate authoring: PR CI; required checks must pass before merge.
- NOT RUN until deployment: exact-SHA ACA runtime readback and signed-in Home regression; no new Home behavior is expected.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main workflow. Do not select this profile for an active packet until the packet manifest, source review, scoped data-build job, and readback gate are satisfied.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: unchanged Home record state and no new published segment family.

## Rollback Plan

Revert by controlled PR and redeploy through the same workflow. No data rollback is needed.

## Audit Evidence

Adapter tests, mapping/Layer 3 validation, PR checks, main deploy run, runtime digest readback, and signed-in Home regression proof.

## Known Gaps

This is an adapter capability, not a source-set approval, canonical relationship, or live Home segment spine. An approved packet binding and a validated source-to-canonical-to-serving readback remain required. No client data is generated or loaded by this change.
