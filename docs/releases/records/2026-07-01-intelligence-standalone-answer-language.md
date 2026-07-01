# 2026-07-01-intelligence-standalone-answer-language — Intelligence Standalone Answer Language

## Release ID

`2026-07-01-intelligence-standalone-answer-language`

## Status

`candidate`

## Plain-English Summary

Intelligence answers now reject visible prose that depends on prior chat context, such as "this session" or "as discussed." Each answer must stand alone for the current executive question, which prevents production responses from sounding like they are continuing a hidden conversation.

## Layer Impact

- `global-control-lane`: Updates Intelligence answer contract behavior for every tenant.
- `runtime answer contract`: Adds a hard validation issue when Claude output uses session-history wording in user-visible text.

## Client Applicability

- All clients: yes, for Intelligence advisory answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: instructs Claude to avoid prior-session language and validates final visible output for session-context phrasing.
- `src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts`: adds a regression test for session-dependent answer language.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand`
  - Result: 12 tests passed.
  - Notes: existing duplicate Jest manual mock warnings and localstorage warning are unrelated to this change.
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in ACA Intelligence proof for the Lakeshore/Industrial Demo question that failed the production smoke.
- Pending: 30-question signed-in production smoke rerun.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, rerun the focused Intelligence production proof, then rerun the cross-surface 30-question smoke gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web app and worker job image update through the approved main deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this commit or roll back ACA traffic to the previous healthy revision. No schema, data, or environment migration is included.

## Audit Evidence

- PR URL: pending.
- Local QA passed. CI, ACA invariant, focused signed-in proof, and 30-question smoke outputs pending.

## Known Gaps

This fixes the session-history language failure found in the 30-question smoke. It does not alter the underlying Intelligence packet contents or tenant data quality.
