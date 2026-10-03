# 2026-09-30 Runtime Layer Lineage Upsert

## Release ID

`2026-09-30-runtime-layer-lineage-upsert`

## Status

`candidate`

## Plain-English Summary

Repeated canonical refreshes now update every field supplied by the refresh, including labels, source lineage, graph endpoints, and evidence references, when a row has the same declared identity. Previously, selected attributes changed while some provenance fields retained values from an earlier run. This release changes operator write logic only; it does not run a refresh or publish product claims.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: no intake change.
- Layer 2: no adapter change.
- Layer 3: canonical and graph upserts refresh every inserted mutable field while preserving record and edge identities.
- Layer 4: no product read or presentation change.

## Client Applicability

- All clients: the shared runtime refresh uses this upsert behavior on a future governed job run.
- Specific clients: no tenant is loaded by this release.
- Internal only: operator refresh logic and focused tests.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Derive update assignments from each insert column list to prevent silent omission of new mutable fields.
- Preserve declared conflict keys and immutable record/node/edge identifiers.
- Cover canonical records, graph nodes, raw relationship edges, and materialized graph edges.
- Add focused tests for source labels, source row references, endpoint names, evidence refs, and identity exclusions.

## QA / Validation

- Focused upsert tests, TypeScript typecheck, and touched-file ESLint: passed locally.
- Release check and PR CI: pending at record creation.
- No database connection, tenant write, or signed-in data change is claimed.

## Rollout Plan

Merge through a protected PR and deploy only through the repo-owned ACA main workflow. The updated upsert logic takes effect only when a separately governed, digest-pinned operator job runs. Existing dataset-manifest, quality, and human-review gates remain in place.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker jobs after deployment.
- Worker image invariant: must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm the existing Home record state remains honest; no newly served family is claimed.

## Rollback Plan

Revert through protected main and the approved deploy workflow. No schema or tenant data reversal is involved. A prior job run should be evaluated from its own proof bundle rather than inferred from this code release.

## Audit Evidence

Inspect the PR, focused tests, required CI, ACA deploy, and signed-in Home record-state check. A future data-build proof bundle is separate.

## Known Gaps

- A changed source identity or removed row is not reconciled by a same-key upsert; source-set promotion still needs a scoped replacement/supersession rule.
- The segment source set has no approved manifest or reviewed operator load yet.
- Home serving and narrative coherence remain separate work.
