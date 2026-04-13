export const apexVendors = {
  totalITBudget: 285,
  mappedSpend: 247,
  shadowIT: 38,
  vendors: [
    {
      name: "SAP",
      product: "SAP ECC 6.0",
      annualSpendMillions: 42,
      category: "ERP",
      contractStatus: "Active — end of mainstream maintenance 2027",
      riskLevel: "Critical",
      customModifications: 847,
      migrationOption: "S/4HANA",
      migrationEstimatedCostMillions: 180,
      keyRisk:
        "End of mainstream maintenance 2027. 847 custom modifications increase migration complexity. No migration decision made.",
      notes:
        "Largest single vendor by risk exposure. Every year of delay on migration decision compounds cost and risk.",
    },
    {
      name: "Salesforce",
      product: "Salesforce CRM + Commerce Cloud + Einstein",
      annualSpendMillions: 34,
      category: "CRM / Ecommerce / AI",
      contractStatus: "Active",
      riskLevel: "High",
      einsteinActivated: false,
      einsteinIdleValueMillions: 248,
      keyRisk:
        "Einstein not activated — $248M value sitting idle. Commerce Cloud underperforming at 2.3% conversion vs 3.8% benchmark.",
      notes:
        "Strong GCP + Salesforce partnership. Einstein activation is the fastest path to ROI — blocked only by $60K Segment fix.",
    },
    {
      name: "Manhattan Associates",
      product: "Manhattan Associates WMS",
      annualSpendMillions: 14,
      category: "Warehouse Management",
      contractStatus: "Active",
      riskLevel: "Low",
      implementationQuality: "Well-implemented",
      utilizationPercent: 94,
      sapIntegrationBatchDelayHours: 4,
      keyRisk:
        "SAP ECC integration creates 4-hour batch bottleneck. Limits real-time inventory optimization.",
      notes:
        "Best-implemented system in the portfolio. SAP dependency is the primary constraint.",
    },
    {
      name: "Oracle",
      product: "Oracle RMS (Retail Merchandising System)",
      annualSpendMillions: 8,
      category: "Retail Merchandising",
      contractStatus: "Active",
      riskLevel: "Medium",
      legacyStatus: true,
      keyRisk:
        "Legacy system. Needs replacement or modernization. Interfaces with SAP, creating migration dependency.",
      notes:
        "Will need to be addressed as part of SAP migration planning. Not standalone.",
    },
    {
      name: "IBM",
      product: "IBM Sterling OMS",
      annualSpendMillions: 6,
      category: "Order Management",
      contractStatus: "End of life — extended support",
      riskLevel: "High",
      endOfLife: true,
      eolAlreadyExtended: true,
      extensionYear: 2025,
      keyRisk:
        "End of life reached 2025 and already extended. Replacement urgency high. Rising support fees with no roadmap.",
      notes:
        "Extended past original end of life. Every quarter of delay increases migration urgency and cost.",
    },
    {
      name: "Shadow IT",
      product: "Unmanaged SaaS across 1,240 stores",
      annualSpendMillions: 38,
      category: "Unmanaged / Shadow IT",
      contractStatus: "Untracked",
      riskLevel: "High",
      saasSubscriptionCount: 847,
      storeCount: 1240,
      duplicateToolsIdentified: 23,
      keyRisk:
        "847 SaaS subscriptions across stores. 23 duplicate tools identified. Zero governance. Security and compliance exposure.",
      notes:
        "IT leadership has mapped $247M of $285M budget. The $38M gap is shadow IT at store level. Governance failure with security implications.",
    },
  ],
  consolidationOpportunity: {
    duplicateToolsCount: 23,
    estimatedAnnualSavingsFromConsolidationMillions: 12,
    priorityAreas: [
      "Scheduling and workforce tools (stores running 4+ different solutions)",
      "Reporting and analytics (Tableau, Power BI, Google Data Studio running in parallel)",
      "Communication tools (Slack, Teams, and Workplace by Meta all active)",
    ],
  },
}
