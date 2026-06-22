// First Capital — AI Trade Finance L/C Automation — sample HandoffInput.
// Shared by the storyline-deck test, the golden regression, and sample renders.

import type { HandoffInput } from "../storyline-deck";

export const FC_HANDOFF: HandoffInput = {
  engagement: "AI Trade Finance Letter-of-Credit Automation",
  client: "First Capital Financial",
  decisionHeadline:
    "Approve a supervised AI path for L/C processing — automate the document work, keep an officer on every exception.",
  decisionRequested:
    "We ask the committee to fund a six-week discovery and a supervised first wave.",
  situation:
    "L/C review is manual and hard to evidence; throughput cannot scale without weakening control.",
  findings: [
    "Document review and clause comparison are done by hand today.",
    "Exceptions live outside the core system, so evidence is fragmented.",
    "The bank's target platform and AML controls can host this workflow.",
  ],
  valueStory:
    "The value is faster, evidenced L/C decisions at lower unit cost — once the operating baseline is confirmed.",
  recommendation:
    "Proceed to a supervised first wave on the bank's set platform; do not commit to scale until the baseline clears.",
  solutionConcept:
    "An agentic workbench extracts and compares clauses; an officer approves every exception.",
  roadmap: [
    "Foundation: ingest and extract, officer workbench in shadow mode.",
    "Comparison: AI-assisted clause checks, officer-approved.",
    "Scale: low-risk straight-through with controls hardened.",
  ],
  risks: [
    { risk: "Model risk", mitigation: "validation and monitoring to examiner standard" },
    { risk: "Adoption", mitigation: "officer-in-the-loop from day one" },
  ],
  decisionsRequired: [
    "Name the sponsor and process owner.",
    "Authorise access to the L/C operating data.",
  ],
  evidenceSummary:
    "Grounded in the 2025 annual report and the model-risk governance policy; baseline facts pending.",
};
