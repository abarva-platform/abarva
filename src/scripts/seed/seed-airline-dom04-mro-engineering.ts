// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns — MRO Engineering, Airworthiness & Technical Operations
// Domain: MRO Engineering, Airworthiness Management & Technical Operations
// Code range: A1200–A1499 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-airline-dom04-mro-engineering.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineMROPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
}

export const AIRLINE_MRO_PATTERNS: AirlineMROPatternSeed[] = [

  // ── 1. Component traceability and serial-number master record failures ─────
  {
    code: 'A1200',
    name: 'Triple-System Component Identity Conflict',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'SkyHarbor operates three maintenance tracking systems — AMOS, iTrak, and a legacy Access database — each of which carries a different part number or serial-number representation for the same physical component. When a component is removed from an aircraft, technicians must manually cross-reference all three systems to confirm serviceable status, a process that takes 45–90 minutes per component and introduces transcription errors at each step. The root cause is that no master component register was established when iTrak was introduced alongside the existing Access database, and AMOS was later layered on top without a data-migration reconciliation. FAA Part 145 repair-station audits have flagged this as a compliance risk because traceability documentation submitted to the regulator cannot be independently verified against a single authoritative source.',
    keywords: ['component traceability', 'serial number', 'AMOS', 'iTrak', 'part number reconciliation'],
  },
  {
    code: 'A1201',
    name: 'Rotable Pool Status Mismatch Across Systems',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'The serviceable/unserviceable status of rotable components differs between AMOS and iTrak in approximately 8% of records at any given time, because status updates entered in one system are not propagated in real time to the other. Technicians acting on iTrak data have issued rotables that AMOS flagged as awaiting overhaul, creating an airworthiness exposure that was discovered only during a subsequent shop visit when the component arrived with an open AD compliance item. The reconciliation cycle runs weekly, meaning the window of exposure can span seven days.',
    keywords: ['rotable', 'serviceable status', 'airworthiness', 'AMOS', 'system reconciliation'],
  },
  {
    code: 'A1202',
    name: 'Bogus Part Detection Gap From Fragmented History',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Component life-limited part (LLP) history and overhaul cycle counts are split across the three tracking systems, making it impossible to produce a single continuous back-to-birth traceability record without manual aggregation. This creates an opening for counterfeit or unapproved parts (non-PMA, undocumented overhaul) to enter the fleet because the approval chain cannot be fully reconstructed from any one system. The FAA requires 8130-3 back-to-birth traceability for life-limited parts; gaps in the record have required two fleet-wide component audits in the past 18 months.',
    keywords: ['bogus parts', 'LLP', 'back-to-birth traceability', '8130-3', 'PMA part'],
  },
  {
    code: 'A1203',
    name: 'Component Overhaul Interval Tracked In Disparate Units',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Hard-time overhaul intervals for rotables are stored in flight hours in AMOS, in cycles in iTrak, and in calendar months in the Access database, with no automated conversion layer. When schedulers build a maintenance plan, they must manually convert and compare all three values to determine whether a component is within its approved operating interval. Conversion errors have resulted in two components being operated 120 hours beyond their approved hard-time limit, each requiring unscheduled removals and retroactive FAA records corrections.',
    keywords: ['overhaul interval', 'flight hours', 'cycles', 'hard-time limit', 'component scheduling'],
  },
  {
    code: 'A1204',
    name: 'Shop Visit Records Trapped In AMO Paper Files',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Third-party AMOs performing component overhauls return the completed 8130-3 and work-order package as paper documents. The receiving inspection team scans these and files them in a network share, but the scan metadata is not linked to the component serial number in either AMOS or iTrak. When a technician needs the last overhaul record — for AD compliance verification or end-of-lease preparation — they must search the file share by estimated date range, a process that takes hours and sometimes fails to locate the correct document entirely.',
    keywords: ['shop visit records', 'AMO', '8130-3', 'paper records', 'document management'],
  },
  {
    code: 'A1205',
    name: 'Component Return-To-Service Sign-Off Not Linked To Digital Record',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Authorised Release Certificates (ARCs) issued by FAA Part 145 repair stations are physically signed and stored in a filing room, but the digital entry in AMOS confirming return to service is made by a different individual hours or days later from memory or a handwritten note. The time gap and the split-entry model create discrepancies where the digital record shows a component as serviceable before the ARC has been formally reviewed and accepted, undermining the compliance audit trail.',
    keywords: ['authorised release certificate', 'ARC', 'return to service', 'FAA Part 145', 'digital record'],
  },
  {
    code: 'A1206',
    name: 'Pantogon Qube Integration Never Completed After Procurement',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'SkyHarbor purchased Pantogon Qube as a dedicated component-tracking solution three years ago; the system was installed but the bi-directional integration with AMOS was never completed after the integration vendor hit scope overruns and the project budget was exhausted. Qube currently holds a partial component master that is updated manually by one person, making it a fourth source of truth rather than the intended single source. Integration completion is not on the current capital plan.',
    keywords: ['Pantogon Qube', 'component tracking', 'AMOS integration', 'system integration', 'capital plan'],
  },
  {
    code: 'A1207',
    name: 'Serial-Number Entry Free-Text Format Inconsistency',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'All three maintenance tracking systems accept serial-number input as free text with no validation against a manufacturer reference format. Technicians enter the same serial number in multiple ways (with/without hyphens, leading zeros, prefix letters), producing duplicate records for the same physical component. A 2024 internal audit found 340 duplicate serial-number entries across the combined systems, each requiring manual adjudication to determine the canonical record.',
    keywords: ['serial number', 'data quality', 'free text', 'duplicate records', 'master data'],
  },
  {
    code: 'A1208',
    name: 'Component Loan and Exchange Records Not Closing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'When SkyHarbor borrows a component from another carrier on an AOG loan, the loan transaction is opened in iTrak but the closure — confirming the borrowed part was returned and the owned spare installed — is frequently never entered. This leaves the fleet records showing loan components as permanently installed, which inflates the virtual fleet value, confuses next-due overhaul calculations, and creates insurance and lease-return documentation problems when the aircraft exits the fleet.',
    keywords: ['component loan', 'AOG', 'exchange transaction', 'fleet records', 'iTrak'],
  },
  {
    code: 'A1209',
    name: 'Life-Limited Part Counter Reset Not Validated At Installation',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'When a life-limited part (LLP) is installed after shop overhaul, the cycle counter reset must be manually entered and approved in AMOS by a separate authoriser. In practice, the entry is made by the installing technician without the required independent check in 34% of cases reviewed, because the authorisation workflow in AMOS requires navigating three additional screens and the authoriser is often at a different station. The result is unverified counter resets that could mask a part approaching its certified life limit.',
    keywords: ['LLP', 'life-limited part', 'cycle counter', 'AMOS workflow', 'independent check'],
  },
  {
    code: 'A1210',
    name: 'Expendable Parts Treated As Rotables In Legacy DB',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The Access database classifies approximately 1,200 part numbers as rotable that are designated expendable by the manufacturer. These parts are being tracked through the shop-visit overhaul cycle instead of being expensed and scrapped, resulting in overhaul costs being capitalised for parts that have no manufacturer-approved overhaul data. The misclassification also prevents timely scrap disposition, leaving non-repairable parts in the serviceable pool.',
    keywords: ['expendable', 'rotable', 'part classification', 'overhaul', 'scrap disposition'],
  },
  {
    code: 'A1211',
    name: 'Engine Module Component Tracking Breaks At Tear-Down',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `During engine shop visits at third-party AMOs, individual module components (HPT blades, LPT discs, combustor liners) are removed and their serial numbers should be tracked against the engine serial number in AMOS. In practice, the AMO submits a module-level work package that groups component removals without individual serial-number entries, creating a gap in component history that only surfaces when a specific part's traceability is queried for AD compliance or end-of-lease purposes.`,
    keywords: ['engine MRO', 'module component', 'shop visit', 'serial number tracking', 'AMO'],
  },
  {
    code: 'A1212',
    name: 'Component Pooling Agreement Data Not In Any Tracking System',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'SkyHarbor participates in three rotable pool agreements with other carriers, under which components may be used from the shared pool without triggering an immediate exchange. The pool participation data — which components are eligible, usage fee triggers, and ownership reversion rules — is documented in spreadsheets held by the contracts team but not integrated into AMOS, iTrak, or Qube. Technicians have no visibility into pool eligibility at the point of installation, leading to missed pool recoveries and invoicing disputes.',
    keywords: ['rotable pool', 'pooling agreement', 'component management', 'AMOS', 'contracts'],
  },
  {
    code: 'A1213',
    name: 'Historical Access Database Not Readable By Current Systems',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'The legacy Access database holding component history predating the AMOS implementation is no longer actively maintained and requires a specific version of Microsoft Access no longer supported on current workstations. Records from 2006–2015 are effectively inaccessible for day-to-day queries. When regulators or lessors request historical traceability that spans that period, SkyHarbor must locate one of two technicians who retain personal copies of the Access runtime, creating a single-point-of-failure access risk for legally required records.',
    keywords: ['legacy database', 'Access', 'historical records', 'traceability', 'data accessibility'],
  },
  {
    code: 'A1214',
    name: 'Incoming Inspection Data Not Feeding Component Master',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'When new rotable components arrive from suppliers or overhaul shops, incoming inspection results and time-since-new data are recorded on paper receiving inspection forms that are not entered into any digital system. The first digital entry for a newly received component occurs when it is installed on an aircraft, meaning the pre-installation inspection history is lost and the component\'s cycle and hour counters are populated from the delivery note rather than from a validated inspection, introducing errors that compound over the component\'s service life.',
    keywords: ['incoming inspection', 'receiving inspection', 'component master', 'time-since-new', 'data entry'],
  },

  // ── 2. AD/SB compliance tracking governance failures ─────────────────────
  {
    code: 'A1215',
    name: 'Airworthiness Directive Due-Date Inconsistency Across Systems',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      'Airworthiness directives are entered into both AMOS and the CAMO organisation\'s CORRIDOR records system with due dates calculated independently by two different engineers. Because AMOS calculates the AD compliance due date from the aircraft\'s total flight hours and cycles as tracked in the system, while CORRIDOR uses the aircraft technical log, the two figures diverge whenever an aircraft undergoes a major configuration change or when hours are adjusted during a records audit. SkyHarbor has had four instances in 18 months where the AMOS due date showed compliance margin while CORRIDOR indicated an overrun, requiring emergency maintenance actions to resolve.',
    keywords: ['airworthiness directive', 'AD compliance', 'AMOS', 'CORRIDOR', 'due date'],
  },
  {
    code: 'A1216',
    name: 'Service Bulletin Applicability Assessment Not Documented',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'When OEMs issue service bulletins, the CAMO engineering team performs an applicability assessment to determine whether each SB applies to SkyHarbor aircraft based on MSN, configuration, and modification status. This assessment is performed informally, with the engineer annotating a printed SB and filing it in a physical folder. No structured digital record of the assessment outcome is created in AMOS or CORRIDOR, so if the same SB is re-evaluated six months later (e.g., after it becomes mandatory via AD), the assessment must be repeated from scratch because no record of the prior analysis exists.',
    keywords: ['service bulletin', 'SB applicability', 'CAMO', 'engineering assessment', 'documentation'],
  },
  {
    code: 'A1217',
    name: 'FAA DRS Data Not Reconciled With AMOS AD Register',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'SkyHarbor subscribes to the FAA Designated Airworthiness Representative System (DRS) for AD issuance notifications, but the process for importing new ADs into the AMOS compliance register is manual: an engineer reviews the DRS feed weekly, identifies applicable ADs, and manually creates entries in AMOS. During periods of vacation or workload peaks, this weekly review slips to bi-weekly or monthly, creating windows where newly issued ADs are not in the active compliance register for up to 30 days after publication.',
    keywords: ['FAA DRS', 'airworthiness directive', 'AMOS', 'AD register', 'compliance gap'],
  },
  {
    code: 'A1218',
    name: 'EASA ECAR Directives Not Mapped To FAA Fleet',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'SkyHarbor operates aircraft type-certificated in both the US and EU; several aircraft have components with EASA type design approval that are subject to EASA Continuing Airworthiness Requirements (ECA R) in addition to FAA ADs. The CAMO function tracks FAA ADs systematically but has no formal process for monitoring ECAR applicability. Two ECA R directives applicable to installed components were identified by an EASA-authorised repair station during a component overhaul, not by SkyHarbor\'s own compliance programme.',
    keywords: ['EASA ECAR', 'FAA', 'continuing airworthiness', 'CAMO', 'dual-authority compliance'],
  },
  {
    code: 'A1219',
    name: 'Repetitive Inspection ADs Tracked By Calendar Not By Flight Time',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Several repetitive inspection ADs specify compliance intervals in flight hours or cycles, yet the CAMO scheduler tracks them by calendar date as a simplification. For high-utilisation aircraft, the calendar-date tracking consistently underestimates the true flight-hour-based compliance interval, causing unnecessary early maintenance actions and inflating compliance costs. For lower-utilisation aircraft, the same calendar tracking can produce an over-fly of the hour-based interval, which is an airworthiness violation.',
    keywords: ['repetitive inspection', 'AD compliance', 'flight hours', 'calendar tracking', 'CAMO'],
  },
  {
    code: 'A1220',
    name: 'Mandatory SB Upgrades Not Linked To Open AD Actions',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'When an AD mandates accomplishment of a specific SB as the approved means of compliance, AMOS tracks the AD action and the SB accomplishment as separate, unlinked records. Engineers querying one record do not automatically see the status of the linked record. In two instances, an SB was marked complete in the maintenance system before the associated AD compliance sign-off was formally recorded, leaving the AD technically open in the compliance register and triggering a false regulatory overrun alert.',
    keywords: ['mandatory SB', 'AD compliance', 'AMOS linkage', 'means of compliance', 'records'],
  },
  {
    code: 'A1221',
    name: 'Alternative Means Of Compliance (AMOC) Approvals Not Tracked',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'SkyHarbor has obtained FAA-approved Alternative Means Of Compliance (AMOC) for seven ADs, allowing a different inspection method or interval than the original AD text. These AMOC approvals are stored as email attachments in individual engineers\' inboxes rather than in a shared compliance record. When an engineer leaves or is unavailable, the AMOC cannot be located, and the standard AD compliance action is performed instead — at higher cost and with unnecessary aircraft downtime — because no one knows the AMOC exists.',
    keywords: ['AMOC', 'alternative means of compliance', 'AD', 'FAA approval', 'records management'],
  },
  {
    code: 'A1222',
    name: 'AD Compliance Sign-Off Authority Matrix Not Current',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'AMOS requires an authorised individual to sign off AD compliance actions; the system holds a list of approved signatories. This list is updated when new certifying staff are approved but is rarely purged when individuals leave the organisation or when their authorisation scope changes. Post-audit review found 12 former employees still listed as active AD sign-off authorities, and three current employees with scope limitations that were not reflected in the AMOS signatory profile.',
    keywords: ['AD sign-off', 'certifying staff', 'AMOS', 'authority matrix', 'authorised signatories'],
  },
  {
    code: 'A1223',
    name: 'Compliance Register Not Cross-Referenced To Lease Agreements',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'Aircraft lease agreements specify which open ADs are the lessor\'s responsibility to fund and which fall to the operator. SkyHarbor\'s AD compliance register in AMOS does not flag the lease-funding classification for each AD action, so the maintenance finance team must manually cross-reference the compliance register against 14 different lease agreements at the time of invoice, introducing errors and delays in cost recovery from lessors.',
    keywords: ['AD compliance', 'lease agreement', 'cost recovery', 'AMOS', 'lessor responsibility'],
  },
  {
    code: 'A1224',
    name: 'Orphaned ADs From Retired Aircraft Contaminating Active Register',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'When aircraft are retired or returned to lessors, their AD compliance records remain active in AMOS rather than being archived or inactivated. Schedulers running compliance overdue reports must manually filter out retired aircraft, and errors in this filtering have caused false-positive compliance overruns to be reported to the SVP of Technical Operations, consuming executive time in investigating phantom issues.',
    keywords: ['AD register', 'retired aircraft', 'AMOS', 'compliance reporting', 'data hygiene'],
  },
  {
    code: 'A1225',
    name: 'SB Fleet Campaign Tracking Relies On Spreadsheets',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'When SkyHarbor runs a fleet campaign to accomplish an optional but strategically important SB across all applicable aircraft (e.g., a fuel-efficiency modification), the campaign status is tracked in a shared Excel workbook rather than AMOS. This creates a parallel tracking system that diverges from the AMOS maintenance record over time, particularly when aircraft are swapped in and out of maintenance slots. Campaign completion rates reported to management are based on the spreadsheet and are not validated against AMOS actuals.',
    keywords: ['SB fleet campaign', 'service bulletin', 'AMOS', 'campaign tracking', 'spreadsheet'],
  },
  {
    code: 'A1226',
    name: 'Component-Level AD Compliance Not Linked To Aircraft Installation',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Several ADs apply to specific components (e.g., actuators, valves) rather than to the aircraft as a whole. In AMOS, these component-level AD records are maintained in the component module but are not automatically linked to the aircraft installation record. When a component is moved from one aircraft to another, the AD compliance history moves with the component module but the aircraft-level compliance summary does not update, meaning the receiving aircraft\' airworthiness record appears to have an open AD that is actually already complied with.',
    keywords: ['component AD', 'installation record', 'AMOS', 'aircraft airworthiness', 'compliance transfer'],
  },
  {
    code: 'A1227',
    name: 'Non-Mandatory AD Watch List Not Maintained',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'The FAA issues notices of proposed rulemaking (NPRMs) and interim final rules that may become mandatory ADs. Tracking these early allows airlines to plan maintenance proactively and influence the final rule. SkyHarbor has no formal NPRM watch list; engineers become aware of proposed ADs only when they are published as final rules, eliminating the planning window and consistently resulting in late-notice maintenance deferrals or AOG events at compliance effective dates.',
    keywords: ['NPRM', 'AD watch list', 'FAA rulemaking', 'proactive maintenance', 'CAMO'],
  },
  {
    code: 'A1228',
    name: 'Compliance Escapes Not Formally Investigated',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'On three occasions in the past two years, SkyHarbor operated aircraft beyond an AD compliance due date before the overrun was detected. In each case, an internal review was conducted verbally, and the corrective action was entered as a note in AMOS. No formal safety occurrence investigation was opened, no root-cause analysis was documented, and no systemic corrective actions were recorded in the SMS Pro safety management system. The FAA\'s investigation of one of these overruns found no evidence of a corrective-action follow-up and issued a finding.',
    keywords: ['compliance escape', 'AD overrun', 'SMS Pro', 'safety occurrence', 'corrective action'],
  },
  {
    code: 'A1229',
    name: 'AD Compliance Reporting To Board Not Risk-Stratified',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'Monthly airworthiness compliance reports submitted to the SkyHarbor Board Safety Committee list all open AD actions by due date without risk stratification. Critical structural ADs with near-term due dates appear alongside minor avionics ADs with six-month margins in the same undifferentiated list, making it impossible for board members to identify high-priority items. Two near-term structural AD overruns were not escalated to the board because they were buried in a 47-item list reviewed only by technical staff.',
    keywords: ['AD compliance reporting', 'board safety committee', 'risk stratification', 'CAMO', 'governance'],
  },

  // ── 3. AOG recovery failures ──────────────────────────────────────────────
  {
    code: 'A1230',
    name: 'AOG Spare Not Located Due To System ID Mismatch',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'When an aircraft goes AOG at an outstation, the duty technical manager queries AMOS for a serviceable spare using the part number from the aircraft maintenance manual. AMOS lists zero serviceable units. The physical storeroom at the main base holds two serviceable units under a different part number — a superseded predecessor that is fully interchangeable per the OEM parts catalogue, but the interchangeability is not recorded in AMOS. The AOG persists for six additional hours while a spare is sourced from an outside vendor at 300% premium cost, before a senior engineer identifies the interchangeable unit during a phone call.',
    keywords: ['AOG', 'spare parts', 'part number interchangeability', 'AMOS', 'unscheduled removal'],
  },
  {
    code: 'A1231',
    name: 'AOG Inventory Visibility Limited To Home Base',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'AMOS inventory queries show stock levels at the main maintenance base but not at outstations, partner warehouses, or bonded stores held by MRO vendors. When an aircraft goes AOG away from the main base, the duty manager has no system-visible inventory at nearby locations and must make phone calls to three or four parties to establish what is physically available. Average additional delay attributable to this visibility gap is 3.2 hours per AOG event.',
    keywords: ['AOG', 'inventory visibility', 'outstation', 'AMOS', 'spare parts logistics'],
  },
  {
    code: 'A1232',
    name: 'AOG Desk Escalation Threshold Not Defined In Any System',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'SkyHarbor has no documented or system-enforced escalation matrix for AOG events. When an aircraft goes AOG, the response effort and escalation timing depend entirely on the seniority and initiative of the duty technical manager. Audits have found that AOG recovery times at night or on weekends are on average 2.1 hours longer than weekday daytime events because the informal escalation network functions less reliably outside business hours.',
    keywords: ['AOG', 'escalation matrix', 'duty manager', 'recovery time', 'technical operations'],
  },
  {
    code: 'A1233',
    name: 'AOG Tooling At Outstation Not Tracked In Any System',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Specialised tooling required for certain AOG repairs — hydraulic test rigs, avionics test equipment, aircraft-specific access platforms — is not tracked by location in AMOS or any connected system. When a repair requiring specialised tooling is needed at an outstation, the duty manager may spend 90+ minutes calling around to locate the tool before it is confirmed unavailable and a ferry flight or vendor dispatch must be arranged.',
    keywords: ['AOG tooling', 'outstation', 'tool tracking', 'AMOS', 'Melog tooling'],
  },
  {
    code: 'A1234',
    name: 'AOG Insurance Recovery Not Captured In Maintenance System',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'SkyHarbor\'s fleet hull and operational insurance policies include AOG expense coverage for unscheduled removals caused by specified failure events. The triggering criteria for insurance claims are not visible to the technical operations team, and no prompt in AMOS or any related system alerts the duty manager that an AOG event may qualify for insurance recovery. Post-event review estimates that 40% of claimable AOG expenses are never submitted, representing $1.4M in uncaptured annual recoveries.',
    keywords: ['AOG', 'insurance recovery', 'hull insurance', 'AMOS', 'cost recovery'],
  },
  {
    code: 'A1235',
    name: 'Lease Return Component Pool Not Flagged For AOG Priority',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Aircraft approaching lease return have components removed and replaced with like-for-like spares to meet return conditions. These removed components are placed in a lease-return pool in the warehouse, but are not flagged as available for AOG use in AMOS. When an AOG occurs requiring a component type present in the lease-return pool, the pool is invisible to the AMOS inventory query and the component is sourced externally at spot-market pricing.',
    keywords: ['lease return', 'AOG', 'component pool', 'AMOS inventory', 'spare parts'],
  },
  {
    code: 'A1236',
    name: 'Vendor AOG Response SLA Not Monitored In Real Time',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'SkyHarbor\'s agreements with component suppliers and MRO vendors include contractual AOG response commitments (e.g., 2-hour parts dispatch, 4-hour technical support). These SLAs are reviewed only in quarterly supplier performance meetings using aggregated data. No real-time SLA breach alert exists in AMOS or the vendor management system, meaning a vendor who misses a 2-hour AOG dispatch commitment is not identified until the quarterly review — long after the operational impact has been absorbed.',
    keywords: ['AOG SLA', 'vendor performance', 'response time', 'AMOS', 'supplier management'],
  },
  {
    code: 'A1237',
    name: 'AOG Root Cause Not Feeding Reliability Programme',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'After an AOG is resolved, the maintenance action is closed in AMOS and the unscheduled removal is recorded, but the fault diagnosis and root cause are not formally categorised in a reliability-programme-compatible format. SkyHarbor\'s reliability programme analyses unscheduled removal rates but cannot distinguish between systemic failure modes and one-off events because the root-cause field in AMOS is a free-text entry that is inconsistently populated.',
    keywords: ['AOG', 'root cause', 'reliability programme', 'unscheduled removal', 'AMOS'],
  },
  {
    code: 'A1238',
    name: 'AOG Cannibalisation Not Tracked As Deferred Maintenance',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'To resolve an AOG quickly, technicians occasionally remove a serviceable component from a parked aircraft and install it on the AOG aircraft — a practice known as cannibalisation. This is permitted under the MEL/CDL framework but requires that the donor aircraft defect be formally deferred. In practice, the deferral is entered into the aircraft technical log but not consistently linked to an open deferred defect (DD) in AMOS, creating a risk that the donor aircraft flies with an undocumented deficiency.',
    keywords: ['cannibalisation', 'AOG', 'deferred defect', 'MEL', 'AMOS'],
  },
  {
    code: 'A1239',
    name: 'AOG Ground Time Not Reconciled To Crew/Revenue Impact',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'AOG ground time is recorded in AMOS as the interval between the aircraft being placed out-of-service and its return to service, but this figure is not automatically fed to the revenue management or crew scheduling systems. Finance reconstructs the revenue impact of each AOG manually from dispatch records, a process that takes 3–5 days per event. The delay means AOG cost attribution to the responsible maintenance system or component is rarely completed before the next quarter\'s budget review.',
    keywords: ['AOG ground time', 'revenue impact', 'AMOS', 'finance', 'operations integration'],
  },
  {
    code: 'A1240',
    name: 'AOG Parts Dispatch Process Lacks Digital Chain Of Custody',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'When parts are dispatched to an outstation for an AOG repair, the parts leave the main base warehouse on a manifest that is faxed or emailed to the receiving station. The receiving confirmation — confirming the part arrived, was inspected, and was accepted for installation — is not entered back into AMOS in real time. Parts occasionally transit through intermediary handlers without updating the custody chain, and in one case a part was confirmed installed in AMOS before it physically arrived at the outstation.',
    keywords: ['AOG dispatch', 'chain of custody', 'parts logistics', 'AMOS', 'outstation'],
  },
  {
    code: 'A1241',
    name: 'No Digital AOG Communications Log',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'During an AOG event, communications between the duty manager, outstations, vendors, and operations control flow across phone, SMS, WhatsApp, and email with no systematic logging. Post-event reconstructions for insurance claims, regulatory investigations, or lease return documentation are incomplete because the communications are fragmented across personal devices and informal channels. The absence of a structured AOG log also makes it impossible to audit decision timing and response adherence.',
    keywords: ['AOG communications', 'event log', 'duty manager', 'documentation', 'audit trail'],
  },
  {
    code: 'A1242',
    name: 'AOG Frequency Per Tail Not Visible To Fleet Planning',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'AMOS captures AOG events at the event level but does not produce a per-tail AOG frequency report that fleet planning or the CAMO team can consume. Aircraft with above-average AOG rates — indicators of accelerated degradation, systemic component failure modes, or incomplete maintenance — are not identified until a senior engineer manually pulls a year\'s worth of unscheduled removal records and sorts them by tail number, a task performed informally once a year at most.',
    keywords: ['AOG frequency', 'fleet planning', 'AMOS reporting', 'tail analysis', 'reliability'],
  },
  {
    code: 'A1243',
    name: 'Charter Of AOG Authority Between CAMO And Line Maint Not Clear',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'The respective authority of the CAMO organisation and the line maintenance function during an AOG event — specifically, who authorises a deferred defect deferral versus an immediate repair and who approves return-to-service after an unscheduled component replacement — is not documented in the maintenance organisation exposition (MOE). Disputes over authority during overnight AOG events have caused an average 45-minute delay while managers consult informally by phone.',
    keywords: ['CAMO', 'line maintenance', 'authority', 'AOG', 'MOE'],
  },
  {
    code: 'A1244',
    name: 'AOG Spares Forecast Driven By Past Events, Not Predictive Models',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'SkyHarbor\'s AOG spare-parts inventory is sized using a rolling 12-month unscheduled removal average with a fixed safety-stock multiplier. No predictive failure model — based on component age, flight-cycle accumulation, operating environment, or manufacturer reliability data — is used to adjust stock levels dynamically. When the fleet mix changes (new aircraft type introduction or retirement of an older type), the safety-stock model fails to adjust quickly, causing either overstocked obsolete parts or understocked parts for the new type.',
    keywords: ['AOG spares', 'inventory forecast', 'predictive maintenance', 'safety stock', 'reliability'],
  },

  // ── 4. Heavy maintenance (C/D check) scope creep and cost governance ──────
  {
    code: 'A1245',
    name: 'C-Check Scope Creep From Late Engineering Orders',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'SkyHarbor\'s C-checks at third-party AMOs routinely exceed planned man-hours by 18–25% because engineering orders (EOs) for additional tasks — zone inspections, corrosion repairs, SB accomplishments — are issued by the CAMO team after the aircraft has entered the hangar. The AMO\'s man-hour planning is locked at contract signature, and late EOs attract labour premium rates. The practice of late EO issuance stems from CAMO engineers identifying compliance opportunities during induction, but there is no hard gate requiring EO packages to be finalised before induction day.',
    keywords: ['C-check', 'scope creep', 'engineering order', 'AMO', 'man-hours'],
  },
  {
    code: 'A1246',
    name: 'D-Check Cost Variance Not Attributed To Root Cause',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'D-check actual costs exceed contract baseline by an average of 31% across SkyHarbor\'s last four D-checks. Post-check cost variance reports show the total overage but do not break it down by: AMO labour rate overruns, additional material consumption, EO scope additions, corrosion finding remediation, or contract penalty clauses triggered by turn-around time (TAT) extensions. Without root-cause attribution, the procurement team cannot renegotiate contract terms intelligently, and planning for the next D-check uses the same baseline budget that has been exceeded repeatedly.',
    keywords: ['D-check', 'cost variance', 'TAT', 'AMO', 'root cause analysis'],
  },
  {
    code: 'A1247',
    name: 'Heavy Maintenance Input Package Incomplete At Induction',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The maintenance input package delivered to the AMO at aircraft induction — including task cards, parts kits, tooling lists, and engineering documentation — is incomplete for an average of 23% of planned tasks at the time of induction. AMO teams cannot begin those tasks, creating idle man-hours in the first two days of the check while SkyHarbor\'s CAMO team assembles missing documentation. The delays compound when parts kits that should have been pre-positioned at the AMO have not arrived, adding 12–18 hours to the average check TAT.',
    keywords: ['heavy maintenance', 'input package', 'induction', 'AMO', 'C-check'],
  },
  {
    code: 'A1248',
    name: 'Structural Finding Work Orders Not Priced Against Reserve',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'During heavy maintenance, structural findings (corrosion, cracking, disbonding) that fall outside the planned task scope are quoted by the AMO as additional work orders (AWOs). SkyHarbor\'s maintenance reserves — funds set aside per flight hour for heavy maintenance — should absorb these AWOs, but the reserve balance is not visible to the CAMO engineer authorising AWOs, who approves additional work without knowing whether the approval will exhaust the reserve. Finance learns of reserve overruns only at quarter-end invoicing.',
    keywords: ['structural finding', 'AWO', 'maintenance reserve', 'heavy maintenance', 'cost control'],
  },
  {
    code: 'A1249',
    name: 'AMO Labour Rate Escalation Not Modelled In D-Check Budget',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'D-check contracts with third-party AMOs include labour rate escalation clauses tied to local CPI or aviation industry wage indices, but these escalators are not modelled in SkyHarbor\'s multi-year heavy maintenance budget. The D-check event scheduled three years from now is budgeted at today\'s labour rate, consistently understating the actual cost at time of execution and producing budget overruns that finance attributes to scope growth rather than contractual escalation.',
    keywords: ['D-check', 'labour rate escalation', 'budget', 'AMO contract', 'cost modelling'],
  },
  {
    code: 'A1250',
    name: 'Non-Routine Task Cards Issued Without Standard Time Estimates',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'When structural or system findings during a C-check require repair tasks for which no standard task card exists, the CAMO engineering team issues a one-off engineering work order. These EWOs do not include a standard time estimate because the CAMO team lacks a man-hour estimation function. The AMO estimates the time, which SkyHarbor accepts without independent validation, creating a systematic incentive for the AMO to overestimate non-routine task times and accumulate margin against the check TAT.',
    keywords: ['non-routine task', 'EWO', 'man-hour estimate', 'C-check', 'AMO'],
  },
  {
    code: 'A1251',
    name: 'Check TAT Overruns Not Triggering Contractual Penalties',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'SkyHarbor\'s heavy maintenance contracts include TAT penalty clauses that entitle SkyHarbor to daily credits for each day beyond the agreed return date. These clauses have been invoked on zero occasions despite TAT overruns on 60% of checks in the past three years. The non-enforcement is attributed to account manager relationships and fear of losing preferred pricing on future checks, but the unexploited penalties represent approximately $2.8M in unclaimed credits over the review period.',
    keywords: ['TAT', 'penalty clause', 'heavy maintenance contract', 'AMO', 'cost recovery'],
  },
  {
    code: 'A1252',
    name: 'Fleet Ageing Programme Findings Not Feeding Heavy Check Input',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'SkyHarbor\'s fleet ageing programme identifies structural zones with elevated corrosion risk based on aircraft age, previous findings history, and environmental exposure. These risk rankings are produced in a standalone spreadsheet but are not integrated into the C-check or D-check planning process. Areas identified as elevated-risk are not given priority inspection or pre-positioned repair materials, resulting in discovery of significant corrosion findings mid-check that could have been addressed with advance preparation.',
    keywords: ['fleet ageing', 'corrosion', 'C-check', 'D-check', 'structural programme'],
  },
  {
    code: 'A1253',
    name: 'Heavy Maintenance Vendor Selection Optimises Price, Not TAT',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'The procurement process for awarding C-check and D-check contracts to AMOs weights labour rate as the primary evaluation criterion, with TAT performance and quality metrics as secondary factors. The selected AMOs consistently offer the lowest labour rate but have the highest historical TAT overruns, and the revenue loss from extended aircraft ground time routinely exceeds the labour rate savings. Total cost of ownership analysis — incorporating ground time, hotel costs, ferry flights, and AOG risk during check — is not performed in vendor selection.',
    keywords: ['AMO selection', 'heavy maintenance', 'TAT', 'total cost of ownership', 'vendor procurement'],
  },
  {
    code: 'A1254',
    name: 'C-Check Parts Kitting Accuracy Below 80%',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Pre-kitted parts packages assembled by the SkyHarbor supply chain team for C-check dispatch to the AMO achieve an average 76% accuracy rate against the planned task card BOM, measured as parts present and correct at induction. Missing or incorrect parts require spot-buys at premium prices from AMO local suppliers or cause task deferral. The kitting accuracy shortfall is traceable to the same part-number inconsistency problem that affects the component master, as well as to BOM data in AMOS that has not been updated to reflect the latest OEM illustrated parts catalogue revisions.',
    keywords: ['parts kitting', 'BOM', 'C-check', 'AMOS', 'supply chain'],
  },
  {
    code: 'A1255',
    name: 'Post-Check Quality Review Not Closing Squawks Before Redelivery',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'At the end of a heavy maintenance check, a SkyHarbor CAMO representative conducts a redelivery inspection and produces a squawk list of items requiring rectification before the aircraft is accepted back. Historically, 15–20% of squawks are carried over as open items at redelivery, accepted under a rectification-within-30-days agreement. These open items frequently remain unresolved beyond 30 days because no system generates a reminder and no person owns the follow-up, resulting in check items effectively never being closed.',
    keywords: ['post-check', 'squawk list', 'redelivery inspection', 'heavy maintenance', 'CAMO'],
  },

  // ── 5. CAMO: continuing airworthiness management programme documentation gaps
  {
    code: 'A1256',
    name: 'CAMO MOE Not Reflecting Current Organisational Structure',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'SkyHarbor\'s Maintenance Organisation Exposition (MOE) — the regulatory document describing how the CAMO function is organised and how airworthiness management tasks are controlled — has not been formally revised for 26 months. During that time, three reorganisations have changed reporting lines, role titles, and the outsourcing scope of maintenance activities. The FAA\'s most recent CAMO audit found 11 discrepancies between the MOE and the actual organisational arrangements, each constituting a regulatory finding requiring corrective action.',
    keywords: ['CAMO', 'MOE', 'maintenance organisation exposition', 'FAA audit', 'regulatory finding'],
  },
  {
    code: 'A1257',
    name: 'CAMO Approved Maintenance Programme Not Scheduled For Review',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'The Approved Maintenance Programme (AMP) — the document specifying task intervals and inspection requirements for each aircraft type — is submitted to the FAA and then filed without a scheduled review cycle. OEM maintenance planning document (MPD) revisions, operator modifications, and reliability data routinely make sections of the AMP out of date within 12–18 months. A comparison of the current AMP to the latest MPD revision found 84 task cards whose intervals had been updated by the OEM but not incorporated into the AMP.',
    keywords: ['AMP', 'approved maintenance programme', 'CAMO', 'MPD', 'task card intervals'],
  },
  {
    code: 'A1258',
    name: 'Reliability Programme Output Not Reviewed At Scheduled Intervals',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'The CAMO\'s reliability programme is required by the AMP to be reviewed quarterly, with findings used to justify maintenance programme escalations or de-escalations to the FAA. In the past 18 months, only one quarterly review has been formally convened and documented. The other three quarters were covered by informal email summaries that do not meet the documentation standard required for FAA submission. This puts SkyHarbor at risk of losing the MPD flexibility provisions that allow extended inspection intervals.',
    keywords: ['reliability programme', 'CAMO', 'AMP', 'FAA', 'task escalation'],
  },
  {
    code: 'A1259',
    name: 'CAMO-AMO Contract Review Overdue By 18 Months',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Each AMO performing maintenance on SkyHarbor aircraft must be covered by a formal maintenance service agreement (MSA) that defines the scope of work, quality standards, and monitoring obligations of the CAMO. Three of SkyHarbor\'s five AMO contracts are overdue for their scheduled 24-month review, with the most overdue contract now 42 months old. The contracts contain scope of work descriptions that no longer reflect the current maintenance activities performed, an AMO oversight deficiency that the FAA CAMO audit has flagged as a priority finding.',
    keywords: ['CAMO', 'AMO contract', 'MSA', 'maintenance service agreement', 'FAA oversight'],
  },
  {
    code: 'A1260',
    name: 'Continuing Airworthiness Records Access Not Restricted By Role',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'CORRIDOR, the technical records system, allows any CAMO user to edit historical maintenance records without an audit trail capturing the pre-edit value. Regulators require that maintenance records corrections follow a specific amendment process — striking through the incorrect entry, adding the correct entry alongside, and signing with the correcting individual\'s identity and date. Digital edits in CORRIDOR that overwrite existing records comply with none of these requirements and cannot be distinguished from original entries in an audit.',
    keywords: ['CAMO', 'CORRIDOR', 'technical records', 'records amendment', 'FAA audit trail'],
  },
  {
    code: 'A1261',
    name: 'Post-Maintenance Test Flight Records Not In CAMO System',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'After certain heavy maintenance checks, aircraft require a post-maintenance test flight before return to passenger service. The test flight records — test card, flight test engineer sign-off, defect list — are completed on paper and retained by the flight test department, not the CAMO organisation. When the CAMO prepares the certificate of airworthiness renewal, the test flight evidence must be obtained from a separate team, and in two instances the required test flight sign-off could not be located in time for the C of A renewal, delaying aircraft redelivery.',
    keywords: ['post-maintenance test flight', 'CAMO', 'certificate of airworthiness', 'records', 'C-check'],
  },
  {
    code: 'A1262',
    name: 'CAMO Staffing Below Regulatory Minimum During Peak Season',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'SkyHarbor\'s CAMO organisation has FAA-approved minimum staffing requirements documented in the MOE. During peak summer scheduling, two of the three required CAMO engineers are simultaneously on leave, dropping the qualified headcount below the MOE minimum. This has occurred for three consecutive summers. The situation is managed by temporary re-assignment of engineers whose primary roles are in base maintenance, but these individuals\' CAMO authorisations have not been formally confirmed with the FAA, creating an undocumented regulatory exposure.',
    keywords: ['CAMO', 'staffing', 'MOE', 'FAA', 'authorisation'],
  },
  {
    code: 'A1263',
    name: 'Aircraft Configuration Deviation Reporting Not Systematic',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'When an aircraft is returned to SkyHarbor from an AMO with a configuration that deviates from the approved type design (e.g., an unapproved modification, a non-approved part substitution, or a repair that exceeds the structural repair manual scope), the CAMO should receive a formal deviation notice and hold the aircraft until it is corrected or a concession is approved. In practice, configuration deviations are discovered by line technicians during normal maintenance and are raised informally, not through a formal CAMO deviation-reporting channel, meaning the CAMO has no systematic visibility into deviation frequency or severity.',
    keywords: ['configuration deviation', 'CAMO', 'type design', 'AMO', 'airworthiness'],
  },
  {
    code: 'A1264',
    name: 'Long-Term Stored Aircraft Airworthiness Recovery Plan Missing',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'SkyHarbor has three aircraft in long-term storage, parked for more than 12 months. Storage airworthiness — including corrosion prevention, systems preservation, and periodic return-to-service inspections — is the subject of a preservation programme, but the programme documentation is three aircraft-specific paper files held by one engineer. There is no digital tracking of preservation task due dates in AMOS or CORRIDOR, and two preservation tasks were found overdue during an unplanned records review.',
    keywords: ['stored aircraft', 'long-term storage', 'airworthiness', 'preservation programme', 'CAMO'],
  },
  {
    code: 'A1265',
    name: 'Modification State Master Record Not Maintained By CAMO',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Each SkyHarbor aircraft has a specific configuration resulting from the cumulative set of modifications, STCs, and major repairs approved for that tail number. The CAMO should maintain a modification state document (MSD) that lists every approved change for each aircraft, enabling accurate applicability assessments for new SBs, ADs, and modifications. The MSD for eight of SkyHarbor\'s 24 aircraft is incomplete, with modifications listed that have not actually been incorporated and modifications incorporated that are not listed, undermining every downstream applicability assessment.',
    keywords: ['modification state', 'MSD', 'CAMO', 'STC', 'configuration management'],
  },
  {
    code: 'A1266',
    name: 'Permit To Fly Process Not Documented In MOE',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'When an aircraft needs to fly in a condition not covered by the standard type certificate — typically for a ferry flight to a maintenance base — a permit to fly (PtF) or special flight permit is required. SkyHarbor has issued four PtFs in the past two years, each handled ad hoc by the CAMO director. The process is not documented in the MOE, meaning the conditions under which a PtF may be issued, who has authority to approve it, and what engineering justification is required are nowhere formally stated, creating a governance gap that a regulator has noted.',
    keywords: ['permit to fly', 'PtF', 'special flight permit', 'CAMO', 'MOE'],
  },
  {
    code: 'A1267',
    name: 'CAMO Audit Finding Closure Rate Below 60%',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      'Internal quality audits of the CAMO function generate corrective action requests (CARs) that are tracked in a quality management spreadsheet. Sixty-day CAR closure rate for the past 12 months is 54%, with 19 open CARs more than 90 days overdue. The regulator\'s surveillance audit has identified the backlog as a systemic quality management failure; two of the overdue CARs are repeat findings from the previous surveillance cycle, indicating that root-cause analysis was not performed before the original CAR was closed.',
    keywords: ['CAMO', 'corrective action', 'CAR', 'quality audit', 'closure rate'],
  },
  {
    code: 'A1268',
    name: 'CAMO Human Factors Training Records Incomplete',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'FAA Part 119 and Part 145 requirements mandate human factors awareness training for all personnel with maintenance responsibility. CAMO engineers who perform continuing airworthiness management functions fall within this requirement, but SkyHarbor\'s training records system shows that six of ten CAMO engineers have not completed the required training in the past 24 months. The training records system and the CAMO HR system are not integrated, meaning the CAMO director has no automated visibility into training currency.',
    keywords: ['CAMO', 'human factors training', 'FAA Part 119', 'training records', 'compliance'],
  },
  {
    code: 'A1269',
    name: 'CAMO Cost Centre Budget Not Aligned To Aircraft Count',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'SkyHarbor\'s CAMO budget is set as a fixed annual allocation rather than being scaled to fleet size. When three aircraft were added to the fleet in year two of the budget cycle, no budget adjustment was made to the CAMO cost centre. The CAMO team absorbed the additional workload by reducing review frequency and documentation depth, a trade-off that contributed directly to the AMP review arrears and MOE update delays described in adjacent patterns.',
    keywords: ['CAMO', 'budget', 'fleet size', 'resource allocation', 'airworthiness management'],
  },

  // ── 6. Line maintenance man-hour planning and hangar capacity allocation ───
  {
    code: 'A1270',
    name: 'Line Maintenance Roster Not Linked To Flight Schedule Demand',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'SkyHarbor\'s line maintenance staffing roster is built two weeks ahead by shift supervisors using experience and gut feel, without referencing the flight schedule demand profile in the operations system. During peak departure banks when 12 aircraft turn within a 90-minute window, the line station is frequently understaffed for the required simultaneous transit checks, causing first-flight delays. When the schedule adds a new early-morning bank, the roster does not adjust for several weeks because the roster system and the flight scheduling system are not integrated.',
    keywords: ['line maintenance', 'roster', 'flight schedule', 'staffing', 'transit check'],
  },
  {
    code: 'A1271',
    name: 'Hangar Bay Allocation Uses Whiteboard, Not AMOS',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'SkyHarbor\'s main maintenance base has four hangar bays, each suited to different aircraft types and maintenance check depths. Allocation of bays to incoming aircraft is managed via a physical whiteboard in the maintenance planning office. Conflicts — two checks scheduled simultaneously for the single wide-body bay — are discovered only when both aircraft arrive for induction, requiring an emergency rescheduling of one check to a third-party AMO at a premium. The whiteboard is not accessible to the operations control centre or to lease managers planning aircraft availability.',
    keywords: ['hangar capacity', 'bay allocation', 'maintenance planning', 'AMOS', 'scheduling'],
  },
  {
    code: 'A1272',
    name: 'Transit Check Time Estimates Not Updated After Aircraft Type Change',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Standard transit check man-hour estimates used for line maintenance planning were developed for the B737 Classic and have not been revised since SkyHarbor introduced the B737 MAX and A320neo family. The newer aircraft types have different servicing interfaces, and some tasks that required 8 minutes on the Classic take 14 minutes on the MAX. Using the classic estimates causes systematic understaffing at gates handling new-type aircraft and contributes to a 12-minute average delay premium for MAX departures versus Classic departures.',
    keywords: ['transit check', 'man-hour estimate', 'aircraft type', 'line maintenance', 'B737 MAX'],
  },
  {
    code: 'A1273',
    name: 'Deferred Defect Volume Not Factored Into Line Maintenance Capacity',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Line maintenance shift planning allocates capacity for transit checks and A-check tasks but does not model the variable demand created by the open deferred defect (DD) backlog. When the DD backlog grows — as it does during summer high utilisation — line technicians are pulled from planned tasks to rectify deferred defects that have reached their MEL deferral limit, creating unplanned demand spikes that cascade into transit check overruns and first-flight delays.',
    keywords: ['deferred defect', 'MEL', 'line maintenance', 'capacity planning', 'DD backlog'],
  },
  {
    code: 'A1274',
    name: 'Ground Time Budget Per Turn Not Tracked Against Actual',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'SkyHarbor\'s commercial planning team allocates ground time per turn based on schedule buffers, but no real-time system compares the actual ground time used for maintenance activities against the budgeted maintenance window. When maintenance overruns cause departure delays, the maintenance system records the completed maintenance, and the operations system records the delay, but no system links the two to produce a maintenance-caused delay attribution. This prevents any data-driven dialogue between commercial planning and technical operations about ground time adequacy.',
    keywords: ['ground time', 'turn time', 'departure delay', 'maintenance', 'operations'],
  },
  {
    code: 'A1275',
    name: 'Line Station Tooling Inventory Below Minimum Equipment List',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Each SkyHarbor line station is supposed to hold a minimum set of tools and test equipment as defined in the base maintenance tooling manual. Quarterly audits at three of six line stations found tooling below the minimum set, with critical items such as hydraulic test gauges and digital multimeters either missing or on calibration recall. Technicians at these stations are required to borrow tools from the aircraft toolkit or improvise, creating safety and audit risk.',
    keywords: ['line station', 'tooling', 'minimum equipment list', 'calibration', 'line maintenance'],
  },
  {
    code: 'A1276',
    name: 'Night-Shift Line Maintenance Completion Rate Not Measured',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'A-check tasks and routine maintenance scheduled during the night-stop window rely on the night shift completing all items before the first departure. Completion rate for night-scheduled tasks is not systematically measured; the shift supervisor signs off the job cards and the aircraft is cleared for morning departure, but no management report captures what percentage of the planned night-shift task list was completed versus deferred. Post-hoc analysis of AD compliance records suggests that approximately 14% of scheduled A-check items were deferred without a formal deferral entry.',
    keywords: ['night shift', 'A-check', 'task completion', 'line maintenance', 'deferral'],
  },
  {
    code: 'A1277',
    name: 'Line Maintenance Overtime Driven By Scheduling Gaps, Not Workload',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Line maintenance overtime expenditure is 34% above the budgeted amount, but analysis of overtime timesheets shows that a large portion is attributable to staffing pattern mismatches rather than actual workload peaks. Shifts end before the last aircraft departs, creating a window where the incoming shift is not yet on duty and the outgoing shift incurs overtime. The staffing pattern was set four years ago based on a flight schedule that has since changed substantially, but shift start/end times have not been revised.',
    keywords: ['line maintenance', 'overtime', 'staffing pattern', 'shift scheduling', 'cost control'],
  },
  {
    code: 'A1278',
    name: 'AME Licence Scope Not Validated Against Aircraft Assigned',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Aircraft maintenance engineers (AMEs) hold licences authorising sign-off on specific aircraft types and systems categories. SkyHarbor\'s rostering system assigns AMEs to shifts by station and seniority without checking that the rostered AMEs hold the type authorisations required for the aircraft scheduled at that station. On 23 occasions in the past year, the sole AME on duty at a station did not hold a type authorisation for an aircraft requiring a certifying signature, requiring a senior engineer to be called out, causing delays averaging 1.4 hours.',
    keywords: ['AME licence', 'type authorisation', 'rostering', 'line maintenance', 'certifying staff'],
  },
  {
    code: 'A1279',
    name: 'Rapid-Turnaround Check Scope Expansion Not Costed',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'When a rapid-turnaround (RTT) maintenance visit — a short overnight event at a line station — is extended to include non-routine work arising from a defect discovery, the additional man-hours are absorbed into the shift without a cost-capture mechanism. The RTT event is billed as a standard overnight, regardless of how many additional tasks were performed. As a result, RTT actual costs are systematically undercounted, the cost per flight hour metric overstates efficiency, and there is no data to evaluate whether RTT slots are being used optimally versus dedicated A-check events.',
    keywords: ['RTT', 'rapid turnaround', 'A-check', 'line maintenance', 'cost capture'],
  },
  {
    code: 'A1280',
    name: 'Line Maintenance Quality Escape Rate Not Reported To Safety Committee',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Quality escape events — maintenance tasks completed incorrectly and discovered during the next inspection cycle — are tracked in the line maintenance quality log but are not aggregated into a metric reported to the safety committee or the CAMO. The raw log shows 47 quality escapes in the past 12 months, of which 9 were categorised as safety-significant. None of the 9 safety-significant escapes triggered an SMS Pro safety occurrence report, and none were subject to formal root-cause investigation.',
    keywords: ['quality escape', 'line maintenance', 'SMS Pro', 'safety committee', 'CAMO'],
  },
  {
    code: 'A1281',
    name: 'Line Maintenance Task Card Currency Not Assured',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Line maintenance task cards used at outstations are distributed as PDFs at the start of each year and updated by email when revisions occur. There is no system-enforced mechanism to ensure that technicians are using the current revision; audits have found technicians using task cards from prior year distributions that have been superseded by SB incorporations or MPD revisions. Using an out-of-date task card for a safety-critical inspection constitutes a maintenance error even when the physical inspection was performed correctly.',
    keywords: ['task card', 'revision control', 'line maintenance', 'AMOS', 'currency'],
  },
  {
    code: 'A1282',
    name: 'Outstation Line Maintenance Coverage Not Aligned To New Routes',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'When SkyHarbor launches a new route to a destination without an existing maintenance agreement, the approved coverage for that station is arranged after the commercial launch date under time pressure. In two recent cases, the first month of operations at a new outstation was conducted with a verbal-only maintenance agreement with a local handler whose Part 145 approval had not been verified as current, creating an unapproved maintenance situation that the CAMO later had to document retroactively.',
    keywords: ['outstation', 'line maintenance', 'Part 145', 'new routes', 'approved coverage'],
  },
  {
    code: 'A1283',
    name: 'Ground-Time Engineering Dispositions Delayed By CAMO Review Queue',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'When a technician discovers a defect that falls outside the approved maintenance manual repair limits and requires a one-off engineering disposition (EDP), the request is routed to CAMO. CAMO\'s average EDP turnaround time is 6.8 hours during business hours and 14 hours outside business hours. For line maintenance situations where the aircraft is on a three-hour ground turn, the EDP process is effectively incompatible with commercial operations, leading technicians to informally defer the defect under a catch-all MEL item rather than obtaining the required EDP.',
    keywords: ['EDP', 'engineering disposition', 'CAMO', 'MEL', 'line maintenance'],
  },
  {
    code: 'A1284',
    name: 'In-Flight Defect Relay From Crew To Maintenance Not Structured',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Pilots report in-flight technical observations through a combination of ACARS maintenance messages, voice radio, and verbal handover at the gate. These inputs are received by different individuals — operations dispatch, ground engineers, line maintenance supervisors — with no single system consolidating all reports against the relevant aircraft tail number before technicians begin the turnaround inspection. Maintenance actions taken on partial information have in three cases missed the correct fault diagnosis, requiring a second unscheduled inspection and departure delay.',
    keywords: ['in-flight defect', 'ACARS', 'crew-to-maintenance', 'PIREP', 'line maintenance'],
  },
];
