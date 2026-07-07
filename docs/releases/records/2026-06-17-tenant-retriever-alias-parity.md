# 2026-06-17 Tenant Retriever Alias Parity — deliverable evidence retrieval grounds again

## Release ID

`2026-06-17-tenant-retriever-alias-parity`

## Status

`candidate`

## Plain-English Summary

Fixes why board-grade deliverables generated against a Move came back ungrounded (`retrievedEvidence: 0`). Governed evidence for a deliverable is retrieved from the Azure AI Search `tenant-context-v1` index, keyed on `tenant_key`. The index **backfill** writes rows under a canonical tenant key via an alias map (e.g. `skyharbor → skyharbor-air`), and the **retriever** keeps a duplicate of that map (on purpose, to avoid a runtime dependency on the backfill's Postgres types). The two maps drifted: the retriever only carried `apexretail`, `arcturus`, and `meridian`, while the backfill also writes `skyharbor`, `lakeshore`, `northstar`, and several spelling variants. So a charter for SkyHarbor queried `tenant_key eq 'skyharbor'` while the corpus is stored under `skyharbor-air` — zero hits, no citable evidence, and the quality gate correctly refused to ship an ungrounded document. This restores the retriever map to the full roster the backfill writes, so SkyHarbor (and Lakeshore, Northstar) retrieve their evidence again.

## Layer Impact

- **Lane:** `client-data-lane`
- **Layer:** Runtime read path — the tenant-key canonicalization map in `src/lib/azure-search/tenant-context-retriever.ts`, used by the deliverable evidence assembler and any Azure-Search-backed retrieval. No schema change, no index change, no data reload — it only changes which `tenant_key` value the read query filters on.

## Client Applicability

- **Specific clients:** SkyHarbor Air (`skyharbor` → `skyharbor-air`), Lakeshore Holdings (`lakeshore` → `lakeshore-holdings`), Northstar Clinical (`northstar` → `northstar-clinical`), plus First Capital spelling variants — all of which were previously retrieving 0 evidence through the Azure-Search lane. Apex/Meridian were already correct and are unaffected.
- **All clients:** No behavior change for tenants already canonical.
- **Feature flag:** None (the Azure-Search retrieval flag `retrieval_azure_search` is unchanged).

## Changes Included

- `src/lib/azure-search/tenant-context-retriever.ts` — modified: `TENANT_KEY_ALIASES` now mirrors the backfill's full roster (12 entries); doc comment updated to record the regression.
- `src/lib/azure-search/__tests__/retriever-parity.test.ts` — added regression assertions for `skyharbor`/`skyharbor-airlines`/`lakeshore`/`northstar`/`firstcapital` canonicalization (18 tests pass).

## QA / Validation

- `npx jest …/retriever-parity.test.ts` → **18 passed / 18 total**.
- `npx tsc --noEmit` → no errors in the changed file (only pre-existing unrelated missing-optional-dep errors).
- **Live root-cause evidence (before fix):** SkyHarbor Move `7416481a` run `36bafef4` generated a full 16-section charter but blocked at the quality gate with `retrievedEvidence: 0` → `1 unsupported client-fact claim` + `source register present but body cites nothing [n]`. Trace: worker `runDeliverableForTenant` → `assembleGovernedEvidence` → `queryTenantContext` filters `tenant_key eq 'skyharbor'`; backfill stored rows under `skyharbor-air`.
- **Post-deploy verification (to attach):** re-run the charter; expect `retrievedEvidence > 0` and the body-citation / unsupported-claim blockers to clear (assuming the `tenant-context-v1` index is populated for `skyharbor-air`).

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build`; the durable generation worker job (`job-abarva-deliv-worker`) runs that image and is the read-path caller, so update the job's image to the new tag (and roll the web revision to match). No migration, no index rebuild, no flag.

## Rollback Plan

Re-point the worker job (and web revision) to the prior image tag. No data to unwind — the only effect is the affected tenants again retrieve 0 evidence (the pre-fix behavior).

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: re-run of Move `7416481a` showing `retrievedEvidence > 0` and a successfully exported charter, or — if the index is not yet populated for `skyharbor-air` — a recorded next step to run the `tenant-context` backfill for that tenant.

## Known Gaps

- The retriever and backfill alias maps are still **two hand-maintained copies**. The parity test now pins the full roster, but a single shared source-of-truth (without the read path taking a Postgres dependency) would be more robust — noted for follow-up.
- This fix corrects the **key** the read path queries. If the `tenant-context-v1` index has not actually been populated for `skyharbor-air`, evidence will still be 0 and the separate indexing/backfill step is required — to be confirmed by the post-deploy re-run.
