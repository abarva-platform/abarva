# 2026-09-29 Source Client Final Pre-Acceptance Copy

## Release ID

`2026-09-29-source-final-preaccept-copy`

## Status

`candidate`

## Plain-English Summary

The Client Final form now describes artifact authority as a future result of a successful confirmation. It no longer tells an operator, before submission or after a rejection, that a final has already been uploaded and accepted.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: changes only pre-submission form copy.
- Layer 3, canonical model: no facts, artifact authority, or approvals are written by this change.
- Layers 1 and 2: no intake or adapter change.

## Client Applicability

- All clients: yes, when the Client Final form is opened.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replace the post-acceptance governance statement in the pre-submit form with conditional language.
- Keep the post-acceptance governance record and server-side validation unchanged.
- Add render tests for untouched and rejected-upload states.
- Refresh the derived Source render-control import-closure count after removing an obsolete form import; the covered component set is unchanged.
- No migration, data job, or approval-policy change.

## QA / Validation

- Pass: red-first render tests reproduced the premature authority claim before submit and after a rejected upload.
- Pass: restoring the prior statement as a mutation failed both tests.
- Pass: workspace-tab suites, 4 suites and 20 tests.
- Pass: Source render-control census, 21 tests; its derived artifact changes one closure count from 437 to 435, with no component path-set change.
- Pass: TypeScript (`tsc --noEmit --incremental false`), scoped ESLint, `npm run release:check`, and `git diff --check`.
- Not run: PR CI/review and signed-in replay at record creation.

## Rollout Plan

Squash-merge after applicable validation and review. Only the repo-owned ACA main workflow may deploy the digest-pinned image. Inspect the form signed in before submitting any Client Final, and keep the Strategy gate blocked until real artifact review and approval requirements are met.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and sole 100%-traffic revision readback.
- Worker image invariant: pending required worker readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, pre-submit form copy.

## Rollback Plan

Revert through a PR and the repo-owned main deploy workflow. No stored artifact or database migration is rolled back by this release.

## Audit Evidence

- Focused test and mutation output are in the private execution ledger; PR, CI, deploy and signed-in receipts will be recorded separately.

## Known Gaps

- This copy change does not review a draft, accept a Client Final, or approve a sourcing stage.
