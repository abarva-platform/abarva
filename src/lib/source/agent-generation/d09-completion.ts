import type {
  SourceGenerationContext,
  SourceGenerationUploadedArtifact,
} from "./types";

const COMPLETION_MARKER = "<!-- abarva-d09-governance-completion-v1 -->";

interface ExhibitBinding {
  label: string;
  keywords: string[];
  fallbackStatus: string;
}

interface ReadinessRow {
  gate: string;
  evidenceKeywords: string[][];
  loadedStatus: string;
  missingStatus: string;
  owner: string;
  validationStep: string;
  impact: string;
}

const EXHIBITS: ExhibitBinding[] = [
  {
    label: "Exhibit 07 — Incumbent contract baseline",
    keywords: ["incumbent", "contract", "baseline"],
    fallbackStatus: "Client to complete / contract counsel to validate.",
  },
  {
    label: "Exhibit 08 — Locked pricing assumptions and volume bands",
    keywords: ["locked", "pricing", "assumptions", "volume", "bands"],
    fallbackStatus: "Client to complete pricing basis before vendor issue.",
  },
  {
    label: "Exhibit 09 — Approved evaluation criteria and weights",
    keywords: ["evaluation", "criteria", "weights", "approved"],
    fallbackStatus: "Client to confirm scoring controls before vendor issue.",
  },
  {
    label: "Exhibit 13 — Security and compliance control posture",
    keywords: ["security", "compliance", "control", "posture"],
    fallbackStatus: "Security owner to confirm control obligations.",
  },
  {
    label: "Exhibit 14 — Transition operations blackout calendar",
    keywords: ["transition", "ops", "blackout", "calendar"],
    fallbackStatus: "Transition owner to confirm milestone dates.",
  },
  {
    label: "Exhibit 15 — Run-vs-change financial baseline",
    keywords: ["run", "change", "financial", "baseline"],
    fallbackStatus: "Finance to confirm normalization basis.",
  },
];

export function completeD09RfpGovernanceSections(args: {
  artifactCode: string;
  body: string;
  ctx: SourceGenerationContext;
}): string {
  if (args.artifactCode !== "d09_rfp_pack") return args.body;
  const sanitizedBody = sanitizeD09ClientFacingNames(args.body);
  if (sanitizedBody.includes(COMPLETION_MARKER)) return sanitizedBody;

  const body = stripFinalCompletionLine(sanitizedBody.trim());
  const appendix = buildD09CompletionAppendix(args.ctx);
  return [body, appendix, "RFP package draft complete — pending client closure of registered gaps."]
    .filter(Boolean)
    .join("\n\n");
}

export function sanitizeD09ClientFacingNames(body: string): string {
  return body
    .replace(/\bNorthwind\s+IT\b/giu, "Incumbent Provider A")
    .replace(/\bNorthwind\b/giu, "Incumbent Provider A")
    .replace(/\bApex\s+Digital\b/giu, "Incumbent Provider B");
}

