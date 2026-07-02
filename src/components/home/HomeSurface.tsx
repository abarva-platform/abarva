"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useCallback, useMemo, useState } from "react";
import {
  AvaChatShell,
  type AvaCanvasTab,
} from "@/components/ava-chat/AvaChatShell";
import type {
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  HomeKnowCitation,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
} from "@/lib/intelligence/binding/binding-payload";
import { demoSafeClientText } from "@/lib/client-config";
import type {
  HomeV6BrowserPreview,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";
import {
  buildHomeV6ContextFindings,
  type HomeV6ContextFinding,
} from "@/lib/home/v6/home-v6-context-findings";

const CSS = `
.homex{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;--hb:#0A76D8;--ham:#A66A1F;--hr:#a32d2d;--hcard:#fff;--hbg:#FBFAF7;background:var(--hbg);min-height:100%;color:var(--hi);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px}
.homex .hx-shell{display:block;min-height:100%}
.homex .hx-rail{border-bottom:1px solid var(--hl);padding:10px 40px;background:#fff}
.homex .hx-navWrap{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px}
.homex .hx-railLabel{display:flex;align-items:center;gap:8px;color:var(--hm);font-size:12px}
.homex .hx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.homex .hx-select{min-width:min(360px,100%);border:1px solid var(--hl);border-radius:8px;background:#fff;color:var(--hi);font:inherit;font-size:13px;padding:8px 32px 8px 10px}
.homex .hx-select:focus{outline:2px solid rgba(34,174,234,.22);border-color:#22AEEA}
.homex .hx-rail-h,.homex .hx-rail-g{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homex .hx-canvas{padding:0 0 80px;max-width:none;min-width:0;min-height:100%}
.homex .hx-body{padding:18px 40px 0;max-width:1360px;margin:0 auto}
.homex .hx-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homex .hx-h2{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:26px;letter-spacing:-.01em;margin:8px 0 6px}
.homex .hx-stats{display:flex;flex-wrap:wrap;gap:26px;margin:18px 0 6px;padding-bottom:18px;border-bottom:1px solid var(--hl)}
.homex .hx-stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--hf)}
.homex .hx-stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.homex .hx-sec{margin-top:26px}
.homex .hx-sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.homex .hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:680px){.homex .hx-grid{grid-template-columns:1fr}.homex .hx-rail,.homex .hx-body{padding-left:18px;padding-right:18px}.homex .hx-navWrap{display:grid}.homex .hx-select{width:100%;min-width:0}}
.homex .hx-card{background:var(--hcard);border:1px solid var(--hl);border-radius:12px;padding:20px 22px}
.homex .hx-cardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.homex .hx-tags{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hm);margin-bottom:9px}
.homex .hx-card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:19px;line-height:1.22;margin:0 0 8px}
.homex .hx-card p{color:#3d3d36;font-size:13.5px;line-height:1.6;margin:0}
.homex .hx-evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--hm);margin-top:12px;padding-top:11px;border-top:1px solid var(--hl)}
.homex .hx-detail{margin-top:14px;border-top:1px solid var(--hl);padding-top:12px}
.homex .hx-detail summary{cursor:pointer;color:#0c1a3a;font-weight:750;font-size:12.5px}
.homex .hx-detailgrid{display:grid;gap:10px;margin-top:11px}
.homex .hx-detailblock{font-size:12.2px;line-height:1.45;color:#55554e}
.homex .hx-detailblock strong{display:block;color:#1a1a18;margin-bottom:3px}
.homex .hx-rowrefs{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.homex .hx-rowrefs li{border:1px solid #eee9dd;border-radius:8px;padding:8px 9px;background:#fff;color:#32322d;font-size:12px;line-height:1.35}
.homex .hx-rowrefs code{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;color:#66708a}
.homex .hx-cpat{background:var(--hcard);border:1px solid var(--hl);border-radius:10px;padding:14px 16px}
.homex .hx-cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hg);margin-bottom:6px}
.homex .hx-cpat h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:16px;margin:0 0 5px}
.homex .hx-cpat p{color:var(--hm);font-size:12.5px;margin:0}
.homex .hx-meter{height:6px;border-radius:3px;background:#EDEAE2;overflow:hidden;margin-top:8px}
.homex .hx-meter span{display:block;height:100%}
.homex .hx-badge{display:inline-flex;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:#EEF6E9;color:var(--hg);padding:3px 9px;border-radius:4px}
.homex .hx-hint{color:var(--hf);font-size:12.5px;margin-top:24px;display:flex;align-items:center;gap:8px}
.homex .hx-browser{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:18px;margin-top:22px}
@media(max-width:900px){.homex .hx-browser{grid-template-columns:1fr}}
.homex .hx-panel{border-top:1px solid var(--hl);padding-top:16px}
.homex .hx-panel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:18px;font-weight:500;margin:0 0 10px}
.homex .hx-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.homex .hx-list li{position:relative;padding-left:16px;color:#32322d;font-size:13.5px;line-height:1.5}
.homex .hx-list li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:6px;border-radius:50%;background:#1f7a4b}
.homex .hx-asklist{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.homex .hx-asklist li{border:1px solid var(--hl);border-radius:8px;background:#fff;padding:9px 11px;color:#19233a;font-size:13px;line-height:1.35}
.homex .hx-explain{background:#fff;border:1px solid var(--hl);border-radius:10px;padding:13px 14px;color:#4c4b43;font-size:12.5px;line-height:1.55}
.homex .hx-explain strong{color:#171713}
.homex .hx-preview{margin-top:26px;border-top:1px solid var(--hl);padding-top:18px}
.homex .hx-previewIntro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;margin-bottom:12px}
@media(max-width:760px){.homex .hx-previewIntro{grid-template-columns:1fr}}
.homex .hx-previewTitle{display:grid;gap:4px}
.homex .hx-previewTitle strong{font-family:var(--font-fraunces),Georgia,serif;font-size:18px;font-weight:500;color:var(--hi)}
.homex .hx-previewTitle span{color:var(--hm);font-size:12.5px;line-height:1.45}
.homex .hx-previewMeta{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
@media(max-width:760px){.homex .hx-previewMeta{justify-content:flex-start}}
.homex .hx-tablewrap{overflow:auto;border:1px solid var(--hl);border-radius:10px;background:#fff;margin-top:10px;box-shadow:0 1px 0 rgba(20,20,18,.03)}
.homex .hx-table{width:100%;border-collapse:collapse;min-width:640px;font-size:12.5px}
.homex .hx-table th{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#66708a;text-align:left;background:#FAF9F5;border-bottom:1px solid var(--hl);padding:10px 12px;white-space:nowrap}
.homex .hx-table td{border-bottom:1px solid #F0EDE5;padding:10px 12px;color:#242421;vertical-align:top;line-height:1.35}
.homex .hx-table td:has(.hx-gapcell){background:#FFFCF6;color:#7A5A1F}
.homex .hx-table tr:last-child td{border-bottom:0}
.homex .hx-mini{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.homex .hx-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hl);border-radius:999px;background:#fff;padding:5px 9px;color:#55554e;font-size:12px}
.homex .hx-chip strong{color:#1b1b18}
.homex .hx-chipWarn{background:#FFF5DB;color:#7A5A1F;border-color:#E8D3A2}
.homex .hx-gapcell{display:inline-flex;align-items:center;border-radius:999px;background:#FFF5DB;color:#7A5A1F;padding:2px 8px;font-size:11.5px;font-weight:700}
`;

const CONTEXT_BROWSER_QUESTIONS = [
  "What context is loaded, and what can we trust?",
  "Which areas are strongest, and which are thin?",
  "Show the systems, data, vendors, and risks as tables.",
  "What can aVa answer confidently from this context?",
  "Where should I go next: Tower, Source, Intelligence, or Moves?",
  "What evidence is missing before decisions?",
];

const EMPTY_DIMS: BindingDimension[] = [];

const TECHNICAL_STRING_FIELDS = new Set([
  "id",
  "key",
  "client",
  "clientKey",
  "tenantId",
  "tenantKey",
]);

function sanitizeVisibleStrings<T>(value: T, fieldName?: string): T {
  if (
    typeof value === "string" &&
    fieldName &&
    TECHNICAL_STRING_FIELDS.has(fieldName)
  ) {
    return value;
  }
  if (typeof value === "string") return demoSafeClientText(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeVisibleStrings(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeVisibleStrings(entry, key),
      ]),
    ) as T;
  }
  return value;
}

