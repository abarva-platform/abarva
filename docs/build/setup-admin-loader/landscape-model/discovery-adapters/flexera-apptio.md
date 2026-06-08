# Adapter: Software / License & TCO (Flexera, Snow, Apptio)

> **Owner:** Procurement / Vendor Management (with Applications). **Primary
> target:** L2 application **attributes** (license counts, true-up,
> `annual_tco_usd`) and the **vendor spine**. **Mode:** **ENRICH / MERGE — does
> NOT create new L2 entities.** **Natural key:** normalized `vendor + product`.

This adapter is structurally different from the others: Flexera/Snow (Software
Asset Management) and Apptio (Technology Business Management / TCO) describe
**facts about applications and vendors that already exist** in the estate. They
add license, spend, and true-up data to L2 entities that ServiceNow / Epic /
portfolio adapters created. If an enrichment row matches no existing entity, the
default is **review-required**, not silent creation (model §4 merge semantics).

---

## 1. What the exports look like

### 1a. Flexera (FlexNet Manager) / Snow License Manager — SAM

- **Installed software inventory:** rows of `Application` / `Title`,
  `Publisher`/`Manufacturer`, `Version`/`Edition`, `Installations` (count),
  `Devices`, sometimes `Category`.
- **License position / compliance report:** `Product`, `Publisher`,
  `Entitlements` (owned), `Consumed`/`Used`, `Compliance` (compliant /
  over-deployed / under-deployed), `License metric` (per-core, per-user, …),
  `True-up` exposure, `Maintenance/Support end`.
- Signature: `Publisher` + `Entitlements`/`Consumed` + `Compliance` columns;
  Flexera reports often include `Edition` and `License metric`.

### 1b. Apptio (Cloudability / Costing / TBM) — TCO

- **Application TCO / cost report:** `Application` (or business service),
  `Total Cost` / `Annual Cost`, with cost-tower breakdown columns (`Compute`,
  `Storage`, `Software/License`, `Labor`, `Facilities`, `Outside Services`),
  `Cost Center`, `Fiscal Year`.
- Signature: an `Application`/`Service` column + multiple cost-tower columns +
  a `Total`/`Annual Cost`; fiscal-year scoping.

Both are **per-row enrichment** files keyed by an application/product name and a
publisher/vendor.

---

## 2. Column-mapping table

### 2a. Flexera/Snow → L2 license attributes + vendor spine

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `Application`/`Title`/`Product` | (match key) → `l2.product` | L2 (match) | `norm()` → natural-key product token |
| `Publisher`/`Manufacturer` | (match key) → `l2.vendor` + vendor spine | spine (match) | `norm()` → canonical vendor |
| `Version`/`Edition` | `l2.version` (refine) | L2 | `1:1`; helps disambiguate product |
| `Installations`/`Consumed`/`Used` | `l2.license_consumed` | L2 | `1:1` (integer) |
| `Entitlements`/`Owned`/`Purchased` | `l2.license_entitled` | L2 | `1:1` |
| `License metric` | `l2.license_metric` | L2 | `lookup{per_core, per_user, per_device, subscription}` |
| `Compliance`/position | `l2.license_position` | L2 | `lookup{compliant, over_deployed, under_deployed}` |
| `True-up`/exposure ($) | `l2.true_up_exposure_usd` | spine | `unit()` currency |
| `Maintenance/Support end` | vendor spine `support_end` / renewal | spine | date parse |
| `User count`/`Devices` | `l2.user_count` (corroborate) | L2 | `1:1` (cross-check, not authoritative) |

### 2b. Apptio → L2 TCO + ops/finance spine

| Source column | Canonical field | Layer | Transform |
|---|---|---|---|
| `Application`/`Service` | (match key) → `l2.product` | L2 (match) | `norm()` |
| `Total Cost`/`Annual Cost` | **`l2.annual_tco_usd`** | L2 | `unit()` currency; **authoritative TCO** |
| `Compute` (tower) | `l2.tco_compute_usd` | L2 detail | `unit()` |
| `Storage` (tower) | `l2.tco_storage_usd` | L2 detail | `unit()` |
| `Software/License` (tower) | `l2.tco_software_usd` | L2 detail | `unit()` |
| `Labor`/`Support` (tower) | `l2.tco_labor_usd` | L2 detail | `unit()` |
| `Facilities`/`Outside Svc` | `l2.tco_other_usd` | L2 detail | `unit()` |
| `Cost Center` | ops/finance spine `cost_center` | spine | `1:1` |
| `Fiscal Year` | `l2.tco_fiscal_year` (scope) | L2 | `1:1` — scopes the TCO figure |

---

## 3. Natural key & merge behavior (model §4)

