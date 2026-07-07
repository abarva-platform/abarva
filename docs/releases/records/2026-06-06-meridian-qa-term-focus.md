# 2026-06-06-meridian-qa-term-focus — Meridian Ask Term Focus Hardening

## Release ID

`2026-06-06-meridian-qa-term-focus`

## Status

`candidate`

## Plain-English Summary

This release tightens how Ask Intelligence answers hard Meridian/PHS executive questions. The assistant already produced grounded, tenant-safe answers, but the live 50-question QA still found a small set of watch items where important buyer terms were implied instead of named. This change nudges answers to use exact decision words such as baseline, forecast, readmissions, data products, SLA, operating model, drift, data quality, artifact, no-go condition, and decision fork when those terms are directly relevant.

## Layer Impact

- `global-control-lane`: Updates shared Ask Intelligence response guidance for healthcare, modernization, AMS/vendor, risk-control, and artifact/approval questions. The change affects response synthesis only.
- No client data, schema, loader, migration, routing, or authentication layer changes are included.

## Client Applicability

- All clients: Ask Intelligence receives the safer query-focus wording when users ask matching hard CXO questions.
- Specific clients: Meridian Health System is the validation client for this release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/intelligence/ask/synthesizer.ts` query-focus checklist wording for healthcare plan/provider analytics, modernization, AMS/vendor governance, risk controls, and artifact approval proof.
- Extends `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` to lock the new exact-term focus behavior.
- Baseline production evidence before this candidate: deploy `dpl_D86kTs3Nepg6AtkCwfGF7FfgmEtA`, merge commit `007680821`, corrected Meridian 50-question QA at `36 pass / 14 watch / 0 fail`, average score `9.38`.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with `68/68` tests.
- PASS: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-identity-pin.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/response-policy.test.ts` passed.
- PASS: `git diff --check` passed.
- PASS: `npm run release:check -- --base origin/main --head HEAD` passed.
- NOT RUN YET: Post-deploy Meridian 50-question live QA crawl against `https://app.abarva.ai`; it runs after merge and production deploy.

## Rollout Plan

Merge to `main`, deploy the production Vercel app, then rerun the Meridian hard-question QA crawl. The release is active immediately after deployment because it changes deterministic prompt/context construction in the Ask response path.

## Rollback Plan

Revert the merge commit or redeploy the prior production build from commit `007680821`. No data rollback, migration rollback, or loader cleanup is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI/checks: to be added after validation.
- Production deployment: to be added after Vercel deploy.
- Live QA report: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This release does not load new Meridian context, create Moves, change artifacts, or alter the Admin loader. It only improves answer phrasing and term coverage for already-grounded Ask responses.
