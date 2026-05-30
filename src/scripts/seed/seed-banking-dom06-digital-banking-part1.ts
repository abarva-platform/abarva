// seed-banking-dom06-digital-banking-part1.ts
// Banking genome patterns — Digital Banking & Mobile Experience
// Code range: B1600–B1659  (60 patterns)
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

export const BANKING_DIGITAL_BANKING_PART1_PATTERNS: PatternSeed[] = [

  // ── Mobile App Security ────────────────────────────────────────────────────
  {
    code: 'B1600',
    name: 'Biometric Authentication Gap Exposes Mobile Banking to Account Takeover',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's mobile banking app allows customers to enroll biometric authentication (Face ID, fingerprint) without binding the biometric template to a hardware-backed secure enclave, permitting attackers who root or jailbreak the device to bypass the biometric check using stored template files. FFIEC Authentication Guidance (2011, updated 2021) requires that authentication mechanisms be commensurate with the risk of the transaction and that biometric controls include device-level integrity checks; when the OCC reviews First Capital's mobile channel authentication controls, the absence of device attestation as part of the biometric flow is cited as a layered security deficiency that leaves the mobile channel exposed to credential theft at a rate that exceeds the FFIEC's high-risk channel threshold.`,
    keywords: ['FFIEC authentication guidance', 'biometric authentication', 'mobile banking security', 'jailbreak detection', 'account takeover'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1601',
    name: 'Mobile Session Token Lifetime Exceeds FFIEC Risk Threshold — Hijack Window Open',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's mobile banking app issues OAuth 2.0 access tokens with a 24-hour lifetime for persistent sessions, and refresh tokens valid for 90 days with no step-up authentication on sensitive operations such as external wire transfers or new payee enrollment. FFIEC Authentication Guidance and NIST SP 800-63B require that session lifetime be limited commensurate with the sensitivity of available functions and that high-risk transactions trigger re-authentication; a 24-hour session window without activity-based timeout means that a stolen session token — obtained via a compromised Wi-Fi network or malware intercepting token storage — provides an attacker full mobile banking access for nearly a full business day without triggering any re-authentication challenge.`,
    keywords: ['FFIEC authentication guidance', 'OAuth 2.0', 'session management', 'NIST SP 800-63B', 'mobile banking security'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1602',
    name: 'Mobile Deposit RDC Duplicate Detection Fails Across Multi-Device Customer Profiles',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's mobile remote deposit capture (RDC) system deduplicates check deposits at the device level, using the mobile device ID as a key component of the duplicate detection logic; customers with multiple enrolled devices — a phone and a tablet — can deposit the same check image from each device before the hold period closes, exploiting a gap where duplicate detection does not operate across device profiles tied to the same customer CIF. Federal Reserve Regulation CC and OCC guidance on RDC controls require that duplicate check detection operate at the customer relationship level, not merely the device level; the cross-device duplicate deposit gap creates check fraud exposure and a CFPB consumer complaint risk when legitimate customers are also affected by false-positive holds triggered by the inconsistent duplicate logic.`,
    keywords: ['Regulation CC', 'mobile deposit RDC', 'OCC guidance', 'duplicate detection', 'mobile banking fraud'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1603',
    name: 'App Store Version Fragmentation Leaves 22% of Users on Unpatched Security Build',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's mobile banking app does not enforce minimum version requirements at login, allowing customers running versions up to 18 months old — some containing known SSL pinning vulnerabilities and unpatched certificate validation bugs — to continue transacting on the mobile channel without any forced update prompt. FFIEC guidance on mobile financial services and OCC guidance on technology risk require that banks maintain awareness of their mobile channel attack surface and enforce security patches within a reasonable timeframe; an internal penetration test commissioned by First Capital's cybersecurity team demonstrates that three prior app versions are vulnerable to a man-in-the-middle attack that can intercept authentication credentials, a finding that creates a regulatory disclosure obligation under the OCC's notification rules.`,
    keywords: ['FFIEC authentication guidance', 'mobile app patching', 'SSL pinning', 'OCC technology risk', 'mobile banking security'],
    demoRelevant: false,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1604',
    name: 'Jailbreak and Root Detection Not Deployed — High-Risk Transactions Proceed on Compromised Devices',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's mobile banking app does not implement jailbreak or root detection, allowing customers whose devices have been compromised — either intentionally jailbroken or infected with a banking trojan that achieves root access — to authenticate and execute high-value transactions including external transfers and new payee additions without any additional friction. FFIEC Authentication Guidance and the OCC's cybersecurity assessment framework require that banks implement device integrity checks as part of their layered security controls for high-risk mobile transactions; First Capital's fraud operations team identifies a cluster of account takeover events tracing to a banking trojan that exploits the absence of jailbreak detection, with average fraud losses per event of $12,500 concentrated in commercial banking clients.`,
    keywords: ['FFIEC authentication guidance', 'jailbreak detection', 'mobile banking security', 'account takeover', 'OCC cybersecurity'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1605',
    name: 'Mobile App Data Residency on Device Not Encrypted — PCI DSS Scope Exposure',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's mobile banking app caches account balance, recent transaction history, and partial card number data in local device storage using application-level encryption keys stored in the app's own keychain rather than the device's hardware security module, making the cached data accessible if the device keychain is extracted by a forensic tool or malware with root access. PCI DSS Requirement 3 mandates protection of stored cardholder data, and FFIEC guidance on mobile financial services requires that any locally cached financial data be protected with device-level hardware-backed encryption; a PCI QSA audit of First Capital's mobile app flags the software-stored encryption key approach as a compensating control deficiency, requiring a remediation roadmap to migrate cached data protection to iOS Secure Enclave and Android StrongBox.`,
    keywords: ['PCI DSS', 'FFIEC authentication guidance', 'mobile app encryption', 'cardholder data', 'device security'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1606',
    name: 'Push Notification Authentication Used for Wire Approvals Without Out-of-Band Verification',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's mobile banking commercial platform allows business customers to approve wire transfers up to $500,000 via an in-app push notification that is displayed on the same device used to initiate the wire, creating a scenario where malware controlling the initiating device can also intercept and approve the authentication notification without any out-of-band challenge. FFIEC Authentication Guidance defines out-of-band authentication as requiring a separate, independent channel from the transaction initiation channel; using a push notification delivered to the same device for transaction approval collapses two authentication factors onto one logical channel, defeating the risk mitigation objective that out-of-band authentication is designed to provide for high-value commercial transactions.`,
    keywords: ['FFIEC authentication guidance', 'out-of-band authentication', 'wire transfer approval', 'mobile banking security', 'commercial banking'],
    demoRelevant: true,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1607',
    name: 'iOS and Android Code Divergence Creates Inconsistent Security Control Surface',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      `First Capital maintains separate native codebases for iOS and Android mobile banking, with different development teams responsible for each platform; security controls including certificate pinning, session timeout logic, and jailbreak/root detection have been implemented at different points in the development cycle and with different underlying libraries, creating an inconsistent security posture across platforms. FFIEC guidance on mobile financial services requires that security controls be consistently implemented across all channels and platforms; an internal CISO review finds that the Android app's certificate pinning implementation is six months behind the iOS version and uses a deprecated pinning library with a known bypass, creating platform-specific fraud exposure that cannot be remediated without a cross-platform security alignment project.`,
    keywords: ['FFIEC authentication guidance', 'mobile app security', 'certificate pinning', 'OCC technology risk', 'cross-platform security'],
    demoRelevant: false,
    subTopic: 'mobile-app',
  },
  {
    code: 'B1608',
    name: 'Screen Capture Prevention Not Implemented — Sensitive Data Exposed via Device Screenshot',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description:
      `First Capital's mobile banking app does not implement screen capture prevention flags (FLAG_SECURE on Android, UIScreen overlay on iOS), allowing malware or screen-sharing applications to capture account balances, transaction details, and partial card numbers displayed on screen without any application-level control preventing the capture. FFIEC guidance on mobile financial services and OCC cybersecurity expectations require that banks assess and mitigate the risk of data leakage through mobile device features; the absence of screen capture prevention is a low-complexity control gap that First Capital's mobile security assessment identifies as having been available in the mobile SDK for three years without implementation, representing a technical debt item that creates unnecessary customer data exposure risk.`,
    keywords: ['FFIEC authentication guidance', 'mobile app security', 'screen capture prevention', 'data leakage', 'OCC technology risk'],
    demoRelevant: false,
    subTopic: 'mobile-app',
  },

  // ── Digital Onboarding ─────────────────────────────────────────────────────
  {
    code: 'B1609',
    name: 'eKYC Digital Identity Verification Fails PATRIOT Act CIP Requirements for High-Risk Customers',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's digital account opening platform uses a third-party eKYC vendor to verify customer identity through document scanning and database matching, but does not apply enhanced verification procedures for customers flagged as higher-risk by the vendor's risk score — including customers with synthetic identity indicators, mismatched address history, and document anomalies — relying solely on the automated score without a manual review step. USA PATRIOT Act Section 326 and FinCEN's Customer Identification Program rule require that banks have risk-based procedures for verifying identity, including enhanced procedures for higher-risk customers; the CFPB and OCC have cited digital onboarding CIP gaps in recent examination findings where the automated approval pathway bypassed the risk-based enhanced verification tier, creating potential BSA/AML exposure through digital channels.`,
    keywords: ['USA PATRIOT Act', 'CIP', 'eKYC', 'FinCEN', 'digital onboarding'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1610',
    name: 'Liveness Detection in Digital Onboarding Vulnerable to Deepfake Video Attack',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's digital account opening process uses a selfie-based liveness detection step to confirm that the applicant presenting a government-issued ID is a real person rather than a static photo; the liveness detection vendor uses a passive liveness model that does not challenge with randomized head movement prompts and has been publicly demonstrated to fail against deepfake video injected at the camera API layer. FFIEC guidelines on digital identity and FinCEN's CIP rule require that identity verification be commensurate with the risk of fraud; passive liveness detection without active challenge is classified as a lower-assurance control, and first-party fraud via synthetic identity through the digital channel accounts for 34% of First Capital's new account fraud losses in the first 90 days post-open.`,
    keywords: ['FFIEC authentication guidance', 'liveness detection', 'digital onboarding', 'USA PATRIOT Act', 'CIP'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1611',
    name: 'ESIGN Act Consent Flow Missing Affirmative Consumer Consent Record for Reg E Disclosures',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's digital onboarding flow presents Regulation E electronic funds transfer disclosures and account terms as a scrollable modal that customers are required to acknowledge by clicking "I Agree," but does not record whether the customer scrolled to the bottom of the disclosure or spent meaningful time reviewing it, and the consent event log retains only the timestamp without the content version hash of the disclosure presented. The Electronic Signatures in Global and National Commerce (ESIGN) Act requires affirmative consumer consent to receive records in electronic form and that institutions provide the required hardware/software specifications and retain evidence of consent; a CFPB examination finding in the digital banking channel cites the absence of demonstrable affirmative consent records as an ESIGN Act compliance gap that undermines First Capital's ability to enforce Reg E arbitration provisions and to demonstrate compliance with electronic disclosure requirements.`,
    keywords: ['ESIGN Act', 'Regulation E', 'CFPB', 'digital onboarding', 'electronic consent'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1612',
    name: 'Digital Onboarding Dropout Rate Triggers Aggressive CIP Waiver — Compliance Tension',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      `First Capital's digital account opening funnel has a 68% dropout rate at the identity verification step, primarily among customers who cannot complete the document scanning step on mobile devices; the digital banking team responds by implementing a "lite KYC" pathway that defers enhanced document verification to post-opening for customers who score above a threshold on the automated database check alone. FinCEN's CIP rule and USA PATRIOT Act Section 326 require that identity be verified before opening an account or within a reasonable time thereafter; the "lite KYC" deferral pathway creates a population of open accounts where CIP verification remains incomplete for 14–45 days post-opening, a gap that FinCEN and the OCC treat as a CIP compliance deficiency rather than a timing accommodation.`,
    keywords: ['USA PATRIOT Act', 'CIP', 'FinCEN', 'digital onboarding', 'KYC'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1613',
    name: 'Digital Commercial Account Opening CIP Not Adapted for Business Legal Entity Verification',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's digital commercial account opening platform uses a consumer-grade identity verification flow for small business accounts, collecting only the beneficial owner's personal identity documents without independently verifying the legal existence of the business entity, its beneficial ownership structure, or the authority of the account opener to act on behalf of the business. FinCEN's Customer Due Diligence rule (31 CFR Part 1020) and the USA PATRIOT Act CIP rule have separate, more stringent requirements for legal entity customers, including beneficial ownership certification for entities above the threshold; using a consumer eKYC flow for business accounts creates a material CIP compliance gap that First Capital's BSA officer identifies after a CFPB complaint from a business customer whose account was opened without any verification of beneficial ownership.`,
    keywords: ['FinCEN CDD rule', 'USA PATRIOT Act', 'CIP', 'beneficial ownership', 'digital onboarding'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1614',
    name: 'Digital Onboarding Reg Z Disclosure Timing Requirement Missed in Streamlined Flow',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's digital origination platform for home equity lines of credit presents Regulation Z Truth in Lending Act disclosures at the end of the application confirmation step rather than before the customer submits a complete credit application, violating the timing requirements under Reg Z that early Truth in Lending disclosures must be provided within three business days of receiving a complete application — not at confirmation. CFPB supervision of digital mortgage and HELOC origination has repeatedly cited timing violations in streamlined digital flows where disclosure placement is driven by conversion optimization rather than compliance timing requirements; First Capital's HELOC digital origination funnel redesign, which moved disclosure placement to improve completion rates, was not reviewed by compliance before launch.`,
    keywords: ['Regulation Z', 'CFPB', 'Truth in Lending', 'HELOC digital origination', 'disclosure timing'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1615',
    name: 'AI-Powered eKYC Vendor Risk Score Not Validated for Demographic Disparate Impact',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital uses an AI-powered eKYC vendor whose identity verification risk score determines which digital onboarding applicants receive additional verification friction; the vendor's score has not been subjected to a disparate impact analysis by First Capital's compliance team, and internal data reveals that digital onboarding failure rates for Black and Hispanic applicants are 2.3× higher than for white applicants at the same objective fraud signal level. CFPB supervisory guidance on AI in consumer financial services and ECOA Regulation B require that any factor used in a credit or account opening decision — including an automated identity verification score — be tested for discriminatory impact on protected classes; the unevaluated AI vendor score creates a UDAP and ECOA examination risk that the OCC and CFPB have prioritized in their digital channel examination guidance.`,
    keywords: ['ECOA', 'Reg B', 'CFPB', 'AI eKYC vendor', 'disparate impact'],
    demoRelevant: true,
    subTopic: 'digital-onboarding',
  },
  {
    code: 'B1616',
    name: 'Digital Onboarding Account Funding Step Bypasses Reg CC Hold Rules',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital's digital account opening platform allows new customers to fund their account immediately via ACH transfer from an external bank account, with funds made available for debit card transactions within 24 hours under an instant availability promotion; the instant availability is extended before the ACH return window closes, creating a check-kiting-equivalent exposure where customers can open an account, fund it via ACH, withdraw the funds, and return the ACH debit within the standard return window. Federal Reserve Regulation CC establishes hold schedules for deposited funds and the conditions under which funds may be withheld; the instant availability promotion bypasses Regulation CC's new account hold exception, which permits holds of up to nine business days on new account deposits, creating a fraud loss exposure that First Capital's operations team discovers when ACH return rates on digitally-opened accounts exceed the fraud risk threshold.`,
    keywords: ['Regulation CC', 'CFPB', 'digital onboarding', 'ACH return', 'new account fraud'],
    demoRelevant: false,
    subTopic: 'digital-onboarding',
  },

  // ── API Security ───────────────────────────────────────────────────────────
  {
    code: 'B1617',
    name: 'Open Banking API CFPB 1033 Rate Limiting Not Calibrated — Third-Party Scraping at Scale',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's open banking API, built to comply with CFPB Section 1033 of the Dodd-Frank Act requiring consumer financial data access, does not implement rate limiting that differentiates between authorized data aggregators and unauthorized screen scrapers; the API endpoint has been discovered and queried by non-authorized data brokers at a rate of 40,000 requests per day, representing 85% of total API traffic and imposing infrastructure costs that were not budgeted in the CFPB 1033 compliance program. CFPB's Section 1033 rulemaking and the Consumer Financial Data Rights final rule require that financial institutions implement technical standards to protect the security and integrity of data access interfaces; the absence of OAuth 2.0 client credential validation and rate limiting is a known technical control requirement that First Capital's API implementation deferred as a future-phase enhancement.`,
    keywords: ['CFPB Section 1033', 'open banking API', 'OAuth 2.0', 'rate limiting', 'third-party data access'],
    demoRelevant: true,
    subTopic: 'api-security',
  },
  {
    code: 'B1618',
    name: 'OAuth 2.0 Token Lifecycle Management Allows Orphaned Third-Party Access After Customer Revokes Consent',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's open banking API issues OAuth 2.0 access tokens with a 12-month lifetime to authorized data aggregators; when a customer revokes their data sharing consent through the bank's consent management portal, the revocation event does not propagate to the token validation layer, leaving previously issued tokens valid for the remainder of their lifecycle — up to 12 months — after the customer believes they have terminated access. CFPB Section 1033 and the Financial Data Exchange (FDX) API standards require that consumer consent revocation be honored immediately and that token invalidation occur in real time; a gap between consent revocation and token invalidation creates a scenario where a third-party data aggregator continues to access a consumer's account data without authorization, constituting a CFPB UDAP violation and a potential unauthorized access event requiring notification.`,
    keywords: ['CFPB Section 1033', 'OAuth 2.0', 'consumer consent', 'open banking API', 'UDAP'],
    demoRelevant: true,
    subTopic: 'api-security',
  },
  {
    code: 'B1619',
    name: 'PCI DSS API Scope Leak — Card Number Data Inadvertently Exposed in Open Banking Endpoint',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's open banking account data API, built to CFPB Section 1033 requirements, includes a transaction detail endpoint that returns full merchant category codes and transaction amounts; an API developer error results in the endpoint also returning the last 8 digits of the debit card used for each transaction — exceeding the PCI DSS allowance for truncated PAN data — which was not detected in the API design review because the field was added to the response schema as a debugging convenience. PCI DSS Requirement 3.4 limits stored and transmitted PAN data to a maximum of the first six and last four digits; the API scope leak exposes card data to any authorized third-party aggregator accessing the transaction detail endpoint, creating a PCI DSS breach notification obligation and a CFPB data security examination finding.`,
    keywords: ['PCI DSS', 'open banking API', 'CFPB Section 1033', 'cardholder data', 'API security'],
    demoRelevant: true,
    subTopic: 'api-security',
  },
  {
    code: 'B1620',
    name: 'Third-Party Mobile SDK Supply Chain Risk — Unvetted SDK Collects Keystrokes in Banking App',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital's mobile banking app integrates six third-party SDKs for analytics, crash reporting, and push notification services; one analytics SDK was updated by its vendor to include a new behavioral analytics feature that logs keystroke timing patterns — ostensibly for UX research — without First Capital's knowledge, as the SDK update was incorporated automatically via the mobile CI/CD pipeline without a security review of the new SDK version. OCC guidance on third-party risk management (OCC 2013-29) and FFIEC guidance on mobile financial services require that banks assess the security posture of all third-party components integrated into customer-facing applications; an SDK that collects keystroke data from a banking application constitutes a data collection and potential credential harvesting risk that triggers OCC TPRM deficiency findings and CFPB privacy notification obligations under applicable state laws.`,
    keywords: ['OCC 2013-29', 'mobile SDK supply chain', 'FFIEC authentication guidance', 'TPRM', 'mobile app security'],
    demoRelevant: true,
    subTopic: 'api-security',
  },
  {
    code: 'B1621',
    name: 'Open Banking API Versioning Strategy Leaves Deprecated Endpoint Active — Auth Bypass Risk',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      `First Capital launches a new version of its open banking API with enhanced OAuth 2.0 PKCE requirements and improved rate limiting, but the deprecated v1 endpoint — which lacks these controls — remains active for six months to allow third-party partners time to migrate, during which the v1 endpoint continues to handle 30% of API traffic. FFIEC guidance on technology risk and OCC cybersecurity expectations require that deprecated API versions with known security deficiencies be decommissioned on a risk-based timeline; the parallel operation of a less-secure legacy API version creates a security tier disparity where attackers who are aware of the v1 endpoint can circumvent the improved v2 controls, making the security investment in the new version effective only against unsophisticated attackers.`,
    keywords: ['FFIEC authentication guidance', 'API versioning', 'open banking API', 'OAuth 2.0', 'OCC technology risk'],
    demoRelevant: false,
    subTopic: 'api-security',
  },
  {
    code: 'B1622',
    name: 'GenAI-Powered API Documentation Tool Exposes Internal Endpoint Schemas to External Model',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      `First Capital's API development team uses a GenAI coding assistant to generate API documentation and OpenAPI specification files; the tool's configuration inadvertently sends internal API schemas — including undocumented endpoints, authentication parameter names, and internal field mappings — to the external GenAI provider's inference service as part of the documentation generation prompt. OCC guidance on third-party risk management (OCC 2013-29) and SR 11-7 model risk principles applied to AI tools require that banks assess the data flows associated with AI tool usage; schema information exposed to an external inference service constitutes a potential reconnaissance data leak that assists attackers in identifying attack surface, and the absence of a data classification review before GenAI tool adoption means First Capital cannot determine what internal system information has been processed by the external provider.`,
    keywords: ['OCC 2013-29', 'GenAI API documentation', 'TPRM', 'SR 11-7', 'data leakage'],
    demoRelevant: true,
    subTopic: 'api-security',
  },
  {
    code: 'B1623',
    name: 'CFPB 1033 Authorized Third-Party Agreement Does Not Include Data Minimization Clause',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's data sharing agreements with authorized third-party data aggregators under CFPB Section 1033 do not include data minimization requirements specifying that aggregators may only collect and retain the specific data fields authorized by the consumer consent — allowing aggregators to collect all available transaction and account data even when the consumer consented only to balance information for a specific use case. CFPB's Consumer Financial Data Rights final rule requires that data sharing agreements include provisions ensuring data is used only for the purposes authorized by the consumer and that aggregators implement data minimization practices; the absence of contractual data minimization creates a CFPB UDAP exposure where consumer financial data is being processed beyond the scope of the original consent.`,
    keywords: ['CFPB Section 1033', 'data minimization', 'open banking API', 'UDAP', 'consumer consent'],
    demoRelevant: true,
    subTopic: 'api-security',
  },

  // ── Digital Customer Experience ────────────────────────────────────────────
  {
    code: 'B1624',
    name: 'Mobile Banking App WCAG 2.1 Accessibility Failures Create ADA and CFPB UDAP Exposure',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's mobile banking app fails 23 of 38 WCAG 2.1 Level AA accessibility criteria audited by a third-party accessibility specialist, including missing alternative text on transaction icons, insufficient color contrast ratios in the account summary view, and touch target sizes below the 44×44 pixel minimum for customers with motor impairments. The Americans with Disabilities Act (ADA) Title III and CFPB UDAP principles require that financial services be accessible to customers with disabilities; First Capital has received 14 formal complaints in the prior 12 months from customers using assistive technology who cannot complete common mobile banking tasks, and the accessibility failures create class action litigation risk under ADA and state disability rights laws that the bank's legal team has flagged as a material contingent liability.`,
    keywords: ['WCAG 2.1', 'ADA', 'CFPB UDAP', 'accessibility compliance', 'mobile banking'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1625',
    name: 'Digital Fee Disclosure Fails CFPB UDAAP Standard — Overdraft Opt-In Hidden in Settings',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's mobile banking app places overdraft protection opt-in consent and fee disclosures within a nested settings menu that requires five navigation steps to reach from the account overview screen, while the promotional overdraft "protection" benefit is featured prominently in onboarding and push notifications; customers who opted in without understanding the fee structure file 340 CFPB complaints in a single quarter alleging that the overdraft fee disclosure was not clear or conspicuous. CFPB UDAAP authority and Regulation E Section 1005.17 require that overdraft opt-in consent be obtained through a clear and conspicuous disclosure before the consumer agrees to overdraft services; the information architecture that buries fee disclosures while promoting the service benefit violates the CFPB's "clear and conspicuous" standard and its prior enforcement actions against overdraft marketing practices.`,
    keywords: ['CFPB UDAAP', 'Regulation E', 'overdraft disclosure', 'fee transparency', 'mobile banking'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1626',
    name: 'CCPA Cookie Consent Banner Does Not Honor Do-Not-Sell Signal From Mobile Browser',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      `First Capital's digital banking web application and mobile web portal implement a cookie consent banner that allows customers to opt out of marketing cookies, but the implementation does not honor the Global Privacy Control (GPC) signal transmitted by privacy-focused browsers — which California law treats as a valid Do-Not-Sell request under CCPA — and continues to fire marketing analytics tags for users who have the GPC signal enabled. California Consumer Privacy Act (CCPA) and its amendment under CPRA require that businesses honor GPC signals as an opt-out from the sale and sharing of personal information; the California Privacy Protection Agency (CPPA) has published enforcement priorities that specifically address GPC compliance failures, and First Capital's digital properties have not been updated to detect and honor the GPC signal.`,
    keywords: ['CCPA', 'CPRA', 'cookie consent', 'Global Privacy Control', 'digital banking privacy'],
    demoRelevant: false,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1627',
    name: 'Reg E Electronic Statement Delivery Fails Notification Requirement When Email Bounces',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital delivers monthly account statements and Regulation E-required error resolution notices exclusively via email for customers enrolled in electronic statement delivery; when a customer's email address becomes invalid — through job change, email provider migration, or abandonment — the email bounces silently, and the bank continues to send required Regulation E disclosures and notices to the invalid address without alerting the customer or switching to paper delivery. Regulation E Section 1005.8 requires that error resolution notices and change-in-terms disclosures be provided to the consumer; delivery failure to an invalid email address does not satisfy the delivery requirement, and customers whose email addresses have bounced may be unaware of account changes or of their right to dispute an error within the 60-day Regulation E window.`,
    keywords: ['Regulation E', 'CFPB', 'electronic statement delivery', 'ESIGN Act', 'digital banking compliance'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1628',
    name: 'Digital Product Disclosure Version Control Failure — Outdated Terms Served to New Customers',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's digital banking platform maintains product disclosure documents — including Reg E account terms, Reg Z HELOC disclosures, and deposit account agreements — in a CDN-cached static file system; a compliance team update to the overdraft fee schedule takes effect in the account management system but the updated disclosure document is served from cache for 72 hours after the effective date, during which new digital customers receive and consent to the outdated fee schedule terms. CFPB UDAAP principles and Regulation E require that disclosures presented to consumers reflect the actual terms governing the account; presenting outdated fee disclosures through a CDN caching failure creates an enforceable contract discrepancy and a consumer complaints risk that is disproportionate to the technical complexity of the remediation — implementing a cache-bust trigger on compliance document updates.`,
    keywords: ['Regulation E', 'CFPB UDAAP', 'digital product disclosure', 'Regulation Z', 'compliance version control'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1629',
    name: 'Digital Mortgage Application RESPA Affiliate Disclosure Buried — CFPB Consent Order Risk',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's digital mortgage origination platform presents the required Real Estate Settlement Procedures Act (RESPA) Affiliated Business Arrangement (AfBA) disclosure — disclosing the bank's financial interest in the title company and homeowners insurance provider it refers customers to — as an expandable accordion element at the bottom of the Service Provider Selection page, after the customer has already selected affiliated providers as pre-populated defaults. CFPB RESPA supervision requires that AfBA disclosures be presented prominently, before the consumer selects the affiliated service provider, in a manner that allows the consumer to make an informed choice; the accordion placement and pre-population of affiliated providers as defaults creates a RESPA disclosure violation pattern that the CFPB has pursued in multiple recent enforcement actions against digital mortgage originators.`,
    keywords: ['RESPA', 'CFPB', 'affiliate disclosure', 'digital mortgage', 'UDAAP'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },
  {
    code: 'B1630',
    name: 'Digital Banking Dark Pattern — Auto-Renewal of Premium Service Not Disclosed Pre-Enrollment',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's digital banking platform offers a premium "Banking Plus" subscription tier with enhanced features and fee waivers; the enrollment flow does not disclose the automatic annual renewal and cancellation policy until the final confirmation step after the customer has entered payment information, and the renewal notification is sent 7 days before the renewal date to an email channel that 40% of enrolled customers do not monitor. CFPB UDAAP principles and FTC requirements for negative option marketing require that all material terms — including auto-renewal conditions and cancellation procedures — be disclosed clearly and conspicuously before enrollment; the post-enrollment disclosure placement and the 7-day cancellation window create a dark pattern that the CFPB has identified in its supervisory examination priorities for digital financial services.`,
    keywords: ['CFPB UDAAP', 'negative option marketing', 'digital banking', 'fee disclosure', 'dark pattern'],
    demoRelevant: true,
    subTopic: 'digital-cx',
  },

  // ── Digital Fraud ──────────────────────────────────────────────────────────
  {
    code: 'B1631',
    name: 'New Account Fraud via Digital Channel — FFIEC Auth Guidance Controls Not Layered',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's digital account opening channel experiences a new account fraud rate 4.2× higher than its branch channel, with the fraud predominantly concentrated in synthetic identity applications that pass the automated eKYC step using stolen Social Security numbers matched to fabricated credit files and address histories assembled over 12–18 months. FFIEC Authentication Guidance requires that banks implement layered security controls appropriate to the risk profile of their digital channels, including device intelligence, behavioral analytics, and risk-based step-up authentication for account opening; First Capital's digital channel relies exclusively on the eKYC vendor's identity score without a secondary device reputation layer, behavioral velocity check, or network-level fraud signal, creating a single point of failure in the new account fraud detection architecture.`,
    keywords: ['FFIEC authentication guidance', 'new account fraud', 'synthetic identity', 'digital onboarding', 'layered security'],
    demoRelevant: true,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1632',
    name: 'Credential Stuffing Attack Bypasses Mobile Banking Login — No Bot Detection Deployed',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's mobile banking login endpoint does not implement bot detection or CAPTCHA-equivalent challenges, allowing automated credential stuffing tools — which replay lists of username/password pairs from prior data breaches — to test tens of thousands of credential combinations per hour and achieve a 2.3% success rate, generating 1,400 account takeover events in a single weekend before the bank's SOC detects the velocity anomaly. FFIEC Authentication Guidance requires that banks monitor for and respond to automated attack patterns against authentication endpoints, including rate limiting, CAPTCHA, and behavioral anomaly detection; the absence of bot detection on the mobile login endpoint represents an authentication control gap that is particularly severe for First Capital given its digital transformation investment and the customer trust damage that account takeover events cause.`,
    keywords: ['FFIEC authentication guidance', 'credential stuffing', 'bot detection', 'account takeover', 'mobile banking security'],
    demoRelevant: true,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1633',
    name: 'Social Engineering Via Bank Chat — No Escalation Protocol for Sensitive Account Changes',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's digital banking live chat feature, staffed by contracted agents, allows customers to request account changes including phone number updates, email address changes, and external transfer limit increases after providing answers to knowledge-based authentication questions — questions whose answers are often available through social media or data broker sources. FFIEC guidance on authentication and online banking requires that social engineering risk be addressed through out-of-band verification for high-risk account changes, particularly those that alter future authentication channels; the chat channel's reliance on knowledge-based authentication for account changes is a documented social engineering vulnerability, and First Capital's fraud team records 38 cases per quarter where a fraudster impersonates a legitimate customer through chat to change the account's contact information before initiating unauthorized transfers.`,
    keywords: ['FFIEC authentication guidance', 'social engineering', 'knowledge-based authentication', 'digital banking fraud', 'account takeover'],
    demoRelevant: true,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1634',
    name: 'SMS OTP Vulnerable to SIM Swap Attack — No Step-Up to Hardware Token for Wire Transfers',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's digital banking platform uses SMS one-time passwords as the second authentication factor for all account actions, including high-value wire transfers and new external account enrollment; customers who are victims of SIM swap fraud — where an attacker convinces the mobile carrier to transfer the customer's phone number to an attacker-controlled SIM — lose all second-factor protection simultaneously, as all SMS OTPs are redirected to the attacker. FFIEC Authentication Guidance identifies SMS OTP as a lower-assurance factor susceptible to SIM swap and SS7 interception attacks and requires that banks apply controls commensurate with transaction risk; for high-risk operations such as wire transfers above a defined threshold, NIST SP 800-63B recommends hardware authentication tokens or authenticator app TOTP as more resilient alternatives.`,
    keywords: ['FFIEC authentication guidance', 'SIM swap', 'SMS OTP', 'NIST SP 800-63B', 'wire transfer fraud'],
    demoRelevant: true,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1635',
    name: 'Digital Banking Zelle Fraud Not Reflected in Reg E Dispute Resolution Workflow',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's digital banking dispute resolution workflow treats Zelle P2P payment fraud differently based on whether the customer was "authorized" to initiate the payment — denying Reg E error resolution to customers who were manipulated through social engineering or authorized push payment (APP) fraud schemes into sending a Zelle payment to a fraudster's account. Regulation E Section 1005.6 and CFPB interpretive guidance on authorized push payment fraud establish that consumers who are deceived into authorizing a payment through fraudulent misrepresentation by a third party may have error resolution rights even when the payment was technically authorized; First Capital's policy of categorically denying disputes for "authorized" Zelle transactions without case-by-case review creates a systematic CFPB UDAAP and Reg E exposure.`,
    keywords: ['Regulation E', 'CFPB', 'Zelle fraud', 'authorized push payment', 'UDAAP'],
    demoRelevant: true,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1636',
    name: 'First-Party Digital Fraud Velocity Rules Not Tuned After Product Expansion',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital expands its digital banking product suite to include instant personal loans and credit line increases accessible through the mobile app; the fraud velocity rules in the transaction monitoring system were calibrated for the prior product set and do not include rules specific to digital credit origination velocity — allowing a fraud ring to open 28 accounts over three days and obtain instant loan approvals totaling $840,000 before any fraud alert fires. OCC guidance on operational risk and fraud management and FFIEC guidance on digital channel risk require that banks update fraud detection models and rules when new digital products materially alter the fraud risk surface; the absence of product-specific velocity rules for digital credit products represents a fraud control gap that should have been addressed before product launch.`,
    keywords: ['FFIEC authentication guidance', 'fraud velocity rules', 'digital lending fraud', 'OCC operational risk', 'transaction monitoring'],
    demoRelevant: false,
    subTopic: 'fraud-digital',
  },
  {
    code: 'B1637',
    name: 'Digital Banking Account Takeover — Device Fingerprint Not Checked Against Fraud History',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's mobile banking platform collects device fingerprint data at each login but does not cross-reference the device fingerprint against a shared industry fraud consortium database that tracks devices known to have been used in fraud events at other financial institutions; a device used to commit account takeover fraud at two peer institutions successfully authenticates into First Capital accounts 60 days later because the fraud consortium signal is not integrated into First Capital's authentication decision engine. FFIEC Authentication Guidance recommends that banks leverage shared threat intelligence and consortium fraud signals as part of a layered security approach; the absence of consortium device intelligence integration means that First Capital is not benefiting from industry-wide fraud pattern sharing, leaving the bank as a last-resort target for fraud rings that have been blocked by peer institutions.`,
    keywords: ['FFIEC authentication guidance', 'device fingerprint', 'fraud consortium', 'account takeover', 'mobile banking security'],
    demoRelevant: false,
    subTopic: 'fraud-digital',
  },

  // ── AI in Digital Banking ──────────────────────────────────────────────────
  {
    code: 'B1638',
    name: 'LLM Chatbot Without Reg E Dispute Escalation Path — Customer Unable to File Error Resolution',
    officeCategory: 'front_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an LLM-powered chatbot as the primary digital banking customer service channel, configuring it to handle balance inquiries, payment scheduling, and general account questions; the chatbot has no scripted escalation path for Regulation E error resolution requests, and when customers report unauthorized transactions through the chat interface, the LLM generates generic troubleshooting responses rather than initiating the formal error investigation required by Reg E. Regulation E Section 1005.11 requires that banks provide a defined process for consumers to report errors within 10 business days and that banks investigate and resolve reported errors within 45 days; a chatbot that deflects error reports rather than escalating them to the Reg E investigation workflow creates systematic non-compliance with error resolution timing requirements and CFPB consumer complaint exposure.`,
    keywords: ['Regulation E', 'CFPB', 'LLM chatbot', 'error resolution', 'digital banking AI'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1639',
    name: 'AI Personalization Engine Targets Overdraft-Prone Customers With Fee-Bearing Products — UDAAP Risk',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      `First Capital's AI-powered digital personalization engine uses transaction behavior and account history to identify customers with recurring overdraft events and targets them with in-app promotions for premium overdraft protection products and short-term credit lines, without a CFPB UDAAP review of whether targeting financially vulnerable customers with fee-bearing products constitutes an unfair, deceptive, or abusive practice. CFPB UDAAP authority and its supervisory guidance on digital marketing practices establish that algorithmic targeting of financially distressed consumers with high-cost products requires affirmative UDAAP analysis; several CFPB enforcement actions have addressed cases where predictive analytics identified consumers most susceptible to fee-generating products and targeted them disproportionately, treating this as an abusive practice.`,
    keywords: ['CFPB UDAAP', 'AI personalization', 'overdraft protection', 'digital marketing', 'algorithmic targeting'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1640',
    name: 'AI Fraud Scoring Model Denies Transactions Without Reg B Adverse Action Notice',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's AI fraud scoring model automatically blocks debit card transactions and ACH payments scored above the fraud risk threshold, with no adverse action notice issued to the customer explaining the basis for the transaction denial; customers who are declined for legitimate transactions receive only a generic "transaction declined" message that does not allow them to understand or dispute the fraud flag. CFPB guidance on adverse action and ECOA Regulation B require that when an AI-based credit or account management decision adversely affects a consumer, a notice must be provided with specific reasons; while Reg B's adverse action requirements technically apply to credit decisions, the CFPB's unfairness authority under UDAAP applies to AI decision systems that harm consumers without a meaningful opportunity to challenge or understand the decision.`,
    keywords: ['CFPB UDAAP', 'Reg B', 'AI fraud scoring', 'adverse action', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1641',
    name: 'GenAI Content Generation for Digital Marketing Lacks Compliance Review — UDAAP Exposure',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      `First Capital's digital marketing team uses a GenAI content generation tool to produce in-app banners, push notification copy, and email campaigns for digital banking product promotions; the GenAI tool generates promotional content that includes superlatives ("the best rates in the region," "guaranteed savings"), rate claims without required APR disclosures, and benefit statements that omit material conditions — content that would fail the compliance pre-approval process but is published before review because the GenAI workflow bypasses the compliance content calendar. CFPB UDAAP authority and Regulation Z Truth in Savings require that promotional rate claims include required disclosures and that marketing claims be truthful and not misleading; a GenAI content pipeline without mandatory compliance review creates a systematic UDAAP exposure that scales with the volume of AI-generated promotional content.`,
    keywords: ['CFPB UDAAP', 'GenAI content', 'digital marketing', 'Regulation Z', 'compliance review'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1642',
    name: 'AI Chatbot Provides Investment Guidance Without Reg BI Disclosure or Broker-Dealer Registration',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's LLM-powered digital banking assistant responds to customer questions about investment options by recommending specific mutual funds and ETFs available through the bank's investment platform, without presenting the required SEC Regulation Best Interest (Reg BI) Form CRS disclosure or confirming that the customer has received and acknowledged the disclosure required before an investment recommendation is made. SEC Regulation BI requires broker-dealers and investment advisers to provide a Form CRS relationship summary before or at the time of an investment recommendation, and the OCC has clarified that AI-powered tools making product recommendations are subject to the same disclosure requirements as human advisers; the LLM chatbot's investment recommendations constitute a Reg BI compliance gap that First Capital's securities compliance team discovers after a customer complaint to FINRA.`,
    keywords: ['Regulation BI', 'SEC', 'LLM investment guidance', 'CFPB', 'AI chatbot compliance'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1643',
    name: 'AI Customer Segmentation for Targeted Offers Produces Proxy Redlining in Digital Channel',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's AI-powered customer segmentation model assigns digital banking customers to offer tiers that determine eligibility for waived fees, premium interest rates, and credit pre-approvals; the model uses geolocation-based engagement signals, device type, and app usage patterns that are correlated with income and race at the ZIP code level, resulting in customers in majority-minority neighborhoods receiving fewer premium product offers at a rate that is 1.8× lower than customers in majority-white ZIP codes. ECOA Reg B and CFPB UDAAP authority prohibit discriminatory targeting practices including digital redlining, where algorithmic segmentation uses proxy variables correlated with protected characteristics to provide unequal access to products and services; First Capital's fair lending program has not assessed the AI segmentation model for proxy discrimination despite the OCC's explicit guidance that AI-based customer segmentation models require fair lending testing.`,
    keywords: ['ECOA', 'Reg B', 'AI customer segmentation', 'CFPB UDAAP', 'digital redlining'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1644',
    name: 'AI Financial Wellness Chatbot Provides Personalized Advice Without Registered Investment Adviser Supervision',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's digital banking app includes an AI-powered "financial wellness assistant" that analyzes transaction history and spending patterns to provide personalized savings recommendations, debt payoff strategies, and retirement contribution guidance; the tool is not supervised by a registered investment adviser, and its guidance adapts dynamically to individual financial circumstances in a manner that constitutes investment advice under the Investment Advisers Act of 1940. SEC guidance on robo-advisers and the Investment Advisers Act require registration when a tool provides personalized investment advice for compensation; First Capital's financial wellness AI tool provides guidance that goes beyond generic financial education into personalized recommendations, creating a regulatory classification gap that the SEC's FinTech examination unit identifies during a digital channel review.`,
    keywords: ['Investment Advisers Act', 'SEC', 'AI financial wellness', 'CFPB', 'digital banking AI'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1645',
    name: 'LLM Digital Banking FAQ Trained on Outdated Policy Documents — Compliance-Inaccurate Responses',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's LLM chatbot is fine-tuned on a knowledge base built from product documentation, FAQs, and policy documents that were current as of the training date 14 months prior; when CFPB rule changes and product term updates take effect after the training cutoff, the chatbot continues to cite outdated fee schedules, discontinued product features, and superseded Reg E procedures in customer conversations. CFPB UDAAP standards require that information provided to consumers in digital channels be accurate and not misleading; an LLM chatbot that provides materially inaccurate information about account terms, fees, or regulatory rights constitutes a consumer harm under UDAAP regardless of whether the inaccuracy is intentional, and First Capital has no automated mechanism to detect when chatbot responses have drifted from current policy.`,
    keywords: ['CFPB UDAAP', 'LLM chatbot', 'Regulation E', 'digital banking AI', 'knowledge base drift'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1646',
    name: 'AI Anti-Fraud Scoring for Digital Payments Lacks SR 11-7 Model Documentation — OCC Finding',
    officeCategory: 'middle_office',
    failureRatePct: 79,
    description:
      `First Capital's digital payments platform uses an AI-based real-time fraud scoring model to approve or decline ACH, Zelle, and wire transfers initiated through the digital channel; the model operates on a proprietary vendor platform that classifies the scoring algorithm as a trade secret and provides no documentation of model inputs, validation methodology, or performance monitoring. OCC 2011-12 and SR 11-7 apply to all models used in bank risk management regardless of whether the model was developed internally or by a vendor, requiring that the bank obtain sufficient information about a vendor model to fulfill its model risk management obligations; the OCC's examination of First Capital's digital payments fraud infrastructure finds that the vendor model's trade secret classification does not exempt it from SR 11-7 documentation and validation requirements, resulting in a consent order finding for MRM non-compliance.`,
    keywords: ['SR 11-7', 'AI fraud scoring', 'OCC 2011-12', 'consent order', 'vendor model risk'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1647',
    name: 'GenAI-Powered Digital Account Summary Hallucinated Balance Data — Reg E Accuracy Obligation',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital tests a GenAI-powered "account insights" feature that generates natural language summaries of account activity including spending analysis and balance forecasting; during beta testing, the GenAI tool produces account summaries that misrepresent account balances by hallucinating projected credits that have not yet posted, leading 7 beta customers to overdraw their accounts based on the AI-generated balance narrative. Regulation E Section 1005.14 and CFPB guidance on electronic account information require that account balance and transaction information provided to consumers be accurate; a GenAI feature that hallucinates financial data in a consumer account interface creates Regulation E accuracy obligations and CFPB UDAAP exposure, and the product team's decision to launch with a disclaimer rather than halt the release until accuracy is validated reflects an inadequate compliance review process.`,
    keywords: ['Regulation E', 'CFPB UDAAP', 'GenAI account insights', 'hallucination risk', 'digital banking AI'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1648',
    name: 'AI Dispute Triage Bot Closes Fraud Claims Without Human Review — Reg E 10-Day Rule Violated',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys an AI dispute triage bot in its digital banking channel that classifies incoming Regulation E dispute claims and routes low-confidence fraud claims to an automated denial workflow, generating denial letters without a human compliance reviewer confirming that the denial basis meets Reg E error investigation standards. Regulation E Section 1005.11 requires that banks investigate reported errors within 10 business days and provide provisional credit if the investigation cannot be completed within that window; an AI triage bot that denies claims without a human review step creates a systematic risk that Reg E's provisional credit obligation and investigation standards are not being met, a pattern that CFPB examiners specifically target in digital banking channel supervision and that has resulted in enforcement actions against banks using AI to manage dispute volume.`,
    keywords: ['Regulation E', 'CFPB', 'AI dispute triage', 'fraud dispute', 'human-in-loop'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1649',
    name: 'AI Digital Lending Pre-Approval Without Reg B Firm Offer of Credit Disclosure',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's digital banking app uses an AI pre-approval engine to identify existing customers eligible for personal loan and credit line products, presenting in-app "pre-approved" banners and personalized credit limit offers without including the ECOA Regulation B firm offer of credit disclosures required when a bank uses consumer report information to make pre-screened offers. FCRA and Regulation B require that pre-screened credit offers include a clear and conspicuous disclosure of the consumer's right to opt out of pre-screened offers and that the offer constitute a firm offer of credit with defined terms; the AI pre-approval feature uses credit bureau signals without presenting the required FCRA Section 604(c) pre-screened offer disclosures, creating a Fair Credit Reporting Act violation pattern that affects every digitally delivered pre-approval offer.`,
    keywords: ['ECOA', 'Reg B', 'FCRA', 'AI pre-approval', 'digital lending'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1650',
    name: 'AI Voice Banking Biometric Voiceprint Enrolled Without CCPA or BIPA Consent',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's digital banking voice assistant enrolls customers who use voice commands three or more times in a passive voiceprint authentication system — storing a biometric voiceprint template derived from the customer's voice interactions — without obtaining the express written consent required by the Illinois Biometric Information Privacy Act (BIPA) for biometric data collection. Illinois BIPA and CCPA/CPRA biometric data provisions require affirmative informed consent before collecting biometric identifiers, including voiceprint templates, and create a private right of action under BIPA for violations; First Capital's passive voiceprint enrollment system, which was designed to reduce authentication friction, was deployed without a legal review of biometric privacy laws in the states where the bank operates, creating a class action liability exposure for each customer enrolled without consent.`,
    keywords: ['BIPA', 'CCPA', 'CPRA', 'biometric voiceprint', 'digital banking privacy'],
    demoRelevant: false,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1651',
    name: 'AI-Powered Mobile Loan Origination Ignores Ability-to-Repay Signals — Reg Z ATR Exposure',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital's AI-driven mobile loan origination system for personal installment loans approves applications based primarily on creditworthiness signals (bureau score, payment history) without integrating income verification or debt-to-income analysis, taking advantage of an exception to Regulation Z's Ability-to-Repay rule applicable to certain personal loan products; as interest rates rise and default rates on the digital loan portfolio increase, CFPB examination review finds that the absence of income-based ATR analysis for loans above a threshold amount constitutes a UDAP concern regardless of the technical regulatory exception. CFPB supervisory guidance on responsible small-dollar lending and its UDAP authority require that lending decisions account for a consumer's demonstrated ability to repay; an AI lending model that consistently approves high-rate loans to consumers whose transaction history in First Capital's own deposit accounts shows monthly income insufficient to cover the loan payment constitutes an unfair lending practice.`,
    keywords: ['Regulation Z', 'CFPB UDAAP', 'ability to repay', 'AI loan origination', 'digital lending'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1652',
    name: 'Digital Commercial Portal AI Assistant Responds to Sensitive Treasury Inquiries Without Role-Based Access Check',
    officeCategory: 'front_office',
    failureRatePct: 64,
    description:
      `First Capital's digital commercial banking portal includes an AI assistant that provides treasury management guidance, account analytics, and cash flow projections for business clients; the AI assistant responds to any authenticated user in the commercial portal without checking whether the user's assigned role authorizes access to the specific account or service information being requested, potentially exposing account details of corporate subsidiaries and sweep account balances to unauthorized users within the same corporate relationship. OCC guidance on commercial banking technology risk and FFIEC guidance on access management require that digital banking access controls enforce role-based access at a granular level for commercial clients, particularly for treasury management functions with large-value transaction authority; the AI assistant's authorization gap creates a data exposure risk in the commercial channel that is disproportionate to the complexity of the fix — adding a role-check middleware layer to the AI assistant query handler.`,
    keywords: ['FFIEC authentication guidance', 'AI commercial banking', 'role-based access control', 'OCC technology risk', 'commercial banking portal'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1653',
    name: 'AI Transaction Categorization Engine Misclassifies Medical Payments — CFPB FCRA Reporting Impact',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's digital banking AI transaction categorization engine misclassifies medical copayment and pharmacy transactions as entertainment or retail spending, affecting the accuracy of the spending analysis and budget tools provided to customers through the mobile app; the miscategorized transactions also flow into the AI-generated financial wellness reports that the bank shares with customers for credit profile building purposes under its financial health program. CFPB FCRA guidance and Regulation E accuracy requirements establish that banks must ensure the accuracy of financial information derived from account transaction data; when AI-generated financial reports containing categorization errors are used by customers to make financial decisions, the CFPB's supervisory focus on AI accuracy and consumer harm applies, and systematic miscategorization affecting medical transaction privacy creates an additional sensitivity under applicable health information privacy frameworks.`,
    keywords: ['CFPB', 'Regulation E', 'AI transaction categorization', 'FCRA', 'digital banking AI'],
    demoRelevant: false,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1654',
    name: 'Open Banking AI Aggregator Without Adverse Action Rights Awareness — CFPB Concern',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      `First Capital's open banking API provides transaction data to AI-powered financial aggregators that use First Capital account data as an input to credit scoring and lending decision models; when consumers are denied credit by a lender using an AI model fed by First Capital transaction data, the denial notice does not disclose that First Capital account data was a contributing factor, and consumers have no mechanism to dispute the accuracy of the underlying account data used in the AI scoring model. FCRA Section 615 adverse action requirements and CFPB guidance on AI in lending require that consumers be notified when consumer report data — including bank account transaction data used in credit scoring — contributes to an adverse credit decision; the open banking data pipeline into third-party AI credit models without adverse action disclosure integration creates a systemic FCRA compliance gap across all third-party lenders using First Capital data.`,
    keywords: ['CFPB Section 1033', 'FCRA', 'open banking AI', 'adverse action', 'consumer rights'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1655',
    name: 'AI-Driven Deposit Retention Campaign Targets Customers Showing Early Attrition — CFPB Concern',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      `First Capital's digital banking AI identifies customers showing attrition signals — declining balance, reduced transaction frequency, new external account funding — and automatically triggers a retention campaign offering rate concessions and fee waivers to prevent deposit outflow; the retention offers are differentiated by predicted customer lifetime value, with higher-value customers receiving more favorable retention offers than lower-value customers showing the same attrition behavior. CFPB UDAAP principles and ECOA prohibit the provision of different terms and conditions to similarly situated customers based on protected characteristics or proxies; First Capital's customer lifetime value model includes income and product usage signals correlated with demographic characteristics, creating a disparate treatment risk in the digital retention program that the bank's compliance team has not reviewed for fair lending implications.`,
    keywords: ['CFPB UDAAP', 'ECOA', 'AI retention campaign', 'digital banking', 'disparate treatment'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1656',
    name: 'Commercial Digital Portal AI Payment Routing Bypasses Dual-Control — Wire Fraud Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's digital commercial banking portal includes an AI payment routing assistant that allows single authorized users to initiate and submit wire transfers to pre-approved payees without a second approver step, on the basis that the AI's fraud scoring has already assessed the payment as low-risk; the AI-assisted single-approval pathway for pre-approved payees is exploited when a business email compromise attack obtains the credentials of an authorized user and changes a payee's bank account number, which the AI does not flag as a change event requiring re-enrollment. FFIEC guidance on authentication and wire transfer fraud requires dual-control for high-value transfers regardless of automation in the payment assessment step; the AI routing assistant's single-approval shortcut for pre-approved payees creates a critical control gap that a BEC attack exploits for a $1.2M fraudulent wire before the detection system flags the beneficiary account change.`,
    keywords: ['FFIEC authentication guidance', 'dual control', 'AI payment routing', 'BEC fraud', 'commercial banking portal'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1657',
    name: 'AI Chatbot Collects Sensitive Account Data in Unencrypted Chat Log — PCI DSS Breach',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      `First Capital's LLM-powered customer service chatbot prompts customers to confirm their identity by providing account numbers and the last four digits of their Social Security Number in the chat interface; the chat transcripts — including account numbers and partial SSNs — are retained in the chatbot vendor's cloud logging infrastructure without encryption at rest, creating a PCI DSS Requirement 3.4 violation for account numbers logged in chat transcripts and a GLBA Safeguards Rule violation for SSN data stored without adequate security controls. PCI DSS and the FTC's GLBA Safeguards Rule require that cardholder data and sensitive personal financial information be protected with defined security controls including encryption at rest; the chatbot's identity verification design and the vendor's logging configuration created a data security gap that First Capital discovers during a PCI QSA assessment of the chatbot integration.`,
    keywords: ['PCI DSS', 'GLBA Safeguards Rule', 'LLM chatbot', 'OCC 2013-29', 'data security'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1658',
    name: 'AI Onboarding Document Verification Vendor Not Assessed Under TPRM — Data Residency Unknown',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      `First Capital integrates an AI-powered identity document verification vendor into its digital account opening platform; the vendor processes images of government-issued IDs including passports and driver licenses submitted by customers during onboarding, but First Capital's third-party risk management team has not assessed the vendor under its OCC 2013-29 TPRM framework, meaning the data residency of the ID images, the vendor's subprocessor chain, and its security incident response obligations are unknown. OCC 2013-29 and the FFIEC's guidance on third-party relationships require that banks conduct due diligence on all third parties that handle sensitive customer information before deployment; an AI vendor processing government ID images without a completed TPRM assessment creates a data sovereignty and breach notification risk — if the vendor experiences a data breach affecting First Capital customers' government ID images, the bank has no contractual notification timeline, no established incident response protocol, and no data deletion right.`,
    keywords: ['OCC 2013-29', 'TPRM', 'AI document verification', 'FFIEC third-party risk', 'data residency'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
  {
    code: 'B1659',
    name: 'Digital Banking Transformation Program AI Governance Not Integrated Into OCC Consent Order Remediation',
    officeCategory: 'middle_office',
    failureRatePct: 80,
    description:
      `First Capital's digital transformation program deploys eight AI-powered capabilities — including the LLM chatbot, fraud scoring model, eKYC AI, and AI pre-approval engine — on an accelerated timeline to meet competitive digital banking benchmarks, but the program's governance framework treats these AI deployments as digital product launches rather than as model risk events requiring SR 11-7 validation, fair lending testing, and consent order milestone integration. The OCC's MRM consent order requires that all models meeting the SR 11-7 definition be in the validated model inventory with completed validation documentation by defined milestones; when the OCC's next examination reviews First Capital's model inventory, the examiner team identifies seven of the eight digital AI deployments as unregistered, unvalidated models that constitute a consent order breach and evidence that the bank's digital transformation program is operating outside of its model risk governance framework.`,
    keywords: ['SR 11-7', 'consent order', 'OCC 2011-12', 'digital transformation AI', 'MRM compliance'],
    demoRelevant: true,
    subTopic: 'ai-digital',
  },
];
