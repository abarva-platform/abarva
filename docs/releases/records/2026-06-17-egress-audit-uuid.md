# 2026-06-17 Egress-Audit UUID — artifact persists with the decomposed flow

## Release ID
`2026-06-17-egress-audit-uuid`

## Status
`candidate`

## Plain-English Summary
`generated_artifacts.generation_egress_audit` is a single UUID foreign key to `ai_egress_audit(id)`. The
persistence code set it to ALL of the generation passes' response ids stitched with commas — and those response
ids are Anthropic message ids (`msg_…`), not audit UUIDs. With the decomposed flow making ~17 model calls the
value became a long `msg_…,msg_…` string and the insert failed (`invalid input syntax for type uuid`). It now
links the first pass whose response id is a genuine audit UUID, else null — so a generated deliverable persists.
(The per-call audit rows still exist independently in `ai_egress_audit`.)

## Layer Impact
- **Lane:** `global-control-lane`
- **Layer:** Runtime — `persistDeliverable` in `src/lib/deliverables/orchestrator/persistence.ts`. No schema change.

## Client Applicability
- **All clients:** Yes. **Feature flag:** None.

## Changes Included
- `src/lib/deliverables/orchestrator/persistence.ts` — `generationEgressAudit` = first valid-UUID response id, else null.
- `persistence.test.ts` — updated to the new contract.

## QA / Validation
- **PASS** — `npx jest …/persistence.test.ts`: 6/6. `npx tsc --noEmit` clean for the file.
- **Live evidence (before fix):** decomposed Charter `aabc4597` on SkyHarbor `7416481a` cleared the quality gate
  (`progressPct:100`, 0 blockers) then failed at persist with the `msg_…,msg_…` uuid error. (Companion to #3620
  which fixed the `ctx:` provenance-ref case in the same insert.)
- **Post-deploy (to attach):** re-run the Charter; expect `status: succeeded` + `artifactId` + DOCX.

## Rollout Plan
Merge to `main` (squash); `az acr build`; bump worker job image + roll web revision; deactivate idle revisions.

## Rollback Plan
Re-point to the prior image tag.

## Audit Evidence
- PR + CI above; SkyHarbor `7416481a` Charter reaching `succeeded` with a persisted DOCX.

## Known Gaps
- The other generated_artifacts text columns (client_id, source_artifact_ref, rendered_by) are TEXT and accept
  any string; only the three UUID columns needed guarding, and all three now are.
