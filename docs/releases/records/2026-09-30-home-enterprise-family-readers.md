# 2026-09-30-home-enterprise-family-readers - Home enterprise family readers

## Release ID

`2026-09-30-home-enterprise-family-readers`

## Status

`candidate`

## Plain-English Summary

Home can read four additional enterprise families from the governed serving projection: business segments, business functions, workforce roles, and operating processes. It preserves missing families as coverage gaps and never treats refused or unidentified rows as facts. The record browser can display these families when the data plane serves them.

## Layer Impact

- `global-control-lane`: Layer 4 Home typed readers, deterministic context, and record browser change for tenants with these served families.
- Layers 1-3 and the serving producer are unchanged. This release does not load or modify tenant data.

## Client Applicability

- All clients: Shared Home reader behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home availability controls only.

## Changes Included

- Add four typed record-browser families and serving payload mappings.
- Preserve source-family domains in Home context instead of collapsing supported types into generic evidence.
- Name missing enterprise families and withheld rows as coverage gaps.
- Fall back to the visibly labeled reviewed snapshot if no admissible served rows exist.
- Add reader and fail-closed regression tests.

## QA / Validation

- Targeted Home projection tests: pass (18 tests).
- TypeScript typecheck: pass.
- Touched-file lint: pass with one existing React hook dependency warning; no errors.
- Home test ratchet: pass, 753/781 tests with 12 failing suites matching the committed baseline; no baseline expansion.
- Release check: pass after rebase onto the canonical enterprise contract.
- Final CI and signed-in browser proof: not run; required before this release is called live-proven.

## Rollout Plan

Squash merge a reviewed PR to main and deploy only through the repository-owned ACA main workflow. No migration or data build is part of this release. New families appear only after an approved producer serves admitted rows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record from the completed deploy.
- ACA runtime invariant: Verify template image and 100% traffic revision match the approved digest.
- Worker image invariant: Verify required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including record source and evidence coverage.

## Rollback Plan

Revert this PR through a new reviewed PR and deploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, deploy run, digest invariant, and signed-in browser proof will be recorded in the private Home completion ledger.

## Known Gaps

This release does not populate new served rows, repair older reviewed chapter narrative, infer undeclared relationships, or claim segment coverage in any live tenant. An approved data-plane producer and quality gate are needed for live enterprise-family data.
