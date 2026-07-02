import type { SourceCxoNarrativeReport } from "@/lib/source/exports/cxo-report/source-cxo-narrative-report";
import type { ContractOptimizationMveProfile } from "./types";
import { buildContractOptimizationStoryPack } from "./story-pack";
import { computeContractOptimizationExposureRollup } from "./exposure";

const DOCUMENT_TITLE = "AMS Contract Optimization Brief";

export function buildContractOptimizationCxoNarrativeReport(args: {
  tenantName: string;
  eventCode: string;
  eventName: string;
  generatedAt: string;
  profile: ContractOptimizationMveProfile;
}): SourceCxoNarrativeReport {
  const story = buildContractOptimizationStoryPack(args.profile);
  const exposure = computeContractOptimizationExposureRollup(args.profile);
  const evidenceCount = args.profile.contractBaseline.evidenceCount;
  const findingCount = args.profile.findings.length;
  const leverCount = args.profile.levers.length;

  return {
    tenantName: args.tenantName,
    eventCode: args.eventCode,
    eventName: DOCUMENT_TITLE,
    generatedAt: args.generatedAt,
    verdict: "Do not renew as-is",
    verdictDetail:
      "Issue cure notice, renegotiate under defined conditions, and preserve RFP fallback authority.",
    audience: "CXO / CFO / CIO / CPO / VP Sourcing",
    artifactCoverage: [],
    slides: [
      {
        id: "cover",
        kind: "cover",
        title: DOCUMENT_TITLE,
        message:
          "Existing-contract optimization report for the SkyHarbor Air AMS agreement. The report aligns contract evidence, commercial exposure, cure actions, and renewal decision timing.",
        proofLabel: "Contract optimization",
        metrics: [
          { label: "Company", value: args.tenantName, note: args.eventCode },
          {
            label: "Contract",
            value: "AMS agreement",
            note: args.profile.contractName,
          },
          {
            label: "Exposure",
            value: exposure.label,
            note: "Subject to vendor cure review",
            status: "warn",
          },
          {
            label: "Generated",
            value: args.generatedAt.slice(0, 10),
            note: "AbarVa Source",
          },
        ],
        notes: [
          "Use this report for the executive readout; use the deal-pack appendix for evidence inventory and audit detail.",
        ],
      },
      {
        id: "executive-message",
        kind: "answer",
        title: "Executive message",
        message: story.executiveMessage.join(" "),
        proofLabel: "Recommendation",
        metrics: [
          {
            label: "Recommendation",
            value: "Do not renew as-is",
            note: "Cure and renegotiate before renewal approval",
            status: "bad",
          },
          {
            label: "Identified exposure",
            value: exposure.label,
            note: "Invoice, staffing, change-order and SLA economics",
            status: "warn",
          },
          {
            label: "Decision ask",
            value: "Approve cure path",
            note: story.decisionAsk,
          },
          {
            label: "Evidence mode",
            value: "Evidence-rich",
            note: `${evidenceCount} evidence references in optimization pack`,
            status: "good",
          },
        ],
        table: {
          title: "What executives should approve",
          columns: ["Decision", "Why it matters", "Condition"],
          rows: [
            [
              "Issue cure / reservation-of-rights notice",
              "Preserves buyer rights while forcing vendor reconciliation.",
              "Include invoice, SLA, staffing and change-order cure asks.",
            ],
            [
              "Renegotiate incumbent with conditions",
              "Converts findings into commercial commitments.",
              "No renewal baseline until cure items are reconciled.",
            ],
            [
              "Preserve RFP fallback",
              "Maintains competitive leverage before the renewal window closes.",
              "Activate if cure response is weak or incomplete.",
            ],
          ],
        },
        notes: [story.whyItIsHappening],
      },
      {
        id: "value-leakage",
        kind: "economics",
        title: "Where value is leaking",
        message:
          "The exposure is concentrated in five drivers: invoice variance, recurring change orders, weak SLA remedies, underfilled staffing and productivity not priced back.",
        proofLabel: "Exposure drivers",
        metrics: story.valueLeakageTree.map((driver, index) => ({
          label: `Driver ${index + 1}`,
          value: driver,
          note: "Mapped to optimization finding and buyer action",
          status: index < 2 ? "warn" : "neutral",
        })),
        table: {
          title: "Exposure driver readout",
          columns: ["Driver", "Executive readout", "Business impact"],
          rows: story.opportunityMap.flatMap((quadrant) =>
            quadrant.items.map((item) => [
              item.title,
              item.summary,
              item.businessImpact.join(", "),
            ]),
          ),
        },
        notes: [
          "This is not vendor comparison. It is incumbent contract optimization against loaded contract, spend and operational evidence.",
        ],
      },
      {
        id: "opportunity-map",
        kind: "commercial-risk",
        title: "Commercial opportunity map",
        message:
          "The negotiation should be organized around four themes: recover cash, reduce future spend, reduce operational risk and increase vendor accountability.",
        proofLabel: "Negotiation themes",
        metrics: story.opportunityMap.map((quadrant) => ({
          label: quadrant.quadrant,
          value: `${quadrant.items.length} lever(s)`,
          note: quadrant.items.map((item) => item.title).join("; "),
        })),
        table: {
          title: "Negotiation strategy",
          columns: ["Theme", "Buyer ask", "Evidence basis"],
          rows: story.negotiationThemes.map((theme) => [
            theme.theme,
            theme.buyerAsk,
            theme.evidenceBasis,
          ]),
        },
        notes: [
          "The ask is to cure and reprice the existing agreement, not to award a vendor from an RFP event.",
        ],
      },
      {
        id: "action-path",
        kind: "path",
        title: "What should happen now",
        message:
          "Move through a time-bound cure and renegotiation path while preserving competitive fallback authority.",
        proofLabel: "Decision timeline",
        metrics: story.actionTimeline.map((step) => ({
          label: step.label,
          value: step.timing,
          note: `${step.ownerRole}: ${step.decision}`,
        })),
        table: {
          title: "Action path",
          columns: ["Step", "Timing", "Owner", "Decision"],
          rows: story.actionTimeline.map((step) => [
            step.label,
            step.timing,
            step.ownerRole,
            step.decision,
          ]),
        },
        notes: story.scenarios.map(
          (scenario) =>
            `${scenario.title}: ${scenario.outcome} ${scenario.commercialEffect}`,
        ),
      },
      {
        id: "evidence-caveats",
        kind: "evidence",
        title: "Evidence, caveats and audit trail",
        message: `${findingCount} finding(s), ${leverCount} negotiation lever(s), and ${evidenceCount} evidence reference(s) define what can be claimed today.`,
        proofLabel: "Evidence boundary",
        metrics: [
          {
            label: "Findings",
            value: String(findingCount),
            note: "Optimization findings in the profile",
          },
          {
            label: "Levers",
            value: String(leverCount),
            note: "Buyer asks tied to findings",
          },
          {
            label: "Evidence references",
            value: String(evidenceCount),
            note: "Synthetic demo evidence for controlled proof",
          },
          {
            label: "Readiness",
            value: args.profile.readyForOptimization,
            note: args.profile.readyReason,
            status: args.profile.readyForOptimization === "conditional" ? "warn" : "good",
          },
        ],
        table: {
          title: "Evidence caveats",
          columns: ["Area", "Status", "What to complete"],
          rows: args.profile.minimumViableExtractionAreas.map((area) => [
            area.area,
            area.status,
            area.whyItMatters,
          ]),
        },
        notes: args.profile.clientToComplete.length
          ? args.profile.clientToComplete
          : [
              "Loaded synthetic evidence is sufficient for controlled demo proof. Client production use still requires client-approved evidence and finance/vendor cure review.",
            ],
      },
    ],
  };
}

