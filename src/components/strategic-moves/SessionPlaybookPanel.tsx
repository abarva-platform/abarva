"use client";

// ── Move Sessions / P3 Solution Design Workbench (PR-5/PR-6) ───────────────────
// Renders the current phase's facilitated-session playbook — discussion guides,
// frameworks, capture templates, homework, alignment gates — and lets the team
// generate the Design Session Pack into the File Cabinet. For an AI-PDLC Move at
// P3 this is the 8-session Solution Design Workbench.

import { useCallback, useEffect, useState } from "react";

interface Framework {
  id: string;
  label: string;
  purpose: string;
  dimensions: string[];
}
interface Gate {
  criterion: string;
  alignedBy: string;
  severity: "hard" | "soft";
}
interface Session {
  id: string;
  label: string;
  objective: string;
  participants: string[];
  discussionGuide: string[];
  frameworks: Framework[];
  captureTemplate: string[];
  homework: string[];
  gate: Gate;
  feedsDeliverables: string[];
}
interface Playbook {
  phase: number;
  label: string;
  intent: string;
  sessions: Session[];
}

const card: React.CSSProperties = {
  border: "1px solid #EEF0F3",
  borderRadius: 10,
  background: "#fff",
  padding: "16px 18px",
  marginBottom: 14,
};
const h4: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#5A6472",
  margin: "14px 0 4px",
};

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      style={{
        margin: "4px 0",
        paddingLeft: 20,
        fontSize: 13,
        color: "#37414f",
      }}
    >
      {items.map((x, i) => (
        <li key={i} style={{ margin: "3px 0" }}>
          {x}
        </li>
      ))}
    </Tag>
  );
}

