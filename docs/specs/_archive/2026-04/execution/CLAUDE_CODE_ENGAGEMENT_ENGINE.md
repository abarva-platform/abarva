# AbarVa — Engagement Engine Build Spec
# AI-Powered Delivery · Arcturus Financial Group
# Two separate experiences: Maestro Workspace + Client Portal

---

## WHAT WE ARE BUILDING

A phase-gated engagement engine. Not a wizard. Not a chat widget.
A persistent workspace that lives for weeks — like a deal room
for transformation engagements.

Two completely separate experiences:
1. Maestro Workspace (/engage/[clientId]/[solution]) — internal power tool
2. Client Portal (/portal/[solution]) — clean external client experience

First build: AI-Powered Delivery for Arcturus Financial Group.
Pattern extends to all 4 solutions and all clients.

---

## PART 1 — DATABASE SCHEMA

Run these migrations in Supabase:

```sql
-- Core engagement record
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  solution TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_phase INT DEFAULT 0,
  maestro_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(client_id, solution)
);

-- Phase records — one per phase per engagement
CREATE TABLE engagement_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'locked',
  -- locked | in_progress | awaiting_maestro_review |
  -- published_to_client | awaiting_client_approval |
  -- disputed | refining | approved | complete
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_by_role TEXT,
  dispute_count INT DEFAULT 0,
  UNIQUE(engagement_id, phase_number)
);

-- Workstreams within a phase
-- e.g. Phase 1 has: Consulting Audit, Knowledge Risk, Leadership
CREATE TABLE phase_workstreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages within a workstream
-- Unlimited — no cap on conversation length
CREATE TABLE workstream_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID REFERENCES phase_workstreams(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  -- 'maestro_ai' | 'maestro' | 'client' | 'system'
  actor_name TEXT,
  actor_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- { genome_patterns_surfaced: [], findings_updated: [], files_analysed: [] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_internal BOOLEAN DEFAULT false
  -- internal = only Maestro sees, not published to client
);

-- Findings — first class objects, not embedded in chat
CREATE TABLE phase_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  workstream_id UUID REFERENCES phase_workstreams(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  source_files TEXT[],
  -- array of file names: ['ARC-D01', 'ARC-D02']
  genome_pattern TEXT,
  -- 'F001', 'F002' etc
  genome_rate DECIMAL,
  severity TEXT,
  -- 'critical' | 'high' | 'medium' | 'low' | 'positive'
  status TEXT DEFAULT 'draft',
  -- 'draft' | 'confirmed' | 'disputed' | 'revised' | 'removed'
  is_published BOOLEAN DEFAULT false,
  -- true = visible to client
  display_order INT DEFAULT 0,
  created_by TEXT,
  -- 'maestro_ai' | maestro user ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding versions — every change tracked
CREATE TABLE finding_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES phase_findings(id) ON DELETE CASCADE,
  version INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  change_reason TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding comments — threaded, per finding
CREATE TABLE finding_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES phase_findings(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase output documents
CREATE TABLE phase_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,
  -- 'readiness_scorecard' | 'situation_brief' |
  -- 'solution_design' | 'execution_roadmap' | 'outcome_report'
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  -- Structured content — different schema per output type
  version INT DEFAULT 1,
  status TEXT DEFAULT 'draft',
  -- 'draft' | 'published' | 'approved' | 'superseded'
  pdf_url TEXT,
  published_at TIMESTAMPTZ,
  published_by TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Output document versions
CREATE TABLE output_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_id UUID REFERENCES phase_outputs(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  pdf_url TEXT,
  published_by TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

-- Output comments (client comments on published document)
CREATE TABLE output_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_id UUID REFERENCES phase_outputs(id) ON DELETE CASCADE,
  section TEXT,
  -- which section of the document
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase approval audit trail
CREATE TABLE phase_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  -- 'approved' | 'disputed' | 'refined' | 'escalated'
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  comment TEXT,
  output_version INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files uploaded during engagement (mid-phase uploads)
CREATE TABLE engagement_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES engagement_phases(id),
  workstream_id UUID REFERENCES phase_workstreams(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL,
  analysis_status TEXT DEFAULT 'pending',
  -- 'pending' | 'analysed' | 'failed'
  analysis_result JSONB,
  findings_updated TEXT[],
  -- IDs of findings updated by this file
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genome pattern matches per engagement
CREATE TABLE genome_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  pattern_code TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  failure_rate DECIMAL,
  evidence TEXT NOT NULL,
  confidence TEXT NOT NULL,
  -- 'confirmed' | 'probable' | 'possible'
  phase_identified INT,
  source_files TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, pattern_code)
);

-- Engagement participants
CREATE TABLE engagement_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  -- 'maestro' | 'client_cxo' | 'client_cfo' | 'client_cio' | 'observer'
  notify_on TEXT[],
  -- ['phase_published', 'finding_disputed', 'approval_needed']
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log — everything that happens
CREATE TABLE engagement_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES engagement_phases(id),
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  -- 'phase_started' | 'file_uploaded' | 'finding_added' |
  -- 'finding_disputed' | 'output_published' | 'output_approved' |
  -- 'output_disputed' | 'phase_approved' | 'phase_unlocked' |
  -- 'message_sent' | 'workstream_created'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 0 readiness scores
CREATE TABLE phase0_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  solution TEXT NOT NULL,
  dimension TEXT NOT NULL,
  score INT NOT NULL,
  evidence TEXT,
  missing_data TEXT,
  what_it_unlocks TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Baseline agreement (Phase 3 — locked, immutable)
CREATE TABLE engagement_baseline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  baseline_value TEXT NOT NULL,
  baseline_source TEXT NOT NULL,
  measurement_method TEXT NOT NULL,
  target_value TEXT NOT NULL,
  target_date DATE,
  fee_trigger DECIMAL,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  is_locked BOOLEAN DEFAULT false
);
```

