// ── Situation Intelligence + AI Office Breakdown Data ────────────────────────
// This is SEPARATE from client-intelligence.ts:
//   - SituationFindings = AbarVa's proprietary diagnosis (what WE found)
//   - AIOffices = functional AI opportunity breakdown (front/middle/back)
//
// Not the client's stated strategy. Not their org chart. Our external view.

export type SeverityLevel = 'critical' | 'high' | 'medium'
export type TimlineRange = '0–6 months' | '6–12 months' | '12–24 months'

export interface SituationFinding {
  num: string
  severity: SeverityLevel
  headline: string       // One bold line
  context: string        // Root cause and context
  cost: string           // Dollar impact
  urgency: string        // Why it matters right now
}

export interface AIUseCase {
  title: string
  what: string           // What the AI does specifically
  metric: string         // Key performance improvement
  value: string          // Annual $ value
  data: string           // Data required to execute
  timeline: TimlineRange
}

export interface AIFunction {
  name: string           // e.g. "Revenue Cycle & Claims Processing"
  narrative: string      // 1–2 sentence context specific to this client
  useCases: AIUseCase[]
}

export interface AIOffice {
  key: 'front' | 'middle' | 'back'
  label: string          // "Front Office"
  sublabel: string       // "Patient & Payer Facing"
  totalValue: string     // "$105M"
  functions: AIFunction[]
}

// ─────────────────────────────────────────────────────────────────────────────
// MERIDIAN HEALTH SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
export const MERIDIAN_SITUATION: SituationFinding[] = [
  {
    num: '01', severity: 'critical',
    headline: 'Revenue cycle is in structural decline — not a blip.',
    context: 'The 18.2% denial rate has increased 2.1 points over the last 18 months, driven by payer algorithm changes and a coding team that lost 14 experienced staff during the pandemic. The trend is worsening, not stabilizing, and the Epic migration will compound it.',
    cost: '$94M annually — accelerating',
    urgency: 'The Epic go-live 90 days out will trigger additional denial spikes (typically 4–8 points in months 3–9 post-conversion). Without an interim RCM stabilization program in place before go-live, this becomes a cash crisis.',
  },
  {
    num: '02', severity: 'critical',
    headline: 'Epic go-live is 40% underresourced and has a 74% failure pattern match.',
    context: 'Integration testing is 60 days behind schedule. The revenue cycle module has 4 of the 11 required staff positions unfilled. CIO Linda Marsh privately estimates a 40% chance of delay. The IT bandwidth is fully consumed — any parallel AI initiative is at risk of being killed as a resource conflict.',
    cost: '$28M in implementation cost at risk; $47M in RCM continuity exposure',
    urgency: 'The 90-day pre-go-live window is the last point at which course correction is possible. After that, all resources are locked to stabilization.',
  },
  {
    num: '03', severity: 'critical',
    headline: "The AI mandate has no foundation — and leadership doesn't know it.",
    context: "CEO Chen has committed publicly to AI at scale. What she doesn't know: there are 3 disconnected AI pilots running with different vendors, no shared data layer, no ML infrastructure, no AI governance framework, and a CIO whose bandwidth is 100% consumed by Epic. AbarVa's AI Readiness Score: 3.1/10.",
    cost: '$3–8M in sunk pilot cost at risk; $220M in unrealized AI value delayed by 18–24 months',
    urgency: "The CEO's credibility at the JPMorgan Healthcare Conference (January 2027) depends on having a real AI story. That requires foundation work starting now.",
  },
  {
    num: '04', severity: 'high',
    headline: 'Nurse turnover is a self-perpetuating crisis, not a market condition.',
    context: '19% annual nursing turnover has been attributed to "the market" — but the data shows 67% of departures cite scheduling unpredictability and staffing ratios as primary factors. These are operationally solvable with AI-driven scheduling and predictive workforce management. The current approach treats the symptom (agency spend) not the cause.',
    cost: '$340M agency spend; $140M above peer benchmark',
    urgency: 'Agency contracts renew quarterly. The Q3 renewal cycle is the leverage point to begin reducing dependency before the cost compounds further.',
  },
  {
    num: '05', severity: 'high',
    headline: 'Value-based care targets are 2 years behind plan with no data infrastructure.',
    context: 'The 40% VBC target by 2027 requires outcome tracking, patient attribution, and quality measurement infrastructure that does not exist today. No data warehouse. No patient attribution engine. No SDOH data integration. CMS shared savings qualification requires an 18-month data submission history — which means the window to start is now.',
    cost: '$120M in CMS shared savings at risk by 2027',
    urgency: 'The CMS application cycle for MSSP contracts opens in April 2026. Missing this cycle means a 12-month delay and forfeiting the first year of shared savings.',
  },
]

