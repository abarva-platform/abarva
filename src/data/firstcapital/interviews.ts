interface InterviewContradiction {
  publicPosition: string
  actualData: string
  significance: string
}

interface InterviewTranscript {
  role: string
  name: string
  tenure: string
  interviewDate: string
  interviewContext: string
  keyStatements: string[]
  contradictions: InterviewContradiction[]
  salesIntelligence: string[]
  recommendedApproach: string
  primaryPain: string
  budgetAuthority: string
  decisionTimeframe: string
  aiReadinessScore: number
}

export const firstCapitalInterviews: { transcripts: InterviewTranscript[] } = {
  transcripts: [
    {
      role: "CEO",
      name: "David Morrison",
      tenure: "11 years",
      interviewDate: "March 2026",
      interviewContext: "60-minute executive briefing, AbarVa platform demonstration. Morrison was cordial but guarded. Focused on strategic narrative over operational data.",
      keyStatements: [
        "Our digital adoption is growing strongly. We have seen consistent improvement over the past year.",
        "I think the account opening abandonment is around 40%, which is something we are working on.",
        "FedNow is on our roadmap. We have a timeline we are comfortable with.",
        "We do not have a burning platform situation with core banking. We have a managed upgrade path.",
        "The OCC relationship is in good shape. We have a productive dialogue going on.",
        "I am supportive of AI where there is a clear ROI and no regulatory risk.",
      ],
      contradictions: [
        {
          publicPosition: "Digital adoption is growing strongly with consistent improvement",
          actualData: "Digital adoption rate is 41% vs 67% peer median. Has declined month-over-month for 3 consecutive months. Account opening abandonment is 64%, not the 40% Morrison cited — nearly double his estimate. Mobile app rating is 2.8 vs peer average 4.4.",
          significance: "CEO does not have accurate operational data on digital channels. CDO has been in role 6 months and may not have fully briefed up. This is an opening — AbarVa can bring the real data into the conversation.",
        },
        {
          publicPosition: "FedNow timeline is on our roadmap and we are comfortable with it",
          actualData: "$340M in commercial deposits at documented attrition risk per Head of Commercial Banking. 23 commercial clients have verbally signaled intent to move operating accounts. 68% of peer banks are already live on FedNow. No vendor signed, no middleware budgeted.",
          significance: "CEO is unaware of or minimizing the urgency Kevin Walsh has documented. Bringing the $340M attrition figure and the 23 named clients into the CEO conversation changes the dynamic from 'roadmap' to 'crisis'.",
        },
        {
          publicPosition: "No burning platform situation with core banking",
          actualData: "FIS HORIZON is 22 years old, running at 87% peak capacity. Extended maintenance premium is $4.2M above standard. Support risk begins 2027. SQL Server 2017 hit end-of-support October 2025. Core banking replacement evaluated twice with no decision — creating strategic paralysis.",
          significance: "Morrison's framing of 'managed upgrade path' contradicts CIO Huang's urgent assessment. Showing Morrison the peer comparison on core banking age (22 years vs 14 year median) and the $4.2M extended maintenance premium creates urgency.",
        },
        {
          publicPosition: "OCC relationship is in good shape",
          actualData: "3 open MRAs from March 2023 examination. MRA-1 requires board-level escalation by Q3 2026. Q4 2026 OCC examination is scheduled. Risk of formal enforcement action if MRAs not closed.",
          significance: "Either Morrison is managing optics or is not aware of the severity. CRO James Park is personally accountable and under significant pressure. The Q4 2026 exam creates a hard deadline that gives FedNow and AML initiatives urgency.",
        },
      ],
      salesIntelligence: [
        "CEO responds to peer comparisons — frame everything in terms of what 'banks our size' are doing",
        "Needs wins he can take to the board — focus on quick wins with visible outcomes",
        "Regulatory risk (OCC) is his most acute private concern despite public confidence",
        "Has deferred core banking twice — do not lead with core banking, lead with FedNow as standalone",
        "Decision style is consensus-driven — CEO will want CRO and CFO aligned before approving anything",
      ],
      recommendedApproach: "Lead with the $340M commercial deposit attrition data from Kevin Walsh's analysis — Morrison will be more alarmed to hear it framed as a named-client risk than a technology gap. Follow with the OCC exam timeline and FedNow as a 2-MRA resolution path. Close on 90-day window to contract before Q4 exam.",
      primaryPain: "OCC regulatory exposure and commercial client defection risk — both feel more urgent than digital adoption metrics",
      budgetAuthority: "Full authority but requires CFO and CRO alignment for any spend over $5M",
      decisionTimeframe: "Will move if OCC exam urgency is established — Q4 2026 exam creates 6-month decision window",
      aiReadinessScore: 52,
    },
    {
      role: "CIO",
      name: "Patricia Huang",
      tenure: "2 years",
      interviewDate: "March 2026",
      interviewContext: "90-minute technical deep dive. Huang was candid and frustrated. Most technically sophisticated executive in the room. Came prepared with FIS HORIZON architecture diagrams and FedNow certification requirements.",
      keyStatements: [
        "Core banking is stable. The system does what it needs to do for our current products.",
        "FedNow is our number one technology priority. I have the architecture figured out. What I need is a vendor decision.",
        "The $4.2M extended maintenance premium is a conversation I have every budget cycle and lose every time.",
        "I cannot build AI on a 22-year-old batch architecture. FedNow API layer is the prerequisite for everything.",
        "The SQL Server 2017 situation is embarrassing. I flagged it 18 months ago. No action.",
        "I have 2 Azure-certified staff out of 180 IT people. I cannot transform on that base.",
      ],
      contradictions: [
        {
          publicPosition: "Core banking is stable and does what it needs to do",
          actualData: "FIS HORIZON is 22 years old, on extended maintenance that costs $4.2M premium above standard support. Runs at 87% peak capacity with no headroom. FIS has not released a major feature since 2018. Unsupported risk begins 2027. Huang used the word 'stable' but immediately followed with 'the $4.2M premium is a conversation I lose every budget cycle'.",
          significance: "Huang is managing up with 'stable' language while privately acknowledging the risk. She needs external validation of the urgency she has been raising internally. AbarVa can provide the peer benchmark data she needs to win the budget argument.",
        },
        {
          publicPosition: "The cloud migration is progressing on our timeline",
          actualData: "Cloud adoption is 28% vs 62% peer median. FIS HORIZON on-premise requirement blocks migration of core systems. 2 Azure-certified staff out of 180. No cloud architecture team. Ad hoc Azure adoption with 60 underutilized VMs costing $480K annually in waste.",
          significance: "Huang knows the gap but is politically careful about how she frames it to the CEO. She is an internal champion for AbarVa's assessment if it validates her position.",
        },
      ],
      salesIntelligence: [
        "Huang is AbarVa's best internal champion — she wants the data to win internal arguments",
        "She has been fighting for FedNow funding for 18 months — give her the business case she can use",
        "Most technically credible voice in any vendor evaluation — she will pressure-test everything",
        "Frustrated with pace — will respond well to vendors who can move fast (90-day deployment story)",
        "Needs CEO and CFO aligned before she can proceed — help her make the case to both",
        "The $4.2M extended maintenance premium is her strongest internal argument — AbarVa should amplify it",
      ],
      recommendedApproach: "Huang is already sold. Focus the conversation on arming her with the external data and business case she needs to win CFO and CEO approval. Provide the peer benchmark comparison on FIS HORIZON age, extended maintenance cost, and FedNow adoption. Make her the hero of the FedNow deployment story.",
      primaryPain: "Blocked by budget and consensus process despite having clear technical answer — needs business case ammunition not technical validation",
      budgetAuthority: "Technical recommendation authority but no budget authority above $500K without CFO and CEO approval",
      decisionTimeframe: "Ready to move immediately — her constraint is internal budget approval, not vendor evaluation",
      aiReadinessScore: 71,
    },
    {
      role: "CFO",
      name: "Michael Torres",
      tenure: "7 years",
      interviewDate: "March 2026",
      interviewContext: "45-minute financial review. Torres came prepared with a one-page summary of IT spend as percentage of revenue versus peers. Focused on ROI and cost-to-income ratio throughout. Visibly uncomfortable when asked about the 2-quarter widening of the cost-to-income gap.",
      keyStatements: [
        "We are within 6 months of our cost-to-income target. We have the initiatives in flight.",
        "AI needs to earn its way in. Show me the payback in 18 months or less.",
        "I have the Salesforce situation on my list. It is not the biggest fish but it is on the list.",
        "I will not approve a core banking replacement while we are at 68% cost-to-income. The capital impact would worsen the ratio.",
        "FedNow is a commercial decision for Kevin Walsh to drive, not a technology decision.",
        "Compliance cost at 34% of IT budget is real. If AI can reduce that, I will fund it.",
      ],
      contradictions: [
        {
          publicPosition: "We are within 6 months of our cost-to-income target",
          actualData: "Cost-to-income ratio is 68% vs 55% target. Peer median is 58%. The gap widened in Q3 2025 and again in Q4 2025. At current trajectory the bank will miss the 24-month board target. The 'initiatives in flight' he referenced do not have committed savings attached to FY2026.",
          significance: "Torres is either optimistic or managing optics. The widening gap in 2 consecutive quarters is the most important data point. Showing him the peer trajectory — how comparable banks achieved 55-60% — creates urgency and frames AI automation as the cost reduction lever he is looking for.",
        },
        {
          publicPosition: "The Salesforce situation is on my list",
          actualData: "Salesforce costs $8M/year. Relationship manager adoption is 34%. 6 modules unused. $2.4M in immediate license right-sizing savings available. 'On my list' has meant no action for at least 12 months.",
          significance: "Torres responds to confirmed dollar amounts. The $2.4M Salesforce savings is a quick win AbarVa can validate and help execute. It establishes AbarVa as a cost-reduction partner, which improves receptiveness to larger investments.",
        },
        {
          publicPosition: "Compliance cost reduction through AI would get funded",
          actualData: "BSA/AML cost is $4.8M/year on NICE Actimize plus 12 AML analysts at $1.08M excess cost. AML automation AI would save $2.8M and close an OCC MRA as a side effect. Torres has not connected these dots and no proposal has been put in front of him.",
          significance: "Torres has told every interviewer he will fund AI that reduces compliance cost. The AML automation case directly delivers this. He just needs the proposal built in the language he responds to — compliance savings, cost-to-income improvement, OCC MRA resolution.",
        },
      ],
      salesIntelligence: [
        "Torres is persuaded by dollar amounts, peer comparisons, and payback periods — not narrative",
        "The cost-to-income gap widening in 2 quarters is his most acute pain — frame everything through this lens",
        "He will approve Wave 1 AI (fraud, AML, document processing) if payback is under 18 months",
        "Do not lead with core banking or large platform investment — he will shut down the conversation",
        "The Salesforce right-sizing is a credibility play — help him save $2.4M and he will fund the next project",
        "Quote him the compliance cost reduction number: $2.8M from AML automation closes a board-level MRA",
      ],
      recommendedApproach: "Lead with the cost-to-income peer comparison and show him the trajectory difference. Follow with the AML automation business case: $2.8M savings, OCC MRA closure, 1.75x ROI, 6-month payback. Close with the Salesforce right-sizing as immediate action. Keep the conversation in 'cost reduction' frame, not 'transformation'.",
      primaryPain: "Cost-to-income ratio widening vs target while board maintains pressure — needs a credible path to 62% in 12 months",
      budgetAuthority: "Full veto and approval authority on all technology spend. Will approve up to $10M if ROI is clear.",
      decisionTimeframe: "Will move within 30 days if ROI model is presented in his format — he has approved faster for clear cost reduction plays",
      aiReadinessScore: 58,
    },
    {
      role: "CRO",
      name: "James Park",
      tenure: "4 years",
      interviewDate: "March 2026",
      interviewContext: "75-minute compliance deep dive. Park was guarded initially but opened up significantly when the interviewer demonstrated knowledge of OCC examination processes. Most candid executive interviewed — clearly under personal accountability pressure.",
      keyStatements: [
        "The OCC relationship is constructive. We have a remediation plan and we are executing.",
        "Three MRAs is not unusual for a bank our size. The issue is the timeline.",
        "MRA-1 requires board-level escalation by Q3 2026. That is my most pressing deadline.",
        "AML false positive rate is something I hear about constantly from the examiners.",
        "FedNow implementation would actually help my regulatory position, not hurt it.",
        "I need model risk governance in place before I can approve any AI deployment.",
      ],
      contradictions: [
        {
          publicPosition: "The OCC relationship is constructive and we have a clear remediation plan",
          actualData: "3 open MRAs from the March 2023 examination — 3 years without full remediation. MRA-1 requires board-level escalation by Q3 2026 — an unusual severity level. Q4 2026 OCC exam is scheduled, meaning Park has 6 months to close 3 MRAs or face formal enforcement action risk. 'Constructive' is diplomatic language for a serious regulatory posture problem.",
          significance: "Park is using careful language but privately is under acute pressure. The Q4 2026 exam creates a hard deadline that makes FedNow (which closes 2 MRAs as a side effect) and AML automation (which closes MRA-2) time-critical decisions.",
        },
        {
          publicPosition: "AML false positive rate is improving",
          actualData: "AML false positive rate is 94% vs 45% benchmark — more than double the acceptable level. NICE Actimize is running version 8.1 vs 10.2 current. Automation rate is 34% vs 72% benchmark. 12 analysts vs 6 benchmark — $1.08M excess annual cost. An OCC MRA cites these exact deficiencies. There is no evidence of improvement in the last 12 months.",
          significance: "Park knows the numbers. He said 'something I hear about constantly' — which is his candid admission of ongoing examiner pressure. The upgrade path to NICE Actimize 10.2 is a clear, well-scoped $1.6M investment that directly closes MRA-2.",
        },
      ],
      salesIntelligence: [
        "Park's primary motivation is closing MRAs before Q4 2026 exam — everything else is secondary",
        "He is an OCC veteran — speak the examiner language (MRA closure, remediation evidence, exam readiness)",
        "The Q4 2026 exam creates a 6-month decision window — use it explicitly in framing",
        "FedNow resolves 2 MRAs as a side effect — Park is a strong internal champion once he sees this framing",
        "AML automation closes MRA-2 directly — Park will approve and champion this investment",
        "Model risk governance is his gating requirement — offer to include MRM framework in scope",
      ],
      recommendedApproach: "Open with the Q4 2026 exam timeline — Park will relax and engage when he sees you understand his world. Show the FedNow + AML automation combination as a 2-MRA closure package. Frame AbarVa as a regulatory exam readiness partner. Explicitly include model risk management framework in the AML automation scope.",
      primaryPain: "3 open OCC MRAs with hard Q3/Q4 2026 deadlines — personal accountability risk if not resolved",
      budgetAuthority: "Approves compliance technology spend up to $5M independently. Provides regulatory endorsement that unlocks CFO and CEO approval.",
      decisionTimeframe: "MRA-1 Q3 2026 deadline means Park will approve AML and FedNow investments in Q2 2026 if presented correctly",
      aiReadinessScore: 65,
    },
    {
      role: "CDO",
      name: "Sandra Liu",
      tenure: "6 months",
      interviewDate: "March 2026",
      interviewContext: "60-minute digital strategy session. Liu was energetic and data-driven. Most willing to share internal operational data of any executive interviewed. Clearly motivated to show results before her first board review.",
      keyStatements: [
        "The 64% abandonment rate is the number I wake up thinking about.",
        "I have a 90-day roadmap to improve abandonment but it depends on getting the Narmi integration fixed.",
        "Our mobile app rating is 2.8 and I need it at 4.0 by year-end. I know exactly what needs to change.",
        "I need real-time data to build the experience I want. FedNow and the API layer unlock my roadmap.",
        "I have been in role 6 months and I am still hiring my product team. I need external capacity now.",
        "Every point of abandonment improvement is worth approximately $1.8M in deposit acquisition.",
      ],
      contradictions: [
        {
          publicPosition: "We have a clear 90-day roadmap to improve abandonment",
          actualData: "The primary abandonment driver — 18-minute application process caused by Narmi-to-FIS HORIZON nightly batch sync — cannot be solved without core banking integration changes that are not funded or scheduled. Liu's 90-day roadmap addresses UI improvements (friction reduction) but not the underlying batch architecture problem that causes accounts to be invisible until the next business day.",
          significance: "Liu is motivated and capable but constrained by infrastructure she does not control. AbarVa can frame the FedNow API layer as the unlock that makes her digital roadmap executable — creating a clear advocate for the infrastructure investment.",
        },
      ],
      salesIntelligence: [
        "Liu is an internal champion who needs external validation and capacity — she wants a partner",
        "She has board-level visibility and a clear metric (abandonment rate) to improve",
        "Her 90-day roadmap is partially blocked by infrastructure — AbarVa can help resolve this",
        "She will be AbarVa's best reference if we help her achieve her board metric",
        "Only 6 months in — AbarVa can help her establish credibility by delivering results in first year",
        "The $1.8M per abandonment point framing she already uses should be in every deck",
      ],
      recommendedApproach: "Position AbarVa as the implementation partner for Liu's first-year objectives. Scope the digital onboarding AI project with her 35% abandonment target as the committed outcome. Show her the FedNow API layer as the infrastructure unlock for her 2026 AI roadmap. Make her the internal champion by giving her the data and the plan.",
      primaryPain: "64% account opening abandonment rate is her board-committed metric — she has 6 months to show improvement",
      budgetAuthority: "Limited direct authority — needs CDO budget of approximately $4M approved by CEO and CFO. Has CEO ear and can move quickly with their support.",
      decisionTimeframe: "Ready to move now — her constraint is budget approval and the Narmi integration dependency",
      aiReadinessScore: 68,
    },
    {
      role: "Head of Commercial Banking",
      name: "Kevin Walsh",
      tenure: "12 years",
      interviewDate: "March 2026",
      interviewContext: "45-minute commercial banking risk briefing. Walsh came with a one-page internal document titled 'FedNow Attrition Risk Analysis' dated February 2026. Most commercially urgent executive conversation in the engagement.",
      keyStatements: [
        "I have 23 commercial clients who have told me directly: get on FedNow or we move our operating accounts.",
        "$340M in deposits. Those are not estimated deposits. Those are named clients with named amounts.",
        "Three of those clients have already moved a portion of balances to JPMorgan. The rest are watching.",
        "I have sent this analysis to the CEO twice. I am told it is on the roadmap.",
        "Every week we delay on FedNow is a week I spend defending deposit balances instead of growing them.",
        "The 18-day credit decision is killing me with private equity portfolio companies. They will not wait.",
      ],
      contradictions: [
        {
          publicPosition: "Our commercial relationships are strong and we are competitive on services",
          actualData: "$340M in named deposits at documented attrition risk. 23 commercial clients on record with verbal intent to move. 3 clients have already moved partial balances. Internal FedNow attrition analysis sent to CEO twice with no action. Walsh is describing an active crisis, not a future risk.",
          significance: "Walsh's internal document is the most powerful piece of sales evidence in the engagement. With his permission, this data in front of the CFO and CEO changes the FedNow decision from 'roadmap' to 'emergency'. Walsh is already an internal champion — he needs an external partner to amplify his voice.",
        },
      ],
      salesIntelligence: [
        "Walsh has done the work — $340M figure is documented internally, not estimated",
        "He has tried to escalate internally and been delayed — external validation helps him",
        "He has budget influence: commercial banking contributes 62% of First Capital net interest income",
        "Frame FedNow as a commercial deposit retention play, not a technology project",
        "He will brief Kevin Walsh's 23 named clients to any vendor who can deploy in 90 days",
        "The 18-day credit decision pain is a second priority — Commercial Lending AI is Wave 2 but resonates",
      ],
      recommendedApproach: "Walsh is already sold. Help him make the business case to CFO and CEO. Present the $340M figure in board-level language: '19% of commercial deposits at documented attrition risk in the next 2 quarters.' Connect Finzly 87-day deployment directly to his Q2 2026 client deadline. Walsh should be in the room for the CEO/CFO meeting.",
      primaryPain: "$340M in commercial deposit attrition risk from FedNow gap — this is personal performance risk for Walsh",
      budgetAuthority: "Influences CFO on commercial banking capital allocation — his endorsement unlocks investment",
      decisionTimeframe: "Wants a vendor signed in Q2 2026 — his client conversations have a 60-90 day patience window",
      aiReadinessScore: 62,
    },
    {
      role: "Head of Retail Banking",
      name: "Amara Osei",
      tenure: "3 years",
      interviewDate: "March 2026",
      interviewContext: "60-minute retail banking strategy session. Osei was data-driven and strategic. Has the most complete picture of the competitive landscape of any executive interviewed — regularly uses Chime and SoFi as competitive reference points.",
      keyStatements: [
        "We opened 28,000 accounts digitally last year. We should have opened 77,000.",
        "Every point of digital adoption improvement shifts $4M in cost from branches to digital. That is real CFO math.",
        "The mobile app rating of 2.8 is not just a customer service problem. It is a customer acquisition problem.",
        "Digital-native competitors are winning our target demographic. I see it in the age distribution of new accounts.",
        "I need real-time data to run proper digital campaigns. T+1 balances mean I am always 24 hours behind.",
        "The CDO hire was the right move. Sandra understands what needs to happen. Now we need to execute.",
      ],
      contradictions: [
        {
          publicPosition: "We are competitive on checking account acquisition in our markets",
          actualData: "Digital adoption rate is 41% vs 67% peer median and declining. Mobile app rating 2.8 vs peer average 4.4 — below the 3.8 threshold where customers actively avoid downloading. New account age distribution is shifting toward 45+ demographic as 25-40 customers choose digital-native alternatives. Osei privately acknowledges this — 'I see it in the age distribution of new accounts' — but the public narrative remains competitive.",
          significance: "Osei is the most candid executive about the retail competitive challenge. She is an internal champion for the digital onboarding AI and mobile rebuild — and she frames it in the CFO language of cost reduction, not just customer experience.",
        },
      ],
      salesIntelligence: [
        "Osei already speaks CFO language — $4M cost per adoption point is her own framing, use it",
        "She and Liu (CDO) are aligned and will co-sponsor the digital onboarding investment",
        "The competitive framing (Chime, SoFi, neobank) resonates with her — use peer bank data liberally",
        "She is frustrated with T+1 data — FedNow API layer is as important for her as for commercial banking",
        "Her 28,000 vs 77,000 accounts framing is the most compelling retail ROI statement in the engagement",
        "She has been in role 3 years and needs a visible win — digital onboarding AI is her highest-leverage project",
      ],
      recommendedApproach: "Validate Osei's framing with external data (neobank acquisition rates, digital adoption benchmarks). Frame digital onboarding AI as a joint win for Osei (customer acquisition) and Torres (cost reduction). The 28,000 vs 77,000 accounts analysis — valued at $1.8M per abandonment point improvement — is the centerpiece of the retail banking business case.",
      primaryPain: "Losing 25-40 demographic to neobanks while 64% account opening abandonment rate eliminates acquired prospect intent",
      budgetAuthority: "Retail banking P&L owner — can fund up to $2M independently, endorses larger investments",
      decisionTimeframe: "Ready to move — looking for external partner to help her and Liu execute the digital onboarding project",
      aiReadinessScore: 64,
    },
  ],
}
