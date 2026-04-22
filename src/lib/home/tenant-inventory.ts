// Fix Spec v4 §10/§11/§12 · Tenant inventory seed data.
//
// Demo-grade inventory rows for the three command-center grids on the
// authenticated home. Real seed data lands from the admin-ingestion
// pipeline post-Prat (see Codex lane); this module gives the grids
// realistic density and named entries for the first-impression play.
//
// Keyed by tenantKey · home page picks the current tenant's slice. The
// row shapes match the DataGrid column definitions in the corresponding
// grid components.

export type SystemHealth = 'Healthy' | 'Underutilized' | 'Overutilized' | 'At risk';
export type SystemSegment = 'Tier 1 · Strategic' | 'Tier 2 · Operational' | 'Tier 3 · Tactical' | 'Sunset candidate';
export type SystemCategory = 'Data' | 'Analytics' | 'AI/ML' | 'CRM' | 'ERP' | 'Finance' | 'HR' | 'IT Ops' | 'Security' | 'Marketing' | 'Commerce' | 'Supply Chain';

export interface ITStackRow {
  id: string;
  name: string;
  category: SystemCategory;
  vendor: string;
  segment: SystemSegment;
  budgetAnnual: number;
  renewalDate: Date;
  health: SystemHealth;
  aiCapability: 'Native' | 'Extension' | 'None';
  integrations: number;
}

export type VendorTier = 'Strategic partner' | 'Preferred' | 'Standard' | 'Transactional' | 'Under review';
export type VendorCategory = 'Technology' | 'Consulting' | 'Agency' | 'Supplier' | 'Logistics' | 'Legal' | 'Finance' | 'HR services';
export type VendorRisk = 'Low' | 'Medium' | 'High' | 'Critical';
export type AIExposure = 'None' | 'Indirect' | 'Direct · sanctioned' | 'Direct · unsanctioned';

export interface VendorRow {
  id: string;
  name: string;
  category: VendorCategory;
  relationshipTier: VendorTier;
  annualSpend: number;
  contractEnd: Date;
  relationshipOwner: string;
  riskScore: VendorRisk;
  aiExposure: AIExposure;
}

export type DataAssetType = 'Financial record' | 'Contract' | 'Communication' | 'System export' | 'Document' | 'Interview' | 'Model output' | 'Meeting notes';
export type DataQuality = 'Audit-grade' | 'High' | 'Medium' | 'Low' | 'Unverified';
export type DataSensitivity = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
export type DataCurrency = 'Current' | 'Stale' | 'Refresh required';

export interface UploadedDataRow {
  id: string;
  name: string;
  type: DataAssetType;
  sourceSystem: string;
  sourceOwner: string;
  qualityRating: DataQuality;
  sensitivityMarking: DataSensitivity;
  uploadedDate: Date;
  currencyStatus: DataCurrency;
  citedByCount: number;
  chainOfCustody: 'Complete' | 'Incomplete';
}

