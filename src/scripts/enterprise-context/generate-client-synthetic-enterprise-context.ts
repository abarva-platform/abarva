import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

import {
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateWorkbook,
} from '../../lib/enterprise-context/template-schema';

type Row = Record<string, string | number | boolean>;
type Dataset = Record<string, Row[]>;
type TenantKey = 'meridian' | 'apexretail' | 'arcturus';
type VendorSeed = readonly [string, string, string, number];
type SystemSeed = readonly [string, string, string, string, string, string, string, string];
type Profile = {
  tenantKey: TenantKey;
  tenantSlug: string;
  displayName: string;
  defaultOutRoot: string;
  ownerGroups: string[];
  vendors: VendorSeed[];
  facilities: string[];
  facilityTypes: string[];
  serviceLines: string[];
  criticalServices: string;
  systems: SystemSeed[];
  serviceNames: string[];
  policyNames: string[];
  dataDomains: string[];
  dataOwners: string[];
  initiativeNames: string[];
  financeOwners: string[];
  executives: Array<readonly [string, string, string, string, string]>;
  governanceGroups: Array<readonly [string, string, string, string, string]>;
};

const GENERATED_AT = '2026-05-01T00:00:00.000Z';
const SHARED_VENDOR_TAIL: VendorSeed[] = [
  ['VEN-SNOW', 'ServiceNow', 'ITSM / CMDB', 6200000],
  ['VEN-MICROSOFT', 'Microsoft', 'Productivity and Cloud', 12800000],
  ['VEN-AWS', 'Amazon Web Services', 'Cloud Hosting', 8400000],
  ['VEN-AZURE', 'Microsoft Azure', 'Cloud Hosting', 9600000],
  ['VEN-DATABRICKS', 'Databricks', 'Data Platform', 3900000],
  ['VEN-SNOWFLAKE', 'Snowflake', 'Data Warehouse', 3600000],
  ['VEN-OKTA', 'Okta', 'Identity and Access', 2300000],
  ['VEN-CROWDSTRIKE', 'CrowdStrike', 'Endpoint Security', 2900000],
  ['VEN-PALOALTO', 'Palo Alto Networks', 'Network Security', 3300000],
  ['VEN-ZSCALER', 'Zscaler', 'Secure Access', 2200000],
  ['VEN-BROADCOM', 'Broadcom', 'Infrastructure Software', 1900000],
  ['VEN-CISCO', 'Cisco', 'Network Infrastructure', 4700000],
  ['VEN-VEEAM', 'Veeam', 'Backup and Recovery', 1600000],
  ['VEN-HASHICORP', 'HashiCorp', 'Cloud Automation', 950000],
  ['VEN-QLIK', 'Qlik', 'Analytics', 1400000],
  ['VEN-QUALTRICS', 'Qualtrics', 'Experience Analytics', 980000],
  ['VEN-WORKDAY', 'Workday', 'HCM', 5200000],
];

