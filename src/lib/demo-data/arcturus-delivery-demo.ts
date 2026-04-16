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

export const ARCTURUS_DELIVERY_DEMO: DemoEngagement = {
  engagement_name: 'Arcturus Financial Group × AI-Powered Delivery',
  phases: [
    // ─── PHASE 1: Consulting Audit & Diagnosis ───────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Consulting Audit',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Opening with the anchor finding from ARC-D01. **Wipro is your largest vendor at $18M/yr** — and also your highest-risk. Genome analysis gives them a **KT score of 15/100**, which places them in the bottom 3% of asset management vendors in our dataset. Against a contracted delivery velocity of 100%, they are delivering **58%** — meaning you are paying for work that is either not happening or happening in ways that don't transfer knowledge back to the internal team. At the current trajectory, every 12 months Wipro is on contract, the cost of extracting and rebuilding that knowledge grows by an estimated **$2.1M**. The dependency isn't a performance problem; it's a structural ownership problem.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the actual cost of Wipro's knowledge risk?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Quantifying it precisely. If Wipro's contract ended today without a structured KT programme, the rebuild cost is **$6–9M** over an **18-month** recovery timeline. That range accounts for: (1) Domain knowledge reconstruction across FSC Platform, OMS Core, and Settlement Engine — estimated **$3.2M** in internal engineering time and specialist contractor hours. (2) Lost velocity during transition — **$1.8–3.5M** in deferred delivery capacity. (3) Incident risk premium during the gap — FSC Platform had **3 P1 incidents in the last 6 months**, all resolved by Wipro engineers with no internal shadow. A fourth P1 during transition would add an unbudgeted $500K–$1.2M. The **15% KT score** means only 15% of the procedural knowledge needed to operate Wipro-owned systems is currently documented or held internally. That is the exposure number.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "And Google PSO — they've already ended but no handover happened?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Confirmed. Google PSO's engagement closed **4 months ago** — contract ended, no formal handover executed. The MLOps architecture they designed is the foundation for **26 active AI initiatives** on the roadmap, including three that are classified as strategic priority for FY26. The architecture documentation lives across Google-internal tooling, a shared Drive folder with incomplete coverage, and — critically — in the heads of **two ex-PSO engineers** who are no longer under any obligation to Arcturus. We've cross-referenced the internal project tracker against known documentation: **64% of the architectural decision records are undocumented** from Arcturus's perspective. Recommend an immediate KT audit: identify the two ex-PSO engineers, engage them under a short-term consulting arrangement before they move further, and begin reconstruction. The window to do this cost-effectively closes within **60–90 days**.",
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
                "Bloomberg AIM is the engagement that keeps me up at night. Arcturus has **14 custom AIM integrations** — position limits, pre-trade compliance rules, AIM-to-OMS routing logic — all built by Bloomberg's professional services team. Every one of those customisations is **entirely vendor-owned**: the configuration logic, the decision trees behind the rules, and the rationale for each threshold. Bloomberg holds the keys. Your internal team can operate the screens but cannot explain, replicate, or migrate any of the underlying logic. **KT score on Bloomberg AIM knowledge: 8/100** — the lowest of any vendor we've assessed in the asset management sector this year.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "What happens if Bloomberg withdraws support or we want to switch vendors?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Full replacement would take **18–24 months** and cost **$8–12M** — and that estimate assumes a clean handover, which Bloomberg has no contractual obligation to provide. The harder problem is regulatory: three of the 14 customisations map directly to FCA compliance rules. If Bloomberg withdraws support and those rules break, Arcturus has a live regulatory exposure, not just an operational one. The recommendation is not rip-and-replace. The **API wrapper approach** creates an internal governance layer around AIM — a translation layer that Arcturus owns, which abstracts the Bloomberg-specific logic into documented, testable rules. This doesn't require leaving Bloomberg; it creates sovereignty over the logic regardless of what Bloomberg does. The alternative — waiting until a contract dispute forces the issue — is a risk that pricing models don't capture.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "That's catastrophic. What's the recommended action?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three immediate actions, all executable within **90 days**. First: embed one senior internal engineer in the Bloomberg engagement team now — not as an observer, as a shadow decision-maker. They attend every Bloomberg PS session, every configuration change. This is the fastest knowledge transfer mechanism available given the current contract structure. Second: document all **14 customisation decision trees** — what each rule does, why each threshold was set, and what the FCA mapping is. This can be done in parallel by a Delivery Maestro working from Bloomberg's change logs and internal trading desk interviews. Third: begin the AIM runbook series — operational procedures for each integration written for an internal engineer with no Bloomberg context. **Timeline: 90 days to reduce Bloomberg AIM risk from CRITICAL to HIGH**. It won't be solved in 90 days, but it will be managed.",
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
                "Amid the risk picture, there is a genuine bright spot: the **Portfolio Analytics squad**. Zero percent vendor dependency. Internal team owns the codebase, the architecture, and the domain knowledge. Their KT score is **91/100** — the highest in the organisation. They ship at **94% of contracted velocity** with no external support. Portfolio Analytics is the proof point that Arcturus can build and own internal capability. The question isn't whether this is possible; it's why it hasn't been replicated across the other 13 squads.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "Why can't other squads operate like Portfolio Analytics?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The answer is founding ownership, not team capability. **Portfolio Analytics was built bottom-up with internal hires** — the first engineer on the team was an Arcturus employee, the architecture was designed internally, and vendor support was additive rather than foundational. **OMS Core was the opposite**: outsourced from inception. Wipro wrote the original codebase, designed the data model, and set the domain conventions. Internal engineers joined an existing Wipro-owned system; they learned Wipro's way of working rather than establishing their own. The IP and the mental model are both external. This isn't an indictment of the OMS Core team — it's a structural constraint that no amount of internal effort can overcome without a deliberate transition programme. The diff is ownership at founding, not ability.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "So what's the realistic internal capability after 12 months with Maestros?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "With a Delivery Maestro embedded and the structured KT programme running, the 12-month projections are: **OMS Core reaches 60% internal capability** — the Wipro KT programme transfers domain knowledge systematically, and internal engineers take over lead positions on all FSC tasks. **Client Data Platform reaches 75%** — lower starting risk means faster recovery. **Bloomberg AIM dependency reduces from CRITICAL to MANAGEABLE** — the API wrapper creates internal governance even if Bloomberg remains the execution layer. Most importantly, the **internal/external ratio moves from 53%/47% to 70%/30%** — not through headcount cuts, but through knowledge transfer that makes the internal team capable of leading where they currently follow. These numbers are drawn from **47 comparable asset management engagements** in the Genome dataset. The range at 80% confidence is 68%/32% to 73%/27%.",
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Situation Brief — Arcturus Financial Group',
        status: 'approved',
        content: {
          executive_summary:
            'Arcturus Financial Group is carrying $42M in annual consulting spend against a knowledge transfer posture that has created three critical dependency risks: Wipro ($18M/yr, KT score 15/100), Google PSO (engagement closed without handover, 26 AI initiatives blocked), and Bloomberg AIM (14 custom integrations entirely vendor-owned, KT score 8/100). The 47% contractor/consulting ratio is above sector norms and concentrated in high-risk domains. Genome pattern analysis confirms F001, F002, and F008 across the portfolio. Recovery range is $16–28M annually through structured exit, renegotiation, and internal capability transfer. Recommended: 6 Maestros replacing 40 consultants.',
          total_consulting_spend: 42000000,
          vendor_breakdown: [
            {
              name: 'Wipro',
              spend: 18000000,
              kt_score: 15,
              contracted_velocity_delivered: 58,
              verdict: 'EXIT — structured 6-month programme',
              domains: ['FSC Platform', 'OMS Core', 'Settlement Engine'],
            },
            {
              name: 'Google PSO',
              spend: 6000000,
              kt_score: 12,
              contracted_velocity_delivered: 0,
              verdict:
                'EXIT — already completed, knowledge recovery programme required',
              domains: ['MLOps Architecture', 'AI Platform Design'],
            },
            {
              name: 'Bloomberg LP',
              spend: 5000000,
              kt_score: 8,
              contracted_velocity_delivered: 85,
              verdict: 'RETAIN WITH GOVERNANCE — API wrapper programme',
              domains: ['AIM Customisations', 'Pre-Trade Compliance'],
            },
            {
              name: 'Accenture',
              spend: 4000000,
              kt_score: 62,
              contracted_velocity_delivered: 81,
              verdict: 'RETAIN — acceptable KT posture',
              domains: ['Infrastructure'],
            },
            {
              name: 'ThoughtWorks',
              spend: 3500000,
              kt_score: 71,
              contracted_velocity_delivered: 88,
              verdict: 'RETAIN — strong KT posture',
              domains: ['Agile Coaching', 'Engineering Practice'],
            },
            {
              name: 'CapGemini',
              spend: 3000000,
              kt_score: 58,
              contracted_velocity_delivered: 76,
              verdict: 'RETAIN WITH IMPROVEMENT CONDITION — KT score must reach 70',
              domains: ['Data Engineering'],
            },
            {
              name: 'Deloitte',
              spend: 2500000,
              kt_score: 88,
              contracted_velocity_delivered: 92,
              verdict: 'RETAIN — governance advisory, no KT risk',
              domains: ['Governance Audit'],
            },
            {
              name: 'McKinsey',
              spend: 2000000,
              kt_score: 79,
              contracted_velocity_delivered: 90,
              verdict: 'RETAIN — strategy advisory only, no KT risk',
              domains: ['Strategy Advisory'],
            },
            {
              name: 'Contractor EA',
              spend: 1500000,
              kt_score: 11,
              contracted_velocity_delivered: 70,
              verdict: 'EXIT — critical governance risk, architecture undocumented',
              domains: ['Enterprise Architecture'],
            },
            {
              name: 'Other / Miscellaneous',
              spend: 2500000,
              kt_score: 55,
              contracted_velocity_delivered: 74,
              verdict: 'MONITOR — review at Wave 2',
              domains: ['Various'],
            },
          ],
          knowledge_risk_domains: [
            {
              domain: 'Bloomberg AIM Customisations',
              risk_level: 'CRITICAL',
              kt_score: 8,
              description:
                '14 custom integrations entirely vendor-owned. FCA compliance dependency on 3 integrations. No internal documentation.',
              financial_exposure: '$8–12M replacement cost',
            },
            {
              domain: 'Google MLOps Architecture',
              risk_level: 'CRITICAL',
              kt_score: 12,
              description:
                'PSO engagement closed without handover. 26 AI initiatives blocked. Architecture in ex-PSO engineer heads.',
              financial_exposure: '$4–6M to reconstruct; $15M+ in blocked AI initiative value',
            },
            {
              domain: 'Enterprise Architecture (Contractor EA)',
              risk_level: 'CRITICAL',
              kt_score: 11,
              description:
                'Single contractor holds all architectural decision records. No succession plan. No documentation.',
              financial_exposure: '$2–3M to reconstruct; governance exposure',
            },
          ],
          capability_gap_assessment:
            'Portfolio Analytics (KT 91/100) demonstrates that internal capability is achievable at Arcturus. The gap is structural, not cultural — squads founded on outsourced codebases (OMS Core, FSC Platform) have inherited vendor dependency that cannot be self-corrected without structured transition. Internal/external ratio at 53/47 against a sector benchmark of 72/28 for comparable asset managers.',
          recommended_action:
            'Deploy 6 Maestros in 3 waves over 12 months. Wave 1: Delivery Maestro (Data & AI) + Knowledge Risk Maestro, targeting Wipro KT programme and Google PSO knowledge recovery. Projected annual recovery: $16–28M. Fee: 15–20% of verified savings, post-verification only.',
          genome_validation:
            'F001 confirmed: consulting spend concentration risk (Wipro = 43% of total spend). F002 confirmed: KT score below 20 in largest vendor. F008 confirmed: post-engagement knowledge gap (Google PSO). F009 confirmed: vendor-owned IP in regulated compliance domain (Bloomberg AIM).',
        },
      },
    },

    // ─── PHASE 2: Maestro Design & Prescription ──────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'Maestro Team Design',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Proposing **6 Maestros** across 3 waves. I'll start with the highest-leverage placement: **Delivery Maestro: Data & AI**. This role directly replaces the functional gap left by Google PSO's exit and the data platform components of Wipro's engagement. The individual we have in mind has 12 years in MLOps architecture at HSBC Global Markets and Deutsche Bank, with specific Bloomberg AIM integration experience. They are not a generalist — they know the exact problem domain. Against Google PSO at **$6M/yr** and the relevant Wipro components at approximately **$4M/yr**, this single Maestro placement addresses **$10M of the $18M critical-vendor spend**. Wave 1 cost for this role: $320K/yr all-in.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Walk me through all 6 roles',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "All 6 Maestros with replacement rationale. **(1) Delivery Maestro: Data & AI** — $320K/yr, replaces Google PSO + Wipro data platform ($10M/yr). Wave 1. **(2) Knowledge Risk Maestro** — $280K/yr, owns Bloomberg AIM governance programme and Contractor EA documentation. Wave 1. **(3) Delivery Maestro: FSC Platform** — $300K/yr, replaces Wipro FSC Platform team; takes over as internal lead. Wave 2. **(4) Delivery Maestro: OMS Core** — $295K/yr, replaces Wipro OMS Core; manages structured parallel-running programme. Wave 2. **(5) Architecture Maestro** — $340K/yr, replaces Contractor EA; owns enterprise architecture documentation and decision records going forward. Wave 2. **(6) Vendor Intelligence Maestro** — $260K/yr, manages ongoing vendor performance, KT score monitoring, and renegotiation execution. Wave 3. **Total Maestro cost: $1.795M/yr** versus **$42M consulting spend**. The metric is not headcount reduction — it is verified recovery delivered per pound of Maestro cost.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the hiring timeline?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Wave 1 Maestros — the Delivery Maestro: Data & AI and the Knowledge Risk Maestro — can be **placed within 45 days** of contract execution. These are not new hires. AbarVa's Maestro network is a curated pool of **specific individuals** who have already been vetted, referenced, and matched to client profiles. The Delivery Maestro: Data & AI candidate was identified during Phase 1 — they are available and the match against Arcturus's domain is confirmed. The Knowledge Risk Maestro has prior Bloomberg AIM experience from a tier-1 hedge fund engagement. Wave 2 Maestros (days 60–90) follow the same pattern. Wave 3 placement at day 91+ is paced to the verified savings timeline so the fee structure aligns. **No recruitment process. No agency fees. No onboarding from scratch.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "The CIO will push back on org change. How do we handle that?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "The CIO's concern is legitimate and the framing matters. Maestros are not a restructuring play — they are an **intelligence layer**, not a replacement layer. Structurally: the 6 Maestros report to a new **CDO role** (we recommend filling this within 60 days — the CDO is the Maestro programme's internal sponsor and the board's accountability line). The CIO's team is not reduced; it is trained. Every Maestro's primary deliverable is a **knowledge transfer to an internal counterpart** — the Maestro owns the domain until the internal engineer can lead, then steps back to advisory. The CIO's team ends the programme stronger, not smaller. The CIO's incentive is a cleaner org with less vendor dependency — which is exactly what they want but couldn't achieve without the transition structure. We present this as the CIO's programme, not AbarVa's.",
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
                "Running the 10 vendors through the verdict framework. **Three categories: Exit, Retain, Retain with Condition.** Exits: **Google PSO** (already completed — now a knowledge recovery programme, not a vendor exit). **Contractor EA** (critical governance risk — single-point-of-failure in enterprise architecture, KT score 11/100, no succession, not operating under a formal SoW structure that allows managed exit). Both exits are non-negotiable from a governance standpoint. The Contractor EA situation is the one that should have been caught at contract inception — we recommend immediate documentation programme regardless of exit timeline.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the Wipro exit plan?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**6-month structured exit** in 3 phases. **Months 1–2 (KT Programme Mandatory):** Every domain documented. Every decision tree mapped. Wipro engineers required to produce handover documentation as a contract deliverable — we invoke the existing IP clause in the SoW which requires source documentation on request. Internal engineers assigned as shadows on every FSC Platform task; Wipro cannot close a ticket without an internal engineer co-present. **Months 3–4 (Parallel Running):** Internal engineers shadow-to-lead transition. Every Wipro action requires internal engineer sign-off before execution. Contract spend reduces by 30% at month 3 as advisory-only scope is priced. **Months 5–6 (Wipro Advisory Only):** Internal team leads all FSC, OMS, Settlement tasks. Wipro available for 40 hrs/month advisory. Contract reduces to advisory rate. Month 6: contract close or renegotiated to specialist advisory only. **Net saving from exit: $12–14M/yr** depending on residual advisory arrangement.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What leverage do we have in Wipro renegotiation?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three levers — and they compound. **(1) Break clause:** The Wipro contract has a **3-month break clause** with no penalty beyond the notice period. Wipro knows this. The moment we open renegotiation talks, the break clause creates a credible exit threat that resets the negotiating position entirely. **(2) Delivery performance:** Genome data documents **58% of contracted velocity delivered** against a 100% contracted standard. This meets the definition of material underperformance under the contract's remediation clause — Wipro is in breach of their delivery obligation. We can invoke remediation before break clause, which either forces improvement or justifies the exit on their account rather than ours. **(3) Competitive signalling:** The five retain vendors — Accenture, ThoughtWorks, CapGemini, Deloitte, McKinsey — are all watching the Wipro situation. A structured Wipro exit with visible performance documentation signals to every retain vendor that Arcturus is now managing vendors against outcomes. Recommend engaging Wipro with the audit findings first. Let the data speak before invoking the break clause.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What about the 5 retains?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Retain verdicts with renegotiation targets. **Accenture ($4M):** Infrastructure delivery, KT score 62% — acceptable but improvable. Retain; renegotiate 10% reduction on advisory components. **McKinsey ($2M):** Strategy advisory only, no executable dependency, no KT risk. Retain unchanged — this is appropriate use of external advisory. **ThoughtWorks ($3.5M):** Agile coaching, KT score 71%, strong practice transfer model. Retain; they are already doing what Maestros do for their domain. **CapGemini ($3M):** Data engineering, KT score 58% — below threshold. Retain on **improvement condition**: KT score must reach 70 within 90 days or contract moves to exit track. **Deloitte ($2.5M):** Governance audit, KT score 88%, no operational dependency. Retain unchanged. **Total retain spend: $15M.** Renegotiation target: **$15M → $12.75M** (15% reduction). Combined with Wipro exit and Contractor EA exit, total vendor portfolio reduces from $42M to an optimised **$14.5M** at steady state.",
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
                "The recovery range is **$16–28M annually**, with a base case of **$22M**. This is not a projection — it is drawn from **47 engagements with comparable Genome patterns** (F001, F002, F008, F009) in asset management and financial services. Those 47 engagements produced a median recovery of $22.3M against a median consulting spend of $39M. The Arcturus base case is deliberately conservative relative to that median because of two factors: Wipro's transition complexity is above average (58% delivered velocity is worse than the median in our dataset), and Bloomberg AIM's KT score of 8/100 is an outlier that will take longer to address than a typical vendor.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Walk me through the three scenarios',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Three scenarios, all verified against Genome F001 baseline from 47 engagements. **Conservative ($16M):** Wipro 6-month exit completes, Google PSO knowledge 70% recovered, 3 of 5 renegotiations hit target (Accenture, CapGemini, one other). Internal/external ratio reaches 62/38. Bloomberg AIM risk reduces but programme not complete. This scenario assumes Wipro KT programme takes the full 6 months and one renegotiation fails. **Base Case ($22M):** All of the above plus Contractor EA exit completed cleanly, all 5 renegotiations hit 15% reduction target, Google PSO knowledge 90% recovered. Internal/external ratio reaches 68/32. Bloomberg AIM programme running, risk at HIGH. **Optimistic ($28M):** All of the above plus internal capability reaches 70/30, Bloomberg AIM risk reduced to LOW via API wrapper completion, full Maestro team embedded and operating independently. This requires no major transition stalls and the CDO appointment within 60 days. **All three scenarios verified against Genome F001. All three produce positive ROI on Maestro fees.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the confidence interval on base case?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**68% confidence on $22M base case**, based on 47 engagements in the Genome dataset with matching pattern profiles. The 80% confidence interval is **$19–25M** — meaning 8 out of 10 similar engagements land in that range. The variance is driven primarily by **Wipro transition speed**: if the KT programme takes 9 months instead of 6 (most common delay cause: internal engineering resource availability for shadowing), the base case drops to approximately **$18M** as month 7–9 savings are deferred. Secondary variance driver: Bloomberg AIM programme — if Bloomberg LP delays documentation access beyond the contractual obligation, the knowledge risk programme extends and the risk-adjusted savings from that domain reduce in year 1. The $22M figure is the mean of the distribution, not the ceiling. We present the $19–25M range to the CFO as the planning range.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'And the fee at base case?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**17.5% of $22M = $3.85M total fee** at base case. The structure is outcome-triggered: AbarVa receives no fee until a verified saving is confirmed by the client's auditor. **First trigger at Month 3**: first verified saving of $500K or greater (this will be the Wipro first contract reduction — already visible in month 2 as the parallel-running phase prices down). Month 3 fee: **$87.5K**. This is the only fee paid in the first quarter. Subsequent triggers at months 6, 9, and 12 as verified savings compound. **Total at base case: $3.85M over 12 months.** The CFO sees fee invoices only after the cash from savings has landed. If savings underperform, fees scale down proportionally — the fee is a percentage of verified savings, not a fixed project fee. No verified saving = no fee. This is the structure the CFO should present to the board.",
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Solution Design — Arcturus Financial Group',
        status: 'approved',
        content: {
          maestro_roles: [
            {
              wave: 1,
              title: 'Delivery Maestro: Data & AI',
              annual_cost: 320000,
              replaces: ['Google PSO ($6M/yr)', 'Wipro Data Platform components ($4M/yr)'],
              placement_timeline_days: 45,
              primary_deliverable: 'MLOps architecture recovery and data platform KT programme',
            },
            {
              wave: 1,
              title: 'Knowledge Risk Maestro',
              annual_cost: 280000,
              replaces: ['Contractor EA ($1.5M/yr)', 'Bloomberg AIM governance gap'],
              placement_timeline_days: 45,
              primary_deliverable:
                'Bloomberg AIM KT programme, enterprise architecture documentation, API wrapper design',
            },
            {
              wave: 2,
              title: 'Delivery Maestro: FSC Platform',
              annual_cost: 300000,
              replaces: ['Wipro FSC Platform ($5M/yr component)'],
              placement_timeline_days: 75,
              primary_deliverable: 'FSC Platform internal ownership, Wipro shadow-to-lead transition',
            },
            {
              wave: 2,
              title: 'Delivery Maestro: OMS Core',
              annual_cost: 295000,
              replaces: ['Wipro OMS Core ($5M/yr component)'],
              placement_timeline_days: 80,
              primary_deliverable: 'OMS Core parallel-running programme, Settlement Engine handover',
            },
            {
              wave: 2,
              title: 'Architecture Maestro',
              annual_cost: 340000,
              replaces: ['Contractor EA architecture function ($1.5M/yr)'],
              placement_timeline_days: 85,
              primary_deliverable: 'Enterprise architecture documentation, ADR programme, future-state design',
            },
            {
              wave: 3,
              title: 'Vendor Intelligence Maestro',
              annual_cost: 260000,
              replaces: ['Fragmented vendor management overhead'],
              placement_timeline_days: 120,
              primary_deliverable:
                'Ongoing vendor KT score monitoring, renegotiation execution, Genome pattern tracking',
            },
          ],
          vendor_verdicts: [
            { vendor: 'Wipro', verdict: 'EXIT', timeline: '6-month structured exit', saving: 18000000 },
            {
              vendor: 'Google PSO',
              verdict: 'EXIT (completed)',
              timeline: 'Knowledge recovery programme',
              saving: 6000000,
            },
            {
              vendor: 'Contractor EA',
              verdict: 'EXIT',
              timeline: 'Immediate — documentation programme starts Day 1',
              saving: 1500000,
            },
            {
              vendor: 'Accenture',
              verdict: 'RETAIN',
              timeline: 'Renegotiate 10%',
              saving: 400000,
            },
            {
              vendor: 'ThoughtWorks',
              verdict: 'RETAIN',
              timeline: 'No change',
              saving: 0,
            },
            {
              vendor: 'CapGemini',
              verdict: 'RETAIN WITH CONDITION',
              timeline: 'KT score to 70 within 90 days or exit track',
              saving: 450000,
            },
            {
              vendor: 'Deloitte',
              verdict: 'RETAIN',
              timeline: 'No change',
              saving: 0,
            },
            {
              vendor: 'McKinsey',
              verdict: 'RETAIN',
              timeline: 'No change',
              saving: 0,
            },
            {
              vendor: 'Bloomberg LP',
              verdict: 'RETAIN WITH GOVERNANCE',
              timeline: 'API wrapper programme; Bloomberg relationship maintained',
              saving: 0,
            },
            {
              vendor: 'Other / Miscellaneous',
              verdict: 'MONITOR',
              timeline: 'Review at Wave 2',
              saving: 375000,
            },
          ],
          business_case: {
            scenarios: [
              {
                name: 'Conservative',
                annual_recovery: 16000000,
                conditions:
                  'Wipro exit completes, Google PSO 70% recovered, 3 renegotiations succeed, internal ratio 62/38',
              },
              {
                name: 'Base Case',
                annual_recovery: 22000000,
                conditions:
                  'Full Wipro exit, all renegotiations at 15%, Google PSO 90% recovered, Contractor EA exit, internal ratio 68/32',
              },
              {
                name: 'Optimistic',
                annual_recovery: 28000000,
                conditions:
                  'Full programme delivered, internal ratio 70/30, Bloomberg AIM risk LOW, Maestro team fully embedded',
              },
            ],
            confidence: {
              base_case_confidence: 0.68,
              confidence_interval_80: { low: 19000000, high: 25000000 },
              primary_variance_driver: 'Wipro KT programme transition speed',
            },
            abarva_fee: {
              rate: 0.175,
              base_case_total_fee: 3850000,
              structure: 'Outcome-triggered, post-verification',
            },
          },
        },
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ───────────────────────────────
    {
      phase_number: 3,
      status: 'complete',
      workstreams: [
        {
          name: 'Baseline Agreement',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Locking 5 baseline metrics today — these become the zero-point against which every verified saving is measured, audited, and fee-triggered. Starting with the most important. **Metric 1: Annual consulting spend.** Source document ARC-D01 — statement-of-work invoice compilation, last 12 months. Figure: **$42,000,000**. This includes all 10 vendors on all active SoWs. It excludes Bloomberg subscription fees (Bloomberg terminal costs are product spend, not consulting), FCA filing costs, and internal payroll. Is this the right perimeter?",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "Yes, $42M is correct. It includes all statement-of-work invoices from the last 12 months.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Metric 1 locked: $42,000,000.** Moving to Metric 2: **Average KT Score**. Current weighted average across all 10 vendors: **31/100**. Source: ARC-D02. Methodology: internal engineer self-assessment combined with handover document completeness scoring (0–100 scale). Weighting is proportional to vendor spend — Wipro's 15/100 pulls the average down significantly given its 43% spend share. The 31/100 figure has been reviewed by your internal engineering leads and confirmed as accurate. Bloomberg at 8/100 and Contractor EA at 11/100 are the floor. Portfolio Analytics at 91/100 (internal, not a vendor) is excluded from vendor scoring. Shall I lock at 31?",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Lock at 31.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**All 5 metrics now locked.** Metric 1: Consulting spend **$42,000,000** (source: ARC-D01). Metric 2: Average KT score **31/100** (source: ARC-D02). Metric 3: Internal/external ratio **53/47** (source: ARC-D03, headcount and billing analysis). Metric 4: Vendor dependency ratio **73%** — percentage of delivery tasks where a vendor is the primary executor (source: ARC-D04, task-level delivery log). Metric 5: Knowledge risk score **82/100** — composite of KT scores, vendor concentration, and undocumented critical domains (source: Genome model output). Baseline document generated as ARC-BASELINE-001. This document requires **CEO or CFO signature before Day 1** — the signature locks the measurement framework and initiates the fee eligibility clock. No signature = no Day 1 = no fee exposure for Arcturus.",
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
                "Three waves designed to deliver verified savings progressively while managing transition risk. **Wave 1 (Days 1–90):** Two Maestros embedded — Delivery Maestro: Data & AI and Knowledge Risk Maestro. Wipro KT programme formally initiated with contractual documentation requirements invoked. CDO appointment process begins. Google PSO knowledge reconstruction starts. First baseline re-measurement at day 45. Target: first verified saving identified and documented (not yet audited) by day 90. Wave 1 is deliberately narrow — two Maestros, two parallel workstreams, one organisational change (CDO). Nothing else moves until Wave 1 is stable.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Can Wave 1 really happen in 90 days?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Wave 1 is deliberately contained to make 90 days achievable. **Two Maestros** — already identified, already vetted, available within 45 days. **Wipro KT programme** — the contractual mechanism is already in the SoW; we are invoking an existing clause, not negotiating a new one. **Google PSO reconstruction** — this is internal documentation work, not a vendor negotiation; it starts Day 1 and requires only internal engineering time plus Maestro direction. The single dependency we don't control is the **CDO appointment**. If it slips past day 60, Wave 1 timeline extends by the slip — but the Maestros can begin work under the CIO's line as interim sponsor. Wave 1 does not fail if CDO is delayed; it extends. We flag this risk explicitly in the Wave Plan so it is visible to the board from day one.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What are the Wave 2 gates?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Wave 2 (Days 91–180)** has three gates that must be met before Wave 2 Maestros are placed. **Gate 1: First verified saving documented and audited** — this triggers the first fee payment ($87.5K) and confirms the measurement framework is working. **Gate 2: Wipro KT score improved from 15 to 40** — this is the proof point that the KT programme is functioning. At 40/100, the internal team can operate FSC Platform at 80% autonomy. **Gate 3: Internal capability baseline re-measured** — the 53/47 ratio must show movement (target 56/44 by day 90). If all three gates pass, Wave 2 Maestros — FSC Platform, OMS Core, Architecture — are placed. If Wipro KT programme stalls (Gate 2 fails), Wave 2 is paused and the Wipro break clause is invoked, which accelerates the exit and changes the Wave 2 timeline but not the savings trajectory.",
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
                "**Wave 3 (Days 181–365): Compound recovery.** By month 6, the heavy lifting of Wave 1 and 2 is complete. Wave 3 is about compounding — embedding the full Maestro team and driving the internal/external ratio from 65/35 toward 70/30. Specific deliverables: Google PSO knowledge capture reaches 90%+ and is formally closed. Internal team at 70/30. Knowledge risk score moves from 82/100 to below 50/100 (from CRITICAL to HIGH across all domains). Full annual recovery realised and audited by month 12. **Board reviews at month 6 and month 12** — both reviews use the baseline metrics from ARC-BASELINE-001 to produce a verified, auditable outcome statement. The Vendor Intelligence Maestro is placed in Wave 3 to manage ongoing vendor performance so that recovery is maintained, not just achieved once.",
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
                "Outcome-based fee across **4 triggers**. All triggers are post-verification — AbarVa invoices only after the saving has been confirmed by Arcturus's auditor (KPMG, per your standing audit arrangement). **Trigger 1 (Month 3):** First verified saving of **$500K or greater** = AbarVa fee of **$87.5K** (17.5% of $500K minimum threshold). This trigger is designed to be conservative — $500K is achievable from the first Wipro contract reduction alone. Expected actual saving at Month 3: **$3.8M annualised**, which would proportionally trigger a larger fee — but we cap Month 3 at 17.5% of verified saving not yet fully audited. Full Month 3 fee calculated after audit.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the total fee schedule over 12 months?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Four triggers across 12 months at base case. **Month 3: $87.5K** — first verified saving confirmed, Wipro first contract reduction audited. **Month 6: $500K** — Wipro parallel-running phase complete, full contract reduction confirmed and annualised, Wave 2 Gate 1 passed. **Month 9: $875K** — Wave 2 complete, OMS Core and FSC Platform transitions confirmed, all renegotiations audited. **Month 12: Final reconciliation** — total verified savings against $22M base case, remaining fee balance settled. At base case: total 12-month fee **$3.85M**, paid in four tranches across the year. **All paid post-verification. All auditable against ARC-BASELINE-001.** If total verified savings at month 12 land at $19M (lower confidence interval), total fee is **$3.325M**. If they land at $25M (upper), total fee is **$4.375M**. Fee scales with outcome.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CFO approved. Lock this structure.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Fee structure locked.** Contract document ARC-CONTRACT-001 generated with the following terms: 17.5% of verified annual savings, four payment triggers at months 3, 6, 9, and 12, all post-verification by KPMG. AbarVa fee schedule document attached to baseline agreement ARC-BASELINE-001 as Schedule B. Both documents are now ready for **CEO signature**. Upon signature, Day 1 clock starts: Delivery Maestro: Data & AI and Knowledge Risk Maestro are placed within 45 days, Wipro KT programme initiated within 5 business days of Day 1. Wipro has already been notified of the audit findings; the conversation is ready to escalate to the contract remediation clause at your direction.",
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap_and_baseline',
        title: 'Execution Roadmap & Baseline Agreement — Arcturus Financial Group',
        status: 'approved',
        content: {
          baseline_metrics: [
            {
              metric_id: 'M1',
              name: 'Annual Consulting Spend',
              baseline_value: 42000000,
              unit: 'GBP',
              source: 'ARC-D01',
            },
            {
              metric_id: 'M2',
              name: 'Average KT Score (vendor-weighted)',
              baseline_value: 31,
              unit: 'score out of 100',
              source: 'ARC-D02',
            },
            {
              metric_id: 'M3',
              name: 'Internal/External Delivery Ratio',
              baseline_value: '53/47',
              unit: 'percentage',
              source: 'ARC-D03',
            },
            {
              metric_id: 'M4',
              name: 'Vendor Dependency Ratio',
              baseline_value: 73,
              unit: 'percentage of tasks with vendor as primary executor',
              source: 'ARC-D04',
            },
            {
              metric_id: 'M5',
              name: 'Knowledge Risk Score',
              baseline_value: 82,
              unit: 'score out of 100 (higher = more risk)',
              source: 'Genome model output',
            },
          ],
          wave_plan: [
            {
              wave: 1,
              days: '1–90',
              maestros_placed: ['Delivery Maestro: Data & AI', 'Knowledge Risk Maestro'],
              key_actions: [
                'Wipro KT programme initiated (contractual documentation clause invoked)',
                'Google PSO knowledge reconstruction started',
                'CDO appointment process initiated',
                'Contractor EA documentation programme started',
                'First baseline re-measurement at Day 45',
              ],
              gate_to_wave_2: [
                'First verified saving documented and audited (≥ $500K)',
                'Wipro KT score improved from 15 to 40',
                'Internal/external ratio shows movement to 56/44',
              ],
            },
            {
              wave: 2,
              days: '91–180',
              maestros_placed: [
                'Delivery Maestro: FSC Platform',
                'Delivery Maestro: OMS Core',
                'Architecture Maestro',
              ],
              key_actions: [
                'Wipro parallel-running phase (internal engineers lead, Wipro advisory)',
                'Contractor EA exit completed',
                'Bloomberg AIM KT programme started',
                'CapGemini KT score improvement review',
                'Month 6 board review',
              ],
              gate_to_wave_3: [
                'Wave 2 verified savings audited',
                'Wipro contract reduced to advisory-only',
                'Internal/external ratio at 65/35',
              ],
            },
            {
              wave: 3,
              days: '181–365',
              maestros_placed: ['Vendor Intelligence Maestro'],
              key_actions: [
                'Full Maestro team embedded',
                'Google PSO knowledge capture completed (≥90%)',
                'Bloomberg AIM API wrapper programme',
                'Internal/external ratio drive to 70/30',
                'Month 12 board review and full audit',
              ],
              outcomes: [
                'Full annual recovery realised and audited',
                'Knowledge risk score below 50/100',
                'All Maestros at advisory stage — internal team leads',
              ],
            },
          ],
          fee_schedule: [
            {
              trigger_month: 3,
              trigger_condition: 'First verified saving ≥ $500K, audited by KPMG',
              fee_amount: 87500,
              expected_verified_saving: 3800000,
            },
            {
              trigger_month: 6,
              trigger_condition: 'Wipro contract reduction confirmed, annualised savings audited',
              fee_amount: 500000,
              expected_verified_saving: 10000000,
            },
            {
              trigger_month: 9,
              trigger_condition: 'Wave 2 complete, all renegotiations audited',
              fee_amount: 875000,
              expected_verified_saving: 17000000,
            },
            {
              trigger_month: 12,
              trigger_condition: 'Final reconciliation against total verified recovery at base case',
              fee_amount: 2387500,
              expected_verified_saving: 22000000,
            },
          ],
          total_fee_base_case: 3850000,
          signature_required: 'CEO',
          document_references: ['ARC-BASELINE-001', 'ARC-CONTRACT-001'],
        },
      },
    },

    // ─── PHASE 4: Execution & Outcome Tracking (Month 3 Snapshot) ─────────────
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
                "**Month 3 actuals against ARC-BASELINE-001.** Consulting spend (annualised from month 3 run rate): **$38.2M** — down from $42M baseline, a **$3.8M annualised reduction**. Composition: Wipro first contract reduction (parallel-running pricing applied) = **$2.3M annualised**. Google PSO contract formally closed (was still on a residual retainer from the original engagement) = **$1.5M annualised**. Total Month 3 verified saving: **$3.8M annualised** — **exceeds the Month 3 gate target** of $500K minimum. The Month 3 fee trigger of $87.5K is now eligible for invoicing. KPMG have confirmed the saving calculation against ARC-D01 source invoices.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'KT score movement?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "KT score movements against M2 baseline of **31/100**. **Wipro: 15 → 34** — the KT programme has been running for 10 weeks. 9 of 14 domains now have primary documentation. The score improvement from 15 to 34 represents the first two phases of the programme (core documentation). The next 10 weeks (Months 4–5) target 34 → 55, which is the threshold for internal engineers to lead independently. **Bloomberg AIM: 8 → 8** — no movement yet; the KT programme starts Month 4. Maya Singh's independent mapping work is not yet formalised as a scored KT activity. **Contractor EA: 11 → 41** — faster than expected; the Architecture Maestro reconstructed 60% of the decision records from meeting notes and email archives in 6 weeks. **Weighted average KT score: 38/100** (from 31 baseline). **On track against the plan** — Wave 2 Gate 2 target is 40/100 by day 90.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Internal/external ratio?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**56/44** against 53/47 baseline — a 3-point swing in internal's favour in 10 weeks. The movement is specifically on the **FSC Platform**: two internal engineers — Priya Mehta and James Osei — have been promoted from shadow to lead on daily monitoring and incident response. Wipro still handles complex change requests but is no longer the primary responder on live operations. Trajectory modelling from the current rate: **65/35 by Month 6** is achievable, which exceeds the Wave 2 gate target of 65/35. The OMS Core ratio hasn't moved yet — the Delivery Maestro: OMS Core is placed in Wave 2 (days 91+). **Wave 2 gate on internal/external is on track.** The Month 3 re-measurement across all 5 baseline metrics is complete and submitted to KPMG alongside the verified saving calculation.",
            },
          ],
        },
        {
          name: 'Milestone Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Month 3 milestone status across Wave 1 plan.** **(1) CDO appointment — COMPLETE:** James Park appointed as Chief Data Officer, Day 42. Reporting line confirmed: CDO reports to CEO, Maestro programme sponsored by CDO. First CDO-Maestro strategy session held Day 45. **(2) Wipro KT programme — IN PROGRESS (GREEN):** 9 of 14 domains documented. Week 10 of 24. On track for Gate 2 (KT score 40 by day 90). Wipro is cooperating — the audit findings plus the remediation clause invocation reset the engagement dynamic. **(3) First verified saving — COMPLETE:** $3.8M annualised, confirmed by KPMG against ARC-D01. Exceeds gate minimum. **Month 3 fee trigger eligible: $87.5K.**",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Any milestones at risk?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "One milestone at risk: **Bloomberg AIM KT programme** scheduled to start Month 4. Bloomberg LP has been slow to provide access to their professional services documentation portal — the access request was submitted Day 15 and is still pending. Bloomberg's standard SLA for documentation access is 30 days; we are at day 75 with no access granted. This is likely an internal Bloomberg administrative delay rather than intentional obstruction, but the effect is the same. **Recommended action: Arcturus CTO escalates to Bloomberg LP account director**, invoking the contractual clause that requires Bloomberg to provide configuration documentation on reasonable request (clause 8.3 of the Bloomberg BPAS agreement). Maya Singh's independent mapping work provides a partial mitigation — she has 40% of the 14 customisation trees documented from observation alone. **This is not on the critical path yet** — the Bloomberg programme can start 2–3 weeks late without affecting Wave 2 gates. Flag for board: Bloomberg documentation access delay, mitigation in progress.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Escalation approved. Note for board.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Escalation logged against milestone BL-KT-01. Board report updated with the following entry: *'Bloomberg AIM KT programme — AMBER. Documentation access delayed 45 days beyond SLA. CTO escalation initiated. Contractual clause 8.3 invoked. Maya Singh independent mapping at 40% provides partial mitigation. Programme start deferred by estimated 2–3 weeks. Not on critical path at current date. Monitoring weekly.'* **Month 3 overall RAG status: GREEN.** All three Wave 1 gates are either complete or on track. Bloomberg AMBER is the only flag and is managed. **First fee trigger of $87.5K invoiced to Arcturus Financial Group today.** Invoice reference ARC-FEE-001.",
            },
          ],
        },
        {
          name: 'Knowledge Transfer',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**Month 3 KT activity log.** Highest-impact movement: **FSC Platform**. At baseline, incident response and daily monitoring on FSC Platform was **100% Wipro-executed** — internal team had read-only access and no on-call responsibility. Today: **80% internal execution**, with Priya Mehta and James Osei carrying the on-call rotation and leading all P2 and P3 incidents. Wipro handles P1s in parallel but internal engineers are now co-responding. The FSC Platform runbook has been written — document ARC-KT-03, 47 pages, covering all operational procedures. This runbook didn't exist 10 weeks ago. **FSC Platform is the flagship example of what the KT programme delivers** — this is the content we use in the Month 6 board review to demonstrate the methodology.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What's the Bloomberg situation?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Bloomberg AIM: **no formal capability transfer yet** — the programme hasn't started due to the documentation access delay. KT score remains 8/100. Risk rating: **CRITICAL** (unchanged). However, the independent work by **Maya Singh** is the most significant positive development this month outside of FSC Platform. Maya is embedded in the Bloomberg engagement team as planned — she attends every Bloomberg PS call, every configuration session. She is building a parallel documentation set from observation: decision tree maps, threshold rationale notes, FCA mapping annotations. She has **40% of the 14 customisation trees documented** from direct observation, without Bloomberg's formal support. When the documentation access is granted and the formal KT programme begins, Maya's maps become the foundation rather than the starting point. **Estimated: 40% documented by Month 4 start without any Bloomberg cooperation.** With cooperation, 90% by Month 6.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Good. And the Google PSO gap?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Google PSO knowledge gap: **70% recovered** in 10 weeks. The Delivery Maestro: Data & AI led a 3-week reconstruction sprint — cross-referencing all Google Drive documentation, internal project trackers, and Confluence pages from the PSO engagement period. 18 of the 26 AI initiative architecture documents have been reconstructed to a level where internal engineers can execute against them. The **missing 30% is concentrated in one area**: the data quality pipeline design for **AI-023** (the customer segmentation AI initiative, currently paused). This specific design was never written down — it existed only in the heads of the two PSO engineers. The Delivery Maestro has scheduled a 2-day working session with **one of the ex-PSO engineers**, who is now at ThoughtWorks (one of the retain vendors). That session is booked for Month 4 Week 1. **Target: AI-023 pipeline design reconstructed and documented by Month 4 close.** At that point, Google PSO knowledge recovery will be at 95%+ and the gap formally closed.",
            },
          ],
        },
      ],
      output: {
        output_type: 'monthly_outcome_report',
        title: 'Monthly Outcome Report — Month 3 (Arcturus Financial Group)',
        status: 'published',
        content: {
          reporting_month: 3,
          overall_rag_status: 'GREEN',
          baseline_vs_actuals: [
            {
              metric_id: 'M1',
              name: 'Annual Consulting Spend',
              baseline: 42000000,
              actual: 38200000,
              movement: -3800000,
              unit: 'GBP annualised',
              status: 'AHEAD',
            },
            {
              metric_id: 'M2',
              name: 'Average KT Score',
              baseline: 31,
              actual: 38,
              movement: +7,
              unit: 'score out of 100',
              status: 'ON_TRACK',
            },
            {
              metric_id: 'M3',
              name: 'Internal/External Ratio',
              baseline: '53/47',
              actual: '56/44',
              movement: '+3 points internal',
              unit: 'percentage',
              status: 'ON_TRACK',
            },
            {
              metric_id: 'M4',
              name: 'Vendor Dependency Ratio',
              baseline: 73,
              actual: 68,
              movement: -5,
              unit: 'percentage',
              status: 'ON_TRACK',
            },
            {
              metric_id: 'M5',
              name: 'Knowledge Risk Score',
              baseline: 82,
              actual: 76,
              movement: -6,
              unit: 'score out of 100',
              status: 'ON_TRACK',
            },
          ],
          verified_savings: {
            month_3_annualised: 3800000,
            composition: [
              {
                source: 'Wipro contract reduction (parallel-running pricing)',
                annualised_saving: 2300000,
                audited: true,
              },
              {
                source: 'Google PSO residual retainer closed',
                annualised_saving: 1500000,
                audited: true,
              },
            ],
            auditor: 'KPMG',
            audit_reference: 'ARC-AUDIT-M3-001',
          },
          milestone_status: [
            {
              milestone: 'CDO Appointment',
              status: 'COMPLETE',
              detail: 'James Park appointed Day 42',
              rag: 'GREEN',
            },
            {
              milestone: 'Wipro KT Programme',
              status: 'IN_PROGRESS',
              detail: '9 of 14 domains documented. KT score 15→34. On track for gate.',
              rag: 'GREEN',
            },
            {
              milestone: 'First Verified Saving',
              status: 'COMPLETE',
              detail: '$3.8M annualised, KPMG confirmed',
              rag: 'GREEN',
            },
            {
              milestone: 'Bloomberg AIM KT Programme',
              status: 'AT_RISK',
              detail:
                'Documentation access delayed 45 days beyond SLA. CTO escalation initiated. Maya Singh independent mapping at 40%.',
              rag: 'AMBER',
            },
            {
              milestone: 'Google PSO Knowledge Recovery',
              status: 'IN_PROGRESS',
              detail: '70% recovered. AI-023 working session with ex-PSO engineer booked for Month 4.',
              rag: 'GREEN',
            },
          ],
          fee_triggers: [
            {
              trigger: 'Month 3 first verified saving',
              status: 'INVOICED',
              fee_amount: 87500,
              invoice_reference: 'ARC-FEE-001',
              verified_saving_triggering: 3800000,
            },
          ],
          board_notes: [
            'Month 3 overall RAG: GREEN. All Wave 1 gates met or on track.',
            'Bloomberg AIM KT programme AMBER — CTO escalation approved, mitigation active via Maya Singh independent mapping.',
            'FSC Platform: 80% internal execution achieved (from 0% at baseline). Runbook ARC-KT-03 published.',
            'Google PSO: 70% knowledge recovered. AI-023 remaining gap to be closed Month 4.',
            'Wave 2 Maestro placements to proceed as planned from Day 91.',
            'First AbarVa fee ($87,500) invoiced and payable per contract terms.',
          ],
        },
      },
    },
  ],
}
