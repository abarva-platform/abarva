// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Safety Management System & Regulatory Compliance
// Code range: A2700-A2999
// Run: npx tsx src/scripts/seed/seed-airline-dom09-safety-compliance.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineSafetyPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_SAFETY_PATTERNS: AirlineSafetyPatternSeed[] = [
  {
    code: 'A2700',
    name: 'SMS Corrective Action Loop Failure',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      'A safety finding creates a CAPA in the SMS platform, but no accountable owner, due date, or verification evidence is assigned. The finding ages past 90 days and FAA ASAP audit identifies a systemic open-loop corrective-action pattern rather than an isolated missed task.',
    keywords: ['SMS', 'CAPA', 'FAA ASAP', 'corrective action', 'audit finding'],
    demoRelevant: true,
  },
  {
    code: 'A2701',
    name: 'Voluntary Safety Reports Not Linked To Operational Data',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'ASAP and safety reports are reviewed as narrative events without linking to flight, crew, aircraft, station, or maintenance context. The safety team closes individual reports but misses repeated operational precursors that only appear when reports are joined to operational data.',
    keywords: ['ASAP', 'safety report', 'operational data', 'FAA', 'precursor analysis'],
    demoRelevant: true,
  },
  {
    code: 'A2702',
    name: 'Safety Risk Assessment Performed After Design Freeze',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Digital or operational changes reach design freeze before the SMS team performs a formal safety risk assessment. Mitigations become late-stage exceptions, and teams either accept unmanaged risk or delay the release after business commitments have already been made.',
    keywords: ['safety risk assessment', 'SMS', 'change management', 'FAA Part 121', 'mitigation'],
  },
  {
    code: 'A2703',
    name: 'Crew Fatigue Signal Buried In Schedule Metrics',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Crew fatigue reports are aggregated separately from schedule reliability, reserve usage, and pairing disruption data. Operations sees legal schedules and acceptable completion factor while safety sees rising fatigue narratives, but neither view exposes the combined risk.',
    keywords: ['crew fatigue', 'FRMS', 'pairing', 'completion factor', 'safety signal'],
  },
  {
    code: 'A2704',
    name: 'Regulatory Change Intake Missing System Ownership',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'New FAA, DOT, TSA, or EASA obligations are logged by compliance but not mapped to system owners, data fields, and operating procedures. The policy deadline appears managed while the technology and process changes needed to comply remain unfunded.',
    keywords: ['regulatory change', 'FAA', 'DOT', 'TSA', 'system ownership'],
  },
  {
    code: 'A2705',
    name: 'Audit Evidence Stored Outside Controlled Repository',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Station and corporate teams prepare audit evidence in shared drives, email, and vendor portals instead of a controlled compliance repository. During an FAA or IOSA audit, the airline cannot prove evidence freshness, approval lineage, or whether a superseded procedure was still active.',
    keywords: ['audit evidence', 'IOSA', 'FAA audit', 'document control', 'compliance repository'],
  },
  {
    code: 'A2706',
    name: 'Safety Dashboard Counts Reports Instead Of Risk Severity',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'Executive safety dashboards emphasize report volume, closure count, and aging rather than severity-weighted risk exposure. Leaders celebrate faster closure while high-severity recurring hazards remain open behind a small number of complex investigations.',
    keywords: ['safety dashboard', 'risk severity', 'SMS', 'hazard register', 'executive reporting'],
  },
  {
    code: 'A2707',
    name: 'FOQA Event Trend Not Connected To Training Intervention',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'Flight Operations Quality Assurance events are trended by aircraft type and phase of flight but not connected to pilot training updates or simulator scenarios. The airline identifies unstable-approach patterns but does not close the loop into targeted training and verification.',
    keywords: ['FOQA', 'unstable approach', 'pilot training', 'simulator', 'safety intervention'],
  },
  {
    code: 'A2708',
    name: 'MEL Deferral Risk Not Aggregated Across Fleet',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'Minimum Equipment List deferrals are managed aircraft by aircraft, but the safety and reliability impact is not aggregated across fleet type, route, and station. Dispatch stays legal while repeated deferrals create operational fragility and passenger-service risk.',
    keywords: ['MEL', 'fleet reliability', 'dispatch', 'FAA Part 121', 'deferral'],
  },
  {
    code: 'A2709',
    name: 'Safety Case Missing Human Factors Validation',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'A new operations tool passes technical acceptance but the safety case does not validate human factors under time pressure, distraction, and shift handoff. Frontline users follow the workflow in training yet revert to unsafe workarounds during real disruption.',
    keywords: ['human factors', 'safety case', 'workflow validation', 'SMS', 'frontline adoption'],
  },
  {
    code: 'A2710',
    name: 'Station Compliance Self-Attestation Not Independently Tested',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Stations self-attest completion of safety, security, and operational controls without independent sampling or evidence review. Corporate compliance sees green status while local procedures drift from the standard operating model.',
    keywords: ['station compliance', 'self-attestation', 'control testing', 'SOP', 'audit'],
  },
  {
    code: 'A2711',
    name: 'Dangerous Goods Checks Split Across Channels',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Dangerous goods declarations and screening prompts differ between web check-in, kiosk, bag drop, and agent workflows. A passenger can bypass the strongest prompt by switching channels, leaving the airline exposed to inconsistent IATA DGR compliance.',
    keywords: ['dangerous goods', 'IATA DGR', 'check-in', 'bag drop', 'channel control'],
  },
  {
    code: 'A2712',
    name: 'Security Directive Implementation Lacks Data Trace',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'TSA security directives are translated into manual station instructions without traceability to systems, training, and evidence of execution. Compliance teams can show that the memo was issued but cannot prove the directive changed behavior at every affected station.',
    keywords: ['TSA security directive', 'station execution', 'traceability', 'training', 'compliance evidence'],
  },
  {
    code: 'A2713',
    name: 'Safety Finding Duplicates Hidden By Taxonomy Drift',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'Safety teams classify similar findings under different local taxonomies across stations, fleets, and departments. Duplicate hazards appear unrelated, preventing the SMS from identifying a systemic issue until a regulator or serious incident connects the dots.',
    keywords: ['hazard taxonomy', 'SMS', 'duplicate finding', 'station safety', 'systemic risk'],
  },
  {
    code: 'A2714',
    name: 'Operational Readiness Review Excludes Compliance Owner',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'New tools, routes, or station procedures pass operational readiness review without a named compliance owner for ongoing evidence and control maintenance. The go-live is clean, but the control degrades after launch because no one owns the recurring compliance burden.',
    keywords: ['operational readiness', 'compliance owner', 'control maintenance', 'go-live', 'SMS'],
  },
  {
    code: 'A2715',
    name: 'Audit Remediation Closed On Policy Update Alone',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Audit remediation is marked complete after a procedure or policy is updated, without proving that training, system controls, and frontline behavior changed. The same issue recurs in the next audit cycle because the airline fixed the document but not the operating model.',
    keywords: ['audit remediation', 'policy update', 'training', 'control evidence', 'IOSA'],
  },
  {
    code: 'A2716',
    name: 'Safety Event Severity Downgraded Without Peer Review',
    officeCategory: 'middle_office',
    failureRatePct: 48,
    description:
      'Local managers downgrade safety event severity to avoid escalation or operational disruption, and the SMS workflow does not require independent review for downgrades. Risk exposure is understated in executive reporting and corrective actions are scaled too low.',
    keywords: ['severity downgrade', 'SMS', 'peer review', 'risk rating', 'executive reporting'],
  },
  {
    code: 'A2717',
    name: 'Regulatory Reporting Calendar Not Linked To Source Data',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Compliance calendars track submission dates but not the upstream systems, owners, and data-quality checks needed to produce each report. Teams discover missing or unreconciled data days before a filing deadline, forcing manual compilation and executive signoff risk.',
    keywords: ['regulatory reporting', 'FAA', 'DOT', 'data quality', 'submission calendar'],
  },
  {
    code: 'A2718',
    name: 'Safety AI Alert Fatigue From Untuned Thresholds',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'AI safety-monitoring alerts are launched with thresholds tuned in a lab rather than calibrated to station, fleet, and seasonal operating variance. Frontline teams receive too many false positives and begin ignoring the alerts before the high-severity cases arrive.',
    keywords: ['AI safety monitoring', 'alert fatigue', 'threshold calibration', 'fleet variance', 'SMS'],
  },
  {
    code: 'A2719',
    name: 'Contractor Training Records Not Integrated With Access Control',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Ground-handler and maintenance-contractor training records sit in vendor systems and are not integrated with airport badge or system access controls. A contractor can retain physical or application access after required recurrent training has expired.',
    keywords: ['contractor training', 'access control', 'ground handler', 'airport badge', 'recurrent training'],
  },
  {
    code: 'A2720',
    name: 'Emergency Response Drill Findings Not Operationalized',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'Emergency response exercises generate lessons learned, but findings are stored in after-action reports without owners, deadlines, or integration into station playbooks. The airline rehearses the drill but does not make the next real incident easier to manage.',
    keywords: ['emergency response', 'after-action report', 'station playbook', 'CAPA', 'crisis management'],
  },
  {
    code: 'A2721',
    name: 'Compliance Risk Register Detached From Investment Planning',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Compliance risks are documented in a register but not tied to budget, roadmap, vendor, or program decisions. Executives accept risk on paper while underfunding the systems and process changes required to reduce it.',
    keywords: ['compliance risk register', 'investment planning', 'roadmap', 'risk acceptance', 'governance'],
  },
  {
    code: 'A2722',
    name: 'Runway Incursion Lessons Not Shared Across Stations',
    officeCategory: 'middle_office',
    failureRatePct: 50,
    description:
      'A runway incursion or surface-movement event produces local corrective actions that are not translated into fleetwide or stationwide learning. Other airports with similar taxiway layouts, phraseology issues, or night-operation conditions remain exposed.',
    keywords: ['runway incursion', 'surface movement', 'FAA', 'station learning', 'taxiway'],
  },
  {
    code: 'A2723',
    name: 'EFB Content Update Lacks Acceptance Evidence',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Electronic Flight Bag manuals, charts, or procedures are pushed to crews but the airline cannot prove acceptance and effective-date awareness for every affected pilot. Compliance depends on distribution logs rather than evidence that crews saw and acknowledged the change.',
    keywords: ['EFB', 'pilot acknowledgment', 'effective date', 'manual update', 'FAA'],
  },
  {
    code: 'A2724',
    name: 'Safety Culture Survey Not Connected To Hazard Trends',
    officeCategory: 'middle_office',
    failureRatePct: 47,
    description:
      'Safety culture surveys are reported as engagement metrics but not linked to hazard reporting rates, fatigue, turnover, or station event trends. Leadership misses the connection between low psychological safety and underreported operational hazards.',
    keywords: ['safety culture', 'hazard reporting', 'psychological safety', 'SMS', 'survey'],
  },
  {
    code: 'A2725',
    name: 'Regulatory Waiver Tracking Ends At Approval',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Temporary regulatory waivers or exemptions are tracked until approval but not through expiry, operational condition, and renewal evidence. Teams keep operating under assumptions that were valid during the waiver window but invalid after it closes.',
    keywords: ['regulatory waiver', 'exemption', 'expiry tracking', 'FAA', 'compliance condition'],
  },
  {
    code: 'A2726',
    name: 'Safety Data Access Too Restricted For Prevention',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Safety data is locked down so tightly for legal and confidentiality reasons that operations analysts cannot use de-identified trends for prevention. The airline protects sensitive reports but loses the ability to detect early operational risk signals.',
    keywords: ['safety data', 'de-identification', 'ASAP', 'data access', 'prevention analytics'],
  },
  {
    code: 'A2727',
    name: 'Third-Party Safety Obligations Missing From Contract Controls',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Vendor contracts require compliance with safety obligations but do not specify evidence, audit rights, training cadence, or incident notification timelines. Procurement signs the clause, but operations cannot enforce the safety behavior when vendor performance degrades.',
    keywords: ['vendor contract', 'safety obligation', 'audit rights', 'incident notification', 'ground handler'],
  },
  {
    code: 'A2728',
    name: 'Safety Governance Meeting Lacks Decision Closure',
    officeCategory: 'middle_office',
    failureRatePct: 45,
    description:
      'Safety governance forums review dashboards and incidents but do not record decisions, rejected options, owners, and due dates in a durable ledger. The conversation is thoughtful, yet recurring hazards survive because decision closure is weaker than issue discussion.',
    keywords: ['safety governance', 'decision ledger', 'hazard review', 'owner', 'due date'],
  },
  {
    code: 'A2729',
    name: 'Compliance Automation Hard-Codes Current Regulation Text',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'Automation checks are built directly against current FAA, DOT, or TSA rule text without a versioned policy model. When the rule changes, the code keeps enforcing the old interpretation until a compliance miss reveals the outdated logic.',
    keywords: ['compliance automation', 'FAA', 'DOT', 'policy versioning', 'control logic'],
  },
  {
    code: 'A2730',
    name: 'Safety AI Alert Fatigue Disables True Positives',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Safety AI is deployed with thresholds tuned in a lab rather than calibrated to station, fleet, and seasonal variance. Frontline teams mute the alert stream after false positives, so the first true high-severity event is missed by a model that technically worked.',
    keywords: ['safety AI', 'alert fatigue', 'SMS', 'threshold calibration', 'model governance'],
    demoRelevant: true,
  },
  {
    code: 'A2731',
    name: 'FOQA AI Model Drift Without Revalidation',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      'FOQA AI trained on prior aircraft and route mixes keeps scoring flight events after fleet, procedure, or airport-profile changes. The model appears stable, but its risk ranking drifts because no revalidation gate is tied to operational change.',
    keywords: ['FOQA AI', 'model drift', 'revalidation', 'FAA', 'operational change'],
    demoRelevant: true,
  },
  {
    code: 'A2732',
    name: 'AI Safety Narrative Lacks Explainable Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Generative AI summarizes safety reports and recommends risk themes, but the narrative does not cite the underlying reports, flights, stations, or hazards. Safety leaders cannot use the summary in governance forums because it is not audit-defensible.',
    keywords: ['generative AI', 'safety report', 'explainability', 'audit evidence', 'SMS'],
    demoRelevant: true,
  },
  {
    code: 'A2733',
    name: 'Ramp Vision AI Outside Union Agreement',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Computer-vision ramp monitoring is introduced as a safety tool but also measures individual worker behavior without labor-agreement guardrails. The safety program becomes a labor dispute, and adoption stalls before hazard reduction can be measured.',
    keywords: ['computer vision', 'ramp safety', 'labor agreement', 'adoption risk', 'privacy'],
    demoRelevant: true,
  },
  {
    code: 'A2734',
    name: 'AI CAPA Recommendation Accepted Without Owner',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'AI recommends corrective actions for recurring hazards, but the SMS workflow allows the recommendation to be accepted without assigning an accountable owner and verification evidence. The AI improves diagnosis but not closure.',
    keywords: ['AI CAPA', 'SMS', 'owner assignment', 'verification evidence', 'corrective action'],
    demoRelevant: true,
  },
  {
    code: 'A2735',
    name: 'Regulatory AI Watchlist Not Mapped To Controls',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'A regulatory-monitoring AI flags new FAA, DOT, TSA, and EASA obligations but does not map them to controls, systems, owners, or deadlines. Compliance gets earlier alerts without a reliable path to execution.',
    keywords: ['regulatory AI', 'FAA', 'DOT', 'control mapping', 'compliance workflow'],
    demoRelevant: true,
  },
  {
    code: 'A2736',
    name: 'AI Risk Score Overrides Local Safety Judgment',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'A centralized AI risk score downgrades station concerns because the local condition is rare in the training data. Local safety managers lose escalation credibility even when their operational judgment reflects a valid hazard the model has not learned.',
    keywords: ['AI risk score', 'local safety', 'model bias', 'SMS', 'human override'],
    demoRelevant: true,
  },
  {
    code: 'A2737',
    name: 'Safety AI Vendor Contract Missing Incident Access Rights',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'The safety AI vendor contract provides dashboards but not raw alert lineage, model-version history, or incident reconstruction rights. Source teams cannot support FAA, legal, or internal audit review when a model-influenced decision is challenged.',
    keywords: ['safety AI', 'vendor contract', 'incident reconstruction', 'FAA audit', 'Source'],
    demoRelevant: true,
  },
];
