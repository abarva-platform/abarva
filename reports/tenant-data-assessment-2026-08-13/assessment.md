# Tenant input data assessment — before load

Date: 2026-08-13. Reference tenant: the airline package (the most complete one, 98% contract fill).
This is an assessment of whether the data is worth loading, not a gate result.

## Verdict in one line

The technology inventory is genuinely good and the relationship graph is sound. The **business and
financial layers are thin and internally inconsistent**, and the thin dimensions correlate almost
exactly with the intake workstreams that have no extract template and no adapter.

---

## 1. Can a client team actually produce this?

Mostly yes, with three specific holes.

Six source-extract templates exist and map to systems a client already runs: CMDB (SA01), IT finance
(SA02), contracts/CLM (SA03), portfolio (SA04), cloud (SA05), ITSM (SA06). For those workstreams a
client team exports from a system they own and hands it over. That is a low-friction ask.

**No extract template exists for four workstreams:**

| Workstream | What we ask for | Why it is hard without a template |
| --- | --- | --- |
| WS02 Organization, Workforce, Decision Rights | org chart, RACI, role catalog | No system exports this in a usable shape; it becomes a manual build |
| WS04 Data, Integration, Analytics | data catalog, lineage, BI inventory | Client must assemble from several tools |
| WS09 Operations, KPIs, Process Evidence | KPI definitions, baselines, process maps | Definitions live in people's heads and slide decks |
| WS10 Interviews and Executive Signals | interview answers | By nature manual, but has no capture format |

These four are also the workstreams with **no implemented source adapter**. So the ask is manual *and*
the mapping is manual.

## 2. Does it fulfil product needs?

Depth against the "large" band minimums shows the shape clearly:

**Deep (well above floor):**

| Dimension | Rows | vs minimum |
| --- | ---: | ---: |
| relationships | 3,318 | 33× |
| applications_systems | 503 | 6.7× |
| data_assets_integrations | 499 | 5.0× |
| org_ownership | 150 | 15× |

**At the floor (passes the gate, cannot carry an executive conversation):**

| Dimension | Rows | Minimum |
| --- | ---: | ---: |
| programs_initiatives | 20 | 20 |
| ai_automation_use_cases | 13 | 10 |
| metrics_outcomes | 26 | 25 |
| evidence_sources | 22 | 20 |
| service_scope_managed_services | 11 | 10 |
| risks_controls | 44 | 40 |
| business_functions | 22 | 15 |
| expert_lenses | 7 | 5 |
| industry_context_patterns | 10 | 10 |

**This is built like a CMDB, not like a business case.** Eleven of nineteen dimensions sit within 50%
of the minimum. The product surfaces that ask "which bets deserve funding", "where did value land",
"what should we renegotiate" are reading the thin half.

## 3. Does the synthetic data make sense in the real world?

**Yes on the vendor stack — this is the strongest part of the package.** The top contracts are
Amadeus (passenger service), Jeppesen (flight ops), SITA (airport common-use), Swissport, Menzies and
dnata (ground handling), Gate Gourmet (catering), AWS/Microsoft/SAP. That is a credible airline
portfolio. Whoever built it knew the industry.

**Three numbers do not hold up:**

| Check | Package | Real-world | Assessment |
| --- | ---: | --- | --- |
| IT spend as % of revenue | **0.8%** ($0.66B on $81.4B) | airlines run 2-4% | under-modelled by roughly 3× |
| Vendor contracts vs total IT spend | **117%** ($0.78B vs $0.66B) | vendors are a subset of IT spend | **internally inconsistent** |
| Revenue per employee | **$885k** | US majors ~$550-610k | high by ~1.5× |

The second is the serious one: vendor contracts sum to more than the entire IT budget they are
supposed to sit inside. Any Tower or Source view that reconciles vendor spend against budget will
produce a negative or nonsensical remainder.

**One naming problem:** the airline package contains a spend line called *"Meridian Regional Legacy &
Integration"*. Meridian is the name of a different tenant. Cross-tenant name bleed in a demo is
confusing at best.

## 4. Do the relationships connect accurately?

**Largely yes, and better than expected.**

- 3,318 edges across a **controlled 13-type vocabulary** (`supports`, `owned_by`, `integrates_with`,
  `provided_by`, `has_risk`, …). No free-text verbs.
- **99.98% referential integrity** on typed endpoints: 5,273 of 5,274 resolve to a real named object.
  One dangling edge, in `function`.

**One structural defect.** 1,039 endpoints are typed `role` (CFO, CISO, Chief Data & Analytics
Officer). There is no `role` dimension to check them against:

- 81% match `02_org_ownership` (as leaders or org units)
- **0% match `03_workforce_roles`**

Because `03_workforce_roles` holds *job families* — Pilot, A&P Technician, Baggage Services Agent —
not executive positions. The word "role" means two different things in this model, and the graph uses
one meaning while the dimension holds the other. Ownership edges (`owned_by`, `technology_owned_by` =
1,006 edges) therefore point at objects with no home dimension.

To be precise: these are **mis-typed, not missing**. The targets exist; the node type is wrong.

---

## 5. Gaps that can be fixed swiftly

Ordered by value per unit of effort.

| # | Gap | Fix | Effort |
| --- | --- | --- | --- |
| 1 | Vendor spend exceeds total IT spend | Reconcile: either raise the spend baseline or mark vendor rows as contracted-value rather than in-year spend | Small — a reconciliation pass and a declared basis |
| 2 | `role` endpoints have no home dimension | Retype the 1,039 endpoints to `org_unit`, or add a declared executive-role node type | Small — mechanical retype, graph already resolves 81% |
| 3 | IT spend ~3× under-modelled | Scale the 20 spend rows to a defensible 2.5% of revenue, keeping category proportions | Small — arithmetic, not new modelling |
| 4 | Cross-tenant name bleed | Rename the "Meridian Regional" spend line | Trivial |
| 5 | One dangling `function` edge | Add the missing function or drop the edge | Trivial |
| 6 | Eleven dimensions at floor | Deepen programs, metrics, managed services, AI use cases first — they feed the value story | Medium |
| 7 | Four workstreams have no extract template | Add extract templates for org/workforce, data catalog, and KPIs | Medium — this is what makes the ask cheap for a client |

Items 1-5 are a single focused pass. They are the difference between "the numbers are wrong" and
"the numbers reconcile."

## What I would not do yet

Load. Items 1 and 3 mean the financial layer would land in Postgres inconsistent, and item 2 means the
ownership subgraph would materialise against node types that resolve to nothing. Those are cheap to
fix before a load and expensive to unpick after one, because every downstream projection would need
rebuilding.

## Method

Every figure above was computed from the committed package, not estimated. Referential integrity was
checked by building the set of named objects per dimension and resolving every relationship endpoint
against it. Financial ratios use the package's own `revenue_usd`, `employee_count`,
`annual_spend_usd`, and vendor `annual_spend_usd` columns. Depth is measured against the declared
`quality-depth-rules.json` minimums for the tenant's own size band.