---

## PART 2 — SOLUTION CONFIGURATION

Create: `lib/solutions/solution-config.ts`

```typescript
export type SolutionKey = 'delivery' | 'pdlc' | 'margin' | 'tech'
export type PhaseKey = 0 | 1 | 2 | 3 | 4

export interface SolutionConfig {
  key: SolutionKey
  name: string
  intelligence_name: string
  cxo_question: string
  tagline: string
  phases: Record<PhaseKey, PhaseConfig>
  datasets: Record<string, string[]>  // clientId -> file names
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
  gate_approver: string  // 'maestro' | 'client_cxo' | 'client_cfo' | 'board'
  unlock_condition: string
  typical_duration_weeks: { min: number; max: number }
}

export interface WorkstreamTemplate {
  name: string
  description: string
  opening_prompt: string  // what the AI says to open this workstream
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
            opening_prompt: 'The recovery range from your consulting footprint is £16-28M annually, based on Genome pattern F001 validated across 47 similar asset management engagements. I want to build a business case your CFO will approve — which means three scenarios (conservative, base, optimistic) with every assumption traceable. Before I generate the model, I need to understand your CFO\'s primary concern: is it the size of the recovery, the confidence interval, or the timeline to first verified saving?'
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
            opening_prompt: 'Month {month} actuals are due. I need the current values for each baseline metric. I will calculate the variance, update the RAG status, and generate the Monthly Outcome Report. Let\'s start with the most important metric: current annual consulting spend (annualised from this month\'s invoices).'
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
      // Same phase structure — different workstreams and prompts
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
            opening_prompt: 'Three failed modernisation attempts on Bloomberg AIM tell us something important: the problem is not the vendor — it is the approach. Full replacement has failed three times because the 14 customisations cannot be replicated without Bloomberg. The API wrapper approach — wrapping AIM\'s functionality in an abstraction layer that internal teams can govern — has not been tried. It reduces vendor dependency without the migration risk. I want to understand: what is the single Bloomberg AIM customisation that, if it could be governed internally, would change the situation most?'
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
            opening_prompt: 'For PDLC, the fee triggers are different from the Delivery solution. We track two things: AI initiatives reaching production (£X per initiative verified), and cycle time reduction (% of verified reduction × annual value). The first fee trigger is at month 3: first AI initiative in production with documented baseline. What should that first trigger be worth to make the programme feel real to your CFO?'
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
            opening_prompt: 'This month\'s engagement adds to the Genome. What patterns have we validated or refined?'
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
          name: 'Financial Data Analysis',
          description: 'Automated financial analysis',
          opening_prompt: 'Analysing financial datasets...'
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
            opening_prompt: 'For each intervention, we need three scenarios. Conservative: assumes implementation challenges, partial adoption, conservative Genome recovery rate. Base: assumes normal execution, full Genome recovery rate. Optimistic: assumes fast execution and favourable conditions. Your CFO needs to see all three — not because we expect the worst, but because a CFO who approves a programme based on the optimistic scenario and gets the conservative one will lose confidence in the methodology. What scenario does your CFO typically anchor on?'
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
            opening_prompt: 'Not every aging system needs replacing. The right question is: what is the business outcome you need from this system — and what is the cheapest, lowest-risk path to that outcome? For Bloomberg AIM, full replacement has failed three times. But an API wrapper approach — wrapping AIM\'s functionality so internal teams can govern it without vendor dependency — has not been tried. For SQL Server DW (EOL passed, running without security patches), immediate migration is non-negotiable — but the destination matters. For Salesforce FSC, the system is fine — 44% adoption is the problem, not the technology. Let me score each system. Do you have a view on which one feels most urgent to your board right now?'
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
            opening_prompt: 'For each system we identified as requiring a decision, I have scored four options against your data: full replacement, API wrapper, optimise existing, stay and renegotiate. The scoring criteria are: data readiness, internal capability to govern, vendor lock-in risk, regulatory requirement, and Genome confidence interval. Bloomberg AIM: API wrapper scores 64/100, full replacement scores 28/100 (three failures explain why). SQL Server DW: Azure SQL migration scores 78/100. Salesforce FSC: optimise existing scores 81/100. Shall I walk through the Bloomberg AIM scoring in detail — it is the most consequential decision?'
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
```

