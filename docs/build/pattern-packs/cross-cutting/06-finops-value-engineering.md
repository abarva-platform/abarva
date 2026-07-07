# Pack 06 · FinOps & Value Engineering — `FINOPS`

**Created:** 2026-06-06
**Pack code:** `FINOPS`
**Layer:** Cross-cutting (horizontal · reusable across all domains)

---

## What this pack is for

This pack is the **financial engine** behind a Move's business case. It is the discipline that turns *"we project savings"* into *"we project savings, assembled from these benchmarks, with this confidence, and here is exactly what we will spend to earn them."*

A Move artifact's investment and benefit lines are not invented — they are **composed** from the patterns here. The cost side comes from rate-card-driven effort estimation (`FINOPS-01`), platform cost modeling (`FINOPS-04` / `FINOPS-05`), and run-vs-build categorization (`FINOPS-06`). The benefit side comes from value-driver trees (`FINOPS-12`), benchmark-anchored estimation (`FINOPS-13`), and benefits-realization modeling (`FINOPS-07`). The two sides meet in the NPV / payback / IRR model (`FINOPS-08`), are stress-tested by sensitivity analysis (`FINOPS-09`), and are kept honest by per-line confidence (`FINOPS-10`) and the no-realized-savings-without-evidence rule (`FINOPS-11`).

Three disciplines run through every pattern:

1. **Math is shown, not asserted.** Every cost and benefit line decomposes into a formula a CFO can audit. `effort = Σ (role × hours × blended_rate)`; `benefit = driver_volume × unit_rate × realization% × confidence`; `NPV = Σ cashflow_t / (1+r)^t − investment_0`.
2. **Every number cites a source.** A rate comes from the client's loaded rate card. A benefit range comes from a peer engagement or a published study. An unsourced number is flagged `estimate — confirm with client rate cards / data`.
3. **Projected ≠ realized.** Nothing is called a realized saving until it is tracked from actuals. The business case ships *projected* values with confidence bands; the realized column fills in only as the Move runs.

### The own-it lens applied to money

Most patterns in this pack are **method patterns** — the client owns the cost model and the benefit model regardless of which tools get used; the discipline is the asset. The one pattern that carries the explicit own-vs-rent *financial argument* is the **build vs buy vs partner TCO model (`FINOPS-03`)**. That pattern is the financial proof of the README's first principle: rent often looks cheaper in year 1 and turns out more expensive — plus lock-in — across a 3–5 year horizon. Showing that comparison honestly is how the own-it recommendation earns its CFO sign-off rather than asserting it on principle.

### Benchmark-source note

Quantitative ranges below are anchored to public references (Databricks pricing & DBU documentation, AWS/Azure pricing pages, and widely-cited AI-ROI studies such as the Microsoft/IDC "Business Opportunity of AI" series, McKinsey State-of-AI, and Nucleus Research ROI reports). Where a number is illustrative rather than sourced, it is flagged inline. **All benchmark ranges must be re-confirmed against the client's loaded rate cards and the live cloud price sheet at the time the Move is authored** — list pricing and discount terms move quarterly.

---

### PATTERN FINOPS-01 · Rate-card-driven effort estimation

**Intent** — Produce an auditable investment (labor) line by multiplying staffed roles by hours by a blended rate drawn from a governed rate card, never from a guessed day-rate.

**Applies to** — Every Move with a build/mobilization component; all domains. Lifecycle phases: Estimate, Business Case, Mobilization.

**Solution shape** — The rate card is the **single source of truth** for labor cost. AbarVa has loaded rate cards; the estimation engine reads them rather than hardcoding rates. The model is:

```
effort_cost = Σ_role ( hours_role × blended_rate_role )

where blended_rate_role = Σ_location ( mix%_location × rate_role,location )
```

- **Roles** map to a fixed taxonomy (e.g. Engagement Lead, Solution Architect, Data Engineer, ML Engineer, Platform/DevOps, Data Governance Lead, BA/PM, QA). Each role has a rate per location tier.
- **Location tiers** — onshore / nearshore / offshore — each carry a distinct rate. A blended rate is the delivery mix applied to the role's per-tier rates. Illustrative blend shape (confirm against client rate card): onshore senior engineer ~$180–260/hr; nearshore ~$90–140/hr; offshore ~$45–80/hr — so a 30/30/40 onshore/nearshore/offshore blend lands far below the onshore-only number. *Flag: rates are estimates — confirm with client rate cards.*
- **Hours** come from the work-breakdown structure, not a lump sum. Each workstream (landing zone, ingestion, modeling, MLOps, governance, enablement) carries role-loaded hours so the line is defensible workstream-by-workstream.
- The engine emits a line per role per workstream, so any reviewer can trace `$X = hours × rate` for every cell.

**Own-it vs rent** — **OWN (method).** The estimation model and the rate card belong to the client/engagement. There is no vendor lock on the math. The rate card is governed and versioned so estimates are reproducible.

**Where it sits** — Lifecycle: Estimate → Business Case. Architecture tier: n/a (financial model layer). It is the labor backbone of the investment side.

**Evidence anchors** — Client's loaded rate card (governed, versioned) is the primary citation. Blend percentages cite the engagement's delivery model. Cross-check total against industry day-rate benchmarks for sanity, but the rate card overrides. *All rate numbers above are illustrative — confirm with client rate cards.*

