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
  return [
    COMPLETION_MARKER,
    "## §8A · Process timeline and date-closure controls",
    "",
    "| Milestone | Interim planning anchor | Owner placeholder | Blocking gate | Downstream impact |",
    "|---|---:|---|---|---|",
    "| RFP issue date | [CLIENT TO SET — before Sep 2026 award path] | Sourcing lead | Issue-to-market gate | Vendors cannot commit response capacity without a dated release window. |",
    "| Bidder Q&A close | [CLIENT TO SET — after supplier conference] | Sourcing lead + Legal | Equal-information gate | Late Q&A changes create comparability risk across proposals. |",
    "| Proposal due date | [CLIENT TO SET — before evaluation readout] | Sourcing lead | Evaluation gate | Evaluation cannot start without a fixed receipt deadline. |",
    "| Downselect / finalist demos | [CLIENT TO SET — before BAFO] | Evaluation chair | Shortlist gate | Demo and reference work cannot be scheduled against an open timeline. |",
    "| Target award | Sep 2026 constraint from event planning context | Executive sponsor + Finance | Award gate | Transition plan and incumbent notice windows must align to this date. |",
    "",
    "## §9A · Evaluation controls and normalization closure",
    "",
    "| Evaluation control | Required closure before issue | Owner placeholder | Evidence source | Why it matters |",
    "|---|---|---|---|---|",
    "| E-06 commercial weighting | Confirm final percentage so the scoring model sums to 100%. | Finance + sourcing lead | Exhibit 09 / Exhibit 15 | Prevents non-comparable commercial scoring. |",
    "| Commercial normalization basis | Confirm NPV, ACV, and transition-cost treatment in pricing workbook instructions. | Finance | Exhibit 08 / Exhibit 15 | Keeps run/change and one-time charges comparable. |",
    "| Rater model | Confirm named roles, minimum rater count, and consensus process. | Evaluation chair | Exhibit 09 | Creates auditable score trace and reduces single-reviewer bias. |",
    "| Disqualification rules | Confirm mandatory legal, security, transition, and pricing red flags. | Legal + Security + sourcing lead | Exhibit 09 / Exhibit 13 | Makes no-bid and non-compliant responses easier to reject cleanly. |",
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
    "| G-04 | Confirm final E-06 commercial evaluation weight and total-score math. | Finance + sourcing lead | [CLIENT TO SET — before RFP issue] | Issue-to-market gate | Evaluation model cannot be represented as final until weights sum to 100%. |",
    "| G-09 | Confirm RFP issue, Q&A, proposal due, downselect, BAFO, and award calendar dates. | Sourcing lead | [CLIENT TO SET — before RFP issue] | Issue-to-market gate | Vendors cannot plan response resources or transition commitments against open dates. |",
    "| G-10 | Confirm rater roles, consensus process, and conflict-of-interest treatment. | Evaluation chair | [CLIENT TO SET — before proposal receipt] | Evaluation gate | Scores will not be auditable without a named process. |",
    "| G-11 | Confirm PCI DSS and security-control continuity obligations for transition. | Security owner | [CLIENT TO SET — before vendor Q&A close] | Security approval gate | Compliance gaps may surface too late for vendor remediation. |",
    "| G-12 | Confirm workforce-transition, retained-role, and change-management assumptions. | HR / change lead | [CLIENT TO SET — before downselect] | Mobilization gate | Adoption and continuity risks remain under-owned. |",
  ].join("\n");
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