const PROFILES: Record<TenantKey, Profile> = {
  meridian: {
    tenantKey: 'meridian',
    tenantSlug: 'meridian',
    displayName: 'Meridian Health',
    defaultOutRoot: 'docs/enterprise-context/synthetic/meridian',
    ownerGroups: ['EHR Platform Engineering', 'Clinical Informatics', 'Integration Operations', 'Revenue Cycle Technology', 'Contact Center Technology', 'Cloud Platform Services', 'Research Technology Office', 'Payer Platform Operations', 'Cybersecurity Governance', 'IT Sourcing'],
    vendors: [
      ['VEN-EPIC', 'Epic Systems', 'Clinical Systems', 18400000],
      ['VEN-ORACLE', 'Oracle Health / ERP', 'ERP and Finance', 9100000],
      ['VEN-SALESFORCE', 'Salesforce', 'CRM and Contact Center', 7400000],
      ['VEN-GENESYS', 'Genesys', 'Contact Center', 5100000],
      ['VEN-PALANTIR', 'Palantir', 'Research Analytics', 4200000],
      ['VEN-CERNER', 'Oracle Cerner', 'Legacy Clinical', 2600000],
      ['VEN-REDOX', 'Redox', 'Healthcare Integration', 2400000],
      ['VEN-ENSEMBLE', 'Ensemble Health', 'Revenue Cycle Services', 14200000],
      ['VEN-3M', '3M Health Information Systems', 'Coding and CDI', 2800000],
      ['VEN-NUANCE', 'Nuance', 'Ambient Documentation', 3100000],
      ['VEN-IMPRIVATA', 'Imprivata', 'Identity and Access', 1800000],
      ...SHARED_VENDOR_TAIL,
    ],
    facilities: ['Atlanta Medical Center', 'North Valley Hospital', 'Central City Hospital', 'Piedmont Community Hospital', 'Riverbend Medical Center', 'Eastside Children\'s Hospital', 'West Market Clinic Network', 'Meridian Research Institute', 'Meridian Contact Center North', 'Meridian Shared Services Campus', 'South Ridge Hospital', 'Lakeshore Hospital', 'Northwest Ambulatory Hub', 'East Market Imaging Center', 'Downtown Surgery Center', 'Meridian Data Center A', 'Meridian Data Center B', 'Population Health Operations', 'Payer Services Center', 'Clinical Command Center', 'Home Health Operations', 'Specialty Pharmacy Hub', 'Behavioral Health Center', 'Orthopedics Institute', 'Heart and Vascular Institute', 'Oncology Institute', 'Women and Children Service Line', 'Telehealth Operations', 'Revenue Cycle Shared Services', 'Supply Chain Operations', 'Research Bioinformatics Office', 'Enterprise PMO'],
    facilityTypes: ['Hospital', 'Clinic', 'Data Center', 'Shared Services', 'Research Center'],
    serviceLines: ['Acute Care', 'Ambulatory', 'Research', 'Revenue Cycle', 'Contact Center', 'Population Health'],
    criticalServices: 'Epic|Identity|Network|ServiceNow',
    systems: [
      ['CI-APP-EPIC-HYPERSPACE', 'Epic Hyperspace', 'Application', 'Clinical Documentation', 'VEN-EPIC', 'CON-EPIC-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-EPIC-CABOODLE', 'Epic Caboodle', 'Data Platform', 'Clinical Analytics', 'VEN-EPIC', 'CON-EPIC-2026', 'Restricted', 'Tier 1'],
      ['CI-INT-MIRTH', 'Mirth Connect Integration Engine', 'Integration', 'Clinical Integration', 'VEN-REDOX', 'CON-REDOX-2026', 'Restricted', 'Tier 1'],
      ['CI-SVC-CONTACT-CENTER', 'Enterprise Contact Center Service', 'Business Service', 'Contact Center Operations', 'VEN-GENESYS', 'CON-GENESYS-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-SALESFORCE-HEALTH', 'Salesforce Health Cloud', 'Application', 'CRM and Care Navigation', 'VEN-SALESFORCE', 'CON-SALESFORCE-2026', 'Restricted', 'Tier 2'],
      ['CI-APP-SERVICENOW', 'ServiceNow ITSM and CMDB', 'Application', 'IT Service Management', 'VEN-SNOW', 'CON-SNOW-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-ORACLE-ERP', 'Oracle ERP Cloud', 'Application', 'Finance and Procurement', 'VEN-ORACLE', 'CON-ORACLE-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-WORKDAY-HCM', 'Workday HCM', 'Application', 'Workforce Management', 'VEN-WORKDAY', 'CON-WORKDAY-2026', 'Confidential', 'Tier 2'],
      ['CI-DATA-RESEARCH-LAKE', 'Research Data Lake', 'Data Platform', 'Research Analytics', 'VEN-PALANTIR', 'CON-PALANTIR-2026', 'Restricted', 'Tier 1'],
      ['CI-PLAT-DATABRICKS', 'Databricks Clinical Analytics Workspace', 'Data Platform', 'Advanced Analytics', 'VEN-DATABRICKS', 'CON-DATABRICKS-2026', 'Restricted', 'Tier 2'],
      ['CI-WH-SNOWFLAKE', 'Snowflake Enterprise Warehouse', 'Data Platform', 'Enterprise Reporting', 'VEN-SNOWFLAKE', 'CON-SNOWFLAKE-2026', 'Confidential', 'Tier 2'],
      ['CI-SEC-OKTA', 'Okta Identity Service', 'Infrastructure', 'Identity and Access', 'VEN-OKTA', 'CON-OKTA-2026', 'Confidential', 'Tier 1'],
      ['CI-SEC-IMPRIVATA', 'Imprivata Clinical SSO', 'Application', 'Clinical Identity', 'VEN-IMPRIVATA', 'CON-IMPRIVATA-2026', 'Restricted', 'Tier 1'],
      ['CI-CLOUD-AWS-PROD', 'AWS Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AWS', 'CON-AWS-2026', 'Confidential', 'Tier 1'],
      ['CI-CLOUD-AZURE-PROD', 'Azure Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AZURE', 'CON-AZURE-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-ENSEMBLE-RCM', 'Ensemble Revenue Cycle Platform', 'Application', 'Revenue Cycle Operations', 'VEN-ENSEMBLE', 'CON-ENSEMBLE-2026', 'Restricted', 'Tier 1'],
    ],
    serviceNames: ['Claims Intake', 'Member Portal', 'Provider Directory', 'Pharmacy Dispensing', 'Imaging Archive', 'Provider Scheduling', 'Referral Management', 'Prior Authorization', 'Utilization Management', 'Clinical Trial Matching', 'Bioinformatics Pipeline', 'Data De-identification Service', 'Secure Research Workspace', 'Nurse Triage Platform', 'Telehealth Platform', 'Patient Messaging'],
    policyNames: ['AI Use and Clinical Safety Review', 'Model Monitoring and Drift Attestation', 'Cloud Data Handling Standard', 'Third-Party Risk Review', 'Clinical Integration Change Control', 'Research Data De-identification', 'Contact Center Recording Retention', 'Revenue Cycle Automation Controls'],
    dataDomains: ['Clinical Encounter', 'Revenue Cycle', 'Contact Center', 'Research Operations', 'Payer Operations', 'Provider Directory', 'Workforce', 'Financial Planning'],
    dataOwners: ['Chief Medical Information Officer', 'VP Revenue Cycle', 'VP Customer Operations', 'Research Technology Office'],
    initiativeNames: ['Contact Center AI Routing', 'Epic Hosting Modernization', 'Revenue Cycle Automation Controls', 'Research Secure Workspace Expansion', 'Clinical Integration Reliability', 'Population Health Data Product', 'Cloud Landing Zone Hardening', 'AI Governance Workflow'],
    financeOwners: ['Clinical Technology Finance', 'Enterprise IT Finance', 'Research Finance'],
    executives: [['PERSON-AKRISHNA', 'Anita Krishnamurthy', 'EVP Digital and Technology', 'Clinical platform investment', 'Approve'], ['PERSON-CIOOPS', 'Miguel Arroyo', 'SVP Infrastructure and Operations', 'Infrastructure modernization', 'Approve'], ['PERSON-CMO', 'Dr. Priya Shah', 'Chief Medical Officer', 'Clinical safety and physician workflow', 'Approve'], ['PERSON-CFO', 'Lena Ortiz', 'Chief Financial Officer', 'Capital allocation and value tracking', 'Approve'], ['PERSON-CDO', 'Renee Walters', 'Chief Data and Analytics Officer', 'Data and AI governance', 'Approve'], ['PERSON-CTO', 'Marcus Lee', 'Chief Technology Officer', 'Architecture and technical standards', 'Recommend']],
    governanceGroups: [['GROUP-CAB', 'Clinical Change Advisory Board', 'Governance Body', 'Clinical change approvals', 'Approve'], ['GROUP-AIGOV', 'AI Governance Council', 'Governance Body', 'AI policy and model monitoring', 'Approve'], ['GROUP-SOURCING', 'IT Sourcing Council', 'Governance Body', 'Vendor selection and renewal strategy', 'Recommend']],
  },
  apexretail: {
    tenantKey: 'apexretail',
    tenantSlug: 'apexretail',
    displayName: 'Apex Retail Group',
    defaultOutRoot: 'docs/enterprise-context/synthetic/apexretail',
    ownerGroups: ['Commerce Platform Engineering', 'Store Technology', 'Supply Chain Technology', 'Customer Data Platform Office', 'Merchandising Analytics', 'Contact Center Technology', 'Cloud Platform Services', 'Cybersecurity Governance', 'IT Sourcing', 'Finance Technology'],
    vendors: [
      ['VEN-SAP', 'SAP', 'ERP and Finance', 16300000],
      ['VEN-ORACLE', 'Oracle Retail', 'Merchandising and Planning', 11200000],
      ['VEN-SALESFORCE', 'Salesforce', 'CRM and Marketing', 8400000],
      ['VEN-SEGMENT', 'Twilio Segment', 'Customer Data Platform', 4300000],
      ['VEN-BLUEYONDER', 'Blue Yonder', 'Supply Chain Planning', 7600000],
      ['VEN-MANHATTAN', 'Manhattan Associates', 'Warehouse Management', 6900000],
      ['VEN-NCR', 'NCR Voyix', 'Point of Sale', 5800000],
      ['VEN-ADOBE', 'Adobe', 'Commerce and Experience', 4900000],
      ['VEN-GENESYS', 'Genesys', 'Contact Center', 3900000],
      ['VEN-RELEX', 'RELEX Solutions', 'Retail Planning Analytics', 3400000],
      ...SHARED_VENDOR_TAIL,
    ],
    facilities: ['Apex HQ Merchandising Center', 'Northwest Fulfillment Center', 'Southwest Fulfillment Center', 'East Coast Distribution Center', 'Midwest Distribution Center', 'Apex Digital Commerce Hub', 'Apex Contact Center North', 'Apex Contact Center South', 'Store Region 001', 'Store Region 002', 'Store Region 003', 'Store Region 004', 'Store Region 005', 'Store Region 006', 'Store Region 007', 'Store Region 008', 'Store Region 009', 'Store Region 010', 'Apex Data Center A', 'Apex Data Center B', 'Shared Services Procurement', 'Shared Services Finance', 'Store Operations Command Center', 'Private Label Studio', 'Loyalty Operations', 'Returns Processing Center', 'Apex Marketplace Operations', 'Digital Media Network Office', 'Cyber Fusion Center', 'Enterprise PMO', 'Cloud Platform Office', 'AI Governance Office'],
    facilityTypes: ['Shared Services', 'Data Center', 'Contact Center', 'Distribution Center', 'Store Region'],
    serviceLines: ['Store Operations', 'Digital Commerce', 'Supply Chain', 'Merchandising', 'Customer Experience', 'Finance'],
    criticalServices: 'POS|eCommerce|Loyalty|Inventory|ServiceNow',
    systems: [
      ['CI-APP-SAP-S4', 'SAP S/4 Finance and Procurement', 'Application', 'Finance and Procurement', 'VEN-SAP', 'CON-SAP-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-ORACLE-RETAIL', 'Oracle Retail Merchandising', 'Application', 'Merchandising Operations', 'VEN-ORACLE', 'CON-ORACLE-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-NCR-POS', 'NCR POS Store Platform', 'Application', 'Store Checkout', 'VEN-NCR', 'CON-NCR-2026', 'Restricted', 'Tier 1'],
      ['CI-SVC-ECOMMERCE', 'Apex Digital Commerce Service', 'Business Service', 'Digital Commerce', 'VEN-ADOBE', 'CON-ADOBE-2026', 'Confidential', 'Tier 1'],
      ['CI-DATA-CDP', 'Segment Customer Data Platform', 'Data Platform', 'Customer 360 and Personalization', 'VEN-SEGMENT', 'CON-SEGMENT-2026', 'Restricted', 'Tier 1'],
      ['CI-SVC-CONTACT-CENTER', 'Customer Care Contact Center', 'Business Service', 'Customer Experience', 'VEN-GENESYS', 'CON-GENESYS-2026', 'Confidential', 'Tier 2'],
      ['CI-APP-BLUEYONDER', 'Blue Yonder Demand Planning', 'Application', 'Demand Forecasting', 'VEN-BLUEYONDER', 'CON-BLUEYONDER-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-MANHATTAN-WMS', 'Manhattan WMS', 'Application', 'Distribution Operations', 'VEN-MANHATTAN', 'CON-MANHATTAN-2026', 'Confidential', 'Tier 1'],
      ['CI-WH-SNOWFLAKE', 'Snowflake Retail Data Cloud', 'Data Platform', 'Enterprise Retail Analytics', 'VEN-SNOWFLAKE', 'CON-SNOWFLAKE-2026', 'Confidential', 'Tier 2'],
      ['CI-PLAT-DATABRICKS', 'Databricks Forecasting Workspace', 'Data Platform', 'Advanced Analytics', 'VEN-DATABRICKS', 'CON-DATABRICKS-2026', 'Confidential', 'Tier 2'],
      ['CI-APP-SERVICENOW', 'ServiceNow ITSM and CMDB', 'Application', 'IT Service Management', 'VEN-SNOW', 'CON-SNOW-2026', 'Confidential', 'Tier 1'],
      ['CI-SEC-OKTA', 'Okta Identity Service', 'Infrastructure', 'Identity and Access', 'VEN-OKTA', 'CON-OKTA-2026', 'Confidential', 'Tier 1'],
      ['CI-CLOUD-AWS-PROD', 'AWS Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AWS', 'CON-AWS-2026', 'Confidential', 'Tier 1'],
      ['CI-CLOUD-AZURE-PROD', 'Azure Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AZURE', 'CON-AZURE-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-WORKDAY-HCM', 'Workday HCM', 'Application', 'Workforce Management', 'VEN-WORKDAY', 'CON-WORKDAY-2026', 'Confidential', 'Tier 2'],
      ['CI-APP-ADOBE-COMMERCE', 'Adobe Commerce Experience', 'Application', 'Digital Experience', 'VEN-ADOBE', 'CON-ADOBE-2026', 'Confidential', 'Tier 2'],
    ],
    serviceNames: ['Store Inventory Visibility', 'Promotion Pricing Engine', 'Loyalty Offer Decisioning', 'Returns Optimization', 'Marketplace Seller Hub', 'Retail Media Campaign Ops', 'Store Labor Scheduling', 'Category P&L Analytics', 'Vendor Scorecarding', 'Assortment Planning', 'Last Mile Delivery', 'Fraud Detection', 'Customer Identity Resolution', 'Associate Productivity', 'Private Label Quality', 'Demand Signal Repository'],
    policyNames: ['AI Use and Customer Experience Review', 'Promotion Data Quality Standard', 'Cloud Data Handling Standard', 'Third-Party Risk Review', 'Store Systems Change Control', 'Customer Data Consent Procedure', 'Contact Center Recording Retention', 'Revenue Recognition Automation Controls'],
    dataDomains: ['Customer Profile', 'Point of Sale', 'Inventory', 'Promotion', 'Supply Chain', 'Vendor Master', 'Store Labor', 'Financial Planning'],
    dataOwners: ['Chief Data Officer', 'VP Store Operations', 'VP Supply Chain', 'Merchandising Analytics Office'],
    initiativeNames: ['CDP Vendor Selection', 'Contact Center AI Platform', 'Store Associate Productivity Tools', 'AMS Consolidation Renewal', 'Demand Forecasting Control Tower', 'Retail Media Data Clean Room', 'Inventory Accuracy AI', 'Cloud Cost Governance'],
    financeOwners: ['Store Technology Finance', 'Digital Commerce Finance', 'Supply Chain Finance'],
    executives: [['PERSON-CARLOS', 'Carlos Rivera', 'Chief Information Officer', 'IT modernization and platform readiness', 'Approve'], ['PERSON-LYNNE', 'Lynne Stratham', 'Chief Data Officer', 'Customer data and AI governance', 'Approve'], ['PERSON-MARGARET', 'Margaret Chen', 'Chief Financial Officer', 'Capital allocation and ROI discipline', 'Approve'], ['PERSON-DAVID', 'David Okonjo', 'Chief Operating Officer', 'Store and supply chain operations', 'Approve'], ['PERSON-JENNIFER', 'Jennifer Park', 'Chief Marketing Officer', 'Customer experience and loyalty', 'Recommend'], ['PERSON-CTO', 'Ravi Menon', 'Chief Technology Officer', 'Architecture and engineering standards', 'Recommend']],
    governanceGroups: [['GROUP-AIGOV', 'AI Governance Council', 'Governance Body', 'AI policy and model monitoring', 'Approve'], ['GROUP-SOURCING', 'IT Sourcing Council', 'Governance Body', 'Vendor selection and renewal strategy', 'Recommend'], ['GROUP-CAB', 'Enterprise Change Advisory Board', 'Governance Body', 'Production change approvals', 'Approve']],
  },
  arcturus: {
    tenantKey: 'arcturus',
    tenantSlug: 'arcturus',
    displayName: 'First Capital Financial',
    defaultOutRoot: 'docs/enterprise-context/synthetic/arcturus',
    ownerGroups: ['Core Banking Platform', 'Digital Payments Technology', 'Risk and Compliance Technology', 'Data and Model Governance', 'Treasury Technology', 'Commercial Banking Operations', 'Cloud Platform Services', 'Cybersecurity Governance', 'IT Sourcing', 'Finance Technology'],
    vendors: [
      ['VEN-FIS', 'FIS', 'Core Banking', 17600000],
      ['VEN-FISERV', 'Fiserv', 'Payments and Channels', 11800000],
      ['VEN-NICE', 'NICE Actimize', 'Financial Crime', 7400000],
      ['VEN-ADENZA', 'Adenza', 'Regulatory Reporting', 6200000],
      ['VEN-AXIOMSL', 'AxiomSL', 'Risk Reporting', 4900000],
      ['VEN-SALESFORCE', 'Salesforce Financial Services Cloud', 'CRM', 4200000],
      ['VEN-MUREX', 'Murex', 'Treasury and Markets', 3900000],
      ['VEN-SAS', 'SAS', 'Model Risk Analytics', 3300000],
      ['VEN-TERADATA', 'Teradata', 'Legacy Data Warehouse', 2800000],
      ['VEN-NCINO', 'nCino', 'Commercial Lending Workflow', 3100000],
      ...SHARED_VENDOR_TAIL,
    ],
    facilities: ['First Capital HQ', 'Commercial Banking Operations Center', 'Payments Operations Center', 'Treasury Operations Center', 'Risk and Compliance Office', 'Digital Banking Studio', 'Contact Center East', 'Contact Center West', 'Branch Region 001', 'Branch Region 002', 'Branch Region 003', 'Branch Region 004', 'Branch Region 005', 'Branch Region 006', 'Branch Region 007', 'Branch Region 008', 'Branch Region 009', 'Branch Region 010', 'Data Center A', 'Data Center B', 'Cyber Fusion Center', 'Model Risk Office', 'Internal Audit Office', 'Loan Operations Center', 'Card Operations Center', 'Wealth Operations Office', 'Enterprise PMO', 'Cloud Platform Office', 'Procurement Office', 'Finance Shared Services', 'Regulatory Reporting Hub', 'AI Governance Office'],
    facilityTypes: ['Shared Services', 'Data Center', 'Contact Center', 'Branch Region', 'Operations Center'],
    serviceLines: ['Commercial Banking', 'Digital Banking', 'Payments', 'Risk and Compliance', 'Treasury', 'Finance'],
    criticalServices: 'Core Banking|Payments|Fraud Monitoring|Identity|ServiceNow',
    systems: [
      ['CI-APP-FIS-HORIZON', 'FIS HORIZON Core Banking', 'Application', 'Core Banking', 'VEN-FIS', 'CON-FIS-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-DIGITAL-BANKING', 'Digital Banking Platform', 'Application', 'Digital Banking', 'VEN-FISERV', 'CON-FISERV-2026', 'Restricted', 'Tier 1'],
      ['CI-SVC-FEDNOW', 'FedNow Payment Rails Service', 'Business Service', 'Real-Time Payments', 'VEN-FISERV', 'CON-FISERV-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-NICE-ACTIMIZE', 'NICE Actimize Financial Crime', 'Application', 'Fraud and AML', 'VEN-NICE', 'CON-NICE-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-ADENZA', 'Adenza Regulatory Reporting', 'Application', 'Regulatory Reporting', 'VEN-ADENZA', 'CON-ADENZA-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-AXIOMSL', 'AxiomSL Risk Reporting', 'Application', 'Risk Reporting', 'VEN-AXIOMSL', 'CON-AXIOMSL-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-SALESFORCE-FSC', 'Salesforce Financial Services Cloud', 'Application', 'Relationship Management', 'VEN-SALESFORCE', 'CON-SALESFORCE-2026', 'Confidential', 'Tier 2'],
      ['CI-DATA-RISK-LAKE', 'Risk and Model Data Lake', 'Data Platform', 'Risk Analytics', 'VEN-DATABRICKS', 'CON-DATABRICKS-2026', 'Restricted', 'Tier 1'],
      ['CI-WH-SNOWFLAKE', 'Snowflake Bank Data Cloud', 'Data Platform', 'Enterprise Reporting', 'VEN-SNOWFLAKE', 'CON-SNOWFLAKE-2026', 'Confidential', 'Tier 2'],
      ['CI-APP-SERVICENOW', 'ServiceNow ITSM and CMDB', 'Application', 'IT Service Management', 'VEN-SNOW', 'CON-SNOW-2026', 'Confidential', 'Tier 1'],
      ['CI-SEC-OKTA', 'Okta Identity Service', 'Infrastructure', 'Identity and Access', 'VEN-OKTA', 'CON-OKTA-2026', 'Confidential', 'Tier 1'],
      ['CI-CLOUD-AWS-PROD', 'AWS Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AWS', 'CON-AWS-2026', 'Confidential', 'Tier 1'],
      ['CI-CLOUD-AZURE-PROD', 'Azure Production Landing Zone', 'Infrastructure', 'Cloud Hosting', 'VEN-AZURE', 'CON-AZURE-2026', 'Confidential', 'Tier 1'],
      ['CI-APP-MUREX', 'Murex Treasury Platform', 'Application', 'Treasury and Markets', 'VEN-MUREX', 'CON-MUREX-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-SAS-MRM', 'SAS Model Risk Analytics', 'Application', 'Model Risk Management', 'VEN-SAS', 'CON-SAS-2026', 'Restricted', 'Tier 1'],
      ['CI-APP-WORKDAY-HCM', 'Workday HCM', 'Application', 'Workforce Management', 'VEN-WORKDAY', 'CON-WORKDAY-2026', 'Confidential', 'Tier 2'],
    ],
    serviceNames: ['Commercial Loan Origination', 'Deposit Pricing Engine', 'Treasury Cash Forecasting', 'Wire Transfer Monitoring', 'Branch Workforce Scheduling', 'Customer Risk Rating', 'CCAR Scenario Data Mart', 'Model Inventory Workflow', 'Liquidity Reporting', 'Card Fraud Triage', 'Digital Onboarding', 'KYC Refresh Workflow', 'Collateral Valuation', 'Regulatory Change Tracker', 'Wealth Client Portal', 'Data Quality Rule Engine'],
    policyNames: ['AI Use and Model Risk Review', 'SR 11-7 Model Attestation Procedure', 'Cloud Data Handling Standard', 'Third-Party Risk Review', 'Payments Change Control', 'Customer Data Consent Procedure', 'Contact Center Recording Retention', 'Regulatory Reporting Automation Controls'],
    dataDomains: ['Customer Master', 'Account Ledger', 'Payments', 'Credit Risk', 'Model Inventory', 'Regulatory Reporting', 'Treasury', 'Financial Planning'],
    dataOwners: ['Chief Data Officer', 'Chief Risk Officer', 'VP Payments Operations', 'Regulatory Reporting Office'],
    initiativeNames: ['FedNow Payment Rails', 'Core Banking Modernization', 'AI Model Governance Workflow', 'Credit Decisioning Platform', 'Regulatory Reporting Automation', 'Fraud Operations Modernization', 'Cloud Controls Remediation', 'Data Warehouse Exit'],
    financeOwners: ['Technology Finance', 'Risk Finance', 'Treasury Finance'],
    executives: [['PERSON-PATRICIA', 'Patricia Huang', 'Chief Information Officer', 'Core modernization and digital payments', 'Approve'], ['PERSON-JAMES', 'James Park', 'Chief Risk Officer', 'Model risk and operational risk', 'Approve'], ['PERSON-MICHAEL', 'Michael Torres', 'Chief Financial Officer', 'Capital allocation and expense discipline', 'Approve'], ['PERSON-CISO', 'Tobias Aboagye', 'Chief Information Security Officer', 'Cybersecurity and third-party risk', 'Approve'], ['PERSON-CDO', 'Elena Marquez', 'Chief Data Officer', 'Data governance and AI-ready data products', 'Recommend'], ['PERSON-CTO', 'Maya Desai', 'Chief Technology Officer', 'Architecture and cloud engineering standards', 'Recommend']],
    governanceGroups: [['GROUP-MRM', 'Model Risk Committee', 'Governance Body', 'Model and AI approvals', 'Approve'], ['GROUP-SOURCING', 'IT Sourcing Council', 'Governance Body', 'Vendor selection and renewal strategy', 'Recommend'], ['GROUP-CAB', 'Enterprise Change Advisory Board', 'Governance Body', 'Production change approvals', 'Approve']],
  },
};