**Anti-patterns** —
- *Lump-sum day rate.* "It's about 6 months of a 4-person team" with no role/hour decomposition — un-auditable, and the first thing a CFO rejects.
- *Onshore-only default.* Pricing every hour at the onshore senior rate when a sensible blend exists inflates the number and loses the deal.
- *Rate drift.* Hardcoding a rate in the model instead of reading the governed card; the rate card moves and the estimate silently goes stale.

**Feeds artifacts** — Business case investment line (labor); Estimate model; Mobilization staffing plan & budget.

**Maturity** — production-ready.

---

### PATTERN FINOPS-02 · P50/P80/P95 estimation bands (three-point estimation)

**Intent** — Replace a single deceptive point estimate with a probabilistic band so the commitment level is explicit: a P50 is a coin-flip, a P80 is a plan, a P95 is a promise.

**Applies to** — Every effort and cost estimate; all domains. Phases: Estimate, Business Case, Mobilization (commit point).

**Solution shape** — Use **three-point (PERT) estimation** per work item, then aggregate.

```
For each task, capture three estimates:
  O = optimistic, M = most-likely, P = pessimistic
PERT mean   = (O + 4M + P) / 6
PERT stddev = (P − O) / 6
```

Aggregate task means and variances across the WBS (variances add for independent tasks; `total_σ = √Σ σ_i²`), then read the bands off the aggregate distribution:

- **P50** — 50% chance the actual lands at or below this. The honest "expected" number. *Do not commit external dates/budgets to P50.*
- **P80** — `≈ P50 + 0.84σ`. The planning number. Most delivery commitments are made here.
- **P95** — `≈ P50 + 1.64σ`. The contingency/board number — used when the cost of overrun is high (regulatory deadline, hard external commitment).

An estimation engine produces these by Monte-Carlo or PERT roll-up over the rate-card-loaded WBS (`FINOPS-01`). Report all three; recommend *which* to commit and why.

**Own-it vs rent** — **OWN (method).** The bands and the assumptions behind them belong to the client and are reproducible from the WBS.

**Where it sits** — Lifecycle: Estimate → Business Case → Mobilization commit gate.

**Evidence anchors** — PERT / three-point estimation is standard PMI practice. Band-to-σ multipliers are normal-distribution constants. Historical actuals from prior engagements calibrate O/M/P widths — cite them when available.

**Anti-patterns** —
- *Single-point estimate with no band* — implies false precision; see also FINOPS-10.
- *Committing to P50 externally* — a 50% overrun probability dressed as a plan.
- *Padding instead of banding* — silently inflating M to cover risk hides the real distribution and destroys trust when the padding is discovered.

**Feeds artifacts** — Estimate model (the band table); Business case investment line (committed at chosen band); Mobilization commit gate.

**Maturity** — production-ready.

---

### PATTERN FINOPS-03 · Build vs Buy vs Partner — the TCO model (the own-vs-rent financial argument)

**Intent** — Compare owning a built capability against renting a SaaS platform against partnering, on a full 3–5 year total-cost-of-ownership basis — so the own-it recommendation is *proven on the numbers*, not asserted on principle.

**Applies to** — Every Move where a capability could be built on the client's own estate or rented from a closed platform; especially analytics/AI platforms (lakehouse vs vendor analytics SaaS), MPI/identity, and domain accelerators. All domains.

**Solution shape** — Model three options over the **same horizon** (3 or 5 years), every line in present-value terms (`FINOPS-08`), with **all** cost categories (`FINOPS-06`) on each:

```
TCO_option = Σ_t  ( build_t + run_t + change_t + exit_t ) / (1+r)^t
```

