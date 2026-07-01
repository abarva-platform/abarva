# 2026-06-30-skyharbor-v6-cto-readiness-enrichment — SkyHarbor V6 CTO Readiness Enrichment

## Release ID

`2026-06-30-skyharbor-v6-cto-readiness-enrichment`

## Status

`candidate`

## Plain-English Summary

This release adds a focused SkyHarbor V6 CTO/IROPS readiness slice. It enriches the existing V6 templates for one airline CTO decision storyline rather than broadening the whole synthetic universe.

The slice adds decision-grade context for IROPS-critical systems, data assets, AI initiatives, modernization programs, planning spend lines, risks and controls, typed relationships, evidence sources, and expert lenses. It also adds a derived packet builder and branching answer contract for the SkyHarbor IROPS readiness demo.

## Layer Impact

- `client-data-lane`: Adds SkyHarbor V6 local dataset rows and local packet/proof artifacts. No database migration is included.
- `global-control-lane`: Adds the packet builder and deterministic answer/branch contract used by Intelligence runtime wiring.
- `public-demo`: Supports the airline CTO demo storyline.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor Air Group synthetic demo pack only.
- Internal only: No.
- Public/demo only: Yes, for the SkyHarbor airline CTO demo.
- Feature flag: Existing Intelligence Claude synthesis controls still apply.

## Changes Included

- `datasets/skyharbor-air-synthetic-v6`
- `src/lib/intelligence/skyharbor-cto-readiness.ts`
- `src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts`
- `scripts/intelligence/enrich-skyharbor-v6-cto-readiness.mjs`
- `scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`
- `proof/skyharbor-v6-cto-readiness`
- `docs/intelligence-v6/SKYHARBOR_CTO_AIRLINE_DEMO_PACKAGE_2026-06-30.md`
- `docs/intelligence-v6/SKYHARBOR_V6_CTO_DEMO_DESIGN_AUDIT_2026-06-30.md`

## QA / Validation

Pass:

- `node scripts/intelligence/enrich-skyharbor-v6-cto-readiness.mjs`
- `node scripts/intelligence/validate-v6-tenant-packs.mjs`
- `npx jest src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts --runInBand`
- `npx tsx scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`

Local proof result: 12/12 CTO demo questions passed the deterministic contract proof.

Not run in the original local slice:

- Production deploy and signed-in browser proof.

## Rollout Plan

Use the approved Azure Container Apps deployment lane only after runtime wiring is included in the release candidate. Production rollout requires ACR build, ACA update, healthy revision, 100% traffic assignment, and signed-in SkyHarbor browser proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main/lab deploy lane.
- Shared runtime mutators: Azure Container Apps image/revision/traffic only.
- Approved image digest: To be captured after ACR build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must point 100% traffic at the tested revision before claiming production-live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No env flag change expected.
- Live signed-in proof required: Yes.

## Rollback Plan

Runtime rollback is to move ACA traffic back to the prior healthy revision. Code/data rollback is to remove the CTO enrichment rows identified by `SHA-*-CTO-*`, remove the packet builder/tests, and regenerate the V6 manifest.

## Audit Evidence

- `proof/skyharbor-v6-cto-readiness/01-decision-packet.json`
- `proof/skyharbor-v6-cto-readiness/02-claim-maturity-map.json`
- `proof/skyharbor-v6-cto-readiness/03-missing-evidence-checklist.json`
- `proof/skyharbor-v6-cto-readiness/04-question-proof.json`
- `proof/skyharbor-v6-cto-readiness/05-score-report.json`
- `proof/skyharbor-v6-cto-readiness/README.md`

## Known Gaps

- Does not claim SkyHarbor is board-grade.
- Does not claim exact ROI is proven.
- Does not claim autonomous IROPS should scale immediately.
- Does not claim live production deploy or browser proof.
- Does not invoke Claude in the local proof harness.
