# SkyHarbor AMS — Governed Deliverables (WS8)

Best-in-class AMS sourcing deliverables generated **only from governed evidence** for SkyHarbor Air — agent_ready, tenant-scoped, retrieved from Azure AI Search (`tenant-context-v1`), gated through `governed_object_readiness`, drafted by `claude-opus-4-7` constrained to the bundle. Citation-backed (`[chunk_id]`), missing evidence visible, no fabricated benchmarks/rates. Generated 2026-06-10 in a VNet ACA job.

- **Governed bundle:** 56 agent_ready chunks across families — vendor 8 · financial 8 · SLA 8 · apps 8 · infra 8 · org 8 · incidents 8
- **Known missing AMS evidence families (stated in deliverables, never invented):** ticket_volumes (L1/L2/L3 volumes); transition_constraints; retained_org_model; tooling_landscape (productivity baseline)
- **Discipline check:** every factual claim carries a `[chunk_id]` citation; gaps marked `EVIDENCE MISSING/BLOCKED`; pricing memo uses only real contract values (no market benchmarks fabricated).

| Deliverable | citations | EVIDENCE-MISSING markers |
|---|---|---|
| AMS Sourcing Event Brief | 21 | 1 |
| AMS Sourcing Strategy Memo | 30 | 0 |
| AMS RFP (tower-structured draft) | 65 | 1 |
| Vendor Discussion Guide | 16 | 1 |
| Pricing & Negotiation Intelligence Memo | 25 | 0 |
| Executive Recommendation (draft) | 17 | 1 |

> Note: deliverables are draft, citation-backed governed output for a synthetic tenant; weak/blocked sections are labeled. They demonstrate the governed Source path producing event-specific, evidence-bound AMS artifacts — not generic LLM text.


---

# AMS Sourcing Event Brief

# AMS Sourcing Event Brief — SkyHarbor Air

## 1. Objective
Re-compete and restructure SkyHarbor's Application Management Services (AMS) portfolio ahead of the FY2027 strategic-vendor renewal cliff, with the goals of (a) reducing run-rate cost against the FY2026 Application Mgmt / Software & License budget of $56.96M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0], (b) stabilizing chronically underperforming service availability across multiple towers, and (c) introducing AI-delivery and data-rights protections that are largely absent from the current contract base.

## 2. Scope Summary (Towers / Estate)
In-scope AMS towers and supporting estate evidenced in the bundle:

- **Application Management** — primary spend pool, FY26 budget $56.96M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0].
- **Mainframe** — bundled inside IBM strategic deal [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0]; SLA target 99.9% / actual 96.33% [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0].
- **Integration** — FY26 budget $2.32M (S/W) + $21.06M (telecom) [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0165:c0][ctx:skyharbor-air:it_financials:it-financials-csv-fin-0168:c0]; SLA actual 99.43% (only tower near target) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0].
- **Data & Analytics** — FY26 labor $13.02M + depreciation $7.67M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0134:c0][ctx:skyharbor-air:it_financials:it-financials-csv-fin-0139:c0]; estate includes 8 Teradata IntelliFlex appliances across DC-East, DC-West (DR), and Colo-Hub-A, four of which are "aging" lifecycle [ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0284:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0288:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0290:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0292:c0].
- **Adjacent towers carried in the SLA register** (Compute, Storage, Network, Security, Service Desk, Telecom) — all materially missing 99.9% targets; relevant to bundling decisions.

EVIDENCE MISSING: application portfolio inventory (count, criticality tiering), ticket_volumes (L1/L2/L3), tooling_landscape (productivity baseline), retained_org_model, transition_constraints.

## 3. Incumbent / Vendor Landscape
**Strategic AMS incumbents (~$400M/yr combined):**
- IBM Global Services — $280M, AMS + mainframe, renewal 2027-12-31, 6mo notice, no AI clauses [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0].
- Accenture — $120M, App modernization + AMS, renewal 2027-03-31, 6mo notice, vendor-hosted data, no AI clauses [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0].