- **Own-it build** — high year-1 capital (engineering, on the client's Databricks/cloud estate), then a *lower, controllable* annual run, plus the client owns the asset (data products, models, IP). Exit cost ≈ 0 (you already hold it).
- **Rent SaaS** — low year-1 (subscription + onboarding), then an *escalating* subscription (typical SaaS uplift ~5–10%/yr — *estimate, confirm contract*), no owned asset, and a real **switching/exit cost** at the horizon (re-platform, data extraction, retraining) that the year-1 price hides.
- **Partner** — managed-own-destination: a partner builds *into the client estate* with IP transfer at the end. Mid-band capex, declining run as ownership transfers.

Illustrative 3-year shape (numbers illustrative — confirm with client rate cards & vendor quotes):

```
                     Yr 1       Yr 2     Yr 3     3-yr PV   Asset owned?   Lock-in
OWN-IT build         $1,200k    $250k    $260k    ~$1,560k   YES (client)   none
RENT SaaS              $400k    $440k    $484k    ~$1,160k   NO (vendor)    HIGH (+ exit ~$300k)
PARTNER (own-dest)     $900k    $300k    $180k    ~$1,250k   YES at yr-3    transfers out
```

The decisive read: **rent wins year 1 ($400k vs $1,200k) and even wins raw 3-yr PV here — but it owns nothing, escalates every year, and carries a switching cost that makes year 4+ and any exit punishing.** Extend the horizon to 5 years and add the exit cost and the curves cross: the owned asset's run cost is flat-to-declining while the subscription compounds. The recommendation defends the own-it choice on the *full* horizon and the *ownership* line, not the year-1 sticker.

**Own-it vs rent** — **This pattern IS the own-vs-rent argument.** OWN-IT build qualifies for an own-it mandate. RENT SaaS is **disqualified by default** (vendor holds data, models, IP) and may be recommended only with surfaced rationale. PARTNER is **MANAGED-OWN-DESTINATION** — acceptable when IP transfers to the client by the horizon. Map each option to the README ownership test: *after this is built, who owns the data products, models, and IP?*

**Where it sits** — Lifecycle: Strategy → Architecture → Business Case (the options comparison). It is the financial expression of the README first principle.

**Evidence anchors** — Vendor quotes (subscription + uplift terms) for the rent line; rate-card effort (`FINOPS-01`) for the build line; published SaaS escalation and switching-cost studies for defaults. Databricks/cloud price sheets for the own-it run line. *Every cell flagged illustrative until populated from quotes and the rate card.*

**Anti-patterns** —
- *Compare rent year-1 price to own-it total build and conclude rent is cheaper* — the headline trap; it ignores the horizon, the escalation, and the exit cost.
- *Omit switching/exit cost from the rent column* — pretends the vendor relationship is free to leave.
- *Ignore the ownership line entirely* — reduces a strategic capability decision to a price comparison and silently disqualifies the client from owning its own intelligence.
- *Mismatched horizons* — comparing a 3-yr build to a 1-yr subscription quote.

**Feeds artifacts** — Strategy options comparison; Architecture build-vs-buy decision record; Business case (the recommended option + defended rationale).

**Maturity** — production-ready.

---

### PATTERN FINOPS-04 · Databricks platform cost modeling (DBU consumption)

**Intent** — Estimate monthly Databricks platform burn per workload from the DBU consumption model, so the platform run cost is a defensible line rather than a hand-wave.

**Applies to** — Every Move that runs on Databricks (most AbarVa lakehouse Moves). All domains. Phases: Architecture, Business Case (run cost), Mobilization (budget).

**Solution shape** — Databricks bills in **DBUs (Databricks Units)** — a unit of processing consumed per second of compute. Total platform cost has two layers:

```
monthly_DBX_cost = Σ_workload ( DBU_rate × DBUs_consumed )  +  underlying_cloud_compute (FINOPS-05)
DBUs_consumed   = compute_DBU/hr × hours_run × node_count (or autoscale-weighted)
```

Cost drivers to model per workload:

- **Compute type & tier** — Jobs Compute (cheapest, for scheduled pipelines) < All-Purpose Compute (interactive notebooks, most expensive) ; SQL Warehouse for BI. Serverless variants exist for SQL, Jobs, and notebooks.
- **Serverless vs classic** — serverless removes idle/spin-up waste and node management but carries a higher per-DBU rate; classic is cheaper per-DBU but you pay for the underlying VMs (FINOPS-05) and idle time. Model both; the break-even is utilization-dependent.
- **Photon** — the vectorized engine; raises the DBU multiplier but typically cuts wall-clock enough to lower *total* cost on large scans. Model with and without.
- **Plan tier** — Standard / Premium / Enterprise carry different per-DBU rates; governance/security features (Unity Catalog enforcement) often require Premium+.
- **DBU $ rate** is published per compute type and tier on the Databricks pricing page — *cite the live sheet; rates differ by cloud and region and move quarterly.*

Estimate per workload: classify it (ETL job / interactive / SQL BI / ML training / ML serving), pick compute type, estimate run hours × node profile × DBU/hr × DBU $rate, sum to a monthly burn. Add commit-discount assumptions (FINOPS-14).

**Own-it vs rent** — **OWN-IT estate (method).** Databricks runs in the *client's* workspace/cloud account; the client owns the compute spend, the data in Unity Catalog, and the pipelines. This is platform-run cost on an owned estate, not a rented intelligence layer — contrast a vendor analytics SaaS (FINOPS-03, RENT).

**Where it sits** — Architecture (sizing) → Business case (annual run line) → Mobilization (FinOps budget). Cost category: **run** (FINOPS-06).

**Evidence anchors** — Databricks pricing documentation (DBU rates per compute type / cloud / region); Databricks workload sizing guidance. Prior-engagement actual DBU consumption is the strongest anchor when available. *All DBU rates flagged: confirm against live Databricks price sheet for the client's cloud + region.*

**Anti-patterns** —
- *Forget the underlying cloud compute* — DBU $ is on top of the VM cost (classic); modeling DBUs alone under-counts (see FINOPS-05).
- *Default everything to All-Purpose Compute* — pricing scheduled pipelines at interactive rates inflates burn 2–3×.
- *Ignore idle/autoscale* — classic clusters left running idle burn DBUs; model realistic utilization, not 24×7 max.
- *Static monthly number for a scaling workload* — DBU burn grows with data volume; phase it.

**Feeds artifacts** — Architecture platform sizing; Business case run-cost line; Mobilization FinOps budget & tagging plan (FINOPS-14).

**Maturity** — production-ready.

---

### PATTERN FINOPS-05 · Cloud infrastructure cost modeling (non-Databricks line items)

**Intent** — Capture the AWS/Azure infrastructure line items that sit *underneath and beside* the Databricks bill, so total platform cost is complete — storage, egress, networking, and managed services are not free.

**Applies to** — Every cloud-deployed Move. All domains. Phases: Architecture, Business Case, Mobilization.

**Solution shape** — Itemize the cloud bill beyond compute DBUs:

- **Storage** — object storage (S3 / ADLS Gen2) for Bronze/Silver/Gold; priced per GB-month per tier (hot/cool/archive). Model growth, not a snapshot.
- **Underlying compute VMs** — for *classic* Databricks clusters, the EC2/VM cost is billed by the cloud separately from DBUs (FINOPS-04). Serverless folds this into the DBU rate.
- **Data egress** — outbound transfer is the silent killer: intra-region is cheap/free, cross-region and *internet egress* are charged per GB and add up fast for data sharing, replication, and BI extracts. Model egress explicitly.
- **Networking** — VPC/VNet, private endpoints / PrivateLink, NAT gateways (charged per hour + per GB processed), load balancers.
- **Managed services** — secrets/Key Vault, monitoring/logging (CloudWatch/Log Analytics — ingestion + retention priced per GB), messaging/queues, container registry, CI runners.
- **DR & backup** — cross-region replication storage + egress.

```
monthly_cloud_cost = storage_GB×rate + VM_hours×rate + egress_GB×rate
                     + networking + managed_services + DR/backup
```

**Own-it vs rent** — **OWN-IT estate (method).** All of this runs in the client's cloud account; the client owns and controls the spend.

**Where it sits** — Architecture (component sizing) → Business case run line → Mobilization budget. Cost category: mostly **run**; initial setup is **build** (FINOPS-06).

**Evidence anchors** — AWS / Azure pricing calculators and price sheets (per-region). Prior-engagement cloud bills are the strongest anchor. *Flag all unit rates: confirm against live cloud price sheet for the client's region.*

**Anti-patterns** —
- *Egress ignored* — the most common under-count; cross-region data sharing or BI extract volume blows the budget.
- *Snapshot storage* — pricing today's GB and never growing it; data volume compounds.
- *Bundling everything into "Databricks"* — hides controllable line items and prevents FinOps optimization (FINOPS-14).

**Feeds artifacts** — Architecture sizing; Business case run line; Mobilization FinOps budget.

**Maturity** — production-ready.

---

### PATTERN FINOPS-06 · Run vs Build vs Change cost categorization

**Intent** — Classify every cost into one-time **build**, recurring annual **run**, and **change/enablement** so the business case separates the investment hump from the ongoing burden — the single most common framing error a CFO catches.

**Applies to** — Every Move. All domains. Phases: Business Case, Mobilization.

**Solution shape** — Three buckets, each with a distinct shape over time:

- **Build (one-time / capex-like)** — engineering effort to stand up the capability (FINOPS-01), initial platform setup, migration, initial model development. Concentrated in year 1; does not recur.
- **Run (recurring / opex)** — platform burn (FINOPS-04/05), support & maintenance staffing, model monitoring & retraining, license/subscription if any, ongoing governance. Recurs every year; this is what the asset *costs to keep alive*.
- **Change (one-time + tail)** — adoption enablement, training, change management, process redesign, communications. Mostly year 1–2 with a small ongoing tail.

```
total_3yr = build (yr1)  +  Σ_t run_t  +  change (yr1–2 + tail)
```

Present both the **TCO** (all three) and the **year-by-year cashflow** so the reader sees the year-1 hump and the steady-state run. The run line is what feeds the NPV denominator-of-benefit and the FINOPS-03 TCO comparison.

**Own-it vs rent** — **OWN (method).** Note the ownership signal in the *shape*: owned builds carry a high build / low controllable run; rented capabilities carry a low build / high escalating run (FINOPS-03).

**Where it sits** — Business case (cost structure); Mobilization (budget & funding ask).

**Evidence anchors** — Run-cost benchmarks: ongoing run for a data/AI platform commonly lands ~15–25% of build/yr (*estimate — confirm with client data and prior engagements*). Cite prior-engagement actuals where available.

**Anti-patterns** —
- *Ignore run cost / TCO and only show build cost* — the classic under-count; the capability looks cheap until year 2 arrives.
- *Bury change cost* — adoption/training is real money; omitting it sets up the value to never realize (no adoption → no benefit).
- *Mix capex and opex into one number* — destroys the CFO's ability to fund it correctly.

**Feeds artifacts** — Business case cost structure; CFO pack; Mobilization funding ask; FINOPS-03 TCO comparison.

**Maturity** — production-ready.

---

### PATTERN FINOPS-07 · Benefits realization modeling — the general pattern

**Intent** — Model each benefit type with the *credible* math for its kind — hard cash savings, efficiency/FTE reallocation, and risk reduction are not the same thing and must not be summed naively.

**Applies to** — Every Move's benefit side. All domains. Phases: Business Case, Value Realization tracking.

**Solution shape** — Classify each benefit, then model with the right formula and the right credibility discipline:

- **Hard savings (cash)** — directly reduces a cash outflow (vendor spend retired, penalty avoided, contract renegotiated). Highest credibility. `benefit = baseline_spend − new_spend`. Lands on the P&L; CFO can verify against the GL.
- **Efficiency / FTE reallocation** — time saved that converts to capacity, *not necessarily cash*. Distinguish **cashable** (a role eliminated / not backfilled) from **non-cashable** (capacity freed for higher-value work). `benefit = hours_saved × loaded_rate × cashable%`. Model the cashable fraction explicitly; do not book freed-capacity as cash unless a headcount action is committed.
- **Risk reduction (probability × impact)** — avoided loss from a risk that may not occur. `benefit = P(event) × impact × Δrisk_reduction`. Lowest standalone credibility; always carry an explicit probability and confidence (FINOPS-10).

Each benefit also ramps: `realized_t = full_benefit × realization%_t`, where realization% climbs from ~0 at go-live to steady-state over the adoption curve. Never book full benefit in year 1.

**Own-it vs rent** — **OWN (method).** The benefit model belongs to the client and is tracked against client actuals (FINOPS-11).

**Where it sits** — Business case (benefit lines); Value realization (the tracked column fills in later).

**Evidence anchors** — Each benefit line is benchmark-anchored (FINOPS-13) and decomposed via a value-driver tree (FINOPS-12). Loaded rates from the rate card / client HR cost. *Flag every range until anchored.*

**Anti-patterns** —
- *Benefits with no driver decomposition — just a hopeful number* (see FINOPS-12).
- *Sum efficiency hours as cash* — booking non-cashable capacity as P&L savings; the CFO will not credit it.
- *Risk-reduction with no probability* — claiming the full impact as if the event were certain.
- *Full benefit in year 1* — ignoring the realization ramp.

**Feeds artifacts** — Business case benefit lines; CFO pack; Value-driver tree; Value realization tracker.

**Maturity** — production-ready.

---

### PATTERN FINOPS-08 · NPV / Payback / IRR for AI investments

**Intent** — Express the full cost and benefit streams as the three numbers a CFO actually decides on — net present value, payback period, and internal rate of return — over a defined horizon and discount rate.

**Applies to** — Every Move business case. All domains. Phases: Business Case, CFO pack.

**Solution shape** — Build a year-by-year net cashflow (`benefit_t − cost_t`, costs from FINOPS-06, benefits from FINOPS-07), then:

```
NPV = Σ_t=0..N  netcashflow_t / (1 + r)^t          (typically minus investment_0)
Payback = first year where cumulative discounted cashflow ≥ 0
IRR = the rate r* that makes NPV = 0
```

- **Horizon (N)** — 3 years standard for AI/data; 5 for platform-heavy builds (matches the FINOPS-03 TCO horizon). State it.
- **Discount rate (r)** — use the client's WACC / hurdle rate; absent that, a 10–12% default is common (*flag: confirm client hurdle rate*). AI investments carry higher delivery risk, so some clients apply a risk-adjusted premium — surface if used.
- **Report all three** — NPV (value created), payback (how long capital is at risk; AI/data programs commonly target ≤ 18–24 months — *estimate, confirm with client*), IRR (compare against hurdle).

Tie back to FINOPS-02: present the NPV at the chosen estimation band (e.g. NPV at P80 cost / conservative benefit) so the headline number is honest about its confidence.

**Own-it vs rent** — **OWN (method).** Reuse the same NPV engine for the FINOPS-03 build-vs-rent comparison so the two are directly comparable.

**Where it sits** — Business case (the headline financials); CFO pack.

**Evidence anchors** — Client WACC/hurdle rate (primary). Discounting is standard corporate finance. AI-ROI benchmark studies (Microsoft/IDC, McKinsey, Nucleus Research) for sanity-checking payback/IRR ranges. *Flag default discount rate until client-confirmed.*

**Anti-patterns** —
- *Undiscounted "total savings over 3 years"* — ignores the time value of money and front-loads optimism.
- *Headline NPV at P50 / aggressive benefit* — a coin-flip cost against a hopeful benefit (pair with FINOPS-02 + FINOPS-10).
- *No stated horizon or discount rate* — un-auditable; the reader cannot reproduce it.

**Feeds artifacts** — Business case financial summary; CFO pack; Board-grade business case.

**Maturity** — production-ready.

---

### PATTERN FINOPS-09 · Sensitivity analysis & tornado charts

**Intent** — Show *which assumptions move the answer* by varying each input across its plausible range and ranking the resulting NPV swing — so the reader knows where the risk actually lives.

**Applies to** — Every business case with material uncertainty (i.e. all of them). All domains. Phase: Business Case, CFO pack.

**Solution shape** — One-at-a-time sensitivity: hold all inputs at base case, then swing each key driver to its low and high (from its confidence band, FINOPS-10) and record the NPV at each end.

```
for each driver d:  NPV_low_d , NPV_high_d   (others held at base)
swing_d = | NPV_high_d − NPV_low_d |
rank drivers by swing → tornado chart (widest bar on top)
```

The **tornado chart** stacks horizontal bars sorted by swing — the widest at the top is the input that most determines whether the Move pays off. Typical top drivers for an AI Move: adoption/realization rate, benefit unit-rate (the value per driver), build effort hours, discount rate, and DBU/run cost. The output tells the team where to spend diligence and where to set guardrails.

Optionally run a **Monte-Carlo** over all drivers' distributions to get a full NPV distribution (P10/P50/P90 NPV) — the probabilistic complement to the one-at-a-time tornado.

**Own-it vs rent** — **OWN (method).**

**Where it sits** — Business case (risk section); CFO pack.

**Evidence anchors** — Driver ranges come from each input's confidence band (FINOPS-10) and benchmark spread (FINOPS-13). Tornado/one-at-a-time sensitivity is standard decision-analysis practice.

**Anti-patterns** —
- *Single deterministic NPV with no sensitivity* — hides which assumption the whole case rests on.
- *Sensitivity on trivial inputs* — varying inputs that don't move the answer to look rigorous while ignoring the real driver.
- *Ranges pulled from thin air* — sensitivity swings must come from the confidence bands, not arbitrary ±10%.

**Feeds artifacts** — Business case risk/sensitivity section; CFO pack; identifies which assumptions become Mobilization guardrails.

**Maturity** — production-ready.

---

### PATTERN FINOPS-10 · Per-line confidence rating

**Intent** — Attach an explicit confidence to *every* cost and benefit line, so the business case carries its own uncertainty rather than presenting all numbers as equally certain.

**Applies to** — Every line in the cost and benefit models. All domains. Phases: Business Case, CFO pack, Value realization.

**Solution shape** — Each line carries a confidence tag tied to its evidence quality:

```
benefit_line = driver × rate × realization% × confidence_factor
```

- **High** — anchored to client actuals or a directly comparable peer engagement; tight band. (e.g. confidence_factor ~0.9)
- **Medium** — anchored to an industry benchmark range, not yet client-validated. (~0.7)
- **Low** — analogue/estimate, flagged "confirm with client data". (~0.5)

Confidence drives three behaviours: (1) it discounts the headline benefit (a confidence_factor multiplier or a haircut), (2) it sets the width of the line's sensitivity range (FINOPS-09), and (3) it sequences diligence — low-confidence high-impact lines get validated first. Confidence is *not* the same as the realization ramp (FINOPS-07): realization is *when* the benefit lands; confidence is *how sure we are it lands at all*.

**Own-it vs rent** — **OWN (method).** The confidence rubric and the evidence behind each rating belong to the engagement and are auditable.

**Where it sits** — Business case (every line); CFO pack; feeds FINOPS-09 and FINOPS-11.

**Evidence anchors** — The confidence tag *is* a pointer to the evidence: client actual / peer engagement / industry benchmark / estimate. Cite the source per line (FINOPS-13).

**Anti-patterns** —
- *Single-point estimate with no confidence band* — all numbers presented as equally certain.
- *Confidence theatre* — assigning "High" without the actual or peer reference to back it.
- *Conflating confidence with realization* — treating a slow-ramping but certain benefit as "low confidence."

**Feeds artifacts** — Business case (per-line confidence column); CFO pack; sensitivity analysis; value-realization tracker.

**Maturity** — production-ready.

---

### PATTERN FINOPS-11 · No realized savings without evidence (projected vs realized separation)

**Intent** — Enforce, financially, that nothing is reported as a *realized* saving until it is tracked from actuals — the discipline that keeps the business case honest after sign-off.

**Applies to** — Every benefit line, from business case through value realization. All domains. Phases: Business Case → Value Realization.

**Solution shape** — Maintain two structurally separate columns for every benefit line:

```
PROJECTED  — modeled at authoring: driver × rate × realization% × confidence (FINOPS-07/10)
REALIZED   — measured from tracked actuals; starts EMPTY; fills in only as actuals arrive
variance   = realized − projected   (tracked over time)
```

- At business-case time, **realized is blank by definition** — the Move hasn't run. The headline is explicitly *projected*.
- Realized fills in **only** from a tracked source: GL/finance system for hard savings, a measured operational metric for efficiency, a logged risk-event delta for risk reduction. Each realized number cites its tracking source.
- The artifact surfaces both, never collapses them. A "savings to date" figure that is actually a projection is the cardinal sin.

This is the financial expression of the README provenance rule: a claim with no evidence is not allowed to stand as fact.

**Own-it vs rent** — **OWN (method).** The tracking instrumentation lives on the client's owned estate (the metrics come from the client's data plane), reinforcing ownership of the value story.