---

## PART 3 — PROMPTING ENGINE

Create: `lib/prompts/engagement-prompts.ts`

```typescript
import { SOLUTIONS, SolutionKey, PhaseKey } from '../solutions/solution-config'

export interface PromptContext {
  clientName: string
  clientId: string
  solution: SolutionKey
  phase: PhaseKey
  workstreamName: string
  phase0Output?: any        // Phase 0 scorecard
  previousPhaseOutput?: any // Prior phase approved output
  genomeMatches?: any[]     // Confirmed genome patterns
  datasetSummaries?: any    // Extracted from uploaded files
  conversationHistory?: any[] // Prior messages in this workstream
  maestroNotes?: string     // Any Maestro-added context
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const solution = SOLUTIONS[ctx.solution]
  const phase = solution.phases[ctx.phase]

  return `
You are a senior Maestro at AbarVa — an enterprise AI transformation platform.
You are supporting a human Maestro conducting a ${solution.name} engagement at ${ctx.clientName}.

YOUR ROLE:
You are the most knowledgeable analyst on the Maestro's team.
You have read every uploaded file.
You know every Genome pattern.
You remember every prior conversation in this engagement.
You augment the Maestro — you never replace them.
The human Maestro directs. You analyse, surface insights, draft outputs, and ask the right questions.
Nothing you produce is published to the client without the Maestro reviewing and approving it.

CURRENT PHASE: Phase ${ctx.phase} — ${phase.name}
WORKSTREAM: ${ctx.workstreamName}

PHASE OBJECTIVE:
${phase.objective}

SOLUTION CONTEXT (${solution.name}):
CXO Question this solution answers: "${solution.cxo_question}"
Genome patterns this solution screens for: ${solution.genome_patterns.join(', ')}
Fee model: ${solution.fee_model_description}

${ctx.phase0Output ? `
PHASE 0 FINDINGS (readiness assessment):
${JSON.stringify(ctx.phase0Output, null, 2)}
` : ''}

${ctx.previousPhaseOutput ? `
PRIOR PHASE OUTPUT (approved by client):
${JSON.stringify(ctx.previousPhaseOutput, null, 2)}
` : ''}

${ctx.genomeMatches && ctx.genomeMatches.length > 0 ? `
CONFIRMED GENOME PATTERNS:
${ctx.genomeMatches.map(g => `${g.pattern_code} (${Math.round(g.failure_rate * 100)}%): ${g.pattern_name}
Evidence: ${g.evidence}
Confidence: ${g.confidence}`).join('\n\n')}
` : ''}

${ctx.datasetSummaries ? `
CLIENT DATA LOADED:
${JSON.stringify(ctx.datasetSummaries, null, 2)}
` : ''}

${ctx.maestroNotes ? `
MAESTRO NOTES (internal context):
${ctx.maestroNotes}
` : ''}

CONVERSATION GUIDELINES:
1. Be specific. Every insight should be traceable to a file name and a data point.
2. Be direct. No consulting hedging. State what you see.
3. Surface contradictions explicitly. If what the client says contradicts the data, say so.
4. Ask one question at a time when gathering information.
5. Reference Genome patterns by code when relevant (e.g. "This matches F002 — 84% failure rate").
6. When you have enough context to produce the phase output, say so explicitly.
7. Mark insights with source citations: [ARC-D01], [Genome: F001], [Leadership data]
8. When you produce a draft of the output document, end with OUTPUT_READY
9. Internal analysis (marked [INTERNAL]) is visible only to the Maestro, not the client.

TONE: Senior consultant. Direct. Evidence-based. Specific. 
No generic advice. Every statement should be worth £500/hour.
`
}

export function buildPhase0Prompt(
  clientName: string,
  solution: SolutionKey,
  datasetSummaries: any
): string {
  const sol = SOLUTIONS[solution]

  return `
You are AbarVa's Phase 0 readiness engine.
Analyse the uploaded datasets for ${clientName} and produce a readiness scorecard
for a ${sol.name} engagement.

DIMENSIONS TO SCORE (0-100 each):
${sol.phase0_dimensions.map(d => `- ${d}`).join('\n')}

GENOME PATTERNS TO SCREEN FOR:
${sol.genome_patterns.map(p => `- ${p}`).join('\n')}

AVAILABLE DATASETS:
${JSON.stringify(datasetSummaries, null, 2)}

