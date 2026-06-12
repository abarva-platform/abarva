# 2026-06-12-source-bind-latest-uploaded-evidence — Bind Latest Uploaded Source Evidence For Generation

## Release ID

`2026-06-12-source-bind-latest-uploaded-evidence`

## Status

`candidate`

## Plain-English Summary

Source document generation now binds the latest uploaded evidence file per filename instead of the oldest rows for an event. Repeated live crawls can upload the same evidence room many times; the previous oldest-first limit meant D09 RFP generation could miss the latest pricing, evaluation, risk, blackout, and run/change files and incorrectly treat them as not parsed. The binder now reads more uploaded artifacts, newest-first, filters uploaded-only rows, de-duplicates by original filename, and passes the latest evidence to the prompt.

## Layer Impact

- `global-control-lane`: Updates Source generation context binding for all generated Source artifacts.
- `client-data-lane`: Read-only behavior change; no client data is mutated or reloaded.

## Client Applicability

- All clients: Source document generation on events with uploaded evidence.
- Specific clients: SkyHarbor is the live proof tenant for the Source self-healing crawl.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/context-binder.ts`: selects latest uploaded evidence per original filename and excludes generated artifacts from uploaded-evidence context.
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts`: regression test for repeated live uploads selecting newest parsed evidence.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/context-binder.test.ts --runInBand` passed.
- `npx eslint src/lib/source/agent-generation/context-binder.ts src/lib/source/agent-generation/__tests__/context-binder.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge after green CI, build and deploy a new Azure Container Apps image, smoke `/api/health` and `/`, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR or shift Azure Container Apps traffic back to the prior healthy revision. No migrations or data changes are involved.

## Audit Evidence

- PR and CI checks.
- Live crawl report under `reports/source-golden-event/` after deployment.
- ACA revision/image digest used for the live re-run.

## Known Gaps

This does not change the quality validator or the evidence parser. It only fixes which uploaded artifacts are bound into generation context.
