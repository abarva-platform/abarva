import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import type {
  DataLoadGateStatus,
  DataLoadDimensionCatalogItem,
  PilotVerifierHopStatus,
  SetupDataLoadCenterModel,
} from "@/lib/admin/setup-data-load-center";

interface SetupDataLoadCenterProps {
  model: SetupDataLoadCenterModel;
}

// ── Calm status vocabulary ──────────────────────────────────────────
// Apple-calm reskin (2026-06-01): the locked design system is cream +
// near-black ink + black/ghost buttons. Status is conveyed by a single
// restrained accent (amber = needs action), never by decorative sky/
// mint/coral fills. Pills are hairline outlines, not filled chips.

const statusCopy: Record<DataLoadGateStatus, string> = {
  ready: "Ready",
  monitored: "Monitored",
  needs_configuration: "Action needed",
};

const verifierStatusCopy: Record<PilotVerifierHopStatus, string> = {
  live_ready: "Live-ready",
  stub_fail_closed: "Fail-closed",
  blocked: "Blocked",
};

// Accent only where it earns attention. Ready + monitored read as quiet
// ink; only "action needed" gets the amber accent so the eye lands on
// the one thing the operator must do.
function statusAccent(status: DataLoadGateStatus): string {
  return status === "needs_configuration" ? COLORS.amberInk : `${COLORS.ink}99`;
}

const cardStyle = {
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  background: COLORS.white,
} as const;

function labelStyle(color = `${COLORS.ink}99`) {
  return {
    color,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } as const;
}

// Hairline outline pill — calm, no filled background.
function statusPill(status: DataLoadGateStatus) {
  const accent = statusAccent(status);
  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        borderRadius: RADIUS.pill,
        padding: "3px 9px",
        border: `1px solid ${accent}44`,
        color: accent,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {statusCopy[status]}
    </span>
  );
}

function verifierPill(status: PilotVerifierHopStatus) {
  const accent = status === "live_ready" ? `${COLORS.ink}99` : COLORS.amberInk;
  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        borderRadius: RADIUS.pill,
        padding: "3px 9px",
        border: `1px solid ${accent}44`,
        color: accent,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {verifierStatusCopy[status]}
    </span>
  );
}

