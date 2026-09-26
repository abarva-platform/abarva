# 2026-09-26-source-client-final-approval-rights - Client-final promotion authority

## Release ID

`2026-09-26-source-client-final-approval-rights`

## Status

`candidate`

## Plain-English Summary

The existing client-final upload action makes a file authoritative. It now requires the acting user to have both artifact-upload and stage-approval rights for the selected client and event. The user must record an approval rationale. A denied request stops before blob or artifact metadata writes.

## Layer Impact

Release lane: `global-control-lane`. This is a Layer 4 Source authorization control over an existing artifact workflow. It does not change Layer 3 facts, supplier identity, pricing, contract terms, or schema.

## Client Applicability

- All clients: Authenticated Source client-final artifact uploads.
- Specific clients: None.
- Internal only: The existing operator workflow.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Resolve Source access policy for the authenticated tenant, active client, and event before processing a client-final upload.
- Require upload and stage-approval rights together; fail closed when policy lookup fails.
- Require a nonblank approval rationale and explain the authoritative effect in the form.

## QA / Validation

- Red-first route tests: Pass as reproduced failures before implementation for an uploader without approval rights, failed policy lookup, and absent rationale.
- Focused Jest: Pass, 27 tests across the route and canvas interaction. Negative cases include an approver without upload rights and whitespace-only rationale.
- Mutation proof: Pass. Replacing the approval-rights predicate with a duplicate upload-rights predicate caused the nonapprover test to fail (expected 403, received 200); the correct predicate was restored.
- TypeScript: Pass (`tsc --noEmit --pretty false`, 8 GB Node heap).
- Scoped ESLint: Pass. `npm run release:check`: Pass.
- Signed-in promotion: Not run; no tenant artifact is promoted by this release validation.

## Rollout Plan

Merge by reviewed PR. Only the repository-owned ACA main workflow may build and deploy the image. No migration, data build, email, supplier contact, flag, or manual traffic shift is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Owed after merge.
- ACA runtime invariant: Owed after merge.
- Worker image invariant: Owed after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected action when an authorized test artifact and approver are available.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. Reversion removes this authorization guard, so suspend client-final promotion until a replacement control is proven. No data rollback is required.

## Audit Evidence

Focused red/green and mutation test output, local validation, PR review/CI, official deploy run, digest-pinned runtime readback, and signed-in acceptance are separate proof layers.

## Known Gaps

This retains the existing combined upload-and-promote action. A separate uploaded proposal state, independent named acceptance transaction, rendered-file review, and supplier-specific release validation remain unimplemented. Stage-approval permission alone is not evidence that a particular file was reviewed or approved by a client sponsor.
