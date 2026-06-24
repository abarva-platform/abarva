# 2026-06-24-intelligence-visible-language-polish — Intelligence Visible Language Polish

## Release ID

`2026-06-24-intelligence-visible-language-polish`

## Status

`candidate`

## Plain-English Summary

This release removes the remaining visible Intelligence answer-language leaks found by the signed-in browser crawl. It makes the Intelligence ask surface consistently say `aVa`, removes stale `Ava` wording from loading/error/artifact copy, and replaces the generic phrase `validate the cited evidence` with clearer source-review language.

## Layer Impact

- `global-control-lane`: shared Intelligence answer and shell behavior for all clients.
- No schema, data load, RLS, or tenant-private data change.

## Client Applicability

- All clients: yes, wherever the shared Intelligence ask surface and answer policy are active.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: visible shell loading/error/handoff text now uses `aVa`.
- `src/lib/intelligence/answer/structured-exhibits.ts`: artifact notes now use `aVa`.
- `src/lib/intelligence/ask/response-policy.ts`: model-emitted stale `Ava` and `validate the cited evidence` phrasing is sanitized before return.
- `src/lib/intelligence/ask/response-policy.test.ts`: regression assertion prevents the stale cited-evidence phrase from returning.

## QA / Validation

- Focused Jest passed: `npx jest --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts src/app/'(maestro)'/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx --runInBand`
- Focused ESLint passed: `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/ask/response-policy.ts src/app/'(maestro)'/intelligence/ask/SentinelReasoningCards.tsx src/lib/intelligence/ask/response-policy.test.ts`
- Browser crawl baseline captured before this follow-up deploy: `reports/intelligence-quality-current-live-after-cancel-20260624/`.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image, then run a signed-in browser crawl against `https://app.abarva.ai/intelligence/ask`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no local/manual ACA mutation in this release.
- Approved image digest: assigned by the repo-owned ACA deploy after merge.
- ACA runtime invariant: template image, active revision, and 100% traffic image must match the approved main digest.
- Worker image invariant: maintained by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Intelligence Ask crawl with screenshots after deploy.

## Rollback Plan

Revert this release commit and redeploy main through the repo-owned ACA deploy workflow. No data rollback required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local focused test/lint output from the release branch.
- Post-merge ACA deploy evidence and signed-in browser screenshots.

## Known Gaps

This does not itself deploy the prior #3930 quality fix. The #3930 code is already merged to main, but its ACA deploy was canceled before this follow-up branch was created.