// One primary action per viewport. Black fill, locked system.
function primaryButton(href: string, label: string) {
  return (
    <a
      href={href}
      style={{
        width: "fit-content",
        borderRadius: RADIUS.sm,
        padding: "10px 16px",
        background: COLORS.ink,
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

// Ghost secondary — hairline border, never a second filled button.
function ghostButton(href: string, label: string) {
  return (
    <a
      href={href}
      style={{
        width: "fit-content",
        border: `1px solid ${COLORS.ink}24`,
        borderRadius: RADIUS.sm,
        padding: "9px 14px",
        background: COLORS.white,
        color: COLORS.ink,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

function progressBar(label: string, value: number) {
  return (
    <div
      aria-label={`${label} ${value}% complete`}
      style={{
        height: 6,
        borderRadius: RADIUS.pill,
        background: `${COLORS.ink}12`,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "block",
          width: `${value}%`,
          height: "100%",
          background: COLORS.ink,
        }}
      />
    </div>
  );
}

// Format chips: hairline ghost, not filled sky-blue.
function chip(label: string) {
  return (
    <span
      key={label}
      style={{
        borderRadius: RADIUS.pill,
        padding: "3px 9px",
        border: `1px solid ${COLORS.ink}1f`,
        color: `${COLORS.ink}b0`,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

function dimensionCard(dimension: DataLoadDimensionCatalogItem) {
  return (
    <article
      key={dimension.id}
      style={{
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: 18,
        background: COLORS.white,
        display: "grid",
        gap: 12,
        minHeight: 184,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle()}>{dimension.currentGate}</span>
        <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.2, fontWeight: 600 }}>
          {dimension.label}
        </h3>
        <p
          style={{
            margin: 0,
            color: `${COLORS.ink}a0`,
            fontSize: 12.5,
            lineHeight: 1.4,
          }}
        >
          {dimension.summary}
        </p>
      </div>
      {progressBar(dimension.label, dimension.completenessPercent)}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(dimension.formats.length > 0
          ? dimension.formats
          : ["CSV", "XLSX", "JSON"]
        ).map(chip)}
      </div>
      <div style={{ marginTop: "auto" }}>
        {ghostButton(
          dimension.primaryAction.href,
          dimension.primaryAction.label,
        )}
      </div>
    </article>
  );
}

function setupCompleteness(model: SetupDataLoadCenterModel): number {
  const rows = model.dimensionReadiness;
  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, row) => sum + row.completenessPercent, 0);
  return Math.round(total / rows.length);
}

export function SetupDataLoadCenter({ model }: SetupDataLoadCenterProps) {
  const overallCompleteness = setupCompleteness(model);
  const committedDimensions = model.dimensionReadiness.filter(
    (row) => row.currentGate === "Committed",
  ).length;
  const totalDimensions = model.dimensionReadiness.length;
  const blockedActions = model.workQueue.filter(
    (item) => item.severity === "blocked",
  ).length;
  const openActions = model.workQueue.length;
  const activeGate = model.rehearsalGates.find(
    (gate) => gate.status === "needs_configuration",
  );
  const primaryDimension =
    model.dimensionCatalog.find(
      (dimension) => dimension.currentGate !== "Committed",
    ) ?? model.dimensionCatalog[0];

  // Calm empty / first-load state for a freshly-seeded client.
  const isEmpty = committedDimensions === 0 && totalDimensions > 0;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <style>
        {`
          @media (max-width: 1120px) {
            [data-setup-grid="hero"],
            [data-setup-grid="command"],
            [data-setup-grid="studio"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            [data-setup-grid="dimensions"] {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          @media (max-width: 700px) {
            [data-setup-grid="dimensions"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
        `}
      </style>

      {/* ── Hero: context + one primary action + next-decision aside ── */}
      <section
        data-setup-grid="hero"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 24,
          alignItems: "start",
        }}
        aria-label="Data Load Studio"
      >
        <div>
          <span style={labelStyle(`${COLORS.ink}80`)}>
            Setup · Data Load Studio · {model.tenant.tenantName}
          </span>
          <h1
            style={{
              margin: "10px 0 0",
              fontSize: 34,
              lineHeight: 1.1,
              fontWeight: 400,
              fontFamily: TYPOGRAPHY.serif,
              letterSpacing: "-0.01em",
            }}
          >
            Load data for {model.tenant.tenantName}
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              color: `${COLORS.ink}a8`,
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: 560,
            }}
          >
            Start with the business dimension you want to load. The studio
            walks each one through consent, upload, validation, approval, and
            commit. Private data plane ready.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {primaryButton(
              "/admin/context-layer/uploads",
              "Start a governed load",
            )}
            {ghostButton("#template-library", "View templates")}
          </div>

          {/* One-line summary strip — replaces four heavy stat tiles.
              Blocked count is load-bearing (exceptions above the fold). */}
          <div
            style={{
              marginTop: 22,
              padding: "12px 16px",
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.md,
              background: COLORS.cream,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 18px",
              alignItems: "center",
              fontSize: 13,
              color: `${COLORS.ink}b0`,
            }}
            aria-label="Load readiness summary"
          >
            <span>
              <strong style={{ color: COLORS.ink }}>
                {overallCompleteness}%
              </strong>{" "}
              ready
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong style={{ color: COLORS.ink }}>
                {committedDimensions}/{totalDimensions}
              </strong>{" "}
              dimensions loaded
            </span>
            <span aria-hidden>·</span>
            <span
              style={{
                color: blockedActions > 0 ? COLORS.coralInk : `${COLORS.ink}b0`,
                fontWeight: blockedActions > 0 ? 700 : 400,
              }}
            >
              <strong>{blockedActions}</strong> blocked
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong style={{ color: COLORS.ink }}>{openActions}</strong> open
              actions
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong style={{ color: COLORS.ink }}>
                {model.templateRows.length}
              </strong>{" "}
              templates
            </span>
          </div>
        </div>

        {/* Next-decision: the single focal aside */}
        <aside
          style={{
            border: `1px solid ${COLORS.amberInk}2a`,
            borderRadius: RADIUS.md,
            padding: 18,
            background: COLORS.amberSoft,
            display: "grid",
            gap: 10,
            alignContent: "start",
          }}
        >
          <span style={labelStyle(COLORS.amberInk)}>Next decision</span>
          <strong style={{ fontSize: 17, lineHeight: 1.25, fontWeight: 600 }}>
            {primaryDimension
              ? primaryDimension.label
              : activeGate
                ? activeGate.label
                : "Ready for next load"}
          </strong>
          <p
            style={{
              margin: 0,
              color: COLORS.amberInk,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {primaryDimension
              ? primaryDimension.nextAction
              : activeGate
                ? activeGate.objective
                : "All visible workflow gates are clear for the current setup view."}
          </p>
          {primaryDimension ? (
            <a
              href={primaryDimension.primaryAction.href}
              style={{
                marginTop: 2,
                color: COLORS.amberInk,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {primaryDimension.primaryAction.label} →
            </a>
          ) : null}
        </aside>
      </section>

      <section
        data-setup-grid="command"
        id="pilot-verifier"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr) 280px",
          gap: 16,
          alignItems: "stretch",
        }}
        aria-label="Loader readiness and pilot verifier posture"
      >
        <div style={{ ...cardStyle, padding: 18, display: "grid", gap: 14 }}>
          <div>
            <span style={labelStyle()}>Loader readiness</span>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 18,
                fontWeight: 400,
                fontFamily: TYPOGRAPHY.serif,
              }}
            >
              Current load status
            </h2>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {model.loaderReadiness.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  alignItems: "start",
                  paddingTop: 10,
                  borderTop: `1px solid ${COLORS.ink}0e`,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: 13.5, fontWeight: 650 }}>
                    {item.label}
                  </strong>
                  <span
                    style={{
                      color: `${COLORS.ink}a0`,
                      fontSize: 12.5,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.detail}
                  </span>
                  <span style={{ color: `${COLORS.ink}90`, fontSize: 12 }}>
                    {item.nextAction}
                  </span>
                </div>
                {statusPill(item.status)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 18, display: "grid", gap: 14 }}>
          <div>
            <span style={labelStyle()}>Pilot verifier posture</span>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 18,
                fontWeight: 400,
                fontFamily: TYPOGRAPHY.serif,
              }}
            >
              {model.pilotVerifier.summary.liveReady} live-ready ·{" "}
              {model.pilotVerifier.summary.stubFailClosed} fail-closed
            </h2>
          </div>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: RADIUS.sm,
              background: COLORS.cream,
              color: `${COLORS.ink}b0`,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              overflowWrap: "anywhere",
            }}
          >
            {model.pilotVerifier.command}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {model.pilotVerifier.hops.slice(0, 5).map((hop) => (
              <div
                key={hop.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ color: `${COLORS.ink}b0`, fontSize: 12.5 }}>
                  {hop.label}
                </span>
                {verifierPill(hop.status)}
              </div>
            ))}
          </div>
        </div>

        <aside style={{ ...cardStyle, padding: 18, display: "grid", gap: 12 }}>
          <div>
            <span style={labelStyle()}>Launch</span>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 18,
                fontWeight: 400,
                fontFamily: TYPOGRAPHY.serif,
              }}
            >
              Next actions
            </h2>
          </div>
          {model.launchActions.map((action) => (
            <div key={action.id} style={{ display: "grid", gap: 6 }}>
              {action.kind === "primary"
                ? primaryButton(action.href, action.label)
                : ghostButton(action.href, action.label)}
              <span
                style={{
                  color: `${COLORS.ink}94`,
                  fontSize: 12.5,
                  lineHeight: 1.4,
                }}
              >
                {action.detail}
              </span>
            </div>
          ))}
        </aside>
      </section>

      {/* ── Dimension library + governed workflow ── */}
      <section
        data-setup-grid="studio"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <span style={labelStyle()}>Dimension library</span>
            <h2
              style={{
                margin: "8px 0 0",
                fontSize: 22,
                fontWeight: 400,
                fontFamily: TYPOGRAPHY.serif,
                letterSpacing: "-0.01em",
              }}
            >
              Pick the business dimension first.
            </h2>
          </div>

          {isEmpty ? (
            <div
              style={{
                ...cardStyle,
                padding: 28,
                display: "grid",
                gap: 10,
                textAlign: "center",
                background: COLORS.cream,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                No data loaded yet for {model.tenant.tenantName}
              </h3>
              <p
                style={{
                  margin: "0 auto",
                  maxWidth: 420,
                  color: `${COLORS.ink}a0`,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                Choose any dimension below to begin the first governed load.
                Each one becomes assistant-ready after approval and commit.
              </p>
            </div>
          ) : null}

          <div
            data-setup-grid="dimensions"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {model.dimensionCatalog.map((dimension) => dimensionCard(dimension))}
          </div>
        </div>

        {/* Governed load workflow — read-as-status stepper. Monitored
            rows show no button (no fake action, principle 5). */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 18px",
              borderBottom: `1px solid ${COLORS.ink}14`,
            }}
          >
            <span style={labelStyle()}>Active load plan</span>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 18,
                fontWeight: 400,
                fontFamily: TYPOGRAPHY.serif,
              }}
            >
              Governed load workflow
            </h2>
          </div>
          <div style={{ display: "grid" }}>
            {model.workflowControls.map((control, index) => (
              <div
                key={control.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px minmax(0, 1fr) auto",
                  gap: 12,
                  padding: "14px 16px",
                  borderTop:
                    index === 0 ? undefined : `1px solid ${COLORS.ink}0e`,
                  alignItems: "start",
                }}
              >
                <span style={labelStyle(`${COLORS.ink}70`)}>
                  {control.stage}
                </span>
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ fontSize: 14, fontWeight: 600 }}>
                      {control.label}
                    </strong>
                    {statusPill(control.status)}
                  </div>
                  <span
                    style={{
                      color: `${COLORS.ink}a0`,
                      fontSize: 12.5,
                      lineHeight: 1.4,
                    }}
                  >
                    {control.operatorAction}
                  </span>
                </div>
                {control.href ? (
                  <a
                    href={control.href}
                    style={{
                      width: "fit-content",
                      border: `1px solid ${COLORS.ink}24`,
                      borderRadius: RADIUS.sm,
                      padding: "6px 11px",
                      background: COLORS.white,
                      color: COLORS.ink,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open
                  </a>
                ) : (
                  <span
                    style={{
                      alignSelf: "center",
                      color: `${COLORS.ink}70`,
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Monitored
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Template & format library — trimmed to 4 calm columns ── */}
      <section id="template-library" style={cardStyle}>
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${COLORS.ink}14`,
          }}
        >
          <span style={labelStyle()}>Reference</span>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 18,
              fontWeight: 400,
              fontFamily: TYPOGRAPHY.serif,
            }}
          >
            Templates by dimension
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 640,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Dimension", "Formats", "Owner", "Unlocks"].map((head) => (
                  <th
                    key={head}
                    style={{
                      padding: "11px 14px",
                      borderBottom: `1px solid ${COLORS.ink}14`,
                      ...labelStyle(),
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.templateRows.map((template) => (
                <tr key={template.id}>
                  <td
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${COLORS.ink}0e`,
                      fontWeight: 600,
                    }}
                  >
                    {template.dimension}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${COLORS.ink}0e`,
                      color: `${COLORS.ink}b0`,
                    }}
                  >
                    {template.formats}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${COLORS.ink}0e`,
                      color: `${COLORS.ink}b0`,
                    }}
                  >
                    {template.ownerOrSource}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${COLORS.ink}0e`,
                      color: `${COLORS.ink}cc`,
                    }}
                  >
                    {template.unlocks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
