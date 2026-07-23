# 2026-07-23-home-knowledge-pack-v3-count-language-hardening — Home Count-Language Hardening

## Release ID

`2026-07-23-home-knowledge-pack-v3-count-language-hardening`

## Status

`candidate`

## Plain-English Summary

After Home Knowledge Pack v3 was deployed and populated, signed-in proof showed the relationship pages rendered the new graph correctly but still exposed internal inventory-count language such as relationship counts and loaded-row metrics. This release tightens the Claude authoring gate and removes deterministic low-level count labels from the executive Home surface so the page reads like a CXO context cockpit rather than a data-load report.

## Layer Impact

- `global-control-lane`: shared Home / Knowledge UI rendering and shared Home pack generation script for all tenants using the approved Home Knowledge Pack read model.
- `client-data-lane`: no schema change, but the governed operator population job must be rerun so approved packs are regenerated with the stricter prompt/quality gate.

## Client Applicability

- All clients: all active demo tenants using the Home Knowledge Pack read model receive the UI hardening after ACA deploy.
- Specific clients: Meridian and FS Demo require first signed-in proof because they were the first screenshots inspected.
- Internal only: no.
- Public/demo only: active demo tenants only.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`: expands client-visible quality scanning to catch relationship counts, candidate counts, loaded-row counts, and graph-object counts; adds retry/quality validation to the relationship-reader Claude call; tightens the relationship prompt to translate graph mechanics into executive meaning.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: hides deterministic low-level breakdown rows such as loaded rows and distinct record names; evidence-mix visuals now show posture percentages instead of raw sample counts.
- `docs/releases/records/2026-07-23-home-knowledge-pack-v3-count-language-hardening.md`: release evidence record.

## QA / Validation

- `pass` — `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- `pass` — `npx eslint scripts/knowledge/build-home-knowledge-pack-v2.mjs src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- `pending` — `npm run release:check`
- `pending` — ACA deploy, governed population rerun, database verify, and signed-in browser proof after merge.

## Rollout Plan

Open a follow-up PR, merge to main, deploy through the repo-owned ACA main lane, then rerun Home pack population through the governed ACA operator job. Verify the Postgres readback reports all tenants `approved` and `COMPLETE`, then capture signed-in Home screenshots for Meridian and FS Demo relationship/evidence sections.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only the repo-owned ACA main deploy workflow and governed ACA operator job.
- Approved image digest: pending after ACA deploy.
- ACA runtime invariant: pending after ACA deploy.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian and FS Demo first.

## Rollback Plan

Revert this PR and redeploy through ACA main. If regenerated packs are already written, rerun the Home pack population job from the prior approved image or restore the previous approved pack version if a stricter relationship gate blocks valid content unexpectedly.

## Audit Evidence

- PR: pending.
- Initial proof finding: live Meridian and FS Demo screenshots from `/tmp/home-knowledge-v3-browser-proof-20260723` showed graph rendering plus internal count-language leakage.
- Validation commands listed above.

## Known Gaps

Final deploy, population rerun, readback verification, and signed-in browser proof are pending until this candidate PR merges.