**Where it sits** — Business case (projected column); Value realization (realized column fills in); steady-state benefits tracking.

**Evidence anchors** — Realized values cite their tracking source (GL line, operational metric, risk-event log). Projected values cite their pattern + benchmark + confidence.

**Anti-patterns** —
- *Claim realized savings before anything is tracked* — the headline lie; reporting a projection as money in the bank.
- *Collapse projected and realized into one number* — removes the ability to measure variance and erodes credibility on the first audit.
- *Realized with no tracking source* — a number asserted as "actual" with nothing behind it.

**Feeds artifacts** — Business case (projected); CFO pack; Value-realization tracker (projected vs realized vs variance); steady-state benefits review.

**Maturity** — production-ready.

---

### PATTERN FINOPS-12 · Value-driver trees

**Intent** — Decompose a high-level value spine into the measurable operational drivers beneath it, so every benefit number traces down to something the client can actually move and meter.

**Applies to** — Every benefit line; especially strategic outcomes (MLR, churn, throughput) that are too aggregate to estimate directly. All domains. Phases: Strategy, Business Case.

**Solution shape** — Build a tree from the financial outcome down to leaf drivers, where each level is a multiplicative or additive decomposition:

```
MLR compression (payer value spine)
 ├─ care-gap closure rate ↑        → fewer avoidable acute events
 │    └─ risk-stratification model accuracy (precision/recall on rising-risk)
 ├─ care-management efficiency ↑   → more members managed per care manager
 │    └─ prioritization model lift over random outreach
 └─ avoidable-admission reduction  → P(admit | gap) × cost_per_admit × Δ
```

