# Pattern Pack — Finance / Treasury (`TREAS`)

**Pack code:** `TREAS`
**Domain:** Corporate treasury and finance for a **multi-entity holding company** — the Lakeshore / Morgan Street context: a HoldCo with multiple legal entities, operating units (PortCos / subsidiaries), dozens to hundreds of bank accounts across multiple banks and currencies, an intercompany (IC) web, debt facilities with covenants, and a treasury function being professionalized (often mid-flight on a treasury management system rollout).
**Composition:** Domain patterns here compose with the cross-cutting packs (`ARCH`, `INGEST`, `MODEL`, `MLOPS`, `GOV`, `FINOPS`) and the adjacent domain pack (`COST` cost reduction / vendor). A treasury Move artifact selects TREAS patterns for the *business + data + AI approach* and cross-cutting patterns for the *platform underneath*. Bank-connectivity and ERP ingestion lean heavily on `INGEST`; the entity/IC model leans on `MODEL`; forecasting/anomaly models lean on `MLOPS`; payment controls and SOX evidence lean on `GOV`.

**The value spine.** For a multi-entity HoldCo treasury, value concentrates on three axes that every pattern ladders up to:
1. **Liquidity certainty** — knowing, with confidence, how much cash the group has, where it sits, and what it will be over the next 13 weeks and the next four quarters. This is the difference between borrowing on the revolver "just in case" and running lean; between a surprise covenant breach and a managed one.
2. **Loss avoidance** — fraud (BEC / payment fraud), erroneous payments, and the carrying cost of trapped/idle cash. A single avoided BEC wire is often worth more than a year of treasury-analytics tooling.
3. **Cost of capital and working capital** — minimizing idle balances, bank fees, FX cost, and the cash tied up in the working-capital cycle, so the group funds itself as cheaply as possible.

**The own-it thesis for a HoldCo treasury.** A treasury SaaS platform (Kyriba, GTreasury, Coupa Treasury, FIS/Quantum, ION) is the *system of record and the operational rail* — it moves payments, holds bank connectivity, runs the cash-position and the TMS workflow. That is legitimately **RENT/MANAGED** and usually the right call: you do not want to build a payment factory. But the **analytical intelligence layer** — the forecasting models, the anomaly/fraud models, the covenant-headroom projection, the IC auto-match logic, the bank-fee analysis, the working-capital models — does **not** have to live on the vendor's cloud, scored by the vendor's black-box logic, returned as a dashboard the client cannot tune or audit. The defining structural advantage of an own-it lakehouse is that it fuses the TMS feed *with* the ERP GL/AP/AR, the bank statements (BAI2/MT940/camt), the debt agreements, the FX rates, the spend data (shared with `COST`), and the PortCo-level operational data — into one source of truth the HoldCo owns. Every forecasting and anomaly model is then trained on the *client's own history*, the features and IP transfer to the client, and the models improve as the client's data grows. The vendor's analytics module sees only what flows through the vendor's rails and holds the model on its side. Every pattern's Own-it field returns to this distinction: **rent the rails, own the intelligence.**

**A control note up front — segregation of duties and SOX.** Several patterns touch payment initiation, approval, and anomaly suppression. The non-negotiable rule throughout: **AI surfaces and scores; a human with the right authority decides and approves; segregation of duties (SoD) between initiation, approval, and release is preserved; and every action is logged for SOX/audit.** An anomaly model never auto-releases or auto-blocks a payment without a human in the loop and an audit trail. The control anti-pattern — AI that holds or releases money without SoD and evidence — is restated wherever payments appear. Treat it as a hard constraint, not a tuning knob.

> Benchmark figures below are industry ranges from AFP (Association for Financial Professionals), Hackett Group, Deloitte/PwC/EY treasury surveys, FBI IC3 (fraud), and vendor/actuarial sources. HoldCo-specific dollar values are illustrative and **must be confirmed against the client's own balances, flows, debt terms, and financials.** Flagged inline as "estimate — confirm with client data."

---

## Index

| ID | Pattern | Value spine |
|---|---|---|
| TREAS-01 | TMS / Kyriba rollout de-risk — bank connectivity & H2H | Liquidity certainty |
| TREAS-02 | TMS rollout de-risk — ERP feed quality & GL mapping | Liquidity certainty |
| TREAS-03 | Entity hierarchy & intercompany topology modeling | Liquidity / control |
| TREAS-04 | Historical position reconstruction (backfill the cash story) | Liquidity certainty |
| TREAS-05 | TMS adoption & treasurer trust (the change problem) | Liquidity certainty |
| TREAS-06 | 13-week direct cash-flow forecasting | Liquidity certainty |
| TREAS-07 | Forward (4-quarter+) liquidity & funding forecast | Liquidity / cost of capital |
| TREAS-08 | Payment anomaly & BEC fraud detection | Loss avoidance |
| TREAS-09 | Sanctions / OFAC & payee-validation screening | Loss avoidance / compliance |
| TREAS-10 | Intercompany auto-reconciliation & netting | Liquidity / control |
| TREAS-11 | Cash visibility & global concentration / pooling | Liquidity / cost of capital |
| TREAS-12 | FX exposure identification & hedging support | Cost of capital |
| TREAS-13 | Covenant headroom forecasting & early-warning | Cost of capital / risk |
| TREAS-14 | Debt & liquidity management (facility optimization) | Cost of capital |
| TREAS-15 | Working-capital optimization (DSO/DPO/DIO) | Working capital |
| TREAS-16 | Bank fee analysis & rationalization (BSB/EDI 822) | Cost / loss avoidance |
| TREAS-17 | Treasury & financial close acceleration | Productivity / certainty |
| TREAS-18 | Counterparty / bank-credit & investment risk | Loss avoidance |
| TREAS-19 | Treasury AI use-case portfolio (value × feasibility × control-risk × data-readiness) | Strategy |

---

### PATTERN TREAS-01 · TMS / Kyriba rollout de-risk — bank connectivity & host-to-host

**Intent** — Get clean, complete, timely bank data flowing into the treasury platform so the cash position is *trustworthy on day one* — the single most common point of failure in a Kyriba/TMS rollout.