function contextBrowserQuestions(dimensions: BindingDimension[]): string[] {
  const labels = dimensions.map((dimension) =>
    dimension.dimension.toLowerCase(),
  );
  const questions = [...CONTEXT_BROWSER_QUESTIONS];
  if (
    labels.some(
      (label) => label.includes("data") || label.includes("analytics"),
    )
  ) {
    questions.push(
      "Show our data products in a table with domain and owning team.",
    );
  }
  if (
    labels.some(
      (label) => label.includes("integration") || label.includes("interface"),
    )
  ) {
    questions.push("Map relationships between systems and integrations.");
  }
  return questions.slice(0, 6);
}

function toneFor(trust: number): string {
  if (trust >= 75) return "var(--hg)";
  if (trust >= 50) return "var(--ham)";
  return "var(--hr)";
}

function FindingCard({ finding }: { finding: HomeV6ContextFinding }) {
  return (
    <div className="hx-card">
      <div className="hx-cardTop">
        <div className="hx-tags">
          {finding.claimBasis.replace(/_/g, " ")}
          {finding.patternContextUsed ? " · pattern context used" : ""}
        </div>
        <span className="hx-badge">{finding.confidence} confidence</span>
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.executiveFinding}</p>
      <p style={{ marginTop: 8 }}>{finding.whyItMatters}</p>
      <div className="hx-evi">
        {finding.sourceRowCount.toLocaleString()} V6 rows ·{" "}
        {finding.sourceFiles.length} source file
        {finding.sourceFiles.length === 1 ? "" : "s"} · next:{" "}
        {surfaceLabel(finding.recommendedSurface)}
      </div>
      <div className="hx-mini" aria-label="Supporting dimensions">
        {finding.supportingDimensions.slice(0, 4).map((dimension) => (
          <span className="hx-chip" key={dimension}>
            {dimension}
          </span>
        ))}
      </div>
      {finding.evidenceGaps.length > 0 ? (
        <div className="hx-mini" aria-label="Evidence gaps">
          {finding.evidenceGaps.slice(0, 3).map((gap) => (
            <span className="hx-chip hx-chipWarn" key={gap}>
              Needs evidence: {gap}
            </span>
          ))}
        </div>
      ) : null}
      <details className="hx-detail">
        <summary>Why this appears</summary>
        <div className="hx-detailgrid">
          <div className="hx-detailblock">
            <strong>Supporting V6 files</strong>
            {finding.sourceFiles.join(", ")}
          </div>
          <div className="hx-detailblock">
            <strong>Claim basis</strong>
            {claimBasisLabel(finding.claimBasis)}
            {finding.patternContextUsed
              ? " Pattern context used — not tenant proof."
              : ""}
          </div>
          <div className="hx-detailblock">
            <strong>Recommended next step</strong>
            {surfaceLabel(finding.recommendedSurface)}:{" "}
            {finding.recommendedQuestion}
          </div>
          {finding.evidenceRefs.length > 0 ? (
            <div className="hx-detailblock">
              <strong>Representative source rows</strong>
              <ul className="hx-rowrefs">
                {finding.evidenceRefs.slice(0, 3).map((ref) => (
                  <li key={`${ref.v6File}-${ref.rowId}`}>
                    <code>
                      {ref.v6File} · {ref.rowId}
                    </code>
                    <br />
                    {ref.label}
                    <br />
                    {ref.claimSupported}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function claimBasisLabel(basis: HomeV6ContextFinding["claimBasis"]): string {
  if (basis === "tenant_fact") return "Tenant fact from V6 rows.";
  if (basis === "calculated") return "Calculated from V6 rows.";
  if (basis === "abarva_assessment")
    return "AbarVa assessment from V6 facts and gaps.";
  if (basis === "industry_pattern") return "Industry pattern context only.";
  return "Tenant facts plus pattern context.";
}

function surfaceLabel(
  surface: HomeV6ContextFinding["recommendedSurface"],
): string {
  if (surface === "home") return "Home";
  if (surface === "intelligence") return "Intelligence";
  if (surface === "tower") return "Tower";
  if (surface === "source") return "Source";
  return "Moves";
}

type DimensionBrowserSpec = {
  loaded: string[];
  browse: string[];
  ask: string[];
};

const DEFAULT_BROWSER_SPEC: DimensionBrowserSpec = {
  loaded: [
    "Summary records describing this part of the operating model.",
    "Source-backed facts that aVa can use when answering context questions.",
    "Coverage and confidence indicators showing whether this area is strong or thin.",
  ],
  browse: [
    "What is known in this area",
    "Which adjacent areas it connects to",
    "What evidence gaps should be closed before decisions rely on it",
  ],
  ask: [
    "What is loaded in this area?",
    "What can we answer confidently here?",
    "What information is missing or thin?",
  ],
};

const DIMENSION_BROWSER_SPECS: Record<string, DimensionBrowserSpec> = {
  "Enterprise Profile": {
    loaded: [
      "Company shape, industry context, scale indicators, operating priorities, and enterprise-level constraints.",
      "The business backdrop aVa should use before answering module-specific questions.",
      "Known boundaries for what this demo tenant represents.",
    ],
    browse: [
      "Enterprise profile and operating context",
      "Strategic priorities and constraints",
      "Where tenant facts are strong versus assumed",
    ],
    ask: [
      "Summarize this enterprise in one executive brief.",
      "What makes this company complex from a technology perspective?",
      "What context is missing before we brief a CIO?",
    ],
  },
  "Business & Operating Model": {
    loaded: [
      "Business functions, operating ownership, value-chain shape, and where process complexity concentrates.",
      "Function-level context that helps aVa avoid generic technology answers.",
      "Connections into finance, operations, technology, risk, and data domains.",
    ],
    browse: [
      "Business functions and ownership model",
      "Operating complexity by area",
      "Business-to-technology dependencies",
    ],
    ask: [
      "Show the business functions loaded for this tenant.",
      "Where does operating complexity concentrate?",
      "Which business areas depend most on technology change?",
    ],
  },
  "Workforce & Personas": {
    loaded: [
      "User groups, leader roles, frontline personas, adoption constraints, and where AI may change work.",
      "Role-level evidence aVa can use when explaining adoption, training, or operating-model risk.",
      "Where named-person coverage is available or still thin.",
    ],
    browse: [
      "Leader roles and affected personas",
      "Adoption risks and workflow impact",
      "Missing named-owner or persona evidence",
    ],
    ask: [
      "Which teams or roles are most affected?",
      "Where do we have named ownership versus only role-level ownership?",
      "What adoption risks should we plan for?",
    ],
  },
  "Business Metrics": {
    loaded: [
      "Outcome metrics, demand indicators, performance indicators, and value measures that define success.",
      "Metric context used to separate activity from provable value.",
      "Known baseline or maturity gaps where a metric cannot yet be trusted.",
    ],
    browse: [
      "Outcome metrics and baselines",
      "Value measures tied to initiatives",
      "Measurement gaps and proof limits",
    ],
    ask: [
      "Which business metrics are loaded?",
      "What value can we prove today?",
      "Which metrics are too thin for executive reporting?",
    ],
  },
  "Capabilities & Value Streams": {
    loaded: [
      "Business capabilities, value streams, process areas, and where technology should change how work runs.",
      "Capability context that links AI or systems work to business outcomes.",
      "Cross-functional areas where change should be sequenced rather than funded in isolation.",
    ],
    browse: [
      "Loaded business capabilities",
      "Value streams and operating outcomes",
      "Change areas that span functions",
    ],
    ask: [
      "Which capabilities are loaded?",
      "What capabilities should AI or modernization improve?",
      "Where does work need to be redesigned?",
    ],
  },
  "Applications & Core Systems": {
    loaded: [
      "Application estate, systems of record, modernization pressure, ownership, and critical business dependencies.",
      "System-level facts aVa can use for architecture, risk, and roadmap questions.",
      "Where system owner, lifecycle, or dependency metadata is incomplete.",
    ],
    browse: [
      "Systems of record and major platforms",
      "Ownership and modernization pressure",
      "Dependencies into data, integration, and business operations",
    ],
    ask: [
      "Which systems of record are loaded?",
      "What systems carry the most modernization risk?",
      "Show systems by owner or business function.",
    ],
  },
  "Infrastructure & Cloud": {
    loaded: [
      "Cloud, hosting, infrastructure, capacity, platform, and operational readiness facts.",
      "Evidence for cloud posture, data-center constraints, run-cost exposure, and resilience.",
      "Known gaps in usage, capacity, or environment-level detail.",
    ],
    browse: [
      "Cloud and infrastructure footprint",
      "Run and resilience constraints",
      "Platform gaps affecting modernization",
    ],
    ask: [
      "What cloud and infrastructure facts are loaded?",
      "Where are the largest infrastructure risks?",
      "What do we not know about cloud cost or capacity?",
    ],
  },
  "Data & Analytics Estate": {
    loaded: [
      "Data platforms, data products, analytics tools, semantic ownership, and readiness caveats.",
      "Facts used to judge whether AI, reporting, or automation can be trusted.",
      "Quality, lineage, freshness, and ownership gaps where decisions need caution.",
    ],
    browse: [
      "Data products and analytics platforms",
      "Semantic ownership and quality constraints",
      "Readiness gates for AI or executive reporting",
    ],
    ask: [
      "What data platforms and products are loaded?",
      "Where is data quality blocking AI value?",
      "Which domains need certified data products?",
    ],
  },
  "Integrations & Interfaces": {
    loaded: [
      "APIs, interfaces, EDI, batch flows, middleware, integration dependencies, and brittle handoffs.",
      "Relationship facts that explain why one system or initiative depends on another.",
      "Known missing interface metadata such as cadence, owner, or failure mode.",
    ],
    browse: [
      "Loaded integrations and interfaces",
      "System dependency graph clues",
      "Integration gaps or fragility points",
    ],
    ask: [
      "Show the integration and dependency graph.",
      "Which systems depend on batch or EDI flows?",
      "Where are integration details missing?",
    ],
  },
  "Security & Compliance": {
    loaded: [
      "Control areas, compliance obligations, risk posture, evidence requirements, and gating constraints.",
      "Facts used to determine where AI or technology change needs approval or stronger proof.",
      "Missing control evidence that should block unsupported claims.",
    ],
    browse: [
      "Control and compliance coverage",
      "Risk areas tied to technology decisions",
      "Evidence gaps before governance approval",
    ],
    ask: [
      "What security and compliance evidence is loaded?",
      "Which risks should block scaling?",
      "What controls are missing or thin?",
    ],
  },
  "Vendors & Contracts": {
    loaded: [
      "Vendor roster, contract and renewal evidence, commercial concentration, sourcing relevance, and missing contract fields.",
      "Facts that support questions about who is under contract, what is renewing, what is commercially material, and what needs sourcing attention.",
      "Coverage indicators for contract value, renewal date, owner, scope, risk, and evidence quality.",
    ],
    browse: [
      "Loaded vendor and contract coverage",
      "Renewal calendar and commercial exposure",
      "Missing vendor, contract, or pricing evidence",
    ],
    ask: [
      "Show vendor and contract coverage.",
      "Which renewals or vendors need attention?",
      "What contract fields are missing before Source can act?",
    ],
  },
  "IT Budget & Financials": {
    loaded: [
      "Run, change, AI/data, labor, vendor, cloud, program, and portfolio spend records.",
      "Finance facts used to answer spend, value, and budget allocation questions.",
      "Where amounts, time periods, or cost categories are missing or not board-grade.",
    ],
    browse: [
      "Budget and spend coverage",
      "Run versus change and vendor/cloud/labor exposure",
      "Finance gaps before Tower reporting",
    ],
    ask: [
      "What budget and spend facts are loaded?",
      "Show spend by category or business area.",
      "Which spend numbers are not yet fully supported?",
    ],
  },
  "AI & Automation Footprint": {
    loaded: [
      "AI initiatives, tools, model or agent usage, gates, adoption evidence, and operating controls.",
      "Facts that help distinguish AI activity from real changes in work.",
      "Missing adoption, usage, value, or governance evidence.",
    ],
    browse: [
      "AI initiatives and automation footprint",
      "Adoption and governance evidence",
      "Value-proof gaps",
    ],
    ask: [
      "Which AI initiatives are loaded?",
      "Where is AI being used versus only piloted?",
      "What evidence is missing before we scale AI?",
    ],
  },
  "Initiatives & Roadmap": {
    loaded: [
      "Active initiatives, roadmap items, promised value, dependencies, milestones, owners, and risk posture.",
      "Facts that support sequencing, prioritization, and change-package questions.",
      "Missing milestone, owner, dependency, or value evidence.",
    ],
    browse: [
      "Initiatives and roadmap coverage",
      "Dependencies and sequencing pressure",
      "Execution gaps before Moves or Tower action",
    ],
    ask: [
      "Which initiatives are loaded?",
      "What should move first, pause, or be sequenced?",
      "Which initiatives lack owner or value proof?",
    ],
  },
  "Benefits Realization": {
    loaded: [
      "Expected benefits, realized value, adoption proof, outcome evidence, and value-tracking gaps.",
      "Facts that help aVa say whether value is proven, claimed, or still thin.",
      "Where measurement design or finance validation is missing.",
    ],
    browse: [
      "Benefit and value evidence",
      "Adoption and outcome proof",
      "Unvalidated value claims",
    ],
    ask: [
      "What benefits are proven versus claimed?",
      "Where do we need better value evidence?",
      "Which initiatives should Tower track for benefits?",
    ],
  },
  "Risk & RAID Log": {
    loaded: [
      "Open risks, assumptions, issues, dependencies, constraints, mitigation status, and escalation context.",
      "Evidence aVa can use to explain blockers, caveats, and decision gates.",
      "Missing severity, owner, mitigation, or due-date details.",
    ],
    browse: [
      "Risks, assumptions, issues, and dependencies",
      "Mitigation and escalation coverage",
      "Risk fields that are missing or stale",
    ],
    ask: [
      "What risks and dependencies are loaded?",
      "Which blockers need executive attention?",
      "What risk evidence is missing?",
    ],
  },
  "Operations & Service": {
    loaded: [
      "Service-management evidence, operational health, incident/change/service patterns, and delivery constraints.",
      "Facts that link technology operations to reliability, adoption, and execution risk.",
      "Missing service metrics, owner, SLA, or operational evidence.",
    ],
    browse: [
      "Operations and service coverage",
      "Delivery and reliability patterns",
      "Operational gaps affecting execution",
    ],
    ask: [
      "What operations and service facts are loaded?",
      "Where are service risks blocking change?",
      "Which operational metrics are thin?",
    ],
  },
  "AI Governance & Policy": {
    loaded: [
      "Responsible-AI policies, human-in-the-loop gates, monitoring rules, model controls, and usage constraints.",
      "Evidence aVa uses to determine whether AI can scale safely.",
      "Missing governance, policy, approval, or monitoring proof.",
    ],
    browse: [
      "AI governance and policy coverage",
      "Human review and monitoring gates",
      "Governance gaps before scaling",
    ],
    ask: [
      "What AI governance evidence is loaded?",
      "Which AI uses need approval gates?",
      "What policy evidence is missing?",
    ],
  },
  "Industry Benchmarks": {
    loaded: [
      "Outside-in industry patterns, benchmark context, peer analogs, and pattern-fit guidance.",
      "Industry context used as advisory pattern context, not tenant fact.",
      "Where external patterns should not be treated as company-specific evidence.",
    ],
    browse: [
      "Industry pattern context",
      "Peer-style benchmarks and caveats",
      "Pattern context versus tenant-specific proof",
    ],
    ask: [
      "Which industry patterns apply here?",
      "Where does this tenant look ahead or behind peers?",
      "What is pattern context versus loaded tenant fact?",
    ],
  },
};

function browserSpecForDimension(dimension: string): DimensionBrowserSpec {
  return DIMENSION_BROWSER_SPECS[dimension] ?? DEFAULT_BROWSER_SPEC;
}

function DimensionView({
  dim,
  preview,
  findings,
}: {
  dim: BindingDimension;
  preview?: HomeV6BrowserPreview | null;
  findings: HomeV6ContextFinding[];
}) {
  const related = findings.filter((finding) =>
    finding.supportingDimensions.includes(dim.dimension),
  );
  const spec = browserSpecForDimension(dim.dimension);
  return (
    <div className="hx-body">
      <div className="hx-ey">Loaded context dimension</div>
      <h2 className="hx-h2">{dim.dimension}</h2>
      <p style={{ color: "var(--hm)", maxWidth: "64ch" }}>{dim.description}</p>
      <div className="hx-stats">
        <div className="hx-stat">
          <div className="k">Status</div>
          <div className="v" style={{ fontSize: 16 }}>
            <span className="hx-badge">{dim.status}</span>
          </div>
        </div>
        <div className="hx-stat">
          <div className="k">Loaded records</div>
          <div className="v">{dim.evidence.toLocaleString()}</div>
        </div>
        <div className="hx-stat">
          <div className="k">Sources</div>
          <div className="v">{dim.sources}</div>
        </div>
        <div className="hx-stat" style={{ minWidth: 140 }}>
          <div className="k">Confidence</div>
          <div className="v">{dim.trust}%</div>
          <div className="hx-meter">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, dim.trust))}%`,
                background: toneFor(dim.trust),
              }}
            />
          </div>
        </div>
      </div>
      <div className="hx-browser">
        <section className="hx-panel" aria-label="What is loaded">
          <h3>What is loaded here</h3>
          <ul className="hx-list">
            {spec.loaded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="hx-panel" aria-label="How to browse this context">
          <h3>How to browse it</h3>
          <ul className="hx-asklist">
            {spec.ask.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <div className="hx-browser" style={{ marginTop: 16 }}>
        <section className="hx-panel" aria-label="Available detail types">
          <h3>Detail types available</h3>
          <ul className="hx-list">
            {spec.browse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <aside className="hx-explain" aria-label="What the numbers mean">
          <strong>How to read the numbers:</strong> evidence points are loaded,
          source-backed context items aVa can use in answers. Sources are the
          distinct loaded files or source families behind this area. Confidence
          is a coverage score for answerability, not a guarantee that every
          field is complete.
        </aside>
      </div>
      {dim.flag ? (
        <p style={{ color: "var(--ham)", fontSize: 13, marginTop: 14 }}>
          ⚑ {dim.flag}
        </p>
      ) : null}
      {preview ? (
        <div className="hx-preview">
          <div className="hx-previewIntro">
            <div className="hx-previewTitle">
              <div className="hx-ey">V6 source preview</div>
              <strong>{preview.title}</strong>
              <span>
                First loaded rows from the source table aVa uses for this area.
              </span>
            </div>
            <div className="hx-previewMeta" aria-label="V6 table coverage">
              <span className="hx-chip">
                <strong>{preview.rowCount.toLocaleString()}</strong> rows
              </span>
              <span className="hx-chip">
                <strong>{preview.sourceCount}</strong> V6 file
                {preview.sourceCount === 1 ? "" : "s"}
              </span>
              <span className="hx-chip">
                <strong>{preview.dataThinCells.toLocaleString()}</strong>{" "}
                evidence gaps
              </span>
            </div>
          </div>
          <div className="hx-tablewrap">
            <table className="hx-table">
              <thead>
                <tr>
                  {preview.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={`${preview.dimension}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${preview.dimension}-${rowIndex}-${cellIndex}`}>
                        {cell === "Needs evidence" ? (
                          <span className="hx-gapcell">{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hx-mini" aria-label="V6 table coverage">
            {preview.fileNames.slice(0, 2).map((fileName) => (
              <span className="hx-chip" key={fileName}>
                {fileName}
              </span>
            ))}
          </div>
          {preview.knownGaps.length > 0 ? (
            <div className="hx-mini" aria-label="Top missing fields">
              {preview.knownGaps.map((gap) => (
                <span className="hx-chip" key={gap.label}>
                  Missing {gap.label.toLowerCase()}:{" "}
                  <strong>{gap.count}</strong>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {related.length > 0 && (
        <div className="hx-sec">
          <div className="hx-sechead">
            <span className="hx-ey">Context findings tied to this area</span>
          </div>
          <div className="hx-grid">
            {related.map((finding) => (
              <FindingCard finding={finding} key={finding.findingId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({
  payload,
  v6Browser,
  findings,
}: {
  payload: IntelligenceBindingPayload | null;
  v6Browser: HomeV6ContextBrowser | null | undefined;
  findings: HomeV6ContextFinding[];
}) {
  const dimensions = Object.values(v6Browser?.dimensions ?? {});
  const dimensionCount = dimensions.length || payload?.context.length || 0;
  const v6Rows = dimensions.reduce(
    (sum, dimension) => sum + dimension.rowCount,
    0,
  );
  const v6Files = new Set(
    dimensions.flatMap((dimension) => dimension.fileNames),
  ).size;
  const evidenceGaps = dimensions.reduce(
    (sum, dimension) => sum + dimension.dataThinCells,
    0,
  );
  return (
    <div className="hx-body">
      <div className="hx-ey">Current-state context</div>
      <h2 className="hx-h2">What we know about your enterprise.</h2>
      {dimensionCount > 0 ? (
        <div className="hx-stats">
          <div className="hx-stat">
            <div className="k">Context areas</div>
            <div className="v">{dimensionCount}</div>
          </div>
          <div className="hx-stat">
            <div className="k">V6 records</div>
            <div className="v">{v6Rows.toLocaleString()}</div>
          </div>
          <div className="hx-stat">
            <div className="k">V6 files</div>
            <div className="v">{v6Files}</div>
          </div>
          <div className="hx-stat">
            <div className="k">Evidence gaps</div>
            <div className="v">{evidenceGaps.toLocaleString()}</div>
          </div>
        </div>
      ) : null}

      {findings.length > 0 && (
        <div className="hx-sec">
          <div className="hx-sechead">
            <span className="hx-ey">Context findings</span>
            <span className="hx-ey">{findings.length} V6 findings</span>
          </div>
          <div className="hx-grid">
            {findings.map((finding) => (
              <FindingCard finding={finding} key={finding.findingId} />
            ))}
          </div>
        </div>
      )}

      <div className="hx-hint">
        <span className="hx-dot" style={{ background: "var(--hb)" }} />
        Pick a context dot above, or ask in the aVa panel.
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  return (
    isRecord(value) &&
    value.mode === "KNOW" &&
    typeof value.tenantKey === "string" &&
    typeof value.question === "string" &&
    typeof value.prose === "string" &&
    Array.isArray(value.tables) &&
    Array.isArray(value.charts) &&
    Array.isArray(value.graphs) &&
    Array.isArray(value.citations)
  );
}

function messageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function citationClass(citation: HomeKnowCitation) {
  if (citation.sourceClass === "tenant-relationship") return "graph" as const;
  if (citation.sourceClass === "tenant-source-file")
    return "tenant-chunk" as const;
  return "tenant-fact" as const;
}

function toAvaAnswerPacket(response: HomeKnowResponse): AvaAnswerPacket {
  const tables = response.tables.map((table) => ({
    id: table.id,
    title: table.title,
    columns: table.columns,
    rows: table.rows.map((row) => {
      const normalized: Record<string, string | number | null> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[key] = typeof value === "boolean" ? String(value) : value;
      });
      return normalized;
    }),
    note: table.note,
    citationIds: table.citationIds,
  }));
  const charts = response.charts.map((chart) => ({
    id: chart.id,
    kind: "cost-stack" as const,
    title: chart.title,
    data: chart.data.map((point, index) => ({
      label: point.label,
      value: point.value,
      color:
        point.color ?? ["#0f5ba7", "#1f6b3a", "#d8e4f2", "#7a8ca5"][index % 4],
    })),
    citationIds: chart.citationIds,
  }));
  const graphs = response.graphs.map((graph) => ({
    id: graph.id,
    title: graph.title,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.type,
    })),
    edges: graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      kind: edge.type,
    })),
    citationIds: graph.citationIds,
  }));

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: response.tenantKey,
    question: response.question,
    intent: response.intent,
    status: response.answerStatus,
    directAnswer: response.prose,
    prose: response.prose,
    factsUsed: response.facts.map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: fact.value,
      citationIds: fact.citationIds,
    })),
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      ...tables.map((table) => ({ ...table, artifact: "table" as const })),
      ...charts.map((chart) => ({ ...chart, artifact: "chart" as const })),
      ...graphs.map((graph) => ({ ...graph, artifact: "graph" as const })),
    ],
    tables,
    charts,
    graphs,
    citations: response.citations.map((citation) => ({
      id: citation.id,
      label: citation.label,
      sourceClass: citationClass(citation),
      recordId: citation.recordId ?? undefined,
      excerpt: citation.excerpt ?? undefined,
      confidence: citation.confidence,
    })),
    gaps: response.gaps.map((gap) => ({
      id: gap.id,
      label: gap.displayLabel,
      detail: gap.message,
      severity: gap.severity,
      citationIds: gap.citationIds,
    })),
    caveats: [
      ...response.conflicts.map((conflict) => ({
        id: conflict.id,
        label: conflict.label,
        detail: conflict.description,
      })),
      ...response.charts.flatMap((chart) =>
        chart.caveats.map((caveat, index) => ({
          id: `${chart.id}-caveat-${index}`,
          label: chart.title,
          detail: caveat,
        })),
      ),
    ],
    nextSteps: response.handoff
      ? [
          {
            id: "home-know-handoff",
            label: response.handoff.label,
            rationale: response.handoff.reason,
            targetSurface: response.handoff.target ?? undefined,
          },
        ]
      : [],
    quality: {
      confidence: response.answerStatus === "answered" ? "high" : "medium",
      evidenceStrength:
        response.answerStatus === "answered" ? "strong" : "partial",
      tenantGrounding: response.citations.length > 0 ? "complete" : "partial",
      answerCompleteness:
        response.answerStatus === "answered" ? "complete" : "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: !response.safety.frontendTripwireShouldFire,
      unsupportedClaimsBlocked: true,
    },
  };
}

function textFallback(response: HomeKnowResponse): string {
  const lines = [response.prose.trim()].filter(Boolean);
  const exhibitParts = [
    response.tables.length ? `${response.tables.length} table` : null,
    response.charts.length ? `${response.charts.length} chart` : null,
    response.graphs.length ? `${response.graphs.length} graph` : null,
  ].filter(Boolean);
  if (exhibitParts.length > 0) {
    lines.push(`Details available: ${exhibitParts.join(", ")}.`);
  }
  if (response.gaps.length > 0) {
    lines.push(
      `Open gaps: ${response.gaps
        .slice(0, 3)
        .map((gap) => gap.message)
        .join("; ")}.`,
    );
  }
  if (response.handoff) {
    lines.push(`${response.handoff.label}: ${response.handoff.reason}`);
  }
  return lines.join("\n\n") || "I do not see that in the loaded data.";
}

export function HomeSurface({
  payload,
  clientKey,
  v6Browser,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
  v6Browser?: HomeV6ContextBrowser | null;
}) {
  const safePayload = useMemo(() => sanitizeVisibleStrings(payload), [payload]);
  const safeV6Browser = useMemo(
    () => sanitizeVisibleStrings(v6Browser),
    [v6Browser],
  );
  const dims = safePayload?.context ?? EMPTY_DIMS;
  const [dimKey, setDimKey] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const tenantKey = safePayload?.tenant.key ?? clientKey ?? null;
  const tenantDisplayName = safePayload?.tenant.displayName ?? "Enterprise";
  const findings = useMemo(
    () => sanitizeVisibleStrings(buildHomeV6ContextFindings(safeV6Browser)),
    [safeV6Browser],
  );
  const selected = dimKey
    ? (dims.find((d) => d.dimension === dimKey) ?? null)
    : null;

  const askHomeKnow = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;

      const userTurn: ChatMessage = {
        id: messageId("home-user"),
        role: "user",
        body: question,
        at: new Date().toISOString(),
      };
      const agentTurnId = messageId("home-ava");
      const pendingTurn: ChatMessage = {
        id: agentTurnId,
        role: "agent",
        body: "",
        at: new Date().toISOString(),
      };

      setThread((current) => [...current, userTurn, pendingTurn]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            client: clientKey ?? tenantKey,
            tenantKey,
          }),
        });
        const json: unknown = await res.json();
        if (!res.ok || !isHomeKnowResponse(json)) {
          throw new Error("Home KNOW returned an invalid response.");
        }
        const response = sanitizeVisibleStrings(
          shapeHomeKnowResponseForRender(json),
        );
        const body = textFallback(response);
        const agentAnswer = toAvaAnswerPacket(response);
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body,
                  agentAnswer,
                }
              : turn,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Home KNOW could not answer that question.";
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body: message,
                }
              : turn,
          ),
        );
      } finally {
        setIsBusy(false);
      }
    },
    [clientKey, tenantKey],
  );

  const suggestedActions = useMemo<SuggestedAction[]>(
    () =>
      contextBrowserQuestions(dims)
        .slice(0, 3)
        .map((question, index) => ({
          id: `home-know-suggested-${index}`,
          label: question,
          body: question,
          onClick: () => {
            void askHomeKnow(question);
          },
        })),
    [askHomeKnow, dims],
  );

  const tabs = useMemo<AvaCanvasTab[]>(
    () => [
      { id: "overview", label: "Overview" },
      { id: "context", label: "Context", count: dims.length },
      { id: "findings", label: "Context findings", count: findings.length },
    ],
    [dims.length, findings.length],
  );

  const canvas = (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hx-shell">
        <main className="hx-canvas">
          <div className="hx-rail" aria-label="Context Explorer tabs">
            <div className="hx-rail-h">Context Explorer</div>
            <div className="hx-navWrap">
              <div className="hx-railLabel">
                <span className="hx-dot" style={{ background: "var(--hb)" }} />
                <span>
                  {dims.length
                    ? `${dims.length} context areas loaded`
                    : "Context areas"}
                </span>
              </div>
              <select
                aria-label="Choose context dimension"
                className="hx-select"
                onChange={(event) =>
                  setDimKey(event.currentTarget.value || null)
                }
                value={dimKey ?? ""}
              >
                <option value="">Overview</option>
                {dims.map((d) => (
                  <option key={d.dimension} value={d.dimension}>
                    {d.dimension} · {d.trust}% confidence
                  </option>
                ))}
              </select>
            </div>
            {dims.length > 0 && (
              <div className="hx-rail-g">Context areas · {dims.length}</div>
            )}
          </div>
          {selected ? (
            <DimensionView
              dim={selected}
              preview={safeV6Browser?.dimensions[selected.dimension] ?? null}
              findings={findings}
            />
          ) : (
            <Overview
              payload={safePayload}
              v6Browser={safeV6Browser}
              findings={findings}
            />
          )}
        </main>
      </div>
    </div>
  );

  return (
    <AvaChatShell
      agent={{
        name: "aVa",
        role: `${tenantDisplayName} Home KNOW advisor`,
      }}
      canvas={canvas}
      defaultLeftPercent={34}
      isBusy={isBusy}
      minLeftPx={360}
      onMessage={askHomeKnow}
      placeholder="Ask about available context, systems, owners, vendors..."
      suggestedActions={suggestedActions}
      surface="home"
      surfaceContext={{
        clientKey,
        tenantKey,
        tabs,
        selectedDimension: dimKey,
      }}
      thread={thread}
    />
  );
}
