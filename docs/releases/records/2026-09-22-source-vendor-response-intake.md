# 2026-09-22-source-vendor-response-intake - Governed response receipt

## Release ID

`2026-09-22-source-vendor-response-intake`

## Status

`candidate`

## Plain-English Summary

Adds a dedicated response-receipt control to the Source Responses stage. An internal operator selects an event supplier and uploads that supplier's response through the existing governed artifact route. The mounted workspace then shows the recorded supplier, upload, parser, governed availability, formal approval, and next-action states without treating receipt as acceptance, evaluation, or a commercial decision.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Source Responses workspace gains a mounted supplier-bound intake and status table.
- Canonical model adapter: response artifact subtypes preserve the selected supplier identifier when text parsing writes commitments and pricing components.
- Client intake: no new intake schema, table, loader, or migration is introduced.

## Client Applicability

- All clients: yes, for Source events with governed supplier-response readiness records.
- Specific clients: none.
- Internal only: the upload action is an authenticated internal operator action.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Mount a supplier-select response upload in the existing Responses stage.
- Reuse the authenticated Source artifact upload route and existing response workbook parser.
- Encode the selected supplier identifier in the response artifact subtype and propagate it to parsed commitment and pricing rows.
- Keep the upload registry-only: it does not target a canvas artifact code or satisfy an artifact gate.
- Read proposal availability only from canonical requirement `EVID-SRC-RESP-PROPOSALS`; artifact approval state is displayed separately and cannot satisfy availability.
- Add mounted behavior and parser regression tests.

## QA / Validation

- PASS: mounted response-intake behavior test covers disabled-state gating, supplier-bound upload, governed route fields, immediate readback, persisted readback, and absence of inferred acceptance, scoring, BAFO, or award.
- PASS: parser behavior test proves the supplier identifier reaches normalized commitment and pricing rows.
- PASS: deliberate mutations were rejected for removing supplier identity, falsely presenting an unreviewed upload as approved, and deriving availability from formal artifact approval.
- PASS: 14 focused Responses/parser suites, 32 tests.
- PASS: Node 24 typecheck and scoped ESLint.
- PASS: test-coverage census write/check.
- PASS: release check, including release-control and deploy-authority gates.

## Rollout Plan

Squash merge through the protected repository, then use the repo-owned ACA main deployment workflow. No schema migration, data build, or tenant mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: recorded by the deployment workflow after merge.
- ACA runtime invariant: template image and the 100% traffic revision must match the approved digest.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. Existing artifact and parser records remain valid; no schema or data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Focused mounted behavior and parser test output.
- Node 24 typecheck, scoped ESLint, coverage census, and release-check output.
- Repo-owned ACA deployment run and immutable digest readback after merge.
- Separate signed-in acceptance evidence after deployment.

## Known Gaps

- Upload receipt does not approve the response or advance evaluation; those remain separate governed actions.
- Signed-in acceptance and deployed runtime proof are not claimed by this candidate record.
