// seed-banking-dom09-fraud-part6.ts
// Banking genome patterns — Fraud Risk Management
// Code range: B2800–B2859  (60 patterns)
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

export const BANKING_DOM09_FRAUD_PART6_PATTERNS: PatternSeed[] = [

  // ── AI Fraud Advanced (B2800–B2817) ──────────────────────────────────────
  {
    code: 'B2800',
    name: 'AI Deepfake Voice Fraud Detection Gap in Call Center',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's call center authentication workflow relies on voice biometric
      matching against an enrolled voiceprint to verify callers requesting high-risk
      transactions such as wire transfers and PIN resets, but the enrolled voiceprint
      matching engine was trained before real-time AI voice cloning tools became
      commercially available, leaving it unable to reliably distinguish a synthetic
      deepfake voice from the genuine customer. FinCEN's 2024 alert on AI-generated
      voice fraud and OCC guidance on customer authentication controls both require
      institutions to assess whether existing biometric authentication mechanisms
      remain effective against known AI-enabled attack vectors, including voice
      synthesis technology that can replicate a customer's voice from publicly
      available audio clips.`,
    keywords: ['deepfake-voice', 'voice-biometrics', 'FinCEN-AI-alert', 'call-center-authentication', 'voice-cloning'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2801',
    name: 'GenAI Social Engineering Resistance Controls Untested',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital has not updated its customer-facing fraud awareness program or
      internal employee social engineering resistance training to address the
      qualitative shift in phishing and vishing attack sophistication driven by
      large language models, which can generate fully personalized, contextually
      accurate fraud scripts at scale without detectable grammar or cultural markers
      previously used as red flags. The OCC's January 2025 examination guidance on
      AI-enabled fraud requires banks to demonstrate that customer communication
      controls and employee training curricula have been reviewed against the
      current AI-generated social engineering threat landscape, and that simulated
      AI-driven attack exercises are incorporated into annual security awareness
      testing programs.`,
    keywords: ['GenAI-social-engineering', 'phishing-awareness', 'vishing-controls', 'OCC-AI-fraud-guidance', 'employee-training'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2802',
    name: 'LLM Fraud Investigation Automation Producing Unreliable SAR Narratives',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital piloted an LLM-assisted tool to draft Suspicious Activity Report
      narratives from transaction data and case notes, but deployed it without a formal
      human-in-the-loop review gate that verifies factual accuracy before filing with
      FinCEN, resulting in several SARs containing hallucinated transaction amounts and
      fabricated entity relationships that do not appear in the underlying case data.
      FinCEN's SAR filing instructions require that narratives accurately reflect
      the facts of the suspicious activity; filing a SAR with materially inaccurate
      AI-generated content creates BSA/AML compliance liability and may constitute a
      false report to a federal agency, independent of whether a human analyst
      nominally reviewed the document.`,
    keywords: ['LLM-SAR-narrative', 'AI-hallucination', 'FinCEN-SAR-accuracy', 'BSA-AML-compliance', 'fraud-investigation-automation'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2803',
    name: 'AI Real-Time Payment Fraud Controls Ignore Irrevocability Risk',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's AI-powered fraud scoring model applies the same configurable
      decline threshold to RTP and FedNow instant payments as it does to ACH and wire
      transfers, without accounting for the material difference that instant payments
      are irrevocable within milliseconds of approval, leaving no post-settlement
      recall window unlike ACH returns or wire recalls. NACHA's 2024 risk management
      guidance and the Federal Reserve's FedNow Service Operating Procedures both
      require participants to demonstrate that pre-authorization fraud controls
      are commensurate with the irrevocability characteristic of instant payments,
      and examiners have cited institutions that apply legacy ACH-calibrated thresholds
      to instant payment channels without documented justification for the equivalence.`,
    keywords: ['real-time-payment-fraud', 'irrevocability-risk', 'RTP-FedNow', 'NACHA-risk-guidance', 'instant-payment-controls'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2804',
    name: 'ML Behavioral Biometric Model Drift Enabling Session Hijacking',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital deployed a behavioral biometrics solution that scores ongoing
      digital banking sessions against a learned user profile of keystroke dynamics,
      mouse movement patterns, and device interaction signatures, but has not
      revalidated the model since the institution migrated to a new mobile app
      framework eighteen months ago, causing the device interaction feature vectors
      to diverge from enrollment-era patterns and raising the false-positive rate
      to a level where the fraud team disabled automatic session termination to
      reduce customer friction. SR 11-7 model monitoring requirements apply to
      behavioral biometric models used in fraud controls; disabling automated
      enforcement without a documented compensating control and Model Risk Committee
      approval constitutes an unmanaged gap in the institution's fraud detection program.`,
    keywords: ['behavioral-biometrics', 'model-drift', 'session-hijacking', 'SR-11-7-monitoring', 'digital-banking-fraud'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2805',
    name: 'Synthetic Media Detection Absent From New Account Video KYC',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's digital account opening workflow uses asynchronous video
      selfie submission for identity document matching but does not run any
      synthetic media detection checks against the submitted video, relying
      solely on the document OCR match and liveness score which were both
      designed before generative AI video synthesis reached commercial availability.
      FinCEN's Customer Due Diligence final rule requires meaningful identity
      verification at account opening; a video KYC workflow that cannot detect
      AI-generated synthetic faces submitted as liveness evidence does not satisfy
      the rule's expectation that the institution form a reasonable belief about
      who it is doing business with.`,
    keywords: ['synthetic-media-detection', 'video-KYC', 'FinCEN-CDD-rule', 'AI-generated-identity', 'account-opening-fraud'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2806',
    name: 'AI Fraud Alert Suppression Model Lacks Adverse Action Documentation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital uses an AI model to suppress low-confidence fraud alerts
      before they reach human investigators, but the suppression model has not
      been documented under SR 11-7 model risk standards and no adverse action
      framework governs cases where alert suppression results in a fraud loss
      that would have been prevented by human review. OCC and FDIC joint guidance
      on model risk clarifies that suppression or filtering models that affect
      risk decisions carry the same SR 11-7 obligations as the primary detection
      model; an institution cannot reduce its model governance burden by interposing
      a secondary AI layer between the detection model output and human oversight.`,
    keywords: ['fraud-alert-suppression', 'SR-11-7-governance', 'adverse-action-documentation', 'AI-model-risk', 'human-oversight'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2807',
    name: 'AI Authorized Push Payment Fraud Feature Set Excludes Payee Network Analysis',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's real-time fraud model for digital payment authorization does
      not incorporate payee network analysis — specifically whether a new beneficiary
      account falls outside the customer's historical payment network — as a feature,
      relying instead on transaction velocity and amount anomalies that are ineffective
      against AI-scripted authorized push payment fraud where the customer themselves
      initiates a correctly authenticated payment after being socially engineered.
      UK FCA's Contingent Reimbursement Model code and FinCEN's 2024 APP fraud alert
      both specifically identify payee network novelty as a required signal in fraud
      controls designed to detect APP fraud patterns, and US regulators have indicated
      they will evaluate the adequacy of fraud feature sets against this standard.`,
    keywords: ['authorized-push-payment', 'payee-network-analysis', 'APP-fraud-detection', 'FinCEN-APP-alert', 'fraud-feature-engineering'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2808',
    name: 'LLM Investigation Copilot Output Used as Evidence Without Verification',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      `First Capital's fraud investigators use an LLM-powered case copilot that
      summarizes transaction histories and generates investigation hypotheses,
      but no documented workflow step requires investigators to verify the accuracy
      of LLM-generated summaries against primary source transaction data before
      the summary is cited in a SAR narrative or used to justify a case closure
      decision. FFIEC examination procedures require that fraud investigation
      processes produce reliable, auditable case documentation; relying on LLM
      outputs that may hallucinate transaction details without mandatory primary
      source verification creates both BSA compliance defects and potential
      litigation exposure if a disputed closure decision is challenged.`,
    keywords: ['LLM-investigation-copilot', 'SAR-evidence-accuracy', 'FFIEC-examination', 'fraud-case-documentation', 'AI-hallucination-risk'],
    demoRelevant: false,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2809',
    name: 'Deepfake Audio Bypass of Wire Transfer Callback Verification',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's wire transfer callback verification procedure requires a
      phone confirmation to the originating customer before processing large-dollar
      wires, but the callback protocol relies solely on voice recognition by the
      customer service representative without any technical voice authentication,
      making it vulnerable to AI deepfake audio attacks where the fraudster answers
      the callback using a cloned voice of the legitimate customer to confirm a
      fraudulent wire instruction. OCC safety and soundness guidance on wire
      transfer controls and the FFIEC's Business Continuity Management booklet
      both require that callback verification procedures be robust against known
      fraud methodologies; institutions that have not assessed their callback
      protocols against AI voice synthesis capabilities have an unaddressed gap.`,
    keywords: ['deepfake-audio', 'wire-transfer-callback', 'voice-authentication', 'OCC-wire-controls', 'FFIEC-callback-verification'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2810',
    name: 'AI Fraud Model Explainability Gap Impedes Regulatory Exam Response',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      `First Capital's primary fraud detection model uses a gradient-boosted ensemble
      architecture that produces a risk score without a natively interpretable
      explanation of which input features drove a particular transaction's score,
      and the institution has not implemented any post-hoc explainability layer
      such as SHAP values or LIME attributions, leaving fraud analysts and
      examiners unable to audit individual score decisions. OCC Bulletin 2021-37
      on model risk management and the Federal Reserve's SR 11-7 guidance both
      require that institutions be able to explain model outputs to stakeholders
      and examiners; an opaque fraud score without explainability support fails
      this requirement and has drawn examiner criticism at peer institutions
      during recent compliance examinations.`,
    keywords: ['AI-explainability', 'fraud-model-transparency', 'SHAP-values', 'SR-11-7-explainability', 'OCC-model-risk'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2811',
    name: 'ML Fraud Score Calibration Skewed by Imbalanced Training Dataset',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      `First Capital's fraud ML model was trained on a dataset where confirmed fraud
      cases represent less than 0.3% of observations, and the model was not calibrated
      to account for this class imbalance, causing the raw probability outputs to be
      systematically underestimated relative to the true prevalence of fraud in the
      live transaction population. SR 11-7 model validation requirements include
      assessment of calibration quality and confirmation that model outputs are
      suitable for the intended use case; a miscalibrated fraud score used to set
      rule thresholds will produce systematically misconfigured controls regardless
      of the classification accuracy metric, and this distinction is specifically
      highlighted in OCC's model validation examination guidance.`,
    keywords: ['ML-calibration', 'class-imbalance', 'fraud-model-validation', 'SR-11-7-calibration', 'probability-estimation'],
    demoRelevant: false,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2812',
    name: 'Generative AI Fraud Scenario Simulation Not Incorporated in Red Team Program',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's annual fraud red team exercises test known fraud typologies
      from historical loss event data but have not been updated to include
      generative AI-enabled attack scenarios such as AI-assisted account takeover,
      LLM-scripted social engineering, and deepfake identity document submission,
      leaving the institution without empirical evidence of how its fraud controls
      perform against current-generation AI-enabled attacks. OCC and FDIC guidance
      on fraud risk management programs requires that institutions conduct periodic
      assessments of fraud control effectiveness against an evolving threat landscape;
      a red team program that has not been updated to reflect the AI-enabled threat
      environment does not satisfy this requirement.`,
    keywords: ['AI-red-team', 'fraud-scenario-simulation', 'GenAI-attack-testing', 'OCC-fraud-program', 'threat-landscape-assessment'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2813',
    name: 'AI Fraud Model Feedback Loop Poisoning Via Analyst Override Patterns',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      `First Capital's fraud ML model uses analyst override decisions as a feedback
      signal to retrain the model, but the feedback pipeline does not filter out
      systemic override patterns driven by operational targets — specifically,
      analysts overriding high-score alerts as non-fraud to meet case closure
      throughput metrics — which has caused the model to progressively lower its
      score for transaction types that are legitimately high-risk but operationally
      inconvenient to investigate. SR 11-7 requires that model development and
      retraining processes be free from conflicts of interest and that training
      data quality controls prevent contamination from operationally driven labeling
      bias; a feedback loop that incorporates throughput-motivated override decisions
      without filtering represents a material model governance gap.`,
    keywords: ['feedback-loop-poisoning', 'analyst-override-bias', 'ML-retraining-controls', 'SR-11-7-data-quality', 'fraud-model-governance'],
    demoRelevant: false,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2814',
    name: 'AI Transaction Monitoring System Missing Consortium Fraud Signal Integration',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's AI transaction monitoring system does not ingest consortium
      fraud signals from industry shared-intelligence networks such as the Early
      Warning Services network or FS-ISAC threat feeds, operating exclusively on
      internal transaction history without the benefit of cross-institution fraud
      pattern recognition that would detect mule accounts and fraud rings that
      operate across multiple financial institutions simultaneously. FFIEC's Bank
      Secrecy Act examination manual encourages institutions to leverage
      collaborative information sharing under Section 314(b) of the USA PATRIOT Act;
      an AI fraud system that operates in an information silo misses the cross-bank
      fraud ring detection capability that consortium signals uniquely provide.`,
    keywords: ['consortium-fraud-signals', 'FS-ISAC-integration', '314b-information-sharing', 'fraud-ring-detection', 'AI-transaction-monitoring'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2815',
    name: 'Real-Time AI Fraud Score Not Propagated to Branch Teller System',
    officeCategory: 'front_office',
    failureRatePct: 53,
    description:
      `First Capital's AI real-time fraud scoring engine produces account-level
      risk scores for digital banking transactions but does not propagate those
      scores to the branch teller workstation, creating a channel arbitrage
      vulnerability where a fraudster who triggers a high fraud score in the
      digital channel can walk into a branch and complete the same transaction
      at a teller window without the teller being aware of the elevated risk
      signal. OCC safety and soundness guidance requires that fraud risk
      information be available across all service channels; an architecture
      that siloes fraud intelligence within the digital channel while leaving
      branch staff uninformed fails the requirement for integrated fraud
      detection across the institution's service delivery network.`,
    keywords: ['cross-channel-fraud', 'teller-system-integration', 'fraud-score-propagation', 'OCC-channel-controls', 'branch-fraud-detection'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2816',
    name: 'GenAI Impersonation of Bank Staff in Customer Fraud Schemes Unaddressed',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital has not implemented any technical or operational controls
      to detect or respond to fraud schemes where threat actors use generative
      AI to impersonate bank employees in customer-facing communications —
      producing convincing synthetic emails, voice calls, and chat messages
      that appear to originate from the bank's fraud prevention team to socially
      engineer customers into surrendering OTP codes or approving fraudulent
      transactions. CFPB supervision guidance on unfair, deceptive, and abusive
      acts or practices has been applied to institutions that fail to take
      reasonable steps to protect customers from third-party impersonation of
      bank staff; the failure to address known AI-enabled impersonation vectors
      creates both customer harm exposure and UDAP compliance risk.`,
    keywords: ['GenAI-impersonation', 'bank-staff-fraud', 'CFPB-UDAP-risk', 'OTP-theft', 'customer-social-engineering'],
    demoRelevant: true,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },
  {
    code: 'B2817',
    name: 'AI Fraud Detection Vendor Contract Lacks Model Change Notification Clause',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital's contract with its AI fraud detection vendor does not require
      the vendor to provide advance notification when the underlying detection model
      is updated, retrained, or replaced, meaning the institution has experienced
      multiple undisclosed model changes in the past year that altered the fraud
      score distribution without any corresponding update to the rule thresholds
      or performance monitoring baselines calibrated to the prior model version.
      SR 11-7 and OCC Third-Party Risk Management guidance both require that
      institutions maintain oversight of vendor model changes and treat undisclosed
      updates as model risk events requiring revalidation; a contract that permits
      silent model updates is inconsistent with the institution's model governance
      obligations.`,
    keywords: ['vendor-model-change', 'third-party-model-risk', 'SR-11-7-vendor', 'OCC-third-party-guidance', 'fraud-vendor-contract'],
    demoRelevant: false,
    subTopic: 'ai-fraud-advanced',
    aiInsertionRisk: true,
  },

  // ── Elder Financial Exploitation (B2818–B2829) ────────────────────────────
  {
    code: 'B2818',
    name: 'EFE Detection Program Lacks Automated Transaction Monitoring Rules',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's elder financial exploitation detection program relies
      entirely on branch staff subjective recognition and does not incorporate
      automated transaction monitoring rules targeting EFE-specific patterns
      such as sudden onset of large cash withdrawals by elderly customers,
      new power-of-attorney signers initiating atypical transactions, or
      repeated wire transfers to previously unknown beneficiaries coinciding
      with a change in account authorized parties. CFPB guidance on financial
      exploitation of older adults and FinCEN's 2022 advisory on elder financial
      exploitation both identify automated transaction monitoring as a foundational
      control in an effective EFE program; reliance on frontline subjectivity
      alone does not satisfy the advisory's recommended control standards.`,
    keywords: ['EFE-transaction-monitoring', 'elder-financial-exploitation', 'FinCEN-EFE-advisory', 'automated-detection', 'CFPB-elder-guidance'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2819',
    name: 'Suspicious Activity Reporting for Elder Abuse Consistently Late',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's SAR filing for elder financial exploitation cases consistently
      exceeds the 30-day BSA reporting window, averaging 47 days from detection
      to filing across a sample of 24 EFE SARs reviewed in the most recent
      internal audit, primarily because EFE cases are routed through a general
      fraud investigation queue that does not prioritize elder abuse scenarios
      with an expedited review pathway. The Bank Secrecy Act and FinCEN's SAR
      filing requirements mandate 30-day filing from date of detection with no
      exception for case complexity; late SAR filing for elder abuse cases also
      jeopardizes timely referrals to Adult Protective Services under state
      mandatory reporting laws that run concurrently with BSA obligations.`,
    keywords: ['EFE-SAR-timeliness', 'elder-abuse-reporting', 'BSA-30-day-window', 'APS-referral', 'FinCEN-SAR-requirements'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2820',
    name: 'Power-of-Attorney Fraud Controls Missing Grantor Wellness Check Protocol',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's account procedures for activating a durable power of attorney
      verify the document's facial validity and the agent's identity but do not
      include a protocol for independently contacting the grantor customer to confirm
      awareness and consent, particularly when the POA activation coincides with
      unusual transaction patterns or is initiated shortly after a change in the
      customer's primary contact information. CFPB and OCC guidance on elder
      financial exploitation specifically identifies POA activation without grantor
      wellness verification as a high-risk scenario; the absence of an independent
      grantor outreach step in the POA activation workflow leaves the institution
      without a documented control against a primary EFE vector.`,
    keywords: ['power-of-attorney-fraud', 'grantor-wellness-check', 'CFPB-EFE-controls', 'OCC-elder-guidance', 'POA-activation'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2821',
    name: 'Trusted Contact Designation Program Adoption Below Regulatory Expectations',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's trusted contact designation program, required under FINRA
      Rule 4512 for brokerage accounts and strongly encouraged for deposit accounts
      under CFPB elder financial exploitation guidance, has achieved less than 8%
      designation rate across eligible accounts because the bank does not include
      trusted contact solicitation in the account opening workflow or annual
      account review communications. CFPB supervisory guidance identifies low
      trusted contact adoption as a program design deficiency rather than solely
      a customer preference outcome; an institution that does not systematically
      solicit trusted contact designations has a structurally incomplete elder
      financial exploitation detection and intervention framework.`,
    keywords: ['trusted-contact-designation', 'FINRA-4512', 'CFPB-elder-exploitation', 'account-opening-controls', 'EFE-program-design'],
    demoRelevant: false,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2822',
    name: 'Teller EFE Training Does Not Include AI-Assisted Scam Recognition',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's teller training program for elder financial exploitation
      recognition was last updated in 2022 and does not include recognition
      guidance for AI-enabled scams targeting elderly customers, specifically
      grandparent scams using AI voice cloning to impersonate family members
      in distress and government impersonation scams using AI-generated official
      communications. FinCEN's 2022 EFE advisory and subsequent CFPB guidance
      both call out AI-enhanced elder fraud as an emerging typology requiring
      updated front-line recognition training; an institution that has not
      refreshed its teller EFE training to address these typologies has a
      documented gap in its fraud awareness program.`,
    keywords: ['teller-EFE-training', 'AI-elder-scams', 'grandparent-scam', 'FinCEN-EFE-typologies', 'front-line-fraud-recognition'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2823',
    name: 'EFE Protective Hold Procedure Not Documented in Branch Operations Manual',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital operates in multiple states that have enacted permissive
      delay laws allowing financial institutions to place a temporary hold on
      suspected elder financial exploitation transactions without liability,
      but the institution's branch operations manual does not contain a
      documented procedure for invoking these protective holds, and branch
      managers are unaware of the legal authority to delay transactions.
      State elder financial exploitation statutes providing hold authority
      require that institutions have documented procedures to benefit from
      the civil immunity provisions; failure to document and train on the
      hold procedure means the institution cannot invoke the immunity and
      also misses an intervention tool that regulators expect to see used
      in appropriate circumstances.`,
    keywords: ['EFE-protective-hold', 'delay-law-compliance', 'branch-operations', 'civil-immunity', 'elder-intervention'],
    demoRelevant: false,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2824',
    name: 'Joint Account Elder Exploitation Detection Lacks Secondary Signer Analytics',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's transaction monitoring system does not analyze the
      behavioral pattern of individual signers on joint accounts separately,
      treating joint account activity as attributable to the account rather
      than to distinct signers, which prevents detection of secondary signer
      exploitation patterns where a recently added joint account holder
      conducts systematic withdrawals inconsistent with the primary account
      holder's historical transaction behavior. CFPB elder financial exploitation
      examination guidance identifies signer-level behavioral analytics as a
      best practice for detecting exploitation through joint account manipulation;
      account-level monitoring alone cannot surface the per-signer anomalies
      that characterize this EFE vector.`,
    keywords: ['joint-account-exploitation', 'secondary-signer-analytics', 'CFPB-EFE-examination', 'behavioral-monitoring', 'elder-account-protection'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2825',
    name: 'Romance Scam Detection Rules Absent From EFE Monitoring Program',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's elder financial exploitation monitoring rules focus on
      caregiver and family member exploitation patterns but do not include
      detection rules for romance scam typologies — specifically, recurring
      international wire transfers to previously unknown beneficiaries combined
      with customer communication indicating emotional investment in the
      recipient — despite romance scams being the highest-dollar-loss EFE
      vector according to FTC data for customers over 60. FinCEN's 2022 EFE
      advisory explicitly calls out romance scams as a priority typology
      requiring dedicated monitoring rules; an EFE program that does not
      address the highest-loss typology has a material coverage gap.`,
    keywords: ['romance-scam-detection', 'EFE-monitoring-rules', 'FinCEN-EFE-advisory', 'international-wire-fraud', 'elder-investment-fraud'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2826',
    name: 'Adult Protective Services Referral Process Not Integrated With SAR Workflow',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's SAR filing process for elder financial exploitation cases
      does not include a systematic step for concurrent referral to state Adult
      Protective Services agencies, and the institution has no documented procedure
      for making APS referrals independently of whether a SAR is filed, creating
      cases where elder abuse victims are reported to FinCEN but not to the
      state agency with civil authority to intervene and protect the victim.
      State mandatory reporter laws applicable to financial institutions in
      several states where First Capital operates require APS referral within
      timeframes that are shorter than the BSA SAR filing window; treating
      APS referral as subordinate to SAR filing creates statutory compliance
      exposure under state law separate from the BSA obligation.`,
    keywords: ['APS-referral', 'SAR-elder-abuse', 'mandatory-reporter', 'state-elder-law', 'victim-protection'],
    demoRelevant: false,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2827',
    name: 'Cognitive Decline Accommodation Policy Absent From Account Management Procedures',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's account management and service procedures do not include
      guidance for handling customer interactions where frontline staff observe
      indicators of cognitive decline — including memory loss, confusion about
      account history, or inability to recall recent transactions — that may
      signal vulnerability to financial exploitation, leaving staff without a
      clear escalation path or documented accommodation process. CFPB's guidance
      on serving customers with diminished capacity and the ABA Foundation's
      elder financial exploitation prevention guidelines both identify a
      documented cognitive decline accommodation policy as a baseline expectation;
      the absence of such a policy leaves frontline staff unable to appropriately
      respond to situations that carry both customer protection and potential
      liability implications.`,
    keywords: ['cognitive-decline-accommodation', 'CFPB-diminished-capacity', 'elder-vulnerability', 'frontline-escalation', 'ABA-foundation-guidance'],
    demoRelevant: false,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2828',
    name: 'Annuity and Investment Product Sales to Elderly Customers Missing Suitability Review',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital's bank-affiliated investment program does not apply an
      enhanced suitability review for annuity and complex investment product
      sales to customers over age 75, despite FINRA Rule 4512 and the SEC's
      Regulation Best Interest both requiring that suitability analyses
      account for the customer's financial situation including time horizon
      — which is materially shorter for very elderly customers — and cognitive
      capacity to understand the product's terms. Several recent state insurance
      department enforcement actions have cited banks for annuity sales to
      elderly customers without age-appropriate suitability documentation;
      the absence of an enhanced review threshold for customers over 75 creates
      both regulatory and litigation exposure.`,
    keywords: ['annuity-suitability', 'elder-investment-protection', 'FINRA-4512', 'Regulation-Best-Interest', 'elderly-customer-review'],
    demoRelevant: true,
    subTopic: 'elder-financial-exploitation',
  },
  {
    code: 'B2829',
    name: 'EFE Program Effectiveness Metrics Not Reported to Board Risk Committee',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's elder financial exploitation prevention program does not
      have defined key performance indicators reported to the Board Risk Committee,
      and the most recent Board Risk Committee meeting minutes contain no discussion
      of EFE program outcomes, detection rates, SAR filing timeliness, or APS
      referral volume, limiting board-level visibility into a risk that regulators
      specifically expect to see governed at the board level. OCC and CFPB guidance
      on elder financial exploitation both state that effective programs require
      board-level awareness and oversight; an EFE program that operates below the
      board's line of sight fails the governance expectations established by both
      agencies and is likely to draw examiner criticism when program metrics
      are requested during examination.`,
    keywords: ['EFE-board-reporting', 'risk-committee-oversight', 'OCC-EFE-governance', 'CFPB-elder-program', 'KPI-reporting'],
    demoRelevant: false,
    subTopic: 'elder-financial-exploitation',
  },

  // ── Insider Threat Fraud (B2830–B2839) ───────────────────────────────────
  {
    code: 'B2830',
    name: 'Employee Fraud Scheme Detection Missing Account Lookup Anomaly Rules',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's insider threat monitoring program does not include
      transaction monitoring rules flagging employees who access customer
      accounts outside their assigned customer portfolio or job function scope,
      allowing unauthorized account reconnaissance by employees in the early
      stages of an insider fraud scheme to go undetected until a customer
      complaint is received. FFIEC Information Security examination guidance
      and OCC internal control standards both require that employee account
      access be monitored for unauthorized access patterns; the absence of
      portfolio-scope-aware lookup anomaly rules in the transaction monitoring
      system creates a preventable detection gap for the most common early
      indicator of employee fraud.`,
    keywords: ['employee-fraud-detection', 'account-lookup-anomaly', 'FFIEC-security-guidance', 'OCC-internal-controls', 'insider-threat-monitoring'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2831',
    name: 'Privileged Access Monitoring Logs Not Reviewed for Fraud Indicators',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital generates privileged access logs for core banking system
      administrators and database access accounts but does not perform routine
      fraud-indicator analysis on these logs, reviewing them only in response
      to specific incident triggers rather than proactively screening for
      patterns associated with insider fraud such as off-hours access to
      customer account tables, bulk data extracts, or modification of transaction
      records without associated work order documentation. FFIEC IT examination
      guidance requires that privileged access activity be logged and reviewed
      on a defined schedule; treating privileged access logs as an incident
      response tool rather than a proactive fraud detection data source fails
      both the IT security and fraud risk management requirements simultaneously.`,
    keywords: ['privileged-access-monitoring', 'insider-fraud-logs', 'FFIEC-IT-examination', 'core-banking-access', 'proactive-log-review'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2832',
    name: 'Segregation of Duties Violations in Payment Processing Not Detected by Controls',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's payment operations function has at least six active user
      accounts with access permissions that allow the same individual to both
      initiate and approve wire transfer or ACH payment instructions, a
      segregation of duties violation that has persisted undetected for over
      a year because the access provisioning review is conducted by HR at
      onboarding but not re-validated when employees change roles or
      accumulate access permissions over time. OCC internal control standards
      and the FFIEC's Operations booklet both require ongoing SOD monitoring
      in payment processing functions; a one-time onboarding access review
      without periodic re-attestation fails the continuous monitoring requirement
      and exposes the institution to insider payment fraud risk.`,
    keywords: ['segregation-of-duties', 'payment-processing-fraud', 'SOD-violation', 'OCC-internal-controls', 'access-re-attestation'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2833',
    name: 'Terminated Employee Access Revocation SLA Routinely Missed',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's HR-to-IT access revocation workflow averages 3.8 business
      days between employee termination notification and system access removal,
      versus an internal policy requirement of same-business-day revocation for
      involuntary terminations, creating a window during which a terminated
      employee retains full access to core banking systems, customer data,
      and payment functions with a motive to commit fraud or data exfiltration.
      FFIEC Information Security guidance and OCC's internal control standards
      require that access revocation for terminated employees occur on the
      termination effective date; the persistent SLA miss documented in internal
      audit findings represents an unresolved insider threat gap that has been
      cited in two consecutive annual audits without remediation.`,
    keywords: ['terminated-employee-access', 'access-revocation-SLA', 'FFIEC-security-guidance', 'insider-fraud-window', 'HR-IT-workflow'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2834',
    name: 'Ghost Employee Scheme Detection Not Covered by Payroll Audit Procedures',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital's annual payroll audit procedure verifies that payroll
      disbursements match HR employee records by employee ID but does not
      perform independent verification that payroll recipients correspond
      to real individuals with verifiable identity, tax identification,
      and active employment status, leaving the audit unable to detect
      ghost employee schemes where fictitious employee records are created
      to divert payroll funds. OCC internal control standards require that
      payroll controls include procedures to detect fictitious employees;
      an audit that reconciles system records to system records without
      independent verification of underlying identity creates a material
      detection gap for a classic insider fraud scheme.`,
    keywords: ['ghost-employee-fraud', 'payroll-audit', 'OCC-internal-controls', 'fictitious-employee', 'payroll-disbursement-controls'],
    demoRelevant: false,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2835',
    name: 'Loan Officer Override Patterns Not Included in Insider Fraud Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's insider threat monitoring program tracks employee access
      anomalies in deposit and payment systems but does not extend monitoring
      coverage to loan officer system override events — specifically, instances
      where loan officers approve exceptions to credit policy or waive documentation
      requirements — which are the primary mechanism for loan officer fraud schemes
      that result in fraudulent originations, fee schemes, and bribery facilitation.
      OCC guidance on insider fraud and the FDIC's bank fraud examination procedures
      both identify loan officer override monitoring as a required component of an
      insider threat program at institutions with material lending operations;
      the monitoring gap creates undetected exposure in First Capital's largest
      revenue-generating business line.`,
    keywords: ['loan-officer-fraud', 'override-monitoring', 'credit-exception-fraud', 'OCC-insider-fraud', 'FDIC-examination-procedures'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2836',
    name: 'Data Loss Prevention Controls Not Deployed on Customer PII Export Functions',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      `First Capital does not have data loss prevention controls on the customer
      data export functions accessible to operations staff, allowing employees
      with legitimate report generation access to extract bulk customer PII —
      including account numbers, SSNs, and contact information — to external
      storage without triggering any monitoring alert or approval workflow.
      FFIEC Information Security guidance requires that data loss prevention
      controls be commensurate with the sensitivity of the data they protect;
      the absence of DLP controls on bulk PII export creates both an insider
      fraud and identity theft facilitation risk, and also exposes the institution
      to GLBA Safeguards Rule enforcement for inadequate customer information
      protection controls.`,
    keywords: ['data-loss-prevention', 'PII-export-controls', 'GLBA-Safeguards-Rule', 'insider-data-theft', 'FFIEC-information-security'],
    demoRelevant: true,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2837',
    name: 'Employee Fraud Hotline Reports Not Tracked to Resolution in Risk System',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      `First Capital operates an anonymous employee fraud hotline but tracks
      hotline submissions in a standalone spreadsheet maintained by Compliance
      rather than in the enterprise risk management system, resulting in
      hotline tips not being systematically correlated with related transaction
      monitoring alerts, access anomalies, or prior hotline submissions that
      collectively might constitute a pattern requiring investigation escalation.
      FFIEC Bank Secrecy Act examination procedures and OCC internal control
      standards both require that fraud tip intake processes be integrated
      with broader fraud surveillance and investigation workflows; a siloed
      hotline tracking process that cannot correlate tips with surveillance
      data fails this integration requirement.`,
    keywords: ['fraud-hotline', 'tip-tracking-integration', 'OCC-internal-controls', 'risk-system-integration', 'anonymous-reporting'],
    demoRelevant: false,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2838',
    name: 'Post-Termination Non-Compete Monitoring Absent for Sensitive Roles',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      `First Capital does not conduct any post-termination monitoring of
      former employees in sensitive fraud-risk roles — specifically, fraud
      analysts and BSA officers with deep knowledge of the institution's
      detection rule configurations — to detect whether they have joined
      a competitor or a fraud consulting firm and subsequently supported
      fraud schemes that exploit their knowledge of the institution's
      monitoring gaps. OCC guidance on information security and FFIEC
      examination procedures for insider threat both identify post-termination
      risk from employees with sensitive system knowledge as a component
      of a mature insider threat program; the absence of any post-termination
      risk assessment process for high-sensitivity roles represents a program
      maturity gap.`,
    keywords: ['post-termination-monitoring', 'sensitive-role-offboarding', 'OCC-insider-threat', 'FFIEC-information-security', 'fraud-analyst-risk'],
    demoRelevant: false,
    subTopic: 'insider-threat-fraud',
  },
  {
    code: 'B2839',
    name: 'Expense Reimbursement Fraud Detection Relies on Manual Manager Approval Only',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's employee expense reimbursement process relies on manager
      approval as the sole fraud detection control, without any automated
      duplicate submission detection, vendor invoice cross-referencing, or
      statistical analysis of expense patterns by employee, department, or
      account code that would identify systematic over-billing, fictitious
      expense, or collusive vendor schemes. OCC internal control standards
      and COSO's internal control framework both require that detective
      controls for expense fraud include data analytics in addition to
      manager review, because manager approval is insufficient to detect
      schemes that operate below the manager's attention threshold or
      involve manager collusion.`,
    keywords: ['expense-fraud-detection', 'duplicate-expense-submission', 'OCC-internal-controls', 'COSO-framework', 'vendor-collusion'],
    demoRelevant: false,
    subTopic: 'insider-threat-fraud',
  },

  // ── Business Email Compromise (B2840–B2849) ───────────────────────────────
  {
    code: 'B2840',
    name: 'BEC Callback Verification Performed to Unverified Callback Numbers',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's wire transfer operations procedure requires a callback
      verification call before processing wire instructions received by email,
      but the callback number used is taken from the email requesting the wire
      rather than from the independently maintained vendor contact database,
      allowing a BEC attacker who controls the fraudulent email to provide a
      callback number answered by their own spoofed representative to confirm
      the fraudulent wire instruction. FinCEN's 2016 advisory on business email
      compromise and FBI IC3 guidance both explicitly identify callback to the
      number provided in the suspicious email as an ineffective control; the
      verification procedure's failure to source the callback number from an
      independently verified source renders the callback control entirely
      ineffective against the most common BEC attack pattern.`,
    keywords: ['BEC-callback-verification', 'wire-fraud-controls', 'FinCEN-BEC-advisory', 'FBI-IC3-guidance', 'independent-callback-source'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2841',
    name: 'Wire Transfer Dual-Approval Control Bypassable for Intraday Limit Changes',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      `First Capital's wire transfer processing system requires dual approval for
      individual wire transfers above $500,000 but allows a single operations
      supervisor to temporarily increase the per-transaction limit for a named
      operator without a second approval, creating a BEC vulnerability where a
      fraudster who compromises an operations supervisor's email account can
      instruct the supervisor to elevate an operator's limit before a large
      fraudulent wire is submitted. OCC and FinCEN guidance on BEC-related wire
      fraud both require that limit override controls be subject to the same
      dual-approval requirement as the underlying transaction authority; a
      limit override that bypasses the dual-approval control defeats the
      control's entire purpose.`,
    keywords: ['wire-dual-approval', 'limit-override-control', 'BEC-wire-fraud', 'OCC-wire-controls', 'FinCEN-BEC-guidance'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2842',
    name: 'Vendor Impersonation Controls Lack DMARC Enforcement on Outbound Domain',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital has not implemented DMARC with a reject policy on its
      primary email domain, allowing attackers to send emails that appear to
      originate from first-capital.com to the bank's own corporate customers
      and vendors as part of vendor impersonation and BEC schemes targeting
      the bank's commercial clients, and also leaving the institution unable
      to demonstrate to commercial customers that impersonation emails claiming
      to come from the bank are technically blocked. CISA's email security
      guidance and FinCEN's BEC advisory both recommend DMARC enforcement as
      a baseline technical control; an institution that has not enforced DMARC
      on its outbound domain creates impersonation risk not only for itself
      but for every commercial customer relationship where its domain is a
      trusted sender.`,
    keywords: ['DMARC-enforcement', 'vendor-impersonation', 'email-domain-security', 'FinCEN-BEC-advisory', 'CISA-email-guidance'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2843',
    name: 'Real Estate Closing Wire Fraud Warning Not Provided to Mortgage Customers',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's mortgage loan officers do not provide written BEC
      wire fraud warnings to customers at loan closing, specifically the
      warning that closing wire instructions will never be changed by email
      and that any emailed wire instruction change request should be verified
      by phone to the title company using a number independently obtained —
      not the number provided in the change request email. FBI IC3 data
      consistently shows real estate closing wire fraud as the largest-dollar
      BEC category; several state attorney general offices have pursued
      enforcement actions against title companies and lenders that failed
      to provide BEC fraud warnings at closing, and the CFPB has indicated
      that failure to warn constitutes potential UDAP risk in mortgage servicing.`,
    keywords: ['real-estate-wire-fraud', 'closing-BEC-warning', 'mortgage-fraud-disclosure', 'FBI-IC3-real-estate', 'CFPB-UDAP-mortgage'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2844',
    name: 'Commercial Customer BEC Education Program Not Included in Treasury Management Onboarding',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital does not include BEC fraud awareness education in the
      treasury management onboarding package for commercial customers, missing
      the highest-leverage point in the customer relationship to establish
      wire fraud prevention practices — specifically, the importance of
      out-of-band verification of wire instructions, dual approval policies,
      and positive pay enrollment — before the customer's payment workflows
      are fully established. OCC and FDIC guidance on commercial banking
      fraud risk management both identify customer education as a required
      component of a BEC risk management program; an institution that
      onboards commercial treasury customers without delivering BEC prevention
      guidance has an incomplete program relative to regulatory expectations.`,
    keywords: ['commercial-BEC-education', 'treasury-management-onboarding', 'wire-fraud-prevention', 'OCC-fraud-program', 'positive-pay-enrollment'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2845',
    name: 'Positive Pay Enrollment Rate Below Industry Baseline for Commercial Accounts',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's commercial checking accounts have a positive pay
      enrollment rate of 31%, compared to an industry median of 58% for
      commercial accounts at peer community banks, because the bank does
      not require positive pay as a condition of commercial account opening
      and does not systematically promote enrollment as part of ongoing
      treasury management relationship management. OCC and FDIC safety
      and soundness guidance on check fraud controls identify positive pay
      as a fundamental commercial check fraud control; a 31% enrollment
      rate means that 69% of First Capital's commercial check volume lacks
      the primary automated control against check fraud, creating loss
      exposure and potential liability in states where failure to use
      available fraud prevention tools affects allocation of loss between
      institution and customer.`,
    keywords: ['positive-pay-enrollment', 'commercial-check-fraud', 'OCC-check-controls', 'treasury-management-fraud', 'check-fraud-prevention'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2846',
    name: 'BEC Fraud Loss Reimbursement Policy Not Documented for Commercial Customers',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital does not have a documented policy governing the conditions
      under which it will reimburse commercial customers for BEC wire fraud
      losses, addressing the case on an ad hoc basis that has produced
      inconsistent outcomes across similarly situated customers and created
      litigation exposure when a reimbursement denial is contested by a
      customer who cites comparable cases where the bank did reimburse.
      While commercial wire fraud losses are generally not covered by Reg E,
      the OCC's examination framework for complaint management and the CFPB's
      fair treatment expectations require that institutions apply consistent,
      documented policies to similarly situated customers; ad hoc BEC
      reimbursement decisions that produce disparate outcomes create
      both regulatory and litigation risk.`,
    keywords: ['BEC-reimbursement-policy', 'commercial-fraud-loss', 'OCC-complaint-management', 'wire-fraud-liability', 'consistent-fraud-policy'],
    demoRelevant: false,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2847',
    name: 'CEO Impersonation Wire Request Escalation Path Not Defined in Operations Manual',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital's wire transfer operations manual does not include a
      specific procedure for handling wire requests that purportedly originate
      from senior executive officers — a classic BEC typology where fraudsters
      impersonate the CEO or CFO to pressure operations staff into bypassing
      normal approval procedures — leaving operations staff to handle these
      high-pressure scenarios without documented authority to pause processing
      or require independent verification of executive identity. FinCEN's BEC
      advisory and FBI IC3 guidance both identify executive impersonation wire
      requests as the single most common BEC typology; an operations manual
      that does not address this scenario leaves staff vulnerable to social
      engineering pressure from fraudsters exploiting the authority gradient.`,
    keywords: ['CEO-impersonation', 'executive-wire-fraud', 'FinCEN-BEC-typology', 'operations-manual-gap', 'social-engineering-authority'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2848',
    name: 'BEC Incident Response Plan Not Tested Against Same-Day ACH Reversal Window',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's BEC incident response plan defines a general workflow
      for responding to identified wire fraud but has not been tested against
      the specific time constraint of same-day ACH payment reversals, which
      require action within a four-hour window, and the plan's escalation
      steps — which involve multiple management approvals — take an average
      of six hours to complete based on tabletop exercise results. NACHA
      same-day ACH operating rules and FinCEN's BEC advisory both require
      that institutions have response capabilities commensurate with the
      irrevocability timelines of each payment rail; an incident response
      plan that structurally cannot execute within the reversal window for
      same-day ACH fails to meet this standard.`,
    keywords: ['BEC-incident-response', 'same-day-ACH-reversal', 'NACHA-operating-rules', 'FinCEN-BEC-response', 'fraud-recovery-timing'],
    demoRelevant: true,
    subTopic: 'business-email-compromise',
  },
  {
    code: 'B2849',
    name: 'Vendor Master File Change Controls Do Not Require Callback Verification',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's accounts payable vendor master file change process
      allows bank wire transfer beneficiary account changes to be processed
      based on an email instruction from a vendor contact without requiring
      an independent callback verification to a previously registered vendor
      phone number, making the institution's own payment operations vulnerable
      to vendor impersonation BEC attacks that target the bank's vendor
      payment function. FinCEN's BEC advisory and OCC internal control
      guidance both identify vendor master file change controls as a required
      component of a complete BEC prevention program; an institution whose
      own internal accounts payable function lacks proper vendor change
      verification controls is exposed to the same fraud typology it advises
      commercial customers to prevent.`,
    keywords: ['vendor-master-file', 'accounts-payable-BEC', 'vendor-impersonation', 'FinCEN-BEC-controls', 'OCC-AP-controls'],
    demoRelevant: false,
    subTopic: 'business-email-compromise',
  },

  // ── Fraud Recovery & Dispute (B2850–B2859) ────────────────────────────────
  {
    code: 'B2850',
    name: 'Reg E Error Resolution Timeliness Below Required Statutory Deadline',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's electronic fund transfer error resolution process averages
      14.3 business days from dispute intake to provisional credit or denial
      determination across a sample of 180 Reg E disputes reviewed in the
      most recent compliance audit, exceeding the 10-business-day provisional
      credit window required by Regulation E for disputes where the institution
      has not yet completed its investigation. Regulation E Section 1005.11
      imposes a strict 10-business-day deadline for provisional credit issuance
      absent investigation completion; exceeding this deadline is a per-dispute
      Reg E violation carrying potential CFPB enforcement exposure, and a
      systemic pattern of late resolution is treated as a programmatic violation
      warranting supervisory action rather than individual case remediation.`,
    keywords: ['Reg-E-error-resolution', 'provisional-credit-deadline', 'CFPB-Reg-E-enforcement', 'EFT-dispute-timeliness', 'electronic-fund-transfer'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2851',
    name: 'Fraud Loss Recovery Program Lacks Defined Law Enforcement Referral Criteria',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's fraud loss recovery program does not have documented
      criteria for referring fraud cases to law enforcement — specifically,
      dollar thresholds and case characteristics that trigger referral to
      local FBI field offices, the Secret Service, or local prosecutors —
      resulting in inconsistent referral decisions that range from referring
      $5,000 cases with strong evidence to failing to refer $200,000 cases
      with identified perpetrators. OCC guidance on fraud risk management
      programs and FFIEC examination procedures for BSA/AML both note that
      an effective fraud program includes defined law enforcement referral
      criteria; inconsistent referral decisions create both program quality
      gaps and potential obstruction concerns if a large identifiable fraud
      case is not reported.`,
    keywords: ['fraud-law-enforcement-referral', 'FBI-fraud-referral', 'OCC-fraud-program', 'FFIEC-BSA-AML', 'fraud-case-escalation'],
    demoRelevant: false,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2852',
    name: 'Dispute Documentation Deficiencies Preventing Charge-back Recovery',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's card dispute resolution team fails to collect and preserve
      the full documentation package required by card network charge-back rules
      — specifically, merchant response records, transaction authorization logs,
      and customer dispute affidavits — before the charge-back arbitration
      deadline, resulting in the bank losing arbitration in approximately 34%
      of disputed transactions where a properly documented charge-back would
      have resulted in merchant recovery. Card network operating rules impose
      strict documentation deadlines for charge-back disputes; systematic
      documentation deficiencies that result in avoidable charge-back losses
      represent both a direct financial loss and an internal control deficiency
      in the institution's fraud recovery program.`,
    keywords: ['chargeback-documentation', 'card-dispute-recovery', 'charge-back-arbitration', 'card-network-rules', 'fraud-recovery-program'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2853',
    name: 'Reg E Investigation Closure Letters Do Not Meet Required Content Standards',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      `First Capital's Regulation E dispute denial letters consistently omit
      the specific factual basis for the denial required by Section 1005.11(d),
      providing only a generic statement that the transaction was authorized
      without identifying the specific evidence — such as device fingerprint
      match, PIN usage, or consistent geolocation — that constituted the basis
      for the authorized transaction determination. CFPB examination procedures
      for Regulation E specifically evaluate whether denial letters provide
      sufficient factual basis for the denial; denial letters that do not
      identify the specific evidence used are both a Reg E violation and
      a systemic complaint risk because customers who receive substantively
      empty denials have a higher likelihood of escalating to the CFPB.`,
    keywords: ['Reg-E-denial-letter', 'CFPB-Reg-E-examination', 'dispute-closure-content', 'authorized-transaction-evidence', 'EFT-investigation'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2854',
    name: 'Fraud Dispute Reconsideration Process Not Available to Customers',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital does not have a documented reconsideration process for
      customers who disagree with a fraud dispute denial determination,
      leaving customers whose disputes are denied with no clear path to
      present additional evidence or request a re-investigation short of
      filing a CFPB complaint or initiating litigation. CFPB supervision
      guidance on complaint management and the bureau's examination
      procedures for Regulation E both identify the availability of a
      meaningful reconsideration pathway as a consumer protection expectation;
      an institution that effectively treats a first-level denial as final
      without a documented reconsideration option is more likely to receive
      CFPB escalations that could have been resolved internally.`,
    keywords: ['dispute-reconsideration', 'CFPB-complaint-management', 'Reg-E-consumer-protection', 'fraud-denial-appeal', 'customer-dispute-rights'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2855',
    name: 'ACH Return Code Classification Errors Overstating Authorized-Transaction Rate',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital's ACH dispute processing function uses return code R10
      (unauthorized debit) only when the customer explicitly uses the word
      "unauthorized," applying R11 (return of erroneous debit) in ambiguous
      cases where the customer may have a valid unauthorized transaction claim,
      resulting in underutilization of R10 returns and overstated bank-level
      authorization rate metrics that mask the true volume of unauthorized
      ACH activity flowing through customer accounts. NACHA operating rules
      and the FFIEC's BSA examination manual both require accurate return
      code classification; systematic misclassification of unauthorized
      ACH returns also suppresses the SAR filing rate for ACH fraud patterns
      because the R11 classification does not trigger the unauthorized
      transaction SAR workflow.`,
    keywords: ['ACH-return-code', 'R10-classification', 'NACHA-operating-rules', 'unauthorized-ACH-fraud', 'SAR-filing-trigger'],
    demoRelevant: false,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2856',
    name: 'Zelle Fraud Recovery Rate Below Network Minimum Threshold',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      `First Capital's Zelle fraud recovery rate — the percentage of reported
      Zelle fraud transactions where the institution successfully recoups
      funds from the receiving institution — is 9%, compared to the Early
      Warning Services network minimum expectation of 15% and a peer institution
      average of 22%, primarily because the bank's fraud operations team does
      not initiate recovery requests within the optimal 24-hour window when
      funds are most likely still accessible in the receiving account. Early
      Warning Services participation requirements and CFPB examination focus
      on Zelle fraud recovery both create compliance and business risk for
      institutions with persistently below-threshold recovery rates; the
      low recovery rate also directly increases the bank's net fraud loss.`,
    keywords: ['Zelle-fraud-recovery', 'Early-Warning-Services', 'P2P-fraud-recovery', 'CFPB-Zelle-examination', 'recovery-rate-threshold'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2857',
    name: 'Provisional Credit Accounting Errors Creating Reg E Compliance Gaps',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      `First Capital's core banking system provisional credit posting workflow
      contains a configuration error that applies the provisional credit
      posting date as the start of the investigation period rather than the
      dispute receipt date, effectively extending the investigation period
      by up to three business days on disputes where the provisional credit
      is issued after the intake date, and creating Regulation E violations
      on cases where the investigation exceeds 45 days from dispute receipt
      but falls within 45 days from provisional credit posting. Regulation E
      Section 1005.11 measures all investigation deadlines from the date the
      institution receives the dispute; a system configuration that measures
      from a later date systematically produces Reg E violations on a
      calculable subset of disputes.`,
    keywords: ['provisional-credit-accounting', 'Reg-E-investigation-deadline', 'core-banking-configuration', 'CFPB-Reg-E-violation', 'dispute-receipt-date'],
    demoRelevant: false,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2858',
    name: 'Fraud Recovery Civil Litigation Tracking Not Integrated With SAR Records',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital does not link civil litigation records for fraud recovery
      actions to the corresponding SAR filings in its case management system,
      creating a compliance risk when a defendant's attorney subpoenas SAR
      records in civil discovery — which is prohibited under 31 U.S.C. 5318(g)
      — without the institution's legal team being immediately aware that the
      subpoenaed records are SAR materials requiring a DOJ tipping-off referral.
      FinCEN's SAR confidentiality requirements create affirmative legal
      obligations that require immediate response when SAR materials are
      sought through civil process; the absence of a SAR-litigation linkage
      in the case management system means the institution is structurally
      unable to identify and respond to improper SAR discovery requests
      before inadvertent disclosure occurs.`,
    keywords: ['SAR-civil-litigation', 'SAR-confidentiality', 'FinCEN-tipping-off', 'fraud-recovery-litigation', 'discovery-prohibition'],
    demoRelevant: false,
    subTopic: 'fraud-recovery-dispute',
  },
  {
    code: 'B2859',
    name: 'Fraud Loss Reporting to Board Excludes Near-Miss and Attempted Fraud Metrics',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      `First Capital's fraud loss reporting to the Board Risk Committee captures
      only confirmed fraud losses and charge-offs, excluding near-miss events
      where fraud was detected and prevented and attempted fraud metrics that
      provide leading indicators of emerging fraud typologies, giving the Board
      an incomplete picture of fraud risk exposure that systematically understates
      the threat environment and may lead to inadequate fraud program investment
      decisions. OCC and FDIC examination guidance on fraud risk management
      governance requires that board-level reporting include both realized losses
      and attempted fraud volume, and examiner feedback at peer institutions
      has specifically cited realized-loss-only board reporting as a governance
      gap that understates the true fraud risk exposure facing the institution.`,
    keywords: ['board-fraud-reporting', 'near-miss-fraud-metrics', 'attempted-fraud-volume', 'OCC-fraud-governance', 'risk-committee-reporting'],
    demoRelevant: true,
    subTopic: 'fraud-recovery-dispute',
  },

];
