"use client";

import { useCallback, useEffect, useState } from "react";

import type { TriageRecord } from "@/app/api/admin/context-layer/triage/route";

const DOMAIN_SEGMENTS = [
  { value: "DATA_ANALYTICS", label: "Data & Analytics" },
  { value: "ERP", label: "ERP" },
  { value: "DIGITAL_CX", label: "Digital CX" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "SECURITY_IDENTITY", label: "Security & Identity" },
  { value: "HR_WORKFORCE", label: "HR & Workforce" },
  { value: "COLLABORATION", label: "Collaboration" },
] as const;

interface RowState {
  domainSegment: string;
  businessFunction: string;
  confirming: boolean;
  confirmed: boolean;
  error: string | null;
}

function initRowState(record: TriageRecord): RowState {
  return {
    domainSegment: record.domain_segment ?? "",
    businessFunction: record.business_function ?? "",
    confirming: false,
    confirmed: false,
    error: null,
  };
}

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee7d8",
  fontFamily: "DM Sans, sans-serif",
  fontSize: 14,
  verticalAlign: "top",
};

const headStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #d8d2c4",
  textAlign: "left",
  fontFamily: "DM Sans, sans-serif",
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap",
  color: "#6b665c",
};

export function ClassificationTriageQueue() {
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/context-layer/triage")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ records: TriageRecord[]; total: number }>;
      })
      .then(({ records: fetched }) => {
        if (cancelled) return;
        setRecords(fetched);
        const states: Record<string, RowState> = {};
        for (const r of fetched) {
          states[r.id] = initRowState(r);
        }
        setRowStates(states);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError(
          err instanceof Error ? err.message : "Failed to load triage queue",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? initRowState(records.find((r) => r.id === id)!)), ...patch },
    }));
  }

  async function handleConfirm(record: TriageRecord) {
    const state = rowStates[record.id];
    if (!state) return;
    if (!state.domainSegment) {
      updateRowState(record.id, { error: "Select a domain segment before confirming." });
      return;
    }

    updateRowState(record.id, { confirming: true, error: null });

    const body: Record<string, string> = { domainSegment: state.domainSegment };
    if (state.businessFunction) body.businessFunction = state.businessFunction;

    try {
      const res = await fetch(`/api/admin/context-layer/triage/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        updateRowState(record.id, {
          confirming: false,
          error: data.error ?? `Server error ${res.status}`,
        });
        return;
      }
      updateRowState(record.id, { confirming: false, confirmed: true });
      showToast(`Classified "${record.title}" as ${state.domainSegment}`);
      setTimeout(() => {
        setRecords((prev) => prev.filter((r) => r.id !== record.id));
      }, 800);
    } catch (err: unknown) {
      updateRowState(record.id, {
        confirming: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const visibleRecords = records.filter(
    (r) => !rowStates[r.id]?.confirmed,
  );

  return (
    <div style={{ position: "relative" }}>
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#171717",
            color: "#fff",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            padding: "10px 18px",
            borderRadius: 8,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gap: 8 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: 44,
                background: "#e8e4da",
                borderRadius: 6,
                opacity: 0.5,
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5 } 50% { opacity: 0.25 } }`}</style>
        </div>
      ) : fetchError ? (
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #f5c6c6",
            borderRadius: 8,
            padding: 16,
            fontFamily: "DM Sans, sans-serif",
            color: "#9b1c1c",
          }}
        >
          Failed to load triage queue: {fetchError}
        </div>
      ) : visibleRecords.length === 0 ? (
        <div
          style={{
            background: "#fffdf8",
            border: "1px solid #d8d2c4",
            borderRadius: 8,
            padding: 20,
            fontFamily: "DM Sans, sans-serif",
            color: "#514c43",
          }}
        >
          No records awaiting classification — context layer is fully classified.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              marginBottom: 12,
              color: "#6b665c",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "#c9451e",
                color: "#fff",
                borderRadius: 12,
                padding: "1px 9px",
                fontSize: 12,
                fontWeight: 600,
                marginRight: 8,
              }}
            >
              {visibleRecords.length}
            </span>
            record{visibleRecords.length !== 1 ? "s" : ""} need classification
          </div>
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
              background: "#fffdf8",
              border: "1px solid #d8d2c4",
              borderRadius: 8,
            }}
          >
            <thead>
              <tr style={{ background: "#f4f0e8" }}>
                {[
                  "System / Title",
                  "Type",
                  "Source",
                  "Domain segment",
                  "Business function",
                  "Action",
                ].map((head) => (
                  <th key={head} style={headStyle}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const state = rowStates[record.id];
                if (!state) return null;
                return (
                  <tr
                    key={record.id}
                    style={{
                      opacity: state.confirming ? 0.5 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 500 }}>
                        {record.source_system}
                      </div>
                      <div
                        style={{
                          color: "#6b665c",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {record.title}
                      </div>
                      {record.source_file && (
                        <div
                          style={{
                            color: "#9b9488",
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {record.source_file}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          background: "#f0ece2",
                          borderRadius: 4,
                          padding: "2px 7px",
                          fontSize: 12,
                        }}
                      >
                        {record.record_type}
                      </span>
                      {record.record_subtype && (
                        <div style={{ color: "#9b9488", fontSize: 11, marginTop: 4 }}>
                          {record.record_subtype}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <span style={{ fontSize: 12, color: "#6b665c" }}>
                        {record.source_file ?? record.source_system}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <select
                        value={state.domainSegment}
                        onChange={(e) =>
                          updateRowState(record.id, {
                            domainSegment: e.target.value,
                            error: null,
                          })
                        }
                        disabled={state.confirming}
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: 13,
                          padding: "5px 8px",
                          border: state.error
                            ? "1px solid #c9451e"
                            : "1px solid #d8d2c4",
                          borderRadius: 6,
                          background: "#fff",
                          width: "100%",
                          minWidth: 160,
                        }}
                      >
                        <option value="">Select segment</option>
                        {DOMAIN_SEGMENTS.map((seg) => (
                          <option key={seg.value} value={seg.value}>
                            {seg.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={cellStyle}>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={state.businessFunction}
                        onChange={(e) =>
                          updateRowState(record.id, {
                            businessFunction: e.target.value,
                          })
                        }
                        disabled={state.confirming}
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: 13,
                          padding: "5px 8px",
                          border: "1px solid #d8d2c4",
                          borderRadius: 6,
                          width: "100%",
                          minWidth: 120,
                        }}
                      />
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button
                          onClick={() => handleConfirm(record)}
                          disabled={state.confirming}
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: 13,
                            padding: "6px 14px",
                            border: "1px solid #171717",
                            borderRadius: 6,
                            background: state.confirming ? "#e8e4da" : "#171717",
                            color: state.confirming ? "#6b665c" : "#fff",
                            cursor: state.confirming ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {state.confirming ? "Confirming…" : "Confirm"}
                        </button>
                        {state.error && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#c9451e",
                              maxWidth: 160,
                            }}
                          >
                            {state.error}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
