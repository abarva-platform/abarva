export { nexoraFinancials } from './financials'
export { nexoraOperations } from './operations'
export { nexoraTechnology } from './technology'
export { nexoraIndustry } from './industry'

import { nexoraFinancials } from './financials'
import { nexoraOperations } from './operations'
import { nexoraTechnology } from './technology'
import { nexoraIndustry } from './industry'

export const nexoraRetail = {
  org: {
    id: 'nexora',
    name: 'Nexora Retail & Consumer',
    vertical: 'Retail & CPG',
    revenue: 18.4,     // $B
    region: 'Global',
    status: 'setup' as const,
    engagementStart: '2026-04-10',
    maestro: 'Lead Maestro',
  },

  financials: nexoraFinancials,
  technology: nexoraTechnology,
  operations: nexoraOperations,
  industry: nexoraIndustry,

  contradictions: [
    {
      id: 'c1',
      claim: 'Press Release Jan 2026: "$148M AI investment programme expected to deliver material returns by 2027"',
      reality: '8% documented ROI on $148M invested. $12M return. No baselines in place to measure progress toward "material returns".',
      source: 'Press Release vs CFO data upload',
      severity: 'high' as const,
    },
    {
      id: 'c2',
      claim: '10-K: "SAP migration planning is underway"',
      reality: 'SAP R/3 Continental Europe (25% of revenue) hits EOL December 2027. No migration programme initiated, no budget allocated, no SI selected.',
      source: '10-K Risk Factors vs COO data upload',
      severity: 'critical' as const,
    },
    {
      id: 'c3',
      claim: 'CIO: "Einstein AI is a key component of our personalization strategy"',
      reality: 'Einstein licensed for 18 months, $21M spent on license. Not activated. $248M revenue opportunity idle.',
      source: 'CIO investor day vs technology data upload',
      severity: 'critical' as const,
    },
    {
      id: 'c4',
      claim: 'Annual Report: "Inventory management improvements on track"',
      reality: 'o9 at 40% after 18 months. Inventory turns 4.2x vs 6.8x benchmark. $900M excess inventory.',
      source: 'Annual Report vs COO/CIO data',
      severity: 'high' as const,
    },
    {
      id: 'c5',
      claim: 'Board statement: "E-commerce is our growth engine"',
      reality: 'E-commerce running at -2.1% margin. Growing the channel is destroying blended margin.',
      source: 'Board presentation vs CFO channel P&L',
      severity: 'high' as const,
    },
  ],

  situationMetrics: [
    {
      label: 'Operating Margin',
      value: '3.2%',
      benchmark: '5.1% peer median',
      status: 'critical' as const,
      gap: '$610M to target (6.5%)',
    },
    {
      label: 'Einstein AI Activation',
      value: 'Not started (18 months)',
      benchmark: 'Activated',
      status: 'critical' as const,
      gap: '$248M/yr revenue idle, $14M/yr license burning',
    },
    {
      label: 'SAP R/3 EOL',
      value: 'Dec 2027 (20 months)',
      benchmark: 'Migration in progress',
      status: 'critical' as const,
      gap: 'No migration programme started',
    },
    {
      label: 'E-Commerce Margin',
      value: '-2.1%',
      benchmark: '+2.8% peer median',
      status: 'critical' as const,
      gap: 'Growing channel destroying blended margin',
    },
    {
      label: 'Inventory Turns',
      value: '4.2x',
      benchmark: '6.8x benchmark',
      status: 'warning' as const,
      gap: '$900M trapped capital',
    },
    {
      label: 'Shrinkage Rate',
      value: '2.8% ($515M)',
      benchmark: '1.4% industry median',
      status: 'warning' as const,
      gap: '$259M above benchmark annually',
    },
    {
      label: 'AI ROI on Investment',
      value: '8% ($12M on $148M)',
      benchmark: '38% peer median',
      status: 'warning' as const,
      gap: '$44M annual shortfall vs peer ROI rate',
    },
    {
      label: 'ERP Fragmentation',
      value: '6 systems, 0 unified',
      benchmark: '1-2 systems (best practice)',
      status: 'warning' as const,
      gap: '$82M annual cost, AI pipeline blocked',
    },
  ],
}
