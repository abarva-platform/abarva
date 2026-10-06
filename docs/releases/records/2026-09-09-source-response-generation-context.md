# 2026-09-09-source-response-generation-context — Source Response Generation Context

## Release ID

`2026-09-09-source-response-generation-context`

## Status

`candidate`

## Plain-English Summary

Source artifact generation now receives the same latest-per-vendor normalized response packages
that power the response-review cockpit. Generated response, clarification, and completeness
artifacts therefore use the governed requirement rows and quality measures instead of relying on
older generic file excerpts when the two disagree.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical model: reads the existing normalized response facts without changing them.
- Layer 4 — Source: binds those facts into response-stage artifact generation.

## Client Applicability

- All clients: yes, when normalized response packages are present.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add latest normalized vendor response packages to the tenant- and event-scoped generation
  context.
- Summarize requirement counts, mandatory coverage, dispositions, evidence, pricing, SLA,
  exceptions, nonconformances, and clarification questions for artifact prompts.
- Declare normalized packages as the controlling response-intake record when older generic upload
  summaries conflict.
- Bind the governed summary into response-pack, Q&A, and response-completeness generation.

## QA / Validation

- PASS — context-binder and prompt-registry Jest suites, 60 tests.
- PASS — ESLint on touched TypeScript and test files.
- PASS — TypeScript validation.
- PASS — release-record validation.
- PASS — `git diff --check`.

## Rollout Plan

Merge by pull request and deploy the exact merge SHA through the repository-owned ACA main deploy
workflow. Regenerate the response-stage artifacts and compare them with the live normalized
response cockpit before human acceptance or stage advancement.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active revision, and 100% traffic revision must use that digest.
- Worker image invariant: checked by the deploy workflow where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy through the repository-owned workflow. Existing normalized
response facts and generated-artifact history remain unchanged and auditable.

## Audit Evidence

- Pull request and squash-merge SHA.
- Focused test, lint, type-check, and release-check output.
- ACA workflow run and digest-pinned runtime readback.
- Signed-in regenerated response artifacts compared with the live response cockpit.

## Known Gaps

Generic proposal-document parser status remains distinct from normalized workbook completeness.
Candidate commercial facts still require explicit human acceptance before they become
authoritative.
