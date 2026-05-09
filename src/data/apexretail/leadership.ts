import { apexExecutiveName } from "./org-structure";

export const apexLeadership = {
  executives: [
    {
      role: "CEO",
      name: apexExecutiveName("CEO"),
      tenureYears: 4,
      publicStance:
        "Publicly committed to digital-first retail and operating margin recovery. Wants AI to move from pilot theater into scaled operating outcomes.",
      contradiction:
        "Three prior consulting roadmaps have not produced measurable enterprise outcomes. Cart abandonment remains 71% vs 58% benchmark and mobile conversion is 1.1% vs 2.9% benchmark.",
      privateReality:
        "Deeply skeptical of frameworks without execution proof. Pushes the team to prove one scaled operating result before expanding the AI portfolio.",
      keyQuote: "Show me one operating result that scales.",
      priorities: ["Digital revenue growth", "Operating margin recovery", "Proving AI ROI"],
      investmentAppetite: "High - if results demonstrable",
      changeReadiness: "High",
    },
    {
      role: "CFO",
      name: apexExecutiveName("CFO"),
      tenureYears: 9,
      publicStance:
        "Apex must be disciplined about technology spend while operating margin is under pressure.",
      contradiction:
        "Cost-takeout pressure collides with platform-first sequencing. SAP migration deferral preserves short-term cash but raises extended-support, integration, and operational-risk costs.",
      privateReality:
        "Will fund AI or platform work when value is measurable and the commercial model shares outcome risk.",
      keyQuote:
        "I am not writing a large check at 3.8% operating margin without iron-clad ROI.",
      priorities: ["Margin expansion", "CapEx discipline", "Outcome-based vendor contracts"],
      investmentAppetite: "Low - outcome-based only",
      changeReadiness: "Low",
      ownsSystems: ["SAP ECC", "IT vendor spend governance"],
    },
    {
      role: "COO",
      name: apexExecutiveName("COO"),
      tenureYears: 8,
      publicStance:
        "Store operations and fulfillment reliability must improve before Apex can call itself omnichannel.",
      contradiction:
        "Operations wants faster execution, but store, order, and inventory systems still create manual workarounds and inconsistent customer promises.",
      privateReality:
        "Practical operator. Supports technology when it reduces store friction and gives field leaders clear accountability.",
      keyQuote:
        "A pilot is not evidence until district managers can repeat it without special handling.",
      priorities: ["Store execution", "Fulfillment reliability", "Pilot-to-scale discipline"],
      investmentAppetite: "Medium - tied to operational proof",
      changeReadiness: "Medium",
      ownsSystems: ["IBM Sterling OMS", "NCR Counterpoint POS"],
    },
    {
      role: "CMO",
      name: apexExecutiveName("CMO"),
      tenureYears: 2,
      publicStance:
        "Apex should use loyalty, commerce, and personalization to treat customers as known individuals across every channel.",
      contradiction:
        "CMO owns loyalty outcomes while IT owns the CDP bottleneck. Salesforce Einstein is paid for but blocked by duplicate profiles and incomplete activation workflow.",
      privateReality:
        "Strong sponsor for personalization if data readiness and activation ownership are made explicit.",
      keyQuote:
        "We have loyalty data, but we still market to too many customers like strangers.",
      priorities: ["Loyalty activation", "Personalization", "Commerce conversion"],
      investmentAppetite: "Medium-High when data dependencies are committed",
      changeReadiness: "High",
      ownsSystems: ["Salesforce Commerce Cloud", "Punchh Loyalty"],
    },
    {
      role: "CDO",
      name: apexExecutiveName("CDO"),
      tenureYears: 1,
      publicStance:
        "Apex's data platform is maturing, with priority on identity resolution, governed data products, and AI-ready pipelines.",
      contradiction:
        "The CDO has the mandate for governed data products, but Segment, SAP, o9, and commerce data are still treated as project-specific feeds.",
      privateReality:
        "Knows data quality is the AI bottleneck. Needs sharper executive backing to fund identity resolution and reusable data products.",
      keyQuote:
        "If the data product is not owned, every AI use case becomes a custom integration project.",
      priorities: ["CDP unification", "Data product ownership", "AI governance"],
      investmentAppetite: "Medium",
      changeReadiness: "Medium",
      ownsSystems: ["Segment CDP", "Databricks", "Snowflake"],
    },
    {
      role: "CIO",
      name: apexExecutiveName("CIO"),
      tenureMonths: 18,
      publicStance:
        "SAP, integration, and platform reliability must be sequenced before the AI portfolio expands.",
      contradiction:
        "Infrastructure-first sequencing is valid for some programs but is being used too broadly; several Wave 1 use cases can move once ownership and data fixes are made.",
      privateReality:
        "Was hired to stabilize the core and reports through operations. Sees every AI conversation as risk unless dependencies and run ownership are explicit.",
      keyQuote:
        "We need the foundation stable, but we also need to stop confusing sequencing with paralysis.",
      priorities: ["SAP ECC migration decision", "Integration reliability", "Platform operating model"],
      investmentAppetite: "Medium - infrastructure and data readiness first",
      changeReadiness: "Medium",
      ownsSystems: ["SAP ECC", "Salesforce platform", "Store technology", "Cloud infrastructure"],
    },
    {
      role: "CISO",
      name: apexExecutiveName("CISO"),
      tenureYears: 3,
      publicStance:
        "Retail AI must be governed with strong identity, payment, privacy, and third-party risk controls.",
      contradiction:
        "Security is asked to approve AI pilots after vendor selection, not during architecture and data-design decisions.",
      privateReality:
        "Will support AI if threat modeling, PCI, privacy, and model access controls are visible early.",
      keyQuote:
        "Security cannot be the final sign-off on a decision that was already made.",
      priorities: ["PCI DSS v4.0 readiness", "Third-party AI risk", "Identity and access governance"],
      investmentAppetite: "Medium - risk reduction with clear controls",
      changeReadiness: "Medium",
      ownsSystems: ["Security operations", "Identity governance"],
    },
    {
      role: "Chief Sustainability Officer",
      name: apexExecutiveName("Chief Sustainability Officer"),
      tenureYears: 5,
      publicStance:
        "Fulfillment, sourcing, and store operations decisions need to reflect carbon and ESG commitments.",
      contradiction:
        "Faster fulfillment promises can conflict with sustainability KPIs when inventory placement and routing are not optimized.",
      privateReality:
        "Needs a seat in supply-chain AI decisions before service-level targets are locked.",
      keyQuote:
        "Speed and sustainability should not be competing scorecards.",
      priorities: ["Sustainable fulfillment", "Supplier ESG visibility", "Carbon-aware logistics"],
      investmentAppetite: "Medium - when ESG and margin are jointly measured",
      changeReadiness: "Medium",
    },
    {
      role: "CHRO",
      name: apexExecutiveName("CHRO"),
      tenureYears: 6,
      publicStance:
        "Apex is investing in workforce tools that improve manager effectiveness, scheduling fairness, and store retention.",
      contradiction:
        "Store labor optimization is promising, but turnover remains high and manual scheduling still dominates.",
      privateReality:
        "One of the most AI-ready executives because scheduling quality directly affects retention and labor cost.",
      keyQuote:
        "If we can get scheduling right, turnover drops and so does labor cost per transaction.",
      priorities: ["AI scheduling deployment", "Turnover reduction", "Labor cost optimization"],
      investmentAppetite: "Medium-High - people ROI is measurable",
      changeReadiness: "High",
      laborFTEs: 12000,
    },
    {
      role: "Chief Merchandising Officer",
      name: apexExecutiveName("Chief Merchandising Officer"),
      tenureYears: 4,
      publicStance:
        "Merchandising needs better demand sensing, markdown intelligence, and localized assortment decisions.",
      contradiction:
        "Merchants are accountable for margin and availability, but forecast signals, inventory visibility, and vendor compliance data are fragmented.",
      privateReality:
        "Will sponsor AI when recommendations are explainable by category, season, and store cluster.",
      keyQuote:
        "A black-box markdown recommendation is not enough when the merchant owns the margin miss.",
      priorities: ["Localized assortment", "Markdown optimization", "Vendor compliance"],
      investmentAppetite: "Medium - category proof first",
      changeReadiness: "Medium-High",
    },
    {
      role: "Chief Supply Chain Officer",
      name: apexExecutiveName("Chief Supply Chain Officer"),
      tenureYears: 7,
      publicStance:
        "Supply chain is stabilizing, but forecast accuracy and inventory placement need to improve.",
      contradiction:
        "Inventory turns are 4.2x vs 6.8x benchmark and demand forecasting accuracy is 61%, yet the data integration plan is still not fully funded.",
      privateReality:
        "Has the business case for demand forecasting AI in his head but needs a credible path to 85% accuracy and executive commitment on data integration.",
      keyQuote:
        "We are carrying excess inventory because our forecast is wrong. That is not just a supply chain problem - it is a data problem.",
      priorities: ["Demand forecasting accuracy", "Inventory turn improvement", "Supply chain visibility"],
      investmentAppetite: "Medium-High - inventory ROI is immediate",
      changeReadiness: "High",
      ownsSystems: ["o9 Demand Planning", "Manhattan WMS"],
      inventoryTurns: 4.2,
      benchmarkInventoryTurns: 6.8,
    },
    {
      role: "General Counsel",
      name: apexExecutiveName("General Counsel"),
      tenureYears: 6,
      publicStance:
        "AI, loyalty, and retail data use must stay inside privacy, advertising, payments, and vendor-contract guardrails.",
      contradiction:
        "Teams want faster personalization while privacy rights, data lineage, and vendor claims are not always documented at decision time.",
      privateReality:
        "Supports AI when legal review receives evidence early enough to shape terms, consent, and controls.",
      keyQuote:
        "A good AI use case still fails if we cannot prove consent, lineage, and accountability.",
      priorities: ["Privacy compliance", "AI contracting controls", "Regulatory evidence"],
      investmentAppetite: "Medium - governance embedded up front",
      changeReadiness: "Medium",
    },
  ],
  boardPriorities: [
    "Operating margin recovery from 3.8% to 6.5%",
    "SAP ECC migration decision - deadline overdue",
    "Einstein activation - $248M idle value",
    "Digital revenue mix from 21% to 35%",
    "Inventory turns from 4.2x to 6.0x",
  ],
};
