// seed-banking-dom10-kyc-onboarding-part1.ts
// Banking genome patterns — Customer Onboarding & KYC
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
}

export const BANKING_KYC_ONBOARDING_PART1_PATTERNS: PatternSeed[] = [

  // ── CIP / KYC: USA PATRIOT Act CIP Program Gaps ──────────────────────────
  {
    code: 'B2800',
    name: 'CIP Program Documentary Verification Threshold Not Updated After Regulatory Guidance',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's Customer Identification Program under USA PATRIOT Act Section 326 requires documentary verification for all new account holders, but the acceptable document list was last reviewed in 2019 and does not incorporate FinCEN's 2023 updated guidance on acceptable government-issued identification formats for ITIN-holders and non-resident aliens opening business deposit accounts. When FinCEN examiners review the bank's CIP program during a BSA examination, they find that 12% of commercial account openings accepted expired foreign passports as primary identification without the secondary verification required by FinCEN's CDD Rule and the bank's own written CIP program, constituting a systemic CIP failure that triggers a Matters Requiring Attention in the bank's BSA/AML examination report.`,
    keywords: ['CIP', 'USA PATRIOT Act', 'FinCEN CDD Rule', 'BSA/AML', 'documentary verification'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2801',
    name: 'SSN Validation Logic Accepts ITINs Without Enhanced Scrutiny Flag',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's account opening platform validates taxpayer identification numbers against the IRS Individual Taxpayer Identification Number format (9XX-XX-XXXX) but does not apply enhanced scrutiny flags when an ITIN is submitted in place of a Social Security Number for a business deposit account owner, despite FinCEN guidance and OCC examination expectations that ITIN-associated accounts warrant additional CIP verification steps. The gap means that business owners using ITINs proceed through standard automated CIP without the secondary non-documentary verification — such as cross-referencing credit bureau records or third-party identity databases — that FinCEN's CDD Rule §1010.230 and the bank's own risk-based CIP written program require for accounts presenting elevated identification risk. OCC examiners reviewing 60 ITIN-associated business accounts during a BSA examination find that 38 lack the secondary verification documentation required by the bank's own program.`,
    keywords: ['CIP', 'ITIN', 'FinCEN CDD Rule', 'USA PATRIOT Act', 'BSA examination'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2802',
    name: 'Non-Documentary CIP Verification Sources Not Refreshed — Third-Party Database Stale',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's non-documentary CIP verification relies on a single third-party identity database whose data refresh cadence has slipped to quarterly updates, meaning the bank is verifying new account holder identities against records that can be up to 90 days stale at the time of account opening. FinCEN's CDD Rule and the USA PATRIOT Act's CIP requirements anticipate that non-documentary verification sources reflect current, accurate records; an identity database with a 90-day lag fails to detect recently fabricated synthetic identities or document-fraud schemes where stolen credentials were first used within the stale period. The OCC's BSA/AML examination handbook requires that banks evaluate the timeliness and reliability of non-documentary verification sources; using a demonstrably stale database without compensating controls is a written CIP program violation.`,
    keywords: ['CIP', 'non-documentary verification', 'USA PATRIOT Act', 'FinCEN CDD Rule', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2803',
    name: 'Beneficial Ownership Certification Form Not Updated for FinCEN 2024 BOI Reporting Rule',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's beneficial ownership certification form for legal entity customers was designed to meet FinCEN's 2018 CDD Rule §1010.230 requirements and has not been updated to align with FinCEN's 2024 Beneficial Ownership Information reporting rule, which requires collection of identifying information for all individuals owning 25% or more of a legal entity plus one controlling person. The 2024 BOI rule's enhanced reporting requirements mean that First Capital's existing form does not capture the government-issued identification document number, issuing jurisdiction, and image required for FinCEN's BOI registry filing; accounts opened after the rule's effective date using the legacy form create a compliance gap between the bank's CDD program and the FinCEN registry that OCC examiners will treat as a systemic BSA/AML deficiency.`,
    keywords: ['FinCEN CDD Rule', 'beneficial ownership', 'BOI reporting rule', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2804',
    name: 'CIP Risk Scoring Not Applied at Account Opening — Flat Procedure for All Customer Types',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital applies the same CIP documentary and non-documentary verification procedure to all new personal and business accounts regardless of account type, transaction profile, or customer risk indicators — treating a personal checking account for a salaried employee identically to a cash-intensive business account for an international money services business. FinCEN's risk-based approach to CIP, codified in its CDD Rule guidance and the OCC's BSA/AML examination handbook, requires that verification procedures be calibrated to the risk posed by the customer; a flat CIP procedure that does not escalate verification for high-risk account types allows money services businesses, foreign nationals, and cash-intensive retail businesses to complete CIP with the same minimal documentation as standard retail customers, creating a systematic risk-calibration failure that the bank's BSA compliance officer acknowledges has never been formally remediated.`,
    keywords: ['CIP', 'USA PATRIOT Act', 'FinCEN CDD Rule', 'risk-based approach', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2805',
    name: 'CIP Exception Log Not Reviewed by BSA Officer — Patterns of CIP Bypass Undetected',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      `First Capital's digital account opening platform logs CIP exceptions when an account is opened despite incomplete verification — expired documents, failed identity check, missing beneficial ownership certification — but the exception log is reviewed only quarterly by a junior BSA analyst rather than monthly by the BSA officer as the written CIP program requires. Over 18 months, the exception log shows 240 accounts opened with CIP deficiencies, including 14 accounts that share the same residential address, a pattern consistent with synthetic identity farming that monthly BSA officer review would have detected within the first 60 days. The OCC's BSA/AML examination handbook requires that CIP exception monitoring be timely and that patterns be escalated for suspicious activity review; the 18-month exception accumulation without escalation is a BSA program deficiency.`,
    keywords: ['CIP', 'BSA/AML', 'USA PATRIOT Act', 'exception management', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },

  // ── Enhanced Due Diligence ─────────────────────────────────────────────────
  {
    code: 'B2806',
    name: 'EDD Trigger Thresholds Not Recalibrated Since Initial BSA Program Implementation',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's BSA/AML program triggers enhanced due diligence for new commercial customers based on industry code and annual revenue thresholds set during the program's initial implementation in 2017 — thresholds that do not reflect FinCEN's 2021 national AML priorities, the 2022 Anti-Money Laundering Act amendments, or OCC guidance on elevated-risk business types including cannabis-adjacent businesses, cryptocurrency exchanges, and international remittance aggregators. The static EDD triggers cause high-risk business types introduced since 2017 to onboard through standard CDD without EDD, while some legacy trigger categories that FinCEN has de-prioritized still generate EDD requirements that consume compliance resources disproportionately. FinCEN's risk-based AML framework requires that institutions periodically reassess their risk triggers against current typologies; the bank's failure to update its EDD triggers since 2017 is a written program deficiency.`,
    keywords: ['EDD', 'FinCEN CDD Rule', 'BSA/AML', 'OCC examination', 'AML Act 2020'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2807',
    name: 'PEP Screening False-Positive Fatigue Causing Relationship Managers to Override Without Review',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's politically exposed person screening produces a false-positive rate of 65–70% on its commercial onboarding queue due to name-matching logic that does not apply phonetic normalization, name variant tables, or country-specific name ordering conventions; relationship managers process 30–40 PEP screening alerts per week and have developed an informal practice of overriding alerts without escalating to the BSA compliance team when the relationship manager believes the match is a false positive. FinCEN's CDD Rule and OCC BSA examination guidance require that PEP screening results be reviewed by qualified BSA personnel before override decisions are documented; the undocumented practice of relationship manager-level override — without BSA review — means that genuine PEP matches can be cleared during onboarding without the enhanced due diligence, senior management approval, and ongoing monitoring that FinCEN guidance requires.`,
    keywords: ['PEP screening', 'EDD', 'FinCEN CDD Rule', 'BSA/AML', 'false positive fatigue'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2808',
    name: 'Adverse Media Screening Coverage Gaps — Non-English Sources and Regional Publications Excluded',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's adverse media screening for EDD customers relies on a vendor tool that ingests English-language national and international news sources but does not cover regional Spanish-language publications, local court records, or non-English Eastern European and Latin American press — precisely the source categories most relevant for First Capital's commercial customer base in its market footprint. FinCEN's 2021 AML national priorities and OCC supervisory guidance on AML program effectiveness require that adverse media screening be comprehensive and calibrated to the geographic and linguistic profile of the bank's customer risk population; a tool that systematically excludes the languages and publications most likely to contain adverse information about the bank's highest-risk customer segments produces a false sense of compliance without substantive coverage. Two EDD subjects cleared through adverse media screening were later the subject of FinCEN geographic targeting orders whose underlying press coverage appeared only in excluded regional publications.`,
    keywords: ['adverse media screening', 'EDD', 'FinCEN CDD Rule', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2809',
    name: 'Source-of-Funds Documentation for EDD Customers Accepted Without Independent Corroboration',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's EDD process for high-risk commercial customers requires source-of-funds documentation, but the compliance team accepts self-certified source-of-funds declarations — letters from the customer stating the origin of funds — without independent corroboration through third-party documentation such as audited financial statements, tax returns, real estate transaction records, or business registration filings. FinCEN's CDD Rule guidance and the OCC's BSA/AML examination handbook describe source-of-funds documentation as a cornerstone of EDD for customers with elevated ML risk; accepting unverified self-certification without corroboration is not consistent with an effective EDD program, particularly for First Capital's commercial customers in high-risk business segments where the purpose and origin of large initial deposits cannot be verified from the declaration alone.`,
    keywords: ['EDD', 'source-of-funds', 'FinCEN CDD Rule', 'BSA/AML', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2810',
    name: 'EDD Renewal Cadence for High-Risk Accounts Defaults to Annual Regardless of Activity Level',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's EDD program requires annual renewal for all customers designated as high-risk at onboarding, regardless of the customer's actual transaction activity, changes in ownership or control, or the emergence of new adverse information since the last review. FinCEN's risk-based AML framework and OCC examination guidance anticipate that high-risk customer re-review cadence be calibrated to the customer's activity level and risk profile — a cash-intensive international money services business generating $10M per month in transactions warrants more frequent review than a dormant high-risk account with minimal activity. The flat annual cadence means First Capital is spending EDD renewal resources on dormant high-risk accounts while potentially missing significant changes in the activity and risk profile of active high-risk customers that would require accelerated re-review under a properly calibrated program.`,
    keywords: ['EDD', 'FinCEN CDD Rule', 'BSA/AML', 'ongoing monitoring', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2811',
    name: 'Negative News AI Screening Without Source Credibility Weighting — Low-Quality Alerts Dominate',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an NLP adverse media screening AI that crawls web sources and social media platforms to identify negative news about EDD customers; the AI does not apply source credibility weighting, treating a user-generated social media post identically to a FinCEN enforcement action or a Reuters investigative article, flooding BSA analysts with low-quality alerts from unreliable sources while potentially missing high-confidence adverse information from authoritative but infrequently indexed regulatory sources. OCC supervisory guidance and FinCEN's risk-based AML framework require that adverse media screening be evaluated for effectiveness, which includes assessing whether the alert population is dominated by actionable, high-credibility information; an AI tool that generates 80% of its alert volume from social media commentary without a credibility filter reduces analyst effectiveness and creates a BSA program quality deficiency that OCC examiners identify when reviewing the adverse media alert audit log.`,
    keywords: ['NLP adverse media AI', 'FinCEN CDD Rule', 'BSA/AML', 'source credibility', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },

  // ── Ongoing Monitoring ─────────────────────────────────────────────────────
  {
    code: 'B2812',
    name: 'Periodic KYC Review Cadence 14 Months Behind — Tier 2 Customers in Review Backlog',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's CDD Rule periodic re-review program is current for Tier 1 customers — those with the highest BSA risk score — but Tier 2 customers, representing approximately 8,400 commercial accounts with moderate-risk ratings, have accumulated a 14-month backlog in scheduled re-reviews due to insufficient BSA analyst capacity after two rounds of workforce reduction. FinCEN's CDD Rule §1010.230 requires that banks maintain current and accurate customer due diligence information, which the CFPB and OCC have interpreted to require a periodic refresh cadence that ensures the bank is not operating on stale risk ratings; the 14-month backlog means that First Capital cannot represent to examiners that its CDD information is current for the Tier 2 population, and the backlog is the specific KYC deficiency referenced in OCC examination correspondence as a Matters Requiring Immediate Attention.`,
    keywords: ['FinCEN CDD Rule', 'periodic KYC review', 'BSA/AML', 'OCC examination', 'CFPB'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2813',
    name: 'Transaction Monitoring Threshold Parameters Not Recalibrated in Three Years — STR Rate Below Peer',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's transaction monitoring system alert thresholds for structuring, unusual cash activity, and rapid fund movement were set during system implementation in 2021 and have not been recalibrated against current transaction volumes, peer STR filing rates, or FinCEN's 2024–2026 national AML priorities. The bank's suspicious transaction report filing rate has declined from 95th percentile to below the 50th percentile of peer STR volume over the same period — a pattern FinCEN's national AML priorities identify as a red flag for systematic threshold miscalibration rather than genuine improvement in customer risk quality. OCC BSA examination guidance and FinCEN's 2020 BSA/AML examination manual both identify static, unvalidated transaction monitoring thresholds as a foundational program deficiency requiring self-disclosure and remediation before the next examination cycle.`,
    keywords: ['transaction monitoring', 'FinCEN', 'BSA/AML', 'STR filing', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2814',
    name: 'Customer Risk Rating Not Recalibrated After Account Activity Materially Changes Profile',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital assigns a BSA customer risk rating at onboarding and updates it only during scheduled periodic reviews, without a real-time or near-real-time mechanism to escalate the risk rating when a customer's actual transaction activity diverges significantly from the expected activity profile captured at onboarding. When a commercial account categorized as low-risk at onboarding begins receiving wire transfers from jurisdictions on FinCEN geographic targeting orders and structuring cash deposits below reporting thresholds, the customer's risk rating remains low until the next scheduled periodic review — which under the Tier 2 backlog described in the bank's BSA examination findings may be 14 months away. FinCEN's risk-based CDD framework and OCC BSA guidance require activity-triggered risk rating updates as a component of an effective ongoing monitoring program.`,
    keywords: ['customer risk rating', 'FinCEN CDD Rule', 'ongoing monitoring', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2815',
    name: 'CDD Refresh Workflow Does Not Re-Screen for PEP or Sanctions Changes Since Onboarding',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's periodic CDD refresh process for commercial accounts updates financial profile and beneficial ownership information but does not automatically re-run PEP screening or OFAC sanctions screening against current lists at the time of refresh, relying instead on real-time event-based screening at a separate periodic cadence. The decoupled screening cadence means a customer who was not a PEP at onboarding but subsequently became a government official, or a beneficial owner who appeared on OFAC's SDN list after initial onboarding, is not captured in the CDD refresh process — a gap that OFAC compliance guidance and FinCEN's CDD Rule both address by requiring that screening be current at the time of each CDD review. An OCC examination finds three accounts where a beneficial owner appeared on a FinCEN geographic targeting order list between the last PEP screen and the CDD refresh date.`,
    keywords: ['FinCEN CDD Rule', 'PEP screening', 'OFAC', 'ongoing monitoring', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2816',
    name: 'AI Transaction Monitoring Drift Not Detected — Alert Suppression Increases Over 18 Months',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital deploys an AI-enhanced transaction monitoring system that uses ML to suppress low-probability alerts before they reach BSA analyst queues; over 18 months, the model's suppression rate increases from 30% to 62% of generated alerts, driven by model drift as the AI learns from analyst closure decisions that were themselves influenced by workload pressure rather than genuine risk assessment. OCC BSA examination guidance and FinCEN's model risk management expectations for AML tools require that transaction monitoring models be validated and monitored for performance drift; the bank's vendor does not provide a model performance monitoring dashboard, and the BSA officer has no visibility into the suppression rate trend — a blind spot that means the bank does not know whether the AI is suppressing genuine suspicious activity as well as true false positives.`,
    keywords: ['AI transaction monitoring', 'FinCEN', 'BSA/AML', 'model drift', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2817',
    name: 'Periodic Review Automation AI Closes Accounts Without Human Review of Risk-Elevated Flags',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI-assisted periodic CDD review platform that auto-closes periodic reviews for accounts classified as low-or-medium risk when no adverse flags are detected in the automated screening; the auto-closure logic is triggered without a human review step even when the account has had activity-based risk escalation flags in the prior 12 months that a human reviewer would recognize as inconsistent with a low-risk rating. FinCEN's CDD Rule and OCC BSA supervisory guidance require that periodic reviews for accounts showing anomalous activity involve human judgment, not automated closure; the AI's auto-closure of reviews for activity-flagged accounts eliminates the human escalation step that is the primary mechanism for catching customers whose activity profile has evolved beyond the original risk rating.`,
    keywords: ['CDD periodic review AI', 'FinCEN CDD Rule', 'BSA/AML', 'human-in-loop', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },

  // ── Digital Identity ───────────────────────────────────────────────────────
  {
    code: 'B2818',
    name: 'eKYC Liveness Detection Bypass Exploited via Deepfake Video — Identity Fraud Undetected',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's digital account opening process uses a biometric liveness detection vendor for eKYC identity proofing; the vendor's liveness check was designed to detect pre-recorded video replay attacks but has not been updated to detect deepfake-generated synthetic video, which can now be produced in near-real-time using consumer-grade AI tools. NIST SP 800-63B identity assurance level requirements and OCC guidance on digital identity proofing require that liveness detection meet the technical standards appropriate for the assurance level claimed; a liveness check that cannot detect AI-generated deepfakes does not meet the NIST 800-63B IAL2 standard, exposing First Capital to identity fraud losses and a CIP program compliance gap when the deepfake-bypassed identity check fails to satisfy USA PATRIOT Act verification requirements.`,
    keywords: ['eKYC', 'NIST 800-63', 'liveness detection', 'deepfake', 'USA PATRIOT Act'],
    demoRelevant: true,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2819',
    name: 'Document Fraud Detection AI Not Trained on Current Synthetic Document Typologies',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's eKYC document verification AI was trained on identity document fraud typologies current as of 2022 and has not been retrained to detect 2024–2025 high-resolution printer-produced synthetic identity documents that replicate modern security features including UV-reactive ink simulation and microprint layering visible to consumer-grade cameras. NIST SP 800-63A identity proofing guidance and OCC BSA/AML examination expectations require that automated identity verification tools be evaluated for ongoing accuracy against current fraud typologies; the bank's vendor contract does not include a retraining or model update SLA, meaning the document fraud AI is operating on a training corpus that is 2–3 generations behind the synthetic document technology it is designed to detect.`,
    keywords: ['eKYC', 'NIST 800-63', 'document fraud AI', 'USA PATRIOT Act', 'CIP'],
    demoRelevant: true,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2820',
    name: 'Digital Identity Wallet Interoperability Gap — NIST 800-63 Credentials Not Accepted',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      `First Capital's digital account opening platform does not accept NIST SP 800-63-3 compliant digital identity credentials issued by state DMVs, federal identity providers, or commercial identity wallet providers such as Login.gov, leaving customers who have invested in high-assurance digital identity credentials unable to use them for bank account opening and forcing them through a secondary manual identity proofing flow. OCC technology guidance and emerging FinCEN digital identity guidance anticipate that banks develop interoperability with standards-compliant digital identity infrastructure; the absence of wallet interoperability increases manual verification costs, creates a friction-based abandonment rate in digital onboarding estimated at 18–22%, and positions First Capital behind digital-native bank competitors who have already deployed NIST 800-63 credential acceptance in their account opening flows.`,
    keywords: ['NIST 800-63', 'digital identity wallet', 'eKYC', 'OCC guidance', 'CIP'],
    demoRelevant: false,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2821',
    name: 'AI Identity Verification Not Registered as SR 11-7 Model — OCC Model Risk Finding',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital uses a third-party AI identity verification platform for digital account opening that applies ML to compare selfie photographs against government-issued ID document photographs and assign a match confidence score that the bank uses to approve or reject CIP completion; the platform is not registered in the bank's SR 11-7 model inventory on the basis that it is a "vendor technology tool" rather than a bank-developed model. OCC 2011-12 and SR 11-7 define any algorithm producing quantitative output used in risk management or customer-facing decisions — including CIP pass/fail determinations — as a model requiring registration, validation, and ongoing performance monitoring; the OCC's technology examination team, reviewing the bank's digital onboarding controls, finds the unregistered AI identity verification tool and issues a Matters Requiring Attention requiring its inclusion in the model inventory and retrospective validation under the consent order MRM milestone.`,
    keywords: ['AI identity verification', 'SR 11-7', 'OCC 2011-12', 'CIP', 'model inventory'],
    demoRelevant: true,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2822',
    name: 'Biometric Consent Collection Absent From Digital Onboarding Flow — BIPA Exposure',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      `First Capital's eKYC digital onboarding flow collects a facial biometric scan for liveness detection and selfie-to-ID matching without displaying a biometric data consent notice to the customer or retaining a signed consent record, exposing the bank to liability under Illinois BIPA and similar state biometric privacy statutes that require prior written notice and consent before collecting biometric identifiers. OCC guidance on consumer protection and privacy requires that digital onboarding flows comply with all applicable state privacy statutes; in First Capital's Illinois market, the absence of BIPA-compliant biometric consent creates a class action exposure that counsel has estimated at $5,000 per violation per person — a liability that could exceed $50M for the digital account opening cohort absent remediation. The biometric consent gap was identified in an internal privacy audit but not remediated before the eKYC vendor launch.`,
    keywords: ['eKYC', 'BIPA', 'biometric consent', 'NIST 800-63', 'OCC guidance'],
    demoRelevant: false,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2823',
    name: 'eKYC Vendor Model Accuracy Not Tested on Bank-Specific Customer Demographics',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital procures an eKYC facial recognition model from a vendor whose published accuracy benchmarks were measured on a broad population dataset; the bank does not require the vendor to demonstrate accuracy performance on a test population representative of First Capital's customer demographics, which includes a disproportionate share of customers over 65, Hispanic customers with limited English-language ID documents, and recent immigrants with non-standard document formats. NIST SP 800-63A identity proofing guidance and OCC fair lending supervisory expectations require that identity verification systems be evaluated for equitable performance across customer demographic groups; a model whose accuracy degrades for elderly or minority customers produces a discriminatory rejection rate that creates ECOA and Reg B exposure and triggers regulatory scrutiny when fair lending examiners analyze eKYC completion rates by demographic group.`,
    keywords: ['eKYC', 'NIST 800-63', 'ECOA', 'fair lending', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'digital-identity',
  },

  // ── Commercial Onboarding ──────────────────────────────────────────────────
  {
    code: 'B2824',
    name: 'Complex Ownership Structure Entity Resolution Fails for Multilayer LLC Chains',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's commercial onboarding workflow requires beneficial ownership disclosure for legal entity customers under FinCEN CDD Rule §1010.230, but the bank's entity resolution tooling cannot automatically trace ownership through more than two layers of holding entities — leaving multi-tier LLC ownership structures, common in private equity-backed commercial customers, resolved only to the immediate parent entity rather than to the natural person beneficial owners who own 25% or more of the ultimate operating entity. FinCEN's CDD Rule explicitly requires identification of natural person beneficial owners regardless of the number of ownership layers; when OCC examiners review 15 complex commercial accounts opened in the past 12 months, they find that 9 were cleared at the holding company level without beneficial ownership documentation for the underlying individuals, constituting a systemic CDD Rule compliance failure.`,
    keywords: ['beneficial ownership', 'FinCEN CDD Rule', 'entity resolution', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2825',
    name: 'UBO Registration Gap — FinCEN 2024 BOI Rule Beneficial Owners Not Verified Against Registry',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's commercial onboarding CDD program requires collection of beneficial ownership information but does not include a step to verify the information provided by the customer against FinCEN's 2024 Beneficial Ownership Information registry, which became available for financial institution access in early 2024. FinCEN guidance on the BOI access rule explicitly encourages financial institutions to use the registry as a secondary verification source when beneficial ownership information provided by a customer is inconsistent with publicly available information; the bank's failure to integrate the BOI registry into its commercial onboarding workflow means it is forgoing a verification resource that FinCEN has specifically designed to help banks detect beneficial ownership misrepresentation — a gap that OCC examiners note in the next BSA examination as an opportunity to strengthen the CDD program.`,
    keywords: ['beneficial ownership', 'FinCEN BOI', 'FinCEN CDD Rule', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2826',
    name: 'LEI Validation Not Performed for Commercial Entities — Legal Entity Identifier Gap',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's commercial onboarding workflow for correspondent banking and large commercial customers does not require Legal Entity Identifier validation against the GLEIF global LEI registry, even though LEI data provides a standardized, externally verified source of entity legal name, jurisdiction, registration status, and ultimate parent information that would significantly strengthen the bank's CDD entity verification for complex commercial customers. OCC guidance on commercial banking due diligence and BCBS 239 data quality principles support the use of standardized entity identifiers for counterparty data validation; the absence of LEI validation means First Capital cannot confirm that the legal name and registered address provided by commercial customers matches their official regulatory registration, creating an entity identity verification gap that a geographically diverse commercial book exacerbates. Two commercial accounts in the bank's correspondent portfolio show LEI registration details inconsistent with the entity information in the bank's CDD records.`,
    keywords: ['LEI validation', 'GLEIF', 'FinCEN CDD Rule', 'commercial onboarding', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2827',
    name: 'Commercial Account Opening SLA Pressure Causes CDD Completion to Follow Account Funding',
    officeCategory: 'front_office',
    failureRatePct: 78,
    description:
      `First Capital's commercial banking relationship managers are measured on days-to-open for new business accounts and have developed a practice of opening and funding commercial accounts before CDD documentation is fully complete — justifying the sequencing as commercially necessary when a relationship manager is competing for a client against digital-native business banking competitors. FinCEN's CDD Rule and OCC BSA examination expectations require that CDD be completed at account opening, not after; funding a commercial account before beneficial ownership certification, entity verification, and initial risk rating are complete means the bank is conducting transactions without a current, complete CDD file — a violation of the written CDD program that creates immediate STR risk if the early transactions show suspicious patterns.`,
    keywords: ['FinCEN CDD Rule', 'commercial onboarding', 'BSA/AML', 'OCC examination', 'account opening'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2828',
    name: 'AI Beneficial Ownership Mapping Without Legal Validation — Automated UBO Graph Errors',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI beneficial ownership mapping tool that ingests entity documents, operating agreements, and secretary of state filings to automatically construct a UBO ownership graph and identify natural persons meeting the FinCEN 25% beneficial ownership threshold; the AI-generated ownership graph is accepted as the basis for CDD documentation without independent legal review of whether the automated percentage calculations correctly account for indirect ownership, option rights, and voting trust arrangements. FinCEN's CDD Rule §1010.230 and OCC BSA guidance require that beneficial ownership identification be accurate and legally defensible; an AI-generated UBO graph that systematically misclassifies indirect ownership percentages or ignores voting trust arrangements will produce a CDD file that misrepresents the legal ownership structure, creating a regulatory compliance deficiency and a SAR risk if the misidentified beneficial owner is a sanctioned person.`,
    keywords: ['AI beneficial ownership mapping', 'FinCEN CDD Rule', 'BSA/AML', 'OCC examination', 'legal validation'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2829',
    name: 'Commercial Onboarding Intake Form Not Designed for Non-US Entity Legal Structures',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's commercial account onboarding intake form was designed for US domestic legal entity structures — C-corporations, LLCs, partnerships, and sole proprietorships — and does not accommodate international entity types such as GmbH, Société Anonyme, Aktiengesellschaft, or foreign trust structures, requiring relationship managers to manually note the entity type in a free-text field rather than mapping it to a standardized classification. FinCEN's CDD Rule requires consistent documentation of legal entity structure as part of the customer due diligence file; inconsistent entity type recording makes it impossible for BSA analysts to systematically screen the commercial customer population for entity structure risk factors — such as private foundations, anstalt structures, or nominee shareholders common in high-risk offshore jurisdictions — creating a CDD program data quality gap.`,
    keywords: ['FinCEN CDD Rule', 'commercial onboarding', 'BSA/AML', 'entity type', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2830',
    name: 'Commercial Onboarding Expected Activity Baseline Not Captured — Transaction Monitoring Threshold Mis-Set',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial account onboarding process does not systematically capture and document the customer's expected transaction activity profile — anticipated monthly cash volumes, wire origination frequency, international wire corridors, and payroll processing volumes — at the time of account opening, leaving the transaction monitoring system without a customer-specific activity baseline to compare against actual transaction behavior. FinCEN's CDD Rule and OCC BSA examination guidance require that banks establish expected activity profiles for commercial customers as the basis for effective ongoing monitoring; the absence of account-level expected activity baselines means that First Capital's transaction monitoring system applies generic industry-code thresholds rather than customer-specific anomaly detection, reducing the program's ability to identify the deviation from expected behavior that is the primary signal for suspicious activity.`,
    keywords: ['FinCEN CDD Rule', 'transaction monitoring', 'BSA/AML', 'commercial onboarding', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },

  // ── AI / KYC AI Patterns ───────────────────────────────────────────────────
  {
    code: 'B2831',
    name: 'AI KYC Identity Verification Without OCC Model Risk Governance — Consent Order Risk',
    officeCategory: 'front_office',
    failureRatePct: 79,
    description:
      `First Capital deploys an AI identity verification platform from a fintech vendor for its digital account opening channel; the platform uses ML to match selfie images to ID documents, assess document authenticity, and generate a CIP completion confidence score. The model is not in the bank's SR 11-7 model inventory, has not been independently validated by the bank's IVU, and lacks performance monitoring against realized identity fraud loss rates — conditions that the bank's MRM consent order explicitly addresses by requiring all AI tools used in customer onboarding decisions to be in the validated model inventory by the consent order's Q3 2025 milestone. OCC model risk examiners reviewing the digital channel find the unregistered AI KYC tool and issue a new Matters Requiring Immediate Attention that pauses the bank's consent order remediation progress on the MRM milestone.`,
    keywords: ['AI KYC identity verification', 'SR 11-7', 'OCC 2011-12', 'consent order', 'model inventory'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2832',
    name: 'LLM SAR Narrative Drafting Without CAMS Compliance Review — Narrative Quality Deficiencies',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's BSA operations team uses an LLM tool to draft SAR narrative language from structured alert data — transaction summaries, account relationships, and red flag codes — allowing a single BSA analyst to complete SAR narratives in 20 minutes rather than the 90-minute manual drafting process. The LLM-drafted narratives are submitted without review by a CAMS-certified analyst who could evaluate whether the narrative meets FinCEN's SAR filing guidance on specificity, corroboration, and completeness requirements; when FinCEN's SAR quality team samples the bank's recent filings, they find that LLM-generated narratives systematically omit specific transaction dates, dollar amounts, and correspondent banking identifiers that FinCEN guidance requires, reducing the law enforcement utility of the filings and triggering a written SAR quality feedback letter.`,
    keywords: ['LLM SAR narrative', 'FinCEN', 'BSA/AML', 'CAMS compliance', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2833',
    name: 'AI Risk Scoring for EDD Triggering Without Human-in-Loop — High-Risk Customers Auto-Cleared',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an ML risk scoring model that generates a customer risk score at onboarding and uses that score to automatically determine whether a new commercial customer triggers EDD or is cleared at the standard CDD level; customers scoring below the EDD threshold are cleared through automated CDD processing without a human review step, even when secondary screening shows potential adverse media or geographic risk factor flags. FinCEN's risk-based AML framework and OCC BSA examination guidance require that EDD triggering decisions for commercial customers involve human judgment, particularly when automated screening flags indicate elevated risk; an automated clearing pipeline that proceeds past adverse flags without human review eliminates the compliance officer judgment that is the essential backstop of a risk-based AML program. When a FinCEN geographic targeting order is later issued naming one of the auto-cleared customers, the absence of a human review record creates a defensibility gap.`,
    keywords: ['AI risk scoring EDD', 'FinCEN CDD Rule', 'BSA/AML', 'human-in-loop', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2834',
    name: 'NLP Adverse Media AI Without Source Credibility Scoring — Regulatory Sources Underweighted',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's NLP adverse media screening system assigns equal relevance scores to all matched sources regardless of whether the source is a FinCEN enforcement action, an OFAC designation, an SEC complaint, a mainstream news article, or a social media post — causing low-credibility sources to generate the majority of analyst alerts while high-authority regulatory enforcement content is buried in the alert queue by volume. FinCEN guidance on BSA/AML program effectiveness and OCC examination expectations for AML alert quality require that adverse media programs prioritize regulatory enforcement sources over social media and unverified web content; an NLP system that systematically underweights FinCEN enforcement notices and OFAC designation updates relative to social media noise fails to meet the program quality standard that examiners apply when evaluating the alert disposition record for patterns of missed regulatory enforcement coverage.`,
    keywords: ['NLP adverse media AI', 'FinCEN', 'OFAC', 'BSA/AML', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2835',
    name: 'Automated Beneficial Ownership AI Mapping Not Legally Validated — UBO Misidentification Risk',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital uses an AI platform to automatically construct beneficial ownership graphs from entity documents, mapping ownership percentages across multi-tier holding structures and identifying persons meeting the FinCEN 25% UBO threshold; the automated mapping output is reviewed by a BSA analyst but not validated by legal counsel, meaning ownership structures involving convertible instruments, pledged interests, or trust voting arrangements — which require legal interpretation to correctly attribute percentage ownership — are classified based on AI pattern-matching rather than defensible legal analysis. FinCEN's CDD Rule §1010.230 and its beneficial ownership FAQ guidance make clear that percentage ownership calculations must correctly account for indirect ownership and control relationships; when an auto-cleared ownership structure is later found to have misclassified a convertible note holder as a non-controlling 18% owner who was in fact a 35% UBO, the CDD file lacks a legally defensible ownership determination.`,
    keywords: ['AI beneficial ownership', 'FinCEN CDD Rule', 'BSA/AML', 'legal validation', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2836',
    name: 'GenAI KYC Document Summary Tool Hallucinating Entity Details — CDD File Accuracy Risk',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's commercial onboarding team uses a GenAI document summarization tool to extract key information from entity formation documents, operating agreements, and CDD questionnaires into a structured CDD profile; the tool has been documented by the bank's quality control team to occasionally hallucinate entity details — fabricating state of formation, registered agent addresses, or incorporation dates that do not appear in the source documents. FinCEN's CDD Rule and OCC BSA examination guidance require that CDD information be accurate and traceable to source documentation; GenAI-generated CDD profiles containing hallucinated entity details fail both requirements and create a documentation integrity risk that compounds the bank's MRM consent order obligations by introducing AI-generated inaccuracies into regulatory compliance records without a human attestation step confirming accuracy against source documents.`,
    keywords: ['GenAI KYC', 'FinCEN CDD Rule', 'SR 11-7', 'hallucination risk', 'BSA/AML'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2837',
    name: 'AI PEP Screening Model Not Retrained for New High-Risk Jurisdiction Classification — Coverage Gap',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI PEP screening model was trained on a political exposure typology database current as of 2022; the model has not been updated to include senior government officials from jurisdictions newly added to FinCEN's heightened scrutiny list or the FATF grey list in 2023–2025, meaning persons who became PEPs through appointment to government roles in newly designated high-risk jurisdictions are not flagged during commercial onboarding screening. OCC BSA examination guidance and FinCEN's risk-based CDD framework require that PEP screening be current with FinCEN's geographic risk classifications and the FATF grey and blacklist; a PEP screening model that has not been retrained since 2022 is operating on a coverage definition that is at least two FATF cycles and three FinCEN designation periods behind current standards, creating systematic coverage gaps for exactly the high-risk customer profiles EDD is designed to capture.`,
    keywords: ['AI PEP screening', 'FinCEN CDD Rule', 'FATF', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2838',
    name: 'AI KYC Risk Score Vendor Black Box — No Explainability for BSA Officer Decision Support',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital uses a third-party AI KYC risk scoring platform that generates a composite customer risk score used to determine CDD tier at account opening; the vendor does not expose the scoring logic or factor weights, classifying the methodology as proprietary, which means First Capital's BSA officers cannot explain why a specific customer received a high-risk score or challenge whether the score accurately reflects the bank's risk appetite calibration for its specific customer base. OCC supervisory guidance on vendor model risk and FinCEN's expectations for effective AML programs require that financial institutions understand and be able to explain the risk assessments underlying their CDD determinations; a black-box vendor risk score that BSA officers cannot explain does not meet SR 11-7 model documentation requirements and creates a defensibility gap when the bank must explain to OCC examiners why specific customers were or were not subjected to EDD.`,
    keywords: ['AI KYC risk score', 'SR 11-7', 'FinCEN CDD Rule', 'BSA/AML', 'model explainability'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2839',
    name: 'ML Customer Risk Rating Without SR 11-7 Validation — AML Program Integrity Risk',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's BSA compliance team licenses an ML customer risk rating model from a regtech vendor that automatically assigns low, medium, or high BSA risk ratings to all new commercial customers based on industry code, geographic profile, transaction history analogs, and beneficial ownership data; the model is not in the bank's SR 11-7 model inventory and has not been validated against the bank's own customer population or tested for calibration accuracy relative to realized SAR rates. SR 11-7 and OCC 2011-12 require that any quantitative tool producing a rating used in risk management decisions be subject to model governance regardless of whether it is developed internally or procured from a vendor; a vendor-supplied ML risk rating model that operates outside the bank's model inventory means the BSA program's foundational risk-tiering decision is made by an unvalidated black box — a finding that OCC examiners treat as a systemic BSA program deficiency.`,
    keywords: ['ML customer risk rating', 'SR 11-7', 'FinCEN CDD Rule', 'BSA/AML', 'OCC 2011-12'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2840',
    name: 'AI Adverse Media Classification Bias Against Domestic Minority-Owned Businesses',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's AI adverse media screening model for commercial onboarding was trained on adverse media examples drawn from enforcement databases that over-represent certain business sectors and owner demographics as adverse media subjects; as a result, the model generates disproportionately high adverse media match rates for minority-owned businesses in certain industries, triggering EDD workflows for customers who have no actual adverse information and creating a de facto disparate impact in the EDD triggering process. ECOA Reg B and OCC fair lending supervisory guidance apply to AI tools that influence access to banking services, including adverse media screening models that affect whether a customer receives standard CDD or elevated EDD scrutiny; a biased adverse media AI that generates systematically higher EDD trigger rates for minority-owned businesses creates a CFPB examination risk and undermines the bank's CRA and fair lending program objectives.`,
    keywords: ['AI adverse media', 'ECOA', 'FinCEN CDD Rule', 'fair lending', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2841',
    name: 'AI-Automated SAR Decision Tool Without CAMS Human Review — Filing Quality Deficiencies',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI tool that recommends SAR filing or no-file decisions for BSA alert dispositions, with BSA analysts authorized to accept AI no-file recommendations without escalation to a CAMS-certified compliance officer for a secondary review. FinCEN's SAR filing guidance and the OCC BSA examination manual require that no-file decisions be documented with a rationale subject to supervisory review; when OCC examiners sample 50 AI-recommended no-file decisions, they find that 14 involved transaction patterns matching known FinCEN typologies for structuring and layering that a trained CAMS analyst would have filed — representing a systematic suppression of SAR filings attributable to over-reliance on AI no-file recommendations without human-in-loop review.`,
    keywords: ['AI SAR decision', 'FinCEN', 'BSA/AML', 'CAMS', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2842',
    name: 'LLM Onboarding Questionnaire Assistant Produces Inconsistent CDD Responses Across Customers',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital deploys an LLM-powered onboarding assistant that guides commercial customers through the CDD questionnaire, interpreting customer responses and populating structured CDD fields; the LLM interprets similar customer responses differently depending on phrasing, producing structurally inconsistent beneficial ownership disclosures and expected activity descriptions across the CDD population that BSA analysts cannot systematically compare. FinCEN's CDD Rule requires that beneficial ownership certification information be consistent, accurate, and comparable across the customer population; LLM-mediated CDD data collection that introduces response variability as a function of natural language interpretation rather than substantive differences between customers produces a CDD database whose quality cannot be systematically assessed, audited, or used to calibrate transaction monitoring thresholds.`,
    keywords: ['LLM onboarding assistant', 'FinCEN CDD Rule', 'BSA/AML', 'CDD data quality', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2843',
    name: 'AI Entity Resolution Tool Merging Distinct Legal Entities — Shared KYC Profile Risk',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital uses an AI entity resolution platform to link commercial CDD records across product lines and channels, merging records for entities the AI determines to be the same legal person based on name similarity, address overlap, and beneficial ownership data; the platform has been found to incorrectly merge legally distinct entities that share a beneficial owner but are separate legal persons — causing CDD profiles, transaction monitoring histories, and risk ratings to be pooled across entities whose risk should be assessed separately. FinCEN's CDD Rule requires a legal entity-level customer due diligence program; merging CDD profiles for distinct legal entities creates a program deficiency where adverse information, suspicious activity, or risk flags associated with one entity contaminate or are hidden within the merged profile of a distinct legal person, distorting both ongoing monitoring and SAR decision-making.`,
    keywords: ['AI entity resolution', 'FinCEN CDD Rule', 'BSA/AML', 'SR 11-7', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },

  // ── Additional CIP / KYC Patterns ─────────────────────────────────────────
  {
    code: 'B2844',
    name: 'CIP Written Program Not Updated After AML Act 2020 Amendments',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      `First Capital's written CIP program under USA PATRIOT Act Section 326 has not been formally amended to incorporate requirements and risk priorities introduced by the Anti-Money Laundering Act of 2020, including expanded beneficial ownership scope, new priorities for crypto-asset and digital asset account types, and enhanced whistleblower and SAR confidentiality provisions. OCC BSA examination guidance requires that written BSA/AML programs be current with applicable law and regulatory guidance; a written CIP program that predates the AML Act 2020 creates a documentation gap between the bank's legal obligations and its written program requirements, exposing the bank to examination findings that the program does not reflect the current legal framework — particularly relevant for First Capital given that the bank's BSA program is already under OCC scrutiny related to prior examination findings.`,
    keywords: ['CIP', 'AML Act 2020', 'USA PATRIOT Act', 'BSA/AML', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2845',
    name: 'CIP Reliance Agreement With Introducing Broker Not Reviewed for Three Years',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      `First Capital relies on an introducing broker-dealer's CIP for joint customers referred through a banking-and-brokerage partnership, using a CIP reliance agreement under 31 CFR 1020.220(a)(6) that was executed in 2021 and has not been reviewed or renewed since; the agreement does not address digital onboarding channels, mobile deposit customers, or the broker-dealer's reliance on third-party eKYC vendors that the bank has not evaluated. FinCEN's CIP rule allows reliance on another institution's CIP provided the reliance agreement is current and the relying institution has a reasonable basis to conclude the other institution has an anti-money laundering program; the three-year-old agreement — which does not cover the broker-dealer's current eKYC and digital identity infrastructure — no longer provides a defensible basis for CIP reliance, creating a BSA compliance gap for the joint customer population.`,
    keywords: ['CIP', 'USA PATRIOT Act', 'FinCEN', 'BSA/AML', 'reliance agreement'],
    demoRelevant: false,
    subTopic: 'cip-kyc',
  },
  {
    code: 'B2846',
    name: 'Synthetic Identity Cluster Detection Absent From CIP Analytics — Pattern Undetected for 6 Months',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's CIP analytics do not include clustering analysis to detect synthetic identity indicators — shared addresses across multiple account holders, shared phone numbers or email addresses across unrelated accounts, ITIN patterns associated with recently issued numbers used immediately for business account openings — that would identify coordinated synthetic identity fraud at the portfolio level rather than on individual account screens. FinCEN typology guidance on synthetic identity fraud and OCC BSA examination expectations for CIP program effectiveness identify clustering analysis as a critical control for detecting synthetic identity schemes; without portfolio-level CIP analytics, First Capital detects individual suspicious accounts only when transaction monitoring flags specific activity patterns, missing the opportunity to shut down synthetic identity rings during the account opening phase before they begin transacting.`,
    keywords: ['CIP', 'synthetic identity fraud', 'FinCEN', 'BSA/AML', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },

  // ── Additional EDD Patterns ────────────────────────────────────────────────
  {
    code: 'B2847',
    name: 'EDD Senior Management Sign-Off Not Obtained Before Onboarding PEP-Affiliated Customers',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's written EDD program requires senior management sign-off before opening accounts for customers identified as PEPs or their close associates, but the sign-off requirement is applied only to direct PEPs and not to first-degree relatives or close business associates of PEPs, which FinCEN guidance and the FATF's PEP recommendations include in the enhanced scrutiny population. OCC BSA examination guidance aligns with FATF Recommendation 12 in requiring that banks apply EDD not only to PEPs themselves but to their family members and known close associates; the gap in First Capital's written EDD program means that accounts for PEP relatives and business associates — a population that money laundering typologies identify as the primary conduit for PEP-associated layering — receive standard CDD without senior sign-off or enhanced monitoring.`,
    keywords: ['EDD', 'PEP screening', 'FinCEN CDD Rule', 'FATF', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2848',
    name: 'Correspondent Banking EDD Not Escalated to Board for High-Risk Jurisdictions',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital maintains correspondent banking relationships with three foreign financial institutions operating in jurisdictions on the FATF grey list, but the bank's EDD program does not require board-level notification or approval for correspondent relationships with grey-list jurisdiction institutions — treating them as standard EDD rather than as elevated-risk correspondent relationships requiring the heightened oversight that FinCEN's Section 312 guidance and OCC supervisory expectations for correspondent banking due diligence require. OCC's BSA/AML examination manual and FinCEN's correspondent banking guidance both require that senior management and board have visibility into the bank's correspondent relationships in jurisdictions subject to enhanced AML monitoring; a correspondent banking EDD program that operates at BSA team level without board escalation for grey-list jurisdictions creates an oversight gap that OCC examiners identify during their review of the bank's correspondent banking CDD files.`,
    keywords: ['EDD', 'correspondent banking', 'FinCEN', 'FATF', 'OCC BSA handbook'],
    demoRelevant: false,
    subTopic: 'enhanced-due-diligence',
  },
  {
    code: 'B2849',
    name: 'EDD Customer File Does Not Document Source-of-Wealth for High-Net-Worth Private Banking Clients',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's private banking EDD program requires source-of-funds documentation for individual deposits above $500K but does not require source-of-wealth documentation — the broader assessment of how the customer accumulated their total wealth — for high-net-worth private banking clients whose account balances routinely exceed $5M. FinCEN guidance on private banking EDD and the FATF's anti-money laundering guidance for private banking both distinguish between source-of-funds (the origin of the specific deposit) and source-of-wealth (the origin of the customer's overall financial capacity), treating the latter as the more important EDD element for high-balance private banking customers. The absence of source-of-wealth documentation for First Capital's private banking population means the bank cannot demonstrate to OCC examiners that it has adequately assessed whether high-balance customers' total wealth is consistent with their stated profession and business activities.`,
    keywords: ['EDD', 'source-of-wealth', 'FinCEN CDD Rule', 'BSA/AML', 'OCC BSA handbook'],
    demoRelevant: false,
    subTopic: 'enhanced-due-diligence',
  },

  // ── Additional Ongoing Monitoring Patterns ────────────────────────────────
  {
    code: 'B2850',
    name: 'OFAC Screening Not Applied at Payment Execution — Onboarding-Only Screen Insufficient',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital screens customers for OFAC SDN list matches at account opening but does not re-screen the customer base when OFAC adds new names to the SDN list — relying on real-time payment screening for wire transactions but not applying OFAC re-screening to ACH, check, and internal transfer activity below the bank's real-time screening threshold. OFAC's compliance guidance and OCC BSA examination expectations require that financial institutions maintain blocking procedures for all transactions with SDN-listed parties regardless of channel or amount; screening only at onboarding and at above-threshold wire activity creates a gap where an existing customer who appears on the SDN list after account opening can continue conducting below-threshold transactions without detection until the bank's next scheduled customer rescreening cycle.`,
    keywords: ['OFAC', 'SDN screening', 'BSA/AML', 'FinCEN', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2851',
    name: 'Transaction Monitoring Segmentation Does Not Differentiate Commercial Real Estate Customer Behavior',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's transaction monitoring system uses industry code-based behavioral segmentation to set alert thresholds, but does not create a separate behavioral segment for commercial real estate investors — grouping them with general commercial real estate borrowers rather than distinguishing investment-holding companies, fix-and-flip investors, and commercial developers whose legitimate transaction patterns differ materially in terms of lump-sum wire activity, intercompany transfers, and escrow receipt timing. FinCEN guidance on real estate money laundering and OCC BSA examination expectations for transaction monitoring effectiveness require that behavioral segmentation be calibrated to actual customer transaction profiles; CRE investors grouped with general commercial customers trigger both false positive alerts on legitimate lump-sum transfers and fail to generate alerts for real estate-specific structuring patterns that FinCEN geographic targeting orders have documented in First Capital's market.`,
    keywords: ['transaction monitoring', 'FinCEN', 'BSA/AML', 'commercial real estate', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2852',
    name: 'Negative News Re-Screening Not Triggered by Relationship Manager Activity Notes',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's relationship managers document customer interaction notes in the CRM system when they learn of material business events — management changes, regulatory investigations, litigation, or press coverage — but these CRM notes do not trigger an automated adverse media re-screening or risk rating review in the BSA/AML system, leaving the compliance team unaware of adverse information that the bank's own relationship management team has already documented. FinCEN's CDD Rule ongoing monitoring requirement and OCC BSA examination guidance anticipate that banks leverage all available information sources, including internal relationship notes, to maintain current risk assessments; a disconnected CRM-to-BSA workflow means the bank's earliest-available adverse information signal — the relationship manager's direct knowledge — does not reach the compliance function until the next scheduled periodic review.`,
    keywords: ['FinCEN CDD Rule', 'ongoing monitoring', 'BSA/AML', 'CRM integration', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'ongoing-monitoring',
  },
  {
    code: 'B2853',
    name: 'BSA Alert Disposition Quality Declines With Headcount Pressure — Average Time Below Minimum',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      `First Capital's BSA operations team processes an average of 1,200 transaction monitoring alerts per month with a team of eight analysts; after two rounds of cost reduction reduced the team to five analysts, the average time spent per alert disposition has fallen from 22 minutes to 9 minutes — below the minimum investigative time documented in the bank's BSA program quality standards. OCC BSA examination guidance and FinCEN's AML program effectiveness framework require that alert disposition include sufficient investigative depth to determine whether the activity warrants a SAR filing; an average disposition time of 9 minutes does not allow analysts to conduct the account history review, transaction pattern analysis, and source-of-funds assessment that quality SAR decision-making requires, creating a systematic risk that genuine suspicious activity is being closed without sufficient investigation due to capacity constraints.`,
    keywords: ['BSA/AML', 'transaction monitoring', 'OCC BSA handbook', 'SAR quality', 'FinCEN'],
    demoRelevant: true,
    subTopic: 'ongoing-monitoring',
  },

  // ── Additional Commercial Onboarding Patterns ────────────────────────────
  {
    code: 'B2854',
    name: 'Foreign Bank Account Holder FBAR Disclosure Not Collected at Business Account Opening',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's commercial account opening process does not collect information about business account holders' foreign financial account relationships or require disclosure of accounts subject to FinCEN's FBAR reporting requirement under 31 CFR 103.24, creating a gap in the bank's ability to assess whether commercial customers are correctly categorizing and reporting their international financial relationships for BSA risk purposes. OCC BSA examination guidance and FinCEN's FBAR administration guidance indicate that financial institutions should collect information about foreign account relationships as part of commercial customer CDD to inform both KYC risk assessment and the bank's awareness of potential FBAR non-compliance by customers; the absence of systematic foreign account disclosure collection means First Capital has no visibility into the international financial exposure of its commercial customer base for risk-rating purposes.`,
    keywords: ['FBAR', 'FinCEN', 'BSA/AML', 'commercial onboarding', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2855',
    name: 'Commercial Account Annual Certification of Beneficial Ownership Not Enforced',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's commercial CDD program requires customers to certify their beneficial ownership information annually and to notify the bank of changes within 30 days of any change in ownership or control; in practice, the annual certification is sent to commercial customers but the bank has no enforcement mechanism — accounts where the customer does not return the certification within 90 days continue to operate normally without restriction or escalation. FinCEN's CDD Rule and OCC BSA supervisory guidance require that banks take steps to ensure the ongoing accuracy of customer information, which includes following up on non-returned certifications; a certification program with a 35% non-response rate and no enforcement consequence does not satisfy the ongoing monitoring component of the CDD Rule and creates a population of commercial accounts where beneficial ownership information may be materially stale.`,
    keywords: ['FinCEN CDD Rule', 'beneficial ownership', 'BSA/AML', 'annual certification', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2856',
    name: 'Digital Onboarding Channel Lacks In-Person Verification Fallback for eKYC Failures',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital's digital commercial account opening channel requires customers to complete eKYC identity verification online; when eKYC fails due to poor image quality, document formatting issues, or liveness detection problems, the channel presents an error message and exits the customer from the application flow without offering a supervised in-person or video-assisted verification alternative. NIST SP 800-63A identity assurance level guidance and OCC digital banking guidance support multi-modal identity proofing workflows that provide supervised alternatives when automated proofing fails; the absence of a fallback pathway creates an onboarding abandonment rate of 22% for customers who fail automated eKYC, disproportionately affecting older customers and recent immigrants with non-standard ID documents, and creating a CFPB unfair practices concern given the demographic skew of automated eKYC failure rates.`,
    keywords: ['eKYC', 'NIST 800-63', 'CIP', 'USA PATRIOT Act', 'OCC guidance'],
    demoRelevant: true,
    subTopic: 'digital-identity',
  },
  {
    code: 'B2857',
    name: 'KYC Refresh AI Automation Suppresses Re-Review for Dormant Accounts — Reactivation Risk',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital deploys an AI-assisted KYC refresh prioritization tool that de-prioritizes periodic re-review for dormant commercial accounts with minimal transaction activity; when a previously dormant account is reactivated with a high-volume transaction pattern, the prior CDD information — which the AI tool deprioritized — has not been refreshed and may be years out of date, including beneficial ownership certifications, expected activity profiles, and source-of-funds documentation. FinCEN's CDD Rule and OCC BSA guidance require that reactivated dormant accounts receive updated CDD before high-value transactions are processed; the AI tool's de-prioritization of dormant accounts creates a structural gap where reactivation events — which are themselves a money laundering typology flag — occur against a CDD background that the tool has left stale precisely for the accounts most likely to exhibit anomalous reactivation behavior.`,
    keywords: ['AI KYC refresh', 'FinCEN CDD Rule', 'BSA/AML', 'ongoing monitoring', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-kyc',
  },
  {
    code: 'B2858',
    name: 'Commercial Onboarding Data Captured in PDF — No Structured CDD Database for Analytics',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital collects commercial CDD information through a combination of PDF questionnaires, scanned forms, and email correspondence that are stored in a document management system but not extracted into a structured CDD database, making it impossible to systematically query the CDD population for risk analytics — such as identifying all accounts with a specific beneficial owner, all customers from a specific jurisdiction, or all customers in a specific industry segment who have not completed their annual certification refresh. OCC BSA examination guidance and FinCEN's CDD Rule require that banks be able to access and aggregate CDD information to support risk monitoring and examination response; a PDF-based CDD repository that cannot be queried analytically means First Capital cannot produce portfolio-level CDD analytics or respond efficiently to FinCEN information requests, and the structured data gap is a known BSA program deficiency that the bank has not remediated despite prior OCC examination findings.`,
    keywords: ['FinCEN CDD Rule', 'BSA/AML', 'CDD data quality', 'OCC examination', 'BCBS 239'],
    demoRelevant: true,
    subTopic: 'commercial-onboarding',
  },
  {
    code: 'B2859',
    name: 'High-Risk Customer Offboarding Not Documented — Residual Risk Untracked After Exit',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      `First Capital closes commercial accounts that fail EDD or exceed risk tolerance thresholds, but does not maintain a documented offboarding record capturing the risk basis for the exit decision, the final CDD review findings, and any SAR filings associated with the exited relationship; the absence of offboarding documentation means that exited high-risk customers cannot be systematically tracked to detect attempts to re-establish a banking relationship through a different channel or entity. FinCEN's AML program guidance and OCC BSA examination expectations for high-risk customer management require that offboarding decisions be documented with sufficient detail to support re-identification at future onboarding attempts; the lack of a structured offboarding record creates a gap where previously declined or exited high-risk customers can successfully re-onboard through the digital channel without triggering the enhanced scrutiny that prior adverse CDD findings would warrant.`,
    keywords: ['FinCEN CDD Rule', 'BSA/AML', 'customer offboarding', 'EDD', 'OCC BSA handbook'],
    demoRelevant: true,
    subTopic: 'cip-kyc',
  },
];
