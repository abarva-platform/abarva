# Modernization Pattern Pack — Industry Estate Profiles (2026-06-03)

Companion to `MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md` (v2). The framework is identical across
industries — Databricks Well-Architected 7 pillars, the 7 R's dispositions, the fixed/variable
decomposition, the rate-card baseline, and the weighted RFP scorecard. **What changes per industry**
is only: (1) the legacy source-system estate, (2) the default dispositions, (3) the compliance
regime, and (4) the AI use-case genome anchor (already in corpus). These profiles make the pack a
reusable product, not a PHS one-off.

Healthcare (PHS) is the anchor profile in the v2 spec. Below are **Retail (Apex)** and **Airline
(SkyHarbor)**.

---

## A. Retail — anchor tenant: Apex Retail

**Shape of the estate:** omnichannel + streaming-heavy. The pain is siloed customer/product/
inventory data across many channels and a sprawl of legacy ERP/merchandising/supply-chain platforms
never designed for real-time inventory or AI personalization.

| Source archetype | Default disposition | Target (medallion) | Notes |
|---|---|---|---|
| **POS / store transactions** | Re-architect | Bronze (batch + near-real-time) | High volume; per-store reconciliation. |
| **E-commerce / mobile / clickstream** | Re-architect | Bronze (streaming, Auto Loader) | Event streams; sessionization in Silver. |
| **Merchandising / ERP** | Replatform | Silver/Gold | Item master, pricing, assortment — conformed dims. |
| **WMS / TMS (supply chain)** | Replatform | Silver/Gold | Inventory positions, shipments; streaming status. |
| **Loyalty / CRM / CDP** | Re-architect | Gold (customer 360) | Identity resolution; the personalization spine. |
| **Marketing / vendor / marketplace feeds** | Replatform | Bronze→Silver | Many external feeds; schema drift. |
| **Legacy ETL (Informatica/batch) + marts + BI** | Replatform/repoint | DLT + Gold + repoint BI | Same B–F archetypes as the core framework. |
| **RFID / IoT / payment events** | Re-architect | Bronze (streaming) | Real-time inventory + fraud signals. |

**Compliance regime:** **PCI-DSS** (payment data — tokenization, scope minimization), **CCPA/GDPR**
(consumer privacy, consent, right-to-delete), often **SOX** for financial reporting. Folds into the
Security + Governance pillars.

**Estimation nuances:** streaming + omnichannel volume inflates Bronze/Silver effort; identity
resolution for the CDP/customer-360 is a high-complexity Gold workstream; "retire" applies heavily
(dead departmental marts/reports). Migration stream is large (keep merchandising/finance reporting
running); greenfield is rich.

**AI use-case genome anchor (already in corpus):** contact center AI, CDP/personalization, store-
associate productivity, demand forecasting + markdown/inventory optimization, supply-chain
visibility. → the greenfield stream.

---

## B. Airline — anchor tenant: SkyHarbor Air

**Shape of the estate:** real-time + safety-critical + a hard mainframe core. The reservation/PSS
core (often mainframe TPF-class) is frequently **not** migrated — it's the system of record the
analytics layer feeds *off*, like Epic Clarity in healthcare.

| Source archetype | Default disposition | Target (medallion) | Notes |
|---|---|---|---|
| **PSS / reservations (mainframe)** | **Retain / relocate** (rarely re-architect) | Bronze feed off it (CDC) | Treat as authoritative SoR; extract, don't migrate the core. |
| **Revenue management** | Re-architect | Silver/Gold | easyJet pattern: replace legacy SQL Server analytical store with Delta. |
| **Crew / operations** | Re-architect | Bronze (streaming) | Real-time crew/flight signals (JetBlue pattern). |
| **MRO / maintenance** | Replatform → re-architect | Silver/Gold | Predictive-maintenance feed; sensor + work-order data. |
| **Flight ops / airport ops** | Re-architect | Bronze (streaming) | Flight status, gate, turnaround; air-traffic feeds. |
| **Loyalty / FFP** | Replatform | Gold (customer 360) | Frequent-flyer; tier + redemption. |
| **Fuel** | Replatform | Silver/Gold | Consumption + price optimization. |
| **Legacy ETL (Alteryx/batch) + marts + BI** | Replatform/repoint | DLT + Gold + repoint BI | Major-airline pattern: hundreds of Alteryx workflows powering RM/ops — high-risk to migrate. |

**Compliance regime:** **safety + aviation regulation** (FAA / EASA / IATA), data residency, **PCI**
(payments), privacy. Safety-critical lineage raises the Reliability + Governance pillar bars.

**Estimation nuances:** the **retain the PSS core** decision dramatically changes scope (you're
building the analytics lakehouse off it, not migrating reservations); real-time/streaming ops is a
large Bronze workstream; Alteryx/legacy-workflow sprawl is a high-risk replatform stream (the V4C/
major-airline "250+ workflows" pattern); safety-critical data quality + reconciliation is non-
negotiable.

**AI use-case genome anchor (already in corpus — the SkyHarbor overlay):** revenue/commercial +
dynamic pricing, loyalty, flight ops, aircraft/MRO predictive maintenance, airport ops/turnaround,
fuel optimization, disruption management, crew optimization. → the greenfield stream.

---

## C. Cross-industry summary — what's constant vs what varies

| | Healthcare (PHS) | Retail (Apex) | Airline (SkyHarbor) |
|---|---|---|---|
| Authoritative SoR to **retain** | Epic Clarity | ERP / merchandising master | PSS / reservations (mainframe) |
| Dominant ingestion mode | Batch (Clarity/Caboodle) + FHIR | Streaming-heavy (clickstream/IoT) | Real-time ops + mainframe CDC |
| Hardest workload | SAS | Customer-360 identity resolution | Mainframe extract + Alteryx sprawl |
| Compliance | HIPAA / HITRUST | PCI / CCPA / GDPR / SOX | FAA / IATA / PCI / residency |
| Customer-360 spine | Patient 360 | Customer 360 (CDP) | Passenger 360 (FFP) |

**Constant across all three:** the medallion target, the Well-Architected 7 pillars, the 7 R's
dispositions, Lakebridge/BladeBridge automation leverage, the fixed/variable estimate decomposition,
the rate-card baseline, and the weighted RFP scorecard. That constancy is the product: one
modernization engine, three (and more) industry estate profiles.

---

## D. Sources (verified 2026-06-03; Codex to confirm currency)

- Retail: Databricks — *What is Lakehouse for Retail*; retail data-modernization guides (POS/ERP/
  WMS/TMS/loyalty/CDP estate; batch + streaming ingestion); Informatica→Databricks retail batch
  modernization.
- Airline: Databricks — *easyJet* (replace legacy SQL Server analytical store with Delta; Lakebase),
  *JetBlue* (real-time flights/crew/maintenance), *Dynamic Pricing in Airlines*; major-airline
  Alteryx workflow modernization (V4C); aviation data-modernization (Mphasis/CGI).
- Framework + healthcare sources: see `MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md` §8.
