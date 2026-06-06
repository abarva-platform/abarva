# Lakeshore Kyriba And Treasury Pattern Orientation

Created: 2026-06-05

Purpose: buyer-safe appendix for the Lakeshore success brief and MP4. This explains what Kyriba is, what AbarVa is trying to make successful, which finance and treasury doctrines are already modeled in the design package, and what still needs to be promoted into editable Lakeshore corpus rows before buyer reliance.

## Executive Read

Kyriba is a treasury management system. It is used for cash visibility, bank connectivity, payments, liquidity planning, cash forecasting, bank account management, risk, and treasury controls. For Lakeshore, Kyriba should not be treated as a software install or a generic AI use case. It should be treated as a finance-owned operating transformation that succeeds only if the bank, ERP, entity, cash, payment-control, intercompany, covenant, and adoption facts are correct before go-live.

AbarVa's role is to make the Kyriba program harder to fool. It turns rollout risk into named gates, evidence artifacts, owners, decision forks, and value proof. Move 0 is the Kyriba de-risk foundation. Move 1 is AI on top of treasury, but only after the foundation is clean enough for AI to be useful.

## Loaded / Modeled Truth

The current buyer brief cites the live global corpus baseline as 8,987 published patterns with search document IDs and 27,052 relationships. The Lakeshore-specific Kyriba and treasury doctrine is currently modeled across the corpus master prompt, Lakeshore success brief, and federated Move 0 design package. A local Lakeshore JSONL corpus folder was not present in this workspace during this pass, so the next corpus step is to promote these modeled doctrines into editable, reviewable Lakeshore corpus rows with explicit owners, evidence links, and confidence.

This distinction matters. The demo can show the intelligence direction today; before buyer reliance, Lakeshore should be able to edit, approve, reject, or localize the underlying treasury patterns.

## What AbarVa Is Trying To Make Successful

The goal is not "implement Kyriba." The goal is a board-grade treasury operating layer:

- Daily cash position is reliable before market open.
- Bank connectivity and payment rails are known before the SI schedule is committed.
- ERP, AP, AR, and GL feeds reconcile with defined variance thresholds.
- Entity, bank account, signer, and intercompany structures are canonical.
- Forecasting starts from usable historical cash data, not optimistic model demos.
- Covenant exposure is forecasted early enough for CFO action.
- Payment controls reduce BEC and first-time-payee risk.
- Adoption is visible by role, so treasury does not quietly fall back to Excel.
- Value proof separates forecast, approved, negotiated, and finance-attested savings.

## Treasury Pattern Inventory To Promote

| Pattern handle | Current modeled doctrine | Failure mode if weak |
|---|---|---|
| Daily cash pre-walk | Treasurer pre-walks the consolidated cash position by 9am Central even when Kyriba has automated bank feeds. | CFO sees stale or unexplained cash, and treasury loses credibility during a liquidity event. |
| Surprise reconciliation rule | Material cash surprises are reconciled same day, with a stricter threshold for covenant-sensitive or acquisition-close periods. | Variance explanations drift into month-end cleanup and become board/audit issues. |
| Bank inventory and connectivity matrix | Every bank, account, entity, format, payment rail, portal dependency, H2H/SWIFT readiness, signer, and owner is inventoried before sequencing. | Kyriba go-live is delayed by hidden bank connectivity work. |
| Critical-bank-first sequencing | High-balance and high-payment-volume banks get connectivity priority; tail banks are contained instead of blocking the entire rollout. | The program burns months solving low-value edge banks while major cash remains manual. |
| Banking consolidation Source event | Fragmented banking creates a Source opportunity for fee, services, account, and connectivity rationalization. | Treasury automates a messy estate instead of reducing it. |
| ERP/AP/AR/GL feed scorecard | Feeds are scored for completeness, timing, mapping quality, reconciliation variance, owner, and remediation plan. | Kyriba receives data that looks automated but does not reconcile. |
| Cash-vs-GL variance discipline | The Move 0 design package models a demo gap of 0.41% variance against a tighter target such as less than 0.05% for production-grade feeds. | Controllers distrust the treasury platform and return to spreadsheets. |
| Canonical entity registry | HoldCo, PortCo, trust, family-office, bank-account, intercompany, and reporting hierarchy are loaded once from authoritative secretary/tax/finance sources. | Intercompany eliminations, account ownership, and treasury rollups break. |
| Intercompany lending documentation | Loans need note terms, rate basis, approval trail, monthly true-up, tax/accounting treatment, and cash movement evidence. | Treasury creates tax, audit, and covenant ambiguity. |
| Historical cash reconstruction | Bank statements and position history should be reconstructed into normalized entity-currency-day records before forecasting. | Predictive cash forecasting is trained on thin or distorted history. |
| Forecasting entry gate | AI forecasting waits until bank, feed, entity, and historical cash gates are sufficiently clean. | The AI story moves faster than the data foundation and produces weak forecasts. |
| Covenant forecast pack | Leverage, fixed-charge coverage, liquidity thresholds, TTM EBITDA, add-backs, and 12-week liquidity visibility are tied to treasury data. | Covenant risk appears too late for CFO action. |
| Payment-control doctrine | Wire matrix, first-time-payee callback, dual approval, bank portal controls, BEC incident history, and payment limits are loaded and tested. | Treasury modernization increases fraud surface instead of reducing it. |
| Adoption and Excel-elimination | Role dashboards, login/use metrics, training completion, unresolved exceptions, and 30-day Excel-elimination sprints are tracked. | Users keep Kyriba as a reporting wrapper while real work stays in Excel. |
| Cash pooling and tax consequences | Sweeps, pooling, concentration accounts, intercompany loans, and transfer-pricing consequences must be reviewed before automation. | Cash optimization creates tax or legal exposure. |
| FX and ASC 815 clarity | Natural hedges, forwards, accounting designation, hedge documentation, and board reporting are captured where relevant. | Treasury risk treatment is misunderstood by finance and audit. |
| Bank connectivity protocols | H2H, SWIFT, BAI2, MT940/MT942, EBICS, portal-only exceptions, onboarding duration, and bank owner are explicit. | The team discovers late that the bank path is not technically or contractually ready. |
| Board-grade treasury pack | No realized value is claimed until finance accepts the evidence chain; forecast, approved, negotiated, and realized values remain separate. | The renewal story relies on unprovable savings. |

