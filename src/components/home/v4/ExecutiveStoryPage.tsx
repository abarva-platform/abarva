"use client";

import type { CSSProperties } from "react";

import type {
  ChapterId,
  ChapterView,
  EnterpriseSignalPacket,
  GroundedClaim,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import { demoSafeClientText } from "@/lib/client-config";
import { sourceForIds } from "./source-label";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

type TerminalState = "published" | "refused" | "deferred";

interface StorySectionSpec {
  id: string;
  title: string;
  readerQuestion: string;
  chapterIds: ChapterId[];
  visualDataset?: string;
  visualTitle?: string;
  deepLink?: { id: string; label: string };
}

interface StorySection {
  spec: StorySectionSpec;
  state: TerminalState;
  leadClaim: GroundedClaim | null;
  supportingClaims: GroundedClaim[];
  limitations: string[];
  chapters: ChapterView[];
}

interface LeadNumber {
  value: string;
  label: string;
  claim: GroundedClaim;
}

const STORY_SECTIONS: StorySectionSpec[] = [
  {
    id: "enterprise",
    title: "What this enterprise is",
    readerQuestion: "How does the business create value, and which economics matter first?",
    chapterIds: ["our_business", "executive_brief"],
  },
  {
    id: "bets",
    title: "What it is betting on",
    readerQuestion: "Which strategic bets are funded, early, blocked, or still aspirational?",
    chapterIds: ["strategy_value_creation"],
    visualDataset: "stalled_programs",
    visualTitle: "Strategic work still early in execution",
  },
  {
    id: "runs-on",
    title: "What it runs on",
    readerQuestion: "Which application, data, and platform blocks carry the operating model?",
    chapterIds: ["how_we_operate", "technology_data"],
    visualDataset: "application_landscape_by_function",
    visualTitle: "Applications grouped by business function",
    deepLink: { id: "architecture", label: "Open architecture map" },
  },
  {
    id: "costs-returns",
    title: "What it costs and returns",
    readerQuestion: "What value is claimed, what is proven, and where is measurement weak?",
    chapterIds: ["performance_value"],
    visualDataset: "metric_target_attainment",
    visualTitle: "Outcome measures by target posture",
  },
  {
    id: "exposed",
    title: "What is exposed",
    readerQuestion: "Where do vendor, risk, data, and operational dependencies concentrate?",
    chapterIds: ["technology_data", "what_needs_attention"],
    visualDataset: "risk_system_concentration",
    visualTitle: "Risk concentration by named system",
    deepLink: { id: "data-flow", label: "Open data-flow view" },
  },
  {
    id: "attention",
    title: "What needs attention",
    readerQuestion: "Which decisions or investigations should leadership take up next?",
    chapterIds: ["what_needs_attention", "leadership_perspective"],
    visualDataset: "leadership_theme_frequency",
    visualTitle: "Leadership themes raised in interviews",
    deepLink: { id: "browse-the-data", label: "Open evidence browser" },
  },
];

const NUMBER_RE = /(?:\$[\d,.]+(?:[KMB])?|\b\d+(?:\.\d+)?%)/;
const PREFERRED_LEAD_RE = /\b(?:finance|validated|proven|claimable|promised|value|spend|cost|contracts|risk|complete|blocked)\b/i;

export function ExecutiveStoryPage({
  bundle,
  tenantKey,
  onOpenView,
  compiledLine,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
  onOpenView: (id: string) => void;
  compiledLine: string[];
}) {
  const signalPacket = bundle.thesis.signalPacket;
  const clientLabel = demoSafeClientText(labelFromTenantKey(tenantKey));
  const sections = buildStorySections(bundle.chapters);
  const leadNumber = chooseLeadNumber(sections);
  const terminalCount = sections.filter((section) => section.state).length;

  return (
    <div
      data-home-tier1-shell
      style={{
        display: "grid",
        gridTemplateColumns: "252px minmax(0,1fr)",
        minHeight: "100vh",
        background: V4.paper,
        color: V4.ink,
        fontFamily: SANS,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>
        {`
          @media (max-width: 980px) {
            [data-home-tier1-shell] {
              grid-template-columns: 1fr !important;
            }
            [data-home-tier1-rail] {
              position: static !important;
              height: auto !important;
              border-right: 0 !important;
              border-bottom: 1px solid ${V4.rule} !important;
            }
            [data-home-tier1-main] {
              padding-bottom: 72px !important;
            }
            [data-home-tier1-hero-metric],
            [data-home-tier1-section-body] {
              grid-template-columns: 1fr !important;
            }
            [data-home-tier1-section-header] {
              display: grid !important;
            }
            [data-home-tier1-deep-link] {
              justify-self: start !important;
            }
          }
        `}
      </style>
      <StoryRail
        clientLabel={clientLabel}
        sections={sections}
        terminalCount={terminalCount}
        compiledLine={compiledLine}
        onOpenView={onOpenView}
      />
      <main data-home-tier1-main style={{ minWidth: 0, paddingBottom: 120 }}>
        <Hero
          leadNumber={leadNumber}
          tenantLabel={clientLabel}
          signalPacket={signalPacket}
          terminalCount={terminalCount}
        />
        {sections.map((section, index) => (
          <StorySectionBlock
            key={section.spec.id}
            index={index + 1}
            section={section}
            signalPacket={signalPacket}
            visualDatasets={signalPacket.visualDatasets ?? {}}
            onOpenView={onOpenView}
          />
        ))}
        <EvidenceEntryPoints onOpenView={onOpenView} />
      </main>
    </div>
  );
}

function labelFromTenantKey(tenantKey: HomePreviewTenantKey): string {
  return tenantKey
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function buildStorySections(chapters: ChapterView[]): StorySection[] {
  const byId = new Map(chapters.map((chapter) => [chapter.chapterId, chapter]));
  return STORY_SECTIONS.map((spec) => {
    const sectionChapters = spec.chapterIds
      .map((id) => byId.get(id))
      .filter((chapter): chapter is ChapterView => Boolean(chapter));
    const claims = uniqueClaims(
      sectionChapters.flatMap((chapter) => [
        ...chapter.key_insights,
        ...chapter.tensions,
        ...chapter.what_to_watch,
      ]),
    );
    const limitations = Array.from(
      new Set(sectionChapters.flatMap((chapter) => chapter.limitations).filter(Boolean)),
    );
    const leadClaim = chooseSectionLeadClaim(claims);
    return {
      spec,
      state: claims.length > 0 ? "published" : limitations.length > 0 ? "refused" : "deferred",
      leadClaim,
      supportingClaims: claims.filter((claim) => claim.statement !== leadClaim?.statement).slice(0, 3),
      limitations,
      chapters: sectionChapters,
    };
  });
}

function uniqueClaims(claims: GroundedClaim[]): GroundedClaim[] {
  const seen = new Set<string>();
  const unique: GroundedClaim[] = [];
  for (const claim of claims) {
    if (seen.has(claim.statement)) continue;
    seen.add(claim.statement);
    unique.push(claim);
  }
  return unique;
}

function chooseSectionLeadClaim(claims: GroundedClaim[]): GroundedClaim | null {
  if (claims.length === 0) return null;
  return [...claims].sort((a, b) => scoreClaim(b) - scoreClaim(a))[0] ?? claims[0];
}

function chooseLeadNumber(sections: StorySection[]): LeadNumber | null {
  const claims = sections.flatMap((section) => [section.leadClaim, ...section.supportingClaims]).filter(
    (claim): claim is GroundedClaim => Boolean(claim),
  );
  const numbered = claims
    .map((claim) => ({ claim, match: claim.statement.match(NUMBER_RE)?.[0] ?? null }))
    .filter((item): item is { claim: GroundedClaim; match: string } => Boolean(item.match));
  if (numbered.length === 0) return null;
  const chosen =
    numbered.find((item) => /validated|proven|claimable|promised|value/i.test(item.claim.statement)) ??
    numbered[0];
  return {
    value: chosen.match,
    label: labelForNumber(chosen.claim.statement, chosen.match),
    claim: chosen.claim,
  };
}

function scoreClaim(claim: GroundedClaim): number {
  const text = claim.statement;
  return (
    (NUMBER_RE.test(text) ? 4 : 0) +
    (PREFERRED_LEAD_RE.test(text) ? 4 : 0) +
    (claim.claim_type === "CROSS_DOMAIN_INSIGHT" ? 2 : 0) +
    (claim.claim_type === "ADVISORY_INFERENCE" ? 1 : 0) +
    (claim.confidence === "high" ? 1 : 0)
  );
}

function labelForNumber(statement: string, value: string): string {
  const withoutValue = cxoText(statement).replace(value, "").replace(/\s+/g, " ").trim();
  if (/\bfinance-validated\b/i.test(statement)) return "finance-validated value in the current evidence";
  if (/\bpromised\b/i.test(statement)) return "promised value in the current evidence";
  if (/\bcomplete\b/i.test(statement)) return "execution progress cited by the record";
  if (/\bvendor|supplier|contract\b/i.test(statement)) return "commercial exposure cited by the record";
  return withoutValue.length > 90 ? `${withoutValue.slice(0, 90).trim()}...` : withoutValue;
}

function cxoText(text: string): string {
  return text
    .replace(/\btier[_-](\d+)\b/gi, "tier $1")
    .replace(/\bThis packet contains\b/gi, "The current evidence shows")
    .replace(/\bevidence package\b/gi, "evidence set")
    .replace(/\bgoverned contract record\b/gi, "contract evidence")
    .replace(/\bgoverned contract set\b/gi, "contract set")
    .replace(/\bready contract value\b/gi, "reviewed contract value")
    .replace(/\bECL\b/g, "governed")
    .replace(/\bprojection\b/gi, "view")
    .replace(/\bserving view\b/gi, "readout")
    .replace(/\bloaded rows?\b/gi, "records")
    .replace(/\bcanonical entit(?:y|ies)\b/gi, "governed record")
    .replace(/\bpayload\b/gi, "evidence packet")
    .replace(/\bschema\b/gi, "model")
    .replace(/\bsource room\b/gi, "source evidence")
    .replace(/\bwriter\b/gi, "narrative process")
    .replace(/\bprovider flag\b/gi, "configuration")
    .replace(/\bnot enough verified evidence yet\b/gi, "not yet supported by verified evidence")
    .replace(/\bcoverage gap in the build\b/gi, "coverage gap in the evidence");
}

function Hero({
  leadNumber,
  tenantLabel,
  signalPacket,
  terminalCount,
}: {
  leadNumber: LeadNumber | null;
  tenantLabel: string;
  signalPacket: EnterpriseSignalPacket;
  terminalCount: number;
}) {
  const source = leadNumber ? sourceForIds(leadNumber.claim.evidence_ids, signalPacket) : null;
  return (
    <header style={{ padding: `56px ${PAGE_X}px 40px` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <span style={eyebrow(V4.blue)}>Executive story</span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: V4.slate }}>
          A first-meeting readout for {tenantLabel}
        </span>
      </div>

      <div data-home-tier1-hero-metric style={heroMetricStyle}>
        <div>
          <span style={eyebrow(V4.green)}>Open on the number</span>
          <div style={heroNumberStyle}>{leadNumber?.value ?? "Deferred"}</div>
          <p style={heroMetricTextStyle}>
            {leadNumber?.label ?? "No published numbered claim is available for the opening readout."}
          </p>
        </div>
        <div style={heroProofStyle}>
          <span style={eyebrow(V4.slate)}>Trace</span>
          <p style={{ margin: "8px 0 0", fontFamily: MONO, fontSize: 12, color: V4.slate, lineHeight: 1.7 }}>
            {source ? `${source.label} · ${source.ids}` : "No cited evidence references"}
          </p>
          <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 12, color: V4.green }}>
            Six-section executive story: {terminalCount} of 6 sections present
          </p>
        </div>
      </div>

      {leadNumber ? (
        <p style={heroClaimStyle}>{cxoText(leadNumber.claim.statement)}</p>
      ) : null}
    </header>
  );
}

function StorySectionBlock({
  index,
  section,
  signalPacket,
  visualDatasets,
  onOpenView,
}: {
  index: number;
  section: StorySection;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
  onOpenView: (id: string) => void;
}) {
  const source = section.leadClaim ? sourceForIds(section.leadClaim.evidence_ids, signalPacket) : null;
  const visualRows = section.spec.visualDataset ? visualDatasets[section.spec.visualDataset] ?? [] : [];

  return (
    <section
      id={section.spec.id}
      data-home-tier1-section={section.spec.id}
      data-home-tier1-terminal-state={section.state}
      style={sectionShellStyle}
    >
      <div data-home-tier1-section-header style={sectionHeaderStyle}>
        <div>
          <span style={eyebrow(section.state === "published" ? V4.green : section.state === "refused" ? V4.amber : V4.slate)}>
            {String(index).padStart(2, "0")} · {section.state}
          </span>
          <h2 style={sectionTitleStyle}>{section.spec.title}</h2>
          <p style={sectionQuestionStyle}>{section.spec.readerQuestion}</p>
        </div>
        {section.spec.deepLink ? (
          <button
            type="button"
            data-home-tier1-deep-link
            onClick={() => {
              if (section.spec.deepLink) onOpenView(section.spec.deepLink.id);
            }}
            style={deepLinkButtonStyle}
          >
            {section.spec.deepLink.label}
          </button>
        ) : null}
      </div>

      {section.leadClaim ? (
        <div data-home-tier1-section-body style={sectionBodyStyle}>
          <div>
            <p style={leadClaimStyle}>{cxoText(section.leadClaim.statement)}</p>
            {source ? (
              <p style={sourceLineStyle}>
                {source.label} · {source.ids}
                {source.hasUnresolved ? " · evidence reference needs resolution" : ""}
              </p>
            ) : null}
          </div>
          {visualRows.length > 0 ? (
            <MiniEvidenceVisual
              title={section.spec.visualTitle ?? "Evidence view"}
              rows={visualRows}
            />
          ) : null}
        </div>
      ) : (
        <TerminalEmptyState state={section.state} limitations={section.limitations} />
      )}

      {section.supportingClaims.length > 0 ? (
        <div style={supportingGridStyle}>
          {section.supportingClaims.map((claim) => {
            const claimSourceSummary = sourceForIds(claim.evidence_ids, signalPacket);
            return (
              <article key={claim.statement} style={supportingCardStyle}>
                <p style={supportingTextStyle}>{cxoText(claim.statement)}</p>
                <p style={supportingSourceStyle}>
                  {claimSourceSummary.label} · {claimSourceSummary.ids}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      {section.limitations.length > 0 ? (
        <div style={limitsStyle}>
          <span style={eyebrow(V4.amber)}>Not established</span>
          <ul style={limitsListStyle}>
            {section.limitations.slice(0, 3).map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function TerminalEmptyState({
  state,
  limitations,
}: {
  state: TerminalState;
  limitations: string[];
}) {
  return (
    <div style={emptyTerminalStyle}>
      <span style={eyebrow(state === "refused" ? V4.amber : V4.slate)}>
        {state === "refused" ? "Refused" : "Deferred"}
      </span>
      <p style={{ margin: "10px 0 0", fontFamily: SERIF, fontSize: 24, lineHeight: 1.28 }}>
        This section is intentionally held from the executive story.
      </p>
      <p style={{ margin: "12px 0 0", fontFamily: SANS, fontSize: 15, color: V4.slate, maxWidth: "62ch" }}>
        The current evidence does not support a publishable claim for this question. It is held here rather
        than filled with a weak inference.
      </p>
      {limitations.length > 0 ? (
        <ul style={{ ...limitsListStyle, marginTop: 16 }}>
          {limitations.slice(0, 2).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MiniEvidenceVisual({
  title,
  rows,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
}) {
  const normalized = rows.slice(0, 5).map((row) => {
    const labelKey = ["function", "vendor", "program", "category", "system", "theme"].find((key) => row[key] !== undefined);
    const valueKey = ["sharePct", "applicationCount", "expectedValue", "pctComplete", "count", "riskCount", "leaderCount"].find(
      (key) => row[key] !== undefined,
    );
    const value = Number(valueKey ? row[valueKey] : 0) || 0;
    return {
      label: String(labelKey ? row[labelKey] : "Evidence"),
      value,
      display: formatVisualValue(valueKey, value),
    };
  });
  const max = Math.max(1, ...normalized.map((row) => row.value));
  return (
    <figure style={visualStyle}>
      <figcaption style={{ ...eyebrow(V4.slate), marginBottom: 14 }}>{title}</figcaption>
      <div style={{ display: "grid", gap: 10 }}>
        {normalized.map((row) => (
          <div key={row.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={visualLabelStyle}>{row.label}</div>
              <div style={visualTrackStyle}>
                <span style={{ ...visualBarStyle, width: `${Math.max(4, (row.value / max) * 100)}%` }} />
              </div>
            </div>
            <span style={visualValueStyle}>{row.display}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

function formatVisualValue(valueKey: string | undefined, value: number): string {
  if (valueKey === "sharePct" || valueKey === "pctComplete") return `${value.toFixed(value % 1 ? 1 : 0)}%`;
  if (valueKey === "expectedValue") return `$${(value / 1_000_000).toFixed(1)}M`;
  return value.toLocaleString();
}

function StoryRail({
  clientLabel,
  sections,
  terminalCount,
  compiledLine,
  onOpenView,
}: {
  clientLabel: string;
  sections: StorySection[];
  terminalCount: number;
  compiledLine: string[];
  onOpenView: (id: string) => void;
}) {
  return (
    <aside data-home-tier1-rail style={storyRailStyle}>
      <div>
        <div style={eyebrow(V4.slate)}>Composite reference tenant</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", alignItems: "baseline", gap: 8, marginTop: 7 }}>
          <span style={demoBadgeStyle}>Demo</span>
          <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, lineHeight: 1.14 }}>{clientLabel}</span>
        </div>
        <p style={{ margin: "11px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: V4.slate }}>
          Synthetic portfolio. Not a customer, not a case study.
        </p>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <span style={eyebrow(V4.slate)}>Executive story</span>
          <span style={railProgressStyle}>{terminalCount} of 6</span>
        </div>
        <nav aria-label="Executive story sections" style={{ display: "grid", gap: 2 }}>
          {sections.map((section) => (
            <a key={section.spec.id} href={`#${section.spec.id}`} style={railAnchorStyle}>
              <span>{section.spec.title}</span>
              <span style={{ color: section.state === "published" ? V4.green : V4.amber }}>
                {terminalStateLabel(section.state)}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 14 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 8 }}>Deepen the evidence</div>
        {[
          ["architecture", "Architecture map"],
          ["data-flow", "Data-flow view"],
          ["browse-the-data", "Evidence browser"],
          ["tech:application_system", "Application register"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => onOpenView(id)} style={railButtonStyle}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto", borderTop: `1px solid ${V4.rule}`, paddingTop: 13 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 7 }}>Evidence base</div>
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: V4.slate }}>
          {compiledLine.map((line, i) => (
            <span key={line}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>
      </div>
    </aside>
  );
}

function terminalStateLabel(state: TerminalState): string {
  if (state === "published") return "ready";
  if (state === "refused") return "held";
  return "deferred";
}

function EvidenceEntryPoints({ onOpenView }: { onOpenView: (id: string) => void }) {
  const entries = [
    ["architecture", "Architecture", "Conceptual blocks first, then logical and physical drilldown."],
    ["data-flow", "Data flow", "Sources, integration, landing, analysis, and consumption layers."],
    ["browse-the-data", "Data browser", "Slice and inspect the governed records behind the story."],
  ];
  return (
    <section style={{ padding: `18px ${PAGE_X}px 0` }}>
      <div style={entryPointShellStyle}>
        <div>
          <span style={eyebrow(V4.slate)}>Next level</span>
          <h2 style={entryPointTitleStyle}>Use the explorer when a section needs proof, not as the opening experience.</h2>
        </div>
        <div style={entryPointGridStyle}>
          {entries.map(([id, title, text]) => (
            <button key={id} type="button" onClick={() => onOpenView(id)} style={entryPointCardStyle}>
              <strong>{title}</strong>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const storyRailStyle: CSSProperties = {
  borderRight: `1px solid ${V4.rule}`,
  background: V4.cream,
  padding: "22px 14px 20px",
  position: "sticky",
  top: 0,
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  overflowY: "auto",
  scrollbarGutter: "stable",
};

const demoBadgeStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: V4.paper,
  background: V4.navy,
  borderRadius: 3,
  padding: "4px 7px 3px",
};

const railProgressStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0,
  color: V4.slate,
  whiteSpace: "nowrap",
};

const railAnchorStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 2px",
  borderTop: `1px solid ${V4.ruleSoft}`,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.35,
  textDecoration: "none",
};

const railButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: 0,
  borderTop: `1px solid ${V4.ruleSoft}`,
  background: "transparent",
  padding: "9px 2px",
  color: V4.blue,
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer",
};

const heroMetricStyle: CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "minmax(280px,0.82fr) minmax(240px,0.45fr)",
  gap: 28,
  alignItems: "stretch",
  borderTop: `5px solid ${V4.green}`,
  borderBottom: `1px solid ${V4.rule}`,
  background: "linear-gradient(120deg,rgba(255,255,255,0.96),rgba(242,238,231,0.76))",
  padding: "30px 34px",
};

const heroNumberStyle: CSSProperties = {
  marginTop: 10,
  fontFamily: SERIF,
  fontSize: 78,
  lineHeight: 0.95,
  letterSpacing: 0,
  fontWeight: 500,
};

const heroMetricTextStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: SANS,
  fontSize: 18,
  lineHeight: 1.45,
  color: V4.inkSoft,
  maxWidth: "44ch",
};

const heroProofStyle: CSSProperties = {
  borderLeft: `1px solid ${V4.rule}`,
  paddingLeft: 24,
  alignSelf: "stretch",
};

const heroClaimStyle: CSSProperties = {
  margin: "30px 0 0",
  fontFamily: SERIF,
  fontSize: 42,
  lineHeight: 1.08,
  letterSpacing: 0,
  fontWeight: 500,
  maxWidth: "28ch",
  textWrap: "balance",
};

const sectionShellStyle: CSSProperties = {
  margin: "0 0 24px",
  padding: `42px ${PAGE_X}px 36px`,
  borderTop: `1px solid ${V4.rule}`,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  marginBottom: 22,
};

const sectionTitleStyle: CSSProperties = {
  margin: "9px 0 0",
  fontFamily: SERIF,
  fontSize: 36,
  lineHeight: 1.08,
  letterSpacing: 0,
  fontWeight: 500,
};

const sectionQuestionStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: SERIF,
  fontStyle: "italic",
  fontSize: 17,
  color: V4.slate,
};

const sectionBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px,0.96fr) minmax(280px,0.74fr)",
  gap: 44,
  alignItems: "start",
};

const leadClaimStyle: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 30,
  lineHeight: 1.18,
  letterSpacing: 0,
  color: V4.ink,
  maxWidth: "34ch",
  textWrap: "pretty",
};

const sourceLineStyle: CSSProperties = {
  margin: "18px 0 0",
  fontFamily: MONO,
  fontSize: 11,
  lineHeight: 1.6,
  letterSpacing: 0,
  color: V4.slate,
};

const visualStyle: CSSProperties = {
  margin: 0,
  border: `1px solid ${V4.rule}`,
  borderRadius: 8,
  background: V4.surface,
  padding: 18,
  boxShadow: "0 14px 32px rgba(12,26,58,0.05)",
};

const visualLabelStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: SANS,
  fontSize: 13,
  color: V4.inkSoft,
};

const visualTrackStyle: CSSProperties = {
  marginTop: 5,
  height: 5,
  borderRadius: 999,
  background: "rgba(136,135,128,0.18)",
  overflow: "hidden",
};

const visualBarStyle: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
  background: V4.navy,
};

const visualValueStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 12,
  color: V4.blue,
};

const supportingGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
  gap: 14,
  marginTop: 24,
};

const supportingCardStyle: CSSProperties = {
  border: `1px solid ${V4.rule}`,
  borderLeft: `3px solid ${V4.navy}`,
  borderRadius: 8,
  background: V4.surface,
  padding: "16px 18px",
};

const supportingTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 14.5,
  lineHeight: 1.55,
  color: V4.inkSoft,
};

const supportingSourceStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: MONO,
  fontSize: 10.5,
  color: V4.slate,
};

const limitsStyle: CSSProperties = {
  marginTop: 22,
  border: `1px solid rgba(186,117,23,0.35)`,
  borderLeft: `3px solid ${V4.amber}`,
  borderRadius: 8,
  background: "rgba(186,117,23,0.045)",
  padding: "16px 18px",
};

const limitsListStyle: CSSProperties = {
  margin: "10px 0 0",
  paddingLeft: 18,
  fontFamily: SANS,
  fontSize: 14,
  lineHeight: 1.65,
  color: V4.inkSoft,
};

const emptyTerminalStyle: CSSProperties = {
  border: `1px solid ${V4.rule}`,
  borderLeft: `3px solid ${V4.amber}`,
  borderRadius: 8,
  background: V4.surface,
  padding: "24px 26px",
};

const deepLinkButtonStyle: CSSProperties = {
  border: `1px solid rgba(0,102,204,0.35)`,
  borderRadius: 999,
  background: V4.surface,
  color: V4.blue,
  padding: "9px 14px",
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: 0,
  textTransform: "uppercase",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const entryPointShellStyle: CSSProperties = {
  borderTop: `1px solid ${V4.rule}`,
  paddingTop: 28,
};

const entryPointTitleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SERIF,
  fontSize: 30,
  lineHeight: 1.16,
  letterSpacing: 0,
  fontWeight: 500,
  maxWidth: "34ch",
};

const entryPointGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
  gap: 14,
  marginTop: 20,
};

const entryPointCardStyle: CSSProperties = {
  textAlign: "left",
  border: `1px solid ${V4.rule}`,
  borderRadius: 8,
  background: V4.surface,
  padding: "18px 20px",
  cursor: "pointer",
  color: V4.ink,
  fontFamily: SANS,
};
