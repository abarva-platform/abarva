# 2026-10-12-native-insight-load-delegation

## Release ID

`2026-10-12-native-insight-load-delegation`

## Status

`candidate`

## Plain-English Summary

The integrated insight candidate job can validate a separately certified delegated load decision.
It reads bounded, authenticated private proof documents by reference, then checks the independently
computed candidate version, rule version, result, date and run release record. Existing human
approvals are unchanged. Loading candidates does not publish them or earn agent readiness.

## Layer Impact

- Lane: `client-data-lane`.
- Layer 3: exact approval validation at the native derived-candidate load boundary.
- Layer 4: no active selector, rendered content, advisor context or export changes.
- Layers 1 and 2: no intake or adapter changes.

## Client Applicability

- All clients: existing named-human approvals unchanged.
- Specific clients: none selected or mutated by this release.
- Internal only: authenticated operator job execution.
- Public/demo only: delegated execution remains limited by the shared synthetic trust policy.
- Feature flag: explicit committed approval declaration and exact private evidence required.

## Changes Included

Native candidate binding helper, authenticated approval proof reader, candidate job/store opt-in,
optional byte-bound Blob proof reads, tests and operator runbook. A separately reviewed exact
candidate-load decision pin and conditional manifest declaration are included; the authority
scope is unchanged. No serving approval or source-state mutation is included.

## QA / Validation

Focused delegation/load tests, existing candidate and job regression tests, Node 24 typecheck,
changed-file ESLint, governance validation, coverage census and release checks must pass before
merge. Current-head CI and native readback are separate proof layers.

## Rollout Plan

Merge through a PR after the shared explicit-approval contract, then deploy through the repo ACA
main workflow. An exact separately reviewed manifest and immutable private proof documents are
required before any candidate apply. This release performs no data build by itself.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: exact main image resolved by the workflow.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required worker jobs match the same approved digest.
- Feature/env flag update path: no shared flags or env changes.
- Live signed-in proof required: Home serving acceptance belongs to its separate admission release.

## ACR Build Policy

`acrabarvalab001` remains Premium. Only the repo-owned main deploy workflow builds shared web
images, using Docker Buildx with `cache-from: type=gha` and `cache-to: type=gha,mode=max`.
No ad-hoc image build, push or prune is part of this release. Active and rollback digests are
preserved; runtime updates remain digest-pinned.

## Rollback Plan

Revert through a PR and the same ACA workflow. Human approval behavior remains unchanged. Loaded
candidates are immutable, unreviewed and not product-active; do not delete them as code rollback.
Revoked or completed trust entries refuse new delegated operations.

## Audit Evidence

PR/CI, local tests, exact image binding, private proof hashes, native candidate input/rule/result
hashes, independent load readback and operator idle restoration. Do not publish private documents.

## Known Gaps

No Home review/serving delegation, automatic upstream trigger, cross-assessment identity mapping,
source-quality attestation, narrative regeneration or visual PDF parity is supplied here. Those
remain independently governed work. Loaded does not mean indexed, retrievable, cited or ready.