**Niche / specialist AMS layer (~$96M/yr aggregate):** Helios Technologies $17.4M [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0], Summit Cloud $16.97M [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0], Helios Systems $15.7M [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0], Apex Cloud $13.4M [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0], Helios Software $13.05M [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0], Summit Software $12.0M [ctx:skyharbor-air:it_financials:


---

# AMS Sourcing Strategy Memo

# AMS Sourcing Strategy Memo — SkyHarbor

**To:** CIO, CFO, CPO (Procurement), VP IT Service Management
**From:** IT Sourcing Transformation
**Re:** AMS retain-vs-outsource posture, productivity glide-path, transition, and buying motion
**Classification:** Internal — governed-evidence basis

---

## 1. Situation

SkyHarbor's AMS estate is dominated by two strategic suppliers — IBM Global Services at $280M/yr (AMS + mainframe managed services) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0] and Accenture at $120M/yr (App modernization + AMS) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0] — supplemented by a long tail of niche AMS, staff-aug, and support contracts ranging ~$2M–$17M each [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0048:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0077:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0094:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0097:c0]. AMS run cost in the FY26 budget book is $56.96M in Application Mgmt / Software & License alone [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0].

The operating reality undermines the spend posture: **every measured tower is breaching its 99.9% availability target**, with Service Desk at 93.35% (5 breaches, $767K credit-at-risk) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0055:c0], Telecom at 91.63% (6 breaches, $771K) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0], Network at 90.47% ($554K) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0], Compute at 92.97% (6 breaches) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0], Mainframe at 96.33% [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0], Storage at 95.72% [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0], Security at 95.44% [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0], and Integration only marginally passing at 99.43% but with $1.03M credit-at-risk [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0]. Aggregate credit-at-risk across these eight services exceeds **$4.8M**, and the sampled incident set is dominated by P1/P3/P4s caused by **change** [ctx:skyharbor-air:it_landscape:incidents-csv-inc-00065:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00075:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00154:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00267:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00338:c0] — i.e., the AMS partners' own release/change discipline is the failure mode, not demand spikes. Additionally, none of the major AMS contracts contain AI clauses [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0], and several are auto-renew with weak exit posture [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0].

**Implication:** SkyHarbor is paying strategic-partner prices for sub-commodity outcomes, with no productivity, AI, or change-quality protection in contract. The renewal calendar (Helios Systems 09/2026, Beacon 09/2026, Accenture 03/2027, IBM 12/2027) gives a usable 12–24 month re-papering window.

---

## 2. Retain-vs-Outsource Posture by Tower

| Tower | SLA actual vs 99.9% | Current posture | Recommended posture | Rationale (evidence) |
|---|---|---|---|---|
| **Mainframe** | 96.33%, 1 breach, $312K at risk | Outsourced to IBM under $280M bundle | **Retain outsourced — but unbundle from AMS** and re-paper as a discrete managed service with hard exit | Mainframe is non-differentiating, scarce-skill; IBM is the rational provider, but


---

# AMS RFP (tower-structured draft)

# SkyHarbor Application Management Services (AMS) RFP

Prepared for: SkyHarbor Air — IT Sourcing & Vendor Management
Document type: Request for Proposal, tower-structured AMS

---

## 1. Executive Overview

SkyHarbor Air is competitively sourcing a multi-tower Application Management Services (AMS) engagement to consolidate a fragmented incumbent footprint, restore SLA performance, and embed productivity and automation commitments into the run cost base. The current AMS-adjacent supplier portfolio is concentrated in two strategic primes — IBM Global Services at $280M/yr covering AMS + mainframe managed services [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0] and Accenture at $120M/yr covering application modernization + AMS [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0] — supplemented by a long tail of niche AMS, staff augmentation, and license vendors (Helios, Summit, Beacon, Vertex, Apex, Northwind families) totaling well over $150M/yr in additional annualized commitments [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0048:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0054:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0109:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0067:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0077:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0094:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0097:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0108:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0118:c0].

The FY2026 Application Management / Software & License run budget is $56.96M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0]. Across the eight in-scope service towers, every single SLA is currently in breach versus its 99.9% availability target, with credit-at-risk exposure exceeding $4.8M in the measured window [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0055:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0]. Change-induced P1 incidents are a recurring failure mode [ctx:skyharbor-air:it_landscape:incidents-csv-inc-00065:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00075:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00154:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00267:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00338:c0].

SkyHarbor expects bidders to (a) take resource-unit-priced accountability for the towers below, (b) commit to year-over-year productivity, (c) absorb transition risk on a fixed-fee basis, and (d) operate under buyer-owned data terms with explicit AI/no-train protections — improving on the current portfolio where most strategic and specialist contracts carry no AI clauses [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0].