// Helper · generate a date N days ago / ahead.
function d(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

// ─── Apex Retail (composite) ──────────────────────────────────────────

const APEX_IT: ITStackRow[] = [
  { id: 'apx-it-01', name: 'Snowflake', category: 'Data', vendor: 'Snowflake', segment: 'Tier 1 · Strategic', budgetAnnual: 4_200_000, renewalDate: d(120), health: 'Healthy', aiCapability: 'Native', integrations: 42 },
  { id: 'apx-it-02', name: 'Databricks', category: 'Analytics', vendor: 'Databricks', segment: 'Tier 1 · Strategic', budgetAnnual: 2_800_000, renewalDate: d(88), health: 'Healthy', aiCapability: 'Native', integrations: 18 },
  { id: 'apx-it-03', name: 'Salesforce Commerce Cloud', category: 'Commerce', vendor: 'Salesforce', segment: 'Tier 1 · Strategic', budgetAnnual: 3_600_000, renewalDate: d(210), health: 'Overutilized', aiCapability: 'Extension', integrations: 24 },
  { id: 'apx-it-04', name: 'SAP S/4HANA', category: 'ERP', vendor: 'SAP', segment: 'Tier 1 · Strategic', budgetAnnual: 5_100_000, renewalDate: d(365), health: 'Healthy', aiCapability: 'Extension', integrations: 86 },
  { id: 'apx-it-05', name: 'Workday HCM', category: 'HR', vendor: 'Workday', segment: 'Tier 1 · Strategic', budgetAnnual: 1_800_000, renewalDate: d(142), health: 'Healthy', aiCapability: 'None', integrations: 14 },
  { id: 'apx-it-06', name: 'ServiceNow ITSM', category: 'IT Ops', vendor: 'ServiceNow', segment: 'Tier 2 · Operational', budgetAnnual: 1_400_000, renewalDate: d(60), health: 'Healthy', aiCapability: 'Extension', integrations: 32 },
  { id: 'apx-it-07', name: 'Adobe Experience Manager', category: 'Marketing', vendor: 'Adobe', segment: 'Tier 2 · Operational', budgetAnnual: 980_000, renewalDate: d(184), health: 'Healthy', aiCapability: 'Extension', integrations: 12 },
  { id: 'apx-it-08', name: 'Tableau', category: 'Analytics', vendor: 'Salesforce', segment: 'Tier 2 · Operational', budgetAnnual: 640_000, renewalDate: d(72), health: 'Underutilized', aiCapability: 'Extension', integrations: 26 },
  { id: 'apx-it-09', name: 'Looker', category: 'Analytics', vendor: 'Google Cloud', segment: 'Sunset candidate', budgetAnnual: 420_000, renewalDate: d(45), health: 'Underutilized', aiCapability: 'Extension', integrations: 8 },
  { id: 'apx-it-10', name: 'Fivetran', category: 'Data', vendor: 'Fivetran', segment: 'Tier 2 · Operational', budgetAnnual: 380_000, renewalDate: d(118), health: 'Healthy', aiCapability: 'None', integrations: 24 },
  { id: 'apx-it-11', name: 'Monte Carlo', category: 'Data', vendor: 'Monte Carlo Data', segment: 'Tier 2 · Operational', budgetAnnual: 220_000, renewalDate: d(92), health: 'Healthy', aiCapability: 'Native', integrations: 6 },
  { id: 'apx-it-12', name: 'Segment CDP', category: 'Marketing', vendor: 'Twilio', segment: 'Tier 2 · Operational', budgetAnnual: 560_000, renewalDate: d(78), health: 'Overutilized', aiCapability: 'Extension', integrations: 28 },
  { id: 'apx-it-13', name: 'Revionics', category: 'Commerce', vendor: 'Aptos', segment: 'Tier 1 · Strategic', budgetAnnual: 2_100_000, renewalDate: d(260), health: 'Healthy', aiCapability: 'Native', integrations: 14 },
  { id: 'apx-it-14', name: 'Blue Yonder Price & Promo', category: 'Commerce', vendor: 'Blue Yonder', segment: 'Tier 1 · Strategic', budgetAnnual: 1_900_000, renewalDate: d(310), health: 'Healthy', aiCapability: 'Native', integrations: 11 },
  { id: 'apx-it-15', name: 'Coupa', category: 'Finance', vendor: 'Coupa', segment: 'Tier 2 · Operational', budgetAnnual: 1_100_000, renewalDate: d(56), health: 'Healthy', aiCapability: 'Extension', integrations: 17 },
  { id: 'apx-it-16', name: 'Flexport Data', category: 'Supply Chain', vendor: 'Flexport', segment: 'Tier 2 · Operational', budgetAnnual: 640_000, renewalDate: d(98), health: 'Healthy', aiCapability: 'Native', integrations: 9 },
  { id: 'apx-it-17', name: 'NetSuite', category: 'ERP', vendor: 'Oracle', segment: 'Tier 2 · Operational', budgetAnnual: 1_450_000, renewalDate: d(220), health: 'At risk', aiCapability: 'None', integrations: 22 },
  { id: 'apx-it-18', name: 'CrowdStrike Falcon', category: 'Security', vendor: 'CrowdStrike', segment: 'Tier 1 · Strategic', budgetAnnual: 890_000, renewalDate: d(156), health: 'Healthy', aiCapability: 'Native', integrations: 5 },
  { id: 'apx-it-19', name: 'Wiz', category: 'Security', vendor: 'Wiz', segment: 'Tier 2 · Operational', budgetAnnual: 340_000, renewalDate: d(200), health: 'Healthy', aiCapability: 'Native', integrations: 3 },
  { id: 'apx-it-20', name: 'Okta', category: 'Security', vendor: 'Okta', segment: 'Tier 1 · Strategic', budgetAnnual: 720_000, renewalDate: d(132), health: 'Healthy', aiCapability: 'None', integrations: 48 },
  { id: 'apx-it-21', name: 'Microsoft 365', category: 'IT Ops', vendor: 'Microsoft', segment: 'Tier 1 · Strategic', budgetAnnual: 3_100_000, renewalDate: d(280), health: 'Healthy', aiCapability: 'Native', integrations: 64 },
  { id: 'apx-it-22', name: 'Oracle GL', category: 'Finance', vendor: 'Oracle', segment: 'Sunset candidate', budgetAnnual: 1_800_000, renewalDate: d(30), health: 'Underutilized', aiCapability: 'None', integrations: 18 },
  { id: 'apx-it-23', name: 'Antuit.ai', category: 'AI/ML', vendor: 'Zebra Technologies', segment: 'Tier 2 · Operational', budgetAnnual: 480_000, renewalDate: d(168), health: 'Healthy', aiCapability: 'Native', integrations: 4 },
  { id: 'apx-it-24', name: 'Credo AI', category: 'AI/ML', vendor: 'Credo AI', segment: 'Tier 3 · Tactical', budgetAnnual: 180_000, renewalDate: d(112), health: 'Healthy', aiCapability: 'Native', integrations: 2 },
  { id: 'apx-it-25', name: 'OneTrust', category: 'Security', vendor: 'OneTrust', segment: 'Tier 2 · Operational', budgetAnnual: 560_000, renewalDate: d(184), health: 'Healthy', aiCapability: 'Extension', integrations: 12 },
];

const APEX_VENDORS: VendorRow[] = [
  { id: 'apx-v-01', name: 'Snowflake', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 4_200_000, contractEnd: d(120), relationshipOwner: 'CDO · Priya Shah', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-02', name: 'Salesforce', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 4_240_000, contractEnd: d(210), relationshipOwner: 'CIO · Arjun Mehta', riskScore: 'Medium', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-03', name: 'Databricks', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 2_800_000, contractEnd: d(88), relationshipOwner: 'CDO · Priya Shah', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-04', name: 'Top-3 consulting firm · transformation practice', category: 'Consulting', relationshipTier: 'Preferred', annualSpend: 3_400_000, contractEnd: d(180), relationshipOwner: 'CTO · Maya Reyes', riskScore: 'Medium', aiExposure: 'Indirect' },
  { id: 'apx-v-05', name: 'Accenture Digital', category: 'Consulting', relationshipTier: 'Standard', annualSpend: 1_800_000, contractEnd: d(60), relationshipOwner: 'CTO · Maya Reyes', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'apx-v-06', name: 'Adobe', category: 'Technology', relationshipTier: 'Preferred', annualSpend: 980_000, contractEnd: d(184), relationshipOwner: 'CMO · Victor Chen-Matsuda', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-07', name: 'C.H. Robinson', category: 'Logistics', relationshipTier: 'Preferred', annualSpend: 12_400_000, contractEnd: d(90), relationshipOwner: 'COO · Marcus Liu', riskScore: 'Medium', aiExposure: 'None' },
  { id: 'apx-v-08', name: 'Flexport', category: 'Logistics', relationshipTier: 'Preferred', annualSpend: 8_600_000, contractEnd: d(98), relationshipOwner: 'COO · Marcus Liu', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-09', name: 'Boston-area private-label manufacturer', category: 'Supplier', relationshipTier: 'Preferred', annualSpend: 28_000_000, contractEnd: d(340), relationshipOwner: 'CCO · Christopher Vale', riskScore: 'Medium', aiExposure: 'None' },
  { id: 'apx-v-10', name: 'Large-cap law firm · commercial practice', category: 'Legal', relationshipTier: 'Preferred', annualSpend: 2_200_000, contractEnd: d(45), relationshipOwner: 'GC · Ranjit Singh', riskScore: 'Low', aiExposure: 'None' },
  { id: 'apx-v-11', name: 'OneTrust', category: 'Technology', relationshipTier: 'Standard', annualSpend: 560_000, contractEnd: d(184), relationshipOwner: 'CISO · Elena Vasquez', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-12', name: 'CrowdStrike', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 890_000, contractEnd: d(156), relationshipOwner: 'CISO · Elena Vasquez', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-13', name: 'Revionics (Aptos)', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 2_100_000, contractEnd: d(260), relationshipOwner: 'CCO · Christopher Vale', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-14', name: 'Blue Yonder', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 1_900_000, contractEnd: d(310), relationshipOwner: 'CCO · Christopher Vale', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-15', name: 'Boutique creative agency · brand practice', category: 'Agency', relationshipTier: 'Transactional', annualSpend: 1_200_000, contractEnd: d(75), relationshipOwner: 'CMO · Victor Chen-Matsuda', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'apx-v-16', name: 'Midwest DC operator · private-label pick-pack', category: 'Logistics', relationshipTier: 'Strategic partner', annualSpend: 18_200_000, contractEnd: d(420), relationshipOwner: 'COO · Marcus Liu', riskScore: 'High', aiExposure: 'None' },
  { id: 'apx-v-17', name: 'Vendor that recently failed its SOC 2 audit', category: 'Technology', relationshipTier: 'Under review', annualSpend: 340_000, contractEnd: d(28), relationshipOwner: 'CISO · Elena Vasquez', riskScore: 'Critical', aiExposure: 'Direct · unsanctioned' },
  { id: 'apx-v-18', name: 'Wealth management advisory · contracted for board prep', category: 'Consulting', relationshipTier: 'Transactional', annualSpend: 220_000, contractEnd: d(60), relationshipOwner: 'CFO · Daniel Morrison', riskScore: 'Low', aiExposure: 'None' },
  { id: 'apx-v-19', name: 'Workday', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 1_800_000, contractEnd: d(142), relationshipOwner: 'CHRO · Maya Reyes', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'apx-v-20', name: 'Fortune-500 audit firm', category: 'Finance', relationshipTier: 'Strategic partner', annualSpend: 3_100_000, contractEnd: d(320), relationshipOwner: 'CFO · Daniel Morrison', riskScore: 'Low', aiExposure: 'None' },
  { id: 'apx-v-21', name: 'Shadow AI tool · unknown procurement path', category: 'Technology', relationshipTier: 'Under review', annualSpend: 0, contractEnd: d(0), relationshipOwner: 'CISO · Elena Vasquez', riskScore: 'Critical', aiExposure: 'Direct · unsanctioned' },
  { id: 'apx-v-22', name: 'HR benefits broker · Q4 renewal cycle', category: 'HR services', relationshipTier: 'Standard', annualSpend: 440_000, contractEnd: d(72), relationshipOwner: 'CHRO · Maya Reyes', riskScore: 'Low', aiExposure: 'None' },
];

const APEX_DATA: UploadedDataRow[] = [
  { id: 'apx-d-01', name: 'FY25 Owned Brand Margin Analysis', type: 'Financial record', sourceSystem: 'Finance data warehouse', sourceOwner: 'CFO · Daniel Morrison', qualityRating: 'Audit-grade', sensitivityMarking: 'Confidential', uploadedDate: d(-5), currencyStatus: 'Current', citedByCount: 34, chainOfCustody: 'Complete' },
  { id: 'apx-d-02', name: 'Revionics Markdown Export · Q3 2026', type: 'System export', sourceSystem: 'Revionics', sourceOwner: 'CCO · Christopher Vale', qualityRating: 'High', sensitivityMarking: 'Internal', uploadedDate: d(-12), currencyStatus: 'Current', citedByCount: 18, chainOfCustody: 'Complete' },
  { id: 'apx-d-03', name: 'Morrison Diagnostic Interview · Session 1', type: 'Interview', sourceSystem: 'Nexus interview log', sourceOwner: 'Nexus', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-9), currencyStatus: 'Current', citedByCount: 22, chainOfCustody: 'Complete' },
  { id: 'apx-d-04', name: 'Private-label supplier contracts · 2025 cohort', type: 'Contract', sourceSystem: 'Coupa', sourceOwner: 'CCO · Christopher Vale', qualityRating: 'Audit-grade', sensitivityMarking: 'Restricted', uploadedDate: d(-21), currencyStatus: 'Current', citedByCount: 11, chainOfCustody: 'Complete' },
  { id: 'apx-d-05', name: 'Executive committee · Q3 strategy memo', type: 'Document', sourceSystem: 'Internal', sourceOwner: 'CEO office', qualityRating: 'High', sensitivityMarking: 'Restricted', uploadedDate: d(-30), currencyStatus: 'Current', citedByCount: 8, chainOfCustody: 'Complete' },
  { id: 'apx-d-06', name: 'Landed-cost variance detail · FY25 H2', type: 'Financial record', sourceSystem: 'SAP', sourceOwner: 'CFO · Daniel Morrison', qualityRating: 'Audit-grade', sensitivityMarking: 'Confidential', uploadedDate: d(-7), currencyStatus: 'Current', citedByCount: 26, chainOfCustody: 'Complete' },
  { id: 'apx-d-07', name: 'CCO / CFO alignment notes · Nov 2026', type: 'Meeting notes', sourceSystem: 'Internal', sourceOwner: 'CFO · Daniel Morrison', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-3), currencyStatus: 'Current', citedByCount: 6, chainOfCustody: 'Complete' },
  { id: 'apx-d-08', name: 'Trade promotion ROI · pre-read model v7', type: 'Model output', sourceSystem: 'Nexus + Revionics', sourceOwner: 'CCO · Christopher Vale', qualityRating: 'Medium', sensitivityMarking: 'Internal', uploadedDate: d(-18), currencyStatus: 'Stale', citedByCount: 4, chainOfCustody: 'Complete' },
  { id: 'apx-d-09', name: 'Supplier rebate accrual reconciliation · FY24', type: 'Financial record', sourceSystem: 'A/P ledger', sourceOwner: 'CFO · Daniel Morrison', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-45), currencyStatus: 'Refresh required', citedByCount: 14, chainOfCustody: 'Complete' },
  { id: 'apx-d-10', name: 'Board pack · Q3 2026 · private label section', type: 'Document', sourceSystem: 'Internal', sourceOwner: 'CEO office', qualityRating: 'Audit-grade', sensitivityMarking: 'Restricted', uploadedDate: d(-14), currencyStatus: 'Current', citedByCount: 12, chainOfCustody: 'Complete' },
  { id: 'apx-d-11', name: 'Category-head interview series · 4 sessions', type: 'Interview', sourceSystem: 'Nexus interview log', sourceOwner: 'Nexus', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-16), currencyStatus: 'Current', citedByCount: 19, chainOfCustody: 'Complete' },
  { id: 'apx-d-12', name: 'SKU-level GM decomposition · top 200 OB SKUs', type: 'Model output', sourceSystem: 'Snowflake + dbt', sourceOwner: 'CDO · Priya Shah', qualityRating: 'Audit-grade', sensitivityMarking: 'Confidential', uploadedDate: d(-6), currencyStatus: 'Current', citedByCount: 21, chainOfCustody: 'Complete' },
  { id: 'apx-d-13', name: 'Competitor shelf intelligence · Engage3 export', type: 'System export', sourceSystem: 'Engage3', sourceOwner: 'CCO · Christopher Vale', qualityRating: 'Medium', sensitivityMarking: 'Internal', uploadedDate: d(-22), currencyStatus: 'Stale', citedByCount: 5, chainOfCustody: 'Complete' },
  { id: 'apx-d-14', name: 'Supplier email thread · pricing objections Q3', type: 'Communication', sourceSystem: 'Email archive', sourceOwner: 'CCO · Christopher Vale', qualityRating: 'Medium', sensitivityMarking: 'Restricted', uploadedDate: d(-11), currencyStatus: 'Current', citedByCount: 3, chainOfCustody: 'Incomplete' },
  { id: 'apx-d-15', name: 'Outcome baseline worksheet · F012 recovery', type: 'Model output', sourceSystem: 'Nexus', sourceOwner: 'Nexus', qualityRating: 'Audit-grade', sensitivityMarking: 'Confidential', uploadedDate: d(-2), currencyStatus: 'Current', citedByCount: 31, chainOfCustody: 'Complete' },
  { id: 'apx-d-16', name: 'Evidence Ledger export · Morrison program', type: 'System export', sourceSystem: 'Steward', sourceOwner: 'Steward', qualityRating: 'Audit-grade', sensitivityMarking: 'Confidential', uploadedDate: d(-1), currencyStatus: 'Current', citedByCount: 47, chainOfCustody: 'Complete' },
];

