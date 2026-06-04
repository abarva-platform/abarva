import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import { CsvUploadConnector } from "@/components/admin/context-layer/CsvUploadConnector";
import type {
  LoadStudioControl,
  LoadStudioFormatSupport,
  LoadStudioReadinessRow,
  LoadStudioStep,
  LoadStudioTemplateCard,
  LoadStudioView,
  MetricTone,
  StatusTone,
  StepState,
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

function progressBar(value: number) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 82,
        height: 6,
        borderRadius: RADIUS.pill,
        background: `${COLORS.ink}12`,
        overflow: "hidden",
        verticalAlign: "middle",
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
    </span>
  );
}

// ── Workflow rail ────────────────────────────────────────────────────
function stepBackground(state: StepState): string {
  switch (state) {
    case "done":
      return COLORS.mintSoft;
    case "active":
      return COLORS.amberSoft;
    case "blocked":
      return COLORS.coralSoft;
    default:
      return COLORS.white;
  }
}

function stepAccent(state: StepState): string {
  switch (state) {
    case "done":
      return COLORS.mintInk;
    case "active":
      return COLORS.amberInk;
    case "blocked":
      return COLORS.coralInk;
    default:
      return `${COLORS.ink}88`;
  }
}

function workflowStep(step: LoadStudioStep, isLast: boolean) {
  return (
    <div
      key={step.num}
      style={{
        minHeight: 76,
        padding: "12px 10px",
        textAlign: "center",
        borderRight: isLast ? "none" : `1px solid ${COLORS.ink}14`,
        background: stepBackground(step.state),
      }}
    >
      <span style={{ ...labelStyle(), display: "block" }}>{step.num}</span>
      <strong
        style={{
          display: "block",
          marginTop: 5,
          fontSize: 12,
          color: stepAccent(step.state),
        }}
      >
        {step.name}
      </strong>
      <span
        style={{
          display: "block",
          marginTop: 3,
          fontSize: 10,
          color: `${COLORS.ink}88`,
        }}
      >
        {step.status}
      </span>
    </div>
  );
}

