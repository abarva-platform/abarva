# 2026-06-06-meridian-stars-overclaim-focus — Meridian Stars Value-Spine Overclaim Guard

## Release ID

`2026-06-06-meridian-stars-overclaim-focus`

## Status

`candidate`

## Plain-English Summary

This release fixes one remaining Meridian hard-question QA failure after the prior term-focus deploy. The Stars value-spine answer was directionally conservative, but it used wording that could still sound like a guaranteed return and omitted exact required terms. This update tells Ask Intelligence to frame Stars bonus dollars as scenario upside, name Stars measures and evidence, and avoid guaranteed or committed-dollar language.

## Layer Impact

- `global-control-lane`: Updates shared Ask Intelligence response guidance for plan-side Stars value questions.
- No client data, schema, loader, migration, routing, authentication, or artifact-storage changes are included.

## Client Applicability

- All clients: Ask Intelligence receives safer wording for Stars value-spine questions when relevant.
- Specific clients: Meridian Health System is the live validation client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/intelligence/ask/synthesizer.ts` to add a Stars-specific focus line.
- Extends `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` to require Stars measures, evidence, scenario upside, and no guaranteed/committed-dollar framing.
- Pre-fix live QA evidence after PR #3196: production deploy `dpl_gnPQ83MKTtBLaWkWsKHWodkxdMG7`, QA run `39 pass / 10 watch / 1 fail`, average `9.5`; the lone failure was `MHQ-015 Stars value spine`.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with `69/69` tests.
- PASS: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-identity-pin.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts` passed.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed.
- PASS: `git diff --check` passed.
- NOT RUN YET: Post-deploy Meridian 50-question live QA crawl against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, deploy the production Vercel app, then rerun the Meridian hard-question QA crawl. The change becomes active immediately after deployment because it updates deterministic Ask prompt/context guidance.

## Rollback Plan

Revert the merge commit or redeploy the prior production build from commit `52f4ea56`. No data rollback, migration rollback, or loader cleanup is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI/checks: to be added after validation.
- Production deployment: to be added after Vercel deploy.
- Live QA report: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This release does not attempt to eliminate every watch item. It targets the one remaining fail from the post-PR #3196 live QA run.