**Applies to** — Multi-entity HoldCo standing up or stabilizing a TMS (Kyriba, GTreasury, FIS, ION, Coupa Treasury); Discovery (connectivity inventory), Architecture (the connectivity target state), Mobilization (the rollout's critical path). Composes with TREAS-02, -04, -11, and `INGEST` bank-statement patterns.

**Solution shape** — Bank connectivity is the load-bearing wall of any TMS program. The work, in sequence:
- **Connectivity inventory** — enumerate every bank, every account, and the *channel* per account: **SWIFT** (via a service bureau or Alliance Lite2), **host-to-host (H2H)** SFTP feeds, regional schemes (**EBICS** in Europe), or — the fragile fallback — **bank-portal manual download**. Map each to the statement format it emits: **BAI2** (US intraday/prior-day), **MT940/MT942** (SWIFT end-of-day/intraday), **camt.053/.052/.054** (ISO 20022 — the format banks are migrating to as MT messages retire).
- **Format normalization** — banks implement BAI2/MT940 *idiosyncratically* (proprietary type codes, inconsistent reference fields, missing originator detail). The reconciliation-breaking reality is that "standard" statements are not standard across banks. Build a normalization layer that maps each bank's dialect to a canonical transaction model.
- **Statement completeness & timeliness monitoring** — detect missing statements (a bank that didn't send today's file), gaps in numbering, and late files *before* the treasurer builds the position on incomplete data. This is the highest-value early instrument: a cash position built on a missing statement is wrong and erodes trust permanently.
- **ISO 20022 migration readiness** — as MT940/942 are retired in favor of camt, the connectivity layer must handle both during the transition.

The own-it lakehouse ingests the *raw* bank statements in parallel with the TMS, so the client has an independent, complete bank-data history it owns — not only what the TMS chose to surface.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** The TMS and the SWIFT service bureau / H2H rails are legitimately **RENT/MANAGED** — building a payment factory or a SWIFT connection in-house is rarely justified. But the **normalized bank-statement data products, the completeness-monitoring logic, and the canonical transaction model live on the client lakehouse (`INGEST` + `MODEL`)** so the client owns a vendor-independent record of every bank movement and can reconcile the TMS against ground truth. **RENT (disqualified for the intelligence layer)** = letting the TMS be the only place bank data ever lands, so the client has no independent history and no leverage if it ever changes platforms.

**Where it sits** — Bronze (raw bank statements: BAI2/MT940/camt), Silver (normalized canonical transactions), Gold (completeness/timeliness monitoring). Architecture + Mobilization (critical path).

**Evidence anchors** —
- Bank connectivity and data quality are the **most commonly cited cause of TMS implementation overrun and dissatisfaction** (AFP / Treasury Today / Strategic Treasurer technology surveys — *confirm against the client's program status*).
- ISO 20022 / camt migration is live: SWIFT's MT-to-ISO 20022 coexistence for cross-border payments runs to **November 2025**, after which MT category-1/2 messages retire — connectivity must be camt-ready (SWIFT ISO 20022 programme).
- BAI2, SWIFT MT940/MT942, and ISO 20022 camt.053/.052/.054 are the canonical statement formats; per-bank dialect variance is the normalization burden (BAI / SWIFT / ISO 20022 specifications).

**Anti-patterns** —
- **Assuming "standard" formats are standard** — building one BAI2 parser and discovering every bank's file differs; normalization-per-bank is the real scope.
- **No statement-completeness monitor** — the treasurer discovers a missing statement only when the position is already wrong; trust never recovers.
- **TMS as the sole bank-data home** — no independent, client-owned history; total dependence on the vendor.
- **Manual portal download as a permanent state** rather than a stopgap — fragile, unauditable, doesn't scale across a HoldCo's account sprawl.

**Feeds artifacts** — Architecture (connectivity target state + canonical bank model); Mobilization (connectivity critical path + go-live readiness); Business Case (the de-risk value of a position the treasurer trusts); Discovery (connectivity inventory).

**Maturity** — production-ready.

---

### PATTERN TREAS-02 · TMS rollout de-risk — ERP feed quality & GL mapping

**Intent** — Make the ERP-to-TMS data flow (AP, AR, GL, payments) clean and reconcilable so the platform's forecast, IC, and position logic are fed correct data — the second-most-common TMS rollout failure after bank connectivity.

**Applies to** — HoldCo with one or many ERPs (SAP S/4HANA, Oracle/NetSuite, Microsoft Dynamics, Workday, plus PortCo-level ledgers); Architecture, Mobilization. Composes with TREAS-01, -03, -06, -10, and `INGEST` ERP patterns.

**Solution shape** — The TMS needs payment instructions, AP/AR open items, GL cash accounts, and forecast inputs from the ERP. In a HoldCo, the friction is that PortCos run **heterogeneous ERPs and charts of accounts**, so the feed is many-to-one and the semantics differ per entity. The work:
- **Source-feed inventory & contract** — per ERP, define the extract (payment batches, AP/AR open items, GL balances, bank-account master) and the delivery (IDoc/BAPI for SAP, REST/SuiteScript for NetSuite, file extracts for legacy).
- **GL account & cash-account mapping** — map each entity's cash/clearing GL accounts to the canonical bank-account model (TREAS-01) so book-vs-bank reconciliation is possible; this mapping is where most "the cash position doesn't tie to the GL" complaints originate.
- **Chart-of-accounts harmonization** — a canonical mapping from each PortCo's COA to a group taxonomy (the own-it `MODEL` layer; shared with the cost taxonomy in `COST`-02), so forecast categories and IC accounts are comparable across entities.
- **Feed-quality monitoring** — completeness, duplicate-batch detection, and reconciliation of ERP payment batches against bank confirmations and TMS state. A duplicate or dropped payment batch is both a forecast error and a fraud/control exposure.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** The ERPs and the TMS are **RENT/MANAGED** systems. The **canonical GL/cash mapping, the COA harmonization, and the feed-quality monitoring live on the client lakehouse** so the group owns the semantic layer that ties ERP to bank to TMS — and reuses it for forecasting (TREAS-06), IC (TREAS-10), and close (TREAS-17). **RENT** = relying solely on the TMS's per-bank/per-ERP connectors with no independent reconciliation, leaving the client unable to prove the TMS is fed correctly.

**Where it sits** — Bronze (raw ERP extracts), Silver (mapped GL/cash + harmonized COA), Gold (feed-quality + book-vs-bank reconciliation). Architecture + Mobilization.

**Evidence anchors** —
- ERP integration and master-data quality rank alongside bank connectivity as top TMS implementation risks (Hackett / Deloitte treasury-transformation studies — *estimate, confirm*).
- Heterogeneous PortCo ERPs/COAs are the structural reason HoldCo treasury data is hard — there is no single ERP to point the TMS at (engagement pattern — *confirm against client estate*).

**Anti-patterns** —
- **Mapping the GL cash accounts as an afterthought** — the position won't tie to the books and finance won't trust it.
- **Forcing one COA before harmonizing** — a multi-quarter ERP-consolidation project disguised as a TMS feed; harmonize via a mapping layer, don't block on ERP unification.
- **No duplicate-batch detection** — a re-sent payment batch becomes a double payment and a forecast error.

**Feeds artifacts** — Architecture (ERP-feed + semantic layer); Mobilization (feed go-live); Business Case (forecast accuracy + reconciliation value); Discovery (ERP/COA inventory).

**Maturity** — production-ready.

---

### PATTERN TREAS-03 · Entity hierarchy & intercompany topology modeling

**Intent** — Build the authoritative model of the HoldCo's legal-entity hierarchy, ownership, bank-account ownership, and the intercompany lending/trading web, so every downstream cash, IC, FX, and covenant view is computed against correct structure.

**Applies to** — Multi-entity HoldCo; Architecture (the structural data product), Strategy, Governance. Composes with TREAS-04, -10, -11, -12, -13, and `MODEL` master-data patterns.

**Solution shape** — Treasury intelligence is meaningless without a correct entity model. Build, on the lakehouse, a **legal-entity master** with: each entity's jurisdiction, functional currency, tax/regulatory status, ownership percentage and parent (the consolidation tree), and the bank accounts it owns. Layer the **intercompany topology** — who lends to whom, IC trade relationships, the IC loan agreements (principal, rate, currency, maturity), and the netting structure. This is the **slowly-changing dimension** problem in its hardest form: entities are acquired, divested, merged, and re-parented constantly in a PE-backed HoldCo, so the model must be **bitemporal** (valid-time and transaction-time) — you must be able to ask "what did the structure look like on the covenant test date" even after a subsequent reorganization. Resolve entity identity across systems (the same legal entity has different IDs in the TMS, each ERP, and the cap table — an `LLM`-assisted entity-resolution problem shared with `COST`-01). The output is the structural spine every other TREAS pattern joins to.

**Own-it vs rent** — **OWN.** The entity hierarchy, IC topology, and bitemporal history are core master data that **must** live on the client lakehouse (`MODEL`) — it is the structural truth of the group, reused by consolidation, tax, treasury, FX, covenant, and the cost pack. A TMS holds *its* view of entities; relying on it as the master leaves the client unable to reconstruct historical structure or unify across ERPs/cap table. **RENT** = treating the TMS entity list as the master of record.

**Where it sits** — Gold (legal-entity master, IC topology, bitemporal SCD). Architecture (the structural data product); Strategy; Governance.

**Evidence anchors** —
- PE-backed HoldCos reorganize entities frequently (acquisitions, carve-outs, re-domiciliation); a non-temporal entity model cannot answer "as-of" questions for covenant and audit (engagement pattern — *confirm against client cap table*).
- Entity identity is fragmented across TMS, multiple ERPs, and cap-table/legal systems — resolution is required before any cross-entity aggregation (master-data principle).

**Anti-patterns** —
- **A flat, current-only entity list** — cannot answer as-of questions for covenants (TREAS-13), audit, or post-reorg reconstruction.
- **Using the TMS entity list as the master** — incomplete and vendor-bound.
- **Ignoring IC topology** until reconciliation breaks (TREAS-10) — the IC web must be modeled up front.

**Feeds artifacts** — Architecture (entity/IC structural data product); Strategy (group structure); Governance (as-of auditability); Business Case (foundation for every cross-entity value claim).

**Maturity** — production-ready.

---

### PATTERN TREAS-04 · Historical position reconstruction (backfill the cash story)

**Intent** — Reconstruct a clean, multi-year history of daily cash positions and flows across the group, so forecasting models have training data and treasury can see trend, seasonality, and the true baseline from day one of the platform — rather than waiting a year for the TMS to accumulate history.

**Applies to** — HoldCo at TMS go-live or platform stand-up; Architecture, Mobilization. Composes with TREAS-01, -02, -06, -11, -15.

**Solution shape** — A fresh TMS starts with no history; forecasting (TREAS-06/07), seasonality, and working-capital baselines (TREAS-15) all need *years* of data. The reconstruction ingests historical bank statements (often available 12–24 months back via bank archives), historical ERP AP/AR/GL, and historical FX rates, then rebuilds the **daily cash position per account/entity/currency** and the **categorized cash-flow history** (payroll, AP runs, AR receipts, debt service, tax, IC) backward in time. The hard parts: aligning historical entity structure (use the bitemporal model, TREAS-03), normalizing bank-format changes over the historical window, and classifying historical flows into the canonical forecast categories. The output is a clean cash-flow time series that is *both* the forecasting training set and the artifact that lets the new treasurer see "what normal looks like" immediately.

**Own-it vs rent** — **OWN.** The reconstructed history is a **client-owned data asset** on the lakehouse — it is the training data for every own-it forecast model and it persists regardless of TMS choice. A vendor's analytics module typically starts accumulating history only from its own go-live and holds it on the vendor cloud; the own-it reconstruction is independent and portable. **RENT** = accepting "the forecast will get good after a year of data accumulates in the vendor's platform."

**Where it sits** — Silver (historical normalized flows), Gold (reconstructed daily positions + categorized cash-flow time series). Architecture + Mobilization.

**Evidence anchors** —
- Banks commonly provide **12–24 months** of archived statements; ERP history is generally available for the same or longer window (*confirm retention with each bank/ERP*).
- Forecasting and seasonality models need multiple cycles of history to be credible; reconstruction removes the "wait a year" gap (forecasting practice — *estimate*).

**Anti-patterns** —
- **Starting forecasting from go-live data only** — no seasonality, no baseline, a year of poor forecasts.
- **Reconstructing against current entity structure** instead of as-of structure (TREAS-03) — misattributes historical flows.
- **Skipping historical flow classification** — the time series exists but isn't usable for category-level forecasting.

**Feeds artifacts** — Architecture (historical data product); Mobilization (day-one forecast capability); Business Case (faster time-to-accurate-forecast); Strategy (baseline + seasonality view).

**Maturity** — production-ready.

---

### PATTERN TREAS-05 · TMS adoption & treasurer trust (the change problem)

**Intent** — Make the platform *adopted and trusted* — the soft failure mode that kills more treasury-transformation value than any technical gap, because a treasurer who doesn't trust the position keeps running the parallel spreadsheet.

**Applies to** — HoldCo treasury transformation; Mobilization, Strategy (change-management track). Composes with TREAS-01, -02, -04, -06.

**Solution shape** — The recurring failure: the TMS goes live, but the treasury team keeps maintaining the legacy Excel cash position "to be safe," because at some point the platform showed a wrong number (a missing statement, a mismapped GL account, an unreconciled IC) and trust broke. The adoption pattern treats **trust as an engineered outcome**:
- **Reconciliation-first rollout** — go live on visibility (TREAS-01/11) and prove the platform ties to the bank and the GL *before* asking the team to run payments or forecasts on it.
- **Explainability** — every position and forecast number can be drilled to its source statements and transactions (the own-it data lineage), so when a treasurer asks "why is this number what it is," the answer is one click, not a vendor support ticket.
- **Parallel-run with a sunset date** — run TMS and legacy in parallel, *measure the variance*, fix the drivers, and commit to a sunset; an open-ended parallel run means the platform never wins.
- **Adoption telemetry** — instrument who uses what, where the team falls back to spreadsheets, and which numbers get questioned, so the program fixes the actual trust gaps, not assumed ones.

**Own-it vs rent** — **OWN** for the explainability/lineage layer and the adoption telemetry on the lakehouse — these are what make the numbers defensible and the rollout measurable. The TMS is the operational tool (**MANAGED**), but trust is built on the client's own ability to trace every number to source, which the own-it data layer provides. **RENT** = depending on the vendor's opaque "trust us" dashboards.

**Where it sits** — Gold (lineage + adoption telemetry), serving (drill-to-source views). Mobilization + Strategy.

**Evidence anchors** —
- "Still running the parallel spreadsheet" is the canonical signal of failed treasury-system adoption (treasury-transformation practitioner consensus — *qualitative*).
- Transformation value is realized only on adoption; technical go-live ≠ value capture (Hackett/Deloitte change-management findings — *estimate*).

**Anti-patterns** —
- **Open-ended parallel run** — the legacy spreadsheet never dies and the investment never pays back.
- **Numbers with no drill-to-source** — the first unexplained figure breaks trust permanently.
- **Declaring victory at technical go-live** — adoption, not go-live, is the value gate.

**Feeds artifacts** — Mobilization (adoption + parallel-run-sunset plan); Strategy (change-management track); Business Case (value-realization gating on adoption).

**Maturity** — production-ready.

---

### PATTERN TREAS-06 · 13-week direct cash-flow forecasting

**Intent** — Produce a rolling **13-week direct-method** cash forecast per entity and consolidated, accurate enough that treasury funds the group lean — minimizing idle balances and revolver draws — and sees liquidity stress weeks before it arrives.

**Applies to** — Multi-entity HoldCo (especially PE-backed / leveraged, where the 13-week is the lender/sponsor-mandated cadence); Strategy, Business Case. The liquidity-certainty spine. Composes with TREAS-04, -07, -10, -13, -15.

**Solution shape** — The **13-week cash flow (TWCF)** is the operating treasury forecast: a direct (receipts-and-disbursements) model, not the indirect (GL-derived) method. Build it on the lakehouse from the reconstructed history (TREAS-04) and live ERP/bank feeds:
- **Category models** — decompose flows into forecastable categories: **AR receipts** (driven by the AR aging and historical collection-curve patterns — a customer's days-to-pay distribution), **AP disbursements** (driven by AP open items and payment-run schedules), **payroll** (recurring, high-confidence), **debt service** (deterministic from the debt schedule, TREAS-14), **tax** (calendar-driven), and **intercompany** (TREAS-10).
- **ML where it earns its place** — the AR-receipt timing is the genuinely *predictive* part (which open invoices land in which week, given customer payment behavior and seasonality); time-series + customer-behavior models beat naive "due-date = pay-date" assumptions. Recurring categories (payroll, debt service) are deterministic and shouldn't be over-modeled.
- **Variance loop** — every week, compare forecast to actual *by category and entity*, attribute the variance, and feed it back. **Forecast accuracy is the headline KPI** (e.g., mean absolute percentage error by horizon week), and the variance attribution is what makes the forecast improve and the treasurer trust it.
- **Entity + consolidated views** — forecast bottom-up per entity, then consolidate with IC eliminations (TREAS-10), because the group's net position is not the sum of gross entity positions.

**Own-it vs rent** — **OWN.** The forecasting models, the customer payment-behavior features, and the variance-attribution logic live on the client lakehouse, trained on the client's own reconstructed history (TREAS-04). **This is the canonical rent-the-rails-own-the-intelligence case:** the TMS provides the actuals and may offer a forecasting module, but a vendor module forecasts on the vendor's generic logic and holds the model on its cloud — the client cannot tune it, cannot inspect why a week is off, and cannot improve it with its own AR-behavior signal. The own-it model is trained on the client's data, transparent, and a compounding asset. **RENT (flag explicitly)** = adopting the TMS's black-box forecast as the system of truth.

**Where it sits** — Gold (forecast marts, category models, variance attribution), serving (treasurer forecast workbench). Strategy + Business Case spine.

**Evidence anchors** —
- The 13-week direct cash forecast is the standard liquidity-management and lender-reporting cadence for leveraged/PE-backed companies (AFP / sponsor-reporting norms).
- Forecast-accuracy improvement (lower MAPE) translates to lower precautionary cash buffers and fewer revolver draws — quantify against the client's idle-balance and borrowing cost (*estimate, confirm with client data*).
- AR-receipt timing is the dominant forecast-error source; customer payment-behavior modeling materially improves it (treasury forecasting practice — *estimate*).

**Anti-patterns** —
- **Spreadsheet TWCF maintained by hand** — slow, error-prone, no variance loop, no entity scalability; the thing the transformation is meant to replace.
- **Due-date = pay-date** — ignoring that customers pay on their own behavior distribution; the single biggest naive-forecast error.
- **No variance attribution** — a forecast that's wrong but never learns why; accuracy never improves and trust erodes (TREAS-05).
- **Adopting the vendor's black-box forecast** without the own-it model to validate it.

**Feeds artifacts** — Strategy (liquidity-certainty spine); Business Case (idle-cash + borrowing-cost reduction); Architecture (forecast data products); Mobilization (weekly forecast + variance cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-07 · Forward (4-quarter+) liquidity & funding forecast

**Intent** — Project group liquidity over the strategic horizon (4+ quarters) — integrating the operating forecast, debt maturities, capex, M&A/dividend plans, and scenario stress — so the HoldCo plans funding, refinancing, and capital allocation ahead of need.

**Applies to** — HoldCo CFO/treasurer planning; Strategy, Business Case. Liquidity + cost-of-capital spine. Composes with TREAS-06, -13, -14, -18.

**Solution shape** — Where the 13-week (TREAS-06) is direct and operational, the forward forecast is **scenario-driven and strategic**: integrate the operating cash projection, the **debt-maturity schedule** (TREAS-14), planned capex, M&A/divestiture and dividend/distribution plans, and tax. Build **scenario and stress capability**: base / downside / severe, plus single-driver shocks (a rate move, a revenue downturn, a delayed refinancing, an FX move), and run them to a **minimum-liquidity / liquidity-runway** metric and the **covenant trajectory** (TREAS-13). The output answers the CFO's planning questions: *when do we need to refinance, can we fund this acquisition without breaching, how much revolver headroom do we keep, what happens to liquidity in a downturn.* Monte-Carlo or scenario-tree methods on the own-it history quantify the distribution, not just a point estimate.

**Own-it vs rent** — **OWN.** Scenario models, the integrated funding projection, and stress logic on the client lakehouse — these encode the group's specific debt, capex, and capital-allocation reality and must be transparent to the CFO and the board. A treasury-SaaS scenario module is generic and vendor-held. **RENT** = relying on a vendor's canned scenarios that don't model the client's actual debt stack and plans.

**Where it sits** — Gold (forward-forecast + scenario marts), serving (CFO/board liquidity dashboards). Strategy + Business Case.

**Evidence anchors** —
- Liquidity-runway and minimum-liquidity planning is a board-level metric for leveraged HoldCos, especially in higher-rate environments (treasury/CFO practice — *qualitative*).
- Scenario/stress forecasting is standard for refinancing and capital-allocation timing decisions (corporate-finance practice).

**Anti-patterns** —
- **A single point forecast with no scenarios** — gives the board false precision and no downside view.
- **Disconnecting the forward forecast from the debt schedule and covenants** (TREAS-13/14) — misses the refinancing and breach timing the forecast exists to surface.
- **Vendor-canned scenarios** that don't reflect the client's actual capital structure.

**Feeds artifacts** — Strategy (funding + capital-allocation plan); Business Case (cost-of-capital + headroom); Architecture (scenario data products); Mobilization (planning cadence with FP&A).

**Maturity** — production-ready.

---

### PATTERN TREAS-08 · Payment anomaly & BEC fraud detection

**Intent** — Detect anomalous and fraudulent payments — especially **Business Email Compromise (BEC)** and vendor-bank-account-change fraud — *before release*, scoring every outbound payment and routing the suspicious ones to a human reviewer while preserving segregation of duties.

**Applies to** — HoldCo payment factory / AP disbursement; Strategy, Architecture, Business Case, Governance. The loss-avoidance spine. Composes with TREAS-02, -09, -16, and `GOV` controls.

**Solution shape** — A scoring layer over the outbound payment stream (from the ERP/TMS payment batches, TREAS-02) that flags anomalies pre-release:
- **Payment anomaly models** — score each payment against the payee's and the entity's history: unusual amount, new payee, off-pattern timing, new or recently-changed beneficiary bank account, round-number or just-under-threshold amounts, duplicate-suspicion, and out-of-pattern currency/country.
- **BEC / impersonation signals** — the dominant fraud vector is a spoofed or compromised executive/vendor instruction to change a payee's bank details or push an urgent wire. The model specifically watches **vendor master bank-detail changes** (a change immediately followed by a large payment is the classic BEC signature), out-of-band approval anomalies, and urgency/threshold patterns.
- **Human-in-the-loop release control** — scored payments above a threshold are **held for a reviewer**, who sees the anomaly explanation and confirms or releases. **SoD is preserved**: the model and the reviewer never replace the initiate/approve/release separation, and a callback/positive-pay verification is enforced for bank-detail changes.
- **Feedback loop** — confirmed-fraud and confirmed-legitimate outcomes retrain the model and tune thresholds to control false positives (a payment-blocking false positive has real cost).

**Own-it vs rent** — **OWN** for the anomaly and BEC models on the client's full payment + vendor-master history — the client's own payment patterns are the moat, and the labeled fraud/legitimate outcomes are a compounding asset. Positive-pay and sanctions screening (TREAS-09) are often bank/vendor services (**MANAGED**), and the payment rail is the TMS (**MANAGED**), but the *anomaly intelligence and the held-payment decision support* stay on the client estate. **RENT** = a fraud-screening SaaS that scores on its generic model and holds the labels — less context, and the client never owns its fraud intelligence.

**Where it sits** — Gold (payment-anomaly scores, vendor-master change monitoring), serving (held-payment reviewer queue), Governance (every hold/release logged with SoD evidence). Strategy + Architecture + Business Case.

**Evidence anchors** —
- **BEC is among the costliest cyber-enabled fraud categories:** the FBI IC3 has reported **BEC losses exceeding $2.7–2.9 billion annually** in recent years, with cumulative reported losses in the tens of billions (FBI IC3 annual reports — *confirm latest year*).
- A material share of organizations experience attempted or actual payment fraud each year; AFP Payments Fraud surveys consistently report **~70–80% of organizations facing attempted/actual fraud**, with BEC the top vector (AFP Payments Fraud & Control Survey — *confirm latest figure*).
- **A single avoided fraudulent wire (often six- to seven-figure) can exceed the annual cost of the detection capability** — the value case is asymmetric (arithmetic against the client's payment sizes — *confirm with client data*).
- Vendor-bank-detail-change-then-large-payment is the canonical BEC signature (fraud-prevention practice).

**Anti-patterns** —
- **THE control anti-pattern: AI that auto-blocks or auto-releases payments without a human and without preserving SoD.** Money movement requires human authority, segregation of initiate/approve/release, and a full audit trail; an autonomous model on the payment rail is a control failure regardless of accuracy.
- **No vendor-bank-detail-change control** — the most common BEC entry point left unmonitored.
- **Alert floods with no threshold tuning** — reviewers fatigue, real anomalies get rubber-stamped.
- **Rules-only screening** — static rules miss novel/targeted BEC; anomaly ML plus the bank-change control catches what rules don't.

**Feeds artifacts** — Strategy (fraud-loss-avoidance program); Business Case (avoided-loss line — asymmetric value); Architecture (payment-anomaly models + reviewer queue); Governance (SoD + audit evidence); Mobilization (payment-control operating model).

**Maturity** — production-ready (with SoD and human-in-the-loop as hard requirements).

---

### PATTERN TREAS-09 · Sanctions / OFAC & payee-validation screening

**Intent** — Screen payees and payments against sanctions lists and validate beneficiary details so the HoldCo doesn't make a prohibited or misdirected payment — a compliance and loss-avoidance control complementing fraud detection.

**Applies to** — HoldCo with cross-border / multi-currency payments; Architecture, Governance, Business Case. Composes with TREAS-08, -11, -12.

**Solution shape** — Two linked controls: (1) **sanctions screening** — screen payees and counterparties against **OFAC SDN**, EU/UN/UK and other applicable lists, with fuzzy/name-matching that balances catch-rate against false positives, and a clear human adjudication workflow for hits; (2) **payee / beneficiary validation** — verify that the beneficiary name matches the account (the emerging **Verification of Payee / Confirmation of Payee** schemes), reducing misdirected and fraudulent payments (ties to TREAS-08 BEC). NLP/entity-resolution improves name-matching precision over naive string match. The non-negotiable: a screening *hit* routes to a trained human compliance reviewer with adjudication evidence — never auto-cleared, never auto-blocked-and-forgotten.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** Sanctions-list data and some screening engines are reasonably **RENT/MANAGED** (lists are externally maintained; banks screen too), but the **match-quality models, the adjudication record, and the screening provenance live on the client estate** so the client owns its compliance evidence and can tune false-positive rates. **RENT** = a screening SaaS that holds the adjudication record off-estate, leaving the client without its own audit trail.

**Where it sits** — Gold (screening results + adjudication record), serving (compliance reviewer queue), Governance (screening provenance). Architecture + Governance.

**Evidence anchors** —
- OFAC sanctions violations carry **strict-liability civil penalties** that can reach the greater of a statutory cap or twice the transaction value, plus reputational damage (OFAC enforcement guidance — *confirm current penalty structure*).
- Confirmation/Verification-of-Payee schemes are being mandated/adopted across major payment systems to cut misdirected and APP fraud (UK CoP; EU VoP regulation — *confirm applicability*).

**Anti-patterns** —
- **Auto-clearing screening hits** to reduce review load — a compliance failure.
- **Naive string matching** with no fuzzy/entity-resolution — high false-positive load that gets ignored, or missed true hits.
- **Off-estate adjudication record** — no client-owned audit trail.

**Feeds artifacts** — Architecture (screening control); Governance (sanctions/payee-validation evidence); Business Case (penalty + misdirected-payment avoidance); Mobilization (compliance reviewer workflow).

**Maturity** — production-ready.

---

### PATTERN TREAS-10 · Intercompany auto-reconciliation & netting

**Intent** — Automatically match, reconcile, and net the HoldCo's intercompany positions and flows — eliminating the manual IC close grind, the perennial IC imbalances, and the redundant external bank payments that IC netting removes.

**Applies to** — Multi-entity HoldCo with a meaningful IC web; Strategy, Architecture, Business Case. Liquidity + control + close spine. Composes with TREAS-02, -03, -06, -11, -17.

**Solution shape** — Intercompany is where multi-entity treasury and close lose the most time. Build, on the lakehouse against the entity/IC topology (TREAS-03):
- **IC transaction matching** — auto-match the two sides of every IC transaction (entity A's IC receivable to entity B's IC payable) across heterogeneous ERPs/COAs (TREAS-02), using deterministic keys where they exist and **ML/fuzzy matching** where references differ (amount + date + counterparty + reference proximity). The own-it advantage: the matching logic is trained on the group's own IC patterns.
- **Imbalance detection & root-cause** — surface unmatched/one-sided IC entries with the likely cause (timing difference, FX revaluation, missing booking, mis-coded counterparty), so the team fixes drivers rather than re-investigating monthly.
- **IC netting** — compute multilateral net IC settlement positions so the group settles *net* through a netting center rather than gross — cutting the number and value of external/cross-border bank payments (and the FX and fee cost on them, TREAS-12/16).
- **IC loan & interest tracking** — track IC loan balances and accrue IC interest per the agreements (TREAS-03), feeding consolidation and transfer-pricing.

**Own-it vs rent** — **OWN.** IC matching logic, imbalance root-cause, and netting computation on the client lakehouse — the IC topology (TREAS-03) and the group's own matching patterns are the moat, and IC is core master data, not a vendor service. A TMS may offer an IC/netting module, but the matching across the client's heterogeneous ERPs is best owned where the harmonized COA (TREAS-02) already lives. **RENT** = a netting-only vendor that can't reconcile against the client's own multi-ERP IC detail.

**Where it sits** — Gold (IC matching, imbalance, netting marts), serving (IC reconciliation + netting workbench). Strategy + Architecture + Business Case.

**Evidence anchors** —
- IC reconciliation is among the **most time-consuming close activities** for multi-entity groups; automation materially cuts close days (TREAS-17) (Hackett/Deloitte close benchmarks — *estimate, confirm*).
- IC netting reduces the volume and value of external bank payments and the associated FX and fee cost; commonly cited as a **double-digit-percent reduction in cross-border payment volume** for active netting programs (treasury practice — *estimate, confirm*).

**Anti-patterns** —
- **Monthly manual IC tie-out** — the recurring close bottleneck; auto-matching is the fix.
- **Netting without reconciliation** — netting unreconciled positions propagates errors into settlement.
- **Ignoring FX revaluation** as an imbalance cause — flags genuine timing/booking issues as FX noise or vice versa.

**Feeds artifacts** — Strategy (IC efficiency); Business Case (close-time + payment/FX/fee savings); Architecture (IC data products); Mobilization (IC + netting operating cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-11 · Cash visibility & global concentration / pooling

**Intent** — Give treasury a complete, real-time, group-wide view of cash by account, entity, bank, and currency — and optimize concentration/pooling so idle cash is swept, mobilized, and put to work rather than stranded across hundreds of accounts.

**Applies to** — Multi-entity, multi-bank, multi-currency HoldCo; Strategy, Architecture, Business Case. Liquidity + cost-of-capital spine. Composes with TREAS-01, -03, -10, -12, -16.

**Solution shape** — Two capabilities on the unified bank data (TREAS-01) and entity model (TREAS-03):
- **Global cash visibility** — a single, drill-able view of every balance: by bank account, legal entity, currency, bank, and region, with intraday and prior-day views, and the consolidated group position net of IC. The hard part is *completeness* (every account connected, TREAS-01) and *as-of correctness* (TREAS-03/04). The value is the end of "we think we have roughly $X somewhere."
- **Concentration / pooling optimization** — model the cash-mobilization structure: **physical pooling / zero-balance accounts (ZBA)** that sweep balances to a concentration account, and **notional pooling** (offsetting credit/debit balances for interest without physically moving funds — subject to bank, tax, and regulatory constraints). Identify **trapped cash** (regulatory, tax, or operational restrictions on moving funds out of an entity/country) and quantify the cost of idle balances. The optimization respects entity-level needs, regulatory limits, and the trapped-cash reality — it doesn't assume cash is freely fungible.

**Own-it vs rent** — **OWN** for the visibility data product and the pooling/concentration optimization analytics on the lakehouse — the client owns the complete picture of its own cash and the model of what's mobilizable vs trapped. Physical/notional pooling *structures* are bank products (**MANAGED**), but the analysis of where cash sits, what's idle, and what's trapped is own-it. **RENT** = a TMS dashboard that shows balances but can't model the client's specific trapped-cash and entity-constraint reality.

**Where it sits** — Gold (cash-visibility marts, pooling/trapped-cash analytics), serving (treasurer cash-position dashboard). Strategy + Architecture + Business Case.

**Evidence anchors** —
- Incomplete cash visibility forces precautionary buffers and idle balances; mobilizing trapped/idle cash reduces external borrowing and raises investment income — quantify against the client's idle balances and borrowing rate (*estimate, confirm with client data*).
- Notional and physical pooling are standard mobilization tools but are bank-, tax-, and jurisdiction-constrained (treasury practice; pooling is restricted/regulated in some jurisdictions — *confirm applicability*).

**Anti-patterns** —
- **Incomplete visibility presented as complete** — a position missing accounts is worse than knowing it's incomplete; ties to TREAS-01 completeness monitoring.
- **Assuming cash is freely fungible** — ignoring trapped cash and entity/regulatory constraints leads to pooling structures that can't legally execute.
- **Pooling structure with no analysis of whether it actually reduces idle balances** — structure for its own sake.

**Feeds artifacts** — Strategy (cash-mobilization); Business Case (idle-cash + borrowing-cost reduction); Architecture (visibility + pooling data products); Mobilization (concentration-structure rollout).

**Maturity** — production-ready.

---

### PATTERN TREAS-12 · FX exposure identification & hedging support

**Intent** — Identify, aggregate, and net the group's FX exposures across entities and forecast horizons, and support hedging decisions — so currency risk is managed deliberately rather than discovered at revaluation.

**Applies to** — HoldCo with multi-currency entities, flows, and IC; Strategy, Business Case, Architecture. Cost-of-capital spine. Composes with TREAS-03, -06, -07, -10, -11.

**Solution shape** — Build an **FX exposure model** on the lakehouse:
- **Exposure aggregation** — pull functional-currency mismatches from AP/AR (transaction exposure), forecasted flows (TREAS-06/07), IC balances and loans (TREAS-03/10), and balance-sheet positions (translation exposure), aggregating to a net exposure per currency pair across the group. The own-it advantage: netting exposures *across entities* (a EUR receivable in one entity offsets a EUR payable in another) so the group hedges the *net*, not the gross — cutting hedge cost.
- **Exposure forecasting** — project forward exposures from the cash forecast so hedges are placed on anticipated, not just current, positions.
- **Hedging decision support** — model hedge ratios, costs, and the P&L/cash impact of candidate hedges against the group's FX policy; track hedge effectiveness. Execution and hedge accounting are governed by policy and (often) the TMS/bank.
- **Revaluation transparency** — explain FX gains/losses to their source exposures (ties to IC imbalance, TREAS-10).

**Own-it vs rent** — **OWN** for the exposure-aggregation and netting analytics and the decision-support models on the lakehouse — net exposure across the group's specific entity structure is a client-owned view no point vendor computes from outside. FX *execution* (trading platforms, banks) and hedge-accounting tooling are **MANAGED/RENT**. **RENT** = a vendor that reports exposures per entity but can't net across the group's structure.

**Where it sits** — Gold (FX exposure marts, net-exposure + hedge-support analytics), serving (FX risk dashboard). Strategy + Business Case + Architecture.

**Evidence anchors** —
- Net-vs-gross exposure management reduces hedge volume and cost; netting across entities is a recognized treasury efficiency (treasury practice — *estimate, confirm*).
- Unhedged transaction and translation exposure drives earnings volatility; deliberate exposure management is standard for multinational HoldCos (corporate-treasury practice).

**Anti-patterns** —
- **Hedging gross per-entity exposure** instead of group-net — over-hedging and unnecessary cost.
- **Hedging only current, not forecasted, exposure** — leaves anticipated flows unmanaged.
- **No revaluation transparency** — FX P&L surprises that can't be traced to source exposures.

**Feeds artifacts** — Strategy (FX-risk policy + program); Business Case (hedge-cost + earnings-volatility reduction); Architecture (FX exposure data products); Mobilization (FX risk cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-13 · Covenant headroom forecasting & early-warning

**Intent** — Continuously compute and forecast headroom on every financial covenant in the group's debt agreements, with early-warning, so the HoldCo never *discovers* a breach at a quarter-end test — it manages toward it weeks ahead.

**Applies to** — Leveraged / PE-backed HoldCo with covenanted debt; Strategy, Business Case, Governance. Cost-of-capital + risk spine. Composes with TREAS-03, -06, -07, -14, -15.

**Solution shape** — A **covenant model** on the lakehouse encoding each facility's covenants exactly as the credit agreement defines them — because the definitions are bespoke and the math is unforgiving:
- **Covenant computation** — implement each covenant's *agreement-specific* formula: **net leverage** (Total/Net Debt ÷ EBITDA), **interest coverage** / fixed-charge coverage (EBITDA ÷ interest or fixed charges), **DSCR**, minimum-liquidity, and capex limits. Critically, EBITDA is almost always **"Adjusted EBITDA" / "EBITDA as defined in the credit agreement"** — with permitted add-backs (one-time costs, pro-forma run-rate synergies, sponsor adjustments) that differ per agreement. The model must compute the *defined* EBITDA, not GAAP EBITDA, or the headroom is wrong.
- **Headroom & forecast** — compute current headroom (actual vs threshold) and project the covenant trajectory off the forward forecast (TREAS-07) and the debt schedule (TREAS-14), so a tightening trend is visible quarters out.
- **Early-warning & scenario** — alert when projected headroom crosses warning thresholds; run the covenant under the TREAS-07 stress scenarios; and model the *levers* (cost actions per the `COST` pack, working-capital release per TREAS-15, deleveraging) that restore headroom — and the lead time each needs.
- **Compliance-certificate support** — assemble the data for the periodic compliance certificate the lenders require, auditable to source.

**Own-it vs rent** — **OWN, and necessarily so.** The covenant definitions are bespoke contract terms; the computation, the as-defined-EBITDA logic, and the forecast must live on the client lakehouse, transparent and auditable to the CFO, the board, and the lenders. A generic covenant module that doesn't encode *this agreement's* add-backs computes the wrong number. **RENT** = a vendor template that approximates covenants instead of implementing the actual credit-agreement math.

**Where it sits** — Gold (covenant computation + headroom forecast marts), serving (CFO/board covenant dashboard, early-warning), Governance (compliance-certificate evidence). Strategy + Business Case + Governance.

**Evidence anchors** —
- A covenant breach can trigger **default, repricing, cash sweeps, equity-cure demands, or acceleration** — far costlier than the cost of forecasting headroom; the value is avoided-default and preserved-flexibility (credit-agreement mechanics — *confirm against the client's actual facilities*).
- "Adjusted EBITDA as defined" with bespoke add-backs is standard in leveraged credit agreements; computing GAAP EBITDA instead mis-states headroom (leveraged-finance practice).
- Early management of a tightening covenant (cost/working-capital/deleveraging levers) requires *lead time* — the forecast's core value is buying that lead time (CFO practice — *qualitative*).

**Anti-patterns** —
- **Computing GAAP EBITDA, not as-defined EBITDA** — the most common covenant-math error; the add-backs are contractually specific.
- **Quarter-end discovery of a breach** — no forecast, no lead time, no levers; the exact failure the pattern prevents.
- **A generic covenant template** that doesn't encode the actual agreement.
- **No link to the lever models** (cost, working capital, deleveraging) — knowing the breach is coming without modeling how to avoid it.

**Feeds artifacts** — Strategy (covenant-risk management); Business Case (avoided-default + cost-of-capital protection); Architecture (covenant data products); Governance (compliance-certificate evidence); Mobilization (covenant-monitoring + lender-reporting cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-14 · Debt & liquidity management (facility optimization)

**Intent** — Maintain a complete, accurate model of the group's debt stack — every facility, draw, rate, maturity, and fee — and optimize its use: revolver vs term, the cost of carrying undrawn commitment fees vs idle cash, refinancing timing, and interest-cost minimization.

**Applies to** — HoldCo with revolvers, term loans, and other facilities; Strategy, Business Case, Architecture. Cost-of-capital spine. Composes with TREAS-06, -07, -11, -13, -18.

**Solution shape** — A **debt master** on the lakehouse: every facility with its principal, drawn/undrawn amount, rate (and its **reference-rate** basis — **SOFR/Term SOFR** post-LIBOR, plus spread and any floor), commitment/unused fees, covenants (TREAS-13), maturity, and amortization. On it:
- **Debt service forecasting** — deterministic interest and principal schedules feeding the cash forecasts (TREAS-06/07).
- **Facility optimization** — model the trade-off between drawing the revolver (interest on drawn) and holding cash (return on idle, TREAS-11) net of **commitment fees on undrawn capacity**; minimize all-in cost. For a HoldCo, also model whether group cash mobilization (TREAS-11) can reduce a draw.
- **Refinancing & maturity-wall management** — surface upcoming maturities and the maturity wall, and time refinancing against the forward forecast (TREAS-07) and rate environment.
- **Interest-rate exposure** — quantify floating-rate exposure and support hedging decisions (interest-rate swaps/caps), analogous to FX (TREAS-12).

**Own-it vs rent** — **OWN.** The debt master, debt-service schedules, and optimization analytics on the lakehouse — the group's specific facilities, rates, and fee terms are client data, and the optimization is transparent to the CFO. **RENT** = a generic debt module that doesn't model the actual facility terms and fee structures.

**Where it sits** — Gold (debt master, debt-service + optimization marts), serving (debt/liquidity dashboard). Strategy + Business Case + Architecture.

**Evidence anchors** —
- Post-LIBOR, USD facilities reference **Term SOFR / SOFR** plus spread (and credit-spread adjustment on transitioned loans); the debt model must use the correct reference rate (ARRC / SOFR transition).
- Commitment fees on undrawn revolver capacity vs the return on idle cash is a real all-in-cost optimization; minimizing the sum reduces net interest cost (treasury practice — *estimate, confirm with client facility terms*).
- Maturity-wall and refinancing-timing management is core to cost-of-capital control for leveraged HoldCos (corporate-finance practice).

**Anti-patterns** —
- **A debt schedule in spreadsheets** disconnected from the cash forecast and covenants — debt service mis-forecast, covenant link broken.
- **Drawing the revolver while holding idle cash** that group mobilization (TREAS-11) could have funded — paying interest and earning little.
- **Ignoring commitment fees** in the draw-vs-hold decision.
- **Stale reference-rate basis** (e.g., still modeling LIBOR) — wrong interest cost.

**Feeds artifacts** — Strategy (capital-structure management); Business Case (interest-cost reduction); Architecture (debt data products); Mobilization (debt + refinancing cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-15 · Working-capital optimization (DSO / DPO / DIO)

**Intent** — Release cash trapped in the working-capital cycle by instrumenting and improving **DSO** (receivables), **DPO** (payables), and **DIO** (inventory) across the group — turning the cash-conversion cycle into a managed, forecastable lever.

**Applies to** — HoldCo and its PortCos with operating working capital; Strategy, Business Case. Working-capital spine. Composes with TREAS-06, -10, -13, and `COST` (payment-terms leverage).

**Solution shape** — Build the **cash-conversion-cycle (CCC) model** on the lakehouse (CCC = DSO + DIO − DPO), decomposed per entity/PortCo and per customer/supplier where it matters:
- **DSO / receivables** — analyze the AR aging and customer payment-behavior (shared with the TREAS-06 collection-curve models); target collection-process improvements and identify the customers/segments driving DSO. Feeds the AR-receipt forecast.
- **DPO / payables** — analyze payment timing vs terms; identify *early payments leaving free float on the table* and the trade-off between extending DPO and capturing **early-payment / dynamic-discounting** value (where the discount beats the cost of capital). For a HoldCo, payment-terms leverage ties to the `COST` vendor-negotiation pack.
- **DIO / inventory** — for PortCos with inventory, surface slow-moving/excess inventory tying up cash.
- **Cash-release quantification** — translate a day of DSO/DPO/DIO improvement into dollars of released cash *per entity and group*, and feed the release into the liquidity forecast (TREAS-06/07) and covenant headroom (TREAS-13).

**Own-it vs rent** — **OWN.** The CCC models, customer/supplier behavior features, and cash-release quantification on the lakehouse — built on the client's own AR/AP/inventory data and reused across forecasting and the cost pack. **RENT** = a working-capital benchmarking SaaS that returns peer comparisons but holds the models and can't drive the client's own forecast.

**Where it sits** — Gold (CCC marts, DSO/DPO/DIO + cash-release analytics), serving (working-capital dashboard). Strategy + Business Case.

**Evidence anchors** —
- **One day of CCC improvement = (annual revenue or COGS ÷ 365) of released cash** per the relevant driver — the arithmetic is exact; the dollars depend on the client's revenue/COGS base (*confirm with client financials*).
- Working-capital optimization is a primary PE value-creation lever; programs commonly target **mid-to-high-single-digit-percent** working-capital reduction (PwC/Hackett/EY working-capital studies — *estimate, confirm*).
- Dynamic discounting / early-payment capture beats the cost of capital when the implied discount rate exceeds the borrowing rate (treasury practice).

**Anti-patterns** —
- **Extending DPO indiscriminately** — straining supplier relationships and risking supply (and contradicting the `COST` partnership leverage); the lever is *terms alignment*, not unilateral stretching.
- **Leaving early-payment float on the table** when no discount is captured — paying early for nothing.
- **CCC as a benchmark vanity metric** with no per-driver cash-release model tied to the forecast.

**Feeds artifacts** — Strategy (working-capital value lever); Business Case (cash-release line — exact arithmetic); Architecture (CCC data products); Mobilization (working-capital program cadence with the PortCos).

**Maturity** — production-ready.

---

### PATTERN TREAS-16 · Bank fee analysis & rationalization (BSB / EDI 822)

**Intent** — Parse, validate, and rationalize the HoldCo's bank fees across every bank and account — catching billing errors and overcharges, eliminating redundant accounts/services, and arming bank-relationship negotiations with the truth about what the group actually pays.

**Applies to** — Multi-bank, multi-account HoldCo; Strategy, Business Case. Cost + loss-avoidance spine. Composes with TREAS-01, -11, and `COST` vendor-rationalization patterns.

**Solution shape** — Bank fees are opaque and frequently wrong. Build a fee-analytics layer on the lakehouse:
- **Statement ingestion** — parse the standardized bank-fee statements: **BSB (Bank Services Billing — ISO 20022 camt.086)** and the legacy **ANSI X12 EDI 822** account-analysis statements, plus per-bank PDFs where needed. Normalize to a canonical service taxonomy across banks (the AFP Service Codes give a cross-bank standard).
- **Error & overcharge detection** — validate billed fees against contracted/negotiated rates and the actual volumes; flag billing errors, services billed but not used, and rate drift. Bank-fee errors are common and recoverable.
- **Rationalization** — identify redundant accounts (zero-activity, duplicate-purpose), redundant services, and the true all-bank cost of each service category, feeding both account closure and the `COST` enterprise-rate negotiation leverage.
- **Negotiation support** — a complete, normalized view of group-wide bank spend by bank and service is the leverage for relationship reviews and RFPs.

**Own-it vs rent** — **OWN** for the fee-normalization, error-detection, and rationalization analytics on the lakehouse — the normalized group-wide bank-spend picture is the client's negotiation leverage and shouldn't sit on a vendor's platform. Specialized bank-fee-analysis vendors exist (**RENT** option); the own-it posture keeps the normalized data and the recurring monitoring with the client, and integrates with the broader cost pack. **RENT** = a one-time vendor fee audit that hands back a report but no durable, client-owned monitoring asset.

**Where it sits** — Bronze (BSB/EDI 822 statements), Silver (normalized fees on a canonical taxonomy), Gold (error/overcharge + rationalization analytics). Strategy + Business Case.

**Evidence anchors** —
- **BSB (camt.086)** and **ANSI X12 EDI 822** are the standard machine-readable bank-fee statement formats; AFP Service Codes provide a cross-bank service taxonomy (ISO 20022; X12; AFP).
- Bank-fee analysis routinely surfaces **recoverable billing errors and redundant-service savings** in the low-to-mid-single-digit-percent of total bank fees (treasury/AFP practice — *estimate, confirm*).

**Anti-patterns** —
- **Never reconciling fees to contracted rates** — overcharges and errors go uncaught indefinitely.
- **PDF-only fee review** ignoring the machine-readable BSB/822 statements — unscalable across a HoldCo's account sprawl.
- **One-time audit with no ongoing monitoring** — fees drift back up after the consultant leaves.

**Feeds artifacts** — Strategy (bank-spend rationalization); Business Case (fee-error recovery + savings); Architecture (fee data products); Mobilization (bank-relationship-review cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-17 · Treasury & financial close acceleration

**Intent** — Shorten the treasury and cash-related close — bank reconciliation, IC tie-out, cash-position sign-off, and the treasury inputs to the group close — by automating reconciliation and surfacing exceptions, so close days fall and certainty rises.

**Applies to** — Multi-entity HoldCo close; Strategy, Business Case. Productivity + certainty spine. Composes with TREAS-01, -02, -10, -11.

**Solution shape** — Treasury contributes several close bottlenecks; automate them:
- **Bank reconciliation** — auto-match bank statement lines (TREAS-01) to GL/sub-ledger entries (TREAS-02) with ML/fuzzy matching for the unmatched tail; surface only true exceptions to a human.
- **IC close** — the IC auto-reconciliation and netting (TREAS-10) is often the single biggest close-day saver for a multi-entity group.
- **Cash-position sign-off** — a trusted, drill-able position (TREAS-05/11) that closes without a manual spreadsheet rebuild.
- **Exception-driven close** — instead of reviewing everything, the close team reviews only flagged exceptions (unmatched items, anomalies, imbalances), with explanations attached.
- **Close metrics** — instrument close days, manual-touch counts, and exception volumes to drive continuous reduction.

**Own-it vs rent** — **OWN** for the reconciliation-matching models, exception logic, and close analytics on the lakehouse, reusing the bank/ERP/IC data products already built. Close/consolidation tools (e.g., the ERP's consolidation or a close-management SaaS) may be **MANAGED**, but the treasury-side matching intelligence is own-it. **RENT** = a close SaaS that holds the matching logic and can't reach the client's own normalized bank/IC data.

**Where it sits** — Gold (reconciliation-match + close-exception marts), serving (close exception workbench + metrics). Strategy + Business Case.

**Evidence anchors** —
- Auto-reconciliation and exception-based close are recognized close-acceleration levers; high performers close materially faster than the median (Hackett/APQC close benchmarks; "days to close" — *estimate, confirm*).
- IC reconciliation is among the largest close-day consumers for multi-entity groups (TREAS-10 anchor restated).

**Anti-patterns** —
- **Reviewing everything every close** instead of exception-driven review — no scalability, no time saving.
- **Manual cash-position rebuild at close** — the TREAS-05 parallel-spreadsheet failure, restated at close.
- **No close metrics** — can't show or sustain the improvement.

**Feeds artifacts** — Strategy (close acceleration); Business Case (close-day + FTE-effort reduction); Architecture (reconciliation data products); Mobilization (close redesign cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-18 · Counterparty / bank-credit & investment risk

**Intent** — Monitor the credit and concentration risk of the group's banking partners and short-term investment counterparties, so cash deposits and investments aren't over-concentrated in a weakening institution.

**Applies to** — HoldCo holding meaningful operating/strategic cash across banks and short-term investments; Strategy, Governance, Business Case. Loss-avoidance spine. Composes with TREAS-11, -14, and `COST` (banking-relationship federation).

**Solution shape** — A **counterparty-risk model** on the lakehouse: aggregate the group's exposure to each bank (deposits, undrawn-facility reliance, investment holdings) and monitor counterparty credit signals (ratings, CDS spreads where available, public financial signals). Enforce **concentration limits** per the treasury investment policy (max % or $ per counterparty, per rating band), surface limit breaches, and model the **investment portfolio** (money-market funds, treasuries, deposits) against the policy's liquidity/safety/yield objectives — in that priority order. The 2023 regional-bank failures made this concrete: operating cash concentrated above insurance limits at a single weakening bank is a real, fast-moving risk. The model watches exposure *and* the counterparty's health, with early-warning.

**Own-it vs rent** — **OWN** for the exposure-aggregation and concentration-limit monitoring on the lakehouse — the group's specific bank/investment exposures and policy limits are client data. External credit signals (ratings, market data) are **RENT** inputs. **RENT** = a vendor that monitors generic ratings but can't aggregate the client's actual cross-bank exposure against its own policy.

**Where it sits** — Gold (counterparty-exposure + limit-monitoring marts), serving (counterparty-risk dashboard), Governance (policy-limit evidence). Strategy + Governance + Business Case.

**Evidence anchors** —
- The 2023 regional-bank failures demonstrated rapid counterparty risk on concentrated uninsured operating cash; concentration-limit discipline is the control (treasury risk-management lesson — *qualitative*).
- FDIC insurance covers only a small per-account/ownership limit; large operating balances are uninsured and concentration-exposed (FDIC — *confirm current limit*).
- Treasury investment-policy priority is conventionally **safety, liquidity, then yield** — in that order (treasury policy norm).

**Anti-patterns** —
- **Concentrating operating cash at one bank** above insurance and prudent limits with no monitoring.
- **Chasing yield ahead of safety/liquidity** — inverting the policy priority.
- **Monitoring ratings but not the group's actual aggregate exposure** to each counterparty.

**Feeds artifacts** — Strategy (counterparty-risk policy); Governance (concentration-limit evidence); Business Case (loss-avoidance); Mobilization (counterparty-monitoring cadence).

**Maturity** — production-ready.

---

### PATTERN TREAS-19 · Treasury AI use-case portfolio (value × feasibility × control-risk × data-readiness)

**Intent** — Rank a HoldCo treasury's candidate AI/analytics use cases on a consistent four-factor scoring so the Strategy artifact sequences investment by *value per unit of control-risk and effort* — anchored on the liquidity-certainty, loss-avoidance, and cost-of-capital spines.

**Applies to** — HoldCo treasury transformation; Discovery, Strategy (the portfolio synthesis). Composes with every TREAS pattern above and the `COST` pack.

**Solution shape** — Score each candidate use case (the patterns above plus client-specific ideas) on four axes:
- **Value** — quantified against the **three value spines**: liquidity certainty (forecasting TREAS-06/07, visibility TREAS-11, IC TREAS-10), loss avoidance (fraud TREAS-08, sanctions TREAS-09, counterparty TREAS-18, fee errors TREAS-16), and cost of capital / working capital (debt TREAS-14, FX TREAS-12, working capital TREAS-15, covenant headroom TREAS-13). Say explicitly which spine each use case ladders to. The asymmetric winner to call out: **fraud/BEC (TREAS-08)** — a single avoided wire can dwarf the program cost.
- **Feasibility** — gated hard by the **rollout-de-risk patterns**: many treasury use cases are *infeasible until bank connectivity (TREAS-01), ERP feeds (TREAS-02), the entity model (TREAS-03), and historical reconstruction (TREAS-04) exist*. The portfolio must sequence these foundations first — they are the data-readiness floor for everything else.
- **Control risk** — explicitly rate the **payment-touching use cases (TREAS-08/09)** as **high control sensitivity**: they belong in the portfolio for their value but with **segregation-of-duties, human-in-the-loop, and SOX-audit guardrails as gating requirements**, never as fast-and-loose automation. An AI on the payment rail without SoD is a control failure regardless of value.
- **Data readiness** — does the lakehouse have the joined bank + ERP + debt + FX + entity data the use case needs? The de-risk patterns (TREAS-01–04) *are* the data-readiness program; gaps reorder the roadmap.

Output a 2×2 (value × feasibility) bubble map with control-risk as color and data-readiness as size, plus a sequenced roadmap. The portfolio's recurring conclusion for a HoldCo treasury: **foundations first (connectivity, feeds, entity model, history), then the spines** — fraud/loss-avoidance and forecasting/liquidity-certainty are usually the fastest high-value wins once the foundation exists; working-capital and cost-of-capital optimization compound over time.

**Own-it vs rent** — **OWN** the portfolio method and scoring on the client's own value/feasibility/control/data assessment. The portfolio's structural recommendation is **rent the rails, own the intelligence**: the TMS and payment factory are legitimately managed, but the forecasting, anomaly, covenant, IC, FX, and working-capital *intelligence* is an own-it lakehouse that no single treasury-SaaS analytics module can replicate — because only the client's lakehouse fuses TMS + every ERP + debt + FX + spend + PortCo data into one owned source of truth.

**Where it sits** — Strategy (the synthesizing artifact); informs Architecture sequencing and the Business Case stack-ranking. Discovery (candidate intake).

**Evidence anchors** —
- The four-factor scoring is a method, not a benchmark; each use case's value cites its own pattern's Evidence anchors (fraud loss per TREAS-08, working-capital release per TREAS-15, covenant/debt cost per TREAS-13/14, etc.).
- The foundations-first sequencing is grounded in the empirical TMS-rollout failure modes (TREAS-01/02 anchors): connectivity and feed quality are the gating risks.

**Anti-patterns** —
- **Buying a forecasting/fraud module before the foundation exists** — modeling on incomplete bank/ERP data produces wrong numbers and breaks trust (TREAS-05).
- **Scoring on value alone** — ignoring control risk (lands an autonomous payment model in the SoD-failure trap, TREAS-08) or data readiness (sequences a use case the feeds can't support).
- **A portfolio of disconnected point vendors** — each holding its slice on its own cloud, none unifying the group's data, leaving the HoldCo with lock-in and no compounding owned asset; default to the own-it lakehouse and flag any point-vendor with surfaced rationale.
- **A portfolio with no spine** — use cases that don't tie back to liquidity certainty, loss avoidance, or cost of capital, leaving the CFO without a value narrative.

**Feeds artifacts** — Strategy (the use-case portfolio + sequenced roadmap — the primary artifact); Business Case (stack-ranked investment); Architecture (platform-over-point-vendors + foundations-first rationale); Mobilization (wave sequencing).

**Maturity** — production-ready.

---

## Composition note

A typical Lakeshore HoldCo treasury Move — e.g., "Treasury platform stabilization + liquidity-certainty + fraud-prevention" — composes:

```
DOMAIN (this pack):  TREAS-19 (portfolio — three spines, foundations-first)
                     TREAS-01/02/03/04 (rollout de-risk — the foundation)
                     TREAS-05 (adoption + trust)
                     TREAS-06/07/11 (forecasting + visibility — liquidity certainty)
                     TREAS-08/09 (fraud + sanctions — loss avoidance, with SoD guardrails)
                     TREAS-10 (IC auto-recon + netting)
                     TREAS-13/14 (covenant headroom + debt — cost of capital)
                     TREAS-12/15/16/17/18 (FX, working capital, bank fees, close, counterparty)
   ×
CROSS-CUTTING:       ARCH-01 (landing zone), INGEST (bank BAI2/MT940/camt + ERP feeds),
                     MODEL (entity master + canonical transaction + COA harmonization),
                     MLOPS (model serving + monitoring for forecast/anomaly/covenant models),
                     GOV (SoD + SOX evidence + sanctions provenance + payment controls),
                     FINOPS (value engineering of the liquidity + loss-avoidance + cost case)
   ×
ADJACENT DOMAIN:     COST (vendor/spend rationalization — shares the entity model TREAS-03,
                     COA harmonization TREAS-02, payment-terms leverage TREAS-15,
                     bank-relationship federation TREAS-16/18)
```

Two threads run through the whole pack. First, **rent the rails, own the intelligence**: the TMS and payment factory are legitimately managed, but every forecasting, anomaly, covenant, IC, FX, and working-capital model is an own-it asset on the client lakehouse, fusing data no single vendor spans. Second, the **control thread** — segregation of duties, human-in-the-loop, and SOX-auditability on every payment-touching pattern — is a hard constraint on TREAS-08/09, restated wherever money moves.

---

## Pattern selection by executive persona

Different finance executives own different value spines; a Move artifact should speak to the right owner for each pattern.

| Executive | Primary concern | Lead patterns |
|---|---|---|
| **Group Treasurer** | Liquidity certainty, cash visibility, the platform | TREAS-01, TREAS-06, TREAS-11, TREAS-05 |
| **CFO** | Cost of capital, covenants, the funding plan | TREAS-07, TREAS-13, TREAS-14, TREAS-15 |
| **Assistant Treasurer / Cash Manager** | Daily position, forecasting, pooling | TREAS-06, TREAS-11, TREAS-10, TREAS-12 |
| **VP / Director Treasury Operations** | Payments, fraud, bank fees, connectivity | TREAS-08, TREAS-01, TREAS-16, TREAS-17 |
| **Controller** | Close, reconciliation, IC, books-to-bank | TREAS-17, TREAS-10, TREAS-02 |
| **Chief Compliance Officer / SOX owner** | Payment controls, sanctions, SoD, audit | TREAS-08, TREAS-09, TREAS-13 (compliance certs) |
| **Head of Risk** | FX, interest-rate, counterparty risk | TREAS-12, TREAS-14, TREAS-18 |
| **PE Sponsor / Board** | Covenant headroom, liquidity runway, value creation | TREAS-13, TREAS-07, TREAS-15 |
| **CFO / Treasurer (strategy)** | The portfolio + the three spines | TREAS-19 (synthesizes all) |

The squint test for credibility: when the CFO asks "how much covenant headroom do we have and when does it get tight?" the artifact answers in *their* as-defined-EBITDA arithmetic (TREAS-13); when the treasurer asks "can I trust this cash position?" it answers with connectivity completeness and drill-to-source lineage (TREAS-01/05); when Compliance asks "how do we know an AI won't move money it shouldn't?" it answers with SoD, human-in-the-loop, and SOX evidence (TREAS-08). Generic AI language fails all three.

---

## Treasury operating calendar (orientation for the Move team)

HoldCo treasury value capture runs on a fixed operating cadence. A Move artifact's Mobilization plan should align to it; the platform must support each beat.

| Beat | Window | Patterns it drives |
|---|---|---|
| **Daily cash position** | Every business morning | TREAS-01, TREAS-11 (the position must tie to bank) |
| **13-week forecast refresh** | Weekly (lender/sponsor cadence) | TREAS-06 (forecast + variance loop) |
| **Payment runs** | Recurring (AP cycles, payroll) | TREAS-08, TREAS-09 (every run screened) |
| **Month-end close** | Monthly | TREAS-17, TREAS-10 (IC tie-out), TREAS-02 |
| **Covenant test / compliance certificate** | Quarterly (per credit agreement) | TREAS-13 (as-defined EBITDA, certificate) |
| **Lender / sponsor reporting** | Monthly/quarterly | TREAS-06, TREAS-07, TREAS-13 |
| **FX exposure review + hedge** | Per FX policy cadence | TREAS-12 |
| **Bank-relationship review / fee true-up** | Annual / semi-annual | TREAS-16 |
| **Refinancing / maturity planning** | Ahead of maturity wall | TREAS-07, TREAS-14 |
| **Treasury investment-policy review** | Periodic | TREAS-18 |

A recurring sequencing lesson: **the foundation patterns (TREAS-01–04) gate everything**. A forecast (TREAS-06), a covenant projection (TREAS-13), or a fraud model (TREAS-08) built before bank connectivity, ERP feeds, the entity model, and historical reconstruction are solid will produce wrong numbers and burn the treasurer's trust (TREAS-05) — after which the platform never wins. Sequence the foundation first; it is the single most important reason the own-it data approach beats bolting an analytics module onto an unstable feed.

---

## Provenance reminder

Per the pattern-pack discipline: every claim in a treasury Move artifact cites a TREAS pattern ID (plus the cross-cutting/adjacent IDs it composes with), every quantitative value cites a benchmark source or carries the "estimate — confirm with client data" flag, every solution choice states its own-it posture, and any rent-side choice carries surfaced rationale. The payment-control patterns (TREAS-08/09) additionally require the control anti-pattern to be cited explicitly as a rejected option — the artifact must show it chose segregation-of-duties + human-in-the-loop + SOX-auditability over autonomous money movement by design.
