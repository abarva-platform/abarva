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

export const MERIDIAN_PDLC_DEMO: DemoEngagement = {
  engagement_name:
    'Meridian Health System × AI-Powered PDLC — Completed Demo',
  phases: [
    // ─── PHASE 1: Delivery Bottleneck Diagnosis ──────────────────────────────
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
              content:
                'Meridian has **0 AI initiatives in production**. That is not a velocity problem — it is a governance problem. But to understand the full picture, I want to start with the prior auth stall because it is the best-documented case of what happens when Meridian tries to ship AI. Prior auth integration: **60% complete, stalled 18 months**. The engineering team knows what to do. The integration is technically straightforward. It stalled because **no one made a scope decision**: 12 payers simultaneously vs top 3 payers first. CDO left 18 months ago. CIO deferred. The work sat at 60% complete while the CMS mandate approached. That is **F002 at 84% failure rate** — not engineering failure, governance failure.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CIO says the prior auth stall is a payer API problem, not an internal governance problem.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The payer API framing is partially accurate but not the primary cause. From the MER-P02 data: **United and Aetna APIs are fully integrated and tested** — they have been for 14 months. The stall is on the decision about BCBS (requires a different integration approach) and the 9 smaller payers (require a batching strategy). The engineering team submitted a decision memo 11 months ago recommending the top-3 first approach. The memo was never acted on. That is a governance gap, not a payer API problem. The top-3 approach can be approved today and prior auth can go live in **60 days** — the engineering work is already done for United and Aetna.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CMS mandate is in 14 months. What happens if we miss it?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CMS prior auth mandate (January 2027): non-compliant health systems face **$1.9M per year in penalties** plus payer audit triggers that increase denial rates. For Meridian specifically, with a **$94M denial write-off already**, adding CMS audit pressure could push write-offs to **$108–118M**. The mandate is not just a compliance deadline — it is a margin event. The good news: **Meridian can be compliant with the top-3 payer implementation alone** (United, Aetna, BCBS cover 82% of Meridian\'s MA volume). The mandate does not require all-payer compliance on Day 1. Top-3 first is the right answer, it was the right answer 11 months ago, and it is still the right answer now.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Epic prior auth module — it\'s listed as 23% deployed. What does that mean?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '23% deployment means the **Epic module configuration is 23% complete** — the rules, payer mappings, and workflow integration for the top-3 payers are partially built. The remaining 77% is not 77% of the work — it is the payer-specific configuration for BCBS (estimated 3 weeks) and the workflow integration with Epic scheduling (2 weeks). Total remaining engineering work: **5 weeks** at current team velocity. The "23% deployed" metric understates completion because the hardest work (United and Aetna integration logic) is already done. This initiative is 60 days from production, not 60 weeks.',
            },
          ],
        },
        {
          name: 'AI Initiative Blockers',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Meridian has **11 AI initiatives, 0 in production, $22M committed**. I can see three root causes from the MER-P03 data. First: **CDO vacant 14 months** — 8 of the 11 initiatives have a decision that requires a CDO to make. Without one, they all stall at the decision point. Second: **MLOps infrastructure incomplete** — 4 initiatives (AI-02, AI-09, AI-11, AI-06) require model serving infrastructure that does not exist at Meridian. Third: **data quality gates** — AI-05 and AI-08 cannot work with current data completeness. Only 2 initiatives (AI-04 and AI-07) are blocked solely by the CDO governance gap and can be unblocked immediately.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Of the 11, which ones genuinely need MLOps infrastructure vs which ones can be deployed with existing stack?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Split clearly. **No new infrastructure needed (2)**: AI-04 (prior auth) deploys via Epic module activation — no external model serving required. AI-07 (ambient documentation) deploys via a licensed third-party ambient AI vendor (already contracted, not activated). **Needs MLOps foundation (4)**: AI-02 (clinical documentation improvement model), AI-09 (supply chain prediction), AI-11 (readmission risk), AI-06 (length of stay optimization) — all require model serving, monitoring, and retraining pipelines. **Data quality blocks (2)**: AI-05 and AI-08 — not an MLOps problem. **Genuinely complex (3)**: AI-01, AI-03, AI-10 — require both MLOps and significant data preparation. The programme sequences accordingly: AI-04 and AI-07 first (90 days), MLOps foundation next (months 2–6), complex initiatives last.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The MLOps foundation — what does Meridian actually need to build?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Meridian has **AWS in place and Epic on Azure** — two clouds, which complicates the MLOps build. From MER-P05: zero maturity across 9 MLOps capabilities. Required for the Wave 2 initiatives: **(1) Model registry** — track versioned models, who deployed them, performance baselines. 4 weeks to implement using AWS SageMaker (already licensed). **(2) Inference endpoint** — serve model predictions to Epic and downstream systems. 3 weeks. **(3) Monitoring pipeline** — drift detection, accuracy alerts. 3 weeks. **(4) Retraining trigger** — schedule and approval workflow for model updates. 2 weeks. Total: **12 weeks** for a production-grade foundation for the 4 Wave 2 initiatives. Cost: approximately **$380K** (2 MLOps engineers × 3 months). This is less than the cost of a single month of stalling.',
            },
          ],
        },
        {
          name: 'Engineering Cost vs Output',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'MER-P05 engineering cost analysis. Total engineering spend: **$18.4M/year** across 6 squads. AI/ML engineering squad: **$3.2M/year, 0 deployments in 18 months**. That is an infinite cost per deployment. The squad is technically capable — they built AI-04 to 60% completion. The bottleneck is not capability; it is the absence of decisions. The clinical informatics squad by contrast: **$2.1M/year, 14 Epic module configurations deployed**. Same budget range, vastly different output. The difference is governance: clinical informatics has a named owner (the Chief Medical Information Officer) who makes decisions. AI/ML has no equivalent.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the right size for the AI/ML squad once we have governance?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Current squad: 14 FTE at $3.2M. For the Wave 1 and Wave 2 programme, the squad needs to be reshaped, not resized. **Reshape needed**: reduce to 8 FTE focused on the production pipeline (AI-04, AI-07, MLOps foundation). Add 2 MLOps engineers (new hire or contract). Redeploy 4 FTE to the clinical informatics squad where they can contribute immediately while the AI programme governance is established. **Net cost impact**: neutral. **Output impact**: 2 deployments in 90 days vs 0 in 18 months. The squad is over-indexed on research and under-indexed on deployment. CDO can make this call — CIO has been reluctant to restructure a team without AI leadership in place.',
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
            'Meridian has 0 AI initiatives in production after $22M committed. Prior auth is 60% complete, stalled 18 months by a governance gap — not a technical failure. CMS mandate is 14 months away. Two initiatives (AI-04 and AI-07) can be in production in 90 days without any new infrastructure. The remaining 9 require either a CDO decision, MLOps foundation (12 weeks), or data quality remediation. The prescription: appoint CDO or interim CDO immediately, approve the top-3 payer scope decision today, and build the MLOps foundation in parallel.',
          ai_portfolio: {
            total_initiatives: 11,
            in_production: 0,
            committed_spend_m: 22,
            ready_now: ['AI-04 Prior Auth Automation', 'AI-07 Ambient Documentation'],
            needs_mlops: ['AI-02 Clinical Documentation', 'AI-09 Supply Chain', 'AI-11 Readmission Risk', 'AI-06 LOS Optimization'],
            needs_data: ['AI-05 Revenue Forecasting', 'AI-08 Scheduling Optimization'],
            complex: ['AI-01', 'AI-03', 'AI-10'],
          },
          blockers: [
            {
              blocker: 'CDO vacant 14 months',
              initiatives_blocked: 8,
              genome_pattern: 'F002',
              days_to_unblock: 30,
            },
            {
              blocker: 'MLOps infrastructure missing',
              initiatives_blocked: 4,
              genome_pattern: 'F001',
              days_to_unblock: 84,
            },
            {
              blocker: 'Data quality gaps',
              initiatives_blocked: 2,
              genome_pattern: null,
              days_to_unblock: 180,
            },
          ],
          prior_auth_status: {
            completion_pct: 60,
            stall_duration_months: 18,
            stall_root_cause: 'F002 — scope decision not made (top-3 vs all-payer)',
            engineering_work_remaining_weeks: 5,
            production_ready_in_days: 60,
            cms_mandate_months_away: 14,
            cms_penalty_if_missed_m: 1.9,
          },
          immediate_actions: [
            'Approve top-3 payer scope decision (United, Aetna, BCBS) — Day 1, $0 cost',
            'Appoint interim CDO within 30 days — unblocks AI-04, AI-07, and 6 others',
            'Commission MLOps foundation — 12 weeks, $380K, unblocks Wave 2',
            'Activate AI-07 ambient documentation vendor contract — $0, already contracted',
          ],
        },
      },
    },

    // ─── PHASE 2: AI Delivery Prescription ──────────────────────────────────
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
              content:
                'The MLOps assessment shows zero maturity across 9 capabilities. For Meridian specifically, the two-cloud situation (AWS + Epic/Azure) is the complicating factor. My recommendation: **build the foundation on AWS, not Azure**. Reason: AI-04 and AI-07 do not interact with Epic\'s data model directly — they interact via Epic APIs. AWS SageMaker already licensed, team has AWS experience. Azure MLOps would require reskilling and adds complexity. Epic integration layer handles the data translation either way. **Wave 1 MLOps (12 weeks)**: model registry, inference endpoint for top 3 initiatives, basic monitoring. This gets AI-02, AI-09, AI-11, AI-06 from "blocked by infrastructure" to "deployable in Wave 2."',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Epic is on Azure. Doesn\'t that mean we need Azure MLOps for Epic data?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The distinction matters here. **Epic data** lives on Azure (Meridian\'s Epic environment). **Model serving** does not need to be colocated with the data — it needs to be accessible to Epic via API. Pattern: Epic queries the AWS-hosted inference endpoint via REST API (standard Epic App Orchard integration). The model gets the data it needs via Epic\'s FHIR API (already enabled), runs inference on AWS, returns the prediction to Epic. This is the standard architecture for Epic AI integrations — it does not require Azure MLOps. The Epic FHIR API is the bridge. This is confirmed in the MER-P04 technology landscape — Epic FHIR R4 is enabled and tested.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What does the CDO own in the MLOps programme vs the CIO?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**CDO owns**: AI initiative portfolio governance (which models go to production, which get killed), model performance standards, AI ethics and bias review, and the business case for each Wave 2 initiative. **CIO owns**: infrastructure (AWS SageMaker environment, networking, Epic FHIR API access), data pipeline reliability, and the Epic integration layer. The handoff is clear: CDO decides *what* goes to production, CIO\'s team decides *how* it gets there and owns the infrastructure. The prior auth stall happened because both roles needed to make a joint decision and there was no CDO to make the AI side of it. With both roles clear, the decision process is unblocked.',
            },
          ],
        },
        {
          name: 'Engineering Model Redesign',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The AI/ML squad redesign. Current state: 14 FTE, heavily weighted toward model research and development, minimal deployment capability. The squad built AI-04 to 60% — they can build. The gap is deployment and operations. **Proposed redesign**: 8 FTE core squad (2 ML engineers → deployment-focused, 2 data engineers, 2 clinical AI specialists, 1 MLOps engineer, 1 product owner). 4 FTE redeployed to clinical informatics where they contribute immediately. 2 new MLOps hires (contract, 6-month, $140K total). This gives the squad a deployment-first culture while the governance is established. CDO approves. CIO executes.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The team morale — 0 deployments in 18 months is demoralizing. How do we reset?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The reset is **AI-04 going live**. Nothing changes team morale faster than shipping. The team built this — they know it works. When it goes live for United and Aetna, and they see prior auth approval rates move from 68% to 84%, that is the proof that the governance gap was the problem, not their capability. The CDO appointment also resets morale — the team has been waiting 18 months for someone to make decisions. A CDO who makes decisions on Day 1 (top-3 scope decision) signals immediately that the governance failure is over. I recommend the CDO\'s first meeting is with the AI/ML squad — hear directly what has been stalling them. That meeting surfaces the remaining blockers and signals that the new governance works.',
            },
          ],
        },
        {
          name: 'Vendor Dependency Reduction',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Meridian has three vendor dependencies that affect AI delivery velocity. (1) **Ensemble Health Partners** — revenue cycle work creates data quality issues that affect AI-05 and AI-08. Ensemble\'s data exports are not in HL7 FHIR format, requiring manual transformation. (2) **Epic** — 18 modules underutilized, including the prior auth module (23% deployed). Epic is a dependency by underuse, not overuse. (3) **AWS** — not a dependency problem; this is the right infrastructure choice and should be expanded for MLOps. The Ensemble data format issue is the only vendor dependency that actively blocks AI delivery. Resolution: require Ensemble to export in FHIR R4 as part of the renegotiated contract terms.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Can Ensemble actually produce FHIR R4 output? Or is this a negotiating point we cannot enforce?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Ensemble Health Partners has FHIR R4 export capability — it is part of their standard platform (Ensemble\'s EBO platform supports FHIR R4 as of their 2024 platform update). The reason Meridian is not receiving FHIR format is the original contract pre-dates the capability and Meridian has not requested the format change. This is a configuration change, not a technology development. Estimated Ensemble effort: **2 weeks**. The contract renegotiation (driven by the Margin programme\'s SLA enforcement) is the natural vehicle to add this requirement at no additional cost. FHIR R4 from Ensemble unblocks AI-05 and AI-08 data quality issues.',
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Phase 2 Output — Solution Design',
        status: 'approved',
        content: {
          executive_summary:
            'The Meridian AI-Powered PDLC programme delivers in three waves. Wave 1 (90 days): AI-04 and AI-07 in production — no new infrastructure, CDO or interim CDO in place. Wave 2 (months 2–6): MLOps foundation built on AWS, AI-02 and AI-09 deployed. Wave 3 (months 6–12): full AI portfolio operational, CMS mandate compliant, 5 AI initiatives in production. Fee triggers on verified AI deployments and prior auth denial rate reduction.',
          waves: [
            {
              wave: 1,
              name: 'Ship the Ready Ones',
              timeline: 'Days 1–90',
              deliverables: ['AI-04 Prior Auth live (top 3 payers)', 'AI-07 Ambient Documentation live (all physicians)', 'CDO or interim CDO appointed'],
              success_metric: 'Prior auth denial rate below 12%, AI-07 at 80% physician adoption',
              investment: { engineering_weeks: 10, cost_k: 180 },
            },
            {
              wave: 2,
              name: 'Build the Foundation',
              timeline: 'Months 2–6',
              deliverables: ['MLOps foundation (registry + inference + monitoring)', 'AI-02 Clinical Documentation in production', 'AI-09 Supply Chain prediction live', 'Ensemble FHIR R4 output activated'],
              success_metric: '3 AI initiatives in production, MLOps foundation operational',
              investment: { engineering_weeks: 24, cost_k: 520 },
            },
            {
              wave: 3,
              name: 'Scale and Compound',
              timeline: 'Months 6–12',
              deliverables: ['AI-11 Readmission Risk live', 'AI-06 LOS Optimization live', 'CMS mandate compliance confirmed', '5 AI initiatives in production'],
              success_metric: '5 AI in production, CMS compliance GREEN',
              investment: { engineering_weeks: 16, cost_k: 280 },
            },
          ],
          mlops_architecture: {
            platform: 'AWS SageMaker',
            timeline_weeks: 12,
            cost_k: 380,
            capabilities: ['Model registry', 'Inference endpoints', 'Monitoring and drift detection', 'Epic FHIR API integration layer'],
            epic_integration: 'FHIR R4 REST API — no Azure MLOps required',
          },
          cdo_scope: {
            owns: ['AI portfolio governance', 'Wave approvals', 'Model performance standards', 'AI ethics review'],
            does_not_own: ['Infrastructure (CIO)', 'Epic configuration (CMIO)', 'Data pipelines (CIO)'],
          },
        },
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ───────────────────────────────
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
              content:
                'Five baseline metrics locked for the AI-Powered PDLC programme. **AI initiatives in production: 0** — source: MER-P03. **Prior auth approval rate: 68%** — source: MER-M01 (United and Aetna combined). **Prior auth processing time: 34 minutes per request** — source: MER-P02 workflow analysis. **Average cycle time (AI initiative approval to production): not measurable** — 0 in production means we baseline at initiation of AI-04 from today. AI-04 initiated formally today: Day 0. Target: production in 60 days. **CMS mandate compliance: NON-COMPLIANT** — prior auth not live for any payer. Baseline locked.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The cycle time metric — we need a number for the baseline, not "not measurable."',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Agreed. Retrospective measurement: AI-04 was formally approved **18 months ago** and is at 60% completion with 5 weeks of work remaining — call it **20 months to completion** at current pace. That is the baseline cycle time for major AI initiatives at Meridian under the old governance model. The target under the new model: **60 days for AI-04** (Wave 1 proof point). **180 days for Wave 2 initiatives** (AI-02, AI-09). The metric moves from 20 months → 60 days → 180 days for increasingly complex initiatives. That 20-month baseline is the number that goes in the board presentation — it quantifies the cost of the governance gap.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CMS mandate compliance — how do we define the baseline and the target?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CMS compliance baseline: **0 of 12 required payers configured** as of today. Target: **Top-3 payers (United, Aetna, BCBS) by Day 90** — these 3 cover 82% of Meridian\'s MA volume and satisfy the CMS mandate\'s initial compliance threshold. All-12-payer compliance: **Month 10** (well ahead of January 2027 deadline, 3-month buffer). Fee triggers at two points: (1) Day 90: top-3 payer compliance confirmed — first AI deployment fee triggered. (2) Month 10: full compliance confirmed — final AI compliance milestone fee triggered.',
            },
          ],
        },
        {
          name: 'Wave Plan',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Wave 1 (Days 1–90)** — the proof points. Three things happen simultaneously. (1) AI-04: scope decision approved today, BCBS configuration 3 weeks, workflow integration 2 weeks, testing 1 week, production Day 58. (2) AI-07: ambient documentation vendor contract activated, physician training begins Week 2, rollout starts Week 4. (3) CDO/interim CDO: appointed by Day 30, Week 1 priority is the prior auth scope decision. Wave 1 success metric: first AI initiative in production (AI-04) with documented 60-day cycle time vs 20-month baseline. That is the proof point for Wave 2 funding and the board story.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 2 — the MLOps foundation. What does the team look like?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Wave 2 engineering team**: 8 FTE core AI/ML squad (reshaped, not reduced) + 2 MLOps contract engineers (6-month). The MLOps foundation is the first 12 weeks of Wave 2 — it runs concurrently with AI-04 and AI-07 production. By the time AI-04 is live (Day 58), the model registry and inference endpoint are operational (Day 84). AI-02 development can begin on Day 60 using the foundation that is being built. No waiting. **Wave 2 (Months 2–6)**: AI-02 in production, AI-09 in production, MLOps foundation fully operational. Two more AI initiatives live. Five total in production by Month 12.',
            },
          ],
        },
        {
          name: 'Fee Structure',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'For AI-Powered PDLC, the fee structure tracks two metrics. (1) **AI deployments**: fee per verified AI initiative in production, paid on deployment confirmation. At 5 initiatives by Month 12, this is the primary fee trigger. (2) **Prior auth efficiency**: fee on verified reduction in prior auth processing time and denial rate improvement (shared metric with the Margin programme). The prior auth efficiency fee is 15% of the annualized value of the time reduction — 26 minutes × monthly prior auth volume × physician billing rate. Month 3 projection: **$1.74M annualized** on this metric alone. Combined AI deployment fees (5 initiatives × average $800K verified value): **$600K in AI deployment fees** over 12 months.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CMS compliance — does that trigger a separate fee?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CMS compliance triggers a milestone fee, not a savings fee. Structure: **$400K milestone fee** when top-3 payer CMS compliance is confirmed by CMS certification (Month 3), **$600K milestone fee** when full 12-payer compliance is confirmed (Month 10). These are milestone-based, not savings-based, because compliance value is the **$1.9M/year avoided penalty** — which is directly attributable but not a "savings" in the traditional sense. Total milestone fees: $1M. Plus the ongoing efficiency fees on prior auth and AI deployment fees. Total Year 1 programme fee: **$2.3–2.8M**. Total Year 1 programme value delivered: **$18–26M**.',
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap',
        title: 'Phase 3 Output — Execution Roadmap & Baseline Agreement',
        status: 'approved',
        content: {
          baseline_locked: {
            ai_in_production: 0,
            prior_auth_approval_rate_pct: 68,
            prior_auth_processing_time_min: 34,
            avg_cycle_time_months: 20,
            cms_compliance: 'NON-COMPLIANT',
            payers_configured: 0,
            lock_date: 'Day 0',
            source_files: ['MER-P03', 'MER-M01', 'MER-P02'],
          },
          waves: [
            {
              wave: 1,
              name: 'Ship the Ready Ones',
              days: '1–90',
              actions: [
                'Approve top-3 payer scope decision — Day 1',
                'AI-04 Prior Auth: BCBS configuration + production deployment Day 58',
                'AI-07 Ambient Documentation: rollout begins Week 4',
                'CDO or interim CDO: appointed by Day 30',
              ],
              success_metric: 'AI-04 in production, prior auth approval rate >80%',
              fee_trigger: 'Day 90: top-3 CMS compliance milestone ($400K) + efficiency fee',
            },
            {
              wave: 2,
              name: 'Build the Foundation',
              days: '60–180',
              actions: [
                'MLOps foundation: registry + inference + monitoring (12 weeks)',
                'AI-02 Clinical Documentation: development + production',
                'AI-09 Supply Chain Prediction: development + production',
                'Ensemble FHIR R4: configuration change + validation',
              ],
              success_metric: '3 AI initiatives in production, MLOps foundation operational',
              fee_trigger: 'Quarterly AI deployment fees per initiative verified',
            },
            {
              wave: 3,
              name: 'Scale and Comply',
              days: '180–365',
              actions: [
                'AI-11 Readmission Risk: production',
                'AI-06 LOS Optimization: production',
                'All-12-payer CMS compliance: Month 10',
                '5 AI initiatives in production',
              ],
              success_metric: '5 AI in production, CMS compliance GREEN',
              fee_trigger: 'Month 10: full CMS compliance milestone ($600K)',
            },
          ],
          total_fee_exposure: {
            milestone_fees_m: 1.0,
            efficiency_fees_year1_m: 1.3,
            ai_deployment_fees_m: 0.6,
            total_year1_m: 2.9,
            programme_value_year1_m: 22,
          },
        },
      },
    },

    // ─── PHASE 4: Execution & Outcome Tracking ───────────────────────────────
    {
      phase_number: 4,
      status: 'in_progress',
      workstreams: [
        {
          name: 'Monthly Actuals',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Month 3 AI delivery actuals.** AI initiatives in production: **2** (AI-04 live Day 58, AI-07 live Day 64 — both ahead of the 90-day target). Prior auth approval rate: **84%** — up from 68% baseline, United and Aetna. BCBS goes live Day 90. Prior auth processing time: **8 minutes** — down from 34 minutes baseline. Cycle time: **58 days** for AI-04 (vs 20-month baseline). CDO appointed: **Day 29** — one day ahead of the 30-day target. CMS compliance status: **COMPLIANT for United and Aetna** (2 of 3 required payers — BCBS Day 90 completes top-3 compliance).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CDO — who was appointed and what has happened in the first 30 days?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'An interim CDO from a health system AI background was appointed Day 29. In the first 30 days: (1) **Prior auth scope decision**: approved top-3 first on Day 1 of tenure — the decision that had been deferred for 11 months was made in the first meeting. (2) **AI portfolio review**: conducted with AI/ML squad in Week 1 — identified 2 initiatives to kill (AI-05, AI-08), 4 to reshape, 2 to accelerate. (3) **MLOps foundation kickoff**: AWS SageMaker environment commissioned, 2 contract MLOps engineers onboarded. (4) **Governance council**: CDO chairs weekly AI delivery standup — first time the AI programme has had a standing governance meeting. **The team morale observation**: the squad shipped AI-04 in 58 days after 18 months of stalling. That is the reset.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'AI-07 ambient documentation — physician adoption at Day 90?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**AI-07 at Day 90**: 312 of 847 physicians (37%) using ambient documentation. Adoption ahead of Wave 1 target (30%). Physician NPS: +52 (from -12 baseline for administrative burden). Time recovered per physician: **0.71 hours/day** (matching pilot). At 312 physicians: **221 physician-hours recovered daily**. Annualized wRVU capacity unlocked: **$2.1M** (50% conversion). The CDO has approved Wave 2 AI-07 rollout: 600 physicians by Month 4, full 847-physician deployment by Month 5. Ahead of the Month 6 plan.',
            },
          ],
        },
        {
          name: 'AI Deployment Log',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**AI-04 (Prior Auth Automation)** — live Day 58. Month 3 production metrics: **United Health**: 1,847 prior auth requests processed, 84% approval rate (vs 68% baseline), **$1.1M annualized denial recovery**. **Aetna**: 1,203 requests, 81% approval rate (Aetna payer-specific rules require one more configuration cycle — completing by Day 100), **$0.7M annualized**. **BCBS**: configuration complete, go-live Day 90. Projected BCBS contribution: **$0.9M annualized**. **Total AI-04 annualized value at full payer coverage**: **$2.7M**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Any issues with the Epic integration for AI-04?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'One integration issue in Week 2: Epic prior auth workflow was triggering duplicate submissions for United payer — same request sent twice, inflating approval rate metrics by approximately 12%. Identified and fixed in Week 3 by the clinical informatics team (CMIO flagged it). After correction, United approval rate settled at 84% (originally appeared to be 96% — the duplicate was inflating it). This is the kind of issue that the MLOps monitoring pipeline will catch automatically once it is in place (Week 12). For now, manual reconciliation against United remittance data confirms the 84% figure is clean. No data integrity issues since Week 3.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 2 — where is the MLOps foundation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**MLOps foundation at Day 90**: model registry live (Week 6), inference endpoint operational (Week 9), monitoring pipeline in development (Week 12 target). **AI-02 (Clinical Documentation Improvement)** development started Day 62 — using the registry and inference endpoint already built. Current status: model training on Meridian clinical notes data (12 months history). Projected production: Day 140. **AI-09 (Supply Chain Prediction)**: Ensemble FHIR R4 configuration completed Week 8 (Ensemble engineering made the change in 11 days). AI-09 development starts Day 90 with clean data. Projected production: Day 175.',
            },
          ],
        },
        {
          name: 'Knowledge Compound',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Meridian × PDLC adds four new Genome data points. (1) **F002 resolution pattern in health systems**: CDO appointment on Day 29, scope decision made on Day 1 of CDO tenure, AI initiative in production Day 58. This is the fastest F002 resolution in a health system IDN in the Genome — previously the median was 4.5 months. (2) **Epic prior auth deployment pattern**: 60% complete → production in 58 days with governance unlock. Genome now has 3 data points for this pattern — median 62 days. (3) **Ambient documentation adoption**: 37% in 90 days at a system with no prior AI physician tooling — Genome median is 28% at 90 days. (4) **Two-cloud MLOps** (AWS + Epic/Azure): AWS-primary approach with Epic FHIR API bridge is validated.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CMS compliance milestone — where does that land in the Genome?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Meridian is on track to be the **fourth health system in the Genome to achieve CMS prior auth mandate compliance** through AI (vs manual process compliance). Three prior systems: all took 18–24 months from project initiation. Meridian: **Day 90 partial compliance, Month 10 full compliance** from initiation today — **fastest in Genome**. Key differentiator: starting with United and Aetna (highest volume, APIs already integrated) gave immediate compliance coverage for 58% of MA volume on Day 58. The "top-3 payers first" approach is now a confirmed Genome recommendation for health systems with multi-payer complexity. Adding to the pattern library.',
            },
          ],
        },
      ],
      output: {
        output_type: 'outcome_report',
        title: 'Phase 4 Output — Month 3 AI Delivery Report',
        status: 'published',
        content: {
          reporting_period: 'Month 3 (Day 61–90)',
          executive_summary:
            'Two AI initiatives in production by Day 90 — AI-04 prior auth and AI-07 ambient documentation. CDO appointed Day 29. Prior auth approval rate 84% (vs 68% baseline), processing time 8 minutes (vs 34 minutes baseline). CMS compliance: 2 of 3 required payers live (BCBS Day 90 completes top-3). Cycle time: 58 days vs 20-month baseline. AI-07 at 37% physician adoption ahead of target. MLOps foundation on track for Week 12. Programme is ahead of Wave 1 targets on all metrics.',
          metrics: {
            ai_in_production: { baseline: 0, current: 2, target_month12: 5, unit: 'initiatives' },
            prior_auth_approval_rate: { baseline: 68, current: 84, target: 90, unit: '%' },
            prior_auth_processing_time_min: { baseline: 34, current: 8, target: 8, unit: 'minutes' },
            cycle_time_days: { baseline: 600, current: 58, target_wave1: 60, unit: 'days' },
            cms_compliance_payers: { baseline: 0, current: 2, target: 12, unit: 'payers' },
            physician_ai_adoption_pct: { baseline: 0, current: 37, target: 100, unit: '%' },
          },
          verified_value: {
            ai_04_annualized_m: 2.7,
            ai_07_annualized_m: 2.1,
            cms_penalty_avoided_m: 1.9,
            total_annualized_m: 6.7,
            milestone_fee_earned_m: 0.4,
            efficiency_fee_earned_m: 0.71,
          },
          next_milestones: [
            { milestone: 'AI-04 BCBS go-live (Day 90)', date: 'Day 90', status: 'ON_TRACK' },
            { milestone: 'Top-3 CMS compliance confirmed', date: 'Month 3', status: 'ON_TRACK' },
            { milestone: 'AI-07 600-physician rollout', date: 'Month 4', status: 'ON_TRACK' },
            { milestone: 'MLOps foundation complete', date: 'Week 12', status: 'ON_TRACK' },
            { milestone: 'AI-02 Clinical Documentation production', date: 'Day 140', status: 'ON_TRACK' },
            { milestone: 'CMS full 12-payer compliance', date: 'Month 10', status: 'ON_TRACK' },
          ],
          genome_additions: [
            'F002 health system resolution: CDO → scope decision Day 1 → production Day 58 (fastest IDN in Genome)',
            'Epic prior auth deployment: 60% complete → production in 58 days (Genome median: 62 days)',
            'Ambient documentation adoption: 37% at Day 90 with no prior physician AI (Genome median: 28%)',
            'Two-cloud MLOps pattern: AWS-primary + Epic FHIR bridge validated',
          ],
        },
      },
    },
  ],
}
