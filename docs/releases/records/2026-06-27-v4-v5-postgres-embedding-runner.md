# 2026-06-27-v4-v5-postgres-embedding-runner — V4/V5 Postgres Embedding Runner

## Release ID

`2026-06-27-v4-v5-postgres-embedding-runner`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator script that embeds pending v4/v5 enterprise context chunks for the five canonical demo tenants into Postgres/pgvector only. This avoids passing dashed script arguments through Azure Container Apps job overrides and keeps the embedding refresh on the same private VNet operator path used for the source reload.

## Layer Impact

- `client-data-lane`: Adds an operational runner for refreshing `enterprise_context_chunks` embeddings after source reloads.
- `global-control-lane`: Adds an npm script entry used by the shared private operator job. It does not change web traffic, app UI, tenant data shape, or feature flags.

## Client Applicability

- All clients: No.
- Specific clients: `apex-retail`, `first-capital`, `lakeshore-holdings`, `meridian-health`, `skyharbor-air`.
- Internal only: Operator runner only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/context-packs/embed-v4-tenants-postgres-only.mjs`
- `package.json` script: `context:v4:embed:postgres-only`

## QA / Validation

- PASS — `node --check scripts/context-packs/embed-v4-tenants-postgres-only.mjs`
- PASS — `git diff --check`
- PASS — `npm run release:check`

Live embedding execution and post-run verification are separate proof steps after merge.

## Rollout Plan

Merge to `main`, build a digest-pinned Azure Container Apps operator image, and run the private operator job with:

`npm run context:v4:embed:postgres-only`

The runner requires `DATABASE_URL` and `OPENAI_API_KEY` secret references and writes embeddings to Postgres only.

## Deployment Authority

- Repo-owned deploy workflow: Not a web deploy; private operator execution only.
- Shared runtime mutators: None. The runner does not mutate the shared web Container App or traffic.
- Approved image digest: Captured when the operator image is built from merged `main`.
- ACA runtime invariant: No web app template or traffic change.
- Worker image invariant: Private operator job restored to idle after execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Required later for retrieval/browser proof; not claimed by this runner.

## Rollback Plan

Revert the npm script and runner. Already embedded rows remain valid Postgres data; if needed, operators can mark affected chunks back to `pending` and rerun the previous embedding path.

## Audit Evidence

- PR URL: to be added.
- CI: release gate and syntax checks listed above.
- Operator proof: to be captured after merge and execution.

## Known Gaps

This is not the final proof. It only gives the private operator job a safe no-argument script to run the existing embedder. Embedding counts, read-model refresh, dossier rebuild, and browser-visible retrieval proof remain separate states.
