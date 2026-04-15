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

export const ARCTURUS_MARGIN_DEMO: DemoEngagement = {
  engagement_name:
    'Arcturus Financial Group × Margin Optimization — Completed Demo',
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
                'C/I ratio **71% vs 58% target** is an **£840M gap**. But the gap must be split structural vs addressable. Structural (compensation, premises, regulatory) = **£620M** — not reduceable without a strategy change. Addressable: **£220M** across IT overspend, consulting, AI portfolio, and Bloomberg AIM. That £220M is where this programme operates.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "The CFO thinks the IT cost is structural. How do we make the case it isn't?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three data points. (1) Bloomberg AIM maintenance **£8.4M vs £2.1M peer median** — this is not a technology premium, it\'s a negotiation failure. (2) Consulting spend **£42M at 24% KT** — firms that exit consulting dependency to Maestros recover **£16–28M**. (3) IT headcount has grown **34% in 3 years** while IT output (as measured by story points and AI initiatives in production) is **flat**. These aren\'t structural — they\'re governance failures masquerading as fixed costs.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "What's the total addressable margin recovery with high confidence?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'High confidence (>65% Genome interval): **£72–96M**. Medium confidence: additional **£40–60M**. Conservative total: **£72M**. Base case: **£112M**. Optimistic: **£156M**. The range widens because the AI portfolio recovery depends on execution — if CDO is appointed and governance works, the AI value is in the upper range. If governance fails again (F002), the AI contribution is near zero.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'F002 confirmed. That\'s the priority.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Correct. **F002 is the meta-risk.** All other interventions depend on governance working. The CDO appointment is not an HR decision — it\'s the single action that unlocks or blocks **£94M in AI value**, controls the consulting reduction programme, and owns the IT rationalisation. Without it, no other intervention compounds. The recommendation is: name the CDO before Day 1, not as a prerequisite to Phase 1 — but as the first action in the execution programme.',
            },
          ],
        },
        {
          name: 'Revenue Side Analysis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Revenue per AUM declining — performance fees from **£82M to £48M** while AUM grew. This isn\'t just a cost problem. Two drivers: (1) market conditions hitting performance (partly structural), (2) fee yield by strategy is unanalysed — some strategies may be underpriced.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'Is the fee compression all market, or is there a pricing problem?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Can\'t confirm without strategy-level revenue data (not uploaded). But Genome from **47 similar asset managers** shows: **60%** of fee compression at this profile is market-driven (structural), **40%** is pricing and mix (addressable). For a £840B AUM manager, that 40% is typically **£12–18M/yr**. The fee yield analysis is the next unlock — requires revenue by strategy upload.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "We'll upload that. What else on the revenue side?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Client retention risk. AUM data shows **2 institutional clients** representing **£84B AUM** have reduced allocations 18 months running. The pattern matches F010: no measurement framework means the relationship team doesn\'t have early warning signals. A client health dashboard — built from existing CRM data — would flag this earlier. No additional data upload required; can be built from ARC-M01.',
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
                '**£94M committed, 28 initiatives, £0 verified ROI.** The CDO vacancy (11 months) means no governance council, which means no initiative baseline, which means ROI cannot be calculated. This is F010 at **79% failure rate**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Which of the 28 should we kill immediately?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '5 candidates for immediate termination: (1) AI-007 (internal comms routing, **£2.1M**, never had executive sponsor), (2) AI-011 (regulatory reporting automation, **£4.8M**, 3 failed handoffs to engineering), (3) AI-014 (sentiment analytics, **£1.6M**, use case disputed by trading desk), (4) AI-019 (counterparty risk model, **£5.2M**, data dependencies unresolved 2 years), (5) AI-022 (ESG scoring, **£3.9M**, vendor-built with no internal ownership). Total: **£17.6M freed** for reallocation.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "That's a lot. Can we stop 5 without political fallout?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'The framing matters. These aren\'t failures — they\'re strategic decisions to concentrate capital where probability of delivery is highest. Each of the 5 has a documented reason: no sponsor, data dependency unresolved, or vendor-built with no KT plan. Present to the board as portfolio reorientation, not programme failure. Genome data shows that firms that kill **4–6 stalled initiatives** in the first 90 days are **3× more likely** to have AI in production by month 12.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Which 3 are closest to production?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three candidates for acceleration: AI-023 (Investment Research, AWS Bedrock access configured, external data source — no golden record needed, **45 days to production**), AI-026 (Earnings Call Analysis, same infrastructure, **30 days**), AI-031 (Counterparty Exposure Dashboard, Charles River data pipe already built, **60 days**). Total additional investment needed: **£1.4M**. Expected ROI by month 6 (fee savings + analyst capacity): **£8–12M**.',
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
                '**8 board-level commitments 2023–2024.** Building the contradiction map: committed vs what data shows. Most striking: "AI leadership by 2025" committed in March 2023. Current state: **0 of 28** AI initiatives in production, CDO vacant 11 months, **£0 verified ROI**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The board doesn't know the state of the AI portfolio.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Correct — and this is the diagnostic. The strategic commitment documents describe an AI-forward organisation. The data shows the opposite. The gap isn\'t intent — it\'s measurement. No one has been able to show the board what **£94M** has produced because there\'s no measurement framework (F010). The contradiction map becomes the CEO\'s conversation with the board: here is what we said, here is what the data shows, here is what needs to change.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What other contradictions?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Second: "Cost efficiency programme targeting **58% C/I by 2027**." Current trajectory: no named programme owner, no progress. C/I ratio trend is flat at **71% for 3 years**. Third: "Technology-led transformation" — IT budget grew **34%** while technology delivery output is flat. The contradictions aren\'t failures of intention. They\'re failures of measurement and governance. The Phase 2 prescription addresses all three.',
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
            'Arcturus Financial Group has an £840M efficiency gap versus the 58% C/I target committed to the board in 2023. The gap has three addressable components: £220M in IT and consulting structural overspend, £94M in AI spend with zero verified return, and an unquantified but material revenue side compression from declining fee yield. Genome patterns F002, F010, and F012 are confirmed. All three are governance failures, not market conditions. The CDO vacancy — 11 months — is the common root cause blocking recovery across all three components.',
          ci_ratio: { current: 71, target: 58, gap_bps: 1300, gap_value_m: 840 },
          addressable_margin: {
            high_confidence_m: 96,
            base_case_m: 112,
            optimistic_m: 156,
            note: 'Base case assumes CDO appointment within 30 days and governance council operational within 60 days.',
          },
          top_interventions: [
            {
              intervention: 'CDO appointment (enables all others)',
              value_unlocked_m: 94,
              timeline: '30 days',
              confidence: 'prerequisite',
            },
            {
              intervention: 'AI portfolio rationalisation — kill 5, accelerate 3',
              value_unlocked_m: 28,
              timeline: '90 days',
              confidence: 0.79,
            },
            {
              intervention: 'Consulting reduction (Maestro programme)',
              value_unlocked_m: 22,
              timeline: '12 months',
              confidence: 0.72,
            },
            {
              intervention:
                'IT structural overspend — Bloomberg AIM renegotiation + SQL DW migration',
              value_unlocked_m: 18,
              timeline: '6 months',
              confidence: 0.81,
            },
            {
              intervention: 'Fee yield analysis (requires data upload)',
              value_unlocked_m: 14,
              timeline: 'data dependent',
              confidence: 'pending',
            },
          ],
          genome_summary:
            'F002 (no exec sponsor, 84% failure rate) is confirmed and is the meta-risk across all interventions. F010 (measurement vacuum, 79%) explains why £94M has produced £0 verifiable ROI. F012 (structural cost misattribution, 68%) explains why IT overspend has been treated as strategic investment for 3 years.',
          ai_portfolio: {
            total_initiatives: 28,
            committed_spend_m: 94,
            verified_roi_m: 0,
            kill_candidates: 5,
            kill_freed_m: 17.6,
            accelerate_candidates: 3,
            accelerate_days_to_production: [45, 30, 60],
          },
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
                'Genome sequencing. The CDO appointment comes first — not because it is most valuable but because without it, every other intervention is at risk of repeating F002. Second: AI portfolio reorientation — kill 5, free **£17.6M**, accelerate 3. Third: consulting reduction via Maestro programme. Fourth: Bloomberg AIM renegotiation. This is Genome sequencing, not intuition.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "The CFO wants to start with Bloomberg AIM — it's the most visible IT cost.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Understood. The risk of starting there is F002: Bloomberg AIM renegotiation requires a named executive who can hold the relationship long-term. Without CDO, the renegotiation risks repeating the pattern — a short-term negotiation win that deteriorates without governance. The recommendation stands: CDO first, Bloomberg AIM second. But if the CFO insists, we can begin Bloomberg scoping in parallel provided a named interim owner is assigned. Who would that be?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "VP Technology — James Houghton. He's been here 8 years.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'That works as an interim. James Houghton as interim programme owner for Bloomberg AIM allows us to begin the renegotiation in parallel with the CDO search. I\'ll note this in the governance model — the risk is that if the CDO hire is delayed beyond **90 days**, the Bloomberg renegotiation may stall without an accountable owner who has P&L visibility. Logging James as interim owner now.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Good. Walk me through the full intervention sequence.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**Week 1–4:** CDO search accelerated (interim: James Houghton), AI portfolio review begins, kill list presented to board. **Weeks 5–8:** 5 initiatives killed, capital reallocated, AI-026 (Earnings Call Analysis) in production as first proof point. **Weeks 9–16:** Bloomberg AIM renegotiation, Maestro programme scoped, AI-023 in production. **Weeks 17–52:** Consulting Maestro programme executing, CDO onboarded, measurement framework live. **Month 12:** full verified margin recovery audited.',
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
                'Building **3 scenarios**. Conservative assumes CDO appointment at day 60, Bloomberg renegotiation takes 6 months, 3 of 5 killed initiatives have political friction. Base: CDO at day 30, Bloomberg at 4 months, all 5 kill decisions accepted. Optimistic: CDO day 15, Bloomberg at 3 months, fee yield analysis unlocks additional **£14M**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What does the CFO see for year 1 cash impact?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Year 1 cash impact. Conservative: **£42M** (AI portfolio savings immediate + Bloomberg renegotiation partial + first Maestro contracts). Base: **£68M**. Optimistic: **£84M**. These are verified savings — cash that doesn\'t leave the firm. Not estimated; not projected. Fee on verified only.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "The CFO needs to see this by category, not just total.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'By category — **Base case year 1:** AI portfolio rationalisation **£22M** (stopped spend + 3 initiatives in production generating measurable analyst productivity), Bloomberg AIM renegotiation **£6.3M**, consulting Maestro programme Phase 1 savings **£18M**, IT structural overspend **£12M** (SQL DW migration + contract renegotiations), revenue uplift from fee yield analysis **£8M** (requires data upload in Month 1). Total: **£66.3M base case**. Year 2 adds further £30–45M as AI portfolio compounds.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'And what does AbarVa earn at base case?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'AbarVa fee at base case: **17.5% of £66.3M = £11.6M**. Fee only on verified savings, post-verification. Four triggers over 12 months. If verified savings are **£42M** (conservative), fee is **£7.35M**. If optimistic (**£84M**), fee is **£14.7M**. No verified saving → no fee. CFO sees the fee only after the cash lands.',
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
                'Of 28 initiatives, recommendation: **kill 5, accelerate 3, reshape 8, pause 12**. Kill list confirmed (**£17.6M freed**). Accelerate: AI-023, AI-026, AI-031. Reshape: 8 initiatives that need the golden record — viable but require MLOps foundation first.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What happens to the 12 paused?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Paused means: spend frozen (not killed), decision deferred until golden record is available (estimated month 9). CDO will review at month 6 board session. **Four of the 12** will likely be killed at that point — they are experiments with no clear business owner. **Eight** will be reshuffled into the accelerated pipeline with proper baselines and measurement frameworks. The pause prevents waste without destroying optionality.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'How do we communicate this to the teams who have been running these initiatives?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Communications plan. For kills: "Strategic reorientation — capital concentrating where probability of delivery is highest." Each team lead receives a one-page summary of why — data-backed, not performance-based. For pauses: "Phase 2 pipeline — your initiative has a clear path to production once the foundation is in place. CDO review at month 6." This framing is honest, traceable, and protects relationships. The Genome shows firms that use transparent data-backed communication for kills retain **85% of affected team members** vs **52%** for firms that don\'t explain.',
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Phase 2 Output — Solution Design',
        status: 'approved',
        content: {
          intervention_sequence: [
            {
              priority: 1,
              intervention: 'CDO appointment',
              owner: 'CEO',
              deadline_days: 30,
              value_unlocked_m: 94,
              prerequisite_for: [
                'AI portfolio',
                'Maestro programme',
                'measurement framework',
              ],
            },
            {
              priority: 2,
              intervention: 'AI portfolio reorientation',
              owner: 'CDO (interim: VP Technology)',
              deadline_days: 60,
              value_m: 22,
            },
            {
              priority: 3,
              intervention: 'Bloomberg AIM renegotiation',
              owner: 'VP Technology (James Houghton)',
              deadline_days: 120,
              value_m: 6.3,
            },
            {
              priority: 4,
              intervention: 'Consulting Maestro programme',
              owner: 'CDO + CIO',
              deadline_days: 90,
              value_m: 18,
            },
            {
              priority: 5,
              intervention: 'IT structural overspend reduction',
              owner: 'VP Technology',
              deadline_days: 180,
              value_m: 12,
            },
          ],
          business_case: {
            conservative: { year1_savings_m: 42, fee_m: 7.35, confidence: 0.68 },
            base: { year1_savings_m: 66.3, fee_m: 11.6, confidence: 0.72 },
            optimistic: { year1_savings_m: 84, fee_m: 14.7, confidence: 0.51 },
          },
          ai_portfolio_decisions: {
            kill: ['AI-007', 'AI-011', 'AI-014', 'AI-019', 'AI-022'],
            accelerate: ['AI-023', 'AI-026', 'AI-031'],
            reshape: 8,
            pause: 12,
            capital_freed_m: 17.6,
          },
          governance_model: {
            cdo_appointment: 'Day 30 deadline — hard prerequisite',
            ai_governance_council:
              'CDO chairs, CFO attends monthly, CRO approves deployments',
            measurement_framework:
              'Every initiative has baseline locked before spend approved',
            board_reporting:
              'Quarterly — verified savings vs baseline, fee trigger status',
          },
        },
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ──────────────────────────────
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
                '**5 baseline metrics to lock.** Starting with C/I ratio: FY2025 P&L shows **71.2%**. Source: ARC-C02. Is this the right number?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Yes — 71.2% is correct. Lock it.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Locked. Metric 2: AI spend with verified ROI. Current: **£94M committed, £0 verified**. Source: ARC-M02. Metric 3: Consulting spend: **£42M**. Metric 4: Bloomberg AIM annual maintenance: **£8.4M**. Metric 5: Performance fee yield: **£48M/yr**. All five locked. Day 0 baseline document generated. CEO signature required.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What happens if the CDO is appointed after Day 1?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Baseline stands regardless of CDO timing. The governance model requires a named interim owner (VP Technology James Houghton) for the AI portfolio from Day 1. CDO appointment extends the programme clock by the delay — so if CDO is hired day 45 instead of day 30, the 12-month fee cycle shifts by **15 days**. Nothing is lost; the programme doesn\'t start without someone accountable. The baseline is locked today regardless.',
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
                '**3 waves.** Wave 1 (days 1–90): governance only. CDO appointed, AI governance council formed, 5 initiatives killed, 3 accelerated. No technology builds. No long-lead procurements. Wave 1 is entirely decisions.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'The CFO was expecting some technology deliveries in Wave 1.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Understandable expectation. The reframe: **AI-026 (Earnings Call Analysis) will be in production by day 45**. That\'s a technology delivery — but it requires no infrastructure build because it uses AWS Bedrock already configured. It\'s the fastest proof point of what the new governance model produces. CFO will see: initiative approved, baseline set, in production in **45 days**. That\'s the contrast with the previous 11-month CDO vacancy and 0 productions.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 2 gates?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Wave 2 (days 91–180) gates: (1) CDO operational and AI governance council holding monthly sessions, (2) First verified saving **≥ £5M** documented and audited, (3) Bloomberg AIM renegotiation term sheet signed, (4) AI-023 in production. All four must be met to proceed to Wave 3 funding. Wave 2 failure condition: if CDO appointment slides past day 60, Wave 2 is restructured with interim governance.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Wave 3?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Wave 3 (days 181–365): compound recovery. Full Maestro programme executing, Bloomberg AIM renegotiation live (first billing cycle reduced), fee yield analysis unlocked (requires data upload by month 5). AI portfolio: **6 initiatives in production** with documented ROI. Full C/I ratio improvement measurable. Year-end board review: verified savings vs **£66.3M base case**.',
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
              metric: 'C/I ratio',
              baseline: '71.2%',
              source: 'ARC-C02 FY2025 P&L',
              target: '64% by month 12',
            },
            {
              metric: 'AI spend with verified ROI',
              baseline: '£0M of £94M',
              source: 'ARC-M02',
              target: '£28M by month 12',
            },
            {
              metric: 'Annual consulting spend',
              baseline: '£42M',
              source: 'ARC-D01',
              target: '£24M by month 12',
            },
            {
              metric: 'Bloomberg AIM maintenance',
              baseline: '£8.4M',
              source: 'ARC-M03',
              target: '£4.2M by month 9',
            },
            {
              metric: 'Performance fee yield',
              baseline: '£48M',
              source: 'ARC-M01',
              target: '£56M by month 12 (requires data upload)',
            },
          ],
          wave_plan: [
            {
              wave: 1,
              days: '1-90',
              theme: 'Governance',
              milestones: [
                'CDO appointed (day 30)',
                'AI governance council formed (day 45)',
                '5 initiatives killed (day 60)',
                'AI-026 in production (day 45)',
                'Bloomberg AIM renegotiation kick-off (day 30)',
              ],
              gate: 'First verified saving ≥ £5M',
            },
            {
              wave: 2,
              days: '91-180',
              theme: 'Recovery',
              milestones: [
                'AI-023 in production',
                'Bloomberg term sheet signed',
                'Maestro programme Phase 1 contracts',
                'Fee yield data uploaded',
                'AI governance council monthly cadence established',
              ],
              gate: 'C/I ratio improvement of ≥ 2 percentage points',
            },
            {
              wave: 3,
              days: '181-365',
              theme: 'Compound',
              milestones: [
                '6 AI initiatives in production',
                'Consulting spend at £28M',
                'C/I ratio at 64%',
                'Year-end board review',
              ],
              gate: 'Annual verified savings vs £66.3M base case',
            },
          ],
          fee_schedule: [
            {
              trigger: 'Month 3 — first verified saving ≥ £5M',
              fee_m: 0.875,
              invoice: 'ARC-M-FEE-001',
            },
            {
              trigger: 'Month 6 — Bloomberg renegotiation verified',
              fee_m: 1.1,
              invoice: 'ARC-M-FEE-002',
            },
            {
              trigger: 'Month 9 — Wave 2 complete',
              fee_m: 3.5,
              invoice: 'ARC-M-FEE-003',
            },
            {
              trigger: 'Month 12 — year-end reconciliation vs baseline',
              fee_m: 6.125,
              invoice: 'ARC-M-FEE-004',
            },
          ],
        },
      },
    },

    // ─── PHASE 4: Execution & Margin Tracking, Month 3 ──────────────────────
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
                'Month 3 margin actuals. C/I ratio: **69.1%** (from **71.2%** baseline). Improvement: **210bps**. Annualised value: £147M × 2.1% = £30.9M, but only the verified portion counts for fee: **£22.4M** (consulting reduction + AI portfolio kills verified by KPMG).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'AI portfolio status?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'AI-026 in production since Day 42. Verified ROI: **£4.1M** (analyst capacity freed — 6 analysts × £340K each + direct research cost reduction). AI-023 in production since Day 58. Verified ROI: **£3.8M** (same methodology). AI-031 delayed — Charles River data pipe issue (expected Month 4). Total verified AI ROI: **£7.9M vs £0 baseline**. F010 pattern broken: measurement framework operational.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Bloomberg AIM renegotiation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Bloomberg term sheet signed Month 2. New annual maintenance: **£5.1M** (from **£8.4M** baseline). First billing cycle at new rate begins Month 4. Annualised saving: **£3.3M**. Verified at Month 4 billing. Bloomberg relationship improved — new account team assigned after CTO escalation in Month 1.',
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
                'Month 3 AI ROI log. AI-026 Earnings Call Analysis: **£4.1M verified** (6 analyst roles redeployed, confirmed by HR and finance). AI-023 Investment Research: **£3.8M verified** (external research cost reduction confirmed by CFO office). Total: **£7.9M**. Baseline was **£0**. CDO Dr. Sarah Chen (appointed Day 28) has signed off all ROI verifications.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CDO appointment was faster than expected.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Correct — **Day 28 vs day 30 plan**. Dr. Sarah Chen previously CDO at Fidelity UK. AI governance council first session was Day 35. 5-initiative kill approved unanimously at Day 48 board sub-committee. The **£17.6M freed** capital has been reallocated: **£4M** to AI-023/026/031 acceleration, **£13.6M** returned to CFO for reallocation. F002 pattern broken.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the Month 4 forecast?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 4 forecast: AI-031 in production (**£2.1M verified ROI** from counterparty monitoring cost reduction). Bloomberg first billing at reduced rate. Total verified savings by Month 4: **£25.2M annualised**. On track for base case of **£66.3M by Month 12**.',
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
                'Month 3 fee trigger review. Trigger 1: first verified saving ≥ £5M. Actual: **£22.4M verified**. Trigger met — exceeded. Fee due: 17.5% × £22.4M = **£3.92M**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "That's a significant fee for Month 3.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'It is. The trigger was set at ≥ £5M, which was conservative. The actual verified saving of **£22.4M** reflects: (1) faster CDO appointment than modelled, (2) Bloomberg renegotiation closing in Month 2 vs Month 4, (3) AI-026 and AI-023 both in production with verified ROI. The fee is proportional to verified delivery. KPMG has audited the **£22.4M**. Invoice ARC-M-FEE-001 issued for **£3.92M**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CFO approved. Next trigger?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 6 trigger: Bloomberg renegotiation first full billing cycle verified + Wave 2 gate (C/I improvement ≥ 2 percentage points). Current trajectory: Bloomberg at **£5.1M annual** (verified Month 4), C/I at **69.1%** (210bps improvement). Both triggers on track. Month 6 fee estimate: **£1.1M additional**. Total to date by Month 6: **£5.02M**. Base case total by Month 12: **£11.6M**.',
            },
          ],
        },
      ],
      output: {
        output_type: 'monthly_margin_report',
        title: 'Phase 4 Output — Monthly Margin Report (Month 3)',
        status: 'published',
        content: {
          month: 3,
          rag_status: 'GREEN',
          ci_ratio: {
            baseline: 71.2,
            current: 69.1,
            improvement_bps: 210,
            target_month12: 64.0,
          },
          verified_savings: {
            total_m: 22.4,
            by_source: [
              {
                source: 'AI portfolio — AI-026 Earnings Call Analysis',
                amount_m: 4.1,
                audited_by: 'KPMG',
              },
              {
                source: 'AI portfolio — AI-023 Investment Research',
                amount_m: 3.8,
                audited_by: 'KPMG',
              },
              {
                source: 'Consulting reduction — Month 1-3 Maestro transition',
                amount_m: 8.2,
                audited_by: 'CFO office',
              },
              {
                source: 'IT structural — contract renegotiations Month 1-2',
                amount_m: 6.3,
                audited_by: 'CFO office',
              },
            ],
          },
          ai_portfolio: {
            in_production: 2,
            verified_roi_m: 7.9,
            initiatives_killed: 5,
            capital_freed_m: 17.6,
            cdo_status: 'Operational — Dr. Sarah Chen, appointed Day 28',
          },
          bloomberg_aim: {
            new_annual_rate_m: 5.1,
            baseline_m: 8.4,
            saving_m: 3.3,
            verified_from: 'Month 4',
          },
          fee_trigger: {
            trigger: 'Month 3 first verified saving ≥ £5M',
            actual_verified_m: 22.4,
            fee_due_m: 3.92,
            invoice: 'ARC-M-FEE-001',
            status: 'INVOICED',
          },
          milestones: [
            {
              milestone: 'CDO appointment',
              status: 'COMPLETE',
              actual_day: 28,
              rag: 'GREEN',
            },
            {
              milestone: 'AI governance council operational',
              status: 'COMPLETE',
              actual_day: 35,
              rag: 'GREEN',
            },
            {
              milestone: '5 AI initiatives killed',
              status: 'COMPLETE',
              actual_day: 48,
              rag: 'GREEN',
            },
            {
              milestone: 'AI-026 in production',
              status: 'COMPLETE',
              actual_day: 42,
              rag: 'GREEN',
            },
            {
              milestone: 'Bloomberg renegotiation term sheet',
              status: 'COMPLETE',
              actual_day: 61,
              rag: 'GREEN',
            },
            {
              milestone: 'AI-031 in production',
              status: 'AT_RISK',
              note: 'Charles River data pipe issue, expected Month 4',
              rag: 'AMBER',
            },
          ],
          board_notes: [
            'Month 3 overall RAG: GREEN. All Wave 1 gates met.',
            'CDO Dr. Sarah Chen appointed Day 28 — 2 days ahead of plan. F002 pattern broken.',
            '£22.4M verified savings in Month 3 — exceeds £5M trigger. KPMG audited. Invoice raised.',
            'AI-026 and AI-023 in production with documented ROI. 11-month drought ended.',
            'Bloomberg AIM renegotiation complete — £3.3M annualised saving from Month 4.',
            'AI-031 AMBER — data pipe issue. Month 4 resolution expected.',
          ],
        },
      },
    },
  ],
}
