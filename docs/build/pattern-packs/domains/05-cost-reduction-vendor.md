# Pattern Pack — Cost Reduction / Vendor Rationalization (`COST`)

**Pack code:** `COST`
**Domain:** Cross-entity cost reduction and vendor rationalization for a **multi-entity holding company** — the Lakeshore / Morgan Street context: a HoldCo with multiple PortCos / operating subsidiaries, each buying largely independently, so the *same* vendors, services, and software are bought many times over at many different prices, with no group-level view of total third-party spend. The mandate is to find the cross-entity savings the fragmented org structure hides.
**Composition:** Domain patterns here compose with the cross-cutting packs (`ARCH`, `INGEST`, `MODEL`, `MLOPS`, `GOV`, `FINOPS`) and the adjacent domain pack (`TREAS` finance / treasury). A cost Move artifact selects COST patterns for the *business + data + AI approach* and cross-cutting patterns for the *platform underneath*. Spend ingestion leans on `INGEST`; the vendor/spend taxonomy and entity-resolution lean on `MODEL` (and the entity hierarchy from `TREAS-03`); savings models and entity-resolution ML lean on `MLOPS`; contract/spend governance leans on `GOV`.

**The value spine.** For a HoldCo cost program, value concentrates on three axes that every pattern ladders up to:
1. **Rationalization savings** — eliminating duplicate vendors, redundant software/licenses, and overlapping services, and consolidating fragmented spend onto fewer, better-priced suppliers.
2. **Negotiation leverage** — converting the aggregated, normalized truth of "what the whole group buys from this vendor" into enterprise-rate pricing, volume tiers, and better terms that no single PortCo could command alone.
3. **Realized (not just identified) savings** — the discipline of tracking projected savings through to *booked* P&L impact, because the recurring failure of cost programs is a big "identified savings" number that never reaches the income statement.

**The own-it thesis for HoldCo cost reduction.** A spend-analytics SaaS (Coupa, SAP Ariba/Spend, GEP Smart, Sievo, Tealbook, Apptio for software) ingests the client's spend onto the *vendor's* cloud, runs the *vendor's* classification and entity-resolution models, and returns dashboards and a savings number. That is the **RENT** posture: the client never owns the classified spend graph, the entity-resolution that unified its vendors, or the savings logic — and critically, the analytics see only what the client uploaded, in the vendor's taxonomy, with no link to the client's own contract, treasury (`TREAS`), and operational data. The own-it alternative builds the **spend taxonomy, the LLM-assisted vendor entity-resolution, the duplicate-detection, the consolidation-ranking, and the savings-realization tracking on the client's own lakehouse** — fed by every PortCo's AP/PO/GL data, the contract repository, and the bank/payment data (shared with `TREAS`). The classified spend graph and the unified vendor master become a **client-owned, compounding asset** reused across every future negotiation, M&A integration, and budget cycle — not a report that expires when the SaaS subscription lapses. Every pattern's Own-it field returns to this: **own the spend graph and the savings logic; rent only what is genuinely commodity infrastructure.**

**A discipline note up front — savings realization, not savings theater.** Several patterns produce a "savings opportunity" number. The non-negotiable rule throughout: **a savings claim is not value until it is tracked from projected → contracted → realized (booked in the P&L) with a defensible measurement baseline, an owner, and finance sign-off.** Identified-savings numbers that never reach the income statement are the canonical cost-program failure. The realization anti-pattern — claiming credit for unbooked savings — is restated wherever a savings figure appears. Treat it as a hard constraint, not a tuning knob.

> Benchmark figures below are industry ranges from Hackett Group, The Hackett/sourcing-procurement studies, Gartner/Forrester (software/SaaS), Deloitte/PwC/McKinsey procurement studies, and finserv-relevant sources. HoldCo-specific dollar values are illustrative and **must be confirmed against the client's own spend, contracts, and entity structure.** Flagged inline as "estimate — confirm with client data."

---

## Index

| ID | Pattern | Value spine |
|---|---|---|
| COST-01 | Cross-entity vendor normalization (LLM entity resolution) | Rationalization / leverage |
| COST-02 | Spend taxonomy & classification (group-wide) | Rationalization |
| COST-03 | Duplicate / near-duplicate vendor & service detection | Rationalization |
| COST-04 | Consolidation opportunity ranking (savings × disruption × time) | Rationalization |
| COST-05 | Enterprise-rate negotiation leverage (aggregated demand) | Leverage |
| COST-06 | Federated contract & renewal calendar | Leverage / leakage |
| COST-07 | Software / SaaS license rationalization (SAM) | Rationalization |
| COST-08 | Audit-firm, tax & advisory federation | Leverage |
| COST-09 | Insurance program federation (P&C, D&O, cyber) | Leverage / risk |
| COST-10 | Cybersecurity & IT-security tooling federation | Rationalization / risk |
| COST-11 | Shared-services & GBS optimization | Rationalization |
| COST-12 | Vendor concentration & supply-risk analytics | Risk |
| COST-13 | Tail-spend management & rogue/maverick-spend control | Leakage / leverage |
| COST-14 | Price-variance & benchmark analytics (same item, many prices) | Leverage |
| COST-15 | Payment-terms & working-capital leverage (with treasury) | Working capital |
| COST-16 | Savings realization tracking (projected → contracted → realized) | Realized savings |
| COST-17 | PortCo socialization & adoption (the federation change problem) | Realized savings |
| COST-18 | Cost-reduction AI use-case portfolio (value × ease × disruption × data-readiness) | Strategy |

---

### PATTERN COST-01 · Cross-entity vendor normalization (LLM entity resolution)

**Intent** — Resolve the HoldCo's fragmented vendor records into a single, clean vendor master across every PortCo's AP/ERP system, so the group can see — for the first time — its *total* spend with each true supplier.

**Applies to** — Multi-entity HoldCo with independent PortCo ERPs/AP systems; Discovery, Architecture (the foundational data product), Strategy. The foundation for every other COST pattern. Composes with COST-02, -03, -05, `TREAS-03` (entity hierarchy), and `MODEL` master-data patterns.

