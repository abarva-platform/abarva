import type { DemoEngagement } from './arcturus-delivery-demo'

export const ARCTURUS_DELIVERY_FULL_DEMO: DemoEngagement = {
  engagement_name: 'Arcturus Financial Group × Delivery — Full Engagement',
  phases: [
    // ─── PHASE 1: Consulting Audit & Diagnosis ───────────────────────────────
    {
      phase_number: 1,
      status: 'complete',
      workstreams: [
        {
          name: 'Consulting Audit',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Opening with the anchor finding from ARC-D01. Your total external consulting and professional services spend is **£42M per year** across six relationships. That figure alone doesn't tell you much — the question is what you're getting for it. Genome analysis has scored each relationship on three dimensions: knowledge transfer rate, contracted vs actual delivery velocity, and strategic dependency risk. The headline: **four of your six vendors score below 25% on knowledge transfer**. You are paying £42M per year to maintain dependencies, not to build capability. At the current trajectory, the structural cost of this posture — measured in C/I drag — is running at roughly **£840M against your £840B AUM base**, which maps directly to the 13-point gap between your actual C/I of 71% and your stated target of 58%.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Let's go vendor by vendor. Start with Wipro — they're the largest line item.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Wipro: **£18M per year, KT score 15/100**. That KT score puts them in the bottom 3% of asset management vendors in the Genome dataset. Here's what 15/100 means operationally: documentation is produced but not actionable — your internal engineers describe it as 'written for the auditors, not for us.' Runbooks exist for 4 of 17 production systems Wipro manages. The remaining 13 have no documented recovery procedures outside Wipro's own team. Contracted delivery velocity was 100%; actual is 58%. The gap is concentrated in two squads: OMS Core (47% velocity) and AI/ML Platform (61% velocity). The AI/ML Platform gap is particularly costly because it directly delays the three AI initiatives that have CDO sign-off: AI-023, AI-026, and AI-031. Every month the AI/ML Platform squad underdelivers is a month those initiatives don't reach production.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What about Bloomberg LP versus the AWS comparison you flagged in the pre-read?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The Bloomberg vs AWS comparison is the clearest pricing signal in your portfolio. Bloomberg LP: **£8.4M per year, KT score 8/100**. AWS ProServe: **£2.1M per year, KT score 62/100**. You are paying four times as much for Bloomberg as for AWS and getting eight times less knowledge transfer. Bloomberg's justification for the premium has historically been domain expertise in fixed income data modelling — but your internal Client Data Platform squad has rebuilt equivalent capability for three of the five Bloomberg-proprietary models in the last 18 months. Bloomberg's moat is narrowing, and their contract renewal posture hasn't reflected that. The peer comparison is stark: a comparable European asset manager (£620B AUM, similar fixed income weight) renegotiated their Bloomberg professional services contract from £7.8M to £1.9M after a capability audit. Arcturus hasn't done that audit.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Google PSO ended last quarter — what did we actually lose when that contract closed?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The Google PSO contract ended with a **KT score of 5/100** — the lowest in your portfolio and the lowest we have recorded for a cloud professional services relationship in financial services. What was lost: the MLOps pipeline architecture that Google PSO built for the Portfolio Analytics squad exists as running infrastructure but has no documented ownership model. Three engineers who understood it at a working level have since left Arcturus. Your current AI/ML Platform squad can operate the pipeline in steady state but cannot modify, scale, or debug it beyond first-level issues. That matters because AI-023 and AI-026 — both of which depend on that MLOps foundation — require the pipeline to be extended before they can reach production. The Genome flags this as **Genome pattern F001 at 72% confidence**: vendor dependency embedded at infrastructure layer with no internal ownership path. The remediation cost — hiring an MLOps Maestro to reconstruct that knowledge — is estimated at £180K for a six-month engagement. That is the cost of a 5/100 KT score.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'McKinsey — £12M is significant. How do you score a strategy firm on KT?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "McKinsey scores **KT 22/100** — below the median for strategy consultancies but not the outlier in your portfolio. The KT issue with McKinsey isn't documentation; it's recommendation handoff. Of the 14 strategic recommendations delivered across three engagements in the past four years, **55% have been implemented** — and of those implemented, 61% were implemented with McKinsey's continued involvement rather than internal capability. That creates a self-reinforcing dependency: McKinsey identifies problems, recommends solutions, and is then engaged to execute them, which means your internal teams never develop the pattern-recognition that should follow a strategy engagement. The Genome flags this at **F002 (no exec sponsor to drive internal adoption) at 84% confidence**. The CDO vacancy — now 11 months — is the proximate cause. Without a CDO to own AI strategy execution, McKinsey fills the vacuum, at £12M per year.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "What's the combined picture? If I had to defend £42M spend to the board next month, what's my honest position?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Your honest position is this: **£42M in consulting spend is producing approximately £14M in retained internal value per year** — a 33% return on spend. The remaining £28M is either pure execution cost (work done by vendors that your teams could do if they had the capability) or dependency cost (knowledge that lives in vendor organisations and depreciates when those relationships change). The £94M AI commitment is the compounding problem. You have spent £94M on AI and produced **£0 in verified ROI**. That's not because the initiatives are wrong — AI-023 and AI-026 are well-scoped and technically sound. It's because the delivery infrastructure — CDO leadership, MLOps foundation, governance — was never built. The consulting audit finding is: you have a £42M/year cost structure that is preventing you from realising value from a £94M investment. The Genome gives this a **pilot purgatory score of 76% (F009)**: initiatives approved, funded, and technically ready — stalled at the delivery layer.",
            },
          ],
        },
        {
          name: 'Knowledge Risk',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Knowledge risk analysis covers the six vendor relationships and maps each to an internal squad. The question we're answering: if any of these relationships ended tomorrow, what would Arcturus be unable to do? Starting with the highest-risk concentration: **Wipro manages 13 of 17 production systems** — OMS Core, AI/ML Platform, and four settlement systems — with no documented internal recovery path. The Portfolio Analytics squad is the standout exception: they score as a **benchmark performer** with internal ownership of all seven systems they operate. The gap between Portfolio Analytics and the rest of the engineering organisation tells you what is possible with the right model.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Score each of the five named squads on knowledge self-sufficiency.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Squad-by-squad knowledge self-sufficiency scores, with Genome benchmarks:\n\n**Portfolio Analytics — 84/100 (benchmark performer).** Internal ownership of all production systems. Documentation up to date. No vendor dependency for steady-state operations. The squad built its own monitoring stack after Bloomberg PSO disengaged in 2022 and never asked for it back. This is the model.\n\n**OMS Core — 31/100 (high risk).** Wipro holds the institutional knowledge for 4 of 7 OMS modules, including the fix gateway and the reconciliation engine. Two internal engineers who understood the reconciliation logic at depth left in 2023. No succession plan was executed.\n\n**AI/ML Platform — 38/100 (high risk).** The Google PSO MLOps handoff left three systems — the feature store, model registry, and deployment pipeline — with no internal owner. Engineers can operate them; they cannot extend or recover them.\n\n**Client Data Platform — 67/100 (moderate, improving).** The squad has rebuilt three of five Bloomberg data models internally. Two remain proprietary. Bloomberg's contract leverage is shrinking but not gone.\n\n**Digital Innovation Lab — 22/100 (critical risk).** All five AI prototypes in the lab were built by McKinsey teams. None have been handed over with working runbooks. F009 pattern confirmed: pilot purgatory.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the quantified cost of the OMS Core knowledge gap if Wipro exits?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "OMS Core knowledge gap — Wipro exit scenario. Genome has modelled this from 14 comparable exits across asset management and banking. **Immediate cost (0-90 days):** Estimated 6-8 weeks of degraded settlement velocity as the internal team reverse-engineers undocumented reconciliation logic. At Arcturus's trade volume, a 15% settlement velocity reduction for 6 weeks costs approximately **£4.2M in operational drag**. **Reconstruction cost (3-12 months):** Hiring or contracting to rebuild documentation and knowledge — estimated **£1.8M** for a 9-month engagement with two senior OMS specialists. **Total exit cost: £6M minimum.** Against a £18M/year Wipro contract, that means Arcturus is paying a £6M premium to delay an inevitable transition. The longer the dependency persists, the higher that exit cost grows — we estimate **£2.1M per additional year** as knowledge compounds in Wipro's team rather than yours.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The Digital Innovation Lab concerns me most. What exactly is pilot purgatory costing us?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Pilot purgatory (Genome F009, 76% confidence) is the most expensive pattern in your portfolio because the costs are invisible on a P&L. Here's the accounting:\n\n**Direct sunk cost:** The five Digital Innovation Lab prototypes — built primarily by McKinsey teams — represent approximately **£7.2M in development spend** across two years. None are in production. None have a production pathway.\n\n**Opportunity cost:** AI-023 (portfolio risk signal model) was validated in the lab 14 months ago. Had it reached production on schedule, Genome benchmarks suggest a comparable model produces **£8-12M/year in avoided trade losses** for an asset manager of Arcturus's profile. 14 months of delay: **£9.3-16.8M in foregone value**.\n\n**CDO vacancy multiplier:** Every month the CDO seat is vacant, AI governance decisions default to committee, which defaults to no decision. The 11-month CDO vacancy has contributed to **zero AI initiatives reaching production** despite £94M committed. The Genome flags this as the single highest-leverage intervention available: one hire resolves F002, F009, and the McKinsey dependency simultaneously.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'Are there any knowledge risk bright spots — things that are working that we should protect?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Portfolio Analytics is the bright spot, and it's worth understanding exactly why so you can replicate it. Three structural differences between Portfolio Analytics and the rest of the organisation:\n\n**1. No vendor in the critical path.** Portfolio Analytics rebuilt its Bloomberg dependency internally in 2022. The squad lead made the decision unilaterally because she had budget autonomy and a backlog. That autonomy and that backlog are not standard across squads.\n\n**2. Engineering ownership extends to production.** Portfolio Analytics engineers own their systems from commit to production. There is no handoff to a Wipro operations team. This means problems are visible to the people with the context to fix them.\n\n**3. Documentation is written for the next engineer, not the auditor.** The squad has a norm — not a policy — of writing every runbook for a hypothetical new hire with six months' experience. That norm produces documentation that is actually used.\n\nThe recommendation: before designing the Maestro model, study Portfolio Analytics. The Maestros we design should embed these three properties. The squad's knowledge self-sufficiency score of 84/100 is achievable for every squad in the organisation — it requires structural decisions, not heroics.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Last question on knowledge risk — how do we prevent the same patterns from recurring?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Recurrence prevention requires changing three structural conditions:\n\n**1. Procurement scoring must include KT obligation.** Every vendor contract should specify a minimum KT score — we recommend 60/100 as the floor for renewal eligibility — with monthly measurement and a remediation trigger at 45/100. Bloomberg LP at 8/100 and Wipro at 15/100 would not be renewable under this standard.\n\n**2. CDO must own the knowledge register.** Currently there is no single owner for the knowledge risk picture across all squads. The CDO, once appointed, should publish a quarterly knowledge risk report to the board alongside the standard AI progress update. Visibility creates accountability.\n\n**3. Vendor onboarding must include a knowledge transfer plan, not just a SOW.** The Google PSO engagement had no knowledge transfer plan. The MLOps pipeline was built, it worked, the contract ended, and no one asked where the knowledge went. A 90-day KT plan — executed in parallel with delivery — is the standard the Genome recommends for every engagement over £500K.\n\nThese three changes are not expensive. They are governance changes. The Maestro model we design in Phase 2 embeds all three.",
            },
          ],
        },
        {
          name: 'Internal Capability',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Internal capability assessment covers the five named squads against a benchmark of comparable asset managers. The headline finding: **Arcturus's internal engineering capability is stronger than your vendor spend pattern suggests**. The Portfolio Analytics squad is a genuine benchmark performer. OMS Core and AI/ML Platform have deep domain knowledge that is currently underutilised because Wipro owns the production layer. The capability is there. The structural conditions to express it are not. This matters for the Phase 2 Maestro design: we are not proposing to replace weak internal capability with Maestros. We are proposing to remove the structural barriers that prevent strong internal capability from compounding.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'Give me the capability map — who can do what without vendor support?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Capability map — current state, without vendor support:\n\n**Portfolio Analytics (self-sufficient):** Full-stack capability from data ingestion to model production. Can design, build, operate, and debug independently. Has done so for three years. Benchmark: 84/100.\n\n**Client Data Platform (partially self-sufficient):** Can own Bloomberg data pipelines for three of five model types. Cannot own the remaining two — proprietary Bloomberg API patterns. Has strong Python and Spark capability. Gap: advanced fixed-income data modelling. Fillable with one senior hire or a Bloomberg Maestro engagement.\n\n**OMS Core (operationally dependent):** Deep domain knowledge of order management logic among four senior engineers. Cannot manage production infrastructure without Wipro. The constraint is not skill — it's access and documentation. If Wipro provided proper runbooks tomorrow, OMS Core could own production within 90 days.\n\n**AI/ML Platform (MLOps-dependent):** Strong ML engineering capability. The Google PSO MLOps gap means they cannot extend the feature store or deployment pipeline. One AI/ML Maestro — six months — closes this gap entirely.\n\n**Digital Innovation Lab (prototype-only):** Design and prototyping capability. No production pathway experience. Currently structured as a lab, not a delivery team. The lab model was the right environment for exploration; it is the wrong model for the production push that AI-023 and AI-026 require.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The CDO seat has been vacant 11 months. What capability vacuum does that create?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Eleven months without a CDO has created four specific capability vacuums that are not visible in the squad assessments:\n\n**1. AI governance decisions are made by committee.** The AI governance committee requires consensus across CTO, CFO, and CRO for any initiative over £500K. That threshold catches every material AI initiative. Consensus governance produces delay — the average time from approval to execution has been 7.3 months for AI initiatives in the CDO-vacant period versus 2.1 months for the two years prior.\n\n**2. Vendor relationships have no strategic owner.** Bloomberg LP, Wipro, and McKinsey all have renewal negotiations pending. Without a CDO, negotiations are being led by procurement on cost rather than by strategy on value and KT obligation.\n\n**3. The AI portfolio has no prioritisation framework.** AI-023 and AI-026 are ready for production. Eight other initiatives are at various stages. Without a CDO, there is no mechanism to say 'do these two first because they produce the fastest verified ROI.' The portfolio sits in parallel slow motion.\n\n**4. The board AI narrative has no author.** The last CDO produced a quarterly AI progress report that the board valued. That report has not been produced in 11 months. The board is approving AI spend without a structured ROI conversation.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "If we hired a CDO tomorrow — what could the internal teams actually do in 90 days?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "With a CDO in seat, here is a credible 90-day internal capability picture — no new hires beyond the CDO, no vendor changes:\n\n**Days 1-30:** CDO establishes AI governance with decision rights that don't require committee consensus for sub-£2M initiatives. AI-023 (portfolio risk model) enters production deployment using existing AI/ML Platform squad capacity. CDP squad begins Bloomberg data model migration for model types 4 and 5.\n\n**Days 30-60:** AI-026 (client churn prediction) enters production. OMS Core squad begins production documentation with Wipro under a KT obligation clause — negotiated by the CDO using the KT scores from this audit as leverage. Bloomberg Maestro onboards and takes over models 4 and 5 from the CDP squad, freeing them for new roadmap work.\n\n**Days 60-90:** First verified ROI report produced: AI-023 producing initial risk signal value, AI-026 producing churn predictions with a 60-day validation window. CDO presents to board with actual numbers rather than committed spend. The £0 verified ROI figure changes for the first time.\n\nThe 90-day picture assumes existing squad capability is real — and the assessments confirm it is. The CDO is not a capability hire. The CDO is a decision-making infrastructure hire.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'What is the honest assessment of whether Arcturus can actually execute the transition away from vendor dependency?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The honest assessment is: yes — with a specific caveat. The capability to execute is present in the organisation. Portfolio Analytics proves that the model works at Arcturus. OMS Core and AI/ML Platform have the domain depth to own their systems. Client Data Platform is already 60% of the way there on Bloomberg. The Digital Innovation Lab needs a structure change, not a capability change.\n\nThe caveat: **execution requires three things that are not currently in place**. First, a CDO to own the transition decision-making. Second, a Maestro model that provides targeted knowledge injection — not wholesale capability replacement — for the MLOps gap, the Bloomberg gap, and the OMS documentation gap. Third, a performance management structure that holds vendor contracts to KT obligation rather than renewing them on relationship inertia.\n\nWithout those three things, the capability sits idle and the vendor dependency compounds. With them, Genome analysis suggests Arcturus can reach **70/100 average internal self-sufficiency within 18 months** — from a current average of 49/100 — and bring C/I from 71% to the 62-64% range through the combination of AI production and consulting spend reduction. The 58% target is a 3-year story, not an 18-month one, but 18 months gets you more than halfway there.",
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Arcturus Financial Group — Situation Brief',
        content: {
          engagement: 'Arcturus Financial Group × Delivery',
          date: '2025-Q1',
          executive_summary:
            'Arcturus carries £42M/yr in consulting spend generating a 33% knowledge-retention return. Four of six vendors score below 25% on knowledge transfer. £94M in AI investment has produced £0 in verified ROI. The CDO seat has been vacant 11 months. Three Genome patterns are confirmed: F001 (vendor dependency, 72%), F002 (no exec sponsor, 84%), F009 (pilot purgatory, 76%). The C/I ratio of 71% represents a £840M gap to the 58% target.',
          vendor_audit: {
            total_spend_m: 42,
            vendors: [
              { name: 'Wipro', spend_m: 18, kt_score: 15, delivery_velocity_pct: 58, risk: 'critical' },
              { name: 'Bloomberg LP', spend_m: 8.4, kt_score: 8, delivery_velocity_pct: 72, risk: 'critical' },
              { name: 'McKinsey', spend_m: 12, kt_score: 22, delivery_velocity_pct: 55, risk: 'high' },
              { name: 'AWS ProServe', spend_m: 2.1, kt_score: 62, delivery_velocity_pct: 91, risk: 'low' },
              { name: 'Google PSO', spend_m: 0, kt_score: 5, delivery_velocity_pct: 0, risk: 'legacy', note: 'Contract ended — knowledge not transferred' },
              { name: 'Other', spend_m: 1.5, kt_score: 41, delivery_velocity_pct: 80, risk: 'medium' },
            ],
          },
          squad_capability: [
            { name: 'Portfolio Analytics', self_sufficiency: 84, benchmark: 'above' },
            { name: 'Client Data Platform', self_sufficiency: 67, benchmark: 'at' },
            { name: 'AI/ML Platform', self_sufficiency: 38, benchmark: 'below' },
            { name: 'OMS Core', self_sufficiency: 31, benchmark: 'below' },
            { name: 'Digital Innovation Lab', self_sufficiency: 22, benchmark: 'critical' },
          ],
          genome_patterns: [
            { code: 'F001', name: 'Vendor dependency at infrastructure layer', confidence_pct: 72 },
            { code: 'F002', name: 'No named executive sponsor', confidence_pct: 84 },
            { code: 'F009', name: 'Pilot purgatory', confidence_pct: 76 },
          ],
          ai_portfolio: {
            committed_m: 94,
            verified_roi_m: 0,
            in_production: 0,
            cdo_vacant_months: 11,
          },
          ci_ratio: { actual_pct: 71, target_pct: 58, gap_m: 840 },
        },
        status: 'approved',
      },
    },

    // ─── PHASE 2: Maestro Design & Prescription ──────────────────────────────
    {
      phase_number: 2,
      status: 'complete',
      workstreams: [
        {
          name: 'Maestro Team Design',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Phase 2 opens with the design question: given the capability map from Phase 1, what is the minimum viable set of Maestros that resolves the three confirmed Genome patterns? The answer is **six Maestros**, each targeted at a specific knowledge gap or governance failure. This is not a staffing recommendation — it's a structural intervention design. Each Maestro has a defined entry condition, an exit condition, and a KT obligation measured at the squad level. The model is: Maestros embed in squads, transfer knowledge, and leave the squad stronger than they found it. The exit condition is scored, not assumed.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Walk me through each of the six Maestros — role, scope, and exit condition.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Six Maestros designed for Arcturus:\n\n**1. AI/ML Maestro (replaces Google PSO).** Scope: own the MLOps foundation — feature store, model registry, deployment pipeline — and rebuild internal knowledge in the AI/ML Platform squad. Embeds with the squad for six months. Exit condition: AI/ML Platform squad self-sufficiency score ≥65/100, AI-023 and AI-026 in production, MLOps pipeline documented to Portfolio Analytics standard. Annual cost: £280K vs £0 (Google PSO ended, knowledge not replaced).\n\n**2. Bloomberg Maestro.** Scope: execute the Bloomberg data model migration for models 4 and 5, and close the Client Data Platform's remaining Bloomberg dependency. Exit condition: Client Data Platform self-sufficiency ≥78/100, Bloomberg professional services contract reduced to £2.1M (from £8.4M). Six-month engagement. Annual cost: £190K.\n\n**3. Delivery Maestro.** Scope: OMS Core production ownership transition from Wipro. Oversee documentation of all 13 undocumented production systems. Exit condition: OMS Core self-sufficiency ≥65/100, all 13 systems documented to runbook standard. 9-month engagement. Annual cost: £240K.\n\n**4. Governance Maestro.** Scope: interim CDO support until permanent CDO is in seat. Establish AI governance framework, decision rights, and board reporting cadence. Exit condition: CDO hired and onboarded, governance framework ratified, first board AI progress report delivered. 3-month engagement. Annual cost: £180K.\n\n**5. Strategy Maestro.** Scope: replaces McKinsey for the AI strategy workstream. Owns the 3-year AI roadmap execution plan and the vendor renegotiation sequencing. Exit condition: Year 1 roadmap fully resourced and governed, McKinsey retainer ended. 6-month engagement. Annual cost: £220K.\n\n**6. Data Maestro.** Scope: Digital Innovation Lab restructure — from lab model to production pathway model. Owns the handover of the five existing prototypes. Exit condition: at least three prototypes have production pathways defined and resourced, Lab self-sufficiency ≥50/100. 6-month engagement. Annual cost: £200K.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The AI/ML Maestro replacing Google PSO makes sense — but can one person really close a gap that Google PSO created with a full team?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The Google PSO team that built the MLOps pipeline was six engineers over 18 months. The AI/ML Maestro is not rebuilding the pipeline — the pipeline exists and runs. The Maestro is doing three specific things: first, reconstructing the architectural documentation that Google PSO didn't leave behind. Second, training two senior AI/ML Platform engineers to own and extend the pipeline at depth. Third, executing the specific extensions needed for AI-023 and AI-026 — which are well-scoped and don't require rebuilding the foundation.\n\nGenome data from comparable MLOps handoff engagements: the reconstruction task takes 3-4 months for a senior MLOps specialist who can read the codebase and interview the engineers who operated it. The remaining 2-3 months is training and supervised production ownership transfer. One person with the right profile is sufficient — the constraint was never headcount, it was having an identified owner. The AI/ML Platform squad has four engineers who are ready to own this. They just don't have the MLOps depth to do it unsupported. The Maestro closes that gap.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "How does the Maestro model prevent Arcturus from just rebuilding the same vendor dependency, but with Maestros instead of Wipro?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The structural safeguard is the exit condition scoring. Every Maestro engagement has a defined exit condition measured at the squad level — not at the Maestro output level. The distinction matters: a Maestro can produce perfect documentation and still fail the exit condition if the squad can't use it. The exit condition test is: can the squad operate, extend, and recover the relevant systems without the Maestro present?\n\nThis is enforced through three mechanisms: First, the Maestro engagement contract specifies the exit condition score and makes it a condition of full fee payment — 15% of the Maestro fee is held until the exit condition is met. Second, the CDO (once in seat) owns the exit condition assessment — not the Maestro, not procurement. Third, the exit condition is re-assessed six months after Maestro exit to test knowledge retention. If the squad score drops more than 10 points, a re-engagement clause is triggered at no additional cost.\n\nThe Wipro dynamic — where dependency compounds year over year — cannot happen if exit conditions are enforced. The Wipro contract has no exit condition. The Wipro contract has a renewal clause. That is the structural difference.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the total Maestro cost versus the £42M current vendor spend?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Total Maestro cost in Year 1 (six Maestros, staggered engagements): **£1.31M**. For comparison, the consulting spend being displaced by the Maestros: Bloomberg LP reduction (£8.4M→£2.1M saves **£6.3M**), McKinsey retainer ended (saves **£12M**), Wipro renegotiated with KT obligation (target 30% reduction, saves **£5.4M**). Year 1 net: £23.7M in consulting savings against £1.31M in Maestro cost — a **18:1 return on the Maestro investment** before any AI production value is counted.\n\nThe Maestro cost is not the right frame for the investment decision. The right frame is: £1.31M in structured knowledge transfer versus the compounding cost of continued dependency — estimated at £28M/year in dependency cost from the Phase 1 audit. The Maestros are cheap. The dependency is expensive.",
            },
          ],
        },
        {
          name: 'Vendor Verdicts',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Vendor verdicts — four recommendations, each with a specific action, a financial target, and a Genome-evidenced rationale. The four verdicts are: Bloomberg LP EXIT, Wipro RENEGOTIATE, McKinsey EXIT, AWS RETAIN. These are not opinions — they are outputs of the KT scoring, delivery velocity data, and peer benchmarking from Phase 1. Each verdict has a 90-day action plan.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Bloomberg LP EXIT — walk me through the case. Their team will push back hard on the domain expertise argument.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Bloomberg LP's defence will be: 'No one else understands fixed-income data at this depth for an asset manager of Arcturus's scale.' That defence has two weaknesses.\n\n**Weakness 1: The capability has already been replicated.** Client Data Platform rebuilt models 1, 2, and 3 internally. Bloomberg's technical moat on those models is gone. The Bloomberg Maestro closes models 4 and 5 within six months. The 'irreplaceable expertise' argument applies to £1.2M of the £8.4M contract — the remaining £7.2M is professional services work that your internal team can do or that a Bloomberg Maestro can transfer.\n\n**Weakness 2: The peer benchmark.** A comparable European asset manager (£620B AUM, 67% fixed income weight vs Arcturus's 71%) renegotiated from £7.8M to £1.9M after a capability audit. Bloomberg accepted the reduction because the alternative was full exit and loss of the terminal contract — which Arcturus also holds. Bloomberg's professional services revenue is a retention play on the terminal contract. Arcturus has leverage it has never used.\n\n**The EXIT verdict:** reduce professional services to £2.1M — matching the AWS ProServe cost for genuinely comparable scope — with a 12-month transition period. If Bloomberg will not move below £4M, full exit and replace with Bloomberg Maestro + internal capability. Timeline: renewal negotiation to open in 60 days.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Wipro RENEGOTIATE — why not exit, given the 15% KT score?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The case for RENEGOTIATE rather than EXIT on Wipro is operational, not relational. Wipro manages 13 production systems. Exiting Wipro before OMS Core owns those systems is the OMS Core exit scenario we modelled in Phase 1: £6M minimum, 6-8 weeks of settlement velocity degradation. The Delivery Maestro needs 9 months to build OMS Core's self-sufficiency to exit-ready. EXIT becomes the right decision at month 10 — not month 1.\n\nThe renegotiation has two non-negotiable terms. First: **KT obligation clause** — Wipro must achieve 60/100 KT score within 6 months or face a 20% fee reduction. Measured quarterly by the CDO. Second: **delivery velocity penalty** — actual delivery below 85% of contracted triggers a proportional fee reduction. At Wipro's current 58% delivery velocity, that would represent a £7.4M fee reduction on current contract terms.\n\nWipro's incentive to accept: the alternative is a scheduled exit in 9 months. Under the renegotiated terms, Wipro retains a reduced but stable contract for 24 months while transitioning systems to internal ownership. Genome data shows vendors accept KT obligation terms in 73% of renegotiations when presented with a credible exit alternative.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "McKinsey EXIT — what's the replacement model for strategy work?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "McKinsey EXIT is the highest-value verdict in the portfolio. £12M per year, 22% KT score, 55% recommendation implementation rate — with McKinsey's own continued involvement required for implementation. The McKinsey model at Arcturus has become self-referential: McKinsey identifies problems, McKinsey recommends solutions, McKinsey is engaged to implement. That loop is worth £12M per year to McKinsey and produces no compounding internal capability.\n\nThe replacement model is two-track. **Track 1: Strategy Maestro** (£220K for six months) owns the AI strategy roadmap and vendor renegotiation sequencing — the two primary McKinsey workstreams. The Maestro embeds with the CDO's team and transfers the analytical and prioritisation frameworks, not just the outputs. **Track 2: CDO** owns strategy execution ongoing. The CDO position — once filled — is designed to internalise the strategy function that McKinsey has been performing. The CDO hire is the permanent McKinsey replacement.\n\nTransition plan: McKinsey to be notified of exit at contract renewal in 90 days. Strategy Maestro onboards 30 days before McKinsey exit. 30-day overlap for knowledge transfer from McKinsey to Maestro. Full McKinsey exit at Day 120.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "AWS RETAIN — what's the logic, and are there conditions?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "AWS ProServe RETAIN is the simplest verdict. £2.1M per year, 62% KT score — the highest in the portfolio by a substantial margin. AWS is the only vendor in the portfolio that is actively building Arcturus's internal capability rather than protecting its own position. The AI/ML Platform squad's cloud infrastructure knowledge grew measurably during the AWS engagement. AWS ProServe has a structural incentive for high KT: their business model is built on customers consuming more AWS services, which happens faster when internal teams are capable. That incentive alignment is rare in professional services.\n\nThe conditions: RETAIN with two modifications. First, extend the KT measurement cadence to monthly — AWS is already at 62%, but we want to ensure the score rises rather than plateaus. Second, redirect AWS ProServe scope toward AI infrastructure for AI-023 and AI-026 specifically. The current scope includes legacy infrastructure support that would be better owned by OMS Core. Scope adjustment estimated to increase effective AWS value by 30% at the same cost.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the total financial impact of the four verdicts?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Total financial impact of the four vendor verdicts, Year 1 and Year 3:\n\n**Year 1 (12 months):**\n- Bloomberg LP EXIT: £6.3M saving (£8.4M→£2.1M)\n- Wipro RENEGOTIATE: £5.4M saving (30% reduction on £18M)\n- McKinsey EXIT: £12M saving\n- AWS RETAIN: £0 change\n- Maestro investment: −£1.31M\n- **Net Year 1 saving: £22.4M**\n\n**Year 3 (cumulative, including AI production value):**\n- Consulting spend reduced from £42M to £8.6M: **£33.4M/yr saving**\n- AI production value (AI-023, AI-026, plus Year 2 initiatives): **£28-42M/yr**\n- C/I ratio improvement: 71% → 62-64%\n- **Year 3 cumulative value: £94-112M**\n\nThe verdicts are not primarily a cost reduction story — they are a capability building story. The £33.4M/yr in consulting savings is the floor. The AI production value is the ceiling, and the ceiling is substantially higher.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Any risks to the vendor verdict execution that could blow up the financial model?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three execution risks with mitigations:\n\n**Risk 1: Bloomberg LP refuses to negotiate below £6M.** Probability: 30%. If Bloomberg refuses, the full exit scenario is executable within 12 months — Bloomberg Maestro closes the remaining model dependencies in 6 months, Client Data Platform owns the full stack at month 7. Bloomberg knows this. The credibility of the full exit alternative is the negotiation leverage. Mitigation: prepare the Bloomberg Maestro brief before the negotiation opens.\n\n**Risk 2: Wipro exits before OMS Core is ready.** Probability: 15%. If Wipro disengages in response to the renegotiation terms, the £6M exit cost scenario activates. Mitigation: structure the renegotiation as a 30-day notice process, with the Delivery Maestro onboarding on Day 1. If Wipro exits, the Maestro accelerates from a 9-month to a 6-month engagement with additional AWS ProServe support.\n\n**Risk 3: CDO hire takes longer than 3 months.** Probability: 40% (the seat has been vacant 11 months — the hiring process has failed before). If the CDO hire extends past 90 days, the Governance Maestro extends and AI governance decisions are temporarily delegated to a modified committee structure with a 2/3 majority rule instead of consensus. The AI portfolio does not stop moving.",
            },
          ],
        },
        {
          name: 'Business Case Construction',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Business case construction covers three scenarios — Conservative, Base, and Optimistic — and a 5-year NPV model. The inputs are: Phase 1 audit data (consulting costs, AI portfolio status, squad capability scores), Phase 2 vendor verdicts (Bloomberg EXIT, Wipro RENEGOTIATE, McKinsey EXIT, AWS RETAIN), and the Maestro team design. The AI roadmap is the third major input — three years of phased AI deployment that converts the £94M committed investment into verified production value.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Give me the three-year AI roadmap before the financial model — I want to see what the revenue line is based on.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three-year AI roadmap:\n\n**Year 1 — Foundation and First Production (CDO hire + AI-023 + AI-026):**\n- Month 1: CDO in seat. AI governance framework live. AI/ML Maestro onboards.\n- Month 2: AI-023 (portfolio risk signal model) in production. Model validated in Digital Innovation Lab 14 months ago — MLOps extension is the only outstanding work.\n- Month 3: AI-026 (client churn prediction) in production. First verified ROI report to board.\n- Months 4-12: Five additional AI initiatives move from approved to production using the now-functioning MLOps pipeline. Year 1 closes with 7 AI initiatives in production.\n- Year 1 AI value: **£28-34M** (risk signal model: £12-16M/yr, churn prediction: £8-11M/yr, five additional initiatives: £8-7M combined)\n\n**Year 2 — MLOps Foundation + Scale (5 initiatives):**\n- AI initiatives 8-12 reach production. MLOps pipeline extended to support model retraining at scale.\n- Bloomberg Maestro closes data model dependency — Client Data Platform owns full stack.\n- Year 2 AI value incremental: **£22-28M** (cumulative: £50-62M)\n\n**Year 3 — 14 AI Initiatives Productionised:**\n- All 14 approved AI initiatives in production.\n- Digital Innovation Lab restructured as AI Centre of Excellence — produces new initiative pipeline.\n- Year 3 AI value incremental: **£18-24M** (cumulative: £68-86M)\n- C/I ratio reaches 61-63% by end of Year 3.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Now the financial model — Conservative, Base, Optimistic, and NPV.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Financial model — three scenarios, annual recurring value by Year 3:\n\n**Conservative (£72M/yr by Year 3):**\n- Consulting reduction: £25M/yr (Bloomberg partial exit, Wipro -20%, McKinsey exit)\n- AI production value: £47M/yr (10 of 14 initiatives in production, lower-end ROI)\n- Assumptions: CDO hire takes 4 months, two AI initiatives stall, Bloomberg negotiates to £4M not £2.1M\n\n**Base (£112M/yr by Year 3):**\n- Consulting reduction: £33.4M/yr (full vendor verdicts executed)\n- AI production value: £78.6M/yr (14 initiatives in production, mid-range ROI)\n- Assumptions: CDO hired in 90 days, all vendor verdicts executed on schedule, MLOps foundation complete by month 6\n\n**Optimistic (£156M/yr by Year 3):**\n- Consulting reduction: £36M/yr (additional discretionary vendor consolidation)\n- AI production value: £120M/yr (14 initiatives plus Year 3 new initiative pipeline from restructured Lab)\n- Assumptions: CDO hire in 60 days, Bloomberg full exit at month 4, AI production ROI at upper-bound\n\n**5-Year NPV (Base scenario, 12% discount rate):**\n- Year 1: £47M net (investment: £24M Maestros + CDO + transition; value: £71M)\n- Year 2: £94M net\n- Year 3: £112M net\n- Year 4: £118M net (compounding AI value, full consulting reduction)\n- Year 5: £124M net\n- **NPV: £224M** (Base scenario)\n- Conservative NPV: £158M\n- Optimistic NPV: £312M",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the fee structure for this engagement?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The fee structure is performance-linked and designed to align AbarVa's incentive with verified outcome delivery. Structure:\n\n**Base fee: 15% of verified savings and AI production value.** Measured quarterly. Verified means: consulting contract changes with signed amendments (Bloomberg reduction, Wipro renegotiation, McKinsey exit), and AI production value with a 90-day measurement window (not projected value — actual measured value from deployed models).\n\n**Payment cadence:** 30% of estimated base fee billed upfront to cover Maestro onboarding. 70% billed quarterly against verified actuals. If verified savings exceed the base estimate, the 15% rate applies to the additional value. If verified savings fall below the Conservative scenario, the fee adjusts to match.\n\n**Milestone payments:** Three milestone payments tied to Phase 3 (Baseline Lock) and Phase 4 (monthly actuals). The £1.5M fee released at the end of Phase 4 Month 3 is conditional on £10M in verified savings — a 6.7x return on the fee at that milestone.\n\nThe performance-linked structure means AbarVa's financial outcome is the same as Arcturus's. If the vendor verdicts aren't executed, the consulting savings aren't verified, and the fee doesn't accrue. The model is designed to make AbarVa an owner of execution, not just a producer of analysis.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Final question — how does this compare to what McKinsey or a Big 4 firm would deliver for the same problem?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The direct comparison: McKinsey's approach to the same brief would produce a strategy document in 12-16 weeks at £3.5-5M, with recommendations for vendor renegotiation and an AI roadmap. The implementation of those recommendations would then be a separate engagement — historically, McKinsey's at Arcturus. The fee structure is time-and-materials with no outcome linkage.\n\nThe structural difference: McKinsey builds no internal capability at Arcturus, intentionally or otherwise. The McKinsey business model depends on the client needing them next time. The Maestro model is the opposite: every Maestro engagement is designed to make itself unnecessary. The exit condition is capability transfer, not deliverable production.\n\nThe financial comparison: McKinsey strategy engagement (£4M) + McKinsey implementation (£12M/yr ongoing) = £16M Year 1 with no KT, no vendor renegotiation execution, no AI production accountability. AbarVa Delivery engagement: £1.31M Maestros + 15% of verified savings (£3.4M in Year 1 at Base scenario) = **£4.7M Year 1, with £22.4M in net savings and the first AI production deployments**. The value produced in Year 1 is approximately 4.8x the cost of the engagement.",
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Arcturus Financial Group — Solution Design',
        content: {
          engagement: 'Arcturus Financial Group × Delivery',
          date: '2025-Q1',
          maestro_team: [
            { id: 'M-01', role: 'AI/ML Maestro', replaces: 'Google PSO', duration_months: 6, annual_cost_k: 280, exit_condition: 'AI/ML Platform self-sufficiency ≥65, AI-023 and AI-026 in production' },
            { id: 'M-02', role: 'Bloomberg Maestro', replaces: 'Bloomberg LP (professional services)', duration_months: 6, annual_cost_k: 190, exit_condition: 'Client Data Platform self-sufficiency ≥78, Bloomberg services ≤£2.1M' },
            { id: 'M-03', role: 'Delivery Maestro', replaces: 'Wipro (transition)', duration_months: 9, annual_cost_k: 240, exit_condition: 'OMS Core self-sufficiency ≥65, 13 systems documented' },
            { id: 'M-04', role: 'Governance Maestro', replaces: 'Interim CDO support', duration_months: 3, annual_cost_k: 180, exit_condition: 'CDO hired and onboarded, governance framework ratified' },
            { id: 'M-05', role: 'Strategy Maestro', replaces: 'McKinsey (AI strategy)', duration_months: 6, annual_cost_k: 220, exit_condition: 'Year 1 AI roadmap fully resourced, McKinsey retainer ended' },
            { id: 'M-06', role: 'Data Maestro', replaces: 'Digital Innovation Lab (restructure)', duration_months: 6, annual_cost_k: 200, exit_condition: '3 of 5 prototypes have production pathways, Lab self-sufficiency ≥50' },
          ],
          vendor_verdicts: [
            { vendor: 'Bloomberg LP', verdict: 'EXIT', current_spend_m: 8.4, target_spend_m: 2.1, saving_m: 6.3, timeline_days: 180 },
            { vendor: 'Wipro', verdict: 'RENEGOTIATE', current_spend_m: 18, target_spend_m: 12.6, saving_m: 5.4, timeline_days: 270 },
            { vendor: 'McKinsey', verdict: 'EXIT', current_spend_m: 12, target_spend_m: 0, saving_m: 12, timeline_days: 120 },
            { vendor: 'AWS ProServe', verdict: 'RETAIN', current_spend_m: 2.1, target_spend_m: 2.1, saving_m: 0, timeline_days: 0 },
          ],
          financial_scenarios: {
            conservative: { annual_value_m_yr3: 72, npy_5yr_m: 158 },
            base: { annual_value_m_yr3: 112, npv_5yr_m: 224 },
            optimistic: { annual_value_m_yr3: 156, npv_5yr_m: 312 },
          },
          ai_roadmap: {
            year_1: { initiatives_in_production: 7, ai_value_m: 28, key_milestones: ['CDO hire', 'AI-023 production', 'AI-026 production'] },
            year_2: { initiatives_in_production: 12, ai_value_m_incremental: 22, key_milestones: ['MLOps scaled', 'Bloomberg dependency closed'] },
            year_3: { initiatives_in_production: 14, ai_value_m_incremental: 18, key_milestones: ['AI Centre of Excellence', 'C/I 61-63%'] },
          },
          fee_structure: {
            model: 'performance-linked',
            rate_pct: 15,
            upfront_pct: 30,
            milestone_fee_m: 1.5,
            milestone_trigger_savings_m: 10,
          },
        },
        status: 'approved',
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ───────────────────────────────
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
                "Baseline lock is the most important phase of this engagement — not the most interesting, but the most important. Every outcome claim in Phase 4 is only credible if the baseline is documented, sourced, and agreed before any interventions begin. Four baseline metrics require locking: C/I ratio, AI spend, consulting spend, and Bloomberg contract value. Each metric needs a source file, a measurement date, and a sign-off from the CFO or delegated authority. The baseline cannot be amended after Phase 3 closes.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Walk me through each baseline metric — source, value, and any measurement disputes.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Four baseline metrics, sources, and status:\n\n**1. C/I Ratio — 71.0%**\nSource: ARC-F01 (FY2024 Annual Report, audited). Measurement date: 31 December 2024. No dispute. The audited figure is the baseline. Intra-year C/I will be tracked monthly using management accounts; the annual comparison will use audited figures.\n\n**2. AI Committed Spend — £94M**\nSource: ARC-P01 (AI Portfolio Register, CFO sign-off 15 January 2025). Measurement date: 15 January 2025. One dispute: the Digital Innovation Lab team argues that £12M of the £94M should be categorised as R&D rather than AI committed spend, which would reduce the baseline to £82M. The CFO has not accepted the reclassification. Baseline locked at £94M.\n\n**3. Total Consulting Spend — £42M/yr**\nSource: ARC-P02 (Procurement Register Q4 2024). Measurement date: 31 December 2024. No dispute. Individual vendor values: Wipro £18M (ARC-C01), Bloomberg LP £8.4M (ARC-C02), McKinsey £12M (ARC-C03), AWS ProServe £2.1M (ARC-C04), Other £1.5M.\n\n**4. Bloomberg LP Professional Services — £8.4M/yr**\nSource: ARC-C02 (Bloomberg Contract, current term). Measurement date: 15 January 2025. This metric has its own baseline because the Bloomberg verdict is the highest-value single vendor action. The £8.4M figure is the annual professional services component only — separate from the Bloomberg terminal contract, which is not subject to this engagement.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The baseline is clean — approved. What's the fee measurement methodology?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Fee measurement methodology — three measurement types, one rule:\n\n**Type 1: Consulting savings.** Measured as the difference between the baseline contract value and the amended contract value, confirmed by a signed contract amendment. Bloomberg: reduction from £8.4M to £2.1M confirmed by signed Bloomberg amendment = £6.3M verified saving. Wipro: measured against renegotiated contract term. McKinsey: measured as £12M saving from the date the retainer ends, confirmed by contract termination.\n\n**Type 2: AI production value.** Measured at 90 days post-production deployment, using a methodology agreed with the CDO before deployment. For AI-023 (portfolio risk model): avoided trade loss, measured against a control period using matched portfolios. For AI-026 (churn prediction): revenue retention from predicted-churn clients who did not churn, measured against a propensity-matched control group.\n\n**Type 3: C/I ratio improvement.** Measured annually against the FY2024 audited baseline. This measurement type is confirmatory — it tracks the aggregate of Types 1 and 2. C/I improvement is not a direct fee trigger; it is a board-level reporting metric.\n\n**The one rule:** AbarVa only bills against Type 1 and Type 2 verified values. No projection. No estimate. No 'run rate.' If the contract amendment hasn't been signed, the saving is not verified. If the AI model hasn't been in production for 90 days, the value is not verified.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Baseline locked. Any final conditions before we move to the wave plan?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Two conditions before the wave plan:\n\n**Condition 1: CFO sign-off on the baseline document.** The baseline metrics — C/I 71%, AI spend £94M, consulting £42M, Bloomberg £8.4M — must be signed by the CFO or a delegated authority (not procurement, not the technology team). This protects both Arcturus and AbarVa: it ensures the baseline cannot be retroactively adjusted if the Phase 4 numbers are uncomfortable.\n\n**Condition 2: Board notification of Phase 3 commencement.** The board should be notified that the engagement has entered execution phase, that the baseline is locked, and that the first outcome report will be available at the end of Month 3. This sets a board expectation that creates accountability — it is much harder to let execution stall if the board has been told that a month-3 report is coming.\n\nBoth conditions are met. CFO sign-off received 22 January 2025. Board notified 24 January 2025 via CTO report.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Good. Move to the wave plan.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Baseline phase complete. All four metrics locked with source files and CFO sign-off. Phase 3 baseline summary:\n\n| Metric | Baseline Value | Source | Date |\n|--------|---------------|--------|------|\n| C/I Ratio | 71.0% | ARC-F01 (audited) | 31 Dec 2024 |\n| AI Committed Spend | £94M | ARC-P01 | 15 Jan 2025 |\n| Consulting Spend | £42M/yr | ARC-P02 | 31 Dec 2024 |\n| Bloomberg Professional Services | £8.4M/yr | ARC-C02 | 15 Jan 2025 |\n\nProceeding to Wave Plan.",
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
                "The Wave Plan structures the execution into three waves over 12 months, sequenced to: deliver early verified savings (wave 1), execute the major vendor transitions (wave 2), and close the AI production gap with the MLOps foundation complete (wave 3). Each wave has a specific savings target, a set of Maestro deployments, and a gate condition before the next wave begins. The gate conditions prevent the engagement from moving forward if critical dependencies are missing.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 1 — what happens in the first 90 days?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 1 — Days 1-90: CDO hire + AI governance + 2 pilots**\n\nWeek 1: Governance Maestro (M-04) onboards. AI governance framework drafted — decision rights matrix, quarterly board reporting template, AI initiative prioritisation criteria.\n\nWeek 2: CDO search process relaunched with specific profile brief (operational CDO, not strategy CDO — the strategy work is done). Governance Maestro manages interim governance.\n\nWeek 3: AI/ML Maestro (M-01) onboards. MLOps pipeline audit begins. Documentation reconstruction starts.\n\nMonth 1 end: AI governance committee reconstituted with modified decision rights (2/3 majority for sub-£2M, CDO/delegated authority for sub-£5M). First AI initiative prioritisation meeting — AI-023 and AI-026 confirmed as Wave 1 production deployments.\n\nMonth 2: AI-023 (portfolio risk model) enters production deployment. MLOps pipeline extension complete for AI-023 requirements. AI-026 staging environment complete.\n\nMonth 3: CDO in seat (target Day 60-75). AI-026 in production. First outcome report published. £4.2M in consulting savings verified (Bloomberg negotiation opens, McKinsey exit notice served). C/I begins moving from 71% baseline.\n\n**Wave 1 savings target: £10-14M (consulting savings only)**\n**Wave 1 gate condition: CDO in seat, AI-023 in production, McKinsey exit notice served.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 2 — the Wipro transition and Bloomberg renegotiation are the heaviest lifts.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 2 — Days 90-180: Wipro transition + Bloomberg renegotiation**\n\nDay 90 (Wave 1 gate cleared): Delivery Maestro (M-03) onboards. Wipro renegotiation opens with KT obligation and delivery velocity terms. Bloomberg Maestro (M-02) onboards.\n\nDays 90-120: Wipro renegotiation. The CDO leads with AbarVa's audit data. Wipro presented with: KT score 15/100 (documented), delivery velocity 58% vs 100% contracted (documented), exit cost modelling (£6M). KT obligation and delivery velocity penalty terms presented. Wipro has 30 days to respond.\n\nDay 120: Bloomberg negotiation opens. CDO presents: peer benchmark (comparable firm at £1.9M), internal capability audit (three of five models rebuilt), Bloomberg Maestro brief (remaining two models closed within 6 months). Bloomberg Professional Services reduction target: £8.4M → £2.1M.\n\nDays 120-150: Wipro response. If Wipro accepts KT obligation terms, renegotiated contract signed. If Wipro rejects, Delivery Maestro accelerates exit preparation.\n\nDays 150-180: Bloomberg resolution. If Bloomberg accepts reduction to ≤£3M, retain with Maestro transition. If Bloomberg refuses, execute full exit — Bloomberg Maestro owns model 4 and 5 migration, Client Data Platform takes full ownership by Day 240.\n\n**Wave 2 savings target: £18-24M cumulative**\n**Wave 2 gate condition: Wipro contract amended (KT obligation) or exit plan activated; Bloomberg contract amended or exit plan activated.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 3 — the AI production scale-up. What does £30M+ look like by Day 365?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 3 — Days 180-365: MLOps foundation + £30M+ savings**\n\nDay 180 (Wave 2 gate cleared): MLOps pipeline is fully documented and internally owned by AI/ML Platform squad (target self-sufficiency 65/100). Five additional AI initiatives enter production deployment using the now-stable MLOps foundation.\n\nDays 180-240: Strategy Maestro (M-05) takes over AI roadmap execution from Governance Maestro. McKinsey exit complete (Day 120). CDO owns AI portfolio directly. Data Maestro (M-06) onboards — Digital Innovation Lab restructure begins.\n\nDays 240-300: AI initiatives 3-7 in production. 90-day measurement windows open for AI-023 and AI-026 verified value. First AI production value enters the fee calculation.\n\nDays 300-365: Year 1 close. Outcome summary:\n- Consulting spend: £42M → £12-16M (McKinsey exited, Bloomberg reduced, Wipro renegotiated)\n- AI in production: 7 initiatives\n- C/I ratio: 71% → 67-68% (first year)\n- Verified savings: **£30M+** (consulting savings £22-26M + AI production value £8-10M Year 1)\n\n**Wave 3 savings target: £30M+ verified by Day 365**\n**Wave 3 gate condition: Year 1 audited outcome report signed by CDO and CFO.**\n\n**Phase 4 releases the £1.5M milestone fee on confirmation of £10M in verified savings at the 90-day mark (Day ~90 of Wave 1).**",
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap',
        title: 'Arcturus Financial Group — Execution Roadmap',
        content: {
          engagement: 'Arcturus Financial Group × Delivery',
          date: '2025-Q1',
          baseline: {
            ci_ratio_pct: 71,
            ai_committed_spend_m: 94,
            consulting_spend_m: 42,
            bloomberg_ps_spend_m: 8.4,
            source_files: ['ARC-F01', 'ARC-P01', 'ARC-P02', 'ARC-C01', 'ARC-C02', 'ARC-C03', 'ARC-C04'],
            cfo_signoff_date: '2025-01-22',
          },
          waves: [
            {
              wave: 1,
              days: '1-90',
              label: 'CDO hire + AI governance + 2 pilots',
              maestros_onboarding: ['M-04 Governance', 'M-01 AI/ML'],
              milestones: ['CDO in seat', 'AI-023 in production', 'McKinsey exit notice served'],
              savings_target_m: { low: 10, high: 14 },
              gate_condition: 'CDO in seat, AI-023 in production, McKinsey exit notice served',
            },
            {
              wave: 2,
              days: '90-180',
              label: 'Wipro transition + Bloomberg renegotiation',
              maestros_onboarding: ['M-03 Delivery', 'M-02 Bloomberg'],
              milestones: ['Wipro KT obligation signed or exit activated', 'Bloomberg reduced to ≤£3M or exit activated'],
              savings_target_m: { low: 18, high: 24 },
              gate_condition: 'Wipro and Bloomberg contracts amended or exit plans activated',
            },
            {
              wave: 3,
              days: '180-365',
              label: 'MLOps foundation + £30M+ savings',
              maestros_onboarding: ['M-05 Strategy', 'M-06 Data'],
              milestones: ['7 AI initiatives in production', 'Consulting spend ≤£16M', 'Year 1 outcome report'],
              savings_target_m: { low: 30, high: 38 },
              gate_condition: 'Year 1 audited outcome report signed by CDO and CFO',
            },
          ],
          fee_milestone: {
            trigger: '£10M in verified savings',
            fee_released_m: 1.5,
            expected_date: 'Day ~90',
          },
        },
        status: 'approved',
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
                "Phase 4 execution begins. Month 1 actuals are in — and the headline is better than the Base scenario predicted for Day 30. CDO appointed Day 12 — ahead of the 60-75 day target. The AI governance framework was constituted on Day 18 with the CDO in the chair. The first prioritisation decision: AI-023 deployment to production cleared by the new CDO on Day 21, under the modified decision rights that don't require committee consensus. The C/I ratio at the end of Month 1 is 70.8% — a 0.2-point move from the 71.0% baseline. That is a small number, but it is the first downward movement in 18 months. The direction is confirmed.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Month 2 — AI-023 and AI-026 live, C/I 70.1%. What are the details behind those numbers?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 2 actuals:\n\n**AI-023 (Portfolio Risk Signal Model) — in production Day 34.**\nThe AI/ML Maestro completed the MLOps pipeline extension on Day 28. AI-023 deployed to production on Day 34 — 6 days ahead of the Wave 1 milestone target. The model is running in shadow mode for the first 30 days: parallel to the existing risk monitoring process, generating signals that the Portfolio Analytics squad is comparing against actual outcomes. Shadow mode closes on Day 64. The 90-day measurement window for verified value opens on Day 34.\n\n**AI-026 (Client Churn Prediction) — in production Day 47.**\nAI-026 required a data pipeline connection to the CRM system that wasn't in the original scope. The CDO cleared a £180K scope addition on Day 38 (first use of the new sub-£2M unilateral decision right). AI-026 deployed Day 47. The churn prediction model has flagged 14 clients with >70% 90-day churn probability — 3 of them are in the top 20 AUM relationships. The Relationship Management team has been notified.\n\n**C/I at Month 2 end: 70.1%.**\nThe 0.9-point improvement from baseline (71.0% → 70.1%) is driven by: McKinsey exit (retainer ended Day 44, saving beginning to register in management accounts), Bloomberg negotiation opening (no saving yet — negotiation in progress), AI-023 early risk signal value (one avoided trade adjustment attributed to the model: £2.1M).\n\nMonth 2 verified savings: **£4.8M** (McKinsey exit £4M annualised pro-rata for 46 days + AI-023 avoided trade attribution £2.1M reduced to 90% confidence weighting: £1.9M).",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Month 3 — the Wipro renegotiation completing at £6.2M saving is the big number. Walk me through it.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 3 Wipro renegotiation — the full account:\n\nThe Delivery Maestro presented Wipro with the Phase 1 audit data on Day 93: KT score 15/100, delivery velocity 58% vs 100% contracted, 13 production systems without documented recovery procedures. Wipro's initial response was to dispute the KT scoring methodology. The CDO held the position: the methodology is Genome-standard, the data is sourced from Wipro's own deliverable archive, and the scoring has been validated against 14 comparable engagements.\n\nWipro counter-proposed: KT score increase to 45/100 within 6 months (accepting the KT obligation) and delivery velocity penalty applying only to new work (not the existing backlog). Arcturus counter: KT obligation accepted, but the delivery velocity penalty applies to all contracted work from the renegotiation date.\n\nFinal renegotiated terms (signed Day 74):\n- Annual fee reduced from £18M to **£11.8M** (saving: **£6.2M/yr**)\n- KT obligation: 60/100 within 6 months, measured by CDO quarterly\n- Delivery velocity penalty: 1.5% fee reduction per percentage point below 90%\n- Documentation obligation: all 13 undocumented systems to have Delivery Maestro-approved runbooks within 90 days\n- Exit clause: 6-month notice period, triggered if KT score falls below 45/100 after a remediation period\n\nThe £6.2M saving is the largest single verified saving in this engagement to date.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Month 3 close — what is the total verified savings picture and the fee release?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 3 close — verified savings summary:\n\n| Source | Verification | Amount |\n|--------|-------------|--------|\n| McKinsey exit (Day 44 × 90-day pro-rata) | Contract termination signed | £2.95M |\n| Wipro renegotiation (Day 74 × 46-day pro-rata) | Contract amendment signed | £0.78M |\n| AI-023 avoided trade losses (90-day measurement window opens Day 34, 56-day partial) | CDO-verified attribution | £3.8M |\n| AI-026 churn prevention (14 clients flagged, 9 retained through intervention) | CRM revenue retention data | £2.47M |\n| **Total verified savings at Month 3** | | **£10.0M** |\n\nThe £10.0M threshold is the condition for the **£1.5M milestone fee release**. All four savings items have been verified against source data and signed off by the CDO. The CFO has approved the fee release.\n\nMonth 3 C/I ratio: **69.2%** — a 1.8-point improvement from the 71.0% baseline in 90 days. The annualised trajectory: if the Wipro renegotiation, Bloomberg reduction (in negotiation), and AI production savings compound through the year, the C/I ratio reaches 66-67% by month 12.\n\nThe 58% target remains a 3-year outcome. But we are 1.8 points down in 3 months — ahead of the Base scenario which projected a 1.0-point improvement in 90 days.",
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
                "AI deployment log — tracking every AI initiative from 'approved' to 'in production' with milestone dates and blockers resolved. Month 1 status: AI-023 and AI-026 are the two priority deployments. Both were in the Digital Innovation Lab as validated prototypes. Both were stalled by the governance gap (F002) and the MLOps pipeline gap (F001). Both of those gaps are now closed: CDO in seat Day 12, AI/ML Maestro completed MLOps extension Day 28. The deployment log tracks these as the first completions of a 14-initiative roadmap.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "AI-023 deployment — document the full timeline from lab to production.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "AI-023 (Portfolio Risk Signal Model) — full timeline:\n\n**Lab phase (complete — 14 months ago):** Model validated in Digital Innovation Lab by McKinsey team. Validated accuracy: 87% on backtested 12-month signal data. Recommended for production. Recommendation not acted on (CDO vacancy, no governance owner).\n\n**Stall phase (14 months):** Initiative parked. AI/ML Platform squad identified two blockers: (1) MLOps pipeline needs feature store extension for real-time market data ingestion; (2) production deployment requires CDO sign-off above committee threshold. Neither blocker was resolved.\n\n**Unblock phase (Days 1-28):**\n- Day 12: CDO in seat. AI-023 added to Wave 1 priority list.\n- Day 21: CDO sign-off on production deployment (first unilateral sub-£2M decision under new governance framework — the scope addition was £340K for the feature store extension).\n- Day 28: AI/ML Maestro completes feature store extension. Pipeline validated against AI-023 model requirements.\n\n**Production deployment (Day 34):** AI-023 deployed. Running in shadow mode (parallel to existing risk process). Shadow mode end: Day 64.\n\n**Value measurement (Day 34 onward):** One attributed avoided trade adjustment Month 2 (£2.1M). 90-day window closes Day 124 — full verified value measurement at that date.\n\n**Key lesson from AI-023:** The model was ready 14 months ago. The two blockers — MLOps extension (£340K) and CDO governance (one hire) — prevented £3.8M in Month 1-3 attributed value from accruing. The cost of the 14-month stall: approximately **£18M in foregone value** (14 months × £15.4M annualised).",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the current status of the remaining 12 AI initiatives in the pipeline?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "AI initiative pipeline status — Month 3:\n\n**In production (2):**\n- AI-023: Portfolio Risk Signal Model — in production Day 34, shadow mode ends Day 64\n- AI-026: Client Churn Prediction — in production Day 47, 9 clients retained in Month 3\n\n**Production-ready, deploying Wave 2 (3):**\n- AI-031: Fixed Income Pricing Anomaly Detection — MLOps pipeline compatible, CDO approval Day 78, staging deployment planned Day 95\n- AI-019: Trade Execution Optimiser — infrastructure ready, CDO approval pending (Day 80 meeting)\n- AI-012: Regulatory Reporting Automation — integration testing complete, compliance sign-off received Day 71\n\n**In development, Wave 3 (5):**\n- AI-007: Client Portfolio Personalisation — model design complete, training data pipeline being built by Client Data Platform\n- AI-014: ESG Data Integration — vendor data source identified, pipeline design in progress\n- AI-018: Liquidity Stress Testing — model specification complete, development begins Day 95\n- AI-022: Credit Risk Early Warning — external data licensing agreed, development Q2\n- AI-029: Operational Cost Predictor — specification in progress\n\n**Parked pending CDO review (4):**\n- AI-002, AI-005, AI-009, AI-033 — CDO reviewing against strategic fit before resourcing decision\n\nThe trajectory: 7 initiatives in production by Day 180 (Wave 1 target) is on track.",
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
                "Knowledge compound tracking measures whether the Maestro model is working as designed — not just producing outputs, but building internal capability that persists after Maestro exit. Month 1 baseline scores for the two squads with active Maestros:\n\n**AI/ML Platform:** Self-sufficiency score 38/100 at engagement start. Month 1: 41/100 (+3). The AI/ML Maestro has completed the architectural documentation for the feature store and the model registry. The +3 reflects documentation produced; the squad has not yet been tested on independent operation of the extended pipeline.\n\n**OMS Core:** Self-sufficiency score 31/100 at engagement start. Delivery Maestro onboards Day 90 — no Month 1 movement on OMS Core score.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Month 3 knowledge scores — are the squads actually building capability, not just receiving documentation?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Month 3 knowledge scores — with the distinction you're asking for:\n\n**AI/ML Platform: 52/100 (+14 from baseline 38)**\nThe jump from 38 to 52 in 90 days is above the Genome benchmark for MLOps knowledge transfer (typical 90-day improvement: +8 to +11). The AI/ML Maestro ran three structured knowledge transfer sessions — not training sessions, working sessions where the squad engineers drove the feature store extension with the Maestro as a resource rather than a doer. The independent operation test: on Day 71, the Maestro was unavailable for 48 hours (scheduled leave). The squad successfully deployed the AI-026 data pipeline extension independently. That is a real capability signal, not a documentation signal.\n\n**OMS Core: 37/100 (+6 from baseline 31)**\nThe Delivery Maestro has been on-site for 3 weeks. The first KT sessions covered the reconciliation engine — the highest-risk undocumented system. Four engineers participated; all four can now describe the reconciliation logic and walk the failure modes. Three of the 13 undocumented systems have initial runbooks. The +6 is documentation-phase movement; the independent operation test for OMS Core is scheduled for Month 5.\n\n**Portfolio Analytics: 86/100 (+2 from baseline 84)**\nNo Maestro assigned. The +2 reflects the squad's own documentation work — they updated their runbooks after observing the Delivery Maestro's methodology and deciding to apply it to their own systems. That is the compounding effect working as designed: the best squad in the organisation getting better because the knowledge standard is rising across the organisation.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "By the end of Phase 4, what should the organisation look like — and how will we know the Maestro model worked?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "By the end of Phase 4 (Month 12), the organisation looks like this — and this is how we will know the model worked:\n\n**The test: can Arcturus do the next AI initiative without a Maestro?**\nIf the answer is yes, the model worked. If the answer is 'yes, but we'd prefer a Maestro for comfort,' it worked. If the answer is 'no, we need a Maestro,' it didn't.\n\n**Expected end-state by Month 12:**\n- AI/ML Platform: 68/100 (up from 38, target was 65) — can own and extend the MLOps pipeline independently\n- OMS Core: 67/100 (up from 31, target was 65) — can own all 13 production systems without Wipro as a dependency\n- Client Data Platform: 76/100 (up from 67, target was 78) — can own all Bloomberg data models independently\n- Portfolio Analytics: 88/100 — benchmark performer, maintained and improving\n- Digital Innovation Lab: 52/100 (up from 22) — restructured as a production pathway lab, not a prototype archive\n\n**The compound effect that proves the model:**\nWhen AI-031 and AI-019 deploy in Wave 2 (Days 90-150), they deploy without McKinsey involvement, without a Maestro in the deployment path, using the MLOps pipeline that the AI/ML Platform squad now owns. If that happens — and the current trajectory says it will — then Arcturus's 14-month AI production drought is over, and the internal capability that replaced the vendor dependency is real, measured, and compounding.",
            },
          ],
        },
      ],
      output: {
        output_type: 'outcome_report',
        title: 'Arcturus Financial Group — 90-Day Outcome Report',
        content: {
          engagement: 'Arcturus Financial Group × Delivery',
          period: 'Months 1-3',
          report_date: '2025-04-15',
          fee_released_m: 1.5,
          verified_savings_m: 10.0,
          months_tracked: 3,
          ci_ratio: {
            baseline: 71,
            current: 69.2,
            target: 58,
          },
          verified_savings_breakdown: [
            { source: 'McKinsey exit (90-day pro-rata)', type: 'consulting', amount_m: 2.95, verification: 'Contract termination signed Day 44' },
            { source: 'Wipro renegotiation (46-day pro-rata)', type: 'consulting', amount_m: 0.78, verification: 'Contract amendment signed Day 74' },
            { source: 'AI-023 avoided trade losses', type: 'ai_production', amount_m: 3.8, verification: 'CDO-verified attribution, 56-day partial window' },
            { source: 'AI-026 churn prevention (9 clients retained)', type: 'ai_production', amount_m: 2.47, verification: 'CRM revenue retention data' },
          ],
          ai_production: {
            in_production: 2,
            initiatives: [
              { id: 'AI-023', name: 'Portfolio Risk Signal Model', go_live_day: 34, value_m: 3.8 },
              { id: 'AI-026', name: 'Client Churn Prediction', go_live_day: 47, value_m: 2.47 },
            ],
          },
          squad_knowledge_scores: [
            { squad: 'Portfolio Analytics', baseline: 84, current: 86 },
            { squad: 'AI/ML Platform', baseline: 38, current: 52 },
            { squad: 'OMS Core', baseline: 31, current: 37 },
            { squad: 'Client Data Platform', baseline: 67, current: 69 },
            { squad: 'Digital Innovation Lab', baseline: 22, current: 28 },
          ],
          vendor_status: [
            { vendor: 'McKinsey', verdict: 'EXIT', status: 'complete', saving_m: 12, annualised: true },
            { vendor: 'Wipro', verdict: 'RENEGOTIATE', status: 'complete', saving_m: 6.2, annualised: true },
            { vendor: 'Bloomberg LP', verdict: 'EXIT', status: 'in_negotiation', saving_m: null, target_m: 6.3 },
            { vendor: 'AWS ProServe', verdict: 'RETAIN', status: 'complete', saving_m: 0 },
          ],
          month_3_cdos_assessment:
            'Engagement is tracking ahead of Base scenario. CDO hired Day 12 (vs target Day 60-75). Two AI initiatives in production by Day 47 (vs target Day 60). Wipro renegotiation complete Day 74 (vs target Day 90). The 90-day outcome report confirms the Genome patterns identified in Phase 1 were accurate and the interventions designed in Phase 2 are resolving them. Continuing to Phase 4 Month 4+ tracking.',
        },
        status: 'published',
      },
    },
  ],
}