Each **leaf** is a metered driver with a baseline and a target delta; the benefit aggregates *up* the tree (`outcome = f(drivers)`). This does three things: (1) makes the benefit estimable (you estimate the small, knowable leaves, not the giant abstract top), (2) makes it *trackable* (each leaf maps to a metric for FINOPS-11), and (3) makes it *defensible* (the CFO sees the mechanism, not a hopeful headline). Pair each leaf with a benchmark range (FINOPS-13) and a confidence (FINOPS-10).

**Own-it vs rent** — **OWN (method).** The tree and its metered leaves are client-owned and instrumented on the client's estate.

**Where it sits** — Strategy (value identification) → Business case (the benefit decomposition). Bridges domain value spines to the financial model.

**Evidence anchors** — Each leaf cites a benchmark (FINOPS-13) and a client baseline. The tree structure itself is cited to the relevant domain pattern (e.g. payer/population-health value spines).

**Anti-patterns** —
- *Benefits with no driver decomposition — just a hopeful number* — a top-line "$5M MLR savings" with no mechanism beneath it.
- *Double-counting across branches* — two leaves that capture the same dollar (e.g. gap-closure and admission-reduction both crediting the same avoided admit).
- *Un-meterable leaves* — drivers that can't map to a tracked metric, so FINOPS-11 can never confirm them.