export const MERIDIAN_AI_OFFICES: AIOffice[] = [
  {
    key: 'front',
    label: 'Front Office',
    sublabel: 'Patient Experience, Access & Financial Journey',
    totalValue: '$105M',
    functions: [
      {
        name: 'Patient Experience & Engagement',
        narrative: 'Meridian has 2.1M annual encounters and an 18% no-show rate — leaving $12M in recoverable appointment revenue on the table. AI converts patient data into proactive, personalized engagement at a scale no human team can match.',
        useCases: [
          {
            title: 'Intelligent Appointment Outreach',
            what: 'Predicts individual no-show probability using 14 behavioral signals (time-to-appointment, historical patterns, transport flags). Sends personalized multi-channel reminders timed to each patient\'s response pattern. Auto-fills canceled slots from waitlist within 4 hours.',
            metric: 'No-show rate: 18% → 8%. Slot utilization: 71% → 86%.',
            value: '$12M/yr', data: 'Scheduling history, patient contact preferences, ZIP code transport data', timeline: '0–6 months',
          },
          {
            title: 'Predictive Patient Satisfaction Alerts',
            what: 'ML model identifies patients likely to report poor experience based on wait time, care team changes, and discharge communication gaps — triggering care team intervention before the encounter ends. Flags nurses and case managers 2 hours before discharge.',
            metric: 'HCAHPS overall satisfaction: +8 points. VBC quality bonus: $4M/yr.',
            value: '$4M/yr', data: 'Real-time EHR care events, historical HCAHPS scores, staff assignment data', timeline: '6–12 months',
          },
          {
            title: 'Multilingual Patient Communication AI',
            what: 'Real-time translation of discharge instructions, medication guides, and follow-up protocols into 38 languages. Confirms patient comprehension through AI-generated teach-back questions. Sends follow-up in patient\'s language.',
            metric: '30-day readmission (non-English primary): -24%. Regulatory compliance: full LEP compliance.',
            value: '$6M/yr', data: 'Patient language preference, EHR discharge instructions, medication database', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Access to Care',
        narrative: 'Prior authorization and referral management consume 40% of Meridian\'s front-office staff time — and the $34M referral leak has never been systematically measured. AI closes both gaps simultaneously.',
        useCases: [
          {
            title: 'Prior Authorization AI',
            what: 'Reads clinical notes, pulls payer PA criteria in real time, and auto-approves 60% of requests at point of order. Routes complex cases to human reviewers with a pre-built clinical rationale package. Tracks approval status and auto-appeals on denial.',
            metric: 'PA cycle time: 14 days → 1.5 days. Auto-approval rate: 60%. Physician admin time: –3.2 hrs/week.',
            value: '$18M/yr', data: 'EHR clinical notes, payer PA criteria feeds, CPT/ICD codes, denial history', timeline: '6–12 months',
          },
          {
            title: 'Referral Capture Intelligence',
            what: 'Real-time matching engine detects when a patient is referred outside the Meridian network while in-network specialist capacity exists within the patient\'s travel threshold. Alerts the ordering provider with in-network alternatives and available slots. Measures leakage by specialty and facility.',
            metric: 'In-network referral capture: 58% → 74%. Annual revenue recovered: $34M.',
            value: '$34M/yr', data: 'Referral logs, specialist availability feeds, patient insurance and geography, claims for out-of-network utilization', timeline: '6–12 months',
          },
          {
            title: 'Virtual Care Triage AI',
            what: 'AI assesses patient-reported symptoms against acuity models and routes contacts to the appropriate level of care — virtual visit, urgent care, or ED — with automated booking. Reduces ED overcrowding driven by non-emergency contacts.',
            metric: 'Avoidable ED visits: –22%. Virtual care utilization: +34%. ED per-visit cost avoided: $1,800.',
            value: '$14M/yr', data: 'Symptom intake data, acuity classification models, real-time virtual/UC capacity', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Patient Financial Experience',
        narrative: "34% of patients who qualify for Meridian's financial assistance programs are never screened. The self-pay collection rate is 24% — well below the 38% achievable with AI-optimized payment approaches.",
        useCases: [
          {
            title: 'Financial Assistance Auto-Screening',
            what: 'AI screens every patient at registration against federal and state assistance eligibility criteria using demographic and insurance data. Flags eligible patients to financial counselors with pre-populated application. Eliminates the "did you ask?" gap in coverage.',
            metric: 'Screening coverage: 34% → 78%. Charity care optimization: $4M reduction in uncompensated care write-offs.',
            value: '$8M/yr', data: 'Patient demographics, insurance data, income proxy indicators, assistance program criteria', timeline: '0–6 months',
          },
          {
            title: 'Payment Optimization AI',
            what: 'Calibrates payment plan terms to each patient\'s estimated ability to pay using income proxy data. Sends AI-personalized payment outreach at the optimal time and channel. Predicts payment default probability and escalates proactively.',
            metric: 'Self-pay collection rate: 24% → 38%. Default prediction accuracy: 84%.',
            value: '$9M/yr', data: 'Patient financial history, income proxy data, prior payment behavior, contact history', timeline: '6–12 months',
          },
        ],
      },
    ],
  },

  {
    key: 'middle',
    label: 'Middle Office',
    sublabel: 'Clinical Quality, Care Management & Hospital Operations',
    totalValue: '$91M',
    functions: [
      {
        name: 'Clinical Quality & Decision Support',
        narrative: "Meridian's protocol adherence rate of 67% is 21 points below the 88% benchmark for health systems of its complexity. The gap costs lives and dollars — and it's invisible until a retrospective audit surfaces it months later. AI makes it visible in real time.",
        useCases: [
          {
            title: 'Sepsis Early Detection AI',
            what: 'Continuously monitors vital signs, lab results, and nursing assessments across all inpatient beds. Identifies sepsis signatures 6 hours earlier than traditional SIRS criteria. Alerts rapid response team with severity score and recommended protocol.',
            metric: 'Sepsis mortality rate: –18%. Average LOS for sepsis cases: –1.4 days. Malpractice exposure: –$12M.',
            value: '$24M/yr', data: 'Real-time EHR vitals, lab feeds, nursing documentation, prior sepsis case outcomes', timeline: '6–12 months',
          },
          {
            title: 'Clinical Protocol Adherence Engine',
            what: 'Maps every care decision against 180 evidence-based clinical protocols in real time. Flags deviations at the moment of ordering — not in a monthly report. Tracks adherence by unit, provider, and diagnosis. Generates automatic regulatory reporting for CMS Core Measures.',
            metric: 'Protocol adherence: 67% → 91%. 30-day readmission rate: –2.4 points. CMS Core Measure penalties: eliminated.',
            value: '$12M/yr', data: 'EHR order data, clinical protocols library, CMS measure specifications, historical readmission data', timeline: '6–12 months',
          },
          {
            title: 'Diagnostic Support AI (Radiology & Pathology)',
            what: 'Provides AI second reads for radiology studies and flags critical pathology findings during after-hours and high-volume windows when radiologist attention is most stretched. Prioritizes worklist based on acuity. Reduces time to critical finding communication.',
            metric: 'Diagnostic error rate (after-hours): –14%. Critical finding communication time: 4.2 hrs → 38 min.',
            value: '$8M/yr', data: 'DICOM imaging data, radiology reports, pathology slides (digital), radiologist feedback data', timeline: '12–24 months',
          },
        ],
      },
      {
        name: 'Care Management & Coordination',
        narrative: '41% of high-risk patients in Meridian\'s care management registry have an active care plan — the benchmark is 78%. The 37-point gap translates directly to avoidable ED visits and readmissions. AI doesn\'t replace care managers; it triples what each one can see.',
        useCases: [
          {
            title: 'Real-Time Risk Stratification',
            what: 'Updates individual patient risk scores daily across the full 28,000-patient care management registry using claims, EHR, pharmacy, and SDOH data. Surfaces the 200 highest-risk patients each morning to care coordinators with specific recommended interventions. Eliminates the manual case review backlog.',
            metric: 'Patients with active care plan: 41% → 78%. Care manager caseload capacity: +60% without headcount add.',
            value: '$22M/yr', data: 'Claims history, EHR problem lists, medication data, lab values, SDOH flags, prior ED/IP utilization', timeline: '6–12 months',
          },
          {
            title: 'Readmission Prevention AI',
            what: 'Predicts 30-day readmission probability at discharge using 34 clinical and social variables. Triggers automated care coordinator outreach 48 hours post-discharge. Generates personalized follow-up protocol including medication reconciliation check, PCP appointment booking, and telehealth touchpoint.',
            metric: '30-day readmission rate: 14.2% → 10.8%. Avoided readmissions: ~420/yr. CMS penalty avoidance.',
            value: '$18M/yr', data: 'Discharge data, readmission history, post-discharge contact records, pharmacy fills, PCP appointment data', timeline: '6–12 months',
          },
          {
            title: 'Transitions of Care Intelligence',
            what: 'Generates structured transition records at every care setting change — hospital to SNF, SNF to home, ED to observation. AI synthesizes the relevant clinical history, active issues, medication changes, and follow-up requirements into a single coordinated communication to the receiving care team.',
            metric: 'SNF-to-hospital readmission: –31%. Adverse drug events at transition: –28%.',
            value: '$8M/yr', data: 'Admission/discharge/transfer data, medication reconciliation records, SNF and PCP referral network', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Hospital Operations & Capacity',
        narrative: 'Meridian\'s 47-facility census fluctuation costs $28M in mismatched staffing annually. The current process is reactive: staff are called in after volume spikes, not scheduled to meet predicted demand. AI converts operations from reactive to predictive.',
        useCases: [
          {
            title: 'Census Demand Forecasting',
            what: 'Predicts unit-level patient census 72 hours ahead using historical patterns, weather, seasonal models, and local event data. Drives proactive staffing decisions before agency calls become necessary. Integrates with the scheduling system to auto-populate shifts.',
            metric: 'Agency utilization: –35%. Scheduling accuracy: 61% → 89%. Overtime hours: –22%.',
            value: '$18M/yr', data: 'Historical census by unit, weather APIs, staff scheduling records, community event calendar, agency usage logs', timeline: '6–12 months',
          },
          {
            title: 'OR Schedule Optimization',
            what: 'AI models surgical case volume, OR room turnover time, and staff availability to build optimal OR schedules that maximize utilization while protecting time for add-ons. Dynamically reoptimizes the schedule when cases add, cancel, or run long.',
            metric: 'OR utilization: 68% → 84%. OR overtime hours: –34%. Surgeon satisfaction: +11 points.',
            value: '$9M/yr', data: 'OR scheduling data, case duration history, surgeon preference cards, staff certification data', timeline: '6–12 months',
          },
          {
            title: 'ED Throughput Intelligence',
            what: 'Predicts ED surge 4 hours ahead using incoming ambulance data, season models, and local events. Alerts charge nurse with recommended bed allocation, diversion risk probability, and staffing adjustments. Surfaces real-time patient flow bottlenecks.',
            metric: 'Door-to-provider time: –31%. LWBS rate: 4.2% → 1.8%. Avoidable diversion hours: –44%.',
            value: '$7M/yr', data: 'Real-time ED arrivals, ambulance dispatch feeds, boarding census, historical surge patterns', timeline: '0–6 months',
          },
        ],
      },
      {
        name: 'Clinical Documentation',
        narrative: '1,200 Meridian physicians each spend 45 minutes per day on documentation. That\'s 9,000 physician-hours daily — equivalent to 180 FTE — consumed by tasks that AI can handle in real time at the point of care.',
        useCases: [
          {
            title: 'Ambient AI Documentation',
            what: 'Microphone captures the physician-patient conversation with patient consent. AI generates a structured SOAP note in real time, presented to the physician for 30-second review and one-click signature. Integrates natively with the Epic workflow post-go-live.',
            metric: 'Documentation time: 45 min → 12 min per physician per day. 660 physician-hours/day recovered. Physician burnout score: –18 points.',
            value: '$42M/yr', data: 'Audio input (consented), Epic workflow API, physician specialty templates, historical note patterns', timeline: '6–12 months',
          },
          {
            title: 'Clinical Documentation Improvement (CDI) AI',
            what: 'AI reviews clinical documentation at point of care and surfaces specificity improvement suggestions in real time — before the note is signed. Eliminates the retrospective CDI query process that currently accounts for 38% of coding team workload.',
            metric: 'Case Mix Index: +0.08. Annual coding queries: –38%. Revenue impact from CMI improvement: $12M/yr.',
            value: '$12M/yr', data: 'Draft clinical notes, ICD-10 specificity rules, historical CMI by DRG, query resolution patterns', timeline: '6–12 months',
          },
          {
            title: 'AI-Assisted Coding',
            what: 'AI reads completed clinical documentation and suggests ICD-10-CM/PCS and CPT codes with confidence scores. Routes low-confidence cases to experienced coders. Learns from coder corrections to improve accuracy continuously.',
            metric: 'Coding accuracy: +12%. First-pass rate: 72% → 91%. Coder productivity: +28%.',
            value: '$4M/yr', data: 'Completed clinical notes, historical coding patterns, payer acceptance rates, CDI query outcomes', timeline: '0–6 months',
          },
        ],
      },
    ],
  },

  {
    key: 'back',
    label: 'Back Office',
    sublabel: 'Revenue Cycle, Supply Chain, Finance, HR & IT',
    totalValue: '$81M',
    functions: [
      {
        name: 'Revenue Cycle & Claims Processing',
        narrative: 'The 18.2% denial rate is the single largest financial problem in the organization — and it\'s made worse by a manual appeals process that overturns only 34% of appealable denials. AI attacks every point in the claims lifecycle.',
        useCases: [
          {
            title: 'Pre-Submission Denial Prevention',
            what: 'Scores every claim for denial probability before submission using 40+ features including coding accuracy, authorization status, payer history, and clinical documentation completeness. Flags high-risk claims for human review and auto-corrects common triggers. Routes clean claims to accelerated submission tracks.',
            metric: 'Denial rate: 18.2% → 11.4%. First-pass acceptance: 72% → 89%. Cash collections: +$47M/yr.',
            value: '$47M/yr', data: 'Claims history, denial reason codes, payer contract rules, coding edits library, clinical documentation', timeline: '0–6 months',
          },
          {
            title: 'Automated Denial Appeal Engine',
            what: 'When denials occur, AI generates medical necessity appeal letters citing specific payer criteria, attaches supporting clinical documentation extracted from the EHR, and routes to the appropriate payer contact. Tracks appeal status and escalates aged appeals automatically.',
            metric: 'Appeal overturn rate: 34% → 62%. Appeal response time: 9 days → 2 days. Additional annual recovery: $9M.',
            value: '$9M/yr', data: 'Denial reason codes, payer appeal requirements, clinical notes, prior successful appeal patterns', timeline: '6–12 months',
          },
          {
            title: 'Payer Underpayment Detection',
            what: 'AI audits every payer remittance against Meridian\'s contracted rates, identifying systematic underpayments, incorrect adjustments, and payment timing violations. Generates dispute packages with contract evidence and submits to payer relations.',
            metric: 'Underpayment identification coverage: 100% vs current 8% sampled. Annual underpayment recovery: $6M.',
            value: '$6M/yr', data: 'Payer contract rates, remittance data, EOB feeds, historical underpayment patterns', timeline: '6–12 months',
          },
          {
            title: 'Real-Time Eligibility Verification',
            what: 'Eligibility checked at scheduling, admission, and day-of-service automatically against 200+ payer systems. Flags coverage gaps and coordinates benefits in real time. Reduces day-of-service eligibility surprises by 94%.',
            metric: 'Eligibility-related denials: –68%. Point-of-service collection improvement: $4M/yr.',
            value: '$4M/yr', data: 'Patient insurance data, payer eligibility APIs, scheduling and admission records', timeline: '0–6 months',
          },
        ],
      },
      {
        name: 'Supply Chain & Procurement',
        narrative: 'Meridian spends $180M annually on clinical supplies across 47 facilities. AI-driven demand forecasting and contract compliance monitoring can recover $22M with data that already exists in the procurement system.',
        useCases: [
          {
            title: 'Clinical Supply Demand Forecasting',
            what: 'AI predicts supply consumption by facility, procedure type, and department using census forecasts, procedure scheduling data, and historical consumption patterns. Automatically adjusts par levels and reorder points. Reduces emergency orders (which carry 40% price premiums) by 78%.',
            metric: 'Stockout events: –44%. Emergency order spend: –78%. Expired inventory write-offs: –$4.2M/yr.',
            value: '$8M/yr', data: 'Procurement data, procedure schedules, historical consumption by facility, vendor lead times', timeline: '6–12 months',
          },
          {
            title: 'Contract Compliance & Price Monitoring',
            what: 'AI monitors every purchase order against contracted prices in real time, flagging non-contract purchases before approval and retrospectively auditing invoices for overcharges. Generates vendor performance dashboards and renegotiation intelligence.',
            metric: 'Non-contract purchase rate: –23%. Price overcharge recovery: $3.8M/yr. Buyer time on compliance: –60%.',
            value: '$6M/yr', data: 'Contract pricing database, PO data, invoice feeds, historical vendor compliance', timeline: '0–6 months',
          },
          {
            title: 'Vendor Risk Intelligence',
            what: 'Continuously monitors the financial health, supply chain stability, and regulatory standing of Meridian\'s top 200 suppliers. Alerts procurement 90 days before likely supply disruption, enabling alternative sourcing before the crisis.',
            metric: 'Supply disruption events: –34%. Emergency alternative sourcing cost premium: –$4M/yr.',
            value: '$4M/yr', data: 'Supplier financial data APIs, shipping/logistics feeds, news monitoring, historical disruption patterns', timeline: '12–24 months',
          },
        ],
      },
      {
        name: 'Finance & Accounting',
        narrative: 'Meridian\'s finance close takes 8 days — twice the best-in-class 4-day target. With a 1.2% operating margin, every day of delayed close is a day of reduced visibility into a margin that cannot afford surprises.',
        useCases: [
          {
            title: 'Month-End Close Automation',
            what: 'AI handles reconciliation of high-volume, low-complexity accounts automatically — intercompany transactions, prepaid accounts, accruals — presenting exceptions for human review. Generates the close checklist dynamically based on open items.',
            metric: 'Close cycle: 8 days → 4 days. Manual reconciliation volume: –68%. Finance staff overtime: –40%.',
            value: '$3M/yr', data: 'GL transactions, prior period reconciliations, intercompany agreements, accrual schedules', timeline: '6–12 months',
          },
          {
            title: 'Real-Time Budget Variance Intelligence',
            what: 'Continuous monitoring against operating budget with natural-language explanation of variances. Distinguishes volume-driven from rate-driven variances. Alerts department heads with recommended actions when variances exceed thresholds.',
            metric: 'Time to variance identification: 30 days → 3 days. CFO management time on variance explanation: –60%.',
            value: '$2M/yr', data: 'GL actuals, operating budget, prior period actuals, volume data by department', timeline: '0–6 months',
          },
        ],
      },
      {
        name: 'HR & Workforce Management',
        narrative: '19% nursing turnover is not a market problem — it is a scheduling and retention problem. 67% of departing nurses cite scheduling unpredictability as a primary factor. AI-driven scheduling addresses the cause, not just the cost.',
        useCases: [
          {
            title: 'AI-Driven Workforce Scheduling',
            what: 'Demand-driven staffing model predicts census by unit 72 hours ahead and builds schedules that match patient volume. Integrates with the staffing pool to fill open shifts from part-time and per-diem staff before calling agencies. Respects nurse preferences and work-life balance constraints.',
            metric: 'Agency hours: –35%. Overtime: –22%. Schedule-related turnover: –30%. Net annual saving: $58M.',
            value: '$58M/yr', data: 'Historical census by unit, staff schedules, nurse preferences, agency rate data, union contract rules', timeline: '6–12 months',
          },
          {
            title: 'Nurse Retention Prediction',
            what: 'Predictive model monitors 18 behavioral signals (schedule change requests, missed shifts, engagement survey dips, tenure, market wage gap) to predict individual nurse departure probability 90 days in advance. Triggers targeted manager interventions — schedule adjustment, career conversation, recognition.',
            metric: 'Turnover rate: 19% → 13%. Retained nurses: ~1,680/yr at $8K average replacement cost. Net: $12M/yr.',
            value: '$12M/yr', data: 'HRIS, scheduling patterns, engagement survey data, market wage benchmarks, manager feedback records', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'IT & Infrastructure',
        narrative: "The Epic go-live creates a new IT risk profile for Meridian. Ransomware attacks on health systems increased 89% in 2025. AI-driven security and AIOps are table stakes for the post-Epic environment — not optional investments.",
        useCases: [
          {
            title: 'AIOps — Predictive Incident Management',
            what: 'AI monitors infrastructure telemetry and predicts service degradation 4 hours before user impact. Auto-remediates Tier 1-2 incidents (disk full, memory leak, failed jobs) without human intervention. Routes complex incidents with pre-built root cause analysis.',
            metric: 'Mean time to resolution: 4 hrs → 22 min. Advisor/clinician-impacting incidents: –64%. IT ops cost: –22%.',
            value: '$4M/yr', data: 'Infrastructure monitoring data, incident history, runbook database, application topology maps', timeline: '6–12 months',
          },
          {
            title: 'Healthcare Security AI (Ransomware Prevention)',
            what: 'Behavioral AI monitors network traffic and user activity for anomalies consistent with ransomware propagation, credential theft, and data exfiltration. Isolates affected systems within seconds — not hours — containing blast radius before clinical operations are disrupted.',
            metric: 'Threat containment time: 6 hrs → 90 sec. Ransomware blast radius: –94%. Cyber insurance premium: –18%.',
            value: '$6M/yr', data: 'Network flow data, endpoint telemetry, user behavior baselines, threat intelligence feeds', timeline: '6–12 months',
          },
          {
            title: 'Epic Post-Go-Live Optimization AI',
            what: 'AI analyzes Epic usage patterns across 47 facilities to identify underutilized modules, suboptimal configurations, and workflow deviations from Epic best practice. Generates targeted optimization recommendations that improve ROI on the Epic investment.',
            metric: 'Epic feature utilization: +34%. Physician Epic-related frustration score: –28%. IT support tickets: –22%.',
            value: '$4M/yr', data: 'Epic usage logs, feature activation data, workflow timing data, peer health system Epic benchmarks', timeline: '12–24 months',
          },
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ARCTURUS FINANCIAL GROUP
// ─────────────────────────────────────────────────────────────────────────────
export const ARCTURUS_SITUATION: SituationFinding[] = [
  {
    num: '01', severity: 'critical',
    headline: 'AUM growth is net negative when adjusted for churn.',
    context: 'The $800M in new AUM reported for 2025 looks strong — until you net out the $588M in AUM churn from departing clients. Real net AUM growth was $212M (2.5% of base). At the current trend, Arcturus will begin shrinking in absolute AUM by 2027 as the departing client cohort outpaces new wins.',
    cost: '$588M in annual AUM churn at 72bps = $4.2M in recurring fee revenue lost annually',
    urgency: 'Three senior advisors managing a combined $840M in AUM are in the market for new opportunities. If they depart in the next 12 months, half of 2025 new AUM growth is erased.',
  },
  {
    num: '02', severity: 'critical',
    headline: 'The technology stack cannot support AI deployment in any reasonable timeframe without a fundamental integration layer.',
    context: "CTO Okafor told the board that AI deployment is '90 days away.' It isn't. Three legacy systems (Advent, Salesforce Classic, Actimize) have no shared API layer and no real-time data integration. Any AI deployment requires 18–24 months of integration work first — unless a middleware layer is built concurrently.",
    cost: '$180M in modeled AI value delayed 18–24 months',
    urgency: 'Morgan Stanley and Merrill Lynch advisor AI is already in advisors\' hands. Every quarter of delay compounds the productivity gap.',
  },
  {
    num: '03', severity: 'high',
    headline: 'The RFP has been running for 9 months and is selecting on the wrong criteria.',
    context: 'Six technology vendors are competing on feature lists — not on integration architecture, data model compatibility, or AI readiness. The selection criteria were written before the AI mandate was formalized. The winning vendor will require $12M+ in integration work that is not currently budgeted.',
    cost: '$12M unbudgeted integration exposure; 18-month delay to productive deployment',
    urgency: 'The RFP decision is due in 60 days. Stopping to reassess the criteria is the right call — but requires executive air cover.',
  },
  {
    num: '04', severity: 'high',
    headline: 'Compliance monitoring covers 12% of advisor communications — and the SEC exam cycle starts in Q3 2026.',
    context: 'Manual compliance sampling covers 12% of advisor emails and call recordings. A systematic cherry-picking or suitability violation would be undetected by the current process. The SEC exam cycle begins Q3 2026 — and Arcturus\' growth trajectory means it will be scrutinized at a larger-firm level for the first time.',
    cost: 'Enforcement risk: $5–50M in fines for undiscovered violations; reputational damage is unquantifiable',
    urgency: 'SEC exams take 90 days to complete. Deploying AI surveillance now gives 6 months of audit trail before exam day.',
  },
  {
    num: '05', severity: 'high',
    headline: 'Fee compression is accelerating — and the cost structure cannot absorb it.',
    context: 'Average advisory fee is declining toward the 55bps industry floor while the 71% C/I ratio leaves no room for margin erosion. Arcturus cannot compete on price without a fundamental cost structure improvement. Without AI-driven operational efficiency, the path to 58% C/I ratio requires headcount reduction — which conflicts with the growth mandate.',
    cost: '$840M efficiency gap between 71% and 58% C/I ratio benchmark',
    urgency: 'Two institutional clients representing $1.1B in AUM have issued RFPs citing fee competitiveness. Decision expected in 90 days.',
  },
]

export const ARCTURUS_AI_OFFICES: AIOffice[] = [
  {
    key: 'front',
    label: 'Front Office',
    sublabel: 'Client Experience, Advisor Productivity & New Business',
    totalValue: '$90M',
    functions: [
      {
        name: 'Advisor Intelligence & Productivity',
        narrative: 'The average Arcturus advisor spends 64% of their time on tasks AI can accelerate or automate — leaving 36% for the relationship work that actually retains clients and wins new AUM. Advisor AI converts that ratio.',
        useCases: [
          {
            title: 'Advisor Intelligence Co-Pilot',
            what: 'Before every client meeting, AI synthesizes portfolio performance, life events, market movements, competitor actions, and behavioral signals into a 3-minute briefing. Generates personalized talking points and surfaces the top 3 recommended actions for each client.',
            metric: 'Meeting prep time: 45 min → 8 min. Client interactions per advisor/week: +3.2. AUM growth rate per advisor: +28%.',
            value: '$42M/yr', data: 'CRM data, portfolio management system, market data feeds, client communication history', timeline: '6–12 months',
          },
          {
            title: 'AI Portfolio Narrative Generation',
            what: 'Quarterly and monthly reports are AI-generated from portfolio data — personalized by client risk profile, life stage, tax situation, and stated goals. Delivered as PDF, email summary, or voice briefing. Advisor reviews and approves in 90 seconds.',
            metric: 'Report generation: 4 hrs → 6 min per client. Client portal engagement with reports: +340%.',
            value: '$12M/yr', data: 'Portfolio management system, market data, client profile and stated goals, performance history', timeline: '0–6 months',
          },
          {
            title: 'Prospect Intelligence Engine',
            what: 'AI identifies high-probability prospects from public signals — liquidity events (M&A, IPO), RSU vesting schedules, business sale filings, inheritance triggers. Routes to advisor with briefing and AI-drafted personalized outreach message.',
            metric: 'Prospect identification: 3× increase. Close rate on AI-identified vs. cold outreach: 34% vs. 18%.',
            value: '$22M/yr', data: 'Public financial records, LinkedIn signals, business registration filings, internal CRM for de-duplication', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Client Retention & Experience',
        narrative: "87% client retention vs. a 94% peer benchmark means $588M in AUM churn annually above benchmark. AI monitors 47 behavioral signals to identify departing clients 60 days before they call to resign.",
        useCases: [
          {
            title: 'Proactive Client Churn Prediction',
            what: 'ML model monitors engagement frequency, portal activity, complaint history, advisor changes, life events, and market drawdown impact to predict departure probability per client 60 days in advance. Alerts advisor with recommended intervention playbook.',
            metric: 'Client churn: 13% → 8%. Retained AUM from at-risk clients: $280M annually. Fee revenue protected: $2M/yr.',
            value: '$18M/yr', data: 'CRM engagement data, portal login frequency, NPS scores, communication sentiment analysis', timeline: '6–12 months',
          },
          {
            title: 'Digital Client Portal with Proactive Push Intelligence',
            what: 'Instead of a pull-only portal requiring clients to log in, AI pushes personalized alerts — performance anomalies, tax opportunities, rebalancing events, market commentary — to clients before they ask. 24/7 AI assistant handles routine inquiries.',
            metric: 'Monthly active portal users: 12% → 58%. Advisor call volume on routine questions: –34%.',
            value: '$8M/yr', data: 'Portfolio data, client preferences, market data, tax lot information', timeline: '6–12 months',
          },
        ],
      },
    ],
  },
  {
    key: 'middle',
    label: 'Middle Office',
    sublabel: 'Investment Operations, Compliance & Risk',
    totalValue: '$52M',
    functions: [
      {
        name: 'Compliance & Regulatory Surveillance',
        narrative: '12% of advisor communications are currently monitored for compliance violations. A full AI surveillance deployment covers 100% — turning compliance from a sampling exercise into a real-time control system before the SEC exam.',
        useCases: [
          {
            title: 'Real-Time AI Compliance Surveillance',
            what: 'NLP monitors all advisor emails, chat, and call transcripts for suitability violations, cherry-picking patterns, outside business activity, and material non-public information risks. Flags for CCO review within minutes with evidence package and regulatory citation.',
            metric: 'Coverage: 12% → 100% of communications. False positive rate: –64%. CCO review time per alert: –72%.',
            value: '$18M/yr', data: 'Email archive, recorded calls, chat logs, CRM, trade blotter, client accounts', timeline: '0–6 months',
          },
          {
            title: 'Regulatory Filing Automation',
            what: 'AI extracts required data from source systems and populates Form ADV, 13F, Form CRS, and other regulatory filings automatically. Flags discrepancies for CCO review and maintains a complete audit trail of data sources.',
            metric: 'Filing preparation time: –72%. Compliance staff hours on filings: –180 hrs/quarter. Error rate: near zero.',
            value: '$4M/yr', data: 'Portfolio data, ownership records, fee billing system, prior filings, regulatory requirement library', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Investment Operations',
        narrative: 'Portfolio construction is inconsistent across 180 advisors — the same investment philosophy is being applied differently to similar client profiles. AI enforces consistency while freeing advisors from mechanical portfolio management tasks.',
        useCases: [
          {
            title: 'Portfolio Construction & Drift Monitoring',
            what: 'AI applies the firm investment philosophy consistently across all 180 advisors. Daily drift detection surfaces accounts that have moved outside model parameters, with one-click rebalance recommendations that incorporate tax impact.',
            metric: 'Portfolio consistency score: 52% → 94%. Tax alpha per account: +$4,200/yr. Model adherence violations flagged: 100%.',
            value: '$22M/yr', data: 'Portfolio management system, model portfolios, tax lot data, client restriction profiles', timeline: '6–12 months',
          },
          {
            title: 'Trade Reconciliation AI',
            what: 'AI matches and resolves trade breaks across custodians automatically, learning from historical resolution patterns to auto-resolve 85% of breaks without human intervention. Escalates novel break types with suggested resolution.',
            metric: 'Break resolution time: 3 days → 4 hrs. Unresolved breaks: –88%. Operations staff on reconciliation: –8 FTE.',
            value: '$8M/yr', data: 'Custodian feeds, internal blotter, historical break resolution data, counterparty standing instructions', timeline: '0–6 months',
          },
        ],
      },
    ],
  },
  {
    key: 'back',
    label: 'Back Office',
    sublabel: 'Operations, Finance & Technology',
    totalValue: '$38M',
    functions: [
      {
        name: 'Client Onboarding & Service Operations',
        narrative: '6-week onboarding is a client experience failure and a competitive liability. Digital-native RIAs onboard in 4 days. AI compresses the process without losing the white-glove feel.',
        useCases: [
          {
            title: 'Intelligent Client Onboarding',
            what: 'AI guides clients through KYC, investment profile, and account documentation with pre-population, real-time validation, and exception flagging. Eliminates the 34% NIGO (Not In Good Order) rate that extends the current 6-week timeline.',
            metric: 'Onboarding time: 6 weeks → 4 days. NIGO rate: 34% → 4%. Advisor time on onboarding: –80%.',
            value: '$8M/yr', data: 'KYC requirements, identity verification APIs, account opening forms, document management', timeline: '0–6 months',
          },
          {
            title: 'Fee Billing Audit AI',
            what: 'AI audits every quarterly fee calculation against the client fee schedule, AUM snapshot, and billing tier. Catches errors before statements are sent. Generates real-time fee revenue forecast for finance planning.',
            metric: 'Billing errors caught: 100% vs. current 60% sampled. Error-related refunds: –$1.8M/yr.',
            value: '$4M/yr', data: 'Fee schedules, portfolio management AUM snapshots, billing system, client agreements', timeline: '0–6 months',
          },
        ],
      },
      {
        name: 'Vendor & Technology Optimization',
        narrative: '$45M in annual vendor spend across 68 vendors with no systematic performance management or price benchmarking. AI provides the intelligence layer that the vendor management team lacks the bandwidth to build manually.',
        useCases: [
          {
            title: 'Vendor Spend Optimization',
            what: 'AI analyzes all vendor contracts and spend against market pricing benchmarks, identifying overpayment, duplicate capabilities, and renegotiation opportunities. Scores each vendor on performance, cost, and strategic fit.',
            metric: 'Vendor cost reduction: 14% ($6.3M). Duplicate capability contracts eliminated: 9.',
            value: '$10M/yr', data: 'Vendor contracts, AP data, market pricing benchmarks, vendor performance data', timeline: '6–12 months',
          },
          {
            title: 'IT Operations AI (AIOps)',
            what: 'AI monitors advisor-facing systems, predicts degradation before it impacts client interactions, and auto-remediates common incidents. Reduces the 4-hour mean time to resolution that currently disrupts advisor workflows.',
            metric: 'Advisor-impacting system downtime: –68%. IT ops FTE efficiency: +40%.',
            value: '$4M/yr', data: 'Infrastructure monitoring, incident history, application topology, runbook database', timeline: '12–24 months',
          },
          {
            title: 'Finance Close Automation',
            what: 'AI automates high-volume, low-judgment reconciliations and generates the management reporting package from source systems directly. Compresses the monthly close from 5 days to 2 days.',
            metric: 'Close cycle: 5 days → 2 days. Finance overtime: –44%.',
            value: '$3M/yr', data: 'GL transactions, custodian statements, prior period reconciliations', timeline: '6–12 months',
          },
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// APEX RETAIL GROUP
// ─────────────────────────────────────────────────────────────────────────────
export const APEX_SITUATION: SituationFinding[] = [
  {
    num: '01', severity: 'critical',
    headline: 'eCommerce is growing in percentage terms while losing ground in absolute dollar gap to peers.',
    context: '22% YoY eCommerce growth sounds strong — until benchmarked against a peer median that grew 28% on a 32% revenue base. Apex is widening its digital revenue gap in absolute dollars. The stated goal of 30% digital revenue share by 2027 requires 4× the current growth rate.',
    cost: '$392M digital revenue gap vs. peer benchmark; widening by $40M per quarter',
    urgency: 'The re-platforming project is 4 months behind. Every month of delay is $6.5M in digital revenue that compounds into 2027.',
  },
  {
    num: '02', severity: 'critical',
    headline: "Demand forecasting accuracy is overstated by 21 points — and $180M in markdowns prove it.",
    context: "The 82% accuracy figure is measured at the category level. SKU-store-week accuracy — the level that actually drives inventory decisions — is 61%. The category-level metric makes the forecasting team look on-target while $180M in annual markdowns accumulate from the undetected SKU-level variance.",
    cost: '$180M in annual markdowns; 3 stockout events in 2025 costed $42M in lost sales',
    urgency: 'The Q4 2026 holiday season is the highest-stakes demand forecasting window. The AI solution needs to be in production 6 months before — which means a start date of Q2 2026.',
  },
  {
    num: '03', severity: 'high',
    headline: "22 million loyalty members are being counted — but 66% have never made a second purchase.",
    context: 'The loyalty database has 22M registered members. A cohort analysis shows 14.5M are single-purchase dormant accounts. True active members are 7.5M — generating all of the loyalty revenue. The marketing team is optimizing campaigns against the wrong audience definition.',
    cost: '$120M in addressable loyalty revenue being left on the table from recoverable dormant members',
    urgency: 'The CMO is presenting the loyalty program as a competitive moat in the investor day deck. The 22M number will be challenged.',
  },
  {
    num: '04', severity: 'high',
    headline: '62 stores are generating negative four-wall EBITDA with no criteria for what to do with them.',
    context: 'Footfall and margin data shows 62 stores (16% of the portfolio) generated negative four-wall EBITDA in 2025. No model exists to distinguish turnaround candidates from structurally unviable locations. Each month of inaction costs $400K per negative store on average.',
    cost: '$24M+ in annual losses from negative-EBITDA stores; lease liabilities of $180M if not managed strategically',
    urgency: 'Lease renewals for 18 of the negative stores are due in the next 9 months — the last exit opportunity without penalty.',
  },
  {
    num: '05', severity: 'high',
    headline: 'Labor cost is 4 points above benchmark with manual scheduling across 380 stores.',
    context: "Labor at 18% of revenue vs. 14% peer benchmark means $112M in excess labor cost. Store managers are building schedules manually with no demand signal from the eCommerce or footfall systems. Overtime is 28% above benchmark because scheduling doesn't anticipate volume accurately.",
    cost: '$112M excess labor cost; $32M attributable to poor scheduling vs. demand',
    urgency: 'Summer staffing ramps in 90 days — the last opportunity to deploy AI scheduling before the peak season.',
  },
]

export const APEX_AI_OFFICES: AIOffice[] = [
  {
    key: 'front',
    label: 'Front Office',
    sublabel: 'Customer Experience, Digital Commerce & Loyalty',
    totalValue: '$108M',
    functions: [
      {
        name: 'Personalization & Customer Intelligence',
        narrative: 'Apex has 22M loyalty profiles and 380 stores generating real-time transaction data — but personalization is batch-processed with 24-hour latency. Real-time AI personalization converts that data asset into a revenue engine.',
        useCases: [
          {
            title: '1:1 Real-Time Personalization Engine',
            what: 'AI ingests real-time browsing, purchase, and loyalty signals to generate product recommendations, personalized email content, and targeted promotions — updated with every session event. Delivers 1:1 at 22M scale.',
            metric: 'Email CTR: 2.1% → 5.8%. App conversion: +34%. Average order value: +$18 (14% lift).',
            value: '$48M/yr', data: 'Real-time event stream, loyalty profiles, product catalog, purchase history, inventory availability', timeline: '6–12 months',
          },
          {
            title: 'AI-Powered Search & Discovery',
            what: 'Semantic search understands intent beyond keywords. Visual search lets customers photograph items to find in-catalog matches. Results ranked by personal affinity, inventory, and margin. Zero-result searches: –80%.',
            metric: 'Search-to-purchase conversion: 3.4% → 7.2%. Revenue per search session: +$22.',
            value: '$22M/yr', data: 'Product catalog with rich attributes, visual imagery, search logs, purchase outcomes, inventory', timeline: '6–12 months',
          },
          {
            title: 'Loyalty Re-Engagement AI',
            what: 'Propensity model identifies the 8.4M dormant-but-recoverable members with the highest reactivation probability. Generates personalized win-back sequences with offers calibrated to predicted lifetime value — not flat discounts.',
            metric: 'Dormant member reactivation: 12% of targeted segment. Recovered annual spend per reactivated member: $480.',
            value: '$14M/yr', data: 'Loyalty purchase history, lapse date, category affinity, prior discount response rates', timeline: '0–6 months',
          },
        ],
      },
      {
        name: 'Digital Commerce & Customer Service',
        narrative: "Apex's 2.1% eCommerce conversion rate against a 3.4% peer benchmark represents $58M in digital revenue being left on the checkout floor. AI fixes the conversion funnel and deflects 72% of routine customer service contacts.",
        useCases: [
          {
            title: 'Customer Service AI Agent',
            what: 'Handles WISMO, returns, loyalty inquiries, and product questions across chat, email, and voice. Resolves 72% without escalation. Full context handoff to human agents for complex issues.',
            metric: 'Self-service resolution: 31% → 72%. Cost per contact: $8.40 → $2.10. CSAT: +8 points.',
            value: '$18M/yr', data: 'OMS, CRM, loyalty data, return history, knowledge base, product catalog', timeline: '0–6 months',
          },
          {
            title: 'Checkout Abandonment Recovery',
            what: 'Real-time abandonment detection triggers personalized recovery sequence within 15 minutes — SMS, email, push — with dynamic offer calibrated to cart value and customer LTV. Avoids blanket discounting.',
            metric: 'Cart abandonment recovery rate: 6% → 18%. Recovered revenue: $8M/yr without blanket discounting.',
            value: '$8M/yr', data: 'Cart events, customer profiles, LTV scores, purchase history, email/SMS preferences', timeline: '0–6 months',
          },
        ],
      },
    ],
  },
  {
    key: 'middle',
    label: 'Middle Office',
    sublabel: 'Merchandising, Demand Planning & Supply Chain',
    totalValue: '$94M',
    functions: [
      {
        name: 'Demand Forecasting & Inventory Intelligence',
        narrative: "$180M in annual markdowns and 3 stockout events costing $42M in 2025 are the direct result of a statistical forecasting system that is 61% accurate at the SKU level. AI forecasting achieves 86% SKU-level accuracy — and the data to train it already exists.",
        useCases: [
          {
            title: 'AI Demand Forecasting — SKU-Store-Week',
            what: 'ML model integrates 7 years of POS history, weather, local events, social trend signals, and competitor pricing to forecast demand at SKU-store-week granularity. Replaces category-level statistical forecasting with unit-level accuracy.',
            metric: 'Forecast accuracy: 61% → 86% at SKU level. Stockouts: –38%. Annual markdown reduction: $52M.',
            value: '$62M/yr', data: '7 years POS by SKU-store, weather APIs, social trend signals, competitor price feeds, event calendar', timeline: '6–12 months',
          },
          {
            title: 'Automated Replenishment & Par Level Optimization',
            what: 'AI continuously recalculates par levels and reorder points using updated demand forecasts. Triggers automated purchase orders within defined parameters. Handles 85% of replenishment decisions without buyer involvement.',
            metric: 'Inventory turnover: 3.8× → 5.0×. Inventory carrying cost reduction: $24M/yr.',
            value: '$24M/yr', data: 'POS feeds, WMS inventory positions, vendor lead times, DC capacity constraints', timeline: '6–12 months',
          },
          {
            title: 'Markdown Optimization AI',
            what: 'Instead of calendar-driven markdowns, AI optimizes clearance pricing by SKU-store based on real-time sell-through velocity, time to season end, and historical price elasticity. Maximizes recovery on clearance inventory.',
            metric: 'Clearance recovery rate: 34% → 51% of original retail. Gross margin improvement: +1.8 points.',
            value: '$22M/yr', data: 'POS velocity, inventory age, price elasticity curves, competitive clearance pricing', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Merchandising & Space Intelligence',
        narrative: 'Planogram decisions are made 8 weeks in advance based on category sales — with no visibility into adjacency effects, individual store format variation, or real-time sales performance. AI closes the gap.',
        useCases: [
          {
            title: 'AI Planogram Optimization',
            what: 'Analyzes SKU-level sales velocity, adjacency lift effects, and space profitability by store format to recommend planogram changes. Simulates sales impact before physical execution.',
            metric: 'Sales per linear foot: +11%. New planogram adoption cycle: 8 weeks → 3 weeks.',
            value: '$14M/yr', data: 'POS by shelf location, planogram data, store layout schematics, adjacency effect models', timeline: '12–24 months',
          },
        ],
      },
    ],
  },
  {
    key: 'back',
    label: 'Back Office',
    sublabel: 'Store Operations, Finance, HR & Loss Prevention',
    totalValue: '$62M',
    functions: [
      {
        name: 'Store Operations & Workforce',
        narrative: "$112M in excess labor cost comes from mismatched staffing — too many people when it's slow, not enough when it's busy. AI scheduling addresses both simultaneously, using demand signals the current system doesn't incorporate.",
        useCases: [
          {
            title: 'AI-Powered Labor Scheduling',
            what: 'Demand-driven model predicts hourly traffic by store using POS history, weather, local events, and promotional calendar. Schedules labor to match predicted demand — reducing overtime and understaffing simultaneously. Integrates with existing scheduling platform.',
            metric: 'Labor cost as % of revenue: 18% → 15.2%. Overtime: –34%. Understaffed hours: –28%.',
            value: '$38M/yr', data: 'Footfall data, POS transaction timing, employee schedules, historical demand patterns', timeline: '6–12 months',
          },
          {
            title: 'Store Portfolio Intelligence',
            what: 'AI synthesizes footfall, margin, demographic, and competitive data to score each of the 380 stores on turnaround potential vs. structural closure criteria. Generates a portfolio action plan: invest, hold, or exit for each store.',
            metric: 'Capital allocation accuracy: +40%. Negative EBITDA stores with action plan: 0 vs. current 62.',
            value: '$10M/yr', data: 'Store P&L data, footfall data, lease terms, demographic trends, competitor proximity', timeline: '6–12 months',
          },
        ],
      },
      {
        name: 'Finance & Loss Prevention',
        narrative: 'At 2.4% of revenue, Apex\'s shrink rate costs $67M annually. Loss prevention is reactive and evidence-based — AI makes it predictive and behavioral.',
        useCases: [
          {
            title: 'Loss Prevention AI (Behavioral Analytics)',
            what: 'Computer vision and transaction behavioral analytics detect shoplifting patterns, self-checkout bypass, and employee fraud signals in real time. Alerts LP team with video evidence before the transaction completes.',
            metric: 'Shrink rate: 2.4% → 1.7% of revenue. LP team efficiency: +60%.',
            value: '$22M/yr', data: 'CCTV feeds, POS transactions, SCO behavioral patterns, inventory variance records', timeline: '12–24 months',
          },
          {
            title: 'AP Automation AI',
            what: 'AI extracts invoice data, matches to POs and receipt records, validates against vendor contracts, and routes exceptions. Processes 85% of invoices without human touch. Captures early payment discounts systematically.',
            metric: 'Invoice processing cost: $14 → $2.80. Early payment discount capture: +$4.2M/yr.',
            value: '$8M/yr', data: 'Invoice documents, PO system, GR records, vendor contracts, discount terms', timeline: '0–6 months',
          },
          {
            title: 'Real-Time Store Performance Intelligence',
            what: 'AI synthesizes 140 metrics per store into a daily health score with ranked recommended interventions for district managers. Surfaces underperformance root causes — traffic, conversion, ATV, labor, or shrink — with store-specific context.',
            metric: 'District manager insight time: 4 hrs → 30 min/week. Underperforming store improvement rate: +28%.',
            value: '$8M/yr', data: 'POS, footfall, labor, shrink, NPS, review data by store', timeline: '6–12 months',
          },
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Index maps
// ─────────────────────────────────────────────────────────────────────────────
export const SITUATION_BY_CLIENT: Record<string, SituationFinding[]> = {
  meridian:   MERIDIAN_SITUATION,
  arcturus:   ARCTURUS_SITUATION,
  apexretail: APEX_SITUATION,
}

export const AI_OFFICES_BY_CLIENT: Record<string, AIOffice[]> = {
  meridian:   MERIDIAN_AI_OFFICES,
  arcturus:   ARCTURUS_AI_OFFICES,
  apexretail: APEX_AI_OFFICES,
}

export const DATA_READINESS: Record<string, number> = {
  meridian:   3,
  arcturus:   5,
  apexretail: 5,
}

export const AI_TOTAL_VALUE: Record<string, string> = {
  meridian:   '$277M',
  arcturus:   '$180M',
  apexretail: '$264M',
}
