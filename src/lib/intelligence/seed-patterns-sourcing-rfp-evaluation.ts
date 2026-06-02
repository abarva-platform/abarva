import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/build/SOURCE_BUILD_SPEC.md",
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

type PatternInput = {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  category: NonNullable<PatternSeed["category"]>;
  body: string;
  confidence?: number;
  vendorClass?: NonNullable<PatternSeed["vendorClass"]>;
  relatedPatternIds?: string[];
  riskFactors?: PatternSeed["riskFactors"];
  negotiationLevers?: PatternSeed["negotiationLevers"];
  standardClauses?: PatternSeed["standardClauses"];
  industryVariants?: PatternSeed["industryVariants"];
};

function pattern(input: PatternInput): PatternSeed {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: input.thesis,
    applicability: input.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: input.confidence ?? 0.81,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: input.relatedPatternIds ?? [
      "PAT-SRC-002",
      "PAT-SRC-PROC-005",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: input.category,
    vendorClass: input.vendorClass ?? "service",
    riskFactors: input.riskFactors,
    negotiationLevers: input.negotiationLevers,
    standardClauses: input.standardClauses,
    industryVariants: input.industryVariants,
    body: input.body,
  };
}

const RETAIL_CPG_EVALUATION_VARIANT = {
  industry: "retail_cpg" as const,
  modifier:
    "Retail and CPG evaluation should test peak trading calendars, store execution, promotion dependency, inventory signal quality, payment exposure, and omnichannel exception handling where those facts are in scope.",
};