**Feeds artifacts** — Business case benefit decomposition; Value realization metric map; Strategy value spine.

**Maturity** — production-ready.

---

### PATTERN FINOPS-13 · Benchmark-anchored benefit estimation

**Intent** — Cite every benefit range to a peer engagement or published industry benchmark — never to invention — so the value side carries the same provenance discipline as the architecture side.

**Applies to** — Every benefit range and rate. All domains. Phases: Business Case.

**Solution shape** — Every quantitative benefit assumption resolves to one of three anchor tiers, in order of preference:

1. **Client actuals** — the client's own baseline/history. Strongest; sets confidence High (FINOPS-10).
2. **Peer / reference engagement** — "best-in-class produced X here" from a comparable prior engagement. Cite the engagement (anonymized as needed). Confidence High–Medium.
3. **Published industry benchmark** — a named study/report with a range (e.g. AI-ROI studies, vendor-published outcome benchmarks). Cite the source and *use the range, not the rosy endpoint*. Confidence Medium.

```
each benefit assumption → { value, range_low, range_high, anchor_tier, source_citation }
```

If none of the three exists, the line is flagged `estimate — confirm with client data` and carries Low confidence, a wide sensitivity band (FINOPS-09), and a diligence action. The discipline: an estimate is allowed to *exist* (you must start somewhere) but is never allowed to *masquerade as anchored*.

