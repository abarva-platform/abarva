# SkyHarbor CTO Runtime Wiring

Date: 2026-06-30

## Lane

`client-data-lane`

## Change

Wires the focused SkyHarbor CTO/IROPS readiness packet into the Intelligence ask runtime. For SkyHarbor airline questions about IROPS, disruption recovery, AI readiness, autonomous recovery, data certification, model-risk gates, value claims, or board-grade readiness, the runtime now injects a high-priority tenant source derived from the SkyHarbor V6 CTO packet.

The prompt addendum asks Claude/aVa to:

- answer as a senior airline CTO advisor;
- use aVa as the visible advisor identity;
- lead with a point of view;
- distinguish known SkyHarbor context from planning assumptions, industry context, and client-signoff-required claims;
- avoid exact ROI or board-grade claims unless approved values are supplied;
- author right-canvas tabs when useful using the existing visible tab marker grammar.

## Layer Impact

- Intelligence ask runtime source assembly.
- SkyHarbor V6 local decision substrate.
- Local proof artifacts for the SkyHarbor CTO demo lane.

## Affected Clients

SkyHarbor Air Group only. The source helper is gated by SkyHarbor tenant identity plus CTO/IROPS/readiness question detection. Other tenants do not receive the SkyHarbor source or prompt addendum.

## What This Does Not Claim

- Does not claim live browser proof until a signed-in SkyHarbor flow is captured.
- Does not claim live Claude output quality until traces are captured from `/api/intelligence/ask`.
- Does not claim exact ROI or board-grade value for IROPS.
- Does not load the V6 pack into Azure/Postgres in this slice.

## Validation

- `npx jest src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
- `npx jest src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts --runInBand`
- `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`
- `npx tsx scripts/intelligence/prove-skyharbor-v6-cto-readiness.ts`
- `node scripts/intelligence/validate-v6-tenant-packs.mjs`
- `git diff --check` for scoped files

`npm run release:check` is blocked in this local checkout by unrelated untracked-file volume causing `git ls-files --others` to fail with `ENOBUFS`. Context ingestion and Azure lane subchecks passed before that helper failed.

## Rollout

Deploy through the approved Azure Container Apps lane:

1. Commit the scoped SkyHarbor runtime files.
2. Build the exact commit into ACR.
3. Update `ca-abarva-web-lab-eastus`.
4. Wait for the new ACA revision to become ready.
5. Move traffic to the new revision.
6. Run signed-in SkyHarbor Intelligence proof.

## Rollback

Move ACA traffic back to the prior healthy revision. Code rollback is to remove the SkyHarbor ask source helper, remove its import/use in `src/lib/intelligence/ask/index.ts`, and remove the SkyHarbor CTO packet assets if no longer required.