export const SOURCING_RFP_EVALUATION_PATTERNS: PatternSeed[] = [
  pattern({
    id: "PAT-SRC-RFP-EVAL-001",
    slug: "ams-scope-criteria-architecture",
    title: "AMS Scope Criteria Architecture",
    category: "services",
    thesis:
      "AMS RFP scope is evaluable only when application inventory, support tiers, ownership boundaries, tooling, and retained-buyer responsibilities are separated into scored criteria.",
    applicability:
      "Apply to application managed services events where vendors must price, staff, transition, and operate mixed application portfolios.",
    riskFactors: [
      {
        id: "risk-ams-scope-blend",
        label: "Blended AMS scope hides delivery responsibility",
        severity: "high",
        detectionSignals: [
          "RFP asks for AMS coverage without application-by-application scope facts.",
          "Proposal treats retained buyer tasks, incumbent tasks, and vendor tasks as a single operating bucket.",
        ],
        mitigations: [
          "Require an application scope matrix before scoring.",
          "Score vendor assumptions separately from capability claims.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Scope and responsibility matrix",
        buyerPosition:
          "Vendor responsibilities, buyer-retained responsibilities, incumbent dependencies, and excluded activities must be listed by application or service tower before award.",
        fallbackPosition:
          "Permit grouped scope only where the buyer has accepted the grouping and documented the operational risk.",
        walkawayTriggers: [
          "Vendor refuses a responsibility matrix.",
          "Critical applications are priced without support assumptions.",
        ],
      },
    ],
    body: `## Summary
AMS RFP scope should not be evaluated as a prose description of support. It should be decomposed into applications, service towers, environments, tooling, interfaces, operating hours, ownership boundaries, and retained-buyer duties.

## Evaluation use
Use the pattern to convert scope facts into scorecard rows. Vendors should be scored on their fit for the stated operating model and on the quality of the assumptions they expose, not on broad claims of AMS maturity.

## Evidence required
Application inventory, service catalog, responsibility matrix, support tier definitions, tooling assumptions, and explicit exclusions.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-002",
    slug: "ams-application-inventory-evidence-gate",
    title: "AMS Application Inventory Evidence Gate",
    category: "process_methodology",
    thesis:
      "AMS evaluation should gate incomplete application inventories before vendor scoring so teams do not compare proposals against different assumed portfolios.",
    applicability:
      "Apply when application counts, criticality, technology stack, integrations, support history, or ownership are incomplete at RFP release.",
    riskFactors: [
      {
        id: "risk-ams-inventory-missing",
        label: "Incomplete application inventory distorts comparison",
        severity: "high",
        detectionSignals: [
          "Vendors submit different assumptions about application count or complexity.",
          "Criticality, integration, or support-history fields are left blank.",
        ],
        mitigations: [
          "Create a pre-score completeness gate.",
          "Require vendors to price assumptions and unresolved scope gaps separately.",
        ],
      },
    ],
    body: `## Summary
An AMS event can look competitive while vendors are actually pricing different portfolios. The inventory gate makes the buyer's application facts visible before scoring begins.

## Evaluation use
Require the evaluation team to classify each inventory gap as buyer-provided, vendor-assumed, out of scope, or unresolved. Unresolved gaps should be carried into commercial normalization and negotiation rather than hidden inside total price.

## Evidence required
Application inventory, criticality labels, integration map, support ownership, known technical debt, incident context, and vendor assumption register.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-003",
    slug: "service-level-criteria-taxonomy",
    title: "Service-Level Criteria Taxonomy",
    category: "process_methodology",
    thesis:
      "Service-level evaluation is defensible when availability, incident response, resolution, request handling, reporting, exclusions, and remedies are scored as separate criteria.",
    applicability:
      "Apply to managed services, infrastructure, SaaS operations, BPO, contact center, and other events where service commitments drive operating risk.",
    riskFactors: [
      {
        id: "risk-sla-taxonomy-flat",
        label: "Flat SLA scoring masks operational risk",
        severity: "medium",
        detectionSignals: [
          "Scorecard has a single service-level row.",
          "Proposal defines measurements but omits exclusions, remedies, or reporting cadence.",
        ],
        mitigations: [
          "Split SLA scoring into measurement, remedy, governance, and reporting criteria.",
          "Require vendors to identify service-level assumptions and exclusions.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "SLA definition for remedy strength",
        whenToUse:
          "Use when vendors offer attractive commercials but weak service-level commitments.",
        buyerAsk:
          "Clarify measurement windows, severity definitions, reporting, exclusions, and remedies before award.",
        vendorGive: "Clearer operating model and reduced dispute risk.",
      },
    ],
    body: `## Summary
Service-level criteria need a taxonomy. A vendor can look strong on availability while remaining vague on incident severity, request queues, root-cause discipline, and remedy mechanics.

## Evaluation use
Score each service-level dimension independently, then document how the dimensions affect the award recommendation. Do not collapse a strong reporting promise into proof of operational performance.

## Evidence required
SLA table, severity model, measurement method, exclusions, governance cadence, service-credit logic, and sample reporting format.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-004",
    slug: "major-incident-and-escalation-criteria",
    title: "Major Incident and Escalation Criteria",
    category: "risk",
    thesis:
      "Major-incident capability should be evaluated through scenario evidence, escalation authority, communications discipline, and restoration accountability rather than generic support language.",
    applicability:
      "Apply where vendor operations touch customer-facing, financial, security, store, plant, or other business-critical systems.",
    riskFactors: [
      {
        id: "risk-major-incident-vague",
        label: "Major incident process is generic",
        severity: "critical",
        detectionSignals: [
          "Proposal names an incident process but no decision rights.",
          "Vendor cannot show how communications, restoration, and root cause are governed.",
        ],
        mitigations: [
          "Run a major-incident demo script.",
          "Require named escalation roles, communication templates, and restoration evidence.",
        ],
      },
    ],
    industryVariants: [RETAIL_CPG_EVALUATION_VARIANT],
    body: `## Summary
Major incident response is an operating behavior, not a slide. Evaluation should test who declares the incident, who can mobilize resources, how business owners are informed, and how restoration is proven.

## Evaluation use
Use a scenario that matches the buyer's actual risk profile. Score vendors on decision clarity, business communication, technical triage, restoration evidence, and post-incident remediation.

## Evidence required
Incident workflow, escalation roster, communications examples, root-cause method, service restoration proof, and governance handoff.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-005",
    slug: "transition-criteria-traceability",
    title: "Transition Criteria Traceability",
    category: "services",
    thesis:
      "Transition evaluation should trace each proposed activity to knowledge transfer, access readiness, cutover, stabilization, and acceptance evidence.",
    applicability:
      "Apply to supplier switches, AMS transitions, outsourcing events, platform operations handoffs, and incumbent-to-new-provider changes.",
    riskFactors: [
      {
        id: "risk-transition-activity-only",
        label: "Transition plan lists activities without acceptance evidence",
        severity: "high",
        detectionSignals: [
          "Transition plan is milestone-heavy but lacks acceptance criteria.",
          "Knowledge transfer, access, cutover, and stabilization are not linked.",
        ],
        mitigations: [
          "Score transition traceability separately.",
          "Require buyer acceptance evidence before transition fees fully release.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Transition acceptance",
        buyerPosition:
          "Transition deliverables are accepted only when knowledge transfer, access readiness, cutover evidence, and stabilization criteria are complete.",
        fallbackPosition:
          "If acceptance is phased, each phase must have its own evidence and remedy.",
        walkawayTriggers: [
          "No buyer acceptance rights for transition deliverables.",
          "No remedy for failed stabilization.",
        ],
      },
    ],
    body: `## Summary
Transition plans often look credible because they are detailed. The evaluation question is whether the detail proves readiness, not whether it fills a timeline.

## Evaluation use
Score each transition workstream against evidence. Knowledge transfer, access, tooling, staffing, cutover, and stabilization should be traceable to an accepted artifact or operational test.

## Evidence required
Transition workplan, knowledge-transfer plan, access checklist, cutover criteria, staffing ramp, stabilization model, and acceptance rights.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-006",
    slug: "stabilization-hypercare-criteria",
    title: "Stabilization and Hypercare Criteria",
    category: "services",
    thesis:
      "Evaluation should distinguish go-live from stabilization so vendors cannot treat transition completion as proof that the new service is operating safely.",
    applicability:
      "Apply when new vendors, new platforms, store waves, migration events, or operating model changes require a post-cutover support period.",
    riskFactors: [
      {
        id: "risk-hypercare-thin",
        label: "Hypercare is underspecified",
        severity: "medium",
        detectionSignals: [
          "Proposal includes hypercare as a phrase without entry and exit criteria.",
          "Business owner acceptance is not tied to stabilization.",
        ],
        mitigations: [
          "Require stabilization entry and exit criteria.",
          "Score hypercare staffing, defect handling, communication, and handoff separately.",
        ],
      },
    ],
    industryVariants: [RETAIL_CPG_EVALUATION_VARIANT],
    body: `## Summary
Go-live is not the finish line for evaluation. Stabilization asks whether the service is reliable enough for normal governance and whether the business can operate without extraordinary support.

## Evaluation use
Score hypercare commitments on staffing, escalation, issue aging, business communication, defect triage, and exit evidence. Treat weak stabilization as a delivery risk even when the transition plan is otherwise strong.

## Evidence required
Hypercare plan, entry criteria, exit criteria, issue-management workflow, business communication cadence, and acceptance evidence.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-007",
    slug: "automation-opportunity-inventory",
    title: "Automation Opportunity Inventory",
    category: "ai_ml",
    thesis:
      "Automation criteria should require an opportunity inventory with process ownership, dependency, control, and validation evidence before any value claim is scored.",
    applicability:
      "Apply to AMS, service desk, infrastructure, finance operations, contact center, supply chain, and other events where automation is part of the proposal.",
    riskFactors: [
      {
        id: "risk-automation-unproven",
        label: "Automation claims lack process evidence",
        severity: "high",
        detectionSignals: [
          "Vendor claims automation benefit without a mapped process or control owner.",
          "Automation examples are not tied to the buyer's in-scope work.",
        ],
        mitigations: [
          "Require an automation inventory with assumptions.",
          "Score only opportunities with validation path, control owner, and adoption dependency.",
        ],
      },
    ],
    body: `## Summary
Automation should be evaluated as a portfolio of concrete opportunities, not as a generic delivery advantage. Each opportunity needs a process, an owner, dependencies, controls, and a way to validate it.

## Evaluation use
Require vendors to separate already proven automation, configurable automation, custom automation, and future candidates. Score value claims only when the evidence path is explicit.

## Evidence required
Automation inventory, process owner map, data dependency list, control design, adoption assumptions, exception handling, and validation plan.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-008",
    slug: "automation-value-claim-evidence",
    title: "Automation Value Claim Evidence",
    category: "pricing_intelligence",
    thesis:
      "Automation value claims should be evaluated only when the vendor explains the input baseline, adoption dependency, measurement method, and commercial treatment of unproven benefits.",
    applicability:
      "Apply when automation is used to justify pricing, staffing, transformation commitments, or outcome narratives.",
    riskFactors: [
      {
        id: "risk-automation-value-assertion",
        label: "Automation value is asserted without evidence",
        severity: "high",
        detectionSignals: [
          "Proposal references benefit without baseline or measurement method.",
          "Automation benefit is embedded in price without a dependency register.",
        ],
        mitigations: [
          "Require baseline, measurement method, and owner for each claim.",
          "Treat unsupported claims as narrative until validated.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Automation upside for governed commitment",
        whenToUse:
          "Use when a vendor wants credit for future automation that is not yet validated.",
        buyerAsk:
          "Convert the claim into a governed roadmap, measurement method, and commercial treatment if the claim is not achieved.",
        vendorGive:
          "Roadmap clarity, shared measurement discipline, or a contingent pricing mechanism.",
      },
    ],
    body: `## Summary
Automation narratives can outrun evidence. Evaluation should keep value claims separate from proven capability until the baseline, dependency, and measurement method are visible.

## Evaluation use
Score automation value claims only when the vendor identifies what changes, who owns adoption, what data is needed, how impact is measured, and how unachieved value is handled commercially.

## Evidence required
Baseline statement, automation roadmap, adoption owner, measurement method, dependency register, and commercial treatment for unvalidated claims.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-009",
    slug: "pricing-template-role-rate-instructions",
    title: "Pricing Template Role-Rate Instructions",
    category: "pricing_intelligence",
    thesis:
      "Pricing templates produce comparable AMS and services responses when role, location, rate, effort, assumption, and included-service instructions are locked before vendor submission.",
    applicability:
      "Apply to services events with rate cards, staffing pyramids, blended teams, offshore or nearshore delivery, transition effort, or optional services.",
    riskFactors: [
      {
        id: "risk-pricing-template-incomparable",
        label: "Pricing template allows incomparable labor models",
        severity: "high",
        detectionSignals: [
          "Vendors use different role names, location assumptions, or included-service definitions.",
          "Transition, tooling, travel, and optional services are embedded without line-item visibility.",
        ],
        mitigations: [
          "Lock role taxonomy and pricing instructions.",
          "Require assumptions and exclusions in a separate pricing schedule.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Template compliance for commercial comparability",
        whenToUse:
          "Use before BAFO when vendor commercials cannot be compared cleanly.",
        buyerAsk:
          "Resubmit commercials using the buyer template with all deviations and assumptions disclosed.",
        vendorGive:
          "Cleaner commercial comparison and fewer post-award pricing disputes.",
      },
    ],
    body: `## Summary
Pricing templates are part of evaluation design. If vendors define roles, delivery locations, inclusions, and assumptions differently, total price becomes a weak comparison signal.

## Evaluation use
Require a locked pricing template and treat non-compliant pricing as a completeness issue. Keep optional services, transition, tooling, travel, taxes, and pass-through costs visible.

## Evidence required
Buyer pricing template, role taxonomy, delivery location fields, effort assumptions, included-service definitions, optional-service schedule, and deviation register.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-010",
    slug: "pricing-assumption-and-exclusion-register",
    title: "Pricing Assumption and Exclusion Register",
    category: "pricing_intelligence",
    thesis:
      "Every evaluated price should carry an assumption and exclusion register so low bids cannot win by silently moving work, risk, or dependency back to the buyer.",
    applicability:
      "Apply to services, SaaS, infrastructure, implementation, and managed operations events where proposal price depends on unresolved scope facts.",
    riskFactors: [
      {
        id: "risk-hidden-exclusions",
        label: "Low price depends on hidden exclusions",
        severity: "high",
        detectionSignals: [
          "Vendor has the lowest price but a long or vague assumption set.",
          "Exclusions are stated in prose rather than mapped to scope and price.",
        ],
        mitigations: [
          "Normalize price using disclosed assumptions.",
          "Require commercial impact for each material exclusion.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Assumptions and exclusions",
        buyerPosition:
          "Material assumptions and exclusions must be listed in the contract schedule and priced or resolved before award.",
        fallbackPosition:
          "Unresolved assumptions remain vendor risk only if the vendor refuses to price them.",
        walkawayTriggers: [
          "Vendor reserves broad unpriced exclusions.",
          "Proposal price cannot be tied to scope assumptions.",
        ],
      },
    ],
    body: `## Summary
A price is not comparable unless the assumptions behind it are comparable. The register turns hidden commercial risk into visible evaluation evidence.

## Evaluation use
Score vendors on the completeness and reasonableness of assumptions, not only on total price. Use the register to normalize offers and prepare negotiation questions.

## Evidence required
Assumption register, exclusion register, scope mapping, commercial impact, buyer dependency list, and unresolved-issue log.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-011",
    slug: "response-completeness-hard-gate",
    title: "Response Completeness Hard Gate",
    category: "process_methodology",
    thesis:
      "Response completeness should be a hard gate before scoring so missing answers, unsupported assertions, and template deviations do not become hidden evaluator discretion.",
    applicability:
      "Apply to RFPs where multiple evaluators, complex question sets, or regulated procurement discipline require a clean pre-score compliance check.",
    riskFactors: [
      {
        id: "risk-incomplete-response-scored",
        label: "Incomplete response enters scoring",
        severity: "medium",
        detectionSignals: [
          "Evaluators score sections with missing required answers.",
          "Vendor deviations are discovered after consensus scoring.",
        ],
        mitigations: [
          "Run a completeness gate before evaluator scoring.",
          "Classify defects as missing, non-compliant, unsupported, or clarification-eligible.",
        ],
      },
    ],
    body: `## Summary
Completeness is not the same as quality, but it must be settled before quality scoring. A response that skips required evidence should not benefit from evaluator interpretation.

## Evaluation use
Create a pre-score completeness report. Decide whether each defect is disqualifying, clarification-eligible, or scored as unsupported, and record that decision before consensus.

## Evidence required
RFP response matrix, required-question list, attachment checklist, completeness report, clarification log, and gate decision record.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-012",
    slug: "commercial-exception-completeness-gate",
    title: "Commercial Exception Completeness Gate",
    category: "contract_intelligence",
    thesis:
      "Commercial and legal exceptions should be complete before finalist selection so a technically strong vendor does not carry unpriced contract risk into award.",
    applicability:
      "Apply when vendors submit redlines, exceptions, order-form terms, security addenda, data terms, or pricing deviations as part of the RFP.",
    riskFactors: [
      {
        id: "risk-exceptions-late",
        label: "Exceptions surface after technical selection",
        severity: "high",
        detectionSignals: [
          "Commercial exceptions are not reviewed until after preferred vendor selection.",
          "Legal or data terms are marked for later negotiation without risk rating.",
        ],
        mitigations: [
          "Require exception submission with RFP response.",
          "Score exception completeness and risk before finalist recommendation.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Exception disclosure",
        buyerPosition:
          "All material exceptions to buyer terms, security obligations, data protections, pricing instructions, and service commitments must be disclosed with the response.",
        fallbackPosition:
          "Late exceptions may be treated as vendor risk or grounds to reopen evaluation.",
        walkawayTriggers: [
          "Vendor withholds material exceptions.",
          "Exception list prevents a decision-grade recommendation.",
        ],
      },
    ],
    body: `## Summary
Late exceptions create award risk. The evaluation team should know whether the apparent winner can actually contract on terms the buyer can accept.

## Evaluation use
Gate finalist recommendation on a complete exception register. Separate negotiation noise from material risk and connect each material exception to commercial, operational, security, or data impact.

## Evidence required
Redline, exception register, security addendum exceptions, data terms, pricing deviations, risk rating, and contract-owner review.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-013",
    slug: "vendor-demo-script-evidence",
    title: "Vendor Demo Script Evidence",
    category: "process_methodology",
    thesis:
      "Vendor demos should be scripted around buyer scenarios and scored evidence so presentation polish does not substitute for capability proof.",
    applicability:
      "Apply to software, platform, managed service tooling, automation, analytics, security, and workflow events where demos influence evaluator confidence.",
    riskFactors: [
      {
        id: "risk-demo-theater",
        label: "Demo theater replaces evidence",
        severity: "medium",
        detectionSignals: [
          "Vendor controls the demo agenda without buyer scenarios.",
          "Evaluators score impressions instead of observed task evidence.",
        ],
        mitigations: [
          "Use a buyer-authored demo script.",
          "Score observed evidence, exceptions, and follow-up proof separately.",
        ],
      },
    ],
    body: `## Summary
Demos are evaluation events, not sales meetings. The buyer should script scenarios, expected evidence, constraints, and evaluator notes before the vendor presents.

## Evaluation use
Give each vendor the same scenario structure and time discipline. Score observed capability, unsupported claim, workaround, and follow-up evidence in separate fields.

## Evidence required
Demo script, scenario checklist, evaluator notes, observed-evidence log, unanswered-question log, and follow-up artifact packet.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-014",
    slug: "retail-cpg-demo-scenario-normalization",
    title: "Retail-CPG Demo Scenario Normalization",
    category: "industry_overlay",
    thesis:
      "Retail and CPG demos should normalize scenarios across store, digital, promotion, inventory, and exception workflows so vendors are compared against the same operating reality.",
    applicability:
      "Apply to retail or CPG technology, services, data, supply chain, store operations, commerce, or customer-facing sourcing events.",
    industryVariants: [RETAIL_CPG_EVALUATION_VARIANT],
    riskFactors: [
      {
        id: "risk-retail-demo-gap",
        label: "Demo misses retail operating constraints",
        severity: "high",
        detectionSignals: [
          "Demo avoids peak, store, promotion, inventory, or payment exception scenarios.",
          "Vendor shows generic workflow instead of buyer-specific retail context.",
        ],
        mitigations: [
          "Use normalized retail-CPG scenario scripts.",
          "Require exception-state evidence and operational owner mapping.",
        ],
      },
    ],
    body: `## Summary
Retail and CPG demos can look strong while avoiding the hardest operating states. Normalized scenarios keep the evaluation grounded in store, digital, inventory, promotion, and exception behavior.

## Evaluation use
Run each finalist through the same scenarios and score how the solution handles normal flow, exception flow, operational handoff, and reporting. Keep vendor-specific embellishments out of the score unless they answer the scripted evidence request.

## Evidence required
Retail-CPG scenario script, exception catalog, store or field workflow, promotion dependency map, inventory-state evidence, and evaluator notes.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-015",
    slug: "reference-check-evidence-design",
    title: "Reference Check Evidence Design",
    category: "process_methodology",
    thesis:
      "Reference checks become decision evidence when questions are tied to the buyer's risk hypotheses, not when they collect generic satisfaction anecdotes.",
    applicability:
      "Apply before finalist recommendation when delivery, transition, support, implementation, automation, or executive-governance claims need external validation.",
    riskFactors: [
      {
        id: "risk-reference-anecdotal",
        label: "Reference checks are anecdotal",
        severity: "medium",
        detectionSignals: [
          "Reference questions are generic and disconnected from scorecard risks.",
          "Reference feedback is summarized without evidence categories.",
        ],
        mitigations: [
          "Create reference questions from evaluation risk hypotheses.",
          "Record corroborated evidence, cautions, and non-transferable context separately.",
        ],
      },
    ],
    body: `## Summary
References should test what the buyer still needs to believe before award. A positive reference is useful only when the context maps to the buyer's scope, risk, and operating model.

## Evaluation use
Build reference questions from the evaluation risk register. Distinguish corroborated evidence, cautionary signals, and context that does not transfer to the buyer.

## Evidence required
Reference script, risk hypothesis map, reference context, corroboration notes, caution log, and evaluator disposition.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-016",
    slug: "reference-check-confidentiality-and-bias-control",
    title: "Reference Check Confidentiality and Bias Control",
    category: "risk",
    thesis:
      "Reference programs need confidentiality, role relevance, and bias controls so friendly references do not overstate vendor fit or expose sensitive buyer intent.",
    applicability:
      "Apply when vendors nominate references, buyers source independent references, or evaluation teams need to discuss sensitive operating context.",
    riskFactors: [
      {
        id: "risk-reference-bias",
        label: "Reference bias or confidentiality exposure",
        severity: "medium",
        detectionSignals: [
          "Only vendor-selected references are considered.",
          "Reference calls disclose sensitive strategy or incumbent details without controls.",
        ],
        mitigations: [
          "Document source of each reference.",
          "Use confidentiality-safe scripts and role-relevant questions.",
        ],
      },
    ],
    body: `## Summary
References are not neutral by default. Evaluation should record who selected the reference, why the reference is relevant, what can be safely disclosed, and how bias is handled.

## Evaluation use
Classify references as vendor-nominated, buyer-sourced, incumbent-known, or independent. Keep sensitive buyer details out of the script unless disclosure has been approved.

## Evidence required
Reference source label, confidentiality-safe script, role relevance, call notes, bias assessment, and follow-up evidence request.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-017",
    slug: "scorecard-calibration-workshop",
    title: "Scorecard Calibration Workshop",
    category: "process_methodology",
    thesis:
      "Scorecards need evaluator calibration before scoring so criteria, evidence thresholds, and rating language mean the same thing across the panel.",
    applicability:
      "Apply when multiple evaluators, technical and business stakeholders, or cross-functional criteria affect vendor ranking.",
    riskFactors: [
      {
        id: "risk-scorecard-uncalibrated",
        label: "Evaluator scoring is uncalibrated",
        severity: "medium",
        detectionSignals: [
          "Evaluators interpret rating labels differently.",
          "Score variance reflects style rather than evidence disagreement.",
        ],
        mitigations: [
          "Run a calibration workshop before scoring.",
          "Use sample responses to align evidence thresholds.",
        ],
      },
    ],
    body: `## Summary
A scorecard is only as reliable as the shared meaning behind its ratings. Calibration gives evaluators a common standard before real vendor responses are scored.

## Evaluation use
Review criteria, rating language, evidence thresholds, and examples before scoring opens. Record calibration decisions so later consensus discussions can focus on evidence, not vocabulary.

## Evidence required
Calibration agenda, rating guide, sample-response exercise, evidence threshold notes, evaluator attendance, and decision log.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-018",
    slug: "weight-set-governance",
    title: "Weight-Set Governance",
    category: "process_methodology",
    thesis:
      "Evaluation weights should be approved before vendor scoring and changed only through governed rationale so outcomes are not shaped after preferences emerge.",
    applicability:
      "Apply to any RFP where technical, commercial, risk, implementation, service, or strategic criteria are weighted.",
    riskFactors: [
      {
        id: "risk-weight-drift",
        label: "Weights drift after vendor preference emerges",
        severity: "high",
        detectionSignals: [
          "Weights are edited after responses are opened.",
          "Criteria are rebalanced without approval or rationale.",
        ],
        mitigations: [
          "Lock weights before scoring.",
          "Require approval and audit rationale for any change.",
        ],
      },
    ],
    body: `## Summary
Weights encode sourcing strategy. Changing them after scoring begins can make the evaluation look engineered around a preferred outcome.

## Evaluation use
Approve weight sets before vendor responses are scored. If facts require a change, record the reason, approver, affected criteria, and whether already-scored responses must be rescored.

## Evidence required
Approved weight set, evaluation strategy rationale, change log, approver record, and rescoring disposition if weights change.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-019",
    slug: "evaluation-panel-conflict-controls",
    title: "Evaluation Panel Conflict Controls",
    category: "risk",
    thesis:
      "Evaluation panels need conflict, confidentiality, and role controls so scoring authority is not compromised by vendor relationships or unapproved information flow.",
    applicability:
      "Apply when business, technology, procurement, finance, legal, security, or executive participants influence scoring or recommendation.",
    riskFactors: [
      {
        id: "risk-panel-conflict",
        label: "Panel conflict or information leakage",
        severity: "high",
        detectionSignals: [
          "Evaluator has a vendor relationship that is not disclosed.",
          "Supplier communication occurs outside the controlled channel.",
        ],
        mitigations: [
          "Collect conflict attestations.",
          "Route supplier questions through a controlled procurement channel.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Evaluation communications",
        buyerPosition:
          "Vendor communications during the event occur only through the buyer-approved channel unless procurement authorizes an exception.",
        fallbackPosition:
          "Technical clarification sessions may occur with procurement attendance and written minutes.",
        walkawayTriggers: [
          "Vendor seeks side-channel scoring influence.",
          "Material information is provided to one vendor but not governed for others.",
        ],
      },
    ],
    body: `## Summary
Panel controls protect the integrity of the evaluation. The issue is not only actual bias; it is whether the recommendation can be trusted by people outside the room.

## Evaluation use
Collect conflict attestations, define evaluator roles, restrict supplier communication, and record permitted clarification sessions. Recuse or limit participants where conflicts affect scoring.

## Evidence required
Panel roster, conflict attestations, communication rules, supplier Q&A log, recusal decisions, and confidentiality reminders.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-020",
    slug: "consensus-scoring-evidence-discipline",
    title: "Consensus Scoring Evidence Discipline",
    category: "process_methodology",
    thesis:
      "Consensus scoring should reconcile evidence-backed disagreement rather than average individual preferences into a score that no evaluator can explain.",
    applicability:
      "Apply when individual evaluator scores must become a committee score, finalist ranking, or recommendation narrative.",
    riskFactors: [
      {
        id: "risk-consensus-averaging",
        label: "Consensus becomes unexplained averaging",
        severity: "medium",
        detectionSignals: [
          "Consensus score differs from individual scores without rationale.",
          "Discussion notes record preference but not evidence.",
        ],
        mitigations: [
          "Require evidence notes for score movements.",
          "Record unresolved dissent separately from consensus.",
        ],
      },
    ],
    body: `## Summary
Consensus is not the arithmetic removal of disagreement. It is a governed decision about what the evidence supports after evaluators compare their interpretations.

## Evaluation use
For each material score movement, record the evidence that changed the panel view. Keep unresolved dissent visible so the recommendation package can explain residual risk.

## Evidence required
Individual scores, consensus scores, evidence notes, score movement rationale, unresolved dissent, and final evaluator signoff.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-021",
    slug: "red-team-challenge-of-award-recommendation",
    title: "Red-Team Challenge of Award Recommendation",
    category: "risk",
    thesis:
      "A red-team challenge strengthens the award recommendation by testing whether the evidence supports the decision under adverse questions from finance, legal, security, operations, and executives.",
    applicability:
      "Apply before executive recommendation for strategic, high-risk, incumbent-displacing, highly visible, or commercially complex sourcing events.",
    riskFactors: [
      {
        id: "risk-weak-recommendation-evidence",
        label: "Recommendation cannot withstand challenge",
        severity: "high",
        detectionSignals: [
          "Recommendation emphasizes preference but not evidence.",
          "Known risks are not linked to mitigations or contract positions.",
        ],
        mitigations: [
          "Run a red-team challenge before approval.",
          "Update the recommendation with evidence, mitigations, and residual risk.",
        ],
      },
    ],
    body: `## Summary
The red team asks the questions an executive, auditor, or disappointed stakeholder will ask later. It is a structured challenge to the recommendation, not a second evaluation.

## Evaluation use
Test the recommendation against contrary evidence, commercial risk, transition risk, operational fit, implementation feasibility, and contractual exposure. Record changes made because of the challenge.

## Evidence required
Draft recommendation, challenge questions, evidence trace, risk register, mitigation updates, and final disposition.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-022",
    slug: "oral-presentation-normalization",
    title: "Oral Presentation Normalization",
    category: "process_methodology",
    thesis:
      "Oral presentations should be normalized for agenda, roles, evidence requests, and question handling so evaluator impressions do not distort the scored record.",
    applicability:
      "Apply when finalist oral presentations, executive briefings, solution walkthroughs, or team interviews influence selection.",
    riskFactors: [
      {
        id: "risk-oral-presentation-bias",
        label: "Oral presentation charisma outweighs evidence",
        severity: "medium",
        detectionSignals: [
          "Different vendors receive materially different question time or agenda focus.",
          "Presentation feedback is scored without linkage to criteria.",
        ],
        mitigations: [
          "Use a normalized oral-presentation agenda.",
          "Map questions and answers back to scorecard criteria.",
        ],
      },
    ],
    body: `## Summary
Orals can be useful because they show team chemistry, executive ownership, and response under questioning. They are risky when they become unstructured persuasion.

## Evaluation use
Give each finalist the same agenda structure, role expectations, evidence requests, and question rules. Score only the parts mapped to criteria and document any clarification that affects scoring.

## Evidence required
Oral agenda, evaluator guide, vendor attendee roles, question log, clarification record, and scorecard linkage.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-023",
    slug: "commercial-technical-separation",
    title: "Commercial and Technical Separation",
    category: "process_methodology",
    thesis:
      "Commercial and technical evaluation should be separated until both records are decision-grade so price does not excuse weak capability and technical preference does not hide commercial risk.",
    applicability:
      "Apply when technical teams, finance, procurement, legal, security, and business owners evaluate different dimensions of the same vendor response.",
    riskFactors: [
      {
        id: "risk-commercial-technical-contamination",
        label: "Commercial or technical bias contaminates scoring",
        severity: "high",
        detectionSignals: [
          "Low price changes technical scores without new evidence.",
          "Preferred technical vendor receives less scrutiny on exceptions or price assumptions.",
        ],
        mitigations: [
          "Keep technical and commercial scoring records separate until normalization.",
          "Use documented tradeoff analysis before recommendation.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Tradeoff clarity before BAFO",
        whenToUse:
          "Use when one vendor is technically stronger and another is commercially stronger.",
        buyerAsk:
          "Require the panel to document capability gaps, price assumptions, contract exceptions, and negotiable tradeoffs before BAFO.",
        vendorGive:
          "Focused BAFO asks tied to the buyer's actual decision gaps.",
      },
    ],
    body: `## Summary
Technical and commercial separation protects decision quality. The buyer needs to know the best capability answer, the best commercial answer, and the tradeoffs before blending them.

## Evaluation use
Complete technical scoring, commercial normalization, and exception review as distinct records. Bring them together only through a documented tradeoff analysis.

## Evidence required
Technical scorecard, commercial scorecard, pricing normalization, exception risk review, tradeoff memo, and BAFO question set.`,
  }),
  pattern({
    id: "PAT-SRC-RFP-EVAL-024",
    slug: "executive-recommendation-evidence-pack",
    title: "Executive Recommendation Evidence Pack",
    category: "process_methodology",
    thesis:
      "Executive recommendations are credible when they connect award rationale, evaluated evidence, residual risk, commercial tradeoffs, and contract protections in one traceable package.",
    applicability:
      "Apply before steering committee, CFO, CIO, legal, procurement, or business-owner approval of a finalist award.",
    riskFactors: [
      {
        id: "risk-executive-recommendation-thin",
        label: "Executive recommendation lacks evidence trace",
        severity: "high",
        detectionSignals: [
          "Recommendation names a preferred vendor but not the evidence path.",
          "Residual risks, mitigations, and contract protections are missing.",
        ],
        mitigations: [
          "Create an evidence pack before approval.",
          "Link each recommendation claim to scorecard, commercial, reference, demo, or contract evidence.",
        ],
      },
    ],
    body: `## Summary
An executive recommendation is not a recap of the event. It is the decision record that explains why the selected vendor is the right choice based on evaluated evidence.

## Evaluation use
Build the package from the scorecard, commercial normalization, risk register, reference checks, demo evidence, exceptions, and negotiation posture. Separate proven facts from assumptions and residual risk.

## Evidence required
Recommendation memo, evidence trace, final scorecard, commercial normalization, risk and mitigation log, contract protections, dissent record, and approval decision.`,
  }),
];
