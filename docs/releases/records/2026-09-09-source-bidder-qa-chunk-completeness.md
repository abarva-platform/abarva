# 2026-09-09-source-bidder-qa-chunk-completeness — Source Bidder Q&A Chunk Completeness

## Release ID

`2026-09-09-source-bidder-qa-chunk-completeness`

## Status

`candidate`

## Plain-English Summary

Source Q&A artifact generation now preserves each complete parsed bidder-clarification chunk.
Authoritative questions and answers that occur after the generic evidence-excerpt boundary are no
longer omitted from the controlled parity log.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical model: reads existing parsed artifact chunks without changing stored data.
- Layer 4 — Source: preserves complete chunks for recognized bidder Q&A generation context.

## Client Applicability

- All clients: yes, when a parsed bidder Q&A or clarification log is present.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserve the parser's complete chunk text for recognized bidder Q&A evidence.
- Keep the existing 900-character excerpt cap for other uploaded evidence classes.
- Add a regression test proving a second authoritative answer beyond character 900 remains bound.
- Retain existing tenant and event scoping on artifact and chunk reads.

## QA / Validation

- PASS — context-binder and prompt-registry Jest suites, 63 tests.
- PASS — scoped ESLint and TypeScript validation.
- PASS — release-record validation.
- PENDING — signed-in regenerated parity log compared with the parsed source record.

## Rollout Plan

Merge by pull request and deploy the exact merge SHA through the repository-owned ACA main deploy
workflow. Regenerate the bidder Q&A artifact and accept it only if every source question and
authoritative answer is present without inferred replacements.

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
- Signed-in regenerated Q&A artifact compared with the parsed source log.

## Known Gaps

Publication and binding addenda remain subject to the named procurement and legal approval outside
artifact generation.
