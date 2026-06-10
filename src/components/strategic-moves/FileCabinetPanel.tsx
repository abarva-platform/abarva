"use client";

// ── Moves File Cabinet ────────────────────────────────────────────────────────
// The durable Artifact Vault view for a Move. Every artifact (generated
// deliverable, uploaded evidence, template, session output, approval packet,
// historical version) registered in move_artifacts (Azure Blob + Postgres) is
// listed here — organized by family, filterable, with open/download + version
// lineage. Reads /api/v1/programs/:id/artifacts (no browser-only files).

import { useCallback, useEffect, useMemo, useState } from "react";

interface Artifact {
  artifactId: string;
  artifactType: string;
  family: string;
  title: string;
  phase: number | null;
  fileFormat: string;
  fileName: string;
  version: number;
  status: string;
  lifecycleState: string;
  qualityScore: number | null;
  unsupportedClaims: number;
  generatedBy: string | null;
  createdAt: string;
  fileSize: number | null;
  stored: string | null;
  openItems: string[];
  downloadUrl: string;
}

const FAMILIES: { key: string; label: string }[] = [
  { key: "generated_deliverable", label: "Deliverables" },
  { key: "session_artifact", label: "Session Artifacts" },
  { key: "uploaded_evidence", label: "Uploads & Evidence" },
  { key: "template", label: "Templates" },
  { key: "approval_artifact", label: "Approvals" },
  { key: "historical_version", label: "Historical" },
];

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  board_ready: { bg: "#E6F4EA", fg: "#1E7E34" },
  approved: { bg: "#E6F4EA", fg: "#1E7E34" },
  aligned: { bg: "#E6F0FB", fg: "#1B2B5C" },
  review_required: { bg: "#FFF4E5", fg: "#B26A00" },
  preliminary: { bg: "#FFF4E5", fg: "#B26A00" },
  client_to_complete: { bg: "#FFF4E5", fg: "#B26A00" },
  evidence_missing: { bg: "#FDECEA", fg: "#B71C1C" },
  legal_review_required: { bg: "#FDECEA", fg: "#B71C1C" },
  blocked: { bg: "#FDECEA", fg: "#B71C1C" },
  draft: { bg: "#EEF0F3", fg: "#5A6472" },
  superseded: { bg: "#EEF0F3", fg: "#9AA3B2" },
  retired: { bg: "#EEF0F3", fg: "#9AA3B2" },
};

function fmtBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function StatusChip({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: "#EEF0F3", fg: "#5A6472" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 10,
        fontSize: 10.5,
        fontWeight: 600,
        background: tone.bg,
        color: tone.fg,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ArtifactRow({ a }: { a: Artifact }) {
  const stored = a.stored === "azure_blob";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "11px 14px",
        borderBottom: "1px solid #EEF0F3",
        opacity: a.lifecycleState === "current" ? 1 : 0.62,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1A18",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {a.title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#5A6472",
              textTransform: "uppercase",
              background: "#F4F5F7",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            {a.fileFormat}
          </span>
          <span style={{ fontSize: 11, color: "#9AA3B2" }}>v{a.version}</span>
          <StatusChip status={a.status} />
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#9AA3B2",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {a.phase != null && <span>Phase {a.phase}</span>}
          {a.qualityScore != null && <span>Quality {a.qualityScore}/100</span>}
          {a.unsupportedClaims > 0 && (
            <span style={{ color: "#B26A00" }}>
              {a.unsupportedClaims} unsupported
            </span>
          )}
          <span>{fmtBytes(a.fileSize)}</span>
          <span>{fmtDate(a.createdAt)}</span>
          <span
            title={
              stored
                ? "Stored in Azure Blob"
                : "Storage unconfigured — registry only"
            }
            style={{ color: stored ? "#1E7E34" : "#B71C1C", fontWeight: 600 }}
          >
            {stored ? "● Blob" : "○ no blob"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <a
          href={`${a.downloadUrl}?inline=1`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#1B2B5C",
            textDecoration: "none",
            border: "1px solid #D5DAE2",
            borderRadius: 5,
            padding: "5px 11px",
            whiteSpace: "nowrap",
          }}
        >
          Open
        </a>
        <a
          href={a.downloadUrl}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#fff",
            background: "#1B2B5C",
            textDecoration: "none",
            borderRadius: 5,
            padding: "5px 11px",
            whiteSpace: "nowrap",
          }}
        >
          Download
        </a>
      </div>
    </div>
  );
}