// ── Readiness table ──────────────────────────────────────────────────
function readinessRow(row: LoadStudioReadinessRow, isLast: boolean) {
  const cell = {
    padding: "14px",
    borderBottom: isLast ? "none" : `1px solid ${COLORS.ink}10`,
    verticalAlign: "middle" as const,
    fontSize: 13,
  };
  return (
    <tr key={row.segmentId}>
      <td style={cell}>
        <strong style={{ display: "block", fontSize: 13.5 }}>
          {row.dimension}
        </strong>
        <span style={{ color: `${COLORS.ink}99`, fontSize: 11 }}>
          {row.detail}
        </span>
      </td>
      <td style={cell}>{statusPill(row.statusLabel, row.statusTone)}</td>
      <td style={cell}>
        {row.completePercent === null ? (
          <span style={{ color: `${COLORS.ink}66` }}>—</span>
        ) : (
          <span
            style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            {progressBar(row.completePercent)}
            <span style={{ fontSize: 11, color: `${COLORS.ink}99` }}>
              {row.completePercent}%
            </span>
          </span>
        )}
      </td>
      <td style={{ ...cell, color: `${COLORS.ink}99`, fontSize: 12 }}>
        {row.lastLoaded}
      </td>
      <td style={cell}>{actionLink(row.action.href, row.action.label)}</td>
    </tr>
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

function formatBadge(format: string, active = false) {
  return (
    <span
      key={format}
      style={{
        display: "inline-flex",
        width: "fit-content",
        borderRadius: RADIUS.pill,
        padding: "3px 8px",
        border: `1px solid ${active ? COLORS.mintInk : COLORS.ink}33`,
        color: active ? COLORS.mintInk : `${COLORS.ink}99`,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {format}
    </span>
  );
}

function formatSupportCard(item: LoadStudioFormatSupport) {
  const live = item.path === "live";
  return (
    <div
      key={item.format}
      style={{
        padding: "10px 12px",
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.sm,
        background: live ? COLORS.mintSoft : COLORS.white,
        minHeight: 86,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12 }}>
          {item.format}
        </strong>
        <span style={{ color: `${COLORS.ink}88`, fontSize: 11 }}>
          {item.templates} templates
        </span>
      </div>
      <p style={{ margin: "8px 0 0", color: `${COLORS.ink}99`, fontSize: 11 }}>
        {item.note}
      </p>
    </div>
  );
}

function templateCard(template: LoadStudioTemplateCard) {
  return (
    <article
      key={template.id}
      style={{
        padding: 14,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.sm,
        background: COLORS.white,
        display: "grid",
        gap: 9,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 14 }}>{template.label}</h3>
        <p
          style={{ margin: "4px 0 0", color: `${COLORS.ink}88`, fontSize: 11 }}
        >
          Owner: {template.owner}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {template.formats.map((format) =>
          formatBadge(format, format === "CSV"),
        )}
      </div>
      <p style={{ margin: 0, color: `${COLORS.ink}99`, fontSize: 11 }}>
        Required: {template.requiredFields}
      </p>
      <p style={{ margin: 0, color: COLORS.amberInk, fontSize: 11 }}>
        {template.primaryPath}
      </p>
      {actionLink(template.action.href, template.action.label)}
    </article>
  );
}

export function SetupDataLoadCenter({
  view,
  clientId,
}: SetupDataLoadCenterProps) {
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

      {/* ── Load launcher — template-aware and honest on format support ─ */}
      <section
        aria-label="Load a new client file"
        style={{
          ...cardStyle,
          padding: 18,
          display: "grid",
          gap: 18,
        }}
      >
        <div
          data-load-grid="load-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.95fr) minmax(360px, 1.05fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ ...labelStyle(COLORS.mintInk) }}>
                Load data here
              </div>
              <h2 style={{ margin: "5px 0 6px", fontSize: 21 }}>
                {view.templateGuide.headline}
              </h2>
              <p style={{ margin: 0, color: `${COLORS.ink}99`, fontSize: 13 }}>
                {view.templateGuide.detail}
              </p>
            </div>
            <div
              style={{
                border: `1px solid ${COLORS.amberInk}30`,
                borderRadius: RADIUS.sm,
                background: COLORS.amberSoft,
                padding: 12,
                color: COLORS.amberInk,
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {view.templateGuide.liveUploadLabel}
            </div>
            <div>
              <div style={{ ...labelStyle(), marginBottom: 8 }}>
                Formats by governed path
              </div>
              <div
                data-load-grid="format-support"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {view.templateGuide.formatSupport.map(formatSupportCard)}
              </div>
            </div>
            <div>
              <div style={{ ...labelStyle(), marginBottom: 8 }}>
                Starter dimensions
              </div>
              <div
                data-load-grid="starter-templates"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {view.templateGuide.starterTemplates.map(templateCard)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ghostButton(
                view.templateGuide.allTemplatesAction.href,
                view.templateGuide.allTemplatesAction.label,
              )}
              {primaryButton(
                view.templateGuide.uploadAction.href,
                view.templateGuide.uploadAction.label,
              )}
            </div>
          </div>

          <CsvUploadConnector clientId={clientId} tenantName={tenant.name} />
        </div>
      </section>

      {/* ── Workflow rail — the governed-load sequence ────────────── */}
      <section aria-label="Governed load workflow">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div style={labelStyle()}>Governed load workflow</div>
          <span style={{ color: `${COLORS.ink}99`, fontSize: 12 }}>
            Every load follows these seven steps · across all dimensions
          </span>
        </div>
        <div
          data-load-grid="steps"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            ...cardStyle,
            overflow: "hidden",
          }}
        >
          {view.workflow.map((s, i) =>
            workflowStep(s, i === view.workflow.length - 1),
          )}
        </div>
      </section>

      {/* ── Body: readiness table + governance controls ───────────── */}
      <div
        data-load-grid="body"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 312px",
          gap: 18,
          alignItems: "start",
        }}
      >
        <section style={cardStyle} aria-label="Loaded data by dimension">
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
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Loaded data by dimension
              </h2>
              <p
                style={{
                  margin: "3px 0 0",
                  color: `${COLORS.ink}99`,
                  fontSize: 12,
                }}
              >
                What is loaded, what needs attention, and the next action.
              </p>
            </div>
            {ghostButton(view.templatesHref, "All templates")}
          </div>
          {view.readiness.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                color: `${COLORS.ink}99`,
                fontSize: 13,
              }}
            >
              No data has been loaded for {tenant.name} yet. Start a governed
              load to ground this client&rsquo;s assistants.
            </div>
          ) : (
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
                    {[
                      "Dimension",
                      "Status",
                      "Complete",
                      "Last loaded",
                      "Next action",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          ...labelStyle(),
                          padding: "12px 14px",
                          textAlign: "left",
                          background: COLORS.cream,
                          borderBottom: `1px solid ${COLORS.ink}14`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.readiness.map((r, i) =>
                    readinessRow(r, i === view.readiness.length - 1),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside style={cardStyle} aria-label="Governance controls">
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
              Visible actions only — no developer checklist.
            </p>
          </div>
          {view.controls.map((c, i) =>
            controlCard(c, i === view.controls.length - 1),
          )}
        </aside>
      </div>

      {/* ── Audit-trail preview — real recent events ──────────────── */}
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
            <p
              style={{
                margin: "3px 0 0",
                color: `${COLORS.ink}99`,
                fontSize: 12,
              }}
            >
              Recent load events for {tenant.name}. The full ledger opens in
              Data Trust.
            </p>
          </div>
          {ghostButton(view.verifierHref, "Production readiness")}
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
  );
}
