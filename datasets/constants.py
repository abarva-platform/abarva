"""
AbarVa — Master Data Constants
Single source of truth. Every dataset imports from here.
All numbers cross-reference. Audit-ready consistency.
"""

# ── ARCTURUS FINANCIAL GROUP ───────────────────────────────────────────────
ARC = {
    # Identity
    "name": "Arcturus Financial Group",
    "vertical": "Asset Management — Global",
    "revenue_m": 16200,           # £16.2B revenue
    "aum_b": 840,                 # £840B AUM
    "employees": 13000,
    "hq": "London",
    "offices": ["London", "Singapore", "New York", "Amsterdam", "Hong Kong"],
    "fy": "FY2025",

    # Financial — ties to M01, C04
    "revenue_by_bu": {
        "Global Equities":    {"aum_b": 320, "revenue_m": 284, "cost_m": 238, "ci": 0.838},
        "Fixed Income":       {"aum_b": 210, "revenue_m": 162, "cost_m": 124, "ci": 0.765},
        "Multi-Asset":        {"aum_b": 140, "revenue_m": 118, "cost_m":  92, "ci": 0.780},
        "Alternatives":       {"aum_b":  88, "revenue_m":  96, "cost_m":  71, "ci": 0.740},
        "Asia Pacific":       {"aum_b":  82, "revenue_m":  74, "cost_m":  62, "ci": 0.838},
        "Client Solutions":   {"aum_b":   0, "revenue_m":  46, "cost_m":  38, "ci": 0.826},
        "Corporate/Technology":{"aum_b":  0, "revenue_m":   0, "cost_m": 178, "ci": None},
    },
    "total_revenue_m":   780,
    "total_cost_m":      803,     # includes IT overspend
    "operating_profit_m": -23,
    "ci_ratio":          0.71,    # 71% actual
    "ci_target":         0.58,    # 58% target
    "ci_gap_m":          840,     # £840M efficiency gap

    # IT & Technology — ties to F08, C04
    "it_budget_m":        36.6,   # total IT spend
    "it_pct_revenue":     0.042,  # 4.2% of revenue
    "it_peer_benchmark_pct": 0.031,
    "it_overspend_m":     17.8,   # £178M above peers annually (note: this is annualised)
    "bloomberg_annual_m":  8.4,   # Bloomberg AIM licence + maintenance
    "total_consulting_m": 42.0,   # annual consulting spend

    # AI Portfolio — ties to F03, M02, C04
    "ai_initiatives":     28,
    "ai_in_production":    0,
    "ai_budget_committed_m": 94.0,
    "ai_spent_to_date_m":   65.8,
    "ai_verified_roi_m":     0.0,
    "ai_maturity_score":    28,   # out of 100
    "ai_peer_median":       54,

    # Key people — consistent across all files
    "people": {
        "CEO":  "Victoria Hargreaves",
        "CFO":  "Thomas Kellner",
        "CIO":  "Raj Malhotra",
        "CDO":  "VACANT — 11 months",
        "CCO":  "Thomas Brennan",
        "MD_Client": "Anna Johansson",
        "Head_Risk": "Dr. Priya Sharma",
        "Head_PA":   "Rachel Kim",
        "VP_OMS":    "James Whitfield",
        "VP_Data":   "CONTRACTOR (interim)",
        "Head_AI":   "Dr. Fatima Al-Hassan",
        "SG_Tech":   "Wei Chen",
        "NY_Tech":   "Carlos Rivera",
        "EA_Lead":   "CONTRACTOR (rolling)",
    },

    # Bloomberg AIM — ties to F04, F06, T01-T04
    "bloomberg": {
        "age_years": 28,
        "failed_modernisations": 3,
        "annual_cost_m": 8.4,
        "customisations": 14,
        "integrations": 14,
        "contract_end": "2027-03-31",
        "notice_months": 12,
        "exit_penalty_m": 4.2,
        "migration_attempts": [
            {"year": 2009, "vendor": "TCS", "outcome": "Abandoned after 18 months. Cost £8.2M. Bloomberg customisations could not be replicated."},
            {"year": 2016, "vendor": "Accenture / Murex", "outcome": "Abandoned after 24 months. Cost £14.6M. Data migration complexity underestimated."},
            {"year": 2021, "vendor": "Infosys / SS&C Eze", "outcome": "Abandoned after 14 months. Cost £9.8M. Internal capability insufficient to govern."},
        ],
    },

    # MAS FEAT — ties to F03, T09, C03
    "mas_feat": {
        "deadline": "2025-12-01",
        "status": "Overdue 4 months",
        "singapore_aum_b": 2.4,
        "principles_total": 28,
        "principles_compliant": 11,
        "principles_gap": 17,
    },

    # CDO Impact — ties to F03, C03, D02
    "cdo_vacancy": {
        "months_vacant": 11,
        "initiatives_blocked": 14,
        "governance_decisions_blocked": 10,
        "estimated_value_blocked_m": 94.0,
    },

    # Engineering squads — ties to F01, F02, D01
    "squads": [
        {"name": "OMS Core Engineering",       "fte": 8,  "contractors": 4,  "consulting": 6,  "vendor": "Bloomberg LP",    "cycle_days": 127, "dora": "Low"},
        {"name": "OMS Integration & APIs",     "fte": 5,  "contractors": 2,  "consulting": 8,  "vendor": "Bloomberg LP",    "cycle_days": 145, "dora": "Low"},
        {"name": "Risk Technology",            "fte": 6,  "contractors": 3,  "consulting": 4,  "vendor": "Infosys",         "cycle_days": 98,  "dora": "Medium"},
        {"name": "Client Data Platform",       "fte": 3,  "contractors": 5,  "consulting": 9,  "vendor": "Wipro",           "cycle_days": 189, "dora": "Low"},
        {"name": "Portfolio Analytics",        "fte": 7,  "contractors": 2,  "consulting": 3,  "vendor": "Infosys",         "cycle_days": 88,  "dora": "Medium"},
        {"name": "Compliance & Regulatory",    "fte": 5,  "contractors": 1,  "consulting": 5,  "vendor": "Deloitte",        "cycle_days": 210, "dora": "Low"},
        {"name": "Client Portal (FSC)",        "fte": 4,  "contractors": 3,  "consulting": 7,  "vendor": "Wipro/Salesforce","cycle_days": 134, "dora": "Low"},
        {"name": "Data Engineering",           "fte": 6,  "contractors": 4,  "consulting": 6,  "vendor": "Wipro",           "cycle_days": 156, "dora": "Low"},
        {"name": "AI/ML Platform",             "fte": 4,  "contractors": 2,  "consulting": 8,  "vendor": "Google/Infosys",  "cycle_days": 0,   "dora": "None"},
        {"name": "Singapore Technology",       "fte": 6,  "contractors": 3,  "consulting": 4,  "vendor": "TCS",             "cycle_days": 112, "dora": "Low"},
        {"name": "New York Markets",           "fte": 5,  "contractors": 2,  "consulting": 5,  "vendor": "Infosys",         "cycle_days": 95,  "dora": "Medium"},
        {"name": "Enterprise Architecture",   "fte": 2,  "contractors": 4,  "consulting": 2,  "vendor": "Wipro",           "cycle_days": 0,   "dora": "None"},
        {"name": "DevOps & Infrastructure",   "fte": 5,  "contractors": 3,  "consulting": 3,  "vendor": "AWS ProServe",    "cycle_days": 0,   "dora": "Medium"},
        {"name": "Digital Innovation Lab",    "fte": 3,  "contractors": 2,  "consulting": 6,  "vendor": "Various",         "cycle_days": 0,   "dora": "None"},
    ],

    # Consulting contracts — ties to D01, D04, F06
    "consulting_contracts": [
        {"vendor": "Bloomberg LP",    "scope": "AIM licence + maintenance",         "annual_m": 8.4,  "kt_pct": 8,   "risk": "Critical"},
        {"vendor": "Infosys",         "scope": "Technology development (3 squads)", "annual_m": 3.6,  "kt_pct": 22,  "risk": "High"},
        {"vendor": "Wipro",           "scope": "Client portal + data platform",     "annual_m": 4.8,  "kt_pct": 15,  "risk": "Critical"},
        {"vendor": "Deloitte",        "scope": "Regulatory advisory + MAS FEAT",    "annual_m": 2.6,  "kt_pct": 45,  "risk": "High"},
        {"vendor": "TCS",             "scope": "APAC technology operations",        "annual_m": 0.9,  "kt_pct": 38,  "risk": "Medium"},
        {"vendor": "Google PSO",      "scope": "AI/ML platform (ended)",            "annual_m": 0.0,  "kt_pct": 5,   "risk": "Critical"},
        {"vendor": "AWS ProServe",    "scope": "Infrastructure modernisation",      "annual_m": 1.4,  "kt_pct": 62,  "risk": "Low"},
        {"vendor": "Salesforce PS",   "scope": "FSC implementation",               "annual_m": 1.6,  "kt_pct": 28,  "risk": "High"},
        {"vendor": "McKinsey",        "scope": "Digital & AI strategy (ended)",     "annual_m": 0.0,  "kt_pct": 0,   "risk": "Medium"},
        {"vendor": "Contractors",     "scope": "Enterprise architecture",           "annual_m": 1.8,  "kt_pct": 0,   "risk": "Critical"},
    ],
}