export function renderContractOptimizationDealPackHtml(args: {
  tenantName: string;
  eventCode: string;
  eventName: string;
  generatedAt: string;
  profile: ContractOptimizationMveProfile;
}): string {
  const story = buildContractOptimizationStoryPack(args.profile);
  const exposure = computeContractOptimizationExposureRollup(args.profile);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(args.tenantName)} · ${escapeHtml(DOCUMENT_TITLE)} · Evidence Appendix</title>
<meta name="generator" content="AbarVa Source Contract Optimization Appendix" />
<meta name="x-source-event-code" content="${escapeHtml(args.eventCode)}" />
<meta name="x-source-generated-at" content="${escapeHtml(args.generatedAt)}" />
<style>${appendixStyles()}</style>
</head>
<body>
<main class="shell">
  <header class="hero">
    <p class="eyebrow">AbarVa Source · Contract Optimization Appendix</p>
    <h1>${escapeHtml(DOCUMENT_TITLE)}</h1>
    <p class="lede">${escapeHtml(args.tenantName)} should not renew the AMS agreement as-is. Identified exposure is ${escapeHtml(exposure.label)}. The recommended path is cure notice, renegotiation with conditions, and preserved RFP fallback.</p>
    <div class="metrics">
      <div><span>Contract</span><strong>${escapeHtml(args.profile.contractName)}</strong></div>
      <div><span>Run rate</span><strong>${formatMoney(args.profile.contractBaseline.currentAnnualRunRateUsd)}</strong></div>
      <div><span>Renewal notice</span><strong>${escapeHtml(args.profile.contractBaseline.renewalNoticeDate)}</strong></div>
      <div><span>Readiness</span><strong>${escapeHtml(args.profile.readyForOptimization)}</strong></div>
    </div>
  </header>
  <section>
    <h2>Executive Recommendation</h2>
    <ul>${story.executiveMessage.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
  <section>
    <h2>Contract Baseline</h2>
    ${table(["Field", "Value"], [
      ["Incumbent", args.profile.incumbentVendorName],
      ["Term", `${args.profile.contractBaseline.termStart} to ${args.profile.contractBaseline.termEnd}`],
      ["Renewal notice date", args.profile.contractBaseline.renewalNoticeDate],
      ["Evidence references", String(args.profile.contractBaseline.evidenceCount)],
      ["Extraction boundary", args.profile.extractionBoundary],
    ])}
  </section>
  <section>
    <h2>Optimization Findings</h2>
    ${table(["Finding", "Severity", "Current evidence", "Recommended action"], args.profile.findings.map((finding) => [
      finding.title,
      finding.severity,
      finding.currentState,
      finding.recommendedAction,
    ]))}
  </section>
  <section>
    <h2>Negotiation Levers</h2>
    ${table(["Buyer ask", "Owner", "Value basis", "Impact"], args.profile.levers.map((lever) => [
      lever.buyerAsk,
      lever.ownerRole,
      lever.valueBasis,
      impactRange(lever.annualImpactLowUsd, lever.annualImpactHighUsd),
    ]))}
  </section>
  <section>
    <h2>Evidence Inventory and Caveats</h2>
    ${table(["Evidence", "Role", "Reference", "Source"], args.profile.syntheticDemo ? args.profile.contractBaseline.evidenceCount ? args.profile.minimumViableExtractionAreas.map((area) => [
      area.area,
      area.status,
      area.evidenceLabels.join("; "),
      area.whyItMatters,
    ]) : [] : [])}
    <p class="note">Synthetic demo evidence supports this controlled proof. Production use must replace demo evidence with client-approved contract, spend, SLA, staffing, ticket and change-order sources.</p>
  </section>
  <section>
    <h2>Audit Trail</h2>
    ${table(["Item", "Status"], [
      ["Event code", args.eventCode],
      ["Generated", args.generatedAt],
      ["Recommendation", "Do not renew as-is; issue cure notice; renegotiate with conditions; preserve RFP fallback."],
      ["Do-nothing scenario", story.scenarios.find((scenario) => scenario.path === "do_nothing")?.outcome ?? "Exposure persists."],
    ])}
  </section>
</main>
</body>
</html>`;
}

export function contractOptimizationDealPackFilename(args: {
  eventCode: string;
  generatedAt: string;
}): string {
  return `abarva-source-contract-optimization-appendix-${slugify(args.eventCode)}-${args.generatedAt.slice(0, 10)}.html`;
}

function table(headers: string[], rows: string[][]): string {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function impactRange(low: number | null, high: number | null): string {
  if (!low && !high) return "Value to be quantified during vendor cure review";
  if (!low) return `Up to ${formatMoney(high ?? 0)}`;
  if (!high) return `At least ${formatMoney(low)}`;
  return `${formatMoney(low)} to ${formatMoney(high)}`;
}

function formatMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appendixStyles(): string {
  return `
*{box-sizing:border-box}body{margin:0;background:#f7f4ed;color:#10182f;font-family:Inter,Arial,sans-serif}.shell{width:min(1180px,calc(100vw - 48px));margin:32px auto 64px}.hero,section{background:#fff;border:1px solid #ddd6c8;border-radius:10px;padding:28px;margin-bottom:18px}.eyebrow{margin:0 0 10px;color:#51617d;text-transform:uppercase;letter-spacing:.16em;font:800 11px ui-monospace,monospace}h1,h2{font-family:Georgia,serif}h1{font-size:38px;line-height:1.08;margin:0 0 12px}h2{font-size:24px;margin:0 0 14px}.lede{font-size:17px;line-height:1.55;max-width:980px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:22px}.metrics div{border:1px solid #e0d8c8;background:#fbfaf7;padding:14px}.metrics span{display:block;text-transform:uppercase;letter-spacing:.08em;font:800 10px ui-monospace,monospace;color:#69748a}.metrics strong{display:block;margin-top:8px;font-size:17px}table{width:100%;border-collapse:collapse;background:#fff}th,td{border:1px solid #ded7c8;padding:10px 11px;text-align:left;vertical-align:top;font-size:12px;line-height:1.42}th{background:#f0ece4;text-transform:uppercase;letter-spacing:.05em;font-size:10px}.note{color:#5b6475;line-height:1.5}li{margin:8px 0;line-height:1.45}@media(max-width:800px){.metrics{grid-template-columns:1fr}.shell{width:calc(100vw - 24px);margin-top:12px}.hero,section{padding:20px}h1{font-size:30px}}
`;
}