// ─── Fallback slices · Meridian / First Capital / Keystone ────────────
//
// Keep these light · the demo focus is Apex. When the other composites
// move to full demo depth, extend these arrays the same way.

const MERIDIAN_IT: ITStackRow[] = [
  { id: 'mer-it-01', name: 'Epic EHR Platform', category: 'Data', vendor: 'Epic', segment: 'Tier 1 · Strategic', budgetAnnual: 68_000_000, renewalDate: d(320), health: 'Healthy', aiCapability: 'Extension', integrations: 94 },
  { id: 'mer-it-02', name: 'Abridge Ambient Documentation', category: 'AI/ML', vendor: 'Abridge', segment: 'Tier 1 · Strategic', budgetAnnual: 4_080_000, renewalDate: d(74), health: 'Overutilized', aiCapability: 'Native', integrations: 12 },
  { id: 'mer-it-03', name: 'Nuance DAX', category: 'AI/ML', vendor: 'Microsoft', segment: 'Tier 2 · Operational', budgetAnnual: 1_656_000, renewalDate: d(118), health: 'Underutilized', aiCapability: 'Native', integrations: 8 },
  { id: 'mer-it-04', name: 'Aidoc Radiology AI', category: 'AI/ML', vendor: 'Aidoc', segment: 'Tier 2 · Operational', budgetAnnual: 720_000, renewalDate: d(188), health: 'Healthy', aiCapability: 'Native', integrations: 6 },
  { id: 'mer-it-05', name: 'Paige AI Pathology', category: 'AI/ML', vendor: 'Paige', segment: 'Tier 2 · Operational', budgetAnnual: 610_000, renewalDate: d(143), health: 'At risk', aiCapability: 'Native', integrations: 4 },
  { id: 'mer-it-06', name: 'Cohere Health Prior Auth', category: 'IT Ops', vendor: 'Cohere Health', segment: 'Tier 1 · Strategic', budgetAnnual: 2_040_000, renewalDate: d(101), health: 'Healthy', aiCapability: 'Native', integrations: 10 },
  { id: 'mer-it-07', name: 'Azure Enterprise Cloud', category: 'Data', vendor: 'Microsoft Azure', segment: 'Tier 1 · Strategic', budgetAnnual: 8_400_000, renewalDate: d(212), health: 'Healthy', aiCapability: 'Extension', integrations: 36 },
  { id: 'mer-it-08', name: 'Azure OpenAI', category: 'AI/ML', vendor: 'Microsoft Azure', segment: 'Tier 2 · Operational', budgetAnnual: 1_920_000, renewalDate: d(91), health: 'Healthy', aiCapability: 'Native', integrations: 15 },
  { id: 'mer-it-09', name: 'Workday HCM', category: 'HR', vendor: 'Workday', segment: 'Tier 1 · Strategic', budgetAnnual: 2_240_000, renewalDate: d(175), health: 'Healthy', aiCapability: 'None', integrations: 18 },
  { id: 'mer-it-10', name: 'UKG Workforce Management', category: 'HR', vendor: 'UKG', segment: 'Tier 2 · Operational', budgetAnnual: 1_340_000, renewalDate: d(63), health: 'Healthy', aiCapability: 'Extension', integrations: 9 },
  { id: 'mer-it-11', name: 'ServiceNow ITSM + HRSD', category: 'IT Ops', vendor: 'ServiceNow', segment: 'Tier 2 · Operational', budgetAnnual: 1_180_000, renewalDate: d(132), health: 'Healthy', aiCapability: 'Extension', integrations: 22 },
  { id: 'mer-it-12', name: 'CrowdStrike Falcon', category: 'Security', vendor: 'CrowdStrike', segment: 'Tier 1 · Strategic', budgetAnnual: 940_000, renewalDate: d(168), health: 'Healthy', aiCapability: 'Native', integrations: 5 },
  { id: 'mer-it-13', name: 'Palo Alto Prisma Access', category: 'Security', vendor: 'Palo Alto Networks', segment: 'Tier 1 · Strategic', budgetAnnual: 1_260_000, renewalDate: d(204), health: 'Healthy', aiCapability: 'Extension', integrations: 7 },
  { id: 'mer-it-14', name: 'Zscaler Zero Trust', category: 'Security', vendor: 'Zscaler', segment: 'Tier 2 · Operational', budgetAnnual: 860_000, renewalDate: d(156), health: 'Healthy', aiCapability: 'Extension', integrations: 11 },
  { id: 'mer-it-15', name: 'Glean Enterprise Search', category: 'Data', vendor: 'Glean', segment: 'Tier 3 · Tactical', budgetAnnual: 380_000, renewalDate: d(84), health: 'Healthy', aiCapability: 'Native', integrations: 6 },
  { id: 'mer-it-16', name: 'Anthropic Claude Enterprise', category: 'AI/ML', vendor: 'Anthropic', segment: 'Tier 3 · Tactical', budgetAnnual: 540_000, renewalDate: d(58), health: 'At risk', aiCapability: 'Native', integrations: 3 },
];

