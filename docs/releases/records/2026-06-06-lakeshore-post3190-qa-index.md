# 2026-06-06-lakeshore-post3190-qa-index — Lakeshore Post-3190 QA Index

## Release ID

`2026-06-06-lakeshore-post3190-qa-index`

## Status

`candidate`

## Plain-English Summary

This docs-only release adds the latest post-3190 Lakeshore production QA proof after PR #3190 was merged and deployed. It records that the current production deployment passed the 26-check app readiness suite and the 8-check Source/Moves retrieval suite. It also corrects the active-client note for locked Lakeshore personas: the correct app-client key is `lakeshore`, while `lakeshore-holdings` remains the broker/canonical tenant key underneath.

## Layer Impact

- Release lane: `public-demo`, `internal-admin`.
- `public-demo`: Updates the Lakeshore proof index with the latest buyer/demo evidence.
- `internal-admin`: Preserves the diagnostic distinction between app-client key and broker tenant key so future QA runs do not misread 403s from the Move attachment APIs.

No runtime application code, route behavior, database schema, migrations, or client data are changed.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore documentation and demo evidence only.
- Internal only: AbarVa operators can use the notes to rerun the harness with the correct active client.
- Public/demo only: The artifacts support controlled Lakeshore demo preparation.
- Feature flag: None.

## Changes Included

- Updates `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md` with post-3190 deployment proof.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/app-demo-readiness.md`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/app-demo-readiness-summary.json`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/source-moves-retrieval.md`.
- Adds `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/source-moves-retrieval-summary.json`.

## QA / Validation

- `pass`: PR #3190 merged at `aedbf20fee53c4d910cc5d61eeee0d2a39511297` with all 19 checks passing.
- `pass`: Production deploy `dpl_95PtNH1wp3XXbBY94BYkpGWjjRJr` is ready and aliased to `https://app.abarva.ai`.
- `pass`: `GET https://app.abarva.ai/api/health` returned HTTP 200 with `ok: true`, `postgres: true`, and `direct_postgres: true`.
- `pass`: Post-3190 app readiness rerun returned 26 pass, 0 watch, 0 fail after a short Clerk rate-limit cooldown.
- `pass`: Focused delayed admin/setup route checks returned 200 for `/admin/data-trust`, `/admin/setup`, `/admin/setup/cxo-intel`, `/admin/setup/cxo-intel/cio`, and `/admin/setup/cxo-intel/cfo`.
- `pass`: Post-3190 Source/Moves retrieval QA returned 8 pass, 0 fail with `LAKESHORE_DEMO_QA_CLIENT=lakeshore`.
- `blocked`: Private-plane positive-path health remains unproved because Vercel production does not currently expose the Azure connectivity smoke env/token set.

## Rollout Plan

Merge the docs-only PR to main. No runtime deploy is required for product behavior, though a normal production deploy may include these static docs/evidence files.

## Rollback Plan

Revert the docs-only commit or remove the added `post-3190-qa/` folder and restore the previous proof index wording.

## Audit Evidence

- App readiness summary: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/app-demo-readiness-summary.json`.
- Source/Moves retrieval summary: `docs/build/lakeshore-proof/live-walkthrough/post-3181-authenticated/post-3190-qa/source-moves-retrieval-summary.json`.
- Proof index: `docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md`.
- Production deploy: `dpl_95PtNH1wp3XXbBY94BYkpGWjjRJr`.

## Known Gaps

- Azure/private-plane-specific proof remains incomplete: `/api/health/azure-connectivity` and `/api/health/postgres-disruption` intentionally return masked JSON 404 without an operator token, and the Vercel project does not currently list the Azure connectivity smoke env set.
- Corpus expansion remains intentionally deferred until non-corpus demo readiness is complete.
