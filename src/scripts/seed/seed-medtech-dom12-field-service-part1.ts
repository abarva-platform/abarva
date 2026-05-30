// seed-medtech-dom12-field-service-part1.ts
// Medtech genome patterns — Field Service & Connected Device Operations
// Code range: M1750–M1809  (60 patterns)
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

export const MEDTECH_FIELD_SERVICE_PART1_PATTERNS: PatternSeed[] = [

  // ── Service Documentation ─────────────────────────────────────────────────

  {
    code: 'M1750',
    name: 'Field Service–Discovered Malfunction Not Routed to MDR Assessment',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `Field service technicians documenting device malfunctions during on-site repairs enter service records into a field service management system that has no automated interface with the complaint handling or MDR assessment workflow, allowing device malfunctions that meet FDA 21 CFR Part 803 reportability criteria — events likely to cause or contribute to serious injury — to be closed as resolved service tickets without triggering the 30-day MDR filing clock. Northstar Clinical's field service platform captures thousands of service events annually across its diagnostic imaging installed base, but the structural separation between field service records and the quality system's complaint intake means that MDR-reportable events discovered in the field are systematically excluded from the MDR pipeline unless a technician manually cross-files a complaint — a discretionary step that occurs in fewer than 30% of qualifying events based on complaint-to-service-ticket ratio analysis.`,
    keywords: ['FDA 21 CFR Part 803', 'MDR', 'field service', 'complaint handling', 'ISO 13485'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1751',
    name: 'Service Record Completeness Gaps Undermine ISO 13485 Device History',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `Service records generated during field maintenance activities lack the documentation completeness required by ISO 13485:2016 §8.2.2 and §7.5.8 — missing device serial numbers, software version at time of service, parts replaced with lot numbers, and calibration status post-service — creating a gap in the device's installation and service history that is auditable evidence of a QMS record-keeping failure. When FDA inspectors or notified body auditors request device history records for units subject to a field safety corrective action, incomplete service records prevent the manufacturer from demonstrating that all affected devices were identified, serviced, and returned to specification, exposing the organisation to findings that escalate the corrective action to a mandatory recall if affected device population cannot be bounded.`,
    keywords: ['ISO 13485', 'service records', 'device history', 'FDA 21 CFR 820', 'field service'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1752',
    name: 'Customer Complaint and Service Ticket Not Linked — Regulatory Oversight Bypassed',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `Customer complaint records in the quality management system and field service tickets in the service management system reference the same device performance event without a system-level linkage between the two records, allowing the service resolution to close the service ticket while the corresponding complaint record remains open in the QMS awaiting investigation — or alternatively allowing a closed complaint to be treated as resolved while the device remains in a degraded state that subsequent service visits continue to document. FDA 21 CFR 820.198 requires that complaint files be reviewed to determine whether an MDR is required, and a complaint record not linked to its corresponding service history cannot be assessed for MDR reportability with the full context of the device's service pattern, creating a systematic MDR assessment quality gap that disproportionately affects high-utilisation imaging and diagnostic platforms.`,
    keywords: ['complaint handling', 'ISO 13485', 'FDA 21 CFR 820', 'MDR', 'field service'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1753',
    name: 'Post-Service Functional Verification Not Documented Before Device Return to Clinical Use',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `Field service procedures do not require documented post-service functional verification — a defined test protocol confirming that the device meets its performance specifications after service — before the device is returned to clinical use, creating a quality system gap under ISO 13485:2016 §7.5.8 and FDA's Quality System Regulation at 21 CFR 820.200 that means devices re-entering clinical service after repair have no documented evidence of return-to-specification. For AI-assisted diagnostic imaging devices where service activities may include software updates, sensor replacement, or algorithm recalibration, the absence of a post-service verification record means there is no documented baseline for correlating any subsequent device performance issues to a specific service event — a gap that becomes critical when a post-service clinical event generates an MDR.`,
    keywords: ['post-service verification', 'ISO 13485', '21 CFR 820', 'field service', 'device history'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1754',
    name: 'Field Service SOP Revision Not Communicated to Remote Technician Workforce',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `Revisions to field service procedures — updated calibration sequences, revised safety warnings, or corrected part substitution guidance — are approved in the document control system and updated in the headquarters QMS, but the notification and confirmation workflow for remote field technicians operating from home offices or regional hubs does not verify that technicians have read and acknowledged the revised procedure before performing the affected service activity. ISO 13485:2016 §6.2 requires that personnel performing quality-affecting work be trained to current procedures, and a field service workforce dispersed across dozens of service territories without a confirmed training acknowledgement for every SOP revision creates a systematic non-conformance that is particularly difficult to demonstrate at audit because the training record gap is masked by the volume of service activity records.`,
    keywords: ['ISO 13485', 'field service', 'document control', 'training records', 'FDA 21 CFR 820'],
    subTopic: 'service-documentation',
  },
  {
    code: 'M1755',
    name: 'Service Documentation Language Not Localised — Clinical Staff Cannot Interpret Records',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description: `Service records generated by field technicians are written in English and stored in a global field service management system, but clinical staff at hospital sites in Germany, Japan, and Brazil who require access to device service history for clinical governance reviews — biomedical engineering departments, infection control committees, and clinical risk managers — cannot interpret English-only service records, creating a local clinical site governance gap that prevents customer-side accountability for device performance. EU MDR Article 10(11) and the Japanese Pharmaceutical and Medical Devices Act both include requirements for documentation to be provided in the official language of the member state or jurisdiction, and service records that are inaccessible to local clinical governance due to language barriers impair the customer's ability to meet their own facility accreditation and biomedical equipment management obligations under ISO 13485.`,
    keywords: ['field service', 'ISO 13485', 'EU MDR', 'service records', 'localisation'],
    subTopic: 'service-documentation',
  },

  // ── Preventive Maintenance ────────────────────────────────────────────────

  {
    code: 'M1756',
    name: 'PM Schedule Drift for IVD Diagnostics Equipment Causes Calibration Expiry',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description: `Preventive maintenance schedules for in-vitro diagnostic (IVD) analysers and point-of-care testing instruments installed at customer sites accumulate schedule drift when service resource availability and customer site access constraints push PM visits beyond the manufacturer-specified interval, causing calibration verification periods to expire and placing the device in a non-validated operating state that does not meet the performance claims in the cleared 510(k) or approved PMA. Under CLIA regulations and ISO 15189 accreditation requirements, clinical laboratory customers are required to maintain diagnostic equipment within the manufacturer's PM schedule as a condition of their laboratory accreditation, and IVD devices operating beyond their PM interval create a joint regulatory exposure for both the device manufacturer and the customer laboratory — a liability dynamic that is rarely addressed in field service contracts.`,
    keywords: ['preventive maintenance', 'IVD', 'FDA 510(k)', 'CLIA', 'ISO 13485'],
    demoRelevant: true,
    subTopic: 'preventive-maintenance',
  },
  {
    code: 'M1757',
    name: 'Calibration Certificate Expiry Not Proactively Communicated to Customer',
    officeCategory: 'front_office',
    failureRatePct: 66,
    description: `The field service scheduling system does not generate automated proactive notifications to customers when a device's calibration certificate is approaching expiry — 30, 60, or 90 days ahead — leaving customers to discover expired calibration status during their own internal biomedical equipment audits or, worse, during a clinical accreditation inspection by TJC or a national accreditation body. For imaging and diagnostic devices where calibration currency is a prerequisite for the device's performance claims and for clinical use in accredited facilities, expired calibration status discovered during a regulatory inspection is treated as an equipment management failure at the clinical site and creates a retroactive patient safety review obligation for any diagnostic results generated by the device during the expired calibration period.`,
    keywords: ['calibration certificate', 'ISO 13485', 'preventive maintenance', 'field service', 'TJC'],
    demoRelevant: true,
    subTopic: 'preventive-maintenance',
  },
  {
    code: 'M1758',
    name: 'Loaner Device Qualification Gaps Create Unvalidated Clinical Use Exposure',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `Loaner devices deployed to customer sites while primary units are removed for major repairs or software updates are drawn from a loaner fleet that has not been through the full installation qualification (IQ), operational qualification (OQ), and performance qualification (PQ) documented for the customer site's primary unit — meaning clinical staff are using a device that has not been validated in the specific environmental, workflow, and connectivity context of that clinical site. ISO 13485:2016 §7.5.8 requires that processes for installation and servicing maintain equipment in a validated state, and a loaner deployment without site-specific IQ/OQ/PQ creates a device history record gap — no installation qualification documentation exists for the specific loaner unit at the specific site — that becomes a regulatory concern when the loaner is used in a clinical workflow where the diagnostic output affects patient management decisions.`,
    keywords: ['loaner device', 'IQ/OQ/PQ', 'ISO 13485', 'installation qualification', 'field service'],
    demoRelevant: true,
    subTopic: 'preventive-maintenance',
  },
  {
    code: 'M1759',
    name: 'PM Interval Revision Not Applied to Installed Base — Outdated Schedule in Field',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `A design change or post-market engineering study revises the required preventive maintenance interval for a device model — for example, shortening a 12-month PM to 6 months based on new component wear data — but the revised PM interval is published in a new version of the service manual without a proactive communication and scheduling update to all installed base customers, leaving customers and field service teams operating under the obsolete PM schedule for months to years after the revision. The PM interval revision failure pattern is systematically consequential for imaging devices with precision optical or mechanical components where interval shortening reflects a real discovery about component degradation rate, and continued operation under the obsolete interval means clinical performance may degrade before the next scheduled PM detects it.`,
    keywords: ['preventive maintenance', 'ISO 13485', 'installed base', 'field service', 'device history'],
    demoRelevant: true,
    subTopic: 'preventive-maintenance',
  },
  {
    code: 'M1760',
    name: 'PM Verification Test Procedure Outdated After Software Update',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `Preventive maintenance verification test procedures documented in the field service manual reference pre-update software menus, diagnostic tool interfaces, and performance threshold values that were revised in a software release deployed to the installed base, causing field technicians to conduct PM verification against an incorrect protocol and to either fail devices that meet current performance specifications or pass devices that fail current specifications. For AI-assisted diagnostic devices where software updates may alter the algorithm's operating thresholds or output displays, PM verification tests that reference the pre-update interface may not capture the post-update performance parameters that affect clinical accuracy — a specific category of PM procedure obsolescence that ISO 13485:2016 §4.2.4 document control requirements are intended to prevent but which depends on a reliable link between software change control records and service document revision triggers.`,
    keywords: ['preventive maintenance', 'ISO 13485', 'document control', 'software update', 'field service'],
    subTopic: 'preventive-maintenance',
  },

  // ── Remote Monitoring ─────────────────────────────────────────────────────

  {
    code: 'M1761',
    name: 'Connected Device Telemetry Data Transmitted Without HIPAA-Compliant BAA',
    officeCategory: 'back_office',
    failureRatePct: 74,
    description: `Diagnostic imaging devices with embedded telemetry functionality transmit performance and usage data — including patient count, procedure codes, and session metadata — to the manufacturer's remote monitoring platform without a HIPAA Business Associate Agreement (BAA) governing the transmission and storage of information that may constitute Protected Health Information (PHI) under 45 CFR §164.308, creating a HIPAA privacy and security rule exposure for the healthcare provider customer and a contractual compliance failure for the device manufacturer. The data privacy exposure is compounded in EU deployments where GDPR Article 9 classifies health data as a special category requiring explicit processing lawfulness, and many device manufacturers' remote monitoring platforms were designed before GDPR enforcement matured and transmit telemetry without the consent, data processing agreement, and data minimisation controls required by GDPR Article 28.`,
    keywords: ['HIPAA', 'connected device', 'GDPR', 'remote monitoring', 'telemetry'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1762',
    name: 'Remote Software Update Deployed Without FDA Clearance Scope Verification',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `A remote software update pushed to the installed base through the device's over-the-air update mechanism modifies algorithm parameters, image processing thresholds, or output display formats without a regulatory affairs review confirming that the change falls within the scope of the device's existing 510(k) clearance or PMA approval — or without determining whether the change triggers a new submission requirement under FDA's predetermined change control plan (PCCP) obligations for AI/ML-enabled devices. FDA's 2019 Proposed Regulatory Framework and 2023 guidance on AI/ML-based SaMD articulate that software changes that alter a device's performance outside its cleared specifications require a regulatory submission, and a remote update capability without a built-in regulatory review gate enables the engineering team to deploy changes that modify cleared device behaviour without regulatory oversight.`,
    keywords: ['remote software update', 'FDA 510(k)', 'SaMD', 'PCCP', 'connected device'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1763',
    name: 'Cybersecurity Patch Deployment to Field Devices Bypasses Change Control',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `Emergency cybersecurity patches for field-deployed connected medical devices — addressing vulnerabilities in the device's OS, communication stack, or third-party libraries — are deployed through an expedited channel that bypasses the standard software change control procedure under ISO 13485:2016 §7.3.9 and FDA's medical device cybersecurity guidance, resulting in device software changes that are not assessed for potential impacts on device performance, safety, or the existing regulatory submission. IEC 62443 security patch management guidance and FDA's 2023 Cybersecurity in Medical Devices guidance both require that patch deployment — even for security-critical patches — include an assessment of patient safety impact before field deployment, and a bypass mechanism that treats cybersecurity urgency as incompatible with safety assessment conflates two different risk dimensions that must be simultaneously managed.`,
    keywords: ['IEC 62443', 'cybersecurity patch', 'ISO 13485', 'connected device', 'FDA cybersecurity'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1764',
    name: 'Remote Monitoring Platform Stores Field Device Logs in Non-Compliant Cloud Environment',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `Device performance logs, error codes, and usage telemetry from connected medical devices are stored in a cloud-based remote monitoring platform that has not undergone the security assessment required by FDA's 2023 cybersecurity guidance or HIPAA's Security Rule technical safeguard requirements — lacking encryption at rest, access logging, role-based access controls, and a business associate agreement with the healthcare provider. The remote monitoring platform was originally designed as an internal engineering telemetry system and was subsequently extended to store customer device data without a formal system re-classification that would have triggered the security architecture review needed to confirm it meets the requirements for a system processing PHI-adjacent healthcare device data.`,
    keywords: ['remote monitoring', 'HIPAA', 'IEC 62443', 'connected device', 'cloud security'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1765',
    name: 'Telemetry Alert Thresholds Not Clinically Validated — False Alarms Erode Trust',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description: `Remote monitoring telemetry alerts are configured with threshold values derived from engineering bench testing rather than from a clinical validation study that defines the performance deviation levels that are clinically significant and actionable — generating a high false alarm rate where customer-facing alerts are triggered by transient performance fluctuations that do not affect diagnostic accuracy, eroding clinical staff confidence in the remote monitoring system and causing alert fatigue that results in genuinely significant alerts being ignored. For AI-assisted diagnostic devices, the alert threshold calibration problem is compounded by the fact that algorithm performance variation in clinical conditions may be clinically significant at deviation levels below the engineering bench tolerance, meaning the alert system is simultaneously over-sensitive to benign variation and potentially insensitive to clinically consequential algorithm performance drift.`,
    keywords: ['remote monitoring', 'connected device', 'ISO 13485', 'telemetry', 'alert threshold'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1766',
    name: 'Remote Access for Service Without Customer Site Network Security Agreement',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `Field service technicians remotely access connected devices at customer sites using vendor-supplied remote access credentials that are shared across the service organisation rather than individually assigned, and without a formal network security agreement with the customer that specifies the access scope, session logging requirements, and data handling obligations — creating a security posture that violates IEC 62443's remote access security requirements and exposes the customer's clinical network to risk from credential sharing. Healthcare provider customers operating under HIPAA are required to audit access to systems on their network, and shared-credential remote access from the device manufacturer's service team cannot be attributed to a specific technician during a HIPAA audit or in response to a security incident, creating an audit trail gap that is both a HIPAA violation for the customer and a liability exposure for the manufacturer.`,
    keywords: ['IEC 62443', 'remote access', 'HIPAA', 'field service', 'cybersecurity'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },

  // ── Installation Qualification ────────────────────────────────────────────

  {
    code: 'M1767',
    name: 'IQ/OQ/PQ Documentation for Customer Site Installation Not Retained in QMS',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description: `Installation qualification (IQ), operational qualification (OQ), and performance qualification (PQ) documentation generated during customer site device installations is retained locally by the field service technician or at the customer site but is not systematically ingested into the manufacturer's QMS device history records under ISO 13485:2016 §7.5.8, leaving the manufacturer's quality system without a complete record of the installation conditions and acceptance criteria verified for each unit in the installed base. When a field safety corrective action or voluntary recall requires the manufacturer to identify all installed devices meeting specific performance criteria and document their remediation, the absence of IQ/OQ/PQ records in the central quality system prevents the manufacturer from confirming that each device was originally installed within specification — a regulatory gap that can convert a targeted field corrective action into a broader recall scope because device installation status cannot be bounded.`,
    keywords: ['IQ/OQ/PQ', 'ISO 13485', 'installation qualification', 'device history', 'field service'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },
  {
    code: 'M1768',
    name: 'Environmental Condition Validation Not Performed at Customer Installation Site',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `Device installation procedures require field technicians to verify that customer site environmental conditions — temperature, humidity, electromagnetic interference, and electrical supply characteristics — fall within the specified operating range documented in the device's 510(k) or PMA submission, but this verification is performed informally by visual inspection or by accepting customer-provided facility specifications without independent measurement, creating an installation qualification record that asserts environmental compliance without documented measurement data. For precision diagnostic imaging devices where ambient magnetic field interference, vibration, or temperature variation outside the specified range materially affects calibration stability and image quality, unvalidated environmental conditions at installation are a latent cause of recurring field performance issues that are investigated as device failures when the root cause is actually a site condition that was never formally qualified.`,
    keywords: ['installation qualification', 'IQ/OQ/PQ', 'ISO 13485', 'environmental conditions', 'field service'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },
  {
    code: 'M1769',
    name: 'Customer Site Change Control Not Triggered After Facility Modification',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `Customer sites where devices are installed undergo facility modifications — HVAC changes, electrical system upgrades, room layout reconfiguration, network infrastructure changes — that alter the environmental conditions recorded in the original installation qualification without notifying the device manufacturer or triggering a re-qualification of the installation, invalidating the IQ/OQ/PQ records that documented the device's validated operating environment. ISO 13485:2016 §7.5.8 and GxP site change control requirements both recognise that validated equipment operating conditions must be maintained or re-qualified after changes to the operating environment, but the responsibility gap between the device manufacturer's service agreement and the customer's facility management processes means these changes routinely occur without triggering any re-qualification — a gap that is routinely discovered during post-market investigations of clustered performance issues at specific customer sites.`,
    keywords: ['installation qualification', 'IQ/OQ/PQ', 'ISO 13485', 'site change control', 'GxP'],
    subTopic: 'installation-qualification',
  },
  {
    code: 'M1770',
    name: 'Installation Acceptance Test Criteria Not Linked to Cleared Device Specifications',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `Installation acceptance test criteria specified in the field service installation procedure reference internal service tolerance values rather than the device performance specifications documented in the FDA submission — allowing devices to be accepted at installation with performance parameters that pass the service tolerance but fall below the cleared performance specification, creating a device history record that documents field acceptance of a device not operating to its cleared specification. The divergence between service tolerances and cleared specifications typically originates in a gap between regulatory affairs and service engineering during the device's design phase, where service procedures are developed with tolerances set for serviceability rather than for confirmation of cleared performance, and is most consequential for imaging devices where spatial resolution, signal-to-noise ratio, and contrast sensitivity specifications in the 510(k) directly relate to diagnostic accuracy claims.`,
    keywords: ['installation qualification', 'FDA 510(k)', 'ISO 13485', 'acceptance criteria', 'device history'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },
  {
    code: 'M1771',
    name: 'Network Connectivity Qualification Not Included in IQ Protocol for Networked Devices',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `Installation qualification protocols for network-connected diagnostic devices do not include a network connectivity and cybersecurity configuration qualification that verifies the device is connected to the customer network according to the manufacturer's security specifications — including port restrictions, TLS certificate installation, VPN configuration, and network segmentation from patient monitoring systems — leaving the device in a potentially vulnerable network configuration that was not validated at installation and may not meet the IEC 62443 security requirements described in the device's FDA submission. The network configuration qualification gap is especially consequential for AI-assisted diagnostic devices where the remote model update and telemetry capabilities depend on specific network configurations that, if misconfigured at installation, can either leave the device unable to receive critical security patches or expose the customer's clinical network to lateral movement risk.`,
    keywords: ['IQ/OQ/PQ', 'IEC 62443', 'network qualification', 'connected device', 'installation qualification'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },

  // ── Spare Parts ───────────────────────────────────────────────────────────

  {
    code: 'M1772',
    name: 'EOL Component in Field Installed Base Creates Unsupported Device Population',
    officeCategory: 'back_office',
    failureRatePct: 75,
    description: `A critical component used in field-installed devices reaches end-of-life (EOL) from the component supplier — a specific ASIC, optical sensor, or processing board — with a 12-month last-order window that the manufacturer's supply chain team does not identify in time to build the service spare parts inventory required to support the installed base life, resulting in a field population of devices that cannot be repaired when the EOL component fails because no replacement inventory is available. The EOL component management failure pattern is systematically consequential for mid-size diagnostic device companies because they lack the purchasing power to negotiate extended manufacturing agreements with component suppliers and often do not track component EOL timelines in a systematic parts lifecycle registry — a gap that ISO 13485:2016 §7.4.1 supplier management obligations should address through supplier lifecycle monitoring but rarely do in practice.`,
    keywords: ['spare parts', 'ISO 13485', 'EOL component', 'field service', 'supply chain'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },
  {
    code: 'M1773',
    name: 'Counterfeit Spare Parts Risk in After-Market Supply Not Managed',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `Field service technicians sourcing spare parts from after-market distributors during supply shortages or for cost reduction have no procedure for verifying that after-market components meet the manufacturer's quality specifications or that they are not counterfeit substitutes — allowing non-genuine parts to enter the device installed base without the incoming inspection, supplier qualification, or installation verification that ISO 13485:2016 §7.4.3 requires for components used in medical device maintenance. The use of counterfeit or non-specification spare parts in field service is a specific enforcement priority for FDA's Office of Criminal Investigations and has been implicated in adverse events involving imaging and diagnostic devices where a counterfeit component altered the device's electrical, optical, or computational performance without the manufacturer's awareness.`,
    keywords: ['spare parts', 'counterfeit parts', 'ISO 13485', 'supplier quality', 'FDA 21 CFR 820'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },
  {
    code: 'M1774',
    name: 'Serialisation Tracking for Field-Installed Parts Breaks Chain of Custody',
    officeCategory: 'back_office',
    failureRatePct: 70,
    description: `Parts replaced during field service repairs are recorded in service tickets with part description and lot number but without the UDI (Unique Device Identifier) or component serial number of the removed part and its replacement — breaking the chain of custody traceability required by FDA's UDI system under 21 CFR Part 830 and ISO 13485:2016 §7.5.9 for devices and components that are subject to traceability requirements, and preventing the manufacturer from identifying the full scope of potentially affected devices when a safety recall requires location of all units containing a specific component lot. The serialisation tracking gap in field service is most consequential for implantable or long-term use devices where the component traceability chain is required for patient-level recall notification, but it also affects diagnostic imaging platforms where software-embedded components are tracked by serial number in the device's cleared configuration.`,
    keywords: ['UDI', 'serialisation', 'ISO 13485', 'spare parts', 'field service'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },
  {
    code: 'M1775',
    name: 'Refurbished Parts Return Process Lacks Quality Acceptance Before Restock',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `Parts removed from devices during field service repairs — failed components returned for engineering analysis, or functional assemblies removed during upgrades — are returned to the service parts depot without a formal quality acceptance inspection to distinguish functional-for-restock parts from failed-for-disposal parts, allowing unverified components to re-enter the service parts inventory and be issued as spare parts for subsequent field repairs. ISO 13485:2016 §8.3 requires that nonconforming product be identified and controlled to prevent unintended use, and the return process for field-removed components that bypasses a quality gatekeeping step at the depot allows the nonconforming product control requirement to be circumvented — a gap that is most likely to result in a patient safety event when a returned-but-failed component is re-issued to a field technician during a repair affecting device safety functions.`,
    keywords: ['spare parts', 'ISO 13485', 'nonconforming product', 'field service', 'CAPA'],
    subTopic: 'spare-parts',
  },
  {
    code: 'M1776',
    name: 'Field Spare Parts Shelf Life Not Monitored — Expired Components Issued',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `Spare parts with defined shelf life limitations — sterile accessories, reagent materials, battery assemblies, and elastomeric seals — are stored at field service depots and in field technician vehicles without a systematic expiry date monitoring and rotation process, allowing expired components to remain in the active inventory and be issued for repairs without the performance and safety verification that would confirm the part still meets specification after its shelf life limit has been exceeded. ISO 13485:2016 §6.4 and FDA's Good Manufacturing Practice requirements for device manufacturing and service both require that deterioration of product be prevented through appropriate storage and inventory management, and a field spare parts management system that does not enforce shelf life expiry holds represents a device safety risk where the first indication of an expired component being used in a repair may be a field failure or adverse event.`,
    keywords: ['spare parts', 'ISO 13485', 'shelf life', 'field service', 'storage conditions'],
    subTopic: 'spare-parts',
  },

  // ── AI Field Service ──────────────────────────────────────────────────────

  {
    code: 'M1777',
    name: 'AI Predictive Maintenance Alert Without Clinical Safety Threshold Validation',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `A predictive maintenance AI model deployed on connected diagnostic devices generates proactive service alerts based on telemetry anomaly patterns — vibration signatures, power supply drift, calibration trend deviations — but the alert thresholds were set by the engineering team based on historical service failure data without a clinical validation study that defines the performance degradation level at which device output affects diagnostic accuracy, meaning alerts may be triggered at device states still within clinically acceptable performance range while clinically significant degradation may not generate an alert. For AI-assisted imaging devices where algorithm output accuracy is sensitive to hardware performance, the absence of a clinically validated threshold between the predictive maintenance alert boundary and the clinical performance specification boundary creates a patient safety gap: the device may operate below its clinical accuracy specification without generating a maintenance alert, generating false-negative diagnostic outputs without any service intervention trigger.`,
    keywords: ['AI predictive maintenance', 'clinical safety threshold', 'connected device', 'ISO 13485', 'SaMD'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1778',
    name: 'LLM Service Call Triage Bypasses MDR Escalation Logic',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description: `A large language model deployed to triage incoming field service calls — classifying reported symptoms, recommending troubleshooting steps, and prioritising dispatch — does not include the MDR assessment logic required by 21 CFR Part 803 to flag service calls describing events that may constitute reportable device malfunctions or events that may have caused or contributed to patient injury, allowing MDR-reportable events to be closed as service calls without regulatory assessment because the LLM's triage classification did not route them to the complaint handling pathway. The LLM triage system was validated for dispatch efficiency metrics — correct fault code assignment, technician skill match — but not for MDR sensitivity, and its training data reflects historical service call classifications made under the previous (and demonstrably under-reporting) complaint handling process, teaching the model to replicate existing classification patterns rather than correct them.`,
    keywords: ['LLM service triage', 'MDR', 'FDA 21 CFR Part 803', 'ISO 13485', 'complaint handling'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1779',
    name: 'AI Parts Recommendation Engine Without Regulatory Compliance Check for Substitutes',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `An AI parts recommendation system used by field service technicians to identify available spare parts during repairs recommends alternative part numbers and cross-referenced substitutes when primary parts are unavailable — but the recommendation engine does not include a regulatory compliance check that verifies whether the recommended substitute is on the approved supplier list, has been validated as a qualified substitute under the device's design specifications, and would not require a design change notice under ISO 13485:2016 §7.3.9. When a field technician accepts an AI-recommended part substitute and installs it without the regulatory compliance validation step, the service creates a device configuration that may differ from the cleared specification without triggering the engineering review that would identify the regulatory submission implications — the same failure mode as ASL drift during supply shortages, but now automated and scaled by the AI recommendation system.`,
    keywords: ['AI parts recommendation', 'ISO 13485', 'ASL', 'design controls', 'regulatory compliance'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1780',
    name: 'IoT Anomaly Detection Deployed Without Cybersecurity Validation Under IEC 62443',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `An IoT anomaly detection system monitoring connected diagnostic devices for cybersecurity threat indicators — unusual network traffic, unexpected device state changes, unauthorised firmware modification attempts — is deployed on the manufacturer's remote monitoring platform without completing the security validation required by IEC 62443-4-1 secure product development lifecycle and FDA's 2023 cybersecurity guidance, meaning the anomaly detection system itself has not been assessed for the risk that it could be exploited as an attack vector or could interfere with device performance through resource contention on the device's embedded processing environment. An IoT security monitoring capability that is not itself validated to cybersecurity standards creates a security assurance paradox: the system intended to detect device compromise may itself be the attack surface through which the device's clinical network exposure is realised.`,
    keywords: ['IoT anomaly detection', 'IEC 62443', 'connected device', 'FDA cybersecurity', 'remote monitoring'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1781',
    name: 'GenAI Service Documentation Without ISO 13485 Review Creates Non-Conformant Records',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `Field service technicians using generative AI tools to draft service reports, installation qualification records, and post-service verification summaries produce documentation that is narrative-coherent and technically plausible but may omit required data elements — device serial numbers, parts lot numbers, calibration reference data, measured performance values — that are mandatory under ISO 13485:2016 §7.5.8 and 21 CFR 820.200 for service records to constitute complete device history entries. Service records generated by GenAI without a required-field validation checkpoint at submission fail to serve their regulatory function as traceable evidence of the device's service history because the AI-generated narrative fills the structural appearance of a complete record while the measurable and traceable data fields that give the record evidentiary value in an FDA inspection or recall action are absent.`,
    keywords: ['GenAI service documentation', 'ISO 13485', 'service records', 'FDA 21 CFR 820', 'device history'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1782',
    name: 'AI Diagnostic Tool Deployed in Field Without Site-Specific Validation Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `An AI-based remote diagnostic tool that analyses device telemetry streams to identify fault conditions and recommend repair actions is deployed across the field service organisation as a standard service tool without a site-specific validation protocol that confirms the tool performs accurately for each device model variant, software version, and customer site configuration in the installed base — meaning the tool's diagnostic recommendations may be based on telemetry patterns from a different device configuration than the unit being serviced. For AI diagnostic tools where the recommendation accuracy is sensitive to device model and software version, a deployment without configuration-specific validation creates a systematic risk that technicians will act on incorrect AI-generated fault diagnoses, replacing functional components based on pattern matches from a different device type and missing the actual fault causing the device issue.`,
    keywords: ['AI diagnostic tool', 'ISO 13485', 'field service', 'SaMD', 'validation'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1783',
    name: 'Predictive Maintenance AI Model Drift Undetected — Escalating False Dispatch Rate',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description: `A predictive maintenance model deployed to generate proactive field service dispatch recommendations from connected device telemetry drifts in performance as the device fleet ages, undergoes software updates, and operates in increasingly diverse customer environments — generating a rising proportion of false positive dispatches that send technicians to sites with no identified fault — without a performance monitoring framework that tracks model accuracy against ground truth service outcomes and triggers model revalidation when drift exceeds a defined threshold. The absence of a model performance monitoring programme for the field service AI creates the same drift vulnerability as SaMD algorithm drift post-clearance: the model's prediction accuracy degrades in the field without the manufacturer's knowledge, and the productivity cost of false dispatches is attributed to service capacity planning rather than to AI model performance degradation.`,
    keywords: ['AI predictive maintenance', 'model drift', 'PCCP', 'ISO 13485', 'connected device'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1784',
    name: 'Automated Fault Code Classifier Not Validated Against IVD Performance Specification',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description: `A machine learning classifier deployed to automatically assign fault codes to IVD analyser error events uses a training dataset from a single reagent chemistry platform that does not represent the full diversity of assay types, reagent lot variability, and clinical sample matrix variability in the deployed IVD fleet, causing systematic misclassification of reagent-matrix interaction errors as instrument hardware faults — routing these events to hardware repair queues rather than reagent or sample handling investigation tracks. The fault code misclassification leads to repeat service visits for recurrence of faults that were not resolved because the initial investigation addressed the wrong fault hypothesis, and the IVD diagnostics-specific performance specifications under 21 CFR Part 820 and ISO 15189 accreditation requirements are affected when the misclassified events involve performance deviations that should have triggered an MDR assessment or CAPA under the complaint handling process.`,
    keywords: ['AI fault classifier', 'IVD', 'ISO 13485', 'CAPA', 'field service'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1785',
    name: 'AI-Assisted Remote Triage Replaces Escalation to Clinical Engineer Without Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description: `An AI-assisted remote triage system for connected diagnostic devices is configured to autonomously attempt remote corrections — parameter resets, software reboots, algorithm recalibration triggers — for device alerts classified as low-severity without first escalating to a clinical engineer for review, removing the human judgment step that would identify whether the reported device state might indicate an MDR-reportable malfunction before remote correction actions are taken. Under ISO 13485:2016 §8.2.2, complaint-like events must be assessed for MDR reportability before corrective action is taken, and a triage system that autonomously resolves alerts and closes them without human review of MDR implications creates a systematic evasion of the complaint handling process for the entire class of events managed by the automated triage system.`,
    keywords: ['AI remote triage', 'MDR', 'ISO 13485', 'connected device', 'complaint handling'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1786',
    name: 'AI Field Dispatch Optimisation Prioritises Cost Over Clinical Urgency',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description: `An AI dispatch optimisation model that schedules field service technician assignments to minimise travel cost and maximise daily repair throughput uses a cost-objective function that does not incorporate clinical urgency weighting — treating a preventive maintenance visit at a low-volume outpatient clinic the same as an emergency repair at a high-volume surgical imaging suite — resulting in delayed service at critical clinical sites during surge periods when the scheduling optimiser routes available technicians to geographically clustered lower-priority visits. When AI-optimised dispatch delays cause a surgical imaging device to remain out of service at a high-acuity site for longer than a clinically defined SLA window, the delay creates a patient access risk that the field service contract's clinical urgency response commitments are not met, and the AI dispatch system's cost-objective bias may be cited in breach-of-contract claims or regulatory quality system findings.`,
    keywords: ['AI dispatch optimisation', 'field service', 'ISO 13485', 'clinical urgency', 'SLA'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },

  // ── Remote Monitoring (continued) ─────────────────────────────────────────

  {
    code: 'M1787',
    name: 'Over-the-Air Update Failure Mid-Deployment Creates Mixed Software Version Fleet',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description: `A staged over-the-air software update deployment interrupted by network connectivity failures, device availability windows, or customer site access issues results in a field installed base with mixed software versions — some devices running the updated version and some running the prior version — where the manufacturer's service documentation, performance specifications, and regulatory submissions do not formally address the performance characteristics of mixed-version deployed configurations. FDA's guidance on software changes for medical devices requires that the manufacturer understand and document the performance of each released software configuration, and a mixed-version installed base that was not explicitly planned as a supported configuration at the time of the update release creates an undefined device state with no corresponding cleared performance specification and no service procedure calibrated to the mixed-version configuration.`,
    keywords: ['remote software update', 'ISO 13485', 'connected device', 'FDA SaMD', 'version management'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1788',
    name: 'GDPR Data Subject Access Request Cannot Be Fulfilled for Device Telemetry Data',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `Device telemetry data transmitted from connected medical devices at EU customer sites is stored in the manufacturer's remote monitoring platform in a format and structure that cannot produce a GDPR Article 15 data subject access report for an individual patient or healthcare provider employee whose data may be included in the telemetry — because the telemetry platform was designed for operational analytics and does not maintain the individual-level data mapping required to fulfil a subject access request within the GDPR's 30-day response window. Healthcare provider customers in EU member states who receive GDPR subject access requests related to data processed through the manufacturer's connected device platform pass the obligation upstream to the manufacturer, and the manufacturer's inability to identify and extract individual-level data from the telemetry platform constitutes a GDPR compliance failure that becomes the manufacturer's liability under the data processing agreement.`,
    keywords: ['GDPR', 'remote monitoring', 'connected device', 'data subject access', 'HIPAA'],
    subTopic: 'remote-monitoring',
  },

  // ── Spare Parts (continued) ───────────────────────────────────────────────

  {
    code: 'M1789',
    name: 'Safety Recall Cannot Be Executed Because Field Part Serialisation is Incomplete',
    officeCategory: 'back_office',
    failureRatePct: 73,
    description: `A mandatory field safety corrective action triggered by a component failure pattern requires identification of all installed devices containing a specific component lot, but the field service parts tracking database contains serial number records for only 60% of the affected component installations because historical service records used free-text part descriptions rather than structured serial number fields — making it impossible to definitively bound the recall population and forcing the manufacturer to issue a broader precautionary recall than the failure data warrants. FDA's 21 CFR Part 806 field correction and removal reporting requirements include an obligation to identify the number of devices in commercial distribution that are subject to the recall, and a field parts tracking database that cannot support this identification requires the manufacturer to include all devices of the affected model in the recall scope rather than limiting it to confirmed-affected units, creating a substantially larger operational and financial recall scope than the failure pattern justifies.`,
    keywords: ['safety recall', 'serialisation', 'FDA 21 CFR Part 806', 'spare parts', 'field service'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },
  {
    code: 'M1790',
    name: 'Third-Party Service Provider Uses Unapproved Parts — Manufacturer Unaware',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description: `Third-party service organisations (ISO-certified independent service organisations) servicing the manufacturer's devices under customer-negotiated third-party service contracts source spare parts from after-market distributors without the manufacturer's approval — installing non-validated components that alter the device's performance characteristics while the device remains identified in the manufacturer's installed base registry as a device under the original cleared configuration. The manufacturer has no visibility into parts installed by third-party service organisations and no contractual mechanism for requiring these organisations to use approved parts or to report service activities — creating a regulatory exposure where the manufacturer's MDR surveillance, CAPA analysis, and recall scope calculations are based on an installed base assumption that the device fleet is maintained with manufacturer-specified components, an assumption that third-party service activity systematically invalidates.`,
    keywords: ['third-party service', 'spare parts', 'ISO 13485', 'counterfeit parts', 'installed base'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },

  // ── Installation Qualification (continued) ────────────────────────────────

  {
    code: 'M1791',
    name: 'Device Relocation by Customer Not Flagged for Re-Qualification',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description: `Customers relocating installed diagnostic devices within their facility — moving imaging equipment from one clinical department to another, repositioning diagnostic analysers, or transferring devices between hospital buildings — do not notify the manufacturer or initiate a re-qualification of the installation, leaving the device operating in a new physical environment that has not been validated against the IQ/OQ/PQ specification even though the environmental conditions, electrical supply, network connectivity, and spatial orientation may have changed materially from the original qualified installation. For imaging systems where spatial orientation, electromagnetic environment, and floor vibration affect calibration stability, an unnotified relocation without re-qualification creates a device in a potentially unvalidated operating state — and if a patient safety event follows the relocation, the absence of a re-qualification record eliminates the manufacturer's ability to demonstrate due diligence in maintaining the device's validated state at the customer site.`,
    keywords: ['installation qualification', 'IQ/OQ/PQ', 'ISO 13485', 'field service', 'site change control'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },
  {
    code: 'M1792',
    name: 'Multi-Site Health System Installation Qualification Not Standardised Across Sites',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `A health system with multiple hospital campuses purchasing a standardised device fleet across all sites receives variable installation qualification execution — different field technicians applying the IQ/OQ/PQ protocol with different rigour, different acceptance criteria interpretations, and different environmental measurement practices — producing an installed base where devices at different sites were qualified against materially different standards despite using the same IQ/OQ/PQ protocol document. The inconsistency in installation qualification execution is a training and oversight gap under ISO 13485:2016 §6.2 and §7.1, and when site-to-site performance variability is subsequently reported in post-market surveillance data, the inability to confirm that all sites were qualified equivalently prevents the manufacturer from using installation quality as a controlled variable in the investigation — making the root cause analysis for performance variability substantially more complex.`,
    keywords: ['installation qualification', 'IQ/OQ/PQ', 'ISO 13485', 'multi-site', 'field service'],
    subTopic: 'installation-qualification',
  },

  // ── Service Documentation (continued) ────────────────────────────────────

  {
    code: 'M1793',
    name: 'Service Manual Update Lag — Technicians Use Outdated Procedures After Design Change',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description: `Design changes approved through the design change control process under ISO 13485:2016 §7.3.9 that affect service and maintenance procedures — new component installation sequences, revised torque specifications, updated calibration sequences — are implemented in the device design and manufacturing without a corresponding update to the field service manual deployed to field technicians, creating a period of variable length where technicians service the new device configuration using procedures written for the old configuration. The service manual update lag is a specific form of design change control non-compliance that is most consequential when the design change was implemented to address a safety issue — a CAPA-driven design change — because technicians using the pre-CAPA service procedure will not apply the safety-critical repair change that the CAPA was intended to implement in all affected field devices.`,
    keywords: ['service manual', 'ISO 13485', 'design controls', 'CAPA', 'document control'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1794',
    name: 'Field Corrective Action Documentation Does Not Meet ISO 13485 Audit Trail Requirements',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description: `Field safety corrective action service records — documenting that a specific device received the corrective action required by a recall or field safety notice — do not include the mandatory data elements for an ISO 13485-compliant audit trail: technician identification, date and time of corrective action, device serial number, software version post-correction, corrective action procedure reference, and verification measurement confirming the corrective action was effective. During FDA's MDR follow-up for a field safety corrective action, the agency requests documented evidence that affected devices were remediated, and service records that lack the required data elements cannot serve as regulatory evidence of remediation completion — potentially triggering a voluntary recall escalation if the corrective action population cannot be confirmed as fully remediated.`,
    keywords: ['FDA 21 CFR Part 806', 'field corrective action', 'ISO 13485', 'service records', 'audit trail'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },

  // ── Preventive Maintenance (continued) ───────────────────────────────────

  {
    code: 'M1795',
    name: 'PM Resource Shortage Defers Safety-Critical Maintenance Across Installed Base',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description: `Sustained field service staffing shortages — driven by technician attrition, geographic territory imbalance, or increased installation volume — cause preventive maintenance schedules to accumulate deferrals across a large fraction of the installed base, with PMs systematically delayed by 30–90 days beyond the manufacturer-specified interval, placing a growing proportion of the fleet outside its validated PM window and into an unvalidated operating state where the manufacturer's performance claims and cleared specifications may not apply. For a connected diagnostics device company with hundreds of sites relying on continuous device availability, PM schedule drift translates directly into clinical risk: devices operating beyond PM intervals may generate diagnostic outputs outside the performance specification window of the cleared device without any alert to clinical staff, and the manufacturer's post-market surveillance data shows elevated complaint rates correlating with PM interval overrun clusters — a causal signal that is suppressed when service capacity management focuses on overall PM completion volume rather than interval compliance rate.`,
    keywords: ['preventive maintenance', 'ISO 13485', 'field service', 'installed base', 'clinical safety'],
    demoRelevant: true,
    subTopic: 'preventive-maintenance',
  },
  {
    code: 'M1796',
    name: 'Calibration Standard Traceability to NIST Broken — PM Records Non-Compliant',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `Field service calibration activities use reference standards — measurement artifacts, electronic reference signals, or physical calibration targets — that have not been calibrated in the current calibration cycle to a national standard traceable to NIST or an equivalent national metrology institute, breaking the traceability chain required by ISO 13485:2016 §7.6 and ISO 10012 for measurement equipment used in quality-affecting operations. PM records citing calibration measurements made with non-traceable reference standards cannot be used as quality records under ISO 13485, and clinical laboratory customers operating under CLIA or College of American Pathologists (CAP) accreditation who rely on the manufacturer's PM service to maintain their own equipment qualification records may have their laboratory accreditation at risk if an accreditation inspector identifies non-traceable calibration records in the biomedical equipment maintenance file.`,
    keywords: ['calibration traceability', 'ISO 13485', 'NIST', 'preventive maintenance', 'CLIA'],
    subTopic: 'preventive-maintenance',
  },

  // ── Spare Parts (continued) ───────────────────────────────────────────────

  {
    code: 'M1797',
    name: 'Spare Parts Qualification Testing Not Repeated After Component Re-Sourcing',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description: `A critical spare part is re-sourced from a new supplier after the original supplier discontinues the component — with the new supplier's component meeting the mechanical and electrical dimensional specifications but not having been subjected to the full biocompatibility testing, reliability testing, and performance qualification against device specifications that the original component underwent before inclusion on the approved supplier list. ISO 13485:2016 §7.4.1 requires that component re-sourcing be treated as a new supplier qualification requiring the same evidence of supply capability and quality as the original qualification, and a re-sourced component used in field service repairs without re-qualification creates a device in a configuration that has not been validated to the same standard as the cleared device — a design change without design control, exposed during the first field safety investigation that traces a failure to the re-sourced component.`,
    keywords: ['spare parts', 'supplier qualification', 'ISO 13485', 'design controls', 'component re-sourcing'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },
  {
    code: 'M1798',
    name: 'Spare Parts Inventory Visibility Gap Causes Avoidable AOG-Equivalent Events',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description: `Field service operations lack real-time visibility into spare parts inventory across regional depots and technician vehicle stock, causing serviceable spare parts that are physically present in the service network to be unavailable in the inventory system when a technician requires them — resulting in emergency part orders and device downtime that could have been avoided if the distributed inventory had been accurately tracked. For connected diagnostic devices used in high-acuity clinical settings — surgical imaging suites, emergency radiology, intensive care unit point-of-care testing — extended device downtime from avoidable parts logistics delays creates the medtech equivalent of an airline AOG event: clinical workflows are disrupted, patient cases are delayed, and hospital administration receives an escalation that damages the manufacturer's service reputation and contract renewal position.`,
    keywords: ['spare parts', 'ISO 13485', 'inventory management', 'field service', 'device availability'],
    demoRelevant: true,
    subTopic: 'spare-parts',
  },

  // ── AI Field Service (continued) ──────────────────────────────────────────

  {
    code: 'M1799',
    name: 'Natural Language Processing Service Notes Tool Cannot Extract MDR-Relevant Events',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description: `An NLP tool deployed to extract structured data from free-text field service notes — identifying fault codes, parts installed, and resolution actions — is not configured to identify language patterns indicating patient injury, near-miss events, or device failures likely to cause serious injury that would require MDR assessment under 21 CFR Part 803, meaning potentially reportable events described in technician prose notes flow through the NLP extraction pipeline without being flagged for complaint handling review. The NLP tool's MDR-keyword sensitivity gap is a systemic complaint handling failure amplified by scale: field service notes that previously would have been reviewed by a clinical complaint coordinator are now processed by an NLP pipeline that efficiently extracts operational data but eliminates the human review step that would have caught MDR-relevant language patterns in the technician's narrative.`,
    keywords: ['NLP service notes', 'MDR', 'FDA 21 CFR Part 803', 'ISO 13485', 'complaint handling'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1800',
    name: 'Augmented Reality Field Service Tool Introduces Unofficial Repair Procedures',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description: `An augmented reality (AR) field service guidance platform used by technicians to overlay repair instructions on the physical device presents procedure steps that diverge from the current approved service manual because the AR content database is not synchronised with the document control system's approved procedure versions — resulting in technicians following AR-guided repair steps that may reflect superseded procedures, pre-change-control design configurations, or manufacturer-internal development variations that were never approved for field deployment. The AR platform's content versioning gap creates the same compliance exposure as technicians using an outdated printed service manual, but at a larger scale because the AR platform is designed to be the authoritative reference for technicians — its deviation from the QMS-approved procedures is less visible to quality oversight because it manifests in a digital overlay rather than a physical document.`,
    keywords: ['augmented reality', 'field service', 'ISO 13485', 'document control', 'repair procedures'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },

  // ── Remote Monitoring (continued) ─────────────────────────────────────────

  {
    code: 'M1801',
    name: 'Remote Monitoring Consent Not Obtained From Clinical Staff Using Device',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description: `Connected diagnostic devices transmit usage metadata — operator identifiers, session timing, procedure sequences — to the manufacturer's remote monitoring platform under a service agreement consent obtained from the hospital procurement or biomedical engineering department, without separate GDPR or HIPAA-compatible consent from clinical staff whose work activity is captured in the telemetry data, creating a potential employment data privacy compliance gap in EU member states where GDPR Article 9 staff data processing obligations apply to health-context work activity data. The consent gap is a common oversight in connected device deployments because device contracts are negotiated at the institutional level and usage telemetry is positioned as device performance monitoring rather than staff activity monitoring, but clinical staff whose session identifiers are transmitted as part of telemetry records have data subject rights under GDPR that the institutional procurement consent does not satisfy.`,
    keywords: ['GDPR', 'remote monitoring', 'connected device', 'consent', 'HIPAA'],
    subTopic: 'remote-monitoring',
  },
  {
    code: 'M1802',
    name: 'Remote Firmware Downgrade After Incident Removes Cleared Software Version',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `Following a field incident attributed to a software defect in the current version, the manufacturer remotely downgrades affected devices to the prior software version as an immediate corrective action — but the prior software version may itself have been superseded by the current version to address a different safety issue, and the downgrade creates a device population running a version that is no longer the cleared and supported configuration, with known deficiencies that were the reason the version was superseded. FDA's device change control expectations require that software version decisions be documented with a regulatory impact assessment, and a remote downgrade that creates a device fleet running a version with known deficiencies — even if as a temporary corrective action — requires an immediate regulatory affairs review to confirm that the downgraded version is still within cleared specifications and that the patient safety risk of the software defect being corrected is greater than the risk of the known deficiencies being reintroduced.`,
    keywords: ['remote software update', 'FDA SaMD', 'firmware downgrade', 'ISO 13485', 'PCCP'],
    demoRelevant: true,
    subTopic: 'remote-monitoring',
  },

  // ── Installation Qualification (continued) ────────────────────────────────

  {
    code: 'M1803',
    name: 'IQ/OQ/PQ Acceptance Criteria Not Updated After Post-Market Performance Study',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description: `Post-market performance studies that confirm the device operates within specification at tighter performance bounds than the original IQ/OQ/PQ acceptance criteria — for example, a post-market clinical study demonstrating that diagnostic accuracy is maintained only above a specific sensitivity threshold that is tighter than the original acceptance criterion — do not trigger a revision to the installation qualification acceptance criteria, leaving new installations qualified against criteria that are less stringent than the evidence base supports. The gap between post-market performance evidence and IQ acceptance criteria means that devices passing installation qualification under the original criteria may be operating at sensitivity levels that post-market evidence associates with reduced diagnostic accuracy — creating a patient safety concern where the installation qualification process certifies device states that the manufacturer's own performance evidence suggests are suboptimal.`,
    keywords: ['IQ/OQ/PQ', 'installation qualification', 'ISO 13485', 'post-market surveillance', 'acceptance criteria'],
    demoRelevant: true,
    subTopic: 'installation-qualification',
  },

  // ── Service Documentation (continued) ────────────────────────────────────

  {
    code: 'M1804',
    name: 'Electronic Service Record System Not Validated for 21 CFR Part 11 Compliance',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description: `The electronic field service management system used to create, store, and transmit service records has not been validated for FDA 21 CFR Part 11 compliance — lacking system access controls, audit trails for record modifications, electronic signature controls, and data integrity protections required for electronic records and electronic signatures that serve as device history records under ISO 13485:2016 §7.5.8 and 21 CFR 820.200. FDA inspectors reviewing device history records generated by a non-Part 11-compliant system will cite the absence of Part 11 controls as a systemic quality finding for any records generated after the 2003 Part 11 enforcement date, and service records that cannot be validated as authentic and unaltered do not provide the evidentiary value that ISO 13485 and 21 CFR Part 820 require for a complete device history record.`,
    keywords: ['21 CFR Part 11', 'electronic records', 'ISO 13485', 'service records', 'FDA 21 CFR 820'],
    demoRelevant: true,
    subTopic: 'service-documentation',
  },
  {
    code: 'M1805',
    name: 'Field Service Technician Error Rate Not Analysed as QMS Input',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description: `Field service technician error rates — incorrect parts installed, incorrect calibration procedures applied, post-service verification failures requiring return visits — are tracked as operational metrics in the service management system but are not systematically analysed as quality management system inputs that may indicate training gaps, procedure ambiguity, or service tool deficiencies requiring CAPA under ISO 13485:2016 §8.5.1. When field technician error patterns are invisible to the QMS, recurring service errors that create patient safety risk — installing incorrect parts that alter device performance, or calibration errors that leave devices outside specification — cannot be addressed through the systemic improvement mechanisms the QMS provides, and the service quality improvement loop is broken because the data flowing through the service management system never enters the corrective and preventive action analysis pipeline.`,
    keywords: ['ISO 13485', 'CAPA', 'field service', 'technician error', 'quality management'],
    subTopic: 'service-documentation',
  },

  // ── Remote Monitoring (continued) ─────────────────────────────────────────

  {
    code: 'M1806',
    name: 'Connected Device Retired Without Remote Access Credential Revocation',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description: `Connected devices decommissioned by customers at end of service life — traded in, disposed of, or transferred to another owner — are removed from the active installed base registry and from the service contract roster, but remote access credentials and network certificates associated with the device are not revoked in the manufacturer's remote monitoring platform, creating persistent access credentials that could be used to access the manufacturer's remote monitoring infrastructure from a device no longer under the manufacturer's control. IEC 62443 Section 3-3 security lifecycle requirements include credential management at device decommissioning as a mandatory security control, and the accumulation of unrevoked credentials for retired devices is a recognised attack surface amplification pattern that increases the manufacturer's remote monitoring platform exposure proportionally to the number of devices retired without credential revocation over the product lifecycle.`,
    keywords: ['IEC 62443', 'connected device', 'credential management', 'remote monitoring', 'cybersecurity'],
    subTopic: 'remote-monitoring',
  },

  // ── AI Field Service (continued) ──────────────────────────────────────────

  {
    code: 'M1807',
    name: 'AI-Assisted Root Cause Recommendation Accepted Without Field Evidence Review',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description: `Field service technicians using AI-assisted diagnostic tools that recommend root cause hypotheses based on remote telemetry analysis accept the AI recommendation as the service diagnosis without independently verifying the root cause at the device site — replacing hands-on diagnostic inspection with telemetry-based inference that may not accurately represent the device's physical condition when hardware degradation, environmental factors, or user errors are involved. The telemetry-to-diagnosis inference chain works reliably when the failure pattern is captured in the telemetry data stream, but systematically fails for failure modes that leave no telemetry signature — mechanical wear, connector corrosion, environmental contamination — and the technician's over-reliance on the AI recommendation means these hardware-root-cause failures receive software-targeted interventions that do not resolve the underlying fault, generating repeat service events that are classified as AI model accuracy failures only after the third or fourth repeat visit.`,
    keywords: ['AI diagnostic tool', 'field service', 'root cause analysis', 'ISO 13485', 'automation bias'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1808',
    name: 'IoT-Enabled Device Usage Analytics Used for Commercial Purposes Without Patient Consent',
    officeCategory: 'front_office',
    failureRatePct: 54,
    description: `Usage analytics data collected from connected diagnostic devices — procedure volumes, clinical workflow patterns, user interface interaction sequences — is aggregated across the installed base and used by the manufacturer's commercial team to understand clinical adoption patterns, target sales interventions, and benchmark utilisation rates, without a data use agreement with healthcare provider customers that authorises this commercial secondary use of data generated by clinical operations on patient populations. HIPAA's minimum necessary use principle and GDPR's purpose limitation principle both restrict the use of health context data to the purpose for which it was collected, and a data use policy that authorises device performance monitoring telemetry does not authorise the extraction and commercial use of clinical workflow analytics — a distinction that healthcare providers' legal and compliance teams are increasingly scrutinising in device service contract renewals.`,
    keywords: ['HIPAA', 'GDPR', 'connected device', 'usage analytics', 'IoT'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },
  {
    code: 'M1809',
    name: 'AI Service Knowledge Base Not Governed Under ISO 13485 Document Control',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description: `A machine learning–based service knowledge base that field technicians query for device-specific troubleshooting guidance — drawing on historical service records, technical bulletins, and engineering notes — is updated continuously as new service data is ingested without a document control governance process that reviews, approves, and version-controls the knowledge base content, meaning the knowledge base may surface superseded troubleshooting guidance, retracted technical bulletins, or engineering analysis that was subsequently found to be incorrect without any indication to the querying technician that the content is under review or has been superseded. ISO 13485:2016 §4.2.3 requires that controlled documents be reviewed and approved before use and that outdated documents be prevented from unintended use, and a continuously updated AI knowledge base that functions as a technical reference for quality-affecting service activities meets the definition of a controlled document that must be governed under the QMS document control requirements.`,
    keywords: ['AI service knowledge base', 'ISO 13485', 'document control', 'field service', 'FDA 21 CFR 820'],
    demoRelevant: true,
    subTopic: 'ai-field-service',
  },

];
