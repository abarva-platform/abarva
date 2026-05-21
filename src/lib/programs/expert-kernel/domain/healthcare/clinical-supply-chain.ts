// Domain Function Pack — Healthcare provider · Clinical supply chain.
//
// Function key: `clinical_supply_chain`.
//
// This pack covers the healthcare clinical supply chain: the end-to-end
// function that gets the right product to the right point of care at the
// right time and at the right cost. It spans demand and consumption planning,
// sourcing and contracting through the group purchasing organisation (GPO)
// and direct vendor agreements, the distribution network and inbound logistics,
// inventory management across the central storeroom and the clinical par
// locations, the procurement-to-pay cycle (requisition, purchase order,
// receipt, and the three-way match to the invoice), and the management of
// physician-preference items (PPI) — the high-cost implants and devices where
// clinician choice, not price alone, drives spend.
//
// The operating reality the pack encodes: supply is the second-largest cost
// line in a health system after labour, and it leaks at every node — an
// over-stocked par that expires, a stockout that triggers an emergency buy at
// list price, a PPI contract that is not enforced at the point of use, a PO
// that does not match the invoice and is paid anyway. The AI archetypes are
// the recurring bets against exactly that reality — clinical-supply demand
// forecasting, automated par-level optimisation, expiration-and-waste
// reduction, PPI cost analytics, shortage and substitute management, and
// PO–invoice match automation.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const clinicalSupplyChainPack: FunctionPack = {
  industryKey: 'healthcare-provider',
  functionKey: 'clinical_supply_chain',
  functionLabel: 'Clinical supply chain',
  summary:
    'The clinical supply chain is the function that gets the right product ' +
    'to the right point of care at the right time and at the right cost. It ' +
    'spans demand and consumption planning, sourcing and contracting through ' +
    'the group purchasing organisation and direct vendor agreements, the ' +
    'distribution network and inbound logistics, inventory across the ' +
    'central storeroom and the clinical par locations, the procurement-to-' +
    'pay cycle, and the management of physician-preference items — the high-' +
    'cost implants and devices where clinician choice drives spend. Its ' +
    'economics are supply expense as a share of net patient revenue, the ' +
    'cost of carrying and wasting inventory, and the clinical cost of a ' +
    'stockout. Supply does not leak in one place — it leaks at every node, ' +
    'from an over-stocked par that expires to a PPI contract that is never ' +
    'enforced at the point of use — so the function is judged on cost, ' +
    'availability, and waste across the whole network, not on any single ' +
    'purchase order.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'supply_expense_pct_net_patient_revenue',
      name: 'Supply expense as a percent of net patient revenue',
      definition:
        'Total supply expense — medical-surgical supplies, implants and ' +
        'devices, and clinical consumables — as a share of net patient ' +
        'revenue over the same period.',
      unit: '% of net patient revenue',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 25,
        basis:
          'Supply intensity varies with case mix and service-line ' +
          'concentration — a system heavy in orthopaedics, cardiology, and ' +
          'surgical volume runs higher than a primary-care-weighted one; ' +
          'the band spans those mixes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger supply-expense accounts reconciled against net ' +
        'patient revenue, sourced from the ERP / financial system.',
      whyItMatters:
        'It is the headline ratio of the function — supply is the second-' +
        'largest cost line after labour, and this ratio is the board-level ' +
        'measure of whether that cost is under control relative to the ' +
        'revenue it supports.',
    },
    {
      key: 'supply_cost_per_adjusted_patient_day',
      name: 'Supply cost per adjusted patient day',
      definition:
        'Total supply expense divided by adjusted patient days — inpatient ' +
        'days adjusted upward for outpatient volume — normalising supply ' +
        'cost to activity.',
      unit: 'USD per adjusted patient day',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 80,
        high: 220,
        basis:
          'Cost per adjusted patient day varies widely with acuity and ' +
          'service mix; the band spans a community hospital to an acuity-' +
          'heavy academic system. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The ERP / financial system supply-expense ledger reconciled ' +
        'against the adjusted-patient-day statistic from the decision-' +
        'support system.',
      whyItMatters:
        'It normalises supply cost to activity so trend and peer comparison ' +
        'are meaningful — a rising figure at flat acuity signals leakage ' +
        'that the absolute expense line can hide behind volume growth.',
    },
    {
      key: 'supply_cost_per_case',
      name: 'Supply cost per case',
      definition:
        'Total supply cost attributable to a procedural case — including ' +
        'implants, devices, and disposables — for a defined procedure or ' +
        'service line, measured per case.',
      unit: 'USD per case',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 150,
        high: 6000,
        basis:
          'Supply cost per case spans two orders of magnitude by procedure ' +
          '— a low-supply endoscopy to a high-cost joint replacement or ' +
          'spinal fusion; the band is meaningful only within one procedure ' +
          'family. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Case-costing data joining the surgical case record to item-level ' +
        'consumption captured at the point of use.',
      whyItMatters:
        'It is the metric that exposes physician-preference-item variation ' +
        '— the same procedure done by two surgeons can differ several-fold ' +
        'in supply cost, and per-case visibility is what makes that ' +
        'variation actionable.',
    },
    {
      key: 'stockout_rate',
      name: 'Stockout / backorder rate',
      definition:
        'The share of item-location demand events where the needed item is ' +
        'unavailable at the clinical par location at the moment of need, ' +
        'whether through a stockout, a backorder, or an unfilled ' +
        'replenishment.',
      unit: '% of demand events unfilled at point of need',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Stockout rates vary with par accuracy, distribution ' +
          'reliability, and the depth of national supply disruption; the ' +
          'band spans a well-run network to a strained one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The inventory-management system replenishment log, comparing ' +
        'demand and pick events against on-hand availability by item and ' +
        'location.',
      whyItMatters:
        'A stockout is the clinical failure mode of the supply chain — it ' +
        'delays care, forces substitution, and triggers an emergency buy at ' +
        'list price; it is the metric where cost and patient safety meet.',
    },
    {
      key: 'inventory_turns',
      name: 'Inventory turns',
      definition:
        'The number of times the supply inventory is consumed and ' +
        'replenished over a year — annual supply usage at cost divided by ' +
        'the average inventory value held.',
      unit: 'turns per year',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 6,
        high: 18,
        basis:
          'Inventory turns vary with distribution model — a low-unit-of-' +
          'measure or stockless model turns far faster than a bulk-' +
          'storeroom one; the band spans those models. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The inventory-management system, comparing annual usage at cost ' +
        'against the average on-hand inventory valuation.',
      whyItMatters:
        'Turns are the working-capital efficiency measure of the function ' +
        '— low turns mean cash tied up in shelved product and a higher ' +
        'share of inventory that will expire before it is used.',
    },
    {
      key: 'expired_product_waste_rate',
      name: 'Expired-product waste rate',
      definition:
        'The value of product discarded for reaching its expiration date ' +
        'before use, as a share of total supply expense over the same ' +
        'period.',
      unit: '% of supply expense discarded expired',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 4,
        basis:
          'Expiry waste varies with par-level discipline, first-expiry-' +
          'first-out rotation, and the share of short-dated and consigned ' +
          'product; the band spans a disciplined operation to a loose one. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The inventory-management system expiry and write-off log, valued ' +
        'against item cost.',
      whyItMatters:
        'Expired product is supply cost spent on care never delivered — it ' +
        'is pure avoidable loss, and it is the clearest signal that par ' +
        'levels are set above real consumption.',
    },
    {
      key: 'ppi_cost_variance',
      name: 'Physician-preference-item cost variance',
      definition:
        'The spread in supply cost for the same procedure across surgeons ' +
        'or implant vendors, driven by physician-preference-item choice — ' +
        'measured as the variance, or the high-to-low ratio, of per-case ' +
        'PPI cost within a procedure family.',
      unit: 'ratio of highest to lowest per-case PPI cost',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1.3,
        high: 2.5,
        basis:
          'PPI cost variance within a procedure family depends on how ' +
          'concentrated the vendor base is and whether a price ceiling is ' +
          'enforced; the band spans a managed category to an unmanaged one. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Case-costing data joining item-level PPI consumption to the ' +
        'surgeon and the procedure, sourced from the surgical record and ' +
        'the item master.',
      whyItMatters:
        'PPI is where the largest controllable supply dollars sit — ' +
        'unwarranted variation in implant and device choice for clinically ' +
        'equivalent cases is the single biggest savings lever in the ' +
        'function.',
    },
    {
      key: 'distribution_fill_rate',
      name: 'Distribution fill rate',
      definition:
        'The share of ordered lines the distributor or manufacturer ships ' +
        'complete and on the requested date — the supply-side counterpart ' +
        'to the stockout rate.',
      unit: '% of ordered lines filled complete and on time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 90,
        high: 99,
        basis:
          'Distribution fill rate depends on the distributor, the product ' +
          'category, and the depth of national backorder; the band spans a ' +
          'stable supply environment to a disrupted one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The ERP / procurement system, comparing purchase-order lines ' +
        'against receipts by quantity and date.',
      whyItMatters:
        'Fill rate is how well the upstream network performs — a falling ' +
        'fill rate is the leading indicator of a stockout and an emergency ' +
        'buy, and it tells the function how much buffer it must carry.',
    },
    {
      key: 'vendor_lead_time_reliability',
      name: 'Vendor lead-time reliability',
      definition:
        'The share of purchase orders received within the vendor’s ' +
        'committed lead time — a measure of how predictable, not just how ' +
        'fast, replenishment is.',
      unit: '% of POs received within committed lead time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 97,
        basis:
          'Lead-time reliability varies by vendor and category and ' +
          'degrades sharply during supply disruption; the band spans a ' +
          'reliable vendor base to a volatile one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The ERP / procurement system, comparing PO acknowledgement and ' +
        'committed dates against actual receipt dates.',
      whyItMatters:
        'Unreliable lead time, more than long lead time, forces the ' +
        'function to carry safety stock — predictability is what lets par ' +
        'levels and turns be optimised without risking a stockout.',
    },
    {
      key: 'po_invoice_match_rate',
      name: 'PO–invoice three-way match rate',
      definition:
        'The share of supplier invoices that match their purchase order ' +
        'and receipt on price, quantity, and item within tolerance, and ' +
        'pass to payment without manual exception handling.',
      unit: '% of invoices matched without manual exception',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 75,
        high: 95,
        basis:
          'Three-way match rates depend on item-master accuracy, contract-' +
          'price loading, and receipt discipline; the band spans a clean ' +
          'procurement operation to an exception-heavy one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The ERP / accounts-payable system, comparing matched invoices ' +
        'against the total invoice volume by exception status.',
      whyItMatters:
        'Every unmatched invoice is a manual touch and a risk of paying ' +
        'off-contract or a duplicate — the match rate is the efficiency ' +
        'and the leakage-control measure of the procurement-to-pay cycle.',
    },
    {
      key: 'par_level_accuracy',
      name: 'Par-level accuracy',
      definition:
        'The share of clinical par locations whose set par levels align ' +
        'with actual consumption — neither chronically over-stocked nor ' +
        'driving repeated stockouts and emergency replenishment.',
      unit: '% of par locations with consumption-aligned levels',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 90,
        basis:
          'Par accuracy depends on how recently and how data-drivenly pars ' +
          'were last reviewed; the band spans pars set once and left to ' +
          'pars maintained against live consumption. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The inventory-management system, comparing set par levels against ' +
        'measured consumption and stockout / overstock events by location.',
      whyItMatters:
        'Par levels are the control surface of clinical inventory — wrong ' +
        'pars drive both expiry waste (too high) and stockouts (too low), ' +
        'so par accuracy is the upstream cause of two of the function’s ' +
        'costliest failure modes.',
    },
    {
      key: 'contract_price_compliance_rate',
      name: 'Contract-price compliance rate',
      definition:
        'The share of supply spend transacted at the contracted price — ' +
        'on a GPO or direct contract — rather than at an off-contract, list, ' +
        'or maverick-buy price.',
      unit: '% of spend at contracted price',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'Price compliance depends on how completely contract prices are ' +
          'loaded to the item master and how disciplined requisitioning ' +
          'is; the band spans a managed catalog to a leaky one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The ERP / procurement system, comparing transacted prices against ' +
        'the loaded contract-price file from the GPO and direct vendors.',
      whyItMatters:
        'Off-contract and maverick buying is silent leakage — the system ' +
        'has negotiated a price and then pays more than it; compliance is ' +
        'the metric that recovers savings already negotiated.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'par_level_drift',
      name: 'Par-level drift',
      description:
        'Par levels are set once at go-live, or set by a clinician’s ' +
        'comfort rather than by data, and then never revisited as case ' +
        'volume and practice shift — so pars drift out of alignment with ' +
        'real consumption, simultaneously over-stocking slow movers and ' +
        'under-stocking fast ones.',
      detectionSignal:
        'Par-level accuracy is low; the same locations show both expiry ' +
        'write-offs and stockouts; pars have not been reviewed within the ' +
        'last operating year.',
      diagnosticQuestion:
        'When were clinical par levels last reviewed against actual ' +
        'consumption, and how are they kept current as case volume changes?',
    },
    {
      key: 'expiry_waste',
      name: 'Expired-product waste',
      description:
        'Product reaches its expiration date on the shelf — driven by ' +
        'over-set pars, weak first-expiry-first-out rotation, short-dated ' +
        'receipts, and consigned implant trays that are never reconciled — ' +
        'and is discarded as pure avoidable loss.',
      detectionSignal:
        'The expired-product waste rate is material; write-offs ' +
        'concentrate in specific high-cost categories and consigned ' +
        'inventory; expiry dates are not tracked at the item level.',
      diagnosticQuestion:
        'How much product is written off expired each year, in which ' +
        'categories, and is expiry tracked and rotated first-expiry-first-' +
        'out at every par?',
    },
    {
      key: 'ppi_cost_variation',
      name: 'Physician-preference-item cost variation',
      description:
        'Surgeons select implants and devices by long-standing preference ' +
        'and vendor relationship rather than by cost or outcome evidence, ' +
        'so clinically equivalent cases carry several-fold differences in ' +
        'supply cost — and the contract price ceiling, where one exists, is ' +
        'not enforced at the point of use.',
      detectionSignal:
        'PPI cost variance within a procedure family is wide; supply cost ' +
        'per case differs sharply by surgeon for the same procedure; ' +
        'price-ceiling contracts are not reflected in actual transacted ' +
        'cost.',
      diagnosticQuestion:
        'How wide is the supply-cost-per-case spread across surgeons for ' +
        'your highest-volume procedures, and is a PPI price ceiling ' +
        'enforced?',
    },
    {
      key: 'stockout_emergency_buy',
      name: 'Stockout-driven emergency buying',
      description:
        'A stockout at the point of care forces an unplanned, off-contract ' +
        'emergency purchase — at list price, with expedited freight — and ' +
        'consumes clinical and supply-staff time hunting for product, ' +
        'turning an availability failure into a cost failure as well.',
      detectionSignal:
        'Emergency and off-contract purchase orders are a recurring share ' +
        'of volume; expedited-freight charges are material; stockout events ' +
        'cluster around specific items or distribution gaps.',
      diagnosticQuestion:
        'How often does a stockout trigger an emergency off-contract buy, ' +
        'and what does that premium and the expediting cost add up to?',
    },
    {
      key: 'maverick_off_contract_spend',
      name: 'Maverick and off-contract spend',
      description:
        'Clinical and departmental staff order outside the managed ' +
        'catalog — special requests, rep-driven additions, direct ' +
        'punch-outs — so spend lands off-contract at a price above the ' +
        'negotiated rate, and the savings already negotiated quietly ' +
        'erode.',
      detectionSignal:
        'Contract-price compliance is low; a long tail of special-request ' +
        'and non-catalog purchase orders; the same item bought at multiple ' +
        'prices.',
      diagnosticQuestion:
        'What share of supply spend is transacted off the managed catalog ' +
        'or off-contract, and what price premium does that carry?',
    },
    {
      key: 'invoice_match_exceptions',
      name: 'PO–invoice match exception load',
      description:
        'Supplier invoices fail the three-way match — on price, quantity, ' +
        'or item — because the item master is stale, contract prices are ' +
        'not loaded, or receipts are not posted, so a large share of ' +
        'invoices fall to manual exception handling and risk being paid ' +
        'off-contract or twice.',
      detectionSignal:
        'The PO–invoice match rate is low; accounts-payable carries a ' +
        'standing exception backlog; price-discrepancy and duplicate-' +
        'payment recoveries are material.',
      diagnosticQuestion:
        'What share of supplier invoices fail the three-way match, and ' +
        'what does the manual exception handling and the off-contract ' +
        'leakage cost?',
    },
    {
      key: 'supply_disruption_exposure',
      name: 'Supply-disruption and shortage exposure',
      description:
        'A national backorder or manufacturer disruption hits an item with ' +
        'no qualified substitute identified, no consumption visibility, and ' +
        'no allocation plan — so the function reacts late, hoards, or ' +
        'cancels cases instead of managing the shortage deliberately.',
      detectionSignal:
        'Distribution fill rate and vendor lead-time reliability are ' +
        'falling; shortages are discovered at the par rather than ' +
        'forecast; no maintained substitute or clinically-equivalent ' +
        'mapping exists.',
      diagnosticQuestion:
        'How early does the function see a developing shortage, and is ' +
        'there a qualified-substitute mapping and an allocation plan before ' +
        'product runs out?',
    },
    {
      key: 'item_master_data_decay',
      name: 'Item-master and data decay',
      description:
        'The item master accumulates duplicate items, inconsistent units ' +
        'of measure, stale prices, and unmapped manufacturer numbers — so ' +
        'spend cannot be analysed cleanly, the three-way match fails, and ' +
        'every downstream model is built on dirty foundational data.',
      detectionSignal:
        'Duplicate and inactive items clutter the master; unit-of-measure ' +
        'and price errors recur; spend analytics cannot roll up reliably to ' +
        'a category or a manufacturer.',
      diagnosticQuestion:
        'How clean is the item master — duplicates, units of measure, ' +
        'contract-price loading, manufacturer mapping — and who owns its ' +
        'governance?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'clinical_supply_demand_forecasting',
      name: 'Clinical-supply demand forecasting',
      valueMechanism:
        'A model forecasts item-level consumption from the surgical and ' +
        'procedure schedule, historical usage, seasonality, and case-mix ' +
        'signals, and drives replenishment and buying from that forecast ' +
        'rather than from static reorder points. Value comes from carrying ' +
        'less safety stock while raising availability — fewer stockouts and ' +
        'fewer emergency buys at the same time as higher inventory turns.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical item-level consumption by location from the inventory-' +
          'management system',
        'The forward surgical and procedure schedule and case-mix data',
        'Vendor lead-time and distribution fill-rate history',
        'A clean item master with consistent units of measure',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes replenishment quantities; a supply-chain ' +
          'planner reviews exceptions and owns any clinically sensitive or ' +
          'high-value buy.',
        'A forecast trained on a disrupted period will under- or over-' +
          'predict — the model must be revalidated as demand patterns and ' +
          'the case mix shift.',
        'For clinically critical items the forecast is a floor, not a ' +
          'ceiling — a safety buffer is held deliberately and is not ' +
          'optimised away.',
      ],
      metricsMoved: [
        'stockout_rate',
        'inventory_turns',
        'expired_product_waste_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'automated_par_optimization',
      name: 'Automated par-level optimisation',
      valueMechanism:
        'A model continuously recomputes the optimal par level for every ' +
        'item-location pair from measured consumption, replenishment ' +
        'cadence, and lead-time variability, and proposes par changes ' +
        'instead of leaving pars static. Value comes from correcting the ' +
        'par drift that causes both expiry waste (pars too high) and ' +
        'stockouts (pars too low) — raising par-level accuracy across the ' +
        'network.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Item-location consumption history from the inventory-management ' +
          'system',
        'Current par settings and the replenishment cadence by location',
        'Stockout and overstock event data by item and location',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes par changes; a supply-chain lead and the ' +
          'clinical-unit owner review and approve before a par is changed.',
        'Pars for low-frequency, high-criticality items must not be ' +
          'optimised to zero on thin data — a minimum-stock rule overrides ' +
          'the model for critical items.',
        'Par changes must be staged and monitored — a large simultaneous ' +
          'reset across many locations can mask whether the model is ' +
          'right.',
      ],
      metricsMoved: [
        'par_level_accuracy',
        'expired_product_waste_rate',
        'stockout_rate',
        'inventory_turns',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'expiration_waste_reduction',
      name: 'Expiration and waste reduction',
      valueMechanism:
        'A model tracks item-level expiration dates across pars and the ' +
        'storeroom, predicts which lots will expire before they are used, ' +
        'and prompts first-expiry-first-out rotation, redistribution to a ' +
        'higher-consumption location, or a return before the date passes. ' +
        'Value comes from converting product that would be written off ' +
        'expired into product that is used — directly cutting the waste ' +
        'rate.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Item-level lot and expiration-date data captured at receipt',
        'Consumption velocity by item and location',
        'Redistribution and vendor-return policy and logistics',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags at-risk lots and proposes a rotation or ' +
          'redistribution; storeroom staff execute and confirm the ' +
          'physical move.',
        'It depends on lot and expiry data being captured accurately at ' +
          'receipt — the model is only as good as the scan discipline ' +
          'feeding it.',
        'Redistribution must respect sterility, storage, and chain-of-' +
          'custody rules — product cannot be moved in ways that compromise ' +
          'it.',
      ],
      metricsMoved: [
        'expired_product_waste_rate',
        'inventory_turns',
        'supply_expense_pct_net_patient_revenue',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'ppi_cost_analytics',
      name: 'Physician-preference-item cost analytics',
      valueMechanism:
        'A model joins item-level PPI consumption to the surgeon, the ' +
        'procedure, and the clinical outcome, normalises for case acuity, ' +
        'and surfaces unwarranted cost variation — clinically equivalent ' +
        'cases carrying several-fold cost differences — as a ranked, ' +
        'evidence-based opportunity for a value-analysis conversation. ' +
        'Value comes from reducing PPI cost variance and lifting contract-' +
        'price compliance where a managed ceiling exists.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Case-costing data joining PPI consumption to surgeon and ' +
          'procedure',
        'Clinical-outcome data to normalise for acuity and equivalence',
        'GPO and direct PPI contract terms, including any price ceiling',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces the cost variation and the evidence; the ' +
          'value-analysis committee and the surgeons own any change in ' +
          'product choice — clinical judgement is not overridden by cost.',
        'Variation must be normalised for genuine clinical difference ' +
          'before it is called unwarranted — flagging a justified high-cost ' +
          'choice erodes clinician trust.',
        'Outcome data must be robust enough to support an equivalence ' +
          'claim — a cost case made on weak outcome evidence is unsafe.',
      ],
      metricsMoved: [
        'ppi_cost_variance',
        'supply_cost_per_case',
        'contract_price_compliance_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'shortage_substitute_management',
      name: 'Shortage and substitute management',
      valueMechanism:
        'An agent monitors backorder notices, fill-rate signals, and ' +
        'vendor lead-time drift to detect a developing shortage early, ' +
        'maps the affected item to a maintained set of qualified clinically-' +
        'equivalent substitutes, and proposes an allocation and conversion ' +
        'plan. Value comes from managing a shortage deliberately — ahead of ' +
        'the stockout — rather than reacting with hoarding, emergency buys, ' +
        'or cancelled cases.',
      adoptionProfile: 'early',
      dataDependencies: [
        'Vendor backorder and allocation notices and distribution fill-' +
          'rate data',
        'A maintained qualified-substitute and clinical-equivalence mapping',
        'Current on-hand and in-transit inventory by item and location',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent detects and proposes; a substitution is a clinical ' +
          'decision — pharmacy, the value-analysis team, or the clinical ' +
          'owner approves any product conversion.',
        'The qualified-substitute mapping must be clinician-validated and ' +
          'kept current — an unvetted substitute is a patient-safety risk.',
        'Allocation under genuine scarcity must follow an explicit, ' +
          'documented fairness rule, not be left to whoever orders first.',
      ],
      metricsMoved: [
        'stockout_rate',
        'distribution_fill_rate',
        'vendor_lead_time_reliability',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'po_invoice_match_automation',
      name: 'PO–invoice match automation',
      valueMechanism:
        'An agent performs the three-way match — invoice against purchase ' +
        'order against receipt — interprets price, quantity, and item ' +
        'discrepancies, clears the matches within tolerance straight to ' +
        'payment, and routes only genuine exceptions to a buyer with the ' +
        'discrepancy explained. Value comes from removing the manual ' +
        'exception-handling load and catching off-contract and duplicate ' +
        'invoices before they are paid.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Purchase-order, receipt, and invoice data from the ERP / ' +
          'accounts-payable system',
        'The loaded contract-price file from the GPO and direct vendors',
        'A clean item master with consistent units of measure and ' +
          'manufacturer mapping',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent clears matches within tolerance and routes exceptions; ' +
          'a buyer or accounts-payable specialist owns every genuine ' +
          'discrepancy and any payment release outside tolerance.',
        'Match tolerances must be set and governed deliberately — too ' +
          'loose and off-contract overpayments pass, too tight and the ' +
          'exception queue defeats the purpose.',
        'The contract-price file and the item master must be current — a ' +
          'stale price file makes the agent clear the wrong amount.',
      ],
      metricsMoved: [
        'po_invoice_match_rate',
        'contract_price_compliance_rate',
        'supply_expense_pct_net_patient_revenue',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'demand_driven_replenishment',
      name: 'Demand-driven replenishment layer',
      description:
        'A pattern that drives replenishment and par maintenance from a ' +
        'live consumption-and-schedule forecast rather than from static ' +
        'reorder points — continuously recomputing what each location ' +
        'needs from measured demand, the surgical schedule, and lead-time ' +
        'variability.',
      boundary:
        'It forecasts and proposes replenishment and par changes; a supply-' +
        'chain planner reviews exceptions and the clinical-unit owner ' +
        'approves par changes. It does not place a buy or change a par ' +
        'autonomously for critical items.',
      humanAccountabilityPoint:
        'The director of supply chain accountable for inventory ' +
        'availability and working capital.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'expiry_aware_inventory_control',
      name: 'Expiry-aware inventory-control pattern',
      description:
        'A pattern that tracks item-level lot and expiration data across ' +
        'every par and the storeroom, predicts at-risk lots, and drives ' +
        'first-expiry-first-out rotation, redistribution to higher-' +
        'consumption locations, and timely vendor returns before product ' +
        'expires.',
      boundary:
        'It tracks, predicts, and prompts; storeroom staff execute and ' +
        'confirm the physical rotation or move. It does not move product ' +
        'or authorise a return on its own.',
      humanAccountabilityPoint:
        'The inventory manager accountable for the expired-product waste ' +
        'rate and stock rotation.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'ppi_value_analysis_pattern',
      name: 'PPI value-analysis pattern',
      description:
        'A pattern that surfaces cost variation in physician-preference ' +
        'items — normalised for clinical equivalence — as ranked, ' +
        'evidence-based opportunities, and routes them through a value-' +
        'analysis committee that pairs cost data with surgeon clinical ' +
        'judgement to standardise where the evidence supports it.',
      boundary:
        'It surfaces variation and assembles the evidence; the value-' +
        'analysis committee and the surgeons own the product decision. It ' +
        'does not restrict a clinician’s product choice unilaterally.',
      humanAccountabilityPoint:
        'The value-analysis committee chair, accountable for clinically ' +
        'safe supply standardisation.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'shortage_resilience_pattern',
      name: 'Shortage-resilience and substitution pattern',
      description:
        'A pattern that monitors upstream supply signals for developing ' +
        'shortages, maintains a clinician-validated qualified-substitute ' +
        'mapping, and runs a deliberate allocation-and-conversion plan when ' +
        'a shortage hits — turning shortage management from reactive ' +
        'hoarding into a governed process.',
      boundary:
        'It detects, maps, and proposes an allocation plan; pharmacy, the ' +
        'value-analysis team, or the clinical owner approves any product ' +
        'conversion. It does not substitute a product autonomously.',
      humanAccountabilityPoint:
        'The supply-chain resilience lead, accountable for shortage ' +
        'response and substitution governance.',
      controlPosture: 'human-approval-required',
    },
    {
      key: 'procure_to_pay_match_pattern',
      name: 'Procure-to-pay automated-match pattern',
      description:
        'A pattern that automates the three-way match across purchase ' +
        'order, receipt, and invoice, clears in-tolerance matches straight ' +
        'to payment, and routes only genuine price, quantity, and item ' +
        'discrepancies to a buyer — closing the off-contract and duplicate-' +
        'payment leakage in the procurement-to-pay cycle.',
      boundary:
        'It matches and clears within governed tolerance and routes ' +
        'exceptions; a buyer or accounts-payable specialist owns every ' +
        'discrepancy and any out-of-tolerance payment release. It does not ' +
        'set tolerances or release an exception itself.',
      humanAccountabilityPoint:
        'The procurement and accounts-payable manager accountable for the ' +
        'match rate and contract-price compliance.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Clinical-supply value is realised in four distinct ways and a ' +
      'forecast must keep them separate. First, price capture: enforcing ' +
      'contract prices and cutting unwarranted PPI variation lowers the ' +
      'unit cost of what is bought — a recurring reduction in supply ' +
      'expense. Second, waste elimination: cutting expired-product write-' +
      'offs and over-stocking removes supply spend on product never used — ' +
      'also recurring. Third, working capital: higher inventory turns and ' +
      'leaner pars release cash tied up on the shelf — largely a one-time ' +
      'pull-forward, distinct from the recurring expense gains. Fourth, ' +
      'avoided cost: fewer stockouts mean fewer emergency list-price buys ' +
      'and less expedited freight, and fewer cancelled or delayed cases. ' +
      'The dominant constraint is clinical: the largest savings sit in ' +
      'physician-preference items, and that value is only reachable at the ' +
      'speed clinicians will standardise — cost cannot override clinical ' +
      'judgement, so the PPI upside is paced by the value-analysis process, ' +
      'not by the model. Price-capture and waste gains are recurring once ' +
      'realised; the working-capital gain is a one-time release.',
    dominantHaircutFactors: [
      {
        factor: 'Clinician adoption and PPI standardisation pace',
        rationale:
          'The largest supply savings are in physician-preference items, ' +
          'and they are only realised when surgeons agree to standardise. ' +
          'Clinical judgement and surgeon relationships govern the pace, so ' +
          'the modelled PPI upside is heavily haircut by how fast value ' +
          'analysis can move it.',
        typicalHaircut: {
          low: 0.25,
          high: 0.5,
          basis:
            'The share of a modelled PPI-standardisation gain not ' +
            'reachable within the planning horizon because clinician ' +
            'adoption paces it; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Item-master and source-system data quality',
        rationale:
          'Forecasting, par optimisation, spend analytics, and the three-' +
          'way match all depend on a clean item master with consistent ' +
          'units of measure, loaded contract prices, and accurate ' +
          'consumption capture. Dirty foundational data caps how much of ' +
          'the modelled value any model can deliver.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from item-master decay and inconsistent ' +
            'consumption capture; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Upstream supply volatility',
        rationale:
          'Distribution fill rate and vendor lead-time reliability are ' +
          'outside the provider’s control and degrade sharply during ' +
          'national disruption. Volatility forces safety stock to be ' +
          'carried and caps the turns and stockout gains a forecast can ' +
          'model.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Value erosion from supply-side volatility outside the ' +
            'provider’s control; a planning range driven by category and ' +
            'the disruption environment.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Workflow integration and storeroom-staff adoption',
        rationale:
          'Par changes, expiry rotation, and match exceptions only deliver ' +
          'value if the new workflow is embedded in storeroom and ' +
          'procurement operations rather than run alongside the old ' +
          'process. Partial adoption realises a fraction of the modelled ' +
          'saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Forecast erosion from partial workflow integration in ' +
            'storeroom and procurement operations; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Supply-expense reduction from price and waste',
        range: {
          low: 2,
          high: 8,
          basis:
            'Relative reduction in total supply expense from contract-' +
            'price capture, PPI standardisation, and waste elimination; a ' +
            'planning range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in total supply expense.',
      },
      {
        lever: 'PPI cost-per-case reduction in targeted categories',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in supply cost per case in actively ' +
            'managed physician-preference-item categories; a planning ' +
            'range, paced by clinician standardisation.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in supply cost per case for the ' +
          'targeted procedure families.',
      },
      {
        lever: 'Expired-product-waste reduction',
        range: {
          low: 20,
          high: 50,
          basis:
            'Relative reduction in expired-product write-offs from expiry-' +
            'aware inventory control and par optimisation; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the expired-product waste rate.',
      },
      {
        lever: 'Inventory-value release from higher turns',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative reduction in average on-hand inventory value from ' +
            'leaner pars and higher turns; a planning range — largely a ' +
            'one-time working-capital release.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in average on-hand inventory ' +
          'valuation.',
      },
    ],
    timeToValueBand:
      '3–6 months to first measurable operational signal (par-level ' +
      'accuracy, stockout rate, match-rate, waste write-offs); 12–24 ' +
      'months to a settled financial result, because PPI standardisation ' +
      'moves only as fast as the value-analysis process and a full case ' +
      'cohort must cycle before the per-case savings are proven.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'ERP / supply-chain management system',
        role:
          'The transactional system of record for the supply chain — the ' +
          'item master, requisitions, purchase orders, receipts, contracts, ' +
          'and the accounts-payable match. The financial backbone of the ' +
          'function.',
        examples: [
          'Oracle Fusion / PeopleSoft Supply Chain',
          'Workday Supply Chain Management',
          'Infor / Lawson Supply Chain',
        ],
      },
      {
        name: 'Inventory-management / point-of-use system',
        role:
          'Manages clinical par locations, on-hand inventory, replenishment ' +
          'and par levels, and item-level consumption captured at the point ' +
          'of use — the operational layer between the storeroom and the ' +
          'bedside.',
        examples: [
          'Epic supply-chain modules',
          'Tecsys WareFlex / point-of-use',
          'Owens & Minor / cabinet and RFID point-of-use systems',
        ],
      },
      {
        name: 'Item master and product-data layer',
        role:
          'The catalog of every stocked and special-request item — units ' +
          'of measure, manufacturer numbers, contract linkage, and category ' +
          'classification. The foundational data every analysis depends on.',
        examples: [
          'GHX item-master and data services',
          'GS1 / UDI-aligned product data',
          'ERP-native item master',
        ],
      },
      {
        name: 'GPO and contract-management system',
        role:
          'Holds group-purchasing-organisation and direct vendor contracts, ' +
          'tiered pricing, and price ceilings — the source of the ' +
          'contract-price file the match and compliance metrics run ' +
          'against.',
        examples: [
          'Vizient contract portfolio',
          'Premier contract management',
          'HealthTrust / direct-contract repositories',
        ],
      },
      {
        name: 'Surgical scheduling and case-costing system',
        role:
          'Holds the forward surgical and procedure schedule and the case-' +
          'level item consumption — the demand signal for forecasting and ' +
          'the join that makes supply cost per case and PPI variance ' +
          'visible.',
        examples: [
          'Epic OpTime / surgical scheduling',
          'Decision-support and cost-accounting systems',
          'Strata / case-costing platforms',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Supply Chain Officer / VP Supply Chain',
        accountability:
          'Owns the total cost, availability, and resilience of the ' +
          'clinical supply chain — supply expense as a share of net ' +
          'patient revenue.',
      },
      {
        title: 'Director of supply chain operations',
        accountability:
          'Owns distribution, inventory, par management, and storeroom ' +
          'operations — availability at the point of care and working ' +
          'capital.',
      },
      {
        title: 'Director of sourcing and contracting',
        accountability:
          'Owns GPO and direct contracting, price negotiation, and ' +
          'contract-price compliance.',
      },
      {
        title: 'Value-analysis committee chair',
        accountability:
          'Owns clinically safe supply standardisation — the governance ' +
          'body that pairs cost evidence with surgeon judgement on ' +
          'physician-preference items.',
      },
      {
        title: 'Inventory / materials manager',
        accountability:
          'Owns par accuracy, stock rotation, the expired-product waste ' +
          'rate, and point-of-use replenishment.',
      },
      {
        title: 'Procurement and accounts-payable manager',
        accountability:
          'Owns the procure-to-pay cycle — purchase orders, the three-way ' +
          'match, and supplier payment.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'FDA Unique Device Identification (UDI) rule',
        relevance:
          'Requires devices to carry a unique identifier and be tracked ' +
          'through distribution and use — the basis for item-level lot, ' +
          'expiry, and recall traceability in the clinical supply chain.',
      },
      {
        name: 'FDA medical-device recall and field-action requirements',
        relevance:
          'Govern how a recalled or field-corrected product must be ' +
          'identified, quarantined, and removed from every par — the ' +
          'function must be able to locate affected lots fast.',
      },
      {
        name: 'Joint Commission environment-of-care and supply-storage ' +
          'standards',
        relevance:
          'Set the standards for how supplies are stored, rotated, and ' +
          'kept within date at the point of care — the accreditation frame ' +
          'around par and storeroom management.',
      },
      {
        name: 'FDA drug- and device-shortage reporting framework',
        relevance:
          'Governs manufacturer shortage notification and shapes how a ' +
          'provider must anticipate, allocate, and substitute during a ' +
          'supply disruption.',
      },
      {
        name: 'USP and sterility / storage-condition standards',
        relevance:
          'Define storage, handling, and beyond-use conditions for ' +
          'sterile and temperature-sensitive product — the constraint on ' +
          'how product can be rotated, redistributed, or substituted.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Par level',
        definition:
          'The target on-hand quantity set for an item at a clinical ' +
          'location, which replenishment restores it to on each cycle.',
      },
      {
        term: 'Physician-preference item (PPI)',
        definition:
          'A high-cost implant or device — orthopaedic, cardiac, spinal — ' +
          'whose selection is driven by the operating clinician’s ' +
          'preference rather than by price alone.',
      },
      {
        term: 'Group purchasing organisation (GPO)',
        definition:
          'An entity that aggregates the purchasing volume of many ' +
          'providers to negotiate supplier contracts and tiered pricing on ' +
          'their behalf.',
      },
      {
        term: 'Three-way match',
        definition:
          'The control that an invoice agrees with its purchase order and ' +
          'its receipt on price, quantity, and item before it is paid.',
      },
      {
        term: 'Consignment inventory',
        definition:
          'Product — typically high-cost implants — held on site but owned ' +
          'by the vendor until it is used, at which point it is billed.',
      },
      {
        term: 'Stockout',
        definition:
          'The condition where a needed item is unavailable at the point ' +
          'of care at the moment of clinical need.',
      },
      {
        term: 'First-expiry-first-out (FEFO)',
        definition:
          'The rotation discipline of issuing the lot with the earliest ' +
          'expiration date first so product is used before it expires.',
      },
      {
        term: 'Maverick spend',
        definition:
          'Purchasing done outside the managed catalog and negotiated ' +
          'contracts, typically at a price above the contracted rate.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Clinical-Supply-Chain Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the clinical supply chain is leaking cost, wasting ' +
        'product, and failing availability — across price, inventory, PPI, ' +
        'and procure-to-pay — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Operation and network context',
          guidance:
            'Name the supply-chain operation in scope — facilities, the ' +
            'distribution model (bulk, low-unit-of-measure, stockless, ' +
            'consigned), the service-line and case mix that drives supply ' +
            'intensity, and the GPO affiliation. State which ERP, ' +
            'inventory, item-master, and contract systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — supply expense as a percent of net patient ' +
            'revenue, cost per adjusted patient day, cost per case, ' +
            'stockout rate, inventory turns, expired-product waste, PPI ' +
            'cost variance, distribution fill rate, lead-time reliability, ' +
            'PO–invoice match rate, par accuracy, contract-price ' +
            'compliance. For any metric not recorded, name it as a precise ' +
            'seed gap with its data source.',
        },
        {
          heading: 'Spend and PPI variation analysis',
          guidance:
            'Break supply spend down by category, by contract status (on- ' +
            'versus off-contract), and by manufacturer, and analyse PPI ' +
            'cost variation per case across surgeons for the highest-volume ' +
            'procedure families — separating clinically warranted ' +
            'difference from unwarranted variation.',
        },
        {
          heading: 'Waste, availability, and resilience analysis',
          guidance:
            'Quantify expired-product write-offs by category, stockout and ' +
            'emergency-buy events and their premium, and the exposure to ' +
            'upstream disruption — fill-rate and lead-time trend and ' +
            'whether a qualified-substitute mapping exists.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — par-level drift, expiry ' +
            'waste, PPI cost variation, stockout-driven emergency buying, ' +
            'maverick spend, invoice-match exception load, supply-' +
            'disruption exposure, item-master decay — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — price and waste reduction, PPI cost-per-' +
            'case reduction, inventory-value release — explicitly haircut ' +
            'by clinician adoption pace, data quality, and supply ' +
            'volatility. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'item-level consumption, case-level PPI cost — is a named ask, ' +
            'not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Clinical-Supply-Chain Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a clinical-supply-' +
        'chain AI Move on this operation — baseline, forecast, cost, and ' +
        'the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring supply-expense reduction, expired-waste reduction, ' +
            'and one-time inventory-value release, the time-to-value band, ' +
            'and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — supply expense ratio, cost per case, waste rate, ' +
            'turns, match rate. Where a baseline is a seed gap (case-level ' +
            'PPI cost is a common one), say so and state what closing it ' +
            'requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — clinician adoption ' +
            'pace, item-master data quality, supply volatility, workflow ' +
            'adoption — explicitly and show the haircut math. Keep ' +
            'recurring expense gains separate from the one-time working-' +
            'capital release.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the ERP, inventory, item-' +
            'master, contract, and case-costing systems, the item-master ' +
            'remediation the models depend on, and the operating-model ' +
            'change in storeroom and procurement operations.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under slow clinician adoption, a ' +
            'dirtier item master, and a more volatile supply environment. ' +
            'State the downside the CFO is underwriting.',
        },
        {
          heading: 'Clinical-governance posture',
          guidance:
            'For any PPI or substitution component, state how clinical ' +
            'judgement is protected — the value-analysis committee owns ' +
            'product decisions, cost never overrides clinical equivalence — ' +
            'and how the savings forecast is paced to that governance.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            '— for example, an item master too degraded to model against — ' +
            'and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including the ' +
            'lagged per-case PPI and waste metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Clinical-Supply-Chain Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'clinical-supply-chain AI capability, grounded in the function ' +
        'reference patterns and the clinical-governance frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — demand-driven replenishment, expiry-aware ' +
            'inventory control, PPI value analysis, shortage resilience, ' +
            'procure-to-pay automated match — and state which apply and ' +
            'how they connect across the network.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the ERP, inventory / point-of-use, item-master, ' +
            'contract-management, and surgical / case-costing ' +
            'integrations, the consumption and lot/expiry capture, the ' +
            'contract-price file load, and the item-master data-quality ' +
            'baseline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define the minimum-stock rules for critical ' +
            'items and the approval gates for par changes and ' +
            'substitutions.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how storeroom, par-management, procurement, and value-' +
            'analysis workflows change, how staff are redeployed from ' +
            'manual counting and matching, and who owns each change.',
        },
        {
          heading: 'Clinical-governance and responsible-AI controls',
          guidance:
            'State the value-analysis governance for PPI, the clinician-' +
            'validation requirement for the substitute mapping, the ' +
            'minimum-stock safeguards for critical items, and the ' +
            'regulatory frames (UDI, recall, Joint Commission, shortage ' +
            'reporting, USP) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence — item-master remediation first, ' +
            'then the consumption and forecast layer, then the match and ' +
            'PPI capabilities — the integration patterns, and the phased ' +
            'rollout across categories and facilities.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Clinical-Supply-Chain Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the clinical-supply-chain AI ' +
        'capability so value reaches supply expense and availability, not ' +
        'just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — item-master remediation and integration ' +
            'validation, a pilot category or facility, par and forecast ' +
            'rollout, value-analysis engagement on PPI — with milestones ' +
            'tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, item-master governance, par and inventory ' +
            'operations, procurement match, value-analysis and PPI ' +
            'engagement, Tower measurement.',
        },
        {
          heading: 'Staff adoption and redeployment approach',
          guidance:
            'Define the change runway for storeroom, procurement, and ' +
            'value-analysis staff — training, workflow change, and the ' +
            'redeployment of capacity the automation frees from manual ' +
            'counting and invoice matching — and how adoption is measured, ' +
            'not assumed.',
        },
        {
          heading: 'Clinician engagement plan',
          guidance:
            'Define how surgeons and clinical-unit owners are engaged on ' +
            'PPI standardisation and par changes — the value-analysis ' +
            'cadence, the evidence packaging, and how clinical trust is ' +
            'protected so cost change does not feel imposed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged per-case and waste metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — item-master data decay, slow clinician ' +
            'adoption, upstream supply disruption, partial workflow ' +
            'adoption — with the escalation owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Total supply expense and the supply-intensity ratio',
      authoritativeSource:
        'The ERP / financial-system general-ledger supply-expense ' +
        'accounts reconciled against net patient revenue and adjusted ' +
        'patient days.',
      whatGoodEvidenceLooksLike:
        'Supply expense rolled up from the ledger, broken down by category, ' +
        'and normalised to net patient revenue and adjusted patient days ' +
        'so trend and peer comparison are meaningful.',
      weakEvidenceToReject:
        'A single absolute expense figure with no normalisation to ' +
        'activity or revenue, or a category roll-up the dirty item master ' +
        'cannot support reliably.',
    },
    {
      claim: 'PPI cost variation across surgeons for the same procedure',
      authoritativeSource:
        'Case-costing data joining item-level PPI consumption to the ' +
        'surgeon and the procedure, normalised for case acuity.',
      whatGoodEvidenceLooksLike:
        'Per-case supply cost by surgeon for one procedure family, ' +
        'acuity-normalised, with clinically warranted difference ' +
        'separated from unwarranted variation.',
      weakEvidenceToReject:
        'A blended average supply cost per procedure with no surgeon-level ' +
        'breakdown, or a cost-variation claim with no acuity ' +
        'normalisation.',
    },
    {
      claim: 'Expired-product waste and the inventory-rotation discipline',
      authoritativeSource:
        'The inventory-management system expiry and write-off log valued ' +
        'against item cost, by category and location.',
      whatGoodEvidenceLooksLike:
        'Expired write-offs valued at item cost, broken down by category ' +
        'and location, with the share of consigned and short-dated product ' +
        'identified.',
      weakEvidenceToReject:
        'An estimated waste percentage with no item-level write-off log, ' +
        'or a figure that cannot separate expiry waste from damage or ' +
        'recall removal.',
    },
    {
      claim: 'Stockout events and the emergency-buy premium',
      authoritativeSource:
        'The inventory-management replenishment log for stockout events ' +
        'reconciled against the ERP for off-contract and expedited ' +
        'purchase orders.',
      whatGoodEvidenceLooksLike:
        'A count of stockout events by item and location joined to the ' +
        'emergency purchase orders they triggered, with the price premium ' +
        'and expedited freight quantified.',
      weakEvidenceToReject:
        'An anecdotal sense that stockouts happen, or an emergency-buy ' +
        'cost with no link to the stockout that caused it.',
    },
    {
      claim: 'The forecast value of a clinical-supply-chain AI Move',
      authoritativeSource:
        'The value model — price-capture, waste-elimination, working-' +
        'capital, and avoided-cost components, each haircut by its ' +
        'dominant factors — read against the specific case mix and ' +
        'contract base.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring expense gains separated from ' +
        'the one-time inventory release, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor or GPO ROI claim taken at ' +
        'face value, or a forecast that ignores the clinician-adoption ' +
        'pace on PPI.',
    },
  ],
};
