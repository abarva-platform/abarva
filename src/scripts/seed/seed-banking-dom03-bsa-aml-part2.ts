// seed-banking-dom03-bsa-aml-part2.ts
// Banking genome patterns — BSA/AML & Financial Crime Compliance
// Code range: B760–B819  (60 patterns)
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
}

export const BANKING_BSA_AML_PART2_PATTERNS: PatternSeed[] = [

  // ── SAR Quality ───────────────────────────────────────────────────────────
  {
    code: 'B760',
    name: 'SAR Narrative Omits Suspect Identification Fields Required by FinCEN',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `SAR narratives submitted by First Capital routinely omit the suspect identification
      section — name, address, date of birth, and TIN — because analysts treat the structured data
      fields and the free-text narrative as separate submissions, leaving the narrative without the
      specific party identifications FinCEN's SAR guidance mandates for law enforcement utility.
      OCC examiners reviewing a 90-day SAR sample found that 44% of narratives would be unusable
      by law enforcement without additional contact with the bank, a deficiency that undermines
      the core intelligence-sharing purpose of the Bank Secrecy Act.`,
    keywords: ['SAR narrative', 'FinCEN', 'BSA', 'OCC', 'suspect identification', 'AML'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B761',
    name: 'SAR Narrative Template Produces Formulaic Boilerplate Without Case Facts',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital's AML team uses a shared SAR narrative template that pre-populates
      standard language about transaction patterns, causing analysts to replace individual case facts
      with template boilerplate — FinCEN's SAR guidance states that the narrative must contain
      specific articulable facts about the suspicious activity, not generic descriptions of typologies.
      OCC examination teams have cited formulaic SAR narratives as evidence that the AML program
      lacks the analytical depth to support meaningful law enforcement referrals, and a
      pattern of boilerplate filings can result in FinCEN reducing the weight assigned to the
      bank's SAR submissions in national intelligence analyses.`,
    keywords: ['SAR narrative', 'FinCEN', 'AML', 'BSA', 'OCC', 'SAR quality'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B762',
    name: 'SAR Filing Threshold Set Below Statutory Minimum Without Documented Rationale',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description: `First Capital files SARs on transactions as low as $2,000 for certain customer
      segments — below the $5,000 mandatory SAR threshold under 31 U.S.C. 5318(g) — without
      a documented risk-based rationale explaining why voluntary filings at lower thresholds
      serve the bank's AML program rather than simply inflating SAR volume. FinCEN has noted
      that over-filing reduces the signal-to-noise ratio in the national SAR database and can
      be treated as evidence that the bank does not have a risk-calibrated threshold strategy;
      OCC examination teams verify that threshold decisions below the statutory floor are
      supported by written risk acceptance and BSA Officer approval.`,
    keywords: ['SAR', 'FinCEN', 'BSA', 'OCC', 'filing threshold', 'AML'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },
  {
    code: 'B763',
    name: 'Continuing Activity SAR 90-Day Review Cadence Not Documented in Policy',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `FinCEN guidance requires financial institutions to file continuation SARs every
      90 days when suspicious activity persists after an initial SAR filing, but First Capital's
      BSA policy does not codify the 90-day continuation cadence or establish a workflow to
      automatically surface cases due for continuation review. Analysts close initial SAR cases
      at filing without scheduling a re-evaluation, meaning ongoing criminal activity by high-risk
      customers is reported once and then falls below the program's radar — a gap OCC examiners
      specifically test using case management audit trails.`,
    keywords: ['SAR', 'FinCEN', 'AML', 'BSA', 'continuing activity', 'OCC'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B764',
    name: 'SAR Confidentiality Breach Risk From Shared Investigative Notes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's AML investigators use a shared case management platform where
      SAR filing notes and subject-account identifiers are visible to relationship managers in
      the commercial banking group — disclosure of SAR existence or content to any person other
      than an authorized recipient violates 31 U.S.C. 5318(g)(2), which prohibits tipping off
      subjects that a SAR has been filed. The absence of access controls that separate the AML
      investigation workflow from relationship manager views is a structural SAR confidentiality
      risk that OCC and FinCEN examiners treat as a program deficiency requiring immediate
      remediation.`,
    keywords: ['SAR confidentiality', 'FinCEN', 'BSA', 'OCC', 'AML', 'tipping off'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },
  {
    code: 'B765',
    name: 'SAR Withdrawal and Refiling Process Not Documented or Tracked',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `First Capital occasionally discovers errors in filed SARs — incorrect account
      numbers, wrong reporting period, or missing subject fields — but has no documented procedure
      for amending or refiling the deficient SAR through FinCEN's BSA E-Filing system. FinCEN's
      SAR instructions describe the amendment process for material errors and require that the
      bank maintain a record of both the original and amended filing; the absence of a SAR
      correction procedure means errors persist in FinCEN's database and the bank cannot
      demonstrate audit control over its filing record to OCC examiners.`,
    keywords: ['SAR', 'FinCEN', 'BSA', 'OCC', 'SAR amendment', 'AML'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },
  {
    code: 'B766',
    name: 'SAR Quality Review Program Absent for Second-Line Oversight',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's BSA compliance function does not have a formal SAR quality
      review program in which a second-line reviewer samples filed SARs for narrative completeness,
      factual accuracy, and threshold calibration — all SAR filings are treated as final once
      submitted by the analyst, without a supervisory sign-off step. OCC examination standards
      and FinCEN program guidance both identify quality control over SAR content as a core
      element of an effective AML program; a SAR program without structured quality review
      provides no assurance that the filings accurately represent the suspicious activity detected.`,
    keywords: ['SAR quality', 'FinCEN', 'OCC', 'AML', 'BSA', 'second-line oversight'],
    demoRelevant: true,
    subTopic: 'sar-quality',
  },

  // ── CTF and Sanctions Compliance ─────────────────────────────────────────
  {
    code: 'B767',
    name: 'CTF Typology Coverage Gap in Transaction Monitoring Scenarios',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's transaction monitoring scenario library addresses traditional
      money laundering typologies but does not include counter-terrorism financing (CTF)
      indicators — small, frequent transactions to high-risk jurisdictions by a customer with
      no apparent business purpose in those markets, prepaid card purchases in aggregate patterns
      consistent with FATF's CTF guidance, or remittance patterns to FATF-identified high-risk
      jurisdictions. FinCEN's national AML priorities designate terrorist financing as a primary
      priority, and OCC examination teams verify that an institution's scenario library addresses
      both ML and TF typologies in proportion to the bank's customer and transaction risk profile.`,
    keywords: ['CTF', 'FATF', 'AML', 'FinCEN', 'OCC', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B768',
    name: 'Nested Correspondent Banking Risk Not Assessed at Portfolio Level',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description: `First Capital maintains correspondent relationships with five regional banks
      that themselves have correspondent relationships with foreign banks in FATF gray-listed
      jurisdictions — the nested correspondent risk concentrates money laundering exposure from
      third-tier respondents without First Capital performing due diligence on the underlying
      correspondent chain. USA PATRIOT Act Section 312 enhanced due diligence requirements
      for foreign correspondent accounts include an obligation to assess the AML controls of
      respondent institutions; a nested chain where First Capital has no visibility beyond
      the first-tier respondent is a documented Section 312 compliance gap at multiple OCC
      examinations.`,
    keywords: ['correspondent banking', 'USA PATRIOT Act', 'FATF', 'AML', 'OCC', 'nested account'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B769',
    name: 'FATF High-Risk Jurisdiction List Not Integrated Into Transaction Monitoring Rules',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `FATF publishes updated lists of high-risk jurisdictions subject to enhanced
      monitoring and jurisdictions under increased monitoring on a quarterly basis, but First
      Capital's transaction monitoring system does not automatically update its jurisdiction
      risk scores when FATF revises these lists — risk scores for affected jurisdictions are
      updated manually during the annual scenario review cycle, leaving an average nine-month
      gap between FATF list changes and system updates. OCC examination guidance requires
      that jurisdiction risk be kept current with FATF, OFAC, and FinCEN designations; a manual
      update process that operates on an annual rather than a quarterly cycle is an AML
      program timeliness gap.`,
    keywords: ['FATF', 'AML', 'OCC', 'transaction monitoring', 'FinCEN', 'jurisdiction risk'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B770',
    name: 'De-Risking Decision Exits MSB Customers Without AML Risk Analysis',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital exited its money service business (MSB) customer portfolio
      as a blanket de-risking measure rather than applying risk-based enhanced due diligence
      consistent with FinCEN and OCC guidance that expressly discourages wholesale de-risking
      of entire customer categories. The decision was made by business leadership without a
      documented BSA Officer review or OCC consultation, and the bank now faces CFPB scrutiny
      for the potential disparate impact of its exit policy on immigrant communities
      disproportionately dependent on MSB remittance services — a compliance tension FinCEN
      has highlighted in multiple guidance documents on responsible innovation in AML.`,
    keywords: ['de-risking', 'MSB', 'FinCEN', 'OCC', 'AML', 'BSA'],
    demoRelevant: true,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B771',
    name: 'Proliferation Finance Indicators Not Covered in AML Scenario Library',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `FinCEN's 2022 national AML priorities include proliferation finance — transactions
      that facilitate the acquisition of weapons of mass destruction or advanced conventional weapons
      — as a primary priority, but First Capital has not added proliferation finance typology
      scenarios to its transaction monitoring library or its BSA risk assessment. Dual-use
      goods transactions, payments to technology vendors in sanctioned jurisdictions, and
      transactions referencing freight forwarders known to route to restricted-party entities
      are all FATF-identified PF indicators that the bank's scenario library currently misses,
      creating a policy-to-program implementation gap OCC examiners will test directly.`,
    keywords: ['proliferation finance', 'FinCEN', 'FATF', 'OCC', 'AML', 'BSA'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B772',
    name: 'Foreign Correspondent Termination Absent When Jurisdiction Downgraded by FATF',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `When FATF adds a jurisdiction to its list of high-risk jurisdictions subject
      to enhanced countermeasures, First Capital does not have a documented policy or workflow
      to evaluate whether existing correspondent relationships with banks in that jurisdiction
      should be terminated or subject to enhanced due diligence — the relationship review
      process is initiated only at the annual EDD renewal cycle, potentially 11 months after
      the FATF designation. USA PATRIOT Act Section 312 and FinCEN's correspondent banking
      guidance both require that institutions respond to material changes in respondent bank
      risk without waiting for a scheduled periodic review, and an annual-only trigger is
      insufficient for FATF-designated countermeasure jurisdictions.`,
    keywords: ['correspondent banking', 'FATF', 'USA PATRIOT Act', 'AML', 'OCC', 'EDD'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },

  // ── Trade-Based Money Laundering (TBML) ───────────────────────────────────
  {
    code: 'B773',
    name: 'Letter of Credit Documentation Review Lacks Price Benchmarking Step',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's trade finance team reviews letter of credit documentation
      for completeness but does not perform price benchmarking — comparing invoiced commodity
      prices to publicly available trade indices or customs databases — which is the primary
      detection mechanism for the over- and under-invoicing component of trade-based money
      laundering. FinCEN's advisory on TBML and the Wolfsberg Group's trade finance principles
      both require that LC-issuing banks maintain the capability to challenge invoiced prices
      against market data; a documentation review that verifies only formal completeness
      cannot detect the most common TBML mechanism.`,
    keywords: ['trade finance', 'TBML', 'FinCEN', 'AML', 'letter of credit', 'OCC'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B774',
    name: 'TBML Invoice Discrepancy Detection Absent in Commercial Banking Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital's commercial banking relationship managers process import/export
      financing requests using invoices submitted by customers, but there is no structured process
      to cross-reference invoices against customs clearance data, shipping manifests, or prior
      invoices from the same counterparty to detect multiple invoicing — a core TBML technique
      identified in the FATF Guidance on Trade-Based Money Laundering (2020, updated 2023).
      Multiple invoicing — submitting the same shipment invoice to multiple banks to obtain
      duplicate financing — is undetectable without cross-bank data sharing or systematic
      invoice sequencing review, and First Capital has neither capability operationalised.`,
    keywords: ['TBML', 'invoice discrepancy', 'FATF', 'AML', 'OCC', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B775',
    name: 'Shell Company Import/Export Patterns Not Linked to Beneficial Ownership Checks',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `Commercial customers using international trade finance facilities include
      several entities incorporated in secrecy jurisdictions — British Virgin Islands, Cayman
      Islands, Marshall Islands — where beneficial ownership is opaque, but First Capital's
      trade finance underwriting does not require UBO resolution as a condition of LC issuance.
      The intersection of shell-company corporate structure with high-volume import/export
      financing is one of the highest-risk TBML indicators in the FATF guidance, and
      FinCEN's AML national priorities specifically identify shell company exploitation of trade
      finance as a systemic financial crime risk requiring enhanced bank controls.`,
    keywords: ['TBML', 'beneficial ownership', 'CDD Rule', 'FATF', 'FinCEN', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B776',
    name: 'Trade Finance Portfolio Not Included in Enterprise AML Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital's enterprise BSA/AML risk assessment addresses consumer and
      standard commercial banking products in detail but mentions trade finance in one paragraph
      without quantifying exposure, customer risk profile, or associated typologies — the
      bank's trade finance book grew by 40% in the prior 24 months following the hiring of
      a specialized trade finance team, but the risk assessment has not been updated to reflect
      this growth. OCC examination standards require that the risk assessment accurately reflect
      all material business lines; a significantly underweighted treatment of a growing
      high-risk product category is a documented program governance gap.`,
    keywords: ['trade finance', 'AML', 'BSA', 'OCC', 'TBML', 'risk assessment'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B777',
    name: 'Dual-Use Goods Financing Not Flagged as High-Risk Trade Finance Activity',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital provides trade finance to customers who import dual-use
      goods — electronics components, industrial chemicals, precision machinery — without
      screening shipment descriptions against the Commerce Control List or BIS Entity List
      to identify goods with potential WMD-proliferation risk. FinCEN's proliferation
      finance guidance and FATF Recommendation 7 require financial institutions to implement
      targeted financial sanctions related to WMD proliferation; a trade finance workflow
      that does not cross-reference commodity descriptions with export control lists creates
      both AML and OFAC-adjacent proliferation finance exposure.`,
    keywords: ['dual-use goods', 'FATF', 'FinCEN', 'trade finance', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },

  // ── Crypto / VASP Correspondent Risk ─────────────────────────────────────
  {
    code: 'B778',
    name: 'VASP Correspondent Relationship Opened Without AML Program Assessment',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description: `First Capital provides banking services to virtual asset service providers
      (VASPs) — cryptocurrency exchanges, custodians, and payment processors — without
      conducting the VASP-specific AML due diligence that FinCEN's 2019 guidance on convertible
      virtual currency requires, including an assessment of the VASP's CDD procedures,
      transaction monitoring, and Travel Rule compliance. OCC examination guidance treats
      VASP relationships with the same enhanced due diligence scrutiny as MSB accounts;
      the bank's standard commercial CDD process does not capture the crypto-specific risk
      indicators that differentiate a compliant exchange from a high-risk unregistered VASP.`,
    keywords: ['VASP', 'FinCEN', 'AML', 'OCC', 'cryptocurrency', 'BSA'],
    demoRelevant: true,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B779',
    name: 'Crypto-to-Fiat Layering Detection Not Implemented for VASP Customer Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital's VASP banking customers regularly receive large fiat wire
      transfers that represent conversions of cryptocurrency positions, but the transaction
      monitoring system does not include scenarios calibrated to detect the rapid deposit
      and re-wiring pattern characteristic of crypto-to-fiat layering — a top-five money
      laundering typology in FinCEN's 2022 financial trend analysis. The absence of
      VASP-specific monitoring scenarios means that layering activity that would be detected
      in a traditional wire transfer context passes through the crypto-fiat interface
      undetected, precisely the gap FATF's 2021 updated Recommendation 15 guidance was
      designed to close.`,
    keywords: ['VASP', 'FATF', 'FinCEN', 'AML', 'crypto-fiat', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B780',
    name: 'FinCEN Travel Rule Compliance for Crypto Transfers Not Verified at Onboarding',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `FinCEN's Travel Rule (31 CFR 1010.410) requires VASPs to transmit originator
      and beneficiary information for crypto asset transfers above $3,000, but First Capital
      does not verify that its VASP customers have Travel Rule-compliant transmission
      infrastructure as part of onboarding due diligence. A VASP that receives fiat payments
      in exchange for crypto transactions that were executed without Travel Rule compliance
      exposes First Capital to AML risk as the receiving institution in a non-compliant
      transfer chain; OCC examiners have flagged this as a gap in institutions that bank
      VASPs without evaluating the VASP's own regulatory compliance posture.`,
    keywords: ['Travel Rule', 'FinCEN', 'VASP', 'AML', 'OCC', 'cryptocurrency'],
    demoRelevant: true,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B781',
    name: 'FATF Recommendation 15 VASP Registration Not Verified Before Account Opening',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `FATF Recommendation 15 requires that VASPs be registered or licensed with
      a domestic regulator, and FinCEN requires that money transmitters — the category under
      which most VASPs fall — register with FinCEN before conducting business; First Capital
      does not verify FinCEN registration status for VASP customers at account opening or
      at annual KYC review. An unregistered VASP operating through a U.S. bank account
      implicates the bank in facilitating unlicensed money transmission, an 18 U.S.C. 1960
      criminal exposure that FinCEN has specifically flagged as a BSA supervision priority
      for financial institutions serving the crypto industry.`,
    keywords: ['FATF R.15', 'FinCEN', 'VASP', 'AML', 'OCC', 'BSA'],
    demoRelevant: true,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B782',
    name: 'Blockchain Analytics Not Integrated Into VASP Transaction Monitoring Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital monitors VASP customer accounts using the same fiat-transaction
      monitoring rules applied to commercial banking customers, without subscribing to a
      blockchain analytics service that can trace the provenance of crypto assets converted
      to fiat within the bank. FinCEN's June 2021 financial trend analysis identified
      blockchain analytics as an essential tool for institutions banking VASPs, because the
      on-chain transaction history of crypto assets deposited into VASP accounts is
      visible and auditable in ways fiat transactions are not; a bank without blockchain
      analytics capability cannot perform the same risk assessment as peers who have
      integrated chain analysis into their VASP AML program.`,
    keywords: ['blockchain analytics', 'VASP', 'FinCEN', 'AML', 'OCC', 'transaction monitoring'],
    demoRelevant: false,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B783',
    name: 'Unhosted Wallet Transaction Exposure Not Included in BSA Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's VASP customers regularly receive fiat deposits from transactions
      that originated from unhosted (self-custody) wallets with no KYC-verified counterparty,
      but the bank's AML risk assessment does not address unhosted wallet exposure as a
      distinct risk category. FinCEN's proposed rulemaking on convertible virtual currency
      and digital asset transactions (2020) and FATF's 2021 guidance both identify unhosted
      wallet transactions as a high-risk indicator requiring enhanced due diligence; failure
      to address this category in the risk assessment means monitoring scenarios have not
      been calibrated to the specific risk of anonymous-counterparty crypto-to-fiat flows.`,
    keywords: ['unhosted wallet', 'FinCEN', 'FATF', 'VASP', 'AML', 'BSA'],
    demoRelevant: false,
    subTopic: 'crypto-vasp',
  },

  // ── Internal Financial Crime ──────────────────────────────────────────────
  {
    code: 'B784',
    name: 'Insider Threat Transaction Monitoring Scenarios Not Deployed',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's transaction monitoring program covers external customer
      activity but does not include scenarios designed to detect insider abuse — employees
      accessing customer accounts without transaction authority, relationship managers
      structuring customer deposits to avoid CTR filing, or operations staff approving
      their own wire transfers. FinCEN's guidance on bank employees' obligations under the
      BSA extends monitoring obligations to employee conduct, and OCC examination standards
      include insider fraud detection as a component of the overall BSA/AML program;
      the absence of employee-activity monitoring creates a systematic blind spot for
      the most common source of bank-facilitated financial crime.`,
    keywords: ['insider threat', 'AML', 'FinCEN', 'OCC', 'BSA', 'employee monitoring'],
    demoRelevant: true,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B785',
    name: 'Dual Control Gap for High-Value Wire Authorization',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `First Capital's wire transfer authorization policy requires dual control
      for wires above $500,000, but the operations platform allows a single operator to
      both initiate and release a wire if the second approver queue is empty — an
      exception designed for after-hours operations that was never restricted to designated
      business continuity scenarios. OCC Bulletin 2005-1 on internet banking and wire
      transfer controls requires that dual control be a hard system control, not a soft
      workflow rule that can be bypassed; the platform exception creates an insider fraud
      vector and a BSA internal controls gap that examiners will identify in a wire
      transfer audit.`,
    keywords: ['dual control', 'wire transfer', 'OCC', 'BSA', 'AML', 'internal controls'],
    demoRelevant: true,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B786',
    name: 'AML Function Employee Conflict of Interest Policy Not Enforced',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital's AML investigation team has no formal conflict of interest
      policy that prevents an analyst from working cases involving customers managed by
      a family member or close associate in the commercial banking group — three recent SAR
      decisions involved customers with documented relationship-manager connections to the
      analyst who closed the alert as non-suspicious. FinCEN guidance on AML program
      independence requires that the investigation function be insulated from business
      line influence; the absence of a recusal or conflict screening process is an
      AML program governance gap that OCC examiners can identify from case assignment records.`,
    keywords: ['conflict of interest', 'AML', 'FinCEN', 'OCC', 'BSA', 'program governance'],
    demoRelevant: true,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B787',
    name: 'Relationship Manager SAR Tipping-Off Exposure From Case System Access',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `Relationship managers at First Capital can query the AML case management
      system to check whether their commercial customers have open investigations,
      creating a systemic tipping-off risk — a relationship manager who sees a SAR
      investigation open on a key account could inadvertently or deliberately alert the
      customer, violating the 31 U.S.C. 5318(g)(2) anti-disclosure provision. The access
      control gap was introduced during a CRM integration project that merged case management
      data into the relationship portal for operational efficiency without a BSA Officer
      review of the access implications, a failure of the new product/system change
      process that OCC guidance requires to include a BSA/AML impact assessment.`,
    keywords: ['SAR confidentiality', 'AML', 'FinCEN', 'OCC', 'BSA', 'tipping off'],
    demoRelevant: true,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B788',
    name: 'Fictitious Employee Account Scheme Not Covered by Payroll AML Controls',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `First Capital's payroll processing for its own employees is not included
      in the scope of the internal AML monitoring program — the transaction monitoring system
      covers customer accounts but not the bank's own employee payroll and expense
      reimbursement ledgers, creating a gap through which fictitious employee accounts,
      ghost vendor payments, and overstated expense schemes can operate undetected. OCC
      and FinCEN guidance does not explicitly require banks to AML-monitor their own
      payroll, but internal audit best practice and the BSA requirement for adequate internal
      controls extend to the full population of accounts and transactions processed by the
      institution.`,
    keywords: ['insider fraud', 'AML', 'BSA', 'OCC', 'internal controls', 'payroll fraud'],
    demoRelevant: false,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B789',
    name: 'Loan Officer Straw Borrower Pattern Not in Fraud-AML Monitoring Scope',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `Transaction monitoring for First Capital's commercial loan portfolio does
      not include scenarios designed to detect straw borrower arrangements — loans nominally
      held in the name of a borrower who does not control the funds, a common insider-fraud
      and money laundering technique used to circumvent lending limits or hide the identity
      of the actual loan beneficiary. FinCEN typologies on bank fraud and money laundering
      specifically identify straw borrower schemes as an intersection of credit fraud and
      BSA/AML that requires coordinated monitoring across loan origination and disbursement
      transaction flows.`,
    keywords: ['straw borrower', 'AML', 'FinCEN', 'OCC', 'BSA', 'loan fraud'],
    demoRelevant: false,
    subTopic: 'internal-financial-crime',
  },

  // ── AI / AML Advanced ─────────────────────────────────────────────────────
  {
    code: 'B790',
    name: 'AI Transaction Monitoring Tuning Methodology Not Documented per OCC 2010-24',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital deployed an AI-driven transaction monitoring system whose
      alert threshold parameters are optimized automatically by a machine learning feedback
      loop, but the bank has no documented tuning methodology that satisfies OCC 2010-24's
      requirement for a written, back-tested threshold rationale — the ML optimization
      process produces threshold changes without generating the human-readable statistical
      justification that examiners review. FinCEN guidance on AML model tuning requires
      that institutions maintain documentation sufficient to explain threshold decisions to
      regulators; an AI system that silently adjusts thresholds without a documented
      rationale trail fails this standard even if the resulting thresholds are statistically
      better calibrated.`,
    keywords: ['AI transaction monitoring', 'OCC 2010-24', 'AML', 'FinCEN', 'BSA', 'tuning methodology'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B791',
    name: 'LLM SAR Narrative Review Without CAMS-Certified Analyst Oversight',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital uses a large language model to review and suggest edits to
      SAR narrative drafts before submission, but the AI-reviewed narratives bypass the
      CAMS-certified analyst quality review step that the bank's own BSA policy mandates for
      all SAR filings. FinCEN SAR guidance requires that the filing institution's BSA
      Officer or designated compliance professional certify the accuracy and completeness
      of the narrative; an LLM review that substitutes for credentialed human review
      creates a policy-compliance gap and an OCC examination finding risk when the bank
      cannot demonstrate that its AI-assisted filings received qualified human oversight.`,
    keywords: ['LLM', 'SAR narrative', 'FinCEN', 'CAMS', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B792',
    name: 'Generative AI Synthetic Typology Training Data Created Without Legal Review',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `First Capital's data science team used a generative AI tool to create
      synthetic transaction records representing money laundering typologies to augment
      ML model training data, but legal counsel was not consulted on whether generating
      synthetic representations of criminal financial activity constitutes a legal or
      regulatory risk — specifically whether synthetic data depicting currency structuring
      implicates BSA structuring prohibitions or whether training on synthetic SAR-adjacent
      data affects the bank's legal position in potential SAR-related litigation. SR 11-7
      model validation standards require that training data provenance and legal permissibility
      be documented, and a generative AI data augmentation approach without legal review
      leaves this requirement unmet.`,
    keywords: ['generative AI', 'synthetic training data', 'SR 11-7', 'AML', 'BSA', 'OCC'],
    demoRelevant: false,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B793',
    name: 'AI De-Risking Recommendation Engine Deployed Without Fair Banking Compliance Check',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital deployed an AI system that recommends account terminations
      based on AML risk scores, but the system was not reviewed by the bank's fair lending
      and fair banking compliance function before deployment — the model's customer-risk
      features correlate with demographic proxies (geography, business type, remittance
      frequency) in ways that could produce disparate impact on protected classes in
      violation of CFPB unfair, deceptive, or abusive acts or practices (UDAAP) standards.
      FinCEN and OCC have both issued guidance cautioning that AI-assisted de-risking models
      must be evaluated for civil rights and consumer protection implications before
      deployment, and the absence of a fair banking review is an SR 11-7 model governance gap.`,
    keywords: ['AI de-risking', 'CFPB', 'UDAAP', 'SR 11-7', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B794',
    name: 'Automated VASP Risk Scoring Without Examiner-Validated Methodology',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital uses an AI-driven VASP risk scoring tool purchased from a
      fintech vendor to assign risk ratings to its cryptocurrency business customers, but
      the vendor's scoring methodology has not been independently validated under SR 11-7
      and no OCC examiner or external model validator has reviewed the model's criteria,
      feature weights, or performance against known high-risk VASP outcomes. FinCEN's
      2019 guidance on virtual currency regulation and OCC model risk guidance both require
      that vendor-supplied models used in compliance decisions be subject to bank-level
      model validation; an AI VASP scoring tool that lacks SR 11-7 validation is an
      unvalidated compliance model — one of the most commonly cited examination deficiencies
      for banks with active crypto-business portfolios.`,
    keywords: ['VASP risk scoring', 'SR 11-7', 'FinCEN', 'OCC', 'AI', 'AML'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B795',
    name: 'AI SAR Pattern Detection Operating Outside of SR 11-7 Model Inventory',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `A third-party AI platform used by First Capital's AML team to identify
      SAR-worthy account behavior has never been registered in the bank's SR 11-7 model
      inventory — the tool was procured by the BSA compliance function as a SaaS subscription
      and was not subject to the technology risk assessment or model onboarding workflow
      required by OCC model risk guidance. Under SR 11-7, any quantitative tool that
      produces outputs that influence a compliance or risk decision is a model and must
      be inventoried, validated, and monitored; an AI SAR-detection platform operating
      outside the model inventory simultaneously violates SR 11-7 and OCC 2013-29 third-party
      risk management standards.`,
    keywords: ['SR 11-7', 'model inventory', 'AML', 'OCC 2013-29', 'AI', 'SAR'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B796',
    name: 'AI Alert Triage Copilot Reduces SAR Rate Without Human Oversight Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital deployed an AI copilot that assists analysts in triaging
      transaction monitoring alerts by pre-classifying alerts as low, medium, or high priority,
      but since deployment the overall SAR conversion rate has fallen by 35% without a
      documented analysis of whether the AI's pre-classification is suppressing medium-priority
      alerts that would previously have been escalated. SR 11-7 requires ongoing performance
      monitoring for models used in compliance workflows; a copilot tool that changes SAR
      behavior without performance measurement and documented human override protocol is
      operating outside of acceptable model governance standards and creates OCC examination
      risk.`,
    keywords: ['AI copilot', 'SR 11-7', 'SAR', 'AML', 'OCC', 'alert triage'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B797',
    name: 'Graph AI Network Expansion Model Lacks Documented Evidence-Quality Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's AML graph AI platform expands investigation networks by
      linking accounts sharing common attributes — address, phone, device fingerprint,
      IP address — without applying a minimum evidence-quality or confidence-score threshold
      to distinguish strong associative links (shared device and address with co-application)
      from weak coincidental links (shared IP address at a public WiFi location). SR 11-7
      model documentation requirements include specification of model assumptions, limitations,
      and output interpretation guidance; a graph AI system deployed without a documented
      evidence-quality threshold produces investigation queues that overwhelm analyst
      capacity and generates disparate-impact risk when link features correlate with
      customer demographics.`,
    keywords: ['graph AI', 'SR 11-7', 'AML', 'OCC', 'BSA', 'network analysis'],
    demoRelevant: false,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B798',
    name: 'NLP SAR Summary Tool Deployed Without FinCEN Guidance on AI-Assisted Filing',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `First Capital integrated an NLP summarization model into its SAR filing
      workflow to condense lengthy case file narratives, but deployment proceeded before
      FinCEN issued any guidance on the use of AI in SAR preparation — the bank does not
      have a documented position on whether AI-summarized SAR content satisfies the bank's
      obligation to ensure that the narrative accurately and completely represents the
      suspicious activity. FinCEN has flagged through informal examination guidance that
      AI tools in the SAR pipeline require human certification of accuracy; the absence of
      a formal policy on AI-assisted SAR preparation creates both regulatory uncertainty
      and a potential SAR quality deficiency.`,
    keywords: ['NLP', 'SAR', 'FinCEN', 'AML', 'OCC', 'AI-assisted filing'],
    demoRelevant: false,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B799',
    name: 'ML Model Risk Score Used as Sole SAR Decision Criterion Without Human Review',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's AML operations team configured the ML transaction monitoring
      platform so that accounts scoring above the 98th percentile risk score are automatically
      queued as SAR referrals without an analyst reviewing the underlying transaction evidence
      — the ML risk score is used as a SAR decision trigger rather than as a prioritization
      signal for human investigation. OCC guidance and FinCEN's SAR program expectations
      both require that the SAR decision involve human judgment from a trained analyst;
      an automated SAR referral pipeline driven solely by an ML score fails to meet the
      human-decision-maker standard and creates a BSA program deficiency in the bank's
      independent testing findings.`,
    keywords: ['ML model', 'SAR', 'FinCEN', 'OCC', 'AML', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },

  // ── Additional SAR Quality ─────────────────────────────────────────────────
  {
    code: 'B800',
    name: 'SAR Filed on Exited Customer Without Relationship Context in Narrative',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `When First Capital exits a customer relationship due to AML concerns, the
      termination SAR filed at account closure does not include the relationship history,
      earlier alert dispositions, or prior SARs filed on the account — FinCEN guidance
      on SAR narratives recommends including prior filing history and account context to
      allow law enforcement to understand the full scope of suspicious activity, not just
      the final triggering event. A termination SAR that describes only the closing
      transaction without the longitudinal account picture is less useful to law enforcement
      and may indicate to OCC examiners that the investigation file was not comprehensive.`,
    keywords: ['SAR narrative', 'FinCEN', 'AML', 'BSA', 'OCC', 'account termination'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },
  {
    code: 'B801',
    name: 'SAR Filer Identity Not Verified in FinCEN BSA E-Filing System Roles',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description: `First Capital has six employees with active FinCEN BSA E-Filing system
      credentials, including two former employees whose credentials were not revoked upon
      termination — SARs filed under former employee credentials remain valid submissions
      but create an audit integrity gap because the certifying officer named in the SAR
      is no longer employed by the institution. FinCEN requires that BSA E-Filing credentials
      be maintained under the control of active, authorized personnel; a credential management
      gap that allows former employees to retain active SAR filing authority is both a
      BSA security deficiency and an IT access control gap with OCC examination implications.`,
    keywords: ['FinCEN', 'BSA E-Filing', 'SAR', 'OCC', 'access control', 'AML'],
    demoRelevant: false,
    subTopic: 'sar-quality',
  },

  // ── Additional CTF / Sanctions ────────────────────────────────────────────
  {
    code: 'B802',
    name: 'OFAC Sectoral Sanctions Not Mapped to Commercial Banking Sector Codes',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `OFAC's sectoral sanctions programs — SSI lists targeting specific sectors
      of the Russian, Ukrainian, and Venezuelan economies — prohibit new debt and equity
      transactions with designated entities but do not prohibit all transactions; First
      Capital's sanctions screening system treats SSI entities identically to full SDN
      entries and blocks all transactions, including permissible ones, generating false
      positives that damage commercial relationships without providing additional legal
      protection. OFAC's guidance on SSI programs requires institutions to understand
      the nature of the prohibited transaction types for each sectoral sanction program;
      a binary block-all approach to SSI transactions reflects a lack of sanctions
      compliance program sophistication that OCC examiners can identify through transaction
      analysis.`,
    keywords: ['OFAC', 'sectoral sanctions', 'SDN', 'AML', 'OCC', 'BSA'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },
  {
    code: 'B803',
    name: 'Specially Designated Nationals Alert False Positive Rate Not Measured',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's OFAC screening system generates SDN alerts that analysts
      review and clear, but the false positive rate — alerts cleared as non-matches — is
      never aggregated, reported to BSA management, or used to calibrate the matching
      algorithm. OCC examination guidance includes OFAC screening program effectiveness
      as a tested area; a false positive rate that is not measured cannot be managed,
      and examiners reviewing the bank's sanctions program will look for evidence that
      screening accuracy is monitored and that the algorithm is periodically recalibrated
      against the SDN list update cadence.`,
    keywords: ['OFAC', 'SDN', 'sanctions screening', 'OCC', 'AML', 'false positive'],
    demoRelevant: false,
    subTopic: 'ctf-sanctions',
  },

  // ── Additional Trade Finance ──────────────────────────────────────────────
  {
    code: 'B804',
    name: 'Bills of Lading Authenticity Not Verified in Import Financing Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital's trade finance team accepts bills of lading as collateral
      documentation for import financing without verifying authenticity with the issuing
      carrier — fictitious or altered bills of lading are a primary TBML mechanism, used
      to misrepresent the nature, quantity, or value of shipped goods to fraudulently obtain
      financing. The Wolfsberg Group's trade finance principles and FATF's 2020 TBML
      guidance both require that trade finance banks implement carrier verification
      steps for high-value or high-risk shipments; reliance on unverified carrier
      documents without spot-check verification is a documented TBML control gap.`,
    keywords: ['TBML', 'bills of lading', 'FATF', 'AML', 'OCC', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },
  {
    code: 'B805',
    name: 'Trade Finance Customer Reverse-Lookup Against FinCEN 314(b) Not Performed',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description: `First Capital does not participate in voluntary FinCEN 314(b) information
      sharing with other financial institutions for its trade finance customer base —
      the 314(b) program is explicitly designed to allow institutions to share information
      about potential money laundering or terrorist financing activity, including TBML
      patterns that are visible only when a customer's trade activity across multiple
      banks is aggregated. FinCEN has encouraged institutions with commercial trade
      finance portfolios to use 314(b) sharing as a TBML detection tool; the bank's
      non-participation means it cannot benefit from cross-institution intelligence
      about customers who may be executing split-shipment or split-invoice TBML
      schemes across multiple bank relationships.`,
    keywords: ['FinCEN 314(b)', 'TBML', 'AML', 'BSA', 'OCC', 'trade finance'],
    demoRelevant: false,
    subTopic: 'trade-finance',
  },

  // ── Additional Crypto / VASP ──────────────────────────────────────────────
  {
    code: 'B806',
    name: 'DeFi Protocol Counterparty Risk Not Assessed for VASP Fiat Deposits',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's VASP banking customers receive fiat wire transfers from
      decentralised finance (DeFi) protocol liquidations and yield withdrawals, but the
      bank's AML program has no assessment framework for DeFi-sourced fiat deposits —
      FATF's October 2021 updated guidance on virtual assets specifically identifies
      DeFi protocols as a growing money laundering typology because smart contract
      automation allows layering without a custodial intermediary. The bank's monitoring
      focuses on the fiat leg of the transaction without any consideration of the on-chain
      source, creating a structural blind spot FinCEN's examination team has flagged at
      peer institutions with active VASP banking portfolios.`,
    keywords: ['DeFi', 'VASP', 'FATF', 'FinCEN', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'crypto-vasp',
  },
  {
    code: 'B807',
    name: 'NFT Platform Banking Customer Risk Classification Absent From AML Program',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `First Capital provides banking services to two NFT marketplace operators
      whose platforms facilitate high-volume asset transfers, but the AML team has not
      developed a risk classification framework for NFT platform customers — FinCEN's
      2022 financial trend analysis identified NFT wash-trading and value transfer as
      emerging money laundering vectors, and FATF has indicated that NFT platforms
      may qualify as VASPs depending on their functionality. Without a documented risk
      classification for NFT platform customers, transaction monitoring thresholds and
      EDD requirements default to standard commercial banking parameters that are not
      calibrated to the NFT-specific financial crime risks.`,
    keywords: ['NFT', 'VASP', 'FinCEN', 'FATF', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'crypto-vasp',
  },

  // ── Additional Internal Financial Crime ───────────────────────────────────
  {
    code: 'B808',
    name: 'Branch Cash Vault Dual Custody Controls Not Independently Verified',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `First Capital's branch cash vault procedures require two employees to
      be present for all cash vault openings and closings, but the compliance team's
      annual review of branch controls relies on manager self-attestation rather than
      independent observation or camera audit review — vault access logs indicate several
      instances of single-employee vault access that were not investigated. OCC
      examination standards for teller cash and vault controls require that dual
      custody be a verified control, not a policy-only requirement; the reliance on
      manager attestation as the primary verification mechanism is a BSA internal
      controls gap that also creates an insider theft exposure.`,
    keywords: ['dual custody', 'BSA', 'OCC', 'internal controls', 'cash vault', 'AML'],
    demoRelevant: false,
    subTopic: 'internal-financial-crime',
  },
  {
    code: 'B809',
    name: 'Employee CTR-Structuring Pattern Absent From Internal Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `Transaction monitoring scenarios designed to detect customer structuring
      below the $10,000 CTR threshold are not applied to detect when a First Capital
      employee processes multiple sub-threshold cash transactions for the same customer
      on behalf of that customer — a documented method by which bank employees facilitate
      structuring as an insider compliance violation under 31 U.S.C. 5324. FinCEN and OCC
      guidance both identify employee facilitation of structuring as a BSA program deficiency,
      and the absence of an employee-pattern structuring monitor represents a gap in the
      bank's insider AML control framework.`,
    keywords: ['structuring', 'CTR', 'FinCEN', 'OCC', 'BSA', 'insider fraud'],
    demoRelevant: false,
    subTopic: 'internal-financial-crime',
  },

  // ── Additional AI / AML Advanced ──────────────────────────────────────────
  {
    code: 'B810',
    name: 'AI-Powered Name-Screening Update Frequency Lags OFAC Publication Cadence',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's AI name-matching sanctions screening model is retrained
      quarterly on an updated SDN training corpus, but OFAC publishes SDN list changes
      on an irregular daily basis — the AI model's entity embeddings are frozen between
      quarterly retraining cycles, meaning newly designated entities whose name patterns
      differ from the training corpus may produce lower similarity scores and avoid
      detection until the next model update. OFAC's screening expectations require that
      institutions screen against a current SDN list; an AI model with a quarterly
      retraining cycle does not satisfy this requirement for dynamic designation periods,
      and OCC examiners can test the gap by reviewing AI hit rates against designations
      published between training cycles.`,
    keywords: ['AI sanctions screening', 'OFAC', 'SDN', 'OCC', 'AML', 'model retraining'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B811',
    name: 'Predictive AML Risk Score Used for Account Termination Without Adverse Action Notice',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital uses an AI-generated AML risk score as the trigger for
      commercial account termination recommendations, but the bank has not assessed whether
      the adverse action notice requirements of the Equal Credit Opportunity Act (ECOA)
      or the CFPB's UDAAP standards apply when a predictive model score drives account
      closure decisions for business banking customers. OCC and CFPB guidance on
      algorithmic decision-making in financial services requires that model-driven adverse
      actions provide customers with specific reasons; the absence of a legal review
      of whether BSA-motivated AI terminations trigger consumer protection notice
      requirements creates regulatory exposure that sits at the intersection of AML
      and fair banking compliance.`,
    keywords: ['predictive AML score', 'CFPB', 'OCC', 'ECOA', 'AI', 'account termination'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B812',
    name: 'AI Model Explainability Gap Prevents BSA Officer SAR Certification',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's ML transaction monitoring model produces alert scores
      without feature-level explanations that the BSA Officer can review before certifying
      a SAR filing — the model is a gradient-boosted ensemble whose output is a single
      probability score without attribution to specific transactions, dates, or behavioral
      features. FinCEN's SAR guidance requires the certifying officer to understand and
      attest to the accuracy of the narrative; an officer certifying a SAR whose underlying
      ML score they cannot interpret is not providing the informed certification the BSA
      requires, and SR 11-7 model documentation standards explicitly require that compliance
      models be explainable to their users.`,
    keywords: ['ML explainability', 'SR 11-7', 'SAR', 'FinCEN', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B813',
    name: 'AI-Assisted KYC Document Verification Not Validated for Deepfake Resistance',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description: `First Capital uses an AI document verification tool for digital account
      opening that uses facial biometric matching to verify government-issued ID — but
      the tool has not been tested for resistance to deepfake or AI-generated synthetic
      identity documents, which FinCEN's 2024 alerts on synthetic identity fraud identify
      as a rapidly growing financial crime vector. CDD Rule compliance under 31 CFR 1010.230
      requires that identity verification be sufficient to reasonably identify the customer;
      an AI verification tool that cannot detect AI-generated false identity documents does
      not provide the reasonable certainty the CDD Rule requires, particularly for digital
      account opening channels where the bank has no in-person verification option.`,
    keywords: ['AI identity verification', 'CDD Rule', 'FinCEN', 'OCC', 'deepfake', 'KYC'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B814',
    name: 'Automated TBML Flag From AI Invoice Analysis Not Integrated Into SAR Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital piloted an AI document analysis tool that identifies
      potential TBML indicators in trade finance invoices — price anomalies, duplicate
      invoice numbers, inconsistent shipping terms — but the tool's output flags are
      not integrated into the AML case management system or the SAR workflow, so
      identified anomalies generate a PDF report that is emailed to the trade finance
      operations team rather than creating a formal alert. FinCEN's guidance on TBML
      controls requires that detected anomalies be subject to the same BSA investigation
      process as transaction monitoring alerts; an AI tool that identifies TBML risk but
      routes it outside the formal investigation workflow provides no regulatory protection
      and represents a BSA program design gap.`,
    keywords: ['AI invoice analysis', 'TBML', 'FinCEN', 'AML', 'OCC', 'SAR workflow'],
    demoRelevant: false,
    subTopic: 'ai-aml-advanced',
  },
  {
    code: 'B815',
    name: 'Vendor AML AI Platform Contract Lacks SR 11-7 Model Change Clause',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital's contract with its primary vendor-supplied AML AI platform
      does not include a clause requiring the vendor to provide advance notice of material
      model changes, disclose model training data sources, or allow the bank to perform
      SR 11-7-compliant independent validation of the model's methodology — OCC's model
      risk guidance explicitly states that SR 11-7 obligations apply to vendor-supplied
      models and that the bank must be able to validate vendor models regardless of
      whether the vendor treats the methodology as proprietary. OCC 2013-29 third-party
      risk management guidance also requires that contracts include provisions for
      regulatory access and audit rights; the absence of model-governance clauses in an
      AI AML platform contract is simultaneously an SR 11-7 and OCC 2013-29 deficiency.`,
    keywords: ['vendor AI', 'SR 11-7', 'OCC 2013-29', 'AML', 'BSA', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-aml-advanced',
  },

  // ── Additional Program Governance ─────────────────────────────────────────
  {
    code: 'B816',
    name: 'FinCEN 314(a) Match Not Escalated to BSA Officer Before Account Action',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `When First Capital's system returns a positive match in a FinCEN 314(a)
      search, the operations team that processes the request does not have a documented
      escalation protocol to notify the BSA Officer before taking any account action —
      the 314(a) response and any related account decision are handled by the processing
      team without BSA leadership awareness. FinCEN's 314(a) guidance requires that
      institutions implement procedures to identify, report, and investigate potential
      matches; a match-processing workflow that does not loop in the BSA Officer fails
      to meet the investigation and escalation requirements of the BSA and can result
      in the bank failing to follow up with FinCEN within the required 14-day window.`,
    keywords: ['FinCEN 314(a)', 'BSA', 'OCC', 'AML', 'BSA Officer', 'program governance'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B817',
    name: 'Cyber-Enabled Financial Crime Not Addressed in AML Scenario Library',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `FinCEN's 2022 national AML priorities designate cyber-enabled financial
      crime — ransomware payments, business email compromise wire fraud, account takeover
      proceeds — as a primary AML concern, but First Capital's transaction monitoring
      library does not include scenarios calibrated to detect the rapid fiat movement
      pattern characteristic of BEC fraud proceeds or cryptocurrency ransomware payment
      flows. OCC examination teams verify that an institution's scenario library addresses
      all FinCEN national priorities; the absence of cyber-enabled financial crime
      scenarios is an exploitable gap between the bank's declared AML priorities and
      its operational monitoring capability.`,
    keywords: ['cyber-enabled financial crime', 'FinCEN', 'AML', 'BSA', 'OCC', 'BEC fraud'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B818',
    name: 'AML Staffing Level Not Benchmarked Against Peer Group or OCC Expectations',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital's AML compliance function staffing has not been formally
      benchmarked against OCC peer group examination findings or ACAMS workforce surveys —
      the BSA team size is set by budget constraint rather than a risk-based staffing
      analysis that accounts for transaction volume, customer risk profile, and alert
      population size. FinCEN guidance states that AML program adequacy includes having
      sufficient trained personnel to investigate alerts and file SARs within regulatory
      deadlines; OCC examination findings frequently cite understaffing as the root cause
      of SAR deadline failures, alert backlog accumulation, and KYC refresh delinquency,
      all of which are present in First Capital's current program assessment.`,
    keywords: ['AML staffing', 'FinCEN', 'OCC', 'BSA', 'program governance', 'ACAMS'],
    demoRelevant: true,
    subTopic: 'bsa-program',
  },
  {
    code: 'B819',
    name: 'Human Trafficking Indicator Typologies Not in Transaction Monitoring Scope',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `FinCEN's 2020 advisory on human trafficking financial indicators and its
      2014 guidance on labor trafficking identify specific transaction patterns — frequent
      cash deposits at irregular hours, multiple payees at the same address, hotel
      and short-term rental payments funded by third parties — that are high-signal
      human trafficking indicators, but First Capital's transaction monitoring library
      does not include any of these typologies. FinCEN's national AML priorities
      designate human trafficking as a primary priority, and OCC examination teams
      have begun testing whether scenario libraries address trafficking typologies
      as part of the priority coverage assessment; the absence of these scenarios
      is a documented gap between First Capital's AML program and current FinCEN
      priority expectations.`,
    keywords: ['human trafficking', 'FinCEN', 'AML', 'BSA', 'OCC', 'transaction monitoring'],
    demoRelevant: false,
    subTopic: 'bsa-program',
  },
];
