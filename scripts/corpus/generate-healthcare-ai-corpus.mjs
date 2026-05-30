#!/usr/bin/env node

/**
 * Deterministic healthcare AI/startup ecosystem corpus generator.
 *
 * Generates 50 healthcare domains x 4 parts/domain x 50 patterns/part = 10,000
 * authored `seed-healthcare-*` pattern rows in the content-only format consumed
 * by `scripts/corpus/load-authored-genome-seeds.ts`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const repoRoot = process.cwd();
const seedDir = path.join(repoRoot, 'src/scripts/seed');
const manifestPath = path.join(repoRoot, 'docs/build/HEALTHCARE_AI_CORPUS_WAVE_2026_05_30.md');

const domains = [
  ['31', 'ambient-clinical-documentation-scribing-ai', 'Ambient Clinical Documentation & Scribing AI', 'middle_office', ['ambient AI', 'clinical note automation', 'CDI specificity', 'HIPAA BAA', 'Epic Notes']],
  ['32', 'ai-cdi-coding-automation', 'AI CDI & Coding Automation', 'middle_office', ['CAC AI', 'ICD-10-CM', 'HCC v28', 'MS-DRG', 'physician query']],
  ['33', 'prior-auth-ai-utilization-management', 'Prior Authorization AI & Utilization Management', 'middle_office', ['prior auth AI', 'payer criteria', 'FHIR Prior Authorization', 'Da Vinci CRD', 'medical necessity']],
  ['34', 'rcm-denial-ai-automation', 'Revenue Cycle Automation & Denial AI', 'middle_office', ['denial AI', 'claim scrubber', '835 remittance', 'RCM automation', 'appeal workflow']],
  ['35', 'patient-access-digital-front-door-ai', 'Patient Access, Scheduling & Digital Front Door AI', 'front_office', ['digital front door', 'scheduling AI', 'patient matching', 'Epic Cadence', 'No Surprises Act']],
  ['36', 'contact-center-voice-ai-patient-concierge', 'Contact Center, Voice AI & Patient Concierge', 'front_office', ['voice AI', 'patient concierge', 'IVR containment', 'Genesys', 'TCPA']],
  ['37', 'agentic-care-navigation-transitions', 'Agentic Care Navigation & Transitions', 'front_office', ['care navigation agent', 'ADT feed', 'discharge follow-up', 'FHIR Tasks', 'readmission risk']],
  ['38', 'population-health-vbc-risk-ai', 'Population Health AI & VBC Risk Stratification', 'middle_office', ['population health AI', 'ACO attribution', 'HEDIS', 'claims lag', 'VBC contract']],
  ['39', 'clinical-decision-support-samd-governance', 'Clinical Decision Support & SaMD Governance', 'middle_office', ['clinical decision support', 'FDA SaMD', 'override workflow', 'model validation', 'EHR alert']],
  ['40', 'radiology-imaging-ai-diagnostics', 'Radiology, Imaging & AI Diagnostics', 'middle_office', ['radiology AI', 'FDA 510(k)', 'worklist prioritization', 'PACS', 'incidental finding']],
  ['41', 'pathology-lab-genomics-ai', 'Pathology, Lab & Genomics AI', 'middle_office', ['pathology AI', 'LIS', 'CLIA', 'genomics', 'variant interpretation']],
  ['42', 'pharmacy-ai-medication-safety-340b', 'Pharmacy AI, Medication Safety & 340B', 'middle_office', ['pharmacy AI', '340B', 'NDC', 'medication safety', 'split billing']],
  ['43', 'nursing-workforce-ai-staffing', 'Nursing Workforce AI & Staffing Optimization', 'back_office', ['nursing staffing AI', 'acuity scoring', 'CMS CoP', 'float pool', 'contract labor']],
  ['44', 'ed-flow-command-center-virtual-nursing', 'ED Flow, Capacity Command Center & Virtual Nursing', 'front_office', ['ED flow AI', 'capacity command center', 'virtual nursing', 'boarding time', 'EMTALA']],
  ['45', 'perioperative-or-robotics-ai', 'Perioperative, OR Robotics & Surgical AI', 'middle_office', ['OR scheduling AI', 'robotics', 'preference cards', 'block utilization', 'TJC']],
  ['46', 'remote-patient-monitoring-hospital-at-home', 'Remote Patient Monitoring & Hospital-at-Home', 'front_office', ['RPM', 'hospital-at-home', 'device telemetry', 'CMS waiver', 'care escalation']],
  ['47', 'behavioral-health-ai-digital-therapeutics', 'Behavioral Health AI & Digital Therapeutics', 'front_office', ['behavioral health AI', 'digital therapeutics', 'suicide risk', '42 CFR Part 2', 'telepsychiatry']],
  ['48', 'sdoh-equity-community-referral-ai', 'SDOH, Health Equity & Community Referral AI', 'front_office', ['SDOH AI', 'health equity', 'closed-loop referral', 'Z codes', 'community resource']],
  ['49', 'interoperability-fhir-tefca-ai-agents', 'Interoperability, FHIR, TEFCA & AI Agents', 'back_office', ['FHIR R4', 'TEFCA', 'HL7 v2', 'agentic integration', 'ADT']],
  ['50', 'data-platform-lakehouse-ai-governance', 'Data Platform, Lakehouse & AI Governance', 'back_office', ['healthcare lakehouse', 'data lineage', 'FHIR bulk export', 'model registry', 'PHI']],
  ['51', 'cybersecurity-identity-zero-trust-ai', 'Cybersecurity, Identity & Zero Trust AI', 'back_office', ['healthcare cybersecurity', 'Zero Trust', 'HITRUST', 'identity governance', 'ransomware']],
  ['52', 'cloud-finops-platform-ops-ai', 'Cloud FinOps & Healthcare Platform Ops AI', 'back_office', ['cloud FinOps', 'Azure', 'AWS', 'Epic cloud', 'Kubernetes']],
  ['53', 'ehr-optimization-ai-build-agents', 'Epic / Oracle Health Optimization & Build Agents', 'back_office', ['Epic optimization', 'Oracle Health', 'build agent', 'order sets', 'EHR governance']],
  ['54', 'quality-measures-star-hedis-automation', 'Quality Measures, Stars & HEDIS Automation', 'middle_office', ['HEDIS', 'CMS Stars', 'quality measure AI', 'NCQA', 'gap closure']],
  ['55', 'patient-safety-sepsis-deterioration-ai', 'Patient Safety, Sepsis & Deterioration AI', 'middle_office', ['sepsis AI', 'deterioration model', 'alert fatigue', 'TJC', 'clinical governance']],
  ['56', 'compliance-privacy-hipaa-ai', 'Compliance, Privacy, HIPAA & BAA AI Controls', 'back_office', ['HIPAA', 'BAA', 'subprocessor', 'AI privacy', 'minimum necessary']],
  ['57', 'payer-provider-api-collaboration-ai', 'Payer-Provider Collaboration & API Ecosystem AI', 'middle_office', ['payer API', 'HL7 Da Vinci', 'FHIR payer data', 'MCO', 'prior auth']],
  ['58', 'value-based-contracting-actuarial-ai', 'Value-Based Contracting & Actuarial AI', 'back_office', ['actuarial AI', 'risk adjustment', 'shared savings', 'MCO contract', 'stop-loss']],
  ['59', 'home-health-post-acute-agentic-workflows', 'Home Health & Post-Acute Agentic Workflows', 'front_office', ['home health', 'post-acute', 'SNF', 'agentic workflow', 'OASIS']],
  ['60', 'supply-chain-procurement-ai', 'Supply Chain, Procurement & Purchased Services AI', 'back_office', ['healthcare supply chain', 'GHX', 'Vizient', 'contract compliance', 'AI sourcing']],
  ['61', 'startup-ambient-ai-vendor-diligence', 'Startup Ecosystem: Ambient AI Vendor Diligence', 'middle_office', ['Abridge', 'Nuance DAX', 'Suki', 'Nabla', 'BAA']],
  ['62', 'startup-rcm-coding-vendor-diligence', 'Startup Ecosystem: RCM & Coding Vendor Diligence', 'middle_office', ['Cohere Health', 'Waystar', 'AKASA', 'RCM startup', 'contract SLA']],
  ['63', 'startup-virtual-care-rpm-vendor-diligence', 'Startup Ecosystem: Virtual Care & RPM Vendor Diligence', 'front_office', ['TytoCare', 'Current Health', 'Biofourmis', 'RPM startup', 'device integration']],
  ['64', 'startup-clinical-ai-fda-diligence', 'Startup Ecosystem: Clinical AI & FDA Diligence', 'middle_office', ['Aidoc', 'Viz.ai', 'PathAI', 'FDA clearance', 'clinical AI startup']],
  ['65', 'startup-cyber-identity-vendor-diligence', 'Startup Ecosystem: Cyber, Identity & Trust Diligence', 'back_office', ['Claroty', 'Wiz', 'Ordr', 'identity startup', 'HITRUST']],
  ['66', 'agentic-clinical-operations-orchestrators', 'Agentic AI: Clinical Operations Orchestrators', 'middle_office', ['clinical operations agent', 'workflow orchestration', 'EHR action', 'human-in-the-loop', 'audit trail']],
  ['67', 'agentic-administrative-copilots', 'Agentic AI: Administrative Copilots', 'back_office', ['administrative copilot', 'task automation', 'HR service delivery', 'policy retrieval', 'approval workflow']],
  ['68', 'agentic-finance-procurement-agents', 'Agentic AI: Finance & Procurement Agents', 'back_office', ['procurement agent', 'invoice AI', 'contract analytics', 'ERP workflow', 'approval gate']],
  ['69', 'agentic-it-service-desk-ehr-build-agents', 'Agentic AI: IT Service Desk & EHR Build Agents', 'back_office', ['IT service desk agent', 'EHR build agent', 'ServiceNow', 'change control', 'CAB']],
  ['70', 'ai-governance-model-registry-operating-model', 'AI Governance Operating Model & Model Registry', 'back_office', ['AI governance', 'model registry', 'NIST AI RMF', 'HIPAA', 'clinical validation']],
  ['71', 'model-monitoring-drift-validation', 'Model Monitoring, Drift & Deployment Validation', 'middle_office', ['model drift', 'deployment-site validation', 'MLOps', 'shadow mode', 'calibration']],
  ['72', 'ai-adoption-change-management-clinician-trust', 'AI Adoption, Change Management & Clinician Trust', 'middle_office', ['AI adoption', 'clinician trust', 'training', 'workflow redesign', 'change management']],
  ['73', 'ai-roi-value-realization', 'AI ROI, Value Realization & Benefit Tracking', 'back_office', ['AI ROI', 'value realization', 'benefits ledger', 'adoption telemetry', 'finance validation']],
  ['74', 'synthetic-data-deidentification-ai', 'Synthetic Data, De-Identification & Privacy-Preserving AI', 'back_office', ['synthetic data', 'de-identification', 'Safe Harbor', 'Expert Determination', 'PHI']],
  ['75', 'hie-public-health-reporting-ai', 'HIE, Public Health Reporting & Surveillance AI', 'middle_office', ['HIE', 'public health reporting', 'eCR', 'TEFCA', 'syndromic surveillance']],
  ['76', 'academic-medical-center-research-ai', 'Academic Medical Center Research AI', 'middle_office', ['research AI', 'IRB', 'clinical trial matching', 'OMOP', 'academic medical center']],
  ['77', 'precision-medicine-trial-matching', 'Precision Medicine & Trial Matching AI', 'middle_office', ['precision medicine', 'trial matching', 'genomics', 'FHIR Genomics', 'molecular tumor board']],
  ['78', 'medicaid-mco-social-care-ai', 'Medicaid, MCO Operations & Social Care AI', 'front_office', ['Medicaid', 'MCO', 'social care', 'managed care', 'eligibility']],
  ['79', 'rural-health-access-innovation', 'Rural Health & Access Innovation AI', 'front_office', ['rural health', 'telehealth', 'provider shortage', 'CAH', 'broadband']],
  ['80', 'board-strategy-innovation-portfolio-ai', 'Board Strategy, Innovation Portfolio & Venture Partnerships', 'back_office', ['innovation portfolio', 'venture partnership', 'AI strategy', 'board governance', 'portfolio value']],
];

const failureArchetypes = [
  ['Criteria Drift', 'the evidence source changes faster than the workflow, so the AI keeps recommending the previous rule set until denials, audit exceptions, or missed measures surface downstream'],
  ['Workflow Authority Gap', 'the model can draft or rank work but cannot safely take the EHR, payer, supply, or finance action that creates the intended operational value'],
  ['Subprocessor Blind Spot', 'the vendor routes PHI, audio, images, or derived features through a subcontractor that is not covered by the reviewed BAA, DPA, or security evidence package'],
  ['Validation Cohort Mismatch', 'the proof-of-concept succeeds on a clean validation slice but fails on community-hospital, Medicaid, specialty, or high-acuity populations'],
  ['Adoption Telemetry Missing', 'the contract measures licenses and messages instead of accepted recommendations, corrected outputs, physician overrides, or realized value'],
  ['Human Override Ambiguity', 'clinical or administrative users cannot tell whether they are expected to accept, reject, document, or escalate an AI recommendation'],
  ['Integration Surface Fragmentation', 'FHIR, HL7 v2, flat-file, API, and portal workflows are stitched together without a single source of truth for the decision state'],
  ['Liability Handoff Gap', 'the AI output crosses from recommendation into attestation, order, appeal, documentation, or patient communication without accountable sign-off'],
  ['Equity Guardrail Drift', 'the model performs acceptably in aggregate while underperforming for language, payer, race, rural access, disability, or complex-comorbidity cohorts'],
  ['Value Ledger Overstatement', 'finance books projected savings before adoption, payer response, clinician capacity, and downstream rework are measured in production'],
  ['Agent Tool Boundary Failure', 'an agent has retrieval access but not the scoped action permissions, transaction logs, and rollback controls needed for safe autonomy'],
  ['Startup Roadmap Dependency', 'the health system commits to a product roadmap feature that is not generally available, validated, or contractually committed by the vendor'],
  ['Alert Fatigue Inflection', 'the AI increases detection volume without changing staffing, triage, or escalation rules, so users disable, ignore, or batch-process the alerts'],
  ['Revenue Integrity Leakage', 'automation improves throughput but misses the modifier, diagnosis specificity, charge trigger, or payer rule that defends reimbursement'],
  ['Audit Evidence Thinness', 'the AI recommendation cannot be reconstructed with input data, model version, user action, and policy context during compliance review'],
];

const capabilities = [
  'triage', 'drafting', 'summarization', 'risk scoring', 'worklist prioritization', 'appeal generation',
  'order recommendation', 'benefit verification', 'eligibility prediction', 'care gap closure',
  'cohort matching', 'contract analysis', 'agentic orchestration', 'coding suggestion', 'documentation review',
  'vendor comparison', 'capacity forecasting', 'staffing optimization', 'quality abstraction', 'patient outreach',
];

const startupSignals = [
  'startup maturity evidence', 'SOC 2 Type II', 'HITRUST roadmap', 'Series B burn rate', 'implementation partner capacity',
  'referenceable health-system customer', 'clinical advisory board', 'FDA submission posture', 'KLAS commentary',
  'Epic App Orchard integration', 'Microsoft Cloud for Healthcare', 'AWS HealthLake', 'Azure Health Data Services',
  'Snowflake Healthcare', 'Databricks Lakehouse', 'ServiceNow workflow', 'Salesforce Health Cloud',
];

const governanceHooks = [
  'HIPAA BAA', 'minimum necessary policy', 'TJC survey evidence', 'CMS CoP', 'NCQA HEDIS audit',
  'FDA SaMD guidance', 'NIST AI RMF', 'ONC HTI-1', 'TEFCA participation', 'FHIR R4 mapping',
  'HL7 v2 ADT reconciliation', 'Epic change control', 'model registry', 'deployment-site validation',
  'MLOps monitoring', 'clinical safety review', 'procurement RFP scoring', 'BAFO contract clause',
];

const moveOutputs = [
  'unsafe-to-fund gate', 'value realization ledger', 'pilot success metric', 'clinical governance checklist',
  'adoption plan', 'pre-mortem risk', 'dependency map', 'approval gate', 'benefit validation plan',
];

const sourceOutputs = [
  'RFI question', 'RFP scoring criterion', 'BAA clause', 'subprocessor schedule', 'model audit right',
  'deployment-site validation SLA', 'adoption telemetry clause', 'exit-rights clause', 'BAFO counter',
];

function hashInt(input, min, max) {
  const hex = createHash('sha1').update(input).digest('hex').slice(0, 8);
  const value = parseInt(hex, 16);
  return min + (value % (max - min + 1));
}

function pick(list, index, salt = 0) {
  return list[(index + salt) % list.length];
}

function titleCase(input) {
  return input
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function patternFor(domain, absoluteIndex) {
  const [domainNumber, , title, officeCategory, domainKeywords] = domain;
  const codeNumber = 10000 + ((Number(domainNumber) - 31) * 200) + absoluteIndex;
  const code = `H${codeNumber}`;
  const failure = pick(failureArchetypes, absoluteIndex, Number(domainNumber));
  const capability = pick(capabilities, absoluteIndex, Number(domainNumber) * 2);
  const governance = pick(governanceHooks, absoluteIndex, Number(domainNumber) * 3);
  const startup = pick(startupSignals, absoluteIndex, Number(domainNumber) * 5);
  const moveOutput = pick(moveOutputs, absoluteIndex, Number(domainNumber) * 7);
  const sourceOutput = pick(sourceOutputs, absoluteIndex, Number(domainNumber) * 11);
  const aiCategory = pick(domainKeywords, absoluteIndex, 0);
  const secondary = pick(domainKeywords, absoluteIndex, 2);
  const failureRatePct = hashInt(`${code}:${title}`, 53, 84);
  const demoRelevant = absoluteIndex % 3 !== 1;
  const name = `${titleCase(aiCategory)} ${titleCase(capability)} ${failure[0]}`;
  const description = `${title} initiatives fail when ${aiCategory} is used for ${capability} but ${failure[1]}. The actionable break point is ${governance}: AbarVa should turn this into a Moves ${moveOutput} and a Source ${sourceOutput} before scale funding. For Meridian-style regional systems, the ecosystem signal to test is ${startup}, because a promising startup demo can still collapse when ${secondary} is not proven in production.`;
  const keywords = Array.from(new Set([
    aiCategory,
    secondary,
    governance,
    startup,
    moveOutput,
    sourceOutput,
  ])).slice(0, 6);
  return {
    code,
    name,
    officeCategory,
    failureRatePct,
    description,
    keywords,
    demoRelevant,
    subTopic: title,
  };
}

function renderPattern(pattern) {
  const keywordText = pattern.keywords.map((keyword) => `'${keyword.replaceAll("'", "\\'")}'`).join(', ');
  return `  {
    code: '${pattern.code}',
    name: '${pattern.name.replaceAll("'", "\\'")}',
    officeCategory: '${pattern.officeCategory}',
    failureRatePct: ${pattern.failureRatePct},
    description: \`${pattern.description.replaceAll('`', '\\`')}\`,
    keywords: [${keywordText}],
    demoRelevant: ${pattern.demoRelevant},
    subTopic: '${pattern.subTopic.replaceAll("'", "\\'")}',
  }`;
}

function renderFile(domain, part) {
  const [domainNumber, , title] = domain;
  const start = (part - 1) * 50;
  const patterns = Array.from({ length: 50 }, (_, offset) => patternFor(domain, start + offset));
  const constName = `HEALTHCARE_DOM${domainNumber}_PART${part}_PATTERNS`;
  return `/* eslint-disable @typescript-eslint/no-unused-vars */
