# 2026-10-01-enterprise-structure-candidate — Offline source-set review gate

## Release ID

`2026-10-01-enterprise-structure-candidate`

## Status

`candidate`

## Plain-English Summary

An operator can prepare a self-contained synthetic source-set candidate that adds a declared business-segment and function register to an existing validated source-room pack. The output remains explicitly unapproved and unloaded. An independent verifier checks file hashes, inherited source-room quality, declared function assignments, and missing economic and owner fields before the packet is submitted for review.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 1, client intake simulation: adds two owner-shaped synthetic candidate extracts and a complete source inventory. The original source package is unchanged.
- Layers 2–4: no adapter, canonical, serving, or product runtime mutation.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: operator preparation and verification of a synthetic reference packet.
- Public/demo only: no new live surface.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_dense_enterprise_structure_candidate.py`
- `scripts/ecl/validate_dense_enterprise_structure_candidate.py`
- Existing dense source-manifest integrity suite extended with candidate and planted-failure cases.

## QA / Validation

- `npm run test:ecl-dense-source-manifest-integrity` verifies the intact candidate, checks the JSON/SHA-256 source-set hash contract, and refuses a fabricated function edge, a false approval label, changed source bytes, escaping paths, and duplicate base entries. Home serving planner parity was checked locally, outside this dependency-free CI suite.
- Candidate generation and independent verification must pass before review. A passing candidate verifier is not a dataset approval or data-plane load authorization.

## Rollout Plan

Merge through a PR. The main ACA workflow may publish the code image, but no job invokes this tool automatically. Candidate preparation is an explicit offline operator step. Publication of any generated source set requires a separate approved dataset manifest, scoped ACA data-build job, quality gate, readback, and human review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the main image only.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify the web template and 100% traffic revision use the approved digest if deployed.
- Worker image invariant: verify both required worker jobs use the same approved digest if deployed.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: confirm Home remains on its existing record state; no candidate data should appear.

## Rollback Plan

Revert the PR. Offline candidate output is disposable; no tenant data or product read model requires rollback.

## Audit Evidence

- PR checks and focused source-manifest integrity test output.
- Candidate `candidate_source_set.json` and independent verifier output, retained privately until review.
- Main ACA workflow run and signed-in Home readback if deployed.

## Known Gaps

- The candidate does not declare revenue share, revenue amount, P&L owner, function owner, or decision rights. One function deliberately has no segment edge.
- The universal function template and source-adapter profile do not yet carry the declared segment key end to end; this candidate is not an ingestible publication contract by itself.
- No approved common source-set manifest, canonical load, governed graph publication, Home serving projection, or current executive narrative is included.
