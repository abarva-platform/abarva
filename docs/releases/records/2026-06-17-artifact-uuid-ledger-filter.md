# 2026-06-17 Artifact UUID Ledger Filter — tenant-context-grounded deliverables persist

## Release ID
`2026-06-17-artifact-uuid-ledger-filter`

## Status
`candidate`

## Plain-English Summary
A generated deliverable failed to save with `generated_artifacts insert failed: invalid input syntax for type
uuid: "ctx:skyharbor-air:it_landscape:…"`. The `evidence_ledger_ids` and `cited_input_ids` columns are `UUID[]`,
but governed evidence retrieved from the Azure tenant-context index carries composite reference strings
(`ctx:<tenant>:<segment>:…`), not ledger UUIDs. Those references belong in the document's source register, not the
UUID audit columns. The repository now writes only genuine UUIDs to those columns, so a tenant-context-grounded
deliverable persists instead of failing the insert. No fabrication and no migration — non-UUID refs are simply not
forced into a UUID column.

## Layer Impact
- **Lane:** `global-control-lane`
- **Layer:** Runtime — `saveGeneratedArtifact` in `src/lib/artifacts/repository.ts` filters `evidenceLedgerIds`
  to valid UUIDs before writing the two UUID[] columns. No schema change.

## Client Applicability
- **All clients:** Yes — any deliverable grounded in Azure tenant-context evidence (which is the standard path).
- **Feature flag:** None.

## Changes Included
- `src/lib/artifacts/repository.ts` — add `isUuid`; write `evidence_ledger_ids` / `cited_input_ids` as
  `evidenceLedgerIds.filter(isUuid)`.

## QA / Validation
- **PASS** — `npx jest src/lib/artifacts/__tests__/repository.test.ts`. `npx tsc --noEmit` clean for the file.
- **Live evidence (before fix):** decomposed Charter run `327c7134` on SkyHarbor `7416481a` generated cleanly
  through the quality gate (`progressPct:100`, **0 blockers**) then failed at persist with the uuid error above.
- **Post-deploy (to attach):** re-run the Charter; expect `status: succeeded` + an `artifactId` + a DOCX in the cabinet.

## Rollout Plan
Merge to `main` (squash); `az acr build`; bump worker job image + roll web revision; deactivate idle revisions.

## Rollback Plan
Re-point to the prior image tag.

## Audit Evidence
- PR + CI above; SkyHarbor `7416481a` Charter reaching `succeeded` with a persisted DOCX.

## Known Gaps
- The non-UUID provenance refs remain available in the document's source register (display/audit); a dedicated
  text column for non-ledger references could retain them in the DB row in a later pass.