Produce a JSON response with this exact structure:
{
  "overall_score": <0-100>,
  "overall_verdict": "ready | partial | insufficient",
  "verdict_summary": "<2-3 sentences — what this means for starting the engagement>",
  "dimension_scores": {
    "<dimension_name>": {
      "score": <0-100>,
      "evidence": "<specific data points from uploaded files>",
      "missing_data": "<what would improve this score>",
      "what_it_unlocks": "<what becomes possible with the missing data>"
    }
  },
  "genome_matches": [
    {
      "code": "<F001 etc>",
      "name": "<pattern name>",
      "failure_rate": <0.0-1.0>,
      "confidence": "confirmed | probable | possible",
      "evidence": "<specific evidence from the data>",
      "source_files": ["<file names>"]
    }
  ],
  "top_findings": [
    {
      "title": "<headline — specific, not generic>",
      "description": "<2-3 sentences — specific data, specific cost>",
      "severity": "critical | high | medium | positive",
      "source_files": ["<file names>"],
      "genome_pattern": "<F001 etc or null>"
    }
  ],
  "missing_data": [
    {
      "category": "<what type of data>",
      "what_it_unlocks": "<what analysis becomes possible>",
      "priority": "blocking | important | nice_to_have"
    }
  ],
  "recommended_action": "<single most important next step>"
}

Be specific. Every finding should be traceable to a data point in the uploaded files.
Do not produce generic observations. If the data supports a specific number, use it.
`
}

export function buildOutputGenerationPrompt(
  outputType: string,
  phase: PhaseKey,
  ctx: PromptContext,
  workstreamSummaries: string[]
): string {

  const outputSchemas: Record<string, string> = {
    situation_brief: `{
  "headline": "<single most important finding — specific, quantified>",
  "contradiction_map": [
    {
      "commitment": "<what was committed>",
      "reality": "<what the data shows>",
      "gap": "<quantified difference>",
      "source": "<data source>"
    }
  ],
  "key_findings": [
    {
      "title": "<specific headline>",
      "description": "<evidence-based, quantified>",
      "severity": "critical|high|medium",
      "genome_pattern": "<code or null>",
      "source_files": ["<files>"]
    }
  ],
  "what_is_working": [
    {
      "title": "<genuine positive>",
      "description": "<why this matters>",
      "implication": "<how this is built on>"
    }
  ],
  "what_is_at_risk": {
    "if_nothing_changes": "<specific consequence, quantified>",
    "timeline": "<when the risk materialises>",
    "financial_exposure": "<£/$ amount>"
  },
  "recovery_range": {
    "conservative": "<£/$ pa>",
    "base": "<£/$ pa>",
    "optimistic": "<£/$ pa>",
    "confidence": "<% — Genome validated>",
    "methodology": "<how calculated>"
  },
  "recommended_first_action": "<single highest-value action within 30 days>"
}`,

    solution_design: `{
  "target_state": {
    "headline": "<what success looks like in 12 months>",
    "metrics": [
      { "metric": "<name>", "current": "<value>", "target": "<value>", "timeline": "<when>" }
    ]
  },
  "interventions": [
    {
      "name": "<intervention name>",
      "description": "<what it is>",
      "sequence_rationale": "<why this order — what it unlocks>",
      "recovery_range": { "conservative": "", "base": "", "optimistic": "" },
      "time_to_first_saving": "<months>",
      "risk": "<what could go wrong>",
      "mitigation": "<how we manage it>",
      "wave": 1
    }
  ],
  "business_case": {
    "total_recoverable_annual": { "conservative": "", "base": "", "optimistic": "" },
    "abarva_fee": { "conservative": "", "base": "", "optimistic": "" },
    "client_net_benefit": { "conservative": "", "base": "", "optimistic": "" },
    "payback_months": "<number>",
    "genome_confidence": "<% — based on N similar engagements>"
  },
  "vendor_verdicts": [
    { "vendor": "", "verdict": "retain|renegotiate|exit", "rationale": "", "transition_plan": "" }
  ],
  "maestro_team": [
    {
      "role": "<Maestro role name>",
      "scope": "<what they own>",
      "replaces": "<who/what they replace>",
      "annual_cost_replaced": "<£/$M>",
      "wave": 1,
      "success_metric": "<how we know this Maestro is delivering>"
    }
  ]
}`,

    execution_roadmap: `{
  "baseline_metrics": [
    {
      "metric": "<name>",
      "current_value": "<from uploaded data>",
      "source": "<file name>",
      "measurement_method": "<how verified>",
      "target_value": "<from Phase 2>",
      "verification": "<who confirms, how often>"
    }
  ],
  "waves": [
    {
      "wave": 1,
      "timeline": "Days 1-90",
      "milestones": [
        {
          "milestone": "<specific, measurable>",
          "owner": "<Maestro role>",
          "due": "<specific date or day>",
          "fee_trigger": "<£/$ if applicable>"
        }
      ],
      "gate": "<what must be true to begin Wave 2>"
    }
  ],
  "fee_schedule": [
    {
      "trigger": "<milestone description>",
      "condition": "<verified by whom, how>",
      "amount": "<£/$>",
      "estimated_date": "<month>"
    }
  ],
  "risk_register": [
    {
      "risk": "<description>",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "<specific action>"
    }
  ],
  "baseline_lock_statement": "This baseline is immutable from the date of signature. Any change requires board approval."
}`,

    outcome_report: `{
  "month": "<Month Year>",
  "overall_rag": "green|amber|red",
  "scorecard": [
    {
      "metric": "<name>",
      "baseline": "<locked value>",
      "current": "<this month's actual>",
      "target": "<target value>",
      "trend": "improving|stable|declining",
      "rag": "green|amber|red",
      "variance_explanation": "<why>"
    }
  ],
  "milestones": {
    "completed_this_month": ["<milestone descriptions>"],
    "at_risk": [{ "milestone": "", "issue": "", "recovery_plan": "" }],
    "behind_schedule": [{ "milestone": "", "delay": "", "revised_date": "", "impact": "" }]
  },
  "fee_calculation": {
    "savings_verified_this_month": "<£/$>",
    "fee_triggered_this_month": "<£/$>",
    "cumulative_fee_to_date": "<£/$>",
    "remaining_potential": "<£/$>"
  },
  "knowledge_transfer": [
    { "domain": "", "capability_transferred": "", "internal_team_score": "" }
  ],
  "next_30_days": {
    "maestro_focus": ["<what the Maestro will do>"],
    "decisions_required": ["<from client>"],
    "data_needed": ["<what the Maestro needs>"]
  }
}`
  }

  return `
