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

// ─── ARCTURUS FINANCIAL GROUP ─────────────────────────────────────────────────

const ARCTURUS_GENERAL: ClientDataset = {
  client: 'Arcturus Financial Group',
  solution: 'all',
  as_of: '2024-Q4',
  systems: {
    overview: {
      aum_gbp: 180000000000,
      staff: 4200,
      offices: ['London', 'Dublin', 'Singapore', 'New York']
    },
    core_financial_systems: {
      bloomberg_terminal: {
        seats: 340,
        annual_cost_gbp: 8400000
      },
      bloomberg_aim: {
        description: 'Asset & Investment Management platform',
        years_in_production: 28,
        customizations_total: 14,
        customizations_portable: 6,
        customizations_bloomberg_only: 8,
        bloomberg_only_note: 'Proprietary hooks — cannot migrate without rebuild',
        rebuild_cost_estimate_gbp: { min: 12000000, max: 18000000 },
        annual_maintenance_gbp: 2100000
      },
      murex: {
        product: 'Murex 3.1 (derivatives trading)',
        deployment: 'on-premise',
        eol: '2026-12',
        upgrade_cost_gbp: 4800000,
        upgrade_status: 'deferred twice'
      },
      charles_river_ims: {
        product: 'Charles River IMS (portfolio management)',
        deployment: 'on-premise (cloud version available)',
        years_old: 6,
        migration_status: 'not yet migrated'
      },
      simcorp_dimension: {
        product: 'SimCorp Dimension (fund accounting)',
        version: '6.2 (2 major versions behind)',
        upgrade_cost_gbp: 3200000,
        upgrade_status: 'in budget planning'
      },
      fis_gl: {
        product: 'FIS general ledger',
        deployment: 'on-premise',
        custom_integrations: 34,
        integration_type: 'point-to-point (no enterprise service bus)'
      }
    },
    data_warehouse: {
      primary: {
        platform: 'Teradata 16.20',
        deployment: 'on-premise',
        size_tb: 340,
        workloads: ['risk', 'portfolio', 'regulatory reporting'],
        daily_queries: 847,
        queries_exceeding_sla_pct: 23,
        sla_target_seconds: 30,
        actual_avg_seconds: 47,
        annual_cost_gbp: 4200000,
        contract_renewal: '2026-Q3'
      },
      secondary: {
        platform: 'Netezza 7.2 (IBM PureData)',
        deployment: 'on-premise',
        eol: '2019 (IBM ended support)',
        eol_status: 'RUNNING UNSUPPORTED — no security patches since 2019',
        size_tb: 87,
        workloads: ['historical trade data', 'compliance archive'],
        compliance_reports_only_source: 3,
        migration_cost_estimate_gbp: 6800000,
        migration_status: 'deferred 4 times'
      },
      data_marts: {
        count: 14,
        departments: { risk: 4, finance: 3, compliance: 3, operations: 4 },
        master_data_management: false,
        conflicting_metrics: 'AUM calculated differently in 3 separate marts'
      }
    },
    analytics: {
      primary: {
        tool: 'Tableau Server',
        workbooks: 1240,
        active_users_monthly: 680,
        direct_teradata_connections: 340,
        annual_cost_gbp: 680000
      },
      legacy: {
        tool: 'MicroStrategy',
        reports_in_production: 340,
        developers: 3,
        new_development_since: 2021,
        decommission_planned: '2023 (still running 2026)'
      },
      shadow: {
        tool: 'Power BI',
        workspaces: 47,
        governance: 'none',
        content_duplication_pct: 60
      }
    },
    etl: {
      primary: {
        tool: 'Informatica PowerCenter',
        deployment: 'on-premise',
        production_mappings: 89,
        avg_mapping_age_years: 11,
        mappings_documented: 34,
        developers: 3,
        developer_risks: [
          '1 retiring Q3 2026',
          '1 contractor expiring Q4 2026',
          'No knowledge transfer plan'
        ]
      },
      secondary: {
        tool: 'Ab Initio',
        production_graphs: 23,
        workloads: ['risk', 'compliance'],
        global_experts: 2,
        annual_cost_gbp: 1100000,
        vendor_roadmap: 'limited investment'
      },
      real_time: {
        tool: 'IBM MQ + custom Java',
        feeds: 14,
        avg_age_years: 9,
        monitoring: 'none — failures discovered reactively',
        p1_incidents_last_12mo: 3
      }
    },
    ai_portfolio: {
      models_in_production: 14,
      documented_roi: 0,
      models_with_monitoring: 0,
      deployment_method: 'manual from notebooks',
      mlops_platform: 'NONE',
      model_registry: 'Excel spreadsheet',
      total_annual_ai_spend_gbp: 94000000,
      spend_breakdown_gbp: {
        bloomberg_aim: 8400000,
        vendor_ai_tools_14_platforms: 31000000,
        internal_ai_team: 12000000,
        consulting_for_ai_strategy: 42000000
      },
      consulting_outcome: '3 engagements, 0 with deployed outcome',
      documented_roi_gbp: 0,
      key_models: [
        {
          name: 'Credit Scoring Model',
          built: 2019,
          technology: 'Logistic regression, Python',
          last_retrained: 'NEVER — never retrained since 2019',
          daily_decisions_powered: 340,
          risk: 'HIGH — stale model, data drift undetected, powers live credit decisions'
        },
        {
          name: 'Trade Surveillance Anomaly Detection',
          built: 2021,
          technology: 'Isolation forest, scikit-learn',
          criticality: 'compliance-critical',
          last_validation_months_ago: 18,
          false_positive_rate: 'unknown — not tracked'
        },
        {
          name: 'Bloomberg AIM Price Prediction',
          built: 2022,
          technology: 'Linear regression on Bloomberg data',
          users: 12,
          accuracy: 'self-reported — not independently validated'
        }
      ]
    }
  },
  financials: {
    ci_ratio_pct: 71,
    ci_ratio_target_pct: 58,
    efficiency_gap_gbp: 840000000,
    revenue_gbp: 2800000000,
    technology_spend_pct_revenue: 4.2,
    technology_spend_pct_vs_peer: '35% above peer median',
    consulting_spend_gbp: 42000000,
    ai_spend_gbp: 94000000,
    ai_documented_roi_gbp: 0,
    bloomberg_spend_gbp: 8400000,
    netezza_migration_deferred_gbp: 6800000
  },
  genome_patterns: [
    { code: 'F001', confidence: 0.94, description: '14 models live, zero monitored. Credit scoring model never retrained since 2019, powers 340 daily credit decisions.' },
    { code: 'F002', confidence: 0.89, description: 'No named AI executive sponsor. 3 consulting engagements, all stalled. No CDO.' },
    { code: 'F003', confidence: 0.82, description: 'Vendor lock-in preventing modernization — Bloomberg 8 proprietary hooks, Netezza 3 undocumented compliance reports.' },
    { code: 'F006', confidence: 0.78, description: 'Repeated cloud migration failure — same root cause each time (lift-and-shift, no cloud-native redesign).' },
    { code: 'F008', confidence: 0.91, description: '$94M AI spend, $0 documented ROI. Highest confidence pattern match in Genome.' },
    { code: 'F011', confidence: 0.74, description: '47 ungoverned Power BI workspaces. AUM calculated differently in 3 data marts.' }
  ],
  key_risks: [
    'Netezza running UNSUPPORTED since 2019 — 3 compliance reports have NO alternative source',
    'Credit scoring model never retrained since 2019 — powering 340 daily credit decisions with potential data drift',
    'Informatica: 2 of 3 developers leaving by Q4 2026 — 55 of 89 mappings undocumented',
    'Murex EOL December 2026 — $4.8M upgrade deferred twice, Basel IV deadline Q1 2027',
    '$94M AI spend with $0 documented ROI — portfolio must be rationalized before adding new initiatives',
    'Bloomberg AIM: 8 proprietary customizations cannot migrate — rebuild $12-18M'
  ],
  cloud_history: [
    { year: 2020, initiative: 'Azure Enterprise Agreement — Cloud Strategy', outcome: 'DEV/TEST only — no production workloads moved', cost: '$12M savings business case, not realized' },
    { year: 2021, initiative: 'Teradata to Azure Synapse POC', outcome: 'FAILED — latency unacceptable for real-time risk. Real issue: lift-and-shift, no redesign', cost: '$2.1M Big 4 consulting' },
    { year: 2022, initiative: 'Hybrid cloud pivot — analytics to Azure', outcome: 'PARTIAL — 3 non-critical data marts moved. Teradata still primary', cost: 'Ongoing' },
    { year: 2023, initiative: 'Bloomberg AIM cloud evaluation', outcome: 'REJECTED — 8 proprietary customizations cannot migrate', cost: '$840K assessment' },
    { year: 2025, initiative: 'Netezza to Azure Synapse migration (ACTIVE)', outcome: 'In progress — vendor Cognizant selected. 3 compliance reports with undocumented source logic = high risk', cost: '$6.8M budget' }
  ]
}