---

## 2. Scope of Services by Tower

The engagement is structured into the following towers, aligned to SkyHarbor's SLA register [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0055:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0]:

- **Mainframe AMS** — application support, batch operations, and incident/problem/change for mainframe-resident workloads currently managed under the IBM strategic contract [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0][ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0].
- **Compute AMS** — L2/L3 application support for compute-hosted apps [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0].
- **Storage AMS** — application-layer storage support and Teradata appliance estate support (current and aging units across DC-East, DC-West, Colo-Hub-A) [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0281:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0282:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0284:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0285:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0288:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0289:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0290:c0][ctx:skyharbor-air:infrastructure:infrastructure-estate-csv-teradata-0292:c0].
- **Network AMS** — application-affecting network support; SLA actual 90.47% is the worst-performing availability metric in the estate [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0].
- **Security AMS** — application security operations, vulnerability remediation tracking; co-owned with the Security VP organization [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0][ctx:skyharbor-air:org_structure:org-roles-csv-org-0018:c0][ctx:skyharbor-air:org_structure:org-roles-csv-org-0023:c0].
- **Service Desk AMS** — application-aware L1/L2 support [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0055:c0].
- **Telecom AMS** — application integration with telecom services [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0].
- **Integration AMS** — middleware, APIs, and integration platform application support [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0].

EVIDENCE BLOCKED: ticket_volumes — per-tower L1/L2/L3 volume splits are not in the bundle; bidders will receive these in a follow-on data room release.

---

## 3. Current-State Context (Volumes, Cost, SLA)

**Cost baseline (FY2026 budget, run):**
| Segment | Annual USD | Source |
|---|---|---|
| Application Mgmt / Software & License | $56,963,487 | [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0] |
| Storage / Software & License | $21,379,677 | [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0102:c0] |
| Network / Hardware | $13,033,618 | [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0108:c0] |
| Data & Analytics / Labor (internal) | $13,016,528 | [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0134:c0] |
| Data & Analytics / Depreciation | $7,670,660 | [ctx:skyharbor-air:it_financials:it-financials-


---

# Vendor Discussion Guide

# SkyHarbor AMS Vendor Discussion Guide

**Audience:** AMS bidders (incumbent IBM Global Services [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0], Accenture [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0], and challengers)
**Purpose:** Structured Q&A to pressure-test vendor proposals before commercials are exchanged. Use the "do not reveal" notes to protect SkyHarbor's negotiating posture — particularly our SLA breach exposure and the fact that AMS is our largest single application cost line at $56.96M/yr [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0].
**Note on evidence gaps:** Several topics depend on inputs we do not yet have governed (ticket_volumes, transition_constraints, retained_org_model, tooling_landscape). Where relevant, we flag these as items the vendor must size against assumptions — not as data we will hand over in this round.

---

## 1. Tower Delivery Model

**Context for the team:** Today we run a concentrated AMS footprint — IBM Global Services at $280M/yr covering AMS + mainframe [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0] and Accenture at $120M/yr covering app modernization + AMS [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0], plus a long tail of niche-AMS players (Helios, Summit, Beacon, Apex, Vertex, Northwind — see vendor list). Total budgeted Application Mgmt / Software & License line is $56.96M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0].

**Ask:**
1. Propose your tower construct for SkyHarbor — single AMS tower vs. split by domain (mainframe, integration, data, digital). How does your model handle the mainframe-adjacent scope currently bundled with IBM [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0]?
2. How would you absorb or interlock with the niche-AMS vendors we retain (e.g., Helios Technologies, Summit Software, Beacon Systems, Apex Cloud, Helios Software, Vertex Technologies)? Prime-sub, multi-sourcing, or rationalization?
3. What is your governance model across towers — single service integrator, or per-tower accountability?
4. How do you partition responsibility between AMS and the modernization/transformation backlog?

**Probe:**
- Push for named org chart at tower-lead and SDM level, not generic role titles.
- Test whether they assume they will displace the niche vendors or coexist — pricing implications are very different.
- Ask how they would handle the Integration tower specifically — it spans $2.32M software + $21.06M telecom-linked spend [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0165:c0][ctx:skyharbor-air:it_financials:it-financials-csv-fin-0168:c0] and has the largest SLA credit-at-risk pool at $1.03M [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0067:c0].
- Probe for hidden assumptions about retained-org size.