function buildD09CompletionAppendix(ctx: SourceGenerationContext): string {
  const hasEvaluationWeights = Boolean(
    findUploadedEvidence(ctx, ["evaluation", "criteria", "weights", "approved"]),
  );
  return [
    COMPLETION_MARKER,
    "## §0 · Issuance readiness checklist",
    "",
    "| Readiness gate | Current status | Owner placeholder | Post-gap validation step | Downstream impact |",
    "|---|---|---|---|---|",
    ...buildReadinessRows(ctx),
    "",
    "Recommended planning anchor: target gap closure within T+3 weeks and target RFP release within T+5 weeks, subject to client evidence validation and sponsor sign-off.",
    "",
    "## §8A · Process timeline and date-closure controls",
    "",
    "| Milestone | Interim planning anchor | Owner placeholder | Blocking gate | Downstream impact |",
    "|---|---:|---|---|---|",
    "| RFP issue date | T+5 weeks from sponsor sign-off | Sourcing lead | Issue-to-market gate | Gives vendors a dated response window while final evidence validation closes. |",
    "| Bidder Q&A close | T+7 weeks from sponsor sign-off | Sourcing lead + Legal | Equal-information gate | Keeps late Q&A changes controlled and comparable across bidders. |",
    "| Proposal due date | T+9 weeks from sponsor sign-off | Sourcing lead | Evaluation gate | Establishes a fixed receipt deadline for scoring and compliance checks. |",
    "| Downselect / finalist demos | T+11 weeks from sponsor sign-off | Evaluation chair | Shortlist gate | Lets demos, references, and clarification cycles be scheduled cleanly. |",
    "| Target award | Sep 2026 constraint from event planning context | Executive sponsor + Finance | Award gate | Transition plan and incumbent notice windows must align to this date. |",
    "",
    "## §9A · Evaluation controls and normalization closure",
    "",
    "| Evaluation control | Required closure before issue | Owner placeholder | Evidence source | Why it matters |",
    "|---|---|---|---|---|",
    `| E-06 commercial weighting | ${hasEvaluationWeights ? "Use the approved weighted scorecard from Exhibit 09; finance confirms total-score math before release." : "Set final percentages so the scoring model sums to 100%."} | Finance + sourcing lead | Exhibit 09 / Exhibit 15 | Prevents non-comparable commercial scoring. |`,
    "| Commercial normalization basis | Confirm NPV, ACV, and transition-cost treatment in pricing workbook instructions. | Finance | Exhibit 08 / Exhibit 15 | Keeps run/change and one-time charges comparable. |",
    "| Rater model | Confirm named roles, minimum rater count, and consensus process. | Evaluation chair | Exhibit 09 | Creates auditable score trace and reduces single-reviewer bias. |",
    "| Disqualification rules | Confirm mandatory legal, security, transition, and pricing red flags. | Legal + Security + sourcing lead | Exhibit 09 / Exhibit 13 | Makes no-bid and non-compliant responses easier to reject cleanly. |",
    "",
    "## §7A · Directional commercial leverage assumptions",
    "",
    "These figures are planning placeholders only. Vendors must not treat them as locked baselines until the client loads and validates the spend, ticket, scope, and retained-cost evidence named in §11.",
    "",
    "| Pricing lever | Directional planning assumption | Vendor response requirement | Commercial control |",
    "|---|---|---|---|",
    "| Tower allocation | Application Support 35-45%; Service Desk 15-25%; Infrastructure Operations 25-35%; Automation 5-15%. | Provide tower-level annual price, unit economics, and assumptions for each tower. | Prevents bundled pricing from hiding tower economics. |",
    "| Ticket economics | Cost-per-ticket and resolution-effort bands must be stated by channel and severity. | Provide baseline assumption, unit rate, volume tier, and overage treatment. | Makes volume sensitivity visible before BAFO. |",
    "| Staffing mix | Onshore / nearshore / offshore mix must be priced by role and location. | Provide FTE, rate, coverage window, named vs. pooled status, and change-order rate. | Connects delivery model to SLA credibility. |",
    "| Productivity credit | Automation gains must show client price impact, not just vendor margin improvement. | Provide annual credit, trigger, measurement source, and gainshare / credit mechanism. | Converts automation claims into contractual economics. |",
    "| SLA credit | Service credits must attach to binding metrics, not aspirational targets. | Provide credit formula, cap, cure window, exclusions, and reporting cadence. | Ensures service risk has real commercial consequence. |",
    "",
    "## §10 · Risk register, transition controls, and failure modes",
    "",
    "| Risk ID | Failure mode | Evidence source | Owner placeholder | Mitigation | Blocking gate |",
    "|---|---|---|---|---|---|",
    "| R-01 | Incumbent knowledge-transfer or exit support is insufficient for safe transition. | Exhibit 07 / Exhibit 14 | Transition lead | Require KT plan, named SMEs, cutover entry criteria, and exit-support obligations in vendor response. | Transition readiness gate |",
    "| R-02 | Proposal economics are not comparable because run, change, transition, and pass-through costs are mixed. | Exhibit 08 / Exhibit 15 | Finance | Require normalized workbook tabs for steady-state run, transition, retained cost, pass-through, and productivity glidepath. | Commercial evaluation gate |",
    "| R-03 | Data center, private-cloud, or infrastructure refresh dependencies are under-scoped. | Exhibit 11 / Exhibit 14 | Infrastructure owner | Require dependency inventory, refresh assumptions, transition exclusions, and bidder exception log. | Scope-lock gate |",
    "| R-04 | Security, PCI DSS, or compliance continuity weakens during incumbent-to-MSP cutover. | Exhibit 13 | Security owner | Require control mapping, evidence transfer plan, access recertification, vulnerability backlog treatment, and incident-response obligations. | Security approval gate |",
    "| R-05 | Transition blackout windows conflict with airline operational peaks or freeze periods. | Exhibit 14 | Operations transition owner | Require milestone calendar, blackout acknowledgement, rollback plan, and change-freeze exception process. | Transition plan gate |",
    "| R-06 | Network/site connectivity obligations are misunderstood across airports, OCC, and corporate locations. | Exhibit 12 | Network owner | Require circuit/site inventory validation, carrier handoff matrix, redundancy commitments, and escalation paths. | Technical evaluation gate |",
    "| R-07 | Workforce adoption and service continuity degrade during movement of 1,800+ FTE-supported work. | Exhibit 04 / Exhibit 14 | HR / change lead | Require change-readiness plan, retained-role map, communication plan, and stabilization hypercare metrics. | Mobilization gate |",
    "| R-08 | SLA/XLA obligations are accepted without measurable baselines or credit mechanics. | Exhibit 05 | Service owner | Require SLA definitions, baseline volumes, reporting cadence, service-credit method, and cure period. | Contracting gate |",
    "",
    "## §11 · Source register, assumptions, and client-to-complete gaps",
    "",
    "### §11A · Source register",
    "",
    "| Source | Status | Used in sections | Remaining action |",
    "|---|---|---|---|",
    ...buildSourceRows(ctx),
    "",
    "### §11B · Gap closure register",
    "",
    "| Gap ID | Item | Owner placeholder | Due date placeholder | Blocking gate | Downstream impact |",
    "|---|---|---|---|---|---|",
    `| G-04 | ${hasEvaluationWeights ? "Validate Exhibit 09 weighted-scorecard math and rater model." : "Set final E-06 commercial evaluation weight and total-score math."} | Finance + sourcing lead | T+2 weeks from sponsor sign-off | Issue-to-market gate | Evaluation model cannot be represented as final until weights sum to 100%. |`,
    "| G-09 | Confirm RFP issue, Q&A, proposal due, downselect, BAFO, and award calendar dates against transition blackout windows. | Sourcing lead | T+3 weeks from sponsor sign-off | Issue-to-market gate | Vendors cannot plan response resources or transition commitments against open dates. |",
    "| G-10 | Confirm rater roles, consensus process, and conflict-of-interest treatment. | Evaluation chair | T+6 weeks from sponsor sign-off | Evaluation gate | Scores will not be auditable without a named process. |",
    "| G-11 | Confirm PCI DSS and security-control continuity obligations for transition. | Security owner | T+7 weeks from sponsor sign-off | Security approval gate | Compliance gaps may surface too late for vendor remediation. |",
    "| G-12 | Confirm workforce-transition, retained-role, and change-management assumptions. | HR / change lead | T+10 weeks from sponsor sign-off | Mobilization gate | Adoption and continuity risks remain under-owned. |",
    "",
    "## §12 · Legal, commercial, and submission terms for client counsel review",
    "",
    "These clauses are vendor-facing stubs for counsel and procurement review. They are not final legal terms until the client-approved template is loaded and counsel confirms the position.",
    "",
    "| Clause area | Draft position for vendor response | Client-to-complete validation | Commercial reason |",
    "|---|---|---|---|",
    "| Confidentiality / NDA | Vendor must acknowledge all RFP materials, data extracts, Q&A responses, and evaluation artifacts are confidential and may be used only for this sourcing event. | Legal to confirm NDA form and any mutuality requirements. | Protects operating data and evaluation integrity. |",
    "| Data protection and security | Vendor must map its proposed controls to required security, privacy, access, audit, incident, and retention obligations. | Security + legal to confirm required control framework. | Prevents transition risk from becoming uncontrolled data exposure. |",
    "| IP and work-product ownership | Vendor must identify pre-existing IP, client-owned work product, reusable accelerators, and restrictions on transfer or use. | Legal to confirm ownership fallback and licensing language. | Avoids lock-in and post-transition ambiguity. |",
    "| Liability and service credits | Vendor must state liability cap exceptions, SLA credit caps, chronic failure treatment, and whether credits are sole remedy. | Legal + procurement to confirm acceptable cap and remedy floor. | Prevents weak credit economics from undermining service accountability. |",
    "| Termination and step-in rights | Vendor must state transition assistance, termination-for-cause, termination-for-convenience, and step-in support positions. | Legal + transition lead to confirm minimum exit support. | Keeps the client protected if delivery fails or scope must move. |",
    "| Audit and reporting rights | Vendor must accept audit, reporting, operational review, and evidence-retention requirements for service, pricing, security, and automation commitments. | Legal + governance lead to confirm evidence-retention period. | Makes claims measurable during delivery, not only during sales. |",
    "| Q&A and submission protocol | Vendor must submit questions by the published deadline and use only the structured response templates plus allowed narrative appendices. | Sourcing lead to confirm calendar and submission portal. | Keeps all bidders on equal-information footing. |",
    "",
    ...buildVendorResponseTemplateAppendices(),
  ].join("\n");
}

