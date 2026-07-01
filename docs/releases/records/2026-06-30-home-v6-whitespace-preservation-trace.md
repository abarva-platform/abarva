# 2026-06-30-home-v6-whitespace-preservation-trace — Home V6 Whitespace Preservation Trace

## Release ID

`2026-06-30-home-v6-whitespace-preservation-trace`

## Status

`candidate`

## Plain-English Summary

Home V6 now reports Claude text as preserved when the only difference between raw Claude output and visible API prose is whitespace formatting. This matches the answer contract: the renderer may place and format text, but it must not rewrite the model's words.

## Layer Impact

- `global-control-lane`: adjusts Home V6 trace semantics for all tenants on the executive synthesis path.
- `public-demo`: removes false-negative trace failures caused by harmless blank-line insertion before Markdown list items.

## Client Applicability

- All clients: Home V6 tenants using Claude executive synthesis.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing `HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED` behavior applies.

## Changes Included

- Compare raw Claude text and visible prose with whitespace collapsed for the `rawClaudePreserved` / `answerSource=claude_text` trace decision.
- Add a regression test proving Markdown bullets that only differ by blank-line placement still count as preserved Claude text.

## QA / Validation

- Pass: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand`
- Pass: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --max-warnings 0`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Not-run yet: live ACA smoke for raw Claude, API prose, and rendered UI text after merge/deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun signed-in Home V6 trace smoke against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved ACA workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: live app must run the merge SHA image with 100% traffic on the healthy revision.
- Worker image invariant: no worker image change.
- Feature/env flag update path: no new flag.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or redeploy the prior ACA revision/image if trace semantics or answer rendering regress.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4210
- CI run: pending.
- ACA revision and digest: pending.
- Local test output: pending.
- Live smoke output: pending.

## Known Gaps

None known before validation.
