import { apexExecutiveName } from "./org-structure";

export const apexInterviews = {
  metadata: {
    conductedBy: "AbarVa Intelligence Team",
    conductedDate: "March 2026",
    totalInterviews: 6,
    format: "60-minute structured interviews",
    note: "Transcripts condensed. All figures confirmed against system data and Apex org structure.",
  },
  budgetDiscrepancy: {
    approvedITBudget: 285,
    mappedITSpend: 247,
    shadowIT: 38,
    shadowITSaaSSubscriptions: 847,
    shadowITStoreCount: 1240,
    duplicateToolsIdentified: 23,
    note: "Total of mapped ($247M) + shadow ($38M) = approved budget ($285M). IT leadership lacks clean visibility into $38M shadow IT across stores.",
  },
  ceo: {
    executive: apexExecutiveName("CEO"),
    role: "CEO",
    tenureYears: 4,
    transcript: [
      {
        question: "How would you characterize Apex's digital transformation progress?",
        answer:
          "We have made meaningful investments in commerce, loyalty, and store technology. The board does not need another AI theme; it needs proof that one of these investments can scale and change operating results.",
        contradiction:
          "Cart abandonment is 71% vs 58% industry average. Mobile conversion is 1.1% vs 2.9% benchmark. Salesforce Einstein personalization has never been activated, so the current state is investment without enterprise activation.",
        flaggedClaim: "Meaningful investments",
        dataReality:
          "Cart abandonment 71% vs benchmark 58%. Mobile conversion 1.1% vs 2.9%. Einstein not activated.",
      },
      {
        question: "How do you feel about consulting and AI work to date?",
        answer:
          "The strategic work is not the problem. The issue is that we do not turn it into durable operating change fast enough.",
        contradiction:
          "$54M spent across three consultancies with no measurable AI initiative at enterprise scale. Three roadmaps sit on a shelf while four pilots remain stuck.",
        flaggedClaim: "Strategic work is not the problem",
        dataReality:
          "$54M in consulting fees. Zero AI initiatives at enterprise scale. Four pilots stuck in purgatory.",
      },
      {
        question: "What is your personal success metric for the next 18 months?",
        answer:
          "Digital revenue above 30%, margin recovering toward 5%, and one AI initiative working across the enterprise instead of in a hand-picked pilot group.",
        contradiction: "No contradiction. This is the authentic executive ask: scale with operating proof.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 72,
    budgetAuthority: "Full board approval",
    decisionStyle: "Evidence-driven. Skeptical of frameworks. Rewards delivery.",
  },
  cio: {
    executive: apexExecutiveName("CIO"),
    role: "CIO",
    tenureMonths: 18,
    transcript: [
      {
        question: "Where does the SAP migration stand?",
        answer:
          "We are working through the platform options and the dependency map. SAP is not a single project for us; it touches finance, supply chain, commerce, and store operations.",
        contradiction:
          "No migration decision has been made. No partner has been selected. No budget approved. The 2027 mainstream support end is close enough that sequencing now has board-level risk.",
        flaggedClaim: "Working through the platform options",
        dataReality:
          "Zero migration decisions made. No partner selected. 8,400 customizations not dispositioned. 2027 support deadline remains open.",
      },
      {
        question: "How do you see AI fitting into the technology roadmap?",
        answer:
          "AI is important, but it has to run on reliable data and a supportable platform. I do not want us buying demos while the operating model is not ready.",
        contradiction:
          "Some Wave 1 opportunities do not require full SAP migration. Segment identity resolution, Einstein activation, and the existing churn model can move if ownership and data fixes are committed.",
        flaggedClaim: "AI has to run on reliable data",
        dataReality:
          "Einstein unblock requires focused CDP identity work. Churn model is validated. Foundation work is required, but not every use case must wait for full SAP migration.",
      },
      {
        question: "What is your IT budget breakdown?",
        answer:
          "Our approved IT budget is $285M. We have mapped the major line items, but I am not satisfied with store-level SaaS visibility or duplicate tooling.",
        contradiction:
          "Mapped IT spend is $247M. Shadow IT across 1,240 stores is $38M - 847 SaaS subscriptions and 23 duplicate tools. Carlos is directionally aware, but governance has not closed the gap.",
        flaggedClaim: "Major line items",
        dataReality:
          "$38M shadow IT untracked. 847 unauthorized SaaS subscriptions. 23 duplicate tools. Governance gap.",
      },
    ],
    aiReadinessScore: 44,
    budgetAuthority: "Infrastructure, platforms, and systems",
    decisionStyle: "Infrastructure-first. Will support AI when run ownership and dependencies are explicit.",
  },
  cdo: {
    executive: apexExecutiveName("CDO"),
    role: "CDO",
    tenureYears: 1,
    transcript: [
      {
        question: "How is the Segment CDP performing?",
        answer:
          "Segment is valuable, but it is not yet the governed customer spine we need. Identity resolution and product ownership are the next hard moves.",
        contradiction:
          "340,000 of 1.54 million profiles (22%) are duplicates. Einstein has been blocked by this issue. The fix is known, but it still needs funding, ownership, and a committed delivery window.",
        flaggedClaim: "Not yet the governed customer spine",
        dataReality:
          "22% duplicate profiles (340K of 1.54M). Einstein blocked. Identity resolution needs funded delivery.",
      },
      {
        question: "When will Einstein be activated?",
        answer:
          "Activation depends on identity resolution, consent quality, and agreement with marketing on which journeys go first. We can move quickly if those decisions are made together.",
        contradiction:
          "The blocker has been known for at least 12 months. No purchase order or timeline exists for the identity-resolution work. The decision rights between CMO, CDO, and CIO are still muddy.",
        flaggedClaim: "We can move quickly",
        dataReality:
          "Known blocker. No funded timeline. Decision ownership split across CMO, CDO, and CIO.",
      },
    ],
    aiReadinessScore: 52,
    budgetAuthority: "Data platforms and AI governance recommendations",
    decisionStyle: "Technically realistic. Needs explicit executive backing to turn data problems into funded work.",
    ownedSystems: ["Segment CDP", "Databricks", "Snowflake"],
  },
  cfo: {
    executive: apexExecutiveName("CFO"),
    role: "CFO",
    tenureYears: 9,
    transcript: [
      {
        question: "How do you think about the SAP migration investment?",
        answer:
          "At 3.8% operating margin, a large capital outlay requires extraordinary justification. I am not opposed to modernization; I am opposed to open-ended spend.",
        contradiction:
          "Every year of delay on SAP increases extended-support, integration, and workaround costs. The cost-takeout narrative conflicts with a do-nothing path that compounds risk.",
        flaggedClaim: "I am not opposed to modernization",
        dataReality:
          "SAP extended support and workaround costs are growing. No migration partner selected. No capital decision made.",
      },
      {
        question: "What outcome metrics would cause you to approve a large AI investment?",
        answer:
          "I need outcome-based contracts. I will not pay for effort - I will pay for results: inventory turns, shrinkage reduction, margin improvement, and labor productivity.",
        contradiction:
          "No contradiction. Margaret will move if commercial structure, baseline, and measurement are strong enough.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 36,
    budgetAuthority: "Final approval on capital and technology spend",
    decisionStyle: "ROI-driven. Outcome-based contracts are the unlock. Avoids vanity metrics.",
  },
  chro: {
    executive: apexExecutiveName("CHRO"),
    role: "CHRO",
    tenureYears: 6,
    transcript: [
      {
        question: "What is your biggest workforce challenge right now?",
        answer:
          "Scheduling and turnover. They are related. When schedules are unstable or unfair, store teams leave. We need tools that make managers better without making the rollout harder.",
        contradiction:
          "No contradiction. Workforce scheduling is a natural AI entry point because the business owner has a measurable retention and labor-cost problem.",
        flaggedClaim: null,
        dataReality: null,
      },
      {
        question: "How AI-ready is your workforce?",
        answer:
          "Store managers are practical. If the tool makes the week easier, they adopt it. The failure mode is always rollout quality and trust.",
        contradiction:
          "Store labor optimization pilot is showing early results ($0.6M of $0.8M committed savings in first 4 months across 12 stores). Thomas is actively aligned to the expansion case.",
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
  chiefSupplyChain: {
    executive: apexExecutiveName("Chief Supply Chain Officer"),
    role: "Chief Supply Chain Officer",
    tenureYears: 7,
    transcript: [
      {
        question: "Where does demand forecasting stand?",
        answer:
          "We have challenges. Our forecast accuracy is around 60%, which is not where it needs to be. The root cause is data - we are not getting clean signals from SAP fast enough and supplier data is incomplete.",
        contradiction:
          "Demand forecast accuracy is 61% vs 85% benchmark. Michael correctly diagnoses the root cause, but the SAP data integration fix is still not fully funded. 87 days of inventory on hand vs 52-day benchmark.",
        flaggedClaim: "Around 60%",
        dataReality:
          "Exactly 61% vs 85% benchmark. 87 days inventory on hand vs 52-day benchmark. $800M+ excess inventory.",
      },
      {
        question: "What would demand forecasting AI mean for your business?",
        answer:
          "If we could get to 80-85% accuracy, inventory turns move toward 6. That is not a supply chain win; that is a balance sheet transformation.",
        contradiction:
          "Michael has conviction and a strong business case. The gap is not belief; it is a concrete path to 85% accuracy with credible data integration and vendor accountability.",
        flaggedClaim: null,
        dataReality: null,
      },
    ],
    aiReadinessScore: 74,
    budgetAuthority: "Supply chain technology recommendations to CFO and COO",
    decisionStyle: "Data-driven. Will champion AI if given credible retail proof points and data commitments.",
    inventoryTurns: 4.2,
    benchmarkInventoryTurns: 6.8,
    daysOnHand: 87,
    benchmarkDaysOnHand: 52,
  },
};
