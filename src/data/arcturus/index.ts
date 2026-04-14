export { arcturusFinancials } from './financials'
export { arcturusTechnology } from './technology'
export { arcturusLeadership } from './leadership'
export { arcturusRegulatory } from './regulatory'
export { arcturusIndustry } from './industry'

import { arcturusFinancials } from './financials'
import { arcturusTechnology } from './technology'
import { arcturusLeadership } from './leadership'
import { arcturusRegulatory } from './regulatory'
import { arcturusIndustry } from './industry'

export const arcturusFinancial = {
  org: {
    id: 'arcturus',
    name: 'Arcturus Financial Group',
    vertical: 'Asset Management',
    revenue: 16.2,        // $B
    aum: 840,             // $B
    employees: 13000,
    region: 'Global',
    status: 'setup' as const,
    engagementStart: '2026-04-02',
    maestro: 'Lead Maestro',
  },

  financials: arcturusFinancials,
  technology: arcturusTechnology,
  regulatory: arcturusRegulatory,
  leadership: arcturusLeadership,
  industry: arcturusIndustry,

  contradictions: [
    {
      id: 'c1',
      claim: 'CEO: "We are committed to becoming AI-native"',
      reality: '$94M committed to AI, 0 initiatives with documented baselines or outcome tracking.',
      source: 'Annual Report 2024 vs CFO data upload',
      severity: 'high' as const,
    },
    {
      id: 'c2',
      claim: 'Annual Report: "Salesforce FSC delivering client experience transformation"',
      reality: '44% adoption, NPS 31 (vs industry median 58), $38M invested.',
      source: 'Annual Report 2024 vs CTO data upload',
      severity: 'high' as const,
    },
    {
      id: 'c3',
      claim: 'CIR target 58% by 2027 stated in Annual Report',
      reality: 'No credible cost-reduction programme. IT budget 35% above peers. No CDO to govern AI efficiency initiatives.',
      source: 'Annual Report vs CFO/CTO data',
      severity: 'medium' as const,
    },
    {
      id: 'c4',
      claim: 'MAS FEAT: "AI models in production are fair and explainable"',
      reality: 'Zero models with FEAT-compliant documentation. MAS supervisory action under consideration.',
      source: 'MAS FEAT filing vs CTO model inventory',
      severity: 'critical' as const,
    },
    {
      id: 'c5',
      claim: 'CIO: "AI governance established with 28 initiatives in flight"',
      reality: 'CRO has stopped approving new AI deployments. CDO vacant 11 months. 0 of 28 initiatives have documented baselines.',
      source: 'CIO interview vs CRO statement vs CFO data',
      severity: 'high' as const,
    },
  ],

  situationMetrics: [
    {
      label: 'Cost-to-Income Ratio',
      value: '71%',
      benchmark: '61% peer median',
      status: 'critical' as const,
      gap: '$840M efficiency gap',
    },
    {
      label: 'AI Initiatives with Baselines',
      value: '0 of 28',
      benchmark: '100% expected',
      status: 'critical' as const,
      gap: '$94M with no tracked ROI',
    },
    {
      label: 'MAS FEAT Compliance',
      value: 'Overdue 4 months',
      benchmark: 'December 2025 deadline',
      status: 'critical' as const,
      gap: '$2.4B Singapore AUM at risk',
    },
    {
      label: 'CDO Role',
      value: 'Vacant 11 months',
      benchmark: 'Filled',
      status: 'critical' as const,
      gap: '14 of 28 AI initiatives blocked',
    },
    {
      label: 'Client Portal Adoption',
      value: '44%',
      benchmark: '78% industry median',
      status: 'warning' as const,
      gap: '$38M investment at risk',
    },
    {
      label: 'Data Reporting Lag',
      value: '3 days',
      benchmark: 'Real-time (industry expectation)',
      status: 'warning' as const,
      gap: '14 siloed systems, no golden record',
    },
    {
      label: 'AI Maturity Score',
      value: '28 / 100',
      benchmark: '54 peer median',
      status: 'warning' as const,
      gap: '26 points below peer median',
    },
    {
      label: 'IT Budget vs Peers',
      value: '4.2% of revenue',
      benchmark: '3.1% peer benchmark',
      status: 'warning' as const,
      gap: '$178M above peer benchmark annually',
    },
  ],
}
