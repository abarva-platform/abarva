# 2026-08-17-home-canonical-economics — Home economics, and a plausibility gate

## Release ID

`2026-08-17-home-canonical-economics`

## Status

`candidate`

## Plain-English Summary

Home's headline economics were string literals. The model file is 800 lines with zero data calls, and
two of its four anchors — a technology budget of **$2.35B** and a prior-year actual of **$2.18B** —
had no data path behind them.

The obvious fix was to sum `spend_value_fact` and quote that. **That fix is wrong, and building it
is what exposed the real defect.** The two tenants' spend sheets do not share a grain:

- One lists **technology spend by category** and totals **$663M** — against **$81.4B** revenue, which
  is **0.81%**. Airlines run 2–4%. The figure is implausible by roughly a factor of three.
- The other lists **enterprise spend by business function** — facilities, HR, behavioural health —
  and totals **$5.43B** on **$24B** revenue, of which the actual IT line is **$103M**. Quoting that
  total as a technology budget overstates it more than fiftyfold.

Both loaded cleanly. Every layer tied, every record carried evidence, the numbers reached a product.
Nothing asked whether they were *believable*, because correctness had been defined as "what we stored
equals what was supplied" — which was true in both cases.

So this release does two things, and the second matters more than the first:

1. **Home quotes canonical only where canonical can support the claim.** Annual contract value means
   the same thing on every intake, so it is quoted. The spend total is not labelled a technology
   budget by either tenant's data, so that anchor reads "Not established" with the reason.
2. **A plausibility and grain gate**, so this class of defect fails a build instead of rendering.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 3:** unchanged.
- **Layer 4:** the projection carries summed money and value per dimension, each with the count of
  contributing records. Spend and opportunity value are summed separately so they can never be added.
- **Runtime:** Home's contract anchors read canonical; the two unsupported anchors state their gap.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-home-landscape.ts` — `MONEY_ATTRIBUTES`, `VALUE_ATTRIBUTES`, `sumAttribute`.
- `src/lib/home/landscape-read-adapter.ts` — exposes `money`, `value`, `byKey`.
- `src/app/(maestro)/home/page.tsx` — `withCanonicalEconomics`.
- `scripts/audit/validate-spend-plausibility.mjs` — the gate.
- `package.json` — `validate:spend-plausibility`, `validate:spend-plausibility:strict`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- Pass: the gate reports all three known defects and names each by kind:

  | Tenant | Kind | Finding |
  | --- | --- | --- |
  | Airline | SCALE | 0.81% of revenue against a 2–5% band |
  | Health system | GRAIN | 13 of 24 categories are business functions, not technology |
  | Retired tenant | SCALE | 12.33% against a 1–10% band |

**The gate is not strict by default.** Both active tenants fail it today, and a gate that fails every
build from the day it lands gets disabled rather than fixed. It reports loudly now and blocks under
`--strict` once the fixtures are corrected, at which point a regression cannot land quietly.

**The gate also found a retired tenant directory still under `datasets/tenant-inputs/active/`.** That
is sunset work, not this release, but it is recorded here because the gate found it.

## Rollout Plan

Merge, deploy, re-run the projector, confirm on the signed-in surface.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow; the projection runs as an ACA Job.

## Rollback Plan

Revert. The anchors return to the authored literals and the gate stops running.

## Audit Evidence

- The commit and its PR.
- The gate's JSON report with per-tenant revenue, total, share, and band.
- The projector dry-run with per-dimension totals and contributing counts.

## Known Gaps

- **Both fixtures are still wrong.** The gate names them; correcting the intake is separate work,
  and it is the client's data model to fix rather than something to patch downstream.
- **The intake declares no scope for the spend sheet.** That is the root cause of the grain problem
  and is a template change: the sheet needs to state whether it covers technology spend or enterprise
  spend before any total from it can be labelled.
- **"Prior-year actual" reads "Not established".** Nothing canonical carries an observed prior-year
  figure — every fact is `declared`. It becomes real when telemetry collectors write `observed`.
- **The other ~790 lines of the authored model still render** — architecture exhibits, posture,
  coherence, trajectory, watchlist — labelled "synthetic current-state package".
- The industry bands are wide by design: they exist to catch an order-of-magnitude error, not to
  enforce a benchmark on a client whose spend is genuinely unusual.
