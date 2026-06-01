import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import type {
  DataLoadGateStatus,
  SetupDataLoadCenterModel,
} from "@/lib/admin/setup-data-load-center";
import { CsvUploadConnector } from "@/components/admin/context-layer/CsvUploadConnector";

interface SetupDataLoadCenterProps {
  model: SetupDataLoadCenterModel;
}

const statusCopy: Record<DataLoadGateStatus, string> = {
  ready: "Ready",
  monitored: "Monitor",
  needs_configuration: "Action needed",
};

const statusColors: Record<DataLoadGateStatus, { bg: string; fg: string }> = {
  ready: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  monitored: { bg: COLORS.skyPale, fg: COLORS.navy },
  needs_configuration: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
};

const queueColors: Record<
  SetupDataLoadCenterModel["workQueue"][number]["severity"],
  { bg: string; fg: string }
> = {
  ready: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  attention: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  blocked: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
};

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

function statusPill(status: DataLoadGateStatus) {
  const colors = statusColors[status];
  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        borderRadius: RADIUS.pill,
        padding: "4px 8px",
        background: colors.bg,
        color: colors.fg,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {statusCopy[status]}
    </span>
  );
}

function metric(label: string, value: string | number, detail: string) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 14,
        minHeight: 94,
        display: "grid",
        alignContent: "start",
        gap: 7,
        background: COLORS.white,
      }}
    >
      <span style={labelStyle()}>{label}</span>
      <strong style={{ color: COLORS.ink, fontSize: 26, lineHeight: 1 }}>
        {value}
      </strong>
      <span
        style={{ color: `${COLORS.ink}aa`, fontSize: 12, lineHeight: 1.35 }}
      >
        {detail}
      </span>
    </div>
  );
}

