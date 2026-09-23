# 2026-09-23-source-response-extraction-contract - Bind response questions to accepted authority

## Release ID

`2026-09-23-source-response-extraction-contract`

## Status

`candidate`

## Plain-English Summary

The Source New response-intake view no longer credits a parsed supplier workbook when its backing artifact belongs to another event or tenant, or when the parsed supplier identity does not match the accepted panel identity. A read-only question-level contract exposes answer, pricing reference, exception, evidence references, parser version, confidence, round, review state, and provenance. Missing authority remains visible as a blocker; it is not silently treated as scoring-ready.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema or data mutation. Existing accepted artifact and supplier identities are read as authority.
- Layer 4 Source projection: response intake now checks event, tenant, artifact, and supplier identity before counting normalized questions.

## Client Applicability

- All clients: yes, where Source New response intake is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Read-only accepted-response question extraction contract and focused tests.
- Mounted response-intake identity fence and canonical tenant key passed by the event page.
- No migration, supplier transmission, scoring write, or approval change.

## QA / Validation

- Red-first tests reproduced cross-event/tenant artifact credit and supplier-name-only question credit; both pass after the fix.
- Deliberately removing the tenant fence made the wrong-tenant test fail, then the guard was restored.
- Five focused Jest suites: 24 tests pass locally, including wrong-event, wrong-tenant, mismatched supplier, missing round/confidence, and package-atomic refusal when one question lacks provenance or review.
- TypeScript with an 8 GB Node heap and scoped ESLint pass locally. CI is pending.

## Rollout Plan

Squash merge after applicable PR checks pass; only the repo-owned ACA main workflow may build and deploy. No operator data job or migration apply is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending workflow proof.
- ACA runtime invariant: pending workflow and independent readback.
- Worker image invariant: pending workflow and independent readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, at an event with an accepted response artifact; the frozen Define event cannot yet enter Responses.

## Rollback Plan

Revert this PR through a new reviewed PR and let the repo-owned ACA workflow deploy the rollback digest. No data rollback is needed.

## Audit Evidence

Focused test output, PR checks, merge SHA, ACA runtime-invariant proof, and later signed-in response-intake readback are separate evidence layers.

## Known Gaps

The current mounted read path does not supply an authoritative response round or parser-confidence readback, so extracted rows remain not downstream-eligible until those fields are provided. The frozen event is still at a separate signed-sponsor Define gate; this release does not advance it.
