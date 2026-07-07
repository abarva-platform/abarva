// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Healthcare Provider patterns — AI/ML Clinical Decision Support & FDA SaMD Governance
// AbarVa Healthcare Provider corpus — Domain 08
// Code range: H2400–H2699 (300 patterns)
// Run: npx tsx src/scripts/seed/seed-healthcare-dom08-clinical-ai.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface HealthcarePatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const HEALTHCARE_CLINICAL_AI_PATTERNS: HealthcarePatternSeed[] = [
  // ── 1. Sepsis Early Warning Alert Fatigue (H2400–H2414) ──────────────────
  {
    code: 'H2400',
    name: 'Sepsis Alert False Positive Rate Overwhelming Clinical Workflow',
    officeCategory: 'front_office',
    failureRatePct: 76,
    demoRelevant: true,
    description:
      'Third-party sepsis AI alerts fire at a false positive rate exceeding 80% in community hospital deployments, creating a signal-to-noise ratio so poor that nurses silence or override every alert within seconds of acknowledgment. Meridian Health clinical data shows the deployed sepsis predictor fires on average 22 times per nurse shift, of which fewer than 4 are confirmed sepsis cases. The cognitive burden of assessing each alert competes directly with primary patient care tasks. NEJM Catalyst research on AI alert fatigue identifies false positive rates above 70% as the threshold at which clinician override behaviour becomes habitual rather than evaluative — the alert is dismissed before the clinical picture is assessed.',
    keywords: ['sepsis alert', 'alert fatigue', 'false positive rate', 'clinical decision support', 'sepsis predictor'],
  },
  {
    code: 'H2401',
    name: 'Sepsis AI Threshold Miscalibrated For Community Patient Population',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    demoRelevant: true,
    description:
      `Vendor sepsis algorithms trained on academic medical centre data are deployed without local population recalibration in community hospitals with different patient acuity, comorbidity mix, and baseline vital sign distributions. The model's sensitivity threshold was set on a population where sepsis prevalence was 4–6%; Meridian's community patient mix has 1.8% sepsis prevalence, causing the positive predictive value to collapse below clinical utility. JAMA Internal Medicine research demonstrates that sepsis model PPV is highly sensitive to local base rates and that recalibration on even 6 months of local data improves PPV by 30–50 percentage points without sacrificing sensitivity.`,
    keywords: ['sepsis predictor', 'model calibration', 'clinical validation', 'population mismatch', 'positive predictive value'],
  },
  {
    code: 'H2402',
    name: 'No Escalation Protocol Tied To Sepsis AI Alert Acknowledgment',
    officeCategory: 'front_office',
    failureRatePct: 68,
    demoRelevant: true,
    description:
      'Sepsis AI alerts surface in the EHR without a mandated response protocol — no required acknowledgment with clinical rationale, no automatic escalation on repeated override, no attending notification on third consecutive dismissal. Nurses can dismiss alerts with a single click without documenting a reason, removing the signal from the clinical record. When a patient deteriorates and a review is conducted, the alert history is present but the dismissal documentation is absent, creating liability exposure. Agency for Healthcare Research and Quality (AHRQ) studies on sepsis bundle compliance find that alert-triggered protocols must include structured response workflows to demonstrate Bundle Hour-1 compliance.',
    keywords: ['sepsis alert', 'escalation protocol', 'EHR workflow', 'alert response', 'sepsis bundle'],
  },
  {
    code: 'H2403',
    name: 'Sepsis AI Score Not Visible In Nurse Handoff Summary',
    officeCategory: 'front_office',
    failureRatePct: 62,
    demoRelevant: true,
    description:
      'Sepsis risk scores computed by the clinical AI are not surfaced in the SBAR handoff note, shift-change summary, or patient acuity dashboard viewed by incoming nurses. The score is accessible only by navigating to a separate AI tool panel, which nurses skip during rapid handoffs. As a result, a patient whose sepsis risk score elevated from 42 to 78 during the prior shift is handed off without that trend being communicated. ISMP nursing handoff research identifies score continuity gaps as a contributing factor in 34% of preventable sepsis escalation failures in hospitals with AI-based early warning tools.',
    keywords: ['sepsis score', 'nurse handoff', 'SBAR', 'clinical workflow', 'patient acuity'],
  },
  {
    code: 'H2404',
    name: 'Sepsis AI Vendor SLA Does Not Cover Alert Delivery Latency',
    officeCategory: 'back_office',
    failureRatePct: 60,
    demoRelevant: true,
    description:
      'The sepsis AI vendor contract specifies model accuracy metrics (AUC, sensitivity, specificity) but includes no SLA for real-time alert delivery latency from vital sign input to EHR alert surfacing. In practice, alert latency ranges from 2 to 47 minutes depending on HL7 feed reliability and vendor inference infrastructure load. For a condition where Hour-1 bundle compliance is the clinical standard, a 47-minute alert latency eliminates the clinical value of early warning entirely. Healthcare IT contracting research finds that latency SLAs are absent from 78% of clinical AI vendor agreements signed before 2023.',
    keywords: ['sepsis AI', 'alert latency', 'vendor SLA', 'HL7', 'clinical AI contract'],
  },
  {
    code: 'H2405',
    name: 'Physician Override Of Sepsis Alert Not Looped Into Model Feedback',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    demoRelevant: true,
    description:
      'Physicians who override sepsis AI alerts do not have their clinical rationale captured in a structured format that feeds back to the model vendor for recalibration. Override reasons are entered as free text if captured at all, and no quarterly feedback report is sent to the vendor. The model continues firing alerts on clinical presentations that experienced attending physicians consistently dismiss, widening the gap between algorithmic prediction and clinical judgement. AMIA clinical informatics research recommends structured override taxonomies as a minimum requirement for AI systems in continuous deployment to support PCCP-compliant performance monitoring.',
    keywords: ['physician override', 'model feedback', 'PCCP', 'clinical AI governance', 'sepsis model'],
  },
  {
    code: 'H2406',
    name: 'Sepsis AI Alert Fires After Patient Already On Antibiotics',
    officeCategory: 'front_office',
    failureRatePct: 70,
    demoRelevant: true,
    description:
      'The sepsis AI model does not ingest medication administration records (MAR) in real time, causing it to generate sepsis alerts for patients who are already receiving broad-spectrum antibiotics for confirmed infection. Nurses dismiss these alerts as clinically irrelevant but the dismissal contributes to aggregate override statistics that suppress the signal for genuine new-onset sepsis cases. A Joint Commission Sentinel Event Alert on alert fatigue specifically identifies medication-unaware alerting as an avoidable source of clinician desensitisation.',
    keywords: ['sepsis alert', 'medication administration', 'MAR integration', 'alert fatigue', 'EHR integration'],
  },
  {
    code: 'H2407',
    name: 'ICU Versus Floor Sepsis Thresholds Not Differentiated',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'A single sepsis alert threshold is applied across ICU, step-down, and medical/surgical floor patients despite fundamentally different baseline vital sign ranges, monitoring intensity, and clinical acuity profiles. ICU patients with known severe sepsis continue triggering the same alert model as floor patients where the signal is intended to prompt escalation. The result is ICU nurses receiving high volumes of redundant alerts for patients already receiving maximum sepsis treatment, further eroding trust in the system across both settings. Society of Critical Care Medicine (SCCM) guidelines note that sepsis scoring should be context-stratified by care setting.',
    keywords: ['sepsis threshold', 'ICU', 'care setting stratification', 'clinical decision support', 'alert calibration'],
  },
  {
    code: 'H2408',
    name: 'Post-Sepsis Alert Response Time Not Tracked As Quality Metric',
    officeCategory: 'back_office',
    failureRatePct: 67,
    demoRelevant: true,
    description:
      `The health system has no operational dashboard tracking time-from-alert to first clinical intervention for sepsis AI alerts, making it impossible to distinguish whether the system is improving Hour-1 bundle compliance or simply generating documentation. Quality improvement committees review sepsis mortality and length-of-stay but do not drill into alert-to-response latency as a process metric. CMS Sepsis Core Measure (SEP-1) reporting requires bundle compliance evidence; without response time tracking, the AI's contribution to compliance cannot be demonstrated to payers or regulators.`,
    keywords: ['sepsis bundle', 'SEP-1', 'response time', 'quality metric', 'CMS'],
  },
  {
    code: 'H2409',
    name: 'Sepsis Model Not Retrained After EHR Upgrade Changing Vital Sign Encoding',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    demoRelevant: true,
    description:
      `Following an Epic upgrade that changed the LOINC encoding for certain vital sign observations, the sepsis AI model's feature extraction pipeline silently began receiving null values for respiratory rate and temperature. The model continued to score patients and generate alerts using stale values, degrading sensitivity without triggering any model health alarm. The issue was discovered four months later during a clinical audit. FDA guidance on SaMD performance monitoring specifically calls out EHR interface changes as a trigger for mandatory model revalidation under PCCP obligations.`,
    keywords: ['model drift', 'EHR upgrade', 'LOINC', 'PCCP', 'SaMD revalidation'],
  },
  {
    code: 'H2410',
    name: 'Sepsis AI Deployment Without Baseline Mortality Measurement',
    officeCategory: 'back_office',
    failureRatePct: 69,
    description:
      'The sepsis AI tool was deployed without establishing pre-implementation sepsis mortality and length-of-stay baselines that would allow post-deployment outcome measurement. Eighteen months after go-live, the CMO cannot answer whether the tool has improved patient outcomes because no control period was defined. Vendor-supplied aggregate benchmark comparisons from other hospitals are not a valid substitute for within-institution pre-post measurement. AHRQ clinical AI implementation research identifies absence of pre-deployment baselines as the most common barrier to demonstrating clinical AI return on investment.',
    keywords: ['clinical AI ROI', 'baseline measurement', 'sepsis outcomes', 'implementation science', 'pre-post study'],
  },
  {
    code: 'H2411',
    name: 'Night-Shift Sepsis Alert Volume Peaks Without Staffing Adjustment',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'Sepsis AI alert volume is highest between 02:00 and 06:00 when staffing ratios are at their lowest. The same algorithm fires with the same threshold regardless of nurse-to-patient ratio, generating alert burdens that floor nurses cannot clinically evaluate within the hour-1 window. No adaptive threshold or staffing-aware suppression is implemented. Nursing informatics research from Mayo Clinic identifies night-shift alert burden as a critical implementation gap, recommending dynamic threshold adjustment or escalation-direct routing when staffing falls below minimum safe ratios.',
    keywords: ['alert fatigue', 'night shift', 'nurse staffing', 'alert threshold', 'patient safety'],
  },
  {
    code: 'H2412',
    name: 'Sepsis AI Not Integrated With Rapid Response Team Activation',
    officeCategory: 'front_office',
    failureRatePct: 66,
    demoRelevant: true,
    description:
      'High-acuity sepsis AI scores (above 90th percentile) are not automatically routed to the Rapid Response Team activation pathway. Nurses must manually call the RRT after reviewing the alert, introducing an average 18-minute delay between alert generation and RRT notification. In a hospital where median RRT arrival time is 7 minutes, the alert-to-call gap consumes the clinical intervention window. The Institute for Healthcare Improvement (IHI) recommends AI-to-RRT direct routing pathways for alerts above configurable severity thresholds.',
    keywords: ['rapid response team', 'sepsis AI', 'clinical escalation', 'RRT activation', 'EHR workflow'],
  },
  {
    code: 'H2413',
    name: 'Sepsis AI Performance Not Stratified By Attending Physician',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'Monthly sepsis AI performance reports present aggregate override rates without stratification by attending physician, service line, or clinical unit. High-override physicians who are systematically dismissing valid alerts without clinical justification are invisible in aggregate statistics. A targeted peer review of physician-level override patterns would identify outliers for focused education or policy intervention. Joint Commission MS Standard requires that clinical AI performance be reviewable at the individual clinician level when the tool informs patient care decisions.',
    keywords: ['physician override', 'clinical AI monitoring', 'peer review', 'sepsis', 'quality reporting'],
  },
  {
    code: 'H2414',
    name: 'Sepsis AI Contract Lacks Performance Warranty At Renewal',
    officeCategory: 'back_office',
    failureRatePct: 58,
    demoRelevant: true,
    description:
      'The sepsis AI vendor contract specifies AUC and sensitivity metrics at time of initial validation but does not include a renewable performance warranty requiring the vendor to revalidate model performance against local outcomes data at each contract renewal. At the 3-year renewal, the health system has no contractual basis to demand evidence of maintained performance and renews at a 12% price increase without performance verification. Healthcare legal research identifies performance warranty absence as the most impactful omission in clinical AI vendor agreements, transferring all model performance risk to the health system.',
    keywords: ['clinical AI contract', 'performance warranty', 'vendor renewal', 'SaMD governance', 'model performance'],
  },

  // ── 2. Deterioration Index Miscalibration (H2415–H2429) ──────────────────
  {
    code: 'H2415',
    name: 'Epic Deterioration Index Threshold Not Locally Validated',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    demoRelevant: true,
    description:
      'Epic ships the Deterioration Index (EDI) with a default alert threshold of 65, calibrated on Epic\'s aggregate multi-hospital training population. Meridian Health has not conducted a threshold optimisation study on its own patient population to determine whether 65, 70, or 75 produces the optimal sensitivity-specificity balance for its patient mix. Operating on the default threshold produces alert volumes and false positive rates that differ materially from institutions that have performed local calibration. A 2023 JAMIA study of 14 Epic-using hospitals found that locally calibrated EDI thresholds reduced alert volume by 31% while maintaining sensitivity, compared to default-threshold deployments.',
    keywords: ['Epic Deterioration Index', 'EDI', 'alert threshold', 'local calibration', 'clinical decision support'],
  },
  {
    code: 'H2416',
    name: 'NEWS Score Manual Entry Not Triggering Deterioration Index Update',
    officeCategory: 'front_office',
    failureRatePct: 67,
    demoRelevant: true,
    description:
      'Nursing staff on medical/surgical floors document National Early Warning Score (NEWS) assessments via manual flowsheet entry. The deterioration index model is configured to ingest automatically charted vitals from connected monitoring devices but does not reliably incorporate manually entered NEWS component values, creating a two-tier situation where monitored patients receive real-time EDI updates while non-telemetry patients have stale scores. Patients at highest risk of deterioration are disproportionately in the non-monitored population, meaning the patients who most need AI surveillance receive the least current scores.',
    keywords: ['NEWS score', 'Epic Deterioration Index', 'manual entry', 'EHR integration', 'patient monitoring'],
  },
  {
    code: 'H2417',
    name: 'Deterioration Index Clinician Trust Gap From Opaque Score Rationale',
    officeCategory: 'front_office',
    failureRatePct: 71,
    demoRelevant: true,
    description:
      'Physicians and nurses report low trust in the deterioration index because they cannot see which vital sign components or lab values are driving the score at any given moment. Epic\'s default EDI display shows a numeric score and trend arrow without explainability. When clinicians ask "why is this patient at 82?" the system cannot answer. AI algorithm explainability research from UCSF and Stanford demonstrates that clinician trust and appropriate alert response rates are significantly higher for AI tools that display top contributing features alongside the score — a feature Epic introduced in later versions not yet deployed at Meridian.',
    keywords: ['algorithm explainability', 'clinical trust', 'deterioration index', 'black-box AI', 'Epic EDI'],
  },
  {
    code: 'H2418',
    name: 'Post-Surgical Deterioration Index Miscalibrated For Expected Vital Sign Changes',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'The deterioration index is not configured with post-surgical vital sign adjustment factors, causing patients recovering from elective procedures (elevated heart rate, mildly suppressed oxygen saturation, fever) to generate high-acuity alerts that clinical staff recognise as expected post-operative findings. Surgical nurses override these alerts routinely, degrading their response to the model across the entire unit. Perioperative informatics literature recommends procedure-type-specific deterioration thresholds or temporary suppression windows for defined post-operative vital sign corridors.',
    keywords: ['post-surgical', 'deterioration index', 'vital sign adjustment', 'alert suppression', 'perioperative AI'],
  },
  {
    code: 'H2419',
    name: 'Deterioration Index Data Displayed But Not In Nurse Task List',
    officeCategory: 'front_office',
    failureRatePct: 63,
    demoRelevant: true,
    description:
      'The Epic Deterioration Index is visible on the Storyboard patient summary panel, but high-acuity scores do not generate a task in the nurse\'s Nursing Task List requiring acknowledgment and response. Nurses who are managing task queues during high-census periods never navigate to the Storyboard panel, so deterioration alerts are visible but not actionable within the EHR workflow design. Epic\'s Best Practice Advisory (BPA) framework supports task-generating alerts tied to deterioration thresholds — a configuration option that Meridian has not implemented.',
    keywords: ['Epic workflow', 'nursing task list', 'deterioration index', 'BPA', 'EHR configuration'],
  },
  {
    code: 'H2420',
    name: 'MEWS Score Duplicating Deterioration Index Without Clinical Governance',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      'The health system runs both a manually calculated Modified Early Warning Score (MEWS) flowsheet and the Epic Deterioration Index simultaneously on the same patients, with no clinical governance defining which score takes precedence for escalation decisions. Nurses receive conflicting guidance from charge nurses (use MEWS for RRT calls) and hospitalists (use EDI). The duplication creates documentation burden and confusion about which tool to trust. Clinical informatics governance frameworks recommend a single-source-of-truth deterioration score with explicit decommissioning of legacy manual scoring tools upon AI deployment.',
    keywords: ['MEWS', 'deterioration index', 'duplicate scoring', 'clinical governance', 'early warning score'],
  },
  {
    code: 'H2421',
    name: 'Deterioration Index Not Visible In Emergency Department Transfer Decisions',
    officeCategory: 'front_office',
    failureRatePct: 65,
    demoRelevant: true,
    description:
      'When medical/surgical patients are being evaluated for transfer to ICU or step-down, the deterioration index trend over the prior 24 hours is not surfaced in the escalation order set or transfer request form. Hospitalists making escalation decisions review vitals and labs but do not systematically review EDI trend — a piece of longitudinal information that is specifically designed to predict deterioration trajectory. A prospective study at a peer institution found that EDI trend integration into transfer decision support reduced unplanned ICU escalations within 12 hours of transfer by 28%.',
    keywords: ['ICU transfer', 'deterioration index', 'clinical escalation', 'decision support', 'hospitalist workflow'],
  },
  {
    code: 'H2422',
    name: 'No Mortality Review Process Linked To Deterioration Index Misses',
    officeCategory: 'back_office',
    failureRatePct: 70,
    demoRelevant: true,
    description:
      'Unexpected patient deterioration events and inpatient deaths are reviewed by quality committees but the review process does not systematically examine deterioration index score trajectory in the 12 hours prior to the event. Committee minutes show clinical narrative reviews without AI model performance analysis. This gap means the health system cannot determine whether the deterioration index failed to alert (sensitivity miss), alerted and was dismissed (workflow miss), or alerted and triggered appropriate response but the patient deteriorated despite intervention (clinical limitation). TJC requirement for sentinel event review does not yet mandate AI performance review, but CMS Conditions of Participation quality improvement standards support it.',
    keywords: ['mortality review', 'deterioration index', 'quality committee', 'sentinel event', 'AI performance'],
  },
  {
    code: 'H2423',
    name: 'Deterioration Index Score Not Documented In Transfer-Of-Care Records',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'When patients are transferred between units, discharged to skilled nursing facilities, or transitioned to home health, the deterioration index scores and trend data from the inpatient stay are not included in the transfer-of-care documentation. Receiving facilities and home health agencies have no visibility into the AI-generated risk trajectory that existed during the hospital stay, limiting their ability to appropriately monitor post-discharge patients. CMS discharge planning rules (42 CFR 482.43) increasingly require communication of risk stratification data to post-acute providers.',
    keywords: ['care transitions', 'deterioration index', 'discharge planning', 'transfer documentation', 'post-acute care'],
  },
  {
    code: 'H2424',
    name: 'Paediatric Deterioration Index Applied Without Age-Specific Norms',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      'The health system applies adult-trained deterioration index models to paediatric patients without configuring age-specific vital sign norms. Children have fundamentally different baseline heart rate, respiratory rate, and blood pressure ranges than adults; an adult-calibrated model generates excessive false positives in paediatrics while potentially missing deterioration patterns unique to paediatric physiology. The American Academy of Pediatrics and SCCM both recommend against deployment of adult early warning AI systems in paediatric settings without prospective paediatric validation studies.',
    keywords: ['paediatric AI', 'deterioration index', 'age norms', 'clinical validation', 'patient safety'],
  },
  {
    code: 'H2425',
    name: 'Deterioration Index Vendor Support Lag For Epic Version Updates',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The third-party deterioration index model relies on Epic-extracted data via HL7 FHIR APIs. When Epic releases a major version update, the vendor requires 60–90 days to validate compatibility, during which the health system must either delay the Epic upgrade or run the AI tool in a degraded state without full vital sign integration. Contract terms do not specify maximum acceptable compatibility lag or penalty for delayed support, and the health system has experienced two periods of degraded AI performance following Epic upgrades in the past 18 months.',
    keywords: ['Epic upgrade', 'vendor compatibility', 'FHIR API', 'SaMD maintenance', 'AI governance'],
  },
  {
    code: 'H2426',
    name: 'Deterioration Index Alerts Not Auditable By Patient Safety Officers',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'The patient safety officer does not have a dedicated reporting view showing deterioration index alert history, override rates, and response times by unit. Safety investigations require manual data extraction from Epic and the AI vendor portal, which have different event timestamps and cannot be reliably joined without IT support. The inability to perform self-service safety audits delays investigations and prevents proactive monitoring. ONC\'s HTI-1 rule on algorithm transparency requires that AI tools used in certified EHR workflows expose performance data in a format accessible to clinical governance.',
    keywords: ['patient safety audit', 'deterioration index', 'algorithm transparency', 'ONC HTI-1', 'EHR reporting'],
  },
  {
    code: 'H2427',
    name: 'Deterioration Index Not Revalidated After Formulary Change',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'The pharmacy formulary was updated to add a new vasopressor and remove a first-line antibiotic, changes that affect the clinical management patterns the deterioration index model implicitly learned from its training data. The model vendor was not notified of the formulary change and conducted no revalidation study. FDA SaMD guidance requires that predetermined change control plans identify formulary and care protocol changes as triggers for model performance review, as changes in clinical practice can alter the distribution of inputs the model was trained to interpret.',
    keywords: ['formulary change', 'deterioration index', 'PCCP', 'model revalidation', 'SaMD'],
  },
  {
    code: 'H2428',
    name: 'Deterioration Index Confidence Interval Not Displayed To Clinicians',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'The deterioration index displays a single numeric score (e.g., "72") without a confidence interval or indication of score uncertainty. For patients with incomplete vital sign data — a common occurrence when monitoring leads are disconnected for ambulation — the model generates a score based on partial inputs, and the score is displayed with the same visual weight as a fully-supported score. Clinicians have no way to distinguish a high-confidence 72 from a low-confidence 72, leading to either over-reliance on uncertain scores or global distrust of all scores.',
    keywords: ['AI uncertainty', 'confidence interval', 'deterioration index', 'clinical decision support', 'incomplete data'],
  },
  {
    code: 'H2429',
    name: 'Deterioration Index Generating Alerts During Planned Procedures',
    officeCategory: 'front_office',
    failureRatePct: 63,
    description:
      'Patients undergoing planned bedside procedures such as thoracentesis, central line placement, or cardioversion have expected vital sign perturbations that the deterioration index flags as high-acuity alerts. There is no procedure-in-progress flag that suppresses AI alerts during defined procedural windows, so proceduralists and nurses receive alerts they know are artifactual, further eroding trust in the system. Epic\'s deterioration index configuration supports temporary suppression tied to procedure order entry, a feature not yet configured at Meridian.',
    keywords: ['procedure suppression', 'deterioration index', 'alert fatigue', 'EHR configuration', 'bedside procedures'],
  },

  // ── 3. AI Diagnostic Aide Without Physician Override Workflow (H2430–H2444) ─
  {
    code: 'H2430',
    name: 'Radiology AI Finding Routed To Worklist Without Override Mechanism',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      'AI-generated radiology findings (pneumothorax flag, pulmonary embolism probability, intracranial bleed detection) are surfaced in the radiology PACS worklist without a structured mechanism for the radiologist to document disagreement, override, or escalation. When the AI flags an abnormality that the radiologist determines is a false positive, the override is documented as free-text in the report rather than as a structured data element. The absence of structured override data prevents audit of AI performance, feedback to the vendor, and demonstration of physician-controlled decision authority required by FDA SaMD Class II guidance.',
    keywords: ['radiology AI', 'physician override', 'PACS workflow', 'SaMD', 'diagnostic AI'],
  },
  {
    code: 'H2431',
    name: 'AI CDS Tool Presented As Definitive Diagnosis Rather Than Probability',
    officeCategory: 'front_office',
    failureRatePct: 75,
    description:
      'The clinical decision support interface displays AI-generated findings using language that communicates diagnostic certainty (e.g., "Pneumothorax detected" rather than "Pneumothorax probability: 84%"). When clinicians review these displays, the framing creates anchoring bias — subsequent clinical assessment is influenced by the AI\'s confident language, reducing the likelihood that contradictory clinical evidence receives appropriate weight. JAMA study on AI framing effects found that clinicians who viewed probability-framed AI outputs changed their diagnostic assessment in response to contradicting clinical evidence 40% more often than those viewing certainty-framed outputs.',
    keywords: ['diagnostic AI', 'framing effect', 'anchoring bias', 'probability display', 'clinical decision support'],
  },
  {
    code: 'H2432',
    name: 'AI Diagnostic Tool Deployed For Indication Beyond FDA Clearance Scope',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'A radiology AI tool FDA-cleared for detecting intracranial haemorrhage on non-contrast CT is being used by radiologists to assist in identifying ischaemic stroke findings — an indication not covered by the 510(k) clearance. The clinical informatics team implemented the broader use without reviewing the FDA clearance documentation. Off-label AI use creates liability exposure if an adverse patient outcome is linked to the AI\'s performance on the uncovered indication, and violates the FDA\'s definition of intended use for SaMD. A 2024 FDA Warning Letter cited exactly this pattern at a community radiology practice.',
    keywords: ['off-label AI', 'FDA 510(k)', 'SaMD intended use', 'radiology AI', 'regulatory compliance'],
  },
  {
    code: 'H2433',
    name: 'No Clinical AI Liability Policy Covering Physician Reliance On AI Output',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'The health system\'s medical malpractice insurance policy and internal liability framework do not address the liability allocation between the institution, the AI vendor, and the individual clinician when an adverse patient outcome is associated with an AI-assisted decision. Legal counsel and risk management have not issued guidance on whether following an AI recommendation constitutes a standard-of-care defence or whether overriding an AI recommendation creates documentation obligations. This ambiguity leads some clinicians to over-rely on AI outputs to create a paper trail and others to avoid AI tools entirely.',
    keywords: ['AI liability', 'malpractice', 'clinical AI governance', 'risk management', 'physician responsibility'],
  },
  {
    code: 'H2434',
    name: 'AI Diagnostic Tool Performance Not Measured Against Local Radiologist Baseline',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    demoRelevant: false,
    description:
      'The health system deployed a radiology AI triage tool without establishing a pre-deployment baseline of radiologist diagnostic performance (sensitivity, specificity, time-to-read) that would enable comparison of AI-assisted versus unassisted performance. Vendor-supplied performance benchmarks from published studies do not reflect the local patient population, equipment calibration, or radiologist skill mix. Without a local comparative benchmark, the clinical informatics committee cannot determine whether the AI is improving or degrading diagnostic performance, or whether the investment is justified.',
    keywords: ['radiology AI', 'diagnostic performance', 'baseline measurement', 'clinical validation', 'reader study'],
  },
  {
    code: 'H2435',
    name: 'AI Findings Not Included In Structured Radiology Report',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      'Radiology AI triage scores and probability outputs are available in a separate vendor portal but are not automatically inserted as structured elements into the radiology report that flows to the ordering physician and EHR. Radiologists who use the AI tool must manually transcribe relevant findings; most omit AI data from reports entirely. Ordering physicians and downstream care teams have no access to the AI-generated risk stratification unless they can access the separate vendor portal. Interoperability is a core ONC requirement for certified health IT, and AI outputs that remain siloed from the clinical record fail the integration standard.',
    keywords: ['radiology report', 'AI integration', 'structured reporting', 'ONC interoperability', 'PACS'],
  },
  {
    code: 'H2436',
    name: 'Clinical AI Informed Consent Not Obtained From Patients',
    officeCategory: 'front_office',
    failureRatePct: 59,
    description:
      'Patients are not informed that AI tools are being used in their diagnostic workup or clinical monitoring. Hospital consent forms were drafted before AI deployment and do not include disclosure of AI decision support use. Several states (Colorado, California) have enacted or proposed laws requiring patient disclosure when AI significantly influences a clinical decision. The absence of AI-specific consent language in admission documentation creates patient rights and regulatory compliance exposure that risk management has not yet addressed.',
    keywords: ['patient consent', 'AI disclosure', 'informed consent', 'state AI law', 'patient rights'],
  },
  {
    code: 'H2437',
    name: 'AI Override Documentation Not Retrievable For Credentialing Review',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Physician AI override patterns are not compiled into a performance profile that medical staff credentialing uses during privilege renewal. A physician who overrides clinical AI alerts at a rate three standard deviations above peers is not flagged in the credentialing process, even when override patterns correlate with elevated patient complication rates in post-hoc analysis. Joint Commission MS Standard requires that relevant performance data inform privilege renewal decisions; AI tool usage data is not yet considered relevant performance data by most health systems\' credentialing policies.',
    keywords: ['physician credentialing', 'AI override', 'medical staff', 'performance monitoring', 'Joint Commission'],
  },
  {
    code: 'H2438',
    name: 'Second Reader AI Deployed Without Dual-Report Workflow',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'An AI second-reader tool for mammography screening is deployed with the intent that it serves as a second opinion on suspicious findings. However, the workflow does not require radiologists to document their pre-AI reading before reviewing the AI output, creating a situation where the AI opinion becomes an anchor that radiologists confirm rather than a true independent second read. Prospective validation studies on AI second-reader accuracy require masked primary-read methodology; the absence of workflow separation means the tool may improve documentation consistency without improving diagnostic accuracy.',
    keywords: ['mammography AI', 'second reader', 'anchoring bias', 'screening AI', 'workflow design'],
  },
  {
    code: 'H2439',
    name: 'AI Alert Suppression Feature Not Governed By Clinical Policy',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      'Epic and third-party AI tools include configuration options for individual clinicians or units to suppress specific alert types. Without a formal governance policy defining who can suppress alerts, for how long, and with what clinical justification, charge nurses and department heads suppress alerts unilaterally to manage workflow burden. When a suppressed alert type subsequently contributes to a patient safety event, the suppression decision cannot be traced to an authorised clinical governance decision. ISMP recommends that all clinical alert suppression decisions require documented clinical rationale reviewed by the patient safety officer.',
    keywords: ['alert suppression', 'clinical governance', 'patient safety', 'AI configuration', 'ISMP'],
  },
  {
    code: 'H2440',
    name: 'Pathology AI Tool Deployed Without CAP Validation Protocol',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      'A computational pathology AI tool for lymph node metastasis detection in colon cancer specimens was deployed following vendor-supplied validation data without conducting a College of American Pathologists (CAP)-recommended internal validation study on the institution\'s own staining protocols and scanner hardware. Pathology AI performance is sensitive to staining variation between institutions; a tool validated on Hematoxylin and Eosin staining from one vendor\'s slides may perform differently on another institution\'s slides. CAP Laboratory Accreditation Program requires internal validation before clinical deployment of AI-assisted diagnostic tools.',
    keywords: ['pathology AI', 'CAP accreditation', 'computational pathology', 'clinical validation', 'staining variation'],
  },
  {
    code: 'H2441',
    name: 'AI Diagnostic Performance Degrading After Scanner Hardware Upgrade',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      'After replacing two CT scanners with a newer generation model, radiology AI performance degraded because the model was trained on image data from the older scanner hardware, and the new hardware produces images with different noise characteristics, spatial resolution, and windowing defaults. The vendor was not notified of the scanner change and the AI continued to operate without revalidation. FDA SaMD guidance and PCCP frameworks identify hardware changes in the imaging acquisition chain as a mandatory revalidation trigger for radiology AI SaMD.',
    keywords: ['scanner upgrade', 'radiology AI', 'PCCP', 'hardware change', 'image quality'],
  },
  {
    code: 'H2442',
    name: 'AI Tool Providing Diagnosis In State Where This Constitutes Practice Of Medicine',
    officeCategory: 'back_office',
    failureRatePct: 62,
    description:
      'The AI diagnostic tool is configured to provide standalone diagnostic conclusions in patient-facing summaries and certain physician workflow screens without a supervising physician review step. Several states\' medical practice acts define automated diagnostic conclusions as the practice of medicine, requiring physician licensure. Risk and legal teams have not reviewed the tool\'s output modes against state-specific medical practice statutes. Two states in the health system\'s service area have active legislation that would classify the current tool configuration as an unlicensed practice of medicine.',
    keywords: ['practice of medicine', 'AI diagnosis', 'state medical law', 'regulatory compliance', 'legal risk'],
  },
  {
    code: 'H2443',
    name: 'Downstream Care Team Not Receiving AI Triage Priority Flags',
    officeCategory: 'front_office',
    failureRatePct: 74,
    description:
      'AI triage priority flags generated by radiology and ED AI tools (stroke, STEMI, large vessel occlusion) are visible only in the department where the AI is deployed and do not flow to the receiving care team — neurology, interventional cardiology, or the stroke team — via automated notification. The receiving team relies on manual phone calls to learn of AI-flagged high-acuity findings. Mean delay from AI flag to specialist notification is 14 minutes, compared to a 4-minute target for time-sensitive conditions. HL7 FHIR alert propagation standards support automated notification workflows that the health system has not implemented.',
    keywords: ['AI triage', 'specialist notification', 'FHIR alert', 'stroke AI', 'time-critical workflow'],
  },
  {
    code: 'H2444',
    name: 'Clinical AI Audit Log Not Meeting HIPAA Security Rule Requirements',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'The clinical AI platform\'s access logs do not capture the full set of audit data required by the HIPAA Security Rule (45 CFR 164.312(b)): user identity, time of access, patient record accessed, and AI recommendation viewed. Log retention is 60 days versus the HIPAA-required 6 years. When OCR conducted a complaint investigation, the health system could not produce AI access logs covering the period in question. HIPAA compliance requires that any system accessing PHI — including AI inference engines — maintain audit controls meeting the 164.312(b) standard.',
    keywords: ['HIPAA audit log', 'clinical AI', 'security rule', 'PHI access', 'OCR investigation'],
  },

  // ── 4. FDA SaMD Without PCCP (H2445–H2459) ────────────────────────────────
  {
    code: 'H2445',
    name: 'SaMD Deployed Without FDA Clearance Verification By Clinical Informatics',
    officeCategory: 'back_office',
    failureRatePct: 71,
    description:
      'Clinical informatics teams procure and deploy AI tools sold by vendors as FDA-cleared SaMD without independently verifying the scope, device classification, and current clearance status of the device. Vendor sales materials describe FDA clearance broadly; actual clearances cover narrower indications, specific software versions, or particular hardware configurations that differ from the deployment. FDA\'s 510(k) database is publicly searchable but is not systematically queried during procurement review. Three AI tools in active clinical use at Meridian have either lapsed clearances or are being used outside their cleared indication.',
    keywords: ['FDA clearance', 'SaMD', '510(k)', 'clinical AI procurement', 'regulatory compliance'],
  },
  {
    code: 'H2446',
    name: 'No Predetermined Change Control Plan Filed For Deployed SaMD',
    officeCategory: 'back_office',
    failureRatePct: 76,
    demoRelevant: true,
    description:
      'The health system has deployed three FDA Class II SaMD tools (sepsis predictor, deterioration index, radiology triage AI) whose vendors have filed FDA marketing authorisation applications but none of which include a Predetermined Change Control Plan (PCCP) specifying what model modifications can be made without a new regulatory submission. Under the FDA\'s 2023 PCCP guidance, covered AI/ML SaMD must have a PCCP as a condition of regulatory compliance. Operating SaMD without a filed PCCP means every model update — weight adjustment, threshold change, feature addition — technically requires a new 510(k) submission. The FDA issued a Safety Communication in 2024 alerting health systems to verify PCCP status of deployed AI SaMD.',
    keywords: ['PCCP', 'SaMD', 'FDA compliance', 'predetermined change control plan', 'AI/ML SaMD'],
  },
  {
    code: 'H2447',
    name: 'SaMD Vendor Model Update Deployed Without Health System Awareness',
    officeCategory: 'back_office',
    failureRatePct: 69,
    demoRelevant: true,
    description:
      'The SaMD vendor deployed a model update (retrained weights, adjusted decision threshold) to the health system\'s hosted instance without advance notification. The update changed the sensitivity-specificity tradeoff of the sepsis predictor; alert volume increased 23% over the following week before clinical informatics identified the change via Epic audit logs. FDA PCCP guidance requires that model changes within the predetermined change control plan be logged and communicated to deploying health systems. The absence of a change notification SLA in the vendor contract allowed the unannounced update.',
    keywords: ['SaMD update', 'PCCP', 'model change notification', 'vendor communication', 'AI governance'],
  },
  {
    code: 'H2448',
    name: 'FDA De Novo Pathway Not Understood By Procurement Team For Novel AI',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Clinical informatics and procurement teams evaluate AI tools against the binary question "Is it FDA-cleared?" without understanding the different regulatory pathways (510(k), De Novo, PMA, and the exempt CDS software provision of the 21st Century Cures Act). A novel AI tool that received FDA De Novo authorisation — a pathway for moderate-risk devices without a predicate — is rejected by the procurement team as "not FDA cleared" because the team does not recognise De Novo as an equivalent marketing authorisation. The team instead approves a lower-capability tool with a 510(k) clearance, based on unfamiliarity with the regulatory landscape.',
    keywords: ['FDA De Novo', 'SaMD regulatory pathway', 'PMA', '510(k)', 'AI procurement'],
  },
  {
    code: 'H2449',
    name: 'AI Tool Exempt From FDA Oversight Under CDS Provision Deployed As If SaMD',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'The 21st Century Cures Act created an exemption for non-device clinical decision support software that displays information for clinician review without automating the clinical decision. Some vendors market tools under this exemption that the health system operationally treats as FDA-regulated SaMD — applying SaMD governance controls that are inappropriate for exempt CDS and creating compliance overhead without corresponding regulatory benefit. Conversely, other tools claimed to be exempt CDS actually automate decisions and should be regulated as SaMD. Legal and clinical informatics teams have not conducted a systematic classification audit.',
    keywords: ['CDS exemption', '21st Century Cures Act', 'SaMD classification', 'FDA oversight', 'clinical decision support'],
  },
  {
    code: 'H2450',
    name: 'Post-Market Surveillance Program Not Established For Deployed SaMD',
    officeCategory: 'back_office',
    failureRatePct: 74,
    demoRelevant: true,
    description:
      'FDA expects health systems operating SaMD to contribute to post-market surveillance by reporting malfunctions, adverse events, and performance degradation through MedWatch. The health system has not established a process for identifying SaMD-associated adverse events in its incident reporting system, training clinical staff to recognise SaMD-related incidents, or routing qualifying events to regulatory affairs for MedWatch filing. In a 12-month period, two patient safety events attributable to AI alert failures went unreported to FDA because the incident management system had no SaMD category and reporters did not recognise the events as MedWatch-reportable.',
    keywords: ['post-market surveillance', 'MedWatch', 'SaMD adverse event', 'FDA reporting', 'incident management'],
  },
  {
    code: 'H2451',
    name: 'SaMD Software Version Control Not Aligned With FDA-Filed Version',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'The software version of the AI tool currently deployed in production differs from the version identified in the FDA 510(k) filing by two minor releases. The vendor characterises these as bug fixes and performance improvements that do not require new submissions, but has not provided written documentation that these changes fall within the PCCP\'s predetermined change envelope. Without written documentation, the health system cannot confirm that the deployed version operates within the FDA-cleared specifications. FDA inspection findings at peer institutions have cited deployed-versus-cleared version discrepancy as a significant deficiency.',
    keywords: ['SaMD version control', 'FDA 510(k)', 'PCCP', 'software version', 'regulatory compliance'],
  },
  {
    code: 'H2452',
    name: 'Clinical AI Training Data Not Reviewed For HIPAA Compliance Before Vendor Use',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'The AI vendor\'s model was trained on data from other health systems provided under data use agreements. The health system did not review the vendor\'s data governance documentation to confirm that training data was properly de-identified under HIPAA Safe Harbour or Expert Determination standards before use. If training data included improperly de-identified PHI, the health system\'s vendor relationship could implicate it in a HIPAA violation. OCR guidance on AI vendor relationships clarifies that covered entities bear accountability for their business associates\' use of PHI in AI training pipelines.',
    keywords: ['HIPAA training data', 'PHI de-identification', 'vendor data governance', 'OCR', 'SaMD'],
  },
  {
    code: 'H2453',
    name: 'SaMD Governance Policy Not Updated To Reflect FDA 2023 AI Action Plan',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'The health system\'s AI governance policy was written in 2021 and has not been updated to reflect FDA\'s 2023 Artificial Intelligence/Machine Learning Action Plan, which introduced new requirements for PCCP documentation, transparency obligations, and real-world performance reporting for AI/ML SaMD. Policy gaps include no requirement for real-world performance reporting, no PCCP review at vendor contract renewal, and no annual SaMD inventory audit. Hospitals accredited by DNV GL and TJC are expected to demonstrate AI governance frameworks aligned with current FDA guidance.',
    keywords: ['AI governance policy', 'FDA AI action plan', 'PCCP', 'SaMD policy', 'regulatory update'],
  },
  {
    code: 'H2454',
    name: 'AI SaMD Procurement Contract Missing FDA Compliance Representations',
    officeCategory: 'back_office',
    failureRatePct: 68,
    description:
      'AI vendor contracts do not include representations and warranties that the vendor will maintain FDA clearance in good standing, notify the health system of changes to clearance status, provide PCCP documentation on request, file required adverse event reports with FDA, and maintain version documentation sufficient to demonstrate deployed-versus-cleared version alignment. Without these representations, the health system assumes legal risk for vendor compliance failures it has no visibility into. Healthcare IT legal research identifies missing FDA compliance representations as present in 84% of AI vendor contracts signed before 2023.',
    keywords: ['AI vendor contract', 'FDA compliance', 'representations and warranties', 'SaMD', 'legal risk'],
  },
  {
    code: 'H2455',
    name: 'FDA 510(k) Clearance Scope Narrower Than Vendor Marketing Claims',
    officeCategory: 'back_office',
    failureRatePct: 72,
    description:
      'A sepsis prediction vendor markets its tool as "FDA-cleared for early sepsis detection," but the actual 510(k) clearance covers "software that analyses vital signs for risk stratification" — a scope that does not specifically include the sepsis label the vendor applies to its marketing. Clinical informatics teams deploying the tool may be relying on the marketing claim rather than the clearance document. FDA\'s 510(k) database shows the predicate device was a generic vital signs monitoring tool, and the sepsis-specific claims in the marketing materials were not reviewed as part of the substantial equivalence determination.',
    keywords: ['510(k) scope', 'marketing claims', 'SaMD', 'FDA clearance', 'vendor compliance'],
  },
  {
    code: 'H2456',
    name: 'AI Governance Committee Not Reviewing SaMD Performance Annually',
    officeCategory: 'back_office',
    failureRatePct: 64,
    demoRelevant: true,
    description:
      'The AI governance committee meets quarterly to review new AI proposals but does not have a standing agenda item for annual review of deployed SaMD performance data. The sepsis AI and deterioration index have been in production for 26 and 18 months respectively without a formal governance-level performance review. FDA post-market surveillance expectations and internal risk management standards both suggest that clinical AI performing at reduced effectiveness should trigger a governance escalation; the committee lacks the process to identify and act on this trigger.',
    keywords: ['AI governance committee', 'SaMD performance review', 'post-market surveillance', 'clinical AI oversight', 'governance process'],
  },
  {
    code: 'H2457',
    name: 'Software-Only SaMD Not Covered By Medical Device Cybersecurity Program',
    officeCategory: 'back_office',
    failureRatePct: 66,
    description:
      'The health system\'s medical device cybersecurity program covers connected infusion pumps, imaging equipment, and patient monitors but does not include software-only SaMD AI tools because these are managed by clinical informatics rather than biomedical engineering. FDA\'s Cybersecurity in Medical Devices guidance (2023) and the Medical Device Cybersecurity Act of 2023 apply to software-only SaMD, including AI clinical decision support tools. Penetration testing and vulnerability management are not applied to AI SaMD, creating an attack surface for adversarial manipulation of clinical AI outputs.',
    keywords: ['SaMD cybersecurity', 'medical device security', 'AI security', 'FDA cybersecurity', 'vulnerability management'],
  },
  {
    code: 'H2458',
    name: 'AI Vendor Change Of Ownership Triggering SaMD Clearance Review Obligation',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'A clinical AI vendor was acquired by a larger health IT company. FDA guidance indicates that change of device ownership may require notification to FDA and, in some cases, a new 510(k) submission if the new owner modifies the device or makes the cleared device the basis for a new product. The health system was not notified by the vendor of the acquisition\'s implications for the SaMD clearance. The acquiring company has since modified the software architecture in ways that may not fall within the original PCCP, but the health system has no process for reviewing clearance implications of vendor ownership changes.',
    keywords: ['vendor acquisition', 'SaMD clearance', 'FDA notification', 'PCCP', 'AI governance'],
  },
  {
    code: 'H2459',
    name: 'Clinical Staff Not Trained On SaMD Limitations Specified In FDA Clearance',
    officeCategory: 'front_office',
    failureRatePct: 70,
    description:
      'FDA 510(k) clearances for AI SaMD include intended use statements and contraindications that define patient populations, clinical settings, and conditions for which the device should not be used. Clinical staff using sepsis and deterioration AI tools have not been trained on these limitations — which include exclusions for paediatric patients, pregnant patients, and patients with end-stage renal disease in some clearances. Patients in excluded categories continue to receive AI-generated alerts that were never validated for their population, and clinicians are unaware of this gap.',
    keywords: ['SaMD training', 'FDA clearance limitations', 'intended use', 'contraindications', 'clinical education'],
  },

  // ── 5. Model Drift Without Continuous Performance Monitoring (H2460–H2474) ─
  {
    code: 'H2460',
    name: 'No Automated Statistical Process Control On Clinical AI Outputs',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    demoRelevant: true,
    description:
      'Clinical AI tools produce daily output distributions (alert rates, score distributions, override rates) that are not monitored with statistical process control charts capable of detecting signal when a distribution shifts outside expected bounds. Model drift, data feed failures, and threshold changes all produce characteristic distributional signatures that would be visible in a control chart; without one, the health system relies on clinician complaints or adverse events to detect AI degradation. AMIA clinical informatics standards recommend that every deployed clinical AI have automated distributional monitoring with alert rules triggered by pre-defined statistical tests.',
    keywords: ['model drift detection', 'statistical process control', 'clinical AI monitoring', 'PCCP', 'AI performance'],
  },
  {
    code: 'H2461',
    name: 'AI Model Performance Benchmark Using Stale External Literature',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'The clinical AI governance team benchmarks model performance against published literature AUC values from 2019–2021 validation studies, without accounting for population distribution shift caused by COVID-19, changed care protocols, and patient demographic evolution. A sepsis model with a published AUC of 0.82 from a 2020 study may be operating at 0.71 in the current clinical environment due to covariate shift, but comparison against the 2020 benchmark suggests the model is performing within expectations. Contemporary performance benchmarking requires current local validation data, not historical literature comparisons.',
    keywords: ['model benchmarking', 'covariate shift', 'AUC', 'clinical AI performance', 'population shift'],
  },
  {
    code: 'H2462',
    name: 'Clinical AI Model Retraining Cadence Not Defined In Governance Policy',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    demoRelevant: true,
    description:
      'The AI governance policy does not specify a minimum retraining cadence, trigger conditions for off-cycle retraining, or who is responsible for initiating a retraining request. Vendors determine retraining schedules based on their own roadmaps, not local performance data. The sepsis AI vendor retrains the model annually against its multi-hospital aggregate population, which may not reflect Meridian\'s patient population evolution. Without a contractually defined retraining SLA tied to local performance metrics, Meridian cannot ensure the model remains calibrated to its patient population.',
    keywords: ['model retraining', 'PCCP', 'AI governance', 'retraining cadence', 'SaMD policy'],
  },
  {
    code: 'H2463',
    name: 'EHR Interface Change Not Triggering Model Performance Review',
    officeCategory: 'back_office',
    failureRatePct: 65,
    demoRelevant: true,
    description:
      'The clinical informatics change management process does not include a step requiring assessment of AI model impact before EHR interface changes are deployed. In the past 18 months, three Epic upgrades modified LOINC code assignments for lab results, changed the encoding of nursing assessment flowsheet fields, and altered the timing of vital sign charting reminders — all of which affected features used by deployed AI models. Post-upgrade AI performance was not evaluated in any of these cases, leaving the possibility of silent model degradation undetected.',
    keywords: ['EHR interface change', 'model impact assessment', 'PCCP', 'change management', 'AI performance'],
  },
  {
    code: 'H2464',
    name: 'No Real-World Outcomes Data Feeding Back Into AI Performance Tracking',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    demoRelevant: true,
    description:
      'AI model performance tracking focuses exclusively on intermediate metrics (alert rate, override rate, AUC on historical validation sets) without linking AI outputs to real-world patient outcomes (sepsis mortality, rapid response rates, ICU length of stay). A model could maintain a high AUC while becoming less useful in practice if clinical workflows are adjusted to compensate for its weaknesses. Real-world performance monitoring that links AI predictions to outcomes is the gold standard recommended by FDA\'s AI/ML Action Plan and is required for PCCP compliance under the 2023 guidance.',
    keywords: ['real-world performance', 'outcomes monitoring', 'PCCP', 'AI validation', 'clinical AI governance'],
  },
  {
    code: 'H2465',
    name: 'Model Drift Alert Threshold Not Defined Or Actionable',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      'The AI governance framework does not define quantitative thresholds for model drift that should trigger action (vendor notification, model revalidation, deployment suspension). Even if distributional monitoring were in place, the clinical informatics team would not know whether a 5% shift in alert rate or a 0.03 drop in AUC represents actionable drift or normal variation. Without pre-defined drift thresholds tied to governance responses, monitoring data accumulates without generating intervention decisions. FDA PCCP guidance recommends that drift thresholds be defined prospectively at the time of SaMD deployment approval.',
    keywords: ['drift threshold', 'model monitoring', 'PCCP', 'AI governance', 'performance threshold'],
  },
  {
    code: 'H2466',
    name: 'Shadow Mode Comparison Not Used Before AI Threshold Change',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'When the AI governance committee decides to adjust the alert threshold of a clinical AI tool to reduce alert fatigue, the change is implemented directly in production without first running the new threshold in shadow mode alongside the current threshold to quantify the sensitivity impact before clinical deployment. A threshold increase intended to reduce alerts by 30% results in a 12% reduction in sensitivity that was not detected until a retrospective case review 6 months later identified patients who deteriorated without an alert at the new threshold.',
    keywords: ['shadow mode', 'threshold change', 'clinical AI', 'sensitivity', 'deployment process'],
  },
  {
    code: 'H2467',
    name: 'Seasonal Patient Mix Shift Not Accounted For In AI Baseline',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Clinical AI models trained on full-year historical data produce predictions that are well-calibrated on average but miscalibrated during seasonal peaks — influenza season, summer trauma season, winter cardiovascular surge. The health system does not validate AI performance separately for each quarter or seasonal cohort, meaning that models may underperform precisely when clinical demand is highest. Seasonal recalibration studies from University of Michigan and Cleveland Clinic both demonstrate that seasonally adjusted AI thresholds outperform static annual thresholds in high-volume seasonal disease categories.',
    keywords: ['seasonal shift', 'model calibration', 'AI performance', 'clinical AI', 'population shift'],
  },
  {
    code: 'H2468',
    name: 'AI Governance Review Board Does Not Receive Monthly Drift Reports',
    officeCategory: 'back_office',
    failureRatePct: 69,
    demoRelevant: true,
    description:
      'The clinical AI governance committee meets quarterly and receives a brief narrative summary of AI tool performance, but is not given structured monthly drift reports showing statistical process control charts, override rate trends, or comparison against performance benchmarks. Committee members cannot identify month-over-month drift without quantitative reports in a standardised format, and the infrequency of meetings means drift can persist for 90 days before governance review. Best practice governance frameworks for clinical AI recommend monthly automated drift reports distributed to committee members.',
    keywords: ['AI governance', 'drift report', 'governance committee', 'clinical AI oversight', 'monthly monitoring'],
  },
  {
    code: 'H2469',
    name: 'New Care Protocols Not Propagated To AI Model Feature Engineering',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'The health system adopted a new sepsis management protocol that changed the timing and composition of blood cultures, fluid resuscitation, and antibiotic selection. The sepsis AI model was trained on data from before the protocol change, and its feature weights reflect the old treatment patterns. For patients receiving care under the new protocol, the model\'s lab and medication features are interpreted against pre-protocol norms, potentially misclassifying appropriate clinical responses as abnormal. PCCP guidance requires that protocol changes that affect AI model inputs be reviewed as potential triggers for model revalidation.',
    keywords: ['care protocol change', 'sepsis management', 'PCCP', 'model revalidation', 'feature engineering'],
  },
  {
    code: 'H2470',
    name: 'Vendor AI Performance Dashboard Not Accessible Without Vendor Support',
    officeCategory: 'back_office',
    failureRatePct: 67,
    description:
      'The clinical AI vendor provides a performance dashboard, but the dashboard is accessible only through the vendor\'s support portal, requiring a vendor-initiated session. The health system\'s clinical informatics team cannot self-serve performance data; every performance question requires a vendor support ticket with a 48-hour SLA. This dependency means that ad hoc clinical governance questions about AI performance — raised during quality rounds, patient safety reviews, or department chief inquiries — cannot be answered in real time. ONC HTI-1 transparency requirements include provisions for health systems to access AI performance data without vendor mediation.',
    keywords: ['AI dashboard', 'vendor dependency', 'ONC HTI-1', 'performance data access', 'clinical AI governance'],
  },
  {
    code: 'H2471',
    name: 'COVID-19 Training Data Contamination Not Addressed In Model Refresh',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      'AI models trained or updated during 2020–2022 incorporated COVID-19 patient data that reflected atypical care patterns, visitor restrictions, treatment protocols, and patient acuity mixes that are not representative of the current clinical environment. As COVID surges have subsided, models trained on pandemic-era data may be miscalibrated for the current patient population. The vendor has not published a COVID-era data contamination analysis, and the health system has not requested one. JAMIA published guidance recommending that all AI models trained during COVID be prospectively evaluated for pandemic-era contamination bias.',
    keywords: ['COVID training data', 'pandemic era bias', 'model contamination', 'AI recalibration', 'JAMIA'],
  },
  {
    code: 'H2472',
    name: 'No Regulatory Trigger Mapping For PCCP Change Types',
    officeCategory: 'back_office',
    failureRatePct: 65,
    description:
      'The health system\'s AI governance policy references PCCP compliance but does not maintain a matrix mapping specific types of changes (threshold adjustment, feature addition, training data update, inference infrastructure change) to their regulatory status (within PCCP, requiring new submission, exempt). When a vendor proposes a model update, clinical informatics cannot independently determine whether the change falls within the PCCP envelope without consulting legal counsel each time. Maintaining a documented regulatory trigger matrix is a standard practice recommended in FDA PCCP guidance and healthcare AI governance frameworks.',
    keywords: ['PCCP trigger matrix', 'regulatory mapping', 'SaMD governance', 'FDA compliance', 'AI governance'],
  },
  {
    code: 'H2473',
    name: 'Model Performance Metrics Not Stratified By Demographic Group',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    demoRelevant: true,
    description:
      'The AI governance committee reviews aggregate model performance (AUC, sensitivity, specificity) but does not stratify performance by demographic group — race, ethnicity, sex, age group, insurance type. Differential performance across demographic groups is a primary concern of the FDA\'s AI/ML Fairness Guidance and is required in algorithmic impact assessments under emerging state and federal AI fairness frameworks. Without stratified monitoring, the health system cannot detect if a model that performs well on average is systematically underperforming for minority patient populations who already face health equity disparities.',
    keywords: ['model fairness', 'demographic stratification', 'AI bias monitoring', 'health equity', 'algorithmic impact'],
  },
  {
    code: 'H2474',
    name: 'AI Feature Importance Shift Not Monitored As Drift Indicator',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      'The model drift monitoring program tracks output distributions (alert rates, score distributions) but does not monitor feature importance shifts — changes in which input variables are most predictive. A sepsis model that begins relying predominantly on a single lab value (e.g., lactate) rather than a combination of features may indicate that the model has found a spurious shortcut in the current data distribution. Feature importance monitoring using SHAP value tracking over time is a recommended practice in clinical AI MLOps frameworks and is referenced in FDA\'s PCCP guidance as a type of performance monitoring appropriate for AI/ML SaMD.',
    keywords: ['feature importance', 'SHAP', 'model drift', 'AI monitoring', 'PCCP'],
  },
];
