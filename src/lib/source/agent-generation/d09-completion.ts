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
    "| Readiness gate | Current status | Accountable role | Post-gap validation step | Downstream impact |",
    "|---|---|---|---|---|",
    ...buildReadinessRows(ctx),
    "",
    "Recommended planning anchor: target gap closure within T+3 weeks and target RFP release within T+5 weeks, subject to client evidence validation and sponsor sign-off.",
    "",
    "## §8A · Process timeline and date-closure controls",
    "",
    "| Milestone | Interim planning anchor | Accountable role | Blocking gate | Downstream impact |",
    "|---|---:|---|---|---|",
    "| RFP issue date | T+5 weeks from sponsor sign-off | Sourcing lead | Issue-to-market gate | Gives vendors a dated response window while final evidence validation closes. |",
    "| Bidder Q&A close | T+7 weeks from sponsor sign-off | Sourcing lead + Legal | Equal-information gate | Keeps late Q&A changes controlled and comparable across bidders. |",
    "| Proposal due date | T+9 weeks from sponsor sign-off | Sourcing lead | Evaluation gate | Establishes a fixed receipt deadline for scoring and compliance checks. |",
    "| Downselect / finalist demos | T+11 weeks from sponsor sign-off | Evaluation chair | Shortlist gate | Lets demos, references, and clarification cycles be scheduled cleanly. |",
    "| Target award | Sep 2026 constraint from event planning context | Executive sponsor + Finance | Award gate | Transition plan and incumbent notice windows must align to this date. |",
    "",
    "## §9A · Evaluation controls and normalization closure",
    "",
    "| Evaluation control | Required closure before issue | Accountable role | Evidence source | Why it matters |",
    "|---|---|---|---|---|",
    `| E-06 commercial weighting | ${hasEvaluationWeights ? "Use the approved weighted scorecard from Exhibit 09; finance confirms total-score math before release." : "Set final percentages so the scoring model sums to 100%."} | Finance + sourcing lead | Exhibit 09 / Exhibit 15 | Prevents non-comparable commercial scoring. |`,
    "| Commercial normalization basis | Confirm NPV, ACV, and transition-cost treatment in the Vendor Response Workbook Pricing Response tab. | Finance | Exhibit 08 / Exhibit 15 | Keeps run/change and one-time charges comparable. |",
    "| Rater model | Confirm named roles, minimum rater count, and consensus process. | Evaluation chair | Exhibit 09 | Creates auditable score trace and reduces single-reviewer bias. |",
    "| Disqualification rules | Confirm mandatory legal, security, transition, and pricing red flags. | Legal + Security + sourcing lead | Exhibit 09 / Exhibit 13 | Makes no-bid and non-compliant responses easier to reject cleanly. |",
    "",
    "## §7A · Directional commercial leverage assumptions",
    "",
    "These figures are planning assumptions only. Vendors must not treat them as locked baselines until the client loads and validates the spend, ticket, scope, and retained-cost evidence named in §11.",
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
    "| Risk ID | Failure mode | Evidence source | Accountable role | Mitigation | Blocking gate |",
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
    "| Gap ID | Item | Accountable role | Target date / trigger | Blocking gate | Downstream impact |",
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
    "| Q&A and submission protocol | Vendor must submit questions by the published deadline and use only the Vendor Response Workbook plus allowed narrative appendices. | Sourcing lead to confirm calendar and submission portal. | Keeps all bidders on equal-information footing. |",
    "",
    ...buildVendorResponseTemplateAppendices(),
  ].join("\n");
}

