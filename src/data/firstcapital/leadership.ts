interface Contradiction {
  publicPosition: string
  actualData: string
}

interface Executive {
  role: string
  name: string
  tenure: string
  background: string
  priorities: string[]
  quotes: string[]
  aiStance: string
  decisionStyle: string
  contradictions: Contradiction[]
}

export const firstCapitalLeadership: { executives: Executive[] } = {
  executives: [
    {
      role: "CEO",
      name: "David Morrison",
      tenure: "11 years",
      background: "Career banker, grew up in commercial banking, joined First Capital as Head of Commercial Banking and rose to CEO in 2015. Deep relationships in mid-Atlantic business community. MBA from Georgetown. Board-level credibility but increasingly facing pressure on digital transformation.",
      priorities: [
        "Position First Capital as the premier regional bank in mid-Atlantic corridor",
        "Drive digital adoption from 41% toward 60% over 2 years",
        "Resolve OCC examination findings without public disclosure",
        "Protect commercial deposit franchise from digital-native competitors",
        "Maintain cost discipline while funding transformation",
      ],
      quotes: [
        "Our digital adoption is growing strongly. Customers are embracing the mobile experience we have built.",
        "We have been thoughtful about our technology investments. We do not chase every shiny object.",
        "First Capital has a 60-year reputation for serving this community. That trust is our competitive moat.",
        "The FedNow conversation is on our roadmap. We will be live within a reasonable timeframe.",
      ],
      aiStance: "Cautiously supportive. Wants AI to reduce costs and improve customer experience but skeptical of large transformation bets. Will approve AI investment if payback period is under 18 months and there is no regulatory risk.",
      decisionStyle: "Consensus-driven. Defers to CRO on compliance matters and CFO on capital allocation. Moves slowly on technology decisions — has deferred core banking replacement twice. Responds to peer bank comparisons and regulator pressure more than vendor pitches.",
      contradictions: [
        {
          publicPosition: "Our digital adoption is growing strongly",
          actualData: "Digital adoption is 41% vs 67% peer median. Declined month-over-month for 3 consecutive months. Account opening abandonment at 64% vs 32% benchmark.",
        },
        {
          publicPosition: "The FedNow timeline is on our roadmap",
          actualData: "No signed vendor contract. FIS HORIZON cannot support FedNow without a middleware layer that has not been budgeted. 68% of peers already live. $340M deposit attrition risk documented by Head of Commercial Banking.",
        },
        {
          publicPosition: "We are thoughtful about technology investment, not chasing trends",
          actualData: "Core banking system is 22 years old — peer median is 14 years. SQL Server 2017 data warehouse hit end-of-support October 2025. IT budget at 9.2% of revenue vs 12% needed for digital leadership.",
        },
      ],
    },
    {
      role: "CIO",
      name: "Patricia Huang",
      tenure: "2 years",
      background: "Former VP of Digital Payments at a top-5 US bank. Deep expertise in real-time payments infrastructure, FedNow certification programs, and API banking architecture. Brought in specifically to modernize payments and digital channels. Frustrated by pace of change.",
      priorities: [
        "Deploy FedNow — her most urgent and blocked priority",
        "Resolve SQL Server 2017 end-of-support crisis",
        "Build API layer over FIS HORIZON to unblock real-time capabilities",
        "Modernize mobile banking experience — raise app store rating above 4.0",
        "Establish a cloud strategy — currently 28% cloud vs 72% on-premise",
      ],
      quotes: [
        "FedNow is not a technology project. It is a survival project. We are losing commercial clients today.",
        "I came here to build a modern bank. FIS HORIZON is a 22-year-old anchor around everything I want to do.",
        "The core banking decision has been deferred twice. We need to make a decision in Q3 or I cannot deliver on any of my commitments.",
        "Every week we are not on FedNow is a week a competitor is pitching our commercial clients.",
      ],
      aiStance: "Strong advocate. Understands AI infrastructure requirements. Wants to build ML platform but cannot prioritize it until core banking and FedNow are resolved. Will champion AI investment post-FedNow go-live.",
      decisionStyle: "Data-driven and impatient. Comes from large-bank culture where decisions move faster. Frustrated with consensus-building pace. Will escalate to CEO when blocked. Most credible voice in the room on payments and digital architecture.",
      contradictions: [
        {
          publicPosition: "Core banking is stable and we have a plan",
          actualData: "FIS HORIZON is 22 years old and running at 87% peak capacity. Extended maintenance premium costs $4.2M above standard support. FIS has not released a major feature since 2018. Replacement has been evaluated twice with no decision.",
        },
        {
          publicPosition: "Our cloud migration is progressing",
          actualData: "Cloud adoption is 28% vs 62% peer median. FIS HORIZON on-premise requirement blocks migration of the most critical systems. Only 2 Azure-certified staff out of 180 IT employees.",
        },
      ],
    },
    {
      role: "CFO",
      name: "Michael Torres",
      tenure: "7 years",
      background: "Career banking CFO. Prior roles at SunTrust and BB&T before merger. CPA, MBA from UVA Darden. Deeply analytical. Controls capital allocation and has effectively blocked two core banking replacement proposals on ROI grounds. Known internally as 'the gatekeeper'.",
      priorities: [
        "Reduce cost-to-income ratio from 68% to 55% — board mandate",
        "Demonstrate AI/technology ROI before approving transformation spend",
        "Protect capital ratios during any technology transition",
        "Right-size vendor contracts — Salesforce waste identified, not yet acted on",
        "Resolve FedNow without committing to full core banking replacement",
      ],
      quotes: [
        "I will fund transformation when I can see a credible path to 62% cost-to-income within 24 months.",
        "Every dollar I spend on AI is a dollar I am not spending on core banking. I need a portfolio view.",
        "Salesforce is costing us $8M for 34% adoption. That is $5.3M in waste. Fix that before asking me for more budget.",
        "Show me the ROI or show me a cheaper path. I have heard the FedNow urgency argument before.",
      ],
      aiStance: "ROI-focused skeptic who becomes a buyer when numbers are clear. Most persuaded by cost reduction and compliance cost avoidance. Will block innovation AI (personalization, customer AI) but will fund operational AI (AML automation, fraud detection) if payback is under 18 months.",
      decisionStyle: "Analytical and conservative. Requires detailed financial models with sensitivity analysis. Will pressure-test assumptions. Responds to peer comparisons when they show cost disadvantage. Will act quickly once convinced — blocked two core banking proposals in under 2 weeks once numbers did not work.",
      contradictions: [
        {
          publicPosition: "We are within 6 months of our cost-to-income target",
          actualData: "Cost-to-income ratio is 68% vs 55% target. Peer median is 58%. The gap has widened in each of the last 2 quarters, not narrowed. At current trajectory, will miss the 24-month board target.",
        },
        {
          publicPosition: "We manage our vendor relationships actively",
          actualData: "Salesforce costs $8M/year with 34% adoption by relationship managers — 6 modules unused. $2.4M in immediate savings available by right-sizing licenses. No action taken in at least 12 months.",
        },
      ],
    },
    {
      role: "Chief Procurement Officer",
      name: "Nadia Rahman",
      tenure: "5 years",
      background: "Financial-services procurement executive with deep experience in core banking, payments, and managed-services sourcing. Owns vendor governance, commercial controls, and enterprise sourcing policy.",
      priorities: [
        "Create a clean intake path for technology sourcing events",
        "Reduce vendor risk across core banking, digital, and compliance platforms",
        "Separate commercial evaluation evidence from finance-restricted values",
        "Improve renewal discipline before FIS, Q2, Salesforce, and NICE decision windows",
      ],
      quotes: [
        "Sourcing cannot just be a contract desk after the technology decision is already made.",
        "If the business outcome, architecture constraints, and regulatory requirements are not clear, the RFP will only manufacture false confidence.",
        "The fastest path is not skipping procurement. The fastest path is making procurement evidence-based.",
      ],
      aiStance: "Pragmatic. Supports AI-assisted sourcing and contract review when data controls, GLBA posture, and award governance are explicit.",
      decisionStyle: "Structured and evidence-led. Lets business and technology own requirements, but insists on auditable decision criteria before vendor shortlisting.",
      contradictions: [
        {
          publicPosition: "First Capital has disciplined vendor governance",
          actualData: "Major technology decisions still route through fragmented executive sponsorship, with FedNow, Q2, Salesforce, and NICE each using different intake and evidence standards.",
        },
      ],
    },
    {
      role: "Director, IT Sourcing",
      name: "Ethan Brooks",
      tenure: "3 years",
      background: "Technology sourcing operator responsible for payments, core banking, CRM, and risk-system sourcing events. Works across CIO, CPO, Legal, Risk, and business sponsors.",
      priorities: [
        "Run consistent Source intake for technology events",
        "Coordinate vendor response completeness checks",
        "Capture award-readiness evidence before approvals",
        "Keep restricted pricing details out of broad evaluator views"
      ],
      quotes: [
        "I need the FedNow business urgency, FIS architecture constraints, and OCC risk posture in the same evaluation packet.",
        "A clean sourcing event should reduce executive churn, not add a procurement tax.",
      ],
      aiStance: "Positive on AI-assisted sourcing if every recommendation cites source evidence and separates commercial sensitivity by role.",
      decisionStyle: "Operational and detail-oriented. Good day-to-day Source admin candidate under the CPO.",
      contradictions: [
        {
          publicPosition: "Technology sourcing events are standardized",
          actualData: "Payments, digital banking, and AML events each use different scoring models and evidence expectations.",
        },
      ],
    },
    {
      role: "Director, Payments Program Management",
      name: "Lena Ortiz",
      tenure: "4 years",
      background: "Program delivery leader for payments modernization, FedNow readiness, and commercial banking technology dependencies.",
      priorities: [
        "Translate FedNow urgency into an executable program roadmap",
        "Coordinate commercial banking, CIO, Risk, and vendor workstreams",
        "Track gate evidence without exposing finance-restricted values",
        "Prepare Tower handoff once execution starts outside AbarVa"
      ],
      quotes: [
        "The business hears '90 days'; technology sees dependencies across FIS, fraud, treasury operations, and client communications.",
        "We need one program record that survives the meeting cycle.",
      ],
      aiStance: "Strong user of AI-assisted program synthesis, especially for meeting notes, dependency tracking, and approval packets.",
      decisionStyle: "Programmatic and pragmatic. Good Programs user candidate who should not need client-admin rights.",
      contradictions: [
        {
          publicPosition: "FedNow is a single implementation program",
          actualData: "The actual work spans payments architecture, fraud controls, commercial client readiness, risk review, and vendor contracting.",
        },
      ],
    },
    {
      role: "CRO",
      name: "James Park",
      tenure: "4 years",
      background: "Former OCC examiner turned bank risk officer. Spent 12 years at the OCC before moving to banking. Understands examiner mindset deeply. Joined First Capital specifically to manage regulatory relationships. Currently personally accountable for 3 open MRAs from the March 2023 OCC exam.",
      priorities: [
        "Close all 3 open OCC MRAs before Q4 2026 examination",
        "Resolve board-level escalation requirement for MRA-1 by Q3 2026",
        "Reduce AML false positive rate from 94% toward 45% benchmark",
        "Build regulatory credibility ahead of next OCC exam",
        "Prevent any new MRA findings — especially on FedNow and data governance",
      ],
      quotes: [
        "The OCC relationship is constructive. We have a clear remediation plan and we are executing against it.",
        "Three MRAs is not unusual for a bank our size. What matters is the remediation timeline and execution.",
        "My biggest fear is walking into the Q4 2026 exam with one of these MRAs still open.",
        "FedNow implementation actually helps my regulatory posture — examiners want to see us addressing payment risk.",
      ],
      aiStance: "Compliance-first lens. Strongly supportive of BSA/AML AI and fraud detection AI — both directly reduce MRA risk. Skeptical of customer-facing AI without strong model risk management framework in place. Will require model risk governance before approving any AI deployment.",
      decisionStyle: "Process-driven and documentation-heavy. Moves deliberately. Will not approve anything that creates new regulatory risk even if ROI is compelling. Has significant influence over CEO on compliance matters — CEO defers to CRO on anything that touches the OCC relationship.",
      contradictions: [
        {
          publicPosition: "The OCC relationship is constructive and we have a clear plan",
          actualData: "3 open MRAs from March 2023 examination. MRA-1 requires board-level escalation by Q3 2026. If not closed by Q4 2026 exam, risk of formal enforcement action. MRA-2 cites BSA/AML system deficiencies that have not been remediated in 3 years.",
        },
        {
          publicPosition: "Our AML program is improving",
          actualData: "AML false positive rate is 94% vs 45% benchmark. NICE Actimize is 2 major versions behind at version 8.1 vs 10.2. Automation rate is 34% vs 72% benchmark. 6 excess FTE cost $1.08M annually. An OCC MRA cites these exact deficiencies.",
        },
      ],
    },
    {
      role: "CDO",
      name: "Sandra Liu",
      tenure: "6 months",
      background: "Former Head of Digital Banking at a $12B regional bank. Led mobile app rebuild that improved App Store rating from 2.9 to 4.3 in 18 months. Recruited specifically to fix the 64% account opening abandonment rate and improve digital adoption. New and still establishing credibility internally.",
      priorities: [
        "Fix account opening abandonment from 64% to 35% — her committed board metric",
        "Raise mobile app rating from 2.8 to 4.0+ by year-end",
        "Drive digital adoption from 41% toward 60%",
        "Build CDO function and hire 4 digital product managers",
        "Partner with CIO on FedNow — real-time payments critical for digital channel",
      ],
      quotes: [
        "The 64% abandonment rate is the most important number in this company right now. Every abandoned application is a lost customer relationship.",
        "Our competitors are acquiring customers in 3 minutes. We are losing 64% of applicants after 18 minutes. That is not a marketing problem. That is a product problem.",
        "I have 6 months of credibility runway. I need to show a measurable improvement on abandonment before my first board review.",
        "The mobile app rating of 2.8 is the public signal of our digital problem. When customers complain publicly, they tell prospects.",
      ],
      aiStance: "Native AI believer. Wants AI-powered onboarding, personalization, and digital engagement features. Constrained by the fact that her product roadmap depends on real-time data that FIS HORIZON batch architecture cannot provide. Waiting on FedNow API layer to unlock AI use cases.",
      decisionStyle: "Fast-moving, data-driven, product-focused. Frustrated by bank's slow decision-making pace. Will pilot quickly and iterate. Needs wins in first 12 months to establish budget authority. Reports to CEO — one of the few direct reports with a growth mandate rather than a cost mandate.",
      contradictions: [
        {
          publicPosition: "We have a clear 90-day roadmap to improve abandonment",
          actualData: "The primary abandonment driver — 18-minute application process caused by Narmi-to-FIS HORIZON batch sync — cannot be fixed without changes to core banking integration. That project is not funded or prioritized in Q1.",
        },
      ],
    },
    {
      role: "Head of Commercial Banking",
      name: "Kevin Walsh",
      tenure: "12 years",
      background: "Career commercial banker at First Capital. Grew the commercial book from $2.1B to $4.8B over his tenure. Deeply trusted by CFO and CEO. Has the most direct visibility into client defection driven by FedNow gap. Has documented the $340M deposit attrition risk internally.",
      priorities: [
        "Stop commercial deposit attrition — FedNow is the most urgent lever",
        "Retain top 50 commercial relationships at risk of moving primary banking",
        "Grow commercial treasury management revenue",
        "Accelerate commercial loan origination speed — 18-day decision vs 5-day benchmark",
        "Expand commercial deposits from $4.8B",
      ],
      quotes: [
        "I have 23 commercial clients with treasury teams who have told me directly: get on FedNow or we move our operating accounts. That is $340M.",
        "The 18-day credit decision is killing us with middle market. Private equity-backed companies will not wait 18 days.",
        "Every quarter I lose a client to a bank with faster payments is a quarter I lose ground I cannot get back.",
        "FedNow is not a digital feature. It is a commercial banking survival requirement.",
      ],
      aiStance: "Pragmatic and urgent. Wants AI in commercial credit underwriting to reduce 18-day decision time and in treasury analytics to help relationship managers demonstrate value. Not interested in AI for its own sake — wants AI that helps him retain and grow commercial clients.",
      decisionStyle: "Business-outcome focused, impatient with technology process. Has direct line to CEO and CFO. Will escalate commercial client risk directly to the board if FedNow is not resolved. The most credible internal voice for FedNow urgency because he has client names and dollar amounts.",
      contradictions: [
        {
          publicPosition: "Our commercial relationships are strong and loyal",
          actualData: "$340M in commercial deposits at documented attrition risk. 23 clients have verbally signaled they will move operating accounts if FedNow is not live. 3 clients have already moved a portion of balances to competitors with real-time payments.",
        },
      ],
    },
    {
      role: "Head of Retail Banking",
      name: "Amara Osei",
      tenure: "3 years",
      background: "Former retail banking leader at a regional bank that went through a successful digital transformation. Joined First Capital to lead retail modernization. Deeply aware of neobank competitive pressure on checking account acquisition. Champions digital-first customer experience.",
      priorities: [
        "Reverse digital adoption decline — 41% vs 67% peer median is her primary KPI",
        "Improve account opening experience — 64% abandonment is losing 10,000+ customers per year",
        "Compete with neobanks on checking account acquisition among 25-40 demographic",
        "Reduce branch transaction costs by shifting volume to digital channels",
        "Partner with CDO on mobile app rebuild",
      ],
      quotes: [
        "We opened 28,000 accounts digitally last year. We could have opened 77,000 if our abandonment rate matched benchmarks.",
        "Chime and SoFi are acquiring customers we should be winning. Our mobile app rating of 2.8 is losing us prospects before they ever apply.",
        "Digital adoption at 41% means 59% of our customers do not use our digital channels. That is 59% we have no behavioral data on.",
        "Every point of improvement in digital adoption is $4M in cost reduction. We need to see this as a cost play, not just a revenue play.",
      ],
      aiStance: "Growth-focused digital believer. Wants AI in onboarding, customer engagement, and personalized next-best-offer. Frustrated by data infrastructure limitations — T+1 balances mean she cannot build the real-time customer experience she wants.",
      decisionStyle: "Collaborative with CDO and CIO. Will build business case for digital investments. Responds well to customer data and peer comparisons. Needs CFO alignment to get budget — has learned to frame digital investments as cost reduction, not just revenue growth.",
      contradictions: [
        {
          publicPosition: "We are competitive in consumer deposit acquisition",
          actualData: "Digital-native competitors are acquiring First Capital's target demographic (25-40) at significantly higher rates. Mobile app rating of 2.8 vs peer average of 4.4 — below the 3.8 threshold where customers actively avoid downloading. Digital adoption declining MoM for 3 months.",
        },
      ],
    },
  ],
}
