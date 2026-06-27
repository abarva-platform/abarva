# 2026-06-27-tower-live-scorer — Tower Live Quality Scorer

## Release ID

`2026-06-27-tower-live-scorer`

## Status

`candidate`

## Plain-English Summary

Adds a signed-in Tower live scorer that uses the Tower semantic question bank to test the deployed application, capture verbatim questions and raw answers, and score routing, readiness honesty, latency, artifact presence, consistency against read-model values, separate realism, stale branding, raw IDs, and handoff/safety behavior.

## Layer Impact

- `global-control-lane`: adds QA tooling and readiness metadata only. No runtime product behavior changes.
- `client-data-lane`: none. The scorer reads the live signed-in app but does not mutate Tower datasets or read models.

## Client Applicability

- All clients: QA framework is tenant-agnostic.
- Specific clients: first live default uses the Lakeshore signed-in agent state because the current Tower demo-readiness lane focuses on Lakeshore.
- Internal only: yes, this is an internal QA/scoring tool.
- Public/demo only: no.
- Feature flag: no runtime flag.

## Changes Included

- `src/lib/tower/tower-question-bank.ts`
- `src/lib/tower/tower-question-readiness.ts`
- `src/lib/tower/__tests__/tower-question-bank.test.ts`
- `src/lib/tower/__tests__/tower-question-readiness.test.ts`
- `scripts/qa/tower-live-scorer.ts`

## QA / Validation

- Pass: focused Jest for the Tower question bank and readiness map.
- Pass: focused ESLint for changed Tower QA files.
- Pass: TypeScript compilation.
- Pending: `npm run release:check` after this release record is updated.
- Pass: dry-run scorer plan generation.
- Not run yet: optional live scorer run against `https://app.abarva.ai/tower` with a Clerk signed-in storage state.

## Rollout Plan

Merge to main. No Azure Container Apps deploy is required for the scorer itself because it is an internal QA script. Operators can run it from the repo against the deployed app.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not affected.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: scorer output under `~/Downloads/tower-live-scorer-<timestamp>/`.

## Rollback Plan

Revert this release record plus the scorer/readiness/question-bank changes. No data rollback is required.

## Audit Evidence

- Test output from focused Jest, ESLint, TypeScript, and release check.
- Generated scorer output directory and zip under `~/Downloads`.
- `SCORER_REPORT.md`, `aggregate-report.json`, per-question traces, and `readiness-map.json`.

## Known Gaps

The scorer intentionally keeps chat/read-model consistency separate from data realism. It can prove whether chat matches the current Tower read model, but it does not make unrealistic read-model values correct.
