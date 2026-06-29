"use client";

// MovesExplorer — a Finder-style explorer for a Strategic Move.
//
// Replaces the flat "Documents" wall with a navigable tree: Move → each phase →
// three folders (Templates · Inputs · Deliverables) → leaf nodes, with a read-only
// detail pane on the right. Browse only — generation stays a phase action (Approve
// & Build), and a changed deliverable is re-run through the phase, never an isolated
// regenerate (so there is no generate/regenerate control in here).
//
// The model is built server-side (StrategicMoveDetailView → ExplorerContent) from the
// same deliverables_v2 + attachments + deliverable-registry data the Documents tab uses.

import { useState } from "react";

export interface ExplorerTemplate {
  title: string;
  purpose: string;
  audience: string;
  gate: boolean;
}
export interface ExplorerInput {
  id: string;
  name: string;
  meta: string;
  href: string;
}
export interface ExplorerDeliverable {
  key: string;
  title: string;
  audience: string;
  gate: boolean;
  status: "ready" | "review" | "draft" | "none";
  downloadHtml?: string;
  downloadDocx?: string;
  date?: string;
}
export interface ExplorerPhase {
  phase: number;
  label: string;
  current: boolean;
  locked: boolean;
  gateMet: number;
  gateTotal: number;
  templates: ExplorerTemplate[];
  inputs: ExplorerInput[];
  deliverables: ExplorerDeliverable[];
}
export interface ExplorerModel {
  moveId: string;
  moveName: string;
  currentPhase: number;
  phases: ExplorerPhase[];
}

const NAVY = "#1B2B5C";
const LINE = "#e5e5e5";
const INK = "#1A1A18";
const MUTE = "#9AA3B2";
const SUB = "#6B7280";
const SURFACE = "#FFFFFF";
const FILL = "#F6F5F1";

const STATUS: Record<
  ExplorerDeliverable["status"],
  { color: string; label: string }
> = {
  ready: { color: "#3F7A5B", label: "ready" },
  review: { color: "#B5852A", label: "in review" },
  draft: { color: "#888780", label: "draft" },
  none: { color: "#C9C7BE", label: "not generated" },
};

type Sel =
  | { kind: "phase"; p: number }
  | { kind: "template"; p: number; i: number }
  | { kind: "input"; p: number; i: number }
  | { kind: "deliverable"; p: number; i: number }
  | null;

function eyebrow(text: string) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: MUTE,
        fontFamily: "JetBrains Mono, monospace",
        marginBottom: 6,
      }}
    >
      {text}
    </div>
  );
}