## The Six Kyriba Failure Modes AbarVa Should Surface Early

| Failure mode | What goes wrong | AbarVa artifact |
|---|---|---|
| Bank connectivity stalls | H2H/SWIFT/API readiness is discovered bank by bank after the project is already committed. | Bank inventory and connectivity matrix; critical-bank sequencing; banking consolidation Source event. |
| ERP feed quality breaks reconciliation | AP, AR, GL, and cash feeds technically load but do not reconcile reliably. | Feed scorecard, variance log, remediation owners, and pass/fail gate. |
| Entity hierarchy is wrong | HoldCo/PortCo, trust, intercompany, and account structures are loaded inconsistently. | Canonical entity and bank-account registry with one-shot reload criteria. |
| Forecasting lacks usable history | The team tries to sell predictive cash forecasting without enough clean historical position data. | Bronze bank statement archive and Silver entity-currency-day position table. |
| Adoption falls back to Excel | Treasury users log in for status meetings but run real work through spreadsheets and bank portals. | Role dashboard, usage telemetry, training plan, and Excel-elimination sprint. |
| Intercompany and covenants stay manual | Month-end IC journals and covenant calculations remain disconnected from treasury data. | Intercompany loan pack, covenant forecast pack, board-grade treasury evidence pack. |

## What Needs To Be Loaded For Lakeshore

Before the first serious Kyriba steering decision, Lakeshore should load or validate:

- Banking matrix: banks, accounts, balances, entities, services, fees, signers, connectivity formats, and payment rails.
- Finance systems: ERP, AP, AR, GL, EPM, treasury workarounds, feed owners, and known reconciliation issues.
- Entity registry: HoldCos, PortCos, trusts, management companies, intercompany notes, tax ownership, and reporting hierarchy.
- Historical cash: 12-24 months of bank statements or position history normalized by entity, currency, bank, and account.
- Treasury controls: wire policy, approval matrix, first-time-payee callbacks, BEC controls, bank portal access, and exception log.
- Covenant documents: credit agreements, definitions, EBITDA add-back rules, liquidity thresholds, and reporting cadence.
- Adoption plan: user roster, role mapping, training plan, expected dashboards, Excel workarounds to eliminate, and weekly usage metrics.

## Buyer-Safe Gap List

These items should be explicit before the demo is positioned as a buyer-reliance package:

- Promote the modeled Kyriba and treasury doctrines into editable Lakeshore corpus rows.
- Attach each row to a source artifact, owner role, decision artifact, failure mode, and confidence.
- Load actual or approved synthetic Lakeshore bank matrix, ERP extract inventory, entity registry, wire policy, covenant agreements, and SI/Kyriba plan artifacts.
- Re-run CXO hard-question QA against the loaded Lakeshore context and score whether the agent cites the right artifacts.
- Label every screen and answer as seeded demo, synthetic but loader-backed, or live-loader-backed.
