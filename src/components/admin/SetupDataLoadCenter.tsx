import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import type {
  LoadStudioControl,
  LoadStudioReadinessRow,
  LoadStudioTemplateCard,
  LoadStudioView,
  MetricTone,
  StatusTone,
} from "@/lib/admin/setup-load-studio-view";

interface SetupDataLoadCenterProps {
  view: LoadStudioView;
  clientId: string;
}

/**
 * Data Loads — the governed data-load workflow for one client.
 *
 * 2026-06-02 redesign (audit + v2 wireframe). The page is the
 * operator workflow only: identity band, real status strip, the
 * single next action, a governed-load workflow rail, the dimension
 * readiness table (real per-tenant coverage), the governance
 * controls, and an audit-trail preview. The reload-command-plan,
 * pilot-verifier checklist, and 33-row template catalog moved to
 * their own routes (Production Readiness / Templates). Every number
 * is real from the inventory snapshot, with honest empty states.
 *
 * Locked design system: cream surfaces, near-black ink, serif
 * display, black + ghost buttons, hairline borders. One accent
 * (amber = needs action) earns the eye; status is never a decorative
 * filled chip.
 */

// ── Tone → calm accent (the one accent that earns attention) ─────────
function toneAccent(tone: StatusTone | MetricTone): string {
  switch (tone) {
    case "blocked":
    case "risk":
      return COLORS.coralInk;
    case "attention":
      return COLORS.amberInk;
    case "ready":
    case "good":
      return COLORS.mintInk;
    default:
      return `${COLORS.ink}99`;
  }
}

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

const cardStyle = {
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  background: COLORS.white,
} as const;

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
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

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
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

