# 2026-06-29-cio-tower-answer-trace-probe — Query Live Tower Answer Traces

## Release ID

`2026-06-29-cio-tower-answer-trace-probe`

## Status

`candidate`

## Plain-English Summary

Tower chat is still returning the generic invalid-answer-contract error on the deployed app for a simple dashboard-backed spend question. This change adds a read-only operator script so we can inspect the exact prompt, deterministic packet, raw Claude output, rendered response, validation status, and validation errors stored in `cio_tower.answer_traces`.

## Layer Impact

- `global-control-lane`: Adds shared Tower observability for the production/lab runtime.
- `client-data-lane`: Reads tenant-scoped Tower trace rows but does not change tenant data.

## Client Applicability

- All clients: Yes, the read-only trace probe can inspect any tenant's Tower trace rows.
- Specific clients: Immediate diagnosis is for Lakeshore Tower chat.
- Internal only: Yes, script/operator use only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/tower/query-cio-tower-answer-traces.mjs`: read-only trace query script.
- `package.json`: adds `tower:cio:trace`.
- `docs/releases/records/2026-06-29-cio-tower-answer-trace-probe.md`: release record.

## QA / Validation

- `pass`: `npx eslint scripts/tower/query-cio-tower-answer-traces.mjs`
- `pending`: `npm run release:check`
- `pending after deploy`: run `tower:cio:trace` through the ACA private operator job with `TENANT_KEY=lakeshore-industries` and `QUESTION=what is my IT spend?`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. Then run the read-only operator job from inside the private VNet using the deployed digest image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy only
- Approved image digest: produced by the main deploy workflow after merge
- ACA runtime invariant: required by deploy workflow
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: no user-facing proof; this is diagnostic proof for the failing signed-in Tower chat path.

## Rollback Plan

Remove the script and package entry, or redeploy the prior approved main digest. No database rollback is needed because the script is read-only.

## Audit Evidence

- Pre-change browser evidence: signed-in Lakeshore `/tower` still returns `aVa could not produce a valid Tower answer contract` for `what is my IT spend?`.
- PR URL: pending.
- ACA operator trace output: pending.

## Known Gaps

This does not fix the chat response. It exposes the exact live trace so the next patch can fix the right failing layer.
