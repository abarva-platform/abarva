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
      reality: '$94M committed to AI. 0 initiatives with documented baselines. 14 stalled. 2 cancelled. $0 verified ROI.',
      source: 'Annual Report 2024 vs CFO data upload',
      severity: 'high' as const,
    },
    {
      id: 'c2',
      claim: 'Annual Report: "Salesforce FSC delivering client experience transformation"',
      reality: '44% adoption after 18 months and $38M investment. NPS 31 vs industry median 58. Adoption has been flat at 44% for 3 consecutive quarters. CIO privately reset the adoption target from 85% to 70% — board not informed.',
      source: 'Annual Report 2024 vs CTO data upload + adoption trajectory data',
      severity: 'high' as const,
    },
    {
      id: 'c3',
      claim: 'Annual Report: CIR target 58% by 2027',
      reality: 'CIR has worsened every year for 4 consecutive years (66%→67%→69%→71%). No credible cost-reduction programme exists. IT budget $178M above peer benchmark. CFO stated in March 2026 board pack: "the CIR trajectory is the most pressing strategic issue" — not the commitment the Annual Report communicates.',
      source: 'Annual Report vs CFO board pack March 2026',
      severity: 'critical' as const,
    },
    {
      id: 'c4',
      claim: 'MAS FEAT filing: AI models in production are "fair and explainable"',
      reality: 'Zero models with FEAT-compliant documentation. 4 months overdue. $2.4B Singapore AUM at risk of supervisory action. MAS has indicated supervisory action "under consideration."',
      source: 'MAS FEAT filing vs CTO model inventory',
      severity: 'critical' as const,
    },
    {
      id: 'c5',
      claim: 'CIO: "AI governance established with 28 initiatives in flight"',
      reality: 'CRO has stopped approving new AI deployments. CDO vacant 11 months. 0 of 28 initiatives have documented baselines. 4 of those "in flight" initiatives share a single blocker (Salesforce FSC adoption at 44%) — systemic failure, not isolated.',
      source: 'CIO interview vs CRO statement vs CFO data',
      severity: 'high' as const,
    },
    {
      id: 'c6',
      claim: 'Head of Technology Michael Santos was recruited to lead Bloomberg AIM modernisation',
      reality: 'Santos was the Accenture partner who led Project Aurora (Phase 3 of Bloomberg AIM modernisation) in 2022–2023, which failed at a cost of $11.2M. He was recruited after the failure to fix what he helped build. The board approved his hire without this context being surfaced.',
      source: 'LinkedIn history vs Project Aurora post-mortem',
      severity: 'high' as const,
    },
    {
      id: 'c7',
      claim: 'CFO: "We know our IT costs and they are being managed"',
      reality: 'Shadow IT estimated at $18M annually — ungoverned SaaS across business units. 3 business units have direct procurement authority for technology with no IT review gate. IT budget grew 12% year-on-year while revenue grew 2.5%.',
      source: 'CFO interview vs IT spend audit vs shadow IT estimate',
      severity: 'high' as const,
    },
    {
      id: 'c8',
      claim: 'Bloomberg contract: platform "meets all performance and integration requirements"',
      reality: 'SEC requires daily stress testing — Aladdin runs monthly. Bloomberg API rate limits (500 calls/hour) are 100x below what ML inference requires. Bloomberg AIM data exports are missing 38% of fields required for trade cost analysis AI. Three consecutive modernisation attempts failed at combined cost of $22.2M. Contract auto-renews December 2026 with no API improvement terms.',
      source: 'Bloomberg contract vs SEC Rule 18f-4 vs AI initiative post-mortems',
      severity: 'critical' as const,
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