- **Natural key = `norm(publisher/vendor) + "|" + norm(product)`** — identical to
  the ServiceNow L2 key, by design, so enrichment lands on the right app.
- **Merge, never create:** an incoming row matches an existing L2 entity → attach
  attributes with per-source provenance ("license_consumed from Flexera export X;
  annual_tco_usd from Apptio FY26 report Y").
- **No match → review-required:** Flexera "installed software" inventories are
  noisy (drivers, utilities, freeware). A row with no matching L2 app does **not**
  auto-create one. The Steward asks: "Flexera lists `Adobe Acrobat` with 1,200
  installs — promote to a tracked application, or ignore as endpoint software?"
- **Apptio app names** are often *business-service* names ("Payroll") not
  vendor+product ("Workday HCM") → fuzzy match + Steward confirm when below
  threshold.

---

## 4. Review-required ambiguities (what the Steward asks)

1. **No matching L2 entity** (§3) — promote or ignore. This is the primary gate
   that keeps Flexera noise out of the application portfolio.
2. **Apptio business-service vs application granularity.** One Apptio "Application"
   row may aggregate several L2 apps (cost rolled up), or one L2 app may split
   across Apptio services. Flag mapping cardinality ≠ 1:1.
3. **TCO scope & fiscal year.** Confirm the `Total` is fully-loaded TCO for the
   stated FY and currency; reconcile against any partial cost from ServiceNow
   (`cost`) — Apptio wins, but note the conflict.
4. **License-metric semantics.** per-core vs per-user vs per-processor materially
   changes compliance math; if the metric column is absent, true-up cannot be
   trusted → flag.
5. **Publisher normalization conflicts.** "Microsoft Corporation" vs "Microsoft"
   vs "MSFT" must collapse to one vendor; below-threshold → ask.
6. **Stale / multiple report periods.** Flexera position and Apptio TCO are
   period-scoped; loading two periods must not double-count — keep latest, retain
   history with provenance.
7. **Over-deployment is a finding, not just data.** `over_deployed` / true-up
   exposure should surface as a Steward/Sentinel finding (compliance risk), not be
   buried as an attribute.

---

## 5. Illustrative sample

**Source A — Flexera license position (abbreviated):**

| Product | Publisher | Edition | Entitlements | Consumed | License metric | Compliance | True-up |
|---|---|---|---|---|---|---|---|
| Database Enterprise Edition | Oracle | Enterprise | 64 | 88 | Processor (core) | Over-deployed | $1,420,000 |

**Source B — Apptio app TCO (FY26, abbreviated):**

| Application | Compute | Storage | Software/License | Labor | Total Cost | Cost Center | Fiscal Year |
|---|---|---|---|---|---|---|---|
| Oracle Database (EBS) | 480,000 | 120,000 | 1,900,000 | 650,000 | 3,150,000 | IT-DATA | FY26 |

**Mapped (both enrich the *same* existing L2 entity `oracle|database`):**

- Flexera → on L2 `oracle|database`: `license_entitled:64`,
  `license_consumed:88`, `license_metric:per_core`,
  `license_position:over_deployed`, `true_up_exposure_usd:1,420,000`. Over-deploy
  raised as a **compliance finding**. Vendor spine: `Oracle`, support data.
- Apptio → on the same L2: `annual_tco_usd:3,150,000` (FY26, **authoritative**),
  towers `tco_compute:480k / tco_storage:120k / tco_software:1.9M /
  tco_labor:650k`, `cost_center:IT-DATA`. If ServiceNow had a partial `cost`,
  Apptio's total supersedes it with a recorded conflict.
- Neither row **creates** an entity; both merge onto the Oracle DB app ServiceNow
  already loaded (key `oracle|database`).

---

## 6. Reviewer sanity-check notes

A reviewer with real Flexera/Snow/Apptio experience should verify:

- The **product-name normalization** between Flexera titles, Apptio service
  names, and ServiceNow CI names actually converges to the same
  `vendor+product` key — this is the whole game. Vendor product naming is
  notoriously inconsistent ("Oracle DB EE" vs "Database Enterprise Edition" vs
  "Oracle RDBMS").
- That **Apptio `Total Cost` is the fully-loaded TCO** the customer intends as
  `annual_tco_usd` (some Apptio models report run-cost only, excluding project
  capex/labor) and the **fiscal-year/currency** scope.
- The **license-metric** interpretation — per-core counting (with core factors),
  per-named-user, etc. — before trusting any compliance/true-up figure.
- That this adapter is wired as **enrich-only**: a reviewer should confirm Flexera
  endpoint-software noise does not inflate the L2 application count.
- Period handling — that loading successive Flexera/Apptio reports updates rather
  than duplicates the figures.
