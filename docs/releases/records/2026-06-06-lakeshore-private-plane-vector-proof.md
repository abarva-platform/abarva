# 2026-06-06-lakeshore-private-plane-vector-proof — Lakeshore Private-Plane Vector Proof

## Release ID

`2026-06-06-lakeshore-private-plane-vector-proof`

## Status

`candidate`

## Plain-English Summary

Records the proof that Lakeshore's Kyriba / treasury wave 1 context was activated inside the private Azure substrate. The evidence separates app-database loader success from private-plane Search/vector success, and explains why Azure AI Search proof must be run from the private Container Apps plane rather than from a local laptop.

## Layer Impact

- `client-data-lane`: Documents Lakeshore-specific pattern, edge, embedding, and Azure AI Search activation evidence for the Kyriba / treasury wave 1 context pack.
- `internal-admin`: Adds an operator-facing proof and rerun standard for private-plane vector activation.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Lakeshore only.
- Internal only: The proof packet is for AbarVa operators, QA, and demo-readiness audit.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/build/lakeshore/LAKESHORE_PRIVATE_PLANE_VECTOR_PROOF_2026-06-06.md`
- `docs/releases/records/2026-06-06-lakeshore-private-plane-vector-proof.md`

## QA / Validation

- PASS: Private Container Apps execution `job-lsh-vector-wave1-eus-jy268d1` loaded 12 Lakeshore Kyriba / treasury patterns, 26 graph edges, generated embeddings, and uploaded 12 Search documents with 12 x `201` statuses.
- PASS: Private Container Apps execution `job-lsh-vector-wave1-eus-yofotrs` queried `lakeshore-patterns-v1` with `tenant_scope eq 'lakeshore'` and returned count `12`.
- PASS: The same private-plane proof query returned Kyriba-ranked hits for `LSH-TMS-003`, `LSH-TMS-012`, `LSH-TMS-002`, `LSH-TMS-001`, and `LSH-TMS-004`.
- Pending before PR: `git diff --check`.
- Pending before PR: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is an evidence/runbook release only. It does not require a Vercel deployment, database migration, or Azure infrastructure change.

## Rollback Plan

Revert the PR if the proof packet needs to be replaced. The underlying private-plane load/search proof was already executed in Azure and is not rolled back by reverting this documentation.

## Audit Evidence

- `docs/build/lakeshore/LAKESHORE_PRIVATE_PLANE_VECTOR_PROOF_2026-06-06.md`
- Azure Container Apps execution `job-lsh-vector-wave1-eus-jy268d1`
- Azure Container Apps execution `job-lsh-vector-wave1-eus-yofotrs`
- Private Search index `lakeshore-patterns-v1`

## Known Gaps

This release proves private-plane vector activation. It does not yet prove that signed-in Lakeshore product routes retrieve and cite the activated patterns inside Intelligence, Moves, Source, and Tower. That remains the next demo-readiness gate.
