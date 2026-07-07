// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Workforce & Labour Relations
// Code range: A4200-A4499
// Run: npx tsx src/scripts/seed/seed-airline-dom14-workforce.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineWorkforcePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_WORKFORCE_PATTERNS: AirlineWorkforcePatternSeed[] = [
  {
    code: 'A4200',
    name: 'Workforce Plan Ignores Banked Hub Peaks',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Airport workforce plans use average daily staffing demand rather than the compressed peaks created by banked hub schedules. The station looks staffed on paper but fails during the 90-minute windows when ramp, gate, baggage, and customer-service work all peak together.',
    keywords: ['workforce planning', 'hub bank', 'station staffing', 'ramp crew', 'A-CDM'],
    demoRelevant: true,
  },
  {
    code: 'A4201',
    name: 'Cross-Utilization Plan Violates Union Craft Boundaries',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Productivity plans assume employees can flex across gate, ramp, baggage, and cabin-service tasks, but labor agreements define craft boundaries and premium-pay triggers. The modeled savings cannot be realized without grievances or costly side letters.',
    keywords: ['union agreement', 'cross-utilization', 'craft boundary', 'premium pay', 'labor relations'],
    demoRelevant: true,
  },
  {
    code: 'A4202',
    name: 'Training Completion Decoupled From System Access',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Employees and contractors complete recurrent training in learning systems that are not tied to operational system access. Staff can retain access to DCS, ramp, or maintenance tools after a required certification or safety training has expired.',
    keywords: ['training compliance', 'DCS', 'access control', 'recurrent training', 'contractor'],
  },
  {
    code: 'A4203',
    name: 'Absenteeism Forecast Misses Local Event Clustering',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'Absenteeism forecasts use long-run station averages and miss clustering around weather, local events, school calendars, and labor actions. The airline discovers the staffing gap only when the day-of-operation sick-call curve is already too steep to recover.',
    keywords: ['absenteeism', 'station staffing', 'forecast', 'local event', 'labor action'],
  },
  {
    code: 'A4204',
    name: 'Frontline Change Fatigue Buried In Adoption Metrics',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'Digital programs report login counts and training completion while frontline employees face overlapping changes to DCS, mobile tools, service recovery, and safety workflows. Adoption looks green until manual workarounds and supervisor escalations reveal change fatigue.',
    keywords: ['change fatigue', 'frontline adoption', 'DCS', 'training completion', 'workaround'],
    demoRelevant: true,
  },
  {
    code: 'A4205',
    name: 'Seniority Bidding Rules Modeled As Simple Preferences',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Workforce optimization treats seniority bidding as a preference score rather than a contractual allocation mechanism. The generated schedules appear efficient but violate bid-line, reserve, or shift-assignment rules embedded in labor agreements.',
    keywords: ['seniority bidding', 'bid line', 'labor agreement', 'reserve', 'schedule optimization'],
  },
  {
    code: 'A4206',
    name: 'Overtime Savings Case Excludes Service Recovery Cost',
    officeCategory: 'back_office',
    failureRatePct: 51,
    description:
      'Cost programs reduce overtime budgets without modeling the service recovery cost of understaffed peak windows. Finance sees labor savings while operations pays through delay minutes, missed bags, and voucher costs.',
    keywords: ['overtime', 'service recovery', 'delay minutes', 'labor cost', 'station operations'],
  },
  {
    code: 'A4207',
    name: 'Supervisor Span Too Wide During IROPS',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'Normal supervisor-to-employee ratios are used during IROPS even though exception decisions, customer escalations, and manual overrides multiply. Frontline staff have bodies on shift but not enough decision support to clear disruption work.',
    keywords: ['supervisor span', 'IROPS', 'frontline escalation', 'manual override', 'station operations'],
  },
  {
    code: 'A4208',
    name: 'Contractor Workforce Hidden From Operating Model',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Operating-model reviews count employees but not the contractor workforce that runs ground handling, cleaning, catering, IT support, or call-center overflow. Workforce risk is understated because critical capacity sits outside HR dashboards.',
    keywords: ['contractor workforce', 'ground handling', 'operating model', 'HR dashboard', 'vendor risk'],
  },
  {
    code: 'A4209',
    name: 'New Tool Rollout Misses Station Super-User Capacity',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Digital rollouts assume each station has super-users available for coaching, but those employees are also needed for peak operations. Training exists centrally, yet local adoption fails because the people who can translate the workflow are not released from the operation.',
    keywords: ['super-user', 'station rollout', 'training', 'frontline adoption', 'change management'],
  },
  {
    code: 'A4210',
    name: 'Workforce AI Ignores Union Rest Rules',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Workforce AI forecasts coverage and recommends shifts without encoding rest, break, premium-pay, and craft rules from union agreements. The plan meets demand mathematically but cannot be posted without grievances or expensive manual repair.',
    keywords: ['workforce AI', 'union rest rules', 'labor agreement', 'schedule optimization', 'premium pay'],
    demoRelevant: true,
  },
  {
    code: 'A4211',
    name: 'AI Attrition Model Overlooks License Constraint',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Attrition AI predicts headcount risk but treats licensed mechanics, dispatchers, and specialized ramp roles as interchangeable with general staff. The model understates business risk because losing one credentialed employee can remove more operational capacity than several generic positions.',
    keywords: ['attrition AI', 'licensed mechanic', 'dispatcher', 'credential', 'workforce risk'],
    demoRelevant: true,
  },
  {
    code: 'A4212',
    name: 'GenAI Training Assistant Gives Contract-Wrong Answers',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'A generative AI training assistant answers frontline questions using generic policy language but not station-specific work rules or contract side letters. Employees follow the AI answer and later create compliance, payroll, or grievance issues.',
    keywords: ['GenAI training assistant', 'labor contract', 'side letter', 'policy grounding', 'frontline training'],
    demoRelevant: true,
  },
  {
    code: 'A4213',
    name: 'AI Scheduling Optimizes Fairness Without Explainability',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'AI scheduling changes shift allocation patterns but cannot explain why certain employees receive less desirable shifts or fewer overtime opportunities. Even if the outcome is mathematically fair, the lack of explainability triggers distrust and labor escalation.',
    keywords: ['AI scheduling', 'explainability', 'overtime', 'labor relations', 'fairness'],
    demoRelevant: true,
  },
  {
    code: 'A4214',
    name: 'AI Call-Center Coaching Increases Handle-Time Anxiety',
    officeCategory: 'front_office',
    failureRatePct: 52,
    description:
      'AI coaching listens to customer calls and prompts agents in real time, but employees perceive it as surveillance tied to performance discipline. Handle time and script adherence improve briefly, then attrition and union concerns offset the productivity gain.',
    keywords: ['AI coaching', 'call center', 'surveillance', 'AHT', 'labor relations'],
    demoRelevant: true,
  },
  {
    code: 'A4215',
    name: 'Workforce AI Vendor Contract Missing Adoption Telemetry',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'The workforce AI vendor contract commits to staffing optimization but not acceptance, override, grievance, or supervisor-intervention telemetry. Source teams cannot prove whether the tool produced usable recommendations or simply created more manual reconciliation.',
    keywords: ['workforce AI', 'vendor contract', 'adoption telemetry', 'Source', 'grievance'],
    demoRelevant: true,
  },
  {
    code: 'A4216',
    name: 'AI Hiring Screen Creates Disparate Impact Risk',
    officeCategory: 'back_office',
    failureRatePct: 54,
    description:
      'AI hiring screens prioritize availability, commute patterns, and prior airport experience without adverse-impact testing. The model accelerates hiring but creates legal and reputational risk if protected groups are screened out at higher rates.',
    keywords: ['AI hiring', 'adverse impact', 'EEOC', 'airport workforce', 'screening'],
    demoRelevant: true,
  },
  {
    code: 'A4217',
    name: 'Predictive Sick-Call AI Triggers Self-Fulfilling Staffing Cuts',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'Predictive sick-call AI lowers planned staffing on days it expects normal attendance, but local supervisors respond by reducing standby buffers. When the forecast is wrong, the station has no recovery capacity and the model is blamed for a management decision.',
    keywords: ['sick-call AI', 'staffing buffer', 'forecast error', 'station operations', 'governance'],
    demoRelevant: true,
  },
  {
    code: 'A4218',
    name: 'Frontline Mobile App Adoption Measured By Download Only',
    officeCategory: 'front_office',
    failureRatePct: 48,
    description:
      'A frontline mobile app is declared adopted because employees downloaded it, even though task completion, exception handling, and supervisor usage remain low. The program reports rollout success while operational work continues through radio, paper, and text.',
    keywords: ['mobile app', 'frontline adoption', 'task completion', 'supervisor usage', 'workaround'],
  },
  {
    code: 'A4219',
    name: 'Labor Productivity Benchmark Ignores Outsourcing Mix',
    officeCategory: 'back_office',
    failureRatePct: 47,
    description:
      'Benchmarking compares employees per departure across carriers without normalizing for outsourced ground handling, call-center overflow, and maintenance support. SkyHarbor chases a peer productivity number that reflects sourcing strategy more than operational efficiency.',
    keywords: ['productivity benchmark', 'outsourcing mix', 'ground handling', 'maintenance support', 'peer comparison'],
  },
  {
    code: 'A4220',
    name: 'Training Simulator Scenarios Not Updated After System Change',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Training simulators continue teaching old exception flows after PSS, DCS, or service-recovery systems change. Employees complete training but are unprepared for the new live workflow when disruption forces them into exception handling.',
    keywords: ['training simulator', 'PSS migration', 'DCS', 'exception handling', 'system change'],
  },
  {
    code: 'A4221',
    name: 'Manager Capability Plan Excludes Data Literacy',
    officeCategory: 'back_office',
    failureRatePct: 49,
    description:
      'Frontline managers receive tools and dashboards but not training on interpreting model confidence, leading indicators, or intervention thresholds. The airline gives supervisors more data without building the judgment muscle to act on it.',
    keywords: ['manager capability', 'data literacy', 'model confidence', 'dashboard', 'frontline leadership'],
  },
  {
    code: 'A4222',
    name: 'Labor Relations Review Happens After Procurement',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Tools affecting scheduling, monitoring, coaching, or task allocation are procured before labor relations reviews contract and side-letter implications. Implementation slows after award because the technology is now entangled with unresolved workforce commitments.',
    keywords: ['labor relations', 'procurement', 'side letter', 'task allocation', 'Source'],
  },
  {
    code: 'A4223',
    name: 'Station Incentives Reward Departure Time Over Customer Recovery',
    officeCategory: 'middle_office',
    failureRatePct: 51,
    description:
      'Station teams are rewarded for departure time but not for baggage recovery, accessibility, or premium customer recovery outcomes. Employees make rational local decisions that improve on-time metrics while worsening end-to-end customer value.',
    keywords: ['station incentive', 'on-time departure', 'customer recovery', 'baggage', 'accessibility'],
  },
  {
    code: 'A4224',
    name: 'Skill Matrix Not Connected To Disruption Roles',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'HR skill matrices list certifications and job titles but not who can perform high-pressure disruption roles such as manual rebooking, voucher management, or irregular baggage recovery. The staffing roster is technically filled but short of the skills that matter during IROPS.',
    keywords: ['skill matrix', 'IROPS', 'manual rebooking', 'voucher', 'baggage recovery'],
  },
  {
    code: 'A4225',
    name: 'Change Network Excludes Informal Station Leaders',
    officeCategory: 'back_office',
    failureRatePct: 46,
    description:
      'Change programs nominate managers and official trainers but miss informal station leaders whom employees actually trust. Adoption stalls because the social network that determines frontline behavior was never mapped.',
    keywords: ['change network', 'informal leader', 'station adoption', 'frontline behavior', 'change management'],
  },
  {
    code: 'A4226',
    name: 'Overtime Approval Workflow Detached From Operational Risk',
    officeCategory: 'back_office',
    failureRatePct: 48,
    description:
      'Overtime approvals are governed by budget thresholds without showing the operational risk of denying coverage in specific banks, stations, or weather windows. Finance avoids overtime cost and later absorbs larger delay and recovery cost.',
    keywords: ['overtime approval', 'operational risk', 'hub bank', 'delay cost', 'finance control'],
  },
  {
    code: 'A4227',
    name: 'Contractor Onboarding Lag Blocks Station Ramp-Up',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'New contractor staffing is approved, but badging, security training, system access, and station orientation take longer than the staffing plan assumes. The airline pays for capacity that cannot legally or practically work the operation yet.',
    keywords: ['contractor onboarding', 'airport badge', 'system access', 'security training', 'station ramp-up'],
  },
  {
    code: 'A4228',
    name: 'Employee Listening Survey Misses Shift Worker Reality',
    officeCategory: 'back_office',
    failureRatePct: 44,
    description:
      'Employee listening surveys are optimized for corporate staff and daytime access, under-sampling overnight, ramp, maintenance, and part-time station workers. Leadership sees a cleaner culture signal than the frontline reality that shapes safety and service.',
    keywords: ['employee listening', 'shift worker', 'ramp', 'maintenance', 'culture signal'],
  },
  {
    code: 'A4229',
    name: 'Workforce Transformation Case Ignores Grievance Cycle Time',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'Workforce transformation business cases include labor productivity but not grievance volume, arbitration cycle time, and management capacity consumed by disputes. Moves teams understate the real implementation cost of changing how work is assigned.',
    keywords: ['workforce transformation', 'grievance', 'arbitration', 'Moves', 'implementation cost'],
    demoRelevant: true,
  },
];
