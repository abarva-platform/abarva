import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

const ARTIFACT_SOURCE_BASIS = {
  type: "abarva-observed" as const,
  label: "AbarVa Source artifact quality doctrine",
  note: "Artifact templates define required content and evidence gates; they do not create tenant facts or savings claims.",
};

const ARTIFACTS: Array<{
  id: string;
  slug: string;
  title: string;
  stage: string;
  thesis: string;
  evidence: string[];
  riskId: string;
  riskLabel: string;
  category: NonNullable<PatternSeed["category"]>;
}> = [
  {
    id: "STRATEGY-MEMO",
    slug: "strategy-memo-quality-gate",
    title: "Sourcing Strategy Memo Quality Gate",
    stage: "strategy",
    thesis:
      "A sourcing strategy memo is decision-grade only when trigger, scope, value thesis, sourcing archetype, risks, approvals, and evidence gaps are explicit.",
    evidence: [
      "trigger",
      "scope boundary",
      "value target",
      "archetype decision",
      "sponsor approval",
    ],
    riskId: "risk-strategy-memo-generic",
    riskLabel: "Strategy memo is generic",
    category: "process_methodology",
  },
  {
    id: "VALUE-TARGET",
    slug: "value-target-brief-quality-gate",
    title: "Value Target Brief Quality Gate",
    stage: "strategy",
    thesis:
      "A value target brief should separate exposure, target range, confidence, value owner, evidence basis, and conditions that would invalidate the target.",
    evidence: [
      "baseline source",
      "target owner",
      "confidence band",
      "finance input",
      "evidence gaps",
    ],
    riskId: "risk-value-target-unsupported",
    riskLabel: "Value target is unsupported",
    category: "pricing_intelligence",
  },
  {
    id: "APPLICATION-INVENTORY",
    slug: "application-inventory-tiering-quality-gate",
    title: "Application Inventory and Tiering Quality Gate",
    stage: "scope",
    thesis:
      "Application inventories must show criticality, complexity, integrations, support ownership, incident history, and scope disposition before AMS pricing can be normalized.",
    evidence: [
      "application list",
      "tiering",
      "integration map",
      "incident history",
      "ownership",
    ],
    riskId: "risk-inventory-not-tiered",
    riskLabel: "Inventory lacks sourcing tiers",
    category: "services",
  },
  {
    id: "SCOPE-MEMO",
    slug: "scope-memo-quality-gate",
    title: "Scope Memo Quality Gate",
    stage: "scope",
    thesis:
      "A scope memo should make included services, excluded services, retained roles, vendor responsibilities, and unresolved assumptions visible before RFP release.",
    evidence: [
      "included scope",
      "excluded scope",
      "retained role matrix",
      "assumption log",
    ],
    riskId: "risk-scope-memo-ambiguous",
    riskLabel: "Scope memo is ambiguous",
    category: "process_methodology",
  },
  {
    id: "EXCLUSION-LOG",
    slug: "exclusion-log-quality-gate",
    title: "Exclusion Log Quality Gate",
    stage: "scope",
    thesis:
      "An exclusion log prevents price and value distortion by recording what is out of scope, why, who owns it, and how it affects comparison.",
    evidence: [
      "excluded work",
      "owner",
      "reason",
      "commercial impact",
      "approval",
    ],
    riskId: "risk-exclusions-hidden",
    riskLabel: "Exclusions hidden from pricing",
    category: "pricing_intelligence",
  },
  {
    id: "RFP-PACKAGE",
    slug: "rfp-package-quality-gate",
    title: "RFP Package Quality Gate",
    stage: "rfp",
    thesis:
      "An RFP package should include evaluation criteria, response instructions, pricing template, evidence requirements, communication rules, and timeline.",
    evidence: [
      "RFP instructions",
      "scorecard",
      "pricing template",
      "Q&A protocol",
      "timeline",
    ],
    riskId: "risk-rfp-package-incomplete",
    riskLabel: "RFP package incomplete",
    category: "process_methodology",
  },
  {
    id: "RESPONSE-CHECKLIST",
    slug: "response-checklist-quality-gate",
    title: "Response Checklist Quality Gate",
    stage: "rfp",
    thesis:
      "A response checklist turns required answers, attachments, exceptions, pricing schedules, and evidence into a pre-score completeness gate.",
    evidence: [
      "required questions",
      "attachment list",
      "pricing schedule",
      "exception register",
    ],
    riskId: "risk-response-checklist-missing",
    riskLabel: "Response checklist missing",
    category: "process_methodology",
  },
  {
    id: "VENDOR-SHORTLIST",
    slug: "vendor-shortlist-quality-gate",
    title: "Vendor Shortlist Quality Gate",
    stage: "rfp",
    thesis:
      "A vendor shortlist should explain invite rationale, eligibility, known constraints, conflicts, and evidence source for each invited supplier.",
    evidence: [
      "shortlist rationale",
      "eligibility criteria",
      "conflict checks",
      "market scan",
    ],
    riskId: "risk-shortlist-unexplained",
    riskLabel: "Shortlist unexplained",
    category: "process_methodology",
  },
  {
    id: "VENDOR-RESPONSE-PACK",
    slug: "vendor-response-pack-quality-gate",
    title: "Vendor Response Pack Quality Gate",
    stage: "responses",
    thesis:
      "A vendor response pack is usable only when responses, attachments, pricing, exceptions, clarifications, and source timestamps are tied to each vendor.",
    evidence: [
      "vendor response",
      "attachments",
      "pricing",
      "exceptions",
      "submission timestamp",
    ],
    riskId: "risk-response-pack-fragmented",
    riskLabel: "Response pack fragmented",
    category: "process_methodology",
  },
  {
    id: "QA-LOG",
    slug: "qa-log-quality-gate",
    title: "Q&A Log Quality Gate",
    stage: "responses",
    thesis:
      "A Q&A log protects fairness by recording vendor questions, buyer answers, distribution, deadlines, and whether an answer changes scope or pricing.",
    evidence: [
      "questions",
      "answers",
      "distribution list",
      "deadline",
      "scope impact",
    ],
    riskId: "risk-qa-log-uncontrolled",
    riskLabel: "Q&A log uncontrolled",
    category: "process_methodology",
  },
  {
    id: "COMPLETENESS-MATRIX",
    slug: "completeness-matrix-quality-gate",
    title: "Completeness Matrix Quality Gate",
    stage: "responses",
    thesis:
      "A completeness matrix should classify missing, non-compliant, unsupported, clarification-eligible, and accepted response items before scoring.",
    evidence: [
      "response checklist",
      "missing items",
      "clarifications",
      "disposition",
    ],
    riskId: "risk-completeness-not-gated",
    riskLabel: "Completeness not gated",
    category: "process_methodology",
  },
  {
    id: "EVALUATION-SCORECARD",
    slug: "evaluation-scorecard-quality-gate",
    title: "Evaluation Scorecard Quality Gate",
    stage: "evaluation",
    thesis:
      "An evaluation scorecard is decision-grade only when criteria, weights, evidence citations, evaluator notes, consensus rationale, and dissent are visible.",
    evidence: [
      "criteria",
      "weights",
      "evaluator scores",
      "evidence citations",
      "consensus rationale",
    ],
    riskId: "risk-scorecard-unsourced",
    riskLabel: "Scorecard unsourced",
    category: "process_methodology",
  },
  {
    id: "WEIGHT-LOG",
    slug: "weight-governance-log-quality-gate",
    title: "Weight Governance Log Quality Gate",
    stage: "evaluation",
    thesis:
      "A weight governance log should record approved weights, rationale, approver, timestamp, and any rescoring decision when weights change.",
    evidence: [
      "weight set",
      "approval",
      "rationale",
      "timestamp",
      "change log",
    ],
    riskId: "risk-weight-log-missing",
    riskLabel: "Weight log missing",
    category: "process_methodology",
  },
  {
    id: "PRICING-WORKBOOK",
    slug: "pricing-normalization-workbook-quality-gate",
    title: "Pricing Normalization Workbook Quality Gate",
    stage: "pricing",
    thesis:
      "A pricing normalization workbook must expose baseline, vendor bids, scope adjustments, transition costs, assumptions, exclusions, pass-throughs, and sensitivity.",
    evidence: [
      "baseline",
      "vendor bid",
      "scope adjustments",
      "transition cost",
      "assumptions",
    ],
    riskId: "risk-pricing-workbook-empty",
    riskLabel: "Pricing workbook empty",
    category: "pricing_intelligence",
  },
  {
    id: "PRICING-TRAP-LOG",
    slug: "pricing-trap-log-quality-gate",
    title: "Pricing Trap Log Quality Gate",
    stage: "pricing",
    thesis:
      "A pricing trap log should capture buried costs, volume traps, exclusions, indexation, pass-throughs, transition shifts, and unresolved commercial risk.",
    evidence: [
      "pricing workbook",
      "assumptions",
      "exceptions",
      "contract terms",
      "trap disposition",
    ],
    riskId: "risk-pricing-traps-unlogged",
    riskLabel: "Pricing traps unlogged",
    category: "pricing_intelligence",
  },
  {
    id: "TCO-SUMMARY",
    slug: "tco-summary-quality-gate",
    title: "TCO Summary Quality Gate",
    stage: "pricing",
    thesis:
      "A TCO summary should show normalized total cost, transition-inclusive cost, retained cost, risk adjustments, and the evidence basis for each adjustment.",
    evidence: [
      "normalized bid",
      "transition cost",
      "retained cost",
      "risk adjustment",
      "evidence citations",
    ],
    riskId: "risk-tco-summary-not-reproducible",
    riskLabel: "TCO summary not reproducible",
    category: "pricing_intelligence",
  },
  {
    id: "BAFO-QUESTION-PACK",
    slug: "bafo-question-pack-quality-gate",
    title: "BAFO Question Pack Quality Gate",
    stage: "bafo",
    thesis:
      "A BAFO question pack should target open traps, value uplift, contract protections, scope clarity, and vendor-specific evidence gaps.",
    evidence: [
      "pricing trap log",
      "scorecard gaps",
      "contract exceptions",
      "vendor response",
    ],
    riskId: "risk-bafo-questions-generic",
    riskLabel: "BAFO questions generic",
    category: "pricing_intelligence",
  },
  {
    id: "BAFO-ROUND-LOG",
    slug: "bafo-round-log-quality-gate",
    title: "BAFO Round Log Quality Gate",
    stage: "bafo",
    thesis:
      "A BAFO round log should record asks, vendor responses, deltas, unresolved issues, decision impact, and whether changes reached contract language.",
    evidence: [
      "BAFO asks",
      "vendor response",
      "delta bridge",
      "negotiation notes",
      "contract disposition",
    ],
    riskId: "risk-bafo-round-unattributed",
    riskLabel: "BAFO round unattributed",
    category: "pricing_intelligence",
  },
  {
    id: "DECISION-BRIEF",
    slug: "executive-decision-brief-quality-gate",
    title: "Executive Decision Brief Quality Gate",
    stage: "executive_decision",
    thesis:
      "An executive decision brief should connect recommendation, tradeoffs, value proof, residual risk, approval owner, and evidence gaps without overstating AI conclusions.",
    evidence: [
      "recommendation",
      "scorecard",
      "TCO",
      "risk register",
      "approval reason",
    ],
    riskId: "risk-decision-brief-overclaims",
    riskLabel: "Decision brief overclaims",
    category: "process_methodology",
  },
  {
    id: "RISK-ATTESTATION",
    slug: "risk-attestation-quality-gate",
    title: "Risk Attestation Quality Gate",
    stage: "executive_decision",
    thesis:
      "A risk attestation should name residual risk, mitigation, accountable owner, acceptance reason, and evidence source before award approval.",
    evidence: [
      "risk register",
      "mitigation plan",
      "owner",
      "acceptance reason",
      "approval log",
    ],
    riskId: "risk-attestation-missing-owner",
    riskLabel: "Risk attestation missing owner",
    category: "risk",
  },
  {
    id: "STEWARD-SIGNOFF",
    slug: "steward-signoff-quality-gate",
    title: "Steward Sign-Off Quality Gate",
    stage: "executive_decision",
    thesis:
      "Steward sign-off should capture named approver, role, timestamp, reason, self-approval status, and evidence reviewed.",
    evidence: ["approver", "role", "timestamp", "reason", "evidence reviewed"],
    riskId: "risk-signoff-unauditable",
    riskLabel: "Sign-off unauditable",
    category: "process_methodology",
  },
  {
    id: "SELECTION-MEMO",
    slug: "selection-memo-quality-gate",
    title: "Selection Memo Quality Gate",
    stage: "selection",
    thesis:
      "A selection memo should document award rationale, unsuccessful-vendor rationale, contract dependencies, communications plan, and approval evidence.",
    evidence: [
      "award rationale",
      "vendor notices",
      "contract dependencies",
      "approval log",
    ],
    riskId: "risk-selection-memo-thin",
    riskLabel: "Selection memo thin",
    category: "process_methodology",
  },
  {
    id: "TRANSITION-PLAN",
    slug: "transition-plan-quality-gate",
    title: "Transition Plan Quality Gate",
    stage: "transition",
    thesis:
      "A transition plan should link milestones, acceptance criteria, knowledge transfer, access, tooling, stabilization, and risk controls.",
    evidence: [
      "transition milestones",
      "acceptance criteria",
      "knowledge transfer",
      "access plan",
      "stabilization",
    ],
    riskId: "risk-transition-plan-unaccepted",
    riskLabel: "Transition plan lacks acceptance",
    category: "services",
  },
  {
    id: "CHECKPOINT-LOG",
    slug: "checkpoint-log-quality-gate",
    title: "Checkpoint Log Quality Gate",
    stage: "transition",
    thesis:
      "A checkpoint log should show milestone status, blocker, owner, decision, evidence, and escalation path through transition and value realization.",
    evidence: ["milestone", "blocker", "owner", "decision", "evidence"],
    riskId: "risk-checkpoint-log-missing",
    riskLabel: "Checkpoint log missing",
    category: "process_methodology",
  },
  {
    id: "VALUE-LEDGER",
    slug: "value-ledger-quality-gate",
    title: "Value Ledger Quality Gate",
    stage: "value",
    thesis:
      "A value ledger must separate target, negotiated, contracted, and realized value with evidence and accountable human attestation at each state.",
    evidence: [
      "baseline",
      "BAFO delta",
      "contract",
      "invoice",
      "finance attestation",
    ],
    riskId: "risk-value-ledger-unsupported",
    riskLabel: "Value ledger unsupported",
    category: "pricing_intelligence",
  },
  {
    id: "DEAL-PACK",
    slug: "deal-pack-export-readiness-quality-gate",
    title: "Deal Pack Export Readiness Quality Gate",
    stage: "value",
    thesis:
      "A deal pack export is ready only when artifacts, evidence citations, AI labels, caveats, approvals, and downloadable formats preserve the Source record.",
    evidence: [
      "artifact registry",
      "evidence bundle",
      "AI labels",
      "approval log",
      "export verification",
    ],
    riskId: "risk-deal-pack-caveat-loss",
    riskLabel: "Deal pack loses caveats",
    category: "process_methodology",
  },
];