You are generating a ${outputType.replace('_', ' ')} for ${ctx.clientName}.
This is a Phase ${ctx.phase} output for the ${SOLUTIONS[ctx.solution].name} engagement.

WORKSTREAM CONVERSATIONS SUMMARY:
${workstreamSummaries.join('\n\n---\n\n')}

${ctx.phase0Output ? `PHASE 0 FINDINGS:\n${JSON.stringify(ctx.phase0Output, null, 2)}` : ''}
${ctx.previousPhaseOutput ? `PREVIOUS PHASE OUTPUT:\n${JSON.stringify(ctx.previousPhaseOutput, null, 2)}` : ''}
${ctx.genomeMatches ? `GENOME MATCHES:\n${JSON.stringify(ctx.genomeMatches, null, 2)}` : ''}

Produce the ${outputType.replace('_', ' ')} as a JSON object matching this schema exactly:
${outputSchemas[outputType] || '{}'}

REQUIREMENTS:
- Every finding must be traceable to a specific data point or conversation exchange
- Every number must have a source
- No generic observations — everything specific to ${ctx.clientName}
- Recovery ranges must reference the Genome confidence level
- Tone: what a senior McKinsey partner would produce, but with data the client has never seen organised this way
- The client should read this and think: "How did they know that?"
`
}
```

---

## PART 4 — API ROUTES

### POST /api/engage/start
```typescript
// Creates engagement + phase 0 record + triggers Phase 0 analysis
// Returns: { engagementId, phase0Id }
```

### GET /api/engage/[clientId]/[solution]
```typescript
// Returns full engagement with phases, findings, genome matches
```

### POST /api/engage/workstream/[workstreamId]/message
```typescript
// Adds message, calls Claude API with full context, returns response
// Context assembled: phase0Output + previousPhaseOutput + 
//   genomeMatches + datasetSummaries + conversationHistory
// No limit on conversation length
// Each response checks for OUTPUT_READY signal
```

### POST /api/engage/phase/[phaseId]/generate-output
```typescript
// Summarises all workstream conversations
// Calls Claude API with output generation prompt
// Returns structured JSON output
// Does NOT publish — Maestro must review and publish separately
```

### POST /api/engage/phase/[phaseId]/publish-output
```typescript
// Auth: maestro/admin only
// Saves to phase_outputs
// Generates PDF (use PDF skill)
// Notifies client
// Updates phase status to 'published_to_client'
```

### POST /api/engage/phase/[phaseId]/approve
```typescript
// Auth: client role for approval, maestro for refinement
// action: 'approved' | 'disputed'
// If approved: updates phase status to 'approved', unlocks next phase
// If disputed: updates to 'disputed', notifies Maestro
```

### POST /api/engage/finding/[findingId]/comment
```typescript
// Adds comment to finding
// Notifies relevant parties
```

### POST /api/engage/phase/[phaseId]/upload
```typescript
// Mid-phase file upload (client or Maestro)
// Analyses file, updates findings, notifies Maestro
```

---

## PART 5 — MAESTRO WORKSPACE UI

Route: `/engage/[clientId]/[solution]`
Auth: admin or maestro role only

### Layout
```
Header bar: Client name + Solution name + Phase status badge
Left sidebar (240px): Phase navigator + Genome matches + Files
Main panel: Active phase workspace (workstreams + chat + findings)
Right panel (320px): Output document builder
```

### Phase Navigator (left sidebar)
Each phase shows:
- Phase number + name
- Status badge (colour-coded)
- Locked phases show unlock condition
- Active phase highlighted

### Workstream Tabs (main panel top)
- Tab per workstream
- "+ Add workstream" tab
- Active tab shows conversation

### Conversation (main panel left ~60%)
- Scrollable chat history — no limit
- Messages from: Maestro AI (teal), human Maestro (white), client (blue)
- [INTERNAL] flag on Maestro-only messages
- File attachment inline
- Source citations displayed as chips: [ARC-D01]
- Typing indicator when AI is responding
- Input: textarea + send button + attach file button + @mention

