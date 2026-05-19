# Comprehensive Rate-Card Playbook

**Status:** implementation companion
**Owner:** Moves Expert Kernel
**Code:** `src/lib/programs/expert-kernel/rate-card/comprehensive-rate-card.ts`
**Template:** `docs/strategy/RATE-CARD-LOAD-TEMPLATE.csv`

## Why This Exists

The researched SI benchmark card is a strong planning default, but it should
not decide whether a client funds a Move. A CFO-grade business case needs the
commercial record in front of it:

- the market benchmark;
- the client's approved rate card;
- vendor quote / BAFO rates;
- internal-build fully-loaded costs;
- the committed budget envelope.

The comprehensive rate-card fabric reconciles those signals into the
`KernelRateCard` used by the Moves effort estimator while preserving source,
owner, date, confidence and warnings.

## Source Types

| Source kind | Meaning | Used as a role rate? |
|---|---|---|
| `client_rate_card` | Client-approved rate card or procurement standard | Yes |
| `vendor_quote` | Vendor proposal, BAFO, SOW or rate sheet | Yes |
| `internal_team_cost` | Fully-loaded internal build cost | Yes |
| `benchmark_market` | Explicit benchmark row loaded from a research pack | Yes |
| `committed_budget` | Approved funding envelope or budget ceiling | No — carried separately |

Committed budget is never converted into a role rate. It is used for budget-fit
analysis after the estimate is built.

## Precedence

For each role and delivery lane, the fabric applies:

1. `client_rate_card`
2. `vendor_quote`
3. `internal_team_cost`
4. `benchmark_market`
5. researched benchmark fallback

Within the same source kind, higher confidence wins. If confidence is tied, the
newer `as_of` date wins.

## No-Fabrication Rules

- Every row needs a source name, owner and `YYYY-MM-DD` vintage.
- Rate rows need a role, delivery location and either hourly or annual rate.
- Budget rows need a positive committed budget.
- Nearshore rows are loaded for provenance, but the current estimator has only
  onshore/offshore lanes; they are not used until the estimator grows a
  nearshore lane.
- Missing onshore/offshore lanes use researched benchmark fallback with an
  explicit warning unless strict mode is enabled.

## How This Supports Moves

The Moves Expert Kernel can now show:

- "This case is benchmark-priced."
- "This case uses the client's own rate card."
- "This role lane falls back to benchmark because no client/vendor row exists."
- "The estimate exceeds the committed budget by X."
- "Do not kill the bet from benchmark economics alone; reconcile client rates,
  vendor scope and budget first."

That last point matters for First Capital. A benchmark-priced case can look
unfundable while the client's committed budget or negotiated rate card tells a
different story. The fabric makes that visible rather than burying it inside a
single blended number.

## Load Template

Use `RATE-CARD-LOAD-TEMPLATE.csv` as the ingestion contract. Column names are
stable and match the TypeScript template row semantics:

`source_kind, source_name, role, specialization, delivery_location, seniority,
rate_usd_per_hour, annual_rate_usd, committed_budget_usd, currency, as_of,
owner, confidence, note`.

The initial implementation is file/module-level, not database-backed. A future
DB-backed version should preserve this contract, add RLS by tenant, and keep the
same provenance fields.
