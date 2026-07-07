// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns — Sustainability, SAF Compliance & CORSIA/EU ETS
// Code range: A4500–A4799
// Run: npx tsx src/scripts/seed/seed-airline-dom15-sustainability.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlinePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_SUSTAINABILITY_PATTERNS: AirlinePatternSeed[] = [

  // ── Sub-topic 1: CORSIA MRV data quality failures ─────────────────────────
  {
    code: 'A4500',
    name: 'CORSIA MRV Baseline Data Submission Error',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'SkyHarbor submits 2019–2020 CORSIA baseline fuel-burn data to its verifier with a 4.2% upward error caused by double-counting repositioning flights; the inflated baseline reduces the offsetting obligation in Phase 1 (2021–2026) but is flagged during ICAO triennial review, triggering a corrected baseline that increases offset liability by an estimated 18,000 tCO₂e and exposes the carrier to reputational risk in CDP and ISSB IFRS S2 disclosures.',
    keywords: ['CORSIA', 'MRV', 'baseline', 'ICAO', 'fuel burn', 'emissions verification'],
    demoRelevant: true,
  },
  {
    code: 'A4501',
    name: 'CORSIA MRV Platform Integration Gap With Fuel Invoice System',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'The CORSIA MRV platform (Envio or Accenture Carbon Intelligence) pulls fuel uplift data via API from the fuel management system (FuelPlus/Ansett Aviation) but the integration does not reconcile density corrections applied by into-plane agents; a 1.8% systematic density variance over 12 months causes reported CO₂ to understate actual emissions, creating a material misstatement risk in the annual CORSIA emissions report.',
    keywords: ['CORSIA', 'MRV', 'fuel management', 'FuelPlus', 'density correction', 'emissions report'],
    demoRelevant: true,
  },
  {
    code: 'A4502',
    name: 'CORSIA Third-Party Verifier Scope Gap on Wet-Lease Flights',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'SkyHarbor operates 14 ACMI wet-lease aircraft under its own ICAO designator; the third-party verifier scopes the MRV audit against SkyHarbor-owned-and-operated aircraft only, omitting wet-lease fuel burn because the ACMI contract does not specify which party bears CORSIA reporting responsibility; the omission is discovered 11 months later, requiring a revised emissions report and delayed CORSIA certificate.',
    keywords: ['CORSIA', 'MRV', 'wet-lease', 'ACMI', 'verifier', 'ICAO'],
  },
  {
    code: 'A4503',
    name: 'CORSIA Monitoring Plan Not Updated After New Route Launch',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'SkyHarbor launches 6 new international routes mid-year; the CORSIA Monitoring Plan lodged with the state authority is not amended before operations begin; the new city-pair fuel consumption is captured in FuelPlus but the MRV platform applies the wrong emission factor tier (Tier 1 default instead of Tier 3 actual fuel analysis) because the route profile was never configured, understating reported CO₂ per flight by up to 2.1%.',
    keywords: ['CORSIA', 'MRV', 'monitoring plan', 'emission factor', 'FuelPlus', 'route launch'],
  },
  {
    code: 'A4504',
    name: 'CORSIA Annual Emissions Report Filed After State Deadline',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'The annual CORSIA emissions report (due 31 March) is held up for 22 days because the external verifier requests supplementary fuel analysis certificates that were not prepared during the monitoring year; SkyHarbor misses the national civil aviation authority deadline, triggering a formal compliance notice and complicating its position in ongoing EU ETS proceedings.',
    keywords: ['CORSIA', 'MRV', 'annual report', 'state deadline', 'verifier', 'compliance'],
  },
  {
    code: 'A4505',
    name: 'CORSIA MRV Fuel Sampling Not Compliant With ASTM D1655',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'SkyHarbor uses Tier 3 actual carbon content measurement to minimise CORSIA emission factors; fuel sampling at two hub airports does not follow ASTM D1655 protocols — samples are taken from bowser tanks rather than aircraft wing tanks — invalidating the carbon content certificates; the verifier downgrades accepted measurements to Tier 1 default factors, increasing the reported CO₂ and offsetting obligation for the affected period.',
    keywords: ['CORSIA', 'MRV', 'fuel sampling', 'ASTM D1655', 'carbon content', 'emission factor'],
  },
  {
    code: 'A4506',
    name: 'CORSIA Offset Retirement Not Matched to Reporting Year',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'SkyHarbor retires 42,000 CORSIA Eligible Emission Units (CEEUs) in December but assigns them against the following year\'s obligation rather than the current compliance year; the registry administrator (South Pole / Climate Neutral Group) records the retirement correctly but the state authority\'s reconciliation spreadsheet shows an apparent shortfall for the current year, triggering a compliance query that takes 8 weeks to resolve.',
    keywords: ['CORSIA', 'CEEU', 'offset retirement', 'South Pole', 'Climate Neutral Group', 'compliance'],
    demoRelevant: true,
  },
  {
    code: 'A4507',
    name: 'CORSIA Data Quality Management Procedure Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'ICAO requires aeroplane operators to maintain a documented Data Quality Management (DQM) procedure covering error identification, correction, and audit trail; SkyHarbor\'s MRV platform contains no DQM procedure document and the verifier identifies this as a material non-conformance during the first full verification audit, requiring a corrective action plan that delays certificate issuance by 6 weeks.',
    keywords: ['CORSIA', 'MRV', 'data quality management', 'DQM', 'ICAO', 'verification'],
  },
  {
    code: 'A4508',
    name: 'CORSIA Monitoring Plan Approved for Wrong Aircraft Registration',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      'Following a tail swap during an aircraft wet-lease return, the CORSIA Monitoring Plan continues to reference the returning aircraft\'s registration; fuel burn from the replacement aircraft is allocated to a registration not covered by the approved plan, creating a gap in verifiable data that the national authority flags during its annual spot-check, requiring an emergency plan amendment and supplementary verification engagement.',
    keywords: ['CORSIA', 'MRV', 'monitoring plan', 'aircraft registration', 'tail swap', 'verification'],
  },
  {
    code: 'A4509',
    name: 'CORSIA MRV Gap: Charter and Non-Scheduled Services Not Scoped',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'SkyHarbor\'s CORSIA reporting scope covers scheduled international services; charter and non-scheduled operations on the same aircraft and ICAO designator are excluded on the mistaken assumption they fall below the 10,000 tCO₂ per pair threshold; in reality the cumulative non-scheduled emissions for three routes exceed the threshold, creating an unreported CORSIA obligation discovered only during an external ESG audit.',
    keywords: ['CORSIA', 'MRV', 'charter', 'non-scheduled', 'threshold', 'compliance'],
  },
  {
    code: 'A4510',
    name: 'CORSIA Verifier Independence Compromised by Consulting Relationship',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'SkyHarbor engages its CORSIA MRV verifier to also provide sustainability advisory services in the same compliance year; ICAO Doc 9951 prohibits verifiers from auditing entities for which they have performed management consultancy; the conflict is identified by a CDP reviewer, requiring SkyHarbor to appoint a new independent verifier and repeat the verification for the affected year.',
    keywords: ['CORSIA', 'MRV', 'verifier independence', 'ICAO Doc 9951', 'CDP', 'compliance'],
  },

  // ── Sub-topic 2: SAF blending mandate compliance ──────────────────────────
  {
    code: 'A4511',
    name: 'ReFuelEU 2% SAF Mandate: No Supply Contract Beyond Q4 2024',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'EU ReFuelEU Aviation Regulation mandates 2% SAF blend at EU airports from 1 January 2025; SkyHarbor sources only 0.8% SAF and has no offtake contract beyond Q4 2024; without a credible supply agreement, the carrier faces €2 per GJ non-compliance penalty on shortfall volumes, estimated at €3.4M for full-year 2025 on its EU inbound/outbound fuel uplift of ~1.4Mt, and must purchase spot SAF at 3–5× conventional jet fuel cost to close the gap.',
    keywords: ['ReFuelEU', 'SAF', 'blending mandate', 'EU', 'non-compliance penalty', 'sustainable aviation fuel'],
    demoRelevant: true,
  },
  {
    code: 'A4512',
    name: 'SAF Blend Ratio Tracking System Not Implemented at Hub Airports',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'ReFuelEU requires carriers to document actual SAF blend ratios uplifted at each EU airport; SkyHarbor\'s fuel management system (FuelPlus) does not capture the SAF percentage per uplift event, relying instead on monthly aggregated certificates from fuel suppliers; spot audits by EASA/national authorities cannot verify per-flight compliance, creating systemic audit risk and inability to produce granular blend records for the annual ReFuelEU declaration.',
    keywords: ['ReFuelEU', 'SAF', 'blend ratio', 'FuelPlus', 'audit', 'EASA'],
    demoRelevant: true,
  },
  {
    code: 'A4513',
    name: 'SAF Availability Shortfall at Secondary EU Airports',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'SAF supply infrastructure is concentrated at major EU hubs (AMS, FRA, CDG); SkyHarbor operates 11 point-to-point routes from secondary EU airports where no SAF is commercially available; the carrier cannot compensate via "book and claim" accounting because its ISCC PLUS certification does not yet cover mass balance chain-of-custody transfers, leaving those routes fully non-compliant with ReFuelEU on a per-airport basis.',
    keywords: ['ReFuelEU', 'SAF', 'secondary airports', 'ISCC PLUS', 'book and claim', 'mass balance'],
  },
  {
    code: 'A4514',
    name: 'SAF Grand Challenge Reporting Not Aligned With CORSIA Credit',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'SkyHarbor claims SAF volumes under both the US SAF Grand Challenge reporting framework and CORSIA Eligible Emission Unit retirement; the same SAF tonnes are counted twice — once to demonstrate US policy progress and once as CORSIA offset-equivalent reductions — breaching the additionality principle; the double-claim is identified by ICAO\'s CORSIA Technical Advisory Body, requiring restated emissions and reclaimed CEEUs.',
    keywords: ['SAF', 'SAF Grand Challenge', 'CORSIA', 'additionality', 'double-counting', 'CEEU'],
  },
  {
    code: 'A4515',
    name: 'SAF Blending Ratio Mislabelled on Fuel Delivery Documentation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'A fuel supplier delivers a 30% SAF blend (30/70 SAF/Jet-A1) but issues delivery documentation showing a 5% blend ratio due to a configuration error in their ERP system; SkyHarbor\'s CORSIA MRV platform ingests the incorrect ratio, understating the well-to-wake emissions reduction by 83%; the error is discovered during an ISCC PLUS chain-of-custody audit 9 months later, requiring re-statement of two CORSIA reporting periods.',
    keywords: ['SAF', 'blend ratio', 'ISCC PLUS', 'fuel delivery', 'CORSIA', 'chain of custody'],
  },
  {
    code: 'A4516',
    name: 'ReFuelEU Synthetic Fuel Sub-Mandate Unplanned for 2030',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'ReFuelEU imposes a synthetic fuel (e-fuel/Power-to-Liquid) sub-mandate of 0.7% by 2030 within the overall SAF mandate; SkyHarbor\'s sustainability roadmap does not include a PtL supply pathway; with PtL currently costing 5–8× conventional Jet-A1 and no commercial-scale European production before 2028, the carrier has no credible plan to meet the sub-mandate, exposing it to an additional penalty tier and significant investor ESG scrutiny.',
    keywords: ['ReFuelEU', 'SAF', 'e-fuel', 'Power-to-Liquid', 'synthetic fuel', 'sub-mandate'],
  },
  {
    code: 'A4517',
    name: 'SAF Volume Commitment Understated in Annual ESG Report',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'SkyHarbor\'s annual ESG report states 0.8% SAF share based on total network fuel uplift; ReFuelEU compliance is assessed on EU-airport-specific uplift volumes only, which is a smaller denominator; the 0.8% overall figure masks a lower effective SAF share on the EU sub-network of approximately 0.5%, creating a material misrepresentation risk under EU Green Claims Directive standards and ISSB IFRS S2 disclosure requirements.',
    keywords: ['SAF', 'ESG report', 'ReFuelEU', 'ISSB IFRS S2', 'Green Claims Directive', 'disclosure'],
    demoRelevant: true,
  },
  {
    code: 'A4518',
    name: 'SAF Feedstock Eligibility Change Invalidates Existing Supply',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'The EU\'s delegated act under ReFuelEU excludes certain crop-based feedstocks from the SAF mandate compliance pathway in 2025; SkyHarbor\'s existing 0.8% SAF supply is partially derived from first-generation HEFA-SPK feedstocks that fall into the excluded category; approximately 35% of contracted SAF volumes cannot count toward mandate compliance, widening the non-compliance gap and triggering emergency renegotiation with the supplier.',
    keywords: ['SAF', 'ReFuelEU', 'HEFA-SPK', 'feedstock eligibility', 'delegated act', 'mandate compliance'],
  },
  {
    code: 'A4519',
    name: 'Intra-EU SAF Mandate Exemption Claim Incorrectly Applied',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'SkyHarbor\'s compliance team incorrectly interprets a ReFuelEU transitional exemption as applying to all turboprop-operated intra-EU routes; the exemption covers only aircraft below 5,700 kg MTOW; SkyHarbor\'s ATR 72 fleet (MTOW 23,000 kg) is not exempt; the miscalculation removes 12% of EU fuel uplift from the compliance denominator, generating a false compliance figure in the national authority filing.',
    keywords: ['ReFuelEU', 'SAF', 'exemption', 'intra-EU', 'ATR 72', 'compliance'],
  },
  {
    code: 'A4520',
    name: 'SAF Mandate Penalty Liability Not Provisioned in Financial Statements',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'SkyHarbor\'s finance team does not provision for the probable ReFuelEU non-compliance penalty in the 2025 financial year accounts on the assumption that the mandate will not be strictly enforced in its first year; the European Commission\'s enforcement guidance confirms penalties apply from day one; auditors identify the absence of the provision — estimated at €3.4M — as a material omission and require a restatement of the interim accounts.',
    keywords: ['ReFuelEU', 'SAF', 'penalty', 'financial provision', 'ISSB IFRS S2', 'auditors'],
    demoRelevant: true,
  },

  // ── Sub-topic 3: Carbon credit procurement ────────────────────────────────
  {
    code: 'A4521',
    name: 'CORSIA Ineligible Offset Credits Purchased at Scale',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'SkyHarbor procures 120,000 voluntary carbon offsets (VCUs) through a broker at below-market pricing; post-purchase due diligence reveals the projects are registered under the Verified Carbon Standard (VCS) but not on the CORSIA Eligible Emissions Unit approved list; the credits cannot be retired against CORSIA obligations, forcing a last-minute purchase of eligible CDM / ICAO-approved units at a 40% cost premium with 6 weeks to the compliance deadline.',
    keywords: ['CORSIA', 'CEEU', 'VCU', 'carbon offset', 'eligible emissions unit', 'compliance'],
    demoRelevant: true,
  },
  {
    code: 'A4522',
    name: 'Carbon Credit Quality Governance Framework Absent',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'SkyHarbor\'s carbon procurement policy sets a cost ceiling per tonne but no quality floor; a sustainability manager purchases Nature-based Solutions (NbS) credits from a REDD+ project with a weak additionality methodology; a subsequent University of California Berkeley review publicly disputes the project\'s credibility; SkyHarbor is named in resulting media coverage, generating ESG downgrade risk from MSCI ESG Ratings and ISS ESG.',
    keywords: ['carbon offset', 'NbS', 'REDD+', 'additionality', 'MSCI ESG', 'ISS ESG'],
    demoRelevant: true,
  },
  {
    code: 'A4523',
    name: 'Carbon Credit Registry Double-Spend Between Voluntary and CORSIA',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'SkyHarbor retires carbon credits from the Gold Standard registry for its voluntary "carbon-neutral flight" passenger product; the same vintage credits are later proposed for CORSIA retirement by a junior analyst who does not check the voluntary retirement ledger; the Gold Standard registry rejects the CORSIA retirement request because the serial numbers are already cancelled, leaving a 28,000 tCO₂e CORSIA shortfall 10 days before the compliance deadline.',
    keywords: ['carbon offset', 'Gold Standard', 'CORSIA', 'double-spend', 'registry', 'retirement'],
  },
  {
    code: 'A4524',
    name: 'Carbon Credit Vintage Year Restriction Not Checked Pre-Purchase',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'CORSIA Phase 1 restricts eligible credits to vintages 2016 or later; SkyHarbor\'s broker presents a bundle of 50,000 CDM CERs at a discount; the procurement team does not verify vintage years; 18,000 CERs in the bundle carry pre-2016 vintages and are ineligible; by the time the error is caught the broker has already retired the credits, and replacement units cost 55% more due to tight market supply.',
    keywords: ['CORSIA', 'CEEU', 'CDM', 'CER', 'vintage year', 'carbon credit procurement'],
  },
  {
    code: 'A4525',
    name: 'Forward Carbon Credit Purchase Counterparty Default',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'SkyHarbor signs a 3-year forward purchase agreement with a carbon project developer for 60,000 tCO₂e per year; the developer fails to deliver in Year 2 following a permitting challenge to the underlying forest project; no performance bond or credit insurance was included in the contract; SkyHarbor must purchase replacement credits on the spot market at 2.3× the contracted price to cover its CORSIA obligation.',
    keywords: ['carbon credit', 'forward purchase', 'counterparty default', 'CORSIA', 'carbon insurance', 'carbon market'],
  },
  {
    code: 'A4526',
    name: 'Voluntary Passenger Offset Product Uses Non-Equivalent Methodology',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      'SkyHarbor\'s "FlyGreen" passenger offset option calculates per-passenger CO₂ using tank-to-wake only; the EU Green Claims Directive and ICAO Carbon Emissions Calculator both require well-to-wake methodology incorporating upstream fuel production emissions; the understatement of roughly 18% per tonne means passengers purchasing the offset are systematically under-paying for their true impact, creating greenwashing enforcement exposure.',
    keywords: ['carbon offset', 'tank-to-wake', 'well-to-wake', 'ICAO Carbon Emissions Calculator', 'Green Claims Directive', 'passenger offset'],
    demoRelevant: true,
  },
  {
    code: 'A4527',
    name: 'Carbon Credit Procurement Authority Not Defined in Treasury Policy',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'SkyHarbor\'s treasury policy covers FX, fuel, and interest rate hedging but makes no mention of carbon credit procurement; a sustainability manager with no defined spending authority commits to a €1.8M forward purchase without CFO approval; the commitment is discovered during a budget review, creating governance friction and a retroactive approval process that delays formal execution of the contract.',
    keywords: ['carbon credit', 'procurement authority', 'treasury policy', 'governance', 'CORSIA', 'CFO approval'],
  },
  {
    code: 'A4528',
    name: 'Carbon Market Price Spike Blows CORSIA Compliance Budget',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'SkyHarbor budgets CORSIA compliance at $8/tCO₂e based on 2022 spot prices; a tightening of CORSIA eligible programme criteria in 2024 reduces available supply; spot prices for CORSIA-eligible credits rise to $22/tCO₂e; with 85,000 tCO₂e obligation and no forward contracts, SkyHarbor faces an unbudgeted €1.2M overspend, requiring emergency reforecasting and a board paper on carbon price risk management.',
    keywords: ['CORSIA', 'CEEU', 'carbon price', 'compliance budget', 'carbon market', 'price risk'],
  },
  {
    code: 'A4529',
    name: 'Biodiversity Co-Benefit Claims on Carbon Credits Not Substantiated',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'SkyHarbor markets its carbon offset programme as delivering biodiversity co-benefits; the underlying credits are from an industrial forestry monoculture project without any recognised biodiversity standard; the ASA (Advertising Standards Authority) receives a consumer complaint; SkyHarbor cannot produce substantiating evidence and is required to withdraw the co-benefit claim from all marketing channels, creating a reputational crisis during a peak booking period.',
    keywords: ['carbon offset', 'biodiversity', 'greenwashing', 'ASA', 'marketing claims', 'sustainability'],
  },
  {
    code: 'A4530',
    name: 'SBTi-Aviation Net-Zero Pathway Incompatible With Current Offset Strategy',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      'SkyHarbor commits to SBTi Corporate Net-Zero Standard; SBTi for aviation requires residual emissions to be neutralised via carbon removal (CDR) technologies such as DACCS or BECCS, not avoided-emissions offsets; SkyHarbor\'s current strategy relies entirely on avoided-emissions NbS credits that SBTi does not recognise as net-zero-qualifying; the gap between current procurement and SBTi-compliant CDR requires a full strategy rewrite and investor re-communication.',
    keywords: ['SBTi', 'net-zero', 'carbon removal', 'DACCS', 'NbS', 'avoided emissions'],
  },

  // ── Sub-topic 4: EU ETS allowance surrender failures ─────────────────────
  {
    code: 'A4531',
    name: 'EU ETS Allowance Surrender Shortfall From Calculation Error',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'SkyHarbor\'s EU ETS calculation engine applies an incorrect emission factor (2.540 kgCO₂/kg rather than EUETS-mandated 3.150 kgCO₂/kg for Jet-A1 in the 2023 monitoring plan) to EU intra-EEA flights; the error understates the surrenderable EUA count by 31,400 allowances; DEHSt (Deutsche Emissionshandel) identifies the shortfall during account reconciliation; the carrier faces a €100/tCO₂e excess emissions penalty in addition to the cost of sourcing replacement EUAs at short notice.',
    keywords: ['EU ETS', 'EUA', 'surrender', 'DEHSt', 'emission factor', 'EUTL'],
    demoRelevant: true,
  },
  {
    code: 'A4532',
    name: 'EU ETS Free Allocation Claim Not Filed by March Deadline',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'EU ETS free allocation for aviation is based on tonne-kilometre (TKM) data filed every four years; SkyHarbor\'s sustainability team misses the 31 March submission window because the TKM data export from the PSS requires a custom SQL query that was not scripted in advance; late filing forfeits the allocation entitlement for the four-year period, forcing the carrier to purchase all required EUAs on the open market at an estimated additional cost of €4.2M.',
    keywords: ['EU ETS', 'EUA', 'free allocation', 'tonne-kilometre', 'TKM', 'DEHSt'],
    demoRelevant: true,
  },
  {
    code: 'A4533',
    name: 'EU ETS Account Authorised Representative Credentials Lapsed',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'SkyHarbor\'s EUTL (EU Transaction Log) account requires two authorised representatives (ARs) with valid national identity verification; one AR leaves the company and is not removed; the replacement AR\'s account is delayed because the identity verification documentation submitted to the national administrator is rejected three times for formatting errors; the account is locked during the annual surrender window, requiring a formal expedited access request that takes 18 business days to resolve.',
    keywords: ['EU ETS', 'EUTL', 'authorised representative', 'account access', 'DEHSt', 'surrender window'],
  },
  {
    code: 'A4534',
    name: 'EU ETS Intra-EEA Route Scope Miscategorised at Scheduling',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Route scheduling marks 4 flights per week from a non-EEA hub with a technical stop inside the EEA as purely non-EEA operations; under EU ETS scope, the EEA departure segment is reportable regardless of the ultimate destination; the miscategorisation persists for 14 months, creating a growing unreported EUA liability; retrospective correction requires re-filing monitoring reports with DEHSt and purchasing back-vintaged EUAs.',
    keywords: ['EU ETS', 'EUA', 'intra-EEA', 'route scope', 'DEHSt', 'monitoring report'],
  },
  {
    code: 'A4535',
    name: 'EU ETS EUA Surrender Using Previous Year Units Contrary to Annual Obligation',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'SkyHarbor\'s treasury purchases EUAs in December to lock in a favourable price; the registry booking confirms the purchase in the 2024 vintage; when surrendering in April 2025 for the 2024 obligation, the team inadvertently surrenders 2025-vintage EUAs rather than 2024-vintage units; while EU ETS accepts either vintage, the internal cost allocation is wrong and the 2025 hedge position is consumed, exposing the carrier to unhedged 2025 EUA price risk.',
    keywords: ['EU ETS', 'EUA', 'vintage', 'surrender', 'EUTL', 'hedging'],
  },
  {
    code: 'A4536',
    name: 'EU ETS Monitoring Plan Amendment Not Submitted After Fleet Change',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'SkyHarbor retires its Boeing 757 fleet and introduces Airbus A321XLR mid-year; the EU ETS Monitoring Plan covers only the aircraft types listed at plan approval; the A321XLR operations are not formally added to the plan before commencement; DEHSt requires a plan amendment with prior approval; operating without an approved plan for 4 months constitutes a procedural non-conformance and places 14,200 EUAs worth of emissions in a disputed status.',
    keywords: ['EU ETS', 'monitoring plan', 'fleet change', 'DEHSt', 'A321XLR', 'compliance'],
  },
  {
    code: 'A4537',
    name: 'EU ETS CORSIA Overlap Creates Double-Counting in Annual Report',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'SkyHarbor\'s annual sustainability report presents EU ETS and CORSIA obligations as separate items without disclosing that a subset of intra-EEA flights are covered by EU ETS but NOT by CORSIA (CORSIA covers only international flights); investors and ratings agencies misread the total reported CO₂ as double-covered, overstating the perceived regulatory burden and also missing that some international growth routes carry CORSIA-only obligations.',
    keywords: ['EU ETS', 'CORSIA', 'double-counting', 'sustainability report', 'ISSB IFRS S2', 'disclosure'],
  },
  {
    code: 'A4538',
    name: 'EU ETS Annual Improvement Report Omits Fuel Efficiency Data',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'EU ETS operators are encouraged to submit annual improvement reports showing efficiency measures; SkyHarbor\'s report omits fuel efficiency gains from single-engine taxi and CDO programmes because the relevant data sits in the flight operations system and is not extracted by the sustainability team; the omission reduces SkyHarbor\'s credibility in regulatory engagement and in its CDP climate disclosure, where peer carriers include equivalent metrics.',
    keywords: ['EU ETS', 'improvement report', 'fuel efficiency', 'CDO', 'single-engine taxi', 'CDP'],
  },
  {
    code: 'A4539',
    name: 'EU ETS EUA Hedging Policy Not Approved by Board Risk Committee',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'SkyHarbor\'s finance team begins purchasing EU ETS allowances forward on EEX (European Energy Exchange) without a Board-approved EUA hedging policy; the purchases are treated as speculative instruments by the external auditors rather than as hedges; IAS 39 / IFRS 9 hedge accounting treatment cannot be applied retrospectively; mark-to-market losses of €620K in Q3 flow directly through P&L rather than OCI, deteriorating reported EBITDA.',
    keywords: ['EU ETS', 'EUA', 'hedging', 'EEX', 'IFRS 9', 'hedge accounting'],
  },
  {
    code: 'A4540',
    name: 'Cessation of UK ETS Coordination Creates Dual-Filing Burden',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Post-Brexit, SkyHarbor\'s UK-departing EEA-bound flights fall under UK ETS (administered by the EA / DESNZ) while EEA-departing UK-bound flights fall under EU ETS; SkyHarbor\'s monitoring plan covers only EU ETS; the UK operations are not reported under UK ETS for 16 months; DESNZ issues a compliance notice and the carrier must file retrospective UK ETS reports while simultaneously managing its EU ETS surrender cycle.',
    keywords: ['UK ETS', 'EU ETS', 'Brexit', 'DESNZ', 'compliance notice', 'dual reporting'],
  },

  // ── Sub-topic 5: Scope 1 fuel burn measurement accuracy ──────────────────
  {
    code: 'A4541',
    name: 'FMS Fuel Burn vs Invoice Variance Exceeds 2% Threshold',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'SkyHarbor\'s CORSIA MRV uses actual FMS-recorded fuel burn from ACARS; reconciliation against fuel invoices from into-plane agents reveals a persistent 2.4% upward variance on invoices versus FMS; neither source is definitively correct — FMS measures fuel consumed while invoices reflect fuel loaded; the unresolved discrepancy means Scope 1 emissions in both CORSIA and ISSB IFRS S2 reports carry a 2.4% uncertainty that verifiers flag as outside acceptable tolerance.',
    keywords: ['Scope 1', 'fuel burn', 'FMS', 'ACARS', 'fuel invoice', 'CORSIA MRV'],
    demoRelevant: true,
  },
  {
    code: 'A4542',
    name: 'Fuel Remaining on Arrival Not Deducted in Consumption Calculation',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'SkyHarbor\'s Scope 1 emissions calculation uses departure fuel load from the fuel delivery note rather than actual fuel consumed (departure load minus arrival fuel remaining); on ultra-long-haul flights where significant reserves remain, the overstatement of fuel burned can reach 8–12%; while this overstates rather than understates the emissions (directionally conservative), it causes CORSIA offset over-procurement and distorts fleet efficiency benchmarking.',
    keywords: ['Scope 1', 'fuel consumption', 'fuel remaining', 'CORSIA', 'emissions calculation', 'fleet efficiency'],
  },
  {
    code: 'A4543',
    name: 'Ground Test Fuel Burn Not Segregated From Flight Emissions',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Engine ground testing after maintenance events consumes Jet-A1 fuel bunkered from the same supply accounts as flight operations; SkyHarbor\'s Scope 1 tracking does not segregate ground test fuel from flight fuel; ground test consumption (estimated at 0.3% of total fuel) is included in flight emission totals and misrepresented in CORSIA MRV reports as aviation CO₂, technically overstating aviation emissions while understating stationary combustion emissions.',
    keywords: ['Scope 1', 'ground test', 'fuel segregation', 'CORSIA', 'MRO', 'emissions boundary'],
  },
  {
    code: 'A4544',
    name: 'APU Fuel Burn Not Captured in Scope 1 Airport Ground Emissions',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'SkyHarbor\'s Scope 1 reports include flight-phase fuel burn but APU fuel consumed during ground operations (pre-departure, post-arrival, and transit turns) is not systematically recorded; APU fuel is uplifted separately from wing fuel at some stations with no digital transfer to the CORSIA MRV platform; the omission understates Scope 1 by an estimated 1.2–1.8% and misrepresents the APU reduction programme\'s baseline in sustainability reporting.',
    keywords: ['Scope 1', 'APU', 'auxiliary power unit', 'ground operations', 'CORSIA', 'fuel burn'],
    demoRelevant: true,
  },
  {
    code: 'A4545',
    name: 'Wet-Lease Operator Fuel Data Not Provided Under ACMI Agreement',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'SkyHarbor\'s ACMI contracts do not require the wet-lease operator to provide disaggregated fuel burn data by flight; SkyHarbor receives only summary monthly invoices; under CORSIA, the carrier bears reporting responsibility for all flights under its designator; without flight-level fuel data, the MRV platform applies average fuel consumption factors that can vary ±12% from actual, creating material uncertainty in CORSIA Scope 1 figures.',
    keywords: ['Scope 1', 'wet-lease', 'ACMI', 'fuel data', 'CORSIA MRV', 'flight-level data'],
  },
  {
    code: 'A4546',
    name: 'Fuel Density Correction Factor Not Applied Consistently',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Jet-A1 density varies between 0.775 and 0.840 kg/litre depending on temperature and refinery batch; SkyHarbor\'s into-plane agents at 6 stations provide uplift in litres with density certificates; the MRV platform applies a fixed density of 0.800 kg/litre at all stations rather than using the certificate values; the systematic error generates a ±3% fuel mass variance that cascades into Scope 1 CO₂ uncertainty and CORSIA compliance calculations.',
    keywords: ['Scope 1', 'fuel density', 'density correction', 'CORSIA MRV', 'into-plane', 'fuel measurement'],
  },
  {
    code: 'A4547',
    name: 'Alternative Fuel Blend Emission Factor Not Updated in MRV Platform',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'When SkyHarbor begins uplifting HEFA-SAF blended fuel, the MRV platform continues applying the standard Jet-A1 emission factor of 3.16 kgCO₂/kg to all fuel; the lower lifecycle emission factor for the SAF portion (per CORSIA LCAF methodology) is not configured; Scope 1 is overstated and the SAF carbon reduction benefit is not credited in the emissions report, making the investment in SAF invisible to MRV-based performance metrics.',
    keywords: ['Scope 1', 'SAF', 'emission factor', 'HEFA', 'CORSIA LCAF', 'MRV platform'],
  },
  {
    code: 'A4548',
    name: 'Tanker Flight Fuel Not Excluded From Per-Route Emissions Intensity',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'SkyHarbor operates tanker flights (carrying extra fuel to avoid high-cost uplift at certain stations); the extra fuel loaded for tankering is included in Scope 1 totals but the additional CO₂ is allocated to the departing route rather than being presented as a network-level cost decision; route emission intensity figures shown to corporate customers are therefore inflated by 3–7% for affected city pairs, creating commercial disputes with corporate clients managing Scope 3 travel emissions.',
    keywords: ['Scope 1', 'tankering', 'route emissions', 'corporate travel', 'Scope 3', 'fuel management'],
  },
  {
    code: 'A4549',
    name: 'Charter and Ferry Flight Scope 1 Boundary Not Defined',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'SkyHarbor\'s Scope 1 emissions inventory excludes ferry flights (positioning flights without passengers) on the grounds they are not commercial operations; CORSIA and ISSB IFRS S2 require all fuel combusted by company-operated aircraft to be included in Scope 1 regardless of commercial status; the exclusion understates Scope 1 by approximately 2.8% annually and represents a material misstatement in the TCFD climate risk disclosure.',
    keywords: ['Scope 1', 'ferry flight', 'positioning', 'CORSIA', 'ISSB IFRS S2', 'emissions boundary'],
  },
  {
    code: 'A4550',
    name: 'FMS Fuel Sensor Calibration Drift Distorts Consumption Records',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Three Boeing 737 MAX aircraft in SkyHarbor\'s fleet develop fuel quantity indicating system (FQIS) sensor drift not detected during routine maintenance checks; over 8 months the affected aircraft record fuel consumption 1.6% lower than actual; the discrepancy is identified only when MRO performs a full FQIS calibration; retrospective correction of CORSIA MRV records requires re-verification and adjustment of previously submitted quarterly monitoring reports.',
    keywords: ['Scope 1', 'FMS', 'FQIS', 'fuel sensor', 'calibration', 'CORSIA MRV'],
  },

  // ── Sub-topic 6: Scope 3 emissions calculation ───────────────────────────
  {
    code: 'A4551',
    name: 'Scope 3 Methodology Divergence: LCA vs IPCC AR6 Factors',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'SkyHarbor calculates Scope 3 Category 3 (fuel and energy-related activities) using IPCC AR5 emission factors; competitor disclosures and CDP sector guidance have shifted to AR6 factors which carry higher global warming potential for upstream methane; when MSCI ESG ratings analysts normalise for methodology, SkyHarbor\'s Scope 3 intensity appears 8% higher than disclosed, resulting in a methodology flag and request for restatement.',
    keywords: ['Scope 3', 'LCA', 'IPCC AR6', 'emission factor', 'MSCI ESG', 'well-to-wake'],
    demoRelevant: true,
  },
  {
    code: 'A4552',
    name: 'Passenger Scope 3 Travel Calculation Excludes Radiative Forcing',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Corporate customers using SkyHarbor\'s Scope 3 calculator for their own employee travel disclosure receive CO₂-only figures; ISSB IFRS S2 and GHG Protocol guidance for aviation strongly recommend including a radiative forcing multiplier (typically 1.7–2.9×) to capture non-CO₂ climate impacts (NOₓ, contrail formation, water vapour); SkyHarbor\'s tool omits this adjustment, causing corporate clients\' CDP submissions to be challenged by their own auditors.',
    keywords: ['Scope 3', 'radiative forcing', 'CO2', 'non-CO2', 'ISSB IFRS S2', 'passenger travel'],
    demoRelevant: true,
  },
  {
    code: 'A4553',
    name: 'Cargo Scope 3 Emissions Not Attributed to Shipper Customers',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'SkyHarbor\'s Scope 3 reporting covers passenger travel but does not provide a methodology for attributing belly-hold cargo emissions to freight customers; as ISSB IFRS S2 and SEC climate rules drive logistics companies to account for Scope 3 Category 4 (upstream transportation), SkyHarbor receives increasing requests from DHL, Maersk, and Amazon for per-shipment emissions data that cannot be generated from the current system.',
    keywords: ['Scope 3', 'cargo', 'belly-hold', 'freight emissions', 'ISSB IFRS S2', 'logistics'],
  },
  {
    code: 'A4554',
    name: 'Employee Business Travel Scope 3 Not Measured on SkyHarbor Own Metal',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'SkyHarbor reports Scope 3 Category 6 (business travel) for non-aviation employee travel (hotels, taxis, trains) but omits employee travel on its own aircraft, assuming it is already counted in Scope 1; GHG Protocol Category 6 requires employee air travel to be reported under Scope 3 regardless of carrier; the omission means SkyHarbor\'s own staff travel on SkyHarbor flights generates no Scope 3 Category 6 entry in the annual CDP submission.',
    keywords: ['Scope 3', 'Category 6', 'business travel', 'GHG Protocol', 'CDP', 'employee travel'],
  },
  {
    code: 'A4555',
    name: 'Upstream SAF Scope 3 Emissions Not Tracked in GHG Inventory',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'SkyHarbor\'s well-to-wake SAF lifecycle analysis is used for CORSIA credit calculation but the upstream SAF production emissions (Scope 3 Category 3) are not separately disclosed in the GHG inventory; as SAF volumes grow, the upstream Scope 3 contribution from non-conventional feedstock processing becomes material; ISSB IFRS S2 disclosure reviewers flag the omission as an incomplete representation of total value-chain emissions.',
    keywords: ['Scope 3', 'SAF', 'well-to-wake', 'upstream emissions', 'GHG inventory', 'ISSB IFRS S2'],
  },
  {
    code: 'A4556',
    name: 'Scope 3 Category 11 Not Disclosed Despite Material Aircraft Leasing',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'SkyHarbor leases 60% of its fleet under operating leases; Scope 3 Category 11 (use of sold/leased products) requires lessors to disclose emissions from their leased assets; conversely, if SkyHarbor sub-leases aircraft to wet-lease operators, those operators\' emissions may need disclosure as Category 11; SkyHarbor\'s current GHG inventory boundary analysis has not resolved which party bears reporting responsibility, creating a gap in the consolidated Scope 3 disclosure.',
    keywords: ['Scope 3', 'Category 11', 'operating lease', 'aircraft leasing', 'GHG Protocol', 'emissions boundary'],
  },
  {
    code: 'A4557',
    name: 'Scope 3 Contractor Ground Handling Emissions Not Included',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'SkyHarbor outsources ground handling to Swissport and dnata at 18 stations; ground support equipment (GSE) emissions from diesel-powered tugs, belt loaders, and ground power units operated by contractors are not included in Scope 3 Category 1 (purchased goods and services); ISS ESG and CDP reviewers identify the gap against peer disclosure standards, as ground handler emissions can represent 1.5–3% of total value-chain GHG intensity.',
    keywords: ['Scope 3', 'Category 1', 'ground handling', 'GSE', 'Swissport', 'dnata'],
  },
  {
    code: 'A4558',
    name: 'Customer Scope 3 API Returns Wrong Emission Methodology',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'SkyHarbor provides a Scope 3 emissions API to corporate travel managers and TMC booking tools; the API documentation specifies ICAO Carbon Emissions Calculator methodology but the implementation uses an older proprietary method with different seat factors and load assumptions; corporate clients discover the discrepancy when reconciling the API output against their own ICAO Calculator checks, generating support tickets and eroding confidence in SkyHarbor\'s sustainability data products.',
    keywords: ['Scope 3', 'ICAO Carbon Emissions Calculator', 'corporate travel', 'API', 'methodology', 'emission factor'],
    demoRelevant: true,
  },
  {
    code: 'A4559',
    name: 'Scope 3 Well-to-Wake vs Tank-to-Wake Disclosure Not Labelled',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'SkyHarbor\'s annual report discloses a single "aviation emissions" figure without specifying whether it is tank-to-wake (combustion only) or well-to-wake (full lifecycle); a 22% gap between the two methodologies means that MSCI ESG and analyst models applying well-to-wake restate SkyHarbor\'s emissions intensity 22% higher than reported, generating divergent coverage in ESG indices and confusing investor sustainability comparisons.',
    keywords: ['Scope 3', 'tank-to-wake', 'well-to-wake', 'disclosure', 'MSCI ESG', 'ISSB IFRS S2'],
    demoRelevant: true,
  },
  {
    code: 'A4560',
    name: 'Scope 3 Interline Partner Emissions Omitted From Calculation',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Passengers connecting via SkyHarbor interline partners on the same itinerary generate Scope 3 downstream transport emissions attributable to SkyHarbor under GHG Protocol Category 9 (downstream transportation); no interline emission data-sharing protocol exists between SkyHarbor and its 32 interline partners; connecting itinerary emissions are excluded from the Scope 3 inventory by default, understating the transport network footprint disclosed to corporate accounts.',
    keywords: ['Scope 3', 'Category 9', 'interline', 'connecting itinerary', 'GHG Protocol', 'corporate accounts'],
  },

  // ── Sub-topic 7: SAF chain of custody — ISCC PLUS ────────────────────────
  {
    code: 'A4561',
    name: 'ISCC PLUS Certification Lapse Invalidates SAF Sustainability Claims',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'SkyHarbor\'s ISCC PLUS certification for SAF chain-of-custody lapses when the annual surveillance audit is not scheduled in time; during the 47-day gap between expiry and reinstatement, the carrier cannot claim SAF sustainability attributes for CORSIA or ReFuelEU compliance purposes even though physically certified SAF was uplifted; the lapse is reported to the national authority and reduces the carrier\'s compliance SAF volume for the quarter.',
    keywords: ['ISCC PLUS', 'SAF', 'chain of custody', 'certification lapse', 'CORSIA', 'ReFuelEU'],
    demoRelevant: true,
  },
  {
    code: 'A4562',
    name: 'RSB Certification Not Accepted at All EU Airports',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'SkyHarbor holds RSB (Roundtable on Sustainable Biomaterials) certification for SAF chain of custody at its home hub; two EU outstation airports where SkyHarbor uplifts SAF have supply chains certified only under ISCC PLUS; RSB and ISCC PLUS are both CORSIA-eligible schemes but the mass balance books are kept separately; SkyHarbor\'s sustainability team cannot aggregate the two schemes into a single consolidated SAF volume, creating a fragmented compliance picture and over-complicating the annual ReFuelEU declaration.',
    keywords: ['RSB', 'ISCC PLUS', 'SAF', 'chain of custody', 'mass balance', 'ReFuelEU'],
  },
  {
    code: 'A4563',
    name: 'SAF Mass Balance Chain-of-Custody Record Audit Trail Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Under ISCC PLUS mass balance, SkyHarbor must maintain an auditable record linking each SAF uplift event to a specific certified batch; an upgrade of the fuel management software deletes the linkage between batch certificates and uplift records for a 6-week period; the ISCC PLUS auditor cannot confirm chain of custody for 2,400 tonnes of SAF during that window; the certification body issues a non-conformance notice and requires re-audit of the affected period.',
    keywords: ['ISCC PLUS', 'SAF', 'mass balance', 'chain of custody', 'audit trail', 'FuelPlus'],
    demoRelevant: true,
  },
  {
    code: 'A4564',
    name: 'ASTM D7566 Annex Specification Not Confirmed Before SAF Purchase',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'SkyHarbor procures a batch of biojet fuel from a new supplier; the fuel meets ASTM D7566 overall specification but is produced via a hydroprocessed esters and fatty acids (HEFA) pathway that is certified as Annex A2 rather than the ASTM D7566 Annex A1 (Fischer-Tropsch) pathway specified in SkyHarbor\'s airline fuel specification; the mismatch requires a requalification notice from the airframe OEM before the fuel can be cleared for use, causing a 9-day supply interruption.',
    keywords: ['ASTM D7566', 'SAF', 'HEFA', 'Fischer-Tropsch', 'biojet fuel', 'fuel specification'],
  },
  {
    code: 'A4565',
    name: 'SAF Certification Scheme Not Recognised by Destination Country Regulator',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'SkyHarbor claims SAF blending credit under ISCC PLUS for a route operated to a non-EU country that has mandated a national SAF certification scheme not aligned with ISCC PLUS; the destination country\'s civil aviation authority does not recognise the ISCC PLUS certificate as fulfilling the local mandate, requiring SkyHarbor to obtain an additional national certification and re-audit the supply chain at that airport, delaying SAF operations by 4 months.',
    keywords: ['ISCC PLUS', 'SAF', 'certification', 'national mandate', 'chain of custody', 'regulatory'],
  },
  {
    code: 'A4566',
    name: 'SAF Book-and-Claim Accounting Not Implemented for Non-Hub Routes',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Physical SAF supply is unavailable at 16 of SkyHarbor\'s 40 operating stations; the ICAO CORSIA book-and-claim accounting framework would allow attributing SAF sustainability benefits independent of physical fuel location; SkyHarbor\'s ISCC PLUS scope does not cover book-and-claim transfers; the carrier therefore cannot credit SAF attributes at non-hub airports, leaving one-third of its network unable to generate SAF compliance volume despite paying a green premium in the consolidated fuel pool.',
    keywords: ['SAF', 'book and claim', 'ISCC PLUS', 'CORSIA', 'non-hub', 'chain of custody'],
  },
  {
    code: 'A4567',
    name: 'SAF Supplier Certificate of Sustainability Not Renewed Annually',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'SkyHarbor\'s SAF supplier provides annual Certificates of Sustainability (CoS) per ISCC PLUS; the procurement team does not track CoS expiry dates; for one supplier, the CoS expires in March and is not renewed until June; SAF uplifted during those 3 months cannot be claimed as sustainable even though the supplier\'s own certification remains valid, because SkyHarbor\'s chain-of-custody record shows a gap in the CoS linkage.',
    keywords: ['ISCC PLUS', 'SAF', 'Certificate of Sustainability', 'CoS', 'chain of custody', 'procurement'],
  },
  {
    code: 'A4568',
    name: 'Blending Facility ISCC PLUS Scope Excludes SAF SkyHarbor Purchases',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'SkyHarbor\'s fuel supplier blends SAF at a depot that holds ISCC PLUS certification; the ISCC PLUS scope certificate for the depot was issued before SkyHarbor became a customer and specifies a list of certified end-users that does not include SkyHarbor; the certification body advises that SkyHarbor cannot benefit from the depot\'s certification until an updated scope certificate names SkyHarbor explicitly, requiring a 12-week recertification cycle.',
    keywords: ['ISCC PLUS', 'SAF', 'blending facility', 'scope certificate', 'chain of custody', 'certification'],
  },
  {
    code: 'A4569',
    name: 'SAF Feedstock Traceability Lost After Third-Party Logistics Transfer',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'SkyHarbor\'s SAF supply chain passes through a third-party logistics provider (pipeline or tanker) that is not itself ISCC PLUS certified; ISCC PLUS requires every entity handling the product in the chain to hold a valid certificate; the logistics intermediary\'s absence from the certification chain breaks traceability; the ISCC PLUS auditor deems this a critical non-conformance and suspends SkyHarbor\'s right to claim the SAF attributes for all volumes transited through that provider.',
    keywords: ['ISCC PLUS', 'SAF', 'traceability', 'logistics', 'chain of custody', 'non-conformance'],
    demoRelevant: true,
  },
  {
    code: 'A4570',
    name: 'SAF Co-Processing Credit Claim Beyond ASTM D7566 Blending Limit',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'A refinery co-processing bio-feedstock with conventional crude offers SkyHarbor a co-processing credit representing 15% SAF content; ASTM D7566 and CORSIA limit co-processed fuel to a maximum 50% SAF blend in the final fuel; SkyHarbor\'s claim documentation does not verify the blend does not exceed the CORSIA-accepted co-processing methodology limits; the verifier rejects 8,000 tCO₂e of claimed CORSIA benefit pending independent blend analysis.',
    keywords: ['SAF', 'co-processing', 'ASTM D7566', 'CORSIA', 'blend limit', 'verification'],
  },

];
