/**
 * Client dataset knowledge base — structured context for AI system prompts.
 * Loaded by the message route to give Maestro AI specific knowledge of each
 * client's technology landscape, financials, and confirmed genome matches.
 *
 * When Pinecone is wired in (add PINECONE_API_KEY), replace getClientDataset()
 * with a semantic retrieval call using the same return shape.
 */

export interface ClientDataset {
  client: string
  solution: string
  as_of: string
  systems: Record<string, any>
  financials?: Record<string, any>
  genome_patterns: Array<{ code: string; confidence: number; description: string }>
  key_risks: string[]
  cloud_history?: Array<{ year: number; initiative: string; outcome: string; cost?: string }>
}

// ─── MERIDIAN HEALTH SYSTEM ───────────────────────────────────────────────────

const MERIDIAN_TECH: ClientDataset = {
  client: 'Meridian Health System',
  solution: 'Technology Modernization',
  as_of: '2024-Q4',
  systems: {
    ehr: {
      vendor: 'Epic',
      version: 'Epic 2020 (2 versions behind current)',
      modules_live: ['Inpatient', 'Ambulatory', 'Emergency', 'Cadence scheduling', 'Prelude registration'],
      modules_deferred: ['Epic Cosmos (deferred 2023 budget cut)'],
      clarity: {
        description: 'Epic reporting database',
        size_tb: 14,
        refresh: 'nightly',
        analytical_lag_days: 4,
        note: '4-day lag on complex population health queries'
      },
      caboodle: {
        description: 'Epic dimensional model',
        subject_areas_built: 6,
        subject_areas_total: 14,
        complete: ['Clinical', 'Scheduling', 'Billing'],
        incomplete: ['Population health', 'Quality measures', 'Research']
      },
      direct_odbc_connections: 47,
      odbc_risk: 'Bypasses Caboodle entirely — creates schema dependency risk on every Epic upgrade'
    },
    analytics: {
      primary: {
        tool: 'Tableau Server 2021.4',
        deployment: 'on-premise Windows Server 2019',
        workbooks_published: 847,
        active_users_monthly: 340,
        direct_clarity_connections: 89,
        clarity_connection_risk: 'ALL 89 workbooks will break on next Epic upgrade',
        annual_cost_usd: 340000,
        tableau_prep_users: 6,
        note: 'No enterprise standardization of Tableau Prep'
      },
      shadow_bi: {
        tool: 'Microsoft Power BI',
        workspaces: 23,
        governance: 'none',
        departments: ['Finance', 'HR'],
        content_duplication_pct: 40
      },
      legacy: {
        tool: 'Crystal Reports',
        reports_in_production: 156,
        mission_critical: 12,
        mission_critical_types: ['Regulatory', 'Billing'],
        developers_who_can_maintain: 0,
        server: 'Windows Server 2012 R2',
        server_eol: '2023-10 (2 years past EOL)'
      }
    },
    etl_pipelines: {
      primary: {
        tool: 'Informatica PowerCenter 10.2',
        deployment: 'on-premise',
        production_mappings: 14,
        developers: 2,
        developer_risk: '1 retiring Q2 2026 — no knowledge transfer plan',
        mappings_undocumented: 6,
        avg_pipeline_age_years: 7.3,
        real_time_capability: false,
        batch_schedule: 'nightly only'
      },
      secondary: {
        tool: 'SSIS (SQL Server Integration Services)',
        packages_in_production: 34,
        ownership: 'mixed IT and business analysts',
        packages_no_version_control: 18,
        dependencies_documented: false
      },
      emerging: {
        tool: 'Azure Data Factory',
        status: 'pilot — non-critical only',
        pipelines_in_production: 3,
        pipelines: ['Claims Management → Azure SQL', 'HR data → Power BI', 'Vendor invoices → Finance'],
        governance: 'none'
      },
      real_time_capability: 'NONE — all pipelines are nightly batch. Clinical alerting runs on Epic in-database triggers not integrated with analytics.'
    },
    data_warehouse: {
      primary: {
        platform: 'SQL Server 2017',
        deployment: 'on-premise',
        eol: '2025-10',
        eol_status: 'CURRENTLY RUNNING UNPATCHED',
        total_size_tb: 47,
        databases: ['Clinical', 'Financial', 'Operational'],
        partitioning: 'none — query performance degrading',
        backup: 'tape',
        recovery_time_hours: 48,
        dba_team: '2 people (1 vacancy unfilled 18 months)'
      },
      partial_upgrade: {
        platform: 'SQL Server 2019',
        workloads_migrated_pct: 40,
        status: 'STALLED due to Clarity schema dependencies',
        annual_duplicate_cost_usd: 340000
      },
      cloud: {
        provider: 'Azure',
        azure_sql_databases: 3,
        azure_blob_tb: 14,
        azure_data_factory_pipelines: 3,
        synapse_deployed: false,
        purview_deployed: false,
        annual_spend_usd: 180000,
        finops_governance: false
      }
    },
    ai_initiatives: [
      {
        name: 'Readmission Prediction Model',
        built: 2021,
        status: 'NEVER DEPLOYED — sitting in Jupyter notebook',
        reason_not_deployed: 'No MLOps platform, no deployment pipeline',
        potential_annual_value_usd: 4200000,
        technology: 'Logistic regression, scikit-learn'
      },
      {
        name: 'Sepsis Early Warning',
        vendor: 'Wolters Kluwer',
        status: 'Live in 2 of 6 hospitals only',
        integration: 'Epic in-database alert only — NOT connected to EDW',
        outcome_tracking: 'none',
        annual_cost_usd: 340000,
        roi_documented: false
      },
      {
        name: 'Revenue Cycle AI',
        vendor: 'Waystar',
        status: 'Live — claims scrubbing',
        annual_value_usd: 2100000,
        roi_documented: true,
        note: 'ONLY AI initiative with documented ROI'
      }
    ],
    mlops: 'NONE — no model registry, no deployment pipeline, no monitoring. Data science team: 2 FTEs with no deployment capability.'
  },
  genome_patterns: [
    { code: 'F001', confidence: 0.92, description: 'No MLOps — readmission model built 2021, never deployed. 2 data scientists with no production deployment capability.' },
    { code: 'F002', confidence: 0.88, description: 'No named tech executive sponsor. CTO changed twice in 3 years. No named sponsor on any modernization program.' },
    { code: 'F006', confidence: 0.84, description: 'Repeated failed modernization — 3 failed cloud initiatives 2019-2023, same root cause each time ($2.84M spent, no material outcome).' },
    { code: 'F009', confidence: 0.79, description: 'Legacy maintenance consuming capacity — 4 data engineers maintaining 7-year-old Informatica pipelines.' },
    { code: 'F011', confidence: 0.71, description: 'Shadow BI proliferation — 23 ungoverned Power BI workspaces, no data catalog.' }
  ],
  key_risks: [
    'SQL Server 2017 running UNPATCHED past EOL (Oct 2025) — HIPAA compliance exposure',
    '89 Tableau workbooks will ALL break on next Epic upgrade (direct Clarity connections)',
    '156 Crystal Reports: 12 mission-critical with zero developers who can maintain them',
    'Readmission model: $4.2M annual value locked in a Jupyter notebook since 2021',
    'Informatica developer retiring Q2 2026 — no knowledge transfer plan for 6 undocumented mappings',
    'Sepsis AI live in 2/6 hospitals with no outcome tracking'
  ],
  cloud_history: [
    { year: 2019, initiative: 'Cloud First strategy — Azure selected', outcome: 'STALLED — only 3 pilot workloads moved', cost: '$4.2M business case, not realized' },
    { year: 2021, initiative: 'Epic Clarity migration to Azure SQL', outcome: 'FAILED at 60% — 89 direct Tableau-to-Clarity connections broke, rolled back', cost: '$840K spent' },
    { year: 2022, initiative: 'SQL Server 2019 upgrade (partial)', outcome: 'STALLED at 40% — Informatica compatibility issues', cost: '$620K budget, $340K annual duplicate cost ongoing' },
    { year: 2023, initiative: 'Azure Synapse evaluation (POC)', outcome: 'DEFERRED — "not ready for healthcare". Real cause: no internal expertise, no budget approved', cost: '$180K Big 4 consulting, report only' }
  ]
}

