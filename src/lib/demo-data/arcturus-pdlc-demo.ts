import { DemoEngagement } from './arcturus-delivery-demo'

export const ARCTURUS_PDLC_DEMO: DemoEngagement = {
  engagement_name: 'Arcturus Financial Group × AI-Powered PDLC',
  phases: [

    // ─── PHASE 1: Delivery Bottleneck Diagnosis ───────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Delivery Velocity Analysis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Your sprint velocity data shows something that looks like a delivery problem on the surface but is actually two separate structural failures. **OMS Core squads: 127-day average cycle time** against a 94-day benchmark for equivalent FinServ changes. Every Bloomberg AIM release window adds 14–21 days of involuntary wait — that's structural, not a people problem. **AI/ML Platform squad: 0 deployments in 12 months** against a £1.8M annual spend. That is not a velocity problem — it is an infrastructure problem. There is literally no way to get a model to production from this squad right now. Before we go through the full squad breakdown, I want to understand: does your CIO see these two failure modes as the same problem or separate ones?",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "How does the Bloomberg release window constraint compare to similar firms in the Genome?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Genome pattern **F003 — Vendor Lock-in**: 82% of similar asset managers with Bloomberg AIM production dependencies show cycle time inflation of 18–34 days per release cycle due to vendor-controlled release windows. Arcturus is at 21 days — in the middle of that range. Firms that reduced this constraint did it one of two ways: (1) **API wrapper layer** — abstracting AIM behind an internal service boundary so Bloomberg controls the underlying data, not the release cadence. Reduces vendor-controlled delay to 3–5 days. (2) **Shadow test environment** — replicating Bloomberg data structure with synthetic data for pre-release validation. Removes the 'discover bugs on Bloomberg production' pattern. The firms that tried full decoupling from Bloomberg all failed (F003, 82%). The abstraction layer approach has an 71% success rate in your peer group.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What is the quantified cost of the 0-deployment AI/ML Platform situation?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "The quantification is straightforward and stark. **Direct cost**: £1.8M annual spend on the AI/ML Platform squad, 0 story points to production in 12 months. Cost per deployed model: undefined (division by zero). **Opportunity cost**: 28 AI initiatives are blocked by the same infrastructure gap. Using a conservative Genome estimate of £4.2M average annual value per AI initiative (based on your readmission prediction model as a benchmark), the cumulative value locked in unbuildable infrastructure is **£117M annually**. **Strategic cost**: Arcturus's credit scoring model — a live production model powering 340 daily credit decisions — has not been retrained since 2019. It is degrading silently. The absence of MLOps means you cannot detect the degradation. That is a regulatory risk, not just a performance risk. The Bank of England's SS1/23 guidance specifically requires model validation processes. A model unchanged for 6 years without documented monitoring is a supervisory finding waiting to happen.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What is the fastest path to first production AI deployment?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Fastest path: **AI-023 (Investment Research Summarisation) via AWS Bedrock** — 58 days from today to production. Here is why it is fastest: (1) External data source — uses Bloomberg and Reuters feeds that already go through Kafka. Does not require the internal golden record. (2) AWS Bedrock access is already configured in your Azure-AWS hybrid — no infrastructure procurement. (3) Low regulatory footprint — advisory output to 12 portfolio managers, not a credit or compliance decision. (4) Clear validation methodology — accuracy measured against human analyst output. This is your proof point. If AI-023 reaches production in 58 days with documented ROI, you have the internal evidence to fund the full MLOps foundation. I would sequence the entire programme around this as Wave 1's anchor deliverable. OUTPUT_READY",
            },
          ],
        },
        {
          name: 'AI Initiative Blockers',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "28 AI initiatives. £94M committed. £0 in production delivering verified ROI. I have mapped each initiative against three diagnostic criteria — does it have the data prerequisite, does it have the infrastructure prerequisite, does it have an executive sponsor — and the picture is consistent. **26 of 28 fail on infrastructure**: no MLOps platform means no path to production. **14 of 28 fail on executive sponsor**: the CDO vacancy is the structural cause. **22 of 28 fail on data prerequisite**: the 'golden record' problem. Only AI-023 and AI-026 pass all three criteria — and they pass because they use external data that bypasses the internal golden record gap. Those are your first two waves.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Which initiatives should be killed and which should be accelerated?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**Kill immediately (5 initiatives)**: These have three-way failures with no recovery path. AI-08, AI-11, AI-17, AI-19, AI-22 — all require real-time internal data feeds that do not exist, have no documented business case, and have been in pilot for 18+ months with no output. Kill them, redirect £12M annually. **Accelerate first (2 initiatives)**: AI-023 (Investment Research), AI-026 (Earnings Analysis) — both external data, near production. **Reshape with infrastructure (8 initiatives)**: These are viable once MLOps exists. AI-04 (Credit Scoring), AI-07 (Trade Surveillance), AI-12 (Risk Forecasting) are the most valuable. **Pause pending golden record (13 initiatives)**: Viable but blocked by internal data quality. Can be re-sequenced once Informatica is resolved.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Is the board aware that 0 of 28 are in production?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Based on the board papers in ARC-P01, the answer is **no — not explicitly**. The papers reference '28 active AI initiatives' and 'strong pipeline' without distinguishing between initiatives in development, in pilot, and in production. The distinction matters enormously: 'in development' and 'in production delivering ROI' are not the same category, but the reporting conflates them. This is Genome pattern **F002 (89% failure rate)** — the lack of a named AI executive sponsor creates a reporting environment where there is no single person accountable for the production gap. The CDO appointment does not just unlock 14 initiatives — it creates the governance structure that makes the board report accurate.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Let's focus on what it takes to get AI-04 (credit scoring) retrained and monitored.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**AI-04 path to remediation — 90-day plan**: The credit scoring model (2019 vintage, logistic regression) needs three things. First, **model validation audit** — 10 days. Pull feature importances, compare to current data distributions. Quantify drift. This is the regulatory disclosure document. Second, **retraining pipeline** — 45 days. Build the minimal MLOps infrastructure to retrain the model on current data. Use MLflow for experiment tracking (3-week standalone effort, does not require full platform). Third, **monitoring hook** — 15 days. PSI (Population Stability Index) alerting on input features and output scores. Triggers retraining when drift exceeds 0.2. Total: 90 days, 2 engineers. Cost: approximately £280K. Value: eliminates the regulatory exposure, restores confidence in 340 daily credit decisions. This is the highest-risk remediation item in the portfolio — I would put it on the board agenda this week.",
            },
          ],
        },
        {
          name: 'Engineering Cost vs Output',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Your engineering cost breakdown from ARC-P05 shows extreme variation in cost-per-story-point across squads. **Portfolio Analytics: £3,200/story point** — at benchmark. **Risk Analytics: £2,800/story point** — below benchmark (strong). **OMS Core: £5,100/story point** — 59% above benchmark. Primary driver: Bloomberg release window wait time. **AI/ML Platform: undefined** — 0 story points to production in 12 months on £1.8M spend. The cost analysis makes the case for MLOps investment clearer than any other metric: the AI/ML Platform is the most expensive squad per output unit in the firm by a factor of infinity.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Does the CFO see the cost-per-story-point breakdown?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "No — and this is the pattern. Your engineering reporting goes to the CTO and shows velocity (story points completed per sprint) and headcount cost per squad. It does not show cost-per-story-point, which is the metric that exposes the Bloomberg release window problem and the AI/ML Platform failure. The CFO sees total engineering cost (£82M annually across all squads) but cannot see which squads are delivering value and which are absorbing budget without output. This is why Genome pattern F002 persists — without a CDO who owns this view, no single executive has the right data to make the investment decisions. I would recommend producing a one-page engineering ROI dashboard for the CFO as the first output of Phase 1. It makes the MLOps investment case in 5 numbers.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Build the one-page engineering ROI summary for the CFO.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**Arcturus Engineering ROI Summary — CFO View**\n\n**Total engineering investment**: £82M annually (14 squads, 340 engineers + contractors)\n\n**Output by squad category**:\n- Performing squads (Risk, Portfolio, CRM): £28M spend → at or below benchmark. Keep.\n- Constrained squads (OMS Core, Settlement): £31M spend → 59% above benchmark due to Bloomberg release dependency. Fix the constraint.\n- Failed squads (AI/ML Platform): £12M spend → £0 production output. Rebuild.\n- Maintenance squads (Informatica, MQ): £11M spend → keeping lights on with no new capability. Plan for exit.\n\n**Immediate value recovery**:\n- Kill 5 AI initiatives: £12M/year freed immediately\n- AI/ML Platform to production: unlocks £117M in locked AI initiative value\n- Bloomberg API abstraction: recovers 21 days per release cycle × OMS squad = £4.8M/year in recovered velocity\n\n**Payback**: Investment of £8.4M in Wave 1 (MLOps foundation + Bloomberg abstraction). Return: £134M in unlocked value over 24 months. OUTPUT_READY",
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Situation Brief',
        status: 'approved',
        content: {
          headline: '28 AI initiatives, £94M committed, 0 in production — structural failure, not execution failure',
          contradiction_map: [
            { commitment: 'Board papers: "strong AI pipeline across 28 initiatives"', reality: '0 of 28 in production delivering verified ROI', gap: '28 initiatives, 100% pre-production', source: 'ARC-P01, Board papers 2024' },
            { commitment: 'AI/ML Platform: "building production AI capability"', reality: '£1.8M annual spend, 0 story points to production in 12 months', gap: 'Cost per delivered model: undefined', source: 'ARC-P05, Engineering cost data' },
            { commitment: 'Credit scoring model: "live and effective"', reality: 'Not retrained since 2019 — 6 years of data drift, no monitoring', gap: 'Potential regulatory finding under SS1/23', source: 'ARC-P03, Model inventory' },
          ],
          key_findings: [
            { title: '£94M AI spend, £0 ROI — Genome F008 confirmed at 91%', description: 'Highest confidence pattern match in the Genome. 26 of 28 initiatives blocked by missing MLOps infrastructure. 14 blocked additionally by CDO vacancy. 5 should be killed immediately.', severity: 'critical', genome_pattern: 'F008', source_files: ['ARC-P01', 'ARC-P03'] },
            { title: 'Credit scoring model — 6 years untrained, regulatory exposure', description: 'Model in live production powering 340 daily credit decisions. No retraining since 2019. No monitoring. SS1/23 guidance requires documented validation process. This is a regulatory finding.', severity: 'critical', genome_pattern: 'F001', source_files: ['ARC-P03'] },
            { title: 'OMS squad 35% above velocity benchmark — Bloomberg lock-in', description: '127-day cycle time against 94-day benchmark. Primary driver: Bloomberg release windows adding 21 days per cycle. API abstraction layer would recover £4.8M/year in delivery capacity.', severity: 'high', genome_pattern: 'F003', source_files: ['ARC-C05', 'ARC-P02'] },
            { title: 'AI-023 and AI-026 — 58 days to first production', description: 'Two initiatives pass all three readiness criteria. External data (Bloomberg, Reuters via Kafka). AWS Bedrock configured. Low regulatory footprint. These are the proof points for Wave 1.', severity: 'positive', genome_pattern: null, source_files: ['ARC-P01'] },
          ],
          what_is_working: [
            { title: 'Risk Analytics squad — below benchmark', description: 'Cost-per-story-point £2,800 against £3,200 benchmark. Strong internal capability. No consulting dependency.', implication: 'Model for other squads. Mentor source for MLOps transition.' },
            { title: 'AWS Bedrock access configured', description: 'Azure-AWS hybrid already in place. Removes infrastructure procurement from Wave 1 critical path.', implication: 'AI-023 can be deployed in 58 days without new cloud procurement.' },
          ],
          what_is_at_risk: {
            if_nothing_changes: 'Credit scoring model regulatory finding in next Bank of England review. £94M AI investment continues with £0 return. £117M in locked AI value remains inaccessible. OMS cycle time continues at 127 days.',
            timeline: 'Model validation: 6 months before next scheduled supervisory review. AI portfolio: accumulating £7.8M/month in opportunity cost.',
            financial_exposure: '£117M locked AI value + £4.8M/year OMS velocity loss + regulatory fine risk (BoE SS1/23)',
          },
          recovery_range: { conservative: '£38M', base: '£74M', optimistic: '£112M', confidence: '84%', methodology: 'Genome F001, F008 — 47 comparable FinServ AI remediation engagements' },
          recommended_first_action: 'Appoint interim CDO (30 days) + begin AI-04 model validation audit (this week) + greenlight AI-023 via AWS Bedrock (58-day delivery)'
        }
      }
    },

    // ─── PHASE 2: AI Delivery Prescription ───────────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'MLOps Foundation',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "MLOps assessment shows zero maturity across 11 standard capabilities. No model registry, no serving infrastructure, no training pipeline automation, no monitoring, no feature store. The good news: we do not need to build all 11. **Wave 1 MLOps (90 days, minimum viable)**: MLflow for experiment tracking (3-week effort, standalone), SageMaker endpoints for serving AI-023 and AI-026 via existing AWS Bedrock access, PSI monitoring for AI-04 credit model. Total cost: £420K. This gets 2 initiatives to production and eliminates the regulatory credit model exposure. **Wave 2 MLOps (months 4-9)**: Full training pipeline, feature store, automated retraining. Enables the 8 reshaped initiatives. **Wave 3 MLOps (months 10-18)**: Enterprise platform — Model governance, drift detection fleet, cross-portfolio intelligence.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Build the MLOps Wave 1 delivery plan with week-by-week milestones.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**MLOps Wave 1 — 90-day delivery plan**\n\n**Weeks 1-3 — MLflow foundation**\n- Provision MLflow on existing Azure VM (2 engineers)\n- Migrate AI-023 experiment logs to MLflow\n- Set up experiment tracking for 3 teams\n- Gate: MLflow live with 2+ active experiments\n\n**Weeks 4-8 — AI-023 to production**\n- SageMaker endpoint via AWS Bedrock (1 engineer, 3 weeks)\n- Bloomberg Reuters feed → Kafka → SageMaker pipeline\n- Validation framework: accuracy vs human analyst\n- Portfolio manager UAT (12 users, 1 week)\n- Gate: AI-023 live with documented accuracy baseline\n\n**Weeks 9-11 — Credit model remediation**\n- AI-04 model validation audit (2 engineers)\n- PSI monitoring deployment\n- Retraining on 2024-2025 data\n- Regulatory documentation package\n- Gate: AI-04 monitoring live, validation report complete\n\n**Week 12 — AI-026 to production**\n- Earnings call analysis via same SageMaker pattern\n- Gate: 3 AI initiatives in production\n\n**End state**: 3 AI initiatives in production, credit model monitored, MLflow experiment tracking for entire AI team. Foundation for Wave 2.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What does the CDO appointment unlock specifically?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "The CDO appointment unlocks 14 initiatives directly and the governance structure for all 28. Specifically: (1) **AI portfolio ownership** — someone accountable for the £94M spend and the production gap. Currently this accountability sits nowhere. (2) **Kill list authority** — the 5 initiatives to kill require someone to end them. Without a CDO, every team that owns an initiative will resist the kill. (3) **Data strategy** — the 13 initiatives blocked by the golden record problem need a data owner to sequence the prerequisite work. (4) **Board reporting** — the CFO's engineering ROI dashboard needs a CDO to own the narrative. (5) **Regulatory posture** — SS1/23 model validation requires a named individual accountable for AI governance. Without the CDO, the regulatory risk sits on the CTO who is not the right owner. I would recommend hiring from within first — your Head of Quantitative Research has the right profile and is known to the board.",
            },
          ],
        },
        {
          name: 'Engineering Model Redesign',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "AI-led engineering is not adding AI tools to existing squads. It requires changing how squads work. The pattern that delivers: engineers review AI output rather than generating from scratch. Governance gates are automated for low-risk changes. Sprint velocity is measured against AI-assisted output. Your **Portfolio Analytics squad** is already closest to this model — they use AI for code review and documentation generation and their velocity is 18% above benchmark. The contrast with OMS Core (Bloomberg-dependent, no AI tooling, 35% below benchmark) is instructive. The intervention for OMS Core is not more headcount — it is AI-assisted development to offset the Bloomberg release wait time.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Design the AI-assisted development model for OMS Core.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**OMS Core AI-assisted model — 3 changes, 60 days**\n\n**Change 1: AI code generation for Bloomberg API interactions** — GitHub Copilot configured with Bloomberg AIM API documentation as context. Engineers prompt → AI generates Bloomberg API call → engineer reviews. Eliminates 40% of manual coding time on Bloomberg integrations.\n\n**Change 2: Pre-release validation automation** — synthetic Bloomberg data environment (replicates schema, not data) for testing before release window. Catch Bloomberg-specific bugs before they delay release. Reduces release window wait from 21 days to 8 days.\n\n**Change 3: AI-assisted documentation generation** — Maestro prompts AI to document every Bloomberg customisation. Over 90 days, converts 8 proprietary customisations from 'Bloomberg-owned' to 'internally documented'. Begins the abstraction layer groundwork.\n\nProjected outcome: OMS Core cycle time from 127 days → 94 days (at benchmark). Cost: £180K tooling + 60 days engineer time.",
            },
          ],
        },
        {
          name: 'Vendor Dependency Reduction',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Three failed Bloomberg AIM modernisation attempts tell us the problem is not the vendor — it is the approach. Full replacement has failed because the 8 proprietary customisations cannot be replicated without Bloomberg. The **API wrapper approach** wraps AIM functionality in an internal service layer that the engineering team governs. Bloomberg controls the underlying data; Arcturus controls the release cadence. This has a 71% success rate in comparable FinServ firms (F003 pattern). The wrapper does not eliminate the Bloomberg dependency — it abstracts it. Engineers interact with Arcturus's internal API, not Bloomberg's. Bloomberg releases still happen, but they no longer gate Arcturus's entire release cycle.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What is the single Bloomberg customisation to abstract first?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "The highest-value first abstraction: **AIM-CUSTOM-04 — the portfolio weighting algorithm**. This customisation governs how portfolio reweighting instructions flow from portfolio managers → Bloomberg AIM → trade execution. It is the most frequently triggered and the most release-constrained. Currently, every change to reweighting logic requires a Bloomberg release window. Abstracting it means: Arcturus engineers own the reweighting logic, Bloomberg AIM executes it. Timeline: 12 weeks. Value: removes the primary release window dependency for 340 daily portfolio decisions. Secondary benefit: the documentation process for the abstraction layer converts the customisation from 'Bloomberg-owned knowledge' to 'Arcturus-owned knowledge' — directly addressing F003.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Produce the vendor dependency reduction plan for Phase 2 output.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**Vendor Dependency Reduction Plan — Arcturus PDLC Phase 2**\n\n**Bloomberg AIM (highest priority)**\nAction: API wrapper layer — 18-month programme\nWave 1: Abstract AIM-CUSTOM-04 (portfolio weighting) — 12 weeks\nWave 2: Abstract AIM-CUSTOM-07 (order routing), AIM-CUSTOM-11 (position limits) — 6 months\nWave 3: Document all 8 proprietary customisations, 6 now internally governed — 12 months\nOutcome: Bloomberg release window dependency reduced from 21 days to 5 days\n\n**Informatica PowerCenter (medium priority)**\nAction: Gradual migration to Azure Data Factory\nWave 1: Map all 89 production mappings (6 undocumented — hire the retiring developer part-time, 3 months)\nWave 2: Migrate 23 lowest-risk mappings to ADF — 9 months\nWave 3: Migrate risk and compliance mappings — 18 months\nRisk: 1 developer retiring Q3 2026, 1 contractor Q4 2026. Start immediately.\n\n**Ab Initio (low urgency, high cost)**\nAction: Renegotiate contract (2 global experts = leverage exists)\nRecommendation: Hold renewal at current rate pending MLOps foundation decision\n\nTotal dependency reduction investment: £2.1M over 18 months\nValue: eliminates estimated £8.4M/year in dependency-related velocity loss. OUTPUT_READY",
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Solution Design',
        status: 'approved',
        content: {
          target_state: {
            headline: '5 AI initiatives in production by Month 6. Credit scoring model monitored and compliant. OMS cycle time at benchmark.',
            metrics: [
              { metric: 'AI initiatives in production', current: '0', target: '5', timeline: 'Month 6' },
              { metric: 'OMS cycle time (days)', current: '127', target: '94', timeline: 'Month 4' },
              { metric: 'AI/ML Platform deployments/quarter', current: '0', target: '3', timeline: 'Month 3' },
              { metric: 'Credit scoring model — last retrained', current: '2019 (6 years)', target: 'Retrained 2025, monitoring live', timeline: 'Month 2' },
              { metric: 'CDO appointed', current: 'Vacant', target: 'Named', timeline: 'Month 1' },
            ]
          },
          interventions: [
            { name: 'MLOps Wave 1 Foundation', description: 'MLflow + SageMaker + PSI monitoring. Gets 3 AI initiatives to production.', sequence_rationale: 'Prerequisite for all 28 AI initiatives. Day 1 investment.', recovery_range: { conservative: '£38M', base: '£74M', optimistic: '£112M' }, time_to_first_saving: '3', risk: 'Data pipeline complexity from Bloomberg/Kafka feeds', mitigation: 'AI-023 chosen specifically for clean external data — de-risks first deployment', wave: 1 },
            { name: 'CDO Appointment', description: 'Named CDO with AI portfolio ownership and board accountability.', sequence_rationale: 'Unlocks 14 additional initiatives and governance structure. Zero cost to appoint from within.', recovery_range: { conservative: '£12M', base: '£28M', optimistic: '£45M' }, time_to_first_saving: '2', risk: 'Internal hire may need 90-day ramp', mitigation: 'Head of Quant Research is board-known and has the right profile', wave: 1 },
            { name: 'Bloomberg API Abstraction Layer', description: 'Abstract AIM-CUSTOM-04 first. Reduces OMS cycle time from 127 to 94 days.', sequence_rationale: 'Quick win after foundation established. Uses engineers freed from AI initiative kills.', recovery_range: { conservative: '£3.2M', base: '£4.8M', optimistic: '£6.1M' }, time_to_first_saving: '4', risk: 'Bloomberg LP may not support abstraction layer', mitigation: 'Legal review of AIM contract — API wrapper does not breach vendor terms', wave: 1 },
          ],
          business_case: {
            total_recoverable_annual: { conservative: '£38M', base: '£74M', optimistic: '£112M' },
            abarva_fee: { conservative: '£5.7M', base: '£11.1M', optimistic: '£16.8M' },
            client_net_benefit: { conservative: '£32.3M', base: '£62.9M', optimistic: '£95.2M' },
            payback_months: '7',
            genome_confidence: '84% — based on 47 comparable FinServ AI-PDLC engagements'
          },
          vendor_verdicts: [
            { vendor: 'Bloomberg AIM', verdict: 'retain', rationale: 'Core system — exit not viable. Abstract the dependency instead.', transition_plan: 'API wrapper layer over 18 months' },
            { vendor: 'AI/ML Platform consulting (3 vendors)', verdict: 'exit', rationale: '£12M spend, 0 production output. Replace with internal MLOps capability.', transition_plan: '90-day MLOps Wave 1 replaces all three' },
            { vendor: 'Informatica PowerCenter', verdict: 'renegotiate', rationale: '2 of 3 developers leaving by Q4 2026. Negotiate exit timeline with Azure Data Factory transition.', transition_plan: '18-month ADF migration' },
          ],
        }
      }
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ────────────────────────────────
    {
      phase_number: 3,
      status: 'approved',
      workstreams: [
        {
          name: 'Baseline Metrics',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "Five metrics to lock for PDLC baseline. Each must be precise — these are the numbers we will be measured against for the fee calculation. **Metric 1: AI initiatives in production** — Current: 0. Source: ARC-P01 initiative inventory, confirmed. **Metric 2: OMS squad average cycle time** — Current: 127 days. Source: ARC-C05 sprint data, Q3-Q4 2025 average. **Metric 3: AI/ML Platform story points to production** — Current: 0 (12 months). Source: ARC-P05 engineering cost data. **Metric 4: Credit scoring model — months since last retrain** — Current: 72 months (6 years, original deployment 2019). Source: ARC-P03 model inventory. **Metric 5: Engineering cost per story point (OMS Core)** — Current: £5,100. Source: ARC-P05. Are these the right baselines? Particularly on cycle time — do you want to lock 127 days as the Q3-Q4 2025 average or use a different reference period?",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Lock 127 days. Use Q3-Q4 2025 as the reference period. Confirm the baseline.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**BASELINE LOCKED — Arcturus × AI-Powered PDLC**\n\nLock date: Day 0 of engagement execution\nReference period: Q3-Q4 2025 actuals\n\n| Metric | Baseline | Source | Verification |\n|---|---|---|---|\n| AI in production | 0 initiatives | ARC-P01 | CDO confirms monthly |\n| OMS cycle time | 127 days | ARC-C05 | Sprint tooling (Jira) |\n| AI/ML Platform output | 0 story points/12mo | ARC-P05 | Engineering BI |\n| Credit model age | 72 months unretrained | ARC-P03 | Model registry |\n| OMS cost/story point | £5,100 | ARC-P05 | Finance reconciliation |\n\nThis baseline is immutable from the date of signature. Any change requires CFO and CDO co-sign.",
            },
          ],
        },
        {
          name: 'Wave Plan',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**Wave 1 (Days 1-90) — Foundation**\nCDO appointed (Day 30 target). AI-04 credit model validation audit initiated (Day 7). MLflow live (Day 21). AI-023 to production via Bedrock (Day 58). AI-026 to production (Day 75). 5 initiatives killed, £12M/year freed. Wave 1 gate: 2 AI initiatives in production with documented ROI baselines.\n\n**Wave 2 (Days 91-180) — Scale**\nMLOps Wave 2 builds: full training pipeline, SageMaker fleet. AI-04 credit model retrained and monitored. 3 additional initiatives reshaped and deployed. OMS Bloomberg abstraction begun (AIM-CUSTOM-04). Wave 2 gate: 5 AI initiatives in production, OMS cycle time trending down.\n\n**Wave 3 (Days 181-365) — Compound**\nBloomberg abstraction layer complete for top 3 customisations. 8 reshaped initiatives in production. Engineering cost per story point below £4,000 across OMS. Informatica migration 40% complete. Wave 3 gate: Verified savings exceed £10M. Fee calculation trigger.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What is the first fee trigger?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "**First fee trigger (Month 3)**: 2 AI initiatives in production with documented ROI baselines, credit model monitoring live. Fee: 15% of verified savings. At Month 3, verified savings from: (1) AI initiative kills (£12M/year annualised → £3M in 3 months) + (2) AI-023 production value (£4.2M baseline annualised → £1.05M in 3 months). Total verified savings Month 3: £4.05M. Fee triggered: £607,500. This is the conservative case — the base case adds velocity savings from OMS improvement which begins showing in Month 4.",
            },
          ],
        },
        {
          name: 'Fee Structure',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content: "For PDLC, the fee tracks two types of verified savings: (1) **Direct AI value** — each AI initiative reaching production with a documented ROI baseline triggers 15% of verified annual value. AI-023 alone = £4.2M annual value baseline × 15% = £630K on production confirmation. (2) **Velocity savings** — OMS cycle time reduction × engineering cost. Each 10-day reduction in OMS cycle time = approximately £1.6M annual savings (from engineering cost per story point calculation). 15% = £240K per 10-day improvement. (3) **Cost elimination** — AI portfolio kills at £12M/year freed. 15% = £1.8M on verification. Fee cap is not applicable — outcome is open-ended. AbarVa earns nothing if the baselines do not move.",
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap',
        title: 'Execution Roadmap & Baseline Agreement',
        status: 'approved',
        content: {
          baseline_metrics: [
            { metric: 'AI initiatives in production', current_value: '0', source: 'ARC-P01', measurement_method: 'CDO monthly confirmation', target_value: '5', verification: 'CDO sign-off + engineering BI' },
            { metric: 'OMS average cycle time (days)', current_value: '127', source: 'ARC-C05 Q3-Q4 2025', measurement_method: 'Jira sprint tracking', target_value: '94', verification: 'Engineering BI dashboard' },
            { metric: 'Credit model — months since retrain', current_value: '72', source: 'ARC-P03 model inventory', measurement_method: 'Model registry timestamp', target_value: '0 (retrained)', verification: 'CDO + model registry' },
          ],
          waves: [
            { wave: 1, timeline: 'Days 1-90', milestones: [{ milestone: 'CDO appointed', owner: 'CEO', due: 'Day 30', fee_trigger: '' }, { milestone: 'AI-023 in production with ROI baseline', owner: 'MLOps Maestro', due: 'Day 58', fee_trigger: '£630K' }, { milestone: 'Credit model retrained and monitored', owner: 'AI Governance Maestro', due: 'Day 75', fee_trigger: '' }], gate: '2 AI initiatives in production with documented ROI. CDO named.' },
            { wave: 2, timeline: 'Days 91-180', milestones: [{ milestone: '5 AI initiatives in production', owner: 'CDO', due: 'Day 150', fee_trigger: '£2.1M' }, { milestone: 'OMS cycle time ≤ 108 days (15% reduction)', owner: 'Delivery Maestro', due: 'Day 180', fee_trigger: '£720K' }], gate: 'Verified savings exceed £6M' },
          ],
          fee_schedule: [
            { trigger: 'AI-023 in production with documented £4.2M ROI baseline', condition: 'CDO confirms + CFO signs', amount: '£630K', estimated_date: 'Month 3' },
            { trigger: '5 AI initiatives in production, total verified value £21M', condition: 'CDO confirms + CFO signs', amount: '£3.15M', estimated_date: 'Month 6' },
            { trigger: 'OMS cycle time ≤ 94 days (verified)', condition: 'Engineering BI + CFO signs', amount: '£1.05M', estimated_date: 'Month 8' },
          ],
          risk_register: [
            { risk: 'Bloomberg refuses to support API abstraction layer', probability: 'medium', impact: 'medium', mitigation: 'Legal review of AIM contract — API wrapper does not breach vendor terms. Fallback: pre-release synthetic data environment only.' },
            { risk: 'CDO hire takes longer than 30 days', probability: 'medium', impact: 'high', mitigation: 'Appoint Head of Quantitative Research as interim CDO on Day 7. External hire can take over in Month 2.' },
            { risk: 'AI-04 credit model shows deep data drift — retraining fails validation', probability: 'low', impact: 'critical', mitigation: 'Audit first (Days 7-17) to scope the retraining effort before committing to the 90-day timeline.' },
          ],
          baseline_lock_statement: 'This baseline is immutable from the date of signature. Any change requires board approval.'
        }
      }
    },

    // ─── PHASE 4: Execution & Outcome Tracking ────────────────────────────────
    {
      phase_number: 4,
      status: 'complete',
      workstreams: [
        {
          name: 'Monthly Actuals',
          messages: [
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Month 1 actuals — PDLC baseline tracking**\n\nAI in production: 1 (AI-023 Investment Research — Day 58 target met). ROI baseline established: £4.2M/year. Credit model validation audit complete — data drift confirmed (PSI 0.38 on income feature). Retraining underway. OMS cycle time: 127 days (no change expected until Bloomberg abstraction layer live). CDO: Head of Quantitative Research appointed interim Day 29. Overall: **GREEN** — Wave 1 foundation on track." },
            { role: 'admin', actor_name: 'Anand Sundaram', content: "Update on AI-026 deployment status." },
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "AI-026 (Earnings Call Analysis) — **deployed Day 75, 4 days ahead of schedule**. Initial validation: 91% accuracy vs human analyst on Q4 2025 earnings calls. Portfolio manager adoption: 8 of 12 users active in first week. ROI baseline: £3.8M/year (based on analyst hours displaced). Adding to Month 1 verified savings — total AI production value now £8.0M/year baseline across AI-023 and AI-026." },
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Month 2 actuals — PDLC baseline tracking**\n\nAI in production: 2 (AI-023, AI-026). Credit model (AI-04): retrained on 2024-2025 data. PSI now 0.08 (within tolerance). Regulatory documentation package complete. OMS cycle time: 118 days (Bloomberg abstraction layer for AIM-CUSTOM-04 began). MLflow: 47 active experiments across 6 teams. CDO: formal appointment confirmed, taking over from interim. Kill list executed: 5 initiatives terminated, £12M/year freed. **Verified savings Month 2: £10M annualised.** Fee trigger criteria met." },
            { role: 'admin', actor_name: 'Anand Sundaram', content: "Confirm fee calculation for Month 2 trigger." },
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Fee calculation — Month 2 trigger**\n\nVerified savings components:\n- AI-023 production (£4.2M/year): 2 months → £700K\n- AI-026 production (£3.8M/year): 1.5 months → £475K\n- Initiative kills (£12M/year): 2 months → £2.0M\n- Engineering cost freed from killed initiatives: £1.6M annualised → £267K\n\n**Total verified savings to date: £3.44M**\nFee rate: 15%\n**Fee triggered: £516K**\n\nCFO sign-off required. Baseline audit attached. All figures traceable to ARC-P01 (kills confirmed), engineering BI (AI production confirmed), CDO monthly report." },
          ],
        },
        {
          name: 'AI Deployment Log',
          messages: [
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Deployment log — Month 1**\nAI-023: Investment Research Summarisation — LIVE Day 58. SageMaker endpoint, Bloomberg+Reuters via Kafka. 12 portfolio managers active. Accuracy: 88% vs human baseline.\nAI-026: Earnings Call Analysis — LIVE Day 75. Same infrastructure. 8 of 12 portfolio managers active. Accuracy: 91%. Both deployments under budget (£380K vs £420K forecast)." },
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Month 3 deployment log**\nAI-04: Credit Scoring Model — retrained, monitored, regulatory package complete. Now tracked in MLflow. PSI alerts configured. AI-07: Trade Surveillance Anomaly Detection — retraining in progress. Expected production Month 4. AI-12: Risk Forecasting — reshaped initiative, now passing all 3 readiness criteria. Production target Month 5.\n\n**Total AI in production at Month 3: 2 active, 1 remediated (AI-04), 2 in pipeline.** On track for Wave 2 target of 5 by Month 6." },
          ],
        },
        {
          name: 'Knowledge Compound',
          messages: [
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "This engagement adds 6 validated patterns to the Genome. Key additions: (1) **Bloomberg abstraction layer success pattern** — AIM-CUSTOM-04 abstracted in 12 weeks without vendor conflict. Adds to F003 remediation evidence. (2) **Minimum viable MLOps sequencing** — Wave 1 £420K delivering 3 production models before full platform build. Challenge to 'build full infrastructure first' approach. (3) **Credit model regulatory disclosure pattern** — documentation package format accepted by BoE without pushback. Adds to F001 remediation playbook." },
            { role: 'maestro_ai', actor_name: 'AbarVa AI', content: "**Knowledge transfer scorecard — Month 3**\nMLOps capability: 3 engineers now independently deploying models (were 0 at engagement start). Bloomberg abstraction: 2 engineers own AIM-CUSTOM-04 logic internally (previously Bloomberg-only). AI governance: CDO has full portfolio view, board reporting format established. Model monitoring: entire AI team trained on PSI methodology. Estimated knowledge retention score: 78/100 — significant improvement from 18/100 at Phase 0." },
          ],
        },
      ],
      output: {
        output_type: 'outcome_report',
        title: 'Month 3 Outcome Report',
        status: 'approved',
        content: {
          month: 'Month 3',
          overall_rag: 'green',
          fee_released_m: 0.516,
          verified_savings_m: 3.44,
          months_tracked: 3,
          pdlc_metrics: {
            ai_in_production: { baseline: 0, current: 2, target: 5, rag: 'green' },
            oms_cycle_time_days: { baseline: 127, current: 118, target: 94, rag: 'amber', note: 'Bloomberg abstraction underway, target Month 4' },
            credit_model_months_unretrained: { baseline: 72, current: 0, target: 0, rag: 'green', note: 'Retrained, PSI monitoring live, regulatory documentation complete' },
          },
          scorecard: [
            { metric: 'AI initiatives in production', baseline: '0', current: '2 live + 1 remediated', target: '5 by Month 6', trend: 'improving', rag: 'green', variance_explanation: 'AI-023 and AI-026 both delivered ahead of plan' },
            { metric: 'OMS cycle time (days)', baseline: '127', current: '118', target: '94', trend: 'improving', rag: 'amber', variance_explanation: 'Bloomberg abstraction layer reducing wait time; full target Month 4' },
            { metric: 'Credit model — compliant', baseline: 'Non-compliant (6yr unretrained)', current: 'Compliant (retrained, monitored)', target: 'Compliant', trend: 'improving', rag: 'green', variance_explanation: 'BoE regulatory package complete and accepted' },
          ],
          fee_calculation: {
            savings_verified_this_month: '£3.44M cumulative',
            fee_triggered_this_month: '£516K',
            cumulative_fee_to_date: '£516K',
            remaining_potential: '£10.6M remaining (base case)'
          }
        }
      }
    },
  ]
}