function buildVendorResponseTemplateAppendices(): string[] {
  return [
    "## Appendix A · Vendor Response Workbook Tab Guide",
    "",
    "Vendors must complete one Vendor Response Workbook. Narrative files may supplement workbook answers, but they do not replace required workbook tabs or fields.",
    "",
    "| Workbook tab | Vendor must complete | Why it matters |",
    "|---|---|---|",
    "| Guide | Read the completion rules, locked/editable field rules, evidence-pointer format, and submission instructions. | Reduces support burden and prevents non-compliant submissions. |",
    "| Mandatory Compliance | Confirm every mandatory requirement as Yes / No with an evidence pointer. | Lets sourcing screen completeness before evaluator time is spent. |",
    "| Vendor Claim Register | Enter every automation, productivity, SLA, transition, security, staffing, risk-reduction, or cost-reduction claim with evidence and commercial commitment. | Converts sales claims into comparable, challengeable commitments. |",
    "| Solution Approach | Describe proposed service model, governance, tooling, operating model, and tower approach using the required fields. | Keeps solution comparison consistent across vendors. |",
    "| Pricing Response | Provide one-time, recurring run, transition, tooling, governance, pass-through, optional service, change-order, retained-cost, volume-band, productivity-credit, and SLA-credit economics. | Makes finance normalization and BAFO negotiation possible. |",
    "| Staffing and Location | Provide role, tower, location model, FTE, rate, coverage window, named/pooled status, and subcontractor dependency. | Exposes delivery credibility and hidden retained-client burden. |",
    "| SLA Commitments | State baseline assumption, proposed target, measurement period, credit formula, cap, cure window, and exclusions. | Converts service levels into enforceable economics. |",
    "| Transition Plan | Provide phase, week, activity, owner, client dependency, exit criteria, rollback, early-life support, and fee/milestone linkage. | Prevents transition ambiguity from becoming client risk. |",
    "| Assumptions and Exclusions | List every pricing, scope, staffing, transition, SLA, tooling, security, data, dependency, retained-team, or third-party assumption/exclusion. | Turns caveats into negotiation points instead of hidden risk. |",
    "| Commercial Exceptions | Redline commercial positions, proposed alternatives, buyer risk, price impact, and review owner. | Lets legal and finance weigh exceptions consistently. |",
    "| Evidence Checklist | Point to the file, tab, row, page, exhibit, certificate, or reference supporting each material claim. | Makes responses auditable and speeds clarification. |",
    "",
    "## Appendix B · Vendor Response Workbook Commercial Leverage Map",
    "",
    "| Client negotiation check | Workbook field that enables it | Example negotiation move |",
    "|---|---|---|",
    "| Bundled run/change economics | Pricing Response: run vs change split | Require restatement or apply change-leakage risk adjustment. |",
    "| Transition fee premium | Pricing Response + Transition Plan: transition fee and milestone linkage | Tie payment to accepted KT/cutover milestones or amortize over term. |",
    "| Weak SLA economics | SLA Commitments: credit formula, cap, cure window, chronic miss remedy | Increase at-risk fee pool or lower service score. |",
    "| Hidden retained-client effort | Staffing and Location + Pricing Response: retained FTE assumptions | Demand price credit or vendor assumption change. |",
    "| Unpriced productivity claim | Vendor Claim Register + Pricing Response: productivity credit | Convert claim into contractual credit or remove from score. |",
    "| Broad legal/commercial exception | Commercial Exceptions: proposed alternative, buyer risk, price impact | Close redline before award or apply risk-adjusted TCO. |",
    "",
    "## Appendix C · Internal Review and Negotiation Workbook",
    "",
    "The buyer will use a separate internal workbook for readiness gaps, evidence status, legal review, finance normalization, IT/security review, scoring, BAFO targets, and award recommendation. That internal workbook is not part of the vendor submission pack and should not be distributed to bidders.",
    "",
    "## Appendix D · BAFO and Clarification Round Instructions",
    "",
    "| Round | Trigger | Vendor must submit | Buyer control | Target response date / trigger |",
    "|---|---|---|---|---|",
    "| Written clarification | Incomplete, inconsistent, or unsupported response fields. | Updated response table rows only; narrative cannot replace structured fields. | Equal-information log and version-controlled clarification register. | T+1 week after proposal receipt. |",
    "| Commercial normalization | Pricing model not comparable across vendors or towers. | Revised Pricing Response tab, assumption deltas, and credit/penalty schedule. | Finance normalization workbook and exception tracker. | T+2 weeks after proposal receipt. |",
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
      return `| ${exhibit.label} | Missing — client action required | ${sectionUseFor(exhibit.label)} | ${exhibit.fallbackStatus} |`;
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
