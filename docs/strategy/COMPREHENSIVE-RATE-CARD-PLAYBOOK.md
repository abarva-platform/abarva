# Comprehensive Rate-Card Playbook

**Status:** implementation companion
**Owner:** Moves Expert Kernel
**Code:** `src/lib/programs/expert-kernel/rate-card/comprehensive-rate-card.ts`
**Template only:** `docs/strategy/RATE-CARD-LOAD-TEMPLATE.csv`
**Demo packs:** `src/lib/programs/expert-kernel/rate-card/demo-rate-card-packs.ts`

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

Important distinction: the CSV is a **load template**, not a comprehensive
rate card. A comprehensive estimator-ready pack has at least 77 blended rows
today: 38 enterprise roles x two delivery lanes, plus a committed-budget row.
The tiered catalog view expands each pack to 268 role/tier/location rows. The
three demo packs in code meet that bar for Apex, Meridian and First Capital.

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

Use `RATE-CARD-LOAD-TEMPLATE.csv` as the ingestion contract. It intentionally
contains only example rows to show the shape of each source kind; it is not a
loaded client card. Column names are stable and match the TypeScript template
row semantics:

`source_kind, source_name, role, domain, specialization, delivery_location,
seniority, rate_usd_per_hour, annual_rate_usd, committed_budget_usd, currency,
as_of, owner, confidence, note`.

The initial implementation is file/module-level, not database-backed. A future
DB-backed version should preserve this contract, add RLS by tenant, and keep the
same provenance fields.

## Demo Pack Coverage

The shipped demo packs are deliberately larger than the template:

| Pack | Rows | Coverage | Budget |
|---|---:|---|---:|
| Apex Contact Center AI Routing | 77 blended / 268 tiered | 38 roles x onshore/offshore; tiered catalog by role | $5.2M |
| Meridian Ambient Clinical | 77 blended / 268 tiered | 38 roles x onshore/offshore; tiered catalog by role | $7.5M |
| First Capital Fraud Detection | 77 blended / 268 tiered | 38 roles x onshore/offshore; tiered catalog by role | $1.8M |

They are demo packs, not real client rate sheets. Their job is to let the Moves
Expert Kernel showcase the comprehensive-rate-card behavior without falling
back to the market benchmark by accident.

## Enterprise Domains Covered

The role catalog is intentionally broader than one delivery squad. It covers:
strategy/advisory, PMO, product management, enterprise architecture, solution
architecture, security/risk, cloud/platform, data architecture, data
engineering, AI/ML, governance/compliance, business/domain SME, digital
experience, application engineering, integration, database administration, ERP
platforms, clinical platforms such as Epic/Clarity, legacy modernization,
QA/evaluation, business analysis, process redesign, change management,
training/enablement, and run operations.

The estimator still consumes a blended role lane because that is the current
Source should-cost contract. The procurement-grade catalog is tiered: lead,
senior, mid and junior where that makes sense; principal/director/manager tiers
for advisory, PMO, governance and architecture roles.

## Tenant-Specific Category Selection

The enterprise catalog is broad, but the product should highlight the right
categories for each client based on industry and tech stack:

| Tenant case | Must-price categories |
|---|---|
| Apex Retail contact-center AI | Retail/domain SME, product, UX/UI, frontend, backend, full-stack, integration, data engineering, AI/ML, QA/evaluation, change |
| Meridian ambient clinical AI | Clinical SME, Epic Clarity, Epic integration, data architecture, data engineering, HL7/FHIR integration, security, governance, AI/ML, process, training, change |
| First Capital fraud detection | Banking/domain SME, model-risk/governance, security, legacy/mainframe, middleware, integration, data architecture, data engineering, AI/ML, QA/evaluation, process, change |

So the catalog stays enterprise-comprehensive, but the showcased business case
does not present a generic soup of roles. It points the reviewer to the
disciplines the tenant's stack actually requires.
