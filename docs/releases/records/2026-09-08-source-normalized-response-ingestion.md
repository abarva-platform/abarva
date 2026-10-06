# 2026-09-08-source-normalized-response-ingestion - Governed Response Intake

## Release ID

`2026-09-08-source-normalized-response-ingestion`

## Status

`candidate`

## Plain-English Summary

Source now recognizes its issued vendor-response workbook when the completed file is uploaded. It preserves each requirement-level answer and computes completeness and traceability controls before evaluation. Strategy and value drafts also receive a deterministic evidence check so an automated prose review cannot approve unbound dollar, percentage, benchmark, or current-market claims.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 - Source adapters: the uploaded-workbook adapter maps the governed response columns into normalized requirement-response records.
- Layer 3 - Canonical model: normalized response rows and their quality summary are persisted as tenant- and event-scoped artifact facts with source-file provenance.
- Layer 4 - Products: the Source Responses stage reads the latest package per vendor and displays completeness and traceability without treating those controls as vendor merit or savings.

## Client Applicability

- All clients: Yes, for Source events using the canonical response workbook.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Parse the canonical Mandatory Items and Optional Items workbook tabs.
- Persist requirement IDs, categories, dispositions, evidence links, pricing links, SLA links, exception links, criterion links, and accountable vendor owners.
- Read the latest normalized package per vendor and derive response readiness.
- Render requirement coverage and traceability controls in the Responses stage.
- Add a deterministic commercial-claim backstop to strategy and value generation.

## QA / Validation

- Focused workbook parser and analytics tests: pass.
- Source consulting-grade quality-gate tests: pass.
- Responses-stage render tests: pass.
- Existing upload-route tests: pass.
- TypeScript no-emit validation with the repository heap profile: pass.
- ESLint for touched files: pass.
- `git diff --check`: pass.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. No schema migration is required because the change uses the existing artifact-fact substrate. After deploy, upload a controlled completed response workbook and verify repository readback plus the signed-in Responses stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof required: Yes

## Rollback Plan

Revert the squash commit through a new PR and redeploy the revert SHA. Uploaded source files remain in the governed registry; the additional normalized facts can be ignored by the reverted reader and do not require destructive cleanup.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, and release-check output
- Controlled upload response payload
- Tenant/event-scoped normalized fact readback
- Signed-in Responses-stage screenshot and DOM assertions

## Known Gaps

- Completeness and traceability are not proposal scoring. Structured pricing, SLA, staffing, transition, and claim exhibits still need their own governed parsers before vendor merit, TCO, or award recommendations can be calculated.
