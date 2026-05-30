// seed-banking-dom09-fraud-part3.ts
// Banking genome patterns — Fraud Risk Management
// Code range: B2620–B2679  (60 patterns)
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

export const BANKING_DOM09_FRAUD_PART3_PATTERNS: PatternSeed[] = [

  // ── Synthetic Identity Fraud ───────────────────────────────────────────────
  {
    code: 'B2620',
    name: 'Synthetic Identity Detection Absent From Credit Card Origination Scorecard',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's credit card origination scorecard was built to detect third-party identity
      theft — where a fraudster uses a real person's stolen SSN — and does not include features
      specifically designed to detect synthetic identities, which combine a real SSN (often a
      child's or deceased person's) with fabricated name, address, and date-of-birth fields that
      produce a new credit file with no prior derogatory history. The CFPB's 2019 synthetic
      identity fraud report and the Federal Reserve's 2019 white paper on synthetic identity
      fraud both document that synthetic identities pass standard credit bureau inquiry because
      they are not recognized as fraud until after charge-off; First Capital's MRM team has not
      validated the origination model against a synthetic identity test population, leaving the
      scorecard conceptually unsound for this fraud typology under SR 11-7.`,
    keywords: ['synthetic identity fraud', 'SR 11-7', 'CFPB', 'Federal Reserve synthetic ID', 'credit origination model'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2621',
    name: 'Credit File Piggybacking Exploitation Not Flagged in Synthetic Identity Review',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's fraud pre-screening for credit card and personal loan applications does
      not identify authorized user tradeline piggybacking — a technique where synthetic identity
      fraudsters purchase authorized user status on high-quality aged accounts to artificially
      inflate the synthetic identity's credit score before submitting a loan application. The
      pattern is detectable through credit bureau inquiry: the synthetic applicant's credit file
      shows a thin primary credit history, one or more recently added authorized user tradelines
      on accounts with no organic relationship to the applicant, and credit score elevation
      disproportionate to the applicant's independently verifiable income and employment history.
      OCC guidance on credit fraud detection and FFIEC examination procedures for consumer lending
      both require that origination controls specifically address authorized-user tradeline
      inflation as a synthetic identity fraud vector.`,
    keywords: ['tradeline piggybacking', 'synthetic identity', 'credit fraud', 'FFIEC', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2622',
    name: 'SSA Death Master File Cross-Check Not Implemented for Deposit Account Opening',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's CIP process for deposit account opening does not cross-reference the
      applicant's SSN against the Social Security Administration's Death Master File (DMF), a
      standard control for detecting synthetic identities built on deceased persons' SSNs.
      Synthetic identity fraudsters routinely harvest SSNs from publicly accessible deceased
      records and build new credit profiles around them; without DMF cross-check at account
      opening, First Capital cannot detect applications using deceased-person SSNs during
      the customer due diligence phase. FinCEN's CIP guidance and FFIEC examination procedures
      for BSA compliance both reference DMF verification as a baseline KYC control for financial
      institutions; the absence of this check is a documented gap in First Capital's CIP
      program that the OCC's next examination cycle is likely to cite.`,
    keywords: ['Death Master File', 'CIP', 'KYC', 'FinCEN', 'synthetic identity fraud'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2623',
    name: 'Bust-Out Synthetic Identity Ring Detection Requires Cross-Account Graph Analysis Absent From Fraud Platform',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `Synthetic identity bust-out fraud — where a network of synthetic identities is cultivated
      over 12–24 months across multiple First Capital accounts before simultaneously charging
      all accounts to maximum and disappearing — requires graph-based link analysis connecting
      shared device fingerprints, IP addresses, email domains, employer names, and physical
      addresses across the account population to detect coordinated activity. First Capital's
      fraud platform evaluates each account individually against rules-based thresholds and does
      not perform cross-account graph analysis; the shared infrastructure used by a synthetic
      identity ring — common mailing addresses, phone number pools, and device clusters — is
      only visible at the network level. The Federal Reserve's synthetic identity fraud guidance
      and industry consortium research from the Identity Theft Resource Center document that
      bust-out losses are only preventable through network-level detection, a capability
      First Capital has not deployed.`,
    keywords: ['bust-out fraud', 'synthetic identity ring', 'graph analytics', 'Federal Reserve fraud guidance', 'link analysis'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2624',
    name: 'AI Synthetic Identity Scoring Model Not Tested Against Child SSN Farming Typology',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital licenses an AI synthetic identity detection model that the vendor validated
      against historical synthetic identity cases predominantly involving adult SSNs, but the
      bank has not independently tested the model's performance against the child SSN farming
      typology — where fraudsters obtain SSNs issued to minors (which have no existing credit
      file) and begin building credit profiles years before the child would naturally seek credit.
      Child SSN synthetic identities produce credit file age profiles that the model's training
      data may not adequately represent, creating a systematic false-negative risk that SR 11-7
      requires banks to assess through portfolio-specific validation. The bank's vendor management
      review under OCC Bulletin 2023-17 does not require the vendor to disclose the demographic
      composition of the training population or test results against child-SSN typologies.`,
    keywords: ['child SSN fraud', 'synthetic identity AI', 'SR 11-7 validation', 'OCC Bulletin 2023-17', 'TPRM'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2625',
    name: 'Synthetic Identity Charge-Off Not Reported as Fraud Loss in Call Report — Regulatory Misclassification',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital classifies synthetic identity charge-offs as credit losses rather than
      fraud losses in its Call Report submissions because the accounts were never formally
      identified as synthetic identity fraud before charge-off — the fraud detection system
      failed to flag them during the credit relationship. The misclassification understates
      the bank's fraud loss experience in regulatory filings and prevents the bank from
      accurately tracking synthetic identity fraud as a loss driver in its operational risk
      framework. OCC guidance on regulatory reporting and the FFIEC's Call Report instructions
      require that losses attributable to fraud be classified as fraud losses regardless of
      whether the fraud was detected prior to loss realization; the bank's charge-off
      classification methodology has not been reviewed against this standard.`,
    keywords: ['synthetic identity charge-off', 'Call Report', 'FFIEC', 'OCC reporting', 'fraud loss classification'],
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2626',
    name: 'Digital Account Opening Velocity Controls Not Calibrated for Synthetic Identity Ring Activity',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's digital account opening velocity controls limit the number of new accounts
      per device and per IP address but do not detect the distributed infrastructure pattern used
      by synthetic identity rings — where each synthetic applicant uses a unique device fingerprint
      and residential proxy IP, making individual-account velocity controls ineffective at the
      network level. The ring's shared characteristics — consistent application timing windows,
      overlapping employer and address data pools, and uniform document quality patterns —
      are only detectable through session-level behavioral analytics combined with cross-application
      entity resolution. OCC examination guidance on digital account opening fraud and the
      Federal Reserve's synthetic identity fraud white paper both identify network-level attribution
      as the required control layer when individual-account velocity rules are defeated by
      distributed synthetic identity operations.`,
    keywords: ['digital account opening fraud', 'synthetic identity', 'velocity controls', 'OCC examination', 'entity resolution'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2627',
    name: 'Synthetic Identity Fraud SAR Narrative Not Including Network Typology — FinCEN Intelligence Gap',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `When First Capital files SARs on synthetic identity fraud cases, the SAR narratives
      document the individual account-level activity but do not include network typology
      information — the shared device, address, employer, and application timing patterns
      that would allow FinCEN to identify the case as part of a larger synthetic identity
      ring rather than an isolated account. FinCEN's SAR narrative guidance and the
      Interagency Synthetic Identity Fraud Working Group recommendations both direct
      financial institutions to include network indicators in synthetic identity SARs to
      enable law enforcement to pursue organized fraud rings rather than individual accounts.
      The bank's SAR preparation process does not include a network enrichment step that
      adds cross-account connection data to individual synthetic identity SAR narratives,
      reducing the intelligence value of the bank's SAR filings.`,
    keywords: ['synthetic identity SAR', 'FinCEN', 'SAR narrative', 'BSA/AML', 'fraud ring network'],
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2628',
    name: 'Synthetic Identity AI Detection Model Feature Set Excludes Behavioral Biometric Signals',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's AI synthetic identity detection model evaluates static identity attributes
      — SSN issuance state and date, address history, credit file age — but does not incorporate
      behavioral biometric signals from the digital application session, such as typing cadence
      consistency, copy-paste behavior for SSN and date-of-birth fields, and form navigation
      patterns that distinguish humans completing genuine applications from automated scripts
      submitting synthetic identity applications. Behavioral biometric signals are the primary
      detection layer for automated synthetic identity application submissions, which account
      for an estimated 60% of synthetic identity fraud originations according to LexisNexis Risk
      Solutions' 2023 fraud report. The bank's SR 11-7 validation for the synthetic identity
      model did not assess whether the model's feature set is complete for detecting automation-
      driven synthetic identity submissions.`,
    keywords: ['behavioral biometrics', 'synthetic identity AI', 'SR 11-7', 'digital origination fraud', 'bot detection'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2629',
    name: 'Synthetic Identity Cultivation Period Monitoring Not in Credit Portfolio Review',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's credit portfolio monitoring does not include a synthetic identity cultivation
      detection layer that identifies accounts exhibiting the characteristic build-up behavior —
      on-time minimum payments for 12–24 months, gradual credit limit increase requests accepted
      by the bank, and sudden utilization jumps to 100% across all credit products simultaneously
      — that precede a synthetic identity bust-out. The cultivation period pattern is distinguishable
      from normal credit behavior: the account consistently pays the minimum and never the full
      balance, does not use the account for recurring consumer purchases, and shows no organic
      behavioral pattern consistent with a real customer relationship. OCC guidance on credit
      portfolio fraud monitoring and the Federal Reserve's synthetic identity research both
      identify cultivation monitoring as a loss prevention control that operates in the
      existing-accounts phase, not just at origination.`,
    keywords: ['synthetic identity bust-out', 'credit portfolio monitoring', 'OCC guidance', 'Federal Reserve', 'cultivation detection'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2630',
    name: 'Thin-File Applicant Enhanced Due Diligence Not Triggered by Synthetic Identity Indicators',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's credit origination workflow applies enhanced due diligence to applicants
      with derogatory credit history but does not apply a parallel enhanced due diligence pathway
      for thin-file applicants — those with fewer than three tradelines and a credit file under
      24 months — when the application also includes synthetic identity risk indicators such as
      SSN issuance date inconsistent with the applicant's stated age, address history that does
      not match the credit bureau's address verification, or employer verification failure.
      Thin-file status combined with SSN anomalies is the highest-precision indicator combination
      for synthetic identity fraud identified in the CFPB's 2019 synthetic identity report;
      First Capital's origination workflow does not treat this combination as a mandatory
      enhanced review trigger.`,
    keywords: ['thin-file applicant', 'synthetic identity', 'CFPB', 'enhanced due diligence', 'credit origination'],
    demoRelevant: true,
    subTopic: 'synthetic-identity-fraud',
  },
  {
    code: 'B2631',
    name: 'Synthetic Identity Loss Reserve Methodology Not Capturing Forward-Looking Ring Exposure',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's CECL loss reserve methodology incorporates historical synthetic identity
      charge-off rates but does not include a forward-looking component that estimates the
      expected bust-out losses from synthetic identities currently in the cultivation phase
      of the fraud lifecycle within the portfolio. Because synthetic identities perform as
      normal accounts until the bust-out event, they are not flagged in the credit impairment
      analysis that informs the CECL reserve; a network-level analysis of the portfolio
      can identify cultivation-phase synthetic clusters and estimate the timing and magnitude
      of expected bust-out losses. SR 11-7 CECL model governance requirements and OCC CECL
      examination guidance both require that forward-looking loss components include all known
      material loss drivers, which the bank's methodology does not address for the synthetic
      identity cultivation pipeline.`,
    keywords: ['CECL', 'synthetic identity reserve', 'SR 11-7', 'OCC CECL examination', 'bust-out loss estimation'],
    subTopic: 'synthetic-identity-fraud',
  },

  // ── Elder Fraud Scams ──────────────────────────────────────────────────────
  {
    code: 'B2632',
    name: 'Grandparent Scam Wire Transfer Intervention Protocol Not Implemented at Teller Level',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital's teller training program does not include a specific intervention protocol
      for grandparent scam wire transfer requests — where an elderly customer is instructed by
      a fraudster posing as a grandchild or law enforcement to wire funds immediately and keep
      the transaction confidential. Grandparent scam losses averaged $9,000 per victim in
      2023 according to the FTC's Consumer Sentinel Data Book, and the pattern is identifiable
      at the teller window: an elderly customer requesting a large wire transfer, expressing
      urgency and secrecy, and providing an explanation that involves a family emergency or
      legal proceeding. The CFPB's elder financial protection supervisory expectations and
      OCC guidance on elder customer protection both require that banks implement teller-level
      scam intervention training specific to grandparent and impostor scam patterns.`,
    keywords: ['grandparent scam', 'elder fraud', 'CFPB elder protection', 'OCC guidance', 'wire fraud intervention'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2633',
    name: 'Tech Support Scam Outbound Wire Monitoring Not Targeting Senior Account Profiles',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's outbound wire transfer fraud monitoring does not apply enhanced scrutiny
      to wire requests from accounts held by customers over 65 when the wire destination is a
      cryptocurrency exchange or foreign bank account — the standard fund routing used in tech
      support scams targeting elderly customers. Tech support scam losses reported to the FTC's
      IC3 exceeded $800M in 2023, with victims over 60 comprising 58% of total losses; the
      average loss per elderly victim was $24,000. The bank's wire monitoring rules apply
      uniform velocity and amount thresholds without age-based segmentation or destination-type
      enrichment, missing the combination signal — elderly customer, crypto or offshore
      destination, first-time wire — that characterizes tech support scam fund movement.
      FinCEN's 2023 elder fraud advisory and CFPB supervisory guidance both require age-
      segmented detection for senior-targeted fraud typologies.`,
    keywords: ['tech support scam', 'elder fraud', 'FinCEN elder advisory', 'CFPB', 'wire fraud monitoring'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2634',
    name: 'Romance Scam Fund Transfer Pattern Not in AI Behavioral Analytics for Senior Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's behavioral fraud analytics model does not include features for detecting
      romance scam fund transfer patterns in senior customer accounts — specifically, the
      characteristic sequence of escalating ACH and wire transfers to new payees over a 3–6 month
      relationship that is established entirely online, with no prior transaction history and
      geographically distant beneficiaries. The FBI's IC3 reported $1.3B in romance scam losses
      in 2022, with the highest per-victim losses concentrated in customers over 60; the
      pattern is distinguishable from legitimate relationship-based fund transfers by the
      acceleration curve, the absence of any in-person banking behavior consistent with the
      claimed relationship, and the progressive escalation of transfer amounts. The bank's
      fraud AI training data does not include labeled romance scam case examples because
      the bank has historically classified these as customer choice transactions rather than
      fraud.`,
    keywords: ['romance scam', 'elder fraud', 'IC3', 'behavioral analytics', 'CFPB elder protection'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2635',
    name: 'IRS Impersonation Scam Phone Channel Intervention Not Linked to Real-Time Transaction Hold',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's contact center fraud team can identify calls where an elderly customer
      describes an IRS or Social Security Administration impersonation scam — a fraudster who
      claims the customer owes back taxes or has had their SSN compromised and demands immediate
      gift card or wire payment — but the contact center system does not provide agents with
      a real-time transaction hold capability to prevent the customer from completing the
      payment at a branch, ATM, or online banking session while the intervention conversation
      is in progress. Without the ability to place a temporary hold during the intervention
      call, the customer frequently completes the fraudulent transaction at a branch teller
      or through mobile banking before the contact center alert reaches the fraud operations
      team. OCC guidance on elder customer protection and the CFPB's elder fraud supervisory
      focus both require that banks implement cross-channel intervention capabilities for
      senior-targeted scam typologies.`,
    keywords: ['IRS impersonation scam', 'elder fraud', 'OCC elder protection', 'CFPB', 'real-time transaction hold'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2636',
    name: 'Elder Fraud Scam AI Detection Not Incorporating Inbound Call Sentiment Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital deployed an AI model for elder financial exploitation detection in deposit
      account transaction monitoring but has not integrated the model with the contact center's
      call recording and sentiment analysis capability, missing the signal that a senior customer
      is under live coaching by a scammer during the call — a pattern where the customer's
      language mirrors scripted instructions, the customer expresses unusually high urgency,
      and background voices or pauses indicate a third party is providing real-time direction.
      Real-time call sentiment AI integrated with transaction hold authority is the primary
      intervention mechanism recommended by the AARP's 2023 bank partnership guidance on
      elder fraud and FinCEN's 2022 EFE advisory; First Capital has the constituent technology
      components but has not integrated them into a unified elder scam intervention workflow
      under SR 11-7 model governance.`,
    keywords: ['elder fraud AI', 'call sentiment analysis', 'FinCEN EFE advisory', 'SR 11-7', 'AARP bank partnership'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2637',
    name: 'Gift Card Purchase Anomaly in Senior Accounts Not Generating Real-Time Branch Alert',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's branch debit card monitoring generates alerts for large transactions but
      does not specifically flag the pattern of multiple consecutive gift card purchases — at
      grocery, pharmacy, or convenience store locations — in accounts held by customers over 65,
      a pattern that is strongly indicative of government impersonation and grandparent scam
      activity where the fraudster instructs the victim to purchase gift cards and provide the
      card numbers. The FTC's 2023 Consumer Sentinel data showed gift cards as the payment
      method in 23% of elder fraud losses, with individual losses averaging $2,800 per incident
      for victims over 60. A real-time teller alert triggered by consecutive gift card
      debit transactions in senior accounts is a recommended control in both the CFPB's elder
      financial protection guidance and OCC examination procedures for senior customer
      protection programs.`,
    keywords: ['gift card fraud', 'elder fraud', 'CFPB elder protection', 'OCC examination', 'real-time alert'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2638',
    name: 'Lottery and Prize Scam Advance Fee Payment Not Flagged in Senior Wire Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's wire transfer fraud monitoring does not include a detection rule for the
      advance fee payment pattern associated with lottery and prize scams targeting elderly
      customers — repeated small-to-medium wire transfers to international destinations
      coinciding with account activity consistent with the victim sending "taxes" and "processing
      fees" in advance of a claimed large prize payment that never arrives. The FBI's IC3 2023
      report identified lottery and sweepstakes scams as the second-highest loss category for
      victims over 60 after tech support scams, with median losses of $18,000. First Capital's
      international wire fraud rules evaluate amount and destination country but do not
      incorporate the recurring payment pattern, the stated purpose codes consistent with
      advance fee scams, or the customer's age as signals that the CFPB's elder fraud
      supervisory guidance identifies as mandatory detection layers.`,
    keywords: ['lottery scam', 'advance fee fraud', 'elder fraud', 'CFPB elder protection', 'international wire monitoring'],
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2639',
    name: 'Elder Scam Victim Reimbursement Policy Inconsistently Applied — CFPB UDAAP Exposure',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital does not have a documented reimbursement policy for elder fraud scam victims
      that defines the conditions under which the bank will voluntarily reimburse a customer who
      was deceived into authorizing a fraudulent wire or ACH transfer, resulting in highly
      inconsistent reimbursement decisions that depend on the relationship manager's discretion
      and the customer's assertiveness. The absence of a consistent policy creates CFPB UDAAP
      exposure because similar victims receive materially different outcomes from the bank's
      dispute resolution process, and CFPB supervisory guidance on elder financial protection
      requires that banks maintain consistent, documented procedures for handling elder fraud
      scam claims. Inconsistent reimbursement of elder scam victims has been cited in CFPB
      supervisory correspondence at peer regional banks as an unfair practice under UDAAP.`,
    keywords: ['elder scam reimbursement', 'CFPB UDAAP', 'authorized push payment', 'dispute resolution', 'elder fraud policy'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2640',
    name: 'Senior Safe Act Employee Training Program Not Documented — Immunity Benefit Lost',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital has not implemented the documented elder financial exploitation training
      program required to obtain immunity protection for employees who report suspected elder
      financial exploitation to appropriate authorities under the Senior Safe Act of 2018.
      The Senior Safe Act grants financial institution employees immunity from civil and
      administrative liability when they report suspected elder exploitation to law enforcement,
      financial regulators, or adult protective services — but only if the institution has
      trained the employees in recognizing and reporting elder exploitation in a manner
      consistent with the Act's requirements. Without the documented training program, First
      Capital employees who report elder exploitation lose the Act's immunity protections,
      creating personal liability exposure that deters voluntary reporting and undermines
      the bank's elder financial exploitation detection program.`,
    keywords: ['Senior Safe Act', 'elder exploitation training', 'FinCEN', 'CFPB', 'APS reporting immunity'],
    demoRelevant: true,
    subTopic: 'elder-fraud-scams',
  },
  {
    code: 'B2641',
    name: 'Caregiver Financial Exploitation Not Triggering Enhanced Monitoring for Home Care Industry Employers',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's account monitoring program does not apply enhanced scrutiny when
      reviewing account activity for elderly customers who make recurring payments to
      in-home caregiver services — a high-risk relationship category where caregiver financial
      exploitation through unauthorized account access, coerced fund transfers, and
      check theft is documented as a dominant elder fraud vector by the CFPB's 2022
      elder financial exploitation report. The bank can identify caregiving payment patterns
      from transaction descriptions and merchant category codes but does not use this signal
      to tier the account into an enhanced monitoring population with tighter alert thresholds
      for new payees, address changes, and beneficiary updates. OCC examination procedures
      for elder financial protection require that banks implement risk-based monitoring
      tiering for senior accounts with documented caregiver relationships.`,
    keywords: ['caregiver exploitation', 'elder fraud', 'CFPB', 'OCC examination', 'in-home care fraud'],
    subTopic: 'elder-fraud-scams',
  },

  // ── Business Email Compromise ──────────────────────────────────────────────
  {
    code: 'B2642',
    name: 'BEC Wire Recall Process Exceeds FedWire Reversal Window Due to Manual Initiation',
    officeCategory: 'middle_office',
    failureRatePct: 82,
    description:
      `First Capital's process for responding to business email compromise wire fraud requires
      that a commercial client contact the relationship manager, who escalates to the wire
      operations team, which manually initiates a FedWire recall request — a sequence that
      routinely takes 4–6 hours from the client's initial fraud report, well outside the
      effective 24-hour recall window during which funds are recoverable before the
      beneficiary bank distributes them. FinCEN's 2023 BEC advisory and the FBI's IC3
      financial fraud kill chain guidance both identify sub-2-hour recall initiation as
      the threshold for meaningful fund recovery; First Capital's manual escalation path
      structurally prevents meeting this threshold for the majority of BEC wire fraud
      reports that arrive outside of wire operations' peak staffing hours.`,
    keywords: ['BEC wire recall', 'FedWire reversal', 'FinCEN BEC advisory', 'FBI IC3', 'wire fraud recovery'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2643',
    name: 'Commercial Client BEC Education Program Not Covering CEO Fraud Payroll Diversion Vector',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial client fraud education program covers the vendor payment
      redirect variant of BEC — where fraudsters impersonate vendors and request account
      number changes — but does not include the CEO fraud payroll diversion variant, where
      fraudsters impersonate the CEO or CFO to instruct HR or payroll staff to change
      the CEO's direct deposit account to a fraudster-controlled account. CEO fraud payroll
      diversion losses accounted for 18% of BEC losses reported to the FBI's IC3 in 2022,
      and the attack pattern exploits the same credential compromise and wire authorization
      vulnerabilities present in First Capital's commercial client base. OCC guidance on
      commercial banking fraud education and FinCEN's 2023 BEC advisory require that
      bank commercial client education programs cover all documented BEC variants,
      not only the payment redirection variant.`,
    keywords: ['CEO fraud', 'BEC payroll diversion', 'FinCEN BEC advisory', 'FBI IC3', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2644',
    name: 'Out-of-Band Authentication Not Required for Commercial Wire Instruction Changes',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's commercial wire origination platform allows authorized signatories to
      modify beneficiary bank account numbers in standing wire instructions using only email
      confirmation — the same channel that BEC attackers compromise — without requiring an
      out-of-band verification call to a pre-registered phone number for the commercial client's
      CFO or treasurer. FFIEC guidance on commercial account fraud and the OCC's examination
      procedures for wire fraud risk management both require that changes to beneficiary
      account numbers be validated through an out-of-band authentication process that does
      not use the same communication channel as the instruction change request; First Capital's
      reliance on email confirmation for wire instruction modifications is explicitly identified
      as an inadequate control in the FFIEC guidance on corporate account takeover.`,
    keywords: ['out-of-band authentication', 'BEC wire fraud', 'FFIEC', 'OCC examination', 'corporate account takeover'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2645',
    name: 'Real Estate Transaction BEC Not Covered by Commercial Wire Fraud Rules',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's commercial wire fraud monitoring applies enhanced scrutiny to ACH and
      wire transactions identified by its commercial client base as vendor payments but does
      not include specific detection rules for real estate closing fraud — a BEC variant where
      fraudsters intercept escrow and title company communications to redirect closing funds
      to fraudster-controlled accounts. Real estate BEC losses totaled $446M in the FBI's
      IC3 2022 report, the highest single-industry BEC loss category; the transactions
      are distinguishable from standard commercial wires by the combination of large single-
      payment amounts, new beneficiaries that match title company naming patterns, and urgency
      language in wire instruction emails. FinCEN's 2023 BEC advisory identifies real estate
      closing fraud as a separate detection requirement for banks with significant commercial
      real estate and residential mortgage lending activity.`,
    keywords: ['real estate BEC', 'escrow fraud', 'FinCEN BEC advisory', 'FBI IC3', 'closing fraud detection'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2646',
    name: 'AI BEC Detection Model Not Receiving Email Header Metadata from Commercial Banking Platform',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital operates an AI model that analyzes wire instruction modification requests
      for BEC risk indicators but receives only the instruction content — the beneficiary name,
      account number, and amount — without the email header metadata that contains the most
      discriminating BEC signals: domain look-alike spoofing, reply-to address mismatches,
      sending infrastructure differences from the legitimate domain's SPF/DKIM records, and
      message routing anomalies that distinguish BEC emails from legitimate instruction changes.
      The commercial banking platform's email integration was designed before the AI fraud model
      was deployed and does not pass header metadata to the fraud platform; the bank's SR 11-7
      validation acknowledged this feature gap but classified it as a medium-priority remediation
      item that has not been addressed in the two subsequent model review cycles.`,
    keywords: ['BEC email AI', 'SR 11-7', 'email header analysis', 'wire fraud', 'domain spoofing'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2647',
    name: 'BEC Loss Categorization Inconsistency Between Fraud Operations and Risk Reporting',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's fraud operations team and the operational risk reporting function classify
      BEC losses using different taxonomies — fraud operations records them as wire fraud losses
      by attack vector, while operational risk captures them as technology risk events related
      to email compromise, resulting in double-counting or under-reporting in the bank's
      operational risk loss database that supports the DFAST and CCAR stress testing frameworks.
      The inconsistent classification prevents accurate measurement of BEC as a specific
      fraud risk driver in the bank's regulatory capital models. OCC guidance on operational
      risk data integrity and Basel III operational risk framework requirements both require
      that loss event classifications be consistent across risk management functions and
      aligned with the regulatory loss event type taxonomy.`,
    keywords: ['BEC loss classification', 'DFAST', 'CCAR', 'OCC operational risk', 'Basel III operational risk'],
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2648',
    name: 'Domestic Correspondent BEC Funds Routing Not in Cross-Bank Fraud Intelligence Sharing',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital has identified that BEC fraud proceeds are frequently routed through
      domestic correspondent bank accounts maintained at larger money center banks before
      international transfer, but the bank does not participate in the Financial Services
      ISAC or FS-ISAC real-time fraud intelligence sharing protocols that would allow it
      to alert the correspondent bank to a suspected BEC funds routing event before
      the funds move internationally. FinCEN's 2023 BEC advisory recommends participation
      in real-time fraud intelligence sharing networks as a critical component of BEC
      loss recovery strategy; First Capital's fraud operations team has not established
      the bilateral communication protocols with correspondent banks that would enable
      coordinated fraud holds on BEC-attributed fund flows.`,
    keywords: ['BEC correspondent banking', 'FS-ISAC', 'FinCEN BEC advisory', 'fraud intelligence sharing', 'funds recovery'],
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2649',
    name: 'Vendor Onboarding Identity Verification Not Including BEC Risk Assessment',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's vendor onboarding process for treasury management clients — where the
      bank verifies the identity of vendors added to the commercial client's ACH and wire
      payment master files — does not include a BEC risk assessment step that evaluates whether
      the vendor addition request was initiated through a communication channel susceptible to
      BEC compromise, such as an unencrypted email from a free webmail address or a domain that
      is newly registered or has no prior payment relationship with the commercial client.
      NACHA's 2024 vendor payment fraud guidance requires that banks offering commercial
      treasury management services implement vendor authentication procedures that are not
      reliant on email verification alone; First Capital's vendor onboarding process has not
      been updated to comply with these requirements.`,
    keywords: ['vendor authentication', 'BEC', 'NACHA 2024', 'treasury management', 'commercial ACH'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2650',
    name: 'Cross-Border BEC Recovery Coordination Protocol Not Established With Correspondent Banks',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `When BEC funds exit First Capital via wire transfer to foreign correspondent banks,
      the bank's fraud recovery process relies on informal relationship contacts at correspondent
      banks rather than established formal recall protocols aligned with SWIFT's Customer Security
      Programme requirements for member institutions to respond to fraud recall requests within
      defined timeframes. The absence of formalized correspondent bank recall agreements means
      that the effective recovery rate for cross-border BEC wires at First Capital is below the
      industry median reported in the Association of Certified Financial Crime Specialists'
      2023 BEC recovery benchmark study. OCC guidance on operational resilience and international
      wire fraud management requires banks to maintain documented correspondent bank fraud
      contact protocols with tested recall procedures.`,
    keywords: ['cross-border BEC recovery', 'SWIFT CPS', 'correspondent banking', 'OCC guidance', 'wire fraud recall'],
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2651',
    name: 'BEC Preparedness Not Included in Commercial Client Onboarding Risk Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital's commercial banking client onboarding documentation does not include
      a structured disclosure of BEC fraud risk and the client's responsibility for implementing
      email security controls — specifically DMARC, DKIM, and SPF policy configuration — as
      a precondition for maintaining elevated wire transfer limits. The OCC's guidance on
      commercial account fraud risk management requires that banks disclose the residual fraud
      risk that remains with the commercial client after the bank's controls are applied,
      and that client onboarding include documented fraud risk awareness covering the primary
      attack vectors for accounts of that type and size. First Capital's commercial client
      agreements address wire fraud liability allocation in the terms and conditions but do
      not include a plain-language disclosure of BEC risk or client-side prevention requirements.`,
    keywords: ['BEC disclosure', 'commercial client onboarding', 'OCC guidance', 'DMARC', 'wire fraud liability'],
    subTopic: 'business-email-compromise',
  },

  // ── AI Fraud Part 3 ────────────────────────────────────────────────────────
  {
    code: 'B2652',
    name: 'GenAI Synthetic Voice Fraud Bypassing IVR Authentication — No Deepfake Voice Detection',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's IVR-based telephone banking authentication uses voice biometric
      matching to verify customers calling in for account access and wire authorization, but
      the voice biometric vendor has not deployed countermeasures against synthetic voice
      attacks using commercially available GenAI voice cloning tools that can replicate a
      target customer's voice characteristics from a 30-second audio sample. A documented
      proof-of-concept attack by a financial industry security firm in 2023 achieved a 78%
      bypass rate against voice biometric authentication systems not hardened against GenAI
      voice synthesis. First Capital's vendor management program under OCC Bulletin 2023-17
      does not require the voice biometric vendor to certify detection performance against
      GenAI synthetic voice attacks or to maintain a testing program against current voice
      cloning capabilities.`,
    keywords: ['GenAI voice cloning', 'voice biometric bypass', 'OCC Bulletin 2023-17', 'IVR authentication', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2653',
    name: 'AI Transaction Monitoring Hallucination Risk in LLM-Augmented Alert Triage Not Governed Under SR 11-7',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's BSA/AML alert triage workflow has been augmented with an LLM that
      generates case summary narratives and preliminary SAR/no-SAR recommendations from raw
      transaction data, but the LLM has been deployed without SR 11-7 model governance
      — specifically, without a conceptual soundness review confirming that the LLM's
      reasoning about transaction patterns is grounded in BSA regulatory definitions rather
      than general financial language patterns from the LLM's training corpus. When the LLM
      recommends closing an alert with a no-SAR disposition based on a plausible but
      factually incorrect characterization of a transaction as normal business activity,
      the bank's examiner-facing evidence record contains an AI-generated narrative
      that a BSA officer accepted without independent analysis. FinCEN's SAR guidance
      and OCC examination standards require that SAR disposition decisions be based on
      independently verified facts, not LLM-generated summaries of ambiguous data.`,
    keywords: ['LLM alert triage', 'SR 11-7', 'FinCEN SAR', 'BSA/AML', 'AI governance'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2654',
    name: 'AI-Powered Account Opening Liveness Check Defeated by Injection Attack on Mobile SDK',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's mobile app uses an AI liveness detection SDK from a third-party vendor
      for digital account opening identity verification, but the SDK processes camera input at
      the operating system camera API level without tamper detection for virtual camera drivers —
      a known attack vector where a fraudster installs a virtual camera driver that feeds a
      deepfake or replay video to the liveness check while the SDK believes it is receiving
      a live camera stream. The vendor's SDK has not been updated to detect virtual camera
      injection since this attack category was documented in NIST SP 800-63B digital identity
      guidelines revision discussions in 2023; First Capital's mobile application security
      review did not include a test of the liveness SDK against virtual camera injection
      because the TPRM assessment treated the SDK as a COTS security tool rather than
      a fraud control requiring SR 11-7 validation.`,
    keywords: ['liveness injection attack', 'NIST SP 800-63B', 'TPRM', 'OCC Bulletin 2023-17', 'digital onboarding AI'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2655',
    name: 'AI Fraud Model Carbon Copy Across Product Lines Without Segment-Specific Validation',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's MRM team approved a fraud risk scoring model for the personal checking
      account population and subsequently deployed the identical model — without modification
      or incremental validation — to the small business checking, premium private banking,
      and student banking account populations, treating each deployment as a configuration
      change rather than a new model use case requiring SR 11-7 independent validation.
      The model's feature engineering and threshold calibration reflect the personal checking
      account population's transaction patterns, which differ materially from small business
      payroll and commercial payment behaviors, high-net-worth client transaction velocity,
      and student account spending patterns. OCC consent order remediation milestones for
      First Capital's MRM program specifically require that model inventory records capture
      each use-context deployment as a distinct model instance subject to use-case-specific
      validation.`,
    keywords: ['SR 11-7 validation', 'model deployment', 'OCC consent order', 'MRM', 'fraud AI segmentation'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2656',
    name: 'Real-Time Payment Fraud AI Latency Breach Creating Approve-All Bypass in FedNow Rail',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI fraud scoring model for FedNow real-time payments must return a
      risk score within 250 milliseconds to meet the FedNow authorization SLA, but the
      vendor-hosted model experiences latency exceedances above 400 milliseconds during
      peak processing periods, triggering the bank's payment orchestration layer to execute
      an automatic approve-all bypass that clears all pending FedNow transactions without
      fraud screening for the duration of the latency event. The approve-all bypass has been
      activated on average 4.2 times per month over the past 12 months, each event lasting
      8–22 minutes and representing a complete suspension of the bank's primary real-time
      payment fraud control. OCC Bulletin 2023-17 and the bank's FedNow participation
      agreement both require that fraud controls maintain SLA-compliant performance; the
      systematic bypass is a control failure that has not been reported to the OCC as
      a material operational risk event.`,
    keywords: ['FedNow fraud AI latency', 'OCC Bulletin 2023-17', 'approve-all bypass', 'real-time payment fraud', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2657',
    name: 'AI Dispute Resolution Chatbot Providing Incorrect Reg E Timeline Guidance to Customers',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deployed an AI chatbot to handle first-level fraud dispute intake and
      inform customers of their Reg E rights and timeline for dispute resolution, but the
      chatbot's response model has not been validated against current Reg E 12 CFR Part 205
      provisions — specifically, the conditional 10-business-day provisional credit requirement
      and the 45-calendar-day investigation deadline for non-POS transactions. Customers
      who receive incorrect Reg E timeline information from the chatbot and subsequently
      follow up outside the chatbot's stated deadline may have their disputes denied on
      procedural grounds that were artificially created by the chatbot's inaccurate guidance.
      The CFPB's 2022 circular on chatbot use in financial services requires that AI-powered
      customer communication tools be validated for regulatory accuracy and that consumer
      harm from AI misinformation constitute a UDAAP violation.`,
    keywords: ['Reg E chatbot', 'CFPB UDAAP', 'AI dispute resolution', 'SR 11-7', 'regulatory accuracy'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2658',
    name: 'AI Mule Account Detection Model Underperforms on Micro-Structuring Patterns in Peer-to-Peer Rails',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI mule account detection model was trained on historical mule account
      activity that predominantly involved large ACH batch transfers characteristic of organized
      money mule networks, but the model's recall rate for micro-structuring mule patterns on
      peer-to-peer payment rails — Zelle, Venmo, and Cash App — is significantly lower because
      these transactions are individually below the structuring threshold and involve consumer
      P2P patterns that the model's training data does not adequately represent. Modern mule
      recruitment on social media produces accounts that aggregate hundreds of small P2P
      transactions before consolidating to a single outbound wire, defeating the model's
      amount-based detection features. The bank's SR 11-7 model monitoring does not include
      rail-specific performance metrics that would surface the model's underperformance on
      P2P micro-structuring patterns.`,
    keywords: ['mule account AI', 'Zelle P2P fraud', 'SR 11-7 monitoring', 'BSA structuring', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2659',
    name: 'AI Fraud Co-Pilot Case Recommendations Not Subject to Independent Human Verification Before SAR Decision',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's fraud operations team uses an AI co-pilot that generates case investigation
      plans, evidence summaries, and SAR-or-no-SAR recommendations for each alert dispositioned
      by the fraud analyst team, but the workflow allows analysts to accept the AI's SAR
      recommendation with a single click without independently reviewing the underlying
      transaction evidence. FinCEN guidance on BSA compliance program adequacy requires that
      SAR filing decisions reflect the independent judgment of a trained BSA officer based
      on documented review of the relevant transaction activity; an approval workflow that
      allows single-click acceptance of AI recommendations without documented independent
      analysis does not satisfy this standard. OCC examination procedures for the bank's
      consent order remediation specifically require that the BSA program demonstrate that
      SARs are filed based on human analysis, not automated recommendations.`,
    keywords: ['AI fraud co-pilot', 'SAR independence', 'FinCEN', 'OCC consent order', 'BSA/AML SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2660',
    name: 'Federated Learning Fraud Model Training on Customer Data Without Privacy Impact Assessment',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital participates in a consortium federated learning program that trains a
      shared fraud detection model across multiple participating banks using locally computed
      model gradients rather than raw transaction data, but the bank's legal and privacy teams
      have not conducted a privacy impact assessment determining whether sharing model gradients
      that are computed from individually identifiable transaction data constitutes a use or
      disclosure of customer financial information subject to Gramm-Leach-Bliley Act privacy
      notice requirements or CCPA obligations for California-resident customers. The bank's
      participation agreement with the consortium vendor characterizes gradient sharing as
      privacy-preserving, but the bank has not independently validated this characterization
      against the GLBA's definition of covered data and the OCC's guidance on customer data
      privacy in third-party arrangements.`,
    keywords: ['federated learning', 'GLBA privacy', 'CCPA', 'OCC Bulletin 2023-17', 'fraud model consortium'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2661',
    name: 'AI-Detected Account Anomaly Triggering Automated Freeze Without Board-Approved Risk Appetite Threshold',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI fraud risk model automatically freezes accounts when the fraud score
      exceeds a threshold that was set by the fraud technology team during system implementation
      and has never been reviewed or approved by the board risk committee as a risk appetite
      decision. The freeze threshold determines the tradeoff between fraud loss prevention and
      customer disruption from false-positive freezes; setting this threshold at the operational
      level without board-approved risk appetite documentation means the bank cannot demonstrate
      to OCC examiners that the automated account freeze decision is governed by a formal risk
      tolerance framework. OCC guidance on model governance and the bank's consent order
      remediation requirements both specify that automated decision thresholds with material
      customer impact must be calibrated against board-approved risk appetite limits.`,
    keywords: ['automated account freeze', 'SR 11-7', 'OCC consent order', 'board risk appetite', 'fraud AI threshold'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2662',
    name: 'AI Document Forgery Detection Vendor Not Tested Against Current GenAI Forgery Toolkits',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's digital account opening and lending workflows use an AI document
      authenticity verification service to detect forged identity documents, income statements,
      and bank statements, but the vendor has not provided the bank with certified performance
      data against documents fabricated using GenAI image generation tools available since
      2023 — specifically, tools that can generate photorealistic identity documents with
      correct MICR encoding, hologram simulation, and UV feature patterns that the older
      AI detection models were not trained to identify as fabricated. The bank's vendor
      assessment under OCC Bulletin 2023-17 documented this gap as a watch item in 2023
      but has not required the vendor to provide updated detection benchmark results
      or to disclose when the underlying model was last retrained against current-generation
      GenAI forgery outputs.`,
    keywords: ['GenAI document forgery', 'OCC Bulletin 2023-17', 'TPRM', 'identity document AI', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2663',
    name: 'AI Fraud Model Explainability Gap Prevents Effective Consent Order Evidence Production',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's primary ML fraud scoring model uses a gradient boosted ensemble
      architecture that the MRM team characterized as sufficiently explainable using SHAP
      values in the SR 11-7 validation report, but when OCC examiners requested transaction-
      level explanations for a sample of 50 fraud-blocked accounts as part of consent order
      follow-up, the bank could not produce per-decision SHAP outputs because the production
      inference system does not log the feature importance values used in each real-time
      decision — only the final score is persisted. The inability to retrospectively explain
      individual fraud blocking decisions means the bank cannot demonstrate to examiners that
      the consent order's model transparency requirement has been operationalized in production,
      not just in the development environment where SHAP was available but not deployed.`,
    keywords: ['ML explainability', 'SR 11-7', 'OCC consent order', 'SHAP', 'fraud model governance'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2664',
    name: 'Social Engineering AI Defense Tool Deployed Without Reg E Integration for Customer Alerts',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital deployed an AI-powered social engineering detection tool that monitors
      digital banking session behavior for patterns consistent with a customer operating
      under coercion or external direction — unusual hesitation patterns, copy-paste input
      for account numbers, and sequential review of account balances followed immediately
      by a large transfer initiation. The tool generates a high-confidence social engineering
      alert for approximately 200 transactions per month but routes the alert only to a
      fraud analyst review queue rather than triggering a real-time customer-facing warning
      within the digital banking session that would allow the customer to self-identify the
      scam before completing the transaction. Reg E and the CFPB's authorized push payment
      guidance both support real-time customer warning interventions as a loss prevention
      mechanism; the bank's implementation decouples the AI signal from the customer
      intervention layer.`,
    keywords: ['social engineering AI', 'Reg E', 'CFPB APP guidance', 'real-time scam warning', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2665',
    name: 'AI-Driven Fraud Risk Score Used in Credit Pricing Without ECOA Fair Lending Review',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's personal loan pricing model incorporates the customer's fraud risk score
      as a pricing adjustment factor — customers with higher fraud risk scores receive higher
      interest rate quotes to compensate for the bank's elevated fraud loss expectation — but
      the bank's fair lending compliance program has not assessed whether the fraud risk score
      constitutes a prohibited basis proxy under ECOA Reg B in the credit pricing context.
      Because the fraud risk model uses geographic and behavioral features that are correlated
      with race and national origin, incorporating the score as a pricing factor may produce
      statistically discriminatory pricing outcomes for minority borrowers even if protected
      class membership is not an explicit input. The CFPB's 2023 fair lending examination
      procedures explicitly require lenders to test AI-derived inputs to pricing models for
      disparate impact on ECOA-protected classes before deployment.`,
    keywords: ['fraud score pricing', 'ECOA Reg B', 'CFPB fair lending', 'disparate impact AI', 'SR 11-7 bias'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2666',
    name: 'Anomaly Detection AI Training Data Contains PII Without Anonymization Compliant With GLBA',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's fraud anomaly detection model was trained on a dataset that includes
      raw customer transaction records with account numbers, customer names, and full SSNs
      to enable the data science team to validate model outputs against known fraud cases
      — but the training dataset was not anonymized or de-identified before storage on the
      bank's cloud-based ML development platform, creating a Gramm-Leach-Bliley Act safeguards
      violation risk for customer financial information stored outside the bank's core banking
      data governance perimeter. The OCC's safeguards guidance under GLBA requires that
      financial institutions apply access controls and encryption to customer financial
      information in all storage environments, including development and model training
      environments; the ML platform is hosted by a cloud provider whose data residency
      and access controls have not been verified against the bank's GLBA safeguards plan.`,
    keywords: ['GLBA safeguards', 'ML training PII', 'OCC data governance', 'TPRM', 'customer data privacy'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2667',
    name: 'AI Fraud Vendor Contract Silent on Model Explainability Delivery Obligation for Regulatory Requests',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's contract with its primary AI fraud scoring vendor does not include
      a provision requiring the vendor to provide per-decision model explanation outputs
      in response to a regulatory examination request within a defined turnaround time.
      When OCC examiners requested transaction-level model explanations for a consent order
      follow-up examination, the vendor cited proprietary model protection in declining to
      provide SHAP or LIME outputs for individual transactions, and the bank's contract
      gave the vendor no contractual obligation to comply. OCC Bulletin 2023-17 requires
      that vendor contracts for critical AI systems include provisions ensuring that the
      bank can fulfill its regulatory examination obligations, including the ability to
      produce model decision explanations for individual cases on request from banking
      supervisors.`,
    keywords: ['AI vendor explainability', 'OCC Bulletin 2023-17', 'TPRM', 'SR 11-7', 'OCC consent order'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },
  {
    code: 'B2668',
    name: 'Continuous ML Model Retraining Pipeline Lacking MRM Change Control Integration',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's fraud data science team operates a continuous online learning pipeline
      that updates the transaction fraud model's parameters daily using the prior day's labeled
      fraud cases — a design that provides rapid adaptation to emerging fraud patterns but
      bypasses the MRM change control process because each daily update is characterized as
      a parameter refresh rather than a model change requiring SR 11-7 review. Over a 90-day
      period, cumulative daily parameter updates can shift the model's decision boundary
      by amounts that would require independent validation if made in a single batch update,
      but the pipeline's incremental design prevents the MRM team from identifying when
      the aggregate parameter drift has crossed the materiality threshold for re-validation.
      OCC consent order remediation requirements specifically cite continuous learning pipelines
      as requiring change control integration with the MRM governance process.`,
    keywords: ['continuous ML retraining', 'SR 11-7 change control', 'OCC consent order', 'model drift', 'MRM'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part3',
    aiInsertionRisk: true,
  },

  // ── First-Party Fraud ──────────────────────────────────────────────────────
  {
    code: 'B2669',
    name: 'First-Party Auto Loan Fraud Detection Absent From Origination Scorecard Feature Set',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's auto loan origination scorecard was designed to assess credit risk and
      does not include features for detecting first-party auto fraud — where a borrower
      legitimately obtains an auto loan and then stages or disposes of the vehicle to collect
      insurance proceeds while continuing to make minimum loan payments to avoid triggering
      a default detection. First-party auto fraud losses at regional banks averaged $3,200
      per vehicle per the Coalition Against Insurance Fraud's 2023 financial industry report,
      and the pattern is detectable at origination through the combination of borrower-to-
      vehicle value ratio, prior vehicle ownership history from Carfax, and insurance policy
      characteristics. The bank's MRM team has not assessed whether the origination scorecard's
      conceptual soundness is compromised by the absence of first-party fraud features for
      the auto portfolio, which exhibits above-peer charge-off rates.`,
    keywords: ['first-party auto fraud', 'SR 11-7', 'Coalition Against Insurance Fraud', 'OCC examination', 'auto lending'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2670',
    name: 'Credit Card First-Party Misuse in Dispute Process Not Identified by Chargeback Analytics',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's Regulation E and Reg Z dispute process does not include analytics to
      identify customers who engage in systematic first-party misuse — filing disputes on
      legitimate transactions to obtain unauthorized chargebacks — because the dispute
      management system processes each dispute in isolation and does not calculate cumulative
      dispute-to-purchase ratios, recurring merchant names across disputes, or behavioral
      patterns consistent with organized first-party fraud. First-party misuse accounted
      for an estimated 28% of chargeback losses at U.S. banks in Javelin Strategy's 2023
      fraud report; the losses are absorbed as legitimate chargebacks without detection
      because the dispute management system's design prevents cross-dispute pattern analysis.
      Reg Z dispute processing requirements do not prevent banks from implementing anti-abuse
      controls that identify systematic first-party misuse patterns.`,
    keywords: ['first-party misuse', 'chargeback fraud', 'Reg Z', 'Javelin Strategy', 'dispute analytics'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2671',
    name: 'Personal Loan First-Party Default Fraud Not in BSA Program Suspicious Activity Typology',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's BSA/AML suspicious activity monitoring program does not include
      a typology for personal loan first-party default fraud — where a borrower intentionally
      defaults on a personal loan after drawing maximum proceeds, having planned from origination
      to default without repayment. This predatory borrowing scheme is detectable in the
      combination of origination data and post-funding behavior: loan funded the day the
      account is opened, maximum draw immediately after funding, subsequent account closure
      and change of contact information, and no prior relationship with the bank. FinCEN's
      suspicious activity reporting guidance identifies predatory lending and predatory
      borrowing typologies as SAR-eligible activity; First Capital has not added predatory
      borrowing as a detection typology to its BSA monitoring program.`,
    keywords: ['predatory borrowing', 'first-party default fraud', 'BSA/AML', 'FinCEN SAR', 'personal loan fraud'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2672',
    name: 'Buy-Now-Pay-Later First-Party Fraud Risk Not Assessed in Bank Partnership Program',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital participates in a BNPL partnership program with a fintech originator and
      assumes credit loss risk on a portion of the BNPL receivables portfolio, but the bank's
      credit risk assessment of the program does not include a specific evaluation of first-party
      fraud risk — where customers use BNPL installment plans to obtain merchandise, return the
      merchandise without receiving a corresponding installment balance reduction, and then
      dispute the remaining balance as a billing error. BNPL first-party fraud and return-abuse
      rates are significantly higher than in traditional credit card portfolios because the
      frictionless BNPL origination model attracts customers with exploitative intent; the OCC's
      2023 guidance on fintech partnership risk management requires that banks assess and
      quantify first-party fraud risk in fintech credit programs as a component of third-party
      credit risk.`,
    keywords: ['BNPL fraud', 'first-party fraud', 'OCC fintech partnership', 'TPRM', 'return abuse'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2673',
    name: 'First-Party Fraud Loss Not Segregated From Third-Party Fraud in Operational Risk Reporting',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's operational risk loss database does not maintain a consistent distinction
      between first-party fraud losses — where a customer intentionally defrauds the bank —
      and third-party fraud losses — where an external actor defrauds the customer or the bank —
      because the charge-off classification process in the loan servicing system defaults to
      "credit loss" for first-party default fraud cases that are never formally identified
      as fraud. The failure to segregate first-party and third-party fraud distorts the bank's
      DFAST operational risk stress scenario, which requires separate loss factor estimation
      for fraud categories with different economic cycle sensitivities. OCC and Federal Reserve
      operational risk examination guidance require that loss event databases maintain fraud
      sub-category granularity sufficient to support regulatory capital modeling and
      scenario analysis.`,
    keywords: ['first-party fraud classification', 'DFAST', 'operational risk', 'OCC examination', 'Federal Reserve'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2674',
    name: 'AI First-Party Fraud Prediction Model Penalizing Legitimate Low-Income Thin-File Customers',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's AI model for predicting first-party default fraud uses a feature set that
      includes thin credit file, low income-to-loan ratio, and recent address changes — features
      that are also characteristic of legitimate low-income borrowers who do not intend to default.
      The model's elevated false-positive rate in the low-income, thin-file population causes the
      bank to decline or price out legitimate borrowers who are statistically indistinguishable
      from the fraud population at the feature level, raising ECOA and CRA concerns about
      differential credit access. The bank's fair lending compliance review has not been applied
      to this model because it is classified as a fraud prevention tool rather than a credit
      decisioning model, despite its practical effect of denying credit to a statistically
      protected-class-correlated applicant segment. CFPB supervisory guidance on AI models
      with credit-access implications requires disparate impact testing regardless of the
      model's stated classification.`,
    keywords: ['first-party fraud AI', 'ECOA', 'CRA', 'CFPB disparate impact', 'SR 11-7 fairness'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2675',
    name: 'Mortgage First-Party Fraud Collateral Abandonment Not Triggering BSA Review',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's mortgage servicing portfolio includes a subset of loans where borrowers
      purchased properties at inflated values using coordinated seller concessions and
      subsequently stopped making payments within 6 months of origination — a pattern consistent
      with predatory mortgage fraud where the borrower intended at origination to default
      and retain the seller concession cash-back payments. The bank's BSA program does not
      review early payment default mortgage cases for suspicious activity related to collateral
      abandonment and predatory borrowing, treating them exclusively as credit loss events.
      FinCEN guidance on mortgage fraud SAR filing requirements and FFIEC examination procedures
      for BSA in mortgage banking both require that early payment defaults with indicators of
      organized fraud activity be reviewed for SAR filing obligation.`,
    keywords: ['mortgage first-party fraud', 'BSA/AML', 'FinCEN SAR', 'FFIEC', 'early payment default'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2676',
    name: 'Friendly Fraud Detection Not Implemented in Debit Card Dispute Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's debit card Regulation E dispute processing workflow does not include
      analytics to detect friendly fraud — where a cardholder makes a legitimate debit
      card purchase, receives the goods or services, and then files a dispute claiming
      the transaction was unauthorized — because the dispute system's processing logic treats
      every dispute as a bona fide unauthorized transaction claim and does not cross-reference
      dispute history, merchant category, transaction amount, and account behavior to score
      the likelihood that the dispute is first-party misuse rather than genuine fraud.
      The bank's Reg E chargeback loss rate for debit card disputes is 31% above the
      regional bank peer average reported by the Aite-Novarica Group, an elevation that
      fraud operations management has attributed to processing volume rather than
      investigating whether systematic friendly fraud is inflating the dispute population.`,
    keywords: ['friendly fraud', 'Reg E debit dispute', 'first-party misuse', 'Aite-Novarica', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2677',
    name: 'First-Party Fraud Risk Score Not Included in CECL Qualitative Adjustment Framework',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's CECL qualitative adjustment framework incorporates macroeconomic factors,
      credit portfolio concentration, and model uncertainty adjustments but does not include
      a first-party fraud risk factor — a forward-looking estimate of how changing economic
      conditions, product mix shifts toward higher-risk digital origination channels, and
      increased fraud ring activity in the bank's lending markets affect expected first-party
      fraud default rates. Historical CECL loss calibration incorporates past first-party
      fraud losses embedded in charge-offs but cannot distinguish them from credit losses;
      the absence of a forward-looking first-party fraud qualitative component means the
      CECL reserve may systematically understate expected losses during periods of elevated
      fraud activity. SR 11-7 CECL model validation requirements and OCC CECL examination
      guidance both require that qualitative adjustment frameworks be comprehensive across
      all material loss drivers.`,
    keywords: ['CECL qualitative adjustment', 'first-party fraud', 'SR 11-7', 'OCC CECL', 'loss reserve'],
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2678',
    name: 'AI Appeasement Pattern Detection Not Deployed for First-Party Dispute Abuse in High-Value Segments',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's private banking and premium credit card segments have above-average
      dispute appeasement rates — cases where the bank voluntarily credits the customer
      without completing a full Reg E investigation to preserve the relationship — but the
      bank has not deployed an AI pattern detection layer to identify customers who
      systematically exploit the appeasement disposition path to obtain refunds on legitimate
      transactions. Premium segment first-party dispute abuse is a documented loss driver
      for large retail banks; the combination of high credit limits, relationship manager
      escalation paths, and appeasement-oriented customer service culture creates an
      exploitation pathway that standard friendly fraud detection tools designed for mass
      market debit card portfolios do not cover. The bank's SR 11-7 model inventory does
      not include a dedicated first-party fraud model for the premium segment.`,
    keywords: ['dispute appeasement abuse', 'first-party fraud AI', 'SR 11-7', 'premium banking', 'Reg E'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
  {
    code: 'B2679',
    name: 'First-Party Fraud Identification Process Lacks Documented Evidence Standard for Account Closure',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's fraud operations team closes customer accounts based on first-party
      fraud determinations — where the bank concludes that the customer engaged in intentional
      fraudulent activity — but the bank does not have a documented evidentiary standard
      defining what evidence is required before a first-party fraud determination is made
      and an account is closed. The absence of a documented evidence standard creates
      inconsistent outcomes: some fraud analysts require transaction-level proof of intentional
      fraud while others rely on statistical pattern matching, leading to CFPB UDAAP exposure
      for disparate treatment in account closure and potential ECOA adverse action notice
      violations when the account closure is driven by an AI fraud score rather than specific
      documented evidence. OCC examination standards for fair lending and consumer protection
      require that account closure policies define objective, consistently applied criteria
      that do not produce discriminatory outcomes.`,
    keywords: ['first-party fraud evidence standard', 'CFPB UDAAP', 'ECOA adverse action', 'OCC fair lending', 'account closure'],
    demoRelevant: true,
    subTopic: 'first-party-fraud',
  },
];
