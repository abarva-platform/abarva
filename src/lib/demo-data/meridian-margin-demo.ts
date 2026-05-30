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

export const MERIDIAN_MARGIN_DEMO: DemoEngagement = {
  engagement_name:
    'Meridian Health System × Margin Optimization — Completed Demo',
  phases: [
    // ─── PHASE 1: Margin Gap Diagnosis ──────────────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Margin Decomposition',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Operating margin **1.8% vs 4.0% target** — a **$247M gap** at $11.2B revenue scale. Before we go line by line, I need to separate structural from addressable. Structural: labor cost at 63% of revenue (industry median: 61%), facility overhead, interest on the 2022 expansion debt. These do not move without a strategy change. Addressable: **denial write-offs ($94M), Ensemble RCM overperformance gap ($48M contract, SLAs never enforced), MA Star quality bonus at risk ($34M), physician productivity gap, and supply chain inefficiency**. The addressable gap is $180–220M — that is where this programme operates.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'The CFO believes the denial write-offs are the payer mix — mostly MA patients. How do we separate payer mix from operational failure?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three data points that isolate operational failure from payer mix. (1) **Denial rate 18.2% vs 11.4% benchmark for identical MA payer mix** — your peer systems with the same MA concentration are denying at 11.4%. The 6.8 percentage point gap is pure operational failure, not payer mix. (2) **Ensemble SLA: denial rate must be below 14% per contract, or Meridian receives service credits**. That clause has never been invoked — meaning $0 in credits against a vendor that is performing below the contracted threshold. (3) **Top 5 denial codes account for 71% of write-offs** — all preventable with pre-authorization and documentation improvement. This is not a payer mix problem. It is a revenue cycle management problem that Ensemble is contractually obligated to solve.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'If we invoke the Ensemble SLA today, what do we recover?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'From the MER-M01 data: Ensemble has been above the 14% threshold for **11 consecutive months**. Contract allows retroactive credits at $200K per month over threshold. **$2.2M in earned credits** — recoverable immediately. That is the fastest dollar in this programme. But the SLA invocation also resets the dynamic with Ensemble — they begin performing or the contract renegotiation conversation starts from a position of documented breach. Both outcomes benefit Meridian.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the full addressable denial recovery?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Genome analysis from **34 comparable IDN margin engagements**: denial rate reduction from 18.2% to benchmark 11.4% = **$56–68M annual recovery** (conservative to base). High confidence (>70%): **$42M** from the top 5 denial codes alone — prior auth failures, missing documentation, duplicate billing. Medium confidence: additional **$14–26M** from secondary codes and Ensemble process improvement. Total denial programme: **$42–68M** over 18 months. The fee triggers on verified recovery at month-end reconciliation.',
            },
          ],
        },
        {
          name: 'Revenue Leakage Analysis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'MA Star rating **3.5 vs 4.0 target** is a **$34M quality bonus gap**. CMS pays the 4.0-star bonus for the following measurement year — the deadline to improve ratings is the **next HEDIS measurement period, 14 months away**. At current trajectory (3.5 stable, not improving), Meridian will miss the $34M bonus again. The improvement gap is concentrated in 3 measures: breast cancer screening (67% vs 80% required), diabetes HbA1c control (71% vs 83%), and medication adherence (74% vs 82%). All three are gap-closable in 14 months.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CMO says these are patient compliance issues, not operational.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'That framing costs $34M per year. **Genome from 18 MA Star improvement programmes** shows: for Meridian\'s patient population profile, **68% of the gap is operational** — outreach not sent, appointments not scheduled, recalls not followed up. Only 32% is genuine patient non-compliance. Breast cancer screening: **Epic MyChart recall functionality is licensed but not activated** for preventive care scheduling. Turning it on costs $0 and recovers 8–11 percentage points on the measure. Diabetes HbA1c: **23% of Meridian\'s diabetic patients have no HbA1c test recorded in the last 12 months** — not because they refused, but because no one scheduled it. These are workflow failures, not patient failures.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Physician productivity — the wRVU gap. What drives it?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'MER-M04 shows **11.2 wRVU/hr vs 14.1 peer benchmark** — a **21% productivity gap**. At Meridian\'s physician count and compensation structure, that gap costs **$38M/year** in unbilled or under-billed services. Three drivers: (1) **Documentation time**: physicians spend an average 2.1 hours per day on Epic documentation vs 1.2 hours at high-performing systems — **F008 at 78%** (Epic underutilization). Ambient AI documentation tools (already piloted at 2 units) recovered 0.7 hours/physician/day in the pilot. (2) **Prior auth burden**: 34 minutes per prior auth request, compared to 8 minutes at systems with automated prior auth. (3) **Scheduling inefficiency**: 18% no-show rate vs 9% benchmark — Meridian is not running automated reminder protocols in Epic.',
            },
          ],
        },
        {
          name: 'AI Spend vs ROI',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'MER-M03: **$22M committed to 11 AI health initiatives. Verified ROI: $0.** Zero in production. The 11 initiatives are in pilot or stalled. The pattern matches **F002 at 81%** — CDO vacant for 14 months, no accountable owner for AI delivery. The AI spend is not a technology problem; it is a governance problem. The CDO vacancy is costing Meridian the $22M plus the AI-enabled margin improvements that would follow if any initiative reached production.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Of the 11 initiatives, which ones could realistically be in production in 90 days?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Two are ready to deploy without additional infrastructure. **AI-04: Prior Auth Automation** — Epic module already 23% deployed, top 3 payer rules configured. Finishing this deployment requires a scope decision (all payers simultaneously vs top 3 first) and 60 days of engineering time. **AI-07: Ambient Documentation** — piloted successfully at 2 units, physicians are trained, Epic integration is complete. The only blocker is the rollout decision. Neither requires new infrastructure. Both require a CDO to make the call. If a CDO is appointed in 30 days, both can be in production by Day 90.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What is the AI documentation ROI for the P&L?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Pilot data: **0.7 hours recovered per physician per day** at the 2 piloted units. Meridian has 847 employed physicians. If the rollout recovers the same 0.7 hours system-wide: **593 physician-hours recovered per day**. At Meridian\'s average wRVU rate, those hours generate **$8.4M/year in additional wRVU capacity** — if converted to patient volume. Conservative assumption (50% conversion): **$4.2M/year**. Plus the qualitative benefit: physician burnout reduction is the #1 driver of physician departure, and each physician departure costs $500–900K to replace. This is a retention programme as much as a revenue programme.',
            },
          ],
        },
        {
          name: 'Contradiction Map',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The Meridian board was told in the FY2025 strategic plan: **"Denial management performance is within industry norms and Ensemble Health Partners contract performance is satisfactory."** The data shows denial rate **18.2% vs 11.4% industry norm** and **$2.2M in unpaid SLA credits**. That is not within norms. I want to walk through this carefully because the contradiction tells us something important about where the margin problem is being hidden.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'That board statement — who prepared it?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The strategic plan credits the CFO and COO. The COO quote from the MER strategic plan: *"Our revenue cycle is performing within expected parameters given our payer mix."* This is the payer mix attribution error we identified in the Margin Decomposition workstream — but now it has board-level authority. The risk: if the board believes denial management is within norms, they will not support the investment in Ensemble renegotiation or the prior auth AI programme. The Situation Brief needs to re-present the benchmarking data in a form the board can accept without the CFO or COO losing face. I can draft the language.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Draft it. We need the board to approve the Ensemble renegotiation.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Suggested board framing: *"Since the FY2025 strategic plan, a detailed benchmark analysis against comparable IDNs with identical payer mix has identified a 6.8 percentage point gap in denial rate performance — an industry analysis not previously commissioned. This gap represents $42–68M of recoverable margin. Ensemble Health Partners, our RCM partner, has contractual SLA obligations covering this performance gap, and the Margin Optimization programme will formalise SLA enforcement and negotiate enhanced performance incentives going forward."* This reframes it as new analysis (not prior error), activates the Ensemble SLA without attributing blame, and gives the board a recovery number. Does this framing work for your CFO?',
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
            'Meridian\'s 1.8% operating margin vs 4.0% target is a $247M gap. The majority is addressable: $94M in denial write-offs at an 18.2% rate that Ensemble Health Partners is contractually obligated to reduce below 14%, $34M in MA Star quality bonuses missed at 3.5 stars, and $38M in physician productivity unbilled. CDO vacancy (14 months) has blocked $22M in committed AI spend from reaching production. This is a governance and revenue cycle problem, not a structural cost problem.',
          margin_gap_analysis: {
            total_gap_m: 247,
            structural_m: 67,
            addressable_m: 180,
            addressable_breakdown: [
              { lever: 'Denial write-off recovery', amount_m: 94, confidence: 'high', timeline_months: 18 },
              { lever: 'MA Star quality bonus (3.5 → 4.0)', amount_m: 34, confidence: 'high', timeline_months: 14 },
              { lever: 'Physician productivity gap', amount_m: 38, confidence: 'medium', timeline_months: 12 },
              { lever: 'Ensemble SLA credits (retroactive)', amount_m: 2.2, confidence: 'confirmed', timeline_months: 1 },
              { lever: 'AI initiative ROI (CDO-gated)', amount_m: 22, confidence: 'medium', timeline_months: 18 },
            ],
          },
          key_findings: [
            {
              finding: 'Denial rate 18.2% vs 11.4% benchmark',
              root_cause: 'Ensemble SLA underperformance — not payer mix',
              recoverable_m: 56,
              genome_pattern: 'F010',
            },
            {
              finding: 'MA Star 3.5 — $34M bonus missed',
              root_cause: 'Epic recall functionality not activated; outreach workflow gaps',
              recoverable_m: 34,
              genome_pattern: 'F008',
            },
            {
              finding: 'CDO vacant 14 months — $22M AI spend with $0 ROI',
              root_cause: 'F002 governance failure — no accountable AI delivery owner',
              recoverable_m: 22,
              genome_pattern: 'F002',
            },
            {
              finding: '$2.2M Ensemble SLA credits unclaimed',
              root_cause: 'SLA clause never invoked despite 11 consecutive months of breach',
              recoverable_m: 2.2,
              genome_pattern: 'F012',
            },
          ],
          contradiction_flags: [
            'FY2025 board presentation stated denial management "within industry norms" — benchmark data shows 6.8pp gap',
            'Ensemble contract SLA of <14% denial rate never enforced despite 11 months above threshold',
          ],
          immediate_actions: [
            'Invoke Ensemble SLA credits immediately — $2.2M recoverable in 30 days',
            'Appoint CDO or interim CDO within 30 days to unblock AI-04 and AI-07',
            'Commission MA Star gap-close programme: Epic recall activation + outreach workflow',
            'Prior auth AI (AI-04): complete top-3 payer deployment in 60 days',
          ],
        },
      },
    },

    // ─── PHASE 2: Margin Intervention Design ────────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'Intervention Sequencing',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Genome data from 34 comparable IDN margin engagements tells us the correct sequence. The highest-confidence first intervention is not Ensemble renegotiation — it is the **CDO appointment**. It costs nothing to hire. It unblocks AI-04 (prior auth automation) and AI-07 (ambient documentation). Without a CDO, AI-04 stalls again the moment it hits a scope decision, exactly as it did for 18 months. The CDO appointment is the meta-intervention that enables all others.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The board has been trying to hire a CDO for 14 months. What is different now?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three things are different. (1) **Scope is now defined**: the CDO role was previously undefined in terms of what they would own. The Situation Brief now gives them a specific programme: AI-04, AI-07, and the broader AI portfolio rationalisation. That is a CDO job description, not a title search. (2) **The cost of vacancy is quantified**: $22M in committed spend with $0 return, plus the MA Star programme that depends on AI rollout. A CDO candidate can now see the value of the role. (3) **Interim option**: if a permanent hire takes 90 days, appoint an interim CDO — a senior health system executive or a fractional CDO — who makes the scope decisions now. The interim appointment costs $80–120K and unblocks the programme immediately.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Ensemble renegotiation — how do we approach this given the SLA leverage?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three-step approach. **Step 1 (Week 1)**: Formally invoke the SLA credits — $2.2M retroactive. This is a legal notification, not a negotiation. It establishes documented breach. **Step 2 (Week 2–4)**: Performance improvement plan — Ensemble commits to reducing denial rate to 14% within 90 days or the contract enters remediation terms. **Step 3 (Month 2–3)**: Renegotiate the contract — performance incentives tied to denial rate reduction below 12% (better than the current SLA threshold), and an AI-assisted denial prevention requirement where Ensemble deploys prior auth automation at their cost. This approach recovers $2.2M immediately and restructures the $48M contract around performance, not just effort.',
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
                'Three scenarios for the full margin programme. **Conservative** (assumes partial Ensemble improvement, 12% denial rate achieved, no MA Star bonus until Year 2, AI initiatives slow): **$68M recovered in 24 months**. **Base** (denial rate to 13%, MA Star 4.0 achieved next cycle, AI-04 and AI-07 in production by Month 3): **$112M recovered in 18 months**. **Optimistic** (denial rate to 11.4% benchmark, MA Star 4.0 + $34M bonus, full AI portfolio rationalised, physician productivity recovered): **$158M recovered in 18 months**. Fee triggers on the base case: 15% of verified savings at quarterly CFO reconciliation.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What does the CFO need to see to approve the programme?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CFO approval requires four things based on the Meridian governance model. (1) **Baseline locked with source**: every metric tied to a specific data file — denial rate to MER-M01, MA Star to CMS public data, physician productivity to MER-M04. (2) **Fee structure clarity**: outcome-based, fee triggers only on verified savings at quarterly reconciliation — no retainer. (3) **Conservative scenario acceptable**: the $68M conservative case still delivers a 3× return on the AbarVa fee. (4) **First milestone in 30 days**: the $2.2M Ensemble SLA credit is the proof point — it shows this is not theoretical. I recommend the CFO meeting opens with the SLA credit as a concrete win before presenting the full programme.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'MA Star programme — what does execution actually cost?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Total cost to close the MA Star gap: **$1.8M across 14 months**. Breakdown: Epic recall functionality activation ($0 — already licensed), outreach coordinator FTEs ×3 ($420K/yr), diabetes management programme enhancement ($380K), breast cancer screening mobile outreach programme ($310K), medication adherence pharmacy partnerships ($420K), HEDIS reporting infrastructure improvement ($270K). Against a $34M bonus: **19:1 ROI**. The medication adherence partnerships are the highest-leverage spend — pharmacy outreach for MA patients recovers HEDIS adherence measures faster than any other intervention in the Genome.',
            },
          ],
        },
        {
          name: 'AI Portfolio Reorientation',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Of the 11 AI initiatives, my analysis: **2 accelerate immediately** (AI-04 prior auth, AI-07 ambient documentation — both near-production), **3 reshape with CDO in place** (AI-02 clinical documentation improvement, AI-09 supply chain prediction, AI-11 readmission risk), **4 pause** pending data infrastructure and CDO programme governance, **2 kill** — AI-05 (revenue forecasting model built on incomplete payer data — data quality issue means it cannot work) and AI-08 (patient scheduling optimization — Epic has native module that was not activated; this is redundant spend of $1.8M). Killing AI-05 and AI-08 frees $3.1M for reallocation to the prior auth programme.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The team that built AI-05 will push back on killing it.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The framing for the team: AI-05 is not being killed because the work is bad — it is being paused because the data it depends on (complete payer remittance data) is not available. The path to AI-05 working runs through data infrastructure improvement, which is in the wave plan. It can be reactivated in 12 months when the data quality issue is resolved. This is a sequencing decision, not a capability judgment. The team keeps the model — they continue to refine it in sandbox while the data foundation is built. That reframe typically reduces pushback significantly.',
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
            'The Meridian Margin Optimization programme has three sequenced interventions: (1) Ensemble RCM renegotiation with SLA enforcement — $42–68M denial recovery over 18 months, (2) MA Star 3.5 → 4.0 gap-close programme — $34M quality bonus by Year 2, (3) AI portfolio activation (AI-04, AI-07) gated on CDO appointment — $8–22M in Year 1 value. Total programme: $84–124M in verified margin recovery, fee-triggering on verified savings only.',
          interventions: [
            {
              name: 'Ensemble RCM Renegotiation',
              type: 'vendor_performance',
              expected_recovery_m: { conservative: 42, base: 56, optimistic: 68 },
              timeline_months: 18,
              first_milestone: 'SLA credit $2.2M — Week 1',
              genome_pattern: 'F010',
              fee_trigger: 'Verified monthly denial rate reduction at payer reconciliation',
            },
            {
              name: 'MA Star Gap-Close Programme',
              type: 'quality_revenue',
              expected_recovery_m: { conservative: 20, base: 34, optimistic: 34 },
              timeline_months: 14,
              first_milestone: 'Epic recall activation — Day 1 ($0 cost)',
              genome_pattern: 'F008',
              fee_trigger: 'CMS star rating confirmation at next measurement cycle',
            },
            {
              name: 'AI Portfolio Activation',
              type: 'technology_governance',
              expected_recovery_m: { conservative: 8, base: 14, optimistic: 22 },
              timeline_months: 12,
              first_milestone: 'CDO appointed — Day 30',
              genome_pattern: 'F002',
              fee_trigger: 'Verified wRVU recovery and prior auth denial reduction',
            },
          ],
          cdo_appointment: {
            urgency: 'CRITICAL — blocks AI-04 and AI-07',
            interim_option: 'Fractional CDO appointment at $80–120K for 6 months',
            permanent_hire_timeline: '90 days',
            unblocks_value_m: 22,
          },
          ai_portfolio_decisions: {
            accelerate: ['AI-04 Prior Auth Automation', 'AI-07 Ambient Documentation'],
            reshape: ['AI-02 Clinical Documentation', 'AI-09 Supply Chain', 'AI-11 Readmission Risk'],
            pause: ['AI-01', 'AI-03', 'AI-06', 'AI-10'],
            kill: ['AI-05 Revenue Forecasting (data quality)', 'AI-08 Scheduling (redundant with Epic native)'],
            capital_freed_m: 3.1,
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
          name: 'Baseline Lock',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Baseline metrics locked with source files. **Operating margin: 1.8%** — source: MER-C01 FY2025 P&L. **Denial rate: 18.2%** — source: MER-M01 Q4 2025 payer data. **MA Star rating: 3.5** — source: CMS public data, 2025 measurement year. **Physician productivity: 11.2 wRVU/hr** — source: MER-M04 FY2025 productivity report. **AI initiatives in production: 0** — source: MER-M03. These are the Day 0 numbers. Every quarterly report measures actual vs these baselines. Fee triggers on verified improvement from these locked baselines.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CFO wants to use a rolling 3-month average for the denial rate, not a point-in-time number.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Rolling 3-month average is better methodology and I recommend it. The Q4 2025 baseline becomes: **Q2–Q4 2025 average denial rate: 18.4%** (slightly higher than the point-in-time Q4 number). This actually strengthens the programme — the baseline is 18.4%, meaning any improvement to, say, 15% over 3 months triggers the fee calculation on 3.4 percentage points of verified improvement. The rolling average also prevents seasonal manipulation. Lock the baseline as 18.4% rolling 3-month average from MER-M01.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The MA Star baseline — CMS changes the measurement methodology every year. How do we handle that?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CMS Star methodology changes are real and can shift a rating 0.5 stars regardless of performance. The fee structure accounts for this: MA Star improvement triggers a fee only if the rating improvement is **attributable to the measures in the gap-close programme** (breast cancer screening, HbA1c, medication adherence). If CMS methodology change reduces the rating despite operational improvement in those measures, the fee does not trigger. If Meridian achieves 4.0 stars and CMS confirms it in the next measurement year, the full $34M recovery is attributed to the programme. This requires quarterly HEDIS measure tracking — which we build into the Phase 4 reporting.',
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
                '**Wave 1 (Days 1–90): Stop the Bleeding.** Three actions that do not require new technology or new hires. (1) Invoke Ensemble SLA — $2.2M credit, denial rate performance plan in place. (2) Epic recall activation — $0 cost, breast cancer screening and HbA1c outreach begins. (3) Kill AI-05 and AI-08 — $3.1M reallocated to Wave 2 prior auth programme. Wave 1 success metric: denial rate below 17% by Day 90. That single number is the proof point for Wave 2 board approval.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 2 — the CDO hire is gating everything. What if it takes 6 months?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Wave 2 is designed to start whether or not the permanent CDO is hired.** The interim CDO (fractional, 6-month engagement) makes the decisions that Wave 2 requires: AI-04 scope decision (top-3 payers first), AI-07 rollout approval, and AI portfolio governance council constitution. If the permanent CDO is hired in Month 2, they step into a running programme. If it takes Month 4, the interim CDO has maintained momentum. The interim appointment is the Wave 2 gate, not the permanent hire. **Wave 2 (Days 30–180)**: AI-04 prior auth live for top 3 payers, AI-07 ambient documentation rollout begins, MA Star outreach coordinators hired and programme live.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 3 — this is where the $34M bonus unlocks.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Wave 3 (Months 9–18): Compound.** HEDIS measures improving, MA Star expected to move to 4.0 at next CMS measurement cycle. Prior auth denial rate at 13% or below. Physician productivity recovering with ambient documentation at scale. AI-02, AI-09, AI-11 reshaped and piloted. **Month 14** is the CMS measurement deadline for the next Star cycle — every action in Wave 1 and Wave 2 feeds into that measurement. The $34M bonus triggers in **Month 18** if CMS confirms 4.0. Conservative case: 3.75 stars (partial bonus, ~$17M). Base case: 4.0 stars ($34M).',
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
            operating_margin_pct: 1.8,
            denial_rate_pct: 18.4,
            ma_star_rating: 3.5,
            physician_productivity_wrvu_hr: 11.2,
            ai_in_production: 0,
            lock_date: 'Q4 2025',
            source_files: ['MER-C01', 'MER-M01', 'MER-M04', 'MER-M03'],
          },
          waves: [
            {
              wave: 1,
              name: 'Stop the Bleeding',
              days: '1–90',
              actions: [
                'Invoke Ensemble SLA — $2.2M credit recovered',
                'Epic recall activation — breast cancer screening + HbA1c outreach',
                'Kill AI-05 and AI-08 — $3.1M reallocated',
                'Interim CDO appointed',
              ],
              success_metric: 'Denial rate below 17% by Day 90',
              fee_trigger: '$2.2M SLA credit (confirmed Week 1)',
            },
            {
              wave: 2,
              name: 'Deploy',
              days: '30–180',
              actions: [
                'AI-04 prior auth live — top 3 payers (United, Aetna, BCBS)',
                'AI-07 ambient documentation rollout — 847 physicians',
                'MA Star outreach programme staffed and live',
                'Ensemble performance improvement plan in effect',
              ],
              success_metric: 'AI-04 in production, denial rate below 15%',
              fee_trigger: 'Quarterly denial rate reconciliation vs 18.4% baseline',
            },
            {
              wave: 3,
              name: 'Compound',
              days: '180–540',
              actions: [
                'Denial rate tracking to 11.4% benchmark',
                'HEDIS measures on trajectory for 4.0 star',
                'AI-02, AI-09, AI-11 reshaped and piloted',
                'Physician productivity at 12.5+ wRVU/hr',
              ],
              success_metric: 'MA Star 4.0 confirmed, $34M quality bonus',
              fee_trigger: 'Annual verified margin improvement vs locked baseline',
            },
          ],
          total_fee_exposure: {
            conservative_m: 10.2,
            base_m: 16.8,
            optimistic_m: 23.7,
            fee_pct: 15,
            note: 'Fee on verified savings only — $0 earned if metrics do not move',
          },
        },
      },
    },

    // ─── PHASE 4: Execution & Margin Tracking ───────────────────────────────
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
                '**Month 3 margin actuals.** Denial rate: **16.1%** — down from 18.4% baseline. That is 2.3 percentage point improvement. At Meridian\'s claim volume, that translates to **$12.8M in annualized recovered margin**. Ahead of the Wave 1 target (below 17%). Ensemble is performing — the SLA invocation changed the dynamic. MA Star outreach: breast cancer screening measure at **74%** (up from 67%, target 80%). HbA1c at **76%** (up from 71%, target 83%). Both moving. Still 14 months to measurement deadline — on trajectory.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CFO wants to know: is the denial rate improvement sustainable or a one-month anomaly?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three data points that confirm it is structural. (1) **Ensemble has deployed a dedicated denial prevention team** since the SLA invocation — 12 FTEs on Meridian\'s account vs 4 previously. That team does not go away because it is now part of the revised contract. (2) **AI-04 is live for United and Aetna** (BCBS goes live Day 90) — prior authorization approval rate improved from 68% to 84% on United claims. AI-determined prior auth does not regress. (3) **Top 5 denial codes are each down**: duplicate billing -34%, prior auth missing -41%, documentation incomplete -28%. The improvement is distributed across codes, not a single month statistical fluctuation.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'When does fee trigger for Month 3?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 3 verified savings: **$12.8M annualized** × 15% fee = **$1.92M fee earned**. Trigger protocol: CFO reviews the MER-M01 Month 3 payer reconciliation report (already in your inbox), confirms the 16.1% denial rate vs 18.4% baseline, and approves the fee calculation. The $1.92M is the first fee earned on this engagement. Plus the **$2.2M SLA credit** already received in Week 1 — that was a direct recovery, not a fee trigger. Month 3 total programme value delivered: **$15.0M** ($12.8M annualized margin improvement + $2.2M SLA credit).',
            },
          ],
        },
        {
          name: 'AI ROI Tracker',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**AI-04 (Prior Auth Automation)** — live for United and Aetna since Day 58. Month 3 metrics: prior auth approval rate **84%** (vs 68% baseline), prior auth processing time **8 minutes** (vs 34 minutes baseline). Physician time saved: **26 minutes per prior auth request**. At Meridian\'s prior auth volume (2,400/month), that is **1,040 physician-hours recovered per month**. Converting to wRVU capacity: **$580K/month in additional billing opportunity**. AI-04 Month 3 ROI: **$1.74M annualized** (at 50% conversion of recovered capacity).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'AI-07 — the ambient documentation rollout. Where are we?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**AI-07 (Ambient Documentation)** — deployed to 214 of 847 physicians (25% rollout, Wave 2 pace). Month 3 data from the deployed cohort: **0.71 hours recovered per physician per day** — matching the pilot exactly. Physician satisfaction NPS: **+47** (vs -12 for the non-deployed cohort). At full 847-physician deployment (Month 6 target): **$4.2M/year in wRVU capacity** (conservative 50% conversion). CDO has formally approved the Wave 2 rollout acceleration — 450 physicians by Month 4, full rollout by Month 6.',
            },
          ],
        },
        {
          name: 'Fee Calculation',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Month 3 verified savings summary.** Denial rate improvement: 18.4% → 16.1% = **$12.8M annualized recovery**. AI-04 prior auth efficiency: **$1.74M annualized**. AI-07 ambient documentation (partial rollout): **$1.05M annualized**. **Total Month 3 verified annualized savings: $15.6M**. Fee at 15%: **$2.34M earned this quarter**. MA Star programme: not yet triggerable (CMS measurement cycle continues — running at target trajectory). Ensemble SLA credits: $2.2M received (direct recovery, no fee). **Cumulative programme value delivered: $17.8M in 90 days.**',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Q4 projection — what does the full-year look like?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Year 1 projection at current trajectory.** Denial rate: 13.5% by Month 12 (base case, en route to 11.4% benchmark). Margin recovery from denial programme alone: **$26M Year 1** (partial-year, improving trajectory). AI-04 at full payer coverage: **$5.2M Year 1**. AI-07 at 80% physician deployment: **$3.4M Year 1**. MA Star: monitoring — bonus triggers if 4.0 confirmed Month 14. **Year 1 total verified margin recovery: $34–39M**. Year 2 (with MA Star bonus): **$68–82M cumulative**. Base case Year 2 total: **$79M** — consistent with the Situation Brief base scenario.',
            },
          ],
        },
      ],
      output: {
        output_type: 'outcome_report',
        title: 'Phase 4 Output — Month 3 Margin Report',
        status: 'published',
        content: {
          reporting_period: 'Month 3 (Day 61–90)',
          executive_summary:
            'Month 3 denial rate at 16.1% — 2.3 percentage points below the 18.4% baseline and ahead of the Wave 1 target. AI-04 live for two payers, AI-07 at 25% physician rollout. Total verified annualized savings: $15.6M. MA Star outreach programme on trajectory for 4.0 measurement. $2.2M SLA credit received in Week 1. Programme is tracking base case.',
          metrics: {
            denial_rate: { baseline: 18.4, current: 16.1, target_year1: 13.5, unit: '%' },
            ma_star: { baseline: 3.5, current: '3.5 (tracking)', target: 4.0, unit: 'stars' },
            physician_productivity_wrvu_hr: { baseline: 11.2, current: 11.6, target: 13.5, unit: 'wRVU/hr' },
            ai_in_production: { baseline: 0, current: 2, target_year1: 5, unit: 'initiatives' },
          },
          verified_savings: {
            denial_recovery_annualized_m: 12.8,
            ai_04_annualized_m: 1.74,
            ai_07_annualized_m: 1.05,
            sla_credits_direct_m: 2.2,
            total_annualized_m: 15.59,
            fee_earned_m: 2.34,
          },
          next_milestones: [
            { milestone: 'AI-04 BCBS payer live', date: 'Day 90', value_m: 0.8 },
            { milestone: 'AI-07 450 physician rollout', date: 'Month 4', value_m: 2.1 },
            { milestone: 'Denial rate below 15%', date: 'Month 6', value_m: 7.2 },
            { milestone: 'HEDIS measurement snapshot', date: 'Month 14', value_m: 34.0 },
          ],
        },
      },
    },
  ],
}
