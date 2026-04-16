export interface DemoWorkstreamMessage {
  role: 'admin' | 'maestro_ai'
  actor_name: string
  content: string
}

export interface DemoWorkstream {
  name: string
  messages: DemoWorkstreamMessage[]
}

export interface DemoPhase {
  phase_number: number
  status: 'approved' | 'complete' | 'in_progress'
  workstreams: DemoWorkstream[]
  output: {
    output_type: string
    title: string
    content: any
    status: 'approved' | 'published'
  }
}

export interface DemoEngagement {
  engagement_name: string
  phases: DemoPhase[]
}

export const ARCTURUS_TECH_DEMO: DemoEngagement = {
  engagement_name:
    'Arcturus Financial Group × Technology Modernization — Completed Demo',
  phases: [
    // ─── PHASE 1: Technology Diagnosis ───────────────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Failure Pattern Analysis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Opening with the Bloomberg AIM failure history. **3 modernisation attempts, $32.6M spent, all failed for F002** — no named executive sponsor who survived the programme duration. Walking through each. **2009 (TCS, $8.2M):** The CDO-equivalent role was vacant at programme start. The programme ran without executive accountability — no single named owner who could be held responsible for delivery. When scope disputes arose at month 14, there was no executive to resolve them. Programme collapsed. **2016 (Accenture, $14.6M):** Accenture brought in a programme director. At month 18, the programme director left Accenture. The programme collapsed within 6 weeks — the institutional knowledge of the programme structure left with the director. No internal owner, no recovery. **2021 (Infosys, $9.8M):** CDO appointed specifically for this programme. CDO resigned 4 months in — personal reasons. Same collapse as 2016. Programme board had no successor plan. The pattern is identical across all three attempts. The technology was never the problem.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'If we try again, what makes this time different?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Two things must be different. First: the executive sponsor must have skin in the game — their performance review must be tied to the modernisation outcome, not the programme launch. A CDO who owns the programme budget but not the outcome has an incentive to launch, not to deliver. Second: the approach must change. All three prior attempts were full replacement — a $30M+ programme every time. The API wrapper approach hasn\'t been tried. **6 of 14 customisations are portable without full replacement.** Start there. The API wrapper builds internal capability progressively — each wrapper delivered is institutional knowledge that stays inside Arcturus regardless of what happens at senior level. F002 can\'t collapse a programme where the knowledge is distributed across internal engineers, not concentrated in one executive.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Why weren't API wrappers tried before?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three reasons, each specific to each attempt. The **2009** attempt predated the API wrapper as a recognised pattern in asset management — it simply wasn\'t in the toolkit at that point. In **2016**, Accenture recommended full replacement — a larger engagement scope means a larger fee. The API wrapper was available as a pattern by then; it wasn\'t recommended because it didn\'t serve the integrator\'s commercial interest. In **2021**, the CDO arrived with a full-replacement mandate already signed off by the board — the diagnosis was done after the prescription was written. AbarVa\'s approach is different: diagnosis first, prescription second. The Genome shows that API wrapper implementations for Bloomberg AIM-equivalent systems have a **71% success rate** vs **28% for full replacements** in the asset management context.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the realistic timeline for the API wrapper?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**18-24 months** for all 6 portable customisations. **Phase 1 (months 1-6):** Geneva connector + ESG overlay — lowest complexity, highest business value. **Phase 2 (months 7-12):** rebalancing workflow + mandate dashboard. **Phase 3 (months 13-24):** board extract + reporting feed. Each phase is independently deployable — no single programme-ending dependency. If the executive sponsor situation changes mid-programme, the delivered phases stay live. F003 (data migration risk) doesn\'t apply to the API wrapper approach because we\'re not migrating Bloomberg data — we\'re building a governance layer over it. The 28-year position history stays exactly where it is.',
            },
          ],
        },
        {
          name: 'System Assessment',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Scoring each system. 4 options for each: full replacement, API wrapper, optimise existing, stay and renegotiate. **SQL Server DW:** full replacement (Azure SQL Managed Instance) scores **78/100** — non-negotiable given EOL passed October 2025. Every day it runs without security patches is a regulatory risk. **Bloomberg AIM:** API wrapper scores **64/100**, full replacement scores **28/100** (failure history drives the full-replacement score down; data readiness at zero makes it lower still). **Salesforce FSC:** optimise existing scores **81/100** — 44% adoption is the problem, not the technology. The platform is correctly chosen; the implementation shortcut caused the adoption failure. **Charles River IMS:** stay and optimise scores **88/100** — 32/100 technical debt, the best-managed system in the estate. No change warranted.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'The board wants to know: should we replace Bloomberg AIM entirely?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The Genome says no — at this point in time. Here's the data: **three replacement attempts have failed at a combined cost of $32.6M**. The organisation does not currently have the data readiness (**0 golden records**), the internal capability (**CDO vacant 11 months**), or the executive continuity (**F002 pattern confirmed**) to execute a successful full replacement. A fourth attempt with the same governance gaps would be the fourth failure. The Genome success rate for full replacement under current conditions is **28%** — that's not a programme, that's a gamble. The API wrapper approach builds internal capability while reducing dependency. Full replacement remains an option in **3-5 years**, once the CDO is established, golden records are in place, and internal engineers understand the Bloomberg data model through wrapper delivery.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What about the SQL Server DW — that's urgent.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'SQL Server DW is the most urgent decision in the estate. **EOL passed October 2025.** Every day it runs is a security and regulatory risk — no security patches, no vendor support. Migration to **Azure SQL Managed Instance: $1.2M, 4-month project**, team of 3 internal engineers + 1 DBA contractor. Charles River already connects to Azure — the pipeline exists and reduces infrastructure setup time significantly. This is the lowest-risk modernisation project in the estate. It should begin in the next **30 days** regardless of any Bloomberg AIM decision. The two programmes are independent.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Approved. Start Azure SQL scoping immediately.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Azure SQL migration scoped. Logging as Wave 1 action. **Project brief:** migrate SQL Server DW to Azure SQL Managed Instance. **Budget:** $1.2M. **Timeline:** 4 months. **Owner:** VP Data Engineering (internal). **Governance:** CTO sign-off. **Start date:** immediate. Bloomberg AIM API wrapper begins in parallel — Phase 1 (Geneva + ESG) start Month 2 to allow the SQL DW team to be stood up first. The two programmes share no dependencies and can run concurrently.',
            },
          ],
        },
        {
          name: 'Data Migration Risk',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Data migration risk assessment for each system. **Bloomberg AIM: F003 triggered.** 28 years of position history in a proprietary Bloomberg format. This is what stopped all three prior replacement attempts — once teams understood the scope of migrating 28 years of position data from a closed proprietary system, programmes either scoped it as a multi-year sub-project (which broke timelines) or attempted to cut scope (which broke completeness). The API wrapper avoids this entirely: we do not move the data. We build a governance layer over it. F003 does not apply to the wrapper approach.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What about the SQL Server DW — what data is in there?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**SQL Server DW: 8 years of financial reporting data**, $0.4M annual maintenance, **3-day reporting lag** due to manual extraction from 6 source systems. The migration is technically straightforward: Azure Data Factory handles the extraction, Azure SQL handles the transformation. The complexity is the manual processes that currently run around it — **4 scheduled jobs** and **2 analyst-maintained Excel bridges**. These need to be replaced as part of the migration. That\'s where the $1.2M is spent — mostly process re-engineering, not technology.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the data quality risk in the migration?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Low for SQL DW.** Charles River is the source of truth — it\'s well-managed at 32/100 technical debt. The migration risk is not data corruption but process interruption: the 4 scheduled jobs run the end-of-day reporting. A **48-hour migration window** is needed. Recommended approach: run **parallel systems for 2 weeks** post-migration (Azure SQL and SQL Server both running), then cut over. This eliminates the data quality risk entirely. Data reconciliation between the two systems in that window catches any transformation errors before they reach reporting.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Good. What about Bloomberg AIM data long-term?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Bloomberg AIM data stays in place under the API wrapper approach. The **28-year position history remains in Bloomberg\'s system** — we access it through a standardised API layer we control. If at year 3-5 the board decides on full replacement, the data migration planning starts then — with 3+ years of internal capability built through the wrapper programme. F003 risk is deferred, not ignored. The golden record programme (separate from this engagement) would need to be live before any full replacement attempt — currently **0 golden records** against the Bloomberg AIM position history.',
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Phase 1 Output — Situation Brief',
        status: 'approved',
        content: {
          executive_summary:
            'Arcturus has spent $32.6M on three Bloomberg AIM modernisation attempts. All three failed for the same reason: F002 — no named executive sponsor who survived the programme duration. The fourth attempt, with the same governance gaps, will produce the same result. The prescription is different this time: API wrapper approach for 6 portable customisations, immediate Azure SQL migration for the EOL SQL Server DW, and a governance model that prevents F002 from repeating. Total maintenance cost reduction opportunity: $12-18M annually.',
          systems_assessed: [
            {
              system: 'SQL Server DW',
              age_years: 8,
              annual_cost_m: 0.4,
              verdict: 'immediate_migration',
              recommendation: 'Azure SQL Managed Instance — $1.2M, 4 months',
              urgency: 'critical',
            },
            {
              system: 'Bloomberg AIM',
              age_years: 28,
              annual_cost_m: 8.4,
              verdict: 'api_wrapper',
              recommendation:
                '6 of 14 customisations wrapped in 18-24 months — avoid fourth replacement failure',
              urgency: 'high',
            },
            {
              system: 'Salesforce FSC',
              age_years: 6,
              annual_cost_m: 3.2,
              verdict: 'optimise',
              recommendation:
                'Adoption programme — 44% to 80% adoption unlocks $2.1M workflow savings',
              urgency: 'medium',
            },
            {
              system: 'Charles River IMS',
              age_years: 11,
              annual_cost_m: 4.1,
              verdict: 'stay_optimise',
              recommendation: 'Best-managed system in estate. No change.',
              urgency: 'low',
            },
          ],
          failure_pattern_analysis: {
            total_spent_on_bloomberg_m: 32.6,
            attempts: 3,
            root_cause_all_three:
              'F002 — no named executive sponsor who survived programme duration',
            genome_confidence: 0.84,
            fourth_attempt_prognosis_same_structure: 'failure',
            api_wrapper_success_rate_genome: 0.71,
            full_replacement_success_rate_genome: 0.28,
          },
          data_migration_risk: {
            bloomberg_aim: 'DEFERRED — API wrapper eliminates migration risk',
            sql_server_dw:
              'LOW — parallel systems approach, Charles River source of truth intact',
            charles_river: 'NOT APPLICABLE — staying in place',
          },
          recommended_immediate_actions: [
            'Commission Azure SQL Managed Instance migration — start within 30 days',
            'Appoint CDO before any Bloomberg AIM programme begins — F002 prerequisite',
            'Begin Bloomberg API wrapper Phase 1 scoping (Geneva connector + ESG overlay)',
          ],
        },
      },
    },

    // ─── PHASE 2: Technology Prescription ────────────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'Options Scoring',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Full options scoring for all systems. Bloomberg AIM detailed scoring: **API wrapper 64/100** — data readiness N/A (no migration required), internal capability building required, Genome success rate 71%. **Full replacement 28/100** — data readiness 0/100 (no golden records), internal capability 0/100 (CDO vacant), Genome success rate 28%, F002 confirmed present. The scores aren\'t close. For completeness: **SQL Server DW full replacement (Azure SQL): 78/100** — urgency makes it non-negotiable. **Salesforce FSC optimise existing: 81/100** — adoption is the failure mode, not the platform choice. **Charles River IMS stay and optimise: 88/100** — best-managed system in the estate.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What would make full replacement viable in 3-5 years?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three prerequisites, in order. **(1) CDO in role for 24+ months** — executive continuity is the structural fix for F002. A CDO who has been in seat for 2 years has the institutional knowledge and political capital to hold a replacement programme through difficulty. **(2) Golden record for Bloomberg AIM position history** — solves F003. This is the data migration prerequisite that hasn\'t existed in any prior attempt. **(3) API wrapper in place** — internal engineers who have built the wrappers understand the Bloomberg data model. That\'s the knowledge gap that killed all three prior attempts: teams discovered the complexity of the data model mid-programme. At year 3-5, with those three prerequisites met, the Genome success rate for full replacement rises from **28% to 61%**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Salesforce FSC — the adoption problem. What's the fix?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Salesforce FSC adoption at **44% vs 80% benchmark**. The technology is fine — the problem is change management (F008). Two root causes from the data: **(1)** the compliance team never received workflow training post-implementation — they were given system access but no process enablement. **(2)** The broker relationship module was never configured for UK regulatory requirements — so the team built workarounds outside the system. Fix: **90-day adoption programme.** 3 weeks training (not another rollout — genuine workflow enablement), 2 weeks UK regulatory configuration, 6 weeks reinforcement with usage metrics. **Cost: $180K. Value: $2.1M workflow savings annually.**',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "The board will ask why we didn't fix adoption in year 1.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The answer is in the data. Salesforce FSC was implemented by Capgemini ($3.2M programme) with a **6-week go-live sprint**. The implementation plan allocated **2 days** to change management training. Genome shows that FSC implementations with fewer than 3 weeks of change management training have a **78% chance of sub-60% adoption at 12 months**. This was a predictable outcome — the Genome flags it as a leading indicator. The prescription is the same as for every F008 situation: the technology was correctly chosen; the implementation shortcut caused the adoption failure. The board question is fair. The answer is: the implementation methodology was deficient, not the platform decision.',
            },
          ],
        },
        {
          name: 'Vendor Selection',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Vendor selection for two programmes: **(1) Azure SQL migration** and **(2) Bloomberg API wrapper**. For Azure SQL: recommended approach — internal team + 1 DBA contractor. This is not a complex enough programme to warrant a systems integrator. The Charles River Azure pipeline already exists; the infrastructure knowledge is internal. For Bloomberg API wrapper: **3 SIs are Genome-eligible** — they have verifiable Bloomberg AIM wrapper experience in the asset management sector. Scoring against Arcturus\'s specific customisation set.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'Walk me through the Bloomberg API wrapper SI scoring.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three SIs scored. **ThoughtWorks: Genome score 74/100** — 3 comparable Bloomberg wrapper implementations, 2 delivered on time, 1 delivered 6 weeks late, average overrun 4%. Strong engineering capability, higher day rate. **Infosys: Genome score 31/100** — involved in the 2021 failed attempt. The data shows they recommended full replacement over API wrapper, which aligns with their engagement model (larger scope = larger fee) but not Arcturus\'s interest. Their Bloomberg practice is optimised for replacement programmes. **Greenfield Technology: Genome score 68/100** — boutique SI, 2 Bloomberg wrapper implementations, both delivered on time, team of 12 specialising in Bloomberg AIM integrations. Recommendation: **ThoughtWorks or Greenfield — not Infosys.**',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "Infosys are one of our preferred suppliers. That's a difficult conversation.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Understood. The Genome data is transparent and auditable — you can share it with Infosys directly. They recommended full replacement in 2021 over the API wrapper approach that we're now prescribing. The recommendation isn't a criticism of Infosys — it's a scope alignment issue. Their Bloomberg practice is optimised for replacement programmes, which is a legitimate commercial model. The API wrapper is a different engagement type. They may choose to build that capability for you — the question to ask them is: **who in their team has done a Bloomberg API wrapper specifically?** If they can name a team with verifiable wrapper experience, they re-enter the selection. If they can't, the data stands.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Fair. We'll have that conversation. Greenfield as backup?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Yes. Greenfield Technology is the strongest backup. Smaller firm, **lower day rate ($1,100/day vs ThoughtWorks $1,400/day)**, and their two Bloomberg wrapper engagements are directly comparable to your customisation set — Geneva connector in both cases, ESG overlay in one. The risk is capacity — they\'re a team of **12** and would need to dedicate 4 for 18 months. That\'s a significant commitment for a firm of their size. Recommend **engaging them in parallel with the Infosys conversation** — run both tracks, select on the basis of who can confirm a credible Bloomberg wrapper team.',
            },
          ],
        },
        {
          name: 'Business Case',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Business case for technology modernisation. Primary value levers: maintenance cost reduction, risk elimination, and capability unlock. **Bloomberg AIM API wrapper:** maintenance reduction **$2-4M annually** from renegotiated Bloomberg contract (year 2-3 — once wrappers reduce Bloomberg\'s leverage), migration risk eliminated ($32.6M in failed attempts avoided as a future liability), **AI portfolio unlocked** (26 of 28 AI initiatives currently blocked by Bloomberg data latency — resolved in year 2 when Geneva connector is live). **SQL Server DW migration:** regulatory risk eliminated, reporting lag from 72 hours to same-day, direct value $0.4M annually.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the total value in CFO terms?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**CFO-grade business case.** Year 1: Azure SQL migration ($1.2M cost, regulatory risk eliminated, 3-day reporting lag reduced to same-day — value $0.4M direct). Year 2: Bloomberg API Phase 1 complete, renegotiation leverage increases (Bloomberg maintenance reduces to **$6.2M from $8.4M** — saving **$2.2M**). Year 3: Bloomberg API Phase 2 complete, AI data latency resolved, 10-12 AI initiatives unblocked. The AI value is the larger number — 10 AI initiatives producing $3-4M ROI each = **$30-40M annualised by year 3**. This is where the tech modernisation case becomes a margin case, not a cost reduction case.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The CFO will want a conservative number.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Conservative: $14M by year 3** (direct maintenance savings only, AI value excluded). That\'s the guaranteed case regardless of AI execution — Bloomberg renegotiation plus SQL DW plus FSC adoption savings plus minor decommissions. **Base case: $14M + $20M AI** (half the AI portfolio delivering) = **$34M by year 3**. **Optimistic: $14M + $40M AI** = **$54M by year 3**. The range is wide because AI delivery depends on the broader governance programme. The tech modernisation is a prerequisite — it unlocks the option, but the option value depends on what AI delivers. The CFO conservative number is $14M. That\'s the floor.',
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Phase 2 Output — Solution Design',
        status: 'approved',
        content: {
          modernisation_roadmap: [
            {
              system: 'SQL Server DW',
              approach: 'Azure SQL Managed Instance migration',
              timeline_months: 4,
              cost_m: 1.2,
              wave: 1,
              owner: 'VP Data Engineering',
            },
            {
              system: 'Bloomberg AIM',
              approach: 'API wrapper — 6 portable customisations',
              timeline_months: 24,
              cost_m: 4.8,
              wave: '1-3',
              owner: 'CDO + ThoughtWorks/Greenfield',
            },
            {
              system: 'Salesforce FSC',
              approach: 'Adoption programme (F008 fix)',
              timeline_months: 3,
              cost_m: 0.18,
              wave: 1,
              owner: 'VP Technology',
            },
          ],
          vendor_recommendations: {
            azure_sql_migration:
              'Internal team + 1 DBA contractor — no SI required',
            bloomberg_api_wrapper:
              'ThoughtWorks (primary) or Greenfield Technology (backup) — Genome scores 74 and 68. Infosys excluded: prior engagement conflict and no Bloomberg wrapper track record.',
            salesforce_adoption: 'Internal programme — no SI',
          },
          business_case: {
            conservative_year3_m: 14,
            base_year3_m: 34,
            optimistic_year3_m: 54,
            fee_pct: 0.175,
            fee_base_year3_m: 5.95,
            note: 'Conservative excludes AI portfolio unlock value. Base and optimistic include estimated AI ROI from unblocked initiatives.',
          },
          governance_model: {
            executive_sponsor:
              'CDO (prerequisite — F002 must be addressed before programme start)',
            programme_owner: 'CTO (day-to-day)',
            bloomberg_account_manager:
              'New Bloomberg LP account team requested (Month 1 action)',
            performance_review_tie:
              'CDO performance review includes Bloomberg Phase 1 completion milestone',
          },
        },
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ────────────────────────────────
    {
      phase_number: 3,
      status: 'complete',
      workstreams: [
        {
          name: 'Baseline Lock',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '5 baseline metrics, each with a verified source. **Metric 1: Annual maintenance cost — $37M total** (all 13 systems). Source: ARC-C04. This is the number we measure against throughout the programme. Bloomberg AIM specifically: $8.4M. SQL Server DW: $0.4M. Is $37M correct for total including licences?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: '$37M is correct for all systems including licences.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Locked. **Metric 2: Vendor dependency ratio — 78%** (percentage of technology changes requiring vendor approval). Bloomberg owns 14 AIM configuration changes, Wipro owns FSC workflow updates, Charles River governs IMS update path. Target: **50% by month 24**. **Metric 3: Data pipeline lag — 72 hours** (SQL DW 3-day reporting lag). Target: **same-day (< 1 hour) by month 4** via Azure SQL migration. **Metric 4: Failed migrations count — 3.** Target: **0 additional failures**. **Metric 5: Internal capability score — Bloomberg customisations: baseline 0/100.** Target: **80/100 by month 24** (based on engineers able to independently support all 6 wrapped customisations). All five metrics locked.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Lock and proceed.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Baseline locked. Day 0 document generated. CIO signature obtained. CEO co-signed. Programme begins. **Three immediate actions: (1)** Azure SQL scoping call with VP Data Engineering tomorrow. **(2)** Bloomberg LP account team replacement request submitted — previous team relationship was blocking documentation access. **(3)** CDO search accelerated — shortlist review in 2 weeks. The programme clock starts today.',
            },
          ],
        },
        {
          name: 'Governance Model',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The governance model must directly prevent F002 from repeating — not just acknowledge it. **Proposal:** named executive sponsor is the CDO (once appointed). The programme does not launch the Bloomberg API wrapper until the CDO is in seat — the Azure SQL migration begins immediately (lower risk, no exec sponsor dependency for a 4-month bounded programme). CDO appointment is a **hard gate** for Bloomberg Phase 1 commencement.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CTO wants to be programme sponsor.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "That works with one condition: **CTO's Q1 performance objectives must include Bloomberg Phase 1 completion milestone.** Without that link, we have the same structural risk as 2016 — a senior owner who owns the programme launch but not the delivery outcome. The Genome shows that performance linkage is the only governance mechanism that reliably breaks F002. If the CTO is willing to accept that performance linkage, the governance model works. The CDO, once appointed, becomes co-sponsor for Phases 2 and 3.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "CTO agreed. Milestone linked to performance review.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Governance model confirmed.** CTO as executive sponsor. Bloomberg Phase 1 completion (Geneva connector live) linked to Q4 performance review. **Programme board:** CTO (chair), CFO, VP Data Engineering (SQL DW lead), VP Technology (Salesforce FSC lead), SI programme director (ThoughtWorks) once engaged. **Monthly programme review** — mandatory CTO attendance, agenda published 5 days in advance. **F002 structural fix: logged.** This is the first time in four Bloomberg AIM programme attempts that performance accountability is tied to delivery outcome.',
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap',
        title: 'Phase 3 Output — Execution Roadmap',
        status: 'approved',
        content: {
          baseline_metrics: [
            {
              metric: 'Total annual maintenance cost',
              baseline_m: 37.0,
              source: 'ARC-C04',
              target_month24_m: 28.5,
            },
            {
              metric: 'Bloomberg AIM annual maintenance',
              baseline_m: 8.4,
              source: 'ARC-M03',
              target_month24_m: 5.8,
            },
            {
              metric: 'Vendor dependency ratio',
              baseline_pct: 78,
              source: 'ARC-C04',
              target_month24_pct: 50,
            },
            {
              metric: 'Data pipeline lag (hours)',
              baseline_hours: 72,
              source: 'ARC-P02',
              target_month4_hours: 1,
            },
            {
              metric:
                'Internal capability score — Bloomberg customisations',
              baseline: 0,
              source: 'assessed',
              target_month24: 80,
            },
          ],
          wave_plan: [
            {
              wave: 1,
              months: '1-6',
              theme: 'Foundation',
              milestones: [
                'Azure SQL Managed Instance migration complete (month 4)',
                'CDO appointed (month 2 target)',
                'Bloomberg LP new account team in place (month 1)',
                'ThoughtWorks engaged for Bloomberg API Phase 1 (month 2)',
                'Salesforce FSC adoption programme (months 1-3)',
              ],
              gate: 'Azure SQL live, Bloomberg API Phase 1 scoped, CDO in seat',
            },
            {
              wave: 2,
              months: '7-18',
              theme: 'Bloomberg API Phase 1 & 2',
              milestones: [
                'Geneva connector live (month 9)',
                'ESG overlay live (month 12)',
                'Rebalancing workflow live (month 15)',
                'Mandate dashboard live (month 18)',
                'Bloomberg renegotiation at year 1 — savings begin',
              ],
              gate: 'Four of 6 customisations wrapped, vendor dependency ratio < 65%',
            },
            {
              wave: 3,
              months: '19-24',
              theme: 'Bloomberg API Phase 3 & Value',
              milestones: [
                'Board extract wrapper live (month 21)',
                'Reporting feed wrapper live (month 24)',
                'Full internal capability on 6 customisations',
                'AI portfolio data latency resolved — initiatives unblocked',
                'Year 2 Bloomberg renegotiation — maintenance at $5.8M',
              ],
              gate: 'All 6 customisations wrapped, internal capability score 80/100',
            },
          ],
          fee_schedule: [
            {
              trigger:
                'Month 4 — Azure SQL migration complete, reporting lag < 4 hours',
              fee_m: 0.12,
              invoice: 'ARC-T-FEE-001',
            },
            {
              trigger: 'Month 9 — Geneva connector live',
              fee_m: 0.8,
              invoice: 'ARC-T-FEE-002',
            },
            {
              trigger:
                'Month 18 — Bloomberg Phase 1+2 complete, first renegotiation saving verified',
              fee_m: 2.1,
              invoice: 'ARC-T-FEE-003',
            },
            {
              trigger:
                'Month 24 — all 6 customisations wrapped, full capability score',
              fee_m: 2.95,
              invoice: 'ARC-T-FEE-004',
            },
          ],
        },
      },
    },

    // ─── PHASE 4: Execution & Modernisation Tracking ──────────────────────────
    {
      phase_number: 4,
      status: 'in_progress',
      workstreams: [
        {
          name: 'Milestone Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 3 milestone check. **Azure SQL migration: COMPLETE** — went live Month 2, **6 weeks ahead of schedule**. Reporting lag reduced from 72 hours to **47 minutes**. **Salesforce FSC adoption programme: COMPLETE** — adoption rate moved from 44% to **71%** (target is 80% by month 4, on track). **CDO appointment: COMPLETE** — Dr. Marcus Webb appointed Month 2, Day 52.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Azure SQL ahead of schedule — that's significant.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'It is. VP Data Engineering ran a tight programme — **8-week delivery vs 16-week plan**. The schedule compression came from two things: **(1)** Charles River Azure pipeline already existed, reducing infrastructure setup from 4 weeks to 1 week. **(2)** The 2-week parallel-system period was reduced to **1 week** after data reconciliation validated a clean migration on day 3. The **$1.2M budget was delivered at $0.94M — $260K under budget**. This is the proof point for the board: when governance is right and scope is correct, Arcturus delivers on time and under budget.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What about Bloomberg?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Bloomberg API wrapper Phase 1: **IN PROGRESS**. ThoughtWorks engaged Month 2. New Bloomberg LP account team in place Month 1 — the previous team relationship was the root of the documentation obstruction that slowed all three prior engagements. Phase 1 scoping complete. **Geneva connector:** architecture signed off, development begins Month 4. **ESG overlay:** scoping complete, development Month 5. Phase 1 on schedule for **Month 9 delivery**.',
            },
          ],
        },
        {
          name: 'Cost Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 3 maintenance cost vs baseline. **Total estate: $35.8M** (from $37M baseline). **Reduction: $1.2M.** Source: SQL Server DW licence terminated ($0.4M annualised), Salesforce FSC renegotiated terms on consolidated licence ($0.4M), and 2 minor system decommissions ($0.4M combined).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Bloomberg maintenance unchanged?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Bloomberg AIM maintenance unchanged at **$8.4M** — no billing change until renegotiation leverage increases at Month 9 (when Geneva connector goes live). The wrapper approach changes the negotiating position: once internal engineers can govern the Geneva connector independently, Bloomberg LP\'s leverage on that customisation drops significantly. **Projected renegotiation outcome at Month 9: $1.5-2.2M reduction** on the Geneva-related maintenance line. Full renegotiation at Month 18.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Year-end maintenance forecast?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Year-end maintenance forecast: $34.2M** (from $37M baseline). **Reduction: $2.8M year 1.** Breakdown: SQL DW licence gone ($0.4M), FSC renegotiation ($0.4M), minor decommissions ($0.4M), Bloomberg partial renegotiation at Month 9 ($1.6M). **Year 2 forecast with Phase 1+2 complete: $30.1M** — Bloomberg full renegotiation adds $2.6M more. On track against the conservative $14M year-3 case.',
            },
          ],
        },
        {
          name: 'Capability Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Internal capability score — Bloomberg customisations. **Baseline: 0/100. Month 3: 12/100.** The score is based on: **(1)** 2 internal engineers embedded in ThoughtWorks Phase 1 team — learning the Geneva connector architecture in real time. **(2)** Geneva connector architecture documentation complete — the first internal spec ever written on a Bloomberg AIM customisation. **(3)** Bloomberg data model documented to **40% depth**. Capability is building ahead of the wrapper development starting.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Is 12/100 behind plan?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**On plan.** The capability build is intentionally back-loaded — you can\'t know the customisations until you build the wrappers. Month 3 score of 12 is primarily from documentation activity. The score accelerates dramatically in Months 7-12 as the wrappers go live and internal engineers take ownership of production support. **Projected Month 12 score: 45-55/100. Month 24 target: 80/100.** The meaningful test is Month 9 — when the Geneva connector is live, will an internal engineer be able to support it without ThoughtWorks? That\'s the first real capability measurement.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Good. CDO onboarding status?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**CDO Dr. Marcus Webb — Month 2, Day 52.** Background: 12 years as CTO at a comparable London-based asset manager, 4 years as CDO at an asset manager with a live Bloomberg AIM programme. He has **direct Bloomberg AIM experience** — the first time Arcturus has had an executive sponsor who understands the system they\'re modernising. F002 pattern has a structurally different setup than the three prior failures. **Q4 performance objective linked: Geneva connector live by Month 9.** Board confidence: HIGH.',
            },
          ],
        },
      ],
      output: {
        output_type: 'monthly_modernisation_report',
        title: 'Phase 4 Output — Monthly Modernisation Report (Month 3)',
        status: 'published',
        content: {
          month: 3,
          rag_status: 'GREEN',
          maintenance_cost: {
            baseline_m: 37.0,
            current_m: 35.8,
            reduction_m: 1.2,
          },
          milestone_status: [
            {
              milestone: 'Azure SQL Managed Instance migration',
              status: 'COMPLETE',
              actual_month: 2,
              cost_m: 0.94,
              budget_m: 1.2,
              under_budget_m: 0.26,
              rag: 'GREEN',
            },
            {
              milestone: 'CDO appointment — Dr. Marcus Webb',
              status: 'COMPLETE',
              actual_day: 52,
              rag: 'GREEN',
            },
            {
              milestone: 'Bloomberg LP new account team',
              status: 'COMPLETE',
              actual_month: 1,
              rag: 'GREEN',
            },
            {
              milestone: 'Salesforce FSC adoption — 80% target',
              status: 'IN_PROGRESS',
              current_pct: 71,
              target_pct: 80,
              target_month: 4,
              rag: 'GREEN',
            },
            {
              milestone: 'Bloomberg Geneva connector scoping',
              status: 'COMPLETE',
              development_start: 'Month 4',
              rag: 'GREEN',
            },
            {
              milestone: 'ThoughtWorks engagement',
              status: 'COMPLETE',
              actual_month: 2,
              rag: 'GREEN',
            },
          ],
          capability_tracking: {
            bloomberg_api_internal_score: 12,
            baseline: 0,
            target_month24: 80,
            internal_engineers_embedded: 2,
            documentation_depth_pct: 40,
          },
          fee_status: {
            month4_trigger:
              'Azure SQL migration complete — $0.12M fee pending Month 4 verification',
            month9_trigger: 'Geneva connector live — $0.8M fee pending',
            board_note:
              'Month 4 fee trigger ($120K) to be invoiced on SQL DW lag verification (currently 47 min vs 4hr threshold)',
          },
          board_notes: [
            'Month 3 overall RAG: GREEN. All milestones on or ahead of schedule.',
            'Azure SQL migration complete 6 weeks early, $260K under budget — proof of internal delivery capability.',
            'CDO Dr. Marcus Webb appointed Day 52 — first exec sponsor with direct Bloomberg AIM experience. F002 structurally addressed.',
            'Bloomberg LP new account team in place — documentation obstruction resolved.',
            'Salesforce FSC adoption 44% → 71% — F008 remediation underway, 80% target Month 4.',
            'ThoughtWorks Bloomberg API Phase 1 scoping complete. Development Month 4. Geneva connector Month 9 on track.',
            'Month 4 fee trigger: $120K on SQL DW lag verification. On track.',
          ],
        },
      },
    },
  ],
}
