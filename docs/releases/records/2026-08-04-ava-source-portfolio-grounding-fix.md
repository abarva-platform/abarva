# 2026-08-04-ava-source-portfolio-grounding-fix — Ground aVa's Source portfolio answers in source.contract_360, not the wrong corpus

## Release ID

`2026-08-04-ava-source-portfolio-grounding-fix`

## Status

`candidate`

## Plain-English Summary

Live stress-testing of aVa on the Source Workspace found a serious bug: any portfolio-level
question ("what's the total annual contract value?", "how many contracts carry weak leverage?")
was answered from the wrong data source entirely. `/api/chat/agent` had a deterministic grounding
wire for single-EVENT questions (value at stake, stage status — gated on a `sourceEventId` in
`surfaceContext`), but **no grounding at all for portfolio-level questions** on any `/source*`
surface. Those questions fell straight through to the generic tenant-context vector corpus (a
completely different, unrelated dataset — uploaded intake CSVs like
`family-4-financial-commercial/F11_vendors-contracts-licenses.csv`, keyed to a different tenant
format `"<Client> Demo-air"` vs. the real `skyharbor` tenant_key).

Confirmed live, twice: asked the real SkyHarbor Source Workspace's aVa "total annual contract value
and vendor/contract count" (real answer: 119 contracts, 28 vendors, $1.4805B, vendors like
Salesforce/CloudPeak/GlobalLink), it answered with a vendor called **"Sabre"** and contract ids like
`CON-00207` — neither exists anywhere in the real portfolio — then built a fabricated governance
narrative on top of the wrong data. A second question surfaced an unrelated, unflagged
**"$2.28B annual technology budget"** figure that matches nothing real. This affects `/source/events`
identically, not just the newly-added Workspace surface — traced via direct code inspection, not
assumption (see Changes Included).

## Layer Impact

- `global-control-lane`: `src/app/api/chat/agent/route.ts` is the shared chat backend for every
  agent surface (Moves, Tower, Sentinel, Source, Steward, Home). This change is strictly additive —
  a new grounding block that only populates on `isSourceSurface(surface)` with an active tenant, and
  only suppresses the generic corpus block when it actually produced governed numbers. No other
  surface's behavior changes; verified by full typecheck + the existing chat-route test suite passing
  unchanged (see QA / Validation).
- `client-data-lane`: the new grounding module reads `source.contract_360` /
  `source.vendor_contract_portfolio` via the same read-adapter and pure functions
  (`summarizePortfolio`, `computeVendorConcentration`, `computeContractLeverageSignals`,
  `computeRenewalExposure`, `computeSourcingOpportunities`) the Source Workspace page itself uses —
  no new calculation, no new query shape.

## Client Applicability

- All clients: any tenant with governed Source data loaded now gets correct portfolio grounding on
  `/source*` chat surfaces. Tenants with no `source.contract_360` rows yet see no behavior change —
  the grounding block is empty and the chat falls through exactly as before.

## Changes Included

- `src/lib/source/facts/view/ava-portfolio-grounding-context.ts` (new): `buildAvaSourcePortfolioGrounding(tenantKey)` —
  reads `listContract360`/`listVendorContractPortfolio`, runs the same real pure functions the
  Workspace page uses, and renders a compact "AUTHORITATIVE SOURCE PORTFOLIO GROUNDING" block:
  contract/vendor counts, annual value/actual spend/committed value, top-5 vendor concentration,
  weak-leverage count + value, 180-day renewal exposure, notice-deadline-passed count + value,
  deterministic sourcing-opportunity count + value. Empty block (no assertion) when the tenant has
  zero governed rows or the read fails.
- `src/app/api/chat/agent/route.ts`: wires the new grounding block in, following the exact pattern
  the existing per-event grounding (`ava-grounding-context.ts`) already established:
  - Populates `sourcePortfolioGroundingBlock` inside the same `isSourceSurface(surface) &&
effectiveClientKey` condition that already builds `sourceTenantContextBlock` (best-effort,
    try/catch, never breaks the turn).
  - Reuses the existing `AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD` (imported, not duplicated) — the guard
    now fires whenever EITHER the event grounding or the portfolio grounding produced a block.
  - Extends the three existing `shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`
    call sites (the mechanism that already suppresses the generic corpus block once event-level
    grounding fires — landed across three prior live-bug fixes referenced in the route's own
    comments) to also suppress when portfolio grounding is active, via a new
    `hasSourcePortfolioGrounding` boolean. This is what stops the wrong-corpus content from being
    injected into the same prompt as the correct numbers.
  - Injects `sourcePortfolioGroundingBlock` into the prompt-assembly array next to the existing
    per-event grounding block.
- `src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts` (new): asserts the
  grounding block's totals match `summarizePortfolio` for identical fixture rows (anti-divergence
  guarantee, mirroring the existing per-event grounding test's pattern), asserts real vendor names
  appear, asserts the literal regression signature (`"Sabre"`, `"CON-00"`-prefixed ids) never appears,
  asserts an empty tenant and a failed read both degrade to an honest empty block.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint src/app/api/chat/agent/route.ts src/lib/source/facts/view/ava-portfolio-grounding-context.ts`
- PASS: `npx jest src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts` (3/3, new)
- PASS: `npx jest src/app/api/chat/agent/__tests__/ src/lib/source/data-model/__tests__/ src/lib/source/ava/__tests__/`
  (302/308; the 6 failures across 3 suites are pre-existing static string-matching assertions on
  `route.ts`'s raw source text — confirmed to fail identically on a clean `origin/main` checkout with
  none of this change applied, i.e. not a regression from this diff).
- Live signed-in proof: pending post-deploy — the exact two questions that reproduced the bug live
  must return the real governed numbers (119 contracts, 28 vendors, $1.4805B) with no "Sabre" /
  `CON-00*` / unflagged fabricated figures, and a broader battery of challenging questions will be run
  against the deployed endpoint.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — additive grounding on an existing gated condition.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change — this is a pure read-and-quote
grounding addition over already-governed rows. Reverting restores the exact prior (broken) behavior
for portfolio-level Source chat questions; it does not affect the per-event grounding this change
reuses but does not modify.

## Audit Evidence

- Live pre-fix transcripts (captured this session via direct authenticated fetch to
  `/api/chat/agent` from the real signed-in browser session) showing the "Sabre"/`CON-00207` and
  unflagged "$2.28B" fabrications, reproduced twice with different questions.
- This PR's diff and CI run.
- Post-deploy: live signed-in re-run of the same two questions, plus a broader challenging-question
  battery, with transcripts.

## Known Gaps

- `/source/events` shares the identical fix (the grounding condition is `isSourceSurface`, not
  surface-specific), but was not independently live-tested in this release — only the Workspace
  surface was. Worth a spot-check.
- The grounding block covers portfolio-wide totals, concentration, leverage, renewal, and
  opportunities — the same slices the Workspace's Context/Concentration/Leverage/Renewals/
  Opportunities lenses show. It does not cover single-contract detail (financial exposure,
  operational performance, document evidence) — those questions should still be answered from the
  per-contract Contract 360 page, not chat, until a similar grounding wire is built for that surface.
- Live signed-in proof against the deployed revision is still pending (see Deployment Authority).
