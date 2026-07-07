// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns — Cybersecurity, ACARS/Avionics Security & IT Governance
// Domain 16: Airline Cybersecurity — ACARS/Avionics Security & IT Security Governance
// Code range: A4800–A5099 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-airline-dom16-cybersecurity.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineCyberPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
}

export const AIRLINE_CYBER_PATTERNS: AirlineCyberPatternSeed[] = [

  // ── PSS/GDS API Credential Exposure (A4800–A4814) ────────────────────────
  {
    code: 'A4800',
    name: 'PSS API Credential Leak Enabling Phantom Booking Attacks',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Hardcoded PSS API credentials in third-party booking channel integrations are exposed via public code repositories or misconfigured CI/CD pipelines — automated bots exploit credential stuffing to generate phantom reservations that deplete peak-date inventory, as demonstrated in the SkyHarbor 2023 incident that consumed 12% of high-value seat inventory before detection.',
    keywords: ['PSS API', 'credential stuffing', 'phantom booking', 'inventory depletion', 'GDS API', 'credential leak'],
  },
  {
    code: 'A4801',
    name: 'GDS API Shared Secret Rotation Failure',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Airlines issue static GDS API shared secrets to travel management companies and OTAs without enforcing rotation schedules — compromised secrets circulate in threat actor marketplaces for months before revocation, enabling sustained fraudulent booking queries that inflate fare-cache load and distort revenue management signals.',
    keywords: ['GDS API', 'secret rotation', 'shared secret', 'OTA', 'revenue management', 'credential lifecycle'],
  },
  {
    code: 'A4802',
    name: 'NDC API Rate Limiting Absent During Flash Sales',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'New Distribution Capability API endpoints lack adaptive rate limiting calibrated to normal vs. fare-sale traffic patterns — unauthenticated or weakly-authenticated scraper bots saturate offer and order endpoints during promotional events, degrading availability for legitimate customers and creating phantom-hold inventory that expires unsold.',
    keywords: ['NDC API', 'rate limiting', 'fare sale', 'DDoS', 'PSS API', 'inventory hold'],
  },
  {
    code: 'A4803',
    name: 'Booking API OAuth Token Scope Too Broad',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'OAuth 2.0 tokens issued to partner booking integrations carry read-write scopes across all fare classes and booking operations when only itinerary-query scope is needed — token theft or partner compromise enables attackers to modify existing bookings, upgrade seat classes without payment, and access PNR data beyond the authorised commercial relationship.',
    keywords: ['OAuth', 'API scope', 'PSS API', 'PNR data', 'least privilege', 'token theft'],
  },
  {
    code: 'A4804',
    name: 'Legacy XML SOAP Booking API Without Authentication Enforcement',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Airlines maintain legacy SOAP/XML booking service interfaces for older GDS connections with IP-allowlist-only authentication while REST modernisation is in progress — IP spoofing or allowlist misconfiguration exposes booking mutation operations including seat assignments, special service requests, and frequent flyer number additions without credential verification.',
    keywords: ['SOAP API', 'GDS API', 'IP allowlist', 'legacy integration', 'authentication', 'PSS'],
  },
  {
    code: 'A4805',
    name: 'API Gateway Logging Gap Prevents Phantom Booking Forensics',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'PSS and GDS API traffic flows through aggregation layers that strip client IP, session, and timing metadata before log ingestion — when phantom booking campaigns are detected via revenue anomalies, security teams cannot reconstruct the attack timeline, quantify affected inventory, or attribute activity to specific compromised partner credentials.',
    keywords: ['API gateway', 'PSS API', 'logging', 'forensics', 'phantom booking', 'SIEM'],
  },
  {
    code: 'A4806',
    name: 'Inventory Depletion Bot Traffic Indistinguishable From Legitimate Peaks',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'Booking bots mimicking browser fingerprints and realistic inter-request timing are not distinguished from genuine customers by WAF and bot-management rules tuned for older attack signatures — revenue management algorithms interpret artificially high hold rates as genuine demand, driving dynamic pricing above market-clearing levels and suppressing actual bookings.',
    keywords: ['bot detection', 'WAF', 'inventory depletion', 'revenue management', 'phantom booking', 'PSS API'],
  },
  {
    code: 'A4807',
    name: 'Third-Party Booking Widget Script Injection Risk',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Airline booking flows embed third-party JavaScript widgets for seat selection, ancillary upsell, and payment without subresource integrity checks or content security policy enforcement — compromised CDN or widget provider injects skimming scripts that exfiltrate payment card and passport data entered during booking without triggering airline-side detection.',
    keywords: ['script injection', 'CSP', 'subresource integrity', 'booking widget', 'payment skimming', 'PNR data'],
  },
  {
    code: 'A4808',
    name: 'PSS Batch Export Credentials Stored In Plaintext Config',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Nightly PSS batch exports to revenue accounting, loyalty, and operations systems use service account credentials stored in plaintext configuration files on application servers — lateral movement from a compromised server gives attackers bulk access to PNR export files containing passport numbers, contact data, and payment tokens for millions of passengers.',
    keywords: ['PSS', 'batch export', 'plaintext credentials', 'PNR data', 'service account', 'PAM'],
  },
  {
    code: 'A4809',
    name: 'Partner API Key Proliferation Without Inventory Tracking',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'API key issuance to charter operators, corporate booking tools, and loyalty partners is managed through informal email requests without a central registry — security teams cannot enumerate active keys, revoke departed partner access promptly, or detect anomalous usage patterns against individual partner quotas during active incident response.',
    keywords: ['API key management', 'PSS API', 'partner access', 'key inventory', 'access revocation', 'IAM'],
  },
  {
    code: 'A4810',
    name: 'Automated Fare Arbitrage Bots Exploiting Pricing API',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'Revenue management pricing APIs consumed by metasearch aggregators are queried at sub-second intervals by arbitrage bots that hold low fares and resell at margin — the airline bears the reservation system transaction cost for phantom holds while losing the revenue premium from genuine customers who see inflated prices on direct channels.',
    keywords: ['pricing API', 'fare arbitrage', 'metasearch', 'revenue management', 'PSS API', 'bot detection'],
  },
  {
    code: 'A4811',
    name: 'Refund API Abuse Via Automated Cancellation Cycling',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Refundable fare booking APIs lack velocity controls on cancel-and-rebook cycling — attackers book peak dates at base fares, hold inventory through the sales window, then cancel at the last moment; the airline loses peak-date yield while the attacker optionally resells the now-scarce availability through secondary markets.',
    keywords: ['refund API', 'PSS API', 'cancellation abuse', 'inventory hold', 'revenue leakage', 'velocity controls'],
  },
  {
    code: 'A4812',
    name: 'Interline Billing API Credential Compromise',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Interline settlement APIs connecting airline billing systems to IATA clearing house lack mutual TLS authentication — credential theft enables fraudulent interline billing submissions that inflate receivables, distort revenue accounting, and create audit findings that require months of bilateral reconciliation to unwind.',
    keywords: ['interline billing', 'IATA', 'API authentication', 'mutual TLS', 'revenue accounting', 'settlement'],
  },
  {
    code: 'A4813',
    name: 'DCS API Check-In Token Reuse Vulnerability',
    officeCategory: 'front_office',
    failureRatePct: 60,
    description:
      'Departure control system API tokens issued during online check-in are not single-use and lack binding to device fingerprint or IP — token interception via insecure Wi-Fi or API response caching enables an attacker to complete check-in for another passenger, obtaining a boarding pass without a valid booking or completing seat upgrades without payment.',
    keywords: ['DCS', 'check-in token', 'token reuse', 'boarding pass', 'API security', 'session management'],
  },
  {
    code: 'A4814',
    name: 'Cargo Booking API Without Hazmat Declaration Integrity Controls',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'Cargo management system APIs accept electronic air waybill submissions from freight forwarders without digital signature validation of dangerous goods declarations — forged or tampered hazmat declarations submitted through compromised forwarder credentials create safety and regulatory exposure when undeclared hazardous material is loaded without crew awareness.',
    keywords: ['cargo API', 'hazmat', 'air waybill', 'dangerous goods', 'digital signature', 'freight forwarder'],
  },

  // ── ACARS Message Injection Risks (A4815–A4829) ──────────────────────────
  {
    code: 'A4815',
    name: 'Unauthenticated VHF ACARS Message Injection',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'VHF ACARS (Aircraft Communication Addressing and Reporting System) subnetwork messages between aircraft and airline operations control lack cryptographic authentication — ground-based software-defined radio equipment costing under $1,000 can inject spoofed ACARS messages that alter weather uplinks, divert advisories, or clearance confirmations displayed to flight crew on ACARS printers or CDUs.',
    keywords: ['ACARS', 'VHF ACARS', 'message injection', 'spoofing', 'flight operations', 'ARINC'],
  },
  {
    code: 'A4816',
    name: 'ACARS Ground Network Without Message Integrity Verification',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Airline operations control ACARS ground server infrastructure processes inbound aircraft messages without verifying message integrity fields or validating sender registration numbers against active fleet manifests — manipulated maintenance fault reports, fuel load confirmations, or weight-and-balance data could reach operations without detection under current controls.',
    keywords: ['ACARS', 'ARINC', 'message integrity', 'operations control', 'ground network', 'avionics cybersecurity'],
  },
  {
    code: 'A4817',
    name: 'SATCOM ACARS Channel Not Separated From Internet Traffic',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Airlines routing ACARS over SATCOM (Inmarsat SwiftBroadband or Iridium) share bandwidth allocation management with cabin passenger Wi-Fi on the same SATCOM terminal without traffic isolation — bandwidth exhaustion attacks targeting passenger Wi-Fi degrade ACARS message delivery latency for operational messages including OOOI times, fuel figures, and maintenance pre-notifications.',
    keywords: ['SATCOM', 'ACARS', 'Inmarsat', 'Iridium', 'network segregation', 'passenger Wi-Fi'],
  },
  {
    code: 'A4818',
    name: 'HF ACARS Relay Station Susceptible To Radio Frequency Interference',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Long-haul oceanic routes using HF ACARS for position reporting and SELCAL lack redundant relay station coverage — deliberate or unintentional HF band interference disrupts ACARS position reporting, degrading oceanic track separation assurance and forcing ATC to apply increased separation standards that reduce airspace capacity.',
    keywords: ['HF ACARS', 'oceanic operations', 'radio frequency interference', 'SELCAL', 'ATC', 'ACARS'],
  },
  {
    code: 'A4819',
    name: 'ACARS Printer Output Not Classified As Sensitive Operations Data',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Flight deck ACARS printer output containing ATC clearances, meteorological data, company route amendments, and maintenance advisory messages is treated as low-sensitivity paper waste — discarded ACARS printouts recovered from crew rest areas or aircraft cleaning crews provide adversaries with detailed operational parameters including fuel states and alternate airports.',
    keywords: ['ACARS', 'flight deck', 'information security', 'operations security', 'paper waste', 'sensitive data'],
  },
  {
    code: 'A4820',
    name: 'ACARS Downlink Message Interception Via SDR',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Aircraft-to-ground ACARS downlink messages including position reports, engine health monitoring data, and fuel figures are transmitted in plaintext over VHF — software-defined radio receivers at airports passively collect fleet-wide operational telemetry that competitors or adversaries can correlate with ADS-B to build precise airline operational intelligence.',
    keywords: ['ACARS', 'SDR', 'VHF ACARS', 'interception', 'position report', 'operational intelligence'],
  },
  {
    code: 'A4821',
    name: 'ACARS Network Gateway Lacks Anomaly Detection For Unusual Message Patterns',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Airline ACARS ground network gateways process hundreds of message types without behavioural baseline rules that flag unusually high message frequencies, unexpected message types from specific tail numbers, or messages arriving from unregistered ACARS addresses — anomalous injection attempts blend into normal traffic without triggering security alerts.',
    keywords: ['ACARS', 'anomaly detection', 'SIEM', 'ARINC', 'network gateway', 'avionics cybersecurity'],
  },
  {
    code: 'A4822',
    name: 'FMS Data Uplink Via ACARS Without Source Validation',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'Flight management system route uplinks transmitted via ACARS datalink are accepted by avionics from any valid ACARS ground address without airline-specific cryptographic binding — a compromised ACARS ground service provider or rogue ground station could transmit route modifications, fuel reserves, or alternate airport changes that flight crew must manually cross-check against paper documents.',
    keywords: ['FMS', 'ACARS', 'route uplink', 'avionics cybersecurity', 'DO-326A', 'source validation'],
  },
  {
    code: 'A4823',
    name: 'Electronic Flight Bag ACARS Integration Without Certificate Pinning',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'EFB applications that display ACARS-received weather, NOTAMs, and performance data connect to ground servers over cellular or Wi-Fi without certificate pinning — man-in-the-middle attacks on airport or hotel Wi-Fi networks can present fraudulent weather or NOTAM data to pilots prior to flight without triggering app-level TLS warnings.',
    keywords: ['EFB', 'ACARS', 'certificate pinning', 'man-in-the-middle', 'NOTAM', 'weather data'],
  },
  {
    code: 'A4824',
    name: 'ACARS Message Retention Policy Non-Compliant With ICAO Annex 6',
    officeCategory: 'back_office',
    failureRatePct: 56,
    description:
      'Airline ACARS message archives are overwritten on rolling 30-day windows to manage storage costs — ICAO Annex 6 and national aviation authority regulations require retention of operational communications for accident investigation purposes; message gaps discovered during post-incident investigations have led to regulatory findings and protracted legal proceedings.',
    keywords: ['ACARS', 'ICAO', 'message retention', 'Annex 6', 'accident investigation', 'compliance'],
  },
  {
    code: 'A4825',
    name: 'ACARS Sub-Network Provider Audit Rights Not Exercised',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Airlines rely on ARINC or SITA as ACARS sub-network operators but do not exercise contractual audit rights for security practices, personnel vetting, or physical access controls at ground station sites — a third-party security assessment of the shared ACARS network infrastructure has never been commissioned, creating unknown supply chain exposure for operational communications.',
    keywords: ['ACARS', 'ARINC', 'SITA', 'supply chain security', 'third-party audit', 'vendor risk'],
  },
  {
    code: 'A4826',
    name: 'ADS-C / CPDLC Authentication Weakness On Oceanic Routes',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Automatic Dependent Surveillance-Contract and Controller-Pilot Data Link Communications over ACARS on North Atlantic Tracks use legacy authentication mechanisms that predate current ICAO cybersecurity guidance — known vulnerabilities in the FANS-1/A protocol allow an adversary with access to the ACARS subnetwork to inject ATC-formatted messages that could be mistaken for genuine controller instructions.',
    keywords: ['ADS-C', 'CPDLC', 'ACARS', 'FANS-1/A', 'oceanic routes', 'avionics cybersecurity'],
  },
  {
    code: 'A4827',
    name: 'Line Maintenance ACARS Terminal Physical Security Gap',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Line maintenance ACARS ground terminals at outstations are installed in unlocked maintenance crew rooms accessible to contract staff from multiple handlers — physical access to ACARS terminals enables message injection into the airline subnetwork without IT system credentials, bypassing all network-level access controls.',
    keywords: ['ACARS', 'physical security', 'line maintenance', 'outstation', 'terminal access', 'insider threat'],
  },
  {
    code: 'A4828',
    name: 'ACARS Security Incident Not Escalated To A-ISAC',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Anomalous ACARS message patterns detected by the airline operations control team are investigated internally without notification to the Aviation Information Sharing and Analysis Center — peer airlines operating the same aircraft types and ACARS configurations are not alerted to the potential injection campaign, allowing the same attack vector to succeed against multiple carriers.',
    keywords: ['ACARS', 'A-ISAC', 'incident sharing', 'threat intelligence', 'aviation cybersecurity', 'information sharing'],
  },
  {
    code: 'A4829',
    name: 'Cabin Crew EFB ACARS Access Broader Than Role Requires',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'Cabin crew EFB applications provisioned with the same MDM profile as flight deck EFBs receive ACARS operational message feeds beyond safety briefings and passenger data — excessive ACARS data access on cabin crew devices that are more frequently connected to untrusted networks expands the attack surface for operational communications compromise.',
    keywords: ['EFB', 'ACARS', 'least privilege', 'MDM', 'cabin crew', 'role-based access'],
  },

  // ── Avionics Supply Chain Security (A4830–A4844) ─────────────────────────
  {
    code: 'A4830',
    name: 'Avionics LRU Software Without CVE Monitoring Programme',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'Airline engineering departments maintain inventories of Line Replaceable Units running embedded software versions from OEM suppliers without a systematic CVE monitoring programme — published vulnerabilities in third-party RTOS and communication stack components embedded in avionics go untracked until the aircraft OEM issues an Airworthiness Directive, creating multi-year exposure windows.',
    keywords: ['avionics supply chain', 'LRU', 'CVE monitoring', 'DO-326A', 'airworthiness directive', 'embedded software'],
  },
  {
    code: 'A4831',
    name: 'Counterfeit Avionics Component Detection Gap In MRO Supply Chain',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'MRO suppliers sourcing avionics components through distributors do not systematically verify component authenticity against OEM serialisation databases — counterfeit or unapproved parts with unverified software loads have been installed in aircraft avionics bays, creating both airworthiness and cybersecurity risks when firmware backdoors are subsequently discovered.',
    keywords: ['avionics supply chain', 'counterfeit parts', 'MRO', 'component authenticity', 'supply chain security', 'firmware'],
  },
  {
    code: 'A4832',
    name: 'Avionics Software Load Verification Not Performed After Maintenance',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Aircraft maintenance procedures for avionics software updates verify part number and version strings against the approved software configuration list but do not perform cryptographic hash verification of the loaded software image — a tampered software image with matching version metadata could be installed without detection, satisfying airworthiness release documentation.',
    keywords: ['avionics cybersecurity', 'software load', 'DO-326A', 'cryptographic verification', 'maintenance', 'AFDX'],
  },
  {
    code: 'A4833',
    name: 'DO-326A Compliance Gap In Avionics Supplier Contracts',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Avionics component procurement contracts with third-party suppliers predate the publication of DO-326A/ED-202A (Aviation Cybersecurity Standards) and do not include cybersecurity assurance requirements, SBOM delivery obligations, or vulnerability disclosure commitments — the airline cannot assess cybersecurity posture of installed avionics without renegotiating legacy supplier agreements.',
    keywords: ['DO-326A', 'avionics cybersecurity', 'supply chain security', 'SBOM', 'ED-202A', 'supplier contract'],
  },
  {
    code: 'A4834',
    name: 'Aircraft Data Network Maintenance Port Access Not Controlled Post-Maintenance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Aircraft Data Network (ADN) maintenance access ports in the avionics bay are not systematically sealed after maintenance completion — physical access to unsealed maintenance ports by ground handlers, cleaning crews, or third-party maintenance personnel during aircraft turnarounds provides a vector for unauthorised avionics data network access without triggering any electronic audit trail.',
    keywords: ['aircraft data network', 'AFDX', 'maintenance port', 'physical security', 'avionics cybersecurity', 'ARINC 664'],
  },
  {
    code: 'A4835',
    name: 'Avionics SBOM Not Available For Vulnerability Impact Assessment',
    officeCategory: 'back_office',
    failureRatePct: 76,
    description:
      'Airlines receive certified avionics LRUs from OEMs without software bill of materials documentation — when a critical vulnerability is disclosed in an open-source component commonly used in avionics RTOS (e.g. VxWorks URGENT/11), the airline cannot determine which aircraft or LRU versions are affected without conducting an expensive OEM-led fleet-wide software audit.',
    keywords: ['SBOM', 'avionics cybersecurity', 'vulnerability management', 'DO-326A', 'LRU', 'supply chain security'],
  },
  {
    code: 'A4836',
    name: 'Third-Party Avionics Maintenance Tool Software Unvetted',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Authorised Maintenance Organisations use laptop-based Ground Support Equipment loaded with avionics maintenance software from OEM portals without verifying the integrity of downloaded installers — a compromised OEM software distribution portal or man-in-the-middle interception during download could deliver trojanised maintenance tools that modify avionics configuration during legitimate maintenance tasks.',
    keywords: ['ground support equipment', 'avionics maintenance', 'supply chain security', 'software integrity', 'AMO', 'DO-326A'],
  },
  {
    code: 'A4837',
    name: 'Avionics OEM Patch Deployment Dependent On Airline-Funded AD Compliance',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Avionics cybersecurity patches from OEMs are delivered through the Airworthiness Directive system, requiring airlines to fund and schedule maintenance downtime — the patch deployment lag between OEM release and fleet-wide compliance averages 18–36 months for non-safety-critical findings, leaving known attack surfaces open across the fleet long after remediation tooling is available.',
    keywords: ['avionics cybersecurity', 'airworthiness directive', 'patch management', 'DO-326A', 'OEM', 'fleet compliance'],
  },
  {
    code: 'A4838',
    name: 'IFE System Software Supply Chain Not Reviewed Under Avionics Security Framework',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'In-flight entertainment system software and content management is procured and updated outside the airline avionics cybersecurity governance process — IFE supplier software updates transmitted to aircraft via broadband datalink are not subject to the same integrity verification and configuration management controls applied to FAA-certified avionics, despite IFE systems sharing aircraft data buses.',
    keywords: ['IFE', 'in-flight entertainment', 'supply chain security', 'avionics cybersecurity', 'ARINC 664', 'software update'],
  },
  {
    code: 'A4839',
    name: 'Avionics Cybersecurity Incident Reporting To Regulator Not Formalised',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Airlines lack a documented process for determining when an avionics cybersecurity event meets the threshold for mandatory reporting to the FAA under AC 20-152A or EASA under ED-202A guidance — security teams and airworthiness engineers operate in separate reporting chains, creating risk that a cybersecurity event with airworthiness implications is not escalated to the competent authority within required timeframes.',
    keywords: ['avionics cybersecurity', 'FAA', 'EASA', 'AC 20-152A', 'ED-202A', 'incident reporting'],
  },
  {
    code: 'A4840',
    name: 'Aircraft ACMS Data Export To Cloud Without Encryption In Transit',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Aircraft Condition Monitoring System data transmitted from aircraft to airline health monitoring platforms via SATCOM or VHF datalink is not encrypted in transit — bulk ACMS data containing engine performance parameters, system fault codes, and structural load data is intercepted by competitors or state actors for fleet performance intelligence gathering.',
    keywords: ['ACMS', 'aircraft health monitoring', 'SATCOM', 'encryption in transit', 'avionics cybersecurity', 'data exfiltration'],
  },
  {
    code: 'A4841',
    name: 'Avionics Configuration Database Access Control Insufficient',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'The airline engineering database containing approved software configuration lists, part number cross-references, and avionics modification records is accessible to all engineering staff without role-based access controls — unauthorised modification of approved configuration data could lead maintenance engineers to load incorrect software versions without triggering a discrepancy alert.',
    keywords: ['avionics configuration', 'access control', 'IAM', 'engineering database', 'DO-326A', 'RBAC'],
  },
  {
    code: 'A4842',
    name: 'Ground Support Equipment Laptop USB Policy Not Enforced On Avionics Networks',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Aircraft maintenance laptops used to connect to avionics Ground Support Equipment ports are subject to corporate USB policy in theory but enforcement through endpoint protection tools is inconsistently applied — removable media carrying malware introduced via personal use of maintenance laptops has been identified as an infection vector in aviation security incident case studies.',
    keywords: ['ground support equipment', 'USB policy', 'endpoint protection', 'avionics cybersecurity', 'malware', 'maintenance laptop'],
  },
  {
    code: 'A4843',
    name: 'Avionics Cybersecurity Training Not Mandatory For Licensed Engineers',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'EASA Part-66 and FAA A&P licensing curricula do not include avionics cybersecurity modules — licensed aircraft maintenance engineers perform software-load and avionics configuration tasks without formal training on supply chain integrity, software verification, or recognising indicators of tampering, leaving human-layer defences absent from the maintenance process.',
    keywords: ['avionics cybersecurity', 'maintenance training', 'EASA Part-66', 'FAA', 'supply chain security', 'DO-326A'],
  },
  {
    code: 'A4844',
    name: 'Fleet-Wide Avionics Vulnerability Scan Not Technically Feasible Under Current Architecture',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Airline security teams cannot perform active vulnerability scanning of avionics systems because doing so requires OEM-approved test environments and specialised tooling unavailable in commercial security scanner catalogues — the entire avionics attack surface remains unassessed by any quantitative vulnerability management process, relying solely on OEM disclosure for known issues.',
    keywords: ['avionics cybersecurity', 'vulnerability scanning', 'DO-326A', 'OEM', 'attack surface', 'ARINC 664'],
  },

  // ── Passenger Wi-Fi Network Segregation (A4845–A4859) ────────────────────
  {
    code: 'A4845',
    name: 'Passenger Wi-Fi VLAN Routing Misconfiguration Breaches OT Isolation',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Aircraft cabin Wi-Fi VLAN configurations on the in-flight connectivity unit share routing table entries with the aircraft data network segments — a misconfigured inter-VLAN routing rule discovered during a penetration test allowed a passenger device to reach avionics data bus segments, representing a potential ARINC 664/AFDX network bridging vulnerability.',
    keywords: ['passenger Wi-Fi', 'VLAN', 'network segregation', 'ARINC 664', 'AFDX', 'OT/IT convergence'],
  },
  {
    code: 'A4846',
    name: 'Inflight Wi-Fi Captive Portal Running Outdated TLS Configuration',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Cabin Wi-Fi captive portal authentication pages served by the IFEC management unit use TLS 1.0 and weak cipher suites not remediated during routine updates — passengers connecting via modern browsers receive certificate warnings, and legacy cipher downgrade attacks allow interception of authentication tokens and payment credentials entered at the captive portal.',
    keywords: ['passenger Wi-Fi', 'TLS', 'captive portal', 'cipher suite', 'IFEC', 'credential interception'],
  },
  {
    code: 'A4847',
    name: 'Passenger Wi-Fi Gateway Firmware Unpatched On Extended Deployments',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'In-flight connectivity hardware deployed on long-haul aircraft operates on firmware versions 18–36 months behind the connectivity vendor release schedule — airlines defer firmware updates to avoid certification re-entry costs, leaving known remote code execution vulnerabilities in the cabin Wi-Fi gateway accessible from the passenger network.',
    keywords: ['passenger Wi-Fi', 'firmware patching', 'IFEC', 'vulnerability management', 'certification', 'in-flight connectivity'],
  },
  {
    code: 'A4848',
    name: 'Aircraft Satellite Modem Management Interface Exposed To Passenger Network',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The SATCOM terminal management interface used for capacity allocation, beam switching, and modem configuration is reachable from the passenger Wi-Fi subnet due to a missing firewall rule — an attacker on the passenger network could reach the modem management console, potentially disrupting all aircraft-to-ground communications including ACARS operational messages routed over the same SATCOM link.',
    keywords: ['SATCOM', 'modem management', 'passenger Wi-Fi', 'network segregation', 'ACARS', 'firewall'],
  },
  {
    code: 'A4849',
    name: 'Crew Network Segment Reachable From Passenger Wi-Fi Via Misconfigured AP',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'An access point serving the galley crew Wi-Fi network is configured on a VLAN that has a routing path to the passenger cabin network due to an incorrectly applied firmware template during fleet modification — crew devices accessing airline applications over this segment are exposed to passenger network traffic without any layer 3 isolation.',
    keywords: ['passenger Wi-Fi', 'crew network', 'VLAN misconfiguration', 'network segregation', 'access point', 'OT/IT convergence'],
  },

  {
    code: 'A4850',
    name: 'Inflight Connectivity Provider Security Posture Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Airlines rely on third-party inflight connectivity providers for SATCOM-to-internet gateway services without performing annual security assessments or requiring SOC 2 Type II attestation — a compromise of the shared connectivity provider ground infrastructure could give an attacker persistent access to aircraft communications for the entire connected fleet.',
    keywords: ['inflight connectivity', 'third-party risk', 'SATCOM', 'SOC 2', 'vendor risk', 'passenger Wi-Fi'],
  },
  {
    code: 'A4851',
    name: 'Passenger Device Peer-to-Peer Traffic Not Isolated On Cabin Network',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Cabin Wi-Fi access points do not enforce client isolation — passengers can initiate direct connections to other passenger devices on the same Wi-Fi subnet, enabling network scanning, credential sniffing, and exploitation of unpatched passenger laptops by malicious actors who book adjacent seats specifically to target business travellers.',
    keywords: ['passenger Wi-Fi', 'client isolation', 'peer-to-peer', 'network security', 'IFEC', 'cabin network'],
  },
  {
    code: 'A4852',
    name: 'IFE Seat-Back System Software Update Process Lacks Integrity Checks',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'In-flight entertainment seat-back unit content and software updates are delivered over the cabin network from an aircraft content server without cryptographic signing or integrity verification of update packages — a compromised content server or network-level injection could deliver malicious software to all IFE units simultaneously, affecting passenger experience systems fleet-wide.',
    keywords: ['IFE', 'software update', 'content server', 'integrity verification', 'ARINC 664', 'cabin network'],
  },
  {
    code: 'A4853',
    name: 'Passenger Wi-Fi DNS Resolver Not Filtering Malicious Domains',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'The aircraft cabin Wi-Fi DNS resolver forwards all passenger queries to the connectivity provider without applying threat intelligence-based domain filtering — passengers are exposed to phishing sites, malware command-and-control domains, and DNS tunnelling attacks that could exfiltrate passenger data from compromised devices through the airline-provisioned connectivity infrastructure.',
    keywords: ['passenger Wi-Fi', 'DNS filtering', 'threat intelligence', 'cabin network', 'malware', 'phishing'],
  },
  {
    code: 'A4854',
    name: 'Cabin Network Security Event Logs Not Forwarded To Ground SIEM',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Security events generated by aircraft cabin network equipment (firewall denials, authentication failures, port scans) are stored locally on aircraft with no mechanism to transmit logs to ground SIEM infrastructure during flight — security incidents in the cabin network are invisible to the airline SOC until aircraft lands and ground connectivity is restored.',
    keywords: ['cabin network', 'SIEM', 'security logging', 'passenger Wi-Fi', 'SOC', 'incident detection'],
  },
  {
    code: 'A4855',
    name: 'Aircraft Broadband Modem Default Credentials Not Changed On Deployment',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'SATCOM terminal and cabin Wi-Fi gateway devices are deployed with default vendor credentials for management interfaces that are documented in publicly available installation manuals — threat actors aware of the specific hardware models installed on an airline fleet can attempt default credential access to connectivity hardware from the passenger network or from ground-side internet connections.',
    keywords: ['default credentials', 'SATCOM', 'passenger Wi-Fi', 'hardcoded credentials', 'modem management', 'in-flight connectivity'],
  },
  {
    code: 'A4856',
    name: 'Cabin Wi-Fi Usage Policy Not Enforced For Crew Devices',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Flight and cabin crew use personal devices on the passenger Wi-Fi network to access airline operational applications including crew scheduling, briefing packs, and HR systems — personal devices on the untrusted passenger network segment create a bridging risk when crew devices also connect to airline internal systems via the same untrusted Wi-Fi without VPN enforcement.',
    keywords: ['passenger Wi-Fi', 'crew policy', 'VPN', 'BYOD', 'network segregation', 'operational data'],
  },
  {
    code: 'A4857',
    name: 'IFE System Clock Synchronisation Exploitable For Session Manipulation',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'IFE systems synchronise clocks from an unvalidated NTP source reachable via the cabin network — NTP spoofing attacks can shift IFE system clocks, invalidating session token expiry logic in entertainment payment workflows and enabling session replay attacks that access paid content without re-authentication.',
    keywords: ['IFE', 'NTP spoofing', 'session management', 'cabin network', 'clock synchronisation', 'authentication'],
  },
  {
    code: 'A4858',
    name: 'Connectivity Hardware End-of-Life Not Triggering Security Review',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Inflight connectivity hardware reaching vendor end-of-support status continues operating in airline fleets because hardware replacement requires heavy maintenance visit scheduling — end-of-support hardware receives no security patches, and the security implications of EOL status are not flagged to the airline CISO or avionics cybersecurity review board.',
    keywords: ['inflight connectivity', 'end-of-life', 'patch management', 'IFEC', 'EOL hardware', 'vendor risk'],
  },
  {
    code: 'A4859',
    name: 'Cross-Fleet Wi-Fi Configuration Drift Between Aircraft Types',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Separate engineering teams manage cabin Wi-Fi security configuration for narrowbody and widebody fleets using different configuration templates that have diverged over time — the narrowbody fleet has stricter inter-VLAN ACLs while the widebody fleet retains legacy permissive rules, creating inconsistent security posture that is invisible to the airline security team due to absent fleet-level configuration management tooling.',
    keywords: ['passenger Wi-Fi', 'configuration management', 'VLAN', 'network segregation', 'fleet management', 'configuration drift'],
  },

  // ── EFB Device Security Management (A4860–A4874) ─────────────────────────
  {
    code: 'A4860',
    name: 'EFB MDM Enrolment Not Enforced Before Network Access',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Electronic Flight Bag device management policy requires MDM enrolment via SOTI MobiControl or Jamf Pro, but network access controls do not verify enrolment status before allowing connections to airline operational services — crew members who have factory-reset their EFBs can reconnect to airline Wi-Fi and access performance calculation tools without re-enrolment, bypassing compliance checks.',
    keywords: ['EFB', 'MDM', 'SOTI MobiControl', 'Jamf Pro', 'network access control', 'device compliance'],
  },
  {
    code: 'A4861',
    name: 'EFB App Side-Loading Enabled On Crew Devices',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      'EFB devices issued to flight crew operate with developer mode or side-loading enabled to support legacy ground-based flight planning integrations — the capability for installing arbitrary APK or IPA files outside the airline-managed app store creates an avenue for crewmembers to install unapproved applications that may exfiltrate operational data or create malware entry points.',
    keywords: ['EFB', 'side-loading', 'MDM', 'app security', 'device management', 'BYOD'],
  },
  {
    code: 'A4862',
    name: 'EFB Performance Application Receiving Unauthenticated Ground Data',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Takeoff and landing performance calculation applications on EFBs receive runway condition, weather, and aircraft weight data from ground systems over unencrypted connections without mutual authentication — fraudulent performance data injected via a network-level attack could cause EFB applications to calculate incorrect V-speeds or runway requirements that flight crew might accept as valid.',
    keywords: ['EFB', 'performance calculation', 'V-speeds', 'avionics cybersecurity', 'data integrity', 'authentication'],
  },
  {
    code: 'A4863',
    name: 'EFB Document Library Sync Not Validated Against Source System',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'Airline Operations Manual, Quick Reference Handbook, and MEL documents synchronised to crew EFBs are distributed from a content management server without digital signatures verifiable on-device — a compromise of the document distribution server or a man-in-the-middle during sync could replace safety-critical procedure documents with modified versions that alter emergency drill content.',
    keywords: ['EFB', 'document integrity', 'Operations Manual', 'QRH', 'digital signature', 'MEL'],
  },
  {
    code: 'A4864',
    name: 'EFB Lost Device Remote Wipe Not Executed Within SLA',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'MDM remote wipe capability for lost EFB devices is dependent on the device having an active cellular or Wi-Fi connection — EFBs left in offline mode at hotels or foreign outstations cannot be wiped until reconnected; the average time-to-wipe for reported lost devices exceeds the airline SLA, leaving route charts, passenger lists, and crew scheduling data accessible.',
    keywords: ['EFB', 'remote wipe', 'MDM', 'device loss', 'SOTI MobiControl', 'data protection'],
  },
  {
    code: 'A4865',
    name: 'Crew EFB Personal Data Co-Mingling With Operational Data',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'Airline-issued EFBs with BYOD policy allow crew personal applications and personal Apple ID or Google account sync alongside operational applications — iCloud or Google Drive backup of EFB devices may transmit airline operational documents, passenger lists, and performance data to personal cloud accounts outside the airline data governance framework.',
    keywords: ['EFB', 'BYOD', 'data governance', 'cloud backup', 'PNR data', 'MDM'],
  },
  {
    code: 'A4866',
    name: 'EFB Vendor Application Security Assessment Not Performed Before Deployment',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Third-party EFB applications for weather, navigation charting, and flight planning are approved for airline deployment based on functional evaluation and vendor self-attestation without an independent mobile application security assessment — static and dynamic analysis of approved EFB apps has not been performed, leaving unknown data handling practices and API security weaknesses undetected.',
    keywords: ['EFB', 'application security', 'mobile VAPT', 'third-party app', 'vendor assessment', 'flight planning'],
  },
  {
    code: 'A4867',
    name: 'EFB Cellular Data Connection Bypassing Airline Secure Proxy',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'EFB applications configured to use airline cellular SIM cards connect directly to airline operational services via cellular without traversing the airline secure web proxy — data loss prevention, URL filtering, and threat inspection that apply to airport-network connections are bypassed when crew access airline systems via cellular, leaving sensitive operational data transmissions unmonitored.',
    keywords: ['EFB', 'cellular data', 'secure proxy', 'DLP', 'network monitoring', 'MDM'],
  },
  {
    code: 'A4868',
    name: 'EFB Jailbreak Detection Bypassable On Flight Deck Devices',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      'MDM jailbreak detection on crew EFBs relies on vendor-provided APIs that are known to be bypassable using publicly documented techniques — a jailbroken EFB can pass MDM compliance checks while running unapproved software with elevated privileges, accessing protected application data stores containing crew authentication tokens and operator certificates.',
    keywords: ['EFB', 'jailbreak detection', 'MDM', 'device integrity', 'Jamf Pro', 'SOTI MobiControl'],
  },
  {
    code: 'A4869',
    name: 'Outdated EFB Operating System Versions Not Triggering Grounding',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'EFB operating system patch policy specifies a maximum age of 90 days for security patches, but compliance measurement is not integrated with crew scheduling — crew members operating with non-compliant OS versions continue to fly because no automated enforcement mechanism prevents login to operational systems from devices failing the patch age check.',
    keywords: ['EFB', 'OS patching', 'MDM', 'patch compliance', 'device management', 'security policy'],
  },
  {
    code: 'A4870',
    name: 'EFB Airport Wi-Fi Auto-Connect Policy Creates Rogue AP Risk',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'EFB devices are configured to automatically connect to known airport Wi-Fi SSIDs without certificate-based network authentication — rogue access points broadcasting trusted SSIDs in terminal areas intercept crew EFB connections, enabling man-in-the-middle attacks on EFB application traffic including crew authentication sessions and route data synchronisation.',
    keywords: ['EFB', 'rogue access point', 'Wi-Fi', 'man-in-the-middle', 'certificate authentication', 'MDM'],
  },
  {
    code: 'A4871',
    name: 'EFB Application API Keys Embedded In App Binaries',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Third-party EFB applications embed API keys for weather data services, navigation chart subscriptions, and airline data connections directly in the compiled application binary — reverse engineering of EFB apps by researchers or competitors exposes API keys that can be used to query airline operational data services without device-level authentication.',
    keywords: ['EFB', 'API key', 'hardcoded credentials', 'mobile security', 'binary analysis', 'reverse engineering'],
  },
  {
    code: 'A4872',
    name: 'EFB Bluetooth Pairing Enabling Data Exfiltration To Unmanaged Devices',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'MDM configuration for EFB devices does not restrict Bluetooth pairing to approved accessories — crew members pair EFBs with personal wireless headsets and smartwatches that have companion apps capable of accessing iOS or Android shared data containers, creating a path for operational document data to transfer to unmanaged personal devices.',
    keywords: ['EFB', 'Bluetooth', 'MDM', 'data exfiltration', 'device pairing', 'DLP'],
  },
  {
    code: 'A4873',
    name: 'EFB Shared Use Between Multiple Crew Members Without Session Separation',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Short-haul fleet EFBs are pooled and shared between multiple crew members across different flights without device session reset between flights — the preceding crew member\'s authentication tokens, cached performance calculations, and route data remain accessible to subsequent crew, creating both data privacy and integrity risks.',
    keywords: ['EFB', 'shared device', 'session management', 'credential sharing', 'MDM', 'access control'],
  },
  {
    code: 'A4874',
    name: 'EFB Security Incident Reporting Channel Not Known To Flight Crew',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'Airline security awareness training for flight crew does not include specific guidance on recognising and reporting EFB security anomalies such as unexpected certificate warnings, unfamiliar network connection prompts, or unusual application behaviour — potential security incidents on EFBs are reported via maintenance defect channels rather than to the airline security operations team, delaying investigation.',
    keywords: ['EFB', 'security awareness', 'incident reporting', 'flight crew', 'security training', 'SOC'],
  },

  // ── Insider Threat: Ramp Agent SIDA Access (A4875–A4884) ─────────────────
  {
    code: 'A4875',
    name: 'SIDA Badge Holder With Network Access And No Behavioural Monitoring',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'Ramp agents and ground handlers holding Security Identification Display Area badges also have wired network access in aircraft maintenance bays and gate rooms — insider threat behavioural monitoring programmes do not extend to non-IT personnel with physical access to airline network infrastructure, creating a blind spot for employees who are simultaneously investigated for security or integrity violations.',
    keywords: ['SIDA badge', 'insider threat', 'ramp agent', 'physical access', 'network access', 'behavioural monitoring'],
  },
  {
    code: 'A4876',
    name: 'Terminated Employee SIDA Badge And Network Access Not Simultaneously Revoked',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'HR offboarding processes trigger SIDA badge deactivation through the airport badging authority and IT account disablement through separate workflows on different timelines — average gap between physical and logical access revocation is 1.8 business days, during which a disgruntled terminated employee retains either physical airport access or network access while both should be simultaneously inactive.',
    keywords: ['SIDA badge', 'offboarding', 'access revocation', 'IAM', 'insider threat', 'joiners-movers-leavers'],
  },
  {
    code: 'A4877',
    name: 'Contractor Ground Handler IT Access Exceeds Operational Requirement',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Third-party ground handling companies whose staff hold airline-sponsored SIDA badges are provisioned with IT accounts that provide read access to the airline DCS beyond the specific aircraft turnarounds they are contracted to handle — excess access accumulates over multi-year contracts and is never reviewed against current operational scope.',
    keywords: ['ground handler', 'SIDA badge', 'access provisioning', 'contractor access', 'DCS', 'least privilege'],
  },
  {
    code: 'A4878',
    name: 'Ramp Area Network Port Active Without Device Registration Requirement',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Network switch ports in aircraft gates, remote stands, and maintenance hangars remain active without 802.1X port authentication — any device physically plugged into an active port in the SIDA-controlled airside area receives a network address and can reach internal airline systems, bypassing all perimeter security controls.',
    keywords: ['802.1X', 'network access control', 'SIDA', 'ramp network', 'physical security', 'airside'],
  },
  {
    code: 'A4879',
    name: 'Insider Data Exfiltration Via USB At Airside Workstations Not Detected',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Airside operational workstations used for departure control, baggage reconciliation, and load planning do not have USB port blocking or DLP policies that log removable media activity — employee data exfiltration of passenger manifests, crew scheduling, and airport slot data via USB drives is not detected until post-incident forensic investigation.',
    keywords: ['insider threat', 'USB', 'DLP', 'airside workstation', 'data exfiltration', 'SIDA'],
  },
  {
    code: 'A4880',
    name: 'Privileged Airside IT Account Shared Between Multiple Maintenance Staff',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Aircraft maintenance and avionics shops use shared IT administrator accounts for GSE laptops and avionics test equipment — shared credentials prevent attribution of configuration changes or data access to specific individuals, making insider threat investigation and forensic reconstruction of events technically impossible without additional forensic investment.',
    keywords: ['shared accounts', 'PAM', 'insider threat', 'airside IT', 'accountability', 'avionics maintenance'],
  },
  {
    code: 'A4881',
    name: 'Security-Cleared Employee Access Review Not Tied To TSA Security Directive Compliance',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'Access reviews for employees with SIDA badges and IT privileges are conducted on annual HR cycles but are not synchronised with TSA cybersecurity directive requirements for continuous personnel vetting — an employee whose background check has lapsed or who is under active investigation retains full airside and system access until the next scheduled HR review cycle.',
    keywords: ['TSA cybersecurity directive', 'SIDA badge', 'access review', 'personnel vetting', 'insider threat', 'continuous monitoring'],
  },
  {
    code: 'A4882',
    name: 'Airside Camera System Footage Not Integrated With IT Access Log Correlation',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'Physical security CCTV covering aircraft maintenance bays and gate areas is managed by airport authority systems not integrated with airline IT access logs — an insider threat investigation requires manual correlation of physical and logical access evidence across separate systems from separate organisations, extending mean time to investigate from hours to weeks.',
    keywords: ['physical security', 'CCTV', 'access log correlation', 'insider threat', 'SIDA', 'forensics'],
  },
  {
    code: 'A4883',
    name: 'Ground Crew Phishing Training Frequency Insufficient Given Airside Access Risk',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Phishing simulation and awareness training is conducted annually for ground operations and ramp staff who hold SIDA badges — the combination of airside physical access and susceptibility to phishing attacks creates a high-impact insider threat vector; annual training frequency is insufficient given the elevated consequence of credential compromise for this employee population.',
    keywords: ['phishing training', 'SIDA badge', 'ground crew', 'insider threat', 'security awareness', 'credential theft'],
  },
  {
    code: 'A4884',
    name: 'Airside Kiosk Shared Login Enabling Passenger Data Access Beyond Check-In Role',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'Self-service kiosk back-office maintenance terminals at gates use a shared operator login that provides access to PNR data and passenger contact information beyond the boarding functions required — ground staff with legitimate kiosk access can query passenger data unrelated to their operational duties without generating an individual audit record.',
    keywords: ['airside kiosk', 'shared login', 'PNR data', 'SIDA', 'insider threat', 'audit trail'],
  },

  // ── DDoS Resilience For Booking Engine (A4885–A4894) ─────────────────────
  {
    code: 'A4885',
    name: 'Booking Engine DDoS Defence Sized For Normal Traffic Not Fare Sale Peaks',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'CDN and DDoS mitigation capacity for the airline booking engine is provisioned based on average daily traffic plus a 3x headroom factor — fare sale events that generate 15–20x normal traffic volumes overwhelm scrubbing capacity, causing legitimate customer connections to be dropped alongside malicious traffic, with revenue impact exceeding DDoS mitigation upgrade costs within a single outage event.',
    keywords: ['DDoS', 'booking engine', 'fare sale', 'CDN', 'traffic engineering', 'availability'],
  },
  {
    code: 'A4886',
    name: 'Application Layer DDoS Indistinguishable From Fare Sale Demand',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      'HTTP/HTTPS layer-7 DDoS attacks targeting PSS booking API endpoints during promoted fare releases use distributed residential proxy networks that generate request patterns identical to genuine customer browsers — WAF and bot management rules calibrated on historical attack signatures fail to distinguish attack traffic, causing either service outage (under-blocking) or false-positive rejection of genuine bookings (over-blocking).',
    keywords: ['DDoS', 'layer-7', 'PSS API', 'fare sale', 'WAF', 'bot management'],
  },
  {
    code: 'A4887',
    name: 'DNS Amplification Attack Pathway Open Via Airline Recursive Resolver',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Airline public-facing DNS infrastructure allows recursive queries from external IP addresses — the resolver is exploitable as an amplification reflector in DNS DDoS attacks, and the misconfiguration has been flagged in external security scans but remediation is blocked pending infrastructure team capacity.',
    keywords: ['DNS', 'DDoS', 'amplification attack', 'DNS security', 'recursive resolver', 'infrastructure'],
  },
  {
    code: 'A4888',
    name: 'PSS Upstream Rate Limits Not Shared With CDN DDoS Mitigation',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'The airline CDN DDoS mitigation layer and the PSS provider-side rate limiting operate independently without sharing real-time capacity signals — CDN-passed traffic that exceeds PSS session limits causes PSS throttling errors that manifest to customers as booking failures without any customer-facing status page or CDN-level graceful degradation response.',
    keywords: ['PSS', 'DDoS', 'CDN', 'rate limiting', 'booking engine', 'capacity planning'],
  },
  {
    code: 'A4889',
    name: 'DDoS Incident Runbook Untested Under Simulated Peak Load',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The airline incident response runbook for DDoS events has not been exercised under simulated fare sale traffic conditions — tabletop exercises identify the runbook steps but do not surface the operational gaps that appear only under real traffic pressure, including CDN escalation contact latency, PSS vendor communication SLAs, and decision authority for emergency DNS changes.',
    keywords: ['DDoS', 'incident response', 'runbook', 'fare sale', 'tabletop exercise', 'booking engine'],
  },
  {
    code: 'A4890',
    name: 'Booking Engine Infrastructure Not Enrolled In A-ISAC DDoS Alert Feed',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'The airline has not integrated A-ISAC threat intelligence feeds into its DDoS mitigation platform — peer airline DDoS attack signatures and infrastructure IOCs shared through A-ISAC are not applied to airline WAF and DDoS scrubbing rules, requiring the airline to detect and characterise attacks independently before effective mitigation begins.',
    keywords: ['A-ISAC', 'DDoS', 'threat intelligence', 'WAF', 'booking engine', 'information sharing'],
  },
  {
    code: 'A4891',
    name: 'Loyalty Redemption API Unprotected During DDoS Events Targeting PSS',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'DDoS mitigation controls are applied at the primary booking engine entry point but do not extend to the loyalty redemption API endpoint — attackers who identify the unprotected API path can route attack traffic through the loyalty API to cause PSS database contention that degrades booking performance without triggering primary DDoS defences.',
    keywords: ['loyalty API', 'DDoS', 'PSS', 'API protection', 'DDoS bypass', 'booking engine'],
  },
  {
    code: 'A4892',
    name: 'Payment Gateway Timeout During DDoS Causes False Booking Failures',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'During DDoS events that degrade booking engine response times, payment gateway transaction timeouts increase — PSS records partial booking states without completed payment confirmation while customers retry payments, resulting in duplicate booking charges, inventory confusion, and customer service overload that amplifies the operational impact beyond the DDoS duration.',
    keywords: ['payment gateway', 'DDoS', 'booking engine', 'timeout', 'PSS', 'duplicate booking'],
  },
  {
    code: 'A4893',
    name: 'Status Page Infrastructure Hosted On Same Origin As Booking Engine',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      'The airline customer-facing status page for booking system availability is hosted on the same CDN origin as the booking engine — DDoS attacks that degrade the booking engine simultaneously make the status page unavailable, preventing customers from receiving communication about the outage and driving call centre volume that further degrades operational response capacity.',
    keywords: ['status page', 'DDoS', 'booking engine', 'availability', 'customer communication', 'CDN'],
  },
  {
    code: 'A4894',
    name: 'DDoS Mitigation Vendor Contract SLA Not Aligned With Revenue Loss Threshold',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'The airline DDoS mitigation contract specifies a 30-minute SLA for large-attack traffic scrubbing activation — revenue loss during a 30-minute booking engine outage during a peak fare sale window exceeds the annual cost of upgrading to a 5-minute SLA service tier; the commercial decision to accept the longer SLA has not been reviewed against current revenue-per-minute booking metrics.',
    keywords: ['DDoS', 'SLA', 'vendor contract', 'revenue impact', 'booking engine', 'risk management'],
  },

  // ── TSA Cybersecurity Directive Compliance (A4895–A4904) ─────────────────
  {
    code: 'A4895',
    name: 'TSA Cybersecurity Directive Applicability Assessment Not Completed',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'Airlines subject to TSA cybersecurity directives for critical aviation infrastructure have not formally documented which of their systems and networks fall within directive scope — without an applicability determination reviewed by legal and compliance, implementation teams apply controls inconsistently, creating regulatory exposure when TSA conducts a compliance review.',
    keywords: ['TSA cybersecurity directive', 'compliance', 'critical infrastructure', 'applicability', 'regulatory', 'aviation security'],
  },
  {
    code: 'A4896',
    name: 'TSA Cybersecurity Incident 24-Hour Reporting Capability Not Tested',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'TSA cybersecurity directives require notification of covered cybersecurity incidents within 24 hours of identification — the airline incident response process has not been drilled specifically against TSA reporting criteria, and the designated cybersecurity coordinator role has not been tested for availability outside business hours, creating risk of missed reporting obligations during an overnight or weekend incident.',
    keywords: ['TSA cybersecurity directive', 'incident reporting', '24-hour notification', 'cybersecurity coordinator', 'incident response', 'compliance'],
  },
  {
    code: 'A4897',
    name: 'Network Segmentation Required By TSA Directive Not Implemented For OCC Systems',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'TSA cybersecurity directive requirements for network segmentation between IT and operational control systems have been acknowledged but not fully implemented for Operations Control Centre infrastructure — OCC workstations that control flight dispatch, crew scheduling, and ground handling remain on flat network segments with IT office systems, violating the segmentation controls required by directive.',
    keywords: ['TSA cybersecurity directive', 'network segmentation', 'OCC', 'operations control', 'IT/OT convergence', 'critical infrastructure'],
  },
  {
    code: 'A4898',
    name: 'Annual TSA Cybersecurity Assessment Not Mapped To Control Framework',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'TSA cybersecurity directive compliance assessments are conducted as checklist reviews against directive text without mapping findings to the airline\'s enterprise security control framework — gaps identified in the TSA assessment are tracked in a separate register from the main vulnerability management programme, delaying remediation and creating duplicate reporting burden.',
    keywords: ['TSA cybersecurity directive', 'compliance assessment', 'control framework', 'vulnerability management', 'compliance', 'aviation security'],
  },
  {
    code: 'A4899',
    name: 'TSA Designated Cybersecurity Coordinator Not Empowered To Direct Response',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The TSA-required cybersecurity coordinator role is held by a mid-level IT security manager without executive authority to direct incident response across operational departments including flight operations, ground handling, and revenue management — during a significant cybersecurity incident, the coordinator cannot compel operational teams to take protective actions without escalating through a chain of approvals that adds hours to response time.',
    keywords: ['TSA cybersecurity directive', 'cybersecurity coordinator', 'incident response', 'authority', 'governance', 'critical infrastructure'],
  },
  {
    code: 'A4900',
    name: 'Cyber Incident Response Plan Not Tested With Operational Stakeholders',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'The airline cybersecurity incident response plan required under TSA directives is reviewed annually by IT security but has never been exercised with flight operations, ATC liaison, and airport authority stakeholders — a system compromise affecting departure control would require cross-functional response that has not been rehearsed, leading to uncoordinated manual fallback procedures.',
    keywords: ['TSA cybersecurity directive', 'incident response', 'tabletop exercise', 'flight operations', 'DCS', 'compliance'],
  },
  {
    code: 'A4901',
    name: 'Software Patching Cadence Below TSA Directive Minimum For Operational Systems',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'TSA cybersecurity directives specify patching timelines for critical and high severity vulnerabilities on covered operational systems — airline patching metrics show 34% of in-scope systems exceed the directive-required critical patch window, with the shortfall concentrated in OCC and DCS infrastructure where maintenance windows are constrained by 24/7 operational requirements.',
    keywords: ['TSA cybersecurity directive', 'patch management', 'OCC', 'DCS', 'critical vulnerabilities', 'compliance'],
  },
  {
    code: 'A4902',
    name: 'Access Control Requirements Under TSA Directive Not Implemented For Privileged Accounts',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'TSA cybersecurity directive multi-factor authentication requirements for privileged access to covered systems have been implemented for externally accessible systems but not for internal administrator access to OCC, PSS, and DCS infrastructure — privileged accounts with single-factor authentication represent the highest-risk non-compliant population in the TSA control inventory.',
    keywords: ['TSA cybersecurity directive', 'MFA', 'privileged access', 'PAM', 'OCC', 'compliance'],
  },
  {
    code: 'A4903',
    name: 'Supply Chain Risk Assessment For Covered Systems Not Completed Per TSA Directive',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'TSA cybersecurity directives require assessment of supply chain risks for critical operational system vendors — the airline has not completed formal supply chain risk assessments for PSS, GDS, DCS, and connectivity vendors, and vendor security questionnaires on file are more than two years old, predating the current directive requirements.',
    keywords: ['TSA cybersecurity directive', 'supply chain risk', 'vendor risk', 'PSS', 'DCS', 'third-party assessment'],
  },
  {
    code: 'A4904',
    name: 'TSA Directive Evidence Documentation Not Sufficient For External Audit',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'Compliance evidence for TSA cybersecurity directive controls is maintained in a combination of spreadsheets, email archives, and screenshot folders without a GRC platform that provides audit-ready evidence packages — an unannounced TSA compliance audit would require weeks to compile required evidence, and gaps in documentation could be cited as compliance failures even where controls are technically implemented.',
    keywords: ['TSA cybersecurity directive', 'compliance evidence', 'GRC', 'audit', 'documentation', 'aviation security'],
  },

  // ── Third-Party Vendor Risk For PSS/RM/DCS (A4905–A4914) ─────────────────
  {
    code: 'A4905',
    name: 'PSS Provider Outage No Contractual RTO Aligned With Operational Requirement',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'The airline PSS contract specifies recovery time objectives negotiated before the airline\'s current dependence on cloud-hosted PSS for all check-in, boarding, and inventory functions — contractual RTO of 4 hours is not aligned with the operational RTO of 45 minutes required to sustain departure operations, and the gap has not triggered contract renegotiation or fallback capability investment.',
    keywords: ['PSS', 'vendor risk', 'RTO', 'business continuity', 'third-party dependency', 'contract management'],
  },
  {
    code: 'A4906',
    name: 'Revenue Management System Vendor Security Assessment Overdue',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'The airline revenue management system is hosted by a third-party vendor whose last independent security assessment was conducted 3 years ago — pricing algorithms, fare class inventory, and competitive intelligence data resident in the RM system are not covered by current vendor risk monitoring, and the contract does not require proactive security breach notification within 24 hours.',
    keywords: ['revenue management', 'vendor risk', 'third-party assessment', 'security assessment', 'SOC 2', 'data security'],
  },
  {
    code: 'A4907',
    name: 'DCS Third-Party Hosting Without Data Residency Verification',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Airline departure control system data including PNR records, passport scans, and biometric matching results is hosted by a third-party DCS vendor whose data centre locations and sub-processor arrangements have not been verified against airline data residency obligations — GDPR transfer impact assessments have not been updated to reflect current DCS vendor infrastructure topology.',
    keywords: ['DCS', 'data residency', 'GDPR', 'third-party risk', 'sub-processor', 'PNR data'],
  },
  {
    code: 'A4908',
    name: 'GDS Interface Access Credentials Not Subject To Vendor Access Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'GDS vendors with direct interfaces to airline PSS use service accounts provisioned years ago that have never been included in the airline user access review cycle — the scope of data accessible to GDS interface service accounts exceeds current business requirements, and stale accounts for GDS partnerships that ended remain active in the PSS access control database.',
    keywords: ['GDS', 'vendor access', 'service account', 'access review', 'PSS', 'third-party risk'],
  },
  {
    code: 'A4909',
    name: 'Codeshare Partner IT Integration Without Bilateral Security Standards',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'Airline codeshare agreements grant partner carriers real-time access to seat inventory, passenger data feeds, and check-in APIs without requiring partner compliance with equivalent cybersecurity standards — a partner carrier with weaker security practices becomes a lateral movement path into the airline PSS following a compromise of the partner\'s integration systems.',
    keywords: ['codeshare', 'partner integration', 'third-party risk', 'PSS API', 'security standards', 'vendor risk'],
  },
  {
    code: 'A4910',
    name: 'Cargo Management System Third-Party Without Penetration Test In 24 Months',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The airline cargo management system is maintained by a third-party vendor that has not conducted an independent penetration test in over 24 months — the CMS holds shipper data, hazardous goods declarations, and security screening records; a compromise of the vendor system that exposes unscreened cargo manifest data creates aviation security risk beyond the commercial impact of a data breach.',
    keywords: ['cargo management', 'third-party risk', 'penetration test', 'aviation security', 'supply chain', 'vendor assessment'],
  },
  {
    code: 'A4911',
    name: 'Crew Scheduling System Vendor Incident Notification SLA Unenforceable',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'The airline crew management system contract requires vendor notification of security incidents within 72 hours but the notification obligation is not backed by financial penalty or termination rights — the vendor has discretion over what constitutes a reportable incident, and the airline has no independent detection capability for compromise of the hosted crew scheduling system.',
    keywords: ['crew scheduling', 'vendor risk', 'incident notification', 'SLA', 'third-party risk', 'contract management'],
  },
  {
    code: 'A4912',
    name: 'Airport Operations System Vendor Dependency Mapping Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'Critical airport operations systems including gate management, baggage sortation, and passenger flow monitoring are operated by airport authority vendors whose sub-contractor and cloud infrastructure dependencies have not been mapped by the airline IT team — a critical vulnerability in a shared airport technology layer affects multiple airline systems through undiscovered dependencies.',
    keywords: ['airport operations', 'vendor dependency', 'third-party risk', 'supply chain', 'IT mapping', 'critical infrastructure'],
  },
  {
    code: 'A4913',
    name: 'Catering System Vendor Network Access To Airline Galley Planning System Unmonitored',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Catering vendors with direct system integrations to airline galley planning and special meals data use persistent VPN connections to airline internal networks that are not monitored by the airline SOC — vendor network access occurs at all hours including periods outside operational catering planning, and no alerting rule covers unusual access times or query volumes from catering vendor accounts.',
    keywords: ['catering vendor', 'VPN access', 'third-party monitoring', 'vendor risk', 'network access', 'SOC'],
  },
  {
    code: 'A4914',
    name: 'Fourth-Party Risk In PSS Ecosystem Not Assessed',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description:
      'The airline PSS vendor relies on multiple sub-processors for cloud infrastructure, database, and authentication services that have not been disclosed to the airline or assessed for cybersecurity risk — a compromise of a fourth-party sub-processor supporting PSS authentication infrastructure would grant attackers access to the PSS without triggering any vendor-side intrusion detection alert.',
    keywords: ['fourth-party risk', 'PSS', 'sub-processor', 'supply chain security', 'vendor risk', 'third-party assessment'],
  },

  // ── FAA/EASA Avionics Cybersecurity Certification (A4915–A4924) ──────────
  {
    code: 'A4915',
    name: 'AC 20-152A Compliance Plan Not Developed For In-Service Aircraft',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'FAA Advisory Circular 20-152A provides guidance on avionics cybersecurity for new and modified aircraft systems — airlines with in-service aircraft that do not meet the advisory circular\'s security assurance level recommendations have not developed compliance plans or risk acceptance documentation, creating regulatory exposure if the guidance is incorporated into airworthiness requirements.',
    keywords: ['AC 20-152A', 'FAA', 'avionics cybersecurity', 'DO-326A', 'airworthiness', 'compliance planning'],
  },
  {
    code: 'A4916',
    name: 'EASA CS-25 Cybersecurity Amendment Not Tracked In Fleet Certification Baseline',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'EASA has introduced cybersecurity provisions into CS-25 (Large Aeroplanes) certification standards — airlines operating EASA type-certified aircraft have not assessed how CS-25 cybersecurity amendments affect their continued airworthiness obligations or modification approval processes, and the CAMO has not updated maintenance programme planning to include cybersecurity assurance tasks.',
    keywords: ['EASA', 'CS-25', 'avionics cybersecurity', 'CAMO', 'airworthiness', 'certification'],
  },
  {
    code: 'A4917',
    name: 'Avionics Security Threat Conditions Document Not Maintained Post-Delivery',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The Security Threat Conditions document required by DO-326A/ED-202A as an input to the avionics cybersecurity design assurance process is delivered by the aircraft OEM at entry into service but not updated as the threat environment evolves — the airline and OEM have no formal process for reviewing whether new attack techniques invalidate the original threat conditions that underpinned avionics security design decisions.',
    keywords: ['DO-326A', 'ED-202A', 'avionics cybersecurity', 'threat conditions', 'security assurance', 'OEM'],
  },
  {
    code: 'A4918',
    name: 'STC Modification Avionics Cybersecurity Assessment Not Performed',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description:
      'Supplemental Type Certificate modifications to aircraft cabin systems, connectivity hardware, and inflight entertainment are approved through the FAA/EASA STC process without a standalone avionics cybersecurity assessment — modifications that introduce new data links or network interfaces are not evaluated for their impact on the original aircraft type certificate cybersecurity baseline.',
    keywords: ['STC', 'supplemental type certificate', 'avionics cybersecurity', 'DO-326A', 'FAA', 'EASA'],
  },
  {
    code: 'A4919',
    name: 'Aircraft Operator Not In Scope Of OEM Cybersecurity Vulnerability Disclosure Programme',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Aircraft OEMs operate vulnerability disclosure programmes for avionics systems but notification is directed to the type certificate holder, not to individual airline operators — airlines using aircraft with known but unpatched avionics vulnerabilities are not directly notified by the OEM; information reaches them only through EASA/FAA Safety Information Bulletins that lag OEM discovery by months.',
    keywords: ['avionics cybersecurity', 'vulnerability disclosure', 'OEM', 'FAA', 'EASA', 'SIB'],
  },
  {
    code: 'A4920',
    name: 'Avionics Cybersecurity Test Lab Environment Not Available For Regression Testing',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'The airline does not maintain or have access to an avionics test laboratory environment replicating the aircraft data network topology — security patches and software updates to avionics systems cannot be regression tested for cybersecurity impact before fleet deployment, requiring full reliance on OEM testing that may not include airline-specific integration scenarios.',
    keywords: ['avionics cybersecurity', 'test lab', 'AFDX', 'ARINC 664', 'regression testing', 'DO-326A'],
  },
  {
    code: 'A4921',
    name: 'DO-356A Security Verification Methods Not Implemented For Avionics Changes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'DO-356A (Airworthiness Security Methods and Considerations) defines security verification methods for avionics systems — airline engineering teams reviewing avionics modification proposals do not apply DO-356A security verification methods, accepting OEM assurance documentation without independently assessing whether verification activities were appropriate for the threat level of the modification.',
    keywords: ['DO-356A', 'avionics cybersecurity', 'security verification', 'airworthiness', 'modification', 'OEM'],
  },
  {
    code: 'A4922',
    name: 'Airworthiness Security Process Integration Between CAMO And IT Security Absent',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'The Continuing Airworthiness Management Organisation responsible for maintaining aircraft airworthiness and the airline IT security team operate entirely separate processes without a joint governance mechanism — cybersecurity events with potential airworthiness implications are not escalated between the two teams, and avionics security decisions made by the CAMO are not reviewed by IT security specialists.',
    keywords: ['CAMO', 'avionics cybersecurity', 'airworthiness', 'IT security', 'governance', 'DO-326A'],
  },
  {
    code: 'A4923',
    name: 'Aircraft Cybersecurity Risk Register Not Integrated With Safety Management System',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'The airline maintains a separate cybersecurity risk register for avionics and aircraft systems outside the safety management system — ICAO guidance and emerging regulatory requirements expect cybersecurity risks with safety implications to be evaluated through the SMS hazard identification and risk assessment process, but the two registers have no shared taxonomy or integrated review process.',
    keywords: ['avionics cybersecurity', 'SMS', 'safety management', 'risk register', 'ICAO', 'DO-326A'],
  },
  {
    code: 'A4924',
    name: 'ISAC Avionics Threat Intelligence Not Feeding Airworthiness Risk Assessments',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'A-ISAC threat intelligence reports on avionics attack techniques and aviation-targeted malware campaigns are consumed by the IT security team but not reviewed by airworthiness engineers conducting safety risk assessments — threat intelligence relevant to avionics system integrity never influences CAMO risk evaluation, leaving the airworthiness risk register uninformed by current adversary capability.',
    keywords: ['A-ISAC', 'avionics cybersecurity', 'threat intelligence', 'airworthiness', 'CAMO', 'DO-326A'],
  },

  // ── Loyalty Programme Account Takeover (A4925–A4934) ─────────────────────
  {
    code: 'A4925',
    name: 'Loyalty Account Credential Stuffing Not Detected Until Mile Redemption',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'Airline loyalty programme authentication systems lack velocity controls and credential stuffing detection — attackers using breach databases of email/password combinations from non-aviation services successfully authenticate to loyalty accounts at scale; compromise is typically detected only when fraudulent miles redemptions trigger a customer service complaint rather than proactive security monitoring.',
    keywords: ['loyalty programme', 'credential stuffing', 'account takeover', 'miles theft', 'authentication', 'velocity controls'],
  },
  {
    code: 'A4926',
    name: 'Loyalty Account MFA Opt-In Rate Below 12% Despite High-Value Balance Exposure',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description:
      'Multi-factor authentication is available but not mandatory for loyalty accounts holding miles balances equivalent to thousands of dollars in upgrade and award ticket value — opt-in rates remain below 12% because the enrolment UX adds friction to the booking flow; the airline has not made MFA mandatory or implemented step-up authentication for redemption transactions above a miles threshold.',
    keywords: ['loyalty programme', 'MFA', 'account takeover', 'authentication', 'miles redemption', 'risk-based authentication'],
  },
  {
    code: 'A4927',
    name: 'Loyalty Account Profile Change Notification Not Sent For Email Address Modification',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'The loyalty programme allows email address changes on account profiles without sending a notification to the previous email address — attackers who gain access to a loyalty account immediately change the email address to sever the account holder\'s recovery path, then drain miles through award bookings before the genuine member raises a complaint through alternative channels.',
    keywords: ['loyalty programme', 'account takeover', 'email change', 'notification', 'account security', 'authentication'],
  },
  {
    code: 'A4928',
    name: 'Miles Transfer API Without Recipient Verification Enabling Laundering',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'The loyalty programme miles transfer feature via API does not require the recipient account holder to confirm the transfer before completion — compromised high-balance accounts are systematically drained by attackers who immediately transfer miles to multiple mule accounts and redeem for upgrades or partner gift cards, making recovery of stolen miles difficult after the transfer chain completes.',
    keywords: ['loyalty programme', 'miles transfer', 'account takeover', 'fraud', 'API security', 'miles laundering'],
  },
  {
    code: 'A4929',
    name: 'Third-Party Loyalty Partner Mile Accrual API Without Fraud Velocity Controls',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Hotel, car rental, and retail partners accrue miles to loyalty accounts via API without real-time fraud velocity controls — compromised partner API credentials allow automated posting of fraudulent accrual transactions at high volume, inflating loyalty balances at scale before detection by the loyalty fraud team reviewing next-day batch reports.',
    keywords: ['loyalty programme', 'miles accrual', 'partner API', 'fraud', 'velocity controls', 'account takeover'],
  },
  {
    code: 'A4930',
    name: 'Loyalty Programme Dark Web Monitoring Not In Place For Stolen Credentials',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The airline loyalty programme team does not subscribe to dark web monitoring services that alert when loyalty account credential sets appear in breach marketplaces — the first indicator of credential exposure is typically a wave of account takeover attempts rather than proactive credential invalidation, by which point attacker campaigns are already active.',
    keywords: ['loyalty programme', 'dark web monitoring', 'credential exposure', 'account takeover', 'threat intelligence', 'breach monitoring'],
  },
  {
    code: 'A4931',
    name: 'Award Ticket Redemption For Third Parties Not Flagged As High-Risk Transaction',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'The loyalty redemption platform does not apply enhanced fraud screening to award ticket bookings made for passengers other than the account holder — this is the most common post-account-takeover monetisation method; the absence of risk-based authentication for third-party redemptions allows compromised accounts to book award travel for unknown beneficiaries without additional verification.',
    keywords: ['loyalty programme', 'award redemption', 'account takeover', 'fraud screening', 'third-party booking', 'risk-based authentication'],
  },
  {
    code: 'A4932',
    name: 'Loyalty Account Recovery Process Exploitable Via Social Engineering',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'The airline loyalty programme account recovery process relies on call centre agents verifying identity via date of birth, postcode, and partial frequent flyer number — these data points are available in commercially purchased data broker records, enabling social engineering attacks that recover attacker-controlled accounts or wrest genuine member accounts from recovering victims after the initial compromise.',
    keywords: ['loyalty programme', 'account recovery', 'social engineering', 'call centre', 'identity verification', 'account takeover'],
  },
  {
    code: 'A4933',
    name: 'Miles Currency Conversion To Cash Equivalent Not Monitored For Unusual Volumes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Loyalty programme miles converted to retail gift cards, hotel vouchers, or cash-equivalent partners are not monitored in aggregate for velocity anomalies that indicate large-scale fraud campaigns — individual transactions are approved within normal limits while cumulative fraud volume across multiple compromised accounts in a coordinated campaign accumulates undetected.',
    keywords: ['loyalty programme', 'miles conversion', 'fraud monitoring', 'gift card', 'account takeover', 'cash equivalent'],
  },
  {
    code: 'A4934',
    name: 'Loyalty Programme GDPR Access Request Process Exploitable For Data Harvesting',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'The airline loyalty programme GDPR Subject Access Request process delivers passenger travel history, contact data, and payment card last-four-digits to requesters verified only by email confirmation — account takeover followed by SAR request enables attackers to harvest complete PNR history and contact data for the genuine account holder, amplifying the data breach impact beyond miles theft.',
    keywords: ['loyalty programme', 'GDPR', 'SAR', 'data harvesting', 'account takeover', 'PNR data'],
  },

  // ── Phishing Targeting Flight Operations Staff (A4935–A4944) ─────────────
  {
    code: 'A4935',
    name: 'Flight Dispatcher Credential Theft Via Spear Phishing',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'Flight dispatchers with access to OCC systems, fuel order placement, and route release authority are targeted by spear phishing emails crafted using publicly available flight schedule data and dispatcher names from aviation industry directories — compromised dispatcher credentials provide access to dispatch systems that can affect operational decisions for multiple flights simultaneously.',
    keywords: ['phishing', 'flight dispatcher', 'OCC', 'credential theft', 'spear phishing', 'operations security'],
  },
  {
    code: 'A4936',
    name: 'Pilot Email Phishing Simulation Results Never Shared With Safety Department',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'Phishing simulation click rates for pilot and dispatcher populations are tracked by IT security but results are not shared with the flight operations safety department — elevated click rates in flight crew phishing simulations represent a safety risk given crew access to EFB and operational systems; the disconnect between IT security metrics and safety risk management prevents targeted remediation.',
    keywords: ['phishing simulation', 'pilot', 'flight crew', 'safety management', 'security awareness', 'operations security'],
  },
  {
    code: 'A4937',
    name: 'Airline Crew Portal Login Page Without Anti-Phishing Indicators',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      'The airline crew self-service portal used for roster access, bid submissions, and HR functions lacks phishing-resistant MFA and visual anti-phishing indicators that crew can verify before entering credentials — lookalike phishing domains registered days before major crew rostering events target crew with fake login pages that harvest credentials for the genuine portal.',
    keywords: ['crew portal', 'phishing', 'MFA', 'FIDO2', 'credential theft', 'social engineering'],
  },
  {
    code: 'A4938',
    name: 'Maintenance Control Centre Staff Targeted By MRO Invoice Phishing',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'Airline maintenance control centre staff who approve MRO supplier invoices receive business email compromise phishing attacks impersonating known MRO suppliers with changed bank account details — successful BEC attacks on maintenance finance workflows result in fraudulent payment authorisations for aircraft parts orders, with average loss per incident exceeding $80,000.',
    keywords: ['phishing', 'BEC', 'MRO', 'maintenance', 'invoice fraud', 'business email compromise'],
  },
  {
    code: 'A4939',
    name: 'Flight Crew Phishing Awareness Training Not Integrated With CRM Training',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Cybersecurity phishing awareness training for flight crew is delivered as a standalone annual module disconnected from Crew Resource Management and Threat and Error Management training — social engineering attacks on flight crew are more effective when the situational awareness and cross-checking habits developed in CRM training are not extended to the cyber domain.',
    keywords: ['phishing awareness', 'CRM', 'TEM', 'flight crew', 'security training', 'social engineering'],
  },
  {
    code: 'A4940',
    name: 'OCC Email Domain Without DMARC Enforcement Enabling Spoofing',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description:
      'The airline operations control centre email domain used for communications with flight crew and dispatchers does not have DMARC enforcement configured beyond monitoring mode — attackers can send emails that appear to originate from the OCC domain to crew EFBs and personal email addresses, impersonating dispatch instructions or weather diversionary messages.',
    keywords: ['DMARC', 'email spoofing', 'OCC', 'phishing', 'email security', 'operations security'],
  },
  {
    code: 'A4941',
    name: 'Reservation Agent Phishing Leading To PNR Data Exfiltration',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Airline reservation contact centre agents with access to PNR creation and modification tools are targeted by phishing attacks impersonating internal IT helpdesk with urgent credential reset requests — compromised agent credentials are used to perform bulk PNR queries that harvest passport data and contact information for passengers on specific routes of intelligence interest.',
    keywords: ['phishing', 'reservation agent', 'PNR data', 'credential theft', 'contact centre', 'data exfiltration'],
  },
  {
    code: 'A4942',
    name: 'Airport Station Manager Credential Compromise Via LinkedIn Spear Phishing',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Airline airport station managers listed on professional networking sites with job titles indicating DCS and baggage system access are targeted by spear phishing attacks referencing recent operational events — station manager credentials provide access to departure control system functions including boarding gate assignment, seat block removal, and special service request management.',
    keywords: ['spear phishing', 'station manager', 'DCS', 'LinkedIn', 'credential theft', 'social engineering'],
  },
  {
    code: 'A4943',
    name: 'Phishing-Resistant MFA Not Deployed For Flight Operations Staff',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description:
      'Flight operations staff including dispatchers, load planners, and meteorologists use TOTP-based MFA for OCC system access — real-time phishing proxy attacks that relay TOTP codes bypass TOTP MFA within the code validity window; phishing-resistant FIDO2 hardware tokens or passkeys are not deployed for the flight operations population despite documented SIM-swap and AiTM phishing attacks targeting airline operations roles.',
    keywords: ['FIDO2', 'phishing-resistant MFA', 'flight operations', 'OCC', 'AiTM', 'credential theft'],
  },
  {
    code: 'A4944',
    name: 'Airline Security Department Not Receiving Phishing Report Intelligence',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'Phishing emails reported by airline staff are forwarded to a generic IT helpdesk queue without automated extraction of IOCs for SIEM correlation or sharing with A-ISAC — operationally relevant phishing campaigns targeting airline-specific processes are not converted into detection rules or threat intelligence products, leaving the SOC dependent on vendor threat feeds that lack airline-specific context.',
    keywords: ['phishing reporting', 'IOC', 'SIEM', 'A-ISAC', 'threat intelligence', 'security operations'],
  },


];