### Finding Cards (main panel right ~40%)
- Card per finding
- Title + severity badge + genome pattern chip
- Status: draft | confirmed | disputed | revised
- Expand for full description + evidence + source files
- Comment thread per finding
- Published badge (visible to client)
- Controls: Confirm | Dispute | Remove | Publish to client

### Output Document Builder (right panel)
- Section by section view of the output document
- Each section has: AI draft + Maestro edit capability
- "Generate draft" button → calls Phase output generation API
- "Publish to client" button → triggers notification
- Version history: V1, V2, V3
- Download PDF button

### Genome Panel (left sidebar below phases)
- Confirmed patterns shown as cards
- Code + name + failure rate + confidence
- Evidence expandable
- "Add pattern manually" for Maestro override

### Activity Log (left sidebar, collapsible)
- Timeline of everything that has happened
- Upload, message, finding change, publish, approve

---

## PART 6 — CLIENT PORTAL UI

Route: `/portal/[solution]`
Auth: client role only (af@abarva.com → arcturus, mh+clerk_test → meridian)

### Layout
Clean. Minimal. Premium. Not a tool — a portal.
AbarVa nav at top. Full-width content. No sidebar clutter.

### Engagement Timeline (top)
Progress bar showing 5 phases
Each phase: name + status
Current phase highlighted

### Active Phase Content
Shows only what Maestro has published.
Nothing else visible.

If nothing published yet:
"Your Maestro is preparing the Phase [X] analysis. 
You will be notified when it is ready for your review."

If output published:
- Document title + version + published date
- Full document in structured, readable format
- Each section clearly separated
- "Comment on this section" link per section

### Comment System
Client can comment on any section.
Comment goes to Maestro immediately.
Maestro sees in their workspace.
Comments resolved by Maestro.

### Approval Controls (bottom of published document)
Two clear CTAs:
- "Approve — this accurately describes our situation. Continue to Phase [X+1]."
- "I need to flag something — [text field]"

On approve: phase moves to approved, next phase unlocks in Maestro workspace
On dispute: Maestro notified, document goes back to draft

### File Upload (available throughout)
"Share additional context with your Maestro"
Any file, any phase.
Maestro notified immediately.
File analysed if Phase 0 or Phase 1.

### Phase history
Completed phases: collapsed, but expandable
Download PDF button on each completed phase output

### Notification preferences
"Notify me by email when: [options]"

---

## PART 7 — PHASE 0 DATASET EXTRACTION

For each client, we need to extract key signals from uploaded datasets
to feed into the Phase 0 scoring and Phase 1 prompts.

Create: `lib/dataset-extractor.ts`

For now, hardcode the extraction per known file name.
Later: use Claude to extract dynamically from any file.

```typescript
export async function extractDatasetSummaries(
  clientId: string,
  solution: string,
  uploadedFiles: string[]
): Promise<Record<string, any>> {
  
  // Arcturus Delivery
  if (clientId === 'arcturus' && solution === 'delivery') {
    return {
      consulting_audit: {
        file: 'ARC-D01',
        total_annual_spend_m: 42.0,
        vendor_count: 10,
        avg_kt_score_pct: 24,
        worst_kt: { vendor: 'Bloomberg LP', score: 8 },
        best_kt: { vendor: 'AWS ProServe', score: 62 },
        failed_engagements: ['Google PSO — 22% delivered', 'McKinsey — 55% delivered'],
        total_recoverable_m: 22.4,
        critical_vendors: ['Bloomberg LP', 'Wipro', 'Contractors (EA)']
      },
      knowledge_risk: {
        file: 'ARC-D02',
        critical_domains: 5,  // score > 80
        highest_risk: { domain: 'Bloomberg AIM customisation logic', score: 98 },
        vendor_owned_knowledge: [
          'Bloomberg AIM customisation logic (14 customisations)',
          'Wipro FSC customisation code',
          'Google PSO MLOps design (engagement ended)'
        ],
        no_retention_plan: 7
      },
      engineering_org: {
        file: 'ARC-C01',
        total_headcount: 157,
        fte: 79,
        contractors: 37,
        consulting: 67,
        vendor_dependency_ratio: 0.66,
        critical_vacant_roles: ['VP Engineering Data', 'CDO'],
        squads_vendor_dependent: ['OMS Core', 'Client Data Platform', 'Digital Innovation Lab']
      },
      leadership: {
        file: 'ARC-C03',
        cdo_vacant_months: 11,
        initiatives_blocked: 14,
        governance_council_status: 'Not constituted',
        critical_risks: ['CDO vacancy', 'Contractor in EA permanent role', 'AI governance absent']
      }
    }
  }

  // Meridian Delivery
  if (clientId === 'meridian' && solution === 'delivery') {
    return {
      consulting_audit: {
        file: 'MER-D01',
        total_annual_spend_m: 25.4,
        vendor_count: 8,
        avg_kt_score_pct: 34,
        worst_kt: { vendor: 'Ensemble Health Partners', score: 18 },
        critical_vendors: ['Ensemble Health Partners', 'Various contractors'],
        sla_penalties_enforceable_m: 8.0,
        total_recoverable_m: 10.6
      },
      consulting_contracts: {
        file: 'MER-C02',
        ensemble_annual_m: 14.2,
        ensemble_denial_rate: 0.182,
        ensemble_benchmark: 0.120,
        ensemble_contract_end: '2026-06-30'
      }
    }
  }

  // Add other combinations as needed
  return {}
}
```

