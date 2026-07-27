# 2026-07-27-airline-demo-new-source-corpus-design — Tenant Template and Source Corpus Design

## Release ID

`2026-07-27-airline-demo-new-source-corpus-design`

## Status

`candidate`

## Plain-English Summary

Adds a design-only template and source-corpus package with large global-carrier-style synthetic source samples for a new synthetic airline tenant. The package reuses the shared Knowledge factory, creates an airline industry overlay, and defines a technology-procurement Source demonstration corpus without copying populated files or tenant data from another demonstration.

## Layer Impact

- Client intake: defines practical client-facing workbooks, source requests, interviews, KPIs and relationship inputs.
- Source adapters: documents the parser-visible source corpus and the generated Source artifacts expected later.
- Canonical model: preserves universal entity, fact, relationship, metric, evidence, review and publication contracts as the source of truth.
- Products: no product runtime or read model changes in this release.

## Client Applicability

- All clients: reusable template-factory pattern.
- Specific clients: synthetic airline tenant package only.
- Internal only: design and review package for operators.
- Public/demo only: synthetic demonstration corpus design.
- Feature flag: none.

## Changes Included

- Adds `clients/airline-demo-new/19-template-instantiation-source-corpus/` package artifacts.
- Adds required Excel workbooks, scale-depth model, vendor contract portfolio, synthetic source-sample CSVs, design docs, manifest schema, validation report, decision memo and review ZIP manifest.

## QA / Validation

- Generated package validation report confirms required outputs, tenant boundary, overlay separation, procurement scope coverage, relationship typing, hidden-truth boundary and no Azure/runtime mutation commands.
- Manual repository isolation: created in a clean worktree from `origin/main`.

## Rollout Plan

Merge only. No Azure apply, database migration, source load, parser job, publication job, feature flag, runtime image, or module read-model switch is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: normal documentation/data-artifact merge path only.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not required for this design-only package.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no runtime behavior changes.

## Rollback Plan

Revert the package commit. No runtime or data-plane rollback is needed because no resources or data loads are applied.

## Audit Evidence

- Package manifest: `clients/airline-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json`.
- Validation report: `clients/airline-demo-new/19-template-instantiation-source-corpus/05-validation/VALIDATION_REPORT.md`.

## Known Gaps

Synthetic source sample files are generated for design review, but are not landed into Azure/Postgres. Azure resources are not provisioned. Database migrations are not applied. Parser/firewall/semantic-realism certification has not been run against landed files. Product surfaces are not wired to this package.