const MERIDIAN_VENDORS: VendorRow[] = [
  { id: 'mer-v-01', name: 'Epic', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 68_000_000, contractEnd: d(320), relationshipOwner: 'CIO · Sarah Chen', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'mer-v-02', name: 'Abridge', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 4_080_000, contractEnd: d(74), relationshipOwner: 'CMIO · Maya Patel', riskScore: 'Medium', aiExposure: 'Direct · sanctioned' },
  { id: 'mer-v-03', name: 'Microsoft Nuance', category: 'Technology', relationshipTier: 'Preferred', annualSpend: 1_656_000, contractEnd: d(118), relationshipOwner: 'CMIO · Maya Patel', riskScore: 'Medium', aiExposure: 'Direct · sanctioned' },
  { id: 'mer-v-04', name: 'Cohere Health', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 2_040_000, contractEnd: d(101), relationshipOwner: 'President Health Plans · Linda Chen-Winters', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'mer-v-05', name: 'Aidoc', category: 'Technology', relationshipTier: 'Preferred', annualSpend: 720_000, contractEnd: d(188), relationshipOwner: 'Radiology Operations · Melissa Ahn', riskScore: 'Low', aiExposure: 'Direct · sanctioned' },
  { id: 'mer-v-06', name: 'Paige AI', category: 'Technology', relationshipTier: 'Under review', annualSpend: 610_000, contractEnd: d(143), relationshipOwner: 'Pathology Service Line · Dr. Priya Venkataraman', riskScore: 'High', aiExposure: 'Direct · sanctioned' },
  { id: 'mer-v-07', name: 'Palo Alto Networks', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 1_260_000, contractEnd: d(204), relationshipOwner: 'CISO · Aaron Bishop', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'mer-v-08', name: 'CrowdStrike', category: 'Technology', relationshipTier: 'Strategic partner', annualSpend: 940_000, contractEnd: d(168), relationshipOwner: 'CISO · Aaron Bishop', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'mer-v-09', name: 'Zscaler', category: 'Technology', relationshipTier: 'Preferred', annualSpend: 860_000, contractEnd: d(156), relationshipOwner: 'CISO · Aaron Bishop', riskScore: 'Low', aiExposure: 'Indirect' },
  { id: 'mer-v-10', name: 'Glean', category: 'Technology', relationshipTier: 'Standard', annualSpend: 380_000, contractEnd: d(84), relationshipOwner: 'VP Data Platform · Devon Kim', riskScore: 'Medium', aiExposure: 'Direct · sanctioned' },
];

