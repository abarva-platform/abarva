# 2026-09-10-source-rfp-evidence-parse-contract - Source RFP evidence parse contract

## Release ID

`2026-09-10-source-rfp-evidence-parse-contract`

## Status

`candidate`

## Plain-English Summary

Structured sourcing-rule evidence can be uploaded as CSV. The RFP checklist assigns sourcing-system rule packs to the procurement/sourcing owner and preserves risk/security ownership for security-control evidence even when a GRC source name contains an ITSM product name.
Parsed evidence that needs a higher authority state can now be reviewed and confirmed directly from the checklist instead of remaining permanently open after upload.

## Layer Impact

- `global-control-lane`, Layer 4 product projection: the Source RFP evidence checklist displays the corrected owner and accepted format.
- Layers 1-3: no schema, adapter, canonical-data, or tenant-data changes.

## Client Applicability

- All clients: yes, for Source RFP workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Canonical RFP evidence requirement accepts CSV for structured sourcing rules.
- Source canvas resolves sourcing-system requirements to the procurement/sourcing owner.
- Risk-control evidence resolves to the risk/security owner before generic source-system matching.
- Parsed checklist evidence exposes an explicit human review form that records the rationale through the existing tenant-scoped evidence-answer route.
- Focused behavior tests cover both contracts.

## QA / Validation

- PASS: focused Jest suites, 89 tests.
- PASS: scoped ESLint for touched TypeScript files.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- PASS: `git diff --check`.
- Pending: live signed-in verification after deployment.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA, after which the RFP checklist is verified in a signed-in Source event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active revision, and required worker images must match the approved digest.
- Worker image invariant: enforced by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a pull request and redeploy via the repository-owned ACA main workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, release-check, and diff-check output.
- ACA workflow run and signed-in Source checklist proof after deployment.

## Known Gaps

Previously uploaded generic XLSX evidence remains registry-only unless a synchronous parser supports its schema; the parseable CSV companion resolves that lifecycle path without changing the workbook content.