export const SOURCING_ARTIFACT_TEMPLATE_PATTERNS: PatternSeed[] = ARTIFACTS.map(
  (artifact) => ({
    id: `PAT-SRC-ART-${artifact.id}`,
    slug: artifact.slug,
    title: artifact.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: artifact.thesis,
    applicability: `Apply at Source stage ${artifact.stage} when evaluating whether the artifact is ready to support gate completion, approval, export, or executive review.`,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.82,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-CGV-SAVINGS-CLAIM-GATE"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: artifact.category,
    vendorClass: "service",
    pricingBenchmarks: [
      {
        label: `${artifact.title}: artifact evidence gate`,
        model: "unknown",
        sourceBasis: [ARTIFACT_SOURCE_BASIS],
        confidence: 0.5,
        notes:
          "This pattern defines artifact quality and evidence requirements, not numeric pricing or savings guidance.",
      },
    ],
    riskFactors: [
      {
        id: artifact.riskId,
        label: artifact.riskLabel,
        severity: "high",
        detectionSignals: [
          "Artifact is marked complete without required evidence.",
          "Artifact supports a gate or executive claim but lacks cited source basis.",
        ],
        mitigations: [
          "Keep the artifact in draft or not-ready state.",
          `Require evidence: ${artifact.evidence.join(", ")}.`,
        ],
      },
    ],
    standardClauses:
      artifact.category === "contract_intelligence"
        ? [
            {
              clauseArea: artifact.title,
              buyerPosition:
                "Artifact must preserve buyer evidence requirements and approval caveats before contract or award reliance.",
              fallbackPosition:
                "If evidence is incomplete, mark the artifact as draft and exclude it from gate evidence.",
              sourceBasis: [ARTIFACT_SOURCE_BASIS],
            },
          ]
        : undefined,
    body: `## Summary
${artifact.thesis}

## Evidence required
${artifact.evidence.join(", ")}.

## CXO language
"This artifact can support the Source decision only after its evidence and approval record are attached."`,
  }),
);
