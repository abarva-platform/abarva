# 2026-09-09-source-bidder-qa-generation-context — Source Bidder Q&A Generation Context

## Release ID

`2026-09-09-source-bidder-qa-generation-context`

## Status

`candidate`

## Plain-English Summary

Source Q&A artifact generation now receives the complete parsed bidder-question record as
controlling evidence. When that evidence exists, generation reproduces the supplied questions and
answers instead of inferring a replacement question set from vendor exceptions.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical model: reads existing parsed artifact chunks without changing them.
- Layer 4 — Source: binds bidder Q&A chunks into response-stage artifact generation.

## Client Applicability

- All clients: yes, when a parsed bidder Q&A or clarification log is present.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserve up to 24 parsed chunks for bidder Q&A evidence instead of the generic five-excerpt cap.
- Bind parsed bidder Q&A into a dedicated controlling-evidence prompt section.
- Prohibit inferred vendor questions from replacing supplied question IDs, text, or answers.
- Retain the existing tenant and event scoping on every artifact and chunk read.

## QA / Validation

- PASS — context-binder and prompt-registry Jest suites, 62 tests.
- PASS — ESLint on touched TypeScript and test files.
- PASS — TypeScript validation.
- PASS — `git diff --check`.
- PENDING — release-record validation rerun after this record correction.

## Rollout Plan

Merge by pull request and deploy the exact merge SHA through the repository-owned ACA main deploy
workflow. Regenerate the bidder Q&A artifact, inspect its question IDs and answers against the
parsed source record, and accept it only after that live comparison passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active revision, and 100% traffic revision must use that digest.
- Worker image invariant: checked by the deploy workflow where applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy through the repository-owned workflow. Existing uploaded Q&A
evidence and generated-artifact history remain unchanged and auditable.

## Audit Evidence

- Pull request and squash-merge SHA.
- Focused test, lint, type-check, and release-check output.
- ACA workflow run and digest-pinned runtime readback.
- Signed-in regenerated Q&A artifact compared with its parsed source log.

## Known Gaps

Parsed Q&A evidence remains human-controlled: publication and any binding addendum still require
the named procurement and legal approval outside generation.
