// Clean demo Move set for Meridian Health (synthetic).
//
// WHAT THIS IS
// A reviewable, grounded CONTENT SPEC for a small, realistic Strategic Moves
// portfolio to show a client. It replaces the test-named / placeholder moves
// that currently clutter the demo board (e.g. "Synthetic Agent Assist Claude
// E2E 1002", charter text like "ROLE-01 … authority_matrix.csv") with five
// moves a healthcare CXO would recognise.
//
// WHERE THE CONTENT COMES FROM
// Each move is drawn from the interview-derived candidate opportunities in
// datasets/tenant-inputs/meridian-health/derived/module-context/moves-context-view.json
// (candidate_move_opportunities). Systems, data domains, evidence gaps and the
// honest boundary are taken from that artifact, not invented.
//
// HONESTY BOUNDARY (do not cross when loading)
// These are CANDIDATE opportunities in early shaping. The source artifact is
// explicit: "Interview support raises priority/readiness confidence only. It
// does not create approved funding, realized value, or program execution
// status." So every move here stays in an early phase (Originate / Charter /
// Discover), carries no fabricated funding or realized value (value is
// "to be validated"), and names its open evidence honestly. This keeps the demo
// aligned with the evidence-gate discipline that is the product's actual
// differentiator — never a false green.
//
// THIS FILE DOES NOT TOUCH THE DATABASE.
// Loading these onto the live board is a coordinated operator step (an ACA
// data-build job on the Meridian tenant, which another workstream is actively
// advancing) — never a solo mutation. See README-meridian-clean-demo-moves.md.

export type DemoEntryPhase = 0 | 1 | 2; // P0 Originate · P1 Charter · P2 Discover

export interface DemoSponsor {
  /** Synthetic but plausible name for the demo cast. */
  name: string;
  /** Role from the candidate's stakeholder_roles. */
  role: string;
  email: string;
}

/** The six P1 charter inputs, in plain client language. */
export interface DemoCharter {
  sponsorAndProgressPreference: string;
  scopeBoundary: string;
  successCriteria: string;
  stakeholderMap: string;
  decisionRights: string;
  evidencePlan: string;
}

export interface DemoMove {
  /** Stable candidate id for idempotent upsert (from moves-context-view.json). */
  initiativeLink: string;
  /** Client-facing display code (human reference, not a raw tenant slug). */
  displayCode: string;
  name: string;
  /** One-line decision framing for the move. */
  thesis: string;
  entryPhase: DemoEntryPhase;
  sponsor: DemoSponsor;
  /** Honest value stance — never a fabricated funded figure. */
  valueStance: string;
  systems: readonly string[];
  dataDomains: readonly string[];
  /** Open evidence the move must close before it can advance (honest). */
  openEvidence: readonly string[];
  /** Full P1 charter content; present for moves at Charter or beyond. */
  charter?: DemoCharter;
  /** Every demo object is labelled synthetic. */
  synthetic: true;
}

// A small, consistent synthetic executive cast for the demo tenant.
const CXO = {
  experience: {
    name: "Dana Whitfield",
    role: "Chief Experience Officer",
    email: "dana.whitfield@meridianhealth.demo",
  },
  cfo: {
    name: "Marcus Elliott",
    role: "Chief Financial Officer",
    email: "marcus.elliott@meridianhealth.demo",
  },
  cdao: {
    name: "Priya Nair",
    role: "Chief Data & Analytics Officer",
    email: "priya.nair@meridianhealth.demo",
  },
  siu: {
    name: "Teresa Boyd",
    role: "VP, Payment Integrity",
    email: "teresa.boyd@meridianhealth.demo",
  },
} as const;

