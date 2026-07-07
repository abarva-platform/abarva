// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Cargo & Charter Operations
// Code range: A3900-A4199
// Run: npx tsx src/scripts/seed/seed-airline-dom13-cargo.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineCargoPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_CARGO_PATTERNS: AirlineCargoPatternSeed[] = [
  {
    code: 'A3900',
    name: 'Cargo Capacity Sold Against Passenger Schedule Assumptions',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Cargo teams sell belly capacity based on the published passenger schedule, but aircraft swaps and load restrictions change usable cargo space close to departure. Shipments accepted against the planned aircraft are rolled or trucked, damaging shipper trust and yield.',
    keywords: ['cargo capacity', 'belly cargo', 'aircraft swap', 'load restriction', 'IATA Cargo-XML'],
    demoRelevant: true,
  },
  {
    code: 'A3901',
    name: 'eAWB Adoption Leaves Exception Paper Trail',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Electronic air waybill adoption looks high in aggregate, but exception lanes, special commodities, and interline shipments still require paper attachments. The cargo operation runs dual processes, and customs or claims teams cannot rely on a complete digital record.',
    keywords: ['eAWB', 'IATA Cargo-XML', 'customs', 'paper exception', 'air waybill'],
  },
  {
    code: 'A3902',
    name: 'Temperature-Control Chain Breaks At Ramp Handoff',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Pharma or perishable cargo is booked with temperature-control commitments, but ramp handoff timestamps and storage-condition evidence are not captured consistently. The shipment may arrive on time while the airline cannot prove cold-chain integrity.',
    keywords: ['cold chain', 'pharma cargo', 'IATA CEIV', 'ramp handoff', 'temperature control'],
  },
  {
    code: 'A3903',
    name: 'Dangerous Goods Declaration Not Matched To Load Plan',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Dangerous goods declarations are validated at acceptance but not reconciled against final ULD and aircraft load planning. A shipment can be compliant on paper yet positioned incorrectly relative to segregation, quantity, or aircraft restrictions.',
    keywords: ['dangerous goods', 'IATA DGR', 'ULD', 'load plan', 'segregation'],
  },
  {
    code: 'A3904',
    name: 'Cargo Revenue Forecast Ignores Passenger Network Recovery',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'Cargo forecasts extrapolate pandemic-era freighter and belly-yield patterns without resetting for passenger network recovery. The airline overcommits to cargo yield assumptions while belly capacity expands and market rates normalize.',
    keywords: ['cargo revenue', 'belly capacity', 'forecast', 'yield', 'network recovery'],
  },
  {
    code: 'A3905',
    name: 'Charter Quote Built Without Crew Duty Feasibility',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'Charter sales quotes aircraft and airport availability before validating crew duty, rest, and positioning requirements. The commercial offer is accepted, then operations discovers that the trip requires costly deadhead or cannot be flown legally.',
    keywords: ['charter', 'crew duty', 'Part 121', 'quote', 'positioning'],
  },
  {
    code: 'A3906',
    name: 'Cargo Claims Root Cause Lost In Vendor Handoffs',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Cargo damage and delay claims pass through warehouse, trucker, ground handler, and airline teams without a shared evidence timeline. Claims are paid or denied based on incomplete custody records, leaving repeated vendor failures uncorrected.',
    keywords: ['cargo claims', 'chain of custody', 'ground handler', 'warehouse', 'SLA'],
  },
  {
    code: 'A3907',
    name: 'ULD Inventory Drift Creates Ghost Capacity',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'ULD inventory is tracked across stations with delayed scans and manual corrections, so the planning system believes containers are available where they are not. Cargo capacity is sold but cannot be built because the physical ULD is missing or damaged.',
    keywords: ['ULD', 'container inventory', 'station scan', 'IATA ULD', 'cargo build'],
  },
  {
    code: 'A3908',
    name: 'Customs Filing Status Not Visible To Customer Service',
    officeCategory: 'front_office',
    failureRatePct: 50,
    description:
      'Cargo customer service agents can see shipment movement but not customs filing status, holds, or release evidence. They promise delivery based on flight arrival while the shipment is blocked in regulatory clearance.',
    keywords: ['customs filing', 'cargo service', 'shipment tracking', 'release status', 'IATA Cargo-XML'],
  },
  {
    code: 'A3909',
    name: 'Cargo Allotment Contract Not Reflected In Inventory Controls',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'Forwarder allotment commitments are managed in contracts and spreadsheets rather than enforced in cargo inventory controls. Sales teams overbook spot cargo into allotment space, then must roll either a strategic forwarder or a high-yield spot shipment.',
    keywords: ['cargo allotment', 'freight forwarder', 'inventory control', 'contract', 'yield'],
  },
  {
    code: 'A3910',
    name: 'Cargo AI Demand Forecast Uses Passenger Booking Proxy',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Cargo demand AI uses passenger booking velocity as a proxy for belly cargo demand, even though shipper behavior follows industrial, seasonal, and commodity cycles. The model forecasts capacity demand accurately for travel peaks but misses high-yield cargo surges.',
    keywords: ['cargo AI', 'demand forecast', 'belly cargo', 'model drift', 'commodity cycle'],
    demoRelevant: true,
  },
  {
    code: 'A3911',
    name: 'Cargo Pricing AI Ignores Handling Constraint Cost',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Cargo pricing AI optimizes rate and conversion but does not include special handling cost for pharma, live animals, dangerous goods, or oversize freight. The airline wins shipments that look profitable in price models and lose margin in warehouse execution.',
    keywords: ['cargo pricing AI', 'special handling', 'IATA CEIV', 'dangerous goods', 'margin'],
    demoRelevant: true,
  },
  {
    code: 'A3912',
    name: 'AI Load Plan Recommends Non-Compliant Segregation',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'AI load-planning recommendations optimize weight, balance, and speed but do not fully encode dangerous-goods segregation and aircraft-specific restrictions. Load controllers must catch the issue manually or risk a regulatory and safety violation.',
    keywords: ['load planning AI', 'IATA DGR', 'segregation', 'weight and balance', 'compliance'],
    demoRelevant: true,
  },
  {
    code: 'A3913',
    name: 'Cargo Document AI Misreads Handwritten Exceptions',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Document AI extracts air waybill, customs, and special-handling data from scanned documents but misreads handwritten exception notes. The structured record looks complete while critical handling instructions are missing from warehouse and ramp workflows.',
    keywords: ['document AI', 'air waybill', 'OCR', 'special handling', 'IATA Cargo-XML'],
    demoRelevant: true,
  },
  {
    code: 'A3914',
    name: 'Cargo GenAI Chatbot Quotes Outside Embargo Rules',
    officeCategory: 'front_office',
    failureRatePct: 53,
    description:
      'A generative AI cargo chatbot quotes delivery timelines without checking embargoes, station acceptance hours, or commodity restrictions. Shippers receive confident answers that cargo operations cannot honor, creating claims and relationship damage.',
    keywords: ['cargo chatbot', 'generative AI', 'embargo', 'service level', 'shipper'],
    demoRelevant: true,
  },
  {
    code: 'A3915',
    name: 'Cargo AI Vendor Contract Missing Exception Telemetry',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'The cargo AI vendor contract measures booking conversion but not exception frequency, rolled shipments, claims, or manual override rates. Source teams cannot determine whether the AI is creating profitable growth or moving work into operations.',
    keywords: ['cargo AI', 'vendor contract', 'exception telemetry', 'Source', 'claims'],
    demoRelevant: true,
  },
  {
    code: 'A3916',
    name: 'Computer Vision ULD Count Lacks Damage Classification',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Computer vision counts ULDs at the warehouse or ramp but does not classify damage or serviceability. Inventory accuracy improves on paper while damaged containers continue to appear as usable capacity.',
    keywords: ['computer vision', 'ULD', 'damage classification', 'cargo inventory', 'serviceability'],
    demoRelevant: true,
  },
  {
    code: 'A3917',
    name: 'AI Customs Screening Creates False Holds',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'AI customs-risk screening over-flags shipments from certain lanes because training data reflects historic enforcement intensity rather than current risk. Legitimate freight receives false holds, and the airline cannot explain the screening basis to shippers or regulators.',
    keywords: ['customs AI', 'risk screening', 'false hold', 'explainability', 'regulatory review'],
    demoRelevant: true,
  },
  {
    code: 'A3918',
    name: 'Cargo Capacity Dashboard Excludes Road Feeder Constraints',
    officeCategory: 'middle_office',
    failureRatePct: 51,
    description:
      'Cargo capacity dashboards show aircraft belly space but not road feeder capacity, dock time, or warehouse labor at origin and destination. Sales accepts cargo that can fly but cannot be moved through the ground network on time.',
    keywords: ['road feeder', 'cargo capacity', 'warehouse labor', 'dock time', 'RFS'],
  },
  {
    code: 'A3919',
    name: 'Pharma Lane Certification Not Tied To Staff Training',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'A cargo lane is marketed as pharma-certified, but staff training, equipment availability, and process evidence are not maintained at every station on the route. The commercial claim survives longer than the operational capability.',
    keywords: ['pharma lane', 'IATA CEIV', 'staff training', 'temperature control', 'station compliance'],
  },
  {
    code: 'A3920',
    name: 'Charter Profitability Excludes Repositioning Tail Risk',
    officeCategory: 'middle_office',
    failureRatePct: 48,
    description:
      'Charter profitability models include expected repositioning but not tail-risk scenarios such as weather diversion, curfew, crew legality, and maintenance at non-base stations. A small number of disrupted charters erase the margin on the program.',
    keywords: ['charter profitability', 'repositioning', 'crew legality', 'curfew', 'margin risk'],
  },
  {
    code: 'A3921',
    name: 'Cargo Screening SLA Detached From Flight Closeout',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Security screening is measured against warehouse SLA rather than the flight closeout time that determines whether freight actually travels. Shipments meet screening SLA and still miss departure because the SLA clock is misaligned to operational need.',
    keywords: ['cargo screening', 'TSA', 'flight closeout', 'warehouse SLA', 'departure'],
  },
  {
    code: 'A3922',
    name: 'Freighter Partnership Data Not Integrated With Customer Promise',
    officeCategory: 'front_office',
    failureRatePct: 50,
    description:
      'Partner freighter capacity is sold through SkyHarbor channels, but partner status events do not flow back into the customer tracking promise. Customer service sees a booked shipment and cannot explain partner-side delay, customs, or recovery actions.',
    keywords: ['freighter partner', 'shipment tracking', 'status event', 'customer promise', 'interline cargo'],
  },
  {
    code: 'A3923',
    name: 'Cargo Revenue Accounting Misses Multi-Leg Split',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Multi-leg cargo itineraries are billed and settled without clean split logic across operating carrier, trucking segment, and warehouse service fees. Revenue is recognized in the wrong segment, weakening route and partner profitability decisions.',
    keywords: ['cargo revenue accounting', 'multi-leg', 'settlement', 'warehouse fee', 'route profitability'],
  },
  {
    code: 'A3924',
    name: 'Live Animal Acceptance Rule Not Enforced In Booking',
    officeCategory: 'front_office',
    failureRatePct: 46,
    description:
      'Live animal acceptance restrictions by aircraft, temperature, route, and station are maintained in manuals but not enforced in the cargo booking workflow. A shipment can be accepted commercially and later refused operationally, creating customer and welfare risk.',
    keywords: ['live animal cargo', 'IATA LAR', 'booking control', 'temperature restriction', 'station rule'],
  },
  {
    code: 'A3925',
    name: 'Cargo Customer Portal Shows Milestones Without Exceptions',
    officeCategory: 'front_office',
    failureRatePct: 49,
    description:
      'The cargo portal shows standard milestones such as accepted, departed, arrived, and available for pickup but not exception reason, owner, or next action. Shippers see movement but not whether the shipment is stuck, recoverable, or at risk.',
    keywords: ['cargo portal', 'exception management', 'shipment milestone', 'shipper visibility', 'customer service'],
  },
  {
    code: 'A3926',
    name: 'Warehouse Automation Not Reconciled To Manual Overrides',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Warehouse automation records standard movement events, but supervisors override routings and staging locations during peaks without entering structured reasons. The system of record diverges from physical cargo location when the operation is under stress.',
    keywords: ['warehouse automation', 'manual override', 'cargo location', 'peak operation', 'scan compliance'],
  },
  {
    code: 'A3927',
    name: 'Cargo ESG Claim Lacks Shipment-Level Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 44,
    description:
      'Cargo sales offers lower-carbon shipping claims based on aggregate SAF or offset purchases without shipment-level attribution. Corporate shippers cannot use the claim in their own Scope 3 reporting, reducing the commercial value of the sustainability product.',
    keywords: ['cargo ESG', 'SAF', 'Scope 3', 'shipment attribution', 'sustainability claim'],
  },
  {
    code: 'A3928',
    name: 'High-Value Cargo Security Flag Lost At Interline Handoff',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'High-value cargo is flagged correctly inside SkyHarbor systems but the security handling code is not transmitted consistently to interline partners. The shipment receives standard handling after transfer, increasing theft and claims exposure.',
    keywords: ['high-value cargo', 'interline', 'security handling', 'IATA Cargo-XML', 'claims'],
  },
  {
    code: 'A3929',
    name: 'Cargo Modernization Business Case Ignores Claims Reduction',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      'Cargo modernization business cases focus on booking conversion and warehouse productivity while excluding claims reduction, shipper trust, and exception-cycle-time value. Moves teams underfund the controls that would make the cargo program defensible to operations and finance.',
    keywords: ['cargo modernization', 'business case', 'claims reduction', 'Moves', 'exception cycle time'],
    demoRelevant: true,
  },
];