const MERIDIAN_DATA: UploadedDataRow[] = [
  { id: 'mer-d-01', name: 'Ambient Documentation Adoption Dashboard · East/Central/West', type: 'System export', sourceSystem: 'Abridge + Nuance admin consoles', sourceOwner: 'CMIO · Maya Patel', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-4), currencyStatus: 'Current', citedByCount: 21, chainOfCustody: 'Complete' },
  { id: 'mer-d-02', name: 'Prior Authorization Denial Baseline · Commercial + MA', type: 'Financial record', sourceSystem: 'Epic + Cohere Health', sourceOwner: 'Health Plans Ops', qualityRating: 'Audit-grade', sensitivityMarking: 'Restricted', uploadedDate: d(-8), currencyStatus: 'Current', citedByCount: 17, chainOfCustody: 'Complete' },
  { id: 'mer-d-03', name: 'Epic AI Use Case Inventory · FY26 Q2', type: 'Document', sourceSystem: 'Epic governance workspace', sourceOwner: 'CIO · Sarah Chen', qualityRating: 'High', sensitivityMarking: 'Internal', uploadedDate: d(-12), currencyStatus: 'Current', citedByCount: 13, chainOfCustody: 'Complete' },
  { id: 'mer-d-04', name: 'Abridge Contract Summary + Renewal Notes', type: 'Contract', sourceSystem: 'Legal contract vault', sourceOwner: 'General Counsel office', qualityRating: 'Audit-grade', sensitivityMarking: 'Restricted', uploadedDate: d(-18), currencyStatus: 'Current', citedByCount: 11, chainOfCustody: 'Complete' },
  { id: 'mer-d-05', name: 'Nuance DAX Regional Rollout Deck', type: 'Document', sourceSystem: 'Clinical operations SharePoint', sourceOwner: 'CMIO · Maya Patel', qualityRating: 'Medium', sensitivityMarking: 'Internal', uploadedDate: d(-22), currencyStatus: 'Stale', citedByCount: 8, chainOfCustody: 'Complete' },
  { id: 'mer-d-06', name: 'PHI-adjacent Shadow AI Incident Review', type: 'Meeting notes', sourceSystem: 'Security review archive', sourceOwner: 'CISO · Aaron Bishop', qualityRating: 'High', sensitivityMarking: 'Restricted', uploadedDate: d(-6), currencyStatus: 'Current', citedByCount: 14, chainOfCustody: 'Complete' },
  { id: 'mer-d-07', name: 'Pathology AI DPA + Subprocessor Review', type: 'Contract', sourceSystem: 'Vendor risk repository', sourceOwner: 'Vendor Risk Office', qualityRating: 'High', sensitivityMarking: 'Restricted', uploadedDate: d(-15), currencyStatus: 'Current', citedByCount: 7, chainOfCustody: 'Complete' },
  { id: 'mer-d-08', name: 'Board Packet Rebuild Effort Study', type: 'Interview', sourceSystem: 'Nexus interview log', sourceOwner: 'Nexus', qualityRating: 'High', sensitivityMarking: 'Confidential', uploadedDate: d(-3), currencyStatus: 'Current', citedByCount: 19, chainOfCustody: 'Complete' },
];