// Generated healthcare AI/startup ecosystem corpus.
// Domain ${domainNumber}: ${title}
// Part ${part}: ${patterns[0].code}-${patterns[patterns.length - 1].code}
// Format: content-only *PATTERNS array consumed by scripts/corpus/load-authored-genome-seeds.ts.

const ${constName} = [
${patterns.map(renderPattern).join(',\n')}
];
`;
}

function writeFiles() {
  let fileCount = 0;
  let patternCount = 0;
  const domainRows = [];
  for (const domain of domains) {
    const [domainNumber, slug, title, officeCategory, domainKeywords] = domain;
    for (let part = 1; part <= 4; part += 1) {
      const filename = `seed-healthcare-dom${domainNumber}-${slug}-part${part}.ts`;
      fs.writeFileSync(path.join(seedDir, filename), renderFile(domain, part));
      fileCount += 1;
      patternCount += 50;
    }
    const startCode = `H${10000 + ((Number(domainNumber) - 31) * 200)}`;
    const endCode = `H${10000 + ((Number(domainNumber) - 31) * 200) + 199}`;
    domainRows.push(`| dom${domainNumber} | ${title} | ${officeCategory} | ${startCode}-${endCode} | ${domainKeywords.join(', ')} |`);
  }

  fs.writeFileSync(
    manifestPath,
    `# Healthcare AI Corpus Wave · 2026-05-30