function buildVendorResponseTemplateAppendices(): string[] {
  return [
    "## Appendix A · Vendor Claim Register Template",
    "",
    "| Claim ID | Claim Type | Example claim | Evidence required | Commercial commitment | Measurement method | Pricing impact |",
    "|---|---|---|---|---|---|---|",
    "| CLM-001 | Automation | L1 password-reset automation will reduce manual tickets by 18% by Year 2. | Prior-client case study, tool workflow, baseline volume assumption. | Yes / No; proposed contract exhibit. | Monthly ticket deflection from ITSM. | Annual credit or price reduction to be completed by vendor. |",
    "",
    "## Appendix B · Automation / Productivity Commitment Table",
    "",
    "| Use case | Baseline volume | Automation method | Year 1 impact | Year 2 impact | Client price impact | Dependencies |",
    "|---|---|---|---|---|---|---|",
    "| Service desk self-service deflection | Use Exhibit 02 monthly ticket baseline; vendor must restate assumed volume. | Virtual agent + knowledge workflow | 8-12% deflection | 15-20% deflection | Productivity credit / rate reduction to be completed by vendor. | Knowledge base, ITSM integration, approval of automatable intents. |",
    "",
    "## Appendix C · Structured Pricing Workbook Template",
    "",
    "| Workbook tab | Example line item | Vendor must complete | Why it matters |",
    "|---|---|---|---|",
    "| Run cost by tower | Application Support steady-state run | Year 0-Year 5 cost, unit basis, quantity, rate, assumption ID. | Separates run economics from transition and transformation. |",
    "",
    "## Appendix D · Staffing and Location Model Template",
    "",
    "| Role | Tower | Location model | FTE | Rate | Coverage window | Named / pooled |",
    "|---|---|---|---|---|---|---|",
    "| Application Support Lead | Application Support | Onshore | 1.0 | Vendor to complete | 8x5 plus escalation | Named |",
    "",
    "## Appendix E · SLA Commitment Table Template",
    "",
    "| Service area | Metric | Baseline | Proposed commitment | Measurement period | Service credit | Exclusion reference |",
    "|---|---|---|---|---|---|---|",
    "| Service Desk | First-contact resolution | Use Exhibit 05 SLA/XLA baseline; vendor must restate assumption. | Vendor to propose binding target | Monthly | Vendor to propose credit formula and cap | §7 assumption ID required. |",
    "",
    "## Appendix F · Assumptions and Exclusions Log Template",
    "",
    "| ID | Assumption / exclusion | Applies to | Financial impact | Operational impact | Change-order risk | Proposed treatment |",
    "|---|---|---|---|---|---|---|",
    "| A-001 | Pricing assumes current ticket volume remains within agreed volume band. | Pricing / staffing / SLA | Vendor to quantify overage. | Staffing model may change above threshold. | High until baseline is validated. | Provide volume tier schedule in Appendix C. |",
    "",
    "## Appendix G · Transition Plan Template",
    "",
    "| Phase | Week | Activity | Owner | Client dependency | Exit criteria | Fee / milestone linkage |",
    "|---|---|---|---|---|---|---|",
    "| Knowledge Transfer | W1-W4 | Transfer runbooks, ticket history, CMDB, service catalog, and escalation paths. | Vendor transition lead + client tower owner | Access to documentation and SMEs. | Signed KT completion checklist by tower. | Payment tied to accepted exit criteria, not elapsed time. |",
    "",
    "## Appendix H · Commercial Exceptions Table Template",
    "",
    "| Requirement | Vendor response | Exception | Proposed alternative | Buyer risk | Price impact | Review owner |",
    "|---|---|---|---|---|---|---|",
    "| SLA credit cap | Vendor to state accepted cap. | Yes / No | Vendor to propose alternate cap if exception taken. | Weak cap may make chronic miss cheaper than remediation. | Vendor to quantify. | Legal + procurement. |",
    "",
    "## Appendix I · Evaluation Scorecard Template",
    "",
    "| Evaluation area | Planning weight | Scoring basis | Disqualification / red flag | Evidence required | Review owner |",
    "|---|---:|---|---|---|---|",
    "| Service delivery capability | 20% | Tower solution, staffing model, coverage, named leads, transition staffing, and escalation coverage. | Staffing model omits critical roles or hides subcontractor dependency. | Completed Appendix D plus transition staffing plan. | Technology towers + HR/change. |",
    "| Commercial competitiveness and transparency | 20% | Five-year run, transition, retained cost, pass-through, credits, change-order economics, and assumption clarity. | Pricing workbook incomplete or materially non-comparable. | Completed Appendix C plus assumption cross-references. | Finance + sourcing. |",
    "| Automation and productivity commitment | 15% | Claims with baseline, method, measurement, contract exhibit, and price impact. | Automation claim not entered in Vendor Claim Register or not priced back. | Completed Appendix A and Appendix B. | Operations + finance. |",
    "| Transition risk and knowledge transfer | 15% | KT plan, runbook transfer, transition staffing, blackout controls, and exit criteria. | Transition plan lacks owner, milestone, rollback, or KT evidence. | Completed Appendix G plus transition-risk register. | Transition lead. |",
    "| Security, compliance, and data protection | 15% | Binding control posture, audit evidence, access model, incident obligations, and regulatory continuity. | Security exception cannot be accepted or controls evidence is missing. | Completed Appendix E, H and security evidence pack. | Legal + security. |",
    "| Cultural fit and governance model | 10% | Governance cadence, escalation path, named leaders, collaboration model, and retained-role fit. | Governance model lacks named accountability or escalation protocol. | Governance response plus operating model appendix. | CIO office + procurement. |",
    "| Contractual exceptions and buyer risk | 5% | Legal exceptions, liability/service-credit position, termination assistance, audit rights, and buyer risk. | Commercial exception creates unacceptable buyer risk. | Legal exceptions table and counsel review. | Legal + procurement. |",
    "",
    "## Appendix J · BAFO and Clarification Round Instructions",
    "",
    "| Round | Trigger | Vendor must submit | Buyer control | Due date placeholder |",
    "|---|---|---|---|---|",
    "| Written clarification | Incomplete, inconsistent, or unsupported response fields. | Updated response table rows only; narrative cannot replace structured fields. | Equal-information log and version-controlled clarification register. | T+1 week after proposal receipt. |",
    "| Commercial normalization | Pricing model not comparable across vendors or towers. | Revised pricing workbook, assumption deltas, and credit/penalty schedule. | Finance normalization workbook and exception tracker. | T+2 weeks after proposal receipt. |",
    "| BAFO | Finalist selection after scoring and executive review. | Final pricing, exceptions, transition commitments, SLA credits, and productivity economics. | BAFO scorecard, redline log, and decision-readiness memo. | T+4 weeks after proposal receipt. |",
  ];
}