export function FileCabinetPanel({ moveId }: { moveId: string }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<string>("all");
  const [showSuperseded, setShowSuperseded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/v1/programs/${moveId}/artifacts`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setArtifacts(Array.isArray(j.artifacts) ? j.artifacts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, [moveId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      artifacts
        .filter((a) => showSuperseded || a.lifecycleState === "current")
        .filter((a) => family === "all" || a.family === family),
    [artifacts, family, showSuperseded],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of artifacts) {
      if (!showSuperseded && a.lifecycleState !== "current") continue;
      m[a.family] = (m[a.family] ?? 0) + 1;
    }
    return m;
  }, [artifacts, showSuperseded]);

  const grouped = useMemo(() => {
    const m = new Map<string, Artifact[]>();
    for (const a of visible) {
      const arr = m.get(a.family) ?? [];
      arr.push(a);
      m.set(a.family, arr);
    }
    return m;
  }, [visible]);

  const totalCurrent = artifacts.filter(
    (a) => a.lifecycleState === "current",
  ).length;

  return (
    <div style={{ padding: "0 4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              fontWeight: 400,
              color: "#1A1A18",
              margin: 0,
            }}
          >
            File Cabinet
          </h2>
          <p style={{ fontSize: 12, color: "#9AA3B2", margin: "3px 0 0" }}>
            Every artifact for this Move — durably stored in Azure Blob,
            versioned, governed. {totalCurrent} current.
          </p>
        </div>
        <button
          onClick={() => void load()}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#5A6472",
            background: "transparent",
            border: "1px solid #D5DAE2",
            borderRadius: 5,
            padding: "5px 11px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Family filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          margin: "12px 0 6px",
        }}
      >
        <FilterChip
          label={`All (${visible.length})`}
          active={family === "all"}
          onClick={() => setFamily("all")}
        />
        {FAMILIES.filter((f) => (counts[f.key] ?? 0) > 0).map((f) => (
          <FilterChip
            key={f.key}
            label={`${f.label} (${counts[f.key] ?? 0})`}
            active={family === f.key}
            onClick={() => setFamily(f.key)}
          />
        ))}
        <label
          style={{
            marginLeft: "auto",
            fontSize: 11.5,
            color: "#5A6472",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showSuperseded}
            onChange={(e) => setShowSuperseded(e.target.checked)}
          />
          Show version history
        </label>
      </div>

      {loading && (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            fontSize: 12,
            color: "#9AA3B2",
          }}
        >
          Loading the cabinet…
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: "20px 0", fontSize: 12, color: "#B71C1C" }}>
          Could not load artifacts: {error}
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            fontSize: 12.5,
            color: "#9AA3B2",
            border: "1px dashed #D5DAE2",
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          No artifacts yet. Generated deliverables, uploads, session outputs and
          approval packets will appear here automatically once produced.
        </div>
      )}

      {!loading &&
        !error &&
        Array.from(grouped.entries()).map(([fam, rows]) => {
          const meta = FAMILIES.find((f) => f.key === fam);
          return (
            <section key={fam} style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5A6472",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                }}
              >
                {meta?.label ?? fam} · {rows.length}
              </div>
              <div
                style={{
                  border: "1px solid #EEF0F3",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {rows.map((a) => (
                  <ArtifactRow key={a.artifactId} a={a} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        color: active ? "#fff" : "#5A6472",
        background: active ? "#1B2B5C" : "transparent",
        border: `1px solid ${active ? "#1B2B5C" : "#D5DAE2"}`,
        borderRadius: 14,
        padding: "4px 12px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
