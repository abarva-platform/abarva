# 2026-06-30-skyharbor-cto-runtime-wiring — SkyHarbor CTO Runtime Wiring

## Release ID

`2026-06-30-skyharbor-cto-runtime-wiring`

## Status

`candidate`

## Plain-English Summary

Wires the focused SkyHarbor CTO/IROPS readiness packet into the Intelligence ask
runtime. For SkyHarbor airline questions about IROPS, disruption recovery, AI
readiness, autonomous recovery, data certification, model-risk gates, value
claims, or board-grade readiness, the runtime now injects a high-priority tenant
source derived from the SkyHarbor V6 CTO packet.

The prompt addendum asks Claude/aVa to: answer as a senior airline CTO advisor;
use aVa as the visible advisor identity; lead with a point of view; distinguish
known SkyHarbor context from planning assumptions, industry context, and
client-signoff-required claims; avoid exact ROI or board-grade claims unless
approved values are supplied; and author right-canvas tabs when useful using the
existing visible tab-marker grammar.

## Layer Impact

- `client-data-lane`: client-scoped tenant source assembly and prompt addendum
  for one tenant (SkyHarbor). Affects the Intelligence ask runtime source
  assembly, the SkyHarbor V6 local decision substrate, and the local proof
  artifacts for the SkyHarbor CTO demo lane. No shared control-plane behavior
  changes for other tenants.

## Client Applicability

- All clients: no
- Specific clients: SkyHarbor Air Group only
- Internal only: no
- Public/demo only: no
- Feature flag: gated by SkyHarbor tenant identity plus CTO/IROPS/readiness
  question detection; other tenants receive neither the source nor the addendum

## Changes Included

- SkyHarbor CTO/IROPS readiness ask source helper injected into the Intelligence
  ask runtime source assembly (`src/lib/intelligence/ask/index.ts` and the
  SkyHarbor source helper it imports).
- Prompt addendum grammar (CTO advisor identity, POV-first, claim-tier
  separation, ROI guardrails, right-canvas tab authoring).
- SkyHarbor V6 CTO packet assets consumed as the injected source.

## QA / Validation

Validation status: **blocked** locally — `npm run release:check` failed in this
checkout with `ENOBUFS` (unrelated untracked-file volume causing
`git ls-files --others` to overflow); context ingestion and Azure lane subchecks
passed before that helper failed. The change's test set (run locally):

- `npx jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
- `npx jest src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts --runInBand`
- `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`
- `npx tsx scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`
- `node scripts/intelligence/validate-v6-tenant-packs.mjs`
- `git diff --check` for scoped files

## Rollout Plan

Deploy through the approved Azure Container Apps lane:

1. Commit the scoped SkyHarbor runtime files.
2. Build the exact commit into ACR.
3. Update `ca-abarva-web-lab-eastus`.
4. Wait for the new ACA revision to become ready.
5. Move traffic to the new revision.
6. Run signed-in SkyHarbor Intelligence proof.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Move ACA traffic back to the prior healthy revision. Code rollback is to remove
the SkyHarbor ask source helper, remove its import/use in
`src/lib/intelligence/ask/index.ts`, and remove the SkyHarbor CTO packet assets
if no longer required.

## Audit Evidence

- The validation commands listed above (jest suites, prove/validate scripts).
- ACA revision/image once deployed (not yet captured).
- Signed-in SkyHarbor Intelligence browser proof (not yet captured).

## Known Gaps

- Does not claim live browser proof until a signed-in SkyHarbor flow is captured.
- Does not claim live Claude output quality until traces are captured from
  `/api/intelligence/ask`.
- Does not claim exact ROI or board-grade value for IROPS.
- Does not load the V6 pack into Azure/Postgres in this slice.
