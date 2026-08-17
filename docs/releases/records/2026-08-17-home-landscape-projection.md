# 2026-08-17-home-landscape-projection — Home reads its own landscape

## Release ID

`2026-08-17-home-landscape-projection`

## Status

`candidate`

## Plain-English Summary

Home had read-model tables all along — `public.home_knowledge_packs` and
`public.home_knowledge_dimensions` — and no code that read them. The page imported Source's read
adapter and rendered contract and vendor counts instead. Intelligence in turn renders Home's view
model. Three products deep, none of them reading the canonical model.

That is why every status report came back "Source only" while 5,553 canonical entities sat unread
by four of five products. It is also the anti-pattern the architecture design names outright: a
product adapter bypassing Layer 3 to make one screen look correct.

This adds a projector from the canonical model into Home's own tables, and a read path so Home
renders its own enterprise landscape.

## Layer Impact

**Release lane: `client-data-lane`.** Adds a governed writer to product read models and changes a
signed-in surface's read path.

- **Layer 1–3:** unchanged.
- **Layer 4:** new projector writing `home_knowledge_packs` / `home_knowledge_dimensions` from
  canonical records. Home gains a read adapter for those tables.
- **Runtime:** the Home page renders an Enterprise Landscape panel from Home's own data, above the
  existing Source summary card.

## Client Applicability

- Specific clients: the two active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-home-landscape.ts` — canonical → Home projector, dry-run by default,
  write gated on `HOME_LANDSCAPE_WRITE_APPROVED`.
- `src/lib/home/landscape-read-adapter.ts` — Home's read path via the governed `azureRead` client.
- `src/app/(maestro)/home/page.tsx` — renders the landscape panel.
- `package.json` — `data-build:home-landscape`.

## QA / Validation

- Pass: dry-run projects **18 dimensions, 2,348 entities, 0 gaps** across both tenants from 5,553
  canonical records.
- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `npx eslint` on all three changed files — 0 errors.
- Pass: `npm run release:check`.

The writer reads back inside its own transaction and rolls back if the destination row count does
not equal what it claims to have written, so a partial write cannot commit.

## Rollout Plan

Merge, deploy, then run `data-build:home-landscape` as an ACA Job with write approval.

## Deployment Authority

The code change deploys through the repo-owned ACA main deploy workflow. The data build runs as an
ACA Job under `docs/ops/aca-data-build-job-rule.md`, with tenant scope, build version, input source
version, and a proof bundle. No ad-hoc `az containerapp exec`, no traffic or template mutation from
this branch.

## Rollback Plan

Revert the commit. The panel renders "not available" when no pack exists, so an un-run projector
degrades the surface rather than breaking it.

## Audit Evidence

- The commit and its PR.
- Projector dry-run `summary.json`: 5,553 canonical records read, 18 dimensions, 2,348 entities,
  0 gaps, `mode: "dry-run"`.
- `tsc`, `eslint`, and `release:check` output above.
- The ACA Job run id and proof bundle from the write run, recorded on the PR before the surface is
  claimed live-proven.

## Known Gaps

- **The panel shows counts, not narrative.** It answers "what is in the estate and how well
  evidenced is it", not "what does it mean". That is deliberate for a first cut: a count traceable
  to a build is worth more than prose that is not.
- **The Source summary card remains on Home.** A product showing another product's headline is
  legitimate; a product having *no data of its own* was not. The landscape now leads.
- **Intelligence still reads Home's view model**, which is a separate bypass and a separate fix.
- **Moves and Tower still read their own stores**, neither fed by canonical.
