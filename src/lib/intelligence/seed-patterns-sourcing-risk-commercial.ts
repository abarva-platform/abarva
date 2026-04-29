import type { PatternSeed } from "./seed-types";

const COMMERCIAL_RISK_STAGES = [
  {
    id: "Scope",
    label: "Risk scope and dependency inventory",
    order: 1,
    description:
      "Name the commercial risk, impacted services, owners, dependency chain, and evidence required before market contact.",
  },
  {
    id: "RFP",
    label: "Vendor evidence request",
    order: 2,
    description:
      "Ask vendors for structured, comparable evidence rather than accepting policy, roadmap, or remedy language at face value.",
  },
  {
    id: "BAFO",
    label: "Commercial normalization and negotiation",
    order: 3,
    description:
      "Convert risk gaps into finalist-specific negotiation asks, commercial tradeoffs, and award conditions.",
  },
  {
    id: "Contracting",
    label: "Contract schedule and control lock",
    order: 4,
    description:
      "Move accepted positions into contract schedules, governance obligations, audit rights, remedies, and exit protections.",
  },
  {
    id: "Mobilization",
    label: "Operational proof and ongoing governance",
    order: 5,
    description:
      "Verify the contract position can be operated through reports, owners, cadence, artifacts, and escalation paths.",
  },
];