function buildReadinessRows(ctx: SourceGenerationContext): string[] {
  const rows: ReadinessRow[] = [
    {
      gate: "Contract spend baseline",
      evidenceKeywords: [
        ["incumbent", "contract", "baseline"],
        ["run", "change", "financial", "baseline"],
      ],
      loadedStatus:
        "Available parsed evidence; finance validates run/change and term basis before vendor issue.",
      missingStatus:
        "Client to complete: current annual run cost and contract term evidence not yet locked.",
      owner: "Finance + sourcing lead",
      validationStep:
        "Finance validates source workbook and marks the baseline as issue-ready in §11A.",
      impact: "Anchors TCV, savings range, and pricing normalization.",
    },
    {
      gate: "Ticket / work volume baseline",
      evidenceKeywords: [
        ["itsm", "ticket", "volumetrics"],
        ["sla", "xla", "matrix"],
      ],
      loadedStatus:
        "Available parsed evidence; service owner validates ticket, incident, change, and SLA baselines before vendor issue.",
      missingStatus:
        "Client to complete: monthly ticket, incident, request, change, and backlog history not yet locked.",
      owner: "Service owner + operations lead",
      validationStep:
        "Operations validates volume extract before vendors price unit economics.",
      impact: "Prevents unsupported SLA and staffing assumptions.",
    },
    {
      gate: "Application / infrastructure inventory",
      evidenceKeywords: [
        ["application", "portfolio", "inscope"],
        ["system", "workload", "volumetrics"],
        ["data", "center", "infrastructure", "inventory"],
        ["network", "topology", "circuit"],
      ],
      loadedStatus:
        "Available parsed evidence; technology owners validate application, workload, infrastructure, and network scope before release.",
      missingStatus:
        "Client to complete: app, infrastructure, cloud, and dependency scope not yet locked.",
      owner: "Technology tower owners",
      validationStep:
        "Technology owners validate scope table before market issue.",
      impact: "Prevents scope gaps and change-order exposure.",
    },
    {
      gate: "Evaluation model",
      evidenceKeywords: [["evaluation", "criteria", "weights", "approved"]],
      loadedStatus:
        "Approved evaluation criteria and weights are loaded; Evaluation Chair validates scorer roles and conflict handling.",
      missingStatus:
        "Client to complete: final weights and rater model pending.",
      owner: "Evaluation chair + sourcing lead",
      validationStep:
        "Evaluation chair signs scoring workbook before vendor release.",
      impact: "Makes scoring auditable and comparable.",
    },
    {
      gate: "Legal / commercial terms",
      evidenceKeywords: [
        ["vendor", "response", "expectations"],
        ["security", "compliance", "control", "posture"],
      ],
      loadedStatus:
        "Vendor response expectations and security-control posture are loaded; counsel validates final clause positions.",
      missingStatus:
        "Client to complete: legal template and commercial fallback positions pending counsel review.",
      owner: "Legal + procurement",
      validationStep:
        "Counsel validates §12 clause positions and exception treatment.",
      impact: "Prevents unapproved legal risk entering the market.",
    },
    {
      gate: "Transition calendar",
      evidenceKeywords: [["transition", "ops", "blackout", "calendar"]],
      loadedStatus:
        "Transition blackout calendar is loaded; transition lead validates milestone dates against freeze windows.",
      missingStatus:
        "Client to complete: issue, Q&A, proposal, downselect, BAFO, award, and blackout dates pending.",
      owner: "Sourcing lead + transition lead",
      validationStep:
        "Transition lead validates the calendar against business freeze windows.",
      impact: "Allows vendors to commit staffing and transition resources.",
    },
  ];

  return rows.map((row) => {
    const hasEvidence = row.evidenceKeywords.some((keywords) =>
      Boolean(findUploadedEvidence(ctx, keywords)),
    );
    return `| ${row.gate} | ${hasEvidence ? row.loadedStatus : row.missingStatus} | ${row.owner} | ${row.validationStep} | ${row.impact} |`;
  });
}

