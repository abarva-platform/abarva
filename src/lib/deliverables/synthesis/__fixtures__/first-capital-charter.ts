// First Capital — AI Trade Finance L/C Automation — sample CharterInput.
// Shared by the charter-shaper test, the golden regression, and sample renders.

import type { CharterInput } from "../charter-shaper";

export const FC_CHARTER: CharterInput = {
  engagement: "AI Trade Finance Letter-of-Credit Automation",
  client: "First Capital Financial",
  decisionRequested:
    "Approve a six-week discovery to validate the L/C baseline, the control pathway, and the value case before any build commitment.",
  recommendation: "proceed",
  recommendationRationale:
    "Letter-of-Credit processing is document-heavy and control-sensitive — a strong fit for AI assistance — but the value case rests on five operating facts the bank has not yet supplied.",
  whyNow:
    "Manual L/C review is slow to scale and hard to evidence for examiners; an officer-supervised AI path can lift throughput without weakening control.",
  known: [
    "L/C review is manual today, with exceptions tracked outside the core system.",
    "The bank's target data platform and AML controls are already set and can host this workflow.",
    "Regulatory expectations (model risk, financial-crime screening) require a human approval on every exception.",
  ],
  discoveryScope: [
    "Quantify the current L/C baseline: volume, touch time, cycle time, discrepancy rate, unit cost.",
    "Confirm the control pathway: where a human approves and how decisions are evidenced.",
    "Shape the value case and the build scope for a supervised first wave.",
  ],
  successCriteria: [
    "A validated baseline the finance team will stand behind.",
    "A control design risk and compliance will sign.",
    "A funded, scoped first wave with named owners.",
  ],
  gates: {
    proceed:
      "the baseline and control pathway are validated and the value case clears the hurdle.",
    hold: "the operating facts remain unconfirmed or the control design is unresolved.",
    stop: "the process cannot be evidenced to examiner standard even with a human in the loop.",
  },
  immediateDecisions: [
    "Name the executive sponsor and the trade-finance process owner.",
    "Authorise access to the L/C operating data for the baseline.",
  ],
  openInputs: [
    "Annual L/C volume",
    "Manual touch time per L/C",
    "Average cycle time (receipt to decision)",
    "Discrepancy rate",
    "Current fully-loaded unit cost per L/C",
  ],
  sources: [
    { label: "First Capital 2025 Annual Report", family: "annual report", confidence: "high" },
    { label: "First Capital Model Risk & AI Governance", family: "policy", confidence: "high" },
  ],
};