**Solution shape** — The core problem: the same supplier appears as dozens of distinct vendor records across PortCos — "IBM Corp," "I.B.M.," "International Business Machines," "IBM Credit LLC," each with different vendor IDs, tax IDs, addresses, and spellings — plus parent/subsidiary relationships (a vendor's reseller, its acquired brands, its regional entities) that should roll up to one negotiating counterparty. **Entity resolution** unifies them:
- **Deterministic + probabilistic matching** — match on tax ID (EIN/DUNS where present), normalized name, address, and bank-account details, with fuzzy scoring for the long tail where identifiers are missing or dirty.
- **LLM-assisted resolution** — this is where modern AI earns its place: an LLM disambiguates messy free-text vendor names, infers that "AWS," "Amazon Web Services," and "Amazon.com Services LLC" are the same negotiating entity, and resolves **corporate-family rollups** (parent ↔ subsidiary ↔ acquired-brand) that pure string-matching misses. The LLM proposes matches with a rationale; a human curates the high-stakes/ambiguous ones.
- **Vendor master with corporate-family hierarchy** — the output is a canonical vendor master where each true supplier (and its negotiating parent) is one node, with all the PortCo-level vendor records mapped to it — so total group spend per supplier and per corporate family is computable.

This is the prerequisite truth: you cannot negotiate enterprise rates, find duplicates, or rationalize until you know that 40 vendor records are actually 1 supplier.

**Own-it vs rent** — **OWN.** The vendor master, the corporate-family hierarchy, and the entity-resolution logic must live on the client lakehouse (`MODEL`, joined to `TREAS-03`) — it is foundational master data reused by every cost, treasury, and risk pattern, and a compounding asset that improves with curation. **RENT** = a spend-SaaS that resolves vendors on its cloud in its taxonomy and hands back a number; the client never owns the unified master, can't join it to contracts/treasury data, and loses it when the subscription ends. The LLM and matching models run in the client estate; only foundational reference data (e.g., DUNS) is a **RENT** input.

**Where it sits** — Bronze (raw per-PortCo vendor + AP records), Silver (matched/resolved vendor records), Gold (canonical vendor master + corporate-family hierarchy). Architecture (foundational data product); Discovery; Strategy.

**Evidence anchors** —
- Vendor-master fragmentation across independently-run entities is the structural reason HoldCo spend is invisible at the group level — the same supplier is bought many times with no aggregate view (procurement-data practice — *confirm against client AP systems*).
- Entity resolution / corporate-family rollup typically *increases measured spend concentration* substantially once duplicates are unified, revealing negotiation leverage that was hidden (sourcing practice — *estimate, confirm*).
- LLM-assisted entity resolution materially outperforms pure string-matching on messy free-text vendor names and family rollups (modern entity-resolution practice).

**Anti-patterns** —
- **Negotiating off un-normalized spend** — treating 40 vendor records as 40 small suppliers and missing that they're one large one; the leverage stays invisible.
- **String-matching only** — misses corporate-family rollups and free-text variants an LLM catches.
- **Vendor-resolution living on a SaaS** — the unified master, the client's most reusable cost asset, ends up vendor-held and un-joinable to contracts/treasury.
- **Fully-automated resolution with no human curation** of high-stakes matches — a wrong rollup mis-states a top supplier's spend.

**Feeds artifacts** — Architecture (vendor-master data product — foundational); Discovery (spend-visibility baseline); Strategy (spend-concentration picture); Business Case (the aggregated-spend base for every savings claim).

**Maturity** — production-ready.

---

### PATTERN COST-02 · Spend taxonomy & classification (group-wide)

**Intent** — Classify every transaction across every PortCo into a consistent spend taxonomy (category/subcategory), so the group can see what it buys by category — the second foundational truth after *who* it buys from.

**Applies to** — Multi-entity HoldCo; Discovery, Architecture, Strategy. Composes with COST-01, -04, -14, `TREAS-02` (COA harmonization), and `MODEL`.

**Solution shape** — Each PortCo codes spend in its own chart of accounts and its own category logic, so "the same thing" lands in different buckets across entities. Build a **group spend taxonomy** on the lakehouse:
- **Canonical taxonomy** — adopt or define a category structure (e.g., **UNSPSC** as a starting standard, or a tailored finserv-relevant taxonomy) covering both **direct** and the dominant HoldCo focus, **indirect/G&A** spend — IT/software, professional services, facilities, marketing, telecom, travel, insurance, audit, etc.
- **ML/LLM classification** — classify each transaction (and each vendor) into the taxonomy from the AP/PO line description, GL account, and vendor, using ML/LLM models that handle the free-text and the per-PortCo COA variance (shared mapping with `TREAS-02`). Auto-classify the bulk; route low-confidence to human review; learn from corrections.
- **Spend cube** — the output is a group **spend cube**: spend sliceable by category × vendor × entity × time × cost-center, the analytical base for duplicate detection (COST-03), consolidation (COST-04), and price-variance (COST-14).

**Own-it vs rent** — **OWN.** The taxonomy, classification models, and spend cube on the client lakehouse — the classified spend graph is a client-owned asset reused across the whole program and future cycles. **RENT** = a spend-SaaS that classifies in its proprietary taxonomy on its cloud; the client can't tune the categories, can't reconcile to its own COA, and doesn't own the classified data. Reference taxonomies (UNSPSC) are **RENT** reference inputs wrapped in own-it classification.

**Where it sits** — Silver (classified transactions), Gold (the spend cube). Architecture (foundational data product); Discovery; Strategy.

**Evidence anchors** —
- Unclassified/inconsistently-classified spend across entities prevents category-level sourcing; classification is a prerequisite for category strategy (sourcing practice).
- UNSPSC is a widely-used commodity/service classification standard for spend taxonomy (UNSPSC — reference).
- ML/LLM auto-classification handles the bulk at high accuracy with human-in-the-loop on the low-confidence tail (spend-analytics practice — *estimate, confirm*).

**Anti-patterns** —
- **Classifying in a vendor's locked taxonomy** that can't reconcile to the client's COA or be tuned.
- **Manual category mapping** across hundreds of thousands of transactions — unscalable; ML/LLM with human review on the tail is the pattern.
- **Treating classification as one-time** — new vendors/spend arrive continuously; the classifier must run on an ongoing feed.

**Feeds artifacts** — Architecture (spend-cube data product); Discovery (category-spend baseline); Strategy (category strategy); Business Case (category-level savings base).

**Maturity** — production-ready.

---

### PATTERN COST-03 · Duplicate / near-duplicate vendor & service detection

**Intent** — Surface where the group is buying the *same or overlapping* product/service from multiple vendors (or the same vendor at multiple prices) across PortCos — the raw material of rationalization.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. Rationalization spine. Composes with COST-01, -02, -04, -07, -10, -14.

**Solution shape** — On the normalized vendor master (COST-01) and spend cube (COST-02), detect overlap at two levels:
- **Duplicate vendors** — the same supplier engaged via multiple contracts/records at different prices and terms across PortCos (often a COST-01 residue plus genuinely separate redundant agreements).
- **Near-duplicate / overlapping services** — *different* vendors providing the same functional capability across the group: three different e-signature tools, four endpoint-security products, five contract-lifecycle-management SaaS, redundant data-feed/market-data subscriptions, overlapping consulting retainers. This is **functional-overlap detection** — clustering vendors/products by the capability they provide (using category + LLM-inferred function from product descriptions), not just by name. The output is candidate overlap clusters ("here are the 4 things doing endpoint security") for rationalization.
- **Same-item price spread** — feeds COST-14: the same item bought at materially different prices flags both a rationalization and a negotiation opportunity.

**Own-it vs rent** — **OWN.** Overlap-detection and functional-clustering logic on the lakehouse, built on the owned vendor master and spend cube. **RENT** = a SaaS that flags duplicates in its silo without the client's contract and category context. The LLM functional-clustering runs in the client estate.

**Where it sits** — Gold (overlap clusters, duplicate-vendor + functional-overlap marts). Strategy + Business Case.

**Evidence anchors** —
- Independently-run PortCos predictably accumulate redundant tools/vendors for the same function — the most reliable HoldCo rationalization source (sourcing/IT-asset practice — *confirm on client data*).
- Software/SaaS functional overlap is especially common and especially recoverable (Gartner SAM/SaaS-management studies — *estimate, confirm*).

**Anti-patterns** —
- **Name-only duplicate detection** — misses functional overlap between differently-named tools doing the same job.
- **Flagging overlap with no consolidation path** — a list of duplicates with no ranked action (COST-04) is noise.
- **Ignoring switching cost** in the overlap flag — not all overlap is worth consolidating (handled in COST-04).

**Feeds artifacts** — Strategy (rationalization candidates); Business Case (overlap-savings opportunity); Architecture (overlap marts); Mobilization (rationalization workstreams).

**Maturity** — production-ready.

---

### PATTERN COST-04 · Consolidation opportunity ranking (savings × disruption × time-to-realize)

**Intent** — Rank rationalization and consolidation opportunities by a defensible composite of **net savings × business disruption × time-to-realize**, so the program pursues the highest-value, lowest-pain wins first instead of chasing the biggest gross number.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. The synthesizing rationalization pattern. Composes with COST-03, -05, -06, -16, -17.

**Solution shape** — Every overlap/duplicate candidate (COST-03) is scored on three dimensions on the lakehouse:
- **Net savings** — *net*, not gross: the price/volume saving from consolidating, minus switching/migration cost, contract-exit/termination penalties (COST-06), implementation effort, and any volume the surviving vendor can't absorb. A gross-savings ranking that ignores exit penalties and migration cost is misleading.
- **Disruption** — operational and change risk: how mission-critical the service is, how many PortCos/users are affected, switching/migration complexity, integration dependencies, and PortCo political resistance (COST-17). High disruption pushes an opportunity down the queue even at high savings.
- **Time-to-realize** — when the saving actually books, gated by contract renewal timing (COST-06 — you often can't consolidate until a contract is up without penalty), migration time, and notice periods. A high-savings opportunity locked behind an 18-month contract is sequenced accordingly.

The composite produces a **ranked, sequenced rationalization roadmap** — typically a value-vs-ease quadrant with time-to-realize as the sequencing axis. The output is the spine of the cost-program plan and the Business Case stack-rank.

**Own-it vs rent** — **OWN.** The ranking model and the net-savings/disruption/time logic on the lakehouse — it encodes the client's specific contracts, switching costs, and PortCo realities, and must be transparent for the Business Case. **RENT** = a SaaS "savings opportunity" list with gross numbers and no net/disruption/timing model.

**Where it sits** — Gold (ranked-opportunity marts). Strategy + Business Case.

**Evidence anchors** —
- Net-of-switching-cost ranking is the credibility requirement; gross savings ignoring exit penalties and migration overstate the prize (sourcing practice — *qualitative*).
- Time-to-realize gating by contract renewal is the most common reason an "identified" saving slips quarters (COST-06 / COST-16 link).

**Anti-patterns** —
- **Ranking by gross savings** — ignoring switching cost, exit penalties, and disruption; pursues the wrong opportunities and over-promises.
- **No time-to-realize axis** — promising savings the contract calendar won't allow this year (COST-16 realization gap).
- **Ignoring PortCo disruption/politics** — a technically-sound consolidation that the PortCos block (COST-17).

**Feeds artifacts** — Strategy (rationalization roadmap); Business Case (stack-ranked, net, time-phased savings); Architecture (ranking marts); Mobilization (sequenced workstreams).

**Maturity** — production-ready.

---

### PATTERN COST-05 · Enterprise-rate negotiation leverage (aggregated demand)

**Intent** — Convert the group's aggregated, normalized demand into enterprise pricing — volume tiers, most-favored terms, and consolidated agreements — that no single PortCo could command, using the unified spend truth as the negotiation evidence base.

**Applies to** — Multi-entity HoldCo with fragmented buying; Strategy, Business Case. Leverage spine. Composes with COST-01, -02, -04, -14, -08, -09, -10.

**Solution shape** — Once spend is normalized (COST-01) and classified (COST-02), the group can negotiate as one buyer:
- **Aggregated-demand pack** — for each top supplier and category, assemble the negotiation evidence: total group spend, the per-PortCo price spread (COST-14 — "you're charging entity A 30% more than entity D for the same SKU"), volume across the group, and the consolidation scenario (COST-04). This evidence pack is the leverage.
- **Enterprise agreement structuring** — negotiate a **master/enterprise agreement** with volume tiers, most-favored-customer/most-favored-pricing clauses, group-wide rate cards, and uniform terms — letting PortCos buy off the group rate.
- **Benchmark-informed targets** — set negotiation targets against price benchmarks (COST-14) and category market intelligence.
- **Should-cost & RFP support** — for larger categories, support competitive RFPs/RFQs with the spend baseline and should-cost models.

The structural win: a HoldCo's *combined* volume commands pricing tiers each PortCo was too small to reach — the leverage was always there, just invisible until the spend was unified.

**Own-it vs rent** — **OWN.** The aggregated-demand evidence base, price-spread analytics, and benchmark targets on the lakehouse — the negotiation leverage is the client's, built from its own unified data. Third-party category market benchmarks are **RENT** inputs. **RENT** = outsourcing the spend visibility to a SaaS so the client negotiates off a vendor's number it can't interrogate.

**Where it sits** — Gold (aggregated-demand + price-spread marts), serving (negotiation evidence packs). Strategy + Business Case.

**Evidence anchors** —
- Volume aggregation across entities unlocks pricing tiers unavailable to fragmented buyers; consolidating spend onto fewer suppliers at enterprise rates is the core sourcing-savings mechanism (sourcing/category-management practice).
- Strategic sourcing on rationalized categories commonly delivers **8–15% savings on addressable/rationalized spend** (and higher on poorly-managed indirect categories), per Hackett/McKinsey/Deloitte procurement studies — *estimate, confirm against client spend and current pricing*.
- Per-entity price spread for the same item is direct, hard-to-rebut negotiation evidence (COST-14 link).

**Anti-patterns** —
- **Negotiating per-PortCo** — leaving group leverage on the table; the whole point of the program is to negotiate as one buyer.
- **Demanding enterprise rates without the evidence base** — a number with no spend/volume/price-spread backing is weak leverage.
- **Most-favored clauses with no mechanism to enforce** — terms that look good but can't be policed against drift (ties to COST-14/16 monitoring).

**Feeds artifacts** — Strategy (category negotiation strategy); Business Case (negotiated-savings line — 8–15% on rationalized spend, confirmed); Architecture (negotiation-evidence marts); Mobilization (negotiation + enterprise-agreement rollout).

**Maturity** — production-ready.

---

### PATTERN COST-06 · Federated contract & renewal calendar

**Intent** — Build a single, group-wide contract repository and renewal calendar across all PortCos, so the HoldCo never auto-renews a redundant contract, misses a consolidation window, or loses a negotiation because it didn't know a renewal was coming.

**Applies to** — Multi-entity HoldCo with scattered contracts; Architecture, Strategy, Governance, Business Case. Leverage + leakage spine. Composes with COST-01, -04, -05, -07, -16.

**Solution shape** — Contracts in a HoldCo live in PortCo drives, inboxes, and people's heads. Federate them:
- **Contract ingestion & extraction** — gather contracts from every PortCo and use **LLM extraction** to pull the structured terms that matter: counterparty (mapped to the COST-01 vendor master), value, **renewal/expiry date, notice period, auto-renewal (evergreen) clause, termination rights and penalties, price-escalation (CPI/uplift) clauses, MFN clauses, and SLAs**. Auto-renewal and notice-period terms are the highest-value extractions — a missed notice window auto-renews a contract the group meant to consolidate.
- **Group renewal calendar** — a single forward calendar of every contract's renewal/notice deadline, so negotiations and consolidations (COST-04) are timed *before* the window closes, not after.
- **Renewal early-warning & auto-renewal alerts** — alert ahead of every notice deadline so no evergreen contract renews by default.
- **Time-to-realize input** — the calendar *is* the time-to-realize gate for COST-04 ranking and COST-16 realization.

**Own-it vs rent** — **OWN.** The contract repository, extracted terms, and renewal calendar on the client lakehouse (`MODEL` + `GOV`) — contracts are sensitive, the extracted-terms graph is reused across negotiation/rationalization/realization, and the client must own its own contractual obligations record. A contract-lifecycle-management (CLM) SaaS is a legitimate **MANAGED** operational tool, but the extracted-terms data product and the calendar analytics should be own-it (or at minimum exportable) so leverage and timing aren't vendor-locked. **RENT** = scattered contracts with no central extraction — the default failure state.

**Where it sits** — Bronze (raw contract documents), Silver (LLM-extracted structured terms), Gold (renewal calendar + alerts). Architecture + Governance; Strategy + Business Case.

**Evidence anchors** —
- Auto-renewal (evergreen) clauses with short notice windows are a primary source of value leakage — a missed notice locks in another term at non-negotiated rates (contract-management practice).
- LLM contract-term extraction now reliably structures renewal/notice/penalty/escalation terms from unstructured agreements (modern document-AI practice — *estimate, confirm accuracy on client contracts with human review*).
- Renewal-calendar discipline is the gating mechanism for timing consolidations and negotiations (sourcing practice).

**Anti-patterns** —
- **No central renewal calendar** — contracts auto-renew before anyone acts; the most common, most preventable leakage.
- **Extracting terms but not the notice period / auto-renewal clause** — the highest-value fields skipped.
- **Treating extraction as authoritative without human review** of high-value contracts — an extraction error on a penalty clause is costly.

**Feeds artifacts** — Architecture (contract-terms data product); Strategy (renewal-timed negotiation plan); Governance (obligations record); Business Case (leakage avoidance); Mobilization (renewal-calendar operating cadence).

**Maturity** — production-ready.

---

### PATTERN COST-07 · Software / SaaS license rationalization (SAM)

**Intent** — Right-size the group's software and SaaS estate — eliminating unused licenses, duplicate tools, and over-provisioned tiers, and consolidating onto enterprise agreements — the single richest indirect-cost category in most HoldCos.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. Rationalization spine. Composes with COST-03, -04, -05, -06, -10.

**Solution shape** — Software/SaaS is where rationalization pays the most because it combines duplicate tools, unused seats, and shelfware. Build **Software Asset Management (SAM) / SaaS-management analytics** on the lakehouse:
- **License-vs-usage reconciliation** — join entitlement data (what the group pays for) to actual usage/activity (SSO logs, admin consoles, MDM/agent inventory) to surface **unused/under-used licenses** (a seat paid for but not logged into in 90+ days), over-provisioned tiers, and **shelfware** (whole tools nobody uses).
- **Functional-overlap consolidation** — the COST-03 functional clusters applied to software (the 4 endpoint tools, the 5 CLM SaaS) → consolidate to one or two.
- **License-edition right-sizing** — downgrade over-provisioned editions to the tier actually used.
- **Enterprise-agreement consolidation** — fold per-PortCo SaaS subscriptions into one enterprise agreement at volume pricing (COST-05).
- **Renewal-timed action** — sequence against the contract calendar (COST-06).
- **Compliance balance** — also surface *under-licensing* exposure (more usage than entitlements) to avoid true-up surprises — rationalization cuts cost *and* manages audit risk.

**Own-it vs rent** — **OWN** for the license-vs-usage reconciliation and rationalization analytics on the lakehouse, joining entitlement, usage, and contract data the SaaS-management vendors see only partially. SaaS-management/SAM tools exist (**RENT** option) and can supply usage telemetry, but the unified analysis across the group's full estate + contracts + spend is own-it. **RENT** = a SaaS-management vendor that holds the analysis and sees only the apps it discovered.

**Where it sits** — Silver (entitlement + usage), Gold (license-vs-usage + rationalization marts). Strategy + Business Case.

**Evidence anchors** —
- SaaS/software waste from unused licenses and shelfware is consistently large — studies commonly cite **25–35% of SaaS spend** as unused or redundant in unmanaged estates (Gartner/Forrester/SaaS-management vendor studies — *estimate, confirm on client telemetry*).
- License-vs-usage reconciliation is the core SAM mechanism; under-licensing exposure makes it a compliance play too (SAM practice; ISO/IEC 19770).

**Anti-patterns** —
- **Renewing seat counts at last year's number** without usage reconciliation — paying for shelfware indefinitely.
- **Cutting licenses without checking under-licensing exposure** — trading a saving for an audit true-up.
- **Per-PortCo SaaS subscriptions** never consolidated to an enterprise agreement (COST-05).

**Feeds artifacts** — Strategy (software-estate rationalization); Business Case (license-savings line); Architecture (SAM data products); Mobilization (renewal-timed license actions).

**Maturity** — production-ready.

---

### PATTERN COST-08 · Audit-firm, tax & advisory federation

**Intent** — Rationalize and federate the group's professional-services spend — external audit, tax, legal, and management/strategy advisory — that proliferates when each PortCo retains its own firms independently.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case, Governance. Leverage spine. Composes with COST-01, -02, -05, -06.

**Solution shape** — Professional services is high-value, high-rate, and notoriously fragmented — each PortCo hires its own audit firm, tax advisor, and law firms. Federate it on the unified spend (COST-01/02):
- **Spend aggregation** — total group spend by firm and by service (audit, tax, legal, advisory, valuation), revealing both duplicate firms and aggregate volume with the Big-4 / national firms.
- **Audit-firm rationalization** — consolidating statutory/group audit onto fewer firms (subject to **independence and rotation** rules — a governance constraint, not just a cost lever) typically reduces total audit fees and improves consistency. Mandatory firm/partner rotation and independence prohibitions (non-audit services from the auditor) must be respected — this is where cost and governance intersect.
- **Rate-card & panel negotiation** — negotiate group rate cards, blended-rate caps, and preferred-firm panels for legal and advisory, replacing per-PortCo full-rate engagements.
- **Demand management** — surface duplicate/overlapping advisory engagements across PortCos (two firms doing similar diligence) for de-duplication.

**Own-it vs rent** — **OWN** for the professional-services spend aggregation and rate analytics on the lakehouse. The firms themselves are obviously external; the *spend intelligence and panel/rate-card management* is own-it. **RENT** = no group view of professional-services spend, each PortCo at full rate.

**Where it sits** — Gold (professional-services spend + rate marts). Strategy + Business Case + Governance.

**Evidence anchors** —
- Professional-services spend is a large, fragmented, high-rate indirect category with significant rate-card and panel-consolidation savings (sourcing practice — *estimate, confirm*).
- Auditor independence and mandatory rotation rules constrain audit-firm consolidation — a governance boundary on the cost lever (PCAOB/SEC independence + EU audit rotation rules — *confirm applicability*).

**Anti-patterns** —
- **Consolidating audit without respecting independence/rotation rules** — a compliance failure dressed as a saving.
- **Full-rate per-PortCo legal/advisory** with no panel or rate card.
- **No view of overlapping advisory engagements** across the group.

**Feeds artifacts** — Strategy (professional-services category); Business Case (rate + consolidation savings); Governance (independence/rotation constraints); Mobilization (panel + rate-card rollout).

**Maturity** — production-ready.

---

### PATTERN COST-09 · Insurance program federation (P&C, D&O, cyber)

**Intent** — Federate the group's insurance programs — property & casualty, D&O, cyber, professional liability — so the HoldCo buys coverage as one risk pool at master-program economics rather than as fragmented per-PortCo policies.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case, Governance, Risk. Leverage + risk spine. Composes with COST-01, -05, -12, `TREAS-18` (counterparty risk).

**Solution shape** — Independently-bought insurance means duplicate policies, inconsistent coverage, gaps and overlaps, and no buying scale. Federate on the unified spend (COST-01):
- **Program aggregation** — inventory every PortCo's policies, premiums, limits, deductibles, and broker by line (P&C, D&O, cyber, E&O, EPL); total group premium by line and by carrier/broker.
- **Master-program structuring** — move to **group master programs** (a single tower per line covering all entities) at consolidated premium, with consistent limits and the group's combined buying power — typically cheaper and more coherent than the sum of standalone policies.
- **Coverage gap/overlap analysis** — surface where PortCos are over- or under-insured and where coverage overlaps or leaves gaps; align to a group risk appetite.
- **Broker rationalization** — consolidate broker relationships and negotiate fees/commissions transparently.
- **Cyber specifically** — cyber insurance pricing depends on security posture (ties to COST-10); a federated, strong-posture group can negotiate better cyber terms than weak standalone PortCos.

**Own-it vs rent** — **OWN** for the program-inventory and gap/overlap analytics on the lakehouse. Insurance carriers and brokers are external (**RENT** by nature); the *program intelligence* — what the group buys, where the gaps are, what the combined pool justifies — is own-it. **RENT** = each PortCo's broker holding the only view of that PortCo's program, no group picture.

**Where it sits** — Gold (insurance-program + premium marts). Strategy + Business Case + Governance.

**Evidence anchors** —
- Master/group insurance programs typically achieve lower aggregate premium and more consistent coverage than fragmented standalone policies (risk-management/insurance-brokerage practice — *estimate, confirm*).
- Cyber-insurance pricing is posture-dependent; a stronger federated security posture (COST-10) improves terms (cyber-insurance market practice).

**Anti-patterns** —
- **Per-PortCo policies** with duplicate coverage, inconsistent limits, and no buying scale.
- **Premium savings that create coverage gaps** — federation must align coverage to risk appetite, not just cut premium.
- **No link between cyber insurance and security posture** (COST-10).

**Feeds artifacts** — Strategy (insurance-program federation); Business Case (premium + coverage-coherence value); Governance (coverage adequacy); Risk (group risk appetite); Mobilization (master-program rollout).

**Maturity** — production-ready.

---

### PATTERN COST-10 · Cybersecurity & IT-security tooling federation

**Intent** — Rationalize the group's sprawling, overlapping security-tool estate (endpoint, identity, SIEM, vulnerability, email security, etc.) — cutting redundant licenses while *strengthening* posture through consolidation onto fewer, better-integrated platforms.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case, Risk. Rationalization + risk spine. Composes with COST-03, -04, -07, -09.

**Solution shape** — Security tooling is the worst functional-overlap offender — every PortCo bought its own EDR, its own SIEM, its own identity provider, often several. Federate using COST-03 functional clusters:
- **Tool-estate inventory by capability** — map every security tool to its function (endpoint, identity/IAM, SIEM/SOAR, vulnerability management, email security, CASB, DLP), surfacing the overlap (5 EDR products, 3 SIEMs).
- **Consolidation with posture as a constraint** — consolidate to fewer platforms, but the objective function is **cost reduction *without* posture regression** — and often posture *improvement*, because a consolidated, well-integrated stack with consistent coverage beats fragmented best-of-breed sprawl nobody fully operates. This is a cost lever where the risk dimension is co-equal: never cut a control that leaves a gap.
- **Enterprise licensing** — consolidate per-PortCo security SaaS onto enterprise agreements (COST-05/07).
- **Insurance linkage** — a stronger, consolidated posture improves cyber-insurance terms (COST-09).

**Own-it vs rent** — **OWN** for the tool-estate inventory and consolidation analytics on the lakehouse. Security tools are operational products (**MANAGED/RENT**); the *rationalization intelligence and posture-impact analysis* is own-it. **RENT** = no group view of the security-tool estate, redundancy unmanaged.

**Where it sits** — Gold (security-tool estate + overlap marts). Strategy + Business Case + Risk.

**Evidence anchors** —
- Security-tool sprawl is endemic and costly; consolidation onto fewer integrated platforms cuts cost and often improves operability and coverage (Gartner security-consolidation studies — *estimate, confirm*).
- Posture must be preserved/improved through consolidation — cost-cutting that opens a control gap is a false economy (security practice).

**Anti-patterns** —
- **Cutting a security tool that leaves a coverage gap** — a saving that becomes a breach.
- **Best-of-breed sprawl nobody operates** mistaken for strong posture — consolidation often *improves* real coverage.
- **No capability-level mapping** — name-based dedup misses functional overlap (COST-03).

**Feeds artifacts** — Strategy (security-tool rationalization); Business Case (license + ops savings); Risk (posture preservation); Mobilization (consolidation sequencing).

**Maturity** — production-ready.

---

### PATTERN COST-11 · Shared-services & GBS optimization

**Intent** — Identify and quantify the opportunity to move duplicated back-office functions (finance/AP, HR/payroll, IT, procurement) from per-PortCo teams into shared services / Global Business Services — the largest structural cost lever in a federated HoldCo.

**Applies to** — Multi-entity HoldCo with duplicated back-office across PortCos; Strategy, Business Case. Rationalization spine. Composes with COST-02, -04, -17, `TREAS-17` (close).

**Solution shape** — Every PortCo running its own AP, payroll, IT helpdesk, and procurement means duplicated headcount and systems for the same processes. The pattern quantifies and sequences the shared-services opportunity:
- **Function-cost baselining** — using the classified spend (COST-02), GL, and headcount data, baseline the fully-loaded cost of each back-office function *per PortCo* and benchmark against shared-services/GBS efficiency standards (cost-per-invoice, cost-per-payslip, FTE ratios).
- **Consolidation modeling** — model moving a function to a shared-services center: the FTE/efficiency gain, the systems consolidation (one AP platform vs many), the transition cost and risk, and the time-to-realize — feeding the COST-04 ranking with the back-office functions.
- **Process-standardization prerequisite** — flag where shared services requires process/system standardization first (it usually does), so the savings aren't promised ahead of the enabling work.

This composes tightly with treasury close acceleration (`TREAS-17`) and the cost taxonomy (COST-02), and is heavily gated by PortCo socialization (COST-17) because it touches people.

**Own-it vs rent** — **OWN** for the function-cost baselining and consolidation modeling on the lakehouse. The shared-services *delivery* may be in-house or outsourced (a BPO is a **RENT/MANAGED** option to evaluate), but the *analysis of what to consolidate and the savings model* is own-it. **RENT** = a consultant's one-time GBS study with no durable client-owned model.

**Where it sits** — Gold (function-cost + consolidation marts). Strategy + Business Case.

**Evidence anchors** —
- Shared-services/GBS consolidation of fragmented back-office delivers large, structural cost reduction (commonly cited efficiency gains in the **20–40%+** range for the consolidated functions, depending on baseline maturity) (Hackett GBS studies — *estimate, confirm against client baseline*).
- Process/system standardization is the prerequisite; savings promised before standardization slip (GBS practice).

**Anti-patterns** —
- **Promising shared-services savings without the standardization work** — the savings slip and credibility erodes.
- **Lift-and-shift of broken processes** into a shared center — moves the cost, doesn't cut it.
- **Ignoring the people/political dimension** (COST-17) — shared services is the highest-disruption lever.

**Feeds artifacts** — Strategy (GBS/shared-services strategy); Business Case (structural cost-reduction line); Architecture (function-cost data products); Mobilization (phased function migration).

**Maturity** — production-ready.

---

### PATTERN COST-12 · Vendor concentration & supply-risk analytics

**Intent** — Surface where consolidation has created over-dependence on a single vendor (the flip side of rationalization), and monitor supply/vendor risk, so cost reduction doesn't quietly manufacture a single point of failure.

**Applies to** — Multi-entity HoldCo; Strategy, Risk, Governance. Risk spine. Composes with COST-04, -05, -09, `TREAS-18`.

**Solution shape** — Rationalization concentrates spend — which is the point for leverage, but past a threshold it creates **concentration risk**: a critical service with one vendor, no fallback, and a lopsided negotiating dependence (the vendor now has leverage over *you*). Build concentration/supply-risk analytics on the unified spend (COST-01):
- **Concentration metrics** — spend and *criticality* concentration per vendor and corporate family (a Herfindahl-style index per category); flag categories where consolidation has gone past prudent single-vendor dependence on a mission-critical service.
- **Supply/vendor-risk monitoring** — track vendor financial health, delivery/SLA performance, geographic/geopolitical concentration, and fourth-party (sub-processor) risk for critical vendors.
- **Resilience vs savings trade-off** — feed the COST-04 ranking with a risk dimension: some consolidation should be *capped* (dual-source the critical thing) even at the cost of some savings. The objective is *optimal* concentration, not maximal.

**Own-it vs rent** — **OWN** for the concentration and risk analytics on the lakehouse, built on the owned vendor master and spend graph. External vendor-risk data (financial-health, security ratings) are **RENT** inputs. **RENT** = a vendor-risk SaaS with no link to the client's actual spend concentration.

**Where it sits** — Gold (concentration + supply-risk marts), serving (vendor-risk dashboard). Strategy + Risk + Governance.

**Evidence anchors** —
- Over-concentration on a single critical vendor creates operational and negotiating risk; prudent programs cap concentration on mission-critical categories (supply-chain-risk practice).
- Fourth-party/sub-processor concentration is an increasingly material risk dimension (third-party-risk-management practice — *confirm scope*).

**Anti-patterns** —
- **Maximizing consolidation with no concentration ceiling** — manufacturing a single point of failure and handing the vendor pricing power.
- **Tracking financial savings but not the risk consequence** of consolidation.
- **No fourth-party visibility** for critical vendors.

**Feeds artifacts** — Strategy (concentration policy); Risk (supply-risk register); Governance (third-party-risk controls); Business Case (risk-adjusted consolidation).

**Maturity** — production-ready.

---

### PATTERN COST-13 · Tail-spend management & rogue/maverick-spend control

**Intent** — Bring the long tail of small, fragmented, off-contract spend under management — the many low-value transactions and rogue purchases that collectively leak material money and bypass negotiated rates.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. Leakage + leverage spine. Composes with COST-02, -05, -06, -14.

**Solution shape** — Tail spend — the bottom slice of spend across thousands of small vendors and transactions — is individually tiny but collectively large, and it's where **maverick/rogue spend** (buying off-contract, ignoring the negotiated supplier, one-off POs) hides. On the spend cube (COST-02):
- **Tail segmentation** — separate strategic spend (managed via COST-04/05) from the tail; size the tail and its vendor sprawl.
- **Maverick-spend detection** — flag spend that bypassed a negotiated contract/preferred supplier (buying the same category from a non-contracted vendor at non-negotiated rates) — direct leakage against the COST-05 enterprise agreements.
- **Tail consolidation** — channel tail spend through catalogs/P-cards/marketplaces and a few aggregator vendors, and route categories to the negotiated suppliers — recovering the negotiated rates and cutting transaction cost.
- **Compliance monitoring** — ongoing detection of off-contract drift so the negotiated rates (COST-05) actually get used.

**Own-it vs rent** — **OWN** for the tail-segmentation and maverick-detection analytics on the lakehouse — the compliance/leakage view against the client's own contracts and preferred suppliers. **RENT** = a tail-spend BPO/marketplace as an *operational channel* is a reasonable managed option, but the leakage analytics stay own-it.

**Where it sits** — Gold (tail-spend + maverick marts). Strategy + Business Case.

**Evidence anchors** —
- Tail spend is commonly **~20% of spend across ~80% of vendors** (the long tail), under-managed and leakage-prone (procurement practice — *estimate, confirm on client data*).
- Maverick/off-contract spend forfeits negotiated rates and is a direct, measurable leakage against enterprise agreements (sourcing practice).

**Anti-patterns** —
- **Ignoring the tail** as "too small to matter" — collectively it's material and the leakage compounds.
- **Negotiating enterprise rates (COST-05) with no off-contract monitoring** — the rates exist but maverick spend bypasses them.
- **Trying to strategically source every tail vendor** — channel/aggregate the tail instead.

**Feeds artifacts** — Strategy (tail-spend strategy); Business Case (leakage-recovery line); Architecture (tail/maverick marts); Mobilization (catalog/P-card + compliance rollout).

**Maturity** — production-ready.

---

### PATTERN COST-14 · Price-variance & benchmark analytics (same item, many prices)

**Intent** — Detect where the group pays materially different prices for the same item/service across PortCos and vs market benchmarks — the most direct, hardest-to-rebut negotiation and savings evidence.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. Leverage spine. Composes with COST-02, -03, -05, -13.

**Solution shape** — On the classified spend cube (COST-02) and normalized items, compute price variance:
- **Internal price spread** — for the same SKU/service/role, compare unit price across PortCos, vendors, and time, surfacing "entity A pays 30% more than entity D for the same thing." Internal spread is leverage you already own — you can move every entity to the best internal price immediately.
- **Benchmark variance** — compare prices to market/category benchmarks (third-party benchmark data) to size the gap to market.
- **Should-cost modeling** — for major categories, model the cost build-up (materials/labor/margin) to set defensible negotiation targets.
- **Price-creep detection** — track price escalation over time (CPI clauses, stealth increases) against contracts (COST-06).

The internal price spread is the killer negotiation evidence in COST-05: it's the client's own data, irrefutable, and immediately actionable.

**Own-it vs rent** — **OWN** for the price-variance and should-cost analytics on the lakehouse, built on the client's own transaction prices. Third-party benchmark data is a **RENT** input. **RENT** = a benchmarking SaaS that compares to market but can't surface the client's *internal* spread (its biggest, most-owned lever).

**Where it sits** — Gold (price-variance + benchmark marts). Strategy + Business Case.

**Evidence anchors** —
- Same-item internal price spread across entities is common and directly actionable — moving all entities to best internal price is immediate savings (sourcing practice — *confirm spread on client data*).
- Should-cost and benchmark targets ground defensible negotiation positions (category-management practice).

**Anti-patterns** —
- **Benchmarking to market while ignoring internal spread** — overlooking the easiest, most-owned win.
- **No price-creep monitoring** — stealth escalation erodes negotiated savings over time.
- **Comparing prices without normalizing the unit/SKU** — apples-to-oranges variance that misleads.

**Feeds artifacts** — Strategy (price-variance evidence); Business Case (price-harmonization + benchmark-gap savings); Architecture (price-variance marts); Mobilization (negotiation evidence packs).

**Maturity** — production-ready.

---

### PATTERN COST-15 · Payment-terms & working-capital leverage (with treasury)

**Intent** — Use the group's negotiation leverage to align and extend payment terms — and selectively capture early-payment discounts — coordinating with treasury so terms changes release working capital without straining critical suppliers.

**Applies to** — Multi-entity HoldCo; Strategy, Business Case. Working-capital spine; the bridge to the `TREAS` pack. Composes with COST-05, -06, -12, `TREAS-15` (working capital), `TREAS-06` (forecast).

**Solution shape** — Payment terms are a negotiation lever and a working-capital lever at once. On the unified spend and contract terms (COST-02/06):
- **Terms harmonization** — surface the inconsistent payment terms across PortCos/vendors and align toward the group standard; extending DPO on appropriate (non-critical, non-strained) suppliers releases working capital (shared math with `TREAS-15`).
- **Early-payment / dynamic-discounting capture** — where a supplier offers an early-payment discount whose implied rate beats the group's cost of capital, capture it; where it doesn't, take the terms. This is a treasury-coordinated decision (`TREAS-15`), funded by the cash position (`TREAS-06/11`).
- **Supplier-impact guardrail** — coordinate with COST-12 (concentration/supply risk) so terms extension doesn't strain a critical or financially-fragile supplier — the lever is *negotiated alignment*, not unilateral stretching of vulnerable partners.

**Own-it vs rent** — **OWN** for the terms-analytics and the working-capital/discount models on the lakehouse, shared with the treasury pack. Supply-chain-finance/dynamic-discounting *platforms* are a **MANAGED** operational option; the *decision analytics* are own-it. **RENT** = a supply-chain-finance vendor whose economics the client can't independently verify.

**Where it sits** — Gold (payment-terms + working-capital marts, shared with `TREAS-15`). Strategy + Business Case.

**Evidence anchors** —
- Payment-terms harmonization and extension release working capital; the cash released = (annual spend with the supplier ÷ 365) × days extended (exact arithmetic; *confirm spend base with client*).
- Dynamic discounting beats cost of capital when the implied discount rate exceeds the borrowing rate (treasury practice — link to `TREAS-15`).

**Anti-patterns** —
- **Unilaterally stretching critical or fragile suppliers** — risks supply and contradicts the partnership leverage; coordinate with COST-12.
- **Leaving early-payment discounts uncaptured** when they beat cost of capital, or capturing them when they don't — an un-modeled decision.
- **Terms changes decoupled from the cash forecast** (`TREAS-06`) — releasing working capital the forecast didn't account for.

**Feeds artifacts** — Strategy (payment-terms lever); Business Case (working-capital-release line — exact arithmetic, shared with treasury); Architecture (terms data products); Mobilization (terms-negotiation cadence with treasury).

**Maturity** — production-ready.

---

### PATTERN COST-16 · Savings realization tracking (projected → contracted → realized)

**Intent** — Track every savings opportunity through its full lifecycle — projected → contracted → realized (booked in the P&L) — with a defensible baseline, an owner, and finance sign-off, so the program reports *realized* value, not aspirational "identified savings."

**Applies to** — Multi-entity HoldCo; Strategy, Business Case, Governance. The realized-savings spine — the discipline that makes the whole program credible. Composes with every COST pattern above and `FINOPS`.

**Solution shape** — The recurring cost-program failure is a big "identified savings" number that finance never sees in the P&L. Build a **savings-realization ledger** on the lakehouse:
- **Lifecycle stages** — each opportunity moves through **projected** (identified, COST-04) → **approved/committed** → **contracted** (the new rate/agreement signed) → **realized** (the saving is *measurable in actual spend* vs the baseline). Report the funnel — and the leakage between stages — not just the top number.
- **Defensible baseline** — define the baseline (prior-period run-rate, or price × volume) explicitly per opportunity, with finance agreement, so "realized" is measurable and not gameable. Distinguish **hard savings** (cash/P&L reduction) from **cost avoidance** (a future cost not incurred) — report them separately; conflating them is how programs over-claim.
- **Realization measurement** — measure actual post-change spend against the baseline (controlling for volume changes — a price cut on lower volume isn't the same saving), and reconcile to the GL so finance can tie realized savings to the books.
- **Owner + sign-off** — every opportunity has an accountable owner and finance sign-off at the realized stage.

This pattern is the credibility backbone: it's why the program's number survives CFO and audit scrutiny.

**Own-it vs rent** — **OWN, and necessarily so.** The realization ledger, baselines, and GL reconciliation must be on the client lakehouse, transparent and finance-owned — it *is* the program's value proof, reconciled to the client's own books. A vendor's self-graded "savings achieved" number is exactly what finance won't trust. **RENT** = accepting a SaaS's savings-achieved figure with no baseline transparency or GL tie-out.

**Where it sits** — Gold (savings-realization ledger, baselines), Governance (finance sign-off + GL reconciliation), serving (realization funnel dashboard). Strategy + Business Case + Governance.

**Evidence anchors** —
- The projected-to-realized leakage is the canonical cost-program failure; rigorous realization tracking with finance sign-off is the recognized fix (Hackett/procurement-value-assurance practice — *qualitative*).
- Hard savings vs cost avoidance must be reported separately; conflation inflates claimed value (value-assurance standard).
- Baselines must control for volume; a price reduction on changed volume isn't a clean saving (measurement standard).

**Anti-patterns** —
- **THE realization anti-pattern: reporting identified/projected savings as if realized** — claiming P&L value that never books; the failure that discredits cost programs.
- **No defensible baseline or GL tie-out** — savings finance can't verify and won't credit.
- **Conflating hard savings and cost avoidance** to inflate the number.
- **No owner / no finance sign-off** at the realized stage — accountability gap.

**Feeds artifacts** — Strategy (value-assurance discipline); Business Case (the *realized* savings line — the only one that counts); Governance (finance sign-off + GL reconciliation); Mobilization (realization-tracking cadence).

**Maturity** — production-ready.

---

### PATTERN COST-17 · PortCo socialization & adoption (the federation change problem)

**Intent** — Get the PortCos to *actually adopt* group contracts, rates, and shared services — the soft failure mode that kills more HoldCo cost value than any analytical gap, because autonomous PortCos resist centrally-mandated change.

**Applies to** — Multi-entity HoldCo cost program; Mobilization, Strategy (change track). The adoption gate on realized savings. Composes with COST-04, -05, -13, -16.

**Solution shape** — A HoldCo's cost program lives or dies on PortCo cooperation: a negotiated enterprise rate (COST-05) saves nothing if PortCos keep buying off their old contracts (COST-13 maverick spend), and a shared-services move (COST-11) fails if PortCos won't migrate. Treat adoption as engineered:
- **Local value, not just group mandate** — show each PortCo *its own* saving (the COST-14 price spread, its share of the COST-05 rate), so the rationale is local and concrete, not a corporate edict.
- **Federated governance model** — define what's mandated vs recommended, the exception process, and the PortCo's role in category councils — so PortCos have voice, not just orders. Pure mandate breeds workarounds; pure autonomy forfeits leverage; the workable model is federated.
- **Compliance telemetry** — measure PortCo adoption (are they buying off the group rate? is maverick spend, COST-13, falling?) and feed it back — managing the actual adoption gaps, not assumed ones.
- **Realization linkage** — adoption is the gate on COST-16: a saving isn't realized until the PortCos actually buy on the new terms.

**Own-it vs rent** — **OWN** for the adoption telemetry and the federated-governance model on the client estate — adoption is measured against the client's own spend/contract data. The change effort is human; the *measurement* is own-it. **RENT** = a top-down rate with no adoption measurement — the saving is assumed, not realized.

**Where it sits** — Gold (adoption/compliance telemetry), serving (PortCo adoption dashboards). Mobilization + Strategy.

**Evidence anchors** —
- PortCo resistance/autonomy is the dominant non-analytical reason HoldCo cost programs under-deliver; adoption (not identification) is the value gate (HoldCo/PE value-creation practice — *qualitative*).
- Federated governance (mandate + recommend + exception + council) outperforms both pure mandate and pure autonomy (operating-model practice).

**Anti-patterns** —
- **Top-down mandate with no local value story** — breeds workarounds and maverick spend (COST-13).
- **No adoption telemetry** — the program reports negotiated rates while PortCos quietly don't use them; savings assumed, not realized.
- **Pure PortCo autonomy** — forfeits the group leverage the whole program exists to capture.

**Feeds artifacts** — Mobilization (adoption + federated-governance plan); Strategy (operating-model/change track); Business Case (realization gated on adoption — links to COST-16).

**Maturity** — production-ready.

---

### PATTERN COST-18 · Cost-reduction AI use-case portfolio (value × ease × disruption × data-readiness)

**Intent** — Rank a HoldCo's candidate cost/vendor use cases on a consistent four-factor scoring so the Strategy artifact sequences the program by *realizable value per unit of disruption and effort* — anchored on the rationalization, leverage, and realized-savings spines.

**Applies to** — HoldCo cost program; Discovery, Strategy (the portfolio synthesis). Composes with every COST pattern above and the `TREAS` pack.

**Solution shape** — Score each candidate use case (the patterns above plus client-specific ideas) on four axes:
- **Value** — quantified against the **three spines**: rationalization savings (duplicates COST-03, consolidation COST-04, software COST-07, security COST-10, shared services COST-11), negotiation leverage (enterprise rates COST-05, price variance COST-14, professional services COST-08, insurance COST-09), and working capital (terms COST-15). Say which spine each ladders to — and report value as *realizable* (net, time-phased, per COST-04/16), never gross.
- **Ease / feasibility** — gated hard by the **foundation patterns**: nothing is feasible until vendor normalization (COST-01), spend classification (COST-02), and the contract calendar (COST-06) exist — they are the data-readiness floor. Sequence them first.
- **Disruption** — operational and *political* disruption (COST-04, COST-17): software-license right-sizing is low-disruption/fast; shared-services consolidation (COST-11) is high-disruption/slow. Disruption reorders the roadmap independent of value.
- **Data readiness** — does the lakehouse have the joined AP/PO + vendor master + contract + usage data the use case needs? The foundation patterns *are* the data-readiness program.

Output a 2×2 (value × ease) bubble map with disruption as color and data-readiness as size, plus a sequenced roadmap. The portfolio's recurring conclusion for a HoldCo: **foundations first (normalize vendors, classify spend, federate contracts), then the fast low-disruption rationalization wins (software, duplicate vendors, tail/maverick) to fund and prove the program, then the high-value structural levers (enterprise rates, shared services) — and realization tracking (COST-16) plus PortCo adoption (COST-17) wrapped around all of it so identified savings become booked savings.**

**Own-it vs rent** — **OWN** the portfolio method and scoring on the client's own value/ease/disruption/data assessment. The portfolio's structural recommendation is **own the spend graph**: the unified vendor master, classified spend cube, contract-terms graph, and realization ledger are a compounding client-owned asset that serves this program and every future negotiation, M&A integration, and budget cycle — which a rented spend-analytics SaaS cannot be, because it holds the data and the logic on its side and expires with the subscription.

**Where it sits** — Strategy (the synthesizing artifact); informs Architecture sequencing and the Business Case stack-ranking. Discovery (candidate intake).

**Evidence anchors** —
- The four-factor scoring is a method, not a benchmark; each use case's value cites its own pattern's Evidence anchors (rationalized-spend savings per COST-05, software waste per COST-07, GBS efficiency per COST-11, etc.).
- The foundations-first + realization-wrapped sequencing is grounded in the empirical cost-program failure modes: invisible spend (COST-01/02) blocks everything, and unrealized savings (COST-16) and PortCo non-adoption (COST-17) are why programs under-deliver.

**Anti-patterns** —
- **Scoring on gross value alone** — ignoring net savings, disruption, data readiness, and (fatally) realization; over-promises and under-delivers.
- **Pursuing the high-value structural levers before the foundation exists** — modeling consolidation on un-normalized spend produces wrong numbers.
- **A portfolio of point-solution SaaS** — each holding its slice on its own cloud, none unifying the group's spend, leaving the HoldCo with no compounding owned asset; default to the own-it spend graph and flag any point-vendor with surfaced rationale.
- **A portfolio with no realization discipline** — a big identified-savings number with no path to the P&L (COST-16).

**Feeds artifacts** — Strategy (the use-case portfolio + sequenced roadmap — the primary artifact); Business Case (stack-ranked, realizable, time-phased investment); Architecture (spend-graph-over-point-vendors + foundations-first rationale); Mobilization (wave sequencing + realization/adoption wrap).

**Maturity** — production-ready.

---

## Composition note

A typical Lakeshore HoldCo cost Move — e.g., "Cross-entity vendor rationalization + enterprise-rate negotiation + realized-savings program" — composes:

```
DOMAIN (this pack):  COST-18 (portfolio — three spines, foundations-first, realization-wrapped)
                     COST-01/02/06 (vendor normalization + spend taxonomy + contract calendar — the foundation)
                     COST-03/04 (overlap detection + consolidation ranking)
                     COST-05/14 (enterprise-rate leverage + price variance)
                     COST-07/08/09/10/11 (software, professional services, insurance, security, shared services)
                     COST-12/13 (concentration risk + tail/maverick spend)
                     COST-15 (payment-terms / working-capital — bridge to treasury)
                     COST-16/17 (savings realization + PortCo adoption — the credibility wrap)
   ×
CROSS-CUTTING:       ARCH-01 (landing zone), INGEST (PortCo AP/PO/GL + contract + usage feeds),
                     MODEL (vendor master + corporate-family hierarchy + spend taxonomy; reuses TREAS-03 entity model),
                     MLOPS (entity-resolution + classification + savings models, serving + monitoring),
                     GOV (contract obligations + finance sign-off + realization-ledger provenance + auditor-independence constraints),
                     FINOPS (value engineering + the realized-savings discipline COST-16 builds on)
   ×
ADJACENT DOMAIN:     TREAS (shares the entity hierarchy TREAS-03, COA harmonization TREAS-02,
                     payment-terms/working-capital TREAS-15, bank-relationship federation TREAS-16/18,
                     and the bank/payment data that grounds vendor spend)
```

Two threads run through the whole pack. First, **own the spend graph and the savings logic**: the unified vendor master, classified spend cube, contract-terms graph, and realization ledger are a compounding client-owned asset no rented spend-analytics SaaS can be. Second, the **realization-and-adoption thread** — savings tracked to *booked* P&L (COST-16) and PortCos that *actually buy* on the new terms (COST-17) — is the hard constraint that turns identified savings into value, restated wherever a savings figure appears.

---

## Pattern selection by executive persona

Different executives own different value spines; a Move artifact should speak to the right owner for each pattern.

| Executive | Primary concern | Lead patterns |
|---|---|---|
| **HoldCo CFO** | Realized savings, the program's P&L impact | COST-16, COST-04, COST-05, COST-18 |
| **Chief Procurement Officer / Head of Sourcing** | Vendor rationalization, category strategy, negotiation | COST-01, COST-02, COST-05, COST-14 |
| **Head of Strategic Sourcing (category)** | Consolidation, price variance, tail spend | COST-03, COST-04, COST-13, COST-14 |
| **CIO / Head of IT** | Software/SaaS and security-tool rationalization | COST-07, COST-10, COST-03 |
| **CISO** | Security-tool consolidation without posture loss | COST-10, COST-09 (cyber insurance) |
| **Controller / Head of Shared Services** | Shared-services/GBS optimization, close | COST-11, COST-16 |
| **General Counsel / Head of Legal** | Contract terms, professional-services panel, independence | COST-06, COST-08 |
| **Chief Risk Officer / Head of Insurance** | Insurance federation, vendor concentration risk | COST-09, COST-12 |
| **Treasurer** | Payment terms, working-capital release | COST-15 (with TREAS-15) |
| **PortCo CFO / GM** | Local value, autonomy, adoption | COST-17, COST-14 (their own price spread) |
| **CFO / CPO (strategy)** | The portfolio + the three spines | COST-18 (synthesizes all) |

The squint test for credibility: when the CFO asks "how much of this savings will actually hit the P&L this year?" the artifact answers in *realized*, net, time-phased terms with GL tie-out (COST-16/04); when the CPO asks "what's our real leverage with this vendor?" it answers with unified group spend and internal price spread (COST-01/14); when a PortCo GM asks "why should I give up my supplier?" it answers with that PortCo's own concrete saving and a federated-governance voice (COST-17). Generic "we'll cut costs 10%" language fails all three.

---

## Cost-program operating calendar (orientation for the Move team)

HoldCo cost value capture runs on a cadence tied to contracts, budgets, and renewals. A Move artifact's Mobilization plan should align to it; the platform must support each beat.

| Beat | Window | Patterns it drives |
|---|---|---|
| **Spend refresh / classification** | Monthly (as AP/PO data lands) | COST-01, COST-02 (the foundation feeds) |
| **Contract renewal windows** | Rolling (per the federated calendar) | COST-06, COST-04 (time-to-realize gating), COST-05 |
| **Software/SaaS true-up & renewal** | Per vendor (often annual) | COST-07 |
| **Annual budget / planning cycle** | Annual | COST-18 (portfolio), COST-16 (savings into budget) |
| **Audit-firm appointment / rotation** | Per governance rules | COST-08 |
| **Insurance program renewal** | Annual (per line) | COST-09 |
| **Savings-realization review** | Monthly/quarterly | COST-16 (projected→realized funnel) |
| **PortCo adoption / category council** | Quarterly | COST-17 (adoption telemetry, federated governance) |
| **Vendor-risk / concentration review** | Quarterly | COST-12 |

A recurring sequencing lesson: **the foundation patterns (COST-01/02/06) gate everything, and the realization-plus-adoption wrap (COST-16/17) gates the *value*.** A consolidation ranked before vendors are normalized produces wrong numbers; a negotiated rate with no adoption telemetry and no realization tracking produces a headline saving that never reaches the P&L. Sequence the foundation first and wrap realization + adoption around the whole program — it is the single most important reason the own-it spend graph beats a rented analytics dashboard that hands back an unverifiable savings number.

---

## Provenance reminder

Per the pattern-pack discipline: every claim in a cost Move artifact cites a COST pattern ID (plus the cross-cutting/adjacent IDs it composes with), every quantitative value cites a benchmark source or carries the "estimate — confirm with client data" flag, every solution choice states its own-it posture, and any rent-side choice carries surfaced rationale. The savings patterns (COST-04/05/16) additionally require the realization anti-pattern to be cited explicitly as a rejected option — the artifact must show it reports *realized*, net, GL-reconciled savings over aspirational identified-savings by design, and that PortCo adoption (COST-17) is the gate between the two.
