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
    annualRevenueUsd: 18_000_000_000,
    itBudgetUsd: 540_000_000,
    aiBudgetUsd: 58_000_000,
    employeeCount: 72_000,
    operationalUnits: 480, // 480 stores (12 DCs tracked separately)
    businessDescription:
      '$18B omnichannel retailer · 72,000 employees (retail-heavy) · 480 stores + 12 DCs + e-commerce · national US footprint · Shopify Plus + Salesforce Commerce + SAP S/4',
  },
];
