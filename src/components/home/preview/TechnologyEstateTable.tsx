"use client";

import { useMemo, useState } from "react";

import { HOME_HEX } from "./visuals/home-chart-kit";
import type { TechRecordType } from "@/lib/home/preview/types";

/**
 * One object type's real, structured record table -- applications, vendor contracts,
 * infrastructure platforms, or data assets/integrations. This is what answers "which data and
 * analytics platform services finance needs, or clinical needs, or population health": the
 * dimension rollup (real counts per businessFunction/serviceCategory/platformType/dataDomain)
 * doubles as both an at-a-glance segmentation and a one-click filter, not a plain dropdown with
 * no sense of scale.
 */
export function TechnologyEstateTable({ recordType }: { recordType: TechRecordType }) {
  const [query, setQuery] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recordType.rows.filter((row) => {
      if (dimensionFilter && recordType.primaryDimension) {
        const value = row[recordType.primaryDimension];
        const bucket = value === null || value === undefined || value === "" ? "(not specified)" : String(value);
        if (bucket !== dimensionFilter) return false;
      }
      if (!q) return true;
      return recordType.columns.some((col) => String(row[col] ?? "").toLowerCase().includes(q));
    });
  }, [recordType, query, dimensionFilter]);

  return (
    <div style={{ padding: "40px 40px 96px" }}>
      <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: HOME_HEX.teal }}>
        Technology estate
      </p>
      <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-body-serif)", fontSize: 26, color: HOME_HEX.textPrimary }}>
        {recordType.label}
      </h2>
      <p style={{ margin: "0 0 20px", fontFamily: "var(--font-body-sans)", fontSize: 14, color: HOME_HEX.textMuted }}>
        {recordType.rows.length} records, real structured fields from the source canonical data -- not derived
        signals.
      </p>

      {recordType.primaryDimension && recordType.dimensionCounts.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px", fontFamily: "var(--font-body-sans)", fontSize: 11, fontWeight: 600, color: HOME_HEX.textDisabled, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            By {recordType.primaryDimension}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <DimensionChip label="All" count={recordType.rows.length} active={dimensionFilter === null} onClick={() => setDimensionFilter(null)} />
            {recordType.dimensionCounts.map((d) => (
              <DimensionChip key={d.value} label={d.value} count={d.count} active={dimensionFilter === d.value} onClick={() => setDimensionFilter(d.value)} />
            ))}
          </div>
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${recordType.label.toLowerCase()}…`}
        aria-label={`Search ${recordType.label}`}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginBottom: 12,
          borderRadius: 6,
          border: `1px solid ${HOME_HEX.border}`,
          fontFamily: "var(--font-body-sans)",
          fontSize: 13.5,
        }}
      />
      <p style={{ margin: "0 0 10px", fontFamily: "var(--font-body-sans)", fontSize: 12, color: HOME_HEX.textDisabled }}>
        {filtered.length} of {recordType.rows.length} shown
      </p>

      <div style={{ overflowX: "auto", border: `1px solid ${HOME_HEX.border}`, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body-sans)", fontSize: 12.5 }}>
          <thead>
            <tr>
              {recordType.columns.map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    padding: "8px 12px",
                    color: HOME_HEX.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    borderBottom: `1px solid ${HOME_HEX.border}`,
                    background: "#FAFAF9",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {recordType.columns.map((col) => (
                  <td key={col} style={{ padding: "7px 12px", whiteSpace: "nowrap", borderBottom: `1px solid ${HOME_HEX.border}`, color: HOME_HEX.textSecondary }}>
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p style={{ padding: 16, fontFamily: "var(--font-body-sans)", fontSize: 13, color: HOME_HEX.textMuted, fontStyle: "italic" }}>
            No records match this search or filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return value;
}

function DimensionChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? HOME_HEX.navy : HOME_HEX.border}`,
        background: active ? HOME_HEX.navy : "#FFFFFF",
        color: active ? "#FFFFFF" : HOME_HEX.textSecondary,
        fontFamily: "var(--font-body-sans)",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: "var(--font-body-mono)", fontSize: 10.5, opacity: 0.8 }}>{count}</span>
    </button>
  );
}
