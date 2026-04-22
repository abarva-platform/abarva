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

const MERIDIAN_IT: ITStackRow[] = APEX_IT.slice(0, 10).map((r, i) => ({ ...r, id: `mer-it-${i}`, vendor: r.vendor.includes('Retail') ? 'Epic' : r.vendor }));
const MERIDIAN_VENDORS: VendorRow[] = APEX_VENDORS.slice(0, 8).map((r, i) => ({ ...r, id: `mer-v-${i}` }));
const MERIDIAN_DATA: UploadedDataRow[] = APEX_DATA.slice(0, 8).map((r, i) => ({ ...r, id: `mer-d-${i}` }));

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
