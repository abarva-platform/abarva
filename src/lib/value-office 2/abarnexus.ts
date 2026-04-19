export type AbarNexusSourceTier = 'client_required' | 'free_now' | 'premium_later'

import type { AbarNexusProvenance } from './types'

export interface AbarNexusSource {
  id: string
  name: string
  tier: AbarNexusSourceTier
  category: 'business' | 'financial' | 'workflow' | 'it' | 'benchmark' | 'labor' | 'market' | 'regulatory' | 'technographic' | 'research'
  delivery: 'manual_input' | 'extract_upload' | 'scheduled_feed' | 'direct_api' | 'data_share'
  applies_to: Array<'all' | 'healthcare' | 'financial services' | 'retail'>
  description: string
  why_it_matters: string
  source_url?: string
}

export const ABARNEXUS_SOURCES: AbarNexusSource[] = [
  {
    id: 'client-finance',
    name: 'Client financial data',
    tier: 'client_required',
    category: 'financial',
    delivery: 'extract_upload',
    applies_to: ['all'],
    description: 'P&L, budgets, labor costs, vendor spend, business unit economics, and baseline cost structures.',
    why_it_matters: 'Without this, value claims cannot become trusted ROI or capacity statements.',
  },
  {
    id: 'client-workflow',
    name: 'Client workflow baselines',
    tier: 'client_required',
    category: 'workflow',
    delivery: 'extract_upload',
    applies_to: ['all'],
    description: 'Cycle times, volumes, ticket flows, request categories, staffing, exception rates, and current-state KPIs.',
    why_it_matters: 'This is the proof layer for whether a use case is genuinely measurable.',
  },
  {
    id: 'client-it-estate',
    name: 'Client IT and AI estate',
    tier: 'client_required',
    category: 'it',
    delivery: 'manual_input',
    applies_to: ['all'],
    description: 'Systems in scope, tool owners, current AI platforms, governance controls, and integration realities.',
    why_it_matters: 'The agent can only recommend credible solution patterns if it knows the actual operating environment.',
  },
  {
    id: 'sec-edgar',
    name: 'SEC EDGAR / XBRL',
    tier: 'free_now',
    category: 'financial',
    delivery: 'direct_api',
    applies_to: ['all', 'financial services', 'retail'],
    description: 'Public-company filings, company facts, risk factors, segment disclosures, and management commentary.',
    why_it_matters: 'Gives external financial truth and strategic context for public-company clients and vendors.',
    source_url: 'https://www.sec.gov/edgar/sec-api-documentation',
  },
  {
    id: 'fred',
    name: 'FRED macro data',
    tier: 'free_now',
    category: 'benchmark',
    delivery: 'direct_api',
    applies_to: ['all'],
    description: 'Rates, inflation, macro indicators, credit conditions, and historical economic series.',
    why_it_matters: 'Improves timing, business-case assumptions, and external context for transformation bets.',
    source_url: 'https://fred.stlouisfed.org/docs/api/fred/',
  },
  {
    id: 'bls',
    name: 'BLS labor and productivity',
    tier: 'free_now',
    category: 'labor',
    delivery: 'direct_api',
    applies_to: ['all'],
    description: 'Employment cost, compensation, productivity, wage, and labor mix benchmarks.',
    why_it_matters: 'Makes workforce-productivity and capacity-recovery claims more defensible.',
    source_url: 'https://www.bls.gov/productivity/sources/',
  },
  {
    id: 'census',
    name: 'U.S. Census economic data',
    tier: 'free_now',
    category: 'benchmark',
    delivery: 'direct_api',
    applies_to: ['all', 'financial services', 'retail'],
    description: 'Economic Census, Quarterly Services, and annual business-survey statistics.',
    why_it_matters: 'Adds industry shape, payroll, revenue, and service-sector benchmarking.',
    source_url: 'https://www.census.gov/programs-surveys/economic-census/data/api.html',
  },
  {
    id: 'onet',
    name: 'O*NET skills and task library',
    tier: 'free_now',
    category: 'labor',
    delivery: 'direct_api',
    applies_to: ['all'],
    description: 'Occupations, tasks, skills, role families, and work activity structure.',
    why_it_matters: 'Helps break fuzzy “future of work” ideas into concrete workflows and roles.',
    source_url: 'https://services.onetcenter.org/about',
  },
  {
    id: 'cms-open-data',
    name: 'CMS open healthcare data',
    tier: 'free_now',
    category: 'regulatory',
    delivery: 'direct_api',
    applies_to: ['healthcare'],
    description: 'Provider, quality, utilization, and Medicare-related public datasets.',
    why_it_matters: 'Strengthens healthcare quality, performance, and benchmark context.',
    source_url: 'https://developer.cms.gov/data-cms/',
  },
  {
    id: 'clinicaltrials',
    name: 'ClinicalTrials.gov',
    tier: 'free_now',
    category: 'research',
    delivery: 'direct_api',
    applies_to: ['healthcare'],
    description: 'Trial portfolios, research activity, sponsor context, and operational signals.',
    why_it_matters: 'Useful for research-admin and academic-medicine use cases.',
    source_url: 'https://clinicaltrials.gov/data-api',
  },
  {
    id: 'nih-reporter',
    name: 'NIH RePORTER',
    tier: 'free_now',
    category: 'research',
    delivery: 'direct_api',
    applies_to: ['healthcare'],
    description: 'Research awards, institutions, project funding, and grant portfolios.',
    why_it_matters: 'Supports grant, research-ops, and mission-impact use cases in healthcare and academia.',
    source_url: 'https://api.reporter.nih.gov/',
  },
  {
    id: 'fdic',
    name: 'FDIC BankFind',
    tier: 'free_now',
    category: 'regulatory',
    delivery: 'direct_api',
    applies_to: ['financial services'],
    description: 'Public bank institution and branch information for regulated banking contexts.',
    why_it_matters: 'Improves regulated-finance context for bank-oriented use cases.',
    source_url: 'https://api.fdic.gov/banks/docs',
  },
  {
    id: 'usaspending',
    name: 'USAspending',
    tier: 'free_now',
    category: 'market',
    delivery: 'direct_api',
    applies_to: ['all', 'healthcare'],
    description: 'Federal awards, grants, recipients, and public spending records.',
    why_it_matters: 'Useful when public funding exposure, grants, or agency relationships matter.',
    source_url: 'https://api.usaspending.gov/',
  },
  {
    id: 'lightcast',
    name: 'Lightcast',
    tier: 'premium_later',
    category: 'labor',
    delivery: 'data_share',
    applies_to: ['all'],
    description: 'Labor market intelligence, skills, job titles, and hiring-demand signals.',
    why_it_matters: 'Strong paid add-on if workforce design or role/skills matching becomes core to the product.',
    source_url: 'https://docs.lightcast.io/lightcast-api/docs/free-api-access',
  },
  {
    id: 'hg-insights',
    name: 'HG Insights',
    tier: 'premium_later',
    category: 'technographic',
    delivery: 'data_share',
    applies_to: ['all', 'financial services', 'retail'],
    description: 'Technographics, installed products, spend signals, and market account intelligence.',
    why_it_matters: 'Useful if AbarNexus later needs technographic comparisons across enterprise estates.',
    source_url: 'https://hginsights.com/pricing',
  },
  {
    id: 'pitchbook',
    name: 'PitchBook',
    tier: 'premium_later',
    category: 'market',
    delivery: 'data_share',
    applies_to: ['financial services', 'retail'],
    description: 'Private/public company, investor, funding, and deal data.',
    why_it_matters: 'Relevant only when market/comparable-company intelligence becomes a paid differentiator.',
    source_url: 'https://pitchbook.com/pricing',
  },
  {
    id: 'cb-insights',
    name: 'CB Insights',
    tier: 'premium_later',
    category: 'market',
    delivery: 'data_share',
    applies_to: ['all'],
    description: 'Private-company, market, relationship, and AI-derived landscape intelligence.',
    why_it_matters: 'Potentially useful later for vendor and market sensing, but likely enterprise-priced.',
    source_url: 'https://www.cbinsights.com/what-we-offer/pricing/',
  },
]

