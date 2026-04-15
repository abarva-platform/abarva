import type { DemoEngagement } from './arcturus-delivery-demo'

export const ARCTURUS_AI_STRATEGY_DEMO: DemoEngagement = {
  engagement_name: 'Arcturus Financial Group × AI Strategy Engagement',
  phases: [
    // ─── PHASE 1: Diagnose ───────────────────────────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Contradiction Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "I have cross-referenced your board presentations against your financial and operational data. **7 leadership statements are directly contradicted by the data.** The most material: your CEO stated in Q4 2025 that 'AI investment is delivering strong early returns' — but your AI portfolio shows **£94M committed and £0 documented ROI**. This is Genome pattern **F008 at 91% failure rate** — the highest-confidence match in the database. Before I walk through each contradiction, I need to understand: is leadership aware of this gap, or is this a reporting blind spot?",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Which contradiction is most material to the investment committee?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The **IC Package**. The AI portfolio contradiction is most material — £94M spend with £0 ROI is not just a reporting gap, it is the business case for everything that follows. Second most material: CTO stated 'our data infrastructure is cloud-ready' — **3 failed cloud migrations (2019, 2021, 2022)**, £2.84M spent with no material outcome. Board approved the Azure enterprise agreement on that basis. The IC Package depends on both contradictions being surfaced and addressed before the committee sees the numbers. If they encounter these discrepancies in the room, the package fails.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the root cause of the reporting blind spot?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**F002 at 89%**. No named AI executive sponsor means no single person accountable for the production gap. CDO vacant **11 months**. 3 consulting engagements on AI strategy, all stalled. Board papers written by initiative owners who have incentive to report progress. The reporting structure produces optimism systematically — every initiative is categorised as 'active', none as 'failed'. Without a CDO to own the portfolio, there is no mechanism for the board to see the gap between what is committed and what is delivered.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Recommendation for fixing the reporting structure?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three interventions in sequence. **(1) Appoint CDO before Phase 2 begins** — without this, the contradictions will recur. **(2) AI Portfolio Review**: categorise all 28 initiatives into production/pilot/development/cancelled. Report only production. **(3) Board reporting template**: single-page dashboard with 4 metrics — models in production, verified ROI, time to production, executive sponsor coverage. Genome pattern F002 is broken by accountability structure, not technology. The CDO appointment is the single highest-leverage intervention across all 6 patterns identified in this engagement. **OUTPUT_READY**",
            },
          ],
        },
        {
          name: 'Data Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "I have scored your data estate across 12 dimensions. **Overall data readiness: 31/100 — partial readiness.** Three critical gaps are blocking your highest-value AI initiatives directly. **(1) 4-day analytical lag** — readmission model unusable. **(2) No golden record** — 14 data marts with conflicting definitions. **(3) ETL developer cliff** — Informatica, 1 developer retiring Q3 2026, 1 contractor expiring Q4 2026, no knowledge transfer plan. These three gaps collectively block 22 of your 28 AI initiatives.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the cost of the 4-day lag?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Quantification: readmission model built 2021, never deployed, could prevent **340 annual readmissions at £12,400 per avoided readmission = £4.2M annual value locked**. The lag is not the only blocker — no MLOps platform — but it is the data prerequisite for deployment. Fix the lag, still need MLOps. Fix MLOps, still need the lag fixed. **Both must be in Wave 1.** The 4-day lag is created by the manual Informatica ETL process running nightly — the same process whose developer is retiring in Q3 2026. This is the most urgent intersection of technical debt and value lock.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Priority sequence for data remediation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 1 (0-90 days):** (1) Azure Data Factory to replace 3 critical SSIS packages — removes the developer cliff risk for highest-priority pipelines. (2) SQL Server 2017 migration to Azure SQL — EOL, unpatched, the foundation for everything. (3) Informatica knowledge capture for the 6 undocumented mappings before Q3 2026. **Wave 2 (91-180 days):** Caboodle completion (population health, quality measures subject areas). **Wave 3 (181-365 days):** Real-time pipeline for clinical alerting. The sequence is determined by dependency — each wave creates the foundation for the next.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the data readiness certificate?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The data readiness certificate confirms which AI initiatives can proceed immediately, which are data-blocked, and which require the remediation sequence before they can start. **AI-023 and AI-026 are pre-certified** — external data, no internal golden record dependency. **8 initiatives are certified pending Wave 1 remediation.** 13 initiatives require Wave 2+. **5 initiatives should be cancelled regardless of data readiness** — the underlying use cases are not supported by the data estate regardless of remediation investment. **OUTPUT_READY**",
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Situation Brief',
        status: 'approved',
        content: {
          headline: '7 leadership contradictions confirmed. £94M AI spend with £0 verifiable ROI is the most material. CDO vacancy is the structural cause.',
          verdict_summary: 'Arcturus leadership has been reporting AI progress to the board without a production definition. Every initiative is categorised as active — none as failed. The reporting structure, not the technology, is the primary risk.',
          genome_matches: [
            { code: 'F008', name: 'AI spend zero verified ROI', failure_rate: 0.91, confidence: 0.91 },
            { code: 'F002', name: 'No named AI executive sponsor', failure_rate: 0.89, confidence: 0.89 },
          ],
          top_findings: [
            {
              title: 'CEO stated "strong AI ROI" — £0 verified ROI in portfolio',
              description: '£94M committed across 28 initiatives. Zero with documented production outcome. Genome F008 at 91% failure rate.',
              severity: 'critical',
              genome_pattern: 'F008',
            },
            {
              title: 'CTO stated "cloud-ready data infrastructure" — 3 failed migrations',
              description: '2019, 2021, 2022 — all failed. £2.84M spent. Same root cause each time: lift-and-shift architecture without cloud-native redesign.',
              severity: 'critical',
              genome_pattern: 'F006',
            },
            {
              title: 'CDO vacancy 11 months — no AI executive sponsor',
              description: '28 AI initiatives, no single accountable owner. Reporting blind spot is structural, not accidental.',
              severity: 'high',
              genome_pattern: 'F002',
            },
          ],
        },
      },
    },

    // ─── PHASE 2: Prescribe ──────────────────────────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'Technology Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Your technology estate has **6 systems at critical risk**, scored on 4 criteria: age relative to peer median, annual maintenance cost, dependency depth, and migration risk. **SQL Server 2017: highest risk** — EOL October 2025, currently running unpatched. **Teradata EDW: highest value** — £4.2M annually, 23% of queries exceeding SLA, Basel IV deadline Q1 2027 creates a compliance forcing function. **Netezza: highest urgency** — IBM support ended 2019, 3 live compliance reports (CCAR, trade surveillance archive, AML baseline) with no alternative data source.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the Netezza risk quantification?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Netezza running **7 years past vendor EOL**. No security patches since 2019. 3 live compliance reports use Netezza as sole data source — no alternative exists. If Netezza fails, **3 compliance obligations cannot be met**. Regulatory exposure: PRA supervisory finding, potential enforcement. Migration complexity: HIGH — undocumented logic, 87TB, 15 years of trade history. Budget: £6.8M approved, Cognizant selected, Q4 2026 target. Critical risk: 3 compliance reports have undocumented source logic — Cognizant cannot migrate what is not documented. **OUTPUT_READY** intervention needed in Wave 1.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Modernisation sequence recommendation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**(1) SQL Server 2017 → Azure SQL** (30 days, £1.2M — non-negotiable, EOL). **(2) Netezza logic documentation sprint** (60 days — precondition for migration success). **(3) Teradata performance optimisation** (90 days — buys time while Synapse migration is planned). **(4) Netezza → Azure Synapse migration** (120-365 days — long lead time, complex). **(5) Teradata → Azure Synapse** (365+ days — after Netezza is validated in cloud). Basel IV deadline in Q1 2027 makes item 4 time-critical.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'AI readiness certificate criteria?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Certificate issued when: SQL Server 2017 is migrated (removes unpatched risk), Netezza logic is documented (removes migration blocker), and Informatica knowledge capture is complete (removes developer cliff risk). These 3 create the foundation. **The certificate will not be issued until all 3 are complete** — partial progress does not reduce the risk. Each of the 3 prerequisites is independently verifiable and has a named owner in the Wave 1 plan. **OUTPUT_READY**",
            },
          ],
        },
        {
          name: 'Vendor Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "I have evaluated **4 SIs** against your specific engagement context using the Genome database of comparable FinServ transformations. **SI-B: 87% Genome match** — strong AI capability, FinServ depth, best price anchor. **SI-A: 71% Genome match** — strong delivery track record, weak AI capability. **SI-C: 64% Genome match** — brand name, poor FinServ track record on similar programmes. **Recommendation: SI-B.** The 87% match is the highest for any FinServ AI transformation engagement in the Genome for your profile.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the price anchor negotiation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Market rate for this profile: **£2,800/day**. SI-B's opening bid: £2,600/day. Genome-validated anchor from 3 comparable FinServ engagements: **£2,100/day** (25% below market). Leverage points: (1) 12-month committed volume — SI-B needs the reference client. (2) Outcome milestone gates — reduces their risk premium. (3) Key person clauses — they want the deal, you want the people. With these 3 levers, £2,100/day is achievable. At £700/day below market on 6 Maestros over 12 months, the saving is **£2.1M on the SI cost alone**.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Contractual protections required?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three mandatory protections. **(1) Outcome milestone gates** — payment tied to delivery milestones, not time. If milestone is missed, payment is withheld until remediated. **(2) Key person clauses** — named leads cannot be rotated without client approval. Genome shows key person rotation causes 34% of FinServ programme failures. **(3) IP ownership** — all code, models, and documentation created during the engagement are client-owned. No Bloomberg-style proprietary hooks. SI-B has agreed to all three in principle. The contract should be signed before Phase 3 begins.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Final vendor recommendation for board?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**SI-B.** 87% Genome match to successful FinServ AI transformations. £700/day below market rate with full outcome milestone gates. Three contractual protections securing IP and delivery accountability. The board presentation should frame this as: we did not choose the brand name — we chose the track record. The Genome comparison table will be included in the IC Package. **OUTPUT_READY**",
            },
          ],
        },
        {
          name: 'Architecture Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Based on the technology audit and vendor evaluation, I have generated **3 architecture options**, each scored against Genome failure patterns. **Option A (cloud-native migration): 34% success rate** in your peer group — the same approach that failed in your 2021 Clarity migration. **Option B (hybrid with abstraction layer): 71% success rate** — isolates your highest-dependency systems while enabling cloud-native new builds. **Option C (lift-and-shift): 23% success rate** — fastest but lowest success probability. **My recommendation: Option B.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What makes Option B's success rate 71% vs Option A's 34%?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The structural difference is **sequencing**. Option A requires solving the Bloomberg customisation problem before moving anything else to cloud — the 8 proprietary hooks are the blocker. Option B isolates Bloomberg behind an abstraction layer (API wrapper over the 6 portable customisations), which allows the rest of the estate to move to cloud without triggering the Bloomberg dependency. The 2021 Clarity migration failed because 89 Tableau workbooks connected directly to Clarity — same pattern. Option B would have put Clarity behind an abstraction layer first. Genome pattern F003: abstraction-first approaches have **71% success**; integration-first have **34%**.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Build sequence for Option B?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 1 (0-90 days):** Bloomberg API abstraction layer for 6 portable customisations. SQL Server 2017 → Azure SQL. This removes the two highest-risk blockers simultaneously. **Wave 2 (91-180 days):** Teradata analytics workloads → Azure Synapse (non-risk workloads first). MLOps platform deployment (MLflow + SageMaker). **Wave 3 (181-365 days):** Netezza → Azure Synapse (migration now unblocked by documented logic). AI initiative pipeline begins deploying against new infrastructure. The sequence is designed so each wave de-risks the next. **OUTPUT_READY**",
            },
          ],
        },
      ],
      output: {
        output_type: 'ai_readiness_certificate',
        title: 'AI Readiness Certificate',
        status: 'approved',
        content: {
          headline: 'Arcturus is partial-ready for AI transformation. 3 infrastructure prerequisites must be resolved in Wave 1 before the investment committee package is credible.',
          verdict_summary: 'Technology modernisation sequence, vendor selection, and architecture blueprint are complete. SI-B selected at £2,100/day with full contractual protections. Option B hybrid architecture provides 71% success probability — highest in peer group for this technology profile.',
          genome_matches: [
            { code: 'F003', name: 'Vendor lock-in preventing modernisation', failure_rate: 0.82, confidence: 0.87 },
            { code: 'F006', name: 'Repeated migration failure same root cause', failure_rate: 0.78, confidence: 0.84 },
          ],
        },
      },
    },

    // ─── PHASE 3: Justify ────────────────────────────────────────────────────
    {
      phase_number: 3,
      status: 'approved',
      workstreams: [
        {
          name: 'Business Case Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The business case is built from three inputs: your baseline data (from Phase 0 and Phase 1), Genome comparables (3 FinServ transformations with similar AI portfolio profiles), and your risk tolerance (from our Phase 2 conversations). **Base case: £140M over 3 years on £94M redeployed investment** — not additional spend — redeployed from 5 cancelled initiatives and consulting rationalisation. **IRR 34%. Payback 14 months.** Bear case £95M (1.0x ROI — floor is break-even). Bull case £220M (2.3x ROI). Genome-validated against 3 comparable FinServ transformations.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'How is the £94M redeployment structured?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "£94M AI spend broken down: **£42M consulting** (3 stalled engagements → replaced by 6 Maestros at fraction of cost), **£31M vendor AI tools** (14 platforms → rationalised to 5 with documented ROI), **£12M internal AI team** (redeployed from notebook development to production engineering), **£9M Bloomberg AIM subscription reoptimisation**. The redeployment is not additional investment. It is the same £94M redirected from activities with £0 ROI to activities with Genome-validated return profiles. The CFO narrative: **this is a reallocation, not a new budget ask.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the three-scenario sensitivity?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Bear case (£95M, 1.0x ROI):** assumes only AI-023 and AI-026 reach production in Year 1, MLOps takes 18 months instead of 12, 40% of consulting rationalisation is achieved. **Base case (£140M, 1.5x ROI):** 8 initiatives in production by Year 2, MLOps in 12 months, 70% consulting rationalisation, Teradata contract renegotiation. **Bull case (£220M, 2.3x ROI):** full 14-initiative pipeline, Netezza migration success by Q4 2026 (unlocking 3 compliance capabilities), Bloomberg abstraction layer enables 6 new derivative product models. All three scenarios use Genome-comparable data as the validation anchor — not management estimates.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'How does the Genome validation work?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "3 comparable FinServ transformations from the Genome: **(1) UK Asset Manager, £18B AUM** — AI portfolio rationalisation from 22 to 7 initiatives, £67M over 2 years. **(2) European Bank, €95B AUM** — MLOps platform + consulting rationalisation, €112M over 3 years. **(3) US Asset Manager, $45B AUM** — Bloomberg AIM abstraction + cloud migration, $89M over 2 years. Arcturus is the largest of the three but the most complex. Base case calibrated to the European Bank outcome as the closest comparable. The Genome says the bear case has a **23% probability**, base **54%**, bull **23%**.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Investment committee package structure?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "IC package sections: **(1) Executive summary** — one page, three numbers: investment £94M redeployed, base case return £140M, payback 14 months. **(2) Three-scenario model** — full sensitivity, assumption list, Genome validation. **(3) Vendor recommendation** — SI-B at £2,100/day, contractual protections. **(4) Technology sequence** — Option B architecture, wave plan. **(5) Risk register** — 6 risks, likelihood and impact, mitigation for each. **(6) Fee structure** — AbarVa 15-20% of verified savings. No verified savings, no fee. **(7) Approval page** — signatures from CFO and CEO. **OUTPUT_READY**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Final numbers for the board?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Investment: £94M (redeployed, not additional). Base return: £140M over 3 years. IRR: 34%. Payback: 14 months. Bear case: £95M (break-even floor). Bull case: £220M. AbarVa fee: 15% of verified savings = £21M at base case, earned monthly as savings are verified. First fee trigger: Month 3 (£3.5M verified savings from consulting rationalisation). The CFO needs one number: **at base case, every £1 we redeploy returns £1.49. At bear case, it returns £1.01. There is no scenario where this loses money.** **OUTPUT_READY**",
            },
          ],
        },
        {
          name: 'AI Delivery Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**6 structural bottlenecks** in your current AI delivery path. **Primary: no MLOps platform** — every model deployed manually from Jupyter notebook. **Secondary: no model registry** — 14 production models tracked in Excel spreadsheet. **Third: no monitoring** — credit scoring model, 340 daily decisions, never monitored since 2019. AI-023 fastest path: **AWS Bedrock, 58 days**. This is the proof point that unlocks Wave 2 funding and board confidence.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'MLOps platform selection?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Two options. **(1) MLflow + SageMaker:** 12-week deployment, £420K, proven in 3 comparable FinServ environments in Genome. Handles model registry, versioning, deployment, and monitoring. Works with your existing AWS footprint. **(2) Azure ML:** 16-week deployment, £580K, better Azure integration but longer timeline and higher cost. **Recommendation: MLflow + SageMaker.** 12-week deployment means AI-023 can go live on Bedrock in Week 8, and the first fully MLOps-managed model can follow in Week 16. The credit scoring model — the highest regulatory risk — is the first model that goes through the new platform for retraining and monitoring.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Credit scoring model remediation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Credit scoring model (2019, logistic regression, 340 daily decisions, never retrained): **(1) Immediate:** freeze new credit decision rules until model is validated. **(2) Week 1-2:** extract training data, document feature engineering. **(3) Week 3-6:** retrain on 2019-2024 data, validate against holdout. **(4) Week 7-8:** deploy through new MLOps platform with full monitoring (drift detection, performance tracking). **(5) Ongoing:** monthly retraining cycle. The Bank of England SS1/23 guidance requires model validation processes — this remediation creates the compliance evidence. Regulatory risk resolved by Week 8.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Delivery roadmap for the board?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 1 (Days 1-58):** AI-023 live on AWS Bedrock. Credit scoring model retrained and monitored. MLOps platform 50% deployed. **Wave 1 (Days 59-90):** MLOps platform complete. AI-026 live. First CDO month in post. **Wave 2 (Days 91-180):** 4 additional initiatives live through MLOps. Teradata optimisation complete. Bloomberg API abstraction layer live. **Wave 3 (Days 181-365):** Full 14-initiative pipeline. Netezza migration 80% complete. 8 models in production with outcome tracking. This is the roadmap that produces the base case return. **OUTPUT_READY**",
            },
          ],
        },
      ],
      output: {
        output_type: 'investment_committee',
        title: 'Investment Committee Package',
        status: 'approved',
        content: {
          headline: 'AI Strategy: £94M redeployed → £140M return. 34% IRR. 14-month payback. Genome-validated.',
          scenarios: [
            { label: 'Bear', investment: '£94M', return: '£95M', irr: '12%', payback: '28 months' },
            { label: 'Base', investment: '£94M', return: '£140M', irr: '34%', payback: '14 months' },
            { label: 'Bull', investment: '£94M', return: '£220M', irr: '67%', payback: '9 months' },
          ],
          genome_note: 'Genome-validated against 3 comparable FinServ transformations averaging £89M return on similar investment profile',
          vendor_recommendation: {
            name: 'SI-B',
            genome_match: '87%',
            day_rate: '£2,100/day vs £2,800 market rate',
            protections: [
              'Outcome milestone gates — payment tied to delivery, not time',
              'Key person clauses — named leads cannot be rotated without approval',
              'IP ownership — all code and models are client property',
            ],
          },
          risks: [
            { risk: 'MLOps platform deployment delay', likelihood: 'medium', impact: 'high', mitigation: 'AWS Bedrock for AI-023 as parallel track' },
            { risk: 'Netezza migration complexity', likelihood: 'high', impact: 'high', mitigation: 'Logic documentation sprint in Wave 1 before migration starts' },
            { risk: 'CDO appointment timeline', likelihood: 'medium', impact: 'medium', mitigation: 'Interim AI governance structure from Week 1' },
          ],
        },
      },
    },

    // ─── PHASE 4: Execute & Verify ───────────────────────────────────────────
    {
      phase_number: 4,
      status: 'complete',
      workstreams: [
        {
          name: 'Outcome Intelligence',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Month 1 actuals.** AI-023 live Day 58 as forecast. Credit scoring model retrained and monitored. Consulting rationalisation: **£38M annualised** (target £42M — slightly behind due to 90-day notice periods on 3 contracts). CDO appointed Day 61. **2 models in production** (AI-023, AI-026). First fee trigger approaching: Month 3 threshold is £3.5M cumulative verified savings.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Why is consulting rationalisation behind target?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "3 consulting contracts have notice periods of **90 days** — longer than modelled. The £38M annualised is the run rate at Month 1. By Month 3, the notice periods expire and the rationalisation accelerates to £42M. This is a **timing difference, not a structural miss**. The baseline agreement accounts for this: fee triggers are measured at Month 3, not Month 1. No adjustment needed.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Month 2 update?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Month 2 actuals.** AI portfolio: **4 models in production** (AI-023, AI-026, AI-004 credit scoring retrained, AI-007 trade surveillance retrained). Time to production: **31 days average** for Wave 1 initiatives (benchmark: 127 days before engagement). Consulting spend: £36M annualised (rationalisation accelerating faster than model). MLOps platform: **100% deployed**. Bloomberg API abstraction layer: 60% complete (on schedule for Wave 2 completion). CDO: first AI governance board meeting held.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Month 3 fee trigger?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 3 verified savings: **£3.44M** against £3.5M trigger threshold. **Fee trigger: ACTIVATED.** AbarVa fee earned: £3.44M × 15% = **£516K**. Verification methodology: (1) consulting invoices Month 1-3 vs baseline year same period (independently auditable). (2) AI-023 ROI: £1.2M verified via portfolio manager output tracking. (3) Credit scoring model performance: 340 daily decisions, 3% improvement in accuracy translating to £180K in credit loss avoidance. Total: £3.44M. The CFO needs to sign the fee release. All supporting documentation is in ARC-D-FEE-003.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Engagement complete summary?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Engagement complete at Month 3 (initial phase). 8 models in production. Consulting spend £36M annualised (target £42M — on track with timing adjustment). **£3.44M verified savings triggering first fee.** CDO in post. MLOps platform live. Next milestone: Month 6 — second fee trigger expected at £8.5M cumulative savings. The board presentation at Month 3 should show: we said £140M over 3 years. At Month 3, we are on the base case trajectory. Fee earned: **£516K on £3.44M verified — exactly 15%.** **OUTPUT_READY**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the 12-month projection from current trajectory?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 3 trajectory extrapolation (Genome-validated): consulting rationalisation reaching full £42M by Month 4. AI portfolio: **8 models in production by Month 6**, 14 by Month 12. Time to production: 31 days current, target **21 days by Month 12** as MLOps matures. Cumulative verified savings at Month 12 (base case): **£47M**. AbarVa fee at Month 12: **£7.05M** (15% of £47M). The programme is tracking at base case. If Bloomberg API abstraction completes in Wave 2 and 3 new derivative product models are deployed in Q3, trajectory shifts toward bull case. That would put 12-month savings at £64M.",
            },
          ],
        },
        {
          name: 'Fee Tracker',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Fee tracker initialised.** Baseline locked: £42M consulting spend, 0 models in production with documented ROI, 127-day average time to production. Fee structure: **15% of verified savings**. First trigger: £3.5M. Second trigger: £10M cumulative. All subsequent: monthly as savings accumulate. The baseline is immutable — every penny of savings is measured against these locked numbers.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Month 1 verified savings?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 1 verified savings: **£1.2M**. Breakdown: consulting rationalisation £800K (annualised £38M vs baseline £42M = £4M annual, Month 1 = £333K — note this is annualised rate, first fee trigger uses 3-month cumulative). AI-023 ROI £400K (Month 1 portfolio manager output improvement, documented and signed off by CIO). Total Month 1: £1.2M. First trigger requires £3.5M cumulative — **on track for Month 3.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Month 3 fee release documentation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Fee release documentation: **ARC-D-FEE-003** package contains: (1) Consulting spend comparison: Month 1-3 invoices vs baseline year same period — audited by Deloitte (as agreed in baseline agreement). (2) AI-023 ROI: 12 portfolio managers signed off on £1.2M output improvement. Methodology: time saved × analyst hourly rate × output quality improvement. (3) Credit scoring: actuarial calculation of credit loss avoidance from 3% accuracy improvement over 340 daily decisions × 90 days. (4) Total: **£3.44M verified, £516K fee triggered.** CFO signature required.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Projected total fee at engagement close (base case)?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Base case fee projection: £140M verified savings × 15% = **£21M total AbarVa fee over 3 years**. Year 1: £47M savings → £7.05M fee. Year 2: £52M savings → £7.8M fee. Year 3: £41M savings → £6.15M fee. This fee is earned **exclusively on verified savings** — if savings do not materialise, fee is not earned. The baseline is immutable. The CFO signed off that £42M consulting spend and 0 models in production are the starting point. Every penny of savings is measured against those numbers. **OUTPUT_READY**",
            },
          ],
        },
      ],
      output: {
        output_type: 'outcome_report',
        title: 'Monthly Outcome Report — Month 3',
        status: 'approved',
        content: {
          month: 3,
          kpis: [
            { name: 'AI Portfolio Verified ROI', current_value: '£3.44M', target: '£3.5M trigger', status: 'on_track' },
            { name: 'Models in Production', current_value: '4', target: '8 by Month 6', status: 'on_track' },
            { name: 'Time to Production', current_value: '31 days', target: '21 days', status: 'on_track' },
            { name: 'Consulting Spend Annualised', current_value: '£36M', target: '£42M', status: 'behind' },
          ],
          verified_savings: '£3.44M',
          fee_earned: '£516K',
          next_trigger: '£10M cumulative (Month 6 projected)',
          timeline: [
            { label: 'M1', status: 'complete' },
            { label: 'M2', status: 'complete' },
            { label: 'M3', status: 'current' },
            { label: 'M4', status: 'future' },
            { label: 'M5', status: 'future' },
            { label: 'M6', status: 'future' },
          ],
        },
      },
    },
  ],
}
