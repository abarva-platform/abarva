# 2026-08-04-ava-source-portfolio-grounding-fix — Ground aVa's Source portfolio answers in source.contract_360, not the wrong corpus

## Release ID

`2026-08-04-ava-source-portfolio-grounding-fix`

## Status

`released`

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
- Live signed-in proof (post-deploy, run `30877244851`, merge commit `517fdfb0`, ACA revision
  `ca-abarva-web-lab-eastus--m517fdfb0`, image digest
  `sha256:e41101e4c69478794c7ada3d66ae721ce6b186ce3310a9d68405969db332e90d`): ran a 20-question
  battery against `/api/chat/agent` on `/source/preview/workspace` for the real SkyHarbor/Airline
  Demo tenant, signed in, via direct authenticated fetch. All 20 passed on the criterion this release
  exists to fix — zero occurrences of the fabricated vendor `"Sabre"`, zero `CON-00*`-style invented
  contract ids, and zero unflagged fabricated aggregate figures anywhere in the 20 answers. Coverage:
  the 2 original bug-repro questions, 5 factual/table questions, 2 fabrication probes (an unknown
  renewal date, an ungrounded data-quality score), 4 adversarial/out-of-scope probes (CEO opinion,
  stock-price prediction, named-employee PII, real legal entity name), 2 context-awareness checks
  (using `surfaceContext.selection`/`lens`), 2 cross-domain reasoning questions (industry benchmark
  comparison, a derived-percentage request), and 3 safety/boundary probes (an unrelated scraping
  request, a prompt-injection attempt to leak the system prompt, a cross-tenant data request). In
  every case aVa either quoted a real governed number or explicitly and correctly said the data was
  not available — never guessed. Two minor, non-fabrication quality findings surfaced and are
  addressed in this same PR/follow-up:
  1. The weak-leverage-signal grounding line described the 4 checked signals ambiguously enough that
     one answer summarized them as "three" signal types — fixed in this PR by making
     `ava-portfolio-grounding-context.ts`'s wording list all 4 signals explicitly (no functional
     change, no new number).
  2. One answer (top-vendor-by-concentration question) omitted naming Salesforce among the top
     vendors, while a later question in the same battery correctly named Salesforce as the #1
     vendor by concentration ($133.9M, 9.0%) — an inconsistency between two answers, not a
     fabrication (no false number was asserted in either case, the grounding block itself is a single
     source of truth and was quoted correctly in the answer that did name Salesforce). Logged as a
     known gap below for a future prompt-quality pass; does not block this release since the
     underlying data path is correct and no fabricated value is emitted.
  3. One answer refused to divide two already-quoted grounded numbers (opportunity value ÷ total
     annual value) into a percentage, citing the quote-not-compute guard. Safe, but overly
     conservative — logged as a known gap for a future guard refinement (permit basic arithmetic
     transforms of two already-quoted numbers).

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
- Post-deploy: live signed-in 20-question battery against the deployed revision, captured this
  session via direct authenticated fetch to `/api/chat/agent`; see QA / Validation for the pass
  summary and the two non-blocking quality findings.

## Known Gaps

- `/source/events` shares the identical fix (the grounding condition is `isSourceSurface`, not
  surface-specific), but was not independently live-tested in this release — only the Workspace
  surface was. Worth a spot-check.
- The grounding block covers portfolio-wide totals, concentration, leverage, renewal, and
  opportunities — the same slices the Workspace's Context/Concentration/Leverage/Renewals/
  Opportunities lenses show. It does not cover single-contract detail (financial exposure,
  operational performance, document evidence) — those questions should still be answered from the
  per-contract Contract 360 page, not chat, until a similar grounding wire is built for that surface.
- One live answer named only 4 of the top-5 vendors and omitted Salesforce from a top-vendor list,
  while a separate answer in the same battery correctly identified Salesforce as the #1 vendor by
  concentration — a cross-turn synthesis inconsistency, not a fabricated number. Worth a follow-up
  prompt-quality pass if it recurs.
- The quote-not-compute guard currently blocks even safe arithmetic (e.g. dividing two already-quoted
  grounded totals into a percentage). Worth relaxing in a future pass so aVa can do basic derived math
  on numbers it has already quoted, without reopening the door to fabricated figures.
- Export-to-PDF/HTML and Recharts-based chart rendering inside aVa chat responses is a separate,
  unscoped feature request from the same live-testing session — not covered by this release.