**Own-it vs rent** — **OWN (method).** The benchmark library and its citations are an engagement asset that compounds across Moves.

**Where it sits** — Business case (benefit anchors); feeds FINOPS-07/10/12.

**Evidence anchors** — This pattern *is* the evidence-anchoring discipline. Named sources: client baselines, prior engagements, published AI-ROI studies (Microsoft/IDC Business Opportunity of AI, McKinsey State of AI, Nucleus Research ROI), vendor outcome benchmarks. *Always cite the range and the source; never the single rosy number.*

**Anti-patterns** —
- *Invented benefit ranges* — a number with no anchor presented as fact.
- *Cherry-picked endpoint* — citing a study's best-case outcome as the expected value.
- *Stale benchmark* — using a 2019 ROI figure for a 2026 model without revalidation.

**Feeds artifacts** — Business case benefit lines; per-line confidence; value-driver tree leaves; provenance citations.

**Maturity** — production-ready.

---

### PATTERN FINOPS-14 · FinOps governance for the platform

**Intent** — Stand up the operating discipline that keeps the *run* cost (FINOPS-04/05) controlled and attributable after go-live — tagging, showback/chargeback, budget alerts, anomaly detection, and committed-use discounts.

**Applies to** — Every Move that leaves a running platform behind. All domains. Phases: Architecture (tagging design), Mobilization (governance stand-up), steady-state.

**Solution shape** — The FinOps loop (inform → optimize → operate):

- **Tagging taxonomy** — mandatory tags on every cloud/Databricks resource (cost-center, workload, environment, owner, data-product). Without this, nothing else works.
- **Showback / chargeback** — attribute spend to the consuming team/use-case. Showback (visibility) first; chargeback (billed back) once the taxonomy is trusted.
- **Budget alerts** — per-workload and per-environment budgets with threshold alerts (e.g. 50/80/100% of monthly budget).
- **Cost anomaly detection** — automated detection of spikes (a runaway All-Purpose cluster, an egress surge) before they become a bill shock; cloud-native (AWS Cost Anomaly Detection / Azure Cost anomaly) plus Databricks system-table monitoring.
- **Committed-use discounts** — once consumption is predictable, move from on-demand to committed (Databricks DBCU/committed-use, cloud reserved/savings plans). Typical savings ~20–40% vs on-demand (*estimate — confirm against current commit terms*). This directly lowers the FINOPS-04/05 run line and the FINOPS-03/08 NPV.

**Own-it vs rent** — **OWN (method + estate).** FinOps governance runs on the client's owned cloud account using cloud-native + Databricks system tables — no vendor lock. The discipline and the savings accrue to the client.

**Where it sits** — Architecture (tagging design baked in early); Mobilization (governance stand-up); steady-state operate. Cost category: reduces **run** (FINOPS-06).

**Evidence anchors** — FinOps Foundation framework (inform/optimize/operate); cloud-native cost tools and Databricks system tables / cost-management docs; committed-use discount terms from Databricks + cloud price sheets. *Flag discount % until confirmed against live commit terms.*

**Anti-patterns** —
- *Tagging as an afterthought* — retrofitting tags onto a sprawling estate is painful and never complete; design it in Architecture.
- *Chargeback before trust* — billing teams back on a taxonomy they don't believe in breeds gaming and resentment.
- *On-demand forever* — leaving predictable workloads on on-demand pricing and forgoing 20–40% of avoidable run cost.

**Feeds artifacts** — Architecture tagging/governance design; Mobilization FinOps operating model; steady-state run-cost optimization; lowers Business case run line.

**Maturity** — production-ready.

---

### PATTERN FINOPS-15 · Phasing investment to de-risk (foundation before AI use case)

**Intent** — Sequence the spend so foundational investment (platform, data products, governance) precedes use-case AI investment — the financial expression of the foundation-before-AI sequencing principle, so capital is staged against proven readiness rather than committed up front to unproven outcomes.

**Applies to** — Every multi-use-case program. All domains. Phases: Strategy, Business Case, Mobilization roadmap.

**Solution shape** — Break the investment into **gated phases**, each a funding tranche released on evidence from the prior:

