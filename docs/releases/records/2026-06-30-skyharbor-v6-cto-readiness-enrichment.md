# SkyHarbor V6 CTO Readiness Enrichment

Date: 2026-06-30

## Lane

`client-data-lane`

## Change

Added a focused SkyHarbor V6 CTO/IROPS readiness slice. This enriches the existing V6 templates for one airline CTO decision storyline rather than broadening the whole synthetic universe.

The slice adds decision-grade rows for:

- IROPS-critical systems
- IROPS data assets and integrations
- AI initiatives
- modernization programs
- planning spend lines
- risks and controls
- typed relationships
- evidence sources
- expert lenses

It also adds a derived packet builder and branching answer contract for the SkyHarbor IROPS readiness demo.

## Product Principle

Advise now. Prove progressively. Upgrade to board-grade when evidence arrives.

## Affected Client

SkyHarbor Air Group synthetic demo pack only.

## What This Does Not Claim

- Does not claim SkyHarbor is board-grade.
- Does not claim exact ROI is proven.
- Does not claim autonomous IROPS should scale immediately.
- Does not claim live production deploy or browser proof.
- Does not invoke Claude in the local proof harness.

## Validation

- `node scripts/intelligence/enrich-skyharbor-v6-cto-readiness.mjs`
- `node scripts/intelligence/validate-v6-tenant-packs.mjs`
- `npx jest src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts --runInBand`
- `npx tsx scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`

## Proof

Local proof artifacts:

- `proof/skyharbor-v6-cto-readiness/01-decision-packet.json`
- `proof/skyharbor-v6-cto-readiness/02-claim-maturity-map.json`
- `proof/skyharbor-v6-cto-readiness/03-missing-evidence-checklist.json`
- `proof/skyharbor-v6-cto-readiness/04-question-proof.json`
- `proof/skyharbor-v6-cto-readiness/05-score-report.json`
- `proof/skyharbor-v6-cto-readiness/README.md`

Result: 12/12 CTO demo questions passed the local contract proof.

## Rollout / Rollback

This is a local dataset and contract proof slice. Production rollout would require loading the enriched V6 pack through the approved Azure/Postgres V6 loader, wiring the packet into the Intelligence/aVa prompt path, rendering branch buttons in the UI, and running signed-in browser proof.

Rollback is to remove the CTO enrichment rows identified by `SHA-*-CTO-*`, remove the packet builder/tests, and regenerate the V6 manifest.