const tenantArg = (process.argv.find((arg) => arg.startsWith('--tenant='))?.split('=')[1] ?? 'meridian') as TenantKey;
const TENANT = PROFILES[tenantArg];
if (!TENANT) throw new Error(`Unsupported tenant ${tenantArg}. Expected one of: ${Object.keys(PROFILES).join(', ')}`);
const ownerGroups = TENANT.ownerGroups;
const vendors = TENANT.vendors;
const facilities = TENANT.facilities;
const systemSeeds = TENANT.systems;

function withMeta(row: Row, sourceSystem: string, sourceRecordId: string, sourceOwner: string, confidence = 0.86, evidenceUsable = true): Row {
  return {
    ...row,
    source_system: sourceSystem,
    source_record_id: sourceRecordId,
    source_owner: sourceOwner,
    last_validated_date: '2026-05-01',
    confidence,
    evidence_usable: evidenceUsable,
    notes_gaps: '',
  };
}

function csvEscape(value: string | number | boolean | undefined): string {
  const text = value === undefined ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Row[], columns: readonly string[]): string {
  return [
    columns.map(csvEscape).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n') + '\n';
}

function month(index: number): string {
  const date = new Date(Date.UTC(2026, index, 1));
  return date.toISOString().slice(0, 10);
}

function endOfMonth(index: number): string {
  const date = new Date(Date.UTC(2026, index + 1, 0));
  return date.toISOString().slice(0, 10);
}

function buildOrg(): Row[] {
  const roles = [...TENANT.executives, ...TENANT.governanceGroups] as const;
  const rows = roles.map((role, index) => withMeta({
    org_unit_id: index < 6 ? 'ORG-EXEC' : 'ORG-GOVERNANCE',
    person_or_group_id: role[0],
    name: role[1],
    role_title: role[2],
    reports_to_id: index === 0 ? 'PERSON-CEO' : TENANT.executives[0][0],
    decision_domain: role[3],
    decision_right: role[4],
    approval_authority: index < 5 ? 'Executive approval authority for assigned domain' : 'Decision forum charter authority',
    delegated_to_id: '',
    escalation_path: 'Executive Steering Committee',
  }, 'Workday', role[0], 'People Operations', 0.92));

  for (let i = 1; i <= 31; i += 1) {
    rows.push(withMeta({
      org_unit_id: `ORG-${String(i).padStart(2, '0')}`,
      person_or_group_id: `GROUP-OPS-${String(i).padStart(2, '0')}`,
      name: `${ownerGroups[i % ownerGroups.length]} Stewardship Group`,
      role_title: 'Operational Stewardship Group',
      reports_to_id: TENANT.executives[1]?.[0] ?? TENANT.executives[0][0],
      decision_domain: `${ownerGroups[i % ownerGroups.length]} data and service ownership`,
      decision_right: i % 3 === 0 ? 'Recommend' : 'Consult',
      approval_authority: 'Operational validation and evidence attestation',
      delegated_to_id: '',
      escalation_path: 'CIO Operations Review',
    }, 'Manual attestation', `ORG-OPS-${i}`, ownerGroups[i % ownerGroups.length], 0.8));
  }
  return rows;
}

function buildFacilities(): Row[] {
  return facilities.map((name, index) => withMeta({
    facility_id: `FAC-${TENANT.tenantKey.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    business_unit_id: `BU-${TENANT.serviceLines[index % TENANT.serviceLines.length].toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
    facility_name: name,
    facility_type: TENANT.facilityTypes[index % TENANT.facilityTypes.length],
    region: ['Southeast', 'Mid-Atlantic', 'North', 'Central'][index % 4],
    service_line: TENANT.serviceLines[index % TENANT.serviceLines.length],
    bed_count: TENANT.tenantKey === 'meridian' && index < 6 ? 180 + index * 42 : '',
    annual_encounters: TENANT.tenantKey === 'meridian' ? 45000 + index * 8750 : 120000 + index * 18500,
    revenue_owner: ['Regional CFO', 'Service Line Finance', 'Shared Services Finance'][index % 3],
    it_site_owner: ownerGroups[index % ownerGroups.length],
    critical_services: TENANT.criticalServices,
  }, 'Facilities master', `FAC-${index + 1}`, 'Facilities Operations', 0.84));
}

function buildSystems(): Row[] {
  const rows: Row[] = systemSeeds.map((seed, index) => withMeta({
    ci_id: seed[0],
    ci_name: seed[1],
    ci_type: seed[2],
    business_service: seed[3],
    application_owner: ownerGroups[index % ownerGroups.length],
    technical_owner: ownerGroups[(index + 1) % ownerGroups.length],
    support_group: ownerGroups[(index + 2) % ownerGroups.length],
    criticality: seed[7],
    hosting_model: index % 5 === 0 ? 'SaaS' : index % 5 === 1 ? 'Hosted' : index % 5 === 2 ? 'Public Cloud' : index % 5 === 3 ? 'Private Cloud' : 'Hybrid',
    environment: 'Production',
    vendor_id: seed[4],
    contract_id: seed[5],
    data_classification: seed[6],
    service_tier: index < 10 ? 'Gold' : 'Silver',
  }, 'ServiceNow', seed[0], 'CMDB Stewardship', 0.88));

  for (let i = 0; rows.length < 82; i += 1) {
    const vendor = vendors[i % vendors.length];
    const name = TENANT.serviceNames[i % TENANT.serviceNames.length];
    const id = `CI-${i % 3 === 0 ? 'APP' : i % 3 === 1 ? 'SVC' : 'DATA'}-${String(i + 1).padStart(3, '0')}`;
    rows.push(withMeta({
      ci_id: id,
      ci_name: `${name} ${Math.floor(i / TENANT.serviceNames.length) + 1}`,
      ci_type: i % 3 === 0 ? 'Application' : i % 3 === 1 ? 'Business Service' : 'Data Platform',
      business_service: name,
      application_owner: ownerGroups[i % ownerGroups.length],
      technical_owner: ownerGroups[(i + 3) % ownerGroups.length],
      support_group: ownerGroups[(i + 4) % ownerGroups.length],
      criticality: i % 5 === 0 ? 'Tier 1' : i % 3 === 0 ? 'Tier 2' : 'Tier 3',
      hosting_model: ['SaaS', 'Hosted', 'Public Cloud', 'On Premise', 'Hybrid'][i % 5],
      environment: 'Production',
      vendor_id: vendor[0],
      contract_id: `CON-${vendor[0].replace('VEN-', '')}-2026`,
      data_classification: i % 4 === 0 ? 'Restricted' : i % 4 === 1 ? 'Confidential' : 'Internal',
      service_tier: i % 5 === 0 ? 'Gold' : i % 3 === 0 ? 'Silver' : 'Bronze',
    }, 'ServiceNow', id, 'CMDB Stewardship', 0.79 + (i % 10) / 100, i % 7 !== 0));
  }
  return rows;
}

function buildContracts(): Row[] {
  return vendors.map((vendor, index) => withMeta({
    vendor_id: vendor[0],
    vendor_name: vendor[1],
    contract_id: `CON-${vendor[0].replace('VEN-', '')}-2026`,
    contract_name: `${vendor[1]} Enterprise Services Agreement`,
    category: vendor[2],
    contract_owner: 'IT Sourcing',
    relationship_owner: ownerGroups[index % ownerGroups.length],
    start_date: `2024-${String((index % 12) + 1).padStart(2, '0')}-01`,
    end_date: `2027-${String((index % 12) + 1).padStart(2, '0')}-28`,
    annual_spend_usd: vendor[3],
    termination_notice_days: [90, 120, 180, 365][index % 4],
    baa_required: index % 5 !== 0,
    security_review_status: index % 6 === 0 ? 'Due' : 'Current',
  }, 'Coupa', `CON-${vendor[0]}`, 'IT Sourcing', 0.87));
}

function buildRenewals(): Row[] {
  return vendors.slice(0, 24).map((vendor, index) => withMeta({
    renewal_id: `REN-${vendor[0].replace('VEN-', '')}-2027`,
    contract_id: `CON-${vendor[0].replace('VEN-', '')}-2026`,
    vendor_id: vendor[0],
    renewal_date: `2027-${String((index % 12) + 1).padStart(2, '0')}-28`,
    notice_date: `2026-${String(((index + 6) % 12) + 1).padStart(2, '0')}-15`,
    renewal_type: index % 4 === 0 ? 'Competitive sourcing' : index % 3 === 0 ? 'Negotiated renewal' : 'Auto-renewal',
    estimated_value_usd: vendor[3] * (index % 4 === 0 ? 3 : 1),
    sourcing_required: index % 4 === 0,
    decision_owner: ownerGroups[index % ownerGroups.length],
    renewal_risk: index % 4 === 0 ? 'High' : index % 3 === 0 ? 'Medium' : 'Low',
    status: index % 4 === 0 ? 'Planning' : 'Not Started',
  }, 'Legal CLM', `REN-${vendor[0]}`, 'IT Sourcing', 0.83));
}

function buildSpend(): Row[] {
  const rows: Row[] = [];
  for (let m = 0; m < 12; m += 1) {
    vendors.slice(0, 12).forEach((vendor, index) => {
      const monthly = Math.round(vendor[3] / 12 * (0.94 + ((m + index) % 7) * 0.02));
      rows.push(withMeta({
        spend_id: `SPEND-2026-${String(m + 1).padStart(2, '0')}-${vendor[0].replace('VEN-', '')}`,
        period_start: month(m),
        period_end: endOfMonth(m),
        business_unit_id: `BU-${TENANT.serviceLines[index % TENANT.serviceLines.length].toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
        cost_center: `CC-${44000 + index * 10}`,
        vendor_id: vendor[0],
        contract_id: `CON-${vendor[0].replace('VEN-', '')}-2026`,
        category: vendor[2],
        actual_spend_usd: monthly,
        run_rate_usd: monthly * 12,
        capex_opex: index % 5 === 0 ? 'Mixed' : 'Opex',
        budget_owner: TENANT.financeOwners[index % TENANT.financeOwners.length],
      }, 'Finance ERP', `SPEND-${m}-${vendor[0]}`, 'Finance Operations', 0.9));
    });
  }
  return rows;
}

function buildPolicies(): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 32; i += 1) {
    rows.push(withMeta({
      policy_id: `POL-${String(i + 1).padStart(3, '0')}`,
      policy_name: `${TENANT.policyNames[i % TENANT.policyNames.length]} ${Math.floor(i / TENANT.policyNames.length) + 1}`,
      policy_type: ['Policy', 'Procedure', 'Control', 'Standard'][i % 4],
      effective_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      version: `v${1 + (i % 3)}.${i % 5}`,
      policy_owner: i % 2 === 0 ? 'AI Governance Council' : 'Cybersecurity Governance',
      applies_to_systems: systemSeeds[i % systemSeeds.length][0],
      data_domains: TENANT.dataDomains[i % TENANT.dataDomains.length],
      control_requirement: 'Owner attestation, evidence retention, and pre-production review are required.',
      ai_constraint: i % 3 === 0 ? 'No autonomous decisioning without accountable human attestation.' : 'AI use requires logged monitoring and periodic validation.',
      review_cycle_days: [180, 365, 730][i % 3],
      next_review_date: `2027-${String((i % 12) + 1).padStart(2, '0')}-15`,
    }, 'GRC', `POL-${i + 1}`, 'GRC Office', 0.84));
  }
  return rows;
}

function buildIncidents(systems: Row[]): Row[] {
  const descriptions = [
    'integration queue latency exceeded threshold',
    'scheduled job failure delayed downstream reporting',
    'authentication timeout affected internal users',
    'API gateway throttling affected service availability',
    'batch reconciliation variance required manual review',
    'monitoring alert indicated degraded service response',
  ];
  const rows: Row[] = [];
  for (let i = 0; i < 180; i += 1) {
    const system = systems[i % systems.length];
    rows.push(withMeta({
      incident_id: `INC${String(120000 + i).padStart(7, '0')}`,
      opened_at: `2026-${String((i % 4) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
      closed_at: i % 9 === 0 ? '' : `2026-${String((i % 4) + 1).padStart(2, '0')}-${String(Math.min((i % 27) + 2, 28)).padStart(2, '0')}`,
      ci_id: system.ci_id,
      business_service: system.business_service,
      priority: i % 31 === 0 ? 'P1' : i % 7 === 0 ? 'P2' : i % 3 === 0 ? 'P3' : 'P4',
      severity: i % 31 === 0 ? 'Critical' : i % 7 === 0 ? 'High' : i % 3 === 0 ? 'Medium' : 'Low',
      assignment_group: system.support_group,
      short_description: `${system.business_service} ${descriptions[i % descriptions.length]}`,
      resolution_code: i % 9 === 0 ? '' : ['Capacity tuning', 'Configuration update', 'Vendor patch', 'Restarted service', 'Runbook correction'][i % 5],
      breach_sla: i % 13 === 0,
      related_problem_id: i % 6 === 0 ? `PRB${String(1800 + (i % 36)).padStart(7, '0')}` : '',
    }, 'ServiceNow', `INC${120000 + i}`, 'IT Service Management', 0.81, i % 9 !== 0));
  }
  return rows;
}

function buildProblems(systems: Row[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 36; i += 1) {
    const system = systems[(i * 3) % systems.length];
    rows.push(withMeta({
      problem_id: `PRB${String(1800 + i).padStart(7, '0')}`,
      opened_at: `2026-${String((i % 3) + 1).padStart(2, '0')}-${String((i % 25) + 1).padStart(2, '0')}`,
      closed_at: i % 5 === 0 ? '' : `2026-04-${String((i % 20) + 1).padStart(2, '0')}`,
      ci_id: system.ci_id,
      business_service: system.business_service,
      priority: i % 11 === 0 ? 'P1' : i % 4 === 0 ? 'P2' : 'P3',
      root_cause_category: ['Capacity management', 'Configuration drift', 'Vendor defect', 'Monitoring gap', 'Ownership gap'][i % 5],
      known_error: i % 2 === 0,
      status: i % 5 === 0 ? 'Open' : i % 3 === 0 ? 'Known Error' : 'Resolved',
      owner: system.support_group,
      linked_incident_count: 3 + (i % 14),
      workaround_available: i % 4 !== 0,
    }, 'ServiceNow', `PRB${1800 + i}`, 'Problem Management', 0.82));
  }
  return rows;
}

function buildChanges(systems: Row[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 90; i += 1) {
    const system = systems[(i * 5) % systems.length];
    rows.push(withMeta({
      change_id: `CHG${String(48000 + i).padStart(7, '0')}`,
      planned_start: `2026-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 26) + 1).padStart(2, '0')}`,
      planned_end: `2026-${String((i % 6) + 1).padStart(2, '0')}-${String(Math.min((i % 26) + 1, 28)).padStart(2, '0')}`,
      ci_id: system.ci_id,
      business_service: system.business_service,
      change_type: i % 17 === 0 ? 'Emergency' : i % 4 === 0 ? 'Standard' : 'Normal',
      risk_level: i % 17 === 0 ? 'High' : i % 5 === 0 ? 'Medium' : 'Low',
      approval_group: i % 3 === 0 ? TENANT.governanceGroups[0][1] : 'Enterprise CAB',
      implementation_owner: system.technical_owner,
      status: i % 11 === 0 ? 'Failed' : i % 3 === 0 ? 'Implemented' : 'Scheduled',
      backout_plan_tested: i % 7 !== 0,
      caused_incident_id: i % 11 === 0 ? `INC${String(120000 + i).padStart(7, '0')}` : '',
    }, 'ServiceNow', `CHG${48000 + i}`, 'Change Management', 0.83, i % 11 !== 0));
  }
  return rows;
}

function buildRelationships(systems: Row[]): Row[] {
  const hubs = ['CI-APP-SERVICENOW', 'CI-SEC-OKTA', 'CI-CLOUD-AZURE-PROD', 'CI-CLOUD-AWS-PROD', systemSeeds[0][0]];
  const rows: Row[] = [];
  systems.forEach((system, index) => {
    const relCount = index % 4 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    for (let j = 0; j < relCount; j += 1) {
      const target = hubs[(index + j) % hubs.length];
      if (target === system.ci_id) continue;
      rows.push(withMeta({
        relationship_id: `REL-${String(rows.length + 1).padStart(4, '0')}`,
        from_ci_id: system.ci_id,
        to_ci_id: target,
        relationship_type: ['Depends On', 'Integrates With', 'Secured By', 'Hosted On'][j % 4],
        dependency_direction: j % 2 === 0 ? 'Outbound' : 'Bidirectional',
        integration_pattern: ['API', 'Event stream', 'Batch file', 'SSO', 'Database replication'][j % 5],
        data_flow: `${system.business_service} operational metadata to ${target}`,
        criticality: system.criticality === 'Tier 1' ? 'Critical' : index % 3 === 0 ? 'High' : 'Medium',
        recovery_dependency: index % 5 === 0,
        known_gap: index % 13 === 0 ? 'Relationship owner needs quarterly validation.' : '',
      }, 'ServiceNow', `REL-${rows.length + 1}`, 'CMDB Stewardship', 0.78 + (index % 10) / 100, index % 13 !== 0));
    }
  });
  return rows.slice(0, 220);
}

function buildSlas(systems: Row[]): Row[] {
  return systems.slice(0, 28).map((system, index) => withMeta({
    sla_id: `SLA-${String(index + 1).padStart(3, '0')}`,
    business_service: system.business_service,
    ci_id: system.ci_id,
    sla_name: `${system.business_service} availability and response`,
    metric_name: index % 2 === 0 ? 'Availability' : 'Incident response',
    target_value: index % 2 === 0 ? 99.9 : 4,
    unit: index % 2 === 0 ? 'percent' : 'hours',
    measurement_source: 'ServiceNow APM',
    owner: system.support_group,
    breach_count_90d: index % 7,
    trending_status: index % 7 > 4 ? 'Worsening' : index % 3 === 0 ? 'Improving' : 'Stable',
    penalty_or_impact: 'Operational escalation and executive review if breached.',
  }, 'ServiceNow', `SLA-${index + 1}`, 'IT Service Management', 0.84));
}

function buildInitiatives(systems: Row[], contracts: Row[], policies: Row[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 32; i += 1) {
    rows.push(withMeta({
      initiative_id: `INIT-${String(i + 1).padStart(3, '0')}`,
      initiative_name: `${TENANT.initiativeNames[i % TENANT.initiativeNames.length]} ${Math.floor(i / TENANT.initiativeNames.length) + 1}`,
      sponsor: TENANT.executives[i % Math.min(4, TENANT.executives.length)][2],
      initiative_owner: ownerGroups[i % ownerGroups.length],
      status: ['Proposed', 'In Design', 'Approved', 'In Flight'][i % 4],
      stage: ['P1 Charter', 'P2 Diagnose', 'P3 Design', 'P4 Roadmap'][i % 4],
      start_date: `2026-${String((i % 6) + 1).padStart(2, '0')}-01`,
      target_date: `2026-${String(((i + 5) % 12) + 1).padStart(2, '0')}-28`,
      value_hypothesis: 'Improve service reliability, reduce operational friction, and strengthen decision evidence.',
      dependent_ci_ids: `${systems[i % systems.length].ci_id}|${systems[(i + 7) % systems.length].ci_id}`,
      dependent_contract_ids: `${contracts[i % contracts.length].contract_id}`,
      policy_constraints: `${policies[i % policies.length].policy_id}|${policies[(i + 3) % policies.length].policy_id}`,
    }, 'Enterprise PMO', `INIT-${i + 1}`, 'Enterprise PMO', 0.8));
  }
  return rows;
}

function buildDataDomains(systems: Row[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < 32; i += 1) {
    rows.push(withMeta({
      data_domain_id: `DATA-${String(i + 1).padStart(3, '0')}`,
      domain_name: `${TENANT.dataDomains[i % TENANT.dataDomains.length]} Domain ${Math.floor(i / TENANT.dataDomains.length) + 1}`,
      data_owner: TENANT.dataOwners[i % TENANT.dataOwners.length],
      data_steward: ownerGroups[i % ownerGroups.length],
      source_systems: `${systems[i % systems.length].ci_name}|${systems[(i + 5) % systems.length].ci_name}`,
      critical_data_elements: 'Service ID|Owner|Status|Timestamp',
      classification: i % 4 === 0 ? 'Restricted' : i % 3 === 0 ? 'Confidential' : 'Internal',
      quality_score: Number((0.72 + (i % 20) / 100).toFixed(2)),
      retention_policy: 'Enterprise retention schedule',
      ai_use_allowed: i % 6 === 0 ? 'Prohibited' : i % 3 === 0 ? 'Conditional' : 'Allowed',
      last_quality_review: `2026-04-${String((i % 20) + 1).padStart(2, '0')}`,
    }, 'Data catalog', `DATA-${i + 1}`, 'Data Governance', 0.82));
  }
  return rows;
}

function buildRisks(systems: Row[], contracts: Row[], policies: Row[]): Row[] {
  const titles = [
    'Critical CI owner validation is stale',
    'Renewal decision date lacks sourcing owner',
    'AI workflow lacks model monitoring evidence',
    'Incident trend worsened for dependent service',
    'Vendor security review due before renewal',
    'Policy review date approaching without steward attestation',
  ];
  const rows: Row[] = [];
  for (let i = 0; i < 30; i += 1) {
    rows.push(withMeta({
      risk_id: `RISK-${String(i + 1).padStart(3, '0')}`,
      risk_title: titles[i % titles.length],
      risk_type: ['Operational', 'Security', 'Privacy', 'Compliance', 'Financial', 'AI Governance', 'Vendor'][i % 7],
      control_id: `CTRL-${String(100 + i).padStart(3, '0')}`,
      policy_id: policies[i % policies.length].policy_id,
      owner: ownerGroups[i % ownerGroups.length],
      severity: i % 7 === 0 ? 'Critical' : i % 3 === 0 ? 'High' : 'Medium',
      likelihood: i % 5 === 0 ? 'High' : 'Medium',
      status: i % 4 === 0 ? 'Mitigating' : 'Open',
      linked_ci_ids: `${systems[i % systems.length].ci_id}|${systems[(i + 4) % systems.length].ci_id}`,
      linked_vendor_ids: `${contracts[i % contracts.length].vendor_id}`,
      remediation_due_date: `2026-${String(((i + 6) % 12) + 1).padStart(2, '0')}-28`,
      evidence_required: 'Owner attestation, source extract, and control evidence are required.',
    }, 'GRC', `RISK-${i + 1}`, 'GRC Office', 0.79, i % 5 !== 0));
  }
  return rows;
}

function buildDataset(): Dataset {
  const org = buildOrg();
  const facilitiesBusinessUnits = buildFacilities();
  const systems = buildSystems();
  const vendorsContracts = buildContracts();
  const renewalCalendar = buildRenewals();
  const spendBaseline = buildSpend();
  const policies = buildPolicies();
  const incidents = buildIncidents(systems);
  const problems = buildProblems(systems);
  const changes = buildChanges(systems);
  const relationships = buildRelationships(systems);
  const slas = buildSlas(systems);
  const initiatives = buildInitiatives(systems, vendorsContracts, policies);
  const dataDomains = buildDataDomains(systems);
  const risks = buildRisks(systems, vendorsContracts, policies);

  return {
    org_decision_rights: org,
    facilities_business_units: facilitiesBusinessUnits,
    cmdb_applications_services: systems,
    ci_relationships_dependencies: relationships,
    vendors_contract_inventory: vendorsContracts,
    renewal_calendar: renewalCalendar,
    spend_baseline: spendBaseline,
    policies_procedures: policies,
    incidents,
    problems,
    changes,
    slas,
    initiative_portfolio: initiatives,
    data_domains_stewardship: dataDomains,
    risk_compliance_register: risks,
  };
}

function writeWorkbook(template: EnterpriseContextTemplateWorkbook, rows: Row[], outDir: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa Enterprise Context';
  workbook.created = new Date(GENERATED_AT);
  workbook.modified = new Date(GENERATED_AT);
  workbook.title = `${TENANT.displayName} synthetic ${template.title}`;
  workbook.description = `Synthetic, fictional, non-PHI ${TENANT.displayName} enterprise context. Template version ${ENTERPRISE_CONTEXT_TEMPLATE_VERSION}.`;

  const instructions = workbook.addWorksheet('Instructions');
  instructions.columns = [{ width: 28 }, { width: 110 }];
  [
    ['Dataset', `${TENANT.displayName} synthetic enterprise context`],
    ['Workbook', template.title],
    ['Rows', String(rows.length)],
    ['Notice', 'Fictional internal enterprise context only. No PHI or patient-identifiable data.'],
    ['Refresh use', 'Use as Week 0 baseline test data for ingestion, validation, quality issue, and retrieval workflows.'],
  ].forEach((row, index) => {
    instructions.getRow(index + 1).values = row;
  });

  const dictionary = workbook.addWorksheet('Data Dictionary');
  dictionary.columns = [
    { header: 'column', key: 'column', width: 32 },
    { header: 'required', key: 'required', width: 12 },
    { header: 'type', key: 'type', width: 12 },
    { header: 'description', key: 'description', width: 80 },
    { header: 'example', key: 'example', width: 40 },
  ];
  template.columns.forEach((column) => dictionary.addRow({
    column: column.key,
    required: column.required ? 'yes' : 'no',
    type: column.type,
    description: column.description,
    example: column.example,
  }));

  const data = workbook.addWorksheet('Data', { views: [{ state: 'frozen', ySplit: 1 }] });
  const columns = template.columns.map((column) => column.key);
  data.addRow(columns);
  rows.forEach((row) => data.addRow(columns.map((column) => row[column] ?? '')));
  data.columns.forEach((column, index) => {
    const key = columns[index] ?? '';
    column.width = Math.max(14, Math.min(42, key.length + 6));
  });
  data.getRow(1).font = { bold: true };
  data.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  mkdirSync(outDir, { recursive: true });
  return workbook.xlsx.writeFile(path.join(outDir, `${template.filenameBase}.xlsx`));
}

function validate(dataset: Dataset) {
  const systems = new Set(dataset.cmdb_applications_services.map((row) => String(row.ci_id)));
  const vendors = new Set(dataset.vendors_contract_inventory.map((row) => String(row.vendor_id)));
  const contracts = new Set(dataset.vendors_contract_inventory.map((row) => String(row.contract_id)));
  const policies = new Set(dataset.policies_procedures.map((row) => String(row.policy_id)));
  const issues: string[] = [];

  for (const row of dataset.ci_relationships_dependencies) {
    if (!systems.has(String(row.from_ci_id))) issues.push(`unknown from_ci_id ${row.from_ci_id}`);
    if (!systems.has(String(row.to_ci_id))) issues.push(`unknown to_ci_id ${row.to_ci_id}`);
  }
  for (const row of dataset.vendors_contract_inventory) {
    if (!vendors.has(String(row.vendor_id))) issues.push(`unknown vendor ${row.vendor_id}`);
  }
  for (const row of dataset.renewal_calendar) {
    if (!vendors.has(String(row.vendor_id))) issues.push(`unknown renewal vendor ${row.vendor_id}`);
    if (!contracts.has(String(row.contract_id))) issues.push(`unknown renewal contract ${row.contract_id}`);
  }
  for (const row of [...dataset.incidents, ...dataset.problems, ...dataset.changes, ...dataset.slas]) {
    if (row.ci_id && !systems.has(String(row.ci_id))) issues.push(`unknown ci_id ${row.ci_id}`);
  }
  for (const row of dataset.initiative_portfolio) {
    String(row.dependent_ci_ids).split('|').forEach((ci) => {
      if (ci && !systems.has(ci)) issues.push(`unknown initiative CI ${ci}`);
    });
    String(row.dependent_contract_ids).split('|').forEach((contract) => {
      if (contract && !contracts.has(contract)) issues.push(`unknown initiative contract ${contract}`);
    });
    String(row.policy_constraints).split('|').forEach((policy) => {
      if (policy && !policies.has(policy)) issues.push(`unknown initiative policy ${policy}`);
    });
  }

  return issues;
}

async function main() {
  const outRoot = process.argv.find((arg) => arg.startsWith('--out='))?.split('=')[1] ?? TENANT.defaultOutRoot;
  const dataset = buildDataset();
  const validationIssues = validate(dataset);
  if (validationIssues.length) {
    throw new Error(`Synthetic dataset validation failed: ${validationIssues.slice(0, 10).join('; ')}`);
  }

  mkdirSync(outRoot, { recursive: true });

  for (const template of ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS) {
    const rows = dataset[template.key];
    if (!rows) throw new Error(`No synthetic rows for ${template.key}`);
    const columns = template.columns.map((column) => column.key);
    writeFileSync(path.join(outRoot, `${template.filenameBase}.csv`), toCsv(rows, columns));
    await writeWorkbook(template, rows, outRoot);
  }

  const manifest = {
    tenantKey: TENANT.tenantKey,
    tenantSlug: TENANT.tenantSlug,
    displayName: TENANT.displayName,
    generatedAt: GENERATED_AT,
    fictional: true,
    noPhi: true,
    seed: `${TENANT.tenantKey}-enterprise-context-v1`,
    templateVersion: ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
    workbookCount: ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.length,
    totalRows: Object.values(dataset).reduce((sum, rows) => sum + rows.length, 0),
    validation: { unresolvedReferences: validationIssues.length },
    datasets: ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map((template) => ({
      key: template.key,
      title: template.title,
      csv: `${template.filenameBase}.csv`,
      xlsx: `${template.filenameBase}.xlsx`,
      rows: dataset[template.key].length,
      columns: template.columns.map((column) => column.key),
    })),
  };
  writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ tenant: TENANT.tenantKey, totalRows: manifest.totalRows, workbookCount: manifest.workbookCount }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
