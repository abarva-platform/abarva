export interface ClientFinancialProfile {
  clientName: string;
  industryCode: 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL';
  annualRevenueUsd: number;
  itBudgetUsd: number;
  aiBudgetUsd: number;
  employeeCount: number;
  operationalUnits: number;
  businessDescription: string;
}

export const CLIENT_PROFILES: ClientFinancialProfile[] = [
  {
    clientName: 'Meridian Health',
    industryCode: 'HEALTHCARE_IDN',
    annualRevenueUsd: 14_200_000_000,
    itBudgetUsd: 710_000_000,
    aiBudgetUsd: 108_000_000,
    employeeCount: 28_400,
    operationalUnits: 154, // 9 hospitals + 142 clinics + 3 research centers
    businessDescription:
      '$14.2B integrated delivery network · 9 hospitals, 142 outpatient clinics, 3 research centers across 4 Midwest states · Epic EHR · AWS-primary cloud · Snowflake data platform',
  },
  {
    clientName: 'First Capital',
    industryCode: 'FINSERV',
    annualRevenueUsd: 28_000_000_000,
    itBudgetUsd: 2_100_000_000,
    aiBudgetUsd: 180_000_000,
    employeeCount: 34_000,
    operationalUnits: 890, // 890 branches (2,400 ATMs tracked separately)
    businessDescription:
      '$28B regional bank · consumer + commercial + wealth · 890 branches + 2,400 ATMs across 6 East Coast states · Finxact core + legacy · Snowflake + AWS primary',
  },
  {
    clientName: 'Apex Retail',
    industryCode: 'RETAIL',
    annualRevenueUsd: 24_800_000_000,
    itBudgetUsd: 545_000_000,
    aiBudgetUsd: 58_000_000,
    employeeCount: 96_000,
    operationalUnits: 480, // 480 stores (12 DCs tracked separately)
    businessDescription:
      '$24.8B specialty retailer · 96,000 employees · 480 stores across 42 states · $4.6B e-commerce · SAP ECC 6.0 + Salesforce Commerce Cloud + IBM Sterling OMS',
  },
];