export function getAbarNexusSourcesForVertical(vertical: string) {
  const normalized = vertical.trim().toLowerCase()
  return ABARNEXUS_SOURCES.filter(source => (
    source.applies_to.includes('all') ||
    source.applies_to.includes(normalized as 'healthcare' | 'financial services' | 'retail')
  ))
}

export function getAbarNexusRoadmap() {
  return [
    {
      phase: 'now',
      title: 'Free-now benchmark layer',
      description: 'Use client truth plus official public datasets to make the agent sharper without adding subscription burden.',
    },
    {
      phase: 'next',
      title: 'Client evidence operating layer',
      description: 'Normalize finance, workflow, AI-estate, and telemetry extracts into reusable Value Office objects.',
    },
    {
      phase: 'later',
      title: 'Premium enrichment plug-ins',
      description: 'Add labor, technographic, and market-intelligence subscriptions only where they materially improve recommendations.',
    },
  ]
}

export function buildAbarNexusProvenance(args: {
  vertical: string
  datasetSummary?: string[]
  missingData?: string[]
  hasRetrievedContext?: boolean
}): AbarNexusProvenance {
  const { vertical, datasetSummary = [], missingData = [], hasRetrievedContext = false } = args
  const relevant = getAbarNexusSourcesForVertical(vertical)
  const clientTruth = relevant
    .filter(source => source.tier === 'client_required')
    .slice(0, 4)
    .map(source => source.name)

  const publicBenchmarks = relevant
    .filter(source => source.tier === 'free_now')
    .slice(0, 5)
    .map(source => source.name)

  const patternMemory = [
    'AbarVa client intelligence profile',
    ...(datasetSummary.length ? ['Seeded client datasets and prior engagement patterns'] : []),
    ...(hasRetrievedContext ? ['Retrieved vertical benchmark context from the AbarVa knowledge corpus'] : []),
  ]

  return {
    client_truth: clientTruth,
    public_benchmarks: publicBenchmarks,
    pattern_memory: patternMemory,
    assumptions: missingData.length
      ? missingData
      : ['Missing-data items are not fully captured yet; evidence and baseline gaps still require refinement.'],
  }
}