---

## PART 8 — FIRST BUILD SCOPE

Build the complete system for:
- Client: Arcturus Financial Group (arcturus)
- Solution: AI-Powered Delivery (delivery)

Everything else (other clients, other solutions) uses the same 
code — just different solution config and dataset summaries.

### Specific Arcturus Delivery Phase 0 hardcoded output:

```typescript
export const ARCTURUS_DELIVERY_PHASE0: Phase0Output = {
  overall_score: 21,
  overall_verdict: 'partial',
  verdict_summary: 'Sufficient data to begin Phase 1 with high confidence. Three Genome patterns confirmed. Delivery velocity data (sprint metrics) would sharpen the cycle time analysis. Financial breakdown would sharpen the recovery range.',
  
  dimension_scores: {
    consulting_dependency: {
      score: 22,
      evidence: '10 active consulting relationships. £42M annual spend. Average KT score 24%. Wipro KT 15%, Bloomberg LP KT 8%, Google PSO KT 5% (engagement ended with no handover).',
      missing_data: 'Detailed vendor SLA performance actuals',
      what_it_unlocks: 'Precise SLA penalty calculations and renegotiation leverage'
    },
    knowledge_retention: {
      score: 18,
      evidence: 'Knowledge risk scores 55-98 across 10 domains. 5 domains at Critical (>80). Bloomberg AIM customisation logic entirely vendor-owned — 14 customisations, no internal documentation. Google PSO MLOps design walked out when engagement ended.',
      missing_data: 'Internal team competency assessments per squad',
      what_it_unlocks: 'Targeted capability-building programme per squad'
    },
    delivery_performance: {
      score: 31,
      evidence: 'Average cycle time 127 days (OMS squads) against 14-day industry benchmark for equivalent changes. AI/ML Platform squad: 0 deployments in 12 months. OMS squads: vendor-controlled release windows — Bloomberg governs all change cycles.',
      missing_data: 'DORA metrics across all squads, story point data',
      what_it_unlocks: 'Precise cycle time baseline for Phase 3 baseline lock'
    },
    internal_capability: {
      score: 19,
      evidence: '47% contractor and consulting ratio across 14 squads. EA function led by contractor — no permanent owner of architecture decisions. VP Engineering Data: contractor in permanent role. Portfolio Analytics: only squad with genuine internal capability.',
      missing_data: 'Individual capability assessments per squad lead',
      what_it_unlocks: 'Targeted internal hiring plan per Maestro workstream'
    },
    leadership_governance: {
      score: 15,
      evidence: 'CDO vacant 11 months. AI Governance Council not constituted. 14 AI initiatives awaiting governance sign-off. VP Engineering Data is a contractor with no knowledge retention obligation.',
      missing_data: 'Board minutes on AI governance decisions',
      what_it_unlocks: 'Understanding of why CDO role has been vacant 11 months'
    }
  },

  genome_matches: [
    {
      code: 'F001',
      name: 'Vendor dependency without internal capability',
      failure_rate: 0.72,
      confidence: 'confirmed',
      evidence: 'Bloomberg LP engineers own 14 AIM customisations with no internal documentation. Wipro own all Salesforce FSC customisations — internal team cannot deploy without vendor approval. Google PSO engagement ended with 5% KT score — AI/ML platform knowledge has no internal owner.',
      source_files: ['ARC-D01', 'ARC-D02', 'ARC-C01']
    },
    {
      code: 'F002',
      name: 'No named executive sponsor',
      failure_rate: 0.84,
      confidence: 'confirmed',
      evidence: 'CDO vacant 11 months. AI Governance Council cannot convene without CDO. 14 AI initiatives blocked — none have an alternative executive sponsor. VP Engineering Data is a contractor with no delivery accountability.',
      source_files: ['ARC-C03', 'ARC-D02']
    },
    {
      code: 'F009',
      name: 'Pilot purgatory',
      failure_rate: 0.76,
      confidence: 'confirmed',
      evidence: 'Google PSO delivered 22% of agreed scope — engagement ended early. McKinsey delivered 55% of agreed deliverables. Both prior consulting engagements failed to deliver. Credibility deficit will make internal stakeholders sceptical of next programme.',
      source_files: ['ARC-D01']
    }
  ],

  top_findings: [
    {
      title: '£42M consulting spend. Average KT score 24%. Knowledge leaves every Friday.',
      description: '10 consulting relationships at £42M annually. The average knowledge transfer score across all vendors is 24% — meaning 76% of what they know walks out when the contract ends. Wipro (KT 15%) and Bloomberg LP (KT 8%) are the most critical.',
      severity: 'critical',
      source_files: ['ARC-D01', 'ARC-D02'],
      genome_pattern: 'F001'
    },
    {
      title: 'Google PSO engagement ended. MLOps design has no internal owner.',
      description: '£3.5M spent. 22% of scope delivered. The AI/ML platform knowledge — what was designed, what decisions were made, what was built — has no internal owner. The AI/ML Platform squad cannot proceed without rebuilding this context from scratch.',
      severity: 'critical',
      source_files: ['ARC-D01', 'ARC-D02'],
      genome_pattern: 'F001'
    },
    {
      title: 'CDO vacant 11 months. AI Governance Council not constituted.',
      description: '14 AI initiatives await CDO governance sign-off. The AI Governance Council cannot convene without a CDO to chair it. This single vacancy is the most expensive unfilled role in the firm — blocking more annual value than the CDO\'s salary costs.',
      severity: 'critical',
      source_files: ['ARC-C03'],
      genome_pattern: 'F002'
    },
    {
      title: 'Portfolio Analytics: the benchmark that proves the rest is fixable.',
      description: 'Portfolio Analytics delivers at or near industry benchmark — highest velocity, lowest cost per story point, genuine internal capability. This proves the problem is not structural to Arcturus. It is specific to squads with high vendor dependency.',
      severity: 'positive',
      source_files: ['ARC-C01', 'ARC-C05'],
      genome_pattern: null
    }
  ],

  missing_data: [
    {
      category: 'Sprint velocity and DORA metrics (all squads)',
      what_it_unlocks: 'Precise cycle time baseline for Phase 3. Exact deployment frequency vs benchmark.',
      priority: 'important'
    },
    {
      category: 'Vendor SLA performance actuals',
      what_it_unlocks: 'Enforceable SLA penalty calculations. Renegotiation leverage per vendor.',
      priority: 'important'
    }
  ],

  recommended_action: 'Begin Phase 1 with the Consulting Audit workstream. The data is sufficient to conduct a full audit of all 10 vendor relationships. Request sprint velocity data from CIO before Phase 1 completes.'
}
```

