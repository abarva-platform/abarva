// Domain Function Pack — Financial services · Cost optimization & vendor management.
//
// Function key: `cost_optimization_vendor_management`.
//
// This pack covers the corporate / G&A cost-reduction and vendor-procurement
// rationalization function of a diversified, multi-entity holding company — the
// Lakeshore / Morgan Street HoldCo context: a parent with many PortCos /
// operating subsidiaries, each buying largely independently, so the SAME
// vendors, services, and software are bought many times over at many different
// prices, with no group-level view of total third-party spend. The mandate is
// to find — and REALIZE — the cross-entity savings the fragmented org structure
// hides.
//
// The operating reality the pack encodes: value concentrates on three axes that
// every lever ladders up to. First, RATIONALIZATION SAVINGS — eliminating
// duplicate vendors, redundant software/licenses, and overlapping services, and
// consolidating fragmented spend onto fewer, better-priced suppliers. Second,
// NEGOTIATION LEVERAGE — converting the aggregated, normalized truth of "what
// the whole group buys from this vendor" into enterprise-rate pricing, volume
// tiers, and better terms no single PortCo could command alone. Third, REALIZED
// (not merely identified) SAVINGS — the discipline of tracking projected savings
// through to BOOKED P&L impact, because the canonical failure of cost programs
// is a big "identified savings" number that never reaches the income statement.
//
// The own-it thesis: a spend-analytics SaaS (Coupa, SAP Ariba/Spend, GEP Smart,
// Sievo, Apptio for software) ingests the client's spend onto the VENDOR's
// cloud, runs the vendor's classification and entity-resolution models, and
// returns a dashboard and a savings number — the RENT posture, where the client
// never owns the classified spend graph, the entity-resolution that unified its
// vendors, or the savings logic, and the analytics see only what was uploaded,
// in the vendor's taxonomy, with no link to the client's own contract, treasury,
// and operational data. The own-it alternative builds the spend taxonomy, the
// LLM-assisted vendor entity-resolution, the duplicate detection, the
// consolidation ranking, and the savings-realization tracking on the client's
// OWN lakehouse — so the classified spend graph and the unified vendor master
// become a client-owned, compounding asset reused across every future
// negotiation, M&A integration, and budget cycle. Own the spend graph and the
// savings logic; rent only what is genuinely commodity infrastructure.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark is
// a labelled planning range, never an asserted fact (spec §6 hard fail). Value
// math is sourced to Hackett / McKinsey / Deloitte / Gartner where it exists, or
// flagged as an estimate to confirm against the client's own spend.

import type { FunctionPack } from '../function-pack-types';

export const costOptimizationVendorManagementPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'cost_optimization_vendor_management',
  functionLabel: 'Cost optimization & vendor management',
  summary:
    'Cost optimization & vendor management is the corporate / G&A spend ' +
    'spine of a multi-entity holding company — the function that finds and ' +
    'realizes the cross-entity savings the fragmented PortCo structure hides. ' +
    'In a HoldCo, the same suppliers, software, and services are bought many ' +
    'times over by independently-run subsidiaries at many different prices, ' +
    'with no group-level view of total third-party spend. The function unifies ' +
    'that spend — resolving fragmented vendor records into one vendor master, ' +
    'classifying every transaction into a group spend taxonomy, federating ' +
    'contracts and their renewal calendar — and then converts the unified ' +
    'truth into value along three spines: rationalization (eliminating ' +
    'duplicate vendors, redundant software, and overlapping services), ' +
    'negotiation leverage (turning aggregated demand into enterprise-rate ' +
    'pricing no single PortCo could command), and realized savings (tracking ' +
    'every opportunity from projected to contracted to BOOKED in the P&L). ' +
    'Its economics are addressable spend under management, the realization ' +
    'rate from identified to booked savings, and the price the group pays ' +
    'versus the best internal or market price. The function is judged not on ' +
    'the size of the identified-savings number but on how much of it actually ' +
    'reaches the income statement once PortCos adopt the new terms.',
  version: '1.0.0',
  lastReviewed: '2026-06-06',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'addressable_spend_under_management',
      name: 'Addressable spend under management',
      definition:
        'The share of total third-party / indirect spend that is classified, ' +
        'visible, and actively managed through sourcing and contracts — as ' +
        'opposed to fragmented, unclassified, or off-contract spend the group ' +
        'cannot act on.',
      unit: '% of addressable spend',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 90,
        basis:
          'Spend-under-management varies with procurement maturity; the band ' +
          'spans a fragmented HoldCo with little group oversight to a mature ' +
          'category-managed one. A planning range — read against the client’s ' +
          'own spend visibility (Hackett procurement studies; estimate — ' +
          'confirm with client data).',
        label: 'planning-range',
      },
      dataSource:
        'The classified spend cube on the lakehouse, reconciling managed ' +
        'spend against total addressable AP/PO spend across every PortCo.',
      whyItMatters:
        'Spend the group cannot see it cannot source; addressable spend under ' +
        'management is the foundational read on how much of the third-party ' +
        'base is actually available to the cost program at all.',
    },
    {
      key: 'savings_realization_rate',
      name: 'Savings realization rate (identified → booked)',
      definition:
        'The share of identified / projected savings that is tracked through ' +
        'to realized — measurable in actual spend against a defensible ' +
        'baseline and reconciled to the general ledger — rather than left as ' +
        'an aspirational identified number.',
      unit: '% of identified savings booked in the P&L',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 80,
        basis:
          'The projected-to-realized leakage is the canonical cost-program ' +
          'failure; the band spans a program with weak realization discipline ' +
          'to one with finance sign-off and GL tie-out. A planning range ' +
          '(Hackett / procurement value-assurance practice; estimate — ' +
          'confirm with client data).',
        label: 'planning-range',
      },
      dataSource:
        'The savings-realization ledger on the lakehouse, reconciling ' +
        'projected → contracted → realized savings to actual GL spend.',
      whyItMatters:
        'A big identified-savings number that never reaches the income ' +
        'statement is the failure that discredits cost programs; the ' +
        'realization rate is the integrity measure of whether the program ' +
        'produces value or theater.',
    },
    {
      key: 'vendor_master_concentration',
      name: 'Vendor-master concentration after normalization',
      definition:
        'The reduction in distinct counted suppliers once fragmented vendor ' +
        'records are resolved into a canonical vendor master with ' +
        'corporate-family rollups — the measure of how much true spend ' +
        'concentration was hidden by fragmented records.',
      unit: '% reduction in distinct counted suppliers',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 15,
        high: 40,
        basis:
          'Entity resolution typically collapses many fragmented records into ' +
          'far fewer true suppliers, revealing hidden concentration and ' +
          'leverage; the band reflects the range across HoldCo estates. A ' +
          'planning range (sourcing / master-data practice; estimate — ' +
          'confirm with client AP systems).',
        label: 'planning-range',
      },
      dataSource:
        'The canonical vendor master on the lakehouse, comparing raw ' +
        'per-PortCo vendor-record counts to resolved supplier counts.',
      whyItMatters:
        'You cannot negotiate enterprise rates, find duplicates, or ' +
        'rationalize until you know that dozens of vendor records are ' +
        'actually one supplier; this metric reads how much leverage the ' +
        'fragmented org structure was hiding.',
    },
    {
      key: 'internal_price_variance',
      name: 'Internal price variance (same item, many prices)',
      definition:
        'The spread between the highest and lowest price the group pays ' +
        'across PortCos for the same normalized item, SKU, or service — the ' +
        'gap between every entity and the best internal price.',
      unit: '% spread, high vs low internal price',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 35,
        basis:
          'Same-item internal price spread across independently-buying ' +
          'entities is common and directly actionable; the band spans a ' +
          'lightly-fragmented estate to a heavily-fragmented one. A planning ' +
          'range (sourcing / category-management practice; estimate — confirm ' +
          'spread on client data).',
        label: 'planning-range',
      },
      dataSource:
        'The price-variance mart on the lakehouse, comparing unit prices for ' +
        'normalized items across PortCos, vendors, and time.',
      whyItMatters:
        'Internal price spread is leverage the group already owns — moving ' +
        'every entity to the best internal price is immediate, irrefutable ' +
        'savings and the hardest-to-rebut negotiation evidence.',
    },
    {
      key: 'software_license_utilization',
      name: 'Software / SaaS license utilization',
      definition:
        'The share of paid software and SaaS entitlements that are actually ' +
        'used — licenses logged into and active — versus unused seats, ' +
        'over-provisioned tiers, and shelfware (whole tools nobody uses).',
      unit: '% of entitlements actively used',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 90,
        basis:
          'Unmanaged SaaS estates carry substantial unused or redundant ' +
          'spend; the band spans an unmanaged estate to a well-managed one. A ' +
          'planning range (Gartner / Forrester / SaaS-management studies ' +
          'commonly cite 25–35% of SaaS spend as unused or redundant; ' +
          'estimate — confirm on client telemetry).',
        label: 'planning-range',
      },
      dataSource:
        'The license-vs-usage reconciliation mart, joining entitlement data ' +
        'to actual usage / activity (SSO logs, admin consoles, agent ' +
        'inventory).',
      whyItMatters:
        'Software / SaaS is the single richest indirect-cost category in most ' +
        'HoldCos because it combines duplicate tools, unused seats, and ' +
        'shelfware; license utilization reads how much of that waste is ' +
        'recoverable.',
    },
    {
      key: 'maverick_spend_share',
      name: 'Maverick / off-contract spend share',
      definition:
        'The share of addressable spend that bypassed a negotiated contract ' +
        'or preferred supplier — bought off-contract at non-negotiated rates ' +
        '— the direct leakage against the group’s enterprise agreements.',
      unit: '% of addressable spend off-contract',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'Off-contract / maverick spend forfeits negotiated rates and is a ' +
          'direct, measurable leakage; the band spans a tightly-governed ' +
          'estate to a loosely-governed one with significant tail sprawl. A ' +
          'planning range (sourcing practice; estimate — confirm on client ' +
          'data).',
        label: 'planning-range',
      },
      dataSource:
        'The maverick-detection mart on the spend cube, flagging spend ' +
        'against non-contracted vendors in categories with a negotiated ' +
        'agreement.',
      whyItMatters:
        'A negotiated enterprise rate saves nothing if PortCos keep buying ' +
        'off-contract; maverick-spend share reads whether the negotiated ' +
        'rates are actually being used — the adoption gate on realized value.',
    },
    {
      key: 'tail_spend_share',
      name: 'Tail-spend share',
      definition:
        'The share of total spend sitting in the long tail of small, ' +
        'fragmented transactions across many low-value vendors — ' +
        'individually tiny, collectively material, and leakage-prone.',
      unit: '% of spend in the tail',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 25,
        basis:
          'Tail spend is commonly around a fifth of spend across roughly ' +
          'four-fifths of vendors; the band reflects the typical long-tail ' +
          'distribution. A planning range (procurement practice — the ' +
          '~20%/~80% long-tail heuristic; estimate — confirm on client data).',
        label: 'planning-range',
      },
      dataSource:
        'The tail-segmentation mart on the spend cube, separating strategic ' +
        'spend from the long tail and sizing its vendor sprawl.',
      whyItMatters:
        'The tail is where unmanaged, off-contract, transaction-heavy ' +
        'leakage hides; sizing it reads how much spend is escaping the ' +
        'negotiated rates and the catalog channel.',
    },
    {
      key: 'contract_renewal_visibility',
      name: 'Contract renewal-calendar visibility',
      definition:
        'The share of group contract value covered by a federated renewal ' +
        'calendar with extracted expiry, notice-period, and auto-renewal ' +
        '(evergreen) terms — so no consolidation window or notice deadline is ' +
        'missed.',
      unit: '% of contract value on the federated calendar',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 95,
        basis:
          'Contracts in a HoldCo live in scattered drives, inboxes, and ' +
          'people’s heads; the band spans a fragmented estate to a federated ' +
          'one with LLM-extracted terms. A planning range (contract-' +
          'management practice; estimate — confirm on client contracts).',
        label: 'planning-range',
      },
      dataSource:
        'The contract-terms data product on the lakehouse, holding ' +
        'LLM-extracted renewal / notice / auto-renewal / penalty terms mapped ' +
        'to the vendor master.',
      whyItMatters:
        'Auto-renewal clauses with short notice windows are a primary source ' +
        'of value leakage and the time-to-realize gate on consolidation; ' +
        'renewal visibility reads whether the group can time negotiations ' +
        'before the window closes rather than after.',
    },
    {
      key: 'rationalized_category_savings_rate',
      name: 'Realized savings rate on rationalized categories',
      definition:
        'The booked savings achieved on addressable / rationalized spend in a ' +
        'category, net of switching, migration, and exit costs — measured ' +
        'against a defensible baseline and reconciled to the GL.',
      unit: '% net savings on rationalized spend',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 8,
        high: 15,
        basis:
          'Strategic sourcing on rationalized categories commonly delivers ' +
          '8–15% savings on addressable spend, higher on poorly-managed ' +
          'indirect categories. A planning range (Hackett / McKinsey / ' +
          'Deloitte procurement studies; estimate — confirm against client ' +
          'spend and current pricing).',
        label: 'planning-range',
      },
      dataSource:
        'The savings-realization ledger, measuring booked net savings against ' +
        'the per-category baseline reconciled to actual GL spend.',
      whyItMatters:
        'This is the headline value read of the rationalization and leverage ' +
        'spines — the net, realized saving on the spend the program actually ' +
        'addressed, the only savings figure that survives CFO and audit ' +
        'scrutiny.',
    },
    {
      key: 'vendor_concentration_risk_index',
      name: 'Critical-vendor concentration risk index',
      definition:
        'A concentration measure (Herfindahl-style) of spend and criticality ' +
        'per vendor and corporate family — flagging categories where ' +
        'consolidation has pushed a mission-critical service past prudent ' +
        'single-vendor dependence.',
      unit: 'concentration index (0–1, per critical category)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0.15,
        high: 0.4,
        basis:
          'Rationalization concentrates spend — the point, for leverage — but ' +
          'past a threshold it manufactures a single point of failure; the ' +
          'band reflects a prudent operating corridor, not a target. A ' +
          'planning range (supply-chain-risk practice; estimate — confirm ' +
          'against client criticality).',
        label: 'planning-range',
      },
      dataSource:
        'The concentration / supply-risk mart on the unified spend graph, ' +
        'weighting spend by vendor criticality and corporate family.',
      whyItMatters:
        'Cost reduction can quietly manufacture over-dependence on a single ' +
        'critical vendor that then holds pricing power over the group; this ' +
        'index reads whether consolidation has gone past optimal toward ' +
        'maximal, where resilience must cap further savings.',
    },
    {
      key: 'payment_terms_dpo',
      name: 'Group days-payable-outstanding (DPO)',
      definition:
        'The average days the group takes to pay suppliers — the working-' +
        'capital read of payment-terms alignment, where extending DPO on ' +
        'appropriate (non-critical, non-strained) suppliers releases working ' +
        'capital.',
      unit: 'days payable outstanding',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 75,
        basis:
          'Payment terms vary widely across independently-buying PortCos; the ' +
          'band spans a short-terms estate to an extended-terms one and ' +
          'reflects a negotiated alignment corridor, not unilateral ' +
          'stretching. A planning range (treasury / working-capital practice; ' +
          'estimate — confirm with client data).',
        label: 'planning-range',
      },
      dataSource:
        'The payment-terms mart on the spend and AP data, shared with the ' +
        'treasury working-capital model.',
      whyItMatters:
        'Payment terms are a negotiation lever and a working-capital lever at ' +
        'once; aligning and selectively extending DPO releases cash, but the ' +
        'lever is negotiated alignment, not unilateral stretching of ' +
        'vulnerable suppliers.',
    },
    {
      key: 'realization_baseline_integrity',
      name: 'Realization baseline & GL-reconciliation integrity',
      definition:
        'The share of tracked savings opportunities carrying a defensible, ' +
        'finance-agreed baseline (prior run-rate or price × volume), an ' +
        'accountable owner, hard-vs-cost-avoidance classification, and a GL ' +
        'tie-out at the realized stage.',
      unit: '% of opportunities with a defensible, signed-off baseline',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 95,
        basis:
          'Savings finance can verify and credit require an explicit ' +
          'baseline, hard-vs-avoidance separation, and GL tie-out; the band ' +
          'spans a loosely-tracked program to a value-assured one. A planning ' +
          'range (Hackett / value-assurance practice; estimate — confirm with ' +
          'client finance).',
        label: 'planning-range',
      },
      dataSource:
        'The savings-realization ledger and the finance sign-off / GL-' +
        'reconciliation records in governance.',
      whyItMatters:
        'A saving with no defensible baseline or GL tie-out is one finance ' +
        'will not credit; baseline integrity is what makes the realized-' +
        'savings number survive CFO and audit scrutiny and separates hard ' +
        'savings from cost avoidance.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'fragmented_vendor_records',
      name: 'Fragmented vendor records hiding group spend',
      description:
        'The same supplier appears as dozens of distinct vendor records ' +
        'across PortCo AP/ERP systems — different vendor IDs, tax IDs, ' +
        'addresses, and spellings, plus parent/subsidiary and acquired-brand ' +
        'relationships — so total group spend per true supplier is invisible ' +
        'and leverage stays hidden.',
      detectionSignal:
        'No single canonical vendor master spans the PortCos; the same ' +
        'supplier is counted as many small vendors; group spend per supplier ' +
        'cannot be computed.',
      diagnosticQuestion:
        'Can the group produce total spend with a single true supplier — and ' +
        'its corporate family — across every PortCo today, or is the vendor ' +
        'base fragmented into un-resolved records?',
    },
    {
      key: 'inconsistent_spend_classification',
      name: 'Inconsistent, locked spend classification',
      description:
        'Each PortCo codes spend in its own chart of accounts and category ' +
        'logic, so the same thing lands in different buckets across entities ' +
        'and the group cannot see what it buys by category — and where the ' +
        'classification lives in a vendor’s locked taxonomy it cannot be ' +
        'reconciled to the client’s own COA or tuned.',
      detectionSignal:
        'No group spend taxonomy; category-level spend disagrees across ' +
        'PortCos; classification is either absent or held in a SaaS the ' +
        'client cannot reconcile to its ledger.',
      diagnosticQuestion:
        'Is there a single group spend taxonomy the client owns and can ' +
        'reconcile to its own COA, or is category spend inconsistent and ' +
        'classification vendor-locked?',
    },
    {
      key: 'functional_overlap_blind_spot',
      name: 'Functional-overlap blind spot',
      description:
        'Independently-run PortCos accumulate different vendors providing the ' +
        'same capability — three e-signature tools, four endpoint-security ' +
        'products, five contract-lifecycle SaaS — and name-only deduplication ' +
        'misses the overlap because the tools are differently named but ' +
        'functionally redundant.',
      detectionSignal:
        'Multiple vendors deliver the same function across PortCos; ' +
        'duplicate detection is name-based and misses capability overlap; no ' +
        'capability-level mapping exists.',
      diagnosticQuestion:
        'Across the group, how many different vendors provide the same ' +
        'capability in the high-overlap categories — software, security ' +
        'tooling, professional services — and is that overlap mapped by ' +
        'function, not just by name?',
    },
    {
      key: 'auto_renewal_leakage',
      name: 'Auto-renewal and missed-notice leakage',
      description:
        'Contracts live scattered across PortCo drives, inboxes, and people’s ' +
        'heads with no federated renewal calendar, so evergreen contracts ' +
        'auto-renew at non-negotiated rates before anyone acts and ' +
        'consolidation windows close unnoticed — the most preventable ' +
        'leakage in the function.',
      detectionSignal:
        'No central renewal calendar; auto-renewal and notice-period terms ' +
        'are not extracted; contracts renew by default before negotiation; ' +
        'consolidations slip because the contract was up before anyone knew.',
      diagnosticQuestion:
        'Is there a single forward calendar of every contract’s renewal and ' +
        'notice deadline with auto-renewal clauses extracted, or do contracts ' +
        'evergreen-renew before the group can act?',
    },
    {
      key: 'gross_savings_overstatement',
      name: 'Gross-savings overstatement (ignoring switching cost and timing)',
      description:
        'Consolidation opportunities are ranked and promised on gross ' +
        'savings that ignore switching / migration cost, contract-exit ' +
        'penalties, the volume the surviving vendor cannot absorb, and the ' +
        'time-to-realize gated by contract renewal — so the program pursues ' +
        'the wrong opportunities and over-promises a prize the calendar will ' +
        'not allow this year.',
      detectionSignal:
        'Opportunity rankings show gross numbers with no net-of-switching, ' +
        'no disruption dimension, and no time-to-realize axis; promised ' +
        'savings slip quarters when the contract is not up.',
      diagnosticQuestion:
        'Are consolidation opportunities ranked on NET savings after ' +
        'switching cost and exit penalties, with disruption and a ' +
        'time-to-realize gate, or on gross numbers that overstate the prize?',
    },
    {
      key: 'savings_theater',
      name: 'Savings theater — identified savings that never book',
      description:
        'The program reports a big identified / projected savings number that ' +
        'finance never sees in the P&L — no defensible baseline, no GL ' +
        'tie-out, hard savings conflated with cost avoidance, and no owner or ' +
        'finance sign-off at the realized stage — the canonical cost-program ' +
        'failure that discredits the whole effort.',
      detectionSignal:
        'Reported savings do not reconcile to the GL; the projected-to-' +
        'realized funnel and its leakage are not tracked; hard savings and ' +
        'cost avoidance are reported as one number; no finance sign-off.',
      diagnosticQuestion:
        'When the CFO asks how much of this savings will actually hit the P&L ' +
        'this year, can the program answer in realized, net, GL-reconciled ' +
        'terms — or only in aspirational identified-savings?',
    },
    {
      key: 'portco_non_adoption',
      name: 'PortCo non-adoption of group terms',
      description:
        'Autonomous PortCos resist centrally-mandated change — a negotiated ' +
        'enterprise rate saves nothing if PortCos keep buying off their old ' +
        'contracts, and a shared-services move fails if they will not migrate ' +
        '— so the soft failure mode of non-adoption kills more HoldCo cost ' +
        'value than any analytical gap.',
      detectionSignal:
        'Negotiated rates exist but maverick spend stays high; no adoption / ' +
        'compliance telemetry; PortCos report local objections; shared-' +
        'services migrations stall.',
      diagnosticQuestion:
        'Are PortCos actually buying on the new group terms — is maverick ' +
        'spend falling and adoption measured — or are the negotiated rates ' +
        'assumed-used but not realized?',
    },
    {
      key: 'rented_spend_intelligence',
      name: 'Rented spend intelligence',
      description:
        'The unified vendor master, the classified spend cube, the entity-' +
        'resolution that unified the vendors, and the savings logic live ' +
        'inside a spend-analytics SaaS the group cannot own, tune, or join to ' +
        'its own contract and treasury data — so the client’s most reusable ' +
        'cost asset is vendor-held, the analytics see only what was uploaded ' +
        'in the vendor’s taxonomy, and the whole thing expires when the ' +
        'subscription lapses, leaving no compounding owned asset behind.',
      detectionSignal:
        'The classified spend graph and vendor master sit on a vendor’s ' +
        'cloud; the client cannot reconcile classification to its COA, cannot ' +
        'join spend to contracts / treasury, and cannot interrogate the ' +
        'savings number the SaaS hands back.',
      diagnosticQuestion:
        'Does the group own the unified vendor master, the classified spend ' +
        'cube, and the savings-realization logic on its own lakehouse — joined ' +
        'to its contracts and treasury data — or are they rented inside a ' +
        'spend-analytics SaaS that holds the data and the logic?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'vendor_entity_resolution',
      name: 'LLM-assisted cross-entity vendor normalization',
      valueMechanism:
        'Deterministic plus probabilistic matching (tax ID, normalized name, ' +
        'address, bank detail) combined with an LLM that disambiguates messy ' +
        'free-text vendor names and resolves corporate-family rollups (parent ' +
        '↔ subsidiary ↔ acquired-brand) resolves fragmented vendor records ' +
        'into one canonical vendor master, with a human curating the high-' +
        'stakes / ambiguous matches. Value comes from revealing — for the ' +
        'first time — total group spend per true supplier and corporate ' +
        'family, the prerequisite truth for every rationalization and ' +
        'negotiation lever.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Per-PortCo vendor-master and AP records (names, tax IDs, addresses, ' +
          'bank detail)',
        'Foundational reference data (DUNS / EIN) as a rent-side input',
        'The entity hierarchy shared with the treasury pack for corporate-' +
          'family rollups',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The LLM proposes matches with a rationale; a human curates high-' +
          'stakes and ambiguous rollups — a wrong rollup mis-states a top ' +
          'supplier’s spend and the negotiation that rests on it.',
        'The vendor master and entity-resolution logic must run in the client ' +
          'estate and be owned, not on a vendor’s cloud — it is foundational ' +
          'master data reused across cost, treasury, and risk.',
        'Fully-automated resolution with no human curation is rejected; only ' +
          'foundational reference data is a rent-side input.',
      ],
      metricsMoved: [
        'vendor_master_concentration',
        'addressable_spend_under_management',
        'internal_price_variance',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'spend_classification',
      name: 'ML/LLM spend taxonomy & classification',
      valueMechanism:
        'ML / LLM models classify every transaction and vendor into a group ' +
        'spend taxonomy (a standard such as UNSPSC or a tailored finserv ' +
        'taxonomy) from the AP/PO line description, GL account, and vendor — ' +
        'auto-classifying the bulk and routing the low-confidence tail to ' +
        'human review, learning from corrections. Value comes from building ' +
        'the owned spend cube: spend sliceable by category × vendor × entity ' +
        '× time, the analytical base every downstream lever runs on.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Resolved vendor master and AP/PO line-level transactions',
        'Per-PortCo chart-of-accounts mappings (shared COA harmonization with ' +
          'the treasury pack)',
        'A reference taxonomy (UNSPSC) as a rent-side reference input',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Auto-classify the bulk at high confidence; route the low-confidence ' +
          'tail to human review and learn from corrections — manual mapping ' +
          'of hundreds of thousands of transactions is unscalable.',
        'Classification must be owned and tunable on the client lakehouse and ' +
          'reconcilable to the client’s own COA — a vendor’s locked taxonomy ' +
          'is rejected.',
        'Classification is not one-time; new vendors and spend arrive ' +
          'continuously, so the classifier runs on an ongoing feed.',
      ],
      metricsMoved: [
        'addressable_spend_under_management',
        'tail_spend_share',
        'rationalized_category_savings_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'overlap_consolidation_ranking',
      name: 'Functional-overlap detection & consolidation ranking',
      valueMechanism:
        'On the owned vendor master and spend cube, cluster vendors and ' +
        'products by the capability they provide (category plus LLM-inferred ' +
        'function from product descriptions) to surface duplicate vendors and ' +
        'near-duplicate / overlapping services, then rank each consolidation ' +
        'opportunity on NET savings (gross minus switching / migration cost ' +
        'and exit penalties) × business disruption × time-to-realize (gated ' +
        'by the renewal calendar). Value comes from a sequenced, defensible ' +
        'rationalization roadmap that pursues the highest-value, lowest-pain, ' +
        'soonest-realizable wins first.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The classified spend cube and the canonical vendor master',
        'Product / service descriptions for LLM functional clustering',
        'Contract terms — exit penalties, notice periods, renewal dates — from ' +
          'the federated contract calendar',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'Ranking on gross savings is rejected — the net-of-switching-cost, ' +
          'disruption, and time-to-realize model is the credibility ' +
          'requirement; a gross-savings list over-promises.',
        'The ranking model encodes the client’s specific contracts, switching ' +
          'costs, and PortCo realities and must be owned and transparent for ' +
          'the Business Case, not a SaaS opportunity list.',
        'Concentration risk caps consolidation on mission-critical categories ' +
          '(dual-source the critical thing) even at the cost of some savings.',
      ],
      metricsMoved: [
        'rationalized_category_savings_rate',
        'software_license_utilization',
        'vendor_concentration_risk_index',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'contract_term_extraction',
      name: 'LLM contract-term extraction & renewal calendar',
      valueMechanism:
        'An LLM extracts the structured terms that matter from unstructured ' +
        'contracts gathered from every PortCo — counterparty (mapped to the ' +
        'vendor master), value, renewal / expiry date, notice period, ' +
        'auto-renewal (evergreen) clause, termination rights and penalties, ' +
        'price-escalation and most-favored-nation clauses, SLAs — into a ' +
        'single federated renewal calendar with early-warning alerts. Value ' +
        'comes from never auto-renewing a redundant contract, timing every ' +
        'negotiation and consolidation before the notice window closes, and ' +
        'feeding the time-to-realize gate for opportunity ranking.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Contract documents gathered from every PortCo (the raw repository)',
        'The vendor master to map each counterparty to its true supplier',
        'Human review of high-value contract extractions',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'Auto-renewal and notice-period terms are the highest-value ' +
          'extractions — skipping them defeats the calendar; an extraction ' +
          'error on a penalty clause is costly.',
        'Extraction is not authoritative without human review of high-value ' +
          'contracts; the LLM proposes, a human confirms the load-bearing ' +
          'terms.',
        'The extracted-terms data product and the calendar analytics are ' +
          'owned (or at minimum exportable) on the client lakehouse so ' +
          'leverage and timing are not vendor-locked, even where a CLM tool ' +
          'is a legitimate managed operational system.',
      ],
      metricsMoved: [
        'contract_renewal_visibility',
        'rationalized_category_savings_rate',
        'maverick_spend_share',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'savings_realization_tracking',
      name: 'Savings-realization tracking (projected → contracted → realized)',
      valueMechanism:
        'A savings-realization ledger on the lakehouse moves every ' +
        'opportunity through projected → approved → contracted → realized ' +
        '(measurable in actual spend against a defensible, finance-agreed ' +
        'baseline), separates hard savings from cost avoidance, controls for ' +
        'volume changes, reconciles to the GL, and reports the funnel and its ' +
        'stage-to-stage leakage. Value comes from converting an aspirational ' +
        'identified-savings number into BOOKED P&L impact finance will credit ' +
        '— the credibility backbone of the whole program.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Identified opportunities from the consolidation ranking and ' +
          'negotiation pipeline',
        'Defensible per-opportunity baselines (prior run-rate or price × ' +
          'volume) agreed with finance',
        'Actual post-change GL spend for realization measurement and tie-out',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'THE rejected anti-pattern: reporting identified / projected savings ' +
          'as if realized — every realized saving needs a defensible ' +
          'baseline, a GL tie-out, an owner, and finance sign-off.',
        'Hard savings and cost avoidance must be reported separately; ' +
          'conflating them inflates the claimed number.',
        'The realization ledger, baselines, and GL reconciliation must be ' +
          'owned and finance-owned on the client lakehouse — a vendor’s ' +
          'self-graded savings-achieved figure is exactly what finance will ' +
          'not trust.',
      ],
      metricsMoved: [
        'savings_realization_rate',
        'realization_baseline_integrity',
        'rationalized_category_savings_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'maverick_tail_monitoring',
      name: 'Maverick-spend & tail-spend monitoring',
      valueMechanism:
        'An agent monitors the spend cube continuously to flag spend that ' +
        'bypassed a negotiated contract or preferred supplier, segments the ' +
        'long tail from strategic spend, and tracks off-contract drift ' +
        'against the enterprise agreements — channeling the tail through ' +
        'catalogs / P-cards / aggregator vendors and routing categories to ' +
        'the negotiated suppliers. Value comes from recovering the negotiated ' +
        'rates that maverick spend was forfeiting and cutting tail ' +
        'transaction cost — and reading PortCo adoption directly.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The classified spend cube and the negotiated-contract / preferred-' +
          'supplier list',
        'Per-PortCo transaction-level spend for off-contract detection',
        'Catalog / P-card / marketplace channel data for tail consolidation',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent monitors and flags; category and PortCo owners act on the ' +
          'leakage — negotiating enterprise rates with no off-contract ' +
          'monitoring leaves the rates unused.',
        'The leakage / compliance analytics stay owned on the lakehouse ' +
          'against the client’s own contracts and preferred suppliers even ' +
          'where a tail-spend marketplace is a reasonable managed channel.',
        'Off-contract flags are an adoption signal feeding PortCo ' +
          'socialization — the gate between negotiated and realized savings.',
      ],
      metricsMoved: [
        'maverick_spend_share',
        'tail_spend_share',
        'savings_realization_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'owned_vendor_master_data_product',
      name: 'Owned vendor-master & spend-cube data product',
      description:
        'A pattern that builds the canonical vendor master (with corporate-' +
        'family hierarchy) and the classified group spend cube as owned data ' +
        'products on the client lakehouse — the foundational truth of who the ' +
        'group buys from and what it buys, computed across every PortCo, ' +
        'reused by every cost, treasury, and risk lever.',
      boundary:
        'It resolves vendors and classifies spend into owned data products; ' +
        'category managers and the CPO own the sourcing decisions built on ' +
        'them. It does not negotiate or rationalize — it is the truth those ' +
        'levers run on.',
      humanAccountabilityPoint:
        'The Chief Procurement Officer / Head of Sourcing accountable for the ' +
        'vendor master and the group spend taxonomy.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'consolidation_opportunity_engine',
      name: 'Net-savings consolidation-opportunity engine',
      description:
        'A pattern that detects duplicate and functionally-overlapping ' +
        'vendors and ranks each consolidation opportunity on net savings ' +
        '(after switching cost and exit penalties) × disruption × time-to-' +
        'realize — producing a sequenced rationalization roadmap rather than ' +
        'a gross-savings list, with concentration risk capping consolidation ' +
        'on critical categories.',
      boundary:
        'It detects overlap and ranks opportunities; the CPO, category ' +
        'councils, and PortCos own which consolidations proceed. It does not ' +
        'execute a consolidation or override a concentration ceiling.',
      humanAccountabilityPoint:
        'The Head of Strategic Sourcing accountable for the rationalization ' +
        'roadmap and the consolidation decisions.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'federated_contract_calendar',
      name: 'Federated contract & renewal-calendar pattern',
      description:
        'A pattern that gathers contracts from every PortCo, uses LLM ' +
        'extraction to structure renewal / notice / auto-renewal / penalty / ' +
        'escalation terms mapped to the vendor master, and maintains a single ' +
        'forward renewal calendar with early-warning alerts — the time-to-' +
        'realize gate for consolidation and the obligations record.',
      boundary:
        'It extracts terms and maintains the calendar; legal and category ' +
        'owners own the contracts and the negotiation timing. It alerts ' +
        'ahead of every notice deadline; it does not renew or terminate.',
      humanAccountabilityPoint:
        'The General Counsel / Head of Legal accountable for the contract ' +
        'obligations record and the federated renewal calendar.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'savings_realization_ledger',
      name: 'Savings-realization ledger pattern',
      description:
        'A pattern that tracks every opportunity through projected → ' +
        'contracted → realized against a defensible, finance-agreed baseline, ' +
        'separates hard savings from cost avoidance, controls for volume, and ' +
        'reconciles realized savings to the GL with an owner and finance ' +
        'sign-off — so the program reports realized, net, GL-tied value, not ' +
        'aspirational identified savings.',
      boundary:
        'It tracks and reconciles savings; finance owns the baseline ' +
        'agreement and the sign-off at the realized stage. It reports the ' +
        'funnel; it does not self-grade savings as achieved.',
      humanAccountabilityPoint:
        'The HoldCo CFO accountable for the realized-savings number, the ' +
        'baselines, and the finance sign-off.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'federated_adoption_governance',
      name: 'Federated PortCo adoption-governance pattern',
      description:
        'A pattern that engineers PortCo adoption of group terms — showing ' +
        'each PortCo its own concrete saving, defining what is mandated vs ' +
        'recommended with an exception process and category-council voice, ' +
        'and measuring adoption with compliance telemetry (are PortCos buying ' +
        'off the group rate? is maverick spend falling?) — the gate between ' +
        'negotiated and realized savings.',
      boundary:
        'It models and measures adoption; PortCo leadership and the category ' +
        'councils own the buying behavior. It measures the adoption gap; the ' +
        'change effort itself is human.',
      humanAccountabilityPoint:
        'The HoldCo CFO / CPO accountable for the federated governance model ' +
        'and adoption, with PortCo GMs accountable for local buying.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Cost / vendor value is realised along three spines and a forecast must ' +
      'keep them separate, then gate them on realization. First, ' +
      'rationalization savings: eliminating duplicate vendors, redundant ' +
      'software and licenses, and overlapping services, and consolidating ' +
      'fragmented spend onto fewer, better-priced suppliers — a recurring ' +
      'saving, but one that is NET only after switching / migration cost and ' +
      'contract-exit penalties. Second, negotiation leverage: converting the ' +
      'group’s aggregated, normalized demand into enterprise-rate pricing, ' +
      'volume tiers, and better terms no single PortCo could command — ' +
      'commonly 8–15% on rationalized spend, higher on poorly-managed ' +
      'indirect categories. Third, working capital: aligning and selectively ' +
      'extending payment terms releases cash, coordinated with treasury and ' +
      'never by straining critical or fragile suppliers. The dominant ' +
      'constraint over all three is that an identified saving is not value ' +
      'until it is tracked from projected → contracted → realized (booked in ' +
      'the P&L) against a defensible baseline with finance sign-off, AND the ' +
      'PortCos actually adopt the new terms. So a forecast must be expressed ' +
      'as net, time-phased, realizable ranges — never gross identified ' +
      'savings — and must show the realization-and-adoption gate explicitly, ' +
      'because the canonical failure is a big identified number that never ' +
      'reaches the income statement.',
    dominantHaircutFactors: [
      {
        factor: 'Realization leakage (identified → booked)',
        rationale:
          'The recurring cost-program failure: identified savings that never ' +
          'reach the P&L. Without a defensible baseline, GL tie-out, and ' +
          'finance sign-off, a large share of the identified number leaks ' +
          'between projected and realized and must be discounted out of any ' +
          'honest forecast.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'Value erosion from projected-to-realized leakage — the canonical ' +
            'cost-program failure; a planning range driven by realization ' +
            'discipline (Hackett / value-assurance practice; estimate — ' +
            'confirm).',
          label: 'planning-range',
        },
      },
      {
        factor: 'PortCo adoption resistance',
        rationale:
          'Autonomous PortCos resist centrally-mandated change; a negotiated ' +
          'rate or shared-services move that PortCos do not adopt saves ' +
          'nothing. Adoption resistance is the dominant non-analytical reason ' +
          'HoldCo cost programs under-deliver and bites the leverage and ' +
          'rationalization spines directly.',
        typicalHaircut: {
          low: 0.15,
          high: 0.45,
          basis:
            'Forecast erosion from PortCo non-adoption of group terms; a ' +
            'planning range driven by the federation change problem (HoldCo / ' +
            'PE value-creation practice; estimate — confirm).',
          label: 'planning-range',
        },
      },
      {
        factor: 'Switching, migration, and exit cost',
        rationale:
          'Gross consolidation savings are eroded by switching / migration ' +
          'cost, contract-exit / termination penalties, and volume the ' +
          'surviving vendor cannot absorb. A gross-savings forecast that ' +
          'ignores these overstates the prize; only the net saving is real.',
        typicalHaircut: {
          low: 0.1,
          high: 0.35,
          basis:
            'Forecast erosion from switching, migration, and exit cost ' +
            'against gross consolidation savings; a planning range (sourcing ' +
            'practice; estimate — confirm).',
          label: 'planning-range',
        },
      },
      {
        factor: 'Spend-data readiness and contract-timing gates',
        rationale:
          'Every lever depends on the foundation — a unified vendor master, ' +
          'a classified spend cube, and a federated contract calendar. Where ' +
          'vendor records are fragmented and contracts are not extracted, the ' +
          'reachable value is capped and the timing is gated by contract ' +
          'renewals the program cannot accelerate.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from weak spend-data readiness and contract-' +
            'renewal timing gates; a planning range (procurement-data ' +
            'practice; estimate — confirm).',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Strategic-sourcing savings on rationalized spend',
        range: {
          low: 8,
          high: 15,
          basis:
            'Savings on addressable / rationalized spend from consolidating ' +
            'onto fewer suppliers at enterprise rates, higher on poorly-' +
            'managed indirect categories; a planning range (Hackett / ' +
            'McKinsey / Deloitte procurement studies; estimate — confirm ' +
            'against client spend and current pricing).',
          label: 'planning-range',
        },
        measuredAs:
          'Percent net savings on addressable / rationalized spend against ' +
          'the baseline.',
      },
      {
        lever: 'Software / SaaS waste recovery',
        range: {
          low: 20,
          high: 35,
          basis:
            'Recoverable share of unmanaged SaaS spend from eliminating ' +
            'unused licenses, shelfware, and over-provisioned tiers and ' +
            'consolidating functional overlap; a planning range (Gartner / ' +
            'Forrester / SaaS-management studies; estimate — confirm on ' +
            'client telemetry).',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in software / SaaS spend after license-vs-usage ' +
          'rationalization.',
      },
      {
        lever: 'Shared-services / GBS efficiency on consolidated functions',
        range: {
          low: 20,
          high: 40,
          basis:
            'Efficiency gain on back-office functions moved from per-PortCo ' +
            'teams into shared services / GBS, depending on baseline ' +
            'maturity; a planning range (Hackett GBS studies; estimate — ' +
            'confirm against client baseline).',
          label: 'planning-range',
        },
        measuredAs:
          'Percent reduction in fully-loaded cost of the consolidated back-' +
          'office function.',
      },
      {
        lever: 'Working-capital release from payment-terms alignment',
        range: {
          low: 5,
          high: 20,
          basis:
            'Working capital released by aligning and selectively extending ' +
            'DPO on appropriate suppliers, coordinated with treasury; cash ' +
            'released ≈ (annual spend ÷ 365) × days extended. A planning ' +
            'range bounded by supplier health and the cash forecast ' +
            '(treasury / working-capital practice; estimate — confirm with ' +
            'client data).',
          label: 'planning-range',
        },
        measuredAs:
          'Percent of addressable AP balance released as working capital from ' +
          'terms alignment.',
      },
    ],
    timeToValueBand:
      '2–4 months to first operational signal (the unified vendor master, the ' +
      'classified spend cube, the first internal price-spread and software-' +
      'waste findings); 12–24 months to a settled, realized result, because ' +
      'the largest savings are gated by contract-renewal timing and PortCo ' +
      'adoption and only book once consolidations land and the realization ' +
      'ledger ties them to the GL.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Per-PortCo ERP / AP systems',
        role:
          'The source systems of record for vendor records, purchase orders, ' +
          'and accounts-payable transactions in each operating subsidiary — ' +
          'the fragmented base the vendor master and spend cube are built ' +
          'from.',
        examples: ['SAP S/4HANA', 'Oracle Financials', 'NetSuite', 'Workday'],
      },
      {
        name: 'Spend-analytics / procurement platform',
        role:
          'Where group spend is classified, analysed, and sourced — the ' +
          'own-it question is whether the classified spend graph lives on the ' +
          'client lakehouse or inside the vendor’s cloud.',
        examples: ['Coupa', 'SAP Ariba / Spend', 'GEP Smart', 'Sievo'],
      },
      {
        name: 'Contract-lifecycle-management (CLM) system',
        role:
          'The operational repository for contracts; a legitimate managed ' +
          'tool, but the extracted-terms data product and the renewal ' +
          'calendar analytics are own-it on the lakehouse.',
        examples: ['Icertis', 'SirionLabs', 'Ironclad', 'DocuSign CLM'],
      },
      {
        name: 'SaaS-management / software-asset-management (SAM) tooling',
        role:
          'Supplies software usage telemetry and entitlement discovery for ' +
          'license-vs-usage reconciliation; the unified analysis across the ' +
          'full estate, contracts, and spend is own-it.',
        examples: ['Zylo', 'Productiv', 'Flexera', 'ServiceNow SAM'],
      },
      {
        name: 'Client lakehouse (the owned spend graph)',
        role:
          'The own-it platform where the canonical vendor master, classified ' +
          'spend cube, contract-terms graph, and savings-realization ledger ' +
          'live as a compounding client-owned asset reused across every ' +
          'future negotiation, M&A integration, and budget cycle.',
        examples: [
          'Databricks lakehouse / Unity Catalog',
          'the client’s own cloud data platform',
        ],
      },
    ],
    roles: [
      {
        title: 'HoldCo Chief Financial Officer (CFO)',
        accountability:
          'Owns the cost program’s P&L impact and the realized-savings ' +
          'number — the realization ledger, the baselines, and the finance ' +
          'sign-off that makes savings credible.',
      },
      {
        title: 'Chief Procurement Officer / Head of Sourcing',
        accountability:
          'Owns vendor rationalization, the group spend taxonomy and vendor ' +
          'master, category strategy, and the enterprise-rate negotiations.',
      },
      {
        title: 'Head of Strategic Sourcing (category)',
        accountability:
          'Owns consolidation, price-variance analysis, and tail-spend ' +
          'management within assigned categories and the rationalization ' +
          'roadmap.',
      },
      {
        title: 'Head of Shared Services / GBS',
        accountability:
          'Owns the shared-services / GBS optimization of duplicated back-' +
          'office functions and the structural cost-reduction lever.',
      },
      {
        title: 'General Counsel / Head of Legal',
        accountability:
          'Owns the contract obligations record, the federated renewal ' +
          'calendar, professional-services panels, and the auditor-' +
          'independence constraints on audit-firm consolidation.',
      },
      {
        title: 'PortCo CFO / General Manager',
        accountability:
          'Owns local buying and the adoption of group terms — the ' +
          'federation participant whose cooperation gates realized savings.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Auditor independence & mandatory rotation rules',
        relevance:
          'PCAOB / SEC independence prohibitions and EU audit-rotation rules ' +
          'constrain audit-firm consolidation — a governance boundary on the ' +
          'professional-services cost lever, not just a price decision.',
      },
      {
        name: 'Software-license compliance (ISO/IEC 19770 SAM)',
        relevance:
          'License-vs-usage rationalization must also surface under-licensing ' +
          'exposure to avoid trading a saving for a vendor true-up; SAM is a ' +
          'compliance discipline as well as a cost one.',
      },
      {
        name: 'Finance value-assurance & SOX controls',
        relevance:
          'Realized savings must reconcile to the GL with a defensible ' +
          'baseline, an owner, and finance sign-off under the institution’s ' +
          'financial controls — the discipline that makes the savings number ' +
          'auditable.',
      },
      {
        name: 'Third-party / vendor risk management (TPRM)',
        relevance:
          'Consolidation that concentrates spend on a critical vendor raises ' +
          'third-party and fourth-party (sub-processor) risk; TPRM caps ' +
          'concentration on mission-critical categories.',
      },
      {
        name: 'Data privacy & contract-confidentiality obligations',
        relevance:
          'Vendor, contract, and bank data carry confidentiality and privacy ' +
          'obligations; the owned spend graph and contract-terms graph must ' +
          'be governed with access and lineage controls on the client estate.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Vendor master',
        definition:
          'The canonical, deduplicated record of every true supplier — with ' +
          'corporate-family rollups — to which all the fragmented per-PortCo ' +
          'vendor records map, so total group spend per supplier is ' +
          'computable.',
      },
      {
        term: 'Spend cube',
        definition:
          'The classified, group-wide analytical base of spend sliceable by ' +
          'category × vendor × entity × time × cost-center — the foundation ' +
          'for duplicate detection, consolidation, and price-variance ' +
          'analysis.',
      },
      {
        term: 'Spend taxonomy',
        definition:
          'The canonical category / subcategory structure (e.g. UNSPSC or a ' +
          'tailored finserv taxonomy) into which every transaction is ' +
          'classified, owned and reconcilable to the client’s own chart of ' +
          'accounts.',
      },
      {
        term: 'Consolidation',
        definition:
          'Eliminating duplicate or functionally-overlapping vendors and ' +
          'moving fragmented spend onto fewer, better-priced suppliers — ' +
          'ranked on net savings × disruption × time-to-realize.',
      },
      {
        term: 'Realization ledger',
        definition:
          'The record that tracks every savings opportunity through ' +
          'projected → contracted → realized against a defensible baseline ' +
          'with finance sign-off and GL reconciliation — the proof that ' +
          'identified savings became booked savings.',
      },
      {
        term: 'Maverick (off-contract) spend',
        definition:
          'Spend that bypassed a negotiated contract or preferred supplier, ' +
          'buying at non-negotiated rates — direct leakage against the ' +
          'group’s enterprise agreements.',
      },
      {
        term: 'Tail spend',
        definition:
          'The long tail of small, fragmented transactions across many low-' +
          'value vendors — individually tiny, collectively material, and ' +
          'leakage-prone; managed via catalogs, P-cards, and aggregators ' +
          'rather than strategically sourced one by one.',
      },
      {
        term: 'Enterprise-rate (master) agreement',
        definition:
          'A group-wide agreement with volume tiers, most-favored-customer ' +
          'pricing, and uniform terms off which every PortCo buys — the ' +
          'mechanism that converts aggregated demand into leverage no single ' +
          'entity could command.',
      },
      {
        term: 'Hard savings vs cost avoidance',
        definition:
          'Hard savings are a cash / P&L reduction against the baseline; cost ' +
          'avoidance is a future cost not incurred — reported separately, ' +
          'because conflating them inflates the claimed value.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Cost & Vendor Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the HoldCo’s third-party spend is fragmented, ' +
        'duplicated, over-priced, or leaking — vendor records, classification, ' +
        'overlap, contracts, off-contract spend — with a unified-spend ' +
        'baseline, before a solution is shaped.',
      sections: [
        {
          heading: 'HoldCo spend and entity context',
          guidance:
            'Name the holding company and the PortCos / operating ' +
            'subsidiaries in scope, the ERP / AP systems each runs, and the ' +
            'scale and shape of total third-party / indirect spend. State ' +
            'whether any group-level spend visibility exists today.',
        },
        {
          heading: 'Baseline against the operating metrics',
          guidance:
            'Report the current value for each operating metric the function ' +
            'expects — addressable spend under management, savings realization ' +
            'rate, vendor-master concentration after normalization, internal ' +
            'price variance, software license utilization, maverick and tail ' +
            'spend share, contract renewal visibility, rationalized-category ' +
            'savings, concentration risk, DPO, and baseline integrity. For any ' +
            'metric not recorded, name it as a precise seed gap with its data ' +
            'source.',
        },
        {
          heading: 'Unified-spend and rationalization analysis',
          guidance:
            'Analyse what the unified vendor master and classified spend cube ' +
            'reveal — total group spend per true supplier and corporate ' +
            'family, the same-item internal price spread across PortCos, the ' +
            'functional-overlap clusters (software, security, professional ' +
            'services), and the software-waste / shelfware picture.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — fragmented vendor records, ' +
            'inconsistent / locked classification, functional-overlap blind ' +
            'spots, auto-renewal leakage, gross-savings overstatement, savings ' +
            'theater, PortCo non-adoption, rented spend intelligence — and ' +
            'state which are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the opportunity using the value-model benchmark ranges — ' +
            'strategic-sourcing savings on rationalized spend, software-waste ' +
            'recovery, GBS efficiency, working-capital release — explicitly ' +
            'haircut for realization leakage, PortCo adoption, switching cost, ' +
            'and data / contract-timing readiness. Every figure a labelled ' +
            'planning range and net, never gross identified savings.',
        },
        {
          heading: 'Own-it vs rent posture',
          guidance:
            'State whether the vendor master, classified spend cube, ' +
            'contract-terms graph, and savings logic are owned on the client ' +
            'lakehouse or rented inside a spend-analytics SaaS, and what the ' +
            'rented posture forfeits — the compounding owned asset, the join ' +
            'to contracts / treasury data, and the ability to interrogate the ' +
            'savings number.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs — per-PortCo AP ' +
            'extracts, the contract repository, software usage telemetry — who ' +
            'owns each source, and what each gap blocks. A missing metric is a ' +
            'named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to — ' +
            'foundations first (vendor normalization, classification, contract ' +
            'calendar), then the fast rationalization wins, then the ' +
            'structural levers — and what the Move would and would not ' +
            'attempt, with the realization-and-adoption discipline wrapped ' +
            'around it.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Cost & Vendor Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-and-board-readable case for funding a cost / ' +
        'vendor AI Move — baseline, net and realizable forecast, the ' +
        'realization-and-adoption gate, cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'rationalization savings, negotiation leverage, and working ' +
            'capital, the time-to-value band, the realized (not identified) ' +
            'savings target, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — addressable spend, vendor-master concentration, internal ' +
            'price variance, software utilization, maverick / tail share, DPO. ' +
            'Where a baseline is a seed gap, say so and state what closing it ' +
            '(the unified vendor master and spend cube) requires before ' +
            'funding.',
        },
        {
          heading: 'Net, realizable value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, then ' +
            'apply each dominant haircut factor — realization leakage, PortCo ' +
            'adoption resistance, switching / migration / exit cost, spend-' +
            'data and contract-timing readiness — explicitly and show the ' +
            'haircut math. Present every saving as net and time-phased, never ' +
            'gross identified savings.',
        },
        {
          heading: 'Realization and adoption gate',
          guidance:
            'State explicitly how the case reports realized, net, GL-' +
            'reconciled savings over aspirational identified savings, and how ' +
            'PortCo adoption (the gate between negotiated and realized) is ' +
            'measured. Cite the savings-theater anti-pattern as a rejected ' +
            'option and separate hard savings from cost avoidance.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the per-PortCo ERP / AP ' +
            'systems, the contract repository, and software-usage telemetry, ' +
            'the LLM entity-resolution and classification models, and the ' +
            'operating-model change across procurement, legal, and the ' +
            'PortCos.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weak PortCo adoption, slower ' +
            'contract-renewal timing, and a concentration cap on critical ' +
            'categories. State the downside the CFO and board are ' +
            'underwriting.',
        },
        {
          heading: 'Own-it vs rent decision',
          guidance:
            'State the own-it decision — the unified vendor master, classified ' +
            'spend cube, contract-terms graph, and realization ledger on the ' +
            'client lakehouse as a compounding owned asset — and the surfaced ' +
            'rationale for any rent-side choice (reference data, a CLM tool, a ' +
            'tail-spend marketplace), rejecting the rented spend-analytics ' +
            'SaaS that holds the data and logic.',
        },
        {
          heading: 'Kill criteria and Tower measurement plan',
          guidance:
            'Name the conditions under which the Move should not be funded — ' +
            'no defensible baseline, no GL tie-out, no adoption mechanism — ' +
            'and state which operating metrics Tower will track to prove ' +
            'realized savings and the measurement cadence.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Cost & Vendor Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'cost / vendor AI capability — the owned spend graph on a client ' +
        'lakehouse, grounded in the function reference patterns and the own-it ' +
        'discipline.',
      sections: [
        {
          heading: 'Platform landing zone & private data plane',
          guidance:
            'Specify the cloud landing zone and private data plane the cost ' +
            'platform sits on — the client’s OWN lakehouse and governed ' +
            'catalog (e.g. Databricks / Unity Catalog) — so the unified vendor ' +
            'master, classified spend cube, contract-terms graph, and ' +
            'savings-realization ledger are owned client assets, not data on a ' +
            'spend-analytics vendor’s cloud. Reject the rented-destination ' +
            'posture explicitly.',
        },
        {
          heading: 'Ingestion & data-integration framework (own-it)',
          guidance:
            'Name the source feeds — every PortCo’s AP / PO / GL extracts, the ' +
            'contract repository, software-usage telemetry (SSO / admin / ' +
            'agent inventory), and the bank / payment data shared with ' +
            'treasury — and specify a metadata-driven, own-it ingestion ' +
            'framework landing into the client’s own catalog (a configurable ' +
            'ingestion framework / managed connectors), rejecting both a ' +
            'bespoke per-source build and a rented destination SaaS so the ' +
            'spend graph is fed continuously and owned.',
        },
        {
          heading: 'Owned spend graph & target-state architecture',
          guidance:
            'Lay out the architecture against the function reference patterns ' +
            '— the owned vendor-master & spend-cube data product, the net-' +
            'savings consolidation-opportunity engine, the federated contract ' +
            'calendar, the savings-realization ledger, the federated adoption ' +
            'governance — and the bronze / silver / gold layering that builds ' +
            'the owned, compounding spend graph.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope — LLM vendor normalization, spend ' +
            'classification, overlap detection & consolidation ranking, ' +
            'contract-term extraction, savings-realization tracking, maverick / ' +
            'tail monitoring — specify the value mechanism, the control ' +
            'posture, the human accountability point (where the CPO, legal, ' +
            'finance, and PortCos retain the decision), and the human-curation ' +
            'and escalation path.',
        },
        {
          heading: 'Governance, value-assurance & responsible-AI controls',
          guidance:
            'State the platform governance spine — catalog access / lineage ' +
            'controls, the finance value-assurance and SOX-auditable ' +
            'realization evidence, the auditor-independence and SAM-compliance ' +
            'constraints, third-party-risk concentration caps, and the human ' +
            'curation of high-stakes entity-resolution and contract ' +
            'extractions that bounds the design.',
        },
        {
          heading: 'Operating-model change and build approach',
          guidance:
            'Define how procurement, legal, shared services, and PortCo ' +
            'buying workflows change, who owns each change, and the build ' +
            'sequence — foundations first (vendor master, spend cube, contract ' +
            'calendar), then the fast rationalization wins, then the ' +
            'structural levers — with the realization-and-adoption wrap.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Cost & Vendor Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the cost / vendor AI capability so ' +
        'savings reach the P&L — booked, not identified — and the PortCos ' +
        'actually buy on the new terms.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and the unified vendor master / ' +
            'spend cube first, then the first fast rationalization wins ' +
            '(software waste, duplicate vendors, internal price harmonization), ' +
            'then the structural levers and enterprise-rate negotiations — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — the vendor ' +
            'master and spend cube, the contract calendar, consolidation ' +
            'ranking, negotiation, the realization ledger and finance sign-' +
            'off, PortCo adoption, and Tower measurement.',
        },
        {
          heading: 'PortCo adoption and federated-governance plan',
          guidance:
            'Define the federated-governance model — what is mandated vs ' +
            'recommended, the exception process, the category councils — and ' +
            'show each PortCo its own concrete saving (its price spread, its ' +
            'share of the enterprise rate), measuring adoption with compliance ' +
            'telemetry rather than assuming it.',
        },
        {
          heading: 'Savings-realization operating cadence',
          guidance:
            'Establish the realization cadence — the projected → contracted → ' +
            'realized funnel review, the defensible baselines, the hard-vs-' +
            'cost-avoidance separation, and the finance sign-off and GL ' +
            'reconciliation at the realized stage — so identified savings ' +
            'become booked savings.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for each ' +
            'metric — especially the savings realization rate, maverick / tail ' +
            'share, and rationalized-category savings that prove the program ' +
            'reached the P&L.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — PortCo non-adoption, realization leakage, ' +
            'critical-vendor over-concentration, contract-timing slippage, ' +
            'entity-resolution errors on top suppliers — with the escalation ' +
            'owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it — the foundation in place, a defensible ' +
            'baseline and GL tie-out, and an adoption mechanism for the ' +
            'PortCos.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Total group spend per true supplier and corporate family',
      authoritativeSource:
        'The canonical vendor master on the client lakehouse, resolving every ' +
        'PortCo’s fragmented vendor records into one supplier with corporate-' +
        'family rollups.',
      whatGoodEvidenceLooksLike:
        'Total group spend per true supplier computed across every PortCo, ' +
        'with the corporate-family hierarchy explicit and high-stakes rollups ' +
        'human-curated.',
      weakEvidenceToReject:
        'Spend reported against un-resolved vendor records (treating 40 ' +
        'records as 40 small suppliers), or a vendor count from a spend SaaS ' +
        'the client cannot interrogate or join to its own data.',
    },
    {
      claim: 'A savings opportunity’s realized P&L impact',
      authoritativeSource:
        'The savings-realization ledger, measuring booked net savings against ' +
        'a defensible, finance-agreed baseline and reconciled to the general ' +
        'ledger, with an owner and finance sign-off.',
      whatGoodEvidenceLooksLike:
        'A saving tracked projected → contracted → realized, net of switching ' +
        'and exit cost, controlled for volume, separated into hard savings vs ' +
        'cost avoidance, and tied out to actual GL spend.',
      weakEvidenceToReject:
        'An identified / projected savings number reported as realized, with ' +
        'no defensible baseline, no GL tie-out, hard savings conflated with ' +
        'cost avoidance, or a vendor’s self-graded savings-achieved figure.',
    },
    {
      claim: 'Same-item internal price spread across PortCos',
      authoritativeSource:
        'The price-variance mart on the classified spend cube, comparing unit ' +
        'prices for normalized items across PortCos, vendors, and time.',
      whatGoodEvidenceLooksLike:
        'A normalized, unit-matched comparison showing the high-vs-low ' +
        'internal price for the same item and the gap every entity has to the ' +
        'best internal price — the client’s own, irrefutable data.',
      weakEvidenceToReject:
        'A price comparison with no unit / SKU normalization (apples-to-' +
        'oranges), or a market benchmark used while ignoring the internal ' +
        'spread the group already owns and can act on immediately.',
    },
    {
      claim: 'The cost / vendor intelligence layer is owned, not rented',
      authoritativeSource:
        'The own-it architecture — the unified vendor master, classified ' +
        'spend cube, contract-terms graph, and savings-realization ledger on ' +
        'the client’s own lakehouse and governed catalog, joined to its ' +
        'contract and treasury data.',
      whatGoodEvidenceLooksLike:
        'The classified spend graph and savings logic live on the client ' +
        'estate, are tunable and reconcilable to the client’s COA, join to ' +
        'contracts and treasury, and persist as a compounding asset across ' +
        'future negotiations and budget cycles.',
      weakEvidenceToReject:
        'A spend-analytics SaaS that classifies and resolves vendors on its ' +
        'own cloud in its own taxonomy, hands back a savings number the client ' +
        'cannot interrogate, and takes the unified master and the logic with ' +
        'it when the subscription lapses.',
    },
    {
      claim: 'The net, realizable value of a cost / vendor AI Move',
      authoritativeSource:
        'The value model — rationalization, leverage, and working-capital ' +
        'spines, each haircut by realization leakage, PortCo adoption, ' +
        'switching cost, and data / contract-timing readiness — read against ' +
        'the client’s own unified spend.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with savings presented as ' +
        'net and time-phased, each haircut applied explicitly, gated on ' +
        'realization and adoption, and every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single gross identified-savings number, a saving with no net-of-' +
        'switching-cost or time-to-realize model, or a value claim with no ' +
        'path to booked P&L impact and no adoption gate.',
    },
  ],
};
