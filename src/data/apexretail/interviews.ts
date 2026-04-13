export const apexInterviews = {
  metadata: {
    conductedBy: "AbarVa Intelligence Team",
    conductedDate: "March 2026",
    totalInterviews: 6,
    format: "60-minute structured interviews",
    note: "Transcripts condensed. All figures confirmed against system data.",
  },
  budgetDiscrepancy: {
    approvedITBudget: 285,
    mappedITSpend: 247,
    shadowIT: 38,
    shadowITSaaSSubscriptions: 847,
    shadowITStoreCount: 1240,
    duplicateToolsIdentified: 23,
    note: "Total of mapped ($247M) + shadow ($38M) = approved budget ($285M). IT leadership unaware of $38M shadow IT across stores.",
  },
  ceo: {
    executive: "Jennifer Park",
    role: "CEO",
    tenureYears: 4,
    transcript: [
      {
        question: "How would you characterize Apex's digital transformation progress?",
        answer:
          "We have made meaningful investments. Our ecommerce platform is Salesforce Commerce Cloud — enterprise grade. We have a loyalty program with over a million members. Our personalization is best-in-class. We are digitally competitive.",
        contradiction:
          "Cart abandonment is 71% vs 58% industry average. Mobile conversion is 1.1% vs 2.9% benchmark. Salesforce Einstein personalization has never been activated — there is zero active personalization running. 'Best-in-class' is the opposite of actual performance.",
        flaggedClaim: "Our personalization is best-in-class",
        dataReality:
          "Cart abandonment 71% vs benchmark 58%. Mobile conversion 1.1% vs 2.9%. Einstein not activated.",
      },
      {
        question: "How do you feel about your consulting partners' work to date?",
        answer:
          "We have engaged McKinsey, Deloitte, and BCG. They have delivered strong strategic frameworks. The challenge is always execution — that is on us.",
        contradiction:
          "$54M spent across three consultancies with no measurable outcomes. Three roadmaps sit on a shelf. Jennifer's private quote in pre-call: 'Show me one thing that works.'",
        flaggedClaim: "Strong strategic frameworks",
        dataReality:
          "$54M in consulting fees. Zero AI initiatives at enterprise scale. 4 pilots stuck in purgatory.",
      },
      {
        question: "What is your personal success metric for the next 18 months?",
        answer:
          "Digital revenue above 30% and operating margin recovering toward 5%. And frankly — I want to see one AI initiative working at scale, not in a pilot.",
        contradiction: "No contradiction — this is the authentic Jennifer. The one word that matters: scale.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 72,
    budgetAuthority: "Full board approval",
    decisionStyle: "Evidence-driven. Skeptical of frameworks. Rewards delivery.",
  },
  cio: {
    executive: "Thomas Reeves",
    role: "CIO",
    tenureMonths: 18,
    transcript: [
      {
        question: "Where does the SAP migration stand?",
        answer:
          "We are making good progress. The SAP migration is on track. We have evaluated the options and we are working through the complexity. 2027 is the target.",
        contradiction:
          "No migration decision has been made. No partner has been selected. No budget approved. The 2027 mainstream support end is 18 months away and nothing is 'on track' because nothing has started.",
        flaggedClaim: "SAP migration is on track",
        dataReality:
          "Zero migration decisions made. No partner selected. 847 custom modifications not assessed. 2027 deadline 18 months away.",
      },
      {
        question: "How do you see AI fitting into the technology roadmap?",
        answer:
          "AI is important but it has to come after we fix the foundation. We cannot build a house on sand. SAP is the foundation. Data integration is the foundation. AI without that is just demo-ware.",
        contradiction:
          "Google Vertex AI contract is active and dynamic pricing backtest shows $124M opportunity that requires no SAP dependency. Segment duplicate profile fix ($60K) that would unblock Einstein has been available for 18 months and not actioned.",
        flaggedClaim: "AI has to come after we fix the foundation",
        dataReality:
          "Einstein unblock requires $60K Segment fix — no SAP dependency. Vertex AI dynamic pricing is SAP-independent. Foundation excuse is not valid for Wave 1 opportunities.",
      },
      {
        question: "What is your IT budget breakdown?",
        answer:
          "Our approved IT budget is $285M. We have good visibility into where that money goes. I can walk you through the major line items — SAP, Salesforce, Manhattan, infrastructure.",
        contradiction:
          "Mapped IT spend is $247M. Shadow IT across 1,240 stores is $38M — 847 SaaS subscriptions the CIO is unaware of. 23 duplicate tools identified. Total matches the $285M budget but $38M is invisible to IT leadership.",
        flaggedClaim: "We have good visibility into where that money goes",
        dataReality:
          "$38M shadow IT untracked. 847 unauthorized SaaS subscriptions. 23 duplicate tools. Governance failure.",
      },
    ],
    aiReadinessScore: 38,
    budgetAuthority: "Infrastructure and systems",
    decisionStyle: "Infrastructure-first. Resistant to AI initiatives that increase complexity.",
  },
  cdo: {
    executive: "Priya Nair",
    role: "CDO",
    tenureYears: 1,
    transcript: [
      {
        question: "How is the Segment CDP performing?",
        answer:
          "Segment is working well for us. We have good data flowing through the platform. The team is working on some optimization projects. We are happy with where it is headed.",
        contradiction:
          "340,000 of 1.54 million profiles (22%) are duplicates. Einstein has been blocked for 18 months because of this exact issue. The fix is a $60K data engineering project. Priya owns Segment and Einstein. Neither problem has been escalated or funded.",
        flaggedClaim: "Segment is working well for us",
        dataReality:
          "22% duplicate profiles (340K of 1.54M). Einstein blocked 18 months. Fix: $60K data engineering project. Not funded.",
      },
      {
        question: "When will Einstein be activated?",
        answer:
          "We are making progress on Einstein activation. There are some data quality dependencies we are working through. I am confident we will have personalization running later this year.",
        contradiction:
          "The specific blocker — Segment duplicate profiles — has been known for at least 12 months. The fix is a $60K project. No RFP, no purchase order, no timeline exists. 'Later this year' has been the answer for four consecutive quarters.",
        flaggedClaim: "We are making progress on Einstein activation",
        dataReality:
          "No progress. Blocker identified 12+ months ago. $60K fix not funded. Zero personalization running.",
      },
    ],
    aiReadinessScore: 44,
    budgetAuthority: "Digital and data platforms",
    decisionStyle: "Optimistic public framing. Slow to escalate problems. Ownership-protective.",
    ownedSystems: ["Salesforce Einstein", "Segment CDP", "Salesforce Commerce Cloud"],
  },
  cfo: {
    executive: "Marcus Johnson",
    role: "CFO",
    tenureYears: 9,
    transcript: [
      {
        question: "How do you think about the SAP migration investment?",
        answer:
          "At 3.8% operating margin, a $180M capital outlay requires extraordinary justification. We are being disciplined. I am not opposed to SAP migration — I just want to see a credible business case before we commit.",
        contradiction:
          "Every year of delay on SAP costs approximately $18M in extended support and workaround labor. The cost of inaction compounds. At nine years tenure he has seen three missed SAP decision deadlines. The 'credible business case' request has been the blocking maneuver each time.",
        flaggedClaim: "I just want to see a credible business case",
        dataReality:
          "SAP extended support costs ~$18M/year. 3 missed decision deadlines. $180M migration vs escalating do-nothing cost.",
      },
      {
        question: "What outcome metrics would cause you to approve a large AI investment?",
        answer:
          "I need outcome-based contracts. I will not pay for effort — I will pay for results. Inventory turns from 4.2 to 5.5, shrinkage below 2%, margin improvement of 100 basis points. If a vendor will put skin in the game, I will fund it.",
        contradiction:
          "No contradiction — this is the authentic CFO. He will move if the contract structure is outcome-based. This is a door-opening statement.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 32,
    budgetAuthority: "Final approval on all capital and technology spend",
    decisionStyle: "ROI-driven. Outcome-based contracts are the unlock. Avoid vanity metrics.",
  },
  cpo: {
    executive: "Lisa Chen",
    role: "CPO",
    tenureYears: 6,
    transcript: [
      {
        question: "What is your biggest workforce challenge right now?",
        answer:
          "Scheduling and turnover. They are related. When we schedule people badly — wrong hours, wrong store, wrong skills — they leave. We have 12,000 store FTEs and scheduling is still manual. That is unacceptable in 2026.",
        contradiction:
          "No contradiction — Lisa is more candid than most executives. AI scheduling is her number one ask. She has the change management capacity to deploy it.",
        flaggedClaim: null,
        dataReality: null,
      },
      {
        question: "How AI-ready is your workforce?",
        answer:
          "More ready than people think. Store managers are practical — if you show them a tool that makes their life easier, they adopt it. The failure mode is always the rollout, not the technology.",
        contradiction:
          "Store labor optimization pilot is showing early results ($0.6M of $0.8M committed savings in first 4 months across 12 stores). Lisa is actively championing this — no contradiction, she is the most aligned executive to AI deployment.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 78,
    budgetAuthority: "Workforce technology and training",
    decisionStyle: "Practical and execution-focused. Rewards tools that simplify manager work.",
    laborFTEs: 12000,
    storeCount: 1240,
  },
  svpSupplyChain: {
    executive: "David Kim",
    role: "SVP Supply Chain",
    tenureYears: 7,
    transcript: [
      {
        question: "Where does demand forecasting stand?",
        answer:
          "We have challenges. Our forecast accuracy is around 60%, which is not where it needs to be. The root cause is data — we are not getting clean signals from SAP fast enough and our supplier data is incomplete.",
        contradiction:
          "Demand forecast accuracy is 61% vs 85% benchmark. David correctly diagnoses the root cause but has not funded the SAP data integration fix. 87 days of inventory on hand vs 52-day benchmark. The cost of this gap is approximately $800M in excess inventory.",
        flaggedClaim: "Around 60%",
        dataReality:
          "Exactly 61% vs 85% benchmark. 87 days inventory on hand vs 52-day benchmark. $800M+ excess inventory.",
      },
      {
        question: "What would demand forecasting AI mean for your business?",
        answer:
          "If we could get to 80-85% accuracy, inventory turns go from 4.2 to close to 6. That is not a supply chain win — that is a balance sheet transformation. I have modeled it. The number is real.",
        contradiction:
          "David has the model in his head and knows the number. He is a natural champion. The gap is not conviction — it is that no one has given him a concrete path to 85% accuracy with a credible vendor.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 74,
    budgetAuthority: "Supply chain technology recommendations to CFO",
    decisionStyle: "Data-driven. Will champion AI if given a credible vendor with retail proof points.",
    inventoryTurns: 4.2,
    benchmarkInventoryTurns: 6.8,
    daysOnHand: 87,
    benchmarkDaysOnHand: 52,
  },
}