export const CLEAN_DEMO_MOVES: readonly DemoMove[] = [
  {
    initiativeLink: "MER-MOVE-002",
    displayCode: "MER-2026-GOV-DATA",
    name: "Governed data foundation for AI / LLM automation",
    thesis:
      "A governed semantic layer and data-quality controls so later AI use cases reuse the same trusted entities instead of rebuilding them.",
    entryPhase: 1,
    sponsor: CXO.cdao,
    valueStance:
      "Foundation enabler — value is realized through the use cases it unblocks; to be validated in the business case.",
    systems: ["Epic Clarity", "Databricks on AWS", "SAS analytics estate", "SQL Server reporting marts"],
    dataDomains: ["semantic layer", "coding", "prior authorization", "utilization management", "data quality rules"],
    openEvidence: [
      "No formal data governance in place",
      "No certified semantic layer",
      "No AI audit trail evidence",
      "Data-quality rules not yet loaded",
    ],
    charter: {
      sponsorAndProgressPreference:
        "Sponsored by the Chief Data & Analytics Officer, who owns scope, outcomes, and the phase-gate decisions. Progress is reviewed in the monthly Data & AI steering forum.",
      scopeBoundary:
        "In scope: a governed semantic layer over Epic Clarity and the claims marts on Databricks, plus data-quality and AI audit-trail controls. Out of scope: net-new clinical source systems and model development for specific use cases (those are separate moves that consume this foundation).",
      successCriteria:
        "A certified semantic layer for the priority domains, data-quality rules running on every load, and an auditable trail for AI access — enough that the next use case can reuse governed entities rather than rebuild them.",
      stakeholderMap:
        "CDAO (owner), Enterprise Architecture, CISO and Privacy (controls), Application Owners for Clarity and the claims marts, and Procurement for the platform agreements.",
      decisionRights:
        "The CDAO approves the semantic model and governance standard; the CISO and Privacy approve the control design; Enterprise Architecture approves the platform pattern.",
      evidencePlan:
        "Close the four open items before Discover sign-off: stand up the governance operating model, certify the semantic layer for the first domains, produce AI audit-trail evidence, and load the data-quality rule set.",
    },
    synthetic: true,
  },
  {
    initiativeLink: "MER-MOVE-003",
    displayCode: "MER-2026-CALLCTR",
    name: "Call center optimization",
    thesis:
      "Give member-service agents governed next-best-action and real-time claims status so calls resolve on first contact.",
    entryPhase: 2,
    sponsor: CXO.experience,
    valueStance:
      "Expected to reduce handle time and repeat contacts; baseline required before a value range is set — to be validated in the business case.",
    systems: [
      "Contact center transcript and telephony platform",
      "CRM / member case management",
      "Claims administration platform",
      "Power BI reporting estate",
    ],
    dataDomains: ["claims status", "next-best-action content", "CRM cases", "intent taxonomy", "transcripts"],
    openEvidence: [
      "Transcript governance not loaded",
      "Real-time integration not proven",
      "Intent taxonomy not certified",
      "Member identity linkage not proven",
    ],
    charter: {
      sponsorAndProgressPreference:
        "Sponsored by the Chief Experience Officer, accountable for member-service outcomes and the phase-gate decisions. Weekly progress to the Member Experience operations review.",
      scopeBoundary:
        "In scope: governed next-best-action content and real-time claims-status lookup inside the agent desktop for the member-services queue. Out of scope: self-service member channels and any change to the underlying claims platform.",
      successCriteria:
        "Agents see a trusted claims status and a reviewable next-best-action on the calls in scope; first-contact resolution and handle time improve against a loaded baseline.",
      stakeholderMap:
        "Chief Experience Officer (owner), Contact Center operations, Health Plan Operations, Privacy (member data), Enterprise Architecture and Application Owners for the CRM and claims integration.",
      decisionRights:
        "The Chief Experience Officer approves scope and the go/hold at each gate; Privacy approves member-data handling; Enterprise Architecture approves the integration pattern.",
      evidencePlan:
        "Before Discover closes: load transcript governance, prove the real-time claims integration, certify the intent taxonomy, and prove member identity linkage. Capture the first-contact-resolution and handle-time baseline.",
    },
    synthetic: true,
  },
  {
    initiativeLink: "MER-MOVE-006",
    displayCode: "MER-2026-PAYINT",
    name: "Payment integrity and leakage reduction",
    thesis:
      "Govern the rules and models behind claims-anomaly detection so recoveries are provable and defensible, not a black box.",
    entryPhase: 1,
    sponsor: CXO.siu,
    valueStance:
      "Expected recovery uplift from governed anomaly detection; recovery realization not yet tracked — value to be validated in the business case.",
    systems: [
      "SAS analytics estate",
      "Claims administration platform",
      "Provider contract repository",
      "SQL Server reporting marts",
    ],
    dataDomains: ["claims anomalies", "recovery workflow", "fraud waste abuse", "provider entity resolution", "billing patterns"],
    openEvidence: [
      "Rules and model lineage not governed",
      "Provider entity resolution not proven",
      "Investigation workflow evidence not loaded",
      "Recovery realization tracking not loaded",
    ],
    charter: {
      sponsorAndProgressPreference:
        "Sponsored by the VP of Payment Integrity, with the CFO as executive escalation. The phase-gate decisions sit with the sponsor; progress is reviewed in the finance operations forum.",
      scopeBoundary:
        "In scope: governed rules and model lineage for claims-anomaly detection, provider entity resolution, and a tracked investigation-to-recovery workflow. Out of scope: contract renegotiation and provider-facing disputes.",
      successCriteria:
        "Every flagged anomaly traces to a governed rule or model with lineage; investigators work a single queue; recoveries are tracked end to end against a loaded baseline.",
      stakeholderMap:
        "VP Payment Integrity (owner), CFO (escalation), the SIU / investigations team, Provider Data Management, CISO and Privacy, and Application Owners for the SAS estate and claims platform.",
      decisionRights:
        "The VP Payment Integrity approves the rule-governance standard and the gates; the CFO approves the value case; CISO and Privacy approve data handling.",
      evidencePlan:
        "Before Discover closes: govern rule and model lineage, prove provider entity resolution, load the investigation-workflow evidence, and stand up recovery-realization tracking.",
    },
    synthetic: true,
  },
  {
    initiativeLink: "MER-MOVE-005",
    displayCode: "MER-2026-COST-TRANSP",
    name: "End-to-end cost transparency",
    thesis:
      "A certified margin and cost-of-care view that aligns claims, GL, and provider contracts so leaders see true cost, not a reconciliation guess.",
    entryPhase: 0,
    sponsor: CXO.cfo,
    valueStance:
      "Decision-support enabler; no funded value asserted at Originate — the value case is built once the baseline and semantic model exist.",
    systems: [
      "Claims administration platform",
      "General ledger and close reporting",
      "Provider contract repository",
      "SQL Server reporting marts",
    ],
    dataDomains: ["cost-of-care", "margin", "GL", "provider contracts", "capitation", "claims"],
    openEvidence: [
      "Provider contract terms not digitized in governed form",
      "Claims and GL calendar alignment not proven",
      "Cost allocation rules not loaded",
      "Margin semantic model not certified",
    ],
    synthetic: true,
  },
  {
    initiativeLink: "MER-MOVE-AI-ASSIST",
    displayCode: "MER-2026-AGENT-ASSIST",
    name: "Member Service Agent Assist Transformation",
    thesis:
      "An AI assist layer across Genesys, Salesforce, and ServiceNow that drafts member responses and surfaces case context — reviewable, with PHI controls.",
    entryPhase: 2,
    sponsor: CXO.experience,
    valueStance:
      "Candidate, not funded — approved business case, baseline, and PHI controls are required before any value is claimed.",
    systems: ["Genesys", "Salesforce", "ServiceNow"],
    dataDomains: ["member service data"],
    openEvidence: ["Approved business case, baseline, and PHI controls required"],
    charter: {
      sponsorAndProgressPreference:
        "Sponsored by the Chief Experience Officer. Because this move handles member PHI, the phase-gate decisions include a privacy sign-off; progress is reviewed with the Member Experience and Privacy leads.",
      scopeBoundary:
        "In scope: an AI assist layer across Genesys, Salesforce, and ServiceNow that drafts member responses and surfaces case context for agents, with every suggestion reviewable before it is sent. Out of scope: autonomous member-facing responses and any PHI use without an approved control.",
      successCriteria:
        "Agents get reviewable draft responses and case context on in-scope member interactions, under approved PHI controls, improving quality and handle time against a loaded baseline.",
      stakeholderMap:
        "Chief Experience Officer (owner), Privacy and the Privacy Officer (PHI controls), Contact Center operations, and Application Owners for Genesys, Salesforce, and ServiceNow.",
      decisionRights:
        "The Chief Experience Officer approves scope and the gates; the Privacy Officer holds a required sign-off on PHI handling before the move can advance.",
      evidencePlan:
        "Before advancing: produce an approved business case, load the service baseline, and get PHI controls approved. Until those exist, the move stays in shaping — it is not funded.",
    },
    synthetic: true,
  },
];

export const CLEAN_DEMO_TENANT_KEY = "meridian-health";
