// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Revenue Management & Pricing
// Code range: A300-A599
// Run: npx tsx src/scripts/seed/seed-airline-dom01-revenue-mgmt.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineRevenuePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_REVENUE_PATTERNS: AirlineRevenuePatternSeed[] = [
  {
    code: 'A300',
    name: 'Revenue Management Model Stale On COVID Demand Mix',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'Revenue management models under-price premium cabins when 2019-2023 training data is loaded without a COVID exclusion window or demand-regime weighting. The optimizer treats leisure and VFR recovery demand as structurally permanent, so business-travel shoulder markets keep too many low fare buckets open while premium seats depart empty.',
    keywords: ['revenue management', 'COVID exclusion window', 'ATPCO', 'premium cabin', 'demand mix'],
    demoRelevant: true,
  },
  {
    code: 'A301',
    name: 'PSS Cutover Revenue Gap In Peak Booking Window',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      'A live Sabre-to-Amadeus Altéa cutover creates a mid-flight revenue gap when web, GDS, and call-center channels pause pricing requests at different times during a peak sale window. Fare shopping continues in cached channels, but confirmable inventory is unavailable for 48-72 hours, destroying several points of quarterly revenue before finance can separate true demand loss from reporting lag.',
    keywords: ['PSS migration', 'Sabre', 'Amadeus Altea', 'GDS', 'revenue leakage'],
    demoRelevant: true,
  },
  {
    code: 'A302',
    name: 'Fare Class Authorization Lag After Competitor Disruption',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'When a competitor cancels a hub bank, SkyHarbor demand spikes inside the two-hour window before the batch RM optimizer recalculates fare class authorizations. Discount buckets remain open after willingness-to-pay has shifted, so high-yield close-in passengers buy inventory that should have been protected for walk-up fares.',
    keywords: ['fare class authorization', 'revenue management', 'O&D control', 'close-in demand', 'hub disruption'],
    demoRelevant: true,
  },
  {
    code: 'A303',
    name: 'Origin-Destination Controls Ignoring Regional Jet Spill',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'O&D controls fail when regional jet feed is modeled as interchangeable with mainline capacity even though the fleet has smaller cabins and tighter reaccommodation options. The RM system accepts low-yield connecting traffic that consumes scarce regional seats, forcing high-yield local passengers onto competitors during the final booking curve.',
    keywords: ['O&D control', 'regional jet', 'RM optimizer', 'fare bucket', 'network revenue'],
    demoRelevant: true,
  },
  {
    code: 'A304',
    name: 'Dynamic Pricing Guardrail Missing For Thin Markets',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Dynamic pricing pilots overreact in thin spoke markets when only a handful of daily observations are available and no minimum-data guardrail is enforced. The pricing engine interprets a single anomalous booking as market-wide elasticity and moves fares outside ATPCO-filed competitive bounds.',
    keywords: ['dynamic pricing', 'ATPCO', 'thin market', 'elasticity', 'fare filing'],
    demoRelevant: true,
  },
  {
    code: 'A305',
    name: 'Group Desk Blocks Invisible To RM Optimizer',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Revenue management opens low fare inventory because group desk soft blocks are stored in a sales tool rather than the Altéa inventory ledger. The optimizer sees phantom availability, authorizes discount classes, and later discovers that protected group space has consumed the cabin.',
    keywords: ['group sales', 'Altea inventory', 'RM optimizer', 'soft block', 'fare class'],
  },
  {
    code: 'A306',
    name: 'Ancillary Attach Forecast Excluded From Fare Optimization',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Base fare optimization leaves money on the table when expected bags, seats, boarding, and bundle attach are not included in total revenue controls. The system closes a lower base fare that would have produced higher total order value under IATA ONE Order-style retailing economics.',
    keywords: ['ancillary revenue', 'IATA ONE Order', 'fare optimization', 'bundle attach', 'total revenue'],
    demoRelevant: true,
  },
  {
    code: 'A307',
    name: 'No-Show Forecast Stale After Schedule Reliability Shock',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'No-show forecasts remain calibrated to normal operations after a quarter of weather disruption and operational unreliability. The overbooking model assumes historical no-show rates, accepts too many bookings, and creates denied boarding exposure under DOT consumer protection rules.',
    keywords: ['overbooking', 'no-show forecast', 'DOT', 'denied boarding', 'schedule reliability'],
  },
  {
    code: 'A308',
    name: 'Corporate Contract Fares Cannibalize Public Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Corporate contracted fares consume inventory that should be protected for higher public fares when account-specific bid prices are loaded outside the RM bid-price hierarchy. The failure hides inside account performance reports because the corporate channel appears to meet volume commitments while network yield deteriorates.',
    keywords: ['corporate fare', 'bid price', 'ATPCO', 'yield management', 'account performance'],
  },
  {
    code: 'A309',
    name: 'Basic Economy Fence Broken By Channel-Specific Rules',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Basic Economy price fences fail when OTA, mobile, and call-center channels apply different seat-selection and change-fee rules for the same fare basis. Customers learn that booking through one channel produces more flexibility at the same price, pulling demand away from standard economy and collapsing the intended segmentation.',
    keywords: ['Basic Economy', 'fare basis', 'OTA', 'ATPCO', 'segmentation'],
  },
  {
    code: 'A310',
    name: 'Promo Fare Filing Not Reconciled To Inventory Close',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Marketing launches a flash sale after ATPCO promo fares are filed, but the RM team does not close matching low fare buckets on constrained flights. The public campaign drives high-volume low-yield demand into flights that were already forecast to sell out, creating avoidable dilution rather than incremental traffic.',
    keywords: ['ATPCO', 'promo fare', 'fare bucket', 'flash sale', 'dilution'],
  },
  {
    code: 'A311',
    name: 'Revenue Forecast Excludes Waiver-Code Leakage',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Forecast accuracy degrades when customer-service waiver codes issued during IROPS are treated as one-time exceptions rather than recurring revenue leakage. Agents keep using broad waiver codes after the disruption window closes, and RM sees lower realized yield without a causal link to service-recovery policy.',
    keywords: ['waiver code', 'IROPS', 'realized yield', 'service recovery', 'revenue leakage'],
  },
  {
    code: 'A312',
    name: 'Married-Segment Logic Broken On Codeshare Connections',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Married-segment controls fail when SkyHarbor and partner codeshare availability are priced independently across the connection. The booking path allows passengers to break the intended O&D control, buying cheap segments separately and reconstructing an itinerary that should have carried a higher through fare.',
    keywords: ['married segment', 'codeshare', 'O&D control', 'GDS', 'availability'],
  },
  {
    code: 'A313',
    name: 'Premium Cabin Upgrade Inventory Mispriced Against Cash Demand',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'Upgrade inventory is released to loyalty elites before the RM model has finalized close-in premium cabin cash demand. The airline protects customer goodwill in the loyalty queue but gives away seats that would have sold at high walk-up fares on business-heavy routes.',
    keywords: ['premium cabin', 'upgrade inventory', 'FFP', 'walk-up fare', 'revenue management'],
  },
  {
    code: 'A314',
    name: 'Continuous Pricing Pilot Bypasses Audit Trail',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Continuous pricing experiments generate offer prices outside the traditional filed-fare audit path, but finance and revenue accounting still reconcile against ATPCO fare products. When customers dispute price changes, the airline cannot prove which model version, inputs, and guardrails produced the offer shown at checkout.',
    keywords: ['continuous pricing', 'ATPCO', 'audit trail', 'offer management', 'model governance'],
  },
  {
    code: 'A315',
    name: 'Demand Forecast Ignores Aircraft Gauge Downgrade Risk',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Forecasts assume published aircraft capacity even when operational history shows frequent gauge downgrades on the route. The RM optimizer sells to the planned seat count, and an aircraft swap to a smaller regional jet converts forecast variance into denied boarding and customer compensation.',
    keywords: ['gauge downgrade', 'capacity forecast', 'regional jet', 'denied boarding', 'RM optimizer'],
  },
  {
    code: 'A316',
    name: 'Seasonality Curve Imported Without Holiday Calendar Normalization',
    officeCategory: 'middle_office',
    failureRatePct: 49,
    description:
      'Seasonality curves are copied from prior years without normalizing for shifted school breaks, major events, and holiday date movement. The RM model opens and closes buckets against the wrong demand week, missing peak willingness-to-pay and overpricing soft travel periods.',
    keywords: ['seasonality', 'holiday calendar', 'demand forecast', 'RM model', 'fare bucket'],
  },
  {
    code: 'A317',
    name: 'Competitor Fare Scrape Poisoned By Basic Economy Comparisons',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Competitive fare scraping treats a rival Basic Economy fare as equivalent to SkyHarbor standard economy even when bag, seat, and change rights are materially different. The pricing engine matches down to an inferior competitor product, compressing yield and confusing customers who compare headline fares only.',
    keywords: ['competitive pricing', 'Basic Economy', 'fare scrape', 'ATPCO', 'product attribute'],
  },
  {
    code: 'A318',
    name: 'Forecast Override Governance Missing During Analyst Intervention',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Revenue analysts override model recommendations during unusual demand periods, but overrides are not logged with reason codes, expiry dates, or post-event review. The temporary judgment call becomes embedded in future forecast baselines, weakening model accountability and making SR 11-7-style model governance impossible to evidence.',
    keywords: ['forecast override', 'model governance', 'reason code', 'RM analyst', 'SR 11-7'],
  },
  {
    code: 'A319',
    name: 'Fare Family Mapping Breaks After Altéa Migration',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Fare families mapped in Sabre do not translate cleanly into Amadeus Altéa branded-fare structures during migration. The same fare basis appears with different bag, seat, and change attributes across channels, so RM cannot distinguish customer willingness-to-pay from product-display inconsistency.',
    keywords: ['fare family', 'Sabre', 'Amadeus Altea', 'branded fares', 'PSS migration'],
    demoRelevant: true,
  },
  {
    code: 'A320',
    name: 'Network Bid Prices Blind To Crew Constraint',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'Network bid prices assume flights will operate as scheduled, but crew legality constraints make certain late-night recoveries unlikely during disruption-heavy weeks. RM continues accepting low-yield connections onto flights that later cancel for crew reasons, creating reaccommodation cost greater than the original fare value.',
    keywords: ['bid price', 'crew legality', 'IROPS', 'network revenue', 'reaccommodation'],
  },
  {
    code: 'A321',
    name: 'Revenue Forecast Split From Treasury Fuel Hedge Assumptions',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'Revenue plans assume fare increases will offset fuel price movement, while treasury hedge scenarios use a different traffic and yield baseline. The mismatch causes executive margin forecasts to double-count fare recovery and understate the route-level pressure from fuel volatility.',
    keywords: ['fuel hedge', 'treasury', 'yield forecast', 'route margin', 'IATA'],
  },
  {
    code: 'A322',
    name: 'Refundable Fare Demand Overstated By Corporate Policy Change',
    officeCategory: 'middle_office',
    failureRatePct: 51,
    description:
      'A large corporate account changes travel policy to permit non-refundable fares, but the RM model keeps extrapolating historic refundable fare demand for that account. Refundable buckets remain open too long, suppressing standard fare availability and misreading policy change as weak business demand.',
    keywords: ['refundable fare', 'corporate travel', 'travel policy', 'fare bucket', 'RM forecast'],
  },
  {
    code: 'A323',
    name: 'Route Launch Forecast Anchored On Marketing Impressions',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'New route forecasts are anchored on marketing impressions and search volume without enough comparable booking-conversion evidence. The RM team opens too much early low-fare inventory, trains customers to wait for discounts, and misses the chance to discover true local willingness-to-pay.',
    keywords: ['route launch', 'booking conversion', 'RM forecast', 'market stimulation', 'fare class'],
  },
  {
    code: 'A324',
    name: 'Interline Proration Rules Missing From Net Revenue View',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'RM decisions are made on gross itinerary fare even though interline proration rules shift a material share of flown revenue to the partner carrier. Routes that look profitable in the pricing dashboard become margin-dilutive after IATA SIS settlement applies the actual prorate calculation.',
    keywords: ['interline proration', 'IATA SIS', 'net revenue', 'pricing dashboard', 'partner carrier'],
  },
  {
    code: 'A325',
    name: 'Award Seat Release Cannibalizes Close-In Cash Demand',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Award seats are released according to loyalty engagement targets without checking the latest cash-demand curve for the same cabin and departure window. On constrained flights, redemption inventory displaces close-in paid demand and converts high-margin seats into loyalty liability relief.',
    keywords: ['award inventory', 'FFP', 'cash demand', 'loyalty liability', 'close-in fare'],
  },
  {
    code: 'A326',
    name: 'Price Elasticity Model Ignores Airport Construction Friction',
    officeCategory: 'middle_office',
    failureRatePct: 48,
    description:
      'Elasticity models treat a hub market as stable even while airport construction changes access time, parking availability, and customer preference for alternate airports. Fare reductions fail to stimulate expected demand because the real friction is ground-side experience, not price.',
    keywords: ['price elasticity', 'airport construction', 'hub market', 'demand stimulation', 'ACI'],
  },
  {
    code: 'A327',
    name: 'RM Data Mart Receives Flown Revenue After Close Lag',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'The RM data mart uses booked revenue for near-term decisions because flown revenue arrives only after revenue accounting close. When refunds, exchanges, and involuntary reissues are material, the optimizer learns from overstated revenue and continues pricing into demand that did not actually materialize.',
    keywords: ['RM data mart', 'flown revenue', 'revenue accounting', 'exchange', 'BSP'],
  },
  {
    code: 'A328',
    name: 'Fare Ladder Collapses Under OTA Sort-Order Pressure',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description:
      'Pricing teams compress fare ladders to win first-page OTA sort order without modeling the downstream effect on direct-channel mix. Customers who would have booked direct standard economy are trained to shop the OTA headline fare, raising distribution cost while lowering yield.',
    keywords: ['OTA', 'fare ladder', 'GDS', 'distribution cost', 'direct channel'],
  },
  {
    code: 'A329',
    name: 'RM Scenario Planning Excludes Regulatory Fee Shock',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description:
      'Revenue scenarios model demand, fuel, and competitor fares but exclude sudden airport fee, passenger facility charge, or government tax changes. When fees change, the customer-visible all-in fare moves while base fare remains constant, and RM misreads conversion decline as demand weakness.',
    keywords: ['scenario planning', 'passenger facility charge', 'IATA', 'base fare', 'conversion'],
  },
  {
    code: 'A330',
    name: 'RM AI Dynamic Pricing Regulatory Override Gap',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Revenue-management AI raises fares during weather disruption without a human override threshold or DOT 399.88 unfair-practices review. The algorithm protects yield in the moment, but the airline cannot show why the price increase was commercially justified rather than disruption profiteering.',
    keywords: ['RM AI', 'dynamic pricing', 'DOT 399.88', 'human override', 'IROPS'],
    demoRelevant: true,
  },
  {
    code: 'A331',
    name: 'Pricing AI Personalization Proxy Bias Risk',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Personalization AI uses loyalty tier, device, route history, and purchase timing as price signals without testing for protected-class proxy effects. A pricing strategy meant to optimize conversion creates DOT consumer-protection exposure when similarly situated customers receive unexplained fare differences.',
    keywords: ['pricing AI', 'personalization', 'DOT 399.88', 'proxy bias', 'loyalty tier'],
    demoRelevant: true,
  },
  {
    code: 'A332',
    name: 'RM AI Champion Challenge Never Leaves Pilot',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'A new RM AI model is tested against the incumbent optimizer, but the champion-challenger design lacks decision rights for when the challenger wins. Analysts keep the AI in advisory mode, so the program reports promising uplift without changing live fare authorization behavior.',
    keywords: ['RM AI', 'champion challenger', 'model governance', 'fare authorization', 'adoption telemetry'],
    demoRelevant: true,
  },
  {
    code: 'A333',
    name: 'Generative RM Copilot Hallucinates Market Rationale',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'A generative AI copilot summarizes market moves for revenue analysts but blends real booking curves with plausible competitor explanations not present in the data. Analysts accept the narrative and make fare decisions based on invented causal drivers.',
    keywords: ['generative AI', 'RM copilot', 'model grounding', 'ATPCO', 'analyst workflow'],
    demoRelevant: true,
  },
  {
    code: 'A334',
    name: 'Demand AI Drift Hidden By Aggregate RASM',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      'Demand AI drifts in specific leisure and regional-jet markets, but aggregate RASM remains stable enough to hide the issue. The model keeps underpricing the affected markets until route-level drift telemetry is tied to fare-class decisions.',
    keywords: ['demand AI', 'model drift', 'RASM', 'route-level telemetry', 'fare class'],
    demoRelevant: true,
  },
  {
    code: 'A335',
    name: 'AI Fare Recommendations Missing Analyst Reason Codes',
    officeCategory: 'middle_office',
    failureRatePct: 50,
    description:
      'The RM AI recommends open and close actions, but analysts can accept, reject, or override without reason codes. Post-event learning cannot distinguish model error from human judgment, weakening both adoption telemetry and model improvement.',
    keywords: ['RM AI', 'reason code', 'adoption telemetry', 'model improvement', 'override governance'],
    demoRelevant: true,
  },
  {
    code: 'A336',
    name: 'AI Competitor Scrape Ingests Promotional Noise',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Pricing AI ingests competitor fares without separating limited promo inventory from durable market price. The model matches temporary noise and leaves fare ladders compressed after the competitor promotion has expired.',
    keywords: ['pricing AI', 'competitor scrape', 'ATPCO', 'promo fare', 'fare ladder'],
    demoRelevant: true,
  },
  {
    code: 'A337',
    name: 'AI Revenue Uplift Contract Lacks Holdout Discipline',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'A vendor contract promises revenue uplift from RM AI but does not require statistically valid route holdouts, seasonality controls, or adoption telemetry. Source teams cannot separate real AI value from market recovery or analyst intervention during renewal negotiations.',
    keywords: ['RM AI', 'vendor contract', 'holdout test', 'adoption telemetry', 'Source'],
    demoRelevant: true,
  },
];