export function MovesExplorer({
  model,
  presentationMode = false,
}: {
  model: ExplorerModel;
  presentationMode?: boolean;
}) {
  const cur = model.phases.find((p) => p.current) ?? model.phases[0];
  const curGate = cur?.deliverables.findIndex((d) => d.gate) ?? -1;
  const [open, setOpen] = useState<Set<string>>(
    new Set(["root", `p${cur?.phase}`, `p${cur?.phase}-del`]),
  );
  const [sel, setSel] = useState<Sel>(
    cur && curGate >= 0
      ? { kind: "deliverable", p: cur.phase, i: curGate }
      : null,
  );

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const isOpen = (id: string) => open.has(id);

  const caret = (id: string) => (
    <span
      style={{ width: 13, display: "inline-block", color: MUTE, fontSize: 11 }}
    >
      {isOpen(id) ? "▾" : "▸"}
    </span>
  );

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: presentationMode ? "6px 8px" : "5px 6px",
    borderRadius: presentationMode ? 7 : 5,
    cursor: "pointer",
    fontSize: 12.5,
    lineHeight: 1.3,
    color: active ? NAVY : INK,
    background: active ? "rgba(27,43,92,0.07)" : "transparent",
    fontWeight: active ? 600 : 400,
  });

  const folder = (
    phase: ExplorerPhase,
    name: "Templates" | "Inputs" | "Deliverables",
    suffix: "tmpl" | "inp" | "del",
    count: number,
    children: React.ReactNode,
  ) => {
    const id = `p${phase.phase}-${suffix}`;
    return (
      <div>
        <div
          style={{ ...rowStyle(false), marginLeft: 12 }}
          onClick={() => toggle(id)}
        >
          {caret(id)}
          <span style={{ color: MUTE }}>{name}</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: MUTE,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {count}
          </span>
        </div>
        {isOpen(id) && <div style={{ marginLeft: 26 }}>{children}</div>}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: presentationMode ? "280px 1fr" : "252px 1fr",
        gap: presentationMode ? 18 : 16,
        alignItems: "start",
      }}
    >
      {/* ── Tree ── */}
      <div
        style={{
          background: presentationMode ? "#fbfaf6" : FILL,
          border: `1px solid ${LINE}`,
          borderRadius: presentationMode ? 12 : 10,
          padding: presentationMode ? "10px 8px" : "8px 6px",
          maxHeight: "70vh",
          overflow: "auto",
        }}
      >
        <div style={rowStyle(false)} onClick={() => toggle("root")}>
          {caret("root")}
          <span
            style={{
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {model.moveName}
          </span>
        </div>
        {isOpen("root") &&
          model.phases.map((phase) => {
            const pid = `p${phase.phase}`;
            return (
              <div key={pid} style={{ marginLeft: 12 }}>
                <div
                  style={rowStyle(
                    sel?.kind === "phase" && sel.p === phase.phase,
                  )}
                  onClick={() => {
                    toggle(pid);
                    setSel({ kind: "phase", p: phase.phase });
                  }}
                >
                  {caret(pid)}
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: phase.current
                        ? NAVY
                        : phase.locked
                          ? "#C9C7BE"
                          : "#3F7A5B",
                      flex: "0 0 auto",
                    }}
                  />
                  <span
                    style={{
                      color: phase.locked ? MUTE : INK,
                      fontWeight: phase.current ? 600 : 400,
                    }}
                  >
                    {phase.label}
                  </span>
                  {phase.locked && (
                    <span
                      style={{ marginLeft: "auto", fontSize: 10, color: MUTE }}
                    >
                      🔒
                    </span>
                  )}
                </div>
                {isOpen(pid) && (
                  <div>
                    {folder(
                      phase,
                      "Templates",
                      "tmpl",
                      phase.templates.length,
                      phase.templates.map((t, i) => (
                        <div
                          key={i}
                          style={rowStyle(
                            sel?.kind === "template" &&
                              sel.p === phase.phase &&
                              sel.i === i,
                          )}
                          onClick={() =>
                            setSel({ kind: "template", p: phase.phase, i })
                          }
                        >
                          <span style={{ width: 13 }} />
                          📄<span>{t.title}</span>
                        </div>
                      )),
                    )}
                    {folder(
                      phase,
                      "Inputs",
                      "inp",
                      phase.inputs.length,
                      phase.inputs.length === 0 ? (
                        <div
                          style={{
                            ...rowStyle(false),
                            color: MUTE,
                            fontStyle: "italic",
                            cursor: "default",
                          }}
                        >
                          <span style={{ width: 13 }} />
                          none yet
                        </div>
                      ) : (
                        phase.inputs.map((inp, i) => (
                          <div
                            key={inp.id}
                            style={rowStyle(
                              sel?.kind === "input" &&
                                sel.p === phase.phase &&
                                sel.i === i,
                            )}
                            onClick={() =>
                              setSel({ kind: "input", p: phase.phase, i })
                            }
                          >
                            <span style={{ width: 13 }} />
                            📎
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {inp.name}
                            </span>
                          </div>
                        ))
                      ),
                    )}
                    {folder(
                      phase,
                      "Deliverables",
                      "del",
                      phase.deliverables.length,
                      phase.deliverables.map((d, i) => (
                        <div
                          key={d.key}
                          style={rowStyle(
                            sel?.kind === "deliverable" &&
                              sel.p === phase.phase &&
                              sel.i === i,
                          )}
                          onClick={() =>
                            setSel({ kind: "deliverable", p: phase.phase, i })
                          }
                        >
                          <span style={{ width: 13 }} />
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: STATUS[d.status].color,
                              flex: "0 0 auto",
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {d.title}
                          </span>
                          {d.gate && !presentationMode && (
                            <span
                              style={{
                                fontSize: 8.5,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                color: "#B5852A",
                                background: "rgba(181,133,42,0.12)",
                                padding: "1px 5px",
                                borderRadius: 2,
                                fontFamily: "JetBrains Mono, monospace",
                              }}
                            >
                              GATE
                            </span>
                          )}
                        </div>
                      )),
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ── Detail ── */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${LINE}`,
          borderRadius: presentationMode ? 14 : 12,
          padding: presentationMode ? "20px 22px" : "18px 20px",
          minHeight: 280,
        }}
      >
        <Detail model={model} sel={sel} presentationMode={presentationMode} />
      </div>
    </div>
  );
}

function Detail({
  model,
  sel,
  presentationMode = false,
}: {
  model: ExplorerModel;
  sel: Sel;
  presentationMode?: boolean;
}) {
  const serif = "Fraunces, Georgia, serif";
  if (!sel)
    return (
      <div style={{ color: MUTE, fontSize: 13 }}>
        Select an item to view it.
      </div>
    );
  const phase = model.phases.find((p) => p.phase === sel.p);
  if (!phase) return null;

  if (sel.kind === "phase") {
    return (
      <div>
        {eyebrow(`${phase.label} · gate`)}
        <div
          style={{
            fontFamily: serif,
            fontSize: presentationMode ? 18 : 19,
            fontWeight: 650,
          }}
        >
          {phase.label}
        </div>
        <div
          style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          {[
            ["Gate", `${phase.gateMet}/${phase.gateTotal} ready`],
            ["Artifacts", String(phase.deliverables.length)],
            ["Inputs", String(phase.inputs.length)],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                background: FILL,
                borderRadius: 8,
                padding: "9px 12px",
                minWidth: 96,
              }}
            >
              <div style={{ fontSize: 10.5, color: SUB }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 12.5,
            color: SUB,
            background: FILL,
            borderRadius: 8,
            padding: "11px 13px",
          }}
        >
          <b style={{ color: INK }}>Approve &amp; Build</b> creates the phase
          package, clears the gate when ready, and unlocks the next step. This
          view is for review and download.
        </div>
      </div>
    );
  }

  if (sel.kind === "template") {
    const t = phase.templates[sel.i];
    if (!t) return null;
    return (
      <div>
        {eyebrow(`${phase.label} · template &amp; guide`)}
        <div style={{ fontFamily: serif, fontSize: 19 }}>{t.title}</div>
        <div style={{ fontSize: 12.5, color: SUB, margin: "6px 0 14px" }}>
          {t.audience}
          {t.gate ? " · gate artifact" : ""}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{t.purpose}</div>
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: MUTE,
            fontStyle: "italic",
          }}
        >
          The standard &ldquo;what good looks like&rdquo; for this deliverable.
          Filled inputs land under Inputs and feed the build.
        </div>
      </div>
    );
  }

  if (sel.kind === "input") {
    const inp = phase.inputs[sel.i];
    if (!inp) return null;
    return (
      <div>
        {eyebrow(`${phase.label} · input file`)}
        <div
          style={{ fontFamily: serif, fontSize: 19, wordBreak: "break-word" }}
        >
          {inp.name}
        </div>
        <div style={{ fontSize: 12.5, color: SUB, margin: "6px 0 14px" }}>
          {inp.meta}
        </div>
        <a
          href={inp.href}
          style={{
            display: "inline-flex",
            gap: 5,
            padding: "7px 13px",
            borderRadius: 6,
            background: NAVY,
            color: "#fff",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          ↓ Open
        </a>
      </div>
    );
  }

  // deliverable
  const d = phase.deliverables[sel.i];
  if (!d) return null;
  const ready = d.status !== "none";
  return (
    <div>
      {eyebrow(
        `${phase.label} · deliverable${d.gate && !presentationMode ? " · gate artifact" : ""}`,
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 20 }}>{d.title}</div>
        <span
          style={{
            fontSize: 11,
            padding: "2px 9px",
            borderRadius: 999,
            background: `${STATUS[d.status].color}1a`,
            color: STATUS[d.status].color,
            flex: "0 0 auto",
          }}
        >
          {STATUS[d.status].label}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: SUB, margin: "6px 0 14px" }}>
        {d.audience}
        {d.date ? ` · updated ${d.date}` : ""}
      </div>
      {ready ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {d.downloadDocx && (
            <a
              href={d.downloadDocx}
              style={{
                display: "inline-flex",
                gap: 5,
                padding: "8px 14px",
                borderRadius: 6,
                background: NAVY,
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↓ Word
            </a>
          )}
          {d.downloadHtml && (
            <a
              href={d.downloadHtml}
              style={{
                display: "inline-flex",
                gap: 5,
                padding: "8px 14px",
                borderRadius: 6,
                background: "#fff",
                border: `1px solid ${LINE}`,
                color: INK,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↓ HTML
            </a>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12.5,
            color: SUB,
            background: FILL,
            borderRadius: 8,
            padding: "11px 13px",
          }}
        >
          Not built yet. Use <b style={{ color: INK }}>Approve &amp; Build</b>{" "}
          to create this phase package.
        </div>
      )}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: MUTE,
          borderTop: `1px solid ${LINE}`,
          paddingTop: 12,
        }}
      >
        Changes are handled through phase review so the evidence, approval, and
        latest version stay together.
      </div>
    </div>
  );
}
