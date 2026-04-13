export const apexLeadership = {
  executives: [
    {
      role: "CEO",
      name: "Jennifer Park",
      tenureYears: 4,
      publicStance:
        "Publicly committed to digital transformation. Vocal about being a technology-first retailer.",
      contradiction:
        "3 prior consulting firms delivered roadmaps with no measurable results. Cart abandonment 71% vs 58% industry benchmark. Mobile conversion 1.1% vs 2.9% benchmark. Claims 'best-in-class personalization' with zero personalization engine activated.",
      privateReality:
        "Deeply skeptical of consultants. Wants proof of execution, not another slide deck.",
      keyQuote: "Show me one thing that works.",
      priorities: ["Digital revenue growth", "Operating margin recovery", "Proving AI ROI"],
      investmentAppetite: "High — if results demonstrable",
      changeReadiness: "High",
    },
    {
      role: "CIO",
      name: "Thomas Reeves",
      tenureMonths: 18,
      publicStance:
        "SAP migration is under control. AI will be tackled after the foundation is stable.",
      contradiction:
        "No SAP migration decision has been made. 2027 end-of-mainstream-support is 18 months away. Clock is ticking with no plan. Calls AI a 'distraction' while the business bleeds $62M in dynamic pricing opportunity monthly.",
      privateReality:
        "Was hired specifically to fix SAP. Sees every AI conversation as scope creep that delays his core mandate.",
      keyQuote:
        "We need to stabilize the foundation before we add more complexity.",
      priorities: ["SAP ECC migration decision", "Infrastructure stability", "Data governance"],
      investmentAppetite: "Medium — infrastructure only",
      changeReadiness: "Medium",
    },
    {
      role: "CDO",
      name: "Priya Nair",
      tenureYears: 1,
      publicStance:
        "Segment CDP is working well for us. Einstein activation is in progress.",
      contradiction:
        "22% of Segment profiles are duplicates (340K of 1.54M). Einstein has been blocked for 18 months. The fix is a $60K data engineering project she has not prioritized. Segment issue is her direct responsibility.",
      privateReality:
        "Knows the duplicate profile problem exists. Has not escalated or funded the fix. Likely protecting turf.",
      keyQuote:
        "Our data platform is maturing and we are on a path to full activation.",
      priorities: ["Einstein activation", "CDP unification", "Personalization roadmap"],
      investmentAppetite: "Medium",
      changeReadiness: "Medium",
      ownsSystems: ["Salesforce Einstein", "Segment CDP"],
    },
    {
      role: "CFO",
      name: "Marcus Johnson",
      tenureYears: 9,
      publicStance:
        "We are being fiscally responsible about technology investment given our margin profile.",
      contradiction:
        "SAP migration $180M is the monster under the bed. Has blocked the decision for years. Every year of delay compounds risk and cost. At 3.8% operating margin, a $180M write-off would be catastrophic — yet no action is a larger risk.",
      privateReality:
        "Wants to defer the SAP migration as long as possible. Outcome-based contracts are the only model he will accept.",
      keyQuote:
        "I am not writing a $180M check at 3.8% operating margin without iron-clad ROI.",
      priorities: ["Margin expansion", "CapEx deferral", "Outcome-based vendor contracts"],
      investmentAppetite: "Low — outcome-based only",
      changeReadiness: "Low",
    },
    {
      role: "CPO",
      name: "Lisa Chen",
      tenureYears: 6,
      publicStance:
        "We are investing in our people and workforce tools to reduce turnover.",
      contradiction:
        "Annual store staff turnover is running high across 12,000 store labor FTEs. AI scheduling is her stated priority but manual scheduling persists across all 1,240 stores, contributing to the turnover problem.",
      privateReality:
        "Eager to adopt AI scheduling — it directly reduces her headline problem (turnover). One of the most AI-ready executives.",
      keyQuote:
        "If we can get scheduling right, turnover drops and so does our labor cost per transaction.",
      priorities: ["AI scheduling deployment", "Turnover reduction", "Labor cost optimization"],
      investmentAppetite: "Medium-High — people ROI is measurable",
      changeReadiness: "High",
      laborFTEs: 12000,
    },
    {
      role: "SVP Supply Chain",
      name: "David Kim",
      tenureYears: 7,
      publicStance:
        "Our supply chain is stabilizing after the disruptions of the past few years.",
      contradiction:
        "Inventory turns 4.2x vs 6.8x benchmark. 87 days of inventory on hand vs 52-day benchmark. Demand forecasting accuracy at 61%. Knows forecasting is broken but has not escalated the SAP data gap that is root-causing the problem.",
      privateReality:
        "Deeply frustrated with demand forecasting accuracy. Has the business case for AI in his head but not on paper.",
      keyQuote:
        "We are carrying $800M in excess inventory because our forecast is wrong. That is not a supply chain problem — that is a data problem.",
      priorities: ["Demand forecasting accuracy", "Inventory turn improvement", "DC automation"],
      investmentAppetite: "Medium-High — inventory ROI is immediate",
      changeReadiness: "High",
      inventoryTurns: 4.2,
      benchmarkInventoryTurns: 6.8,
    },
  ],
  boardPriorities: [
    "Operating margin recovery from 3.8% to 6.5%",
    "SAP ECC migration decision — deadline overdue",
    "Einstein activation — $248M idle value",
    "Digital revenue mix from 21% to 35%",
    "Inventory turns from 4.2x to 6.0x",
  ],
}
