# 2026-06-06-lakeshore-post3187-qa-index — Lakeshore Post-3187 QA Index

## Release ID

`2026-06-06-lakeshore-post3187-qa-index`

## Status

`candidate`

## Plain-English Summary

This release adds the post-deploy QA summaries for the merged and deployed Lakeshore evidence pack. It records that the latest production deploy passed the 26-check app readiness suite and the 8-check Source/Moves retrieval suite when Move attachment APIs are tested with the broker client scope expected by the tenant gate.

## Layer Impact

- Release lane: `public-demo`, `internal-admin`.
- `public-demo`: Updates the buyer/demo proof index with the latest deployed proof state.
- `internal-admin`: Adds operator-readable QA summaries that distinguish active client `lakeshore` from broker client `lakeshore-holdings` for Move attachment retrieval.

No runtime application code, route behavior, database schema, migrations, or client data are changed.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore documentation and demo evidence only.
- Internal only: AbarVa operators can use the notes to avoid rerunning the retrieval harness with the wrong active client scope.
- Public/demo only: The artifacts support controlled Lakeshore demo preparation.
- Feature flag: None.

## Changes Included

- Updates `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md` with post-3187 deployment proof.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/app-demo-readiness.md`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/app-demo-readiness-summary.json`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/source-moves-retrieval.md`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/source-moves-retrieval-summary.json`.

## QA / Validation

- `pass`: Latest production deploy `dpl_HRG1qvhL63nvVqzpsJU5kfnN9b4x` is ready and aliased to `https://app.abarva.ai`.
- `pass`: `BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client lakeshore --refresh`.
- `pass`: Post-3187 app readiness QA returned 26 pass, 0 watch, 0 fail.
- `pass`: Post-3187 Source/Moves retrieval QA returned 8 pass, 0 fail with `LAKESHORE_DEMO_QA_CLIENT=lakeshore-holdings`.
- `blocked`: Private-plane health endpoints still return 404 and are not claimed complete.

## Rollout Plan

Merge the docs-only PR to main. No runtime deploy is required for product behavior, though a normal production deploy may include these static docs/evidence files.

## Rollback Plan

Revert the docs-only commit or remove the added `post-3187-qa/` folder and restore the previous proof index wording.

## Audit Evidence

- App readiness summary: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/app-demo-readiness-summary.json`.
- Source/Moves retrieval summary: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3187-qa/source-moves-retrieval-summary.json`.
- Proof index: `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md`.
- Production deploy: `dpl_HRG1qvhL63nvVqzpsJU5kfnN9b4x`.

## Known Gaps

- Azure/private-plane-specific proof remains incomplete: `/api/health/azure-connectivity` and `/api/health/postgres-disruption` returned 404 during the current proof cycle.
- Corpus expansion remains intentionally deferred until non-corpus demo readiness is complete.
