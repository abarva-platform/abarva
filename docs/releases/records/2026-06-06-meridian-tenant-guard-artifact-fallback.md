# 2026-06-06-meridian-tenant-guard-artifact-fallback — Tenant Guard Artifact Fallback

## Release ID

`2026-06-06-meridian-tenant-guard-artifact-fallback`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now gives a more useful tenant-safe answer when a draft response is blocked for mixed-tenant language. For Meridian board, business-case, Move, Source, artifact, approval, and go/no-go questions, the fallback now names the Meridian tenant boundary and the proof gates needed for pilot readiness instead of returning a generic “re-ask” message. Explicit contamination or cross-tenant probe questions can also mention the probed tenant in a refusal without tripping the guard.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence Ask tenant-isolation fallback behavior and tests. The hard tenant boundary remains in force; this only improves the safe response shown after the guard fires.

## Client Applicability

- All clients: Yes, for Intelligence Ask tenant-guard fallbacks.
- Specific clients: Meridian Health System is the motivating QA case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/tenant-identity-pin.ts`: Adds explicit tenant-boundary probe allowance and a tenant-pinned off-tenant fallback builder.
- `src/lib/intelligence/ask/synthesizer.ts`: Uses the new fallback when the off-tenant mention guard fires.
- `src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts`: Adds regression coverage for contamination probes and artifact-proof fallback wording.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed with 3 suites and 65 tests.
- Pass: `npx eslint src/lib/intelligence/ask/tenant-identity-pin.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts` completed with exit code 0.
- Pass: `npm run release:check -- --base origin/main --head HEAD` passed; Release Control Gate and Pilot Data Loader Gate passed.
- Pass: `git diff --check` completed with exit code 0.
- Planned post-deploy validation: rerun Meridian 50Q hard-question QA against production and compare the guard-related watch items against the `30 pass / 20 watch / 0 fail` baseline from deployment `dpl_An2kxda17rpiKBGogrC8ZgR162o2`.

## Rollout Plan

Merge to `main` and deploy to Vercel production. The fallback change becomes active on the next Intelligence Ask request after deployment.

## Rollback Plan

Revert the PR and redeploy production. No schema, migration, or tenant-data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Production deployment: pending.
- QA crawl report: planned under `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/`.

## Known Gaps

This change does not create new Move artifacts or board packs. It only improves the Ask response when a mixed-tenant draft is blocked.
