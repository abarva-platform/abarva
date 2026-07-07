# 2026-06-06-meridian-realized-savings-phrase — Meridian Realized-Savings Phrase Guard

## Release ID

`2026-06-06-meridian-realized-savings-phrase`

## Status

`candidate`

## Plain-English Summary

This release tightens one phrase in Ask Intelligence so Meridian/PHS Stars value-spine answers do not accidentally trip the truth-overclaim guard. The answer should frame Stars bonus dollars as scenario upside or sensitivity, and if it mentions realized savings, it must use the exact safe wording `separate from realized savings`.

## Layer Impact

- `global-control-lane`: Updates shared Ask Intelligence response guidance for plan-side Stars value questions.
- No client data, schema, loader, migration, routing, authentication, or artifact-storage changes are included.

## Client Applicability

- All clients: Ask Intelligence receives safer wording for Stars and realized-savings phrasing when relevant.
- Specific clients: Meridian Health System is the live validation client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/intelligence/ask/synthesizer.ts` to remove truth-overclaim trigger wording from the Stars guidance.
- Extends `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` to require the exact `separate from realized savings` phrase and to prevent the forbidden trigger word from appearing in the Stars checklist.
- Pre-fix live QA evidence after PR #3197: production deploy `dpl_3uU57JuTeXxFmHQbdzZFo3VmniN4`, QA run `42 pass / 7 watch / 1 fail`, average `9.6`; the lone failure remained `MHQ-015 Stars value spine`.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with `69/69` tests.
- PASS: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-identity-pin.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts` passed.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed.
- PASS: `git diff --check` passed.
- NOT RUN YET: Post-deploy Meridian 50-question live QA crawl against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, deploy the production Vercel app, then rerun the Meridian hard-question QA crawl. The change becomes active immediately after deployment because it updates deterministic Ask prompt/context guidance.

## Rollback Plan

Revert the merge commit or redeploy the prior production build from commit `801aed098`. No data rollback, migration rollback, or loader cleanup is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI/checks: to be added after validation.
- Production deployment: to be added after Vercel deploy.
- Live QA report: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This release targets only the remaining Stars value-spine truth-overclaim failure.
