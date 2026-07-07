// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Healthcare Provider patterns — Emergency Department Throughput & Capacity Management
// Code range: H3600–H3899 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-healthcare-dom12-ed-throughput.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface HealthcareEDPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const HEALTHCARE_ED_PATTERNS: HealthcareEDPatternSeed[] = [

  // ── ED Boarding: Admitted Patients in ED Hallways ─────────────────────────
  {
    code: 'H3600',
    name: 'ED Boarding Crisis From Inpatient Bed Unavailability',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Admitted ED patients board in hallway beds for 6–18 hours awaiting inpatient placement because TeleTracking bed board shows zero clean available beds — Meridian Health\'s 28% boarding rate (industry target <15%) directly correlates with sepsis escalation events, medication administration delays, and nursing staff overtime. Epic ADT hold queues accumulate 12–20 patients by 14:00 daily without a bed-pull protocol that forces inpatient charge nurses to accept boarding patients within 90 minutes of bed assignment.',
    keywords: ['ED boarding', 'bed management', 'TeleTracking', 'ADT', 'hallway medicine', 'inpatient bed'],
    demoRelevant: true,
  },
  {
    code: 'H3601',
    name: 'Boarding Time Metric Excluded From ED Dashboard',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'ED operational dashboards in Epic Hyperspace display door-to-provider and length-of-stay metrics but omit boarding time as a tracked KPI — without visible boarding duration at the capacity command centre, house supervisors cannot prioritise bed-pull urgency; admitted patients board an average of 4.2 additional hours beyond the moment inpatient bed assignment occurs because the delay is invisible to the system.',
    keywords: ['ED boarding', 'capacity command centre', 'Epic', 'door-to-provider', 'ED throughput', 'KPI'],
  },
  {
    code: 'H3602',
    name: 'Bed-Pull Protocol Not Enforced After Inpatient Assignment',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      'Epic generates an inpatient bed assignment but no escalation mechanism fires when the patient is not physically transported within 60 minutes — nursing staff on the inpatient unit cite incomplete handoff communication (SBAR not received), unavailable transport staff, or room not yet cleaned as the reason for delay; each category requires a separate intervention that the bed management system does not distinguish, leaving supervisors unable to route the specific bottleneck.',
    keywords: ['bed-pull', 'SBAR', 'ED boarding', 'TeleTracking', 'patient flow', 'inpatient handoff'],
    demoRelevant: true,
  },
  {
    code: 'H3603',
    name: 'Discharge Delay Upstream Causing ED Boarding Cascade',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      'Inpatient beds remain occupied by patients pending discharge paperwork, home health authorisation, or SNF placement — TeleTracking shows beds as "pending discharge" for 3–6 hours while ED boarding queue grows; capacity command centre has no automated trigger to escalate pending-discharge cases to case management or attending hospitalist when the delay exceeds 2 hours, breaking the throughput chain.',
    keywords: ['discharge delay', 'ED boarding', 'capacity command centre', 'TeleTracking', 'case management', 'hospitalist'],
  },
  {
    code: 'H3604',
    name: 'Psychiatric Boarding Consuming Medical ED Capacity',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      'Behavioural health patients board in medical ED bays for 24–72 hours awaiting inpatient psychiatric placement — each boarded psych patient occupies a monitored bay that should turn over four medical patients per day; with 6–8 simultaneous psychiatric boarders, effective ED medical capacity is reduced by 20–25%, driving LWBS rates above 7% on high-census days. No dedicated psychiatric ED holding area or telepsychiatry triage pathway exists.',
    keywords: ['psychiatric boarding', 'ED boarding', 'LWBS', 'behavioural health', 'ED capacity', 'acuity'],
    demoRelevant: true,
  },
  {
    code: 'H3605',
    name: 'Hallway Medicine Safety Events Underreported',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Patients boarding in ED hallways experience medication administration errors, fall events, and delayed reassessments at 2.3× the rate of patients in bays — nursing staff submit incident reports for bay-based events but hallway events are frequently underdocumented because no formal hallway bed assignment exists in Epic; safety surveillance data therefore understates the harm associated with boarding, preventing leadership from treating it as a patient safety crisis.',
    keywords: ['hallway medicine', 'ED boarding', 'medication error', 'patient safety', 'Epic', 'incident reporting'],
  },
  {
    code: 'H3606',
    name: 'Boarding Metric Excluded From Hospitalist Scorecard',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'Hospitalist group performance scorecards track admissions per shift and response time but not the ED boarding hours attributable to delayed bed acceptance — without accountability metrics, hospitalists have no incentive to proactively pull patients from the ED; the root cause of 40% of boarding episodes exceeding 4 hours is delayed bed acceptance by the receiving inpatient team, yet this metric is invisible in physician performance reporting.',
    keywords: ['hospitalist', 'ED boarding', 'bed acceptance', 'physician scorecard', 'ED throughput', 'accountability'],
  },
  {
    code: 'H3607',
    name: 'Code Census Protocol Not Activated at Boarding Threshold',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      'Hospital policy defines a Code Census protocol for extreme overcrowding that triggers all-hands bed-sourcing escalation, but the activation threshold (>12 boarders for >2 hours) is defined in policy only and not automated in TeleTracking or Epic — house supervisors must manually activate the protocol and frequently delay doing so to avoid the administrative burden; the protocol is activated an average of 90 minutes after the threshold is met.',
    keywords: ['Code Census', 'ED boarding', 'TeleTracking', 'overcrowding', 'capacity command centre', 'patient flow'],
  },
  {
    code: 'H3608',
    name: 'ED Observation Admission Used to Mask Boarding Statistics',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Patients awaiting inpatient bed placement are placed in observation status to comply with ED length-of-stay metrics while physically remaining in the ED — observation designation restarts the LOS clock, making boarding appear resolved in metrics while the patient experiences identical hallway medicine conditions; regulatory quality reporting to CMS therefore understates actual boarding duration and obscures the true operational picture.',
    keywords: ['observation admission', 'ED boarding', 'length of stay', 'CMS reporting', 'ED throughput', 'hospitalist'],
  },
  {
    code: 'H3609',
    name: 'Night Shift Boarding Spike Without Supervisor Escalation',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'ED boarding peaks between 02:00–06:00 when inpatient charge nurses are least available for bed-pull coordination and house supervisor staffing is at minimum — TeleTracking alerts fire to a single on-call supervisor who cannot simultaneously coordinate bed pulls across 6 inpatient units; the absence of a night-shift capacity escalation protocol means boarding events that begin at midnight frequently persist until morning shift change.',
    keywords: ['ED boarding', 'night shift', 'TeleTracking', 'capacity command centre', 'patient flow', 'house supervisor'],
  },

  // ── Door-to-Provider Time Management Failures ─────────────────────────────
  {
    code: 'H3610',
    name: 'Door-to-Provider Time Exceeding 30-Minute Target',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'Median door-to-provider time of 47 minutes against a 30-minute target drives LWBS rates above 5% during peak hours — triage nurses assign ESI levels in T-System but the triage-to-provider handoff relies on verbal communication rather than an automated Epic Stork queue alert; providers are unaware a newly triaged patient is waiting until they finish with the current patient, creating gaps of 15–25 minutes between triage completion and provider acknowledgment.',
    keywords: ['door-to-provider', 'triage', 'ESI triage', 'LWBS', 'T-System', 'Epic'],
    demoRelevant: true,
  },
  {
    code: 'H3611',
    name: 'Triage Bottleneck from Single-Nurse Assignment',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'A single triage nurse at peak arrival periods (10:00–14:00 and 18:00–22:00) creates a triage queue of 8–14 patients — ESI scoring requires full vitals, chief complaint documentation, and order entry in T-System before the patient can be routed; average triage completion time of 9 minutes means the last patient in a 12-patient queue waits 108 minutes before even being triaged, skewing door-to-provider metrics far beyond the documented average.',
    keywords: ['triage', 'ESI triage', 'door-to-provider', 'ED throughput', 'staffing', 'T-System'],
  },
  {
    code: 'H3612',
    name: 'Split-Flow Queue Not Visible to Triage Nurse',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'Rapid medical evaluation lane is staffed but the triage nurse cannot see real-time RME provider availability in Epic — patients appropriate for split-flow (ESI 4–5) are held in the main triage queue because the nurse cannot confirm whether the RME provider is occupied; 30–40% of patients who could bypass the main triage queue are queued unnecessarily, increasing door-to-provider time for all patients.',
    keywords: ['split flow', 'rapid medical evaluation', 'triage', 'door-to-provider', 'ESI triage', 'Epic'],
  },
  {
    code: 'H3613',
    name: 'Provider Assignment Delay from Floating Coverage Model',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'ED attending physicians cover multiple zones simultaneously using a float model — when all providers are in resuscitation bays or procedure rooms, newly triaged patients wait in the main queue with no assigned provider; Epic does not surface an unassigned-patient alert to the charge nurse, and the floating model lacks a backup assignment protocol, producing door-to-provider spikes averaging 62 minutes during high-acuity surges.',
    keywords: ['door-to-provider', 'provider assignment', 'ED staffing', 'Epic', 'ED throughput', 'triage'],
  },
  {
    code: 'H3614',
    name: 'Waiting Room Acuity Reassessment Not Occurring',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Joint Commission and CMS require waiting room reassessment of patients at defined intervals (every 30–60 minutes for ESI 3) — triage nurses performing doorway reassessments do not document vital sign changes in T-System because no structured reassessment template exists; three patients per month on average deteriorate in the waiting room to a higher acuity level without a documented reassessment preceding the clinical event.',
    keywords: ['triage', 'ESI triage', 'waiting room reassessment', 'door-to-provider', 'T-System', 'patient safety'],
  },
  {
    code: 'H3615',
    name: 'Arrival Surge Prediction Not Integrated Into Staffing',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'ED analytics show predictable hourly arrival patterns by day of week but the staffing model uses fixed provider start times that do not flex to predicted surges — an 09:00 provider shift start consistently misses the 07:00–09:00 morning surge driven by PCP office redirect and post-procedure complications; door-to-provider times spike to 75 minutes during this window that predictive staffing could address with a staggered 07:30 start.',
    keywords: ['ED throughput', 'staffing', 'arrival prediction', 'door-to-provider', 'capacity management', 'analytics'],
  },
  {
    code: 'H3616',
    name: 'Rooming Delay Masking True Door-to-Provider Performance',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'Epic records door-to-provider time as door-to-first-provider-note rather than door-to-provider-presence — nurses room patients and providers enter a brief note within minutes of room assignment but the actual first face-to-face evaluation occurs 20–35 minutes later; reported door-to-provider metrics of 28 minutes mask a true patient experience of 50+ minutes from arrival to clinical assessment.',
    keywords: ['door-to-provider', 'Epic', 'ED metrics', 'triage', 'ED throughput', 'rooming'],
  },
  {
    code: 'H3617',
    name: 'Mid-Level Provider Scope Restrictions Increasing Physician Demand',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'APPs (NPs and PAs) staffed in the ED fast track lane cannot independently order CT imaging or IV medications under current credentialing policies — every order requiring physician co-sign creates a demand spike on attending physicians who are simultaneously managing high-acuity patients; physician interruptions for co-signatures average 22 per shift, increasing door-to-provider times for complex patients waiting full physician attention.',
    keywords: ['door-to-provider', 'fast track', 'APP', 'ED staffing', 'credentialing', 'ED throughput'],
  },
  {
    code: 'H3618',
    name: 'Vertical Care Model Not Deployed During Peak Hours',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'Vertical patient care (provider sees patient in waiting room or triage chair without rooming) is in the policy manual but never operationalised — charge nurses cite liability concerns and the absence of a documented vertical care protocol; vertical care could absorb 25–30% of ESI 4–5 patients during peak census, reducing door-to-provider time by an estimated 15 minutes for all queued patients.',
    keywords: ['vertical care', 'door-to-provider', 'ESI triage', 'ED throughput', 'fast track', 'triage'],
  },
  {
    code: 'H3619',
    name: 'Imprivata Single Sign-On Delay Adding Time-to-Documentation',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Imprivata badge-tap authentication requires 18–25 seconds per workstation login — providers treating patients across multiple bays log in and out 40–60 times per shift; the cumulative authentication overhead consumes 12–18 minutes of clinical time per provider per shift and creates a documentation lag where providers defer charting to batch at end of encounter, making real-time door-to-provider tracking in Epic inaccurate.',
    keywords: ['Imprivata', 'door-to-provider', 'Epic', 'authentication', 'ED workflow', 'documentation'],
  },

  // ── LWBS Rate Management ───────────────────────────────────────────────────
  {
    code: 'H3620',
    name: 'LWBS Rate of 6.2% Driven by Wait Time Opacity',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      'Patients leave without being seen at a rate of 6.2% against an industry target of <3% — Press Ganey data shows the primary driver is perceived wait time uncertainty rather than absolute wait time; waiting room display boards show queue position but not estimated wait time, and no text-message update system exists to keep patients informed during waits exceeding 45 minutes. Each 1% LWBS reduction equates to approximately 2,400 additional patient encounters annually at Meridian.',
    keywords: ['LWBS', 'wait time', 'ED throughput', 'Press Ganey', 'patient experience', 'capacity management'],
    demoRelevant: true,
  },
  {
    code: 'H3621',
    name: 'LWBS Patients Not Contacted for Follow-Up Care',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Patients who leave without being seen are discharged from Epic with an LWBS status code but no outreach protocol triggers — 12–18% of LWBS patients had ESI 2–3 acuity at triage; the absence of a same-day callback protocol means high-acuity LWBS patients who deteriorate at home represent significant liability exposure and a missed opportunity for care continuity that could be captured via Vocera or PatientSafe messaging workflows.',
    keywords: ['LWBS', 'triage', 'ESI triage', 'patient safety', 'Epic', 'care continuity'],
  },
  {
    code: 'H3622',
    name: 'LWBS vs LWBT Reporting Conflated in Epic',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Epic codes both "left without being seen" (before triage) and "left without being treated" (after triage but before provider evaluation) under a single LWBS disposition — the distinction matters clinically and for regulatory reporting, as LWBT patients have a documented ESI level and represent a higher acuity departure; operational reports cannot distinguish the two populations, preventing targeted interventions for the higher-risk LWBT cohort.',
    keywords: ['LWBS', 'LWBT', 'Epic', 'triage', 'ED metrics', 'disposition'],
  },
  {
    code: 'H3623',
    name: 'Fast Track Closure Driving LWBS on Weeknight Surge',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      'Fast track closes at 22:00 based on historical volume data, but ED arrivals have shifted with urgent care closures — the 20:00–23:00 window now accounts for 22% of daily ESI 4–5 arrivals; fast track closure routes low-acuity patients into the main ED queue where wait times exceed 2.5 hours, driving LWBS rates to 9–11% in that window against a 3% daily average.',
    keywords: ['fast track', 'LWBS', 'ED throughput', 'ESI triage', 'acuity', 'urgent care diversion'],
  },
  {
    code: 'H3624',
    name: 'No Real-Time LWBS Alerting to Charge Nurse',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'LWBS events are identified retrospectively at shift end when the charge nurse reviews Epic dispositions — by the time the departure is noted, the clinical team cannot intervene or document the reason for departure; real-time alerts from Epic or T-System when a patient has been in the waiting room beyond a threshold wait time (e.g., 60 minutes post-triage) could trigger a proactive check-in that prevents departure in an estimated 20–30% of cases.',
    keywords: ['LWBS', 'charge nurse', 'Epic', 'real-time alert', 'ED throughput', 'patient flow'],
  },
  {
    code: 'H3625',
    name: 'Urgent Care Redirect Increasing LWBS-Prone Low Acuity Volume',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      'Regional urgent care closures have redirected 35–40 additional ESI 4–5 patients per day to the main ED — these patients have low tolerance for long waits and account for 70% of LWBS departures; without a co-located urgent care or fast track operating at full capacity, these patients are absorbed into a main ED queue with average waits of 90+ minutes, creating structural LWBS pressure that cannot be resolved by throughput improvement alone.',
    keywords: ['LWBS', 'urgent care', 'fast track', 'ESI triage', 'ED throughput', 'acuity'],
  },
  {
    code: 'H3626',
    name: 'LWBS Rate Not Stratified by ESI Level in Reporting',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Board-level quality reports present LWBS as a single aggregate rate without ESI-level stratification — an aggregate 6.2% rate obscures the fact that 0.8% of departures are ESI 2 patients who represent a serious safety risk and a significant liability exposure; stratified reporting would enable targeted interventions for high-acuity LWBS versus routine low-acuity departures that have different root causes and different urgency levels.',
    keywords: ['LWBS', 'ESI triage', 'reporting', 'patient safety', 'ED metrics', 'acuity'],
  },
  {
    code: 'H3627',
    name: 'Waiting Room Comfort Interventions Absent',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Patient experience data from Press Ganey indicates that LWBS rates correlate with comfort and communication gaps rather than purely with clinical wait time — no nursing aide is assigned to the waiting room for comfort rounds, water, blankets, or status updates; Studer Group AIDET communication training has been completed by triage nurses but is not applied during waiting room holding, with patients citing feeling forgotten as the primary reason for departure.',
    keywords: ['LWBS', 'patient experience', 'Press Ganey', 'waiting room', 'AIDET', 'Studer Group'],
  },
  {
    code: 'H3628',
    name: 'LWBS Benchmark Comparison Missing From Quality Dashboard',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'ED quality dashboards do not display peer-facility LWBS benchmarks from Press Ganey or Hospital Compare alongside the organisation\'s own rate — without context, a 6.2% rate appears acceptable to operational leaders who may not know the top-decile benchmark is 1.8%; absence of comparative data reduces the urgency of LWBS reduction as a strategic priority and delays investment in fast track expansion and vertical care models.',
    keywords: ['LWBS', 'benchmarking', 'Press Ganey', 'quality dashboard', 'ED metrics', 'ED throughput'],
  },
  {
    code: 'H3629',
    name: 'LWBS Patients Generating Missed Downstream Revenue',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'At a 6.2% LWBS rate across 72,000 annual ED visits, approximately 4,460 patients leave without generating a charge — average ED revenue per visit of $1,800 represents $8M in annual lost revenue that is not quantified in the LWBS quality improvement business case; finance and operations teams treat LWBS as a quality metric rather than a revenue issue, limiting investment approval for fast track expansion projects.',
    keywords: ['LWBS', 'ED throughput', 'revenue', 'charge capture', 'capacity management', 'fast track'],
  },

  // ── Sepsis Protocol Activation Delay ──────────────────────────────────────
  {
    code: 'H3630',
    name: 'SEP-1 Bundle Compliance Failure from Alert Fatigue',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      'Epic BestPractice Advisory alerts for sepsis protocol activation fire for 38% of adult ED patients meeting two or more SIRS criteria — the alert over-fires rate exceeds 80%, causing providers to dismiss the alert reflexively; Sentri7 pharmacy integration flags antibiotic orders but the clinical decision to activate the full SEP-1 bundle (lactate, blood cultures ×2, broad-spectrum antibiotics within 3 hours, IV fluids 30mL/kg) is delayed an average of 87 minutes from first alert, below the CMS SEP-1 3-hour window.',
    keywords: ['SEP-1 bundle', 'sepsis', 'alert fatigue', 'Epic', 'Sentri7', 'CMS compliance'],
    demoRelevant: true,
  },
  {
    code: 'H3631',
    name: 'Sepsis Screening Tool Not Embedded in Triage Workflow',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      'Triage nurses complete T-System vital signs documentation but no sepsis screening question set (qSOFA or NEWS2) is embedded in the triage workflow — sepsis is first identified by an Epic BPA triggered when lab results return, an average of 75 minutes after patient arrival; nurse-driven triage sepsis screening at first vital signs could identify 60–70% of sepsis patients within 15 minutes of arrival, enabling earlier SEP-1 activation.',
    keywords: ['sepsis', 'triage', 'T-System', 'SEP-1 bundle', 'qSOFA', 'door-to-provider'],
  },
  {
    code: 'H3632',
    name: 'Blood Culture Collection Delay Breaking SEP-1 Timeline',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'SEP-1 bundle requires two sets of blood cultures before antibiotic administration — phlebotomy team response time averages 28 minutes from order to collection in the ED, and the requirement to collect from two sites sequentially adds another 15–20 minutes; antibiotic administration is held pending culture collection, pushing total time-to-antibiotics to 90+ minutes from sepsis recognition and creating a structural SEP-1 compliance failure that is documented but unresolved.',
    keywords: ['SEP-1 bundle', 'blood culture', 'sepsis', 'phlebotomy', 'antibiotic', 'ED throughput'],
  },
  {
    code: 'H3633',
    name: 'Sepsis Protocol Activation Inconsistent Across Providers',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      'SEP-1 activation rates vary from 45% to 92% by individual attending physician — Epic data shows a 2.1× variation in protocol compliance across the ED medical staff with no structured peer review of outlier providers; the absence of a monthly sepsis compliance review and the lack of sepsis bundle order set as a default (rather than optional) in Epic contribute to provider-level variation that aggregate metrics obscure.',
    keywords: ['sepsis', 'SEP-1 bundle', 'Epic', 'provider variation', 'protocol compliance', 'peer review'],
  },
  {
    code: 'H3634',
    name: 'Lactate Repeat Testing Not Ordered When Initial Lactate Elevated',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'CMS SEP-1 measure requires repeat lactate testing within 2 hours when initial lactate is ≥2 mmol/L — Epic does not generate an automatic repeat lactate order, and providers frequently omit the repeat draw; repeat lactate compliance is 54% against a 100% requirement, creating a systematic SEP-1 documentation failure that is reportable to CMS and affects value-based purchasing penalties.',
    keywords: ['SEP-1 bundle', 'lactate', 'sepsis', 'Epic', 'CMS compliance', 'value-based purchasing'],
  },
  {
    code: 'H3635',
    name: 'Sepsis Resuscitation Fluid Documentation Gaps',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'SEP-1 requires documentation that 30mL/kg crystalloid was administered within 3 hours for septic shock patients — nursing staff administer fluid boluses but document the volume in the medication administration record as a series of smaller boluses without a cumulative volume note; Epic does not auto-calculate the total crystalloid volume against the weight-based target, causing SEP-1 abstraction failures even when clinical care was compliant.',
    keywords: ['SEP-1 bundle', 'sepsis', 'fluid resuscitation', 'Epic', 'documentation', 'nursing'],
  },
  {
    code: 'H3636',
    name: 'Antibiotic De-Escalation Signal Lost After ED Sepsis Activation',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Broad-spectrum antibiotics initiated in the ED under SEP-1 continue on inpatient floors without culture-directed de-escalation review — Sentri7 pharmacy safety alerts for antibiotic stewardship fire 48–72 hours after admission when culture results return, but the ED-to-floor handoff does not include a 72-hour de-escalation checkpoint in Epic care plans; antibiotic days per admission exceed benchmarks by 1.8 days, driving C. difficile rates above target.',
    keywords: ['antibiotic stewardship', 'sepsis', 'Sentri7', 'Epic', 'de-escalation', 'SEP-1 bundle'],
  },
  {
    code: 'H3637',
    name: 'Cryptic Sepsis Missed Without Lactate Ordering Protocol',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Patients presenting with normal vital signs but elevated lactate (cryptic septic shock) are not identified because lactate is not ordered as a standing triage protocol for high-risk presentations (immunocompromised, elderly, recent procedure) — Epic triage documentation in T-System does not flag lactate-trigger criteria; approximately 8–12 patients per quarter are admitted with late-identified septic shock that a triage lactate protocol would have captured earlier.',
    keywords: ['sepsis', 'lactate', 'cryptic septic shock', 'triage', 'T-System', 'SEP-1 bundle'],
  },
  {
    code: 'H3638',
    name: 'Sepsis Mortality Data Not Fed Back to ED Team',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Quality reporting shows ED-activated sepsis case mortality rates quarterly but does not link outcomes to ED care metrics (time-to-antibiotics, time-to-lactate) at the individual case level — ED physicians and nurses never see whether the patient they cared for survived, died, or had a prolonged ICU stay; the absence of outcome feedback loops removes the learning mechanism that would motivate SEP-1 compliance and clinical protocol adherence.',
    keywords: ['sepsis', 'SEP-1 bundle', 'mortality', 'quality reporting', 'feedback loop', 'ED throughput'],
  },
  {
    code: 'H3639',
    name: 'Sepsis Alert Timing Misconfigured in Epic BPA Rules',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Epic Best Practice Advisory for sepsis fires only after the first lab result returns (average 45 minutes post-order) rather than at triage when two or more SIRS criteria are first documented in vital signs — the BPA configuration was never updated when the ED adopted T-System for triage documentation; vital sign data in T-System is not transmitted to Epic in real time, creating a 45-minute detection gap that is entirely an integration and configuration failure.',
    keywords: ['sepsis', 'Epic', 'T-System', 'BestPractice Advisory', 'SEP-1 bundle', 'alert'],
  },

  // ── ESI Triage Accuracy ────────────────────────────────────────────────────
  {
    code: 'H3640',
    name: 'ESI Undertriage of High-Acuity Patients',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'Emergency Severity Index undertriage (assigning ESI 3 when ESI 2 is correct) occurs in 8.4% of cases reviewed by the triage quality committee — undertriaged patients wait in the main queue rather than receiving priority room assignment; three sentinel events in the past 18 months involved patients with ESI 3 assignments who required emergent intervention within 30 minutes of triage, two of which involved chest pain presentations where the HEART score was not calculated at triage.',
    keywords: ['ESI triage', 'undertriage', 'triage accuracy', 'patient safety', 'door-to-provider', 'acuity'],
    demoRelevant: true,
  },
  {
    code: 'H3641',
    name: 'ESI Overtriage Consuming High-Acuity Resources',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'ESI overtriage (assigning ESI 2 when ESI 3 is correct) occurs in 11.2% of triage encounters — overtriaged patients are assigned to monitored resuscitation bays that are then unavailable for genuinely high-acuity patients; overtriage consumes nursing and provider resources at 1.8× the rate appropriate to the patient\'s actual clinical condition and is a primary driver of resuscitation bay unavailability during high-census periods.',
    keywords: ['ESI triage', 'overtriage', 'triage accuracy', 'acuity', 'resuscitation bay', 'ED throughput'],
  },
  {
    code: 'H3642',
    name: 'Triage Nurse ESI Training Not Standardised or Audited',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'ESI triage training is completed at new-hire orientation but no annual competency validation or inter-rater reliability testing occurs — the triage quality committee reviews individual triage errors reactively after adverse events rather than proactively monitoring ESI assignment accuracy; evidence from comparable institutions shows annual ESI competency review reduces undertriage rates by 35–40% through structured case review and peer calibration exercises.',
    keywords: ['ESI triage', 'triage accuracy', 'competency', 'training', 'triage nurse', 'undertriage'],
  },
  {
    code: 'H3643',
    name: 'Paediatric ESI Weight-Based Resource Prediction Not Applied',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'ESI Level 3 triage for paediatric patients requires resource prediction using weight-based dosing considerations — triage nurses trained in adult ESI criteria apply adult resource thresholds to children; paediatric patients receive ESI 3 when weight-based medication complexity should elevate them to ESI 2; Broselow tape measurement is not documented at triage in T-System for 45% of paediatric encounters despite being required by policy.',
    keywords: ['ESI triage', 'paediatric ED', 'triage accuracy', 'weight-based dosing', 'T-System', 'Broselow'],
  },
  {
    code: 'H3644',
    name: 'Mental Health Triage ESI Assignment Without Psychiatric Risk Stratification',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      'Patients presenting with behavioural health chief complaints are triaged using physical ESI criteria without a psychiatric risk stratification tool (Columbia Suicide Severity Rating Scale or SAD PERSONS) — psychiatric patients with suicidal ideation are frequently assigned ESI 3 rather than ESI 2, placed in the general waiting room, and left unmonitored; two elopement events in the past year involved patients triaged ESI 3 for suicidal ideation who left the waiting room undetected.',
    keywords: ['ESI triage', 'psychiatric boarding', 'triage accuracy', 'behavioural health', 'suicide risk', 'patient safety'],
  },
  {
    code: 'H3645',
    name: 'Stroke Triage ESI Recognition Gaps Without FAST Protocol Integration',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      'FAST (Face, Arms, Speech, Time) stroke screening is not embedded in the T-System triage template for patients presenting with neurological symptoms — triage nurses document chief complaint and vital signs but do not apply FAST criteria; 14% of ischemic stroke patients in the past 12 months received ESI 3 at triage and experienced door-to-CT times exceeding 45 minutes against a 25-minute target, with three patients missing the tPA administration window as a result.',
    keywords: ['ESI triage', 'stroke', 'FAST protocol', 'T-System', 'door-to-provider', 'triage accuracy'],
  },
  {
    code: 'H3646',
    name: 'ESI Level Not Recalculated After Waiting Room Deterioration',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'When waiting room reassessments identify worsening vital signs or new symptoms, triage nurses update the nursing assessment in T-System but do not formally re-triage with an updated ESI level — Epic does not prompt for ESI reassignment when reassessment vital signs trigger clinical thresholds; patients who deteriorate from ESI 3 to ESI 2 in the waiting room remain in the ESI 3 queue, delaying room assignment by an average of 28 minutes compared to patients initially triaged ESI 2.',
    keywords: ['ESI triage', 'waiting room reassessment', 'triage accuracy', 'T-System', 'patient safety', 'acuity'],
  },
  {
    code: 'H3647',
    name: 'Pain Scale Documentation Not Driving ESI Resource Prediction',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      'ESI Level 3 resource prediction requires triage nurses to estimate likely resource utilisation (labs, imaging, IV access) but pain scales documented in T-System are not factored into the resource count — patients with pain score 9–10 requiring IV analgesics, IV fluids, and CT imaging are frequently assigned ESI 3 with one-resource prediction when the actual resource utilisation will be 3–4 resources; this causes room assignment to under-prioritise complex pain presentations.',
    keywords: ['ESI triage', 'triage accuracy', 'pain scale', 'T-System', 'resource prediction', 'acuity'],
  },
  {
    code: 'H3648',
    name: 'Triage-to-Room Interval Not Tracked Separately from Door-to-Provider',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Operational metrics conflate triage-to-room and room-to-provider intervals into a single door-to-provider metric — triage-to-room delays caused by bed unavailability are operationally distinct from room-to-provider delays caused by staffing; without separating the intervals, throughput improvement efforts cannot be targeted to the right bottleneck; Meridian\'s 47-minute median door-to-provider is 60% triage-to-room delay and 40% room-to-provider, but the composite metric hides this split.',
    keywords: ['triage', 'ESI triage', 'door-to-provider', 'ED metrics', 'ED throughput', 'triage-to-room'],
  },
  {
    code: 'H3649',
    name: 'ESI Audit Programme Lacking Random Sample Review',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Triage quality audit reviews only cases that generated a complaint, sentinel event, or peer referral — a random sample audit of 10% of triage encounters per month would identify systematic undertriage patterns by shift, day of week, or individual nurse that are invisible in complaint-driven review; academic literature demonstrates that complaint-driven audit captures fewer than 15% of undertriage events, making the current audit insufficient for identifying safety risk.',
    keywords: ['ESI triage', 'triage accuracy', 'audit', 'undertriage', 'quality programme', 'triage nurse'],
  },

  // ── Diversion and Ambulance Diversion Management ──────────────────────────
  {
    code: 'H3650',
    name: 'Ambulance Diversion Decision Not Data-Driven',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'ED diversion is declared by the charge nurse based on subjective crowding assessment rather than objective TeleTracking capacity metrics — the diversion threshold policy references "full capacity" without a numeric definition, and different charge nurses apply different standards; regional diversion coordination through the EMS system uses a phone-based protocol rather than an automated feed from TeleTracking, adding a 15–20 minute lag between the diversion decision and EMS notification.',
    keywords: ['diversion', 'TeleTracking', 'ambulance diversion', 'capacity management', 'EMS', 'ED crowding'],
  },
  {
    code: 'H3651',
    name: 'Regional Diversion Coordination Without Shared Capacity Data',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'When Meridian goes on diversion, regional EMS diverts ambulances to two competing hospitals whose real-time capacity is not visible to the EMS dispatch system — EMS dispatchers make diversion routing decisions using phone-based hospital status reports updated every 30 minutes; ambulances are sometimes diverted to a hospital that entered diversion 20 minutes earlier, creating a regional cascade failure that could be prevented with a shared regional capacity dashboard.',
    keywords: ['diversion', 'regional EMS', 'ambulance diversion', 'capacity management', 'TeleTracking', 'EMS'],
  },
  {
    code: 'H3652',
    name: 'Diversion Duration Metric Not Analysed for Root Cause',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Total monthly diversion hours are reported to the ED quality committee but root-cause categories (boarding-driven, staffing-driven, surge-driven) are not documented — without root-cause stratification, the committee cannot prioritise the right intervention; 70% of diversion episodes last <2 hours and are triggered by temporary staffing gaps that a real-time agency nurse escalation protocol could resolve, but this pattern is invisible without categorised diversion data.',
    keywords: ['diversion', 'ED throughput', 'capacity management', 'root cause', 'ED boarding', 'staffing'],
  },
  {
    code: 'H3653',
    name: 'Diversion Causing EMS Relationship Damage',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'Frequent ambulance diversion has strained relationships with regional EMS providers who cite inconsistent diversion declarations and poor re-opening communication — EMS crews report receiving diversion declarations that are lifted within 20 minutes without notification, resulting in diversions to more distant facilities for patients whose transport time was extended unnecessarily; two EMS agencies have filed formal quality complaints with the hospital regarding diversion management.',
    keywords: ['diversion', 'EMS', 'ambulance diversion', 'patient safety', 'ED throughput', 'regional coordination'],
  },
  {
    code: 'H3654',
    name: 'Diversion Impact on Stroke and STEMI Time-Sensitive Cases',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      'Hospital policy should exempt STEMI and stroke cases from ambulance diversion but the exemption is not consistently applied — EMS crews activate the STEMI cath lab activation protocol and are still diverted by the charge nurse who is unaware of the exemption policy; two cases in the past year experienced door-to-balloon time exceeding 90 minutes that were directly attributable to diversion-related transport delays rather than in-hospital process failures.',
    keywords: ['diversion', 'STEMI', 'stroke', 'ambulance diversion', 'EMS', 'time-sensitive care'],
  },
  {
    code: 'H3655',
    name: 'Diversion Frequency Correlated With Boarding Rate Not Addressed',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'Analysis of 18 months of TeleTracking data shows 84% of diversion episodes occur when ED boarding exceeds 8 patients — this correlation has been documented in quality reports but no operational intervention has been implemented to break the boarding-diversion cycle; addressing boarding through bed-pull protocol enforcement would eliminate the proximate cause of the majority of diversion episodes, yet boarding and diversion are managed as separate quality initiatives without a shared action plan.',
    keywords: ['diversion', 'ED boarding', 'TeleTracking', 'capacity management', 'bed management', 'ED throughput'],
  },
  {
    code: 'H3656',
    name: 'Diversion Lifting Protocol Delayed by Communication Chain',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      'Lifting an ambulance diversion requires the charge nurse to call the house supervisor, who calls the EMS liaison, who updates the regional EMS dispatch system — the three-step communication chain adds 20–35 minutes to the diversion lift time; during this window, ambulances continue to be diverted to other facilities even though the ED has capacity to accept patients; a direct Epic or Vocera-based notification to the EMS liaison would reduce lift notification time to under 5 minutes.',
    keywords: ['diversion', 'EMS', 'communication', 'Vocera', 'ambulance diversion', 'ED throughput'],
  },
  {
    code: 'H3657',
    name: 'Diversion Not Reported as a Quality Metric to Hospital Board',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Monthly diversion hours are tracked internally but not included in the hospital board quality scorecard — board members are unaware that the facility diverts ambulances an average of 34 hours per month; without board visibility, the capital investment required for ED expansion, capacity command centre technology, or fast track development does not receive board-level prioritisation despite diversion representing a significant community access and revenue risk.',
    keywords: ['diversion', 'capacity management', 'governance', 'quality reporting', 'ED throughput', 'board scorecard'],
  },
  {
    code: 'H3658',
    name: 'Diversion Revenue Loss Not Quantified',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Each hour of ambulance diversion results in an average of 2.4 ambulance transports redirected to competing facilities — at an average ED visit revenue of $1,800, 34 monthly diversion hours represent $147,000 in monthly diverted revenue; this quantification has never been calculated and presented to the CFO, meaning diversion management has no financial business case for the staffing and technology investments that would reduce diversion frequency by an estimated 60–70%.',
    keywords: ['diversion', 'ambulance diversion', 'revenue', 'ED throughput', 'capacity management', 'finance'],
  },
  {
    code: 'H3659',
    name: 'Trauma Diversion Separate From Medical Diversion Without Unified Protocol',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'Trauma diversion is managed by the trauma medical director while medical diversion is managed by the ED charge nurse — the two protocols have different escalation paths, different documentation systems, and different EMS notification contacts; during simultaneous medical and trauma diversion events, EMS dispatch receives conflicting messages and defaults to phone-based clarification, creating delays in patient routing during the highest-acuity situations.',
    keywords: ['diversion', 'trauma activation', 'ambulance diversion', 'EMS', 'capacity management', 'protocol'],
  },

  // ── Rapid Medical Evaluation and Split-Flow Failures ──────────────────────
  {
    code: 'H3660',
    name: 'RME Provider Coverage Gap During Peak Arrival Hours',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      'Rapid medical evaluation staffing is scheduled from 10:00–22:00 but ED data shows the highest ESI 4–5 arrival rate is from 08:00–11:00 — the first 2 hours of peak RME demand go unserved by the RME lane, routing low-acuity patients into the main ED queue and increasing door-to-provider times for all patients during the morning surge; adjusting RME staffing to an 08:00 start would capture the equivalent of 18–22 additional patient throughput opportunities daily.',
    keywords: ['rapid medical evaluation', 'RME', 'split flow', 'ED throughput', 'staffing', 'door-to-provider'],
  },
  {
    code: 'H3661',
    name: 'Split-Flow Criteria Not Applied Consistently by Triage Nurses',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'RME eligibility criteria (ESI 4–5, ambulatory, no IV requirement at triage, chief complaint in the approved list) are documented in a policy binder but not embedded in the T-System triage template — triage nurses apply subjective judgment for RME routing; audit review shows only 58% of eligible patients are directed to the RME lane, with the remainder placed in the main queue, resulting in an RME lane that operates at 65% of designed throughput capacity.',
    keywords: ['split flow', 'rapid medical evaluation', 'triage', 'T-System', 'ESI triage', 'ED throughput'],
  },
  {
    code: 'H3662',
    name: 'RME Results Pending Causing Main ED Boarding of Low-Acuity Patients',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'Patients evaluated in the RME lane who require a simple lab result or X-ray before discharge occupy RME chairs for 60–90 minutes waiting for results — the RME lane has no dedicated "results pending" waiting area, so these patients block chairs from newly arriving ESI 4–5 patients; during peak hours, 6–8 RME chairs are simultaneously occupied by results-pending patients, reducing the operational throughput of the RME lane by 40–50%.',
    keywords: ['rapid medical evaluation', 'RME', 'split flow', 'ED throughput', 'fast track', 'patient flow'],
  },
  {
    code: 'H3663',
    name: 'Fast Track to RME Handoff Not Standardised',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'When RME capacity is full, triage nurses route eligible patients to fast track but the handoff between RME and fast track is verbal — fast track nurses do not have visibility into the RME queue in Epic, creating double-triaging and documentation duplication; some patients receive two sets of intake documentation, others receive neither, producing charge capture gaps because one of the two documentation sets is incomplete.',
    keywords: ['rapid medical evaluation', 'fast track', 'split flow', 'handoff', 'Epic', 'charge capture'],
  },
  {
    code: 'H3664',
    name: 'RME Lane Lacks Point-of-Care Testing Capability',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'RME lane is designed for rapid turnaround but shares the main ED laboratory order queue — point-of-care testing (iSTAT, urine dipstick, rapid strep, rapid flu) that could provide results in 5–10 minutes is not available in the RME area; nurses must send specimens to the central lab via pneumatic tube, adding 25–45 minutes to simple workups that prolong RME patient occupancy and reduce throughput to below the design target of 8–10 patients per provider per shift.',
    keywords: ['rapid medical evaluation', 'RME', 'point-of-care testing', 'ED throughput', 'iSTAT', 'fast track'],
  },
  {
    code: 'H3665',
    name: 'RME Physician Documentation Not Completing in T-System',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'RME providers complete brief assessments in Epic but T-System medical decision-making documentation is incomplete for 32% of RME encounters — RME providers cite time pressure and the redundancy of dual documentation (T-System and Epic) as the reason for incomplete T-System notes; coding and compliance review identifies the incomplete T-System records as a charge capture risk for any RME encounter that proceeds to observation or inpatient admission.',
    keywords: ['rapid medical evaluation', 'T-System', 'Epic', 'documentation', 'charge capture', 'RME'],
  },
  {
    code: 'H3666',
    name: 'Split Flow Not Implemented for Chest Pain Low-Risk Pathway',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'Low-risk chest pain patients meeting HEART Score ≤3 criteria are eligible for an accelerated 2-hour rule-out protocol using high-sensitivity troponin — this pathway is not embedded in the ED split-flow model, and all chest pain patients are routed to monitored cardiac bays regardless of HEART Score; the result is that 40% of chest pain patients occupy high-acuity monitored beds when they could be managed in the fast track lane, reducing cardiac bay availability for genuinely high-acuity presentations.',
    keywords: ['split flow', 'chest pain', 'HEART score', 'fast track', 'ED throughput', 'troponin'],
  },
  {
    code: 'H3667',
    name: 'RME Performance Metrics Not Reported Separately From Main ED',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'ED operational reports aggregate all patient encounters into a single door-to-provider and length-of-stay metric — RME lane performance is indistinguishable from main ED performance in reports; if RME is performing well but main ED is not (or vice versa), the aggregate metric masks the differential and prevents lane-specific operational improvements; separating the metrics would also enable RME provider productivity benchmarking against design targets.',
    keywords: ['rapid medical evaluation', 'RME', 'ED metrics', 'split flow', 'ED throughput', 'reporting'],
  },
  {
    code: 'H3668',
    name: 'Paediatric Patients Routed Through Adult RME Without Age-Specific Protocol',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'Paediatric patients (age <14) meeting RME eligibility criteria are routed to the adult RME lane — adult-configured RME does not have weight-based dosing references, paediatric vital sign norms displayed in Epic, or paediatric-appropriate equipment (Broselow cart, paediatric BP cuffs); providers in the adult RME lane frequently escalate paediatric patients to the main ED rather than completing the RME encounter, defeating the throughput benefit of the split-flow design.',
    keywords: ['paediatric ED', 'rapid medical evaluation', 'RME', 'split flow', 'weight-based dosing', 'ED throughput'],
  },
  {
    code: 'H3669',
    name: 'RME Discharge Instruction Quality Below Main ED Standard',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'RME discharges use abbreviated Epic discharge instruction templates that do not include follow-up appointment scheduling, prescription readiness confirmation, or return-to-ED precaution documentation at the same level as main ED discharges — 72-hour return visit rates for RME discharges are 4.2% versus 2.8% for main ED discharges; the differential suggests discharge quality gaps that are not captured in any RME-specific quality monitoring.',
    keywords: ['rapid medical evaluation', 'RME', 'discharge', 'follow-up', 'Epic', 'return visit'],
  },

  // ── Fast Track Operations ──────────────────────────────────────────────────
  {
    code: 'H3670',
    name: 'Fast Track Accepting Inappropriate Acuity Patients',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'Fast track is designed for ESI 4–5 patients but accepts ESI 3 patients when the main ED is overcrowded — ESI 3 patients routed to fast track require more resources (IV access, complex imaging, specialist consultation) than the fast track staffing model supports; fast track nurses are managing patients above their scope design 40% of the time, increasing fast track length-of-stay to 3.2 hours and defeating the throughput efficiency that fast track was designed to deliver.',
    keywords: ['fast track', 'ESI triage', 'acuity', 'ED throughput', 'staffing', 'patient flow'],
  },
  {
    code: 'H3671',
    name: 'Fast Track Not Operationally Separated From Main ED',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'Fast track shares nursing staff with the main ED during staffing shortfalls — when main ED census is high, fast track nurses are pulled to cover main ED bays, closing fast track and pushing all arriving patients into the main queue; fast track is operationally closed 28% of scheduled hours due to staff reallocation, undermining the throughput benefit and creating unpredictable patient flow for ESI 4–5 patients who arrive expecting fast track care.',
    keywords: ['fast track', 'ED staffing', 'ED throughput', 'patient flow', 'split flow', 'LWBS'],
  },
  {
    code: 'H3672',
    name: 'Fast Track Lacks Dedicated X-Ray Capability',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      'Fast track patients requiring plain film X-ray (ankle, extremity, chest) must be transported to the main ED radiology suite — transport time, waiting for a portable unit or radiology tech, and image review add 35–55 minutes to fast track length-of-stay for encounters that should close in 60–90 minutes; a dedicated portable X-ray protocol for fast track with direct PACS integration would reduce fast track LOS for imaging encounters by an estimated 30 minutes.',
    keywords: ['fast track', 'radiology', 'ED throughput', 'length of stay', 'patient flow', 'imaging'],
  },
  {
    code: 'H3673',
    name: 'Fast Track Prescription Delays at Discharge',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      'Fast track discharges require prescription reconciliation through the main ED pharmacy verification queue — Sentri7 pharmacy safety review is appropriate for complex ED prescriptions but adds 18–25 minutes to simple fast track discharges for uncomplicated infections, minor injuries, and routine refills; a fast-track-specific prescription pathway with standing order sets for common fast track diagnoses would eliminate the pharmacy queue delay for 60% of fast track prescriptions.',
    keywords: ['fast track', 'Sentri7', 'discharge', 'prescription', 'ED throughput', 'pharmacy'],
  },
  {
    code: 'H3674',
    name: 'Fast Track Acuity Creep After Urgent Care Hours',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'After 20:00 when urgent care facilities close, fast track receives a surge of ESI 3 patients previously managed in the urgent care setting — the fast track staffing model does not adjust for this post-20:00 acuity shift; providers are seeing patients with moderate-complexity presentations in a fast track workflow designed for simple low-acuity care, increasing fast track length-of-stay and generating dissatisfaction among high-acuity patients waiting in the main queue.',
    keywords: ['fast track', 'acuity', 'urgent care', 'ED throughput', 'staffing', 'ESI triage'],
  },
  {
    code: 'H3675',
    name: 'Fast Track Provider Productivity Benchmarks Not Established',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Fast track providers (APPs and attendings) have no established productivity benchmarks for patients per hour or relative value units per shift in the fast track setting — without benchmarks, provider performance variability (range: 1.8–4.2 patients per hour) is not addressed through coaching or scheduling; the lowest-productivity fast track providers generate the same throughput as a closed fast track, yet their performance is invisible in aggregate ED productivity metrics.',
    keywords: ['fast track', 'provider productivity', 'ED throughput', 'benchmarking', 'APP', 'metrics'],
  },
  {
    code: 'H3676',
    name: 'Fast Track Patient Experience Scores Below Main ED',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Press Ganey patient experience scores for fast track encounters are consistently 12–15 percentile points below main ED scores — fast track patients cite lack of explanation, rushed discharge instructions, and feeling less cared for than anticipated from an ED visit; Studer Group AIDET communication training applied to fast track providers and nurses reduces fast track experience score gaps by an average of 8 percentile points in peer institution studies, but AIDET has not been applied to the fast track setting.',
    keywords: ['fast track', 'patient experience', 'Press Ganey', 'AIDET', 'Studer Group', 'discharge'],
  },
  {
    code: 'H3677',
    name: 'Fast Track-to-Admit Escalation Without Documented Protocol',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'Approximately 8–10% of fast track patients are escalated to inpatient admission after evaluation reveals higher acuity than the initial ESI 4–5 triage — when a fast track patient requires admission, there is no documented escalation protocol governing the transfer back to the main ED, bed assignment request, and hospitalist notification; fast track nurses call the charge nurse verbally, creating an informal escalation that is not tracked and cannot be measured for timeliness.',
    keywords: ['fast track', 'escalation', 'ED boarding', 'hospitalist', 'patient flow', 'ED throughput'],
  },
  {
    code: 'H3678',
    name: 'Fast Track Hours Not Aligned to Paediatric Volume Patterns',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'Fast track operating hours are set based on adult patient volume patterns — paediatric arrival peaks occur earlier in the afternoon (15:00–18:00 after school) and later in the evening than adult peaks, but fast track hours and staffing do not adjust for paediatric volume; paediatric ESI 4–5 patients arriving at 16:30 face full adult fast track queues even though adult volume is lower at that time, driving paediatric LWBS rates above adult rates in the afternoon window.',
    keywords: ['fast track', 'paediatric ED', 'LWBS', 'ED throughput', 'patient flow', 'staffing'],
  },
  {
    code: 'H3679',
    name: 'Fast Track Chief Complaint Eligibility List Outdated',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Fast track eligibility is defined by a chief complaint list last updated 3 years ago — chief complaints that could be safely managed in fast track (URI, medication refill, wound check, suture removal, laceration repair) are not on the list because they were not considered when the list was written; triage nurses route eligible patients to the main ED queue out of uncertainty about eligibility, and the outdated list is not reviewed at triage orientation or competency renewals.',
    keywords: ['fast track', 'triage', 'ESI triage', 'ED throughput', 'chief complaint', 'patient flow'],
  },

  // ── Psychiatric Boarding Crisis ────────────────────────────────────────────
  {
    code: 'H3680',
    name: 'Psychiatric Boarding Duration Averaging 42 Hours',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      'Behavioural health patients boarding in the medical ED await inpatient psychiatric placement for an average of 42 hours — inpatient psychiatric beds at the regional facility have a 6–8 week waiting list for voluntary admissions and 3–5 day wait for involuntary holds; the ED has no telepsychiatry capability, no crisis stabilisation unit, and no peer support specialist to assist with voluntary placement, making the medical ED the default long-term holding environment for a population it is not designed or staffed to serve.',
    keywords: ['psychiatric boarding', 'behavioural health', 'ED boarding', 'telepsychiatry', 'inpatient bed', 'crisis stabilisation'],
    demoRelevant: true,
  },
  {
    code: 'H3681',
    name: 'Psychiatric Patients Occupying Medical Monitoring Bays',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'Psychiatric boarders are placed in telemetry-monitored ED bays due to the absence of a designated lower-acuity psychiatric holding area — monitored bays required for cardiac monitoring, post-procedure recovery, and high-acuity medical patients are occupied by psychiatric patients who do not need cardiac monitoring; each occupied monitored bay represents an effective reduction of medical ED capacity, contributing directly to boarding rates and LWBS for medical patients.',
    keywords: ['psychiatric boarding', 'ED boarding', 'ED capacity', 'behavioural health', 'monitoring bay', 'patient flow'],
  },
  {
    code: 'H3682',
    name: 'Psychiatric Boarding Safety Events Not Linked to ED Throughput Data',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Safety events involving psychiatric boarders (elopement, self-harm attempts, patient-on-staff violence) are reported through the incident reporting system but are not linked to boarding duration data in Epic or TeleTracking — quality review cannot demonstrate that longer boarding duration correlates with higher incident rates, preventing the argument for dedicated psychiatric holding space from being built on a safety data foundation.',
    keywords: ['psychiatric boarding', 'patient safety', 'elopement', 'Epic', 'TeleTracking', 'ED boarding'],
  },
  {
    code: 'H3683',
    name: 'No Psychiatric Emergency Physician or Social Work Specialist in ED',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Psychiatric assessments in the ED are conducted by emergency medicine physicians who have general training in psychiatric emergencies but no subspecialty training — complex presentations (acute psychosis with medical co-morbidity, substance use disorder with withdrawal risk, personality disorder with self-harm) require psychiatric consultation that is available only via on-call phone triage after hours; disposition decisions are delayed 3–6 hours while awaiting phone consultation that results in an involuntary hold order.',
    keywords: ['psychiatric boarding', 'behavioural health', 'psychiatric consultation', 'ED staffing', 'social work', 'disposition'],
  },
  {
    code: 'H3684',
    name: 'Involuntary Hold Documentation Incomplete Causing Legal Risk',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Patients placed on involuntary psychiatric holds require specific legal documentation (danger to self or others, gravely disabled criteria) that must be completed within defined timeframes — T-System and Epic documentation templates for involuntary hold criteria are not standardised; chart review shows 28% of involuntary holds have incomplete or ambiguous documentation of the legal criteria, creating liability exposure if the hold is challenged and lacking the documentation to defend the clinical decision.',
    keywords: ['psychiatric boarding', 'involuntary hold', 'documentation', 'T-System', 'Epic', 'legal'],
  },
  {
    code: 'H3685',
    name: 'Substance Use Disorder Patients Inappropriately Held in ED',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      'Patients presenting with substance use disorder requiring medical stabilisation occupy ED beds for 24–48 hours while awaiting community SUD treatment placement — no warm handoff protocol exists between the ED social worker and community SUD treatment programmes; 40% of SUD-related ED holds could be resolved within 6–8 hours with a dedicated care coordination pathway that does not currently exist, and patients who leave AMA frequently return within 72 hours.',
    keywords: ['substance use disorder', 'psychiatric boarding', 'SUD', 'ED boarding', 'care coordination', 'social work'],
  },
  {
    code: 'H3686',
    name: 'Telepsychiatry Implementation Stalled at Contracting Phase',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      'A telepsychiatry vendor was selected 14 months ago to provide after-hours psychiatric consultation to reduce boarding, but implementation has stalled at contract negotiation over liability clauses — the legal review has been ongoing for 6 months with no resolution; during this 14-month delay, an estimated 3,800 psychiatric boarding days have accumulated in the ED at a cost of approximately $1.9M in diverted bed-capacity and staff overtime.',
    keywords: ['telepsychiatry', 'psychiatric boarding', 'contracting', 'behavioural health', 'ED boarding', 'implementation'],
  },
  {
    code: 'H3687',
    name: 'Paediatric Psychiatric Boarding Without Age-Appropriate Space',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      'Paediatric patients under 18 presenting with suicidal ideation or acute behavioural health crisis board in the adult medical ED — the absence of a dedicated paediatric psychiatric evaluation area means children and adolescents are placed in adult bays adjacent to adult psychiatric boarders and medically complex adults; state regulations require age-appropriate environments for paediatric mental health holds, and the current setup violates regulatory standards that have been cited on state inspection.',
    keywords: ['paediatric ED', 'psychiatric boarding', 'behavioural health', 'patient safety', 'regulatory', 'ED boarding'],
  },
  {
    code: 'H3688',
    name: 'Psychiatric Boarding Nursing Workload Not Adjusted in Staffing Model',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'Psychiatric boarding patients require 1:1 observation for safety, which is not factored into the ED nurse staffing model — when 4 psychiatric boarders require constant observation, 4 nurses are effectively removed from the general ED patient pool; the staffing model does not adjust RN-to-patient ratios for observation assignments, creating a de facto staffing crisis that reduces capacity for medical patients without generating a visible staffing alarm in the scheduling system.',
    keywords: ['psychiatric boarding', 'ED staffing', 'nurse staffing', 'patient safety', '1:1 observation', 'capacity management'],
  },
  {
    code: 'H3689',
    name: 'Psychiatric Boarding Data Not Included in ED Throughput Dashboard',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'TeleTracking capacity dashboard displays total ED census and boarding count but does not segment psychiatric boarders separately — supervisors cannot see at a glance how many of the current boarders are psychiatric (requiring different interventions than medical boarders); without this visibility, the bed management team defaults to bed-pull interventions for all boarders, which is ineffective for psychiatric boarders whose bottleneck is community placement rather than inpatient bed availability.',
    keywords: ['psychiatric boarding', 'TeleTracking', 'capacity command centre', 'ED throughput', 'bed management', 'dashboard'],
  },

  // ── Capacity Command Centre Data Latency ──────────────────────────────────
  {
    code: 'H3690',
    name: 'TeleTracking Bed Board Showing Stale Occupancy Data',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'TeleTracking bed board is updated by manual entry from unit charge nurses rather than through automated Epic ADT event feeds — nurses update bed status every 1–2 hours during busy periods, creating a data lag where beds cleaned and available are not visible to the capacity command centre for 45–90 minutes; the command centre makes bed assignment decisions based on occupancy data that is systematically 1–2 hours stale, assigning patients to units that are already full while visually-clean beds elsewhere sit unassigned.',
    keywords: ['TeleTracking', 'bed management', 'ADT', 'capacity command centre', 'bed board', 'data latency'],
    demoRelevant: true,
  },
  {
    code: 'H3691',
    name: 'Epic ADT and TeleTracking Not Bidirectionally Integrated',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Epic ADT events (admission, discharge, transfer, bed assignment) do not automatically update TeleTracking bed status — the two systems require manual reconciliation; housekeeping staff receive bed cleaning requests from TeleTracking while Epic shows the bed already clean and available, creating duplicate requests and delays; a bidirectional HL7 ADT feed between Epic and TeleTracking would eliminate manual reconciliation and reduce bed turnaround time by an estimated 25 minutes.',
    keywords: ['TeleTracking', 'Epic', 'ADT', 'bed management', 'HL7', 'capacity command centre'],
  },
  {
    code: 'H3692',
    name: 'Capacity Command Centre Staffed Only During Day Shift',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      'The capacity command centre operates with a dedicated coordinator 07:00–19:00 and relies on the house supervisor overnight — the house supervisor manages all overnight clinical escalations as well as bed management, reducing the cognitive bandwidth available for proactive capacity management; overnight boarding spikes that occur between 22:00–04:00 receive reactive bed management at best and no proactive throughput optimisation, creating the conditions for the worst morning census situations.',
    keywords: ['capacity command centre', 'bed management', 'TeleTracking', 'house supervisor', 'night shift', 'ED boarding'],
  },
  {
    code: 'H3693',
    name: 'Predicted Discharge List Not Generated or Acted Upon',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'Capacity management best practice requires a predicted discharge list (patients likely to discharge in the next 4–6 hours) to be generated each morning by inpatient case managers — no such list is generated at Meridian; the capacity command centre has no visibility into the anticipated bed supply for the next 4–6 hours and cannot match anticipated bed supply to the ED admission queue; the mismatch is resolved reactively by noon when the morning admissions queue has already fully materialised.',
    keywords: ['capacity command centre', 'predicted discharge', 'case management', 'bed management', 'ED boarding', 'patient flow'],
  },
  {
    code: 'H3694',
    name: 'Housekeeping Response Time to Bed Clean Request Not Tracked',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'TeleTracking records the time a bed is placed in "needs cleaning" status and the time it is returned to available, but housekeeping response time (time from request to start of cleaning) is not tracked separately — intervals show total bed turn time of 52 minutes on average without distinguishing the 20-minute housekeeping response lag from the 32-minute cleaning time; targeted housekeeping response improvement could reduce total bed turn time by 38% without requiring any cleaning efficiency improvements.',
    keywords: ['TeleTracking', 'housekeeping', 'bed management', 'bed turnaround', 'capacity command centre', 'ED throughput'],
  },
  {
    code: 'H3695',
    name: 'Bed Management Escalation Thresholds Not Automated',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Capacity management policy defines escalation levels (Green/Yellow/Red/Black) based on census and boarding metrics, but TeleTracking is not configured to automatically escalate and notify the appropriate response team when thresholds are crossed — the capacity coordinator must manually assess the census against the policy and initiate escalation calls; escalation delays of 30–60 minutes are common because the coordinator is simultaneously managing individual bed assignments during surge.',
    keywords: ['capacity command centre', 'TeleTracking', 'escalation', 'bed management', 'ED boarding', 'patient flow'],
  },
  {
    code: 'H3696',
    name: 'Predictive Census Analytics Not Integrated Into Command Centre',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      'Historical census data shows predictable daily and weekly patterns in ED arrivals, admission rates, and discharge volumes — the capacity command centre does not have access to a predictive census model that could forecast 4-hour bed demand; without predictive capability, the command centre is always reacting to current census rather than proactively creating bed supply; a 4-hour predictive model would enable pre-emptive housekeeping scheduling and early discharge rounding that reduces boarding by an estimated 15–20%.',
    keywords: ['capacity command centre', 'predictive analytics', 'census prediction', 'bed management', 'ED throughput', 'patient flow'],
  },
  {
    code: 'H3697',
    name: 'Observation Unit Capacity Not Visible in Command Centre',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'The observation unit functions as an alternative to inpatient admission for low-risk presentations but its real-time capacity is not displayed on the TeleTracking bed board visible to the ED — ED providers and the capacity command centre do not know whether observation beds are available when making admission versus observation decisions; observation unit under-utilisation of 35% during times when the ED boarding queue is at peak suggests a bed supply that is invisible to the demand side.',
    keywords: ['observation admission', 'TeleTracking', 'capacity command centre', 'bed management', 'ED boarding', 'patient flow'],
  },
  {
    code: 'H3698',
    name: 'Command Centre Data Not Actionable Without Closed-Loop Workflows',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'The capacity command centre displays real-time TeleTracking data but interventions (bed pull requests, housekeeping priority escalation, transfer requests) are executed through phone calls rather than through TeleTracking task assignments — the command centre coordinator makes 40–60 phone calls per shift to execute capacity interventions; each phone-based intervention adds 5–8 minutes of cycle time compared to a TeleTracking task-based workflow, representing 3–8 hours of daily process inefficiency.',
    keywords: ['capacity command centre', 'TeleTracking', 'workflow', 'bed management', 'patient flow', 'ED throughput'],
  },
  {
    code: 'H3699',
    name: 'Surge Bed Protocol Activation Delayed by Physician Approval Requirement',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'Activating surge beds (hallway beds, overflow bays, converted conference rooms) requires CMO or designee approval — the approval chain requires 45–75 minutes to reach on nights and weekends when the CMO is not on campus; surge beds that could reduce boarding within 30 minutes of threshold crossing are unavailable during the approval delay; removing the approval requirement and replacing it with an automatic activation protocol at defined TeleTracking thresholds would reduce surge bed activation time to under 10 minutes.',
    keywords: ['capacity management', 'surge bed', 'ED boarding', 'TeleTracking', 'capacity command centre', 'approval workflow'],
  },

];
