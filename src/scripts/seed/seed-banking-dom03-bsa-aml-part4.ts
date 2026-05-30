// seed-banking-dom03-bsa-aml-part4.ts
// Banking genome patterns — BSA/AML & Financial Crime Compliance
// Code range: B880–B939  (60 patterns)
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

export const BANKING_BSA_AML_PART4_PATTERNS: PatternSeed[] = [

  // ── Sanctions Compliance (B880–B891) ──────────────────────────────────────
  {
    code: 'B880',
    name: 'OFAC SDN Screening Frequency Insufficient for Real-Time Payment Channels',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital screens payment instructions against the OFAC SDN list on a
      nightly batch cycle, but the bank's FedNow and RTP instant payment channels settle
      transactions in under 10 seconds — the nightly batch model means a wire sent by an
      SDN-designated entity at 9:00 AM may settle and fund before the evening screening
      cycle identifies the match. OFAC regulations require that transactions be blocked
      before processing when the counterparty is on the SDN list; a screening architecture
      that cannot evaluate SDN status in real time for instant payment channels fails the
      OFAC blocking obligation and creates retroactive unblocking liability that is
      extremely difficult to remediate once funds have settled.`,
    keywords: ['OFAC SDN', 'real-time payments', 'FedNow', 'RTP', 'sanctions screening', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B881',
    name: 'Secondary Sanctions Exposure Not Assessed in Correspondent Banking EDD',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital's OFAC compliance program focuses on primary sanctions —
      direct transactions with SDN-designated entities — but does not systematically assess
      secondary sanctions exposure through its correspondent banking relationships with
      non-US financial institutions that may be transacting with OFAC-designated jurisdictions
      or entities. OFAC's secondary sanctions authorities under CAATSA, Iran sanctions,
      and Venezuela sanctions programs expose US financial institutions to penalties when
      they provide correspondent services to foreign banks that are themselves engaging in
      sanctionable activity; the bank's EDD questionnaire for correspondents does not
      include secondary sanctions screening or attestation questions, creating a gap that
      OCC examination teams test through correspondent transaction analysis.`,
    keywords: ['secondary sanctions', 'OFAC', 'correspondent banking', 'CAATSA', 'AML', 'OCC'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B882',
    name: 'OFAC General License Expiry Tracking Not Integrated With Payment Approval Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `First Capital has received OFAC general licenses authorizing certain
      transactions with otherwise-sanctioned counterparties, but the license expiry dates
      are tracked in a compliance team spreadsheet that is not integrated with the bank's
      payment approval system — when a general license expires, the payment system continues
      approving transactions under the authority of the expired license until a compliance
      officer manually updates the system. OFAC regulations treat transactions conducted
      after a general license expiry as violations subject to civil monetary penalties
      regardless of whether the bank had a good-faith belief that the license remained
      valid; a manual expiry tracking process without automated payment system integration
      creates systemic OFAC violation risk that OFAC enforcement actions have cited at
      peer institutions.`,
    keywords: ['OFAC general license', 'sanctions compliance', 'FinCEN', 'OCC', 'OFAC', 'payment controls'],
    demoRelevant: true,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B883',
    name: 'Sectoral Sanctions Applicability Not Assessed for Russian and Chinese Entities',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `OFAC sectoral sanctions under the Directives attached to Executive Order 13662
      (Ukraine/Russia) and Executive Order 13959 (China military-industrial complex) restrict
      specific types of transactions — debt, equity, new investment — with non-SDN-listed
      entities in designated sectors, but First Capital's OFAC compliance program screens
      only for SDN list matches and does not assess whether corporate customers or their
      counterparties fall within a sectoral sanction Directive that restricts the specific
      transaction type being executed. OFAC enforcement actions have cited failure to
      screen for sectoral sanctions separately from SDN screening as a systemic compliance
      gap; the bank's commercial banking team regularly extends credit facilities to
      mid-market companies with partial Russian or Chinese ownership without a sectoral
      sanction assessment.`,
    keywords: ['sectoral sanctions', 'OFAC', 'Executive Order', 'OCC', 'AML', 'sanctions screening'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B884',
    name: 'Sanctions Alert False Negative From Nickname and Alias Name Truncation',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's sanctions screening system processes wire transfer beneficiary
      names as received in the payment message field, which for international wires frequently
      contains abbreviated names, common nicknames, or Latin-script romanizations of names
      that appear on the SDN list in a different format — the screening system produces no
      match when a beneficiary name is entered as a common abbreviation of an SDN-listed
      entity's full legal name. OFAC compliance guidance requires that institutions implement
      screening robust enough to catch name variations, aliases, and abbreviations of listed
      entities; the absence of fuzzy matching and alias expansion for wire beneficiary names
      is a technical screening gap that OFAC has cited in enforcement actions as a contributing
      cause of undiscovered sanctions violations.`,
    keywords: ['sanctions screening', 'OFAC SDN', 'name matching', 'OCC', 'AML', 'wire transfer'],
    demoRelevant: true,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B885',
    name: 'OFAC Blocked Account Funds Procedures Not Documented for Operations Staff',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `When First Capital identifies an OFAC match requiring a transaction to be
      blocked and funds held in a segregated account, the operational procedures for
      blocking, holding, and reporting the blocked funds to OFAC within the required 10
      business days are not documented in a staff-accessible procedure manual — operations
      staff have escalated blocked fund cases to compliance management but compliance has
      no written escalation procedure specifying who owns the OFAC blocking report filing
      and the blocked funds account maintenance. OFAC regulations under 31 CFR 501.603
      require that blocked funds be reported to OFAC within 10 business days; a program
      without documented blocking procedures cannot consistently meet this deadline and
      creates OFAC reporting violation risk independent of the underlying sanctions match.`,
    keywords: ['OFAC blocking procedures', 'OFAC', '31 CFR 501.603', 'sanctions compliance', 'OCC', 'AML'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B886',
    name: 'Sanctions Jurisdictional Coverage Gap for Newly Designated Countries',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's OFAC screening system uses a static country risk list that
      was last updated in 2023 and does not reflect OFAC program additions or jurisdictional
      designations issued in 2024 — including expanded Nicaragua, Haiti, and Sudan program
      coverage — meaning that transactions involving entities from newly designated
      jurisdictions are not triggering the enhanced OFAC review that newly sanctioned
      country exposure requires. OFAC's country programs expand periodically through
      executive orders and Federal Register notices; a sanctions compliance program that
      does not have a documented process for integrating newly designated jurisdictions
      within 30 days of OFAC designation fails the currency requirement for an adequate
      OFAC program.`,
    keywords: ['OFAC country program', 'sanctions screening', 'FinCEN', 'AML', 'OCC', 'executive order'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B887',
    name: 'Non-SDN Specially Designated Persons Lists Not Included in Screening Scope',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's OFAC screening program screens against the SDN (Specially
      Designated Nationals) list but does not consistently screen against the Non-SDN Lists
      maintained by OFAC — the Sectoral Sanctions Identifications (SSI) list, the Foreign
      Sanctions Evaders (FSE) list, the Palestinian Legislative Council (NS-PLC) list, and
      the List of Persons Identified as Blocked Solely Pursuant to Executive Order 13599
      (Sovereign Iran) — each of which imposes distinct transaction restrictions not captured
      by SDN screening alone. OFAC publishes each list separately and enforcement actions
      have cited failure to screen against the SSI and FSE lists specifically as compliance
      gaps; a bank that screens only the SDN list misses the transaction-type restrictions
      imposed by the non-SDN program lists.`,
    keywords: ['non-SDN lists', 'OFAC SSI', 'OFAC FSE', 'sanctions compliance', 'OCC', 'AML'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B888',
    name: 'OFAC Annual Audit Not Conducted by Function Independent of Compliance Operations',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital's annual OFAC compliance audit is conducted by the BSA/AML
      compliance team itself — the same team that operates the OFAC screening workflow —
      rather than by internal audit or an independent third party, creating a self-review
      that does not satisfy OFAC's expectation for independent program testing. OFAC's
      framework for evaluating compliance commitments identifies independent audit as a
      core element of an adequate OFAC program; an audit performed by the team responsible
      for OFAC operations cannot objectively identify control gaps in the program they
      operate, and OCC examination teams reviewing First Capital's OFAC compliance
      program have flagged the absence of independent audit as a program governance gap.`,
    keywords: ['OFAC audit', 'sanctions compliance', 'OCC', 'independent testing', 'AML', 'BSA'],
    demoRelevant: true,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B889',
    name: 'Sanctions Screening Coverage Gap for Trade Finance LC Beneficiary Addresses',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's OFAC screening for letter of credit transactions screens
      the applicant and primary beneficiary names but does not screen the beneficiary's
      address, shipping-to country, or intermediate port-of-call locations named in the
      LC shipping documents — a critical gap given that OFAC country-based sanctions
      (Cuba, Iran, North Korea, Syria) prohibit transactions regardless of whether the
      named party appears on a list, as long as a sanctioned country is involved. OFAC
      regulations impose strict liability for country-based sanctions violations; a
      trade finance screening program that checks names but does not systematically
      evaluate geographic identifiers in LC documents fails to meet the OFAC compliance
      standard for an institution with a trade finance book.`,
    keywords: ['OFAC trade finance', 'letter of credit', 'country-based sanctions', 'AML', 'OCC', 'FinCEN'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B890',
    name: 'Sanctions Escalation Workflow Undocumented for Weekend and Holiday Alert Queues',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `First Capital's OFAC alert disposition workflow is staffed Monday through
      Friday during business hours, but the bank processes international wire transfers
      seven days per week — OFAC alerts generated on weekends and federal holidays queue
      unreviewed until the following business day, and the bank has no documented emergency
      escalation procedure for urgent weekend OFAC hits on time-sensitive payment windows.
      OFAC's blocking obligation applies at the moment of screening regardless of the day
      of the week; a program without weekend escalation procedures for OFAC alerts creates
      a systematic delay in the blocking obligation and gives rise to OFAC reporting
      violations when blocked funds are reported outside the 10-business-day window.`,
    keywords: ['OFAC escalation', 'sanctions compliance', 'AML', 'OCC', 'FinCEN', 'operational controls'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },
  {
    code: 'B891',
    name: 'Sanctions Risk Exposure Not Quantified in Annual Enterprise Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `First Capital's enterprise risk assessment includes qualitative descriptions
      of OFAC and sanctions risk but does not include quantified exposure metrics — the
      dollar volume of transactions touching high-risk jurisdictions, the number of
      screening alerts by program type, the rate of false positives versus true matches,
      or the trend in sanctions screening coverage gaps identified in periodic testing.
      OFAC's compliance framework guidance emphasizes risk-based program design; a
      sanctions program that cannot quantify its own risk exposure cannot demonstrate
      to OCC examiners that its resource allocation, threshold calibration, and
      independent testing scope are proportional to the institution's actual sanctions
      risk profile.`,
    keywords: ['sanctions risk assessment', 'OFAC', 'OCC', 'enterprise risk', 'AML', 'BSA'],
    demoRelevant: false,
    subTopic: 'sanctions-compliance',
  },

  // ── SAR Quality Advanced (B892–B901) ──────────────────────────────────────
  {
    code: 'B892',
    name: 'SAR Continuation Filing Threshold Not Risk-Differentiated by Activity Type',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description: `First Capital applies a uniform 90-day continuation SAR threshold for all
      ongoing suspicious activity regardless of the activity type or risk level — a continuing
      SAR for a potentially active money laundering network is treated identically to a
      continuing SAR for a structuring pattern from a retail customer, with no risk-based
      acceleration of the continuation filing timeline for activity posing imminent law
      enforcement interest. FinCEN's continuing SAR guidance permits and encourages
      institutions to file continuation SARs more frequently than 90 days when the
      activity involves active criminal enterprises, and OCC examination practice
      recognizes that a uniform 90-day continuation rule for all SAR types reflects
      a compliance-minimum rather than a risk-based approach to ongoing suspicious
      activity reporting.`,
    keywords: ['SAR continuation', 'FinCEN', 'BSA', 'OCC', 'AML', 'risk-based approach'],
    demoRelevant: false,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B893',
    name: 'SAR Withdrawal After Filing Not Documented With FinCEN Coordinator Notification',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `On three occasions in the prior 18 months, First Capital identified material
      errors in filed SARs — misidentified subjects, incorrect transaction amounts, or
      inaccurate dates — and the BSA compliance team corrected the SAR by filing an amended
      version without notifying the FinCEN regulatory liaison or documenting the basis for
      the correction in the case management system. FinCEN's SAR amendment guidance requires
      that amended SARs be accompanied by documentation of the specific error corrected
      and the corrected information, and FinCEN expects that material corrections be
      communicated to the SAR coordinator to update the BSA database record; informal
      corrections without documented procedures create a SAR filing record that does not
      accurately represent the bank's reporting history.`,
    keywords: ['SAR amendment', 'FinCEN', 'BSA', 'OCC', 'AML', 'SAR documentation'],
    demoRelevant: false,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B894',
    name: 'SAR Subject Identification Incomplete for Omnibus Account Transactions',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `When First Capital identifies suspicious activity in an omnibus account
      — an account held by a broker-dealer, payment processor, or investment platform
      on behalf of multiple underlying sub-account holders — the BSA team files SARs
      naming the omnibus account holder as the subject without identifying the specific
      sub-account holder whose activity constitutes the suspicious transaction, because
      the sub-account holder identity information is held by the omnibus account operator
      and not available to the bank. FinCEN guidance on omnibus account SAR filings
      requires that institutions use the 314(a) information request process or legal
      process to identify the specific underlying customer when suspicious activity
      occurs in an omnibus account; a SAR that names only the intermediary without
      attempting to identify the ultimate actor provides law enforcement with
      incomplete intelligence.`,
    keywords: ['omnibus account SAR', 'FinCEN 314(a)', 'BSA', 'AML', 'OCC', 'SAR subject identification'],
    demoRelevant: false,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B895',
    name: 'SAR Filing Decision Not Escalated When Activity Involves Bank Employee',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's AML operations team identified two instances of transaction
      monitoring alerts implicating a bank employee's personal accounts in structuring
      patterns — both cases were investigated and closed without SAR filing after informal
      consultation with the business line manager, without escalation to the BSA Officer
      or senior management for the independent review that insider SAR decisions require.
      FinCEN and OCC guidance require that SAR decisions involving bank insiders receive
      elevated scrutiny and independent compliance officer review to prevent conflicts of
      interest from influencing the filing decision; a workflow that allows business line
      managers to informally influence SAR decisions for their own employees is a governance
      failure with potential criminal liability if the underlying activity involves fraud.`,
    keywords: ['insider SAR', 'FinCEN', 'BSA Officer', 'AML', 'OCC', 'SAR escalation'],
    demoRelevant: true,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B896',
    name: 'SAR Activity Description Defaults to Template Language Without Transaction Specifics',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's SAR narrative library includes pre-written template paragraphs
      for common suspicious activity types — structuring, layering, unusual cash activity —
      and analysts frequently paste template descriptions into narratives with minimal
      customization, producing SARs that describe the activity type generically rather
      than providing the specific dates, amounts, counterparties, and account numbers that
      would allow law enforcement to identify and trace the transactions described. FinCEN's
      SAR instruction guidance specifies that narratives must include the specific details
      of each suspicious transaction rather than generic characterizations of the activity
      type; template-driven narratives without specific transaction data fail the FinCEN
      completeness standard and reduce the SAR's utility as a law enforcement intelligence
      document.`,
    keywords: ['SAR narrative', 'FinCEN', 'BSA', 'AML', 'OCC', 'SAR quality'],
    demoRelevant: true,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B897',
    name: '314(a) Request Response Not Completed Within 14-Day Statutory Window',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `FinCEN's 314(a) information request program requires financial institutions
      to search their records for accounts, transactions, and customers matching law
      enforcement's specified subjects and respond within 14 calendar days — First Capital's
      internal audit review found that 22% of 314(a) requests received in the prior year
      were responded to after the 14-day window due to routing delays in the bank's
      document management system that failed to deliver requests to the BSA team on the
      day received. FinCEN can take enforcement action against institutions for systemic
      314(a) response failures; a response rate of 78% within the statutory window
      represents a compliance gap that also undermines the law enforcement relationship
      that the 314(a) program is designed to support.`,
    keywords: ['FinCEN 314(a)', 'BSA', 'AML', 'OCC', 'law enforcement response', 'SAR quality'],
    demoRelevant: true,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B898',
    name: 'SAR Confidentiality Tipping-Off Controls Not Tested by Internal Audit',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `The BSA requires that financial institutions maintain strict confidentiality
      of SAR filings and prohibits disclosing to the subject of a SAR that a report has
      been filed — First Capital does not conduct periodic internal audit testing to verify
      that SAR confidentiality controls prevent unauthorized access by relationship managers,
      lending officers, or operations staff who interact with the subject and could
      inadvertently disclose the filing. BSA Section 5318(g)(2) imposes criminal penalties
      for unauthorized disclosure of SAR information; a program that has never been tested
      for confidentiality control effectiveness cannot demonstrate to OCC examiners that
      the tipping-off prohibition is operationally enforced.`,
    keywords: ['SAR confidentiality', 'BSA 5318(g)', 'FinCEN', 'AML', 'OCC', 'internal audit'],
    demoRelevant: false,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B899',
    name: 'SAR Filing Decision Log Does Not Capture Declination Rationale',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description: `First Capital's AML case management system captures the investigation notes
      and final disposition for SAR decisions but does not require analysts to document
      the specific articulable facts and reasoning for declining to file a SAR when an
      alert is closed as non-suspicious — the non-filing rationale is either absent or
      recorded as a single-word status code such as "KYC consistent" without supporting
      detail. FinCEN and OCC both require that institutions be able to demonstrate not
      just that SARs were filed when required, but that the decision not to file was
      reasoned and documented; a case management system that records SAR filings but not
      declination rationale provides only half the documentation needed to defend the
      bank's SAR program adequacy during examination.`,
    keywords: ['SAR declination', 'FinCEN', 'AML', 'OCC', 'BSA', 'case management'],
    demoRelevant: true,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B900',
    name: 'SAR Supervisory Review Bypass Permitted by Case Management Role Permissions',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital's AML case management system requires a supervisor approval
      step before a SAR can be submitted to FinCEN's BSA E-Filing system, but the system
      role configuration allows senior analysts to self-approve their own SAR submissions
      without a second-line supervisor review when volume is high and supervisors are
      unavailable — this bypass path was used for 14% of SAR filings in the prior year.
      FinCEN guidance and OCC examination standards require that SAR submissions undergo
      independent supervisory review before filing; a system that allows self-approval
      of SAR submissions violates the four-eyes control principle that BSA examination
      guidance identifies as a minimum program requirement for institutions of First
      Capital's size and risk profile.`,
    keywords: ['SAR supervisory review', 'FinCEN', 'AML', 'OCC', 'BSA', 'case management controls'],
    demoRelevant: true,
    subTopic: 'sar-quality-advanced',
  },
  {
    code: 'B901',
    name: 'Voluntary SAR Program for Cyber-Enabled Financial Crime Alerts Not Established',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `FinCEN strongly encourages financial institutions to file voluntary SARs
      for cyber-enabled financial crime activity — BEC, account takeover, ransomware payment
      requests, and card-not-present fraud — even when the institution does not suffer a
      direct financial loss, because the intelligence supports law enforcement investigations
      of criminal networks that target multiple institutions simultaneously. First Capital
      does not have a documented voluntary SAR program for cyber-enabled financial crime;
      cyber-related alerts that do not meet the mandatory filing threshold are closed as
      fraud operations cases rather than reviewed for voluntary SAR value, meaning the
      bank is not contributing to the FinCEN intelligence database on cyber-criminal
      networks that have targeted its customers.`,
    keywords: ['voluntary SAR', 'cyber-enabled financial crime', 'FinCEN', 'AML', 'OCC', 'BEC fraud'],
    demoRelevant: false,
    subTopic: 'sar-quality-advanced',
  },

  // ── De-risking (B902–B909) ─────────────────────────────────────────────────
  {
    code: 'B902',
    name: 'MSB Portfolio Wholesale Exit Without Individual Risk Assessment Documentation',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description: `First Capital exited its entire money services business customer portfolio
      following a regulatory examination that identified AML program gaps — 47 MSB accounts
      were closed without individual customer-level risk assessment documentation showing
      why each specific customer's risk could not be managed rather than exited. OCC guidance
      issued in 2014 and reaffirmed in 2018 explicitly states that wholesale exit from
      customer categories without individual risk assessment is not a permissible substitute
      for risk management; CFPB and DOJ have cited MSB portfolio de-risking without
      individual assessment as a potential pattern of disparate impact on immigrant and
      underserved communities, creating civil rights and CRA compliance exposure alongside
      the operational risk of losing the MSB revenue stream.`,
    keywords: ['MSB de-risking', 'OCC', 'CFPB', 'AML', 'BSA', 'CRA'],
    demoRelevant: true,
    subTopic: 'de-risking',
  },
  {
    code: 'B903',
    name: 'Correspondent Banking Relationship Terminated Without Supervisory Engagement',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital terminated two foreign correspondent banking relationships
      following internal AML risk escalations, closing the accounts without notifying the
      relevant supervisory authority or engaging the correspondent's primary regulator
      through established communication channels — FinCEN's guidance on correspondent
      banking de-risking recommends that US banks experiencing concerns about a
      foreign correspondent's AML program communicate with the correspondent's supervisor
      before account closure as a risk mitigation step. The abrupt termination of
      correspondent relationships without supervisory engagement precludes a managed
      transition and may cause the exited correspondent to lose access to the US financial
      system entirely, which FATF identifies as a systemic financial exclusion risk from
      institutional de-risking practices.`,
    keywords: ['correspondent banking termination', 'FinCEN', 'FATF', 'AML', 'OCC', 'de-risking'],
    demoRelevant: false,
    subTopic: 'de-risking',
  },
  {
    code: 'B904',
    name: 'NRAA Customer Portfolio Exit Driven by Examination Pressure Without Risk Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description: `First Capital closed all accounts held by non-resident alien accounts (NRAA)
      in its retail banking portfolio following examination pressure from the OCC, without
      conducting an individualized risk assessment showing that the NRAA portfolio posed
      AML risk exceeding the bank's risk appetite on a customer-by-customer basis. OCC
      Bulletin 2014-37 and the Joint Agency Statement on AML and Bank Access to Financial
      Services explicitly state that de-risking driven by examination pressure without
      individual risk assessment is inappropriate; a documented pattern of closing
      customer categories in response to examiner comments rather than risk evidence
      violates fair access principles and may constitute a pattern or practice of
      account denial based on national origin, triggering fair housing and ECOA scrutiny.`,
    keywords: ['NRAA de-risking', 'OCC Bulletin 2014-37', 'CFPB', 'AML', 'fair access', 'BSA'],
    demoRelevant: true,
    subTopic: 'de-risking',
  },
  {
    code: 'B905',
    name: 'Third-Party Payment Processor De-risking Leaves Revenue Gap and Compliance Blind Spot',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital terminated its third-party payment processor (TPPP) portfolio
      to reduce AML risk after an examination finding on inadequate TPPP monitoring, but
      the termination was not accompanied by a plan for managing payments from the affected
      merchant customers who now route transactions through a competing bank with less
      robust AML controls — the bank reduced its own risk by externalizing it to a
      competitor without improving the underlying AML risk in the merchant payment ecosystem.
      FinCEN guidance on TPPP AML risk acknowledges that blanket termination is not the
      intended policy response to TPPP monitoring deficiencies; the OCC expects institutions
      to develop risk-commensurate monitoring approaches rather than exit customer
      categories that have legitimate business purposes.`,
    keywords: ['TPPP de-risking', 'FinCEN', 'AML', 'OCC', 'payment processor', 'BSA'],
    demoRelevant: false,
    subTopic: 'de-risking',
  },
  {
    code: 'B906',
    name: 'Remittance Company Account Closure Creates CRA Service Area Coverage Gap',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description: `First Capital closed the accounts of three licensed remittance companies
      serving immigrant communities in its CRA assessment area following AML compliance
      concerns, removing accessible remittance services from neighborhoods where the bank
      has CRA obligations — FinCEN and OCC guidance jointly acknowledge that de-risking
      of remittance companies creates financial access harms that must be weighed against
      the AML risk being managed. The CRA requires that First Capital demonstrate community
      service and financial access for low-to-moderate income communities in its assessment
      area; closing the primary remittance service providers in those communities creates
      a CRA performance gap that regulators will weigh against AML compliance rationale
      in the next CRA examination.`,
    keywords: ['remittance de-risking', 'CRA', 'FinCEN', 'AML', 'OCC', 'financial access'],
    demoRelevant: false,
    subTopic: 'de-risking',
  },
  {
    code: 'B907',
    name: 'Enhanced Monitoring as De-risking Alternative Not Operationally Implemented',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `First Capital's AML policy states that enhanced monitoring is available as
      an alternative to de-risking for high-risk customer categories, but the enhanced
      monitoring program is described only at the policy level — transaction monitoring
      thresholds, review frequencies, and escalation triggers for high-risk customer
      categories have not been operationally implemented in the monitoring system, meaning
      "enhanced monitoring" in practice is indistinguishable from standard monitoring.
      OCC and FinCEN guidance identify enhanced monitoring with documented risk-differentiated
      parameters as the preferred alternative to de-risking; a policy that endorses enhanced
      monitoring but does not implement it operationally provides no real protection and
      exposes the bank to examination criticism for de-risking customer categories while
      claiming it is applying enhanced oversight.`,
    keywords: ['enhanced monitoring', 'OCC', 'FinCEN', 'AML', 'BSA', 'de-risking'],
    demoRelevant: true,
    subTopic: 'de-risking',
  },
  {
    code: 'B908',
    name: 'Marijuana-Related Business Account Exit Not Documented Against FinCEN 2014 Guidance',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `First Capital declined to bank state-licensed marijuana dispensaries in its
      assessment area without documenting its decision against FinCEN's 2014 guidance on
      marijuana-related businesses, which provides a framework for banking state-licensed
      MRBs with appropriate monitoring and SAR filing rather than categorical exclusion.
      FinCEN's guidance explicitly creates a compliance pathway for banking MRBs; OCC
      examination teams have noted that categorical refusal to bank state-licensed MRBs
      without engagement with FinCEN's framework does not demonstrate a risk-based approach
      and may constitute improper de-risking of a legal business category, particularly
      when the refusal disproportionately affects minority-owned businesses in states with
      legalized cannabis.`,
    keywords: ['MRB banking', 'FinCEN 2014 guidance', 'AML', 'OCC', 'de-risking', 'BSA'],
    demoRelevant: false,
    subTopic: 'de-risking',
  },
  {
    code: 'B909',
    name: 'Tribal Gaming Enterprise Accounts Closed Without FinCEN Tribal Consultation',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `First Capital closed tribal gaming enterprise accounts following an
      examination finding related to cash-intensive transaction monitoring, without
      engaging FinCEN's tribal government consultation process or the National Indian
      Gaming Commission's compliance guidance — the exit left a federally recognized
      tribe without banking services for its primary revenue-generating enterprise for
      six months. FinCEN's BSA examination procedures for tribal gaming operations provide
      specific AML risk management guidance; the absence of tribal consultation before
      account closure and the failure to apply the tribal gaming AML framework rather
      than standard commercial AML thresholds demonstrates a program that does not
      accommodate the unique risk profile of regulated tribal gaming enterprises.`,
    keywords: ['tribal gaming AML', 'FinCEN', 'NIGC', 'AML', 'OCC', 'de-risking'],
    demoRelevant: false,
    subTopic: 'de-risking',
  },

  // ── AI-AML Part 4 (B910–B927) ─────────────────────────────────────────────
  {
    code: 'B910',
    name: 'Agentic AI AML Workflow Automates SAR Submissions Without Human Certification Loop',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description: `First Capital piloted an agentic AI system that autonomously investigates
      transaction monitoring alerts, drafts SAR narratives, and submits filings to FinCEN's
      BSA E-Filing portal without a human certification step — the pilot operated for 90
      days, filing 47 SARs, before the BSA Officer discovered that the automated submission
      workflow bypassed the BSA Officer certification attestation required by 31 CFR 1020.320.
      BSA regulations explicitly require that the BSA Officer attest to the accuracy and
      completeness of each SAR filing; an agentic AI system that submits SARs without a
      human certification step creates a systemic regulatory violation, and SR 11-7 model
      governance requires that AI systems influencing compliance filings operate under
      human-in-the-loop review controls, not autonomous submission authority.`,
    keywords: ['agentic AI', 'SAR automation', 'FinCEN', 'SR 11-7', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B911',
    name: 'AI Transaction Monitoring Vendor Retrained Model Without Bank SR 11-7 Re-Validation',
    officeCategory: 'back_office',
    failureRatePct: 79,
    description: `First Capital's AI-powered AML transaction monitoring vendor performed a
      major model retraining using 2024 transaction data without notifying the bank that
      the retrained model constituted a material change under SR 11-7 — the vendor's
      service agreement classifies model updates as "performance improvements" exempt from
      the change notification clause, even when the update changes the model's underlying
      algorithm and alters alert score distributions across the entire customer portfolio.
      SR 11-7 places model risk governance responsibility on the bank, not the vendor;
      OCC examination findings at peer institutions have identified vendor-contract language
      that labels material model changes as maintenance updates as a systemic SR 11-7
      governance failure, and First Capital's consent order remediation plan does not
      yet address this gap in its AI AML vendor contracts.`,
    keywords: ['AI TM retraining', 'SR 11-7', 'vendor model', 'AML', 'OCC', 'model change management'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B912',
    name: 'AI Customer Risk Scoring Model Feature Includes Protected Class Proxy Attributes',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's AI customer risk scoring model for AML purposes includes
      geographic clustering features — census tract poverty index, neighborhood median income,
      and USPS ZIP code business density — that function as proxies for race and national
      origin under CFPB disparate impact analysis, causing minority-owned small businesses
      in lower-income urban census tracts to receive systematically higher AML risk scores
      than economically similar businesses in suburban areas. SR 11-7 model documentation
      requires that proxy features be identified and assessed for disparate impact before
      production deployment; CFPB fair lending guidance on algorithmic models identifies
      geographic variables correlated with protected class as presumptive proxies that
      require disparate impact testing before use in adverse customer action decisions.`,
    keywords: ['AI proxy discrimination', 'SR 11-7', 'CFPB UDAAP', 'AML', 'OCC', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B913',
    name: 'Federated AI AML Model Across Multiple Bank Entities Not Subject to Consolidated SR 11-7 Oversight',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `First Capital deployed a federated AI transaction monitoring model that
      shares learned parameters across the bank's holding company, its commercial bank
      subsidiary, and a trust company affiliate — each entity treats the model as locally
      validated, but no consolidated SR 11-7 review addresses the federated architecture's
      cross-entity data flows, the regulatory perimeter for each model instance, or
      the attribution of model risk governance responsibility across the holding company
      structure. The Federal Reserve's SR 11-7 guidance applies to the consolidated
      organization; a federated AI model that creates legal-entity-level model governance
      ambiguity at the holding company level has not received the consolidated MRM
      review that OCC and Fed examination teams expect for AI systems deployed across
      affiliated entities.`,
    keywords: ['federated AI model', 'SR 11-7', 'AML', 'OCC', 'holding company', 'model governance'],
    demoRelevant: false,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B914',
    name: 'AI-Generated EDD Report Does Not Satisfy FinCEN CDD Rule Reasonable Belief Standard',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description: `First Capital's commercial banking relationship managers use a generative
      AI tool that compiles enhanced due diligence reports by summarizing publicly available
      information and appending a structured CDD checklist, and the bank treats AI-generated
      EDD reports as satisfying the CDD Rule's requirement that institutions form a
      "reasonable belief" about a customer's expected transaction behavior — but the
      reasonable belief standard requires the institution to have genuinely analyzed
      and understood the customer's business purpose, and an AI-compiled summary without
      analyst engagement with the underlying information does not constitute the
      institution's own reasonable belief. FinCEN's CDD Rule preamble articulates that
      the reasonable belief requirement demands genuine human judgment about the customer's
      purpose; AI compilation without analyst attestation fails this standard.`,
    keywords: ['AI EDD report', 'CDD Rule', 'FinCEN', 'AML', 'OCC', 'reasonable belief standard'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B915',
    name: 'AML Graph AI Network Node Expansion Creates CFPB Adverse Action Without ECOA Disclosure',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's AML graph AI platform identifies risk networks by linking
      customer accounts through shared identifiers and flags linked accounts for enhanced
      monitoring or closure recommendations — when a legitimate business account is flagged
      for closure because the AI graph connected it to a high-risk entity through three
      degrees of separation, the bank closes the account without providing an ECOA adverse
      action notice that explains the basis for the decision. The Equal Credit Opportunity
      Act requires adverse action notices for account closures driven by creditworthiness
      assessments; an AI-driven account closure based on graph network proximity to a
      high-risk entity constitutes an adverse action under ECOA that requires disclosure,
      and the bank's legal team has not evaluated whether AML-motivated AI closures trigger
      ECOA notification obligations.`,
    keywords: ['AML graph AI', 'ECOA adverse action', 'SR 11-7', 'CFPB', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B916',
    name: 'NLP SAR Narrative Quality Scoring Tool Introduces Feedback Loop Into Analyst Training',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital deployed an NLP-powered SAR narrative quality scoring tool
      that rates analyst narratives on completeness and provides real-time feedback — but
      the scoring tool was trained on historical SARs that reflect the biases and quality
      patterns of prior analysts, creating a feedback loop where analysts optimize for the
      NLP tool's quality score rather than FinCEN's actual SAR narrative requirements.
      SR 11-7 model governance applies to NLP tools used in compliance workflows; FinCEN's
      five-element narrative completeness standard — who, what, when, where, why — is the
      regulatory benchmark, not the NLP model's learned quality signal, and an AI quality
      tool that teaches analysts to satisfy its own scoring criteria rather than the
      regulatory standard undermines the SAR quality improvement it was designed to support.`,
    keywords: ['NLP SAR scoring', 'SR 11-7', 'FinCEN', 'AML', 'OCC', 'SAR quality'],
    demoRelevant: false,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B917',
    name: 'AI Behavioral Biometrics in Digital Banking Produces AML Alert Without BSA Justification',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description: `First Capital integrated an AI behavioral biometrics platform into its
      digital banking channel that generates account takeover risk scores based on keystroke
      dynamics and mouse movement patterns — the AML team began using these behavioral
      anomaly scores to trigger BSA transaction monitoring alerts without assessing whether
      behavioral biometric anomalies constitute BSA-qualifying suspicious activity indicators
      under 31 CFR 1020.320. FinCEN's SAR guidance and OCC examination standards require
      that suspicious activity indicators be grounded in documented typologies; using
      behavioral biometric anomaly scores as SAR-triggering inputs without a documented
      BSA legal basis and SR 11-7 model validation for this application creates AML
      alerts without regulatory grounding and potential CFPB privacy concerns under the
      Gramm-Leach-Bliley Act.`,
    keywords: ['AI behavioral biometrics', 'AML', 'SR 11-7', 'FinCEN', 'OCC', 'BSA trigger'],
    demoRelevant: false,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B918',
    name: 'AI Sanctions Screening Threshold Tuned by Vendor Without OCC Model Change Notification',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital's AI sanctions screening vendor remotely adjusted the model's
      fuzzy-match sensitivity threshold — reducing match alerts by 35% — as a "configuration
      optimization" under the maintenance clause of the service agreement, without triggering
      the model change management process that First Capital's SR 11-7 policy requires for
      any change to a compliance model's alert-generating logic. OFAC compliance depends
      on screening adequacy; a threshold reduction that eliminates 35% of potential SDN
      alerts may improve operational efficiency while creating OFAC screening gaps that
      expose the bank to sanctions violations; OCC examination teams have cited vendor-initiated
      threshold changes without bank model governance oversight as a systemic SR 11-7 and
      OFAC program failure.`,
    keywords: ['AI sanctions threshold', 'SR 11-7', 'OFAC', 'vendor model', 'OCC', 'AML'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B919',
    name: 'GenAI Typology Research Tool Produces Fabricated FinCEN Advisory Citations',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's BSA compliance team uses a generative AI research assistant
      to identify transaction monitoring typologies relevant to specific suspicious activity
      patterns, and BSA analysts have incorporated AI-generated typology citations — including
      fabricated FinCEN advisory numbers and FATF guidance references — into SAR narratives
      and case documentation without independently verifying the citations against the
      actual FinCEN and FATF publication libraries. FinCEN's SAR guidance requires that
      typology references in narratives be accurate and traceable to real regulatory guidance;
      a SAR narrative that cites a fabricated FinCEN advisory creates a documentation
      record that will not withstand OCC examination scrutiny and could undermine the
      bank's credibility in SAR-related law enforcement proceedings.`,
    keywords: ['GenAI hallucination', 'FinCEN', 'SAR typology', 'AML', 'OCC', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B920',
    name: 'AI Wire Fraud Detection Model Deployed in AML Workflow Without Distinct SR 11-7 Registration',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description: `First Capital's fraud operations team deployed an AI wire fraud detection
      model that flags wires with characteristics of BEC schemes, and the BSA team began
      using fraud model alerts as triggers for AML SAR investigations — treating the fraud
      model's outputs as if they were AML transaction monitoring alerts without registering
      the fraud model in the SR 11-7 model inventory as a compliance-purpose model or
      validating it for this AML application. SR 11-7 requires that each use of a model
      be inventoried and validated for the specific application; a fraud model validated
      for fraud detection and loss prevention has not been validated for BSA SAR triggering,
      and OCC examiners reviewing the SAR trigger inventory will find that a material
      proportion of SAR investigations originated from a model outside the SR 11-7
      AML model inventory.`,
    keywords: ['AI wire fraud model', 'SR 11-7', 'AML', 'OCC', 'model inventory', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B921',
    name: 'AI-Assisted Adverse Media Screening Misses Transliterated Entity Names in Non-Latin Script',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital's AI adverse media and negative news screening tool was
      benchmarked on English-language news sources during procurement and vendor testing,
      but was not evaluated for accuracy in identifying adverse media about entities whose
      names appear in Arabic, Persian, Russian, or Mandarin-language sources — the primary
      language sources for adverse information about entities from the bank's highest-AML-risk
      correspondent geographies. SR 11-7 model testing requires that models be evaluated
      against the full range of input conditions they will encounter in production; FinCEN's
      adverse media guidance identifies foreign-language source coverage as a key adequacy
      criterion for adverse media programs; the tool's English-language training bias is a
      documented AI model validation gap with direct impact on PEP and VASP EDD adequacy.`,
    keywords: ['adverse media AI', 'SR 11-7', 'FinCEN', 'AML', 'OCC', 'transliteration'],
    demoRelevant: false,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B922',
    name: 'Real-Time AI Payment Fraud Score Used for BSA SAR Triggering Without FinCEN Legal Review',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description: `First Capital's FedNow payment channel uses a real-time AI fraud scoring
      model that assigns fraud risk scores to instant payment transactions within 400
      milliseconds, and the BSA compliance team configured the transaction monitoring
      system to automatically generate SAR investigation cases for payments with fraud
      scores exceeding a threshold — using a real-time fraud prevention model as the
      de facto trigger for BSA SAR obligations without legal analysis confirming that
      elevated fraud scores constitute BSA-qualifying suspicious activity. FinCEN's SAR
      regulation requires that SAR filing be triggered by specific knowledge or reasonable
      suspicion of BSA-enumerated violations; a fraud score alone without articulable
      BSA typology matching does not constitute the reasonable suspicion required, and
      the bank's BSA legal counsel has not reviewed this AI-to-SAR trigger workflow.`,
    keywords: ['real-time AI fraud score', 'FinCEN', 'SAR trigger', 'AML', 'OCC', 'FedNow'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B923',
    name: 'AI Onboarding Risk Score Lacks Explainability for Regulatory Challenge Response',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description: `First Capital's AI-powered customer onboarding risk scoring model produces
      a composite risk score that determines whether a new account application receives
      expedited approval, standard CDD, or enhanced due diligence treatment — but the
      model produces no human-readable explanation of the score components, making it
      impossible for compliance officers to explain to an applicant denied standard
      onboarding why their application received elevated risk treatment. CFPB fair lending
      guidance on algorithmic models requires that adverse actions based on model outputs
      be explainable to the affected person; SR 11-7 model use documentation requires
      that model outputs used in compliance decisions be interpretable by the users
      relying on them; an opaque onboarding risk score creates both regulatory and
      legal challenge exposure that First Capital has not remediated.`,
    keywords: ['AI onboarding risk score', 'SR 11-7', 'CFPB', 'AML', 'OCC', 'explainability'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B924',
    name: 'AI Document Verification Tool Accepts Deepfake ID in Digital KYC Onboarding',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description: `First Capital's digital account opening channel uses an AI-powered document
      verification tool that analyzes uploaded government-issued ID photographs for
      authenticity — the tool was benchmarked against a 2021 deepfake image library but
      has not been retested against 2024-generation AI synthetic identity documents, which
      are indistinguishable from genuine IDs by the 2021-era detection model. FinCEN's
      2024 report on synthetic identity fraud identifies AI-generated synthetic IDs as
      the fastest-growing identity fraud vector; a document verification AI tool with
      a stale adversarial benchmark is a documented CIP compliance gap that exposes
      the bank to both fraud losses and BSA CIP violations when onboarded customers
      are subsequently identified as synthetic identities.`,
    keywords: ['deepfake ID', 'AI document verification', 'FinCEN', 'CIP', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B925',
    name: 'AI SAR Prioritization Model Score Distribution Shifts Undetected After Macroeconomic Shock',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's AI SAR prioritization model ranks transaction monitoring
      alerts by predicted investigative value, but has no automated monitoring to detect
      when the model's score distribution shifts materially following macroeconomic events —
      interest rate increases in 2023 and 2024 fundamentally changed corporate cash management
      patterns and retail money movement in ways that shifted the behavioral baseline the
      model was trained on, but neither the AML team nor the model risk function detected
      the distribution shift until a FinCEN examination team noted that the bank's SAR
      filing composition had changed markedly. SR 11-7 requires ongoing performance monitoring
      including distributional stability checks for compliance models; an AI AML model
      operating without distributional drift detection is governed at a lower standard
      than SR 11-7 requires for high-materiality compliance applications.`,
    keywords: ['AI model drift', 'SR 11-7', 'SAR prioritization', 'AML', 'FinCEN', 'OCC'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B926',
    name: 'AI-Driven AML Network Analysis Cross-Tenant Data Sharing Violates Gramm-Leach-Bliley Privacy',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `First Capital subscribed to a multi-bank AI AML consortium platform that
      improves AML network detection accuracy by pooling anonymized customer behavioral
      data across participating institutions — but the bank's legal team has not confirmed
      whether sharing de-identified customer transaction data with an AI consortium for
      model training satisfies Gramm-Leach-Bliley Act data sharing restrictions or whether
      the sharing constitutes a use of customer non-public personal information beyond the
      scope disclosed in the bank's privacy notice. GLBA Section 502 restricts the sharing
      of customer NPI with non-affiliated third parties; an AI consortium that receives
      customer behavioral data may qualify as a non-affiliated third party requiring GLBA
      opt-out notice; the absence of legal clearance for this data-sharing creates privacy
      law exposure alongside the AML program benefit.`,
    keywords: ['AML consortium AI', 'GLBA', 'data sharing', 'AML', 'OCC', 'SR 11-7'],
    demoRelevant: false,
    subTopic: 'ai-aml-part4',
  },
  {
    code: 'B927',
    name: 'AI AML Model Inventory Exempt Status Misapplied to Exclude High-Risk Compliance Models',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `First Capital's SR 11-7 model inventory policy includes a low-risk model
      exemption for simple rules-based tools that do not materially influence compliance
      decisions — the MRM team has misapplied this exemption to exclude from inventory
      registration five vendor-supplied AML tools that generate customer risk scores and
      influence alert disposition, CDD tier assignment, and EDD review triggers. SR 11-7
      explicitly states that the low-risk exemption applies to tools with minimal potential
      adverse consequences and does not apply to models that inform BSA/AML compliance
      decisions; OCC examination teams have cited overbroad application of model inventory
      exemptions as a primary MRM governance failure at institutions under consent orders,
      and First Capital's pattern of exempting compliance-purpose AI tools is directly
      contrary to its consent order MRM remediation requirements.`,
    keywords: ['model inventory exemption', 'SR 11-7', 'AML', 'OCC', 'consent order', 'MRM'],
    demoRelevant: true,
    subTopic: 'ai-aml-part4',
  },

  // ── Transaction Monitoring Tuning (B928–B939) ─────────────────────────────
  {
    code: 'B928',
    name: 'Transaction Monitoring Alert Threshold Calibration Lacks Documented Statistical Methodology',
    officeCategory: 'back_office',
    failureRatePct: 77,
    description: `First Capital's transaction monitoring alert thresholds were set at system
      implementation in 2019 using round-number dollar amounts and behavioral counts that
      were not derived from statistical analysis of the bank's customer population
      transaction distributions — thresholds like "$9,000 cash transaction" and "5+ wires
      in 30 days" reflect historical industry rule-of-thumb settings rather than data-driven
      calibration to the bank's specific customer base and product mix. SR 11-7 model
      documentation requires that threshold-based monitoring models document the
      statistical basis for threshold selection; OCC examination guidance and FinCEN's
      program adequacy standards both expect that institutions periodically validate
      their monitoring thresholds using SAR conversion rate analysis and peer benchmarking;
      the absence of documented calibration methodology is a fundamental AML model
      governance gap.`,
    keywords: ['TM threshold calibration', 'SR 11-7', 'AML', 'FinCEN', 'OCC', 'statistical methodology'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B929',
    name: 'Alert Volume Growth Not Matched by Analyst Staffing Causing Systematic Review Backlogs',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `First Capital's transaction monitoring alert volume grew 40% over 24 months
      following new product launches and customer growth, but the AML operations headcount
      was not increased proportionally — the analyst team reviews only 78% of alerts within
      the 30-day investigative window, with 22% aging into a backlog that receives a
      summary review rather than a full investigation. FinCEN and OCC require that the
      AML program include sufficient resources to investigate all alerts within the review
      window; a systematic review backlog that results in summary disposition of 22% of
      alerts is a program capacity failure that OCC examiners test directly by reviewing
      alert aging reports, and the consent order First Capital is remediating includes
      an explicit staffing adequacy finding.`,
    keywords: ['AML staffing', 'alert backlog', 'FinCEN', 'AML', 'OCC', 'BSA program'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B930',
    name: 'Scenario Coverage Gap for Human Trafficking Financial Indicators',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `FinCEN's 2014 and 2020 advisories on human trafficking financial indicators
      describe specific transaction patterns — frequent small cash deposits from multiple
      ATMs, third-party payment of commercial lodging, recurring small-amount same-day
      credits from multiple individuals — that First Capital's transaction monitoring
      scenario library does not address with dedicated detection scenarios, leaving this
      FinCEN national priority typology unmonitored. FinCEN's national AML priorities
      designation for human trafficking requires that institutions update their monitoring
      programs to address the designated typologies; a scenario library that was built
      before the 2020 advisory and not updated afterward creates an AML program gap that
      OCC examination teams are actively testing as part of the national priorities
      assessment framework.`,
    keywords: ['human trafficking AML', 'FinCEN advisory', 'AML', 'OCC', 'BSA national priorities', 'TM scenarios'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B931',
    name: 'Transaction Monitoring Scenario Testing Uses Only Synthetic Data Not Validated Against Live Patterns',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `First Capital validates its transaction monitoring scenarios using synthetic
      test transactions generated by the AML technology vendor, but has never back-tested
      the scenarios against the bank's own historical SAR data to confirm that the synthetic
      test population is representative of the suspicious activity patterns actually seen
      in the bank's customer base. SR 11-7 model testing requirements mandate that the
      test population reflect the production environment; OCC examination teams reviewing
      AML model validation documentation have cited exclusive reliance on vendor-generated
      synthetic test data — without validation against production SAR outcomes — as a
      testing methodology deficiency that does not satisfy SR 11-7 validation standards.`,
    keywords: ['TM scenario testing', 'SR 11-7', 'AML', 'OCC', 'synthetic test data', 'FinCEN'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B932',
    name: 'Peer Benchmark SAR Rate Comparison Not Conducted Against FinCEN Industry Quartile Data',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `First Capital does not benchmark its SAR filing rate — SARs per million
      dollars of assets or per thousand accounts — against FinCEN's published industry data
      or against OCC peer group comparisons to assess whether its reporting rate falls within
      a range consistent with a program of adequate sensitivity. FinCEN uses SAR filing rate
      peer comparisons as a program adequacy signal during examinations; a bank filing SARs
      at 40% below its peer group median may have a genuinely low-risk customer portfolio
      or may have monitoring thresholds set too high — without peer benchmark analysis, the
      bank cannot distinguish these explanations and cannot proactively defend its SAR rate
      to OCC examination teams before the examination identifies a potential under-filing
      concern.`,
    keywords: ['SAR peer benchmarking', 'FinCEN', 'AML', 'OCC', 'BSA program', 'transaction monitoring'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B933',
    name: 'Cryptocurrency Transaction Monitoring Alert Threshold Not Calibrated to Chain-Specific Risk',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description: `First Capital applies uniform dollar-amount thresholds to all cryptocurrency-
      related fiat transactions regardless of the underlying blockchain network involved —
      a $5,000 transaction funded from a Bitcoin exchange receives the same monitoring
      treatment as a $5,000 transaction from a Monero-to-Bitcoin conversion service,
      despite the materially higher AML risk posed by privacy-coin conversion. FinCEN's
      cryptocurrency AML guidance and its national priorities designation for virtual
      currency-related financial crime recognize that different crypto asset types and
      transaction mechanisms pose different levels of AML risk; a monitoring program
      that does not differentiate thresholds and scenarios by crypto asset type and
      exchange provenance cannot implement the risk-based approach that FinCEN requires.`,
    keywords: ['crypto TM thresholds', 'FinCEN', 'AML', 'OCC', 'VASP', 'blockchain analytics'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B934',
    name: 'Transaction Monitoring Rules Engine Not Updated After Core Banking Migration',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `First Capital completed a core banking system migration 14 months ago, but
      the transaction monitoring rules engine still references legacy account type codes and
      transaction category codes from the prior core — codes that do not map one-to-one
      to the new core's transaction classification scheme — causing 15–20% of transaction
      records to be miscategorized in the monitoring system and triggering alerts against
      the wrong customer segment thresholds. OCC examination guidance requires that AML
      monitoring systems be validated after significant technology changes to confirm
      that data feeds are accurate and complete; a monitoring system operating on stale
      field mappings after a core conversion is generating structurally distorted alert
      data that invalidates the SR 11-7 validation performed against the prior core's
      transaction schema.`,
    keywords: ['TM rules engine', 'core banking migration', 'SR 11-7', 'AML', 'OCC', 'data mapping'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B935',
    name: 'Negative Alert Disposition Productivity Incentives Undermine SAR Filing Independence',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `First Capital's AML operations team is evaluated on alert clearance velocity —
      the number of alerts cleared per analyst per day — as a primary performance metric,
      creating productivity incentives that systematically favor alert closure over SAR
      filing because SAR investigations take 3–5× longer to complete than non-SAR
      dispositions. FinCEN's BSA program adequacy guidance identifies inappropriate
      productivity incentives that discourage SAR filings as a program design flaw;
      OCC examination teams have cited alert clearance rate metrics unbalanced against
      SAR quality and filing rate metrics as a governance weakness that compromises the
      independence of the SAR filing decision at the analyst level.`,
    keywords: ['AML analyst incentives', 'FinCEN', 'SAR', 'AML', 'OCC', 'BSA program governance'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B936',
    name: 'Structuring Alert Scenario Does Not Account for New Instant Payment Channel Splitting',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `First Capital's structuring detection scenario was designed around traditional
      cash deposits and wire transfers, but the bank's FedNow and RTP channels now enable
      customers to split large payments into multiple sub-$10,000 instant payments sent
      within minutes — a structuring pattern the legacy monitoring scenario cannot detect
      because it evaluates cash transactions and wires separately from instant payments
      and does not aggregate cross-channel payment totals within a rolling window. FinCEN's
      structuring prohibition under 31 U.S.C. 5324 applies regardless of payment channel;
      a monitoring program that evaluates channels independently rather than aggregating
      cross-channel transaction totals creates a structural monitoring gap for structuring
      conducted through instant payment channel splitting.`,
    keywords: ['structuring detection', 'FedNow', 'RTP', 'FinCEN', 'AML', 'OCC'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B937',
    name: 'Transaction Monitoring Data Quality Audit Not Conducted After Vendor Data Feed Change',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `First Capital's primary data vendor changed its transaction data feed format
      in Q2 2024 following an API version upgrade, introducing new field encodings for
      transaction purpose codes and beneficiary identifiers — the bank did not conduct
      a data quality audit following the format change and OCC examination data analysis
      found that 8% of transaction records loaded into the monitoring system after the
      format change have null or incorrectly mapped purpose codes that reduce the
      effectiveness of purpose-code-based monitoring scenarios. SR 11-7 model governance
      requires that data quality be maintained across the model's operational lifecycle
      including after upstream data source changes; FinCEN's program adequacy standards
      require that monitoring system data be complete, accurate, and timely.`,
    keywords: ['TM data quality', 'SR 11-7', 'AML', 'OCC', 'FinCEN', 'data feed'],
    demoRelevant: false,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B938',
    name: 'Cross-Product Transaction Aggregation Gap Between Deposit and Loan Payment Channels',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description: `First Capital's transaction monitoring system monitors deposit account
      transactions and loan payment transactions through separate monitoring modules that
      do not aggregate activity across a customer's complete product relationship — a
      customer engaged in loan payment structuring by making multiple cash loan payments
      below $10,000 would not trigger a structuring alert because the loan payment module
      monitors loan payments independently from the deposit transaction module, and the
      FinCEN structuring prohibition applies to any transaction at a financial institution,
      not only deposit transactions. OCC examination guidance on BSA monitoring requires
      that transaction aggregation cover all relevant transaction types across a customer's
      relationship; the cross-product aggregation gap is a documented monitoring scope
      deficiency that FinCEN examiners test through cross-product transaction analysis.`,
    keywords: ['cross-product TM aggregation', 'FinCEN', 'AML', 'OCC', 'structuring', 'BSA'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
  {
    code: 'B939',
    name: 'Transaction Monitoring Lookback Period Insufficient for Slow-Pattern Layering Detection',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description: `First Capital's transaction monitoring lookback window evaluates customer
      activity over a 30-day rolling period for most scenarios, but sophisticated layering
      schemes deliberately operate on 60–180 day cycles — placing funds in dormant accounts
      for 90 days before layering — to evade the sub-60-day monitoring windows used by most
      U.S. banks. FinCEN typology publications on professional money laundering networks
      document the deliberate use of extended dormancy periods to evade short-window
      monitoring; OCC examination guidance identifies lookback period adequacy as a
      critical TM calibration parameter; a 30-day lookback window fails to detect the
      slow-pattern layering typologies that FATF and FinCEN have identified as most
      commonly used by professional money laundering organizations targeting regional
      banks of First Capital's asset size.`,
    keywords: ['TM lookback window', 'FinCEN', 'AML', 'OCC', 'layering detection', 'FATF'],
    demoRelevant: true,
    subTopic: 'transaction-monitoring-tuning',
  },
];