function actionHref(
  control: SetupDataLoadCenterModel["workflowControls"][number],
) {
  if (!control.href) return null;
  return (
    <a
      href={control.href}
      style={{
        width: "fit-content",
        borderRadius: RADIUS.sm,
        padding: "7px 9px",
        background: COLORS.navy,
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 800,
        textDecoration: "none",
      }}
    >
      Open control
    </a>
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
  const openActions = model.workQueue.length;
  const activeGate = model.rehearsalGates.find(
    (gate) => gate.status === "needs_configuration",
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <style>
        {`
          @media (max-width: 1120px) {
            [data-setup-wireframe-grid="hero"],
            [data-setup-wireframe-grid="below"],
            [data-setup-wireframe-grid="operations"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            [data-setup-wireframe-grid="metrics"],
            [data-setup-wireframe-grid="workflow"] {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
          @media (max-width: 700px) {
            [data-setup-wireframe-grid="metrics"],
            [data-setup-wireframe-grid="workflow"],
            [data-setup-wireframe-grid="manifest"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
        `}
      </style>

      <section
        style={{
          ...cardStyle,
          padding: 20,
          display: "grid",
          gap: 18,
        }}
        aria-label="Data Load Center decision summary"
      >
        <div
          data-setup-wireframe-grid="hero"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <span style={labelStyle(COLORS.amberInk)}>
              Active client verified
            </span>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.12 }}>
              {model.tenant.tenantName} data load command center
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: `${COLORS.ink}b8`,
                fontSize: 14,
                lineHeight: 1.45,
                maxWidth: 860,
              }}
            >
              Review what is loaded, what is blocked, and what can be committed
              for this client. Detailed ledgers and diagnostics stay below the
              fold so Maestros see decisions first.
            </p>
          </div>

          <aside
            style={{
              border: `1px solid ${COLORS.amberInk}33`,
              borderRadius: RADIUS.md,
              padding: 14,
              background: COLORS.amberSoft,
              display: "grid",
              gap: 10,
            }}
          >
            <span style={labelStyle(COLORS.amberInk)}>Next decision</span>
            <strong style={{ fontSize: 16, lineHeight: 1.25 }}>
              {activeGate ? activeGate.label : "Ready for next load"}
            </strong>
            <p
              style={{
                margin: 0,
                color: COLORS.amberInk,
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {activeGate
                ? activeGate.objective
                : "All visible workflow gates are clear for the current setup view."}
            </p>
          </aside>
        </div>

        <div
          data-setup-wireframe-grid="metrics"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {metric(
            "Overall readiness",
            `${overallCompleteness}%`,
            "Average of visible required data dimensions",
          )}
          {metric(
            "Loaded dimensions",
            `${committedDimensions} / ${model.dimensionReadiness.length}`,
            "Committed dimensions in this view",
          )}
          {metric(
            "Open actions",
            openActions,
            "Clarification, scan, and approval items",
          )}
          {metric(
            "Templates available",
            model.templateRows.length,
            "Registry and Day One workbook templates",
          )}
        </div>

        <div
          data-setup-wireframe-grid="operations"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(360px, 0.9fr) minmax(0, 1.1fr)",
            gap: 14,
            alignItems: "start",
          }}
          aria-label="Load and process data controls"
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <span style={labelStyle(COLORS.navy)}>Load data here</span>
              <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>
                Upload tenant context
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: `${COLORS.ink}aa`,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                This is the operator workspace. Home stays read-only; this page
                owns upload, scan, validate, approve, and commit controls.
              </p>
            </div>
            <CsvUploadConnector
              clientId={model.tenant.clientId}
              tenantName={model.tenant.tenantName}
            />
          </div>

          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${COLORS.ink}14`,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Workflow and controls</h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: `${COLORS.ink}aa`,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                The data load path is explicit: upload, scan, quarantine,
                validate, approve, then commit. Controls marked Monitor are
                private data-plane workers or ledger contracts, not fake UI
                actions.
              </p>
            </div>
            <div style={{ display: "grid" }}>
              {model.workflowControls.map((control, index) => (
                <div
                  key={control.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "92px minmax(0, 1fr) auto",
                    gap: 12,
                    padding: "12px 14px",
                    borderTop:
                      index === 0 ? undefined : `1px solid ${COLORS.ink}10`,
                    alignItems: "start",
                  }}
                >
                  <span style={labelStyle(COLORS.amberInk)}>
                    {control.stage}
                  </span>
                  <div style={{ display: "grid", gap: 5 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ fontSize: 14 }}>{control.label}</strong>
                      {statusPill(control.status)}
                    </div>
                    <span
                      style={{
                        color: `${COLORS.ink}aa`,
                        fontSize: 12,
                        lineHeight: 1.35,
                      }}
                    >
                      {control.operatorAction}
                    </span>
                    <span
                      style={{
                        color: `${COLORS.ink}99`,
                        fontSize: 11,
                        lineHeight: 1.35,
                      }}
                    >
                      {control.control} · {control.apiPath}
                    </span>
                  </div>
                  {actionHref(control)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        data-setup-wireframe-grid="below"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <article style={cardStyle}>
          <div
            style={{
              padding: "16px 18px",
              borderBottom: `1px solid ${COLORS.ink}14`,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Data loaded by dimension
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                color: `${COLORS.ink}aa`,
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              Clear enough to answer: what is loaded, what is complete, what is
              blocked, and which product surfaces can use it.
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 760,
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ color: `${COLORS.ink}99`, textAlign: "left" }}>
                  {[
                    "Dimension",
                    "Complete",
                    "Current gate",
                    "Needed next",
                    "Unlocks",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: "10px 12px",
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
                {model.dimensionReadiness.map((row) => (
                  <tr key={row.dimension}>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${COLORS.ink}10`,
                        fontWeight: 800,
                      }}
                    >
                      {row.dimension}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${COLORS.ink}10`,
                        minWidth: 150,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <div
                          aria-label={`${row.dimension} ${row.completenessPercent}% complete`}
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: RADIUS.pill,
                            background: `${COLORS.ink}18`,
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: `${row.completenessPercent}%`,
                              height: "100%",
                              background: COLORS.navy,
                            }}
                          />
                        </div>
                        <strong style={{ fontSize: 12 }}>
                          {row.completenessPercent}%
                        </strong>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${COLORS.ink}10`,
                      }}
                    >
                      {row.currentGate}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${COLORS.ink}10`,
                      }}
                    >
                      {row.nextAction}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${COLORS.ink}10`,
                        color: `${COLORS.ink}cc`,
                      }}
                    >
                      {row.unlocks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside style={{ ...cardStyle, padding: 16, display: "grid", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Work queue</h2>
            <p
              style={{
                margin: "5px 0 0",
                color: `${COLORS.ink}aa`,
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              Plain-language actions for the active client only.
            </p>
          </div>
          {model.workQueue.map((item) => {
            const colors = queueColors[item.severity];
            return (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${COLORS.ink}14`,
                  borderRadius: RADIUS.md,
                  padding: 12,
                  background: COLORS.white,
                  display: "grid",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: "fit-content",
                    borderRadius: RADIUS.pill,
                    padding: "3px 7px",
                    background: colors.bg,
                    color: colors.fg,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {item.severity === "blocked"
                    ? "Blocked"
                    : item.severity === "attention"
                      ? "Review"
                      : "Ready"}
                </span>
                <strong style={{ fontSize: 14 }}>{item.title}</strong>
                <span
                  style={{
                    color: `${COLORS.ink}aa`,
                    fontSize: 12,
                    lineHeight: 1.35,
                  }}
                >
                  {item.detail}
                </span>
              </div>
            );
          })}
        </aside>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${COLORS.ink}14`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Template explorer</h2>
          <p
            style={{
              margin: "5px 0 0",
              color: `${COLORS.ink}aa`,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            Registry templates and Day One workbooks stay available for drill-in
            review after the decision summary.
          </p>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 380, overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 980,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ color: `${COLORS.ink}aa`, textAlign: "left" }}>
                {[
                  "Template",
                  "Family",
                  "Dimension",
                  "Formats",
                  "Required fields",
                  "Owner/source",
                  "Unlocks",
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      padding: "10px 12px",
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
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                      fontWeight: 800,
                    }}
                  >
                    {template.title}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    {template.family}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    {template.dimension}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    {template.formats}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    {template.requiredFields}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
                    }}
                  >
                    {template.ownerOrSource}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      borderBottom: `1px solid ${COLORS.ink}10`,
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