function buildSourceRows(ctx: SourceGenerationContext): string[] {
  return EXHIBITS.map((exhibit) => {
    const match = findUploadedEvidence(ctx, exhibit.keywords);
    if (!match) {
      return `| ${exhibit.label} | [CLIENT TO COMPLETE] | ${sectionUseFor(exhibit.label)} | ${exhibit.fallbackStatus} |`;
    }
    return `| ${exhibit.label} | Available parsed evidence — citation review pending | ${sectionUseFor(exhibit.label)} | Confirm final citation page/sheet references before issue. |`;
  });
}

function findUploadedEvidence(
  ctx: SourceGenerationContext,
  keywords: string[],
): SourceGenerationUploadedArtifact | undefined {
  const uploaded = ctx.uploadedEvidence ?? [];
  return uploaded.find((artifact) => {
    const name = artifact.originalName.toLowerCase();
    return keywords.every((keyword) => name.includes(keyword));
  });
}

function sectionUseFor(label: string): string {
  if (label.includes("Incumbent")) return "§1, §6, §7, §10";
  if (label.includes("Pricing")) return "§7, §8, §9, §11";
  if (label.includes("evaluation")) return "§8, §9, §11";
  if (label.includes("Security")) return "§5, §6, §10, §11";
  if (label.includes("blackout")) return "§6, §8, §10, §11";
  if (label.includes("Run-vs-change")) return "§1, §2, §7, §9";
  return "§2-§11";
}

function stripFinalCompletionLine(body: string): string {
  return body
    .replace(
      /\n*RFP package draft complete — pending client closure of registered gaps\.\s*$/u,
      "",
    )
    .trim();
}
