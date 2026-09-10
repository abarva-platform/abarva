# 2026-09-09-source-vendor-pack-opening-qa — Score Vendor Openings by Purpose

## Release ID

`2026-09-09-source-vendor-pack-opening-qa`

## Status

`candidate`

## Plain-English Summary

Source now evaluates every vendor-facing package by whether its opening states the document purpose and the action required from the recipient. A response workbook, bidder clarification, or best-and-final-offer request no longer fails merely because it does not repeat RFP-specific language.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / product quality controls: deterministic content QA for vendor-facing Source artifacts.
- Layers 1-3: no intake, adapter, canonical model, schema, or tenant-data changes.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Use a common purpose-and-recipient-action rule across vendor-facing packages.
- Preserve artifact-specific required-exhibit and audience-safety checks.
- Add regression coverage for response-control packs.

## QA / Validation

- PASS: focused Source documentation-quality tests.
- PASS: scoped ESLint.
- PASS: TypeScript no-emit validation.
- PASS: release and diff checks.

## Rollout Plan

Merge through a protected pull request and deploy the exact merge SHA through the repository-owned ACA main workflow. Existing artifact bodies remain unchanged; their deterministic quality receipts are recomputed at read time.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Template, traffic revision, and approved digest must match.
- Worker image invariant: No independent worker mutation.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, inspect vendor-facing artifact quality on an existing Source event.

## Rollback Plan

Revert the squash merge through a new pull request and deploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- Pull request, merge SHA, focused tests, lint, typecheck, release checks, ACA workflow run, and signed-in artifact-quality readback.

## Known Gaps

This quality-rule change does not alter or accept artifact content; operators remain responsible for replacing a blocked client-final document.
