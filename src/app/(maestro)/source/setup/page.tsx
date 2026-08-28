import Link from "next/link";
import type { CSSProperties } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceSetupConfigPage } from "@/components/source/setup/SourceSetupConfigPage";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { SHELL } from "@/lib/shell/shell-tokens";
import {
  SOURCE_STAGE_ORDER,
  listSourceArtifactOperations,
  summarizeSourceArtifactOperations,
  type SourceArtifactOperation,
  type SourceArtifactOperationStatus,
} from "@/lib/source";

export const metadata = {
  title: "Source Setup · Artifact Operations · AbarVa",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<SourceArtifactOperationStatus, string> = {
  wired: "Wired",
  partial: "Partial",
  planned: "Planned",
};

const STATUS_STYLE: Record<SourceArtifactOperationStatus, CSSProperties> = {
  wired: {
    background: SHELL.MINT_BG,
    borderColor: SHELL.MINT_LINE,
    color: SHELL.MINT_TEXT,
  },
  partial: {
    background: SHELL.PEACH_BG,
    borderColor: SHELL.PEACH_LINE,
    color: SHELL.PEACH_TEXT,
  },
  planned: {
    background: SHELL.GRAY_BG,
    borderColor: SHELL.GRAY_LINE,
    color: SHELL.GRAY_TEXT,
  },
};

const PAGE: CSSProperties = {
  background: SHELL.PAPER,
  flex: 1,
  overflowY: "auto",
  padding: "32px clamp(18px, 4vw, 48px)",
  fontFamily: SHELL.SANS,
  color: SHELL.INK,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: 18,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
};

const CELL_MUTED: CSSProperties = {
  margin: 0,
  color: SHELL.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.5,
};

const TOP_GAPS = [
  {
    label: "Vendor response intake",
    detail:
      "Build the d13 flow: vendor picker, bulk upload, response versioning, parse status, and section mapping against the RFP checklist.",
  },
  {
    label: "Q&A and email drafts",
    detail:
      "Keep the client procurement system as the send channel, but let AbarVa draft official Q&A, BAFO, award, and follow-up communications for Maestro review.",
  },
  {
    label: "Parser coverage",
    detail:
      "Extend beyond generic upload and d19 pricing parsing into DOCX/PDF/PPTX response parsing, table extraction, and Azure Document Intelligence handoff.",
  },
  {
    label: "All-artifact generation",
    detail:
      "Generation is wired for the early strategy/scope/RFP chain; extend prompt templates across the decision, BAFO, transition, and value artifacts.",
  },
  {
    label: "Governed action log",
    detail:
      "Every upload, generation, evidence request, status change, response gap, and approval must write a visible event log row.",
  },
] as const;

function statusPill(status: SourceArtifactOperationStatus) {
  return (
    <span
      style={{
        ...STATUS_STYLE[status],
        border: "1px solid",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        padding: "3px 9px",
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function renderArtifactRow(operation: SourceArtifactOperation) {
  return (
    <tr key={operation.artifactCode}>
      <td style={tdStyle({ minWidth: 230 })}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 13 }}>{operation.artifactName}</strong>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
            }}
          >
            {operation.artifactCode} · {operation.requirementLevel}
            {operation.gateDefining ? " · gate" : ""}
          </span>
          <span style={{ fontSize: 12, color: SHELL.INK_SOFT }}>
            {operation.documentType}
          </span>
        </div>
      </td>
      <td style={tdStyle({ minWidth: 260 })}>
        <p style={CELL_MUTED}>{operation.sourceOfRecord}</p>
      </td>
      <td style={tdStyle({ minWidth: 290 })}>
        <p style={CELL_MUTED}>{operation.intakePath}</p>
        <p
          style={{
            margin: "8px 0 0",
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          Formats: {operation.acceptedFormats.join(", ").toUpperCase()}
        </p>
      </td>
      <td style={tdStyle({ minWidth: 320 })}>
        <p style={CELL_MUTED}>{operation.parseAndStore}</p>
      </td>
      <td style={tdStyle({ minWidth: 300 })}>
        <p style={CELL_MUTED}>{operation.agentUse}</p>
      </td>
      <td style={tdStyle({ minWidth: 340 })}>
        <p style={CELL_MUTED}>{operation.contentStandard}</p>
      </td>
      <td style={tdStyle({ minWidth: 340 })}>
        <p style={CELL_MUTED}>{operation.responsibleAiControl}</p>
      </td>
      <td style={tdStyle({ minWidth: 330 })}>
        <div style={{ display: "grid", gap: 8 }}>
          {statusPill(operation.status)}
          <p style={CELL_MUTED}>{operation.currentCapability}</p>
          <p style={{ ...CELL_MUTED, color: SHELL.RUST_TEXT }}>
            Next: {operation.nextGap}
          </p>
        </div>
      </td>
      <td style={tdStyle({ minWidth: 310 })}>
        <p style={CELL_MUTED}>{operation.bestInClassOutcome}</p>
      </td>
    </tr>
  );
}

function tdStyle(extra?: CSSProperties): CSSProperties {
  return {
    padding: "14px 16px",
    borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
    verticalAlign: "top",
    ...extra,
  };
}

/**
 * The flag-off Source Setup: the artifact-operations contract table. Untouched
 * by the `source_analytics` realign — this is the current surface every tenant
 * without the flag continues to see.
 */
function SourceSetupArtifactOperationsPage() {
  const operations = listSourceArtifactOperations();
  const summary = summarizeSourceArtifactOperations(operations);
  const operationsByStage = SOURCE_STAGE_ORDER.map((stage) => ({
    stage,
    label:
      operations.find((operation) => operation.stage === stage)?.stageLabel ??
      stage,
    operations: operations.filter((operation) => operation.stage === stage),
  }));

  return (
    <AppShell
      surface="source"
      topBarProps={{ showLocked: true, context: "Source · Setup" }}
      subNav={<SourceSubNav />}
    >
      <main style={PAGE}>
        <section style={{ maxWidth: 1480, ...STACK }}>
          <header
            style={{
              display: "grid",
              gap: 12,
              borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              paddingBottom: 22,
            }}
          >
            <div style={SECTION_LABEL}>Source · Setup</div>
            <h1
              style={{
                margin: 0,
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: "clamp(30px, 4vw, 46px)",
                lineHeight: 1.05,
              }}
            >
              Make every Source document real, loaded, parsed, governed, and
              usable by Sentinel.
            </h1>
            <p
              style={{
                margin: 0,
                color: SHELL.INK_SOFT,
                fontSize: 15,
                lineHeight: 1.65,
                maxWidth: 920,
              }}
            >
              This is the operating contract behind Source. AbarVa does not
              replace the client procurement system; it imports or generates
              governed snapshots, stores them in the tenant data plane, parses
              what it can, records gaps honestly, and lets agents use only
              scoped evidence.
            </p>
          </header>

          <section
            aria-label="Source artifact operations summary"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            {[
              ["Artifacts", summary.total],
              ["Wired", summary.wired],
              ["Partial", summary.partial],
              ["Planned", summary.planned],
              ["Gate-defining", summary.gateDefining],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  ...CARD,
                  padding: "16px 18px",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={SECTION_LABEL}>{label}</div>
                <div
                  style={{
                    fontFamily: SHELL.SERIF_DISPLAY,
                    fontSize: 32,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </section>

          <section
            aria-label="What is still missing"
            style={{
              ...CARD,
              padding: 20,
              display: "grid",
              gap: 14,
              borderLeft: `4px solid ${SHELL.PEACH_LINE}`,
            }}
          >
            <div style={SECTION_LABEL}>What else is missing</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 12,
              }}
            >
              {TOP_GAPS.map((gap) => (
                <article
                  key={gap.label}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                    borderRadius: 8,
                    padding: 14,
                    display: "grid",
                    gap: 7,
                    background: SHELL.PAPER_SOFT,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>{gap.label}</strong>
                  <p style={CELL_MUTED}>{gap.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-label="How Source uses client procurement systems"
            style={{
              ...CARD,
              padding: 20,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.42fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={SECTION_LABEL}>Operating principle</div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: SHELL.SERIF_DISPLAY,
                  fontSize: 24,
                  lineHeight: 1.15,
                }}
              >
                AbarVa is the decision and evidence layer, not the vendor
                portal.
              </h2>
              <p style={{ ...CELL_MUTED, fontSize: 14 }}>
                If the client already uses Coupa, Ariba, Ivalua, Zip, email, or
                a vendor portal, that system can remain the operational channel
                for issuing RFPs and receiving submissions. Source needs the
                controlled snapshot: what was issued, what came back, who
                approved it, what parsed cleanly, what is missing, and what the
                agents are allowed to cite.
              </p>
            </div>
            <div
              style={{
                border: `1px solid ${SHELL.BLUE_LINE}`,
                borderRadius: 8,
                background: SHELL.BLUE_BG,
                padding: 14,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={SECTION_LABEL}>Primary next build</div>
              <p style={{ ...CELL_MUTED, color: SHELL.INK }}>
                Build d13 vendor response intake first. It unlocks d15
                completeness, d16 scoring, d19 comparison confidence, d22 BAFO,
                d24 decision quality, and d32 value proof.
              </p>
              <Link
                href="/source/workspace"
                style={{
                  color: SHELL.INK,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Open Source portfolio →
              </Link>
            </div>
          </section>

          <section
            aria-label="Responsible AI approval model"
            style={{
              ...CARD,
              padding: 20,
              display: "grid",
              gap: 14,
              background: "#FBFAF7",
            }}
          >
            <div style={SECTION_LABEL}>Responsible AI model</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "AI drafts, humans approve",
                  detail:
                    "Sentinel can draft or summarize, but client users approve, lock, send, and use the artifact.",
                },
                {
                  label: "Client inputs first",
                  detail:
                    "Generated documents are bound to event intake, approved upstream artifacts, uploaded files, and tenant evidence.",
                },
                {
                  label: "No silent authority",
                  detail:
                    "Generated artifacts carry model, prompt, token, and upstream-code metadata; approval requires human review.",
                },
                {
                  label: "Simple user path",
                  detail:
                    "The Maestro sees one next action: upload, review, accept, send outside AbarVa, approve, or resolve a gap.",
                },
              ].map((item) => (
                <article
                  key={item.label}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                    borderRadius: 8,
                    padding: 14,
                    background: SHELL.CARD_WHITE,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>{item.label}</strong>
                  <p style={CELL_MUTED}>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          {operationsByStage.map(
            ({ stage, label, operations: stageOperations }, index) => (
              <section
                key={stage}
                aria-label={`${label} artifact operations`}
                style={{
                  ...CARD,
                  overflow: "hidden",
                }}
              >
                <header
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    background: SHELL.PAPER_SOFT,
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={SECTION_LABEL}>
                      Phase {index + 1} · {stageOperations.length} artifacts
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: SHELL.SERIF_DISPLAY,
                        fontSize: 24,
                        lineHeight: 1.1,
                      }}
                    >
                      {label}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["wired", "partial", "planned"] as const).map(
                      (status) => {
                        const count = stageOperations.filter(
                          (operation) => operation.status === status,
                        ).length;
                        return count > 0 ? (
                          <span key={status}>
                            {statusPill(status)}{" "}
                            <span
                              style={{
                                fontFamily: SHELL.MONO,
                                fontSize: 11,
                                color: SHELL.INK_MUTED,
                              }}
                            >
                              {count}
                            </span>
                          </span>
                        ) : null;
                      },
                    )}
                  </div>
                </header>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      borderCollapse: "collapse",
                      minWidth: 2560,
                      width: "100%",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Artifact",
                          "Source of record",
                          "Intake",
                          "Parse + store",
                          "Agent use",
                          "Best-in-class standard",
                          "Responsible AI control",
                          "Today / gap",
                          "Best-in-class outcome",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "10px 16px",
                              borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                              fontFamily: SHELL.MONO,
                              fontSize: 10,
                              color: SHELL.INK_MUTED,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              background: SHELL.CARD_WHITE,
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{stageOperations.map(renderArtifactRow)}</tbody>
                  </table>
                </div>
              </section>
            ),
          )}
        </section>
      </main>
    </AppShell>
  );
}

/**
 * Source Setup route. Behind the `source_analytics` master flag (Lakeshore is
 * the first enrolled tenant): flag ON → the redesigned three-card "Source
 * configuration" surface; flag OFF → the untouched artifact-operations page.
 *
 * The three config cards render honest placeholder state ("not configured") —
 * this repo has no tenant-wide connected-evidence-source registry or default-
 * archetype config store to source real values from, and we never fabricate a
 * connection count.
 */
export default async function SourceSetupPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const sourceAnalyticsEnabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? null,
      clientId: activeClient?.id ?? null,
    },
    "source_analytics",
  );

  if (!sourceAnalyticsEnabled) {
    return <SourceSetupArtifactOperationsPage />;
  }

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "your tenant";

  return <SourceSetupConfigPage tenantName={tenantName} />;
}