const MERIDIAN_GENERAL: ClientDataset = {
  client: 'Meridian Health System',
  solution: 'all',
  as_of: '2024-Q4',
  systems: {
    overview: {
      staff: 12400,
      clinical_staff: 8200,
      hospitals: 6,
      annual_revenue_usd: 2800000000,
      operating_margin_pct: 3.2
    }
  },
  financials: {
    annual_revenue_usd: 2800000000,
    operating_margin_pct: 3.2,
    operating_margin_target_pct: 6.0,
    margin_gap_usd: 78400000,
    technology_cost_pct_revenue: 4.8,
    consulting_spend_usd: 34000000,
    ai_spend_usd: 4700000,
    ai_documented_roi_usd: 2100000
  },
  genome_patterns: [
    { code: 'F001', confidence: 0.92, description: 'No MLOps infrastructure — readmission model never deployed' },
    { code: 'F002', confidence: 0.88, description: 'No named tech executive sponsor — CTO changed twice in 3 years' },
    { code: 'F006', confidence: 0.84, description: 'Repeated failed modernization — same root cause, $2.84M spent' },
    { code: 'F009', confidence: 0.79, description: 'Legacy maintenance consuming capacity — 7-year-old pipelines' },
    { code: 'F011', confidence: 0.71, description: 'Shadow BI proliferation — 23 ungoverned Power BI workspaces' }
  ],
  key_risks: [
    'SQL Server 2017 unpatched past EOL — HIPAA compliance exposure',
    'Epic upgrade blocked by 89 direct Clarity connections',
    '$4.2M readmission model value locked in Jupyter notebook since 2021'
  ]
}

// ─── Lookup function ──────────────────────────────────────────────────────────

export function getClientDataset(clientId: string, solution: string): ClientDataset | null {
  if (clientId === 'meridian') {
    if (solution === 'tech') return MERIDIAN_TECH
    return MERIDIAN_GENERAL
  }
  return null
}
