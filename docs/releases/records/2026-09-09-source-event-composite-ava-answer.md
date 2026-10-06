# Source event composite aVa answer

## Release ID

`2026-09-09-source-event-composite-ava-answer`

## Status

`candidate`

## Plain-English Summary

Answer completed-event questions that request both the supplier decision and the value position without dropping either half. The response remains deterministic and evidence-bound: it combines the existing accepted-selection and event-value read models rather than asking a model to calculate or reconcile commercial facts.

## Layer Impact

- Layer 4 product projection, `global-control-lane`: Source event aVa intent routing and answer composition only.
- No intake, adapter, canonical data, schema, cube, corpus, or tenant-data mutation.

## Client Applicability

All clients using structured aVa answers on Source events. Both underlying reads retain their existing event and tenant scoping.

## Changes Included

- Detect questions that request both selection basis and value status before either single-intent route.
- Build both governed answers in parallel and combine their prose, citations, gaps, caveats, and typed exhibits.
- Preserve the existing single-intent behavior for decision-only and value-only questions.
- Fall back to the available governed answer if one builder fails, while retaining structured logging for the failed branch.
- Add focused intent, composition, citation, exhibit, and tenant-fence tests.

## QA / Validation

- PASS: focused Source aVa tests (24 Jest tests across four suites).
- PASS: scoped ESLint and full TypeScript checks.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.
- NOT RUN: live signed-in composite-question proof; required after deployment.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Re-ask one completed-event question that requests the selected supplier, score, committed value, and realized value in a single turn; verify the answer contains all four facts and both governed exhibits.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: template image, active revision, and worker images must match.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. Existing selection-only and value-only answer builders and all Source event data remain unchanged.

## Audit Evidence

- Focused test output, PR, merge SHA, ACA deploy run, runtime invariant, and signed-in composite-answer proof.

## Known Gaps

This change composes the two explicit intents only. It does not introduce general multi-intent planning across every Source aVa question type.