const FIRST_CAPITAL_IT: ITStackRow[] = APEX_IT.slice(0, 12).map((r, i) => ({ ...r, id: `fc-it-${i}` }));
const FIRST_CAPITAL_VENDORS: VendorRow[] = APEX_VENDORS.slice(0, 9).map((r, i) => ({ ...r, id: `fc-v-${i}` }));
const FIRST_CAPITAL_DATA: UploadedDataRow[] = APEX_DATA.slice(0, 9).map((r, i) => ({ ...r, id: `fc-d-${i}` }));

const KEYSTONE_IT: ITStackRow[] = APEX_IT.slice(0, 11).map((r, i) => ({ ...r, id: `key-it-${i}` }));
const KEYSTONE_VENDORS: VendorRow[] = APEX_VENDORS.slice(0, 10).map((r, i) => ({ ...r, id: `key-v-${i}` }));
const KEYSTONE_DATA: UploadedDataRow[] = APEX_DATA.slice(0, 10).map((r, i) => ({ ...r, id: `key-d-${i}` }));

export function getITStack(tenantKey: string | null): ITStackRow[] {
  if (!tenantKey) return APEX_IT;
  const k = tenantKey.toLowerCase();
  if (k.includes('apex')) return APEX_IT;
  if (k.includes('meridian')) return MERIDIAN_IT;
  if (k.includes('first') || k.includes('arcturus')) return FIRST_CAPITAL_IT;
  if (k.includes('keystone')) return KEYSTONE_IT;
  return APEX_IT;
}

export function getVendors(tenantKey: string | null): VendorRow[] {
  if (!tenantKey) return APEX_VENDORS;
  const k = tenantKey.toLowerCase();
  if (k.includes('apex')) return APEX_VENDORS;
  if (k.includes('meridian')) return MERIDIAN_VENDORS;
  if (k.includes('first') || k.includes('arcturus')) return FIRST_CAPITAL_VENDORS;
  if (k.includes('keystone')) return KEYSTONE_VENDORS;
  return APEX_VENDORS;
}

export function getUploadedData(tenantKey: string | null): UploadedDataRow[] {
  if (!tenantKey) return APEX_DATA;
  const k = tenantKey.toLowerCase();
  if (k.includes('apex')) return APEX_DATA;
  if (k.includes('meridian')) return MERIDIAN_DATA;
  if (k.includes('first') || k.includes('arcturus')) return FIRST_CAPITAL_DATA;
  if (k.includes('keystone')) return KEYSTONE_DATA;
  return APEX_DATA;
}
