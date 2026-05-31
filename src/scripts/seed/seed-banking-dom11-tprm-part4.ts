// seed-banking-dom11-tprm-part4.ts
// Banking genome patterns — Third-Party & Vendor Risk Management (TPRM) Part 4
// Code range: B3280–B3339  (60 patterns)
// Loaded by: scripts/corpus/load-authored-genome-seeds.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
  subTopic?: string;
  aiInsertionRisk?: boolean;
}

export const BANKING_DOM11_TPRM_PART4_PATTERNS: PatternSeed[] = [

  // ── Intragroup Outsourcing ────────────────────────────────────────────────
  {
    code: 'B3280',
    name: `Intragroup IT Service Agreements Lack OCC 2023-17 Required Contractual Provisions`,
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital receives network management, security operations, and data center services from
      an affiliated entity within its bank holding company structure; the intragroup service agreements
      governing these arrangements were drafted as internal cost-allocation documents and do not include
      the performance standards, audit rights, business continuity obligations, or exit provisions
      required by OCC Bulletin 2023-17 for critical-activity third-party relationships. OCC Bulletin
      2023-17 explicitly states that affiliate service arrangements are subject to the same risk
      management standards as external vendor contracts when they involve critical-activity functions;
      intragroup agreements that omit required contractual provisions expose First Capital to an OCC
      examination finding that its most operationally significant service dependencies lack the
      contractual protections the guidance mandates.`,
    keywords: ['OCC Bulletin 2023-17', 'intragroup service agreement', 'affiliate TPRM', 'Federal Reserve SR 13-19', 'TPRM'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3281',
    name: `Affiliate Service Level Agreements Not Benchmarked Against External Market Standards`,
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's intragroup IT service agreements with its holding company affiliates specify
      service levels that were negotiated at contract inception without reference to external market
      benchmarks; infrastructure uptime commitments of 99.5% and 48-hour incident response SLAs that
      the affiliate accepted are materially below the 99.95% uptime and 4-hour critical-incident
      response standards that external market vendors provide for equivalent services. OCC Bulletin
      2023-17 requires banks to assess whether affiliate service arrangements deliver comparable quality
      and performance to what could be obtained from third-party vendors; below-market intragroup SLAs
      represent a risk management gap where the bank accepts inferior service quality that it would not
      accept from an external vendor simply because the provider is an affiliate.`,
    keywords: ['OCC Bulletin 2023-17', 'intragroup SLA', 'affiliate benchmarking', 'TPRM', 'service level'],
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3282',
    name: `Intragroup Data Sharing Agreements Do Not Address GLBA Cross-Affiliate Data Use Restrictions`,
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital shares customer transaction data, credit file information, and account balance
      history with affiliated non-bank entities within its holding company for purposes of cross-sell
      analytics and enterprise data platform development; the intragroup data sharing arrangements
      have not been assessed against GLBA Section 502's affiliate information-sharing restrictions or
      the customer opt-out rights required when affiliate data sharing is used for marketing purposes.
      Federal Reserve supervisory guidance on affiliate transactions and GLBA's affiliate information-
      sharing provisions require that customer data transferred to non-bank affiliates for marketing-
      adjacent purposes be disclosed in the bank's privacy notice with an opt-out mechanism; First
      Capital's intragroup data sharing occurs without these disclosures, creating a systemic CFPB
      and GLBA examination risk.`,
    keywords: ['OCC Bulletin 2023-17', 'GLBA affiliate data sharing', 'intragroup data transfer', 'CFPB', 'Federal Reserve'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3283',
    name: `Holding Company Shared Services Centre Not Subject to Bank-Level TPRM Due Diligence`,
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's bank holding company operates a centralised shared services centre that provides
      HR systems, enterprise procurement, and legal support to all group entities including the bank;
      these shared services have never been subjected to a TPRM due diligence assessment, risk tier
      assignment, or OCC Bulletin 2023-17-compliant oversight process because they are managed
      entirely within the holding company's operational structure. OCC examiners have noted in peer
      bank examinations that holding company shared services that access bank personnel data, customer
      data, or regulated business systems are effectively third-party service providers to the bank
      and must be assessed under the same TPRM framework applied to external vendors; the absence of
      any due diligence on these services creates a governance gap for arrangements that may involve
      material data processing on behalf of the regulated entity.`,
    keywords: ['OCC Bulletin 2023-17', 'shared services centre', 'holding company', 'TPRM due diligence', 'affiliate services'],
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3284',
    name: `Intragroup Technology Dependency Not Included in Bank Operational Resilience Assessment`,
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital's operational resilience programme maps the bank's critical business services
      to their underlying technology dependencies but excludes intragroup service dependencies from
      the resilience mapping on the basis that affiliate disruptions are addressed through holding
      company business continuity planning rather than bank-level resilience management. OCC Bulletin
      2023-17 and FFIEC Business Continuity Management Handbook require that banks map all service
      dependencies regardless of whether they are provided internally, by affiliates, or by external
      vendors; an intragroup IT infrastructure disruption that impairs the bank's ability to process
      payments, access customer data, or maintain BSA/AML monitoring represents exactly the type of
      critical service interruption that the bank's resilience programme is required to address with
      tested recovery procedures.`,
    keywords: ['OCC Bulletin 2023-17', 'operational resilience', 'intragroup dependency', 'FFIEC Business Continuity Handbook', 'TPRM'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3285',
    name: `Affiliate BSA/AML Data Processing Sub-Arrangement Not Disclosed to OCC`,
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's BSA/AML transaction monitoring workflow involves an affiliate entity that
      performs batch data processing and sanctions screening for the bank under an intragroup
      service arrangement; this arrangement has not been disclosed to the OCC as a material change
      to the bank's BSA/AML programme despite FinCEN and OCC examination expectations that banks
      identify and assess all entities involved in BSA/AML-critical processing. FinCEN's BSA/AML
      examination manual and OCC supervisory guidance require that banks maintain direct accountability
      for the integrity of their AML compliance function regardless of whether processing is performed
      by an affiliate; an undisclosed affiliate sub-arrangement in the BSA/AML chain represents a
      programme structure deviation that OCC examiners have cited as a basis for BSA programme
      deficiency findings at peer institutions.`,
    keywords: ['OCC Bulletin 2023-17', 'BSA/AML', 'affiliate sub-arrangement', 'FinCEN', 'intragroup TPRM'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3286',
    name: `Intragroup Pricing for IT Services Not Arm's-Length — Transfer Pricing Risk Under Reg W`,
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's intragroup IT service fee arrangements with affiliated entities are priced at
      cost-plus-zero, transferring services at direct cost without a market-rate profit element;
      Regulation W, which governs transactions between a bank and its affiliates, requires that
      services provided by a bank to an affiliate or received from an affiliate be priced at
      arm's-length market terms, and the absence of a market-rate comparison analysis in the
      intragroup pricing documentation creates a Reg W compliance gap. Federal Reserve examiners
      reviewing Reg W compliance have identified below-market intragroup service pricing as a
      covered transaction risk, particularly when the bank is effectively subsidising affiliate
      operations by providing services at below-market rates or receiving services at above-market
      rates that transfer economic value to the holding company at the bank's expense.`,
    keywords: ['Regulation W', 'intragroup pricing', 'arm\'s-length', 'affiliate transactions', 'Federal Reserve'],
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3287',
    name: `Intragroup Cloud Infrastructure Shared Across Bank and Non-Bank Affiliates — Logical Segregation Gap`,
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital and its non-bank holding company affiliates share a common cloud infrastructure
      environment managed by an affiliate technology company; the bank's production workloads,
      customer data, and BSA/AML processing run on infrastructure that is logically rather than
      physically segregated from unregulated affiliate workloads, and the logical segregation controls
      have not been independently audited for compliance with OCC cybersecurity standards. OCC Bulletin
      2023-17 and the OCC's cloud risk management guidance require that banks maintain appropriate
      controls over their data in shared computing environments, including controls that prevent
      unregulated affiliate workloads from accessing or interfering with bank data; shared
      infrastructure between regulated and unregulated entities creates a regulatory compliance
      boundary risk that is structurally difficult to remediate without physical workload separation.`,
    keywords: ['OCC Bulletin 2023-17', 'cloud segregation', 'intragroup infrastructure', 'OCC cloud risk', 'affiliate TPRM'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3288',
    name: `Intragroup Service Exit Planning Absent — No Capability to Insource or Redirect to External Vendor`,
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital has not developed exit or contingency plans for its intragroup service
      dependencies on affiliated entities; the bank has no documented capability to insource
      the services provided by its affiliates or redirect them to external vendors within a
      timeframe consistent with maintaining critical business service continuity. OCC Bulletin
      2023-17 requires that exit and contingency planning apply to affiliate service arrangements
      with the same rigour as external vendor relationships when those arrangements support critical-
      activity functions; a regulatory-directed separation of the bank from its holding company
      affiliates — or an affiliate financial distress event — would expose First Capital to a service
      continuity crisis for its most fundamental infrastructure dependencies without any tested
      response plan.`,
    keywords: ['OCC Bulletin 2023-17', 'intragroup exit planning', 'affiliate service continuity', 'TPRM', 'Federal Reserve SR 13-19'],
    subTopic: 'intragroup-outsourcing',
  },
  {
    code: 'B3289',
    name: `Affiliate Model Risk Services Not Reviewed Under SR 11-7 — Bank Inherits Unvalidated Models`,
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital uses credit risk scoring models and deposit pricing models developed and
      maintained by an affiliate model development group within the holding company; these models
      are deployed into the bank's production decisioning environment without independent model
      validation at the bank level, on the premise that the affiliate's own SR 11-7 programme
      satisfies the bank's model risk management obligations. SR 11-7 requires that model validation
      be independent of model development and that the validating organisation be independent of the
      model's use; using the holding company's SR 11-7 validation to satisfy the bank's independent
      validation requirement does not meet the independence standard when the affiliate develops the
      models and the bank uses them, creating a model risk governance gap that OCC examiners
      specifically assess in banks with affiliate model development arrangements.`,
    keywords: ['SR 11-7', 'affiliate model risk', 'intragroup model validation', 'OCC Bulletin 2023-17', 'model independence'],
    demoRelevant: true,
    subTopic: 'intragroup-outsourcing',
  },

  // ── TPRM Program Maturity ─────────────────────────────────────────────────
  {
    code: 'B3290',
    name: `TPRM Programme Maturity Assessment Not Performed — No Benchmark Against OCC Examination Standards`,
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital has not performed a structured maturity assessment of its TPRM programme against
      OCC Bulletin 2023-17's expected programme elements, the FFIEC IT Examination Handbook's third-
      party management supplement, or any recognised external TPRM maturity framework such as the
      Shared Assessments TPRM Framework; the bank's consent order requires documented progress toward
      TPRM programme enhancement but the absence of a baseline maturity assessment means neither the
      bank nor OCC examiners have a quantified reference point against which to measure improvement.
      Operating without a maturity baseline systematically impairs the bank's ability to prioritise
      TPRM remediation investments, communicate programme progress to the board, or demonstrate to
      OCC examiners that consent order remediation efforts are structured around identified gaps
      rather than reactive activity.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM maturity', 'Shared Assessments Framework', 'consent order', 'programme assessment'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3291',
    name: `TPRM Staffing Levels Not Scaled to Critical Vendor Portfolio Size — Chronic Resource Deficit`,
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's TPRM function is staffed by three FTEs responsible for overseeing 127 active
      vendor relationships including 34 critical-activity vendors, producing a vendor-to-analyst ratio
      that exceeds the industry benchmark of 20–25 vendor relationships per FTE for a TPRM programme
      of this risk complexity; the resource deficit means critical-activity vendor annual reviews
      are compressed into 60-90-minute sessions that cannot adequately assess the full OCC Bulletin
      2023-17 due diligence scope. OCC examiners have cited inadequate TPRM staffing as a programme
      structural weakness in consent order contexts where the bank has acknowledged TPRM programme
      deficiencies; a consent order commitment to improve TPRM quality cannot be fulfilled by a
      team that is structurally under-resourced to perform the oversight the guidance requires.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM staffing', 'vendor-to-analyst ratio', 'consent order', 'programme capacity'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3292',
    name: `TPRM Technology Platform Does Not Support Risk-Tiered Workflow Automation — Manual Process Dependency`,
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's TPRM programme is managed primarily through spreadsheets and shared document
      repositories rather than a purpose-built TPRM platform with workflow automation; the absence
      of technology-supported workflow routing means due diligence tasks, approval workflows, and
      escalation notifications are managed through email and calendar reminders that are not auditable,
      do not produce a documented audit trail, and frequently miss deadlines when responsible
      individuals are absent. OCC Bulletin 2023-17 requires that banks maintain documentation that
      demonstrates effective TPRM programme execution throughout the vendor lifecycle; a spreadsheet-
      managed TPRM programme cannot produce the activity logs, workflow timestamps, and approval
      records that OCC examiners require as evidence of a functioning TPRM programme, creating a
      systematic documentation gap.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM platform', 'workflow automation', 'programme documentation', 'TPRM'],
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3293',
    name: `TPRM Key Risk Indicators Not Defined — No Quantitative Programme Health Metrics Reported to Board`,
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's TPRM programme does not have defined key risk indicators — such as the
      percentage of critical vendors with overdue annual reviews, the number of open unresolved
      risk findings aged beyond 90 days, or the proportion of critical-activity vendor contracts
      with missing OCC Bulletin 2023-17-required provisions — that would give the board and senior
      management a quantitative view of the programme's health and compliance status. OCC Bulletin
      2023-17 requires boards and senior management to receive regular reporting on the TPRM
      programme that supports risk oversight decisions; qualitative programme narrative reporting
      without quantitative KRIs does not satisfy this requirement and has been noted as a board
      reporting deficiency in OCC TPRM examination findings at peer regional banks.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM KRI', 'board reporting', 'risk indicators', 'programme metrics'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3294',
    name: `TPRM Policy Last Revised Before OCC Bulletin 2023-17 Issued — Guidance Not Incorporated`,
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's TPRM policy was last comprehensively revised in 2021 and does not incorporate
      the enhanced requirements of OCC Bulletin 2023-17, which superseded OCC Bulletin 2013-29 and
      introduced materially more prescriptive requirements for pre-contract due diligence, ongoing
      monitoring, exit planning, and concentration risk management; the bank's TPRM programme
      continues to operate against the 2013-29 framework requirements. Operating a TPRM programme
      against a superseded policy framework creates a systematic compliance gap where the bank's
      documented procedures — which define what its staff are required to do — no longer align
      with the current OCC supervisory standard, exposing the bank to examination findings for every
      element of 2023-17 that the 2021 policy does not address.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC Bulletin 2013-29', 'TPRM policy update', 'consent order', 'TPRM'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3295',
    name: `TPRM Due Diligence Templates Not Tailored by Vendor Risk Category — One-Size Assessment Fails Deep Review`,
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital uses a single standardised vendor due diligence questionnaire for all third-party
      relationships regardless of the specific risk category of the vendor — using the same template
      for a core banking platform vendor, an AI credit decisioning vendor, and an office equipment
      maintenance vendor — which produces a due diligence record that covers generic risk dimensions
      but omits the vendor-category-specific review areas required by OCC Bulletin 2023-17. OCC 2023-17
      requires that due diligence be tailored to the specific risks associated with the type of
      service, data, and regulatory obligations involved; a generic questionnaire applied to an AI
      credit model vendor does not capture the model architecture documentation, SR 11-7 compliance
      evidence, or ECOA fair lending assessment results that constitute adequate due diligence for
      that risk category.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM due diligence template', 'vendor categorisation', 'TPRM', 'risk-tailored assessment'],
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3296',
    name: `Third-Party Risk Committee Meeting Frequency Insufficient — Quarterly Cadence Below Consent Order Expectation`,
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's TPRM Committee convenes quarterly, which the bank's consent order identified
      as insufficient for a programme managing 34 critical-activity vendor relationships operating
      under an active OCC consent order; the OCC's examination findings document specified that the
      committee should meet at minimum monthly until consent order milestones are achieved and the
      programme demonstrates sustained compliance with OCC Bulletin 2023-17 requirements. A quarterly
      committee cadence means that material vendor risk events — cybersecurity incidents, SLA failures,
      adverse news, or regulatory enforcement actions at critical vendors — can go unaddressed at the
      governance level for up to 90 days after they are identified, creating a systematic risk event
      response lag that is inconsistent with the bank's consent order commitments.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM committee', 'consent order', 'governance cadence', 'TPRM'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3297',
    name: `TPRM Issue Management Backlog Not Tracked — Open Findings Aged Without Resolution Timeline`,
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's TPRM programme generates risk findings from vendor assessments, monitoring
      reviews, and audit activities but does not maintain a centralised issue management log that
      tracks each finding's owner, target remediation date, current status, and escalation history;
      prior OCC examination findings identified 23 unresolved TPRM programme issues that could not
      be traced to documented remediation actions. OCC Bulletin 2023-17 requires that banks track
      and remediate identified programme deficiencies; an issue management backlog without a tracking
      system produces a situation where OCC examiners at the next examination may identify the same
      findings that were cited in the previous examination without documented evidence that the bank
      took any action to address them — a pattern that OCC examiners characterise as systemic
      programme failure.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM issue management', 'audit findings', 'consent order', 'remediation tracking'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3298',
    name: `Pre-Contract TPRM Review Bypassed Under Business Urgency — Emergency Vendor Onboarding Lacks Controls`,
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's TPRM policy requires a pre-contract due diligence review before any new vendor
      is onboarded, but four critical-activity vendor relationships in the past two years were
      initiated under emergency business urgency exceptions that bypassed the required due diligence
      review; in three of those four cases, the planned retrospective due diligence review was never
      completed after the vendor was onboarded and the emergency exception record was never escalated
      to the TPRM committee for review. OCC Bulletin 2023-17's pre-contract due diligence requirements
      do not contain a business urgency exception; emergency onboarding of critical vendors without
      due diligence creates a compliance gap and a risk that material issues that would have been
      identified during due diligence — data handling practices, financial stability concerns, or
      missing required contract provisions — are only discovered after the bank is operationally
      dependent on the vendor.`,
    keywords: ['OCC Bulletin 2023-17', 'pre-contract due diligence', 'emergency vendor onboarding', 'TPRM', 'programme bypass'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },
  {
    code: 'B3299',
    name: `TPRM Programme Annual Self-Assessment Not Submitted to Board — Governance Oversight Gap`,
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital does not perform or submit an annual TPRM programme self-assessment to the board
      of directors; OCC Bulletin 2023-17 and the bank's consent order both require that senior
      management present the board with an annual assessment of the TPRM programme's effectiveness,
      coverage completeness, and alignment with the OCC's third-party risk management guidance. The
      absence of an annual programme self-assessment means the board has never received a
      comprehensive, governance-level view of whether the TPRM programme is performing as designed,
      whether critical risks are being adequately managed, or whether the consent order milestones
      are on track — a governance gap that OCC examiners typically characterise as a fundamental board
      oversight failure under the three-lines-of-defense model.`,
    keywords: ['OCC Bulletin 2023-17', 'TPRM self-assessment', 'board governance', 'consent order', 'programme oversight'],
    demoRelevant: true,
    subTopic: 'tprm-program-maturity',
  },

  // ── Regulatory TPRM Requirements ──────────────────────────────────────────
  {
    code: 'B3300',
    name: `OCC Bulletin 2023-17 Required Contract Provisions Gap Analysis Not Completed`,
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital has not conducted a systematic gap analysis of its critical-activity vendor
      contracts against the eleven contractual provision categories required by OCC Bulletin 2023-17
      — including access to information, audit rights, business continuity, sub-contracting controls,
      ownership of data, and exit provisions; the bank's legal team has reviewed individual contracts
      on a renewal basis but has not produced a portfolio-level view of which required provisions
      are missing across the critical vendor contract inventory. OCC examiners conducting TPRM
      examinations routinely request a portfolio-level contract gap analysis as evidence that the
      bank has systematically assessed compliance with OCC 2023-17's contractual requirements;
      absence of a gap analysis report means the bank cannot demonstrate that it understands its
      own exposure to contractual provision deficiencies across its most critical vendor relationships.`,
    keywords: ['OCC Bulletin 2023-17', 'contract gap analysis', 'TPRM contractual provisions', 'OCC examination', 'TPRM'],
    demoRelevant: true,
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3301',
    name: `FDIC Guidance on Third-Party Lending Not Applied to Fintech Partnerships — BaaS Compliance Gap`,
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital has entered into two banking-as-a-service partnerships with fintech companies
      that use the bank's charter to originate consumer loans and deposit accounts; these
      arrangements were structured as technology service agreements rather than third-party lending
      relationships, and were not assessed against the FDIC's 2023 guidance on third-party lending
      arrangements which requires banks to maintain direct responsibility for underwriting standards,
      compliance oversight, and consumer protection obligations. The FDIC's third-party lending
      guidance specifically addresses the risk that banks acting as programme banks in fintech
      partnerships fail to maintain the required level of control over lending standards, BSA/AML
      compliance, and consumer protection; structuring a BaaS partnership as a technology service
      agreement does not alter the bank's regulatory responsibility for the underlying lending and
      deposit products.`,
    keywords: ['OCC Bulletin 2023-17', 'FDIC third-party lending guidance', 'BaaS', 'fintech partnership', 'TPRM'],
    demoRelevant: true,
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3302',
    name: `Federal Reserve SR 13-19 Applicability to Holding Company Vendor Relationships Not Assessed`,
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's TPRM programme is scoped to vendor relationships that the bank itself enters
      into directly, but does not assess the applicability of Federal Reserve SR 13-19 to vendor
      relationships entered into at the holding company level that support bank operations through
      intragroup service arrangements; the Federal Reserve's third-party vendor risk management
      guidance for bank holding companies requires that the holding company's TPRM programme cover
      all significant vendor relationships affecting supervised entities within the group. A holding
      company vendor relationship for enterprise data analytics or cybersecurity services that also
      processes bank customer data may be subject to SR 13-19's requirements at the holding company
      level while simultaneously being out of scope for the bank's OCC 2023-17 TPRM programme —
      a regulatory coverage gap that neither regulator has visibility into.`,
    keywords: ['OCC Bulletin 2023-17', 'Federal Reserve SR 13-19', 'holding company TPRM', 'affiliate services', 'regulatory gap'],
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3303',
    name: `CFPB Supervision of Service Providers Not Mapped to Bank TPRM — Consumer Protection Blind Spot`,
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's TPRM programme assesses vendor risk through an OCC Bulletin 2023-17 lens
      focused on operational and financial risks but does not systematically incorporate CFPB
      Supervision and Examination Manual requirements for service provider oversight, which require
      banks to assess whether vendors engaged in consumer-facing activities comply with applicable
      consumer financial protection laws and are subject to appropriate CFPB supervisory oversight.
      CFPB examination guidance on service providers requires banks to conduct due diligence,
      implement contractual protections, and monitor performance for any service provider involved
      in consumer-facing activities; a TPRM programme that does not incorporate CFPB service
      provider oversight requirements creates a systematic consumer compliance gap for the bank's
      most consumer-impactful vendor relationships.`,
    keywords: ['OCC Bulletin 2023-17', 'CFPB service provider guidance', 'consumer protection', 'TPRM', 'vendor compliance'],
    demoRelevant: true,
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3304',
    name: `FFIEC IT Examination Handbook Third-Party Management Supplement Not Used in TPRM Scoping`,
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's TPRM programme scope and due diligence requirements are defined solely
      by reference to OCC Bulletin 2023-17 and do not incorporate the more detailed prescriptive
      requirements of the FFIEC IT Examination Handbook's Third-Party Management Booklet, which
      provides specific guidance on cybersecurity due diligence, IT controls assessment, and
      technology risk management for third-party technology relationships. FFIEC IT examination
      guidance is used by OCC IT examiners when evaluating the adequacy of a bank's technology
      vendor risk management; a TPRM programme that does not address the FFIEC's IT-specific
      third-party management requirements will produce due diligence records that pass the OCC
      2023-17 surface review but fail the deeper IT examination conducted by the technology
      specialist team.`,
    keywords: ['FFIEC IT Examination Handbook', 'OCC Bulletin 2023-17', 'IT vendor risk', 'TPRM scope', 'technology risk'],
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3305',
    name: `BSA/AML Compliance Vendor Oversight Not Aligned With FinCEN Examination Manual Requirements`,
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's TPRM oversight framework for its BSA/AML technology vendor — which provides
      the transaction monitoring platform, sanctions screening service, and SAR filing workflow —
      addresses vendor operational and financial risk but does not assess the vendor's BSA/AML
      compliance posture against FinCEN examination manual standards for programme integrity,
      alert calibration, and SAR quality. FinCEN's BSA/AML examination manual requirements apply
      to the bank's entire BSA/AML function including the components delivered by vendors; a vendor
      transaction monitoring system with uncalibrated alert thresholds, inadequate beneficial
      ownership check coverage, or outdated sanctions list refresh cadences creates programme
      deficiencies that the bank is responsible for even if the root cause is in the vendor's
      system design.`,
    keywords: ['FinCEN', 'BSA/AML examination manual', 'transaction monitoring', 'OCC Bulletin 2023-17', 'TPRM'],
    demoRelevant: true,
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3306',
    name: `Interagency TPRM Guidance Divergence Not Mapped — OCC and FDIC Requirements Applied Inconsistently`,
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's TPRM policy is calibrated to OCC Bulletin 2023-17 but does not account for
      areas where the FDIC's third-party risk management guidance and the Federal Reserve's SR 13-19
      impose materially different or additional requirements; the bank's compliance team has not
      produced an interagency guidance comparison that maps the specific differences in scope,
      due diligence depth, and contractual provision requirements across the three primary banking
      regulator TPRM frameworks. The practical consequence of this gap is that the bank's TPRM
      compliance posture is calibrated to the OCC's requirements but may not satisfy the Federal
      Reserve's holding company-level requirements or FDIC standards applicable to any FDIC-supervised
      entities within the group, creating regulatory arbitrage exposure in a multi-regulator
      supervisory environment.`,
    keywords: ['OCC Bulletin 2023-17', 'FDIC TPRM guidance', 'Federal Reserve SR 13-19', 'interagency guidance', 'TPRM'],
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3307',
    name: `OCC Heightened Standards for Large Banks Applied Prematurely — Disproportionate TPRM Requirements`,
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's TPRM remediation plan, developed under consent order pressure, has adopted
      the OCC's heightened standards for large bank TPRM programmes — including independent model
      validation for all TPRM scoring tools, real-time continuous monitoring for all critical vendors,
      and pre-approved replacement vendor identification for each critical relationship — despite
      the bank falling below the $50 billion asset threshold at which the OCC's heightened standards
      formally apply. The mismatch between the programme requirements the bank has committed to and
      the bank's actual capacity to resource, staff, and sustain those requirements creates a
      programme sustainability risk where First Capital is attempting to operate a Tier-1 bank TPRM
      infrastructure on a regional bank staffing and technology budget, leading to chronic execution
      gaps.`,
    keywords: ['OCC Bulletin 2023-17', 'OCC heightened standards', 'TPRM programme sizing', 'consent order', 'regional bank'],
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3308',
    name: `Reg W Covered Transaction Review Not Integrated With TPRM — Affiliate Vendor Deals Escape Scrutiny`,
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's procurement function routes all external vendor contracts through the TPRM
      review process but does not route intragroup service agreements through both TPRM review and
      Regulation W covered transaction review; affiliate service arrangements that constitute covered
      transactions under Reg W — including credit extensions, asset purchases, and service agreements
      priced above market — are approved through a separate affiliate transaction review process that
      does not apply the OCC Bulletin 2023-17 risk assessment standards required for critical-activity
      third-party relationships. The separation of Reg W and TPRM review creates a governance gap
      where affiliate arrangements that are simultaneously covered transactions under Reg W and
      critical-activity third-party services under OCC 2023-17 are not subject to integrated
      oversight.`,
    keywords: ['Regulation W', 'OCC Bulletin 2023-17', 'covered transactions', 'affiliate TPRM', 'TPRM'],
    subTopic: 'regulatory-tprm-requirements',
  },
  {
    code: 'B3309',
    name: `NY DFS Part 500 Vendor Cybersecurity Requirements Not Embedded in TPRM Due Diligence`,
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital operates in New York and is subject to NY DFS Part 500 cybersecurity
      regulations, which impose specific requirements for assessing the cybersecurity practices
      of third-party service providers; the bank's TPRM due diligence questionnaire does not
      include the specific NY DFS Part 500 Section 11 third-party service provider assessment
      questions, and the bank has not confirmed that its critical vendors' cybersecurity programmes
      meet the Part 500 standards applicable to DFS-regulated entities. NY DFS has conducted
      enforcement actions against banks that failed to adequately assess and contractually require
      compliance with Part 500's cybersecurity standards from third-party vendors; using a TPRM
      questionnaire designed for OCC-only regulatory compliance without incorporating DFS-specific
      cybersecurity assessment requirements exposes the bank to a state regulatory examination
      finding.`,
    keywords: ['NY DFS Part 500', 'OCC Bulletin 2023-17', 'cybersecurity vendor assessment', 'TPRM', 'state regulation'],
    demoRelevant: true,
    subTopic: 'regulatory-tprm-requirements',
  },

  // ── AI in TPRM (Part 4) ───────────────────────────────────────────────────
  {
    code: 'B3310',
    name: `AI-Powered Contract Abstraction Tool Misclassifies Critical vs. Non-Critical Vendor Status`,
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital deployed an AI contract abstraction platform to accelerate the classification of
      vendor contracts against OCC Bulletin 2023-17's critical-activity criteria; the NLP model
      infers criticality based on contract language patterns rather than a structured regulatory
      criteria assessment, and in a validation review of 40 contracts, the model misclassified
      6 critical-activity vendors as non-critical because their contracts used atypical service
      description language that did not match the model's training corpus. SR 11-7's model risk
      management requirements apply to AI tools that influence risk classification decisions;
      an AI contract classification model that systematically misclassifies vendor criticality
      creates a downstream risk that critical vendors receive non-critical oversight intensity,
      with the misclassification error invisible to the TPRM function until an OCC examination
      or a vendor service failure exposes it.`,
    keywords: ['SR 11-7', 'AI contract abstraction', 'vendor criticality classification', 'OCC Bulletin 2023-17', 'model risk'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3311',
    name: `AI Adverse News Monitoring Tool Calibrated for Brand Risk Not Regulatory Risk — TPRM Signal Gap`,
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's TPRM programme uses an AI-powered adverse news monitoring service that was
      originally deployed by the marketing function for brand reputation monitoring and was
      subsequently re-purposed for vendor risk oversight; the AI model's training is calibrated to
      surface reputational and media coverage signals rather than regulatory enforcement actions,
      OCC consent orders, CFPB findings, or cybersecurity incident disclosures that constitute
      material TPRM risk events. A brand-calibrated adverse news AI surfaces news stories about
      vendor executive conduct and customer complaints while systematically under-weighting regulatory
      enforcement disclosures that are published in OCC and FDIC enforcement action databases;
      OCC Bulletin 2023-17's ongoing monitoring requirement for adverse news is not satisfied
      by a tool that does not specifically monitor the regulatory enforcement channels where
      material vendor risk events are disclosed.`,
    keywords: ['OCC Bulletin 2023-17', 'AI adverse news monitoring', 'regulatory enforcement tracking', 'TPRM', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3312',
    name: `Generative AI Used to Draft Vendor Due Diligence Reports Without Human SME Verification`,
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's TPRM team uses a generative AI tool to draft vendor due diligence assessment
      reports that are submitted to the TPRM committee as the basis for vendor approval decisions;
      the AI-drafted reports are reviewed by TPRM analysts for formatting but not for factual
      accuracy against the underlying vendor documentation, and in two recent assessments the
      AI-generated reports cited regulatory provisions that do not exist and misrepresented the
      vendor's SOC 2 audit scope. OCC Bulletin 2023-17 requires that pre-contract due diligence
      records be accurate and complete; using AI-generated reports without SME verification of
      the regulatory and technical claims creates a systematic risk that the TPRM committee
      approves vendor relationships based on materially inaccurate due diligence assessments.`,
    keywords: ['OCC Bulletin 2023-17', 'generative AI due diligence', 'AI hallucination', 'TPRM', 'vendor approval'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3313',
    name: `AI Vendor Risk Scoring Lacks Temporal Recalibration — Stale Scores Drive Oversight Decisions`,
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AI vendor risk scoring system assigns quarterly risk scores to all vendor
      relationships based on financial health, cybersecurity posture, and performance signal inputs;
      the underlying scoring model has not been recalibrated since implementation 22 months ago,
      and the model's weighting of input signals has not been updated to reflect the bank's
      experience with vendor risk events — including two vendor cybersecurity incidents and one
      vendor financial distress situation — that occurred after model deployment and would provide
      valuable model performance data. SR 11-7 requires ongoing performance monitoring and
      recalibration for models used in risk management decisions; a vendor risk scoring model
      that has not been recalibrated against actual vendor risk outcomes produces risk scores that
      may not reflect the current risk-signal importance distribution for the bank's vendor
      portfolio.`,
    keywords: ['SR 11-7', 'AI vendor risk scoring', 'model recalibration', 'OCC Bulletin 2023-17', 'model drift'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3314',
    name: `AI Procurement Spend Analytics Tool Misidentifies Critical Vendor Relationships as Commodity`,
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's finance function uses an AI spend analytics platform to categorise vendor
      expenditure by spend tier and service category; the AI model classifies vendors by invoice
      amount and purchase order description rather than regulatory criticality, and has categorised
      two technology vendors that provide critical-activity services — BSA/AML alert management
      and payment gateway connectivity — as commodity IT infrastructure vendors based on their
      contract structure and invoice descriptions. The spend analytics AI classification feeds
      into procurement's vendor management workflow, where commodity-classified vendors receive
      a simplified renewal process that bypasses TPRM full due diligence review; OCC Bulletin
      2023-17 criticality should be determined by service function and risk impact, not by AI
      spend category classification.`,
    keywords: ['OCC Bulletin 2023-17', 'AI spend analytics', 'vendor classification', 'procurement risk', 'TPRM'],
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3315',
    name: `AI-Assisted Fourth-Party Risk Mapping Tool Misses Non-API Subcontractor Dependencies`,
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deployed an AI-powered fourth-party risk mapping tool that infers subcontractor
      dependencies from API traffic analysis and vendor-disclosed data flows; the tool systematically
      misses fourth-party dependencies that are not expressed as API integrations — including human
      data processing subcontractors, physical document handling vendors, and on-site professional
      services firms whose involvement in bank data processing is not visible in digital traffic.
      OCC Bulletin 2023-17's fourth-party risk requirements encompass all subcontractors involved
      in performing services for the bank, not only those with digital integration points; an AI
      fourth-party mapping tool calibrated to digital data flows produces a structurally incomplete
      fourth-party inventory that excludes the non-digital subcontractor dependencies that
      frequently pose the most significant data privacy and BSA/AML risks.`,
    keywords: ['OCC Bulletin 2023-17', 'AI fourth-party mapping', 'subcontractor discovery', 'TPRM', 'fourth-party risk'],
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3316',
    name: `AI-Powered SLA Monitoring Dashboards Not Linked to TPRM Escalation Workflow`,
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital deployed an AI observability platform that monitors real-time SLA performance
      for eight critical vendor API integrations, surfacing anomalies such as elevated error rates,
      latency spikes, and availability degradation with predictive alerting; the platform alerts
      go to the bank's infrastructure operations team but are not integrated with the TPRM
      escalation workflow, so persistent SLA performance issues detected by the AI monitoring
      system do not trigger the vendor risk tier reassessment or TPRM committee notification that
      OCC Bulletin 2023-17's ongoing monitoring requirements mandate. Technology monitoring data
      is one of the most timely signals of vendor risk deterioration available; an AI monitoring
      tool that generates performance insights that never reach the TPRM governance function
      produces compliance-relevant data that is invisible to the oversight process that is
      required to act on it.`,
    keywords: ['OCC Bulletin 2023-17', 'AI SLA monitoring', 'TPRM escalation', 'vendor performance analytics', 'ongoing monitoring'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3317',
    name: `Large Language Model Used for Regulatory Change Monitoring Misses TPRM-Specific Guidance Updates`,
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's compliance function uses a commercial large language model service to scan
      federal register publications, OCC bulletins, and interagency guidance for regulatory changes
      affecting the bank's compliance programme; the LLM has been configured with prompts tuned
      for credit, consumer protection, and capital regulation monitoring but not for TPRM-specific
      regulatory developments, resulting in missed alerts for OCC third-party risk examination
      procedure updates and FDIC third-party lending guidance that were directly relevant to the
      bank's consent order compliance obligations. LLM-based regulatory monitoring tools are only
      as effective as their domain configuration; a generative AI regulatory tracker that omits
      TPRM-relevant regulatory agency publications creates a monitoring blind spot for exactly
      the regulatory category where First Capital has the most active compliance obligation.`,
    keywords: ['OCC Bulletin 2023-17', 'LLM regulatory monitoring', 'TPRM compliance tracking', 'generative AI', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3318',
    name: `AI-Powered Vendor Onboarding Workflow Bypasses Manual Review for Tier 2 Vendors Based on Score`,
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's AI-enhanced vendor onboarding platform auto-approves Tier-2 vendor onboarding
      when the AI risk score exceeds a threshold of 78/100, routing these vendors directly to
      contract execution without manual TPRM analyst review; the threshold was set based on the
      initial model calibration and has not been validated against actual outcomes — specifically
      whether vendors auto-approved at that threshold have demonstrated the expected level of
      performance and risk management quality. SR 11-7 requires that automated decision models
      be validated before deployment and monitored on an ongoing basis for outcome quality; an
      auto-approval threshold that has not been outcome-validated creates a risk that systematic
      model overconfidence in the 78–85 score range allows vendors with material risk deficiencies
      to be onboarded without human review, with the error invisible until a vendor incident occurs.`,
    keywords: ['SR 11-7', 'AI vendor onboarding', 'automated approval', 'OCC Bulletin 2023-17', 'TPRM model risk'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3319',
    name: `AI Chatbot Deployed for Vendor Security Questionnaire Intake Without Answer Verification Controls`,
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital implemented a conversational AI interface that allows vendor security teams to
      complete annual TPRM security questionnaires through a guided chatbot dialogue rather than
      a structured form; the chatbot accepts vendor-provided answers in natural language and maps
      them to questionnaire response fields, but does not implement verification steps — such as
      document upload requirements for high-risk answer categories or logic checks for internally
      inconsistent responses — that were present in the original structured questionnaire format.
      OCC Bulletin 2023-17 requires that vendor due diligence produce accurate and verifiable
      information about vendor risk posture; a conversational AI intake system that accepts
      unverified natural language responses without evidence-based verification produces a
      questionnaire record that is qualitatively easier to complete but substantively less
      verifiable than the structured format it replaced.`,
    keywords: ['OCC Bulletin 2023-17', 'AI questionnaire intake', 'vendor due diligence', 'TPRM', 'chatbot risk'],
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3320',
    name: `AI Concentration Risk Model Fails to Capture Cloud Provider Indirect Concentration`,
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI-powered concentration risk model calculates vendor concentration by
      aggregating direct contract spend and processing volume across vendor categories; the model
      does not analyse the cloud provider layer of the vendor stack, meaning that concentration
      in AWS, Azure, or GCP that is expressed through seven different vendor relationships — each
      appearing as an independent vendor in the model — is not recognised as a single cloud
      provider concentration risk. OCC Bulletin 2023-17 and the OCC's cloud concentration guidance
      require banks to assess indirect concentration through shared underlying infrastructure;
      an AI concentration model that operates only at the direct vendor relationship layer
      systematically underestimates cloud infrastructure concentration, which has been identified
      by OCC examiners as one of the most significant systemic concentration risks in the
      banking sector.`,
    keywords: ['OCC Bulletin 2023-17', 'AI concentration risk model', 'cloud concentration', 'SR 11-7', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3321',
    name: `AI Exit Cost Modelling Tool Trained on Large-Bank Data Overestimates First Capital Transition Costs`,
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's TPRM programme uses an AI exit cost estimation model to project the cost
      of exiting critical vendor relationships in exit planning and board reporting; the model was
      trained on transition cost data from large US banks with complex enterprise architectures,
      and systematically overestimates exit costs for First Capital's regional bank environment
      by a factor of 2.5–3.5x, causing the board to assess some vendor exits as financially
      infeasible that would actually be manageable within the bank's operational budget. SR 11-7
      requires that models be validated for fitness-of-purpose in the context where they are applied;
      an AI exit cost model trained on a non-representative large-bank dataset and not validated
      against First Capital's actual historical transition costs produces board risk reporting that
      overstates the exit barriers for critical vendors.`,
    keywords: ['SR 11-7', 'AI exit cost modelling', 'board risk reporting', 'OCC Bulletin 2023-17', 'TPRM'],
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3322',
    name: `AI Vendor Financial Health Predictor Not Validated for Fintech Early-Warning Accuracy`,
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's TPRM ongoing monitoring programme uses an AI-powered financial health scoring
      tool to predict the likelihood of vendor financial distress; the model was validated on a
      dataset of publicly traded large-cap companies and has never been tested for predictive
      accuracy on private fintech vendors, which constitute 11 of the bank's 34 critical-activity
      vendors and have a financial profile — high growth, negative EBITDA, venture capital funded —
      that is structurally different from the model's training population. OCC Bulletin 2023-17
      requires ongoing monitoring proportional to risk; an AI financial health predictor that
      was never validated on private fintech company financial profiles systematically produces
      unreliable early-warning signals for the vendor category that presents the most acute
      financial distress risk in First Capital's critical vendor portfolio.`,
    keywords: ['SR 11-7', 'AI financial health predictor', 'fintech vendor risk', 'OCC Bulletin 2023-17', 'model validation'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3323',
    name: `AI TPRM Audit Report Generator Produces Documentation That Cannot Satisfy OCC Examiner Evidence Standards`,
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital uses a generative AI documentation tool to produce TPRM audit reports from
      meeting notes, questionnaire responses, and monitoring data; the AI-generated reports
      present findings narratively without the source citations, evidence cross-references, and
      analytical methodology documentation that OCC examiners require when evaluating TPRM
      programme quality during examination. OCC examination procedures for TPRM review require
      that audit and assessment reports demonstrate a clear analytical trail from evidence to
      conclusion; AI-generated reports that synthesise inputs into polished narratives without
      preserving the evidence chain produce documentation that reads well but fails OCC evidence
      standards, requiring extensive remediation to reconstruct the underlying analytical basis
      during examination preparation.`,
    keywords: ['OCC Bulletin 2023-17', 'AI audit report generation', 'OCC examination evidence', 'TPRM documentation', 'generative AI'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3324',
    name: `AI-Driven Vendor Contract Negotiation Tool Accepts Non-Standard Clauses Without TPRM Review`,
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's legal team uses an AI contract negotiation assistance tool that suggests
      standard contract clause language and accepts vendor redline proposals against a library
      of pre-approved clause variants; the tool's pre-approved clause library was not built to
      include all the contractual provisions required by OCC Bulletin 2023-17, so vendor redlines
      that remove required provisions — such as audit rights, sub-contracting notification
      obligations, or incident reporting timelines — may be accepted by the AI tool as
      within-variance variations of the approved clause library. OCC Bulletin 2023-17's required
      contractual provisions must be present in executed contracts for critical-activity vendors;
      an AI negotiation tool that can accept the removal of required provisions without flagging
      them for TPRM review creates a systematic contract compliance gap in the bank's most
      important vendor agreements.`,
    keywords: ['OCC Bulletin 2023-17', 'AI contract negotiation', 'TPRM contractual provisions', 'vendor contract', 'legal AI'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3325',
    name: `AI TPRM Prioritisation Engine Deprioritises Regulatory Examination-Driven Vendors in Favour of Spend`,
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's AI-powered TPRM prioritisation tool ranks vendor oversight effort allocation
      by a composite score that weights contract spend volume heavily; this weighting causes high-
      spend commodity vendors to receive the same or higher oversight priority as low-spend but
      OCC-examination-critical BSA/AML and model risk vendors that are the specific focus of the
      bank's consent order remediation obligations. OCC Bulletin 2023-17 requires that TPRM
      oversight intensity be proportional to the criticality of the vendor to the bank's operations
      and regulatory compliance obligations, not to spend volume; an AI prioritisation model
      calibrated to spend systematically under-resources oversight for the exact vendor category
      that OCC examiners will scrutinise most intensively in the bank's next examination.`,
    keywords: ['SR 11-7', 'AI TPRM prioritisation', 'OCC Bulletin 2023-17', 'consent order', 'model risk management'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3326',
    name: `Agentic AI Deployed in TPRM Workflow Executes Vendor Tier Changes Without Human Approval Gate`,
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital piloted an agentic AI system in its TPRM operations workflow that autonomously
      processes adverse news alerts, queries the vendor risk scoring system, and — when it determines
      a vendor's score has declined below a threshold — automatically executes a tier downgrade in
      the TPRM platform and schedules an enhanced monitoring review without requiring human approval
      of the tier change decision. OCC Bulletin 2023-17 requires that risk management decisions with
      material impact on vendor oversight be made with appropriate human governance accountability;
      agentic AI that executes vendor tier changes without a human approval gate removes the
      TPRM committee from the oversight decision loop, creating a governance model where an algorithm
      is making risk classification decisions that OCC examiners will hold human management
      accountable for.`,
    keywords: ['OCC Bulletin 2023-17', 'agentic AI TPRM', 'autonomous risk decisions', 'SR 11-7', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B3327',
    name: `AI-Powered BCM Stress Test Simulation Does Not Model Vendor Correlated Failure Scenarios`,
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital uses an AI-powered business continuity modelling platform to simulate vendor
      failure scenarios and test recovery time objectives; the AI model simulates individual vendor
      failures in isolation and does not model correlated failure scenarios — such as a cloud provider
      outage simultaneously impairing multiple critical vendor services, or a financial sector
      cybersecurity event cascading across multiple interdependent fintech vendors. FFIEC Business
      Continuity Management Handbook and OCC Bulletin 2023-17 require that continuity planning
      address systemic and correlated risks; an AI simulation tool that models only independent
      vendor failures while excluding correlated scenarios systematically produces BCM plans that
      are under-tested for the most damaging real-world resilience events and creates false confidence
      in the bank's recovery capability.`,
    keywords: ['OCC Bulletin 2023-17', 'AI BCM simulation', 'correlated failure', 'FFIEC Business Continuity Handbook', 'vendor resilience'],
    demoRelevant: true,
    subTopic: 'ai-tprm-part4',
    aiInsertionRisk: true,
  },

  // ── Supply Chain Attack ───────────────────────────────────────────────────
  {
    code: 'B3328',
    name: `Software Supply Chain Attack Via Core Banking Vendor Update Not Detected by Network Monitoring`,
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's core banking platform receives automated software updates from the platform
      vendor via an authenticated update channel; the bank's network monitoring and endpoint
      detection tools are not configured to inspect the content of vendor-authenticated update
      packages, meaning a SolarWinds-style supply chain compromise of the core banking vendor's
      build pipeline would deliver malicious code to the bank's production environment through
      an update package that passes the bank's authentication validation. OCC Bulletin 2023-17
      and CISA guidance on software supply chain security require banks to assess the security of
      software supply chains for critical vendor products; exclusive reliance on vendor package
      authentication without content inspection creates a detection gap for exactly the supply
      chain attack vector that has caused the largest financial sector breaches in the past
      five years.`,
    keywords: ['OCC Bulletin 2023-17', 'software supply chain attack', 'CISA', 'core banking vendor', 'TPRM'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3329',
    name: `Open-Source Dependency in Critical Vendor Product Exploited — No Vendor SBOM Provided`,
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's fraud detection platform vendor incorporates open-source components —
      including authentication libraries, data serialisation frameworks, and cryptographic utilities
      — that are subject to known critical vulnerabilities disclosed in CISA's Known Exploited
      Vulnerabilities catalogue; the vendor has not provided a software bill of materials that
      would allow the bank to independently identify whether the deployed version of the platform
      contains the vulnerable components and whether vendor patch deployment is aligned with the
      bank's patching SLA obligations. FFIEC cybersecurity examination guidance and OCC Bulletin
      2023-17 require banks to assess software security risks in critical vendor products; without
      a vendor-provided SBOM, First Capital cannot determine its exposure to open-source
      component vulnerabilities that are actively exploited against financial sector targets.`,
    keywords: ['OCC Bulletin 2023-17', 'SBOM', 'CISA KEV', 'open-source vulnerability', 'supply chain attack'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3330',
    name: `MFT Software Vulnerability Exploited in Vendor Managed File Transfer — Data Exfiltration Event`,
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's payment reconciliation vendor uses a managed file transfer platform —
      analogous to MOVEit Transfer or GoAnywhere MFT — to exchange batch settlement files with
      the bank; the MFT platform had a known zero-day vulnerability that the vendor had not
      patched within the bank's contractually required 30-day critical-vulnerability remediation
      timeline, and a threat actor exploited the vulnerability to access 18 months of settlement
      file data before detection. OCC Bulletin 2023-17's cybersecurity monitoring and patching
      SLA requirements are designed to prevent exactly this scenario; the absence of bank-side
      monitoring of vendor patch compliance for the specific software applications involved in
      bank data processing means the bank's first awareness of the vulnerability was the breach
      notification, not the vendor's patch deployment.`,
    keywords: ['OCC Bulletin 2023-17', 'MFT vulnerability', 'MOVEit', 'supply chain attack', 'TPRM cybersecurity'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3331',
    name: `Third-Party Developer Credential Compromise Provides Lateral Access to Bank-Connected Systems`,
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's core banking integration vendor maintains developer accounts with direct
      database access to the bank's integration layer for support and patching purposes; the
      vendor's development team uses shared credential sets that are not managed through a
      privileged access management platform with session recording and just-in-time access
      provisioning. OCC Bulletin 2023-17 requires that banks establish access controls that
      limit vendor system access to the minimum required for the contracted service and include
      monitoring of vendor privileged access; a credential compromise at the vendor's development
      team — the primary attack vector in high-profile banking supply chain incidents — would
      provide an attacker with unmonitored privileged access to the bank's integration environment
      through the vendor's compromised developer account.`,
    keywords: ['OCC Bulletin 2023-17', 'privileged access management', 'credential compromise', 'supply chain attack', 'vendor access control'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3332',
    name: `NPM Package Dependency Poisoning in Internal Developer Toolchain Used for Core System Scripts`,
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's technology team uses open-source NPM packages in internal development scripts
      for core system configuration, database migration, and API integration scaffolding; the bank
      has no software composition analysis process that scans NPM dependencies for dependency
      confusion attacks or typosquatting, and internal developer workstations are not isolated from
      the production deployment pipeline. FFIEC cybersecurity guidance and CISA's software supply
      chain security advisory require organisations to implement controls against dependency
      confusion and package poisoning attacks; a malicious NPM package installed through a
      typosquatting or dependency confusion attack on a developer workstation connected to the
      production deployment pipeline could introduce malicious code into core system configuration
      without triggering the bank's standard change management controls.`,
    keywords: ['CISA', 'NPM dependency confusion', 'software supply chain', 'OCC Bulletin 2023-17', 'FFIEC cybersecurity'],
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3333',
    name: `CI/CD Pipeline of Critical Vendor Not Assessed for Build-Time Compromise Risk`,
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's TPRM due diligence questionnaire does not include questions about the
      security of critical vendors' software build and deployment pipelines — specifically whether
      vendors use code signing for build artefacts, maintain immutable build logs, implement
      developer access controls on the CI/CD system, and conduct supply chain security assessments
      of their own development toolchain. OCC Bulletin 2023-17's cybersecurity due diligence scope
      does not explicitly enumerate CI/CD pipeline security, but CISA's guidance on software supply
      chain security and NIST SP 800-218 (Secure Software Development Framework) establish that
      build pipeline security is a critical component of software supply chain risk; a critical
      vendor whose CI/CD pipeline is compromised can inject malicious code into bank-deployed
      software without any artefact-level signal that would trigger the bank's standard
      vulnerability monitoring.`,
    keywords: ['OCC Bulletin 2023-17', 'CI/CD security', 'NIST SP 800-218', 'supply chain attack', 'build pipeline'],
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3334',
    name: `Supply Chain Compromise of IT Infrastructure Management Tool Provides Network-Wide Lateral Movement`,
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital uses a network management and monitoring platform from a third-party vendor
      that has broad read-write access across the bank's network infrastructure for configuration
      management and telemetry collection; a supply chain compromise of this vendor's management
      platform — through the attack pattern used in the SolarWinds SUNBURST incident — would
      provide an attacker with authenticated network-wide access to the bank's entire IT environment
      through the monitoring system's elevated privileges. OCC cybersecurity examination guidance
      and CISA emergency directives have specifically identified network management and monitoring
      platforms as high-priority supply chain attack targets due to their broad access and trust
      level; First Capital has not implemented network segmentation controls that would limit
      the blast radius of a network management platform compromise.`,
    keywords: ['OCC Bulletin 2023-17', 'SolarWinds supply chain', 'network management compromise', 'CISA', 'TPRM cybersecurity'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3335',
    name: `Vendor Remote Access Path Not Isolated — Third-Party VPN Compromise Reaches Core Banking Subnet`,
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's eight critical technology vendors connect to the bank's production environment
      through a shared remote access VPN architecture; vendor sessions terminate on a shared network
      segment that is not micro-segmented by vendor or function, meaning a credential compromise
      of any vendor's VPN account provides lateral movement access to the bank's core banking,
      payment processing, and BSA/AML system subnets. OCC Bulletin 2023-17's access control
      requirements and FFIEC cybersecurity guidance require that vendor remote access be limited to
      the specific systems and functions required for the contracted service; a shared vendor VPN
      architecture without per-vendor subnet isolation represents a systemic access control failure
      where any vendor credential compromise becomes a bank-wide security incident rather than a
      scoped vendor access incident.`,
    keywords: ['OCC Bulletin 2023-17', 'vendor VPN access', 'network micro-segmentation', 'FFIEC cybersecurity', 'supply chain attack'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3336',
    name: `Hardware Supply Chain Risk Not Assessed for Bank ATM and Branch Technology Procurement`,
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital procures ATM hardware, network switches, and server infrastructure from
      distributors without requiring original equipment manufacturer attestation or conducting
      hardware supply chain risk assessments; the TPRM due diligence process for hardware
      procurement does not address CISA guidance on hardware supply chain risk, counterfeit
      component risks, or the risk of hardware firmware manipulation by a compromised distributor
      in the supply chain. CISA's hardware supply chain security guidance and the FFIEC Cybersecurity
      Assessment Tool both identify hardware supply chain risk as a material threat to banking
      infrastructure; ATMs connected to the bank's payment processing network that contain
      counterfeit or firmware-manipulated components represent a specific hardware supply chain
      attack vector that the bank's TPRM programme has not assessed because the programme focuses
      on software and service vendors rather than hardware suppliers.`,
    keywords: ['OCC Bulletin 2023-17', 'hardware supply chain', 'CISA', 'ATM security', 'FFIEC Cybersecurity Assessment Tool'],
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3337',
    name: `Shared Managed Security Service Provider Compromised — Bank Loses Incident Detection Capability`,
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital outsources its 24x7 security operations centre function to a managed security
      service provider that also serves 40 other financial institutions; the MSSP's own security
      programme has not been independently audited by the bank and the bank's incident response
      plan assumes the MSSP will be operational and uncompromised during any security incident —
      an assumption that is invalidated if the MSSP itself is the target of a supply chain attack
      or a threat actor who targets the MSSP specifically to gain access to its financial institution
      client network telemetry. OCC Bulletin 2023-17 and OCC guidance on operational resilience
      require banks to maintain incident detection and response capability that is independent of
      any single critical vendor; outsourcing the entire SOC function to a single MSSP without a
      backup incident monitoring capability creates a single point of failure in the bank's security
      detection architecture.`,
    keywords: ['OCC Bulletin 2023-17', 'MSSP supply chain', 'SOC outsourcing', 'incident detection', 'TPRM operational resilience'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3338',
    name: `XZ Utils-Style Embedded Malware Risk in Core Banking Platform Open-Source Dependencies`,
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's core banking platform incorporates a layer of open-source compression,
      cryptographic, and serialisation libraries whose maintenance is performed by small volunteer
      maintainer communities; following the XZ Utils supply chain attack disclosure in 2024, where
      a threat actor spent two years establishing maintainer trust before injecting a backdoor, the
      bank has not assessed whether its critical vendor's open-source dependency inventory includes
      libraries maintained by similarly small maintainer communities that present the same social
      engineering vulnerability. CISA's secure-by-design guidance and NIST SP 800-218 identify
      understaffed open-source project maintainer capture as a supply chain attack vector; a bank
      operating core processing infrastructure with undisclosed open-source dependencies from
      small-maintainer-community libraries cannot assess its exposure to this attack vector without
      a vendor-provided SBOM and an open-source dependency risk assessment.`,
    keywords: ['CISA', 'XZ Utils supply chain', 'SBOM', 'open-source maintainer risk', 'NIST SP 800-218'],
    subTopic: 'supply-chain-attack',
  },
  {
    code: 'B3339',
    name: `AI-Powered Threat Detection Vendor Supply Chain Compromise Creates Detection Blind Spot`,
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's primary threat detection and response capability is delivered by an AI-powered
      security vendor whose platform uses machine learning models to detect anomalous behaviour
      across the bank's network, endpoint, and application layers; a supply chain compromise of
      the security vendor's model update infrastructure — injecting adversarial perturbations into
      model weights via a compromised build pipeline — could cause the detection platform to
      systematically fail to alert on the specific behaviours of the threat actor who performed
      the compromise. CISA's guidance on AI supply chain security and OCC cybersecurity examination
      guidance require banks to assess the security of their cybersecurity vendor's own development
      and model update infrastructure; an AI security vendor whose model update pipeline is
      compromised represents a particularly severe supply chain risk because the compromised
      tool is simultaneously the bank's primary defence and the attacker's point of access.`,
    keywords: ['OCC Bulletin 2023-17', 'AI security vendor supply chain', 'CISA', 'model update compromise', 'supply chain attack'],
    demoRelevant: true,
    subTopic: 'supply-chain-attack',
    aiInsertionRisk: true,
  },

];
