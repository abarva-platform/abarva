# 2026-07-27-healthcare-demo-new-source-corpus-design — Tenant Template and Source Corpus Design

## Release ID

`2026-07-27-healthcare-demo-new-source-corpus-design`

## Status

`candidate`

## Plain-English Summary

Adds a design-only Healthcare Demo New template and source-corpus package for a synthetic large integrated delivery network and health plan. The package models Epic-centered operations, Medicare/MA-heavy economics, heavy SQL Server and legacy analytics debt, Azure as the current data foundation/current-use-case footprint, and AWS as the likely future pivot for agentic and transformational use cases.

## Layer Impact

- Client intake: defines practical workbooks, source requests, interviews, KPI and relationship inputs.
- Source adapters: documents parser-visible source families and expected generated Source artifacts.
- Canonical model: preserves universal objects, facts, relationships, metrics, evidence and review contracts.
- Products: no product runtime or read model changes.

## Client Applicability

- All clients: reusable template-factory pattern.
- Specific clients: synthetic healthcare tenant package only.
- Public/demo only: synthetic demonstration corpus design.

## QA / Validation

- Generated validation report confirms shape, target scale, Epic depth, SQL/legacy analytics depth, Medicare/MA boundary, Azure/AWS cloud posture and no Azure/runtime mutation.
- Independent semantic audit passes multi-origin relationship depth, 0 broken endpoints, commercial contract depth, required Source evidence families and reconstructability.
- Final content review passes Epic realism, SQL/on-prem analytics realism, healthcare operating-chain coverage, tenant-specific Medicare/MA framing, Source-event completeness and reconstruction strength.
- Package is frozen as a design/source-corpus foundation only; no data-plane load or runtime publication is included.

## Rollout Plan

Merge only after review. No Azure apply, database migration, source load, parser job, publication job, feature flag, runtime image, or module read-model switch is part of this release.

## Rollback Plan

Revert the package commit. No runtime or data-plane rollback is needed.

## Audit Evidence

- Package manifest: `clients/healthcare-demo-new/19-template-instantiation-source-corpus/PACKAGE_MANIFEST.json`.
- Validation report: `clients/healthcare-demo-new/19-template-instantiation-source-corpus/05-validation/VALIDATION_REPORT.md`.
- Independent semantic audit report: `clients/healthcare-demo-new/19-template-instantiation-source-corpus/05-validation/INDEPENDENT_SEMANTIC_AUDIT_REPORT.md`.
- Final content review report: `clients/healthcare-demo-new/19-template-instantiation-source-corpus/05-validation/FINAL_CONTENT_REVIEW_REPORT.md`.
- Machine-readable audit output: `clients/healthcare-demo-new/19-template-instantiation-source-corpus/05-validation/independent-semantic-audit.json`.

## Known Gaps

Synthetic source sample files are generated for design review, but are not landed into Azure/Postgres. Azure resources are not provisioned. Database migrations are not applied. Parser/firewall/semantic-realism certification has not been run against landed files. Product surfaces are not wired to this package.