function SessionCard({ s, n }: { s: Session; n: number }) {
  const hard = s.gate.severity === "hard";
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 17 }}>
          {s.label}
        </span>
        <span style={{ fontSize: 11, color: "#9AA3B2" }}>#{n}</span>
      </div>
      <p style={{ fontSize: 14, margin: "4px 0 8px" }}>{s.objective}</p>
      <div style={{ fontSize: 12.5, color: "#37414f" }}>
        <strong>In the room:</strong> {s.participants.join(" · ")}
      </div>

      <div style={h4}>Pre-session homework</div>
      <List items={s.homework} />
      <div style={h4}>Discussion guide</div>
      <List items={s.discussionGuide} ordered />
      <div style={h4}>Frameworks to apply</div>
      {s.frameworks.map((f) => (
        <div key={f.id} style={{ margin: "6px 0 10px" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
          <div style={{ fontSize: 12, color: "#9AA3B2", marginBottom: 4 }}>
            {f.purpose}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                <tr>
                  {f.dimensions.map((d) => (
                    <th
                      key={d}
                      style={{
                        border: "1px solid #E3E6EB",
                        background: "#F4F5F7",
                        padding: "5px 9px",
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
                <tr>
                  {f.dimensions.map((d) => (
                    <td
                      key={d}
                      style={{
                        border: "1px solid #E3E6EB",
                        padding: "5px 9px",
                        color: "#C4CAD2",
                      }}
                    >
                      —
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div style={h4}>Capture template</div>
      <List items={s.captureTemplate} />
      <div
        style={{
          marginTop: 12,
          padding: "9px 13px",
          borderRadius: 6,
          fontSize: 13,
          background: hard ? "#FDECEA" : "#FFF4E5",
          color: hard ? "#7A1D12" : "#7A4D00",
        }}
      >
        <strong>Alignment gate ({s.gate.severity}):</strong> {s.gate.criterion}{" "}
        <span style={{ color: "#9AA3B2" }}>— signed by {s.gate.alignedBy}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, color: "#9AA3B2" }}>
        Feeds: {s.feedsDeliverables.map((d) => d.replace(/_/g, " ")).join(", ")}
      </div>
    </div>
  );
}

export function SessionPlaybookPanel({
  moveId,
  phase,
  readOnly = false,
}: {
  moveId: string;
  phase?: number;
  readOnly?: boolean;
}) {
  const [pb, setPb] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseLabel, setPhaseLabel] = useState<string>("");
  const [genState, setGenState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [genMsg, setGenMsg] = useState<string>("");
  const [packageState, setPackageState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [packageMsg, setPackageMsg] = useState<string>("");

  const [phaseNum, setPhaseNum] = useState<number | null>(null);
  const phaseQuery = typeof phase === "number" ? `?phase=${phase}` : "";

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/programs/${moveId}/playbook${phaseQuery}`, {
        credentials: "include",
      });
      const j = await r.json();
      if (!isActive()) return;
      setPb(j.playbook ?? null);
      setPhaseNum(typeof j.phase === "number" ? j.phase : null);
      setPhaseLabel(j.playbook?.label ?? "");
    } catch {
      if (!isActive()) return;
      setPb(null);
    } finally {
      if (!isActive()) return;
      setLoading(false);
    }
  }, [moveId, phaseQuery]);

  useEffect(() => {
    let active = true;
    void load(() => active);
    return () => {
      active = false;
    };
  }, [load]);

  const generate = useCallback(async () => {
    setGenState("running");
    setGenMsg("");
    try {
      const r = await fetch(`/api/v1/programs/${moveId}/playbook${phaseQuery}`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setGenState("done");
      setGenMsg(
        `Saved to the File Cabinet — ${j.sessionCount} sessions${j.blobStored ? " (stored in Azure Blob)" : ""}.`,
      );
    } catch (e) {
      setGenState("error");
      setGenMsg(e instanceof Error ? e.message : "generation failed");
    }
  }, [moveId, phaseQuery]);

  const generatePhasePackage = useCallback(async () => {
    setPackageState("running");
    setPackageMsg("");
    try {
      const r = await fetch(
        `/api/v1/programs/${moveId}/phase-success-package${phaseQuery}`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setPackageState("done");
      const reused = Array.isArray(j.packages)
        ? j.packages.filter((p: { reusedExisting?: boolean }) => p.reusedExisting)
            .length
        : 0;
      setPackageMsg(
        `Saved ${j.packageCount ?? 0} artifacts: Phase Execution and Next Phase Readiness${reused ? ` (${reused} unchanged)` : ""}.`,
      );
    } catch (e) {
      setPackageState("error");
      setPackageMsg(e instanceof Error ? e.message : "generation failed");
    }
  }, [moveId, phaseQuery]);

  return (
    <div style={{ padding: "0 4px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              fontWeight: 400,
              margin: 0,
            }}
          >
            {pb && pb.sessions.length > 1
              ? "Solution Design Workbench"
              : "Phase Sessions"}
            {phaseLabel ? ` · ${phaseLabel}` : ""}
          </h2>
          <p
            style={{
              fontSize: 12.5,
              color: "#9AA3B2",
              margin: "3px 0 0",
              maxWidth: 620,
            }}
          >
            {pb?.intent ??
              "Facilitated working sessions for this phase — discussion guides, frameworks, capture templates, and alignment gates."}
          </p>
        </div>
        {pb && !readOnly ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => void generatePhasePackage()}
              disabled={packageState === "running"}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background:
                  packageState === "running" ? "#9AA3B2" : "#0F5132",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: packageState === "running" ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {packageState === "running"
                ? "Generating…"
                : "Generate Execution & Readiness"}
            </button>
            <button
              onClick={() => void generate()}
              disabled={genState === "running"}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: genState === "running" ? "#9AA3B2" : "#1B2B5C",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: genState === "running" ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {genState === "running" ? "Generating…" : "Generate Session Pack"}
            </button>
          </div>
        ) : null}
      </div>
      {(genMsg || packageMsg) && (
        <div
          style={{
            margin: "10px 0",
            fontSize: 12.5,
            color:
              genState === "error" || packageState === "error"
                ? "#B71C1C"
                : "#1E7E34",
          }}
        >
          {packageMsg || genMsg}
        </div>
      )}

      {loading && (
        <div
          style={{
            padding: "30px 0",
            textAlign: "center",
            fontSize: 12,
            color: "#9AA3B2",
          }}
        >
          Loading sessions…
        </div>
      )}
      {!loading && !pb && (
        <div
          style={{
            padding: "26px 16px",
            textAlign: "center",
            fontSize: 12.5,
            color: "#9AA3B2",
            border: "1px dashed #D5DAE2",
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          {phaseNum === 0
            ? "Facilitated sessions begin at P1 Charter. Advance this Move to P1 to see its session playbook (discussion guides, frameworks, capture templates, and alignment gates)."
            : "No facilitated-session playbook for this phase yet."}
        </div>
      )}
      {!loading &&
        pb &&
        pb.sessions.map((s, i) => <SessionCard key={s.id} s={s} n={i + 1} />)}
    </div>
  );
}
