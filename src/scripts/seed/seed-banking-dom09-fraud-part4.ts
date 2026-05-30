// seed-banking-dom09-fraud-part4.ts
// Banking genome patterns — Fraud Risk Management
// Code range: B2680–B2739  (60 patterns)
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

export const BANKING_DOM09_FRAUD_PART4_PATTERNS: PatternSeed[] = [

  // ── Account Takeover ──────────────────────────────────────────────────────
  {
    code: 'B2680',
    name: 'Credential Stuffing Attack Detection Absent From Digital Banking Login Layer',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital's digital banking login layer applies per-account lockout after five failed
      attempts but does not detect credential stuffing attacks — where an adversary distributes
      a large batch of breached username-password pairs across thousands of IP addresses and
      residential proxies, each attempting only one or two logins to stay below the per-account
      lockout threshold. Credential stuffing successfully bypasses lockout-only defenses because
      the attack is volumetrically distributed; FFIEC guidance on authentication risk management
      and OCC examination procedures for digital banking security both require IP reputation,
      device fingerprint, and behavioral velocity analysis as layered controls above per-account
      lockout. First Capital's login security architecture predates the widespread availability
      of automated credential stuffing toolkits and has not been updated to address the
      distributed attack pattern.`,
    keywords: ['credential stuffing', 'FFIEC authentication', 'OCC digital banking', 'IP reputation', 'account takeover'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2681',
    name: 'SIM Swap Account Takeover Not Detected Before One-Time Password Delivery',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's multi-factor authentication workflow delivers one-time passwords via SMS
      to the customer's registered phone number but does not query the mobile network operator's
      SIM change API — now available from major US carriers — to detect whether the customer's
      phone number was ported or the SIM was swapped within the prior 24–72 hours before
      delivering an OTP to the potentially compromised number. SIM swap fraud accounts for
      a disproportionate share of high-value digital banking takeover losses; the FTC's 2023
      enforcement action against AT&T, T-Mobile, and Verizon for inadequate SIM swap controls
      established carrier liability but did not eliminate the bank's need to implement
      independent SIM change checks before relying on SMS OTP for high-risk transactions.
      FFIEC guidance on layered security requires that banks using SMS OTP implement out-of-band
      verification that accounts for SIM swap risk for high-value transactions.`,
    keywords: ['SIM swap fraud', 'FFIEC layered security', 'SMS OTP', 'account takeover', 'mobile banking'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2682',
    name: 'Post-Login Session Hijacking Controls Not Implemented in Mobile Banking App',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's mobile banking application authenticates the customer at login but does
      not re-validate session integrity during the active session — allowing a session token
      that is hijacked via a man-in-the-middle attack on an unsecured network or extracted from
      device memory by malware to be used by an adversary in a different geographic location
      without triggering a challenge. NIST SP 800-63B digital identity guidelines recommend
      continuous session risk evaluation including geographic anomaly detection, device
      fingerprint consistency checks, and behavioral velocity monitoring throughout the session,
      not only at login. The OCC's examination guidance on mobile banking security requires that
      banks assess post-authentication session integrity controls as part of the overall account
      takeover risk management framework.`,
    keywords: ['session hijacking', 'NIST SP 800-63B', 'OCC mobile banking', 'FFIEC', 'mobile app security'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2683',
    name: 'Password Reset Channel Not Subject to Account Takeover Risk Scoring',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital's self-service password reset flow verifies customer identity using knowledge-
      based authentication questions and a one-time code sent to the registered email address,
      but the password reset channel is not integrated with the bank's fraud risk scoring engine —
      meaning a fraudster who has obtained a customer's KBA answers from social media and access
      to a compromised email account can reset the banking password without generating any fraud
      alert. Password reset is the primary account takeover initiation vector in the bank's
      documented takeover case inventory; the FFIEC's 2011 supplement on authentication
      specifically identifies out-of-wallet KBA as inadequate for high-risk transactions, yet
      the bank's reset flow was built before current guidance and has not been upgraded to
      require device continuity or behavioral confirmation at the reset step.`,
    keywords: ['KBA authentication', 'password reset fraud', 'FFIEC 2011 supplement', 'account takeover', 'OCC digital banking'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2684',
    name: 'Contact Information Change Preceding Large Wire Transfer Not Flagged as Takeover Indicator',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's fraud monitoring rules treat contact information changes — phone number
      update, email change, or address modification — and wire transfer initiation as separate,
      unrelated events, and do not apply enhanced scrutiny when a large wire transfer is initiated
      within 24–72 hours of a contact information change on the same account. The sequential
      pattern of contact change followed promptly by fund movement is the most common account
      takeover operational sequence, used to reroute OTP codes before initiating the transfer;
      OCC examination guidance on account takeover fraud controls explicitly requires that banks
      implement cross-event correlation rules that link contact changes to subsequent high-risk
      transaction activity as a mandatory detection layer.`,
    keywords: ['contact change fraud', 'OCC account takeover', 'wire fraud detection', 'FFIEC', 'cross-event correlation'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2685',
    name: 'Account Takeover Victim Notification SLA Exceeds Reg E Provisional Credit Requirement',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `When First Capital detects and confirms an account takeover, the bank's customer notification
      process routes through the fraud operations team's case management queue, which averages
      36–48 hours before outbound customer contact is made — a timeline that frequently allows
      the customer's Reg E provisional credit window to begin expiring before the customer is
      aware that a takeover occurred. Reg E 12 CFR Part 205 requires provisional credit within
      five business days for reported unauthorized transactions; when notification delays cause
      customers to report the fraud late because they were unaware of it, the bank's Reg E
      compliance exposure for denying provisional credit on timeliness grounds increases.
      CFPB supervisory guidance on account takeover consumer protection requires banks to
      initiate customer notification within four hours of a confirmed takeover determination.`,
    keywords: ['Reg E notification', 'account takeover', 'CFPB', 'provisional credit', 'OCC consumer protection'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2686',
    name: 'Infostealer Malware Compromised Session Tokens Not Invalidated Across Banking Channels',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's online and mobile banking platforms maintain separate session token stores
      and do not support cross-channel forced logout — a control gap exploited by infostealer
      malware such as Redline Stealer and Raccoon, which harvest active session cookies from
      infected devices and sell them on criminal marketplaces. When the bank detects suspicious
      activity on a compromised session, it can invalidate the web session but not simultaneously
      terminate active mobile app sessions that the same attacker may have initiated using the
      same stolen cookie set. OCC guidance on digital banking operational resilience and FFIEC
      authentication risk management both require that banks implement centralized session
      management with the ability to simultaneously invalidate all active sessions for a
      compromised account across all channels.`,
    keywords: ['infostealer malware', 'session token fraud', 'FFIEC', 'OCC digital banking', 'cross-channel security'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2687',
    name: 'Account Takeover Losses in Business Banking Not Eligible for Reg E Consumer Protections — Gap in Client Communication',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's commercial and small business banking clients who experience account
      takeover losses do not receive clear disclosure at account opening that Reg E unauthorized
      transaction protections apply only to consumer accounts — leaving small business owners
      who experience online banking takeover losses subject to UCC Article 4A's commercially
      reasonable security standard rather than Reg E's provisional credit obligation. When a
      small business customer suffers an account takeover wire loss, the bank applies UCC 4A
      defenses and frequently denies reimbursement, but the customer was not informed at account
      opening that the Reg E protections they experience on their consumer accounts do not apply
      to their business account. OCC guidance on commercial account fraud disclosures and the
      CFPB's SMB consumer protection framework both identify this disclosure gap as a source
      of supervisory concern.`,
    keywords: ['UCC Article 4A', 'Reg E commercial gap', 'OCC disclosure', 'account takeover', 'small business fraud'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2688',
    name: 'Authorized Push Payment Takeover Reimbursement Policy Not Aligned With Emerging CFPB Expectations',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital does not have a documented authorized push payment reimbursement policy for
      account takeover cases where the fraudster — acting as the account owner after a successful
      takeover — initiates a Zelle or ACH push payment that the bank processes as authorized
      because it was authenticated through the bank's normal MFA workflow. Because the bank treats
      these as authorized transactions under the existing account holder's authentication, no Reg E
      error resolution rights attach and the bank does not reimburse; however, the CFPB's 2023
      RFI on Reg E modernization and its 2022 enforcement guidance on authorized payment scams
      signal that regulators are moving toward requiring bank reimbursement for account-takeover-
      initiated authorized push payments. The bank has no policy framework or reserve methodology
      for the prospective liability exposure from a regulatory change in this area.`,
    keywords: ['authorized push payment', 'CFPB Reg E modernization', 'account takeover', 'Zelle fraud', 'OCC consumer protection'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2689',
    name: 'Account Takeover Recurrence Rate Not Tracked — Repeat Victims Not Receiving Enhanced Controls',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital does not maintain a systematic record of account takeover recurrence — customers
      who have experienced more than one takeover event — and does not apply permanently enhanced
      authentication controls to accounts with a prior takeover history. The absence of recurrence
      tracking means customers who have been successfully compromised once — and whose credentials,
      device setup, or behavior patterns make them structurally more susceptible — continue to use
      the same authentication framework as first-time customers. OCC examination guidance on account
      takeover risk management and FFIEC authentication risk management both recommend risk-stratified
      authentication that applies stronger controls to accounts with elevated takeover history, a
      capability First Capital's account risk profile system does not currently support.`,
    keywords: ['account takeover recurrence', 'FFIEC authentication', 'OCC examination', 'risk-stratified MFA', 'fraud operations'],
    subTopic: 'account-takeover',
  },
  {
    code: 'B2690',
    name: 'Device Intelligence Platform Not Correlating Compromised Device Across Multiple Customer Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's device intelligence platform tracks device fingerprints per customer account
      but does not maintain a cross-account device risk register that identifies when a single
      device fingerprint has been used to access multiple customer accounts — a signal that the
      device is operating as an account takeover tool being used against multiple victims.
      Professional account takeover fraud rings routinely use a controlled fleet of devices to
      access and drain multiple accounts in coordinated waves; the cross-account device correlation
      signal is the primary detection layer for organized account takeover ring activity.
      The bank's fraud analytics architecture stores device-account pairs in separate account-level
      records with no shared device risk registry, a design gap that OCC guidance on fraud
      analytics architecture specifically identifies as a control deficiency for ring detection.`,
    keywords: ['device intelligence', 'account takeover ring', 'OCC fraud analytics', 'cross-account correlation', 'FFIEC'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },
  {
    code: 'B2691',
    name: 'Account Takeover Pre-Takeover Surveillance Period Not Detected in Behavioral Baseline',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `Sophisticated account takeover attackers engage in a surveillance phase — logging into the
      compromised account multiple times over several days to observe balance levels, transaction
      patterns, and available transfer limits before initiating the fund removal — and First Capital's
      behavioral analytics engine does not generate alerts for the surveillance pattern: repeated
      logins with no transaction activity, login from new devices without fund movement, or systematic
      review of account statements and wires history. The surveillance phase is distinguishable from
      legitimate low-engagement customer behavior by the login frequency and the specific pages accessed;
      detecting the surveillance phase enables the bank to intervene before the loss event, not after.
      FFIEC guidance on continuous monitoring and OCC examination procedures for account takeover
      prevention both recommend surveillance phase detection as a leading indicator control.`,
    keywords: ['account takeover surveillance', 'behavioral analytics', 'FFIEC continuous monitoring', 'OCC', 'pre-loss detection'],
    demoRelevant: true,
    subTopic: 'account-takeover',
  },

  // ── Check Fraud ────────────────────────────────────────────────────────────
  {
    code: 'B2692',
    name: 'Check Kiting Detection Model Not Updated for Mobile Remote Deposit Capture Kiting Pattern',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's check kiting detection model was designed around in-branch and ATM deposit
      cycles and does not account for the accelerated kiting pattern enabled by mobile remote deposit
      capture — where a fraudster can deposit a check via mobile RDC at one bank and simultaneously
      initiate a mobile RDC deposit of the same check at a second bank, exploiting the mobile check
      hold policies of both institutions to create artificial balances for withdrawal before either
      check is returned. Mobile kiting cycles are compressed to 24–48 hours compared to 3–5 days
      for traditional kiting, making the bank's existing kiting detection rules — which analyze
      7-day float patterns — ineffective for the mobile cycle. OCC examination guidance and Reg CC
      amendment commentary both identify mobile RDC kiting as requiring updated detection controls
      with shorter analysis windows than traditional kiting models require.`,
    keywords: ['check kiting', 'mobile RDC fraud', 'Reg CC', 'OCC examination', 'float manipulation'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2693',
    name: 'Altered Check Detection Relying on MICR Amount Verification Not Covering Payee Line Alterations',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's check processing fraud controls verify that the MICR-encoded amount on the
      bottom of the check matches the courtesy and legal amount fields, but do not apply optical
      character recognition analysis to detect payee line alterations — where a fraudster obtains
      a legitimate check, chemically or digitally erases the payee name, substitutes their own name,
      and presents the check for payment. Payee alteration check fraud losses are the fastest-growing
      check fraud category according to FinCEN's 2023 check fraud advisory, which reported a 84%
      increase in suspicious activity reports related to altered and counterfeit checks from 2021 to
      2022. The bank's image processing vendor has payee OCR verification as an available module but
      the bank has not activated it, treating the upgrade as a discretionary enhancement rather than
      a required control response to the documented fraud trend.`,
    keywords: ['payee alteration fraud', 'FinCEN check fraud advisory', 'MICR verification', 'OCR check processing', 'Reg CC'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2694',
    name: 'Counterfeit Business Check Ring Not Triggering SAR in Commercial Deposit Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's BSA/AML transaction monitoring does not include a detection typology for
      organized counterfeit business check rings — where criminal networks fabricate high-quality
      reproductions of legitimate business checks using routing numbers and account numbers from
      publicly available business documents, present them through branch tellers and ATMs at multiple
      banks simultaneously, and withdraw cash before the returns process identifies the checks as
      counterfeit. The FinCEN 2023 check fraud advisory documented that organized counterfeit check
      rings increasingly target mid-size regional banks with less sophisticated image forensics than
      money center banks; First Capital's BSA program has not added counterfeit check ring activity
      as a SAR-eligible typology with specific detection indicators in its monitoring rules.`,
    keywords: ['counterfeit check fraud', 'BSA/AML typology', 'FinCEN 2023 advisory', 'SAR filing', 'commercial deposits'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2695',
    name: 'Positive Pay Exception Window Exposing Commercial Clients to Counterfeit Check Loss',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's positive pay service for commercial customers requires clients to respond
      to exception items — checks presented for payment that do not match the issued check file —
      within a decision window that closes at 10:00 AM Eastern, but the bank's image delivery
      to client portals is completed by 7:30 AM on a best-efforts basis and does not guarantee
      delivery before the decision window, meaning commercial clients sometimes lose their ability
      to decision exception items because image delivery was delayed beyond the effective decision
      time. Counterfeit and altered checks that are not decisioned before the window closes are
      paid by default under the bank's positive pay agreement terms. OCC guidance on commercial
      banking service quality and NACHA's treasury management standards both require that banks
      delivering positive pay exception notifications provide sufficient time for clients to
      make informed pay-or-return decisions.`,
    keywords: ['positive pay', 'check fraud commercial', 'OCC commercial banking', 'NACHA treasury', 'exception management'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2696',
    name: 'Mail Theft Check Wash Fraud Not Addressed in Reg CC Hold Policy for New Payees',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's Reg CC hold policy does not apply extended holds to checks deposited by
      customers where the check is payable to a different payee than the depositing customer — a
      pattern that is one of the primary indicators of mail theft and check washing fraud, where
      a criminal intercepts a mailed check, chemically washes the payee line, and deposits the
      altered check through a mule account. FinCEN's 2023 check fraud advisory identified mail theft
      check washing as accounting for the majority of the increase in check fraud SARs; the USPS's
      2022–2023 mail theft crisis in urban markets directly contributed to a surge in check washing
      at regional banks serving affected ZIP codes. First Capital's hold policy was designed for
      standard return risk management and has not been updated to incorporate the mail theft
      check washing pattern as a triggering condition for extended holds under Reg CC.`,
    keywords: ['check washing fraud', 'Reg CC holds', 'FinCEN 2023 advisory', 'mail theft check', 'mule account'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2697',
    name: 'Remote Deposit Capture Duplicate Presentment Controls Not Covering Cross-Institution Deposits',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's RDC duplicate item detection identifies checks deposited twice within the
      same institution — comparing MICR data against the bank's own capture history — but does not
      access the cross-institutional duplicate detection service operated by the Early Warning Services
      network that identifies when a check already deposited at another financial institution is
      presented for deposit at First Capital. Cross-institution duplicate presentment is a documented
      check fraud vector exploited by both opportunistic consumers and organized fraud rings; Reg CC's
      expedited funds availability requirements do not exempt banks from implementing reasonable
      duplicate detection controls. OCC guidance on check processing risk management requires that
      banks offering RDC assess cross-institutional duplicate detection capabilities as part of the
      RDC risk management framework.`,
    keywords: ['RDC duplicate detection', 'Early Warning Services', 'Reg CC', 'OCC check processing', 'cross-bank fraud'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2698',
    name: 'Check Fraud Loss Attribution to Operational Error Preventing SAR Filing Obligation Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's check fraud loss disposition process classifies a subset of altered and
      counterfeit check losses as operational errors — specifically, cases where a branch teller
      or item processing staff failed to apply a mandatory verification step — rather than as fraud
      losses requiring SAR review, because classifying losses as operational errors avoids the
      additional documentation burden of a BSA fraud review. The misclassification prevents the
      bank from assessing SAR filing obligations on cases involving organized check fraud rings
      where multiple items share fabrication characteristics. FinCEN guidance on BSA obligations
      for check fraud and FFIEC examination procedures require that check fraud losses be reviewed
      for SAR filing regardless of whether the immediate cause was an operational failure, when
      the underlying check was counterfeit or altered.`,
    keywords: ['check fraud SAR', 'FinCEN', 'FFIEC', 'operational error misclassification', 'BSA/AML'],
    subTopic: 'check-fraud',
  },
  {
    code: 'B2699',
    name: 'Teller Training on Check Fraud Detection Not Refreshed for Current High-Quality Counterfeit Printing',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's branch teller training on check fraud detection was last updated in 2020
      and does not cover the current generation of high-quality counterfeit business checks produced
      using wide-format inkjet printers that replicate the magnetic ink character recognition encoding,
      security paper watermarks, and void pantograph features used by legitimate check vendors.
      FinCEN's 2023 check fraud advisory noted that counterfeit checks presented at teller windows
      now routinely pass visual inspection because they replicate premium security paper features;
      the gap between teller training content and current counterfeit quality standards means First
      Capital's branch network is providing less effective first-line fraud detection than peer
      banks that have updated teller training programs. OCC examination guidance on operational
      controls for check fraud requires that teller fraud training be refreshed when documented
      changes in fraud typology render prior training materially incomplete.`,
    keywords: ['counterfeit check teller training', 'FinCEN 2023 advisory', 'OCC examination', 'check security features', 'branch fraud controls'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },
  {
    code: 'B2700',
    name: 'Check Fraud Losses Not Included in DFAST Operational Risk Scenario Calibration',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's DFAST operational risk stress scenario does not include a specific check
      fraud stress component calibrated to the bank's documented check fraud loss history and the
      current elevated check fraud environment described in FinCEN's 2023 advisory. The operational
      risk scenario uses aggregate fraud loss factors without disaggregating check fraud as a
      separately modeled loss driver with its own scenario severity curve; during periods of elevated
      check fraud activity — such as the 2022–2024 mail theft surge — this aggregation understates
      the bank's stress-period check fraud loss exposure. SR 11-7 model validation requirements
      for DFAST operational risk models and OCC examination guidance on stress scenario design both
      require that material individual fraud categories be modeled with scenario-specific assumptions
      rather than absorbed into aggregate fraud factors.`,
    keywords: ['DFAST operational risk', 'check fraud scenario', 'SR 11-7', 'OCC stress testing', 'FinCEN 2023 advisory'],
    subTopic: 'check-fraud',
  },
  {
    code: 'B2701',
    name: 'High-Value Check Hold Exception Authorization Creating Manual Override Fraud Vector',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's Reg CC hold policy permits branch managers to waive extended holds on
      large check deposits when the customer requests expedited availability, creating a fraud
      vector where social engineers use high-quality counterfeit checks combined with in-branch
      pressure tactics to obtain hold waivers from managers who lack authority to evaluate check
      authenticity. The hold waiver process does not require the branch manager to contact the
      drawing bank for verbal verification before approving availability of checks above $10,000,
      and does not log the waiver in the fraud analytics system for pattern analysis. OCC guidance
      on Reg CC compliance and check fraud risk management requires that hold waiver authorization
      processes include documented verification procedures proportionate to the check amount and
      customer relationship history.`,
    keywords: ['Reg CC hold waiver', 'check fraud social engineering', 'OCC compliance', 'branch override', 'counterfeit check'],
    demoRelevant: true,
    subTopic: 'check-fraud',
  },

  // ── New Account Fraud ──────────────────────────────────────────────────────
  {
    code: 'B2702',
    name: 'New Account Fraud Ring Detection Requires Cross-Application Device Clustering Not in CIP Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's customer identification program evaluates each new account application
      independently and does not perform cross-application device clustering to identify when
      multiple new account applications arriving within a short window share device fingerprint
      components, typing cadence signatures, or session behavioral patterns consistent with
      automated or coordinated new account fraud ring activity. Organized new account fraud
      rings use scaled-up application submissions to maximize the number of funded mule accounts
      before the bank's fraud team identifies the pattern; cross-application device analysis
      is the primary control layer for detecting ring submissions that defeat per-application
      identity verification. The OCC's guidance on customer due diligence and the FFIEC's BSA/AML
      examination procedures both require that CIP programs include controls for detecting
      coordinated fraudulent account opening activity.`,
    keywords: ['new account fraud ring', 'CIP', 'FFIEC BSA/AML', 'OCC CDD', 'device clustering'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2703',
    name: 'ChexSystems Inquiry Not Triggered for Checking Account Applications Below Minimum Balance Threshold',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's consumer checking account opening workflow queries ChexSystems for applicants
      who request accounts with standard fee structures but does not query ChexSystems for applicants
      who select the bank's fee-waived second-chance account product — a policy inconsistency that
      is exploited by applicants with ChexSystems records from prior deposit account fraud who
      self-select the second-chance product specifically to bypass the ChexSystems screen. The absence
      of a ChexSystems inquiry for any account type allowing deposit taking creates a CIP gap that
      OCC examination guidance on new account fraud specifically identifies as a structural control
      deficiency, regardless of the intended market segment for the account product. The bank's CIP
      policy does not document the rationale for the ChexSystems exception for second-chance accounts.`,
    keywords: ['ChexSystems', 'CIP', 'new account fraud', 'OCC examination', 'second-chance account'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2704',
    name: 'New Account Funding Source Velocity Not Monitored for Mule Account Seeding Pattern',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's new deposit account monitoring does not flag accounts funded by large ACH
      transfers arriving within 24–48 hours of account opening from multiple originating financial
      institutions — a pattern consistent with fraud ring mule accounts that are funded with proceeds
      from fraud schemes at other institutions before rapid outbound transfer to cryptocurrency
      exchanges or international wires. The bank's account monitoring rules apply hold and velocity
      controls to withdrawals but do not analyze the inbound funding pattern at account opening as
      a mule account indicator. FinCEN guidance on mule account detection and OCC examination
      procedures for new account fraud both identify rapid post-opening funding from multiple
      external sources as a primary mule account indicator requiring enhanced monitoring.`,
    keywords: ['mule account funding', 'FinCEN', 'OCC new account fraud', 'ACH velocity', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2705',
    name: 'Digital New Account Bonus Abuse Not Identified as First-Party Fraud in Incentive Program Analytics',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's digital checking account new customer bonus program — which pays a cash
      bonus upon completion of a minimum direct deposit requirement — does not include analytics
      to detect systematic abuse where individuals open multiple accounts using family member SSNs
      or slightly altered personal information to collect multiple bonuses, close the accounts
      after the bonus posts, and repeat the cycle. The program monitoring tracks bonus payments
      per SSN but does not identify household-level or device-level clustering of bonus-eligible
      accounts consistent with structured abuse. The bank's marketing and finance teams classify
      the losses as customer acquisition cost overruns rather than fraud, preventing the fraud
      operations team from analyzing the pattern and implementing controls.`,
    keywords: ['new account bonus abuse', 'first-party fraud', 'OCC examination', 'digital account opening', 'CFPB UDAAP'],
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2706',
    name: 'Employer Verification for Loan Origination Accepting Self-Attestation Without Third-Party Check',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's personal loan origination process accepts employer name and income as
      self-reported fields without third-party verification for loan amounts below $15,000,
      relying solely on the applicant's stated employer and a paystub document that the income
      verification AI reviews without confirming the employer's existence in the IRS Employer
      Identification Number database. New account fraud schemes routinely fabricate paystub
      documents from fictional employers; the combination of unverified employer existence
      and AI document review that cannot detect a photorealistic forgery from a real employer
      creates a systematic fraud vulnerability in the sub-$15,000 loan origination segment.
      OCC guidance on loan origination fraud controls and SR 11-7 validation requirements for
      income verification models both require that employer existence be verified through
      at least one third-party source independent of the applicant's attestation.`,
    keywords: ['employer verification fraud', 'income verification AI', 'SR 11-7', 'OCC origination', 'paystub forgery'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2707',
    name: 'New Business Account Opening CIP Not Requiring Beneficial Owner Verification for Small LLCs',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's CIP for new small business deposit accounts requires beneficial ownership
      certification for LLCs above $25M in revenues but does not require verified beneficial
      ownership documentation for newly formed small LLCs — a gap that is exploited by new
      account fraudsters who form LLCs specifically to access business banking products with
      higher transaction limits, lower individual identity scrutiny, and delayed ChexSystems
      reporting. FinCEN's 2024 beneficial ownership rule update under the Corporate Transparency
      Act requires financial institutions to update their CIP programs to collect and verify
      beneficial ownership information for all new business accounts regardless of entity size;
      First Capital's CIP policy has not been updated to comply with the new rule's requirements.`,
    keywords: ['beneficial ownership', 'FinCEN CTA', 'CIP', 'small business fraud', 'OCC BSA/AML'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2708',
    name: 'New Account 90-Day Fraud Loss Spike Not Triggering Origination Model Recalibration',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's fraud operations reporting tracks new account fraud losses but does not
      include an automated threshold that triggers a review of the origination scorecard when
      the 90-day vintage fraud rate for new accounts in a specific product or channel exceeds
      the model's predicted performance by a defined tolerance. When a new fraud vector
      exploiting an underweighted origination feature causes a spike in new account fraud
      losses, the bank's response is a manual investigation that averages 45–60 days before
      the origination model is updated — a delay during which the fraud vector continues to
      produce losses. SR 11-7 model monitoring requirements specify that outcome monitoring
      must include automated alerts when observed performance deviates materially from
      expected performance, triggering a defined review and recalibration process.`,
    keywords: ['origination model drift', 'SR 11-7 monitoring', 'new account fraud', 'OCC MRM', 'vintage fraud rate'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2709',
    name: 'Address Verification Service Response Not Used as New Account Risk Signal in Deposit Origination',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's digital deposit account opening workflow collects the applicant's address
      for CIP purposes but does not use the Address Verification Service response code from the
      credit bureau inquiry as a risk signal in the new account risk scoring process. An AVS
      mismatch — where the applicant's stated address does not match the address associated with
      the SSN at the credit bureau — is one of the highest-precision signals for identity fraud
      in new account applications, present in over 60% of synthetic identity cases according
      to the Federal Reserve's synthetic identity fraud research. The bank's new account CIP workflow
      collects the AVS response code for credit decisioning but the fraud risk score does not
      receive or incorporate the AVS outcome because the two systems were implemented by separate
      teams and lack a shared data feed.`,
    keywords: ['AVS mismatch', 'CIP identity fraud', 'Federal Reserve synthetic ID', 'new account risk', 'OCC CDD'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2710',
    name: 'Promotional Rate New Account Fraud Not Triggering Enhanced Exit Review Before Rate Conversion',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital offers introductory high-yield CD and money market rates for new deposit
      accounts to attract new customers, but the bank does not apply an enhanced fraud review
      to accounts approaching the promotional rate maturity date — specifically examining whether
      the account holder's identity documentation, contact information, and activity pattern
      are consistent with a legitimate long-term customer relationship before releasing funds
      at maturity. Fraudsters who successfully open high-balance promotional accounts using
      fabricated identities or stolen credentials are most likely to attempt fund withdrawal
      at the promotional maturity date when the full balance is accessible; the bank's fraud
      controls at account opening are not reinforced by a pre-maturity review that could catch
      account takeover or new account fraud cases that were not detected at origination.`,
    keywords: ['promotional rate fraud', 'new account fraud', 'CD maturity fraud', 'OCC CIP', 'FFIEC'],
    subTopic: 'new-account-fraud',
  },
  {
    code: 'B2711',
    name: 'New Account Fraud Early Warning Not Shared With Zelle Network for Mule Account Prevention',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `When First Capital identifies a newly opened deposit account as a mule account or confirms
      a new account fraud determination, the bank does not report the account as a risk signal to
      the Early Warning Services network — the shared risk database that powers Zelle fraud
      prevention across the Zelle network's participating financial institutions. Because mule
      accounts at First Capital are used to receive and forward Zelle payments from fraud victims
      at other banks, Early Warning Services relies on timely reporting from participating banks
      to suppress Zelle transactions to confirmed mule accounts; First Capital's SAR filing process
      and EWS reporting are handled by separate teams with no automated data sharing trigger when
      a new account fraud determination is made. The Zelle network's participation agreement
      and OCC guidance on fraud information sharing both require timely reporting of confirmed
      mule account identifications.`,
    keywords: ['Early Warning Services', 'Zelle mule account', 'new account fraud reporting', 'OCC fraud sharing', 'BSA SAR'],
    demoRelevant: true,
    subTopic: 'new-account-fraud',
  },

  // ── AI Fraud Part 4 ────────────────────────────────────────────────────────
  {
    code: 'B2712',
    name: 'AI Transaction Monitoring Model Not Validated Against Cryptocurrency-to-Fiat Layering Typology',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's AI transaction monitoring model was trained and validated against historical
      ACH, wire, and card transaction fraud patterns but has not been independently tested against
      the cryptocurrency-to-fiat layering typology — where fraud proceeds move from an external
      crypto exchange to a bank account as a fiat deposit before rapid wire transfer out — because
      the bank's training dataset predates the widespread adoption of crypto-to-bank conversion
      flows. FinCEN's 2023 priorities identify virtual asset conversion as a primary fraud proceeds
      movement method; the bank's SR 11-7 validation report acknowledged the training data gap
      but the MRM team classified it as a medium-priority finding that has remained open for
      18 months without remediation.`,
    keywords: ['cryptocurrency fraud layering', 'SR 11-7 validation', 'FinCEN 2023 priorities', 'AI transaction monitoring', 'MRM'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2713',
    name: 'GenAI-Assisted Fraud Investigation Report Accepted Without Verifying Cited Transaction Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's fraud investigation team uses a GenAI assistant to draft case investigation
      reports that include citations to specific transaction records as evidence supporting the
      fraud determination, but the workflow does not require investigators to independently verify
      that each cited transaction exists and matches the GenAI's characterization before the report
      is used to justify account closure or SAR filing. LLM hallucination of plausible-sounding
      but factually incorrect transaction references in investigation reports creates a regulatory
      documentation risk: OCC examination procedures for BSA/AML compliance require that SAR
      narratives be supported by verified factual evidence, and an AI-generated citation to a
      non-existent transaction in a SAR narrative constitutes a materially false statement in
      a regulatory filing under 31 U.S.C. § 5322.`,
    keywords: ['GenAI hallucination', 'SAR narrative accuracy', 'FinCEN', 'OCC BSA/AML', 'SR 11-7 governance'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2714',
    name: 'AI Fraud Score Vendor Concentration Risk — Single Vendor Outage Disabling All Fraud Screening',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      `First Capital routes all real-time fraud scoring decisions — across card, digital banking,
      wire, and ACH channels — through a single AI fraud scoring vendor via a synchronous API call,
      creating a single point of failure where a vendor outage suspends fraud screening across
      all payment channels simultaneously. The bank's fallback is a rules-only approve-all
      configuration that provides no ML-based screening; the vendor's contractual SLA guarantees
      99.5% uptime, which translates to approximately 44 hours of potential outage per year.
      OCC Bulletin 2023-17 guidance on critical third-party concentration risk requires that banks
      assess single-vendor concentration risk for critical risk management functions and maintain
      a tested contingency that provides meaningful fraud screening capability during vendor outages.`,
    keywords: ['vendor concentration risk', 'OCC Bulletin 2023-17', 'TPRM', 'fraud AI resilience', 'operational resilience'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2715',
    name: 'AI Fraud Detection Model Exhibiting Geographic Proxy Bias Toward Minority-Majority ZIP Codes',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI fraud detection model uses ZIP code as a model feature to capture
      geographic fraud risk concentration, but the bank's fair lending compliance review has
      identified that ZIP code is a proxy for race and national origin in the bank's market
      area — meaning the model applies higher fraud risk scores to transactions by customers
      in minority-majority ZIP codes independent of individual transaction characteristics.
      The elevated fraud score for minority-majority ZIP codes causes a higher false-positive
      rate for legitimate transactions by minority customers, leading to disproportionate
      transaction declines and customer friction. CFPB's 2023 circular on AI model fairness
      in consumer financial products requires lenders and payment processors to test AI models
      for disparate impact on protected classes attributable to geographic proxy features and
      to remove or mitigate proxy bias before production deployment.`,
    keywords: ['fraud model geographic bias', 'ECOA disparate impact', 'CFPB AI fairness', 'SR 11-7 bias testing', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2716',
    name: 'AI-Powered KYC Refresh Vendor Not Delivering Adverse Media Results Compliant With FinCEN Customer Risk Rating',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital licensed an AI-powered adverse media screening tool to automate KYC refresh
      for its commercial customer base, but the vendor's AI model retrieves adverse media results
      using a name-matching algorithm that produces high false-positive rates for common-name
      entities — screening matches are presented to relationship managers who, facing a high false-
      positive burden, routinely dismiss matches without investigation. FinCEN's CDD rule requires
      that periodic customer risk rating updates be based on a review of adverse information that
      is genuinely relevant to the customer; a systematic workflow where adverse media results
      are dismissed without investigation because of high false-positive rates does not satisfy
      the CDD rule's ongoing due diligence requirement. The bank's SR 11-7 model inventory does
      not include the adverse media AI as a model requiring independent performance validation.`,
    keywords: ['adverse media AI', 'FinCEN CDD rule', 'KYC refresh', 'SR 11-7', 'OCC BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2717',
    name: 'AI Fraud Model Vendor Access to Production Transaction Data Not Governed Under GLBA',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's AI fraud scoring vendor has direct read access to the bank's production
      transaction database to refresh the model's feature store with near-real-time transaction
      data, but the data access arrangement has not been reviewed against the GLBA safeguards
      rule requirements for customer financial information shared with service providers. The
      vendor's data access agreement permits the vendor to use aggregated, non-identified
      transaction patterns for model improvement purposes, but the agreement does not restrict
      the vendor from retaining raw transaction records beyond the model inference SLA window.
      OCC Bulletin 2023-17 requires that vendor agreements for AI services explicitly address
      data retention, use limitations, and GLBA compliance obligations for any customer financial
      information accessed in connection with the service.`,
    keywords: ['GLBA safeguards', 'AI vendor data access', 'OCC Bulletin 2023-17', 'TPRM', 'customer data privacy'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2718',
    name: 'Real-Time AI Fraud Scoring Not Applied to FedNow Credit Transfer Receipt — Inbound Gap',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital applies AI fraud scoring to outbound FedNow send transactions but does not
      route inbound FedNow credit transfer receipts through the fraud scoring engine before posting
      to the recipient account — missing the opportunity to flag accounts receiving large inbound
      real-time payments from senders who have exhibited fraud characteristics at the originating
      institution. Inbound payment fraud screening at the receiving bank is increasingly important
      as fraud rings use receiving accounts at banks without inbound screening to collect proceeds
      before outbound transfer; FinCEN's 2024 advisory on instant payment fraud and the FedNow
      Fraud Operations Committee guidance both recommend that receiving banks implement inbound
      payment risk assessment, not only outbound.`,
    keywords: ['FedNow inbound fraud', 'real-time payment AI', 'FinCEN 2024 advisory', 'SR 11-7', 'mule account detection'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2719',
    name: 'AI Behavioral Analytics Fraud Model Not Enrolled for Business Banking Segment — Coverage Gap',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deployed AI behavioral analytics for consumer digital banking fraud prevention
      but has not extended the model's enrollment to the small business and commercial banking
      digital portals, which operate on separate technology platforms. Business banking account
      takeover losses at First Capital are 2.4× higher per account than consumer losses because
      business accounts hold larger balances, have more complex wire authority structures, and
      are targeted by more sophisticated fraud rings. The absence of behavioral analytics coverage
      for the business segment is a documented gap in the bank's fraud controls that the OCC has
      flagged informally in prior examination discussions; the bank's plan to extend behavioral
      analytics to business banking has been deferred for three consecutive budget cycles.`,
    keywords: ['behavioral analytics coverage gap', 'business banking fraud', 'SR 11-7', 'OCC examination', 'account takeover AI'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2720',
    name: 'AI Fraud Risk Score Change Between Application and Funding Not Triggering Re-Review',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's consumer loan origination process applies an AI fraud risk score at the
      time of initial application and uses the score for the origination decision, but does not
      re-score the application at the time of loan funding — which may occur 5–15 days later for
      loans subject to a processing queue — allowing the fraud risk profile of the application
      to change materially between scoring and funding. Identity theft, new fraud pattern emergence,
      or the appearance of the applicant in a new fraud consortium alert after the initial score
      are not captured in the funding decision. SR 11-7 model governance for use-time evaluation
      and OCC guidance on consumer loan origination controls both require that material risk signals
      arising between application and funding be assessed before loan proceeds are disbursed.`,
    keywords: ['loan origination AI re-score', 'SR 11-7', 'OCC origination controls', 'identity theft loan fraud', 'application-to-funding gap'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2721',
    name: 'AI-Generated SAR Activity Description Failing Specificity Standard in FinCEN Filing',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's AI SAR narrative generation tool produces activity descriptions that satisfy
      the character-count and format requirements of the FinCEN SAR form but frequently use general
      language — "unusual transaction activity inconsistent with account profile" — rather than
      the specific transaction details, amounts, dates, counterparties, and behavioral indicators
      that FinCEN guidance requires to make a SAR useful for law enforcement investigation.
      FinCEN's 2017 SAR activity review guidance and its periodic advisory reminders require
      that SAR narratives include the five Ws (who, what, when, where, why) with specific
      transaction details; AI-generated narratives that pass a BSA officer review without
      independent verification of specificity produce SAR filings that satisfy the letter
      of the filing obligation while providing minimal law enforcement value.`,
    keywords: ['AI SAR narrative', 'FinCEN SAR specificity', 'BSA/AML', 'OCC examination', 'SR 11-7 governance'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2722',
    name: 'Fraud AI Model Retraining on Biased Investigator Disposition Labels — Feedback Loop Risk',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's fraud AI model is retrained monthly using the prior month's investigator
      case dispositions as ground-truth labels, but the bank has not assessed whether systematic
      investigator bias in the disposition process — closing alerts on certain customer segments
      at higher rates than others due to investigator workload, implicit bias, or appeasement
      pressure from relationship managers — is being encoded into the model's learned parameters
      as a feedback loop. A biased label set used in retraining causes the model to reduce its
      sensitivity to the under-investigated population over successive training cycles, creating
      a growing detection gap precisely in the segments where investigator attention is lowest.
      SR 11-7 model governance requires that model training data quality controls include an
      assessment of label quality and systematic bias in human-generated outcome labels.`,
    keywords: ['AI label bias', 'SR 11-7 training data', 'fraud model feedback loop', 'OCC MRM', 'investigator bias'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2723',
    name: 'Agentic AI Fraud Triage Tool Initiating Account Holds Without Human Approval Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital piloted an agentic AI fraud triage system that can autonomously initiate
      temporary account holds based on a multi-step reasoning process — reviewing alert queue,
      gathering transaction context, and executing a hold via API — without requiring a human
      analyst to review and approve the hold before it is placed. During a misconfiguration
      incident in the pilot, the agentic system placed holds on 312 consumer accounts in 47
      minutes based on a pattern misidentification, triggering CFPB UDAAP concerns about
      automated adverse actions without human review. OCC guidance on AI governance and the
      bank's consent order remediation requirements both specify that automated decisions
      with material adverse customer impact must include a human-in-the-loop approval step
      before execution, which the agentic pilot architecture did not implement.`,
    keywords: ['agentic AI fraud', 'SR 11-7', 'OCC consent order', 'CFPB UDAAP', 'automated account hold'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2724',
    name: 'AI Fraud Pattern Explainability Insufficient for Adverse Action Notice Under FCRA',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `When First Capital's AI fraud model scores a credit applicant as high fraud risk and the
      bank denies the application, the adverse action notice delivered under FCRA and ECOA must
      include the principal reasons for the adverse action. The bank's current AI fraud model
      does not produce human-interpretable reason codes that can be translated into the specific
      ECOA reason code vocabulary required by Reg B, meaning applicants who are denied based
      primarily on a fraud score receive a generic "insufficient credit history" reason code
      rather than a description of the actual fraud indicators that drove the decision. The CFPB's
      2023 circular on adverse action notice requirements for AI models requires that adverse
      action notices reflect the actual factors considered by the model, not substitute reason
      codes from a non-AI evaluation.`,
    keywords: ['FCRA adverse action', 'ECOA Reg B', 'CFPB AI adverse action', 'SR 11-7 explainability', 'fraud AI reason codes'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2725',
    name: 'AI Fraud Vendor Contractual Indemnity Clause Not Covering Regulatory Fine from Model Failure',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's contract with its AI fraud scoring vendor includes a limitation of liability
      clause that caps the vendor's liability at fees paid in the prior 12 months and excludes
      consequential damages — meaning that if the vendor's AI model fails in a manner that produces
      a regulatory fine or consent order obligation for the bank, the vendor bears no financial
      responsibility for the regulatory consequence. OCC Bulletin 2023-17 requires banks to ensure
      that vendor contracts for critical AI systems address the allocation of risk for regulatory
      compliance failures that are attributable to the vendor's model performance; First Capital's
      legal team negotiated the vendor agreement under the bank's standard IT contract template
      without adapting the indemnity terms to reflect the regulatory risk profile of a fraud
      AI model operating under an OCC consent order.`,
    keywords: ['AI vendor indemnity', 'OCC Bulletin 2023-17', 'TPRM contract risk', 'regulatory fine allocation', 'consent order'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2726',
    name: 'AI Fraud Champion-Challenger Testing Not Implemented — Model Refresh Without Performance Baseline',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's fraud analytics team refreshes the transaction fraud model quarterly by
      deploying the updated model in full production without a champion-challenger testing period
      during which the new model runs in parallel on a traffic split and its performance is compared
      against the incumbent model on identical transaction populations. The absence of champion-
      challenger testing means model refreshes that introduce unexpected performance degradation
      in specific customer segments or fraud types are not detected until post-deployment monitoring
      identifies the issue — typically 30–60 days after the new model is live. SR 11-7 model
      governance requirements and OCC consent order remediation milestones for the bank's MRM
      program both specify champion-challenger testing as a mandatory step in model refresh
      processes for models with material financial impact.`,
    keywords: ['champion-challenger testing', 'SR 11-7 MRM', 'OCC consent order', 'fraud model refresh', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2727',
    name: 'AI Fraud Co-Pilot Prompt Injection Vulnerability Allowing Alert Manipulation via Transaction Memo Fields',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's LLM-based fraud investigation co-pilot processes the full transaction record
      including free-text memo and reference fields when generating case summaries and investigation
      recommendations — creating a prompt injection attack surface where a sophisticated fraud ring
      could embed instructions in transaction memo fields designed to manipulate the LLM's case
      summary to recommend alert closure. Security researchers documented similar prompt injection
      vulnerabilities in financial AI workflows in 2024; the bank's security review of the co-pilot
      focused on API authentication and data access controls but did not include adversarial
      testing of the LLM's handling of attacker-controlled text fields in processed documents.
      OCC guidance on AI operational security and SR 11-7 conceptual soundness requirements both
      require that AI systems processing external input be assessed for adversarial manipulation
      vulnerabilities.`,
    keywords: ['LLM prompt injection', 'AI fraud co-pilot security', 'OCC AI governance', 'SR 11-7 adversarial testing', 'TPRM'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2728',
    name: 'AI Fraud Model Documentation Not Meeting OCC Consent Order Evidence Requirements for Model Transparency',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's primary AI fraud scoring model documentation — the model development document
      and validation report maintained in the SR 11-7 model inventory — does not include a feature
      importance analysis showing which input variables drive the model's decisions across different
      customer segments, a requirement that OCC examiners have specifically requested as part of
      the consent order's model transparency remediation milestone. The bank's vendor-developed model
      documentation was prepared to the vendor's standard template, which does not include segment-
      specific feature attribution analysis; when OCC examiners requested this documentation, the
      bank could not produce it because neither the bank's MRM team nor the vendor had generated
      it as part of the standard model development process.`,
    keywords: ['SR 11-7 model documentation', 'OCC consent order', 'AI fraud model transparency', 'MRM', 'feature attribution'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },
  {
    code: 'B2729',
    name: 'Synthetic Media Detection in Video KYC Not Validated Against Current GAN Video Generation',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital uses a video KYC platform for high-value remote account opening where a
      customer completes a live video session with an identity verification agent, but the
      platform's liveness detection module has not been tested against current generative
      adversarial network video technology that can produce real-time synthetic video streams
      indistinguishable from live video by 2024 detection standards. The GAN video generation
      capability available in 2024 represents a qualitative improvement over the static deepfake
      images the platform was trained to detect; the vendor's liveness detection model was last
      validated against synthetic media benchmarks in 2022. OCC guidance on digital identity
      verification under FFIEC standards requires that liveness detection tools be validated
      against current-generation synthetic media on at least an annual basis.`,
    keywords: ['GAN video KYC', 'deepfake liveness detection', 'FFIEC digital identity', 'OCC remote onboarding', 'NIST SP 800-63B'],
    demoRelevant: true,
    subTopic: 'ai-fraud-part4',
    aiInsertionRisk: true,
  },

  // ── Zelle P2P Fraud ────────────────────────────────────────────────────────
  {
    code: 'B2730',
    name: 'Zelle Payment Authorization Dispute Policy Not Aligned With CFPB Reg E Reimbursement Expectations',
    officeCategory: 'front_office',
    failureRatePct: 79,
    description:
      `First Capital's policy for handling Zelle payment disputes treats all Zelle transactions
      where the customer authorized the payment — including cases where the customer was deceived
      by a scammer impersonating the bank into authorizing a payment — as ineligible for Reg E
      error resolution because the payment was technically "authorized." The CFPB's 2023 enforcement
      signals and supervisory guidance on Zelle dispute handling indicate that regulators expect
      banks to reimburse customers who were deceived by impersonation scams into authorizing
      Zelle payments using the bank's own brand — specifically, bank impersonation texts and
      calls that claim to be from First Capital's fraud department. First Capital has not updated
      its Reg E dispute policy to address the CFPB's emerging position that bank-impersonation-
      induced authorized Zelle payments carry bank reimbursement obligations.`,
    keywords: ['Zelle authorized fraud', 'Reg E reimbursement', 'CFPB enforcement', 'bank impersonation scam', 'OCC consumer protection'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2731',
    name: 'Zelle Enrollment Friction Reduction Increasing Mule Account Enrollment Rate',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital reduced Zelle enrollment friction in 2023 by removing the requirement for
      customers to verify a mobile phone number via SMS OTP before completing Zelle enrollment —
      a change made to improve conversion rates for the digital banking team's KPI dashboard —
      but the change also lowered the barrier to Zelle enrollment for newly opened mule accounts
      that do not have a registered mobile number associated with the account holder's identity.
      The enrollment friction reduction increased the new mule account Zelle enrollment rate,
      enabling fraud rings to use mule accounts to receive Zelle payments faster and at higher
      volume before the bank detects the mule pattern. Early Warning Services network data shows
      First Capital's mule-related Zelle inflow velocity increased 34% in the 90 days following
      the enrollment change; the bank has not assessed the fraud impact of the enrollment
      friction reduction as required by OCC product risk management guidance.`,
    keywords: ['Zelle enrollment friction', 'mule account', 'Early Warning Services', 'OCC product risk', 'CFPB'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2732',
    name: 'Zelle Transaction Limits Not Risk-Stratified by Account Age and Customer Behavior Profile',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital applies uniform Zelle daily transaction limits to all consumer deposit accounts
      regardless of account age, customer tenure, relationship depth, or historical transaction
      behavior — meaning newly opened accounts receive the same Zelle transaction limit as accounts
      with a five-year positive payment history. The uniform limit policy creates a predictable
      exploitation path for fraud rings: a new mule account can immediately access the maximum
      Zelle limit to receive and forward fraud proceeds. Early Warning Services Zelle fraud benchmarks
      show that banks using risk-stratified Zelle limits that ramp up over a 90-day account
      seasoning period reduce new-account-associated Zelle fraud losses by approximately 40%;
      First Capital's product team has deferred limit stratification because it requires changes
      to the core banking transaction limit system that are queued behind other modernization
      projects.`,
    keywords: ['Zelle transaction limits', 'account seasoning', 'Early Warning Services', 'mule account', 'OCC fraud controls'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2733',
    name: 'Zelle Fraud SAR Not Including P2P Network Graph Context Required by FinCEN Typology Guidance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `When First Capital files SARs related to Zelle-based fraud schemes — romance scams, investment
      fraud, government impersonation scams — the SAR narratives describe the bank account activity
      visible to First Capital but do not include the P2P network graph context that would allow
      FinCEN and law enforcement to identify the broader payment network used in the scheme across
      multiple participating banks. FinCEN's 2023 guidance on P2P payment fraud SAR filing specifically
      requires that SARs include available network topology information, including Zelle payment
      originator institution codes, to enable cross-institution case linking. First Capital's SAR
      preparation workflow does not include a step to extract Zelle transaction metadata required
      to populate the network context fields that FinCEN's P2P fraud guidance identifies as
      required SAR content.`,
    keywords: ['Zelle SAR', 'FinCEN P2P fraud guidance', 'BSA/AML', 'payment network graph', 'SAR narrative'],
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2734',
    name: 'Zelle Scam Prevention Warning Not Customized by Scam Type at Transaction Confirmation Screen',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's Zelle send confirmation screen displays a static warning message — "Be careful
      sending money to people you don't know" — rather than a scam-type-specific warning driven by
      the fraud risk model's assessment of the specific transaction's risk indicators. When the fraud
      model identifies a Zelle transaction as likely investment fraud — based on high amount, new
      payee, and transaction originating from a customer account showing investment scam behavioral
      patterns — the confirmation screen still shows the generic warning rather than a specific
      investment fraud alert. The CFPB's 2023 guidance on real-time payment consumer protection
      and Early Warning Services Zelle scam prevention best practices both recommend contextual,
      scam-type-specific warnings at the confirmation screen as a leading loss prevention intervention,
      with documented 15–30% transaction abandonment rates for appropriately targeted warnings.`,
    keywords: ['Zelle scam warning', 'CFPB consumer protection', 'Early Warning Services', 'investment fraud', 'real-time payment intervention'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2735',
    name: 'Zelle Fraud Reimbursement Exposure Not Reflected in CECL Reserve or Operational Risk Capital',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's CECL loss reserve and operational risk capital models do not include a
      forward-looking Zelle fraud reimbursement exposure component that estimates the potential
      liability if the CFPB formalizes its position that banks must reimburse customers for
      authorized Zelle payments made under impersonation scam conditions. The bank's legal team
      has assessed the regulatory risk as probable but has not provided a quantified exposure
      estimate to the CECL model team or the operational risk capital team; the omission means
      regulatory capital is not being maintained against what could be a material retroactive
      reimbursement obligation if the CFPB issues an enforcement action or formal rule requiring
      Zelle fraud reimbursement. SR 11-7 CECL validation requirements and OCC operational risk
      examination guidance require that forward-looking loss components include regulatory
      compliance risk that is assessed as probable.`,
    keywords: ['Zelle reimbursement exposure', 'CECL forward-looking', 'CFPB enforcement', 'SR 11-7', 'operational risk capital'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2736',
    name: 'Zelle Payment Recall Capability Not Implemented for Confirmed Scam Cases',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital does not utilize the Zelle network's payment recall mechanism — which allows
      the sending bank to request that the receiving bank reverse a completed Zelle payment when
      fraud is confirmed — because the bank's fraud operations team is not aware the mechanism
      exists and the bank has not implemented a workflow to initiate recall requests within the
      narrow post-payment window during which the receiving bank is contractually required to
      cooperate. Early Warning Services documentation for Zelle network participants specifies
      a recall process with defined SLA windows; First Capital's participation agreement includes
      the recall provisions but no operational team at the bank has been assigned ownership
      of the recall process. The bank's Zelle fraud loss rate could be reduced by an estimated
      8–15% through systematic use of the recall mechanism for eligible fraud cases confirmed
      within the recall window.`,
    keywords: ['Zelle payment recall', 'Early Warning Services', 'fraud recovery', 'OCC consumer protection', 'P2P fraud operations'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2737',
    name: 'Zelle Peer-to-Peer Fraud Trending Not Segmented by Scam Type in Executive Reporting',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's executive fraud dashboard reports Zelle fraud losses as a single aggregate
      metric without breakout by scam type — investment fraud, romance scam, impersonation scam,
      marketplace scam — preventing the bank's risk committee from identifying which scam categories
      are growing fastest and prioritizing prevention investments accordingly. Aggregated Zelle fraud
      reporting masks the signal that targeted prevention investments in specific scam typologies
      could dramatically reduce total losses; peer banks that implement scam-type segmentation
      in fraud reporting have reduced total Zelle fraud losses by 20–35% within 12 months of
      implementing targeted scam-type interventions. OCC guidance on fraud risk governance and
      CFPB supervisory expectations for Zelle fraud management both require that fraud reporting
      provide sufficient granularity for the board and risk committee to exercise informed oversight.`,
    keywords: ['Zelle fraud reporting', 'scam type segmentation', 'OCC risk governance', 'CFPB', 'fraud executive reporting'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2738',
    name: 'Zelle Mule Account Identification Lag Allowing Multiple Fraud Cycles Before Account Closure',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's process for identifying and closing Zelle mule accounts averages 18–22 days
      from first suspicious Zelle inflow to account closure — a timeline during which the mule
      account typically completes 3–5 fraud receipt-and-forward cycles, each cycle enabling further
      victim losses at other institutions. Early Warning Services provides real-time mule account
      risk scores to participating Zelle network banks as Zelle transactions are processed; First
      Capital's integration with the EWS mule score feed is implemented but the score is delivered
      to the bank's alert queue rather than triggering an automated review hold on the account,
      allowing transactions to continue while the alert ages in the queue. OCC guidance on Zelle
      fraud operations and EWS network participation standards both require that high-confidence
      mule risk scores trigger immediate account review holds, not queue-based review.`,
    keywords: ['Zelle mule account', 'Early Warning Services mule score', 'OCC fraud operations', 'account closure lag', 'P2P fraud'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
  {
    code: 'B2739',
    name: 'Zelle Fraud Liability Allocation Between First Capital and Fintech Deposit Partner Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital sponsors a banking-as-a-service arrangement with a fintech partner whose
      customers use accounts issued by First Capital to send and receive Zelle payments through
      the fintech's mobile app. The agreement between First Capital and the fintech does not
      clearly define which party bears Zelle fraud loss liability — specifically, whether fraud
      reimbursement obligations under emerging CFPB guidance on authorized Zelle payments fall
      to First Capital as the issuing bank or to the fintech as the customer-facing service
      operator. OCC guidance on banking-as-a-service arrangements and OCC Bulletin 2023-17 on
      third-party relationships both require that banks sponsoring fintech deposit programs
      document Zelle fraud liability allocation explicitly, including provisions addressing
      regulatory reimbursement obligations that attach to the bank as the regulated entity
      regardless of the fintech's operational role.`,
    keywords: ['BaaS Zelle liability', 'OCC Bulletin 2023-17', 'fintech partnership', 'CFPB authorized fraud', 'TPRM'],
    demoRelevant: true,
    subTopic: 'zelle-p2p-fraud',
  },
];