## Summary

Generated 10,000 healthcare-provider genome patterns across 50 domains, focused on AI innovation, startup ecosystem diligence, agentic workflows, and 2025-2026 healthcare operating-model risk.

## Output

- Files: ${fileCount}
- Patterns: ${patternCount}
- File shape: 50 patterns per file, 4 files per domain
- Code range: H10000-H19999
- Loader: \`scripts/corpus/load-authored-genome-seeds.ts\`
- Tenant/source mapping: \`seed-healthcare-*\` -> \`healthcare_provider\` / \`meridian-health\`

## Domain Taxonomy

| Domain | Domain name | Office layer | Code range | Retrieval anchors |
|---|---|---:|---|---|
${domainRows.join('\n')}

## Design Notes

- Every pattern includes an AI capability, a healthcare workflow/control failure, a governance hook, a Moves deliverable anchor, and a Source/procurement diligence anchor.
- Startup ecosystem references are used as diligence signals, not endorsements.
- The corpus is intended for Intelligence grounding, Moves pre-mortems and gates, and Source RFI/RFP/BAFO clause generation.
- This wave does not replace existing healthcare seed files; it extends them with a new AI/startup/agentic corpus band.
`,
  );
  console.log(JSON.stringify({ files: fileCount, patterns: patternCount, manifestPath }, null, 2));
}

writeFiles();