---

## PART 9 — QA CHECKLIST

### Maestro Workspace
□ /engage/arcturus/delivery → shows engagement overview
□ Phase 0 auto-runs and shows Arcturus hardcoded scorecard
□ Maestro can approve Phase 0 → Phase 1 unlocks
□ Phase 1 opens with 3 default workstreams
□ Each workstream: opening AI message pre-loaded
□ Chat is unlimited — no message cap
□ AI responses stream in real-time
□ AI cites source files inline [ARC-D01]
□ Maestro can add a workstream manually
□ Maestro can upload a file mid-phase → triggers analysis notification
□ Finding cards appear as AI surfaces insights
□ Maestro can: confirm / dispute / remove / publish findings
□ "Generate draft output" → produces structured Situation Brief
□ Maestro can edit each section of the draft
□ "Publish to client" → notifies client, updates phase status
□ Phase navigator shows correct status for all 5 phases
□ Locked phases show unlock condition
□ Genome panel shows confirmed patterns
□ Activity log shows everything chronologically
□ Download PDF works on any published output

### Client Portal
□ /portal/delivery → shows clean engagement view
□ Shows phase progress correctly
□ "Maestro is preparing..." message before publish
□ Notification when Maestro publishes
□ Published document shows clean, readable, full-width
□ Client can comment on any section
□ Comment goes to Maestro workspace immediately
□ Approve button → phase moves to approved
□ Dispute → text field → Maestro notified
□ Client can upload file at any time
□ Completed phases: collapsible, PDF download
□ Mobile responsive

### Phase Flow
□ Phase 0 → Maestro approves → Phase 1 unlocks
□ Phase 1 → Maestro publishes → Client reviews
□ Client approves → Phase 2 unlocks
□ Client disputes → back to Maestro
□ Phase 2 → same flow
□ Phase 3 → baseline lock flow
□ Phase 4 → monthly cycle

### Cross-Solution
□ /engage/arcturus/pdlc → uses PDLC config (different workstreams)
□ /engage/meridian/delivery → uses Meridian datasets
□ Solution config drives everything — no hardcoded solution logic in UI

---

## COMMIT MESSAGE

feat: phase-gated engagement engine — Maestro Workspace + Client Portal
- Generic engine: works for all 4 solutions via solution-config.ts
- Database: 15 tables covering phases, workstreams, findings, 
  outputs, approvals, uploads, activity, genome matches, baseline
- Maestro Workspace: /engage/[clientId]/[solution]
  Full phase management, unlimited conversation, finding management,
  output generation, PDF export, publish to client
- Client Portal: /portal/[solution]  
  Clean external experience, published-only content, 
  comment + approve + dispute + upload
- Prompting engine: 3-layer context assembly per phase per solution
- First implementation: Arcturus Financial Group × AI-Powered Delivery
- Phase 0 hardcoded for Arcturus Delivery (live data from datasets)