export const SOURCING_RISK_COMMERCIAL_PATTERNS: PatternSeed[] = [
  {
    id: "PAT-SRC-RSK-004",
    slug: "sla-remedy-illusion-risk",
    title: "SLA Remedy Illusion Risk",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "SLA language can create false confidence when the remedies look enforceable but do not restore operational continuity, executive leverage, or downstream programme confidence after a service failure.",
    applicability:
      "Apply when a sourcing event relies on availability, response, incident, recovery, staffing, support, or service-credit commitments to control material delivery or operating risk.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.73,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: [
      "PAT-SRC-003",
      "PAT-SRC-005",
      "PAT-SRC-006",
      "PAT-SRC-009",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "risk",
    vendorClass: "service",
    lifecycleStages: COMMERCIAL_RISK_STAGES,
    perStageGateCriteria: {
      Scope: [
        {
          id: "sla-risk-service-criticality-named",
          description:
            "The buyer has named which services, business processes, users, and downstream gates depend on the SLA promise.",
          gateType: "hard",
          stageId: "Scope",
          evaluationHint:
            "Look for a service criticality map that separates business-impacting failure from low-impact metric breach.",
        },
      ],
      RFP: [
        {
          id: "sla-remedy-evidence-requested",
          description:
            "The RFP asks vendors to explain measurement method, exclusions, reporting, cure process, escalation, and remedy operation.",
          gateType: "hard",
          stageId: "RFP",
          evaluationHint:
            "Evidence should include sample service reports, incident examples, remedy process, and exclusions in one comparable response.",
        },
      ],
      BAFO: [
        {
          id: "sla-remedy-tradeoffs-normalized",
          description:
            "Finalist SLA remedies are normalized against operational impact, not only against headline service-credit wording.",
          gateType: "hard",
          stageId: "BAFO",
          evaluationHint:
            "Compare cure rights, escalation rights, chronic failure treatment, termination triggers, reporting cadence, and buyer obligations.",
        },
      ],
      Contracting: [
        {
          id: "sla-remedy-schedule-locked",
          description:
            "The contract schedule defines the metric, measurement source, exclusions, remedy path, escalation path, and chronic failure consequence.",
          gateType: "hard",
          stageId: "Contracting",
          evaluationHint:
            "The signed schedule should be operable by contract management without relying on proposal narrative.",
        },
      ],
      Mobilization: [
        {
          id: "sla-governance-operationalized",
          description:
            "The buyer and vendor have named owners, reporting cadence, issue-log treatment, escalation route, and evidence storage for SLA governance.",
          gateType: "soft",
          stageId: "Mobilization",
          evaluationHint:
            "Confirm first reporting template, meeting cadence, owner list, and unresolved exception path before steady state.",
        },
      ],
    },
    perStageExpectedArtifacts: {
      Scope: [
        {
          id: "sla-criticality-map",
          label: "SLA criticality map",
          stageId: "Scope",
          requirement: "required",
          gateType: "hard",
          description:
            "Maps each proposed SLA to business process impact, downstream dependency, and the buyer owner who will govern it.",
        },
      ],
      Contracting: [
        {
          id: "sla-remedy-schedule",
          label: "SLA remedy schedule",
          stageId: "Contracting",
          requirement: "required",
          gateType: "hard",
          description:
            "Contract schedule containing metric definitions, measurement source, exclusions, reporting, credits, cure rights, escalation, and termination triggers.",
        },
      ],
    },
    negotiationLevers: [
      {
        lever: "Operational remedy substitution",
        whenToUse:
          "Use when service credits are offered but the buyer needs restoration, senior escalation, remediation work, or exit optionality more than invoice offset.",
        buyerAsk:
          "Trade headline credit language for named cure obligations, escalation commitments, chronic failure consequences, and transition rights.",
        tradeoffs: [
          "More operational remedies may require clearer buyer cooperation duties and faster incident evidence capture.",
        ],
      },
      {
        lever: "Measurement-source control",
        whenToUse:
          "Use when vendor-controlled reporting is the only evidence source for breach, exclusion, or service-credit calculation.",
        buyerAsk:
          "Require transparent reports, raw incident logs where appropriate, dispute rights, and joint review of excluded periods.",
        tradeoffs: [
          "Detailed reporting can increase governance overhead but reduces later dispute ambiguity.",
        ],
      },
    ],
    riskFactors: [
      {
        id: "sla-credit-without-recovery",
        label: "Credit without recovery",
        severity: "high",
        detectionSignals: [
          "The remedy is limited to a fee credit even when failure would interrupt operations, customer commitments, or programme gates.",
        ],
        mitigations: [
          "Add cure plan, executive escalation, chronic failure treatment, and termination or step-out rights where impact justifies them.",
        ],
        contractualRemedies: [
          "Cure plan obligation",
          "Chronic failure trigger",
          "Termination for repeated material breach",
          "Transition assistance on unresolved failure",
        ],
      },
      {
        id: "sla-exclusion-overhang",
        label: "Exclusion overhang",
        severity: "medium",
        detectionSignals: [
          "Maintenance, third-party dependencies, buyer acts, force majeure, data issues, or measurement windows are broad enough to swallow the commitment.",
        ],
        mitigations: [
          "Define exclusions narrowly, require notice, preserve dispute rights, and require reports showing excluded time separately.",
        ],
      },
    ],
    body: `## Summary
SLA remedy illusion risk appears when a sourcing team treats an SLA schedule as protection even though the remedy would not repair the business harm created by a service failure. The language may look rigorous: metric names, target levels, service credits, exclusions, reports, and escalation references. The illusion is that the existence of a remedy equals operational control. In reality, a small credit after a material failure may not restore service, protect customer commitments, keep a linked programme gate open, preserve executive trust, or create enough vendor urgency to fix chronic performance problems.

This pattern is qualitative by design. It does not assume any standard credit percentage, uptime level, response-time target, or breach threshold. Those values must come from the actual event, vendor proposal, and buyer contract schedule. The reusable risk is structural: the remedy is weaker than the dependency it is supposed to govern.

## When to apply
Use this pattern when sourcing managed services, SaaS, infrastructure, support, implementation, AI operations, payroll, ITSM, security operations, or any service where performance commitments influence award confidence. It is especially important when a downstream programme, regulatory obligation, customer-facing workflow, or executive milestone depends on the vendor performing, not merely paying a credit after failure.

## How it works
Start by mapping each proposed SLA to the business outcome it protects. A help-desk response SLA, integration uptime SLA, payroll processing SLA, incident escalation SLA, model-serving SLA, or transition milestone SLA has a different risk profile. The sourcing team then asks whether the proposed remedy matches the consequence of failure. If the vendor misses the commitment, does the buyer receive evidence, escalation, remediation effort, additional staffing, root-cause analysis, service-credit offset, termination rights, transition help, or only a narrow invoice adjustment?

The RFP should require vendors to explain how the SLA is measured, which system is the source of truth, what exclusions apply, how breach notices work, when credits or other remedies are triggered, how disputes are handled, and how chronic underperformance is escalated. BAFO should normalize those answers. Contracting should move the accepted position into a schedule that a contract manager can operate without rereading proposal narrative.

## Lifecycle gates
The scope gate names critical services and downstream dependencies. The RFP gate requires measurement and remedy evidence. The BAFO gate compares remedies by operational usefulness rather than by headline generosity. The contracting gate locks metric definitions, exclusions, reporting, cure, escalation, and chronic failure treatment. Mobilization confirms the first governance cadence, report template, evidence location, and owner list.

## Negotiation posture
The buyer should not ask for harsher remedies reflexively. The better ask is proportionality. Low-impact commitments may only need simple reporting. Material dependencies may need cure rights, senior escalation, root-cause obligations, termination triggers, or transition assistance. If the vendor resists, the buyer can trade remedy severity for narrower scope, clearer buyer obligations, or phased acceptance.

## Failure modes
The common failure is accepting service credits as if they were operational continuity. Another failure is letting exclusions, measurement windows, or vendor-controlled reports make breach proof impractical. The pattern also fails when contract terms are strong but mobilization never assigns owners to inspect the reports, challenge exclusions, and escalate unresolved service degradation.`,
  },
  {
    id: "PAT-SRC-RSK-005",
    slug: "subprocessor-opacity-risk",
    title: "Subprocessor Opacity Risk",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "Subprocessor risk becomes commercially material when the buyer cannot see which third parties support the service, what data they touch, how changes are noticed, or how exit and deletion obligations flow down.",
    applicability:
      "Apply when a vendor service processes buyer data through hosting providers, support partners, AI services, implementation partners, payment processors, analytics tools, offshore delivery teams, or other third parties.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.72,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [
      "GDPR-if-person-data",
      "HIPAA-if-PHI",
      "DORA-if-regulated-financial-entity",
    ],
    relatedPatternIds: [
      "PAT-SRC-003",
      "PAT-SRC-CAT-HCM-001",
      "PAT-SRC-CAT-LLM-001",
      "PAT-SRC-CAT-AGENT-001",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "risk",
    vendorClass: "direct-tech",
    lifecycleStages: COMMERCIAL_RISK_STAGES,
    perStageGateCriteria: {
      Scope: [
        {
          id: "subprocessor-data-map-required",
          description:
            "The event identifies data classes, processing locations, access paths, support paths, and third-party dependency types before vendor evaluation.",
          gateType: "hard",
          stageId: "Scope",
          evaluationHint:
            "Look for a data and dependency map that separates hosting, support, AI/model, implementation, telemetry, and payment or operations partners.",
        },
      ],
      RFP: [
        {
          id: "subprocessor-register-requested",
          description:
            "Vendor responses include current subprocessor categories, roles, data access, locations where available, notice process, objection process, and flow-down obligations.",
          gateType: "hard",
          stageId: "RFP",
          evaluationHint:
            "A generic privacy-policy link is not enough; the event needs decision-ready disclosure or a documented exception.",
        },
      ],
      BAFO: [
        {
          id: "subprocessor-exceptions-negotiated",
          description:
            "Material opacity, sensitive data handling, offshore support, AI service use, and subcontracted delivery are resolved as named BAFO exceptions.",
          gateType: "hard",
          stageId: "BAFO",
          evaluationHint:
            "Finalists should have comparable positions on notice, objection, audit, deletion, incident, and replacement handling.",
        },
      ],
      Contracting: [
        {
          id: "subprocessor-flowdown-locked",
          description:
            "The contract and data-processing terms flow confidentiality, security, deletion, incident, audit, and change-notice obligations through relevant subprocessors.",
          gateType: "hard",
          stageId: "Contracting",
          evaluationHint:
            "Confirm the signed terms cover current subprocessors and future changes without requiring informal side assurances.",
        },
      ],
      Mobilization: [
        {
          id: "subprocessor-change-watch-operational",
          description:
            "The buyer has an owner and cadence for reviewing subprocessor notices, objections, material changes, and exit/deletion evidence.",
          gateType: "soft",
          stageId: "Mobilization",
          evaluationHint:
            "Look for a named privacy/security/procurement owner and a place to store notices and decisions.",
        },
      ],
    },
    perStageExpectedArtifacts: {
      Scope: [
        {
          id: "subprocessor-risk-map",
          label: "Subprocessor risk map",
          stageId: "Scope",
          requirement: "required",
          gateType: "hard",
          description:
            "Maps buyer data classes, access roles, third-party dependency categories, support paths, and sensitive processing assumptions.",
        },
      ],
      Contracting: [
        {
          id: "subprocessor-flowdown-exhibit",
          label: "Subprocessor flow-down exhibit",
          stageId: "Contracting",
          requirement: "required",
          gateType: "hard",
          description:
            "Records approved subprocessor posture, notice and objection process, incident handling, deletion, audit, and exit obligations.",
        },
      ],
    },
    negotiationLevers: [
      {
        lever: "Material subprocessor change control",
        whenToUse:
          "Use when the vendor reserves broad rights to add or replace subprocessors without meaningful buyer review.",
        buyerAsk:
          "Require advance notice for material changes, objection path, mitigation plan, and termination or transition rights for unacceptable changes.",
        tradeoffs: [
          "Strict approval rights may be resisted by standardized SaaS providers; notice, objection, and exit rights may be more achievable.",
        ],
      },
      {
        lever: "Sensitive-data processing boundary",
        whenToUse:
          "Use when regulated, confidential, employee, customer, payment, model-training, or privileged operational data may be handled by third parties.",
        buyerAsk:
          "Separate approved data classes, prohibited data classes, support-access controls, AI/model service use, and deletion evidence by subprocessor role.",
        tradeoffs: [
          "Narrower processing boundaries can require configuration discipline and buyer-side data classification work.",
        ],
      },
    ],
    riskFactors: [
      {
        id: "subprocessor-list-not-operational",
        label: "Subprocessor list not operational",
        severity: "high",
        detectionSignals: [
          "The vendor provides a static or generic list without explaining role, data access, notice, objection, deletion, or incident treatment.",
        ],
        mitigations: [
          "Require a role-based register, change-notice process, flow-down commitments, and owner review before award.",
        ],
        contractualRemedies: [
          "Advance notice",
          "Objection right",
          "Transition right for unacceptable material change",
          "Deletion certification flow-down",
        ],
      },
      {
        id: "hidden-ai-or-support-chain",
        label: "Hidden AI or support chain",
        severity: "high",
        detectionSignals: [
          "Proposal mentions AI features, offshore support, analytics, telemetry, or managed operations without stating which third parties can access buyer data.",
        ],
        mitigations: [
          "Ask for feature-level data handling, support-access controls, telemetry use, model-service dependencies, and prohibited data boundaries.",
        ],
      },
    ],
    body: `## Summary
Subprocessor opacity risk appears when a vendor can describe the primary service but cannot give the buyer enough visibility into the third parties that make the service work. The issue is not simply whether a subprocessor list exists. The commercial risk is whether the buyer can understand which organizations host the platform, provide support, process telemetry, operate AI features, assist implementation, handle payments, access logs, perform security monitoring, or otherwise touch buyer data and operations.

This pattern intentionally avoids claims about any specific vendor's current subprocessor roster. Those rosters change and must be verified during the actual event. The durable sourcing lesson is that third-party dependency opacity weakens privacy review, security review, audit readiness, incident response, exit planning, deletion assurance, and negotiation leverage.

## When to apply
Use this pattern for SaaS, cloud, AI, HCM, finance, security, ITSM, managed services, customer platforms, analytics, and implementation-heavy services where buyer data may move through multiple vendors. It is especially relevant when the service handles personal data, employee data, regulated data, confidential commercial records, privileged credentials, production logs, support tickets, customer communications, or model inputs and outputs.

## How it works
The sourcing team starts with the buyer's own data and dependency map. Name data classes, access paths, support processes, integration flows, telemetry, environments, and operational roles. Then require vendors to explain the third-party chain in comparable terms. A useful response separates hosting providers, infrastructure providers, support providers, implementation partners, AI/model providers, analytics and monitoring providers, payment processors, email/SMS providers, security tools, and regional delivery partners where they are relevant to the service.

The RFP should ask what each relevant party does, what data it can access, whether access is routine or exceptional, what locations or transfer posture apply where known, how notices of change are provided, how objections are handled, how incident obligations flow down, how deletion or return works, and what happens at exit. BAFO should convert gaps into named exceptions. Contracting should ensure the data-processing terms, confidentiality clauses, security schedule, incident terms, audit or attestation rights, deletion obligations, and transition terms flow through the relevant subprocessor chain.

## Lifecycle gates
The scope gate blocks progress until the buyer knows which data and operations are sensitive enough to care about. The RFP gate requires disclosure that is more useful than a generic link. The BAFO gate normalizes each finalist's notice, objection, audit, incident, deletion, support-access, and AI-service posture. The contracting gate locks flow-down obligations. Mobilization assigns an owner for subprocessor notices and stores the approved position so change notices do not disappear into legal email.

## Negotiation posture
The buyer should distinguish between control needs and information needs. Some standardized vendors will not give bespoke approval rights for every subprocessor change, but the buyer can still seek advance notice, objection rights, termination or transition rights for unacceptable material change, role-based disclosure, data-class restrictions, and support-access controls. For sensitive services, the buyer can also require feature-level data handling, especially where AI, telemetry, offshore support, or privileged operations are involved.

## Failure modes
The common failure is treating a public list as sufficient even though it does not explain role, data, change, incident, deletion, or exit treatment. Another failure is reviewing subprocessors only during privacy approval and not carrying unresolved exceptions into commercial negotiation. The pattern also fails when subprocessor change notices arrive after go-live but no owner is assigned to review their effect on risk acceptance.`,
  },
  {
    id: "PAT-SRC-RSK-006",
    slug: "vendor-roadmap-dependency-risk",
    title: "Vendor Roadmap Dependency Risk",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "Vendor roadmap dependency risk arises when a buyer scores, prices, or schedules a sourcing decision around capabilities that are not contractually available, accepted, and operationally proven at award time.",
    applicability:
      "Apply when a vendor proposal relies on future features, preview capabilities, planned integrations, promised AI functions, delayed certifications, upcoming regional support, or incomplete roadmap commitments.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.71,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [],
    regulatoryChips: [],
    relatedPatternIds: [
      "PAT-SRC-004",
      "PAT-SRC-005",
      "PAT-SRC-009",
      "PAT-SRC-CAT-LLM-001",
      "PAT-SRC-CAT-AGENT-001",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "risk",
    vendorClass: "direct-tech",
    lifecycleStages: COMMERCIAL_RISK_STAGES,
    perStageGateCriteria: {
      Scope: [
        {
          id: "roadmap-dependency-inventory-required",
          description:
            "The buyer has separated must-have current capabilities from future, preview, optional, partner-delivered, or conditional capabilities.",
          gateType: "hard",
          stageId: "Scope",
          evaluationHint:
            "Look for a capability inventory that marks each dependency as current, preview, roadmap, optional, partner, or buyer-built workaround.",
        },
      ],
      RFP: [
        {
          id: "roadmap-claim-proof-required",
          description:
            "Vendor responses must identify which claims are generally available now and which require roadmap delivery, configuration, paid add-on, partner work, or future release.",
          gateType: "hard",
          stageId: "RFP",
          evaluationHint:
            "The response should separate live proof from demos, mockups, beta access, reference architecture, and product-management intent.",
        },
      ],
      BAFO: [
        {
          id: "roadmap-score-adjusted",
          description:
            "Evaluation and BAFO treatment adjust score, price, milestone, acceptance, and remedy posture for any material roadmap dependency.",
          gateType: "hard",
          stageId: "BAFO",
          evaluationHint:
            "Finalist comparison should show whether the buyer is paying for current capability or assuming future delivery risk.",
        },
      ],
      Contracting: [
        {
          id: "roadmap-commitment-scheduled",
          description:
            "Any accepted roadmap dependency is converted into a contract schedule with delivery evidence, acceptance criteria, fallback, and consequence for non-delivery.",
          gateType: "hard",
          stageId: "Contracting",
          evaluationHint:
            "A roadmap slide is not enough; the signed documents need obligation, acceptance, and remedy language where dependency is material.",
        },
      ],
      Mobilization: [
        {
          id: "roadmap-watch-owned",
          description:
            "The buyer has an owner, review cadence, and decision rule for roadmap slippage, substitution, workaround, or de-scoping.",
          gateType: "soft",
          stageId: "Mobilization",
          evaluationHint:
            "Confirm roadmap dependencies are tracked in delivery governance rather than left with the sales team.",
        },
      ],
    },
    perStageExpectedArtifacts: {
      Scope: [
        {
          id: "roadmap-dependency-register",
          label: "Roadmap dependency register",
          stageId: "Scope",
          requirement: "required",
          gateType: "hard",
          description:
            "Lists current, preview, roadmap, optional, partner, and workaround-dependent capabilities with buyer impact.",
        },
      ],
      Contracting: [
        {
          id: "roadmap-commitment-schedule",
          label: "Roadmap commitment schedule",
          stageId: "Contracting",
          requirement: "recommended",
          gateType: "hard",
          description:
            "Captures material future capability commitments, acceptance criteria, milestone evidence, fallback, price treatment, and remedies.",
        },
      ],
    },
    negotiationLevers: [
      {
        lever: "Current-capability score reset",
        whenToUse:
          "Use when a vendor receives evaluation credit for features that are not generally available, included, accepted, or proven in buyer context.",
        buyerAsk:
          "Score current capability separately from roadmap potential and hold roadmap-dependent value out of the award case unless contractually committed.",
        tradeoffs: [
          "A stricter score may reduce enthusiasm for an innovative vendor but makes the decision more defensible.",
        ],
      },
      {
        lever: "Roadmap value holdback",
        whenToUse:
          "Use when future functionality materially affects price, implementation design, downstream programme timing, or incumbent displacement.",
        buyerAsk:
          "Tie milestone payment, expansion, renewal, or optional module activation to accepted delivery of the roadmap-dependent capability.",
        tradeoffs: [
          "Vendors may prefer softer commercial language; buyer should reserve hard remedies for dependencies that materially drove award.",
        ],
      },
    ],
    riskFactors: [
      {
        id: "roadmap-scored-as-present",
        label: "Roadmap scored as present",
        severity: "high",
        detectionSignals: [
          "Evaluation sheets award full credit for a feature described as planned, preview, beta, future release, partner-dependent, or subject to configuration.",
        ],
        mitigations: [
          "Separate current, preview, optional, partner, and roadmap capability in scoring and executive recommendation.",
        ],
        contractualRemedies: [
          "Acceptance milestone",
          "Price holdback",
          "Termination or de-scope right for non-delivery",
          "Fallback support obligation",
        ],
      },
      {
        id: "downstream-programme-roadmap-blocker",
        label: "Downstream programme roadmap blocker",
        severity: "high",
        detectionSignals: [
          "A linked programme, architecture choice, migration, or value case depends on a vendor feature that is not available at award.",
        ],
        mitigations: [
          "Create a dependency register, fallback design, go/no-go checkpoint, and executive risk acceptance before award.",
        ],
      },
    ],
    body: `## Summary
Vendor roadmap dependency risk appears when a sourcing decision gives operational, financial, or strategic weight to something the vendor has not yet delivered in the buyer's usable context. The dependency may be a future product feature, preview capability, planned integration, promised AI function, pending certification, regional availability, partner connector, performance improvement, migration tool, workflow automation, or support model enhancement. The risk is not that vendors have roadmaps. Roadmaps are normal. The risk is treating roadmap intent as if it were current, contracted, accepted capability.

This pattern deliberately avoids naming vendor-specific release claims. Roadmap content changes and must be verified during the event. The reusable commercial issue is decision hygiene: the buyer must know whether it is buying what exists, betting on what may exist, or accepting a workaround until the gap closes.

## When to apply
Use this pattern when vendor proposals include phrases such as planned, coming soon, preview, beta, early access, roadmap, future release, strategic direction, reference architecture, partner-led, not currently supported, or available after configuration. It is especially relevant for AI features, analytics, platform integrations, identity controls, security certifications, data-residency support, workflow automation, vertical packages, and migration accelerators because those claims can influence architecture, staffing, timeline, and business case decisions.

## How it works
The buyer begins with a capability inventory. Each material capability is marked as current, included, optional, paid add-on, preview, roadmap, partner-delivered, buyer-configured, or workaround-dependent. The sourcing team then decides how each status affects scoring and negotiation. Current capability can receive normal evidence-based credit. Optional capability can be priced separately. Preview or roadmap capability should not receive full decision credit unless the contract gives the buyer an enforceable path if it does not arrive in time or does not work as expected.

The RFP should require vendors to classify claims using the buyer's vocabulary, not sales-friendly phrasing. Proof scripts should demonstrate current capability in buyer scenarios. BAFO should normalize roadmap exposure across finalists and translate material dependencies into award conditions. Contracting should use schedules, acceptance criteria, price treatment, milestone holdbacks, substitution rights, fallback obligations, or exit rights only where the dependency is important enough to justify hard terms.

## Lifecycle gates
The scope gate blocks ambiguous capability lists. The RFP gate requires vendors to separate live proof from roadmap narrative. The BAFO gate prevents full scorecard credit for unproven future capability unless the commercial terms absorb the risk. The contracting gate converts accepted roadmap dependencies into enforceable schedules or explicitly records risk acceptance. Mobilization assigns ownership for tracking delivery, slippage, substitution, workaround, or de-scope decisions.

## Negotiation posture
The buyer should not punish every roadmap statement. Some future items are low-impact or merely informative. The negotiation focus belongs on dependencies that drove award, changed price, displaced an incumbent, altered architecture, compressed a downstream timeline, or supported an executive value case. For those, the buyer can ask for acceptance milestones, expansion holdbacks, renewal protections, fallback support, implementation contingencies, or a right to de-scope if the roadmap slips.

## Failure modes
The most common failure is scoring a roadmap feature as present because the demo was persuasive. Another failure is accepting a roadmap-dependent implementation plan without a fallback path. The pattern also fails when legal teams receive the issue too late and can only add soft language after commercial leverage has already moved to the vendor.`,
  },
];
