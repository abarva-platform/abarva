# 2026-09-19 Unbounded audit-sweep revert

## Release ID

`2026-09-19-unbounded-audit-sweep-revert`

## Status

`candidate`

## Plain-English Summary

An operator audit sweep was published with a generated measurement that exposed fixture-specific repository details and an execution boundary that could not account for transitive writes outside tracked paths. This release removes that sweep and its generated measurement until it can be redesigned with a sanitized report and an isolated, explicitly bounded execution contract.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- Repository governance: removes an unsafe operator measurement and its package entry points.

## Client Applicability

- All clients: no product behavior changes.
- Engineering operators: the unbounded sweep is unavailable pending redesign.
- Tenant data: none read or written by this release.

## Changes Included

- Remove the generated audit-sweep measurement from the public repository.
- Remove the executable sweep and its package entry points.
- Remove the associated registry entries and behavior suite.
- Restore unrelated generated reports changed as a side effect of the sweep.

## QA / Validation

- PASS: the unsafe merge is cleanly reverted.
- PASS: release control completes with this replacement release record.
- PASS: diff hygiene and public-additions scanning complete successfully.
- PASS: TypeScript is unaffected because no runtime TypeScript changes.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned ACA main workflow may include the commit, but no runtime behavior changes.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Do not restore the removed sweep without a replacement design that sanitizes committed output and proves an isolated execution boundary. A simple revert of this release is not an approved rollback.

## Audit Evidence

- The pull-request diff demonstrates removal of the generated measurement and operator entry points.
- Pull-request checks demonstrate repository integrity after the revert.

## Known Gaps

The unclassified-script inventory still needs classification. The replacement must separate static inventory from execution and must not publish fixture-specific output.
