# 2026-08-15-atlas-proof-scope-answer-shape — Atlas Proof Scope And Answer Shape

## Release ID

`2026-08-15-atlas-proof-scope-answer-shape`

## Status

`merged-deployed-proven`

## Plain-English Summary

Tightens the Atlas production proof lane after the smoke gauntlet found two separate blockers: Apex is not yet a proof-ready signed-in tenant, and live Atlas answers were not consistently shaped for a CXO. The smoke profile now defaults to the tenants that can be proven end to end, while Apex remains available through an explicit opt-in flag. Atlas visible responses also receive a final executive-readability pass so Copilot and industry answers have the expected four sections, raw signal IDs are translated, legacy agent branding is removed, cross-tenant denials use user-facing evidence language, and every answer has a concrete next action.

## Layer Impact

- `global-control-lane`: changes Atlas production QA harness behavior and the shared Atlas rendered-response contract.
- Product projection layer: affects the visible Atlas/aVa response text returned by `/api/v1/atlas/ask`.
- Data plane: no schema, migration, seed, loader, tenant intake, or persistence changes.

## Client Applicability

- All clients: Atlas response shaping applies wherever the Tower Atlas API is used.
- Specific clients: the Atlas smoke proof scope defaults to Meridian and SkyHarbor until Apex active-client resolution is repaired.
- Internal only: the gauntlet scope controls are AbarVa operator QA behavior.
- Public/demo only: no.
- Feature flag: `ATLAS_GAUNTLET_INCLUDE_APEX=true` opts Apex back into the smoke run.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`: introduces proof-ready smoke tenant scope, explicit Apex opt-in, and tenant-scope progress metadata.
- `src/lib/atlas/rendered-response.ts`: adds the Atlas visible response cleanup and four-section executive shape.
- `src/lib/atlas/__tests__/rendered-response.test.ts`: validates four-section response shape, visible-answer contract compliance, CXO quality compliance, raw signal cleanup, and cross-tenant denial wording cleanup.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`: locks the proof-scope contract into the smoke assertions.
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`: records the execution slice against SRC-PROOF-002 and SRC-PROOF-003.

## QA / Validation

- Pass: `npx jest src/lib/atlas/__tests__/rendered-response.test.ts src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts --runInBand`
- Pass: `npx eslint scripts/qa/atlas-prod-comprehensive-surface.ts scripts/smoke/p21-post-deploy-crawl.spec.ts src/lib/atlas/rendered-response.ts src/lib/atlas/__tests__/rendered-response.test.ts`
- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Follow-up pass: `npx jest src/lib/atlas/__tests__/rendered-response.test.ts --runInBand`
- Follow-up pass: `npx eslint src/lib/atlas/rendered-response.ts src/lib/atlas/__tests__/rendered-response.test.ts`
- Pass after merge/deploy: ACA deploy workflow, ACA runtime invariant, post-deploy crawl, and Atlas production smoke gauntlet on the deployed SHA.

## Rollout Plan

Merged to `main`. The repo-owned Azure Container Apps main deploy workflow built
and deployed the image. Post-deploy crawl and the Atlas production smoke gauntlet
passed with the default smoke scope. Use the excluded-tenant opt-in only after
the active-client membership repair has separate proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: no runtime flag update required; the Apex opt-in is a manual gauntlet-run environment variable.
- Live signed-in proof required: yes, post-deploy crawl plus Atlas smoke gauntlet.

## Rollback Plan

Revert this PR to restore the previous all-tenant smoke scope and prior Atlas rendered response behavior. No database rollback is required.

## Audit Evidence

- PRs: `#6363`, `#6366`.
- Merge commits: `68dca9dcc0015317bd41adc6a3bb8b93ba67efc9`,
  `58a697259c5b28756ce51cbba3ee1c7ee7766973`.
- ACA main deploy workflow run after merge: `31891161508`.
- Post-deploy crawl workflow run after deploy: `31891515211`.
- Atlas production smoke gauntlet: `31891539660`, with `12/12`
  default-scope turns passed, `0` fallback turns, `0` tenant leaks, and `2/2`
  default-scope tenant sessions passed.

## Known Gaps

Apex active-client membership remains unresolved and must not be counted as proof-ready until repaired or explicitly scoped into a run with accepted failure expectations.
