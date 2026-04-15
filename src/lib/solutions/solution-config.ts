export type SolutionKey = 'delivery' | 'pdlc' | 'margin' | 'tech'
export type PhaseKey = 0 | 1 | 2 | 3 | 4

export interface SolutionConfig {
  key: SolutionKey
  name: string
  intelligence_name: string
  cxo_question: string
  tagline: string
  phases: Record<PhaseKey, PhaseConfig>
  datasets: Record<string, string[]>
  genome_patterns: string[]
  recovery_fee_pct: { min: number; max: number }
  fee_model_description: string
  phase0_dimensions: string[]
  baseline_metrics: string[]
}

export interface PhaseConfig {
  number: PhaseKey
  name: string
  description: string
  objective: string
  default_workstreams: WorkstreamTemplate[]
  output_type: string
  output_title: string
  gate_description: string
  gate_approver: string
  unlock_condition: string
  typical_duration_weeks: { min: number; max: number }
}

export interface WorkstreamTemplate {
  name: string
  description: string
  opening_prompt: string
}

export const SOLUTIONS: Record<SolutionKey, SolutionConfig> = {

  delivery: {
    key: 'delivery',
    name: 'AI-Powered Delivery',
    intelligence_name: 'DELIVERY INTELLIGENCE',
    cxo_question: "What's it actually costing us to deliver?",
    tagline: 'Replace 40 consultants with 4 Maestros. Knowledge stays permanently.',
    genome_patterns: ['F001', 'F002', 'F008', 'F009'],
    recovery_fee_pct: { min: 0.15, max: 0.20 },
    fee_model_description: '15-20% of verified consulting spend reduction',
    phase0_dimensions: [
      'consulting_dependency',
      'knowledge_retention',
      'delivery_performance',
      'internal_capability',
      'leadership_governance'
    ],
    baseline_metrics: [
      'annual_consulting_spend_m',
      'avg_kt_score',
      'internal_fte_ratio',
      'vendor_dependency_ratio',
      'knowledge_risk_score'
    ],
    datasets: {
      arcturus: [
        'ARC-D01_Consulting_Audit',
        'ARC-D02_Knowledge_Risk',
        'ARC-D03_Maestro_Team_Design',
        'ARC-C01_Engineering_Organisation',
        'ARC-C03_Leadership_Governance',
        'ARC-C05_Sprint_Velocity'
      ],
      meridian: [
        'MER-D01_Consulting_Audit',
        'MER-D02_Maestro_Team_Design',
        'MER-C02_Consulting_Contracts',
        'MER-C03_Workforce_Analytics'
      ]
    },
    phases: {
      0: {
        number: 0,
        name: 'Readiness Assessment',
        description: 'Analyse uploaded datasets. Score readiness. Surface preliminary Genome matches.',
        objective: 'Determine what AbarVa can analyse and what is missing. Produce a readiness scorecard the Maestro reviews before Phase 1 begins.',
        output_type: 'readiness_scorecard',
        output_title: 'Readiness Assessment',
        gate_description: 'Maestro reviews readiness scorecard',
        gate_approver: 'maestro',
        unlock_condition: 'Datasets uploaded',
        typical_duration_weeks: { min: 0, max: 1 },
        default_workstreams: [
          {
            name: 'Data Analysis',
            description: 'Automated analysis of uploaded datasets',
            opening_prompt: 'Analysing uploaded datasets...'
          }
        ]
      },
      1: {
        number: 1,
        name: 'Consulting Audit & Diagnosis',
        description: 'Deep dive into every consulting relationship. What was promised vs delivered. What knowledge is at risk.',
        objective: 'Produce a Situation Brief the CIO recognises as accurate and the CFO uses as the basis for investment decisions.',
        output_type: 'situation_brief',
        output_title: 'Situation Brief',
        gate_description: 'Client CXO reviews and approves Situation Brief',
        gate_approver: 'client_cxo',
        unlock_condition: 'Phase 0 approved by Maestro',
        typical_duration_weeks: { min: 2, max: 4 },
        default_workstreams: [
          {
            name: 'Consulting Audit',
            description: 'Vendor by vendor: what was promised, what was delivered, what knowledge walked out',
            opening_prompt: 'I have analysed your consulting register. Let me start with your highest-risk relationship. Wipro delivered 58% of contracted velocity and has a KT score of 15% — meaning 85% of their knowledge leaves when the contract ends. Before we go through each vendor, I want to understand: when you look at your consulting footprint, what does value actually mean to you right now — delivery speed, knowledge transfer, or cost reduction?'
          },
          {
            name: 'Knowledge Risk',
            description: 'What knowledge domains are at critical risk — and what would their loss cost',
            opening_prompt: 'Your knowledge risk register shows 3 domains at critical risk (score >80): Bloomberg AIM customisation logic, the Google PSO MLOps design, and your enterprise architecture decisions. The Bloomberg situation is the most urgent — those 14 customisations are entirely vendor-owned. Can you tell me what your internal team would do if Bloomberg LP withdrew support tomorrow? Not theoretically — what would actually happen?'
          },
          {
            name: 'Internal Capability',
            description: 'What can the internal team actually do without vendor support',
            opening_prompt: 'Your engineering org shows a 47% contractor and consulting ratio across 14 squads. But that average hides a bigger story — some squads have genuine internal capability (Portfolio Analytics), while others are entirely vendor-dependent (OMS Core, Client Data Platform). I want to map what your internal team can actually do without external support. Starting with the squads that matter most: if Wipro left tomorrow, what happens to the FSC platform?'
          }
        ]
      },
      2: {
        number: 2,
        name: 'Maestro Design & Prescription',
        description: 'Design the Maestro team. Define vendor verdicts. Build the business case.',
        objective: 'Produce a Solution Design with a Maestro team design, vendor verdicts, and a CFO-grade business case.',
        output_type: 'solution_design',
        output_title: 'Solution Design',
        gate_description: 'Client CFO and CIO review and approve Solution Design',
        gate_approver: 'client_cfo',
        unlock_condition: 'Situation Brief approved by client CXO',
        typical_duration_weeks: { min: 2, max: 3 },
        default_workstreams: [
          {
            name: 'Maestro Team Design',
            description: 'Which Maestros, what scope, what they replace, wave sequencing',
            opening_prompt: 'Based on the Situation Brief, I can see 6 Maestro roles that would replace your current consulting dependency. Let me walk you through the proposed design, starting with the highest-value and fastest to deliver. The Delivery Maestro for Data & AI would replace the Google PSO and Wipro data platform work — and given the MLOps knowledge gap, this is where I would start. Does that sequencing match your instinct?'
          },
          {
            name: 'Vendor Verdicts',
            description: 'Retain, renegotiate, or exit — with transition plans',
            opening_prompt: 'We need to make a decision on each of your 10 consulting relationships. I have categorised them into three groups based on the audit findings. Two are clear exits (Google PSO has already ended; the contractor EA situation is critical risk). Three are renegotiations with leverage. Five are retains with KT improvement conditions. Let me walk you through the exit plan for Wipro first — it is the highest cost and lowest KT score.'
          },
          {
            name: 'Business Case',
            description: 'CFO-grade recovery ranges, three scenarios, Genome-validated',
            opening_prompt: "The recovery range from your consulting footprint is £16-28M annually, based on Genome pattern F001 validated across 47 similar asset management engagements. I want to build a business case your CFO will approve — which means three scenarios (conservative, base, optimistic) with every assumption traceable. Before I generate the model, I need to understand your CFO's primary concern: is it the size of the recovery, the confidence interval, or the timeline to first verified saving?"
          }
        ]
      },
      3: {
        number: 3,
        name: 'Execution Roadmap & Baseline',
        description: 'Sequence the interventions. Lock the baseline. Agree the fee structure.',
        objective: 'Produce an Execution Roadmap with an immutable baseline agreement and fee schedule.',
        output_type: 'execution_roadmap',
        output_title: 'Execution Roadmap & Baseline Agreement',
        gate_description: 'CEO or CFO signs the baseline agreement',
        gate_approver: 'board',
        unlock_condition: 'Solution Design approved by client CFO',
        typical_duration_weeks: { min: 1, max: 2 },
        default_workstreams: [
          {
            name: 'Baseline Agreement',
            description: 'Lock every metric. Source every number. Agree measurement methodology.',
            opening_prompt: 'The baseline agreement is the most important document in the engagement. Every metric we track must be locked here before Day 1 — source, value, methodology, and verification method. Nothing in the baseline can change after signature without board approval. I want to walk through each metric carefully. Starting with the most important: annual consulting spend. Your ARC-D01 file shows £42M. Is that the right number to lock — or is there a more current figure we should use?'
          },
          {
            name: 'Wave Plan',
            description: 'Three waves of delivery — milestones, owners, gates',
            opening_prompt: 'The execution plan breaks into three waves over 12 months. Wave 1 (days 1-90) is foundation — Maestros embedded, consulting audit communicated, first vendor transitions. Wave 2 (days 91-180) is recovery — first verified savings, KT programme live. Wave 3 (days 181-365) is compound — internal capability measured, second round of recoveries. I want to make sure the Wave 1 milestones are realistic given your current constraints. What would make the CDO appointment the first milestone?'
          },
          {
            name: 'Fee Structure',
            description: 'Outcome-based fee schedule tied to baseline milestones',
            opening_prompt: 'The fee structure is entirely outcome-based — 15-20% of verified savings against the locked baseline. No verified savings, no fee. I want to structure the fee triggers so they align with your cash flow and give you confidence in the methodology. The first trigger would be at month 3 — first verified saving documented and audited. What is the minimum saving at month 3 that would give your CFO confidence that the programme is working?'
          }
        ]
      },
      4: {
        number: 4,
        name: 'Execution & Outcome Tracking',
        description: 'Maestros embedded. Monthly actuals vs baseline. Fee on verified outcomes.',
        objective: 'Execute the roadmap. Track every metric monthly. Earn the fee only on verified outcomes.',
        output_type: 'outcome_report',
        output_title: 'Monthly Outcome Report',
        gate_description: 'Quarterly board review',
        gate_approver: 'board',
        unlock_condition: 'Baseline signed by CEO or CFO',
        typical_duration_weeks: { min: 52, max: 52 },
        default_workstreams: [
          {
            name: 'Monthly Actuals',
            description: 'Track every baseline metric monthly',
            opening_prompt: "Month {month} actuals are due. I need the current values for each baseline metric. I will calculate the variance, update the RAG status, and generate the Monthly Outcome Report. Let's start with the most important metric: current annual consulting spend (annualised from this month's invoices)."
          },
          {
            name: 'Milestone Tracking',
            description: 'Wave milestone status and recovery plans for anything at risk',
            opening_prompt: 'Three milestones were due this month. Let me check status on each.'
          },
          {
            name: 'Knowledge Transfer',
            description: 'Monthly KT log — what capability has stayed inside the org',
            opening_prompt: 'The knowledge transfer log needs updating. For each Maestro workstream, what capability has the internal team taken on this month that they could not do before?'
          }
        ]
      }
    }
  },

  pdlc: {
    key: 'pdlc',
    name: 'AI-Powered PDLC',
    intelligence_name: 'DELIVERY INTELLIGENCE',
    cxo_question: 'Why is nothing reaching production?',
    tagline: 'Cut time to production in half. Knowledge stays permanently.',
    genome_patterns: ['F001', 'F002', 'F006', 'F008', 'F009'],
    recovery_fee_pct: { min: 0.15, max: 0.20 },
    fee_model_description: '15-20% of verified cycle time reduction value',
    phase0_dimensions: [
      'delivery_velocity',
      'data_readiness',
      'mlops_capability',
      'internal_engineering',
      'ai_portfolio_health'
    ],
    baseline_metrics: [
      'avg_cycle_time_days',
      'ai_initiatives_in_production',
      'deployment_frequency',
      'consulting_dependency_ratio',
      'mlops_maturity_score'
    ],
    datasets: {
      arcturus: [
        'ARC-C01_Engineering_Organisation',
        'ARC-C05_Sprint_Velocity',
        'ARC-P01_AI_Initiative_Inventory',
        'ARC-P02_Data_Architecture',
        'ARC-P03_MLOps_Assessment',
        'ARC-P05_Engineering_Cost'
      ],
      meridian: [
        'MER-P01_Engineering_Organisation',
        'MER-P02_Sprint_Velocity',
        'MER-P03_AI_Initiative_Inventory',
        'MER-P04_Technology_Landscape',
        'MER-P05_MLOps_Assessment'
      ]
    },
    phases: {
      0: {
        number: 0,
        name: 'Readiness Assessment',
        description: 'Score delivery readiness. Identify MLOps gaps. Map AI initiative blockers.',
        objective: 'Determine the current state of engineering delivery and AI production capability.',
        output_type: 'readiness_scorecard',
        output_title: 'Delivery Readiness Assessment',
        gate_description: 'Maestro reviews readiness scorecard',
        gate_approver: 'maestro',
        unlock_condition: 'Datasets uploaded',
        typical_duration_weeks: { min: 0, max: 1 },
        default_workstreams: [{
          name: 'Data Analysis',
          description: 'Automated analysis',
          opening_prompt: 'Analysing delivery datasets...'
        }]
      },
      1: {
        number: 1,
        name: 'Delivery Bottleneck Diagnosis',
        description: 'Map every bottleneck. Quantify every delay. Identify every blocker.',
        objective: 'Produce a Situation Brief showing where time goes, why AI is stuck in pilot, and what it is costing.',
        output_type: 'situation_brief',
        output_title: 'Situation Brief',
        gate_description: 'Client CIO reviews and approves Situation Brief',
        gate_approver: 'client_cxo',
        unlock_condition: 'Phase 0 approved by Maestro',
        typical_duration_weeks: { min: 2, max: 4 },
        default_workstreams: [
          {
            name: 'Delivery Velocity Analysis',
            description: 'Where does time actually go between approved spec and production',
            opening_prompt: 'Your sprint velocity data shows an average cycle time of 127 days for major features across your OMS squads — against an industry benchmark of 14 days for equivalent changes. But the headline number hides the real story. For your OMS Core squad, the delay is almost entirely vendor-controlled: Bloomberg governs every release window. For your AI/ML Platform squad, the situation is different — 0 deployments in 12 months, not because of vendor gates, but because there is no infrastructure to deploy to. These are two completely different problems requiring different interventions. Which would you like to understand first?'
          },
          {
            name: 'AI Initiative Blockers',
            description: 'Why 28 AI initiatives are stuck in pilot — initiative by initiative',
            opening_prompt: 'You have 28 AI initiatives. None are in production. £94M committed. That is not bad luck — it is a structural problem. I can see three root causes in your data, each affecting a different group of initiatives. The first — no MLOps infrastructure — affects 26 of the 28. Even if everything else was perfect, there is no way to get a model to production. The second — CDO vacancy — blocks 14 specifically. The third — data quality — affects 22. Before we go through each initiative, I want to understand: is the board aware that 0 of 28 are in production?'
          },
          {
            name: 'Engineering Cost vs Output',
            description: 'What does delivery actually cost per story point — and why',
            opening_prompt: 'Your engineering cost breakdown shows significant variation in cost-per-story-point across squads. Portfolio Analytics delivers at benchmark. AI/ML Platform delivers at infinite cost — zero story points to production in 12 months while spending £1.8M. This is the clearest quantification of the problem. Before I walk through the full cost analysis, can you help me understand: does your CFO currently see this breakdown — cost per squad, cost per story point?'
          }
        ]
      },
      2: {
        number: 2,
        name: 'AI Delivery Prescription',
        description: 'MLOps foundation. AI agent integration. Vendor dependency reduction.',
        objective: 'Produce a Solution Design with MLOps roadmap, AI agent integration plan, and engineering model redesign.',
        output_type: 'solution_design',
        output_title: 'Solution Design',
        gate_description: 'Client CIO and CFO approve Solution Design',
        gate_approver: 'client_cfo',
        unlock_condition: 'Situation Brief approved',
        typical_duration_weeks: { min: 2, max: 3 },
        default_workstreams: [
          {
            name: 'MLOps Foundation',
            description: 'What needs to be built, in what sequence, to get AI to production',
            opening_prompt: 'The MLOps assessment shows zero maturity across 11 capabilities — no model registry, no serving infrastructure, no pipeline, no monitoring. The good news: AWS Bedrock access is configured. That means we can deploy AI-023 (Investment Research) and AI-026 (Earnings Call Analysis) in the next 90 days without building the full MLOps stack. These two initiatives are externally data-sourced — they do not need the golden record to work. Should we design the first wave around these two as proof points while the foundation is built?'
          },
          {
            name: 'Engineering Model Redesign',
            description: 'How squads work changes when AI is a participant, not a tool',
            opening_prompt: 'AI-led product development is not about adding AI tools to existing squads. It requires redesigning how squads work. Engineers review AI output rather than generating everything from scratch. Governance gates are automated for low-risk changes. Sprint velocity is measured against AI-assisted output. This is a change management challenge as much as a technology one. Your Portfolio Analytics squad is the closest to this model already — what makes them different from the OMS squads?'
          },
          {
            name: 'Vendor Dependency Reduction',
            description: 'Bloomberg AIM specifically — API wrapper vs replacement vs renegotiate',
            opening_prompt: "Three failed modernisation attempts on Bloomberg AIM tell us something important: the problem is not the vendor — it is the approach. Full replacement has failed three times because the 14 customisations cannot be replicated without Bloomberg. The API wrapper approach — wrapping AIM's functionality in an abstraction layer that internal teams can govern — has not been tried. It reduces vendor dependency without the migration risk. I want to understand: what is the single Bloomberg AIM customisation that, if it could be governed internally, would change the situation most?"
          }
        ]
      },
      3: {
        number: 3,
        name: 'Execution Roadmap & Baseline',
        description: 'Three waves. Baseline locked. Fee structure agreed.',
        objective: 'Lock the baseline. Sequence the delivery. Agree the fee.',
        output_type: 'execution_roadmap',
        output_title: 'Execution Roadmap & Baseline Agreement',
        gate_description: 'CEO or CIO signs baseline',
        gate_approver: 'board',
        unlock_condition: 'Solution Design approved',
        typical_duration_weeks: { min: 1, max: 2 },
        default_workstreams: [
          {
            name: 'Baseline Metrics',
            description: 'Lock cycle time, AI in production count, deployment frequency',
            opening_prompt: 'The baseline for AI-Powered PDLC needs five metrics locked. Let me walk through each. The most important: average cycle time. Your sprint velocity data shows 127 days for OMS squads and 0 (not tracked) for the AI/ML Platform. I propose we lock 127 days as the OMS baseline and establish a new measurement for AI initiatives — days from approved spec to production. Does that methodology work for your engineering team?'
          },
          {
            name: 'Wave Plan',
            description: 'Three waves: Foundation → Scale → Compound',
            opening_prompt: 'Wave 1 (days 1-90) focuses on two things: deploy the first AI to production (AI-023 via AWS Bedrock — fastest path) and establish the experiment tracking infrastructure (MLflow shared server — 3-week effort). Both are achievable without waiting for the golden record or the full MLOps build. Wave 1 success metric: 1 AI initiative in production with documented baseline. That is the proof point for Wave 2 funding. Does that milestone feel achievable to you?'
          },
          {
            name: 'Fee Structure',
            description: 'Outcome-based — cycle time reduction and AI in production milestones',
            opening_prompt: "For PDLC, the fee triggers are different from the Delivery solution. We track two things: AI initiatives reaching production (£X per initiative verified), and cycle time reduction (% of verified reduction × annual value). The first fee trigger is at month 3: first AI initiative in production with documented baseline. What should that first trigger be worth to make the programme feel real to your CFO?"
          }
        ]
      },
      4: {
        number: 4,
        name: 'Execution & Outcome Tracking',
        description: 'Maestros embedded. AI deployments tracked. Cycle time improving.',
        objective: 'Execute. Track. Report. Earn the fee on verified outcomes.',
        output_type: 'outcome_report',
        output_title: 'Monthly Outcome Report',
        gate_description: 'Quarterly board review',
        gate_approver: 'board',
        unlock_condition: 'Baseline signed',
        typical_duration_weeks: { min: 52, max: 52 },
        default_workstreams: [
          {
            name: 'Monthly Actuals',
            description: 'AI in production count, cycle time, deployment frequency',
            opening_prompt: 'Month {month} tracking. Let me check the three core metrics.'
          },
          {
            name: 'AI Deployment Log',
            description: 'Every AI initiative that reached production this month',
            opening_prompt: 'Which AI initiatives moved to production this month?'
          },
          {
            name: 'Knowledge Compound',
            description: 'How the platform is getting smarter — Genome additions from this engagement',
            opening_prompt: "This month's engagement adds to the Genome. What patterns have we validated or refined?"
          }
        ]
      }
    }
  },

  margin: {
    key: 'margin',
    name: 'Margin Optimization',
    intelligence_name: 'MARGIN INTELLIGENCE',
    cxo_question: 'Where is the margin going — and why?',
    tagline: 'Identify every margin lever. Board-ready recovery plan. Fee on verified savings only.',
    genome_patterns: ['F002', 'F010', 'F012'],
    recovery_fee_pct: { min: 0.15, max: 0.20 },
    fee_model_description: '15-20% of verified savings',
    phase0_dimensions: [
      'financial_data_quality',
      'revenue_analysis_readiness',
      'cost_structure_visibility',
      'ai_roi_tracking',
      'leadership_accountability'
    ],
    baseline_metrics: [
      'ci_ratio_or_operating_margin',
      'ai_spend_verified_roi_m',
      'consulting_spend_m',
      'target_metric_gap_m',
      'cost_per_revenue_unit'
    ],
    datasets: {
      arcturus: [
        'ARC-C02_Financial_Statements',
        'ARC-M01_PL_by_Business_Unit',
        'ARC-M02_AI_Spend_ROI',
        'ARC-M03_Cost_Structure',
        'ARC-C03_Leadership_Governance'
      ],
      meridian: [
        'MER-C01_Financial_Statements',
        'MER-M01_Payer_Performance',
        'MER-M02_DRG_Cost_Analysis',
        'MER-M03_AI_Spend_ROI',
        'MER-M04_Physician_Productivity'
      ]
    },
    phases: {
      0: {
        number: 0,
        name: 'Financial Readiness Assessment',
        description: 'Score financial data quality. Identify margin leak signals. Map AI spend vs ROI.',
        objective: 'Determine what can be analysed with current financial data and what gaps exist.',
        output_type: 'readiness_scorecard',
        output_title: 'Financial Readiness Assessment',
        gate_description: 'Maestro reviews financial readiness',
        gate_approver: 'maestro',
        unlock_condition: 'Financial datasets uploaded',
        typical_duration_weeks: { min: 0, max: 1 },
        default_workstreams: [{
          name: 'Margin Scoping',
          description: 'Show what is already analysed. Present full opportunity map. Agree focus areas. Generate data requests.',
          opening_prompt: 'I have analysed your uploaded datasets. Before we go into Phase 1, I want to show you the full picture of where margin typically leaks for an asset manager your size — and separate what I can already see from what would require additional data.\n\nFrom what is already loaded, I can see three things clearly:\n\nFirst: £94M committed to 28 AI initiatives. £0 verified return. This is not a technology problem — it is a governance problem. The CDO vacancy is the most expensive unfilled role in the firm.\n\nSecond: £42M in consulting spend with an average knowledge transfer score of 24%. Knowledge walks out every Friday.\n\nThird: C/I ratio 71% vs 58% target — a £840M efficiency gap. Your IT spend at 4.2% of revenue vs 3.1% peer adds £178M of structural overspend.\n\nThese three together represent £250–320M of addressable margin — already visible from your data.\n\nBut there are six more areas I have not been able to look at yet: middle office operations, fee yield by strategy, client retention, fund accounting efficiency, regulatory reporting cost, and KYC/AML operations. These typically add another £40–80M for a firm your profile.\n\nI have built a Margin Opportunity Map above showing every lever — what is analysed, what I can estimate from Genome benchmarks, and what requires data uploads to unlock.\n\nWhere would you like to focus first — the areas we already see clearly, or should we gather data on the areas we have not yet examined?'
        }]
      },
      1: {
        number: 1,
        name: 'Margin Gap Diagnosis',
        description: 'Decompose the margin gap. Separate structural from addressable. Sequence by Genome.',
        objective: 'Produce a Situation Brief showing exactly where margin is leaking, why, and what is recoverable.',
        output_type: 'situation_brief',
        output_title: 'Situation Brief',
        gate_description: 'Client CEO and CFO approve Situation Brief',
        gate_approver: 'client_cxo',
        unlock_condition: 'Phase 0 approved',
        typical_duration_weeks: { min: 2, max: 4 },
        default_workstreams: [
          {
            name: 'Margin Decomposition',
            description: 'Every driver of the margin gap — revenue and cost side',
            opening_prompt: 'Your C/I ratio is 71% against a 58% target — a £840M gap at current revenue scale. Before we go line by line, I want to do something most consultants skip: separate the structural costs from the addressable ones. Structural costs — compensation for investment professionals, premises, regulatory — these do not reduce without a strategy change. Addressable costs — consulting spend, AI portfolio with zero ROI, Bloomberg AIM overpay, IT overspend — these are recoverable with the right programme. Do you have a sense of how your CFO thinks about that split?'
          },
          {
            name: 'Revenue Side Analysis',
            description: 'Fee compression, AUM mix, performance fees, client attrition',
            opening_prompt: 'The margin problem is not just cost. Your revenue per AUM is declining — performance fees dropped from £82M in 2023 to £48M in 2025 while AUM grew. That compression is not in your cost reduction programmes. I want to understand the revenue side before we fix the cost side — because some of your best margin interventions are on the revenue line, not the cost line. What is driving the performance fee decline?'
          },
          {
            name: 'AI Spend vs ROI',
            description: '£94M committed, £0 verified — this alone is a margin programme',
            opening_prompt: 'Your AI spend tracker shows £94M committed across 28 initiatives. Verified ROI: £0. I need to be direct about what this means for your margin: you are spending 12% of your annual revenue on AI that is delivering nothing to the P&L. This is not a technology problem — it is a governance problem. The CDO vacancy is the single most expensive unfilled role in the firm. Would you like me to quantify the cost of the CDO vacancy to the margin before we go further?'
          },
          {
            name: 'Contradiction Map',
            description: 'What the CFO told the board vs what the data shows',
            opening_prompt: 'Your strategic commitments document contains 8 board-level commitments made between 2023 and 2024. I want to build the contradiction map — what was committed vs what the data shows — because this is often the most useful part of the Phase 1 work. It tells us where the gap between intent and reality is largest, and that is usually where the highest-value intervention is. Are you comfortable walking through these commitments with me?'
          }
        ]
      },
      2: {
        number: 2,
        name: 'Margin Intervention Design',
        description: '3-5 prioritised interventions. CFO-grade business case. Genome sequencing.',
        objective: 'Produce a Solution Design with interventions sequenced by Genome and a business case the CFO will approve.',
        output_type: 'solution_design',
        output_title: 'Solution Design',
        gate_description: 'Client CFO approves Solution Design and business case',
        gate_approver: 'client_cfo',
        unlock_condition: 'Situation Brief approved',
        typical_duration_weeks: { min: 2, max: 3 },
        default_workstreams: [
          {
            name: 'Intervention Sequencing',
            description: 'Genome decides the order — not instinct, not politics',
            opening_prompt: 'The Genome data from 47 asset management margin engagements tells us something important about sequencing: the interventions that feel most urgent to a CFO (IT cost reduction, headcount restructuring) are often not the highest-confidence ones. The highest-confidence first intervention for your profile — CDO vacant, AI spend untracked, F002 confirmed — is the CDO appointment. It costs nothing to hire. It unblocks £94M in AI value. It re-establishes governance. Without it, every other intervention risks the same fate as the 28 stalled AI initiatives. Does the board understand the cost of the vacancy in margin terms?'
          },
          {
            name: 'Business Case Construction',
            description: 'Three scenarios per intervention — conservative, base, optimistic',
            opening_prompt: "For each intervention, we need three scenarios. Conservative: assumes implementation challenges, partial adoption, conservative Genome recovery rate. Base: assumes normal execution, full Genome recovery rate. Optimistic: assumes fast execution and favourable conditions. Your CFO needs to see all three — not because we expect the worst, but because a CFO who approves a programme based on the optimistic scenario and gets the conservative one will lose confidence in the methodology. What scenario does your CFO typically anchor on?"
          },
          {
            name: 'AI Portfolio Reorientation',
            description: 'Which of the 28 to accelerate, which to kill, which to reshape',
            opening_prompt: 'Of your 28 AI initiatives, my analysis suggests: 3 should be accelerated immediately (AI-023, AI-026 — external data, near production; and the CDO hire which is not a technology initiative but enables 14 others). 8 should be reshaped with the right infrastructure in place. 12 should be paused pending the golden record and MLOps foundation. 5 should be killed — they were started without the prerequisites and the Genome says they will not deliver. Shall I walk through the kill list first? It will free up capital for the ones that will work.'
          }
        ]
      },
      3: {
        number: 3,
        name: 'Execution Roadmap & Baseline',
        description: 'Lock the C/I baseline. Sequence the interventions. Agree the fee.',
        objective: 'Lock the baseline. Roadmap the delivery. Agree outcome-based fees.',
        output_type: 'execution_roadmap',
        output_title: 'Execution Roadmap & Baseline Agreement',
        gate_description: 'CFO signs baseline agreement',
        gate_approver: 'board',
        unlock_condition: 'Solution Design approved',
        typical_duration_weeks: { min: 1, max: 2 },
        default_workstreams: [
          {
            name: 'Baseline Lock',
            description: 'C/I ratio, AI ROI, consulting spend — every metric with source',
            opening_prompt: 'The margin baseline requires precision. C/I ratio 71% — source: FY2025 P&L. AI spend £94M, verified ROI £0 — source: ARC-M02. Annual consulting spend £42M — source: ARC-D01. These are the numbers locked on Day 0. Every month we will measure actual vs these baselines. If the C/I ratio improves, we calculate the saving and trigger the fee. If it does not, we earn nothing. Are these the right numbers — or is there a more current figure for any of them?'
          },
          {
            name: 'Wave Plan',
            description: 'CDO hire → AI governance → first interventions → scale',
            opening_prompt: 'Wave 1 for Margin Optimization is different from other solutions: it is almost entirely governance. CDO appointed (or interim named), AI governance council constituted, AI portfolio review completed, 3-5 initiatives killed and capital reallocated. These are decisions, not builds. They are the fastest path to margin impact because they stop the bleeding — £94M being spent with £0 return. Wave 1 gate: AI governance council operational and portfolio reviewed. Timeline: 90 days. What would need to be true for the CDO appointment to happen in 30 days?'
          }
        ]
      },
      4: {
        number: 4,
        name: 'Execution & Margin Tracking',
        description: 'Monthly C/I ratio actuals. AI ROI tracked. Fee on verified savings.',
        objective: 'Track every margin metric monthly. Report actuals vs baseline. Trigger fee on verified savings.',
        output_type: 'outcome_report',
        output_title: 'Monthly Margin Report',
        gate_description: 'Quarterly CFO review',
        gate_approver: 'board',
        unlock_condition: 'Baseline signed',
        typical_duration_weeks: { min: 52, max: 52 },
        default_workstreams: [
          {
            name: 'Monthly Actuals',
            description: 'C/I ratio, AI ROI, consulting spend — vs baseline',
            opening_prompt: 'Month {month} margin actuals. Starting with C/I ratio.'
          },
          {
            name: 'AI ROI Tracker',
            description: 'Which AI initiatives have documented ROI this month',
            opening_prompt: 'Which AI initiatives have verified, documented ROI this month?'
          },
          {
            name: 'Fee Calculation',
            description: 'Verified savings × fee percentage',
            opening_prompt: 'Calculating verified savings this month.'
          }
        ]
      }
    }
  },

  tech: {
    key: 'tech',
    name: 'Technology Modernization',
    intelligence_name: 'TECHNOLOGY INTELLIGENCE',
    cxo_question: 'Which systems are blocking us — and what do we actually do?',
    tagline: 'Diagnose which systems need replacing. Build the business case that will be approved.',
    genome_patterns: ['F001', 'F002', 'F003', 'F008'],
    recovery_fee_pct: { min: 0.15, max: 0.20 },
    fee_model_description: '15-20% of verified maintenance cost reduction and milestone delivery',
    phase0_dimensions: [
      'system_inventory_completeness',
      'migration_history',
      'data_readiness',
      'vendor_dependency_depth',
      'internal_governance_capability'
    ],
    baseline_metrics: [
      'annual_maintenance_cost_m',
      'system_age_weighted_avg',
      'vendor_dependency_ratio',
      'failed_migrations_count',
      'data_pipeline_lag_hours'
    ],
    datasets: {
      arcturus: [
        'ARC-C04_Technology_Landscape',
        'ARC-P04_Bloomberg_AIM_Customisations',
        'ARC-T01_Modernisation_Options',
        'ARC-P02_Data_Architecture',
        'ARC-C03_Leadership_Governance'
      ],
      meridian: [
        'MER-P04_Technology_Landscape',
        'MER-T01_Epic_Integration_Map',
        'MER-T02_Cerner_Migration',
        'MER-C02_Consulting_Contracts'
      ]
    },
    phases: {
      0: {
        number: 0,
        name: 'Technology Readiness Assessment',
        description: 'Map the technology landscape. Identify EOL risks. Score migration readiness.',
        objective: 'Determine which systems are at risk, which have failed modernisation history, and what data quality issues will block migration.',
        output_type: 'readiness_scorecard',
        output_title: 'Technology Readiness Assessment',
        gate_description: 'Maestro reviews technology readiness',
        gate_approver: 'maestro',
        unlock_condition: 'Technology datasets uploaded',
        typical_duration_weeks: { min: 0, max: 1 },
        default_workstreams: [{
          name: 'Technology Analysis',
          description: 'Automated technology analysis',
          opening_prompt: 'Analysing technology landscape...'
        }]
      },
      1: {
        number: 1,
        name: 'Technology Diagnosis',
        description: 'Why have previous modernisations failed. Which systems actually need replacing.',
        objective: 'Produce a Situation Brief that explains the failure patterns and scores each system for replacement vs optimisation vs wrap.',
        output_type: 'situation_brief',
        output_title: 'Situation Brief',
        gate_description: 'Client CIO approves Situation Brief',
        gate_approver: 'client_cxo',
        unlock_condition: 'Phase 0 approved',
        typical_duration_weeks: { min: 2, max: 4 },
        default_workstreams: [
          {
            name: 'Failure Pattern Analysis',
            description: 'Why 3 Bloomberg AIM modernisations failed — root cause, not symptoms',
            opening_prompt: 'Three Bloomberg AIM modernisation attempts. Total cost: £32.6M. All three failed. Before we discuss what to do next, I want to understand why — because if we repeat the same approach, we will get the same result. Looking at the post-mortem data, all three failures have Genome pattern F002 in common: no named executive sponsor who survived the duration of the programme. The first attempt: CDO-equivalent role absent. Second: Programme director left at month 18. Third: CDO appointed, resigned after 4 months. Is that consistent with how you understand what happened?'
          },
          {
            name: 'System Assessment',
            description: 'Replace vs optimise vs wrap — scored against data readiness and capability',
            opening_prompt: "Not every aging system needs replacing. The right question is: what is the business outcome you need from this system — and what is the cheapest, lowest-risk path to that outcome? For Bloomberg AIM, full replacement has failed three times. But an API wrapper approach — wrapping AIM's functionality so internal teams can govern it without vendor dependency — has not been tried. For SQL Server DW (EOL passed, running without security patches), immediate migration is non-negotiable — but the destination matters. For Salesforce FSC, the system is fine — 44% adoption is the problem, not the technology. Let me score each system. Do you have a view on which one feels most urgent to your board right now?"
          },
          {
            name: 'Data Migration Risk',
            description: 'What is in the systems that cannot easily move',
            opening_prompt: 'Data migration is where technology modernisations most commonly fail — and where Genome pattern F003 (data readiness below threshold, 68%) is triggered. For Bloomberg AIM: 28 years of position history in proprietary format. 14 customisations with no specification documentation. This is what stopped all three prior attempts. I need to understand: is there a data dictionary for the AIM position history — anything that would let us assess migration complexity accurately before committing to a path?'
          }
        ]
      },
      2: {
        number: 2,
        name: 'Technology Prescription',
        description: 'Modernisation options scored. Vendor selected against your data. Business case built.',
        objective: 'Produce a Solution Design with scored options, vendor recommendation, and CFO-grade business case.',
        output_type: 'solution_design',
        output_title: 'Solution Design',
        gate_description: 'Client CIO and CFO approve Solution Design',
        gate_approver: 'client_cfo',
        unlock_condition: 'Situation Brief approved',
        typical_duration_weeks: { min: 2, max: 3 },
        default_workstreams: [
          {
            name: 'Options Scoring',
            description: 'Each system: full replacement vs API wrapper vs optimise vs stay',
            opening_prompt: "For each system we identified as requiring a decision, I have scored four options against your data: full replacement, API wrapper, optimise existing, stay and renegotiate. The scoring criteria are: data readiness, internal capability to govern, vendor lock-in risk, regulatory requirement, and Genome confidence interval. Bloomberg AIM: API wrapper scores 64/100, full replacement scores 28/100 (three failures explain why). SQL Server DW: Azure SQL migration scores 78/100. Salesforce FSC: optimise existing scores 81/100. Shall I walk through the Bloomberg AIM scoring in detail — it is the most consequential decision?"
          },
          {
            name: 'Vendor Selection',
            description: 'Vendors scored against your actual data — not analyst rankings',
            opening_prompt: 'Vendor selection for technology modernisation is where consulting firms most often add least value — they use analyst rankings (Gartner, Forrester) that are not calibrated to your specific situation. AbarVa scores vendors against your data: your data readiness, your internal capability, your regulatory requirements, your migration history. For the Bloomberg AIM API wrapper, three vendors are relevant. For the SQL Server DW migration, two. I want to walk through the scoring methodology before giving you the recommendations — so you can see exactly why one vendor scores higher than another. Does that transparency matter to your CIO?'
          },
          {
            name: 'Business Case',
            description: 'Maintenance cost reduction + capability gain — three scenarios',
            opening_prompt: 'The business case for technology modernisation is different from the other solutions — the primary value is not a direct saving but a reduction in risk and an unlock of capability. Bloomberg AIM API wrapper: maintenance cost reduction £2-4M annually, migration risk eliminated, internal capability built over 24 months. Capability unlocked: 26 AI initiatives that currently cannot reach production because of AIM data latency. The question for the CFO is not just "what does this cost" but "what does it unlock" — because the AI portfolio value is the bigger number. Shall I build the business case with both the direct saving and the unlocked AI value?'
          }
        ]
      },
      3: {
        number: 3,
        name: 'Execution Roadmap & Baseline',
        description: 'Sequence the modernisation. Lock maintenance cost baseline. Agree governance model.',
        objective: 'Lock the baseline. Governance model agreed. Fee structure tied to milestones and maintenance reduction.',
        output_type: 'execution_roadmap',
        output_title: 'Execution Roadmap & Baseline Agreement',
        gate_description: 'CIO and CFO sign baseline',
        gate_approver: 'board',
        unlock_condition: 'Solution Design approved',
        typical_duration_weeks: { min: 1, max: 2 },
        default_workstreams: [
          {
            name: 'Baseline Lock',
            description: 'Annual maintenance cost, system ages, migration history — locked Day 0',
            opening_prompt: 'The technology modernisation baseline locks four metrics. Annual maintenance cost: £8.4M Bloomberg AIM + £0.4M SQL Server DW + adjacent costs. Migration risk score: calculated from the 14 customisations and 28-year data age. Vendor dependency ratio: percentage of technology changes requiring vendor approval. Data pipeline lag: 3-day lag from the manual SQL Server DW process. These are the starting points. If maintenance costs reduce, we calculate the saving against this baseline and trigger the fee. Are these the right metrics — or are there technology costs not captured in these files?'
          },
          {
            name: 'Governance Model',
            description: 'Who owns modernisation decisions — lessons from the 3 prior failures',
            opening_prompt: 'Every prior modernisation failed without a named executive sponsor who survived the programme duration. The governance model for this programme must address that directly. I want to propose a governance structure that prevents the F002 pattern from repeating. It requires one thing above all else: a named CXO who owns the outcome, not just the programme — and whose performance review is tied to the modernisation milestone, not the programme launch. Who in the current leadership team would you put in that role?'
          }
        ]
      },
      4: {
        number: 4,
        name: 'Execution & Modernisation Tracking',
        description: 'Milestones tracked monthly. Maintenance cost reducing. Fee on verified milestones.',
        objective: 'Execute the modernisation. Track milestones. Report monthly. Fee on verified delivery.',
        output_type: 'outcome_report',
        output_title: 'Monthly Modernisation Report',
        gate_description: 'Quarterly board review',
        gate_approver: 'board',
        unlock_condition: 'Baseline signed',
        typical_duration_weeks: { min: 52, max: 52 },
        default_workstreams: [
          {
            name: 'Milestone Tracking',
            description: 'Wave milestones — completed, at risk, behind',
            opening_prompt: 'Month {month} milestone check. Three milestones due.'
          },
          {
            name: 'Cost Tracking',
            description: 'Annual maintenance cost trending vs baseline',
            opening_prompt: 'Current maintenance cost vs baseline.'
          },
          {
            name: 'Capability Tracking',
            description: 'Internal team capability growing — vendor dependency reducing',
            opening_prompt: 'Vendor dependency ratio this month vs baseline.'
          }
        ]
      }
    }
  }
}