```
Phase 0  Foundation     — landing zone, ingestion, governance, first data products
                          (cost-heavy, benefit-light; enables everything downstream)
Phase 1  First use case  — one high-confidence AI Move on the foundation
                          (proves the value mechanism; FINOPS-12 leaves start metering)
Phase 2+ Scale           — additional use cases, each reusing the foundation
                          (build cost per use case drops; shared run cost amortizes)
```

- Each phase has its own mini business case (cost FINOPS-06, benefit FINOPS-07, NPV FINOPS-08).
- **Funding gates** release the next tranche only when the prior phase hits its evidence threshold (foundation delivered / first use-case value tracked via FINOPS-11). This caps downside: if value doesn't materialize, you stop after one use case, not ten.
- The foundation cost is *amortized* across all downstream use cases — model it as shared, so use-case 2..N look far cheaper than use-case 1 (their marginal build is small; they inherit the platform).

**Own-it vs rent** — **OWN (method).** Phasing is a method; note it also *favors* own-it: a rented platform doesn't amortize (you re-pay subscription regardless), while an owned foundation's cost spreads across every use case it carries (ties to FINOPS-03).

**Where it sits** — Strategy → Business case (phased financials) → Mobilization (gated roadmap & funding tranches).

**Evidence anchors** — Foundation-before-AI sequencing is an AbarVa first principle (cite the architecture pack). Gated-funding / stage-gate investment is standard portfolio practice. Amortization math is straightforward.

**Anti-patterns** —
- *Big-bang funding* — committing the full multi-use-case budget before the foundation proves out; maximum capital at maximum risk.
- *AI before foundation* — funding a use case with no platform beneath it; the build cost balloons and the value can't be tracked.
- *Foundation cost charged to use-case 1 alone* — making the first Move look uneconomic by loading all shared cost onto it instead of amortizing.

**Feeds artifacts** — Strategy roadmap; Business case (phased financials); Mobilization funding tranches & gate criteria.

**Maturity** — production-ready.

---

### PATTERN FINOPS-16 · The cost of NOT acting (status-quo / do-nothing baseline)

**Intent** — Quantify the cost of the status quo so the business case is decided against a *real* alternative — doing nothing is never free — capturing run-rate waste, opportunity cost, and regulatory/penalty exposure.

**Applies to** — Every business case (the do-nothing baseline). All domains. Phases: Strategy, Business Case.

**Solution shape** — Model the **do-nothing baseline** as an explicit cashflow, then the Move's NPV is measured *against it*, not against zero:

- **Status-quo run cost** — what the current way already costs and will keep costing (legacy platform fees, manual labor, duplicated effort, technical-debt interest). Often escalating.
- **Opportunity cost** — value left on the table by not acting: benefits in FINOPS-07/12 that simply don't accrue, and competitive position eroded while peers move.
- **Regulatory / penalty exposure** — `P(non-compliance event) × penalty + remediation`. For regulated domains (payer, clinical, finance) this can dominate the case.
- **Risk drift** — exposures that *grow* if unaddressed (security, model staleness, key-person risk).

```
incremental_NPV = NPV(act) − NPV(do_nothing)
   where NPV(do_nothing) is typically negative and worsening
```

Surfacing the do-nothing baseline reframes the decision: the question is not "is this worth $X?" but "is acting better than the cost of standing still?" — which is the question a CFO actually asks.

**Own-it vs rent** — **OWN (method).** Tie to FINOPS-03: a relevant status-quo case is often "keep renting the current SaaS," whose escalating subscription *is* the do-nothing cost the owned build is measured against.

**Where it sits** — Strategy (the case for change) → Business case (the baseline the Move is compared to).

**Evidence anchors** — Status-quo costs from the client's current GL/contracts (primary). Penalty exposure from the relevant regulation (cite the statute/rule and penalty schedule). Opportunity cost from the benefit model (FINOPS-07/13). *Flag estimated probabilities for regulatory events; confirm with client risk/compliance.*

**Anti-patterns** —
- *Compare to zero* — pretending the status quo is free, which understates the Move's value.
- *Inflate the do-nothing case* — exaggerating status-quo pain to manufacture ROI; the CFO will discount the whole case if caught.
- *Ignore regulatory exposure where it dominates* — in regulated domains the avoided-penalty line is often the largest and most defensible benefit.

**Feeds artifacts** — Strategy case-for-change; Business case (do-nothing baseline & incremental NPV); CFO pack; board-grade business case.

**Maturity** — production-ready.

---

## Composition note — how this pack assembles a CFO-grade business case

A board-grade business case composes these patterns into one auditable chain:

```
COST SIDE                                  BENEFIT SIDE
FINOPS-01 rate-card effort                 FINOPS-12 value-driver tree
FINOPS-02 P50/P80/P95 bands                FINOPS-13 benchmark-anchored ranges
FINOPS-04 Databricks DBU burn              FINOPS-07 benefit-type modeling
FINOPS-05 cloud infra line items           FINOPS-10 per-line confidence
FINOPS-06 build/run/change split           FINOPS-11 projected ≠ realized
        \                                         /
         └──────────► FINOPS-08 NPV / payback / IRR ◄──────────┘
                                │
            FINOPS-09 sensitivity / tornado (which assumption matters)
            FINOPS-03 build-vs-rent TCO (the own-it financial proof)
            FINOPS-15 phased / gated funding (de-risk the spend)
            FINOPS-16 cost of not acting (the do-nothing baseline)
```

Every line in the resulting artifact cites a `FINOPS-NN` pattern, a benchmark source, and a confidence — and keeps projected separate from realized. That is what makes the case CFO-grade rather than hopeful.