// ─── Delivery-specific overlay for Arcturus ────────────────────────────────────

const ARCTURUS_DELIVERY: ClientDataset = {
  ...ARCTURUS_GENERAL,
  solution: 'delivery',
  systems: {
    ...ARCTURUS_GENERAL.systems,
    consulting_register: {
      total_annual_spend_gbp: 42000000,
      vendors: [
        { name: 'Wipro', annual_gbp: 18000000, kt_score_pct: 15, velocity_delivered_pct: 58, knowledge_risk: 'CRITICAL' },
        { name: 'Google PSO', annual_gbp: 8400000, status: 'engagement ended', mlops_knowledge_retained: 0, note: 'MLOps design knowledge entirely with Google' },
        { name: 'Bloomberg LP', annual_gbp: 8400000, customizations: 14, proprietary_hooks: 8, note: 'Internal team cannot govern AIM without Bloomberg support' },
        { name: 'Various contractors', annual_gbp: 7200000, count: 34, note: 'Contractor ratio 47% across 14 squads' }
      ],
      squads: [
        { name: 'OMS Core', cycle_time_days: 127, benchmark_days: 94, status: '35% above benchmark', primary_blocker: 'Bloomberg release window dependency', primary_vendor: 'Bloomberg/Wipro' },
        { name: 'CRM', cycle_time_days: 94, benchmark_days: 94, status: 'at benchmark' },
        { name: 'Risk Analytics', cycle_time_days: 61, benchmark_days: 94, status: 'BELOW benchmark — strong' },
        { name: 'AI/ML Platform', deployments_12mo: 0, annual_spend_gbp: 1800000, status: 'ZERO deployments in 12 months' }
      ],
      programme: {
        name: 'Project Arcturus-1',
        budget_overrun_pct: 34,
        delay_days: 67,
        root_cause_patterns: ['F002 (no executive sponsor)', 'F006 (velocity decay)']
      }
    }
  }
}

// ─── Lookup function ──────────────────────────────────────────────────────────

export function getClientDataset(clientId: string, solution: string): ClientDataset | null {
  if (clientId === 'meridian') {
    if (solution === 'tech') return MERIDIAN_TECH
    return MERIDIAN_GENERAL
  }
  if (clientId === 'arcturus') {
    if (solution === 'delivery') return ARCTURUS_DELIVERY
    return ARCTURUS_GENERAL
  }
  return null
}
