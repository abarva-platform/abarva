# 2026-08-04-home-source-v4-current-layer-bridge — Home aVa Current-Layer Bridge

## Release ID

`2026-08-04-home-source-v4-current-layer-bridge`

## Status

`candidate`

## Plain-English Summary

This release stops Home aVa from silently falling back to retired V6/V7 answer layers and adds a governed Source V4 context bridge to the Home KNOW packet. Home can now show Source V4 contract, vendor, spend, credit, AI usage, cloud, rate-card, sourcing-event and scope-confidence evidence when a question asks for it.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Home aVa no longer calls V6/V7 fallback engines from `/api/home/know/ask`.
- Products and semantic access: Home reads the existing Source V4 workspace snapshot as an evidence slice. Home does not own Source data.
- Data plane: no schema, row, migration or tenant-data mutation.

## Client Applicability

- All clients: applies to the Home aVa runtime behavior.
- Specific clients: Source V4 evidence appears only where the configured tenant has Source V4 snapshot data.
- Internal only: current-layer purge instructions and release proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/home/know/ask/route.ts`: removes V6/V7 fallback calls and returns a current-context block if the current Home path is unavailable.
- `src/lib/home/know/home-know-engine.ts`: adds optional Source V4 snapshot evidence, facts, citations, prose and tables.
- `docs/architecture/HOME_SOURCE_INTELLIGENCE_CURRENT_LAYER_INSTRUCTION.md`: documents the instruction for Home, Source, Intelligence and aVa current-layer behavior plus physical purge gates.

## QA / Validation

- Pass: `npx eslint src/app/api/home/know/ask/route.ts src/lib/home/know/home-know-engine.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow will build and deploy the web runtime after merge. No data migration or operator job runs as part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions only
- Approved image digest: recorded by the deploy workflow after merge
- ACA runtime invariant: existing main deploy workflow
- Worker image invariant: existing main deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes before claiming page-level aVa behavior is live-proven

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request and merge commit for this release.
- Local validation commands and GitHub checks.
- ACA main deploy evidence after merge.

## Known Gaps

Physical deletion of V6/V7 database objects is intentionally not included. That requires a separate exact-object archive/drop operator job with dependency proof and signoff.
