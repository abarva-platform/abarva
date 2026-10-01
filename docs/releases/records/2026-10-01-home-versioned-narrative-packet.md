# 2026-10-01 Home Versioned Narrative Packet

## Release ID

`2026-10-01-home-versioned-narrative-packet`

## Status

`candidate`

## Plain-English Summary

Home narrative publication now persists the exact governed signal packet used by its writer. The Home reader accepts that packet only when its tenant, assessment, factual rows, source links, and packet hash still match. A matching writer hash without the versioned packet no longer establishes narrative coherence.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake and source adapters: no changes.
- Canonical model: no schema or tenant-data changes. The existing Home story-plan row carries the versioned packet artifact.
- Product: Home read-model coherence and the shared packet available to page, aVa, and export consumers.

## Client Applicability

- All clients using the shared Home ECL narrative writer and reader.
- No client-specific behavior, tenant write, or feature-flag change.

## Changes Included

- Bind the narrative packet to tenant, assessment, factual-row content, and verified source-link lineage.
- Require exact artifact parity on approved-plan writes and on Home readback.
- Use the accepted writer packet as the Home bundle packet; leave unmatched narrative explicitly unverified.
- Add planted drift and tampering tests for row content, links, packet hash, tenant, and assessment.

## QA / Validation

- PASS: focused Home projection and packet tests, 26/26.
- PASS: Home ECL narrative contract tests.
- PASS: TypeScript typecheck under Node 24.
- PASS: targeted ESLint, zero errors and five existing unused-function warnings in the dormant writer source path.
- PASS: Home ratchet, 800/828 tests with 12 existing baselined suites and no movement.
- PASS: `npm run release:check`.
- NOT RUN: governed narrative generation or tenant-data build.

## Rollout Plan

Squash-merge the reviewed PR. The repository ACA main deploy workflow builds and deploys the exact merged SHA. No migration or tenant-data operation is included. Previously stored narrative rows without this artifact remain unverified.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- ACA runtime invariant: web template, 100% traffic revision, and required worker jobs must match the approved image digest.
- Live signed-in proof: verify Home record state and counts without claiming new narrative publication.

## Rollback Plan

Revert this PR through a reviewed PR and the same ACA main workflow. Do not bypass source admission or narrative coherence controls.

## Audit Evidence

PR, test output, ACA deploy run, runtime digest invariant, and signed-in Home readback in the private completion ledger.

## Known Gaps

This release does not publish new tenant narrative. Source-family admission and a governed narrative build remain separate gated work.