**Do NOT reveal yet:**
- That we are actively considering displacing IBM (renewal not until 2027-12-31 [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0]) — keep optionality.
- The full niche-vendor list and their renewal dates — let bidders surface what they know.
- Our preferred tower count or whether we want a single SI.

---

## 2. Resource Units & Shift Coverage

**Context for the team:** **EVIDENCE MISSING: ticket_volumes (L1/L2/L3 volumes by tower/app).** We cannot share a baseline because we do not have one governed. Vendors must price against their own assumptions, which we will then normalize.

**Ask:**
1. What resource-unit (RU) construct do you propose — per-ticket, per-app-supported, per-FTE-equivalent, or outcome-based? Why for SkyHarbor specifically?
2. Describe your shift-coverage model: follow-the-sun, 24x7 on-shore + offshore blend, on-call rotations. What coverage do you assume for P1s given our incident pattern (multiple P1s with change-related root cause — INC-00065, INC-00075, INC-00154, INC-00267, INC-00338 [ctx:skyharbor-air:it_landscape:incidents-csv-inc-00065:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00075:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00154:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00267:c0][ctx:skyharbor-air:it_landscape:incidents-csv-inc-00338:c0])?
3. What are your onshore/nearshore/offshore mix assumpt


---

# Pricing & Negotiation Intelligence Memo

# SkyHarbor AMS Pricing & Negotiation Intelligence Memo

**To:** SkyHarbor CIO / CFO / CPO
**From:** IT Sourcing Advisory
**Re:** AMS re-competition — pricing model, lever sequencing, BAFO posture

---

## 1. Baseline: What We're Actually Buying

### 1.1 In-scope AMS / application-services contract stack

| Vendor | Annual $ | Renewal | Exit | Scope | Citation |
|---|---|---|---|---|---|
| IBM Global Services (VEN-0001) | $280.0M | 2027-12-31 | 6mo notice | AMS + mainframe MS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0] |
| Accenture (VEN-0003) | $120.0M | 2027-03-31 | 6mo notice | App modernization + AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0] |
| Helios Technologies (VEN-0011) | $17.4M | 2026-12-31 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0] |
| Summit Software (VEN-0048) | $12.0M | 2027-03-31 | 6mo notice | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0048:c0] |
| Beacon Systems (VEN-0054) | $3.4M | 2026-09-30 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0054:c0] |
| Summit Cloud (VEN-0064) | $17.0M | 2027-06-30 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0] |
| Apex Cloud (VEN-0070) | $13.4M | 2026-12-31 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0] |
| Helios Software (VEN-0082) | $13.1M | 2028-06-30 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0] |
| Helios Systems (VEN-0040) | $15.7M | 2026-09-30 | 6mo notice | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0040:c0] |
| Vertex Technologies (VEN-0109) | $2.0M | 2027-12-31 | auto-renew | niche AMS | [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0109:c0] |

**Core AMS-anchored spend (IBM + Accenture):** ~$400M/yr. **Niche AMS tail (8 contracts above):** ~$94M/yr. Combined addressable AMS envelope for this re-compete: **~$494M/yr** — large enough to drive volume-band economics.

### 1.2 Budget context (FY26)

- Application Mgmt / Software & License: **$56.96M** [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0]
- Integration / Telecom: $21.06M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0168:c0]; Integration / S&L: $2.32M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0165:c0]
- Data & Analytics / Labor (internal): $13.02M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0134:c0]; D&A depreciation: $7.67M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0139:c0]
- Storage / S&L: $21.38M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0102:c0]; Network / HW: $13.03M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0108:c0]; Telecom: $22.27M [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0161:c0]

All FY26 lines are **"run"** margin-bridge drivers — i.e., contracted as steady-state, not transformation. That is itself a negotiating fact: we're paying run-rate prices for run-rate output, with no contractual productivity glide-path visible in the bundle.

### 1.3 Incumbent performance — the leverage core

Every measured tower is **breaching its 99.9% availability target**, with material credits at risk:

| Tower | Actual | Target | Breaches | Credits at risk | Citation |
|---|---|---|---|---|---|
| Service Desk | 93.35% | 99.9% | 5 | $767,072 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0055:c0] |
| Telecom | 91.63% | 99.9% | 6 | $770,686 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0061:c0] |
| Security | 95.44% | 99.9% | 0 | $663,465 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0037:c0] |
| Network | 90.47% | 99.9% | 0 | $554,370 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0019:c0] |
| Storage | 95.72% | 99.9% | 2 | $574,585 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0013:c0] |
| Compute | 92.97% | 99.9% | 6 | $158,158 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0007:c0] |
| Mainframe | 96.33% | 99.9% | 1 | $311,852 | [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0] |