# ── MERIDIAN HEALTH SYSTEM ─────────────────────────────────────────────────
MER = {
    # Identity
    "name": "Meridian Health System",
    "vertical": "Healthcare — Integrated Delivery Network",
    "revenue_m": 11200,           # $11.2B revenue
    "employees": 42000,
    "hospitals": 23,
    "health_plan_lives": 187000,
    "hq": "Charlotte, NC",
    "fy": "FY2025",

    # Financial — ties to MH-M02, C04
    "net_revenue_m":      8786,
    "operating_cost_m":   8844,
    "operating_profit_m":  -58,
    "operating_margin":   -0.005,  # -0.5% actual
    "target_margin":       0.040,  # 4.0% target
    "margin_gap_pp":      -4.5,
    "margin_gap_m":       -503,

    # RCM — ties to MH-M01, MH-T01, MH-T02
    "rcm": {
        "denial_rate":       0.182,   # 18.2%
        "denial_benchmark":  0.120,   # 12.0%
        "denial_annual_m":   94.0,    # $94M write-off
        "denial_recoverable_m": 37.6, # via prior auth automation
        "days_in_ar":        52,
        "days_in_ar_bench":  35,
        "collection_rate":   0.876,
        "prior_auth_days":   4.2,
        "prior_auth_bench":  1.8,
        "prior_auth_volume_day": 847,
        "ensemble_sla_penalty_m": 8.0,
        "cms_mandate_date":  "2027-01-01",
        "months_to_mandate": 14,
    },

    # Epic — ties to MH-P04
    "epic": {
        "go_live": "2014-06-01",
        "age_years": 11,
        "optimization_score": 58,
        "optimization_benchmark": 80,
        "modules_licensed": 22,
        "modules_underutilized": 18,
        "mychart_adoption": 0.34,
        "mychart_target": 0.60,
        "training_completion": 0.41,
        "annual_cost_m": 18.4,
        "unrealized_value_m": 36.5,
    },

    # AI Portfolio — ties to MH-P03, MH-M03
    "ai": {
        "initiatives": 12,
        "in_production": 0,
        "budget_m": 28.0,
        "spent_m": 18.7,
        "verified_roi_m": 0.0,
        "prior_auth_value_m": 37.6,
        "gendoc_value_m": 42.0,
        "total_portfolio_value_m": 148.0,
    },

    # Workforce — ties to MH-M04
    "workforce": {
        "physicians_fte": 732,
        "nurses_fte": 8400,
        "total_clinical_fte": 18200,
        "travel_nurse_spend_m": 48.0,
        "travel_nurse_target_m": 28.0,
        "travel_nurse_gap_m": 20.0,
        "physician_burnout_rate": 0.68,
        "doc_hours_per_day": 2.6,
        "doc_hours_target": 0.9,
        "rvu_actual": 4820,
        "rvu_benchmark": 5400,
    },

    # MA Star Rating — ties to MH-M02, strategic commitments
    "ma_star": {
        "current": 3.5,
        "target": 4.0,
        "revenue_at_risk_m": 24.0,
        "lives": 187000,
    },

    # Key people — consistent across all files
    "people": {
        "CEO":   "Emily Rodriguez",
        "CFO":   "James Park",
        "CIO":   "Robert Chen",
        "CDO":   "VACANT — Search active (month 4)",
        "CMIO":  "Dr. Sarah Kim",
        "COO":   "Patricia Walsh",
        "CNO":   "Dr. Angela Torres",
        "VP_RCM": "Michael O'Brien",
        "Dir_Epic": "Linda Chen",
        "Dir_AI":   "REPORTING TO CDO (vacant)",
        "VP_Finance": "Rachel Morrison",
    },

    # Consulting — ties to MH-D01, MH-D04
    "consulting_contracts": [
        {"vendor": "Ensemble Health Partners", "scope": "Full RCM outsourcing",              "annual_m": 14.2, "kt_pct": 18, "risk": "Critical"},
        {"vendor": "Epic Systems (PS)",        "scope": "Epic implementation + support",    "annual_m": 4.2,  "kt_pct": 62, "risk": "Medium"},
        {"vendor": "Wipro",                    "scope": "Salesforce Health Cloud admin",    "annual_m": 1.8,  "kt_pct": 22, "risk": "High"},
        {"vendor": "Cohere Health",            "scope": "Prior auth AI (pilot)",            "annual_m": 0.4,  "kt_pct": 45, "risk": "Low"},
        {"vendor": "3M / Solventum",           "scope": "Clinical coding AI (pilot)",       "annual_m": 0.6,  "kt_pct": 38, "risk": "Low"},
        {"vendor": "AWS (ProServe)",           "scope": "Cloud migration support",          "annual_m": 1.2,  "kt_pct": 68, "risk": "Low"},
        {"vendor": "Deloitte",                 "scope": "Regulatory advisory (HIPAA, CMS)", "annual_m": 0.8,  "kt_pct": 52, "risk": "Medium"},
        {"vendor": "Various contractors",      "scope": "Epic + data analyst contractors",  "annual_m": 2.4,  "kt_pct": 12, "risk": "High"},
    ],

    # Engineering squads — ties to MH-P01, MH-P02
    "squads": [
        {"name": "Epic EHR Core",              "fte": 12, "contractors": 2, "consulting": 4,  "vendor": "Epic",          "cycle_days": 94,  "dora": "Low"},
        {"name": "Revenue Cycle Technology",   "fte": 6,  "contractors": 1, "consulting": 8,  "vendor": "Ensemble",      "cycle_days": 127, "dora": "Low"},
        {"name": "Prior Auth & Payer Integ.",  "fte": 4,  "contractors": 2, "consulting": 6,  "vendor": "Epic/Cohere",   "cycle_days": 145, "dora": "None"},
        {"name": "Patient Engagement",         "fte": 5,  "contractors": 1, "consulting": 3,  "vendor": "Epic",          "cycle_days": 88,  "dora": "Medium"},
        {"name": "Clinical Data & Analytics",  "fte": 6,  "contractors": 2, "consulting": 4,  "vendor": "Epic/Clarity",  "cycle_days": 102, "dora": "Low"},
        {"name": "AI & Innovation Lab",        "fte": 3,  "contractors": 1, "consulting": 6,  "vendor": "Various",       "cycle_days": 0,   "dora": "None"},
        {"name": "Infrastructure & Cloud",     "fte": 5,  "contractors": 2, "consulting": 2,  "vendor": "AWS",           "cycle_days": 45,  "dora": "Medium"},
        {"name": "Cybersecurity",              "fte": 4,  "contractors": 1, "consulting": 1,  "vendor": "Optiv",         "cycle_days": 0,   "dora": "High"},
        {"name": "Integration & Interop.",     "fte": 5,  "contractors": 2, "consulting": 4,  "vendor": "Epic/Rhapsody", "cycle_days": 118, "dora": "Low"},
        {"name": "Supply Chain Technology",    "fte": 3,  "contractors": 1, "consulting": 2,  "vendor": "Infor",         "cycle_days": 96,  "dora": "Low"},
        {"name": "Workforce Technology",       "fte": 3,  "contractors": 1, "consulting": 1,  "vendor": "Workday",       "cycle_days": 72,  "dora": "Medium"},
        {"name": "Telehealth & Virtual Care",  "fte": 4,  "contractors": 1, "consulting": 3,  "vendor": "Epic/Zoom",     "cycle_days": 88,  "dora": "Medium"},
    ],
}

# ── GENOME PATTERNS (referenced across all files) ─────────────────────────
GENOME = {
    "F001": {"name": "Vendor dependency without internal capability", "rate": 0.72},
    "F002": {"name": "No named executive sponsor",                    "rate": 0.84},
    "F003": {"name": "Data readiness below threshold",                "rate": 0.68},
    "F006": {"name": "No MLOps infrastructure",                       "rate": 0.79},
    "F008": {"name": "Change management gap",                         "rate": 0.61},
    "F009": {"name": "Pilot purgatory",                               "rate": 0.76},
    "F010": {"name": "AI spend without verified ROI",                 "rate": 0.89},
    "F011": {"name": "RCM vendor misalignment",                       "rate": 0.74},
    "F012": {"name": "Cost misattribution",                           "rate": 0.68},
}
