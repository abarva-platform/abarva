// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Airport Operations & Ground Handling
// Code range: A2100-A2399
// Run: npx tsx src/scripts/seed/seed-airline-dom07-airport-ops.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineAirportOpsPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_AIRPORT_OPS_PATTERNS: AirlineAirportOpsPatternSeed[] = [
  {
    code: 'A2100',
    name: 'Turnaround Milestone Feed Missing Ramp Ownership',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Airport turnaround dashboards fail when milestones such as chocks-on, bags-off, fueling-start, catering-complete, and boarding-ready are captured without a named ramp owner. The OCC sees a late turn forming but cannot tell whether ground handler, fueler, catering, or gate operations owns the recovery action.',
    keywords: ['turnaround', 'A-CDM', 'ramp ownership', 'OCC', 'milestone feed'],
    demoRelevant: true,
  },
  {
    code: 'A2101',
    name: 'Gate Conflict Solver Ignores Tow Crew Availability',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Gate optimization assigns aircraft to remote stands that require towing, but the model does not check whether tow crews and tugs are available inside the required window. The plan looks feasible in the airport system and then collapses into arrival holding, bus delays, and missed connections.',
    keywords: ['gate optimization', 'tow crew', 'AODB', 'remote stand', 'arrival holding'],
    demoRelevant: true,
  },
  {
    code: 'A2102',
    name: 'Common-Use Kiosk Rules Not Synced With DCS',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Common-use kiosks apply check-in eligibility rules that lag behind the departure control system after a policy or itinerary-change update. Passengers who should be able to self-serve are pushed to staffed counters, while some ineligible passengers receive boarding documents that fail at security or boarding scan.',
    keywords: ['CUSS kiosk', 'DCS', 'IATA CUTE', 'check-in', 'boarding pass'],
  },
  {
    code: 'A2103',
    name: 'Bag Drop Capacity Modeled Without Passenger Arrival Curve',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      'Bag drop staffing models use scheduled departures rather than passenger arrival curves, underestimating queue pressure before early morning banks. The airport appears adequately staffed on a flight-count basis, but actual passengers arrive in compressed waves and exceed TSA handoff targets.',
    keywords: ['bag drop', 'arrival curve', 'queue model', 'TSA', 'airport staffing'],
    demoRelevant: true,
  },
  {
    code: 'A2104',
    name: 'Boarding Sequence Not Rebuilt After Aircraft Swap',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'The boarding system retains the original aircraft boarding sequence after an equipment swap changes cabin layout and seat zones. Gate agents board passengers in the wrong order, overhead bin space fills unevenly, and the turn loses minutes that were not visible in the swap decision.',
    keywords: ['boarding', 'aircraft swap', 'seat zones', 'DCS', 'turn time'],
  },
  {
    code: 'A2105',
    name: 'Ground Handler SLA Measured After Departure Only',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Ground handler performance is scored on final departure delay rather than intermediate controllable milestones. A handler can miss bags-off and catering-ready targets but appear compliant if flight crews recover the delay, masking the real source of operational fragility.',
    keywords: ['ground handler SLA', 'turnaround', 'milestone KPI', 'IATA AHM', 'vendor management'],
  },
  {
    code: 'A2106',
    name: 'Deicing Queue Not Integrated With Departure Sequencing',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Winter operations fail when the deicing pad queue is planned separately from gate pushback and runway departure sequencing. Aircraft push on time, wait too long for deicing, and then require repeat treatment or lose their ATC slot.',
    keywords: ['deicing', 'departure sequencing', 'ATC slot', 'A-CDM', 'winter ops'],
  },
  {
    code: 'A2107',
    name: 'Real-Time Stand Plan Missing Accessibility Constraints',
    officeCategory: 'front_office',
    failureRatePct: 52,
    description:
      'Stand reassignments during disruption optimize aircraft flow but ignore wheelchair, jet bridge, and bus-lift constraints for passengers requiring assistance. The airport plan clears the aircraft but creates a passenger-rights failure when PRM support cannot reach the remote stand in time.',
    keywords: ['PRM', 'remote stand', 'accessibility', 'IATA', 'stand planning'],
  },
  {
    code: 'A2108',
    name: 'Gate Agent Override Not Written Back To Operations Control',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Gate agents make local decisions such as holding boarding, changing sequence, or accepting late bags, but those overrides are not written back to the OCC event stream. Central operations keeps optimizing against stale assumptions and may trigger a conflicting recovery action.',
    keywords: ['gate override', 'OCC', 'event stream', 'boarding', 'AODB'],
  },
  {
    code: 'A2109',
    name: 'Airport Resource Plan Ignores Regional Jet Bank Compression',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Resource planning treats regional jet arrivals as lower complexity because aircraft are smaller, but hub banks compress many regional turns into the same short window. Stairs, belt loaders, and ramp crews become the bottleneck even though total passenger volume appears manageable.',
    keywords: ['regional jet', 'resource planning', 'belt loader', 'ramp crew', 'hub bank'],
    demoRelevant: true,
  },
  {
    code: 'A2110',
    name: 'Turnaround Prediction Trained On Clean-Weather Data',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Turnaround prediction models look accurate in normal conditions because they were trained mostly on clean-weather turns. During rain, snow, or heat restrictions, the model keeps promising achievable off-block times and causes downstream connections to be protected too long.',
    keywords: ['turnaround prediction', 'weather operations', 'ML model', 'off-block time', 'connection protection'],
  },
  {
    code: 'A2111',
    name: 'Catering Uplift Not Reconciled To Final Passenger Count',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Catering orders are locked before late bookings, standby clears, and misconnect reaccommodations settle into the final passenger count. Flights depart with meal shortages or unnecessary uplift, and premium-cabin service recovery costs appear as a crew issue rather than a data-timing failure.',
    keywords: ['catering uplift', 'passenger count', 'DCS', 'premium cabin', 'service recovery'],
  },
  {
    code: 'A2112',
    name: 'Fuel Truck Dispatch Blind To Gate Reassignment',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Fuel dispatch receives the original gate assignment but not the latest reassignment from the airport operational database. Trucks arrive at the wrong gate, miss the fueling window, and create a late turn that operations records as generic ramp delay.',
    keywords: ['fuel dispatch', 'AODB', 'gate reassignment', 'turnaround', 'ramp delay'],
  },
  {
    code: 'A2113',
    name: 'Boarding Readiness Uses Door-Open Instead Of Cabin-Ready',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Boarding readiness dashboards mark a flight as ready when the aircraft door opens, not when cleaning, catering, crew briefing, and safety checks are complete. Gate agents begin preboarding too early, then hold passengers in the jet bridge and degrade premium experience.',
    keywords: ['boarding readiness', 'cabin ready', 'jet bridge', 'turnaround', 'DCS'],
  },
  {
    code: 'A2114',
    name: 'Airport Delay Codes Too Coarse For Root Cause',
    officeCategory: 'middle_office',
    failureRatePct: 51,
    description:
      'Delay coding collapses ramp, gate, fueling, catering, cleaning, and passenger-assistance issues into broad airport operations buckets. Executives see delay minutes but cannot isolate which vendor, station, or process is causing repeat failure.',
    keywords: ['delay code', 'IATA delay codes', 'root cause', 'station performance', 'airport ops'],
  },
  {
    code: 'A2115',
    name: 'Self-Boarding Gate Not Synced With Seat Changes',
    officeCategory: 'front_office',
    failureRatePct: 53,
    description:
      'Biometric or self-boarding gates read boarding entitlement before last-minute seat and cabin changes are fully synchronized from DCS. Passengers with valid reassignments are rejected at the gate, creating manual intervention and boarding lane congestion.',
    keywords: ['self-boarding', 'biometric gate', 'DCS', 'seat change', 'IATA One ID'],
  },
  {
    code: 'A2116',
    name: 'Station Playbook Not Localized For Airport Constraints',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Corporate operating playbooks assume standard gate, staffing, and vendor arrangements that do not exist at smaller outstations. Local teams improvise around airport-specific constraints, so the same disruption playbook produces very different outcomes by station.',
    keywords: ['station playbook', 'outstation', 'airport constraints', 'SOP', 'IROPS'],
  },
  {
    code: 'A2117',
    name: 'Minimum Connection Time Not Updated After Terminal Move',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Published minimum connection times remain unchanged after airport construction or terminal relocation changes walking distance and security flow. The schedule sells legal connections that are operationally unrealistic, increasing misconnects and reaccommodation cost.',
    keywords: ['minimum connection time', 'MCT', 'terminal move', 'schedule', 'misconnect'],
  },
  {
    code: 'A2118',
    name: 'Ramp Safety Event Closed Without Trend Linkage',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Ramp safety events are investigated and closed individually without linking repeated belt-loader, wing-walker, or headset-procedure issues across stations. The SMS record shows closure, but the underlying pattern keeps recurring until a larger ground damage event exposes the trend.',
    keywords: ['ramp safety', 'SMS', 'belt loader', 'ground damage', 'trend analysis'],
  },
  {
    code: 'A2119',
    name: 'Passenger Assistance Queue Hidden From Turn Decision',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Operations control decides whether a flight can make turn time without visibility into wheelchair and special-assistance queues. The aircraft may be technically ready, but boarding cannot close until assisted passengers are delivered, creating late departures that appear preventable only after the fact.',
    keywords: ['passenger assistance', 'wheelchair queue', 'PRM', 'turn decision', 'boarding'],
  },
  {
    code: 'A2120',
    name: 'Airport Staffing Forecast Ignores Sick-Call Clustering',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Station staffing forecasts use average absenteeism and miss sick-call clustering after weather events, holidays, or local labor actions. The model declares the station covered, but simultaneous gaps in gate, ramp, and baggage teams make the published schedule unworkable.',
    keywords: ['station staffing', 'absenteeism', 'labor relations', 'ramp crew', 'forecasting'],
  },
  {
    code: 'A2121',
    name: 'Ground Power Unit Availability Missing From Delay Prediction',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      'Delay prediction models include aircraft arrival time and gate availability but exclude ground power unit availability. Aircraft sit on APU longer than planned, maintenance flags increase, and the station loses turn time while the model still labels the turn low risk.',
    keywords: ['GPU', 'delay prediction', 'APU', 'ground equipment', 'turnaround'],
  },
  {
    code: 'A2122',
    name: 'Airport Construction Changes Not Reflected In Customer Wayfinding',
    officeCategory: 'front_office',
    failureRatePct: 50,
    description:
      'Terminal construction closes walkways and changes security entry points, but mobile app maps and airport emails are updated manually after a delay. Passengers miss boarding windows because wayfinding guidance is wrong, and the issue is misread as passenger lateness.',
    keywords: ['wayfinding', 'airport construction', 'mobile app', 'security checkpoint', 'boarding'],
  },
  {
    code: 'A2123',
    name: 'Station Vendor Handoff Missing Evidence Trail',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Catering, cleaning, fueling, and ground handling vendors mark jobs complete in separate tools with no shared timestamped evidence trail. When a delay occurs, vendors dispute ownership and the station manager cannot prove which service missed its SLA.',
    keywords: ['vendor handoff', 'ground handling', 'SLA', 'timestamp', 'station operations'],
  },
  {
    code: 'A2124',
    name: 'Late Bag Decision Not Connected To Connection Value',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Ramp teams decide whether to wait for late bags without visibility into passenger connection value, elite status, or downstream baggage recovery cost. The flight may leave on time, but the decision creates high-cost mishandled bags and premium customer recovery exposure.',
    keywords: ['late bag', 'connection value', 'baggage', 'FFP', 'ramp decision'],
  },
  {
    code: 'A2125',
    name: 'Airport Ops Dashboard Masks Manual Radio Workarounds',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'Dashboards show digital milestone completion while station teams actually coordinate exceptions over radio and text. The digital record looks clean, but the operation depends on undocumented manual workarounds that cannot scale during disruption.',
    keywords: ['airport dashboard', 'radio workaround', 'AODB', 'manual process', 'operations control'],
  },
  {
    code: 'A2126',
    name: 'International Document Check Queue Not Modeled',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'International departures are staffed like domestic flights even when visa, passport, and entry-document checks require manual review. Kiosk and app check-in deflect fewer passengers than expected, and document-check queues become the hidden constraint on boarding close.',
    keywords: ['document check', 'IATA Timatic', 'international departure', 'check-in', 'boarding'],
  },
  {
    code: 'A2127',
    name: 'Remote Stand Bus Plan Missing Mobility Capacity',
    officeCategory: 'front_office',
    failureRatePct: 49,
    description:
      'Remote stand plans count bus seats but not wheelchair lifts, stroller handling, or passenger assistance staffing. The aircraft and crew are ready, but passengers cannot be moved safely or quickly enough to meet the planned off-block time.',
    keywords: ['remote stand', 'bus operation', 'PRM', 'mobility capacity', 'off-block'],
  },
  {
    code: 'A2128',
    name: 'Airport Queue AI Trained On Camera Blind Spots',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'Queue prediction AI uses camera feeds that miss overflow lines around corners, elevators, and temporary barriers. The model underestimates wait time at exactly the moments when queue spillover is most operationally important.',
    keywords: ['queue AI', 'computer vision', 'airport camera', 'wait time', 'model drift'],
  },
  {
    code: 'A2129',
    name: 'Station Readiness Review Excludes Cyber Dependency',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Airport readiness reviews focus on staffing, gates, and vendors but do not test network dependency for kiosks, bag drops, scanners, and common-use workstations. A local network incident turns into a station-level operational failure because offline procedures were never rehearsed.',
    keywords: ['station readiness', 'CUTE', 'airport network', 'offline procedure', 'cyber resilience'],
  },
  {
    code: 'A2130',
    name: 'Airport Queue Vision AI Underreads Overflow Lines',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Queue AI uses camera feeds that miss overflow lines around corners, elevators, and temporary construction barriers. The model reports acceptable wait times while passengers are already spilling into security and bag-drop choke points.',
    keywords: ['queue AI', 'computer vision', 'ACI', 'camera blind spot', 'wait time'],
    demoRelevant: true,
  },
  {
    code: 'A2131',
    name: 'Gate AI Recommends Unserviceable Remote Stand',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Gate-assignment AI optimizes aircraft movement but omits PRM lifts, bus availability, and tow-crew constraints. The recommended stand is mathematically efficient and operationally impossible for the passenger mix on the flight.',
    keywords: ['gate AI', 'PRM', 'A-CDM', 'remote stand', 'constraint model'],
    demoRelevant: true,
  },
  {
    code: 'A2132',
    name: 'Turnaround AI Missing Ground Handler Adoption Telemetry',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'Turnaround AI recommends next-best actions to ground handlers, but the contract and workflow do not capture whether supervisors accept, reject, or ignore the recommendation. Moves teams cannot prove whether the AI failed or frontline adoption failed.',
    keywords: ['turnaround AI', 'adoption telemetry', 'ground handler', 'SLA', 'Moves'],
    demoRelevant: true,
  },
  {
    code: 'A2133',
    name: 'Bag Routing AI Optimizes Speed Over Mishandled-Bag Risk',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Bag-routing AI prioritizes shortest physical path through the baggage system without enough penalty for tight connections, international transfer rules, or high-value loyalty customers. Bags move quickly through the airport but miss the operational promise that matters.',
    keywords: ['baggage AI', 'mishandled bag', 'IATA 753', 'loyalty', 'connection risk'],
    demoRelevant: true,
  },
  {
    code: 'A2134',
    name: 'Computer Vision Boarding Counts Lack DCS Reconciliation',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description:
      'Computer vision counts boarded passengers but is not reconciled against DCS scan state and manifest exceptions. Gate teams see two credible headcounts during boarding close, delaying departure while supervisors resolve which system is authoritative.',
    keywords: ['computer vision', 'DCS', 'boarding count', 'manifest', 'model reconciliation'],
    demoRelevant: true,
  },
  {
    code: 'A2135',
    name: 'Airport AI Vendor Lacks Offline Mode SLA',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'An airport optimization vendor demonstrates strong cloud AI performance but does not contract for degraded offline behavior at stations with unstable connectivity. Source teams buy the optimization story without securing the continuity clause that keeps operations moving during network events.',
    keywords: ['airport AI', 'offline SLA', 'Source', 'station network', 'business continuity'],
    demoRelevant: true,
  },
  {
    code: 'A2136',
    name: 'Ramp Safety AI Flags Hazards Without CAPA Linkage',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Ramp computer-vision AI flags unsafe proximity or equipment movement but does not create a linked SMS/CAPA workflow. The alert stream grows while corrective actions remain informal, so safety risk is detected without being governed.',
    keywords: ['ramp safety AI', 'SMS', 'CAPA', 'computer vision', 'ground equipment'],
    demoRelevant: true,
  },
  {
    code: 'A2137',
    name: 'AI Staffing Forecast Ignores Union Work Rules',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Airport staffing AI forecasts demand correctly but does not encode union work rules, break rules, cross-utilization limits, or station-specific bid lines. The recommended staffing plan cannot be implemented without grievances or premium-pay leakage.',
    keywords: ['staffing AI', 'union work rules', 'labor agreement', 'station staffing', 'forecast'],
    demoRelevant: true,
  },
];
