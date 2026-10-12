# 2026-10-12-home-narrative-projection-version

## Release ID

`2026-10-12-home-narrative-projection-version`

## Status

`candidate`

## Plain-English Summary

The Home narrative operator and its independent readback can explicitly select canonical
projection version 1 or 2. Reads, generated plans, approved writes and proof must agree on the
selected version. Existing version 1 operation remains compatible; cross-version replay refuses.

## Layer Impact

- Lane: `client-data-lane`.
- Layer 3: explicit version binding for the existing narrative projection operator.
- Layer 4: no page, active selector, advisor context or export change in this release.
- Layers 1 and 2: no intake, adapter or identity changes.

## Client Applicability

- All clients: no automatic data or served-content change.
- Specific clients: none selected by this code release.
- Internal only: existing private narrative build/readback operators.
- Public/demo only: no new public route or fixture data.
- Feature flag: explicit operator projection-version selection; existing write gates unchanged.

## Changes Included

Strict version parser, approved-plan and returned-row version/scope validation, builder/readback
selection, regression tests, path-trigger coverage and operator runbook.

## QA / Validation

- Home narrative boundary suite passed, including 18 executed readiness, admission and version cases.
- Cases cover legacy defaults, both supported versions, malformed versions, plan-version replay,
  tenant/assessment drift and the actual projection reader's SQL parameter binding.
- Node 24 full typecheck passed. Changed-file lint passed with five existing unused-helper warnings
  in the builder; no errors. Release checks passed 11/11 and the coverage census has no drift.
- Current-head required CI and exact deployed-image parity remain separate release gates.
- No model call, production database write, selector switch or new source attestation performed.

## Rollout Plan

PR and repo-owned ACA main deploy only. Operators must explicitly select the exact approved
projection version for later governed jobs. Data readiness, narrative plan approval and publication
remain independent gates; deploying this code does not refresh product content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only.
- Approved image digest: exact main image resolved by the workflow.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required worker jobs match the same approved digest.
- Feature/env flag update path: private execution-specific version selection, no shared env update.
- Live signed-in proof required: later coherent Home serving acceptance, not claimed here.

## ACR Build Policy

`acrabarvalab001` remains Premium. Shared web images are built only through the repo main workflow
using Docker Buildx with `cache-from: type=gha` and `cache-to: type=gha,mode=max`.
No ad-hoc image build, push or prune is included. Active and rollback digests remain preserved.

## Rollback Plan

Revert through a PR and the same ACA workflow. Retain existing governed data and proof artifacts.
Legacy version 1 remains the default; do not silently apply a version 2 plan to version 1.

## Audit Evidence

PR/CI, exact deployed-image parity, selected operator version, exact plan hash, independent source
readiness proof and version-scoped readback. Private proof documents remain outside the public repo.

## Known Gaps

No narrative generation, governance attestation, automatic refresh trigger, cross-assessment mapping
or product promotion is supplied. Version correctness alone does not earn agent readiness.