---

# Executive Recommendation (draft)

# SkyHarbor AMS — Executive Recommendation (Draft)
**Audience:** CIO
**Status:** DRAFT — partially decidable; see "Not yet decidable" section
**Confidence:** Medium-Low on sizing/savings; Medium-High on direction of travel

---

## 1. Recommendation

**Pursue a staged AMS restructure built around two parallel workstreams, but do NOT sign a target operating model until the missing evidence (ticket volumes, transition constraints, retained-org design, tooling baseline) is in hand.**

Specifically, I recommend the CIO authorize the following *now*:

1. **Open a formal renegotiation track with IBM Global Services (VEN-0001, $280M/yr, AMS + mainframe managed services, renewal 2027-12-31, 6-month exit)** [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0]. This single contract is ~63% of our identified AMS-adjacent strategic spend and renews in ~24 months — it is the dominant lever and the dominant risk.
2. **Open a parallel renegotiation track with Accenture (VEN-0003, $120M/yr, Application modernization + AMS, renewal 2027-03-31, 6-month exit)** [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0]. Renews first; sets the pricing/SLA precedent for the IBM negotiation.
3. **Freeze auto-renewals on the niche-AMS tail** — Helios Technologies (VEN-0011, $17.4M, auto-renew, 2026-12-31) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0011:c0], Summit Cloud (VEN-0064, $17.0M, auto-renew, 2027-06-30) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0], Apex Cloud (VEN-0070, $13.4M, auto-renew, 2026-12-31) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0070:c0], Helios Software (VEN-0082, $13.1M, auto-renew, 2028-06-30) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0082:c0], Beacon Systems (VEN-0054 and VEN-0094) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0054:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0094:c0], Summit Systems (VEN-0077, VEN-0118) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0077:c0][ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0118:c0], Vertex Systems (VEN-0097) [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0097:c0]. These auto-renew clauses must be actively managed or they will quietly lock us in past the IBM/Accenture renegotiation window.
4. **Insert AI/data-use clauses on renewal.** Of every AMS-adjacent contract in the bundle, only Summit Cloud carries a "no-train-on-our-data" clause [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0064:c0]; **all others — IBM, Accenture, and the entire niche-AMS tail — show `ai_clauses: none`**. This is a material governance gap given AMS providers' growing use of GenAI for code/ticket work.
5. **Do not commit to an offshore-leveraged target mix or a specific savings number** until ticket-volume, transition-constraint, retained-org, and tooling baselines are produced.

---

## 2. Evidence the Recommendation Rests On

### 2a. Spend concentration and renewal timing
- IBM Global Services: **$280M/yr**, AMS + mainframe, renewal 2027-12-31, 6-month exit, buyer-owned data [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0001:c0].
- Accenture: **$120M/yr**, App modernization + AMS, renewal 2027-03-31, 6-month exit, **vendor-hosted data** [ctx:skyharbor-air:it_financials:vendor-contracts-csv-ven-0003:c0].
- Combined IBM + Accenture = **$400M/yr** AMS-adjacent strategic spend, both renewing within a 9-month window in 2027.
- Niche AMS / commodity tail (VEN-0011, -0040, -0048, -0054, -0064, -0067, -0070, -0077, -0082, -0094, -0097, -0108, -0109, -0118) sums to **~$138M/yr** across the bundle. Many on auto-renew.
- Indicative FY26 AMS-relevant budget line: Application Mgmt / Software & License **$56.96M** [ctx:skyharbor-air:it_financials:it-financials-csv-fin-0116:c0]. (Note: this is software/license only — not the labor-services portion of AMS. EVIDENCE MISSING: AMS labor budget line.)

### 2b. Service quality signal
Of 8 towers in the SLA register, **7 of 8 are missing their 99.9% availability targets**, with combined credit-at-risk of ~$4.83M/month:
- Mainframe 96.33% [ctx:skyharbor-air:it_landscape:sla-register-csv-sla-0001:c0]
- Compute 92.97%, 6 breaches [ctx:skyharbor-air:it_landscape:sla-register-csv
