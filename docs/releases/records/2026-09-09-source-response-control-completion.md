# 2026-09-09-source-response-control-completion - Complete Vendor Response Controls

## Release ID

`2026-09-09-source-response-control-completion`

## Status

`candidate`

## Plain-English Summary

Source now deterministically completes two controls that a generated vendor response pack must not omit: a measurable automation and productivity commitment table, and a supplier submission certification. The completion runs before quality review and does not invent client facts or commercial values.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / Source artifact generation: deterministic completion of vendor response-control documents.
- Layers 1-3: no intake, adapter, canonical model, schema, or tenant-data changes.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Append a structured commitment table when an automation or productivity control is absent.
- Append supplier certification and submission controls when the document lacks a closing certification.
- Apply the completion to initial generation and quality-rewrite paths.
- Add idempotence and deterministic quality regression coverage.

## QA / Validation

- PASS: focused completion and Source documentation-quality tests.
- PASS required before merge: scoped ESLint, TypeScript no-emit validation, release control, and diff checks.

## Rollout Plan

Merge through a protected pull request and deploy the exact merge SHA through the repository-owned ACA main workflow. The change affects newly generated or rewritten response-control drafts; it does not mutate accepted artifact bodies.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Template, traffic revision, and approved digest must match.
- Worker image invariant: No independent worker mutation.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, generate or rewrite a response-control draft and inspect its quality receipt.

## Rollback Plan

Revert the squash merge through a new pull request and deploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

- Pull request, merge SHA, focused tests, lint, typecheck, release checks, ACA workflow run, and signed-in artifact-quality readback.

## Known Gaps

Existing accepted documents are intentionally not changed. An operator must generate and review a new version before replacing an accepted final.