function statusPill(label: string, tone: StatusTone) {
  const accent = toneAccent(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        width: "fit-content",
        borderRadius: RADIUS.pill,
        padding: "3px 10px",
        border: `1px solid ${accent}44`,
        color: accent,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function actionLink(href: string, label: string) {
  return (
    <a
      href={href}
      style={{
        color: COLORS.ink,
        fontSize: 12,
        fontWeight: 700,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

// ── Governance control card ──────────────────────────────────────────
function controlCard(control: LoadStudioControl, isLast: boolean) {
  return (
    <div
      key={control.label}
      style={{
        padding: "16px 18px",
        borderBottom: isLast ? "none" : `1px solid ${COLORS.ink}14`,
      }}
    >
      <div style={labelStyle()}>{control.label}</div>
      <strong
        style={{
          display: "block",
          marginTop: 6,
          fontSize: 14,
          color: toneAccent(control.tone),
        }}
      >
        {control.headline}
      </strong>
      <p
        style={{ margin: "5px 0 10px", color: `${COLORS.ink}99`, fontSize: 12 }}
      >
        {control.detail}
      </p>
      {actionLink(control.action.href, control.action.label)}
    </div>
  );
}

function cabinetFolder(label: string, detail: string, active = false) {
  return (
    <button
      key={label}
      type="button"
      style={{
        border: 0,
        borderRadius: RADIUS.sm,
        background: active ? COLORS.ink : "transparent",
        color: active ? COLORS.white : COLORS.ink,
        cursor: "default",
        display: "grid",
        gap: 3,
        padding: "10px 12px",
        textAlign: "left",
        width: "100%",
      }}
    >
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <span
        style={{
          color: active ? `${COLORS.white}b8` : `${COLORS.ink}88`,
          fontSize: 11,
        }}
      >
        {detail}
      </span>
    </button>
  );
}

function templateCabinetRow(template: LoadStudioTemplateCard, isLast: boolean) {
  const cell = {
    padding: "13px 14px",
    borderBottom: isLast ? "none" : `1px solid ${COLORS.ink}10`,
    verticalAlign: "top" as const,
    fontSize: 13,
  };
  return (
    <tr key={template.id}>
      <td style={cell}>
        <strong style={{ display: "block" }}>{template.label}</strong>
        <span style={{ color: `${COLORS.ink}88`, fontSize: 11 }}>
          Owner: {template.owner}
        </span>
      </td>
      <td style={{ ...cell, color: `${COLORS.ink}99` }}>
        {template.formats.join(", ")}
      </td>
      <td style={cell}>{statusPill("Ready to load", "empty")}</td>
      <td style={{ ...cell, color: `${COLORS.ink}99`, lineHeight: 1.45 }}>
        {template.requiredFields}
      </td>
      <td style={cell}>{actionLink(template.action.href, template.action.label)}</td>
    </tr>
  );
}

function readinessCabinetRow(row: LoadStudioReadinessRow, isLast: boolean) {
  const cell = {
    padding: "13px 14px",
    borderBottom: isLast ? "none" : `1px solid ${COLORS.ink}10`,
    verticalAlign: "top" as const,
    fontSize: 13,
  };
  return (
    <tr key={row.segmentId}>
      <td style={cell}>
        <strong style={{ display: "block" }}>{row.dimension}</strong>
        <span style={{ color: `${COLORS.ink}88`, fontSize: 11 }}>
          {row.detail}
        </span>
      </td>
      <td style={{ ...cell, color: `${COLORS.ink}99` }}>Committed context</td>
      <td style={cell}>{statusPill(row.statusLabel, row.statusTone)}</td>
      <td style={{ ...cell, color: `${COLORS.ink}99` }}>
        {row.completePercent === null ? "Not measured yet" : `${row.completePercent}% coverage`}
        <br />
        Last loaded: {row.lastLoaded}
      </td>
      <td style={cell}>{actionLink(row.action.href, row.action.label)}</td>
    </tr>
  );
}

export function SetupDataLoadCenter({ view }: SetupDataLoadCenterProps) {
  const { tenant } = view;

  return (
    <div
      style={{
        fontFamily: TYPOGRAPHY.sans,
        color: COLORS.ink,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Responsive: collapse the two-column grid below 1060px and the
          multi-column strips below 760px. The masthead + sidebar are
          owned by AdminCanonShellV2; this is the content canvas only. */}
      <style>{`
        @media (max-width: 1060px) {
          [data-load-grid="body"] { grid-template-columns: minmax(0, 1fr) !important; }
        }
        @media (max-width: 760px) {
          [data-load-grid="metrics"] { grid-template-columns: 1fr 1fr !important; }
          [data-load-grid="steps"] { grid-template-columns: 1fr 1fr !important; }
          [data-load-grid="format-support"] { grid-template-columns: 1fr 1fr !important; }
          [data-load-grid="starter-templates"] { grid-template-columns: 1fr !important; }
          [data-load-grid="load-panel"] { grid-template-columns: minmax(0, 1fr) !important; }
          [data-load-grid="identity"] { flex-wrap: wrap !important; }
          [data-load-grid="table-scroll"] { overflow-x: auto !important; }
        }
      `}</style>

      {/* ── Client identity band ──────────────────────────────────── */}
      <section
        data-load-grid="identity"
        aria-label="Client and data-load summary"
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <span
          aria-hidden
          style={{
            width: 56,
            height: 56,
            display: "grid",
            placeItems: "center",
            borderRadius: RADIUS.lg,
            background: COLORS.ink,
            color: COLORS.white,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {tenant.initials}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={labelStyle()}>{tenant.breadcrumb}</div>
          <h1
            style={{
              margin: "4px 0 0",
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 30,
              lineHeight: 1.1,
              fontWeight: 500,
            }}
          >
            Load data for {tenant.name}
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              maxWidth: 760,
              color: `${COLORS.ink}99`,
              fontSize: 14,
            }}
          >
            One client at a time. Choose a dimension, load the file, validate
            it, approve it, and commit it with an audit trail — for this client
            only.
          </p>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {ghostButton(view.templatesHref, "View templates")}
          {primaryButton(view.startLoadHref, "Start a governed load")}
        </div>
      </section>

      {/* ── Status strip — every metric real per tenant ───────────── */}
      <section
        data-load-grid="metrics"
        aria-label="Data-load readiness"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          ...cardStyle,
          overflow: "hidden",
        }}
      >
        {view.metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              padding: "16px 18px",
              borderRight:
                i === view.metrics.length - 1
                  ? "none"
                  : `1px solid ${COLORS.ink}14`,
            }}
          >
            <div style={labelStyle()}>{m.label}</div>
            <div
              style={{
                marginTop: 8,
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 27,
                lineHeight: 1,
                fontWeight: 700,
                color: m.tone === "default" ? COLORS.ink : toneAccent(m.tone),
              }}
            >
              {m.value}
            </div>
            <div
              style={{ marginTop: 5, color: `${COLORS.ink}99`, fontSize: 12 }}
            >
              {m.note}
            </div>
          </div>
        ))}
      </section>

      {/* ── Next action — one decisive call-out ───────────────────── */}
      {view.nextAction ? (
        <section
          aria-label="Next data-load action"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 18,
            alignItems: "center",
            padding: "18px 20px",
            border: `1px solid ${COLORS.amberInk}40`,
            borderRadius: RADIUS.md,
            background: COLORS.amberSoft,
          }}
        >
          <div>
            <div style={{ ...labelStyle(COLORS.amberInk) }}>Next action</div>
            <h2 style={{ margin: "4px 0 4px", fontSize: 17, lineHeight: 1.25 }}>
              {view.nextAction.headline}
            </h2>
            <p style={{ margin: 0, color: COLORS.amberInk, fontSize: 13 }}>
              {view.nextAction.detail}
            </p>
          </div>
          {view.nextAction.action
            ? primaryButton(
                view.nextAction.action.href,
                view.nextAction.action.label,
              )
            : null}
        </section>
      ) : null}

      {/* ── Data cabinet — table-first, no competing upload widget ─ */}
      <section
        aria-label="Client data cabinet"
        style={{
          ...cardStyle,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "230px minmax(0, 1fr)",
            minHeight: 420,
          }}
        >
          <aside
            aria-label="Data folders"
            style={{
              borderRight: `1px solid ${COLORS.ink}14`,
              background: COLORS.cream,
              padding: 12,
              display: "grid",
              alignContent: "start",
              gap: 6,
            }}
          >
            <div style={{ ...labelStyle(), padding: "4px 8px 8px" }}>
              Current state
            </div>
            {cabinetFolder("All loaded files", `${view.readiness.length} dimensions`, true)}
            {cabinetFolder(
              "Needs attention",
              `${view.metrics[2]?.value ?? "0"} open issue${view.metrics[2]?.value === "1" ? "" : "s"}`,
            )}
            {cabinetFolder("Templates", `${view.templateGuide.starterTemplates.length} starter areas`)}
            <div
              style={{
                borderTop: `1px solid ${COLORS.ink}12`,
                marginTop: 8,
                paddingTop: 8,
                display: "grid",
                gap: 4,
              }}
            >
              {(view.readiness.length > 0
                ? view.readiness.slice(0, 6).map((row) => ({
                    label: row.dimension,
                    detail: row.statusLabel,
                  }))
                : view.templateGuide.starterTemplates.slice(0, 6).map((row) => ({
                    label: row.label,
                    detail: row.formats.join(", "),
                  }))
              ).map((folder) => cabinetFolder(folder.label, folder.detail))}
            </div>
          </aside>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                padding: "18px 20px",
                borderBottom: `1px solid ${COLORS.ink}14`,
              }}
            >
              <div>
                <div style={{ ...labelStyle(COLORS.mintInk) }}>
                  Data cabinet
                </div>
                <h2 style={{ margin: "4px 0 4px", fontSize: 22 }}>
                  {view.hasData ? "Loaded client context" : "Start with these real-world files"}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: `${COLORS.ink}99`,
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  AbarVa keeps originals, validates the mapping, scans
                  restricted data, and commits only approved rows as cited
                  tenant context.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ghostButton(view.templatesHref, "Templates")}
                {primaryButton(view.templateGuide.uploadAction.href, "Upload file")}
              </div>
            </div>

            <div
              aria-label="Upload workflow preview"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 0,
                borderBottom: `1px solid ${COLORS.ink}14`,
                background: "#fbfaf7",
              }}
            >
              {[
                ["1. Choose", "File + data area"],
                ["2. Detect", "Template and fields"],
                ["3. Review", "Scan, warnings, preview"],
                ["4. Commit", "Approved context"],
              ].map(([title, detail], index) => (
                <div
                  key={title}
                  style={{
                    padding: "12px 14px",
                    borderRight:
                      index === 3 ? "none" : `1px solid ${COLORS.ink}10`,
                  }}
                >
                  <strong style={{ display: "block", fontSize: 12 }}>
                    {title}
                  </strong>
                  <span style={{ color: `${COLORS.ink}88`, fontSize: 11 }}>
                    {detail}
                  </span>
                </div>
              ))}
            </div>

            <div data-load-grid="table-scroll">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    {["Name", "Kind", "Status", "What good looks like", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            ...labelStyle(),
                            padding: "12px 14px",
                            textAlign: "left",
                            background: COLORS.white,
                            borderBottom: `1px solid ${COLORS.ink}14`,
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {view.hasData
                    ? view.readiness.map((row, index) =>
                        readinessCabinetRow(
                          row,
                          index === view.readiness.length - 1,
                        ),
                      )
                    : view.templateGuide.starterTemplates.map((template, index) =>
                        templateCabinetRow(
                          template,
                          index === view.templateGuide.starterTemplates.length - 1,
                        ),
                      )}
                </tbody>
              </table>
            </div>

            {!view.hasData ? (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: `1px solid ${COLORS.ink}10`,
                  color: `${COLORS.ink}99`,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                CSV is the live structured commit path today. Excel, PDF, Word,
                PowerPoint, and ZIP enter controlled intake until deterministic
                parser review is enabled.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Governance and ledger — compact, below the cabinet ───── */}
      <div
        data-load-grid="body"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <section style={cardStyle} aria-label="Governance controls">
          <div
            style={{
              padding: "16px 18px",
              borderBottom: `1px solid ${COLORS.ink}14`,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>Controls</h2>
            <p
              style={{
                margin: "3px 0 0",
                color: `${COLORS.ink}99`,
                fontSize: 12,
              }}
            >
              Visible safeguards for scan, approval, quarantine, and rollback.
            </p>
          </div>
          {view.controls.slice(0, 4).map((c, i) =>
            controlCard(c, i === Math.min(view.controls.length, 4) - 1),
          )}
        </section>

        <section style={cardStyle} aria-label="Audit trail">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderBottom: `1px solid ${COLORS.ink}14`,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Audit trail</h2>
              <p style={{ margin: 0, color: `${COLORS.ink}99`, fontSize: 13 }}>
                Recent load events for {tenant.name}. The full ledger opens in
                Data Trust.
              </p>
            </div>
            {ghostButton(view.verifierHref, "Readiness")}
          </div>
          {view.ledger.length === 0 ? (
            <div
              style={{
                padding: "22px 18px",
                color: `${COLORS.ink}99`,
                fontSize: 13,
              }}
            >
              No load events recorded yet for {tenant.name}.
            </div>
          ) : (
            view.ledger.map((e, i) => (
              <div
                key={`${e.what}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 14,
                  padding: "12px 18px",
                  borderBottom:
                    i === view.ledger.length - 1
                      ? "none"
                      : `1px solid ${COLORS.ink}10`,
                  fontSize: 12,
                }}
              >
                <strong style={{ fontWeight: 600 }}>{e.what}</strong>
                <span style={{ color: `${COLORS.ink}99` }}>
                  {e.when} · {e.who}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
